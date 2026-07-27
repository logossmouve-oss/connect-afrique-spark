import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import TinderCard from "react-tinder-card";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SiteHeader } from "@/components/monwe/SiteHeader";
import { computeCompatibility } from "@/lib/compat.functions";
import { usePremium } from "@/hooks/use-premium";

export const Route = createFileRoute("/_authenticated/decouvrir")({
  head: () => ({ meta: [{ title: "Découvrir — MonWé" }, { name: "robots", content: "noindex" }] }),
  component: Decouvrir,
});

type Profile = {
  user_id: string; pseudo: string | null; monwe_code: string | null; bio: string | null;
  country: string | null; city: string | null; interests: string[]; goals: string[]; languages: string[];
  birthdate: string | null; prompts?: { question: string; answer: string }[] | null;
};
type Action = { profile: Profile; kind: "like" | "super" | "pass"; likeId?: string };

function age(b: string | null) {
  if (!b) return null;
  const d = new Date(b);
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
}

function Decouvrir() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<Action[]>([]);
  const [superToday, setSuperToday] = useState(0);
  const [scores, setScores] = useState<Record<string, { score: number; rationale: string | null }>>({});
  const compat = useServerFn(computeCompatibility);
  const cardRefs = useRef<Record<string, any>>({});
  const { isPremium } = usePremium();
  const [showFilters, setShowFilters] = useState(false);
  const [fGoal, setFGoal] = useState<string>("");
  const [fCountry, setFCountry] = useState<string>("");
  const [fCity, setFCity] = useState<string>("");
  const [fAgeMin, setFAgeMin] = useState<number>(18);
  const [fAgeMax, setFAgeMax] = useState<number>(80);
  const [passport, setPassport] = useState<{ country: string | null; city: string | null } | null>(null);

  useEffect(() => { load(); }, [fGoal, fCountry, fCity, fAgeMin, fAgeMax]);

  async function load() {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setMe(u.user.id);

    const { data: mine } = await supabase.from("profiles").select("onboarded,country,city,discover_country,discover_city").eq("user_id", u.user.id).maybeSingle();
    if (!mine?.onboarded) { navigate({ to: "/onboarding" }); return; }

    const defaultCountry = (mine.discover_country || mine.country || "").trim();
    const defaultCity = (mine.discover_city || mine.city || "").trim();
    const isPassport = !!(mine.discover_country || mine.discover_city);
    setPassport(isPassport ? { country: mine.discover_country, city: mine.discover_city } : null);
    if (!isPremium) {
      if (!fCountry && defaultCountry) setFCountry(defaultCountry);
      if (!fCity && defaultCity) setFCity(defaultCity);
    }

    const { data: liked } = await supabase.from("likes").select("to_user").eq("from_user", u.user.id);
    const { data: blocked } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", u.user.id);
    const excluded = new Set<string>([u.user.id, ...(liked?.map((l) => l.to_user) ?? []), ...(blocked?.map((b) => b.blocked_id) ?? [])]);

    const { data } = await supabase.from("profiles").select("user_id,pseudo,monwe_code,bio,country,city,interests,goals,languages,birthdate,prompts")
      .eq("onboarded", true).limit(50);
    let list = (data ?? []).filter((p) => !excluded.has(p.user_id)) as Profile[];

    const countryFilter = (isPremium ? fCountry : (fCountry || defaultCountry)).trim().toLowerCase();
    const cityFilter = (isPremium ? fCity : (fCity || defaultCity)).trim().toLowerCase();
    if (countryFilter) list = list.filter((p) => (p.country ?? "").toLowerCase().includes(countryFilter));
    if (cityFilter) list = list.filter((p) => (p.city ?? "").toLowerCase().includes(cityFilter));
    if (fGoal) list = list.filter((p) => p.goals?.includes(fGoal));
    list = list.filter((p) => {
      const a = age(p.birthdate);
      if (a === null) return true;
      return a >= fAgeMin && a <= fAgeMax;
    });

    setProfiles(list);

    const today = new Date().toISOString().slice(0, 10);
    const { data: supers } = await supabase.from("likes").select("id, created_at").eq("from_user", u.user.id).eq("is_super", true).gte("created_at", `${today}T00:00:00Z`);
    setSuperToday(supers?.length ?? 0);
    setLoading(false);
  }

  async function act(profile: Profile, kind: "like" | "super" | "pass") {
    if (!me) return;
    let likeId: string | undefined;
    if (kind === "super" && superToday >= 1) {
      toast.error("Ton Super Like quotidien est déjà utilisé — reviens demain ✨");
      return;
    }
    if (kind !== "pass") {
      const { data, error } = await supabase.from("likes")
        .insert({ from_user: me, to_user: profile.user_id, is_super: kind === "super" })
        .select("id").maybeSingle();
      if (error && !error.message.includes("duplicate")) { toast.error(error.message); return; }
      likeId = data?.id;
      if (kind === "super") { setSuperToday((n) => n + 1); toast.success("Super Like envoyé ⭐"); }
      else toast.success("Envoyé ✨");
    }
    setHistory((h) => [...h, { profile, kind, likeId }]);
    setProfiles((list) => list.filter((p) => p.user_id !== profile.user_id));
  }

  async function rewind() {
    const last = history[history.length - 1];
    if (!last) return;
    if (last.likeId) await supabase.from("likes").delete().eq("id", last.likeId);
    if (last.kind === "super") setSuperToday((n) => Math.max(0, n - 1));
    setProfiles((list) => [last.profile, ...list]);
    setHistory((h) => h.slice(0, -1));
    toast("Retour arrière");
  }

  function triggerSwipe(userId: string, dir: "left" | "right" | "up") {
    const ref = cardRefs.current[userId];
    if (ref?.swipe) ref.swipe(dir); else {
      const p = profiles.find((x) => x.user_id === userId);
      if (p) act(p, dir === "left" ? "pass" : dir === "up" ? "super" : "like");
    }
  }

  const top = profiles[0];
  useEffect(() => {
    if (!top || !me || scores[top.user_id]) return;
    compat({ data: { targetUserId: top.user_id } })
      .then((r) => setScores((s) => ({ ...s, [top.user_id]: r })))
      .catch(() => {});
  }, [top?.user_id, me]);

  const visible = useMemo(() => profiles.slice(0, 3).reverse(), [profiles]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-3xl font-bold">Découvrir</h1>
        <p className="mt-1 text-sm text-muted-foreground">Chaque profil est anonyme. Un match ouvre une conversation.</p>

        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Super Like : {Math.max(0, 1 - superToday)}/1 aujourd'hui</span>
          <span>·</span>
          <button onClick={rewind} disabled={history.length === 0} className="underline disabled:opacity-40">Retour</button>
          <span>·</span>
          <button onClick={() => setShowFilters((s) => !s)} className="underline">
            Filtres{isPremium ? "" : " 🔒"}
          </button>
          {passport && (
            <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              🛂 Passport {passport.city ?? passport.country}
            </span>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 rounded-2xl border border-border bg-card p-4">
            {!isPremium ? (
              <div className="text-center">
                <div className="text-sm">Les filtres avancés sont réservés à <span className="font-semibold">Premium</span>.</div>
                <div className="mt-1 text-xs text-muted-foreground">Par défaut on te montre les profils près de chez toi.</div>
                <Button asChild size="sm" className="mt-3 rounded-full"><Link to="/premium">Passer Premium</Link></Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs">
                  <span className="text-muted-foreground">Objectif</span>
                  <select value={fGoal} onChange={(e) => setFGoal(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1 text-sm">
                    <option value="">Tous</option>
                    <option value="amour">Amour</option>
                    <option value="amitie">Amitié</option>
                    <option value="pro">Pro</option>
                  </select>
                </label>
                <label className="text-xs">
                  <span className="text-muted-foreground">Pays</span>
                  <input value={fCountry} onChange={(e) => setFCountry(e.target.value)} placeholder="ex. Sénégal" className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1 text-sm" />
                </label>
                <label className="text-xs">
                  <span className="text-muted-foreground">Ville</span>
                  <input value={fCity} onChange={(e) => setFCity(e.target.value)} placeholder="ex. Dakar" className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1 text-sm" />
                </label>
                <label className="text-xs">
                  <span className="text-muted-foreground">Âge min : {fAgeMin}</span>
                  <input type="range" min={18} max={80} value={fAgeMin} onChange={(e) => setFAgeMin(+e.target.value)} className="mt-1 w-full" />
                </label>
                <label className="text-xs sm:col-span-2">
                  <span className="text-muted-foreground">Âge max : {fAgeMax}</span>
                  <input type="range" min={18} max={80} value={fAgeMax} onChange={(e) => setFAgeMax(+e.target.value)} className="mt-1 w-full" />
                </label>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="mt-16 text-center text-muted-foreground">Chargement…</div>
        ) : !top ? (
          <div className="mt-16 rounded-3xl border border-border bg-card p-8 text-center">
            <div className="text-5xl">🌅</div>
            <h2 className="mt-4 font-display text-xl font-semibold">Plus personne pour l'instant</h2>
            <p className="mt-2 text-sm text-muted-foreground">Reviens bientôt — de nouveaux profils rejoignent MonWé chaque jour.</p>
            <div className="mt-4 flex justify-center gap-2">
              <Button onClick={load} className="rounded-full">Rafraîchir</Button>
              <Button asChild variant="outline" className="rounded-full"><Link to="/messages">Voir mes messages</Link></Button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative mt-8 h-[520px]">
              {visible.map((p) => {
                const sc = scores[p.user_id];
                return (
                  <TinderCard
                    key={p.user_id}
                    ref={(r: any) => { if (r) cardRefs.current[p.user_id] = r; }}
                    onSwipe={(dir) => act(p, dir === "left" ? "pass" : dir === "up" ? "super" : "like")}
                    preventSwipe={["down"]}
                    className="absolute inset-0"
                  >
                    <article className="h-full rounded-3xl border border-border bg-card p-6 shadow-warm select-none">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-display text-2xl font-bold">{p.pseudo ?? "Anonyme"}{age(p.birthdate) ? `, ${age(p.birthdate)}` : ""}</div>
                          <div className="text-sm text-muted-foreground">{[p.city, p.country].filter(Boolean).join(", ")}</div>
                        </div>
                        <span className="monwe-chip">{p.monwe_code}</span>
                      </div>
                      {sc && (
                        <div className="mt-3 rounded-xl bg-primary/10 p-3 text-sm">
                          <div className="font-semibold text-primary">✨ Compatibilité {sc.score}%</div>
                          {sc.rationale && <div className="mt-1 text-xs text-muted-foreground">{sc.rationale}</div>}
                        </div>
                      )}
                      {p.bio && <p className="mt-4 text-sm">{p.bio}</p>}
                      {p.prompts && p.prompts.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {p.prompts.slice(0, 2).map((pr, i) => (
                            <div key={i} className="rounded-xl border border-border/60 p-3">
                              <div className="text-xs font-medium text-muted-foreground">{pr.question}</div>
                              <div className="mt-1 text-sm">{pr.answer}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {p.goals.map((g) => <Badge key={g}>{g}</Badge>)}
                        {p.interests.slice(0, 6).map((i) => <Badge key={i} variant="outline">{i}</Badge>)}
                      </div>
                    </article>
                  </TinderCard>
                );
              })}
            </div>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="outline" size="lg" onClick={() => triggerSwipe(top.user_id, "left")} className="h-14 w-14 rounded-full p-0 text-xl">✕</Button>
              <Button variant="outline" size="lg" onClick={() => triggerSwipe(top.user_id, "up")} disabled={superToday >= 1} className="h-14 w-14 rounded-full p-0 text-xl">⭐</Button>
              <Button size="lg" onClick={() => triggerSwipe(top.user_id, "right")} className="h-14 w-14 rounded-full p-0 text-xl">♥</Button>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">Glisse à droite pour aimer, à gauche pour passer, vers le haut pour Super Like ⭐</p>
          </>
        )}
      </main>
    </div>
  );
}
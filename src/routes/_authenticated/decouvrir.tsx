import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SiteHeader } from "@/components/monwe/SiteHeader";

export const Route = createFileRoute("/_authenticated/decouvrir")({
  head: () => ({ meta: [{ title: "Découvrir — MonWé" }, { name: "robots", content: "noindex" }] }),
  component: Decouvrir,
});

type Profile = {
  user_id: string; pseudo: string | null; monwe_code: string | null; bio: string | null;
  country: string | null; city: string | null; interests: string[]; goals: string[]; languages: string[];
  birthdate: string | null;
};

function age(b: string | null) {
  if (!b) return null;
  const d = new Date(b);
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
}

function Decouvrir() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setMe(u.user.id);

    const { data: mine } = await supabase.from("profiles").select("onboarded").eq("user_id", u.user.id).maybeSingle();
    if (!mine?.onboarded) { navigate({ to: "/onboarding" }); return; }

    const { data: liked } = await supabase.from("likes").select("to_user").eq("from_user", u.user.id);
    const { data: blocked } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", u.user.id);
    const excluded = new Set<string>([u.user.id, ...(liked?.map((l) => l.to_user) ?? []), ...(blocked?.map((b) => b.blocked_id) ?? [])]);

    const { data } = await supabase.from("profiles").select("user_id,pseudo,monwe_code,bio,country,city,interests,goals,languages,birthdate")
      .eq("onboarded", true).limit(50);
    setProfiles((data ?? []).filter((p) => !excluded.has(p.user_id)) as Profile[]);
    setIdx(0);
    setLoading(false);
  }

  async function act(kind: "like" | "pass") {
    const p = profiles[idx];
    if (!p || !me) return;
    if (kind === "like") {
      const { error } = await supabase.from("likes").insert({ from_user: me, to_user: p.user_id });
      if (error && !error.message.includes("duplicate")) toast.error(error.message);
      else toast.success("Envoyé ✨");
    }
    setIdx(idx + 1);
  }

  const current = profiles[idx];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-3xl font-bold">Découvrir</h1>
        <p className="mt-1 text-sm text-muted-foreground">Chaque profil est anonyme. Un match ouvre une conversation.</p>

        {loading ? (
          <div className="mt-16 text-center text-muted-foreground">Chargement…</div>
        ) : !current ? (
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
          <article className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-warm">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display text-2xl font-bold">{current.pseudo ?? "Anonyme"}{age(current.birthdate) ? `, ${age(current.birthdate)}` : ""}</div>
                <div className="text-sm text-muted-foreground">{[current.city, current.country].filter(Boolean).join(", ")}</div>
              </div>
              <span className="monwe-chip">{current.monwe_code}</span>
            </div>
            {current.bio && <p className="mt-4 text-sm">{current.bio}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {current.goals.map((g) => <Badge key={g}>{g}</Badge>)}
              {current.interests.slice(0, 6).map((i) => <Badge key={i} variant="outline">{i}</Badge>)}
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => act("pass")} className="h-12 flex-1 rounded-full">Passer</Button>
              <Button onClick={() => act("like")} className="h-12 flex-1 rounded-full">J'aime ✨</Button>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
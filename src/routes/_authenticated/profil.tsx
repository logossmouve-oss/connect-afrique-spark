import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { SiteHeader } from "@/components/monwe/SiteHeader";

const PROMPT_POOL = [
  "Ce qui me fait vibrer…",
  "Un dimanche parfait pour moi…",
  "Je ris fort quand…",
  "Mon rêve un peu fou…",
  "Ce que je cherche vraiment…",
  "Le plat qui me rappelle chez moi…",
  "Un truc que peu de gens savent sur moi…",
];
type Prompt = { question: string; answer: string };

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({ meta: [{ title: "Mon profil — MonWé" }, { name: "robots", content: "noindex" }] }),
  component: Profil,
});

function Profil() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("profiles").select("*").eq("user_id", u.user.id).maybeSingle();
      setProfile(data);
      if (data?.photo_url) {
        const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(data.photo_url, 3600);
        setPhotoUrl(signed?.signedUrl ?? null);
      }
    })();
  }, []);

  async function save() {
    if (!profile) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      pseudo: profile.pseudo, real_name: profile.real_name, bio: profile.bio,
      country: profile.country, city: profile.city,
      discover_country: profile.discover_country, discover_city: profile.discover_city,
      photo_blurred: profile.photo_blurred,
      prompts: profile.prompts ?? [],
    }).eq("user_id", profile.user_id);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Profil mis à jour");
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    const path = `${profile.user_id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { setUploading(false); return toast.error(error.message); }
    await supabase.from("profiles").update({ photo_url: path }).eq("user_id", profile.user_id);
    setProfile({ ...profile, photo_url: path });
    const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
    setPhotoUrl(signed?.signedUrl ?? null);
    setUploading(false);
    toast.success("Photo mise à jour");
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (!profile) return <div className="min-h-screen bg-background"><SiteHeader /><div className="p-8 text-muted-foreground">Chargement…</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="flex items-center justify-between">
          <span className="monwe-chip">Code · {profile.monwe_code}</span>
          <Button variant="ghost" onClick={signOut}>Se déconnecter</Button>
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold">Mon profil</h1>

        <div className="mt-8 space-y-6">
          <div>
            <Label>Photo</Label>
            <div className="mt-2 flex items-center gap-4">
              <div className={`h-20 w-20 overflow-hidden rounded-full bg-muted flex items-center justify-center text-muted-foreground ${profile.photo_blurred && photoUrl ? "blur-md" : ""}`}>
                {photoUrl ? <img src={photoUrl} alt="Avatar" className="h-full w-full object-cover" /> : "?"}
              </div>
              <Input type="file" accept="image/*" onChange={uploadPhoto} disabled={uploading} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <div className="font-semibold">Photo floutée par défaut</div>
              <div className="text-sm text-muted-foreground">Rester anonyme jusqu'à la révélation</div>
            </div>
            <Switch checked={profile.photo_blurred} onCheckedChange={(v) => setProfile({ ...profile, photo_blurred: v })} />
          </div>

          <div>
            <Label htmlFor="pseudo">Pseudo</Label>
            <Input id="pseudo" value={profile.pseudo ?? ""} onChange={(e) => setProfile({ ...profile, pseudo: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="rn">Vrai prénom (masqué jusqu'à révélation)</Label>
            <Input id="rn" value={profile.real_name ?? ""} onChange={(e) => setProfile({ ...profile, real_name: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Pays</Label><Input value={profile.country ?? ""} onChange={(e) => setProfile({ ...profile, country: e.target.value })} /></div>
            <div><Label>Ville</Label><Input value={profile.city ?? ""} onChange={(e) => setProfile({ ...profile, city: e.target.value })} /></div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display font-semibold">🛂 Mode Passport</div>
                <div className="text-sm text-muted-foreground">Découvre des profils dans une autre ville sans bouger.</div>
              </div>
            </div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Pays de découverte</Label>
                <Input value={profile.discover_country ?? ""} placeholder={profile.country ?? "ex. Côte d'Ivoire"}
                  onChange={(e) => setProfile({ ...profile, discover_country: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Ville de découverte</Label>
                <Input value={profile.discover_city ?? ""} placeholder={profile.city ?? "ex. Abidjan"}
                  onChange={(e) => setProfile({ ...profile, discover_city: e.target.value })} />
              </div>
            </div>
            <button type="button" className="mt-3 text-xs text-muted-foreground underline"
              onClick={() => setProfile({ ...profile, discover_country: "", discover_city: "" })}>
              Revenir à ma localisation réelle
            </button>
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={profile.bio ?? ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={4} />
          </div>

          <div className="flex flex-wrap gap-2">
            {(profile.goals ?? []).map((g: string) => <Badge key={g}>{g}</Badge>)}
            {(profile.interests ?? []).map((i: string) => <Badge key={i} variant="outline">{i}</Badge>)}
          </div>

          <div>
            <Label>Icebreakers</Label>
            <p className="text-xs text-muted-foreground">Ce que les autres voient sur ton profil pour briser la glace.</p>
            <div className="mt-2 space-y-3">
              {((profile.prompts ?? []) as Prompt[]).map((p, i) => (
                <div key={i} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{p.question}</span>
                    <button type="button" className="text-xs text-muted-foreground underline"
                      onClick={() => setProfile({ ...profile, prompts: (profile.prompts as Prompt[]).filter((_: Prompt, j: number) => j !== i) })}>Retirer</button>
                  </div>
                  <Textarea rows={2} className="mt-2" value={p.answer}
                    onChange={(e) => setProfile({ ...profile, prompts: (profile.prompts as Prompt[]).map((x: Prompt, j: number) => j === i ? { ...x, answer: e.target.value } : x) })} />
                </div>
              ))}
              {((profile.prompts ?? []) as Prompt[]).length < 3 && (
                <div className="flex flex-wrap gap-2">
                  {PROMPT_POOL.filter((q) => !((profile.prompts ?? []) as Prompt[]).some((p) => p.question === q)).map((q) => (
                    <Badge key={q} variant="outline" className="cursor-pointer"
                      onClick={() => setProfile({ ...profile, prompts: [...((profile.prompts ?? []) as Prompt[]), { question: q, answer: "" }] })}>+ {q}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={save} disabled={loading} className="rounded-full">{loading ? "…" : "Enregistrer"}</Button>
            <Button asChild variant="outline" className="rounded-full"><Link to="/onboarding">Refaire l'onboarding</Link></Button>
          </div>
        </div>
      </main>
    </div>
  );
}
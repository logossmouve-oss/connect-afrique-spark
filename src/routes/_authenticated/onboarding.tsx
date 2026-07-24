import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Bienvenue — MonWé" }, { name: "robots", content: "noindex" }] }),
  component: Onboarding,
});

const GOALS = [
  { value: "amour" as const, label: "Amour" },
  { value: "amitie" as const, label: "Amitié" },
  { value: "pro" as const, label: "Pro / Réseau" },
];
type Goal = typeof GOALS[number]["value"];
const INTERESTS = ["Musique", "Cuisine", "Voyages", "Cinéma", "Sport", "Lecture", "Art", "Tech", "Mode", "Nature", "Danse", "Spiritualité"];
const LANGS = ["Français", "English", "Fang", "Lingala", "Wolof", "Bambara", "Swahili", "Arabe", "Portugais"];

function Onboarding() {
  const navigate = useNavigate();
  const [pseudo, setPseudo] = useState("");
  const [monweCode, setMonweCode] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("Gabon");
  const [city, setCity] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(["Français"]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("profiles").select("*").eq("user_id", u.user.id).maybeSingle();
      if (data) {
        setMonweCode(data.monwe_code ?? "");
        setPseudo(data.pseudo ?? "");
        setBio(data.bio ?? "");
        setCountry(data.country ?? "Gabon");
        setCity(data.city ?? "");
        setBirthdate(data.birthdate ?? "");
        setGoals((data.goals ?? []) as Goal[]);
        setInterests(data.interests ?? []);
        setLanguages(data.languages ?? ["Français"]);
        if (data.onboarded) navigate({ to: "/decouvrir" });
      }
    })();
  }, [navigate]);

  function toggle(list: string[], v: string, setter: (l: string[]) => void) {
    setter(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  async function handleSave() {
    if (!pseudo || !birthdate || goals.length === 0) {
      toast.error("Pseudo, date de naissance et au moins un objectif sont requis");
      return;
    }
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("profiles").update({
      pseudo, bio, country, city, birthdate, goals, interests, languages, onboarded: true,
    }).eq("user_id", u.user.id);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Profil enregistré !");
    navigate({ to: "/decouvrir" });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <span className="monwe-chip">Ton code · {monweCode || "MW-…"}</span>
      <h1 className="mt-4 font-display text-4xl font-bold">Crée ton profil MonWé</h1>
      <p className="mt-2 text-muted-foreground">Reste anonyme derrière ton pseudo. Tu réveleras qui tu es quand tu voudras.</p>

      <div className="mt-8 space-y-6">
        <div>
          <Label htmlFor="pseudo">Pseudo *</Label>
          <Input id="pseudo" value={pseudo} onChange={(e) => setPseudo(e.target.value)} placeholder="Ex: SoleilDeMinuit" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="country">Pays</Label>
            <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="city">Ville</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="bd">Date de naissance *</Label>
          <Input id="bd" type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Quelques mots sur toi…" rows={4} />
        </div>

        <div>
          <Label>Je cherche *</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <Badge key={g.value} variant={goals.includes(g.value) ? "default" : "outline"}
                onClick={() => setGoals(goals.includes(g.value) ? goals.filter((x) => x !== g.value) : [...goals, g.value])} className="cursor-pointer">
                {g.label}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label>Centres d'intérêt</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {INTERESTS.map((i) => (
              <Badge key={i} variant={interests.includes(i) ? "default" : "outline"}
                onClick={() => toggle(interests, i, setInterests)} className="cursor-pointer">
                {i}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label>Langues</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {LANGS.map((l) => (
              <Badge key={l} variant={languages.includes(l) ? "default" : "outline"}
                onClick={() => toggle(languages, l, setLanguages)} className="cursor-pointer">
                {l}
              </Badge>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading} size="lg" className="w-full rounded-full">
          {loading ? "…" : "Commencer à rencontrer"}
        </Button>
      </div>
    </div>
  );
}
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SiteHeader } from "@/components/monwe/SiteHeader";

type Search = { mode?: "signup" | "signin"; redirect?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    mode: s.mode === "signup" ? "signup" : "signin",
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Connexion — MonWé" },
      { name: "description", content: "Rejoins MonWé : rencontres panafricaines, anonymement." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signup" | "signin">(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/decouvrir" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/decouvrir` },
        });
        if (error) throw error;
        toast.success("Compte créé ! Vérifie tes emails si nécessaire.");
        navigate({ to: "/decouvrir" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bienvenue !");
        navigate({ to: "/decouvrir" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    const { lovable } = await import("@/integrations/lovable");
    await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
  }

  async function handleReset() {
    if (!email) return toast.error("Entre ton email d'abord");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Email de réinitialisation envoyé");
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl font-bold">
          {mode === "signup" ? "Rejoins MonWé" : "Bon retour"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {mode === "signup"
            ? "Crée ton code MonWé et commence à rencontrer."
            : "Reconnecte-toi à ton monde."}
        </p>

        <Button onClick={handleGoogle} variant="outline" className="mt-8 h-11 rounded-full">
          Continuer avec Google
        </Button>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          ou par email
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="h-11 w-full rounded-full">
            {loading ? "…" : mode === "signup" ? "Créer mon compte" : "Se connecter"}
          </Button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2 text-sm">
          <button type="button" onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="text-primary underline-offset-4 hover:underline">
            {mode === "signup" ? "J'ai déjà un compte" : "Créer un compte"}
          </button>
          {mode === "signin" && (
            <button type="button" onClick={handleReset} className="text-muted-foreground hover:underline">
              Mot de passe oublié ?
            </button>
          )}
          <Link to="/" className="text-muted-foreground hover:underline">← Retour</Link>
        </div>
      </main>
    </div>
  );
}
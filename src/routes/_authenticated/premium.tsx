import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/monwe/SiteHeader";

export const Route = createFileRoute("/_authenticated/premium")({
  head: () => ({ meta: [{ title: "MonWé Premium" }, { name: "robots", content: "noindex" }] }),
  component: Premium,
});

const BENEFITS = [
  { icon: "👀", title: "Vois qui t'a liké", desc: "Débloque la liste complète de tes admirateurs." },
  { icon: "💬", title: "Messages illimités", desc: "Discute sans restriction avec tous tes matches." },
  { icon: "🎯", title: "Filtres avancés", desc: "Filtre par âge, objectif, langue, centres d'intérêt." },
  { icon: "⭐", title: "5 Super Likes par jour", desc: "Sors du lot et montre ton intérêt tout de suite." },
  { icon: "🌍", title: "Mode Passport", desc: "Change de ville et rencontre partout dans le monde." },
  { icon: "🚀", title: "Boost hebdo", desc: "Sois vu en priorité pendant 30 minutes chaque semaine." },
];

function Premium() {
  const [status, setStatus] = useState<string>("inactive");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("subscriptions").select("status, expires_at").eq("user_id", u.user.id).maybeSingle();
      if (data) setStatus(data.status);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-8 shadow-warm">
          <span className="monwe-chip">Premium</span>
          <h1 className="mt-4 font-display text-4xl font-bold">Va plus loin avec MonWé Premium</h1>
          <p className="mt-2 text-muted-foreground">Plus de rencontres, plus de contrôle, plus de vibes.</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {BENEFITS.map((b) => (
              <div key={b.title} className="rounded-2xl border border-border bg-card p-5">
                <div className="text-2xl">{b.icon}</div>
                <div className="mt-2 font-display text-lg font-semibold">{b.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{b.desc}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/60 p-6 text-center">
            <div className="font-display text-2xl font-bold">Bientôt disponible</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Paiement via Mobile Money (Orange Money, MTN MoMo, Wave…) et carte pour la diaspora.
              Statut actuel : <span className="font-medium capitalize">{status}</span>.
            </p>
            <Button disabled className="mt-4 rounded-full" size="lg">Rejoindre la liste (bientôt)</Button>
          </div>

          <div className="mt-6 text-center">
            <Button asChild variant="ghost"><Link to="/decouvrir">← Retour à la découverte</Link></Button>
          </div>
        </div>
      </main>
    </div>
  );
}
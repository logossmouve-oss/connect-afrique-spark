import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/monwe/SiteHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePremium } from "@/hooks/use-premium";

export const Route = createFileRoute("/_authenticated/mes-likes")({
  head: () => ({ meta: [{ title: "Qui t'a liké — MonWé" }, { name: "robots", content: "noindex" }] }),
  component: MesLikes,
});

type Liker = {
  user_id: string;
  pseudo: string | null;
  monwe_code: string | null;
  city: string | null;
  country: string | null;
  bio: string | null;
  goals: string[];
  is_super: boolean;
};

function MesLikes() {
  const { isPremium, loading: premiumLoading } = usePremium();
  const [likers, setLikers] = useState<Liker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: likes } = await supabase
        .from("likes")
        .select("from_user, is_super, created_at")
        .eq("to_user", u.user.id)
        .order("created_at", { ascending: false });
      if (!likes || likes.length === 0) { setLoading(false); return; }
      const ids = likes.map((l) => l.from_user);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, pseudo, monwe_code, city, country, bio, goals")
        .in("user_id", ids);
      const byId = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      const merged: Liker[] = likes
        .map((l) => {
          const p = byId.get(l.from_user);
          if (!p) return null;
          return { ...p, is_super: !!l.is_super } as Liker;
        })
        .filter((x): x is Liker => x !== null);
      setLikers(merged);
      setLoading(false);
    })();
  }, []);

  const count = likers.length;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-3xl font-bold">Qui t'a liké</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {count > 0 ? `${count} personne${count > 1 ? "s" : ""} attend${count > 1 ? "ent" : ""} que tu craques.` : "Personne pour l'instant — retourne sur Découvrir ✨"}
        </p>

        {loading || premiumLoading ? (
          <div className="mt-16 text-center text-muted-foreground">Chargement…</div>
        ) : count === 0 ? (
          <div className="mt-8">
            <Button asChild className="rounded-full"><Link to="/decouvrir">Découvrir des profils</Link></Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {likers.map((l, i) => {
              const locked = !isPremium && i > 0;
              return (
                <article
                  key={l.user_id}
                  className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-warm"
                >
                  <div className={locked ? "select-none blur-md" : ""}>
                    <div className="flex items-center justify-between">
                      <div className="font-display text-lg font-semibold">
                        {l.pseudo ?? "Anonyme"}
                        {l.is_super && <span className="ml-2 text-primary">⭐</span>}
                      </div>
                      <span className="monwe-chip">{l.monwe_code}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {[l.city, l.country].filter(Boolean).join(", ") || "—"}
                    </div>
                    {l.bio && <p className="mt-3 line-clamp-3 text-sm">{l.bio}</p>}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {l.goals?.map((g) => <Badge key={g} variant="outline">{g}</Badge>)}
                    </div>
                  </div>
                  {locked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm">
                      <div className="text-3xl">🔒</div>
                      <div className="mt-2 text-center text-sm font-medium">Débloque avec Premium</div>
                      <Button asChild size="sm" className="mt-3 rounded-full">
                        <Link to="/premium">Voir Premium</Link>
                      </Button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {!isPremium && count > 1 && !loading && (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/60 p-5 text-center">
            <div className="font-display text-lg font-semibold">Vois tout le monde qui t'a liké</div>
            <p className="mt-1 text-sm text-muted-foreground">Avec Premium, débloque la liste complète et matche directement.</p>
            <Button asChild className="mt-3 rounded-full"><Link to="/premium">Passer Premium</Link></Button>
          </div>
        )}
      </main>
    </div>
  );
}
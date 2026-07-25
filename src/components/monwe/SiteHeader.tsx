import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSignedIn(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="group flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full gradient-sunset text-primary-foreground font-display text-lg font-bold">
            M
          </span>
          <span className="font-display text-xl font-bold tracking-tight">MonWé</span>
        </Link>
        <nav className="flex items-center gap-2">
          {signedIn ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/decouvrir">Découvrir</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/messages">Messages</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/premium">Premium</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/profil">Mon profil</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Se connecter</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/auth" search={{ mode: "signup" }}>Créer un compte</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
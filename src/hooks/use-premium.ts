import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function usePremium() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { if (active) setLoading(false); return; }
      const { data } = await supabase
        .from("subscriptions")
        .select("status, expires_at")
        .eq("user_id", u.user.id)
        .maybeSingle();
      const active_ = !!data && data.status === "active" &&
        (!data.expires_at || new Date(data.expires_at) > new Date());
      if (active) { setIsPremium(active_); setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  return { isPremium, loading };
}
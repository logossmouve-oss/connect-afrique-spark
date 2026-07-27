import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

export function isOnline(lastSeen: string | null | undefined) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < ONLINE_THRESHOLD_MS;
}

export function useOnlineHeartbeat() {
  useEffect(() => {
    let active = true;
    async function beat() {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user || !active) return;
      await supabase
        .from("profiles")
        .update({ last_seen: new Date().toISOString() })
        .eq("user_id", u.user.id);
    }
    beat();
    const id = setInterval(beat, 60_000);
    return () => { active = false; clearInterval(id); };
  }, []);
}

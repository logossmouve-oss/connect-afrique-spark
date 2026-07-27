import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/monwe/SiteHeader";
import { useOnlineHeartbeat, isOnline } from "@/hooks/use-online";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({ meta: [{ title: "Messages — MonWé" }, { name: "robots", content: "noindex" }] }),
  component: Messages,
});

type Row = {
  id: string; match_id: string; last_message_at: string | null;
  reveal_a: boolean; reveal_b: boolean;
  other: { pseudo: string | null; monwe_code: string | null; real_name: string | null; user_id: string; last_seen: string | null } | null;
  unread_count: number;
};

function Messages() {
  useOnlineHeartbeat();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;

      const { data: matches } = await supabase.from("matches").select("id,user_a,user_b")
        .or(`user_a.eq.${u.user.id},user_b.eq.${u.user.id}`);
      const matchIds = (matches ?? []).map((m) => m.id);
      if (matchIds.length === 0) { setLoading(false); return; }

      const { data: convs } = await supabase.from("conversations")
        .select("id,match_id,last_message_at,reveal_a,reveal_b")
        .in("match_id", matchIds).order("last_message_at", { ascending: false, nullsFirst: false });
      const convIds = (convs ?? []).map((c) => c.id);

      const otherIds = (matches ?? []).map((m) => m.user_a === u.user!.id ? m.user_b : m.user_a);
      const { data: profs } = await supabase.from("profiles")
        .select("user_id,pseudo,monwe_code,real_name,last_seen").in("user_id", otherIds);

      const { data: unread } = await supabase.from("messages")
        .select("conversation_id, id", { count: "exact", head: false })
        .in("conversation_id", convIds)
        .neq("sender_id", u.user.id)
        .is("read_at", null);
      const unreadMap = new Map<string, number>();
      (unread ?? []).forEach((m) => {
        unreadMap.set(m.conversation_id, (unreadMap.get(m.conversation_id) ?? 0) + 1);
      });

      const matchToOther = new Map((matches ?? []).map((m) => [m.id, m.user_a === u.user!.id ? m.user_b : m.user_a]));
      const profMap = new Map((profs ?? []).map((p) => [p.user_id, p]));

      setRows((convs ?? []).map((c) => {
        const other = profMap.get(matchToOther.get(c.match_id) ?? "") ?? null;
        return {
          ...c,
          other: other as Row["other"],
          unread_count: unreadMap.get(c.id) ?? 0,
        };
      }));
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-3xl font-bold">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">Vos conversations MonWé.</p>

        {loading ? (
          <div className="mt-10 text-muted-foreground">Chargement…</div>
        ) : rows.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-border bg-card p-8 text-center">
            <div className="text-4xl">💌</div>
            <p className="mt-3 text-sm text-muted-foreground">Pas encore de match. Continue à découvrir !</p>
            <Link to="/decouvrir" className="mt-4 inline-block text-primary underline">Découvrir</Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-2">
            {rows.map((r) => {
              const revealed = r.reveal_a && r.reveal_b;
              const online = isOnline(r.other?.last_seen);
              return (
                <li key={r.id}>
                  <Link to="/messages/$id" params={{ id: r.id }}
                    className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:bg-accent/50 transition">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-display text-sm font-bold">
                          {(r.other?.pseudo ?? "?")[0]?.toUpperCase()}
                        </div>
                        {online && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">
                          {revealed ? r.other?.real_name || r.other?.pseudo : r.other?.pseudo ?? "Anonyme"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {r.other?.monwe_code} {online && "· En ligne"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.unread_count > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                          {r.unread_count}
                        </span>
                      )}
                      {revealed && <span className="monwe-chip">Révélés</span>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
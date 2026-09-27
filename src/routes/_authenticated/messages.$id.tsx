import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SiteHeader } from "@/components/monwe/SiteHeader";
import { useOnlineHeartbeat, isOnline } from "@/hooks/use-online";

export const Route = createFileRoute("/_authenticated/messages/$id")({
  head: () => ({ meta: [{ title: "Conversation — MonWé" }, { name: "robots", content: "noindex" }] }),
  component: Conversation,
});

type Msg = { id: string; sender_id: string; body: string; created_at: string; read_at: string | null };

function Conversation() {
  useOnlineHeartbeat();
  const { id } = Route.useParams();
  const [me, setMe] = useState<string | null>(null);
  const [conv, setConv] = useState<any>(null);
  const [other, setOther] = useState<any>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setMe(u.user.id);

      const { data: c } = await supabase.from("conversations").select("*").eq("id", id).maybeSingle();
      setConv(c);
      if (!c) return;

      const { data: m } = await supabase.from("matches").select("*").eq("id", c.match_id).maybeSingle();
      if (m) {
        const otherId = m.user_a === u.user.id ? m.user_b : m.user_a;
        const { data: pub } = await supabase.rpc("get_public_profiles", { _ids: [otherId] });
        const p = pub?.[0] ?? null;
        let real_name: string | null = null;
        if (c.reveal_a && c.reveal_b) {
          const { data: r } = await supabase.rpc("get_revealed_profile", { _other: otherId });
          real_name = r?.[0]?.real_name ?? null;
        }
        setOther(p ? { ...p, real_name } : null);
      }

      const { data: msgs } = await supabase.from("messages")
        .select("id,sender_id,body,created_at,read_at").eq("conversation_id", id).order("created_at");
      const list = msgs ?? [];
      setMessages(list);
      markRead(list, u.user.id);
    })();

    const channel = supabase.channel(`conv-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (p) => {
          const newMsg = p.new as Msg;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          supabase.auth.getUser().then(({ data: u }) => {
            if (u.user) markRead([newMsg], u.user.id);
          });
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (p) => {
          const updated = p.new as Msg;
          setMessages((prev) => prev.map((m) => m.id === updated.id ? updated : m));
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversations", filter: `id=eq.${id}` },
        (p) => setConv(p.new))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages]);

  async function markRead(list: Msg[], userId: string) {
    const unreadIds = list.filter((m) => m.sender_id !== userId && !m.read_at).map((m) => m.id);
    if (unreadIds.length === 0) return;
    await supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unreadIds);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !me) return;
    setBusy(true);
    const body = text.trim();
    setText("");
    const { error } = await supabase.from("messages").insert({ conversation_id: id, sender_id: me, body });
    if (error) toast.error(error.message);
    else await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", id);
    setBusy(false);
  }

  async function reveal() {
    if (!conv || !me) return;
    const { data: m } = await supabase.from("matches").select("user_a,user_b").eq("id", conv.match_id).maybeSingle();
    if (!m) return;
    const update = m.user_a === me ? { reveal_a: true } : { reveal_b: true };
    const { error } = await supabase.from("conversations").update(update).eq("id", conv.id);
    if (error) toast.error(error.message);
    else toast.success("Tu as choisi de te révéler ✨");
  }

  async function report() {
    if (!other || !me) return;
    const reason = prompt("Raison du signalement ?");
    if (!reason) return;
    await supabase.from("reports").insert({ reporter_id: me, target_user_id: other.user_id, reason });
    toast.success("Signalement envoyé, merci.");
  }

  async function block() {
    if (!other || !me) return;
    if (!confirm("Bloquer cette personne ?")) return;
    await supabase.from("blocks").insert({ blocker_id: me, blocked_id: other.user_id });
    toast.success("Personne bloquée");
  }

  const revealed = conv?.reveal_a && conv?.reveal_b;
  const displayName = revealed ? other?.real_name || other?.pseudo : other?.pseudo;
  const online = isOnline(other?.last_seen);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-4 sm:px-6">
        <Link to="/messages" className="text-sm text-muted-foreground hover:underline">← Messages</Link>
        <header className="mt-3 flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-display text-sm font-bold">
                {(displayName ?? "?")[0]?.toUpperCase()}
              </div>
              {online && (
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
              )}
            </div>
            <div>
              <div className="font-display text-lg font-bold">{displayName ?? "Anonyme"}</div>
              <div className="text-xs text-muted-foreground">
                {other?.monwe_code} {online ? "· En ligne" : revealed ? "· révélés" : ""}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!revealed && <Button size="sm" variant="outline" className="rounded-full" onClick={reveal}>Me révéler</Button>}
            <Button size="sm" variant="ghost" onClick={report}>Signaler</Button>
            <Button size="sm" variant="ghost" onClick={block}>Bloquer</Button>
          </div>
        </header>

        <div ref={scrollRef} className="mt-4 flex-1 space-y-2 overflow-y-auto rounded-2xl border border-border bg-card/50 p-4" style={{ minHeight: 300 }}>
          {messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">Commence la conversation… 👋</p>
          ) : messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender_id === me ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${m.sender_id === me ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {m.body}
                {m.sender_id === me && (
                  <div className="mt-1 text-[10px] opacity-80 text-right">
                    {m.read_at ? "✓✓ Lu" : "✓ Envoyé"}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={send} className="mt-3 flex gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Écris un message…" />
          <Button type="submit" disabled={busy || !text.trim()} className="rounded-full">Envoyer</Button>
        </form>
      </div>
    </div>
  );
}

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

type P = { pseudo: string | null; bio: string | null; goals: unknown; interests: string[]; languages: string[]; country: string | null; city: string | null; prompts: unknown; age: number | null };
const strip = (p: P) => ({ pseudo: p.pseudo, bio: p.bio, goals: p.goals, interests: p.interests, languages: p.languages, country: p.country, city: p.city, prompts: p.prompts, age: p.age });

const Input = z.object({ targetUserId: z.string().uuid() });

export const computeCompatibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => Input.parse(v))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [a, b] = [userId, data.targetUserId].sort();

    const { data: cached } = await supabase
      .from("compatibility_scores")
      .select("score, rationale")
      .eq("user_a", a)
      .eq("user_b", b)
      .maybeSingle();
    if (cached) return cached;
    if (a === b) throw new Error("Cible invalide");

    const { data: profiles } = await supabase.rpc("get_public_profiles", { _ids: [a, b] });
    if (!profiles || profiles.length < 2) throw new Error("Profils introuvables");

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY manquant");

    // Anti-abus : au plus 30 nouveaux calculs IA par heure et par utilisateur (le cache n'est pas compté).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await supabaseAdmin
      .from("compatibility_requests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", since);
    if ((count ?? 0) >= 30) throw new Error("Trop de calculs de compatibilité, réessaie plus tard.");
    await supabaseAdmin.from("compatibility_requests").insert({ user_id: userId });

    const prompt = `Tu es un expert relations humaines pour une app africaine de rencontres (amour/amitié/pro). Compare ces deux profils et donne un score de compatibilité de 0 à 100, plus une phrase courte et chaleureuse (max 25 mots) en français expliquant pourquoi. Réponds STRICTEMENT en JSON: {"score": number, "rationale": string}.\n\nProfil 1: ${JSON.stringify(strip(profiles[0]))}\n\nProfil 2: ${JSON.stringify(strip(profiles[1]))}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "openai/gpt-5.5",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) throw new Error(`AI error ${res.status}`);
    const json = await res.json();
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: { score: number; rationale: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { score: 50, rationale: "Compatibilité à explorer." };
    }
    const score = Math.max(0, Math.min(100, Math.round(parsed.score ?? 50)));
    const rationale = (parsed.rationale ?? "").slice(0, 200);

    // Écriture réservée au serveur : les clients n'ont plus aucun droit d'écriture sur cette table.
    const { error: writeErr } = await supabaseAdmin
      .from("compatibility_scores")
      .upsert({ user_a: a, user_b: b, score, rationale }, { onConflict: "user_a,user_b", ignoreDuplicates: true });
    if (writeErr) console.error("compat write failed", writeErr.message);
    return { score, rationale };
  });
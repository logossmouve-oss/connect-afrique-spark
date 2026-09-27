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

    const { data: profiles } = await supabase.rpc("get_public_profiles", { _ids: [a, b] });
    if (!profiles || profiles.length < 2) throw new Error("Profils introuvables");

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY manquant");

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

    await supabase.from("compatibility_scores").insert({ user_a: a, user_b: b, score, rationale });
    return { score, rationale };
  });
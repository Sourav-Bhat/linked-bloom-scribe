import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      topic,
      tone = "professional",
      instructions = "",
      includeHashtags = true,
      postLength = "medium",
      regeneratePrompt = "",
      previousContent = "",
    } = await req.json();

    if (!topic || typeof topic !== "string") {
      return new Response(JSON.stringify({ error: "Topic is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pull persona for personalization
    const { data: persona } = await supabase
      .from("personas")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const lengthGuide: Record<string, string> = {
      short: "120–180 words. Punchy, single insight, fast read (~30 seconds).",
      medium: "220–320 words. One core idea + 3 supporting points + reflection.",
      long: "400–550 words. Story-led, deeper teardown, multiple takeaways, strong CTA.",
    };

    const toneGuide: Record<string, string> = {
      professional: "Polished, credible, executive-ready. Confident without being stiff.",
      friendly: "Warm, conversational, first-person. Like texting a smart friend.",
      authoritative: "Direct, opinionated, expert POV. Take a clear stance.",
      educational: "Teach something concrete. Frameworks, numbered steps, plain language.",
      inspirational: "Story-driven, emotionally resonant, ends on a forward-looking note.",
    };

    const personaBlock = persona
      ? `
WRITING FOR THIS CREATOR:
- Industry: ${persona.industry || "—"}
- Experience: ${persona.experience_range || "—"}
- Archetype: ${persona.archetype || "—"}
- Future goal: ${persona.future_goal || "—"}
- Their content pillars: ${(persona.topics || []).join(", ") || "—"}
- Default tone: ${persona.tone || "—"}
- Topics to AVOID (hard rule): ${persona.no_go_topic || "None"}
${persona.persona_data ? `- Strategy notes: ${JSON.stringify(persona.persona_data).slice(0, 800)}` : ""}
Use this to make the post sound unmistakably like THEM, not generic LinkedIn fluff.`
      : "No persona on file — write in a sharp, modern professional voice.";

    const systemPrompt = `You are an elite LinkedIn ghostwriter who has written viral posts for founders, operators, and senior ICs. You do NOT write generic corporate fluff. You write posts that sound like a real human with a real opinion.

NON-NEGOTIABLE RULES:
1. HOOK FIRST: The first line must stop the scroll. No "I'm excited to share…", no "In today's fast-paced world…", no questions like "Have you ever wondered…". Use a contrarian take, a specific number, a confession, a one-line story, or a bold claim.
2. ONE BIG IDEA: Every post defends ONE thesis. No listicles that try to say everything.
3. CONCRETE > ABSTRACT: Use specific numbers, names of tools, real scenarios, and examples. Cut the words "leverage", "synergy", "game-changer", "unlock", "in today's world", "revolutionize", "delve", "tapestry".
4. SHORT LINES + WHITE SPACE: LinkedIn rewards rhythm. Most lines = 1–2 sentences. Frequent line breaks. No walls of text.
5. NO EM-DASHES (—). Use periods, commas, or line breaks instead.
6. NO EMOJIS unless the tone is explicitly "friendly" or "inspirational" — and even then, max 2, never decorative bullets.
7. END WITH A REAL CTA: A genuine question, a hot take to react to, or a small ask. Never "What are your thoughts?" — that's lazy.
8. SOUND HUMAN: Contractions, occasional sentence fragments, mild self-deprecation when appropriate. No AI tells.
9. Respect the creator's no-go topics. Never mention them.

OUTPUT FORMAT (strict JSON, no markdown fences):
{
  "title": "A short internal label for the post (5–8 words, not shown on LinkedIn)",
  "content": "The full LinkedIn post body, formatted with line breaks (\\n\\n between paragraphs, \\n inside groups). Do NOT include hashtags here.",
  "hashtags": "${includeHashtags ? "3–5 lowercase, specific, non-spammy hashtags separated by single spaces, each starting with #" : ""}"
}

If hashtags are not requested, return "hashtags": "".`;

    const userPrompt = `Write a LinkedIn post.

TOPIC: ${topic}
TONE: ${tone} — ${toneGuide[tone] || toneGuide.professional}
LENGTH: ${postLength} — ${lengthGuide[postLength] || lengthGuide.medium}
INCLUDE HASHTAGS: ${includeHashtags ? "yes" : "no"}
${instructions ? `EXTRA INSTRUCTIONS FROM CREATOR: ${instructions}` : ""}

${personaBlock}

${
  regeneratePrompt
    ? `THIS IS A REGENERATION. Previous draft is below. Apply this feedback: "${regeneratePrompt}".
Keep what worked, fix what didn't. Don't just lightly edit — meaningfully rewrite per the feedback.

PREVIOUS DRAFT:
"""
${previousContent}
"""`
    : ""
}

Now write the post. Return ONLY the JSON object, no preamble.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.9,
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, errText);
      throw new Error(`AI gateway returned ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const raw = aiData.choices?.[0]?.message?.content || "{}";

    let parsed: { title?: string; content?: string; hashtags?: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Fallback: try to extract JSON from text
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { content: raw };
    }

    // Sanitize: strip em-dashes if any slipped through
    if (parsed.content) parsed.content = parsed.content.replace(/—/g, ", ");

    return new Response(
      JSON.stringify({
        title: parsed.title || `Post about ${topic}`,
        content: parsed.content || "",
        hashtags: includeHashtags ? (parsed.hashtags || "") : "",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-content error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Failed to generate content" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

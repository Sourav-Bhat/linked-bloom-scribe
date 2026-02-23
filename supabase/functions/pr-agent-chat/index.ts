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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages: clientMessages } = await req.json();

    // Load persona data for context
    const { data: persona } = await supabase
      .from("personas")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Load previous conversation history
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(50);

    const personaContext = persona
      ? `
USER PERSONA PROFILE:
- Industry: ${persona.industry}
- Experience: ${persona.experience_range}
- Location: ${persona.location}
- Future Goal: ${persona.future_goal}
- Content Topics: ${(persona.topics || []).join(", ")}
- Tone: ${persona.tone}
- Archetype: ${persona.archetype}
- Posts Per Week: ${persona.posts_per_week}
- Preferred Days: ${(persona.preferred_days || []).join(", ")}
- Topics to Avoid: ${persona.no_go_topic || "None"}
- LinkedIn URL: ${persona.linkedin_url || "Not provided"}
${persona.persona_data ? `
GENERATED PERSONA STRATEGY:
${JSON.stringify(persona.persona_data, null, 2)}
` : ""}
`
      : "No persona data available yet.";

    const systemPrompt = `You are a world-class Personal PR Agent and LinkedIn strategist. You have deep expertise in personal branding, content strategy, and professional positioning on LinkedIn.

YOUR ROLE:
- Act as a trusted PR advisor who truly understands the user's professional world
- Have natural, human conversations — be warm, direct, and insightful
- Proactively ask thoughtful questions to understand their goals, motivations, fears, and aspirations
- Challenge their thinking when needed — great PR agents push back constructively
- Offer specific, actionable strategies — not generic advice
- Remember everything they've told you and build on previous conversations

CONVERSATION STYLE:
- Keep responses concise (2-4 paragraphs max unless they ask for detail)
- Ask ONE focused follow-up question at the end of most responses
- Use their name/context naturally when you have it
- Be specific — reference their industry, goals, and archetype
- When they share something new, acknowledge it and connect it to their strategy

WHAT YOU DO:
1. Content Strategy: Help them plan what to post, when, and why
2. Positioning: Sharpen how they're perceived in their industry
3. Goal Alignment: Connect their LinkedIn activity to their career goals
4. Voice Development: Refine their unique voice and perspective
5. Accountability: Track their progress and nudge them forward

WHAT YOU DON'T DO:
- Write full posts (suggest angles and hooks instead)
- Give vague motivational advice
- Ignore their stated preferences or topics to avoid

${personaContext}

If this is the start of a new conversation, introduce yourself briefly and ask what's on their mind professionally right now. Reference their archetype and goal to show you know them.`;

    // Build full message list: system + history + new messages
    const allMessages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
      ...clientMessages,
    ];

    // Save user message to DB
    const lastUserMsg = clientMessages[clientMessages.length - 1];
    if (lastUserMsg?.role === "user") {
      await supabase.from("chat_messages").insert({
        user_id: user.id,
        role: "user",
        content: lastUserMsg.content,
      });
    }

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
          model: "google/gemini-3-flash-preview",
          messages: allMessages,
          stream: true,
          temperature: 0.8,
          max_tokens: 1500,
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

    // We need to intercept the stream to save the full assistant response
    const reader = aiRes.body!.getReader();
    let fullAssistantContent = "";

    const stream = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) {
          // Save assistant response to DB
          if (fullAssistantContent.trim()) {
            const serviceClient = createClient(
              Deno.env.get("SUPABASE_URL")!,
              Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
            );
            await serviceClient.from("chat_messages").insert({
              user_id: user.id,
              role: "assistant",
              content: fullAssistantContent.trim(),
            });
          }
          controller.close();
          return;
        }

        // Parse the chunk to extract content for saving
        const text = new TextDecoder().decode(value);
        for (const line of text.split("\n")) {
          if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) fullAssistantContent += content;
          } catch {}
        }

        controller.enqueue(value);
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("PR agent chat error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

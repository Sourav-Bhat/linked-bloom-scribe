import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const body = await req.json();
    const { onboardingData } = body;

    const prompt = `You are a LinkedIn personal branding strategist. Based on the following onboarding data, generate a comprehensive LinkedIn persona profile.

Onboarding Data:
- Industry: ${onboardingData.industry}
- Experience: ${onboardingData.experienceRange}
- Location: ${onboardingData.location}
- Future Goal: ${onboardingData.futureGoal}
- Content Topics: ${onboardingData.topics.join(", ")}
- Admired Posts: ${JSON.stringify(onboardingData.admiredPosts)}
- Topics to Avoid: ${onboardingData.noGoTopic || "None specified"}
- Posts Per Week: ${onboardingData.postsPerWeek}
- Preferred Days: ${onboardingData.preferredDays.join(", ")}
- Preferred Tone: ${onboardingData.tone}

Return a JSON object with exactly this structure (no markdown, no code fences, just raw JSON):
{
  "archetype": {
    "name": "The Oracle|The Builder|The Connector",
    "tagline": "A short punchy tagline, e.g. 'The one who sees around corners.'",
    "description": "A 2-3 sentence personalized description referencing their industry, experience, location and goal. Write in second person."
  },
  "contentPillars": [
    {
      "title": "Pillar title",
      "rationale": "Why this pillar fits their profile, 1-2 sentences",
      "firstPostIdea": "A concrete first post idea for this pillar"
    }
  ],
  "postingRhythm": {
    "postsPerWeek": ${onboardingData.postsPerWeek},
    "days": ${JSON.stringify(onboardingData.preferredDays)},
    "bestTimeOfDay": "A recommended time like 'Early morning (7-8 AM local time)'",
    "reasoning": "1-2 sentences explaining why this rhythm works for them"
  },
  "voiceProfile": {
    "tone": "Their tone style",
    "signatureStyle": "A short description of their writing style, e.g. 'Data-backed insights with a conversational edge'",
    "thingsToAvoid": "What they should avoid in their content"
  }
}

Ensure exactly 3 content pillars. The archetype should be derived from their topics: Innovation/Trends/Future of Work -> The Oracle, Entrepreneurship/Productivity/Career Growth -> The Builder, Leadership/Team Culture/Hiring -> The Connector. Make all text professional and specific to their data.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a LinkedIn personal branding strategist. Return only valid JSON, no markdown." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI gateway error:", errText);
      throw new Error(`AI gateway returned ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";
    
    // Strip markdown code fences if present
    const jsonStr = rawContent.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
    const persona = JSON.parse(jsonStr);

    // Save persona to database
    const personaRecord = {
      user_id: user.id,
      industry: onboardingData.industry,
      experience_range: onboardingData.experienceRange,
      location: onboardingData.location,
      future_goal: onboardingData.futureGoal,
      topics: onboardingData.topics,
      admired_posts: onboardingData.admiredPosts.filter((p: any) => p.url.trim()),
      no_go_topic: onboardingData.noGoTopic,
      posts_per_week: onboardingData.postsPerWeek,
      preferred_days: onboardingData.preferredDays,
      tone: onboardingData.tone,
      archetype: persona.archetype.name,
    };

    const { error: upsertError } = await supabase
      .from("personas")
      .upsert(personaRecord, { onConflict: "user_id" });

    if (upsertError) {
      console.error("Persona upsert error:", upsertError);
      // Don't fail the whole request for this
    }

    // Update profile
    await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        industry: onboardingData.industry,
        topics: onboardingData.topics,
        posts_per_week: onboardingData.postsPerWeek,
        tone: onboardingData.tone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return new Response(JSON.stringify({ persona }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Persona agent error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate persona" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

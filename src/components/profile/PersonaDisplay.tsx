import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface ContentPillar {
  title: string;
  rationale: string;
  firstPostIdea: string;
}

interface PersonaData {
  archetype: {
    name: string;
    tagline: string;
    description: string;
  };
  contentPillars: ContentPillar[];
  postingRhythm: {
    postsPerWeek: number;
    days: string[];
    bestTimeOfDay: string;
    reasoning: string;
  };
  voiceProfile: {
    tone: string;
    signatureStyle: string;
    thingsToAvoid: string;
  };
}

interface PersonaDisplayProps {
  userId: string;
}

const PersonaDisplay = ({ userId }: PersonaDisplayProps) => {
  const [persona, setPersona] = useState<PersonaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    loadPersona();
  }, [userId]);

  const loadPersona = async () => {
    try {
      const { data, error } = await (supabase
        .from("personas" as any) as any)
        .select("persona_data")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      if (data?.persona_data) {
        setPersona(data.persona_data as PersonaData);
      }
    } catch (err) {
      console.error("Error loading persona:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      // Load current onboarding data
      const { data: personaRow, error } = await (supabase
        .from("personas" as any) as any)
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error || !personaRow) throw new Error("Could not load profile data");

      const { data: result, error: fnError } = await supabase.functions.invoke("persona-agent", {
        body: {
          onboardingData: {
            industry: personaRow.industry,
            experienceRange: personaRow.experience_range,
            location: personaRow.location,
            futureGoal: personaRow.future_goal,
            topics: personaRow.topics,
            admiredPosts: personaRow.admired_posts || [],
            noGoTopic: personaRow.no_go_topic || "",
            postsPerWeek: personaRow.posts_per_week,
            preferredDays: personaRow.preferred_days,
            tone: personaRow.tone,
          },
        },
      });

      if (fnError) throw fnError;
      if (result?.persona) {
        setPersona(result.persona);
        toast({ title: "Persona regenerated!", description: "Your LinkedIn strategy has been updated." });
      }
    } catch (err) {
      console.error("Regenerate error:", err);
      toast({ title: "Regeneration failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading persona...
        </CardContent>
      </Card>
    );
  }

  if (!persona) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>No persona generated yet. Complete onboarding to generate your LinkedIn persona.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Archetype */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-primary">{persona.archetype.name}</h2>
              <p className="text-base italic text-muted-foreground">{persona.archetype.tagline}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={regenerating}
              className="shrink-0"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${regenerating ? "animate-spin" : ""}`} />
              {regenerating ? "Regenerating..." : "Regenerate"}
            </Button>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{persona.archetype.description}</p>
        </CardContent>
      </Card>

      {/* Content Pillars */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em]">
            Your 3 Content Pillars
          </p>
          <div className="space-y-4">
            {persona.contentPillars.map((pillar, i) => (
              <div key={i} className="border-l-4 border-primary pl-5 py-3 space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-xs font-medium text-primary">0{i + 1}</span>
                  <h3 className="text-base font-semibold text-foreground">{pillar.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{pillar.rationale}</p>
                <div className="bg-primary/5 rounded-md px-4 py-3">
                  <p className="text-[10px] font-medium text-primary uppercase tracking-[0.15em] mb-1">
                    First post idea:
                  </p>
                  <p className="text-sm text-foreground/80">{pillar.firstPostIdea}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Posting Rhythm */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em]">
            Your Recommended Rhythm
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap gap-2">
              {persona.postingRhythm.days.map((day) => (
                <Badge key={day} className="rounded-full">{day}</Badge>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{persona.postingRhythm.bestTimeOfDay}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-primary">{persona.postingRhythm.postsPerWeek}</span>
              <span className="text-sm text-muted-foreground">posts/week</span>
            </div>
          </div>
          <p className="text-sm italic text-muted-foreground">{persona.postingRhythm.reasoning}</p>
        </CardContent>
      </Card>

      {/* Voice Profile */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em]">
            Your Voice Profile
          </p>
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="text-sm font-medium text-foreground w-16 shrink-0">Tone</span>
              <span className="text-sm text-muted-foreground">{persona.voiceProfile.tone}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-sm font-medium text-foreground w-16 shrink-0">Style</span>
              <span className="text-sm text-muted-foreground">{persona.voiceProfile.signatureStyle}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-sm font-medium text-foreground w-16 shrink-0">Avoid</span>
              <span className="text-sm text-muted-foreground">{persona.voiceProfile.thingsToAvoid}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonaDisplay;

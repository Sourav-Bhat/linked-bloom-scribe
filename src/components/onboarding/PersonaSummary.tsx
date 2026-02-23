import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";

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

interface PersonaSummaryProps {
  persona: PersonaData | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

const LOADING_MESSAGES = [
  "Analysing your professional background...",
  "Identifying your content strengths...",
  "Calibrating your posting strategy...",
];

const LoadingState = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4" style={{ backgroundColor: "#0A2540" }}>
      <div className="text-center space-y-6">
        <div className="relative h-10 w-10 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-white/20" />
          <div className="absolute inset-0 rounded-full border-2 border-t-white animate-spin" />
        </div>
        <h2 className="text-2xl font-semibold text-white">Building your LinkedIn persona...</h2>
        <p className="text-white/70 text-sm transition-opacity duration-500">{LOADING_MESSAGES[messageIndex]}</p>
      </div>
    </div>
  );
};

const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4" style={{ backgroundColor: "#0A2540" }}>
    <div className="text-center space-y-6 max-w-md">
      <h2 className="text-2xl font-semibold text-white">We hit a snag building your persona.</h2>
      <p className="text-white/70 text-sm">Something went wrong while generating your LinkedIn strategy. Your onboarding data is safe.</p>
      <Button onClick={onRetry} variant="outline" className="border-white/30 text-white hover:bg-white/10">
        Retry
      </Button>
    </div>
  </div>
);

const PersonaSummary = ({ persona, isLoading, error, onRetry }: PersonaSummaryProps) => {
  const navigate = useNavigate();
  const { setOnboardingCompleted } = useAuth();

  if (isLoading) return <LoadingState />;
  if (error || !persona) return <ErrorState onRetry={onRetry} />;

  const handleContinue = () => {
    setOnboardingCompleted?.(true);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[680px] mx-auto px-6 py-12 space-y-10">
        {/* Archetype Reveal */}
        <div className="space-y-4">
          <h1 className="text-[32px] font-bold text-primary">{persona.archetype.name}</h1>
          <p className="text-lg italic text-muted-foreground">{persona.archetype.tagline}</p>
          <p className="text-base text-foreground/80 leading-relaxed">{persona.archetype.description}</p>
          <div className="h-px bg-primary/20 mt-6" />
        </div>

        {/* Content Pillars */}
        <div className="space-y-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em]">Your 3 Content Pillars</p>
          <div className="space-y-4">
            {persona.contentPillars.map((pillar, i) => (
              <div key={i} className="border-l-4 border-primary pl-5 py-4 space-y-3">
                <div className="flex items-baseline gap-3">
                  <span className="text-xs font-medium text-primary">0{i + 1}</span>
                  <h3 className="text-lg font-semibold text-foreground">{pillar.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{pillar.rationale}</p>
                <div className="bg-primary/5 rounded-md px-4 py-3">
                  <p className="text-[10px] font-medium text-primary uppercase tracking-[0.15em] mb-1">First post idea:</p>
                  <p className="text-sm text-foreground/80">{pillar.firstPostIdea}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Posting Rhythm */}
        <div className="space-y-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em]">Your Recommended Rhythm</p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap gap-2">
              {persona.postingRhythm.days.map((day) => (
                <span key={day} className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary text-primary-foreground">
                  {day}
                </span>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{persona.postingRhythm.bestTimeOfDay}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-primary">{persona.postingRhythm.postsPerWeek}</span>
              <span className="text-sm text-muted-foreground">posts/week</span>
            </div>
          </div>
          <p className="text-sm italic text-muted-foreground">{persona.postingRhythm.reasoning}</p>
        </div>

        {/* Voice Profile */}
        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em]">Your Voice Profile</p>
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
        </div>

        {/* CTA */}
        <div className="space-y-3 pt-4">
          <Button onClick={handleContinue} className="w-full" size="lg">
            See My First Draft Posts
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Your persona will evolve as you use the platform. We will re-evaluate it every 30 days.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PersonaSummary;

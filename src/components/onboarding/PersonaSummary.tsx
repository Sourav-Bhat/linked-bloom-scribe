import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PersonaSummaryProps {
  archetype: string;
  topics: string[];
  postsPerWeek: number;
  preferredDays: string[];
  tone: string;
}

const ARCHETYPE_DESCRIPTIONS: Record<string, string> = {
  "The Oracle": "You see what others miss. Your content brings clarity to complex trends and future shifts.",
  "The Builder": "You turn ideas into action. Your content inspires people to build, grow, and move forward.",
  "The Connector": "You bring people together. Your content strengthens teams, culture, and talent ecosystems.",
};

const PersonaSummary = ({ archetype, topics, postsPerWeek, preferredDays, tone }: PersonaSummaryProps) => {
  const navigate = useNavigate();

  const daysList = preferredDays.join(" and ");
  const rhythm = `${postsPerWeek} post${postsPerWeek > 1 ? "s" : ""} per week on ${daysList}`;

  return (
    <div className="flex items-center justify-center min-h-screen bg-onboarding-bg p-4">
      <div className="w-full max-w-lg text-center space-y-8">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Your LinkedIn Archetype</p>
          <h1 className="text-4xl font-bold text-primary">{archetype}</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {ARCHETYPE_DESCRIPTIONS[archetype] || ARCHETYPE_DESCRIPTIONS["The Builder"]}
          </p>
        </div>

        <div className="bg-background rounded-xl border border-input p-6 space-y-5 text-left">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Content Topics</p>
            <div className="flex flex-wrap gap-2">
              {topics.slice(0, 3).map((t) => (
                <span key={t} className="px-3 py-1 rounded-full text-sm bg-primary/10 text-primary font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Posting Rhythm</p>
            <p className="text-sm text-foreground">{rhythm}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Tone</p>
            <p className="text-sm text-foreground capitalize">{tone}</p>
          </div>
        </div>

        <Button
          onClick={() => navigate("/")}
          className="w-full max-w-xs mx-auto"
          size="lg"
        >
          See My First Draft Posts
        </Button>
      </div>
    </div>
  );
};

export default PersonaSummary;

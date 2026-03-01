import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface StepThreeData {
  postsPerWeek: number | null;
  preferredDays: string[];
  tone: string;
}

interface StepThreeProps {
  data: StepThreeData;
  onChange: (data: StepThreeData) => void;
  errors: Partial<Record<string, string>>;
}

const POSTS_OPTIONS = [
  { value: 1, label: "1 post", desc: "Slow and steady, low commitment" },
  { value: 2, label: "2 posts", desc: "Recommended for steady growth" },
  { value: 3, label: "3 posts", desc: "Ambitious, high visibility" },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const TONE_OPTIONS = [
  { value: "professional", label: "Professional", desc: "Structured, authoritative, data-informed" },
  { value: "conversational", label: "Conversational", desc: "Approachable, direct, like talking to a peer" },
  { value: "storytelling", label: "Storytelling", desc: "Narrative-driven, personal, experience-based" },
];

const StepThree = ({ data, onChange, errors }: StepThreeProps) => {
  const toggleDay = (day: string) => {
    const current = data.preferredDays;
    if (current.includes(day)) {
      onChange({ ...data, preferredDays: current.filter((d) => d !== day) });
    } else if (current.length < 4) {
      onChange({ ...data, preferredDays: [...current, day] });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-primary">Let's set a rhythm you can actually keep</h2>
        <p className="text-muted-foreground mt-1">
          Consistency beats volume. We will build your strategy around what is realistic for you.
        </p>
      </div>

      <div className="space-y-5">
        {/* Posts Per Week */}
        <div className="space-y-3">
          <Label>Posts Per Week</Label>
          <RadioGroup
            value={data.postsPerWeek?.toString() || ""}
            onValueChange={(val) => onChange({ ...data, postsPerWeek: parseInt(val) })}
            className="space-y-2"
          >
            {POSTS_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  data.postsPerWeek === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-input hover:border-primary/40"
                }`}
              >
                <RadioGroupItem value={opt.value.toString()} className="mt-0.5" />
                <div>
                  <span className="text-sm font-medium">{opt.label}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </div>
              </label>
            ))}
          </RadioGroup>
          {errors.postsPerWeek && <p className="text-sm text-destructive">{errors.postsPerWeek}</p>}
        </div>

        {/* Best Days */}
        <div className="space-y-3">
          <Label>Best Days to Post (select up to 4)</Label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => {
              const selected = data.preferredDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                    selected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-input text-foreground hover:border-primary/40"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          {errors.preferredDays && <p className="text-sm text-destructive">{errors.preferredDays}</p>}
        </div>

        {/* Tone */}
        <div className="space-y-3">
          <Label>Preferred Content Tone</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            {TONE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ ...data, tone: opt.value })}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  data.tone === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-input hover:border-primary/40"
                }`}
              >
                <span className="text-sm font-medium block">{opt.label}</span>
                <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
              </button>
            ))}
          </div>
          {errors.tone && <p className="text-sm text-destructive">{errors.tone}</p>}
        </div>
      </div>
    </div>
  );
};

export default StepThree;

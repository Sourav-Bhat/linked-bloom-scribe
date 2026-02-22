import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AdmiredPost {
  url: string;
  standout: string;
}

export interface StepTwoData {
  topics: string[];
  admiredPosts: AdmiredPost[];
  noGoTopic: string;
}

interface StepTwoProps {
  data: StepTwoData;
  onChange: (data: StepTwoData) => void;
  errors: Partial<Record<string, string>>;
}

const ALL_TOPICS = [
  "Leadership", "Career Growth", "Industry Trends", "Personal Lessons",
  "Team Culture", "Innovation", "Hiring and Talent", "Client Work",
  "Entrepreneurship", "Productivity", "Diversity and Inclusion", "Future of Work",
];

const STANDOUT_OPTIONS = [
  "Sharp and direct", "Honest and vulnerable", "Data-driven",
  "Inspiring", "Contrarian", "Storytelling", "Practical advice",
];

const StepTwo = ({ data, onChange, errors }: StepTwoProps) => {
  const toggleTopic = (topic: string) => {
    const current = data.topics;
    if (current.includes(topic)) {
      onChange({ ...data, topics: current.filter((t) => t !== topic) });
    } else {
      if (current.length < 5) {
        onChange({ ...data, topics: [...current, topic] });
      }
    }
  };

  const updatePost = (index: number, field: keyof AdmiredPost, value: string) => {
    const posts = [...data.admiredPosts];
    posts[index] = { ...posts[index], [field]: value };
    onChange({ ...data, admiredPosts: posts });
  };

  const addPost = () => {
    if (data.admiredPosts.length < 3) {
      onChange({ ...data, admiredPosts: [...data.admiredPosts, { url: "", standout: "" }] });
    }
  };

  const removePost = (index: number) => {
    onChange({ ...data, admiredPosts: data.admiredPosts.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-primary">What does great content look like to you?</h2>
        <p className="text-muted-foreground mt-1">
          We use this to make sure your posts sound like you, not like a robot.
        </p>
      </div>

      <div className="space-y-5">
        {/* Topics */}
        <div className="space-y-3">
          <Label>Content Topics (select 3 to 5)</Label>
          <div className="flex flex-wrap gap-2">
            {ALL_TOPICS.map((topic) => {
              const selected = data.topics.includes(topic);
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    selected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-input text-foreground hover:border-primary/40"
                  }`}
                >
                  {topic}
                </button>
              );
            })}
          </div>
          {errors.topics && <p className="text-sm text-destructive">{errors.topics}</p>}
        </div>

        {/* Admired Posts */}
        <div className="space-y-3">
          <Label>Share up to 3 LinkedIn posts you wish you had written</Label>
          {data.admiredPosts.map((post, idx) => (
            <div key={idx} className="p-4 rounded-lg border border-input bg-background space-y-3">
              <div className="flex items-start gap-2">
                <Input
                  value={post.url}
                  onChange={(e) => updatePost(idx, "url", e.target.value)}
                  placeholder="https://linkedin.com/... or describe the topic"
                  className="flex-1"
                />
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => removePost(idx)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Select
                value={post.standout}
                onValueChange={(val) => updatePost(idx, "standout", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="What made it stand out?" />
                </SelectTrigger>
                <SelectContent>
                  {STANDOUT_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt.toLowerCase().replace(/\s+/g, "-")}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          {data.admiredPosts.length < 3 && (
            <button
              type="button"
              onClick={addPost}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add another post
            </button>
          )}
        </div>

        {/* No-Go Topic */}
        <div className="space-y-2">
          <Label htmlFor="noGoTopic">Is there any topic you never want associated with your name?</Label>
          <Input
            id="noGoTopic"
            value={data.noGoTopic}
            onChange={(e) => onChange({ ...data, noGoTopic: e.target.value })}
            placeholder="e.g. Politics, competitor names, salary discussions"
          />
        </div>
      </div>
    </div>
  );
};

export default StepTwo;


import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, X, ImagePlus } from "lucide-react";

interface AdmiredPost {
  url: string;
  standout: string;
  imageUrl?: string;
}

interface PersonaData {
  linkedin_url: string;
  industry: string;
  experience_range: string;
  location: string;
  future_goal: string;
  topics: string[];
  admired_posts: AdmiredPost[];
  no_go_topic: string;
  posts_per_week: number | null;
  preferred_days: string[];
  tone: string;
  archetype: string;
}

interface ProfileFormProps {
  profile: any;
  setProfile: any;
  topicsInput: string;
  setTopicsInput: any;
  isNewProfile: boolean;
  userId: string;
}

const INDUSTRIES = [
  "Technology", "Finance", "Marketing", "Consulting", "Healthcare",
  "Education", "Legal", "Real Estate", "Retail", "Manufacturing", "Media", "Other",
];

const EXPERIENCE_OPTIONS = [
  { value: "0-3", label: "0-3 years" },
  { value: "4-7", label: "4-7 years" },
  { value: "8-15", label: "8-15 years" },
  { value: "15+", label: "15+ years" },
];

const ALL_TOPICS = [
  "Leadership", "Career Growth", "Industry Trends", "Personal Lessons",
  "Team Culture", "Innovation", "Hiring and Talent", "Client Work",
  "Entrepreneurship", "Productivity", "Diversity and Inclusion", "Future of Work",
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const POSTS_OPTIONS = [
  { value: 1, label: "1 post", desc: "Slow and steady, low commitment" },
  { value: 2, label: "2 posts", desc: "Recommended for steady growth" },
  { value: 3, label: "3 posts", desc: "Ambitious, high visibility" },
];

const TONE_OPTIONS = [
  { value: "professional", label: "Professional", desc: "Structured, authoritative, data-informed" },
  { value: "conversational", label: "Conversational", desc: "Approachable, direct, like talking to a peer" },
  { value: "storytelling", label: "Storytelling", desc: "Narrative-driven, personal, experience-based" },
];

const STANDOUT_OPTIONS = [
  "Sharp and direct", "Honest and vulnerable", "Data-driven",
  "Inspiring", "Contrarian", "Storytelling", "Practical advice",
];

export const ProfileForm = ({
  userId,
}: ProfileFormProps) => {
  const [persona, setPersona] = useState<PersonaData>({
    linkedin_url: "",
    industry: "",
    experience_range: "",
    location: "",
    future_goal: "",
    topics: [],
    admired_posts: [{ url: "", standout: "" }],
    no_go_topic: "",
    posts_per_week: null,
    preferred_days: [],
    tone: "",
    archetype: "",
  });
  const [customTopicInput, setCustomTopicInput] = useState("");
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const addCustomTopic = () => {
    const topic = customTopicInput.trim();
    if (topic && !persona.topics.includes(topic) && persona.topics.length < 5) {
      setPersona((prev) => ({ ...prev, topics: [...prev.topics, topic] }));
      setCustomTopicInput("");
    }
  };

  useEffect(() => {
    async function loadPersona() {
      try {
        const { data, error } = await (supabase
          .from("personas" as any) as any)
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error) throw error;
        if (data) {
          setPersona({
            linkedin_url: data.linkedin_url || "",
            industry: data.industry || "",
            experience_range: data.experience_range || "",
            location: data.location || "",
            future_goal: data.future_goal || "",
            topics: data.topics || [],
            admired_posts: (data.admired_posts as AdmiredPost[])?.length
              ? (data.admired_posts as AdmiredPost[])
              : [{ url: "", standout: "" }],
            no_go_topic: data.no_go_topic || "",
            posts_per_week: data.posts_per_week,
            preferred_days: data.preferred_days || [],
            tone: data.tone || "",
            archetype: data.archetype || "",
          });
        }
      } catch (error) {
        console.error("Error loading persona:", error);
      } finally {
        setLoading(false);
      }
    }
    loadPersona();
  }, [userId]);

  const toggleTopic = (topic: string) => {
    setPersona((prev) => {
      const current = prev.topics;
      if (current.includes(topic)) {
        return { ...prev, topics: current.filter((t) => t !== topic) };
      } else if (current.length < 5) {
        return { ...prev, topics: [...current, topic] };
      }
      return prev;
    });
  };

  const toggleDay = (day: string) => {
    setPersona((prev) => {
      const current = prev.preferred_days;
      if (current.includes(day)) {
        return { ...prev, preferred_days: current.filter((d) => d !== day) };
      } else if (current.length < 4) {
        return { ...prev, preferred_days: [...current, day] };
      }
      return prev;
    });
  };

  const updatePost = (index: number, field: keyof AdmiredPost, value: string) => {
    setPersona((prev) => {
      const posts = [...prev.admired_posts];
      posts[index] = { ...posts[index], [field]: value };
      return { ...prev, admired_posts: posts };
    });
  };

  const addPost = () => {
    if (persona.admired_posts.length < 3) {
      setPersona((prev) => ({
        ...prev,
        admired_posts: [...prev.admired_posts, { url: "", standout: "" }],
      }));
    }
  };

  const removePost = (index: number) => {
    setPersona((prev) => ({
      ...prev,
      admired_posts: prev.admired_posts.filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = async (index: number, file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("admired-posts").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("admired-posts").getPublicUrl(path);
      setPersona((prev) => {
        const posts = [...prev.admired_posts];
        posts[index] = { ...posts[index], imageUrl: urlData.publicUrl };
        return { ...prev, admired_posts: posts };
      });
    } catch (err) {
      console.error("Upload error:", err);
      toast({ title: "Upload failed", description: "Could not upload image.", variant: "destructive" });
    }
  };

  const removeImage = (index: number) => {
    setPersona((prev) => {
      const posts = [...prev.admired_posts];
      posts[index] = { ...posts[index], imageUrl: undefined };
      return { ...prev, admired_posts: posts };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await (supabase
        .from("personas" as any) as any)
        .upsert({
          user_id: userId,
          linkedin_url: persona.linkedin_url,
          industry: persona.industry,
          experience_range: persona.experience_range,
          location: persona.location,
          future_goal: persona.future_goal,
          topics: persona.topics,
          admired_posts: persona.admired_posts.filter((p) => p.url.trim() || p.imageUrl),
          no_go_topic: persona.no_go_topic,
          posts_per_week: persona.posts_per_week,
          preferred_days: persona.preferred_days,
          tone: persona.tone,
          archetype: persona.archetype,
        }, { onConflict: 'user_id' });

      if (error) throw error;

      // Also sync key fields to profiles
      await supabase
        .from("profiles")
        .update({
          industry: persona.industry,
          topics: persona.topics,
          posts_per_week: persona.posts_per_week,
          tone: persona.tone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      toast({ title: "Profile saved!", description: "Regenerating your persona..." });

      // Regenerate persona using the edge function
      const { data: result, error: fnError } = await supabase.functions.invoke("persona-agent", {
        body: {
          onboardingData: {
            industry: persona.industry,
            experienceRange: persona.experience_range,
            location: persona.location,
            futureGoal: persona.future_goal,
            linkedinUrl: persona.linkedin_url,
            topics: persona.topics,
            admiredPosts: persona.admired_posts.filter((p) => p.url.trim() || p.imageUrl),
            noGoTopic: persona.no_go_topic,
            postsPerWeek: persona.posts_per_week,
            preferredDays: persona.preferred_days,
            tone: persona.tone,
          },
        },
      });

      if (fnError) {
        console.error("Persona generation error:", fnError);
        toast({ title: "Profile saved", description: "But persona regeneration failed. You can regenerate it from the My Persona tab.", variant: "destructive" });
      } else {
        toast({ title: "Persona updated!", description: "Your LinkedIn strategy has been refreshed." });
      }
    } catch (err) {
      console.error("Error saving persona:", err);
      toast({ title: "Save failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading your profile...
        </CardContent>
      </Card>
    );
  }

  const charCount = persona.future_goal.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Profile</CardTitle>
        <CardDescription>
          Update your content persona — these settings shape how your posts are generated.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-8">
          {/* === Section 1: Professional Background === */}
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-foreground">Professional Background</h3>

            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn Profile URL</Label>
              <Input
                id="linkedinUrl"
                value={persona.linkedin_url}
                onChange={(e) => setPersona((p) => ({ ...p, linkedin_url: e.target.value }))}
                placeholder="https://linkedin.com/in/your-profile"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select
                value={persona.industry}
                onValueChange={(val) => setPersona((p) => ({ ...p, industry: val }))}
              >
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => (
                    <SelectItem key={i} value={i.toLowerCase().replace(/\s+/g, "-")}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Years of Experience</Label>
              <RadioGroup
                value={persona.experience_range}
                onValueChange={(val) => setPersona((p) => ({ ...p, experience_range: val }))}
                className="flex flex-wrap gap-3"
              >
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-md border cursor-pointer transition-colors ${
                      persona.experience_range === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-input hover:border-primary/40"
                    }`}
                  >
                    <RadioGroupItem value={opt.value} />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={persona.location}
                onChange={(e) => setPersona((p) => ({ ...p, location: e.target.value }))}
                placeholder="City, Country — e.g. Dubai, UAE"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="futureGoal">Where do you want to be professionally in 2 years?</Label>
              <Textarea
                id="futureGoal"
                value={persona.future_goal}
                onChange={(e) => {
                  if (e.target.value.length <= 150) {
                    setPersona((p) => ({ ...p, future_goal: e.target.value }));
                  }
                }}
                placeholder="e.g. Move into a VP role, launch my own consultancy"
                className="min-h-[80px]"
              />
              <p className={`text-xs text-right ${charCount >= 150 ? "text-destructive" : "text-muted-foreground"}`}>
                {charCount}/150
              </p>
            </div>
          </div>

          {/* === Section 2: Content Preferences === */}
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-foreground">Content Preferences</h3>

            <div className="space-y-3">
              <Label>Content Topics (select 3 to 5)</Label>
              <div className="flex flex-wrap gap-2">
                {[...new Set([...ALL_TOPICS, ...persona.topics])].map((topic) => {
                  const selected = persona.topics.includes(topic);
                  const isCustom = !ALL_TOPICS.includes(topic);
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
                      {isCustom && selected && (
                        <X className="inline h-3 w-3 ml-1" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add a custom topic..."
                  value={customTopicInput}
                  onChange={(e) => setCustomTopicInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomTopic();
                    }
                  }}
                  className="max-w-xs"
                />
                <Button type="button" variant="outline" size="sm" onClick={addCustomTopic}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Admired LinkedIn Posts</Label>
              {persona.admired_posts.map((post, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-input bg-background space-y-3">
                  <div className="flex items-start gap-2">
                    <Input
                      value={post.url}
                      onChange={(e) => updatePost(idx, "url", e.target.value)}
                      placeholder="https://linkedin.com/... or describe the topic"
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[idx]?.click()}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors border border-input rounded-md"
                      title="Upload screenshot"
                    >
                      <ImagePlus className="h-4 w-4" />
                    </button>
                    <input
                      ref={(el) => { fileInputRefs.current[idx] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(idx, file);
                      }}
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
                  {post.imageUrl && (
                    <div className="relative inline-block">
                      <img src={post.imageUrl} alt="Admired post" className="max-h-40 rounded-md border border-input object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
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
              {persona.admired_posts.length < 3 && (
                <button
                  type="button"
                  onClick={addPost}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add another post
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="noGoTopic">Topics to avoid</Label>
              <Input
                id="noGoTopic"
                value={persona.no_go_topic}
                onChange={(e) => setPersona((p) => ({ ...p, no_go_topic: e.target.value }))}
                placeholder="e.g. Politics, competitor names, salary discussions"
              />
            </div>
          </div>

          {/* === Section 3: Posting Rhythm === */}
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-foreground">Posting Rhythm</h3>

            <div className="space-y-3">
              <Label>Posts Per Week</Label>
              <RadioGroup
                value={persona.posts_per_week?.toString() || ""}
                onValueChange={(val) => setPersona((p) => ({ ...p, posts_per_week: parseInt(val) }))}
                className="space-y-2"
              >
                {POSTS_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      persona.posts_per_week === opt.value
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
            </div>

            <div className="space-y-3">
              <Label>Best Days to Post (select up to 4)</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const selected = persona.preferred_days.includes(day);
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
            </div>

            <div className="space-y-3">
              <Label>Preferred Content Tone</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {TONE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPersona((p) => ({ ...p, tone: opt.value }))}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      persona.tone === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-input hover:border-primary/40"
                    }`}
                  >
                    <span className="text-sm font-medium block">{opt.label}</span>
                    <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ProfileForm;

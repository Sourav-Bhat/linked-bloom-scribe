import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import useAuth from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import StepOne, { type StepOneData } from "@/components/onboarding/StepOne";
import StepTwo, { type StepTwoData } from "@/components/onboarding/StepTwo";
import StepThree, { type StepThreeData } from "@/components/onboarding/StepThree";
import PersonaSummary from "@/components/onboarding/PersonaSummary";
import { ArrowLeft } from "lucide-react";

type Screen = "step1" | "step2" | "step3" | "loading" | "summary";

function deriveArchetype(topics: string[]): string {
  const oracleTopics = ["Industry Trends", "Innovation", "Future of Work"];
  const builderTopics = ["Entrepreneurship", "Productivity", "Career Growth"];
  const connectorTopics = ["Leadership", "Team Culture", "Hiring and Talent"];

  const oracleCount = topics.filter((t) => oracleTopics.includes(t)).length;
  const builderCount = topics.filter((t) => builderTopics.includes(t)).length;
  const connectorCount = topics.filter((t) => connectorTopics.includes(t)).length;

  if (oracleCount >= builderCount && oracleCount >= connectorCount && oracleCount > 0) return "The Oracle";
  if (connectorCount >= builderCount && connectorCount > 0) return "The Connector";
  return "The Builder";
}

const Onboarding = () => {
  const { user, setOnboardingCompleted } = useAuth();
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>("step1");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [stepOne, setStepOne] = useState<StepOneData>({
    industry: "",
    experienceRange: "",
    location: "",
    futureGoal: "",
  });

  const [stepTwo, setStepTwo] = useState<StepTwoData>({
    topics: [],
    admiredPosts: [{ url: "", standout: "" }],
    noGoTopic: "",
  });

  const [stepThree, setStepThree] = useState<StepThreeData>({
    postsPerWeek: null,
    preferredDays: [],
    tone: "",
  });

  const [archetype, setArchetype] = useState("The Builder");

  const validateStepOne = (): boolean => {
    const e: Record<string, string> = {};
    if (!stepOne.industry) e.industry = "Please select an industry";
    if (!stepOne.experienceRange) e.experienceRange = "Please select your experience level";
    if (!stepOne.location.trim()) e.location = "Please enter your location";
    if (!stepOne.futureGoal.trim()) e.futureGoal = "Please share your future goal";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStepTwo = (): boolean => {
    const e: Record<string, string> = {};
    if (stepTwo.topics.length < 3 || stepTwo.topics.length > 5) {
      e.topics = "Please select between 3 and 5 topics";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStepThree = (): boolean => {
    const e: Record<string, string> = {};
    if (!stepThree.postsPerWeek) e.postsPerWeek = "Please select how often you want to post";
    if (stepThree.preferredDays.length === 0) e.preferredDays = "Please select at least 1 day";
    if (!stepThree.tone) e.tone = "Please select a content tone";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (screen === "step1" && validateStepOne()) {
      setErrors({});
      setScreen("step2");
    } else if (screen === "step2" && validateStepTwo()) {
      setErrors({});
      setScreen("step3");
    }
  };

  const handleBack = () => {
    setErrors({});
    if (screen === "step2") setScreen("step1");
    else if (screen === "step3") setScreen("step2");
  };

  const handleSubmit = async () => {
    if (!validateStepThree() || !user) return;

    const computedArchetype = deriveArchetype(stepTwo.topics);
    setArchetype(computedArchetype);
    setScreen("loading");

    try {
      // Save persona
      const { error: personaError } = await supabase
        .from("personas" as any)
        .upsert({
          user_id: user.id,
          industry: stepOne.industry,
          experience_range: stepOne.experienceRange,
          location: stepOne.location,
          future_goal: stepOne.futureGoal,
          topics: stepTwo.topics,
          admired_posts: stepTwo.admiredPosts.filter((p) => p.url.trim()),
          no_go_topic: stepTwo.noGoTopic,
          posts_per_week: stepThree.postsPerWeek,
          preferred_days: stepThree.preferredDays,
          tone: stepThree.tone,
          archetype: computedArchetype,
        } as any);

      if (personaError) throw personaError;

      // Update profile onboarding status
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          industry: stepOne.industry,
          topics: stepTwo.topics,
          posts_per_week: stepThree.postsPerWeek,
          tone: stepThree.tone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      setOnboardingCompleted?.(true);

      // Show loading briefly then summary
      setTimeout(() => setScreen("summary"), 2500);
    } catch (error) {
      console.error("Error saving persona:", error);
      toast({
        title: "Error saving your profile",
        description: "Please try again.",
        variant: "destructive",
      });
      setScreen("step3");
    }
  };

  const stepNumber = screen === "step1" ? 1 : screen === "step2" ? 2 : 3;
  const progressValue = screen === "step1" ? 33 : screen === "step2" ? 66 : 100;

  if (screen === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-onboarding-bg p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto" />
          <h2 className="text-xl font-semibold text-primary">Building your LinkedIn strategy...</h2>
          <p className="text-sm text-muted-foreground">This will only take a moment</p>
        </div>
      </div>
    );
  }

  if (screen === "summary") {
    return (
      <PersonaSummary
        archetype={archetype}
        topics={stepTwo.topics}
        postsPerWeek={stepThree.postsPerWeek!}
        preferredDays={stepThree.preferredDays}
        tone={stepThree.tone}
      />
    );
  }

  return (
    <div className="min-h-screen bg-onboarding-bg flex flex-col">
      {/* Header */}
      <div className="w-full max-w-2xl mx-auto px-4 pt-8 pb-4 space-y-3">
        <p className="text-sm text-muted-foreground">Set up your content profile</p>
        <div className="flex items-center gap-3">
          <Progress value={progressValue} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">Step {stepNumber} of 3</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 w-full max-w-2xl mx-auto px-4 pb-8">
        <div className="bg-background rounded-xl border border-input p-6 sm:p-8">
          {screen === "step1" && <StepOne data={stepOne} onChange={setStepOne} errors={errors} />}
          {screen === "step2" && <StepTwo data={stepTwo} onChange={setStepTwo} errors={errors} />}
          {screen === "step3" && <StepThree data={stepThree} onChange={setStepThree} errors={errors} />}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {screen !== "step1" ? (
              <Button variant="ghost" onClick={handleBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <div />
            )}

            {screen === "step3" ? (
              <Button onClick={handleSubmit}>Submit</Button>
            ) : (
              <Button onClick={handleNext}>Next</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

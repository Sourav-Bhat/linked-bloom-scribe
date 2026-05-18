import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import useAuth from "@/features/auth/useAuth";
import { getIdToken } from "@/features/auth/authService";
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import StepOne, { type StepOneData } from "@/features/onboarding/StepOne";
import StepTwo, { type StepTwoData } from "@/features/onboarding/StepTwo";
import StepThree, { type StepThreeData } from "@/features/onboarding/StepThree";
import PersonaSummary from "@/features/onboarding/PersonaSummary";
import { ArrowLeft } from "lucide-react";

type Screen = "step1" | "step2" | "step3" | "summary";

const PERSONA_AGENT_URL = `${import.meta.env.VITE_CLOUD_FUNCTIONS_BASE_URL}/personaAgent`;

const Onboarding = () => {
  const { user } = useAuth();
  const [screen, setScreen] = useState<Screen>("step1");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [stepOne, setStepOne] = useState<StepOneData>({
    industry: "",
    experienceRange: "",
    location: "",
    futureGoal: "",
    linkedinUrl: "",
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

  const [personaData, setPersonaData] = useState<any>(null);
  const [personaLoading, setPersonaLoading] = useState(false);
  const [personaError, setPersonaError] = useState<string | null>(null);

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

  const callPersonaAgent = useCallback(async () => {
    if (!user) return;

    setPersonaLoading(true);
    setPersonaError(null);
    setScreen("summary");

    const onboardingData = {
      industry: stepOne.industry,
      experienceRange: stepOne.experienceRange,
      location: stepOne.location,
      futureGoal: stepOne.futureGoal,
      linkedinUrl: stepOne.linkedinUrl,
      topics: stepTwo.topics,
      admiredPosts: stepTwo.admiredPosts.filter((p) => p.url.trim() || p.imageUrl),
      noGoTopic: stepTwo.noGoTopic,
      postsPerWeek: stepThree.postsPerWeek,
      preferredDays: stepThree.preferredDays,
      tone: stepThree.tone,
    };

    // Persist onboarding data to Firestore before calling the function
    try {
      await setDoc(
        doc(db, 'users', user.uid, 'persona', 'main'),
        { ...onboardingData, updatedAt: new Date().toISOString() },
        { merge: true },
      );
    } catch {
      // non-fatal — continue
    }

    try {
      const token = await getIdToken();
      const res = await fetch(PERSONA_AGENT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ onboardingData, userId: user.uid }),
      });

      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const responseData = await res.json();

      if (responseData?.persona) {
        setPersonaData(responseData.persona);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      console.error("Persona agent error:", err);
      setPersonaError(err.message || "Failed to generate persona");
    } finally {
      setPersonaLoading(false);
    }
  }, [user, stepOne, stepTwo, stepThree]);

  const handleSubmit = () => {
    if (!validateStepThree() || !user) return;
    callPersonaAgent();
  };

  const handleRetry = () => {
    callPersonaAgent();
  };

  if (screen === "summary") {
    return (
      <PersonaSummary
        persona={personaData}
        isLoading={personaLoading}
        error={personaError}
        onRetry={handleRetry}
      />
    );
  }

  const stepNumber = screen === "step1" ? 1 : screen === "step2" ? 2 : 3;
  const progressValue = screen === "step1" ? 33 : screen === "step2" ? 66 : 100;

  return (
    <div className="min-h-screen bg-onboarding-bg flex flex-col">
      <div className="w-full max-w-2xl mx-auto px-4 pt-8 pb-4 space-y-3">
        <p className="text-sm text-muted-foreground">Set up your content profile</p>
        <div className="flex items-center gap-3">
          <Progress value={progressValue} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">Step {stepNumber} of 3</span>
        </div>
      </div>

      <div className="flex-1 w-full max-w-2xl mx-auto px-4 pb-8">
        <div className="bg-background rounded-xl border border-input p-6 sm:p-8">
          {screen === "step1" && <StepOne data={stepOne} onChange={setStepOne} errors={errors} />}
          {screen === "step2" && <StepTwo data={stepTwo} onChange={setStepTwo} errors={errors} />}
          {screen === "step3" && <StepThree data={stepThree} onChange={setStepThree} errors={errors} />}

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

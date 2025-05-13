
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getUserProfile, hasCompletedProfile } from "@/services/profileService";
import useAuth from "@/hooks/useAuth";
import { UserProfile } from "@/lib/types";
import ProfileForm from "@/components/profile/ProfileForm";
import ApiKeySettings from "@/components/profile/ApiKeySettings";

// Initial profile state matching our UserProfile type
const initialProfile: Partial<UserProfile> = {
  full_name: "",
  industry: "",
  job_title: "",
  topics: [],
  posts_per_week: 3,
  tone: "professional",
  company: "",
  bio: "",
};

const llmProviderOptions = [
  { label: "OpenAI", value: "openai" },
  { label: "Gemini", value: "gemini" }
];

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Partial<UserProfile>>(initialProfile);
  const [topicsInput, setTopicsInput] = useState("");
  const [isNewProfile, setIsNewProfile] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (user) {
        try {
          const data = await getUserProfile(user.id);
          if (data) {
            // Format topics as string for the input field
            setTopicsInput(Array.isArray(data.topics) ? data.topics.join(", ") : "");
            
            // Cast tone to the expected union type if needed
            const profileTone = data.tone as UserProfile["tone"] || "professional";
            
            setProfile({
              ...data,
              tone: profileTone
            });
            
            // Check if basic profile details exist
            const hasProfile = await hasCompletedProfile(user.id);
            setIsNewProfile(!hasProfile);
          }
        } catch (error) {
          console.error("Error loading profile:", error);
        }
      }
    }
    loadProfile();
  }, [user]);

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        {isNewProfile ? "Complete Your Profile" : "Content Profile"}
      </h1>
      
      {isNewProfile && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800">
            Please complete your basic profile information to continue.
          </p>
        </div>
      )}
      
      <div className="space-y-8">
        <ProfileForm 
          profile={profile}
          setProfile={setProfile}
          topicsInput={topicsInput}
          setTopicsInput={setTopicsInput}
          isNewProfile={isNewProfile}
          userId={user.id}
        />
        
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">API Settings</h2>
            <ApiKeySettings llmProviderOptions={llmProviderOptions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;

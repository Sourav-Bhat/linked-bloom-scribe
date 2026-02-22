
import useAuth from "@/hooks/useAuth";
import ProfileForm from "@/components/profile/ProfileForm";
import ApiKeySettings from "@/components/profile/ApiKeySettings";
import { Card, CardContent } from "@/components/ui/card";

const llmProviderOptions = [
  { label: "OpenAI", value: "openai" },
  { label: "Gemini", value: "gemini" }
];

const Profile = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Content Profile</h1>

      <div className="space-y-8">
        <ProfileForm
          profile={{}}
          setProfile={() => {}}
          topicsInput=""
          setTopicsInput={() => {}}
          isNewProfile={false}
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

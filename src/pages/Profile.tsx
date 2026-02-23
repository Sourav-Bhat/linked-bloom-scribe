
import useAuth from "@/hooks/useAuth";
import ProfileForm from "@/components/profile/ProfileForm";
import PersonaDisplay from "@/components/profile/PersonaDisplay";
import ApiKeySettings from "@/components/profile/ApiKeySettings";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const llmProviderOptions = [
  { label: "OpenAI", value: "openai" },
  { label: "Gemini", value: "gemini" }
];

const Profile = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>

      <Tabs defaultValue="persona" className="space-y-6">
        <TabsList>
          <TabsTrigger value="persona">My Persona</TabsTrigger>
          <TabsTrigger value="settings">Edit Profile</TabsTrigger>
          <TabsTrigger value="api">API Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="persona">
          <PersonaDisplay userId={user.id} />
        </TabsContent>

        <TabsContent value="settings">
          <ProfileForm
            profile={{}}
            setProfile={() => {}}
            topicsInput=""
            setTopicsInput={() => {}}
            isNewProfile={false}
            userId={user.id}
          />
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">API Settings</h2>
              <ApiKeySettings llmProviderOptions={llmProviderOptions} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;

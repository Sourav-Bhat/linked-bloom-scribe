
import useAuth from "@/features/auth/useAuth";
import ProfileForm from "@/features/profile/ProfileForm";
import PersonaDisplay from "@/features/profile/PersonaDisplay";
import PrAgentChat from "@/features/profile/PrAgentChat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Profile = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>

      <Tabs defaultValue="persona" className="space-y-6">
        <TabsList>
          <TabsTrigger value="persona">My Persona</TabsTrigger>
          <TabsTrigger value="agent">PR Agent</TabsTrigger>
          <TabsTrigger value="settings">Edit Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="persona">
          <PersonaDisplay userId={user.uid} />
        </TabsContent>

        <TabsContent value="agent">
          <PrAgentChat userId={user.uid} />
        </TabsContent>

        <TabsContent value="settings">
          <ProfileForm
            profile={{}}
            setProfile={() => {}}
            topicsInput=""
            setTopicsInput={() => {}}
            isNewProfile={false}
            userId={user.uid}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;

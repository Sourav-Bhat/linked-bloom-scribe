
import useAuth from "@/features/auth/useAuth";
import ProfileForm from "@/features/profile/ProfileForm";
import PersonaDisplay from "@/features/profile/PersonaDisplay";
import PrAgentChat from "@/features/profile/PrAgentChat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Profile = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Persona &amp; Agent</h1>
        <p className="mt-1 max-w-[60ch] text-brand-500">
          The engine behind every post — and the strategist that keeps refining it as it learns about you.
        </p>
      </div>

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

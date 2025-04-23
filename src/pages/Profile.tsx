import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { saveUserProfile, getUserProfile } from "@/services/profileService";
import useAuth from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";

// Initial profile data
const initialProfile = {
  name: "John Doe",
  industry: "Technology",
  role: "Product Manager",
  topics: "Product Management, UX Design, Technology Trends",
  postsPerWeek: "3",
  tone: "professional"
};

const llmProviderOptions = [
  { label: "OpenAI", value: "openai" },
  { label: "Gemini", value: "gemini" }
];

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(initialProfile);

  // LLM API Key & Provider state
  const [llmProvider, setLlmProvider] = useState("openai");
  const [llmApiKey, setLlmApiKey] = useState("");
  const [keySaved, setKeySaved] = useState(false);

  // Load profile from Firestore
  useEffect(() => {
    async function loadProfile() {
      if (user) {
        const data = await getUserProfile(user.uid);
        if (data) setProfile(prev => ({ ...prev, ...data }));
      }
    }
    loadProfile();
    const savedProvider = localStorage.getItem("llmProvider") || "openai";
    const savedKey = localStorage.getItem("llmApiKey") || "";
    setLlmProvider(savedProvider);
    setLlmApiKey(savedKey);
  }, [user]);

  // Save key/provider to localStorage
  const handleApiKeySave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("llmProvider", llmProvider);
    localStorage.setItem("llmApiKey", llmApiKey);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await saveUserProfile(user.uid, profile);
      toast({ title: "Profile updated!", description: "Your preferences have been saved." });
    } catch (err) {
      toast({ title: "Profile save failed", description: "Please try again.", variant: "destructive" });
    }
    // Optionally: auto-generate drafts here on save
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Content Profile</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Customize how your content is generated based on your professional profile.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                name="name"
                value={profile.name}
                onChange={handleChange}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input 
                id="industry" 
                name="industry"
                value={profile.industry}
                onChange={handleChange}
                placeholder="Your industry"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Professional Role</Label>
              <Input 
                id="role" 
                name="role"
                value={profile.role}
                onChange={handleChange}
                placeholder="Your current role"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topics">Topics of Interest</Label>
              <Textarea
                id="topics" 
                name="topics"
                value={profile.topics}
                onChange={handleChange}
                placeholder="Topics you want to post about (comma separated)"
                className="min-h-[100px]"
              />
              <p className="text-sm text-muted-foreground">
                Enter topics separated by commas that you want to focus on in your content
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postsPerWeek">Posts Per Week</Label>
                <Select 
                  value={profile.postsPerWeek}
                  onValueChange={(value) => handleSelectChange("postsPerWeek", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Posting Frequency</SelectLabel>
                      <SelectItem value="1">1 post / week</SelectItem>
                      <SelectItem value="2">2 posts / week</SelectItem>
                      <SelectItem value="3">3 posts / week</SelectItem>
                      <SelectItem value="5">5 posts / week</SelectItem>
                      <SelectItem value="7">7 posts / week</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Content Tone</Label>
                <Select 
                  value={profile.tone}
                  onValueChange={(value) => handleSelectChange("tone", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Tone</SelectLabel>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="authoritative">Authoritative</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="inspirational">Inspirational</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* LLM API Key & Provider Section */}
            <div className="space-y-2 pt-2">
              <Label htmlFor="llmProvider">AI Provider</Label>
              <Select
                value={llmProvider}
                onValueChange={setLlmProvider}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select AI Provider" />
                </SelectTrigger>
                <SelectContent>
                  {llmProviderOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label htmlFor="llmApiKey" className="mt-3">API Key for {llmProvider === "openai" ? "OpenAI" : "Gemini"}</Label>
              <Input
                id="llmApiKey"
                name="llmApiKey"
                type="text"
                value={llmApiKey}
                placeholder={`Enter your ${llmProvider === "openai" ? "OpenAI" : "Gemini"} API Key`}
                onChange={e => setLlmApiKey(e.target.value)}
                className="w-full"
              />
              <form onSubmit={handleApiKeySave}>
                <Button type="submit" size="sm" className="mt-2">Save API Key</Button>
                {keySaved && <span className="text-green-600 text-sm ml-3">Key saved!</span>}
              </form>
              <div className="text-xs text-muted-foreground mt-1">
                Your API key is stored locally in your browser only.
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline">Reset</Button>
            <Button type="submit">Save Profile</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Profile;

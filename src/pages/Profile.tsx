
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
import { UserProfile } from "@/lib/types";

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

  const [llmProvider, setLlmProvider] = useState("openai");
  const [llmApiKey, setLlmApiKey] = useState("");
  const [keySaved, setKeySaved] = useState(false);

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
          }
        } catch (error) {
          console.error("Error loading profile:", error);
        }
      }
    }
    loadProfile();
    const savedProvider = localStorage.getItem("llmProvider") || "openai";
    const savedKey = localStorage.getItem("llmApiKey") || "";
    setLlmProvider(savedProvider);
    setLlmApiKey(savedKey);
  }, [user]);

  const handleApiKeySave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("llmProvider", llmProvider);
    localStorage.setItem("llmApiKey", llmApiKey);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === "topics") {
      setTopicsInput(value);
    } else {
      setProfile(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "tone") {
      // Ensure tone is properly typed as the union type
      setProfile(prev => ({ 
        ...prev, 
        [name]: value as UserProfile["tone"] 
      }));
    } else if (name === "posts_per_week") {
      // Convert posts_per_week to number
      setProfile(prev => ({ 
        ...prev, 
        [name]: parseInt(value, 10) 
      }));
    } else {
      setProfile(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      // Convert topics from input string to array
      const topicsArray = topicsInput.split(',').map(t => t.trim()).filter(t => t);
      
      const preparedProfile: Partial<UserProfile> = {
        ...profile,
        topics: topicsArray,
      };
      
      await saveUserProfile(user.id, preparedProfile);
      toast({ title: "Profile updated!", description: "Your preferences have been saved." });
    } catch (err) {
      toast({ title: "Profile save failed", description: "Please try again.", variant: "destructive" });
    }
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
              <Label htmlFor="full_name">Full Name</Label>
              <Input 
                id="full_name" 
                name="full_name"
                value={profile.full_name || ""}
                onChange={handleChange}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input 
                id="industry" 
                name="industry"
                value={profile.industry || ""}
                onChange={handleChange}
                placeholder="Your industry"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_title">Professional Role</Label>
              <Input 
                id="job_title" 
                name="job_title"
                value={profile.job_title || ""}
                onChange={handleChange}
                placeholder="Your current role"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topics">Topics of Interest</Label>
              <Textarea
                id="topics" 
                name="topics"
                value={topicsInput}
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
                <Label htmlFor="posts_per_week">Posts Per Week</Label>
                <Select 
                  value={profile.posts_per_week?.toString() || "3"}
                  onValueChange={(value) => handleSelectChange("posts_per_week", value)}
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
                  value={profile.tone || "professional"}
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

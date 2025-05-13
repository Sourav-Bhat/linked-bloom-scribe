
import { useState } from "react";
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
import { saveUserProfile } from "@/services/profileService";
import { toast } from "@/components/ui/use-toast";
import { UserProfile } from "@/lib/types";

interface ProfileFormProps {
  profile: Partial<UserProfile>;
  setProfile: React.Dispatch<React.SetStateAction<Partial<UserProfile>>>;
  topicsInput: string;
  setTopicsInput: React.Dispatch<React.SetStateAction<string>>;
  isNewProfile: boolean;
  userId: string;
}

export const ProfileForm = ({
  profile,
  setProfile,
  topicsInput,
  setTopicsInput,
  isNewProfile,
  userId
}: ProfileFormProps) => {
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
    try {
      // Convert topics from input string to array
      const topicsArray = topicsInput.split(',').map(t => t.trim()).filter(t => t);
      
      const preparedProfile: Partial<UserProfile> = {
        ...profile,
        topics: topicsArray,
      };
      
      await saveUserProfile(userId, preparedProfile);
      toast({ title: "Profile updated!", description: "Your preferences have been saved." });
    } catch (err) {
      toast({ title: "Profile save failed", description: "Please try again.", variant: "destructive" });
    }
  };

  return (
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
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline">Reset</Button>
          <Button type="submit">Save Profile</Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ProfileForm;

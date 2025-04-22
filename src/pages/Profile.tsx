
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

// Initial profile data
const initialProfile = {
  name: "John Doe",
  industry: "Technology",
  role: "Product Manager",
  topics: "Product Management, UX Design, Technology Trends",
  postsPerWeek: "3",
  tone: "professional"
};

const Profile = () => {
  const [profile, setProfile] = useState(initialProfile);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save profile logic would go here
    alert("Profile updated successfully!");
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

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveGeneratedContent, getUserContents, updateContentStatus } from "@/services/contentService";
import useAuth from "@/hooks/useAuth";

const Generator = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    topic: "",
    tone: "professional",
    instructions: "",
    includeHashtags: true,
    postLength: "medium",
  });

  useEffect(() => {
    async function loadDrafts() {
      if (user) {
        const drafts = await getUserContents(user.uid, "draft");
        setDrafts(drafts);
      }
    }
    loadDrafts();
  }, [user, generatedContent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    // Simulate AI generation with a delay
    setTimeout(() => {
      const mockContent = {
        title: "Revolutionizing Product Design with AI-Powered User Research",
        content: `As product managers, we're constantly seeking ways to understand our users better. I've recently integrated AI into our user research process, and the results have been eye-opening.

Here's what we've learned:

1. AI can analyze thousands of customer interactions in minutes, revealing patterns humans might miss
2. Sentiment analysis helps prioritize features based on emotional impact
3. Predictive modeling allows us to test hypotheses without costly prototypes

The most surprising insight? Users often don't explicitly state their most significant pain points - AI helps uncover these hidden frustrations.

What tools are you using to enhance your user research? I'd love to hear your experiences.`,
        hashtags: "#ProductManagement #AI #UserResearch #ProductDesign #Innovation"
      };
      
      setGeneratedContent(mockContent);
      setIsGenerating(false);
      
      toast({
        title: "Content Generated",
        description: "Your LinkedIn post has been created and saved as a draft.",
      });
    }, 2000);
  };

  const handleSaveDraft = async () => {
    if (!user || !generatedContent) return;
    await saveGeneratedContent(user.uid, {
      ...generatedContent,
      topic: formData.topic,
      tone: formData.tone,
      status: "draft"
    });
    toast({ title: "Draft saved!", description: "You can review or finalize this post later." });
    setGeneratedContent(null);
  };

  const handleFinalizeDraft = async (id: string) => {
    await updateContentStatus(id, "final");
    toast({ title: "Draft finalized!", description: "You can now schedule this post." });
    if (user) {
      const drafts = await getUserContents(user.uid, "draft");
      setDrafts(drafts);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Content Generator</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Create New LinkedIn Post</CardTitle>
              <CardDescription>
                Generate a professional LinkedIn post based on your specifications
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Post Topic</Label>
                  <Input
                    id="topic"
                    name="topic"
                    value={formData.topic}
                    onChange={handleChange}
                    placeholder="e.g., AI in Product Management"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="instructions">Special Instructions</Label>
                  <Textarea
                    id="instructions"
                    name="instructions"
                    value={formData.instructions}
                    onChange={handleChange}
                    placeholder="Any specific points you'd like to include..."
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tone">Content Tone</Label>
                    <Select
                      value={formData.tone}
                      onValueChange={(value) => handleSelectChange("tone", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="authoritative">Authoritative</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                        <SelectItem value="inspirational">Inspirational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="postLength">Post Length</Label>
                    <Select
                      value={formData.postLength}
                      onValueChange={(value) => handleSelectChange("postLength", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select length" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short (50-100 words)</SelectItem>
                        <SelectItem value="medium">Medium (100-200 words)</SelectItem>
                        <SelectItem value="long">Long (200-300 words)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeHashtags"
                    name="includeHashtags"
                    checked={formData.includeHashtags}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="includeHashtags" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Include relevant hashtags
                  </Label>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button type="submit" disabled={isGenerating} className="w-full">
                  {isGenerating ? "Generating..." : "Generate Post"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
        
        <div>
          {generatedContent ? (
            <Card>
              <CardHeader>
                <CardTitle>Generated Post</CardTitle>
                <CardDescription>Preview your LinkedIn post</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg mb-2">{generatedContent.title}</h3>
                  <div className="whitespace-pre-line text-gray-700">
                    {generatedContent.content}
                  </div>
                  {formData.includeHashtags && (
                    <div className="mt-4 text-blue-600">
                      {generatedContent.hashtags}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button variant="outline" onClick={handleSaveDraft}>Save as Draft</Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Your Drafts</CardTitle>
                <CardDescription>Review or finalize your drafts below.</CardDescription>
              </CardHeader>
              <CardContent>
                {drafts && drafts.length > 0 ? (
                  <ul className="space-y-3">
                    {drafts.map((draft: any) => (
                      <li key={draft.id} className="border rounded px-3 py-2 flex justify-between items-center">
                        <span>{draft.title || draft.topic}</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleFinalizeDraft(draft.id)}>Finalize</Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-sm text-gray-500">No drafts found. Generate new content to save as drafts.</span>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Generator;

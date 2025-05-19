
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
import { ContentPost } from "@/lib/types";
import { RefreshCw, Edit, Save } from "lucide-react";

const Generator = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<Partial<ContentPost> | null>(null);
  const [drafts, setDrafts] = useState<ContentPost[]>([]);
  const [formData, setFormData] = useState({
    topic: "",
    tone: "professional",
    instructions: "",
    includeHashtags: true,
    postLength: "medium",
  });
  const [regeneratePrompt, setRegeneratePrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedHashtags, setEditedHashtags] = useState("");

  useEffect(() => {
    async function loadDrafts() {
      if (user) {
        try {
          const userDrafts = await getUserContents(user.id);
          // Convert the data to match our ContentPost type
          const formattedDrafts = userDrafts.map((draft: any) => ({
            ...draft,
            scheduledDate: draft.scheduled_date,
            publishedDate: draft.published_date
          })) as ContentPost[];
          setDrafts(formattedDrafts);
        } catch (error) {
          console.error("Error loading drafts:", error);
          toast({
            title: "Error",
            description: "Failed to load drafts. Please try again.",
            variant: "destructive",
          });
        }
      }
    }
    loadDrafts();
  }, [user]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsGenerating(true);
    try {
      const generatedPost: Partial<ContentPost> = {
        title: "Revolutionizing Product Design with AI-Powered User Research",
        content: `As product managers, we're constantly seeking ways to understand our users better. I've recently integrated AI into our user research process, and the results have been eye-opening.

Here's what we've learned:

1. AI can analyze thousands of customer interactions in minutes, revealing patterns humans might miss
2. Sentiment analysis helps prioritize features based on emotional impact
3. Predictive modeling allows us to test hypotheses without costly prototypes

The most surprising insight? Users often don't explicitly state their most significant pain points - AI helps uncover these hidden frustrations.

What tools are you using to enhance your user research? I'd love to hear your experiences.`,
        hashtags: "#ProductManagement #AI #UserResearch #ProductDesign #Innovation",
        status: "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user.id
      };

      setGeneratedContent(generatedPost);
      setEditedTitle(generatedPost.title || "");
      setEditedContent(generatedPost.content || "");
      setEditedHashtags(generatedPost.hashtags || "");
      toast({
        title: "Content Generated",
        description: "Your LinkedIn post has been created. You can edit it before saving.",
      });
    } catch (error) {
      console.error("Error generating content:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleRegenerateContent = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    try {
      // In a real implementation, this would use the regeneratePrompt to
      // create new content via an API call. For now, we'll simulate it.
      const generatedPost: Partial<ContentPost> = {
        title: "New Insights: " + formData.topic,
        content: `Based on your request: "${regeneratePrompt}", here's a fresh perspective on ${formData.topic}.

AI-driven research reveals that companies adopting sustainable practices see a 23% increase in customer loyalty. When we examine the data more carefully:

1. Environmental initiatives correlate strongly with millennial and Gen-Z purchase decisions
2. Transparent sustainability reporting increases trust by 37%
3. Companies with clear climate commitments outperform peers in long-term growth

The key takeaway? Sustainability isn't just good for the planet - it's becoming essential for business success.

What sustainability practices have you implemented in your organization?`,
        hashtags: "#Sustainability #BusinessStrategy #ClimateAction #Innovation #FutureOfBusiness",
        status: "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user.id
      };

      setGeneratedContent(generatedPost);
      setEditedTitle(generatedPost.title || "");
      setEditedContent(generatedPost.content || "");
      setEditedHashtags(generatedPost.hashtags || "");
      setRegeneratePrompt("");
      toast({
        title: "Content Regenerated",
        description: "Your LinkedIn post has been updated with fresh content.",
      });
    } catch (error) {
      console.error("Error regenerating content:", error);
      toast({
        title: "Regeneration Failed",
        description: "Failed to regenerate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveContent = async () => {
    if (!user || !generatedContent) return;
    
    try {
      const contentToSave = isEditing ? {
        ...generatedContent,
        title: editedTitle,
        content: editedContent,
        hashtags: editedHashtags
      } : generatedContent;
      
      await saveGeneratedContent(user.id, {
        ...contentToSave,
        topic: formData.topic,
        tone: formData.tone,
      });
      
      toast({ 
        title: "Draft Saved", 
        description: "Your content has been saved as a draft." 
      });
      
      setGeneratedContent(null);
      setEditedTitle("");
      setEditedContent("");
      setEditedHashtags("");
      setIsEditing(false);
      setFormData({
        topic: "",
        tone: "professional",
        instructions: "",
        includeHashtags: true,
        postLength: "medium",
      });
      
      const updatedDrafts = await getUserContents(user.id);
      const formattedDrafts = updatedDrafts.map((draft: any) => ({
        ...draft,
        scheduledDate: draft.scheduled_date,
        publishedDate: draft.published_date
      })) as ContentPost[];
      setDrafts(formattedDrafts);
    } catch (error) {
      console.error("Error saving content:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFinalizeDraft = async (id: string) => {
    if (!user) return;
    
    try {
      await updateContentStatus(user.id, id, "final");
      toast({ 
        title: "Draft Finalized", 
        description: "The draft is now marked as final." 
      });
      
      const updatedDrafts = await getUserContents(user.id);
      const formattedDrafts = updatedDrafts.map((draft: any) => ({
        ...draft,
        scheduledDate: draft.scheduled_date,
        publishedDate: draft.published_date
      })) as ContentPost[];
      setDrafts(formattedDrafts);
    } catch (error) {
      console.error("Error finalizing draft:", error);
      toast({
        title: "Error",
        description: "Failed to finalize draft. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleEditMode = () => {
    if (!isEditing && generatedContent) {
      setEditedTitle(generatedContent.title || "");
      setEditedContent(generatedContent.content || "");
      setEditedHashtags(generatedContent.hashtags || "");
    }
    setIsEditing(!isEditing);
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
                <div className="flex gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={toggleEditMode}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    {isEditing ? "View Preview" : "Edit Content"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="editTitle">Title</Label>
                      <Input
                        id="editTitle"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editContent">Content</Label>
                      <Textarea
                        id="editContent"
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="min-h-[250px]"
                      />
                    </div>
                    {formData.includeHashtags && (
                      <div className="space-y-2">
                        <Label htmlFor="editHashtags">Hashtags</Label>
                        <Input
                          id="editHashtags"
                          value={editedHashtags}
                          onChange={(e) => setEditedHashtags(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h3 className="font-bold text-lg mb-2">{isEditing ? editedTitle : generatedContent.title}</h3>
                    <div className="whitespace-pre-line text-gray-700">
                      {isEditing ? editedContent : generatedContent.content}
                    </div>
                    {formData.includeHashtags && (
                      <div className="mt-4 text-blue-600">
                        {isEditing ? editedHashtags : generatedContent.hashtags}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="regeneratePrompt">Regenerate with additional instructions</Label>
                    <div className="flex gap-2">
                      <Textarea
                        id="regeneratePrompt"
                        value={regeneratePrompt}
                        onChange={(e) => setRegeneratePrompt(e.target.value)}
                        placeholder="Add instructions to refine the post..."
                        className="flex-1"
                      />
                      <Button 
                        variant="outline" 
                        onClick={handleRegenerateContent}
                        disabled={isGenerating || regeneratePrompt.trim() === ""}
                        className="self-end"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Regenerate
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button variant="outline" onClick={handleSaveContent} className="flex items-center gap-1">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
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

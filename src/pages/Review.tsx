
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, RefreshCw, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Mock post data
const mockPosts = {
  "1": {
    title: "10 Tips for LinkedIn Networking",
    content: `LinkedIn networking is essential for modern professionals. Here are my top 10 tips:

1. Complete your profile 100%
2. Use a professional photo
3. Personalize connection requests
4. Engage with content regularly
5. Share valuable insights
6. Join relevant groups
7. Follow industry leaders
8. Celebrate others' achievements 
9. Focus on quality over quantity
10. Be consistent in your activity

What networking strategies work best for you?`,
    hashtags: "#LinkedInTips #Networking #ProfessionalDevelopment #CareerAdvice",
    scheduledDate: "2025-04-23T09:00:00Z",
    versions: [
      {
        date: "2025-03-15T14:30:00Z",
        content: `Want to improve your LinkedIn networking? Here are 10 essential tips:

1. Complete your profile 100%
2. Use a professional photo
3. Personalize connection requests
4. Engage with content regularly
5. Share valuable insights
6. Join relevant groups
7. Follow industry leaders
8. Celebrate others' achievements
9. Focus on quality over quantity
10. Be consistent in your activity

What strategies have worked for you?`,
        hashtags: "#LinkedIn #Networking #CareerTips",
      }
    ]
  },
  "2": {
    title: "How to Optimize Your LinkedIn Profile",
    content: `Your LinkedIn profile is your digital business card. Here's how to make it stand out:

✅ Use a professional, approachable headshot
✅ Craft a compelling headline beyond just your job title
✅ Write an engaging summary that tells your professional story
✅ Showcase results in your experience section, not just responsibilities
✅ Include rich media like presentations and projects
✅ Gather recommendations from colleagues and clients
✅ List relevant skills and endorsements

A well-optimized profile generates 5x more views and opportunities!

What other LinkedIn optimization tips would you add?`,
    hashtags: "#LinkedIn #ProfileOptimization #PersonalBranding #CareerGrowth",
    scheduledDate: "2025-04-28T14:30:00Z",
    versions: [
      {
        date: "2025-03-20T10:15:00Z",
        content: `Want your LinkedIn profile to get noticed? Here's what to focus on:

✅ Professional headshot
✅ Attention-grabbing headline
✅ Compelling summary
✅ Result-focused experience section
✅ Rich media attachments
✅ Quality recommendations
✅ Relevant skills

Optimize these elements to stand out!`,
        hashtags: "#LinkedIn #PersonalBranding",
      }
    ]
  },
};

const Review = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get post data
  const postData = postId ? mockPosts[postId as keyof typeof mockPosts] : null;
  
  // State for editable content
  const [post, setPost] = useState(postData || {
    title: "",
    content: "",
    hashtags: "",
    scheduledDate: "",
    versions: []
  });
  
  // State for scheduling
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isScheduleConfirming, setIsScheduleConfirming] = useState(false);
  
  // State for regeneration
  const [isRegeneratingOpen, setIsRegeneratingOpen] = useState(false);
  const [regeneratePrompt, setRegeneratePrompt] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // State for version history
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  useEffect(() => {
    if (postData?.scheduledDate) {
      const date = new Date(postData.scheduledDate);
      setScheduledDate(date.toISOString().split('T')[0]);
      setScheduledTime(date.toISOString().split('T')[1].substring(0, 5));
    }
  }, [postData]);
  
  if (!postData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Post Not Found</h1>
          <p className="text-gray-600 mb-4">The post you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/")}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPost(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePublish = async () => {
    // In a real app: update status to 'scheduled', set date/time
    // Here you could call updateContent(postId, { scheduledDate: ..., status: "scheduled" })
    toast({
      title: "Post Published!",
      description: "Your LinkedIn post has been scheduled for publishing.",
    });
    navigate("/calendar");
  };
  
  const handleSchedule = () => {
    setIsScheduling(!isScheduling);
  };
  
  const formatScheduledDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    })}`;
  };
  
  const handleOpenRegenerate = () => {
    setIsRegeneratingOpen(true);
  };
  
  const handleCloseRegenerate = () => {
    setIsRegeneratingOpen(false);
    setRegeneratePrompt("");
  };

  const handleConfirmSchedule = () => {
    if (!scheduledDate || !scheduledTime) {
      toast({
        title: "Schedule incomplete",
        description: "Please select both a date and time for your post.",
        variant: "destructive",
      });
      return;
    }

    // Combine date and time into a single Date object
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    
    // In a real app, we would update the post in the database here
    setPost(prev => ({
      ...prev,
      scheduledDate: scheduledDateTime.toISOString(),
      status: 'scheduled'
    }));
    
    toast({
      title: "Post Scheduled!",
      description: `Your LinkedIn post has been scheduled for ${formatScheduledDate(scheduledDateTime.toISOString())}.`,
    });
    
    // Close scheduling panel and navigate to calendar
    setIsScheduling(false);
    navigate("/calendar");
  };
  
  const handleRegenerate = async () => {
    if (!regeneratePrompt.trim()) {
      toast({
        title: "Error",
        description: "Please provide instructions for regeneration.",
        variant: "destructive",
      });
      return;
    }
    
    setIsRegenerating(true);
    
    try {
      // Save current version before regenerating
      const currentVersion = {
        date: new Date().toISOString(),
        content: post.content,
        hashtags: post.hashtags,
      };
      
      // In a real app, this would be an API call
      // Mock the regeneration process with a timeout
      setTimeout(() => {
        // Create a modified version based on the prompt
        const newContent = `${post.content}\n\nUPDATED WITH: ${regeneratePrompt}`;
        
        setPost(prev => ({
          ...prev,
          content: newContent,
          versions: [...(prev.versions || []), currentVersion]
        }));
        
        setIsRegenerating(false);
        setIsRegeneratingOpen(false);
        setRegeneratePrompt("");
        
        toast({
          title: "Content Regenerated",
          description: "Your post has been updated with the new instructions.",
        });
      }, 1500);
    } catch (error) {
      console.error("Error regenerating content:", error);
      toast({
        title: "Regeneration Failed",
        description: "Failed to regenerate content. Please try again.",
        variant: "destructive",
      });
      setIsRegenerating(false);
    }
  };
  
  const handleOpenVersionHistory = () => {
    setShowVersionHistory(true);
  };
  
  const handleRestoreVersion = (index: number) => {
    if (!post.versions || index >= post.versions.length) return;
    
    const versionToRestore = post.versions[index];
    
    // Save current as a version first
    const currentVersion = {
      date: new Date().toISOString(),
      content: post.content,
      hashtags: post.hashtags,
    };
    
    const updatedVersions = [...(post.versions || [])];
    updatedVersions.push(currentVersion);
    
    // Restore the selected version
    setPost(prev => ({
      ...prev,
      content: versionToRestore.content,
      hashtags: versionToRestore.hashtags,
      versions: updatedVersions
    }));
    
    setShowVersionHistory(false);
    
    toast({
      title: "Version Restored",
      description: `Post version from ${new Date(versionToRestore.date).toLocaleDateString()} has been restored.`,
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Review Post</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate("/calendar")}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleSchedule}>
            {isScheduling ? "Hide Schedule" : "Schedule"}
          </Button>
          <Button variant="outline" onClick={handleOpenVersionHistory}>
            <History className="h-4 w-4 mr-2" /> Versions
          </Button>
          <Button variant="outline" onClick={handleOpenRegenerate}>
            <RefreshCw className="h-4 w-4 mr-2" /> Regenerate
          </Button>
          <Button onClick={handlePublish}>Publish</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Post Content</CardTitle>
              <CardDescription>Review and edit your LinkedIn post</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Post Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={post.title}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Post Content</Label>
                <Textarea
                  id="content"
                  name="content"
                  value={post.content}
                  onChange={handleChange}
                  rows={10}
                  className="min-h-[250px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hashtags">Hashtags</Label>
                <Input
                  id="hashtags"
                  name="hashtags"
                  value={post.hashtags}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>
          
          {isScheduling && (
            <Card>
              <CardHeader>
                <CardTitle>Schedule Post</CardTitle>
                <CardDescription>Set when your post should be published</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scheduleDate">Date</Label>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 opacity-50" />
                      <Input
                        id="scheduleDate"
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduleTime">Time</Label>
                    <Input
                      id="scheduleTime"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleConfirmSchedule}>
                  Confirm Schedule
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Post Preview</CardTitle>
              <CardDescription>How your post will appear on LinkedIn</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="bg-white p-4 border rounded-md">
                <div className="flex items-center mb-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    JD
                  </div>
                  <div className="ml-3">
                    <div className="font-bold">John Doe</div>
                    <div className="text-xs text-gray-500">Product Manager at Tech Company</div>
                  </div>
                </div>
                
                <div className="mb-4 space-y-2">
                  <div className="font-bold text-lg">{post.title}</div>
                  <div className="whitespace-pre-line">{post.content}</div>
                  
                  {post.hashtags && (
                    <div className="text-blue-600 text-sm mt-2">
                      {post.hashtags}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start">
              <div className="flex items-center text-sm mb-2">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                <span>
                  {post.scheduledDate 
                    ? `Scheduled for ${formatScheduledDate(post.scheduledDate)}`
                    : 'Not scheduled yet'
                  }
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Expected engagement: High
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Content Regeneration Dialog */}
      <Dialog open={isRegeneratingOpen} onOpenChange={setIsRegeneratingOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Regenerate Content</DialogTitle>
            <DialogDescription>
              Add instructions to modify or enhance your post content.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="regeneratePrompt">Regeneration Instructions</Label>
              <Textarea
                id="regeneratePrompt"
                placeholder="e.g., Make it more conversational, add statistics about LinkedIn engagement, focus more on personal branding..."
                value={regeneratePrompt}
                onChange={(e) => setRegeneratePrompt(e.target.value)}
                rows={4}
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseRegenerate}>Cancel</Button>
            <Button onClick={handleRegenerate} disabled={isRegenerating}>
              {isRegenerating ? "Regenerating..." : "Regenerate Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Version History Dialog */}
      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              View and restore previous versions of your post.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 max-h-[400px] overflow-y-auto">
            {post.versions && post.versions.length > 0 ? (
              <Tabs defaultValue="0">
                <TabsList className="mb-4">
                  {post.versions.map((_, index) => (
                    <TabsTrigger key={index} value={index.toString()}>
                      Version {index + 1}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {post.versions.map((version, index) => (
                  <TabsContent key={index} value={index.toString()}>
                    <Card>
                      <CardHeader className="py-2">
                        <CardTitle className="text-sm">
                          Version from {new Date(version.date).toLocaleDateString()} at {new Date(version.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="whitespace-pre-line mb-2">{version.content}</div>
                        {version.hashtags && (
                          <div className="text-blue-600 text-sm">{version.hashtags}</div>
                        )}
                      </CardContent>
                      <CardFooter>
                        <Button onClick={() => handleRestoreVersion(index)}>
                          Restore This Version
                        </Button>
                      </CardFooter>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No previous versions available.</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowVersionHistory(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Review;

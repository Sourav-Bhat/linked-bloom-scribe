
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

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
9. Be consistent in your activity
10. Focus on quality over quantity

What networking strategies work best for you?`,
    hashtags: "#LinkedInTips #Networking #ProfessionalDevelopment #CareerAdvice",
    scheduledDate: "2025-04-23T09:00:00Z",
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
  },
};

const Review = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  
  // Get post data
  const postData = postId ? mockPosts[postId as keyof typeof mockPosts] : null;
  
  // State for editable content
  const [post, setPost] = useState(postData || {
    title: "",
    content: "",
    hashtags: "",
    scheduledDate: ""
  });
  
  // State for scheduling
  const [isScheduling, setIsScheduling] = useState(false);
  
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
  
  const handlePublish = () => {
    toast({
      title: "Post Published!",
      description: "Your LinkedIn post has been scheduled for publishing.",
    });
    navigate("/");
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Review Post</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate("/")}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleSchedule}>
            {isScheduling ? "Hide Schedule" : "Schedule"}
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
                        defaultValue={new Date(post.scheduledDate).toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduleTime">Time</Label>
                    <Input
                      id="scheduleTime"
                      type="time"
                      defaultValue={new Date(post.scheduledDate).toISOString().split('T')[1].substring(0, 5)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Confirm Schedule</Button>
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
                <span>Scheduled for {formatScheduledDate(post.scheduledDate)}</span>
              </div>
              <div className="text-sm text-gray-500">
                Expected engagement: High
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Review;

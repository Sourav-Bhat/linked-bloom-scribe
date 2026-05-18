
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar as CalendarIcon, Edit, Clock } from "lucide-react";
import useAuth from "@/features/auth/useAuth";
import { getUserProfile } from "@/features/profile/profileService";
import { getUserContents } from "@/features/generator/contentService";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Load user profile
        const profileData = await getUserProfile(user.uid);
        setProfile(profileData);

        // Load user content
        const postsData = await getUserContents(user.uid);
        setPosts(postsData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading dashboard data...</div>;
  }

  // Calculate metrics
  const totalPosts = posts.length;
  const draftPosts = posts.filter(post => post.status === "draft");
  const publishedPosts = posts.filter(post => post.status === "published");
  const scheduledPosts = posts.filter(post => post.status === "scheduled");
  
  // Find the next scheduled post
  const nextPost = scheduledPosts.sort((a, b) => {
    return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
  })[0];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button asChild className="bg-linkedin-blue hover:bg-linkedin-dark">
          <Link to="/generator">
            <Edit className="mr-2 h-4 w-4" /> Create New Post
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalPosts || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {publishedPosts.length || 0} published · {draftPosts.length || 0} drafts
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Next Post</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nextPost ? new Date(nextPost.scheduledDate).toLocaleDateString() : "No scheduled posts"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {nextPost ? `${new Date(nextPost.scheduledDate).toLocaleTimeString()} · ${nextPost.title}` : "Create your first post"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{scheduledPosts.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {scheduledPosts.length || 0} posts scheduled
            </p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mt-8 mb-4">Upcoming Posts</h2>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <tr key={post.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {post.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        post.status === "draft" ? "bg-yellow-100 text-yellow-800" : 
                        post.status === "scheduled" ? "bg-blue-100 text-blue-800" :
                        "bg-green-100 text-green-800"
                      }`}>
                        {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {post.scheduledDate ? new Date(post.scheduledDate).toLocaleString() : "Not scheduled"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/review/${post.id}`}>Review</Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/generator?edit=${post.id}`}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No posts found. Create your first post!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Empty state */}
      {posts.length === 0 && (
        <Card className="mt-8">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No posts yet. Click "Create New Post" to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;

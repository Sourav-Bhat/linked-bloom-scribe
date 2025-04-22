
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar as CalendarIcon, Edit, Clock } from "lucide-react";

// Mock data for initial dashboard
const draftPosts = [
  { id: "1", title: "10 Tips for LinkedIn Networking", scheduled: "Tomorrow, 9:00 AM" },
  { id: "2", title: "How to Optimize Your LinkedIn Profile", scheduled: "Aug 28, 2:30 PM" },
];

const Dashboard = () => {
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
            <div className="text-3xl font-bold">2</div>
            <p className="text-xs text-muted-foreground mt-1">
              0 published · 2 drafts
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Next Post</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Tomorrow</div>
            <p className="text-xs text-muted-foreground mt-1">
              9:00 AM · 10 Tips for LinkedIn Networking
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2</div>
            <p className="text-xs text-muted-foreground mt-1">
              2 posts scheduled
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
              {draftPosts.map((post) => (
                <tr key={post.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {post.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                      Draft
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {post.scheduled}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/review/${post.id}`}>Review</Link>
                    </Button>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Onboarding prompt for new users */}
      <Card className="bg-linkedin-lightblue border-linkedin-blue mt-8">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold mb-2">Get Started with LinkedIn Content</h3>
          <p className="mb-4">Complete these steps to set up your content generation strategy:</p>
          
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="bg-white rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold text-linkedin-blue mr-3 mt-0.5">
                1
              </div>
              <div>
                <Link to="/profile" className="font-medium text-linkedin-blue hover:underline">
                  Set up your content profile
                </Link>
                <p className="text-sm">Define your topics, interests, and posting preferences</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-white rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold text-linkedin-blue mr-3 mt-0.5">
                2
              </div>
              <div>
                <Link to="/generator" className="font-medium text-linkedin-blue hover:underline">
                  Generate your first post
                </Link>
                <p className="text-sm">Create personalized LinkedIn content with AI assistance</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-white rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold text-linkedin-blue mr-3 mt-0.5">
                3
              </div>
              <div>
                <Link to="/calendar" className="font-medium text-linkedin-blue hover:underline">
                  Plan your content calendar
                </Link>
                <p className="text-sm">Schedule posts for optimal engagement</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

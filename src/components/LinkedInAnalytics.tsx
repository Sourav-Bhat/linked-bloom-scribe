
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, BarChart2, TrendingUp } from "lucide-react";

interface AnalyticsProps {
  postId?: string;
}

// Mock analytics data
const mockAnalyticsData = [
  {
    name: "Post 1",
    impressions: 4500,
    engagements: 320,
    clicks: 210,
    comments: 22,
    reactions: 95,
  },
  {
    name: "Post 2",
    impressions: 6700,
    engagements: 450,
    clicks: 290,
    comments: 35,
    reactions: 180,
  },
  {
    name: "Post 3",
    impressions: 3200,
    engagements: 210,
    clicks: 150,
    comments: 18,
    reactions: 70,
  },
  {
    name: "Post 4",
    impressions: 8100,
    engagements: 580,
    clicks: 380,
    comments: 42,
    reactions: 210,
  },
];

const LinkedInAnalytics = ({ postId }: AnalyticsProps) => {
  const [data, setData] = useState(mockAnalyticsData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // In a real implementation, this would fetch analytics from LinkedIn API
    // For now, we'll use our mock data
    setIsLoading(true);
    
    // Simulate API fetch delay
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (postId) {
        // If a specific post ID was provided, only show that post's data
        const filteredData = mockAnalyticsData.find(d => d.name === `Post ${postId}`) 
          ? [mockAnalyticsData.find(d => d.name === `Post ${postId}`)!]
          : [mockAnalyticsData[0]]; // Default to first post if not found
        setData(filteredData);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [postId]);

  // Calculate total engagements
  const totalImpressions = data.reduce((sum, item) => sum + item.impressions, 0);
  const totalEngagements = data.reduce((sum, item) => sum + item.engagements, 0);
  const totalClicks = data.reduce((sum, item) => sum + item.clicks, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="h-4 w-4 mr-1 text-blue-500" />
              Total Impressions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">People who viewed your posts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart2 className="h-4 w-4 mr-1 text-green-500" />
              Engagements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : totalEngagements.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Likes, comments, and shares</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-1 text-purple-500" />
              Click-through Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : `${((totalClicks / totalImpressions) * 100).toFixed(1)}%`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Percentage of viewers who clicked</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Post Performance</CardTitle>
          <CardDescription>
            Engagement metrics across your LinkedIn posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <p>Loading analytics data...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="impressions" name="Impressions" fill="#3b82f6" />
                <Bar dataKey="engagements" name="Engagements" fill="#10b981" />
                <Bar dataKey="clicks" name="Clicks" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LinkedInAnalytics;

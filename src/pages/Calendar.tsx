
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

// Mock scheduled content data
const initialScheduledContent = [
  { 
    id: '1', 
    title: '10 Tips for LinkedIn Networking', 
    date: new Date(2025, 3, 23, 9, 0), 
    status: 'draft' 
  },
  { 
    id: '2', 
    title: 'How to Optimize Your LinkedIn Profile', 
    date: new Date(2025, 3, 28, 14, 30), 
    status: 'draft' 
  },
];

const Calendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [scheduledContent] = useState(initialScheduledContent);
  
  // Filter posts for the selected date
  const postsForSelectedDate = scheduledContent.filter(post => {
    if (!selectedDate) return false;
    
    return post.date.getDate() === selectedDate.getDate() && 
           post.date.getMonth() === selectedDate.getMonth() && 
           post.date.getFullYear() === selectedDate.getFullYear();
  });
  
  // Show days with posts
  const daysWithPosts = scheduledContent.map(post => 
    new Date(post.date.getFullYear(), post.date.getMonth(), post.date.getDate())
  );

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    setSelectedDate(newDate);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Content Calendar</h1>
        <Select value={view} onValueChange={(value: "month" | "week" | "day") => setView(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Month View</SelectItem>
            <SelectItem value="week">Week View</SelectItem>
            <SelectItem value="day">Day View</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5" />
              Publishing Schedule
            </CardTitle>
            <CardDescription>
              View and manage your scheduled LinkedIn content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              className="border rounded-md p-3"
              modifiers={{
                hasPost: daysWithPosts,
              }}
              modifiersStyles={{
                hasPost: {
                  fontWeight: 'bold',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                }
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Selected Date'}</CardTitle>
            <CardDescription>
              {postsForSelectedDate.length 
                ? `${postsForSelectedDate.length} post(s) scheduled` 
                : 'No posts scheduled for this date'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {postsForSelectedDate.length > 0 ? (
              <div className="space-y-4">
                {postsForSelectedDate.map(post => (
                  <div key={post.id} className="p-3 border rounded-md bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{post.title}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {post.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <Badge variant={post.status === 'published' ? 'default' : 'outline'}>
                        {post.status === 'draft' ? 'Draft' : 'Published'}
                      </Badge>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button size="sm">Review</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-500">No content scheduled for this date</p>
                <Button className="mt-4">Schedule New Post</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Posts</CardTitle>
          <CardDescription>All scheduled content for the next 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-2 font-medium">Post Title</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Time</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scheduledContent.map(post => (
                  <tr key={post.id} className="border-b">
                    <td className="py-3">{post.title}</td>
                    <td className="py-3">{post.date.toLocaleDateString()}</td>
                    <td className="py-3">{post.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-3">
                      <Badge variant={post.status === 'published' ? 'default' : 'outline'}>
                        {post.status === 'draft' ? 'Draft' : 'Published'}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">Edit</Button>
                        <Button size="sm" variant="ghost">Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Calendar;

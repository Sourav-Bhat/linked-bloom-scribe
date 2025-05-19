
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
import { Calendar as CalendarIcon, Clock, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { ContentPost } from '@/lib/types';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  const { toast } = useToast();
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [scheduledContent, setScheduledContent] = useState(initialScheduledContent);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  
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

  const handleEdit = (postId: string) => {
    // Navigate to the post editor page with the post ID
    navigate(`/review/${postId}`);
  };

  const confirmDelete = (postId: string) => {
    setPostToDelete(postId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!postToDelete) return;
    
    try {
      // In a real app, we would delete from Supabase
      // const { error } = await supabase
      //   .from('posts')
      //   .delete()
      //   .eq('id', postToDelete);
      
      // if (error) throw error;

      // For mock data, filter out the deleted post
      setScheduledContent(scheduledContent.filter(post => post.id !== postToDelete));
      
      toast({
        title: "Post deleted",
        description: "The post has been permanently deleted.",
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete the post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  };

  const handleStatusChange = (postId: string, newStatus: 'draft' | 'scheduled') => {
    // Update the status in the local state
    setScheduledContent(content => 
      content.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              status: newStatus,
              // If setting to scheduled and it's not already scheduled, set the date
              date: newStatus === 'scheduled' && post.status !== 'scheduled' 
                ? new Date(Date.now() + 24 * 60 * 60 * 1000) // Default to tomorrow
                : post.date
            } 
          : post
      )
    );

    // In a real app, we would update in Supabase
    // const { error } = await supabase
    //   .from('posts')
    //   .update({ 
    //     status: newStatus,
    //     scheduled_date: newStatus === 'scheduled' ? new Date().toISOString() : null
    //   })
    //   .eq('id', postId);

    toast({
      title: `Post ${newStatus}`,
      description: `The post has been ${newStatus === 'scheduled' ? 'scheduled for publication' : 'moved to drafts'}.`,
    });
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
                      <Badge variant={post.status === 'scheduled' ? 'default' : 'outline'}>
                        {post.status === 'draft' ? 'Draft' : 'Scheduled'}
                      </Badge>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(post.id)}>
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button size="sm" onClick={() => handleEdit(post.id)}>Review</Button>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Post Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledContent.map(post => (
                  <TableRow key={post.id}>
                    <TableCell>{post.title}</TableCell>
                    <TableCell>{post.date.toLocaleDateString()}</TableCell>
                    <TableCell>{post.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                    <TableCell>
                      <Badge variant={post.status === 'scheduled' ? 'default' : 'outline'}>
                        {post.status === 'draft' ? 'Draft' : 'Scheduled'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(post.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => confirmDelete(post.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">Status</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(post.id, 'draft')}
                              disabled={post.status === 'draft'}
                            >
                              Set as Draft
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(post.id, 'scheduled')}
                              disabled={post.status === 'scheduled'}
                            >
                              Schedule Post
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Calendar;

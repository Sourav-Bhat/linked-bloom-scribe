
import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, Edit, Undo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ContentPost } from '@/lib/types';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import useAuth from "@/features/auth/useAuth";
import { getUserContents, unscheduleContent } from "@/features/generator/contentService";

const Calendar = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [unscheduleId, setUnscheduleId] = useState<string | null>(null);

  const loadPosts = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const all = await getUserContents(user.uid);
      setPosts(all as ContentPost[]);
    } catch (error) {
      console.error('Error loading calendar:', error);
      toast({ title: "Error", description: "Failed to load your calendar.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadPosts(); }, [user]);

  // Only scheduled posts with a real date appear on the calendar.
  const scheduled = useMemo(
    () => posts
      .filter((p) => p.status === 'scheduled' && p.scheduledDate)
      .map((p) => ({ ...p, when: new Date(p.scheduledDate as string) }))
      .filter((p) => !isNaN(p.when.getTime())),
    [posts]
  );

  const daysWithPosts = useMemo(
    () => scheduled.map((p) => new Date(p.when.getFullYear(), p.when.getMonth(), p.when.getDate())),
    [scheduled]
  );

  const postsForSelectedDate = useMemo(
    () => scheduled.filter((p) =>
      selectedDate &&
      p.when.getDate() === selectedDate.getDate() &&
      p.when.getMonth() === selectedDate.getMonth() &&
      p.when.getFullYear() === selectedDate.getFullYear()
    ),
    [scheduled, selectedDate]
  );

  // Upcoming = scheduled in the next 30 days, future only, sorted.
  const upcoming = useMemo(() => {
    const now = new Date();
    const horizon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return scheduled
      .filter((p) => p.when >= now && p.when <= horizon)
      .sort((a, b) => a.when.getTime() - b.when.getTime());
  }, [scheduled]);

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    setSelectedDate(newDate);
  };

  const handleUnschedule = async () => {
    if (!unscheduleId || !user) return;
    try {
      await unscheduleContent(user.uid, unscheduleId);
      toast({ title: "Moved to drafts", description: "The post was removed from the calendar." });
      await loadPosts();
    } catch (error) {
      console.error('Error unscheduling post:', error);
      toast({ title: "Error", description: "Failed to update the post.", variant: "destructive" });
    } finally {
      setUnscheduleId(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading your calendar…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Content Calendar</h1>
        <Button asChild>
          <Link to="/generator">Create New Post</Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5" />
              Publishing Schedule
            </CardTitle>
            <CardDescription>View and manage your scheduled LinkedIn content</CardDescription>
          </CardHeader>
          <CardContent>
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              className="border rounded-md p-3"
              modifiers={{ hasPost: daysWithPosts }}
              modifiersStyles={{
                hasPost: { fontWeight: 'bold', backgroundColor: 'rgba(10, 102, 194, 0.12)' },
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate
                ? selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : 'Selected Date'}
            </CardTitle>
            <CardDescription>
              {postsForSelectedDate.length
                ? `${postsForSelectedDate.length} post(s) scheduled`
                : 'No posts scheduled for this date'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {postsForSelectedDate.length > 0 ? (
              <div className="space-y-4">
                {postsForSelectedDate.map((post) => (
                  <div key={post.id} className="p-3 border rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium line-clamp-1">{post.title || post.topic}</h3>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {post.when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <Badge>Scheduled</Badge>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/generator?edit=${post.id}`}><Edit className="h-3 w-3 mr-1" /> Edit</Link>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setUnscheduleId(post.id)}>
                        <Undo2 className="h-3 w-3 mr-1" /> Unschedule
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No content scheduled for this date</p>
                <Button className="mt-4" asChild>
                  <Link to="/generator">Create a post to schedule</Link>
                </Button>
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
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nothing scheduled yet. Generate a post and schedule it to see it here.
            </p>
          ) : (
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
                  {upcoming.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="max-w-[220px] truncate">{post.title || post.topic}</TableCell>
                      <TableCell>{post.when.toLocaleDateString()}</TableCell>
                      <TableCell>{post.when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                      <TableCell><Badge>Scheduled</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" asChild>
                            <Link to={`/generator?edit=${post.id}`}><Edit className="h-4 w-4" /></Link>
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setUnscheduleId(post.id)}>
                            <Undo2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(unscheduleId)} onOpenChange={(open) => { if (!open) setUnscheduleId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from calendar?</AlertDialogTitle>
            <AlertDialogDescription>
              This moves the post back to your drafts. You can reschedule it anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnschedule}>Move to drafts</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Calendar;

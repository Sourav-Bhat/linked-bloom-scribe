import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Edit, Undo2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ContentPost } from "@/lib/types";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "@/features/auth/useAuth";
import { getUserContents, unscheduleContent } from "@/features/generator/contentService";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const Calendar = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [unscheduleId, setUnscheduleId] = useState<string | null>(null);

  const loadPosts = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const all = await getUserContents(user.uid);
      setPosts(all as ContentPost[]);
    } catch (error) {
      console.error("Error loading calendar:", error);
      toast({ title: "Error", description: "Failed to load your calendar.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadPosts(); }, [user]);

  const scheduled = useMemo(
    () => posts
      .filter((p) => p.status === "scheduled" && p.scheduledDate)
      .map((p) => ({ ...p, when: new Date(p.scheduledDate as string) }))
      .filter((p) => !isNaN(p.when.getTime())),
    [posts]
  );

  // Build a 6-week (42-cell) Monday-start grid for the cursor month.
  const cells = useMemo(() => {
    const year = cursor.getFullYear(), month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7; // Mon=0
    const start = new Date(year, month, 1 - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return { date: d, inMonth: d.getMonth() === month, posts: scheduled.filter((p) => sameDay(p.when, d)) };
    });
  }, [cursor, scheduled]);

  const upcoming = useMemo(() => {
    const now = new Date();
    const horizon = new Date(now.getTime() + 30 * 864e5);
    return scheduled.filter((p) => p.when >= now && p.when <= horizon).sort((a, b) => +a.when - +b.when);
  }, [scheduled]);

  const today = new Date();

  const handleUnschedule = async () => {
    if (!unscheduleId || !user) return;
    try {
      await unscheduleContent(user.uid, unscheduleId);
      toast({ title: "Moved to drafts", description: "The post was removed from the calendar." });
      await loadPosts();
    } catch (error) {
      console.error("Error unscheduling post:", error);
      toast({ title: "Error", description: "Failed to update the post.", variant: "destructive" });
    } finally {
      setUnscheduleId(null);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center text-brand-500">Loading your calendar…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Calendar</h1>
          <p className="mt-1 text-brand-500">Every scheduled post in one place. Status dots show where each one stands.</p>
        </div>
        <Button asChild className="shadow-brand-1"><Link to="/generator"><Plus className="mr-1.5 h-4 w-4" /> Schedule</Link></Button>
      </div>

      {/* Month nav + legend */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="min-w-[160px] text-center text-xl font-bold tracking-tight">
            {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </h2>
          <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-brand-500">
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-brand-400" />Draft</span>
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-gold-500" />Scheduled</span>
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-success" />Published</span>
        </div>
      </div>

      {/* Month grid */}
      <div className="overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-brand-1">
        <div className="grid grid-cols-7 border-b border-brand-200 bg-brand-50">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-brand-500">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((c, i) => {
            const isToday = sameDay(c.date, today);
            return (
              <div key={i} className={cn(
                "min-h-[104px] border-b border-r border-brand-100 p-2 last:border-r-0",
                !c.inMonth && "bg-brand-25",
              )}>
                <span className={cn(
                  "grid h-6 w-6 place-items-center rounded-full text-[13px] font-semibold",
                  isToday ? "bg-violet-600 text-white" : c.inMonth ? "text-brand-600" : "text-brand-300",
                )}>
                  {c.date.getDate()}
                </span>
                <div className="mt-1.5 space-y-1">
                  {c.posts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => navigate(`/generator?edit=${p.id}`)}
                      title={`${p.title || p.topic} · ${p.when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                      className="flex w-full items-center gap-1.5 rounded-md bg-gold-50 px-1.5 py-1 text-left text-[11px] font-semibold leading-tight text-gold-600"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                      <span className="truncate">{p.title || p.topic}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming list */}
      <div className="rounded-2xl border border-brand-200 bg-white p-5 shadow-brand-1">
        <h2 className="mb-4 text-[17px] font-semibold tracking-tight">Upcoming · next 30 days</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-xl border border-dashed border-brand-200 bg-brand-25 p-6 text-center text-sm text-brand-500">
            Nothing scheduled yet. Generate a post and schedule it to see it here.
          </div>
        ) : (
          <div className="divide-y divide-brand-100">
            {upcoming.map((post) => (
              <div key={post.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="w-12 shrink-0 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-gold-600">{post.when.toLocaleDateString(undefined, { month: "short" })}</div>
                    <div className="text-lg font-extrabold leading-none">{post.when.getDate()}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-semibold">{post.title || post.topic}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-brand-400">
                      <Clock className="h-3 w-3" />
                      {post.when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" asChild aria-label="Edit">
                    <Link to={`/generator?edit=${post.id}`}><Edit className="h-4 w-4" /></Link>
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setUnscheduleId(post.id)} aria-label="Unschedule">
                    <Undo2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={Boolean(unscheduleId)} onOpenChange={(open) => { if (!open) setUnscheduleId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from calendar?</AlertDialogTitle>
            <AlertDialogDescription>This moves the post back to your drafts. You can reschedule it anytime.</AlertDialogDescription>
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

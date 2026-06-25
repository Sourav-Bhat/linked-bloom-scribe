import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar as CalendarIcon, Clock, FileText, CheckCircle2, Plus, ArrowRight, MessageSquare } from "lucide-react";
import useAuth from "@/features/auth/useAuth";
import { getUserProfile } from "@/features/profile/profileService";
import { getUserContents } from "@/features/generator/contentService";
import { useToast } from "@/hooks/use-toast";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

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
        const profileData = await getUserProfile(user.uid);
        setProfile(profileData);
        const postsData = await getUserContents(user.uid);
        setPosts(postsData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast({ title: "Error", description: "Failed to load dashboard data. Please try again.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-brand-500">Loading dashboard…</div>;
  }

  const draftPosts = posts.filter((p) => p.status === "draft");
  const publishedPosts = posts.filter((p) => p.status === "published");
  const scheduledPosts = posts.filter((p) => p.status === "scheduled" && p.scheduledDate);

  const now = new Date();
  const upcomingPosts = scheduledPosts
    .map((p) => ({ ...p, when: new Date(p.scheduledDate as string) }))
    .filter((p) => !isNaN(p.when.getTime()) && p.when >= now)
    .sort((a, b) => a.when.getTime() - b.when.getTime());
  const nextPost = upcomingPosts[0];

  const firstName = (profile?.fullName || user?.email?.split("@")[0] || "there").split(" ")[0];
  const topPillar = (profile?.topics && profile.topics[0]) || "Personal Lessons";

  const stats = [
    { label: "Drafts", value: draftPosts.length, icon: FileText, tint: "bg-brand-100 text-brand-600" },
    { label: "Scheduled", value: scheduledPosts.length, icon: Clock, tint: "bg-gold-50 text-gold-600" },
    { label: "Published", value: publishedPosts.length, icon: CheckCircle2, tint: "bg-[#E7F6EF] text-success" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand-400">
            {now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight capitalize">{greeting()}, {firstName}</h1>
          <p className="mt-1 max-w-[60ch] text-brand-500">
            Your strategist is ready. {scheduledPosts.length > 0 ? `${scheduledPosts.length} post${scheduledPosts.length > 1 ? "s" : ""} queued` : "Nothing queued yet"} and {draftPosts.length} draft{draftPosts.length === 1 ? "" : "s"} worth a look.
          </p>
        </div>
        <Button asChild className="shadow-brand-1">
          <Link to="/generator"><Plus className="mr-1.5 h-4 w-4" /> New post</Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-brand-200 bg-white p-5 shadow-brand-1">
            <div className={`grid h-9 w-9 place-items-center rounded-[10px] ${s.tint}`}>
              <s.icon className="h-[18px] w-[18px]" />
            </div>
            <div className="mt-3 text-[28px] font-extrabold leading-none tracking-tight">{s.value}</div>
            <div className="mt-1.5 text-sm font-medium text-brand-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Next up + Drafts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Next up */}
        <div className="rounded-2xl border border-brand-200 bg-white p-5 shadow-brand-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[17px] font-semibold tracking-tight">Next up</h2>
            <Button variant="ghost" size="sm" asChild><Link to="/calendar">Calendar →</Link></Button>
          </div>
          {nextPost ? (
            <>
              <div className="flex gap-3 rounded-xl border border-brand-200 bg-brand-25 p-3">
                <div className="w-14 shrink-0 text-center">
                  <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-gold-600">
                    {nextPost.when.toLocaleDateString(undefined, { weekday: "short" })}
                  </div>
                  <div className="text-[26px] font-extrabold leading-tight">{nextPost.when.getDate()}</div>
                  <div className="text-xs text-brand-400">{nextPost.when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold leading-snug line-clamp-2">{nextPost.title || nextPost.topic}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {nextPost.topic && <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-600">{nextPost.topic}</span>}
                    <span className="rounded-full bg-gold-50 px-2.5 py-1 text-xs font-semibold text-gold-600">Scheduled</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" size="sm" asChild><Link to="/calendar">View calendar</Link></Button>
                <Button variant="ghost" size="sm" asChild><Link to={`/generator?edit=${nextPost.id}`}>Edit</Link></Button>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-brand-200 bg-brand-25 p-6 text-center">
              <p className="text-sm text-brand-500">Nothing scheduled yet.</p>
              <Button variant="secondary" size="sm" asChild className="mt-3"><Link to="/generator">Create a post</Link></Button>
            </div>
          )}
        </div>

        {/* Drafts */}
        <div className="rounded-2xl border border-brand-200 bg-white p-5 shadow-brand-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[17px] font-semibold tracking-tight">Your drafts</h2>
            <span className="text-sm text-brand-400">{draftPosts.length} ready</span>
          </div>
          {draftPosts.length > 0 ? (
            <div className="divide-y divide-brand-100">
              {draftPosts.slice(0, 4).map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold leading-snug line-clamp-1">{d.title || d.topic || "Untitled draft"}</div>
                    <div className="mt-1.5 flex items-center gap-2">
                      {d.topic && <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-600">{d.topic}</span>}
                      {d.content && <span className="text-xs text-brand-400">{String(d.content).trim().split(/\s+/).length} words</span>}
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" asChild><Link to={`/generator?edit=${d.id}`}>Open</Link></Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-brand-200 bg-brand-25 p-6 text-center">
              <p className="text-sm text-brand-500">No drafts yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* PR strategist nudge */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-ink-900 to-ink-700 p-5 text-white shadow-brand-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="brand-gradient grid h-11 w-11 shrink-0 place-items-center rounded-xl font-bold">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-[17px] font-semibold">Your PR strategist has a nudge</div>
              <p className="max-w-[52ch] text-sm text-white/70">
                "Want two fresh hooks on <strong className="text-white">{topPillar}</strong>? It's a strong pillar to keep momentum on."
              </p>
            </div>
          </div>
          <Button variant="secondary" asChild>
            <Link to="/profile">Open PR Agent <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

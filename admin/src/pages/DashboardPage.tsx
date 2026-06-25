import { Link } from "react-router-dom";
import { Users, Clock, CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { Card, Spinner, StatusBadge } from "@/components/ui";
import { useUsers } from "@/hooks/useUsers";
import { computeStats } from "@/services/admin";
import { relativeTime } from "@/lib/utils";

const DashboardPage = () => {
  const { users, loading, error } = useUsers();
  const s = computeStats(users);
  const recent = [...users].slice(0, 6);

  const cards = [
    { label: "Total users", value: s.total, icon: Users, tint: "bg-brand-100 text-brand-600" },
    { label: "Pending", value: s.pending, icon: Clock, tint: "bg-warn-bg text-warn" },
    { label: "Approved", value: s.approved, icon: CheckCircle2, tint: "bg-success-bg text-success" },
    { label: "Onboarded", value: s.onboarded, icon: Sparkles, tint: "bg-violet-50 text-violet-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Overview</h1>
        <p className="mt-1 text-brand-500">Your closed-beta at a glance.</p>
      </div>

      {error && <Card className="p-4 text-sm text-danger">{error}</Card>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <div className={`grid h-9 w-9 place-items-center rounded-[10px] ${c.tint}`}>
              <c.icon className="h-[18px] w-[18px]" />
            </div>
            <div className="mt-3 text-[28px] font-extrabold leading-none tracking-tight">
              {loading ? "—" : c.value}
            </div>
            <div className="mt-1.5 text-sm font-medium text-brand-500">{c.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pending CTA */}
        <Card className="flex flex-col justify-between p-5">
          <div>
            <h2 className="text-[17px] font-semibold tracking-tight">Waitlist</h2>
            <p className="mt-1 text-sm text-brand-500">
              {s.pending === 0 ? "No one waiting right now." : `${s.pending} ${s.pending === 1 ? "person is" : "people are"} waiting for approval.`}
            </p>
          </div>
          <Link
            to="/waitlist"
            className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white shadow-brand-1 transition-colors hover:bg-violet-500"
          >
            Review waitlist <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>

        {/* Recent signups */}
        <Card className="p-5">
          <h2 className="mb-3 text-[17px] font-semibold tracking-tight">Recent signups</h2>
          {loading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-brand-400">No users yet.</p>
          ) : (
            <div className="divide-y divide-brand-100">
              {recent.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{u.email || u.id}</div>
                    <div className="text-xs text-brand-400">{relativeTime(u.createdAt)} · {u.signUpProvider === "google.com" ? "Google" : "Email"}</div>
                  </div>
                  <StatusBadge status={u.accessStatus} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;

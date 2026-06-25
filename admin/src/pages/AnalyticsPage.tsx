import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Card, Spinner } from "@/components/ui";
import { useUsers } from "@/hooks/useUsers";
import { computeStats, signupsByDay } from "@/services/admin";

const STATUS_COLORS: Record<string, string> = { Pending: "#EDA838", Approved: "#1E9E6A", Rejected: "#D24B4B" };

const AnalyticsPage = () => {
  const { users, loading, error } = useUsers();
  const s = computeStats(users);
  const daily = signupsByDay(users, 14);
  const statusData = [
    { name: "Pending", value: s.pending },
    { name: "Approved", value: s.approved },
    { name: "Rejected", value: s.rejected },
  ].filter((d) => d.value > 0);
  const approvalRate = s.total ? Math.round((s.approved / s.total) * 100) : 0;

  const kpis = [
    { label: "Signups (7d)", value: s.last7d },
    { label: "Approval rate", value: `${approvalRate}%` },
    { label: "Onboarded", value: s.onboarded },
    { label: "Google sign-ins", value: s.googleUsers },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Analytics</h1>
        <p className="mt-1 text-brand-500">Signup trends and funnel health. (Extend this as you collect more data.)</p>
      </div>

      {error && <Card className="p-4 text-sm text-danger">{error}</Card>}

      {loading ? (
        <Card className="flex justify-center p-16"><Spinner className="h-7 w-7" /></Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((k) => (
              <Card key={k.label} className="p-5">
                <div className="text-[28px] font-extrabold leading-none tracking-tight">{k.value}</div>
                <div className="mt-1.5 text-sm font-medium text-brand-500">{k.label}</div>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <h2 className="mb-4 text-[17px] font-semibold tracking-tight">Signups · last 14 days</h2>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={daily} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EFEDF5" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9B95AD" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9B95AD" }} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "#F6F5FA" }} contentStyle={{ borderRadius: 12, border: "1px solid #E4E1EC", fontSize: 12 }} />
                    <Bar dataKey="signups" fill="#6555E6" radius={[5, 5, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 text-[17px] font-semibold tracking-tight">Access status</h2>
              {statusData.length === 0 ? (
                <p className="py-12 text-center text-sm text-brand-400">No data yet.</p>
              ) : (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                        {statusData.map((d) => <Cell key={d.name} fill={STATUS_COLORS[d.name]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E4E1EC", fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-brand-500">
                    {statusData.map((d) => (
                      <span key={d.name} className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[d.name] }} />
                        {d.name} ({d.value})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;

import { useMemo, useState } from "react";
import { Search, RefreshCw, Check, X } from "lucide-react";
import { Button, Card, Input, Spinner, StatusBadge } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useUsers } from "@/hooks/useUsers";
import { setUserAccess, type AccessStatus } from "@/services/admin";
import { fmtDate, relativeTime, cn } from "@/lib/utils";

const FILTERS: { id: "all" | AccessStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

const UsersPage = () => {
  const { users, loading, error, reload } = useUsers();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | AccessStatus>("all");
  const [busy, setBusy] = useState<string | null>(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return users.filter((u) => {
      if (filter !== "all" && u.accessStatus !== filter) return false;
      if (term && !(u.email?.toLowerCase().includes(term) || u.id.toLowerCase().includes(term))) return false;
      return true;
    });
  }, [users, q, filter]);

  const act = async (uid: string, action: "approve" | "reject") => {
    setBusy(uid + action);
    try {
      await setUserAccess(uid, action);
      toast(action === "approve" ? "User approved" : "User rejected");
      await reload();
    } catch (e: any) {
      toast(e?.message ?? "Action failed", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Users</h1>
          <p className="mt-1 text-brand-500">Your whole user base — search, filter, and manage access.</p>
        </div>
        <Button variant="secondary" onClick={reload} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email or uid…" className="pl-9" />
        </div>
        <div className="inline-flex rounded-lg bg-brand-100 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors",
                filter === f.id ? "bg-white text-ink-800 shadow-brand-1" : "text-brand-500 hover:text-brand-700",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <Card className="p-4 text-sm text-danger">{error}</Card>}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner className="h-7 w-7" /></div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-brand-400">No users match.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-200 bg-brand-50 text-left text-xs font-bold uppercase tracking-wide text-brand-500">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Onboarded</th>
                  <th className="px-4 py-3">Signed up</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {rows.map((u) => (
                  <tr key={u.id} className="hover:bg-brand-25">
                    <td className="max-w-[260px] px-4 py-3">
                      <div className="truncate font-medium">{u.email || "—"}</div>
                      <div className="truncate text-xs text-brand-400">{u.id}</div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={u.accessStatus} /></td>
                    <td className="px-4 py-3 text-brand-600">{u.signUpProvider === "google.com" ? "Google" : "Email"}</td>
                    <td className="px-4 py-3 text-brand-600">{u.onboardingCompleted ? "Yes" : "No"}</td>
                    <td className="px-4 py-3 text-brand-600" title={u.createdAt ?? ""}>{fmtDate(u.createdAt)}<span className="block text-xs text-brand-400">{relativeTime(u.createdAt)}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        {u.accessStatus !== "approved" && (
                          <Button variant="success" className="px-2 py-1.5" onClick={() => act(u.id, "approve")} disabled={busy !== null} title="Approve">
                            {busy === u.id + "approve" ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : <Check className="h-4 w-4" />}
                          </Button>
                        )}
                        {u.accessStatus !== "rejected" && (
                          <Button variant="secondary" className="px-2 py-1.5" onClick={() => act(u.id, "reject")} disabled={busy !== null} title="Reject">
                            {busy === u.id + "reject" ? <Spinner className="h-4 w-4" /> : <X className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UsersPage;

import { useMemo, useState } from "react";
import { Search, RefreshCw, Check, X, MailPlus, Copy, ExternalLink } from "lucide-react";
import { Button, Card, Input, Spinner, StatusBadge } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useUsers } from "@/hooks/useUsers";
import { setUserAccess, resendActivation, type AccessStatus, type ActivationResult } from "@/services/admin";
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
  const [activation, setActivation] = useState<(ActivationResult & { email: string }) | null>(null);

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

  const sendActivation = async (uid: string, email?: string) => {
    setBusy(uid + "activate");
    try {
      const res = await resendActivation(uid);
      if (res.alreadyVerified) {
        toast(`${res.email ?? email ?? "User"} is already verified`);
      } else if (res.link) {
        setActivation({ ...res, email: res.email ?? email ?? "" });
        toast("Activation link ready");
      } else {
        toast("Couldn't generate a link", "error");
      }
    } catch (e: any) {
      toast(e?.message ?? "Failed to issue link", "error");
    } finally {
      setBusy(null);
    }
  };

  const copyLink = async () => {
    if (!activation?.link) return;
    try {
      await navigator.clipboard.writeText(activation.link);
      toast("Link copied to clipboard");
    } catch {
      toast("Copy failed — select and copy manually", "error");
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
                        {u.signUpProvider !== "google.com" && (
                          <Button
                            variant="secondary"
                            className="px-2 py-1.5"
                            onClick={() => sendActivation(u.id, u.email)}
                            disabled={busy !== null}
                            title="Send / copy email activation link"
                          >
                            {busy === u.id + "activate" ? <Spinner className="h-4 w-4" /> : <MailPlus className="h-4 w-4" />}
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

      {activation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4"
          onClick={() => setActivation(null)}
        >
          <Card className="w-full max-w-lg p-6" >
            <div onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold">Activation link</h2>
                  <p className="mt-1 text-sm text-brand-500">
                    For <span className="font-medium text-brand-700">{activation.email}</span>. Share this
                    link so they can verify their email and activate access.
                  </p>
                </div>
                <button onClick={() => setActivation(null)} className="text-brand-400 hover:text-brand-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 flex gap-2">
                <Input readOnly value={activation.link} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
                <Button variant="primary" onClick={copyLink} title="Copy link"><Copy className="h-4 w-4" /> Copy</Button>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <a
                  href={activation.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-500"
                >
                  <ExternalLink className="h-4 w-4" /> Open link
                </a>
              </div>

              <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-500">
                An email with this link was also queued — it's delivered automatically only if an email
                sender (e.g. the Trigger&nbsp;Email extension) is configured. Until then, share the link directly.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default UsersPage;

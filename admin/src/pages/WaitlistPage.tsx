import { useState } from "react";
import { Check, X, RefreshCw } from "lucide-react";
import { Button, Card, Spinner } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useUsers } from "@/hooks/useUsers";
import { setUserAccess } from "@/services/admin";
import { fmtDateTime, relativeTime } from "@/lib/utils";

const WaitlistPage = () => {
  const { users, loading, error, reload } = useUsers();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const pending = users.filter((u) => u.accessStatus === "pending");

  const act = async (uid: string, action: "approve" | "reject", email?: string) => {
    setBusy(uid + action);
    try {
      await setUserAccess(uid, action);
      toast(action === "approve" ? `Approved ${email ?? "user"}` : `Rejected ${email ?? "user"}`);
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
          <h1 className="text-3xl font-extrabold tracking-tight">Waitlist</h1>
          <p className="mt-1 text-brand-500">Approve people into the closed beta. They'll get an email and must verify it (Google users are auto-verified).</p>
        </div>
        <Button variant="secondary" onClick={reload} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {error && <Card className="p-4 text-sm text-danger">{error}</Card>}

      <Card className="p-5">
        {loading ? (
          <div className="flex justify-center py-10"><Spinner className="h-7 w-7" /></div>
        ) : pending.length === 0 ? (
          <div className="rounded-xl border border-dashed border-brand-200 bg-brand-25 p-10 text-center text-sm text-brand-500">
            🎉 Nobody's waiting — the waitlist is clear.
          </div>
        ) : (
          <div className="divide-y divide-brand-100">
            {pending.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0">
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-semibold">{u.email || u.id}</div>
                  <div className="mt-0.5 text-xs text-brand-400">
                    Signed up {relativeTime(u.createdAt)} · {fmtDateTime(u.createdAt)} · {u.signUpProvider === "google.com" ? "Google" : "Email/password"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="success" onClick={() => act(u.id, "approve", u.email)} disabled={busy !== null}>
                    {busy === u.id + "approve" ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : <Check className="h-4 w-4" />} Approve
                  </Button>
                  <Button variant="secondary" onClick={() => act(u.id, "reject", u.email)} disabled={busy !== null}>
                    {busy === u.id + "reject" ? <Spinner className="h-4 w-4" /> : <X className="h-4 w-4" />} Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default WaitlistPage;

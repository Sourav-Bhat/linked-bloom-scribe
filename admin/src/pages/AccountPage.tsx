import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, USE_EMULATORS } from "@/lib/firebase";
import { Button, Card } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useAuth } from "@/features/auth/AuthProvider";
import { KeyRound, Mail, ShieldCheck } from "lucide-react";

const AccountPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [sending, setSending] = useState(false);

  const resetPassword = async () => {
    if (!user?.email) return;
    setSending(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast("Password reset email sent — check your inbox.");
    } catch (e: any) {
      toast(e?.message ?? "Couldn't send reset email", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Account</h1>
        <p className="mt-1 text-brand-500">Your admin login.</p>
      </div>

      <Card className="max-w-xl p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50">
            <Mail className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <div className="text-sm font-semibold">{user?.email}</div>
            <div className="inline-flex items-center gap-1 text-xs text-success">
              <ShieldCheck className="h-3.5 w-3.5" /> Admin
            </div>
          </div>
        </div>

        <div className="my-5 h-px bg-brand-200" />

        <h2 className="text-[15px] font-semibold">Change your password</h2>
        <p className="mt-1 text-sm text-brand-500">
          We'll email you a secure link to set a new password. Use this to replace the temporary password you were given.
        </p>
        <Button className="mt-4" onClick={resetPassword} disabled={sending || !user?.email}>
          <KeyRound className="h-4 w-4" /> {sending ? "Sending…" : "Send password reset email"}
        </Button>
        {USE_EMULATORS && (
          <p className="mt-3 text-xs text-brand-400">
            In the local emulator no real email is sent — the reset link appears in the Auth emulator logs / UI.
          </p>
        )}
      </Card>
    </div>
  );
};

export default AccountPage;

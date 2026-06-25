import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";
import useAuth from "@/features/auth/useAuth";
import { signOut, sendVerificationEmail } from "@/features/auth/authService";
import { toast } from "@/components/ui/use-toast";
import { MailCheck, RefreshCw, LogOut, Send } from "lucide-react";

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const { user, refreshApproval } = useAuth();
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const sentOnce = useRef(false);

  // Auto-send a verification link when they land here (once per mount), so it
  // works even before the Trigger Email extension / approval email is set up.
  useEffect(() => {
    if (sentOnce.current) return;
    sentOnce.current = true;
    sendVerificationEmail()
      .then(() => toast({ title: "Verification email sent", description: "Check your inbox for the link." }))
      .catch(() => { /* rate-limited or already sent — silent */ });
  }, []);

  const handleResend = async () => {
    setSending(true);
    try {
      await sendVerificationEmail();
      toast({ title: "Email sent", description: "We've sent a fresh verification link." });
    } catch {
      toast({ title: "Couldn't send", description: "Please wait a moment and try again.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleContinue = async () => {
    setChecking(true);
    try {
      await refreshApproval?.(); // reloads the user + claims
      if (auth_isVerified()) {
        toast({ title: "Email verified", description: "You're all set." });
        navigate("/");
      } else {
        toast({ title: "Not verified yet", description: "Click the link in your email, then try again." });
      }
    } finally {
      setChecking(false);
    }
  };

  // refreshApproval updates context state; read the freshest value off the user.
  const auth_isVerified = () => Boolean(user?.emailVerified);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-50 px-5">
      <div className="w-full max-w-md rounded-2xl border border-brand-200 bg-white p-8 text-center shadow-brand-2">
        <div className="flex justify-center"><BrandLogo /></div>

        <div className="mx-auto mt-7 grid h-14 w-14 place-items-center rounded-2xl bg-violet-50">
          <MailCheck className="h-7 w-7 text-violet-600" />
        </div>

        <h1 className="mt-5 text-2xl font-bold tracking-tight text-brand-900">Verify your email</h1>
        <p className="mt-2 text-brand-500">
          You're approved! Last step — we sent a verification link to{" "}
          {user?.email ? <span className="font-medium text-brand-700">{user.email}</span> : "your email"}.
          Click it, then come back and continue.
        </p>

        <div className="mt-7 flex flex-col gap-2">
          <Button onClick={handleContinue} disabled={checking} className="w-full">
            <RefreshCw className={`mr-2 h-4 w-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking…" : "I've verified — continue"}
          </Button>
          <Button variant="secondary" onClick={handleResend} disabled={sending} className="w-full">
            <Send className="mr-2 h-4 w-4" /> {sending ? "Sending…" : "Resend verification email"}
          </Button>
          <Button variant="ghost" onClick={handleLogout} className="w-full">
            <LogOut className="mr-2 h-4 w-4" /> Log out
          </Button>
        </div>

        <p className="mt-6 text-xs text-brand-400">
          Wrong address? Log out and sign up again with the correct email.
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";
import useAuth from "@/features/auth/useAuth";
import { signOut } from "@/features/auth/authService";
import { toast } from "@/components/ui/use-toast";
import { Clock, RefreshCw, LogOut } from "lucide-react";

const PendingPage = () => {
  const navigate = useNavigate();
  const { user, refreshApproval } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    try {
      const ok = await refreshApproval?.();
      if (ok) {
        toast({ title: "You're in!", description: "Your access has been approved." });
        navigate("/");
      } else {
        toast({ title: "Still on the waitlist", description: "We'll email you the moment you're approved." });
      }
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-50 px-5">
      <div className="w-full max-w-md rounded-2xl border border-brand-200 bg-white p-8 text-center shadow-brand-2">
        <div className="flex justify-center"><BrandLogo /></div>

        <div className="mx-auto mt-7 grid h-14 w-14 place-items-center rounded-2xl bg-violet-50">
          <Clock className="h-7 w-7 text-violet-600" />
        </div>

        <h1 className="mt-5 text-2xl font-bold tracking-tight text-brand-900">You're on the waitlist</h1>
        <p className="mt-2 text-brand-500">
          LinkedBloom is in closed beta. Your account{user?.email ? <> (<span className="font-medium text-brand-700">{user.email}</span>)</> : ""} is
          created and waiting for approval — we'll email you the moment you're in.
        </p>

        <div className="mt-7 flex flex-col gap-2">
          <Button onClick={handleRefresh} disabled={checking} className="w-full">
            <RefreshCw className={`mr-2 h-4 w-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking…" : "Refresh status"}
          </Button>
          <Button variant="ghost" onClick={handleLogout} className="w-full">
            <LogOut className="mr-2 h-4 w-4" /> Log out
          </Button>
        </div>

        <p className="mt-6 text-xs text-brand-400">
          Already approved? Click “Refresh status”, or just sign in again.
        </p>
      </div>
    </div>
  );
};

export default PendingPage;

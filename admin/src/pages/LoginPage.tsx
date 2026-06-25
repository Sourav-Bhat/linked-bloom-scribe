import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button, Card, Input, Spinner } from "@/components/ui";
import { useToast } from "@/components/toast";
import { ShieldCheck, AlertTriangle } from "lucide-react";

const friendly = (m: string) =>
  m.includes("auth/invalid-credential") || m.includes("auth/wrong-password") ? "Invalid email or password." :
  m.includes("auth/user-not-found") ? "No account with that email." :
  m.includes("auth/too-many-requests") ? "Too many attempts — try again shortly." :
  m.replace("Firebase:", "").trim();

const LoginPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const res = await cred.user.getIdTokenResult();
      if (res.claims.admin !== true) {
        await auth.signOut();
        setError("This account doesn't have admin access.");
        return;
      }
      navigate("/");
    } catch (err) {
      setError(friendly(err instanceof Error ? err.message : "Sign in failed"));
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    if (!email) { setError("Enter your email first, then click reset."); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      toast("Password reset email sent.");
    } catch (err) {
      setError(friendly(err instanceof Error ? err.message : "Couldn't send reset email"));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-5">
      <Card className="w-full max-w-sm p-8">
        <div className="flex items-center gap-2.5">
          <div className="brand-gradient grid h-10 w-10 place-items-center rounded-xl shadow-brand-2">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-[17px] font-bold tracking-tight">Linked<span className="text-gold-500">Bloom</span></div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-400">Admin console</div>
          </div>
        </div>

        <h1 className="mt-6 text-xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-brand-500">Admins only.</p>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-700">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required disabled={loading} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-700">Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required disabled={loading} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : "Sign in"}
          </Button>
        </form>

        <button onClick={reset} className="mt-4 text-sm font-medium text-violet-600 hover:underline">
          Forgot / change password?
        </button>
      </Card>
    </div>
  );
};

export default LoginPage;

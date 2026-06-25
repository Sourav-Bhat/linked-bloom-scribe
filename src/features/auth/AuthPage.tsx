import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { signInWithEmail, registerWithEmail, signInWithGoogle } from "@/features/auth/authService";
import BrandLogo from "@/components/BrandLogo";
import { AlertTriangle, Check } from "lucide-react";

interface AuthPageProps {
  mode: "login" | "signup";
}

const friendlyError = (msg: string): string => {
  if (msg.includes("auth/invalid-credential") || msg.includes("auth/wrong-password")) return "Invalid email or password.";
  if (msg.includes("auth/user-not-found")) return "No account found with that email. Create one below.";
  if (msg.includes("auth/email-already-in-use")) return "That email already has an account. Sign in instead.";
  if (msg.includes("auth/weak-password")) return "Password should be at least 6 characters.";
  if (msg.includes("auth/invalid-email")) return "That doesn't look like a valid email.";
  if (msg.includes("auth/network-request-failed")) return "Network error — check your connection and try again.";
  return msg.replace("Firebase:", "").trim();
};

const AuthPage = ({ mode }: AuthPageProps) => {
  const isSignup = mode === "signup";
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (isSignup && password !== confirm) {
      setErrorMsg("Passwords don't match.");
      return;
    }
    if (isSignup && password.length < 6) {
      setErrorMsg("Password should be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      if (isSignup) {
        await registerWithEmail(email, password);
        toast({ title: "Welcome to LinkedBloom!", description: "Let's set up your persona." });
      } else {
        await signInWithEmail(email, password);
        toast({ title: "Signed in", description: "Welcome back!" });
      }
      // App.tsx auth listener routes to /onboarding (new) or dashboard.
      navigate("/");
    } catch (error) {
      const friendly = friendlyError(error instanceof Error ? error.message : "Something went wrong");
      setErrorMsg(friendly);
      toast({ title: isSignup ? "Sign up failed" : "Sign in failed", description: friendly, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setErrorMsg("");
    setIsLoading(true);
    try {
      await signInWithGoogle();
      navigate("/");
    } catch (error) {
      setErrorMsg(friendlyError(error instanceof Error ? error.message : "Google sign-in failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Brand panel (desktop) */}
      <div className="relative hidden overflow-hidden bg-ink-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-[460px] w-[460px] rounded-full bg-violet-500/20 blur-3xl" />
        <Link to="/"><BrandLogo tone="light" /></Link>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">
            Be your own PR team.
          </h2>
          <p className="mt-4 text-white/70">
            LinkedBloom learns your voice and helps you show up on LinkedIn with posts that
            actually sound like you.
          </p>
          <ul className="mt-7 space-y-3">
            {["Persona-aware ghostwriting", "An always-on PR strategist", "Plan & schedule your rhythm"].map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-white/85">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10">
                  <Check className="h-3.5 w-3.5 text-gold-500" />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} LinkedBloom</p>
      </div>

      {/* Form panel */}
      <div className="flex min-h-screen items-center justify-center bg-brand-50 px-5 py-10 lg:min-h-0">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link to="/"><BrandLogo /></Link>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-brand-900">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1.5 text-sm text-brand-500">
            {isSignup ? "Start building your LinkedIn presence in minutes." : "Sign in to your strategist."}
          </p>

          {errorMsg && (
            <Alert variant="destructive" className="mt-5">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} disabled={isLoading} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} disabled={isLoading} required />
            </div>
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input id="confirm" type="password" placeholder="••••••••" value={confirm}
                  onChange={(e) => setConfirm(e.target.value)} disabled={isLoading} required />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-brand-200" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-brand-50 px-2 text-brand-400">or</span>
            </div>
          </div>

          <Button type="button" variant="secondary" className="w-full" onClick={handleGoogle} disabled={isLoading}>
            Continue with Google
          </Button>

          <p className="mt-6 text-center text-sm text-brand-500">
            {isSignup ? (
              <>Already have an account? <Link to="/login" className="font-semibold text-violet-600 hover:underline">Sign in</Link></>
            ) : (
              <>New to LinkedBloom? <Link to="/signup" className="font-semibold text-violet-600 hover:underline">Create an account</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

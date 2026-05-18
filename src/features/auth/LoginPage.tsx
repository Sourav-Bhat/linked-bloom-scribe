import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { signInWithEmail, signInWithGoogle } from "@/features/auth/authService";
import { AlertTriangle, Wifi, WifiOff } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      toast({ title: "No internet connection", variant: "destructive" });
      return;
    }
    setErrorMsg("");
    setIsLoading(true);
    try {
      await signInWithEmail(email, password);
      toast({ title: "Signed in successfully", description: "Welcome back!" });
      // App.tsx auth listener handles onboardingCompleted routing
      navigate("/");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Sign in failed";
      const friendly = msg.includes("auth/invalid-credential") || msg.includes("auth/wrong-password")
        ? "Invalid email or password."
        : msg.includes("auth/user-not-found")
        ? "No account found with that email. Please sign up."
        : msg.includes("auth/network-request-failed")
        ? "Network error — check your connection and try again."
        : msg;
      setErrorMsg(friendly);
      toast({ title: "Sign in failed", description: friendly, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isOnline) return;
    setIsLoading(true);
    setErrorMsg("");
    try {
      await signInWithGoogle();
      navigate("/");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Google sign-in failed";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center">
            {isOnline ? (
              <Wifi className="mr-2 h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="mr-2 h-5 w-5 text-red-500" />
            )}
            LinkedBloom Scribe
          </CardTitle>
          <CardDescription>
            {isOnline ? "Sign in to manage your LinkedIn presence" : "No internet connection"}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleEmailSignIn}>
          <CardContent className="space-y-4">
            {errorMsg && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isOnline || isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!isOnline || isLoading}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !isOnline}>
              {isLoading ? "Signing in..." : !isOnline ? "No Connection" : "Sign In"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoading || !isOnline}
            >
              Continue with Google
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
};

export default Login;

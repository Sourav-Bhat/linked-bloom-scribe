
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { signInWithEmail } from "@/services/authService";
import { hasCompletedProfile } from "@/services/profileService";
import { AlertTriangle, Wifi, WifiOff } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("aabb@abc.com");
  const [password, setPassword] = useState("123456");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionIssue, setConnectionIssue] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionIssue(false);
      console.log('[LOGIN] Connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionIssue(true);
      console.log('[LOGIN] Connection lost');
    };

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
      toast({
        title: "No internet connection",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
      return;
    }

    setErrorMsg("");
    setIsLoading(true);
    
    console.log('[LOGIN] Attempting sign in...');

    try {
      const user = await signInWithEmail(email, password);
      console.log('[LOGIN] Sign in successful:', user?.id);
      
      toast({
        title: "Signed in successfully",
        description: "Welcome back!",
      });
      
      // Check if user has completed profile with timeout
      if (user && user.id) {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Profile check timeout')), 10000)
        );

        try {
          const hasProfile = await Promise.race([
            hasCompletedProfile(user.id),
            timeoutPromise
          ]);
          
          if (hasProfile) {
            navigate("/");
          } else {
            navigate("/profile");
          }
        } catch (profileError) {
          console.warn('[LOGIN] Profile check failed, defaulting to profile page:', profileError);
          navigate("/profile");
        }
      } else {
        navigate("/profile");
      }
    } catch (error) {
      console.error("[LOGIN] Sign in error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Handle specific error cases
      if (errorMessage.includes("not configured") || errorMessage.includes("Email")) {
        setErrorMsg("Email auth not configured. Try using the test account credentials below.");
      } else if (errorMessage.includes("fetch") || errorMessage.includes("network")) {
        setConnectionIssue(true);
        setErrorMsg("Connection issue. Please check your internet and try again.");
      } else if (errorMessage.includes("Invalid login credentials")) {
        setErrorMsg("Invalid email or password. Please check your credentials.");
      } else {
        setErrorMsg(errorMessage);
      }
      
      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const retryConnection = async () => {
    setConnectionIssue(false);
    setErrorMsg("");
    
    // Simple connection test
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
        method: 'HEAD',
        mode: 'no-cors'
      });
      console.log('[LOGIN] Connection test completed');
    } catch (e) {
      console.warn('[LOGIN] Connection test failed:', e);
      setConnectionIssue(true);
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
            LinkedIn Content Manager
          </CardTitle>
          <CardDescription>
            {isOnline ? "Sign in to manage your LinkedIn content" : "No internet connection"}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleEmailSignIn}>
          <CardContent className="space-y-4">
            {/* Connection Issues Alert */}
            {connectionIssue && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span className="text-sm">Connection issue detected</span>
                  <Button variant="ghost" size="sm" onClick={retryConnection}>
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Error Messages */}
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
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !isOnline}
            >
              {isLoading ? "Signing in..." : !isOnline ? "No Connection" : "Sign In"}
            </Button>

            <div className="text-sm text-center text-gray-500 mt-4 p-3 bg-gray-100 rounded-md">
              <strong>Test Account:</strong><br />
              Email: aabb@abc.com<br />
              Password: 123456
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
};

export default Login;

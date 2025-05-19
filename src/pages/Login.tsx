
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { signInWithEmail } from "@/services/authService";
import { hasCompletedProfile } from "@/services/profileService";

const Login = () => {
  const [email, setEmail] = useState("aabb@abc.com");  // Pre-filled for easier testing
  const [password, setPassword] = useState("123456");   // Pre-filled for easier testing
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      setIsLoading(true);
      const user = await signInWithEmail(email, password);
      
      toast({
        title: "Signed in successfully",
        description: "Welcome back!",
      });
      
      // Check if user has completed profile
      if (user && user.id) {
        const hasProfile = await hasCompletedProfile(user.id);
        
        if (hasProfile) {
          navigate("/"); // Go to dashboard if profile is complete
        } else {
          navigate("/profile"); // Go to profile page if profile is incomplete
        }
      } else {
        navigate("/profile"); // Default to profile for safety
      }
    } catch (error) {
      console.error("Login error:", error);
      
      // Check for specific error messages
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (errorMessage.includes("not configured") || errorMessage.includes("Email")) {
        setErrorMsg("Email auth not configured. Try using the test account credentials below.");
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">LinkedIn Content Manager</CardTitle>
          <CardDescription>Sign in to manage your LinkedIn content</CardDescription>
        </CardHeader>

        <form onSubmit={handleEmailSignIn}>
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="p-3 text-sm bg-red-50 border border-red-200 rounded-md text-red-600">
                {errorMsg}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                required 
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
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

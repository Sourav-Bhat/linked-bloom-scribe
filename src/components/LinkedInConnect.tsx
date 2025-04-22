
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Linkedin } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { saveLinkedInToken } from "@/services/linkedinService";
import { auth } from "@/lib/firebase";

const LinkedInConnect = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const navigate = useNavigate();

  const connectLinkedIn = async () => {
    setIsConnecting(true);
    
    // In a real implementation, this would redirect to LinkedIn OAuth flow
    // For demo purposes, we'll simulate a successful connection
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Get current user
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to connect your LinkedIn account",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }
      
      // Mock token data
      const mockToken = "mock_linkedin_token_" + Date.now();
      const expiresAt = Date.now() + 86400000; // 24 hours from now
      
      // Save token
      await saveLinkedInToken(user.uid, mockToken, expiresAt);
      
      setIsConnected(true);
      toast({
        title: "LinkedIn connected!",
        description: "Your LinkedIn account has been successfully connected",
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Could not connect to LinkedIn. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Linkedin className="mr-2 h-5 w-5 text-linkedin-blue" />
          LinkedIn Integration
        </CardTitle>
        <CardDescription>
          Connect your LinkedIn account to post content automatically
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="bg-green-50 p-4 rounded-md">
            <p className="text-green-800 font-medium">Your LinkedIn account is connected</p>
            <p className="text-sm text-green-600 mt-1">You can now post content directly from the app</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Connect your LinkedIn account to enable automatic posting of your content
            directly to your LinkedIn profile. Once connected, you can schedule posts
            and view analytics.
          </p>
        )}
      </CardContent>
      <CardFooter>
        {isConnected ? (
          <div className="flex space-x-2">
            <Button variant="outline">Account Settings</Button>
            <Button variant="destructive" onClick={() => setIsConnected(false)}>Disconnect</Button>
          </div>
        ) : (
          <Button 
            onClick={connectLinkedIn} 
            disabled={isConnecting}
            className="bg-linkedin-blue hover:bg-linkedin-dark text-white"
          >
            {isConnecting ? "Connecting..." : "Connect LinkedIn Account"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default LinkedInConnect;

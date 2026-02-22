
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { createContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './integrations/supabase/client';
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Generator from "./pages/Generator";
import Calendar from "./pages/Calendar";
import Review from "./pages/Review";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const AuthContext = createContext<{user: User | null; setOnboardingCompleted?: (val: boolean) => void}>({user: null});

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Debug logging function
  const debugLog = (message: string, data?: any) => {
    console.log(`[APP DEBUG] ${message}`, data || '');
  };

  useEffect(() => {
    let mounted = true;
    debugLog('App component mounted, initializing auth...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        debugLog('Auth state changed:', { event, userId: session?.user?.id });
        setUser(session?.user ?? null);
        setAuthError(null);
        
        if (session?.user) {
          // Defer profile fetching to prevent deadlocks
          setTimeout(async () => {
            if (!mounted) return;
            
            try {
              debugLog('Fetching user profile...');
              const { data } = await supabase
                .from('profiles')
                .select('onboarding_completed')
                .eq('id', session.user.id)
                .single();
                
              if (mounted) {
                setOnboardingCompleted(data?.onboarding_completed ?? false);
                debugLog('Profile fetched successfully', { onboardingCompleted: data?.onboarding_completed });
              }
            } catch (error) {
              debugLog('Error fetching profile:', error);
              if (mounted) {
                setOnboardingCompleted(false);
              }
            }
          }, 0);
        } else {
          if (mounted) {
            setOnboardingCompleted(null);
          }
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    // Get initial session with comprehensive error handling
    const getInitialSession = async () => {
      if (!mounted) return;
      
      try {
        debugLog('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          debugLog('Error getting session:', error);
          setAuthError(`Authentication error: ${error.message}`);
          if (mounted) {
            setLoading(false);
          }
          return;
        }
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetching to prevent conflicts
          setTimeout(async () => {
            if (!mounted) return;
            
            try {
              debugLog('Fetching initial profile...');
              const { data } = await supabase
                .from('profiles')
                .select('onboarding_completed')
                .eq('id', session.user.id)
                .single();
                
              if (mounted) {
                setOnboardingCompleted(data?.onboarding_completed ?? false);
                setLoading(false);
                debugLog('Initial setup complete');
              }
            } catch (profileError) {
              debugLog('Error fetching initial profile:', profileError);
              if (mounted) {
                setOnboardingCompleted(false);
                setLoading(false);
              }
            }
          }, 100);
        } else {
          if (mounted) {
            setLoading(false);
            debugLog('No initial session found');
          }
        }
      } catch (sessionError) {
        debugLog('Critical error in getInitialSession:', sessionError);
        setAuthError(`Critical authentication error: ${sessionError instanceof Error ? sessionError.message : 'Unknown error'}`);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Add a small delay to let the page stabilize
    const initTimer = setTimeout(() => {
      getInitialSession();
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(initTimer);
      subscription.unsubscribe();
      debugLog('App component unmounted');
    };
  }, []);

  // Loading state with error handling
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-linkedin-blue mx-auto mb-4"></div>
          <p>Loading application...</p>
          {authError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm max-w-md">
              <p className="font-medium">Authentication Error:</p>
              <p>{authError}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-red-700 text-xs"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={{ user, setOnboardingCompleted }}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route 
                  path="/login" 
                  element={user ? <Navigate to={onboardingCompleted ? "/" : "/onboarding"} /> : <Login />} 
                />
                <Route 
                  path="/onboarding" 
                  element={
                    !user ? <Navigate to="/login" /> : 
                    onboardingCompleted ? <Navigate to="/" /> : 
                    <Onboarding />
                  } 
                />
                <Route 
                  path="/" 
                  element={
                    !user ? <Navigate to="/login" /> :
                    !onboardingCompleted ? <Navigate to="/onboarding" /> :
                    <Layout />
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="generator" element={<Generator />} />
                  <Route path="calendar" element={<Calendar />} />
                  <Route path="review/:postId" element={<Review />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthContext.Provider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;

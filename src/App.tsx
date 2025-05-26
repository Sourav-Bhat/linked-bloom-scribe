
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const AuthContext = createContext<{user: User | null}>({user: null});

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.id);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            const { data } = await supabase
              .from('profiles')
              .select('onboarding_completed')
              .eq('id', session.user.id)
              .single();
              
            if (mounted) {
              setOnboardingCompleted(data?.onboarding_completed ?? false);
            }
          } catch (error) {
            console.error('Error fetching profile:', error);
            if (mounted) {
              setOnboardingCompleted(false);
            }
          }
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

    // Get initial session with proper error handling
    const getInitialSession = async () => {
      if (!mounted) return;
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            const { data } = await supabase
              .from('profiles')
              .select('onboarding_completed')
              .eq('id', session.user.id)
              .single();
              
            if (mounted) {
              setOnboardingCompleted(data?.onboarding_completed ?? false);
              setLoading(false);
            }
          } catch (profileError) {
            console.error('Error fetching profile:', profileError);
            if (mounted) {
              setOnboardingCompleted(false);
              setLoading(false);
            }
          }
        } else {
          if (mounted) {
            setLoading(false);
          }
        }
      } catch (sessionError) {
        console.error('Error in getInitialSession:', sessionError);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-linkedin-blue mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ user }}>
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
  );
};

export default App;

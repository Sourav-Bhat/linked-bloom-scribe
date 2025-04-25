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

const queryClient = new QueryClient();

export const AuthContext = createContext<{user: User | null}>({user: null});

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', session.user.id)
            .single();
            
          setOnboardingCompleted(data?.onboarding_completed ?? false);
        } else {
          setOnboardingCompleted(null);
        }
        
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
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

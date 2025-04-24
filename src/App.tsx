import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange } from './services/authService';
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Generator from "./pages/Generator";
import Calendar from "./pages/Calendar";
import Review from "./pages/Review";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import { createContext } from 'react';

const queryClient = new QueryClient();

export const AuthContext = createContext<{user: User | null}>({user: null});

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
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
                element={user ? <Navigate to="/" /> : <Login />} 
              />
              <Route 
                path="/onboarding" 
                element={user ? <Onboarding /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/" 
                element={user ? <Layout /> : <Navigate to="/login" />}
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

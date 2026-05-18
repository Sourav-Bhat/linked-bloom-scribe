import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Dashboard from "@/features/dashboard/DashboardPage";
import Profile from "@/features/profile/ProfilePage";
import Generator from "@/features/generator/GeneratorPage";
import Calendar from "@/features/calendar/CalendarPage";
import Review from "@/features/review/ReviewPage";
import NotFound from "@/features/notfound/NotFoundPage";
import Login from "@/features/auth/LoginPage";
import Onboarding from "@/features/onboarding/OnboardingPage";
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

export const AuthContext = createContext<{
  user: User | null;
  setOnboardingCompleted?: (val: boolean) => void;
}>({ user: null });

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          setOnboardingCompleted(snap.data()?.onboardingCompleted ?? false);
        } catch {
          setOnboardingCompleted(false);
        }
      } else {
        setOnboardingCompleted(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-linkedin-blue mx-auto mb-4"></div>
          <p>Loading application...</p>
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

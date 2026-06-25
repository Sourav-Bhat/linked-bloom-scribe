import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { ensureAccessRecord } from "@/features/auth/authService";
import Dashboard from "@/features/dashboard/DashboardPage";
import Profile from "@/features/profile/ProfilePage";
import Generator from "@/features/generator/GeneratorPage";
import Calendar from "@/features/calendar/CalendarPage";
import Review from "@/features/review/ReviewPage";
import NotFound from "@/features/notfound/NotFoundPage";
import AuthPage from "@/features/auth/AuthPage";
import LandingPage from "@/features/marketing/LandingPage";
import PendingPage from "@/features/auth/PendingPage";
import VerifyEmailPage from "@/features/auth/VerifyEmailPage";
import Onboarding from "@/features/onboarding/OnboardingPage";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import DevModeBadge from "./components/DevModeBadge";

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
  approved: boolean;
  emailVerified: boolean;
  onboardingCompleted: boolean | null;
  setOnboardingCompleted?: (val: boolean) => void;
  refreshApproval?: () => Promise<boolean>;
}>({ user: null, approved: false, emailVerified: false, onboardingCompleted: null });

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [approved, setApproved] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  // Reload the user + force a token refresh to pick up a freshly-granted
  // `approved` claim or a just-completed email verification, then re-read state.
  // Used by the /pending and /verify-email "refresh / I've verified" buttons.
  const refreshApproval = async (): Promise<boolean> => {
    const u = auth.currentUser;
    if (!u) return false;
    try { await u.reload(); } catch { /* ignore */ }
    setEmailVerified(u.emailVerified);
    const tr = await u.getIdTokenResult(true);
    const ok = tr.claims.approved === true;
    setApproved(ok);
    try {
      const snap = await getDoc(doc(db, 'users', u.uid));
      setOnboardingCompleted(snap.data()?.onboardingCompleted ?? false);
    } catch {
      /* ignore */
    }
    return ok;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        setEmailVerified(firebaseUser.emailVerified);
        try {
          const tokenResult = await firebaseUser.getIdTokenResult();
          setApproved(tokenResult.claims.approved === true);
          // Create the pending access record on first login; bump lastLoginAt otherwise.
          await ensureAccessRecord(firebaseUser);
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          setOnboardingCompleted(snap.data()?.onboardingCompleted ?? false);
        } catch {
          setApproved(false);
          setOnboardingCompleted(false);
        }
      } else {
        setApproved(false);
        setEmailVerified(false);
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading application...</p>
        </div>
      </div>
    );
  }

  // Where an authenticated user belongs based on their gate state.
  // Google sign-in sets emailVerified=true automatically, so it skips /verify-email.
  const homeFor = () =>
    !approved ? "/pending" :
    !emailVerified ? "/verify-email" :
    !onboardingCompleted ? "/onboarding" : "/";

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={{ user, approved, emailVerified, onboardingCompleted, setOnboardingCompleted, refreshApproval }}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <DevModeBadge />
            <BrowserRouter>
              <Routes>
                <Route
                  path="/login"
                  element={user ? <Navigate to={homeFor()} /> : <AuthPage mode="login" />}
                />
                <Route
                  path="/signup"
                  element={user ? <Navigate to={homeFor()} /> : <AuthPage mode="signup" />}
                />
                <Route
                  path="/pending"
                  element={
                    !user ? <Navigate to="/login" /> :
                    approved ? <Navigate to="/" /> :
                    <PendingPage />
                  }
                />
                <Route
                  path="/verify-email"
                  element={
                    !user ? <Navigate to="/login" /> :
                    !approved ? <Navigate to="/pending" /> :
                    emailVerified ? <Navigate to="/" /> :
                    <VerifyEmailPage />
                  }
                />
                <Route
                  path="/onboarding"
                  element={
                    !user ? <Navigate to="/login" /> :
                    !approved ? <Navigate to="/pending" /> :
                    !emailVerified ? <Navigate to="/verify-email" /> :
                    onboardingCompleted ? <Navigate to="/" /> :
                    <Onboarding />
                  }
                />
                <Route
                  path="/"
                  element={
                    !user ? <LandingPage /> :
                    !approved ? <Navigate to="/pending" /> :
                    !emailVerified ? <Navigate to="/verify-email" /> :
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

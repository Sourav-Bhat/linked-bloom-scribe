import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";
import { ToastProvider } from "@/components/toast";
import { Spinner } from "@/components/ui";
import Layout from "@/components/Layout";
import LoginPage from "@/pages/LoginPage";
import AccessDenied from "@/pages/AccessDenied";
import DashboardPage from "@/pages/DashboardPage";
import WaitlistPage from "@/pages/WaitlistPage";
import UsersPage from "@/pages/UsersPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import AccountPage from "@/pages/AccountPage";

const Routed = () => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user && isAdmin ? <Navigate to="/" /> : <LoginPage />} />
      <Route
        path="/"
        element={
          !user ? <Navigate to="/login" /> :
          !isAdmin ? <AccessDenied /> :
          <Layout />
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="waitlist" element={<WaitlistPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="account" element={<AccountPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App = () => (
  <AuthProvider>
    <ToastProvider>
      <BrowserRouter>
        <Routed />
      </BrowserRouter>
    </ToastProvider>
  </AuthProvider>
);

export default App;

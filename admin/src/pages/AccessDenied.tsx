import { useNavigate } from "react-router-dom";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/features/auth/AuthProvider";
import { ShieldX } from "lucide-react";

const AccessDenied = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-5">
      <Card className="w-full max-w-sm p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-danger-bg">
          <ShieldX className="h-7 w-7 text-danger" />
        </div>
        <h1 className="mt-5 text-xl font-bold tracking-tight">Access denied</h1>
        <p className="mt-2 text-sm text-brand-500">
          {user?.email ? <span className="font-medium text-brand-700">{user.email}</span> : "This account"} isn't an admin.
          Ask an existing admin to grant you the <code>admin</code> claim.
        </p>
        <Button variant="secondary" className="mt-6 w-full" onClick={async () => { await signOut(); navigate("/login"); }}>
          Sign out
        </Button>
      </Card>
    </div>
  );
};

export default AccessDenied;

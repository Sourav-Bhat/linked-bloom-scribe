import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Sparkles, Calendar as CalendarIcon, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/features/auth/authService";
import { useToast } from "@/hooks/use-toast";
import useAuth from "@/features/auth/useAuth";
import BrandLogo from "@/components/BrandLogo";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/" },
  { name: "Generator", icon: Sparkles, path: "/generator" },
  { name: "Calendar", icon: CalendarIcon, path: "/calendar" },
  { name: "Persona & Agent", icon: User, path: "/profile" },
];

interface SidebarProps {
  onNavigate?: () => void;
}

const Sidebar = ({ onNavigate }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({ title: "Logged out successfully" });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Error logging out",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const email = user?.email ?? "";
  const initial = (email[0] ?? "U").toUpperCase();
  const name = email ? email.split("@")[0] : "Your account";

  return (
    <aside className="flex h-full w-64 flex-col gap-6 bg-ink-900 p-4 text-white">
      <Link to="/" onClick={onNavigate} className="px-2 pt-2">
        <BrandLogo tone="light" />
        <p className="mt-1 pl-[46px] text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/45">
          AI brand strategist
        </p>
      </Link>

      <nav className="flex flex-col gap-0.5">
        {menuItems.map((item) => {
          const active = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
              )}
            >
              <item.icon className={cn("h-[18px] w-[18px]", active ? "text-violet-500" : "text-white/50")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
          <div className="flex items-center gap-2">
            <span className="text-gold-500">✦</span>
            <span className="text-[15px] font-semibold">Bloom Pro</span>
          </div>
          <p className="mt-1 text-xs text-white/55">Unlimited drafts, analytics &amp; weekly reviews.</p>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-lg px-1 py-1">
          <div className="flex min-w-0 items-center gap-3">
            <div className="brand-gradient grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold text-white">
              {initial}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold capitalize text-white">{name}</div>
              <div className="truncate text-xs text-white/50">{email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

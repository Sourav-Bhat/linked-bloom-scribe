import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Clock, Users, BarChart3, Settings, LogOut, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/AuthProvider";
import { USE_EMULATORS } from "@/lib/firebase";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/waitlist", label: "Waitlist", icon: Clock },
  { to: "/users", label: "Users", icon: Users },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/account", label: "Account", icon: Settings },
];

const Layout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const initial = (user?.email?.[0] ?? "A").toUpperCase();

  return (
    <div className="md:grid md:grid-cols-[248px_1fr] min-h-screen">
      <aside className="sticky top-0 hidden h-screen flex-col gap-6 bg-ink-900 p-4 text-white md:flex">
        <div className="px-2 pt-2">
          <div className="flex items-center gap-2.5">
            <div className="brand-gradient grid h-9 w-9 place-items-center rounded-[10px] shadow-brand-2">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-[16px] font-bold tracking-tight">Linked<span className="text-gold-500">Bloom</span></div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/45">Admin console</div>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-0.5">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <n.icon className={cn("h-[18px] w-[18px]", isActive ? "text-violet-500" : "text-white/50")} />
                  {n.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex items-center justify-between gap-2 rounded-lg px-1 py-1">
          <div className="flex min-w-0 items-center gap-3">
            <div className="brand-gradient grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold text-white">{initial}</div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">Admin</div>
              <div className="truncate text-xs text-white/50">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={async () => { await signOut(); navigate("/login"); }}
            title="Sign out"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        {USE_EMULATORS && (
          <div className="bg-gold-500 px-4 py-1 text-center text-xs font-semibold text-black">
            LOCAL EMULATOR — connected to demo-linkedbloom
          </div>
        )}
        {/* Mobile header */}
        <div className="flex items-center gap-2 border-b border-brand-200 bg-ink-900 px-4 py-3 text-white md:hidden">
          <ShieldCheck className="h-5 w-5 text-gold-500" />
          <span className="font-bold">LinkedBloom Admin</span>
          <button onClick={async () => { await signOut(); navigate("/login"); }} className="ml-auto text-white/70">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
        <main className="mx-auto w-full max-w-[1180px] px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

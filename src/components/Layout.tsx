import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Toaster } from "@/components/ui/toaster";
import { Menu, X } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-50">
      <div className="md:grid md:grid-cols-[256px_1fr]">
        {/* Desktop sidebar */}
        <div className="sticky top-0 hidden h-screen md:block">
          <Sidebar />
        </div>

        {/* Mobile slide-in sidebar */}
        {mobileOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-ink-900/40 md:hidden" onClick={() => setMobileOpen(false)} />
            <div className="fixed inset-y-0 left-0 z-50 md:hidden">
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </>
        )}

        <div className="flex min-w-0 flex-col">
          {/* Mobile topbar */}
          <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-brand-200 bg-white px-4 py-3 md:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="grid h-9 w-9 place-items-center rounded-lg border border-brand-200 bg-white"
            >
              <Menu className="h-[18px] w-[18px]" />
            </button>
            <BrandLogo size={28} />
          </div>

          <main className="mx-auto w-full max-w-[1180px] px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </main>
        </div>
      </div>
      <Toaster />
    </div>
  );
};

export default Layout;

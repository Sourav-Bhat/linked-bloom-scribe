
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Toaster } from "@/components/ui/toaster";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const Layout = () => {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const isMobile = useIsMobile();

  const toggleSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex relative">
        {/* Mobile menu toggle */}
        {isMobile && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute top-2 left-2 z-20 md:hidden"
            onClick={toggleSidebar}
          >
            {showMobileSidebar ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        )}
        
        {/* Mobile backdrop */}
        {isMobile && showMobileSidebar && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}
        
        {/* Sidebar */}
        <div 
          className={`${
            isMobile 
              ? `fixed inset-y-0 left-0 z-20 transform ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 ease-in-out md:relative md:translate-x-0`
              : 'relative'
          }`}
        >
          <Sidebar />
        </div>
        
        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 pt-10 md:pt-6 w-full max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
};

export default Layout;

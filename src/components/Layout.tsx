
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Toaster } from "@/components/ui/toaster";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Layout = () => {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [extensionWarning, setExtensionWarning] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Detect potential browser extension interference
    const checkForExtensionInterference = () => {
      // Check for common extension indicators
      const extensionIndicators = [
        'clearly-extension',
        'adblock',
        'ublock',
        'ghostery',
        'disconnect'
      ];

      const hasExtensionInterference = extensionIndicators.some(indicator =>
        document.querySelector(`[class*="${indicator}"]`) ||
        document.querySelector(`[id*="${indicator}"]`) ||
        window.location.href.includes('extension')
      );

      // Check for blocked resources
      const hasBlockedResources = performance.getEntriesByType('resource').some(
        (entry: any) => entry.transferSize === 0 && entry.decodedBodySize === 0
      );

      if (hasExtensionInterference || hasBlockedResources) {
        console.warn('Potential browser extension interference detected');
        setExtensionWarning(true);
      }
    };

    // Run check after a delay to let page load
    const timer = setTimeout(checkForExtensionInterference, 2000);
    return () => clearTimeout(timer);
  }, []);

  const toggleSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };

  const dismissWarning = () => {
    setExtensionWarning(false);
    localStorage.setItem('extension-warning-dismissed', 'true');
  };

  // Check if warning was previously dismissed
  const warningDismissed = localStorage.getItem('extension-warning-dismissed') === 'true';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      {/* Extension Warning */}
      {extensionWarning && !warningDismissed && (
        <Alert className="mx-4 mt-2 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">
              Browser extensions may be interfering with the app. Try disabling extensions if you experience issues.
            </span>
            <Button variant="ghost" size="sm" onClick={dismissWarning}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
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

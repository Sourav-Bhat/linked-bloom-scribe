
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Navbar = () => {
  const isMobile = useIsMobile();
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl sm:text-2xl font-bold text-linkedin-blue truncate">
                {isMobile ? "LCM" : "LinkedIn Content Manager"}
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="h-8 w-8 rounded-full bg-linkedin-dark flex items-center justify-center text-white font-semibold text-sm">
              JD
            </div>
            <Button variant="outline" className="hidden sm:inline-flex">Help</Button>
            <Button className="bg-linkedin-blue hover:bg-linkedin-dark text-xs sm:text-sm px-2 sm:px-4">
              Upgrade
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

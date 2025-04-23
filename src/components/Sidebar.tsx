import { Link, useLocation, useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, Home, Settings, Edit, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/services/authService";
import { toast } from "@/components/ui/use-toast";

const menuItems = [{
  name: "Dashboard",
  icon: Home,
  path: "/"
}, {
  name: "Profile",
  icon: User,
  path: "/profile"
}, {
  name: "Generator",
  icon: Edit,
  path: "/generator"
}, {
  name: "Calendar",
  icon: CalendarIcon,
  path: "/calendar"
}];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out successfully",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Error logging out",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return <aside className="w-64 min-h-screen bg-white border-r border-gray-200 hidden md:block relative">
      <div className="flex justify-center mt-6 mb-6">
        <div className="h-10 w-10 rounded-full bg-linkedin-blue flex items-center justify-center text-white font-bold">
          LCM
        </div>
      </div>
      <nav className="mt-5">
        <ul className="space-y-1 px-2">
          {menuItems.map(item => <li key={item.name}>
              <Link to={item.path} className={cn("flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-linkedin-lightblue hover:text-linkedin-blue", location.pathname === item.path && "bg-linkedin-lightblue text-linkedin-blue")}>
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            </li>)}
        </ul>
      </nav>
      
      <div className="mt-auto pt-8 px-4 absolute bottom-0 left-0 right-0">
        <div className="border-t pt-4 space-y-1">
          <Link 
            to="/settings" 
            className={cn(
              "flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-linkedin-lightblue hover:text-linkedin-blue",
              location.pathname === "/settings" && "bg-linkedin-lightblue text-linkedin-blue"
            )}
          >
            <Settings className="h-5 w-5 mr-3" />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-linkedin-lightblue hover:text-linkedin-blue"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </button>
        </div>
      </div>
    </aside>;
};

export default Sidebar;

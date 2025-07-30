import { useLocation } from "wouter";
import { Shield, BarChart3, Users, Code, Globe, ListTodo, LogOut } from "lucide-react";
import { clearAuth, getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Users", href: "/users", icon: Users },
  { name: "Scripts", href: "/scripts", icon: Code },
  { name: "Countries", href: "/countries", icon: Globe },
  { name: "ListTodo & Logs", href: "/tasks", icon: ListTodo },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    clearAuth();
    setLocation("/login");
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center px-6 py-4 border-b border-gray-200">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
            <Shield className="text-white h-4 w-4" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">OTP Platform</h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  setLocation(item.href);
                }}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "text-primary bg-blue-50"
                    : "text-gray-600 hover:text-primary hover:bg-gray-50"
                }`}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.name}
              </a>
            );
          })}
        </nav>

        {/* User Menu */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <Users className="text-gray-600 h-4 w-4" />
              </div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {currentUser?.email || "Admin User"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

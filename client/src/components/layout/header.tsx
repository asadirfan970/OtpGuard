import { useLocation } from "wouter";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/users": "User Management",
  "/scripts": "Script Management",
  "/countries": "Country Management",
  "/tasks": "Tasks & Logs",
};

export default function Header() {
  const [location] = useLocation();
  const title = pageTitles[location] || "Dashboard";

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      </div>
    </header>
  );
}

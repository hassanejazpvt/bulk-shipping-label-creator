import { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Tag,
  Upload,
  History,
  DollarSign,
  CreditCard,
  Settings,
  HelpCircle,
} from "lucide-react";

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
}

const menuItems: MenuItem[] = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Create a Label", path: "/create-label", icon: Tag },
  { name: "Upload Spreadsheet", path: "/upload", icon: Upload, active: true },
  { name: "Order History", path: "/history", icon: History },
  { name: "Pricing", path: "/pricing", icon: DollarSign },
  { name: "Billing", path: "/billing", icon: CreditCard },
  { name: "Settings", path: "/settings", icon: Settings },
  { name: "Support & Help", path: "/support", icon: HelpCircle },
];

function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">Shipping Platform</h1>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path === "/upload" &&
                location.pathname.startsWith("/upload"));

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${
                      isActive
                        ? "bg-primary-600 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }
                    ${!item.active ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                  onClick={(e) => {
                    if (!item.active) {
                      e.preventDefault();
                    }
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export default memo(Sidebar);

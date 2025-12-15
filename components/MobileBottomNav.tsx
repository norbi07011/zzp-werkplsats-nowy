/**
 * ================================================================
 * MOBILE BOTTOM NAVIGATION - Stały dolny pasek nawigacji
 * ================================================================
 *
 * 4 przyciski: Panel, Kanał, Zespół, Menu (hamburger)
 * Ustawienia dostępne przez Menu → Sidebar
 * Widoczny tylko na mobile (md:hidden)
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface MobileBottomNavProps {
  onMenuClick: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onMenuClick,
}) => {
  const location = useLocation();
  const { user } = useAuth();

  // Get role-specific panel route
  const getPanelRoute = () => {
    if (!user) return "/";
    switch (user.role) {
      case "admin":
        return "/admin";
      case "employer":
        return "/employer";
      case "worker":
        return "/worker";
      case "accountant":
        return "/accountant/dashboard";
      case "cleaning_company":
        return "/cleaning-company";
      case "regular_user":
        return "/regular-user";
      default:
        return "/";
    }
  };

  // Base navigation items
  const navItems: {
    to: string;
    icon: string;
    label: string;
    badge?: number;
  }[] = [
    { to: getPanelRoute(), icon: "🏠", label: "Panel" },
    { to: "/feed", icon: "📰", label: "Kanał" },
  ];

  const isActive = (path: string) => {
    if (path === getPanelRoute()) {
      // Panel is active for role-specific routes
      return (
        location.pathname === path || location.pathname.startsWith(path + "/")
      );
    }
    return location.pathname === path;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-primary-navy/95 backdrop-blur-lg border-t border-accent-cyber/30 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`
              flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-xl
              transition-all duration-200 relative
              ${
                isActive(item.to)
                  ? "text-accent-cyber bg-accent-cyber/10"
                  : "text-neutral-400 hover:text-neutral-200"
              }
            `}
          >
            <span className="text-xl mb-0.5">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>

            {/* Badge for notifications */}
            {item.badge && item.badge > 0 && (
              <span className="absolute top-1 right-1/4 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full shadow-lg">
                {item.badge > 9 ? "9+" : item.badge}
              </span>
            )}

            {/* Active indicator */}
            {isActive(item.to) && (
              <span className="absolute -bottom-0 left-1/4 right-1/4 h-0.5 bg-accent-cyber rounded-full" />
            )}
          </Link>
        ))}

        {/* Hamburger Menu Button */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-xl text-neutral-400 hover:text-neutral-200 transition-all duration-200"
          aria-label="Otwórz menu"
        >
          <span className="text-xl mb-0.5">☰</span>
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;

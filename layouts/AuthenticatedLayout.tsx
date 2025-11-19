import { Link, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { NotificationBell } from "../components/NotificationBell";
import { useInvites } from "../src/hooks/useInvites";

export const AuthenticatedLayout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { pendingCount } = useInvites();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Unified navigation - simple & consistent for all roles
  const getNavItems = () => {
    if (!user) return [];

    // Get role-specific panel route
    const getPanelRoute = () => {
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
        default:
          return "/";
      }
    };

    // ✅ UNIFIED NAVIGATION (4 links for all roles)
    return [
      { to: getPanelRoute(), label: "🏠 Panel" },
      { to: "/feed", label: "📰 Feed" },
      { to: "/team", label: "👥 Team" },
      { to: "/settings", label: "⚙️ Settings" },
    ];
  };

  return (
    <div className="min-h-screen bg-primary-dark flex flex-col">
      {/* Header */}
      <header className="bg-primary-navy/80 backdrop-blur-md border-b border-accent-cyber/20 sticky top-0 z-50 shadow-glow-cyber">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-12 h-12 bg-gradient-cyber rounded-xl flex items-center justify-center shadow-glow-cyber group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-xl">ZZP</span>
              </div>
              <span className="text-2xl font-bold text-white font-heading">
                {t("common.platformName", "ZZP Werkplaats")}
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {getNavItems().map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="px-4 py-2 text-neutral-300 hover:text-accent-cyber hover:bg-accent-cyber/10 rounded-xl font-medium transition-all relative group"
                >
                  {item.label}
                  {item.to === "/team" && pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-lg">
                      {pendingCount}
                    </span>
                  )}
                  <span className="absolute bottom-1 left-4 right-4 h-0.5 bg-accent-cyber scale-x-0 group-hover:scale-x-100 transition-transform"></span>
                </Link>
              ))}
            </nav>

            {/* Right side: Notifications + User info + Language + Logout */}
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <NotificationBell />

              {user && (
                <div className="hidden md:flex items-center space-x-3 px-4 py-2 bg-gradient-glass backdrop-blur-md border border-accent-cyber/20 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-cyber rounded-full flex items-center justify-center text-white font-bold shadow-glow-cyber">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">
                      {user.fullName}
                    </p>
                    <p className="text-xs text-accent-cyber capitalize">
                      {user.role}
                    </p>
                  </div>
                </div>
              )}
              <LanguageSwitcher />
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-neutral-300 hover:text-red-400 hover:bg-red-500/10 rounded-xl font-medium transition-all flex items-center gap-2 border border-transparent hover:border-red-500/30"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden md:inline">Wyloguj</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600">
          © 2025 ZZP Werkplaats. Wszystkie prawa zastrzeżone.
        </div>
      </footer>
    </div>
  );
};

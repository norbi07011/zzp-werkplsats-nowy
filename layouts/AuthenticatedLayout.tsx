import { Link, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { useSidebar } from "../contexts/SidebarContext";
import { NotificationBell } from "../components/NotificationBell";
import { MobileBottomNav } from "../components/MobileBottomNav";

export const AuthenticatedLayout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { openSidebar } = useSidebar();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Get dashboard route based on user role
  const getDashboardRoute = () => {
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

  // Unified navigation - simple & consistent for all roles
  const getNavItems = () => {
    if (!user) return [];

    // Base navigation (available for all roles)
    return [
      { to: getDashboardRoute(), label: "🏠 Profil" },
      { to: "/feed", label: "📰 Feed" },
    ];
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col relative overflow-hidden">
      {/* ===== SUBTLE WAVE BACKGROUND - Minimalist like reference ===== */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Clean base */}
        <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-50/80" />

        {/* Single subtle wave - top right corner only */}
        <svg
          className="absolute -top-10 -right-20 w-[700px] h-[500px] opacity-[0.06]"
          viewBox="0 0 700 500"
          fill="none"
        >
          <path
            d="M100 0C200 100 300 50 400 120C500 190 600 80 700 150V0H100Z"
            fill="url(#topWave)"
          />
          <defs>
            <linearGradient id="topWave" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#0EA5E9" />
            </linearGradient>
          </defs>
        </svg>

        {/* Very subtle bottom accent */}
        <svg
          className="absolute -bottom-40 -left-20 w-[500px] h-[300px] opacity-[0.04]"
          viewBox="0 0 500 300"
          fill="none"
        >
          <path
            d="M0 200C100 150 200 250 300 180C400 110 500 200 500 150V300H0V200Z"
            fill="url(#bottomWave)"
          />
          <defs>
            <linearGradient id="bottomWave" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A5B4FC" />
              <stop offset="100%" stopColor="#C4B5FD" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* ===== PREMIUM HOLOGRAPHIC HEADER ===== */}
      <header className="sticky top-0 z-50">
        {/* Holographic gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500" />

        {/* Animated holographic overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_100%] animate-shimmer" />

        {/* Neon glow effect */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-cyan-500/20 to-transparent blur-xl" />

        {/* Main header bar */}
        <div className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <Link
                to="/"
                className="flex items-center space-x-2 md:space-x-3 group"
              >
                <div className="w-10 h-10 md:w-11 md:h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 group-hover:bg-white/30 group-hover:scale-105 transition-all duration-300">
                  <span className="text-white font-bold text-base md:text-lg tracking-tight">
                    ZZP
                  </span>
                </div>
                <span className="hidden sm:block text-xl md:text-2xl font-bold text-white">
                  {t("common.platformName", "ZZP Werkplaats")}
                </span>
              </Link>

              {/* Desktop Navigation - Glassmorphism pills */}
              <nav className="hidden md:flex items-center">
                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full px-1.5 py-1.5 border border-white/20">
                  {getNavItems().map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="px-5 py-2.5 text-white/80 hover:text-white hover:bg-white/15 rounded-full font-medium transition-all duration-200 text-sm"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </nav>

              {/* Right side */}
              <div className="flex items-center space-x-2 md:space-x-3">
                {/* Mobile Hamburger Menu Button */}
                <button
                  onClick={openSidebar}
                  className="md:hidden p-2.5 text-white/80 hover:text-white hover:bg-white/15 rounded-xl transition-all"
                  aria-label="Otwórz menu"
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
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>

                {/* Notification Bell */}
                <NotificationBell />

                {/* User Avatar - only avatar, name is in sidebar */}
                {user && (
                  <div className="w-9 h-9 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center text-white font-semibold text-sm cursor-pointer hover:bg-white/30 hover:scale-105 transition-all">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Logout Button - Desktop only */}
                <button
                  onClick={handleLogout}
                  className="hidden md:flex px-3 py-2 text-white/80 hover:text-white hover:bg-white/15 rounded-full font-medium items-center gap-1.5 text-sm"
                >
                  <svg
                    className="w-4 h-4"
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
                  <span>{t("nav.logout", "Wyloguj")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Footer - Desktop only */}
      <footer className="hidden md:block bg-white/80 backdrop-blur-sm border-t border-slate-200/50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
          © 2025 ZZP Werkplaats. Wszystkie prawa zastrzeżone.
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

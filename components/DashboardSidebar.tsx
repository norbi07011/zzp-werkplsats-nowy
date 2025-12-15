/**
 * ================================================================
 * DASHBOARD SIDEBAR - Beautiful left sidebar navigation
 * ================================================================
 * Replaces horizontal tabs with vertical sidebar like InvoiceApp
 * Desktop: Always visible sidebar (collapsible)
 * Mobile: Drawer from left side
 */

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import {
  LayoutDashboard,
  User,
  Eye,
  MessageSquare,
  Star,
  Clipboard,
  Palette,
  CreditCard,
  Briefcase,
  ClipboardList,
  FileText,
  Users,
  Bookmark,
  Settings,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Menu,
  X,
  Search,
  Headphones,
  Receipt,
  HardHat,
  Building2,
  Calculator,
  Sparkles,
} from "lucide-react";

import type { UnifiedTab } from "./UnifiedDashboardTabs";

interface TabConfig {
  id: UnifiedTab;
  label: string;
  icon: React.ElementType;
  description: string;
  roles: string[];
}

const ALL_TABS: TabConfig[] = [
  {
    id: "overview",
    label: "Przegląd",
    icon: LayoutDashboard,
    description: "Dashboard, statystyki, aktywność",
    roles: ["worker", "regular_user"],
  },
  {
    id: "profile",
    label: "Profil",
    icon: User,
    description: "Profil, statystyki, aktywność, edycja",
    roles: ["admin", "employer", "accountant", "cleaning_company"],
  },
  {
    id: "my_profile",
    label: "Mój Profil",
    icon: Eye,
    description: "Podgląd publicznego profilu",
    roles: ["admin", "employer", "worker", "accountant", "cleaning_company"],
  },
  {
    id: "messages",
    label: "Wiadomości",
    icon: MessageSquare,
    description: "Chat, powiadomienia, korespondencja",
    roles: [
      "admin",
      "employer",
      "worker",
      "accountant",
      "cleaning_company",
      "regular_user",
    ],
  },
  {
    id: "reviews",
    label: "Opinie",
    icon: Star,
    description: "Oceny, recenzje, referencje",
    roles: ["admin", "employer", "worker", "accountant", "cleaning_company"],
  },
  {
    id: "tablica",
    label: "Tablica",
    icon: Clipboard,
    description: "Tablica ogłoszeń - oferty pracy, reklamy",
    roles: ["admin", "employer", "worker", "accountant", "cleaning_company"],
  },
  {
    id: "portfolio",
    label: "Portfolio",
    icon: Palette,
    description: "Portfolio prac, galeria, projekty",
    roles: ["worker", "cleaning_company"],
  },
  {
    id: "subscription",
    label: "Subskrypcja",
    icon: CreditCard,
    description: "Plan subskrypcyjny, płatności",
    roles: [
      "worker",
      "cleaning_company",
      "accountant",
      "employer",
      "regular_user",
    ],
  },
  {
    id: "services",
    label: "Usługi",
    icon: Briefcase,
    description: "Usługi księgowe",
    roles: ["accountant"],
  },
  {
    id: "submissions",
    label: "Zgłoszenia",
    icon: ClipboardList,
    description: "Zgłoszenia od klientów",
    roles: ["accountant"],
  },
  {
    id: "forms",
    label: "Formularze",
    icon: FileText,
    description: "Formularze, dokumenty",
    roles: ["accountant"],
  },
  {
    id: "team",
    label: "Drużyna",
    icon: Users,
    description: "Zarządzanie zespołem",
    roles: ["accountant", "worker", "cleaning_company"],
  },
  {
    id: "my_posts",
    label: "Moje Zlecenia",
    icon: FileText,
    description: "Zarządzanie zleceniami",
    roles: ["employer", "accountant", "admin"],
  },
  {
    id: "saved_activity",
    label: "Historia",
    icon: Bookmark,
    description: "Zapisane posty, polubiane",
    roles: ["admin", "employer", "worker", "accountant", "cleaning_company"],
  },
  {
    id: "settings",
    label: "Ustawienia",
    icon: Settings,
    description: "Konto, powiadomienia, prywatność",
    roles: [
      "admin",
      "employer",
      "worker",
      "accountant",
      "cleaning_company",
      "regular_user",
    ],
  },
];

interface DashboardSidebarProps {
  activeTab: UnifiedTab;
  onTabChange: (tab: UnifiedTab) => void;
  title?: string;
  subtitle?: string;
  unreadMessages?: number;
  isMobile?: boolean;
  isMobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
  onSupportClick?: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeTab,
  onTabChange,
  title,
  subtitle,
  unreadMessages = 0,
  isMobile = false,
  isMobileMenuOpen = false,
  onMobileMenuToggle,
  onSupportClick,
}) => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isExpertsOpen, setIsExpertsOpen] = useState(false);

  if (!user) return null;

  const visibleTabs = ALL_TABS.filter((tab) => tab.roles.includes(user.role));

  // Get role display name
  const getRoleDisplayName = () => {
    switch (user.role) {
      case "admin":
        return "Administrator";
      case "employer":
        return "Pracodawca";
      case "worker":
        return "Pracownik";
      case "accountant":
        return "Księgowy";
      case "cleaning_company":
        return "Firma Sprzątająca";
      default:
        return "Użytkownik";
    }
  };

  // Sidebar content component
  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          {(!isCollapsed || isMobile) && (
            <div className="min-w-0 flex-1">
              {/* Logo at the top */}
              <div className="mb-3">
                <Logo variant="full" size="sm" />
              </div>
              <h1 className="text-xl font-bold truncate">
                {title || `🏠 ${getRoleDisplayName()}`}
              </h1>
              <p className="text-xs text-blue-300 truncate">
                {subtitle || "Panel zarządzania"}
              </p>
            </div>
          )}
          {isCollapsed && !isMobile && (
            <div className="flex justify-center w-full">
              <Logo variant="icon" size="sm" />
            </div>
          )}
          {!isMobile && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              title={isCollapsed ? "Rozwiń" : "Zwiń"}
            >
              {isCollapsed ? (
                <ChevronRight size={20} />
              ) : (
                <ChevronLeft size={20} />
              )}
            </button>
          )}
          {isMobile && onMobileMenuToggle && (
            <button
              onClick={onMobileMenuToggle}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const showBadge = tab.id === "messages" && unreadMessages > 0;

          return (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id);
                if (isMobile && onMobileMenuToggle) {
                  onMobileMenuToggle();
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all min-h-[48px] ${
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg text-white"
                  : "hover:bg-white/10 text-gray-200"
              }`}
              title={isCollapsed && !isMobile ? tab.label : undefined}
            >
              <div className="relative flex-shrink-0">
                <Icon size={22} />
                {showBadge && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </div>
              {(!isCollapsed || isMobile) && (
                <span className="font-medium text-sm truncate">
                  {tab.label}
                </span>
              )}
            </button>
          );
        })}

        {/* Link to Tablica for regular_user */}
        {user.role === "regular_user" && (
          <Link
            to="/feed"
            onClick={() =>
              isMobile && onMobileMenuToggle && onMobileMenuToggle()
            }
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all min-h-[48px] hover:bg-white/10 text-gray-200"
            title={isCollapsed && !isMobile ? "Tablica Ogłoszeń" : undefined}
          >
            <Clipboard size={22} className="flex-shrink-0 text-blue-400" />
            {(!isCollapsed || isMobile) && (
              <span className="font-medium text-sm">Tablica Ogłoszeń</span>
            )}
          </Link>
        )}

        {/* Link to Invoices Module */}
        <div className="pt-4 border-t border-white/10 mt-4">
          {(!isCollapsed || isMobile) && (
            <p className="text-xs text-blue-300 px-4 mb-2 uppercase tracking-wider">
              Moduły
            </p>
          )}

          {/* Eksperci Zoek Dropdown */}
          <div className="mb-1">
            <button
              onClick={() => setIsExpertsOpen(!isExpertsOpen)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all min-h-[48px] ${
                isExpertsOpen
                  ? "bg-gradient-to-r from-teal-500/20 to-cyan-500/10 text-teal-300"
                  : "hover:bg-white/10 text-gray-200"
              }`}
              title={isCollapsed && !isMobile ? "Eksperci Zoek" : undefined}
            >
              <Search size={22} className="flex-shrink-0 text-teal-400" />
              {(!isCollapsed || isMobile) && (
                <>
                  <span className="font-medium text-sm flex-1 text-left">
                    Eksperci Zoek
                  </span>
                  <ChevronDown
                    size={18}
                    className={`transition-transform duration-200 ${
                      isExpertsOpen ? "rotate-180" : ""
                    }`}
                  />
                </>
              )}
            </button>

            {/* Dropdown Items */}
            {isExpertsOpen && (!isCollapsed || isMobile) && (
              <div className="ml-4 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                <Link
                  to="/workers"
                  onClick={() =>
                    isMobile && onMobileMenuToggle && onMobileMenuToggle()
                  }
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all hover:bg-cyan-500/20 text-gray-300 hover:text-white group"
                >
                  <HardHat
                    size={18}
                    className="text-cyan-400 group-hover:scale-110 transition-transform"
                  />
                  <span className="text-sm">Pracownicy</span>
                </Link>
                <Link
                  to="/employers"
                  onClick={() =>
                    isMobile && onMobileMenuToggle && onMobileMenuToggle()
                  }
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all hover:bg-orange-500/20 text-gray-300 hover:text-white group"
                >
                  <Building2
                    size={18}
                    className="text-orange-400 group-hover:scale-110 transition-transform"
                  />
                  <span className="text-sm">Pracodawcy</span>
                </Link>
                <Link
                  to="/accountants"
                  onClick={() =>
                    isMobile && onMobileMenuToggle && onMobileMenuToggle()
                  }
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all hover:bg-indigo-500/20 text-gray-300 hover:text-white group"
                >
                  <Calculator
                    size={18}
                    className="text-indigo-400 group-hover:scale-110 transition-transform"
                  />
                  <span className="text-sm">Księgowi</span>
                </Link>
                <Link
                  to="/cleaning-companies"
                  onClick={() =>
                    isMobile && onMobileMenuToggle && onMobileMenuToggle()
                  }
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all hover:bg-blue-500/20 text-gray-300 hover:text-white group"
                >
                  <Sparkles
                    size={18}
                    className="text-blue-400 group-hover:scale-110 transition-transform"
                  />
                  <span className="text-sm">Firmy sprzątające</span>
                </Link>
              </div>
            )}
          </div>

          {/* Faktury Link - For accountant, worker, cleaning_company and employer */}
          {user.role !== "regular_user" && user.role !== "admin" && (
            <Link
              to="/faktury"
              onClick={() =>
                isMobile && onMobileMenuToggle && onMobileMenuToggle()
              }
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all min-h-[48px] hover:bg-white/10 text-gray-200"
              title={isCollapsed && !isMobile ? "Faktury i BTW" : undefined}
            >
              <Receipt size={22} className="flex-shrink-0 text-green-400" />
              {(!isCollapsed || isMobile) && (
                <span className="font-medium text-sm">Faktury i BTW</span>
              )}
            </Link>
          )}

          {/* Drużyna Link - Only for employer - opens separate page with full sidebar */}
          {user.role === "employer" && (
            <Link
              to="/employer/team"
              onClick={() =>
                isMobile && onMobileMenuToggle && onMobileMenuToggle()
              }
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all min-h-[48px] hover:bg-white/10 text-gray-200"
              title={isCollapsed && !isMobile ? "Drużyna" : undefined}
            >
              <Users size={22} className="flex-shrink-0 text-cyan-400" />
              {(!isCollapsed || isMobile) && (
                <span className="font-medium text-sm">Drużyna</span>
              )}
            </Link>
          )}

          {/* Wsparcie Button */}
          {onSupportClick && (
            <button
              onClick={() => {
                onSupportClick();
                if (isMobile && onMobileMenuToggle) onMobileMenuToggle();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all min-h-[48px] hover:bg-white/10 text-gray-200"
              title={isCollapsed && !isMobile ? "Wsparcie" : undefined}
            >
              <Headphones size={22} className="flex-shrink-0 text-purple-400" />
              {(!isCollapsed || isMobile) && (
                <span className="font-medium text-sm">Wsparcie</span>
              )}
            </button>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        {(!isCollapsed || isMobile) && (
          <div className="text-xs text-blue-300">
            <div className="font-bold truncate">{user.email}</div>
            <div>ZZP Werkplaats v1.0</div>
          </div>
        )}
      </div>
    </>
  );

  // Mobile: Drawer
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onMobileMenuToggle}
          />
        )}

        {/* Drawer */}
        <aside
          className={`fixed top-0 left-0 h-full w-[85%] max-w-sm bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-900 text-white flex flex-col shadow-2xl z-50 transform transition-transform duration-300 ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent />
        </aside>
      </>
    );
  }

  // Desktop: Fixed sidebar
  return (
    <aside
      className={`${
        isCollapsed ? "w-20" : "w-64"
      } bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-900 text-white flex flex-col shadow-2xl transition-all duration-300 flex-shrink-0`}
    >
      <SidebarContent />
    </aside>
  );
};

/**
 * Mobile hamburger button component
 */
interface MobileMenuButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const MobileSidebarButton: React.FC<MobileMenuButtonProps> = ({
  onClick,
  isOpen,
}) => (
  <button
    onClick={onClick}
    className="fixed top-4 left-4 z-50 p-3 bg-slate-900 text-white rounded-xl shadow-lg md:hidden hover:bg-slate-800 transition-colors"
    aria-label="Toggle menu"
  >
    {isOpen ? <X size={24} /> : <Menu size={24} />}
  </button>
);

export default DashboardSidebar;

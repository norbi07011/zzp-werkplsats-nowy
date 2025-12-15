import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calculator,
  Building2,
  Award,
  FileCheck,
  Medal,
  Calendar,
  CalendarClock,
  CreditCard,
  Wallet,
  MessageSquare,
  Ticket,
  Bell,
  BarChart3,
  FileBarChart,
  FolderOpen,
  Database,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  tabId?: string;
  badge?: number;
}

interface NavGroup {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: NavItem[];
}

interface AdminSidebarProps {
  isCollapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const navGroups: NavGroup[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: <LayoutDashboard size={20} />,
    items: [
      { id: "overview", label: "Przegląd", icon: <LayoutDashboard size={18} />, tabId: "profile" },
    ],
  },
  {
    id: "users",
    title: "Użytkownicy",
    icon: <Users size={20} />,
    items: [
      { id: "workers", label: "Pracownicy", icon: <Users size={18} />, path: "/admin/workers" },
      { id: "employers", label: "Pracodawcy", icon: <Briefcase size={18} />, path: "/admin/employers" },
      { id: "accountants", label: "Księgowi", icon: <Calculator size={18} />, path: "/admin/accountants" },
      { id: "cleaning", label: "Firmy Sprzątające", icon: <Building2 size={18} />, path: "/admin/cleaning-companies" },
    ],
  },
  {
    id: "certificates",
    title: "Certyfikaty",
    icon: <Award size={20} />,
    items: [
      { id: "certs_uploaded", label: "Certyfikaty (wrzucone)", icon: <FileCheck size={18} />, path: "/admin/certificates" },
      { id: "certs_applications", label: "Aplikacje o Certyfikat", icon: <Award size={18} />, path: "/admin/certificate-approval" },
      { id: "certs_generator", label: "Generator Certyfikatów", icon: <Medal size={18} />, path: "/admin/certificates/generate" },
    ],
  },
  {
    id: "schedule",
    title: "Terminarz",
    icon: <Calendar size={20} />,
    items: [
      { id: "appointments", label: "Zarządzanie Terminami", icon: <Calendar size={18} />, path: "/admin/appointments" },
      { id: "test_schedule", label: "Harmonogram Testów", icon: <CalendarClock size={18} />, path: "/admin/scheduler" },
    ],
  },
  {
    id: "finance",
    title: "Finanse",
    icon: <CreditCard size={20} />,
    items: [
      { id: "payments", label: "Płatności", icon: <CreditCard size={18} />, path: "/admin/payments" },
      { id: "subscriptions", label: "Subskrypcje", icon: <Wallet size={18} />, path: "/admin/subscriptions" },
    ],
  },
  {
    id: "communication",
    title: "Komunikacja",
    icon: <MessageSquare size={20} />,
    items: [
      { id: "messages", label: "Wiadomości", icon: <MessageSquare size={18} />, tabId: "messages" },
      { id: "support", label: "Support Tickets", icon: <Ticket size={18} />, path: "/admin/support" },
      { id: "notifications", label: "Powiadomienia", icon: <Bell size={18} />, path: "/admin/notifications" },
    ],
  },
  {
    id: "analytics",
    title: "Analityka",
    icon: <BarChart3 size={20} />,
    items: [
      { id: "analytics", label: "Analityka & Raporty", icon: <BarChart3 size={18} />, path: "/admin/analytics" },
      { id: "report_generator", label: "Generator Raportów", icon: <FileBarChart size={18} />, path: "/admin/reports" },
    ],
  },
  {
    id: "system",
    title: "System",
    icon: <Settings size={20} />,
    items: [
      { id: "media", label: "Media & Pliki", icon: <FolderOpen size={18} />, path: "/admin/media" },
      { id: "database", label: "Baza Danych", icon: <Database size={18} />, path: "/admin/database" },
      { id: "security", label: "Bezpieczeństwo", icon: <Shield size={18} />, path: "/admin/security" },
      { id: "settings", label: "Ustawienia", icon: <Settings size={18} />, path: "/admin/settings" },
    ],
  },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isCollapsed,
  onCollapsedChange,
  isMobileOpen,
  onMobileClose,
  activeTab = "profile",
  onTabChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["dashboard"]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleNavigate = (item: NavItem) => {
    if (item.path) {
      navigate(item.path);
    } else if (item.tabId && onTabChange) {
      onTabChange(item.tabId);
    }
    onMobileClose();
  };

  const isActiveItem = (item: NavItem) => {
    if (item.path) {
      return location.pathname === item.path || location.pathname.startsWith(item.path + "/");
    }
    return item.tabId === activeTab;
  };

  const isGroupActive = (group: NavGroup) => {
    return group.items.some((item) => isActiveItem(item));
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                <span className="text-xl">🚀</span>
              </div>
              <div>
                <h2 className="font-bold text-white text-lg">Admin Panel</h2>
                <p className="text-xs text-slate-400">Zarządzanie platformą</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg mx-auto">
              <span className="text-xl">🚀</span>
            </div>
          )}
          <button
            onClick={() => onCollapsedChange(!isCollapsed)}
            className="hidden lg:flex p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin scrollbar-thumb-slate-700">
        <nav className="space-y-1">
          {navGroups.map((group) => {
            const isExpanded = expandedGroups.includes(group.id);
            const groupActive = isGroupActive(group);

            return (
              <div key={group.id} className="mb-1">
                {/* Group Header */}
                <button
                  onClick={() => !isCollapsed && toggleGroup(group.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    groupActive
                      ? "bg-primary-500/20 text-primary-400"
                      : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
                  } ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? group.title : undefined}
                >
                  <span className={`flex-shrink-0 ${groupActive ? "text-primary-400" : ""}`}>
                    {group.icon}
                  </span>
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left font-semibold text-sm uppercase tracking-wide">
                        {group.title}
                      </span>
                      <span className="text-slate-500">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </>
                  )}
                </button>

                {/* Group Items */}
                {!isCollapsed && isExpanded && (
                  <div className="mt-1 ml-2 space-y-0.5 border-l-2 border-slate-700/50 pl-3">
                    {group.items.map((item) => {
                      const isActive = isActiveItem(item);
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavigate(item)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                            isActive
                              ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30"
                              : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
                          }`}
                        >
                          <span className={`flex-shrink-0 ${isActive ? "text-white" : ""}`}>
                            {item.icon}
                          </span>
                          <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                          {item.badge && (
                            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Collapsed state */}
                {isCollapsed && (
                  <div className="mt-1 space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = isActiveItem(item);
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavigate(item)}
                          className={`w-full flex items-center justify-center p-2 rounded-lg transition-all duration-200 ${
                            isActive
                              ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30"
                              : "text-slate-500 hover:bg-slate-700/50 hover:text-white"
                          }`}
                          title={item.label}
                        >
                          {item.icon}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/50 rounded-xl">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">👤</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Administrator</p>
              <p className="text-xs text-slate-400 truncate">Super Admin</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">👤</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-72"
        } shadow-2xl shadow-black/20`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={onMobileClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-slate-700/50 text-white hover:bg-slate-600 transition-colors z-10"
        >
          <X size={20} />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
};
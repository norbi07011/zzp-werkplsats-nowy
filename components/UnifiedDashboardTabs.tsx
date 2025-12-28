/**
 * ================================================================
 * UNIFIED DASHBOARD TABS - Consistent navigation for all roles
 * ================================================================
 *
 * STRUCTURE:
 * - Base tabs (all roles): Przegląd, Profil, Wiadomości, Opinie
 * - Role-specific: Worker & Cleaning get "Certyfikaty"
 * - Accountant gets "Usługi" instead of Certyfikaty
 *
 * USAGE:
 * <UnifiedDashboardTabs
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 *   role="worker"
 *   unreadMessages={5}
 * />
 */

import React from "react";

export type UnifiedTab =
  | "overview" // 📊 Przegląd - stats, aktywność (TYLKO dla Worker - ma specjalną strukturę)
  | "profile" // 💼 Profil - edycja, portfolio, availability, stats dla Employer/Accountant/CleaningCompany
  | "my_profile" // 👁️ Mój Profil - podgląd publicznego profilu (jak widzą inni)
  | "messages" // 📬 Wiadomości - chat, notifications
  | "reviews" // ⭐ Opinie - ratings, reviews
  | "tablica" // 📋 Tablica - feed, posts board - ALL roles
  | "certificates" // 🏆 Certyfikaty - ONLY for worker & cleaning_company
  | "portfolio" // 🎨 Portfolio - ONLY for worker & cleaning_company
  | "subscription" // 💳 Subskrypcja - ONLY for worker & cleaning_company
  | "services" // 💼 Usługi - ONLY for accountant (main services page)
  | "submissions" // 📋 Zgłoszenia - ONLY for accountant
  | "forms" // 📝 Formularze - ONLY for accountant
  | "team" // 👥 Drużyna - ONLY for accountant
  | "my_posts" // 📋 Moje Posty - ONLY for employer, accountant, admin, regular_user
  | "saved_activity" // 📁 Historia Aktywności - ALL roles
  | "experts" // 🔍 Eksperci - ONLY for regular_user (PREMIUM)
  | "messages_tab" // 💬 Wiadomości - ONLY for regular_user (PREMIUM)
  | "settings"; // ⚙️ Ustawienia - ALL roles
// NOTE: "kilometers" and "calendar" are NOT dashboard tabs - they are in /faktury module only

interface TabConfig {
  id: UnifiedTab;
  label: string;
  icon: string;
  description: string;
  roles: string[]; // which roles can see this tab
}

const ALL_TABS: TabConfig[] = [
  {
    id: "overview",
    label: "Przegląd",
    icon: "📊",
    description: "Dashboard, statystyki, aktywność",
    roles: ["worker"], // TYLKO Worker ma overview jako osobną zakładkę
  },
  {
    id: "profile",
    label: "Przegląd", // ✅ ZMIENIONE: Profil → Przegląd (dla spójności ze wszystkimi rolami)
    icon: "💼",
    description: "Profil, statystyki, aktywność, edycja",
    roles: ["admin", "employer", "accountant", "cleaning_company"], // Pozostali mają overview w profilu
  },
  {
    id: "messages",
    label: "Wiadomości",
    icon: "📬",
    description: "Chat, powiadomienia, korespondencja",
    roles: ["admin", "employer", "worker", "accountant", "cleaning_company"],
  },
  {
    id: "reviews",
    label: "Opinie",
    icon: "⭐",
    description: "Oceny, recenzje, referencje",
    roles: ["admin", "employer", "worker", "accountant", "cleaning_company"],
  },
  {
    id: "tablica",
    label: "Tablica",
    icon: "📋",
    description: "Tablica ogłoszeń - oferty pracy, reklamy, ogłoszenia",
    roles: ["admin", "employer", "worker", "accountant", "cleaning_company"], // ✅ ALL roles!
  },
  {
    id: "portfolio",
    label: "Portfolio",
    icon: "🎨",
    description: "Portfolio prac, galeria, projekty",
    roles: ["worker", "employer", "accountant", "cleaning_company"], // ✅ Extended to all main roles!
  },
  {
    id: "subscription",
    label: "Subskrypcja",
    icon: "💳",
    description: "Plan subskrypcyjny, płatności, historia",
    roles: ["worker", "cleaning_company"], // ✅ ONLY these roles!
  },
  {
    id: "services",
    label: "Usługi",
    icon: "💼",
    description: "Usługi księgowe, formularze, zgłoszenia",
    roles: ["accountant"], // ✅ ONLY accountant!
  },
  {
    id: "submissions",
    label: "Zgłoszenia",
    icon: "📋",
    description: "Zgłoszenia od klientów, wnioski, zapytania",
    roles: ["accountant"], // ✅ ONLY accountant!
  },
  {
    id: "forms",
    label: "Formularze",
    icon: "📝",
    description: "Formularze, dokumenty, szablony",
    roles: ["accountant"], // ✅ ONLY accountant!
  },
  {
    id: "team",
    label: "Drużyna",
    icon: "👥",
    description: "Zarządzanie zespołem, pracownicy",
    roles: ["accountant", "worker", "cleaning_company"], // ✅ Accountant + workers can see their teams!
  },
  {
    id: "my_posts",
    label: "Moje Posty",
    icon: "📋",
    description: "Zarządzanie postami - edycja, toggle active, statystyki",
    roles: ["employer", "accountant", "admin"], // ✅ Post creators only!
  },
  {
    id: "saved_activity",
    label: "Historia Aktywności",
    icon: "📁",
    description: "Zapisane posty, polubiane, komentowane",
    roles: ["admin", "employer", "worker", "accountant", "cleaning_company"], // ✅ ALL roles!
  },
  // NOTE: "kilometers" and "calendar" tabs REMOVED from main dashboard
  // They are now ONLY accessible via the "Faktury i BTW" module (/faktury)
];

interface UnifiedDashboardTabsProps {
  activeTab: UnifiedTab;
  onTabChange: (tab: UnifiedTab) => void;
  role: string; // user role
  unreadMessages?: number;
  className?: string;
}

export const UnifiedDashboardTabs: React.FC<UnifiedDashboardTabsProps> = ({
  activeTab,
  onTabChange,
  role,
  unreadMessages = 0,
  className = "",
}) => {
  // Filter tabs based on user role
  const visibleTabs = ALL_TABS.filter((tab) => tab.roles.includes(role));

  return (
    <div
      className={`bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 shadow-lg relative ${className}`}
    >
      {/* Scroll fade indicators for mobile */}
      <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-slate-900 to-transparent pointer-events-none z-10 md:hidden" />
      <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-indigo-900 to-transparent pointer-events-none z-10 md:hidden" />

      <nav
        className="flex items-center gap-1 px-4 py-2 overflow-x-auto scrollbar-hide"
        aria-label="Tabs"
      >
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const showBadge = tab.id === "messages" && unreadMessages > 0;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                group relative flex items-center gap-2 whitespace-nowrap py-3 px-4 text-sm font-medium
                rounded-xl transition-all duration-200 min-h-[44px]
                ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }
              `}
              aria-current={isActive ? "page" : undefined}
              title={tab.description}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              {showBadge && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full shadow-lg">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

/**
 * Helper hook to manage tab state
 *
 * Usage:
 * const { activeTab, setActiveTab, isTabActive } = useUnifiedTabs("overview");
 */
export const useUnifiedTabs = (initialTab: UnifiedTab = "overview") => {
  const [activeTab, setActiveTab] = React.useState<UnifiedTab>(initialTab);

  const isTabActive = (tab: UnifiedTab) => activeTab === tab;

  return {
    activeTab,
    setActiveTab,
    isTabActive,
  };
};

/**
 * Tab content wrapper with fade-in animation
 */
interface TabPanelProps {
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({
  isActive,
  children,
  className = "",
}) => {
  if (!isActive) return null;

  return (
    <div className={`animate-fade-in ${className}`} role="tabpanel">
      {children}
    </div>
  );
};

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
  | "overview" // 📊 Przegląd - stats, aktywność
  | "profile" // 💼 Profil - edycja, portfolio, availability
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
  | "my_posts" // 📋 Moje Posty - ONLY for employer, accountant, admin
  | "saved_activity"; // 📁 Historia Aktywności - ALL roles

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
    roles: ["admin", "employer", "worker", "accountant", "cleaning_company"],
  },
  {
    id: "profile",
    label: "Profil",
    icon: "💼",
    description: "Edycja profilu, portfolio, dostępność",
    roles: ["admin", "employer", "worker", "accountant", "cleaning_company"],
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
    roles: ["worker", "cleaning_company"], // ✅ ONLY these roles!
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
    roles: ["accountant"], // ✅ ONLY accountant!
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
      className={`border-b border-gray-200 dark:border-gray-700 ${className}`}
    >
      <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const showBadge = tab.id === "messages" && unreadMessages > 0;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                group relative min-w-fit whitespace-nowrap py-4 px-6 text-sm font-medium
                border-b-2 transition-all duration-200
                ${
                  isActive
                    ? "border-accent-cyber text-accent-cyber"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }
              `}
              aria-current={isActive ? "page" : undefined}
              title={tab.description}
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
                {showBadge && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </span>

              {/* Active indicator */}
              {isActive && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-cyber"></span>
              )}

              {/* Hover effect */}
              <span
                className={`
                  absolute inset-x-0 bottom-0 h-0.5 bg-accent-cyber/50 
                  scale-x-0 group-hover:scale-x-100 transition-transform origin-left
                  ${isActive ? "hidden" : ""}
                `}
              ></span>
            </button>
          );
        })}
      </nav>

      {/* Tab description (mobile helper) */}
      <div className="md:hidden mt-2 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded text-xs text-gray-600 dark:text-gray-400">
        {visibleTabs.find((tab) => tab.id === activeTab)?.description}
      </div>
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

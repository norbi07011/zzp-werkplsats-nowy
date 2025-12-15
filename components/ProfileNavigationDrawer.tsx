/**
 * ================================================================
 * PROFILE NAVIGATION DRAWER - Second level hamburger menu
 * ================================================================
 *
 * Sub-navigation drawer for Profile tab sections.
 * Provides navigation between different profile views.
 *
 * USAGE:
 * <ProfileNavigationDrawer
 *   isOpen={isProfileSidebarOpen}
 *   onClose={() => setIsProfileSidebarOpen(false)}
 *   activeSubTab={profileSubTab}
 *   onSubTabChange={(tab) => {
 *     setProfileSubTab(tab);
 *     setIsProfileSidebarOpen(false);
 *   }}
 *   role="accountant"
 *   userName="Jan Kowalski"
 * />
 */

import React from "react";

export type ProfileSubTab =
  | "overview"
  | "edit"
  | "availability"
  | "team"
  | "stats";

interface ProfileSubTabConfig {
  id: ProfileSubTab;
  label: string;
  icon: string;
  description: string;
  roles: string[]; // which roles can see this sub-tab
}

const PROFILE_SUB_TABS: ProfileSubTabConfig[] = [
  {
    id: "overview",
    label: "Przegląd",
    icon: "📊",
    description: "Statystyki, szybkie działania, aktywność",
    roles: ["admin", "employer", "worker", "accountant", "cleaning_company"],
  },
  {
    id: "edit",
    label: "Edytuj Profil",
    icon: "✏️",
    description: "Edycja danych osobowych, CV, umiejętności",
    roles: ["admin", "employer", "worker", "accountant", "cleaning_company"],
  },
  {
    id: "availability",
    label: "Dostępność",
    icon: "📅",
    description: "Kalendarz, dostępność, blokady dat",
    roles: ["worker", "accountant", "cleaning_company"],
  },
  {
    id: "stats",
    label: "Statystyki",
    icon: "📈",
    description: "Wykresy, raporty, analytics",
    roles: ["admin", "employer", "worker", "accountant", "cleaning_company"],
  },
  {
    id: "team",
    label: "Drużyna",
    icon: "👥",
    description: "Zarządzanie zespołem, pracownicy",
    roles: ["accountant"],
  },
];

interface ProfileNavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSubTab: ProfileSubTab;
  onSubTabChange: (tab: ProfileSubTab) => void;
  role: string;
  userName?: string;
  userAvatar?: string;
}

export const ProfileNavigationDrawer: React.FC<
  ProfileNavigationDrawerProps
> = ({
  isOpen,
  onClose,
  activeSubTab,
  onSubTabChange,
  role,
  userName = "Użytkownik",
  userAvatar,
}) => {
  // Filter sub-tabs based on user role
  const visibleSubTabs = PROFILE_SUB_TABS.filter((tab) =>
    tab.roles.includes(role)
  );

  const handleSubTabClick = (tabId: ProfileSubTab) => {
    onSubTabChange(tabId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - Dark overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer - Slide from left (narrower than main drawer) */}
      <div
        className="fixed left-0 top-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Profile navigation menu"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Menu Profilu</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              aria-label="Zamknij menu profilu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* User info (smaller version) */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl">👤</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{userName}</p>
              <p className="text-xs text-white/80">Profil</p>
            </div>
          </div>
        </div>

        {/* Navigation sub-tabs */}
        <nav className="p-4 space-y-2">
          {visibleSubTabs.map((tab) => {
            const isActive = activeSubTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleSubTabClick(tab.id)}
                className={`
                  w-full text-left px-4 py-3 rounded-lg transition-all duration-200
                  flex items-center gap-3 group
                  ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
                      : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                  }
                `}
                aria-current={isActive ? "page" : undefined}
                title={tab.description}
              >
                {/* Icon */}
                <span
                  className={`text-2xl ${
                    isActive ? "" : "group-hover:scale-110 transition-transform"
                  }`}
                >
                  {tab.icon}
                </span>

                {/* Label */}
                <span className="flex-1 font-medium text-sm">{tab.label}</span>

                {/* Active indicator */}
                {isActive && (
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer hint */}
        <div className="sticky bottom-0 bg-blue-50 border-t border-blue-200 p-4 text-center text-xs text-blue-700">
          <p className="font-medium">💡 Wskazówka</p>
          <p className="mt-1">Wybierz sekcję profilu do edycji</p>
        </div>
      </div>
    </>
  );
};

export default ProfileNavigationDrawer;

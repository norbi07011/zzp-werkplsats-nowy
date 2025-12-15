/**
 * ================================================================
 * NAVIGATION DRAWER - Universal mobile hamburger menu
 * ================================================================
 *
 * Responsive slide-in sidebar for all dashboard roles.
 * Contains dashboard tabs in vertical layout for mobile.
 * Includes: Language switcher, Logout button
 *
 * USAGE:
 * <NavigationDrawer
 *   isOpen={isSidebarOpen}
 *   onClose={() => setIsSidebarOpen(false)}
 *   activeTab={activeTab}
 *   onTabChange={(tab) => {
 *     setActiveTab(tab);
 *     setIsSidebarOpen(false);
 *   }}
 *   role="worker"
 *   unreadMessages={5}
 *   onLogout={() => handleLogout()}
 * />
 */

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { UnifiedTab } from "./UnifiedDashboardTabs";

interface TabConfig {
  id: UnifiedTab;
  label: string;
  icon: string;
  description: string;
  roles: string[];
}

const ALL_TABS: TabConfig[] = [
  {
    id: "overview",
    label: "Przegląd",
    icon: "📊",
    description: "Dashboard, statystyki, aktywność",
    roles: ["worker", "cleaning_company"],
  },
  {
    id: "profile",
    label: "Profil",
    icon: "💼",
    description: "Profil, statystyki, aktywność, edycja",
    roles: ["admin", "employer", "accountant", "cleaning_company", "worker"],
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
    roles: ["admin", "employer", "worker", "accountant", "cleaning_company"],
  },
  {
    id: "portfolio",
    label: "Portfolio",
    icon: "🎨",
    description: "Portfolio prac, galeria, projekty",
    roles: ["worker", "cleaning_company"],
  },
  {
    id: "subscription",
    label: "Subskrypcja",
    icon: "💳",
    description: "Plan subskrypcyjny, płatności, historia",
    roles: ["worker", "cleaning_company"],
  },
  {
    id: "services",
    label: "Usługi",
    icon: "💼",
    description: "Usługi księgowe, formularze, zgłoszenia",
    roles: ["accountant"],
  },
  {
    id: "submissions",
    label: "Zgłoszenia",
    icon: "📋",
    description: "Zgłoszenia od klientów, wnioski, zapytania",
    roles: ["accountant"],
  },
  {
    id: "forms",
    label: "Formularze",
    icon: "📝",
    description: "Formularze, dokumenty, szablony",
    roles: ["accountant"],
  },
  {
    id: "team",
    label: "Drużyna",
    icon: "👥",
    description: "Zarządzanie zespołem, pracownicy",
    roles: ["accountant"],
  },
  {
    id: "my_posts",
    label: "Moje Posty",
    icon: "📋",
    description: "Zarządzanie postami - edycja, toggle active, statystyki",
    roles: ["employer", "accountant", "admin"],
  },
  {
    id: "saved_activity",
    label: "Historia Aktywności",
    icon: "📁",
    description: "Zapisane posty, polubiane, komentowane",
    roles: ["admin", "employer", "worker", "accountant", "cleaning_company"],
  },
  {
    id: "certificates",
    label: "Certyfikaty",
    icon: "🏆",
    description: "Certyfikaty zawodowe, uprawnienia",
    roles: ["worker", "cleaning_company"],
  },
];

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: UnifiedTab;
  onTabChange: (tab: UnifiedTab) => void;
  role: string;
  unreadMessages?: number;
  userName?: string;
  userAvatar?: string;
  onLogout?: () => void;
}

const LANGUAGES = [
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
];

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  role,
  unreadMessages = 0,
  userName = "Użytkownik",
  userAvatar,
  onLogout,
}) => {
  const { i18n, t } = useTranslation();
  const [showLanguages, setShowLanguages] = useState(false);

  // Filter tabs based on user role
  const visibleTabs = ALL_TABS.filter((tab) => tab.roles.includes(role));

  const currentLanguage =
    LANGUAGES.find((lang) => lang.code === i18n.language) || LANGUAGES[0];

  const handleTabClick = (tabId: UnifiedTab) => {
    onTabChange(tabId);
    onClose();
  };

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setShowLanguages(false);
  };

  const handleLogout = () => {
    onClose();
    if (onLogout) {
      onLogout();
    }
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

      {/* Drawer - Slide from left */}
      <div
        className="fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header with user info */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Menu</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              aria-label="Zamknij menu"
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

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl">👤</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{userName}</p>
              <p className="text-xs text-white/80 capitalize">{role}</p>
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="p-4 space-y-2">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const showBadge = tab.id === "messages" && unreadMessages > 0;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`
                  w-full text-left px-4 py-3 rounded-lg transition-all duration-200
                  flex items-center gap-3 group
                  ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
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
                <span className="flex-1 font-medium">{tab.label}</span>

                {/* Badge for unread messages */}
                {showBadge && (
                  <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </span>
                )}

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

        {/* Divider */}
        <div className="border-t border-gray-200 mx-4" />

        {/* Team Management Link (only for employer, accountant, cleaning_company) */}
        {["employer", "cleaning_company", "accountant"].includes(role) && (
          <div className="p-4">
            <Link
              to={
                role === "employer"
                  ? "/employer/team"
                  : role === "cleaning_company"
                  ? "/cleaning-company/team"
                  : "/accountant/team"
              }
              className="w-full text-left px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-all group"
              onClick={onClose}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">
                👥
              </span>
              <span className="flex-1 font-medium">Zarządzanie Zespołem</span>
              <svg
                className="w-5 h-5 text-gray-400"
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
            </Link>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200 mx-4" />

        {/* Language Switcher */}
        <div className="p-4">
          <button
            onClick={() => setShowLanguages(!showLanguages)}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-all"
          >
            <span className="text-2xl">{currentLanguage.flag}</span>
            <span className="flex-1 font-medium">
              Język: {currentLanguage.label}
            </span>
            <svg
              className={`w-5 h-5 transition-transform ${
                showLanguages ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Language options */}
          {showLanguages && (
            <div className="mt-2 ml-4 space-y-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-3 transition-all ${
                    i18n.language === lang.code
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="font-medium">{lang.label}</span>
                  {i18n.language === lang.code && (
                    <svg
                      className="w-5 h-5 ml-auto text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Logout Button */}
        {onLogout && (
          <div className="p-4 pt-0">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 flex items-center gap-3 transition-all border border-red-200 hover:border-red-300"
            >
              <span className="text-2xl">🚪</span>
              <span className="flex-1 font-medium">Wyloguj się</span>
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
            </button>
          </div>
        )}

        {/* Footer with app version */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 text-center text-xs text-gray-500">
          <p>ZZP Werkplaats</p>
          <p className="mt-1">v2.0.0 Mobile</p>
        </div>
      </div>
    </>
  );
};

export default NavigationDrawer;

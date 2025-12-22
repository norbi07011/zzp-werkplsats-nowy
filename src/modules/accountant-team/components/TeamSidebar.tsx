/**
 * Sidebar for Accountant Team Dashboard
 * Navigation between team views
 */

import React from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  MessageSquare,
  Users,
  X,
  ArrowLeft,
  Settings,
  User,
} from "lucide-react";
import { Language } from "../types";
import { DICTIONARY } from "../constants";

interface TeamSidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  onBackToMain: () => void;
}

export const TeamSidebar: React.FC<TeamSidebarProps> = ({
  currentView,
  setCurrentView,
  language,
  isOpen,
  onClose,
  onBackToMain,
}) => {
  const t = DICTIONARY[language];

  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: t.dashboard },
    { id: "tasks", icon: ClipboardList, label: t.tasks },
    { id: "calendar", icon: Calendar, label: t.calendar },
    { id: "team", icon: Users, label: t.team },
    { id: "chat", icon: MessageSquare, label: t.chat },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 text-white flex flex-col h-full shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight leading-tight">
                Drużyna
              </h1>
              <span className="text-xs text-indigo-300">Panel księgowych</span>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1"
            title="Zamknij menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Back to Main Dashboard */}
        <div className="px-4 pt-4">
          <button
            onClick={onBackToMain}
            className="w-full flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-indigo-200 hover:bg-white/10 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">{t.back_to_main}</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 ${
                currentView === item.id
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                  : "text-indigo-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 space-y-1">
          <button
            onClick={() => setCurrentView("profile")}
            className={`w-full flex items-center p-2.5 rounded-lg text-sm ${
              currentView === "profile"
                ? "bg-white/10 text-white"
                : "text-indigo-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <User className="w-4 h-4 mr-2" />
            {t.profile}
          </button>

          <button
            onClick={() => setCurrentView("settings")}
            className={`w-full flex items-center p-2.5 text-sm rounded-lg ${
              currentView === "settings"
                ? "bg-white/10 text-white"
                : "text-indigo-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <Settings className="w-4 h-4 mr-2" />
            {t.settings}
          </button>
        </div>
      </div>
    </>
  );
};

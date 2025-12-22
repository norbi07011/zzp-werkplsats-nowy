/**
 * Accountant Team Dashboard - Main Entry Point
 * Full dashboard for accountant team collaboration
 */

import React, { useState, useEffect, useCallback } from "react";
import { TeamSidebar } from "./TeamSidebar";
import { TeamDashboard } from "./TeamDashboard";
import { TeamTaskListFull } from "./TeamTaskListFull";
import { TeamChatFull } from "./TeamChatFull";
import { TeamMembers } from "./TeamMembers";
import { TeamCalendarFull } from "./TeamCalendarFull";
import { TeamProfile } from "./TeamProfile";
import { TeamSettings } from "./TeamSettings";
import {
  Language,
  TeamMember,
  TeamTask,
  ChatMessage,
  TaskTemplate,
} from "../types";
import { DICTIONARY, TASK_TEMPLATES } from "../constants";
import { Menu, Loader2, X, Users } from "lucide-react";
import {
  getAccountantTeams,
  getTeamMemberships,
} from "../services/accountantTeamService";
import { setupPushNotifications } from "../services/teamNotificationService";

interface AccountantTeamDashboardProps {
  accountantId: string;
  accountantName: string;
  accountantEmail: string;
  accountantAvatar?: string;
  profileId?: string; // User's profile ID for database operations
  onClose: () => void;
}

export const AccountantTeamDashboard: React.FC<
  AccountantTeamDashboardProps
> = ({
  accountantId,
  accountantName,
  accountantEmail,
  accountantAvatar,
  profileId,
  onClose,
}) => {
  const [currentView, setCurrentView] = useState("dashboard");
  const [language, setLanguage] = useState<Language>("PL");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data Loading State
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Team State
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // App State
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);

  // Templates State
  const [templates, setTemplates] = useState<TaskTemplate[]>(TASK_TEMPLATES);

  // Current user
  const currentUser: TeamMember = {
    id: accountantId,
    name: accountantName,
    email: accountantEmail,
    role: "Accountant",
    avatar:
      accountantAvatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        accountantName
      )}&background=6366f1&color=fff`,
    status: "Online",
  };

  const t = DICTIONARY[language];

  // Initialize push notifications on mount
  useEffect(() => {
    if (profileId) {
      setupPushNotifications(profileId).then((success) => {
        if (success) {
          console.log("✅ [TEAM] Push notifications enabled");
        }
      });
    }
  }, [profileId]);

  // Load data
  const loadData = useCallback(async () => {
    setDataLoading(true);
    setDataError(null);

    try {
      // Load teams for this accountant
      const teamsData = await getAccountantTeams(accountantId);
      setTeams(teamsData);

      // If we have teams, select the first one and load its members
      if (teamsData.length > 0) {
        const firstTeamId = teamsData[0].id;
        setSelectedTeamId(firstTeamId);

        // Load members for the selected team
        const membershipsData = await getTeamMemberships(firstTeamId);

        // Convert memberships to TeamMember format
        const teamMembers: TeamMember[] = membershipsData.map((m: any) => {
          const profile = m.accountant?.profiles;
          const name =
            profile?.full_name || m.accountant?.profiles?.email || "Unknown";
          return {
            id: m.accountant_id,
            name: name,
            email: profile?.email || "",
            role: m.role === "owner" ? "Owner" : "Member",
            avatar:
              profile?.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                name
              )}&background=6366f1&color=fff`,
            status: "Online",
          };
        });

        setMembers(teamMembers);
      } else {
        // No teams - just show current user
        setMembers([currentUser]);
      }

      setTasks([]);
      setMessages([]);
    } catch (error: any) {
      console.error("Error loading data:", error);
      setDataError(error.message || "Failed to load data");
      // Fallback to current user
      setMembers([currentUser]);
    } finally {
      setDataLoading(false);
    }
  }, [accountantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Show loading screen
  if (dataLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-indigo-200">Ładowanie drużyny...</p>
        </div>
      </div>
    );
  }

  // Show error
  if (dataError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">
        <div className="text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">
            Błąd ładowania danych
          </h2>
          <p className="text-slate-400 mb-4">{dataError}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => loadData()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Spróbuj ponownie
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
            >
              Zamknij
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <TeamDashboard
            tasks={tasks}
            language={language}
            members={members}
            setCurrentView={handleViewChange}
          />
        );
      case "tasks":
        return (
          <TeamTaskListFull
            tasks={tasks}
            setTasks={setTasks}
            language={language}
            members={members}
            currentUser={currentUser}
            templates={templates}
            setTemplates={setTemplates}
          />
        );
      case "chat":
        return (
          <TeamChatFull
            messages={messages}
            setMessages={setMessages}
            members={members}
            currentUser={currentUser}
            language={language}
            teamId={selectedTeamId || undefined}
            profileId={profileId}
          />
        );
      case "team":
        return (
          <TeamMembers
            members={members}
            language={language}
            currentUser={currentUser}
          />
        );
      case "profile":
        return <TeamProfile currentUser={currentUser} language={language} />;
      case "calendar":
        return (
          <TeamCalendarFull
            tasks={tasks}
            setTasks={setTasks}
            members={members}
            currentUser={currentUser}
            language={language}
            templates={templates}
          />
        );
      case "settings":
        return (
          <TeamSettings
            language={language}
            setLanguage={setLanguage}
            currentUser={currentUser}
            userId={profileId}
          />
        );
      default:
        return (
          <TeamDashboard
            tasks={tasks}
            language={language}
            members={members}
            setCurrentView={handleViewChange}
          />
        );
    }
  };

  return (
    <>
      {/* GLOBAL ANIMATION KILLER FOR THIS MODULE */}
      <style>{`
        .accountant-team-container * {
          animation: none !important;
          transform: none !important;
          transform-style: flat !important;
          perspective: none !important;
          backface-visibility: visible !important;
          transition: background-color 0.2s, color 0.2s, border-color 0.2s, opacity 0.2s !important;
        }
        .accountant-team-container *:hover {
          transform: none !important;
        }
      `}</style>
      <div className="accountant-team-container fixed inset-0 z-50 flex bg-gradient-to-br from-slate-100 via-indigo-50 to-purple-50">
        {/* Sidebar */}
        <TeamSidebar
          currentView={currentView}
          setCurrentView={handleViewChange}
          language={language}
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          onBackToMain={onClose}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Mobile Header */}
          <header className="flex lg:hidden items-center justify-between p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white z-20 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Otwórz menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <h1 className="font-bold text-lg">Drużyna Księgowych</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Zamknij"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={currentUser.avatar}
                alt="Profile"
                className="w-8 h-8 rounded-full border-2 border-white/30"
              />
            </div>
          </header>

          {/* Desktop Header */}
          <header className="hidden lg:flex justify-between items-center px-8 py-4 bg-white/80 backdrop-blur-sm border-b border-slate-200/50 shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 capitalize">
                    {t[currentView as keyof typeof t] || currentView}
                  </h2>
                  <p className="text-sm text-slate-500">Drużyna Księgowych</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Zamknij panel
              </button>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">
                  {currentUser.name}
                </p>
                <p className="text-xs text-slate-500">{currentUser.role}</p>
              </div>
              <img
                src={currentUser.avatar}
                alt="Profile"
                className="w-10 h-10 rounded-xl border-2 border-indigo-100 shadow-sm object-cover"
              />
            </div>
          </header>

          {/* View Content */}
          <div className="flex-1 overflow-auto p-4 lg:p-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </>
  );
};

export default AccountantTeamDashboard;

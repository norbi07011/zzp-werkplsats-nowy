/**
 * ================================================================
 * EMPLOYER TEAM PAGE - Główna strona zespołu dla pracodawcy
 * ================================================================
 * Integruje moduł team-system z BetonCoat B.V.
 * Panel boczny z nawigacją między podstronami
 */

import React, { useState, useEffect } from "react";
import {
  TeamStoreProvider,
  useTeamStore,
} from "../../src/modules/team-system/context/TeamStoreContext";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../src/lib/supabase";
import { ProjectsAndTasks } from "../../src/modules/team-system/pages/ProjectsAndTasks";
import TeamPage from "../../src/modules/team-system/pages/TeamPage";
import { CalendarPage } from "../../src/modules/team-system/pages/CalendarPage";
import { ChatPage } from "../../src/modules/team-system/pages/ChatPage";
import { RankingPage } from "../../src/modules/team-system/pages/RankingPage";
import { Dashboard as TeamDashboard } from "../../src/modules/team-system/pages/TeamDashboard";
import { OrderBuilder } from "../../src/modules/team-system/pages/OrderBuilder";
import { DocumentBuilder } from "../../src/modules/team-system/tools";
import Users from "lucide-react/dist/esm/icons/users";
import FolderKanban from "lucide-react/dist/esm/icons/folder-kanban";
import Wrench from "lucide-react/dist/esm/icons/wrench";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import Trophy from "lucide-react/dist/esm/icons/trophy";
import LayoutDashboard from "lucide-react/dist/esm/icons/layout-dashboard";
import Menu from "lucide-react/dist/esm/icons/menu";
import X from "lucide-react/dist/esm/icons/x";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Settings from "lucide-react/dist/esm/icons/settings";
import HelpCircle from "lucide-react/dist/esm/icons/help-circle";

type TabType =
  | "dashboard"
  | "projects"
  | "team"
  | "calendar"
  | "chat"
  | "ranking"
  | "orderbuilder"
  | "tools";

interface Team {
  id: string;
  name: string;
  color_hex: string;
}

const TeamSystemContent = () => {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    currentUser,
    selectedTeamId,
    setSelectedTeamId,
    refreshProjects,
    refreshTasks,
    refreshChatMessages,
  } = useTeamStore();
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);

  // Fetch employer's teams
  useEffect(() => {
    const fetchTeams = async () => {
      if (!user?.id || user.role !== "employer") return;

      try {
        const { data: employer } = await supabase
          .from("employers")
          .select("id")
          .eq("profile_id", user.id)
          .single();

        if (!employer) return;

        const { data: teamsData } = await supabase
          .from("employer_teams")
          .select("id, name, color_hex")
          .eq("employer_id", employer.id)
          .eq("is_active", true)
          .order("created_at", { ascending: true });

        setTeams(teamsData || []);
      } catch (error) {
        console.error("Error fetching teams:", error);
      } finally {
        setLoadingTeams(false);
      }
    };

    fetchTeams();
  }, [user?.id, user?.role]);

  // Handle team change
  const handleTeamChange = async (teamId: string) => {
    setSelectedTeamId(teamId);
    // Refresh data for new team
    setTimeout(() => {
      refreshProjects();
      refreshTasks();
      refreshChatMessages();
    }, 100);
  };

  const tabs = [
    {
      id: "dashboard" as TabType,
      label: "Dashboard",
      icon: LayoutDashboard,
      description: "Przegląd i statystyki",
    },
    {
      id: "projects" as TabType,
      label: "Projekty",
      icon: FolderKanban,
      description: "Zarządzanie projektami i zadaniami",
    },
    {
      id: "team" as TabType,
      label: "Zespół",
      icon: Users,
      description: "Pracownicy i dostępność",
    },
    {
      id: "calendar" as TabType,
      label: "Kalendarz",
      icon: Calendar,
      description: "Harmonogram zadań",
    },
    {
      id: "chat" as TabType,
      label: "Czat",
      icon: MessageCircle,
      description: "Komunikacja zespołowa",
    },
    {
      id: "ranking" as TabType,
      label: "Ranking",
      icon: Trophy,
      description: "Wydajność pracowników",
    },
    {
      id: "orderbuilder" as TabType,
      label: "Budowa Zleceń",
      icon: FolderKanban,
      description: "Kreator nowych zleceń",
    },
    {
      id: "tools" as TabType,
      label: "Narzędzia",
      icon: Wrench,
      description: "Kreator dokumentów zleceń",
    },
  ];

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  // Sidebar content
  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          {(!sidebarCollapsed || isMobile) && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users size={20} className="text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white text-lg">Drużyna</h1>
                <p className="text-xs text-blue-300">System zarządzania</p>
              </div>
            </div>
          )}
          {sidebarCollapsed && !isMobile && (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto">
              <Users size={20} className="text-white" />
            </div>
          )}
          {!isMobile && (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title={sidebarCollapsed ? "Rozwiń" : "Zwiń"}
            >
              {sidebarCollapsed ? (
                <ChevronRight size={18} className="text-blue-300" />
              ) : (
                <ChevronLeft size={18} className="text-blue-300" />
              )}
            </button>
          )}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-white/10 rounded-lg"
            >
              <X size={20} className="text-white" />
            </button>
          )}
        </div>
      </div>

      {/* User Info */}
      {currentUser && (!sidebarCollapsed || isMobile) && (
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img
              src={
                currentUser.avatar ||
                `https://ui-avatars.com/api/?name=${currentUser.name}&background=6366f1&color=fff`
              }
              alt={currentUser.name}
              className="w-10 h-10 rounded-full border-2 border-white/20"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {currentUser.name}
              </p>
              <p className="text-xs text-blue-300">Administrator</p>
            </div>
            <div
              className={`w-3 h-3 rounded-full ${
                currentUser.isAvailable ? "bg-green-400" : "bg-red-400"
              }`}
            />
          </div>
        </div>
      )}

      {/* Team Selector */}
      {teams.length > 1 && (!sidebarCollapsed || isMobile) && (
        <div className="px-4 py-3 border-b border-white/10">
          <label className="text-xs text-blue-300 block mb-2">
            Aktywny zespół
          </label>
          <select
            value={selectedTeamId || ""}
            onChange={(e) => handleTeamChange(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {teams.map((team) => (
              <option
                key={team.id}
                value={team.id}
                className="bg-slate-800 text-white"
              >
                {team.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {(!sidebarCollapsed || isMobile) && (
          <p className="text-xs text-blue-300 px-3 mb-2 uppercase tracking-wider font-medium">
            Menu główne
          </p>
        )}
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
              title={sidebarCollapsed && !isMobile ? tab.label : undefined}
            >
              <Icon
                size={20}
                className={isActive ? "text-white" : "text-blue-400"}
              />
              {(!sidebarCollapsed || isMobile) && (
                <div className="text-left min-w-0 flex-1">
                  <span className="font-medium text-sm block">{tab.label}</span>
                  {isActive && (
                    <span className="text-xs text-blue-200 truncate block">
                      {tab.description}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10">
        {!sidebarCollapsed || isMobile ? (
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all text-sm">
              <Settings size={18} />
              <span>Ustawienia</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all text-sm">
              <HelpCircle size={18} />
              <span>Pomoc</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
              <Settings size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Full layout with sidebar (always - this is a standalone page)
  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-900 transition-all duration-300 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Menu Button - positioned above MobileBottomNav (h-16 + safe area) */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="md:hidden fixed bottom-24 left-4 z-50 w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center text-white"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="md:hidden fixed left-0 top-0 h-full w-72 bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-900 z-50 shadow-2xl">
            <SidebarContent isMobile />
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              {tabs.find((t) => t.id === activeTab)?.icon &&
                React.createElement(
                  tabs.find((t) => t.id === activeTab)!.icon,
                  { size: 16, className: "text-white" }
                )}
            </div>
            <div>
              <h1 className="font-bold text-slate-800">
                {tabs.find((t) => t.id === activeTab)?.label}
              </h1>
              <p className="text-xs text-slate-500">
                {tabs.find((t) => t.id === activeTab)?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 md:p-6">
          {activeTab === "dashboard" && (
            <TeamDashboard
              setActivePage={(page) => setActiveTab(page as TabType)}
            />
          )}
          {activeTab === "projects" && <ProjectsAndTasks />}
          {activeTab === "team" && <TeamPage />}
          {activeTab === "calendar" && <CalendarPage />}
          {activeTab === "chat" && <ChatPage />}
          {activeTab === "ranking" && <RankingPage />}
          {activeTab === "orderbuilder" && <OrderBuilder />}
          {activeTab === "tools" && <DocumentBuilder />}
        </div>
      </main>
    </div>
  );
};

const EmployerTeamPage = () => {
  return (
    <TeamStoreProvider>
      <TeamSystemContent />
    </TeamStoreProvider>
  );
};

export default EmployerTeamPage;

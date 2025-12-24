import React, { useState, useEffect, useRef } from "react";
import {
  useTeamDashboard,
  Project as TeamProject,
} from "../hooks/useTeamDashboard";
import { useAuth } from "../contexts/AuthContext";
import { FileManagerSimple } from "./File/FileManagerSimple";
import { TaskList } from "./TaskList";
import { Calendar } from "./Calendar";
import { Chat } from "./Chat";
import { TeamMembers } from "./TeamMembers";
import { InvitesManager } from "./InvitesManager";

// Project interface matching communication_projects table structure
interface Project {
  id: string;
  name: string; // communication_projects uses 'name'
  description?: string;
  employer_id?: string;
  employer_name?: string;
  status: string;
  created_by: string; // communication_projects uses 'created_by'
  start_date?: string;
  end_date?: string;
  budget?: number;
  location_address?: string;
  project_type?: string;
  created_at: string;
  updated_at: string;
}

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalMembers: number;
  completionRate: number;
}

type ViewMode =
  | "overview"
  | "projects"
  | "tasks"
  | "calendar"
  | "team"
  | "chat"
  | "files"
  | "invites";

const TeamDashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects, stats, activities, notifications, loading, error } =
    useTeamDashboard();
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const quickActionsRef = useRef<HTMLDivElement>(null);

  // Auto-select first project when projects load
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Close quick actions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        quickActionsRef.current &&
        !quickActionsRef.current.contains(event.target as Node)
      ) {
        setShowQuickActions(false);
      }
    };

    if (showQuickActions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showQuickActions]);

  // Quick Actions Component
  const QuickActions = () => (
    <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Szybkie akcje
        </h3>
        <div className="space-y-2">
          <button
            onClick={() => {
              setViewMode("tasks");
              setShowQuickActions(false);
            }}
            className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
          >
            <span className="w-5 h-5 text-blue-600">✓</span>
            <span className="font-medium">Dodaj zadanie</span>
          </button>
          <button
            onClick={() => {
              setViewMode("calendar");
              setShowQuickActions(false);
            }}
            className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
          >
            <span className="w-5 h-5 text-green-600">📅</span>
            <span className="font-medium">Zaplanuj spotkanie</span>
          </button>
          <button
            onClick={() => {
              setViewMode("chat");
              setShowQuickActions(false);
            }}
            className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
          >
            <span className="w-5 h-5 text-purple-600">💬</span>
            <span className="font-medium">Napisz wiadomość</span>
          </button>
          {(user?.role === "employer" || user?.role === "accountant") && (
            <button
              onClick={() => {
                setViewMode("invites");
                setShowQuickActions(false);
              }}
              className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
            >
              <span className="w-5 h-5 text-indigo-600">👥</span>
              <span className="font-medium">Zaproś członka</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Overview Dashboard
  const OverviewDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Wszystkie projekty
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalProjects}
              </p>
            </div>
            <span className="text-2xl">📁</span>
          </div>
          <div className="mt-4">
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      stats.totalProjects > 0
                        ? (stats.activeProjects / stats.totalProjects) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className="text-sm text-gray-600">
                {stats.totalProjects > 0
                  ? Math.round(
                      (stats.activeProjects / stats.totalProjects) * 100
                    )
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktywne</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.activeProjects}
              </p>
            </div>
            <span className="text-2xl">🟢</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Członkowie zespołu
              </p>
              <p className="text-3xl font-bold text-purple-600">
                {stats.totalMembers}
              </p>
            </div>
            <span className="text-2xl">👥</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Ostatnie aktywności
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {stats.recentActivities}
              </p>
            </div>
            <span className="text-2xl">📊</span>
          </div>
        </div>
      </div>

      {/* Real Projects Section */}
      {projects.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            🏗️ Twoje projekty
          </h3>
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {project.name}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {project.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        project.status === "active"
                          ? "bg-green-100 text-green-800"
                          : project.status === "planning"
                          ? "bg-blue-100 text-blue-800"
                          : project.status === "completed"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {project.status}
                    </span>
                    {project.employer_name && (
                      <span className="text-sm text-gray-500">
                        Pracodawca: {project.employer_name}
                      </span>
                    )}
                    {project.budget && (
                      <span className="text-sm text-gray-500">
                        Budżet: €{project.budget.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Utworzony</p>
                  <p className="text-sm font-medium">
                    {new Date(project.created_at).toLocaleDateString("pl-PL")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activities */}
      {activities.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            📊 Ostatnie aktywności
          </h3>
          <div className="space-y-3">
            {activities.slice(0, 5).map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-lg">📝</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    {activity.description || activity.activity_type}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.created_at).toLocaleString("pl-PL")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            🔔 Powiadomienia{" "}
            {stats.unreadNotifications > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                {stats.unreadNotifications}
              </span>
            )}
          </h3>
          <div className="space-y-3">
            {notifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border ${
                  notification.status === "unread"
                    ? "bg-blue-50 border-blue-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <span className="text-lg">
                  {notification.priority >= 4
                    ? "🔴"
                    : notification.priority >= 3
                    ? "🟡"
                    : "🔵"}
                </span>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.created_at).toLocaleString("pl-PL")}
                  </p>
                </div>
                {notification.status === "unread" && (
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    Oznacz jako przeczytane
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feature Cards - Coming Soon */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">📋</span>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              System Zadań
            </h3>
            <p className="text-gray-600 mb-4">
              Pełne zarządzanie zadaniami z priorytetami, statusami i
              komentarzami
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <span className="text-green-600 font-medium">
                ✅ Zaimplementowane w bazie danych
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">📅</span>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              System Kalendarza
            </h3>
            <p className="text-gray-600 mb-4">
              Wydarzenia, spotkania, deadliny z automatycznymi powiadomieniami
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <span className="text-green-600 font-medium">
                ✅ Zaimplementowane w bazie danych
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">📊</span>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Kanban Board
            </h3>
            <p className="text-gray-600 mb-4">
              Wizualne zarządzanie przepływem zadań w stylu Kanban
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <span className="text-green-600 font-medium">
                ✅ Zaimplementowane w module Team System
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">📈</span>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Wykres Gantta
            </h3>
            <p className="text-gray-600 mb-4">
              Timeline projektów z zależnościami między zadaniami
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <span className="text-green-600 font-medium">
                ✅ Zaimplementowane w module Team System
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System Architecture Info */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          🏗️ Status implementacji systemu
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="text-green-500 font-bold">✅</span>
              <span className="font-medium">
                Baza danych - System zadań (3 tabele)
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-green-500 font-bold">✅</span>
              <span className="font-medium">
                Baza danych - System kalendarza (3 tabele)
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-green-500 font-bold">✅</span>
              <span className="font-medium">
                ENUM typy (status, priority, event_type)
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-green-500 font-bold">✅</span>
              <span className="font-medium">RLS Policies (bezpieczeństwo)</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="text-green-500 font-bold">✅</span>
              <span className="font-medium">
                Frontend - Dashboard interfejs
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-green-500 font-bold">✅</span>
              <span className="font-medium">System zaproszeń i uprawnień</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-green-500 font-bold">✅</span>
              <span className="font-medium">Activity Log i powiadomienia</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-green-500 font-bold">✅</span>
              <span className="font-medium">Zaawansowane funkcje</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Coming Soon Views
  const ComingSoonView = ({
    title,
    description,
    icon,
  }: {
    title: string;
    description: string;
    icon: string;
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="text-center">
        <span className="text-6xl mb-6 block">{icon}</span>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{title}</h2>
        <p className="text-gray-600 mb-6">{description}</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-600 font-medium">
            Ta funkcjonalność jest w trakcie implementacji.
            <br />
            Backend (baza danych) jest już gotowy!
          </p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <span className="text-6xl mb-4 block">⚠️</span>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Błąd ładowania
        </h3>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel Drużyny</h1>
            <p className="text-gray-600 mt-1">
              Kompleksowe zarządzanie projektami i zespołem
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Quick Actions - only for employer/accountant */}
            {(user?.role === "employer" || user?.role === "accountant") && (
              <div className="relative" ref={quickActionsRef}>
                <button
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
                >
                  <span>➕</span>
                  <span>Szybkie akcje</span>
                </button>
                {showQuickActions && <QuickActions />}
              </div>
            )}
          </div>
        </div>

        {/* Project Selector - show if multiple projects */}
        {projects.length > 1 && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label
              htmlFor="project-selector"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              📁 Aktywny projekt:
            </label>
            <select
              id="project-selector"
              value={selectedProjectId || ""}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  📁 {project.name} {project.status === "active" ? "🟢" : "⚪"}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* View Mode Tabs */}
        <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
          {[
            { id: "overview", label: "Przegląd", icon: "📊" },
            { id: "projects", label: "Projekty", icon: "📁" },
            { id: "tasks", label: "Zadania", icon: "✓" },
            { id: "calendar", label: "Kalendarz", icon: "📅" },
            { id: "team", label: "Zespół", icon: "👥" },
            { id: "invites", label: "Zaproszenia", icon: "✉️" },
            { id: "chat", label: "Czat", icon: "💬" },
            { id: "files", label: "Pliki", icon: "📎" },
          ]
            .filter((tab) => {
              // Hide "Zaproszenia" tab for workers
              if (tab.id === "invites" && user?.role === "worker") {
                return false;
              }
              return true;
            })
            .map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id as ViewMode)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  viewMode === tab.id
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
        </div>
      </div>

      {/* Content based on view mode */}
      <div className="min-h-screen">
        {viewMode === "overview" && <OverviewDashboard />}

        {viewMode === "projects" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Projekty</h2>
            {projects.length > 0 && (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 bg-gray-50 rounded-lg border"
                  >
                    <h4 className="font-semibold text-gray-900">
                      {project.name}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {project.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === "tasks" &&
          (selectedProjectId ? (
            <TaskList projectId={selectedProjectId} />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <span className="text-6xl mb-4 block">📋</span>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Brak projektów
              </h3>
              <p className="text-gray-600">
                Utwórz projekt, aby zarządzać zadaniami
              </p>
            </div>
          ))}

        {viewMode === "calendar" &&
          (selectedProjectId ? (
            <Calendar projectId={selectedProjectId} />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <span className="text-6xl mb-4 block">📅</span>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Brak projektów
              </h3>
              <p className="text-gray-600">
                Utwórz projekt, aby planować wydarzenia
              </p>
            </div>
          ))}

        {viewMode === "team" &&
          (selectedProjectId ? (
            <TeamMembers projectId={selectedProjectId} />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <span className="text-6xl mb-4 block">👥</span>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Brak projektów
              </h3>
              <p className="text-gray-600">
                Utwórz projekt, aby zarządzać zespołem
              </p>
            </div>
          ))}

        {viewMode === "invites" &&
          (selectedProjectId ? (
            <InvitesManager
              projectId={selectedProjectId}
              projectName={
                projects.find((p) => p.id === selectedProjectId)?.name || ""
              }
              showInviteButton={
                user?.role === "employer" || user?.role === "accountant"
              }
            />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <span className="text-6xl mb-4 block">✉️</span>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Brak projektów
              </h3>
              <p className="text-gray-600">
                Utwórz projekt, aby wysyłać zaproszenia
              </p>
            </div>
          ))}

        {viewMode === "chat" &&
          (selectedProjectId ? (
            <Chat projectId={selectedProjectId} />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <span className="text-6xl mb-4 block">💬</span>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Brak projektów
              </h3>
              <p className="text-gray-600">
                Utwórz projekt, aby rozpocząć czat
              </p>
            </div>
          ))}

        {viewMode === "files" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <span>📎</span>
                <span>Zarządzanie Plikami</span>
              </h2>
              <p className="text-gray-600 mt-2">
                Przesyłaj, organizuj i udostępniaj pliki projektów w jednym
                miejscu
              </p>
            </div>
            {selectedProjectId && (
              <FileManagerSimple projectId={selectedProjectId} />
            )}
          </div>
        )}
      </div>

      {/* Click outside to close quick actions */}
      {showQuickActions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowQuickActions(false)}
        />
      )}
    </div>
  );
};

export default TeamDashboard;

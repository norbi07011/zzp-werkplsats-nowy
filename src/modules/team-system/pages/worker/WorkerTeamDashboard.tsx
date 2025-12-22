/**
 * ================================================================
 * WORKER TEAM DASHBOARD
 * ================================================================
 * Pełny panel dla pracownika w zespole
 * Features: Moje zespoły, projekty, zadania, chat, kalendarz
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  CheckSquare,
  Briefcase,
  MessageSquare,
  Calendar,
  Clock,
  Users,
  Send,
  AlertTriangle,
  Building2,
  CheckCircle,
  MapPin,
  Navigation,
  Pause,
  Play,
  User,
} from "lucide-react";
import { useAuth } from "../../../../../contexts/AuthContext";
import { supabase } from "../../../../lib/supabase";
import { toast } from "sonner";
import { Project, Task, ChatMessage, TaskStatus, Priority } from "../../types";

// Use any for Supabase responses - types not yet regenerated
type SupabaseAny = any;

// ================================================================
// Types
// ================================================================
interface Team {
  id: string;
  name: string;
  description?: string;
  employer_name?: string;
  member_count?: number;
  active_projects?: number;
}

interface ExtendedTask extends Task {
  projectTitle?: string;
}

interface WorkerStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todayTasks: number;
  hoursThisWeek: number;
}

type TabType = "overview" | "tasks" | "projects" | "chat" | "calendar";

// ================================================================
// Main Component
// ================================================================
export const WorkerTeamDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<ExtendedTask[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [stats, setStats] = useState<WorkerStats>({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    todayTasks: 0,
    hoursThisWeek: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [workerId, setWorkerId] = useState<string | null>(null);

  // ================================================================
  // Data Fetching
  // ================================================================

  // Get worker ID
  useEffect(() => {
    const fetchWorkerId = async () => {
      if (!user?.id) return;

      const { data } = await (supabase as SupabaseAny)
        .from("workers")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (data) {
        setWorkerId(data.id);
      }
    };

    fetchWorkerId();
  }, [user?.id]);

  // Fetch teams for this worker
  const fetchTeams = useCallback(async () => {
    if (!workerId) return;

    try {
      const { data: memberships, error } = await (supabase as SupabaseAny)
        .from("employer_team_members")
        .select(
          `
          team_id,
          role,
          employer_teams (
            id,
            name,
            description,
            employers (
              company_name
            )
          )
        `
        )
        .eq("worker_id", workerId)
        .eq("status", "active");

      if (error) throw error;

      const teamsData: Team[] = (memberships || []).map((m: any) => ({
        id: m.employer_teams.id,
        name: m.employer_teams.name,
        description: m.employer_teams.description,
        employer_name: m.employer_teams.employers?.company_name,
      }));

      setTeams(teamsData);

      // Auto-select first team
      if (teamsData.length > 0 && !selectedTeamId) {
        setSelectedTeamId(teamsData[0].id);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast.error("Nie udało się pobrać zespołów");
    } finally {
      setIsLoading(false);
    }
  }, [workerId, selectedTeamId]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Fetch projects for selected team
  const fetchProjects = useCallback(async () => {
    if (!selectedTeamId) return;

    try {
      const { data, error } = await (supabase as SupabaseAny)
        .from("team_projects")
        .select("*")
        .eq("team_id", selectedTeamId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mappedProjects: Project[] = (data || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        clientName: p.client_name || "",
        street: p.street || "",
        houseNumber: p.house_number || "",
        postalCode: p.postal_code || "",
        city: p.city || "",
        description: p.description || "",
        tasks: [],
        startDate: p.start_date || new Date().toISOString(),
        endDate: p.end_date || undefined,
        status: (p.status as "ACTIVE" | "COMPLETED" | "ARCHIVED") || "ACTIVE",
      }));

      setProjects(mappedProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  }, [selectedTeamId]);

  // Fetch tasks assigned to this worker
  const fetchTasks = useCallback(async () => {
    if (!selectedTeamId || !workerId) return;

    try {
      const { data, error } = await (supabase as SupabaseAny)
        .from("team_tasks")
        .select(
          `
          *,
          team_projects!inner(team_id, title)
        `
        )
        .eq("team_projects.team_id", selectedTeamId)
        .contains("assigned_to", [workerId])
        .order("due_date", { ascending: true });

      if (error) throw error;

      const mappedTasks: Task[] = (data || []).map((t: any) => ({
        id: t.id,
        projectId: t.project_id,
        title: t.title,
        description: t.description || "",
        assignedToIds: t.assigned_to || [],
        status: (t.status as TaskStatus) || TaskStatus.TODO,
        priority: (t.priority as Priority) || Priority.MEDIUM,
        dueDate: t.due_date || new Date().toISOString(),
        estimatedHours: t.estimated_hours || undefined,
        toolsRequired: t.tools_required || [],
        materialsRequired: [],
        materialsUsed: [],
        comments: [],
        photos: t.photos || [],
        workLogs: [],
        projectTitle: (t.team_projects as any)?.title,
      }));

      setTasks(mappedTasks);

      // Calculate stats
      const today = new Date().toISOString().split("T")[0];
      setStats({
        totalTasks: mappedTasks.length,
        completedTasks: mappedTasks.filter((t) => t.status === TaskStatus.DONE)
          .length,
        inProgressTasks: mappedTasks.filter(
          (t) => t.status === TaskStatus.IN_PROGRESS
        ).length,
        todayTasks: mappedTasks.filter((t) => t.dueDate?.startsWith(today))
          .length,
        hoursThisWeek: 0, // TODO: Calculate from work logs
      });
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }, [selectedTeamId, workerId]);

  // Fetch chat messages
  const fetchChatMessages = useCallback(async () => {
    if (!selectedTeamId) return;

    try {
      const { data, error } = await (supabase as SupabaseAny)
        .from("team_chat_messages")
        .select("*, profiles(full_name)")
        .eq("team_id", selectedTeamId)
        .order("created_at", { ascending: true })
        .limit(50);

      if (error) throw error;

      const mappedMessages: ChatMessage[] = (data || []).map((m: any) => ({
        id: m.id,
        userId: m.sender_id,
        userName: (m.profiles as any)?.full_name || "Użytkownik",
        text: m.message,
        timestamp: new Date(m.created_at).getTime(),
      }));

      setChatMessages(mappedMessages);
    } catch (error) {
      console.error("Error fetching chat:", error);
    }
  }, [selectedTeamId]);

  // Load data when team changes
  useEffect(() => {
    if (selectedTeamId) {
      fetchProjects();
      fetchTasks();
      fetchChatMessages();
    }
  }, [selectedTeamId, fetchProjects, fetchTasks, fetchChatMessages]);

  // Real-time chat subscription
  useEffect(() => {
    if (!selectedTeamId) return;

    const channel = supabase
      .channel(`worker-chat-${selectedTeamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_chat_messages",
          filter: `team_id=eq.${selectedTeamId}`,
        },
        async (payload: any) => {
          if (payload.new.sender_id === user?.id) return;

          const { data: profile } = await (supabase as SupabaseAny)
            .from("profiles")
            .select("full_name")
            .eq("id", payload.new.sender_id)
            .single();

          const newMsg: ChatMessage = {
            id: payload.new.id,
            userId: payload.new.sender_id,
            userName: profile?.full_name || "Użytkownik",
            text: payload.new.message,
            timestamp: new Date(payload.new.created_at).getTime(),
          };

          setChatMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTeamId, user?.id]);

  // ================================================================
  // Actions
  // ================================================================

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTeamId || !user?.id) return;

    try {
      const { error } = await (supabase as SupabaseAny)
        .from("team_chat_messages")
        .insert({
          team_id: selectedTeamId,
          sender_id: user.id,
          message: newMessage.trim(),
        });

      if (error) throw error;

      // Optimistic update
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          userId: user.id,
          userName: user.fullName || "Ja",
          text: newMessage.trim(),
          timestamp: Date.now(),
        },
      ]);

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Nie udało się wysłać wiadomości");
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const { error } = await (supabase as SupabaseAny)
        .from("team_tasks")
        .update({
          status: newStatus,
          completed_at:
            newStatus === TaskStatus.DONE ? new Date().toISOString() : null,
        })
        .eq("id", taskId);

      if (error) throw error;

      toast.success("Status zaktualizowany");
      fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Nie udało się zaktualizować zadania");
    }
  };

  // ================================================================
  // Render Helpers
  // ================================================================

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.URGENT:
        return "bg-red-100 text-red-700 border-red-200";
      case Priority.HIGH:
        return "bg-orange-100 text-orange-700 border-orange-200";
      case Priority.MEDIUM:
        return "bg-blue-100 text-blue-700 border-blue-200";
      case Priority.LOW:
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.DONE:
        return "bg-green-100 text-green-700";
      case TaskStatus.IN_PROGRESS:
        return "bg-blue-100 text-blue-700";
      case TaskStatus.BLOCKED:
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.DONE:
        return "Ukończone";
      case TaskStatus.IN_PROGRESS:
        return "W trakcie";
      case TaskStatus.BLOCKED:
        return "Zablokowane";
      default:
        return "Do zrobienia";
    }
  };

  // ================================================================
  // Loading State
  // ================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Nie należysz do żadnego zespołu
        </h3>
        <p className="text-gray-500">
          Poczekaj na zaproszenie od pracodawcy lub sprawdź zakładkę
          "Zaproszenia".
        </p>
      </div>
    );
  }

  // ================================================================
  // Main Render
  // ================================================================

  return (
    <div className="space-y-6">
      {/* Team Selector */}
      {teams.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wybierz zespół
          </label>
          <select
            value={selectedTeamId || ""}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name} {team.employer_name && `(${team.employer_name})`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {[
            { id: "overview", label: "Przegląd", icon: BarChart3 },
            { id: "tasks", label: "Moje zadania", icon: CheckSquare },
            { id: "projects", label: "Projekty", icon: Briefcase },
            { id: "chat", label: "Chat zespołu", icon: MessageSquare },
            { id: "calendar", label: "Kalendarz", icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "text-primary-600 border-b-2 border-primary-600 bg-primary-50"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Wszystkie zadania</p>
                      <p className="text-3xl font-bold mt-1">
                        {stats.totalTasks}
                      </p>
                    </div>
                    <CheckSquare className="w-10 h-10 opacity-80" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100 text-sm">W trakcie</p>
                      <p className="text-3xl font-bold mt-1">
                        {stats.inProgressTasks}
                      </p>
                    </div>
                    <Clock className="w-10 h-10 opacity-80" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Ukończone</p>
                      <p className="text-3xl font-bold mt-1">
                        {stats.completedTasks}
                      </p>
                    </div>
                    <CheckCircle className="w-10 h-10 opacity-80" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Na dziś</p>
                      <p className="text-3xl font-bold mt-1">
                        {stats.todayTasks}
                      </p>
                    </div>
                    <Calendar className="w-10 h-10 opacity-80" />
                  </div>
                </div>
              </div>

              {/* Current Task Focus */}
              {tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length >
                0 && (
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Play className="w-5 h-5" /> Aktualnie pracujesz nad:
                  </h3>
                  {tasks
                    .filter((t) => t.status === TaskStatus.IN_PROGRESS)
                    .slice(0, 1)
                    .map((task) => {
                      const project = projects.find(
                        (p) => p.id === task.projectId
                      );
                      return (
                        <div
                          key={task.id}
                          className="bg-white/10 rounded-lg p-4"
                        >
                          <h4 className="text-xl font-bold">{task.title}</h4>
                          {project && (
                            <p className="text-primary-100 mt-1">
                              {project.title} • {project.city}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-4">
                            <button
                              onClick={() =>
                                updateTaskStatus(task.id, TaskStatus.DONE)
                              }
                              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" /> Zakończ
                              zadanie
                            </button>
                            <button
                              onClick={() =>
                                updateTaskStatus(task.id, TaskStatus.BLOCKED)
                              }
                              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                            >
                              <Pause className="w-4 h-4" /> Zablokowane
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Upcoming Tasks */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Nadchodzące zadania
                </h3>
                <div className="space-y-3">
                  {tasks
                    .filter((t) => t.status === TaskStatus.TODO)
                    .slice(0, 5)
                    .map((task) => {
                      const project = projects.find(
                        (p) => p.id === task.projectId
                      );
                      return (
                        <div
                          key={task.id}
                          className="bg-gray-50 rounded-lg p-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`p-2 rounded-lg ${getPriorityColor(
                                task.priority
                              )}`}
                            >
                              <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800">
                                {task.title}
                              </h4>
                              {project && (
                                <p className="text-sm text-gray-500">
                                  {project.title}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">
                              {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString(
                                    "pl-PL"
                                  )
                                : "Brak terminu"}
                            </span>
                            <button
                              onClick={() =>
                                updateTaskStatus(
                                  task.id,
                                  TaskStatus.IN_PROGRESS
                                )
                              }
                              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                            >
                              Rozpocznij →
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  {tasks.filter((t) => t.status === TaskStatus.TODO).length ===
                    0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                      <p>Wszystkie zadania ukończone!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TASKS TAB */}
          {activeTab === "tasks" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Moje zadania ({tasks.length})
                </h3>
                <div className="flex gap-2">
                  {["TODO", "IN_PROGRESS", "DONE", "BLOCKED"].map((status) => (
                    <span
                      key={status}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        status as TaskStatus
                      )}`}
                    >
                      {getStatusLabel(status as TaskStatus)} (
                      {
                        tasks.filter((t) => t.status === (status as TaskStatus))
                          .length
                      }
                      )
                    </span>
                  ))}
                </div>
              </div>

              {tasks.map((task) => {
                const project = projects.find((p) => p.id === task.projectId);
                return (
                  <div
                    key={task.id}
                    className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                              task.status
                            )}`}
                          >
                            {getStatusLabel(task.status)}
                          </span>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-800">
                          {task.title}
                        </h4>
                        <p className="text-gray-600 mt-1">{task.description}</p>

                        {project && (
                          <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                            <Building2 className="w-4 h-4" />
                            <span>{project.title}</span>
                            <span>•</span>
                            <MapPin className="w-4 h-4" />
                            <span>
                              {project.street} {project.houseNumber},{" "}
                              {project.city}
                            </span>
                          </div>
                        )}

                        {task.dueDate && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Termin:{" "}
                              {new Date(task.dueDate).toLocaleDateString(
                                "pl-PL"
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        {task.status === TaskStatus.TODO && (
                          <button
                            onClick={() =>
                              updateTaskStatus(task.id, TaskStatus.IN_PROGRESS)
                            }
                            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                          >
                            <Play className="w-4 h-4" /> Start
                          </button>
                        )}
                        {task.status === TaskStatus.IN_PROGRESS && (
                          <>
                            <button
                              onClick={() =>
                                updateTaskStatus(task.id, TaskStatus.DONE)
                              }
                              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" /> Gotowe
                            </button>
                            <button
                              onClick={() =>
                                updateTaskStatus(task.id, TaskStatus.BLOCKED)
                              }
                              className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <AlertTriangle className="w-4 h-4" /> Problem
                            </button>
                          </>
                        )}
                        {task.status === TaskStatus.BLOCKED && (
                          <button
                            onClick={() =>
                              updateTaskStatus(task.id, TaskStatus.IN_PROGRESS)
                            }
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Play className="w-4 h-4" /> Wznów
                          </button>
                        )}

                        {project && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              `${project.street} ${project.houseNumber}, ${project.city}`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Navigation className="w-4 h-4" /> Nawiguj
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {tasks.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <CheckSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Nie masz przypisanych zadań</p>
                </div>
              )}
            </div>
          )}

          {/* PROJECTS TAB */}
          {activeTab === "projects" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => {
                const projectTasks = tasks.filter(
                  (t) => t.projectId === project.id
                );
                const completedCount = projectTasks.filter(
                  (t) => t.status === TaskStatus.DONE
                ).length;
                const progress =
                  projectTasks.length > 0
                    ? Math.round((completedCount / projectTasks.length) * 100)
                    : 0;

                return (
                  <div
                    key={project.id}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            project.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : project.status === "COMPLETED"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {project.status === "ACTIVE"
                            ? "Aktywny"
                            : project.status === "COMPLETED"
                            ? "Ukończony"
                            : "Zarchiwizowany"}
                        </span>
                      </div>
                      <Briefcase className="w-5 h-5 text-gray-400" />
                    </div>

                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      {project.title}
                    </h4>

                    {project.clientName && (
                      <p className="text-sm text-gray-600 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        {project.clientName}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {project.street} {project.houseNumber}, {project.city}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Postęp</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-600 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {completedCount} z {projectTasks.length} zadań
                        ukończonych
                      </p>
                    </div>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${project.street} ${project.houseNumber}, ${project.city}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Navigation className="w-4 h-4" /> Pokaż na mapie
                    </a>
                  </div>
                );
              })}

              {projects.length === 0 && (
                <div className="col-span-2 text-center py-12 text-gray-500">
                  <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Brak projektów w tym zespole</p>
                </div>
              )}
            </div>
          )}

          {/* CHAT TAB */}
          {activeTab === "chat" && (
            <div className="flex flex-col h-[500px]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {chatMessages.map((msg) => {
                  const isMe = msg.userId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        isMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-xl p-4 ${
                          isMe
                            ? "bg-primary-600 text-white"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {!isMe && (
                          <p
                            className={`text-xs font-medium mb-1 ${
                              isMe ? "text-primary-200" : "text-gray-500"
                            }`}
                          >
                            {msg.userName}
                          </p>
                        )}
                        <p>{msg.text}</p>
                        <p
                          className={`text-xs mt-2 ${
                            isMe ? "text-primary-200" : "text-gray-400"
                          }`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString("pl-PL", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {chatMessages.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Brak wiadomości. Rozpocznij rozmowę!</p>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Napisz wiadomość..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* CALENDAR TAB */}
          {activeTab === "calendar" && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Kalendarz zadań
              </h3>
              <p className="text-gray-500 mb-4">
                Widok kalendarza zostanie wkrótce dodany.
              </p>

              {/* Simple list view for now */}
              <div className="text-left max-w-md mx-auto mt-8">
                <h4 className="font-medium text-gray-700 mb-3">
                  Nadchodzące terminy:
                </h4>
                {tasks
                  .filter((t) => t.dueDate && t.status !== TaskStatus.DONE)
                  .sort(
                    (a, b) =>
                      new Date(a.dueDate).getTime() -
                      new Date(b.dueDate).getTime()
                  )
                  .slice(0, 5)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-2"
                    >
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex flex-col items-center justify-center text-primary-700">
                        <span className="text-xs font-medium">
                          {new Date(task.dueDate).toLocaleDateString("pl-PL", {
                            day: "2-digit",
                          })}
                        </span>
                        <span className="text-xs">
                          {new Date(task.dueDate).toLocaleDateString("pl-PL", {
                            month: "short",
                          })}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {task.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {getStatusLabel(task.status)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkerTeamDashboard;

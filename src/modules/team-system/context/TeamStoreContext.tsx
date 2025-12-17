/**
 * ================================================================
 * TEAM SYSTEM - STORE CONTEXT
 * ================================================================
 * Zintegrowane z Supabase - pobiera prawdziwe dane z bazy
 * v2.0 - Full Supabase integration for projects, tasks, chat
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  TeamMember,
  Project,
  Task,
  ChatMessage,
  TeamUserRole,
  TaskStatus,
  Priority,
  TaskTemplate,
  Material,
  Comment,
  WorkLog,
} from "../types";
import { teamTranslations, TeamLanguage } from "../translations";
import { useAuth } from "../../../../contexts/AuthContext";
import { supabase } from "../../../lib/supabase";
import { toast } from "sonner";

interface TeamStoreContextType {
  currentUser: TeamMember | null;
  users: TeamMember[];
  projects: Project[];
  tasks: Task[];
  taskTemplates: TaskTemplate[];
  chatMessages: ChatMessage[];
  language: TeamLanguage;
  isLoading: boolean;
  selectedTeamId: string | null;
  setSelectedTeamId: (teamId: string | null) => void;
  setLanguage: (lang: TeamLanguage) => void;
  toggleAvailability: () => void;
  // Projects - Supabase
  addProject: (project: Omit<Project, "id" | "tasks">) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  // Tasks - Supabase
  addTask: (task: Omit<Task, "id" | "comments" | "workLogs">) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  // Work Logs & Comments - Supabase
  addWorkLog: (taskId: string, workLog: Omit<WorkLog, "id">) => Promise<void>;
  updateWorkLog: (taskId: string, workLogId: string, endTime: string) => Promise<void>;
  addComment: (taskId: string, text: string) => Promise<void>;
  // Chat - Supabase with real-time
  addChatMessage: (text: string) => Promise<void>;
  // User Management
  addUser: (user: TeamMember) => void;
  updateUser: (user: TeamMember) => void;
  deleteUser: (userId: string) => void;
  // Templates (local for now)
  addTaskTemplate: (template: TaskTemplate) => void;
  updateTaskTemplate: (template: TaskTemplate) => void;
  deleteTaskTemplate: (id: string) => void;
  // Refresh data
  refreshTeamMembers: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  refreshTasks: (projectId?: string) => Promise<void>;
  refreshChatMessages: () => Promise<void>;
  t: (key: keyof typeof teamTranslations.pl) => string;
}

const TeamStoreContext = createContext<TeamStoreContextType | undefined>(
  undefined
);

export const TeamStoreProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user: authUser } = useAuth();
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [language, setLanguage] = useState<TeamLanguage>("pl");
  const [isLoading, setIsLoading] = useState(true);
  const [employerId, setEmployerId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Get employer_id for current user
  useEffect(() => {
    const fetchEmployerId = async () => {
      if (!authUser?.id) return;

      if (authUser.role === "employer") {
        const { data } = await supabase
          .from("employers")
          .select("id")
          .eq("profile_id", authUser.id)
          .single();

        if (data) {
          setEmployerId(data.id);

          // Auto-select first team for employer
          const { data: firstTeam } = await supabase
            .from("employer_teams")
            .select("id")
            .eq("employer_id", data.id)
            .eq("is_active", true)
            .order("created_at", { ascending: true })
            .limit(1)
            .single();

          if (firstTeam) {
            setSelectedTeamId(firstTeam.id);
          }
        }
      } else if (authUser.role === "worker") {
        // For workers, get their first team
        const { data: worker } = await supabase
          .from("workers")
          .select("id")
          .eq("profile_id", authUser.id)
          .single();

        if (worker) {
          const { data: membership } = await supabase
            .from("employer_team_members")
            .select("team_id")
            .eq("worker_id", worker.id)
            .eq("status", "active")
            .limit(1)
            .single();

          if (membership) {
            setSelectedTeamId(membership.team_id);
          }
        }
      } else if (authUser.role === "cleaning_company") {
        // For cleaning companies, get their first team
        const { data: company } = await supabase
          .from("cleaning_companies")
          .select("id")
          .eq("profile_id", authUser.id)
          .single();

        if (company) {
          const { data: membership } = await supabase
            .from("employer_team_members")
            .select("team_id")
            .eq("cleaning_company_id", company.id)
            .eq("status", "active")
            .limit(1)
            .single();

          if (membership) {
            setSelectedTeamId(membership.team_id);
          }
        }
      }
    };

    fetchEmployerId();
  }, [authUser?.id, authUser?.role]);

  // Fetch team members from database - filtered by selectedTeamId
  const refreshTeamMembers = useCallback(async () => {
    // For employer: use selectedTeamId if available, otherwise skip
    // For worker/cleaning_company: always use selectedTeamId
    if (!selectedTeamId) {
      setUsers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Get members of the SELECTED team only (not all teams)
      const { data: members, error: membersError } = await supabase
        .from("employer_team_members")
        .select(
          `
          id,
          team_id,
          worker_id,
          cleaning_company_id,
          role,
          team_specialization,
          status
        `
        )
        .eq("team_id", selectedTeamId)
        .eq("status", "active");

      if (membersError) throw membersError;

      // Fetch profile data for each member
      const teamMembers: TeamMember[] = [];

      for (const member of members || []) {
        if (member.worker_id) {
          // Get worker profile
          const { data: worker } = await supabase
            .from("workers")
            .select(
              `
              id,
              profile_id,
              specialization,
              hourly_rate,
              is_available,
              phone,
              avatar_url,
              completed_jobs
            `
            )
            .eq("id", member.worker_id)
            .single();

          if (worker) {
            // Get profile for name/email
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, email, avatar_url")
              .eq("id", worker.profile_id)
              .single();

            // Count completed team tasks for this worker (profile_id in assigned_to array)
            const { count: completedTeamTasks } = await supabase
              .from("team_tasks")
              .select("id", { count: "exact", head: true })
              .eq("status", "done")
              .contains("assigned_to", [worker.profile_id]);

            teamMembers.push({
              id: worker.id,
              name: profile?.full_name || profile?.email || "Pracownik",
              role:
                member.role === "leader"
                  ? TeamUserRole.ADMIN
                  : TeamUserRole.WORKER,
              isAvailable: worker.is_available ?? true,
              completedTasksCount:
                (completedTeamTasks || 0) + (worker.completed_jobs || 0),
              phone: worker.phone || undefined,
              email: profile?.email || undefined,
              avatar: worker.avatar_url || profile?.avatar_url || undefined,
              specialization:
                member.team_specialization ||
                worker.specialization ||
                undefined,
              hourlyRate: worker.hourly_rate
                ? Number(worker.hourly_rate)
                : undefined,
            });
          }
        } else if (member.cleaning_company_id) {
          // Get cleaning company profile
          const { data: company } = await supabase
            .from("cleaning_companies")
            .select(
              `
              id,
              profile_id,
              company_name,
              phone,
              avatar_url,
              hourly_rate_min
            `
            )
            .eq("id", member.cleaning_company_id)
            .single();

          if (company) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email, avatar_url")
              .eq("id", company.profile_id)
              .single();

            // Count completed team tasks for this company (profile_id in assigned_to array)
            const { count: completedTeamTasks } = await supabase
              .from("team_tasks")
              .select("id", { count: "exact", head: true })
              .eq("status", "done")
              .contains("assigned_to", [company.profile_id]);

            teamMembers.push({
              id: company.id,
              name: company.company_name || "Firma",
              role:
                member.role === "leader"
                  ? TeamUserRole.ADMIN
                  : TeamUserRole.WORKER,
              isAvailable: true,
              completedTasksCount: completedTeamTasks || 0,
              phone: company.phone || undefined,
              email: profile?.email || undefined,
              avatar: company.avatar_url || profile?.avatar_url || undefined,
              specialization: member.team_specialization || "Firma sprzątająca",
              hourlyRate: company.hourly_rate_min
                ? Number(company.hourly_rate_min)
                : undefined,
            });
          }
        }
      }

      // De-duplicate members (same worker/company can be in multiple teams)
      const uniqueMembers = teamMembers.filter(
        (member, index, self) =>
          index === self.findIndex((m) => m.id === member.id)
      );

      setUsers(uniqueMembers);
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast.error("Nie udało się pobrać członków zespołu");
    } finally {
      setIsLoading(false);
    }
  }, [selectedTeamId]);

  // Fetch team members when selectedTeamId changes
  useEffect(() => {
    if (selectedTeamId) {
      refreshTeamMembers();
    }
  }, [selectedTeamId, refreshTeamMembers]);

  // Sync with auth user - set current user as admin
  useEffect(() => {
    if (authUser) {
      const teamMember: TeamMember = {
        id: authUser.id,
        name: authUser.fullName || authUser.email || "Użytkownik",
        role:
          authUser.role === "employer"
            ? TeamUserRole.ADMIN
            : TeamUserRole.WORKER,
        isAvailable: true,
        completedTasksCount: 0,
        email: authUser.email,
        avatar: authUser.avatar_url || undefined,
      };
      setCurrentUser(teamMember);
    }
  }, [authUser?.id]);

  const toggleAvailability = () => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      isAvailable: !currentUser.isAvailable,
    };
    setCurrentUser(updatedUser);
    setUsers(users.map((u) => (u.id === currentUser.id ? updatedUser : u)));
  };

  // ================================================================
  // PROJECTS - Supabase Integration
  // ================================================================
  const refreshProjects = useCallback(async () => {
    if (!selectedTeamId) return;

    try {
      const { data, error } = await supabase
        .from("team_projects")
        .select("*")
        .eq("team_id", selectedTeamId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mappedProjects: Project[] = (data || []).map((p) => ({
        id: p.id,
        title: p.title,
        clientName: p.client_name || "",
        street: p.street || "",
        houseNumber: p.house_number || "",
        postalCode: p.postal_code || "",
        city: p.city || "",
        description: p.description || "",
        tasks: [], // Tasks loaded separately
        startDate: p.start_date || new Date().toISOString(),
        endDate: p.end_date || undefined,
        status: (p.status as "ACTIVE" | "COMPLETED" | "ARCHIVED") || "ACTIVE",
      }));

      setProjects(mappedProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  }, [selectedTeamId]);

  const addProject = async (project: Omit<Project, "id" | "tasks">) => {
    if (!selectedTeamId || !authUser?.id) {
      toast.error("Brak wybranego zespołu");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("team_projects")
        .insert({
          team_id: selectedTeamId,
          title: project.title,
          description: project.description,
          client_name: project.clientName,
          street: project.street,
          house_number: project.houseNumber,
          postal_code: project.postalCode,
          city: project.city,
          status: project.status || "ACTIVE",
          start_date: project.startDate,
          end_date: project.endDate || null,
          created_by: authUser.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Projekt utworzony");
      await refreshProjects();
    } catch (error) {
      console.error("Error adding project:", error);
      toast.error("Nie udało się utworzyć projektu");
    }
  };

  const updateProject = async (project: Project) => {
    try {
      const { error } = await supabase
        .from("team_projects")
        .update({
          title: project.title,
          description: project.description,
          client_name: project.clientName,
          street: project.street,
          house_number: project.houseNumber,
          postal_code: project.postalCode,
          city: project.city,
          status: project.status,
          start_date: project.startDate,
          end_date: project.endDate || null,
        })
        .eq("id", project.id);

      if (error) throw error;

      toast.success("Projekt zaktualizowany");
      await refreshProjects();
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Nie udało się zaktualizować projektu");
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from("team_projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      toast.success("Projekt usunięty");
      await refreshProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Nie udało się usunąć projektu");
    }
  };

  // ================================================================
  // TASKS - Supabase Integration
  // ================================================================
  const refreshTasks = useCallback(
    async (projectId?: string) => {
      if (!selectedTeamId) return;

      try {
        let query = supabase
          .from("team_tasks")
          .select(
            `
          *,
          team_projects!inner(team_id)
        `
          )
          .eq("team_projects.team_id", selectedTeamId);

        if (projectId) {
          query = query.eq("project_id", projectId);
        }

        const { data, error } = await query.order("created_at", {
          ascending: false,
        });

        if (error) throw error;

        // Fetch comments and work logs for each task
        const mappedTasks: Task[] = await Promise.all(
          (data || []).map(async (t) => {
            // Get comments
            const { data: comments } = await supabase
              .from("team_task_comments")
              .select("id, user_id, comment, created_at, profiles(full_name)")
              .eq("task_id", t.id)
              .order("created_at", { ascending: true });

            // Get work logs
            const { data: workLogs } = await supabase
              .from("team_task_work_logs")
              .select("id, user_id, start_time, end_time, description")
              .eq("task_id", t.id)
              .order("start_time", { ascending: false });

            return {
              id: t.id,
              projectId: t.project_id,
              title: t.title,
              description: t.description || "",
              assignedToIds: t.assigned_to || [],
              status: (t.status?.toUpperCase() as TaskStatus) || TaskStatus.TODO,
              priority: (t.priority?.toUpperCase() as Priority) || Priority.MEDIUM,
              dueDate: t.due_date || new Date().toISOString(),
              estimatedHours: t.estimated_hours || undefined,
              toolsRequired: t.tools_required || [],
              materialsRequired: (t.materials_required as Material[]) || [],
              materialsUsed: [],
              comments: (comments || []).map((c) => ({
                id: c.id,
                userId: c.user_id,
                userName: (c.profiles as any)?.full_name || "Użytkownik",
                text: c.comment,
                timestamp: new Date(c.created_at).getTime(),
              })),
              photos: t.photos || [],
              workLogs: (workLogs || []).map((w) => ({
                id: w.id,
                userId: w.user_id,
                startTime: w.start_time,
                endTime: w.end_time || undefined,
                description: w.description || undefined,
              })),
            };
          })
        );

        setTasks(mappedTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    },
    [selectedTeamId]
  );

  const addTask = async (task: Omit<Task, "id" | "comments" | "workLogs">) => {
    if (!authUser?.id) {
      toast.error("Musisz być zalogowany");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("team_tasks")
        .insert({
          project_id: task.projectId,
          title: task.title,
          description: task.description,
          status: task.status.toLowerCase(),
          priority: task.priority.toLowerCase(),
          due_date: task.dueDate,
          estimated_hours: task.estimatedHours || null,
          assigned_to: task.assignedToIds,
          tools_required: task.toolsRequired,
          materials_required: task.materialsRequired,
          photos: task.photos || [],
          created_by: authUser.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Zadanie utworzone");
      await refreshTasks(task.projectId);
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Nie udało się utworzyć zadania");
    }
  };

  const updateTask = async (updatedTask: Task) => {
    try {
      const { error } = await supabase
        .from("team_tasks")
        .update({
          title: updatedTask.title,
          description: updatedTask.description,
          status: updatedTask.status.toLowerCase(),
          priority: updatedTask.priority.toLowerCase(),
          due_date: updatedTask.dueDate,
          estimated_hours: updatedTask.estimatedHours || null,
          assigned_to: updatedTask.assignedToIds,
          tools_required: updatedTask.toolsRequired,
          materials_required: updatedTask.materialsRequired,
          photos: updatedTask.photos || [],
          actual_hours:
            updatedTask.workLogs?.reduce((sum, w) => {
              if (w.endTime) {
                const start = new Date(w.startTime).getTime();
                const end = new Date(w.endTime).getTime();
                return sum + (end - start) / (1000 * 60 * 60);
              }
              return sum;
            }, 0) || null,
          completed_at:
            updatedTask.status === TaskStatus.DONE
              ? new Date().toISOString()
              : null,
        })
        .eq("id", updatedTask.id);

      if (error) throw error;

      toast.success("Zadanie zaktualizowane");
      await refreshTasks(updatedTask.projectId);
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Nie udało się zaktualizować zadania");
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("team_tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;

      toast.success("Zadanie usunięte");
      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Nie udało się usunąć zadania");
    }
  };

  // ================================================================
  // WORK LOGS - Supabase Integration
  // ================================================================
  const addWorkLog = async (taskId: string, workLog: Omit<WorkLog, "id">) => {
    if (!authUser?.id) return;

    try {
      const { error } = await supabase.from("team_task_work_logs").insert({
        task_id: taskId,
        user_id: authUser.id,
        start_time: workLog.startTime,
        end_time: workLog.endTime || null,
        description: workLog.description || null,
      });

      if (error) throw error;

      // Refresh tasks to get updated work logs
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        await refreshTasks(task.projectId);
      }
    } catch (error) {
      console.error("Error adding work log:", error);
      toast.error("Nie udało się dodać wpisu czasu pracy");
    }
  };

  const updateWorkLog = async (
    taskId: string,
    workLogId: string,
    endTime: string
  ) => {
    try {
      const startTime = tasks
        .find((t) => t.id === taskId)
        ?.workLogs.find((w) => w.id === workLogId)?.startTime;

      if (!startTime) return;

      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      const durationMinutes = Math.round((end - start) / (1000 * 60));

      const { error } = await supabase
        .from("team_task_work_logs")
        .update({
          end_time: endTime,
          duration_minutes: durationMinutes,
        })
        .eq("id", workLogId);

      if (error) throw error;

      // Refresh tasks to get updated work logs
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        await refreshTasks(task.projectId);
      }
    } catch (error) {
      console.error("Error updating work log:", error);
      toast.error("Nie udało się zaktualizować wpisu czasu pracy");
    }
  };

  // ================================================================
  // COMMENTS - Supabase Integration
  // ================================================================
  const addComment = async (taskId: string, text: string) => {
    if (!authUser?.id || !text.trim()) return;

    try {
      const { error } = await supabase.from("team_task_comments").insert({
        task_id: taskId,
        user_id: authUser.id,
        comment: text,
      });

      if (error) throw error;

      // Refresh tasks to get updated comments
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        await refreshTasks(task.projectId);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Nie udało się dodać komentarza");
    }
  };

  // ================================================================
  // CHAT - Supabase Integration with Real-time
  // ================================================================
  const refreshChatMessages = useCallback(async () => {
    if (!selectedTeamId) return;

    try {
      const { data, error } = await supabase
        .from("team_chat_messages")
        .select("*, profiles(full_name)")
        .eq("team_id", selectedTeamId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;

      const mappedMessages: ChatMessage[] = (data || []).map((m) => ({
        id: m.id,
        userId: m.sender_id,
        userName: (m.profiles as any)?.full_name || "Użytkownik",
        text: m.message,
        timestamp: new Date(m.created_at).getTime(),
      }));

      setChatMessages(mappedMessages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
    }
  }, [selectedTeamId]);

  const addChatMessage = async (text: string) => {
    if (!currentUser || !selectedTeamId) return;

    try {
      const { error } = await supabase.from("team_chat_messages").insert({
        team_id: selectedTeamId,
        sender_id: authUser?.id,
        message: text,
      });

      if (error) throw error;

      // Real-time will update, but we can add optimistically
      const optimisticMsg: ChatMessage = {
        id: Date.now().toString(),
        userId: currentUser.id,
        userName: currentUser.name,
        text,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, optimisticMsg]);
    } catch (error) {
      console.error("Error sending chat message:", error);
      toast.error("Nie udało się wysłać wiadomości");
    }
  };

  // Real-time subscription for chat
  useEffect(() => {
    if (!selectedTeamId) return;

    const channel = supabase
      .channel(`team-chat-${selectedTeamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_chat_messages",
          filter: `team_id=eq.${selectedTeamId}`,
        },
        async (payload) => {
          // Don't duplicate if it's our own message
          if (payload.new.sender_id === authUser?.id) return;

          // Fetch sender name
          const { data: profile } = await supabase
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
  }, [selectedTeamId, authUser?.id]);

  // Real-time subscription for tasks (INSERT, UPDATE, DELETE)
  useEffect(() => {
    if (!selectedTeamId) return;

    const channel = supabase
      .channel(`team-tasks-${selectedTeamId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_tasks",
        },
        () => {
          // Refresh tasks when any change happens
          refreshTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTeamId, refreshTasks]);

  // Real-time subscription for projects (INSERT, UPDATE, DELETE)
  useEffect(() => {
    if (!selectedTeamId) return;

    const channel = supabase
      .channel(`team-projects-${selectedTeamId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_projects",
          filter: `team_id=eq.${selectedTeamId}`,
        },
        () => {
          // Refresh projects when any change happens
          refreshProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTeamId, refreshProjects]);

  // Load data when team is selected
  useEffect(() => {
    if (selectedTeamId) {
      refreshProjects();
      refreshTasks();
      refreshChatMessages();
    }
  }, [selectedTeamId, refreshProjects, refreshTasks, refreshChatMessages]);

  // ================================================================
  // LOCAL STATE OPERATIONS (Templates, Users)
  // ================================================================

  const addUser = (user: TeamMember) => setUsers([...users, user]);

  const updateUser = (user: TeamMember) => {
    setUsers(users.map((u) => (u.id === user.id ? user : u)));
    if (currentUser?.id === user.id) setCurrentUser(user);
  };

  const deleteUser = (userId: string) => {
    setUsers(users.filter((u) => u.id !== userId));
  };

  const addTaskTemplate = (template: TaskTemplate) => {
    setTaskTemplates([...taskTemplates, template]);
  };

  const updateTaskTemplate = (template: TaskTemplate) => {
    setTaskTemplates(
      taskTemplates.map((t) => (t.id === template.id ? template : t))
    );
  };

  const deleteTaskTemplate = (id: string) => {
    setTaskTemplates(taskTemplates.filter((t) => t.id !== id));
  };

  const t = (key: keyof typeof teamTranslations.pl) => {
    return teamTranslations[language][key] || key;
  };

  return (
    <TeamStoreContext.Provider
      value={{
        currentUser,
        users,
        projects,
        tasks,
        taskTemplates,
        chatMessages,
        language,
        isLoading,
        selectedTeamId,
        setSelectedTeamId,
        setLanguage,
        toggleAvailability,
        addProject,
        updateProject,
        deleteProject,
        addTask,
        updateTask,
        deleteTask,
        addWorkLog,
        updateWorkLog,
        addComment,
        addChatMessage,
        addUser,
        updateUser,
        deleteUser,
        addTaskTemplate,
        updateTaskTemplate,
        deleteTaskTemplate,
        refreshTeamMembers,
        refreshProjects,
        refreshTasks,
        refreshChatMessages,
        t,
      }}
    >
      {children}
    </TeamStoreContext.Provider>
  );
};

export const useTeamStore = () => {
  const context = useContext(TeamStoreContext);
  if (!context)
    throw new Error("useTeamStore must be used within TeamStoreProvider");
  return context;
};

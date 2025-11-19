import { useState, useEffect } from "react";
import { supabase as supabaseRaw } from "../src/lib/supabase";
import { useAuth } from "../contexts/AuthContext";

// Types matching communication_projects table structure
export interface Project {
  id: string;
  name: string; // communication_projects uses 'name' not 'title'
  description?: string;
  employer_id?: string;
  employer_name?: string;
  status: string;
  created_by: string; // communication_projects uses 'created_by' not 'owner_id'
  created_at: string;
  updated_at: string;
  project_members?: any;
  assigned_accountants?: any;
  assigned_workers?: any;
  project_type?: string;
  location_address?: string;
  location_coordinates?: any;
  start_date?: string;
  end_date?: string;
  budget?: number;
  default_language?: string;
  communication_channels?: any;
  max_members?: number;
  allow_worker_invite?: boolean;
  require_approval?: boolean;
}

export interface ProjectPermission {
  id: string;
  project_id: string;
  user_id: string;
  permissions: string[];
  role_title: string;
  granted_by: string;
  granted_at: string;
  is_active: boolean;
}

export interface ActivityLogEntry {
  id: string;
  project_id: string;
  user_id: string;
  activity_type: string;
  description?: string;
  details?: any;
  created_at: string;
}

export interface ProjectNotification {
  id: string;
  project_id: string;
  user_id: string;
  notification_type: string;
  title: string;
  message: string;
  action_url?: string;
  status: "unread" | "read" | "archived" | "dismissed";
  priority: number;
  created_at: string;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalMembers: number;
  recentActivities: number;
  unreadNotifications: number;
}

export function useTeamDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [projects, setProjects] = useState<Project[]>([]);
  const [permissions, setPermissions] = useState<ProjectPermission[]>([]);
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [notifications, setNotifications] = useState<ProjectNotification[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    totalMembers: 0,
    recentActivities: 0,
    unreadNotifications: 0,
  });

  const fetchProjects = async () => {
    if (!user?.id) return;

    try {
      console.log("🔍 Fetching projects for user:", user.id);

      // ✅ FIX: Use 'communication_projects' - correct table that exists in database
      const { data: projectsData, error: projectsError } = await supabaseRaw
        .from("communication_projects")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (projectsError) {
        console.error("Projects query error:", projectsError);
        throw projectsError;
      }

      console.log("✅ Projects fetched:", projectsData?.length || 0);

      setProjects(projectsData || []);

      // Calculate basic stats
      const activeCount = (projectsData || []).filter(
        (p: any) => p.status === "active"
      ).length;

      setStats((prev) => ({
        ...prev,
        totalProjects: (projectsData || []).length,
        activeProjects: activeCount,
      }));
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Błąd podczas ładowania projektów");
    }
  };

  const fetchPermissions = async () => {
    if (!user?.id || projects.length === 0) return;

    try {
      console.log(
        "🔍 Fetching permissions for projects:",
        projects.map((p) => p.id)
      );

      const projectIds = projects.map((p) => p.id);

      const { data: permissionsData, error: permissionsError } =
        await supabaseRaw
          .from("project_permissions")
          .select("*")
          .in("project_id", projectIds)
          .eq("is_active", true);

      if (permissionsError) {
        console.error("Permissions query error:", permissionsError);
        throw permissionsError;
      }

      console.log("✅ Permissions fetched:", permissionsData?.length || 0);
      setPermissions(permissionsData || []);

      // Count unique team members
      const uniqueMembers = new Set(
        (permissionsData || []).map((p: any) => p.user_id)
      );
      setStats((prev) => ({
        ...prev,
        totalMembers: uniqueMembers.size,
      }));
    } catch (err) {
      console.error("Error fetching permissions:", err);
    }
  };

  const fetchActivities = async () => {
    if (!user?.id || projects.length === 0) return;

    try {
      console.log("🔍 Fetching activities...");

      const projectIds = projects.map((p) => p.id);

      const { data: activitiesData, error: activitiesError } = await supabaseRaw
        .from("project_activity_log")
        .select("*")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false })
        .limit(10);

      if (activitiesError) {
        console.error("Activities query error:", activitiesError);
        // Don't throw - this table might not exist yet
        return;
      }

      console.log("✅ Activities fetched:", activitiesData?.length || 0);
      setActivities(activitiesData || []);

      setStats((prev) => ({
        ...prev,
        recentActivities: activitiesData?.length || 0,
      }));
    } catch (err) {
      console.error("Error fetching activities:", err);
    }
  };

  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      console.log("🔍 Fetching notifications...");

      const { data: notificationsData, error: notificationsError } =
        await supabaseRaw
          .from("project_notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

      if (notificationsError) {
        console.error("Notifications query error:", notificationsError);
        // Don't throw - this table might not exist yet
        return;
      }

      console.log("✅ Notifications fetched:", notificationsData?.length || 0);
      setNotifications(notificationsData || []);

      const unreadCount = (notificationsData || []).filter(
        (n: any) => n.status === "unread"
      ).length;
      setStats((prev) => ({
        ...prev,
        unreadNotifications: unreadCount,
      }));
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabaseRaw
        .from("project_notifications")
        .update({
          status: "read",
          read_at: new Date().toISOString(),
        })
        .eq("id", notificationId);

      if (error) throw error;

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, status: "read" as const } : n
        )
      );

      // Update stats
      setStats((prev) => ({
        ...prev,
        unreadNotifications: Math.max(0, prev.unreadNotifications - 1),
      }));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // Main data loading effect
  useEffect(() => {
    async function loadDashboardData() {
      if (!user?.id) return;

      setLoading(true);
      setError(null);

      try {
        await fetchProjects();
      } catch (err) {
        setError("Błąd podczas ładowania danych");
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user?.id]);

  // Secondary data loading after projects are loaded
  useEffect(() => {
    if (projects.length > 0) {
      fetchPermissions();
      fetchActivities();
    }
  }, [projects]);

  // Load notifications independently
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id]);

  return {
    // Data
    projects,
    permissions,
    activities,
    notifications,
    stats,

    // States
    loading,
    error,

    // Actions
    markNotificationAsRead,
    refetch: () => {
      fetchProjects();
      fetchNotifications();
    },
  };
}

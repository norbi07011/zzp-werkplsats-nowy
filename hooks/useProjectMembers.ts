import { useState, useEffect } from "react";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export interface TeamMember {
  id: string;
  project_id: string;
  user_id: string;
  profile_id?: string | null;
  role: string; // role from database (e.g., "supervisor", "owner", "admin", etc.)
  display_name?: string | null;
  avatar_url?: string | null;
  user_type?: string | null;
  can_invite: boolean;
  can_manage_project: boolean;
  can_view_reports: boolean;
  joined_at: string;
  last_active: string;
  accountant_id?: string | null;
  // ✅ ADDED: Missing fields used in TeamMembers.tsx
  permissions?: string[];
  is_active?: boolean;
}

export interface TeamPermission {
  id: string;
  project_id: string;
  user_id: string;
  permission_type: string;
  resource_type?: string;
  resource_id?: string;
  granted_by: string;
  granted_at: string;
}

export interface TeamAvailability {
  id: string;
  user_id: string;
  date: string;
  status: "available" | "busy" | "off" | "vacation";
  start_time?: string;
  end_time?: string;
  notes?: string;
}

export function useProjectMembers(projectId?: string) {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch team members
  const fetchMembers = async () => {
    if (!projectId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("project_members")
        .select("*")
        .eq("project_id", projectId)
        .order("joined_at", { ascending: false });

      if (fetchError) throw fetchError;
      setMembers(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching members:", err);
    } finally {
      setLoading(false);
    }
  };

  // Add team member
  const addMember = async (userId: string, role: string = "member") => {
    try {
      const { data, error: createError } = await supabase
        .from("project_members")
        .insert([
          {
            project_id: projectId,
            user_id: userId,
            role: role,
            can_invite: false,
            can_manage_project: false,
            can_view_reports: false,
          },
        ])
        .select()
        .single();

      if (createError) throw createError;

      setMembers((prev) => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Update member role
  const updateMemberRole = async (
    memberId: string,
    role: string,
    canInvite: boolean = false,
    canManageProject: boolean = false,
    canViewReports: boolean = false
  ) => {
    try {
      const { data, error: updateError } = await supabase
        .from("project_members")
        .update({
          role: role,
          can_invite: canInvite,
          can_manage_project: canManageProject,
          can_view_reports: canViewReports,
        })
        .eq("id", memberId)
        .select()
        .single();

      if (updateError) throw updateError;

      setMembers((prev) => prev.map((m) => (m.id === memberId ? data : m)));
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Remove member
  const removeMember = async (memberId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("project_members")
        .delete()
        .eq("id", memberId);

      if (deleteError) throw deleteError;

      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Fetch permissions for user
  const fetchUserPermissions = async (userId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from("team_permissions")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", userId);

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err: any) {
      console.error("Error fetching permissions:", err);
      return [];
    }
  };

  // Grant permission
  const grantPermission = async (
    userId: string,
    permissionType: string,
    resourceType?: string,
    resourceId?: string
  ) => {
    try {
      const { data, error: createError } = await supabase
        .from("team_permissions")
        .insert([
          {
            project_id: projectId,
            user_id: userId,
            permission_type: permissionType,
            resource_type: resourceType,
            resource_id: resourceId,
            granted_by: user?.id,
          },
        ])
        .select()
        .single();

      if (createError) throw createError;
      return data;
    } catch (err: any) {
      console.error("Error granting permission:", err);
      throw err;
    }
  };

  // Revoke permission
  const revokePermission = async (permissionId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("team_permissions")
        .delete()
        .eq("id", permissionId);

      if (deleteError) throw deleteError;
    } catch (err: any) {
      console.error("Error revoking permission:", err);
      throw err;
    }
  };

  // Fetch availability
  const fetchAvailability = async (
    userId: string,
    startDate: string,
    endDate: string
  ) => {
    try {
      const { data, error: fetchError } = await supabase
        .from("team_availability")
        .select("*")
        .eq("user_id", userId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err: any) {
      console.error("Error fetching availability:", err);
      return [];
    }
  };

  // Set availability
  const setAvailability = async (
    date: string,
    status: "available" | "busy" | "off" | "vacation",
    startTime?: string,
    endTime?: string,
    notes?: string
  ) => {
    try {
      const { data, error: upsertError } = await supabase
        .from("team_availability")
        .upsert([
          {
            user_id: user?.id,
            date: date,
            status: status,
            start_time: startTime,
            end_time: endTime,
            notes: notes,
          },
        ])
        .select()
        .single();

      if (upsertError) throw upsertError;
      return data;
    } catch (err: any) {
      console.error("Error setting availability:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  return {
    members,
    loading,
    error,
    fetchMembers,
    addMember,
    updateMemberRole,
    removeMember,
  };
}

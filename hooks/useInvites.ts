import { useState, useEffect } from "react";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export type InviteStatus = "pending" | "accepted" | "rejected" | "expired";

export interface ProjectInvite {
  id: string;
  project_id: string;
  inviter_id: string;
  invitee_email: string;
  invitee_id?: string | null;
  role: string;
  status: InviteStatus;
  can_invite: boolean;
  can_manage_project: boolean;
  can_view_reports: boolean;
  invite_message?: string | null;
  invite_token?: string | null;
  created_at: string;
  expires_at: string;
  accepted_at?: string | null;
  rejected_at?: string | null;
  metadata?: any;
}

export interface CreateInviteData {
  projectId: string;
  inviteeEmail: string;
  role?: string;
  canInvite?: boolean;
  canManageProject?: boolean;
  canViewReports?: boolean;
  inviteMessage?: string;
  metadata?: any;
}

export function useInvites(projectId?: string) {
  const { user } = useAuth();
  const [sentInvites, setSentInvites] = useState<ProjectInvite[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<ProjectInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sent invites (invites I sent)
  const fetchSentInvites = async () => {
    if (!user?.id) {
      setSentInvites([]);
      return;
    }

    try {
      const query = supabase
        .from("project_invites")
        .select("*")
        .eq("inviter_id", user.id)
        .order("created_at", { ascending: false });

      if (projectId) {
        query.eq("project_id", projectId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setSentInvites(data || []);
    } catch (err: any) {
      console.error("Error fetching sent invites:", err);
      setError(err.message);
    }
  };

  // Fetch received invites (invites sent to me)
  const fetchReceivedInvites = async () => {
    if (!user?.id || !user?.email) {
      setReceivedInvites([]);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from("project_invites")
        .select("*")
        .or(`invitee_email.eq.${user.email},invitee_id.eq.${user.id}`)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setReceivedInvites(data || []);
    } catch (err: any) {
      console.error("Error fetching received invites:", err);
      setError(err.message);
    }
  };

  // Create a new invite
  const createInvite = async ({
    projectId: inviteProjectId,
    inviteeEmail,
    role = "member",
    canInvite = false,
    canManageProject = false,
    canViewReports = false,
    inviteMessage,
    metadata,
  }: CreateInviteData) => {
    try {
      // Generate invite token
      const { data: tokenData } = await supabase.rpc("generate_invite_token");
      const inviteToken =
        tokenData ||
        `invite_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const { data, error: createError } = await supabase
        .from("project_invites")
        .insert([
          {
            project_id: inviteProjectId,
            inviter_id: user?.id,
            invitee_email: inviteeEmail.toLowerCase(),
            role: role,
            can_invite: canInvite,
            can_manage_project: canManageProject,
            can_view_reports: canViewReports,
            invite_message: inviteMessage,
            invite_token: inviteToken,
            status: "pending",
            metadata: metadata || null,
          },
        ])
        .select()
        .single();

      if (createError) throw createError;

      // Update local state
      setSentInvites((prev) => [data, ...prev]);

      // TODO: Send email notification (Resend integration)
      console.log("📧 Email notification would be sent to:", inviteeEmail);

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Accept an invite
  const acceptInvite = async (inviteId: string) => {
    try {
      const { data, error: updateError } = await supabase
        .from("project_invites")
        .update({
          status: "accepted",
          invitee_id: user?.id,
          accepted_at: new Date().toISOString(),
        })
        .eq("id", inviteId)
        .eq("status", "pending") // Only accept if still pending
        .select()
        .single();

      if (updateError) throw updateError;

      // Remove from received invites
      setReceivedInvites((prev) => prev.filter((inv) => inv.id !== inviteId));

      // Trigger to auto-add to project_members happens in database

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Reject an invite
  const rejectInvite = async (inviteId: string) => {
    try {
      const { data, error: updateError } = await supabase
        .from("project_invites")
        .update({
          status: "rejected",
          rejected_at: new Date().toISOString(),
        })
        .eq("id", inviteId)
        .eq("status", "pending")
        .select()
        .single();

      if (updateError) throw updateError;

      // Remove from received invites
      setReceivedInvites((prev) => prev.filter((inv) => inv.id !== inviteId));

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Cancel an invite (delete)
  const cancelInvite = async (inviteId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("project_invites")
        .delete()
        .eq("id", inviteId)
        .eq("inviter_id", user?.id); // Only delete if you sent it

      if (deleteError) throw deleteError;

      // Remove from sent invites
      setSentInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Resend an invite
  const resendInvite = async (inviteId: string) => {
    try {
      // Update expires_at to extend the invitation
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7);

      const { data, error: updateError } = await supabase
        .from("project_invites")
        .update({
          expires_at: newExpiresAt.toISOString(),
        })
        .eq("id", inviteId)
        .eq("inviter_id", user?.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state
      setSentInvites((prev) =>
        prev.map((inv) => (inv.id === inviteId ? data : inv))
      );

      // TODO: Resend email notification
      console.log("📧 Email notification would be resent");

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Get pending invites count for a project
  const getPendingInvitesCount = async (
    checkProjectId: string
  ): Promise<number> => {
    try {
      const { count, error: countError } = await supabase
        .from("project_invites")
        .select("*", { count: "exact", head: true })
        .eq("project_id", checkProjectId)
        .eq("status", "pending");

      if (countError) throw countError;
      return count || 0;
    } catch (err: any) {
      console.error("Error counting invites:", err);
      return 0;
    }
  };

  // Setup realtime subscription for invites
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("project_invites_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_invites",
          filter: `inviter_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Invite change (sent):", payload);
          fetchSentInvites();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_invites",
          filter: `invitee_email=eq.${user.email}`,
        },
        (payload) => {
          console.log("Invite change (received):", payload);
          fetchReceivedInvites();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.email]);

  // Initial fetch
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([fetchSentInvites(), fetchReceivedInvites()]);
      setLoading(false);
    };

    fetchAll();
  }, [projectId, user?.id]);

  return {
    sentInvites,
    receivedInvites,
    loading,
    error,
    createInvite,
    acceptInvite,
    rejectInvite,
    cancelInvite,
    resendInvite,
    getPendingInvitesCount,
    refreshInvites: () => {
      fetchSentInvites();
      fetchReceivedInvites();
    },
  };
}

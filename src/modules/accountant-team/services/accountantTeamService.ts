/**
 * Accountant Team Service
 * Serwis do zarządzania zespołami księgowych
 * Wzorowany na employerTeamService.ts
 */

import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

// ============================================================================
// TYPES
// ============================================================================

type AccountantTeam = Database["public"]["Tables"]["accountant_teams"]["Row"];
type AccountantTeamInsert =
  Database["public"]["Tables"]["accountant_teams"]["Insert"];
type AccountantTeamUpdate =
  Database["public"]["Tables"]["accountant_teams"]["Update"];

type AccountantTeamMember =
  Database["public"]["Tables"]["accountant_team_members"]["Row"];
type AccountantTeamMemberInsert =
  Database["public"]["Tables"]["accountant_team_members"]["Insert"];

type AccountantTeamInvitation =
  Database["public"]["Tables"]["accountant_team_invitations"]["Row"];
type AccountantTeamInvitationInsert =
  Database["public"]["Tables"]["accountant_team_invitations"]["Insert"];

type AccountantTeamTask =
  Database["public"]["Tables"]["accountant_team_tasks"]["Row"];
type AccountantTeamTaskInsert =
  Database["public"]["Tables"]["accountant_team_tasks"]["Insert"];
type AccountantTeamTaskUpdate =
  Database["public"]["Tables"]["accountant_team_tasks"]["Update"];

type AccountantTeamMessage =
  Database["public"]["Tables"]["accountant_team_messages"]["Row"];
type AccountantTeamMessageInsert =
  Database["public"]["Tables"]["accountant_team_messages"]["Insert"];

type AccountantTeamEvent =
  Database["public"]["Tables"]["accountant_team_events"]["Row"];
type AccountantTeamEventInsert =
  Database["public"]["Tables"]["accountant_team_events"]["Insert"];
type AccountantTeamEventUpdate =
  Database["public"]["Tables"]["accountant_team_events"]["Update"];

// Channel types
export interface AccountantTeamChannel {
  id: string;
  team_id: string;
  name: string;
  description: string | null;
  type: "public" | "private" | "group";
  color: string;
  created_by: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

// Extended types with relations
export interface AccountantTeamWithMembers extends AccountantTeam {
  member_count: number;
  members?: AccountantTeamMemberWithProfile[];
  owner?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface AccountantTeamMemberWithProfile extends AccountantTeamMember {
  accountant: {
    id: string;
    profile_id: string;
    full_name: string | null;
    specializations: string[] | null;
    avatar_url: string | null;
    email?: string;
  };
}

export interface AccountantTeamInvitationWithDetails
  extends AccountantTeamInvitation {
  team: {
    id: string;
    name: string;
    color_hex: string | null;
    avatar_url: string | null;
  };
  inviter: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  invited_accountant?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface AccountantTeamTaskWithAssignee extends AccountantTeamTask {
  assignee?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  creator?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface AccountantTeamMessageWithSender extends AccountantTeamMessage {
  sender: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

// ============================================================================
// TEAMS CRUD
// ============================================================================

/**
 * Pobierz zespoły dla księgowego
 */
export async function getAccountantTeams(
  accountantId: string
): Promise<AccountantTeamWithMembers[]> {
  console.log(
    "🔍 [ACCOUNTANT-TEAM] Fetching teams for accountant:",
    accountantId
  );

  const { data, error } = await supabase
    .from("accountant_teams")
    .select(
      `
      *,
      accountant_team_memberships!inner (
        accountant_id
      )
    `
    )
    .eq("accountant_team_memberships.accountant_id", accountantId)
    .eq("accountant_team_memberships.status", "active")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error fetching teams:", error);
    throw new Error(`Failed to fetch teams: ${error.message}`);
  }

  // Count members for each team
  const teamsWithCount = await Promise.all(
    (data || []).map(async (team) => {
      const { count } = await supabase
        .from("accountant_team_memberships" as any)
        .select("*", { count: "exact", head: true })
        .eq("team_id", team.id)
        .eq("status", "active");

      return {
        ...team,
        member_count: count || 0,
      } as AccountantTeamWithMembers;
    })
  );

  console.log("✅ [ACCOUNTANT-TEAM] Found teams:", teamsWithCount.length);
  return teamsWithCount;
}

/**
 * Pobierz szczegóły zespołu
 */
export async function getTeamDetails(
  teamId: string
): Promise<AccountantTeamWithMembers | null> {
  console.log("🔍 [ACCOUNTANT-TEAM] Fetching team details:", teamId);

  const { data: team, error } = await supabase
    .from("accountant_teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error fetching team:", error);
    return null;
  }

  // Get members
  const { data: members } = await supabase
    .from("accountant_team_members")
    .select(
      `
      *,
      accountant:accountants (
        id,
        profile_id,
        full_name,
        specializations,
        avatar_url
      )
    `
    )
    .eq("team_id", teamId)
    .eq("status", "active");

  // Get member count
  const { count } = await supabase
    .from("accountant_team_members")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId)
    .eq("status", "active");

  return {
    ...team,
    member_count: count || 0,
    members: members as AccountantTeamMemberWithProfile[],
  };
}

/**
 * Stwórz nowy zespół
 */
export async function createTeam(
  ownerId: string,
  name: string,
  description?: string,
  colorHex?: string
): Promise<AccountantTeam> {
  console.log("➕ [ACCOUNTANT-TEAM] Creating team:", { ownerId, name });

  const { data, error } = await supabase
    .from("accountant_teams")
    .insert({
      owner_id: ownerId,
      name,
      description: description || null,
      color_hex: colorHex || "#6366F1",
    })
    .select()
    .single();

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error creating team:", error);
    throw new Error(`Failed to create team: ${error.message}`);
  }

  console.log("✅ [ACCOUNTANT-TEAM] Team created:", data.id);
  return data;
}

/**
 * Aktualizuj zespół
 */
export async function updateTeam(
  teamId: string,
  updates: AccountantTeamUpdate
): Promise<AccountantTeam> {
  console.log("✏️ [ACCOUNTANT-TEAM] Updating team:", teamId);

  const { data, error } = await supabase
    .from("accountant_teams")
    .update(updates)
    .eq("id", teamId)
    .select()
    .single();

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error updating team:", error);
    throw new Error(`Failed to update team: ${error.message}`);
  }

  console.log("✅ [ACCOUNTANT-TEAM] Team updated");
  return data;
}

/**
 * Usuń zespół (soft delete - is_active = false)
 */
export async function deleteTeam(teamId: string): Promise<void> {
  console.log("🗑️ [ACCOUNTANT-TEAM] Deleting team:", teamId);

  const { error } = await supabase
    .from("accountant_teams")
    .update({ is_active: false })
    .eq("id", teamId);

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error deleting team:", error);
    throw new Error(`Failed to delete team: ${error.message}`);
  }

  console.log("✅ [ACCOUNTANT-TEAM] Team deleted (soft)");
}

// ============================================================================
// MEMBERS
// ============================================================================

/**
 * Pobierz członków zespołu
 */
export async function getTeamMembers(
  teamId: string
): Promise<AccountantTeamMemberWithProfile[]> {
  console.log("🔍 [ACCOUNTANT-TEAM] Fetching members for team:", teamId);

  const { data, error } = await supabase
    .from("accountant_team_members")
    .select(
      `
      *,
      accountant:accountants (
        id,
        profile_id,
        full_name,
        specializations,
        avatar_url
      )
    `
    )
    .eq("team_id", teamId)
    .eq("status", "active")
    .order("role", { ascending: true })
    .order("joined_at", { ascending: true });

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error fetching members:", error);
    throw new Error(`Failed to fetch members: ${error.message}`);
  }

  console.log("✅ [ACCOUNTANT-TEAM] Found members:", data?.length || 0);
  return (data || []) as AccountantTeamMemberWithProfile[];
}

/**
 * Pobierz członków zespołu z nowej tabeli accountant_team_memberships
 * Zwraca członków z pełnymi profilami
 */
export interface TeamMembershipWithProfile {
  id: string;
  team_id: string;
  accountant_id: string;
  role: string;
  status: string;
  joined_at: string | null;
  accountant?: {
    id: string;
    profile_id: string;
    profiles?: {
      id: string;
      full_name: string | null;
      email: string | null;
      avatar_url: string | null;
    };
  };
}

export async function getTeamMemberships(
  teamId: string
): Promise<TeamMembershipWithProfile[]> {
  console.log("🔍 [ACCOUNTANT-TEAM] Fetching memberships for team:", teamId);

  const { data, error } = await supabase
    .from("accountant_team_memberships" as any)
    .select(
      `
      id,
      team_id,
      accountant_id,
      role,
      status,
      joined_at,
      accountant:accountants (
        id,
        profile_id,
        profiles (
          id,
          full_name,
          email,
          avatar_url
        )
      )
    `
    )
    .eq("team_id", teamId)
    .eq("status", "active")
    .order("role", { ascending: true });

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error fetching memberships:", error);
    throw new Error(`Failed to fetch memberships: ${error.message}`);
  }

  console.log("✅ [ACCOUNTANT-TEAM] Found memberships:", data?.length || 0);
  return (data || []) as unknown as TeamMembershipWithProfile[];
}

/**
 * Usuń członka z zespołu
 */
export async function removeMember(memberId: string): Promise<void> {
  console.log("🚫 [ACCOUNTANT-TEAM] Removing member:", memberId);

  const { error } = await supabase
    .from("accountant_team_members")
    .update({ status: "inactive", left_at: new Date().toISOString() })
    .eq("id", memberId);

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error removing member:", error);
    throw new Error(`Failed to remove member: ${error.message}`);
  }

  console.log("✅ [ACCOUNTANT-TEAM] Member removed");
}

/**
 * Zmień rolę członka
 */
export async function updateMemberRole(
  memberId: string,
  newRole: "owner" | "admin" | "member" | "viewer"
): Promise<void> {
  console.log("🔄 [ACCOUNTANT-TEAM] Updating member role:", {
    memberId,
    newRole,
  });

  const { error } = await supabase
    .from("accountant_team_members")
    .update({ role: newRole })
    .eq("id", memberId);

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error updating role:", error);
    throw new Error(`Failed to update role: ${error.message}`);
  }

  console.log("✅ [ACCOUNTANT-TEAM] Role updated");
}

/**
 * Opuść zespół
 */
export async function leaveTeam(
  teamId: string,
  accountantId: string
): Promise<void> {
  console.log("🚪 [ACCOUNTANT-TEAM] Leaving team:", { teamId, accountantId });

  const { error } = await supabase
    .from("accountant_team_members")
    .update({ status: "inactive", left_at: new Date().toISOString() })
    .eq("team_id", teamId)
    .eq("accountant_id", accountantId);

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error leaving team:", error);
    throw new Error(`Failed to leave team: ${error.message}`);
  }

  console.log("✅ [ACCOUNTANT-TEAM] Left team");
}

// ============================================================================
// INVITATIONS
// ============================================================================

/**
 * Wyślij zaproszenie do zespołu
 */
export async function sendInvitation(
  teamId: string,
  invitedById: string,
  invitedEmail: string,
  message?: string,
  proposedRole?: "admin" | "member" | "viewer"
): Promise<AccountantTeamInvitation> {
  console.log("📨 [ACCOUNTANT-TEAM] Sending invitation:", {
    teamId,
    invitedEmail,
  });

  // Check if accountant with this email exists
  const { data: existingAccountant } = await supabase
    .from("accountants")
    .select("id, profile_id")
    .eq("email", invitedEmail.toLowerCase())
    .single();

  // Check for existing pending invitation
  const { data: existingInvitation } = await supabase
    .from("accountant_team_invitations")
    .select("id")
    .eq("team_id", teamId)
    .eq("invited_email", invitedEmail.toLowerCase())
    .eq("status", "pending")
    .single();

  if (existingInvitation) {
    throw new Error("Zaproszenie do tego księgowego już istnieje");
  }

  // Check if already a member
  if (existingAccountant) {
    const { data: existingMember } = await supabase
      .from("accountant_team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("accountant_id", existingAccountant.id)
      .eq("status", "active")
      .single();

    if (existingMember) {
      throw new Error("Ten księgowy jest już członkiem zespołu");
    }
  }

  const { data, error } = await supabase
    .from("accountant_team_invitations")
    .insert({
      team_id: teamId,
      invited_by: invitedById,
      invited_email: invitedEmail.toLowerCase(),
      invited_accountant_id: existingAccountant?.id || null,
      message: message || null,
      proposed_role: proposedRole || "member",
    })
    .select()
    .single();

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error sending invitation:", error);
    throw new Error(`Failed to send invitation: ${error.message}`);
  }

  console.log("✅ [ACCOUNTANT-TEAM] Invitation sent:", data.id);
  return data;
}

/**
 * Pobierz wysłane zaproszenia zespołu
 */
export async function getSentInvitations(
  teamId: string
): Promise<AccountantTeamInvitationWithDetails[]> {
  console.log(
    "🔍 [ACCOUNTANT-TEAM] Fetching sent invitations for team:",
    teamId
  );

  const { data, error } = await supabase
    .from("accountant_team_invitations")
    .select(
      `
      *,
      team:accountant_teams (id, name, color_hex, avatar_url),
      inviter:profiles!accountant_team_invitations_invited_by_fkey (id, full_name, avatar_url)
    `
    )
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error fetching invitations:", error);
    throw new Error(`Failed to fetch invitations: ${error.message}`);
  }

  console.log("✅ [ACCOUNTANT-TEAM] Found invitations:", data?.length || 0);
  return (data || []) as AccountantTeamInvitationWithDetails[];
}

/**
 * Pobierz otrzymane zaproszenia dla księgowego
 */
export async function getReceivedInvitations(
  accountantId: string
): Promise<AccountantTeamInvitationWithDetails[]> {
  console.log(
    "🔍 [ACCOUNTANT-TEAM] Fetching received invitations for:",
    accountantId
  );

  const { data, error } = await supabase
    .from("accountant_team_invitations")
    .select(
      `
      *,
      team:accountant_teams (id, name, color_hex, avatar_url),
      inviter:profiles!accountant_team_invitations_invited_by_fkey (id, full_name, avatar_url)
    `
    )
    .eq("invited_accountant_id", accountantId)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error fetching invitations:", error);
    throw new Error(`Failed to fetch invitations: ${error.message}`);
  }

  console.log("✅ [ACCOUNTANT-TEAM] Found invitations:", data?.length || 0);
  return (data || []) as AccountantTeamInvitationWithDetails[];
}

/**
 * Pobierz liczbę oczekujących zaproszeń
 */
export async function getPendingInvitationsCount(
  accountantId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("accountant_team_invitations")
    .select("*", { count: "exact", head: true })
    .eq("invited_accountant_id", accountantId)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString());

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error counting invitations:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Akceptuj zaproszenie
 */
export async function acceptInvitation(invitationId: string): Promise<void> {
  console.log("✅ [ACCOUNTANT-TEAM] Accepting invitation:", invitationId);

  // 1. Pobierz szczegóły zaproszenia
  const { data: invitation, error: fetchError } = await supabase
    .from("accountant_team_invitations")
    .select("*")
    .eq("id", invitationId)
    .eq("status", "pending")
    .single();

  if (fetchError || !invitation) {
    console.error(
      "❌ [ACCOUNTANT-TEAM] Error fetching invitation:",
      fetchError
    );
    throw new Error("Invitation not found or already processed");
  }

  // 2. Zaktualizuj status zaproszenia
  const { error: updateError } = await supabase
    .from("accountant_team_invitations")
    .update({
      status: "accepted",
      responded_at: new Date().toISOString(),
    })
    .eq("id", invitationId);

  if (updateError) {
    console.error(
      "❌ [ACCOUNTANT-TEAM] Error updating invitation:",
      updateError
    );
    throw new Error(`Failed to accept invitation: ${updateError.message}`);
  }

  // 3. Dodaj użytkownika do zespołu (accountant_team_memberships)
  // Note: Using raw query to bypass TypeScript type issues with new table
  const { error: membershipError } = await supabase
    .from("accountant_team_memberships" as any)
    .insert({
      team_id: invitation.team_id,
      accountant_id: invitation.invited_accountant_id,
      role: invitation.proposed_role || "member",
      status: "active",
      joined_at: new Date().toISOString(),
    } as any);

  if (membershipError) {
    console.error(
      "❌ [ACCOUNTANT-TEAM] Error creating membership:",
      membershipError
    );
    // Rollback - zmień status z powrotem na pending
    await supabase
      .from("accountant_team_invitations")
      .update({ status: "pending", responded_at: null })
      .eq("id", invitationId);
    throw new Error(`Failed to join team: ${membershipError.message}`);
  }

  console.log(
    "✅ [ACCOUNTANT-TEAM] Invitation accepted and membership created"
  );
}

/**
 * Odrzuć zaproszenie
 */
export async function declineInvitation(
  invitationId: string,
  reason?: string
): Promise<void> {
  console.log("❌ [ACCOUNTANT-TEAM] Declining invitation:", invitationId);

  const { error } = await supabase
    .from("accountant_team_invitations")
    .update({
      status: "declined",
      decline_reason: reason || null,
    })
    .eq("id", invitationId)
    .eq("status", "pending");

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error declining invitation:", error);
    throw new Error(`Failed to decline invitation: ${error.message}`);
  }

  console.log("✅ [ACCOUNTANT-TEAM] Invitation declined");
}

/**
 * Anuluj zaproszenie
 */
export async function cancelInvitation(invitationId: string): Promise<void> {
  console.log("🚫 [ACCOUNTANT-TEAM] Cancelling invitation:", invitationId);

  const { error } = await supabase
    .from("accountant_team_invitations")
    .update({ status: "cancelled" })
    .eq("id", invitationId)
    .eq("status", "pending");

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error cancelling invitation:", error);
    throw new Error(`Failed to cancel invitation: ${error.message}`);
  }

  console.log("✅ [ACCOUNTANT-TEAM] Invitation cancelled");
}

// ============================================================================
// TASKS
// ============================================================================

/**
 * Pobierz zadania zespołu
 */
export async function getTeamTasks(
  teamId: string
): Promise<AccountantTeamTaskWithAssignee[]> {
  console.log("🔍 [ACCOUNTANT-TEAM] Fetching tasks for team:", teamId);

  const { data, error } = await supabase
    .from("accountant_team_tasks")
    .select(
      `
      *,
      assignee:accountants!accountant_team_tasks_assigned_to_fkey (id, full_name, avatar_url),
      creator:profiles!accountant_team_tasks_created_by_fkey (id, full_name, avatar_url)
    `
    )
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error fetching tasks:", error);
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }

  console.log("✅ [ACCOUNTANT-TEAM] Found tasks:", data?.length || 0);
  return (data || []) as AccountantTeamTaskWithAssignee[];
}

/**
 * Stwórz zadanie
 */
export async function createTask(
  teamId: string,
  createdById: string,
  task: Omit<AccountantTeamTaskInsert, "team_id" | "created_by">
): Promise<AccountantTeamTask> {
  console.log("➕ [ACCOUNTANT-TEAM] Creating task:", {
    teamId,
    title: task.title,
  });

  const { data, error } = await supabase
    .from("accountant_team_tasks")
    .insert({
      ...task,
      team_id: teamId,
      created_by: createdById,
    })
    .select()
    .single();

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error creating task:", error);
    throw new Error(`Failed to create task: ${error.message}`);
  }

  console.log("✅ [ACCOUNTANT-TEAM] Task created:", data.id);
  return data;
}

/**
 * Aktualizuj zadanie
 */
export async function updateTask(
  taskId: string,
  updates: AccountantTeamTaskUpdate
): Promise<AccountantTeamTask> {
  console.log("✏️ [ACCOUNTANT-TEAM] Updating task:", taskId);

  const { data, error } = await supabase
    .from("accountant_team_tasks")
    .update(updates)
    .eq("id", taskId)
    .select()
    .single();

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error updating task:", error);
    throw new Error(`Failed to update task: ${error.message}`);
  }

  console.log("✅ [ACCOUNTANT-TEAM] Task updated");
  return data;
}

/**
 * Zmień status zadania
 */
export async function updateTaskStatus(
  taskId: string,
  status: "todo" | "in_progress" | "review" | "done" | "blocked" | "cancelled"
): Promise<void> {
  console.log("🔄 [ACCOUNTANT-TEAM] Updating task status:", { taskId, status });

  const updates: AccountantTeamTaskUpdate = { status };
  if (status === "done") {
    updates.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("accountant_team_tasks")
    .update(updates)
    .eq("id", taskId);

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error updating status:", error);
    throw new Error(`Failed to update status: ${error.message}`);
  }

  console.log("✅ [ACCOUNTANT-TEAM] Status updated");
}

/**
 * Usuń zadanie
 */
export async function deleteTask(taskId: string): Promise<void> {
  console.log("🗑️ [ACCOUNTANT-TEAM] Deleting task:", taskId);

  const { error } = await supabase
    .from("accountant_team_tasks")
    .delete()
    .eq("id", taskId);

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error deleting task:", error);
    throw new Error(`Failed to delete task: ${error.message}`);
  }

  console.log("✅ [ACCOUNTANT-TEAM] Task deleted");
}

// ============================================================================
// MESSAGES (CHAT)
// ============================================================================

/**
 * Pobierz wiadomości zespołu
 */
export async function getTeamMessages(
  teamId: string,
  limit = 50,
  before?: string
): Promise<AccountantTeamMessageWithSender[]> {
  console.log("🔍 [ACCOUNTANT-TEAM] Fetching messages for team:", teamId);

  let query = supabase
    .from("accountant_team_messages")
    .select(
      `
      *,
      sender:profiles!accountant_team_messages_sender_id_fkey (id, full_name, avatar_url)
    `
    )
    .eq("team_id", teamId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error fetching messages:", error);
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }

  console.log("✅ [ACCOUNTANT-TEAM] Found messages:", data?.length || 0);
  return (data || []).reverse() as AccountantTeamMessageWithSender[];
}

/**
 * Wyślij wiadomość
 */
export async function sendMessage(
  teamId: string,
  senderId: string,
  content: string,
  channelId?: string,
  replyToId?: string,
  senderName?: string, // Opcjonalne - do powiadomień
  channelName?: string // Opcjonalne - do powiadomień
): Promise<AccountantTeamMessage> {
  console.log(
    "💬 [ACCOUNTANT-TEAM] Sending message to team:",
    teamId,
    "channel:",
    channelId
  );

  const { data, error } = await supabase
    .from("accountant_team_messages")
    .insert({
      team_id: teamId,
      sender_id: senderId,
      content,
      channel_id: channelId || null,
      reply_to_id: replyToId || null,
    })
    .select()
    .single();

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error sending message:", error);
    throw new Error(`Failed to send message: ${error.message}`);
  }

  console.log("✅ [ACCOUNTANT-TEAM] Message sent:", data.id);

  // Wyślij powiadomienia do innych członków zespołu (async, nie blokuj)
  if (senderName) {
    import("./teamNotificationService").then(({ notifyNewMessage }) => {
      notifyNewMessage(
        teamId,
        senderId,
        senderName,
        content,
        channelName
      ).catch((err) =>
        console.error("❌ Error sending message notifications:", err)
      );
    });
  }

  return data;
}

/**
 * Usuń wiadomość (soft delete)
 */
export async function deleteMessage(messageId: string): Promise<void> {
  console.log("🗑️ [ACCOUNTANT-TEAM] Deleting message:", messageId);

  const { error } = await supabase
    .from("accountant_team_messages")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", messageId);

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error deleting message:", error);
    throw new Error(`Failed to delete message: ${error.message}`);
  }

  console.log("✅ [ACCOUNTANT-TEAM] Message deleted");
}

// ============================================================================
// EVENTS (CALENDAR)
// ============================================================================

/**
 * Pobierz wydarzenia zespołu
 */
export async function getTeamEvents(
  teamId: string,
  startDate?: string,
  endDate?: string
): Promise<AccountantTeamEvent[]> {
  console.log("🔍 [ACCOUNTANT-TEAM] Fetching events for team:", teamId);

  let query = supabase
    .from("accountant_team_events")
    .select("*")
    .eq("team_id", teamId)
    .neq("status", "cancelled")
    .order("start_time", { ascending: true });

  if (startDate) {
    query = query.gte("start_time", startDate);
  }
  if (endDate) {
    query = query.lte("end_time", endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error fetching events:", error);
    throw new Error(`Failed to fetch events: ${error.message}`);
  }

  console.log("✅ [ACCOUNTANT-TEAM] Found events:", data?.length || 0);
  return data || [];
}

/**
 * Stwórz wydarzenie
 */
export async function createEvent(
  teamId: string,
  createdById: string,
  event: Omit<AccountantTeamEventInsert, "team_id" | "created_by">
): Promise<AccountantTeamEvent> {
  console.log("➕ [ACCOUNTANT-TEAM] Creating event:", {
    teamId,
    title: event.title,
  });

  const { data, error } = await supabase
    .from("accountant_team_events")
    .insert({
      ...event,
      team_id: teamId,
      created_by: createdById,
    })
    .select()
    .single();

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error creating event:", error);
    throw new Error(`Failed to create event: ${error.message}`);
  }

  console.log("✅ [ACCOUNTANT-TEAM] Event created:", data.id);
  return data;
}

/**
 * Aktualizuj wydarzenie
 */
export async function updateEvent(
  eventId: string,
  updates: AccountantTeamEventUpdate
): Promise<AccountantTeamEvent> {
  console.log("✏️ [ACCOUNTANT-TEAM] Updating event:", eventId);

  const { data, error } = await supabase
    .from("accountant_team_events")
    .update(updates)
    .eq("id", eventId)
    .select()
    .single();

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error updating event:", error);
    throw new Error(`Failed to update event: ${error.message}`);
  }

  console.log("✅ [ACCOUNTANT-TEAM] Event updated");
  return data;
}

/**
 * Usuń wydarzenie
 */
export async function deleteEvent(eventId: string): Promise<void> {
  console.log("🗑️ [ACCOUNTANT-TEAM] Deleting event:", eventId);

  const { error } = await supabase
    .from("accountant_team_events")
    .update({ status: "cancelled" })
    .eq("id", eventId);

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error deleting event:", error);
    throw new Error(`Failed to delete event: ${error.message}`);
  }

  console.log("✅ [ACCOUNTANT-TEAM] Event deleted");
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Sprawdź czy księgowy jest członkiem zespołu
 */
export async function isMemberOfTeam(
  teamId: string,
  accountantId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("accountant_team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("accountant_id", accountantId)
    .eq("status", "active")
    .single();

  return !!data;
}

/**
 * Pobierz rolę członka w zespole
 */
export async function getMemberRole(
  teamId: string,
  accountantId: string
): Promise<"owner" | "admin" | "member" | "viewer" | null> {
  const { data } = await supabase
    .from("accountant_team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("accountant_id", accountantId)
    .eq("status", "active")
    .single();

  return data?.role as "owner" | "admin" | "member" | "viewer" | null;
}

/**
 * Wyszukaj księgowych po emailu (do zaproszeń)
 */
export async function searchAccountantsByEmail(
  query: string,
  excludeTeamId?: string
): Promise<
  {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  }[]
> {
  console.log("🔍 [ACCOUNTANT-TEAM] Searching accountants:", query);

  let dbQuery = supabase
    .from("accountants")
    .select("id, email, full_name, avatar_url")
    .ilike("email", `%${query}%`)
    .limit(10);

  const { data, error } = await dbQuery;

  if (error) {
    console.error("❌ [ACCOUNTANT-TEAM] Error searching accountants:", error);
    return [];
  }

  // Filter out members if excludeTeamId provided
  if (excludeTeamId && data) {
    const { data: existingMembers } = await supabase
      .from("accountant_team_members")
      .select("accountant_id")
      .eq("team_id", excludeTeamId)
      .eq("status", "active");

    const memberIds = new Set(
      existingMembers?.map((m) => m.accountant_id) || []
    );
    return data.filter((a) => !memberIds.has(a.id));
  }

  return data || [];
}

// ============================================================================
// CHANNELS (CHAT CHANNELS/GROUPS)
// ============================================================================

/**
 * Pobierz wszystkie kanały zespołu
 */
export async function getTeamChannels(
  teamId: string
): Promise<AccountantTeamChannel[]> {
  console.log("📁 [CHANNELS] Getting channels for team:", teamId);

  const { data, error } = await (supabase as any)
    .from("accountant_team_channels")
    .select("*")
    .eq("team_id", teamId)
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("❌ [CHANNELS] Error fetching channels:", error);
    return [];
  }

  console.log("✅ [CHANNELS] Found", data?.length || 0, "channels");
  return (data as unknown as AccountantTeamChannel[]) || [];
}

/**
 * Utwórz nowy kanał w zespole
 */
export async function createChannel(
  teamId: string,
  name: string,
  color: string,
  createdBy: string,
  type: "public" | "private" | "group" = "group",
  description?: string
): Promise<AccountantTeamChannel | null> {
  console.log("➕ [CHANNELS] Creating channel:", { teamId, name, color, type });

  const { data, error } = await (supabase as any)
    .from("accountant_team_channels")
    .insert({
      team_id: teamId,
      name,
      color,
      created_by: createdBy,
      type,
      description: description || null,
      is_default: false,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("❌ [CHANNELS] Error creating channel:", error);
    return null;
  }

  console.log("✅ [CHANNELS] Channel created:", data.id);
  return data as unknown as AccountantTeamChannel;
}

/**
 * Usuń kanał (soft delete - ustawia is_active na false)
 */
export async function deleteChannel(channelId: string): Promise<boolean> {
  console.log("🗑️ [CHANNELS] Deleting channel:", channelId);

  const { error } = await (supabase as any)
    .from("accountant_team_channels")
    .update({ is_active: false })
    .eq("id", channelId)
    .eq("is_default", false); // Nie można usunąć domyślnych kanałów

  if (error) {
    console.error("❌ [CHANNELS] Error deleting channel:", error);
    return false;
  }

  console.log("✅ [CHANNELS] Channel deleted");
  return true;
}

/**
 * Inicjalizuj domyślne kanały dla nowego zespołu
 */
export async function initializeDefaultChannels(
  teamId: string,
  createdBy: string
): Promise<AccountantTeamChannel[]> {
  console.log("🏗️ [CHANNELS] Initializing default channels for team:", teamId);

  const defaultChannels = [
    {
      name: "Ogólny",
      color: "#3B82F6",
      type: "public" as const,
      is_default: true,
    },
    {
      name: "BTW & VAT",
      color: "#10B981",
      type: "group" as const,
      is_default: false,
    },
    {
      name: "Kadry/Płace",
      color: "#F59E0B",
      type: "group" as const,
      is_default: false,
    },
    {
      name: "Losowy",
      color: "#8B5CF6",
      type: "group" as const,
      is_default: false,
    },
  ];

  const channels: AccountantTeamChannel[] = [];

  for (const ch of defaultChannels) {
    const { data, error } = await (supabase as any)
      .from("accountant_team_channels")
      .insert({
        team_id: teamId,
        name: ch.name,
        color: ch.color,
        type: ch.type,
        created_by: createdBy,
        is_default: ch.is_default,
        is_active: true,
      })
      .select()
      .single();

    if (!error && data) {
      channels.push(data as unknown as AccountantTeamChannel);
    }
  }

  console.log("✅ [CHANNELS] Created", channels.length, "default channels");
  return channels;
}

/**
 * Subskrybuj na zmiany kanałów zespołu
 */
export function subscribeToTeamChannels(
  teamId: string,
  callback: (
    event: "INSERT" | "UPDATE" | "DELETE",
    channel: AccountantTeamChannel
  ) => void
) {
  return supabase
    .channel(`team-channels-${teamId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "accountant_team_channels",
        filter: `team_id=eq.${teamId}`,
      },
      (payload) => {
        callback(
          payload.eventType.toUpperCase() as "INSERT" | "UPDATE" | "DELETE",
          payload.new as AccountantTeamChannel
        );
      }
    )
    .subscribe();
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

/**
 * Subskrybuj na zmiany wiadomości zespołu
 */
export function subscribeToTeamMessages(
  teamId: string,
  callback: (message: AccountantTeamMessage) => void
) {
  return supabase
    .channel(`team-messages-${teamId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "accountant_team_messages",
        filter: `team_id=eq.${teamId}`,
      },
      (payload) => {
        callback(payload.new as AccountantTeamMessage);
      }
    )
    .subscribe();
}

/**
 * Subskrybuj na zmiany zadań zespołu
 */
export function subscribeToTeamTasks(
  teamId: string,
  callback: (
    event: "INSERT" | "UPDATE" | "DELETE",
    task: AccountantTeamTask
  ) => void
) {
  return supabase
    .channel(`team-tasks-${teamId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "accountant_team_tasks",
        filter: `team_id=eq.${teamId}`,
      },
      (payload) => {
        callback(
          payload.eventType as "INSERT" | "UPDATE" | "DELETE",
          payload.new as AccountantTeamTask
        );
      }
    )
    .subscribe();
}

/**
 * Subskrybuj na zaproszenia dla księgowego
 */
export function subscribeToInvitations(
  accountantId: string,
  callback: (invitation: AccountantTeamInvitation) => void
) {
  return supabase
    .channel(`accountant-invitations-${accountantId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "accountant_team_invitations",
        filter: `invited_accountant_id=eq.${accountantId}`,
      },
      (payload) => {
        callback(payload.new as AccountantTeamInvitation);
      }
    )
    .subscribe();
}

// Default export
const accountantTeamService = {
  // Teams
  getAccountantTeams,
  getTeamDetails,
  createTeam,
  updateTeam,
  deleteTeam,
  // Members
  getTeamMembers,
  getTeamMemberships,
  removeMember,
  updateMemberRole,
  leaveTeam,
  // Invitations
  sendInvitation,
  getSentInvitations,
  getReceivedInvitations,
  getPendingInvitationsCount,
  acceptInvitation,
  declineInvitation,
  cancelInvitation,
  // Tasks
  getTeamTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  // Messages
  getTeamMessages,
  sendMessage,
  deleteMessage,
  // Events
  getTeamEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  // Channels
  getTeamChannels,
  createChannel,
  deleteChannel,
  initializeDefaultChannels,
  subscribeToTeamChannels,
  // Helpers
  isMemberOfTeam,
  getMemberRole,
  searchAccountantsByEmail,
  // Subscriptions
  subscribeToTeamMessages,
  subscribeToTeamTasks,
  subscribeToInvitations,
};

export default accountantTeamService;

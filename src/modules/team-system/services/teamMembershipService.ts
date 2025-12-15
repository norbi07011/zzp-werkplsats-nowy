/**
 * ================================================================
 * TEAM MEMBERSHIP SERVICE
 * ================================================================
 * Serwis do obsługi zespołów pracodawców i zaproszeń
 * System zaproszeń jak na Facebooku
 *
 * UWAGA: Używamy (supabase as any).from() ponieważ nowe tabele
 * nie są jeszcze w database.types.ts. Po wygenerowaniu typów
 * można usunąć casting.
 */

import { supabase } from "../../../lib/supabase";

// Helper dla nowych tabel które nie są jeszcze w database.types.ts
const db = supabase as any;

// ================================================================
// TYPES
// ================================================================

export interface EmployerTeam {
  id: string;
  employer_id: string;
  name: string;
  description: string | null;
  color_hex: string;
  icon: string;
  is_active: boolean;
  max_members: number;
  created_at: string;
  updated_at: string;
  // Computed
  members_count?: number;
}

export interface TeamMember {
  id: string;
  team_id: string;
  worker_id: string | null;
  cleaning_company_id: string | null;
  role: "member" | "leader" | "supervisor";
  team_specialization: string | null;
  status: "active" | "inactive" | "on_leave";
  joined_at: string;
  left_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  worker?: {
    id: string;
    profile_id: string;
    specialization: string | null;
    avatar_url: string | null;
    phone: string | null;
    rating: number;
    profile?: {
      full_name: string;
      email: string;
    };
  };
  cleaning_company?: {
    id: string;
    company_name: string;
    avatar_url: string | null;
    phone: string | null;
    average_rating: number;
  };
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  invited_by: string;
  invited_worker_id: string | null;
  invited_cleaning_company_id: string | null;
  message: string | null;
  proposed_role: string;
  status: "pending" | "accepted" | "declined" | "expired" | "cancelled";
  expires_at: string;
  responded_at: string | null;
  decline_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  team?: EmployerTeam & {
    employer?: {
      company_name: string;
      logo_url: string | null;
    };
  };
  invited_worker?: {
    id: string;
    specialization: string | null;
    avatar_url: string | null;
    profile?: {
      full_name: string;
      email: string;
    };
  };
  invited_cleaning_company?: {
    id: string;
    company_name: string;
    avatar_url: string | null;
  };
}

export type InviteeType = "worker" | "cleaning_company";

// ================================================================
// TEAM MANAGEMENT (Pracodawca)
// ================================================================

/**
 * Pobierz wszystkie zespoły pracodawcy
 */
export async function getEmployerTeams(
  employerId: string
): Promise<EmployerTeam[]> {
  const { data, error } = await db
    .from("employer_teams")
    .select(
      `
      *,
      employer_team_members(count)
    `
    )
    .eq("employer_id", employerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch teams: ${error.message}`);

  return (data || []).map((team: any) => ({
    ...team,
    members_count: team.employer_team_members?.[0]?.count || 0,
  }));
}

/**
 * Utwórz nowy zespół
 */
export async function createTeam(
  employerId: string,
  name: string,
  description?: string,
  colorHex?: string,
  icon?: string
): Promise<EmployerTeam> {
  const { data, error } = await db
    .from("employer_teams")
    .insert({
      employer_id: employerId,
      name,
      description: description || null,
      color_hex: colorHex || "#3B82F6",
      icon: icon || "users",
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create team: ${error.message}`);
  return data;
}

/**
 * Aktualizuj zespół
 */
export async function updateTeam(
  teamId: string,
  updates: Partial<
    Pick<
      EmployerTeam,
      | "name"
      | "description"
      | "color_hex"
      | "icon"
      | "is_active"
      | "max_members"
    >
  >
): Promise<EmployerTeam> {
  const { data, error } = await db
    .from("employer_teams")
    .update(updates)
    .eq("id", teamId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update team: ${error.message}`);
  return data;
}

/**
 * Usuń zespół
 */
export async function deleteTeam(teamId: string): Promise<void> {
  const { error } = await db.from("employer_teams").delete().eq("id", teamId);

  if (error) throw new Error(`Failed to delete team: ${error.message}`);
}

// ================================================================
// TEAM MEMBERS (Pracodawca)
// ================================================================

/**
 * Pobierz członków zespołu
 */
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const { data, error } = await db
    .from("employer_team_members")
    .select(
      `
      *,
      worker:workers(
        id,
        profile_id,
        specialization,
        avatar_url,
        phone,
        rating,
        profile:profiles(full_name, email)
      ),
      cleaning_company:cleaning_companies(
        id,
        company_name,
        avatar_url,
        phone,
        average_rating
      )
    `
    )
    .eq("team_id", teamId)
    .eq("status", "active")
    .order("joined_at", { ascending: true });

  if (error) throw new Error(`Failed to fetch team members: ${error.message}`);
  return data || [];
}

/**
 * Dodaj członka bezpośrednio (bez zaproszenia)
 */
export async function addTeamMember(
  teamId: string,
  memberId: string,
  memberType: InviteeType,
  role: TeamMember["role"] = "member",
  specialization?: string
): Promise<TeamMember> {
  const { data, error } = await db
    .from("employer_team_members")
    .insert({
      team_id: teamId,
      worker_id: memberType === "worker" ? memberId : null,
      cleaning_company_id: memberType === "cleaning_company" ? memberId : null,
      role,
      team_specialization: specialization || null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to add team member: ${error.message}`);
  return data;
}

/**
 * Aktualizuj członka zespołu
 */
export async function updateTeamMember(
  memberId: string,
  updates: Partial<
    Pick<TeamMember, "role" | "team_specialization" | "status" | "notes">
  >
): Promise<TeamMember> {
  const { data, error } = await db
    .from("employer_team_members")
    .update(updates)
    .eq("id", memberId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update team member: ${error.message}`);
  return data;
}

/**
 * Usuń członka z zespołu
 */
export async function removeTeamMember(memberId: string): Promise<void> {
  const { error } = await db
    .from("employer_team_members")
    .delete()
    .eq("id", memberId);

  if (error) throw new Error(`Failed to remove team member: ${error.message}`);
}

// ================================================================
// INVITATIONS - PRACODAWCA
// ================================================================

/**
 * Wyślij zaproszenie do zespołu
 */
export async function sendTeamInvitation(
  teamId: string,
  invitedById: string,
  inviteeId: string,
  inviteeType: InviteeType,
  message?: string,
  proposedRole?: string
): Promise<TeamInvitation> {
  const { data, error } = await db
    .from("team_invitations")
    .insert({
      team_id: teamId,
      invited_by: invitedById,
      invited_worker_id: inviteeType === "worker" ? inviteeId : null,
      invited_cleaning_company_id:
        inviteeType === "cleaning_company" ? inviteeId : null,
      message: message || null,
      proposed_role: proposedRole || "member",
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to send invitation: ${error.message}`);
  return data;
}

/**
 * Pobierz wysłane zaproszenia (dla pracodawcy)
 */
export async function getSentInvitations(
  teamId: string
): Promise<TeamInvitation[]> {
  const { data, error } = await db
    .from("team_invitations")
    .select(
      `
      *,
      invited_worker:workers(
        id,
        specialization,
        avatar_url,
        profile:profiles(full_name, email)
      ),
      invited_cleaning_company:cleaning_companies(
        id,
        company_name,
        avatar_url
      )
    `
    )
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error)
    throw new Error(`Failed to fetch sent invitations: ${error.message}`);
  return data || [];
}

/**
 * Anuluj zaproszenie
 */
export async function cancelInvitation(invitationId: string): Promise<void> {
  const { error } = await db
    .from("team_invitations")
    .update({ status: "cancelled" })
    .eq("id", invitationId)
    .eq("status", "pending");

  if (error) throw new Error(`Failed to cancel invitation: ${error.message}`);
}

// ================================================================
// INVITATIONS - PRACOWNIK/SPRZĄTACZ
// ================================================================

/**
 * Pobierz otrzymane zaproszenia (dla workera)
 */
export async function getReceivedInvitationsForWorker(
  workerId: string
): Promise<TeamInvitation[]> {
  const { data, error } = await db
    .from("team_invitations")
    .select(
      `
      *,
      team:employer_teams(
        *,
        employer:employers(company_name, logo_url)
      )
    `
    )
    .eq("invited_worker_id", workerId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch invitations: ${error.message}`);
  return data || [];
}

/**
 * Pobierz otrzymane zaproszenia (dla cleaning company)
 */
export async function getReceivedInvitationsForCleaningCompany(
  cleaningCompanyId: string
): Promise<TeamInvitation[]> {
  const { data, error } = await db
    .from("team_invitations")
    .select(
      `
      *,
      team:employer_teams(
        *,
        employer:employers(company_name, logo_url)
      )
    `
    )
    .eq("invited_cleaning_company_id", cleaningCompanyId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch invitations: ${error.message}`);
  return data || [];
}

/**
 * Zaakceptuj zaproszenie
 * Trigger w bazie automatycznie doda członka do zespołu
 */
export async function acceptInvitation(invitationId: string): Promise<void> {
  const { error } = await db
    .from("team_invitations")
    .update({ status: "accepted" })
    .eq("id", invitationId)
    .eq("status", "pending");

  if (error) throw new Error(`Failed to accept invitation: ${error.message}`);
}

/**
 * Odrzuć zaproszenie
 */
export async function declineInvitation(
  invitationId: string,
  reason?: string
): Promise<void> {
  const { error } = await db
    .from("team_invitations")
    .update({
      status: "declined",
      decline_reason: reason || null,
    })
    .eq("id", invitationId)
    .eq("status", "pending");

  if (error) throw new Error(`Failed to decline invitation: ${error.message}`);
}

// ================================================================
// MEMBER QUERIES (Worker/Cleaning Company perspective)
// ================================================================

/**
 * Pobierz zespoły, do których należy worker
 */
export async function getTeamsForWorker(
  workerId: string
): Promise<(TeamMember & { team: EmployerTeam })[]> {
  const { data, error } = await db
    .from("employer_team_members")
    .select(
      `
      *,
      team:employer_teams(
        *,
        employer:employers(company_name, logo_url)
      )
    `
    )
    .eq("worker_id", workerId)
    .eq("status", "active");

  if (error) throw new Error(`Failed to fetch worker teams: ${error.message}`);
  return data || [];
}

/**
 * Pobierz zespoły, do których należy cleaning company
 */
export async function getTeamsForCleaningCompany(
  cleaningCompanyId: string
): Promise<(TeamMember & { team: EmployerTeam })[]> {
  const { data, error } = await db
    .from("employer_team_members")
    .select(
      `
      *,
      team:employer_teams(
        *,
        employer:employers(company_name, logo_url)
      )
    `
    )
    .eq("cleaning_company_id", cleaningCompanyId)
    .eq("status", "active");

  if (error)
    throw new Error(`Failed to fetch cleaning company teams: ${error.message}`);
  return data || [];
}

/**
 * Opuść zespół (worker/cleaning company)
 */
export async function leaveTeam(membershipId: string): Promise<void> {
  const { error } = await db
    .from("employer_team_members")
    .update({
      status: "inactive",
      left_at: new Date().toISOString(),
    })
    .eq("id", membershipId);

  if (error) throw new Error(`Failed to leave team: ${error.message}`);
}

// ================================================================
// UTILITY
// ================================================================

/**
 * Sprawdź czy member jest już w zespole
 */
export async function isMemberInTeam(
  teamId: string,
  memberId: string,
  memberType: InviteeType
): Promise<boolean> {
  const query = db
    .from("employer_team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("status", "active");

  if (memberType === "worker") {
    query.eq("worker_id", memberId);
  } else {
    query.eq("cleaning_company_id", memberId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`Failed to check membership: ${error.message}`);
  return !!data;
}

/**
 * Sprawdź czy jest pending zaproszenie
 */
export async function hasPendingInvitation(
  teamId: string,
  memberId: string,
  memberType: InviteeType
): Promise<boolean> {
  const query = db
    .from("team_invitations")
    .select("id")
    .eq("team_id", teamId)
    .eq("status", "pending");

  if (memberType === "worker") {
    query.eq("invited_worker_id", memberId);
  } else {
    query.eq("invited_cleaning_company_id", memberId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`Failed to check invitation: ${error.message}`);
  return !!data;
}

/**
 * Pobierz liczbę pending zaproszeń dla usera
 */
export async function getPendingInvitationsCount(
  memberId: string,
  memberType: InviteeType
): Promise<number> {
  const query = db
    .from("team_invitations")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if (memberType === "worker") {
    query.eq("invited_worker_id", memberId);
  } else {
    query.eq("invited_cleaning_company_id", memberId);
  }

  const { count, error } = await query;
  if (error) throw new Error(`Failed to count invitations: ${error.message}`);
  return count || 0;
}

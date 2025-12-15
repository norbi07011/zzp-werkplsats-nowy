/**
 * ================================================================
 * TEAM MEMBERSHIP TAB - For Workers and Cleaning Companies
 * ================================================================
 * Shows teams the user belongs to, pending invitations, and projects
 * This is a view-only dashboard (not for managing teams like employer)
 */

import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { toast } from "sonner";
import Users from "lucide-react/dist/esm/icons/users";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import Clock from "lucide-react/dist/esm/icons/clock";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Mail from "lucide-react/dist/esm/icons/mail";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Calendar from "lucide-react/dist/esm/icons/calendar";

// Type definitions
interface TeamMembership {
  id: string;
  team_id: string;
  role: string;
  joined_at: string;
  team: {
    id: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    employer_id: string;
    employer?: {
      id: string;
      company_name?: string;
      avatar_url?: string;
    };
  };
}

interface TeamInvitation {
  id: string;
  team_id: string;
  role: string;
  message?: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  expires_at?: string;
  team: {
    id: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    employer_id: string;
    employer?: {
      id: string;
      company_name?: string;
      avatar_url?: string;
    };
  };
}

interface TeamMembershipTabProps {
  /** User's profile ID (from auth/profiles table) */
  profileId: string;
  /** Type of member: 'worker' or 'cleaning_company' */
  memberType: "worker" | "cleaning_company";
}

const db = supabase as any; // Bypass TypeScript until types regenerated

export const TeamMembershipTab: React.FC<TeamMembershipTabProps> = ({
  profileId,
  memberType,
}) => {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<TeamMembership[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [processingInvite, setProcessingInvite] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);

  // First, resolve the actual worker_id or cleaning_company_id from profile_id
  useEffect(() => {
    if (profileId) {
      resolveMemberId();
    }
  }, [profileId, memberType]);

  const resolveMemberId = async () => {
    try {
      const tableName =
        memberType === "worker" ? "workers" : "cleaning_companies";
      const { data, error } = await db
        .from(tableName)
        .select("id")
        .eq("profile_id", profileId)
        .single();

      if (error) {
        console.error(`Error resolving ${memberType} ID:`, error);
        setLoading(false);
        return;
      }

      if (data?.id) {
        setMemberId(data.id);
      } else {
        console.warn(
          `No ${memberType} record found for profile_id:`,
          profileId
        );
        setLoading(false);
      }
    } catch (error) {
      console.error("Error resolving member ID:", error);
      setLoading(false);
    }
  };

  // Fetch teams and invitations when memberId is resolved
  useEffect(() => {
    if (memberId) {
      loadData();
    }
  }, [memberId]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchTeams(), fetchInvitations()]);
    } catch (error) {
      console.error("Error loading team data:", error);
      toast.error("Nie udało się załadować danych zespołów");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      // Fetch team memberships with team and employer info
      // Note: employer_id references employers table, then we get employer's profile via profile_id
      let query = db
        .from("employer_team_members")
        .select(
          `
          id,
          team_id,
          role,
          joined_at,
          employer_teams (
            id,
            name,
            description,
            color_hex,
            icon,
            employer_id,
            employers:employer_id (
              id,
              company_name,
              logo_url,
              profile_id
            )
          )
        `
        )
        .eq("status", "active");

      // Filter by member type
      if (memberType === "worker") {
        query = query.eq("worker_id", memberId);
      } else {
        query = query.eq("cleaning_company_id", memberId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to expected shape
      const transformedTeams: TeamMembership[] = (data || []).map(
        (item: any) => ({
          id: item.id,
          team_id: item.team_id,
          role: item.role,
          joined_at: item.joined_at,
          team: {
            id: item.employer_teams?.id,
            name: item.employer_teams?.name || "Zespół",
            description: item.employer_teams?.description,
            color: item.employer_teams?.color_hex,
            icon: item.employer_teams?.icon,
            employer_id: item.employer_teams?.employer_id,
            employer: item.employer_teams?.employers
              ? {
                  id: item.employer_teams.employers.id,
                  company_name: item.employer_teams.employers.company_name,
                  avatar_url: item.employer_teams.employers.logo_url,
                }
              : undefined,
          },
        })
      );

      setTeams(transformedTeams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      throw error;
    }
  };

  const fetchInvitations = async () => {
    try {
      // Fetch pending invitations - use correct relation: employer_id → employers table
      let query = db
        .from("team_invitations")
        .select(
          `
          id,
          team_id,
          proposed_role,
          message,
          status,
          created_at,
          expires_at,
          employer_teams (
            id,
            name,
            description,
            color_hex,
            icon,
            employer_id,
            employers:employer_id (
              id,
              company_name,
              logo_url
            )
          )
        `
        )
        .eq("status", "pending");

      // Filter by member type - use correct column names from team_invitations table
      if (memberType === "worker") {
        query = query.eq("invited_worker_id", memberId);
      } else {
        query = query.eq("invited_cleaning_company_id", memberId);
      }

      // Filter out expired invitations
      query = query.or(
        `expires_at.is.null,expires_at.gt.${new Date().toISOString()}`
      );

      const { data, error } = await query;

      if (error) throw error;

      // Transform data - use proposed_role and employers relation
      const transformedInvitations: TeamInvitation[] = (data || []).map(
        (item: any) => ({
          id: item.id,
          team_id: item.team_id,
          role: item.proposed_role || "member",
          message: item.message,
          status: item.status,
          created_at: item.created_at,
          expires_at: item.expires_at,
          team: {
            id: item.employer_teams?.id,
            name: item.employer_teams?.name || "Zespół",
            description: item.employer_teams?.description,
            color: item.employer_teams?.color_hex,
            icon: item.employer_teams?.icon,
            employer_id: item.employer_teams?.employer_id,
            employer: item.employer_teams?.employers
              ? {
                  id: item.employer_teams.employers.id,
                  company_name: item.employer_teams.employers.company_name,
                  avatar_url: item.employer_teams.employers.logo_url,
                }
              : undefined,
          },
        })
      );

      setInvitations(transformedInvitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      throw error;
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    setProcessingInvite(invitationId);
    try {
      // 1. Get invitation details first
      const { data: invitation, error: fetchError } = await db
        .from("team_invitations")
        .select(
          "team_id, proposed_role, invited_worker_id, invited_cleaning_company_id"
        )
        .eq("id", invitationId)
        .single();

      if (fetchError) throw fetchError;
      if (!invitation) throw new Error("Zaproszenie nie znalezione");

      // 2. Add member to team
      const memberData: any = {
        team_id: invitation.team_id,
        role: invitation.proposed_role || "member",
        status: "active",
        joined_at: new Date().toISOString(),
      };

      // Set correct ID based on member type
      if (memberType === "worker") {
        memberData.worker_id = memberId;
      } else {
        memberData.cleaning_company_id = memberId;
      }

      const { error: insertError } = await db
        .from("employer_team_members")
        .insert(memberData);

      if (insertError) throw insertError;

      // 3. Update invitation status to accepted
      const { error: updateError } = await db
        .from("team_invitations")
        .update({
          status: "accepted",
          responded_at: new Date().toISOString(),
        })
        .eq("id", invitationId);

      if (updateError) throw updateError;

      toast.success("🎉 Dołączono do zespołu!");
      await loadData(); // Refresh both teams and invitations
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      toast.error(
        `Nie udało się przyjąć zaproszenia: ${error.message || "Nieznany błąd"}`
      );
    } finally {
      setProcessingInvite(null);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    setProcessingInvite(invitationId);
    try {
      const { error } = await db
        .from("team_invitations")
        .update({
          status: "declined",
          responded_at: new Date().toISOString(),
        })
        .eq("id", invitationId);

      if (error) throw error;

      toast.success("Zaproszenie odrzucone");
      await loadData();
    } catch (error: any) {
      console.error("Error declining invitation:", error);
      toast.error("Nie udało się odrzucić zaproszenia");
    } finally {
      setProcessingInvite(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getTeamColor = (color?: string) => {
    return color || "#3B82F6"; // Default blue
  };

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; color: string }> = {
      member: { label: "Członek", color: "bg-blue-500/20 text-blue-400" },
      leader: { label: "Lider", color: "bg-purple-500/20 text-purple-400" },
      contractor: {
        label: "Wykonawca",
        color: "bg-green-500/20 text-green-400",
      },
    };
    return (
      roleMap[role] || { label: role, color: "bg-gray-500/20 text-gray-400" }
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-400">Ładowanie zespołów...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-blue-400" />
            Moje Zespoły
          </h2>
          <p className="text-gray-400 mt-1">
            Zespoły do których należysz i oczekujące zaproszenia
          </p>
        </div>
      </div>

      {/* Pending Invitations Section */}
      {invitations.length > 0 && (
        <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-2xl border border-orange-500/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Oczekujące zaproszenia ({invitations.length})
              </h3>
              <p className="text-sm text-gray-400">
                Zostałeś zaproszony do zespołów
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="bg-slate-800/80 rounded-xl p-4 border border-slate-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Team Avatar */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                      style={{
                        backgroundColor: getTeamColor(invitation.team.color),
                      }}
                    >
                      {invitation.team.icon || invitation.team.name.charAt(0)}
                    </div>

                    <div>
                      <h4 className="font-semibold text-white">
                        {invitation.team.name}
                      </h4>
                      <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                        <Building2 className="w-4 h-4" />
                        {invitation.team.employer?.company_name || "Pracodawca"}
                      </p>
                      {invitation.message && (
                        <p className="text-sm text-gray-300 mt-2 italic">
                          "{invitation.message}"
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Zaproszono: {formatDate(invitation.created_at)}
                        </span>
                        {invitation.expires_at && (
                          <span className="flex items-center gap-1 text-orange-400">
                            <Clock className="w-3 h-3" />
                            Wygasa: {formatDate(invitation.expires_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeclineInvitation(invitation.id)}
                      disabled={processingInvite === invitation.id}
                      className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {processingInvite === invitation.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Odrzuć"
                      )}
                    </button>
                    <button
                      onClick={() => handleAcceptInvitation(invitation.id)}
                      disabled={processingInvite === invitation.id}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                      {processingInvite === invitation.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Dołącz
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Teams Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          Aktywne Zespoły ({teams.length})
        </h3>

        {teams.length === 0 ? (
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-500" />
            </div>
            <h4 className="text-lg font-medium text-white mb-2">
              Nie należysz jeszcze do żadnego zespołu
            </h4>
            <p className="text-gray-400 max-w-md mx-auto">
              Pracodawcy mogą zapraszać Cię do swoich zespołów przez Twój profil
              publiczny. Kiedy otrzymasz zaproszenie, pojawi się tutaj.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((membership) => (
              <div
                key={membership.id}
                className="bg-slate-800/80 rounded-2xl border border-slate-700 hover:border-slate-600 transition-all p-6 group"
              >
                <div className="flex items-start gap-4">
                  {/* Team Avatar */}
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                    style={{
                      backgroundColor: getTeamColor(membership.team.color),
                    }}
                  >
                    {membership.team.icon || membership.team.name.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-white text-lg truncate">
                        {membership.team.name}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getRoleBadge(membership.role).color
                        }`}
                      >
                        {getRoleBadge(membership.role).label}
                      </span>
                    </div>

                    <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                      <Building2 className="w-4 h-4 flex-shrink-0" />
                      {membership.team.employer?.company_name || "Pracodawca"}
                    </p>

                    {membership.team.description && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                        {membership.team.description}
                      </p>
                    )}

                    <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Dołączono: {formatDate(membership.joined_at)}
                    </p>
                  </div>
                </div>

                {/* Quick Actions (Future: link to projects, chat) */}
                {/* 
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700">
                  <button className="flex-1 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-gray-300 text-sm font-medium flex items-center justify-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Projekty
                  </button>
                </div>
                */}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Banner */}
      {teams.length === 0 && invitations.length === 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-300">
              Jak dołączyć do zespołu?
            </h4>
            <p className="text-sm text-blue-200/70 mt-1">
              Pracodawcy mogą wysyłać zaproszenia do zespołów przez Twój profil
              publiczny. Upewnij się, że Twój profil jest kompletny i widoczny,
              aby zwiększyć szanse na otrzymanie zaproszeń.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMembershipTab;

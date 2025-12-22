/**
 * TeamMembersFull - Full Team Members Management with Real Database
 * Uses accountantTeamService for real data operations
 */

import React, { useState, useEffect } from "react";
import { Language, TeamMember } from "../types";
import { DICTIONARY } from "../constants";
import {
  Plus,
  Search,
  Mail,
  Phone,
  MoreHorizontal,
  UserPlus,
  Copy,
  Check,
  X,
  Clock,
  Shield,
  Users,
  Crown,
  UserCog,
  Eye,
  Trash2,
  LogOut,
  RefreshCw,
  Loader2,
  AlertCircle,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import accountantTeamService, {
  AccountantTeamMemberWithProfile,
  AccountantTeamInvitationWithDetails,
} from "../services/accountantTeamService";

interface TeamMembersFullProps {
  teamId: string;
  language: Language;
  currentUser: {
    id: string;
    accountantId: string;
    name: string;
    email: string;
    avatar: string;
    role: "owner" | "admin" | "member" | "viewer";
  };
  onMemberCountChange?: (count: number) => void;
}

export const TeamMembersFull: React.FC<TeamMembersFullProps> = ({
  teamId,
  language,
  currentUser,
  onMemberCountChange,
}) => {
  const t = DICTIONARY[language];

  // State
  const [members, setMembers] = useState<AccountantTeamMemberWithProfile[]>([]);
  const [invitations, setInvitations] = useState<
    AccountantTeamInvitationWithDetails[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">(
    "member"
  );
  const [sendingInvite, setSendingInvite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionMemberId, setActionMemberId] = useState<string | null>(null);
  const [showMemberMenu, setShowMemberMenu] = useState<string | null>(null);

  // Mock invite link (in real app would come from backend)
  const inviteLink = `https://zzp-werkplaats.nl/team/invite/${teamId}`;

  // Check permissions
  const canInvite =
    currentUser.role === "owner" || currentUser.role === "admin";
  const canRemove =
    currentUser.role === "owner" || currentUser.role === "admin";
  const canChangeRole = currentUser.role === "owner";

  // Load data
  useEffect(() => {
    loadData();
  }, [teamId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [membersData, invitationsData] = await Promise.all([
        accountantTeamService.getTeamMembers(teamId),
        canInvite
          ? accountantTeamService.getSentInvitations(teamId)
          : Promise.resolve([]),
      ]);

      setMembers(membersData);
      setInvitations(invitationsData.filter((inv) => inv.status === "pending"));

      // Notify parent of member count
      if (onMemberCountChange) {
        onMemberCountChange(membersData.length);
      }
    } catch (err) {
      console.error("Error loading team data:", err);
      setError("Nie udało się załadować danych zespołu");
    } finally {
      setLoading(false);
    }
  };

  // Filter members
  const filteredMembers = members.filter((member) => {
    const name = member.accountant?.full_name || "";
    const email = member.accountant?.email || "";
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Handle invite
  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      toast.error("Podaj poprawny adres email");
      return;
    }

    try {
      setSendingInvite(true);

      await accountantTeamService.sendInvitation(
        teamId,
        currentUser.id, // profile_id
        inviteEmail.trim(),
        inviteMessage.trim() || undefined,
        inviteRole
      );

      toast.success(`📧 Zaproszenie wysłane do ${inviteEmail}`);
      setInviteEmail("");
      setInviteMessage("");
      setShowInviteModal(false);

      // Refresh invitations
      const newInvitations = await accountantTeamService.getSentInvitations(
        teamId
      );
      setInvitations(newInvitations.filter((inv) => inv.status === "pending"));
    } catch (err: any) {
      console.error("Error sending invitation:", err);
      toast.error(err.message || "Nie udało się wysłać zaproszenia");
    } finally {
      setSendingInvite(false);
    }
  };

  // Cancel invitation
  const handleCancelInvite = async (inviteId: string) => {
    try {
      await accountantTeamService.cancelInvitation(inviteId);
      setInvitations((prev) => prev.filter((inv) => inv.id !== inviteId));
      toast.success("🗑️ Zaproszenie anulowane");
    } catch (err) {
      console.error("Error cancelling invitation:", err);
      toast.error("Nie udało się anulować zaproszenia");
    }
  };

  // Remove member
  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć ${memberName} z zespołu?`)) {
      return;
    }

    try {
      setActionMemberId(memberId);
      await accountantTeamService.removeMember(memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success(`👋 ${memberName} został usunięty z zespołu`);

      if (onMemberCountChange) {
        onMemberCountChange(members.length - 1);
      }
    } catch (err) {
      console.error("Error removing member:", err);
      toast.error("Nie udało się usunąć członka");
    } finally {
      setActionMemberId(null);
      setShowMemberMenu(null);
    }
  };

  // Change member role
  const handleChangeRole = async (
    memberId: string,
    newRole: "admin" | "member" | "viewer"
  ) => {
    try {
      setActionMemberId(memberId);
      await accountantTeamService.updateMemberRole(memberId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
      toast.success("✅ Rola zmieniona");
    } catch (err) {
      console.error("Error changing role:", err);
      toast.error("Nie udało się zmienić roli");
    } finally {
      setActionMemberId(null);
      setShowMemberMenu(null);
    }
  };

  // Leave team
  const handleLeaveTeam = async () => {
    if (!confirm("Czy na pewno chcesz opuścić ten zespół?")) {
      return;
    }

    try {
      await accountantTeamService.leaveTeam(teamId, currentUser.accountantId);
      toast.success("👋 Opuściłeś zespół");
      // Parent should handle navigation/refresh
    } catch (err) {
      console.error("Error leaving team:", err);
      toast.error("Nie udało się opuścić zespołu");
    }
  };

  // Copy invite link
  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("📋 Link skopiowany!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Role display
  const roleLabels: Record<
    string,
    { label: string; color: string; icon: React.ReactNode }
  > = {
    owner: {
      label: "Właściciel",
      color: "bg-amber-100 text-amber-700",
      icon: <Crown className="w-3 h-3" />,
    },
    admin: {
      label: "Administrator",
      color: "bg-purple-100 text-purple-700",
      icon: <UserCog className="w-3 h-3" />,
    },
    member: {
      label: "Członek",
      color: "bg-blue-100 text-blue-700",
      icon: <Users className="w-3 h-3" />,
    },
    viewer: {
      label: "Obserwator",
      color: "bg-slate-100 text-slate-700",
      icon: <Eye className="w-3 h-3" />,
    },
  };

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500",
    inactive: "bg-slate-300",
    on_leave: "bg-amber-500",
    suspended: "bg-red-500",
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-slate-500">Ładowanie członków...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-slate-600">{error}</p>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <RefreshCw className="w-4 h-4" />
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t.team}</h2>
          <p className="text-slate-500 text-sm">
            {members.length} {members.length === 1 ? "członek" : "członków"}{" "}
            drużyny
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Odśwież"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          {canInvite && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              {t.invite_member}
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Szukaj członków..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Invite Link Card */}
      {canInvite && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-slate-800">Link zaproszeniowy</h3>
              <p className="text-sm text-slate-500">
                Udostępnij link, aby zaprosić innych księgowych
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600"
            />
            <button
              onClick={copyInviteLink}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                copied
                  ? "bg-emerald-500 text-white"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Skopiowano!" : "Kopiuj"}
            </button>
          </div>
        </div>
      )}

      {/* Pending Invites */}
      {invitations.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Oczekujące zaproszenia ({invitations.length})
          </h3>
          <div className="space-y-2">
            {invitations.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between py-2 px-3 bg-amber-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <Mail className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {invite.invited_email}
                    </p>
                    <p className="text-xs text-slate-500">
                      Rola:{" "}
                      {roleLabels[invite.proposed_role || "member"]?.label} •
                      Wygasa:{" "}
                      {invite.expires_at
                        ? new Date(invite.expires_at).toLocaleDateString(
                            "pl-PL"
                          )
                        : "—"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleCancelInvite(invite.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                  title="Anuluj zaproszenie"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredMembers.map((member) => {
          const isCurrentUser =
            member.accountant_id === currentUser.accountantId;
          const memberRole = member.role || "member";
          const roleInfo = roleLabels[memberRole];

          return (
            <div
              key={member.id}
              className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow relative ${
                isCurrentUser
                  ? "border-indigo-300 ring-2 ring-indigo-100"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <img
                    src={
                      member.accountant?.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        member.accountant?.full_name || "U"
                      )}&background=6366f1&color=fff`
                    }
                    alt={member.accountant?.full_name || ""}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <span
                    className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                      statusColors[member.status || "active"]
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-slate-800 truncate">
                      {member.accountant?.full_name || "Nieznany"}
                    </h4>
                    {isCurrentUser && (
                      <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 text-xs rounded">
                        Ty
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleInfo?.color}`}
                    >
                      {roleInfo?.icon}
                      {roleInfo?.label}
                    </span>
                  </div>
                  {member.specialization && (
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {member.specialization}
                    </p>
                  )}
                </div>

                {/* Member menu */}
                {(canRemove || isCurrentUser) &&
                  !isCurrentUser &&
                  memberRole !== "owner" && (
                    <div className="relative">
                      <button
                        onClick={() =>
                          setShowMemberMenu(
                            showMemberMenu === member.id ? null : member.id
                          )
                        }
                        className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                        disabled={actionMemberId === member.id}
                      >
                        {actionMemberId === member.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <MoreHorizontal className="w-5 h-5" />
                        )}
                      </button>

                      {showMemberMenu === member.id && (
                        <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
                          {canChangeRole && (
                            <>
                              <button
                                onClick={() =>
                                  handleChangeRole(member.id, "admin")
                                }
                                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                disabled={memberRole === "admin"}
                              >
                                <UserCog className="w-4 h-4" />
                                Ustaw jako Admin
                              </button>
                              <button
                                onClick={() =>
                                  handleChangeRole(member.id, "member")
                                }
                                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                disabled={memberRole === "member"}
                              >
                                <Users className="w-4 h-4" />
                                Ustaw jako Członek
                              </button>
                              <button
                                onClick={() =>
                                  handleChangeRole(member.id, "viewer")
                                }
                                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                disabled={memberRole === "viewer"}
                              >
                                <Eye className="w-4 h-4" />
                                Ustaw jako Obserwator
                              </button>
                              <hr className="my-1" />
                            </>
                          )}
                          {canRemove && (
                            <button
                              onClick={() =>
                                handleRemoveMember(
                                  member.id,
                                  member.accountant?.full_name || "tego członka"
                                )
                              }
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Usuń z zespołu
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                {/* Leave button for current user */}
                {isCurrentUser && memberRole !== "owner" && (
                  <button
                    onClick={handleLeaveTeam}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                    title="Opuść zespół"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                {member.accountant?.email && (
                  <a
                    href={`mailto:${member.accountant.email}`}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{member.accountant.email}</span>
                  </a>
                )}
                {member.joined_at && (
                  <p className="text-xs text-slate-400">
                    Dołączył:{" "}
                    {new Date(member.joined_at).toLocaleDateString("pl-PL")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">
            {searchQuery ? "Brak wyników" : "Brak członków"}
          </h3>
          <p className="text-slate-500 mb-4">
            {searchQuery
              ? "Spróbuj zmienić kryteria wyszukiwania"
              : "Zaproś innych księgowych do drużyny"}
          </p>
          {canInvite && !searchQuery && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Zaproś teraz
            </button>
          )}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) =>
            e.target === e.currentTarget && setShowInviteModal(false)
          }
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {t.invite_member}
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email księgowego *
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="jan@biuro-ksiegowe.pl"
                  disabled={sendingInvite}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Rola w zespole
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(
                      e.target.value as "admin" | "member" | "viewer"
                    )
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  disabled={sendingInvite}
                >
                  <option value="member">Członek drużyny</option>
                  <option value="admin">Administrator</option>
                  <option value="viewer">Obserwator (tylko odczyt)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Wiadomość (opcjonalnie)
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg resize-none"
                  rows={3}
                  placeholder="Cześć! Zapraszam Cię do naszego zespołu..."
                  disabled={sendingInvite}
                />
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
                <Shield className="w-4 h-4 inline mr-1 text-slate-400" />
                Zaproszenie wygaśnie po 7 dniach. Zaproszony musi mieć konto
                księgowego.
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
                disabled={sendingInvite}
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSendInvite}
                disabled={sendingInvite || !inviteEmail.trim()}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingInvite ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                {sendingInvite ? "Wysyłanie..." : "Wyślij zaproszenie"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close member menu */}
      {showMemberMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMemberMenu(null)}
        />
      )}
    </div>
  );
};

export default TeamMembersFull;

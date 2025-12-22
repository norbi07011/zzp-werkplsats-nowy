/**
 * ================================================================
 * INVITE TO ACCOUNTANT TEAM BUTTON
 * ================================================================
 * Przycisk do zapraszania innych księgowych do zespołu
 * Wyświetla się na publicznym profilu księgowego
 */

import { useState, useEffect } from "react";
import { Modal } from "../../../../components/Modal";
import { supabase } from "../../../lib/supabase";
import { toast } from "sonner";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  UserPlus,
  Users,
  Plus,
  Check,
  Mail,
  ChevronDown,
  Loader2,
} from "lucide-react";

interface AccountantTeam {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  color_hex: string | null;
  avatar_url: string | null;
  max_members: number | null;
  is_active: boolean | null;
}

interface InviteToAccountantTeamButtonProps {
  targetAccountantId: string;
  targetAccountantEmail: string;
  targetAccountantName: string;
  className?: string;
}

export function InviteToAccountantTeamButton({
  targetAccountantId,
  targetAccountantEmail,
  targetAccountantName,
  className = "",
}: InviteToAccountantTeamButtonProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<AccountantTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [proposedRole, setProposedRole] = useState<
    "member" | "admin" | "viewer"
  >("member");
  const [myAccountantId, setMyAccountantId] = useState<string | null>(null);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [existingInvites, setExistingInvites] = useState<
    Record<string, boolean>
  >({});
  const [existingMembers, setExistingMembers] = useState<
    Record<string, boolean>
  >({});

  // Only show for accountants
  if (user?.role !== "accountant") {
    return null;
  }

  // Don't show if viewing own profile
  useEffect(() => {
    const loadMyAccountantId = async () => {
      if (!user?.id) return;

      const { data } = await supabase
        .from("accountants")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (data) {
        setMyAccountantId(data.id);

        // Don't show button if viewing own profile
        if (data.id === targetAccountantId) {
          return;
        }
      }
    };
    loadMyAccountantId();
  }, [user?.id, targetAccountantId]);

  // Load my teams when modal opens
  useEffect(() => {
    if (isOpen && myAccountantId) {
      loadMyTeams();
    }
  }, [isOpen, myAccountantId]);

  const loadMyTeams = async () => {
    if (!myAccountantId) return;

    setLoading(true);
    try {
      // Get teams where I'm owner or admin
      const { data: ownedTeams, error: ownedError } = await supabase
        .from("accountant_teams")
        .select("*")
        .eq("owner_id", myAccountantId)
        .eq("is_active", true);

      if (ownedError) throw ownedError;

      // Get teams where I'm admin (using accountant_team_memberships)
      const { data: adminMemberships, error: memberError } = await supabase
        .from("accountant_team_memberships")
        .select(
          `
          team_id,
          accountant_teams!accountant_team_memberships_team_id_fkey(*)
        `
        )
        .eq("accountant_id", myAccountantId)
        .eq("role", "admin")
        .eq("status", "active");

      const adminTeams =
        adminMemberships?.map((m: any) => m.accountant_teams).filter(Boolean) ||
        [];

      // Combine and dedupe
      const allTeams = [...(ownedTeams || []), ...adminTeams];
      const uniqueTeams = allTeams.filter(
        (team, index, self) => index === self.findIndex((t) => t.id === team.id)
      );

      setTeams(uniqueTeams);

      // Check existing invites and memberships for each team
      const invites: Record<string, boolean> = {};
      const members: Record<string, boolean> = {};

      for (const team of uniqueTeams) {
        // Check if already invited
        const { data: existingInvite } = await supabase
          .from("accountant_team_invitations")
          .select("id")
          .eq("team_id", team.id)
          .eq("invited_accountant_id", targetAccountantId)
          .eq("status", "pending")
          .maybeSingle();

        invites[team.id] = !!existingInvite;

        // Check if already a member (using accountant_team_memberships)
        const { data: existingMember } = await supabase
          .from("accountant_team_memberships")
          .select("id")
          .eq("team_id", team.id)
          .eq("accountant_id", targetAccountantId)
          .eq("status", "active")
          .maybeSingle();

        members[team.id] = !!existingMember;
      }

      setExistingInvites(invites);
      setExistingMembers(members);
    } catch (err) {
      console.error("Error loading teams:", err);
      toast.error("Nie udało się załadować zespołów");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!myAccountantId || !newTeamName.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("accountant_teams")
        .insert({
          owner_id: myAccountantId,
          name: newTeamName.trim(),
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Utworzono zespół "${newTeamName}"`);
      setNewTeamName("");
      setShowCreateTeam(false);
      await loadMyTeams();
      setSelectedTeamId(data.id);
    } catch (err: any) {
      console.error("Error creating team:", err);
      toast.error(err.message || "Nie udało się utworzyć zespołu");
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!selectedTeamId || !user?.id) return;

    setLoading(true);
    try {
      // Send invitation
      const { error } = await supabase
        .from("accountant_team_invitations")
        .insert({
          team_id: selectedTeamId,
          invited_by: user.id,
          invited_accountant_id: targetAccountantId,
          invited_email: targetAccountantEmail,
          message: message.trim() || null,
          proposed_role: proposedRole,
          status: "pending",
        });

      if (error) throw error;

      const teamName =
        teams.find((t) => t.id === selectedTeamId)?.name || "zespołu";
      toast.success(
        `✅ Wysłano zaproszenie do ${targetAccountantName} do zespołu "${teamName}"`
      );

      setIsOpen(false);
      setMessage("");
      setSelectedTeamId(null);
      setProposedRole("member");
    } catch (err: any) {
      console.error("Error sending invite:", err);
      if (err.message?.includes("duplicate")) {
        toast.error("Zaproszenie już zostało wysłane");
      } else {
        toast.error(err.message || "Nie udało się wysłać zaproszenia");
      }
    } finally {
      setLoading(false);
    }
  };

  // Don't render if viewing own profile
  if (myAccountantId === targetAccountantId) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`
          inline-flex items-center gap-2 px-4 py-2 
          bg-indigo-600 hover:bg-indigo-700 text-white 
          rounded-lg transition-all duration-200 
          shadow-sm hover:shadow-md
          font-medium
          ${className}
        `}
      >
        <UserPlus className="w-4 h-4" />
        <span>Zaproś do zespołu</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Zaproś ${targetAccountantName} do zespołu`}
        size="md"
      >
        <div className="space-y-6">
          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800">
                  Zaproszenie zostanie wysłane do{" "}
                  <strong>{targetAccountantName}</strong>. Po akceptacji,
                  będziecie mogli współpracować w ramach wspólnego zespołu.
                </p>
              </div>
            </div>
          </div>

          {loading && teams.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : (
            <>
              {/* Team selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wybierz zespół <span className="text-red-500">*</span>
                </label>

                {teams.length === 0 && !showCreateTeam ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Users className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-3">
                      Nie masz jeszcze żadnego zespołu
                    </p>
                    <button
                      onClick={() => setShowCreateTeam(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      <Plus className="w-4 h-4" />
                      Utwórz pierwszy zespół
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {teams.map((team) => {
                      const isInvited = existingInvites[team.id];
                      const isMember = existingMembers[team.id];
                      const isDisabled = isInvited || isMember;

                      return (
                        <label
                          key={team.id}
                          className={`
                            flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                            ${
                              isDisabled
                                ? "bg-gray-100 opacity-60 cursor-not-allowed"
                                : ""
                            }
                            ${
                              selectedTeamId === team.id
                                ? "border-indigo-500 bg-indigo-50"
                                : "border-gray-200 hover:border-indigo-300"
                            }
                          `}
                        >
                          <input
                            type="radio"
                            name="team"
                            value={team.id}
                            checked={selectedTeamId === team.id}
                            onChange={() =>
                              !isDisabled && setSelectedTeamId(team.id)
                            }
                            disabled={isDisabled}
                            className="text-indigo-600"
                          />
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{
                              backgroundColor: team.color_hex || "#6366F1",
                            }}
                          >
                            {team.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {team.name}
                            </p>
                            {team.description && (
                              <p className="text-xs text-gray-500 truncate">
                                {team.description}
                              </p>
                            )}
                          </div>
                          {isMember && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" /> Już w zespole
                            </span>
                          )}
                          {isInvited && !isMember && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1">
                              <Mail className="w-3 h-3" /> Zaproszenie wysłane
                            </span>
                          )}
                        </label>
                      );
                    })}

                    {/* Create new team button */}
                    {!showCreateTeam && (
                      <button
                        onClick={() => setShowCreateTeam(true)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Utwórz nowy zespół</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Create team form */}
                {showCreateTeam && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Nowy zespół
                    </h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        placeholder="Nazwa zespołu..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <button
                        onClick={handleCreateTeam}
                        disabled={!newTeamName.trim() || loading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Utwórz
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateTeam(false);
                          setNewTeamName("");
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Anuluj
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Role selection */}
              {selectedTeamId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rola w zespole
                  </label>
                  <select
                    value={proposedRole}
                    onChange={(e) =>
                      setProposedRole(
                        e.target.value as "member" | "admin" | "viewer"
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="member">
                      Członek - może edytować zadania i wiadomości
                    </option>
                    <option value="admin">
                      Administrator - może zapraszać i zarządzać zespołem
                    </option>
                    <option value="viewer">Obserwator - tylko podgląd</option>
                  </select>
                </div>
              )}

              {/* Message */}
              {selectedTeamId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wiadomość (opcjonalna)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Napisz krótką wiadomość do zapraszanej osoby..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Anuluj
            </button>
            <button
              onClick={handleSendInvite}
              disabled={!selectedTeamId || loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <Mail className="w-4 h-4" />
              Wyślij zaproszenie
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default InviteToAccountantTeamButton;

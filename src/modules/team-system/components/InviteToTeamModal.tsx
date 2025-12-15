/**
 * ================================================================
 * INVITE TO TEAM MODAL
 * ================================================================
 * Modal do zapraszania pracowników/firm sprzątających do zespołu
 */

import { useState, useEffect } from "react";
import { Modal } from "../../../../components/Modal";
import { supabase } from "../../../lib/supabase";
import { toast } from "sonner";

// Tymczasowo kopiujemy typy tutaj - problem z importem
const db = supabase as any;

interface EmployerTeam {
  id: string;
  employer_id: string;
  name: string;
  description: string | null;
  color_hex: string;
  icon: string;
  is_active: boolean;
  max_members: number;
  created_at: string;
  members_count?: number;
}

type InviteeType = "worker" | "cleaning_company";

// Service functions inline (temporary fix)
async function getEmployerTeams(employerId: string): Promise<EmployerTeam[]> {
  const { data, error } = await db
    .from("employer_teams")
    .select("*")
    .eq("employer_id", employerId)
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data || [];
}

async function createTeam(
  employerId: string,
  teamName: string
): Promise<EmployerTeam> {
  const { data, error } = await db
    .from("employer_teams")
    .insert({
      employer_id: employerId,
      name: teamName,
      is_active: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function sendTeamInvitation(
  teamId: string,
  invitedByProfileId: string,
  inviteeId: string,
  inviteeType: InviteeType,
  message?: string,
  role?: string
): Promise<void> {
  const insertData: any = {
    team_id: teamId,
    invited_by_profile_id: invitedByProfileId,
    role: role || "member",
    message: message,
    status: "pending",
  };
  if (inviteeType === "worker") {
    insertData.worker_id = inviteeId;
  } else {
    insertData.cleaning_company_id = inviteeId;
  }
  const { error } = await db
    .from("employer_team_invitations")
    .insert(insertData);
  if (error) throw error;
}

async function isMemberInTeam(
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
  const { data } = await query.limit(1);
  return (data?.length || 0) > 0;
}

async function hasPendingInvitation(
  teamId: string,
  memberId: string,
  memberType: InviteeType
): Promise<boolean> {
  const query = db
    .from("employer_team_invitations")
    .select("id")
    .eq("team_id", teamId)
    .eq("status", "pending");
  if (memberType === "worker") {
    query.eq("worker_id", memberId);
  } else {
    query.eq("cleaning_company_id", memberId);
  }
  const { data } = await query.limit(1);
  return (data?.length || 0) > 0;
}

interface InviteToTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  employerId: string;
  inviterProfileId: string;
  inviteeId: string;
  inviteeType: InviteeType;
  inviteeName: string;
  inviteeAvatar?: string;
}

export function InviteToTeamModal({
  isOpen,
  onClose,
  employerId,
  inviterProfileId,
  inviteeId,
  inviteeType,
  inviteeName,
  inviteeAvatar,
}: InviteToTeamModalProps) {
  const [teams, setTeams] = useState<EmployerTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [proposedRole, setProposedRole] = useState<
    "member" | "leader" | "supervisor"
  >("member");
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [teamStatuses, setTeamStatuses] = useState<
    Record<string, { isMember: boolean; hasPending: boolean }>
  >({});

  // Nowy zespół
  const [showNewTeamForm, setShowNewTeamForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);

  // Pobierz zespoły pracodawcy
  useEffect(() => {
    if (isOpen && employerId) {
      loadTeams();
    }
  }, [isOpen, employerId]);

  // Sprawdź statusy dla każdego zespołu
  useEffect(() => {
    if (teams.length > 0 && inviteeId) {
      checkAllTeamStatuses();
    }
  }, [teams, inviteeId, inviteeType]);

  async function loadTeams() {
    setLoadingTeams(true);
    try {
      const data = await getEmployerTeams(employerId);
      setTeams(data);
      if (data.length > 0) {
        setSelectedTeamId(data[0].id);
      }
    } catch (error) {
      console.error("Failed to load teams:", error);
      toast.error("Nie udało się pobrać zespołów");
    } finally {
      setLoadingTeams(false);
    }
  }

  async function checkAllTeamStatuses() {
    const statuses: Record<string, { isMember: boolean; hasPending: boolean }> =
      {};

    for (const team of teams) {
      try {
        const [isMember, hasPending] = await Promise.all([
          isMemberInTeam(team.id, inviteeId, inviteeType),
          hasPendingInvitation(team.id, inviteeId, inviteeType),
        ]);
        statuses[team.id] = { isMember, hasPending };
      } catch (error) {
        statuses[team.id] = { isMember: false, hasPending: false };
      }
    }

    setTeamStatuses(statuses);
  }

  async function handleCreateTeam() {
    if (!newTeamName.trim()) {
      toast.error("Podaj nazwę zespołu");
      return;
    }

    setCreatingTeam(true);
    try {
      const newTeam = await createTeam(employerId, newTeamName.trim());
      setTeams((prev) => [newTeam, ...prev]);
      setSelectedTeamId(newTeam.id);
      setNewTeamName("");
      setShowNewTeamForm(false);
      toast.success("Zespół utworzony!");
    } catch (error) {
      console.error("Failed to create team:", error);
      toast.error("Nie udało się utworzyć zespołu");
    } finally {
      setCreatingTeam(false);
    }
  }

  async function handleSendInvitation() {
    if (!selectedTeamId) {
      toast.error("Wybierz zespół");
      return;
    }

    const status = teamStatuses[selectedTeamId];
    if (status?.isMember) {
      toast.error("Ta osoba jest już w tym zespole");
      return;
    }
    if (status?.hasPending) {
      toast.error("Zaproszenie do tego zespołu już zostało wysłane");
      return;
    }

    setLoading(true);
    try {
      await sendTeamInvitation(
        selectedTeamId,
        inviterProfileId,
        inviteeId,
        inviteeType,
        message || undefined,
        proposedRole
      );
      toast.success(`Zaproszenie wysłane do ${inviteeName}!`);
      onClose();
    } catch (error) {
      console.error("Failed to send invitation:", error);
      toast.error("Nie udało się wysłać zaproszenia");
    } finally {
      setLoading(false);
    }
  }

  const selectedTeamStatus = teamStatuses[selectedTeamId];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Zaproś do ekipy">
      <div className="space-y-6">
        {/* Invitee info */}
        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
          {inviteeAvatar ? (
            <img
              src={inviteeAvatar}
              alt={inviteeName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center">
              <span className="text-blue-700 font-bold text-lg">
                {inviteeName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{inviteeName}</p>
            <p className="text-sm text-gray-600">
              {inviteeType === "worker" ? "Pracownik" : "Firma sprzątająca"}
            </p>
          </div>
        </div>

        {/* Teams list */}
        {loadingTeams ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-500 mt-2">Ładowanie zespołów...</p>
          </div>
        ) : teams.length === 0 && !showNewTeamForm ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Nie masz jeszcze żadnych zespołów
            </p>
            <button
              onClick={() => setShowNewTeamForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ➕ Utwórz pierwszy zespół
            </button>
          </div>
        ) : (
          <>
            {/* Team selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wybierz zespół
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {teams.map((team) => {
                  const status = teamStatuses[team.id];
                  const isDisabled = status?.isMember || status?.hasPending;

                  return (
                    <label
                      key={team.id}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors
                        ${
                          selectedTeamId === team.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }
                        ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                    >
                      <input
                        type="radio"
                        name="team"
                        value={team.id}
                        checked={selectedTeamId === team.id}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        disabled={isDisabled}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: team.color_hex + "30" }}
                      >
                        <span style={{ color: team.color_hex }}>👥</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{team.name}</p>
                        <p className="text-xs text-gray-500">
                          {team.members_count || 0} członków
                        </p>
                      </div>
                      {status?.isMember && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Już w zespole
                        </span>
                      )}
                      {status?.hasPending && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                          Oczekuje
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              {/* Create new team button */}
              {!showNewTeamForm && (
                <button
                  onClick={() => setShowNewTeamForm(true)}
                  className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  ➕ Utwórz nowy zespół
                </button>
              )}

              {/* New team form */}
              {showNewTeamForm && (
                <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Nazwa nowego zespołu..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleCreateTeam}
                      disabled={creatingTeam}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {creatingTeam ? "Tworzę..." : "Utwórz"}
                    </button>
                    <button
                      onClick={() => {
                        setShowNewTeamForm(false);
                        setNewTeamName("");
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Anuluj
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Role selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rola w zespole
              </label>
              <select
                value={proposedRole}
                onChange={(e) =>
                  setProposedRole(e.target.value as typeof proposedRole)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="member">👤 Członek zespołu</option>
                <option value="leader">⭐ Lider zespołu</option>
                <option value="supervisor">🔧 Nadzorca</option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wiadomość (opcjonalna)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Cześć ${
                  inviteeName.split(" ")[0]
                }, zapraszam Cię do współpracy w naszym zespole...`}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Warning if already member or pending */}
            {selectedTeamStatus?.isMember && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                ✅ {inviteeName} jest już członkiem tego zespołu
              </div>
            )}
            {selectedTeamStatus?.hasPending && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
                ⏳ Zaproszenie do tego zespołu już zostało wysłane i oczekuje na
                odpowiedź
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={handleSendInvitation}
                disabled={
                  loading ||
                  !selectedTeamId ||
                  selectedTeamStatus?.isMember ||
                  selectedTeamStatus?.hasPending
                }
                className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                    Wysyłam...
                  </span>
                ) : (
                  "📨 Wyślij zaproszenie"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

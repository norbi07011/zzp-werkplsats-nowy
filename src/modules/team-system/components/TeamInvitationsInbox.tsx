/**
 * ================================================================
 * TEAM INVITATIONS INBOX
 * ================================================================
 * Panel do przeglądania i obsługi zaproszeń do zespołów
 * dla pracowników i firm sprzątających
 */

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { toast } from "sonner";

const db = supabase as any;

interface TeamInvitation {
  id: string;
  team_id: string;
  role: string;
  proposed_role?: string;
  message?: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  expires_at?: string;
  team?: {
    id: string;
    name: string;
    description?: string;
    color_hex?: string;
    employer?: {
      company_name?: string;
    };
  };
}

// Inline service functions
async function getReceivedInvitationsForWorker(
  workerId: string
): Promise<TeamInvitation[]> {
  const { data, error } = await db
    .from("employer_team_invitations")
    .select(
      `
      *,
      employer_teams (
        id, name, description,
        employers (company_name)
      )
    `
    )
    .eq("worker_id", workerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((inv: any) => ({
    ...inv,
    team: inv.employer_teams,
  }));
}

async function getReceivedInvitationsForCleaningCompany(
  companyId: string
): Promise<TeamInvitation[]> {
  const { data, error } = await db
    .from("employer_team_invitations")
    .select(
      `
      *,
      employer_teams (
        id, name, description,
        employers (company_name)
      )
    `
    )
    .eq("cleaning_company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((inv: any) => ({
    ...inv,
    team: inv.employer_teams,
  }));
}

async function acceptInvitation(invitationId: string): Promise<void> {
  const { error } = await db
    .from("employer_team_invitations")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", invitationId);
  if (error) throw error;
}

async function declineInvitation(
  invitationId: string,
  reason?: string
): Promise<void> {
  const { error } = await db
    .from("employer_team_invitations")
    .update({
      status: "declined",
      responded_at: new Date().toISOString(),
      decline_reason: reason,
    })
    .eq("id", invitationId);
  if (error) throw error;
}

interface TeamInvitationsInboxProps {
  userId: string;
  userType: "worker" | "cleaning_company";
  entityId: string; // worker.id or cleaning_company.id
}

export function TeamInvitationsInbox({
  userId,
  userType,
  entityId,
}: TeamInvitationsInboxProps) {
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
  }, [entityId, userType]);

  async function loadInvitations() {
    setLoading(true);
    try {
      const data =
        userType === "worker"
          ? await getReceivedInvitationsForWorker(entityId)
          : await getReceivedInvitationsForCleaningCompany(entityId);

      // Filtruj tylko pending
      setInvitations(
        data.filter((inv: TeamInvitation) => inv.status === "pending")
      );
    } catch (error) {
      console.error("Failed to load invitations:", error);
      toast.error("Nie udało się pobrać zaproszeń");
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(invitationId: string) {
    setProcessingId(invitationId);
    try {
      await acceptInvitation(invitationId);
      toast.success(
        "✅ Zaproszenie zaakceptowane! Jesteś teraz członkiem zespołu."
      );
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch (error) {
      console.error("Failed to accept invitation:", error);
      toast.error("Nie udało się zaakceptować zaproszenia");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDecline(invitationId: string) {
    setProcessingId(invitationId);
    try {
      await declineInvitation(invitationId);
      toast.success("Zaproszenie odrzucone");
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch (error) {
      console.error("Failed to decline invitation:", error);
      toast.error("Nie udało się odrzucić zaproszenia");
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📭</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Brak zaproszeń
          </h3>
          <p className="text-gray-600">
            Nie masz żadnych oczekujących zaproszeń do zespołów
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span>📨</span>
          Zaproszenia do zespołów
          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
            {invitations.length}
          </span>
        </h2>
      </div>

      <div className="divide-y">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start gap-4">
              {/* Team Icon */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor:
                    (invitation.team?.color_hex || "#3B82F6") + "30",
                  color: invitation.team?.color_hex || "#3B82F6",
                }}
              >
                <span className="text-2xl">👥</span>
              </div>

              {/* Invitation Details */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900">
                  {invitation.team?.name || "Nieznany zespół"}
                </h3>

                <p className="text-gray-600 mt-1">
                  Zaproszenie od pracodawcy do dołączenia do zespołu
                </p>

                {invitation.message && (
                  <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                    <p className="text-gray-700 text-sm italic">
                      "{invitation.message}"
                    </p>
                  </div>
                )}

                {invitation.proposed_role && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      Proponowana rola:
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                      {invitation.proposed_role === "leader" && "⭐ Lider"}
                      {invitation.proposed_role === "supervisor" &&
                        "🔧 Nadzorca"}
                      {invitation.proposed_role === "member" && "👤 Członek"}
                    </span>
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-2">
                  Otrzymano:{" "}
                  {new Date(invitation.created_at).toLocaleDateString("pl-PL", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                {/* Actions */}
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => handleAccept(invitation.id)}
                    disabled={processingId === invitation.id}
                    className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {processingId === invitation.id ? (
                      <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : (
                      <span>✓</span>
                    )}
                    Akceptuj
                  </button>
                  <button
                    onClick={() => handleDecline(invitation.id)}
                    disabled={processingId === invitation.id}
                    className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    <span>✗</span>
                    Odrzuć
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Wersja compakowa do wyświetlenia w headerze/powiadomieniach
 */
export function TeamInvitationsBadge({
  count,
  onClick,
}: {
  count: number;
  onClick?: () => void;
}) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      title={`${count} oczekujących zaproszeń do zespołów`}
    >
      <span className="text-xl">👥</span>
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
        {count > 9 ? "9+" : count}
      </span>
    </button>
  );
}

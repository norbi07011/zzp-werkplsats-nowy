/**
 * PendingInvitations - Display and manage received team invitations
 * Shows in accountant dashboard sidebar or notification area
 */

import React, { useState, useEffect } from "react";
import {
  Users,
  Mail,
  Check,
  X,
  Clock,
  Loader2,
  AlertCircle,
  UserPlus,
  ChevronRight,
  Bell,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import accountantTeamService, {
  AccountantTeamInvitationWithDetails,
} from "../services/accountantTeamService";

interface PendingInvitationsProps {
  accountantId: string;
  onInvitationAccepted?: (teamId: string) => void;
  compact?: boolean; // For sidebar/notification badge view
}

export const PendingInvitations: React.FC<PendingInvitationsProps> = ({
  accountantId,
  onInvitationAccepted,
  compact = false,
}) => {
  const [invitations, setInvitations] = useState<
    AccountantTeamInvitationWithDetails[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showDeclineModal, setShowDeclineModal] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  // Load invitations
  useEffect(() => {
    loadInvitations();
  }, [accountantId]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await accountantTeamService.getReceivedInvitations(
        accountantId
      );
      setInvitations(data);
    } catch (err) {
      console.error("Error loading invitations:", err);
      setError("Nie udało się załadować zaproszeń");
    } finally {
      setLoading(false);
    }
  };

  // Accept invitation
  const handleAccept = async (
    invitation: AccountantTeamInvitationWithDetails
  ) => {
    try {
      setProcessingId(invitation.id);
      await accountantTeamService.acceptInvitation(invitation.id);

      setInvitations((prev) => prev.filter((inv) => inv.id !== invitation.id));
      toast.success(`🎉 Dołączyłeś do zespołu "${invitation.team?.name}"`);

      if (onInvitationAccepted) {
        onInvitationAccepted(invitation.team_id);
      }
    } catch (err: any) {
      console.error("Error accepting invitation:", err);
      toast.error(err.message || "Nie udało się przyjąć zaproszenia");
    } finally {
      setProcessingId(null);
    }
  };

  // Decline invitation
  const handleDecline = async (invitationId: string) => {
    try {
      setProcessingId(invitationId);
      await accountantTeamService.declineInvitation(
        invitationId,
        declineReason || undefined
      );

      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
      setShowDeclineModal(null);
      setDeclineReason("");
      toast.success("Zaproszenie odrzucone");
    } catch (err) {
      console.error("Error declining invitation:", err);
      toast.error("Nie udało się odrzucić zaproszenia");
    } finally {
      setProcessingId(null);
    }
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const days = Math.ceil(
      (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  // Compact view (for sidebar badge)
  if (compact) {
    if (loading) {
      return (
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      );
    }

    if (invitations.length === 0) {
      return null;
    }

    return (
      <div className="relative">
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
          {invitations.length}
        </div>
        <Bell className="w-5 h-5 text-slate-600" />
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-center gap-2 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Ładowanie zaproszeń...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-slate-600">{error}</p>
          <button
            onClick={loadInvitations}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
          >
            <RefreshCw className="w-4 h-4" />
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  // No invitations
  if (invitations.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
        <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-medium text-slate-600 mb-1">Brak zaproszeń</h3>
        <p className="text-sm text-slate-500">
          Nie masz żadnych oczekujących zaproszeń do zespołów
        </p>
      </div>
    );
  }

  // Full view with invitations
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Mail className="w-5 h-5 text-indigo-600" />
          Zaproszenia do zespołów
          <span className="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
            {invitations.length}
          </span>
        </h3>
        <button
          onClick={loadInvitations}
          className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
          title="Odśwież"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {invitations.map((invitation) => {
          const daysLeft = getDaysUntilExpiry(invitation.expires_at);
          const isExpiringSoon = daysLeft !== null && daysLeft <= 2;
          const isProcessing = processingId === invitation.id;

          return (
            <div
              key={invitation.id}
              className={`bg-white rounded-xl border p-4 transition-all ${
                isExpiringSoon
                  ? "border-amber-300 bg-amber-50"
                  : "border-slate-200 hover:border-indigo-200 hover:shadow-sm"
              }`}
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                  style={{
                    backgroundColor: invitation.team?.color_hex || "#6366F1",
                  }}
                >
                  {invitation.team?.name?.charAt(0) || "T"}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-800 truncate">
                    {invitation.team?.name || "Nieznany zespół"}
                  </h4>
                  <p className="text-sm text-slate-500">
                    Zaproszenie od{" "}
                    <span className="font-medium text-slate-700">
                      {invitation.inviter?.full_name || "Nieznany"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Message */}
              {invitation.message && (
                <div className="mb-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 italic">
                  "{invitation.message}"
                </div>
              )}

              {/* Meta info */}
              <div className="flex flex-wrap gap-3 mb-4 text-sm">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Users className="w-4 h-4" />
                  Rola:{" "}
                  <span className="font-medium text-slate-700">
                    {invitation.proposed_role || "Członek"}
                  </span>
                </span>
                <span
                  className={`flex items-center gap-1.5 ${
                    isExpiringSoon ? "text-amber-600" : "text-slate-500"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  {daysLeft !== null ? (
                    <>
                      Wygasa za{" "}
                      <span className="font-medium">
                        {daysLeft} {daysLeft === 1 ? "dzień" : "dni"}
                      </span>
                    </>
                  ) : (
                    "Wygasa wkrótce"
                  )}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(invitation)}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Dołącz do zespołu
                </button>
                <button
                  onClick={() => setShowDeclineModal(invitation.id)}
                  disabled={isProcessing}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Decline Modal */}
      {showDeclineModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) =>
            e.target === e.currentTarget && setShowDeclineModal(null)
          }
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Odrzuć zaproszenie
            </h3>
            <p className="text-slate-600 mb-4">
              Czy na pewno chcesz odrzucić to zaproszenie? Możesz podać powód
              (opcjonalnie).
            </p>

            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg resize-none mb-4"
              rows={3}
              placeholder="Powód odrzucenia (opcjonalnie)..."
              disabled={processingId === showDeclineModal}
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeclineModal(null);
                  setDeclineReason("");
                }}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
                disabled={processingId === showDeclineModal}
              >
                Anuluj
              </button>
              <button
                onClick={() => handleDecline(showDeclineModal)}
                disabled={processingId === showDeclineModal}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processingId === showDeclineModal ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                Odrzuć
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingInvitations;

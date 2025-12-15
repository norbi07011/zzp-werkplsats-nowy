import React from "react";
import { useInvites, type ProjectInvite } from "../hooks/useInvites";
import { useAuth } from "../contexts/AuthContext";
import { InviteMemberModal } from "./InviteMemberModal";










interface InvitesManagerProps {
  projectId?: string;
  projectName?: string;
  showInviteButton?: boolean;
}

export function InvitesManager({
  projectId,
  projectName,
  showInviteButton = true,
}: InvitesManagerProps) {
  const { user } = useAuth();
  const {
    sentInvites,
    receivedInvites,
    loading,
    error,
    acceptInvite,
    rejectInvite,
    cancelInvite,
    resendInvite,
  } = useInvites(projectId);

  const [showInviteModal, setShowInviteModal] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const handleAccept = async (inviteId: string) => {
    setActionLoading(inviteId);
    try {
      await acceptInvite(inviteId);
    } catch (err) {
      console.error("Failed to accept invite:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (inviteId: string) => {
    setActionLoading(inviteId);
    try {
      await rejectInvite(inviteId);
    } catch (err) {
      console.error("Failed to reject invite:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (inviteId: string) => {
    if (!confirm("Czy na pewno chcesz anulować to zaproszenie?")) return;

    setActionLoading(inviteId);
    try {
      await cancelInvite(inviteId);
    } catch (err) {
      console.error("Failed to cancel invite:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResend = async (inviteId: string) => {
    setActionLoading(inviteId);
    try {
      await resendInvite(inviteId);
    } catch (err) {
      console.error("Failed to resend invite:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded border border-yellow-200">
            <Clock className="w-3 h-3" />
            Oczekuje
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded border border-green-200">
            <Check className="w-3 h-3" />
            Zaakceptowane
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded border border-red-200">
            <X className="w-3 h-3" />
            Odrzucone
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded border border-gray-200">
            <Clock className="w-3 h-3" />
            Wygasłe
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Zaproszenia</h3>
        {showInviteButton &&
          projectId &&
          (user?.role === "employer" || user?.role === "accountant") && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Zaproś członka
            </button>
          )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Received Invites */}
      {receivedInvites.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Otrzymane zaproszenia</h4>
          {receivedInvites.map((invite) => (
            <div
              key={invite.id}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <h5 className="font-medium text-gray-900">
                      Zaproszenie do projektu
                    </h5>
                    {getStatusBadge(invite.status)}
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Rola:</strong> {invite.role}
                  </p>
                  {invite.invite_message && (
                    <p className="text-sm text-gray-600 italic mb-2">
                      "{invite.invite_message}"
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Wysłane: {formatDate(invite.created_at)}
                    {" • "}
                    Wygasa: {formatDate(invite.expires_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAccept(invite.id)}
                    disabled={actionLoading === invite.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    Akceptuj
                  </button>
                  <button
                    onClick={() => handleReject(invite.id)}
                    disabled={actionLoading === invite.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Odrzuć
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sent Invites */}
      {sentInvites.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Wysłane zaproszenia</h4>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                    E-mail
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                    Rola
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                    Wysłane
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                    Wygasa
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sentInvites.map((invite) => (
                  <tr key={invite.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {invite.metadata?.type === "cleaning_company" ? (
                          <Building2 className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Mail className="w-4 h-4 text-gray-400" />
                        )}
                        <div>
                          <span className="text-sm text-gray-900">
                            {invite.invitee_email}
                          </span>
                          {invite.metadata?.type === "cleaning_company" && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                Firma: {invite.metadata.company_name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">
                        {invite.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(invite.status)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {new Date(invite.created_at).toLocaleDateString(
                          "pl-PL"
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm ${
                          isExpired(invite.expires_at)
                            ? "text-red-600 font-medium"
                            : "text-gray-600"
                        }`}
                      >
                        {new Date(invite.expires_at).toLocaleDateString(
                          "pl-PL"
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {invite.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleResend(invite.id)}
                              disabled={actionLoading === invite.id}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="Wyślij ponownie"
                            >
                              <RefreshCw className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => handleCancel(invite.id)}
                              disabled={actionLoading === invite.id}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="Anuluj zaproszenie"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {sentInvites.length === 0 && receivedInvites.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-gray-900 mb-1">
            Brak zaproszeń
          </h4>
          <p className="text-gray-600 mb-4">
            {showInviteButton && projectId
              ? "Zaproś członków do projektu, aby rozpocząć współpracę"
              : "Nie masz żadnych zaproszeń"}
          </p>
          {showInviteButton && projectId && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Send className="w-4 h-4" />
              Wyślij pierwsze zaproszenie
            </button>
          )}
        </div>
      )}

      {/* Invite Modal */}
      {projectId && (
        <InviteMemberModal
          projectId={projectId}
          projectName={projectName}
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            // Invites will refresh automatically via realtime subscription
          }}
        />
      )}
    </div>
  );
}

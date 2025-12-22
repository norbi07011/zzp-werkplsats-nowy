import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../../contexts/AuthContext";
import { toast } from "sonner";
import { Users, Mail, Clock, Check, X, UserPlus } from "lucide-react";

interface TeamInvitation {
  id: string;
  team_id: string;
  invited_by: string;
  invited_accountant_id: string;
  invited_email: string;
  message: string | null;
  proposed_role: string;
  status: "pending" | "accepted" | "declined" | "expired";
  expires_at: string;
  created_at: string;
  team?: {
    id: string;
    name: string;
    description: string | null;
  };
  inviter?: {
    id: string;
    profile_id: string;
    profiles?: {
      full_name: string | null;
      avatar_url: string | null;
    };
  };
}

export function PendingTeamInvitations() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [myAccountantId, setMyAccountantId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadMyAccountantId();
    }
  }, [user?.id]);

  useEffect(() => {
    if (myAccountantId) {
      loadPendingInvitations();
    }
  }, [myAccountantId]);

  const loadMyAccountantId = async () => {
    try {
      const { data, error } = await supabase
        .from("accountants")
        .select("id")
        .eq("profile_id", user!.id)
        .single();

      if (error) throw error;
      setMyAccountantId(data.id);
    } catch (error) {
      console.error("Error loading accountant ID:", error);
      setLoading(false);
    }
  };

  const loadPendingInvitations = async () => {
    if (!myAccountantId) return;

    try {
      setLoading(true);

      // Get pending invitations where I'm the invited accountant
      const { data, error } = await supabase
        .from("accountant_team_invitations")
        .select(
          `
          *,
          team:accountant_teams(id, name, description),
          inviter:accountants!accountant_team_invitations_invited_by_fkey(
            id, 
            profile_id,
            profiles(full_name, avatar_url)
          )
        `
        )
        .eq("invited_accountant_id", myAccountantId)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading invitations:", error);
        // Try simpler query without joins
        const { data: simpleData, error: simpleError } = await supabase
          .from("accountant_team_invitations")
          .select("*")
          .eq("invited_accountant_id", myAccountantId)
          .eq("status", "pending")
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false });

        if (simpleError) throw simpleError;
        setInvitations(simpleData || []);
      } else {
        setInvitations(data || []);
      }
    } catch (error) {
      console.error("Error loading pending invitations:", error);
      toast.error("Nie udało się załadować zaproszeń");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitation: TeamInvitation) => {
    if (!myAccountantId) return;

    try {
      setProcessing(invitation.id);

      // 1. Update invitation status
      const { error: updateError } = await supabase
        .from("accountant_team_invitations")
        .update({
          status: "accepted",
          responded_at: new Date().toISOString(),
        })
        .eq("id", invitation.id);

      if (updateError) throw updateError;

      // 2. Add membership
      const { error: membershipError } = await supabase
        .from("accountant_team_memberships")
        .insert({
          team_id: invitation.team_id,
          accountant_id: myAccountantId,
          role: invitation.proposed_role || "member",
          invited_by: invitation.invited_by,
        });

      if (membershipError) throw membershipError;

      toast.success(
        "✅ Zaproszenie zostało zaakceptowane! Jesteś teraz członkiem zespołu."
      );

      // Remove from list
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitation.id));
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error("Nie udało się zaakceptować zaproszenia");
    } finally {
      setProcessing(null);
    }
  };

  const handleDeclineInvitation = async (
    invitation: TeamInvitation,
    reason?: string
  ) => {
    try {
      setProcessing(invitation.id);

      const { error } = await supabase
        .from("accountant_team_invitations")
        .update({
          status: "declined",
          responded_at: new Date().toISOString(),
          decline_reason: reason || null,
        })
        .eq("id", invitation.id);

      if (error) throw error;

      toast.success("Zaproszenie zostało odrzucone");

      // Remove from list
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitation.id));
    } catch (error) {
      console.error("Error declining invitation:", error);
      toast.error("Nie udało się odrzucić zaproszenia");
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} dni, ${hours} godz.`;
    }
    return `${hours} godz.`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return null; // Don't show anything if no pending invitations
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-sm p-6 border border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
          <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Zaproszenia do zespołów ({invitations.length})
        </h3>
      </div>

      <div className="space-y-4">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {invitation.team?.name || "Zespół księgowych"}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                    {invitation.proposed_role === "admin"
                      ? "Administrator"
                      : "Członek"}
                  </span>
                </div>

                {invitation.team?.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {invitation.team.description}
                  </p>
                )}

                {invitation.message && (
                  <div className="flex items-start gap-2 mb-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                      "{invitation.message}"
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Wysłano: {formatDate(invitation.created_at)}
                  </span>
                  <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                    <Clock className="w-3 h-3" />
                    Wygasa za: {getTimeRemaining(invitation.expires_at)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAcceptInvitation(invitation)}
                  disabled={processing === invitation.id}
                  className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {processing === invitation.id ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Akceptuj
                </button>
                <button
                  onClick={() => handleDeclineInvitation(invitation)}
                  disabled={processing === invitation.id}
                  className="flex items-center gap-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Odrzuć
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState } from "react";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export interface Project {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  status: "active" | "completed" | "paused";
  created_at: string;
}

/**
 * ✅ Hook do wysyłania ZAPROSZEŃ do projektów
 *
 * LOGIKA BIZNESOWA:
 * 1. Użytkownik klika "Dodaj do drużyny"
 * 2. System wysyła zaproszenie do project_invites
 * 3. Zaproszony użytkownik dostaje powiadomienie
 * 4. Po akceptacji - dodawany do project_members
 *
 * NIE dodajemy bezpośrednio do project_members!
 */
export function useAddTeamMember() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's projects
  const fetchMyProjects = async (): Promise<Project[]> => {
    if (!user?.id) return [];

    try {
      const { data, error: fetchError } = await supabase
        .from("project_communication_rooms")
        .select("id, name, description, created_by, is_archived, created_at")
        .eq("created_by", user.id)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err: any) {
      console.error("Error fetching projects:", err);
      setError(err.message);
      return [];
    }
  };

  // ✅ SEND INVITE (zamiast dodawać bezpośrednio do project_members)
  const sendInviteToProject = async (
    projectId: string,
    inviteeProfileId: string, // profile_id z tabeli workers/profiles
    role: "member" | "admin" | "owner" = "member",
    displayName?: string,
    avatarUrl?: string
  ) => {
    if (!user?.id) {
      throw new Error("Must be logged in to send team invites");
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Pobierz email użytkownika z profilu
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", inviteeProfileId)
        .single();

      if (profileError || !profileData?.email) {
        throw new Error(
          "Could not find user email. User must have a profile with email."
        );
      }

      // 2. Sprawdź czy już jest członkiem
      const { data: existingMember } = await supabase
        .from("project_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", inviteeProfileId)
        .single();

      if (existingMember) {
        throw new Error("User is already a member of this project");
      }

      // 3. Sprawdź czy już ma zaproszenie pending
      const { data: existingInvite } = await supabase
        .from("project_invites")
        .select("id, status")
        .eq("project_id", projectId)
        .eq("invitee_email", profileData.email)
        .eq("status", "pending")
        .single();

      if (existingInvite) {
        throw new Error("User already has a pending invite for this project");
      }

      // 4. Wygeneruj invite token
      const inviteToken = `invite_${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}`;

      // 5. Utwórz zaproszenie w project_invites
      const { data, error: insertError } = await supabase
        .from("project_invites")
        .insert({
          project_id: projectId,
          inviter_id: user.id,
          invitee_email: profileData.email,
          invitee_id: inviteeProfileId,
          role: role,
          invite_token: inviteToken,
          status: "pending",
          can_invite: role === "admin" || role === "owner",
          can_manage_project: role === "admin" || role === "owner",
          can_view_reports: true,
          invite_message: displayName
            ? `Zaproszenie do projektu od ${user.email}`
            : undefined,
          metadata: {
            display_name: displayName || profileData.full_name,
            avatar_url: avatarUrl,
          },
        })
        .select()
        .single();

      if (insertError) throw insertError;

      console.log("✅ Invite sent successfully:", data);

      // TODO: Wyślij email notification (Resend integration)
      console.log("📧 Email notification would be sent to:", profileData.email);

      setLoading(false);
      return data;
    } catch (err: any) {
      console.error("Error sending invite:", err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  // Check if user is already a member
  const isMemberOfProject = async (
    projectId: string,
    userId: string
  ): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from("project_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .single();

      return !!data;
    } catch (err) {
      return false;
    }
  };

  // ✅ NEW: Check if user has pending invite
  const hasPendingInvite = async (
    projectId: string,
    userEmail: string
  ): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from("project_invites")
        .select("id")
        .eq("project_id", projectId)
        .eq("invitee_email", userEmail)
        .eq("status", "pending")
        .single();

      return !!data;
    } catch (err) {
      return false;
    }
  };

  return {
    loading,
    error,
    fetchMyProjects,
    sendInviteToProject, // ✅ Renamed: teraz wysyła zaproszenia zamiast dodawać bezpośrednio
    isMemberOfProject,
    hasPendingInvite, // ✅ NEW: Sprawdza czy ma już zaproszenie
  };
}

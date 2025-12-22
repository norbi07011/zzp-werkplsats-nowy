/**
 * Accountant Team Notification Service
 * Powiadomienia push dla zespołu księgowych
 *
 * Funkcjonalności:
 * - Powiadomienia o nowych wiadomościach w czacie
 * - Przypomnienia o nadchodzących wydarzeniach
 * - Powiadomienia o przydzielonych zadaniach
 * - Push notifications na telefon
 */

import { supabase } from "@/lib/supabase";

// ============================================================================
// TYPES
// ============================================================================

export type TeamNotificationType =
  | "team_message"
  | "team_task_assigned"
  | "team_task_due"
  | "team_event_reminder"
  | "team_invitation"
  | "team_member_joined";

export interface TeamNotificationPayload {
  type: TeamNotificationType;
  title: string;
  message: string;
  teamId: string;
  teamName?: string;
  senderId?: string;
  senderName?: string;
  link?: string;
  data?: Record<string, any>;
  priority?: "low" | "medium" | "high" | "urgent";
}

// ============================================================================
// PUSH SUBSCRIPTION MANAGEMENT
// ============================================================================

/**
 * Zapisz subskrypcję push dla użytkownika
 */
export async function savePushSubscription(
  userId: string,
  subscription: PushSubscription
): Promise<boolean> {
  console.log("📱 [TEAM-NOTIF] Saving push subscription for user:", userId);

  const subscriptionData = subscription.toJSON();

  try {
    // Sprawdź czy subskrypcja już istnieje
    const { data: existing } = await (supabase as any)
      .from("team_push_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("endpoint", subscriptionData.endpoint)
      .single();

    if (existing) {
      // Update existing
      await (supabase as any)
        .from("team_push_subscriptions")
        .update({
          p256dh_key: subscriptionData.keys?.p256dh,
          auth_key: subscriptionData.keys?.auth,
          last_used_at: new Date().toISOString(),
          is_active: true,
        })
        .eq("id", existing.id);
    } else {
      // Insert new
      await (supabase as any).from("team_push_subscriptions").insert({
        user_id: userId,
        endpoint: subscriptionData.endpoint,
        p256dh_key: subscriptionData.keys?.p256dh,
        auth_key: subscriptionData.keys?.auth,
        device_name: getDeviceName(),
        device_type: getDeviceType(),
        browser: getBrowserName(),
        is_active: true,
      });
    }

    console.log("✅ [TEAM-NOTIF] Push subscription saved");
    return true;
  } catch (error) {
    console.error("❌ [TEAM-NOTIF] Error saving push subscription:", error);
    return false;
  }
}

/**
 * Usuń subskrypcję push
 */
export async function removePushSubscription(
  userId: string,
  endpoint: string
): Promise<boolean> {
  try {
    await (supabase as any)
      .from("team_push_subscriptions")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("endpoint", endpoint);

    console.log("✅ [TEAM-NOTIF] Push subscription removed");
    return true;
  } catch (error) {
    console.error("❌ [TEAM-NOTIF] Error removing push subscription:", error);
    return false;
  }
}

// ============================================================================
// NOTIFICATION SENDING
// ============================================================================

/**
 * Wyślij powiadomienie do użytkownika (zapisuje w bazie, trigguje real-time)
 */
export async function sendTeamNotification(
  userId: string,
  payload: TeamNotificationPayload
): Promise<boolean> {
  console.log(
    "🔔 [TEAM-NOTIF] Sending notification to user:",
    userId,
    payload.type
  );

  try {
    const { error } = await (supabase as any).from("notifications").insert({
      user_id: userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      link: payload.link || `/accountant/team`,
      data: {
        team_id: payload.teamId,
        team_name: payload.teamName,
        sender_id: payload.senderId,
        sender_name: payload.senderName,
        ...payload.data,
      },
      priority: payload.priority || "medium",
      is_read: false,
      sent_push: false, // Will be updated by edge function
    });

    if (error) {
      console.error("❌ [TEAM-NOTIF] Error inserting notification:", error);
      return false;
    }

    console.log("✅ [TEAM-NOTIF] Notification sent successfully");
    return true;
  } catch (error) {
    console.error("❌ [TEAM-NOTIF] Error sending notification:", error);
    return false;
  }
}

/**
 * Wyślij powiadomienie do wszystkich członków zespołu (oprócz nadawcy)
 */
export async function sendTeamNotificationToAll(
  teamId: string,
  excludeUserId: string,
  payload: Omit<TeamNotificationPayload, "teamId">
): Promise<number> {
  console.log(
    "🔔 [TEAM-NOTIF] Sending notification to all team members:",
    teamId
  );

  try {
    // Pobierz wszystkich aktywnych członków zespołu
    const { data: members, error } = await supabase
      .from("accountant_team_memberships")
      .select(
        `
        accountant:accountants!inner(profile_id)
      `
      )
      .eq("team_id", teamId)
      .eq("status", "active");

    if (error) {
      console.error("❌ [TEAM-NOTIF] Error fetching team members:", error);
      return 0;
    }

    // Pobierz nazwę zespołu
    const { data: team } = await supabase
      .from("accountant_teams")
      .select("name")
      .eq("id", teamId)
      .single();

    let sentCount = 0;
    for (const member of members || []) {
      const profileId = (member.accountant as any)?.profile_id;
      if (profileId && profileId !== excludeUserId) {
        const success = await sendTeamNotification(profileId, {
          ...payload,
          teamId,
          teamName: team?.name,
        });
        if (success) sentCount++;
      }
    }

    console.log(`✅ [TEAM-NOTIF] Sent ${sentCount} notifications`);
    return sentCount;
  } catch (error) {
    console.error("❌ [TEAM-NOTIF] Error sending team notifications:", error);
    return 0;
  }
}

// ============================================================================
// SPECIFIC NOTIFICATION TYPES
// ============================================================================

/**
 * Powiadomienie o nowej wiadomości w czacie
 */
export async function notifyNewMessage(
  teamId: string,
  senderId: string,
  senderName: string,
  messagePreview: string,
  channelName?: string
): Promise<void> {
  await sendTeamNotificationToAll(teamId, senderId, {
    type: "team_message",
    title: channelName ? `#${channelName}` : "Nowa wiadomość",
    message: `${senderName}: ${messagePreview.substring(0, 100)}${
      messagePreview.length > 100 ? "..." : ""
    }`,
    senderId,
    senderName,
    priority: "medium",
    link: `/accountant/team?tab=chat`,
  });
}

/**
 * Powiadomienie o przydzielonym zadaniu
 */
export async function notifyTaskAssigned(
  teamId: string,
  assigneeId: string,
  assignerName: string,
  taskTitle: string,
  taskId: string
): Promise<void> {
  await sendTeamNotification(assigneeId, {
    type: "team_task_assigned",
    title: "Nowe zadanie przydzielone",
    message: `${assignerName} przydzielił Ci zadanie: ${taskTitle}`,
    teamId,
    senderId: assigneeId,
    senderName: assignerName,
    priority: "high",
    link: `/accountant/team?tab=tasks&task=${taskId}`,
    data: { task_id: taskId },
  });
}

/**
 * Powiadomienie o zbliżającym się terminie zadania
 */
export async function notifyTaskDue(
  teamId: string,
  assigneeId: string,
  taskTitle: string,
  dueDate: string,
  taskId: string
): Promise<void> {
  await sendTeamNotification(assigneeId, {
    type: "team_task_due",
    title: "Termin zadania zbliża się",
    message: `Zadanie "${taskTitle}" kończy się ${formatDueDate(dueDate)}`,
    teamId,
    priority: "high",
    link: `/accountant/team?tab=tasks&task=${taskId}`,
    data: { task_id: taskId, due_date: dueDate },
  });
}

/**
 * Powiadomienie o nadchodzącym wydarzeniu
 */
export async function notifyEventReminder(
  teamId: string,
  userId: string,
  eventTitle: string,
  eventDate: string,
  eventId: string,
  minutesBefore: number = 30
): Promise<void> {
  await sendTeamNotification(userId, {
    type: "team_event_reminder",
    title: `Przypomnienie: za ${minutesBefore} min`,
    message: `Wydarzenie "${eventTitle}" rozpocznie się wkrótce`,
    teamId,
    priority: "high",
    link: `/accountant/team?tab=calendar&event=${eventId}`,
    data: { event_id: eventId, event_date: eventDate },
  });
}

/**
 * Powiadomienie o dołączeniu nowego członka do zespołu
 */
export async function notifyMemberJoined(
  teamId: string,
  newMemberName: string,
  newMemberId: string
): Promise<void> {
  await sendTeamNotificationToAll(teamId, newMemberId, {
    type: "team_member_joined",
    title: "Nowy członek zespołu",
    message: `${newMemberName} dołączył do zespołu`,
    senderId: newMemberId,
    senderName: newMemberName,
    priority: "low",
    link: `/accountant/team?tab=members`,
  });
}

// ============================================================================
// BROWSER PUSH NOTIFICATION SETUP
// ============================================================================

/**
 * Zarejestruj Service Worker i poproś o pozwolenie na push
 */
export async function setupPushNotifications(userId: string): Promise<boolean> {
  console.log("📱 [TEAM-NOTIF] Setting up push notifications...");

  // Sprawdź czy przeglądarka obsługuje
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("❌ Push notifications not supported");
    return false;
  }

  try {
    // Poproś o pozwolenie
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("❌ Notification permission denied");
      return false;
    }

    // Zarejestruj Service Worker (powinien być już zarejestrowany)
    const registration = await navigator.serviceWorker.ready;

    // Pobierz VAPID public key z serwera (tu hardcoded - w produkcji z env)
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

    if (!vapidPublicKey) {
      console.warn("⚠️ VAPID public key not configured, skipping web push");
      return false;
    }

    // Subskrybuj do push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    // Zapisz subskrypcję w bazie
    await savePushSubscription(userId, subscription);

    console.log("✅ [TEAM-NOTIF] Push notifications set up successfully");
    return true;
  } catch (error) {
    console.error("❌ [TEAM-NOTIF] Error setting up push:", error);
    return false;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as Uint8Array<ArrayBuffer>;
}

function getDeviceName(): string {
  const userAgent = navigator.userAgent;
  if (/iPhone/.test(userAgent)) return "iPhone";
  if (/iPad/.test(userAgent)) return "iPad";
  if (/Android/.test(userAgent)) return "Android";
  if (/Windows/.test(userAgent)) return "Windows PC";
  if (/Mac/.test(userAgent)) return "Mac";
  return "Unknown";
}

function getDeviceType(): string {
  const userAgent = navigator.userAgent;
  if (/Mobile|Android|iPhone/.test(userAgent)) return "mobile";
  if (/Tablet|iPad/.test(userAgent)) return "tablet";
  return "desktop";
}

function getBrowserName(): string {
  const userAgent = navigator.userAgent;
  if (/Chrome/.test(userAgent) && !/Chromium|Edge/.test(userAgent))
    return "Chrome";
  if (/Firefox/.test(userAgent)) return "Firefox";
  if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) return "Safari";
  if (/Edge/.test(userAgent)) return "Edge";
  return "Unknown";
}

function formatDueDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 1) return `za ${days} dni`;
  if (days === 1) return "jutro";
  if (hours > 1) return `za ${hours} godzin`;
  if (hours === 1) return "za godzinę";
  return "wkrótce";
}

// ============================================================================
// EXPORTS
// ============================================================================

const teamNotificationService = {
  savePushSubscription,
  removePushSubscription,
  sendTeamNotification,
  sendTeamNotificationToAll,
  notifyNewMessage,
  notifyTaskAssigned,
  notifyTaskDue,
  notifyEventReminder,
  notifyMemberJoined,
  setupPushNotifications,
};

export default teamNotificationService;

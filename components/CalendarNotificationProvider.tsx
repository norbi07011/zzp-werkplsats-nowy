/**
 * =====================================================
 * CALENDAR NOTIFICATION SYSTEM
 * =====================================================
 * In-app notification toasts for upcoming calendar events
 *
 * Features:
 * - Checks for events every minute
 * - Shows toast notifications before events start
 * - Configurable reminder times (15min, 30min, 1hr)
 * - Sound notification option
 * - Persistent dismissed notifications (per session)
 */

import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { createPortal } from "react-dom";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import Bell from "lucide-react/dist/esm/icons/bell";
import X from "lucide-react/dist/esm/icons/x";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Clock from "lucide-react/dist/esm/icons/clock";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Video from "lucide-react/dist/esm/icons/video";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";

interface CalendarEvent {
  id: string;
  title: string;
  event_type: string;
  start_date: string;
  location: string | null;
  meeting_url: string | null;
  reminder_minutes: number | null;
}

interface NotificationItem {
  id: string;
  event: CalendarEvent;
  type: "upcoming" | "now" | "overdue";
  minutesUntil: number;
  dismissedAt?: Date;
}

interface CalendarNotificationContextType {
  notifications: NotificationItem[];
  dismissNotification: (id: string) => void;
  dismissAll: () => void;
  markEventComplete: (eventId: string) => Promise<void>;
}

const CalendarNotificationContext =
  createContext<CalendarNotificationContextType | null>(null);

export const useCalendarNotifications = () => {
  const context = useContext(CalendarNotificationContext);
  if (!context) {
    throw new Error(
      "useCalendarNotifications must be used within CalendarNotificationProvider"
    );
  }
  return context;
};

// Event type colors
const EVENT_COLORS: Record<
  string,
  { bg: string; border: string; icon: string }
> = {
  meeting: { bg: "bg-blue-500", border: "border-blue-400", icon: "👥" },
  work: { bg: "bg-emerald-500", border: "border-emerald-400", icon: "💼" },
  call: { bg: "bg-violet-500", border: "border-violet-400", icon: "📞" },
  inspection: { bg: "bg-orange-500", border: "border-orange-400", icon: "🔍" },
  deadline: { bg: "bg-red-500", border: "border-red-400", icon: "⏰" },
  reminder: { bg: "bg-yellow-500", border: "border-yellow-400", icon: "🔔" },
  other: { bg: "bg-slate-500", border: "border-slate-400", icon: "📌" },
};

// Notification Toast Component
const NotificationToast: React.FC<{
  notification: NotificationItem;
  onDismiss: () => void;
  onMarkComplete: () => void;
  onViewDetails?: () => void;
}> = ({ notification, onDismiss, onMarkComplete, onViewDetails }) => {
  const { event, type, minutesUntil } = notification;
  const color = EVENT_COLORS[event.event_type] || EVENT_COLORS.other;

  const getTimeLabel = () => {
    if (type === "now") return "Teraz!";
    if (type === "overdue") return "Rozpoczęło się!";
    if (minutesUntil < 60) return `Za ${minutesUntil} min`;
    const hours = Math.floor(minutesUntil / 60);
    return `Za ${hours} ${hours === 1 ? "godzinę" : "godzin(y)"}`;
  };

  const getUrgencyStyle = () => {
    if (type === "now" || type === "overdue")
      return "ring-2 ring-red-400 animate-pulse";
    if (minutesUntil <= 15) return "ring-2 ring-orange-300";
    return "";
  };

  return (
    <div
      className={`
        bg-white rounded-2xl shadow-2xl border overflow-hidden
        transform transition-all duration-500 hover:scale-[1.02]
        max-w-sm w-full ${getUrgencyStyle()}
      `}
    >
      {/* Color Bar */}
      <div className={`h-1 ${color.bg}`} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl ${color.bg} text-white flex items-center justify-center text-xl shadow-lg`}
            >
              {color.icon}
            </div>
            <div>
              <p className="font-bold text-gray-800">{event.title}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                {event.event_type}
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* Time Badge */}
        <div
          className={`
            inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold mb-3
            ${
              type === "now" || type === "overdue"
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }
          `}
        >
          <Bell size={14} className={type === "now" ? "animate-bounce" : ""} />
          {getTimeLabel()}
        </div>

        {/* Details */}
        <div className="space-y-1 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-gray-400" />
            <span>
              {new Date(event.start_date).toLocaleTimeString("pl-PL", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-gray-400" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          {event.meeting_url && (
            <div className="flex items-center gap-2">
              <Video size={14} className="text-blue-500" />
              <a
                href={event.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline truncate"
              >
                Dołącz do spotkania
              </a>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onMarkComplete}
            className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle size={16} />
            Ukończone
          </button>
          <button
            onClick={onDismiss}
            className="flex-1 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Przypomnij później
          </button>
        </div>
      </div>
    </div>
  );
};

// Notification Container (renders in portal)
const NotificationContainer: React.FC<{
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
  onMarkComplete: (eventId: string) => void;
}> = ({ notifications, onDismiss, onMarkComplete }) => {
  if (notifications.length === 0) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[9999] space-y-3 max-h-screen overflow-y-auto pb-4">
      {notifications.slice(0, 3).map((notification) => (
        <div
          key={notification.id}
          className="animate-in slide-in-from-right-5 fade-in duration-300"
        >
          <NotificationToast
            notification={notification}
            onDismiss={() => onDismiss(notification.id)}
            onMarkComplete={() => onMarkComplete(notification.event.id)}
          />
        </div>
      ))}
      {notifications.length > 3 && (
        <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg px-4 py-2 text-center">
          <p className="text-sm text-gray-600">
            +{notifications.length - 3} więcej powiadomień
          </p>
        </div>
      )}
    </div>,
    document.getElementById("notification-root") || document.body
  );
};

// Provider Component
export const CalendarNotificationProvider: React.FC<{
  children: React.ReactNode;
  checkIntervalMs?: number;
}> = ({ children, checkIntervalMs = 60000 }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Check for upcoming events
  const checkUpcomingEvents = useCallback(async () => {
    if (!user?.id) return;

    try {
      const now = new Date();
      const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from("calendar_events")
        .select(
          "id, title, event_type, start_date, location, meeting_url, reminder_minutes"
        )
        .eq("user_id", user.id)
        .gte("start_date", now.toISOString())
        .lte("start_date", inTwoHours.toISOString())
        .in("status", ["planned", "confirmed"])
        .order("start_date", { ascending: true });

      if (error) {
        console.error("Error checking events:", error);
        return;
      }

      if (!data) return;

      const newNotifications: NotificationItem[] = [];

      for (const event of data) {
        const eventTime = new Date(event.start_date);
        const diffMs = eventTime.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const reminderMins = event.reminder_minutes || 15;

        // Create notification ID based on event + reminder time
        const notifId = `${event.id}-${reminderMins}`;

        // Skip if already dismissed
        if (dismissedIds.has(notifId)) continue;

        // Determine notification type and whether to show
        let type: "upcoming" | "now" | "overdue" = "upcoming";
        let shouldNotify = false;

        if (diffMins <= 0) {
          // Event is starting or has started
          type = diffMins < -5 ? "overdue" : "now";
          shouldNotify = true;
        } else if (diffMins <= reminderMins) {
          // Within reminder window
          type = "upcoming";
          shouldNotify = true;
        }

        if (shouldNotify) {
          newNotifications.push({
            id: notifId,
            event,
            type,
            minutesUntil: Math.max(0, diffMins),
          });
        }
      }

      setNotifications(newNotifications);
    } catch (err) {
      console.error("Error in notification check:", err);
    }
  }, [user?.id, dismissedIds]);

  // Start checking on mount
  useEffect(() => {
    checkUpcomingEvents();
    const interval = setInterval(checkUpcomingEvents, checkIntervalMs);
    return () => clearInterval(interval);
  }, [checkUpcomingEvents, checkIntervalMs]);

  // Dismiss notification
  const dismissNotification = useCallback((id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Dismiss all
  const dismissAll = useCallback(() => {
    const allIds = notifications.map((n) => n.id);
    setDismissedIds((prev) => new Set([...prev, ...allIds]));
    setNotifications([]);
  }, [notifications]);

  // Mark event complete
  const markEventComplete = useCallback(
    async (eventId: string) => {
      if (!user?.id) return;

      try {
        const { error } = await supabase
          .from("calendar_events")
          .update({ status: "completed" })
          .eq("id", eventId)
          .eq("user_id", user.id);

        if (error) throw error;

        // Remove all notifications for this event
        setNotifications((prev) => prev.filter((n) => n.event.id !== eventId));
        // Also dismiss to prevent re-showing
        setDismissedIds((prev) => {
          const newSet = new Set(prev);
          notifications
            .filter((n) => n.event.id === eventId)
            .forEach((n) => newSet.add(n.id));
          return newSet;
        });
      } catch (err) {
        console.error("Error marking event complete:", err);
      }
    },
    [user?.id, notifications]
  );

  const contextValue: CalendarNotificationContextType = {
    notifications,
    dismissNotification,
    dismissAll,
    markEventComplete,
  };

  return (
    <CalendarNotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
        onMarkComplete={markEventComplete}
      />
    </CalendarNotificationContext.Provider>
  );
};

export default CalendarNotificationProvider;

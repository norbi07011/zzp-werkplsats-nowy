/**
 * =====================================================
 * UPCOMING EVENTS CARD - Reusable Dashboard Widget
 * =====================================================
 * Shows next 5 upcoming events from calendar_events table
 * Used across all 5 dashboards (Admin, Employer, Worker, Accountant, CleaningCompany)
 *
 * Features:
 * - Real-time data from Supabase
 * - Color-coded event types
 * - Time-based sorting
 * - Quick actions (mark complete, view details)
 * - Notification badges for imminent events
 */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Loader2,
  RefreshCw,
  Plus,
  Bell,
  Video,
} from "lucide-react";

// Event types with colors
const EVENT_STYLES: Record<
  string,
  { bg: string; border: string; text: string; icon: string }
> = {
  meeting: {
    bg: "bg-blue-50",
    border: "border-blue-300",
    text: "text-blue-700",
    icon: "👥",
  },
  work: {
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    text: "text-emerald-700",
    icon: "💼",
  },
  call: {
    bg: "bg-violet-50",
    border: "border-violet-300",
    text: "text-violet-700",
    icon: "📞",
  },
  inspection: {
    bg: "bg-orange-50",
    border: "border-orange-300",
    text: "text-orange-700",
    icon: "🔍",
  },
  deadline: {
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-700",
    icon: "⏰",
  },
  reminder: {
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    text: "text-yellow-700",
    icon: "🔔",
  },
  other: {
    bg: "bg-slate-50",
    border: "border-slate-300",
    text: "text-slate-700",
    icon: "📌",
  },
};

interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_type: string;
  status: string;
  start_date: string;
  end_date: string | null;
  all_day: boolean | null;
  location: string | null;
  meeting_url: string | null;
  reminder_minutes: number | null;
}

interface UpcomingEventsCardProps {
  maxEvents?: number;
  showAddButton?: boolean;
  compact?: boolean;
  // Legacy props (ignored - we now navigate to /faktury directly)
  onNavigateToCalendar?: () => void;
  onAddEvent?: () => void;
}

export const UpcomingEventsCard: React.FC<UpcomingEventsCardProps> = ({
  maxEvents = 5,
  showAddButton = true,
  compact = false,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  const [imminentEvents, setImminentEvents] = useState<CalendarEvent[]>([]);

  // Navigate to Faktury module (where calendar is)
  const handleNavigateToCalendar = () => {
    navigate("/faktury?page=appointments");
  };

  // Load upcoming events
  const loadUpcomingEvents = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const now = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user.id)
        .gte("start_date", now.toISOString())
        .lte("start_date", nextWeek.toISOString())
        .neq("status", "cancelled")
        .neq("status", "completed")
        .order("start_date", { ascending: true })
        .limit(maxEvents);

      if (error) {
        console.error("Error loading upcoming events:", error);
        setEvents([]);
      } else {
        setEvents(data || []);

        // Count today's events
        const today = now.toISOString().split("T")[0];
        const todayEvents = (data || []).filter(
          (e) => e.start_date.split("T")[0] === today
        );
        setTodayCount(todayEvents.length);

        // Find imminent events (within 30 minutes)
        const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
        const imminent = (data || []).filter((e) => {
          const eventTime = new Date(e.start_date);
          return eventTime >= now && eventTime <= thirtyMinutesFromNow;
        });
        setImminentEvents(imminent);
      }
    } catch (err) {
      console.error("Error loading events:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, maxEvents]);

  useEffect(() => {
    loadUpcomingEvents();
    // Refresh every 5 minutes
    const interval = setInterval(loadUpcomingEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadUpcomingEvents]);

  // Mark event as complete
  const handleMarkComplete = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("calendar_events")
        .update({ status: "completed" })
        .eq("id", eventId)
        .eq("user_id", user.id);

      if (error) throw error;
      await loadUpcomingEvents();
    } catch (err) {
      console.error("Error marking event complete:", err);
    }
  };

  // Format relative time
  const formatRelativeTime = (dateStr: string): string => {
    const eventDate = new Date(dateStr);
    const now = new Date();
    const diffMs = eventDate.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 0) return "Teraz";
    if (diffMins < 60) return `Za ${diffMins} min`;
    if (diffHours < 24) return `Za ${diffHours} godz.`;
    if (diffDays === 1) return "Jutro";
    if (diffDays < 7) return `Za ${diffDays} dni`;
    return eventDate.toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "short",
    });
  };

  // Format event time
  const formatEventTime = (dateStr: string, allDay: boolean | null): string => {
    if (allDay) return "Cały dzień";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get day label
  const getDayLabel = (dateStr: string): string => {
    const eventDate = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (eventDate.toDateString() === today.toDateString()) return "Dziś";
    if (eventDate.toDateString() === tomorrow.toDateString()) return "Jutro";
    return eventDate.toLocaleDateString("pl-PL", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  if (compact) {
    // Compact version for sidebar/small spaces
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <Calendar size={16} className="text-blue-600" />
            Nadchodzące
          </h4>
          {todayCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
              {todayCount} dziś
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-4 text-gray-400 text-sm">
            Ładowanie...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-4 text-gray-400 text-sm">
            Brak nadchodzących wydarzeń
          </div>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 3).map((event) => {
              const style =
                EVENT_STYLES[event.event_type] || EVENT_STYLES.other;
              return (
                <div
                  key={event.id}
                  className={`flex items-center gap-2 p-2 rounded-lg ${style.bg} cursor-pointer hover:opacity-80 transition-opacity`}
                  onClick={handleNavigateToCalendar}
                >
                  <span className="text-lg">{style.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {event.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatRelativeTime(event.start_date)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={handleNavigateToCalendar}
          className="mt-3 w-full text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1"
        >
          Zobacz wszystkie <ChevronRight size={14} />
        </button>
      </div>
    );
  }

  // Full version
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Calendar size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Nadchodzące spotkania
              </h3>
              <p className="text-blue-100 text-sm">
                {events.length > 0
                  ? `${events.length} ${
                      events.length === 1 ? "wydarzenie" : "wydarzeń"
                    } w tym tygodniu`
                  : "Brak zaplanowanych wydarzeń"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {todayCount > 0 && (
              <span className="px-3 py-1 bg-white/20 text-white text-sm font-bold rounded-full">
                {todayCount} dziś
              </span>
            )}
            {imminentEvents.length > 0 && (
              <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full animate-pulse flex items-center gap-1">
                <Bell size={12} /> Za chwilę!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Imminent Events Alert */}
      {imminentEvents.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100 px-6 py-3">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle size={16} className="animate-pulse" />
            <span className="font-medium text-sm">
              {imminentEvents[0].title} - zaczyna się{" "}
              {formatRelativeTime(imminentEvents[0].start_date)}!
            </span>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8 text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p>Ładowanie wydarzeń...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">
              Brak nadchodzących wydarzeń
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Dodaj nowe spotkanie, aby było widoczne tutaj
            </p>
            {showAddButton && (
              <button
                onClick={handleNavigateToCalendar}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus size={16} /> Dodaj wydarzenie
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const style =
                EVENT_STYLES[event.event_type] || EVENT_STYLES.other;
              const isImminent = imminentEvents.some((e) => e.id === event.id);

              return (
                <div
                  key={event.id}
                  className={`
                    relative p-4 rounded-xl border-l-4 transition-all duration-300
                    hover:shadow-md cursor-pointer group
                    ${style.border} ${
                    isImminent
                      ? "bg-red-50 ring-2 ring-red-200"
                      : "bg-gray-50 hover:bg-white"
                  }
                  `}
                  onClick={handleNavigateToCalendar}
                >
                  <div className="flex items-start gap-4">
                    {/* Event Icon */}
                    <div
                      className={`w-12 h-12 rounded-xl ${style.bg} ${style.text} flex items-center justify-center text-2xl shadow-sm`}
                    >
                      {style.icon}
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-800 truncate">
                          {event.title}
                        </h4>
                        <span
                          className={`text-xs font-medium uppercase px-2 py-0.5 rounded ${style.bg} ${style.text}`}
                        >
                          {event.event_type}
                        </span>
                        {isImminent && (
                          <span className="text-xs font-bold text-red-600 animate-pulse">
                            ⚡ Teraz!
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatEventTime(event.start_date, event.all_day)}
                        </span>
                        <span className="font-medium text-gray-700">
                          {getDayLabel(event.start_date)}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {event.location}
                          </span>
                        )}
                        {event.meeting_url && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Video size={14} />
                            Online
                          </span>
                        )}
                      </div>

                      {event.description && (
                        <p className="text-sm text-gray-400 mt-1 truncate">
                          {event.description}
                        </p>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleMarkComplete(event.id, e)}
                        className="p-2 hover:bg-green-100 rounded-lg text-green-600 transition-colors"
                        title="Oznacz jako ukończone"
                      >
                        <CheckCircle size={18} />
                      </button>
                    </div>

                    {/* Time Badge */}
                    <div className="text-right shrink-0">
                      <span
                        className={`text-sm font-bold ${
                          isImminent ? "text-red-600" : "text-gray-600"
                        }`}
                      >
                        {formatRelativeTime(event.start_date)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-100 px-6 py-3 flex items-center justify-between">
        {showAddButton && (
          <button
            onClick={handleNavigateToCalendar}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> Dodaj spotkanie
          </button>
        )}
        <button
          onClick={handleNavigateToCalendar}
          className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 ml-auto"
        >
          Zobacz kalendarz <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default UpcomingEventsCard;

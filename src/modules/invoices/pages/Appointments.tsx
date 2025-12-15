import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  MapPin,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Video,
  X,
  Zap,
} from "lucide-react";

import { useAuth } from "../../../../contexts/AuthContext";
import { supabase } from "../../../../src/lib/supabase";

// --- Event Form State Type ---
interface EventFormData {
  title: string;
  description: string;
  event_type: EventType;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  all_day: boolean;
  location: string;
  meeting_url: string;
  reminder_minutes: number | null;
  status: "planned" | "confirmed" | "completed" | "cancelled";
}

// --- Types & Constants ---
const TIME_SLOTS = Array.from({ length: 15 }, (_, i) => i + 7); // 07:00 - 21:00

type EventType =
  | "MEETING"
  | "WORK"
  | "CALL"
  | "INSPECTION"
  | "DEADLINE"
  | "REMINDER"
  | "OTHER";

const EVENT_STYLES: Record<
  EventType,
  { bg: string; border: string; text: string; icon: string }
> = {
  MEETING: {
    bg: "bg-blue-50/50",
    border: "border-blue-200",
    text: "text-blue-700",
    icon: "👥",
  },
  WORK: {
    bg: "bg-emerald-50/50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    icon: "💼",
  },
  CALL: {
    bg: "bg-violet-50/50",
    border: "border-violet-200",
    text: "text-violet-700",
    icon: "📞",
  },
  INSPECTION: {
    bg: "bg-orange-50/50",
    border: "border-orange-200",
    text: "text-orange-700",
    icon: "🔍",
  },
  DEADLINE: {
    bg: "bg-red-50/50",
    border: "border-red-200",
    text: "text-red-700",
    icon: "⏰",
  },
  REMINDER: {
    bg: "bg-yellow-50/50",
    border: "border-yellow-200",
    text: "text-yellow-700",
    icon: "🔔",
  },
  OTHER: {
    bg: "bg-slate-50/50",
    border: "border-slate-200",
    text: "text-slate-700",
    icon: "📌",
  },
};

// JSON type matching Supabase
type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Database event interface (matches calendar_events table)
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
  color_hex: string | null;
  tags: string[] | null;
  metadata: Json | null;
  created_at: string | null;
  updated_at: string | null;
}

// Legacy interface for backward compatibility
interface Appointment {
  id: string;
  title: string;
  clientName?: string;
  date: string;
  time: string;
  duration: number;
  type: EventType;
  location?: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
}

// --- Live Clock Component ---
const LiveClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-ocean-400 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
      <div className="relative bg-white/80 backdrop-blur-md border border-white/50 px-6 py-3 rounded-2xl shadow-xl flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-2xl font-black text-slate-800 tracking-tighter tabular-nums leading-none">
            {time.toLocaleTimeString("pl-PL", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="text-xs font-bold text-ocean-600 tracking-widest uppercase">
            {time.toLocaleTimeString("pl-PL", { second: "2-digit" })} sec
          </span>
        </div>
        <div className="w-px h-8 bg-slate-200"></div>
        <div className="text-slate-400">
          <Clock className="animate-pulse" size={24} />
        </div>
      </div>
    </div>
  );
};

export const Appointments: React.FC = () => {
  const { user } = useAuth();

  // --- State ---
  const [currentDate, setCurrentDate] = useState(new Date()); // Calendar View Month
  const [selectedDate, setSelectedDate] = useState(new Date()); // Active Selected Day
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDayPreview, setShowDayPreview] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state for add/edit modal
  const getInitialFormData = (event?: CalendarEvent | null): EventFormData => {
    if (event) {
      const startDate = new Date(event.start_date);
      const endDate = event.end_date ? new Date(event.end_date) : startDate;
      return {
        title: event.title,
        description: event.description || "",
        event_type: (event.event_type?.toUpperCase() as EventType) || "OTHER",
        start_date: startDate.toISOString().split("T")[0],
        start_time: startDate.toTimeString().slice(0, 5),
        end_date: endDate.toISOString().split("T")[0],
        end_time: endDate.toTimeString().slice(0, 5),
        all_day: event.all_day || false,
        location: event.location || "",
        meeting_url: event.meeting_url || "",
        reminder_minutes: event.reminder_minutes,
        status:
          (event.status as
            | "planned"
            | "confirmed"
            | "completed"
            | "cancelled") || "planned",
      };
    }
    // Default for new event
    const today = selectedDate.toISOString().split("T")[0];
    return {
      title: "",
      description: "",
      event_type: "MEETING",
      start_date: today,
      start_time: "09:00",
      end_date: today,
      end_time: "10:00",
      all_day: false,
      location: "",
      meeting_url: "",
      reminder_minutes: 15,
      status: "planned",
    };
  };

  const [formData, setFormData] = useState<EventFormData>(getInitialFormData());

  // Reset form when modal opens
  useEffect(() => {
    if (showAddModal) {
      setFormData(getInitialFormData());
    }
  }, [showAddModal, selectedDate]);

  useEffect(() => {
    if (editingEvent) {
      setFormData(getInitialFormData(editingEvent));
    }
  }, [editingEvent]);

  // --- CRUD Operations ---
  const handleSaveEvent = async () => {
    if (!user?.id || !formData.title.trim()) return;

    setSaving(true);
    try {
      const startDateTime = formData.all_day
        ? `${formData.start_date}T00:00:00`
        : `${formData.start_date}T${formData.start_time}:00`;

      const endDateTime = formData.all_day
        ? `${formData.end_date}T23:59:59`
        : `${formData.end_date}T${formData.end_time}:00`;

      const eventData = {
        user_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        event_type: formData.event_type.toLowerCase(),
        status: formData.status,
        start_date: new Date(startDateTime).toISOString(),
        end_date: new Date(endDateTime).toISOString(),
        all_day: formData.all_day,
        location: formData.location.trim() || null,
        meeting_url: formData.meeting_url.trim() || null,
        reminder_minutes: formData.reminder_minutes,
      };

      if (editingEvent) {
        // UPDATE existing event
        const { error } = await supabase
          .from("calendar_events")
          .update(eventData)
          .eq("id", editingEvent.id)
          .eq("user_id", user.id);

        if (error) throw error;
        console.log("✅ Event updated:", formData.title);
      } else {
        // INSERT new event
        const { error } = await supabase
          .from("calendar_events")
          .insert([eventData]);

        if (error) throw error;
        console.log("✅ Event created:", formData.title);
      }

      // Load events FIRST while modal is still open (to avoid DOM conflicts)
      await loadEvents();

      // Then close modal after data is loaded
      setSaving(false);
      setShowAddModal(false);
      setEditingEvent(null);

      return; // Exit early since we handled setSaving above
    } catch (err) {
      console.error("❌ Error saving event:", err);
      alert("Błąd podczas zapisywania wydarzenia");
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", eventId)
        .eq("user_id", user.id);

      if (error) throw error;

      console.log("✅ Event deleted:", eventId);

      // Load events FIRST while modal is still open (to avoid DOM conflicts)
      await loadEvents();

      // Then close everything
      setSaving(false);
      setEditingEvent(null);
      setDeleteConfirm(null);

      return;
    } catch (err) {
      console.error("❌ Error deleting event:", err);
      alert("Błąd podczas usuwania wydarzenia");
      setSaving(false);
    }
  };

  const handleMarkComplete = async (event: CalendarEvent) => {
    if (!user?.id) return;

    try {
      const newStatus = event.status === "completed" ? "planned" : "completed";
      const { error } = await supabase
        .from("calendar_events")
        .update({ status: newStatus })
        .eq("id", event.id)
        .eq("user_id", user.id);

      if (error) throw error;
      await loadEvents();
    } catch (err) {
      console.error("❌ Error updating status:", err);
    }
  };

  // --- Load Events from Supabase ---
  const loadEvents = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Get events for current month (with buffer for week view)
      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      startOfMonth.setDate(startOfMonth.getDate() - 7);
      const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );
      endOfMonth.setDate(endOfMonth.getDate() + 7);

      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user.id)
        .gte("start_date", startOfMonth.toISOString())
        .lte("start_date", endOfMonth.toISOString())
        .order("start_date", { ascending: true });

      if (error) {
        console.error("Error loading events:", error);
        // Fallback to empty array if table doesn't exist yet
        setEvents([]);
      } else {
        setEvents(data || []);
      }
    } catch (err) {
      console.error("Error loading calendar events:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentDate]);

  // Load events on mount and when month changes
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // --- Helper Functions ---
  const getEventsForDay = useCallback(
    (date: Date): CalendarEvent[] => {
      const dateStr = date.toISOString().split("T")[0];
      return events
        .filter((e) => {
          const eventDate = new Date(e.start_date).toISOString().split("T")[0];
          return eventDate === dateStr;
        })
        .sort(
          (a, b) =>
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        );
    },
    [events]
  );

  const formatEventTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const activeEvents = getEventsForDay(selectedDate);

  // --- Logic ---

  // Calendar Grid Logic
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Adjust for Monday start
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    const days = [];
    // Empty slots
    for (let i = 0; i < startOffset; i++) days.push(null);
    // Days
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

    return days;
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 space-y-8 pb-20">
      {/* --- Header Section --- */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
              <Sparkles size={14} /> Inteligentny Plan Działania
            </span>
          </div>
          <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">
            Kalendarz i Spotkania (Agenda)
          </h2>
          <p className="text-slate-500 mt-2 font-medium text-lg">
            Zaplanuj swój sukces, dzień po dniu.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <LiveClock />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* --- Left Column: Calendar + Status as unified card --- */}
        <div
          className="xl:col-span-4"
          style={{
            transform: "none !important",
            perspective: "none !important",
            transformStyle: "flat",
          }}
        >
          <div
            className="rounded-2xl shadow-xl overflow-hidden border border-slate-200"
            style={{
              transform: "none !important",
              perspective: "none !important",
              transformStyle: "flat",
              animation: "none !important",
            }}
          >
            {/* Calendar Card - Top Section */}
            <div
              className="relative bg-white p-5"
              style={{
                transform: "none !important",
                perspective: "none !important",
              }}
            >
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-2xl -mr-10 -mt-10"></div>

              <div className="relative z-10">
                {/* Month Navigation */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800 capitalize">
                    {currentDate.toLocaleString("pl-PL", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h3>
                  <div className="flex gap-1">
                    <button
                      onClick={handlePrevMonth}
                      className="p-3 bg-slate-100 hover:bg-indigo-500 hover:text-white rounded-xl transition-all duration-200 text-slate-600"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="p-3 bg-slate-100 hover:bg-indigo-500 hover:text-white rounded-xl transition-all duration-200 text-slate-600"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                {/* Calendar Grid - Days Header */}
                <div className="grid grid-cols-7 gap-1 text-center mb-3">
                  {["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"].map((d, idx) => (
                    <div
                      key={d}
                      className={`text-xs font-bold uppercase py-2 ${
                        idx >= 5 ? "text-rose-400" : "text-slate-400"
                      }`}
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid - Days */}
                <div className="grid grid-cols-7 gap-1.5">
                  {calendarDays.map((day, i) => {
                    if (!day)
                      return <div key={`empty-${i}`} className="h-11" />;
                    const isSelected =
                      day.toDateString() === selectedDate.toDateString();
                    const isToday =
                      day.toDateString() === new Date().toDateString();
                    const dayEvents = getEventsForDay(day);
                    const hasEvents = dayEvents.length > 0;
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(day)}
                        style={{
                          transform: "none !important",
                          perspective: "none !important",
                        }}
                        className={`
                          relative h-11 rounded-xl flex flex-col items-center justify-center text-sm font-semibold transition-all duration-200
                          ${
                            isSelected
                              ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-300/50 z-10"
                              : isToday
                              ? "bg-indigo-100 text-indigo-700 font-bold ring-2 ring-indigo-300"
                              : hasEvents
                              ? "bg-blue-50 text-blue-700 border-2 border-blue-200 hover:border-blue-400"
                              : isWeekend
                              ? "text-rose-400 hover:bg-rose-50"
                              : "text-slate-600 hover:bg-slate-100"
                          }
                        `}
                      >
                        {day.getDate()}
                        {hasEvents && (
                          <div className="absolute -bottom-0.5 flex gap-0.5">
                            {dayEvents.slice(0, 3).map((_, idx) => (
                              <div
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isSelected ? "bg-white" : "bg-indigo-500"
                                }`}
                              />
                            ))}
                            {dayEvents.length > 3 && (
                              <span
                                className={`text-[8px] font-bold ${
                                  isSelected ? "text-white" : "text-indigo-600"
                                }`}
                              >
                                +{dayEvents.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Status Dnia - Bottom Section (same card) */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 text-white relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
              <div className="relative z-10">
                <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Zap size={16} className="text-yellow-300" /> Status Dnia -{" "}
                  {selectedDate.getDate()}.{selectedDate.getMonth() + 1}
                </h4>

                {/* Statystyki */}
                <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/20">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-black">
                      {activeEvents.length}
                    </div>
                    <div className="text-[10px] text-white/70 leading-tight">
                      Zaplanowanych
                      <br />
                      wydarzeń
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {activeEvents
                        .reduce((total, event) => {
                          if (event.start_date && event.end_date) {
                            const start = new Date(event.start_date).getTime();
                            const end = new Date(event.end_date).getTime();
                            return total + (end - start) / (1000 * 60 * 60);
                          }
                          return total + 1;
                        }, 0)
                        .toFixed(1)}{" "}
                      godz.
                    </div>
                    <div className="text-[10px] text-white/70">Łącznie</div>
                  </div>
                </div>

                {/* Lista wydarzeń na ten dzień */}
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {activeEvents.length === 0 ? (
                    <div className="text-center py-3 text-white/60 text-xs">
                      <Calendar size={20} className="mx-auto mb-1 opacity-50" />
                      Brak wydarzeń
                    </div>
                  ) : (
                    activeEvents.map((event) => {
                      const eventStyle =
                        EVENT_STYLES[
                          (event.event_type?.toUpperCase() as EventType) ||
                            "OTHER"
                        ] || EVENT_STYLES.OTHER;
                      return (
                        <div
                          key={event.id}
                          className="bg-white/15 backdrop-blur rounded-lg p-2.5 flex items-center gap-2 hover:bg-white/25 transition-colors cursor-pointer"
                          onClick={() => setEditingEvent(event)}
                        >
                          <div className="text-lg">{eventStyle.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs truncate">
                              {event.title}
                            </div>
                            <div className="text-[10px] text-white/70 flex items-center gap-1">
                              <Clock size={9} />
                              {formatEventTime(event.start_date)}
                              {event.location && (
                                <>
                                  <span className="mx-0.5">•</span>
                                  <MapPin size={9} />
                                  <span className="truncate max-w-[60px]">
                                    {event.location}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              event.status === "completed"
                                ? "bg-green-400 text-green-900"
                                : event.status === "confirmed"
                                ? "bg-blue-400 text-blue-900"
                                : event.status === "cancelled"
                                ? "bg-red-400 text-red-900"
                                : "bg-yellow-400 text-yellow-900"
                            }`}
                          >
                            {event.status === "completed"
                              ? "✓"
                              : event.status === "confirmed"
                              ? "●"
                              : event.status === "cancelled"
                              ? "✕"
                              : "○"}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Pasek postępu */}
                <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-300 to-green-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (activeEvents.filter((e) => e.status === "completed")
                          .length /
                          Math.max(1, activeEvents.length)) *
                          100
                      )}%`,
                    }}
                  ></div>
                </div>
                <div className="text-xs text-indigo-300 mt-1 text-center">
                  {activeEvents.filter((e) => e.status === "completed").length}{" "}
                  / {activeEvents.length} ukończonych
                </div>
              </div>
            </div>
            {/* End of unified calendar card */}
          </div>
        </div>

        {/* --- Right Column: Upcoming Events --- */}
        <div className="xl:col-span-8">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-indigo-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-black text-white">
                    {selectedDate.getDate()}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">
                    {selectedDate.toLocaleString("pl-PL", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h3>
                  <p className="text-indigo-600 font-semibold text-lg capitalize">
                    {selectedDate.toLocaleString("pl-PL", {
                      weekday: "long",
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl flex items-center gap-2 transition-all"
              >
                <Plus size={20} />
                Dodaj wydarzenie
              </button>
            </div>

            {/* Events List */}
            <div className="space-y-4">
              {activeEvents.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar size={48} className="text-indigo-500" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-700 mb-2">
                    Brak wydarzeń na ten dzień
                  </h4>
                  <p className="text-slate-500 mb-6">
                    Kliknij przycisk aby dodać nowe spotkanie
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg transition-all inline-flex items-center gap-2"
                  >
                    <Plus size={20} />
                    Dodaj pierwsze wydarzenie
                  </button>
                </div>
              ) : (
                activeEvents.map((event) => {
                  const eventType =
                    (event.event_type?.toUpperCase() as EventType) || "OTHER";
                  const style = EVENT_STYLES[eventType] || EVENT_STYLES.OTHER;
                  const startTime = formatEventTime(event.start_date);
                  const endTime = event.end_date
                    ? formatEventTime(event.end_date)
                    : null;

                  return (
                    <div
                      key={event.id}
                      className={`group relative overflow-hidden rounded-xl p-5 transition-all duration-300 bg-white border-2 hover:border-indigo-400 ${style.border} shadow-md hover:shadow-xl cursor-pointer`}
                      onClick={() => setEditingEvent(event)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div
                            className={`w-14 h-14 rounded-xl ${style.bg} ${style.text} flex items-center justify-center shadow-md text-2xl`}
                          >
                            {style.icon}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-lg text-slate-800 truncate">
                              {event.title}
                            </h4>
                            <div
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                event.status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : event.status === "confirmed"
                                  ? "bg-blue-100 text-blue-700"
                                  : event.status === "cancelled"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {event.status === "completed"
                                ? "Ukończone"
                                : event.status === "confirmed"
                                ? "Potwierdzone"
                                : event.status === "cancelled"
                                ? "Anulowane"
                                : "Oczekuje"}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <Clock size={16} />
                              <span className="font-medium">
                                {startTime}
                                {endTime && ` - ${endTime}`}
                              </span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPin size={16} />
                                <span className="truncate">
                                  {event.location}
                                </span>
                              </div>
                            )}
                            {event.meeting_url && (
                              <div className="flex items-center gap-1.5 text-blue-600">
                                <Video size={16} />
                                <span>Spotkanie online</span>
                              </div>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========== ADD/EDIT EVENT MODAL ========== */}
      {(showAddModal || editingEvent) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-5 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  {editingEvent ? <Edit3 size={24} /> : <Plus size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {editingEvent ? "Edytuj wydarzenie" : "Nowe wydarzenie"}
                  </h3>
                  <p className="text-indigo-100 text-sm">
                    {selectedDate.toLocaleDateString("pl-PL", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingEvent(null);
                }}
                className="p-2.5 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Tytuł wydarzenia *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="np. Spotkanie z klientem"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-lg font-medium"
                />
              </div>

              {/* Event Type & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Typ wydarzenia
                  </label>
                  <select
                    value={formData.event_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        event_type: e.target.value as EventType,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white font-medium"
                  >
                    <option value="MEETING">👥 Spotkanie</option>
                    <option value="WORK">💼 Praca</option>
                    <option value="CALL">📞 Rozmowa</option>
                    <option value="INSPECTION">🔍 Inspekcja</option>
                    <option value="DEADLINE">⏰ Termin</option>
                    <option value="REMINDER">🔔 Przypomnienie</option>
                    <option value="OTHER">📌 Inne</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as
                          | "planned"
                          | "confirmed"
                          | "completed"
                          | "cancelled",
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white font-medium"
                  >
                    <option value="planned">📅 Zaplanowane</option>
                    <option value="confirmed">✅ Potwierdzone</option>
                    <option value="completed">🏁 Zakończone</option>
                    <option value="cancelled">❌ Anulowane</option>
                  </select>
                </div>
              </div>

              {/* All Day Toggle */}
              <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={formData.all_day}
                  onChange={(e) =>
                    setFormData({ ...formData, all_day: e.target.checked })
                  }
                  className="w-5 h-5 rounded-lg border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor="allDay"
                  className="text-sm font-bold text-indigo-700 cursor-pointer"
                >
                  Całodniowe wydarzenie
                </label>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Data rozpoczęcia
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
                  />
                </div>
                {!formData.all_day && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Godzina rozpoczęcia
                    </label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          start_time: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Data zakończenia
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
                  />
                </div>
                {!formData.all_day && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Godzina zakończenia
                    </label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, end_time: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Opis
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Dodaj szczegóły wydarzenia..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none font-medium"
                />
              </div>

              {/* Location */}
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <MapPin size={16} className="text-indigo-500" />
                  Lokalizacja
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="np. Biuro, ul. Przykładowa 10"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
                />
              </div>

              {/* Meeting URL */}
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Video size={16} className="text-blue-500" />
                  Link do spotkania online
                </label>
                <input
                  type="url"
                  value={formData.meeting_url}
                  onChange={(e) =>
                    setFormData({ ...formData, meeting_url: e.target.value })
                  }
                  placeholder="https://meet.google.com/..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
                />
              </div>

              {/* Reminder */}
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Bell size={16} className="text-yellow-500" />
                  Przypomnienie
                </label>
                <select
                  value={formData.reminder_minutes ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reminder_minutes: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white font-medium"
                >
                  <option value="">Bez przypomnienia</option>
                  <option value="5">5 minut przed</option>
                  <option value="15">15 minut przed</option>
                  <option value="30">30 minut przed</option>
                  <option value="60">1 godzina przed</option>
                  <option value="1440">1 dzień przed</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-slate-50 border-t-2 border-slate-100 p-5 rounded-b-2xl flex items-center justify-between">
              {editingEvent ? (
                <div>
                  {deleteConfirm === editingEvent.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-red-600 font-bold">
                        Na pewno usunąć?
                      </span>
                      <button
                        onClick={() => handleDeleteEvent(editingEvent.id)}
                        disabled={saving}
                        className="px-4 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors text-sm"
                      >
                        Tak, usuń
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-4 py-2.5 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-colors text-sm"
                      >
                        Anuluj
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(editingEvent.id)}
                      className="flex items-center gap-2 px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-xl font-bold transition-colors border-2 border-red-200"
                    >
                      <Trash2 size={18} />
                      Usuń wydarzenie
                    </button>
                  )}
                </div>
              ) : (
                <div></div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingEvent(null);
                    setDeleteConfirm(null);
                  }}
                  className="px-6 py-3 text-slate-600 hover:bg-slate-200 rounded-xl font-bold transition-colors border-2 border-slate-200"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleSaveEvent}
                  disabled={saving || !formData.title.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Zapisuję...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      {editingEvent ? "Zapisz zmiany" : "Dodaj wydarzenie"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

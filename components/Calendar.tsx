import React, { useState, useMemo, useEffect } from "react";
import { useProjectEvents, type ProjectEvent } from "../hooks/useProjectEvents";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
} from "lucide-react";

interface CalendarProps {
  projectId: string;
}

type CalendarView = "month" | "week" | "day";

export function Calendar({ projectId }: CalendarProps) {
  const {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    getMonthEvents,
  } = useProjectEvents(projectId);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [selectedEvent, setSelectedEvent] = useState<ProjectEvent | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);

  // Get calendar data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Generate calendar grid
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNames = [
    "Styczeń",
    "Luty",
    "Marzec",
    "Kwiecień",
    "Maj",
    "Czerwiec",
    "Lipiec",
    "Sierpień",
    "Wrzesień",
    "Październik",
    "Listopad",
    "Grudzień",
  ];

  const dayNames = ["Nd", "Pn", "Wt", "Śr", "Czw", "Pt", "So"];

  // Generate calendar days
  const calendarDays = [];
  const startingBlanks = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1; // Adjust for Monday start

  // Add blank days
  for (let i = 0; i < startingBlanks; i++) {
    calendarDays.push(null);
  }

  // Add month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Get events for specific day
  const getEventsForDay = (day: number) => {
    const dayDate = new Date(year, month, day);
    return events.filter((event) => {
      const eventDate = new Date(event.start_date);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === month &&
        eventDate.getFullYear() === year
      );
    });
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Load events when month changes
  useEffect(() => {
    getMonthEvents(year, month + 1);
  }, [currentDate]);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "meeting":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "deadline":
        return "bg-red-100 text-red-800 border-red-200";
      case "milestone":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "inspection":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "delivery":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
        Error loading events: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Kalendarz</h2>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Dzisiaj
          </button>
        </div>

        <button
          onClick={() => setShowEventForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nowe wydarzenie
        </button>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900">
              {monthNames[month]} {year}
            </h3>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setView("month")}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                view === "month"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Miesiąc
            </button>
            <button
              onClick={() => setView("week")}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                view === "week"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Tydzień
            </button>
            <button
              onClick={() => setView("day")}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                view === "day"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Dzień
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day names */}
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-gray-600 py-2"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            if (day === null) {
              return (
                <div
                  key={`blank-${index}`}
                  className="h-24 bg-gray-50 rounded"
                ></div>
              );
            }

            const dayEvents = getEventsForDay(day);
            const isTodayDay = isToday(day);

            return (
              <div
                key={day}
                className={`h-24 border rounded p-1 hover:bg-gray-50 cursor-pointer transition-colors ${
                  isTodayDay
                    ? "bg-blue-50 border-blue-300"
                    : "bg-white border-gray-200"
                }`}
              >
                <div
                  className={`text-xs font-semibold mb-1 ${
                    isTodayDay ? "text-blue-600" : "text-gray-700"
                  }`}
                >
                  {day}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className={`text-xs px-1.5 py-0.5 rounded border truncate ${getEventTypeColor(
                        event.event_type
                      )}`}
                      onClick={() => setSelectedEvent(event)}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500 px-1.5">
                      +{dayEvents.length - 2} więcej
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Nadchodzące wydarzenia
        </h3>
        <div className="space-y-3">
          {events
            .filter((event) => new Date(event.start_date) >= new Date())
            .slice(0, 5)
            .map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedEvent(event)}
              >
                <div
                  className={`p-2 rounded ${getEventTypeColor(
                    event.event_type
                  )}`}
                >
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{event.title}</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(event.start_date).toLocaleString("pl-PL", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {event.location && (
                    <p className="text-sm text-gray-500 mt-1">
                      📍 {event.location}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded border ${getEventTypeColor(
                    event.event_type
                  )}`}
                >
                  {event.event_type}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Event Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600">Wszystkie wydarzenia</p>
          <p className="text-2xl font-bold text-gray-900">{events.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600">Spotkania</p>
          <p className="text-2xl font-bold text-blue-600">
            {events.filter((e) => e.event_type === "meeting").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600">Deadlines</p>
          <p className="text-2xl font-bold text-red-600">
            {events.filter((e) => e.event_type === "deadline").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600">Milestones</p>
          <p className="text-2xl font-bold text-purple-600">
            {events.filter((e) => e.event_type === "milestone").length}
          </p>
        </div>
      </div>
    </div>
  );
}

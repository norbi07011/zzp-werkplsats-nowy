/**
 * Team Calendar - Monthly View with Tasks
 */

import React, { useState, useMemo } from "react";
import { Language, TeamMember, TeamTask, TaskTemplate } from "../types";
import { DICTIONARY, TASK_TEMPLATES } from "../constants";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface TeamCalendarProps {
  tasks: TeamTask[];
  setTasks: React.Dispatch<React.SetStateAction<TeamTask[]>>;
  members: TeamMember[];
  currentUser: TeamMember;
  language: Language;
  templates: TaskTemplate[];
}

const DAYS_PL = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"];
const MONTHS_PL = [
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

export const TeamCalendar: React.FC<TeamCalendarProps> = ({
  tasks,
  setTasks,
  members,
  currentUser,
  language,
  templates,
}) => {
  const t = DICTIONARY[language];
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as TeamTask["priority"],
  });

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDay = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = lastDayOfMonth.getDate();

  // Previous month days
  const prevMonthDays = new Date(year, month, 0).getDate();

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = [];

    // Previous month days
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        month: month - 1,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month: month,
        isCurrentMonth: true,
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        month: month + 1,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month, startingDay, daysInMonth, prevMonthDays]);

  // Get tasks for a specific date
  const getTasksForDate = (day: number, monthOffset: number = 0) => {
    const targetDate = new Date(year, month + monthOffset, day);
    return tasks.filter((task) => {
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === targetDate.toDateString();
    });
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(year, month + direction, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (day: number, monthOffset: number) => {
    const clickedDate = new Date(year, month + monthOffset, day);
    setSelectedDate(clickedDate);
  };

  const handleAddTask = () => {
    if (!newTask.title.trim() || !selectedDate) {
      toast.error("Podaj tytuł zadania");
      return;
    }

    const task: TeamTask = {
      id: crypto.randomUUID(),
      title: newTask.title,
      description: newTask.description,
      status: "todo",
      priority: newTask.priority,
      dueDate: selectedDate.toISOString().split("T")[0],
      assigneeId: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) => [...prev, task]);
    setNewTask({ title: "", description: "", priority: "medium" });
    setShowAddModal(false);
    toast.success("✅ Zadanie dodane");
  };

  const isToday = (day: number, isCurrentMonth: boolean) => {
    const today = new Date();
    return (
      isCurrentMonth &&
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const priorityDot = {
    low: "bg-slate-400",
    medium: "bg-blue-500",
    high: "bg-amber-500",
    urgent: "bg-red-500",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-2xl font-bold text-slate-800 min-w-[200px] text-center">
            {MONTHS_PL[month]} {year}
          </h2>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            Dzisiaj
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
          {DAYS_PL.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-sm font-medium text-slate-600"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((dateInfo, idx) => {
            const dayTasks = getTasksForDate(
              dateInfo.day,
              dateInfo.month - month
            );
            const today = isToday(dateInfo.day, dateInfo.isCurrentMonth);
            const isSelected =
              selectedDate &&
              selectedDate.getDate() === dateInfo.day &&
              selectedDate.getMonth() === dateInfo.month;

            return (
              <div
                key={idx}
                onClick={() =>
                  handleDateClick(dateInfo.day, dateInfo.month - month)
                }
                className={`min-h-[100px] p-2 border-b border-r border-slate-100 cursor-pointer transition-colors ${
                  !dateInfo.isCurrentMonth ? "bg-slate-50" : "hover:bg-slate-50"
                } ${
                  isSelected
                    ? "bg-indigo-50 ring-2 ring-indigo-500 ring-inset"
                    : ""
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full mb-1 ${
                    today ? "bg-indigo-600 text-white" : ""
                  } ${
                    !dateInfo.isCurrentMonth
                      ? "text-slate-400"
                      : "text-slate-700"
                  }`}
                >
                  {dateInfo.day}
                </div>

                {/* Task indicators */}
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-1 text-xs px-1.5 py-0.5 bg-slate-100 rounded truncate"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          priorityDot[task.priority]
                        }`}
                      />
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-slate-400 pl-1">
                      +{dayTasks.length - 3} więcej
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Panel */}
      {selectedDate && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800">
              {selectedDate.toLocaleDateString("pl-PL", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4" />
              Dodaj zadanie
            </button>
          </div>

          {/* Tasks for selected date */}
          {getTasksForDate(selectedDate.getDate()).length > 0 ? (
            <div className="space-y-2">
              {getTasksForDate(selectedDate.getDate()).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      priorityDot[task.priority]
                    }`}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-slate-700">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-slate-500">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-lg ${
                      task.status === "done"
                        ? "bg-emerald-100 text-emerald-600"
                        : task.status === "in_progress"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {t[task.status]}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Brak zadań na ten dzień</p>
            </div>
          )}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                Dodaj zadanie na {selectedDate.toLocaleDateString("pl-PL")}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tytuł
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nazwa zadania..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Opis
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Priorytet
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      priority: e.target.value as any,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="low">{t.low}</option>
                  <option value="medium">{t.medium}</option>
                  <option value="high">{t.high}</option>
                  <option value="urgent">{t.urgent}</option>
                </select>
              </div>

              {/* Quick Templates */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Szybkie szablony
                </label>
                <div className="flex flex-wrap gap-2">
                  {TASK_TEMPLATES.slice(0, 4).map((template) => (
                    <button
                      key={template.id}
                      onClick={() =>
                        setNewTask((prev) => ({
                          ...prev,
                          title: template.title,
                          description: template.description,
                          priority: template.priority,
                        }))
                      }
                      className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                    >
                      {template.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
              >
                Anuluj
              </button>
              <button
                onClick={handleAddTask}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Dodaj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamCalendar;

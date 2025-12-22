/**
 * Team Calendar - Full Featured Calendar with Tasks & Deadlines
 * Based on boekhouder-connect Calendar.tsx
 */

import React, { useState, useMemo } from "react";
import {
  Language,
  TeamMember,
  TeamTask,
  TaskTemplate,
  TaskCategory,
  TaskStatus,
} from "../types";
import { DICTIONARY, TASK_TEMPLATES } from "../constants";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  X,
  Target,
  Sparkles as Wand2,
  Briefcase,
  Save,
  Trash2,
  AlertTriangle,
  Timer,
  LayoutTemplate,
  Filter,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface TeamCalendarFullProps {
  tasks: TeamTask[];
  setTasks: React.Dispatch<React.SetStateAction<TeamTask[]>>;
  members: TeamMember[];
  currentUser: TeamMember;
  language: Language;
  templates: TaskTemplate[];
}

// Tax deadlines for Netherlands
const TAX_DEADLINES = [
  {
    date: "2025-01-31",
    title: "BTW Q4 2024",
    descriptionPL: "Deklaracja BTW za Q4 2024",
    descriptionNL: "BTW aangifte Q4 2024",
  },
  {
    date: "2025-03-31",
    title: "IB Aangifte",
    descriptionPL: "Roczne rozliczenie podatkowe",
    descriptionNL: "Jaarlijkse belastingaangifte",
  },
  {
    date: "2025-04-30",
    title: "BTW Q1 2025",
    descriptionPL: "Deklaracja BTW za Q1 2025",
    descriptionNL: "BTW aangifte Q1 2025",
  },
  {
    date: "2025-07-31",
    title: "BTW Q2 2025",
    descriptionPL: "Deklaracja BTW za Q2 2025",
    descriptionNL: "BTW aangifte Q2 2025",
  },
  {
    date: "2025-10-31",
    title: "BTW Q3 2025",
    descriptionPL: "Deklaracja BTW za Q3 2025",
    descriptionNL: "BTW aangifte Q3 2025",
  },
];

const DAYS_PL = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"];
const DAYS_NL = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
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
const MONTHS_NL = [
  "Januari",
  "Februari",
  "Maart",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Augustus",
  "September",
  "Oktober",
  "November",
  "December",
];

// Get ISO week number (Dutch standard)
const getWeekNumber = (date: Date): number => {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

// Get Monday date from week number
const getDateFromWeek = (weekNum: number, year: number): Date => {
  const simple = new Date(year, 0, 1 + (weekNum - 1) * 7);
  const dow = simple.getDay();
  const monday = simple;
  if (dow <= 4) monday.setDate(simple.getDate() - simple.getDay() + 1);
  else monday.setDate(simple.getDate() + 8 - simple.getDay());
  return monday;
};

// Get weeks in year
const getWeeksInYear = (year: number): number[] => {
  const weeks: number[] = [];
  for (let i = 1; i <= 52; i++) weeks.push(i);
  return weeks;
};

export const TeamCalendarFull: React.FC<TeamCalendarFullProps> = ({
  tasks,
  setTasks,
  members,
  currentUser,
  language,
  templates,
}) => {
  const t = DICTIONARY[language];
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [viewFilter, setViewFilter] = useState<"ALL" | "MINE" | "DEADLINES">(
    "ALL"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Smart builder state
  const [clientName, setClientName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [selectedWeek, setSelectedWeek] = useState("");

  const [editingTask, setEditingTask] = useState<Partial<TeamTask>>({
    title: "",
    description: "",
    dueDate: new Date().toISOString().split("T")[0],
    dueTime: "",
    priority: "medium",
    assigneeId: currentUser.id,
    assigneeIds: [currentUser.id],
    status: "todo",
    category: "General",
    estimatedHours: 0,
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

  const monthName = language === "PL" ? MONTHS_PL[month] : MONTHS_NL[month];
  const dayNames = language === "PL" ? DAYS_PL : DAYS_NL;
  const futureYears = [year, year + 1, year + 2, year + 3];

  // Generate week rows for month
  const getWeekRowsForMonth = () => {
    const rows: { weekNum: number; days: (number | null)[] }[] = [];
    let day = 1;
    let firstWeekRow = true;

    while (day <= daysInMonth) {
      const weekDays: (number | null)[] = [];
      const weekNum = getWeekNumber(new Date(year, month, day));

      for (let i = 0; i < 7; i++) {
        if (firstWeekRow && i < firstDay) {
          weekDays.push(null);
        } else if (day <= daysInMonth) {
          weekDays.push(day);
          day++;
        } else {
          weekDays.push(null);
        }
      }

      firstWeekRow = false;
      rows.push({ weekNum, days: weekDays });
    }
    return rows;
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const getContentForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;

    let dayTasks: TeamTask[] = [];
    if (viewFilter !== "DEADLINES") {
      dayTasks = tasks.filter((t) => t.dueDate === dateStr);
      if (viewFilter === "MINE") {
        dayTasks = dayTasks.filter((t) => t.assigneeId === currentUser.id);
      }
    }

    let dayDeadlines: typeof TAX_DEADLINES = [];
    if (viewFilter === "ALL" || viewFilter === "DEADLINES") {
      dayDeadlines = TAX_DEADLINES.filter((d) => d.date === dateStr);
    }

    return { dayTasks, dayDeadlines };
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    setEditingTask({
      title: "",
      description: "",
      dueDate: dateStr,
      dueTime: "",
      priority: "medium",
      assigneeId: currentUser.id,
      assigneeIds: [currentUser.id],
      status: "todo",
      category: "General",
      estimatedHours: 0,
    });
    setClientName("");
    setSelectedTemplate("");
    setSelectedPeriod("");
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleTaskClick = (e: React.MouseEvent, task: TeamTask) => {
    e.stopPropagation();
    setEditingTask(task);
    setIsEditing(true);
    setClientName(task.title.split("-").pop()?.trim() || "");
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask.title || isSaving) return;
    setIsSaving(true);

    try {
      if (isEditing && editingTask.id) {
        setTasks(
          tasks.map((t) =>
            t.id === editingTask.id
              ? ({
                  ...t,
                  ...editingTask,
                  updatedAt: new Date().toISOString(),
                } as TeamTask)
              : t
          )
        );
        toast.success("✅ Zadanie zaktualizowane");
      } else {
        const newTask: TeamTask = {
          id: crypto.randomUUID(),
          title: editingTask.title!,
          description: editingTask.description || "",
          assigneeId:
            editingTask.assigneeIds?.[0] || editingTask.assigneeId || null,
          assigneeIds: editingTask.assigneeIds || [],
          dueDate:
            editingTask.dueDate || new Date().toISOString().split("T")[0],
          dueTime: editingTask.dueTime,
          status: editingTask.status || "todo",
          priority: editingTask.priority || "medium",
          category: editingTask.category || "General",
          estimatedHours: editingTask.estimatedHours || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setTasks((prev) => [...prev, newTask]);
        toast.success("✅ Zadanie dodane");
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("❌ Błąd przy zapisywaniu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editingTask.id || isDeleting) return;
    setIsDeleting(true);
    setTasks(tasks.filter((t) => t.id !== editingTask.id));
    setIsModalOpen(false);
    setIsDeleting(false);
    toast.success("🗑️ Zadanie usunięte");
  };

  const applyTemplate = (tpl: TaskTemplate) => {
    setSelectedTemplate(tpl.title);
    setEditingTask((prev) => ({
      ...prev,
      description: tpl.description,
      priority: tpl.priority,
      category: tpl.category || "General",
    }));
  };

  return (
    <div className="h-full w-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-300 via-slate-200 to-slate-300 p-2 sm:p-6 flex flex-col shadow-[inset_0_0_40px_rgba(0,0,0,0.1)]">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />

      {/* Main Panel */}
      <div className="relative z-10 flex-1 flex flex-col bg-white/10 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl overflow-hidden ring-1 ring-white/50">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 border-b border-white/20 bg-gradient-to-r from-white/20 to-transparent gap-4">
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-3 rounded-xl shadow-lg hidden sm:block">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight drop-shadow-sm">
                {monthName} {year}
              </h2>
              <p className="text-slate-500 text-sm font-medium">{t.calendar}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            {/* Filter Tabs */}
            <div className="flex bg-slate-100/50 backdrop-blur-md p-1 rounded-xl border border-white/40 shadow-inner shrink-0">
              <button
                onClick={() => setViewFilter("ALL")}
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewFilter === "ALL"
                    ? "bg-white shadow-sm text-blue-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.all_tasks}
              </button>
              <button
                onClick={() => setViewFilter("MINE")}
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewFilter === "MINE"
                    ? "bg-white shadow-sm text-blue-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.my_tasks}
              </button>
              <button
                onClick={() => setViewFilter("DEADLINES")}
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewFilter === "DEADLINES"
                    ? "bg-white shadow-sm text-orange-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Deadlines
              </button>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-100/30 p-1.5 rounded-xl border border-white/40 shrink-0">
              <button
                onClick={goToToday}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-white text-slate-600 hover:text-blue-600 transition-all shadow-sm"
              >
                <Target className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="h-6 w-px bg-slate-300/50 mx-1"></div>
              <button
                onClick={prevMonth}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-all"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-all"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <button
              onClick={() => handleDayClick(new Date().getDate())}
              className="hidden sm:flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-xl whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t.new_task}
            </button>
          </div>
        </div>

        {/* Days Header with Week column */}
        <div className="grid grid-cols-8 border-b border-white/10 bg-slate-50/20">
          <div className="py-2 sm:py-4 text-center text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50/50">
            {t.week || "Week"}
          </div>
          {dayNames.map((day, idx) => (
            <div
              key={idx}
              className="py-2 sm:py-4 text-center text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 p-2 sm:p-4 overflow-y-auto">
          {getWeekRowsForMonth().map((weekRow, rowIdx) => (
            <div
              key={rowIdx}
              className="grid grid-cols-8 gap-1 sm:gap-3 mb-1 sm:mb-3"
            >
              {/* Week Number */}
              <div className="rounded-xl sm:rounded-2xl p-1 sm:p-3 flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200/60 shadow-sm min-h-[60px] sm:min-h-[100px]">
                <div className="text-center">
                  <span className="text-[8px] sm:text-[10px] font-bold text-blue-400 uppercase block">
                    {t.week || "Wk"}
                  </span>
                  <span className="text-lg sm:text-2xl font-black text-blue-600">
                    {weekRow.weekNum}
                  </span>
                </div>
              </div>

              {/* Days */}
              {weekRow.days.map((day, dayIdx) => {
                if (!day)
                  return (
                    <div
                      key={dayIdx}
                      className="rounded-xl border border-transparent min-h-[60px] sm:min-h-[100px]"
                    />
                  );

                const { dayTasks, dayDeadlines } = getContentForDay(day);
                const today = isToday(day);

                return (
                  <div
                    key={dayIdx}
                    onClick={() => handleDayClick(day)}
                    className={`relative rounded-xl sm:rounded-2xl p-1 sm:p-3 flex flex-col justify-between transition-all duration-300 group cursor-pointer
                      border border-white/60 shadow-sm min-h-[60px] sm:min-h-[100px]
                      ${
                        today
                          ? "bg-gradient-to-br from-blue-50 to-blue-100/50 ring-1 sm:ring-2 ring-blue-500/30"
                          : "bg-gradient-to-br from-white/40 to-white/10 hover:from-white/80 hover:to-white/40"
                      }
                      hover:scale-[1.05] hover:z-20 hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] hover:border-blue-300/50`}
                  >
                    <div className="flex justify-between items-start z-10">
                      <span
                        className={`text-xs sm:text-lg font-bold flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full
                        ${
                          today
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                            : "text-slate-600 group-hover:text-blue-700 bg-white/50 group-hover:bg-white"
                        }`}
                      >
                        {day}
                      </span>

                      {(dayTasks.length > 0 || dayDeadlines.length > 0) && (
                        <div className="flex space-x-0.5 sm:space-x-1 mt-1 sm:mt-0">
                          {dayDeadlines.map((_, i) => (
                            <div
                              key={`d-${i}`}
                              className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-orange-500 shadow-sm"
                            />
                          ))}
                          {dayTasks
                            .slice(0, 3 - dayDeadlines.length)
                            .map((t, i) => (
                              <div
                                key={`t-${i}`}
                                className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${
                                  t.priority === "high" ||
                                  t.priority === "urgent"
                                    ? "bg-red-500"
                                    : "bg-blue-500"
                                } shadow-sm`}
                              />
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 sm:space-y-1.5 mt-1 sm:mt-2 z-10 overflow-hidden">
                      {/* Deadlines */}
                      {dayDeadlines.map((deadline, i) => (
                        <div
                          key={`dl-${i}`}
                          className="text-[8px] sm:text-[10px] truncate px-1 sm:px-2 py-0.5 sm:py-1.5 rounded sm:rounded-lg font-bold shadow-sm border border-orange-200 bg-orange-100/90 text-orange-800 flex items-center justify-center sm:justify-start"
                          title={
                            language === "PL"
                              ? deadline.descriptionPL
                              : deadline.descriptionNL
                          }
                        >
                          <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 sm:mr-1 inline-block" />
                          <span className="hidden sm:inline">
                            {deadline.title}
                          </span>
                        </div>
                      ))}

                      {/* Tasks */}
                      {dayTasks
                        .slice(0, 2 - (dayDeadlines.length > 0 ? 1 : 0))
                        .map((task) => (
                          <div
                            key={task.id}
                            onClick={(e) => handleTaskClick(e, task)}
                            className={`text-[8px] sm:text-[10px] truncate px-1 sm:px-2 py-0.5 sm:py-1.5 rounded sm:rounded-lg font-medium shadow-sm border transition-all hover:scale-105
                            ${
                              task.status === "done"
                                ? "opacity-50 line-through grayscale"
                                : ""
                            }
                            ${
                              task.priority === "high" ||
                              task.priority === "urgent"
                                ? "bg-red-50/90 border-red-200 text-red-700"
                                : "bg-blue-50/90 border-blue-200 text-blue-700"
                            }`}
                          >
                            {task.dueTime && (
                              <span className="mr-1 text-slate-500 font-bold">
                                {task.dueTime}
                              </span>
                            )}
                            {task.title}
                          </div>
                        ))}

                      {dayTasks.length + dayDeadlines.length > 2 && (
                        <div className="text-[8px] sm:text-[10px] text-slate-500 font-medium pl-1">
                          <span className="sm:hidden">+</span>{" "}
                          <span className="hidden sm:inline">
                            + {dayTasks.length + dayDeadlines.length - 2} więcej
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/50 w-full sm:w-[700px] h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-200/60 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white sticky top-0 z-20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                  {isEditing ? (
                    <Target className="w-5 h-5" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-800">
                  {isEditing ? t.edit_task : t.new_task}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1"
            >
              {/* Smart Builder */}
              {!isEditing && (
                <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 shadow-inner">
                  <div className="flex items-center mb-3">
                    <Wand2 className="w-4 h-4 text-blue-500 mr-2" />
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      {t.quick_templates}
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {templates.map((tpl, idx) => (
                      <button
                        key={tpl.id || idx}
                        type="button"
                        onClick={() => applyTemplate(tpl)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all hover:scale-105 ${
                          selectedTemplate === tpl.title
                            ? "ring-2 ring-offset-1 ring-blue-500"
                            : ""
                        } ${tpl.color}`}
                      >
                        {tpl.label || tpl.title}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 sm:col-span-4">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        {t.client_name}
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder={t.client_name}
                          className="w-full pl-8 bg-white border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        {t.period}
                      </label>
                      <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">-</option>
                        <option value="Q1">Q1</option>
                        <option value="Q2">Q2</option>
                        <option value="Q3">Q3</option>
                        <option value="Q4">Q4</option>
                      </select>
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        {t.year}
                      </label>
                      <select
                        value={selectedYear}
                        onChange={(e) => {
                          setSelectedYear(e.target.value);
                          setSelectedWeek("");
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        {futureYears.map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-4 sm:col-span-4">
                      <label className="block text-[10px] font-bold text-blue-500 uppercase mb-1">
                        📅 {t.week || "Week"} (NL)
                      </label>
                      <select
                        value={selectedWeek}
                        onChange={(e) => {
                          setSelectedWeek(e.target.value);
                          if (e.target.value) {
                            const monday = getDateFromWeek(
                              parseInt(e.target.value),
                              parseInt(selectedYear)
                            );
                            setEditingTask((prev) => ({
                              ...prev,
                              dueDate: monday.toISOString().split("T")[0],
                            }));
                          }
                        }}
                        className="w-full bg-blue-50 border border-blue-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-700"
                      >
                        <option value="">
                          -- {t.select_week || "Select Week"} --
                        </option>
                        {getWeeksInYear(parseInt(selectedYear)).map((wk) => (
                          <option key={wk} value={wk}>
                            Week {wk}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Title & Category */}
              <div className="grid grid-cols-12 gap-5">
                <div className="col-span-12 md:col-span-8">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    {t.title}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTask.title}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, title: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700 shadow-sm"
                    placeholder={t.title}
                  />
                </div>
                <div className="col-span-12 md:col-span-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    {t.category}
                  </label>
                  <div className="relative">
                    <LayoutTemplate className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <select
                      value={editingTask.category || "General"}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          category: e.target.value,
                        })
                      }
                      className="w-full pl-10 bg-white border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                    >
                      <option value="General">{t.cat_general}</option>
                      <option value="Tax">{t.cat_tax}</option>
                      <option value="Payroll">{t.cat_payroll}</option>
                      <option value="Audit">{t.cat_audit}</option>
                      <option value="Meeting">{t.cat_meeting}</option>
                      <option value="Advisory">{t.cat_advisory}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    {t.dueDate}
                  </label>
                  <div className="relative group">
                    <CalendarIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      required
                      value={editingTask.dueDate}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          dueDate: e.target.value,
                        })
                      }
                      className="w-full pl-10 bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    {t.dueTime}
                  </label>
                  <div className="relative group">
                    <Clock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="time"
                      value={editingTask.dueTime}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          dueTime: e.target.value,
                        })
                      }
                      className="w-full pl-10 bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Status, Priority, Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    {t.priority}
                  </label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        priority: e.target.value as any,
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                  >
                    <option value="low">{t.low}</option>
                    <option value="medium">{t.medium}</option>
                    <option value="high">{t.high}</option>
                    <option value="urgent">{t.urgent}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    {t.status}
                  </label>
                  <select
                    value={editingTask.status}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                  >
                    <option value="todo">{t.todo}</option>
                    <option value="in_progress">{t.in_progress}</option>
                    <option value="review">{t.review}</option>
                    <option value="done">{t.done}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    {t.estimated_hours}
                  </label>
                  <div className="relative">
                    <Timer className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={editingTask.estimatedHours}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          estimatedHours: parseFloat(e.target.value),
                        })
                      }
                      className="w-full pl-10 bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                      placeholder="0.0"
                    />
                  </div>
                </div>
              </div>

              {/* Assignees */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  {t.assignee} ({editingTask.assigneeIds?.length || 0} wybrano)
                </label>
                <div className="bg-white border border-slate-300 rounded-xl p-3 max-h-40 overflow-y-auto">
                  {members.map((u) => {
                    const isSelected =
                      editingTask.assigneeIds?.includes(u.id) || false;
                    return (
                      <label
                        key={u.id}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? "bg-blue-50 border border-blue-200"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const currentIds = editingTask.assigneeIds || [];
                            setEditingTask({
                              ...editingTask,
                              assigneeIds: e.target.checked
                                ? [...currentIds, u.id]
                                : currentIds.filter((id) => id !== u.id),
                            });
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-6 h-6 rounded-full object-cover border border-slate-200"
                        />
                        <span className="text-sm font-medium text-slate-700">
                          {u.name}
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-blue-600 ml-auto" />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  {t.description}
                </label>
                <textarea
                  value={editingTask.description}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none h-28 resize-none shadow-inner"
                  placeholder={t.description}
                />
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center pt-5 border-t border-slate-100 mt-2 sticky bottom-0 bg-white z-10 pb-2">
                {isEditing ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg flex items-center text-sm font-bold disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    <span className="hidden sm:inline">{t.delete_task}</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSaving}
                    className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-bold"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl shadow-lg flex items-center text-sm font-bold hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {t.save_changes}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamCalendarFull;

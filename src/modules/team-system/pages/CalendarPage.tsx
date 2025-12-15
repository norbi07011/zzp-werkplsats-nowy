import React, { useState, useEffect } from "react";
import { useStore } from "../context/StoreContext";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  parseISO,
  startOfMonth,
  endOfMonth,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isWithinInterval,
  isSameMonth,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Flag,
  User,
  Layers,
  Filter,
  X,
  CheckCircle,
  Navigation,
  Plus,
  Info,
  AlertCircle,
} from "lucide-react";
import { Priority, TaskStatus, Task, Project } from "../types";

type ViewMode = "month" | "week";

export const CalendarPage = () => {
  const {
    tasks,
    projects,
    users,
    updateTask,
    t,
    language,
    isLoading,
    selectedTeamId,
    refreshProjects,
    refreshTasks,
  } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  // Refresh data when team changes
  useEffect(() => {
    if (selectedTeamId) {
      refreshProjects();
      refreshTasks();
    }
  }, [selectedTeamId]);

  // Filters
  const [filterUserId, setFilterUserId] = useState<string>("all");
  const [filterProjectId, setFilterProjectId] = useState<string>("all");

  // Modals
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [summaryDate, setSummaryDate] = useState<Date | null>(null);

  // Navigation Logic
  const nextPeriod = () => {
    setCurrentDate(
      viewMode === "month" ? addMonths(currentDate, 1) : addDays(currentDate, 7)
    );
  };

  const prevPeriod = () => {
    setCurrentDate(
      viewMode === "month"
        ? subMonths(currentDate, 1)
        : addDays(currentDate, -7)
    );
  };

  const goToToday = () => setCurrentDate(new Date());

  // Date Generation
  const startDate =
    viewMode === "month"
      ? startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
      : startOfWeek(currentDate, { weekStartsOn: 1 });

  const endDate =
    viewMode === "month"
      ? endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
      : endOfWeek(currentDate, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const todayStr = format(new Date(), "yyyy-MM-dd");

  // Styles Helpers
  const getStatusBorder = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.DONE:
        return "border-l-4 border-green-500";
      case TaskStatus.IN_PROGRESS:
        return "border-l-4 border-blue-500";
      case TaskStatus.BLOCKED:
        return "border-l-4 border-red-500";
      default:
        return "border-l-4 border-slate-300";
    }
  };

  const handleTaskStatusToggle = () => {
    if (!selectedTask) return;
    const newStatus =
      selectedTask.status === TaskStatus.DONE
        ? TaskStatus.IN_PROGRESS
        : TaskStatus.DONE;
    updateTask({ ...selectedTask, status: newStatus });
    setSelectedTask({ ...selectedTask, status: newStatus });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // No team selected
  if (!selectedTeamId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-slate-100">
        <CalendarIcon size={64} className="text-slate-300 mb-4" />
        <h3 className="text-xl font-semibold text-slate-600 mb-2">
          Wybierz zespół
        </h3>
        <p className="text-slate-400">
          Kalendarz wymaga wybrania zespołu do wyświetlenia zadań.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* --- HEADER --- */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-50 rounded-lg text-primary-600">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 capitalize">
                {format(
                  currentDate,
                  language === "pl" ? "MMMM yyyy" : "MMMM yyyy"
                )}
              </h2>
              <p className="text-sm text-slate-400 flex items-center">
                <Layers size={14} className="mr-1" />{" "}
                {projects.filter((p) => p.status === "ACTIVE").length} Active
                Projects
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={prevPeriod}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
            >
              <ChevronLeft />
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              {t("today")}
            </button>
            <button
              onClick={nextPeriod}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
            >
              <ChevronRight />
            </button>
          </div>
        </div>

        {/* --- FILTERS --- */}
        <div className="flex flex-col md:flex-row gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center bg-slate-50 rounded-lg px-3 py-2 border border-slate-200 flex-1">
            <Filter size={16} className="text-slate-400 mr-2" />
            <select
              className="bg-transparent text-sm text-slate-700 outline-none w-full"
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
            >
              <option value="all">{t("allUsers")}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-50 rounded-lg px-3 py-2 border border-slate-200 flex-1">
            <Layers size={16} className="text-slate-400 mr-2" />
            <select
              className="bg-transparent text-sm text-slate-700 outline-none w-full"
              value={filterProjectId}
              onChange={(e) => setFilterProjectId(e.target.value)}
            >
              <option value="all">{t("allProjects")}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("month")}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                viewMode === "month"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t("month")}
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                viewMode === "week"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t("week")}
            </button>
          </div>
        </div>
      </div>

      {/* --- CALENDAR GRID --- */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex-1 flex flex-col">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div
              key={day}
              className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div
          className={`grid grid-cols-7 flex-1 ${
            viewMode === "week" ? "min-h-[500px]" : ""
          } auto-rows-fr bg-slate-100 gap-[1px]`}
        >
          {calendarDays.map((day, idx) => {
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);

            // Filter Logic: Filter Tasks
            let daysTasks = tasks.filter((t) =>
              isSameDay(parseISO(t.dueDate), day)
            );
            if (filterUserId !== "all") {
              daysTasks = daysTasks.filter((t) =>
                t.assignedToIds.includes(filterUserId)
              );
            }
            if (filterProjectId !== "all") {
              daysTasks = daysTasks.filter(
                (t) => t.projectId === filterProjectId
              );
            }

            // Filter Logic: Filter Projects (Active on this day)
            let activeProjects = projects.filter((p) => {
              if (!p.startDate) return false;
              const start = parseISO(p.startDate);
              const end = p.endDate ? parseISO(p.endDate) : addMonths(start, 1);
              return isWithinInterval(day, { start, end });
            });
            if (filterProjectId !== "all") {
              activeProjects = activeProjects.filter(
                (p) => p.id === filterProjectId
              );
            }

            // Determine if project starts or ends today for labeling
            const startingProjects = activeProjects.filter((p) =>
              isSameDay(parseISO(p.startDate), day)
            );
            const endingProjects = activeProjects.filter(
              (p) => p.endDate && isSameDay(parseISO(p.endDate), day)
            );

            return (
              <div
                key={day.toString()}
                onClick={() => setSummaryDate(day)}
                className={`
                  bg-white min-h-[140px] p-2 transition-colors hover:bg-slate-50 relative group flex flex-col cursor-pointer
                  ${!isCurrentMonth ? "bg-slate-50/50" : ""}
                `}
              >
                {/* Header: Date & Add Button */}
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`
                    text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full
                    ${
                      isToday
                        ? "bg-primary-600 text-white"
                        : !isCurrentMonth
                        ? "text-slate-300"
                        : "text-slate-700"
                    }
                  `}
                  >
                    {format(day, "d")}
                  </span>

                  {/* Quick Add (Visible on Hover) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); /* TODO: Link to Add Task with prefilled date */
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-slate-100 hover:bg-primary-100 text-slate-400 hover:text-primary-600 rounded"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Project Timelines (Top of Cell) */}
                <div className="space-y-1 mb-2">
                  {/* Start Markers */}
                  {startingProjects.map((p) => (
                    <div
                      key={`start-${p.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(p);
                      }}
                      className="cursor-pointer bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded border border-emerald-200 flex items-center font-bold truncate"
                    >
                      <Flag size={8} className="mr-1 fill-current" /> {p.title}
                    </div>
                  ))}
                  {/* End Markers */}
                  {endingProjects.map((p) => (
                    <div
                      key={`end-${p.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(p);
                      }}
                      className="cursor-pointer bg-rose-100 hover:bg-rose-200 text-rose-800 text-[9px] px-1.5 py-0.5 rounded border border-rose-200 flex items-center font-bold truncate"
                    >
                      <Flag size={8} className="mr-1 fill-current" /> {p.title}
                    </div>
                  ))}
                  {/* Continuous Bars (Simulated) */}
                  {activeProjects.map((p) => {
                    if (
                      isSameDay(parseISO(p.startDate), day) ||
                      (p.endDate && isSameDay(parseISO(p.endDate), day))
                    )
                      return null;
                    return (
                      <div
                        key={`active-${p.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProject(p);
                        }}
                        className="cursor-pointer group/bar h-2 w-full bg-blue-50 rounded-full overflow-hidden relative"
                        title={p.title}
                      >
                        <div className="h-full bg-blue-300/50 group-hover/bar:bg-blue-400"></div>
                      </div>
                    );
                  })}
                </div>

                {/* Tasks List (Bottom of Cell) */}
                <div className="space-y-1.5 overflow-y-auto max-h-[150px] custom-scrollbar mt-auto">
                  {daysTasks.map((task) => {
                    const assignedUsers = users.filter((u) =>
                      task.assignedToIds.includes(u.id)
                    );
                    const isOverdue =
                      task.dueDate < todayStr &&
                      task.status !== TaskStatus.DONE;

                    return (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(task);
                        }}
                        className={`
                          bg-white p-1.5 rounded shadow-sm border text-xs cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]
                          ${
                            isOverdue
                              ? "border-l-4 border-l-red-500 border-red-200 bg-red-50"
                              : getStatusBorder(task.status)
                          }
                          ${
                            task.status === TaskStatus.DONE
                              ? "opacity-60 grayscale"
                              : ""
                          }
                        `}
                      >
                        <div className="flex justify-between items-start">
                          <span
                            className={`font-medium truncate w-full ${
                              task.status === TaskStatus.DONE
                                ? "line-through text-slate-400"
                                : "text-slate-700"
                            }`}
                          >
                            {task.title}
                          </span>
                          {isOverdue && (
                            <AlertCircle
                              size={12}
                              className="text-red-500 ml-1 flex-shrink-0"
                            />
                          )}
                        </div>

                        <div className="flex justify-between items-center mt-1.5">
                          {/* Priority Dot */}
                          <div
                            className={`w-2 h-2 rounded-full ${
                              task.priority === Priority.URGENT
                                ? "bg-red-500"
                                : task.priority === Priority.HIGH
                                ? "bg-orange-500"
                                : "bg-slate-300"
                            }`}
                          ></div>

                          {/* Assigned Avatars */}
                          <div className="flex -space-x-1.5">
                            {assignedUsers.map((u) => (
                              <img
                                key={u.id}
                                src={u.avatar}
                                alt={u.name}
                                className="w-4 h-4 rounded-full border border-white object-cover"
                                title={u.name}
                              />
                            ))}
                            {assignedUsers.length === 0 && (
                              <User size={12} className="text-slate-300" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- DAY SUMMARY MODAL --- */}
      {summaryDate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-xl text-slate-800">
                  {t("daySummary")}
                </h3>
                <p className="text-slate-500 text-sm font-medium">
                  {format(summaryDate, "eeee, d MMMM yyyy")}
                </p>
              </div>
              <button
                onClick={() => setSummaryDate(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Active Projects Section */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center">
                  <Layers size={14} className="mr-1" /> {t("activeProjectsDay")}
                </h4>
                <div className="space-y-2">
                  {projects
                    .filter((p) => {
                      if (!p.startDate) return false;
                      const start = parseISO(p.startDate);
                      const end = p.endDate
                        ? parseISO(p.endDate)
                        : addMonths(start, 1);
                      return isWithinInterval(summaryDate, { start, end });
                    })
                    .map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedProject(p);
                        }}
                        className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{p.title}</p>
                          <p className="text-xs text-slate-500">
                            {p.street} {p.houseNumber}, {p.city}
                          </p>
                        </div>
                        <button className="text-primary-600 hover:text-primary-800">
                          <Info size={18} />
                        </button>
                      </div>
                    ))}
                  {projects.filter((p) => {
                    if (!p.startDate) return false;
                    const start = parseISO(p.startDate);
                    const end = p.endDate
                      ? parseISO(p.endDate)
                      : addMonths(start, 1);
                    return isWithinInterval(summaryDate, { start, end });
                  }).length === 0 && (
                    <p className="text-sm text-slate-400 italic">
                      No active projects.
                    </p>
                  )}
                </div>
              </div>

              {/* Tasks Section */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center">
                  <CheckCircle size={14} className="mr-1" /> {t("tasksForDay")}
                </h4>
                <div className="space-y-2">
                  {tasks
                    .filter((t) => isSameDay(parseISO(t.dueDate), summaryDate))
                    .map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setSelectedTask(t);
                        }}
                        className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-bold text-slate-800">{t.title}</p>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                              t.status === TaskStatus.DONE
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex -space-x-2">
                            {users
                              .filter((u) => t.assignedToIds.includes(u.id))
                              .map((u) => (
                                <img
                                  key={u.id}
                                  src={u.avatar}
                                  className="w-6 h-6 rounded-full border border-white"
                                  alt={u.name}
                                />
                              ))}
                          </div>
                          <span
                            className={`text-[10px] font-bold ${
                              t.priority === Priority.URGENT
                                ? "text-red-500"
                                : "text-slate-400"
                            }`}
                          >
                            {t.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  {tasks.filter((t) =>
                    isSameDay(parseISO(t.dueDate), summaryDate)
                  ).length === 0 && (
                    <p className="text-sm text-slate-400 italic">
                      {t("noTasks")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TASK DETAIL MODAL --- */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div>
                <h3 className="font-bold text-xl text-slate-800 mb-1">
                  {selectedTask.title}
                </h3>
                <div className="flex gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      selectedTask.priority === Priority.URGENT
                        ? "bg-red-500 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {selectedTask.priority}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold uppercase">
                    {selectedTask.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">
                  {t("description")}
                </label>
                <p className="text-slate-600 text-sm">
                  {selectedTask.description}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">
                  {t("assignedTo")}
                </label>
                <div className="flex gap-2 mt-1">
                  {users
                    .filter((u) => selectedTask.assignedToIds.includes(u.id))
                    .map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center bg-slate-50 px-2 py-1 rounded border border-slate-200"
                      >
                        <img
                          src={u.avatar}
                          className="w-5 h-5 rounded-full mr-2"
                          alt=""
                        />
                        <span className="text-xs font-medium">{u.name}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">
                  Due Date
                </label>
                <p className="text-slate-800 font-medium flex items-center">
                  <Clock size={16} className="mr-2 text-primary-500" />
                  {new Date(selectedTask.dueDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={handleTaskStatusToggle}
                className={`flex-1 py-3 rounded-xl font-bold text-white shadow transition-colors flex items-center justify-center ${
                  selectedTask.status === TaskStatus.DONE
                    ? "bg-yellow-500 hover:bg-yellow-600"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {selectedTask.status === TaskStatus.DONE ? (
                  t("reopen")
                ) : (
                  <>
                    <CheckCircle size={18} className="mr-2" /> {t("markAsDone")}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PROJECT DETAIL MODAL --- */}
      {selectedProject && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 p-6 text-white relative">
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
              <h3 className="font-bold text-xl mb-1">
                {selectedProject.title}
              </h3>
              <p className="text-slate-400 text-sm">
                {selectedProject.clientName}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-xs text-blue-600 font-bold uppercase mb-1">
                    {t("address")}
                  </p>
                  <p className="text-slate-800 font-medium">
                    {selectedProject.street} {selectedProject.houseNumber}
                  </p>
                  <p className="text-slate-600 text-sm">
                    {selectedProject.postalCode} {selectedProject.city}
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${selectedProject.street} ${selectedProject.houseNumber}, ${selectedProject.city}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 shadow-md transition-transform hover:scale-105"
                >
                  <Navigation size={20} />
                </a>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">
                  {t("description")}
                </label>
                <p className="text-slate-600 text-sm">
                  {selectedProject.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">
                    {t("projectStart")}
                  </label>
                  <p className="font-medium text-slate-800">
                    {new Date(selectedProject.startDate).toLocaleDateString()}
                  </p>
                </div>
                {selectedProject.endDate && (
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">
                      {t("projectEnd")}
                    </label>
                    <p className="font-medium text-slate-800">
                      {new Date(selectedProject.endDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

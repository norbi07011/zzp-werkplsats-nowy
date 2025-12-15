import React, { useState } from "react";
import { useProjectTasks, type ProjectTask } from "../hooks/useProjectTasks";
import { useAuth } from "../contexts/AuthContext";
import { TaskFormModal } from "./Tasks/TaskFormModal";
import {
  Plus,
  Filter,
  Search,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  CheckSquare,
} from "lucide-react";

interface TaskListProps {
  projectId: string;
}

type TaskView = "list" | "kanban";
type TaskFilter = "all" | "my-tasks" | "high-priority" | "overdue";
type SortField = "title" | "priority" | "due_date" | "status" | "created_at";
type SortOrder = "asc" | "desc";

export function TaskList({ projectId }: TaskListProps) {
  const { tasks, loading, error, updateTask, deleteTask } =
    useProjectTasks(projectId);
  const { user } = useAuth(); // ✅ NEW: Get current user
  const [view, setView] = useState<TaskView>("kanban");
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [draggedTask, setDraggedTask] = useState<ProjectTask | null>(null); // ✅ NEW: For drag&drop
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set()); // ✅ NEW: For bulk actions
  const [bulkActionMode, setBulkActionMode] = useState(false); // ✅ NEW: Toggle bulk select mode
  const [sortField, setSortField] = useState<SortField>("created_at"); // ✅ NEW: Sort field
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc"); // ✅ NEW: Sort order

  // Filter and search tasks
  const filteredTasks = tasks
    .filter((task) => {
      // Search filter
      if (
        searchQuery &&
        !task.title.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Status filters
      switch (filter) {
        case "my-tasks":
          return task.assigned_to === user?.id; // ✅ FIXED: Use actual user ID
        case "high-priority":
          return task.priority === "high" || task.priority === "urgent";
        case "overdue":
          return (
            task.due_date &&
            new Date(task.due_date) < new Date() &&
            task.status !== "completed"
          );
        default:
          return true;
      }
    })
    .sort((a, b) => {
      // ✅ NEW: Sort tasks
      let comparison = 0;

      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "priority":
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case "due_date":
          const dateA = a.due_date ? new Date(a.due_date).getTime() : 0;
          const dateB = b.due_date ? new Date(b.due_date).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "created_at":
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Group tasks by status for Kanban
  const tasksByStatus = {
    not_started: filteredTasks.filter((t) => t.status === "not_started"),
    in_progress: filteredTasks.filter((t) => t.status === "in_progress"),
    review: filteredTasks.filter((t) => t.status === "review"),
    completed: filteredTasks.filter((t) => t.status === "completed"),
    blocked: filteredTasks.filter((t) => t.status === "blocked"),
  };

  // Handler do otwierania formularza (nowe zadanie)
  const handleOpenNewTaskForm = () => {
    setSelectedTask(null);
    setShowTaskForm(true);
  };

  // Handler do otwierania formularza (edycja zadania)
  const handleOpenEditTaskForm = (task: ProjectTask) => {
    setSelectedTask(task);
    setShowTaskForm(true);
  };

  // Handler po zapisaniu
  const handleTaskSaved = () => {
    setShowTaskForm(false);
    setSelectedTask(null);
    // useProjectTasks hook automatycznie przeładuje listę
  };

  // ✅ NEW: Drag&Drop handlers
  const handleDragStart = (e: React.DragEvent, task: ProjectTask) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (
    e: React.DragEvent,
    newStatus: ProjectTask["status"]
  ) => {
    e.preventDefault();

    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      await updateTask(draggedTask.id, { status: newStatus });
      setDraggedTask(null);
    } catch (error) {
      console.error("Error updating task status:", error);
      alert("Błąd podczas zmiany statusu zadania");
    }
  };

  // ✅ NEW: Bulk action handlers
  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const selectAllTasks = () => {
    setSelectedTasks(new Set(filteredTasks.map((t) => t.id)));
  };

  const deselectAllTasks = () => {
    setSelectedTasks(new Set());
  };

  const bulkDelete = async () => {
    if (selectedTasks.size === 0) return;

    if (!confirm(`Czy na pewno chcesz usunąć ${selectedTasks.size} zadań?`)) {
      return;
    }

    try {
      await Promise.all(Array.from(selectedTasks).map((id) => deleteTask(id)));
      setSelectedTasks(new Set());
      setBulkActionMode(false);
    } catch (error) {
      console.error("Error bulk deleting tasks:", error);
      alert("Błąd podczas usuwania zadań");
    }
  };

  const bulkChangeStatus = async (newStatus: ProjectTask["status"]) => {
    if (selectedTasks.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedTasks).map((id) =>
          updateTask(id, { status: newStatus })
        )
      );
      setSelectedTasks(new Set());
      setBulkActionMode(false);
    } catch (error) {
      console.error("Error bulk updating status:", error);
      alert("Błąd podczas zmiany statusu zadań");
    }
  };

  const bulkAssign = async (userId: string) => {
    if (selectedTasks.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedTasks).map((id) =>
          updateTask(id, { assigned_to: userId })
        )
      );
      setSelectedTasks(new Set());
      setBulkActionMode(false);
    } catch (error) {
      console.error("Error bulk assigning tasks:", error);
      alert("Błąd podczas przypisywania zadań");
    }
  };

  // ✅ NEW: Export to CSV
  const exportToCSV = () => {
    const headers = [
      "ID",
      "Tytuł",
      "Status",
      "Priorytet",
      "Termin",
      "Przypisane do",
      "Utworzono",
    ];
    const rows = filteredTasks.map((task) => [
      task.id,
      task.title,
      task.status,
      task.priority,
      task.due_date || "",
      task.assigned_to || "",
      new Date(task.created_at).toLocaleString("pl-PL"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `zadania_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "blocked":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
        Error loading tasks: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Zadania</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setBulkActionMode(!bulkActionMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              bulkActionMode
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            {bulkActionMode ? "Anuluj" : "Zaznacz wiele"}
          </button>
          <button
            onClick={handleOpenNewTaskForm}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nowe zadanie
          </button>
        </div>
      </div>

      {/* ✅ NEW: Bulk Actions Bar */}
      {bulkActionMode && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-purple-900">
                Zaznaczono: {selectedTasks.size}
              </span>
              <button
                onClick={selectAllTasks}
                className="text-sm text-purple-600 hover:text-purple-800"
              >
                Zaznacz wszystkie
              </button>
              <button
                onClick={deselectAllTasks}
                className="text-sm text-purple-600 hover:text-purple-800"
              >
                Odznacz wszystkie
              </button>
            </div>

            {selectedTasks.size > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  onChange={(e) =>
                    bulkChangeStatus(e.target.value as ProjectTask["status"])
                  }
                  className="text-sm border border-purple-300 rounded px-3 py-1.5"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Zmień status
                  </option>
                  <option value="not_started">Nie rozpoczęto</option>
                  <option value="in_progress">W trakcie</option>
                  <option value="review">Do przeglądu</option>
                  <option value="completed">Ukończone</option>
                  <option value="blocked">Zablokowane</option>
                </select>

                <button
                  onClick={bulkDelete}
                  className="text-sm bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700"
                >
                  Usuń zaznaczone
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Szukaj zadań..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as TaskFilter)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Wszystkie</option>
            <option value="my-tasks">Moje zadania</option>
            <option value="high-priority">Wysoki priorytet</option>
            <option value="overdue">Zaległe</option>
          </select>
        </div>

        {/* ✅ NEW: Sort controls */}
        <div className="flex items-center gap-2">
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="created_at">Data utworzenia</option>
            <option value="title">Tytuł</option>
            <option value="priority">Priorytet</option>
            <option value="due_date">Termin</option>
            <option value="status">Status</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50"
            title={sortOrder === "asc" ? "Rosnąco" : "Malejąco"}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
        </div>

        {/* ✅ NEW: Export button */}
        <button
          onClick={exportToCSV}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
        >
          📥 Eksport CSV
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => setView("kanban")}
            className={`px-3 py-2 rounded-lg ${
              view === "kanban"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-3 py-2 rounded-lg ${
              view === "list"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Lista
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {view === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <div
              key={status}
              className="bg-gray-50 rounded-lg p-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status as ProjectTask["status"])}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700 capitalize">
                  {status.replace("_", " ")}
                </h3>
                <span className="bg-gray-200 text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
                  {statusTasks.length}
                </span>
              </div>

              <div className="space-y-3 min-h-[200px]">
                {statusTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable={!bulkActionMode}
                    onDragStart={(e) => handleDragStart(e, task)}
                    onClick={(e) => {
                      if (bulkActionMode) {
                        e.stopPropagation();
                        toggleTaskSelection(task.id);
                      } else {
                        handleOpenEditTaskForm(task);
                      }
                    }}
                    className={`bg-white p-3 rounded-lg shadow-sm border transition-all ${
                      bulkActionMode && selectedTasks.has(task.id)
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:shadow-md"
                    } ${draggedTask?.id === task.id ? "opacity-50" : ""} ${
                      bulkActionMode ? "cursor-pointer" : "cursor-move"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        {bulkActionMode && (
                          <input
                            type="checkbox"
                            checked={selectedTasks.has(task.id)}
                            onChange={() => toggleTaskSelection(task.id)}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        <h4 className="font-medium text-gray-900 text-sm flex-1">
                          {task.title}
                        </h4>
                      </div>
                      {getStatusIcon(task.status)}
                    </div>

                    {task.description && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs px-2 py-1 rounded border ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>

                      {task.due_date && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.due_date).toLocaleDateString("pl-PL")}
                        </span>
                      )}

                      {task.assigned_to && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <User className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    {task.progress_percentage > 0 && (
                      <div className="mt-2">
                        <div className="bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${task.progress_percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                  Tytuł
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                  Priorytet
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                  Termin
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                  Postęp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => handleOpenEditTaskForm(task)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <span className="text-sm text-gray-700 capitalize">
                        {task.status.replace("_", " ")}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded border ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {task.due_date && (
                      <span className="text-sm text-gray-600">
                        {new Date(task.due_date).toLocaleDateString("pl-PL")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${task.progress_percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {task.progress_percentage}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600">Wszystkie zadania</p>
          <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600">W trakcie</p>
          <p className="text-2xl font-bold text-blue-600">
            {tasksByStatus.in_progress.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600">Do przeglądu</p>
          <p className="text-2xl font-bold text-orange-600">
            {tasksByStatus.review.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600">Ukończone</p>
          <p className="text-2xl font-bold text-green-600">
            {tasksByStatus.completed.length}
          </p>
        </div>
      </div>

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={showTaskForm}
        onClose={() => {
          setShowTaskForm(false);
          setSelectedTask(null);
        }}
        projectId={projectId}
        task={selectedTask}
        onSave={handleTaskSaved}
      />
    </div>
  );
}

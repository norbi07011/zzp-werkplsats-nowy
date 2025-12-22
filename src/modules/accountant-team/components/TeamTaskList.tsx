/**
 * Team Task List - Task Management with Templates
 */

import React, { useState, useMemo } from "react";
import { Language, TeamMember, TeamTask, TaskTemplate } from "../types";
import { DICTIONARY, TASK_TEMPLATES } from "../constants";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  User,
  Trash2,
  Edit,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface TeamTaskListProps {
  tasks: TeamTask[];
  setTasks: React.Dispatch<React.SetStateAction<TeamTask[]>>;
  language: Language;
  members: TeamMember[];
  templates: TaskTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<TaskTemplate[]>>;
}

const priorityColors = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-amber-100 text-amber-600",
  urgent: "bg-red-100 text-red-600",
};

const statusColors = {
  todo: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-600",
  review: "bg-purple-100 text-purple-600",
  done: "bg-emerald-100 text-emerald-600",
};

export const TeamTaskList: React.FC<TeamTaskListProps> = ({
  tasks,
  setTasks,
  language,
  members,
  templates,
  setTemplates,
}) => {
  const t = DICTIONARY[language];
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as TeamTask["priority"],
    dueDate: "",
    assigneeId: "",
  });

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchQuery, statusFilter]);

  // Group tasks by status
  const groupedTasks = useMemo(() => {
    return {
      todo: filteredTasks.filter((t) => t.status === "todo"),
      in_progress: filteredTasks.filter((t) => t.status === "in_progress"),
      review: filteredTasks.filter((t) => t.status === "review"),
      done: filteredTasks.filter((t) => t.status === "done"),
    };
  }, [filteredTasks]);

  const handleAddTask = () => {
    if (!newTask.title.trim()) {
      toast.error("Podaj tytuł zadania");
      return;
    }

    const task: TeamTask = {
      id: crypto.randomUUID(),
      title: newTask.title,
      description: newTask.description,
      status: "todo",
      priority: newTask.priority,
      dueDate: newTask.dueDate || new Date().toISOString().split("T")[0],
      assigneeId: newTask.assigneeId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) => [...prev, task]);
    setNewTask({
      title: "",
      description: "",
      priority: "medium",
      dueDate: "",
      assigneeId: "",
    });
    setShowAddModal(false);
    toast.success("✅ Zadanie dodane");
  };

  const handleStatusChange = (
    taskId: string,
    newStatus: TeamTask["status"]
  ) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
          : task
      )
    );
    toast.success(`✅ Status zmieniony na ${t[newStatus]}`);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm("Czy na pewno chcesz usunąć to zadanie?")) {
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      toast.success("🗑️ Zadanie usunięte");
    }
  };

  const addFromTemplate = (template: TaskTemplate) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Default 7 days from now

    const task: TeamTask = {
      id: crypto.randomUUID(),
      title: template.title,
      description: template.description,
      status: "todo",
      priority: template.priority,
      dueDate: dueDate.toISOString().split("T")[0],
      category: template.category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) => [...prev, task]);
    toast.success(`✅ Dodano z szablonu: ${template.title}`);
  };

  const TaskCard: React.FC<{ task: TeamTask }> = ({ task }) => {
    const assignee = members.find((m) => m.id === task.assigneeId);
    const isOverdue =
      new Date(task.dueDate) < new Date() && task.status !== "done";

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-medium text-slate-800 flex-1">{task.title}</h4>
          <div className="flex items-center gap-1">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                priorityColors[task.priority]
              }`}
            >
              {t[task.priority]}
            </span>
            <button
              onClick={() => handleDeleteTask(task.id)}
              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {task.description && (
          <p className="text-sm text-slate-500 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1 ${
                isOverdue ? "text-red-500" : "text-slate-500"
              }`}
            >
              <Calendar className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleDateString("pl-PL")}
            </span>
            {assignee && (
              <span className="flex items-center gap-1 text-slate-500">
                <img
                  src={assignee.avatar}
                  alt=""
                  className="w-4 h-4 rounded-full"
                />
                {assignee.name.split(" ")[0]}
              </span>
            )}
          </div>

          <select
            value={task.status}
            onChange={(e) =>
              handleStatusChange(task.id, e.target.value as TeamTask["status"])
            }
            className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
          >
            <option value="todo">{t.todo}</option>
            <option value="in_progress">{t.in_progress}</option>
            <option value="review">{t.review}</option>
            <option value="done">{t.done}</option>
          </select>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t.tasks}</h2>
          <p className="text-slate-500 text-sm">{tasks.length} zadań łącznie</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t.add_task}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={t.search_tasks}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">{t.all_statuses}</option>
          <option value="todo">{t.todo}</option>
          <option value="in_progress">{t.in_progress}</option>
          <option value="review">{t.review}</option>
          <option value="done">{t.done}</option>
        </select>
      </div>

      {/* Templates */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
        <h3 className="font-medium text-slate-700 mb-3">📋 Szybkie szablony</h3>
        <div className="flex flex-wrap gap-2">
          {TASK_TEMPLATES.slice(0, 5).map((template) => (
            <button
              key={template.id}
              onClick={() => addFromTemplate(template)}
              className="px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm text-indigo-700 hover:bg-indigo-50 transition-colors"
            >
              + {template.title}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {(["todo", "in_progress", "review", "done"] as const).map((status) => (
          <div
            key={status}
            className="bg-slate-50 rounded-xl p-4 min-h-[200px]"
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`font-medium px-2 py-1 rounded-lg ${statusColors[status]}`}
              >
                {t[status]}
              </h3>
              <span className="text-sm text-slate-500">
                {groupedTasks[status].length}
              </span>
            </div>
            <div className="space-y-3">
              {groupedTasks[status].map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {groupedTasks[status].length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Brak zadań
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">{t.add_task}</h3>
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
                  {t.title}
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
                  {t.description}
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
                  rows={3}
                  placeholder="Opis zadania..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t.priority}
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t.due_date}
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask((prev) => ({
                        ...prev,
                        dueDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {members.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t.assignee}
                  </label>
                  <select
                    value={newTask.assigneeId}
                    onChange={(e) =>
                      setNewTask((prev) => ({
                        ...prev,
                        assigneeId: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="">-- Wybierz --</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleAddTask}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamTaskList;

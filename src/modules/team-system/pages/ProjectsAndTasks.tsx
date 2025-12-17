import React, { useState, useEffect } from "react";
import { useStore } from "../context/StoreContext";
import {
  UserRole,
  Task,
  Project,
  TaskStatus,
  Material,
  Priority,
  WorkLog,
  Comment,
  TaskTemplate,
} from "../types";
import {
  Plus,
  MapPin,
  Calendar,
  CheckSquare,
  Camera,
  Clock,
  Bot,
  Save,
  ArrowUp,
  ArrowDown,
  User,
  Hammer,
  AlertTriangle,
  Trash2,
  Home,
  UserCircle,
  Play,
  Square,
  Package,
  History,
  MessageSquare,
  Send,
  Copy,
  FileText,
  X,
  Info,
  Image as ImageIcon,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Filter,
  Edit2,
  ArrowLeft,
} from "lucide-react";
import {
  generateTaskDescription,
  suggestMaterials,
} from "../services/geminiService";
import { format } from "date-fns";

export const ProjectsAndTasks = () => {
  const {
    currentUser,
    projects,
    tasks,
    users,
    taskTemplates,
    addTask,
    updateTask,
    addProject,
    addWorkLog,
    updateWorkLog,
    addComment,
    addTaskTemplate,
    updateTaskTemplate,
    deleteTaskTemplate,
    t,
    language,
  } = useStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "resources" | "photos" | "comments"
  >("overview");

  // Template Manager State
  const [templateMode, setTemplateMode] = useState<"LIST" | "EDIT" | "CREATE">(
    "LIST"
  );
  const [activeTemplate, setActiveTemplate] = useState<Partial<TaskTemplate>>({
    name: "",
    title: "",
    description: "",
    priority: Priority.MEDIUM,
    estimatedHours: 0,
    toolsRequired: [],
    materialsRequired: [],
  });

  // Sorting State
  const [sortBy, setSortBy] = useState<"dueDate" | "status" | "assigned">(
    "dueDate"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filtering State
  const [showFilters, setShowFilters] = useState(false);
  const [filterPriority, setFilterPriority] = useState<Priority | "ALL">("ALL");
  const [filterAssignee, setFilterAssignee] = useState<string>("ALL");
  const [filterMinHours, setFilterMinHours] = useState<number | "">("");
  const [filterMaxHours, setFilterMaxHours] = useState<number | "">("");

  // Form States
  const [newProject, setNewProject] = useState<Partial<Project>>({
    title: "",
    clientName: "",
    street: "",
    houseNumber: "",
    postalCode: "",
    city: "",
    description: "",
    status: "ACTIVE",
    endDate: "",
  });

  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "",
    description: "",
    assignedToIds: [],
    materialsRequired: [],
    toolsRequired: [],
    priority: Priority.MEDIUM,
    estimatedHours: 4,
    dueDate: format(new Date(), "yyyy-MM-dd"), // Default to today
  });

  // Temporary input states for lists
  const [tempTool, setTempTool] = useState("");
  const [tempMaterialName, setTempMaterialName] = useState("");
  const [tempMaterialQty, setTempMaterialQty] = useState<number>(1);
  const [tempMaterialUnit, setTempMaterialUnit] = useState("");

  // Work Log & Materials Used States for Detailed View
  const [workLogNote, setWorkLogNote] = useState("");
  const [usedMatName, setUsedMatName] = useState("");
  const [usedMatQty, setUsedMatQty] = useState(1);
  const [usedMatUnit, setUsedMatUnit] = useState("pcs");

  // Comments State
  const [newComment, setNewComment] = useState("");

  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (selectedTaskId) {
      setWorkLogNote("");
      setUsedMatName("");
      setUsedMatQty(1);
      setUsedMatUnit("pcs");
      setNewComment("");
      setActiveTab("overview");
    }
  }, [selectedTaskId]);

  const handleCreateProject = () => {
    if (!newProject.title) return;
    addProject({
      title: newProject.title || "",
      clientName: newProject.clientName || "",
      street: newProject.street || "",
      houseNumber: newProject.houseNumber || "",
      postalCode: newProject.postalCode || "",
      city: newProject.city || "",
      description: newProject.description || "",
      startDate: new Date().toISOString(),
      endDate: newProject.endDate || undefined,
      status: "ACTIVE",
    });
    setShowAddProject(false);
    setNewProject({
      title: "",
      clientName: "",
      street: "",
      houseNumber: "",
      postalCode: "",
      city: "",
      description: "",
      status: "ACTIVE",
      endDate: "",
    });
  };

  const handleCreateTask = () => {
    if (!newTask.title || !selectedProjectId) return;
    addTask({
      projectId: selectedProjectId,
      title: newTask.title || "",
      description: newTask.description || "",
      assignedToIds: newTask.assignedToIds || [],
      status: TaskStatus.TODO,
      priority: newTask.priority || Priority.MEDIUM,
      dueDate: newTask.dueDate || format(new Date(), "yyyy-MM-dd"),
      estimatedHours: newTask.estimatedHours || 0,
      toolsRequired: newTask.toolsRequired || [],
      materialsRequired: newTask.materialsRequired || [],
      materialsUsed: [],
      photos: [],
    });
    setShowAddTask(false);
    setNewTask({
      title: "",
      description: "",
      assignedToIds: [],
      materialsRequired: [],
      toolsRequired: [],
      priority: Priority.MEDIUM,
      estimatedHours: 4,
      dueDate: format(new Date(), "yyyy-MM-dd"),
    });
  };

  // --- TEMPLATE LOGIC ---
  const openTemplateManager = () => {
    setTemplateMode("LIST");
    setShowTemplateManager(true);
  };

  const handleStartCreateTemplate = () => {
    setActiveTemplate({
      name: "",
      title: "",
      description: "",
      priority: Priority.MEDIUM,
      estimatedHours: 4,
      toolsRequired: [],
      materialsRequired: [],
    });
    setTempTool("");
    setTempMaterialName("");
    setTemplateMode("CREATE");
  };

  const handleEditTemplate = (tmpl: TaskTemplate) => {
    setActiveTemplate({ ...tmpl });
    setTempTool("");
    setTempMaterialName("");
    setTemplateMode("EDIT");
  };

  const handleSaveTemplate = () => {
    if (!activeTemplate.name || !activeTemplate.title) return;

    const templateData = activeTemplate as TaskTemplate;

    if (templateMode === "CREATE") {
      addTaskTemplate({ ...templateData, id: Date.now().toString() });
    } else {
      updateTaskTemplate(templateData);
    }
    setTemplateMode("LIST");
  };

  const addToolToTemplate = () => {
    if (tempTool.trim()) {
      setActiveTemplate({
        ...activeTemplate,
        toolsRequired: [...(activeTemplate.toolsRequired || []), tempTool],
      });
      setTempTool("");
    }
  };

  const addMaterialToTemplate = () => {
    if (tempMaterialName.trim()) {
      const mat: Material = {
        id: Date.now().toString(),
        name: tempMaterialName,
        quantity: tempMaterialQty,
        unit: tempMaterialUnit || "pcs",
      };
      setActiveTemplate({
        ...activeTemplate,
        materialsRequired: [...(activeTemplate.materialsRequired || []), mat],
      });
      setTempMaterialName("");
      setTempMaterialQty(1);
      setTempMaterialUnit("");
    }
  };

  const handleSaveAsTemplate = () => {
    if (!newTask.title) return;
    const templateName = window.prompt(t("templateName"), newTask.title);
    if (templateName) {
      const template: TaskTemplate = {
        id: Date.now().toString(),
        name: templateName,
        title: newTask.title,
        description: newTask.description || "",
        priority: newTask.priority || Priority.MEDIUM,
        estimatedHours: newTask.estimatedHours || 0,
        toolsRequired: newTask.toolsRequired || [],
        materialsRequired: newTask.materialsRequired || [],
      };
      addTaskTemplate(template);
      alert(t("templateSaved"));
    }
  };

  const handleLoadTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tmplId = e.target.value;
    const tmpl = taskTemplates.find((t) => t.id === tmplId);
    if (tmpl) {
      setNewTask({
        ...newTask,
        title: tmpl.title,
        description: tmpl.description,
        priority: tmpl.priority,
        estimatedHours: tmpl.estimatedHours,
        toolsRequired: [...tmpl.toolsRequired],
        materialsRequired: tmpl.materialsRequired.map((m) => ({
          ...m,
          id: Date.now() + Math.random().toString(),
        })),
      });
    }
  };

  const addToolToTask = () => {
    if (tempTool.trim()) {
      setNewTask({
        ...newTask,
        toolsRequired: [...(newTask.toolsRequired || []), tempTool],
      });
      setTempTool("");
    }
  };

  const addMaterialToTask = () => {
    if (tempMaterialName.trim()) {
      const mat: Material = {
        id: Date.now().toString(),
        name: tempMaterialName,
        quantity: tempMaterialQty,
        unit: tempMaterialUnit || "pcs",
      };
      setNewTask({
        ...newTask,
        materialsRequired: [...(newTask.materialsRequired || []), mat],
      });
      setTempMaterialName("");
      setTempMaterialQty(1);
      setTempMaterialUnit("");
    }
  };

  const generateAIHelp = async () => {
    if (!newTask.title) return;
    setAiLoading(true);
    const desc = await generateTaskDescription(newTask.title, language);
    const matsStr = await suggestMaterials(desc, language);

    // Parse materials roughly
    const mats: Material[] = matsStr
      .split("\n")
      .filter((l) => l.includes("-"))
      .map((l, i) => {
        const parts = l.split("-");
        return {
          id: `m_ai_${i}`,
          name: parts[0].trim(),
          quantity: 1,
          unit: "pcs",
        }; // simplistic parsing
      });

    setNewTask((prev) => ({
      ...prev,
      description: desc,
      materialsRequired: mats,
    }));
    setAiLoading(false);
  };

  const toggleTaskStatus = (task: Task) => {
    const nextStatus =
      task.status === TaskStatus.TODO
        ? TaskStatus.IN_PROGRESS
        : task.status === TaskStatus.IN_PROGRESS
        ? TaskStatus.DONE
        : TaskStatus.TODO;
    updateTask({ ...task, status: nextStatus });
  };

  // Detailed View Logic Handlers
  const handleToggleTimer = async (task: Task) => {
    if (!currentUser) return;
    const activeLog = task.workLogs.find(
      (l) => l.userId === currentUser.id && !l.endTime
    );

    if (activeLog) {
      // Stop Timer - save to database
      await updateWorkLog(task.id, activeLog.id, new Date().toISOString());
    } else {
      // Start Timer - save to database
      const newLog = {
        userId: currentUser.id,
        startTime: new Date().toISOString(),
        description: workLogNote || undefined,
      };
      await addWorkLog(task.id, newLog);
      setWorkLogNote("");
    }
  };

  const handleAddUsedMaterial = (task: Task) => {
    if (!usedMatName.trim()) return;
    const newMat: Material = {
      id: Date.now().toString(),
      name: usedMatName,
      quantity: usedMatQty,
      unit: usedMatUnit,
    };
    updateTask({ ...task, materialsUsed: [...task.materialsUsed, newMat] });
    setUsedMatName("");
    setUsedMatQty(1);
    setUsedMatUnit("pcs");
  };

  const handleAddComment = async (task: Task) => {
    if (!currentUser || !newComment.trim()) return;
    // Save to database via Supabase
    await addComment(task.id, newComment);
    setNewComment("");
  };

  // Sorting Logic
  const handleSort = (field: "dueDate" | "status" | "assigned") => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  const clearFilters = () => {
    setFilterPriority("ALL");
    setFilterAssignee("ALL");
    setFilterMinHours("");
    setFilterMaxHours("");
  };

  // Filter & Sort Application
  const filteredTasks = selectedProjectId
    ? tasks.filter((t) => t.projectId === selectedProjectId)
    : [];
  const todayStr = format(new Date(), "yyyy-MM-dd");

  // 1. Apply Filters
  let resultTasks = filteredTasks;

  if (filterPriority !== "ALL") {
    resultTasks = resultTasks.filter((t) => t.priority === filterPriority);
  }

  if (filterAssignee !== "ALL") {
    resultTasks = resultTasks.filter((t) =>
      t.assignedToIds.includes(filterAssignee)
    );
  }

  if (filterMinHours !== "") {
    resultTasks = resultTasks.filter(
      (t) => (t.estimatedHours || 0) >= filterMinHours
    );
  }

  if (filterMaxHours !== "") {
    resultTasks = resultTasks.filter(
      (t) => (t.estimatedHours || 0) <= filterMaxHours
    );
  }

  // 2. Apply Sorting
  const sortedTasks = [...resultTasks].sort((a, b) => {
    let res = 0;
    if (sortBy === "dueDate") {
      res = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else if (sortBy === "status") {
      const statusOrder = {
        [TaskStatus.TODO]: 0,
        [TaskStatus.IN_PROGRESS]: 1,
        [TaskStatus.BLOCKED]: 2,
        [TaskStatus.DONE]: 3,
      };
      res = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
    } else if (sortBy === "assigned") {
      const nameA =
        users.find((u) => u.id === a.assignedToIds[0])?.name || "zz";
      const nameB =
        users.find((u) => u.id === b.assignedToIds[0])?.name || "zz";
      res = nameA.localeCompare(nameB);
    }
    return sortDirection === "asc" ? res : -res;
  });

  const SortButton = ({
    field,
    label,
    icon: Icon,
  }: {
    field: "dueDate" | "status" | "assigned";
    label: string;
    icon: any;
  }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center text-xs px-2 py-1.5 rounded-lg border transition-colors ${
        sortBy === field
          ? "bg-primary-50 text-primary-700 border-primary-200 font-medium"
          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
      }`}
    >
      <Icon size={14} className="mr-1.5" />
      <span className="hidden sm:inline">{label}</span>
      {sortBy === field &&
        (sortDirection === "asc" ? (
          <ArrowUp size={12} className="ml-1" />
        ) : (
          <ArrowDown size={12} className="ml-1" />
        ))}
    </button>
  );

  // Render Detailed Task View
  if (selectedTaskId) {
    const task = tasks.find((t) => t.id === selectedTaskId);
    const project = projects.find((p) => p.id === task?.projectId);
    if (!task)
      return (
        <div onClick={() => setSelectedTaskId(null)}>Error: Task not found</div>
      );

    const activeWorkLog = task.workLogs.find(
      (l) => l.userId === currentUser?.id && !l.endTime
    );

    const TabButton = ({
      id,
      label,
      icon: Icon,
    }: {
      id: typeof activeTab;
      label: string;
      icon: any;
    }) => (
      <button
        onClick={() => setActiveTab(id)}
        className={`px-4 py-4 text-sm font-medium flex items-center border-b-2 transition-colors ${
          activeTab === id
            ? "border-primary-600 text-primary-600"
            : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
        }`}
      >
        <Icon size={16} className="mr-2" /> {label}
      </button>
    );

    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-100 max-w-6xl mx-auto overflow-hidden flex flex-col md:flex-row h-[85vh]">
        {/* Left/Main Column - Scrollable Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex-shrink-0">
            <button
              onClick={() => setSelectedTaskId(null)}
              className="mb-2 text-sm text-slate-500 hover:text-primary-600 font-medium flex items-center transition-colors"
            >
              <ChevronLeft size={16} className="mr-1" /> Back to{" "}
              {project?.title}
            </button>
            <h2 className="text-2xl font-bold text-slate-800">{task.title}</h2>
            <div className="flex gap-2 mt-2">
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                  task.priority === Priority.URGENT
                    ? "bg-red-500 text-white"
                    : task.priority === Priority.HIGH
                    ? "bg-orange-500 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {task.priority}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                  task.status === TaskStatus.DONE
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {task.status}
              </span>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-200 bg-white px-6 overflow-x-auto no-scrollbar flex-shrink-0">
            <TabButton id="overview" label={t("overview")} icon={Info} />
            <TabButton
              id="resources"
              label={`${t("materials")} & ${t("tools")}`}
              icon={Package}
            />
            <TabButton id="photos" label={t("photos")} icon={ImageIcon} />
            <TabButton
              id="comments"
              label={t("comments")}
              icon={MessageSquare}
            />
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-white relative">
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">
                    {t("description")}
                  </h3>
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-lg text-slate-700 whitespace-pre-line leading-relaxed">
                    {task.description}
                  </div>
                </section>

                {/* Added: Quick Resources Summary */}
                <section>
                  <h3 className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center">
                    <Package size={16} className="mr-2" /> {t("materials")}{" "}
                    (Required)
                  </h3>
                  {task.materialsRequired.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {task.materialsRequired.map((m) => (
                        <div
                          key={m.id}
                          className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm"
                        >
                          <span className="text-sm font-medium text-slate-700">
                            {m.name}
                          </span>
                          <span className="text-xs font-bold bg-primary-50 text-primary-700 px-2 py-1 rounded">
                            {m.quantity} {m.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center">
                      <p className="text-sm text-slate-400 italic">
                        No specific materials required listed.
                      </p>
                    </div>
                  )}
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <section className="bg-white p-4 border border-slate-100 rounded-lg shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">
                      Project Info
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-slate-500">Client:</span>{" "}
                        <span className="font-semibold">
                          {project?.clientName}
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-500">Address:</span>{" "}
                        <span className="font-semibold">
                          {project?.street} {project?.houseNumber},{" "}
                          {project?.city}
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-500">Due Date:</span>{" "}
                        <span className="font-semibold">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                  </section>
                  <section className="bg-white p-4 border border-slate-100 rounded-lg shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">
                      Time Estimate
                    </h3>
                    <div className="flex items-center">
                      <Clock size={24} className="text-slate-300 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-slate-800">
                          {task.estimatedHours}h
                        </p>
                        <p className="text-xs text-slate-500">
                          Estimated duration
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {/* RESOURCES TAB */}
            {activeTab === "resources" && (
              <div className="space-y-8">
                {/* Tools */}
                <section>
                  <h3 className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center">
                    <Hammer size={16} className="mr-2" /> {t("tools")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {task.toolsRequired.length > 0 ? (
                      task.toolsRequired.map((tool, i) => (
                        <span
                          key={i}
                          className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-medium border border-indigo-100"
                        >
                          {tool}
                        </span>
                      ))
                    ) : (
                      <p className="text-slate-400 text-sm italic">
                        No specific tools required.
                      </p>
                    )}
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Required Materials */}
                  <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center">
                      <Package size={16} className="mr-2" /> {t("materials")}{" "}
                      (Required)
                    </h3>
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium">
                              Item
                            </th>
                            <th className="px-4 py-2 text-right font-medium">
                              Qty
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {task.materialsRequired.map((m) => (
                            <tr key={m.id}>
                              <td className="px-4 py-2.5 text-slate-700">
                                {m.name}
                              </td>
                              <td className="px-4 py-2.5 text-right font-bold text-slate-600">
                                {m.quantity} {m.unit}
                              </td>
                            </tr>
                          ))}
                          {task.materialsRequired.length === 0 && (
                            <tr>
                              <td
                                colSpan={2}
                                className="px-4 py-4 text-center text-slate-400 italic"
                              >
                                None specified
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* Used Materials */}
                  <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center">
                      <CheckSquare size={16} className="mr-2" />{" "}
                      {t("materialsUsed")}
                    </h3>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <div className="space-y-2 mb-4">
                        {task.materialsUsed.length === 0 && (
                          <p className="text-xs text-slate-400 italic text-center py-2">
                            No materials logged yet.
                          </p>
                        )}
                        {task.materialsUsed.map((m) => (
                          <div
                            key={m.id}
                            className="flex justify-between items-center bg-white p-2 rounded shadow-sm border border-slate-100 text-sm"
                          >
                            <span className="font-medium text-slate-700">
                              {m.name}
                            </span>
                            <span className="font-bold text-primary-600">
                              {m.quantity} {m.unit}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-xs font-bold text-slate-500 mb-2 uppercase">
                          Log Material
                        </p>
                        <div className="grid grid-cols-4 gap-2 mb-2">
                          <div className="col-span-4">
                            <input
                              className="w-full text-xs p-2 rounded border border-slate-300"
                              placeholder="Material Name"
                              value={usedMatName}
                              onChange={(e) => setUsedMatName(e.target.value)}
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              className="w-full text-xs p-2 rounded border border-slate-300"
                              type="number"
                              placeholder="Qty"
                              value={usedMatQty}
                              onChange={(e) =>
                                setUsedMatQty(Number(e.target.value))
                              }
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              className="w-full text-xs p-2 rounded border border-slate-300"
                              placeholder="Unit"
                              value={usedMatUnit}
                              onChange={(e) => setUsedMatUnit(e.target.value)}
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddUsedMaterial(task)}
                          className="w-full bg-slate-800 text-white py-2 rounded text-xs font-bold hover:bg-slate-700 transition-colors"
                        >
                          Add to Log
                        </button>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {/* PHOTOS TAB */}
            {activeTab === "photos" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold text-slate-400 uppercase">
                    {t("photos")}
                  </h3>
                  <label className="bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-primary-100 transition-colors flex items-center">
                    <Camera size={14} className="mr-1" /> {t("addPhoto")}
                    <input type="file" accept="image/*" className="hidden" />
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {task.photos.map((p, idx) => (
                    <div
                      key={idx}
                      className="group relative aspect-square rounded-xl overflow-hidden shadow-sm border border-slate-200"
                    >
                      <img
                        src={p}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        alt="Work proof"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          View
                        </span>
                      </div>
                    </div>
                  ))}
                  {task.photos.length === 0 && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400">
                      <Camera size={48} className="mx-auto mb-2 opacity-50" />
                      <p>No photos yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* COMMENTS TAB */}
            {activeTab === "comments" && (
              <div className="flex flex-col h-full">
                <div className="flex-1 space-y-4 mb-4 overflow-y-auto pr-2 custom-scrollbar">
                  {task.comments.length === 0 && (
                    <div className="text-center py-10">
                      <MessageSquare
                        size={48}
                        className="mx-auto text-slate-200 mb-2"
                      />
                      <p className="text-slate-400 text-sm">
                        No comments yet. Start the discussion!
                      </p>
                    </div>
                  )}
                  {task.comments.map((c) => (
                    <div
                      key={c.id}
                      className={`flex ${
                        c.userId === currentUser.id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                          c.userId === currentUser.id
                            ? "bg-primary-50 text-primary-900 rounded-br-none"
                            : "bg-white border border-slate-100 rounded-bl-none"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1 gap-4">
                          <span className="text-xs font-bold opacity-70">
                            {c.userName}
                          </span>
                          <span className="text-[10px] opacity-50">
                            {new Date(c.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex gap-2">
                    <input
                      className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      placeholder="Type a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleAddComment(task)
                      }
                    />
                    <button
                      onClick={() => handleAddComment(task)}
                      className="bg-primary-600 text-white p-2.5 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Actionable Items */}
        <div className="w-full md:w-80 bg-slate-50 border-l border-slate-200 p-6 flex flex-col gap-6 overflow-y-auto flex-shrink-0">
          {/* Work Timer Card */}
          <div
            className={`p-5 rounded-xl border shadow-sm transition-colors ${
              activeWorkLog
                ? "bg-white border-green-200 ring-2 ring-green-100"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3
                className={`font-bold text-sm ${
                  activeWorkLog ? "text-green-600" : "text-slate-700"
                }`}
              >
                {t("logWork")}
              </h3>
              {activeWorkLog && (
                <span className="animate-pulse flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
              )}
            </div>

            {activeWorkLog ? (
              <div className="mb-4 text-center">
                <p className="text-2xl font-mono font-bold text-slate-800">
                  {/* Placeholder for real-time ticker, static for now */}
                  Running...
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Started:{" "}
                  {new Date(activeWorkLog.startTime).toLocaleTimeString()}
                </p>
              </div>
            ) : (
              <div className="mb-4">
                <input
                  type="text"
                  value={workLogNote}
                  onChange={(e) => setWorkLogNote(e.target.value)}
                  placeholder="Note (optional)"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-primary-300"
                />
              </div>
            )}

            <button
              onClick={() => handleToggleTimer(task)}
              className={`w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center shadow-sm transition-all ${
                activeWorkLog
                  ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                  : "bg-slate-800 text-white hover:bg-slate-700"
              }`}
            >
              {activeWorkLog ? (
                <>
                  <Square size={16} className="mr-2" /> Stop Timer
                </>
              ) : (
                <>
                  <Play size={16} className="mr-2" /> Start Timer
                </>
              )}
            </button>

            {/* Recent Logs List */}
            {task.workLogs.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 mb-2 flex items-center uppercase">
                  <History size={12} className="mr-1" /> Recent
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                  {task.workLogs
                    .slice()
                    .reverse()
                    .map((log) => (
                      <div
                        key={log.id}
                        className="text-xs bg-slate-50 p-2 rounded border border-slate-100"
                      >
                        <div className="flex justify-between text-slate-500 mb-1">
                          <span>
                            {new Date(log.startTime).toLocaleDateString()}
                          </span>
                          <span className="font-mono">
                            {new Date(log.startTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {log.description && (
                          <p className="text-slate-700 font-medium truncate">
                            {log.description}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Due Date Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-slate-700">
                {t("dueDate")}
              </h3>
              <Calendar size={16} className="text-slate-400" />
            </div>
            <input
              type="date"
              value={task.dueDate}
              onChange={(e) => updateTask({ ...task, dueDate: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
            />
          </div>

          {/* Assignees Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-sm text-slate-700 mb-3">
              {t("assignedTo")}
            </h3>
            <div className="space-y-3">
              {task.assignedToIds.map((uid) => {
                const u = users.find((user) => user.id === uid);
                return u ? (
                  <div key={uid} className="flex items-center">
                    <img
                      src={u.avatar}
                      className="w-8 h-8 rounded-full mr-3 border border-slate-100"
                      alt={u.name}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {u.name}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase font-medium">
                        {u.role === "ADMIN"
                          ? "Admin"
                          : u.specialization || "Worker"}
                      </p>
                    </div>
                  </div>
                ) : null;
              })}
              {task.assignedToIds.length === 0 && (
                <p className="text-xs text-slate-400 italic">Unassigned</p>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-auto">
            <button
              onClick={() => toggleTaskStatus(task)}
              className={`w-full py-3.5 rounded-xl font-bold text-white shadow-md transition-transform hover:scale-[1.02] flex items-center justify-center ${
                task.status === TaskStatus.DONE
                  ? "bg-yellow-500 hover:bg-yellow-600"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {task.status === TaskStatus.DONE ? (
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
    );
  }

  // Project List View
  return (
    <div className="space-y-6">
      {!selectedProjectId ? (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">
              {t("projects")}
            </h2>
            <div className="flex gap-2">
              {currentUser?.role === UserRole.ADMIN && (
                <button
                  onClick={openTemplateManager}
                  className="bg-white text-slate-600 px-4 py-2 rounded-lg flex items-center shadow-sm font-medium hover:bg-slate-50 transition-colors border border-slate-200"
                >
                  <FileText size={18} className="mr-2" /> {t("templates")}
                </button>
              )}
              {currentUser?.role === UserRole.ADMIN && (
                <button
                  onClick={() => setShowAddProject(true)}
                  className="bg-safety-500 text-white px-4 py-2 rounded-lg flex items-center shadow-sm font-medium hover:bg-safety-600 transition-colors"
                >
                  <Plus size={18} className="mr-2" /> {t("addProject")}
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                className="bg-white rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:border-primary-200 transition-all overflow-hidden flex flex-col h-full"
              >
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-slate-800 leading-tight">
                      {p.title}
                    </h3>
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] rounded-full uppercase tracking-wide font-bold">
                      {p.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-1 font-medium">
                    {p.clientName}
                  </p>
                  <p className="text-slate-500 text-xs mb-4 flex items-center">
                    <MapPin size={12} className="mr-1 text-primary-500" />{" "}
                    {p.street} {p.houseNumber}, {p.city}
                  </p>
                  <p className="text-slate-600 text-sm line-clamp-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {p.description}
                  </p>
                </div>
                <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                  <div className="flex items-center">
                    <CheckSquare size={14} className="mr-1" />{" "}
                    {tasks.filter((t) => t.projectId === p.id).length} Tasks
                  </div>
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-1" />
                    {new Date(p.startDate).toLocaleDateString()}
                    {p.endDate &&
                      ` - ${new Date(p.endDate).toLocaleDateString()}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => setSelectedProjectId(null)}
              className="text-slate-500 hover:text-slate-800 text-sm font-medium flex items-center"
            >
              <ArrowDown className="transform rotate-90 mr-1" size={16} />{" "}
              {t("projects")}
            </button>
            <div className="h-4 w-px bg-slate-300"></div>
            <h2 className="text-xl font-bold text-slate-800">
              {projects.find((p) => p.id === selectedProjectId)?.title}
            </h2>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col mb-6">
            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center text-xs px-3 py-1.5 rounded-lg border transition-colors mr-2 ${
                    showFilters
                      ? "bg-slate-800 text-white border-slate-800"
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  <Filter size={14} className="mr-1.5" /> {t("filters")}
                </button>
                <div className="h-4 w-px bg-slate-200 mx-1"></div>
                <SortButton field="dueDate" label="Date" icon={Calendar} />
                <SortButton field="status" label="Status" icon={CheckSquare} />
                <SortButton field="assigned" label="Person" icon={User} />
              </div>

              {currentUser?.role === UserRole.ADMIN && (
                <button
                  onClick={() => setShowAddTask(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center hover:bg-primary-700 transition-colors shadow-sm whitespace-nowrap"
                >
                  <Plus size={16} className="mr-2" /> {t("addTask")}
                </button>
              )}
            </div>

            {/* Expanded Filters Panel */}
            {showFilters && (
              <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50 rounded-b-xl animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                      {t("filterByPriority")}
                    </label>
                    <select
                      className="w-full text-xs p-2 rounded border border-slate-200 bg-white focus:outline-none focus:border-primary-400"
                      value={filterPriority}
                      onChange={(e) =>
                        setFilterPriority(e.target.value as Priority | "ALL")
                      }
                    >
                      <option value="ALL">All Priorities</option>
                      <option value={Priority.LOW}>{t("low")}</option>
                      <option value={Priority.MEDIUM}>{t("medium")}</option>
                      <option value={Priority.HIGH}>{t("high")}</option>
                      <option value={Priority.URGENT}>{t("urgent")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                      {t("filterByAssignee")}
                    </label>
                    <select
                      className="w-full text-xs p-2 rounded border border-slate-200 bg-white focus:outline-none focus:border-primary-400"
                      value={filterAssignee}
                      onChange={(e) => setFilterAssignee(e.target.value)}
                    >
                      <option value="ALL">All Users</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                      {t("estHours")}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder={t("minHours")}
                        className="w-full text-xs p-2 rounded border border-slate-200 bg-white focus:outline-none focus:border-primary-400"
                        value={filterMinHours}
                        onChange={(e) =>
                          setFilterMinHours(
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                      />
                      <input
                        type="number"
                        placeholder={t("maxHours")}
                        className="w-full text-xs p-2 rounded border border-slate-200 bg-white focus:outline-none focus:border-primary-400"
                        value={filterMaxHours}
                        onChange={(e) =>
                          setFilterMaxHours(
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="w-full text-xs p-2 rounded border border-slate-300 bg-white text-slate-600 font-medium hover:bg-slate-100 flex items-center justify-center"
                    >
                      <X size={14} className="mr-1" /> {t("clearFilters")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {sortedTasks.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                <CheckSquare
                  size={48}
                  className="mx-auto text-slate-300 mb-3"
                />
                <p className="text-slate-400 font-medium">
                  No tasks match your filter.
                </p>
                {currentUser?.role === UserRole.ADMIN && !showFilters && (
                  <p
                    className="text-sm text-primary-600 mt-2 cursor-pointer hover:underline"
                    onClick={() => setShowAddTask(true)}
                  >
                    Create the first task
                  </p>
                )}
              </div>
            ) : (
              sortedTasks.map((task) => {
                const isOverdue =
                  task.dueDate < todayStr && task.status !== TaskStatus.DONE;
                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`bg-white p-4 rounded-xl border hover:shadow-md cursor-pointer flex justify-between items-center group transition-all ${
                      isOverdue
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200 hover:border-primary-400"
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`mr-4 p-3 rounded-full flex-shrink-0 ${
                          isOverdue
                            ? "bg-red-100 text-red-600"
                            : task.priority === Priority.URGENT
                            ? "bg-red-100 text-red-600 ring-2 ring-red-200"
                            : task.status === TaskStatus.DONE
                            ? "bg-green-100 text-green-600"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {isOverdue ? (
                          <AlertCircle size={20} />
                        ) : task.priority === Priority.URGENT ? (
                          <AlertTriangle size={20} />
                        ) : (
                          <CheckSquare size={20} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4
                            className={`font-bold text-base ${
                              task.status === TaskStatus.DONE
                                ? "text-slate-400 line-through"
                                : "text-slate-800"
                            }`}
                          >
                            {task.title}
                          </h4>
                          {task.priority !== Priority.MEDIUM &&
                            task.priority !== Priority.LOW && (
                              <span
                                className={`text-[10px] px-1.5 rounded font-bold uppercase ${
                                  task.priority === Priority.URGENT
                                    ? "bg-red-500 text-white"
                                    : "bg-orange-500 text-white"
                                }`}
                              >
                                {task.priority}
                              </span>
                            )}
                          {isOverdue && (
                            <span className="text-[10px] px-1.5 rounded font-bold uppercase bg-red-600 text-white animate-pulse">
                              OVERDUE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-slate-500">
                          <span
                            className={`flex items-center ${
                              isOverdue ? "text-red-600 font-bold" : ""
                            }`}
                          >
                            <Calendar size={12} className="mr-1" />{" "}
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                          <div className="flex items-center">
                            {task.assignedToIds.map((uid) => {
                              const u = users.find((user) => user.id === uid);
                              return u ? (
                                <span
                                  key={uid}
                                  className="bg-slate-100 px-1.5 py-0.5 rounded mr-1 border border-slate-200"
                                >
                                  {u.name.split(" ")[0]}
                                </span>
                              ) : null;
                            })}
                          </div>
                          {task.estimatedHours && (
                            <div
                              className="flex items-center"
                              title="Estimated Hours"
                            >
                              <Clock size={12} className="mr-1" />{" "}
                              {task.estimatedHours}h
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right pl-4">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          task.status === TaskStatus.DONE
                            ? "bg-green-100 text-green-700"
                            : task.status === TaskStatus.IN_PROGRESS
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* --- ADD PROJECT MODAL --- */}
      {showAddProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">
              {t("addProject")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Project Title
                </label>
                <input
                  className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="e.g. Renovation Damrak 12"
                  value={newProject.title}
                  onChange={(e) =>
                    setNewProject({ ...newProject, title: e.target.value })
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  {t("client")}
                </label>
                <input
                  className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Client Name"
                  value={newProject.clientName}
                  onChange={(e) =>
                    setNewProject({ ...newProject, clientName: e.target.value })
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  {t("projectEnd")}
                </label>
                <input
                  type="date"
                  className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  value={newProject.endDate || ""}
                  onChange={(e) =>
                    setNewProject({ ...newProject, endDate: e.target.value })
                  }
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  {t("street")}
                </label>
                <input
                  className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Street Name"
                  value={newProject.street}
                  onChange={(e) =>
                    setNewProject({ ...newProject, street: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  {t("houseNumber")}
                </label>
                <input
                  className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="12 A"
                  value={newProject.houseNumber}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      houseNumber: e.target.value,
                    })
                  }
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  {t("postalCode")}
                </label>
                <input
                  className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="1234 AB"
                  value={newProject.postalCode}
                  onChange={(e) =>
                    setNewProject({ ...newProject, postalCode: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  {t("city")}
                </label>
                <input
                  className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Amsterdam"
                  value={newProject.city}
                  onChange={(e) =>
                    setNewProject({ ...newProject, city: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                {t("description")}
              </label>
              <textarea
                className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none h-24"
                placeholder="General scope of work..."
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({ ...newProject, description: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => setShowAddProject(false)}
                className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleCreateProject}
                className="px-6 py-2 bg-safety-500 text-white rounded-lg font-bold hover:bg-safety-600 transition-colors shadow-lg shadow-safety-500/30"
              >
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD TASK MODAL --- */}
      {showAddTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2 flex items-center justify-between">
              {t("addTask")}
              {/* Template Selector */}
              <div className="flex items-center">
                <span className="text-xs text-slate-400 font-normal mr-2 hidden sm:inline">
                  {t("loadTemplate")}
                </span>
                <select
                  className="text-xs border border-slate-200 rounded p-1.5 font-normal text-slate-600 bg-slate-50"
                  onChange={handleLoadTemplate}
                  defaultValue=""
                >
                  <option value="" disabled>
                    {t("selectTemplate")}
                  </option>
                  {taskTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </h3>

            {/* Title & AI */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Task Title
                </label>
                <input
                  className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="e.g. Paint living room"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={generateAIHelp}
                  disabled={aiLoading || !newTask.title}
                  className="bg-purple-100 text-purple-700 px-4 py-2.5 rounded-lg hover:bg-purple-200 disabled:opacity-50 font-medium flex items-center h-[46px]"
                >
                  {aiLoading ? (
                    "Thinking..."
                  ) : (
                    <>
                      <Bot size={20} className="mr-2" /> AI Assist
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  {t("priority")}
                </label>
                <select
                  className="w-full border border-slate-300 p-2.5 rounded-lg bg-white"
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      priority: e.target.value as Priority,
                    })
                  }
                >
                  <option value={Priority.LOW}>{t("low")}</option>
                  <option value={Priority.MEDIUM}>{t("medium")}</option>
                  <option value={Priority.HIGH}>{t("high")}</option>
                  <option value={Priority.URGENT}>{t("urgent")}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  {t("dueDate")}
                </label>
                <input
                  type="date"
                  className="w-full border border-slate-300 p-2.5 rounded-lg"
                  value={newTask.dueDate}
                  onChange={(e) =>
                    setNewTask({ ...newTask, dueDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  {t("estHours")}
                </label>
                <input
                  type="number"
                  className="w-full border border-slate-300 p-2.5 rounded-lg"
                  value={newTask.estimatedHours}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      estimatedHours: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                {t("description")}
              </label>
              <textarea
                className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none h-24"
                placeholder="Detailed instructions..."
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
              />
            </div>

            {/* Tools Section */}
            <div className="mb-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                {t("tools")}
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  className="flex-1 border p-2 rounded text-sm"
                  placeholder="e.g. Drill, Ladder"
                  value={tempTool}
                  onChange={(e) => setTempTool(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addToolToTask()}
                />
                <button
                  onClick={addToolToTask}
                  className="bg-slate-200 text-slate-700 px-3 py-2 rounded hover:bg-slate-300"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(newTask.toolsRequired || []).map((tool, i) => (
                  <span
                    key={i}
                    className="bg-white px-2 py-1 rounded border border-slate-300 text-sm flex items-center"
                  >
                    {tool}
                    <button
                      onClick={() =>
                        setNewTask({
                          ...newTask,
                          toolsRequired: newTask.toolsRequired?.filter(
                            (_, idx) => idx !== i
                          ),
                        })
                      }
                      className="ml-2 text-red-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Materials Section */}
            <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                {t("materials")}
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  className="flex-[2] border p-2 rounded text-sm"
                  placeholder="Material Name"
                  value={tempMaterialName}
                  onChange={(e) => setTempMaterialName(e.target.value)}
                />
                <input
                  className="w-20 border p-2 rounded text-sm"
                  type="number"
                  placeholder="Qty"
                  value={tempMaterialQty}
                  onChange={(e) => setTempMaterialQty(Number(e.target.value))}
                />
                <input
                  className="w-20 border p-2 rounded text-sm"
                  placeholder="Unit"
                  value={tempMaterialUnit}
                  onChange={(e) => setTempMaterialUnit(e.target.value)}
                />
                <button
                  onClick={addMaterialToTask}
                  className="bg-slate-200 text-slate-700 px-3 py-2 rounded hover:bg-slate-300"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-1">
                {(newTask.materialsRequired || []).map((m, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 text-sm"
                  >
                    <span>{m.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">
                        {m.quantity} {m.unit}
                      </span>
                      <button
                        onClick={() =>
                          setNewTask({
                            ...newTask,
                            materialsRequired:
                              newTask.materialsRequired?.filter(
                                (_, idx) => idx !== i
                              ),
                          })
                        }
                        className="text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                {t("assignedTo")}
              </label>
              <div className="flex flex-wrap gap-2">
                {users
                  .filter((u) => u.role === UserRole.WORKER)
                  .map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        const current = newTask.assignedToIds || [];
                        const newIds = current.includes(u.id)
                          ? current.filter((id) => id !== u.id)
                          : [...current, u.id];
                        setNewTask({ ...newTask, assignedToIds: newIds });
                      }}
                      className={`flex items-center px-3 py-2 text-sm rounded-lg border transition-all ${
                        newTask.assignedToIds?.includes(u.id)
                          ? "bg-primary-600 text-white border-primary-600 shadow-md transform scale-105"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <img
                        src={u.avatar}
                        className="w-5 h-5 rounded-full mr-2"
                        alt=""
                      />
                      {u.name}
                    </button>
                  ))}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <button
                onClick={handleSaveAsTemplate}
                className="text-primary-600 text-sm font-medium hover:text-primary-800 flex items-center"
                disabled={!newTask.title}
              >
                <Copy size={16} className="mr-1" /> {t("saveTemplate")}
              </button>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddTask(false)}
                  className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleCreateTask}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30"
                >
                  {t("save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TEMPLATE MANAGER MODAL (Refactored) --- */}
      {showTemplateManager && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
              <div className="flex items-center">
                {templateMode !== "LIST" && (
                  <button
                    onClick={() => setTemplateMode("LIST")}
                    className="mr-2 text-slate-500 hover:text-slate-800"
                  >
                    <ArrowLeft size={20} />
                  </button>
                )}
                <h3 className="font-bold text-xl text-slate-800 flex items-center">
                  {templateMode === "LIST" ? (
                    <>
                      <FileText size={20} className="mr-2 text-primary-600" />{" "}
                      {t("templates")}
                    </>
                  ) : templateMode === "CREATE" ? (
                    t("createTemplate")
                  ) : (
                    t("editTemplate")
                  )}
                </h3>
              </div>
              <button
                onClick={() => setShowTemplateManager(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-0">
              {/* LIST MODE */}
              {templateMode === "LIST" && (
                <div className="min-h-[300px]">
                  {taskTemplates.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full">
                      <FileText size={48} className="mb-4 text-slate-300" />
                      <p className="mb-2">No templates saved yet.</p>
                      <button
                        onClick={handleStartCreateTemplate}
                        className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-primary-700"
                      >
                        {t("createTemplate")}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 flex justify-end">
                        <button
                          onClick={handleStartCreateTemplate}
                          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-primary-700 shadow-sm"
                        >
                          <Plus size={16} className="mr-2" />{" "}
                          {t("createTemplate")}
                        </button>
                      </div>
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold sticky top-0">
                          <tr>
                            <th className="p-4 border-b">Template Name</th>
                            <th className="p-4 border-b">Task Title</th>
                            <th className="p-4 border-b">Priority</th>
                            <th className="p-4 border-b text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {taskTemplates.map((tmpl) => (
                            <tr
                              key={tmpl.id}
                              className="hover:bg-slate-50 group"
                            >
                              <td className="p-4 font-medium text-slate-800">
                                {tmpl.name}
                              </td>
                              <td className="p-4 text-slate-600">
                                {tmpl.title}
                              </td>
                              <td className="p-4">
                                <span
                                  className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${
                                    tmpl.priority === Priority.URGENT
                                      ? "bg-red-100 text-red-600"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {tmpl.priority}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => handleEditTemplate(tmpl)}
                                  className="text-slate-400 hover:text-primary-600 p-2 rounded-full hover:bg-primary-50 mr-1"
                                  title="Edit"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        "Are you sure you want to delete this template?"
                                      )
                                    ) {
                                      deleteTaskTemplate(tmpl.id);
                                    }
                                  }}
                                  className="text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </div>
              )}

              {/* CREATE / EDIT MODE */}
              {(templateMode === "CREATE" || templateMode === "EDIT") && (
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      {t("templateName")}
                    </label>
                    <input
                      className="w-full border p-2 rounded-lg text-sm"
                      placeholder="e.g. Standard Painting"
                      value={activeTemplate.name}
                      onChange={(e) =>
                        setActiveTemplate({
                          ...activeTemplate,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        {t("defaultTitle")}
                      </label>
                      <input
                        className="w-full border p-2 rounded-lg text-sm"
                        placeholder="Task Title"
                        value={activeTemplate.title}
                        onChange={(e) =>
                          setActiveTemplate({
                            ...activeTemplate,
                            title: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        {t("priority")}
                      </label>
                      <select
                        className="w-full border p-2 rounded-lg text-sm bg-white"
                        value={activeTemplate.priority}
                        onChange={(e) =>
                          setActiveTemplate({
                            ...activeTemplate,
                            priority: e.target.value as Priority,
                          })
                        }
                      >
                        <option value={Priority.LOW}>{t("low")}</option>
                        <option value={Priority.MEDIUM}>{t("medium")}</option>
                        <option value={Priority.HIGH}>{t("high")}</option>
                        <option value={Priority.URGENT}>{t("urgent")}</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        {t("estHours")}
                      </label>
                      <input
                        type="number"
                        className="w-full border p-2 rounded-lg text-sm"
                        value={activeTemplate.estimatedHours}
                        onChange={(e) =>
                          setActiveTemplate({
                            ...activeTemplate,
                            estimatedHours: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      {t("description")}
                    </label>
                    <textarea
                      className="w-full border p-2 rounded-lg text-sm h-20"
                      value={activeTemplate.description}
                      onChange={(e) =>
                        setActiveTemplate({
                          ...activeTemplate,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Template Tools */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      {t("tools")}
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        className="flex-1 border p-2 rounded text-sm"
                        placeholder="Tool Name"
                        value={tempTool}
                        onChange={(e) => setTempTool(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && addToolToTemplate()
                        }
                      />
                      <button
                        onClick={addToolToTemplate}
                        className="bg-white border text-slate-600 px-3 py-1 rounded hover:bg-slate-50"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(activeTemplate.toolsRequired || []).map((tool, i) => (
                        <span
                          key={i}
                          className="bg-white px-2 py-1 rounded border border-slate-300 text-xs flex items-center"
                        >
                          {tool}
                          <button
                            onClick={() =>
                              setActiveTemplate({
                                ...activeTemplate,
                                toolsRequired:
                                  activeTemplate.toolsRequired?.filter(
                                    (_, idx) => idx !== i
                                  ),
                              })
                            }
                            className="ml-2 text-red-400"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Template Materials */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      {t("materials")}
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        className="flex-[2] border p-2 rounded text-sm"
                        placeholder="Material Name"
                        value={tempMaterialName}
                        onChange={(e) => setTempMaterialName(e.target.value)}
                      />
                      <input
                        className="w-20 border p-2 rounded text-sm"
                        type="number"
                        placeholder="Qty"
                        value={tempMaterialQty}
                        onChange={(e) =>
                          setTempMaterialQty(Number(e.target.value))
                        }
                      />
                      <input
                        className="w-20 border p-2 rounded text-sm"
                        placeholder="Unit"
                        value={tempMaterialUnit}
                        onChange={(e) => setTempMaterialUnit(e.target.value)}
                      />
                      <button
                        onClick={addMaterialToTemplate}
                        className="bg-white border text-slate-600 px-3 py-1 rounded hover:bg-slate-50"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="space-y-1">
                      {(activeTemplate.materialsRequired || []).map((m, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 text-xs"
                        >
                          <span>{m.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-bold">
                              {m.quantity} {m.unit}
                            </span>
                            <button
                              onClick={() =>
                                setActiveTemplate({
                                  ...activeTemplate,
                                  materialsRequired:
                                    activeTemplate.materialsRequired?.filter(
                                      (_, idx) => idx !== i
                                    ),
                                })
                              }
                              className="text-red-400"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 flex-shrink-0">
              {templateMode === "LIST" ? (
                <button
                  onClick={() => setShowTemplateManager(false)}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
                >
                  {t("close")}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setTemplateMode("LIST")}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 shadow-md"
                  >
                    {t("save")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

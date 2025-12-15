import { useState, useEffect } from "react";
import { Modal } from "../Modal";
import { ProjectTask } from "../../hooks/useProjectTasks";
import { useProjectTasks } from "../../hooks/useProjectTasks";
import { useProjectMembers } from "../../hooks/useProjectMembers";
import {
  Save,
  X,
  FileText,
  Image as ImageIcon,
  Package,
  CheckSquare,
  Calculator,
  Layout,
  User,
} from "lucide-react";

// Import wszystkich 5 komponentów RAPP.NL
import { TaskPhotoGallery } from "./TaskPhotoGallery";
import { TaskMaterialsList } from "./TaskMaterialsList";
import { TaskChecklistManager } from "./TaskChecklistManager";
import { TaskCostCalculator } from "./TaskCostCalculator";
import { TaskTemplateSelector } from "./TaskTemplateSelector";

// Import TaskTemplate type
interface TaskMaterial {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  supplier?: string;
  supplier_url?: string;
  notes?: string;
}

interface ChecklistItem {
  id: number;
  text: string;
  completed: boolean;
  completed_at?: string;
  completed_by?: string;
}

export interface TaskTemplate {
  id: string;
  template_name: string;
  template_category: string;
  description?: string;
  materials: TaskMaterial[];
  checklist: ChecklistItem[];
  hourly_rate: number;
  estimated_hours: number;
  calculated_cost: number;
}

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  task?: ProjectTask | null; // null = nowe zadanie, ProjectTask = edycja
  onSave?: () => void;
}

type TabType =
  | "basic"
  | "photos"
  | "materials"
  | "checklist"
  | "cost"
  | "template";

interface Tab {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function TaskFormModal({
  isOpen,
  onClose,
  projectId,
  task,
  onSave,
}: TaskFormModalProps) {
  const { createTask, updateTask, applyTemplate, fetchTemplates, loading } =
    useProjectTasks(projectId);
  const { members, loading: loadingMembers } = useProjectMembers(projectId);

  // Active tab state
  const [activeTab, setActiveTab] = useState<TabType>("basic");

  // Templates state (for TaskTemplateSelector)
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<ProjectTask>>({
    title: task?.title || "",
    description: task?.description || "",
    building_address: task?.building_address || "",
    room_floor: task?.room_floor || "",
    area_m2: task?.area_m2 || undefined,
    priority: task?.priority || "medium",
    status: task?.status || "not_started",
    due_date: task?.due_date || undefined, // ✅ FIXED: undefined zamiast '' dla timestamp
    estimated_hours: task?.estimated_hours || 0,
    hourly_rate: task?.hourly_rate || 50,
    assigned_to: task?.assigned_to || undefined, // ✅ NEW: Team member assignment
    project_id: projectId,
    // RAPP.NL fields
    photos: task?.photos || [],
    materials: task?.materials || [],
    checklist: task?.checklist || [],
    calculated_cost: task?.calculated_cost || 0,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Load templates when modal opens
  useEffect(() => {
    if (isOpen && activeTab === "template") {
      loadTemplates();
    }
  }, [isOpen, activeTab]);

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const data = await fetchTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Tabs configuration
  const tabs: Tab[] = [
    { id: "basic", label: "Podstawowe", icon: FileText },
    { id: "template", label: "Szablony", icon: Layout },
    { id: "photos", label: "Zdjęcia", icon: Image },
    { id: "materials", label: "Materiały", icon: Package },
    { id: "checklist", label: "Checklist", icon: CheckSquare },
    { id: "cost", label: "Koszty", icon: Calculator },
  ];

  // Validation
  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title?.trim()) {
      newErrors.title = "Tytuł jest wymagany";
    }

    if (formData.title && formData.title.length > 200) {
      newErrors.title = "Tytuł nie może przekraczać 200 znaków";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle template selection
  const handleTemplateSelect = async (template: TaskTemplate) => {
    // ✅ NEW: Allow template application for new tasks (local state)
    if (!task?.id) {
      // Apply template locally to formData
      setFormData((prev) => ({
        ...prev,
        description: template.description || prev.description,
        materials: template.materials || [],
        checklist: template.checklist || [],
        hourly_rate: template.hourly_rate || prev.hourly_rate,
        estimated_hours: template.estimated_hours || prev.estimated_hours,
        calculated_cost: template.calculated_cost || 0,
      }));
      alert(
        "Szablon zastosowany lokalnie! Zapisz zadanie aby zachować zmiany."
      );
      return;
    }

    // For existing tasks, apply via API
    try {
      const templateAsTask: any = {
        materials: template.materials,
        checklist: template.checklist,
        hourly_rate: template.hourly_rate,
        estimated_hours: template.estimated_hours,
        description: template.description,
      };

      await applyTemplate(task.id, templateAsTask);
      alert("Szablon zastosowany pomyślnie!");
      onSave?.();
    } catch (error) {
      console.error("Error applying template:", error);
      alert("Błąd podczas stosowania szablonu");
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validate()) {
      setActiveTab("basic"); // Przejdź do zakładki z błędami
      return;
    }

    // ✅ NEW: Validate and ensure projectId is set
    if (!formData.project_id) {
      console.warn("projectId missing, using provided projectId:", projectId);
      formData.project_id = projectId;
    }

    // Additional safety check
    if (!formData.project_id) {
      alert("Błąd: Nie można zapisać zadania bez projektu. Spróbuj ponownie.");
      return;
    }

    try {
      if (task?.id) {
        // Update existing task
        await updateTask(task.id, formData);
      } else {
        // Create new task
        await createTask(formData);
      }

      onSave?.();
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
      alert("Błąd podczas zapisywania zadania");
    }
  };

  // Handle input change
  const handleChange = (field: keyof ProjectTask, value: any) => {
    setFormData((prev: Partial<ProjectTask>) => ({ ...prev, [field]: value }));

    // Clear error for this field
    const fieldStr = String(field);
    if (errors[fieldStr]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldStr];
        return newErrors;
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task?.id ? "Edytuj zadanie" : "Nowe zadanie"}
      size="xl"
      footer={
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            disabled={loading}
          >
            <X className="w-4 h-4" />
            Anuluj
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            <Save className="w-4 h-4" />
            {loading ? "Zapisywanie..." : "Zapisz"}
          </button>
        </div>
      }
    >
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                  ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* BASIC TAB */}
        {activeTab === "basic" && (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tytuł zadania *
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.title ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="np. Malowanie pokoju, Naprawa dachu..."
                maxLength={200}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Opis
              </label>
              <textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Szczegóły zadania..."
              />
            </div>

            {/* Building Address */}
            <div>
              <label
                htmlFor="building_address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                📍 Adres placu budowy
              </label>
              <input
                id="building_address"
                type="text"
                value={formData.building_address || ""}
                onChange={(e) =>
                  handleChange("building_address", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="np. Hoofdstraat 123, Amsterdam"
                maxLength={200}
              />
            </div>

            {/* Room/Floor & Area */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="room_floor"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Piętro / Pokój
                </label>
                <input
                  id="room_floor"
                  type="text"
                  value={formData.room_floor || ""}
                  onChange={(e) => handleChange("room_floor", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="np. 2e verdieping, Slaapkamer"
                  maxLength={100}
                />
              </div>

              <div>
                <label
                  htmlFor="area_m2"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Powierzchnia (m²)
                </label>
                <input
                  id="area_m2"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.area_m2 || ""}
                  onChange={(e) =>
                    handleChange(
                      "area_m2",
                      parseFloat(e.target.value) || undefined
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="np. 25.5"
                />
              </div>
            </div>

            {/* Priority & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="priority"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Priorytet
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) =>
                    handleChange(
                      "priority",
                      e.target.value as ProjectTask["priority"]
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Niski</option>
                  <option value="medium">Średni</option>
                  <option value="high">Wysoki</option>
                  <option value="urgent">Pilne</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    handleChange(
                      "status",
                      e.target.value as ProjectTask["status"]
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="not_started">Nie rozpoczęto</option>
                  <option value="in_progress">W trakcie</option>
                  <option value="review">Do przeglądu</option>
                  <option value="completed">Ukończone</option>
                  <option value="blocked">Zablokowane</option>
                </select>
              </div>
            </div>

            {/* ✅ NEW: Team Member Assignment */}
            <div>
              <label
                htmlFor="assigned_to"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                <User className="w-4 h-4 inline mr-1" />
                Przypisz do
              </label>
              <select
                id="assigned_to"
                value={formData.assigned_to || ""}
                onChange={(e) =>
                  handleChange("assigned_to", e.target.value || undefined)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loadingMembers}
              >
                <option value="">Nie przypisano</option>
                {members.map((member) => (
                  <option key={member.id} value={member.user_id}>
                    {member.display_name || member.user_id} ({member.role})
                  </option>
                ))}
              </select>
              {loadingMembers && (
                <p className="mt-1 text-sm text-gray-500">
                  Ładowanie członków zespołu...
                </p>
              )}
              {!loadingMembers && members.length === 0 && (
                <p className="mt-1 text-sm text-amber-600">
                  Brak członków zespołu. Dodaj członków w zakładce Team.
                </p>
              )}
            </div>

            {/* Due Date & Duration */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="due_date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Termin wykonania
                </label>
                <input
                  id="due_date"
                  type="date"
                  value={formData.due_date || ""}
                  onChange={(e) => handleChange("due_date", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="estimated_days"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  📅 Ile dni
                </label>
                <input
                  id="estimated_days"
                  type="number"
                  min="0"
                  step="0.5"
                  value={
                    formData.estimated_hours
                      ? (formData.estimated_hours / 8).toFixed(1)
                      : ""
                  }
                  onChange={(e) => {
                    const days = parseFloat(e.target.value) || 0;
                    handleChange("estimated_hours", days * 8); // Convert days to hours
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="np. 2.5"
                />
              </div>

              <div>
                <label
                  htmlFor="estimated_hours"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  ⏱️ Godziny
                </label>
                <input
                  id="estimated_hours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.estimated_hours || ""}
                  onChange={(e) =>
                    handleChange(
                      "estimated_hours",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="np. 20"
                />
              </div>
            </div>

            {/* Hourly Rate */}
            <div>
              <label
                htmlFor="hourly_rate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Stawka godzinowa (€)
              </label>
              <input
                id="hourly_rate"
                type="number"
                min="0"
                step="5"
                value={formData.hourly_rate || 50}
                onChange={(e) =>
                  handleChange("hourly_rate", parseFloat(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Koszt robocizny: €
                {(
                  (formData.hourly_rate || 0) * (formData.estimated_hours || 0)
                ).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* TEMPLATE TAB */}
        {activeTab === "template" && (
          <div>
            <TaskTemplateSelector
              templates={templates}
              onTemplateSelect={handleTemplateSelect}
              loading={loadingTemplates}
            />
            {!task?.id && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  ⚠️ Szablon można w pełni zastosować dopiero po zapisaniu
                  zadania. Na razie możesz podglądać szablony.
                </p>
              </div>
            )}
          </div>
        )}

        {/* PHOTOS TAB */}
        {activeTab === "photos" && (
          <div>
            <TaskPhotoGallery
              taskId={task?.id || "new"}
              photos={formData.photos || []}
              onPhotosChange={(photos) => handleChange("photos", photos)}
            />
            {!task?.id && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 Zdjęcia możesz dodać lokalnie. Zostaną przesłane po
                  zapisaniu zadania.
                </p>
              </div>
            )}
          </div>
        )}

        {/* MATERIALS TAB */}
        {activeTab === "materials" && (
          <div>
            <TaskMaterialsList
              materials={formData.materials || []}
              onMaterialsChange={(materials) =>
                handleChange("materials", materials)
              }
            />
            {!task?.id && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 Materiały są zapisywane lokalnie i zostaną przesłane po
                  zapisaniu zadania.
                </p>
              </div>
            )}
          </div>
        )}

        {/* CHECKLIST TAB */}
        {activeTab === "checklist" && (
          <div>
            <TaskChecklistManager
              checklist={formData.checklist || []}
              onChecklistChange={(checklist) =>
                handleChange("checklist", checklist)
              }
            />
            {!task?.id && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 Checklist jest zapisywany lokalnie i zostanie przesłany po
                  zapisaniu zadania.
                </p>
              </div>
            )}
          </div>
        )}

        {/* COST TAB */}
        {activeTab === "cost" && (
          <div>
            <TaskCostCalculator
              materials={formData.materials || []}
              hourlyRate={formData.hourly_rate}
              estimatedHours={formData.estimated_hours}
              onHourlyRateChange={(rate) => handleChange("hourly_rate", rate)}
              onEstimatedHoursChange={(hours) =>
                handleChange("estimated_hours", hours)
              }
            />
            {!task?.id && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 Koszty są obliczane lokalnie. Dane zostaną zapisane po
                  zatwierdzeniu zadania.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

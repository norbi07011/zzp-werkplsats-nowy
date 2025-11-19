import { useState, useEffect } from "react";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../contexts/AuthContext";

// Enhanced interfaces for RAPP.NL-style features
export interface TaskPhoto {
  url: string;
  caption?: string;
  annotations?: string;
  timestamp: string;
  uploaded_by?: string;
}

export interface TaskMaterial {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  supplier?: string;
  supplier_url?: string;
  notes?: string;
}

export interface ChecklistItem {
  id: number;
  text: string;
  completed: boolean;
  completed_at?: string;
  completed_by?: string;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  created_by: string; // ✅ DODANE - required NOT NULL column
  title: string;
  description?: string;
  status:
    | "not_started"
    | "in_progress"
    | "review"
    | "completed"
    | "blocked"
    | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  assigned_to?: string;
  due_date?: string;
  building_address?: string;
  room_floor?: string;
  area_m2?: number;
  color_paint?: string;
  client_order_number?: string;
  parent_task_id?: string;
  is_subtask: boolean;
  progress_percentage: number;
  is_recurring: boolean;
  requires_photo_proof: boolean;
  photo_proof_url?: string;
  geo_lat?: number;
  geo_lng?: number;
  voice_note_url?: string;
  client_signature_url?: string;
  sla_hours?: number;
  risk_level: "low" | "medium" | "high";

  // RAPP.NL-style enhanced fields
  photos?: TaskPhoto[];
  materials?: TaskMaterial[];
  checklist?: ChecklistItem[];
  calculated_cost?: number;
  hourly_rate?: number;
  estimated_hours?: number;
  is_template?: boolean;
  template_name?: string;
  template_category?: string;
  before_photos?: TaskPhoto[];
  after_photos?: TaskPhoto[];
  client_signed_at?: string;

  created_at: string;
  updated_at: string;
}

export interface TaskChecklist {
  id: string;
  task_id: string;
  item_text: string;
  is_completed: boolean;
  sort_order: number;
  requires_proof: boolean;
  proof_url?: string;
}

export function useProjectTasks(projectId?: string) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks
  const fetchTasks = async () => {
    if (!projectId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("project_tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setTasks(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  // Create task
  const createTask = async (taskData: Partial<ProjectTask>) => {
    if (!user?.id) {
      throw new Error("User must be authenticated to create tasks");
    }

    // ✅ SANITIZE: Remove empty strings from timestamp fields
    const cleanData = { ...taskData };
    const timestampFields = [
      "due_date",
      "client_signed_at",
      "completed_at",
      "deleted_at",
    ];
    timestampFields.forEach((field) => {
      if (cleanData[field as keyof ProjectTask] === "") {
        delete cleanData[field as keyof ProjectTask];
      }
    });

    try {
      const { data, error: createError } = await supabase
        .from("project_tasks")
        .insert([
          {
            ...cleanData,
            project_id: projectId,
            created_by: user.id, // ✅ DODANE - required NOT NULL column
            status: cleanData.status || "not_started",
            priority: cleanData.priority || "medium",
            is_subtask: cleanData.is_subtask || false,
            progress_percentage: cleanData.progress_percentage || 0,
            is_recurring: cleanData.is_recurring || false,
            requires_photo_proof: cleanData.requires_photo_proof || false,
            risk_level: cleanData.risk_level || "low",
          },
        ])
        .select()
        .single();

      if (createError) throw createError;

      setTasks((prev) => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Update task
  const updateTask = async (taskId: string, updates: Partial<ProjectTask>) => {
    // ✅ SANITIZE: Remove empty strings from timestamp fields
    const cleanUpdates = { ...updates };
    const timestampFields = [
      "due_date",
      "client_signed_at",
      "completed_at",
      "deleted_at",
    ];
    timestampFields.forEach((field) => {
      if (cleanUpdates[field as keyof ProjectTask] === "") {
        delete cleanUpdates[field as keyof ProjectTask];
      }
    });

    try {
      const { data, error: updateError } = await supabase
        .from("project_tasks")
        .update({
          ...cleanUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId)
        .select()
        .single();

      if (updateError) throw updateError;

      setTasks((prev) => prev.map((t) => (t.id === taskId ? data : t)));
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("project_tasks")
        .delete()
        .eq("id", taskId);

      if (deleteError) throw deleteError;

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Fetch checklist for task
  const fetchChecklist = async (taskId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from("task_checklists")
        .select("*")
        .eq("task_id", taskId)
        .order("sort_order", { ascending: true });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err: any) {
      console.error("Error fetching checklist:", err);
      return [];
    }
  };

  // Add checklist item
  const addChecklistItem = async (
    taskId: string,
    itemText: string,
    requiresProof: boolean = false
  ) => {
    try {
      const { data, error: createError } = await supabase
        .from("task_checklists")
        .insert([
          {
            task_id: taskId,
            item_text: itemText,
            requires_proof: requiresProof,
            is_completed: false,
            sort_order: 0,
          },
        ])
        .select()
        .single();

      if (createError) throw createError;
      return data;
    } catch (err: any) {
      console.error("Error adding checklist item:", err);
      throw err;
    }
  };

  // Toggle checklist item
  const toggleChecklistItem = async (itemId: string, isCompleted: boolean) => {
    try {
      const { data, error: updateError } = await supabase
        .from("task_checklists")
        .update({
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          completed_by: isCompleted ? user?.id : null,
        })
        .eq("id", itemId)
        .select()
        .single();

      if (updateError) throw updateError;
      return data;
    } catch (err: any) {
      console.error("Error toggling checklist item:", err);
      throw err;
    }
  };

  // Fetch dependencies
  const fetchDependencies = async (taskId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from("task_dependencies")
        .select("*")
        .eq("task_id", taskId);

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err: any) {
      console.error("Error fetching dependencies:", err);
      return [];
    }
  };

  // Add dependency
  const addDependency = async (
    taskId: string,
    dependsOnTaskId: string,
    dependencyType: string = "finish_to_start"
  ) => {
    try {
      const { data, error: createError } = await supabase
        .from("task_dependencies")
        .insert([
          {
            task_id: taskId,
            depends_on_task_id: dependsOnTaskId,
            dependency_type: dependencyType,
          },
        ])
        .select()
        .single();

      if (createError) throw createError;
      return data;
    } catch (err: any) {
      console.error("Error adding dependency:", err);
      throw err;
    }
  };

  // ==============================================
  // RAPP.NL-STYLE ENHANCED FUNCTIONS
  // ==============================================

  // Upload photo to Supabase Storage
  const uploadPhoto = async (
    taskId: string,
    file: File,
    caption?: string,
    category: "all" | "before" | "after" = "all"
  ) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${taskId}/${Date.now()}.${fileExt}`;
      const filePath = `task-photos/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("project-files").getPublicUrl(filePath);

      const newPhoto: TaskPhoto = {
        url: publicUrl,
        caption,
        timestamp: new Date().toISOString(),
        uploaded_by: user?.id,
      };

      // Fetch current task
      const { data: currentTask } = await supabase
        .from("project_tasks")
        .select("photos, before_photos, after_photos")
        .eq("id", taskId)
        .single();

      if (!currentTask) throw new Error("Task not found");

      // Update appropriate photo array
      let updateData: any = {};
      if (category === "before") {
        const beforePhotos = currentTask.before_photos || [];
        updateData.before_photos = [...beforePhotos, newPhoto];
      } else if (category === "after") {
        const afterPhotos = currentTask.after_photos || [];
        updateData.after_photos = [...afterPhotos, newPhoto];
      } else {
        const photos = currentTask.photos || [];
        updateData.photos = [...photos, newPhoto];
      }

      const { data, error: updateError } = await supabase
        .from("project_tasks")
        .update(updateData)
        .eq("id", taskId)
        .select()
        .single();

      if (updateError) throw updateError;

      setTasks((prev) => prev.map((t) => (t.id === taskId ? data : t)));
      return newPhoto;
    } catch (err: any) {
      console.error("Error uploading photo:", err);
      throw err;
    }
  };

  // Update photos array (for delete/edit)
  const updatePhotos = async (
    taskId: string,
    photos: TaskPhoto[],
    category: "all" | "before" | "after" = "all"
  ) => {
    try {
      let updateData: any = {};
      if (category === "before") {
        updateData.before_photos = photos;
      } else if (category === "after") {
        updateData.after_photos = photos;
      } else {
        updateData.photos = photos;
      }

      const { data, error: updateError } = await supabase
        .from("project_tasks")
        .update(updateData)
        .eq("id", taskId)
        .select()
        .single();

      if (updateError) throw updateError;

      setTasks((prev) => prev.map((t) => (t.id === taskId ? data : t)));
      return data;
    } catch (err: any) {
      console.error("Error updating photos:", err);
      throw err;
    }
  };

  // Update materials array
  const updateMaterials = async (taskId: string, materials: TaskMaterial[]) => {
    try {
      const { data, error: updateError } = await supabase
        .from("project_tasks")
        .update({ materials })
        .eq("id", taskId)
        .select()
        .single();

      if (updateError) throw updateError;

      setTasks((prev) => prev.map((t) => (t.id === taskId ? data : t)));
      return data;
    } catch (err: any) {
      console.error("Error updating materials:", err);
      throw err;
    }
  };

  // Update checklist array
  const updateChecklist = async (
    taskId: string,
    checklist: ChecklistItem[]
  ) => {
    try {
      // Calculate progress percentage based on checklist
      const completedCount = checklist.filter((item) => item.completed).length;
      const progressPercentage =
        checklist.length > 0
          ? Math.round((completedCount / checklist.length) * 100)
          : 0;

      const { data, error: updateError } = await supabase
        .from("project_tasks")
        .update({
          checklist,
          progress_percentage: progressPercentage,
        })
        .eq("id", taskId)
        .select()
        .single();

      if (updateError) throw updateError;

      setTasks((prev) => prev.map((t) => (t.id === taskId ? data : t)));
      return data;
    } catch (err: any) {
      console.error("Error updating checklist:", err);
      throw err;
    }
  };

  // Update hourly rate and estimated hours
  const updateCostParams = async (
    taskId: string,
    hourlyRate?: number,
    estimatedHours?: number
  ) => {
    try {
      const updateData: any = {};
      if (hourlyRate !== undefined) updateData.hourly_rate = hourlyRate;
      if (estimatedHours !== undefined)
        updateData.estimated_hours = estimatedHours;

      const { data, error: updateError } = await supabase
        .from("project_tasks")
        .update(updateData)
        .eq("id", taskId)
        .select()
        .single();

      if (updateError) throw updateError;

      setTasks((prev) => prev.map((t) => (t.id === taskId ? data : t)));
      return data;
    } catch (err: any) {
      console.error("Error updating cost params:", err);
      throw err;
    }
  };

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("task_templates")
        .select("*")
        .order("template_category", { ascending: true });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err: any) {
      console.error("Error fetching templates:", err);
      return [];
    }
  };

  // Apply template to task
  const applyTemplate = async (taskId: string, template: ProjectTask) => {
    try {
      const updateData = {
        materials: template.materials,
        checklist: template.checklist,
        hourly_rate: template.hourly_rate,
        estimated_hours: template.estimated_hours,
        description: template.description,
      };

      const { data, error: updateError } = await supabase
        .from("project_tasks")
        .update(updateData)
        .eq("id", taskId)
        .select()
        .single();

      if (updateError) throw updateError;

      setTasks((prev) => prev.map((t) => (t.id === taskId ? data : t)));
      return data;
    } catch (err: any) {
      console.error("Error applying template:", err);
      throw err;
    }
  };

  // Calculate total cost (client-side helper)
  const calculateTotalCost = (
    materials: TaskMaterial[],
    hourlyRate: number,
    estimatedHours: number
  ) => {
    const materialsCost = materials.reduce(
      (sum, m) => sum + m.quantity * m.price,
      0
    );
    const laborCost = hourlyRate * estimatedHours;
    return materialsCost + laborCost;
  };

  useEffect(() => {
    fetchTasks();

    // ✅ NEW: Setup realtime subscription for project_tasks
    if (!projectId) return;

    const subscription = supabase
      .channel(`project_tasks:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "project_tasks",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log("Realtime update:", payload);

          if (payload.eventType === "INSERT") {
            // Add new task
            setTasks((prev) => [payload.new as ProjectTask, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            // Update existing task
            setTasks((prev) =>
              prev.map((t) =>
                t.id === payload.new.id ? (payload.new as ProjectTask) : t
              )
            );
          } else if (payload.eventType === "DELETE") {
            // Remove deleted task
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [projectId]);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    fetchChecklist,
    addChecklistItem,
    toggleChecklistItem,
    fetchDependencies,
    addDependency,
    // RAPP.NL-style enhanced functions
    uploadPhoto,
    updatePhotos,
    updateMaterials,
    updateChecklist,
    updateCostParams,
    fetchTemplates,
    applyTemplate,
    calculateTotalCost,
  };
}

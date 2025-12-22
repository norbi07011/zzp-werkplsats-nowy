import React, { useState, useEffect } from "react";
import { supabase } from "../src/lib/supabase";

interface Project {
  id: string;
  name: string;
  description?: string;
  status?: string;
}

interface AssignCompanyToProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
  onSuccess?: () => void;
}

export function AssignCompanyToProjectModal({
  isOpen,
  onClose,
  companyId,
  companyName,
  onSuccess,
}: AssignCompanyToProjectModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUserProjects();
    }
  }, [isOpen]);

  const fetchUserProjects = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get projects where user is a member (owner/admin/supervisor)
      const { data: memberData, error: memberError } = await (supabase as any)
        .from("project_members")
        .select("project_id, role")
        .eq("profile_id", user.id)
        .in("role", ["owner", "admin", "supervisor"]);

      if (memberError) throw memberError;

      const projectIds = memberData?.map((m: any) => m.project_id) || [];

      if (projectIds.length === 0) {
        setProjects([]);
        return;
      }

      // Fetch project details
      const { data: projectsData, error: projectsError } = await (
        supabase as any
      )
        .from("project_communication_rooms")
        .select("id, name, description, is_archived")
        .in("id", projectIds)
        .eq("is_archived", false)
        .order("name");

      if (projectsError) throw projectsError;

      setProjects(projectsData || []);
    } catch (err: any) {
      console.error("Error fetching projects:", err);
      setError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProjectId) {
      setError("Wybierz projekt");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert assignment
      const { error: insertError } = await (supabase as any)
        .from("project_cleaning_assignments")
        .insert([
          {
            project_id: selectedProjectId,
            company_id: companyId,
            assigned_by: user.id,
            notes: notes.trim() || null,
            status: "active",
            role: "cleaning_team",
          },
        ]);

      if (insertError) {
        if (insertError.code === "23505") {
          throw new Error("Ta firma jest już przypisana do tego projektu");
        }
        throw insertError;
      }

      onSuccess?.();
      handleClose();
    } catch (err: any) {
      console.error("Error assigning company:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedProjectId("");
    setNotes("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Przypisz do projektu
              </h2>
              <p className="text-sm text-gray-600">{companyName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <Folder className="w-4 h-4" />
                Wybierz projekt *
              </span>
            </label>
            {projects.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                Nie masz aktywnych projektów lub nie masz uprawnień do
                przypisywania firm.
              </div>
            ) : (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">-- Wybierz projekt --</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                    {project.description &&
                      ` - ${project.description.substring(0, 50)}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notatki (opcjonalnie)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Dodaj notatki o przypisaniu (np. zakres prac, terminy...)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={loading}
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || projects.length === 0}
            >
              {loading ? "Przypisuję..." : "Przypisz firmę"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../src/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../src/modules/invoices/components/ui/card";
import { Button } from "../src/modules/invoices/components/ui/button";
import { Input } from "../src/modules/invoices/components/ui/input";
import { Textarea } from "../src/modules/invoices/components/ui/textarea";
import { Badge } from "../src/modules/invoices/components/ui/badge";
import { BuildingCommunication } from "./BuildingCommunication";
import type { ProjectRole } from "../types";

// Use main Supabase client (alias as supabaseRaw for backwards compatibility)
const supabaseRaw = supabase;

interface ProjectData {
  id: string;
  name: string;
  description: string;
  employer_id: string;
  employer_name: string;
  status: "active" | "completed" | "paused";
  created_at: string;
  members_count: number;
}

interface CreateProjectData {
  name: string;
  description: string;
  employer_id?: string;
}

interface ProjectCommunicationManagerProps {
  userRole: ProjectRole;
  allowCreateProjects?: boolean;
}

export function ProjectCommunicationManager({
  userRole,
  allowCreateProjects = false,
}: ProjectCommunicationManagerProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(
    null
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create project form state
  const [createForm, setCreateForm] = useState<CreateProjectData>({
    name: "",
    description: "",
    employer_id: "",
  });

  useEffect(() => {
    loadProjects();
  }, [user]);

  const loadProjects = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // ✅ Load real projects from Supabase using raw client
      const { data: projectsData, error: fetchError } = await supabaseRaw
        .from("project_communication_rooms")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      // Transform to ProjectData format
      const transformedProjects: ProjectData[] = (projectsData || []).map(
        (p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || "",
          employer_id: p.employer_id || p.created_by,
          employer_name: p.employer_name || "Twoja Firma",
          status: p.is_archived ? "archived" : "active",
          created_at: p.created_at,
          members_count: 1, // TODO: count from project_members
        })
      );

      setProjects(transformedProjects);
    } catch (err) {
      console.error("Error loading projects:", err);
      setError("Błąd podczas ładowania projektów");
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!user?.id || !createForm.name.trim()) return;

    try {
      // ✅ Create real project in Supabase
      const { data: newProject, error: createError } = await supabaseRaw
        .from("project_communication_rooms")
        .insert({
          name: createForm.name,
          description: createForm.description,
          created_by: user.id,
          is_archived: false,
        })
        .select()
        .single();

      if (createError) {
        console.error("Supabase error:", createError);
        throw createError;
      }

      console.log("✅ Project created:", newProject);

      // Refresh projects list
      await loadProjects();

      setShowCreateForm(false);
      setCreateForm({ name: "", description: "", employer_id: "" });
    } catch (err: any) {
      console.error("Error creating project:", err);
      console.error("Error details:", err.message, err.code, err.details);
      setError(
        `Błąd podczas tworzenia projektu: ${err.message || "Unknown error"}`
      );
    }
  };

  const joinProject = async (projectId: string) => {
    if (!user?.id) return;

    try {
      // For demo purposes, just show a message
      console.log(`User ${user.id} joining project ${projectId}`);
      setError(null);
      // In real implementation, this would add user to project
    } catch (err) {
      console.error("Error joining project:", err);
      setError("Błąd podczas dołączania do projektu");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedProject) {
    return (
      <div className="space-y-4">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setSelectedProject(null)}
              variant="outline"
              size="sm"
            >
              ← Powrót
            </Button>
            <div>
              <h2 className="text-xl font-bold">{selectedProject.name}</h2>
              <p className="text-gray-600">{selectedProject.description}</p>
            </div>
          </div>
          <Badge
            variant={
              selectedProject.status === "active" ? "success" : "secondary"
            }
          >
            {selectedProject.status === "active" ? "Aktywny" : "Zakończony"}
          </Badge>
        </div>

        {/* Communication interface */}
        <BuildingCommunication
          projectId={selectedProject.id}
          userId={user?.id || ""}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            🏗️ Projekty Komunikacyjne
          </h2>
          <p className="text-gray-600">
            Zarządzaj komunikacją w projektach budowlanych
          </p>
        </div>
        {allowCreateProjects && (
          <Button onClick={() => setShowCreateForm(true)}>
            ➕ Nowy Projekt
          </Button>
        )}
      </div>

      {/* Error display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              ⚠️ {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create project form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Utwórz Nowy Projekt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nazwa projektu
              </label>
              <Input
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="np. Budowa domu jednorodzinnego"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Opis projektu
              </label>
              <Textarea
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Krótki opis projektu..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={createProject}
                disabled={!createForm.name.trim()}
              >
                Utwórz Projekt
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateForm({ name: "", description: "", employer_id: "" });
                }}
              >
                Anuluj
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">🏗️</div>
              <h3 className="font-medium mb-2">Brak projektów</h3>
              <p className="text-gray-600 mb-4">
                {allowCreateProjects
                  ? "Utwórz pierwszy projekt aby rozpocząć komunikację"
                  : "Poczekaj aż zostaniesz dodany do projektu"}
              </p>
              {allowCreateProjects && (
                <Button onClick={() => setShowCreateForm(true)}>
                  Utwórz Pierwszy Projekt
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card
              key={project.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg">{project.name}</h3>
                  <Badge
                    variant={
                      project.status === "active" ? "success" : "secondary"
                    }
                  >
                    {project.status === "active" ? "Aktywny" : "Zakończony"}
                  </Badge>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {project.description}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>👥 {project.members_count || 0} członków</span>
                  <span>
                    📅{" "}
                    {new Date(project.created_at).toLocaleDateString("pl-PL")}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setSelectedProject(project)}
                    className="flex-1"
                    size="sm"
                  >
                    💬 Otwórz Czat
                  </Button>
                  {userRole !== "employer" && (
                    <Button
                      onClick={() => joinProject(project.id)}
                      variant="outline"
                      size="sm"
                    >
                      Dołącz
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

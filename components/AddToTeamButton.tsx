import { useState, useEffect } from "react";
import { useAddTeamMember, Project } from "../hooks/useAddTeamMember";
import { UserPlus, Check, Mail, ChevronDown } from "lucide-react";

interface AddToTeamButtonProps {
  userId: string;
  userEmail?: string; // ✅ NEW: potrzebny do sprawdzania zaproszeń
  userType: "worker" | "employer" | "accountant"; // ✅ FAZA 4: typ użytkownika dla role mapping
  displayName?: string;
  avatarUrl?: string;
  className?: string;
}

/**
 * ✅ Komponent przycisku "Dodaj do drużyny"
 *
 * LOGIKA:
 * - Wysyła ZAPROSZENIE do projektu (project_invites)
 * - NIE dodaje bezpośrednio do project_members
 * - Zaproszony użytkownik musi zaakceptować
 */
export function AddToTeamButton({
  userId,
  userEmail,
  userType,
  displayName,
  avatarUrl,
  className = "",
}: AddToTeamButtonProps) {
  const {
    loading,
    error,
    fetchMyProjects,
    sendInviteToProject,
    isMemberOfProject,
    hasPendingInvite,
  } = useAddTeamMember();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<
    Record<string, boolean>
  >({});
  const [inviteStatus, setInviteStatus] = useState<Record<string, boolean>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const myProjects = await fetchMyProjects();
    setProjects(myProjects);

    // Check membership and invite status for each project
    const membership: Record<string, boolean> = {};
    const invites: Record<string, boolean> = {};

    for (const project of myProjects) {
      membership[project.id] = await isMemberOfProject(project.id, userId);

      // Check pending invites only if we have email
      if (userEmail) {
        invites[project.id] = await hasPendingInvite(project.id, userEmail);
      }
    }

    setMembershipStatus(membership);
    setInviteStatus(invites);
  };

  const handleAddToProject = async (projectId: string, projectName: string) => {
    try {
      // ✅ FAZA 4: Role mapping based on userType
      const roleMapping: Record<
        "worker" | "employer" | "accountant",
        "member" | "admin"
      > = {
        worker: "member", // pracownik = zwykły członek
        accountant: "admin", // księgowy = admin (zarządza finansami)
        employer: "admin", // pracodawca = admin (właściciel)
      };

      const projectRole = roleMapping[userType];

      // ✅ Wysyła ZAPROSZENIE (nie dodaje bezpośrednio!)
      await sendInviteToProject(
        projectId,
        userId,
        projectRole,
        displayName,
        avatarUrl
      );

      // Show success message
      setSuccessMessage(`✅ Wysłano zaproszenie do projektu "${projectName}"`);
      setTimeout(() => {
        setSuccessMessage(null);
        setShowDropdown(false);
      }, 3000);
    } catch (err: any) {
      console.error("Error sending invite:", err);
      alert(`Błąd: ${err.message}`);
    }
  };

  // Don't show button if no projects
  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
          {successMessage}
        </div>
      )}

      {/* Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={loading}
        className={`
          inline-flex items-center gap-2 px-4 py-2 
          bg-blue-600 hover:bg-blue-700 text-white 
          rounded-lg transition-all duration-200 
          shadow-sm hover:shadow-md
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        title="Dodaj do drużyny"
      >
        <UserPlus className="w-4 h-4" />
        <span className="font-medium">Dodaj do drużyny</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            showDropdown ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 z-40 overflow-hidden">
            <div className="p-3 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Wybierz projekt
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Dodaj użytkownika do swojego zespołu
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {projects.map((project) => {
                const isMember = membershipStatus[project.id];
                const hasInvite = inviteStatus[project.id];
                const canInvite = !isMember && !hasInvite;

                return (
                  <button
                    key={project.id}
                    onClick={() =>
                      canInvite && handleAddToProject(project.id, project.name)
                    }
                    disabled={!canInvite || loading}
                    className={`
                      w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50
                      transition-colors border-b border-gray-100 dark:border-slate-700 last:border-0
                      ${
                        !canInvite
                          ? "opacity-60 cursor-not-allowed"
                          : "cursor-pointer"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {project.name}
                        </h4>
                        {project.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`
                            text-xs px-2 py-0.5 rounded-full
                            ${
                              project.status === "active"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : ""
                            }
                            ${
                              project.status === "completed"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : ""
                            }
                            ${
                              project.status === "paused"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : ""
                            }
                          `}
                          >
                            {project.status === "active" ? "🟢 Aktywny" : ""}
                            {project.status === "completed"
                              ? "✅ Zakończony"
                              : ""}
                            {project.status === "paused" ? "⏸️ Wstrzymany" : ""}
                          </span>
                        </div>
                      </div>

                      {/* ✅ 3 statusy: członek / zaproszenie / brak */}
                      {isMember ? (
                        <div className="flex items-center gap-1.5 ml-3 text-green-600 dark:text-green-400">
                          <Check className="w-4 h-4" />
                          <span className="text-xs font-medium">W zespole</span>
                        </div>
                      ) : hasInvite ? (
                        <div className="flex items-center gap-1.5 ml-3 text-blue-600 dark:text-blue-400">
                          <Mail className="w-4 h-4" />
                          <span className="text-xs font-medium">
                            Zaproszono
                          </span>
                        </div>
                      ) : (
                        <div className="ml-3">
                          <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {projects.length === 0 && (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <p className="text-sm">Nie masz jeszcze projektów.</p>
                <p className="text-xs mt-1">
                  Utwórz projekt aby dodawać członków zespołu.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

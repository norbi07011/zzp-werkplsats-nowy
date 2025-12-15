import React, { useState, useEffect } from "react";
import { useProjectMembers, type TeamMember } from "../hooks/useProjectMembers";
import { supabase } from "../src/lib/supabase";
import { AddCleaningCompanyModal } from "./AddCleaningCompanyModal";
import { EditCleaningCompanyModal } from "./EditCleaningCompanyModal";
import { AssignCompanyToProjectModal } from "./AssignCompanyToProjectModal";














interface TeamMembersProps {
  projectId: string;
}

interface CleaningCompany {
  id: string;
  company_name: string;
  owner_name: string;
  phone: string | null;
  email: string | null;
  kvk_number: string | null;
  location_city: string | null;
  location_province: string | null;
  service_radius_km: number;
  specialization: string[];
  team_size: number;
  average_rating: number;
  total_reviews: number;
  accepting_new_clients: boolean;
  bio: string | null;
  profile_visibility: string;
}

export function TeamMembers({ projectId }: TeamMembersProps) {
  const { members, loading, error, addMember, updateMemberRole, removeMember } =
    useProjectMembers(projectId);

  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Cleaning companies state
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCompany, setSelectedCompany] =
    useState<CleaningCompany | null>(null);
  const [companyMenuOpen, setCompanyMenuOpen] = useState<string | null>(null);
  const [cleaningCompanies, setCleaningCompanies] = useState<CleaningCompany[]>(
    []
  );
  const [assignedCompanyIds, setAssignedCompanyIds] = useState<Set<string>>(
    new Set()
  );
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError, setCompaniesError] = useState<string | null>(null);

  // Fetch cleaning companies
  useEffect(() => {
    fetchCleaningCompanies();
  }, [projectId]);

  const fetchCleaningCompanies = async () => {
    setCompaniesLoading(true);
    setCompaniesError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch OWN companies + companies ASSIGNED to this project
      // Query: cleaning_companies WHERE profile_id = me OR id IN (assigned to projectId)

      // First get user's own companies
      const { data: ownData, error: ownError } = await (supabase as any)
        .from("cleaning_companies")
        .select("*")
        .eq("profile_id", user.id);

      if (ownError) throw ownError;

      // Then get companies assigned to this project
      const { data: assignmentsData, error: assignedError } = await (
        supabase as any
      )
        .from("project_cleaning_assignments")
        .select("company_id")
        .eq("project_id", projectId)
        .eq("status", "active");

      if (assignedError) throw assignedError;

      // Get company details for assigned companies
      const assignedCompanyIds = (assignmentsData || []).map(
        (a: any) => a.company_id
      );
      let assignedCompanies: CleaningCompany[] = [];

      if (assignedCompanyIds.length > 0) {
        const { data: companiesData, error: companiesError } = await (
          supabase as any
        )
          .from("cleaning_companies")
          .select("*")
          .in("id", assignedCompanyIds);

        if (companiesError) throw companiesError;
        assignedCompanies = (companiesData as CleaningCompany[]) || [];
      }

      // Merge results (avoid duplicates)
      const ownCompanies = (ownData as CleaningCompany[]) || [];

      // Combine and dedupe by id
      const allCompanies = [...ownCompanies];
      const assignedIds = new Set<string>();

      assignedCompanies.forEach((assigned: CleaningCompany) => {
        assignedIds.add(assigned.id);
        if (!allCompanies.find((c) => c.id === assigned.id)) {
          allCompanies.push(assigned);
        }
      });

      setAssignedCompanyIds(assignedIds);
      setCleaningCompanies(
        allCompanies.sort((a, b) =>
          a.company_name.localeCompare(b.company_name)
        )
      );
    } catch (err: any) {
      console.error("Error fetching cleaning companies:", err);
      setCompaniesError(err.message);
    } finally {
      setCompaniesLoading(false);
    }
  };

  const handleCompanyAdded = () => {
    fetchCleaningCompanies(); // Refresh list
  };

  const handleEditCompany = (company: CleaningCompany) => {
    setSelectedCompany(company);
    setShowEditCompanyModal(true);
    setCompanyMenuOpen(null);
  };

  const handleDeleteCompany = async (
    companyId: string,
    companyName: string
  ) => {
    if (!confirm(`Czy na pewno chcesz usunąć firmę "${companyName}"?`)) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await (supabase as any)
        .from("cleaning_companies")
        .delete()
        .eq("id", companyId)
        .eq("profile_id", user.id); // Security: only owner can delete

      if (error) throw error;

      fetchCleaningCompanies(); // Refresh
      setCompanyMenuOpen(null);
    } catch (err: any) {
      console.error("Error deleting company:", err);
      alert("Nie udało się usunąć firmy: " + err.message);
    }
  };

  const handleAssignToProject = (company: CleaningCompany) => {
    setSelectedCompany(company);
    setShowAssignModal(true);
    setCompanyMenuOpen(null);
  };

  const getSpecializationLabel = (value: string) => {
    const labels: { [key: string]: string } = {
      cleaning_after_construction: "Po remoncie",
      office_cleaning: "Biura",
      house_cleaning: "Domy",
      window_cleaning: "Okna",
      deep_cleaning: "Głębokie",
      carpet_cleaning: "Dywany",
      move_in_out: "Przeprowadzki",
      industrial_cleaning: "Przemysłowe",
    };
    return labels[value] || value;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "manager":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "member":
        return "bg-green-100 text-green-800 border-green-200";
      case "viewer":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner":
        return "Właściciel";
      case "admin":
        return "Administrator";
      case "manager":
        return "Menedżer";
      case "member":
        return "Członek";
      case "viewer":
        return "Obserwator";
      default:
        return role;
    }
  };

  const getPermissionLabels = (permissions: string[]) => {
    const labels: { [key: string]: string } = {
      view: "Podgląd",
      edit: "Edycja",
      delete: "Usuwanie",
      invite: "Zapraszanie",
      manage_tasks: "Zarządzanie zadaniami",
      manage_files: "Zarządzanie plikami",
      manage_team: "Zarządzanie zespołem",
    };
    return permissions.map((p) => labels[p] || p);
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
        Error loading team members: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Zespół</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddCompanyModal(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Building2 className="w-5 h-5" />
            Dodaj firmę sprzątającą
          </button>
          <button
            onClick={() => setShowAddMemberForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Dodaj członka
          </button>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <div
            key={member.id}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-semibold">
                  {member.user_id.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    User {member.user_id.substring(0, 8)}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(member.joined_at).toLocaleDateString("pl-PL")}
                  </p>
                </div>
              </div>
              <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-400" />
                <span
                  className={`text-xs px-2 py-1 rounded border ${getRoleBadgeColor(
                    member.role
                  )}`}
                >
                  {getRoleLabel(member.role)}
                </span>
              </div>

              {member.permissions && member.permissions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {getPermissionLabels(member.permissions).map(
                    (permission, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded"
                      >
                        {permission}
                      </span>
                    )
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                {member.is_active ? (
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Aktywny
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-gray-400 text-sm">
                    <XCircle className="w-4 h-4" />
                    Nieaktywny
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Members List (Alternative View) */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                Członek
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                Rola
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                Uprawnienia
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                Dołączył
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                      {member.user_id.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        User {member.user_id.substring(0, 8)}
                      </p>
                      <p className="text-sm text-gray-500">
                        ID: {member.user_id}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-1 rounded border ${getRoleBadgeColor(
                      member.role
                    )}`}
                  >
                    {getRoleLabel(member.role)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {member.permissions && member.permissions.length > 0 ? (
                      getPermissionLabels(member.permissions)
                        .slice(0, 3)
                        .map((permission, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded"
                          >
                            {permission}
                          </span>
                        ))
                    ) : (
                      <span className="text-sm text-gray-400">Brak</span>
                    )}
                    {member.permissions && member.permissions.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{member.permissions.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {new Date(member.joined_at).toLocaleDateString("pl-PL")}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {member.is_active ? (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Aktywny
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-gray-400 text-sm">
                      <XCircle className="w-4 h-4" />
                      Nieaktywny
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600">Wszyscy członkowie</p>
          <p className="text-2xl font-bold text-gray-900">{members.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600">Administratorzy</p>
          <p className="text-2xl font-bold text-red-600">
            {
              members.filter((m) => m.role === "admin" || m.role === "owner")
                .length
            }
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600">Menedżerowie</p>
          <p className="text-2xl font-bold text-blue-600">
            {members.filter((m) => m.role === "manager").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600">Aktywni</p>
          <p className="text-2xl font-bold text-green-600">
            {members.filter((m) => m.is_active).length}
          </p>
        </div>
      </div>

      {/* Role Permissions Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Uprawnienia ról</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="font-medium text-blue-800">Właściciel:</span>
            <span className="text-blue-700 ml-2">
              Pełna kontrola nad projektem
            </span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Administrator:</span>
            <span className="text-blue-700 ml-2">
              Zarządzanie zespołem i ustawieniami
            </span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Menedżer:</span>
            <span className="text-blue-700 ml-2">
              Zarządzanie zadaniami i plikami
            </span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Członek:</span>
            <span className="text-blue-700 ml-2">
              Edycja i tworzenie treści
            </span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Obserwator:</span>
            <span className="text-blue-700 ml-2">Tylko podgląd projektu</span>
          </div>
        </div>
      </div>

      {/* Cleaning Companies Section */}
      <div className="mt-8 pt-8 border-t-2 border-gray-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-green-600" />
            Firmy sprzątające
          </h2>
        </div>

        {companiesLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : companiesError ? (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            Błąd ładowania firm: {companiesError}
          </div>
        ) : cleaningCompanies.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Brak firm sprzątających
            </h3>
            <p className="text-gray-500 mb-4">
              Dodaj swoją pierwszą firmę sprzątającą, aby zarządzać nią w
              projektach
            </p>
            <button
              onClick={() => setShowAddCompanyModal(true)}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Building2 className="w-5 h-5" />
              Dodaj firmę sprzątającą
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cleaningCompanies.map((company) => (
              <div
                key={company.id}
                className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all hover:border-green-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xl font-bold">
                      {company.company_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">
                        {company.company_name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-600">
                          {company.owner_name}
                        </p>
                        {assignedCompanyIds.has(company.id) && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded border border-blue-200 font-medium">
                            Przypisana do projektu
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() =>
                        setCompanyMenuOpen(
                          companyMenuOpen === company.id ? null : company.id
                        )
                      }
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-500" />
                    </button>
                    {companyMenuOpen === company.id && (
                      <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[160px]">
                        <button
                          onClick={() => handleAssignToProject(company)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 text-blue-600"
                        >
                          <FolderPlus className="w-4 h-4" />
                          Przypisz do projektu
                        </button>
                        <button
                          onClick={() => handleEditCompany(company)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                        >
                          <Edit className="w-4 h-4" />
                          Edytuj
                        </button>
                        <hr className="my-1 border-gray-200" />
                        <button
                          onClick={() =>
                            handleDeleteCompany(
                              company.id,
                              company.company_name
                            )
                          }
                          className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          Usuń firmę
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {/* Rating */}
                  {company.average_rating > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.round(company.average_rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        ({company.total_reviews}{" "}
                        {company.total_reviews === 1 ? "opinia" : "opinii"})
                      </span>
                    </div>
                  )}

                  {/* Location */}
                  {company.location_city && (
                    <p className="text-sm text-gray-600">
                      📍 {company.location_city}
                      {company.location_province &&
                        `, ${company.location_province}`}
                    </p>
                  )}

                  {/* Team Size */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    {company.team_size}{" "}
                    {company.team_size === 1 ? "osoba" : "osoby"}
                  </div>

                  {/* Specialization */}
                  {company.specialization &&
                    company.specialization.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {company.specialization
                          .slice(0, 3)
                          .map((spec, index) => (
                            <span
                              key={index}
                              className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded border border-green-200"
                            >
                              {getSpecializationLabel(spec)}
                            </span>
                          ))}
                        {company.specialization.length > 3 && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            +{company.specialization.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                  {/* Status */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    {company.accepting_new_clients ? (
                      <div className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Przyjmuje klientów
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-400 text-sm">
                        <XCircle className="w-4 h-4" />
                        Nie przyjmuje
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  {company.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                      {company.bio}
                    </p>
                  )}
                </div>

                {/* Contact buttons */}
                <div className="mt-4 flex gap-2">
                  {company.phone && (
                    <a
                      href={`tel:${company.phone}`}
                      className="flex-1 text-center px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      Zadzwoń
                    </a>
                  )}
                  {company.email && (
                    <a
                      href={`mailto:${company.email}`}
                      className="flex-1 text-center px-3 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors text-sm font-medium"
                    >
                      Email
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Company Stats */}
        {cleaningCompanies.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600">Wszystkie firmy</p>
              <p className="text-2xl font-bold text-green-600">
                {cleaningCompanies.length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600">Przyjmują klientów</p>
              <p className="text-2xl font-bold text-blue-600">
                {
                  cleaningCompanies.filter((c) => c.accepting_new_clients)
                    .length
                }
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600">Średnia ocena</p>
              <p className="text-2xl font-bold text-yellow-600">
                {cleaningCompanies.length > 0
                  ? (
                      cleaningCompanies.reduce(
                        (sum, c) => sum + c.average_rating,
                        0
                      ) / cleaningCompanies.length
                    ).toFixed(1)
                  : "0.0"}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600">Łączna wielkość zespołów</p>
              <p className="text-2xl font-bold text-purple-600">
                {cleaningCompanies.reduce((sum, c) => sum + c.team_size, 0)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add Cleaning Company Modal */}
      <AddCleaningCompanyModal
        isOpen={showAddCompanyModal}
        onClose={() => setShowAddCompanyModal(false)}
        onSuccess={handleCompanyAdded}
      />

      {/* Edit Cleaning Company Modal */}
      <EditCleaningCompanyModal
        isOpen={showEditCompanyModal}
        onClose={() => {
          setShowEditCompanyModal(false);
          setSelectedCompany(null);
        }}
        company={selectedCompany}
        onSuccess={handleCompanyAdded}
      />

      {/* Assign Company to Project Modal */}
      <AssignCompanyToProjectModal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedCompany(null);
        }}
        companyId={selectedCompany?.id || ""}
        companyName={selectedCompany?.company_name || ""}
        onSuccess={() => {
          alert("Firma została przypisana do projektu!");
          setShowAssignModal(false);
          setSelectedCompany(null);
        }}
      />
    </div>
  );
}

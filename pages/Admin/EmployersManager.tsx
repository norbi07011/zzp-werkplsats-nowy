// @ts-nocheck
/**
 * EmployersManager Component
 * Full CRUD interface for managing companies/employers with Supabase
 */

import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToasts } from "../../contexts/ToastContext";
import { useCompanies } from "../../src/hooks/useCompanies";
import {
  Building2,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  TrendingUp,
  Users,
  Euro,
  Calendar,
  Tag,
  Download,
  Upload,
  Mail,
  Phone,
  Globe,
  MapPin,
  Shield,
  Clock,
  AlertTriangle,
} from "lucide-react";
import type {
  Company,
  SubscriptionPlan,
  SubscriptionStatus,
} from "../../src/services/companies";

export const EmployersManager = () => {
  const { addToast } = useToasts();
  const navigate = useNavigate();
  const {
    companies,
    activeCompanies,
    trialCompanies,
    verifiedCompanies,
    companiesExpiringSoon,
    stats,
    loading,
    error,
    refreshCompanies,
    create,
    update,
    remove,
    verify,
    unverify,
    changePlan,
    changeStatus,
    extend,
    addTags,
    removeTags,
  } = useCompanies();

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState<"all" | SubscriptionPlan>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | SubscriptionStatus>(
    "all"
  );
  const [filterVerified, setFilterVerified] = useState<
    "all" | "verified" | "unverified"
  >("all");
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const matchesSearch =
        company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.company_nip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.contact_email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPlan =
        filterPlan === "all" || company.subscription_plan === filterPlan;
      const matchesStatus =
        filterStatus === "all" || company.subscription_status === filterStatus;
      const matchesVerified =
        filterVerified === "all" ||
        (filterVerified === "verified" && company.is_verified) ||
        (filterVerified === "unverified" && !company.is_verified);

      return matchesSearch && matchesPlan && matchesStatus && matchesVerified;
    });
  }, [companies, searchTerm, filterPlan, filterStatus, filterVerified]);

  // Handlers
  const handleVerify = async (id: string) => {
    const success = await verify(id);
    if (success) {
      addToast("Firma zweryfikowana!", "success");
    } else {
      addToast("Błąd podczas weryfikacji", "error");
    }
  };

  const handleUnverify = async (id: string) => {
    const success = await unverify(id);
    if (success) {
      addToast("Weryfikacja cofnięta", "success");
    } else {
      addToast("Błąd podczas cofania weryfikacji", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Czy na pewno chcesz usunąć tę firmę? Tej operacji nie można cofnąć!"
      )
    )
      return;

    const success = await remove(id);
    if (success) {
      addToast("Firma usunięta", "success");
    } else {
      addToast("Błąd podczas usuwania firmy", "error");
    }
  };

  const handleChangePlan = async (id: string, plan: SubscriptionPlan) => {
    const fees = { free: 0, basic: 49, premium: 149, enterprise: 499 };
    const limits = { free: 5, basic: 25, premium: 100, enterprise: 999 };

    const success = await changePlan(id, plan, fees[plan], limits[plan]);
    if (success) {
      addToast(`Plan zmieniony na ${plan}`, "success");
    } else {
      addToast("Błąd podczas zmiany planu", "error");
    }
  };

  const handleChangeStatus = async (id: string, status: SubscriptionStatus) => {
    const success = await changeStatus(id, status);
    if (success) {
      addToast(`Status zmieniony na ${status}`, "success");
    } else {
      addToast("Błąd podczas zmiany statusu", "error");
    }
  };

  const handleExtend = async (id: string) => {
    const months = parseInt(
      prompt("Przedłuż subskrypcję o ile miesięcy?") || "0"
    );
    if (months <= 0) return;

    const success = await extend(id, months);
    if (success) {
      addToast(`Subskrypcja przedłużona o ${months} miesięcy`, "success");
    } else {
      addToast("Błąd podczas przedłużania subskrypcji", "error");
    }
  };

  const toggleCompanySelection = (id: string) => {
    setSelectedCompanies((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCompanies.length === filteredCompanies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(filteredCompanies.map((c) => c.id));
    }
  };

  const getPlanBadge = (plan: SubscriptionPlan) => {
    const styles = {
      free: "bg-gray-500/20 text-gray-300",
      basic: "bg-blue-500/20 text-blue-300",
      premium: "bg-purple-500/20 text-purple-300",
      enterprise: "bg-amber-500/20 text-amber-300",
    };

    // Jeśli plan jest undefined lub null, zwróć domyślny badge
    if (!plan) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-300">
          FREE
        </span>
      );
    }

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          styles[plan] || styles.free
        }`}
      >
        {plan.toUpperCase()}
      </span>
    );
  };

  const getStatusBadge = (status: SubscriptionStatus) => {
    const styles = {
      active: "bg-green-500/20 text-green-300",
      trial: "bg-blue-500/20 text-blue-300",
      inactive: "bg-gray-500/20 text-gray-300",
      cancelled: "bg-red-500/20 text-red-300",
      expired: "bg-orange-500/20 text-orange-300",
    };
    const icons = {
      active: "✓",
      trial: "🔄",
      inactive: "⏸",
      cancelled: "✗",
      expired: "⚠",
    };

    // Jeśli status jest undefined, zwróć domyślny badge
    if (!status) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-300">
          ⏸ inactive
        </span>
      );
    }

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          styles[status] || styles.inactive
        }`}
      >
        {icons[status] || "⏸"} {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              <Building2 className="inline-block mr-3" size={40} />
              Zarządzanie Pracodawcami
            </h1>
            <p className="text-gray-300">
              Przeglądaj firmy, zarządzaj subskrypcjami i monitoruj aktywność
            </p>
          </div>
          <Link
            to="/admin"
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium transition-all"
          >
            ← Powrót
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <span className="ml-4 text-white text-lg">Ładowanie firm...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 mb-6">
            <h3 className="text-red-300 font-semibold mb-2">
              ❌ Błąd podczas ładowania danych
            </h3>
            <p className="text-red-200 mb-4">{error}</p>
            <button
              onClick={refreshCompanies}
              className="bg-red-500/30 hover:bg-red-500/50 text-white px-4 py-2 rounded-lg transition-all"
            >
              🔄 Spróbuj ponownie
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md rounded-2xl p-6 border border-blue-400/30">
                <div className="flex items-center justify-between mb-4">
                  <Building2 className="text-blue-300" size={32} />
                  <TrendingUp className="text-blue-300" size={20} />
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  {stats.total}
                </div>
                <div className="text-blue-300 text-sm">Wszystkie firmy</div>
                <div className="text-blue-200 text-xs mt-2">
                  +{stats.newThisMonth} ten miesiąc
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-md rounded-2xl p-6 border border-green-400/30">
                <div className="flex items-center justify-between mb-4">
                  <Check className="text-green-300" size={32} />
                  <Shield className="text-green-300" size={20} />
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  {stats.active}
                </div>
                <div className="text-green-300 text-sm">
                  Aktywne subskrypcje
                </div>
                <div className="text-green-200 text-xs mt-2">
                  {stats.verified} zweryfikowanych
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md rounded-2xl p-6 border border-purple-400/30">
                <div className="flex items-center justify-between mb-4">
                  <Euro className="text-purple-300" size={32} />
                  <TrendingUp className="text-purple-300" size={20} />
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  €{(stats.totalRevenue / 1000).toFixed(1)}k
                </div>
                <div className="text-purple-300 text-sm">Total Revenue</div>
                <div className="text-purple-200 text-xs mt-2">
                  Wszystkie płatności
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 backdrop-blur-md rounded-2xl p-6 border border-amber-400/30">
                <div className="flex items-center justify-between mb-4">
                  <Users className="text-amber-300" size={32} />
                  <AlertTriangle className="text-amber-300" size={20} />
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  {companiesExpiringSoon.length}
                </div>
                <div className="text-amber-300 text-sm">Wygasają wkrótce</div>
                <div className="text-amber-200 text-xs mt-2">
                  Następne 30 dni
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-8">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all flex items-center gap-2"
              >
                <Plus size={20} />
                Dodaj Firmę
              </button>
              <button
                onClick={refreshCompanies}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all"
              >
                🔄 Odśwież
              </button>
              <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all flex items-center gap-2">
                <Download size={20} />
                Eksportuj CSV
              </button>
              <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all flex items-center gap-2">
                <Upload size={20} />
                Importuj CSV
              </button>
              {selectedCompanies.length > 0 && (
                <button className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl font-medium transition-all">
                  🗑️ Usuń zaznaczone ({selectedCompanies.length})
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <label className="text-sm text-gray-300 mb-2 block">
                    Szukaj
                  </label>
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-3 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder="Nazwa firmy, NIP, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    Plan subskrypcji
                  </label>
                  <select
                    value={filterPlan}
                    onChange={(e) => setFilterPlan(e.target.value as any)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="all" className="bg-slate-800">
                      Wszystkie plany
                    </option>
                    <option value="free" className="bg-slate-800">
                      Free
                    </option>
                    <option value="basic" className="bg-slate-800">
                      Basic
                    </option>
                    <option value="premium" className="bg-slate-800">
                      Premium
                    </option>
                    <option value="enterprise" className="bg-slate-800">
                      Enterprise
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="all" className="bg-slate-800">
                      Wszystkie statusy
                    </option>
                    <option value="active" className="bg-slate-800">
                      Aktywne
                    </option>
                    <option value="trial" className="bg-slate-800">
                      Trial
                    </option>
                    <option value="inactive" className="bg-slate-800">
                      Nieaktywne
                    </option>
                    <option value="cancelled" className="bg-slate-800">
                      Anulowane
                    </option>
                    <option value="expired" className="bg-slate-800">
                      Wygasłe
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Companies Table */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="px-6 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={
                            selectedCompanies.length ===
                              filteredCompanies.length &&
                            filteredCompanies.length > 0
                          }
                          onChange={toggleSelectAll}
                          className="rounded"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Firma
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Kontakt
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Plan
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Pracownicy
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Przychód
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">
                        Akcje
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompanies.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-16 text-center">
                          <Building2
                            className="mx-auto mb-4 text-gray-400"
                            size={48}
                          />
                          <p className="text-xl text-gray-400">Brak firm</p>
                        </td>
                      </tr>
                    ) : (
                      filteredCompanies.map((company) => (
                        <tr
                          key={company.id}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                          onClick={() =>
                            navigate(`/profile/employer/${company.id}`)
                          }
                        >
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedCompanies.includes(company.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleCompanySelection(company.id);
                              }}
                              className="rounded"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {company.logo_url ? (
                                <img
                                  src={company.logo_url}
                                  alt={company.company_name}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                  {company.company_name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-white flex items-center gap-2">
                                  {company.company_name}
                                  {company.is_verified && (
                                    <Shield
                                      className="text-green-400"
                                      size={16}
                                    />
                                  )}
                                </div>
                                {company.company_nip && (
                                  <div className="text-sm text-gray-400">
                                    NIP: {company.company_nip}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-gray-300">
                              {company.contact_person && (
                                <div className="text-sm">
                                  {company.contact_person}
                                </div>
                              )}
                              {company.contact_email && (
                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                  <Mail size={12} />
                                  {company.contact_email}
                                </div>
                              )}
                              {company.contact_phone && (
                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                  <Phone size={12} />
                                  {company.contact_phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getPlanBadge(company.subscription_plan)}
                            <div className="text-xs text-gray-400 mt-1">
                              €{company.monthly_fee}/mies
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(company.subscription_status)}
                            {company.subscription_end_date && (
                              <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(
                                  company.subscription_end_date
                                ).toLocaleDateString("pl-PL")}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-white font-semibold">
                              {company.active_workers_count}
                            </div>
                            <div className="text-xs text-gray-400">
                              z {company.workers_limit} limit
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-white font-semibold">
                              €{(company.total_spent ?? 0).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-400">
                              {company.total_appointments ?? 0} spotkań
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Link
                                to={`/profile/employer/${company.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-400 hover:text-blue-300 transition-colors text-sm flex items-center gap-1"
                              >
                                👁️ Profil
                              </Link>
                              {!company.is_verified ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleVerify(company.id);
                                  }}
                                  className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-sm transition-all"
                                  title="Zweryfikuj"
                                >
                                  <Check size={16} />
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnverify(company.id);
                                  }}
                                  className="px-3 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 rounded-lg text-sm transition-all"
                                  title="Cofnij weryfikację"
                                >
                                  <X size={16} />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingCompany(company);
                                  setShowEditModal(true);
                                }}
                                className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-sm transition-all"
                                title="Edytuj"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExtend(company.id);
                                }}
                                className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-sm transition-all"
                                title="Przedłuż"
                              >
                                <Clock size={16} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(company.id);
                                }}
                                className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm transition-all"
                                title="Usuń"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 bg-white/5 border-t border-white/10 text-center text-gray-400">
                Wyświetlono {filteredCompanies.length} z {companies.length} firm
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmployersManager;

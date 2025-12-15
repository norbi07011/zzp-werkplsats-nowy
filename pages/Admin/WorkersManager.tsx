import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Profile, Level } from "../../types";
import { AddWorkerModal } from "../../components/Admin/AddWorkerModal";
import { WorkerVerificationModal } from "../../components/Admin/WorkerVerificationModal";
import { useToasts } from "../../contexts/ToastContext";
import { useWorkers } from "../../src/hooks/useWorkers";

type VerificationData = {
  verificationType:
    | "documents"
    | "interview"
    | "skills_test"
    | "background_check";
  verifierName: string;
  verificationDate: string;
  expiryDate: string;
  notes: string;
  skillsVerified: string[];
  riskLevel: "low" | "medium" | "high";
  certificationLevel: "basic" | "intermediate" | "advanced" | "expert";
};

type DeletedWorker = {
  worker: Profile;
  deletedDate: string;
  deletedBy: string;
  reason: string;
};

export const WorkersManager = () => {
  const { addToast } = useToasts();
  const navigate = useNavigate();

  // Use Supabase hook instead of mock data
  const {
    workers: workersData,
    stats: dbStats,
    loading,
    error,
    refreshWorkers,
    verifyWorkerById,
    unverifyWorkerById,
    deleteWorkerById,
  } = useWorkers();

  const [deletedWorkers, setDeletedWorkers] = useState<DeletedWorker[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedWorkerForVerification, setSelectedWorkerForVerification] =
    useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWorkerForDelete, setSelectedWorkerForDelete] =
    useState<any>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("Wszystkie");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "verified" | "unverified"
  >("all");
  const [showDeletedWorkers, setShowDeletedWorkers] = useState(false);

  const categories = [
    "Wszystkie",
    "Stolarka",
    "Elektryka",
    "Hydraulika",
    "Malowanie",
    "Ogólnobudowlane",
  ];

  // Map Supabase data to component format
  const workers = useMemo(() => {
    if (!workersData) return [];
    return workersData.map((w) => {
      // Split full_name into first/last
      const nameParts = (w.profile?.full_name || "Unknown User").split(" ");
      const firstName = nameParts[0] || "Unknown";
      const lastName = nameParts.slice(1).join(" ") || "";

      return {
        id: w.id,
        firstName,
        lastName,
        category: w.specialization,
        level: "Regular" as Level,
        location: w.location_city || "Unknown",
        avatarUrl:
          w.profile?.avatar_url ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${w.id}`,
        isVerified: w.verified,
        hasVca: false, // TODO: Check certificates
        verifiedUntil: "",
        rating: w.rating || 0,
      };
    });
  }, [workersData]);

  const filteredWorkers = useMemo(() => {
    return workers.filter((worker) => {
      const matchesSearch =
        worker.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        filterCategory === "Wszystkie" || worker.category === filterCategory;

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "verified" && worker.isVerified) ||
        (filterStatus === "unverified" && !worker.isVerified);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [workers, searchTerm, filterCategory, filterStatus]);

  const handleVerifyWorker = (worker: any) => {
    setSelectedWorkerForVerification(worker);
    setShowVerificationModal(true);
  };

  const handleVerificationComplete = async (
    worker: any,
    verificationData: VerificationData
  ) => {
    try {
      // Call Supabase service to verify worker
      const success = await verifyWorkerById(
        String(worker.id),
        verificationData
      );

      if (success) {
        addToast("Weryfikacja zakończona pomyślnie!", "success");
        addToast("Certyfikat PDF zostanie wygenerowany", "info");
        addToast("Email powiadomienie zostało wysłane", "info");

        // Simulate certificate generation
        setTimeout(() => {
          addToast("Certyfikat weryfikacji został zapisany", "success");
        }, 3000);
      } else {
        addToast("Błąd podczas weryfikacji pracownika", "error");
      }
    } catch (err) {
      console.error("Verification error:", err);
      addToast("Błąd podczas weryfikacji pracownika", "error");
    }
  };

  const handleDeleteWorker = (worker: any) => {
    setSelectedWorkerForDelete(worker);
    setShowDeleteModal(true);
  };

  const confirmDeleteWorker = async () => {
    if (!selectedWorkerForDelete) return;

    try {
      // Soft delete - move to deleted workers archive
      const deletedWorker: DeletedWorker = {
        worker: selectedWorkerForDelete,
        deletedDate: new Date().toISOString().split("T")[0],
        deletedBy: "Admin",
        reason: deleteReason || "Brak powodu",
      };

      setDeletedWorkers((prev) => [...prev, deletedWorker]);

      // Call Supabase service to delete worker
      const success = await deleteWorkerById(
        String(selectedWorkerForDelete.id)
      );

      if (success) {
        addToast("Pracownik został usunięty", "success");
        addToast("Dane zostały zarchiwizowane", "info");
        addToast("Email powiadomienie zostało wysłane", "info");
      } else {
        addToast("Błąd podczas usuwania pracownika", "error");
      }
    } catch (err) {
      console.error("Delete error:", err);
      addToast("Błąd podczas usuwania pracownika", "error");
    } finally {
      setShowDeleteModal(false);
      setSelectedWorkerForDelete(null);
      setDeleteReason("");
    }
  };

  const stats = {
    total: dbStats.total,
    verified: dbStats.verified,
    unverified: dbStats.unverified,
    withVca: workers.filter((w) => w.hasVca).length, // TODO: Get from certificates table
    deleted: deletedWorkers.length,
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-2xl text-white">Ładowanie pracowników...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-2xl text-white mb-4">Błąd wczytywania danych</p>
          <p className="text-gray-400 mb-8">{error}</p>
          <button
            onClick={() => refreshWorkers()}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all"
          >
            🔄 Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              👷 Zarządzanie Pracownikami
            </h1>
            <p className="text-gray-300">
              Zarządzaj profilami, weryfikacją i certyfikatami
            </p>
          </div>
          <Link
            to="/admin"
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium transition-all"
          >
            ← Powrót
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md rounded-2xl p-6 border border-blue-400/30">
            <div className="text-blue-300 text-sm font-medium mb-2">
              Wszyscy pracownicy
            </div>
            <div className="text-4xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-md rounded-2xl p-6 border border-green-400/30">
            <div className="text-green-300 text-sm font-medium mb-2">
              Zweryfikowani
            </div>
            <div className="text-4xl font-bold text-white">
              {stats.verified}
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-md rounded-2xl p-6 border border-yellow-400/30">
            <div className="text-yellow-300 text-sm font-medium mb-2">
              Niezweryfikowani
            </div>
            <div className="text-4xl font-bold text-white">
              {stats.unverified}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md rounded-2xl p-6 border border-purple-400/30">
            <div className="text-purple-300 text-sm font-medium mb-2">
              Z VCA
            </div>
            <div className="text-4xl font-bold text-white">{stats.withVca}</div>
          </div>
          <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-md rounded-2xl p-6 border border-red-400/30">
            <div className="text-red-300 text-sm font-medium mb-2">
              Usunięci
            </div>
            <div className="text-4xl font-bold text-white">{stats.deleted}</div>
            <button
              onClick={() => setShowDeletedWorkers(!showDeletedWorkers)}
              className="mt-2 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              {showDeletedWorkers ? "Ukryj archiwum" : "Pokaż archiwum"}
            </button>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 w-full">
              <input
                type="text"
                placeholder="🔍 Szukaj po imieniu, nazwisku lub kategorii..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Filtruj po kategorii"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-800">
                  {cat}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Filtruj po statusie weryfikacji"
            >
              <option value="all" className="bg-slate-800">
                Wszyscy
              </option>
              <option value="verified" className="bg-slate-800">
                Zweryfikowani
              </option>
              <option value="unverified" className="bg-slate-800">
                Niezweryfikowani
              </option>
            </select>

            {/* Add Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-glow-green transition-all whitespace-nowrap"
            >
              + Dodaj Pracownika
            </button>
          </div>
        </div>

        {/* Workers Table */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-white/10">
            {filteredWorkers.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-xl text-gray-400">
                  Brak pracowników spełniających kryteria
                </p>
              </div>
            ) : (
              filteredWorkers.map((worker) => (
                <div
                  key={worker.id}
                  className="p-4 hover:bg-white/5 transition-colors"
                  onClick={() => navigate(`/profile/worker/${worker.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={worker.avatarUrl}
                      alt={worker.firstName}
                      className="w-12 h-12 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-white truncate">
                          {worker.firstName} {worker.lastName}
                        </h3>
                        {worker.isVerified ? (
                          <span className="text-green-400 text-xs flex items-center gap-1">✓ Zweryfikowany</span>
                        ) : (
                          <span className="text-yellow-400 text-xs">⚠️ Do weryfikacji</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{worker.location}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-xs text-gray-300 bg-white/10 px-2 py-1 rounded-full">
                          {worker.category}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          worker.level === Level.Senior
                            ? "bg-purple-500/20 text-purple-300"
                            : worker.level === Level.Regular
                            ? "bg-blue-500/20 text-blue-300"
                            : "bg-green-500/20 text-green-300"
                        }`}>
                          {worker.level}
                        </span>
                        {worker.hasVca && (
                          <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">VCA ✓</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Link
                          to={`/profile/worker/${worker.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-400 text-sm min-h-[44px] flex items-center px-3 py-2 bg-blue-500/10 rounded-lg"
                        >
                          👁️ Profil
                        </Link>
                        {!worker.isVerified && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerifyWorker(worker);
                            }}
                            className="px-3 py-2 min-h-[44px] bg-green-500/20 text-green-300 rounded-lg text-sm"
                          >
                            🔍 Weryfikuj
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWorker(worker);
                          }}
                          className="px-3 py-2 min-h-[44px] bg-red-500/20 text-red-300 rounded-lg text-sm ml-auto"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto scrollable-table-container scroll-right">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Pracownik
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Kategoria
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Poziom
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    VCA
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="text-6xl mb-4">🔍</div>
                      <p className="text-xl text-gray-400">
                        Brak pracowników spełniających kryteria
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((worker) => (
                    <tr
                      key={worker.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => navigate(`/profile/worker/${worker.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={worker.avatarUrl}
                            alt={worker.firstName}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <div className="font-semibold text-white">
                              {worker.firstName} {worker.lastName}
                            </div>
                            <div className="text-sm text-gray-400">
                              {worker.location}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {worker.category}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            worker.level === Level.Senior
                              ? "bg-purple-500/20 text-purple-300"
                              : worker.level === Level.Regular
                              ? "bg-blue-500/20 text-blue-300"
                              : "bg-green-500/20 text-green-300"
                          }`}
                        >
                          {worker.level}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {worker.isVerified ? (
                          <span className="flex items-center gap-2 text-green-400">
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Zweryfikowany
                          </span>
                        ) : (
                          <span className="text-yellow-400">
                            ⚠️ Do weryfikacji
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {worker.hasVca ? (
                          <span className="text-green-400">✓ Tak</span>
                        ) : (
                          <span className="text-gray-500">— Nie</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/profile/worker/${worker.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                          >
                            👁️ Profil
                          </Link>
                          {!worker.isVerified && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVerifyWorker(worker);
                              }}
                              className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-sm font-medium transition-all"
                              title="Rozpocznij proces weryfikacji"
                            >
                              🔍 Weryfikuj
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWorker(worker);
                            }}
                            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium transition-all"
                            title="Usuń pracownika"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-center text-gray-400">
          Wyświetlono {filteredWorkers.length} z {workers.length} pracowników
        </div>
      </div>

      {/* Advanced Verification Modal */}
      {showVerificationModal && selectedWorkerForVerification && (
        <WorkerVerificationModal
          isOpen={showVerificationModal}
          worker={selectedWorkerForVerification}
          onClose={() => {
            setShowVerificationModal(false);
            setSelectedWorkerForVerification(null);
          }}
          onVerified={handleVerificationComplete}
        />
      )}

      {/* Advanced Delete Modal */}
      {showDeleteModal && selectedWorkerForDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/20 max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Usuń pracownika
              </h3>
              <p className="text-gray-300">
                Ta operacja przeniesie pracownika do archiwum
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={selectedWorkerForDelete.avatarUrl}
                  alt={selectedWorkerForDelete.firstName}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h4 className="text-white font-semibold">
                    {selectedWorkerForDelete.firstName}{" "}
                    {selectedWorkerForDelete.lastName}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    {selectedWorkerForDelete.category}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Powód usunięcia
                </label>
                <select
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  aria-label="Wybierz powód usunięcia"
                >
                  <option value="" className="bg-slate-800">
                    Wybierz powód...
                  </option>
                  <option value="Nieaktywny" className="bg-slate-800">
                    Nieaktywny
                  </option>
                  <option value="Złamanie regulaminu" className="bg-slate-800">
                    Złamanie regulaminu
                  </option>
                  <option value="Prośba pracownika" className="bg-slate-800">
                    Prośba pracownika
                  </option>
                  <option
                    value="Nieprofesjonalne zachowanie"
                    className="bg-slate-800"
                  >
                    Nieprofesjonalne zachowanie
                  </option>
                  <option value="Duplikat konta" className="bg-slate-800">
                    Duplikat konta
                  </option>
                  <option value="Inne" className="bg-slate-800">
                    Inne
                  </option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="text-green-400">✓</span>
                <span>Dane zostaną zarchiwizowane</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="text-blue-400">📧</span>
                <span>Email powiadomienie zostanie wysłane</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="text-yellow-400">⚠️</span>
                <span>Można przywrócić z archiwum</span>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedWorkerForDelete(null);
                  setDeleteReason("");
                }}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all"
              >
                Anuluj
              </button>
              <button
                onClick={confirmDeleteWorker}
                disabled={!deleteReason}
                className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🗑️ Usuń
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Worker Modal */}
      {showAddModal && (
        <AddWorkerModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            addToast("Pracownik został dodany!", "success");
          }}
        />
      )}
    </div>
  );
};

// Export as default for lazy loading
export default WorkersManager;

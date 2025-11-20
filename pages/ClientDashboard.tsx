import { useState, useMemo, useEffect } from "react";
import { MOCK_PROFILES, MOCK_JOBS } from "../constants";
import { WorkerCard } from "../components/WorkerCard";
import { Level, Profile, UserRole, Job } from "../types";
import { JobForm } from "../components/Forms/JobForm";
import { useAuth } from "../contexts/AuthContext";
import {
  getJobsByCompany,
  deleteJob,
  updateJobStatus,
} from "../src/services/job";
import type { Job as JobType } from "../src/services/job";
import { toast } from "sonner";
import {
  WrenchScrewdriverIcon,
  BoltIcon,
  BuildingOfficeIcon,
  PaintBrushIcon,
} from "../components/icons";
import {
  DashboardHeader,
  TabNavigation,
} from "../components/DashboardComponents";
import { EmptyState } from "../components/LoadingStates";

const categories = [
  "Wszystkie",
  "Stolarka",
  "Elektryka",
  "Ogólnobudowlane",
  "Hydraulika",
  "Malowanie",
  "Tynkowanie",
  "Posadzki",
  "Kafelkarz",
  "Dekarz",
  "Ocieplenia",
  "Montaż okien/drzwi",
  "Spawanie",
  "Operator maszyn",
  "Magazyn",
  "Ogrodnictwo",
  "Sprzątanie",
];
const levels = ["Wszystkie", ...Object.values(Level)];

const categoryIcons: Record<string, React.ReactNode> = {
  Stolarka: <WrenchScrewdriverIcon className="w-5 h-5" />,
  Elektryka: <BoltIcon className="w-5 h-5" />,
  Ogólnobudowlane: <BuildingOfficeIcon className="w-5 h-5" />,
  Malowanie: <PaintBrushIcon className="w-5 h-5" />,
  Hydraulika: <WrenchScrewdriverIcon className="w-5 h-5" />,
  "Montaż okien/drzwi": <WrenchScrewdriverIcon className="w-5 h-5" />,
};

type View =
  | "overview"
  | "catalog"
  | "reviewing"
  | "job-board"
  | "add-job"
  | "saved-workers"
  | "subscription"
  | "team";

// Enhanced Overview Dashboard for Employers
const EmployerOverviewDashboard: React.FC<{
  user: any;
  onNavigate: (view: View) => void;
}> = ({ user, onNavigate }) => {
  const activeJobs = 5;
  const totalApplications = 34;
  const savedWorkers = 12;
  const totalSpent = 8450;
  const activeProjects = 3;

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background Effects - zmienione na subtelne */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-primary-100/30 rounded-full blur-[150px]"></div>
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-primary-50/40 rounded-full blur-[150px]"></div>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Hero Section - MESSU-BOUW Style */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-4xl shadow-md">
              🏢
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Witaj, {user?.name || "Firma"}! 🎉
              </h1>
              <p className="text-gray-600 text-lg">
                Panel zarządzania zleceniami i pracownikami
              </p>
              <div className="flex items-center gap-4 mt-3">
                <span className="bg-primary-50 text-primary-600 px-3 py-1 rounded-full text-sm font-medium">
                  ✓ Pro Plan
                </span>
                <span className="text-gray-500 text-sm">
                  Odnawia się: 15 listopada 2025
                </span>
              </div>
            </div>
            <div className="text-right">
              <button
                onClick={() => onNavigate("subscription")}
                className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-200 active:scale-95"
              >
                💳 Zarządzaj Planem
              </button>
            </div>
          </div>

          {/* Quick Stats - MESSU-BOUW Style */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-primary-500 rounded-2xl p-4 text-center text-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <p className="text-xs opacity-90 mb-1">Aktywne Zlecenia</p>
              <p className="text-3xl font-bold">{activeJobs}</p>
            </div>
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-4 border border-primary-200 text-center shadow-sm hover:shadow-md transition-all duration-300">
              <p className="text-xs text-gray-600 mb-1">Aplikacje</p>
              <p className="text-3xl font-bold text-primary-700">
                {totalApplications}
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-4 border border-primary-200 text-center shadow-sm hover:shadow-md transition-all duration-300">
              <p className="text-xs text-gray-600 mb-1">Zapisani</p>
              <p className="text-3xl font-bold text-primary-700">
                {savedWorkers}
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-4 border border-primary-200 text-center shadow-sm hover:shadow-md transition-all duration-300">
              <p className="text-xs text-gray-600 mb-1">Projekty</p>
              <p className="text-3xl font-bold text-primary-700">
                {activeProjects}
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-4 border border-primary-200 text-center shadow-sm hover:shadow-md transition-all duration-300">
              <p className="text-xs text-gray-600 mb-1">Wydane</p>
              <p className="text-3xl font-bold text-primary-700">
                €{totalSpent}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Active Jobs */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Jobs */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-2xl">📋</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 flex-1">
                  Aktywne Zlecenia
                </h2>
                <button
                  onClick={() => onNavigate("add-job")}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95"
                >
                  ➕ Dodaj Zlecenie
                </button>
              </div>
              <div className="space-y-3">
                {MOCK_JOBS.slice(0, 5).map((job) => (
                  <div
                    key={job.id}
                    className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-gray-800 font-semibold">
                        {job.title}
                      </h3>
                      <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-sm font-medium">
                        Aktywne
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      {job.description.slice(0, 100)}...
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-gray-500 text-sm">
                          📍 {job.location}
                        </span>
                        <span className="text-gray-500 text-sm">
                          👥 {job.peopleNeeded} osób
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all active:scale-95">
                          Edytuj
                        </button>
                        <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-semibold transition-all active:scale-95">
                          Aplikacje (7)
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Applications */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-2xl">👥</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 flex-1">
                  Najnowsze Aplikacje
                </h2>
                <button
                  onClick={() => onNavigate("job-board")}
                  className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Zobacz wszystkie →
                </button>
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <img
                      src={`https://i.pravatar.cc/60?img=${i}`}
                      alt="Worker"
                      className="w-14 h-14 rounded-full border-2 border-primary-200"
                    />
                    <div className="flex-1">
                      <p className="text-gray-800 font-semibold">
                        Jan Kowalski
                      </p>
                      <p className="text-gray-600 text-sm">Elektryk • Senior</p>
                      <p className="text-gray-500 text-xs mt-1">
                        Aplikacja na: "Instalacja elektryczna - biurowiec"
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="bg-green-50 hover:bg-green-100 text-green-600 px-4 py-2 rounded-full text-sm font-semibold transition-all active:scale-95">
                        ✓ Akceptuj
                      </button>
                      <button className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-full text-sm font-semibold transition-all active:scale-95">
                        ✕ Odrzuć
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions & Saved Workers */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-2xl">⚡</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  Szybkie Akcje
                </h2>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => onNavigate("add-job")}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white px-4 py-3 rounded-full text-left flex items-center gap-3 transition-all duration-200 active:scale-95 font-semibold"
                >
                  <span className="text-xl">➕</span>
                  <span>Dodaj Zlecenie</span>
                </button>
                <button
                  onClick={() => onNavigate("catalog")}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-full text-left flex items-center gap-3 transition-all duration-200 active:scale-95 font-semibold"
                >
                  <span className="text-xl">🔍</span>
                  <span>Szukaj Pracowników</span>
                </button>
                <button
                  onClick={() => onNavigate("saved-workers")}
                  className="w-full border-2 border-primary-500 text-primary-600 hover:bg-primary-50 px-4 py-3 rounded-full text-left flex items-center gap-3 transition-all duration-200 active:scale-95 font-semibold"
                >
                  <span className="text-xl">⭐</span>
                  <span>Zapisani ({savedWorkers})</span>
                </button>
                <button
                  onClick={() => onNavigate("team")}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-full text-left flex items-center gap-3 transition-all duration-200 active:scale-95 font-semibold"
                >
                  <span className="text-xl">👥</span>
                  <span>Zespół</span>
                </button>
              </div>
            </div>

            {/* Subscription Status */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-2xl">💳</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  Plan Subskrypcji
                </h2>
              </div>
              <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-4 mb-4 shadow-md">
                <p className="text-white font-bold text-lg mb-2">Pro Plan</p>
                <p className="text-white/90 text-sm">€99/miesiąc</p>
              </div>
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Zlecenia</span>
                  <span className="text-gray-800 font-semibold">5 / 20</span>
                </div>
                <div className="bg-gray-100 rounded-full h-2">
                  <div className="bg-primary-500 h-2 rounded-full w-[25%]"></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Kontakty</span>
                  <span className="text-gray-800 font-semibold">18 / 50</span>
                </div>
                <div className="bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full w-[36%]"></div>
                </div>
              </div>
              <button
                onClick={() => onNavigate("subscription")}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95"
              >
                Zarządzaj Planem
              </button>
            </div>

            {/* Activity Stats */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl shadow-lg border border-primary-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-xl">📊</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Statystyki</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">🔍 Wyszukania</span>
                  <span className="text-primary-700 font-bold">156</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">📞 Kontakty</span>
                  <span className="text-primary-700 font-bold">23</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">⭐ Zapisani</span>
                  <span className="text-primary-700 font-bold">
                    {savedWorkers}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">✅ Ukończone</span>
                  <span className="text-primary-700 font-bold">12</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CatalogView: React.FC<{ onStartReview: (profile: Profile) => void }> = ({
  onStartReview,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("Wszystkie");
  const [level, setLevel] = useState("Wszystkie");
  const [hasVca, setHasVca] = useState(false);
  const [minRating, setMinRating] = useState(0);

  const filteredProfiles = useMemo(() => {
    return MOCK_PROFILES.filter((profile) => {
      const searchMatch =
        `${profile.firstName} ${profile.lastName} ${profile.category}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const categoryMatch =
        category === "Wszystkie" || profile.category === category;
      const levelMatch = level === "Wszystkie" || profile.level === level;
      const vcaMatch = !hasVca || profile.hasVca;
      const ratingMatch = profile.avgRating >= minRating;
      return (
        searchMatch && categoryMatch && levelMatch && vcaMatch && ratingMatch
      );
    });
  }, [searchTerm, category, level, hasVca, minRating]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <aside className="lg:col-span-1">
        <div className="p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-premium border border-white/40 dark:border-slate-700/40 rounded-3xl shadow-premium sticky top-32 animate-fade-in">
          <h3 className="text-xl font-heading font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
            🔍 Filtry wyszukiwania
          </h3>
          <div className="space-y-6">
            {/* Filter inputs */}
            <div>
              <label
                htmlFor="search"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                👤 Szukaj specjalisty
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Imię, nazwisko, kategoria..."
                  className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-300/50 dark:border-slate-600/50 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 text-sm bg-white/90 dark:bg-slate-700/90 text-gray-900 dark:text-gray-200 transition-all duration-300"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                🔨 Kategoria
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full py-3 px-4 rounded-xl border border-slate-300/50 dark:border-slate-600/50 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 text-sm bg-white/90 dark:bg-slate-700/90 text-gray-900 dark:text-gray-200 transition-all duration-300"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="level"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                🎖️ Poziom
              </label>
              <select
                id="level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full py-3 px-4 rounded-xl border border-slate-300/50 dark:border-slate-600/50 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 text-sm bg-white/90 dark:bg-slate-700/90 text-gray-900 dark:text-gray-200 transition-all duration-300"
              >
                {levels.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="min-rating"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3"
              >
                ⭐ Min. ocena:{" "}
                <span className="text-primary-600 dark:text-primary-400 font-bold">
                  {minRating.toFixed(1)} ★
                </span>
              </label>
              <div className="relative">
                <input
                  type="range"
                  id="min-rating"
                  min="0"
                  max="5"
                  step="0.1"
                  value={minRating}
                  onChange={(e) => setMinRating(parseFloat(e.target.value))}
                  className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer dark:bg-slate-700 gradient-slider transition-all duration-300"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span>0.0</span>
                  <span>2.5</span>
                  <span>5.0</span>
                </div>
              </div>
            </div>
            <div className="flex items-center pt-4 border-t border-slate-300/70 dark:border-slate-600/70">
              <input
                id="vca"
                type="checkbox"
                checked={hasVca}
                onChange={(e) => setHasVca(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label
                htmlFor="vca"
                className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
              >
                Tylko z VCA
              </label>
            </div>
          </div>
        </div>
      </aside>
      <main className="lg:col-span-3">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-slate-700/50 px-4 py-2 rounded-full border border-white/30 dark:border-slate-600/30">
            🔍 Znaleziono{" "}
            <span className="text-primary-600 dark:text-primary-400 font-bold">
              {filteredProfiles.length}
            </span>{" "}
            specjalistów
          </div>
        </div>
        {filteredProfiles.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="Brak wyników"
            description="Nie znaleziono specjalistów spełniających wybrane kryteria. Spróbuj zmienić filtry lub rozszerzyć kryteria wyszukiwania."
            action={{
              label: "Wyczyść filtry",
              onClick: () => {
                setCategory("Wszystkie");
                setLevel("Wszystkie");
                setMinRating(0);
                setHasVca(false);
              },
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredProfiles.map((profile) => (
              <WorkerCard
                key={profile.id}
                profile={profile}
                onReview={onStartReview}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<View>("overview");
  const [reviewingWorker, setReviewingWorker] = useState<Profile | null>(null);
  const [employerJobs, setEmployerJobs] = useState<JobType[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [editingJob, setEditingJob] = useState<JobType | null>(null);

  // Load employer jobs
  useEffect(() => {
    if (user?.id && activeView === "job-board") {
      loadEmployerJobs();
    }
  }, [user?.id, activeView]);

  const loadEmployerJobs = async () => {
    if (!user?.id) return;

    setLoadingJobs(true);
    try {
      const jobs = await getJobsByCompany(user.id);
      setEmployerJobs(jobs);
    } catch (error) {
      console.error("❌ Error loading jobs:", error);
      toast.error("Nie udało się załadować ofert");
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tę ofertę?")) return;

    try {
      await deleteJob(jobId);
      toast.success("Oferta została usunięta");
      loadEmployerJobs();
    } catch (error) {
      console.error("❌ Error deleting job:", error);
      toast.error("Nie udało się usunąć oferty");
    }
  };

  const handleToggleJobStatus = async (
    jobId: string,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";

    try {
      await updateJobStatus(jobId, newStatus);
      toast.success(
        newStatus === "active" ? "Oferta opublikowana" : "Oferta wstrzymana"
      );
      loadEmployerJobs();
    } catch (error) {
      console.error("❌ Error updating job status:", error);
      toast.error("Nie udało się zmienić statusu oferty");
    }
  };

  const handleStartReview = (profile: Profile) => {
    setReviewingWorker(profile);
    setActiveView("reviewing");
  };

  const handleFinishReview = () => {
    setReviewingWorker(null);
    setActiveView("catalog");
  };

  const handleJobAdded = () => {
    toast.success("Oferta została dodana pomyślnie");
    setEditingJob(null);
    setActiveView("job-board");
    loadEmployerJobs();
  };

  const renderContent = () => {
    switch (activeView) {
      case "overview":
        return (
          <EmployerOverviewDashboard user={user} onNavigate={setActiveView} />
        );
      case "catalog":
        return <CatalogView onStartReview={handleStartReview} />;
      case "reviewing":
        if (reviewingWorker) {
          return (
            <div className="p-8 text-center">
              Recenzja pracownika: {reviewingWorker.firstName}{" "}
              {reviewingWorker.lastName}
            </div>
          );
        }
        return null;
      case "job-board":
        return (
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-8">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                      📋 Moje Ogłoszenia
                    </h1>
                    <p className="text-gray-600">
                      Zarządzaj ofertami pracy i przeglądaj aplikacje
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveView("add-job")}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105"
                  >
                    ➕ Dodaj ofertę
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Aktywne</p>
                      <p className="text-3xl font-bold text-green-600">
                        {
                          employerJobs.filter((j) => j.status === "active")
                            .length
                        }
                      </p>
                    </div>
                    <span className="text-4xl">✅</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Wstrzymane</p>
                      <p className="text-3xl font-bold text-yellow-600">
                        {
                          employerJobs.filter((j) => j.status === "paused")
                            .length
                        }
                      </p>
                    </div>
                    <span className="text-4xl">⏸️</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Obsadzone</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {
                          employerJobs.filter((j) => j.status === "filled")
                            .length
                        }
                      </p>
                    </div>
                    <span className="text-4xl">🎯</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Wszystkie</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {employerJobs.length}
                      </p>
                    </div>
                    <span className="text-4xl">📊</span>
                  </div>
                </div>
              </div>

              {/* Jobs List */}
              {loadingJobs ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Ładowanie ofert...</p>
                </div>
              ) : employerJobs.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <span className="text-6xl mb-4 block">📭</span>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Brak ofert pracy
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Dodaj swoją pierwszą ofertę, aby zacząć rekrutację!
                  </p>
                  <button
                    onClick={() => setActiveView("add-job")}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    ➕ Dodaj pierwszą ofertę
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {employerJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-800">
                              {job.title}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                job.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : job.status === "paused"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : job.status === "filled"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {job.status === "active"
                                ? "✅ Aktywna"
                                : job.status === "paused"
                                ? "⏸️ Wstrzymana"
                                : job.status === "filled"
                                ? "🎯 Obsadzona"
                                : job.status}
                            </span>
                            {job.featured && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                ⭐ Wyróżniona
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                            <span>📍 {job.city || "Brak lokalizacji"}</span>
                            <span>💼 {job.job_type}</span>
                            <span>📈 {job.experience_level}</span>
                            <span>
                              💰 {job.hourly_rate_min || "?"} -{" "}
                              {job.hourly_rate_max || "?"} zł/h
                            </span>
                            <span>🏢 {job.work_location}</span>
                          </div>

                          <p className="text-gray-700 mb-4 line-clamp-2">
                            {job.description}
                          </p>

                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-blue-600 font-medium">
                              📨 {job.applications_count || 0} aplikacji
                            </span>
                            <span className="flex items-center gap-1 text-gray-500">
                              👁️ {job.views_count || 0} wyświetleń
                            </span>
                            <span className="text-gray-400">
                              📅 Utworzono:{" "}
                              {new Date(job.created_at).toLocaleDateString(
                                "pl-PL"
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 ml-6">
                          <button
                            onClick={() =>
                              handleToggleJobStatus(job.id, job.status)
                            }
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                              job.status === "active"
                                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                          >
                            {job.status === "active"
                              ? "⏸️ Wstrzymaj"
                              : "▶️ Aktywuj"}
                          </button>

                          <button
                            onClick={() => {
                              setEditingJob(job);
                              setActiveView("add-job");
                            }}
                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-all"
                          >
                            ✏️ Edytuj
                          </button>

                          <button
                            onClick={() =>
                              alert(
                                `Aplikacje do oferty: ${job.title} (w budowie)`
                              )
                            }
                            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-200 transition-all"
                          >
                            📋 Aplikacje
                          </button>

                          <button
                            onClick={() => handleDeleteJob(job.id)}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition-all"
                          >
                            🗑️ Usuń
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case "add-job":
        return (
          <JobForm
            onSave={handleJobAdded}
            onCancel={() => setActiveView("job-board")}
          />
        );
      case "saved-workers":
        return (
          <div className="container mx-auto px-4 py-12">
            <div className="bg-gradient-glass backdrop-blur-md rounded-2xl p-8 max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-6">
                ⭐ Zapisani Pracownicy
              </h2>
              <p className="text-neutral-400">
                Lista zapisanych pracowników w przygotowaniu...
              </p>
            </div>
          </div>
        );
      case "subscription":
        return (
          <div className="container mx-auto px-4 py-12">
            <div className="bg-gradient-glass backdrop-blur-md rounded-2xl p-8 max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-6">
                💳 Zarządzanie Subskrypcją
              </h2>
              <p className="text-neutral-400">
                Panel subskrypcji w przygotowaniu...
              </p>
            </div>
          </div>
        );
      case "team":
        return (
          <div className="container mx-auto px-4 py-12">
            <div className="bg-gradient-glass backdrop-blur-md rounded-2xl p-8 max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-6">
                👥 Zarządzanie Zespołem
              </h2>
              <p className="text-neutral-400">
                Panel zespołu w przygotowaniu...
              </p>
            </div>
          </div>
        );
      default:
        return <CatalogView onStartReview={handleStartReview} />;
    }
  };

  const tabs = [
    { id: "overview", label: "Dashboard", icon: <span>🏠</span> },
    { id: "catalog", label: "Katalog Specjalistów", icon: <span>👥</span> },
    { id: "job-board", label: "Moje Ogłoszenia", icon: <span>📋</span> },
    {
      id: "saved-workers",
      label: "Zapisani",
      icon: <span>⭐</span>,
      badge: 12,
    },
    { id: "subscription", label: "Subskrypcja", icon: <span>💳</span> },
  ];

  const getBreadcrumbs = () => {
    const viewLabels: Record<View, { label: string; icon: string }> = {
      overview: { label: "Dashboard", icon: "🏠" },
      catalog: { label: "Katalog Specjalistów", icon: "👥" },
      reviewing: { label: "Dodawanie Opinii", icon: "⭐" },
      "job-board": { label: "Tablica Ogłoszeń", icon: "📋" },
      "add-job": { label: "Nowe Ogłoszenie", icon: "➕" },
      "saved-workers": { label: "Zapisani Pracownicy", icon: "⭐" },
      subscription: { label: "Subskrypcja", icon: "💳" },
      team: { label: "Zespół", icon: "👥" },
    };

    return [
      { label: "Panel Firmy", icon: "🏬" },
      {
        label: viewLabels[activeView].label,
        icon: viewLabels[activeView].icon,
        isActive: true,
      },
    ];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <DashboardHeader
          title="Panel Firmy"
          subtitle="Znajdź zweryfikowanych specjalistów i zarządzaj zleceniami"
          icon="🏬"
          breadcrumbs={getBreadcrumbs()}
        />

        <TabNavigation
          tabs={tabs}
          activeTab={
            activeView === "reviewing"
              ? "catalog"
              : activeView === "add-job"
              ? "job-board"
              : activeView === "team"
              ? "overview"
              : activeView
          }
          onTabChange={(tabId) => setActiveView(tabId as View)}
        />
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="animate-fade-in">{renderContent()}</div>
      </div>
    </div>
  );
};

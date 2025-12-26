/**
 * WorkerPublicProfilePageModern - Nowoczesny profil pracownika
 * Wzorowany na designie Mark de Jong
 */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import {
  ModernPublicProfile,
  ProfileStatCard,
  SkillTag,
  PortfolioImage,
} from "../../components/ModernPublicProfile";
import { ReviewWorkerModal } from "../../src/components/employer/ReviewWorkerModal";
import { InviteToTeamModal } from "../../src/modules/team-system/components/InviteToTeamModal";
import { Star, MessageSquare, Calendar } from "../../components/icons";

// ============ INTERFACES ============
interface Worker {
  id: string;
  profile_id: string;
  full_name: string;
  email: string;
  phone?: string;
  city?: string;
  postal_code?: string;
  country: string;
  bio?: string;
  specialization?: string;
  skills: string[];
  languages: string[];
  hourly_rate?: number;
  years_experience: number;
  availability_status: "available" | "busy" | "unavailable";
  avatar_url?: string;
  cover_image_url?: string;
  portfolio_images?: string[];
  linkedin_url?: string;
  website?: string;
  rating: number;
  rating_count: number;
  completed_jobs: number;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Team/Duo fields
  worker_type?:
    | "individual"
    | "team_leader"
    | "duo_partner"
    | "helper_available";
  team_size?: number;
  team_description?: string;
  team_hourly_rate?: number;
  is_on_demand_available?: boolean;
  // Google Reviews
  google_maps_url?: string;
  google_place_id?: string;
  google_rating?: number;
  google_review_count?: number;
}

interface WorkerReview {
  id: string;
  worker_id: string;
  employer_id: string;
  employer_name: string;
  employer_avatar?: string;
  rating: number;
  comment: string;
  quality_rating?: number;
  punctuality_rating?: number;
  communication_rating?: number;
  safety_rating?: number;
  would_recommend?: boolean;
  created_at: string;
}

interface WorkerPublicProfilePageModernProps {
  workerId?: string;
  embedded?: boolean;
}

// ============ MAIN COMPONENT ============
export default function WorkerPublicProfilePageModern({
  workerId,
  embedded = false,
}: WorkerPublicProfilePageModernProps) {
  const { id: urlId } = useParams<{ id: string }>();
  const id = workerId || urlId;
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [worker, setWorker] = useState<Worker | null>(null);
  const [reviews, setReviews] = useState<WorkerReview[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isInviteToTeamModalOpen, setIsInviteToTeamModalOpen] = useState(false);
  const [employerId, setEmployerId] = useState<string | null>(null);
  const [cleaningCompanyId, setCleaningCompanyId] = useState<string | null>(
    null
  );
  const [hasReviewed, setHasReviewed] = useState(false);

  // Load data
  useEffect(() => {
    if (id) loadWorkerData();
  }, [id]);

  // Load employer/cleaning company ID
  useEffect(() => {
    const loadReviewerIds = async () => {
      if (!user) return;

      if (user.role === "employer") {
        const { data } = await supabase
          .from("employers")
          .select("id")
          .eq("profile_id", user.id)
          .maybeSingle();
        if (data) setEmployerId(data.id);
      }

      if (user.role === "cleaning_company") {
        const { data } = await supabase
          .from("cleaning_companies")
          .select("id")
          .eq("profile_id", user.id)
          .maybeSingle();
        if (data) setCleaningCompanyId(data.id);
      }
    };
    loadReviewerIds();
  }, [user]);

  const loadWorkerData = async () => {
    if (!id) return;
    setLoading(true);

    try {
      // Increment profile views
      await (supabase as any).rpc("increment_worker_profile_views", {
        worker_id: id,
      });

      // Load worker with profile
      let { data: workerData, error } = await supabase
        .from("workers")
        .select(`*, profiles!workers_profile_id_fkey(full_name, email, phone)`)
        .eq("id", id)
        .single();

      // Try by profile_id if not found
      if (error?.code === "PGRST116") {
        const result = await supabase
          .from("workers")
          .select(
            `*, profiles!workers_profile_id_fkey(full_name, email, phone)`
          )
          .eq("profile_id", id)
          .single();
        workerData = result.data;
        error = result.error;
      }

      if (error) throw error;
      if (!workerData) throw new Error("Worker not found");

      // Cast to any to avoid TypeScript issues with database types
      const w = workerData as any;
      const profile = w.profiles;

      setWorker({
        id: w.id,
        profile_id: w.profile_id || "",
        full_name: profile?.full_name || w.full_name || "Nieznany",
        email: profile?.email || w.email || "",
        phone: profile?.phone || w.phone,
        city: w.city || w.location_city || undefined,
        postal_code: w.postal_code || w.location_postal_code || undefined,
        country: w.country || w.location_country || "NL",
        bio: w.bio || undefined,
        specialization: w.specialization || undefined,
        skills: w.skills || [],
        languages: w.languages || [],
        hourly_rate: w.hourly_rate || undefined,
        years_experience: w.years_experience || w.experience_years || 0,
        availability_status: w.availability_status || "available",
        avatar_url: w.avatar_url || undefined,
        cover_image_url: w.cover_image_url || undefined,
        portfolio_images: Array.isArray(w.portfolio_images)
          ? w.portfolio_images
          : [],
        linkedin_url: w.linkedin_url || undefined,
        website: w.website || undefined,
        rating: w.rating || 0,
        rating_count: w.rating_count || 0,
        completed_jobs: w.completed_jobs || w.total_jobs_completed || 0,
        is_verified: w.is_verified || w.verified || false,
        is_active: w.is_active !== false,
        created_at: w.created_at || "",
        updated_at: w.updated_at || "",
        // Team/Duo fields
        worker_type: w.worker_type || "individual",
        team_size: w.team_size || 1,
        team_description: w.team_description || undefined,
        team_hourly_rate: w.team_hourly_rate || undefined,
        is_on_demand_available: w.is_on_demand_available || false,
        // Google Reviews
        google_maps_url: w.google_maps_url || undefined,
        google_place_id: w.google_place_id || undefined,
        google_rating: w.google_rating || undefined,
        google_review_count: w.google_review_count || undefined,
      });

      // Load reviews (use any to bypass type checking)
      const { data: reviewsData } = await (supabase as any)
        .from("reviews")
        .select(
          `
          id, rating, comment, created_at, quality_rating, punctuality_rating,
          communication_rating, safety_rating, would_recommend,
          employers!reviews_employer_id_fkey(id, profiles!employers_profile_id_fkey(full_name, avatar_url)),
          cleaning_companies!reviews_cleaning_company_id_fkey(id, profiles!cleaning_companies_profile_id_fkey(full_name, avatar_url))
        `
        )
        .eq("worker_id", workerData.id)
        .order("created_at", { ascending: false });

      if (reviewsData) {
        setReviews(
          reviewsData.map((r: any) => ({
            id: r.id,
            worker_id: workerData.id,
            employer_id: r.employers?.id || r.cleaning_companies?.id || "",
            employer_name:
              r.employers?.profiles?.full_name ||
              r.cleaning_companies?.profiles?.full_name ||
              "Anonimowy",
            employer_avatar:
              r.employers?.profiles?.avatar_url ||
              r.cleaning_companies?.profiles?.avatar_url,
            rating: r.rating,
            comment: r.comment,
            quality_rating: r.quality_rating,
            punctuality_rating: r.punctuality_rating,
            communication_rating: r.communication_rating,
            safety_rating: r.safety_rating,
            would_recommend: r.would_recommend,
            created_at: r.created_at,
          }))
        );
      }

      // Check if user already reviewed
      if (user) {
        const { data: existingReview } = await (supabase as any)
          .from("reviews")
          .select("id")
          .eq("worker_id", workerData.id)
          .eq("employer_id", user.id)
          .maybeSingle();

        setHasReviewed(!!existingReview);
      }
    } catch (err) {
      console.error("Error loading worker:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSuccess = () => {
    loadWorkerData();
  };

  if (!worker && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Pracownik nie znaleziony
          </h2>
          <p className="text-slate-600 mb-6">
            Ten profil nie istnieje lub został usunięty
          </p>
          <button
            onClick={() => navigate("/workers")}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            Wróć do wyszukiwarki
          </button>
        </div>
      </div>
    );
  }

  // ===== PREPARE DATA FOR MODERN PROFILE =====
  const stats: ProfileStatCard[] = worker
    ? [
        { value: worker.completed_jobs, label: "KLUSSEN" },
        { value: worker.rating.toFixed(1), label: "BEOORDELINGEN" },
        { value: worker.years_experience, label: "JAREN ERVARING" },
      ]
    : [];

  const skills: SkillTag[] = worker?.skills?.map((s) => ({ name: s })) || [];

  const portfolio: PortfolioImage[] =
    worker?.portfolio_images?.map((url, i) => ({
      url,
      title: `Portfolio ${i + 1}`,
    })) || [];

  // ===== CUSTOM TABS =====

  // About Tab Content - Informacje zawodowe
  const AboutTabContent = () => (
    <div className="space-y-6">
      {/* Bio */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-3">O mnie</h3>
        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
          {worker?.bio || "Pracownik nie dodał jeszcze opisu"}
        </p>
      </div>

      {/* Skills */}
      {worker?.skills && worker.skills.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">
            🎯 Umiejętności
          </h3>
          <div className="flex flex-wrap gap-2">
            {worker.skills.map((skill) => (
              <span
                key={skill}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Professional Info */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">
          Informacje zawodowe
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="text-sm text-slate-500 mb-1">
              Lata doświadczenia
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {worker?.years_experience || 0}
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="text-sm text-slate-500 mb-1">
              Zrealizowane projekty
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {worker?.completed_jobs || 0}
            </div>
          </div>
          {worker?.hourly_rate && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="text-sm text-slate-500 mb-1">
                Stawka godzinowa
              </div>
              <div className="text-2xl font-bold text-blue-600">
                €{worker.hourly_rate}
              </div>
            </div>
          )}
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="text-sm text-slate-500 mb-1">Status</div>
            <div
              className={`text-lg font-bold ${
                worker?.availability_status === "available"
                  ? "text-green-600"
                  : worker?.availability_status === "busy"
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {worker?.availability_status === "available"
                ? "Dostępny"
                : worker?.availability_status === "busy"
                ? "Zajęty"
                : "Niedostępny"}
            </div>
          </div>
        </div>
      </div>

      {/* TEAM/DUO Section - only shown for team workers */}
      {worker?.worker_type && worker.worker_type !== "individual" && (
        <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-xl p-6 border-2 border-orange-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white text-2xl">
              {worker.worker_type === "team_leader"
                ? "👥"
                : worker.worker_type === "duo_partner"
                ? "🤝"
                : "🆘"}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {worker.worker_type === "team_leader"
                  ? "🚀 Pracuję z Zespołem"
                  : worker.worker_type === "duo_partner"
                  ? "🤝 Pracuję w Duo"
                  : "🆘 Dostępny jako Helper"}
              </h3>
              <p className="text-sm text-slate-600">
                {worker.worker_type === "team_leader"
                  ? `Zespół ${
                      worker.team_size || 2
                    } osób do większych projektów`
                  : worker.worker_type === "duo_partner"
                  ? "Partnerstwo 50/50 - razem silniejsi"
                  : "Junior/asystent - pomoc przy projektach"}
              </p>
            </div>
          </div>

          {/* Team Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {(worker.worker_type === "team_leader" ||
              worker.worker_type === "duo_partner") && (
              <>
                <div className="bg-white/80 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {worker.team_size || 2}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Osób w zespole
                  </div>
                </div>
                {worker.team_hourly_rate && (
                  <div className="bg-white/80 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">
                      €{worker.team_hourly_rate}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Stawka zespołu/h
                    </div>
                  </div>
                )}
                {worker.hourly_rate && worker.team_hourly_rate && (
                  <div className="bg-white/80 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      €
                      {Math.round(
                        worker.team_hourly_rate / (worker.team_size || 2)
                      )}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Na osobę/h
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Team Description */}
          {worker.team_description && (
            <div className="bg-white/60 rounded-xl p-4">
              <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <span>📝</span> O naszym zespole
              </h4>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                {worker.team_description}
              </p>
            </div>
          )}

          {/* Team Benefits */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span className="text-green-500">✓</span>
              <span>Większe projekty</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span className="text-green-500">✓</span>
              <span>Szybsza realizacja</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span className="text-green-500">✓</span>
              <span>Różne specjalizacje</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span className="text-green-500">✓</span>
              <span>Jedna faktura</span>
            </div>
          </div>
        </div>
      )}

      {/* On-Demand Badge */}
      {worker?.is_on_demand_available && (
        <div className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="text-3xl">⚡</div>
            <div>
              <h4 className="font-bold text-lg">
                Springer - Dostępny na Żądanie!
              </h4>
              <p className="text-sm opacity-90">
                Pilne zlecenia (1-2 dni) • Często wyższe stawki (+20-30%)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Google Reviews Section */}
      {worker?.google_maps_url && (
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-blue-500"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
              </svg>
              Opinie Google
            </h3>
            {worker.google_rating && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-lg ${
                        star <= Math.round(worker.google_rating!)
                          ? "text-yellow-400"
                          : "text-slate-200"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="font-bold text-slate-800">
                  {worker.google_rating.toFixed(1)}
                </span>
                {worker.google_review_count && (
                  <span className="text-sm text-slate-500">
                    ({worker.google_review_count} opinii)
                  </span>
                )}
              </div>
            )}
          </div>
          <a
            href={worker.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition text-sm font-medium"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            Zobacz opinie na Google Maps
          </a>
        </div>
      )}

      {/* Languages */}
      {worker?.languages && worker.languages.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">🌍 Języki</h3>
          <div className="flex flex-wrap gap-2">
            {worker.languages.map((lang) => (
              <span
                key={lang}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Availability Schedule */}
      {worker && (worker as any).availability && (
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Dni dostępności
          </h3>
          {(worker as any).preferred_days_per_week && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
              📅 Preferowana liczba dni/tydzień:{" "}
              <strong>{(worker as any).preferred_days_per_week}</strong>
            </div>
          )}
          <div className="grid grid-cols-7 gap-2 text-center">
            {[
              { key: "monday", label: "Pn" },
              { key: "tuesday", label: "Wt" },
              { key: "wednesday", label: "Śr" },
              { key: "thursday", label: "Cz" },
              { key: "friday", label: "Pt" },
              { key: "saturday", label: "So" },
              { key: "sunday", label: "Nd" },
            ].map((day) => {
              const isAvailable = (worker as any).availability[day.key];
              return (
                <div
                  key={day.key}
                  className={`p-3 rounded-xl ${
                    isAvailable
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <div className="font-bold text-sm">{day.label}</div>
                  <div className="text-lg">{isAvailable ? "✓" : "✗"}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Own Vehicle / Tools */}
      {worker &&
        ((worker as any).own_vehicle ||
          ((worker as any).own_tools &&
            (worker as any).own_tools.length > 0)) && (
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              🛠️ Wyposażenie
            </h3>
            <div className="space-y-3">
              {(worker as any).own_vehicle && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="text-xl">🚗</div>
                  <div>
                    <p className="font-medium text-green-800">Własny pojazd</p>
                    {(worker as any).vehicle_type && (
                      <p className="text-sm text-green-600">
                        {(worker as any).vehicle_type}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {(worker as any).own_tools &&
                (worker as any).own_tools.length > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-800 mb-2">
                      🧰 Własne narzędzia:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(worker as any).own_tools.map((tool: string) => (
                        <span
                          key={tool}
                          className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}
    </div>
  );

  // Portfolio Tab Content
  const PortfolioTabContent = () => (
    <div className="space-y-4">
      {portfolio.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {portfolio.map((img, idx) => (
            <div
              key={idx}
              className="aspect-square rounded-xl overflow-hidden bg-slate-100"
            >
              <img
                src={img.url}
                alt={img.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <div className="text-4xl mb-4">📷</div>
          <p className="text-slate-500">Brak zdjęć portfolio</p>
        </div>
      )}
    </div>
  );

  const customTabs = [
    {
      id: "about",
      label: "O mnie",
      icon: "📋",
      content: <AboutTabContent />,
    },
    {
      id: "portfolio",
      label: `Portfolio (${portfolio.length})`,
      icon: "📷",
      content: <PortfolioTabContent />,
    },
    {
      id: "reviews",
      label: `Opinie (${reviews.length})`,
      icon: "⭐",
      content: (
        <ReviewsTabContent
          reviews={reviews}
          worker={worker!}
          onOpenReview={() => setIsReviewModalOpen(true)}
        />
      ),
    },
    {
      id: "contact",
      label: "Kontakt",
      icon: "📞",
      content: (
        <ContactTabContent
          worker={worker!}
          user={user}
          onOpenReview={() => setIsReviewModalOpen(true)}
          hasReviewed={hasReviewed}
          employerId={employerId}
          cleaningCompanyId={cleaningCompanyId}
        />
      ),
    },
  ];

  // ===== SIDEBAR EXTRA =====
  const sidebarExtra = (
    <>
      {/* Invite to Team Card */}
      {user &&
        (user.role === "employer" || user.role === "cleaning_company") &&
        worker && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6">
            <h3 className="text-sm font-bold text-emerald-800 mb-2">
              👥 Zaproś do ekipy
            </h3>
            <p className="text-xs text-emerald-600 mb-4">
              Dodaj {worker.full_name} do swojego zespołu projektowego
            </p>
            <button
              onClick={() => setIsInviteToTeamModalOpen(true)}
              className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Zaproś
            </button>
          </div>
        )}

      {/* Review Card */}
      {user && (employerId || cleaningCompanyId) && worker && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border border-amber-200 p-6">
          <h3 className="text-sm font-bold text-amber-800 mb-2">
            ⭐ Wystaw opinię
          </h3>
          <p className="text-xs text-amber-600 mb-4">
            Podziel się swoim doświadczeniem ze współpracy
          </p>
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="w-full py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors"
          >
            Oceń pracownika
          </button>
        </div>
      )}

      {/* Availability Card */}
      {worker && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
            Status
          </h3>
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium ${
              worker.availability_status === "available"
                ? "bg-green-100 text-green-700"
                : worker.availability_status === "busy"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                worker.availability_status === "available"
                  ? "bg-green-500"
                  : worker.availability_status === "busy"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            ></span>
            {worker.availability_status === "available"
              ? "Dostępny"
              : worker.availability_status === "busy"
              ? "Zajęty"
              : "Niedostępny"}
          </div>
          {worker.hourly_rate && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-2xl font-black text-slate-800">
                €{worker.hourly_rate}
              </div>
              <div className="text-xs text-slate-500 uppercase">za godzinę</div>
            </div>
          )}
        </div>
      )}

      {/* 🏆 ZZP CERTIFICATE BADGE */}
      {worker &&
        (worker as any).zzp_certificate_issued &&
        (worker as any).zzp_certificate_number && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-400 p-5 shadow-md">
            <div className="flex items-start gap-3">
              <div className="text-3xl">🏆</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-bold text-gray-900">
                    Certyfikat Premium ZZP
                  </h3>
                  {(worker as any).certificate_status === "active" && (
                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      AKTYWNY
                    </span>
                  )}
                  {(worker as any).certificate_status === "expired" && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      WYGASŁ
                    </span>
                  )}
                  {(worker as any).certificate_status === "revoked" && (
                    <span className="bg-gray-800 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      COFNIĘTY
                    </span>
                  )}
                </div>
                <code className="text-xs font-mono text-yellow-800 bg-yellow-100 px-2 py-1 rounded">
                  {(worker as any).zzp_certificate_number}
                </code>
                {(worker as any).certificate_issued_at && (
                  <p className="text-xs text-gray-500 mt-2">
                    Wydany:{" "}
                    {new Date(
                      (worker as any).certificate_issued_at
                    ).toLocaleDateString("pl-PL")}
                    {(worker as any).zzp_certificate_expires_at && (
                      <>
                        {" "}
                        · Ważny do:{" "}
                        {new Date(
                          (worker as any).zzp_certificate_expires_at
                        ).toLocaleDateString("pl-PL")}
                      </>
                    )}
                  </p>
                )}
                {/* Approved categories */}
                {(worker as any).approved_categories &&
                  (worker as any).approved_categories.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 font-semibold mb-1">
                        ✅ Zatwierdzone specjalizacje:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {(worker as any).approved_categories.map(
                          (cat: string) => (
                            <span
                              key={cat}
                              className="bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-medium"
                            >
                              {cat}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

      {/* 🛠️ OWN VEHICLE / TOOLS */}
      {worker &&
        ((worker as any).own_vehicle ||
          ((worker as any).own_tools &&
            (worker as any).own_tools.length > 0)) && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              🛠️ Wyposażenie
            </h3>
            <div className="space-y-3">
              {(worker as any).own_vehicle && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                  <div className="text-xl">🚗</div>
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Własny pojazd
                    </p>
                    {(worker as any).vehicle_type && (
                      <p className="text-xs text-green-600">
                        {(worker as any).vehicle_type}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {(worker as any).own_tools &&
                (worker as any).own_tools.length > 0 && (
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <p className="text-sm font-medium text-blue-800 mb-2">
                      🧰 Własne narzędzia:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(worker as any).own_tools.map((tool: string) => (
                        <span
                          key={tool}
                          className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

      {/* 📅 AVAILABILITY SCHEDULE */}
      {worker && (worker as any).availability && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
            📅 Dni dostępności
          </h3>
          {(worker as any).preferred_days_per_week && (
            <div className="mb-3 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
              Preferowane dni/tydzień:{" "}
              <strong>{(worker as any).preferred_days_per_week}</strong>
            </div>
          )}
          <div className="grid grid-cols-7 gap-1 text-center">
            {[
              { key: "monday", label: "Pn" },
              { key: "tuesday", label: "Wt" },
              { key: "wednesday", label: "Śr" },
              { key: "thursday", label: "Cz" },
              { key: "friday", label: "Pt" },
              { key: "saturday", label: "So" },
              { key: "sunday", label: "Nd" },
            ].map((day) => {
              const isAvailable = (worker as any).availability[day.key];
              return (
                <div
                  key={day.key}
                  className={`p-2 rounded-lg text-xs font-bold ${
                    isAvailable
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <div>{day.label}</div>
                  <div className="text-sm mt-0.5">
                    {isAvailable ? "✓" : "✗"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <ModernPublicProfile
        name={worker?.full_name || ""}
        role={worker?.specialization || "ZZP Pracownik"}
        roleType="worker"
        avatarUrl={worker?.avatar_url}
        coverImageUrl={worker?.cover_image_url}
        isVerified={worker?.is_verified}
        badge="PRACOWNIK"
        badgeColor="bg-blue-500 text-white"
        stats={stats}
        bio={worker?.bio}
        details={{
          location: worker?.city,
          country: worker?.country,
          website: worker?.website,
          email: worker?.email,
          phone: worker?.phone,
        }}
        skills={skills}
        languages={worker?.languages || []}
        portfolio={portfolio}
        rating={worker?.rating}
        ratingCount={worker?.rating_count}
        yearsExperience={worker?.years_experience}
        completedProjects={worker?.completed_jobs}
        onContact={() => (window.location.href = `mailto:${worker?.email}`)}
        onBack={embedded ? undefined : () => navigate("/workers")}
        backLabel="Wróć do wyszukiwarki"
        customTabs={customTabs}
        sidebarExtra={sidebarExtra}
        showInviteButton={false}
        loading={loading}
      />

      {/* Modals */}
      {worker && user && (employerId || cleaningCompanyId) && (
        <ReviewWorkerModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          workerId={worker.id}
          workerName={worker.full_name}
          employerId={employerId || undefined}
          cleaningCompanyId={cleaningCompanyId || undefined}
          onSuccess={handleReviewSuccess}
        />
      )}

      {worker && user && employerId && (
        <InviteToTeamModal
          isOpen={isInviteToTeamModalOpen}
          onClose={() => setIsInviteToTeamModalOpen(false)}
          employerId={employerId}
          inviterProfileId={user.id}
          inviteeId={worker.id}
          inviteeType="worker"
          inviteeName={worker.full_name}
          inviteeAvatar={worker.avatar_url}
        />
      )}
    </>
  );
}

// ============ SUB-COMPONENTS ============

function ReviewsTabContent({
  reviews,
  worker,
  onOpenReview,
}: {
  reviews: WorkerReview[];
  worker: Worker;
  onOpenReview: () => void;
}) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-bold text-slate-700 mb-2">Brak opinii</h3>
        <p className="text-slate-500 mb-6">
          Ten pracownik nie ma jeszcze opinii
        </p>
        <button
          onClick={onOpenReview}
          className="px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600"
        >
          Wystaw pierwszą opinię
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50 rounded-xl">
        <div className="text-center">
          <div className="text-4xl font-black text-slate-800">
            {worker.rating.toFixed(1)}
          </div>
          <div className="flex justify-center mt-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(worker.rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-300"
                }`}
              />
            ))}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {reviews.length} opinii
          </div>
        </div>

        {/* Detailed ratings */}
        {(() => {
          const qualityAvg =
            reviews
              .filter((r) => r.quality_rating)
              .reduce((sum, r) => sum + (r.quality_rating || 0), 0) /
            reviews.filter((r) => r.quality_rating).length;
          const punctualityAvg =
            reviews
              .filter((r) => r.punctuality_rating)
              .reduce((sum, r) => sum + (r.punctuality_rating || 0), 0) /
            reviews.filter((r) => r.punctuality_rating).length;
          const communicationAvg =
            reviews
              .filter((r) => r.communication_rating)
              .reduce((sum, r) => sum + (r.communication_rating || 0), 0) /
            reviews.filter((r) => r.communication_rating).length;
          const safetyAvg =
            reviews
              .filter((r) => r.safety_rating)
              .reduce((sum, r) => sum + (r.safety_rating || 0), 0) /
            reviews.filter((r) => r.safety_rating).length;

          return (
            <>
              {!isNaN(qualityAvg) && (
                <div className="text-center p-3 bg-white rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">
                    {qualityAvg.toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-500">Jakość</div>
                </div>
              )}
              {!isNaN(punctualityAvg) && (
                <div className="text-center p-3 bg-white rounded-xl">
                  <div className="text-2xl font-bold text-green-600">
                    {punctualityAvg.toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-500">Punktualność</div>
                </div>
              )}
              {!isNaN(communicationAvg) && (
                <div className="text-center p-3 bg-white rounded-xl">
                  <div className="text-2xl font-bold text-purple-600">
                    {communicationAvg.toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-500">Komunikacja</div>
                </div>
              )}
              {!isNaN(safetyAvg) && (
                <div className="text-center p-3 bg-white rounded-xl">
                  <div className="text-2xl font-bold text-orange-600">
                    {safetyAvg.toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-500">BHP</div>
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="p-5 bg-white rounded-xl shadow-sm border border-slate-200"
          >
            <div className="flex items-start gap-4">
              {review.employer_avatar ? (
                <img
                  src={review.employer_avatar}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                  {review.employer_name.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800">
                        {review.employer_name}
                      </h4>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-slate-500">
                      {new Date(review.created_at).toLocaleDateString("pl-PL")}
                    </span>
                  </div>

                  {review.would_recommend && (
                    <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                      👍 Poleca
                    </span>
                  )}
                </div>

                {review.comment && (
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {review.comment}
                  </p>
                )}

                {/* Detailed Ratings */}
                {(review.quality_rating ||
                  review.punctuality_rating ||
                  review.communication_rating ||
                  review.safety_rating) && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 mt-4 border-t border-slate-100">
                    {review.quality_rating && (
                      <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">
                          Jakość
                        </div>
                        <div className="flex gap-0.5 justify-center">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= (review.quality_rating || 0)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {review.punctuality_rating && (
                      <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">
                          Punktualność
                        </div>
                        <div className="flex gap-0.5 justify-center">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= (review.punctuality_rating || 0)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {review.communication_rating && (
                      <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">
                          Komunikacja
                        </div>
                        <div className="flex gap-0.5 justify-center">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= (review.communication_rating || 0)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {review.safety_rating && (
                      <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">BHP</div>
                        <div className="flex gap-0.5 justify-center">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= (review.safety_rating || 0)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactTabContent({
  worker,
  user,
  onOpenReview,
  hasReviewed,
  employerId,
  cleaningCompanyId,
}: {
  worker: Worker;
  user: any;
  onOpenReview: () => void;
  hasReviewed: boolean;
  employerId?: string | null;
  cleaningCompanyId?: string | null;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Contact Info */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          Dane kontaktowe
        </h3>

        <div className="space-y-4">
          <div>
            <div className="text-xs text-slate-500 mb-1">Imię i nazwisko</div>
            <div className="text-lg font-semibold text-slate-900">
              {worker.full_name}
            </div>
          </div>

          {worker.specialization && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Specjalizacja</div>
              <div className="text-slate-900">{worker.specialization}</div>
            </div>
          )}

          {worker.email && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Email</div>
              <a
                href={`mailto:${worker.email}`}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <span className="text-lg">✉️</span>
                {worker.email}
              </a>
            </div>
          )}

          {worker.phone && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Telefon</div>
              <a
                href={`tel:${worker.phone}`}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <span className="text-lg">📱</span>
                {worker.phone}
              </a>
            </div>
          )}

          {(worker.city || worker.country) && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Lokalizacja</div>
              <div className="flex items-start gap-2 text-slate-900">
                <span className="text-lg">📍</span>
                <span>
                  {worker.city && <span>{worker.city}</span>}
                  {worker.city && worker.country && <span>, </span>}
                  {worker.country && <span>{worker.country}</span>}
                </span>
              </div>
            </div>
          )}

          {worker.website && (
            <div>
              <div className="text-xs text-slate-500 mb-1">
                Strona internetowa
              </div>
              <a
                href={worker.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <span className="text-lg">🌐</span>
                {worker.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}

          {worker.linkedin_url && (
            <div>
              <div className="text-xs text-slate-500 mb-1">LinkedIn</div>
              <a
                href={worker.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <span className="text-lg">💼</span>
                Zobacz profil LinkedIn
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">
          Skontaktuj się
        </h3>
        <p className="text-sm text-slate-600 mb-6">
          Zainteresowany współpracą z {worker.full_name}? Skontaktuj się przez
          platformę:
        </p>

        <div className="space-y-3">
          {worker.email && (
            <a
              href={`mailto:${worker.email}`}
              className="block w-full bg-blue-600 text-white text-center py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
            >
              📨 Wyślij wiadomość
            </a>
          )}

          <button
            onClick={onOpenReview}
            disabled={
              !user || (!employerId && !cleaningCompanyId) || hasReviewed
            }
            className={`block w-full text-center py-3 rounded-xl font-medium transition-colors shadow-sm ${
              !user || (!employerId && !cleaningCompanyId) || hasReviewed
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-amber-500 text-white hover:bg-amber-600"
            }`}
          >
            <Star className="w-5 h-5 inline mr-2" />
            {hasReviewed ? "Już wystawiłeś opinię" : "Wystaw opinię"}
          </button>
        </div>

        {/* Stats */}
        <div className="mt-6 pt-6 border-t border-blue-200">
          <div className="grid grid-cols-2 gap-4">
            {worker.years_experience !== undefined &&
              worker.years_experience > 0 && (
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-slate-900">
                    {worker.years_experience}
                  </div>
                  <div className="text-xs text-slate-600">
                    lat doświadczenia
                  </div>
                </div>
              )}
            {worker.completed_jobs !== undefined &&
              worker.completed_jobs > 0 && (
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <span className="text-2xl block mb-2">✅</span>
                  <div className="text-2xl font-bold text-slate-900">
                    {worker.completed_jobs}
                  </div>
                  <div className="text-xs text-slate-600">
                    ukończonych zleceń
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Contact shortcuts */}
        {(worker.phone || worker.email) && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="text-xs text-slate-500 font-medium mb-3">
              LUB SKONTAKTUJ SIĘ BEZPOŚREDNIO
            </div>
            <div className="space-y-2">
              {worker.phone && (
                <a
                  href={`tel:${worker.phone}`}
                  className="flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600"
                >
                  <span>📱</span>
                  {worker.phone}
                </a>
              )}
              {worker.email && (
                <a
                  href={`mailto:${worker.email}`}
                  className="flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600"
                >
                  <span>✉️</span>
                  {worker.email}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

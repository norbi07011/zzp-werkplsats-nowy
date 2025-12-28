import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Modal } from "../../components/Modal";
import { ReviewWorkerModal } from "../../src/components/employer/ReviewWorkerModal";
import { LocationCard } from "../../components/LocationCard";
import { Animated3DProfileBackground } from "../../components/Animated3DProfileBackground";
import { InviteToTeamModal } from "../../src/modules/team-system/components/InviteToTeamModal";
import {
  Star,
  MapPin,
  Mail,
  Phone,
  Globe,
  Briefcase,
  Award,
  Languages,
  Calendar,
  MessageSquare,
  CheckCircleIcon,
  ArrowLeft,
  ExternalLink,
} from "../../components/icons";

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

interface WorkerProject {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  completion_date: string;
}

interface WorkerPublicProfilePageProps {
  workerId?: string; // Optional prop - if provided, use this instead of URL param
  embedded?: boolean; // If true, hide back button (for dashboard embedding)
}

export default function WorkerPublicProfilePage({
  workerId,
  embedded = false,
}: WorkerPublicProfilePageProps) {
  const { id: urlId } = useParams<{ id: string }>();
  const id = workerId || urlId; // Use prop if provided, otherwise URL param
  const navigate = useNavigate();
  const { user } = useAuth();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [reviews, setReviews] = useState<WorkerReview[]>([]);
  const [projects, setProjects] = useState<WorkerProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "about" | "portfolio" | "reviews" | "contact"
  >("about");

  // Contact & Review modals
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isInviteToTeamModalOpen, setIsInviteToTeamModalOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [employerId, setEmployerId] = useState<string | null>(null);
  const [cleaningCompanyId, setCleaningCompanyId] = useState<string | null>(
    null
  );
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string>("");

  const openLightbox = (imageUrl: string) => {
    setLightboxImage(imageUrl);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxImage("");
  };

  useEffect(() => {
    if (id) {
      loadWorkerData();
    }
  }, [id]);

  // Load employer/cleaning company ID if user is employer OR cleaning_company
  useEffect(() => {
    const loadReviewerIds = async () => {
      if (user && user.role === "employer") {
        try {
          const { data, error } = await supabase
            .from("employers")
            .select("id")
            .eq("profile_id", user.id)
            .maybeSingle();

          if (!error && data) {
            console.log(
              "✅ EMPLOYER ID LOADED:",
              data.id,
              "for user:",
              user.id
            );
            setEmployerId(data.id);
          } else {
            console.warn("⚠️ No employer found for user:", user.id, error);
          }
        } catch (err) {
          console.error("❌ Error loading employer ID:", err);
        }
      } else if (user && user.role === "cleaning_company") {
        // NEW: Support cleaning_company reviews
        try {
          const { data, error } = await supabase
            .from("cleaning_companies")
            .select("id")
            .eq("profile_id", user.id)
            .maybeSingle();

          if (!error && data) {
            console.log(
              "✅ CLEANING COMPANY ID LOADED:",
              data.id,
              "for user:",
              user.id
            );
            setCleaningCompanyId(data.id);
          } else {
            console.warn(
              "⚠️ No cleaning company found for user:",
              user.id,
              error
            );
          }
        } catch (err) {
          console.error("❌ Error loading cleaning company ID:", err);
        }
      } else {
        console.log(
          "ℹ️ User role:",
          user?.role,
          "(not employer or cleaning_company)"
        );
      }
    };

    loadReviewerIds();
  }, [user]);

  const handleOpenContact = () => {
    if (!user) {
      alert("Zaloguj się aby wysłać wiadomość do pracownika");
      return;
    }
    setIsContactModalOpen(true);
  };

  const handleSendContact = async () => {
    if (!contactSubject.trim() || !contactMessage.trim()) {
      alert("Proszę wypełnić wszystkie pola");
      return;
    }

    if (!user?.id || !worker?.profile_id) {
      alert("❌ Błąd: brak danych użytkownika lub pracownika");
      return;
    }

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: worker.profile_id,
        subject: contactSubject,
        content: contactMessage,
        is_read: false,
      });

      if (error) throw error;

      alert(`✅ Wiadomość wysłana do ${worker.full_name}!`);
      setIsContactModalOpen(false);
      setContactSubject("");
      setContactMessage("");
    } catch (err: any) {
      console.error("Error sending message:", err);
      alert(`❌ Nie udało się wysłać wiadomości: ${err.message}`);
    }
  };

  const handleOpenReview = async () => {
    if (!user) {
      alert("Zaloguj się aby wystawić opinię");
      return;
    }

    console.log(
      "🔍 handleOpenReview - employerId:",
      employerId,
      "cleaningCompanyId:",
      cleaningCompanyId,
      "worker?.id:",
      worker?.id,
      "user.role:",
      user.role
    );

    // Check if at least one reviewer ID exists
    if ((!employerId && !cleaningCompanyId) || !worker?.id) {
      alert(
        `⚠️ Ładowanie danych... Spróbuj ponownie za chwilę.\n\n` +
          `Debug info:\n` +
          `- Employer ID: ${employerId || "BRAK"}\n` +
          `- Cleaning Company ID: ${cleaningCompanyId || "BRAK"}\n` +
          `- Worker ID: ${worker?.id || "BRAK"}\n` +
          `- User role: ${user.role}`
      );
      console.warn(
        "⚠️ Missing data - employerId:",
        employerId ?? "NULL",
        "cleaningCompanyId:",
        cleaningCompanyId ?? "NULL",
        "worker?.id:",
        worker?.id ?? "NULL"
      );
      return;
    }

    // Check if reviewer already reviewed this worker (check both employer and cleaning_company)
    try {
      let existingReview = null;

      if (employerId) {
        const { data, error } = await supabase
          .from("reviews")
          .select("id, rating, created_at")
          .eq("employer_id", employerId)
          .eq("worker_id", worker.id)
          .maybeSingle();

        if (!error || error.code === "PGRST116") {
          existingReview = data;
        } else {
          console.error("Error checking existing employer review:", error);
        }
      }

      if (!existingReview && cleaningCompanyId) {
        const { data, error } = await supabase
          .from("reviews")
          .select("id, rating, created_at")
          .eq("cleaning_company_id", cleaningCompanyId)
          .eq("worker_id", worker.id)
          .maybeSingle();

        if (!error || error.code === "PGRST116") {
          existingReview = data;
        } else {
          console.error(
            "Error checking existing cleaning company review:",
            error
          );
        }
      }

      if (existingReview) {
        const reviewDate = existingReview.created_at
          ? new Date(existingReview.created_at).toLocaleDateString("pl-PL")
          : "nieznana data";
        const confirmed = confirm(
          `⚠️ Już wystawiłeś opinię dla ${worker.full_name} (${existingReview.rating}⭐, ${reviewDate}).\n\n` +
            `Obecnie system pozwala na jedną opinię na pracownika.\n\n` +
            `Czy chcesz kontynuować mimo to? (może wystąpić błąd)`
        );

        if (!confirmed) return;
      }
    } catch (err) {
      console.error("Error checking review:", err);
    }

    setIsReviewModalOpen(true);
  };

  const handleReviewSuccess = () => {
    alert(`✅ Dziękujemy za wystawienie opinii dla ${worker?.full_name}!`);
    loadWorkerData(); // Reload to show new review
  };

  const loadWorkerData = async () => {
    if (!id) return;

    console.log("🔍 WORKER PROFILE - Loading worker ID:", id);

    try {
      // Increment profile_views counter (cast to any to bypass TypeScript type check)
      const { error: incrementError } = await (supabase as any).rpc(
        "increment_worker_profile_views",
        { worker_id: id }
      );

      if (incrementError) {
        console.warn("⚠️ Could not increment profile views:", incrementError);
        // Continue loading profile even if increment fails
      } else {
        console.log("✅ Profile views incremented for worker:", id);
      }

      // Load worker profile WITH profile data (full_name, email, phone)
      let { data: workerData, error: workerError } = await supabase
        .from("workers")
        .select(
          `
          *,
          profiles!workers_profile_id_fkey(
            full_name,
            email,
            phone
          )
        `
        )
        .eq("id", id)
        .single();

      // If not found by id, try by profile_id
      if (workerError?.code === "PGRST116") {
        const result = await supabase
          .from("workers")
          .select(
            `
            *,
            profiles!workers_profile_id_fkey(
              full_name,
              email,
              phone
            )
          `
          )
          .eq("profile_id", id)
          .single();

        workerData = result.data;
        workerError = result.error;
      }

      console.log("🔍 WORKER QUERY RESULT:", { workerData, workerError });

      if (workerError) throw workerError;
      if (!workerData) {
        throw new Error("Worker not found");
      }

      // Map Supabase data to Worker interface
      if (workerData) {
        const profile = (workerData as any).profiles;
        setWorker({
          ...workerData,
          full_name: profile?.full_name || "Nieznane imię",
          email: profile?.email || "",
          phone: profile?.phone || workerData.phone,
          // Map location fields correctly
          city: workerData.location_city,
          postal_code: workerData.location_postal_code,
          country: workerData.location_country || "NL",
          // Map availability status
          availability_status: workerData.is_available
            ? "available"
            : "unavailable",
        } as any);
        console.log(
          "✅ Worker loaded:",
          profile?.full_name,
          "rating:",
          workerData.rating,
          "reviews:",
          workerData.rating_count
        );
      }

      // Use the actual worker.id for reviews query
      const actualWorkerId = workerData.id;

      // Load reviews from reviews table (reviewer_id → profiles)
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select(
          `
          id,
          rating,
          comment,
          quality_rating,
          punctuality_rating,
          communication_rating,
          safety_rating,
          would_recommend,
          created_at,
          employer_id,
          reviewer_id,
          reviewer:profiles!reviews_reviewer_id_fkey (
            id,
            full_name,
            avatar_url
          ),
          employer:employers (
            id,
            company_name,
            logo_url
          )
        `
        )
        .eq("worker_id", actualWorkerId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (reviewsError) {
        console.error("❌ Error loading reviews:", reviewsError);
      } else if (reviewsData) {
        console.log("✅ Reviews loaded:", reviewsData.length, "reviews");
        setReviews(
          reviewsData.map((review) => ({
            id: review.id,
            worker_id: actualWorkerId,
            employer_id: review.employer_id || "",
            employer_name:
              (review as any).reviewer?.full_name ||
              (review as any).employer?.company_name ||
              "Anoniem",
            employer_avatar:
              (review as any).reviewer?.avatar_url ||
              (review as any).employer?.logo_url ||
              undefined,
            rating: review.rating,
            comment: review.comment || "",
            quality_rating: review.quality_rating || undefined,
            punctuality_rating: review.punctuality_rating || undefined,
            communication_rating: review.communication_rating || undefined,
            safety_rating: review.safety_rating || undefined,
            would_recommend: review.would_recommend || undefined,
            created_at: review.created_at || new Date().toISOString(),
          }))
        );
      }
    } catch (error) {
      console.error("❌ WORKER PROFILE ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Pracownik nie znaleziony
          </h2>
          <p className="text-gray-600 mb-6">
            Ten profil nie istnieje lub został usunięty
          </p>
          <Link
            to="/workers"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Wróć do wyszukiwarki
          </Link>
        </div>
      </div>
    );
  }

  const availabilityColors = {
    available: "bg-green-100 text-green-700",
    busy: "bg-yellow-100 text-yellow-700",
    unavailable: "bg-red-100 text-red-700",
  };

  const availabilityLabels = {
    available: "Dostępny",
    busy: "Zajęty",
    unavailable: "Niedostępny",
  };

  // Make handlers available to ContactTab
  (window as any).handleOpenContact = handleOpenContact;
  (window as any).handleOpenReview = handleOpenReview;

  // Check if viewing own profile
  const isOwnProfile = user && worker && worker.profile_id === user.id;

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* 3D Background Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden perspective-container">
        <Animated3DProfileBackground role="worker" opacity={0.25} />
      </div>

      <div className="relative z-10">
        {/* Cover Image Header */}
        <div className="relative h-64 bg-gradient-to-r from-blue-600 to-indigo-700">
          {worker.cover_image_url && (
            <img
              src={worker.cover_image_url}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          
          {/* Back button - only show when NOT embedded */}
          {!embedded && (
            <button
              onClick={() => navigate("/workers")}
              className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Wróć do wyszukiwarki</span>
            </button>
          )}
        </div>

        {/* Profile Info */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {worker.avatar_url ? (
                  <img
                    src={worker.avatar_url}
                    alt={worker.full_name}
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-blue-100 flex items-center justify-center text-5xl font-bold text-blue-600">
                    {worker.full_name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {worker.full_name}
                    </h1>
                    {worker.specialization && (
                      <p className="text-xl text-gray-600 mb-4">
                        {worker.specialization}
                      </p>
                    )}

                    {/* Rating & Status */}
                    <div className="flex items-center gap-4 mb-4 flex-wrap">
                      <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-lg font-semibold text-gray-900">
                          {worker.rating.toFixed(1)}
                        </span>
                        <span className="text-gray-600">
                          ({worker.rating_count} opinii)
                        </span>
                      </div>

                      {worker.is_verified && (
                        <div className="flex items-center gap-2 bg-green-50 border-2 border-green-400 px-4 py-2 rounded-lg">
                          <CheckCircleIcon className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-700">
                            Zweryfikowany
                          </span>
                        </div>
                      )}

                      <div
                        className={`px-4 py-2 rounded-lg font-medium ${
                          availabilityColors[worker.availability_status]
                        }`}
                      >
                        {availabilityLabels[worker.availability_status]}
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="flex flex-wrap gap-4 text-gray-700">
                      {worker.city && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{worker.city}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        <span>{worker.years_experience} lat doświadczenia</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        <span>
                          {worker.completed_jobs} zrealizowanych projektów
                        </span>
                      </div>
                      {worker.hourly_rate && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            €{worker.hourly_rate}/godz
                          </span>
                        </div>
                      )}
                    </div>

                    {/* ✅ FAZA 4: ZZP Certification Badge */}
                    {(worker as any).zzp_certificate_issued &&
                      (worker as any).zzp_certificate_number && (
                        <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-xl p-4 shadow-md">
                          <div className="flex items-center gap-3">
                            <div className="text-4xl">🏆</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold text-gray-900">
                                  Certyfikat Premium ZZP
                                </h3>
                                {(worker as any).certificate_status ===
                                  "active" && (
                                  <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                    AKTYWNY
                                  </span>
                                )}
                                {(worker as any).certificate_status ===
                                  "expired" && (
                                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                    WYGASŁ
                                  </span>
                                )}
                                {(worker as any).certificate_status ===
                                  "revoked" && (
                                  <span className="bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded-full">
                                    COFNIĘTY
                                  </span>
                                )}
                              </div>
                              <code className="text-sm font-mono text-yellow-800 bg-yellow-100 px-2 py-1 rounded">
                                {(worker as any).zzp_certificate_number}
                              </code>
                              {(worker as any).certificate_issued_at && (
                                <p className="text-xs text-gray-600 mt-2">
                                  Wydany:{" "}
                                  {new Date(
                                    (worker as any).certificate_issued_at
                                  ).toLocaleDateString("pl-PL")}
                                  {(worker as any)
                                    .zzp_certificate_expires_at && (
                                    <>
                                      {" "}
                                      · Ważny do:{" "}
                                      {new Date(
                                        (
                                          worker as any
                                        ).zzp_certificate_expires_at
                                      ).toLocaleDateString("pl-PL")}
                                    </>
                                  )}
                                </p>
                              )}

                              {/* Approved categories */}
                              {(worker as any).approved_categories &&
                                (worker as any).approved_categories.length >
                                  0 && (
                                  <div className="mt-3">
                                    <p className="text-xs text-blue-200 font-semibold mb-1">
                                      ✅ Zatwierdzone specjalizacje:
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {(worker as any).approved_categories.map(
                                        (cat: string) => (
                                          <span
                                            key={cat}
                                            className="bg-yellow-500/30 border border-yellow-400/50 text-yellow-100 px-2 py-0.5 rounded-full text-xs font-medium"
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

                          {/* Warning messages for expired/revoked */}
                          {(worker as any).certificate_status === "expired" && (
                            <div className="mt-3 bg-red-50 border border-red-300 rounded-lg p-3 text-sm">
                              <p className="text-red-700">
                                ⚠️ <strong>Certyfikat wygasł</strong> - ten
                                pracownik może być w trakcie odnowienia
                                certyfikatu.
                              </p>
                            </div>
                          )}

                          {(worker as any).certificate_status === "revoked" && (
                            <div className="mt-3 bg-gray-100 border border-gray-400 rounded-lg p-3 text-sm">
                              <p className="text-gray-700">
                                🚫 <strong>Certyfikat cofnięty</strong> -
                                skontaktuj się z administracją po więcej
                                informacji.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                  </div>

                  {/* Action Buttons - Hide for own profile */}
                  {!isOwnProfile && (
                    <div className="flex gap-3">
                      {/* Contact Button */}
                      <a
                        href={`mailto:${worker.email}`}
                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                      >
                        Skontaktuj się
                      </a>

                      {/* Invite to Team Button - Only for employers and cleaning companies */}
                      {user &&
                        (user.role === "employer" ||
                          user.role === "cleaning_company") && (
                          <button
                            onClick={() => setIsInviteToTeamModalOpen(true)}
                            className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-lg flex items-center gap-2"
                          >
                            <span>👥</span>
                            Zaproś do ekipy
                          </button>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-1">
              {[
                { id: "about", label: "O mnie", icon: "📋" },
                { id: "portfolio", label: "Portfolio", icon: "📸" },
                {
                  id: "reviews",
                  label: `Opinie (${reviews.length})`,
                  icon: "⭐",
                },
                { id: "contact", label: "Kontakt", icon: "📞" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                  px-6 py-4 font-medium transition-colors border-b-2
                  ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }
                `}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {activeTab === "about" && <AboutTab worker={worker} />}
              {activeTab === "portfolio" && (
                <PortfolioTab worker={worker} onImageClick={openLightbox} />
              )}
              {activeTab === "reviews" && (
                <ReviewsTab reviews={reviews} worker={worker} />
              )}
              {activeTab === "contact" && <ContactTab worker={worker} />}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <ContactCard worker={worker} />
              <SkillsCard worker={worker} />
              <LanguagesCard worker={worker} />
            </div>
          </div>
        </div>

        {/* MODALS */}
        {/* Contact Modal */}
        {worker && (
          <Modal
            isOpen={isContactModalOpen}
            onClose={() => setIsContactModalOpen(false)}
            title={`Kontakt: ${worker.full_name}`}
            size="lg"
          >
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Wskazówka:</strong> Napisz konkretną wiadomość
                  opisującą zakres prac, lokalizację i terminy. Zwiększysz
                  szanse na szybką odpowiedź!
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temat <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  placeholder="np. Oferta pracy - {worker.specialization || 'budowlanka'}"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wiadomość <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={8}
                  placeholder={`Dzień dobry,\n\nJestem zainteresowany Pana/Pani usługami.\n\nTyp prac: \nLokalizacja: \nTermin: \nSzacowany czas: \n\nMogę omówić szczegóły telefonicznie.\n\nPozdrawiam`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {contactMessage.length} znaków
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Anuluj
              </button>
              <button
                onClick={handleSendContact}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                📨 Wyślij wiadomość
              </button>
            </div>
          </Modal>
        )}

        {/* Review Modal */}
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

        {/* Invite to Team Modal */}
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

        {/* Lightbox Modal */}
        {lightboxOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300 transition-colors z-10"
            >
              ×
            </button>
            <img
              src={lightboxImage}
              alt="Portfolio powiększone"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm">
              Kliknij poza zdjęciem aby zamknąć
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// TAB COMPONENTS
// =====================================================

function SkillsTab({ worker }: { worker: Worker }) {
  if (!worker.skills || worker.skills.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Brak umiejętności
        </h3>
        <p className="text-gray-600">
          Ten pracownik nie dodał jeszcze swoich umiejętności
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Umiejętności</h3>
      <div className="flex flex-wrap gap-3">
        {worker.skills.map((skill) => (
          <span
            key={skill}
            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

function ReviewsTab({
  reviews,
  worker,
}: {
  reviews: WorkerReview[];
  worker: Worker;
}) {
  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Brak opinii
        </h3>
        <p className="text-gray-600">Ten pracownik nie ma jeszcze opinii</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-8 mb-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 mb-2">
              {worker.rating.toFixed(1)}
            </div>
            <div className="flex items-center gap-1 justify-center mb-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.round(worker.rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-gray-600">
              {worker.rating_count} opinii
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = reviews.filter((r) => r.rating === stars).length;
              const percentage =
                reviews.length > 0 ? (count / reviews.length) * 100 : 0;

              return (
                <div key={stars} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-8">{stars}★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Average Detailed Ratings */}
        {reviews.length > 0 && (
          <div className="pt-6 border-t">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">
              Średnie oceny szczegółowe
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    .reduce(
                      (sum, r) => sum + (r.communication_rating || 0),
                      0
                    ) / reviews.filter((r) => r.communication_rating).length;
                const safetyAvg =
                  reviews
                    .filter((r) => r.safety_rating)
                    .reduce((sum, r) => sum + (r.safety_rating || 0), 0) /
                  reviews.filter((r) => r.safety_rating).length;

                return (
                  <>
                    {!isNaN(qualityAvg) && (
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {qualityAvg.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-600">
                          Jakość pracy
                        </div>
                      </div>
                    )}
                    {!isNaN(punctualityAvg) && (
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {punctualityAvg.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-600">
                          Punktualność
                        </div>
                      </div>
                    )}
                    {!isNaN(communicationAvg) && (
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 mb-1">
                          {communicationAvg.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-600">Komunikacja</div>
                      </div>
                    )}
                    {!isNaN(safetyAvg) && (
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600 mb-1">
                          {safetyAvg.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-600">BHP</div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Recommendation percentage */}
            {reviews.filter((r) => r.would_recommend !== undefined).length >
              0 && (
              <div className="mt-4 text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {Math.round(
                    (reviews.filter((r) => r.would_recommend === true).length /
                      reviews.filter((r) => r.would_recommend !== undefined)
                        .length) *
                      100
                  )}
                  %
                </div>
                <div className="text-sm text-gray-600">
                  klientów poleca tego pracownika
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start gap-4">
              {review.employer_avatar ? (
                <img
                  src={review.employer_avatar}
                  alt={review.employer_name}
                  className="w-12 h-12 rounded-full object-cover shadow-md"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-md">
                  {review.employer_name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {review.employer_name}
                      </h4>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString("pl-PL", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  {review.would_recommend && (
                    <div className="flex items-center gap-1 text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full">
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>Poleca</span>
                    </div>
                  )}
                </div>

                {/* Detailed Ratings */}
                {(review.quality_rating ||
                  review.punctuality_rating ||
                  review.communication_rating ||
                  review.safety_rating) && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                    {review.quality_rating && (
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">Jakość</div>
                        <div className="flex items-center justify-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.quality_rating!
                                  ? "fill-blue-500 text-blue-500"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {review.punctuality_rating && (
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">
                          Punktualność
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.punctuality_rating!
                                  ? "fill-green-500 text-green-500"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {review.communication_rating && (
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">
                          Komunikacja
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.communication_rating!
                                  ? "fill-purple-500 text-purple-500"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {review.safety_rating && (
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">BHP</div>
                        <div className="flex items-center justify-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.safety_rating!
                                  ? "fill-orange-500 text-orange-500"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {review.comment && (
                  <p className="text-gray-700 leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AboutTab({ worker }: { worker: Worker }) {
  return (
    <div className="space-y-6">
      {/* Bio */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">O mnie</h3>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {worker.bio || "Pracownik nie dodał jeszcze opisu"}
        </p>
      </div>

      {/* Skills Section */}
      {worker.skills && worker.skills.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            🎯 Umiejętności
          </h3>
          <div className="flex flex-wrap gap-3">
            {worker.skills.map((skill) => (
              <span
                key={skill}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Professional Info */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Informacje zawodowe
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <InfoField
            label="Lata doświadczenia"
            value={`${worker.years_experience} lat`}
          />
          <InfoField
            label="Zrealizowane projekty"
            value={worker.completed_jobs.toString()}
          />
          {worker.hourly_rate && (
            <InfoField
              label="Stawka godzinowa"
              value={`€${worker.hourly_rate}/godz`}
            />
          )}
          <InfoField
            label="Status"
            value={
              worker.availability_status === "available"
                ? "Dostępny"
                : worker.availability_status === "busy"
                ? "Zajęty"
                : "Niedostępny"
            }
          />
        </div>
      </div>

      {/* Availability Schedule - NOWA SEKCJA */}
      {(worker as any).availability && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Dni dostępności
          </h3>

          {/* Preferred days per week */}
          {(worker as any).preferred_days_per_week && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                📅 Preferowana liczba dni w tygodniu:{" "}
                <strong>{(worker as any).preferred_days_per_week} dni</strong>
              </p>
            </div>
          )}

          {/* Days grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {[
              { key: "monday", label: "Pn", fullName: "Poniedziałek" },
              { key: "tuesday", label: "Wt", fullName: "Wtorek" },
              { key: "wednesday", label: "Śr", fullName: "Środa" },
              { key: "thursday", label: "Cz", fullName: "Czwartek" },
              { key: "friday", label: "Pt", fullName: "Piątek" },
              { key: "saturday", label: "So", fullName: "Sobota" },
              { key: "sunday", label: "Nd", fullName: "Niedziela" },
            ].map((day) => {
              const isAvailable = (worker as any).availability[day.key];
              return (
                <div
                  key={day.key}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    isAvailable
                      ? "bg-green-50 border-green-400 text-green-800"
                      : "bg-gray-50 border-gray-200 text-gray-400"
                  }`}
                  title={`${day.fullName}: ${
                    isAvailable ? "Dostępny" : "Niedostępny"
                  }`}
                >
                  <div className="font-bold text-sm">{day.label}</div>
                  <div className="text-xl mt-1">{isAvailable ? "✓" : "✗"}</div>
                </div>
              );
            })}
          </div>

          {/* Unavailable dates */}
          {(worker as any).unavailable_dates &&
            (worker as any).unavailable_dates.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                  ⚠️ Dni niedostępności
                </h4>
                <div className="space-y-2">
                  {(worker as any).unavailable_dates.map(
                    (unavail: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm text-yellow-800"
                      >
                        <span className="font-medium">
                          {new Date(unavail.date).toLocaleDateString("pl-PL", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                        {unavail.type && (
                          <span className="px-2 py-0.5 bg-yellow-200 rounded text-xs font-medium">
                            {unavail.type === "vacation"
                              ? "🏖️ Urlop"
                              : "📅 " + unavail.type}
                          </span>
                        )}
                        {unavail.reason && (
                          <span className="text-yellow-700">
                            - {unavail.reason}
                          </span>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Additional Equipment & Info - NOWA SEKCJA */}
      {((worker as any).own_vehicle ||
        (worker as any).own_tools?.length > 0) && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            🛠️ Wyposażenie i udogodnienia
          </h3>

          <div className="space-y-3">
            {/* Own Vehicle */}
            {(worker as any).own_vehicle && (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-2xl">🚗</div>
                <div>
                  <p className="font-medium text-green-900">Własny pojazd</p>
                  {(worker as any).vehicle_type && (
                    <p className="text-sm text-green-700">
                      Typ: {(worker as any).vehicle_type}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Own Tools */}
            {(worker as any).own_tools &&
              (worker as any).own_tools.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🔧</span>
                    <p className="font-medium text-blue-900">
                      Własne narzędzia
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(worker as any).own_tools.map(
                      (tool: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                        >
                          {tool}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Service Radius */}
            {(worker as any).radius_km && (
              <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="text-2xl">📍</div>
                <div>
                  <p className="font-medium text-purple-900">
                    Promień działania
                  </p>
                  <p className="text-sm text-purple-700">
                    {(worker as any).radius_km} km od{" "}
                    {worker.city || "lokalizacji"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location Card */}
      <LocationCard
        address={(worker as any).address}
        city={worker.city}
        postalCode={worker.postal_code}
        country={worker.country}
        latitude={(worker as any).latitude}
        longitude={(worker as any).longitude}
        googleMapsUrl={null}
        profileType="worker"
      />
    </div>
  );
}

function PortfolioTab({
  worker,
  onImageClick,
}: {
  worker: Worker;
  onImageClick?: (url: string) => void;
}) {
  if (!worker.portfolio_images || worker.portfolio_images.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Brak portfolio
        </h3>
        <p className="text-gray-600">
          Ten pracownik nie dodał jeszcze zdjęć swoich prac
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Portfolio prac</h2>
      <p className="text-sm text-gray-600 mb-4">
        💡 Kliknij na zdjęcie aby je powiększyć
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {worker.portfolio_images.map((img, idx) => (
          <div
            key={idx}
            onClick={() => onImageClick?.(img)}
            className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all duration-200 group cursor-pointer shadow-sm hover:shadow-md relative"
          >
            <img
              src={img}
              alt={`Portfolio ${idx + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
              <span className="text-white text-4xl opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                🔍
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactTab({ worker }: { worker: Worker }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Contact Info Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Dane kontaktowe
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imię i nazwisko
            </label>
            <p className="text-lg text-gray-900">{worker.full_name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <a
              href={`mailto:${worker.email}`}
              className="text-lg text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-2"
            >
              <Mail className="w-5 h-5" />
              {worker.email}
            </a>
          </div>

          {worker.phone && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon
              </label>
              <a
                href={`tel:${worker.phone}`}
                className="text-lg text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-2"
              >
                <Phone className="w-5 h-5" />
                {worker.phone}
              </a>
            </div>
          )}

          {worker.city && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lokalizacja
              </label>
              <p className="text-lg text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-400" />
                {worker.city}, {worker.country}
              </p>
            </div>
          )}

          {worker.website && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Strona internetowa
              </label>
              <a
                href={worker.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-2"
              >
                <Globe className="w-5 h-5" />
                {worker.website}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {worker.linkedin_url && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn
              </label>
              <a
                href={worker.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                LinkedIn Profile
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Quick Contact Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Wyślij wiadomość
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Skontaktuj się z {worker.full_name} aby omówić szczegóły współpracy.
        </p>

        {/* Message & Review Actions */}
        <div className="space-y-3">
          <button
            onClick={() => (window as any).handleOpenContact?.()}
            className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
          >
            📨 Wyślij wiadomość
          </button>

          <button
            onClick={() => (window as any).handleOpenReview?.()}
            className="block w-full bg-yellow-500 text-white text-center py-3 rounded-lg font-medium hover:bg-yellow-600 transition-colors shadow-sm hover:shadow-md"
          >
            ⭐ Wystaw opinię
          </button>
        </div>

        {/* Direct contact fallback */}
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-xs text-gray-600 mb-2">
            Lub skontaktuj się bezpośrednio:
          </p>
          <div className="space-y-2">
            {worker.phone && (
              <a
                href={`tel:${worker.phone}`}
                className="block text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                📞 {worker.phone}
              </a>
            )}
            <a
              href={`mailto:${worker.email}`}
              className="block text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              ✉️ {worker.email}
            </a>
          </div>
        </div>

        {/* Availability Status */}
        <div className="mt-6 pt-6 border-t border-blue-200">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                worker.availability_status === "available"
                  ? "bg-green-500 animate-pulse"
                  : worker.availability_status === "busy"
                  ? "bg-yellow-500"
                  : "bg-gray-400"
              }`}
            />
            <span className="text-sm font-medium text-gray-900">
              Status:{" "}
              {worker.availability_status === "available"
                ? "Dostępny"
                : worker.availability_status === "busy"
                ? "Zajęty"
                : "Niedostępny"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// SIDEBAR COMPONENTS
// =====================================================

function ContactCard({ worker }: { worker: Worker }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Kontakt</h3>

      <a
        href={`mailto:${worker.email}`}
        className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors"
      >
        <Mail className="w-5 h-5 text-gray-400" />
        <span className="text-sm">{worker.email}</span>
      </a>

      {worker.phone && (
        <a
          href={`tel:${worker.phone}`}
          className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors"
        >
          <Phone className="w-5 h-5 text-gray-400" />
          <span className="text-sm">{worker.phone}</span>
        </a>
      )}

      {worker.website && (
        <a
          href={worker.website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors"
        >
          <Globe className="w-5 h-5 text-gray-400" />
          <span className="text-sm">Website</span>
          <ExternalLink className="w-4 h-4 ml-auto" />
        </a>
      )}

      {worker.linkedin_url && (
        <a
          href={worker.linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors"
        >
          <ExternalLink className="w-5 h-5 text-gray-400" />
          <span className="text-sm">LinkedIn</span>
          <ExternalLink className="w-4 h-4 ml-auto" />
        </a>
      )}

      {worker.city && (
        <div className="flex items-center gap-3 text-gray-700">
          <MapPin className="w-5 h-5 text-gray-400" />
          <span className="text-sm">
            {worker.city}, {worker.country}
          </span>
        </div>
      )}
    </div>
  );
}

function SkillsCard({ worker }: { worker: Worker }) {
  if (!worker.skills || worker.skills.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Główne umiejętności
      </h3>
      <div className="flex flex-wrap gap-2">
        {worker.skills.slice(0, 8).map((skill: string) => (
          <span
            key={skill}
            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

function LanguagesCard({ worker }: { worker: Worker }) {
  if (!worker.languages || worker.languages.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Languages className="w-5 h-5 text-blue-600" />
        Języki
      </h3>
      <div className="flex flex-wrap gap-2">
        {worker.languages.map((lang: string) => (
          <span
            key={lang}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
          >
            {lang}
          </span>
        ))}
      </div>
    </div>
  );
}

// =====================================================
// HELPER COMPONENTS
// =====================================================

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500 mb-1">{label}</dt>
      <dd className="text-base text-gray-900">{value}</dd>
    </div>
  );
}

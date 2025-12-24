/**
 * EmployerPublicProfilePageModern - Nowoczesny profil pracodawcy
 * Wykorzystuje ModernPublicProfile dla spójnego designu
 * Kolor główny: emerald (zielony) - employer
 */
import { useState, useEffect, ReactNode } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Modal } from "../../components/Modal";
import { ReviewEmployerModal } from "../../src/components/employer/ReviewEmployerModal";
import { LocationCard } from "../../components/LocationCard";
import {
  getEmployerReviews,
  getEmployerReviewStats,
} from "../../src/services/employerReviewService";
import type { EmployerReviewStats } from "../../src/services/employerReviewService";
import { getPosts, likePost, sharePost } from "../../src/services/feedService";
import type { Post } from "../../src/services/feedService";
import {
  ModernPublicProfile,
  type ProfileStatCard,
} from "../../components/ModernPublicProfile";
import {
  Star,
  MapPin,
  Mail,
  Phone,
  Globe,
  Briefcase,
  Calendar,
  MessageSquare,
  CheckCircleIcon,
  User,
  ExternalLink,
  BuildingOfficeIcon,
  Users,
  Award,
  ClockIcon,
  TrendingUp,
  FileText,
  Heart,
  Share2,
  Eye,
} from "../../components/icons";
import { PostCardPremium } from "../FeedPage_PREMIUM";
import { toast } from "sonner";

// =====================================================
// INTERFACES
// =====================================================
interface Employer {
  id: string;
  profile_id: string;
  company_name: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  description: string | null;
  industry: string | null;
  company_size: string | null;
  company_type: string | null;
  city: string | null;
  country: string | null;
  address: string | null;
  postal_code: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_person: string | null;
  website: string | null;
  kvk_number: string | null;
  btw_number: string | null;
  rsin_number: string | null;
  verified: boolean;
  verified_at: string | null;
  avg_rating: number | null;
  average_rating: number | null;
  rating: number | null;
  rating_count: number | null;
  review_count: number | null;
  total_jobs_posted: number | null;
  total_hires: number | null;
  subscription_tier: string | null;
  google_place_id: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  google_maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

interface EmployerPublicProfilePageProps {
  employerId?: string;
  embedded?: boolean;
}

// =====================================================
// MAIN COMPONENT
// =====================================================
export default function EmployerPublicProfilePageModern({
  employerId: propId,
  embedded = false,
}: EmployerPublicProfilePageProps) {
  const { id: urlId } = useParams<{ id: string }>();
  const id = propId || urlId;
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState<EmployerReviewStats | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  // User roles
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [accountantId, setAccountantId] = useState<string | null>(null);
  const [cleaningCompanyId, setCleaningCompanyId] = useState<string | null>(
    null
  );
  const [hasReviewed, setHasReviewed] = useState(false);

  // Modals
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  // =====================================================
  // DATA LOADING
  // =====================================================
  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    if (id) {
      loadEmployerData(isMounted);
    }

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [id]);

  async function loadEmployerData(isMounted: boolean = true) {
    if (!id) return;

    try {
      if (!isMounted) return;
      setLoading(true);

      // Load employer profile - try by employer.id first, then by profile_id
      let { data: employerData, error: employerError } = await supabase
        .from("employers")
        .select("*")
        .eq("id", id)
        .single();

      // If not found by id, try by profile_id
      if (employerError?.code === "PGRST116") {
        const result = await supabase
          .from("employers")
          .select("*")
          .eq("profile_id", id)
          .single();
        employerData = result.data;
        employerError = result.error;
      }

      if (employerError) throw employerError;
      if (!employerData) throw new Error("Employer not found");

      if (!isMounted) return;
      setEmployer(employerData as any);

      const actualEmployerId = employerData.id;

      // Load active jobs
      const { data: jobsData } = await (supabase as any)
        .from("jobs")
        .select("*")
        .eq("employer_id", actualEmployerId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (jobsData && isMounted) {
        setJobs(jobsData as any);
      }

      // Load reviews
      const reviewsResult = await getEmployerReviews(actualEmployerId);
      console.log("[EMPLOYER-PROFILE] 📊 Reviews loaded:", {
        success: reviewsResult.success,
        count: reviewsResult.reviews?.length || 0,
        employerId: actualEmployerId,
      });
      if (reviewsResult.success && reviewsResult.reviews && isMounted) {
        setReviews(reviewsResult.reviews);
      }

      // Load review stats
      const statsResult = await getEmployerReviewStats(actualEmployerId);
      console.log("[EMPLOYER-PROFILE] 📈 Stats loaded:", {
        success: statsResult.success,
        stats: statsResult.stats,
        employerId: actualEmployerId,
      });
      if (statsResult.success && statsResult.stats && isMounted) {
        setReviewStats(statsResult.stats);
      }

      // Load posts
      const postsData = await getPosts({
        author_id: actualEmployerId,
        author_type: "employer",
      });
      if (isMounted) {
        setPosts(postsData || []);
      }

      // Load user's role IDs
      if (user?.id && isMounted) {
        const { data: workerData } = await supabase
          .from("workers")
          .select("id")
          .eq("profile_id", user.id)
          .maybeSingle();

        if (workerData) {
          setWorkerId(workerData.id);
        } else {
          const { data: accountantData } = await supabase
            .from("accountants")
            .select("id")
            .eq("profile_id", user.id)
            .maybeSingle();

          if (accountantData) {
            setAccountantId(accountantData.id);
          } else {
            const { data: cleaningData } = await supabase
              .from("cleaning_companies")
              .select("id")
              .eq("profile_id", user.id)
              .maybeSingle();

            if (cleaningData) {
              setCleaningCompanyId(cleaningData.id);
            }
          }
        }

        // Check if user already reviewed
        const { data: existingReview } = await (supabase as any)
          .from("employer_reviews")
          .select("id")
          .eq("employer_id", actualEmployerId)
          .eq("reviewer_id", user.id)
          .maybeSingle();

        if (isMounted) {
          setHasReviewed(!!existingReview);
        }
      }
    } catch (error) {
      console.error("Error loading employer data:", error);
    } finally {
      if (isMounted) setLoading(false);
    }
  }

  // =====================================================
  // HANDLERS
  // =====================================================
  const handleOpenContact = () => setIsContactModalOpen(true);

  const handleSendContact = async () => {
    if (!contactSubject.trim() || !contactMessage.trim()) {
      toast.error("Proszę wypełnić wszystkie pola");
      return;
    }

    if (!employer?.profile_id) {
      toast.error("Błąd: brak danych pracodawcy");
      return;
    }

    const currentUser = await supabase.auth.getUser();
    if (!currentUser.data.user) {
      toast.error("Zaloguj się, aby wysłać wiadomość");
      return;
    }

    try {
      const { error } = await (supabase as any).from("messages").insert({
        sender_id: currentUser.data.user.id,
        recipient_id: employer.profile_id,
        subject: contactSubject,
        content: contactMessage,
        is_read: false,
      });

      if (error) throw error;

      toast.success(`Wiadomość wysłana do ${employer.company_name}!`);
      setIsContactModalOpen(false);
      setContactSubject("");
      setContactMessage("");
    } catch (err: any) {
      console.error("Error sending message:", err);
      toast.error(`Nie udało się wysłać: ${err.message}`);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user?.id) return;
    const role = workerId
      ? "worker"
      : accountantId
      ? "accountant"
      : cleaningCompanyId
      ? "cleaning_company"
      : null;
    if (!role) return;
    try {
      await likePost(postId, user.id, role as any);
      loadEmployerData(true);
    } catch (error) {
      console.error("Error liking:", error);
    }
  };

  const handleShare = async (postId: string) => {
    if (!user?.id) return;
    const role = workerId
      ? "worker"
      : accountantId
      ? "accountant"
      : cleaningCompanyId
      ? "cleaning_company"
      : null;
    if (!role) return;
    try {
      await sharePost(postId, user.id, role as any);
      loadEmployerData(true);
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  // =====================================================
  // LOADING & ERROR STATES
  // =====================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-24 h-24 bg-slate-200 rounded-full"></div>
          <div className="h-6 w-48 bg-slate-200 rounded"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!employer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BuildingOfficeIcon className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Pracodawca nie znaleziony
          </h2>
          <p className="text-slate-600 mb-6">
            Ten profil nie istnieje lub został usunięty
          </p>
          <Link
            to="/employers"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium"
          >
            ← Wróć do wyszukiwarki
          </Link>
        </div>
      </div>
    );
  }

  // =====================================================
  // PREPARE DATA FOR ModernPublicProfile
  // =====================================================
  // Use reviewStats (live data from employer_reviews) instead of cached employer.* values
  const rating = reviewStats?.average_rating || 0;
  const ratingCount = reviewStats?.total_reviews || reviews.length || 0;

  // Filter posts BEFORE stats calculation so we can count job offers
  const jobOffers = posts.filter((p) => p.type === "job_offer");
  const regularPosts = posts.filter((p) => p.type !== "job_offer");

  // Calculate total active offers from both sources: jobs table + posts with type='job_offer'
  const totalActiveOffers = jobs.length + jobOffers.length;

  const stats: ProfileStatCard[] = [
    {
      value: totalActiveOffers,
      label: "AKTYWNE OFERTY",
    },
    {
      value: rating > 0 ? rating.toFixed(1) : "—",
      label: "OCENA",
    },
    {
      value: ratingCount,
      label: "OPINII",
    },
  ];

  // =====================================================
  // TAB CONTENT COMPONENTS
  // =====================================================

  // ----- ABOUT TAB -----
  const AboutTabContent = () => (
    <div className="space-y-6">
      {/* Description */}
      {employer.description && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BuildingOfficeIcon className="w-5 h-5 text-emerald-500" />O firmie
          </h3>
          <p className="text-slate-600 leading-relaxed whitespace-pre-line">
            {employer.description}
          </p>
        </div>
      )}

      {/* Company Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Company Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-500" />
            Szczegóły firmy
          </h3>
          <div className="space-y-4">
            {employer.company_type && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Forma prawna</div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    employer.company_type === "B.V."
                      ? "bg-emerald-100 text-emerald-800"
                      : employer.company_type === "Uitzendbureau"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {employer.company_type}
                </span>
              </div>
            )}

            {employer.industry && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Branża</div>
                <div className="text-sm font-medium text-slate-900">
                  {employer.industry}
                </div>
              </div>
            )}

            {employer.company_size && (
              <div>
                <div className="text-xs text-slate-500 mb-1">
                  Wielkość firmy
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <Users className="w-4 h-4 text-slate-400" />
                  {employer.company_size}
                </div>
              </div>
            )}

            {employer.kvk_number && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Numer KVK</div>
                <div className="text-sm font-medium text-slate-900 font-mono">
                  {employer.kvk_number}
                </div>
              </div>
            )}

            {employer.btw_number && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Numer BTW/VAT</div>
                <div className="text-sm font-medium text-slate-900 font-mono">
                  {employer.btw_number}
                </div>
              </div>
            )}

            {employer.rsin_number && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Numer RSIN</div>
                <div className="text-sm font-medium text-slate-900 font-mono">
                  {employer.rsin_number}
                </div>
              </div>
            )}

            <div>
              <div className="text-xs text-slate-500 mb-1">Data dołączenia</div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                <Calendar className="w-4 h-4 text-slate-400" />
                {new Date(employer.created_at).toLocaleDateString("pl-PL", {
                  year: "numeric",
                  month: "long",
                })}
              </div>
            </div>

            {employer.verified && employer.verified_at && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Zweryfikowano</div>
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                  <CheckCircleIcon className="w-4 h-4" />
                  {new Date(employer.verified_at).toLocaleDateString("pl-PL")}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Google Reviews - MODERN ANIMATED */}
        {employer.google_rating && employer.google_rating > 0 && (
          <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-red-50/20 rounded-2xl p-6 shadow-lg border border-slate-200/80 hover:shadow-xl transition-all duration-500 group">
            {/* Animated Google Background Effect */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div
                className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl animate-pulse"
                style={{ animationDuration: "3s" }}
              ></div>
              <div
                className="absolute -bottom-10 -left-10 w-40 h-40 bg-red-500 rounded-full blur-3xl animate-pulse"
                style={{ animationDuration: "4s", animationDelay: "1s" }}
              ></div>
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-yellow-400 rounded-full blur-3xl animate-pulse"
                style={{ animationDuration: "3.5s", animationDelay: "0.5s" }}
              ></div>
              <div
                className="absolute top-10 left-10 w-20 h-20 bg-green-500 rounded-full blur-2xl animate-pulse"
                style={{ animationDuration: "4.5s", animationDelay: "1.5s" }}
              ></div>
            </div>

            {/* Header with Animated Google Logo */}
            <div className="relative flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                {/* Animated Google "G" Logo */}
                <div className="relative w-12 h-12 group-hover:scale-110 transition-transform duration-500">
                  <svg
                    viewBox="0 0 48 48"
                    className="w-full h-full drop-shadow-lg"
                  >
                    {/* Background circle with gradient */}
                    <defs>
                      <linearGradient
                        id="googleGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#4285F4">
                          <animate
                            attributeName="stop-color"
                            values="#4285F4;#EA4335;#FBBC05;#34A853;#4285F4"
                            dur="8s"
                            repeatCount="indefinite"
                          />
                        </stop>
                        <stop offset="100%" stopColor="#34A853">
                          <animate
                            attributeName="stop-color"
                            values="#34A853;#4285F4;#EA4335;#FBBC05;#34A853"
                            dur="8s"
                            repeatCount="indefinite"
                          />
                        </stop>
                      </linearGradient>
                    </defs>

                    {/* Google "G" SVG Path */}
                    <path
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      fill="#EA4335"
                      className="origin-center group-hover:animate-pulse"
                    />
                    <path
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      fill="#4285F4"
                      className="origin-center group-hover:animate-pulse"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <path
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      fill="#FBBC05"
                      className="origin-center group-hover:animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <path
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      fill="#34A853"
                      className="origin-center group-hover:animate-pulse"
                      style={{ animationDelay: "0.3s" }}
                    />
                  </svg>

                  {/* Rotating ring around logo */}
                  <div
                    className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-400 border-r-red-400 animate-spin"
                    style={{ animationDuration: "8s" }}
                  ></div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Opinie Google
                  </h3>
                  <p className="text-xs text-slate-500">
                    Zweryfikowane recenzje
                  </p>
                </div>
              </div>

              {/* Live indicator */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs font-medium text-green-700">Live</span>
              </div>
            </div>

            {/* Rating Display */}
            <div className="relative flex items-center gap-5 mb-5 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-100">
              {/* Big Rating Number */}
              <div className="relative">
                <div className="text-5xl font-black bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                  {employer.google_rating.toFixed(1)}
                </div>
                <div
                  className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-bounce"
                  style={{ animationDuration: "2s" }}
                ></div>
              </div>

              {/* Stars and Count */}
              <div className="flex-1">
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="relative group/star">
                      <Star
                        className={`w-6 h-6 transition-all duration-300 ${
                          i <= Math.round(employer.google_rating!)
                            ? "fill-amber-400 text-amber-400 drop-shadow-md"
                            : "text-slate-200"
                        } group-hover/star:scale-125`}
                      />
                      {i <= Math.round(employer.google_rating!) && (
                        <div className="absolute inset-0 bg-amber-400 rounded-full blur-md opacity-30 animate-pulse"></div>
                      )}
                    </div>
                  ))}
                </div>
                {employer.google_review_count !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">
                      {employer.google_review_count.toLocaleString()}
                    </span>
                    <span className="text-sm text-slate-500">opinii</span>
                    <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      ✓ zweryfikowane
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* CTA Button */}
            {employer.google_maps_url && (
              <a
                href={employer.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn relative flex items-center justify-center gap-2 w-full px-5 py-3 bg-gradient-to-r from-blue-600 via-blue-500 to-green-500 text-white rounded-xl font-semibold text-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>

                {/* Google Maps Icon */}
                <svg
                  className="w-5 h-5 relative z-10"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <span className="relative z-10">Zobacz na Google Maps</span>
                <ExternalLink className="w-4 h-4 relative z-10 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-0.5 transition-transform" />
              </a>
            )}

            {/* Powered by Google badge */}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
              <span>Powered by</span>
              <svg viewBox="0 0 272 92" className="h-4 opacity-60">
                <path
                  fill="#4285F4"
                  d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"
                />
                <path
                  fill="#EA4335"
                  d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"
                />
                <path
                  fill="#FBBC05"
                  d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z"
                />
                <path fill="#4285F4" d="M225 3v65h-9.5V3h9.5z" />
                <path
                  fill="#34A853"
                  d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z"
                />
                <path
                  fill="#EA4335"
                  d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z"
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Location Card */}
      {(employer.address || employer.city || employer.latitude) && (
        <LocationCard
          address={employer.address}
          city={employer.city}
          postalCode={employer.postal_code}
          country={employer.country}
          latitude={employer.latitude}
          longitude={employer.longitude}
          googleMapsUrl={employer.google_maps_url}
          profileType="employer"
        />
      )}
    </div>
  );

  // ----- JOBS TAB -----
  const JobsTabContent = () => {
    const allJobsAndPosts = [...jobs, ...jobOffers];

    if (allJobsAndPosts.length === 0) {
      return (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
          <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            Brak aktywnych ofert
          </h3>
          <p className="text-slate-500">
            Ta firma nie ma obecnie opublikowanych ofert pracy.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Job Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
            <div className="text-2xl font-bold text-emerald-700">
              {jobs.length}
            </div>
            <div className="text-sm text-emerald-600">Aktywne oferty</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
            <div className="text-2xl font-bold text-blue-700">
              {employer.total_jobs_posted || 0}
            </div>
            <div className="text-sm text-blue-600">Wszystkie oferty</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
            <div className="text-2xl font-bold text-purple-700">
              {employer.total_hires || 0}
            </div>
            <div className="text-sm text-purple-600">Zatrudniono</div>
          </div>
        </div>

        {/* Job Cards */}
        {jobs.map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {job.urgent && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                      PILNE
                    </span>
                  )}
                  {job.featured && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                      WYRÓŻNIONE
                    </span>
                  )}
                </div>
                <h4 className="text-lg font-bold text-slate-900 hover:text-emerald-600 transition-colors">
                  <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                </h4>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
                  {(job.city || job.location) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.city || job.location}
                    </span>
                  )}
                  {job.employment_type && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {job.employment_type}
                    </span>
                  )}
                  {job.created_at && (
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      {new Date(job.created_at).toLocaleDateString("pl-PL")}
                    </span>
                  )}
                </div>
                {job.short_description && (
                  <p className="text-slate-600 mt-3 line-clamp-2">
                    {job.short_description}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                {(job.salary_min || job.salary_max) &&
                  job.salary_visible !== false && (
                    <div className="text-lg font-bold text-emerald-600">
                      {job.salary_min && job.salary_max
                        ? `€${job.salary_min} - €${job.salary_max}`
                        : job.salary_min
                        ? `od €${job.salary_min}`
                        : `do €${job.salary_max}`}
                      <span className="text-sm font-normal text-slate-500">
                        /{job.salary_period || "miesiąc"}
                      </span>
                    </div>
                  )}
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                  <Eye className="w-4 h-4" />
                  {job.views_count || 0} wyświetleń
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
              <div className="flex gap-2">
                {job.required_skills
                  ?.slice(0, 3)
                  .map((skill: string, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                {job.required_skills?.length > 3 && (
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                    +{job.required_skills.length - 3}
                  </span>
                )}
              </div>
              <Link
                to={`/jobs/${job.id}`}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Zobacz ofertę →
              </Link>
            </div>
          </div>
        ))}

        {/* Job Posts from Feed */}
        {jobOffers.map((post) => (
          <PostCardPremium
            key={post.id}
            post={post}
            onLike={() => handleLike(post.id)}
            onComment={() => {}}
            onShare={() => handleShare(post.id)}
            onReactionChange={() => {}}
            currentUserId={user?.id}
            currentUserRole={
              workerId
                ? "worker"
                : accountantId
                ? "accountant"
                : cleaningCompanyId
                ? "cleaning_company"
                : undefined
            }
          />
        ))}
      </div>
    );
  };

  // ----- POSTS TAB -----
  const PostsTabContent = () => {
    if (regularPosts.length === 0) {
      return (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">Brak postów</h3>
          <p className="text-slate-500">
            Ten pracodawca nie opublikował jeszcze żadnych postów.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {regularPosts.map((post) => (
          <PostCardPremium
            key={post.id}
            post={post}
            onLike={() => handleLike(post.id)}
            onComment={() => {}}
            onShare={() => handleShare(post.id)}
            onReactionChange={() => {}}
            currentUserId={user?.id}
            currentUserRole={
              workerId
                ? "worker"
                : accountantId
                ? "accountant"
                : cleaningCompanyId
                ? "cleaning_company"
                : undefined
            }
          />
        ))}
      </div>
    );
  };

  // ----- REVIEWS TAB -----
  const ReviewsTabContent = () => (
    <div className="space-y-6">
      {/* Reviews Stats */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">
          Statystyki ocen
        </h3>

        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-5xl font-bold text-slate-900">
              {reviewStats?.average_rating?.toFixed(1) || "0.0"}
            </div>
            <div className="flex gap-0.5 my-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(reviewStats?.average_rating || 0)
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-300"
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-slate-600">
              {reviewStats?.total_reviews || 0} opinii
            </div>
          </div>

          {reviewStats && reviews.length > 0 && (
            <div className="flex-1">
              <div className="grid grid-cols-3 gap-4">
                {reviewStats.average_communication > 0 && (
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-900">
                      Komunikacja
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      {reviewStats.average_communication.toFixed(1)}
                    </div>
                  </div>
                )}
                {reviewStats.average_professionalism > 0 && (
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-sm font-medium text-purple-900">
                      Profesjonalizm
                    </div>
                    <div className="text-2xl font-bold text-purple-700">
                      {reviewStats.average_professionalism.toFixed(1)}
                    </div>
                  </div>
                )}
                {reviewStats.average_payment > 0 && (
                  <div className="text-center p-3 bg-emerald-50 rounded-lg">
                    <div className="text-sm font-medium text-emerald-900">
                      Płatności
                    </div>
                    <div className="text-2xl font-bold text-emerald-700">
                      {reviewStats.average_payment.toFixed(1)}
                    </div>
                  </div>
                )}
              </div>

              {reviewStats.recommendation_percentage > 0 && (
                <div className="mt-4 p-3 bg-emerald-50 rounded-lg text-center">
                  <div className="text-sm text-emerald-900 font-medium">
                    👍 {reviewStats.recommendation_percentage.toFixed(0)}% osób
                    poleca tego pracodawcę
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
          <Star className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">Brak opinii</h3>
          <p className="text-slate-500 mb-4">
            {employer.company_name || "Ten pracodawca"} nie ma jeszcze opinii.
          </p>
          <p className="text-sm text-slate-400">
            Aby wystawić opinię, przejdź do zakładki "Kontakt"
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
            >
              <div className="flex gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 overflow-hidden">
                  {(review as any).profiles?.avatar_url ? (
                    <img
                      src={(review as any).profiles.avatar_url}
                      alt="Reviewer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    ((review as any).profiles?.full_name || "U")
                      .substring(0, 1)
                      .toUpperCase()
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900">
                          {(review as any).profiles?.full_name || "Użytkownik"}
                        </h4>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${
                                s <= review.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-slate-500">
                        {new Date(review.created_at).toLocaleDateString(
                          "pl-PL"
                        )}
                      </span>
                    </div>

                    {review.would_recommend && (
                      <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                        👍 Poleca
                      </span>
                    )}
                  </div>

                  {review.comment && (
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {review.comment}
                    </p>
                  )}

                  {(review.professionalism_rating ||
                    review.communication_rating ||
                    review.payment_rating) && (
                    <div className="grid grid-cols-3 gap-3 pt-4 mt-4 border-t border-slate-100">
                      {review.professionalism_rating && (
                        <div className="text-center">
                          <div className="text-xs text-slate-500 mb-1">
                            Profesjonalizm
                          </div>
                          <div className="flex gap-0.5 justify-center">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  s <= review.professionalism_rating
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
                                  s <= review.communication_rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-slate-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {review.payment_rating && (
                        <div className="text-center">
                          <div className="text-xs text-slate-500 mb-1">
                            Płatności
                          </div>
                          <div className="flex gap-0.5 justify-center">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  s <= review.payment_rating
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
      )}
    </div>
  );

  // ----- CONTACT TAB -----
  const ContactTabContent = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Contact Info */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-500" />
          Dane kontaktowe
        </h3>

        <div className="space-y-4">
          <div>
            <div className="text-xs text-slate-500 mb-1">Nazwa firmy</div>
            <div className="text-lg font-semibold text-slate-900">
              {employer.company_name}
            </div>
          </div>

          {employer.contact_person && (
            <div>
              <div className="text-xs text-slate-500 mb-1">
                Osoba kontaktowa
              </div>
              <div className="flex items-center gap-2 text-slate-900">
                <User className="w-4 h-4 text-slate-400" />
                {employer.contact_person}
              </div>
            </div>
          )}

          {employer.contact_email && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Email</div>
              <a
                href={`mailto:${employer.contact_email}`}
                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <Mail className="w-4 h-4" />
                {employer.contact_email}
              </a>
            </div>
          )}

          {employer.contact_phone && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Telefon</div>
              <a
                href={`tel:${employer.contact_phone}`}
                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <Phone className="w-4 h-4" />
                {employer.contact_phone}
              </a>
            </div>
          )}

          {(employer.address || employer.city) && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Adres</div>
              <div className="flex items-start gap-2 text-slate-900">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <span>
                  {employer.address && (
                    <>
                      {employer.address}
                      <br />
                    </>
                  )}
                  {employer.postal_code} {employer.city}
                  {employer.country && `, ${employer.country}`}
                </span>
              </div>
            </div>
          )}

          {employer.website && (
            <div>
              <div className="text-xs text-slate-500 mb-1">
                Strona internetowa
              </div>
              <a
                href={employer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <Globe className="w-4 h-4" />
                {employer.website.replace(/^https?:\/\//, "")}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Registration Data */}
        {(employer.kvk_number || employer.btw_number) && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="text-xs text-slate-500 font-medium mb-3">
              DANE REJESTRACYJNE
            </div>
            <div className="space-y-2 text-sm">
              {employer.kvk_number && (
                <div className="flex justify-between">
                  <span className="text-slate-500">KVK:</span>
                  <span className="font-mono font-medium text-slate-900">
                    {employer.kvk_number}
                  </span>
                </div>
              )}
              {employer.btw_number && (
                <div className="flex justify-between">
                  <span className="text-slate-500">BTW:</span>
                  <span className="font-mono font-medium text-slate-900">
                    {employer.btw_number}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">
          Skontaktuj się
        </h3>
        <p className="text-sm text-slate-600 mb-6">
          Zainteresowany pracą w {employer.company_name}? Wyślij wiadomość przez
          platformę:
        </p>

        <div className="space-y-3">
          <button
            onClick={handleOpenContact}
            className="block w-full bg-emerald-600 text-white text-center py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm hover:shadow-md"
          >
            📨 Wyślij wiadomość
          </button>

          <button
            onClick={() => setIsReviewModalOpen(true)}
            disabled={
              !user ||
              (!workerId && !accountantId && !cleaningCompanyId) ||
              hasReviewed
            }
            className={`block w-full text-center py-3 rounded-xl font-medium transition-colors shadow-sm ${
              !user ||
              (!workerId && !accountantId && !cleaningCompanyId) ||
              hasReviewed
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-amber-500 text-white hover:bg-amber-600 hover:shadow-md"
            }`}
          >
            {hasReviewed ? "✓ Już wystawiłeś opinię" : "⭐ Wystaw opinię"}
          </button>

          {!user && (
            <p className="text-xs text-center text-slate-500">
              Zaloguj się, aby wysłać wiadomość lub wystawić opinię
            </p>
          )}
        </div>

        {/* Direct Contact */}
        <div className="mt-6 pt-6 border-t border-emerald-200">
          <div className="text-xs text-slate-500 font-medium mb-3">
            LUB SKONTAKTUJ SIĘ BEZPOŚREDNIO
          </div>
          <div className="space-y-2">
            {employer.contact_phone && (
              <a
                href={`tel:${employer.contact_phone}`}
                className="block text-sm text-emerald-700 hover:underline"
              >
                📞 {employer.contact_phone}
              </a>
            )}
            {employer.contact_email && (
              <a
                href={`mailto:${employer.contact_email}`}
                className="block text-sm text-emerald-700 hover:underline"
              >
                ✉️ {employer.contact_email}
              </a>
            )}
            {employer.website && (
              <a
                href={employer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-emerald-700 hover:underline"
              >
                🌐 {employer.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // =====================================================
  // SIDEBAR EXTRA
  // =====================================================
  const SidebarExtra = () => (
    <div className="space-y-4">
      {/* Quick Contact Card */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
        <h4 className="font-bold text-slate-800 mb-3 text-sm">
          SZYBKI KONTAKT
        </h4>
        <div className="space-y-2">
          {employer.contact_email && (
            <a
              href={`mailto:${employer.contact_email}`}
              className="flex items-center gap-2 text-sm text-slate-700 hover:text-emerald-600"
            >
              <Mail className="w-4 h-4 text-emerald-500" />
              <span className="truncate">{employer.contact_email}</span>
            </a>
          )}
          {employer.contact_phone && (
            <a
              href={`tel:${employer.contact_phone}`}
              className="flex items-center gap-2 text-sm text-slate-700 hover:text-emerald-600"
            >
              <Phone className="w-4 h-4 text-emerald-500" />
              <span>{employer.contact_phone}</span>
            </a>
          )}
          {employer.website && (
            <a
              href={employer.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-slate-700 hover:text-emerald-600"
            >
              <Globe className="w-4 h-4 text-emerald-500" />
              <span className="truncate">
                {employer.website.replace(/^https?:\/\//, "")}
              </span>
            </a>
          )}
        </div>
        <button
          onClick={handleOpenContact}
          className="w-full mt-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Napisz wiadomość
        </button>
      </div>

      {/* Company Size */}
      {employer.company_size && (
        <div className="bg-slate-100 rounded-xl p-4 text-center">
          <Users className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <div className="font-bold text-slate-800">
            {employer.company_size}
          </div>
          <div className="text-xs text-slate-500">wielkość firmy</div>
        </div>
      )}

      {/* Premium Badge */}
      {employer.subscription_tier && employer.subscription_tier !== "free" && (
        <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl p-4 text-center border border-amber-200">
          <Award className="w-8 h-8 text-amber-600 mx-auto mb-2" />
          <div className="font-bold text-amber-800 uppercase text-sm">
            {employer.subscription_tier}
          </div>
          <div className="text-xs text-amber-600">Subskrypcja Premium</div>
        </div>
      )}

      {/* Verification Badge */}
      {employer.verified && (
        <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-200">
          <CheckCircleIcon className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <div className="font-bold text-emerald-800 text-sm">
            ZWERYFIKOWANA FIRMA
          </div>
          {employer.verified_at && (
            <div className="text-xs text-emerald-600 mt-1">
              od {new Date(employer.verified_at).toLocaleDateString("pl-PL")}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // =====================================================
  // CUSTOM TABS DEFINITION
  // =====================================================
  const customTabs = [
    {
      id: "about",
      label: "O firmie",
      icon: "🏢",
      content: <AboutTabContent />,
    },
    {
      id: "jobs",
      label: `Oferty (${jobs.length + jobOffers.length})`,
      icon: "💼",
      content: <JobsTabContent />,
    },
    {
      id: "posts",
      label: `Posty (${regularPosts.length})`,
      icon: "📝",
      content: <PostsTabContent />,
    },
    {
      id: "reviews",
      label: `Opinie (${reviews.length})`,
      icon: "⭐",
      content: <ReviewsTabContent />,
    },
    {
      id: "contact",
      label: "Kontakt",
      icon: "📞",
      content: <ContactTabContent />,
    },
  ];

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <>
      <ModernPublicProfile
        // Basic info
        name={employer.company_name || "Nazwa firmy"}
        role={employer.industry || "Pracodawca"}
        roleType="employer"
        // Images
        avatarUrl={employer.logo_url || undefined}
        coverImageUrl={employer.cover_image_url || undefined}
        // Status
        isVerified={employer.verified}
        badge={
          employer.subscription_tier === "premium" ? "PREMIUM" : "PRACODAWCA"
        }
        badgeColor={
          employer.subscription_tier === "premium"
            ? "bg-amber-500 text-white"
            : "bg-emerald-500 text-white"
        }
        // Stats
        stats={stats}
        // Bio
        bio={employer.description || undefined}
        // Details
        details={{
          location: employer.city || undefined,
          country: employer.country || "NL",
          website: employer.website || undefined,
          email: employer.contact_email || undefined,
          phone: employer.contact_phone || undefined,
        }}
        // Rating
        rating={rating > 0 ? rating : undefined}
        ratingCount={ratingCount}
        // Actions
        onContact={handleOpenContact}
        onBack={() => navigate("/employers")}
        backLabel="Wróć do wyszukiwarki"
        // Custom content
        customTabs={customTabs}
        sidebarExtra={<SidebarExtra />}
        // Loading
        loading={loading}
      />

      {/* =====================================================
          MODALS
          ===================================================== */}

      {/* Contact Modal */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title={`Kontakt: ${employer.company_name}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-emerald-50 p-4 rounded-lg">
            <p className="text-sm text-emerald-800">
              💡 <strong>Wskazówka:</strong> Opisz swoje doświadczenie,
              umiejętności i dostępność.
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
              placeholder="np. Zainteresowanie ofertą pracy"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wiadomość <span className="text-red-500">*</span>
            </label>
            <textarea
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              rows={6}
              placeholder={`Dzień dobry,\n\nJestem zainteresowany współpracą z Państwa firmą.\n\nMoje doświadczenie: \nUmiejętności: \nDostępność: \n\nPozdrawiam`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
            className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
          >
            📨 Wyślij wiadomość
          </button>
        </div>
      </Modal>

      {/* Review Modal */}
      <ReviewEmployerModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        employerId={employer.id}
        employerName={employer.company_name || "Ten pracodawca"}
        workerId={workerId || undefined}
        accountantId={accountantId || undefined}
        cleaningCompanyId={cleaningCompanyId || undefined}
        onSuccess={() => {
          setIsReviewModalOpen(false);
          loadEmployerData(true);
        }}
      />
    </>
  );
}

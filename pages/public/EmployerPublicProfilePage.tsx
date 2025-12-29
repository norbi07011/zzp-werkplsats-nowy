import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Modal } from "../../components/Modal";
import { ReviewEmployerModal } from "../../src/components/employer/ReviewEmployerModal";
import { LocationCard } from "../../components/LocationCard";
import { Animated3DProfileBackground } from "../../components/Animated3DProfileBackground";
import { SpinningNumbers } from "../../components/SpinningNumbers";
import {
  getEmployerReviews,
  getEmployerReviewStats,
} from "../../src/services/employerReviewService";
import type { EmployerReviewStats } from "../../src/services/employerReviewService";
import { getPosts, likePost, sharePost } from "../../src/services/feedService";
import type { Post } from "../../src/services/feedService";
import {
  BuildingOfficeIcon,
  MapPin,
  User,
  Star,
  Mail,
  Phone,
  Globe,
  Briefcase,
  CheckCircleIcon,
  ClockIcon,
  ExternalLink,
  MessageSquare,
  ArrowLeft,
  Heart,
  Share2,
  Bookmark,
  Calendar,
  Eye,
  MoreHorizontal,
  Award,
  Video,
} from "../../components/icons";
import { PostCardPremium } from "../FeedPage_PREMIUM";

interface Employer {
  id: string;
  profile_id: string;
  company_name: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  description: string | null;
  industry: string | null;
  company_size: string | null;
  city: string | null;
  country: string | null;
  address: string | null;
  postal_code: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  kvk_number: string | null;
  verified: boolean;
  avg_rating: number | null;
  rating_count: number | null;
  subscription_tier: string | null;
  created_at: string;
  // Extended Dutch company info
  company_type: string | null; // B.V., Uitzendbureau, etc.
  btw_number: string | null; // BTW/VAT number
  rsin_number: string | null; // RSIN
  // Google integration
  google_place_id: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  google_maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface Job {
  id: string;
  employer_id: string;
  title: string;
  description: string | null;
  location_city: string | null;
  location_country: string | null;
  specialization: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_period: string | null;
  job_type: string | null;
  status: string;
  created_at: string;
  start_date: string | null;
  applications_count?: number;
}

interface EmployerPublicProfilePageProps {
  employerId?: string;
  embedded?: boolean;
}

export default function EmployerPublicProfilePage({
  employerId: propId,
  embedded = false,
}: EmployerPublicProfilePageProps) {
  const { id: urlId } = useParams<{ id: string }>();
  const id = propId || urlId;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [employer, setEmployer] = useState<Employer | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "about" | "jobs" | "posts" | "contact" | "reviews"
  >("about");

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState<EmployerReviewStats | null>(
    null
  );
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [accountantId, setAccountantId] = useState<string | null>(null);
  const [cleaningCompanyId, setCleaningCompanyId] = useState<string | null>(
    null
  );
  const [hasReviewed, setHasReviewed] = useState<boolean>(false);

  // Contact modal
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    if (id) {
      loadEmployerData(abortController.signal, isMounted);
    }

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [id]);

  async function loadEmployerData(
    signal?: AbortSignal,
    isMounted: boolean = true
  ) {
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
      if (!employerData) {
        throw new Error("Employer not found");
      }

      if (!isMounted) return;
      setEmployer(employerData as any);

      // Use the actual employer.id for related queries
      const actualEmployerId = employerData.id;

      // Load active jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .eq("employer_id", actualEmployerId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (!jobsError && jobsData && isMounted) {
        setJobs(jobsData as any);
      }

      // Load employer reviews
      const reviewsResult = await getEmployerReviews(actualEmployerId);
      console.log(
        "[PUBLIC-PROFILE] 🔍 Reviews data from employerReviewService:",
        {
          success: reviewsResult.success,
          count: reviewsResult.reviews?.length || 0,
          first_review: reviewsResult.reviews?.[0],
        }
      );
      if (reviewsResult.success && reviewsResult.reviews && isMounted) {
        setReviews(reviewsResult.reviews);
      }

      // Load review stats
      const statsResult = await getEmployerReviewStats(actualEmployerId);
      if (statsResult.success && statsResult.stats && isMounted) {
        setReviewStats(statsResult.stats);
      }

      // Load posts created by this employer
      const postsData = await getPosts({
        author_id: actualEmployerId,
        author_type: "employer",
      });
      if (isMounted) {
        setPosts(postsData || []);
      }

      // Load logged-in user's worker/accountant/cleaning_company ID
      if (user?.id && isMounted) {
        // Check if user is a worker
        const { data: workerData } = await supabase
          .from("workers")
          .select("id")
          .eq("profile_id", user.id)
          .maybeSingle();

        if (workerData && isMounted) {
          setWorkerId(workerData.id);
        } else if (isMounted) {
          // Check if user is an accountant
          const { data: accountantData } = await supabase
            .from("accountants")
            .select("id")
            .eq("profile_id", user.id)
            .maybeSingle();

          if (accountantData && isMounted) {
            setAccountantId(accountantData.id);
          } else if (isMounted) {
            // Check if user is a cleaning company
            const { data: cleaningCompanyData } = await supabase
              .from("cleaning_companies")
              .select("id")
              .eq("profile_id", user.id)
              .maybeSingle();

            if (cleaningCompanyData && isMounted) {
              setCleaningCompanyId(cleaningCompanyData.id);
            }
          }
        }
      }

      // Sprawdź czy użytkownik już wystawił opinię
      if (user?.id && isMounted) {
        const { data: existingReview } = await supabase
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
      if (isMounted) {
        setLoading(false);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }

  const handleOpenContact = () => {
    setIsContactModalOpen(true);
  };

  const handleSendContact = async () => {
    if (!contactSubject.trim() || !contactMessage.trim()) {
      alert("Proszę wypełnić wszystkie pola");
      return;
    }

    if (!employer?.profile_id) {
      alert("❌ Błąd: brak danych pracodawcy");
      return;
    }

    // For now, we'll just show alert - in production this would check logged in user
    const currentUser = await supabase.auth.getUser();
    if (!currentUser.data.user) {
      alert("Zaloguj się aby wysłać wiadomość");
      return;
    }

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: currentUser.data.user.id,
        recipient_id: employer.profile_id,
        subject: contactSubject,
        content: contactMessage,
        is_read: false,
      });

      if (error) throw error;

      alert(`✅ Wiadomość wysłana do ${employer.company_name}!`);
      setIsContactModalOpen(false);
      setContactSubject("");
      setContactMessage("");
    } catch (err: any) {
      console.error("Error sending message:", err);
      alert(`❌ Nie udało się wysłać wiadomości: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!employer) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-900 mb-2">
            Pracodawca nie znaleziony
          </h2>
          <p className="text-red-700">Nie można załadować danych pracodawcy.</p>
          <button
            onClick={() => navigate("/employers")}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Powrót do wyszukiwania
          </button>
        </div>
      </div>
    );
  }

  const rating = employer.avg_rating || 0;

  // Make handlers available to ContactTab
  (window as any).handleOpenContact = handleOpenContact;
  (window as any).handleOpenReviewModal = () => setIsReviewModalOpen(true);

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* 3D Background Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden perspective-container">
        <Animated3DProfileBackground role="employer" opacity={0.25} />
        <SpinningNumbers opacity={0.15} />
      </div>

      <div className="relative z-10">
        {/* Cover Image Header */}
        <div className="relative h-64 bg-gradient-to-r from-green-600 to-emerald-700">
          {employer.cover_image_url && (
            <img
              src={employer.cover_image_url}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>

          {/* Back button - only show when NOT embedded */}
          {!embedded && (
            <button
              onClick={() => navigate(-1)}
              className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Wstecz</span>
            </button>
          )}
        </div>

        {/* Profile Info */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Company Logo */}
              <div className="flex-shrink-0">
                {employer.logo_url ? (
                  <img
                    src={employer.logo_url}
                    alt={employer.company_name || "Company logo"}
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover bg-white"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-green-100 flex items-center justify-center">
                    <BuildingOfficeIcon className="w-16 h-16 text-green-600" />
                  </div>
                )}
              </div>

              {/* Company Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {employer.company_name || "Nazwa firmy"}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      {employer.industry && (
                        <span className="flex items-center gap-2 text-gray-600">
                          <Briefcase className="w-4 h-4" />
                          {employer.industry}
                        </span>
                      )}
                      {employer.city && (
                        <span className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {employer.city}
                          {employer.country ? `, ${employer.country}` : ""}
                        </span>
                      )}
                      {employer.company_size && (
                        <span className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4" />
                          {employer.company_size}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {employer.verified && (
                        <span className="flex items-center gap-1 bg-green-50 border-2 border-green-400 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                          <CheckCircleIcon className="w-4 h-4" />
                          Zweryfikowany
                        </span>
                      )}

                      {rating > 0 && (
                        <span className="flex items-center gap-1 bg-amber-50 border-2 border-amber-300 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          {rating.toFixed(1)} ({employer.rating_count || 0}{" "}
                          opinii)
                        </span>
                      )}

                      <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                        <Briefcase className="w-4 h-4" />
                        {jobs.length} aktywnych ofert
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate("/employers")}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-lg"
                  >
                    Zobacz oferty
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-1">
              {[
                { id: "about", label: "O firmie", icon: "📋" },
                {
                  id: "jobs",
                  label: `Oferty pracy (${
                    posts.filter((p) => p.type === "job_offer").length
                  })`,
                  icon: "💼",
                },
                {
                  id: "posts",
                  label: `Posty (${
                    posts.filter((p) => p.type !== "job_offer").length
                  })`,
                  icon: "📝",
                },
                { id: "contact", label: "Kontakt", icon: "📞" },
                {
                  id: "reviews",
                  label: `Opinie (${reviews.length})`,
                  icon: "⭐",
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-4 font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? "border-green-600 text-green-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {activeTab === "about" && <AboutTab employer={employer} />}
          {activeTab === "jobs" && (
            <JobsTab
              jobs={posts.filter((p) => p.type === "job_offer") as any}
              employer={employer}
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
              onPostUpdate={loadEmployerData}
            />
          )}
          {activeTab === "posts" && (
            <PostsTab
              posts={posts.filter((p) => p.type !== "job_offer")}
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
              onPostUpdate={loadEmployerData}
            />
          )}
          {activeTab === "contact" && (
            <ContactTab
              employer={employer}
              user={user}
              workerId={workerId}
              accountantId={accountantId}
              cleaningCompanyId={cleaningCompanyId}
              hasReviewed={hasReviewed}
            />
          )}
          {activeTab === "reviews" && (
            <ReviewsTab
              reviews={reviews}
              employer={employer}
              stats={reviewStats}
            />
          )}
        </div>

        {/* MODALS */}
        {/* Contact Modal */}
        {employer && (
          <Modal
            isOpen={isContactModalOpen}
            onClose={() => setIsContactModalOpen(false)}
            title={`Kontakt: ${employer.company_name}`}
            size="lg"
          >
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-green-800">
                  💡 <strong>Wskazówka:</strong> Opisz swoje doświadczenie,
                  umiejętności i dostępność. Zwiększysz szanse na odpowiedź!
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
                  placeholder="np. Zainteresowanie ofertą pracy - [stanowisko]"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                  placeholder={`Dzień dobry,\n\nJestem zainteresowany współpracą z Państwa firmą.\n\nMoje doświadczenie: \nUmiejętności: \nDostępność: \n\nW załączeniu CV.\n\nPozdrawiam`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                📨 Wyślij wiadomość
              </button>
            </div>
          </Modal>
        )}

        {/* Review Employer Modal */}
        {employer && (
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
              loadEmployerData(); // Reload reviews
            }}
          />
        )}
      </div>
    </div>
  );
}

// ==================== TAB COMPONENTS ====================

function AboutTab({ employer }: { employer: Employer }) {
  return (
    <div className="space-y-6">
      {/* Opis firmy */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">O firmie</h2>

        {employer.description ? (
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
              {employer.description}
            </p>
          </div>
        ) : (
          <p className="text-gray-500 italic">Brak opisu firmy</p>
        )}

        {employer.website && (
          <div className="mt-6 pt-6 border-t">
            <a
              href={employer.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
            >
              <Globe className="w-4 h-4" />
              Odwiedź stronę internetową
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        )}
      </div>

      {/* Kontakt */}
      <ContactCard employer={employer} />

      {/* Opinie Google */}
      <GoogleReviewsCard employer={employer} />

      {/* Lokalizacja */}
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

      {/* Szczegóły firmy */}
      <CompanyDetailsCard employer={employer} />
    </div>
  );
}

function JobsTab({
  jobs,
  employer,
  currentUserId,
  currentUserRole,
  onPostUpdate,
}: {
  jobs: any[];
  employer: Employer;
  currentUserId?: string;
  currentUserRole?: string;
  onPostUpdate: () => void;
}) {
  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Brak aktywnych ofert
        </h3>
        <p className="text-gray-600">
          Ta firma nie ma obecnie opublikowanych ofert pracy.
        </p>
      </div>
    );
  }

  const handleLike = async (postId: string) => {
    if (!currentUserId || !currentUserRole) return;
    try {
      await likePost(postId, currentUserId, currentUserRole as any);
      onPostUpdate();
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleShare = async (postId: string) => {
    if (!currentUserId || !currentUserRole) return;
    try {
      await sharePost(postId, currentUserId, currentUserRole as any);
      onPostUpdate();
    } catch (error) {
      console.error("Error sharing post:", error);
    }
  };

  return (
    <div className="space-y-6">
      {jobs.map((job) => (
        <PostCardPremium
          key={job.id}
          post={job}
          onLike={() => handleLike(job.id)}
          onComment={() => {}}
          onShare={() => handleShare(job.id)}
          onReactionChange={() => {}}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
        />
      ))}
    </div>
  );
}

function PostsTab({
  posts,
  currentUserId,
  currentUserRole,
  onPostUpdate,
}: {
  posts: Post[];
  currentUserId?: string;
  currentUserRole?: string;
  onPostUpdate: () => void;
}) {
  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Brak postów
        </h3>
        <p className="text-gray-600">
          Ten pracodawca nie opublikował jeszcze żadnych postów.
        </p>
      </div>
    );
  }

  const handleLike = async (postId: string) => {
    if (!currentUserId || !currentUserRole) return;
    try {
      await likePost(postId, currentUserId, currentUserRole as any);
      onPostUpdate();
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleShare = async (postId: string) => {
    if (!currentUserId || !currentUserRole) return;
    try {
      await sharePost(postId, currentUserId, currentUserRole as any);
      onPostUpdate();
    } catch (error) {
      console.error("Error sharing post:", error);
    }
  };

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCardPremium
          key={post.id}
          post={post}
          onLike={() => handleLike(post.id)}
          onComment={() => {}}
          onShare={() => handleShare(post.id)}
          onReactionChange={() => {}}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
        />
      ))}
    </div>
  );
}

function ContactTab({
  employer,
  user,
  workerId,
  accountantId,
  cleaningCompanyId,
  hasReviewed,
}: {
  employer: Employer;
  user: any;
  workerId: string | null;
  accountantId: string | null;
  cleaningCompanyId: string | null;
  hasReviewed: boolean;
}) {
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
              Nazwa firmy
            </label>
            <p className="text-lg text-gray-900">{employer.company_name}</p>
          </div>

          {employer.contact_email && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <a
                href={`mailto:${employer.contact_email}`}
                className="text-lg text-green-600 hover:text-green-700 hover:underline flex items-center gap-2"
              >
                <Mail className="w-5 h-5" />
                {employer.contact_email}
              </a>
            </div>
          )}

          {employer.contact_phone && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon
              </label>
              <a
                href={`tel:${employer.contact_phone}`}
                className="text-lg text-green-600 hover:text-green-700 hover:underline flex items-center gap-2"
              >
                <Phone className="w-5 h-5" />
                {employer.contact_phone}
              </a>
            </div>
          )}

          {(employer.city || employer.address) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adres
              </label>
              <p className="text-lg text-gray-900 flex items-start gap-2">
                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                <span>
                  {employer.address && (
                    <>
                      {employer.address}
                      <br />
                    </>
                  )}
                  {employer.city}, {employer.country}
                </span>
              </p>
            </div>
          )}

          {employer.website && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Strona internetowa
              </label>
              <a
                href={employer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg text-green-600 hover:text-green-700 hover:underline flex items-center gap-2"
              >
                <Globe className="w-5 h-5" />
                {employer.website}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        {/* Company registration */}
        {(employer.kvk_number || employer.btw_number) && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Dane rejestracyjne
            </h3>
            <div className="space-y-2 text-sm">
              {employer.kvk_number && (
                <div className="flex justify-between">
                  <span className="text-gray-600">KVK:</span>
                  <span className="text-gray-900 font-medium">
                    {employer.kvk_number}
                  </span>
                </div>
              )}
              {employer.btw_number && (
                <div className="flex justify-between">
                  <span className="text-gray-600">BTW:</span>
                  <span className="text-gray-900 font-medium">
                    {employer.btw_number}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Contact Card */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Wyślij wiadomość
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Zainteresowany pracą w {employer.company_name}? Skontaktuj się przez
          platformę:
        </p>

        {/* Message Action */}
        <div className="space-y-3">
          <button
            onClick={() => (window as any).handleOpenContact?.()}
            className="block w-full bg-green-600 text-white text-center py-3 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm hover:shadow-md"
          >
            📨 Wyślij wiadomość
          </button>

          {/* Review Button */}
          <button
            onClick={() => (window as any).handleOpenReviewModal?.()}
            disabled={
              !user ||
              (!workerId && !accountantId && !cleaningCompanyId) ||
              hasReviewed
            }
            className={`block w-full text-white text-center py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md ${
              !user ||
              (!workerId && !accountantId && !cleaningCompanyId) ||
              hasReviewed
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-orange-600 hover:bg-orange-700"
            }`}
            title={
              !user
                ? "Zaloguj się, aby wystawić opinię"
                : !workerId && !accountantId && !cleaningCompanyId
                ? "Tylko pracownicy, księgowi i firmy sprzątające mogą wystawiać opinie"
                : hasReviewed
                ? "Już wystawiłeś opinię o tym pracodawcy"
                : "Wystaw opinię o tym pracodawcy"
            }
          >
            {hasReviewed ? "✓ Już wystawiłeś opinię" : "⭐ Wystaw opinię"}
            {!user && " (zaloguj się)"}
            {user &&
              !workerId &&
              !accountantId &&
              !cleaningCompanyId &&
              " (tylko dla pracowników)"}
          </button>
        </div>

        {/* Direct contact fallback */}
        <div className="mt-4 pt-4 border-t border-green-200">
          <p className="text-xs text-gray-600 mb-2">
            Lub skontaktuj się bezpośrednio:
          </p>
          <div className="space-y-2">
            {employer.contact_phone && (
              <a
                href={`tel:${employer.contact_phone}`}
                className="block text-sm text-green-600 hover:text-green-700 hover:underline"
              >
                📞 {employer.contact_phone}
              </a>
            )}
            {employer.contact_email && (
              <a
                href={`mailto:${employer.contact_email}`}
                className="block text-sm text-green-600 hover:text-green-700 hover:underline"
              >
                ✉️ {employer.contact_email}
              </a>
            )}
            {employer.website && (
              <a
                href={employer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 hover:underline"
              >
                🌐 {employer.website}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Company info */}
        {employer.company_size && (
          <div className="mt-6 pt-6 border-t border-green-200">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-green-600 mb-1">
                {employer.company_size}
              </div>
              <div className="text-sm text-gray-600">wielkość firmy</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== SIDEBAR COMPONENTS ====================

function ContactCard({ employer }: { employer: Employer }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Kontakt</h3>

      <div className="space-y-3">
        {employer.contact_email && (
          <a
            href={`mailto:${employer.contact_email}`}
            className="flex items-center gap-3 text-gray-700 hover:text-green-600 transition-colors"
          >
            <Mail className="w-5 h-5 text-gray-400" />
            <span className="text-sm">{employer.contact_email}</span>
          </a>
        )}

        {employer.contact_phone && (
          <a
            href={`tel:${employer.contact_phone}`}
            className="flex items-center gap-3 text-gray-700 hover:text-green-600 transition-colors"
          >
            <Phone className="w-5 h-5 text-gray-400" />
            <span className="text-sm">{employer.contact_phone}</span>
          </a>
        )}

        {employer.website && (
          <a
            href={employer.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-gray-700 hover:text-green-600 transition-colors"
          >
            <Globe className="w-5 h-5 text-gray-400" />
            <span className="text-sm break-all">
              {employer.website.replace(/^https?:\/\//, "")}
            </span>
          </a>
        )}
      </div>
    </div>
  );
}

function CompanyDetailsCard({ employer }: { employer: Employer }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Szczegóły firmy</h3>

      <div className="space-y-3">
        {/* Company Type Badge */}
        {employer.company_type && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Forma prawna</div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                employer.company_type === "B.V."
                  ? "bg-green-100 text-green-800"
                  : employer.company_type === "Uitzendbureau"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {employer.company_type}
            </span>
          </div>
        )}

        {employer.industry && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Branża</div>
            <div className="text-sm font-medium text-gray-900">
              {employer.industry}
            </div>
          </div>
        )}

        {employer.company_size && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Wielkość firmy</div>
            <div className="text-sm font-medium text-gray-900">
              {employer.company_size}
            </div>
          </div>
        )}

        {/* Company Numbers */}
        {employer.kvk_number && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Numer KVK</div>
            <div className="text-sm font-medium text-gray-900">
              {employer.kvk_number}
            </div>
          </div>
        )}

        {employer.btw_number && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Numer BTW/VAT</div>
            <div className="text-sm font-medium text-gray-900">
              {employer.btw_number}
            </div>
          </div>
        )}

        {employer.rsin_number && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Numer RSIN</div>
            <div className="text-sm font-medium text-gray-900">
              {employer.rsin_number}
            </div>
          </div>
        )}

        <div>
          <div className="text-xs text-gray-500 mb-1">Data dołączenia</div>
          <div className="text-sm font-medium text-gray-900">
            {new Date(employer.created_at).toLocaleDateString("pl-PL", {
              year: "numeric",
              month: "long",
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleReviewsCard({ employer }: { employer: Employer }) {
  if (!employer.google_rating || employer.google_rating === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Opinie Google</h3>

      <div className="flex items-center gap-4 mb-4">
        <div className="text-4xl font-bold text-amber-600">
          {employer.google_rating.toFixed(1)}
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < Math.round(employer.google_rating!)
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          {employer.google_review_count !== null &&
            employer.google_review_count > 0 && (
              <div className="text-sm text-gray-600">
                {employer.google_review_count}{" "}
                {employer.google_review_count === 1 ? "opinia" : "opinii"}
              </div>
            )}
        </div>
      </div>

      {employer.google_maps_url && (
        <a
          href={employer.google_maps_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
        >
          Czytaj opinie na Google
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      )}
    </div>
  );
}

// ==================== REVIEWS TAB ====================

function ReviewsTab({
  reviews,
  employer,
  stats,
}: {
  reviews: any[];
  employer: Employer;
  stats: EmployerReviewStats | null;
}) {
  return (
    <div className="space-y-6">
      {/* Reviews Stats Widget */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Statystyki ocen
        </h3>

        {/* Overall rating */}
        <div className="flex items-center gap-8 mb-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900">
              {stats?.average_rating.toFixed(1) || "0.0"}
            </div>
            <div className="flex gap-1 my-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(stats?.average_rating || 0)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-gray-600">
              {stats?.total_reviews || 0}{" "}
              {stats?.total_reviews === 1 ? "opinia" : "opinii"}
            </div>
          </div>

          {reviews.length > 0 && stats && (
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Średnie oceny szczegółowe
              </h4>
              <div className="grid grid-cols-3 gap-4">
                {stats.average_communication > 0 && (
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-900">
                      Komunikacja
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      {stats.average_communication.toFixed(1)}
                    </div>
                    <div className="flex gap-1 justify-center mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= Math.round(stats.average_communication)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {stats.average_professionalism > 0 && (
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-sm font-medium text-purple-900">
                      Profesjonalizm
                    </div>
                    <div className="text-2xl font-bold text-purple-700">
                      {stats.average_professionalism.toFixed(1)}
                    </div>
                    <div className="flex gap-1 justify-center mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= Math.round(stats.average_professionalism)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {stats.average_payment > 0 && (
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-sm font-medium text-green-900">
                      Terminowość płatności
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      {stats.average_payment.toFixed(1)}
                    </div>
                    <div className="flex gap-1 justify-center mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= Math.round(stats.average_payment)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {stats.recommendation_percentage > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg text-center">
                  <div className="text-sm text-green-900 font-medium">
                    👍 {stats.recommendation_percentage.toFixed(0)}% osób poleca
                    tego pracodawcę
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-gray-400 text-5xl mb-4">⭐</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Brak opinii</h3>
          <p className="text-gray-600 mb-6">
            {employer.company_name || "Ten pracodawca"} nie ma jeszcze opinii.
          </p>
          <p className="text-sm text-gray-500">
            Aby wystawić opinię, przejdź do zakładki "Kontakt"
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
            >
              <div className="flex gap-4">
                {/* Avatar */}
                {(review as any).profiles?.avatar_url ||
                (review as any).workers?.workers_profile?.avatar_url ||
                (review as any).cleaning_companies?.avatar_url ||
                (review as any).accountants?.avatar_url ? (
                  <img
                    src={
                      (review as any).profiles?.avatar_url ||
                      (review as any).workers?.workers_profile?.avatar_url ||
                      (review as any).cleaning_companies?.avatar_url ||
                      (review as any).accountants?.avatar_url
                    }
                    alt="Reviewer"
                    className="w-12 h-12 rounded-full object-cover shadow-md flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {(
                      (review as any).profiles?.full_name ||
                      (review as any).workers?.workers_profile?.full_name ||
                      (review as any).cleaning_companies?.company_name ||
                      (review as any).accountants?.company_name ||
                      "U"
                    )
                      ?.substring(0, 1)
                      .toUpperCase() || "U"}
                  </div>
                )}

                {/* Review Content */}
                <div className="flex-1">
                  {/* Header: Name + Rating + Date */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900">
                          {(review as any).profiles?.full_name ||
                            (review as any).workers?.workers_profile
                              ?.full_name ||
                            (review as any).cleaning_companies?.company_name ||
                            (review as any).accountants?.company_name ||
                            "Użytkownik anonimowy"}
                        </h4>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString(
                          "pl-PL"
                        )}
                      </span>
                    </div>

                    {review.would_recommend && (
                      <div className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                        <span>👍</span>
                        Poleca
                      </div>
                    )}
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                      {review.comment}
                    </p>
                  )}

                  {/* Detailed Ratings */}
                  {(review.professionalism_rating ||
                    review.communication_rating ||
                    review.payment_rating) && (
                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                      {review.professionalism_rating && (
                        <div className="text-center">
                          <div className="text-sm text-gray-600 mb-1">
                            Profesjonalizm
                          </div>
                          <div className="flex gap-0.5 justify-center">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  s <= review.professionalism_rating
                                    ? "fill-yellow-400 text-yellow-400"
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
                          <div className="flex gap-0.5 justify-center">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  s <= review.communication_rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {review.payment_rating && (
                        <div className="text-center">
                          <div className="text-sm text-gray-600 mb-1">
                            Terminowość płatności
                          </div>
                          <div className="flex gap-0.5 justify-center">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  s <= review.payment_rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
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
}

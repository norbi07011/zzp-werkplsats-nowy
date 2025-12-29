/**
 * AccountantPublicProfilePageModern - Nowoczesny profil księgowego
 * Wykorzystuje ModernPublicProfile dla spójnego designu
 */
import { useState, useEffect, ReactNode, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getAccountantReviews } from "../../src/services/accountantReviewService";
import {
  getAccountant,
  getAccountantServices,
  getUnavailableDates,
  getAvailability,
  type Accountant,
  type AccountantService,
  type AccountantReview,
} from "../../src/services/accountantService";
import {
  fetchPublicAccountantForms,
  submitFormRequest,
  type AccountantForm,
} from "../../src/services/accountantFormService";
import type { UnavailableDate } from "../../types";
import {
  getPosts,
  likePost,
  reactToPost,
  unreactToPost,
  type ReactionType,
} from "../../src/services/feedService";
import { PostCardPremium } from "../FeedPage_PREMIUM";
import { Modal } from "../../components/Modal";
import {
  ModernPublicProfile,
  type ProfileStatCard,
  type SkillTag,
} from "../../components/ModernPublicProfile";
import {
  Star,
  MapPin,
  Mail,
  Phone,
  Globe,
  Briefcase,
  Award,
  Calendar,
  MessageSquare,
  Users,
  CheckCircleIcon,
  User,
  ExternalLink,
} from "../../components/icons";
import { AddToTeamButton } from "../../components/AddToTeamButton";
import { InviteToAccountantTeamButton } from "../../src/modules/accountant-team/components/InviteToAccountantTeamButton";
import { useAuth } from "../../contexts/AuthContext";
import { ReviewAccountantModal } from "../../src/components/employer/ReviewAccountantModal";

// =====================================================
// INTERFACES
// =====================================================
interface AccountantProfilePageProps {
  accountantId?: string;
  embedded?: boolean;
}

// Form type labels
const FORM_TYPE_LABELS: Record<string, string> = {
  callback: "📞 Prośba o kontakt",
  registration: "📝 Rejestracja firmy",
  administration: "📊 Administracja",
  vat: "💶 Deklaracja VAT",
  annual: "📋 Rozliczenie roczne",
  payroll: "👥 Rozliczenie kadrowe",
  consultation: "💬 Konsultacja",
  audit: "🔍 Audyt finansowy",
  financing: "💰 Finansowanie",
};

// =====================================================
// MAIN COMPONENT
// =====================================================
export default function AccountantPublicProfilePageModern({
  accountantId: propId,
  embedded = false,
}: AccountantProfilePageProps) {
  const { id: urlId } = useParams<{ id: string }>();
  const id = propId || urlId;
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  // State
  const [accountant, setAccountant] = useState<Accountant | null>(null);
  const [services, setServices] = useState<AccountantService[]>([]);
  const [forms, setForms] = useState<AccountantForm[]>([]);
  const [reviews, setReviews] = useState<AccountantReview[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [unavailableDates, setUnavailableDates] = useState<UnavailableDate[]>(
    []
  );
  const [availability, setAvailability] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [employerId, setEmployerId] = useState<string | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showProjectDetail, setShowProjectDetail] = useState(false);

  // Modals
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [selectedForm, setSelectedForm] = useState<AccountantForm | null>(null);

  // =====================================================
  // DATA LOADING
  // =====================================================
  useEffect(() => {
    if (id) {
      loadAccountantData();
    }
  }, [id]);

  useEffect(() => {
    const loadEmployerId = async () => {
      if (authUser && authUser.role === "employer") {
        try {
          const { data, error } = await supabase
            .from("employers")
            .select("id")
            .eq("profile_id", authUser.id)
            .maybeSingle();

          if (!error && data) {
            setEmployerId(data.id);
          }
        } catch (err) {
          console.error("Error loading employer ID:", err);
        }
      }
    };
    loadEmployerId();
  }, [authUser]);

  useEffect(() => {
    if (id) {
      trackProfileView();
    }
  }, [id, employerId]);

  // Calculate review stats - MUST be before any conditional returns or render functions
  const reviewStats = useMemo(() => {
    if (reviews.length === 0) return null;

    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    const profReviews = reviews.filter((r) => r.professionalism_rating);
    const avgProfessionalism =
      profReviews.length > 0
        ? profReviews.reduce(
            (sum, r) => sum + (r.professionalism_rating || 0),
            0
          ) / profReviews.length
        : 0;

    const commReviews = reviews.filter((r) => r.communication_rating);
    const avgCommunication =
      commReviews.length > 0
        ? commReviews.reduce(
            (sum, r) => sum + (r.communication_rating || 0),
            0
          ) / commReviews.length
        : 0;

    const qualReviews = reviews.filter((r) => r.quality_rating);
    const avgQuality =
      qualReviews.length > 0
        ? qualReviews.reduce((sum, r) => sum + (r.quality_rating || 0), 0) /
          qualReviews.length
        : 0;

    const timeReviews = reviews.filter((r) => r.timeliness_rating);
    const avgTimeliness =
      timeReviews.length > 0
        ? timeReviews.reduce((sum, r) => sum + (r.timeliness_rating || 0), 0) /
          timeReviews.length
        : 0;

    const recommendCount = reviews.filter((r) => r.would_recommend).length;
    const recommendPercentage =
      reviews.length > 0 ? (recommendCount / reviews.length) * 100 : 0;

    return {
      average_rating: avgRating,
      total_reviews: reviews.length,
      average_professionalism: avgProfessionalism,
      average_communication: avgCommunication,
      average_quality: avgQuality,
      average_timeliness: avgTimeliness,
      recommendation_percentage: recommendPercentage,
    };
  }, [reviews]);

  const trackProfileView = async () => {
    if (!id) return;
    try {
      await (supabase as any).from("profile_views").insert({
        accountant_id: id,
        employer_id: employerId || null,
        viewed_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error tracking profile view:", error);
    }
  };

  const loadAccountantData = async () => {
    if (!id) return;

    try {
      const accountantData = await getAccountant(id);
      if (!accountantData) {
        throw new Error("Accountant not found");
      }
      setAccountant(accountantData);

      const actualAccountantId = accountantData.id;

      const [
        servicesData,
        formsData,
        reviewsData,
        unavailableData,
        availabilityData,
        postsData,
        portfolioData,
      ] = await Promise.all([
        getAccountantServices(actualAccountantId),
        fetchPublicAccountantForms(actualAccountantId),
        getAccountantReviews(actualAccountantId),
        getUnavailableDates(accountantData.profile_id),
        getAvailability(accountantData.profile_id),
        getPosts({ author_id: actualAccountantId, author_type: "accountant" }),
        (supabase as any)
          .from("accountant_portfolio")
          .select("*")
          .eq("accountant_id", actualAccountantId)
          .eq("is_public", true)
          .order("created_at", { ascending: false }),
      ]);

      setServices(servicesData);
      setForms(formsData);
      setReviews(reviewsData.success ? reviewsData.reviews || [] : []);
      setUnavailableDates(unavailableData);
      setAvailability(availabilityData);
      setPosts(postsData || []);
      setPortfolio(portfolioData.data || []);

      // Check if user already reviewed
      if (authUser && accountantData?.id) {
        const { data: existingReview } = await (supabase as any)
          .from("accountant_reviews")
          .select("id")
          .eq("accountant_id", accountantData.id)
          .eq("reviewer_id", authUser.id)
          .maybeSingle();

        setHasReviewed(!!existingReview);
      }
    } catch (error) {
      console.error("Error loading accountant:", error);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // HANDLERS
  // =====================================================
  const handleOpenContact = () => {
    if (!authUser) {
      alert("Zaloguj się aby wysłać wiadomość do księgowego");
      return;
    }
    setIsContactModalOpen(true);
  };

  const handleSendContact = async () => {
    if (!contactSubject.trim() || !contactMessage.trim()) {
      alert("Proszę wypełnić wszystkie pola");
      return;
    }

    if (!authUser?.id || !accountant?.profile_id) {
      alert("❌ Błąd: brak danych użytkownika lub księgowego");
      return;
    }

    try {
      const { error } = await (supabase as any).from("messages").insert({
        sender_id: authUser.id,
        recipient_id: accountant.profile_id,
        subject: contactSubject,
        content: contactMessage,
        is_read: false,
      });

      if (error) throw error;

      alert(
        `✅ Wiadomość wysłana do ${
          accountant.company_name || accountant.full_name
        }!`
      );
      setIsContactModalOpen(false);
      setContactSubject("");
      setContactMessage("");
    } catch (err: any) {
      console.error("Error sending message:", err);
      alert(`❌ Nie udało się wysłać wiadomości: ${err.message}`);
    }
  };

  const handleOpenReview = async () => {
    if (!authUser) {
      alert("Zaloguj się, aby wystawić opinię");
      return;
    }

    if (!accountant?.id) {
      alert("⚠️ Ładowanie danych... Spróbuj ponownie za chwilę.");
      return;
    }

    try {
      const { data: existingReview, error } = await (supabase as any)
        .from("accountant_reviews")
        .select("id, rating, created_at")
        .eq("reviewer_id", authUser.id)
        .eq("accountant_id", accountant.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking existing review:", error);
      }

      if (existingReview) {
        const reviewDate = existingReview.created_at
          ? new Date(existingReview.created_at).toLocaleDateString("pl-PL")
          : "nieznana data";
        const confirmed = confirm(
          `⚠️ Już wystawiłeś opinię dla ${
            accountant.company_name || accountant.full_name
          } (${
            existingReview.rating
          }⭐, ${reviewDate}).\n\nCzy chcesz kontynuować mimo to?`
        );
        if (!confirmed) return;
      }
    } catch (err) {
      console.error("Error checking review:", err);
    }

    setIsReviewModalOpen(true);
  };

  // =====================================================
  // RENDER HELPERS
  // =====================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-24 h-24 bg-slate-200 rounded-xl"></div>
          <div className="h-6 w-48 bg-slate-200 rounded"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!accountant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Księgowy nie znaleziony
          </h2>
          <p className="text-slate-600 mb-6">
            Ten profil nie istnieje lub został usunięty
          </p>
          <Link
            to="/accountants"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-medium"
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
  const totalActiveOffers = services.length + forms.length;

  const stats: ProfileStatCard[] = [
    {
      value: totalActiveOffers,
      label: "OFERTY",
    },
    {
      value:
        reviews.length > 0
          ? `${(
              reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            ).toFixed(1)} (${reviews.length})`
          : "0.0",
      label: "OCENA",
    },
    {
      value: accountant.years_experience || 0,
      label: "LAT DOŚWIADCZENIA",
    },
  ];

  const skills: SkillTag[] = (accountant.specializations || []).map(
    (s: string) => ({
      name: s,
      level: "expert" as const,
    })
  );

  const languages = accountant.languages || [];

  const jobOffers = posts.filter((p) => p.type === "job_offer");
  const regularPosts = posts.filter((p) => p.type !== "job_offer");

  // =====================================================
  // TAB CONTENT COMPONENTS
  // =====================================================
  const ServicesTabContent = () => (
    <div className="space-y-6">
      {/* Service Forms */}
      {forms.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-500" />
            Formularze kontaktowe
          </h3>
          <p className="text-slate-600 mb-4 text-sm">
            Wybierz formularz odpowiedni do Twojej sprawy - księgowy odpowie tak
            szybko jak to możliwe
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {forms.map((form) => (
              <button
                key={form.id}
                onClick={() => setSelectedForm(form)}
                className="bg-slate-50 rounded-xl p-4 text-left hover:bg-amber-50 transition-colors border border-slate-200 hover:border-amber-300 group cursor-pointer"
              >
                <div className="text-2xl mb-2">
                  {FORM_TYPE_LABELS[form.form_type]?.split(" ")[0] || "📋"}
                </div>
                <h4 className="font-semibold text-slate-800 group-hover:text-amber-600">
                  {form.form_name}
                </h4>
                <p className="text-sm text-slate-500 mt-1">
                  {(form.form_fields as any[])?.length || 0} pól do wypełnienia
                </p>
                {form.requires_approval && (
                  <span className="inline-block mt-2 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                    Wymaga zatwierdzenia
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Services List */}
      {services.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-amber-500" />
            Cennik usług
          </h3>
          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-slate-50 rounded-xl p-4 border border-slate-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-800">
                      {service.name}
                    </h4>
                    {service.description && (
                      <p className="text-sm text-slate-600 mt-1">
                        {service.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-amber-600">
                      €
                      {(service as any).price ||
                        (service as any).base_price ||
                        0}
                    </span>
                    <span className="text-sm text-slate-500 ml-1">
                      /
                      {(service as any).price_type === "hourly"
                        ? "uur"
                        : "vast"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {forms.length === 0 && services.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">Brak usług do wyświetlenia</p>
        </div>
      )}
    </div>
  );

  const handleReactionChange = async (
    postId: string,
    reactionType: ReactionType | null
  ) => {
    if (!authUser?.id) return;
    try {
      if (reactionType === null) {
        await unreactToPost(postId, authUser.id);
      } else {
        await reactToPost(
          postId,
          authUser.id,
          authUser.role as any,
          authUser.id,
          reactionType
        );
      }
    } catch (error) {
      console.error("Error changing reaction:", error);
    }
  };

  const JobsTabContent = () => (
    <div className="space-y-4">
      {jobOffers.length > 0 ? (
        jobOffers.map((post: any) => (
          <PostCardPremium
            key={post.id}
            post={post}
            onLike={async () => {
              if (!authUser?.id || !authUser?.role) return;
              await likePost(post.id, authUser.id, authUser.role as any);
            }}
            onComment={() => {}}
            onShare={() => {}}
            onReactionChange={(reactionType) =>
              handleReactionChange(post.id, reactionType)
            }
            currentUserId={authUser?.id}
            currentUserRole={authUser?.role}
          />
        ))
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <Briefcase className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">Brak ofert pracy</p>
        </div>
      )}
    </div>
  );

  const PostsTabContent = () => (
    <div className="space-y-4">
      {regularPosts.length > 0 ? (
        regularPosts.map((post: any) => (
          <PostCardPremium
            key={post.id}
            post={post}
            onLike={async () => {
              if (!authUser?.id || !authUser?.role) return;
              await likePost(post.id, authUser.id, authUser.role as any);
            }}
            onComment={() => {}}
            onShare={() => {}}
            onReactionChange={(reactionType) =>
              handleReactionChange(post.id, reactionType)
            }
            currentUserId={authUser?.id}
            currentUserRole={authUser?.role}
          />
        ))
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">Brak postów</p>
        </div>
      )}
    </div>
  );

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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                {reviewStats.average_quality > 0 && (
                  <div className="text-center p-3 bg-emerald-50 rounded-lg">
                    <div className="text-sm font-medium text-emerald-900">
                      Jakość usług
                    </div>
                    <div className="text-2xl font-bold text-emerald-700">
                      {reviewStats.average_quality.toFixed(1)}
                    </div>
                  </div>
                )}
                {reviewStats.average_timeliness > 0 && (
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-sm font-medium text-orange-900">
                      Terminowość
                    </div>
                    <div className="text-2xl font-bold text-orange-700">
                      {reviewStats.average_timeliness.toFixed(1)}
                    </div>
                  </div>
                )}
              </div>

              {reviewStats.recommendation_percentage > 0 && (
                <div className="mt-4 p-3 bg-emerald-50 rounded-lg text-center">
                  <div className="text-sm text-emerald-900 font-medium">
                    👍 {reviewStats.recommendation_percentage.toFixed(0)}% osób
                    poleca tego księgowego
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Review Button */}
      {authUser && (
        <button
          onClick={handleOpenReview}
          className="w-full py-3 bg-amber-100 text-amber-700 rounded-xl font-medium hover:bg-amber-200 transition-colors flex items-center justify-center gap-2"
        >
          <Star className="w-5 h-5" />
          Wystaw opinię
        </button>
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <div
              key={review.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
            >
              <div className="flex gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 overflow-hidden">
                  {review.profiles?.avatar_url ? (
                    <img
                      src={review.profiles.avatar_url}
                      alt="Reviewer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (review.reviewer_name || "A").substring(0, 1).toUpperCase()
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900">
                          {review.reviewer_name || "Anonimowy"}
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

                  {/* Detailed Ratings */}
                  {(review.professionalism_rating ||
                    review.communication_rating ||
                    review.quality_rating ||
                    review.timeliness_rating) && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 mt-4 border-t border-slate-100">
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
                      {review.quality_rating && (
                        <div className="text-center">
                          <div className="text-xs text-slate-500 mb-1">
                            Jakość usług
                          </div>
                          <div className="flex gap-0.5 justify-center">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  s <= review.quality_rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-slate-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {review.timeliness_rating && (
                        <div className="text-center">
                          <div className="text-xs text-slate-500 mb-1">
                            Terminowość
                          </div>
                          <div className="flex gap-0.5 justify-center">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  s <= review.timeliness_rating
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
      ) : (
        <div className="text-center py-8 bg-slate-50 rounded-xl">
          <Star className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">Brak opinii</p>
        </div>
      )}
    </div>
  );

  const ContactTabContent = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Contact Info */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-amber-500" />
          Dane kontaktowe
        </h3>

        <div className="space-y-4">
          <div>
            <div className="text-xs text-slate-500 mb-1">Nazwa firmy</div>
            <div className="text-lg font-semibold text-slate-900">
              {accountant.company_name || accountant.full_name}
            </div>
          </div>

          {accountant.full_name && accountant.company_name && (
            <div>
              <div className="text-xs text-slate-500 mb-1">
                Osoba kontaktowa
              </div>
              <div className="flex items-center gap-2 text-slate-900">
                <User className="w-4 h-4 text-slate-400" />
                {accountant.full_name}
              </div>
            </div>
          )}

          {accountant.email && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Email</div>
              <a
                href={`mailto:${accountant.email}`}
                className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
              >
                <Mail className="w-4 h-4" />
                {accountant.email}
              </a>
            </div>
          )}

          {accountant.phone && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Telefon</div>
              <a
                href={`tel:${accountant.phone}`}
                className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
              >
                <Phone className="w-4 h-4" />
                {accountant.phone}
              </a>
            </div>
          )}

          {(accountant.address || accountant.city) && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Adres</div>
              <div className="flex items-start gap-2 text-slate-900">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <span>
                  {accountant.address && (
                    <>
                      {accountant.address}
                      <br />
                    </>
                  )}
                  {accountant.postal_code} {accountant.city}
                  {accountant.country && `, ${accountant.country}`}
                </span>
              </div>
            </div>
          )}

          {accountant.website && (
            <div>
              <div className="text-xs text-slate-500 mb-1">
                Strona internetowa
              </div>
              <a
                href={accountant.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
              >
                <Globe className="w-4 h-4" />
                {accountant.website.replace(/^https?:\/\//, "")}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Registration Data */}
        {(accountant.kvk_number || accountant.btw_number) && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="text-xs text-slate-500 font-medium mb-3">
              DANE REJESTRACYJNE
            </div>
            <div className="space-y-2 text-sm">
              {accountant.kvk_number && (
                <div className="flex justify-between">
                  <span className="text-slate-500">KVK:</span>
                  <span className="font-mono font-medium text-slate-900">
                    {accountant.kvk_number}
                  </span>
                </div>
              )}
              {accountant.btw_number && (
                <div className="flex justify-between">
                  <span className="text-slate-500">BTW:</span>
                  <span className="font-mono font-medium text-slate-900">
                    {accountant.btw_number}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">
          Skontaktuj się
        </h3>
        <p className="text-sm text-slate-600 mb-6">
          Zainteresowany usługami{" "}
          {accountant.company_name || accountant.full_name}? Wyślij wiadomość
          przez platformę:
        </p>

        <div className="space-y-3">
          <button
            onClick={handleOpenContact}
            className="w-full bg-amber-600 text-white text-center py-3 rounded-xl font-medium hover:bg-amber-700 transition-colors shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-5 h-5" />
            Wyślij wiadomość
          </button>

          <button
            onClick={() => setIsReviewModalOpen(true)}
            disabled={!authUser || hasReviewed}
            className={`w-full text-center py-3 rounded-xl font-medium transition-colors shadow-sm flex items-center justify-center gap-2 ${
              !authUser || hasReviewed
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            <Star className="w-5 h-5" />
            {hasReviewed ? "Już wystawiłeś opinię" : "Wystaw opinię"}
          </button>
        </div>

        {/* Stats */}
        <div className="mt-6 pt-6 border-t border-amber-200">
          <div className="grid grid-cols-2 gap-4">
            {accountant.years_experience && (
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <Briefcase className="w-6 h-6 mx-auto mb-2 text-amber-600" />
                <div className="text-2xl font-bold text-slate-900">
                  {accountant.years_experience}
                </div>
                <div className="text-xs text-slate-600">lat doświadczenia</div>
              </div>
            )}
            {totalActiveOffers > 0 && (
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <Briefcase className="w-6 h-6 mx-auto mb-2 text-amber-600" />
                <div className="text-2xl font-bold text-slate-900">
                  {totalActiveOffers}
                </div>
                <div className="text-xs text-slate-600">ofert</div>
              </div>
            )}
          </div>
        </div>

        {/* Contact shortcuts */}
        {(accountant.phone || accountant.email) && (
          <div className="mt-4 pt-4 border-t border-amber-200">
            <div className="text-xs text-slate-500 font-medium mb-3">
              LUB SKONTAKTUJ SIĘ BEZPOŚREDNIO
            </div>
            <div className="space-y-2">
              {accountant.phone && (
                <a
                  href={`tel:${accountant.phone}`}
                  className="flex items-center gap-2 text-sm text-slate-700 hover:text-amber-600"
                >
                  <Phone className="w-4 h-4" />
                  {accountant.phone}
                </a>
              )}
              {accountant.email && (
                <a
                  href={`mailto:${accountant.email}`}
                  className="flex items-center gap-2 text-sm text-slate-700 hover:text-amber-600"
                >
                  <Mail className="w-4 h-4" />
                  {accountant.email}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // =====================================================
  // SIDEBAR EXTRA CONTENT
  // =====================================================
  const SidebarExtra = () => (
    <>
      {/* Invite to Accountant Team */}
      {authUser?.role === "accountant" && accountant?.id && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-4">
          <h4 className="text-sm font-bold text-slate-800 mb-2">
            Zaproś do zespołu
          </h4>
          <p className="text-xs text-slate-600 mb-3">
            Zaproś {accountant.company_name || accountant.full_name} do swojego
            zespołu
          </p>
          <InviteToAccountantTeamButton
            targetAccountantId={accountant.id}
            targetAccountantEmail={accountant.email}
            targetAccountantName={
              accountant.company_name ||
              accountant.full_name ||
              accountant.email
            }
            className="w-full"
          />
        </div>
      )}

      {/* Add to Team for Employers */}
      {authUser?.role === "employer" && accountant?.id && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
          <h4 className="text-sm font-bold text-slate-800 mb-2">
            Współpraca w projekcie
          </h4>
          <p className="text-xs text-slate-600 mb-3">
            Zaproś {accountant.company_name || accountant.full_name} do projektu
          </p>
          <AddToTeamButton
            userId={accountant.id}
            userEmail={accountant.email}
            userType="accountant"
            displayName={
              accountant.company_name ||
              accountant.full_name ||
              accountant.email
            }
            avatarUrl={accountant.avatar_url}
            className="w-full"
          />
        </div>
      )}

      {/* Availability Card */}
      {availability && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h4 className="font-bold text-slate-800 mb-3 uppercase text-sm tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            Dostępność
          </h4>
          <div className="space-y-2 text-sm">
            {Object.entries(availability).map(
              ([day, hours]: [string, any]) =>
                hours && (
                  <div key={day} className="flex justify-between">
                    <span className="text-slate-600 capitalize">{day}</span>
                    <span className="font-medium text-slate-800">{hours}</span>
                  </div>
                )
            )}
          </div>
        </div>
      )}
    </>
  );

  // =====================================================
  // CUSTOM TABS
  // =====================================================

  // About Tab Content - NEW
  const AboutTabContent = () => (
    <div className="space-y-6">
      {/* Bio */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-3">O mnie</h3>
        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
          {accountant.bio ||
            (accountant as any).description ||
            "Ten księgowy nie dodał jeszcze opisu"}
        </p>
      </div>

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
              {accountant.years_experience || 0}
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="text-sm text-slate-500 mb-1">Liczba ofert</div>
            <div className="text-2xl font-bold text-slate-800">
              {totalActiveOffers}
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="text-sm text-slate-500 mb-1">Ocena</div>
            <div className="text-2xl font-bold text-amber-600 flex items-center gap-1">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              {(accountant.average_rating || accountant.rating || 0).toFixed(1)}
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="text-sm text-slate-500 mb-1">Opinie</div>
            <div className="text-2xl font-bold text-slate-800">
              {accountant.review_count || accountant.rating_count || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Specializations */}
      {accountant.specializations && accountant.specializations.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Specjalizacje
          </h3>
          <div className="flex flex-wrap gap-2">
            {accountant.specializations.map((spec: string) => (
              <span
                key={spec}
                className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-sm font-medium"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {languages.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">🌍 Języki</h3>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang: string) => (
              <span
                key={lang}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Availability Schedule */}
      {availability && Object.keys(availability).length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            Godziny pracy
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: "monday", label: "Poniedziałek" },
              { key: "tuesday", label: "Wtorek" },
              { key: "wednesday", label: "Środa" },
              { key: "thursday", label: "Czwartek" },
              { key: "friday", label: "Piątek" },
              { key: "saturday", label: "Sobota" },
              { key: "sunday", label: "Niedziela" },
            ].map((day) => {
              const hours = (availability as any)[day.key];
              return (
                <div
                  key={day.key}
                  className={`p-3 rounded-xl flex justify-between ${
                    hours ? "bg-green-50" : "bg-slate-50"
                  }`}
                >
                  <span className={hours ? "text-green-800" : "text-slate-400"}>
                    {day.label}
                  </span>
                  <span
                    className={`font-medium ${
                      hours ? "text-green-700" : "text-slate-400"
                    }`}
                  >
                    {hours || "Niedostępny"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unavailable Dates */}
      {unavailableDates && unavailableDates.length > 0 && (
        <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
          <h3 className="text-lg font-bold text-yellow-800 mb-4">
            ⚠️ Dni niedostępności
          </h3>
          <div className="space-y-2">
            {unavailableDates.map((unavail: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-yellow-100 rounded-lg"
              >
                <span className="font-medium text-yellow-900">
                  {new Date(unavail.date).toLocaleDateString("pl-PL", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                {unavail.type && (
                  <span className="px-2 py-0.5 bg-yellow-200 rounded text-xs font-medium text-yellow-800">
                    {unavail.type === "vacation"
                      ? "🏖️ Urlop"
                      : "📅 " + unavail.type}
                  </span>
                )}
              </div>
            ))}
          </div>
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
      label: "Portfolio",
      icon: "🎨",
      content: (
        <div className="space-y-6">
          {portfolio.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Portfolio Księgowego
              </h3>
              <p className="text-gray-600">
                Brak publicznych projektów w portfolio
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolio.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedProject(project);
                      setShowProjectDetail(true);
                    }}
                  >
                    {project.images && project.images.length > 0 ? (
                      <img
                        src={project.images[0]}
                        alt={project.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                        <span className="text-6xl">📊</span>
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {project.title}
                      </h3>
                      {project.category && (
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full mb-2">
                          {project.category}
                        </span>
                      )}
                      {project.description && (
                        <p className="text-gray-600 text-sm line-clamp-3">
                          {project.description}
                        </p>
                      )}
                      {project.client_name && (
                        <p className="text-gray-500 text-sm mt-2">
                          Klient: {project.client_name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ),
    },
    {
      id: "services",
      label: `Oferty (${totalActiveOffers})`,
      icon: "💼",
      content: <ServicesTabContent />,
    },
    {
      id: "jobs",
      label: `Posty (${jobOffers.length})`,
      icon: "📋",
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
        name={accountant.company_name || accountant.full_name}
        role={accountant.specializations?.[0] || "Księgowy"}
        roleType="accountant"
        // Images
        avatarUrl={accountant.avatar_url}
        coverImageUrl={accountant.cover_image_url}
        // Status
        isVerified={accountant.is_verified}
        badge="KSIĘGOWY"
        badgeColor="bg-amber-500 text-white"
        // Stats
        stats={stats}
        // Bio
        bio={accountant.bio || (accountant as any).description}
        // Details
        details={{
          location: accountant.city,
          country: accountant.country || "NL",
          website: accountant.website,
          email: accountant.email,
          phone: accountant.phone,
        }}
        // Skills & Languages
        skills={skills}
        languages={languages}
        // Rating
        rating={accountant.average_rating || accountant.rating}
        ratingCount={accountant.review_count || accountant.rating_count}
        // Experience
        yearsExperience={accountant.years_experience}
        clientsCount={accountant.total_clients}
        // Actions
        onContact={handleOpenContact}
        onBack={() => navigate("/accountants")}
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
      {accountant && (
        <Modal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          title={`Kontakt: ${accountant.company_name || accountant.full_name}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-amber-50 p-4 rounded-lg">
              <p className="text-sm text-amber-800">
                💡 <strong>Wskazówka:</strong> Opisz dokładnie swoje potrzeby
                księgowe
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
                placeholder="np. Zapytanie o obsługę księgową ZZP"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
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
                placeholder="Opisz swoje potrzeby..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
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
              className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium"
            >
              📨 Wyślij wiadomość
            </button>
          </div>
        </Modal>
      )}

      {/* Review Modal */}
      {accountant && authUser && (
        <ReviewAccountantModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          accountantId={accountant.id}
          onSuccess={loadAccountantData}
        />
      )}

      {/* Service Form Modal */}
      {selectedForm && accountant && (
        <ServiceFormModal
          form={selectedForm}
          accountantId={accountant.id}
          onClose={() => setSelectedForm(null)}
        />
      )}

      {/* Portfolio Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300"
          >
            ×
          </button>
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex - 1);
              }}
              className="absolute left-4 text-white text-4xl font-bold hover:text-gray-300"
            >
              ‹
            </button>
          )}
          <img
            src={lightboxImages[lightboxIndex]}
            alt={`Zdjęcie ${lightboxIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {lightboxIndex < lightboxImages.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex + 1);
              }}
              className="absolute right-4 text-white text-4xl font-bold hover:text-gray-300"
            >
              ›
            </button>
          )}
          <div className="absolute bottom-4 text-white text-lg">
            {lightboxIndex + 1} / {lightboxImages.length}
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
      {showProjectDetail && selectedProject && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
          onClick={() => setShowProjectDetail(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-3xl font-bold text-gray-900">
                  {selectedProject.title}
                </h2>
                <button
                  onClick={() => setShowProjectDetail(false)}
                  className="text-gray-400 hover:text-gray-600 text-3xl"
                >
                  ×
                </button>
              </div>

              {selectedProject.category && (
                <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full mb-4">
                  {selectedProject.category}
                </span>
              )}

              {selectedProject.images && selectedProject.images.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {selectedProject.images.map((img: string, idx: number) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${selectedProject.title} - ${idx + 1}`}
                      className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-80"
                      onClick={() => {
                        setLightboxImages(selectedProject.images);
                        setLightboxIndex(idx);
                        setLightboxOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}

              {selectedProject.description && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Opis projektu
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedProject.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedProject.client_name && (
                  <div>
                    <span className="font-semibold text-gray-700">Klient:</span>
                    <p className="text-gray-600">
                      {selectedProject.client_name}
                    </p>
                  </div>
                )}
                {selectedProject.client_company && (
                  <div>
                    <span className="font-semibold text-gray-700">Firma:</span>
                    <p className="text-gray-600">
                      {selectedProject.client_company}
                    </p>
                  </div>
                )}
                {selectedProject.location && (
                  <div>
                    <span className="font-semibold text-gray-700">
                      Lokalizacja:
                    </span>
                    <p className="text-gray-600">{selectedProject.location}</p>
                  </div>
                )}
                {selectedProject.start_date && (
                  <div>
                    <span className="font-semibold text-gray-700">
                      Data rozpoczęcia:
                    </span>
                    <p className="text-gray-600">
                      {new Date(selectedProject.start_date).toLocaleDateString(
                        "pl-PL"
                      )}
                    </p>
                  </div>
                )}
                {selectedProject.end_date && (
                  <div>
                    <span className="font-semibold text-gray-700">
                      Data zakończenia:
                    </span>
                    <p className="text-gray-600">
                      {new Date(selectedProject.end_date).toLocaleDateString(
                        "pl-PL"
                      )}
                    </p>
                  </div>
                )}
                {selectedProject.project_url && (
                  <div className="col-span-2">
                    <span className="font-semibold text-gray-700">Link:</span>
                    <a
                      href={selectedProject.project_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline ml-2"
                    >
                      {selectedProject.project_url}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// =====================================================
// SERVICE FORM MODAL COMPONENT
// =====================================================
function ServiceFormModal({
  form,
  accountantId,
  onClose,
}: {
  form: AccountantForm;
  accountantId: string;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user: authUser } = useAuth();

  const fields = (form.form_fields as any[]) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Get name, email, phone from form data
      const submitterName =
        formData.name ||
        formData.fullName ||
        formData.contactName ||
        "Nieznany";
      const submitterEmail = formData.email || formData.contactEmail || "";
      const submitterPhone =
        formData.phone || formData.tel || formData.contactPhone || "";

      if (!submitterEmail) {
        throw new Error("Email jest wymagany");
      }

      // Save to database
      await submitFormRequest({
        form_id: form.id,
        accountant_id: accountantId,
        submitter_profile_id: authUser?.id || null,
        submitter_name: submitterName,
        submitter_email: submitterEmail,
        submitter_phone: submitterPhone,
        form_data: formData,
      });

      setSubmitted(true);
    } catch (err: any) {
      console.error("Error submitting form:", err);
      setError(err.message || "Wystąpił błąd podczas wysyłania formularza");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Formularz wysłany!">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Dziękujemy za kontakt!
          </h3>
          <p className="text-gray-600 mb-6">
            Księgowy otrzymał Twoje zgłoszenie i odpowie tak szybko jak to
            możliwe.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            Zamknij
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={form.form_name}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field: any, index: number) => (
          <div key={index}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.labelKey || field.label || field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {field.type === "textarea" ? (
              <textarea
                value={formData[field.name] || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    [field.name]: e.target.value,
                  }))
                }
                placeholder={field.placeholderKey || field.placeholder || ""}
                required={field.required}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            ) : field.type === "select" && field.options ? (
              <select
                value={formData[field.name] || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    [field.name]: e.target.value,
                  }))
                }
                required={field.required}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Wybierz...</option>
                {field.options.map((opt: any, i: number) => {
                  const optValue = typeof opt === "object" ? opt.value : opt;
                  const optLabel =
                    typeof opt === "object"
                      ? opt.labelKey || opt.label || opt.value
                      : opt;
                  return (
                    <option key={i} value={optValue}>
                      {optLabel}
                    </option>
                  );
                })}
              </select>
            ) : field.type === "checkbox" ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData[field.name] === "true"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [field.name]: e.target.checked ? "true" : "false",
                    }))
                  }
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <span className="text-sm text-gray-600">
                  {field.placeholderKey ||
                    field.placeholder ||
                    field.labelKey ||
                    ""}
                </span>
              </label>
            ) : (
              <input
                type={field.type || "text"}
                value={formData[field.name] || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    [field.name]: e.target.value,
                  }))
                }
                placeholder={field.placeholderKey || field.placeholder || ""}
                required={field.required}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            )}
          </div>
        ))}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 pt-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Wysyłanie..." : "Wyślij formularz"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

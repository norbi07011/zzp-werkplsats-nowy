import { useState, useEffect } from "react";
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
import { getPosts, likePost, sharePost } from "../../src/services/feedService";
import type { Post } from "../../types";
import { Modal } from "../../components/Modal";
import { LocationCard } from "../../components/LocationCard";
import { Animated3DProfileBackground } from "../../components/Animated3DProfileBackground";
import { TypewriterAnimation } from "../../components/TypewriterAnimation";
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
import { AddToTeamButton } from "../../components/AddToTeamButton";
import { InviteToAccountantTeamButton } from "../../src/modules/accountant-team/components/InviteToAccountantTeamButton";
import { useAuth } from "../../contexts/AuthContext";
import { ReviewAccountantModal } from "../../src/components/employer/ReviewAccountantModal";
import { PostCardPremium } from "../FeedPage_PREMIUM";

interface AccountantProfilePageProps {
  accountantId?: string;
  embedded?: boolean;
}

export default function AccountantProfilePage({
  accountantId: propId,
  embedded = false,
}: AccountantProfilePageProps) {
  const { id: urlId } = useParams<{ id: string }>();
  const id = propId || urlId;
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [accountant, setAccountant] = useState<Accountant | null>(null);
  const [services, setServices] = useState<AccountantService[]>([]);
  const [forms, setForms] = useState<AccountantForm[]>([]);
  const [reviews, setReviews] = useState<AccountantReview[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [unavailableDates, setUnavailableDates] = useState<UnavailableDate[]>(
    []
  );
  const [availability, setAvailability] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "about" | "services" | "jobs" | "posts" | "reviews" | "contact"
  >("about");

  // Contact & Review modals
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [employerId, setEmployerId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadAccountantData();
    }
  }, [id]);

  // Load employer ID if user is employer
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

  // Track profile view when page loads
  useEffect(() => {
    if (id) {
      trackProfileView();
    }
  }, [id, employerId]);

  const trackProfileView = async () => {
    if (!id) return;

    try {
      // Track view with employer_id if available, otherwise null
      await supabase.from("profile_views").insert({
        accountant_id: id,
        employer_id: employerId || null, // Can be null for anonymous/non-employer visitors
        viewed_at: new Date().toISOString(),
      });

      console.log(
        "✅ Profile view tracked for accountant:",
        id,
        "by employer:",
        employerId || "anonymous"
      );
    } catch (error) {
      console.error("⚠️ Error tracking profile view:", error);
    }
  };

  const loadAccountantData = async () => {
    if (!id) return;

    try {
      // Load accountant first to get the actual accountant.id
      const accountantData = await getAccountant(id);
      if (!accountantData) {
        throw new Error("Accountant not found");
      }
      setAccountant(accountantData);

      // Use the actual accountant.id for related queries
      const actualAccountantId = accountantData.id;

      // Load related data using actual accountant.id
      const [
        servicesData,
        formsData,
        reviewsData,
        unavailableData,
        availabilityData,
        postsData,
      ] = await Promise.all([
        getAccountantServices(actualAccountantId),
        fetchPublicAccountantForms(actualAccountantId),
        getAccountantReviews(actualAccountantId),
        getUnavailableDates(accountantData.profile_id),
        getAvailability(accountantData.profile_id),
        getPosts({ author_id: actualAccountantId, author_type: "accountant" }),
      ]);

      setServices(servicesData);
      setForms(formsData);
      setReviews(reviewsData.success ? reviewsData.reviews || [] : []);
      setUnavailableDates(unavailableData);
      setAvailability(availabilityData);
      setPosts(postsData || []);
    } catch (error) {
      console.error("Error loading accountant:", error);
    } finally {
      setLoading(false);
    }
  };

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
      const { error } = await supabase.from("messages").insert({
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

    // Check if user already reviewed this accountant
    try {
      const { data: existingReview, error } = await supabase
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
          } (${existingReview.rating}⭐, ${reviewDate}).\n\n` +
            `Obecnie system pozwala na jedną opinię na księgowego.\n\n` +
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
    alert(
      `✅ Dziękujemy za wystawienie opinii dla ${
        accountant?.company_name || accountant?.full_name
      }!`
    );
    loadAccountantData(); // Reload to show new review
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  if (!accountant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Księgowy nie znaleziony
          </h2>
          <p className="text-gray-600 mb-6">
            Ten profil nie istnieje lub został usunięty
          </p>
          <Link
            to="/accountants"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Wróć do wyszukiwarki
          </Link>
        </div>
      </div>
    );
  }

  // Make handlers available to ContactTab
  (window as any).handleOpenContact = handleOpenContact;
  (window as any).handleOpenReview = handleOpenReview;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Image Header */}
      <div className="relative h-64 bg-gradient-to-r from-amber-600 to-amber-700">
        <Animated3DProfileBackground role="accountant" opacity={0.3} />
        <TypewriterAnimation
          opacity={0.3}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
        {accountant.cover_image_url && (
          <img
            src={accountant.cover_image_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        <button
          onClick={() => navigate("/accountants")}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Wróć do wyszukiwarki</span>
        </button>
      </div>

      {/* Profile Info Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg flex-shrink-0">
              {accountant.avatar_url ? (
                <img
                  src={accountant.avatar_url}
                  alt={accountant.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white text-5xl font-bold">
                  {accountant.full_name.charAt(0)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {accountant.full_name}
              </h1>
              {accountant.company_name && (
                <p className="text-xl text-gray-600 mb-4">
                  {accountant.company_name}
                </p>
              )}

              {/* Rating & Badges */}
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-2 bg-yellow-50 border-2 border-yellow-400 px-4 py-2 rounded-lg">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-lg font-semibold text-yellow-800">
                    {(
                      accountant.average_rating ||
                      accountant.rating ||
                      0
                    ).toFixed(1)}
                  </span>
                  <span className="text-yellow-700">
                    ({accountant.review_count || accountant.rating_count || 0}{" "}
                    opinii)
                  </span>
                </div>
                {accountant.is_verified && (
                  <div className="flex items-center gap-2 bg-green-50 border-2 border-green-400 px-4 py-2 rounded-lg">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-700">
                      Zweryfikowany
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Info */}
              <div className="flex flex-wrap gap-4 text-gray-600">
                {accountant.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{accountant.city}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  <span>{accountant.years_experience} lat doświadczenia</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span>{accountant.total_clients} klientów</span>
                </div>
              </div>
            </div>

            {/* Contact Button */}
            <a
              href={`mailto:${accountant.email}`}
              className="px-6 py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors shadow-lg"
            >
              Skontaktuj się
            </a>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {[
              { id: "about", label: "O mnie", icon: "📋" },
              { id: "services", label: "Usługi", icon: "💼" },
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
                      ? "border-amber-600 text-amber-600"
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
            {activeTab === "about" && (
              <AboutTab
                accountant={accountant}
                unavailableDates={unavailableDates}
                availability={availability}
              />
            )}
            {activeTab === "services" && (
              <ServicesTab
                services={services}
                forms={forms}
                accountantId={accountant.id}
              />
            )}
            {activeTab === "jobs" && (
              <JobsTab
                posts={posts.filter((p) => p.type === "job_offer")}
                currentUserId={authUser?.id}
                currentUserRole={employerId ? "employer" : undefined}
                onPostUpdate={loadAccountantData}
              />
            )}
            {activeTab === "posts" && (
              <PostsTab
                posts={posts.filter((p) => p.type !== "job_offer")}
                currentUserId={authUser?.id}
                currentUserRole={employerId ? "employer" : undefined}
                onPostUpdate={loadAccountantData}
              />
            )}
            {activeTab === "reviews" && (
              <ReviewsTab reviews={reviews} accountant={accountant} />
            )}
            {activeTab === "contact" && <ContactTab accountant={accountant} />}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Invite to Accountant Team - visible for accountants */}
            {authUser?.role === "accountant" && accountant?.id && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg
                      className="w-6 h-6 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      Zaproś do zespołu
                    </h4>
                    <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                      Zaproś{" "}
                      {accountant.company_name ||
                        accountant.full_name ||
                        "tego księgowego"}{" "}
                      do swojego zespołu księgowych
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
                </div>
              </div>
            )}

            {/* Add to Team Button - visible for employers */}
            {authUser?.role === "employer" && accountant?.id && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      Współpraca w projekcie
                    </h4>
                    <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                      Zaproś{" "}
                      {accountant.company_name ||
                        accountant.full_name ||
                        "tego księgowego"}{" "}
                      do projektu zespołowego
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
                </div>
              </div>
            )}

            <ContactCard accountant={accountant} />
            <SpecializationsCard accountant={accountant} />
            <LanguagesCard accountant={accountant} />
          </div>
        </div>
      </div>

      {/* MODALS */}
      {/* Contact Modal */}
      {accountant && (
        <Modal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          title={`Kontakt: ${accountant.company_name || accountant.full_name}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-amber-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-amber-800">
                💡 <strong>Wskazówka:</strong> Opisz dokładnie swoje potrzeby
                księgowe, wielkość działalności i preferowane formy współpracy.
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
                placeholder={`Dzień dobry,\n\nJestem zainteresowany Pana/Pani usługami księgowymi.\n\nRodzaj działalności: \nForma prawna: \nPrzybliżony obrót: \nOczekiwany zakres usług: \n\nMogę omówić szczegóły telefonicznie.\n\nPozdrawiam`}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
              className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
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
    </div>
  );
}

// =====================================================
// TAB COMPONENTS
// =====================================================

// Form type labels for display
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

function ServicesTab({
  services,
  forms,
  accountantId,
}: {
  services: AccountantService[];
  forms: AccountantForm[];
  accountantId: string;
}) {
  const [selectedForm, setSelectedForm] = useState<AccountantForm | null>(null);

  const hasServices = services.length > 0;
  const hasForms = forms.length > 0;

  if (!hasServices && !hasForms) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Brak usług</h3>
        <p className="text-gray-600">
          Ten księgowy nie dodał jeszcze swoich usług
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Service Forms Section */}
      {hasForms && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-600" />
            Formularze kontaktowe
          </h2>
          <p className="text-gray-600 mb-4 text-sm">
            Wybierz formularz odpowiedni do Twojej sprawy - księgowy odpowie tak
            szybko jak to możliwe
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map((form) => (
              <button
                key={form.id}
                onClick={() => setSelectedForm(form)}
                className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-all text-left border-2 border-transparent hover:border-amber-400 group"
              >
                <div className="text-2xl mb-2">
                  {FORM_TYPE_LABELS[form.form_type]?.split(" ")[0] || "📋"}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-amber-600 transition-colors">
                  {form.form_name}
                </h3>
                <p className="text-sm text-gray-500">
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

      {/* Legacy Services Section (price-based) */}
      {hasServices && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-amber-600" />
            Cennik usług
          </h2>
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {service.name}
                    </h3>
                    <p className="text-gray-600 mb-4">{service.description}</p>

                    {service.features && service.features.length > 0 && (
                      <ul className="space-y-2 mb-4">
                        {service.features.map(
                          (feature: string, idx: number) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-sm text-gray-700"
                            >
                              <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          )
                        )}
                      </ul>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-bold text-amber-600 mb-1">
                      €{service.price_from}
                    </div>
                    <div className="text-sm text-gray-600">
                      {service.price_unit}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {selectedForm && (
        <ServiceFormModal
          form={selectedForm}
          accountantId={accountantId}
          onClose={() => setSelectedForm(null)}
        />
      )}
    </div>
  );
}

// Modal for filling out a service form
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
                  // Handle both string and object options
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
          {/* Main buttons */}
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

          {/* WhatsApp button - if enabled */}
          {form.whatsapp_enabled && form.whatsapp_number && (
            <button
              type="button"
              onClick={() => {
                // Build WhatsApp message from form data
                const formEntries = Object.entries(formData);
                let message = `📋 *${form.form_name}*\n\n`;

                fields.forEach((field: any) => {
                  const value = formData[field.name];
                  if (value) {
                    const label = field.labelKey || field.label || field.name;
                    message += `*${label}:* ${value}\n`;
                  }
                });

                // Clean the phone number
                const phone = form
                  .whatsapp_number!.replace(/[^0-9+]/g, "")
                  .replace("+", "");

                // Encode and open WhatsApp
                const encodedMessage = encodeURIComponent(message);
                window.open(
                  `https://wa.me/${phone}?text=${encodedMessage}`,
                  "_blank"
                );
              }}
              className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Wyślij przez WhatsApp
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}

// JobsTab Component - shows only job_offer posts
function JobsTab({
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
        <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Brak ofert pracy
        </h3>
        <p className="text-gray-600">
          Ten księgowy nie opublikował jeszcze żadnych ofert pracy.
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

// PostsTab Component - shows non-job posts (ads, announcements, general)
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
          Ten księgowy nie opublikował jeszcze żadnych postów.
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

function ReviewsTab({
  reviews,
  accountant,
}: {
  reviews: AccountantReview[];
  accountant: Accountant;
}) {
  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Brak opinii
        </h3>
        <p className="text-gray-600">Ten księgowy nie ma jeszcze opinii</p>
      </div>
    );
  }

  // Calculate average detailed ratings
  const reviewsWithDetailed = reviews.filter(
    (r) =>
      r.professionalism_rating ||
      r.communication_rating ||
      r.quality_rating ||
      r.timeliness_rating
  );

  const avgProfessionalism =
    reviewsWithDetailed.length > 0
      ? reviewsWithDetailed.reduce(
          (sum, r) => sum + (r.professionalism_rating || 0),
          0
        ) / reviewsWithDetailed.length
      : 0;

  const avgCommunication =
    reviewsWithDetailed.length > 0
      ? reviewsWithDetailed.reduce(
          (sum, r) => sum + (r.communication_rating || 0),
          0
        ) / reviewsWithDetailed.length
      : 0;

  const avgQuality =
    reviewsWithDetailed.length > 0
      ? reviewsWithDetailed.reduce(
          (sum, r) => sum + (r.quality_rating || 0),
          0
        ) / reviewsWithDetailed.length
      : 0;

  const avgTimeliness =
    reviewsWithDetailed.length > 0
      ? reviewsWithDetailed.reduce(
          (sum, r) => sum + (r.timeliness_rating || 0),
          0
        ) / reviewsWithDetailed.length
      : 0;

  const recommendPercentage =
    reviews.length > 0
      ? (reviews.filter((r) => r.would_recommend === true).length /
          reviews.length) *
        100
      : 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-8 mb-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 mb-2">
              {(accountant.average_rating || accountant.rating || 0).toFixed(1)}
            </div>
            <div className="flex items-center gap-1 justify-center mb-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i <
                    Math.round(
                      accountant.average_rating || accountant.rating || 0
                    )
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-gray-600">
              {accountant.review_count || accountant.rating_count || 0} opinii
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = reviews.filter((r) => r.rating === stars).length;
              const percentage = (count / reviews.length) * 100;

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

        {/* Detailed Ratings */}
        {reviewsWithDetailed.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">
              Średnie oceny szczegółowe
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {avgProfessionalism > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {avgProfessionalism.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Profesjonalizm</div>
                </div>
              )}
              {avgCommunication > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {avgCommunication.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Komunikacja</div>
                </div>
              )}
              {avgQuality > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {avgQuality.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Jakość usług</div>
                </div>
              )}
              {avgTimeliness > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    {avgTimeliness.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Terminowość</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recommendation Percentage */}
        {recommendPercentage > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {Math.round(recommendPercentage)} %
              </div>
              <div className="text-sm text-gray-700">
                osób poleca tego księgowego
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start gap-4">
              {/* Reviewer Avatar */}
              {(review as any).workers?.workers_profile?.avatar_url ||
              (review as any).profiles?.avatar_url ||
              (review as any).cleaning_companies?.avatar_url ||
              (review as any).employers?.logo_url ? (
                <img
                  src={
                    (review as any).workers?.workers_profile?.avatar_url ||
                    (review as any).profiles?.avatar_url ||
                    (review as any).cleaning_companies?.avatar_url ||
                    (review as any).employers?.logo_url
                  }
                  alt="Reviewer"
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-lg font-semibold text-gray-600">
                  {(
                    (review as any).workers?.workers_profile?.full_name ||
                    (review as any).profiles?.full_name ||
                    (review as any).cleaning_companies?.company_name ||
                    (review as any).employers?.company_name ||
                    review.reviewer_name ||
                    "A"
                  ).charAt(0)}
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {(review as any).workers?.workers_profile?.full_name ||
                      (review as any).profiles?.full_name ||
                      (review as any).cleaning_companies?.company_name ||
                      (review as any).employers?.company_name ||
                      review.reviewer_name ||
                      "Anoniem"}
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
                  <span className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString("nl-NL")}
                  </span>
                </div>

                {/* Detailed Ratings Breakdown */}
                {(review.professionalism_rating ||
                  review.communication_rating ||
                  review.quality_rating ||
                  review.timeliness_rating) && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
                    {review.professionalism_rating && (
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">
                          Profesjonalizm
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.professionalism_rating!
                                  ? "fill-blue-500 text-blue-500"
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
                                  ? "fill-green-500 text-green-500"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {review.quality_rating && (
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">
                          Jakość usług
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.quality_rating!
                                  ? "fill-purple-500 text-purple-500"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {review.timeliness_rating && (
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">
                          Terminowość
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.timeliness_rating!
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

                {/* Recommendation Badge */}
                {review.would_recommend !== null &&
                  review.would_recommend !== undefined && (
                    <div className="mb-3">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                          review.would_recommend
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {review.would_recommend ? "✓ Poleca" : "✗ Nie poleca"}
                      </span>
                    </div>
                  )}

                <p className="text-gray-700">{review.comment}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AboutTab({
  accountant,
  unavailableDates,
  availability,
}: {
  accountant: Accountant;
  unavailableDates: UnavailableDate[];
  availability: any;
}) {
  // Group consecutive dates into ranges
  const groupDateRanges = (
    dates: UnavailableDate[]
  ): Array<{
    startDate: string;
    endDate: string;
    reason: string;
    type: string;
  }> => {
    if (dates.length === 0) return [];

    const sortedDates = [...dates].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const ranges: Array<{
      startDate: string;
      endDate: string;
      reason: string;
      type: string;
    }> = [];

    let currentRange: {
      startDate: string;
      endDate: string;
      reason: string;
      type: string;
    } | null = null;

    sortedDates.forEach((blocked) => {
      if (!currentRange) {
        currentRange = {
          startDate: blocked.date,
          endDate: blocked.date,
          reason: blocked.reason,
          type: blocked.type,
        };
        return;
      }

      const prevDate = new Date(currentRange.endDate);
      const currDate = new Date(blocked.date);
      const dayDiff =
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (
        dayDiff === 1 &&
        blocked.reason === currentRange.reason &&
        blocked.type === currentRange.type
      ) {
        currentRange.endDate = blocked.date;
      } else {
        ranges.push(currentRange);
        currentRange = {
          startDate: blocked.date,
          endDate: blocked.date,
          reason: blocked.reason,
          type: blocked.type,
        };
      }
    });

    if (currentRange) {
      ranges.push(currentRange);
    }

    return ranges;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      vacation: "🏖️ Urlop",
      holiday: "🎄 Święto",
      fully_booked: "📅 Zajęte",
      other: "📝 Inne",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Bio */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">O mnie</h3>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {accountant.bio || "Księgowy nie dodał jeszcze opisu"}
        </p>
      </div>

      {/* Professional Info */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Informacje zawodowe
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <InfoField
            label="Lata doświadczenia"
            value={`${accountant.years_experience} lat`}
          />
          <InfoField
            label="Liczba klientów"
            value={accountant.total_clients.toString()}
          />
          {accountant.kvk_number && (
            <InfoField label="KVK" value={accountant.kvk_number} />
          )}
          {accountant.btw_number && (
            <InfoField label="BTW" value={accountant.btw_number} />
          )}
          {accountant.license_number && (
            <InfoField label="Licencja" value={accountant.license_number} />
          )}
        </div>
      </div>

      {/* Availability Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          📅 Dostępność
        </h3>

        {/* Weekly Availability */}
        {availability && (
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-3">
              Dostępność w tygodniu
            </h4>
            <div className="grid grid-cols-7 gap-2">
              {["Pn", "Wt", "Śr", "Cz", "Pt", "Więc", "Nd"].map(
                (day, index) => {
                  const dayKey = [
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                    "saturday",
                    "sunday",
                  ][index];
                  const isAvailable = availability[dayKey];
                  return (
                    <div
                      key={dayKey}
                      className={`text-center p-3 rounded-lg border ${
                        isAvailable
                          ? "bg-green-50 border-green-200 text-green-800"
                          : "bg-gray-50 border-gray-200 text-gray-400"
                      }`}
                    >
                      <div className="text-xs font-medium">{day}</div>
                      <div className="text-xs mt-1">
                        {isAvailable ? "✓" : "✗"}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Dostępne dni w tygodniu (zielone = dostępny, szare = niedostępny)
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Dostępne dni</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Object.values(availability).filter(Boolean).length}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Preferowane</p>
                <p className="text-2xl font-bold text-gray-700">
                  5 dni/tydzień
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Unavailable Dates */}
        {unavailableDates.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              🚫 Niedostępne terminy
              <span className="text-sm font-normal text-gray-500">
                ({unavailableDates.length}{" "}
                {unavailableDates.length === 1 ? "dzień" : "dni"})
              </span>
            </h4>
            <div className="space-y-2">
              {groupDateRanges(unavailableDates).map((range, index) => {
                const isSingleDay = range.startDate === range.endDate;
                const dateDisplay = isSingleDay
                  ? formatDate(range.startDate)
                  : `${formatDate(range.startDate)} do ${formatDate(
                      range.endDate
                    )}`;

                return (
                  <div
                    key={`${range.startDate}-${index}`}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-800">{dateDisplay}</p>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        {getTypeLabel(range.type)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{range.reason}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Location Card */}
      <LocationCard
        address={accountant.address}
        city={accountant.city}
        postalCode={accountant.postal_code}
        country={accountant.country}
        latitude={null}
        longitude={null}
        googleMapsUrl={null}
        profileType="accountant"
      />
    </div>
  );
}

function ContactTab({ accountant }: { accountant: Accountant }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Contact Info Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Dane kontaktowe
        </h2>
        <div className="space-y-4">
          {accountant.company_name && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nazwa firmy
              </label>
              <p className="text-lg text-gray-900">{accountant.company_name}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Osoba kontaktowa
            </label>
            <p className="text-lg text-gray-900">{accountant.full_name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <a
              href={`mailto:${accountant.email}`}
              className="text-lg text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-2"
            >
              <Mail className="w-5 h-5" />
              {accountant.email}
            </a>
          </div>

          {accountant.phone && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon
              </label>
              <a
                href={`tel:${accountant.phone}`}
                className="text-lg text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-2"
              >
                <Phone className="w-5 h-5" />
                {accountant.phone}
              </a>
            </div>
          )}

          {accountant.city && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lokalizacja
              </label>
              <p className="text-lg text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-400" />
                {accountant.city}, {accountant.country}
              </p>
            </div>
          )}

          {accountant.website && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Strona internetowa
              </label>
              <a
                href={accountant.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-2"
              >
                <Globe className="w-5 h-5" />
                {accountant.website}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        {/* Professional credentials */}
        {(accountant.kvk_number ||
          accountant.btw_number ||
          accountant.license_number) && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Dane rejestracyjne
            </h3>
            <div className="space-y-2 text-sm">
              {accountant.kvk_number && (
                <div className="flex justify-between">
                  <span className="text-gray-600">KVK:</span>
                  <span className="text-gray-900 font-medium">
                    {accountant.kvk_number}
                  </span>
                </div>
              )}
              {accountant.btw_number && (
                <div className="flex justify-between">
                  <span className="text-gray-600">BTW:</span>
                  <span className="text-gray-900 font-medium">
                    {accountant.btw_number}
                  </span>
                </div>
              )}
              {accountant.license_number && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Licencja:</span>
                  <span className="text-gray-900 font-medium">
                    {accountant.license_number}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Contact Card */}
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-6 border border-amber-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Wyślij wiadomość
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Skontaktuj się z {accountant.company_name || accountant.full_name} aby
          omówić szczegóły współpracy.
        </p>

        {/* Message & Review Actions */}
        <div className="space-y-3">
          <button
            onClick={() => (window as any).handleOpenContact?.()}
            className="block w-full bg-amber-600 text-white text-center py-3 rounded-lg font-medium hover:bg-amber-700 transition-colors shadow-sm hover:shadow-md"
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
        <div className="mt-4 pt-4 border-t border-amber-200">
          <p className="text-xs text-gray-600 mb-2">
            Lub skontaktuj się bezpośrednio:
          </p>
          <div className="space-y-2">
            {accountant.phone && (
              <a
                href={`tel:${accountant.phone}`}
                className="block text-sm text-amber-600 hover:text-amber-700 hover:underline"
              >
                📞 {accountant.phone}
              </a>
            )}
            <a
              href={`mailto:${accountant.email}`}
              className="block text-sm text-amber-600 hover:text-amber-700 hover:underline"
            >
              ✉️ {accountant.email}
            </a>
          </div>
        </div>

        {/* Experience Badge */}
        <div className="mt-6 pt-6 border-t border-amber-200">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-amber-600 mb-1">
              {accountant.years_experience}+
            </div>
            <div className="text-sm text-gray-600">lat doświadczenia</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// SIDEBAR COMPONENTS
// =====================================================

function ContactCard({ accountant }: { accountant: Accountant }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Kontakt</h3>

      <a
        href={`mailto:${accountant.email}`}
        className="flex items-center gap-3 text-gray-700 hover:text-amber-600 transition-colors"
      >
        <Mail className="w-5 h-5 text-gray-400" />
        <span className="text-sm">{accountant.email}</span>
      </a>

      {accountant.phone && (
        <a
          href={`tel:${accountant.phone}`}
          className="flex items-center gap-3 text-gray-700 hover:text-amber-600 transition-colors"
        >
          <Phone className="w-5 h-5 text-gray-400" />
          <span className="text-sm">{accountant.phone}</span>
        </a>
      )}

      {accountant.website && (
        <a
          href={accountant.website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 text-gray-700 hover:text-amber-600 transition-colors"
        >
          <Globe className="w-5 h-5 text-gray-400" />
          <span className="text-sm">Website</span>
          <ExternalLink className="w-4 h-4 ml-auto" />
        </a>
      )}

      {accountant.city && (
        <div className="flex items-center gap-3 text-gray-700">
          <MapPin className="w-5 h-5 text-gray-400" />
          <span className="text-sm">{accountant.city}</span>
        </div>
      )}
    </div>
  );
}

function SpecializationsCard({ accountant }: { accountant: Accountant }) {
  if (!accountant.specializations || accountant.specializations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Specjalizacje
      </h3>
      <div className="flex flex-wrap gap-2">
        {accountant.specializations.map((spec: string) => (
          <span
            key={spec}
            className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium"
          >
            {spec}
          </span>
        ))}
      </div>
    </div>
  );
}

function LanguagesCard({ accountant }: { accountant: Accountant }) {
  if (!accountant.languages || accountant.languages.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Languages className="w-5 h-5 text-amber-600" />
        Języki
      </h3>
      <div className="flex flex-wrap gap-2">
        {accountant.languages.map((lang: string) => (
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

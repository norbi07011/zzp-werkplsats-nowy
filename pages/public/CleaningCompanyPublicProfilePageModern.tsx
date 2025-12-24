import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Modal } from "../../components/Modal";
import { ReviewCleaningCompanyModal } from "../../src/components/employer/ReviewCleaningCompanyModal";
import { InviteToTeamModal } from "../../src/modules/team-system/components/InviteToTeamModal";
import ModernPublicProfile from "../../components/ModernPublicProfile";
import {
  Star,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  MessageSquare,
  Users,
  CheckCircle,
  Clock,
  Shield,
  Sparkles,
  Building2,
  Globe,
  Image,
  Award,
  ExternalLink,
} from "lucide-react";

interface CleaningCompany {
  id: string;
  profile_id: string;
  company_name: string;
  owner_name: string;
  phone: string | null;
  email: string | null;
  kvk_number: string | null;
  location_city: string | null;
  location_province: string | null;
  address: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  service_radius_km: number | null;
  specialization: string[] | null;
  additional_services: string[] | null;
  availability: any;
  preferred_days_per_week: number | null;
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  rate_negotiable: boolean | null;
  years_experience: number | null;
  team_size: number | null;
  bio: string | null;
  portfolio_images: string[] | null;
  average_rating: number | null;
  total_reviews: number | null;
  accepting_new_clients: boolean | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  unavailable_dates: any;
  created_at: string | null;
  updated_at: string | null;
}

interface CleaningReview {
  id: string;
  cleaning_company_id: string;
  employer_id?: string | null;
  worker_id?: string | null;
  accountant_id?: string | null;
  rating: number;
  quality_rating?: number | null;
  punctuality_rating?: number | null;
  communication_rating?: number | null;
  safety_rating?: number | null;
  would_recommend?: boolean | null;
  review_text: string | null;
  work_date: string | null;
  work_type?: string | null;
  response_text?: string | null;
  response_date?: string | null;
  created_at: string | null;
  reviewer?: {
    name: string;
    avatar_url?: string;
  };
}

export default function CleaningCompanyPublicProfilePageModern() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [company, setCompany] = useState<CleaningCompany | null>(null);
  const [reviews, setReviews] = useState<CleaningReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileViews, setProfileViews] = useState(0);

  // Contact modal
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [employerId, setEmployerId] = useState<string | null>(null);

  // Review modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Invite to team modal
  const [isInviteToTeamModalOpen, setIsInviteToTeamModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadCompanyData();
    }
  }, [id]);

  useEffect(() => {
    const loadEmployerId = async () => {
      if (user && user.role === "employer") {
        try {
          const { data, error } = await supabase
            .from("employers")
            .select("id")
            .eq("profile_id", user.id)
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
  }, [user]);

  const loadCompanyData = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Load company - try by id first, then by profile_id
      let { data: companyData, error: companyError } = await supabase
        .from("cleaning_companies")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!companyData && !companyError) {
        const result = await supabase
          .from("cleaning_companies")
          .select("*")
          .eq("profile_id", id)
          .maybeSingle();

        companyData = result.data;
        companyError = result.error;
      }

      if (companyError) throw companyError;
      if (!companyData) {
        throw new Error("Company not found");
      }

      setCompany(companyData);

      const actualCompanyId = companyData.id;

      // Load reviews with reviewer info (employers, workers, accountants)
      const { data: reviewsData, error: reviewsError } = await (supabase as any)
        .from("cleaning_reviews")
        .select(
          `
          id,
          rating,
          review_text,
          work_date,
          work_type,
          created_at,
          quality_rating,
          punctuality_rating,
          communication_rating,
          safety_rating,
          would_recommend,
          response_text,
          response_date,
          employer_id,
          worker_id,
          accountant_id,
          employers!cleaning_reviews_employer_id_fkey (
            id,
            company_name,
            profile_id
          ),
          workers!cleaning_reviews_worker_id_fkey (
            id,
            profile_id
          ),
          accountants!cleaning_reviews_accountant_id_fkey (
            id,
            company_name,
            profile_id
          )
        `
        )
        .eq("cleaning_company_id", actualCompanyId)
        .order("created_at", { ascending: false });

      if (reviewsError) {
        console.error("Error loading reviews:", reviewsError);
      }

      if (reviewsData) {
        // Collect all profile_ids from employers, workers, and accountants
        const allProfileIds: string[] = [];

        reviewsData.forEach((r: any) => {
          if (r.employers?.profile_id)
            allProfileIds.push(r.employers.profile_id);
          if (r.workers?.profile_id) allProfileIds.push(r.workers.profile_id);
          if (r.accountants?.profile_id)
            allProfileIds.push(r.accountants.profile_id);
        });

        // Fetch all profiles at once
        let profilesMap: Record<string, any> = {};
        if (allProfileIds.length > 0) {
          const uniqueProfileIds = [...new Set(allProfileIds)];
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", uniqueProfileIds);

          if (profilesData) {
            profilesData.forEach((p: any) => {
              profilesMap[p.id] = p;
            });
          }
        }

        const mappedReviews = (reviewsData || []).map((review: any) => {
          let reviewerName = "Użytkownik";
          let reviewerAvatar: string | undefined = undefined;

          // Check employer first
          if (review.employer_id && review.employers) {
            reviewerName = review.employers.company_name || "Pracodawca";
            const profile = profilesMap[review.employers.profile_id];
            if (profile) {
              reviewerAvatar = profile.avatar_url;
              if (!review.employers.company_name && profile.full_name) {
                reviewerName = profile.full_name;
              }
            }
          }
          // Check worker
          else if (review.worker_id && review.workers) {
            const profile = profilesMap[review.workers.profile_id];
            if (profile) {
              reviewerName = profile.full_name || "Pracownik";
              reviewerAvatar = profile.avatar_url;
            } else {
              reviewerName = "Pracownik";
            }
          }
          // Check accountant
          else if (review.accountant_id && review.accountants) {
            reviewerName = review.accountants.company_name || "Księgowy";
            const profile = profilesMap[review.accountants.profile_id];
            if (profile) {
              reviewerAvatar = profile.avatar_url;
              if (!review.accountants.company_name && profile.full_name) {
                reviewerName = profile.full_name;
              }
            }
          }

          return {
            ...review,
            reviewer: {
              name: reviewerName,
              avatar_url: reviewerAvatar,
            },
          };
        });

        setReviews(mappedReviews);
      }

      // Load profile views count
      const { count } = await (supabase as any)
        .from("profile_views")
        .select("*", { count: "exact", head: true })
        .eq("cleaning_company_id", actualCompanyId);

      setProfileViews(count || 0);

      // Track profile view
      if (user && employerId) {
        await (supabase as any).from("profile_views").insert({
          cleaning_company_id: actualCompanyId,
          employer_id: employerId,
          viewed_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error loading company data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendContact = async () => {
    if (!contactSubject.trim() || !contactMessage.trim()) {
      alert("Proszę wypełnić wszystkie pola");
      return;
    }

    if (!user?.id || !company?.profile_id) {
      alert("❌ Błąd: brak danych użytkownika lub firmy");
      return;
    }

    try {
      const { error } = await (supabase as any).from("messages").insert({
        sender_id: user.id,
        recipient_id: company.profile_id,
        subject: contactSubject,
        content: contactMessage,
        is_read: false,
      });

      if (error) throw error;

      alert("✅ Wiadomość wysłana!");
      setIsContactModalOpen(false);
      setContactSubject("");
      setContactMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("❌ Błąd wysyłania wiadomości");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Ładowanie profilu...
          </p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Firma nie znaleziona
          </h2>
          <button
            onClick={() => navigate("/cleaning-companies")}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Wróć do wyszukiwania
          </button>
        </div>
      </div>
    );
  }

  // Day labels
  // Build custom tabs
  const customTabs = [
    {
      id: "about",
      label: "O firmie",
      icon: "🏢",
      content: <AboutTabContent company={company} />,
    },
    {
      id: "portfolio",
      label: "Portfolio",
      icon: "📸",
      content: <PortfolioTabContent company={company} />,
    },
    {
      id: "reviews",
      label: `Opinie (${reviews.length})`,
      icon: "⭐",
      content: <ReviewsTabContent reviews={reviews} company={company} />,
    },
    {
      id: "contact",
      label: "Kontakt",
      icon: "📞",
      content: (
        <ContactTabContent
          company={company}
          user={user}
          onOpenContact={() => setIsContactModalOpen(true)}
          onOpenReview={() => setIsReviewModalOpen(true)}
        />
      ),
    },
  ];

  // Build stats array
  const stats = [
    {
      value: company.years_experience || 0,
      label: "lat doświadczenia",
      icon: <Briefcase className="w-5 h-5 text-purple-500" />,
    },
    {
      value: company.team_size || 1,
      label: (company.team_size || 1) === 1 ? "osoba" : "osób",
      icon: <Users className="w-5 h-5 text-purple-500" />,
    },
    {
      value:
        reviews.length > 0
          ? `${(
              reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            ).toFixed(1)}`
          : "0.0",
      label: `(${reviews.length} opinii)`,
      icon: <Star className="w-5 h-5 text-amber-500" />,
    },
  ];

  // Build sidebar extra content
  const SidebarExtra = () => (
    <>
      {/* Quick Contact Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📞 Szybki kontakt
        </h3>
        <div className="space-y-3">
          <button
            onClick={() => setIsContactModalOpen(true)}
            disabled={!user}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              user
                ? "bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            Wyślij wiadomość
          </button>

          {company.phone && (
            <a
              href={`tel:${company.phone}`}
              className="w-full py-3 px-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Phone className="w-5 h-5" />
              {company.phone}
            </a>
          )}

          {company.email && (
            <a
              href={`mailto:${company.email}`}
              className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Email
            </a>
          )}

          {/* Invite to Team - for employers */}
          {user && user.role === "employer" && employerId && (
            <button
              onClick={() => setIsInviteToTeamModalOpen(true)}
              className="w-full py-3 px-4 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              Zaproś do ekipy
            </button>
          )}
        </div>
      </div>

      {/* Status Card */}
      {company.accepting_new_clients !== null && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div
            className={`flex items-center gap-3 p-4 rounded-xl ${
              company.accepting_new_clients
                ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full animate-pulse ${
                company.accepting_new_clients ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span
              className={`font-medium ${
                company.accepting_new_clients
                  ? "text-green-700 dark:text-green-400"
                  : "text-red-700 dark:text-red-400"
              }`}
            >
              {company.accepting_new_clients
                ? "Przyjmuje nowych klientów"
                : "Nie przyjmuje klientów"}
            </span>
          </div>
        </div>
      )}

      {/* Pricing Card */}
      {(company.hourly_rate_min || company.hourly_rate_max) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h4 className="font-bold text-slate-800 dark:text-white mb-3 uppercase text-sm tracking-wider">
            💰 Stawki
          </h4>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              €{company.hourly_rate_min || 0} - €{company.hourly_rate_max || 0}
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1">za godzinę</p>
            {company.rate_negotiable && (
              <span className="inline-block mt-3 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm rounded-full">
                Cena do negocjacji
              </span>
            )}
          </div>
        </div>
      )}

      {/* Availability Card */}
      {company.availability && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h4 className="font-bold text-slate-800 dark:text-white mb-3 uppercase text-sm tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-500" />
            Dostępność
          </h4>
          <div className="grid grid-cols-7 gap-1">
            {[
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ].map((day) => {
              const dayLabels: Record<string, string> = {
                monday: "Pn",
                tuesday: "Wt",
                wednesday: "Śr",
                thursday: "Cz",
                friday: "Pt",
                saturday: "Sb",
                sunday: "Nd",
              };
              const isAvailable = company.availability?.[day] === true;
              return (
                <div
                  key={day}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-medium transition-all ${
                    isAvailable
                      ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {dayLabels[day]}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Service Radius */}
      {company.service_radius_km && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h4 className="font-bold text-slate-800 dark:text-white mb-3 uppercase text-sm tracking-wider">
            🚗 Zasięg działania
          </h4>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {company.service_radius_km} km
            </div>
          </div>
        </div>
      )}

      {/* KVK */}
      {company.kvk_number && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h4 className="font-bold text-slate-800 dark:text-white mb-3 uppercase text-sm tracking-wider">
            🏛️ Dane firmowe
          </h4>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Building2 className="w-4 h-4" />
            <span>KVK: {company.kvk_number}</span>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <ModernPublicProfile
        // Basic info
        name={company.company_name}
        role={`Właściciel: ${company.owner_name}`}
        roleType="cleaning_company"
        // Images
        avatarUrl={company.avatar_url || undefined}
        coverImageUrl={company.cover_image_url || undefined}
        // Status
        isVerified={false}
        badge="FIRMA SPRZĄTAJĄCA"
        badgeColor="bg-purple-500 text-white"
        // Stats
        stats={stats}
        // Bio
        bio={company.bio || undefined}
        // Details
        details={{
          location: company.location_city || undefined,
          country: company.location_province || "NL",
          email: company.email || undefined,
          phone: company.phone || undefined,
        }}
        // Rating - calculated from actual reviews
        rating={
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0
        }
        ratingCount={reviews.length}
        // Experience
        yearsExperience={company.years_experience || undefined}
        // Actions
        onContact={() => setIsContactModalOpen(true)}
        onBack={() => navigate(-1)}
        backLabel="Wróć"
        // Custom content
        customTabs={customTabs}
        sidebarExtra={<SidebarExtra />}
        // Loading
        loading={loading}
      />

      {/* Contact Modal */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title="Wyślij wiadomość"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Temat
            </label>
            <input
              type="text"
              value={contactSubject}
              onChange={(e) => setContactSubject(e.target.value)}
              placeholder="np. Zapytanie o usługę sprzątania"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Wiadomość
            </label>
            <textarea
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder="Wpisz swoją wiadomość..."
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSendContact}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
            >
              Wyślij
            </button>
            <button
              onClick={() => setIsContactModalOpen(false)}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 font-medium"
            >
              Anuluj
            </button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      {company && (
        <ReviewCleaningCompanyModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          companyId={company.id}
          companyName={company.company_name}
          onSuccess={loadCompanyData}
        />
      )}

      {/* Invite to Team Modal */}
      {company && user && employerId && (
        <InviteToTeamModal
          isOpen={isInviteToTeamModalOpen}
          onClose={() => setIsInviteToTeamModalOpen(false)}
          employerId={employerId}
          inviterProfileId={user.id}
          inviteeId={company.id}
          inviteeType="cleaning_company"
          inviteeName={company.company_name}
          inviteeAvatar={company.avatar_url ?? undefined}
        />
      )}
    </>
  );
}

// ==================== TAB COMPONENTS ====================

function AboutTabContent({ company }: { company: CleaningCompany }) {
  return (
    <div className="space-y-8">
      {/* Bio */}
      {company.bio && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-600" />O nas
          </h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {company.bio}
          </p>
        </div>
      )}

      {/* Specialization */}
      {company.specialization && company.specialization.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Specjalizacja
          </h3>
          <div className="flex flex-wrap gap-2">
            {company.specialization.map((spec) => (
              <span
                key={spec}
                className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-xl font-medium"
              >
                {spec.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Additional Services */}
      {company.additional_services &&
        company.additional_services.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Dodatkowe usługi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {company.additional_services.map((service) => (
                <div
                  key={service}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {service.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Company Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-purple-600" />
          Informacje o firmie
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <Users className="w-5 h-5 text-purple-500" />
            <span>
              Zespół: {company.team_size || 1}{" "}
              {(company.team_size || 1) === 1 ? "osoba" : "osób"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <Briefcase className="w-5 h-5 text-purple-500" />
            <span>Doświadczenie: {company.years_experience || 0} lat</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <MapPin className="w-5 h-5 text-purple-500" />
            <span>Zasięg: {company.service_radius_km || 0} km</span>
          </div>
          {company.kvk_number && (
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
              <Building2 className="w-5 h-5 text-purple-500" />
              <span>KVK: {company.kvk_number}</span>
            </div>
          )}
        </div>
      </div>

      {/* Unavailable Dates */}
      {company.unavailable_dates &&
        Array.isArray(company.unavailable_dates) &&
        company.unavailable_dates.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-red-500" />
              Niedostępność
            </h3>
            <div className="space-y-2">
              {company.unavailable_dates
                .slice(0, 5)
                .map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {new Date(item.date).toLocaleDateString("pl-PL")}
                    </span>
                    {item.reason && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {item.reason}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
    </div>
  );
}

function PortfolioTabContent({ company }: { company: CleaningCompany }) {
  if (!company.portfolio_images || company.portfolio_images.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
        <Image className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Brak zdjęć w portfolio
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Ta firma nie dodała jeszcze zdjęć swoich realizacji
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {company.portfolio_images.map((image, index) => (
        <div
          key={index}
          className="rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
        >
          <img
            src={image}
            alt={`Portfolio ${index + 1}`}
            className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      ))}
    </div>
  );
}

function ReviewsTabContent({
  reviews,
  company,
}: {
  reviews: CleaningReview[];
  company: CleaningCompany;
}) {
  if (reviews.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Brak opinii
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Ta firma nie ma jeszcze opinii
        </p>
      </div>
    );
  }

  // Calculate from actual reviews data
  const totalReviews = reviews.length;
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  // Calculate detailed averages
  const reviewsWithDetailed = reviews.filter(
    (r) =>
      r.quality_rating ||
      r.punctuality_rating ||
      r.communication_rating ||
      r.safety_rating
  );

  const avgQuality =
    reviewsWithDetailed.length > 0
      ? reviewsWithDetailed.reduce(
          (sum, r) => sum + (r.quality_rating || 0),
          0
        ) / reviewsWithDetailed.length
      : 0;

  const avgPunctuality =
    reviewsWithDetailed.length > 0
      ? reviewsWithDetailed.reduce(
          (sum, r) => sum + (r.punctuality_rating || 0),
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

  const avgSafety =
    reviewsWithDetailed.length > 0
      ? reviewsWithDetailed.reduce(
          (sum, r) => sum + (r.safety_rating || 0),
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
      {/* Rating Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
          {/* Overall Rating */}
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex items-center gap-1 justify-center mb-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.round(averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {totalReviews} {totalReviews === 1 ? "opinia" : "opinii"}
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 space-y-2 w-full">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = reviews.filter((r) => r.rating === stars).length;
              const percentage =
                reviews.length > 0 ? (count / reviews.length) * 100 : 0;

              return (
                <div key={stars} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                    {stars}★
                  </span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Ratings */}
        {reviewsWithDetailed.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Średnie oceny szczegółowe
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {avgQuality > 0 && (
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {avgQuality.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Jakość
                  </div>
                </div>
              )}
              {avgPunctuality > 0 && (
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {avgPunctuality.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Punktualność
                  </div>
                </div>
              )}
              {avgCommunication > 0 && (
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {avgCommunication.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Komunikacja
                  </div>
                </div>
              )}
              {avgSafety > 0 && (
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {avgSafety.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    BHP
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recommendation */}
        {recommendPercentage > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                {Math.round(recommendPercentage)}%
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                osób poleca tę firmę
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              {review.reviewer?.avatar_url ? (
                <img
                  src={review.reviewer.avatar_url}
                  alt={review.reviewer.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-lg font-bold text-white">
                  {review.reviewer?.name?.[0]?.toUpperCase() || "U"}
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {review.reviewer?.name || "Użytkownik"}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300 dark:text-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {review.created_at
                          ? new Date(review.created_at).toLocaleDateString(
                              "pl-PL"
                            )
                          : ""}
                      </span>
                    </div>
                  </div>
                  {review.would_recommend !== null && (
                    <span
                      className={`text-sm px-2 py-1 rounded ${
                        review.would_recommend
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {review.would_recommend ? "✅ Poleca" : "❌ Nie poleca"}
                    </span>
                  )}
                </div>

                {review.review_text && (
                  <p className="text-gray-700 dark:text-gray-300 mt-3">
                    {review.review_text}
                  </p>
                )}

                {/* Detailed Ratings per review */}
                {(review.quality_rating ||
                  review.punctuality_rating ||
                  review.communication_rating ||
                  review.safety_rating) && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
                    {review.quality_rating && (
                      <div className="text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Jakość
                        </div>
                        <div className="flex gap-0.5 justify-center">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= (review.quality_rating || 0)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-300 dark:text-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {review.punctuality_rating && (
                      <div className="text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Punktualność
                        </div>
                        <div className="flex gap-0.5 justify-center">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= (review.punctuality_rating || 0)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-300 dark:text-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {review.communication_rating && (
                      <div className="text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Komunikacja
                        </div>
                        <div className="flex gap-0.5 justify-center">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= (review.communication_rating || 0)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-300 dark:text-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {review.safety_rating && (
                      <div className="text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          BHP
                        </div>
                        <div className="flex gap-0.5 justify-center">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= (review.safety_rating || 0)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-300 dark:text-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Response */}
                {review.response_text && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-l-4 border-purple-500">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Odpowiedź firmy:
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {review.response_text}
                    </p>
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
  company,
  user,
  onOpenContact,
  onOpenReview,
}: {
  company: CleaningCompany;
  user: any;
  onOpenContact: () => void;
  onOpenReview: () => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Contact Information */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Dane kontaktowe
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Nazwa firmy
            </label>
            <p className="text-lg text-gray-900 dark:text-white">
              {company.company_name}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Właściciel
            </label>
            <p className="text-lg text-gray-900 dark:text-white">
              {company.owner_name}
            </p>
          </div>

          {company.email && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Email
              </label>
              <a
                href={`mailto:${company.email}`}
                className="text-lg text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-2"
              >
                <Mail className="w-5 h-5" />
                {company.email}
              </a>
            </div>
          )}

          {company.phone && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Telefon
              </label>
              <a
                href={`tel:${company.phone}`}
                className="text-lg text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-2"
              >
                <Phone className="w-5 h-5" />
                {company.phone}
              </a>
            </div>
          )}

          {company.location_city && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Lokalizacja
              </label>
              <p className="text-lg text-gray-900 dark:text-white flex items-start gap-2">
                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                <span>
                  {company.address && `${company.address}, `}
                  {company.postal_code && `${company.postal_code} `}
                  {company.location_city}
                  {company.location_province &&
                    `, ${company.location_province}`}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Wyślij wiadomość
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Zainteresowany usługami {company.company_name}? Skontaktuj się przez
          platformę:
        </p>

        <div className="space-y-3">
          <button
            onClick={onOpenContact}
            disabled={!user}
            className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              user
                ? "bg-purple-600 text-white hover:bg-purple-700 shadow-lg"
                : "bg-gray-400 text-white cursor-not-allowed"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            Wyślij wiadomość {!user && "(zaloguj się)"}
          </button>

          <button
            onClick={onOpenReview}
            disabled={!user}
            className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              user
                ? "bg-orange-600 text-white hover:bg-orange-700 shadow-lg"
                : "bg-gray-400 text-white cursor-not-allowed"
            }`}
          >
            <Star className="w-5 h-5" />
            Wystaw opinię {!user && "(zaloguj się)"}
          </button>
        </div>

        {/* Stats */}
        <div className="mt-6 pt-6 border-t border-purple-200 dark:border-purple-700">
          <div className="grid grid-cols-2 gap-4">
            {company.team_size && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                <Users className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {company.team_size}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {company.team_size === 1 ? "Osoba" : "Osób"}
                </div>
              </div>
            )}
            {company.years_experience && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                <Briefcase className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {company.years_experience}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Lat doświadczenia
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Modal } from "../../components/Modal";
import { ReviewCleaningCompanyModal } from "../../src/components/employer/ReviewCleaningCompanyModal";
import { LocationCard } from "../../components/LocationCard";
import { Animated3DProfileBackground } from "../../components/Animated3DProfileBackground";
import { SpinningNumbers } from "../../components/SpinningNumbers";
import {
  Star,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  MessageSquare,
  ArrowLeft,
  Users,
  CheckCircleIcon,
  ExternalLink,
  Globe,
} from "../../components/icons";

interface CleaningCompany {
  id: string;
  profile_id: string;
  company_name: string;
  owner_name: string;
  phone: string | null;
  email: string | null;
  location_city: string | null;
  location_province: string | null;
  service_radius_km: number | null;
  specialization: string[] | null;
  additional_services: string[] | null;
  availability: any;
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
  created_at: string | null;
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
  created_at: string | null;
  employers?: {
    company_name: string;
    user_id: string;
    employer_profile: {
      avatar_url: string | null;
    };
  } | null;
  workers?: {
    profile_id: string;
    worker_profile: {
      full_name: string;
      avatar_url: string | null;
    };
  } | null;
  accountants?: {
    company_name: string;
    profile_id: string;
    accountant_profile: {
      avatar_url: string | null;
    };
  } | null;
  reviewer?: {
    name: string;
    avatar_url?: string;
  };
}

export default function CleaningCompanyPublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [company, setCompany] = useState<CleaningCompany | null>(null);
  const [reviews, setReviews] = useState<CleaningReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "about" | "portfolio" | "reviews" | "contact"
  >("about");

  // Contact modal
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [employerId, setEmployerId] = useState<string | null>(null);

  // Review modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    if (id) {
      loadCompanyData(abortController.signal, isMounted);
    }

    return () => {
      isMounted = false;
      abortController.abort();
    };
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

  const loadCompanyData = async (
    signal?: AbortSignal,
    isMounted: boolean = true
  ) => {
    if (!id) return;

    try {
      if (!isMounted) return;
      setLoading(true);

      // Load company profile - try by id first, then by profile_id
      let { data: companyData, error: companyError } = await supabase
        .from("cleaning_companies")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      // If not found by id, try by profile_id
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
      if (!isMounted) return;
      setCompany(companyData);

      // Use the actual company.id for related queries
      const actualCompanyId = companyData.id;

      // Load reviews with reviewer profiles (employer/worker/accountant)
      const { data: reviewsData, error: reviewsError } = await supabase
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
          employers (
            company_name,
            user_id,
            employer_profile:profiles!employers_user_id_fkey (
              avatar_url
            )
          ),
          workers (
            profile_id,
            worker_profile:profiles!workers_profile_id_fkey (
              full_name,
              avatar_url
            )
          ),
          accountants (
            company_name,
            profile_id,
            accountant_profile:profiles!accountants_profile_id_fkey (
              avatar_url
            )
          )
        `
        )
        .eq("cleaning_company_id", actualCompanyId)
        .order("created_at", { ascending: false });

      if (!reviewsError && reviewsData && isMounted) {
        // Map reviews to extract reviewer name and avatar
        const mappedReviews = (reviewsData || []).map((review: any) => {
          let reviewerName = "Użytkownik";
          let reviewerAvatar: string | undefined = undefined;

          if (review.employer_id && review.employers?.company_name) {
            reviewerName = review.employers.company_name;
            reviewerAvatar = review.employers?.employer_profile?.avatar_url;
          } else if (
            review.worker_id &&
            review.workers?.worker_profile?.full_name
          ) {
            reviewerName = review.workers.worker_profile.full_name;
            reviewerAvatar = review.workers?.worker_profile?.avatar_url;
          } else if (review.accountant_id && review.accountants?.company_name) {
            reviewerName = review.accountants.company_name;
            reviewerAvatar = review.accountants?.accountant_profile?.avatar_url;
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

      // Track profile view AFTER company is loaded
      if (isMounted && user && employerId && companyData.id) {
        try {
          await supabase.from("profile_views").insert({
            cleaning_company_id: companyData.id,
            employer_id: employerId,
            viewed_at: new Date().toISOString(),
          });
        } catch (viewError) {
          console.error("Error tracking profile view:", viewError);
        }
      }
    } catch (error) {
      console.error("Error loading company data:", error);
      if (isMounted) {
        setLoading(false);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  const handleOpenContact = () => {
    if (!user) {
      alert("Zaloguj się aby wysłać wiadomość do firmy");
      return;
    }
    setIsContactModalOpen(true);
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
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: company.profile_id,
        subject: contactSubject,
        content: contactMessage,
        is_read: false,
      });

      if (error) throw error;

      // Track contact attempt
      // TODO: contact_attempts table not in database.types.ts yet
      // if (employerId) {
      //   await supabase.from("contact_attempts").insert({
      //     cleaning_company_id: company.id,
      //     employer_id: employerId,
      //     contact_type: "message",
      //     notes: `Subject: ${contactSubject}`,
      //   });
      // }

      alert("✅ Wiadomość wysłana!");
      setIsContactModalOpen(false);
      setContactSubject("");
      setContactMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("❌ Błąd wysyłania wiadomości");
    }
  };

  const handleCallClick = async () => {
    if (!company?.phone) return;

    // TODO: contact_attempts table not in database.types.ts yet
    // if (employerId) {
    //   try {
    //     await supabase.from("contact_attempts").insert({
    //       cleaning_company_id: company.id,
    //       employer_id: employerId,
    //       contact_type: "phone",
    //       notes: `Phone: ${company.phone}`,
    //     });
    //   } catch (error) {
    //     console.error("Error tracking phone contact:", error);
    //   }
    // }

    window.location.href = `tel:${company.phone}`;
  };

  const handleEmailClick = async () => {
    if (!company?.email) return;

    // TODO: contact_attempts table not in database.types.ts yet
    // if (employerId) {
    //   try {
    //     await supabase.from("contact_attempts").insert({
    //       cleaning_company_id: company.id,
    //       employer_id: employerId,
    //       contact_type: "email",
    //       notes: `Email: ${company.email}`,
    //     });
    //   } catch (error) {
    //     console.error("Error tracking email contact:", error);
    //   }
    // }

    window.location.href = `mailto:${company.email}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie profilu...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Firma nie znaleziona
          </h2>
          <button
            onClick={() => navigate("/cleaning-companies")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Wróć do wyszukiwania
          </button>
        </div>
      </div>
    );
  }

  const availableDays = Object.entries(company.availability || {}).filter(
    ([_, val]) => val === true
  );
  const dayLabels: Record<string, string> = {
    monday: "Pon",
    tuesday: "Wt",
    wednesday: "Śr",
    thursday: "Czw",
    friday: "Pt",
    saturday: "Sob",
    sunday: "Niedz",
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* 3D Background Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden perspective-container">
        <Animated3DProfileBackground role="cleaning_company" opacity={0.25} />
        <SpinningNumbers opacity={0.15} />
      </div>

      <div className="relative z-10">
        {/* Header with cover image */}
        <div className="relative h-64 bg-gradient-to-r from-blue-600 to-blue-800">
          {company.cover_image_url && (
            <img
              src={company.cover_image_url}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          <button
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg hover:bg-gray-50"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Wstecz</span>
          </button>
        </div>

        {/* Profile Info */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {company.avatar_url ? (
                  <img
                    src={company.avatar_url}
                    alt={company.company_name}
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-blue-100 flex items-center justify-center">
                    <Briefcase className="w-16 h-16 text-blue-600" />
                  </div>
                )}
              </div>

              {/* Company Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {company.company_name}
                    </h1>
                    <p className="text-lg text-gray-600 mt-1">
                      właściciel: {company.owner_name}
                    </p>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= (company.average_rating || 0)
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {(company.average_rating || 0).toFixed(1)} (
                        {company.total_reviews || 0} opinii)
                      </span>
                    </div>

                    {/* Location & Experience */}
                    <div className="flex flex-wrap gap-4 mt-4">
                      {company.location_city && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-5 h-5" />
                          <span>{company.location_city}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600">
                        <Briefcase className="w-5 h-5" />
                        <span>
                          {company.years_experience} lat doświadczenia
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-5 h-5" />
                        <span>Zespół: {company.team_size} os.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-8 border-b border-gray-200">
              <nav className="flex gap-8">
                {["about", "portfolio", "reviews", "contact"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`pb-4 px-2 font-medium transition-colors ${
                      activeTab === tab
                        ? "border-b-2 border-blue-600 text-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {tab === "about" && "O firmie"}
                    {tab === "portfolio" && "Portfolio"}
                    {tab === "reviews" && `Opinie (${company.total_reviews})`}
                    {tab === "contact" && "Kontakt"}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-8">
              {activeTab === "about" && (
                <div className="space-y-6">
                  {/* Bio */}
                  {company.bio && (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        O nas
                      </h3>
                      <p className="text-gray-700 whitespace-pre-line">
                        {company.bio}
                      </p>
                    </div>
                  )}

                  {/* Specialization */}
                  {company.specialization &&
                    company.specialization.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                          Specjalizacja
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {company.specialization.map((spec) => (
                            <span
                              key={spec}
                              className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium"
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
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                          Dodatkowe usługi
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {company.additional_services.map((service) => (
                            <div
                              key={service}
                              className="flex items-center gap-2 text-gray-700"
                            >
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              <span>{service.replace(/_/g, " ")}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Availability */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Dostępność
                    </h3>
                    <div className="flex gap-2">
                      {availableDays.map(([day]) => (
                        <span
                          key={day}
                          className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium"
                        >
                          {dayLabels[day]}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pricing */}
                  {company.hourly_rate_min && company.hourly_rate_max && (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        Stawka godzinowa
                      </h3>
                      <p className="text-2xl font-bold text-blue-600">
                        €{company.hourly_rate_min} - €{company.hourly_rate_max}
                        /godz
                      </p>
                      {company.rate_negotiable && (
                        <p className="text-sm text-gray-600 mt-1">
                          Stawka do negocjacji
                        </p>
                      )}
                    </div>
                  )}

                  {/* Location Card */}
                  <LocationCard
                    address={(company as any).address}
                    city={company.location_city}
                    postalCode={(company as any).postal_code}
                    country="Niderland"
                    latitude={(company as any).latitude}
                    longitude={(company as any).longitude}
                    googleMapsUrl={null}
                    profileType="cleaning_company"
                  />
                </div>
              )}

              {activeTab === "portfolio" && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    Portfolio
                  </h3>
                  {company.portfolio_images &&
                  company.portfolio_images.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {company.portfolio_images.map((image, index) => (
                        <div
                          key={index}
                          className="rounded-lg overflow-hidden shadow-lg"
                        >
                          <img
                            src={image}
                            alt={`Portfolio ${index + 1}`}
                            className="w-full h-64 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">Brak zdjęć w portfolio</p>
                  )}
                </div>
              )}

              {activeTab === "reviews" && (
                <ReviewsTab reviews={reviews} company={company} />
              )}

              {activeTab === "contact" && (
                <ContactTab
                  company={company}
                  employerId={employerId}
                  onOpenContact={() => setIsContactModalOpen(true)}
                  onOpenReview={() => setIsReviewModalOpen(true)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Contact Modal */}
        <Modal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          title="Wyślij wiadomość"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temat
              </label>
              <input
                type="text"
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                placeholder="np. Zapytanie o usługę sprzątania"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wiadomość
              </label>
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Wpisz swoją wiadomość..."
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSendContact}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Wyślij
              </button>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
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
      </div>
    </div>
  );
}

// ==================== TAB COMPONENTS ====================

function ReviewsTab({
  reviews,
  company,
}: {
  reviews: CleaningReview[];
  company: CleaningCompany;
}) {
  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Brak opinii
        </h3>
        <p className="text-gray-600">Ta firma nie ma jeszcze opinii</p>
      </div>
    );
  }

  const averageRating = company.average_rating || 0;
  const totalReviews = company.total_reviews || reviews.length;

  // Calculate average detailed ratings
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
      {/* Stats */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-8 mb-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 mb-2">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex items-center gap-1 justify-center mb-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.round(averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-gray-600">
              {totalReviews} {totalReviews === 1 ? "opinia" : "opinii"}
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

        {/* Detailed Ratings */}
        {reviewsWithDetailed.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">
              Średnie oceny szczegółowe
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {avgQuality > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {avgQuality.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Jakość pracy</div>
                </div>
              )}
              {avgPunctuality > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {avgPunctuality.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Punktualność</div>
                </div>
              )}
              {avgCommunication > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {avgCommunication.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Komunikacja</div>
                </div>
              )}
              {avgSafety > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    {avgSafety.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">BHP</div>
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
                osób poleca tego pracownika
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
              {review.reviewer?.avatar_url ? (
                <img
                  src={review.reviewer.avatar_url}
                  alt={review.reviewer.name}
                  className="w-12 h-12 rounded-full object-cover shadow-md"
                  onError={(e) => {
                    // Fallback to initial if image fails to load
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling!.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-md"
                style={{
                  display: review.reviewer?.avatar_url ? "none" : "flex",
                }}
              >
                {review.reviewer?.name?.[0]?.toUpperCase() ||
                  (review.employer_id ? "P" : review.worker_id ? "W" : "K")}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {review.reviewer?.name ||
                          (review.employer_id
                            ? "Pracodawca"
                            : review.worker_id
                            ? "Pracownik"
                            : "Księgowy")}
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
                      {review.created_at
                        ? new Date(review.created_at).toLocaleDateString(
                            "pl-PL",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : "Brak daty"}
                    </span>
                  </div>
                  {review.would_recommend !== null &&
                    review.would_recommend !== undefined && (
                      <div className="text-sm">
                        {review.would_recommend ? (
                          <span className="text-green-600 flex items-center gap-1">
                            ✅ Poleca
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center gap-1">
                            ❌ Nie poleca
                          </span>
                        )}
                      </div>
                    )}
                </div>

                {/* Detailed Ratings Breakdown */}
                {(review.quality_rating ||
                  review.punctuality_rating ||
                  review.communication_rating ||
                  review.safety_rating) && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
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

                {review.review_text && (
                  <p className="text-gray-700 leading-relaxed mb-3">
                    {review.review_text}
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

function ContactTab({
  company,
  employerId,
  onOpenContact,
  onOpenReview,
}: {
  company: CleaningCompany;
  employerId: string | null;
  onOpenContact: () => void;
  onOpenReview: () => void;
}) {
  const { user } = useAuth();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Dane kontaktowe
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nazwa firmy
            </label>
            <p className="text-lg text-gray-900">{company.company_name}</p>
          </div>

          {company.email && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <a
                href={`mailto:${company.email}`}
                className="text-lg text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-2"
              >
                <Mail className="w-5 h-5" />
                {company.email}
              </a>
            </div>
          )}

          {company.phone && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon
              </label>
              <a
                href={`tel:${company.phone}`}
                className="text-lg text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-2"
              >
                <Phone className="w-5 h-5" />
                {company.phone}
              </a>
            </div>
          )}

          {company.location_city && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lokalizacja
              </label>
              <p className="text-lg text-gray-900 flex items-start gap-2">
                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                <span>
                  {company.location_city}
                  {company.location_province &&
                    `, ${company.location_province}`}
                </span>
              </p>
            </div>
          )}

          {company.service_radius_km && (
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zasięg działania
              </label>
              <p className="text-lg text-gray-900">
                {company.service_radius_km} km
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Contact Card */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Wyślij wiadomość
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Zainteresowany usługami {company.company_name}? Skontaktuj się przez
          platformę:
        </p>

        <div className="space-y-3">
          <button
            onClick={onOpenContact}
            disabled={!user}
            className={`block w-full text-white text-center py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md ${
              !user
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            title={!user ? "Zaloguj się, aby wysłać wiadomość" : ""}
          >
            📨 Wyślij wiadomość {!user && "(zaloguj się)"}
          </button>

          <button
            onClick={onOpenReview}
            disabled={!user}
            className={`block w-full text-white text-center py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md ${
              !user
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-orange-600 hover:bg-orange-700"
            }`}
            title={
              !user
                ? "Zaloguj się, aby wystawić opinię"
                : "Wystaw opinię o tej firmie"
            }
          >
            ⭐ Wystaw opinię {!user && "(zaloguj się)"}
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-xs text-gray-600 mb-2">
            Lub skontaktuj się bezpośrednio:
          </p>
          <div className="space-y-2">
            {company.phone && (
              <a
                href={`tel:${company.phone}`}
                className="block text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                📞 {company.phone}
              </a>
            )}
            {company.email && (
              <a
                href={`mailto:${company.email}`}
                className="block text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                ✉️ {company.email}
              </a>
            )}
          </div>
        </div>

        {/* Company Stats */}
        {(company.team_size || company.years_experience) && (
          <div className="mt-6 pt-6 border-t border-blue-200">
            <div className="grid grid-cols-2 gap-4">
              {company.team_size && (
                <div className="bg-white rounded-lg p-4 text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-gray-900">
                    {company.team_size}
                  </div>
                  <div className="text-xs text-gray-600">
                    {company.team_size === 1 ? "Osoba" : "Osoby"}
                  </div>
                </div>
              )}
              {company.years_experience && (
                <div className="bg-white rounded-lg p-4 text-center">
                  <Briefcase className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-gray-900">
                    {company.years_experience}
                  </div>
                  <div className="text-xs text-gray-600">
                    {company.years_experience === 1 ? "Rok" : "Lat"}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

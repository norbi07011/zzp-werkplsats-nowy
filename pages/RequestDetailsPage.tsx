/**
 * REQUEST DETAILS PAGE
 * Szczegóły zlecenia Regular User + lista ofert od workerów
 * Lokalizacja: /request/:id
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../src/lib/supabase";
import { toast } from "sonner";
import {
  CheckCircleIcon,
  ClockIcon,
  BriefcaseIcon,
  XMarkIcon,
} from "../components/icons";

// ===================================================================
// INTERFACES
// ===================================================================

interface WorkerProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  email: string | null;
}

interface WorkerInfo {
  id: string;
  profile_id: string;
  rating: number | null;
  completed_jobs: number | null;
  specializations: string[] | null;
  profile: WorkerProfile;
}

interface WorkerOffer {
  id: string;
  post_id: string;
  worker_id: string;
  offered_price: number | null;
  estimated_hours: number | null;
  message: string;
  availability_date: string | null;
  status: string;
  created_at: string;
  worker: WorkerInfo;
}

interface ServiceRequest {
  id: string;
  title: string;
  content: string | null;
  request_category: string;
  request_status: string;
  request_budget_min: number | null;
  request_budget_max: number | null;
  request_location: string | null;
  request_urgency: string | null;
  request_preferred_date: string | null;
  request_contact_method: string | null;
  request_responses_count: number;
  media_urls: string[] | null;
  created_at: string;
  author_id: string;
  author_profile: {
    full_name: string;
    avatar_url: string | null;
    phone: string | null;
  };
}

// ===================================================================
// COMPONENT
// ===================================================================

export default function RequestDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [offers, setOffers] = useState<WorkerOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<WorkerOffer | null>(null);

  useEffect(() => {
    if (id) {
      loadRequestDetails();
    }
  }, [id]);

  const loadRequestDetails = async () => {
    if (!id) return;

    try {
      setIsLoading(true);

      // Pobierz szczegóły zlecenia
      const supabaseAny = supabase as any;
      const { data: postData, error: postError } = await supabaseAny
        .from("posts")
        .select(
          `
          id,
          title,
          content,
          request_category,
          request_status,
          request_budget_min,
          request_budget_max,
          request_location,
          request_urgency,
          request_preferred_date,
          request_contact_method,
          request_responses_count,
          media_urls,
          created_at,
          author_id,
          author_profile:profiles!posts_author_id_fkey(
            full_name,
            avatar_url,
            phone
          )
        `
        )
        .eq("id", id)
        .single();

      if (postError) {
        console.error("[REQUEST DETAILS] Error loading post:", postError);
        toast.error("❌ Nie znaleziono zlecenia");
        navigate("/regular-user");
        return;
      }

      setRequest(postData as any);

      // Pobierz oferty workerów (tylko jeśli user jest autorem)
      if (user?.id === postData.author_id) {
        await loadOffers();
      }
    } catch (error) {
      console.error("[REQUEST DETAILS] Unexpected error:", error);
      toast.error("❌ Wystąpił błąd podczas ładowania");
    } finally {
      setIsLoading(false);
    }
  };

  const loadOffers = async () => {
    if (!id) return;

    try {
      const supabaseAny = supabase as any;
      const { data, error } = await supabaseAny
        .from("service_request_responses")
        .select(
          `
          id,
          post_id,
          worker_id,
          offered_price,
          estimated_hours,
          message,
          availability_date,
          status,
          created_at,
          worker:workers!service_request_responses_worker_id_fkey(
            id,
            profile_id,
            rating,
            completed_jobs,
            specializations,
            profile:profiles!workers_profile_id_fkey(
              id,
              full_name,
              avatar_url,
              phone,
              email
            )
          )
        `
        )
        .eq("post_id", id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[REQUEST DETAILS] Error loading offers:", error);
        return;
      }

      setOffers((data as any) || []);
    } catch (error) {
      console.error(
        "[REQUEST DETAILS] Unexpected error loading offers:",
        error
      );
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    if (!window.confirm("Czy na pewno chcesz zaakceptować tę ofertę?")) {
      return;
    }

    try {
      // Update offer status
      const supabaseAny = supabase as any;
      const { error: offerError } = await supabaseAny
        .from("service_request_responses")
        .update({ status: "accepted" })
        .eq("id", offerId);

      if (offerError) throw offerError;

      // Update request status
      const { error: requestError } = await supabaseAny
        .from("posts")
        .update({ request_status: "in_progress" })
        .eq("id", id);

      if (requestError) throw requestError;

      toast.success("✅ Oferta zaakceptowana!");
      loadRequestDetails();
    } catch (error) {
      console.error("[ACCEPT OFFER] Error:", error);
      toast.error("❌ Błąd podczas akceptacji oferty");
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    if (!window.confirm("Czy na pewno chcesz odrzucić tę ofertę?")) {
      return;
    }

    try {
      const supabaseAny = supabase as any;
      const { error } = await supabaseAny
        .from("service_request_responses")
        .update({ status: "rejected" })
        .eq("id", offerId);

      if (error) throw error;

      toast.success("✅ Oferta odrzucona");
      loadOffers();
    } catch (error) {
      console.error("[REJECT OFFER] Error:", error);
      toast.error("❌ Błąd podczas odrzucania oferty");
    }
  };

  const handleCompleteRequest = async () => {
    if (
      !window.confirm("Czy na pewno chcesz oznaczyć zlecenie jako ukończone?")
    ) {
      return;
    }

    try {
      const supabaseAny = supabase as any;
      const { error } = await supabaseAny
        .from("posts")
        .update({ request_status: "completed" })
        .eq("id", id!);

      if (error) throw error;

      toast.success("✅ Zlecenie oznaczone jako ukończone!");
      loadRequestDetails();
    } catch (error) {
      console.error("[COMPLETE REQUEST] Error:", error);
      toast.error("❌ Błąd podczas oznaczania zlecenia");
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: string }> =
      {
        open: { bg: "bg-green-100", text: "text-green-800", icon: "🟢" },
        in_progress: { bg: "bg-blue-100", text: "text-blue-800", icon: "🔵" },
        completed: { bg: "bg-gray-100", text: "text-gray-800", icon: "✅" },
        cancelled: { bg: "bg-red-100", text: "text-red-800", icon: "❌" },
      };

    const config = configs[status] || configs.open;

    return (
      <span
        className={`px-4 py-2 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}
      >
        {config.icon}{" "}
        {status === "open"
          ? "Otwarte"
          : status === "in_progress"
          ? "W trakcie"
          : status === "completed"
          ? "Ukończone"
          : "Anulowane"}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const configs: Record<string, { bg: string; text: string; icon: string }> =
      {
        low: { bg: "bg-gray-100", text: "text-gray-700", icon: "⏱️" },
        normal: { bg: "bg-blue-100", text: "text-blue-700", icon: "⏰" },
        high: { bg: "bg-orange-100", text: "text-orange-700", icon: "⚡" },
        urgent: { bg: "bg-red-100", text: "text-red-700", icon: "🔥" },
      };

    const config = configs[urgency] || configs.normal;

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
      >
        {config.icon}{" "}
        {urgency === "low"
          ? "Niski"
          : urgency === "normal"
          ? "Normalny"
          : urgency === "high"
          ? "Wysoki"
          : "Pilne"}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Nie znaleziono zlecenia
          </h2>
          <button
            onClick={() => navigate("/regular-user")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Powrót do panelu
          </button>
        </div>
      </div>
    );
  }

  const isAuthor = user?.id === request.author_id;
  const acceptedOffer = offers.find((o) => o.status === "accepted");

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Powrót
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                {getStatusBadge(request.request_status)}
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-600">
                  Kategoria:{" "}
                  <span className="font-semibold">
                    {request.request_category}
                  </span>
                </span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {request.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>
                  📅{" "}
                  {new Date(request.created_at).toLocaleDateString("pl-PL", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span>💬 {request.request_responses_count} ofert</span>
              </div>
            </div>
          </div>

          {/* Author Info */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            {request.author_profile.avatar_url ? (
              <img
                src={request.author_profile.avatar_url}
                alt={request.author_profile.full_name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {request.author_profile.full_name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">
                {request.author_profile.full_name}
              </p>
              {isAuthor ? (
                <p className="text-sm text-blue-600">Twoje zlecenie</p>
              ) : (
                request.author_profile.phone && (
                  <p className="text-sm text-gray-600">
                    📱 {request.author_profile.phone}
                  </p>
                )
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Opis zlecenia
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {request.content || "Brak opisu"}
              </p>
            </div>

            {/* Images */}
            {request.media_urls && request.media_urls.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Zdjęcia
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {request.media_urls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Zdjęcie ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg shadow-md cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => window.open(url, "_blank")}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Worker Offers (tylko dla autora) */}
            {isAuthor && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Oferty od workerów ({offers.length})
                </h2>

                {offers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📭</div>
                    <p className="text-gray-600 text-lg">
                      Nie otrzymałeś jeszcze żadnych ofert
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Workerzy będą mogli zobaczyć Twoje zlecenie i złożyć
                      oferty
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {offers.map((offer) => (
                      <div
                        key={offer.id}
                        className={`border-2 rounded-xl p-6 transition-all ${
                          offer.status === "accepted"
                            ? "border-green-500 bg-green-50"
                            : offer.status === "rejected"
                            ? "border-red-300 bg-gray-50 opacity-60"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        {/* Worker Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            {offer.worker.profile.avatar_url ? (
                              <img
                                src={offer.worker.profile.avatar_url}
                                alt={offer.worker.profile.full_name}
                                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                {offer.worker.profile.full_name?.[0]?.toUpperCase() ||
                                  "W"}
                              </div>
                            )}
                            <div>
                              <h3 className="font-bold text-lg text-gray-900">
                                {offer.worker.profile.full_name}
                              </h3>
                              <div className="flex items-center gap-3 text-sm">
                                {offer.worker.rating && (
                                  <span className="flex items-center gap-1 text-yellow-600">
                                    ⭐ {offer.worker.rating.toFixed(1)}
                                  </span>
                                )}
                                {offer.worker.completed_jobs && (
                                  <span className="text-gray-600">
                                    ✅ {offer.worker.completed_jobs} zleceń
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          {offer.status === "accepted" && (
                            <span className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-semibold">
                              ✓ Zaakceptowana
                            </span>
                          )}
                          {offer.status === "rejected" && (
                            <span className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-semibold">
                              ✗ Odrzucona
                            </span>
                          )}
                          {offer.status === "pending" && (
                            <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                              ⏳ Oczekuje
                            </span>
                          )}
                        </div>

                        {/* Offer Details */}
                        <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-white rounded-lg">
                          {offer.offered_price && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                Oferowana cena
                              </p>
                              <p className="text-xl font-bold text-green-600">
                                €{offer.offered_price}
                              </p>
                            </div>
                          )}
                          {offer.estimated_hours && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                Szacowany czas
                              </p>
                              <p className="text-xl font-bold text-blue-600">
                                {offer.estimated_hours}h
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Message */}
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-gray-700 mb-2">
                            Wiadomość od workera:
                          </p>
                          <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {offer.message}
                          </p>
                        </div>

                        {/* Availability */}
                        {offer.availability_date && (
                          <div className="mb-4 text-sm text-gray-600">
                            📅 Dostępny od:{" "}
                            {new Date(
                              offer.availability_date
                            ).toLocaleDateString("pl-PL")}
                          </div>
                        )}

                        {/* Specializations */}
                        {offer.worker.specializations &&
                          offer.worker.specializations.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-semibold text-gray-700 mb-2">
                                Specjalizacje:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {offer.worker.specializations.map(
                                  (spec, idx) => (
                                    <span
                                      key={idx}
                                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                                    >
                                      {spec}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        {/* Action Buttons */}
                        {offer.status === "pending" &&
                          request.request_status === "open" && (
                            <div className="flex gap-3 pt-4 border-t">
                              <button
                                onClick={() => handleAcceptOffer(offer.id)}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                              >
                                ✓ Zaakceptuj ofertę
                              </button>
                              <button
                                onClick={() => handleRejectOffer(offer.id)}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                              >
                                ✗ Odrzuć
                              </button>
                            </div>
                          )}

                        {/* Contact Info (after acceptance) */}
                        {offer.status === "accepted" && (
                          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm font-semibold text-green-900 mb-2">
                              📞 Dane kontaktowe:
                            </p>
                            <div className="space-y-1 text-sm text-green-800">
                              {offer.worker.profile.phone && (
                                <p>Telefon: {offer.worker.profile.phone}</p>
                              )}
                              {offer.worker.profile.email && (
                                <p>Email: {offer.worker.profile.email}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Metadata */}
          <div className="space-y-6">
            {/* Key Details */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Szczegóły zlecenia
              </h3>

              <div className="space-y-4">
                {/* Budget */}
                {(request.request_budget_min || request.request_budget_max) && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 font-bold text-lg">
                        €
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Budżet</p>
                      <p className="text-lg font-bold text-gray-900">
                        {request.request_budget_min &&
                        request.request_budget_max
                          ? `€${request.request_budget_min} - €${request.request_budget_max}`
                          : request.request_budget_min
                          ? `Od €${request.request_budget_min}`
                          : `Do €${request.request_budget_max}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Location */}
                {request.request_location && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-lg">📍</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Lokalizacja</p>
                      <p className="text-lg font-bold text-gray-900">
                        {request.request_location}
                      </p>
                    </div>
                  </div>
                )}

                {/* Urgency */}
                {request.request_urgency && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ClockIcon className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Pilność</p>
                      {getUrgencyBadge(request.request_urgency)}
                    </div>
                  </div>
                )}

                {/* Preferred Date */}
                {request.request_preferred_date && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600 text-lg">📅</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Preferowana data
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {new Date(
                          request.request_preferred_date
                        ).toLocaleDateString("pl-PL", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Contact Method */}
                {request.request_contact_method && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-pink-600 text-lg">📞</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Preferowany kontakt
                      </p>
                      <p className="text-lg font-bold text-gray-900 capitalize">
                        {request.request_contact_method}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {isAuthor && request.request_status === "in_progress" && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Akcje</h3>
                <button
                  onClick={handleCompleteRequest}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Oznacz jako ukończone
                </button>
              </div>
            )}

            {/* Tips */}
            {isAuthor && request.request_status === "open" && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-3">
                  💡 Wskazówki
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Odpowiedz szybko na oferty workerów</li>
                  <li>• Sprawdź oceny i doświadczenie</li>
                  <li>• Negocjuj warunki przed akceptacją</li>
                  <li>• Po zakończeniu zostaw opinię</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

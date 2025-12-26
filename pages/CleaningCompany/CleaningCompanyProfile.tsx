import React, { useState, useEffect } from "react";
import {
  CleaningCompany,
  WeeklyAvailability,
  CleaningSpecialization,
  getCleaningSpecializationLabel,
} from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../src/lib/supabase";
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

const SPECIALIZATIONS: CleaningSpecialization[] = [
  "cleaning_after_construction",
  "deep_cleaning",
  "office_cleaning",
  "window_cleaning",
  "maintenance_cleaning",
];

const ADDITIONAL_SERVICES = [
  { id: "own_equipment", label: "W┼éasny sprz─Öt" },
  { id: "eco_products", label: "Produkty ekologiczne" },
  { id: "same_day_service", label: "Us┼éuga tego samego dnia" },
  { id: "weekend_available", label: "Dost─Öpno┼¢─ç w weekendy" },
  { id: "insurance", label: "Ubezpieczenie OC" },
  { id: "invoice", label: "Faktura VAT" },
];

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link?: string;
  priority?: string;
  data?: any;
}

export const CleaningCompanyProfile: React.FC = () => {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const [formData, setFormData] = useState<Partial<CleaningCompany>>({
    company_name: "",
    owner_name: "",
    phone: "",
    email: user?.email || "",
    location_city: "",
    location_province: "",
    service_radius_km: 20,
    specialization: ["cleaning_after_construction"],
    additional_services: [],
    availability: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    },
    preferred_days_per_week: 2,
    hourly_rate_min: 25,
    hourly_rate_max: 35,
    rate_negotiable: true,
    years_experience: 0,
    team_size: 1,
    bio: "",
    profile_visibility: "public",
    accepting_new_clients: true,
    google_maps_url: "",
    google_place_id: "",
  });

  // Ładowanie powiadomień
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const { data, error } = await supabase
        .from("notifications")
        .select(
          "id, type, title, message, is_read, created_at, link, priority, data"
        )
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: Notification[] = (data || []).map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        is_read: n.is_read || false,
        created_at: n.created_at || new Date().toISOString(),
        link: n.link || undefined,
        priority: n.priority || "normal",
        data: n.data || null,
      }));

      setNotifications(mapped);
      setUnreadCount(mapped.filter((n) => !n.is_read).length);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter((n) => !n.is_read)
        .map((n) => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in("id", unreadIds);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getNotificationIcon = (type: string, priority?: string) => {
    if (priority === "urgent" || priority === "high") {
      return <ExclamationCircleIcon className="w-6 h-6 text-red-500" />;
    }

    switch (type) {
      case "success":
      case "NEW_REVIEW":
      case "CERTIFICATE_APPROVED":
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case "error":
      case "CERTIFICATE_REJECTED":
      case "CERTIFICATE_EXPIRED":
        return <XCircleIcon className="w-6 h-6 text-red-500" />;
      case "warning":
      case "CERTIFICATE_EXPIRING_SOON":
        return <ExclamationCircleIcon className="w-6 h-6 text-yellow-500" />;
      default:
        return <InformationCircleIcon className="w-6 h-6 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return "border-red-500 bg-red-50";
      case "high":
        return "border-orange-500 bg-orange-50";
      case "low":
        return "border-gray-300 bg-gray-50";
      default:
        return "border-blue-500 bg-blue-50";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Teraz";
    if (diffMins < 60) return `${diffMins} min temu`;
    if (diffHours < 24) return `${diffHours} godz. temu`;
    if (diffDays < 7) return `${diffDays} dni temu`;

    return new Date(dateString).toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleAvailabilityChange = (newAvailability: WeeklyAvailability) => {
    setFormData((prev) => ({
      ...prev,
      availability: newAvailability,
    }));
  };

  const handleSpecializationToggle = (spec: CleaningSpecialization) => {
    const current = formData.specialization || [];
    const updated = current.includes(spec)
      ? current.filter((s) => s !== spec)
      : [...current, spec];

    setFormData((prev) => ({ ...prev, specialization: updated }));
  };

  const handleAdditionalServiceToggle = (serviceId: string) => {
    const current = formData.additional_services || [];
    const updated = current.includes(serviceId)
      ? current.filter((s) => s !== serviceId)
      : [...current, serviceId];

    setFormData((prev) => ({ ...prev, additional_services: updated }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Wywo┼éanie API do zapisania profilu
    console.log("Saving cleaning company profile:", formData);

    // Przyk┼éad: await supabase.from('cleaning_companies').insert(formData)
    alert("Profil zapisany! (TODO: integracja z Supabase)");
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Rozbudowana Karta Powiadomień */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BellIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                🔔 Powiadomienia
              </h2>
              <p className="text-sm text-gray-600">
                Wszystkie powiadomienia systemowe i aktualizacje
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <div className="flex items-center gap-3">
              <span className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full animate-pulse">
                {unreadCount} nowych
              </span>
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
              >
                Oznacz wszystkie jako przeczytane
              </button>
            </div>
          )}
        </div>

        {loadingNotifications ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Ładowanie powiadomień...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <BellIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Brak powiadomień</p>
            <p className="text-sm text-gray-500 mt-1">
              Gdy otrzymasz nowe powiadomienie, pojawi się ono tutaj
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`
                  border-l-4 pl-6 pr-4 py-4 rounded-r-xl transition-all duration-200
                  hover:shadow-lg cursor-pointer
                  ${
                    !notif.is_read
                      ? getPriorityColor(notif.priority)
                      : "border-gray-300 bg-gray-50"
                  }
                `}
                onClick={() => {
                  if (!notif.is_read) markAsRead(notif.id);
                  if (notif.link) window.open(notif.link, "_blank");
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Ikona */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notif.type, notif.priority)}
                  </div>

                  {/* Treść */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-3">
                        {!notif.is_read && (
                          <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse flex-shrink-0"></span>
                        )}
                        <h3
                          className={`font-bold text-lg ${
                            !notif.is_read ? "text-blue-700" : "text-gray-700"
                          }`}
                        >
                          {notif.title}
                        </h3>
                      </div>

                      {notif.priority && notif.priority !== "normal" && (
                        <span
                          className={`
                          text-xs font-bold px-2 py-1 rounded-full flex-shrink-0
                          ${
                            notif.priority === "urgent"
                              ? "bg-red-500 text-white"
                              : ""
                          }
                          ${
                            notif.priority === "high"
                              ? "bg-orange-500 text-white"
                              : ""
                          }
                          ${
                            notif.priority === "low"
                              ? "bg-gray-400 text-white"
                              : ""
                          }
                        `}
                        >
                          {notif.priority === "urgent"
                            ? "PILNE"
                            : notif.priority === "high"
                            ? "WAŻNE"
                            : "NISKI"}
                        </span>
                      )}
                    </div>

                    <p className="text-gray-700 mb-3 leading-relaxed">
                      {notif.message}
                    </p>

                    {/* Dodatkowe dane z notification.data */}
                    {notif.data && (
                      <div className="bg-white/80 border border-gray-200 rounded-lg p-3 mb-3 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          {notif.data.certificate_number && (
                            <div>
                              <span className="font-medium text-gray-600">
                                Nr certyfikatu:
                              </span>
                              <span className="ml-2 text-gray-900">
                                {notif.data.certificate_number}
                              </span>
                            </div>
                          )}
                          {notif.data.expiry_date && (
                            <div>
                              <span className="font-medium text-gray-600">
                                Data wygaśnięcia:
                              </span>
                              <span className="ml-2 text-gray-900">
                                {new Date(
                                  notif.data.expiry_date
                                ).toLocaleDateString("pl-PL")}
                              </span>
                            </div>
                          )}
                          {notif.data.rejection_reason && (
                            <div className="col-span-2">
                              <span className="font-medium text-red-600">
                                Powód odrzucenia:
                              </span>
                              <p className="text-gray-900 mt-1">
                                {notif.data.rejection_reason}
                              </p>
                            </div>
                          )}
                          {notif.data.rating && (
                            <div>
                              <span className="font-medium text-gray-600">
                                Ocena:
                              </span>
                              <span className="ml-2 text-yellow-600 font-bold">
                                {"⭐".repeat(notif.data.rating)} (
                                {notif.data.rating}/5)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4" />
                        <span>{formatTimeAgo(notif.created_at)}</span>
                        <span className="mx-1">•</span>
                        <span className="text-gray-400">
                          {new Date(notif.created_at).toLocaleString("pl-PL")}
                        </span>
                      </div>

                      {notif.link && (
                        <div className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium">
                          <span>Zobacz szczegóły</span>
                          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Istniejący formularz profilu */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Profil Firmy Sprz─àtaj─àcej
          </h1>
          <p className="text-gray-600">
            Wype┼énij formularz aby pracodawcy mogli Ci─Ö znale┼║─ç na podstawie
            dost─Öpno┼¢ci
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Podstawowe dane */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Podstawowe informacje
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nazwa firmy *
                </label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      company_name: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="np. Clean & Shine BV"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imi─Ö i nazwisko w┼éa┼¢cicielki *
                </label>
                <input
                  type="text"
                  required
                  value={formData.owner_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      owner_name: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="np. Anna Kowalska"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+31 6 12345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="kontakt@firma.nl"
                />
              </div>
            </div>
          </section>

          {/* Lokalizacja */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Lokalizacja i zasi─Ög
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Miasto
                </label>
                <input
                  type="text"
                  value={formData.location_city}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location_city: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Amsterdam"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prowincja
                </label>
                <input
                  type="text"
                  value={formData.location_province}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location_province: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Noord-Holland"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promie┼ä dzia┼éania (km)
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={formData.service_radius_km}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      service_radius_km: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* KALENDARZ DOSTĘPNOŚCI - NAJWAŻNIEJSZA SEKCJA! */}
          <section className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>📅</span>
              Twoja dostępność (kluczowe!)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Zaznacz dni, w które możesz przyjąć do pracy. Pracodawcy będą
              mogli filtrować firmy według dostępności.
            </p>

            {/* Prosta checklist dni tygodnia */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {(
                [
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                  "sunday",
                ] as const
              ).map((day) => (
                <label
                  key={day}
                  className={`
                    flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all
                    ${
                      formData.availability?.[day]
                        ? "border-green-500 bg-green-50"
                        : "border-gray-300 bg-white"
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={formData.availability?.[day] || false}
                    onChange={(e) => {
                      const newAvailability = {
                        ...formData.availability,
                        [day]: e.target.checked,
                      } as WeeklyAvailability;
                      handleAvailabilityChange(newAvailability);
                    }}
                    className="w-5 h-5 text-green-600 rounded"
                  />
                  <span className="font-medium text-sm capitalize">
                    {day === "monday" && "Poniedziałek"}
                    {day === "tuesday" && "Wtorek"}
                    {day === "wednesday" && "Środa"}
                    {day === "thursday" && "Czwartek"}
                    {day === "friday" && "Piątek"}
                    {day === "saturday" && "Sobota"}
                    {day === "sunday" && "Niedziela"}
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferowana liczba dni pracy w tygodniu
              </label>
              <select
                value={formData.preferred_days_per_week}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    preferred_days_per_week: parseInt(e.target.value),
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1">1 dzie┼ä</option>
                <option value="2">2 dni (dorywczo)</option>
                <option value="3">3 dni</option>
                <option value="4">4 dni</option>
                <option value="5">5 dni (pe┼ény etat)</option>
                <option value="6">6 dni</option>
                <option value="7">7 dni</option>
              </select>
            </div>
          </section>

          {/* Specjalizacja */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Specjalizacja
            </h2>
            <div className="grid md:grid-cols-2 gap-3">
              {SPECIALIZATIONS.map((spec) => (
                <label
                  key={spec}
                  className={`
                    flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all
                    ${
                      formData.specialization?.includes(spec)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={formData.specialization?.includes(spec)}
                    onChange={() => handleSpecializationToggle(spec)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {getCleaningSpecializationLabel(spec)}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Dodatkowe us┼éugi */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Dodatkowe us┼éugi / udogodnienia
            </h2>
            <div className="grid md:grid-cols-3 gap-3">
              {ADDITIONAL_SERVICES.map((service) => (
                <label
                  key={service.id}
                  className={`
                    flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all
                    ${
                      formData.additional_services?.includes(service.id)
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={formData.additional_services?.includes(service.id)}
                    onChange={() => handleAdditionalServiceToggle(service.id)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">{service.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Stawka */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Stawka godzinowa
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Od (Γé¼)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={formData.hourly_rate_min}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      hourly_rate_min: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Do (Γé¼)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={formData.hourly_rate_max}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      hourly_rate_max: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 pb-2">
                  <input
                    type="checkbox"
                    checked={formData.rate_negotiable}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        rate_negotiable: e.target.checked,
                      }))
                    }
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Do negocjacji</span>
                </label>
              </div>
            </div>
          </section>

          {/* Do┼¢wiadczenie */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Do┼¢wiadczenie i zesp├│┼é
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lata do┼¢wiadczenia
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.years_experience}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      years_experience: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wielko┼¢─ç ekipy (ile os├│b)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.team_size}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      team_size: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Opis */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              O firmie
            </h2>
            <textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bio: e.target.value }))
              }
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Opisz swoją firmę, doświadczenie, sposób pracy..."
            />
          </section>

          {/* Google Reviews Section */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              Opinie Google (opcjonalne)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Dodaj linki do swoich opinii Google, aby wyświetlić je na
              publicznym profilu i zwiększyć zaufanie klientów.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link do Google Maps
                </label>
                <input
                  type="url"
                  value={formData.google_maps_url || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      google_maps_url: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://maps.app.goo.gl/xxxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link do opinii Google
                </label>
                <input
                  type="url"
                  value={formData.google_place_id || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      google_place_id: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://g.page/r/xxxxx"
                />
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-blue-600 text-xl">💡</span>
                <div className="text-sm text-blue-700">
                  <p className="font-semibold mb-1">Jak znaleźć linki:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2 text-blue-600">
                    <li>
                      Otwórz{" "}
                      <a
                        href="https://www.google.com/maps"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-semibold"
                      >
                        Google Maps
                      </a>
                    </li>
                    <li>Znajdź swoją firmę / profil</li>
                    <li>Kliknij "Udostępnij" → skopiuj link (Maps)</li>
                    <li>
                      Kliknij "Zobacz opinie" → skopiuj link z paska adresu
                      (Opinie)
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Zapisz profil
            </button>
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  profile_visibility:
                    prev.profile_visibility === "public" ? "private" : "public",
                }))
              }
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              {formData.profile_visibility === "public"
                ? "👁️ Profil publiczny"
                : "🔒 Profil prywatny"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CleaningCompanyProfile;

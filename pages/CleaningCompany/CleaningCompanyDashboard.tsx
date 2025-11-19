import { useState, useEffect } from "react";
import React from "react";
import { flushSync } from "react-dom";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { CompanyInfoEditModal } from "../../src/components/cleaning/CompanyInfoEditModal";
import PortfolioUploadModal from "../../src/components/cleaning/PortfolioUploadModal";
import DateBlocker from "../../src/components/cleaning/DateBlocker";
import { MessageModal } from "../../src/components/cleaning/MessageModal";
import {
  UnifiedDashboardTabs,
  useUnifiedTabs,
  TabPanel,
  type UnifiedTab,
} from "../../components/UnifiedDashboardTabs";
import type { CleaningCompany, UnavailableDate } from "../../types";

interface Review {
  id: string;
  rating: number;
  review_text: string;
  work_date: string;
  work_type: string;
  created_at: string;
  employer: {
    company_name: string;
    avatar_url?: string;
  };
}

interface Message {
  id: string;
  subject: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface Stats {
  totalReviews: number;
  averageRating: number;
  profileViews: number;
  contactAttempts: number;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

const CleaningCompanyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activeTab, setActiveTab } = useUnifiedTabs("overview");
  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState<CleaningCompany | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [acceptingClients, setAcceptingClients] = useState(true);
  const [blockedDates, setBlockedDates] = useState<UnavailableDate[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalReviews: 0,
    averageRating: 0,
    profileViews: 0,
    contactAttempts: 0,
  });

  useEffect(() => {
    if (!user?.id) {
      navigate("/login");
      return;
    }
    loadAllData();
  }, [user]);

  const loadAllData = async () => {
    await Promise.all([
      loadCompanyData(),
      loadReviews(),
      loadMessages(),
      loadNotifications(),
      loadStats(),
    ]);
  };

  const loadCompanyData = async () => {
    try {
      setLoading(true);

      const { data: company, error } = await supabase
        .from("cleaning_companies")
        .select("*")
        .eq("profile_id", user!.id)
        .single();

      if (error) throw error;

      // Transform database data to CleaningCompany type
      const transformedData = {
        ...company,
        user_id: company.profile_id,
        unavailable_dates: [], // TODO: Will be added to database types
        phone: company.phone ?? undefined,
        email: company.email ?? undefined,
        kvk_number: company.kvk_number ?? undefined,
        location_city: company.location_city ?? undefined,
        location_province: company.location_province ?? undefined,
        bio: company.bio ?? undefined,
        avatar_url: company.avatar_url ?? undefined,
        cover_image_url: company.cover_image_url ?? undefined,
        availability: company.availability as any,
      } as CleaningCompany;

      setCompanyData(transformedData);
      setAcceptingClients(company.accepting_new_clients || false);
      setBlockedDates([]); // TODO: Load from database when unavailable_dates is added
      setLoading(false);
    } catch (error) {
      console.error("Error loading company:", error);
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const { data: company } = await supabase
        .from("cleaning_companies")
        .select("id")
        .eq("profile_id", user!.id)
        .single();

      if (!company) return;

      const { data, error } = await supabase
        .from("cleaning_reviews")
        .select(
          `
          id,
          rating,
          review_text,
          work_date,
          work_type,
          created_at,
          employer_id,
          employers (
            company_name,
            logo_url
          )
        `
        )
        .eq("cleaning_company_id", company.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      // Map reviews with employer info from JOIN
      const reviewsWithEmployers: Review[] = (data || []).map((review) => ({
        id: review.id,
        rating: review.rating,
        review_text: review.review_text || "",
        work_date: review.work_date || "",
        work_type: review.work_type || "",
        created_at: review.created_at || "",
        employer: {
          company_name: review.employers?.company_name || "Firma",
          avatar_url: review.employers?.logo_url || undefined,
        },
      }));

      setReviews(reviewsWithEmployers);
    } catch (error) {
      console.error("Error loading reviews:", error);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          id, 
          subject, 
          content, 
          created_at, 
          is_read, 
          sender_id,
          sender:profiles!messages_sender_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `
        )
        .eq("recipient_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;

      const messagesWithSenders: Message[] = (data || []).map((msg) => ({
        id: msg.id,
        subject: msg.subject || "Bez tematu",
        content: msg.content,
        created_at: msg.created_at || new Date().toISOString(),
        is_read: msg.is_read || false,
        sender: {
          id: msg.sender_id || "",
          full_name: msg.sender?.full_name || "Użytkownik",
          avatar_url: msg.sender?.avatar_url || undefined,
        },
      }));

      setMessages(messagesWithSenders);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, type, title, message, is_read, created_at, link")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      const mapped: Notification[] = (data || []).map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        is_read: n.is_read || false,
        created_at: n.created_at || new Date().toISOString(),
        link: n.link || undefined,
      }));

      setNotifications(mapped);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const handleMessageClick = async (message: Message) => {
    setSelectedMessage(message);
    setShowMessageModal(true);

    // Mark as read if unread
    if (!message.is_read) {
      await handleMarkAsRead(message.id);
    }
  };

  const handleReply = async (messageId: string, content: string) => {
    try {
      if (!selectedMessage) return;

      // Insert reply message
      const { error } = await supabase.from("messages").insert({
        sender_id: user!.id,
        recipient_id: selectedMessage.sender.id,
        subject: `Re: ${selectedMessage.subject}`,
        content: content,
        is_read: false,
      });

      if (error) throw error;

      // Use flushSync to ensure synchronous state update before DOM changes
      flushSync(() => {
        setShowMessageModal(false);
        setSelectedMessage(null);
      });

      // Reload messages after modal is fully closed
      loadMessages();
    } catch (error) {
      console.error("Error sending reply:", error);
      throw error;
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", messageId);

      if (error) throw error;

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const loadStats = async () => {
    try {
      const { data: company } = await supabase
        .from("cleaning_companies")
        .select("id, average_rating, total_reviews")
        .eq("profile_id", user!.id)
        .single();

      if (!company) return;

      // Get profile views count (if table exists)
      const profileViewsQuery = await supabase
        .from("profile_views")
        .select("*", { count: "exact", head: true })
        .eq("cleaning_company_id", company.id);

      // Get reviews stats (use database values as fallback)
      const { data: reviewsData } = await supabase
        .from("cleaning_reviews")
        .select("rating")
        .eq("cleaning_company_id", company.id);

      const totalReviews = reviewsData?.length || company.total_reviews || 0;
      const averageRating =
        reviewsData && reviewsData.length > 0
          ? reviewsData.reduce((sum, r) => sum + r.rating, 0) /
            reviewsData.length
          : company.average_rating || 0;

      setStats({
        totalReviews,
        averageRating,
        profileViews: profileViewsQuery.count || 0,
        contactAttempts: 0, // TODO: Implement when contact tracking is ready
      });
    } catch (error) {
      console.error("Error loading stats:", error);
      // Set fallback stats
      setStats({
        totalReviews: 0,
        averageRating: 0,
        profileViews: 0,
        contactAttempts: 0,
      });
    }
  };

  const handleSaveCompanyInfo = async (
    updatedData: Partial<CleaningCompany>
  ) => {
    try {
      // Transform CleaningCompany type to database format
      const { user_id, unavailable_dates, ...dbData } = updatedData;

      const { error } = await supabase
        .from("cleaning_companies")
        .update(dbData as any)
        .eq("profile_id", user!.id);

      if (error) throw error;

      await loadCompanyData();
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating company:", error);
    }
  };

  const handleToggleAccepting = async () => {
    try {
      const newValue = !acceptingClients;

      const { error } = await supabase
        .from("cleaning_companies")
        .update({ accepting_new_clients: newValue })
        .eq("profile_id", user!.id);

      if (error) throw error;

      setAcceptingClients(newValue);
    } catch (error) {
      console.error("Error toggling accepting clients:", error);
    }
  };

  const handleAvailabilityChange = async (day: string, checked: boolean) => {
    if (!companyData) return;

    try {
      const newAvailability = {
        ...companyData.availability,
        [day]: checked,
      };

      const { error } = await supabase
        .from("cleaning_companies")
        .update({ availability: newAvailability })
        .eq("profile_id", user!.id);

      if (error) throw error;

      setCompanyData({
        ...companyData,
        availability: newAvailability as any,
      });
    } catch (error) {
      console.error("Error updating availability:", error);
    }
  };

  const handleBlockDate = async (date: UnavailableDate) => {
    try {
      const newBlockedDates = [...blockedDates, date];

      // TODO: unavailable_dates not in database types yet
      // const { error } = await supabase
      //   .from("cleaning_companies")
      //   .update({ unavailable_dates: newBlockedDates as any })
      //   .eq("profile_id", user!.id);
      // if (error) throw error;

      setBlockedDates(newBlockedDates);
    } catch (error) {
      console.error("Error blocking date:", error);
    }
  };

  const handleUnblockDate = async (dateString: string) => {
    try {
      const newBlockedDates = blockedDates.filter((d) => d.date !== dateString);

      // TODO: unavailable_dates not in database types yet
      // const { error } = await supabase
      //   .from("cleaning_companies")
      //   .update({ unavailable_dates: newBlockedDates as any })
      //   .eq("profile_id", user!.id);
      // if (error) throw error;

      setBlockedDates(newBlockedDates);
    } catch (error) {
      console.error("Error unblocking date:", error);
    }
  };

  const handlePortfolioSuccess = (newImages: string[]) => {
    if (companyData) {
      setCompanyData({ ...companyData, portfolio_images: newImages });
    }
    setShowPortfolioModal(false);
  };

  const handleViewSubscription = () => {
    window.location.href = "/cleaning-company/subscription";
  };

  const handleContactSupport = () => {
    window.location.href =
      "mailto:support@zzpwerkplaats.nl?subject=Wsparcie dla firmy sprzątającej";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">⚠️ Nie znaleziono danych firmy.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/logo.png" alt="ZZP Werkplaats" className="h-10" />
              <span className="text-xl font-bold">ZZP Werkplaats</span>
            </div>
            <div className="flex items-center space-x-6">
              <button className="text-white hover:text-gray-200">
                GB angielski ▼
              </button>
              <button className="bg-purple-700 px-4 py-2 rounded-lg hover:bg-purple-800">
                ⚡ Wyloguj
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-xl mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Witajcie, {companyData.company_name}!
              </h1>
              <p className="text-purple-100">
                Panel informacyjny firmy sprzątającej
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm">Przyjmowanie nowych klientów</span>
              <button
                onClick={handleToggleAccepting}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  acceptingClients ? "bg-green-400" : "bg-gray-400"
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    acceptingClients ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Unified Dashboard Tabs */}
        <UnifiedDashboardTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          role="cleaning_company"
          unreadMessages={messages.filter((m) => !m.is_read).length}
        />

        {/* Tab Panels */}
        <TabPanel isActive={activeTab === "overview"}>
          {/* Szybkie działania Card */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              ⚡ Szybkie działania
            </h2>

            <div className="space-y-3">
              <Link
                to="/employers"
                className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 flex items-center justify-center gap-2"
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Szukaj pracodawców
              </Link>

              <Link
                to="/workers"
                className="w-full px-4 py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 flex items-center justify-center gap-2"
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Szukaj pracowników
              </Link>

              <Link
                to="/accountants"
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2"
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
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                Szukaj księgowych
              </Link>

              <Link
                to="/faktury"
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Faktury & BTW
              </Link>

              <button
                onClick={handleViewSubscription}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 flex items-center justify-center gap-2"
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
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                Subskrypcja
              </button>

              <button
                onClick={handleContactSupport}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
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
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                Wsparcie
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 mb-1">Opinie łącznie</p>
                  <p className="text-3xl font-bold text-orange-900">
                    {stats.totalReviews}
                  </p>
                </div>
                <span className="text-4xl">⭐</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 mb-1">Średnia ocena</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {stats.averageRating > 0
                      ? stats.averageRating.toFixed(1)
                      : "0.0"}{" "}
                    / 5.0
                  </p>
                </div>
                <span className="text-4xl">📊</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 mb-1">
                    Wyświetlenia profilu
                  </p>
                  <p className="text-3xl font-bold text-blue-900">
                    {stats.profileViews}
                  </p>
                </div>
                <span className="text-4xl">👁️</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 mb-1">
                    Kontakty (30 dni)
                  </p>
                  <p className="text-3xl font-bold text-green-900">
                    {stats.contactAttempts}
                  </p>
                </div>
                <span className="text-4xl">📞</span>
              </div>
            </div>
          </div>
        </TabPanel>

        {/* Profile Tab */}
        <TabPanel isActive={activeTab === "profile"}>
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Profile Photo */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-bold text-lg mb-4">📸 Zdjęcie profilowe</h3>
                <div className="text-center">
                  <div className="relative inline-block">
                    <img
                      src={companyData.avatar_url || "/default-avatar.png"}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-purple-200"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Adres URL przekierowany poprawnie do profilu rozszerzonego
                    firmy
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    https://zzp-werkplaats.nl/firma/vsvs
                  </p>
                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      📝 Edytuj dane firmy
                    </button>
                    <button className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                      🗑️ Usuń
                    </button>
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-bold text-lg mb-4">📅 Twoja dostępność</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Wybierz dni w których możesz przyjąć zlecenia (pracujesz)
                </p>
                <div className="space-y-2">
                  {[
                    { key: "monday", label: "Poniedziałek" },
                    { key: "tuesday", label: "Wtorek" },
                    { key: "wednesday", label: "Środa" },
                    { key: "thursday", label: "Czwartek" },
                    { key: "friday", label: "Piątek" },
                    { key: "saturday", label: "Sobota" },
                    { key: "sunday", label: "Niedziela" },
                  ].map((day) => (
                    <label
                      key={day.key}
                      className="flex items-center space-x-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-blue-600 rounded"
                        checked={
                          companyData.availability &&
                          typeof companyData.availability === "object" &&
                          day.key in companyData.availability
                            ? (companyData.availability as any)[day.key]
                            : false
                        }
                        onChange={(e) =>
                          handleAvailabilityChange(day.key, e.target.checked)
                        }
                      />
                      <span className="text-gray-700">{day.label}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    Preferowana liczba dni:{" "}
                    {companyData.preferred_days_per_week || 2} dni/tydzień
                  </p>
                </div>
              </div>
            </div>

            {/* Middle Column */}
            <div className="space-y-6">
              {/* Dane firmy */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-bold text-lg mb-4">ℹ️ Dane firmy</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Kontakt</p>
                    <p className="font-semibold">
                      {companyData.email || "Brak"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Zespół</p>
                    <p className="font-semibold">
                      {companyData.team_size || 1} osoba
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Miasto</p>
                    <p className="font-semibold">
                      {companyData.location_city || "Brak"}
                    </p>
                  </div>
                </div>
                <button className="mt-4 text-blue-600 hover:text-blue-800 text-sm">
                  Zobacz wszystkie →
                </button>
              </div>

              {/* Zarezerwowane daty */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-bold text-lg mb-4">📅 Zarezerwuj datami</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Zablokuj daty, kiedy się nie pojawicie (np. przerwa, urlop)
                </p>
                <DateBlocker
                  blockedDates={blockedDates}
                  onBlock={handleBlockDate}
                  onUnblock={handleUnblockDate}
                />
                <div className="mt-4">
                  <p className="text-sm font-semibold mb-2">Dostępne dni:</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {blockedDates.length > 0
                      ? Math.max(0, 30 - blockedDates.length)
                      : 30}
                  </p>
                  <p className="text-sm font-semibold mt-4 mb-2">
                    Preferowane:
                  </p>
                  <p className="text-lg text-gray-700">
                    {companyData?.preferred_days_per_week || 2} dni/tydzień
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Portfolio */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">
                    🎨 Portfolio zdjęć (
                    {companyData.portfolio_images?.length || 0} zdjęć)
                  </h3>
                  <button
                    onClick={() => setShowPortfolioModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Dodaj zdjęcia
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Pokazuj swoją pracę - dodaj zdjęcia projektów gotowe
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {companyData.portfolio_images
                    ?.slice(0, 2)
                    .map((img: string, i: number) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Portfolio ${i + 1}`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    ))}
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        {/* Reviews Tab */}
        <TabPanel isActive={activeTab === "reviews"}>
          <div className="max-w-4xl mx-auto">
            {/* Reviews */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-lg mb-4">⭐ Opinie od klientów</h3>
              <p className="text-sm text-gray-600 mb-4">
                {stats.totalReviews} opinie - Średnia:{" "}
                {stats.averageRating > 0
                  ? stats.averageRating.toFixed(1)
                  : "0.0"}{" "}
                😊
              </p>
              <div className="space-y-3">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-l-4 border-blue-500 pl-4"
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {review.employer?.company_name?.[0]?.toUpperCase() ||
                            "?"}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            {review.employer?.company_name || "Firma"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(review.created_at).toLocaleDateString(
                              "pl-PL"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex text-yellow-400 mb-2">
                        {"★★★★★".split("").map((star, i) => (
                          <span
                            key={i}
                            className={i < review.rating ? "" : "opacity-30"}
                          >
                            {star}
                          </span>
                        ))}
                        <span className="ml-2 text-gray-600 text-sm">
                          {review.rating}/5
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">
                        {review.review_text}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Typ pracy: {review.work_type} | Data:{" "}
                        {new Date(review.work_date).toLocaleDateString("pl-PL")}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Brak opinii
                  </p>
                )}
              </div>
            </div>
          </div>
        </TabPanel>

        {/* Messages Tab */}
        <TabPanel isActive={activeTab === "messages"}>
          <div className="max-w-4xl mx-auto">
            {/* Messages */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">📬 Ostatnie wiadomości</h3>
                {messages.filter((m) => !m.is_read).length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {messages.filter((m) => !m.is_read).length} nieprzeczytane
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {messages.length > 0 ? (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="border-b pb-3 last:border-b-0 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                      onClick={() => handleMessageClick(msg)}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        {!msg.is_read && (
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                        <p
                          className={`font-semibold text-sm ${
                            !msg.is_read ? "text-blue-600" : ""
                          }`}
                        >
                          {msg.subject}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        Od: {msg.sender?.full_name || "Użytkownik"} |{" "}
                        {new Date(msg.created_at).toLocaleDateString("pl-PL")}
                      </p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {msg.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Brak wiadomości
                  </p>
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">🔔 Powiadomienia</h3>
                {notifications.filter((n) => !n.is_read).length > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    {notifications.filter((n) => !n.is_read).length} nowe
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="border-l-4 border-blue-500 pl-3 pb-3 last:pb-0"
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        {!notif.is_read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                        <p
                          className={`font-semibold text-sm ${
                            !notif.is_read ? "text-blue-600" : "text-gray-700"
                          }`}
                        >
                          {notif.title}
                        </p>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notif.created_at).toLocaleDateString("pl-PL")}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Brak powiadomień
                  </p>
                )}
              </div>
            </div>
          </div>
        </TabPanel>

        {/* Subscription Cards - visible in all tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 text-9xl opacity-20">🏆</div>
            <div className="relative z-10">
              <span className="text-4xl font-bold">1</span>
              <h3 className="text-xl font-bold mt-2">Tytuł abonament</h3>
              <p className="text-sm mt-2 opacity-90">
                Opis planu abonamentowego
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 text-9xl opacity-20">💎</div>
            <div className="relative z-10">
              <span className="text-4xl font-bold">2</span>
              <h3 className="text-xl font-bold mt-2">Plan średni</h3>
              <p className="text-sm mt-2 opacity-90">
                Pakiet dla średnich firm
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-400 to-teal-400 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 text-9xl opacity-20">🚀</div>
            <div className="relative z-10">
              <span className="text-4xl font-bold">3</span>
              <h3 className="text-xl font-bold mt-2">Maksymalny pakiet</h3>
              <p className="text-sm mt-2 opacity-90">
                Wszystkie funkcje premium
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEditModal && companyData && (
        <CompanyInfoEditModal
          company={companyData}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveCompanyInfo}
        />
      )}

      {showPortfolioModal && companyData && (
        <PortfolioUploadModal
          companyId={companyData.id}
          currentImages={companyData.portfolio_images || []}
          isOpen={showPortfolioModal}
          onClose={() => setShowPortfolioModal(false)}
          onSuccess={handlePortfolioSuccess}
        />
      )}

      {/* Message Modal */}
      {showMessageModal && selectedMessage && (
        <MessageModal
          message={{
            id: selectedMessage.id,
            content: selectedMessage.content,
            subject: selectedMessage.subject,
            created_at: selectedMessage.created_at,
            is_read: selectedMessage.is_read,
            sender: {
              id: selectedMessage.sender.id,
              first_name:
                selectedMessage.sender.full_name?.split(" ")[0] || null,
              last_name:
                selectedMessage.sender.full_name
                  ?.split(" ")
                  .slice(1)
                  .join(" ") || null,
            },
          }}
          onClose={() => {
            setShowMessageModal(false);
            setSelectedMessage(null);
          }}
          onReply={handleReply}
          onMarkAsRead={handleMarkAsRead}
        />
      )}
    </div>
  );
};

export default CleaningCompanyDashboard;

/**
 * =====================================================
 * EMPLOYER DASHBOARD - Full Backend Integration
 * =====================================================
 * Updated: 2025-01-13
 * Features: Real-time data from Supabase, no MOCK data
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { SupportTicketModal } from "../../src/components/SupportTicketModal";
import { supabase } from "@/lib/supabase";
import {
  PageContainer,
  PageHeader,
  StatsGrid,
  StatCard,
  ContentCard,
} from "../../components/common/PageContainer";
import { ProjectCommunicationManager } from "../../components/ProjectCommunicationManager";
import { CoverImageUploader } from "../../src/components/common/CoverImageUploader";
import { Animated3DProfileBackground } from "../../components/Animated3DProfileBackground";
import { SpinningNumbers } from "../../components/SpinningNumbers";
import {
  UnifiedDashboardTabs,
  useUnifiedTabs,
  TabPanel,
  type UnifiedTab,
} from "../../components/UnifiedDashboardTabs";
import employerService, {
  type EmployerStats,
  type SearchHistoryItem,
  type SavedWorker,
  type Message,
  type EmployerReview,
} from "../../services/employerService";
import type { Database } from "../../src/lib/database.types";
import MyPosts from "./MyPosts";
import SavedActivity from "./SavedActivity";
import FeedPage from "../FeedPage_PREMIUM";

type Employer = Database["public"]["Tables"]["employers"]["Row"];

interface StatCard {
  label: string;
  value: number;
  icon: string;
  color: string;
}

export const EmployerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activeTab, setActiveTab } = useUnifiedTabs("overview");

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employerId, setEmployerId] = useState<string | null>(null);
  const [employerProfile, setEmployerProfile] = useState<Employer | null>(null);

  // Data state
  const [stats, setStats] = useState<EmployerStats | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [savedWorkers, setSavedWorkers] = useState<SavedWorker[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [reviews, setReviews] = useState<EmployerReview[]>([]);

  // Messages UI state
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);

  // Communication UI state
  const [showCommunicationPanel, setShowCommunicationPanel] = useState(false);

  // =====================================================
  // DATA LOADING
  // =====================================================

  useEffect(() => {
    console.log("[EMPLOYER-DASH] useEffect triggered, user:", {
      has_user: !!user,
      user_id: user?.id,
      role: user?.role,
    });
    if (user?.id) {
      loadDashboardData();

      // Auto-refresh profile_views co 30 sekund
      const refreshInterval = setInterval(() => {
        refreshProfileViews();
      }, 30000); // 30 seconds

      return () => clearInterval(refreshInterval);
    }
  }, [user?.id]);

  // Refresh profile_views counter without reloading entire dashboard
  const refreshProfileViews = async () => {
    if (!employerId) return;

    try {
      console.log(
        "🔄 [EMPLOYER-DASH] Refreshing profile_views for employer:",
        employerId
      );
      const statsData = await employerService.getEmployerStats(employerId);
      if (statsData?.profile_views !== undefined) {
        setStats((prev) =>
          prev ? { ...prev, profile_views: statsData.profile_views } : prev
        );
        console.log(
          "✅ [EMPLOYER-DASH] Profile views updated:",
          statsData.profile_views
        );
      }
    } catch (error) {
      console.error(
        "❌ [EMPLOYER-DASH] Error refreshing profile views:",
        error
      );
    }
  };

  const loadDashboardData = async () => {
    console.log("[EMPLOYER-DASH] loadDashboardData called, user.id:", user?.id);
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Get employer profile to get employer_id
      console.log("[EMPLOYER-DASH] Fetching employer profile...");
      const employer = await employerService.getEmployerByUserId(user.id);
      console.log("[EMPLOYER-DASH] Employer profile:", {
        has_employer: !!employer,
        employer_id: employer?.id,
      });

      if (!employer) {
        console.error("[EMPLOYER-DASH] No employer profile found!");
        setError("Employer profile not found. Please complete your profile.");
        setLoading(false);
        return;
      }

      setEmployerId(employer.id);
      setEmployerProfile(employer);

      // 2. Load all dashboard data in parallel
      console.log(
        "[EMPLOYER-DASH] Loading dashboard data for employer:",
        employer.id
      );
      const [
        statsData,
        historyData,
        workersData,
        messagesData,
        unreadCountData,
        reviewsData,
      ] = await Promise.all([
        employerService.getEmployerStats(employer.id),
        employerService.getSearchHistory(employer.id, 5),
        employerService.getSavedWorkers(employer.id),
        employerService.getMessages(user.id, 3),
        employerService.getUnreadMessageCount(user.id),
        employerService.getEmployerReviews(employer.id),
      ]);

      console.log("[EMPLOYER-DASH] Data loaded:", {
        has_stats: !!statsData,
        history_count: historyData.length,
        saved_workers: workersData.length,
        messages_count: messagesData.length,
        unread: unreadCountData,
        reviews_count: reviewsData.length,
      });

      // Debug messages structure
      console.log(
        "📬 EMPLOYER MESSAGES DEBUG:",
        messagesData.map((m) => ({
          id: m.id,
          subject: m.subject,
          sender: m.sender_profile?.full_name,
          avatar: m.sender_profile?.avatar_url,
          has_avatar: !!m.sender_profile?.avatar_url,
        }))
      );

      setStats(statsData);
      setSearchHistory(historyData);
      setSavedWorkers(workersData);
      setMessages(messagesData);
      setUnreadCount(unreadCountData);
      setReviews(reviewsData);
    } catch (err) {
      console.error("[EMPLOYER-DASH] Error loading dashboard data:", err);
      setError("Failed to load dashboard data. Please refresh the page.");
    } finally {
      console.log("[EMPLOYER-DASH] Loading complete");
      setLoading(false);
    }
  };

  // =====================================================
  // MESSAGE HANDLERS
  // =====================================================

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const success = await employerService.markMessageAsRead(messageId);
      if (success) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === messageId ? { ...msg, is_read: true } : msg
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error marking message as read:", err);
    }
  };

  const handleOpenMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      handleMarkAsRead(message.id);
    }
  };

  const handleOpenMessagesModal = async () => {
    setShowMessagesModal(true);
    // Load more messages when opening modal (10 instead of 3)
    if (user?.id) {
      try {
        const messagesData = await employerService.getMessages(user.id, 10);
        setMessages(messagesData);
        console.log("📬 MODAL OPENED - Loaded messages:", messagesData.length);
      } catch (err) {
        console.error("Error loading more messages:", err);
      }
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyContent.trim() || !user?.id) return;

    try {
      setSending(true);

      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: selectedMessage.sender_id,
        subject: `Re: ${selectedMessage.subject}`,
        content: replyContent,
        is_read: false,
      });

      if (error) throw error;

      alert("✅ Odpowiedź wysłana!");
      setReplyContent("");
      setSelectedMessage(null);

      // Reload messages
      if (user?.id) {
        const messagesData = await employerService.getMessages(user.id, 10);
        setMessages(messagesData);
      }
    } catch (err) {
      console.error("Error sending reply:", err);
      alert("❌ Nie udało się wysłać odpowiedzi");
    } finally {
      setSending(false);
    }
  };

  // =====================================================
  // STATS CARDS
  // =====================================================

  const getStatsCards = (): StatCard[] => {
    if (!stats) return [];

    return [
      {
        label: "Wyświetlenia profilu",
        value: stats.profile_views,
        icon: "eye",
        color: "bg-teal-500",
      },
      {
        label: "Wyszukiwania w tym miesiącu",
        value: stats.searches_this_month,
        icon: "search",
        color: "bg-blue-500",
      },
      {
        label: "Zapisani pracownicy",
        value: stats.total_saved_workers,
        icon: "bookmark",
        color: "bg-orange-500",
      },
      {
        label: "Kontakty w tym miesiącu",
        value: stats.contacts_this_month,
        icon: "message",
        color: "bg-green-500",
      },
    ];
  };

  // Helper function to map icons to colors
  const getStatColor = (
    icon: string
  ): "red" | "blue" | "green" | "purple" | "orange" | "teal" => {
    const colorMap: Record<
      string,
      "red" | "blue" | "green" | "purple" | "orange" | "teal"
    > = {
      eye: "teal",
      search: "blue",
      bookmark: "orange",
      message: "green",
      calendar: "purple",
    };
    return colorMap[icon] || "blue";
  };

  // =====================================================
  // EVENT HANDLERS
  // =====================================================

  const handleQuickSearch = () => {
    console.log("🔗 QUICK SEARCH CLICKED - navigating to /workers");
    navigate("/workers");
  };

  const handleViewSubscription = () => {
    window.location.href = "/employer/subscription";
  };

  const [showSupportModal, setShowSupportModal] = useState(false);

  const handleContactSupport = () => {
    setShowSupportModal(true);
  };

  const handleRepeatSearch = async (searchId: string) => {
    // TODO: Implement repeat search with saved parameters
    console.log("Repeat search:", searchId);
  };

  const handleRemoveSavedWorker = async (savedWorkerId: string) => {
    const success = await employerService.removeSavedWorker(savedWorkerId);
    if (success) {
      setSavedWorkers((prev) => prev.filter((w) => w.id !== savedWorkerId));
      // Update stats
      if (stats) {
        setStats({
          ...stats,
          total_saved_workers: stats.total_saved_workers - 1,
        });
      }
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !employerProfile) return;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${employerProfile.id}-${Date.now()}.${fileExt}`;
      const filePath = `employer-logos/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Update employer profile
      await supabase
        .from("employers")
        .update({ logo_url: publicUrl })
        .eq("id", employerProfile.id);

      setEmployerProfile({ ...employerProfile, logo_url: publicUrl });
      console.log("✅ Logo uploaded:", publicUrl);
    } catch (error) {
      console.error("❌ Error uploading logo:", error);
      alert("Błąd podczas uploadu logo");
    }
  };

  const handleCoverImageUploadSuccess = async (url: string) => {
    if (!employerProfile) return;

    try {
      // Update database with new cover image URL
      const { error } = await supabase
        .from("employers")
        .update({ cover_image_url: url } as any)
        .eq("id", employerProfile.id);

      if (error) throw error;

      // Update local state
      setEmployerProfile({ ...employerProfile, cover_image_url: url } as any);
      console.log("✅ Cover image updated:", url);
    } catch (error) {
      console.error("❌ Error updating cover image:", error);
      alert("Błąd podczas aktualizacji zdjęcia w tle");
    }
  };

  // =====================================================
  // ICON COMPONENT
  // =====================================================

  const getIconSvg = (icon: string) => {
    switch (icon) {
      case "eye":
        return (
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        );
      case "search":
        return (
          <svg
            className="w-8 h-8"
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
        );
      case "bookmark":
        return (
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        );
      case "message":
        return (
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        );
      case "calendar":
        return (
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Ładowanie danych...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Błąd ładowania
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  const statsCards = getStatsCards();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 3D Background Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden perspective-container">
        <Animated3DProfileBackground role="employer" opacity={0.25} />
        <SpinningNumbers opacity={0.15} />
      </div>

      <div className="relative z-10">
        <PageContainer>
          {/* Modern Header with Avatar */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-6">
                {/* Employer Logo/Avatar */}
                <div className="flex-shrink-0">
                  {employerProfile?.logo_url ? (
                    <img
                      src={employerProfile.logo_url}
                      alt={employerProfile.company_name || "Pracodawca"}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white/30 shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        const fallback = (e.target as HTMLImageElement)
                          .nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="w-20 h-20 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-3xl border-4 border-white/30 shadow-lg"
                    style={{
                      display: employerProfile?.logo_url ? "none" : "flex",
                    }}
                  >
                    {employerProfile?.company_name?.[0]?.toUpperCase() || "🏢"}
                  </div>
                </div>

                {/* Header Text */}
                <div>
                  <h1 className="text-4xl font-bold tracking-tight mb-2">
                    <span className="mr-2">🏢</span>
                    {employerProfile?.company_name || "Panel pracodawcy"}
                  </h1>
                  <p className="text-blue-100 text-lg">
                    Witamy ponownie, {user?.fullName || "Pracodawco"}! Zarządzaj
                    swoimi pracownikami i projektami
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    console.log(
                      "Communication button clicked! Current state:",
                      showCommunicationPanel
                    );
                    setShowCommunicationPanel(!showCommunicationPanel);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 font-medium shadow-lg flex items-center gap-2"
                >
                  🏗️ Komunikacja Projektowa
                </button>
                <Link
                  to="/employer/profile"
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 font-bold text-lg shadow-xl"
                >
                  ⚙️ Mój profil
                </Link>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-400/20 rounded-full blur-xl"></div>
          </div>

          {/* Unified Dashboard Tabs */}
          <UnifiedDashboardTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            role="employer"
            unreadMessages={unreadCount}
          />

          {/* Tab Panels */}
          <TabPanel isActive={activeTab === "overview"}>
            {/* Modern Stats Cards */}
            <StatsGrid columns={4}>
              {statsCards.map((stat, idx) => (
                <StatCard
                  key={idx}
                  title={stat.label}
                  value={stat.value}
                  color={getStatColor(stat.icon)}
                  icon={getIconSvg(stat.icon)}
                />
              ))}
            </StatsGrid>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Search History */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                      Ostatnie wyszukiwania
                    </h2>
                    <Link
                      to="/employer/search"
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Nowe wyszukiwanie →
                    </Link>
                  </div>

                  {searchHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Brak historii wyszukiwań</p>
                      <button
                        onClick={handleQuickSearch}
                        className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                      >
                        Rozpocznij pierwsze wyszukiwanie
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {searchHistory.map((search) => (
                        <div
                          key={search.id}
                          className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {search.category}
                              </p>
                              <p className="text-sm text-gray-600">
                                {search.level && `Poziom: ${search.level} • `}
                                {search.results_count} wyników
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">
                                {search.search_date
                                  ? new Date(
                                      search.search_date
                                    ).toLocaleDateString("pl-PL")
                                  : "N/A"}
                              </p>
                              <button
                                onClick={() => handleRepeatSearch(search.id)}
                                className="text-sm text-orange-600 hover:text-orange-700 font-medium mt-1"
                              >
                                Powtórz
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Saved Workers */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                      Zapisani pracownicy
                    </h2>
                    <Link
                      to="/employer/search"
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Zobacz wszystkich →
                    </Link>
                  </div>

                  {savedWorkers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        Brak zapisanych pracowników
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        Zapisz pracowników podczas wyszukiwania, aby szybko do
                        nich wrócić
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {savedWorkers.map((savedWorker) => (
                        <div
                          key={savedWorker.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-orange-500 transition-colors relative group"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <img
                              src={
                                savedWorker.worker.profile.avatar_url ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  savedWorker.worker.profile.full_name || "User"
                                )}&background=f97316&color=fff`
                              }
                              alt={
                                savedWorker.worker.profile.full_name || "Worker"
                              }
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {savedWorker.worker.profile.full_name ||
                                  "Nieznany"}
                              </p>
                              <p className="text-sm text-gray-600">
                                {savedWorker.worker.specialization}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                handleRemoveSavedWorker(savedWorker.id)
                              }
                              className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                              title="Usuń"
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-900">
                              €{savedWorker.worker.hourly_rate}/h
                            </span>
                            <div className="flex items-center">
                              <svg
                                className="w-4 h-4 text-yellow-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="ml-1 text-sm text-gray-600">
                                {savedWorker.worker.rating
                                  ? savedWorker.worker.rating.toFixed(1)
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                          <button className="w-full px-3 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
                            Kontakt
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* My Reviews */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                      Moje opinie
                    </h2>
                    <span className="text-sm text-gray-500">
                      {reviews.length} opinii
                    </span>
                  </div>

                  {reviews.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Brak wystawionych opinii</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Wystawiaj opinie pracownikom po zakończeniu współpracy
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.slice(0, 5).map((review) => (
                        <div
                          key={review.id}
                          className="border-b border-gray-200 pb-4 last:border-0 last:pb-0"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">
                                {review.worker?.profile?.full_name ||
                                  "Nieznany pracownik"}
                              </p>
                              <p className="text-sm text-gray-600 mb-2">
                                {review.worker?.specialization ||
                                  "Brak specjalizacji"}
                              </p>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex items-center">
                                  {"⭐".repeat(review.rating)}
                                  {"☆".repeat(5 - review.rating)}
                                </div>
                                <span className="text-sm text-gray-600">
                                  {review.rating}/5
                                </span>
                                {review.status === "pending" && (
                                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">
                                    Oczekuje
                                  </span>
                                )}
                              </div>
                              {review.comment && (
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {review.comment}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                {review.created_at
                                  ? new Date(
                                      review.created_at
                                    ).toLocaleDateString("pl-PL")
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                {/* Employer Profile Card */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                  <div className="flex flex-col items-center">
                    {/* Avatar with fallback */}
                    <div className="relative mb-4">
                      {employerProfile?.logo_url ? (
                        <img
                          src={employerProfile.logo_url}
                          alt={employerProfile.company_name || "Pracodawca"}
                          className="w-24 h-24 rounded-full object-cover border-4 border-orange-100"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                            const fallback = (e.target as HTMLImageElement)
                              .nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-4xl border-4 border-orange-100"
                        style={{
                          display: employerProfile?.logo_url ? "none" : "flex",
                        }}
                      >
                        {employerProfile?.company_name?.[0]?.toUpperCase() ||
                          "P"}
                      </div>
                    </div>

                    {/* Logo Upload Button */}
                    <label className="mb-3 w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium cursor-pointer text-center transition-colors">
                      📷 Zmień logo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Company Info */}
                    <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
                      {employerProfile?.company_name || "Firma"}
                    </h3>

                    {employerProfile?.contact_email && (
                      <p className="text-sm text-gray-600 mb-2">
                        {employerProfile.contact_email}
                      </p>
                    )}

                    {employerProfile?.contact_phone && (
                      <p className="text-sm text-gray-600 mb-4">
                        {employerProfile.contact_phone}
                      </p>
                    )}

                    {/* Edit Profile Button */}
                    <Link
                      to="/employer/profile"
                      className="w-full px-4 py-2 border-2 border-orange-500 text-orange-600 rounded-lg font-medium hover:bg-orange-50 transition-colors text-center"
                    >
                      Edytuj profil
                    </Link>
                  </div>
                </div>

                {/* Cover Image Upload Section */}
                {employerProfile && (
                  <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      🖼️ Zdjęcie w tle profilu
                    </h3>
                    <CoverImageUploader
                      currentCoverUrl={(employerProfile as any).cover_image_url}
                      onUploadSuccess={handleCoverImageUploadSuccess}
                      profileType="employer"
                      profileId={employerProfile.id}
                    />
                  </div>
                )}

                {/* Messages Preview */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                      Wiadomości
                    </h2>
                    {unreadCount > 0 && (
                      <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>

                  {messages.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm">Brak wiadomości</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          onClick={() => handleOpenMessage(message)}
                          className={`border-b border-gray-100 pb-4 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                            !message.is_read
                              ? "bg-orange-50 -mx-4 px-4 py-2 rounded"
                              : ""
                          }`}
                        >
                          <div className="flex items-start gap-3 mb-1">
                            {/* Sender Avatar */}
                            <div className="flex-shrink-0">
                              {message.sender_profile?.avatar_url ? (
                                <img
                                  src={message.sender_profile.avatar_url}
                                  alt={
                                    message.sender_profile.full_name ||
                                    "Użytkownik"
                                  }
                                  className="w-10 h-10 rounded-full object-cover"
                                  onError={(e) => {
                                    (
                                      e.target as HTMLImageElement
                                    ).style.display = "none";
                                    const fallback = (
                                      e.target as HTMLImageElement
                                    ).nextElementSibling as HTMLElement;
                                    if (fallback)
                                      fallback.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <div
                                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                                style={{
                                  display: message.sender_profile?.avatar_url
                                    ? "none"
                                    : "flex",
                                }}
                              >
                                {message.sender_profile?.full_name?.[0]?.toUpperCase() ||
                                  "U"}
                              </div>
                            </div>

                            {/* Message Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <p
                                  className={`text-sm ${
                                    !message.is_read
                                      ? "font-bold"
                                      : "font-medium"
                                  } text-gray-900`}
                                >
                                  {message.sender_profile.full_name}
                                </p>
                                {!message.is_read && (
                                  <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1.5"></span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-1 truncate">
                                {message.subject}
                              </p>
                              <p className="text-xs text-gray-500">
                                {message.created_at
                                  ? new Date(
                                      message.created_at
                                    ).toLocaleDateString("pl-PL")
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleOpenMessagesModal}
                    className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Zobacz wszystkie
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Szybkie akcje
                  </h2>

                  <div className="space-y-3">
                    <button
                      onClick={handleQuickSearch}
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
                      Szukaj pracowników
                    </button>

                    <Link
                      to="/cleaning-companies"
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
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
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      Szukaj firm sprzątających
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
                      onClick={() => {
                        console.log(
                          "🧾 FAKTURY BUTTON CLICKED - Navigating to /faktury"
                        );
                      }}
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
              </div>
            </div>
          </TabPanel>

          {/* Profile Tab */}
          <TabPanel isActive={activeTab === "profile"}>
            <div className="max-w-2xl mx-auto">
              {/* Employer Profile Card */}
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <div className="flex flex-col items-center">
                  {/* Avatar with fallback */}
                  <div className="relative mb-4">
                    {employerProfile?.logo_url ? (
                      <img
                        src={employerProfile.logo_url}
                        alt={employerProfile.company_name || "Pracodawca"}
                        className="w-32 h-32 rounded-full object-cover border-4 border-orange-100"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          const fallback = (e.target as HTMLImageElement)
                            .nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className="w-32 h-32 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-5xl border-4 border-orange-100"
                      style={{
                        display: employerProfile?.logo_url ? "none" : "flex",
                      }}
                    >
                      {employerProfile?.company_name?.[0]?.toUpperCase() || "P"}
                    </div>
                  </div>

                  {/* Logo Upload Button */}
                  <label className="mb-4 w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-medium cursor-pointer text-center transition-colors">
                    📷 Zmień logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Company Info */}
                  <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
                    {employerProfile?.company_name || "Firma"}
                  </h3>

                  <div className="w-full space-y-3 mt-4">
                    {employerProfile?.contact_email && (
                      <div className="flex items-center gap-2 text-gray-600">
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
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <span>{employerProfile.contact_email}</span>
                      </div>
                    )}

                    {employerProfile?.contact_phone && (
                      <div className="flex items-center gap-2 text-gray-600">
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
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        <span>{employerProfile.contact_phone}</span>
                      </div>
                    )}

                    {employerProfile?.location_city && (
                      <div className="flex items-center gap-2 text-gray-600">
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
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>{employerProfile.location_city}</span>
                      </div>
                    )}

                    {employerProfile?.btw_number && (
                      <div className="flex items-center gap-2 text-gray-600">
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
                        <span>BTW: {employerProfile.btw_number}</span>
                      </div>
                    )}
                  </div>

                  {/* Edit Profile Button */}
                  <Link
                    to="/employer/profile"
                    className="w-full px-6 py-3 mt-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all text-center"
                  >
                    ⚙️ Edytuj pełny profil
                  </Link>
                </div>
              </div>

              {/* Cover Image Uploader (if exists) */}
              {employerProfile && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Zdjęcie okładki
                  </h3>
                  <CoverImageUploader
                    profileType="employer"
                    profileId={employerId || ""}
                    currentCoverUrl={employerProfile.cover_image_url || ""}
                    onUploadSuccess={(url) => {
                      console.log("✅ Cover uploaded:", url);
                      loadDashboardData();
                    }}
                  />
                </div>
              )}
            </div>
          </TabPanel>

          {/* Reviews Tab */}
          <TabPanel isActive={activeTab === "reviews"}>
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Moje opinie
                  </h2>
                  <span className="text-sm text-gray-500 bg-orange-100 px-3 py-1 rounded-full">
                    {reviews.length} opinii
                  </span>
                </div>

                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">⭐</div>
                    <p className="text-gray-500 text-lg">
                      Brak wystawionych opinii
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Wystawiaj opinie pracownikom po zakończeniu współpracy
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-lg">
                              {review.worker?.profile?.full_name ||
                                "Nieznany pracownik"}
                            </p>
                            <p className="text-sm text-gray-600 mb-3">
                              {review.worker?.specialization ||
                                "Brak specjalizacji"}
                            </p>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex items-center text-lg">
                                {"⭐".repeat(review.rating)}
                                {"☆".repeat(5 - review.rating)}
                              </div>
                              <span className="text-sm font-medium text-gray-700">
                                {review.rating}/5
                              </span>
                              {review.status === "pending" && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                                  Oczekuje
                                </span>
                              )}
                              {review.status === "published" && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                  Opublikowana
                                </span>
                              )}
                            </div>
                            {review.comment && (
                              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                {review.comment}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-2">
                              {review.created_at
                                ? new Date(
                                    review.created_at
                                  ).toLocaleDateString("pl-PL", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabPanel>

          {/* Messages Tab */}
          <TabPanel isActive={activeTab === "messages"}>
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Wiadomości
                  </h2>
                  {unreadCount > 0 && (
                    <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                      {unreadCount} nieprzeczytane
                    </span>
                  )}
                </div>

                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📬</div>
                    <p className="text-gray-500 text-lg">Brak wiadomości</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Wiadomości od pracowników pojawią się tutaj
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        onClick={() => handleOpenMessage(message)}
                        className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all ${
                          !message.is_read
                            ? "bg-orange-50 border-orange-200"
                            : "bg-white border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Sender Avatar */}
                          <div className="flex-shrink-0">
                            {message.sender_profile?.avatar_url ? (
                              <img
                                src={message.sender_profile.avatar_url}
                                alt={
                                  message.sender_profile.full_name ||
                                  "Użytkownik"
                                }
                                className="w-12 h-12 rounded-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                  const fallback = (
                                    e.target as HTMLImageElement
                                  ).nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg"
                              style={{
                                display: message.sender_profile?.avatar_url
                                  ? "none"
                                  : "flex",
                              }}
                            >
                              {message.sender_profile?.full_name?.[0]?.toUpperCase() ||
                                "U"}
                            </div>
                          </div>

                          {/* Message Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <p
                                className={`text-base ${
                                  !message.is_read
                                    ? "font-bold"
                                    : "font-semibold"
                                } text-gray-900`}
                              >
                                {message.sender_profile.full_name}
                              </p>
                              {!message.is_read && (
                                <span className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0 mt-1"></span>
                              )}
                            </div>
                            <p
                              className={`text-sm mb-2 ${
                                !message.is_read ? "font-medium" : ""
                              } text-gray-700`}
                            >
                              {message.subject}
                            </p>
                            <p className="text-xs text-gray-500">
                              {message.created_at
                                ? new Date(
                                    message.created_at
                                  ).toLocaleDateString("pl-PL", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabPanel>

          {/* Messages Modal */}
          {showMessagesModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Wiadomości {unreadCount > 0 && `(${unreadCount} nowe)`}
                  </h2>
                  <button
                    onClick={() => {
                      setShowMessagesModal(false);
                      setSelectedMessage(null);
                      setReplyContent("");
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 h-[calc(90vh-120px)]">
                  {/* Messages List */}
                  <div className="lg:col-span-1 border-r border-gray-200 overflow-y-auto p-4">
                    {messages.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        Brak wiadomości
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {messages.map((msg) => (
                          <button
                            key={msg.id}
                            onClick={() => handleOpenMessage(msg)}
                            className={`w-full text-left p-4 rounded-lg transition-all ${
                              selectedMessage?.id === msg.id
                                ? "bg-orange-100 border-2 border-orange-500"
                                : msg.is_read
                                ? "bg-white border border-gray-200 hover:border-gray-300"
                                : "bg-orange-50 border-2 border-orange-300 hover:border-orange-400"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Sender Avatar */}
                              <div className="flex-shrink-0">
                                {msg.sender_profile?.avatar_url ? (
                                  <img
                                    src={msg.sender_profile.avatar_url}
                                    alt={
                                      msg.sender_profile.full_name ||
                                      "Użytkownik"
                                    }
                                    className="w-12 h-12 rounded-full object-cover"
                                    onError={(e) => {
                                      (
                                        e.target as HTMLImageElement
                                      ).style.display = "none";
                                      const fallback = (
                                        e.target as HTMLImageElement
                                      ).nextElementSibling as HTMLElement;
                                      if (fallback)
                                        fallback.style.display = "flex";
                                    }}
                                  />
                                ) : null}
                                <div
                                  className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg"
                                  style={{
                                    display: msg.sender_profile?.avatar_url
                                      ? "none"
                                      : "flex",
                                  }}
                                >
                                  {msg.sender_profile?.full_name?.[0]?.toUpperCase() ||
                                    "U"}
                                </div>
                              </div>

                              {/* Message Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <span
                                    className={`font-semibold ${
                                      msg.is_read
                                        ? "text-gray-900"
                                        : "text-orange-600"
                                    }`}
                                  >
                                    {msg.sender_profile?.full_name ||
                                      "Nieznany nadawca"}
                                  </span>
                                  {!msg.is_read && (
                                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-1 truncate">
                                  {msg.subject}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {msg.created_at
                                    ? new Date(
                                        msg.created_at
                                      ).toLocaleDateString("pl-PL")
                                    : "N/A"}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Message Detail */}
                  <div className="lg:col-span-2 overflow-y-auto p-6">
                    {!selectedMessage ? (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        Wybierz wiadomość aby ją przeczytać
                      </div>
                    ) : (
                      <div>
                        <div className="mb-6 pb-6 border-b border-gray-200">
                          {/* Sender Info with Avatar */}
                          <div className="flex items-start gap-4 mb-4">
                            <div className="flex-shrink-0">
                              {selectedMessage.sender_profile?.avatar_url ? (
                                <img
                                  src={
                                    selectedMessage.sender_profile.avatar_url
                                  }
                                  alt={
                                    selectedMessage.sender_profile.full_name ||
                                    "Użytkownik"
                                  }
                                  className="w-16 h-16 rounded-full object-cover"
                                  onError={(e) => {
                                    (
                                      e.target as HTMLImageElement
                                    ).style.display = "none";
                                    const fallback = (
                                      e.target as HTMLImageElement
                                    ).nextElementSibling as HTMLElement;
                                    if (fallback)
                                      fallback.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <div
                                className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl"
                                style={{
                                  display: selectedMessage.sender_profile
                                    ?.avatar_url
                                    ? "none"
                                    : "flex",
                                }}
                              >
                                {selectedMessage.sender_profile?.full_name?.[0]?.toUpperCase() ||
                                  "U"}
                              </div>
                            </div>

                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {selectedMessage.subject}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>
                                  Od:{" "}
                                  {selectedMessage.sender_profile?.full_name}
                                </span>
                                <span>•</span>
                                <span>
                                  {selectedMessage.created_at
                                    ? new Date(
                                        selectedMessage.created_at
                                      ).toLocaleString("pl-PL")
                                    : "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mb-6 text-gray-700 whitespace-pre-wrap">
                          {selectedMessage.content}
                        </div>

                        {/* Reply Form */}
                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">
                            Odpowiedz
                          </h4>
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Wpisz swoją odpowiedź..."
                            className="w-full bg-white border border-gray-300 rounded-lg p-4 text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 min-h-[120px]"
                          />
                          <div className="flex justify-end gap-3 mt-4">
                            <button
                              onClick={() => {
                                setSelectedMessage(null);
                                setReplyContent("");
                              }}
                              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Anuluj
                            </button>
                            <button
                              onClick={handleSendReply}
                              disabled={sending || !replyContent.trim()}
                              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {sending ? "Wysyłanie..." : "Wyślij odpowiedź"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Communication Panel */}
          {showCommunicationPanel && (
            <div className="mt-8 bg-white rounded-lg shadow-lg border-2 border-blue-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      🏗️ Komunikacja Projektowa
                    </h2>
                    <p className="text-gray-600">
                      Zarządzaj komunikacją w projektach budowlanych
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCommunicationPanel(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <ProjectCommunicationManager
                  userRole="employer"
                  allowCreateProjects={true}
                />
              </div>
            </div>
          )}

          {/* Support Ticket Modal */}
          <SupportTicketModal
            isOpen={showSupportModal}
            onClose={() => setShowSupportModal(false)}
          />

          {/* Tablica Tab */}
          <TabPanel isActive={activeTab === "tablica"}>
            <FeedPage />
          </TabPanel>

          {/* My Posts Tab */}
          <TabPanel isActive={activeTab === "my_posts"}>
            <MyPosts />
          </TabPanel>

          {/* Saved Activity Tab */}
          <TabPanel isActive={activeTab === "saved_activity"}>
            <SavedActivity />
          </TabPanel>
        </PageContainer>
      </div>
    </div>
  );
};

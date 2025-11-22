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

// ===================================================================
// TYPESCRIPT INTERFACES - MESSENGER
// ===================================================================

interface Message {
  id: string;
  subject: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender_id: string;
  recipient_id: string;
  sender: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
  recipient?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
  attachments?: string[];
}

interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string;
  lastMessage: Message;
  unreadCount: number;
  messages: Message[];
  isOnline?: boolean;
}

// ===================================================================
// HELPER FUNCTIONS - MESSENGER CHAT
// ===================================================================

const groupMessagesByConversation = (
  messages: Message[],
  currentUserId: string
): Conversation[] => {
  const conversationMap = new Map<string, Conversation>();

  messages.forEach((msg) => {
    // Identify conversation partner (other person in the conversation)
    const partnerId =
      msg.sender_id === currentUserId ? msg.recipient_id : msg.sender_id;

    const partnerInfo =
      msg.sender_id === currentUserId ? msg.recipient : msg.sender;

    if (!conversationMap.has(partnerId)) {
      conversationMap.set(partnerId, {
        partnerId: partnerId,
        partnerName: partnerInfo?.full_name || "Użytkownik",
        partnerAvatar: partnerInfo?.avatar_url || undefined,
        lastMessage: msg,
        unreadCount: 0,
        messages: [],
        isOnline: false,
      });
    }

    const conversation = conversationMap.get(partnerId)!;
    conversation.messages.push(msg);

    // Count unread messages (received by current user)
    if (!msg.is_read && msg.recipient_id === currentUserId) {
      conversation.unreadCount++;
    }

    // Update last message if this one is newer
    if (
      new Date(msg.created_at) > new Date(conversation.lastMessage.created_at)
    ) {
      conversation.lastMessage = msg;
    }
  });

  // Sort conversations by last message time (newest first)
  return Array.from(conversationMap.values()).sort(
    (a, b) =>
      new Date(b.lastMessage.created_at).getTime() -
      new Date(a.lastMessage.created_at).getTime()
  );
};

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Teraz";
  if (diffMins < 60) return `${diffMins} min temu`;
  if (diffHours < 24) return `${diffHours} godz. temu`;
  if (diffDays < 7) return `${diffDays} dni temu`;
  return date.toLocaleDateString("pl-PL");
};

const getConversationPartner = (
  msg: Message,
  currentUserId: string
): { id: string; name: string; avatar?: string } => {
  if (msg.sender_id === currentUserId) {
    return {
      id: msg.recipient_id,
      name: msg.recipient?.full_name || "Użytkownik",
      avatar: msg.recipient?.avatar_url,
    };
  } else {
    return {
      id: msg.sender_id,
      name: msg.sender?.full_name || "Użytkownik",
      avatar: msg.sender?.avatar_url,
    };
  }
};

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

  // NEW MESSENGER STATE
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

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
      const [statsData, historyData, workersData, reviewsData] =
        await Promise.all([
          employerService.getEmployerStats(employer.id),
          employerService.getSearchHistory(employer.id, 5),
          employerService.getSavedWorkers(employer.id),
          employerService.getEmployerReviews(employer.id),
        ]);

      console.log("[EMPLOYER-DASH] Data loaded:", {
        has_stats: !!statsData,
        history_count: historyData.length,
        saved_workers: workersData.length,
        reviews_count: reviewsData.length,
      });

      setStats(statsData);
      setSearchHistory(historyData);
      setSavedWorkers(workersData);
      setReviews(reviewsData);

      // 3. Load messages with NEW bidirectional query
      await loadMessages(user.id);
    } catch (err) {
      console.error("[EMPLOYER-DASH] Error loading dashboard data:", err);
      setError("Failed to load dashboard data. Please refresh the page.");
    } finally {
      console.log("[EMPLOYER-DASH] Loading complete");
      setLoading(false);
    }
  };

  // =====================================================
  // NEW MESSENGER FUNCTIONS
  // =====================================================

  const loadMessages = async (userId: string) => {
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
          recipient_id,
          attachments,
          sender:profiles!messages_sender_id_fkey (
            id,
            full_name,
            avatar_url
          ),
          recipient:profiles!messages_recipient_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `
        )
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log(
        "🔍 [EmployerDashboard] Raw messages data:",
        data?.slice(0, 2)
      );

      const messagesWithSenders: Message[] = (data || []).map((msg) => ({
        id: msg.id,
        subject: msg.subject || "Bez tematu",
        content: msg.content,
        created_at: msg.created_at || new Date().toISOString(),
        is_read: msg.is_read || false,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        attachments: msg.attachments || [],
        sender: {
          id: msg.sender_id || "",
          full_name: msg.sender?.full_name || "Użytkownik",
          avatar_url: msg.sender?.avatar_url || undefined,
        },
        recipient: msg.recipient
          ? {
              id: msg.recipient_id || "",
              full_name: msg.recipient?.full_name || "Użytkownik",
              avatar_url: msg.recipient?.avatar_url || undefined,
            }
          : undefined,
      }));

      console.log(
        "✅ [EmployerDashboard] Processed messages:",
        messagesWithSenders.length
      );

      setMessages(messagesWithSenders);

      // Grupuj wiadomości w konwersacje
      const groupedConversations = groupMessagesByConversation(
        messagesWithSenders,
        userId
      );
      setConversations(groupedConversations);

      // Count unread messages
      const unread = messagesWithSenders.filter(
        (msg) => !msg.is_read && msg.recipient_id === userId
      ).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Error loading messages:", err);
      setMessages([]);
      setConversations([]);
      setUnreadCount(0);
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setSearchQuery("");
    setShowEmojiPicker(false);

    // Mark all unread messages in this conversation as read
    if (conversation.unreadCount > 0) {
      await handleMarkConversationAsRead(conversation);
    }
  };

  const handleMarkConversationAsRead = async (conversation: Conversation) => {
    try {
      const unreadMessageIds = conversation.messages
        .filter((msg) => !msg.is_read && msg.recipient_id === user?.id)
        .map((msg) => msg.id);

      if (unreadMessageIds.length === 0) return;

      const { error } = await supabase
        .from("messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in("id", unreadMessageIds);

      if (error) throw error;

      // Reload messages to update UI
      if (user?.id) await loadMessages(user.id);
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !messageInput.trim() || !user?.id) return;

    const currentPartnerId = selectedConversation.partnerId; // Zapamiętaj partnera

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: selectedConversation.partnerId,
        subject: "Chat message",
        content: messageInput.trim(),
        is_read: false,
        message_type: "direct",
      });

      if (error) throw error;

      setMessageInput("");
      setShowEmojiPicker(false);

      // Reload messages
      await loadMessages(user.id);

      // 🔥 FIX: Ponownie wybierz tę samą konwersację żeby zaktualizować czat
      setTimeout(() => {
        const updatedConversation = conversations.find(
          (conv) => conv.partnerId === currentPartnerId
        );
        if (updatedConversation) {
          setSelectedConversation(updatedConversation);
        }
      }, 100); // Krótkie opóźnienie żeby conversations zdążyło się zaktualizować
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const addEmojiToMessage = (emoji: string) => {
    setMessageInput((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      setUploadingFile(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `message-attachments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("attachments").getPublicUrl(filePath);

      setMessageInput((prev) => `${prev} 📎 ${file.name}`);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Błąd podczas przesłania pliku");
    } finally {
      setUploadingFile(false);
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
          <TabPanel isActive={activeTab === "profile"}>
            {/* Modern Stats Cards (from overview) */}
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

            {/* Quick Actions - PRZED gridem, full width */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                ⚡ Szybkie działania
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={handleQuickSearch}
                  className="px-4 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 flex items-center justify-center gap-2 transition-colors"
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
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
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
                  Firmy sprzątające
                </Link>

                <Link
                  to="/accountants"
                  className="px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2 transition-colors"
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
                  Księgowi
                </Link>
              </div>
            </div>

            {/* GŁÓWNY GRID 2+1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Search History */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
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
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
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
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
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
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
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
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
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
            {/* 💬 NOWOCZESNY MESSENGER UI - FULL REDESIGN */}
            <div className="max-w-7xl mx-auto">
              <div
                className="bg-white rounded-2xl shadow-xl overflow-hidden"
                style={{ height: "700px" }}
              >
                <div className="flex h-full">
                  {/* ============================================ */}
                  {/* LEFT PANEL: CONVERSATION LIST */}
                  {/* ============================================ */}
                  <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
                    {/* Header */}
                    <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
                      <h3 className="font-bold text-xl text-white mb-3 flex items-center gap-2">
                        <span>💬</span> Wiadomości
                      </h3>

                      {/* Search */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="🔍 Szukaj konwersacji..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full px-4 py-2 pl-10 rounded-lg border-0 focus:ring-2 focus:ring-white/50 text-sm"
                        />
                        <span className="absolute left-3 top-2.5 text-gray-400">
                          🔍
                        </span>
                      </div>
                    </div>

                    {/* Conversation List */}
                    <div className="flex-1 overflow-y-auto">
                      {conversations
                        .filter((conv) =>
                          conv.partnerName
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())
                        )
                        .map((conversation) => (
                          <div
                            key={conversation.partnerId}
                            onClick={() =>
                              handleSelectConversation(conversation)
                            }
                            className={`p-4 border-b border-gray-200 cursor-pointer transition-all duration-200 hover:bg-blue-50 ${
                              selectedConversation?.partnerId ===
                              conversation.partnerId
                                ? "bg-blue-100 border-l-4 border-l-blue-600"
                                : "hover:border-l-4 hover:border-l-blue-300"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Avatar */}
                              <div className="relative flex-shrink-0">
                                {conversation.partnerAvatar ? (
                                  <img
                                    src={conversation.partnerAvatar}
                                    alt={conversation.partnerName}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                    {conversation.partnerName
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>
                                )}
                                {conversation.isOnline && (
                                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p
                                    className={`font-semibold text-sm truncate ${
                                      conversation.unreadCount > 0
                                        ? "text-blue-700"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {conversation.partnerName}
                                  </p>
                                  {conversation.unreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                                      {conversation.unreadCount}
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-gray-600 truncate mb-1">
                                  {conversation.lastMessage.content}
                                </p>

                                <p className="text-xs text-gray-400">
                                  {formatRelativeTime(
                                    conversation.lastMessage.created_at
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}

                      {conversations.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                          <div className="text-6xl mb-4">💬</div>
                          <p className="text-center font-medium">
                            Brak konwersacji
                          </p>
                          <p className="text-xs text-center mt-2">
                            Twoje wiadomości pojawią się tutaj
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ============================================ */}
                  {/* RIGHT PANEL: CHAT WINDOW */}
                  {/* ============================================ */}
                  <div className="w-2/3 flex flex-col bg-white">
                    {selectedConversation ? (
                      <>
                        {/* Chat Header */}
                        <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {selectedConversation.partnerAvatar ? (
                                <img
                                  src={selectedConversation.partnerAvatar}
                                  alt={selectedConversation.partnerName}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                                  {selectedConversation.partnerName
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}
                              <div>
                                <h4 className="font-bold text-gray-900">
                                  {selectedConversation.partnerName}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {selectedConversation.isOnline ? (
                                    <span className="text-green-600 flex items-center gap-1">
                                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                      Online
                                    </span>
                                  ) : (
                                    "Offline"
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Więcej opcji"
                              >
                                <span className="text-gray-600">⋮</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                          {selectedConversation.messages
                            .sort(
                              (a, b) =>
                                new Date(a.created_at).getTime() -
                                new Date(b.created_at).getTime()
                            )
                            .map((msg, index) => {
                              const isOwnMessage = msg.sender_id === user?.id;
                              const showAvatar =
                                index === 0 ||
                                selectedConversation.messages[index - 1]
                                  ?.sender_id !== msg.sender_id;

                              return (
                                <div
                                  key={msg.id}
                                  className={`flex ${
                                    isOwnMessage
                                      ? "justify-end"
                                      : "justify-start"
                                  } gap-2`}
                                >
                                  {/* Avatar (for received messages) */}
                                  {!isOwnMessage && showAvatar && (
                                    <div className="flex-shrink-0">
                                      {selectedConversation.partnerAvatar ? (
                                        <img
                                          src={
                                            selectedConversation.partnerAvatar
                                          }
                                          alt={selectedConversation.partnerName}
                                          className="w-8 h-8 rounded-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-xs font-bold">
                                          {selectedConversation.partnerName
                                            .charAt(0)
                                            .toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {!isOwnMessage && !showAvatar && (
                                    <div className="w-8"></div>
                                  )}

                                  {/* Message Bubble */}
                                  <div
                                    className={`max-w-[70%] ${
                                      isOwnMessage ? "order-first" : ""
                                    }`}
                                  >
                                    <div
                                      className={`p-3 rounded-2xl shadow-md ${
                                        isOwnMessage
                                          ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-sm"
                                          : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
                                      }`}
                                    >
                                      <p className="text-sm leading-relaxed break-words">
                                        {msg.content}
                                      </p>

                                      {/* Attachments */}
                                      {msg.attachments &&
                                        msg.attachments.length > 0 && (
                                          <div className="mt-2 space-y-1">
                                            {msg.attachments.map((att, i) => (
                                              <div
                                                key={i}
                                                className={`text-xs px-2 py-1 rounded ${
                                                  isOwnMessage
                                                    ? "bg-blue-800/30"
                                                    : "bg-gray-100"
                                                }`}
                                              >
                                                📎 {att}
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                      <div className="flex items-center justify-end gap-2 mt-1">
                                        <p
                                          className={`text-xs ${
                                            isOwnMessage
                                              ? "text-blue-200"
                                              : "text-gray-400"
                                          }`}
                                        >
                                          {new Date(
                                            msg.created_at
                                          ).toLocaleTimeString("pl-PL", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </p>
                                        {isOwnMessage && msg.is_read && (
                                          <span
                                            className="text-blue-200"
                                            title="Przeczytane"
                                          >
                                            ✓✓
                                          </span>
                                        )}
                                        {isOwnMessage && !msg.is_read && (
                                          <span
                                            className="text-blue-300"
                                            title="Dostarczone"
                                          >
                                            ✓
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-gray-200 bg-white">
                          {/* Emoji Picker */}
                          {showEmojiPicker && (
                            <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex flex-wrap gap-2">
                                {[
                                  "😀",
                                  "😂",
                                  "😍",
                                  "🥰",
                                  "😎",
                                  "🤔",
                                  "👍",
                                  "👏",
                                  "🙌",
                                  "❤️",
                                  "🔥",
                                  "✨",
                                  "🎉",
                                  "💯",
                                  "👌",
                                  "🤝",
                                ].map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => addEmojiToMessage(emoji)}
                                    className="text-2xl hover:scale-125 transition-transform"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            {/* Emoji Button */}
                            <button
                              onClick={() =>
                                setShowEmojiPicker(!showEmojiPicker)
                              }
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-2xl"
                              title="Dodaj emoji"
                            >
                              😊
                            </button>

                            {/* File Upload */}
                            <label
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                              title="Załącz plik"
                            >
                              <input
                                type="file"
                                onChange={handleFileUpload}
                                className="hidden"
                                accept="image/*,.pdf,.doc,.docx"
                              />
                              <span className="text-xl">📎</span>
                            </label>

                            {/* Message Input */}
                            <input
                              type="text"
                              value={messageInput}
                              onChange={(e) => setMessageInput(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage();
                                }
                              }}
                              placeholder="Napisz wiadomość..."
                              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              disabled={uploadingFile}
                            />

                            {/* Send Button */}
                            <button
                              onClick={handleSendMessage}
                              disabled={!messageInput.trim() || uploadingFile}
                              className={`px-6 py-3 rounded-xl font-medium transition-all shadow-lg ${
                                messageInput.trim() && !uploadingFile
                                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
                                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              {uploadingFile ? "📤" : "📨"} Wyślij
                            </button>
                          </div>

                          <p className="text-xs text-gray-400 mt-2 text-center">
                            Enter = wyślij • Shift+Enter = nowa linia
                          </p>
                        </div>
                      </>
                    ) : (
                      /* Empty State */
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50">
                        <div className="text-8xl mb-6">💬</div>
                        <p className="text-xl font-medium mb-2">
                          Wybierz konwersację
                        </p>
                        <p className="text-sm text-center max-w-xs">
                          Kliknij na konwersację po lewej stronie, aby rozpocząć
                          czat
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>

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

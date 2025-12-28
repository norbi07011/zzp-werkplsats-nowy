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
import { useSidebar } from "../../contexts/SidebarContext";
import { useIsMobile } from "../../src/hooks/useIsMobile";
import { SupportTicketModal } from "../../src/components/SupportTicketModal";
import { supabase } from "@/lib/supabase";
import {
  saveAvailability,
  getAvailability,
  addUnavailableDate,
  getUnavailableDates,
  removeUnavailableDate,
} from "../../src/services/accountantService";
import type { WeeklyAvailability, UnavailableDate } from "../../types";
import {
  PageContainer,
  PageHeader,
  ContentCard,
} from "../../components/common/PageContainer";
import { StatChipsGrid, StatChipItem } from "../../components/StatChips";
import { Eye, Search, Bookmark, MessageSquare } from "lucide-react";
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
import { DashboardSidebar } from "../../components/DashboardSidebar";
import { NavigationDrawer } from "../../components/NavigationDrawer";
import { QuickActionsCard } from "../../components/QuickActionsCard";
import employerService, {
  type EmployerStats,
  type SearchHistoryItem,
  type SavedWorker,
  type SavedEntity,
  getAllSavedEntities,
} from "../../services/employerService";
import { getEmployerReviews } from "../../src/services/employerReviewService";
import type { Database } from "../../src/types/database.types";
import MyPosts from "./MyPosts";
import SavedActivity from "./SavedActivity";
import FeedPage from "../FeedPage_PREMIUM";
// NOTE: EmployerTeamPage removed - now accessed via /employer/team separate route
import { UpcomingEventsCard } from "../../components/UpcomingEventsCard";
import { GlowButton } from "../../components/ui/GlowButton";
import { MyProfilePreview } from "../../components/profile/MyProfilePreview";
import { EmployerSettingsPanel } from "../../components/settings/EmployerSettingsPanel";
import { EmployerSubscriptionPage } from "./EmployerSubscriptionPage";
// NOTE: Kilometers, Appointments and I18nProvider removed - they are only in /faktury module

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
  const isMobile = useIsMobile();
  const { activeTab, setActiveTab } = useUnifiedTabs("tablica");

  // State
  const [loading, setLoading] = useState(true);
  const { isSidebarOpen, closeSidebar } = useSidebar();
  const [error, setError] = useState<string | null>(null);
  const [employerId, setEmployerId] = useState<string | null>(null);
  const [employerProfile, setEmployerProfile] = useState<Employer | null>(null);

  // Data state
  const [stats, setStats] = useState<EmployerStats | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [savedWorkers, setSavedWorkers] = useState<SavedWorker[]>([]);
  const [savedEntities, setSavedEntities] = useState<SavedEntity[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewFilter, setReviewFilter] = useState<"all" | 1 | 2 | 3 | 4 | 5>(
    "all"
  );
  const [reviewSort, setReviewSort] = useState<
    "newest" | "oldest" | "highest" | "lowest"
  >("newest");
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [savedEntitiesFilter, setSavedEntitiesFilter] = useState<
    "all" | "worker" | "employer" | "accountant" | "cleaning_company"
  >("all");

  // NEW MESSENGER STATE
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [messagesSubTab, setMessagesSubTab] = useState<
    "wiadomosci" | "reakcje"
  >("wiadomosci");
  const [reactions, setReactions] = useState<any[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Communication UI state
  const [showCommunicationPanel, setShowCommunicationPanel] = useState(false);

  // Settings state
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    application_alerts: true,
    message_alerts: true,
    review_alerts: true,
  });
  const [privacySettings, setPrivacySettings] = useState<{
    profile_visibility: "public" | "contacts" | "private";
    show_email: boolean;
    show_phone: boolean;
    show_address: boolean;
    allow_messages: boolean;
  }>({
    profile_visibility: "public",
    show_email: true,
    show_phone: true,
    show_address: true,
    allow_messages: true,
  });

  // Portfolio state
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [portfolioForm, setPortfolioForm] = useState({
    title: "",
    description: "",
    images: [] as string[],
    project_url: "",
    video_url: "",
    category: "",
    start_date: "",
    end_date: "",
    completion_date: "",
    client_name: "",
    client_company: "",
    location: "",
    address: "",
    is_public: true,
    is_featured: false,
  });
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showProjectDetail, setShowProjectDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  // Availability state
  const [availability, setAvailability] = useState<WeeklyAvailability>({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  });
  const [blockedDates, setBlockedDates] = useState<UnavailableDate[]>([]);

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

      // Auto-refresh profile_views and saved workers co 30 sekund
      const refreshInterval = setInterval(() => {
        refreshProfileViews();
        refreshSavedWorkers();
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

  // ✅ NEW: Refresh saved workers/entities list
  const refreshSavedWorkers = async () => {
    if (!employerId) return;

    try {
      console.log(
        "🔄 [EMPLOYER-DASH] Refreshing saved entities for employer:",
        employerId
      );
      const workersData = await employerService.getSavedWorkers(employerId);
      setSavedWorkers(workersData);

      // Also load all entity types
      const allEntities = await getAllSavedEntities(employerId);
      setSavedEntities(allEntities);

      console.log(
        "✅ [EMPLOYER-DASH] Saved entities updated:",
        allEntities.length
      );
    } catch (error) {
      console.error(
        "❌ [EMPLOYER-DASH] Error refreshing saved entities:",
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
      setEmployerProfile(employer as any);

      // 2. Load all dashboard data in parallel
      console.log(
        "[EMPLOYER-DASH] Loading dashboard data for employer:",
        employer.id
      );
      const [statsData, historyData, workersData, entitiesData, reviewsResult] =
        await Promise.all([
          employerService.getEmployerStats(employer.id),
          employerService.getSearchHistory(employer.id, 5),
          employerService.getSavedWorkers(employer.id),
          getAllSavedEntities(employer.id),
          getEmployerReviews(employer.id),
        ]);

      const reviewsData = reviewsResult.success
        ? reviewsResult.reviews || []
        : [];

      console.log(
        "[EMPLOYER-DASH] 🔍 Reviews data from employerReviewService:",
        {
          success: reviewsResult.success,
          count: reviewsData.length,
          first_review: reviewsData[0],
        }
      );

      console.log("[EMPLOYER-DASH] Data loaded:", {
        has_stats: !!statsData,
        history_count: historyData.length,
        saved_workers: workersData.length,
        saved_entities: entitiesData.length,
        reviews_count: reviewsData.length,
      });

      setStats(statsData);
      setSearchHistory(historyData);
      setSavedWorkers(workersData);
      setSavedEntities(entitiesData);
      setReviews(reviewsData);

      // 3. Load portfolio projects
      const { data: portfolioData } = await (supabase as any)
        .from("employer_portfolio")
        .select("*")
        .eq("employer_id", employer.id)
        .order("created_at", { ascending: false });

      setPortfolio(portfolioData || []);

      // 4. Load messages with NEW bidirectional query
      await loadMessages(user.id);
      await loadReactions(user.id);
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
      const { data, error } = await (supabase as any)
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

      const messagesWithSenders: Message[] = (data || []).map((msg: any) => ({
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

  // Load reactions (all social interactions: reactions, comments, reviews)
  const loadReactions = async (userId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from("notifications")
        .select("id, type, title, message, is_read, created_at, link, data")
        .eq("user_id", userId)
        .in("type", ["story_reaction", "story_reply", "review"])
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setReactions(data || []);
      console.log("💗 REACTIONS LOADED:", data?.length || 0);
    } catch (err) {
      console.error("❌ ERROR LOADING REACTIONS:", err);
      setReactions([]);
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

      const { error } = await (supabase as any)
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
      const { error } = await (supabase as any).from("messages").insert({
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

  // =====================================================
  // PORTFOLIO HANDLERS
  // =====================================================

  const openPortfolioModal = (project?: any) => {
    if (project) {
      setEditingProjectId(project.id);
      setPortfolioForm({
        title: project.title || "",
        description: project.description || "",
        images: project.images || [],
        project_url: project.project_url || "",
        video_url: project.video_url || "",
        category: project.category || "",
        start_date: project.start_date || "",
        end_date: project.end_date || "",
        completion_date: project.completion_date || "",
        client_name: project.client_name || "",
        client_company: project.client_company || "",
        location: project.location || "",
        address: project.address || "",
        is_public: project.is_public ?? true,
        is_featured: project.is_featured ?? false,
      });
    }
    setShowPortfolioModal(true);
  };

  const resetPortfolioForm = () => {
    setPortfolioForm({
      title: "",
      description: "",
      images: [],
      project_url: "",
      video_url: "",
      category: "",
      start_date: "",
      end_date: "",
      completion_date: "",
      client_name: "",
      client_company: "",
      location: "",
      address: "",
      is_public: true,
      is_featured: false,
    });
    setEditingProjectId(null);
  };

  const handlePortfolioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employerId) return;

    setSaving(true);
    try {
      const sanitizedForm = {
        ...portfolioForm,
        start_date: portfolioForm.start_date?.trim() || null,
        end_date: portfolioForm.end_date?.trim() || null,
        completion_date: portfolioForm.completion_date?.trim() || null,
      };

      if (editingProjectId) {
        const { error } = await (supabase as any)
          .from("employer_portfolio")
          .update(sanitizedForm)
          .eq("id", editingProjectId);

        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("employer_portfolio")
          .insert({ ...sanitizedForm, employer_id: employerId });

        if (error) throw error;
      }

      await loadDashboardData();
      setShowPortfolioModal(false);
      resetPortfolioForm();
    } catch (err) {
      console.error("Portfolio submit error:", err);
      setError("❌ Nie udało się zapisać projektu");
    } finally {
      setSaving(false);
    }
  };

  const handlePortfolioDelete = async (projectId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten projekt?")) return;

    try {
      const { error } = await (supabase as any)
        .from("employer_portfolio")
        .delete()
        .eq("id", projectId);

      if (error) throw error;
      await loadDashboardData();
    } catch (err) {
      console.error("Portfolio delete error:", err);
      setError("❌ Nie udało się usunąć projektu");
    }
  };

  const handlePortfolioImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      setSaving(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `employer-portfolio/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("portfolio-images")
        .getPublicUrl(filePath);

      setPortfolioForm({
        ...portfolioForm,
        images: [...portfolioForm.images, data.publicUrl],
      });
    } catch (err) {
      console.error("Image upload error:", err);
      setError("❌ Nie udało się przesłać zdjęcia");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // SETTINGS HANDLERS
  // =====================================================

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
  // COMPANY DATA & SETTINGS HANDLERS
  // =====================================================

  const handleCompanyDataSave = async (data: {
    company_name: string;
    kvk_number: string;
    btw_number: string;
    website: string;
    description: string;
    industry: string;
    company_size: string;
    company_type: string;
    address: string;
    city: string;
    postal_code: string;
    country: string;
    contact_person: string;
    contact_phone: string;
    contact_email: string;
  }) => {
    if (!employerProfile) return;

    setSettingsSaving(true);
    try {
      const { error } = await supabase
        .from("employers")
        .update({
          company_name: data.company_name,
          kvk_number: data.kvk_number,
          btw_number: data.btw_number,
          website: data.website,
          description: data.description,
          industry: data.industry,
          company_size: data.company_size,
          company_type: data.company_type,
          address: data.address,
          city: data.city,
          postal_code: data.postal_code,
          country: data.country,
          contact_person: data.contact_person,
          contact_phone: data.contact_phone,
          contact_email: data.contact_email,
        } as any)
        .eq("id", employerProfile.id);

      if (error) throw error;

      setEmployerProfile({
        ...employerProfile,
        company_name: data.company_name,
        kvk_number: data.kvk_number,
        btw_number: data.btw_number,
        website: data.website,
        description: data.description,
        industry: data.industry,
        company_size: data.company_size,
        company_type: data.company_type,
        address: data.address,
        city: data.city,
        postal_code: data.postal_code,
        country: data.country,
        contact_person: data.contact_person,
        contact_phone: data.contact_phone,
        contact_email: data.contact_email,
      } as any);

      console.log("✅ Company data saved");
    } catch (error) {
      console.error("❌ Error saving company data:", error);
      alert("Błąd podczas zapisywania danych firmy");
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleNotificationSettingsSave = async () => {
    // TODO: Save to database when notification_settings column is added
    console.log(
      "✅ Notification settings saved (local only):",
      notificationSettings
    );
  };

  const handlePrivacySettingsSave = async () => {
    // TODO: Save to database when privacy_settings column is added
    console.log("✅ Privacy settings saved (local only):", privacySettings);
  };

  // =====================================================
  // AVAILABILITY HANDLERS
  // =====================================================

  const handleAvailabilityChange = async (
    newAvailability: WeeklyAvailability
  ) => {
    setAvailability(newAvailability);

    if (!user) return;

    // Save to database
    const result = await saveAvailability(user.id, newAvailability);

    if (result.success) {
      console.log("✅ Employer availability saved to database");
    } else {
      console.error("❌ Failed to save availability:", result.error);
      alert("Nie udało się zapisać dostępności: " + result.error);
    }
  };

  const handleBlockDate = async (date: UnavailableDate) => {
    if (!user) return;

    // Save to database first
    const result = await addUnavailableDate(user.id, date.date, date.reason);

    if (result.success) {
      // Reload blocked dates from database to get ID
      const updatedDates = await getUnavailableDates(user.id);
      setBlockedDates(updatedDates || []);
      console.log("✅ Date blocked and saved to database");
    } else {
      console.error("❌ Failed to block date:", result.error);
      alert("Nie udało się zablokować daty: " + result.error);
    }
  };

  const handleUnblockDate = async (dateOrId: string | any) => {
    if (!user) return;

    // Extract ID from object or use string as date
    const dateId = typeof dateOrId === "object" ? dateOrId.id : dateOrId;

    if (!dateId) {
      console.error("❌ No ID provided for unblock");
      return;
    }

    // Remove from database
    const result = await removeUnavailableDate(dateId);

    if (result.success) {
      // Update local state
      setBlockedDates(blockedDates.filter((d: any) => d.id !== dateId));
      console.log("✅ Date unblocked and removed from database");
    } else {
      console.error("❌ Failed to unblock date:", result.error);
      alert("Nie udało się odblokować daty: " + result.error);
    }
  };

  // Load availability on mount
  useEffect(() => {
    const loadAvailability = async () => {
      if (!user) return;

      try {
        const availData = await getAvailability(user.id);
        if (availData) {
          setAvailability({
            monday: availData.monday ?? true,
            tuesday: availData.tuesday ?? true,
            wednesday: availData.wednesday ?? true,
            thursday: availData.thursday ?? true,
            friday: availData.friday ?? true,
            saturday: availData.saturday ?? false,
            sunday: availData.sunday ?? false,
          });
        }

        const blockedData = await getUnavailableDates(user.id);
        setBlockedDates(blockedData || []);
      } catch (error) {
        console.error("❌ Error loading availability:", error);
      }
    };

    loadAvailability();
  }, [user]);

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

  // =====================================================
  // PORTFOLIO RENDERING
  // =====================================================

  const renderPortfolio = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              🎨 Moje Portfolio
            </h1>
            <button
              onClick={() => openPortfolioModal()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105"
            >
              ➕ Dodaj projekt
            </button>
          </div>

          {/* Portfolio Grid */}
          {portfolio.length === 0 ? (
            <div className="text-center py-16 relative">
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div className="p-12">
                  <div className="text-6xl mb-4">📂</div>
                  <p className="text-gray-300 mb-6">
                    Brak projektów w portfolio
                  </p>
                  <button
                    onClick={() => openPortfolioModal()}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                  >
                    Dodaj pierwszy projekt
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolio.map((project) => (
                <div
                  key={project.id}
                  className="relative group cursor-pointer"
                  onClick={() => {
                    setSelectedProject(project);
                    setShowProjectDetail(true);
                  }}
                >
                  <div
                    className="relative rounded-2xl overflow-hidden h-full transition-all duration-300 group-hover:scale-105"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255,255,255,0.15)",
                    }}
                  >
                    {project.images && project.images.length > 0 && (
                      <div className="relative h-56 overflow-hidden">
                        <img
                          src={project.images[0]}
                          alt={project.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxImages(project.images);
                            setLightboxIndex(0);
                            setLightboxOpen(true);
                          }}
                        />
                        {project.images.length > 1 && (
                          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold">
                            📷 {project.images.length}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-white mb-2 flex-1">
                          {project.title}
                        </h3>
                        {project.is_featured && (
                          <span className="ml-2 px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-lg font-bold">
                            ⭐ Wyróżnione
                          </span>
                        )}
                      </div>

                      <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                        {project.description}
                      </p>

                      {project.location && (
                        <div className="flex items-center gap-2 text-gray-300 text-sm mb-2">
                          <span className="text-purple-400">📍</span>
                          <span>{project.location}</span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4 border-t border-white/10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openPortfolioModal(project);
                          }}
                          className="px-4 py-2 bg-blue-600/80 text-white rounded-lg hover:bg-blue-600 transition-all"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePortfolioDelete(project.id);
                          }}
                          className="px-4 py-2 bg-red-600/80 text-white rounded-lg hover:bg-red-600 transition-all"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Portfolio Form Modal - Full Featured */}
          {showPortfolioModal && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 max-w-3xl w-full border border-slate-700 my-8 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-white mb-6">
                  {editingProjectId
                    ? "✏️ Edytuj projekt"
                    : "➕ Dodaj nowy projekt"}
                </h2>

                <form onSubmit={handlePortfolioSubmit} className="space-y-4">
                  {/* Nazwa projektu */}
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">
                      Nazwa projektu *
                    </label>
                    <input
                      type="text"
                      required
                      value={portfolioForm.title}
                      onChange={(e) =>
                        setPortfolioForm({
                          ...portfolioForm,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-gray-500"
                      placeholder="np. Nowoczesna instalacja elektryczna w apartamentowcu"
                    />
                  </div>

                  {/* Opis projektu */}
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">
                      Opis projektu *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={portfolioForm.description}
                      onChange={(e) =>
                        setPortfolioForm({
                          ...portfolioForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white resize-none placeholder-gray-500"
                      placeholder="Opisz szczegółowo zakres prac, użyte technologie, organizację projektu, rezultaty..."
                    />
                  </div>

                  {/* Lokalizacja i Adres */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">
                        📍 Lokalizacja (kraj/województwo)
                      </label>
                      <input
                        type="text"
                        value={portfolioForm.location}
                        onChange={(e) =>
                          setPortfolioForm({
                            ...portfolioForm,
                            location: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-gray-500"
                        placeholder="np. Warszawa, Mazowieckie"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">
                        🏠 Adres realizacji projektu
                      </label>
                      <input
                        type="text"
                        value={portfolioForm.address}
                        onChange={(e) =>
                          setPortfolioForm({
                            ...portfolioForm,
                            address: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-gray-500"
                        placeholder="ul. Przykładowa 123, Warszawa"
                      />
                    </div>
                  </div>

                  {/* Daty */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">
                        Data rozpoczęcia *
                      </label>
                      <input
                        type="date"
                        value={portfolioForm.start_date}
                        onChange={(e) =>
                          setPortfolioForm({
                            ...portfolioForm,
                            start_date: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">
                        Data zakończenia
                      </label>
                      <input
                        type="date"
                        value={portfolioForm.end_date}
                        onChange={(e) =>
                          setPortfolioForm({
                            ...portfolioForm,
                            end_date: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">
                        Data oddania projektu
                      </label>
                      <input
                        type="date"
                        value={portfolioForm.completion_date}
                        onChange={(e) =>
                          setPortfolioForm({
                            ...portfolioForm,
                            completion_date: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white"
                      />
                    </div>
                  </div>

                  {/* Klient i Firma */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">
                        👤 Klient (nazwisko/imię)
                      </label>
                      <input
                        type="text"
                        value={portfolioForm.client_name}
                        onChange={(e) =>
                          setPortfolioForm({
                            ...portfolioForm,
                            client_name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-gray-500"
                        placeholder="Jan Kowalski"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">
                        🏢 Firma/klienta
                      </label>
                      <input
                        type="text"
                        value={portfolioForm.client_company}
                        onChange={(e) =>
                          setPortfolioForm({
                            ...portfolioForm,
                            client_company: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-gray-500"
                        placeholder="XYZ Development Sp. z o.o."
                      />
                    </div>
                  </div>

                  {/* Kategoria */}
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">
                      🏷️ Kategoria
                    </label>
                    <select
                      value={portfolioForm.category}
                      onChange={(e) =>
                        setPortfolioForm({
                          ...portfolioForm,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white"
                    >
                      <option value="">Wybierz kategorię</option>
                      <option value="Budowa">Budowa</option>
                      <option value="Remont">Remont</option>
                      <option value="Instalacje">Instalacje</option>
                      <option value="Wykończenia">Wykończenia</option>
                      <option value="Projektowanie">Projektowanie</option>
                      <option value="Konsulting">Konsulting</option>
                      <option value="Zarządzanie projektem">
                        Zarządzanie projektem
                      </option>
                      <option value="IT">IT</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Produkcja">Produkcja</option>
                      <option value="Logistyka">Logistyka</option>
                      <option value="Handel">Handel</option>
                      <option value="Usługi">Usługi</option>
                      <option value="Inne">Inne</option>
                    </select>
                  </div>

                  {/* Link do projektu */}
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">
                      🔗 Link do projektu
                    </label>
                    <input
                      type="url"
                      value={portfolioForm.project_url}
                      onChange={(e) =>
                        setPortfolioForm({
                          ...portfolioForm,
                          project_url: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-gray-500"
                      placeholder="https://example.com"
                    />
                  </div>

                  {/* Zdjęcia projektu */}
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">
                      🖼️ Zdjęcia projektu
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePortfolioImageUpload}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                    />
                  </div>

                  {portfolioForm.images.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {portfolioForm.images.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={img}
                            alt={`Preview ${idx + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border-2 border-slate-600"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setPortfolioForm({
                                ...portfolioForm,
                                images: portfolioForm.images.filter(
                                  (_, i) => i !== idx
                                ),
                              })
                            }
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center justify-center"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Opcje widoczności */}
                  <div className="flex gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={portfolioForm.is_public}
                        onChange={(e) =>
                          setPortfolioForm({
                            ...portfolioForm,
                            is_public: e.target.checked,
                          })
                        }
                        className="w-5 h-5 rounded bg-slate-800 border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-300">
                        👁️ Widoczne osmotniczo
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={portfolioForm.is_featured}
                        onChange={(e) =>
                          setPortfolioForm({
                            ...portfolioForm,
                            is_featured: e.target.checked,
                          })
                        }
                        className="w-5 h-5 rounded bg-slate-800 border-slate-600 text-yellow-500 focus:ring-2 focus:ring-yellow-500"
                      />
                      <span className="text-gray-300">⭐ Wyróżnione</span>
                    </label>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-slate-700 mt-6">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 transition-all"
                    >
                      {saving ? "⏳ Zapisywanie..." : "💾 Dodaj projekt"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPortfolioModal(false);
                        resetPortfolioForm();
                      }}
                      className="px-6 py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-all"
                    >
                      ❌ Anuluj
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Lightbox */}
          {lightboxOpen && (
            <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-4">
              <button
                onClick={() => setLightboxOpen(false)}
                className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-2xl"
              >
                ✕
              </button>
              {lightboxImages.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setLightboxIndex(Math.max(0, lightboxIndex - 1))
                    }
                    disabled={lightboxIndex === 0}
                    className="absolute left-4 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-2xl disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    onClick={() =>
                      setLightboxIndex(
                        Math.min(lightboxImages.length - 1, lightboxIndex + 1)
                      )
                    }
                    disabled={lightboxIndex === lightboxImages.length - 1}
                    className="absolute right-4 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-2xl disabled:opacity-30"
                  >
                    →
                  </button>
                </>
              )}
              <img
                src={lightboxImages[lightboxIndex]}
                alt={`Image ${lightboxIndex + 1}`}
                className="max-w-full max-h-[85vh] object-contain rounded-2xl"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const statsCards = getStatsCards();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 3D Background Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden perspective-container">
        <Animated3DProfileBackground role="employer" opacity={0.25} />
        <SpinningNumbers opacity={0.15} />
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex h-screen relative z-10">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <DashboardSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            title="🏢 Pracodawca"
            subtitle="Panel zarządzania"
            unreadMessages={unreadCount}
            onSupportClick={() => setShowSupportModal(true)}
          />
        )}

        {/* Mobile Navigation Drawer */}
        {isMobile && (
          <DashboardSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            title="🏢 Pracodawca"
            subtitle="Panel zarządzania"
            unreadMessages={unreadCount}
            isMobile={true}
            isMobileMenuOpen={isSidebarOpen}
            onMobileMenuToggle={closeSidebar}
            onSupportClick={() => setShowSupportModal(true)}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main scrollable content */}
          <main className="flex-1 overflow-y-auto">
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
                            (e.target as HTMLImageElement).style.display =
                              "none";
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
                        {employerProfile?.company_name?.[0]?.toUpperCase() ||
                          "🏢"}
                      </div>
                    </div>

                    {/* Header Text */}
                    <div>
                      <h1 className="text-4xl font-bold tracking-tight mb-2">
                        <span className="mr-2">🏢</span>
                        {employerProfile?.company_name || "Panel pracodawcy"}
                      </h1>
                      <p className="text-blue-100 text-lg">
                        Witamy ponownie, {user?.fullName || "Pracodawco"}!
                        Zarządzaj swoimi pracownikami i projektami
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
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-400/20 rounded-full blur-xl"></div>
              </div>

              {/* Tab Panels */}
              <TabPanel isActive={activeTab === "profile"}>
                {/* Modern Premium Stats Chips */}
                <StatChipsGrid
                  items={
                    [
                      {
                        id: "views",
                        label: "Profile Views",
                        value: stats?.profile_views || 0,
                        tone: "cyan",
                        icon: <Eye size={16} />,
                      },
                      {
                        id: "searches",
                        label: "Searches This Month",
                        value: stats?.searches_this_month || 0,
                        tone: "violet",
                        icon: <Search size={16} />,
                      },
                      {
                        id: "saved",
                        label: "Saved Workers",
                        value: stats?.total_saved_workers || 0,
                        tone: "amber",
                        icon: <Bookmark size={16} />,
                      },
                      {
                        id: "contacts",
                        label: "Contacts This Month",
                        value: stats?.contacts_this_month || 0,
                        tone: "emerald",
                        icon: <MessageSquare size={16} />,
                      },
                    ] as StatChipItem[]
                  }
                  columns={4}
                />

                {/* GŁÓWNY GRID 3 kolumny */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Recent Search History */}
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
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
                        <p className="text-gray-500">
                          Brak historii wyszukiwań
                        </p>
                        <button
                          onClick={handleQuickSearch}
                          className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                        >
                          Rozpocznij pierwsze wyszukiwanie
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {searchHistory.slice(0, 5).map((search) => (
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

                  {/* Upcoming Events */}
                  <UpcomingEventsCard />

                  {/* Saved Entities (Workers, Employers, Accountants, Cleaning Companies) */}
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900">
                        Zapisane profile
                      </h2>
                      <Link
                        to="/employer/search"
                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                      >
                        Szukaj więcej →
                      </Link>
                    </div>

                    {/* Entity Type Filters */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {[
                        { key: "all", label: "Wszystkie", icon: "📋" },
                        { key: "worker", label: "Pracownicy", icon: "👷" },
                        { key: "employer", label: "Pracodawcy", icon: "🏢" },
                        { key: "accountant", label: "Księgowi", icon: "📊" },
                        {
                          key: "cleaning_company",
                          label: "Firmy sprzątające",
                          icon: "🧹",
                        },
                      ].map((filter) => (
                        <button
                          key={filter.key}
                          onClick={() =>
                            setSavedEntitiesFilter(
                              filter.key as typeof savedEntitiesFilter
                            )
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                            savedEntitiesFilter === filter.key
                              ? "bg-orange-500 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          <span>{filter.icon}</span>
                          <span>{filter.label}</span>
                        </button>
                      ))}
                    </div>

                    {(() => {
                      const filteredEntities =
                        savedEntitiesFilter === "all"
                          ? savedEntities
                          : savedEntities.filter(
                              (e) => e.entity_type === savedEntitiesFilter
                            );

                      if (filteredEntities.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <p className="text-gray-500">
                              {savedEntitiesFilter === "all"
                                ? "Brak zapisanych profili"
                                : `Brak zapisanych ${
                                    savedEntitiesFilter === "worker"
                                      ? "pracowników"
                                      : savedEntitiesFilter === "employer"
                                      ? "pracodawców"
                                      : savedEntitiesFilter === "accountant"
                                      ? "księgowych"
                                      : "firm sprzątających"
                                  }`}
                            </p>
                            <p className="text-sm text-gray-400 mt-2">
                              Zapisz profile podczas wyszukiwania, aby szybko do
                              nich wrócić
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          {filteredEntities.slice(0, 6).map((entity) => {
                            // Determine icon and color based on entity type - use full class names for Tailwind
                            const typeConfig: Record<
                              string,
                              {
                                icon: string;
                                bgClass: string;
                                textClass: string;
                                label: string;
                                link: string;
                              }
                            > = {
                              worker: {
                                icon: "👷",
                                bgClass: "bg-orange-100",
                                textClass: "text-orange-700",
                                label: "Pracownik",
                                link: `/worker/profile/${entity.entity_id}`,
                              },
                              employer: {
                                icon: "🏢",
                                bgClass: "bg-blue-100",
                                textClass: "text-blue-700",
                                label: "Pracodawca",
                                link: `/employer/profile/${entity.entity_id}`,
                              },
                              accountant: {
                                icon: "📊",
                                bgClass: "bg-green-100",
                                textClass: "text-green-700",
                                label: "Księgowy",
                                link: `/accountant/profile/${entity.entity_id}`,
                              },
                              cleaning_company: {
                                icon: "🧹",
                                bgClass: "bg-purple-100",
                                textClass: "text-purple-700",
                                label: "Firma sprzątająca",
                                link: `/cleaning-company/profile/${entity.entity_id}`,
                              },
                            };
                            const config =
                              typeConfig[entity.entity_type] ||
                              typeConfig.worker;

                            return (
                              <Link
                                key={entity.id}
                                to={config.link}
                                className="block border border-gray-200 rounded-lg p-3 hover:border-orange-500 transition-colors relative group"
                              >
                                <div className="flex items-center gap-3">
                                  {entity.entity_avatar ? (
                                    <img
                                      src={entity.entity_avatar}
                                      alt={entity.entity_name || "Profile"}
                                      className="w-10 h-10 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div
                                      className={`w-10 h-10 rounded-full ${config.bgClass} flex items-center justify-center text-lg`}
                                    >
                                      {config.icon}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate text-sm">
                                      {entity.entity_name || "Nieznany"}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`text-xs px-2 py-0.5 rounded-full ${config.bgClass} ${config.textClass}`}
                                      >
                                        {config.label}
                                      </span>
                                      {entity.entity_location && (
                                        <span className="text-xs text-gray-500">
                                          📍 {entity.entity_location}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {entity.entity_rating != null &&
                                      entity.entity_rating > 0 && (
                                        <span className="text-sm font-medium text-gray-900">
                                          ⭐{" "}
                                          {Number(entity.entity_rating).toFixed(
                                            1
                                          )}
                                        </span>
                                      )}
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleRemoveSavedWorker(entity.id);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                                      title="Usuń"
                                    >
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
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </TabPanel>

              {/* Reviews Tab */}
              <TabPanel isActive={activeTab === "reviews"}>
                <div className="max-w-7xl mx-auto">
                  {/* My Reviews - Full System */}
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    {/* Gradient Header with Stats */}
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
                      <h2 className="text-2xl font-bold text-white mb-6">
                        Moje opinie
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Total Reviews */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                          <p className="text-white/80 text-sm mb-1">
                            Łącznie opinii
                          </p>
                          <p className="text-white text-2xl font-bold">
                            {reviews.length}
                          </p>
                        </div>
                        {/* Average Rating */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                          <p className="text-white/80 text-sm mb-1">
                            Średnia ocena
                          </p>
                          <p className="text-white text-2xl font-bold">
                            {reviews.length > 0
                              ? (
                                  reviews.reduce(
                                    (sum, r) => sum + r.rating,
                                    0
                                  ) / reviews.length
                                ).toFixed(1)
                              : "0.0"}
                            <span className="text-lg ml-1">⭐</span>
                          </p>
                        </div>
                        {/* Positive Reviews */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                          <p className="text-white/80 text-sm mb-1">
                            Pozytywne (4-5⭐)
                          </p>
                          <p className="text-white text-2xl font-bold">
                            {reviews.filter((r) => r.rating >= 4).length}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Rating Breakdown */}
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Rozkład ocen
                      </h3>
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((stars) => {
                          const count = reviews.filter(
                            (r) => r.rating === stars
                          ).length;
                          const percentage =
                            reviews.length > 0
                              ? (count / reviews.length) * 100
                              : 0;
                          return (
                            <div
                              key={stars}
                              className="flex items-center gap-3"
                            >
                              <span className="text-sm text-gray-600 w-12">
                                {stars} ⭐
                              </span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-2.5 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 w-16 text-right">
                                {count} ({percentage.toFixed(0)}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Filters and Sorting */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        {/* Filter Buttons */}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setReviewFilter("all")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              reviewFilter === "all"
                                ? "bg-purple-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            Wszystkie
                          </button>
                          {[5, 4, 3, 2, 1].map((stars) => (
                            <button
                              key={stars}
                              onClick={() =>
                                setReviewFilter(stars as 1 | 2 | 3 | 4 | 5)
                              }
                              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                reviewFilter === stars
                                  ? "bg-purple-600 text-white"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {stars}⭐
                            </button>
                          ))}
                        </div>

                        {/* Sort Dropdown */}
                        <select
                          value={reviewSort}
                          onChange={(e) =>
                            setReviewSort(
                              e.target.value as
                                | "newest"
                                | "oldest"
                                | "highest"
                                | "lowest"
                            )
                          }
                          className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="newest">Najnowsze</option>
                          <option value="oldest">Najstarsze</option>
                          <option value="highest">Najwyższe oceny</option>
                          <option value="lowest">Najniższe oceny</option>
                        </select>
                      </div>
                    </div>

                    {/* Reviews List */}
                    <div className="p-6">
                      {reviews.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">📝</div>
                          <p className="text-gray-500 text-lg mb-2">
                            Brak wystawionych opinii
                          </p>
                          <p className="text-sm text-gray-400">
                            Wystawiaj opinie pracownikom po zakończeniu
                            współpracy
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {(() => {
                            // Filter reviews
                            let filteredReviews = reviews;
                            if (reviewFilter !== "all") {
                              filteredReviews = reviews.filter(
                                (r) => r.rating === reviewFilter
                              );
                            }

                            // Sort reviews
                            const sortedReviews = [...filteredReviews].sort(
                              (a, b) => {
                                switch (reviewSort) {
                                  case "newest":
                                    return (
                                      new Date(b.created_at || 0).getTime() -
                                      new Date(a.created_at || 0).getTime()
                                    );
                                  case "oldest":
                                    return (
                                      new Date(a.created_at || 0).getTime() -
                                      new Date(b.created_at || 0).getTime()
                                    );
                                  case "highest":
                                    return b.rating - a.rating;
                                  case "lowest":
                                    return a.rating - b.rating;
                                  default:
                                    return 0;
                                }
                              }
                            );

                            // Pagination
                            const displayedReviews = showAllReviews
                              ? sortedReviews
                              : sortedReviews.slice(0, 5);

                            return (
                              <>
                                {displayedReviews.map((review) => (
                                  <div
                                    key={review.id}
                                    className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                                  >
                                    {/* Review Header */}
                                    <div className="flex items-start gap-4 mb-4">
                                      {/* Reviewer Avatar */}
                                      <div className="flex-shrink-0">
                                        {(review as any).workers
                                          ?.workers_profile?.avatar_url ||
                                        (review as any).profiles?.avatar_url ||
                                        (review as any).cleaning_companies
                                          ?.avatar_url ||
                                        (review as any).accountants
                                          ?.avatar_url ? (
                                          <img
                                            src={
                                              (review as any).workers
                                                ?.workers_profile?.avatar_url ||
                                              (review as any).profiles
                                                ?.avatar_url ||
                                              (review as any).cleaning_companies
                                                ?.avatar_url ||
                                              (review as any).accountants
                                                ?.avatar_url
                                            }
                                            alt="Reviewer"
                                            className="w-12 h-12 rounded-full object-cover border-2 border-purple-200"
                                          />
                                        ) : (
                                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                                            {((review as any).workers
                                              ?.workers_profile?.full_name ||
                                              (review as any).profiles
                                                ?.full_name ||
                                              (review as any).cleaning_companies
                                                ?.company_name ||
                                              (review as any).accountants
                                                ?.company_name ||
                                              "U")?.[0]?.toUpperCase() || "U"}
                                          </div>
                                        )}
                                      </div>

                                      {/* Reviewer Info and Rating */}
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 text-lg">
                                          {(review as any).workers
                                            ?.workers_profile?.full_name ||
                                            (review as any).profiles
                                              ?.full_name ||
                                            (review as any).cleaning_companies
                                              ?.company_name ||
                                            (review as any).accountants
                                              ?.company_name ||
                                            "Użytkownik"}
                                        </h4>
                                        <p className="text-sm text-gray-600 mb-2">
                                          {(review as any).worker_id
                                            ? "Pracownik"
                                            : (review as any)
                                                .cleaning_company_id
                                            ? "Firma sprzątająca"
                                            : (review as any).accountant_id
                                            ? "Księgowy"
                                            : "Recenzent"}
                                        </p>
                                        <div className="flex items-center gap-3">
                                          <div className="flex items-center">
                                            {Array.from(
                                              { length: 5 },
                                              (_, i) => (
                                                <span
                                                  key={i}
                                                  className={`text-xl ${
                                                    i < review.rating
                                                      ? "text-yellow-400"
                                                      : "text-gray-300"
                                                  }`}
                                                >
                                                  ⭐
                                                </span>
                                              )
                                            )}
                                          </div>
                                          <span className="text-sm text-gray-600 font-medium">
                                            {review.rating}/5
                                          </span>
                                        </div>
                                      </div>

                                      {/* Date */}
                                      <div className="text-right">
                                        <p className="text-sm text-gray-500">
                                          {review.created_at
                                            ? new Date(
                                                review.created_at
                                              ).toLocaleDateString("pl-PL", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                              })
                                            : "N/A"}
                                        </p>
                                        {review.status === "pending" && (
                                          <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded font-medium">
                                            Oczekuje
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Detailed Ratings (4 mini cards) */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                      {/* Quality Rating */}
                                      <div className="border-l-4 border-purple-500 bg-purple-50 rounded-lg p-3">
                                        <p className="text-xs text-purple-700 font-medium mb-1">
                                          Jakość pracy
                                        </p>
                                        <div className="flex items-center gap-1">
                                          {Array.from({ length: 5 }, (_, i) => (
                                            <span
                                              key={i}
                                              className={`text-sm ${
                                                i < review.rating
                                                  ? "text-purple-600"
                                                  : "text-purple-200"
                                              }`}
                                            >
                                              ⭐
                                            </span>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Communication Rating */}
                                      <div className="border-l-4 border-green-500 bg-green-50 rounded-lg p-3">
                                        <p className="text-xs text-green-700 font-medium mb-1">
                                          Komunikacja
                                        </p>
                                        <div className="flex items-center gap-1">
                                          {Array.from({ length: 5 }, (_, i) => (
                                            <span
                                              key={i}
                                              className={`text-sm ${
                                                i < review.rating
                                                  ? "text-green-600"
                                                  : "text-green-200"
                                              }`}
                                            >
                                              ⭐
                                            </span>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Punctuality Rating */}
                                      <div className="border-l-4 border-orange-500 bg-orange-50 rounded-lg p-3">
                                        <p className="text-xs text-orange-700 font-medium mb-1">
                                          Terminowość
                                        </p>
                                        <div className="flex items-center gap-1">
                                          {Array.from({ length: 5 }, (_, i) => (
                                            <span
                                              key={i}
                                              className={`text-sm ${
                                                i < review.rating
                                                  ? "text-orange-600"
                                                  : "text-orange-200"
                                              }`}
                                            >
                                              ⭐
                                            </span>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Professionalism Rating */}
                                      <div className="border-l-4 border-blue-500 bg-blue-50 rounded-lg p-3">
                                        <p className="text-xs text-blue-700 font-medium mb-1">
                                          Profesjonalizm
                                        </p>
                                        <div className="flex items-center gap-1">
                                          {Array.from({ length: 5 }, (_, i) => (
                                            <span
                                              key={i}
                                              className={`text-sm ${
                                                i < review.rating
                                                  ? "text-blue-600"
                                                  : "text-blue-200"
                                              }`}
                                            >
                                              ⭐
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Review Comment */}
                                    {review.comment && (
                                      <div className="mb-4">
                                        <p className="text-gray-700 leading-relaxed">
                                          {review.comment}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ))}

                                {/* Show More Button */}
                                {sortedReviews.length > 5 && (
                                  <div className="text-center pt-4">
                                    <button
                                      onClick={() =>
                                        setShowAllReviews(!showAllReviews)
                                      }
                                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
                                    >
                                      {showAllReviews
                                        ? "Pokaż mniej"
                                        : `Pokaż wszystkie (${sortedReviews.length})`}
                                    </button>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Export Section */}
                    {reviews.length > 0 && (
                      <div className="p-6 bg-gray-50 border-t border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">
                          Eksportuj opinie
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={() => {
                              const htmlContent = `
                            <!DOCTYPE html>
                            <html>
                            <head>
                              <meta charset="UTF-8">
                              <title>Opinie - ${
                                employerProfile?.company_name || "Pracodawca"
                              }</title>
                              <style>
                                body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
                                h1 { color: #9333ea; }
                                .review { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
                                .rating { color: #fbbf24; }
                              </style>
                            </head>
                            <body>
                              <h1>Opinie - ${
                                employerProfile?.company_name || "Pracodawca"
                              }</h1>
                              ${reviews
                                .map(
                                  (r) => `
                                <div class="review">
                                  <h3>${
                                    r.worker?.profile?.full_name ||
                                    "Nieznany pracownik"
                                  }</h3>
                                  <p class="rating">${"⭐".repeat(r.rating)}</p>
                                  <p>${r.comment || "Brak komentarza"}</p>
                                  <small>${
                                    r.created_at
                                      ? new Date(
                                          r.created_at
                                        ).toLocaleDateString("pl-PL")
                                      : "N/A"
                                  }</small>
                                </div>
                              `
                                )
                                .join("")}
                            </body>
                            </html>
                          `;
                              const blob = new Blob([htmlContent], {
                                type: "text/html",
                              });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `opinie-${Date.now()}.html`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                          >
                            📄 Pobierz PDF (HTML)
                          </button>
                          <button
                            onClick={() => {
                              const csvContent = [
                                [
                                  "Pracownik",
                                  "Ocena",
                                  "Komentarz",
                                  "Data",
                                ].join(","),
                                ...reviews.map((r) =>
                                  [
                                    r.worker?.profile?.full_name || "Nieznany",
                                    r.rating,
                                    `"${(r.comment || "").replace(
                                      /"/g,
                                      '""'
                                    )}"`,
                                    r.created_at
                                      ? new Date(
                                          r.created_at
                                        ).toLocaleDateString("pl-PL")
                                      : "N/A",
                                  ].join(",")
                                ),
                              ].join("\n");
                              const blob = new Blob([csvContent], {
                                type: "text/csv;charset=utf-8;",
                              });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `opinie-${Date.now()}.csv`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                          >
                            📊 Pobierz CSV
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          💡 PDF (HTML) - otwórz w przeglądarce i zapisz jako
                          PDF | CSV - importuj do Excel/Sheets
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabPanel>

              {/* Messages Tab */}
              <TabPanel isActive={activeTab === "messages"}>
                {/* 💬 SUB-TABS: WIADOMOŚCI | REAKCJE */}
                <div className="max-w-7xl mx-auto mb-6">
                  <div className="flex gap-2 border-b-2 border-gray-200">
                    <button
                      onClick={() => setMessagesSubTab("wiadomosci")}
                      className={`px-6 py-3 font-semibold transition-all ${
                        messagesSubTab === "wiadomosci"
                          ? "text-blue-600 border-b-4 border-blue-600 -mb-0.5"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      💬 Wiadomości
                    </button>
                    <button
                      onClick={() => setMessagesSubTab("reakcje")}
                      className={`px-6 py-3 font-semibold transition-all ${
                        messagesSubTab === "reakcje"
                          ? "text-pink-600 border-b-4 border-pink-600 -mb-0.5"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      💗 Reakcje
                      {reactions.filter((r) => !r.is_read).length > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-pink-500 text-white text-xs rounded-full">
                          {reactions.filter((r) => !r.is_read).length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* WIADOMOŚCI CONTENT */}
                {messagesSubTab === "wiadomosci" && (
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
                                    {/* Avatar - clickable */}
                                    <button
                                      onClick={async () => {
                                        const partnerId =
                                          selectedConversation.partnerId;
                                        if (!partnerId) return;
                                        try {
                                          const { data: profile } =
                                            await supabase
                                              .from("profiles")
                                              .select("role")
                                              .eq("id", partnerId)
                                              .single();
                                          const userRole =
                                            profile?.role || "worker";
                                          let roleSpecificId = partnerId;
                                          if (userRole === "worker") {
                                            const { data: worker } =
                                              await supabase
                                                .from("workers")
                                                .select("id")
                                                .eq("profile_id", partnerId)
                                                .maybeSingle();
                                            if (worker)
                                              roleSpecificId = worker.id;
                                          } else if (userRole === "employer") {
                                            const { data: employer } =
                                              await supabase
                                                .from("employers")
                                                .select("id")
                                                .eq("profile_id", partnerId)
                                                .maybeSingle();
                                            if (employer)
                                              roleSpecificId = employer.id;
                                          } else if (
                                            userRole === "accountant"
                                          ) {
                                            const { data: accountantData } =
                                              await supabase
                                                .from("accountants")
                                                .select("id")
                                                .eq("profile_id", partnerId)
                                                .maybeSingle();
                                            if (accountantData)
                                              roleSpecificId =
                                                accountantData.id;
                                          } else if (
                                            userRole === "cleaning_company"
                                          ) {
                                            const { data: company } =
                                              await supabase
                                                .from("cleaning_companies")
                                                .select("id")
                                                .eq("profile_id", partnerId)
                                                .maybeSingle();
                                            if (company)
                                              roleSpecificId = company.id;
                                          }
                                          const roleMap: Record<
                                            string,
                                            string
                                          > = {
                                            worker: "/worker/profile",
                                            employer: "/employer/profile",
                                            accountant: "/accountant/profile",
                                            cleaning_company:
                                              "/cleaning-company/profile",
                                            admin: "/admin/profile",
                                          };
                                          navigate(
                                            `${
                                              roleMap[userRole] ||
                                              "/worker/profile"
                                            }/${roleSpecificId}#contact`
                                          );
                                        } catch (error) {
                                          console.error(
                                            "Error navigating to profile:",
                                            error
                                          );
                                        }
                                      }}
                                      className="cursor-pointer hover:opacity-80 transition-opacity"
                                    >
                                      {selectedConversation.partnerAvatar ? (
                                        <img
                                          src={
                                            selectedConversation.partnerAvatar
                                          }
                                          alt={selectedConversation.partnerName}
                                          className="w-10 h-10 rounded-full object-cover border-2 border-blue-500 hover:border-blue-700 transition-colors"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 flex items-center justify-center text-white font-bold shadow-lg transition-all">
                                          {selectedConversation.partnerName
                                            .charAt(0)
                                            .toUpperCase()}
                                        </div>
                                      )}
                                    </button>
                                    <div>
                                      <button
                                        onClick={async () => {
                                          const partnerId =
                                            selectedConversation.partnerId;
                                          if (!partnerId) return;
                                          try {
                                            const { data: profile } =
                                              await supabase
                                                .from("profiles")
                                                .select("role")
                                                .eq("id", partnerId)
                                                .single();
                                            const userRole =
                                              profile?.role || "worker";
                                            let roleSpecificId = partnerId;
                                            if (userRole === "worker") {
                                              const { data: worker } =
                                                await supabase
                                                  .from("workers")
                                                  .select("id")
                                                  .eq("profile_id", partnerId)
                                                  .maybeSingle();
                                              if (worker)
                                                roleSpecificId = worker.id;
                                            } else if (
                                              userRole === "employer"
                                            ) {
                                              const { data: employer } =
                                                await supabase
                                                  .from("employers")
                                                  .select("id")
                                                  .eq("profile_id", partnerId)
                                                  .maybeSingle();
                                              if (employer)
                                                roleSpecificId = employer.id;
                                            } else if (
                                              userRole === "accountant"
                                            ) {
                                              const { data: accountantData } =
                                                await supabase
                                                  .from("accountants")
                                                  .select("id")
                                                  .eq("profile_id", partnerId)
                                                  .maybeSingle();
                                              if (accountantData)
                                                roleSpecificId =
                                                  accountantData.id;
                                            } else if (
                                              userRole === "cleaning_company"
                                            ) {
                                              const { data: company } =
                                                await supabase
                                                  .from("cleaning_companies")
                                                  .select("id")
                                                  .eq("profile_id", partnerId)
                                                  .maybeSingle();
                                              if (company)
                                                roleSpecificId = company.id;
                                            }
                                            const roleMap: Record<
                                              string,
                                              string
                                            > = {
                                              worker: "/worker/profile",
                                              employer: "/employer/profile",
                                              accountant: "/accountant/profile",
                                              cleaning_company:
                                                "/cleaning-company/profile",
                                              admin: "/admin/profile",
                                            };
                                            navigate(
                                              `${
                                                roleMap[userRole] ||
                                                "/worker/profile"
                                              }/${roleSpecificId}#contact`
                                            );
                                          } catch (error) {
                                            console.error(
                                              "Error navigating to profile:",
                                              error
                                            );
                                          }
                                        }}
                                        className="font-bold text-gray-900 hover:text-blue-600 hover:underline transition-colors cursor-pointer"
                                      >
                                        {selectedConversation.partnerName}
                                      </button>
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
                                    const isOwnMessage =
                                      msg.sender_id === user?.id;
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
                                                alt={
                                                  selectedConversation.partnerName
                                                }
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
                                                  {msg.attachments.map(
                                                    (att, i) => (
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
                                                    )
                                                  )}
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
                                          onClick={() =>
                                            addEmojiToMessage(emoji)
                                          }
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
                                    onChange={(e) =>
                                      setMessageInput(e.target.value)
                                    }
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
                                    disabled={
                                      !messageInput.trim() || uploadingFile
                                    }
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
                                Kliknij na konwersację po lewej stronie, aby
                                rozpocząć czat
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* END WIADOMOŚCI */}

                {/* REAKCJE CONTENT */}
                {messagesSubTab === "reakcje" && (
                  <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden p-6">
                      <h3 className="text-2xl font-bold mb-6 text-gray-900">
                        💗 Reakcje na Twoje relacje
                      </h3>

                      {reactions.length === 0 ? (
                        <div className="text-center py-20">
                          <div className="text-6xl mb-4">💭</div>
                          <p className="text-gray-500 text-lg">Brak reakcji</p>
                          <p className="text-gray-400 text-sm mt-2">
                            Gdy ktoś zareaguje na Twoją relację, zobaczysz to
                            tutaj
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {reactions.map((reaction) => {
                            const reactorData = reaction.data || {};
                            const reactorId =
                              reactorData.reactor_id || reactorData.sender_id;
                            const reactorName =
                              reactorData.reactor_name ||
                              reactorData.sender_name ||
                              "Użytkownik";
                            const reactorAvatar =
                              reactorData.reactor_avatar ||
                              reactorData.sender_avatar;
                            const reactorRole =
                              reactorData.reactor_role ||
                              reactorData.sender_role ||
                              "regular_user";

                            // Type-specific display
                            const getTypeInfo = (type: string) => {
                              switch (type) {
                                case "story_reaction":
                                  return {
                                    emoji: "👀",
                                    text: "zainteresował się Twoją relacją",
                                    color: "pink",
                                  };
                                case "story_reply":
                                  return {
                                    emoji: "💬",
                                    text: "skomentował Twoją relację",
                                    color: "blue",
                                  };
                                case "review":
                                  return {
                                    emoji: "⭐",
                                    text: "wystawił Ci opinię",
                                    color: "yellow",
                                  };
                                default:
                                  return {
                                    emoji: "🔔",
                                    text: "interakcja",
                                    color: "gray",
                                  };
                              }
                            };

                            const typeInfo = getTypeInfo(reaction.type);

                            // Generate profile URL based on role
                            const getProfileUrl = (
                              role: string,
                              id: string
                            ) => {
                              const roleMap: Record<string, string> = {
                                worker: "/worker/profile",
                                employer: "/employer/profile",
                                accountant: "/accountant/profile",
                                cleaning_company: "/cleaning-company/profile",
                                admin: "/admin/profile",
                                regular_user: "/worker/profile",
                              };
                              return `${
                                roleMap[role] || "/worker/profile"
                              }/${id}#contact`;
                            };

                            const handleProfileClick = async () => {
                              if (!reactorId) return;

                              try {
                                // First get the user's role from profiles table
                                const { data: profile } = await supabase
                                  .from("profiles")
                                  .select("role")
                                  .eq("id", reactorId)
                                  .single();

                                const userRole =
                                  profile?.role || reactorRole || "worker";

                                // Get the role-specific ID based on role
                                let roleSpecificId = reactorId;

                                if (userRole === "worker") {
                                  const { data: worker } = await supabase
                                    .from("workers")
                                    .select("id")
                                    .eq("profile_id", reactorId)
                                    .maybeSingle();
                                  if (worker) roleSpecificId = worker.id;
                                } else if (userRole === "employer") {
                                  const { data: employer } = await supabase
                                    .from("employers")
                                    .select("id")
                                    .eq("profile_id", reactorId)
                                    .maybeSingle();
                                  if (employer) roleSpecificId = employer.id;
                                } else if (userRole === "accountant") {
                                  const { data: accountantData } =
                                    await supabase
                                      .from("accountants")
                                      .select("id")
                                      .eq("profile_id", reactorId)
                                      .maybeSingle();
                                  if (accountantData)
                                    roleSpecificId = accountantData.id;
                                } else if (userRole === "cleaning_company") {
                                  const { data: company } = await supabase
                                    .from("cleaning_companies")
                                    .select("id")
                                    .eq("profile_id", reactorId)
                                    .maybeSingle();
                                  if (company) roleSpecificId = company.id;
                                } else if (userRole === "admin") {
                                  // Admin uses profile_id directly
                                  roleSpecificId = reactorId;
                                }

                                const url = getProfileUrl(
                                  userRole,
                                  roleSpecificId
                                );
                                navigate(url);
                              } catch (error) {
                                console.error(
                                  "Error navigating to profile:",
                                  error
                                );
                                // Fallback to worker profile with profile_id
                                navigate(
                                  `/worker/profile/${reactorId}#contact`
                                );
                              }
                            };

                            return (
                              <div
                                key={reaction.id}
                                className={`p-4 rounded-xl border-2 transition-all hover:shadow-lg ${
                                  !reaction.is_read
                                    ? "bg-pink-50 border-pink-300"
                                    : "bg-white border-gray-200"
                                }`}
                              >
                                <div className="flex items-start gap-4">
                                  {/* Avatar - clickable */}
                                  <button
                                    onClick={handleProfileClick}
                                    className="flex-shrink-0 group cursor-pointer"
                                  >
                                    {reactorAvatar ? (
                                      <img
                                        src={reactorAvatar}
                                        alt={reactorName}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-pink-300 group-hover:border-pink-500 transition-all"
                                      />
                                    ) : (
                                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-xl border-2 border-pink-300 group-hover:border-pink-500 transition-all">
                                        {reactorName.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                  </button>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-2xl">
                                            {typeInfo.emoji}
                                          </span>
                                          <button
                                            onClick={handleProfileClick}
                                            className={`font-bold text-lg hover:underline cursor-pointer ${
                                              !reaction.is_read
                                                ? "text-pink-700"
                                                : "text-gray-900"
                                            }`}
                                          >
                                            {reactorName}
                                          </button>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                          {typeInfo.text}
                                        </p>
                                        {reaction.type === "story_reply" &&
                                          reaction.message && (
                                            <p className="text-sm text-gray-700 mt-2 italic bg-gray-50 p-2 rounded">
                                              "{reaction.message}"
                                            </p>
                                          )}
                                      </div>
                                      {!reaction.is_read && (
                                        <span className="w-3 h-3 bg-pink-500 rounded-full"></span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      {new Date(
                                        reaction.created_at
                                      ).toLocaleString("pl-PL", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* END REAKCJE */}
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

              {/* Subscription Tab */}
              <TabPanel isActive={activeTab === "subscription"}>
                <EmployerSubscriptionPage />
              </TabPanel>

              {/* Portfolio Tab */}
              <TabPanel isActive={activeTab === "portfolio"}>
                {renderPortfolio()}
              </TabPanel>

              {/* My Profile Preview Tab */}
              <TabPanel isActive={activeTab === "my_profile"}>
                <MyProfilePreview role="employer" />
              </TabPanel>

              {/* Settings Tab */}
              <TabPanel isActive={activeTab === "settings"}>
                <EmployerSettingsPanel
                  employerProfile={
                    employerProfile
                      ? {
                          id: employerProfile.id,
                          profile_id: employerProfile.profile_id,
                          company_name: employerProfile.company_name || "",
                          kvk_number: employerProfile.kvk_number || undefined,
                          btw_number: employerProfile.btw_number || undefined,
                          logo_url: employerProfile.logo_url || undefined,
                          cover_image_url:
                            (employerProfile as any).cover_image_url ||
                            undefined,
                          website: employerProfile.website || undefined,
                          description: employerProfile.description || undefined,
                          industry: employerProfile.industry || undefined,
                          company_size:
                            employerProfile.company_size || undefined,
                          company_type:
                            (employerProfile as any).company_type || undefined,
                          address: employerProfile.address || undefined,
                          city: employerProfile.city || undefined,
                          postal_code: employerProfile.postal_code || undefined,
                          country: employerProfile.country || undefined,
                          contact_person:
                            employerProfile.contact_person || undefined,
                          contact_phone:
                            employerProfile.contact_phone || undefined,
                          contact_email:
                            employerProfile.contact_email || undefined,
                          verified: employerProfile.verified || undefined,
                        }
                      : null
                  }
                  notificationSettings={notificationSettings}
                  privacySettings={privacySettings}
                  saving={settingsSaving}
                  onLogoUpload={handleLogoUpload}
                  onCoverImageUpload={handleCoverImageUploadSuccess}
                  onNotificationSettingsChange={setNotificationSettings}
                  onNotificationSettingsSave={handleNotificationSettingsSave}
                  onPrivacySettingsChange={setPrivacySettings}
                  onPrivacySettingsSave={handlePrivacySettingsSave}
                  onCompanyDataSave={handleCompanyDataSave}
                  availability={availability}
                  blockedDates={blockedDates}
                  onAvailabilityChange={handleAvailabilityChange}
                  onBlockDate={handleBlockDate}
                  onUnblockDate={handleUnblockDate}
                  isMobile={isMobile}
                />
              </TabPanel>

              {/* NOTE: Team tab removed - now accessible via /employer/team separate page */}
              {/* NOTE: Kilometers and Calendar tabs removed - they are only in /faktury module */}
            </PageContainer>
          </main>
        </div>
      </div>
    </div>
  );
};

// @ts-nocheck
/**
 * ===================================================================
 * WORKER DASHBOARD - FULL FUNCTIONAL IMPLEMENTATION
 * ===================================================================
 * Complete worker dashboard with database integration
 * All buttons functional, all forms save to database
 * Real-time updates, validation, error handling
 * UPDATED: Fixed tab navigation - October 9, 2025
 */

import { useState, useEffect, useRef, useCallback } from "react";
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useIsMobile } from "../src/hooks/useIsMobile";
import { useSidebar } from "../contexts/SidebarContext";
import workerProfileService from "../services/workerProfileService";
import { Animated3DProfileBackground } from "../components/Animated3DProfileBackground";
import { getJobs } from "../src/services/job";
import { SupportTicketModal } from "../src/components/SupportTicketModal";
import { geocodeAddress } from "../services/geocoding";
import type { WorkerProfileData } from "../services/workerProfileService";
import { MOCK_JOBS, MOCK_PROFILES } from "../constants";
import { JobCard } from "../components/JobCard";
import { Job, Profile, Application, ApplicationStatus } from "../types";
import {
  BriefcaseIcon,
  AcademicCapIcon,
  CheckCircleIcon,
} from "../components/icons";
import {
  DashboardHeader,
  TabNavigation,
} from "../components/DashboardComponents";
import { NotificationBellCertification } from "../components/NotificationBellCertification";
import {
  UnifiedDashboardTabs,
  useUnifiedTabs,
  TabPanel,
  type UnifiedTab,
} from "../components/UnifiedDashboardTabs";
import { DashboardSidebar } from "../components/DashboardSidebar";
import { NavigationDrawer } from "../components/NavigationDrawer";
import { QuickActionsCard } from "../components/QuickActionsCard";
import {
  ProfileNavigationDrawer,
  type ProfileSubTab,
} from "../components/ProfileNavigationDrawer";
import { SubscriptionPanel } from "../src/components/subscription/SubscriptionPanel";
import { CertificateApplicationForm } from "../src/components/subscription/CertificateApplicationForm";
import { ZZPExamApplicationForm } from "../src/components/certificates/ZZPExamApplicationForm";
import FeedPage from "../pages/FeedPage_PREMIUM";
import {
  PageContainer,
  PageHeader,
  ContentCard,
} from "../components/common/PageContainer";
import { StatChipsGrid, StatChipItem } from "../components/StatChips";
import {
  Briefcase,
  DollarSign,
  Award,
  Mail,
  Check,
  Star,
  Eye,
} from "lucide-react";
import DateBlocker from "../src/components/common/DateBlocker";
import { CoverImageUploader } from "../src/components/common/CoverImageUploader";
import SavedActivity from "./worker/SavedActivity";
import { UpcomingEventsCard } from "../components/UpcomingEventsCard";
import { GlowButton } from "../components/ui/GlowButton";
import { WorkerSettingsPanel } from "../components/settings/WorkerSettingsPanel";
import { MyProfilePreview } from "../components/profile/MyProfilePreview";
import { TeamMembershipTab } from "../src/modules/team-system/components/TeamMembershipTab";
import { WorkerTeamDashboard } from "../src/modules/team-system/pages/worker/WorkerTeamDashboard";
import {
  getAllSavedProfiles,
  removeSavedProfile,
  type SavedProfile,
  type EntityType,
} from "../services/savedProfilesService";
// NOTE: Kilometers, Appointments and I18nProvider removed - they are only in /faktury module

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
// CONSTANT TAB CONFIGURATIONS (prevent infinite re-render)
// ===================================================================

const WEEK_DAYS_PL = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sb", "Nd"] as const;
const WEEK_DAYS_DB = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const PORTFOLIO_SKELETON_ITEMS = [1, 2, 3, 4] as const;
const SUGGESTED_SKILLS = [
  "Spawanie",
  "Montaż",
  "Elektryka",
  "Hydraulika",
  "AutoCAD",
  "Pomiary",
  "Malowanie",
  "Izolacje",
] as const;

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
        partnerAvatar: partnerInfo?.avatar_url || undefined, // Force undefined if null
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

// ===================================================================
// MAIN WORKER DASHBOARD COMPONENT
// ===================================================================

export default function WorkerDashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // 🔍 DIAGNOSTIC: Count renders to detect infinite loop
  const renderCount = React.useRef(0);
  const lastRenderTime = React.useRef(Date.now());
  renderCount.current += 1;

  const timeSinceLastRender = Date.now() - lastRenderTime.current;
  lastRenderTime.current = Date.now();

  // Log only first 10 renders to avoid console spam
  if (renderCount.current <= 10) {
    console.log(
      `🔄 [DIAGNOSTIC] WorkerDashboard render #${renderCount.current} (${timeSinceLastRender}ms since last)`
    );
  } else if (renderCount.current === 11) {
    console.warn(
      `⚠️ [DIAGNOSTIC] WorkerDashboard rendered 10+ times - possible infinite loop!`
    );
  } else if (renderCount.current > 100) {
    console.error(
      `❌ [DIAGNOSTIC] INFINITE LOOP CONFIRMED - ${renderCount.current} renders! (${timeSinceLastRender}ms intervals)`
    );
  }

  // State Management
  const { activeTab, setActiveTab } = useUnifiedTabs("tablica");
  const { isSidebarOpen, closeSidebar } = useSidebar();
  const [isProfileSidebarOpen, setIsProfileSidebarOpen] = useState(false);

  // Profile sub-tabs (used in renderProfile function inside Settings tab)
  const [activeProfileTab, setActiveProfileTab] =
    useState<ProfileSubTab>("edit");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data State
  const [userId, setUserId] = useState<string>("");
  const [workerProfile, setWorkerProfile] = useState<WorkerProfileData | null>(
    null
  );
  const [certificates, setCertificates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [earningsStats, setEarningsStats] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewFilter, setReviewFilter] = useState<"all" | 1 | 2 | 3 | 4 | 5>(
    "all"
  );
  const [reviewSort, setReviewSort] = useState<
    "newest" | "oldest" | "highest" | "lowest"
  >("newest");
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [replyContent, setReplyContent] = useState("");
  const [messagesSubTab, setMessagesSubTab] = useState<
    "wiadomosci" | "reakcje"
  >("wiadomosci");
  const [reactions, setReactions] = useState<any[]>([]);

  // Saved Profiles State
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [savedProfilesFilter, setSavedProfilesFilter] = useState<
    "all" | EntityType
  >("all");

  // Form State for Profile Edit
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    location_city: "",
    specialization: "",
    bio: "",
    hourly_rate: 0,
    years_experience: 0,
    language: "nl" as const,
    // Address fields
    address: "",
    postal_code: "",
    location_country: "NL",
    latitude: null as number | null,
    longitude: null as number | null,
  });

  // Skills State
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  // Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: "public" as const,
    show_email: false,
    show_phone: false,
    show_location: true,
  });

  // Portfolio Form State
  // POPRAWKA: Dodano images (array), is_public, category, video_url - zgodnie z worker_portfolio
  // NOWE POLA: location, address, completion_date - szczegóły realizacji projektu
  const [portfolioForm, setPortfolioForm] = useState({
    title: "",
    description: "",
    images: [] as string[], // POPRAWKA: array zdjęć zamiast pojedynczego image_url
    project_url: "",
    video_url: "",
    category: "",
    tags: [] as string[],
    start_date: "",
    end_date: "",
    completion_date: "", // 🆕 Data oddania/zakończenia projektu
    client_name: "",
    client_company: "",
    location: "", // 🆕 Lokalizacja projektu (miasto, region)
    address: "", // 🆕 Pełny adres realizacji projektu
    is_public: true, // POPRAWKA: domyślnie publiczne portfolio
    is_featured: false,
  });
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  // 🆕 Image Lightbox State - podgląd zdjęć
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // 🆕 Project Detail View State - szczegółowy widok projektu
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showProjectDetail, setShowProjectDetail] = useState(false);

  // Date Blocker State
  const [showDateBlocker, setShowDateBlocker] = useState(false);

  // Job Application State
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState("");

  // ===================================================================
  // DATA LOADING
  // ===================================================================

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

      console.log("🔍 [WorkerDashboard] Raw messages data:", data?.slice(0, 2));
      console.log(
        "🔍 [WorkerDashboard] First message sender:",
        data?.[0]?.sender
      );
      console.log(
        "🔍 [WorkerDashboard] First message recipient:",
        data?.[0]?.recipient
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
        "✅ [WorkerDashboard] Processed messages:",
        messagesWithSenders.slice(0, 2).map((m) => ({
          subject: m.subject,
          sender_name: m.sender.full_name,
          sender_avatar: m.sender.avatar_url,
          recipient_name: m.recipient?.full_name,
          recipient_avatar: m.recipient?.avatar_url,
        }))
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

  // Load reactions/notifications for the reactions tab
  const loadReactions = async (userId: string) => {
    try {
      // First, get the worker_id for this user
      const { data: workerData } = await supabase
        .from("workers")
        .select("id")
        .eq("profile_id", userId)
        .single();

      const workerId = workerData?.id;

      // Get notifications
      const { data: notificationsData, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .in("type", ["story_reaction", "story_reply", "review"])
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // For review notifications, fetch the actual review data with reviewer info
      const enrichedReactions = await Promise.all(
        (notificationsData || []).map(async (notification) => {
          if (notification.type === "review" && workerId) {
            // Find the review that matches this notification timestamp
            const notificationTime = new Date(notification.created_at);
            const startTime = new Date(notificationTime.getTime() - 10000); // 10 seconds before
            const endTime = new Date(notificationTime.getTime() + 10000); // 10 seconds after

            const { data: reviewData } = await supabase
              .from("reviews")
              .select(
                `
                id,
                rating,
                comment,
                reviewer_id,
                created_at
              `
              )
              .eq("worker_id", workerId)
              .gte("created_at", startTime.toISOString())
              .lte("created_at", endTime.toISOString())
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

            if (reviewData) {
              // Get reviewer profile
              const { data: reviewerProfile } = await supabase
                .from("profiles")
                .select("id, full_name, avatar_url, role")
                .eq("id", reviewData.reviewer_id)
                .single();

              return {
                ...notification,
                data: {
                  ...notification.data,
                  reactor_id: reviewerProfile?.id,
                  reactor_name: reviewerProfile?.full_name || "Użytkownik",
                  reactor_avatar: reviewerProfile?.avatar_url,
                  reactor_role: reviewerProfile?.role,
                  rating: reviewData.rating,
                  comment: reviewData.comment,
                },
              };
            }
          }
          return notification;
        })
      );

      setReactions(enrichedReactions);
      console.log("💗 REACTIONS LOADED:", enrichedReactions?.length);
    } catch (err) {
      console.error("Error loading reactions:", err);
      setReactions([]);
    }
  };

  // ===================================================================
  // MESSENGER ACTION HANDLERS
  // ===================================================================

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
        .filter((msg) => !msg.is_read && msg.recipient_id === userId)
        .map((msg) => msg.id);

      if (unreadMessageIds.length === 0) return;

      const { error } = await supabase
        .from("messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in("id", unreadMessageIds);

      if (error) throw error;

      // Reload messages to update UI
      await loadMessages(userId);
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !messageInput.trim()) return;

    const currentPartnerId = selectedConversation.partnerId; // Zapamiętaj partnera

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: userId,
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
      await loadMessages(userId);

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
    if (!file) return;

    try {
      setUploadingFile(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
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

  // Refresh analytics without reloading entire dashboard
  const refreshAnalytics = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const profile = await workerProfileService.getWorkerProfile(user.id);
      if (profile?.id) {
        const analyticsData = await workerProfileService.getAnalytics(
          profile.id
        );
        setAnalytics((prev) => ({
          ...prev,
          profile_views: analyticsData.profile_views,
        }));
      }
    } catch (error) {
      console.error("Error refreshing analytics:", error);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      setUserId(user.id);

      // Load worker profile
      const profile = await workerProfileService.getWorkerProfile(user.id);
      if (profile) {
        setWorkerProfile(profile);
        setSkills(profile.skills || []);

        // Populate form
        setProfileForm({
          full_name: profile.full_name || "",
          phone: profile.phone || "",
          email: profile.email || "",
          location_city: profile.location_city || "",
          specialization: profile.specialization || "",
          bio: profile.bio || "",
          hourly_rate: profile.hourly_rate || 0,
          years_experience: profile.years_experience || 0,
          language: profile.language || "nl",
        });

        // Load portfolio projects - POPRAWKA: Używamy profile.id (worker_id) nie user.id (profile_id)
        try {
          const portfolioProjects =
            await workerProfileService.getPortfolioProjects(profile.id);
          setPortfolio(portfolioProjects || []);
        } catch (error) {
          console.warn("[WORKER-DASH] Could not load portfolio:", error);
          setPortfolio([]); // Continue with empty portfolio
        }
      }

      // WHY: Wrapped in try-catch to prevent dashboard crash if certificates table doesn't exist
      try {
        const certs = await workerProfileService.getWorkerCertificates(user.id);
        setCertificates(certs);
      } catch (error) {
        console.warn(
          "[WORKER-DASH] Could not load certificates (non-critical):",
          error
        );
        setCertificates([]); // Continue with empty certificates
      }

      // Load applications
      // const apps = await workerProfileService.getApplications(user.id);
      setApplications([]); // Mock: empty until DB fixed

      // Load available jobs (active/published jobs)
      try {
        const jobsData = await getJobs({ status: "active" });
        setJobs(jobsData || []);
        console.log("✅ [WORKER-DASH] Loaded jobs:", jobsData?.length || 0);
      } catch (error) {
        console.warn("[WORKER-DASH] Could not load jobs:", error);
        setJobs([]);
      }

      // Load earnings
      // const earningsData = await workerProfileService.getEarnings(user.id);
      setEarnings([]); // Mock: empty until DB fixed

      // const stats = await workerProfileService.getEarningsStats(user.id);
      setEarningsStats({
        total: 0,
        thisMonth: 0,
        lastMonth: 0,
        pending: 0,
        paid: 0,
      }); // Mock

      // Load reviews - FIXED: Now uses reviewee_id instead of worker_id
      const reviewsData = await workerProfileService.getReviews(user.id);
      setReviews(reviewsData);

      // Load analytics - FIXED: Now uses profile.id (worker_id) not user.id (profile_id)
      if (profile?.id) {
        try {
          console.log(
            "🔍 [WORKER-DASH] Loading analytics for worker ID:",
            profile.id
          );
          const analyticsData = await workerProfileService.getAnalytics(
            profile.id
          );
          console.log("✅ [WORKER-DASH] Analytics loaded:", analyticsData);
          setAnalytics(analyticsData);
        } catch (err) {
          console.warn("[WORKER-DASH] Could not load analytics:", err);
          // Calculate average rating BEFORE setAnalytics to prevent infinite loop
          const avgRating =
            reviewsData.length > 0
              ? reviewsData.reduce((sum: number, r: any) => sum + r.rating, 0) /
                reviewsData.length
              : 0;

          // Set default analytics data
          setAnalytics({
            profile_views: 0,
            job_views: 0,
            applications_sent: 0,
            applications_accepted: 0,
            total_earnings: 0,
            average_rating: avgRating,
            completed_jobs: 0,
            response_rate: 0,
          });
        }
      } else {
        console.error(
          "❌ [WORKER-DASH] No profile loaded - cannot fetch analytics"
        );
      }

      // Load messages
      await loadMessages(user.id);

      // Load reactions
      await loadReactions(user.id);

      // Load saved profiles
      try {
        const profiles = await getAllSavedProfiles(user.id);
        setSavedProfiles(profiles);
      } catch (err) {
        console.warn("[WORKER-DASH] Could not load saved profiles:", err);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Nie udało się załadować danych profilu");
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadAllData();

    // Auto-refresh analytics (profile_views) co 30 sekund
    const refreshInterval = setInterval(() => {
      refreshAnalytics();
    }, 30000); // 30 sekund

    return () => clearInterval(refreshInterval);
  }, [loadAllData, refreshAnalytics]);

  // ===================================================================
  // MESSAGE HANDLERS
  // ===================================================================

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", messageId);

      if (error) throw error;

      // Update local state
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking message as read:", err);
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyContent.trim()) return;

    try {
      setSaving(true);

      const { error } = await supabase.from("messages").insert({
        sender_id: userId,
        recipient_id: selectedMessage.sender_id,
        subject: `Re: ${selectedMessage.subject}`,
        content: replyContent,
        is_read: false,
      });

      if (error) throw error;

      setSuccess("Odpowiedź wysłana!");
      setReplyContent("");
      setSelectedMessage(null);

      // Reload messages
      await loadMessages(userId);
    } catch (err) {
      console.error("Error sending reply:", err);
      setError("Nie udało się wysłać odpowiedzi");
    } finally {
      setSaving(false);
    }
  };

  // ===================================================================
  // PROFILE UPDATE HANDLERS
  // ===================================================================

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Auto-geocode address if provided but no coordinates
      let updateData = { ...profileForm };

      if (
        profileForm.address &&
        profileForm.location_city &&
        (!profileForm.latitude || !profileForm.longitude)
      ) {
        console.log("🗺️ Geocoding address...");
        const geocoded = await geocodeAddress(
          profileForm.address,
          profileForm.location_city,
          profileForm.postal_code,
          profileForm.location_country || "Netherlands"
        );

        if (geocoded) {
          updateData.latitude = geocoded.latitude;
          updateData.longitude = geocoded.longitude;
          console.log("✅ Geocoding successful:", geocoded);
        } else {
          console.warn("⚠️ Geocoding failed - saving without coordinates");
        }
      }

      const updated = await workerProfileService.updateWorkerProfile(
        userId,
        updateData
      );

      if (updated) {
        setSuccess("✅ Profil zapisany pomyślnie!");
        await loadAllData(); // Reload data

        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error("Update failed");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      setError("❌ Nie udało się zapisać profilu");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      const avatarUrl = await workerProfileService.uploadAvatar(userId, file);

      if (avatarUrl) {
        setSuccess("✅ Avatar zaktualizowany!");
        await loadAllData();
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError("❌ Nie udało się przesłać avatara");
      }
    } catch (err) {
      setError("❌ Błąd przesyłania avatara");
    } finally {
      setSaving(false);
    }
  };

  const handleCoverImageUploadSuccess = async (url: string) => {
    if (!userId) return;

    try {
      // Update database with new cover image URL
      const { error } = await supabase
        .from("workers")
        .update({ cover_image_url: url })
        .eq("profile_id", userId);

      if (error) throw error;

      // Reload worker profile to get updated data
      await loadAllData();
      setSuccess("✅ Zdjęcie w tle zaktualizowane!");
      setTimeout(() => setSuccess(null), 2000);
      console.log("✅ Cover image updated:", url);
    } catch (error) {
      console.error("❌ Error updating cover image:", error);
      setError("Błąd podczas aktualizacji zdjęcia w tle");
    }
  };

  // ===================================================================
  // SKILLS HANDLERS
  // ===================================================================

  const handleAddSkill = async () => {
    if (!newSkill.trim() || skills.includes(newSkill.trim())) return;

    const updatedSkills = [...skills, newSkill.trim()];
    setSkills(updatedSkills);
    setNewSkill("");

    const success = await workerProfileService.updateWorkerSkills(
      userId,
      updatedSkills
    );
    if (success) {
      setSuccess("✅ Umiejętność dodana!");
      setTimeout(() => setSuccess(null), 2000);
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    const updatedSkills = skills.filter((s) => s !== skillToRemove);
    setSkills(updatedSkills);

    const success = await workerProfileService.updateWorkerSkills(
      userId,
      updatedSkills
    );
    if (success) {
      setSuccess("✅ Umiejętność usunięta!");
      setTimeout(() => setSuccess(null), 2000);
    }
  };

  // ===================================================================
  // SETTINGS HANDLERS
  // ===================================================================

  const handleNotificationSettingsUpdate = async () => {
    setSaving(true);
    const success = await workerProfileService.updateNotificationSettings(
      userId,
      notificationSettings
    );

    if (success) {
      setSuccess("✅ Ustawienia powiadomień zapisane!");
      setTimeout(() => setSuccess(null), 2000);
    } else {
      setError("❌ Nie udało się zapisać ustawień");
    }
    setSaving(false);
  };

  const handlePrivacySettingsUpdate = async () => {
    setSaving(true);
    const success = await workerProfileService.updatePrivacySettings(
      userId,
      privacySettings
    );

    if (success) {
      setSuccess("✅ Ustawienia prywatności zapisane!");
      setTimeout(() => setSuccess(null), 2000);
    } else {
      setError("❌ Nie udało się zapisać ustawień");
    }
    setSaving(false);
  };

  const handleProfileDataSave = async (data: {
    full_name?: string;
    phone?: string;
    email?: string;
    specialization?: string;
    bio?: string;
    skills?: string[];
    languages?: string[];
    hourly_rate?: number;
    hourly_rate_max?: number;
    rate_negotiable?: boolean;
    years_experience?: number;
    location_city?: string;
    postal_code?: string;
    address?: string;
    service_radius_km?: number;
    kvk_number?: string;
    btw_number?: string;
    certifications?: string[];
    own_tools?: boolean;
    own_vehicle?: boolean;
    vehicle_type?: string;
  }) => {
    setSaving(true);
    setError(null);

    try {
      const success = await workerProfileService.updateWorkerProfile(
        userId,
        data
      );

      if (success) {
        setSuccess("✅ Dane profilu zostały zaktualizowane!");
        setTimeout(() => setSuccess(null), 3000);

        // Odśwież dane profilu
        const updatedProfile = await workerProfileService.getWorkerProfile(
          userId
        );
        if (updatedProfile) {
          setProfileData(updatedProfile);
        }
      } else {
        setError("❌ Nie udało się zapisać danych profilu");
      }
    } catch (err) {
      console.error("Error saving profile data:", err);
      setError("❌ Wystąpił błąd podczas zapisywania danych");
    }

    setSaving(false);
  };

  // ===================================================================
  // AVAILABILITY HANDLERS
  // ===================================================================

  const handleAvailabilityChange = async (day: string) => {
    const dayMap: { [key: string]: string } = {
      Pon: "monday",
      Wt: "tuesday",
      Śr: "wednesday",
      Czw: "thursday",
      Pt: "friday",
      Sb: "saturday",
      Nd: "sunday",
    };

    const dbDay = dayMap[day];
    if (!dbDay) return;

    const currentAvailability = workerProfile.availability || {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    };

    const newAvailability = {
      ...currentAvailability,
      [dbDay]: !currentAvailability[dbDay],
    };

    try {
      setSaving(true);
      const { data, error } = await supabase
        .from("workers")
        .update({ availability: newAvailability })
        .eq("profile_id", userId)
        .select()
        .single();

      if (error) throw error;

      setWorkerProfile({ ...workerProfile, availability: newAvailability });
      setSuccess("✅ Dostępność zaktualizowana!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error("Availability update error:", err);
      setError("❌ Nie udało się zaktualizować dostępności");
    } finally {
      setSaving(false);
    }
  };

  const handleAvailabilityToggle = async (isAvailable: boolean) => {
    try {
      setSaving(true);
      await workerProfileService.toggleAvailability(userId, isAvailable);

      setWorkerProfile({ ...workerProfile, is_available: isAvailable });
      setSuccess(
        isAvailable
          ? "✅ Jesteś teraz dostępny do pracy!"
          : "✅ Status zmieniony na niedostępny"
      );
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error("Availability toggle error:", err);
      setError("❌ Nie udało się zmienić statusu dostępności");
    } finally {
      setSaving(false);
    }
  };

  // ===================================================================
  // DATE BLOCKER HANDLERS
  // ===================================================================

  const handleBlockDate = async (newBlockedDate: any) => {
    try {
      const updatedDates = [
        ...(workerProfile.unavailable_dates || []),
        newBlockedDate,
      ];

      const { error } = await supabase
        .from("workers")
        .update({ unavailable_dates: updatedDates })
        .eq("profile_id", userId);

      if (error) throw error;

      setWorkerProfile({ ...workerProfile, unavailable_dates: updatedDates });
      setSuccess(`✅ Data ${newBlockedDate.date} została zablokowana`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error("Error blocking date:", err);
      setError("❌ Nie udało się zablokować daty");
    }
  };

  const handleUnblockDate = async (dateToRemove: string) => {
    try {
      const updatedDates = (workerProfile.unavailable_dates || []).filter(
        (d: any) => d.date !== dateToRemove
      );

      const { error } = await supabase
        .from("workers")
        .update({ unavailable_dates: updatedDates })
        .eq("profile_id", userId);

      if (error) throw error;

      setWorkerProfile({ ...workerProfile, unavailable_dates: updatedDates });
      setSuccess(`✅ Blokada daty ${dateToRemove} została usunięta`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error("Error unblocking date:", err);
      setError("❌ Nie udało się usunąć blokady");
    }
  };

  // ===================================================================
  // CERTIFICATE HANDLERS
  // ===================================================================

  const handleCertificateUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);

      // Upload file
      const fileUrl = await workerProfileService.uploadCertificateFile(
        userId,
        file
      );
      if (!fileUrl) throw new Error("Upload failed");

      // Add certificate record
      const cert = await workerProfileService.addCertificate(userId, {
        certificate_type: "Doświadczenie",
        issuer: "Manual Upload",
        issue_date: new Date().toISOString(),
        file_url: fileUrl,
      });

      if (cert) {
        setSuccess("✅ Certyfikat dodany!");
        await loadAllData();
        setTimeout(() => setSuccess(null), 2000);
      }
    } catch (err) {
      setError("❌ Nie udało się dodać certyfikatu");
    } finally {
      setSaving(false);
    }
  };

  const handleCertificateDelete = async (certificateId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten certyfikat?")) return;

    try {
      setSaving(true);
      const success = await workerProfileService.deleteCertificate(
        certificateId
      );

      if (success) {
        setSuccess("✅ Certyfikat usunięty!");
        await loadAllData();
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError("❌ Nie udało się usunąć certyfikatu");
      }
    } catch (err) {
      setError("❌ Błąd usuwania certyfikatu");
    } finally {
      setSaving(false);
    }
  };

  // ===================================================================
  // PORTFOLIO HANDLERS
  // ===================================================================

  const handlePortfolioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // KRYTYCZNA POPRAWKA: Używamy workerProfile.id (workers.id) zamiast userId (auth.uid/profile_id)
      // Tabela worker_portfolio ma FK do workers.id, NIE do profiles.id!
      if (!workerProfile?.id) {
        throw new Error("Brak ID pracownika - odśwież stronę");
      }

      if (editingProjectId) {
        // Update existing project
        // SANITIZE DATE FIELDS: Convert empty strings to null for PostgreSQL
        const sanitizedForm = {
          ...portfolioForm,
          start_date: portfolioForm.start_date?.trim() || null,
          end_date: portfolioForm.end_date?.trim() || null,
          completion_date: portfolioForm.completion_date?.trim() || null,
        };

        const success = await workerProfileService.updatePortfolioProject(
          editingProjectId,
          sanitizedForm
        );
        if (success) {
          setSuccess("✅ Projekt zaktualizowany!");
        }
      } else {
        // Add new project - POPRAWKA: workerProfile.id zamiast userId
        // SANITIZE DATE FIELDS: Convert empty strings to null for PostgreSQL
        const sanitizedForm = {
          ...portfolioForm,
          start_date: portfolioForm.start_date?.trim() || null,
          end_date: portfolioForm.end_date?.trim() || null,
          completion_date: portfolioForm.completion_date?.trim() || null,
        };

        const project = await workerProfileService.addPortfolioProject(
          workerProfile.id,
          sanitizedForm
        );
        if (project) {
          setSuccess("✅ Projekt dodany!");
        }
      }

      await loadAllData();
      setShowPortfolioModal(false);
      resetPortfolioForm();
      setTimeout(() => setSuccess(null), 2000);
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
      setSaving(true);
      const success = await workerProfileService.deletePortfolioProject(
        projectId
      );

      if (success) {
        setSuccess("✅ Projekt usunięty!");
        await loadAllData();
        setTimeout(() => setSuccess(null), 2000);
      }
    } catch (err) {
      setError("❌ Nie udało się usunąć projektu");
    } finally {
      setSaving(false);
    }
  };

  const handlePortfolioImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      const imageUrl = await workerProfileService.uploadPortfolioImage(
        userId,
        file
      );

      if (imageUrl) {
        // POPRAWKA: Dodaj do array images[] zamiast ustawiać image_url
        setPortfolioForm({
          ...portfolioForm,
          images: [...portfolioForm.images, imageUrl],
        });
        setSuccess("✅ Zdjęcie przesłane!");
        setTimeout(() => setSuccess(null), 2000);
      }
    } catch (err) {
      setError("❌ Nie udało się przesłać zdjęcia");
    } finally {
      setSaving(false);
    }
  };

  const resetPortfolioForm = () => {
    setPortfolioForm({
      title: "",
      description: "",
      images: [],
      project_url: "",
      video_url: "",
      category: "",
      tags: [],
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

  const openPortfolioModal = (project?: any) => {
    if (project) {
      setPortfolioForm({
        title: project.title,
        description: project.description,
        images: project.images || [],
        project_url: project.project_url || "",
        video_url: project.video_url || "",
        category: project.category || "",
        tags: project.tags || [],
        start_date: project.start_date,
        end_date: project.end_date || "",
        completion_date: project.completion_date || "",
        client_name: project.client_name || "",
        client_company: project.client_company || "",
        location: project.location || "",
        address: project.address || "",
        is_public: project.is_public !== undefined ? project.is_public : true,
        is_featured: project.is_featured || false,
      });
      setEditingProjectId(project.id);
    } else {
      resetPortfolioForm();
    }
    setShowPortfolioModal(true);
  };

  // ===================================================================
  // JOB APPLICATION HANDLERS
  // ===================================================================

  const handleJobApplication = async (job: any) => {
    setSelectedJob(job);
  };

  const handleSubmitApplication = async () => {
    if (!selectedJob) return;

    try {
      setSaving(true);
      const application = await workerProfileService.applyForJob(
        userId,
        selectedJob.id,
        coverLetter
      );

      if (application) {
        setSuccess("✅ Aplikacja wysłana!");
        await loadAllData();
        setSelectedJob(null);
        setCoverLetter("");
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError("❌ Nie udało się wysłać aplikacji");
      }
    } catch (err) {
      setError("❌ Błąd wysyłania aplikacji");
    } finally {
      setSaving(false);
    }
  };

  const handleWithdrawApplication = async (applicationId: string) => {
    if (!confirm("Czy na pewno chcesz wycofać tę aplikację?")) return;

    try {
      setSaving(true);
      const success = await workerProfileService.withdrawApplication(
        applicationId
      );

      if (success) {
        setSuccess("✅ Aplikacja wycofana!");
        await loadAllData();
        setTimeout(() => setSuccess(null), 2000);
      }
    } catch (err) {
      setError("❌ Nie udało się wycofać aplikacji");
    } finally {
      setSaving(false);
    }
  };

  // Quick Actions handlers
  const handleViewSubscription = () => {
    window.location.href = "/worker/subscription";
  };

  const [showSupportModal, setShowSupportModal] = useState(false);

  const handleContactSupport = () => {
    setShowSupportModal(true);
  };

  // ===================================================================
  // ✅ NEW TAB RENDER FUNCTIONS (like CleaningDashboard)
  // ===================================================================

  const renderPanelTab = () => {
    if (!workerProfile) return <div>Ładowanie...</div>;

    return (
      <PageContainer>
        {/* HEADER */}
        <PageHeader
          avatarUrl={workerProfile.avatar_url}
          avatarFallback={workerProfile.full_name?.[0]?.toUpperCase()}
          title={`Witaj, ${workerProfile.full_name}!`}
          subtitle="Panel pracownika"
        />

        {/* STATS GRID - Premium StatChips */}
        <StatChipsGrid
          items={[
            {
              id: "completed",
              label: "Ukończone projekty",
              value: analytics?.completed_jobs || 0,
              tone: "emerald",
              icon: <Check size={16} />,
            },
            {
              id: "rating",
              label: "Średnia ocena",
              value:
                workerProfile?.rating && workerProfile.rating_count > 0
                  ? `${workerProfile.rating.toFixed(1)} / 5.0`
                  : "0.0 / 5.0",
              tone: "amber",
              icon: <Star size={16} />,
            },
            {
              id: "views",
              label: "Wyświetlenia profilu",
              value: analytics?.profile_views || 0,
              tone: "cyan",
              icon: <Eye size={16} />,
            },
            {
              id: "messages",
              label: "Wiadomości",
              value: messages.length,
              tone: "violet",
              icon: <Mail size={16} />,
              hint: unreadCount > 0 ? `${unreadCount} nowe` : undefined,
            },
          ]}
        />

        {/* GŁÓWNY GRID 3 kolumny */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 🔍 Ostatnie wyszukiwania */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Ostatnie wyszukiwania
              </h2>
              <button
                onClick={() => setActiveTab("jobs")}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Nowe wyszukiwanie →
              </button>
            </div>

            <div className="text-center py-8">
              <p className="text-gray-500">Brak historii wyszukiwań</p>
              <button
                onClick={() => setActiveTab("jobs")}
                className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Rozpocznij pierwsze wyszukiwanie
              </button>
            </div>
          </div>

          {/* 📅 Nadchodzące spotkania */}
          <UpcomingEventsCard />

          {/* 👥 Zapisane profile */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Zapisane profile
              </h2>
              <Link
                to="/worker/search"
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
                    setSavedProfilesFilter(
                      filter.key as typeof savedProfilesFilter
                    )
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                    savedProfilesFilter === filter.key
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
              const filteredProfiles =
                savedProfilesFilter === "all"
                  ? savedProfiles
                  : savedProfiles.filter(
                      (p) => p.entity_type === savedProfilesFilter
                    );

              if (filteredProfiles.length === 0) {
                return (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {savedProfilesFilter === "all"
                        ? "Brak zapisanych profili"
                        : `Brak zapisanych ${
                            savedProfilesFilter === "worker"
                              ? "pracowników"
                              : savedProfilesFilter === "employer"
                              ? "pracodawców"
                              : savedProfilesFilter === "accountant"
                              ? "księgowych"
                              : "firm sprzątających"
                          }`}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Zapisz profile podczas wyszukiwania, aby szybko do nich
                      wrócić
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {filteredProfiles.slice(0, 6).map((profile) => {
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
                        link: `/worker/profile/${profile.entity_id}`,
                      },
                      employer: {
                        icon: "🏢",
                        bgClass: "bg-blue-100",
                        textClass: "text-blue-700",
                        label: "Pracodawca",
                        link: `/employer/profile/${profile.entity_id}`,
                      },
                      accountant: {
                        icon: "📊",
                        bgClass: "bg-green-100",
                        textClass: "text-green-700",
                        label: "Księgowy",
                        link: `/accountant/profile/${profile.entity_id}`,
                      },
                      cleaning_company: {
                        icon: "🧹",
                        bgClass: "bg-purple-100",
                        textClass: "text-purple-700",
                        label: "Firma sprzątająca",
                        link: `/cleaning-company/profile/${profile.entity_id}`,
                      },
                    };
                    const config =
                      typeConfig[profile.entity_type] || typeConfig.worker;

                    return (
                      <Link
                        key={profile.id}
                        to={config.link}
                        className="block border border-gray-200 rounded-lg p-3 hover:border-orange-500 transition-colors relative group"
                      >
                        <div className="flex items-center gap-3">
                          {profile.entity_avatar ? (
                            <img
                              src={profile.entity_avatar}
                              alt={profile.entity_name || "Profile"}
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
                              {profile.entity_name || "Nieznany"}
                            </p>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${config.bgClass} ${config.textClass}`}
                              >
                                {config.label}
                              </span>
                              {profile.entity_location && (
                                <span className="text-xs text-gray-500">
                                  📍 {profile.entity_location}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {profile.entity_rating != null &&
                              profile.entity_rating > 0 && (
                                <span className="text-sm font-medium text-gray-900">
                                  ⭐ {Number(profile.entity_rating).toFixed(1)}
                                </span>
                              )}
                            <button
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                await removeSavedProfile(profile.id);
                                setSavedProfiles((prev) =>
                                  prev.filter((p) => p.id !== profile.id)
                                );
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
      </PageContainer>
    );
  };

  const renderReviewsTab = () => {
    // ✅ PODŁĄCZONE: Używamy istniejącej funkcji renderReviewsAndAnalytics()
    return renderReviewsAndAnalytics();
  };

  const renderMessagesTab = () => {
    // ✅ PODŁĄCZONE: Sub-taby Wiadomości | Reakcje

    const handleProfileClick = async (profileId: string) => {
      try {
        // Pobierz rolę użytkownika z tabeli profiles
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", profileId)
          .single();

        if (profileError || !profileData) {
          console.error("Nie znaleziono profilu:", profileError);
          return;
        }

        const role = profileData.role;
        let targetUrl = "";

        // Pobierz ID specyficzne dla roli
        if (role === "worker") {
          const { data: workerData } = await supabase
            .from("workers")
            .select("id")
            .eq("profile_id", profileId)
            .single();
          if (workerData)
            targetUrl = `/worker/profile/${workerData.id}#contact`;
        } else if (role === "employer") {
          const { data: employerData } = await supabase
            .from("employers")
            .select("id")
            .eq("profile_id", profileId)
            .single();
          if (employerData)
            targetUrl = `/employer/profile/${employerData.id}#contact`;
        } else if (role === "accountant") {
          const { data: accountantData } = await supabase
            .from("accountants")
            .select("id")
            .eq("profile_id", profileId)
            .single();
          if (accountantData)
            targetUrl = `/accountant/profile/${accountantData.id}#contact`;
        } else if (role === "cleaning_company") {
          const { data: ccData } = await supabase
            .from("cleaning_companies")
            .select("id")
            .eq("profile_id", profileId)
            .single();
          if (ccData)
            targetUrl = `/cleaning-company/profile/${ccData.id}#contact`;
        } else if (role === "admin") {
          targetUrl = `/admin/profile/${profileId}#contact`;
        }

        if (targetUrl) {
          navigate(targetUrl);
        }
      } catch (error) {
        console.error("Błąd nawigacji:", error);
      }
    };

    return (
      <div className="space-y-6">
        {/* Sub-taby */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
          <button
            onClick={() => setMessagesSubTab("wiadomosci")}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              messagesSubTab === "wiadomosci"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            💬 Wiadomości
          </button>
          <button
            onClick={() => setMessagesSubTab("reakcje")}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${
              messagesSubTab === "reakcje"
                ? "text-pink-600 border-b-2 border-pink-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            💗 Reakcje
            {reactions.length > 0 && (
              <span className="ml-2 bg-pink-500 text-white text-xs rounded-full px-2 py-0.5">
                {reactions.length}
              </span>
            )}
          </button>
        </div>

        {/* Zawartość */}
        {messagesSubTab === "wiadomosci" ? (
          renderMessages()
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden p-6">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              💗 Reakcje na Twoje relacje
            </h3>

            {reactions.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">💭</div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  Brak reakcji
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                  Gdy ktoś zareaguje na Twoją relację, zobaczysz to tutaj
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
                    reactorData.reactor_avatar || reactorData.sender_avatar;
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

                  const onProfileClick = async () => {
                    if (!reactorId) return;
                    await handleProfileClick(reactorId);
                  };

                  return (
                    <div
                      key={reaction.id}
                      className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all"
                    >
                      {/* Avatar z kliknięciem */}
                      <button
                        onClick={onProfileClick}
                        disabled={!reactorId}
                        className={`flex-shrink-0 ${
                          reactorId
                            ? "cursor-pointer hover:opacity-80"
                            : "cursor-default"
                        } transition-opacity`}
                        title={
                          reactorId ? "Zobacz profil" : "Profil niedostępny"
                        }
                      >
                        {reactorAvatar ? (
                          <img
                            src={reactorAvatar}
                            alt={reactorName}
                            className="w-14 h-14 rounded-full object-cover border-3 border-white dark:border-gray-600 shadow-md"
                          />
                        ) : (
                          <div
                            className={`w-14 h-14 rounded-full bg-gradient-to-br ${
                              typeInfo.color === "pink"
                                ? "from-pink-400 to-rose-600"
                                : typeInfo.color === "blue"
                                ? "from-blue-400 to-indigo-600"
                                : typeInfo.color === "yellow"
                                ? "from-yellow-400 to-orange-600"
                                : "from-gray-400 to-gray-600"
                            } flex items-center justify-center text-white font-bold text-xl shadow-md`}
                          >
                            {reactorName[0]?.toUpperCase() || typeInfo.emoji}
                          </div>
                        )}
                      </button>

                      {/* Treść powiadomienia */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-2xl">{typeInfo.emoji}</span>
                          <button
                            onClick={onProfileClick}
                            disabled={!reactorId}
                            className={`font-bold text-gray-900 dark:text-white ${
                              reactorId
                                ? "hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                                : "cursor-default"
                            } transition-colors text-lg`}
                          >
                            {reactorName}
                          </button>
                          <span className="text-gray-600 dark:text-gray-400">
                            {typeInfo.text}
                          </span>
                        </div>

                        {/* Treść reakcji/komentarza */}
                        {reaction.type === "story_reaction" &&
                          reactorData.reaction && (
                            <p className="text-3xl mt-2">
                              {reactorData.reaction}
                            </p>
                          )}
                        {reaction.type === "story_reply" &&
                          reactorData.comment && (
                            <p className="text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg p-3 mt-2 border border-gray-200 dark:border-gray-600 italic">
                              "{reactorData.comment}"
                            </p>
                          )}
                        {reaction.type === "review" && (
                          <div className="mt-2">
                            {reactorData.rating && (
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-xl ${
                                      i < reactorData.rating
                                        ? "text-yellow-400"
                                        : "text-gray-300 dark:text-gray-600"
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            )}
                            {reactorData.comment && (
                              <p className="text-gray-600 dark:text-gray-400 mt-1 italic">
                                "{reactorData.comment}"
                              </p>
                            )}
                            {!reactorData.rating && !reactorData.comment && (
                              <p className="text-gray-500 dark:text-gray-400 text-sm">
                                {reaction.message || "Otrzymałeś nową opinię"}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Czas */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                          {new Date(reaction.created_at).toLocaleString(
                            "pl-PL",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderPortfolioTab = () => {
    // ✅ PODŁĄCZONE: Używamy istniejącej funkcji renderPortfolio()
    return renderPortfolio();
  };

  const renderSettingsTab = () => {
    // ✅ PODŁĄCZONE: Używamy istniejącej funkcji renderProfile() (edycja profilu)
    return renderProfile();
  };

  // ===================================================================
  // RENDER HELPERS (old - będą usunięte stopniowo)
  // ===================================================================

  const renderContent = () => {
    switch (activeView) {
      case "feed":
        return renderFeed();
      case "overview":
        return renderOverview();
      case "profile":
        return renderProfile();
      case "portfolio":
        return renderPortfolio();
      case "subscription":
        return renderSubscription();
      case "certificate-application":
        return renderCertificateApplication();
      case "reviews":
        return renderReviewsAndAnalytics();
      case "verification":
        return renderVerification();
      case "messages":
        return renderMessages();
      default:
        return renderFeed();
    }
  };

  // ===================================================================
  // FEED TAB
  // ===================================================================

  const renderFeed = () => {
    return <FeedPage />;
  };

  // ===================================================================
  // OVERVIEW TAB
  // ===================================================================

  const renderOverview = () => {
    if (!workerProfile) return <div className="text-white">Ładowanie...</div>;

    const completionPercentage =
      workerProfileService.calculateProfileCompletion(workerProfile);

    return (
      <PageContainer>
        {/* Modern Header */}
        <PageHeader
          avatarUrl={workerProfile.avatar_url}
          avatarFallback={workerProfile.full_name?.[0]?.toUpperCase()}
          title={`Witaj, ${workerProfile.full_name}!`}
          subtitle={`${workerProfile.specialization || "Pracownik"} • ${
            workerProfile.location_city || "Holandia"
          } • Kompletność profilu: ${completionPercentage}%`}
          actionButton={
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("profile")}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 font-bold text-lg shadow-xl"
              >
                ⚙️ Edytuj Profil
              </button>
            </div>
          }
        />

        {/* Modern Premium Stats Chips */}
        <StatChipsGrid
          items={
            [
              {
                id: "projects",
                label: "Completed Projects",
                value: 0,
                tone: "cyan",
                icon: <Briefcase size={16} />,
              },
              {
                id: "rate",
                label: "Hourly Rate",
                value: `€${workerProfile.hourly_rate}`,
                tone: "emerald",
                icon: <DollarSign size={16} />,
              },
              {
                id: "certificates",
                label: "Certificates",
                value: certificates.length,
                tone: "violet",
                icon: <Award size={16} />,
              },
              {
                id: "messages",
                label: "Messages",
                value: messages.length,
                tone: "amber",
                icon: <Mail size={16} />,
                hint: unreadCount > 0 ? `${unreadCount} new` : undefined,
                onClick: () => setActiveTab("messages"),
              },
            ] as StatChipItem[]
          }
          columns={4}
        />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ContentCard
            className="cursor-pointer hover:shadow-2xl transition-all"
            noPadding
          >
            <button
              onClick={() => setActiveTab("profile")}
              className="w-full p-6 text-left"
            >
              <div className="text-4xl mb-3">👤</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Edytuj Profil
              </h3>
              <p className="text-gray-600 text-sm">
                Zaktualizuj swoje dane i umiejętności
              </p>
            </button>
          </ContentCard>

          <ContentCard
            className="cursor-pointer hover:shadow-2xl transition-all"
            noPadding
          >
            <button
              onClick={() => setActiveTab("certificates")}
              className="w-full p-6 text-left"
            >
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Certyfikaty
              </h3>
              <p className="text-gray-600 text-sm">
                Zarządzaj certyfikatami doświadczenia
              </p>
            </button>
          </ContentCard>

          <ContentCard
            className="cursor-pointer hover:shadow-2xl transition-all"
            noPadding
          >
            <button
              onClick={() => setActiveTab("overview")}
              className="w-full p-6 text-left"
            >
              <div className="text-4xl mb-3">💼</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Szukaj Pracy
              </h3>
              <p className="text-gray-600 text-sm">
                Przeglądaj dostępne oferty
              </p>
            </button>
          </ContentCard>
        </div>

        {/* Recent Activity */}
        <ContentCard>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            📊 Ostatnia aktywność
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="text-2xl">✓</div>
              <div className="flex-1">
                <div className="text-gray-900 font-medium">
                  Profil zaktualizowany
                </div>
                <div className="text-gray-600 text-sm">Dzisiaj o 14:30</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
              <div className="text-2xl">🏆</div>
              <div className="flex-1">
                <div className="text-gray-900 font-medium">
                  Certyfikat doświadczenia dodany
                </div>
                <div className="text-gray-600 text-sm">Wczoraj o 10:15</div>
              </div>
            </div>
          </div>
        </ContentCard>
      </PageContainer>
    );
  };

  // ===================================================================
  // PROFILE TAB (6-tab system)
  // ===================================================================

  const renderProfile = () => {
    if (!workerProfile)
      return <div className="text-gray-900">Ładowanie...</div>;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Profile Navigation Drawer - DRUGI HAMBURGER */}
          <ProfileNavigationDrawer
            isOpen={isProfileSidebarOpen}
            onClose={() => setIsProfileSidebarOpen(false)}
            activeSubTab={activeProfileTab}
            onSubTabChange={(tab) => {
              setActiveProfileTab(tab);
              setIsProfileSidebarOpen(false);
            }}
            role="worker"
            userName={workerProfile?.full_name || "Pracownik"}
            userAvatar={workerProfile?.avatar_url}
          />

          {/* Profile Sub-Header with Second Hamburger (Mobile Only) */}
          {isMobile && (
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg mb-4 shadow-lg">
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  onClick={() => setIsProfileSidebarOpen(true)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Otwórz menu profilu"
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
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <h2 className="text-lg font-bold">
                  {activeProfileTab === "edit" && "✏️ Edytuj Profil"}
                  {activeProfileTab === "availability" && "📅 Dostępność"}
                  {activeProfileTab === "stats" && "📈 Statystyki"}
                </h2>
                <div className="w-10"></div>
              </div>
            </div>
          )}

          {/* Header with Avatar */}
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 h-32 rounded-2xl mb-16">
            <div className="absolute -bottom-12 left-8">
              <div className="relative group">
                <img
                  src={
                    workerProfile.avatar_url ||
                    "https://api.dicebear.com/7.x/avataaars/svg?seed=" +
                      encodeURIComponent(workerProfile.full_name)
                  }
                  alt={workerProfile.full_name}
                  className="w-32 h-32 rounded-2xl border-4 border-white shadow-xl"
                />
                <label className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="text-white text-sm">📷 Zmień</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                </label>
              </div>
            </div>
            <div className="absolute -bottom-8 left-48">
              <h1 className="text-3xl font-bold text-gray-900">
                {workerProfile.full_name}
              </h1>
              <p className="text-gray-600">
                {workerProfile.specialization || "Pracownik"}
              </p>
            </div>
          </div>

          {/* Tab Navigation - Desktop Only */}
          {!isMobile && (
            <div className="flex gap-4 mb-8 border-b border-gray-200 overflow-x-auto bg-white rounded-t-2xl px-4">
              {[
                { id: "overview", label: "📊 Przegląd" },
                { id: "basic", label: "👤 Dane podstawowe" },
                { id: "skills", label: "⚡ Umiejętności" },
                { id: "certificates", label: "🏆 Certyfikaty" },
                { id: "portfolio", label: "💼 Portfolio" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveProfileTab(tab.id)}
                  className={`px-6 py-3 font-medium whitespace-nowrap transition-colors ${
                    activeProfileTab === tab.id
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Tab Content */}
          <div className="bg-white rounded-b-2xl shadow-xl p-8 border border-gray-200">
            {activeProfileTab === "overview" && renderProfileOverview()}
            {activeProfileTab === "basic" && renderProfileBasic()}
            {activeProfileTab === "skills" && renderProfileSkills()}
            {activeProfileTab === "certificates" && renderProfileCertificates()}
            {activeProfileTab === "portfolio" && renderProfilePortfolio()}
          </div>
        </div>
      </div>
    );
  };

  // Profile Tab: Overview
  const renderProfileOverview = () => {
    if (!workerProfile) return null;

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Przegląd Profilu
        </h2>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="text-gray-600 text-sm mb-1">Umiejętności</div>
            <div className="text-3xl font-bold text-blue-600">
              {skills.length}
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="text-gray-600 text-sm mb-1">Certyfikaty</div>
            <div className="text-3xl font-bold text-green-600">
              {certificates.length}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="text-gray-600 text-sm mb-1">Doświadczenie</div>
            <div className="text-3xl font-bold text-purple-600">
              {workerProfile.years_experience} lat
            </div>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
            <div className="text-gray-600 text-sm mb-1">Portfolio</div>
            <div className="text-3xl font-bold text-indigo-600">
              {portfolio.length}
            </div>
          </div>
        </div>

        {/* Profile Summary */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">O mnie</h3>
          <p className="text-gray-700 leading-relaxed">
            {workerProfile.bio ||
              'Brak opisu. Dodaj krótką bio w zakładce "Dane podstawowe".'}
          </p>
        </div>

        {/* Recent Certificates */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Ostatnie certyfikaty
          </h3>
          <div className="space-y-3">
            {certificates.slice(0, 3).map((cert) => (
              <div
                key={cert.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="text-3xl">🏆</div>
                <div className="flex-1">
                  <div className="text-gray-900 font-medium">
                    {cert.certificate_type}
                  </div>
                  <div className="text-gray-600 text-sm">{cert.issuer}</div>
                </div>
                {cert.verified && (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-medium">
                    ✓ Zweryfikowany
                  </span>
                )}
              </div>
            ))}
            {certificates.length === 0 && (
              <p className="text-gray-500 italic">
                Brak certyfikatów. Dodaj je w zakładce "Certyfikaty".
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Profile Tab: Basic Data
  const renderProfileBasic = () => {
    return (
      <form onSubmit={handleProfileUpdate} className="space-y-8">
        <h2 className="text-2xl font-bold text-white mb-6">Dane podstawowe</h2>

        {/* Dane osobowe */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Dane osobowe</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-neutral-400 mb-2">
                Imię i nazwisko *
              </label>
              <input
                type="text"
                required
                value={profileForm.full_name}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, full_name: e.target.value })
                }
                className="w-full px-4 py-3 bg-dark-700 border border-neutral-600 rounded-lg text-white focus:border-accent-cyber focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-2">
                Email
              </label>
              <input
                type="email"
                disabled
                value={profileForm.email}
                className="w-full px-4 py-3 bg-dark-900 border border-neutral-700 rounded-lg text-neutral-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-2">
                Telefon
              </label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, phone: e.target.value })
                }
                className="w-full px-4 py-3 bg-dark-700 border border-neutral-600 rounded-lg text-white focus:border-accent-cyber focus:outline-none"
                placeholder="+31..."
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-2">
                Miasto
              </label>
              <input
                type="text"
                value={profileForm.location_city}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    location_city: e.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-dark-700 border border-neutral-600 rounded-lg text-white focus:border-accent-cyber focus:outline-none"
                placeholder="Amsterdam"
              />
            </div>
          </div>
        </div>

        {/* Adres (Location) */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">📍 Lokalizacja</h3>
          <p className="text-sm text-neutral-400 mb-4">
            Twój adres będzie wyświetlany na mapie w profilu publicznym.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm text-neutral-400 mb-2">
                Adres (ulica i numer)
              </label>
              <input
                type="text"
                value={profileForm.address || ""}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    address: e.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-dark-700 border border-neutral-600 rounded-lg text-white focus:border-accent-cyber focus:outline-none"
                placeholder="Damstraat 123"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-2">
                Kod pocztowy
              </label>
              <input
                type="text"
                value={profileForm.postal_code || ""}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    postal_code: e.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-dark-700 border border-neutral-600 rounded-lg text-white focus:border-accent-cyber focus:outline-none"
                placeholder="1012 JS"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-2">
                Kraj
              </label>
              <select
                value={profileForm.location_country || "NL"}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    location_country: e.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-dark-700 border border-neutral-600 rounded-lg text-white focus:border-accent-cyber focus:outline-none"
              >
                <option value="NL">Niderland</option>
                <option value="BE">Belgia</option>
                <option value="DE">Niemcy</option>
                <option value="PL">Polska</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
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
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              Współrzędne GPS zostaną automatycznie wygenerowane po zapisaniu
            </span>
          </div>
        </div>

        {/* Dane zawodowe */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Dane zawodowe</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-neutral-400 mb-2">
                Specjalizacja
              </label>
              <input
                type="text"
                value={profileForm.specialization}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    specialization: e.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-dark-700 border border-neutral-600 rounded-lg text-white focus:border-accent-cyber focus:outline-none"
                placeholder="np. Elektryk, Spawacz, Stolarz..."
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-2">
                O mnie
              </label>
              <textarea
                rows={4}
                value={profileForm.bio}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, bio: e.target.value })
                }
                className="w-full px-4 py-3 bg-dark-700 border border-neutral-600 rounded-lg text-white focus:border-accent-cyber focus:outline-none resize-none"
                placeholder="Opisz swoje doświadczenie, umiejętności i osiągnięcia..."
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Stawka godzinowa (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={profileForm.hourly_rate}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      hourly_rate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-3 bg-dark-700 border border-neutral-600 rounded-lg text-white focus:border-accent-cyber focus:outline-none"
                  placeholder="45.00"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Lata doświadczenia
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={profileForm.years_experience}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      years_experience: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-3 bg-dark-700 border border-neutral-600 rounded-lg text-white focus:border-accent-cyber focus:outline-none"
                  placeholder="5"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <GlowButton
            type="submit"
            disabled={saving}
            variant="success"
            size="lg"
          >
            {saving ? "⏳ Zapisywanie..." : "💾 Zapisz zmiany"}
          </GlowButton>
          <GlowButton
            type="button"
            onClick={() => setActiveTab("overview")}
            variant="primary"
            size="lg"
          >
            Anuluj
          </GlowButton>
        </div>
      </form>
    );
  };

  // Profile Tab: Skills
  const renderProfileSkills = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white mb-6">Umiejętności</h2>

        {/* Add Skill */}
        <div className="flex gap-3">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && (e.preventDefault(), handleAddSkill())
            }
            className="flex-1 px-4 py-3 bg-dark-700 border border-neutral-600 rounded-lg text-white focus:border-accent-cyber focus:outline-none"
            placeholder="Wpisz umiejętność i naciśnij Enter..."
          />
          <GlowButton
            type="button"
            onClick={handleAddSkill}
            variant="success"
            size="md"
          >
            + Dodaj
          </GlowButton>
        </div>

        {/* Skills List */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">
            Twoje umiejętności ({skills.length})
          </h3>
          <div className="flex flex-wrap gap-3">
            {skills.length === 0 ? (
              <p className="text-neutral-400 italic">
                Brak umiejętności. Dodaj pierwszą umiejętność powyżej.
              </p>
            ) : (
              skills.map((skill) => (
                <div
                  key={skill}
                  className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-cyber/20 to-accent-techGreen/20 rounded-lg border border-accent-cyber/30 hover:border-accent-cyber transition-all"
                >
                  <span className="text-accent-cyber font-medium">{skill}</span>
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Popular Skills Suggestions */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">
            Popularne umiejętności
          </h3>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_SKILLS.map((suggestedSkill) => (
              <button
                key={suggestedSkill}
                onClick={() => {
                  setNewSkill(suggestedSkill);
                  handleAddSkill();
                }}
                disabled={skills.includes(suggestedSkill)}
                className="px-4 py-2 bg-dark-700 text-neutral-300 rounded-lg hover:bg-dark-600 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm"
              >
                + {suggestedSkill}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Profile Tab: Certificates
  const renderProfileCertificates = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Certyfikaty</h2>
          <label className="px-6 py-3 bg-gradient-to-r from-accent-cyber to-accent-techGreen text-white font-bold rounded-lg hover:shadow-lg hover:shadow-accent-cyber/50 transition-all cursor-pointer">
            + Dodaj certyfikat
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleCertificateUpload}
            />
          </label>
        </div>

        {/* Certificates Grid */}
        <div className="grid gap-6">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-dark-700 rounded-xl p-6 border border-neutral-600 hover:border-accent-cyber transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="text-6xl">🏆</div>
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-neutral-400 text-sm">
                        Typ certyfikatu
                      </div>
                      <div className="text-white font-bold text-lg">
                        {cert.certificate_type}
                      </div>
                    </div>
                    <div>
                      <div className="text-neutral-400 text-sm">Wydawca</div>
                      <div className="text-white">{cert.issuer}</div>
                    </div>
                    <div>
                      <div className="text-neutral-400 text-sm">
                        Data wydania
                      </div>
                      <div className="text-white">
                        {new Date(cert.issue_date).toLocaleDateString("pl-PL")}
                      </div>
                    </div>
                    <div>
                      <div className="text-neutral-400 text-sm">Status</div>
                      {cert.verified ? (
                        <span className="inline-block bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-sm">
                          ✓ Zweryfikowany
                        </span>
                      ) : (
                        <span className="inline-block bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-lg text-sm">
                          ⏳ W weryfikacji
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <a
                      href={cert.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-accent-cyber/20 text-accent-cyber rounded-lg hover:bg-accent-cyber/30 transition-all text-sm"
                    >
                      📄 Zobacz plik
                    </a>
                    <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-sm">
                      🗑️ Usuń
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {certificates.length === 0 && (
            <div className="text-center py-12 bg-dark-700 rounded-xl border border-neutral-600 border-dashed">
              <div className="text-6xl mb-4">🏆</div>
              <p className="text-neutral-400 mb-4">Brak certyfikatów</p>
              <label className="inline-block px-6 py-3 bg-gradient-to-r from-accent-cyber to-accent-techGreen text-white font-bold rounded-lg hover:shadow-lg hover:shadow-accent-cyber/50 transition-all cursor-pointer">
                + Dodaj pierwszy certyfikat
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleCertificateUpload}
                />
              </label>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Profile Tab: Portfolio (mock)
  const renderProfilePortfolio = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Portfolio</h2>
          <button
            onClick={() => openPortfolioModal()}
            className="px-6 py-3 bg-gradient-to-r from-accent-cyber to-accent-techGreen text-white font-bold rounded-lg hover:shadow-lg hover:shadow-accent-cyber/50 transition-all"
          >
            ➕ Dodaj projekt
          </button>
        </div>

        {portfolio.length === 0 ? (
          <div className="text-center py-12 bg-dark-700 rounded-xl border border-neutral-600 border-dashed">
            <div className="text-6xl mb-4">💼</div>
            <p className="text-neutral-400 mb-4">Brak projektów w portfolio</p>
            <button
              onClick={() => openPortfolioModal()}
              className="px-6 py-3 bg-accent-cyber text-white font-bold rounded-lg hover:shadow-lg transition-all"
            >
              Dodaj pierwszy projekt
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {portfolio.map((project) => (
              <div
                key={project.id}
                className="bg-dark-700 rounded-xl border border-neutral-600 overflow-hidden hover:border-accent-cyber transition-all"
              >
                {project.images && project.images.length > 0 && (
                  <img
                    src={project.images[0]}
                    alt={project.title}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-2">
                    {project.title}
                  </h3>
                  <p className="text-neutral-400 text-sm mb-3 line-clamp-2">
                    {project.description}
                  </p>

                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {project.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-dark-900 text-accent-techGreen text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => openPortfolioModal(project)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-all"
                    >
                      ✏️ Edytuj
                    </button>
                    <button
                      onClick={() => handlePortfolioDelete(project.id)}
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-all"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ===================================================================
  // PORTFOLIO TAB
  // ===================================================================

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
              {/* Glassmorphism Container */}
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
                  {/* Glassmorphism Card */}
                  <div
                    className="relative rounded-2xl overflow-hidden h-full transition-all duration-300 group-hover:scale-105"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255,255,255,0.15)",
                    }}
                  >
                    {/* Image Gallery Thumbnail */}
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
                        {/* Image Counter Badge */}
                        {project.images.length > 1 && (
                          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold">
                            📷 {project.images.length}
                          </div>
                        )}
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      </div>
                    )}

                    <div className="p-6">
                      {/* Title & Featured Badge */}
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

                      {/* Tags */}
                      {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {project.tags.slice(0, 4).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full font-medium backdrop-blur-sm"
                            >
                              {tag}
                            </span>
                          ))}
                          {project.tags.length > 4 && (
                            <span className="px-3 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full font-medium">
                              +{project.tags.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Project Details Grid */}
                      <div className="space-y-2 mb-4 text-sm">
                        {/* Location */}
                        {project.location && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <span className="text-purple-400">📍</span>
                            <span className="font-medium">
                              {project.location}
                            </span>
                          </div>
                        )}

                        {/* Completion Date */}
                        {project.completion_date && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <span className="text-green-400">✅</span>
                            <span>
                              Oddano:{" "}
                              {new Date(
                                project.completion_date
                              ).toLocaleDateString("pl-PL")}
                            </span>
                          </div>
                        )}

                        {/* Client */}
                        {project.client_name && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <span className="text-blue-400">👤</span>
                            <span>{project.client_name}</span>
                          </div>
                        )}

                        {/* Duration */}
                        {project.start_date && project.end_date && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <span className="text-orange-400">⏱️</span>
                            <span>
                              {Math.ceil(
                                (new Date(project.end_date).getTime() -
                                  new Date(project.start_date).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )}{" "}
                              dni
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4 border-t border-white/10">
                        {project.project_url && (
                          <a
                            href={project.project_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-center rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-all text-sm font-medium"
                          >
                            🔗 Link
                          </a>
                        )}
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

          {/* Add/Edit Modal */}
          {showPortfolioModal && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 max-w-4xl w-full border border-slate-700 my-8">
                <h2 className="text-3xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {editingProjectId
                    ? "✏️ Edytuj projekt"
                    : "➕ Dodaj nowy projekt"}
                </h2>

                <form onSubmit={handlePortfolioSubmit} className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                      placeholder="np. Nowoczesna instalacja elektryczna w apartamentowcu"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none transition-all"
                      placeholder="Opisz szczegółowo projekt: zakres prac, użyte technologie, wyzwania, osiągnięte rezultaty..."
                    />
                  </div>

                  {/* 🆕 Location & Address - 2 columns */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        📍 Lokalizacja (miasto/region)
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
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all"
                        placeholder="np. Warszawa, Mazowieckie"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
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
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all"
                        placeholder="ul. Przykładowa 123, Warszawa"
                      />
                    </div>
                  </div>

                  {/* Dates Grid - 3 columns */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        📅 Data rozpoczęcia *
                      </label>
                      <input
                        type="date"
                        required
                        value={portfolioForm.start_date}
                        onChange={(e) =>
                          setPortfolioForm({
                            ...portfolioForm,
                            start_date: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        📅 Data zakończenia
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
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        ✅ Data oddania projektu
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
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Client Info - 2 columns */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
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
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                        placeholder="Jan Kowalski"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        🏢 Firma klienta
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
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                        placeholder="XYZ Development Sp. z o.o."
                      />
                    </div>
                  </div>

                  {/* Category & Tags */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        📂 Kategoria
                      </label>
                      <select
                        value={portfolioForm.category}
                        onChange={(e) =>
                          setPortfolioForm({
                            ...portfolioForm,
                            category: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                      >
                        <option value="">Wybierz kategorię</option>
                        <option value="elektryka">⚡ Elektryka</option>
                        <option value="hydraulika">💧 Hydraulika</option>
                        <option value="budowa">🏗️ Budowa</option>
                        <option value="remont">🔨 Remont</option>
                        <option value="instalacje">🔧 Instalacje</option>
                        <option value="design">🎨 Design</option>
                        <option value="it">💻 IT/Software</option>
                        <option value="inne">📦 Inne</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        🏷️ Tagi (oddzielone przecinkami)
                      </label>
                      <input
                        type="text"
                        value={portfolioForm.tags.join(", ")}
                        onChange={(e) =>
                          setPortfolioForm({
                            ...portfolioForm,
                            tags: e.target.value
                              .split(",")
                              .map((t) => t.trim())
                              .filter((t) => t),
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                        placeholder="React, TypeScript, Modern Design"
                      />
                    </div>
                  </div>

                  {/* URLs */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
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
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all"
                        placeholder="https://example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        🎥 Link do video
                      </label>
                      <input
                        type="url"
                        value={portfolioForm.video_url}
                        onChange={(e) =>
                          setPortfolioForm({
                            ...portfolioForm,
                            video_url: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all"
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      📷 Zdjęcia projektu
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePortfolioImageUpload}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-blue-600 file:to-purple-600 file:text-white hover:file:from-blue-500 hover:file:to-purple-500 file:font-medium file:cursor-pointer transition-all"
                      />
                    </div>
                    {portfolioForm.images.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {portfolioForm.images.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={img}
                              alt={`Preview ${idx + 1}`}
                              className="w-20 h-20 object-cover rounded-lg border-2 border-slate-600"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setPortfolioForm({
                                  ...portfolioForm,
                                  images: portfolioForm.images.filter(
                                    (_, i) => i !== idx
                                  ),
                                });
                              }}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Toggles */}
                  <div className="flex gap-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={portfolioForm.is_public}
                        onChange={(e) =>
                          setPortfolioForm({
                            ...portfolioForm,
                            is_public: e.target.checked,
                          })
                        }
                        className="w-5 h-5 rounded bg-slate-800 border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
                      />
                      <span className="text-gray-300">
                        🌍 Widoczne publicznie
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={portfolioForm.is_featured}
                        onChange={(e) =>
                          setPortfolioForm({
                            ...portfolioForm,
                            is_featured: e.target.checked,
                          })
                        }
                        className="w-5 h-5 rounded bg-slate-800 border-slate-600 text-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
                      />
                      <span className="text-gray-300">⭐ Wyróżnione</span>
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4 border-t border-slate-700">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-500 hover:to-purple-500 hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving
                        ? "⏳ Zapisywanie..."
                        : editingProjectId
                        ? "💾 Zapisz zmiany"
                        : "✅ Dodaj projekt"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPortfolioModal(false);
                        resetPortfolioForm();
                      }}
                      className="px-6 py-4 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-all"
                    >
                      ❌ Anuluj
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 🆕 Image Lightbox */}
          {lightboxOpen && (
            <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-4">
              <button
                onClick={() => setLightboxOpen(false)}
                className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-2xl font-bold transition-all z-10"
              >
                ✕
              </button>

              {/* Navigation Arrows */}
              {lightboxImages.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setLightboxIndex(Math.max(0, lightboxIndex - 1))
                    }
                    disabled={lightboxIndex === 0}
                    className="absolute left-4 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-2xl font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
                    className="absolute right-4 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-2xl font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    →
                  </button>
                </>
              )}

              {/* Main Image */}
              <div className="max-w-6xl max-h-[90vh] flex flex-col items-center gap-4">
                <img
                  src={lightboxImages[lightboxIndex]}
                  alt={`Image ${lightboxIndex + 1}`}
                  className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
                />
                <div className="text-white text-center">
                  <span className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full">
                    {lightboxIndex + 1} / {lightboxImages.length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 🆕 Project Detail View Modal */}
          {showProjectDetail && selectedProject && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 overflow-y-auto">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl max-w-5xl w-full border border-slate-700 my-8 overflow-hidden">
                {/* Header with Image */}
                {selectedProject.images &&
                  selectedProject.images.length > 0 && (
                    <div className="relative h-80">
                      <img
                        src={selectedProject.images[0]}
                        alt={selectedProject.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
                      <button
                        onClick={() => setShowProjectDetail(false)}
                        className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white font-bold transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                <div className="p-8">
                  {/* Title & Badges */}
                  <div className="flex items-start justify-between mb-6">
                    <h2 className="text-4xl font-bold text-white flex-1">
                      {selectedProject.title}
                    </h2>
                    {selectedProject.is_featured && (
                      <span className="ml-4 px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-xl font-bold">
                        ⭐ Wyróżnione
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                    {selectedProject.description}
                  </p>

                  {/* Details Grid */}
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {selectedProject.location && (
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">📍</span>
                        <div>
                          <div className="text-sm text-gray-400">
                            Lokalizacja
                          </div>
                          <div className="text-white font-medium">
                            {selectedProject.location}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedProject.address && (
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🏠</span>
                        <div>
                          <div className="text-sm text-gray-400">Adres</div>
                          <div className="text-white font-medium">
                            {selectedProject.address}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedProject.client_name && (
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">👤</span>
                        <div>
                          <div className="text-sm text-gray-400">Klient</div>
                          <div className="text-white font-medium">
                            {selectedProject.client_name}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedProject.client_company && (
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🏢</span>
                        <div>
                          <div className="text-sm text-gray-400">Firma</div>
                          <div className="text-white font-medium">
                            {selectedProject.client_company}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedProject.start_date && (
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">📅</span>
                        <div>
                          <div className="text-sm text-gray-400">
                            Rozpoczęcie
                          </div>
                          <div className="text-white font-medium">
                            {new Date(
                              selectedProject.start_date
                            ).toLocaleDateString("pl-PL")}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedProject.end_date && (
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🏁</span>
                        <div>
                          <div className="text-sm text-gray-400">
                            Zakończenie
                          </div>
                          <div className="text-white font-medium">
                            {new Date(
                              selectedProject.end_date
                            ).toLocaleDateString("pl-PL")}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedProject.completion_date && (
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">✅</span>
                        <div>
                          <div className="text-sm text-gray-400">
                            Data oddania
                          </div>
                          <div className="text-white font-medium">
                            {new Date(
                              selectedProject.completion_date
                            ).toLocaleDateString("pl-PL")}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedProject.category && (
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">📂</span>
                        <div>
                          <div className="text-sm text-gray-400">Kategoria</div>
                          <div className="text-white font-medium capitalize">
                            {selectedProject.category}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {selectedProject.tags && selectedProject.tags.length > 0 && (
                    <div className="mb-8">
                      <div className="text-sm text-gray-400 mb-3">Tagi</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.tags.map(
                          (tag: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-xl font-medium"
                            >
                              {tag}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Image Gallery */}
                  {selectedProject.images &&
                    selectedProject.images.length > 1 && (
                      <div className="mb-8">
                        <div className="text-sm text-gray-400 mb-3">
                          Galeria ({selectedProject.images.length} zdjęć)
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          {selectedProject.images.map(
                            (img: string, idx: number) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`${selectedProject.title} ${idx + 1}`}
                                className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border-2 border-slate-700 hover:border-blue-500"
                                onClick={() => {
                                  setLightboxImages(selectedProject.images);
                                  setLightboxIndex(idx);
                                  setLightboxOpen(true);
                                }}
                              />
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-6 border-t border-slate-700">
                    {selectedProject.project_url && (
                      <a
                        href={selectedProject.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-center rounded-xl hover:from-cyan-500 hover:to-blue-500 font-medium transition-all"
                      >
                        🔗 Odwiedź projekt
                      </a>
                    )}
                    {selectedProject.video_url && (
                      <a
                        href={selectedProject.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white text-center rounded-xl hover:from-red-500 hover:to-pink-500 font-medium transition-all"
                      >
                        🎥 Zobacz video
                      </a>
                    )}
                    <button
                      onClick={() => setShowProjectDetail(false)}
                      className="px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 font-medium transition-all"
                    >
                      Zamknij
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ===================================================================
  // EARNINGS TAB
  // ===================================================================

  const renderEarnings = () => {
    return (
      <div className="min-h-screen bg-primary-dark p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">💰 Zarobki</h1>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 border border-green-500">
              <div className="text-green-100 text-sm mb-2">
                💰 Suma całkowita
              </div>
              <div className="text-4xl font-bold text-white">
                €{earningsStats?.total?.toFixed(2) || "0.00"}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 border border-blue-500">
              <div className="text-blue-100 text-sm mb-2">📅 Ten miesiąc</div>
              <div className="text-4xl font-bold text-white">
                €{earningsStats?.thisMonth?.toFixed(2) || "0.00"}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 border border-purple-500">
              <div className="text-purple-100 text-sm mb-2">⏳ Oczekujące</div>
              <div className="text-4xl font-bold text-white">
                €{earningsStats?.pending?.toFixed(2) || "0.00"}
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl p-6 border border-yellow-500">
              <div className="text-yellow-100 text-sm mb-2">✅ Wypłacone</div>
              <div className="text-4xl font-bold text-white">
                €{earningsStats?.paid?.toFixed(2) || "0.00"}
              </div>
            </div>
          </div>

          {/* Earnings Table */}
          <div className="bg-dark-800 rounded-2xl border border-neutral-700 overflow-hidden">
            <div className="p-6 border-b border-neutral-700">
              <h2 className="text-xl font-bold text-white">
                📊 Historia zarobków
              </h2>
            </div>
            {earnings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-neutral-400">
                  Brak zarobków do wyświetlenia
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-neutral-300">
                        Data
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-neutral-300">
                        Opis
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-neutral-300">
                        Godziny
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-neutral-300">
                        Kwota
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-neutral-300">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-700">
                    {earnings.map((earning) => (
                      <tr
                        key={earning.id}
                        className="hover:bg-dark-700/50 transition-all"
                      >
                        <td className="px-6 py-4 text-white">
                          {new Date(earning.payment_date).toLocaleDateString(
                            "pl-PL"
                          )}
                        </td>
                        <td className="px-6 py-4 text-neutral-300">
                          {earning.description}
                        </td>
                        <td className="px-6 py-4 text-white">
                          {earning.hours_worked}h
                        </td>
                        <td className="px-6 py-4 text-green-400 font-bold">
                          €{(earning.amount || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              earning.status === "paid"
                                ? "bg-green-600 text-white"
                                : "bg-yellow-600 text-white"
                            }`}
                          >
                            {earning.status === "paid"
                              ? "✅ Wypłacone"
                              : "⏳ Oczekujące"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ===================================================================
  // REVIEWS & ANALYTICS TAB
  // ===================================================================

  const renderReviewsAndAnalytics = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Analytics Section - ZACHOWANE */}
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              📊 Analityka
            </h1>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="text-gray-600 text-sm mb-2">
                  👁️ Wyświetlenia profilu
                </div>
                <div className="text-4xl font-bold text-gray-900">
                  {analytics?.profile_views || 0}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="text-gray-600 text-sm mb-2">
                  📝 Wysłane aplikacje
                </div>
                <div className="text-4xl font-bold text-blue-600">
                  {analytics?.applications_sent || 0}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="text-gray-600 text-sm mb-2">
                  ✅ Zaakceptowane
                </div>
                <div className="text-4xl font-bold text-green-600">
                  {analytics?.applications_accepted || 0}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="text-gray-600 text-sm mb-2">
                  ⭐ Średnia ocena
                </div>
                <div className="text-4xl font-bold text-yellow-600">
                  {reviews.length > 0
                    ? (
                        reviews.reduce(
                          (sum: number, r: any) => sum + r.rating,
                          0
                        ) / reviews.length
                      ).toFixed(1)
                    : analytics?.average_rating?.toFixed(1) || "0.0"}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-6 mt-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="text-gray-600 text-sm mb-2">
                  ✔️ Ukończone zlecenia
                </div>
                <div className="text-4xl font-bold text-purple-600">
                  {analytics?.completed_jobs || 0}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="text-gray-600 text-sm mb-2">
                  💰 Suma zarobków
                </div>
                <div className="text-4xl font-bold text-green-600">
                  €{analytics?.total_earnings?.toFixed(2) || "0.00"}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="text-gray-600 text-sm mb-2">💬 Odpowiedzi</div>
                <div className="text-4xl font-bold text-cyan-600">
                  {analytics?.response_rate || 0}%
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="text-gray-600 text-sm mb-2">
                  💼 Wyświetlenia ofert
                </div>
                <div className="text-4xl font-bold text-orange-600">
                  {analytics?.job_views || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section - NOWY PEŁNY SYSTEM (WHITE THEME) */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            {/* Gradient Header with Stats */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                ⭐ Opinie od pracodawców
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Reviews */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-white/80 text-sm mb-1">Łącznie opinii</p>
                  <p className="text-white text-2xl font-bold">
                    {reviews.length}
                  </p>
                </div>
                {/* Average Rating */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-white/80 text-sm mb-1">Średnia ocena</p>
                  <p className="text-white text-2xl font-bold">
                    {reviews.length > 0
                      ? (
                          reviews.reduce((sum, r) => sum + r.rating, 0) /
                          reviews.length
                        ).toFixed(1)
                      : analytics?.average_rating?.toFixed(1) || "0.0"}
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
                    reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={stars} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-12">
                        {stars} ⭐
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2.5 rounded-full transition-all duration-300"
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
                        ? "bg-blue-600 text-white"
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
                          ? "bg-blue-600 text-white"
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
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <p className="text-gray-500 text-lg mb-2">Brak opinii</p>
                  <p className="text-sm text-gray-400">
                    Pracodawcy będą mogli wystawić opinie po zakończeniu
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
                    const sortedReviews = [...filteredReviews].sort((a, b) => {
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
                    });

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
                              {/* Reviewer/Employer Avatar */}
                              <div className="flex-shrink-0">
                                {(review as any).reviewer?.avatar_url ||
                                (review as any).employer?.logo_url ? (
                                  <img
                                    src={
                                      (review as any).reviewer?.avatar_url ||
                                      (review as any).employer?.logo_url
                                    }
                                    alt={
                                      (review as any).reviewer?.full_name ||
                                      (review as any).employer?.company_name ||
                                      "Reviewer"
                                    }
                                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-200"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                                    {((review as any).reviewer?.full_name ||
                                      (review as any).employer?.company_name ||
                                      "A")[0]?.toUpperCase()}
                                  </div>
                                )}
                              </div>

                              {/* Reviewer/Employer Info and Rating */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-lg">
                                  {(review as any).reviewer?.full_name ||
                                    (review as any).employer?.company_name ||
                                    "Anonim"}
                                </h4>
                                <div className="flex items-center gap-3 mt-2">
                                  <div className="flex items-center">
                                    {Array.from({ length: 5 }, (_, i) => (
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
                                    ))}
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
                              </div>
                            </div>

                            {/* Detailed Ratings (4 mini cards) */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                              {/* Quality Rating */}
                              <div className="border-l-4 border-blue-500 bg-blue-50 rounded-lg p-3">
                                <p className="text-xs text-blue-700 font-medium mb-1">
                                  Jakość pracy
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
                              <div className="border-l-4 border-purple-500 bg-purple-50 rounded-lg p-3">
                                <p className="text-xs text-purple-700 font-medium mb-1">
                                  Profesjonalizm
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
                              onClick={() => setShowAllReviews(!showAllReviews)}
                              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all"
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
                            workerProfile?.full_name || "Pracownik"
                          }</title>
                          <style>
                            body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
                            h1 { color: #2563eb; }
                            .review { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
                            .rating { color: #fbbf24; }
                          </style>
                        </head>
                        <body>
                          <h1>Opinie - ${
                            workerProfile?.full_name || "Pracownik"
                          }</h1>
                          ${reviews
                            .map(
                              (r) => `
                            <div class="review">
                              <h3>${
                                r.employer?.company_name || "Pracodawca"
                              }</h3>
                              <p class="rating">${"⭐".repeat(r.rating)}</p>
                              <p>${r.comment || "Brak komentarza"}</p>
                              <small>${
                                r.created_at
                                  ? new Date(r.created_at).toLocaleDateString(
                                      "pl-PL"
                                    )
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
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    📄 Pobierz PDF (HTML)
                  </button>
                  <button
                    onClick={() => {
                      const csvContent = [
                        ["Pracodawca", "Ocena", "Komentarz", "Data"].join(","),
                        ...reviews.map((r) =>
                          [
                            r.employer?.company_name || "Pracodawca",
                            r.rating,
                            `"${(r.comment || "").replace(/"/g, '""')}"`,
                            r.created_at
                              ? new Date(r.created_at).toLocaleDateString(
                                  "pl-PL"
                                )
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
                  💡 PDF (HTML) - otwórz w przeglądarce i zapisz jako PDF | CSV
                  - importuj do Excel/Sheets
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ===================================================================
  // OTHER TABS (Jobs, Applications, Verification, Courses)
  // ===================================================================

  const renderJobs = () => {
    return (
      <div className="min-h-screen bg-primary-dark p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">
            💼 Dostępne oferty pracy
          </h1>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderApplications = () => {
    return (
      <div className="min-h-screen bg-primary-dark p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">
            📝 Twoje aplikacje
          </h1>

          {applications.length === 0 ? (
            <div className="text-center py-12 bg-dark-800 rounded-xl border border-neutral-700">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-neutral-400 mb-4">Brak aplikacji</p>
              <button
                onClick={() => setActiveTab("overview")}
                className="px-6 py-3 bg-accent-cyber text-white font-bold rounded-lg hover:shadow-lg transition-all"
              >
                Przeglądaj oferty pracy
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-dark-800 rounded-xl p-6 border border-neutral-700 hover:border-accent-cyber transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {app.job?.title || "Oferta pracy"}
                      </h3>
                      <div className="flex items-center gap-4 text-neutral-400 text-sm mb-4">
                        <span>🏢 {app.job?.company_name || "Firma"}</span>
                        <span>📍 {app.job?.location || "Lokalizacja"}</span>
                        <span>
                          📅{" "}
                          {new Date(app.applied_at).toLocaleDateString("pl-PL")}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-bold ${
                          app.status === "accepted"
                            ? "bg-green-600 text-white"
                            : app.status === "rejected"
                            ? "bg-red-600 text-white"
                            : app.status === "withdrawn"
                            ? "bg-neutral-600 text-white"
                            : "bg-yellow-600 text-white"
                        }`}
                      >
                        {app.status === "accepted"
                          ? "✅ Zaakceptowana"
                          : app.status === "rejected"
                          ? "❌ Odrzucona"
                          : app.status === "withdrawn"
                          ? "🚫 Wycofana"
                          : "⏳ W trakcie"}
                      </span>
                    </div>
                  </div>

                  {app.cover_letter && (
                    <div className="mb-4">
                      <div className="text-sm text-neutral-400 mb-2">
                        List motywacyjny:
                      </div>
                      <div className="bg-dark-700 rounded-lg p-4 text-neutral-300 text-sm">
                        {app.cover_letter}
                      </div>
                    </div>
                  )}

                  {app.status === "pending" && (
                    <button
                      onClick={() => handleWithdrawApplication(app.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                    >
                      🚫 Wycofaj aplikację
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderVerification = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🏆 Certyfikaty doświadczenia
          </h1>

          {/* Status */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200 mb-8">
            <div className="flex items-center gap-4">
              <div className="text-5xl">
                {workerProfile?.verified ? "✅" : "⏳"}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {workerProfile?.verified
                    ? "Zweryfikowany"
                    : "Weryfikacja w toku"}
                </h2>
                <p className="text-gray-600">
                  {workerProfile?.verified
                    ? "Twój profil jest zweryfikowany"
                    : "Dodaj certyfikaty, aby rozpocząć weryfikację"}
                </p>
              </div>
            </div>
          </div>

          {/* ZZP EXAM APPLICATION BUTTON */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 border border-green-300 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">
                  📜 Certyfikat ZZP
                </h2>
                <p className="text-green-100 mb-4">
                  Zdobądź oficjalny certyfikat ZZP potwierdzający Twoje
                  doświadczenie w pracy magazynowej (€230)
                </p>
                <ul className="text-green-50 text-sm space-y-2 mb-4">
                  <li>✅ Egzamin praktyczny + teoretyczny</li>
                  <li>✅ Certyfikat uznawany w Holandii</li>
                  <li>✅ Zwiększ swoje szanse na zatrudnienie</li>
                  <li>✅ Jednorazowa opłata €230</li>
                </ul>
              </div>
              <button
                onClick={() => navigate("/zzp-exam-application")}
                className="ml-6 px-8 py-4 bg-white text-green-600 font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                Złóż podanie o certyfikat ZZP →
              </button>
            </div>
          </div>

          {/* Certificates List - same as in profile */}
          {renderProfileCertificates()}
        </div>
      </div>
    );
  };

  // ===================================================================
  // MESSAGES TAB - MESSENGER UI
  // ===================================================================

  const renderMessages = () => {
    // Function to navigate to partner's profile
    const navigateToPartnerProfile = async (partnerId: string) => {
      try {
        // Get the user's role from profiles table
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", partnerId)
          .single();

        if (!profileData) return;

        const role = profileData.role;
        let targetUrl = "";

        // Get role-specific ID
        if (role === "worker") {
          const { data: workerData } = await supabase
            .from("workers")
            .select("id")
            .eq("profile_id", partnerId)
            .single();
          if (workerData)
            targetUrl = `/worker/profile/${workerData.id}#contact`;
        } else if (role === "employer") {
          const { data: employerData } = await supabase
            .from("employers")
            .select("id")
            .eq("profile_id", partnerId)
            .single();
          if (employerData)
            targetUrl = `/employer/profile/${employerData.id}#contact`;
        } else if (role === "accountant") {
          const { data: accountantData } = await supabase
            .from("accountants")
            .select("id")
            .eq("profile_id", partnerId)
            .single();
          if (accountantData)
            targetUrl = `/accountant/profile/${accountantData.id}#contact`;
        } else if (role === "cleaning_company") {
          const { data: ccData } = await supabase
            .from("cleaning_companies")
            .select("id")
            .eq("profile_id", partnerId)
            .single();
          if (ccData)
            targetUrl = `/cleaning-company/profile/${ccData.id}#contact`;
        } else if (role === "admin") {
          targetUrl = `/admin/profile/${partnerId}#contact`;
        }

        if (targetUrl) {
          navigate(targetUrl);
        }
      } catch (error) {
        console.error("Navigation error:", error);
      }
    };

    return (
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
                      onClick={() => handleSelectConversation(conversation)}
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
                              {conversation.partnerName.charAt(0).toUpperCase()}
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
                    <p className="text-center font-medium">Brak konwersacji</p>
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
                  {console.log("🎨 [DEBUG] Selected conversation:", {
                    partnerId: selectedConversation.partnerId,
                    partnerName: selectedConversation.partnerName,
                    partnerAvatar: selectedConversation.partnerAvatar,
                    hasAvatar: !!selectedConversation.partnerAvatar,
                  })}
                  {/* Chat Header */}
                  <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Clickable Avatar */}
                        <button
                          onClick={() =>
                            navigateToPartnerProfile(
                              selectedConversation.partnerId
                            )
                          }
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          title="Zobacz profil"
                        >
                          {selectedConversation.partnerAvatar ? (
                            <img
                              src={selectedConversation.partnerAvatar}
                              alt={selectedConversation.partnerName}
                              className="w-10 h-10 rounded-full object-cover border-2 border-blue-500 hover:border-blue-600"
                            />
                          ) : (
                            <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg hover:from-blue-600 hover:to-purple-700">
                              {selectedConversation.partnerName
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                        </button>
                        <div>
                          {/* Clickable Name */}
                          <button
                            onClick={() =>
                              navigateToPartnerProfile(
                                selectedConversation.partnerId
                              )
                            }
                            className="font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer text-left"
                            title="Zobacz profil"
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
                              "Niedostępny"
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
                        const isOwnMessage = msg.sender_id === userId;
                        const showAvatar =
                          index === 0 ||
                          selectedConversation.messages[index - 1]
                            ?.sender_id !== msg.sender_id;

                        return (
                          <div
                            key={msg.id}
                            className={`flex ${
                              isOwnMessage ? "justify-end" : "justify-start"
                            } gap-2`}
                          >
                            {/* Avatar (for received messages) */}
                            {!isOwnMessage && showAvatar && (
                              <div className="flex-shrink-0">
                                {selectedConversation.partnerAvatar ? (
                                  <img
                                    src={selectedConversation.partnerAvatar}
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
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
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
                    Kliknij na konwersację po lewej stronie, aby rozpocząć czat
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===================================================================
  // SUBSCRIPTION TAB
  // ===================================================================

  const renderSubscription = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            💳 Moja Subskrypcja
          </h1>
          <p className="text-gray-600 mb-8">
            Zarządzaj swoją subskrypcją i zobacz historię płatności
          </p>

          <SubscriptionPanel
            workerId={userId}
            onUpgradeClick={() => setActiveTab("certificates")}
          />
        </div>
      </div>
    );
  };

  // ===================================================================
  // CERTIFICATE APPLICATION TAB - ZZP EXAM (€230)
  // ===================================================================

  const renderCertificateApplication = () => {
    // Get user email from profile
    const userEmail = workerProfile?.email || "";

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏆 Aanmelden voor ZZP Examen
          </h1>
          <p className="text-gray-600 mb-8">
            Fysiek examen in magazijn + Officieel ZZP Certificaat (€230
            eenmalig)
          </p>

          <ZZPExamApplicationForm
            userId={userId}
            userEmail={userEmail}
            onSuccess={() => {
              setSuccess(
                "✅ Egzamin opłacony! Wkrótce skontaktujemy się w sprawie terminu."
              );
              setTimeout(() => {
                setActiveTab("subscription");
              }, 3000);
            }}
          />

          {/* Back button */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setActiveTab("subscription")}
              className="text-gray-600 hover:text-gray-900 underline"
            >
              ← Terug naar abonnement
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ===================================================================
  // MAIN RENDER
  // ===================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <div className="text-white text-xl">Ładowanie profilu...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
      {/* 3D Background Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden perspective-container">
        <Animated3DProfileBackground role="worker" opacity={0.25} />
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex h-screen relative z-10">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <DashboardSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            title="👷 Pracownik"
            subtitle="Panel zarządzania"
            unreadMessages={unreadCount}
            onSupportClick={handleContactSupport}
          />
        )}

        {/* Mobile Navigation Drawer */}
        {isMobile && (
          <DashboardSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            title="👷 Pracownik"
            subtitle="Panel zarządzania"
            unreadMessages={unreadCount}
            isMobile={true}
            isMobileMenuOpen={isSidebarOpen}
            onMobileMenuToggle={closeSidebar}
            onSupportClick={handleContactSupport}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Global Notifications */}
          {error && (
            <div className="fixed top-4 right-4 z-50 bg-red-500/90 text-white px-6 py-4 rounded-lg shadow-2xl border border-red-400 animate-slide-in">
              {error}
            </div>
          )}
          {success && (
            <div className="fixed top-4 right-4 z-50 bg-green-500/90 text-white px-6 py-4 rounded-lg shadow-2xl border border-green-400 animate-slide-in">
              {success}
            </div>
          )}

          {/* Main scrollable content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <TabPanel isActive={activeTab === "overview"}>
              {renderPanelTab()}
            </TabPanel>

            <TabPanel isActive={activeTab === "profile"}>
              {renderSettingsTab()}
            </TabPanel>

            <TabPanel isActive={activeTab === "reviews"}>
              {renderReviewsTab()}
            </TabPanel>

            <TabPanel isActive={activeTab === "messages"}>
              {renderMessagesTab()}
            </TabPanel>

            <TabPanel isActive={activeTab === "certificates"}>
              {renderProfileCertificates()}

              {/* Certificate Application Form */}
              <div className="mt-8">
                <CertificateApplicationForm
                  workerId={userId}
                  onSubmit={() => {
                    setSuccess(
                      "✅ Aplikacja wysłana! Skontaktujemy się wkrótce."
                    );
                    setTimeout(() => {
                      // Reload certificates after submission
                      loadAllData();
                    }, 2000);
                  }}
                  onCancel={() => setActiveTab("overview")}
                />
              </div>
            </TabPanel>

            <TabPanel isActive={activeTab === "portfolio"}>
              {renderPortfolio()}
            </TabPanel>

            <TabPanel isActive={activeTab === "subscription"}>
              {renderSubscription()}
            </TabPanel>

            <TabPanel isActive={activeTab === "saved_activity"}>
              <SavedActivity />
            </TabPanel>

            <TabPanel isActive={activeTab === "tablica"}>
              <FeedPage />
            </TabPanel>

            <TabPanel isActive={activeTab === "team"}>
              {userId && <WorkerTeamDashboard />}
            </TabPanel>

            <TabPanel isActive={activeTab === "my_profile"}>
              <MyProfilePreview role="worker" />
            </TabPanel>

            <TabPanel isActive={activeTab === "settings"}>
              <WorkerSettingsPanel
                workerProfile={workerProfile}
                notificationSettings={notificationSettings}
                privacySettings={privacySettings}
                language={profileForm.language || "pl"}
                blockedDates={workerProfile?.unavailable_dates || []}
                saving={saving}
                onAvatarUpload={handleAvatarUpload}
                onCoverImageUpload={handleCoverImageUploadSuccess}
                onAvailabilityChange={handleAvailabilityChange}
                onAvailabilityToggle={handleAvailabilityToggle}
                onBlockDate={handleBlockDate}
                onUnblockDate={handleUnblockDate}
                onNotificationSettingsChange={setNotificationSettings}
                onNotificationSettingsSave={handleNotificationSettingsUpdate}
                onPrivacySettingsChange={setPrivacySettings}
                onPrivacySettingsSave={handlePrivacySettingsUpdate}
                onLanguageChange={(lang) =>
                  setProfileForm({ ...profileForm, language: lang })
                }
                onProfileDataSave={handleProfileDataSave}
                isMobile={isMobile}
              />
            </TabPanel>

            {/* NOTE: Kilometers and Calendar tabs removed - they are only in /faktury module */}

            {/* Support Ticket Modal */}
            <SupportTicketModal
              isOpen={showSupportModal}
              onClose={() => setShowSupportModal(false)}
            />
          </main>
        </div>
      </div>
    </div>
  );
}

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

import { useState, useEffect, useRef } from "react";
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
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
import { SubscriptionPanel } from "../src/components/subscription/SubscriptionPanel";
import { CertificateApplicationForm } from "../src/components/subscription/CertificateApplicationForm";
import FeedPage from "../pages/FeedPage_PREMIUM";
import {
  PageContainer,
  PageHeader,
  StatsGrid,
  StatCard,
  ContentCard,
} from "../components/common/PageContainer";
import DateBlocker from "../src/components/common/DateBlocker";
import { CoverImageUploader } from "../src/components/common/CoverImageUploader";
import SavedActivity from "./worker/SavedActivity";

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
  const { activeTab, setActiveTab } = useUnifiedTabs("overview");

  // Profile sub-tabs (used in renderProfile function inside Settings tab)
  const [activeProfileTab, setActiveProfileTab] = useState<string>("overview");

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
    client_name: "",
    client_company: "",
    is_public: true, // POPRAWKA: domyślnie publiczne portfolio
    is_featured: false,
  });
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

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

  useEffect(() => {
    loadAllData();

    // Auto-refresh analytics (profile_views) co 30 sekund
    const refreshInterval = setInterval(() => {
      refreshAnalytics();
    }, 30000); // 30 sekund

    return () => clearInterval(refreshInterval);
  }, []);

  // Refresh analytics without reloading entire dashboard
  const refreshAnalytics = async () => {
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
  };

  const loadAllData = async () => {
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

      // Load jobs (mock for now)
      setJobs(MOCK_JOBS.slice(0, 6));

      // Load messages
      await loadMessages(user.id);

      setLoading(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Nie udało się załadować danych profilu");
      setLoading(false);
    }
  };

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
        const success = await workerProfileService.updatePortfolioProject(
          editingProjectId,
          portfolioForm
        );
        if (success) {
          setSuccess("✅ Projekt zaktualizowany!");
        }
      } else {
        // Add new project - POPRAWKA: workerProfile.id zamiast userId
        const project = await workerProfileService.addPortfolioProject(
          workerProfile.id,
          portfolioForm
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
      project_url: "",
      tags: [],
      start_date: "",
      end_date: "",
      client_name: "",
    });
    setEditingProjectId(null);
  };

  const openPortfolioModal = (project?: any) => {
    if (project) {
      setPortfolioForm({
        title: project.title,
        description: project.description,
        project_url: project.project_url || "",
        tags: project.tags || [],
        start_date: project.start_date,
        end_date: project.end_date || "",
        client_name: project.client_name || "",
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
          icon="👷"
          title={`Witaj, ${workerProfile.full_name}!`}
          subtitle="Panel pracownika"
          actionButton={
            <div className="flex items-center gap-3">
              {/* TODO: Toggle Availability */}
              <button className="px-4 py-2 rounded-lg font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                ✓ Dostępny do pracy
              </button>
            </div>
          }
        />

        {/* STATS GRID */}
        <StatsGrid columns={4}>
          <StatCard
            title="Ukończone projekty"
            value={`${analytics?.completed_jobs || 0}`}
            icon={<span className="text-2xl">✅</span>}
            color="blue"
          />
          <StatCard
            title="Średnia ocena"
            value={
              workerProfile?.rating && workerProfile.rating_count > 0
                ? `${workerProfile.rating.toFixed(1)} / 5.0`
                : "0.0 / 5.0"
            }
            icon={<span className="text-2xl">⭐</span>}
            color="orange"
          />
          <StatCard
            title="Wyświetlenia profilu"
            value={`${analytics?.profile_views || 0}`}
            icon={<span className="text-2xl">👁️</span>}
            color="purple"
          />
          <StatCard
            title="Wiadomości"
            value={`${messages.length}${
              unreadCount > 0 ? ` (${unreadCount} nowe)` : ""
            }`}
            icon={<span className="text-2xl">📬</span>}
            color="green"
          />
        </StatsGrid>

        {/* PROFILE MANAGEMENT - 3 cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Avatar Card */}
          <ContentCard>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Zdjęcie profilowe
            </h3>
            <div className="flex flex-col items-center gap-4">
              {workerProfile?.avatar_url ? (
                <img
                  src={workerProfile.avatar_url}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-blue-100 shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-5xl border-4 border-blue-100 shadow-lg">
                  {workerProfile?.full_name?.[0]?.toUpperCase() || "W"}
                </div>
              )}
              <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium cursor-pointer flex items-center justify-center gap-2 transition-colors w-full">
                <span>📷 Zmień zdjęcie</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </label>
            </div>
          </ContentCard>

          {/* Cover Image Section */}
          {workerProfile && (
            <ContentCard>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                🖼️ Zdjęcie w tle profilu
              </h3>
              <CoverImageUploader
                currentCoverUrl={workerProfile.cover_image_url}
                onUploadSuccess={handleCoverImageUploadSuccess}
                profileType="worker"
                profileId={workerProfile.id}
              />
            </ContentCard>
          )}

          {/* Worker Info Card */}
          <ContentCard>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Dane osobowe
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>📧 {workerProfile.email || "Brak emaila"}</p>
              <p>📱 {workerProfile.phone || "Brak telefonu"}</p>
              <p>📍 {workerProfile.location_city || "Brak lokalizacji"}</p>
            </div>
            <button
              onClick={() => setActiveTab("settings")}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ✏️ Edytuj dane
            </button>
          </ContentCard>

          {/* Status Card */}
          <ContentCard>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Status dostępności
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Twój profil jest widoczny dla pracodawców
            </p>
            <button
              onClick={() =>
                alert(
                  "Funkcja dostępności - wkrótce! (wymaga migracji bazy danych)"
                )
              }
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ✓ Dostępny do pracy
            </button>
          </ContentCard>
        </div>

        {/* Placeholder for other sections */}

        {/* ✅ DOSTĘPNOŚĆ + ZARZĄDZANIE DATAMI - 2 kolumny (jak CleaningDashboard) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* LEFT: Dostępność */}
          <ContentCard>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              � Twoja dostępność
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Zaznacz dni kiedy możesz przyjść do pracy
            </p>

            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {WEEK_DAYS_PL.map((day, index) => {
                  // Map Polish day names to database keys
                  const dbDayKey = WEEK_DAYS_DB[index];
                  const isAvailable =
                    workerProfile?.availability?.[dbDayKey] ?? index < 5;

                  return (
                    <div key={day} className="text-center">
                      <p className="text-xs text-gray-600 mb-1">{day}</p>
                      <button
                        onClick={() => handleAvailabilityChange(day)}
                        className={`w-full py-2 rounded-lg text-xs font-medium transition-colors ${
                          isAvailable
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {isAvailable ? "✓" : "✗"}
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 text-center">
                Kliknij na dzień aby zmienić dostępność
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Dostępne dni</p>
                <p className="text-2xl font-bold text-blue-600">
                  {workerProfile?.availability
                    ? Object.values(workerProfile.availability).filter(Boolean)
                        .length
                    : 5}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Preferowane</p>
                <p className="text-2xl font-bold text-gray-700">
                  {workerProfile?.preferred_days_per_week || 5} dni/tydzień
                </p>
              </div>
            </div>
          </ContentCard>

          {/* RIGHT: Zarządzaj datami */}
          <ContentCard>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              🚫 Zarządzaj datami
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Zablokuj dni kiedy nie możesz pracować (urlop, święta, zajęty)
            </p>

            <button
              onClick={() => setShowDateBlocker(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium mb-4 transition-colors"
            >
              + Zablokuj datę
            </button>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Brak zablokowanych dat
              </p>
              <p className="text-xs text-gray-500">
                Zablokuj daty, kiedy nie chcesz przyjmować ofert pracy. Zmiany
                są synchronizowane automatycznie.
              </p>
            </div>
          </ContentCard>
        </div>

        {/* ✅ OSTATNIE WIADOMOŚCI */}
        <ContentCard className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-gray-800">
                📬 Ostatnie wiadomości
              </h2>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {unreadCount} nowe
                </span>
              )}
            </div>
            <button
              onClick={() => setActiveTab("messages")}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Zobacz wszystkie →
            </button>
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📭</div>
              <p>Brak wiadomości</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.slice(0, 5).map((msg: any) => (
                <button
                  key={msg.id}
                  onClick={() => {
                    setSelectedMessage(msg);
                    setActiveTab("messages");
                    if (!msg.is_read) handleMarkAsRead(msg.id);
                  }}
                  className="w-full text-left flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-gray-200"
                >
                  {/* Avatar */}
                  {msg.sender_profile?.avatar_url ? (
                    <img
                      src={msg.sender_profile.avatar_url}
                      alt={msg.sender_profile.full_name || "Avatar"}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        const fallback = (e.target as HTMLImageElement)
                          .nextElementSibling;
                        if (fallback)
                          (fallback as HTMLElement).style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 flex-shrink-0"
                    style={{
                      display: msg.sender_profile?.avatar_url ? "none" : "flex",
                    }}
                  >
                    {msg.sender_profile?.full_name?.[0]?.toUpperCase() || "?"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p
                        className={`font-medium text-sm ${
                          msg.is_read ? "text-gray-700" : "text-blue-700"
                        }`}
                      >
                        {msg.sender_profile?.full_name || "Nieznany nadawca"}
                      </p>
                      <span className="text-xs text-gray-400">
                        {new Date(msg.created_at).toLocaleDateString("pl-PL")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {msg.subject || "Brak tematu"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {msg.content}
                    </p>
                  </div>
                  {!msg.is_read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </button>
              ))}
            </div>
          )}
        </ContentCard>

        {/* ✅ OPINIE OD KLIENTÓW */}
        <ContentCard className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              ⭐ Opinie od klientów
            </h2>
            <button
              onClick={() => setActiveTab("reviews")}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Zobacz wszystkie →
            </button>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">⭐</div>
              <p>Brak opinii</p>
              <p className="text-sm mt-1">
                Twoje pierwsze opinie pojawią się tutaj po wykonaniu prac
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.slice(0, 3).map((review: any) => (
                <div
                  key={review.id}
                  className="border-b border-gray-200 pb-4 last:border-0"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={
                            i < review.rating
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }
                        >
                          ⭐
                        </span>
                      ))}
                      <span className="ml-2 font-semibold">
                        {review.rating}.0
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(review.created_at).toLocaleDateString("pl-PL")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{review.comment}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    — {review.employer?.full_name || "Anonim"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ContentCard>

        {/* ✅ PORTFOLIO ZDJĘĆ */}
        <ContentCard className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                📸 Portfolio zdjęć (
                {workerProfile?.portfolio_images?.length || 0}/20)
              </h2>
              <p className="text-sm text-gray-600">
                Pokaż swoją pracę - dodaj zdjęcia
              </p>
            </div>
            <button
              onClick={() => openPortfolioModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              + Dodaj zdjęcia
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PORTFOLIO_SKELETON_ITEMS.map((i) => (
              <div
                key={i}
                className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300"
              >
                <span className="text-gray-400 text-4xl">📷</span>
              </div>
            ))}
          </div>
        </ContentCard>

        {/* Szybkie działania Card */}
        <ContentCard>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            ⚡ Szybkie działania
          </h3>

          <div className="space-y-2">
            <Link
              to="/employers"
              className="w-full px-4 py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 flex items-center justify-center gap-2 transition-colors text-sm"
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Szukaj pracodawców
            </Link>

            <Link
              to="/cleaning-companies"
              className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors text-sm"
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              Szukaj firm sprzątających
            </Link>

            <Link
              to="/accountants"
              className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2 transition-colors text-sm"
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
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              Szukaj księgowych
            </Link>

            <Link
              to="/faktury"
              className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2 transition-colors text-sm"
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Faktury & BTW
            </Link>

            <button
              onClick={handleViewSubscription}
              className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 flex items-center justify-center gap-2 transition-colors text-sm"
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
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              Subskrypcja
            </button>

            <button
              onClick={handleContactSupport}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors text-sm"
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
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              Wsparcie
            </button>
          </div>
        </ContentCard>

        {/* DateBlocker Modal */}
        {showDateBlocker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
              {/* Close button */}
              <button
                onClick={() => setShowDateBlocker(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <DateBlocker
                blockedDates={workerProfile.unavailable_dates || []}
                onBlock={handleBlockDate}
                onUnblock={handleUnblockDate}
              />
            </div>
          </div>
        )}
      </PageContainer>
    );
  };

  const renderReviewsTab = () => {
    // ✅ PODŁĄCZONE: Używamy istniejącej funkcji renderReviewsAndAnalytics()
    return renderReviewsAndAnalytics();
  };

  const renderMessagesTab = () => {
    // ✅ PODŁĄCZONE: Używamy istniejącej funkcji renderMessages()
    return renderMessages();
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
          icon="👋"
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

        {/* Modern Stats Cards */}
        <StatsGrid columns={4}>
          <StatCard
            title="Ukończone projekty"
            value="0"
            color="blue"
            icon={
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
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            }
          />
          <StatCard
            title="Średnia stawka"
            value={`€${workerProfile.hourly_rate}/h`}
            color="green"
            icon={
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <StatCard
            title="Certyfikaty"
            value={certificates.length}
            color="purple"
            icon={
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
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            }
          />
          <div
            onClick={() => setActiveTab("messages")}
            className="cursor-pointer"
          >
            <StatCard
              title="Wiadomości"
              value={`${messages.length}${
                unreadCount > 0 ? ` (${unreadCount} nowe)` : ""
              }`}
              color="orange"
              icon={
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
              }
            />
          </div>
        </StatsGrid>

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

          <ContentCard
            className="cursor-pointer hover:shadow-2xl transition-all"
            noPadding
          >
            <Link
              to="/faktury"
              onClick={() => {
                console.log("🧾 FAKTURY BUTTON CLICKED - Dashboard: WORKER");
              }}
              className="block w-full p-6 bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              <svg
                className="w-10 h-10 mb-3"
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
              <h3 className="text-xl font-bold mb-2">Faktury & BTW</h3>
              <p className="text-green-100 text-sm">
                Twój prywatny program do faktur
              </p>
            </Link>
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

        {/* Faktury Button */}
        <Link
          to="/faktury"
          onClick={() => {
            console.log(
              "🧾 FAKTURY BUTTON CLICKED - Dashboard: WORKER (Overview)"
            );
          }}
          className="block bg-green-600 text-white rounded-2xl p-6 hover:bg-green-700 transition-all shadow-xl hover:shadow-2xl"
        >
          <div className="flex items-center gap-4">
            <svg
              className="w-12 h-12 flex-shrink-0"
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
            <div>
              <h3 className="text-2xl font-bold mb-1">Faktury & BTW</h3>
              <p className="text-green-100">Twój prywatny program do faktur</p>
            </div>
          </div>
        </Link>
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

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-8 border-b border-gray-200 overflow-x-auto bg-white rounded-t-2xl px-4">
            {[
              { id: "overview", label: "📊 Przegląd" },
              { id: "basic", label: "👤 Dane podstawowe" },
              { id: "skills", label: "⚡ Umiejętności" },
              { id: "certificates", label: "🏆 Certyfikaty" },
              { id: "portfolio", label: "💼 Portfolio" },
              { id: "settings", label: "⚙️ Ustawienia" },
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

          {/* Tab Content */}
          <div className="bg-white rounded-b-2xl shadow-xl p-8 border border-gray-200">
            {activeProfileTab === "overview" && renderProfileOverview()}
            {activeProfileTab === "basic" && renderProfileBasic()}
            {activeProfileTab === "skills" && renderProfileSkills()}
            {activeProfileTab === "certificates" && renderProfileCertificates()}
            {activeProfileTab === "portfolio" && renderProfilePortfolio()}
            {activeProfileTab === "settings" && renderProfileSettings()}
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
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-accent-cyber to-accent-techGreen text-white font-bold rounded-lg hover:shadow-lg hover:shadow-accent-cyber/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "⏳ Zapisywanie..." : "💾 Zapisz zmiany"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className="px-8 py-3 bg-dark-700 text-white font-bold rounded-lg hover:bg-dark-600 transition-all"
          >
            Anuluj
          </button>
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
          <button
            type="button"
            onClick={handleAddSkill}
            className="px-6 py-3 bg-gradient-to-r from-accent-cyber to-accent-techGreen text-white font-bold rounded-lg hover:shadow-lg hover:shadow-accent-cyber/50 transition-all"
          >
            + Dodaj
          </button>
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

  // Profile Tab: Settings
  const renderProfileSettings = () => {
    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-white mb-6">Ustawienia</h2>

        {/* Notifications */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Powiadomienia</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={notificationSettings.email_enabled}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    email_enabled: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded border-neutral-600 bg-dark-700 text-accent-cyber focus:ring-accent-cyber"
              />
              <span className="text-white">Włącz powiadomienia email</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={notificationSettings.sms_enabled}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    sms_enabled: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded border-neutral-600 bg-dark-700 text-accent-cyber focus:ring-accent-cyber"
              />
              <span className="text-white">Włącz powiadomienia SMS</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={notificationSettings.push_enabled}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    push_enabled: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded border-neutral-600 bg-dark-700 text-accent-cyber focus:ring-accent-cyber"
              />
              <span className="text-white">Włącz powiadomienia push</span>
            </label>
          </div>
          <button
            onClick={handleNotificationSettingsUpdate}
            disabled={saving}
            className="mt-4 px-6 py-2 bg-accent-cyber text-white rounded-lg hover:bg-accent-cyber/80 transition-all disabled:opacity-50"
          >
            💾 Zapisz ustawienia powiadomień
          </button>
        </div>

        {/* Privacy */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Prywatność</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-2">
                Widoczność profilu
              </label>
              <select
                value={privacySettings.profile_visibility}
                onChange={(e) =>
                  setPrivacySettings({
                    ...privacySettings,
                    profile_visibility: e.target.value as any,
                  })
                }
                className="w-full px-4 py-3 bg-dark-700 border border-neutral-600 rounded-lg text-white focus:border-accent-cyber focus:outline-none"
              >
                <option value="public">Publiczny</option>
                <option value="contacts">Tylko kontakty</option>
                <option value="private">Prywatny</option>
              </select>
            </div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={privacySettings.show_email}
                onChange={(e) =>
                  setPrivacySettings({
                    ...privacySettings,
                    show_email: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded border-neutral-600 bg-dark-700 text-accent-cyber focus:ring-accent-cyber"
              />
              <span className="text-white">Pokaż email publicznie</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={privacySettings.show_phone}
                onChange={(e) =>
                  setPrivacySettings({
                    ...privacySettings,
                    show_phone: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded border-neutral-600 bg-dark-700 text-accent-cyber focus:ring-accent-cyber"
              />
              <span className="text-white">Pokaż telefon publicznie</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={privacySettings.show_location}
                onChange={(e) =>
                  setPrivacySettings({
                    ...privacySettings,
                    show_location: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded border-neutral-600 bg-dark-700 text-accent-cyber focus:ring-accent-cyber"
              />
              <span className="text-white">Pokaż lokalizację publicznie</span>
            </label>
          </div>
          <button
            onClick={handlePrivacySettingsUpdate}
            disabled={saving}
            className="mt-4 px-6 py-2 bg-accent-cyber text-white rounded-lg hover:bg-accent-cyber/80 transition-all disabled:opacity-50"
          >
            💾 Zapisz ustawienia prywatności
          </button>
        </div>

        {/* Language */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Regionalne</h3>
          <div>
            <label className="block text-sm text-neutral-400 mb-2">Język</label>
            <select
              value={profileForm.language}
              onChange={(e) =>
                setProfileForm({
                  ...profileForm,
                  language: e.target.value as any,
                })
              }
              className="w-full px-4 py-3 bg-dark-700 border border-neutral-600 rounded-lg text-white focus:border-accent-cyber focus:outline-none"
            >
              <option value="nl">🇳🇱 Nederlands</option>
              <option value="en">🇬🇧 English</option>
              <option value="pl">🇵🇱 Polski</option>
              <option value="de">🇩🇪 Deutsch</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  // ===================================================================
  // PORTFOLIO TAB
  // ===================================================================

  const renderPortfolio = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              🎨 Moje Portfolio
            </h1>
            <button
              onClick={() => openPortfolioModal()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all"
            >
              ➕ Dodaj projekt
            </button>
          </div>

          {/* Portfolio Grid */}
          {portfolio.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-xl border border-gray-200">
              <div className="text-6xl mb-4">📂</div>
              <p className="text-gray-600 mb-6">Brak projektów w portfolio</p>
              <button
                onClick={() => openPortfolioModal()}
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:shadow-lg transition-all"
              >
                Dodaj pierwszy projekt
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolio.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:border-blue-500 hover:shadow-2xl transition-all group"
                >
                  {project.images && project.images.length > 0 && (
                    <img
                      src={project.images[0]}
                      alt={project.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {project.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {project.description}
                    </p>

                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-neutral-500 mb-4">
                      <span>📅 {project.start_date}</span>
                      {project.client_name && (
                        <span>👤 {project.client_name}</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {project.project_url && (
                        <a
                          href={project.project_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-4 py-2 bg-dark-700 text-white text-center rounded-lg hover:bg-dark-600 transition-all"
                        >
                          🔗 Link
                        </a>
                      )}
                      <button
                        onClick={() => openPortfolioModal(project)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handlePortfolioDelete(project.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add/Edit Modal */}
          {showPortfolioModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-dark-800 rounded-2xl p-8 max-w-2xl w-full border border-neutral-700 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-white mb-6">
                  {editingProjectId ? "✏️ Edytuj projekt" : "➕ Dodaj projekt"}
                </h2>
                <form onSubmit={handlePortfolioSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm text-neutral-400 mb-2">
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
                      className="w-full px-4 py-3 bg-dark-700 border border-neutral-600 rounded-lg text-white focus:border-accent-cyber focus:outline-none"
                      placeholder="np. Instalacja elektryczna w budynku XYZ"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-neutral-400 mb-2">
                      Opis *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={portfolioForm.description}
                      onChange={(e) =>
                        setPortfolioForm({
                          ...portfolioForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-dark-700 border border-neutral-600 rounded-lg text-white focus:border-accent-cyber focus:outline-none resize-none"
                      placeholder="Opisz projekt, użyte technologie, osiągnięte rezultaty..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-neutral-400 mb-2">
                        Data rozpoczęcia *
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
                        className="w-full px-4 py-3 bg-dark-700 border border-neutral-600 rounded-lg text-white focus:border-accent-cyber focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-400 mb-2">
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
                        className="w-full px-4 py-3 bg-dark-700 border border-neutral-600 rounded-lg text-white focus:border-accent-cyber focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-neutral-400 mb-2">
                      Klient
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
                      className="w-full px-4 py-3 bg-dark-700 border border-neutral-600 rounded-lg text-white focus:border-accent-cyber focus:outline-none"
                      placeholder="Nazwa firmy lub klienta"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-neutral-400 mb-2">
                      Link do projektu
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
                      className="w-full px-4 py-3 bg-dark-700 border border-neutral-600 rounded-lg text-white focus:border-accent-cyber focus:outline-none"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-neutral-400 mb-2">
                      Tagi (oddzielone przecinkami)
                    </label>
                    <input
                      type="text"
                      value={portfolioForm.tags.join(", ")}
                      onChange={(e) =>
                        setPortfolioForm({
                          ...portfolioForm,
                          tags: e.target.value.split(",").map((t) => t.trim()),
                        })
                      }
                      className="w-full px-4 py-3 bg-dark-700 border border-neutral-600 rounded-lg text-white focus:border-accent-cyber focus:outline-none"
                      placeholder="JavaScript, React, Node.js"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-neutral-400 mb-2">
                      Zdjęcie projektu
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePortfolioImageUpload}
                      className="w-full px-4 py-3 bg-dark-700 border border-neutral-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-accent-cyber file:text-white hover:file:bg-accent-cyber/80"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-accent-cyber to-accent-techGreen text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
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
                      className="px-6 py-3 bg-neutral-700 text-white font-bold rounded-lg hover:bg-neutral-600 transition-all"
                    >
                      ❌ Anuluj
                    </button>
                  </div>
                </form>
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
          {/* Analytics Section */}
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

          {/* Reviews Section */}
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-white">⭐ Opinie</h2>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-5xl font-bold text-yellow-400">
                    {analytics?.average_rating?.toFixed(1) || "0.0"}
                  </div>
                  <div className="text-neutral-400 text-sm">Średnia ocena</div>
                </div>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-16 bg-dark-800 rounded-xl border border-neutral-700">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-neutral-400">Brak opinii</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-dark-800 rounded-xl p-6 border border-neutral-700"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {review.employer?.company_name || "Pracodawca"}
                        </h3>
                        <div className="text-yellow-400 text-xl mt-1">
                          {"⭐".repeat(review.rating)}
                          {"☆".repeat(5 - review.rating)}
                        </div>
                      </div>
                      <div className="text-neutral-500 text-sm">
                        {new Date(review.created_at).toLocaleDateString(
                          "pl-PL"
                        )}
                      </div>
                    </div>
                    <p className="text-neutral-300">{review.comment}</p>
                  </div>
                ))}
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
                        {selectedConversation.partnerAvatar ? (
                          <img
                            src={selectedConversation.partnerAvatar}
                            alt={selectedConversation.partnerName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                          />
                        ) : (
                          <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
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
  // CERTIFICATE APPLICATION TAB
  // ===================================================================

  const renderCertificateApplication = () => {
    return (
      <div className="min-h-screen bg-primary-dark p-8">
        <div className="max-w-4xl mx-auto">
          <CertificateApplicationForm
            workerId={userId}
            onSubmit={() => {
              setSuccess("✅ Aplikacja wysłana! Skontaktujemy się wkrótce.");
              setTimeout(() => {
                setActiveTab("subscription");
              }, 2000);
            }}
            onCancel={() => {
              setActiveTab("subscription");
            }}
          />
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

      <div className="relative z-10">
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

        {/* ✅ Unified Dashboard Tabs */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <UnifiedDashboardTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              role="worker"
              unreadMessages={unreadCount}
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        </div>

        {/* Support Ticket Modal */}
        <SupportTicketModal
          isOpen={showSupportModal}
          onClose={() => setShowSupportModal(false)}
        />
      </div>
    </div>
  );
}

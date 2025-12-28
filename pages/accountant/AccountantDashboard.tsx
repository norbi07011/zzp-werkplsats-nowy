import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import { useSidebar } from "../../contexts/SidebarContext";
import { useIsMobile } from "../../src/hooks/useIsMobile";
import { SupportTicketModal } from "../../src/components/SupportTicketModal";
import { AccountantSettingsPanel } from "../../components/settings/AccountantSettingsPanel";
import { AccountantServicesManager } from "../../src/components/accountant/AccountantServicesManager";
import {
  AccountantTeamDashboard,
  PendingInvitations,
} from "../../src/modules/accountant-team";
import { geocodeAddress } from "../../services/geocoding";
import { getAccountantReviews } from "../../src/services/accountantReviewService";
import {
  getAccountantByProfileId,
  updateAccountantRating,
  saveAvailability,
  getAvailability,
  addUnavailableDate,
  getUnavailableDates,
  removeUnavailableDate,
  type Accountant,
} from "../../src/services/accountantService";
import { supabase } from "../../src/lib/supabase";
import { DashboardHeader } from "../../components/DashboardComponents";
import { ProjectCommunicationManager } from "../../components/ProjectCommunicationManager";
import { UpcomingEventsCard } from "../../components/UpcomingEventsCard";
import FeedPage from "../../pages/FeedPage_PREMIUM";
import AvailabilityCalendar from "../../src/components/common/AvailabilityCalendar";
import DateBlocker from "../../src/components/common/DateBlocker";
import { CoverImageUploader } from "../../src/components/common/CoverImageUploader";
import { Animated3DProfileBackground } from "../../components/Animated3DProfileBackground";
import { TypewriterAnimation } from "../../components/TypewriterAnimation";
import {
  UnifiedDashboardTabs,
  useUnifiedTabs,
  TabPanel,
  type UnifiedTab,
} from "../../components/UnifiedDashboardTabs";
import { DashboardSidebar } from "../../components/DashboardSidebar";
import { NavigationDrawer } from "../../components/NavigationDrawer";
import { QuickActionsCard } from "../../components/QuickActionsCard";
import {
  ProfileNavigationDrawer,
  type ProfileSubTab,
} from "../../components/ProfileNavigationDrawer";
import type { WeeklyAvailability, UnavailableDate } from "../../types";
import {
  FileText,
  Briefcase,
  ClipboardList,
  User,
  Users,
  Settings,
  Bell,
  Star,
  Calendar,
  MapPin,
  ClockIcon,
  Eye,
} from "../../components/icons";
import { StatChipsGrid, StatChipItem } from "../../components/StatChips";
import MyPosts from "./MyPosts";
import SavedActivity from "./SavedActivity";
import { MyProfilePreview } from "../../components/profile/MyProfilePreview";
import AccountantSubscriptionPage from "./AccountantSubscriptionPage";
import {
  getAllSavedProfiles,
  removeSavedProfile,
  type SavedProfile,
  type EntityType,
} from "../../services/savedProfilesService";
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
// HELPER FUNCTIONS - MESSENGER CHAT
// ===================================================================

const groupMessagesByConversation = (
  messages: Message[],
  currentUserId: string
): Conversation[] => {
  const conversationMap = new Map<string, Conversation>();

  messages.forEach((msg) => {
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

    if (!msg.is_read && msg.recipient_id === currentUserId) {
      conversation.unreadCount++;
    }

    if (
      new Date(msg.created_at) > new Date(conversation.lastMessage.created_at)
    ) {
      conversation.lastMessage = msg;
    }
  });

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

export default function AccountantDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Unified tabs state
  const { activeTab, setActiveTab } = useUnifiedTabs("tablica");
  const { isSidebarOpen, closeSidebar } = useSidebar();

  // Profile sub-navigation state (drugi poziom menu dla tabu Profile)
  const [profileSubTab, setProfileSubTab] = useState<
    "overview" | "edit" | "team" | "stats" | "availability"
  >("overview");
  const [isProfileSidebarOpen, setIsProfileSidebarOpen] = useState(false);

  const [accountant, setAccountant] = useState<Accountant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCommunicationOpen, setIsCommunicationOpen] = useState(false);
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
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // OLD Messages state (będzie zastąpione)
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [replyContent, setReplyContent] = useState("");
  const [saving, setSaving] = useState(false);

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

  // Saved Profiles State
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [savedProfilesFilter, setSavedProfilesFilter] = useState<
    "all" | EntityType
  >("all");

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<"all" | 1 | 2 | 3 | 4 | 5>(
    "all"
  );
  const [reviewSort, setReviewSort] = useState<
    "newest" | "oldest" | "highest" | "lowest"
  >("newest");
  const [showAllReviews, setShowAllReviews] = useState(false);

  const [editForm, setEditForm] = useState({
    full_name: "",
    company_name: "",
    email: "",
    phone: "",
    kvk_number: "",
    btw_number: "",
    license_number: "",
    city: "",
    address: "",
    postal_code: "",
    country: "Nederland",
    bio: "",
    specializations: [] as string[],
    languages: ["Nederlands"] as string[],
    website: "",
    years_experience: 0,
    latitude: null as number | null,
    longitude: null as number | null,
  });

  // Settings state for AccountantSettingsPanel
  const [notificationSettings, setNotificationSettings] = useState({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    client_alerts: true,
    message_alerts: true,
    review_alerts: true,
    form_submission_alerts: true,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: "public" as "public" | "contacts" | "private",
    show_email: true,
    show_phone: true,
    show_address: false,
    allow_messages: true,
  });

  const [settingsSaving, setSettingsSaving] = useState(false);

  // =====================================================
  // PORTFOLIO STATE
  // =====================================================
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

  useEffect(() => {
    if (user?.id) {
      loadAccountant();
      loadMessages(user.id);
      loadReactions(user.id);

      // Auto-refresh profile_views co 30 sekund
      const refreshInterval = setInterval(() => {
        refreshProfileViews();
      }, 30000); // 30 sekund

      return () => clearInterval(refreshInterval);
    }
  }, [user?.id]);

  // Refresh profile_views counter without reloading entire profile
  const refreshProfileViews = async () => {
    if (!user) return;

    try {
      console.log(
        "🔄 [ACCOUNTANT-DASH] Refreshing profile_views for user:",
        user.id
      );
      const data = await getAccountantByProfileId(user.id);
      if (data?.profile_views !== undefined) {
        setAccountant((prev) =>
          prev ? { ...prev, profile_views: data.profile_views } : prev
        );
        console.log(
          "✅ [ACCOUNTANT-DASH] Profile views updated:",
          data.profile_views
        );
      }
    } catch (error) {
      console.error(
        "❌ [ACCOUNTANT-DASH] Error refreshing profile views:",
        error
      );
    }
  };

  // Load reviews for this accountant
  const loadReviews = async (accountantId: string) => {
    try {
      setReviewsLoading(true);
      const reviewsResult = await getAccountantReviews(accountantId);
      const reviewsData = reviewsResult.success
        ? reviewsResult.reviews || []
        : [];
      setReviews(reviewsData);
      console.log(
        "[ACCOUNTANT-DASH] 🔍 Reviews data from accountantReviewService:",
        {
          success: reviewsResult.success,
          count: reviewsData.length,
          first_review: reviewsData[0],
        }
      );
    } catch (error) {
      console.error("❌ Error loading reviews:", error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Load messages from database
  // ===================================================================
  // LOAD MESSAGES - BIDIRECTIONAL QUERY WITH PROFILES
  // ===================================================================
  const loadMessages = async (userId: string) => {
    try {
      // Bidirectional query: both sent and received messages
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
          sender:profiles!messages_sender_id_fkey(
            id,
            full_name,
            avatar_url
          ),
          recipient:profiles!messages_recipient_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `
        )
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("📬 MESSAGES LOADED:", {
        count: data?.length || 0,
        userId,
        sample: data?.[0],
      });

      // Map to Message[] format
      const typedMessages: Message[] =
        data?.map((msg: any) => ({
          id: msg.id,
          subject: msg.subject || "",
          content: msg.content || "",
          created_at: msg.created_at,
          is_read: msg.is_read,
          sender_id: msg.sender_id,
          recipient_id: msg.recipient_id,
          sender: {
            id: msg.sender?.id || "",
            full_name: msg.sender?.full_name || "Unknown",
            avatar_url: msg.sender?.avatar_url || undefined,
          },
          recipient: msg.recipient
            ? {
                id: msg.recipient.id,
                full_name: msg.recipient.full_name || "Unknown",
                avatar_url: msg.recipient.avatar_url || undefined,
              }
            : undefined,
          attachments: msg.attachments || [],
        })) || [];

      console.log("✅ TYPED MESSAGES:", {
        count: typedMessages.length,
        sample: typedMessages[0],
      });

      // Group into conversations
      const grouped = groupMessagesByConversation(typedMessages, userId);
      console.log("💬 CONVERSATIONS GROUPED:", {
        count: grouped.length,
        conversations: grouped.map((c) => ({
          partner: c.partnerName,
          unread: c.unreadCount,
          lastMsg: c.lastMessage.content.substring(0, 50),
        })),
      });

      setConversations(grouped);
      setMessages(typedMessages);

      // Count total unread
      const totalUnread = typedMessages.filter(
        (msg) => msg.recipient_id === userId && !msg.is_read
      ).length;
      setUnreadCount(totalUnread);

      console.log("🔔 UNREAD COUNT:", totalUnread);
    } catch (err) {
      console.error("❌ ERROR LOADING MESSAGES:", err);
      setMessages([]);
      setConversations([]);
      setUnreadCount(0);
    }
  };

  // Load reactions (all social interactions: reactions, comments, reviews)
  const loadReactions = async (userId: string) => {
    try {
      // WHY: Using as any because notifications table is not yet in database.types.ts
      const { data, error } = await (supabase.from("notifications") as any)
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

  // ===================================================================
  // MESSENGER ACTION HANDLERS
  // ===================================================================

  // Select conversation and mark as read
  const handleSelectConversation = async (conversation: Conversation) => {
    console.log("🔍 SELECTING CONVERSATION:", {
      partner: conversation.partnerName,
      unread: conversation.unreadCount,
    });

    setSelectedConversation(conversation);

    // Mark all messages in this conversation as read
    if (conversation.unreadCount > 0 && user?.id) {
      await handleMarkConversationAsRead(conversation.partnerId);
    }
  };

  // Mark all messages in conversation as read
  const handleMarkConversationAsRead = async (partnerId: string) => {
    if (!user?.id) return;

    try {
      const messagesToMark = conversations
        .find((c) => c.partnerId === partnerId)
        ?.messages.filter((msg) => msg.recipient_id === user.id && !msg.is_read)
        .map((msg) => msg.id);

      if (!messagesToMark || messagesToMark.length === 0) return;

      console.log("✅ MARKING AS READ:", { count: messagesToMark.length });

      const { error } = await (supabase as any)
        .from("messages")
        .update({ is_read: true })
        .in("id", messagesToMark);

      if (error) throw error;

      // Update local state
      await loadMessages(user.id);
    } catch (err) {
      console.error("❌ ERROR MARKING AS READ:", err);
    }
  };

  // Send new message
  const handleSendMessage = async () => {
    if (!selectedConversation || !messageInput.trim() || !user?.id) return;

    const currentPartnerId = selectedConversation.partnerId; // Remember partner

    try {
      console.log("📤 SENDING MESSAGE:", {
        to: selectedConversation.partnerName,
        content: messageInput.substring(0, 50),
      });

      const { error } = await (supabase as any).from("messages").insert({
        sender_id: user.id,
        recipient_id: selectedConversation.partnerId,
        subject: "Chat message",
        content: messageInput.trim(),
        is_read: false,
        message_type: "direct",
      });

      if (error) throw error;

      console.log("✅ MESSAGE SENT!");

      setMessageInput("");
      setShowEmojiPicker(false);

      // Reload messages
      await loadMessages(user.id);

      // 🔥 FIX: Auto-refresh selectedConversation to update chat
      setTimeout(() => {
        const updatedConversation = conversations.find(
          (conv) => conv.partnerId === currentPartnerId
        );
        if (updatedConversation) {
          console.log("🔄 AUTO-REFRESHING CHAT:", {
            partner: updatedConversation.partnerName,
            newMessageCount: updatedConversation.messages.length,
          });
          setSelectedConversation(updatedConversation);
        }
      }, 100); // Wait 100ms for state to update
    } catch (err) {
      console.error("❌ ERROR SENDING MESSAGE:", err);
      alert("Błąd podczas wysyłania wiadomości");
    }
  };

  // Add emoji to message input
  const addEmojiToMessage = (emoji: string) => {
    setMessageInput((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Upload file (placeholder - implement Supabase storage if needed)
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      // TODO: Implement Supabase storage upload
      console.log("📎 FILE SELECTED:", file.name);
      alert("Upload plików będzie wkrótce dostępny!");
    } catch (err) {
      console.error("❌ ERROR UPLOADING FILE:", err);
    } finally {
      setUploadingFile(false);
    }
  };

  // ===================================================================
  // OLD MESSAGE HANDLERS (will be deprecated)
  // ===================================================================

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const { error } = await (supabase as any)
        .from("messages")
        .update({ is_read: true })
        .eq("id", messageId);

      if (error) throw error;

      // Update local state
      setMessages(
        messages.map((msg) =>
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking message as read:", err);
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyContent.trim() || !user) return;

    setSaving(true);
    try {
      const { error } = await (supabase as any).from("messages").insert({
        sender_id: user.id,
        recipient_id: selectedMessage.sender_id,
        subject: `Re: ${selectedMessage.subject}`,
        content: replyContent,
        is_read: false,
      });

      if (error) throw error;

      alert("Odpowiedź wysłana!");
      setReplyContent("");
      setSelectedMessage(null);

      // Reload messages
      if (user?.id) {
        loadMessages(user.id);
      }
    } catch (err) {
      console.error("Error sending reply:", err);
      alert("Błąd podczas wysyłania odpowiedzi");
    } finally {
      setSaving(false);
    }
  };

  const loadAccountant = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      const data = await getAccountantByProfileId(user.id);

      if (!data) {
        console.error("No accountant profile found");
        navigate("/");
        return;
      }

      console.log("✅ [DASHBOARD] Accountant loaded:", {
        id: data.id,
        profile_id: data.profile_id,
        profile_views: data.profile_views,
        full_name: data.full_name,
      });

      setAccountant(data);

      // Load reviews for this accountant
      await loadReviews(data.id);

      // Update rating stats in database (self-healing for any stale data)
      await updateAccountantRating(data.id);

      // Load availability and blocked dates
      const availData = await getAvailability(user.id);
      if (availData) {
        setAvailability({
          monday: availData.monday || false,
          tuesday: availData.tuesday || false,
          wednesday: availData.wednesday || false,
          thursday: availData.thursday || false,
          friday: availData.friday || false,
          saturday: availData.saturday || false,
          sunday: availData.sunday || false,
        });
      }

      const unavailDates = await getUnavailableDates(user.id);
      setBlockedDates(unavailDates || []);

      // Initialize edit form with current data
      setEditForm({
        full_name: data.full_name || "",
        company_name: data.company_name || "",
        email: data.email || "",
        phone: data.phone || "",
        kvk_number: data.kvk_number || "",
        btw_number: data.btw_number || "",
        license_number: data.license_number || "",
        city: data.city || "",
        address: data.address || "",
        postal_code: data.postal_code || "",
        country: data.country || "Nederland",
        bio: data.bio || "",
        specializations: data.specializations || [],
        languages: data.languages || ["Nederlands"],
        website: data.website || "",
        years_experience: data.years_experience || 0,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
      });

      // Load portfolio
      // WHY: Using as any because accountant_portfolio table is not yet in database.types.ts
      const { data: portfolioData, error: portfolioError } = await (
        supabase.from("accountant_portfolio") as any
      )
        .select("*")
        .eq("accountant_id", data.id)
        .order("created_at", { ascending: false });

      if (!portfolioError && portfolioData) {
        setPortfolio(portfolioData);
      }

      // Load saved profiles
      if (user) {
        try {
          const profiles = await getAllSavedProfiles(user.id);
          setSavedProfiles(profiles);
        } catch (err) {
          console.warn("[ACCOUNTANT-DASH] Could not load saved profiles:", err);
        }
      }
    } catch (error) {
      console.error("Error loading accountant:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityChange = async (
    newAvailability: WeeklyAvailability
  ) => {
    setAvailability(newAvailability);

    if (!user) return;

    // Save to database
    const result = await saveAvailability(user.id, newAvailability);

    if (result.success) {
      console.log("✅ Availability saved to database");
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accountant) return;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${accountant.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Update accountant profile
      await supabase
        .from("accountants")
        .update({ avatar_url: publicUrl })
        .eq("id", accountant.id);

      setAccountant({ ...accountant, avatar_url: publicUrl });
      console.log("✅ Avatar uploaded:", publicUrl);
    } catch (error) {
      console.error("❌ Error uploading avatar:", error);
      alert("Błąd podczas uploadu zdjęcia");
    }
  };

  const handleRemoveAvatar = async () => {
    if (!accountant?.avatar_url) return;

    if (!confirm("Czy na pewno chcesz usunąć zdjęcie profilowe?")) return;

    try {
      // Extract file path from URL
      const url = new URL(accountant.avatar_url);
      const filePath = url.pathname.split("/").slice(-2).join("/");

      // Delete from storage
      await supabase.storage.from("avatars").remove([filePath]);

      // Update database
      await supabase
        .from("accountants")
        .update({ avatar_url: null })
        .eq("id", accountant.id);

      setAccountant({ ...accountant, avatar_url: undefined });
      console.log("✅ Avatar removed");
    } catch (error) {
      console.error("❌ Error removing avatar:", error);
    }
  };

  const handleCoverImageUploadSuccess = async (url: string) => {
    if (!accountant) return;

    try {
      // Update database with new cover image URL
      const { error } = await supabase
        .from("accountants")
        .update({ cover_image_url: url })
        .eq("id", accountant.id);

      if (error) throw error;

      // Update local state
      setAccountant({ ...accountant, cover_image_url: url });
      console.log("✅ Cover image updated:", url);
    } catch (error) {
      console.error("❌ Error updating cover image:", error);
      alert("Błąd podczas aktualizacji zdjęcia w tle");
    }
  };

  const handleSaveProfile = async () => {
    if (!accountant) return;

    try {
      // Auto-geocode address if provided but no coordinates
      let updateData = { ...editForm };

      if (
        editForm.address &&
        editForm.city &&
        (!editForm.latitude || !editForm.longitude)
      ) {
        console.log("🗺️ Geocoding address...");
        const geocoded = await geocodeAddress(
          editForm.address,
          editForm.city,
          editForm.postal_code,
          editForm.country
        );

        if (geocoded) {
          updateData.latitude = geocoded.latitude;
          updateData.longitude = geocoded.longitude;
          console.log("✅ Geocoding successful:", geocoded);
        } else {
          console.warn("⚠️ Geocoding failed - saving without coordinates");
        }
      }

      const { error } = await supabase
        .from("accountants")
        .update({
          full_name: updateData.full_name,
          company_name: updateData.company_name,
          email: updateData.email,
          phone: updateData.phone,
          kvk_number: updateData.kvk_number,
          btw_number: updateData.btw_number,
          license_number: updateData.license_number,
          city: updateData.city,
          address: updateData.address,
          postal_code: updateData.postal_code,
          country: updateData.country,
          bio: updateData.bio,
          specializations: updateData.specializations,
          languages: updateData.languages,
          website: updateData.website,
          years_experience: updateData.years_experience,
          latitude: updateData.latitude,
          longitude: updateData.longitude,
        })
        .eq("id", accountant.id);

      if (error) throw error;

      setAccountant({
        ...accountant,
        ...updateData,
      });

      setIsEditingProfile(false);
      console.log("✅ Profile updated");
      alert("Profil zaktualizowany!");
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      alert("Błąd podczas zapisywania profilu");
    }
  };

  const handleViewSubscription = () => {
    window.location.href = "/accountant/subscription";
  };

  const [showSupportModal, setShowSupportModal] = useState(false);

  const handleContactSupport = () => {
    setShowSupportModal(true);
  };

  // Settings handlers for AccountantSettingsPanel
  const handleNotificationSettingsSave = async () => {
    setSettingsSaving(true);
    try {
      // TODO: Save to database when notification_settings table exists
      console.log("✅ Notification settings saved:", notificationSettings);
      alert("Ustawienia powiadomień zapisane!");
    } catch (error) {
      console.error("❌ Error saving notification settings:", error);
      alert("Błąd podczas zapisywania ustawień powiadomień");
    } finally {
      setSettingsSaving(false);
    }
  };

  const handlePrivacySettingsSave = async () => {
    setSettingsSaving(true);
    try {
      // TODO: Save to database when privacy_settings table exists
      console.log("✅ Privacy settings saved:", privacySettings);
      alert("Ustawienia prywatności zapisane!");
    } catch (error) {
      console.error("❌ Error saving privacy settings:", error);
      alert("Błąd podczas zapisywania ustawień prywatności");
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleAccountantDataSave = async (data: {
    full_name: string;
    company_name: string;
    email: string;
    phone: string;
    kvk_number: string;
    btw_number: string;
    license_number: string;
    city: string;
    address: string;
    postal_code: string;
    country: string;
    bio: string;
    specializations: string[];
    languages: string[];
    website: string;
    years_experience: number;
  }) => {
    if (!accountant) return;
    setSettingsSaving(true);

    try {
      // Auto-geocode address if provided
      let updateData = {
        ...data,
        latitude: null as number | null,
        longitude: null as number | null,
      };

      if (data.address && data.city) {
        const geocoded = await geocodeAddress(
          data.address,
          data.city,
          data.postal_code,
          data.country
        );
        if (geocoded) {
          updateData.latitude = geocoded.latitude;
          updateData.longitude = geocoded.longitude;
        }
      }

      const { error } = await supabase
        .from("accountants")
        .update({
          full_name: updateData.full_name,
          company_name: updateData.company_name,
          email: updateData.email,
          phone: updateData.phone,
          kvk_number: updateData.kvk_number,
          btw_number: updateData.btw_number,
          license_number: updateData.license_number,
          city: updateData.city,
          address: updateData.address,
          postal_code: updateData.postal_code,
          country: updateData.country,
          bio: updateData.bio,
          specializations: updateData.specializations,
          languages: updateData.languages,
          website: updateData.website,
          years_experience: updateData.years_experience,
          latitude: updateData.latitude,
          longitude: updateData.longitude,
        })
        .eq("id", accountant.id);

      if (error) throw error;

      setAccountant({ ...accountant, ...updateData });
      setEditForm({ ...editForm, ...data });
      console.log("✅ Accountant data saved");
      alert("Dane księgowego zapisane!");
    } catch (error) {
      console.error("❌ Error saving accountant data:", error);
      alert("Błąd podczas zapisywania danych");
    } finally {
      setSettingsSaving(false);
    }
  };

  // Desktop sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // renderTopTabs removed - using DashboardSidebar instead

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Team Invitations - show pending invitations at the top */}
      {accountant?.id && (
        <PendingInvitations
          accountantId={accountant.id}
          onInvitationAccepted={(teamId) => {
            setActiveTab("team");
          }}
        />
      )}

      {/* Stats Cards - Premium StatChips */}
      <StatChipsGrid
        items={
          [
            {
              id: "clients",
              label: "Active Clients",
              value: accountant?.total_clients || 0,
              tone: "cyan",
              icon: <Users className="w-4 h-4" />,
            },
            {
              id: "rating",
              label: "Rating",
              value: accountant?.rating ? accountant.rating.toFixed(1) : "0.0",
              tone: "amber",
              icon: <Star className="w-4 h-4" />,
            },
            {
              id: "views",
              label: "Profile Views",
              value: accountant?.profile_views || 0,
              tone: "emerald",
              icon: <Eye className="w-4 h-4" />,
            },
            {
              id: "messages",
              label: "Messages",
              value: unreadCount || 0,
              tone: "violet",
              icon: <Bell className="w-4 h-4" />,
            },
          ] as StatChipItem[]
        }
        columns={4}
      />

      {/* GŁÓWNY GRID 3 kolumny */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* � Ostatnie wyszukiwania */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Ostatnie wyszukiwania
            </h2>
            <button
              onClick={() => setActiveTab("services")}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              Nowe wyszukiwanie →
            </button>
          </div>

          <div className="text-center py-8">
            <p className="text-gray-500">Brak historii wyszukiwań</p>
            <button
              onClick={() => setActiveTab("services")}
              className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Rozpocznij pierwsze wyszukiwanie
            </button>
          </div>
        </div>

        {/* 📅 Nadchodzące spotkania */}
        <UpcomingEventsCard maxEvents={5} showAddButton={true} />

        {/* 👥 Zapisane profile */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Zapisane profile
            </h2>
            <Link
              to="/search"
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
    </div>
  );

  // ===================================================================
  // MESSAGES PANEL - Full view
  // ===================================================================
  // ===================================================================
  // MESSENGER UI - WHATSAPP-STYLE 2-PANEL LAYOUT
  // ===================================================================
  const renderMessages = () => (
    <div className={isMobile ? "px-2" : "max-w-7xl mx-auto"}>
      <div
        className={`bg-white rounded-2xl shadow-xl overflow-hidden ${
          isMobile ? "h-screen" : ""
        }`}
        style={isMobile ? {} : { height: "700px" }}
      >
        <div className={`flex h-full ${isMobile ? "flex-col" : ""}`}>
          {/* ============================================ */}
          {/* LEFT PANEL: CONVERSATION LIST */}
          {/* ============================================ */}
          <div
            className={`border-gray-200 flex flex-col bg-gray-50 ${
              isMobile
                ? selectedConversation
                  ? "hidden"
                  : "w-full h-full"
                : "w-1/3 border-r"
            }`}
          >
            {/* Header */}
            <div
              className={`border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 ${
                isMobile ? "p-3" : "p-5"
              }`}
            >
              <h3
                className={`font-bold text-white mb-3 flex items-center gap-2 ${
                  isMobile ? "text-lg" : "text-xl"
                }`}
              >
                <span>💬</span> Wiadomości
              </h3>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Szukaj konwersacji..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full rounded-lg border-0 focus:ring-2 focus:ring-white/50 ${
                    isMobile
                      ? "px-3 py-2 pl-9 text-xs"
                      : "px-4 py-2 pl-10 text-sm"
                  }`}
                />
                <span
                  className={`absolute text-gray-400 ${
                    isMobile ? "left-2.5 top-2" : "left-3 top-2.5"
                  }`}
                >
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
                    className={`border-b border-gray-200 cursor-pointer transition-all duration-200 hover:bg-blue-50 ${
                      isMobile ? "p-3" : "p-4"
                    } ${
                      selectedConversation?.partnerId === conversation.partnerId
                        ? "bg-blue-100 border-l-4 border-l-blue-600"
                        : "hover:border-l-4 hover:border-l-blue-300"
                    }`}
                  >
                    <div
                      className={`flex items-start ${
                        isMobile ? "gap-2" : "gap-3"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {conversation.partnerAvatar ? (
                          <img
                            src={conversation.partnerAvatar}
                            alt={conversation.partnerName}
                            className={`rounded-full object-cover border-2 border-white shadow-md ${
                              isMobile ? "w-10 h-10" : "w-12 h-12"
                            }`}
                          />
                        ) : (
                          <div
                            className={`rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md ${
                              isMobile
                                ? "w-10 h-10 text-base"
                                : "w-12 h-12 text-lg"
                            }`}
                          >
                            {conversation.partnerName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {conversation.isOnline && (
                          <span
                            className={`absolute bottom-0 right-0 bg-green-500 border-2 border-white rounded-full ${
                              isMobile ? "w-3 h-3" : "w-3.5 h-3.5"
                            }`}
                          ></span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p
                            className={`font-semibold truncate ${
                              conversation.unreadCount > 0
                                ? "text-blue-700"
                                : "text-gray-900"
                            } ${isMobile ? "text-xs" : "text-sm"}`}
                          >
                            {conversation.partnerName}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span
                              className={`bg-red-500 text-white font-bold rounded-full ml-2 flex-shrink-0 ${
                                isMobile
                                  ? "text-xs px-1.5 py-0.5"
                                  : "text-xs px-2 py-0.5"
                              }`}
                            >
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-gray-600 truncate mb-1 ${
                            isMobile ? "text-xs" : "text-xs"
                          }`}
                        >
                          {conversation.lastMessage.content}
                        </p>

                        <p
                          className={`text-gray-400 ${
                            isMobile ? "text-xs" : "text-xs"
                          }`}
                        >
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
          <div
            className={`flex flex-col bg-white ${
              isMobile
                ? selectedConversation
                  ? "w-full h-full"
                  : "hidden"
                : "w-2/3"
            }`}
          >
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div
                  className={`border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white shadow-sm ${
                    isMobile ? "p-3" : "p-5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isMobile && (
                        <button
                          onClick={() => setSelectedConversation(null)}
                          className="p-1 hover:bg-gray-200 rounded-lg mr-2"
                        >
                          ← Powrót
                        </button>
                      )}
                      {/* Avatar - clickable to navigate to profile */}
                      <button
                        onClick={async () => {
                          const partnerId = selectedConversation.partnerId;
                          if (!partnerId) return;

                          try {
                            const { data: profile } = await supabase
                              .from("profiles")
                              .select("role")
                              .eq("id", partnerId)
                              .single();

                            const userRole = profile?.role || "worker";
                            let roleSpecificId = partnerId;

                            if (userRole === "worker") {
                              const { data: worker } = await supabase
                                .from("workers")
                                .select("id")
                                .eq("profile_id", partnerId)
                                .maybeSingle();
                              if (worker) roleSpecificId = worker.id;
                            } else if (userRole === "employer") {
                              const { data: employer } = await supabase
                                .from("employers")
                                .select("id")
                                .eq("profile_id", partnerId)
                                .maybeSingle();
                              if (employer) roleSpecificId = employer.id;
                            } else if (userRole === "accountant") {
                              const { data: accountantData } = await supabase
                                .from("accountants")
                                .select("id")
                                .eq("profile_id", partnerId)
                                .maybeSingle();
                              if (accountantData)
                                roleSpecificId = accountantData.id;
                            } else if (userRole === "cleaning_company") {
                              const { data: company } = await supabase
                                .from("cleaning_companies")
                                .select("id")
                                .eq("profile_id", partnerId)
                                .maybeSingle();
                              if (company) roleSpecificId = company.id;
                            }

                            const roleMap: Record<string, string> = {
                              worker: "/worker/profile",
                              employer: "/employer/profile",
                              accountant: "/accountant/profile",
                              cleaning_company: "/cleaning-company/profile",
                              admin: "/admin/profile",
                            };
                            const url = `${
                              roleMap[userRole] || "/worker/profile"
                            }/${roleSpecificId}#contact`;
                            navigate(url);
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
                            src={selectedConversation.partnerAvatar}
                            alt={selectedConversation.partnerName}
                            className={`rounded-full object-cover border-2 border-blue-500 hover:border-blue-700 transition-colors ${
                              isMobile ? "w-8 h-8" : "w-10 h-10"
                            }`}
                          />
                        ) : (
                          <div
                            className={`rounded-full bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 flex items-center justify-center text-white font-bold shadow-lg transition-all ${
                              isMobile ? "w-8 h-8 text-sm" : "w-10 h-10"
                            }`}
                          >
                            {selectedConversation.partnerName
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                      </button>
                      <div>
                        <button
                          onClick={async () => {
                            const partnerId = selectedConversation.partnerId;
                            if (!partnerId) return;

                            try {
                              const { data: profile } = await supabase
                                .from("profiles")
                                .select("role")
                                .eq("id", partnerId)
                                .single();

                              const userRole = profile?.role || "worker";
                              let roleSpecificId = partnerId;

                              if (userRole === "worker") {
                                const { data: worker } = await supabase
                                  .from("workers")
                                  .select("id")
                                  .eq("profile_id", partnerId)
                                  .maybeSingle();
                                if (worker) roleSpecificId = worker.id;
                              } else if (userRole === "employer") {
                                const { data: employer } = await supabase
                                  .from("employers")
                                  .select("id")
                                  .eq("profile_id", partnerId)
                                  .maybeSingle();
                                if (employer) roleSpecificId = employer.id;
                              } else if (userRole === "accountant") {
                                const { data: accountantData } = await supabase
                                  .from("accountants")
                                  .select("id")
                                  .eq("profile_id", partnerId)
                                  .maybeSingle();
                                if (accountantData)
                                  roleSpecificId = accountantData.id;
                              } else if (userRole === "cleaning_company") {
                                const { data: company } = await supabase
                                  .from("cleaning_companies")
                                  .select("id")
                                  .eq("profile_id", partnerId)
                                  .maybeSingle();
                                if (company) roleSpecificId = company.id;
                              }

                              const roleMap: Record<string, string> = {
                                worker: "/worker/profile",
                                employer: "/employer/profile",
                                accountant: "/accountant/profile",
                                cleaning_company: "/cleaning-company/profile",
                                admin: "/admin/profile",
                              };
                              const url = `${
                                roleMap[userRole] || "/worker/profile"
                              }/${roleSpecificId}#contact`;
                              navigate(url);
                            } catch (error) {
                              console.error(
                                "Error navigating to profile:",
                                error
                              );
                            }
                          }}
                          className={`font-bold text-gray-900 hover:text-blue-600 hover:underline transition-colors cursor-pointer ${
                            isMobile ? "text-sm" : ""
                          }`}
                        >
                          {selectedConversation.partnerName}
                        </button>
                        <p
                          className={`text-gray-500 ${
                            isMobile ? "text-xs" : "text-xs"
                          }`}
                        >
                          {selectedConversation.isOnline ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <span
                                className={`bg-green-500 rounded-full ${
                                  isMobile ? "w-1.5 h-1.5" : "w-2 h-2"
                                }`}
                              ></span>
                              Online
                            </span>
                          ) : (
                            "Offline"
                          )}
                        </p>
                      </div>
                    </div>

                    {!isMobile && (
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Więcej opcji"
                        >
                          <span className="text-gray-600">⋮</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages Area */}
                <div
                  className={`flex-1 overflow-y-auto space-y-4 bg-gray-50 ${
                    isMobile ? "p-3" : "p-6"
                  }`}
                >
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
                        selectedConversation.messages[index - 1]?.sender_id !==
                          msg.sender_id;

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
                                  className={`rounded-full object-cover ${
                                    isMobile ? "w-6 h-6" : "w-8 h-8"
                                  }`}
                                />
                              ) : (
                                <div
                                  className={`rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold ${
                                    isMobile
                                      ? "w-6 h-6 text-xs"
                                      : "w-8 h-8 text-xs"
                                  }`}
                                >
                                  {selectedConversation.partnerName
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}
                            </div>
                          )}

                          {!isOwnMessage && !showAvatar && (
                            <div className={isMobile ? "w-6" : "w-8"}></div>
                          )}

                          {/* Message Bubble */}
                          <div
                            className={`${
                              isMobile ? "max-w-[80%]" : "max-w-[70%]"
                            } ${isOwnMessage ? "order-first" : ""}`}
                          >
                            <div
                              className={`rounded-2xl shadow-md ${
                                isMobile ? "p-2" : "p-3"
                              } ${
                                isOwnMessage
                                  ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-sm"
                                  : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
                              }`}
                            >
                              <p
                                className={`leading-relaxed break-words ${
                                  isMobile ? "text-xs" : "text-sm"
                                }`}
                              >
                                {msg.content}
                              </p>

                              {/* Attachments */}
                              {msg.attachments &&
                                msg.attachments.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {msg.attachments.map((att, i) => (
                                      <div
                                        key={i}
                                        className={`px-2 py-1 rounded ${
                                          isMobile ? "text-xs" : "text-xs"
                                        } ${
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
                                  {new Date(msg.created_at).toLocaleTimeString(
                                    "pl-PL",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
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
                <div
                  className={`border-t border-gray-200 bg-white ${
                    isMobile ? "p-2" : "p-4"
                  }`}
                >
                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div
                      className={`mb-3 bg-gray-50 rounded-lg border border-gray-200 ${
                        isMobile ? "p-2" : "p-3"
                      }`}
                    >
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
                            className={`hover:scale-125 transition-transform ${
                              isMobile ? "text-xl" : "text-2xl"
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    className={`flex items-center ${
                      isMobile ? "gap-1" : "gap-3"
                    }`}
                  >
                    {/* Emoji Button */}
                    {!isMobile && (
                      <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-2xl"
                        title="Dodaj emoji"
                      >
                        😊
                      </button>
                    )}

                    {/* File Upload */}
                    {!isMobile && (
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
                    )}

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
                      className={`flex-1 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isMobile ? "px-3 py-2 text-sm" : "px-4 py-3"
                      }`}
                      disabled={uploadingFile}
                    />

                    {/* Send Button */}
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || uploadingFile}
                      className={`rounded-xl font-medium transition-all shadow-lg ${
                        isMobile ? "px-3 py-2 text-xs" : "px-6 py-3"
                      } ${
                        messageInput.trim() && !uploadingFile
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {uploadingFile ? "📤" : "📨"} {isMobile ? "" : "Wyślij"}
                    </button>
                  </div>

                  {!isMobile && (
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      Enter = wyślij • Shift+Enter = nowa linia
                    </p>
                  )}
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50">
                <div className={isMobile ? "text-6xl mb-4" : "text-8xl mb-6"}>
                  💬
                </div>
                <p
                  className={`font-medium mb-2 ${
                    isMobile ? "text-lg" : "text-xl"
                  }`}
                >
                  Wybierz konwersację
                </p>
                <p
                  className={`text-center max-w-xs ${
                    isMobile ? "text-xs px-4" : "text-sm"
                  }`}
                >
                  Kliknij na konwersację{" "}
                  {isMobile ? "powyżej" : "po lewej stronie"}, aby rozpocząć
                  czat
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSubmissions = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">📋 Zgłoszenia Klientów</h2>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
            Wszystkie
          </button>
          <button className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            Nowe
          </button>
          <button className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            W trakcie
          </button>
        </div>
      </div>

      {/* Przykładowe zgłoszenie */}
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                JK
              </div>
              <div>
                <h3 className="font-semibold text-lg">Jan Kowalski</h3>
                <p className="text-sm text-gray-600">ZZP • Rotterdam</p>
                <p className="text-sm text-gray-500 mt-2">
                  Potrzebuję pomocy w rozliczeniu PIT za 2024 oraz konsultacji
                  VAT
                </p>
                <div className="flex gap-4 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    15 dni temu
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    PIT + VAT
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                Nowe
              </span>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Odpowiedz
              </button>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                AS
              </div>
              <div>
                <h3 className="font-semibold text-lg">Anna Smits</h3>
                <p className="text-sm text-gray-600">
                  Przedsiębiorca • Amsterdam
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Chciałabym założyć eenmanszaak i potrzebuję pomocy w
                  formalnosćiach
                </p>
                <div className="flex gap-4 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />3 dni temu
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    Założenie firmy
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                W trakcie
              </span>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Zobacz
              </button>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow opacity-60">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold">
                PW
              </div>
              <div>
                <h3 className="font-semibold text-lg">Piotr Wiśniewski</h3>
                <p className="text-sm text-gray-600">ZZP • Utrecht</p>
                <p className="text-sm text-gray-500 mt-2">
                  Rozliczenie BTW za Q4 2024
                </p>
                <div className="flex gap-4 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    30 dni temu
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    BTW
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                Zamknięte
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button className="text-blue-600 hover:text-blue-700 font-medium">
          Załaduj więcej zgłoszeń →
        </button>
      </div>
    </div>
  );

  const renderForms = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">📝 Formularze i Szablony</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Dodaj szablon
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* PIT-37 */}
        <div className="border-2 border-blue-200 rounded-lg p-5 hover:shadow-lg transition-all hover:border-blue-400 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
              Najpopularniejszy
            </span>
          </div>
          <h3 className="font-bold text-lg mb-2">PIT-37</h3>
          <p className="text-sm text-gray-600 mb-4">
            Zeznanie roczne dla działalności gospodarczej
          </p>
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              Wypełnij
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              PDF
            </button>
          </div>
        </div>

        {/* VAT-7 */}
        <div className="border-2 border-green-200 rounded-lg p-5 hover:shadow-lg transition-all hover:border-green-400 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded">
              Miesięczny
            </span>
          </div>
          <h3 className="font-bold text-lg mb-2">VAT-7</h3>
          <p className="text-sm text-gray-600 mb-4">
            Deklaracja VAT - rozliczenie miesięczne
          </p>
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
              Wypełnij
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              PDF
            </button>
          </div>
        </div>

        {/* ZUS DRA */}
        <div className="border-2 border-purple-200 rounded-lg p-5 hover:shadow-lg transition-all hover:border-purple-400 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-purple-600" />
            </div>
            <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded">
              ZUS
            </span>
          </div>
          <h3 className="font-bold text-lg mb-2">ZUS DRA</h3>
          <p className="text-sm text-gray-600 mb-4">
            Zgłoszenie do ubezpieczeń
          </p>
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
              Wypełnij
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              PDF
            </button>
          </div>
        </div>

        {/* Faktura */}
        <div className="border-2 border-orange-200 rounded-lg p-5 hover:shadow-lg transition-all hover:border-orange-400 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
            <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded">
              Szablon
            </span>
          </div>
          <h3 className="font-bold text-lg mb-2">Faktura VAT</h3>
          <p className="text-sm text-gray-600 mb-4">
            Szablon faktury dla klientów
          </p>
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm">
              Utwórz
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              Edytuj
            </button>
          </div>
        </div>

        {/* Umowa */}
        <div className="border-2 border-indigo-200 rounded-lg p-5 hover:shadow-lg transition-all hover:border-indigo-400 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded">
              Prawny
            </span>
          </div>
          <h3 className="font-bold text-lg mb-2">Umowa o współpracy</h3>
          <p className="text-sm text-gray-600 mb-4">
            Wzór umowy księgowej z klientem
          </p>
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
              Pobierz
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              DOC
            </button>
          </div>
        </div>

        {/* Checklist */}
        <div className="border-2 border-teal-200 rounded-lg p-5 hover:shadow-lg transition-all hover:border-teal-400 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-teal-600" />
            </div>
            <span className="px-2 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded">
              Helper
            </span>
          </div>
          <h3 className="font-bold text-lg mb-2">Checklist ZZP</h3>
          <p className="text-sm text-gray-600 mb-4">
            Lista dokumentów dla nowego klienta
          </p>
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm">
              Wyślij
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              Edytuj
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">
              Potrzebujesz innego formularza?
            </h4>
            <p className="text-sm text-blue-700">
              Możesz dodać własne szablony dokumentów lub skorzystać z naszej
              biblioteki ponad 50 formularzy księgowych.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================
  // 🚧 DRUŻYNA KSIĘGOWYCH - NOWY SYSTEM
  // ============================================
  // TODO: Implementacja nowego systemu drużyny księgowych
  // - Tworzenie drużyn między księgowymi
  // - Organizator zadań dla drużyny
  // - System zapraszania innych księgowych
  // ============================================
  const [showTeamDashboard, setShowTeamDashboard] = useState(false);

  const renderTeam = () => {
    // Jeśli dashboard drużyny jest otwarty, pokaż go w pełnym ekranie
    if (showTeamDashboard && accountant && user) {
      return (
        <AccountantTeamDashboard
          accountantId={accountant.id}
          accountantName={
            (user as any).user_metadata?.full_name ||
            accountant.company_name ||
            "Księgowy"
          }
          accountantEmail={user.email || ""}
          accountantAvatar={(user as any).user_metadata?.avatar_url}
          profileId={user.id}
          onClose={() => setShowTeamDashboard(false)}
        />
      );
    }

    // Pokazuj przycisk do otwarcia dashboardu drużyny
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">👥 Drużyna Księgowych</h2>
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
            <Users className="w-12 h-12 text-indigo-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            System drużyny księgowych
          </h3>
          <p className="text-gray-500 max-w-md mb-6">
            Współpracuj z innymi księgowymi, zarządzaj zadaniami, komunikuj się
            przez chat i dziel się dokumentami.
          </p>
          <button
            onClick={() => setShowTeamDashboard(true)}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <Users className="w-5 h-5" />
            Otwórz panel drużyny
          </button>
        </div>
      </div>
    );
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
    if (!accountant?.id) return;

    try {
      setSaving(true);

      const portfolioData = {
        accountant_id: accountant.id,
        title: portfolioForm.title,
        description: portfolioForm.description,
        images: portfolioForm.images,
        project_url: portfolioForm.project_url || null,
        video_url: portfolioForm.video_url || null,
        category: portfolioForm.category || null,
        start_date: portfolioForm.start_date || null,
        end_date: portfolioForm.end_date || null,
        completion_date: portfolioForm.completion_date || null,
        client_name: portfolioForm.client_name || null,
        client_company: portfolioForm.client_company || null,
        location: portfolioForm.location || null,
        address: portfolioForm.address || null,
        is_public: portfolioForm.is_public,
        is_featured: portfolioForm.is_featured,
      };

      if (editingProjectId) {
        // WHY: Using as any because accountant_portfolio table is not yet in database.types.ts
        const { error } = await (supabase.from("accountant_portfolio") as any)
          .update(portfolioData)
          .eq("id", editingProjectId);
        if (error) throw error;
      } else {
        // WHY: Using as any because accountant_portfolio table is not yet in database.types.ts
        const { error } = await (
          supabase.from("accountant_portfolio") as any
        ).insert([portfolioData]);
        if (error) throw error;
      }

      await loadAccountant();
      setShowPortfolioModal(false);
      resetPortfolioForm();
    } catch (err) {
      console.error("Portfolio submit error:", err);
      alert("❌ Nie udało się zapisać projektu");
    } finally {
      setSaving(false);
    }
  };

  const handlePortfolioDelete = async (projectId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten projekt?")) return;

    try {
      // WHY: Using as any because accountant_portfolio table is not yet in database.types.ts
      const { error } = await (supabase.from("accountant_portfolio") as any)
        .delete()
        .eq("id", projectId);

      if (error) throw error;
      await loadAccountant();
    } catch (err) {
      console.error("Portfolio delete error:", err);
      alert("❌ Nie udało się usunąć projektu");
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
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from("portfolio-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("portfolio-images")
        .getPublicUrl(filePath);

      setPortfolioForm({
        ...portfolioForm,
        images: [...portfolioForm.images, urlData.publicUrl],
      });
    } catch (err) {
      console.error("Image upload error:", err);
      alert("❌ Nie udało się przesłać zdjęcia");
    } finally {
      setSaving(false);
    }
  };

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
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!accountant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* 3D Background Layer */}
      {!isMobile && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden perspective-container">
          <Animated3DProfileBackground role="accountant" opacity={0.25} />
          <TypewriterAnimation opacity={0.2} />
        </div>
      )}

      {/* Main Layout: Sidebar + Content */}
      <div className="flex h-screen relative z-10">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <DashboardSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            title="📊 Księgowy"
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
            title="📊 Księgowy"
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
          {/* Desktop Header */}
          {!isMobile && (
            <DashboardHeader
              title={`Dashboard - ${
                accountant.company_name || accountant.full_name
              }`}
              subtitle="Panel księgowego - zarządzaj klientami i usługami"
              avatarUrl={accountant.avatar_url}
              avatarFallback={(accountant.company_name ||
                accountant.full_name)?.[0]?.toUpperCase()}
            >
              <button
                onClick={() => setIsCommunicationOpen(!isCommunicationOpen)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors px-4 py-2"
              >
                <span>💬</span>
                Komunikacja
              </button>
            </DashboardHeader>
          )}

          {/* Communication Panel */}
          {isCommunicationOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
              <div
                className={`absolute right-0 top-0 h-full bg-white shadow-xl ${
                  isMobile ? "w-full" : "w-full max-w-4xl"
                }`}
              >
                <div
                  className={`flex items-center justify-between border-b ${
                    isMobile ? "p-3" : "p-4"
                  }`}
                >
                  <h3
                    className={`font-semibold ${
                      isMobile ? "text-base" : "text-lg"
                    }`}
                  >
                    Komunikacja {isMobile ? "" : "Projektowa"}
                  </h3>
                  <button
                    onClick={() => setIsCommunicationOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <span className="sr-only">Zamknij</span>✕
                  </button>
                </div>
                <div className="h-full overflow-auto">
                  <ProjectCommunicationManager userRole="accountant" />
                </div>
              </div>
            </div>
          )}

          {/* MODAL: Edit Profile */}
          {isEditingProfile && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold">Edytuj profil księgowy</h2>
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* SEKCJA: Dane osobowe */}
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Dane osobowe
                    </h3>

                    {/* Full Name */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Imię i nazwisko <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editForm.full_name}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            full_name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Jan Kowalski"
                      />
                    </div>

                    {/* Company Name */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nazwa firmy
                      </label>
                      <input
                        type="text"
                        value={editForm.company_name}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            company_name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Np. Biuro Rachunkowe ABC"
                      />
                    </div>

                    {/* Years Experience */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lata doświadczenia
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={editForm.years_experience}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            years_experience: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="5"
                      />
                    </div>
                  </div>

                  {/* SEKCJA: Dane kontaktowe */}
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Dane kontaktowe
                    </h3>

                    {/* Email */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email kontaktowy <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="kontakt@biuro.pl"
                      />
                    </div>

                    {/* Phone */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefon
                      </label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) =>
                          setEditForm({ ...editForm, phone: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+31 6 12345678"
                      />
                    </div>

                    {/* Website */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Strona internetowa
                      </label>
                      <input
                        type="url"
                        value={editForm.website}
                        onChange={(e) =>
                          setEditForm({ ...editForm, website: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://www.twoje-biuro.nl"
                      />
                    </div>
                  </div>

                  {/* SEKCJA: Licencje i certyfikaty */}
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Licencje i certyfikaty
                    </h3>

                    {/* KVK Number */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Numer KVK (Kamer van Koophandel)
                      </label>
                      <input
                        type="text"
                        value={editForm.kvk_number}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            kvk_number: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="12345678"
                      />
                    </div>

                    {/* BTW Number */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Numer BTW/VAT
                      </label>
                      <input
                        type="text"
                        value={editForm.btw_number}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            btw_number: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="NL123456789B01"
                      />
                    </div>

                    {/* License Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Numer licencji księgowego
                      </label>
                      <input
                        type="text"
                        value={editForm.license_number}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            license_number: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="AA-12345"
                      />
                    </div>
                  </div>

                  {/* SEKCJA: Adres */}
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Adres biura
                    </h3>

                    {/* Address */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ulica i numer
                      </label>
                      <input
                        type="text"
                        value={editForm.address}
                        onChange={(e) =>
                          setEditForm({ ...editForm, address: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Coolsingel 42"
                      />
                    </div>

                    {/* City + Postal Code (row) */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kod pocztowy
                        </label>
                        <input
                          type="text"
                          value={editForm.postal_code}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              postal_code: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="3011 AD"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Miasto
                        </label>
                        <input
                          type="text"
                          value={editForm.city}
                          onChange={(e) =>
                            setEditForm({ ...editForm, city: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Rotterdam"
                        />
                      </div>
                    </div>

                    {/* Country */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kraj
                      </label>
                      <select
                        value={editForm.country}
                        onChange={(e) =>
                          setEditForm({ ...editForm, country: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Nederland">Nederland</option>
                        <option value="België">België</option>
                        <option value="Polska">Polska</option>
                        <option value="Duitsland">Duitsland</option>
                      </select>
                    </div>
                  </div>

                  {/* SEKCJA: Specjalizacje */}
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Specjalizacje
                    </h3>

                    <div className="space-y-2">
                      {[
                        "BTW",
                        "Salarisadministratie",
                        "Jaarrekening",
                        "Belastingaangifte",
                        "ZZP begeleiding",
                        "Bedrijfsadministratie",
                      ].map((spec) => (
                        <label
                          key={spec}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={editForm.specializations.includes(spec)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditForm({
                                  ...editForm,
                                  specializations: [
                                    ...editForm.specializations,
                                    spec,
                                  ],
                                });
                              } else {
                                setEditForm({
                                  ...editForm,
                                  specializations:
                                    editForm.specializations.filter(
                                      (s) => s !== spec
                                    ),
                                });
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{spec}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* SEKCJA: Języki */}
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Języki
                    </h3>

                    <div className="space-y-2">
                      {[
                        "Nederlands",
                        "English",
                        "Polski",
                        "Deutsch",
                        "Français",
                      ].map((lang) => (
                        <label
                          key={lang}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={editForm.languages.includes(lang)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditForm({
                                  ...editForm,
                                  languages: [...editForm.languages, lang],
                                });
                              } else {
                                setEditForm({
                                  ...editForm,
                                  languages: editForm.languages.filter(
                                    (l) => l !== lang
                                  ),
                                });
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{lang}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* SEKCJA: O mnie */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      O mnie / Biurze
                    </h3>

                    <textarea
                      value={editForm.bio}
                      onChange={(e) =>
                        setEditForm({ ...editForm, bio: e.target.value })
                      }
                      rows={5}
                      maxLength={1000}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Krótki opis Twoich usług księgowych, doświadczenia, specjalizacji..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {editForm.bio.length}/1000 znaków
                    </p>
                  </div>

                  {/* Info box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Wskazówka:</strong> Kompletny profil zwiększa
                      zaufanie klientów i poprawia widoczność w wyszukiwarkach.
                    </p>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Zapisz zmiany
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main scrollable content */}
          <main
            className={`flex-1 overflow-y-auto ${isMobile ? "p-3" : "p-6"}`}
          >
            <TabPanel isActive={activeTab === "profile"}>
              {/* Profile Navigation Drawer - DRUGI HAMBURGER */}
              <ProfileNavigationDrawer
                isOpen={isProfileSidebarOpen}
                onClose={() => setIsProfileSidebarOpen(false)}
                activeSubTab={profileSubTab}
                onSubTabChange={(tab) => {
                  setProfileSubTab(tab);
                  setIsProfileSidebarOpen(false);
                }}
                role="accountant"
                userName={
                  accountant?.company_name ||
                  accountant?.full_name ||
                  "Księgowy"
                }
                userAvatar={accountant?.avatar_url}
              />

              {/* Profile Sub-Header with Second Hamburger (Mobile) */}
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
                      {profileSubTab === "overview" && "📊 Przegląd"}
                      {profileSubTab === "edit" && "✏️ Edytuj Profil"}
                      {profileSubTab === "team" && "👥 Drużyna"}
                      {profileSubTab === "stats" && "📈 Statystyki"}
                    </h2>
                    <div className="w-10"></div>
                  </div>
                </div>
              )}

              {/* Profile Content based on profileSubTab */}
              {profileSubTab === "overview" && (
                <>
                  {/* Overview content merged into profile */}
                  {renderOverview()}
                </>
              )}

              {profileSubTab === "edit" && (
                <div className={isMobile ? "mt-0" : "mt-8"}>
                  <div
                    className={`bg-white rounded-lg shadow ${
                      isMobile ? "p-4" : "p-6"
                    }`}
                  >
                    <h2
                      className={`font-bold text-gray-900 mb-6 ${
                        isMobile ? "text-xl" : "text-2xl"
                      }`}
                    >
                      ⚙️ Ustawienia profilu
                    </h2>
                    <div
                      className={`text-center ${isMobile ? "py-4" : "py-8"}`}
                    >
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className={`bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium ${
                          isMobile ? "px-6 py-2 text-sm" : "px-8 py-3"
                        }`}
                      >
                        📝 Edytuj profil księgowego
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {profileSubTab === "team" && (
                <div className={isMobile ? "mt-0" : "mt-8"}>{renderTeam()}</div>
              )}

              {profileSubTab === "stats" && (
                <div className={isMobile ? "mt-0" : "mt-8"}>
                  <div
                    className={`bg-white rounded-lg shadow ${
                      isMobile ? "p-4" : "p-6"
                    }`}
                  >
                    <h2
                      className={`font-bold text-gray-900 mb-6 ${
                        isMobile ? "text-xl" : "text-2xl"
                      }`}
                    >
                      📈 Statystyki
                    </h2>
                    <div
                      className={`text-center ${
                        isMobile ? "py-4" : "py-8"
                      } text-gray-400`}
                    >
                      <p>Statystyki w przygotowaniu</p>
                    </div>
                  </div>
                </div>
              )}
            </TabPanel>

            <TabPanel isActive={activeTab === "messages"}>
              {/* 💬 SUB-TABS: WIADOMOŚCI | REAKCJE */}
              <div className={isMobile ? "px-2" : "max-w-7xl mx-auto mb-6"}>
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
              {messagesSubTab === "wiadomosci" && renderMessages()}

              {/* REAKCJE CONTENT */}
              {messagesSubTab === "reakcje" && (
                <div className={isMobile ? "px-2" : "max-w-7xl mx-auto"}>
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
                          const getProfileUrl = (role: string, id: string) => {
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
                                const { data: accountantData } = await supabase
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
                              navigate(`/worker/profile/${reactorId}#contact`);
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
            </TabPanel>

            <TabPanel isActive={activeTab === "reviews"}>
              <div className={isMobile ? "px-2" : "max-w-7xl mx-auto"}>
                {/* My Reviews - Full System */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                  {/* Gradient Header with Stats */}
                  <div
                    className={`bg-gradient-to-r from-indigo-600 to-purple-600 ${
                      isMobile ? "p-4" : "p-6"
                    }`}
                  >
                    <h2
                      className={`font-bold text-white mb-6 ${
                        isMobile ? "text-xl" : "text-2xl"
                      }`}
                    >
                      ⭐ Wszystkie opinie
                    </h2>
                    <div
                      className={`grid gap-4 ${
                        isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"
                      }`}
                    >
                      {/* Total Reviews */}
                      <div
                        className={`bg-white/10 backdrop-blur-sm rounded-lg ${
                          isMobile ? "p-3" : "p-4"
                        }`}
                      >
                        <p
                          className={`text-white/80 mb-1 ${
                            isMobile ? "text-xs" : "text-sm"
                          }`}
                        >
                          Łącznie opinii
                        </p>
                        <p
                          className={`text-white font-bold ${
                            isMobile ? "text-xl" : "text-2xl"
                          }`}
                        >
                          {reviews.length}
                        </p>
                      </div>
                      {/* Average Rating */}
                      <div
                        className={`bg-white/10 backdrop-blur-sm rounded-lg ${
                          isMobile ? "p-3" : "p-4"
                        }`}
                      >
                        <p
                          className={`text-white/80 mb-1 ${
                            isMobile ? "text-xs" : "text-sm"
                          }`}
                        >
                          Średnia ocena
                        </p>
                        <p
                          className={`text-white font-bold ${
                            isMobile ? "text-xl" : "text-2xl"
                          }`}
                        >
                          {reviews.length > 0
                            ? (
                                reviews.reduce((sum, r) => sum + r.rating, 0) /
                                reviews.length
                              ).toFixed(1)
                            : accountant?.rating?.toFixed(1) || "0.0"}
                          <span
                            className={
                              isMobile ? "text-base ml-1" : "text-lg ml-1"
                            }
                          >
                            ⭐
                          </span>
                        </p>
                      </div>
                      {/* Positive Reviews */}
                      <div
                        className={`bg-white/10 backdrop-blur-sm rounded-lg ${
                          isMobile ? "p-3" : "p-4"
                        }`}
                      >
                        <p
                          className={`text-white/80 mb-1 ${
                            isMobile ? "text-xs" : "text-sm"
                          }`}
                        >
                          Pozytywne (4-5⭐)
                        </p>
                        <p
                          className={`text-white font-bold ${
                            isMobile ? "text-xl" : "text-2xl"
                          }`}
                        >
                          {reviews.filter((r) => r.rating >= 4).length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rating Breakdown */}
                  <div
                    className={`border-b border-gray-200 ${
                      isMobile ? "p-4" : "p-6"
                    }`}
                  >
                    <h3
                      className={`font-semibold text-gray-900 mb-4 ${
                        isMobile ? "text-base" : "text-lg"
                      }`}
                    >
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
                          <div key={stars} className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 w-12">
                              {stars} ⭐
                            </span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2.5 rounded-full transition-all duration-300"
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
                              ? "bg-indigo-600 text-white"
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
                                ? "bg-indigo-600 text-white"
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
                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    {reviewsLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Ładowanie opinii...</p>
                      </div>
                    ) : reviews.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">📝</div>
                        <p className="text-gray-500 text-lg mb-2">
                          Brak opinii
                        </p>
                        <p className="text-sm text-gray-400">
                          Twoi klienci będą mogli wystawiać opinie po
                          zakończeniu współpracy
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
                                      {(review as any).workers?.workers_profile
                                        ?.avatar_url ||
                                      (review as any).profiles?.avatar_url ||
                                      (review as any).cleaning_companies
                                        ?.avatar_url ||
                                      (review as any).employers?.logo_url ? (
                                        <img
                                          src={
                                            (review as any).workers
                                              ?.workers_profile?.avatar_url ||
                                            (review as any).profiles
                                              ?.avatar_url ||
                                            (review as any).cleaning_companies
                                              ?.avatar_url ||
                                            (review as any).employers?.logo_url
                                          }
                                          alt="Reviewer"
                                          className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200"
                                        />
                                      ) : (
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                          {((review as any).workers
                                            ?.workers_profile?.full_name ||
                                            (review as any).profiles
                                              ?.full_name ||
                                            (review as any).cleaning_companies
                                              ?.company_name ||
                                            (review as any).employers
                                              ?.company_name ||
                                            "K")?.[0]?.toUpperCase() || "K"}
                                        </div>
                                      )}
                                    </div>

                                    {/* Reviewer Info and Rating */}
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-gray-900 text-lg">
                                        {(review as any).workers
                                          ?.workers_profile?.full_name ||
                                          (review as any).profiles?.full_name ||
                                          (review as any).cleaning_companies
                                            ?.company_name ||
                                          (review as any).employers
                                            ?.company_name ||
                                          "Anonimowy klient"}
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
                                    <div className="border-l-4 border-indigo-500 bg-indigo-50 rounded-lg p-3">
                                      <p className="text-xs text-indigo-700 font-medium mb-1">
                                        Jakość usług
                                      </p>
                                      <div className="flex items-center gap-1">
                                        {Array.from({ length: 5 }, (_, i) => (
                                          <span
                                            key={i}
                                            className={`text-sm ${
                                              i < review.rating
                                                ? "text-indigo-600"
                                                : "text-indigo-200"
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
                                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all"
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
                                accountant?.company_name ||
                                accountant?.full_name ||
                                "Księgowy"
                              }</title>
                              <style>
                                body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
                                h1 { color: #4f46e5; }
                                .review { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
                                .rating { color: #fbbf24; }
                              </style>
                            </head>
                            <body>
                              <h1>Opinie - ${
                                accountant?.company_name ||
                                accountant?.full_name ||
                                "Księgowy"
                              }</h1>
                              ${reviews
                                .map(
                                  (r) => `
                                <div class="review">
                                  <h3>${
                                    r.worker?.full_name || "Anonimowy klient"
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
                          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                        >
                          📄 Pobierz PDF (HTML)
                        </button>
                        <button
                          onClick={() => {
                            const csvContent = [
                              ["Klient", "Ocena", "Komentarz", "Data"].join(
                                ","
                              ),
                              ...reviews.map((r) =>
                                [
                                  r.worker?.full_name || "Anonim",
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
                        💡 PDF (HTML) - otwórz w przeglądarce i zapisz jako PDF
                        | CSV - importuj do Excel/Sheets
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabPanel>

            {/* Tablica Tab */}
            <TabPanel isActive={activeTab === "tablica"}>
              <FeedPage key="accountant-feed-page" />
            </TabPanel>

            <TabPanel isActive={activeTab === "services"}>
              {accountant?.id && (
                <AccountantServicesManager accountantId={accountant.id} />
              )}
            </TabPanel>

            <TabPanel isActive={activeTab === "team"}>{renderTeam()}</TabPanel>

            {/* My Posts Tab */}
            <TabPanel isActive={activeTab === "my_posts"}>
              <MyPosts />
            </TabPanel>

            {/* Saved Activity Tab */}
            <TabPanel isActive={activeTab === "saved_activity"}>
              <SavedActivity />
            </TabPanel>

            {/* My Profile Preview Tab */}
            <TabPanel isActive={activeTab === "my_profile"}>
              <MyProfilePreview role="accountant" />
            </TabPanel>

            {/* Subscription Tab */}
            <TabPanel isActive={activeTab === "subscription"}>
              <AccountantSubscriptionPage />
            </TabPanel>

            {/* Portfolio Tab */}
            <TabPanel isActive={activeTab === "portfolio"}>
              {renderPortfolio()}

              {/* Portfolio Form Modal */}
              {showPortfolioModal && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-y-auto">
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 max-w-3xl w-full border border-slate-700 my-8 max-h-[90vh] overflow-y-auto">
                    <h2 className="text-2xl font-bold text-white mb-6">
                      {editingProjectId
                        ? "✏️ Edytuj projekt"
                        : "➕ Dodaj nowy projekt"}
                    </h2>

                    <form
                      onSubmit={handlePortfolioSubmit}
                      className="space-y-4"
                    >
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
                          placeholder="np. Optymalizacja rozliczeń podatkowych dla firmy IT"
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
                          placeholder="Opisz szczegółowo zakres usług księgowych, użyte technologie, organizację projektu, rezultaty..."
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
                            🏠 Adres realizacji usługi
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
                          <option value="Księgowość pełna">
                            Księgowość pełna
                          </option>
                          <option value="Księgowość uproszczona">
                            Księgowość uproszczona
                          </option>
                          <option value="Kadry i płace">Kadry i płace</option>
                          <option value="Rozliczenia podatkowe">
                            Rozliczenia podatkowe
                          </option>
                          <option value="Deklaracje VAT">Deklaracje VAT</option>
                          <option value="Sprawozdania finansowe">
                            Sprawozdania finansowe
                          </option>
                          <option value="Optymalizacja podatkowa">
                            Optymalizacja podatkowa
                          </option>
                          <option value="Konsulting finansowy">
                            Konsulting finansowy
                          </option>
                          <option value="Audyt">Audyt</option>
                          <option value="Doradztwo biznesowe">
                            Doradztwo biznesowe
                          </option>
                          <option value="Zakładanie firm">
                            Zakładanie firm
                          </option>
                          <option value="Reprezentacja w US">
                            Reprezentacja w US
                          </option>
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
                            Math.min(
                              lightboxImages.length - 1,
                              lightboxIndex + 1
                            )
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
            </TabPanel>

            {/* Settings Tab */}
            <TabPanel isActive={activeTab === "settings"}>
              <AccountantSettingsPanel
                accountantProfile={accountant}
                notificationSettings={notificationSettings}
                privacySettings={privacySettings}
                availability={availability}
                blockedDates={blockedDates}
                saving={settingsSaving}
                onAvatarUpload={handleAvatarUpload}
                onCoverImageUpload={handleCoverImageUploadSuccess}
                onNotificationSettingsChange={setNotificationSettings}
                onNotificationSettingsSave={handleNotificationSettingsSave}
                onPrivacySettingsChange={setPrivacySettings}
                onPrivacySettingsSave={handlePrivacySettingsSave}
                onAccountantDataSave={handleAccountantDataSave}
                onAvailabilityChange={handleAvailabilityChange}
                onBlockDate={handleBlockDate}
                onUnblockDate={handleUnblockDate}
                isMobile={isMobile}
              />
            </TabPanel>

            {/* NOTE: Kilometers and Calendar tabs removed - they are only in /faktury module */}
          </main>

          {/* Support Ticket Modal */}
          <SupportTicketModal
            isOpen={showSupportModal}
            onClose={() => setShowSupportModal(false)}
          />
        </div>
        {/* End of flex-1 content area */}
      </div>
      {/* End of flex container */}
    </div>
  );
}

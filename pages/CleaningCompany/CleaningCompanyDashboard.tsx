import { useState, useEffect } from "react";
import React from "react";
import { flushSync } from "react-dom";
import { useNavigate, Link } from "react-router-dom";
import { SupportTicketModal } from "../../src/components/SupportTicketModal";
import { CleaningCompanySettingsPanel } from "../../components/settings/CleaningCompanySettingsPanel";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useIsMobile } from "../../src/hooks/useIsMobile";
import { CompanyInfoEditModal } from "../../src/components/cleaning/CompanyInfoEditModal";
import PortfolioUploadModal from "../../src/components/cleaning/PortfolioUploadModal";
import DateBlocker from "../../src/components/cleaning/DateBlocker";
import { MessageModal } from "../../src/components/cleaning/MessageModal";
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
import type { CleaningCompany, UnavailableDate } from "../../types";
import SavedActivity from "./SavedActivity";
import FeedPage from "../FeedPage_PREMIUM";
import { UpcomingEventsCard } from "../../components/UpcomingEventsCard";
import { MyProfilePreview } from "../../components/profile/MyProfilePreview";
import CleaningCompanySubscriptionSelectionPage from "./CleaningCompanySubscriptionSelectionPage";
import { TeamMembershipTab } from "../../src/modules/team-system/components/TeamMembershipTab";
import Crown from "lucide-react/dist/esm/icons/crown";
// NOTE: Kilometers, Appointments and I18nProvider removed - they are only in /faktury module

interface Review {
  id: string;
  rating: number;
  review_text: string;
  work_date: string;
  work_type: string;
  created_at: string;
  quality_rating?: number | null;
  punctuality_rating?: number | null;
  communication_rating?: number | null;
  safety_rating?: number | null;
  would_recommend?: boolean | null;
  response_text?: string | null;
  response_date?: string | null;
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
  const isMobile = useIsMobile();
  const { activeTab, setActiveTab } = useUnifiedTabs("overview");

  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [companyData, setCompanyData] = useState<CleaningCompany | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [acceptingClients, setAcceptingClients] = useState(true);
  const [blockedDates, setBlockedDates] = useState<UnavailableDate[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalReviews: 0,
    averageRating: 0,
    profileViews: 0,
    contactAttempts: 0,
  });
  const [reviewFilter, setReviewFilter] = useState<"all" | 1 | 2 | 3 | 4 | 5>(
    "all"
  );
  const [reviewSort, setReviewSort] = useState<
    "newest" | "oldest" | "highest" | "lowest"
  >("newest");
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Settings state for CleaningCompanySettingsPanel
  const [notificationSettings, setNotificationSettings] = useState({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    new_project_alerts: true,
    message_alerts: true,
    review_alerts: true,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: "public" as "public" | "contacts" | "private",
    show_email: true,
    show_phone: true,
    show_address: false,
    accepting_new_clients: true,
  });

  const [settingsSaving, setSettingsSaving] = useState(false);

  // ============================================
  // 💬 HELPER FUNCTIONS - MESSENGER CHAT
  // ============================================

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
          partnerAvatar: partnerInfo?.avatar_url,
          lastMessage: msg,
          unreadCount: 0,
          messages: [],
          isOnline: false, // TODO: implement real-time presence
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

  // ============================================
  // 📊 DATA LOADING
  // ============================================

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

      console.log("🏢 Company data:", company);

      if (!company) {
        console.warn("⚠️ No company found for profile_id:", user!.id);
        return;
      }

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
        .eq("cleaning_company_id", company.id)
        .order("created_at", { ascending: false });

      console.log("📊 Reviews query result:", {
        data,
        error,
        count: data?.length,
      });

      if (error) {
        console.log("❌ Error loading reviews:", error);
        console.log("❌ Error details:", JSON.stringify(error, null, 2));
        throw error;
      }

      // Map reviews with employer/worker/accountant info from JOIN
      const reviewsWithEmployers: Review[] = (data || []).map((review: any) => {
        // Prioritize: employer > worker > accountant
        let reviewerName = "Firma";
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
          id: review.id,
          rating: review.rating,
          review_text: review.review_text || "",
          work_date: review.work_date || "",
          work_type: review.work_type || "",
          created_at: review.created_at || "",
          quality_rating: review.quality_rating,
          punctuality_rating: review.punctuality_rating,
          communication_rating: review.communication_rating,
          safety_rating: review.safety_rating,
          would_recommend: review.would_recommend,
          response_text: review.response_text,
          response_date: review.response_date,
          employer: {
            company_name: reviewerName,
            avatar_url: reviewerAvatar,
          },
        };
      });

      console.log("✅ Mapped reviews:", reviewsWithEmployers);
      setReviews(reviewsWithEmployers);
    } catch (error) {
      console.error("💥 Error in loadReviews:", error);
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
        .or(`sender_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

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

      setMessages(messagesWithSenders);

      // Grupuj wiadomości w konwersacje
      const groupedConversations = groupMessagesByConversation(
        messagesWithSenders,
        user!.id
      );
      setConversations(groupedConversations);
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

  // ============================================
  // 💬 MESSENGER ACTIONS
  // ============================================

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
        .filter((msg) => !msg.is_read && msg.recipient_id === user!.id)
        .map((msg) => msg.id);

      if (unreadMessageIds.length === 0) return;

      const { error } = await supabase
        .from("messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in("id", unreadMessageIds);

      if (error) throw error;

      // Reload messages to update UI
      await loadMessages();
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !messageInput.trim()) return;

    const currentPartnerId = selectedConversation.partnerId;

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user!.id,
        recipient_id: selectedConversation.partnerId,
        subject: "Chat message",
        content: messageInput.trim(),
        is_read: false,
        message_type: "direct",
      });

      if (error) throw error;

      setMessageInput("");
      setShowEmojiPicker(false);
      await loadMessages();

      setTimeout(() => {
        const updated = conversations.find(
          (c) => c.partnerId === currentPartnerId
        );
        if (updated) setSelectedConversation(updated);
      }, 100);
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
      const fileName = `${user!.id}-${Date.now()}.${fileExt}`;
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
      alert("Błąd podczas przesyłania pliku");
    } finally {
      setUploadingFile(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: company } = await supabase
        .from("cleaning_companies")
        .select("id, average_rating, total_reviews")
        .eq("profile_id", user!.id)
        .single();

      console.log("📈 Company stats data:", company);

      if (!company) {
        console.warn("⚠️ No company found for stats");
        return;
      }

      // Get profile views count (if table exists)
      const profileViewsQuery = await supabase
        .from("profile_views")
        .select("*", { count: "exact", head: true })
        .eq("cleaning_company_id", company.id);

      console.log("👁️ Profile views:", profileViewsQuery.count);

      // Get reviews stats (use database values as fallback)
      const { data: reviewsData } = await supabase
        .from("cleaning_reviews")
        .select("rating")
        .eq("cleaning_company_id", company.id);

      console.log("⭐ Reviews for stats:", reviewsData?.length);

      const totalReviews = reviewsData?.length || company.total_reviews || 0;
      const averageRating =
        reviewsData && reviewsData.length > 0
          ? reviewsData.reduce((sum, r) => sum + r.rating, 0) /
            reviewsData.length
          : company.average_rating || 0;

      const statsData = {
        totalReviews,
        averageRating,
        profileViews: profileViewsQuery.count || 0,
        contactAttempts: 0, // TODO: Implement when contact tracking is ready
      };

      console.log("✅ Final stats:", statsData);
      setStats(statsData);
    } catch (error) {
      console.error("💥 Error loading stats:", error);
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

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(
        notifications.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
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

  const [showSupportModal, setShowSupportModal] = useState(false);

  const handleContactSupport = () => {
    setShowSupportModal(true);
  };

  // ============================================
  // 🔧 SETTINGS HANDLERS
  // ============================================

  const handleNotificationSettingsSave = async () => {
    setSettingsSaving(true);
    try {
      // TODO: Save to user preferences table when available
      console.log("Saving notification settings:", notificationSettings);
      // For now, settings are stored in local state
    } catch (error) {
      console.error("Error saving notification settings:", error);
    } finally {
      setSettingsSaving(false);
    }
  };

  const handlePrivacySettingsSave = async () => {
    setSettingsSaving(true);
    try {
      const { error } = await supabase
        .from("cleaning_companies")
        .update({
          profile_visibility: privacySettings.profile_visibility,
          accepting_new_clients: privacySettings.accepting_new_clients,
        })
        .eq("profile_id", user!.id);

      if (error) throw error;

      setAcceptingClients(privacySettings.accepting_new_clients);
    } catch (error) {
      console.error("Error saving privacy settings:", error);
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleCompanyDataSave = async (data: Partial<typeof companyData>) => {
    if (!companyData || !user) return;

    setSettingsSaving(true);
    try {
      const { error } = await supabase
        .from("cleaning_companies")
        .update(data)
        .eq("profile_id", user.id);

      if (error) throw error;

      // Reload company data to get updated values
      await loadCompanyData();
    } catch (error) {
      console.error("Error saving company data:", error);
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      if (urlData) {
        const { error: updateError } = await supabase
          .from("cleaning_companies")
          .update({ avatar_url: urlData.publicUrl })
          .eq("profile_id", user.id);

        if (updateError) throw updateError;

        await loadCompanyData();
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
    }
  };

  const handleCoverImageUploadSuccess = async (url: string) => {
    try {
      const { error } = await supabase
        .from("cleaning_companies")
        .update({ cover_image_url: url })
        .eq("profile_id", user!.id);

      if (error) throw error;

      await loadCompanyData();
    } catch (error) {
      console.error("Error updating cover image:", error);
    }
  };

  const handleExportToPDF = () => {
    // Create beautiful HTML for PDF printing
    const stars = (rating: number) =>
      "★".repeat(rating) + "☆".repeat(5 - rating);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Opinie - ${companyData?.company_name || "Firma"}</title>
  <style>
    @page { margin: 2cm; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #9333ea;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #9333ea;
      margin: 0;
      font-size: 28px;
    }
    .header .subtitle {
      color: #666;
      font-size: 14px;
      margin-top: 10px;
    }
    .stats {
      background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-around;
      text-align: center;
    }
    .stat-item {
      flex: 1;
    }
    .stat-number {
      font-size: 32px;
      font-weight: bold;
      display: block;
    }
    .stat-label {
      font-size: 12px;
      opacity: 0.9;
    }
    .review {
      border: 2px solid #e5e7eb;
      border-left: 6px solid #9333ea;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 25px;
      background: #fafafa;
      page-break-inside: avoid;
    }
    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 10px;
    }
    .company-name {
      font-weight: bold;
      font-size: 18px;
      color: #111;
    }
    .review-date {
      color: #666;
      font-size: 12px;
    }
    .rating-main {
      color: #f59e0b;
      font-size: 20px;
      margin: 10px 0;
    }
    .detailed-ratings {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin: 15px 0;
      background: white;
      padding: 15px;
      border-radius: 8px;
    }
    .rating-item {
      font-size: 13px;
    }
    .rating-label {
      color: #666;
      display: block;
      margin-bottom: 3px;
    }
    .rating-stars-blue { color: #3b82f6; }
    .rating-stars-purple { color: #9333ea; }
    .rating-stars-green { color: #10b981; }
    .rating-stars-orange { color: #f97316; }
    .review-text {
      background: white;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
      font-style: italic;
      border-left: 3px solid #e5e7eb;
    }
    .badges {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin: 15px 0;
    }
    .badge {
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-purple { background: #f3e8ff; color: #7e22ce; }
    .response {
      background: linear-gradient(135deg, #faf5ff 0%, #fce7f3 100%);
      padding: 15px;
      border-radius: 8px;
      margin-top: 15px;
      border-left: 4px solid #ec4899;
    }
    .response-header {
      font-weight: bold;
      color: #9333ea;
      margin-bottom: 8px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Raport Opinii</h1>
    <div class="subtitle">${
      companyData?.company_name || "Firma sprzątająca"
    }</div>
    <div class="subtitle">Wygenerowano: ${new Date().toLocaleDateString(
      "pl-PL",
      { year: "numeric", month: "long", day: "numeric" }
    )}</div>
  </div>

  <div class="stats">
    <div class="stat-item">
      <span class="stat-number">${stats.totalReviews}</span>
      <span class="stat-label">Wszystkie opinie</span>
    </div>
    <div class="stat-item">
      <span class="stat-number">${stats.averageRating.toFixed(1)}</span>
      <span class="stat-label">Średnia ocena</span>
    </div>
    <div class="stat-item">
      <span class="stat-number">${
        reviews.filter((r) => r.rating >= 4).length
      }</span>
      <span class="stat-label">Pozytywne opinie</span>
    </div>
  </div>

  ${reviews
    .map(
      (review, idx) => `
    <div class="review">
      <div class="review-header">
        <div>
          <div class="company-name">${review.employer.company_name}</div>
          <div class="review-date">${new Date(
            review.created_at
          ).toLocaleDateString("pl-PL", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}</div>
        </div>
        <div class="rating-main">
          ${stars(review.rating)} <strong>${review.rating}/5</strong>
        </div>
      </div>

      ${
        review.quality_rating ||
        review.communication_rating ||
        review.punctuality_rating ||
        review.safety_rating
          ? `
        <div class="detailed-ratings">
          ${
            review.safety_rating
              ? `
            <div class="rating-item">
              <span class="rating-label">Profesjonalizm</span>
              <span class="rating-stars-blue">${stars(
                review.safety_rating
              )}</span>
            </div>
          `
              : ""
          }
          ${
            review.quality_rating
              ? `
            <div class="rating-item">
              <span class="rating-label">Jakość usług</span>
              <span class="rating-stars-purple">${stars(
                review.quality_rating
              )}</span>
            </div>
          `
              : ""
          }
          ${
            review.communication_rating
              ? `
            <div class="rating-item">
              <span class="rating-label">Komunikacja</span>
              <span class="rating-stars-green">${stars(
                review.communication_rating
              )}</span>
            </div>
          `
              : ""
          }
          ${
            review.punctuality_rating
              ? `
            <div class="rating-item">
              <span class="rating-label">Terminowość</span>
              <span class="rating-stars-orange">${stars(
                review.punctuality_rating
              )}</span>
            </div>
          `
              : ""
          }
        </div>
      `
          : ""
      }

      <div class="review-text">
        "${review.review_text}"
      </div>

      <div class="badges">
        <span class="badge badge-blue">🏢 ${review.work_type}</span>
        <span class="badge badge-green">📅 ${new Date(
          review.work_date
        ).toLocaleDateString("pl-PL")}</span>
        ${
          review.would_recommend
            ? '<span class="badge badge-green">✓ Poleca</span>'
            : ""
        }
        <span class="badge badge-purple">✓ Zweryfikowana</span>
      </div>

      ${
        review.response_text
          ? `
        <div class="response">
          <div class="response-header">💬 Odpowiedź firmy:</div>
          <div>${review.response_text}</div>
          ${
            review.response_date
              ? `<div style="margin-top: 8px; font-size: 11px; color: #666;">${new Date(
                  review.response_date
                ).toLocaleDateString("pl-PL")}</div>`
              : ""
          }
        </div>
      `
          : ""
      }
    </div>
  `
    )
    .join("")}

  <div class="footer">
    <p><strong>${
      companyData?.company_name || "Firma"
    }</strong> • ZZP Werkplaats Platform</p>
    <p>Dokument zawiera ${
      reviews.length
    } opinii • Średnia ocena: ${stats.averageRating.toFixed(1)}/5.0</p>
  </div>
</body>
</html>
    `.trim();

    // Create blob and download
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `opinie_${(companyData?.company_name || "firma").replace(
      /\s+/g,
      "_"
    )}_${new Date().toISOString().split("T")[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Show success message
    alert(
      `✅ Pobrano raport opinii!\n\nPlik HTML można:\n• Otworzyć w przeglądarce i wydrukować jako PDF (Ctrl+P)\n• Zapisać jako PDF przez opcję drukowania\n\nZawiera ${reviews.length} opinii w profesjonalnym formacie.`
    );
  };

  const handleExportToCSV = () => {
    // Enhanced CSV with BOM for Excel Polish characters support
    const headers = [
      "Nr",
      "Data opinii",
      "Firma",
      "Ocena ogólna",
      "Profesjonalizm",
      "Jakość usług",
      "Komunikacja",
      "Terminowość",
      "Poleca",
      "Typ pracy",
      "Data pracy",
      "Treść opinii",
      "Odpowiedź firmy",
      "Data odpowiedzi",
    ];

    const rows = reviews.map((review, idx) => [
      idx + 1,
      new Date(review.created_at).toLocaleDateString("pl-PL"),
      `"${review.employer.company_name.replace(/"/g, '""')}"`,
      review.rating,
      review.safety_rating || "-",
      review.quality_rating || "-",
      review.communication_rating || "-",
      review.punctuality_rating || "-",
      review.would_recommend ? "Tak" : "Nie",
      `"${review.work_type.replace(/"/g, '""')}"`,
      new Date(review.work_date).toLocaleDateString("pl-PL"),
      `"${review.review_text.replace(/"/g, '""')}"`,
      review.response_text
        ? `"${review.response_text.replace(/"/g, '""')}"`
        : "-",
      review.response_date
        ? new Date(review.response_date).toLocaleDateString("pl-PL")
        : "-",
    ]);

    // Add summary row
    const avgRating = (
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    ).toFixed(1);
    const summaryRow = [
      "",
      "PODSUMOWANIE:",
      `${reviews.length} opinii`,
      avgRating,
      "",
      "",
      "",
      "",
      `${reviews.filter((r) => r.would_recommend).length} poleca`,
      "",
      "",
      "",
      "",
      "",
    ];

    const csvContent = [
      `Raport opinii - ${companyData?.company_name || "Firma"}`,
      `Wygenerowano: ${new Date().toLocaleString("pl-PL")}`,
      "", // empty line
      headers.join(";"),
      ...rows.map((row) => row.join(";")),
      "", // empty line
      summaryRow.join(";"),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `opinie_${(companyData?.company_name || "firma").replace(
      /\s+/g,
      "_"
    )}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Show success message
    alert(
      `✅ Pobrano plik CSV!\n\nPlik zawiera:\n• ${reviews.length} opinii\n• Wszystkie szczegółowe oceny\n• Odpowiedzi firmy\n• Podsumowanie statystyk\n\nOtwórz w Excel lub Google Sheets.`
    );
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 relative overflow-hidden">
      {/* 3D Background Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden perspective-container">
        <Animated3DProfileBackground role="cleaning_company" opacity={0.25} />
        <SpinningNumbers opacity={0.15} />
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex h-screen relative z-10">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <DashboardSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            title="🧹 Firma Sprzątająca"
            subtitle="Panel zarządzania"
            unreadMessages={messages.filter((m) => !m.is_read).length}
            onSupportClick={handleContactSupport}
          />
        )}

        {/* Mobile Navigation Drawer */}
        {isMobile && (
          <DashboardSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            title="🧹 Firma Sprzątająca"
            subtitle="Panel zarządzania"
            unreadMessages={messages.filter((m) => !m.is_read).length}
            isMobile={true}
            isMobileMenuOpen={isSidebarOpen}
            onMobileMenuToggle={() => setIsSidebarOpen(false)}
            onSupportClick={handleContactSupport}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header with Hamburger */}
          {isMobile && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white sticky top-0 z-40 shadow-lg flex-shrink-0">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold">
                    🧹 {companyData.company_name}
                  </h1>
                  {companyData.subscription_tier === "premium" && (
                    <span className="flex items-center gap-1 bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-bold">
                      <Crown className="w-3 h-3" />
                      Premium
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Otwórz menu"
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
              </div>
            </div>
          )}

          {/* Main scrollable content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {/* Welcome Banner - Desktop only */}
            {!isMobile && (
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-xl mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold">
                        Witajcie, {companyData.company_name}!
                      </h1>
                      {companyData.subscription_tier === "premium" ? (
                        <span className="flex items-center gap-1 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                          <Crown className="w-4 h-4" />
                          Premium Active
                        </span>
                      ) : (
                        <button
                          onClick={() => setActiveTab("subscription")}
                          className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-sm font-bold transition"
                        >
                          Upgrade to Premium →
                        </button>
                      )}
                    </div>
                    <p className="text-purple-100">
                      Panel informacyjny firmy sprzątającej
                      {companyData.subscription_status === "active" &&
                        companyData.subscription_tier === "premium" && (
                          <span className="ml-2 text-green-300">
                            • Subskrypcja aktywna
                          </span>
                        )}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm">
                      Przyjmowanie nowych klientów
                    </span>
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
            )}

            {/* Tab Panels */}
            <TabPanel isActive={activeTab === "profile"}>
              {/* Overview content merged into profile */}
              {/* Szybkie działania Card - Premium Glass Style */}
              <QuickActionsCard
                role="cleaning_company"
                isMobile={isMobile}
                onSubscription={handleViewSubscription}
              />

              {/* 📅 Nadchodzące spotkania - Real Calendar Events */}
              <div className="mb-6">
                <UpcomingEventsCard />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl p-4 shadow-sm border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600 mb-1">
                        Opinie łącznie
                      </p>
                      <p className="text-3xl font-bold text-orange-900">
                        {stats.totalReviews}
                      </p>
                    </div>
                    <span className="text-4xl">⭐</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl p-4 shadow-sm border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 mb-1">
                        Średnia ocena
                      </p>
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

                <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-4 shadow-sm border border-blue-200">
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

                <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-xl p-4 shadow-sm border border-green-200">
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

              {/* Profile Tab Content - NEW 2+1 LAYOUT */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN: MAIN CONTENT (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Availability + Blocked Dates (2 cards side by side) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Availability */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                      <h3 className="font-bold text-lg mb-4">
                        📅 Twoja dostępność
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Wybierz dni w których możesz przyjąć zlecenia
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
                            className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                          >
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-blue-600 rounded"
                              checked={
                                companyData.availability &&
                                typeof companyData.availability === "object" &&
                                day.key in companyData.availability
                                  ? (companyData.availability as any)[day.key]
                                  : false
                              }
                              onChange={(e) =>
                                handleAvailabilityChange(
                                  day.key,
                                  e.target.checked
                                )
                              }
                            />
                            <span className="text-sm text-gray-700">
                              {day.label}
                            </span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-600">Preferowane:</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {companyData.preferred_days_per_week || 2}{" "}
                            dni/tydzień
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Blocked Dates */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                      <h3 className="font-bold text-lg mb-4">
                        🚫 Zablokowane daty
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Zaznacz okresy niedostępności (urlop, przerwy)
                      </p>
                      <DateBlocker
                        blockedDates={blockedDates}
                        onBlock={handleBlockDate}
                        onUnblock={handleUnblockDate}
                      />
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">
                              Dostępne dni:
                            </p>
                            <p className="text-2xl font-bold text-blue-600">
                              {blockedDates.length > 0
                                ? Math.max(0, 30 - blockedDates.length)
                                : 30}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">
                              Zablokowane:
                            </p>
                            <p className="text-2xl font-bold text-red-600">
                              {blockedDates.length}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Company Info - Full Width */}
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <h3 className="font-bold text-lg mb-4">ℹ️ Dane firmy</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                            Kontakt
                          </p>
                          <p className="font-semibold text-gray-900">
                            {companyData.email || "Brak"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                            Telefon
                          </p>
                          <p className="font-semibold text-gray-900">
                            {companyData.phone || "Brak"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                            Miasto
                          </p>
                          <p className="font-semibold text-gray-900">
                            {companyData.location_city || "Brak"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                            Zespół
                          </p>
                          <p className="font-semibold text-gray-900">
                            {companyData.team_size || 1}{" "}
                            {companyData.team_size === 1 ? "osoba" : "osób"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                            Status
                          </p>
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Aktywny
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                            Preferencje
                          </p>
                          <p className="font-semibold text-gray-900">
                            {companyData.preferred_days_per_week || 2} dni/tydz.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-200 flex gap-3">
                      <button
                        onClick={() => setShowEditModal(true)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        📝 Edytuj profil
                      </button>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                        👁️ Podgląd publiczny
                      </button>
                    </div>
                  </div>

                  {/* Portfolio - Full Width */}
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg">
                        🎨 Portfolio (
                        {companyData.portfolio_images?.length || 0} zdjęć)
                      </h3>
                      <button
                        onClick={() => setShowPortfolioModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                      >
                        + Dodaj zdjęcia
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Pokazuj swoją pracę - dodaj zdjęcia ukończonych projektów
                    </p>
                    {companyData.portfolio_images &&
                    companyData.portfolio_images.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {companyData.portfolio_images
                          ?.slice(0, 4)
                          .map((img: string, i: number) => (
                            <img
                              key={i}
                              src={img}
                              alt={`Portfolio ${i + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:scale-105 transition-transform cursor-pointer"
                            />
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <p className="text-4xl mb-2">📷</p>
                        <p className="text-sm text-gray-500">
                          Brak zdjęć w portfolio
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN: SIDEBAR (1/3 width) */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Profile Card */}
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <h3 className="font-bold text-lg mb-4">📸 Profil firmy</h3>
                    <div className="text-center">
                      <div className="relative inline-block mb-4">
                        <img
                          src={companyData.avatar_url || "/default-avatar.png"}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-purple-200 shadow-lg"
                        />
                      </div>
                      <h4 className="font-bold text-lg text-gray-900 mb-1">
                        {companyData.company_name || "Firma Sprzątająca"}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {companyData.email || "kontakt@firma.nl"}
                      </p>
                      <p className="text-xs text-blue-600 mb-4 hover:underline cursor-pointer">
                        zzp-werkplaats.nl/firma/{companyData.id || "profil"}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowEditModal(true)}
                          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                        >
                          Edytuj
                        </button>
                        <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
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
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Powiadomienia */}
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg">🔔 Powiadomienia</h3>
                      <div className="flex items-center gap-2">
                        {notifications.filter((n) => !n.is_read).length > 0 && (
                          <>
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                              {notifications.filter((n) => !n.is_read).length}{" "}
                              nowe
                            </span>
                            <button
                              onClick={() => {
                                notifications
                                  .filter((n) => !n.is_read)
                                  .forEach((n) =>
                                    handleMarkNotificationAsRead(n.id)
                                  );
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Oznacz wszystkie
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => {
                          // Ikona i kolor według typu
                          const getNotificationStyle = (type: string) => {
                            switch (type) {
                              case "message":
                                return {
                                  icon: "📩",
                                  color: "border-blue-500 bg-blue-50",
                                  badge: "bg-blue-500",
                                };
                              case "review":
                                return {
                                  icon: "⭐",
                                  color: "border-yellow-500 bg-yellow-50",
                                  badge: "bg-yellow-500",
                                };
                              case "job":
                                return {
                                  icon: "💼",
                                  color: "border-green-500 bg-green-50",
                                  badge: "bg-green-500",
                                };
                              case "alert":
                                return {
                                  icon: "⚠️",
                                  color: "border-red-500 bg-red-50",
                                  badge: "bg-red-500",
                                };
                              default:
                                return {
                                  icon: "🔔",
                                  color: "border-gray-500 bg-gray-50",
                                  badge: "bg-gray-500",
                                };
                            }
                          };

                          // Relatywny czas
                          const getTimeAgo = (date: string) => {
                            const now = new Date();
                            const created = new Date(date);
                            const diffMs = now.getTime() - created.getTime();
                            const diffMins = Math.floor(diffMs / 60000);
                            const diffHours = Math.floor(diffMs / 3600000);
                            const diffDays = Math.floor(diffMs / 86400000);

                            if (diffMins < 1) return "Przed chwilą";
                            if (diffMins < 60) return `${diffMins} min temu`;
                            if (diffHours < 24)
                              return `${diffHours} godz. temu`;
                            if (diffDays < 7) return `${diffDays} dni temu`;
                            return created.toLocaleDateString("pl-PL");
                          };

                          const style = getNotificationStyle(notif.type);

                          return (
                            <div
                              key={notif.id}
                              className={`border-l-4 rounded-r-lg p-3 transition-all hover:shadow-md ${
                                notif.is_read ? "opacity-60" : ""
                              } ${style.color}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="text-2xl">{style.icon}</span>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      {!notif.is_read && (
                                        <span
                                          className={`w-2 h-2 rounded-full ${style.badge}`}
                                        ></span>
                                      )}
                                      <p
                                        className={`font-semibold text-sm ${
                                          !notif.is_read
                                            ? "text-gray-900"
                                            : "text-gray-600"
                                        }`}
                                      >
                                        {notif.title}
                                      </p>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-2">
                                      {notif.message}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {getTimeAgo(notif.created_at)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  {!notif.is_read && (
                                    <button
                                      onClick={() =>
                                        handleMarkNotificationAsRead(notif.id)
                                      }
                                      className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                                    >
                                      ✓ Przeczytane
                                    </button>
                                  )}
                                  {notif.link && (
                                    <button
                                      onClick={() => navigate(notif.link!)}
                                      className="text-xs text-gray-600 hover:text-gray-800 font-medium whitespace-nowrap"
                                    >
                                      Zobacz →
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-4xl mb-2">🔕</p>
                          <p className="text-sm text-gray-500">
                            Brak powiadomień
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>

            {/* Reviews Tab */}
            <TabPanel isActive={activeTab === "reviews"}>
              <div className="max-w-6xl mx-auto space-y-6">
                {/* Header with stats */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-xl">
                  <h2 className="text-3xl font-bold mb-4">
                    ⭐ Opinie od klientów
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-sm opacity-90 mb-1">
                        Wszystkie opinie
                      </p>
                      <p className="text-4xl font-bold">{stats.totalReviews}</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-sm opacity-90 mb-1">Średnia ocena</p>
                      <p className="text-4xl font-bold">
                        {stats.averageRating > 0
                          ? stats.averageRating.toFixed(1)
                          : "0.0"}{" "}
                        / 5.0
                      </p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-sm opacity-90 mb-1">
                        Pozytywne opinie
                      </p>
                      <p className="text-4xl font-bold">
                        {reviews.filter((r) => r.rating >= 4).length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rating breakdown */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="font-bold text-lg mb-4">📊 Rozkład ocen</h3>
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = reviews.filter(
                        (r) => r.rating === rating
                      ).length;
                      const percentage =
                        stats.totalReviews > 0
                          ? (count / stats.totalReviews) * 100
                          : 0;
                      return (
                        <div key={rating} className="flex items-center gap-3">
                          <span className="text-sm font-medium w-12">
                            {rating} ⭐
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-16 text-right">
                            {count} ({percentage.toFixed(0)}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Filters and sorting */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        Filtruj:
                      </span>
                      <button
                        onClick={() => setReviewFilter("all")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          reviewFilter === "all"
                            ? "bg-purple-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Wszystkie
                      </button>
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <button
                          key={rating}
                          onClick={() =>
                            setReviewFilter(rating as 1 | 2 | 3 | 4 | 5)
                          }
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            reviewFilter === rating
                              ? "bg-purple-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {rating} ⭐
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        Sortuj:
                      </span>
                      <select
                        value={reviewSort}
                        onChange={(e) => setReviewSort(e.target.value as any)}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 border-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="newest">Najnowsze</option>
                        <option value="oldest">Najstarsze</option>
                        <option value="highest">Najwyżej ocenione</option>
                        <option value="lowest">Najniżej ocenione</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Reviews list */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="font-bold text-lg mb-6">💬 Opinie klientów</h3>
                  <div className="space-y-6">
                    {(() => {
                      let filteredReviews = reviews.filter((r) =>
                        reviewFilter === "all"
                          ? true
                          : r.rating === reviewFilter
                      );

                      // Sort reviews
                      filteredReviews.sort((a, b) => {
                        switch (reviewSort) {
                          case "newest":
                            return (
                              new Date(b.created_at).getTime() -
                              new Date(a.created_at).getTime()
                            );
                          case "oldest":
                            return (
                              new Date(a.created_at).getTime() -
                              new Date(b.created_at).getTime()
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
                      const displayReviews = showAllReviews
                        ? filteredReviews
                        : filteredReviews.slice(0, 5);

                      if (displayReviews.length === 0) {
                        return (
                          <div className="text-center py-12">
                            <div className="text-6xl mb-4">📭</div>
                            <p className="text-lg text-gray-600 mb-2">
                              Brak opinii w tej kategorii
                            </p>
                            <p className="text-sm text-gray-500">
                              {reviewFilter === "all"
                                ? "Nie masz jeszcze żadnych opinii"
                                : `Nie masz opinii z oceną ${reviewFilter} ⭐`}
                            </p>
                          </div>
                        );
                      }

                      return (
                        <>
                          {displayReviews.map((review) => (
                            <div
                              key={review.id}
                              className="border-l-4 border-purple-500 bg-gray-50 rounded-r-xl p-6 hover:shadow-lg transition-shadow"
                            >
                              {/* Review header */}
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  {review.employer?.avatar_url ? (
                                    <img
                                      src={review.employer.avatar_url}
                                      alt={review.employer.company_name}
                                      className="w-12 h-12 rounded-full object-cover border-2 border-purple-300"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                        const sibling = e.currentTarget
                                          .nextElementSibling as HTMLElement;
                                        if (sibling)
                                          sibling.style.display = "flex";
                                      }}
                                    />
                                  ) : null}
                                  <div
                                    className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg"
                                    style={{
                                      display: review.employer?.avatar_url
                                        ? "none"
                                        : "flex",
                                    }}
                                  >
                                    {review.employer?.company_name?.[0]?.toUpperCase() ||
                                      "?"}
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900">
                                      {review.employer?.company_name || "Firma"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(
                                        review.created_at
                                      ).toLocaleDateString("pl-PL", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      })}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end">
                                  <div className="flex text-yellow-400 text-xl mb-1">
                                    {"★★★★★".split("").map((star, i) => (
                                      <span
                                        key={i}
                                        className={
                                          i < review.rating ? "" : "opacity-20"
                                        }
                                      >
                                        {star}
                                      </span>
                                    ))}
                                  </div>
                                  <span className="text-sm font-bold text-gray-700">
                                    {review.rating}/5
                                  </span>
                                </div>
                              </div>

                              {/* Detailed ratings */}
                              {(review.quality_rating ||
                                review.communication_rating ||
                                review.punctuality_rating ||
                                review.safety_rating) && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                  {review.quality_rating && (
                                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                                      <p className="text-xs text-gray-600 mb-1">
                                        Jakość usług
                                      </p>
                                      <div className="flex text-purple-500 text-sm">
                                        {"★★★★★".split("").map((star, i) => (
                                          <span
                                            key={i}
                                            className={
                                              i < review.quality_rating!
                                                ? ""
                                                : "opacity-20"
                                            }
                                          >
                                            {star}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {review.communication_rating && (
                                    <div className="bg-white rounded-lg p-3 border border-green-200">
                                      <p className="text-xs text-gray-600 mb-1">
                                        Komunikacja
                                      </p>
                                      <div className="flex text-green-500 text-sm">
                                        {"★★★★★".split("").map((star, i) => (
                                          <span
                                            key={i}
                                            className={
                                              i < review.communication_rating!
                                                ? ""
                                                : "opacity-20"
                                            }
                                          >
                                            {star}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {review.punctuality_rating && (
                                    <div className="bg-white rounded-lg p-3 border border-orange-200">
                                      <p className="text-xs text-gray-600 mb-1">
                                        Terminowość
                                      </p>
                                      <div className="flex text-orange-500 text-sm">
                                        {"★★★★★".split("").map((star, i) => (
                                          <span
                                            key={i}
                                            className={
                                              i < review.punctuality_rating!
                                                ? ""
                                                : "opacity-20"
                                            }
                                          >
                                            {star}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {review.safety_rating && (
                                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                                      <p className="text-xs text-gray-600 mb-1">
                                        Profesjonalizm
                                      </p>
                                      <div className="flex text-blue-500 text-sm">
                                        {"★★★★★".split("").map((star, i) => (
                                          <span
                                            key={i}
                                            className={
                                              i < review.safety_rating!
                                                ? ""
                                                : "opacity-20"
                                            }
                                          >
                                            {star}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Review content */}
                              <div className="mb-4">
                                <p className="text-gray-800 leading-relaxed">
                                  {review.review_text}
                                </p>
                              </div>

                              {/* Review metadata */}
                              <div className="flex flex-wrap gap-3 text-xs mb-4">
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                                  🏢 {review.work_type}
                                </span>
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                                  📅{" "}
                                  {new Date(
                                    review.work_date
                                  ).toLocaleDateString("pl-PL")}
                                </span>
                                {review.would_recommend && (
                                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                                    ✓ Poleca
                                  </span>
                                )}
                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                                  ✓ Zweryfikowana opinia
                                </span>
                              </div>

                              {/* Company response */}
                              {review.response_text && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                        {companyData?.company_name?.[0]?.toUpperCase() ||
                                          "F"}
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-purple-900">
                                          Odpowiedź firmy
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {review.response_date &&
                                            new Date(
                                              review.response_date
                                            ).toLocaleDateString("pl-PL")}
                                        </p>
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-800">
                                      {review.response_text}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Show more button */}
                          {filteredReviews.length > 5 && (
                            <div className="text-center pt-4">
                              <button
                                onClick={() =>
                                  setShowAllReviews(!showAllReviews)
                                }
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
                              >
                                {showAllReviews
                                  ? "Pokaż mniej"
                                  : `Pokaż wszystkie (${
                                      filteredReviews.length - 5
                                    } więcej)`}
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Export section */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="font-bold text-lg mb-4">📥 Eksport opinii</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Pobierz profesjonalny raport wszystkich opinii w formacie
                    PDF (HTML) lub arkusz kalkulacyjny CSV.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={handleExportToPDF}
                      className="px-6 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-medium hover:from-red-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">
                        📄
                      </span>
                      <div className="text-left">
                        <div className="font-bold">Raport PDF (HTML)</div>
                        <div className="text-xs opacity-90">
                          Profesjonalny dokument do druku
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={handleExportToCSV}
                      className="px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">
                        📊
                      </span>
                      <div className="text-left">
                        <div className="font-bold">Arkusz CSV</div>
                        <div className="text-xs opacity-90">
                          Excel, Sheets, analiza danych
                        </div>
                      </div>
                    </button>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-800">
                      💡 <strong>Wskazówka:</strong> Plik HTML można otworzyć w
                      przeglądarce i zapisać jako PDF przez Ctrl+P (Drukuj →
                      Zapisz jako PDF)
                    </p>
                  </div>
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
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
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
                                const isOwnMessage = msg.sender_id === user!.id;
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
                            Kliknij na konwersację po lewej stronie, aby
                            rozpocząć czat
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>

            {/* Portfolio Tab */}
            <TabPanel isActive={activeTab === "portfolio"}>
              <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">
                        🎨 Portfolio Zdjęć
                      </h2>
                      <p className="text-purple-100">
                        Pokaż pracodawcom swoje najlepsze realizacje
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-5xl font-bold">
                        {companyData?.portfolio_images?.length || 0}
                      </p>
                      <p className="text-sm opacity-90">zdjęć w galerii</p>
                    </div>
                  </div>
                </div>

                {/* Upload section */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-lg mb-1">
                        📸 Zarządzaj galerią
                      </h3>
                      <p className="text-sm text-gray-600">
                        Dodaj zdjęcia swoich realizacji, aby przyciągnąć więcej
                        klientów
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPortfolioModal(true)}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <span className="text-xl">➕</span>
                      Dodaj zdjęcia
                    </button>
                  </div>

                  {/* Portfolio grid */}
                  {companyData?.portfolio_images &&
                  companyData.portfolio_images.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {companyData.portfolio_images.map((image, index) => (
                        <div
                          key={index}
                          className="group relative aspect-square overflow-hidden rounded-xl shadow-md hover:shadow-2xl transition-all duration-300"
                        >
                          <img
                            src={image}
                            alt={`Portfolio ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <p className="text-white font-medium">
                                Zdjęcie {index + 1}
                              </p>
                              <p className="text-white/80 text-xs">
                                Kliknij, aby powiększyć
                              </p>
                            </div>
                          </div>
                          {/* Zoom button */}
                          <button
                            onClick={() => window.open(image, "_blank")}
                            className="absolute top-2 right-2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-lg"
                          >
                            <span className="text-xl">🔍</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="text-8xl mb-4">🖼️</div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        Brak zdjęć w portfolio
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Dodaj zdjęcia swoich najlepszych realizacji, aby pokazać
                        pracodawcom jakość Twojej pracy
                      </p>
                      <button
                        onClick={() => setShowPortfolioModal(true)}
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl text-lg"
                      >
                        ➕ Dodaj pierwsze zdjęcia
                      </button>
                    </div>
                  )}
                </div>

                {/* Tips section */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-purple-200">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <span className="text-2xl">💡</span>
                    Wskazówki dotyczące portfolio
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex gap-3">
                      <span className="text-2xl flex-shrink-0">📷</span>
                      <div>
                        <p className="font-medium text-gray-900">
                          Dobra jakość zdjęć
                        </p>
                        <p className="text-sm text-gray-600">
                          Używaj zdjęć w wysokiej rozdzielczości, dobrze
                          oświetlonych
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-2xl flex-shrink-0">🎯</span>
                      <div>
                        <p className="font-medium text-gray-900">
                          Pokazuj rezultaty
                        </p>
                        <p className="text-sm text-gray-600">
                          Zdjęcia przed i po wykonaniu usługi działają najlepiej
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-2xl flex-shrink-0">🌟</span>
                      <div>
                        <p className="font-medium text-gray-900">
                          Różnorodność
                        </p>
                        <p className="text-sm text-gray-600">
                          Pokaż różne typy pomieszczeń i usług
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-2xl flex-shrink-0">🔄</span>
                      <div>
                        <p className="font-medium text-gray-900">
                          Aktualizuj regularnie
                        </p>
                        <p className="text-sm text-gray-600">
                          Dodawaj nowe realizacje co 2-4 tygodnie
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                        👁️
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Wyświetlenia profilu
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.profileViews}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                        ⭐
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Średnia ocena</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.averageRating > 0
                            ? stats.averageRating.toFixed(1)
                            : "0.0"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-2xl">
                        📞
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Zapytania kontaktowe
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.contactAttempts}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>

            {/* Tablica Tab */}
            <TabPanel isActive={activeTab === "tablica"}>
              <FeedPage />
            </TabPanel>

            <TabPanel isActive={activeTab === "saved_activity"}>
              <SavedActivity />
            </TabPanel>

            {/* Team Membership Tab */}
            <TabPanel isActive={activeTab === "team"}>
              {user?.id && (
                <TeamMembershipTab
                  profileId={user.id}
                  memberType="cleaning_company"
                />
              )}
            </TabPanel>

            {/* My Profile Preview Tab */}
            <TabPanel isActive={activeTab === "my_profile"}>
              <MyProfilePreview role="cleaning_company" />
            </TabPanel>

            {/* Settings Tab */}
            <TabPanel isActive={activeTab === "settings"}>
              <CleaningCompanySettingsPanel
                companyData={companyData}
                blockedDates={blockedDates}
                notificationSettings={notificationSettings}
                privacySettings={privacySettings}
                saving={settingsSaving}
                onAvatarUpload={handleAvatarUpload}
                onCoverImageUpload={handleCoverImageUploadSuccess}
                onNotificationSettingsChange={setNotificationSettings}
                onNotificationSettingsSave={handleNotificationSettingsSave}
                onPrivacySettingsChange={setPrivacySettings}
                onPrivacySettingsSave={handlePrivacySettingsSave}
                onCompanyDataSave={handleCompanyDataSave}
                onAvailabilityChange={handleAvailabilityChange}
                onBlockDate={handleBlockDate}
                onUnblockDate={handleUnblockDate}
              />
            </TabPanel>

            {/* Subscription Tab */}
            <TabPanel isActive={activeTab === "subscription"}>
              <CleaningCompanySubscriptionSelectionPage />
            </TabPanel>

            {/* NOTE: Kilometers and Calendar tabs removed - they are only in /faktury module */}

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
};

export default CleaningCompanyDashboard;

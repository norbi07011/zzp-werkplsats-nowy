import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSidebar } from "../contexts/SidebarContext";
import { supabase } from "../src/lib/supabase";
import { toast } from "sonner";
import { Briefcase, FileText, CheckCircle, Mail } from "lucide-react";
import {
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon,
  BriefcaseIcon,
} from "../components/icons";
import CreateServiceRequestModal from "../components/CreateServiceRequestModal";
import { DashboardSidebar } from "../components/DashboardSidebar";
import { RegularUserSubscriptionPanel } from "../components/RegularUserSubscriptionPanel";
import { RegularUserUpgradeModal } from "../components/RegularUserUpgradeModal";
import { SupportTicketModal } from "../src/components/SupportTicketModal";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import type { UnifiedTab } from "../components/UnifiedDashboardTabs";
import { uploadAvatar } from "../src/services/storage";
import { StatChipsGrid, StatChipItem } from "../components/StatChips";

interface RegularUserData {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  city: string | null;
  postal_code: string | null;
  address: string | null;
  is_premium: boolean | null;
  subscription_end_date: string | null;
  requests_this_month: number | null;
  free_requests_limit: number | null;
  avatar_url: string | null; // ✅ Dodane pole dla zdjęcia profilowego
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

interface ServiceRequest {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  price: number | null;
  city: string | null;
  urgency: string | null;
  request_date: string | null;
  images: string[] | null;
  created_at: string;
  responses_count: number;
  contact_method: string | null;
  author_name: string;
  author_avatar: string | null;
  author_phone: string | null;
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
  if (diffMins < 60) return `${diffMins}m temu`;
  if (diffHours < 24) return `${diffHours}h temu`;
  if (diffDays < 7) return `${diffDays}d temu`;
  return date.toLocaleDateString("pl-PL");
};

export default function RegularUserDashboard() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<RegularUserData | null>(null);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  const { isSidebarOpen, closeSidebar } = useSidebar();

  // Sidebar & navigation state
  const [activeTab, setActiveTab] = useState<UnifiedTab>("overview");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    postal_code: "",
    city: "",
  });

  // Settings state
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    "profile" | "account" | "notifications" | "privacy" | "language"
  >("profile");
  const [notificationSettings, setNotificationSettings] = useState({
    email_service_requests: true,
    email_messages: true,
    email_marketing: false,
    push_service_requests: true,
    push_messages: true,
    sms_urgent: false,
  });
  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: "public" as "public" | "private",
    show_phone: true,
    show_email: false,
    show_address: false,
  });

  // ===================================================================
  // MESSENGER STATE
  // ===================================================================
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  // Load messages when userData changes and user is premium
  useEffect(() => {
    if (user?.id && userData?.is_premium) {
      loadMessages(user.id);
    }
  }, [user?.id, userData?.is_premium]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Pobierz dane użytkownika z regular_users
      if (!user?.id) {
        console.error("[DASHBOARD] No user ID");
        return;
      }

      // Użyj 'as any' aby ominąć TypeScript cache dla regular_users
      const supabaseAny = supabase as any;
      const { data: regularUserData, error: userError } = await supabaseAny
        .from("regular_users")
        .select("*")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (userError) {
        console.error("[DASHBOARD] Error loading user data:", userError);
        toast.error("Błąd ładowania danych użytkownika");
      } else {
        setUserData(regularUserData);
        // Initialize profile form
        setProfileForm({
          first_name: regularUserData?.first_name || "",
          last_name: regularUserData?.last_name || "",
          phone: regularUserData?.phone || "",
          address: regularUserData?.address || "",
          postal_code: regularUserData?.postal_code || "",
          city: regularUserData?.city || "",
        });
      }

      // Pobierz zlecenia użytkownika (posty typu request)
      // Posty service request mają wypełnione request_category
      const { data: posts, error: postsError } = await (supabase as any)
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
          profile_id,
          profiles!posts_profile_id_fkey (
            id,
            full_name,
            avatar_url,
            phone
          )
        `
        )
        .eq("author_id", user.id)
        .not("request_category", "is", null)
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error(
          "[DASHBOARD] Error loading service requests:",
          postsError
        );
        toast.error("Błąd ładowania zleceń");
      } else {
        // Map data with author info from profiles join
        const mappedPosts =
          posts?.map((post: any) => ({
            id: post.id,
            title: post.title,
            description: post.content,
            category: post.request_category,
            status: post.request_status || "open",
            price: post.request_budget_min || post.request_budget_max,
            city: post.request_location,
            urgency: post.request_urgency,
            request_date: post.request_preferred_date,
            images: post.media_urls || [],
            created_at: post.created_at,
            responses_count: post.request_responses_count || 0,
            contact_method: post.request_contact_method,
            // Author data from profiles join
            author_name: post.profiles?.full_name || "Nieznany",
            author_avatar: post.profiles?.avatar_url || null,
            author_phone: post.profiles?.phone || null,
          })) || [];

        setServiceRequests(mappedPosts);
      }
    } catch (error) {
      console.error("[DASHBOARD] Unexpected error:", error);
      toast.error("Wystąpił nieoczekiwany błąd");
    } finally {
      setIsLoading(false);
    }
  };

  // ===================================================================
  // LOAD MESSAGES - BIDIRECTIONAL QUERY WITH PROFILES
  // ===================================================================
  const loadMessages = async (userId: string) => {
    if (!userData?.is_premium) {
      console.log("[MESSAGES] Skipping load - user not premium");
      return; // Only load for premium users
    }

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

      console.log("[MESSAGES] Loaded:", data?.length || 0);

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

      const grouped = groupMessagesByConversation(typedMessages, userId);
      setConversations(grouped);
      setMessages(typedMessages);

      const totalUnread = typedMessages.filter(
        (msg) => msg.recipient_id === userId && !msg.is_read
      ).length;
      setUnreadCount(totalUnread);
    } catch (err) {
      console.error("[MESSAGES] Error loading:", err);
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

    if (conversation.unreadCount > 0 && user?.id) {
      await handleMarkConversationAsRead(conversation.partnerId);
    }
  };

  const handleMarkConversationAsRead = async (partnerId: string) => {
    if (!user?.id) return;

    try {
      const messagesToMark = conversations
        .find((c) => c.partnerId === partnerId)
        ?.messages.filter((msg) => msg.recipient_id === user.id && !msg.is_read)
        .map((msg) => msg.id);

      if (!messagesToMark || messagesToMark.length === 0) return;

      const { error } = await (supabase as any)
        .from("messages")
        .update({ is_read: true })
        .in("id", messagesToMark);

      if (error) throw error;

      await loadMessages(user.id);
    } catch (err) {
      console.error("[MESSAGES] Error marking as read:", err);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !messageInput.trim() || !user?.id) return;

    const currentPartnerId = selectedConversation.partnerId;

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

      toast.success("✅ Wiadomość wysłana!");
      setMessageInput("");
      setShowEmojiPicker(false);

      await loadMessages(user.id);

      setTimeout(() => {
        const updatedConversation = conversations.find(
          (conv) => conv.partnerId === currentPartnerId
        );
        if (updatedConversation) {
          setSelectedConversation(updatedConversation);
        }
      }, 100);
    } catch (err) {
      console.error("[MESSAGES] Error sending:", err);
      toast.error("❌ Błąd podczas wysyłania wiadomości");
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

    setUploadingFile(true);
    try {
      console.log("[UPLOAD] File selected:", file.name);
      toast.info("📎 Upload plików będzie wkrótce dostępny!");
    } catch (err) {
      console.error("[UPLOAD] Error:", err);
    } finally {
      setUploadingFile(false);
    }
  };

  // ===================================================================
  // AVATAR UPLOAD HANDLERS
  // ===================================================================

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      console.log("[AVATAR] Uploading:", file.name);
      toast.loading("📤 Uploading zdjęcia profilowego...");

      // Upload do Supabase Storage
      const uploadResult = await uploadAvatar(file, user.id);

      if (!uploadResult.success) {
        toast.error(uploadResult.error || "❌ Błąd uploadu");
        return;
      }

      console.log("[AVATAR] Uploaded:", uploadResult.url);

      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          avatar_url: uploadResult.url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) {
        console.error("[AVATAR] Profile update error:", profileError);
        toast.error("❌ Błąd aktualizacji profilu");
        return;
      }

      // Update regular_users table (if exists)
      const supabaseAny = supabase as any;
      const { error: regularUserError } = await supabaseAny
        .from("regular_users")
        .update({
          avatar_url: uploadResult.url,
          updated_at: new Date().toISOString(),
        })
        .eq("profile_id", user.id);

      if (regularUserError) {
        console.warn(
          "[AVATAR] regular_users update warning:",
          regularUserError
        );
        // Don't throw - profiles is main table
      }

      // Update local state
      setUserData((prev) =>
        prev ? { ...prev, avatar_url: uploadResult.url || null } : prev
      );

      toast.dismiss();
      toast.success("✅ Zdjęcie profilowe zaktualizowane!");
    } catch (err: any) {
      console.error("[AVATAR] Upload error:", err);
      toast.dismiss();
      toast.error("❌ Wystąpił błąd podczas uploadu");
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.id || !userData?.avatar_url) return;

    if (!confirm("Czy na pewno chcesz usunąć zdjęcie profilowe?")) return;

    try {
      console.log("[AVATAR] Removing...");

      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Update regular_users table
      const supabaseAny = supabase as any;
      await supabaseAny
        .from("regular_users")
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("profile_id", user.id);

      // Update local state
      setUserData((prev) => (prev ? { ...prev, avatar_url: null } : prev));

      toast.success("✅ Zdjęcie profilowe usunięte!");
    } catch (err: any) {
      console.error("[AVATAR] Remove error:", err);
      toast.error("❌ Błąd usuwania zdjęcia");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <ClockIcon className="w-5 h-5 text-blue-500" />;
      case "completed":
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case "cancelled":
        return <XMarkIcon className="w-5 h-5 text-red-500" />;
      default:
        return <BriefcaseIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Aktywne";
      case "completed":
        return "Ukończone";
      case "cancelled":
        return "Anulowane";
      default:
        return status;
    }
  };

  const canCreateRequest = () => {
    if (!userData) return false;
    if (userData.is_premium) return true;
    const requestsThisMonth = userData.requests_this_month ?? 0;
    const freeLimit = userData.free_requests_limit ?? 3;
    return requestsThisMonth < freeLimit;
  };

  const handleCreateRequest = () => {
    if (!canCreateRequest()) {
      toast.error("Osiągnięto limit darmowych zleceń. Przejdź na Premium!");
      setIsUpgradeModalOpen(true);
      return;
    }
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    // Przeładuj dane po utworzeniu zlecenia
    loadDashboardData();
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    try {
      setIsEditingProfile(true);

      // Użyj 'as any' aby ominąć TypeScript cache
      const supabaseAny = supabase as any;

      // Update regular_users
      const { error: regularUsersError } = await supabaseAny
        .from("regular_users")
        .update({
          first_name: profileForm.first_name || null,
          last_name: profileForm.last_name || null,
          phone: profileForm.phone || null,
          address: profileForm.address || null,
          postal_code: profileForm.postal_code || null,
          city: profileForm.city || null,
          updated_at: new Date().toISOString(),
        })
        .eq("profile_id", user.id);

      if (regularUsersError) {
        console.error(
          "[PROFILE] Error updating regular_users:",
          regularUsersError
        );
        toast.error("Błąd zapisywania danych");
        return;
      }

      // Update profiles (phone)
      const { error: profilesError } = await supabase
        .from("profiles")
        .update({
          phone: profileForm.phone || null,
          full_name:
            `${profileForm.first_name || ""} ${
              profileForm.last_name || ""
            }`.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profilesError) {
        console.error("[PROFILE] Error updating profiles:", profilesError);
        toast.error("Błąd aktualizacji profilu");
        return;
      }

      toast.success("✅ Profil zapisany!");
      loadDashboardData(); // Reload
    } catch (error) {
      console.error("[PROFILE] Unexpected error:", error);
      toast.error("Wystąpił nieoczekiwany błąd");
    } finally {
      setIsEditingProfile(false);
    }
  };

  // ===== ACTION HANDLERS =====

  const handleEditRequest = (requestId: string) => {
    setEditingRequestId(requestId);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!user?.id) {
      toast.error("Błąd autoryzacji");
      return;
    }

    if (!confirm("Czy na pewno chcesz usunąć to zlecenie?")) {
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from("posts")
        .delete()
        .eq("id", requestId)
        .eq("author_id", user.id);

      if (error) {
        console.error("[DELETE] Error deleting request:", error);
        toast.error("Błąd usuwania zlecenia");
        return;
      }

      toast.success("✅ Zlecenie usunięte!");
      loadDashboardData(); // Reload list
    } catch (error) {
      console.error("[DELETE] Unexpected error:", error);
      toast.error("Wystąpił nieoczekiwany błąd");
    }
  };

  const handleViewRequest = (requestId: string) => {
    // Przekierowanie do strony szczegółów zlecenia
    window.location.href = `/request/${requestId}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ===== RENDER FUNCTIONS FOR EACH TAB =====

  const renderOverview = () => (
    <>
      {/* Stats Cards - Premium StatChips */}
      <StatChipsGrid
        items={
          [
            {
              id: "requests",
              label: "Requests This Month",
              value: userData?.is_premium
                ? `${userData?.requests_this_month || 0} ∞`
                : `${userData?.requests_this_month || 0}/${
                    userData?.free_requests_limit || 3
                  }`,
              tone: "cyan",
              icon: <Briefcase size={16} />,
              hint: userData?.is_premium ? "Unlimited" : undefined,
            },
            {
              id: "total",
              label: "All Requests",
              value: serviceRequests.length,
              tone: "slate",
              icon: <FileText size={16} />,
            },
            {
              id: "offers",
              label: "Received Offers",
              value: serviceRequests.reduce(
                (sum, req) => sum + req.responses_count,
                0
              ),
              tone: "emerald",
              icon: <CheckCircle size={16} />,
            },
            {
              id: "messages",
              label: "New Messages",
              value: 0,
              tone: "violet",
              icon: <Mail size={16} />,
            },
          ] as StatChipItem[]
        }
        columns={4}
        className="mb-8"
      />

      {/* Freemium Alert */}
      {!userData?.is_premium &&
        userData &&
        (userData.requests_this_month ?? 0) >=
          (userData.free_requests_limit ?? 3) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <BriefcaseIcon className="w-6 h-6 text-yellow-600 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-900">
                  Osiągnięto limit darmowych zleceń
                </h3>
                <p className="text-yellow-700 mt-2">
                  Wykorzystałeś wszystkie {userData.free_requests_limit ?? 3}{" "}
                  darmowe zlecenia w tym miesiącu. Przejdź na Premium, aby
                  publikować nieograniczoną liczbę zleceń!
                </p>
                <button
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Przejdź na Premium (€9.99/mies.)
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Service Requests List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Twoje zlecenia
          </h2>
        </div>

        {serviceRequests.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <BriefcaseIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-4">
              Nie masz jeszcze żadnych zleceń
            </p>
            <button
              onClick={handleCreateRequest}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              ➕ Utwórz pierwsze zlecenie
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {serviceRequests.map((request) => (
              <div
                key={request.id}
                className="px-6 py-6 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex gap-6">
                  {/* Zdjęcie zlecenia */}
                  <div className="flex-shrink-0">
                    {request.images && request.images.length > 0 ? (
                      <img
                        src={request.images[0]}
                        alt={request.title}
                        className="w-32 h-32 object-cover rounded-lg shadow-md"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                        <BriefcaseIcon className="w-16 h-16 text-blue-400" />
                      </div>
                    )}
                  </div>

                  {/* Treść zlecenia */}
                  <div className="flex-1 min-w-0">
                    {/* Header z tytułem i statusem */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {request.title}
                        </h3>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                            {request.category}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full font-medium ${
                              request.status === "active"
                                ? "bg-green-100 text-green-800"
                                : request.status === "completed"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {getStatusText(request.status)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg text-sm font-semibold">
                          {request.responses_count} ofert
                        </span>
                      </div>
                    </div>

                    {/* Opis */}
                    {request.description && (
                      <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                        {request.description}
                      </p>
                    )}

                    {/* Metadane - cena, miasto, pilność, data */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {/* Cena */}
                      {request.price && (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-green-600 font-bold text-lg">
                              €
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Budżet</p>
                            <p className="text-sm font-semibold text-gray-900">
                              €{request.price}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Miasto */}
                      {request.city && (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-4 h-4 text-blue-600"
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
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Lokalizacja</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {request.city}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Pilność */}
                      {request.urgency && (
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              request.urgency === "urgent"
                                ? "bg-red-100"
                                : request.urgency === "normal"
                                ? "bg-yellow-100"
                                : "bg-gray-100"
                            }`}
                          >
                            <ClockIcon
                              className={`w-4 h-4 ${
                                request.urgency === "urgent"
                                  ? "text-red-600"
                                  : request.urgency === "normal"
                                  ? "text-yellow-600"
                                  : "text-gray-600"
                              }`}
                            />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Pilność</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {request.urgency === "urgent"
                                ? "Pilne"
                                : request.urgency === "normal"
                                ? "Normalne"
                                : "Elastyczne"}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Data wykonania */}
                      {request.request_date && (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-4 h-4 text-purple-600"
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
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Termin</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {new Date(
                                request.request_date
                              ).toLocaleDateString("pl-PL", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer - data utworzenia + akcje */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Utworzono:{" "}
                        {new Date(request.created_at).toLocaleDateString(
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

                      {/* Przyciski akcji */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRequest(request.id);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Edytuj
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRequest(request.id);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Usuń
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewRequest(request.id);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
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
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          Zobacz
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const renderMyRequests = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Moje Zlecenia</h2>
        <p className="text-sm text-gray-600 mt-1">
          Zarządzaj swoimi zleceniami prywatnymi i monitoruj odpowiedzi
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie zleceń...</p>
        </div>
      ) : serviceRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Brak zleceń
          </h3>
          <p className="text-gray-600 mb-6">
            Nie masz jeszcze żadnych dodanych zleceń. Dodaj pierwsze zlecenie,
            aby zacząć szukać workerów!
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
          >
            ➕ Dodaj pierwsze zlecenie
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {serviceRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden border border-gray-200"
            >
              {/* Header z autorskim avatarem */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200 flex items-center gap-3">
                {request.author_avatar ? (
                  <img
                    src={request.author_avatar}
                    alt={request.author_name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {request.author_name?.[0]?.toUpperCase() || "👤"}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {request.author_name}
                  </p>
                  {request.author_phone && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      📱 {request.author_phone}
                    </p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    request.status === "open"
                      ? "bg-green-100 text-green-700"
                      : request.status === "in_progress"
                      ? "bg-blue-100 text-blue-700"
                      : request.status === "completed"
                      ? "bg-gray-100 text-gray-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {request.status === "open"
                    ? "🟢 Otwarte"
                    : request.status === "in_progress"
                    ? "🔵 W trakcie"
                    : request.status === "completed"
                    ? "✅ Zakończone"
                    : "⚠️ Zamknięte"}
                </span>
              </div>

              {/* Zdjęcia (jeśli są) */}
              {request.images && request.images.length > 0 && (
                <div className="relative h-48 bg-gray-100">
                  <img
                    src={request.images[0]}
                    alt={request.title}
                    className="w-full h-full object-cover"
                  />
                  {request.images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                      📷 +{request.images.length - 1}
                    </div>
                  )}
                </div>
              )}

              {/* Treść */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {request.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {request.description}
                </p>

                {/* Szczegóły */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="font-semibold">📂 Kategoria:</span>
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {request.category}
                    </span>
                  </div>
                  {request.city && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="font-semibold">📍 Lokalizacja:</span>
                      <span>{request.city}</span>
                    </div>
                  )}
                  {request.price && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="font-semibold">💰 Budżet:</span>
                      <span className="font-bold text-green-600">
                        €{request.price}
                      </span>
                    </div>
                  )}
                  {request.request_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="font-semibold">
                        📅 Preferowana data:
                      </span>
                      <span>
                        {new Date(request.request_date).toLocaleDateString(
                          "pl-PL"
                        )}
                      </span>
                    </div>
                  )}
                  {request.contact_method && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="font-semibold">📞 Kontakt:</span>
                      <span className="capitalize">
                        {request.contact_method}
                      </span>
                    </div>
                  )}
                </div>

                {/* Statystyki */}
                <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      💬{" "}
                      <span className="font-semibold">
                        {request.responses_count}
                      </span>{" "}
                      odpowiedzi
                    </span>
                    <span className="flex items-center gap-1">
                      📅{" "}
                      {new Date(request.created_at).toLocaleDateString("pl-PL")}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditRequest(request.id)}
                      className="text-blue-600 hover:text-blue-700 px-3 py-1 rounded hover:bg-blue-50 transition-colors text-sm font-medium"
                    >
                      ✏️ Edytuj
                    </button>
                    <button
                      onClick={() => handleDeleteRequest(request.id)}
                      className="text-red-600 hover:text-red-700 px-3 py-1 rounded hover:bg-red-50 transition-colors text-sm font-medium"
                    >
                      🗑️ Usuń
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProfileSettings = () => (
    <div className="space-y-6">
      {/* Settings Navigation */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {[
              { id: "profile", icon: "👤", label: "Profil" },
              { id: "account", icon: "🔐", label: "Konto" },
              { id: "notifications", icon: "🔔", label: "Powiadomienia" },
              { id: "privacy", icon: "🔒", label: "Prywatność" },
              { id: "language", icon: "🌍", label: "Język" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveSettingsTab(
                    tab.id as
                      | "profile"
                      | "account"
                      | "notifications"
                      | "privacy"
                      | "language"
                  )
                }
                className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                  activeSettingsTab === tab.id
                    ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeSettingsTab === "profile" && renderProfileTab()}
          {activeSettingsTab === "account" && renderAccountTab()}
          {activeSettingsTab === "notifications" && renderNotificationsTab()}
          {activeSettingsTab === "privacy" && renderPrivacyTab()}
          {activeSettingsTab === "language" && renderLanguageTab()}
        </div>
      </div>
    </div>
  );

  // PROFILE TAB
  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Profile Photo */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Zdjęcie profilowe
        </h3>
        <div className="flex items-center gap-6">
          {userData?.avatar_url ? (
            <img
              src={userData.avatar_url}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-3xl border-4 border-purple-200 shadow-lg">
              {profileForm.first_name?.[0]?.toUpperCase() ||
                userData?.first_name?.[0]?.toUpperCase() ||
                "👤"}
            </div>
          )}

          <div>
            <div className="flex gap-2">
              <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer inline-block">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                📸 {userData?.avatar_url ? "Zmień zdjęcie" : "Dodaj zdjęcie"}
              </label>

              {userData?.avatar_url && (
                <button
                  onClick={handleRemoveAvatar}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  🗑️ Usuń
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              JPG, PNG lub WebP. Maksymalnie 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Informacje osobiste
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imię
            </label>
            <input
              type="text"
              value={profileForm.first_name}
              onChange={(e) =>
                setProfileForm({ ...profileForm, first_name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Wprowadź imię"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nazwisko
            </label>
            <input
              type="text"
              value={profileForm.last_name}
              onChange={(e) =>
                setProfileForm({ ...profileForm, last_name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Wprowadź nazwisko"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ""}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">
              Email nie może być zmieniony
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefon
            </label>
            <input
              type="tel"
              value={profileForm.phone}
              onChange={(e) =>
                setProfileForm({ ...profileForm, phone: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+31 123 456 789"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Adres</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ulica i numer domu
            </label>
            <input
              type="text"
              value={profileForm.address}
              onChange={(e) =>
                setProfileForm({ ...profileForm, address: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="np. Hoofdstraat 123"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kod pocztowy
            </label>
            <input
              type="text"
              value={profileForm.postal_code}
              onChange={(e) =>
                setProfileForm({ ...profileForm, postal_code: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1234 AB"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Miasto
            </label>
            <input
              type="text"
              value={profileForm.city}
              onChange={(e) =>
                setProfileForm({ ...profileForm, city: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Amsterdam"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <button
          onClick={handleSaveProfile}
          disabled={isEditingProfile}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEditingProfile ? "Zapisywanie..." : "💾 Zapisz zmiany"}
        </button>
      </div>
    </div>
  );

  // ACCOUNT TAB
  const renderAccountTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Bezpieczeństwo konta
        </h3>

        {/* Email Section */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Adres email</p>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              ✓ Zweryfikowany
            </span>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Hasło</p>
              <p className="text-sm text-gray-600">••••••••</p>
            </div>
            <button
              onClick={async () => {
                try {
                  await supabase.auth.resetPasswordForEmail(user?.email || "", {
                    redirectTo: window.location.origin + "/reset-password",
                  });
                  toast.success("Link do zmiany hasła wysłany na email!");
                } catch (error) {
                  toast.error("Błąd wysyłania linku");
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Zmień hasło
            </button>
          </div>
        </div>

        {/* Two-Factor Auth */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                Uwierzytelnianie dwuskładnikowe (2FA)
              </p>
              <p className="text-sm text-gray-600">
                Dodatkowa warstwa bezpieczeństwa
              </p>
            </div>
            <button className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg cursor-not-allowed">
              Wkrótce
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-red-600 mb-4">
          Strefa zagrożenia
        </h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-4">
            <div className="text-3xl">⚠️</div>
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 mb-2">
                Usuń konto na zawsze
              </h4>
              <p className="text-sm text-red-700 mb-4">
                Gdy usuniesz konto, nie będzie można go przywrócić. Wszystkie
                dane zostaną trwale usunięte.
              </p>
              <button
                onClick={() => {
                  if (
                    confirm(
                      "Czy na pewno chcesz usunąć konto? Ta operacja jest nieodwracalna!"
                    )
                  ) {
                    toast.error(
                      "Funkcja usuwania konta będzie dostępna wkrótce"
                    );
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Usuń konto
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // NOTIFICATIONS TAB
  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Powiadomienia Email
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Wybierz, o czym chcesz być informowany przez email
        </p>

        <div className="space-y-4">
          {[
            {
              key: "email_service_requests",
              label: "Nowe odpowiedzi na zlecenia",
              description: "Gdy ktoś odpowie na Twoje zlecenie",
            },
            {
              key: "email_messages",
              label: "Nowe wiadomości",
              description: "Gdy otrzymasz nową wiadomość prywatną",
            },
            {
              key: "email_marketing",
              label: "Aktualności i promocje",
              description: "Newsletter z nowościami platformy",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    notificationSettings[
                      item.key as keyof typeof notificationSettings
                    ]
                  }
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      [item.key]: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Powiadomienia Push
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Natychmiastowe powiadomienia w przeglądarce
        </p>

        <div className="space-y-4">
          {[
            {
              key: "push_service_requests",
              label: "Odpowiedzi na zlecenia",
              description: "Natychmiastowe powiadomienie o nowej ofercie",
            },
            {
              key: "push_messages",
              label: "Wiadomości",
              description: "Powiadom mnie o nowych wiadomościach",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    notificationSettings[
                      item.key as keyof typeof notificationSettings
                    ]
                  }
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      [item.key]: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <button
          onClick={() => {
            toast.success("✅ Ustawienia powiadomień zapisane!");
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-colors font-semibold"
        >
          💾 Zapisz ustawienia
        </button>
      </div>
    </div>
  );

  // PRIVACY TAB
  const renderPrivacyTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Widoczność profilu
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Kontroluj, kto może zobaczyć Twój profil
        </p>

        <div className="space-y-4">
          <label className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="radio"
              name="profile_visibility"
              checked={privacySettings.profile_visibility === "public"}
              onChange={() =>
                setPrivacySettings({
                  ...privacySettings,
                  profile_visibility: "public",
                })
              }
              className="mt-1"
            />
            <div>
              <p className="font-medium text-gray-900">Publiczny</p>
              <p className="text-sm text-gray-600">
                Wszyscy użytkownicy mogą zobaczyć Twój profil
              </p>
            </div>
          </label>

          <label className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="radio"
              name="profile_visibility"
              checked={privacySettings.profile_visibility === "private"}
              onChange={() =>
                setPrivacySettings({
                  ...privacySettings,
                  profile_visibility: "private",
                })
              }
              className="mt-1"
            />
            <div>
              <p className="font-medium text-gray-900">Prywatny</p>
              <p className="text-sm text-gray-600">
                Tylko Ty widzisz swój profil
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Informacje kontaktowe
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Wybierz, które dane są widoczne w Twoich zleceniach
        </p>

        <div className="space-y-4">
          {[
            {
              key: "show_phone",
              label: "Numer telefonu",
              description: "Pokaż mój numer przy zleceniach",
            },
            {
              key: "show_email",
              label: "Adres email",
              description: "Pokaż mój email przy zleceniach",
            },
            {
              key: "show_address",
              label: "Adres",
              description: "Pokaż mój adres przy zleceniach",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(
                    privacySettings[item.key as keyof typeof privacySettings]
                  )}
                  onChange={(e) =>
                    setPrivacySettings({
                      ...privacySettings,
                      [item.key]: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <button
          onClick={() => {
            toast.success("✅ Ustawienia prywatności zapisane!");
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-colors font-semibold"
        >
          💾 Zapisz ustawienia
        </button>
      </div>
    </div>
  );

  // LANGUAGE TAB
  const renderLanguageTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Język interfejsu
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Wybierz język, w którym ma być wyświetlana platforma
        </p>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <p className="text-sm text-gray-500">
            Zmiana języka zostanie zastosowana natychmiast
          </p>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Format daty i godziny
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Wybierz preferowany format wyświetlania
        </p>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-gray-900">Format daty</p>
                <p className="text-sm text-gray-600">DD/MM/YYYY (10/12/2025)</p>
              </div>
              <input
                type="radio"
                name="date_format"
                defaultChecked
                className="w-4 h-4"
              />
            </label>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-gray-900">Format 24h</p>
                <p className="text-sm text-gray-600">15:30 zamiast 3:30 PM</p>
              </div>
              <input
                type="radio"
                name="time_format"
                defaultChecked
                className="w-4 h-4"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Strefa czasowa
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Automatycznie wykryta na podstawie lokalizacji
        </p>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌍</span>
            <div>
              <p className="font-medium text-blue-900">
                Europe/Amsterdam (CET)
              </p>
              <p className="text-sm text-blue-700">
                UTC+1 (UTC+2 podczas czasu letniego)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // RENDER: Subscription Panel
  const renderSubscription = () => (
    <div className="space-y-6">
      <RegularUserSubscriptionPanel
        userId={user?.id || ""}
        isPremium={userData?.is_premium || false}
        premiumUntil={userData?.subscription_end_date || null}
        onUpgradeClick={() => setIsUpgradeModalOpen(true)}
      />
    </div>
  );

  // RENDER: Eksperci (Premium Feature)
  const renderExperts = () => {
    if (!userData?.is_premium) {
      return (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Wyszukiwarka Ekspertów
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Znajdź najlepszych workerów, księgowych, pracodawców i firmy
              sprzątające w Holandii. Dostępne tylko w planie Premium!
            </p>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-8">
              <p className="text-lg font-semibold text-gray-900 mb-2">
                Z Premium możesz:
              </p>
              <ul className="text-left space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Przeglądać profile ekspertów z ocenami
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Filtrować po specjalizacji i lokalizacji
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Wysyłać wiadomości bezpośrednio do ekspertów
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Dostęp do certyfikowanych specjalistów
                </li>
              </ul>
            </div>
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              🔓 Odblokuj za €9.99/mies
            </button>
          </div>
        </div>
      );
    }

    // Premium user - show experts search
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🔍 Wyszukiwarka Ekspertów
          </h2>
          <p className="text-gray-600 mb-6">
            Funkcja wyszukiwarki jest w trakcie budowy. Wkrótce będziesz mógł
            szukać:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">👷 Workerzy</h3>
              <p className="text-sm text-blue-700">
                Certyfikowani fachowcy ZZP
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">📊 Księgowi</h3>
              <p className="text-sm text-green-700">
                Doświadczeni księgowi dla ZZP
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">
                🏢 Pracodawcy
              </h3>
              <p className="text-sm text-purple-700">
                Firmy szukające pracowników
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">
                🧹 Firmy Sprzątające
              </h3>
              <p className="text-sm text-yellow-700">
                Profesjonalne cleaning services
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===================================================================
  // MESSENGER UI - WHATSAPP-STYLE 2-PANEL LAYOUT
  // ===================================================================
  const renderMessagesTab = () => {
    if (!userData?.is_premium) {
      return (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              System Wiadomości
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Komunikuj się bezpośrednio z ekspertami przez naszą platformę.
              Dostępne tylko w planie Premium!
            </p>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-8">
              <p className="text-lg font-semibold text-gray-900 mb-2">
                Z Premium możesz:
              </p>
              <ul className="text-left space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Pisać wiadomości do ekspertów
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Otrzymywać odpowiedzi na oferty
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Negocjować warunki współpracy
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Historia wszystkich rozmów w jednym miejscu
                </li>
              </ul>
            </div>
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              🔓 Odblokuj za €9.99/mies
            </button>
          </div>
        </div>
      );
    }

    // ===================================================================
    // PREMIUM USER - FULL MESSENGER
    // ===================================================================
    return (
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
                className={`border-b border-gray-200 bg-gradient-to-r from-purple-600 to-pink-600 ${
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
                      className={`border-b border-gray-200 cursor-pointer transition-all duration-200 hover:bg-purple-50 ${
                        isMobile ? "p-3" : "p-4"
                      } ${
                        selectedConversation?.partnerId ===
                        conversation.partnerId
                          ? "bg-purple-100 border-l-4 border-l-purple-600"
                          : "hover:border-l-4 hover:border-l-purple-300"
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
                              className={`rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold shadow-md ${
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
                                  ? "text-purple-700"
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
                            className="p-1 hover:bg-gray-200 rounded-lg mr-2 text-sm"
                          >
                            ← Powrót
                          </button>
                        )}
                        {selectedConversation.partnerAvatar ? (
                          <img
                            src={selectedConversation.partnerAvatar}
                            alt={selectedConversation.partnerName}
                            className={`rounded-full object-cover border-2 border-purple-500 ${
                              isMobile ? "w-8 h-8" : "w-10 h-10"
                            }`}
                          />
                        ) : (
                          <div
                            className={`rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold shadow-lg ${
                              isMobile ? "w-8 h-8 text-sm" : "w-10 h-10"
                            }`}
                          >
                            {selectedConversation.partnerName
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4
                            className={`font-bold text-gray-900 ${
                              isMobile ? "text-sm" : ""
                            }`}
                          >
                            {selectedConversation.partnerName}
                          </h4>
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
                                    ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-br-sm"
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

                                <div className="flex items-center justify-end gap-2 mt-1">
                                  <p
                                    className={`text-xs ${
                                      isOwnMessage
                                        ? "text-purple-200"
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
                                      className="text-purple-200"
                                      title="Przeczytane"
                                    >
                                      ✓✓
                                    </span>
                                  )}
                                  {isOwnMessage && !msg.is_read && (
                                    <span
                                      className="text-purple-300"
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
                        className={`flex-1 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
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
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:shadow-xl"
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
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <DashboardSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          title="👤 Regular User"
          subtitle="Panel użytkownika"
          unreadMessages={unreadCount}
          onSupportClick={() => setShowSupportModal(true)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      {isMobile && (
        <DashboardSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          title="👤 Regular User"
          subtitle="Panel użytkownika"
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Modern Header with Avatar */}
            <div className="heroBanner mb-8">
              {/* Animated gradient background */}
              <div className="heroBannerBg" />

              {/* Glow orbs */}
              <div className="heroBannerOrb heroBannerOrb1" />
              <div className="heroBannerOrb heroBannerOrb2" />
              <div className="heroBannerOrb heroBannerOrb3" />

              {/* Glass overlay */}
              <div className="heroBannerGlass" />

              {/* Content */}
              <div className="heroBannerContent">
                <div className="heroBannerLeft">
                  <div className="heroBannerGreeting">
                    {/* User Avatar */}
                    {userData?.avatar_url ? (
                      <img
                        src={userData.avatar_url}
                        alt={userData.first_name || "User"}
                        className="w-14 h-14 rounded-full object-cover border-3 border-white/30 shadow-lg"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-2xl border-3 border-white/30 shadow-lg">
                        {userData?.first_name?.[0]?.toUpperCase() || "👤"}
                      </div>
                    )}

                    <h1 className="heroBannerTitle">
                      <span className="heroBannerName">
                        Witaj, {userData?.first_name || "Użytkowniku"}!
                      </span>
                      {userData?.is_premium && (
                        <span className="heroBannerBadge bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 border-amber-300 shadow-lg shadow-amber-200/50">
                          ⭐ Premium
                        </span>
                      )}
                    </h1>
                  </div>

                  <p
                    className="heroBannerSubtitle"
                    style={{ paddingLeft: "62px" }}
                  >
                    {userData?.is_premium ? "Konto Premium" : "Konto Darmowe"}
                  </p>
                </div>

                <div className="heroBannerRight">
                  <button
                    onClick={handleCreateRequest}
                    disabled={!canCreateRequest()}
                    className="bg-white text-purple-600 hover:bg-purple-50 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ➕ Utwórz Zlecenie
                  </button>
                </div>
              </div>

              {/* Bottom shine line */}
              <div className="heroBannerShine" />
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && renderOverview()}
            {activeTab === "my_posts" && renderMyRequests()}
            {activeTab === "messages" && renderMessagesTab()}
            {activeTab === "settings" && renderProfileSettings()}
            {activeTab === "subscription" && renderSubscription()}
          </div>
        </main>
      </div>

      {/* Modal tworzenia/edycji zlecenia */}
      <CreateServiceRequestModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRequestId(null);
        }}
        onSuccess={handleModalSuccess}
        userId={user?.id || ""}
        editingRequestId={editingRequestId}
      />

      {/* Modal Upgrade do Premium */}
      <RegularUserUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        userId={user?.id || ""}
        isPremium={userData?.is_premium || false}
        premiumUntil={userData?.subscription_end_date || null}
      />

      {/* Support Ticket Modal */}
      <SupportTicketModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
    </div>
  );
}

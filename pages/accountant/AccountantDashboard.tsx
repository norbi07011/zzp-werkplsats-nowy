import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import { SupportTicketModal } from "../../src/components/SupportTicketModal";
import { geocodeAddress } from "../../services/geocoding";
import {
  getAccountantByProfileId,
  getMyReviews,
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
import MyPosts from "./MyPosts";
import SavedActivity from "./SavedActivity";

export default function AccountantDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Unified tabs state
  const { activeTab, setActiveTab } = useUnifiedTabs("overview");

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

  // Messages state
  const [messages, setMessages] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [replyContent, setReplyContent] = useState("");
  const [saving, setSaving] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

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

  useEffect(() => {
    if (user?.id) {
      loadAccountant();
      loadMessages(user.id);

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
      const reviewsData = await getMyReviews(accountantId);
      setReviews(reviewsData || []);
      console.log("✅ Loaded reviews:", reviewsData);
    } catch (error) {
      console.error("❌ Error loading reviews:", error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Load messages from database
  const loadMessages = async (userId: string) => {
    try {
      // Fetch messages where accountant is recipient
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          sender_profile:profiles!messages_sender_id_fkey(
            full_name,
            email,
            role,
            id
          )
        `
        )
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("📬 MESSAGES DEBUG - Raw data from Supabase:", data);
      console.log(
        "📬 First message sender_profile:",
        data?.[0]?.sender_profile
      );

      // For each message, fetch avatar based on sender role
      const messagesWithAvatars = await Promise.all(
        (data || []).map(async (msg: any) => {
          let avatar_url = null;
          const senderId = msg.sender_profile?.id;
          const role = msg.sender_profile?.role;

          if (senderId && role) {
            try {
              if (role === "worker") {
                const { data: worker } = await supabase
                  .from("workers")
                  .select("avatar_url")
                  .eq("profile_id", senderId)
                  .single();
                avatar_url = worker?.avatar_url;
              } else if (role === "employer") {
                const { data: employer } = await supabase
                  .from("employers")
                  .select("logo_url")
                  .eq("profile_id", senderId)
                  .single();
                avatar_url = employer?.logo_url;
              } else if (role === "accountant") {
                const { data: accountant } = await supabase
                  .from("accountants")
                  .select("avatar_url")
                  .eq("profile_id", senderId)
                  .single();
                avatar_url = accountant?.avatar_url;
              } else if (role === "cleaning_company") {
                const { data: cleaning } = await supabase
                  .from("cleaning_companies")
                  .select("avatar_url")
                  .eq("profile_id", senderId)
                  .single();
                avatar_url = cleaning?.avatar_url;
              }
            } catch (err) {
              console.error(`Error fetching avatar for ${role}:`, err);
            }
          }

          return {
            ...msg,
            sender_profile: {
              ...msg.sender_profile,
              avatar_url,
            },
          };
        })
      );

      console.log(
        "📬 Messages with avatars:",
        messagesWithAvatars.map((m) => ({
          subject: m.subject,
          sender: m.sender_profile?.full_name,
          role: m.sender_profile?.role,
          avatar: m.sender_profile?.avatar_url,
          has_avatar: !!m.sender_profile?.avatar_url,
        }))
      );

      setMessages(messagesWithAvatars || []);

      // Count unread messages
      const unread = (messagesWithAvatars || []).filter(
        (msg: any) => !msg.is_read
      ).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Error loading messages:", err);
      setMessages([]);
      setUnreadCount(0);
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
      const { error } = await supabase.from("messages").insert({
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
      });
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

  const renderTopTabs = () => (
    <div className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <UnifiedDashboardTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          role="accountant"
          unreadMessages={unreadCount}
        />
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aktywni klienci</p>
              <p className="text-2xl font-bold">
                {accountant?.total_clients || 0}
              </p>
            </div>
            <Users className="w-10 h-10 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Zgłoszenia</p>
              <p className="text-2xl font-bold text-orange-600">0</p>
            </div>
            <ClockIcon className="w-10 h-10 text-orange-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ocena</p>
              <p className="text-2xl font-bold text-yellow-600">
                {accountant?.rating
                  ? `${accountant.rating.toFixed(1)} ⭐`
                  : "0.0 ⭐"}
              </p>
            </div>
            <Star className="w-10 h-10 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Wyświetlenia profilu</p>
              <p className="text-2xl font-bold text-green-600">
                {accountant?.profile_views || 0}
              </p>
            </div>
            <Eye className="w-10 h-10 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Wiadomości</p>
              <p className="text-2xl font-bold text-purple-600">
                {unreadCount || 0}
              </p>
            </div>
            <Bell className="w-10 h-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Szybkie działania Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => setInnerTab("submissions")}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white cursor-pointer hover:shadow-xl"
        >
          <FileText className="w-8 h-8 mb-4" />
          <h3 className="text-xl font-bold mb-2">Zgłoszenia</h3>
          <p className="text-orange-100">Nowe zgłoszenia od klientów</p>
        </div>

        <div
          onClick={() => setActiveTab("services")}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white cursor-pointer hover:shadow-xl"
        >
          <Briefcase className="w-8 h-8 mb-4" />
          <h3 className="text-xl font-bold mb-2">Usługi</h3>
          <p className="text-purple-100">Zarządzaj ofertą księgową</p>
        </div>

        <div
          onClick={() => setInnerTab("forms")}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white cursor-pointer hover:shadow-xl"
        >
          <ClipboardList className="w-8 h-8 mb-4" />
          <h3 className="text-xl font-bold mb-2">Formularze</h3>
          <p className="text-green-100">Szablony dla klientów</p>
        </div>
      </div>

      {/* Profil + Ostatnie wiadomości */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zdjęcie profilowe + dane */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">📸 Profil księgowy</h3>

          {/* Avatar Section */}
          <div className="flex gap-4 mb-6">
            <div className="flex flex-col items-center gap-3">
              {accountant?.avatar_url ? (
                <>
                  <img
                    src={accountant.avatar_url}
                    alt="Avatar księgowego"
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 shadow-lg"
                    onError={(e) => {
                      console.error(
                        "❌ Avatar failed to load:",
                        accountant.avatar_url
                      );
                      (e.target as HTMLImageElement).style.display = "none";
                      const fallback = (e.target as HTMLImageElement)
                        .nextElementSibling;
                      if (fallback)
                        (fallback as HTMLElement).style.display = "flex";
                    }}
                  />
                  <div
                    className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full items-center justify-center text-white font-bold text-4xl shadow-lg border-4 border-blue-100"
                    style={{ display: "none" }}
                  >
                    {accountant?.company_name?.[0]?.toUpperCase() || "K"}
                  </div>
                </>
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-4xl shadow-lg flex-shrink-0">
                  {accountant?.company_name?.[0]?.toUpperCase() || "K"}
                </div>
              )}

              {/* Upload/Remove buttons */}
              <div className="flex flex-col gap-2 w-full">
                <label className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg cursor-pointer text-center transition-colors">
                  Zmień
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
                {accountant?.avatar_url && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors"
                  >
                    Usuń
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1">
              <h4 className="font-bold text-xl mb-1">
                {accountant?.company_name || "Księgowość"}
              </h4>
              <p className="text-sm text-gray-600 mb-2">{accountant?.email}</p>
              <div className="flex gap-2 mb-3">
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                  ✓ Aktywny
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex items-center gap-1">
                  ✓ Zweryfikowany
                </span>
              </div>

              {accountant?.bio && (
                <p className="text-sm text-gray-600 italic mb-3">
                  "{accountant.bio}"
                </p>
              )}
            </div>
          </div>

          {/* Cover Image Section */}
          {accountant && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                🖼️ Zdjęcie w tle profilu
              </h4>
              <CoverImageUploader
                currentCoverUrl={accountant.cover_image_url}
                onUploadSuccess={handleCoverImageUploadSuccess}
                profileType="accountant"
                profileId={accountant.id}
              />
            </div>
          )}

          {/* Contact info */}
          <div className="space-y-2 mb-4 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                Email: {accountant?.email || "Nie podano"}
              </span>
            </div>
            {accountant?.phone && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">📱</span>
                <span className="text-gray-600">Tel: {accountant.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                {accountant?.city || "Rotterdam"},{" "}
                {accountant?.country || "Nederland"}
              </span>
            </div>
            {accountant?.website && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">🌐</span>
                <a
                  href={accountant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {accountant.website}
                </a>
              </div>
            )}
            {accountant?.years_experience &&
              accountant.years_experience > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">📊</span>
                  <span className="text-gray-600">
                    Doświadczenie: {accountant.years_experience} lat
                  </span>
                </div>
              )}
          </div>

          {/* Specializations */}
          {accountant?.specializations &&
            accountant.specializations.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-semibold text-gray-700 mb-2">
                  Specjalizacje:
                </h5>
                <div className="flex flex-wrap gap-2">
                  {accountant.specializations.map((spec, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* Languages */}
          {accountant?.languages && accountant.languages.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-semibold text-gray-700 mb-2">
                Języki:
              </h5>
              <div className="flex flex-wrap gap-2">
                {accountant.languages.map((lang, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Licenses */}
          {(accountant?.kvk_number ||
            accountant?.btw_number ||
            accountant?.license_number) && (
            <div className="mb-4 bg-gray-50 rounded-lg p-4 space-y-1">
              <h5 className="text-sm font-semibold text-gray-700 mb-2">
                Licencje i certyfikaty:
              </h5>
              {accountant?.kvk_number && (
                <p className="text-xs text-gray-600">
                  KVK: {accountant.kvk_number}
                </p>
              )}
              {accountant?.btw_number && (
                <p className="text-xs text-gray-600">
                  BTW: {accountant.btw_number}
                </p>
              )}
              {accountant?.license_number && (
                <p className="text-xs text-gray-600">
                  Licencja: {accountant.license_number}
                </p>
              )}
            </div>
          )}

          <button
            onClick={() => setIsEditingProfile(true)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Edytuj profil
          </button>
        </div>

        {/* Ostatnie wiadomości */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">📬 Ostatnie wiadomości</h3>
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
              {messages.slice(0, 3).map((msg: any) => (
                <button
                  key={msg.id}
                  onClick={() => {
                    setSelectedMessage(msg);
                    setActiveTab("messages");
                    if (!msg.is_read) handleMarkAsRead(msg.id);
                  }}
                  className="w-full text-left flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                >
                  {/* Avatar */}
                  {msg.sender_profile?.avatar_url ? (
                    <img
                      src={msg.sender_profile.avatar_url}
                      alt={msg.sender_profile.full_name || "Avatar"}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        // Fallback to initials if image fails
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
        </div>
      </div>

      {/* Nadchodzące spotkania + Opinie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kalendarz spotkań */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">📅 Nadchodzące spotkania</h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              3 dziś
            </span>
          </div>
          <div className="space-y-3">
            <div className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 rounded-r">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium">Konsultacja VAT</p>
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded font-medium">
                  14:00
                </span>
              </div>
              <p className="text-sm text-gray-600">Jan Kowalski</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <span>📹</span> Online (Zoom)
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-4 py-3 hover:bg-gray-50 rounded-r cursor-pointer transition-colors">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium">Rozliczenie roczne</p>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  Jutro 10:00
                </span>
              </div>
              <p className="text-sm text-gray-600">Anna Smits</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Biuro, Rotterdam
              </p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4 py-3 hover:bg-gray-50 rounded-r cursor-pointer transition-colors">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium">Założenie firmy</p>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                  Pt 16:00
                </span>
              </div>
              <p className="text-sm text-gray-600">Maria Janssen</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <span>📹</span> Online (Teams)
              </p>
            </div>
          </div>
          <button className="mt-4 w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium">
            + Dodaj spotkanie
          </button>
        </div>

        {/* Ostatnie opinie */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">⭐ Ostatnie opinie</h3>
            {accountant && (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-yellow-600">
                  {accountant.rating?.toFixed(1) || "0.0"}
                </span>
                <span className="text-sm text-gray-500">
                  ({accountant.rating_count || 0})
                </span>
              </div>
            )}
          </div>

          {reviewsLoading ? (
            <div className="text-center py-8 text-gray-500">
              <p>Ładowanie opinii...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Brak opinii</p>
              <p className="text-sm mt-2">
                Opinie pojawią się tutaj gdy klienci je wystawią
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.slice(0, 2).map((review: any) => (
                <div
                  key={review.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 text-sm">
                        {(review.reviewer_name || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {review.reviewer_name || "Pracodawca"}
                        </p>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i <= review.rating
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString("pl-PL")}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600">"{review.comment}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setActiveTab("reviews")}
            className="mt-4 w-full text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Zobacz wszystkie opinie →
          </button>
        </div>
      </div>

      {/* DOSTĘPNOŚĆ + ZARZĄDZANIE DATAMI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kalendarz dostępności */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">📅 Twoja dostępność</h3>
          <p className="text-sm text-gray-600 mb-4">
            Zaznacz dni kiedy możesz przyjmować klientów
          </p>

          <div className="bg-blue-50 p-6 rounded-lg">
            <AvailabilityCalendar
              availability={availability}
              onChange={handleAvailabilityChange}
              editable={true}
            />
            <p className="text-xs text-gray-500 mt-4 text-center">
              Kliknij na dzień aby zmienić dostępność. Zmiany są zapisywane
              automatycznie.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">Dostępne dni</p>
              <p className="text-2xl font-bold text-blue-600">
                {Object.values(availability).filter(Boolean).length}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">Preferowane</p>
              <p className="text-2xl font-bold text-gray-700">5 dni/tydzień</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Wskazówka:</strong> Klienci widzą Twoją dostępność przy
              rezerwacji konsultacji.
            </p>
          </div>
        </div>

        {/* Zarządzanie niedostępnymi terminami */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">� Niedostępne terminy</h3>
          <p className="text-sm text-gray-600 mb-4">
            Zaznacz daty lub okresy kiedy nie przyjmujesz nowych zleceń (urlop,
            święta, zajęte)
          </p>

          <DateBlocker
            blockedDates={blockedDates}
            onBlock={handleBlockDate}
            onUnblock={handleUnblockDate}
          />

          {/* Info o zablokowanych datach */}
          {blockedDates.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>{blockedDates.length}</strong>{" "}
                {blockedDates.length === 1
                  ? "data zablokowana"
                  : "daty zablokowane"}
                . Klienci nie będą mogli umówić spotkań w tych terminach.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ===================================================================
  // MESSAGES PANEL - Full view
  // ===================================================================
  const renderMessages = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📬 Wiadomości</h1>
        <p className="text-gray-600 mb-8">
          {unreadCount > 0
            ? `Masz ${unreadCount} nieprzeczytanych wiadomości`
            : "Brak nowych wiadomości"}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-xl border border-gray-200 p-6 max-h-[800px] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Skrzynka odbiorcza
            </h2>

            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Brak wiadomości</p>
            ) : (
              <div className="space-y-2">
                {messages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessage(msg);
                      if (!msg.is_read) handleMarkAsRead(msg.id);
                    }}
                    className={`w-full text-left p-4 rounded-lg transition-all ${
                      selectedMessage?.id === msg.id
                        ? "bg-blue-100 border border-blue-500"
                        : msg.is_read
                        ? "bg-gray-50 border border-transparent hover:border-gray-300"
                        : "bg-green-50 border border-green-300 hover:border-green-500"
                    }`}
                  >
                    {/* Avatar + Text Content */}
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      {msg.sender_profile?.avatar_url ? (
                        <img
                          src={msg.sender_profile.avatar_url}
                          alt={msg.sender_profile.full_name || "Avatar"}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                            const fallback = (e.target as HTMLImageElement)
                              .nextElementSibling;
                            if (fallback)
                              (fallback as HTMLElement).style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                        style={{
                          display: msg.sender_profile?.avatar_url
                            ? "none"
                            : "flex",
                        }}
                      >
                        {msg.sender_profile?.full_name?.[0]?.toUpperCase() ||
                          "?"}
                      </div>

                      {/* Message Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <span
                            className={`font-semibold ${
                              msg.is_read ? "text-gray-900" : "text-green-700"
                            }`}
                          >
                            {msg.sender_profile?.full_name ||
                              "Nieznany nadawca"}
                          </span>
                          {!msg.is_read && (
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-1 truncate">
                          {msg.subject || "Brak tematu"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(msg.created_at).toLocaleDateString("pl-PL")}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            {!selectedMessage ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                Wybierz wiadomość aby ją przeczytać
              </div>
            ) : (
              <div>
                {/* Message Header with Avatar */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-start gap-4 mb-4">
                    {/* Sender Avatar */}
                    {selectedMessage.sender_profile?.avatar_url ? (
                      <img
                        src={selectedMessage.sender_profile.avatar_url}
                        alt={
                          selectedMessage.sender_profile.full_name || "Avatar"
                        }
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
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
                      className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0"
                      style={{
                        display: selectedMessage.sender_profile?.avatar_url
                          ? "none"
                          : "flex",
                      }}
                    >
                      {selectedMessage.sender_profile?.full_name?.[0]?.toUpperCase() ||
                        "?"}
                    </div>

                    {/* Message Info */}
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedMessage.subject || "Brak tematu"}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="font-medium">
                          Od:{" "}
                          {selectedMessage.sender_profile?.full_name ||
                            "Nieznany nadawca"}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(selectedMessage.created_at).toLocaleString(
                            "pl-PL"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6 text-gray-700 whitespace-pre-wrap">
                  {selectedMessage.content}
                </div>

                {/* Reply Form */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Odpowiedz
                  </h3>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Wpisz swoją odpowiedź..."
                    className="w-full bg-white border border-gray-300 rounded-lg p-4 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 min-h-[120px]"
                  />
                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={() => {
                        setSelectedMessage(null);
                        setReplyContent("");
                      }}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Anuluj
                    </button>
                    <button
                      onClick={handleSendReply}
                      disabled={saving || !replyContent.trim()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? "Wysyłanie..." : "Wyślij odpowiedź"}
                    </button>
                  </div>
                </div>
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

  const renderTeam = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">👥 Drużyna Księgowa</h2>
        <button
          onClick={() => setIsCommunicationOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          Zaproś członka
        </button>
      </div>

      {/* Statystyki zespołu */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Członkowie</p>
              <p className="text-2xl font-bold text-blue-900">4</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Aktywni</p>
              <p className="text-2xl font-bold text-green-900">3</p>
            </div>
            <User className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Klienci</p>
              <p className="text-2xl font-bold text-purple-900">24</p>
            </div>
            <Briefcase className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Zaproszenia</p>
              <p className="text-2xl font-bold text-orange-900">2</p>
            </div>
            <Bell className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Lista członków zespołu */}
      <div className="space-y-3">
        {/* Ty (właściciel) */}
        <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {accountant?.company_name?.charAt(0) || "K"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">
                    {accountant?.company_name || "Księgowy"}
                  </h3>
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
                    Właściciel
                  </span>
                </div>
                <p className="text-sm text-gray-600">{accountant?.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Zarządza zespołem i klientami
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-sm text-gray-600">Online</span>
            </div>
          </div>
        </div>

        {/* Członek 1 */}
        <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                AK
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">Anna Kowalska</h3>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                    Księgowa
                  </span>
                </div>
                <p className="text-sm text-gray-600">anna.kowalska@biuro.pl</p>
                <p className="text-xs text-gray-500 mt-1">
                  12 klientów • Specjalizacja: VAT
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                Edytuj
              </button>
            </div>
          </div>
        </div>

        {/* Członek 2 */}
        <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                MW
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">Marek Wiśniewski</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    Asystent
                  </span>
                </div>
                <p className="text-sm text-gray-600">marek.w@biuro.pl</p>
                <p className="text-xs text-gray-500 mt-1">
                  8 klientów • Specjalizacja: PIT
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                Edytuj
              </button>
            </div>
          </div>
        </div>

        {/* Członek 3 */}
        <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                KN
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">Katarzyna Nowak</h3>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                    Konsultant
                  </span>
                </div>
                <p className="text-sm text-gray-600">k.nowak@biuro.pl</p>
                <p className="text-xs text-gray-500 mt-1">
                  4 klientów • Specjalizacja: ZUS
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                Edytuj
              </button>
            </div>
          </div>
        </div>

        {/* Oczekujące zaproszenie */}
        <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 font-bold text-lg">
                ?
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-gray-700">
                    Jan Kowalczyk
                  </h3>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                    Oczekuje
                  </span>
                </div>
                <p className="text-sm text-gray-600">jan.kowalczyk@email.com</p>
                <p className="text-xs text-gray-500 mt-1">
                  Zaproszenie wysłane 2 dni temu
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Przypomnij
              </button>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                Anuluj
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info o rolach */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Role w zespole
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="font-medium text-blue-900">Właściciel:</span>
            <span className="text-blue-700 ml-1">
              Pełny dostęp, zarządzanie zespołem
            </span>
          </div>
          <div>
            <span className="font-medium text-green-900">Księgowa:</span>
            <span className="text-green-700 ml-1">
              Obsługa klientów, dokumenty
            </span>
          </div>
          <div>
            <span className="font-medium text-purple-900">Konsultant:</span>
            <span className="text-purple-700 ml-1">Porady, konsultacje</span>
          </div>
        </div>
      </div>
    </div>
  );

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
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden perspective-container">
        <Animated3DProfileBackground role="accountant" opacity={0.25} />
        <TypewriterAnimation opacity={0.2} />
      </div>

      <div className="relative z-10">
        <DashboardHeader
          title={`Dashboard - ${
            accountant.company_name || accountant.full_name
          }`}
          subtitle="Panel księgowego - zarządzaj klientami i usługami"
          icon="📊"
        >
          <button
            onClick={() => setIsCommunicationOpen(!isCommunicationOpen)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <span>💬</span>
            Komunikacja
          </button>
        </DashboardHeader>

        {/* Communication Panel */}
        {isCommunicationOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
            <div className="absolute right-0 top-0 h-full w-full max-w-4xl bg-white shadow-xl">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">
                  Komunikacja Projektowa
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
                        setEditForm({ ...editForm, full_name: e.target.value })
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
                        setEditForm({ ...editForm, kvk_number: e.target.value })
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
                        setEditForm({ ...editForm, btw_number: e.target.value })
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

        {renderTopTabs()}

        <main className="max-w-7xl mx-auto p-6">
          <TabPanel isActive={activeTab === "overview"}>
            {renderOverview()}
          </TabPanel>

          <TabPanel isActive={activeTab === "profile"}>
            {/* Profile editing - currently shows modal, can be moved here */}
            <div className="text-center py-12">
              <button
                onClick={() => setIsEditingProfile(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Edytuj profil
              </button>
            </div>
          </TabPanel>

          <TabPanel isActive={activeTab === "messages"}>
            {renderMessages()}
          </TabPanel>

          <TabPanel isActive={activeTab === "reviews"}>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">⭐ Wszystkie opinie</h2>
                {accountant && (
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-yellow-600">
                      {accountant.rating?.toFixed(1) || "0.0"}
                    </span>
                    <div className="text-left">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i <= Math.round(accountant.rating || 0)
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-500">
                        ({accountant.rating_count || 0}{" "}
                        {accountant.rating_count === 1 ? "opinia" : "opinii"})
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {reviewsLoading ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Ładowanie opinii...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <p>Brak opinii</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-gray-200 pb-4 last:border-0"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i <= review.rating
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-semibold">
                            {review.rating}.0
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(review.created_at).toLocaleDateString(
                            "pl-PL"
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {review.comment}
                      </p>
                      <p className="text-xs text-gray-500">
                        — {review.worker?.full_name || "Anonim"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabPanel>

          {/* Tablica Tab */}
          <TabPanel isActive={activeTab === "tablica"}>
            <FeedPage />
          </TabPanel>

          <TabPanel isActive={activeTab === "services"}>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">💼 Usługi</h2>
              <div className="text-center text-gray-400 py-12">
                <p>Brak usług</p>
              </div>
            </div>
          </TabPanel>

          <TabPanel isActive={activeTab === "submissions"}>
            {renderSubmissions()}
          </TabPanel>

          <TabPanel isActive={activeTab === "forms"}>{renderForms()}</TabPanel>

          <TabPanel isActive={activeTab === "team"}>{renderTeam()}</TabPanel>

          {/* My Posts Tab */}
          <TabPanel isActive={activeTab === "my_posts"}>
            <MyPosts />
          </TabPanel>

          {/* Saved Activity Tab */}
          <TabPanel isActive={activeTab === "saved_activity"}>
            <SavedActivity />
          </TabPanel>
        </main>

        {/* Support Ticket Modal */}
        <SupportTicketModal
          isOpen={showSupportModal}
          onClose={() => setShowSupportModal(false)}
        />
      </div>
    </div>
  );
}

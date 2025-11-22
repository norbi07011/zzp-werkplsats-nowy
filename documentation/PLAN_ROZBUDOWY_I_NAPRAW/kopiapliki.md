import { useState, useEffect } from "react";
import React from "react";
import { flushSync } from "react-dom";
import { useNavigate, Link } from "react-router-dom";
import { SupportTicketModal } from "../../src/components/SupportTicketModal";
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
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
import type { CleaningCompany, UnavailableDate } from "../../types";
import SavedActivity from "./SavedActivity";
import FeedPage from "../FeedPage_PREMIUM";

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
  priority?: string;
  data?: any;
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
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
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
            logo_url
          ),
          workers (
            avatar_url,
            profile_id,
            profiles!workers_profile_id_fkey (
              full_name
            )
          ),
          accountants (
            company_name,
            avatar_url
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
          reviewerAvatar = review.employers.logo_url;
        } else if (review.worker_id && review.workers?.profiles?.full_name) {
          reviewerName = review.workers.profiles.full_name;
          reviewerAvatar = review.workers.avatar_url;
        } else if (review.accountant_id && review.accountants?.company_name) {
          reviewerName = review.accountants.company_name;
          reviewerAvatar = review.accountants.avatar_url;
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
      setLoadingNotifications(true);
      const { data, error } = await supabase
        .from("notifications")
        .select("id, type, title, message, is_read, created_at, link, priority, data")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: Notification[] = (data || []).map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        is_read: n.is_read || false,
        created_at: n.created_at || new Date().toISOString(),
        link: n.link || undefined,
        priority: n.priority || "normal",
        data: n.data || null,
      }));

      setNotifications(mapped);
      setUnreadCount(mapped.filter((n) => !n.is_read).length);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter((n) => !n.is_read)
        .map((n) => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in("id", unreadIds);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getNotificationIcon = (type: string, priority?: string) => {
    if (priority === "urgent" || priority === "high") {
      return <ExclamationCircleIcon className="w-6 h-6 text-red-500" />;
    }

    switch (type) {
      case "success":
      case "NEW_REVIEW":
      case "CERTIFICATE_APPROVED":
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case "error":
      case "CERTIFICATE_REJECTED":
      case "CERTIFICATE_EXPIRED":
        return <XCircleIcon className="w-6 h-6 text-red-500" />;
      case "warning":
      case "CERTIFICATE_EXPIRING_SOON":
        return <ExclamationCircleIcon className="w-6 h-6 text-yellow-500" />;
      default:
        return <InformationCircleIcon className="w-6 h-6 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return "border-red-500 bg-red-50";
      case "high":
        return "border-orange-500 bg-orange-50";
      case "low":
        return "border-gray-300 bg-gray-50";
      default:
        return "border-blue-500 bg-blue-50";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Teraz";
    if (diffMins < 60) return `${diffMins} min temu`;
    if (diffHours < 24) return `${diffHours} godz. temu`;
    if (diffDays < 7) return `${diffDays} dni temu`;

    return new Date(dateString).toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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

      <div className="relative z-10">
        {/* Top Bar */}
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

              <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl p-6 shadow-md">
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
                  <h3 className="font-bold text-lg mb-4">
                    📸 Zdjęcie profilowe
                  </h3>
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
                  <h3 className="font-bold text-lg mb-4">
                    📅 Twoja dostępność
                  </h3>
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
                  <h3 className="font-bold text-lg mb-4">
                    📅 Zarezerwuj datami
                  </h3>
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

            {/* Powiadomienia - przeniesione z zakładki Wiadomości */}
            <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <BellIcon className="w-8 h-8 text-blue-600" />
                  <h2 className="text-2xl font-bold">🔔 Powiadomienia</h2>
                </div>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white px-4 py-2 rounded-full">
                    {unreadCount} nowych
                  </span>
                )}
              </div>

              {loadingNotifications ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12">
                  <BellIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Brak powiadomień</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="border-l-4 border-blue-500 pl-6 pr-4 py-4 bg-blue-50 rounded-r-xl hover:shadow-lg cursor-pointer"
                      onClick={() => markAsRead(notif.id)}
                    >
                      <div className="flex gap-4">
                        <div>{getNotificationIcon(notif.type, notif.priority)}</div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-2">{notif.title}</h3>
                          <p className="text-gray-700 mb-2">{notif.message}</p>
                          {notif.data && (
                            <div className="text-sm text-gray-600 space-y-1">
                              {notif.data.certificate_number && <p>Nr: {notif.data.certificate_number}</p>}
                              {notif.data.rating && <p>Ocena: {"⭐".repeat(notif.data.rating)}</p>}
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            {formatTimeAgo(notif.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabPanel>

          {/* Reviews Tab */}
            <div className="mt-8">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <BellIcon className="w-8 h-8 text-blue-600" />
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        🔔 Powiadomienia
                      </h2>
                      <p className="text-sm text-gray-600">
                        Wszystkie powiadomienia systemowe i aktualizacje
                      </p>
                    </div>
                  </div>

                  {unreadCount > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full animate-pulse">
                        {unreadCount} nowych
                      </span>
                      <button
                        onClick={markAllAsRead}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                      >
                        Oznacz wszystkie jako przeczytane
                      </button>
                    </div>
                  )}
                </div>

                {loadingNotifications ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Ładowanie powiadomień...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <BellIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Brak powiadomień</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Gdy otrzymasz nowe powiadomienie, pojawi się ono tutaj
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`border-l-4 pl-6 pr-4 py-4 rounded-r-xl transition-all duration-200 hover:shadow-lg cursor-pointer ${
                          !notif.is_read
                            ? getPriorityColor(notif.priority)
                            : "border-gray-300 bg-gray-50"
                        }`}
                        onClick={() => {
                          if (!notif.is_read) markAsRead(notif.id);
                          if (notif.link) window.open(notif.link, "_blank");
                        }}
                      >
                        <div className="flex items-start gap-4">
                          {/* Ikona */}
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notif.type, notif.priority)}
                          </div>

                          {/* Treść */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div className="flex items-center gap-3">
                                {!notif.is_read && (
                                  <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse flex-shrink-0"></span>
                                )}
                                <h3
                                  className={`font-bold text-lg ${
                                    !notif.is_read ? "text-blue-700" : "text-gray-700"
                                  }`}
                                >
                                  {notif.title}
                                </h3>
                              </div>

                              {notif.priority && notif.priority !== "normal" && (
                                <span
                                  className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                                    notif.priority === "urgent"
                                      ? "bg-red-500 text-white"
                                      : notif.priority === "high"
                                      ? "bg-orange-500 text-white"
                                      : notif.priority === "low"
                                      ? "bg-gray-400 text-white"
                                      : ""
                                  }`}
                                >
                                  {notif.priority === "urgent"
                                    ? "PILNE"
                                    : notif.priority === "high"
                                    ? "WAŻNE"
                                    : "NISKI"}
                                </span>
                              )}
                            </div>

                            <p className="text-gray-700 mb-3 leading-relaxed">
                              {notif.message}
                            </p>

                            {/* Dodatkowe dane z notification.data */}
                            {notif.data && (
                              <div className="bg-white/80 border border-gray-200 rounded-lg p-3 mb-3 text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  {notif.data.certificate_number && (
                                    <div>
                                      <span className="font-medium text-gray-600">
                                        Nr certyfikatu:
                                      </span>
                                      <span className="ml-2 text-gray-900">
                                        {notif.data.certificate_number}
                                      </span>
                                    </div>
                                  )}
                                  {notif.data.expiry_date && (
                                    <div>
                                      <span className="font-medium text-gray-600">
                                        Data wygaśnięcia:
                                      </span>
                                      <span className="ml-2 text-gray-900">
                                        {new Date(
                                          notif.data.expiry_date
                                        ).toLocaleDateString("pl-PL")}
                                      </span>
                                    </div>
                                  )}
                                  {notif.data.rejection_reason && (
                                    <div className="col-span-2">
                                      <span className="font-medium text-red-600">
                                        Powód odrzucenia:
                                      </span>
                                      <p className="text-gray-900 mt-1">
                                        {notif.data.rejection_reason}
                                      </p>
                                    </div>
                                  )}
                                  {notif.data.rating && (
                                    <div>
                                      <span className="font-medium text-gray-600">
                                        Ocena:
                                      </span>
                                      <span className="ml-2 text-yellow-600 font-bold">
                                        {"⭐".repeat(notif.data.rating)} (
                                        {notif.data.rating}/5)
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-2">
                                <ClockIcon className="w-4 h-4" />
                                <span>{formatTimeAgo(notif.created_at)}</span>
                                <span className="mx-1">•</span>
                                <span className="text-gray-400">
                                  {new Date(notif.created_at).toLocaleString("pl-PL")}
                                </span>
                              </div>

                              {notif.link && (
                                <div className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium">
                                  <span>Zobacz szczegóły</span>
                                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabPanel>

          {/* Reviews Tab */
          <TabPanel isActive={activeTab === "reviews"}>
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Header with stats */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-xl">
                <h2 className="text-3xl font-bold mb-4">
                  ⭐ Opinie od klientów
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                    <p className="text-sm opacity-90 mb-1">Wszystkie opinie</p>
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
                    <p className="text-sm opacity-90 mb-1">Pozytywne opinie</p>
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
                      reviewFilter === "all" ? true : r.rating === reviewFilter
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
                                {new Date(review.work_date).toLocaleDateString(
                                  "pl-PL"
                                )}
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
                              onClick={() => setShowAllReviews(!showAllReviews)}
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
                  Pobierz profesjonalny raport wszystkich opinii w formacie PDF
                  (HTML) lub arkusz kalkulacyjny CSV.
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
                      <p className="font-medium text-gray-900">Różnorodność</p>
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

          {/* Subscription Cards - visible in all tabs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 text-9xl opacity-20">
                🏆
              </div>
              <div className="relative z-10">
                <span className="text-4xl font-bold">1</span>
                <h3 className="text-xl font-bold mt-2">Tytuł abonament</h3>
                <p className="text-sm mt-2 opacity-90">
                  Opis planu abonamentowego
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 text-9xl opacity-20">
                💎
              </div>
              <div className="relative z-10">
                <span className="text-4xl font-bold">2</span>
                <h3 className="text-xl font-bold mt-2">Plan średni</h3>
                <p className="text-sm mt-2 opacity-90">
                  Pakiet dla średnich firm
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-400 to-teal-400 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 text-9xl opacity-20">
                🚀
              </div>
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

        {/* Support Ticket Modal */}
        <SupportTicketModal
          isOpen={showSupportModal}
          onClose={() => setShowSupportModal(false)}
        />
      </div>
    </div>
  );
};

export default CleaningCompanyDashboard;

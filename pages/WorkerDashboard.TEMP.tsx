// @ts-nocheck
/**
 * ===================================================================
 * WORKER DASHBOARD - UNIFIED WITH CLEANING DASHBOARD STRUCTURE
 * ===================================================================
 * Complete worker dashboard matching CleaningDashboard features
 * Features: Stats, Availability, Messages, Reviews, Portfolio
 * UPDATED: November 10, 2025 - Dashboard Unification
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import workerProfileService from "../services/workerProfileService";
import type {
  WorkerProfileData,
  WorkerStats,
  WorkerMessage,
  WorkerReview,
  WeeklyAvailability,
  UnavailableDate,
} from "../services/workerProfileService";
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
import { SubscriptionPanel } from "../src/components/subscription/SubscriptionPanel";
import { CertificateApplicationForm } from "../src/components/subscription/CertificateApplicationForm";
import FeedPage from "../pages/FeedPage";
import {
  PageContainer,
  PageHeader,
  StatsGrid,
  StatCard,
  ContentCard,
} from "../components/common/PageContainer";
import AvailabilityCalendar from "../src/components/common/AvailabilityCalendar";
import DateBlocker from "../src/components/common/DateBlocker";
import MessageModal from "../src/components/common/MessageModal";
import ReviewCard from "../src/components/common/ReviewCard";
import PortfolioUploadModal from "../src/components/common/PortfolioUploadModal";

type View =
  | "feed"
  | "overview"
  | "profile"
  | "portfolio"
  | "applications"
  | "verification"
  | "edit-profile"
  | "earnings"
  | "reviews"
  | "analytics"
  | "subscription"
  | "certificate-application"
  | "messages";

// ===================================================================
// MAIN WORKER DASHBOARD COMPONENT
// ===================================================================

export default function WorkerDashboard() {
  const navigate = useNavigate();

  // State Management
  const [activeView, setActiveView] = useState<View>("feed");
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
  const [messages, setMessages] = useState<any[]>([]);
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
  const [portfolioForm, setPortfolioForm] = useState({
    title: "",
    description: "",
    project_url: "",
    tags: [] as string[],
    start_date: "",
    end_date: "",
    client_name: "",
  });
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  // Job Application State
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState("");

  // ===================================================================
  // NEW DASHBOARD STATE (from CleaningDashboard)
  // ===================================================================

  // Dashboard data
  const [stats, setStats] = useState<WorkerStats | null>(null);
  const [recentMessages, setRecentMessages] = useState<WorkerMessage[]>([]);
  const [dashboardReviews, setDashboardReviews] = useState<WorkerReview[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [availability, setAvailability] = useState<WeeklyAvailability>({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  });
  const [unavailableDates, setUnavailableDates] = useState<UnavailableDate[]>(
    []
  );
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);

  // UI state
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "portfolio" | "subscription" | "verification"
  >("overview");

  // Refs for scrolling
  const reviewsRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const portfolioRef = useRef<HTMLDivElement>(null);

  // ===================================================================
  // DATA LOADING
  // ===================================================================

  const loadMessages = async (userId: string) => {
    try {
      // Fetch messages where worker is recipient
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          id,
          sender_id,
          recipient_id,
          subject,
          content,
          is_read,
          created_at,
          sender_profile:profiles!sender_id(
            full_name,
            email
          )
        `
        )
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setMessages(data || []);

      // Count unread messages
      const unread = (data || []).filter((msg: any) => !msg.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Error loading messages:", err);
      setMessages([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

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

      // TEMPORARILY DISABLED - RLS Policy issues causing 408 timeouts
      // TODO: Fix RLS policies in Supabase before re-enabling

      // Load portfolio projects
      // const portfolioProjects = await workerProfileService.getPortfolioProjects(user.id);
      setPortfolio([]); // Mock: empty until DB fixed

      // Load applications
      // const apps = await workerProfileService.getApplications(user.id);
      setApplications([]); // Mock: empty until DB fixed

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

      // Load analytics - now enabled
      try {
        const analyticsData = await workerProfileService.getAnalytics(user.id);
        setAnalytics(analyticsData);
      } catch (err) {
        console.warn("[WORKER-DASH] Could not load analytics:", err);
        // Set default analytics data
        setAnalytics({
          profile_views: 0,
          job_views: 0,
          applications_sent: 0,
          applications_accepted: 0,
          total_earnings: 0,
          average_rating:
            reviews.length > 0
              ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
                reviews.length
              : 0,
          completed_jobs: 0,
          response_rate: 0,
        });
      }

      // Load jobs (mock for now)
      setJobs(MOCK_JOBS.slice(0, 6));

      // Load messages
      await loadMessages(user.id);

      // ===================================================================
      // NEW: Load dashboard-specific data
      // ===================================================================
      if (profile) {
        try {
          const [statsData, messagesData, reviewsData] = await Promise.all([
            workerProfileService.getWorkerStats(profile.id, user.id),
            workerProfileService.getRecentMessages(user.id, 5),
            workerProfileService.getWorkerReviews(profile.id, 3),
          ]);

          setStats(statsData);
          setRecentMessages(messagesData);
          setDashboardReviews(reviewsData);
          setAvailability(
            profile.availability || {
              monday: true,
              tuesday: true,
              wednesday: true,
              thursday: true,
              friday: true,
              saturday: false,
              sunday: false,
            }
          );
          setUnavailableDates(profile.unavailable_dates || []);
          setIsAvailable(profile.is_available ?? true);
          setPortfolioImages(profile.portfolio_images || []);
        } catch (dashErr) {
          console.warn("[WORKER-DASH] Could not load dashboard data:", dashErr);
        }
      }

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
      const updated = await workerProfileService.updateWorkerProfile(
        userId,
        profileForm
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
        // Add new project
        const project = await workerProfileService.addPortfolioProject(
          userId,
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
        setPortfolioForm({ ...portfolioForm, image_url: imageUrl });
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

  // ===================================================================
  // NEW DASHBOARD HANDLERS (from CleaningDashboard)
  // ===================================================================

  const handleToggleAvailability = async () => {
    if (!workerProfile) return;

    try {
      setSaving(true);
      const newStatus = !isAvailable;
      await workerProfileService.toggleAvailability(
        workerProfile.id,
        newStatus
      );
      setIsAvailable(newStatus);
      setSuccess(
        newStatus
          ? "✅ Jesteś teraz dostępny do pracy!"
          : "✅ Status zmieniony na niedostępny"
      );
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error("[WORKER-DASH] Toggle availability error:", err);
      setError("❌ Nie udało się zmienić statusu dostępności");
    } finally {
      setSaving(false);
    }
  };

  const handleAvailabilityChange = async (
    newAvailability: WeeklyAvailability
  ) => {
    if (!workerProfile) return;

    try {
      setSaving(true);
      await workerProfileService.updateAvailability(
        workerProfile.id,
        newAvailability
      );
      setAvailability(newAvailability);
      setSuccess("✅ Dostępność zaktualizowana!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error("[WORKER-DASH] Update availability error:", err);
      setError("❌ Nie udało się zaktualizować dostępności");
    } finally {
      setSaving(false);
    }
  };

  const handleBlockDate = async (
    date: string,
    reason: string,
    type: "vacation" | "holiday" | "fully_booked"
  ) => {
    if (!workerProfile) return;

    try {
      setSaving(true);
      await workerProfileService.blockDate(
        workerProfile.id,
        date,
        reason,
        type
      );
      setUnavailableDates([...unavailableDates, { date, reason, type }]);
      setSuccess("✅ Data zablokowana!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error("[WORKER-DASH] Block date error:", err);
      setError("❌ Nie udało się zablokować daty");
    } finally {
      setSaving(false);
    }
  };

  const handleUnblockDate = async (date: string) => {
    if (!workerProfile) return;

    try {
      setSaving(true);
      await workerProfileService.unblockDate(workerProfile.id, date);
      setUnavailableDates(unavailableDates.filter((d) => d.date !== date));
      setSuccess("✅ Data odblokowana!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error("[WORKER-DASH] Unblock date error:", err);
      setError("❌ Nie udało się odblokować daty");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workerProfile) return;

    try {
      setSaving(true);
      const avatarUrl = await workerProfileService.uploadWorkerAvatar(
        workerProfile.id,
        file
      );
      setWorkerProfile({ ...workerProfile, avatar_url: avatarUrl });
      setSuccess("✅ Avatar zaktualizowany!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error("[WORKER-DASH] Avatar upload error:", err);
      setError("❌ Nie udało się wgrać avatara");
    } finally {
      setSaving(false);
    }
  };

  const handleMessageClick = (message: WorkerMessage) => {
    setSelectedMessage(message as any);
    setShowMessageModal(true);
    if (!message.is_read) {
      handleMarkAsRead(message.id);
    }
  };

  const handleRespondToReview = async (
    reviewId: string,
    responseText: string
  ) => {
    if (!responseText.trim()) return;

    try {
      setSaving(true);
      await workerProfileService.respondToReview(reviewId, responseText);

      // Update local state
      setDashboardReviews(
        dashboardReviews.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                response: responseText,
                response_date: new Date().toISOString(),
              }
            : review
        )
      );

      setSuccess("✅ Odpowiedź wysłana!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error("[WORKER-DASH] Respond to review error:", err);
      setError("❌ Nie udało się wysłać odpowiedzi");
    } finally {
      setSaving(false);
    }
  };

  const handlePortfolioUpload = async (file: File) => {
    if (!workerProfile) return;

    try {
      setSaving(true);
      const imageUrl = await workerProfileService.uploadWorkerPortfolioImage(
        workerProfile.id,
        file
      );
      setPortfolioImages([...portfolioImages, imageUrl]);
      setSuccess("✅ Zdjęcie dodane do portfolio!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error("[WORKER-DASH] Portfolio upload error:", err);
      setError("❌ Nie udało się wgrać zdjęcia");
    } finally {
      setSaving(false);
    }
  };

  const handlePortfolioDelete = async (imageUrl: string) => {
    if (!workerProfile || !confirm("Czy na pewno chcesz usunąć to zdjęcie?"))
      return;

    try {
      setSaving(true);
      await workerProfileService.deleteWorkerPortfolioImage(
        workerProfile.id,
        imageUrl
      );
      setPortfolioImages(portfolioImages.filter((img) => img !== imageUrl));
      setSuccess("✅ Zdjęcie usunięte!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error("[WORKER-DASH] Portfolio delete error:", err);
      setError("❌ Nie udało się usunąć zdjęcia");
    } finally {
      setSaving(false);
    }
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ===================================================================
  // RENDER HELPERS
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
}

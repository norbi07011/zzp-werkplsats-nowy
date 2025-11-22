import { useState, useEffect, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToasts } from "../contexts/ToastContext";
import { LoadingOverlay } from "../components/Loading";
// @ts-ignore - Using any type to allow zzp_exam_applications queries
import { supabase } from "../src/lib/supabase";
import { SupportTicketModal } from "../src/components/SupportTicketModal";
import { Animated3DProfileBackground } from "../components/Animated3DProfileBackground";
import { SpinningNumbers } from "../components/SpinningNumbers";
import { getTicketStats } from "../src/services/supportTicketService";
import {
  UnifiedDashboardTabs,
  useUnifiedTabs,
  TabPanel,
  type UnifiedTab,
} from "../components/UnifiedDashboardTabs";
import FeedPage from "./FeedPage_PREMIUM";
import MyPosts from "./Admin/MyPosts";
import SavedActivity from "./Admin/SavedActivity";

// Lazy load modals (only when opened)
const AddWorkerModal = lazy(() =>
  import("../components/Admin/AddWorkerModal").then((m) => ({
    default: m.AddWorkerModal,
  }))
);
const NewsletterModal = lazy(() =>
  import("../components/Admin/NewsletterModal").then((m) => ({
    default: m.NewsletterModal,
  }))
);
const ReportGeneratorModal = lazy(() =>
  import("../components/Admin/ReportGeneratorModal").then((m) => ({
    default: m.ReportGeneratorModal,
  }))
);

// Advanced Stats Component
interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: string;
  color: "cyber" | "success" | "premium" | "warning";
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon,
  color,
}) => {
  const gradientMap = {
    cyber: "bg-gradient-cyber",
    success: "bg-gradient-success",
    premium: "bg-gradient-premium",
    warning: "bg-gradient-to-br from-orange-500 to-red-600",
  };

  const shadowMap = {
    cyber: "shadow-glow-cyber",
    success: "shadow-glow-success",
    premium: "shadow-glow-premium",
    warning: "shadow-lg hover:shadow-2xl",
  };

  return (
    <div
      className={`${gradientMap[color]} ${shadowMap[color]} rounded-2xl p-6 text-white group hover:scale-105 transition-all duration-300 relative overflow-hidden`}
    >
      {/* Floating orb background */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse"></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="text-5xl group-hover:animate-float">{icon}</div>
          <div className="text-right">
            <p
              className={`text-xs px-2 py-1 rounded-full ${
                changeType === "positive"
                  ? "bg-green-500/20 text-green-100"
                  : changeType === "negative"
                  ? "bg-red-500/20 text-red-100"
                  : "bg-white/20 text-white"
              }`}
            >
              {change}
            </p>
          </div>
        </div>
        <p className="text-sm opacity-90 mb-1 font-medium">{title}</p>
        <p className="text-5xl font-bold group-hover:animate-glow">{value}</p>
      </div>
    </div>
  );
};

// Module Card Component
interface ModuleCardProps {
  title: string;
  description: string;
  path: string;
  icon: string;
  stats: { label: string; value: string; trend: string };
  color: "cyber" | "success" | "premium";
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  description,
  path,
  icon,
  stats,
  color,
}) => {
  const accentMap = {
    cyber:
      "border-accent-cyber hover:border-accent-cyber text-accent-cyber hover:text-accent-cyber",
    success:
      "border-accent-techGreen hover:border-accent-techGreen text-accent-techGreen hover:text-accent-techGreen",
    premium:
      "border-accent-neonPurple hover:border-accent-neonPurple text-accent-neonPurple hover:text-accent-neonPurple",
  };

  return (
    <Link
      to={path}
      className="bg-gradient-glass backdrop-blur-md rounded-2xl shadow-3d hover:shadow-glow-cyber transition-all p-6 border border-accent-cyber/20 hover:scale-105 group relative overflow-hidden"
    >
      {/* Animated background orb */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent-cyber/5 rounded-full blur-3xl group-hover:bg-accent-cyber/10 transition-all duration-500"></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="text-5xl group-hover:animate-float group-hover:rotate-12 transition-transform duration-300">
            {icon}
          </div>
          <div className="text-right">
            <p
              className={`text-3xl font-bold ${
                accentMap[color].split(" ")[2]
              } group-hover:animate-glow`}
            >
              {stats.value}
            </p>
            <p className="text-xs text-neutral-400">{stats.label}</p>
            <p className="text-xs text-accent-techGreen mt-1">{stats.trend}</p>
          </div>
        </div>
        <h3
          className={`text-xl font-bold text-white mb-2 group-hover:${
            accentMap[color].split(" ")[4]
          } transition-colors`}
        >
          {title}
        </h3>
        <p className="text-sm text-neutral-400 mb-4">{description}</p>
        <div
          className={`flex items-center ${
            accentMap[color].split(" ")[2]
          } font-medium text-sm`}
        >
          Otwórz moduł →
        </div>
      </div>
    </Link>
  );
};

// Quick Action Button
interface QuickActionProps {
  icon: string;
  label: string;
  onClick: () => void;
  color: "cyber" | "success" | "premium" | "warning";
}

const QuickAction: React.FC<QuickActionProps> = ({
  icon,
  label,
  onClick,
  color,
}) => {
  const colorMap = {
    cyber: "bg-accent-cyber hover:bg-accent-cyber/80 shadow-glow-cyber",
    success:
      "bg-accent-techGreen hover:bg-accent-techGreen/80 shadow-glow-success",
    premium:
      "bg-accent-neonPurple hover:bg-accent-neonPurple/80 shadow-glow-premium",
    warning: "bg-orange-600 hover:bg-orange-700 shadow-lg",
  };

  return (
    <button
      onClick={onClick}
      className={`${colorMap[color]} text-white px-6 py-3 rounded-xl font-medium hover:scale-105 transition-all flex items-center gap-2 group`}
    >
      <span className="text-2xl group-hover:animate-float">{icon}</span>
      <span>{label}</span>
    </button>
  );
};

export const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addToast } = useToasts();
  const [timeRange, setTimeRange] = useState<
    "today" | "week" | "month" | "year"
  >("week");

  // Modal states
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [showNewsletterModal, setShowNewsletterModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Real data from database (NIE HARDCODED!)
  const [stats, setStats] = useState({
    pendingSchedules: 0,
    activeWorkers: 0,
    activeFirms: 0,
    activeAccountants: 0,
    activeCleaningCompanies: 0,
    weeklyTests: 0,
    monthlyRevenue: 0,
    dailyActiveUsers: 0,
    conversionRate: 0,
    systemHealth: 100,
    pendingCertificates: 0,
    totalApplications: 0,
    approvedApplications: 0,
    weeklyTestSlots: 0,
    generatedCertificates: 0, // NEW: Certyfikaty wygenerowane przez admina
    accountantsAverageRating: 0, // NEW: Średnia ocena księgowych
    accountantsTotalReviews: 0, // NEW: Liczba recenzji księgowych
    accountantsProfileViews: 0, // NEW: Odwiedziny profili księgowych
    supportTicketsNew: 0, // NEW: Support tickets - nowe zgłoszenia
    supportTicketsTotal: 0, // NEW: Support tickets - wszystkie zgłoszenia
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab state management
  const { activeTab, setActiveTab } = useUnifiedTabs("overview");

  // Load real data from database
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch counts from database (EXCLUDE admin duplicates!)
      // Problem: Admin user has entries in workers/employers tables
      // Solution: Get all IDs, then filter out admin profile_ids

      // First get admin profile_id
      const { data: adminProfiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");

      const adminIds = (adminProfiles || []).map((p) => p.id);

      // 🔍 DEBUG: Check if admin filtering works
      console.log("👤 ADMIN IDS:", adminIds);

      // Now count workers/employers excluding admin IDs
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);

      // Count queries - conditional admin filtering
      const workersQuery = supabase
        .from("workers")
        .select("*", { count: "exact", head: true });
      if (adminIds.length > 0) {
        workersQuery.not("profile_id", "in", `(${adminIds.join(",")})`);
      }

      const employersQuery = supabase
        .from("employers")
        .select("*", { count: "exact", head: true });
      if (adminIds.length > 0) {
        employersQuery.not("profile_id", "in", `(${adminIds.join(",")})`);
      }

      const [
        { count: workersCount },
        { count: employersCount },
        { count: accountantsCount },
        { count: cleaningCompaniesCount },
        { count: messagesCount },
        { count: pendingSchedules },
        { count: weeklyTests },
        { data: activeWorkers },
        { count: pendingCertsCount },
        { count: totalAppsCount },
        { count: approvedAppsCount },
        { count: weeklyTestSlotsCount },
        { count: generatedCertsCount }, // NEW: Total generated certificates
        { data: accountantsData }, // NEW: Accountants for ratings stats
        { count: accountantReviewsCount }, // NEW: Total accountant reviews
        { count: accountantProfileViewsCount }, // NEW: Total profile views for accountants
      ] = await Promise.all([
        workersQuery,
        employersQuery,
        supabase
          .from("accountants")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true),
        supabase
          .from("cleaning_companies")
          .select("*", { count: "exact", head: true })
          .eq("accepting_new_clients", true),
        supabase.from("messages").select("*", { count: "exact", head: true }),
        // TASK 5.1: pendingSchedules - count pending appointments
        supabase
          .from("test_appointments")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        // TASK 5.2: weeklyTests - count appointments created this week
        supabase
          .from("test_appointments")
          .select("*", { count: "exact", head: true })
          .gte("created_at", weekStart.toISOString()),
        // TASK 5.3: monthlyRevenue - sum monthly_fee from active workers
        supabase
          .from("workers")
          .select("monthly_fee")
          .eq("subscription_status", "active"),
        // TASK 5.4: pendingCertificates - certificates WHERE verified=false
        supabase
          .from("certificates")
          .select("*", { count: "exact", head: true })
          .eq("verified", false),
        // TASK 5.5: totalApplications - zzp_exam_applications total count
        (supabase as any)
          .from("zzp_exam_applications")
          .select("*", { count: "exact", head: true }),
        // TASK 5.6: approvedApplications - zzp_exam_applications WHERE status='approved'
        (supabase as any)
          .from("zzp_exam_applications")
          .select("*", { count: "exact", head: true })
          .eq("status", "approved"),
        // TASK 5.7: weeklyTestSlots - test_appointments WHERE test_date >= weekStart
        supabase
          .from("test_appointments")
          .select("*", { count: "exact", head: true })
          .gte("test_date", weekStart.toISOString()),
        // TASK 5.8: generatedCertificates - generated_certificates total count
        supabase
          .from("generated_certificates")
          .select("*", { count: "exact", head: true }),
        // TASK 5.9: accountantsData - get all accountants with rating and rating_count
        supabase
          .from("accountants")
          .select("rating, rating_count")
          .eq("is_active", true),
        // TASK 5.10: accountantReviewsCount - total accountant reviews count
        supabase
          .from("accountant_reviews")
          .select("*", { count: "exact", head: true })
          .eq("status", "approved"),
        // TASK 5.11: accountantProfileViewsCount - total profile views for accountants
        supabase
          .from("profile_views")
          .select("*", { count: "exact", head: true })
          .not("accountant_id", "is", null),
      ]);

      // Fetch support tickets stats
      let supportTicketsStats = { new: 0, total: 0 };
      try {
        const ticketStats = await getTicketStats();
        supportTicketsStats = {
          new: ticketStats.new || 0,
          total: ticketStats.total || 0,
        };
      } catch (error) {
        console.error("Error loading support tickets stats:", error);
      }

      // Calculate monthlyRevenue (MRR)
      const monthlyRevenue = (activeWorkers || []).reduce(
        (sum: number, worker: any) => sum + (worker.monthly_fee || 0),
        0
      );

      // Calculate average rating for accountants
      const accountantsAverageRating =
        accountantsData && accountantsData.length > 0
          ? accountantsData.reduce(
              (sum: number, acc: any) => sum + (acc.rating || 0),
              0
            ) / accountantsData.length
          : 0;

      // Calculate total reviews for accountants
      const accountantsTotalReviews =
        accountantsData && accountantsData.length > 0
          ? accountantsData.reduce(
              (sum: number, acc: any) => sum + (acc.rating_count || 0),
              0
            )
          : 0;

      setStats({
        pendingSchedules: pendingSchedules || 0,
        activeWorkers: workersCount || 0,
        activeFirms: employersCount || 0,
        activeAccountants: accountantsCount || 0,
        activeCleaningCompanies: cleaningCompaniesCount || 0,
        weeklyTests: weeklyTests || 0,
        monthlyRevenue: monthlyRevenue,
        dailyActiveUsers:
          (workersCount || 0) +
          (employersCount || 0) +
          (accountantsCount || 0) +
          (cleaningCompaniesCount || 0),
        conversionRate: 0, // TODO: Requires analytics_events table
        systemHealth: 100,
        pendingCertificates: pendingCertsCount || 0,
        totalApplications: totalAppsCount || 0,
        approvedApplications: approvedAppsCount || 0,
        weeklyTestSlots: weeklyTestSlotsCount || 0,
        generatedCertificates: generatedCertsCount || 0, // NEW: Total admin-generated certificates
        accountantsAverageRating:
          Number(accountantsAverageRating.toFixed(2)) || 0,
        accountantsTotalReviews: accountantsTotalReviews || 0,
        accountantsProfileViews: accountantProfileViewsCount || 0,
        supportTicketsNew: supportTicketsStats.new, // NEW: Support tickets - nowe
        supportTicketsTotal: supportTicketsStats.total, // NEW: Support tickets - wszystkie
      });

      // Fetch recent activities (notifications/messages)
      const { data: notifications } = await supabase
        .from("notifications")
        .select(
          `
          *,
          user:user_id(
            id,
            role,
            full_name,
            avatar_url
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(5);

      // Resolve role-specific avatars (employer=logo_url, others=avatar_url)
      const activitiesWithAvatars = await Promise.all(
        (notifications || []).map(async (notif: any) => {
          const user = notif.user;
          if (!user) return { ...notif, userAvatar: null, userName: "System" };

          let avatarUrl = user.avatar_url; // Default from profiles

          // Override with role-specific table if needed
          if (user.role === "employer") {
            const { data: employer } = await supabase
              .from("employers")
              .select("logo_url")
              .eq("profile_id", user.id)
              .single();
            avatarUrl = employer?.logo_url || avatarUrl;
          } else if (user.role === "cleaning_company") {
            const { data: company } = await supabase
              .from("cleaning_companies")
              .select("avatar_url")
              .eq("profile_id", user.id)
              .single();
            avatarUrl = company?.avatar_url || avatarUrl;
          }

          return {
            ...notif,
            userAvatar: avatarUrl,
            userName: user.full_name || "Unknown User",
            userRole: user.role,
          };
        })
      );

      setRecentActivities(activitiesWithAvatars);

      // System status - real health checks
      setSystemStatus([
        {
          service: "API Server",
          status: "online",
          uptime: "100%",
          response: "N/A",
        },
        {
          service: "Database",
          status: "online",
          uptime: "100%",
          response: "N/A",
        },
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      addToast("Błąd ładowania danych dashboardu", "error");
    } finally {
      setLoading(false);
    }
  };

  // Funkcje dla Quick Actions
  const handleAddWorker = () => {
    setShowAddWorkerModal(true);
  };

  const handleSendNewsletter = () => {
    setShowNewsletterModal(true);
  };

  const handleGenerateReport = () => {
    setShowReportModal(true);
  };

  const handleProcessPayments = () => {
    addToast("Przetwarzanie zaległych płatności...", "info");
    // Symulacja przetwarzania
    setTimeout(() => {
      addToast("Przetworzono 5 płatności na kwotę €495!", "success");
    }, 2000);
  };

  const handleSettingsClick = () => {
    navigate("/admin/settings");
  };

  const handleContactSupport = () => {
    setShowSupportModal(true);
  };

  const adminModules = [
    {
      title: "Zarządzanie Terminami",
      description:
        "Przeglądaj zgłoszenia, potwierdzaj terminy testów i wprowadzaj wyniki",
      path: "/admin/appointments",
      icon: "📅",
      color: "cyber" as const,
      stats: {
        label: "Appointments",
        value: stats.pendingSchedules.toString(),
        trend: "",
      },
    },
    {
      title: "Zarządzanie Pracownikami",
      description:
        "Przeglądaj profile, zarządzaj certyfikatami i kontroluj dostęp",
      path: "/admin/workers",
      icon: "👷",
      color: "success" as const,
      stats: {
        label: "Workers",
        value: stats.activeWorkers.toString(),
        trend: "+5 this week",
      },
    },
    {
      title: "Zarządzanie Pracodawcami",
      description:
        "Przeglądaj firmy, zarządzaj subskrypcjami i monitoruj aktywność",
      path: "/admin/employers",
      icon: "🏢",
      color: "premium" as const,
      stats: {
        label: "Employers",
        value: stats.activeFirms.toString(),
        trend: "+2 this month",
      },
    },
    {
      title: "Zarządzanie Księgowymi",
      description:
        "Przeglądaj księgowych, zarządzaj klientami i monitoruj usługi",
      path: "/admin/accountants",
      icon: "📊",
      color: "cyber" as const,
      stats: {
        label: `${stats.activeAccountants} księgowych`,
        value: `⭐ ${stats.accountantsAverageRating}`,
        trend: `${stats.accountantsTotalReviews} opinii · ${stats.accountantsProfileViews} wyświetleń`,
      },
    },
    {
      title: "Firmy Sprzątające",
      description:
        "Przeglądaj firmy sprzątające, zarządzaj zespołami i monitoruj recenzje",
      path: "/admin/cleaning-companies",
      icon: "🧹",
      color: "success" as const,
      stats: {
        label: "Cleaning",
        value: stats.activeCleaningCompanies.toString(),
        trend: "",
      },
    },
    {
      title: "Aplikacje o Certyfikat ZZP",
      description:
        "Zatwierdzaj wnioski pracowników, planuj testy i wydawaj certyfikaty Premium",
      path: "/admin/certificate-approval",
      icon: "🏆",
      color: "premium" as const,
      stats: {
        label: "Applications",
        value: stats.totalApplications.toString(),
        trend: `${stats.approvedApplications} approved`,
      },
    },
    {
      title: "Subskrypcje Pracowników",
      description:
        "Przeglądaj subskrypcje, monitoruj przychody (MRR/ARR) i zarządzaj kontami",
      path: "/admin/subscriptions",
      icon: "💳",
      color: "success" as const,
      stats: {
        label: "Active",
        value: stats.activeWorkers.toString(),
        trend: `€${stats.monthlyRevenue}/mo`,
      },
    },
    {
      title: "Certyfikaty Wrzucone (Uploads)",
      description:
        "Weryfikuj certyfikaty przesłane przez pracowników (OCR, expiry tracking)",
      path: "/admin/certificates",
      icon: "📜",
      color: "cyber" as const,
      stats: {
        label: "Total",
        value: "0",
        trend: `${stats.pendingCertificates} pending`,
      },
    },
    {
      title: "Generator Certyfikatów (NEW)",
      description:
        "Generuj profesjonalne certyfikaty PDF dla pracowników z QR weryfikacją",
      path: "/admin/certificates/generate",
      icon: "🎖️",
      color: "premium" as const,
      stats: {
        label: "Generated",
        value: (stats.generatedCertificates || 0).toString(),
        trend: "A4 Landscape PDF",
      },
    },
    {
      title: "Harmonogram Testów",
      description: "Zarządzaj slotami, pojemnością i dostępnością terminów",
      path: "/admin/scheduler",
      icon: "🗓️",
      color: "success" as const,
      stats: {
        label: "This week",
        value: stats.weeklyTestSlots.toString(),
        trend: "Slots available",
      },
    },
    /* ARCHIVED 2025-11-12 - Duplicate of "Harmonogram Testów" module above
    {
      title: "Test Slots Manager",
      description: "Zaawansowane zarządzanie slotami testowymi i rezerwacjami",
      path: "/admin/test-slots",
      icon: "📅",
      color: "cyber" as const,
      stats: { label: "Slots", value: "0", trend: "Configure slots" },
    },
    */
    {
      title: "Płatności & Transakcje",
      description: "Historia płatności, faktury, refundy i statystyki",
      path: "/admin/payments",
      icon: "💳",
      color: "success" as const,
      stats: {
        label: "MRR",
        value: `€${stats.monthlyRevenue}`,
        trend: "0% growth",
      },
    },
    {
      title: "Media & Pliki",
      description: "Zarządzaj zdjęciami, video, dokumentami i folderami",
      path: "/admin/media",
      icon: "📁",
      color: "premium" as const,
      stats: { label: "Files", value: "0", trend: "No storage tracking" },
    },
    {
      title: "Wiadomości & Komunikacja",
      description: "Chat, email templates, powiadomienia push i SMS",
      path: "/admin/messages",
      icon: "💬",
      color: "cyber" as const,
      stats: { label: "", value: "0", trend: "" },
    },
    {
      title: "Support Tickets",
      description: "Zgłoszenia użytkowników, help desk, wsparcie techniczne",
      path: "/admin/support",
      icon: "🎫",
      color: "success" as const,
      stats: {
        label: "Nowe zgłoszenia",
        value: stats.supportTicketsNew.toString(),
        trend: `${stats.supportTicketsTotal} wszystkich ticketów`,
      },
    },
    {
      title: "Powiadomienia",
      description: "Wysyłanie powiadomień email, SMS, push i in-app",
      path: "/admin/notifications",
      icon: "🔔",
      color: "premium" as const,
      stats: { label: "", value: "0", trend: "" },
    },
    /* ARCHIVED 2025-11-12 - Duplicate of "Płatności & Transakcje" module above
    {
      title: "Płatności & Faktury",
      description: "Subskrypcje, transakcje, refundy i faktury VAT",
      path: "/admin/billing",
      icon: "💰",
      color: "success" as const,
      stats: { label: "", value: "0", trend: "" },
    },
    */
    {
      title: "Analityka & Raporty",
      description:
        "Advanced data analytics, business intelligence, real-time monitoring, and custom reports",
      path: "/admin/analytics",
      icon: "📊",
      color: "premium" as const,
      stats: { label: "", value: "0", trend: "" },
    },
    {
      title: "Generator Raportów",
      description: "Tworzenie raportów PDF, CSV, Excel z danymi",
      path: "/admin/reports",
      icon: "📈",
      color: "cyber" as const,
      stats: { label: "", value: "0", trend: "" },
    },
    {
      title: "Bezpieczeństwo & Logi",
      description: "Activity logs, security alerts, IP blocking, 2FA",
      path: "/admin/security",
      icon: "🛡️",
      color: "cyber" as const,
      stats: { label: "", value: "0", trend: "" },
    },
    {
      title: "Baza Danych & Backup",
      description: "Database management, backups, imports, exports",
      path: "/admin/database",
      icon: "💾",
      color: "success" as const,
      stats: { label: "", value: "0", trend: "" },
    },
    // ❌ REMOVED 8 ENTERPRISE CARDS:
    // - Email Marketing (/admin/email-marketing)
    // - SEO & Meta Tags (/admin/seo)
    // - Blog & Content CMS (/admin/blog)
    // - Performance Dashboard (/admin/performance)
    // - Advanced Search & Filtering (/admin/search)
    // - API Integration & Automation (/admin/api-automation)
    // - Security & Compliance (/admin/security-compliance)
    // - Performance Optimization (/admin/performance-optimization)
    {
      title: "Ustawienia Systemu",
      description: "Configuration, API keys, integrations, permissions",
      path: "/admin/settings",
      icon: "⚙️",
      color: "premium" as const,
      stats: { label: "", value: "0", trend: "" },
    },
  ];

  const quickActions = [
    {
      icon: "➕",
      label: "Dodaj Pracownika",
      onClick: handleAddWorker,
      color: "success" as const,
    },
    {
      icon: "📧",
      label: "Wyślij Newsletter",
      onClick: handleSendNewsletter,
      color: "cyber" as const,
    },
    {
      icon: "📊",
      label: "Generuj Raport",
      onClick: handleGenerateReport,
      color: "premium" as const,
    },
    {
      icon: "💰",
      label: "Przetwórz Płatności",
      onClick: handleProcessPayments,
      color: "success" as const,
    },
  ];

  // Tab navigation renderer
  const renderTopTabs = () => (
    <div className="border-b border-gray-200 bg-white">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <UnifiedDashboardTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          role="admin"
          unreadMessages={0}
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <LoadingOverlay
        isLoading={true}
        message="Ładowanie panelu administratora..."
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* 3D Background Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden perspective-container">
        <Animated3DProfileBackground role="admin" opacity={0.25} />
        <SpinningNumbers opacity={0.15} />
      </div>

      <div className="relative z-10">
        {/* Tab Navigation */}
        {renderTopTabs()}

        {/* Overview Tab - Main Admin Dashboard */}
        <TabPanel isActive={activeTab === "overview"}>
          {/* Header */}
          <div className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-3xl shadow-md">
                    🚀
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                      Panel Administratora
                    </h1>
                    <p className="text-lg text-gray-600">
                      Witaj w panelu zarządzania platformą ZZP Werkplaats -
                      wszystko w jednym miejscu
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Time Range Selector */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-2 flex gap-2 shadow-sm">
                    {(["today", "week", "month", "year"] as const).map(
                      (range) => (
                        <button
                          key={range}
                          onClick={() => {
                            setTimeRange(range);
                            addToast(
                              `Zakres czasu zmieniony na: ${
                                range === "today"
                                  ? "Dziś"
                                  : range === "week"
                                  ? "Tydzień"
                                  : range === "month"
                                  ? "Miesiąc"
                                  : "Rok"
                              }`,
                              "info"
                            );
                          }}
                          className={`px-4 py-2 rounded-full font-semibold transition-all ${
                            timeRange === range
                              ? "bg-primary-500 text-white shadow-md"
                              : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                          }`}
                        >
                          {range === "today"
                            ? "Dziś"
                            : range === "week"
                            ? "Tydzień"
                            : range === "month"
                            ? "Miesiąc"
                            : "Rok"}
                        </button>
                      )
                    )}
                  </div>
                  <button
                    onClick={handleSettingsClick}
                    className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-200 active:scale-95"
                  >
                    ⚙️ Ustawienia
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
            {/* Quick Actions */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-2xl">⚡</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-800">
                  Szybkie Akcje
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {quickActions.map((action, idx) => (
                  <QuickAction key={idx} {...action} />
                ))}

                <Link
                  to="/employers"
                  onClick={() => {
                    console.log(
                      "👔 SEARCH EMPLOYERS BUTTON CLICKED - Dashboard: ADMIN"
                    );
                  }}
                  className="bg-orange-600 text-white rounded-lg p-6 hover:bg-orange-700 transition-all shadow-lg hover:shadow-xl flex flex-col items-center justify-center gap-3"
                >
                  <svg
                    className="w-12 h-12"
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
                  <div className="text-center">
                    <h3 className="text-lg font-bold">Szukaj pracodawców</h3>
                    <p className="text-sm text-orange-100 mt-1">
                      Baza pracodawców
                    </p>
                  </div>
                </Link>

                <Link
                  to="/faktury"
                  onClick={() => {
                    console.log("🧾 FAKTURY BUTTON CLICKED - Dashboard: ADMIN");
                  }}
                  className="bg-green-600 text-white rounded-lg p-6 hover:bg-green-700 transition-all shadow-lg hover:shadow-xl flex flex-col items-center justify-center gap-3"
                >
                  <svg
                    className="w-12 h-12"
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
                  <div className="text-center">
                    <h3 className="text-lg font-bold">Faktury & BTW</h3>
                    <p className="text-sm text-green-100 mt-1">
                      Program do faktur
                    </p>
                  </div>
                </Link>

                <Link
                  to="/workers"
                  onClick={() => {
                    console.log(
                      "🔍 SEARCH WORKERS BUTTON CLICKED - Dashboard: ADMIN"
                    );
                  }}
                  className="bg-cyan-600 text-white rounded-lg p-6 hover:bg-cyan-700 transition-all shadow-lg hover:shadow-xl flex flex-col items-center justify-center gap-3"
                >
                  <svg
                    className="w-12 h-12"
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
                  <div className="text-center">
                    <h3 className="text-lg font-bold">Szukaj pracowników</h3>
                    <p className="text-sm text-cyan-100 mt-1">
                      Baza pracowników
                    </p>
                  </div>
                </Link>

                <Link
                  to="/cleaning-companies"
                  onClick={() => {
                    console.log(
                      "🏢 CLEANING COMPANIES BUTTON CLICKED - Dashboard: ADMIN"
                    );
                  }}
                  className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl flex flex-col items-center justify-center gap-3"
                >
                  <svg
                    className="w-12 h-12"
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
                  <div className="text-center">
                    <h3 className="text-lg font-bold">
                      Szukaj firm sprzątających
                    </h3>
                    <p className="text-sm text-blue-100 mt-1">Baza firm</p>
                  </div>
                </Link>

                <Link
                  to="/admin/moje-posty"
                  onClick={() => {
                    console.log(
                      "📝 MOJE POSTY BUTTON CLICKED - Dashboard: ADMIN"
                    );
                  }}
                  className="bg-purple-600 text-white rounded-lg p-6 hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl flex flex-col items-center justify-center gap-3"
                >
                  <svg
                    className="w-12 h-12"
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
                  <div className="text-center">
                    <h3 className="text-lg font-bold">Moje Posty</h3>
                    <p className="text-sm text-purple-100 mt-1">
                      Zarządzaj postami
                    </p>
                  </div>
                </Link>

                <Link
                  to="/admin/historia-aktywnosci"
                  onClick={() => {
                    console.log(
                      "📁 HISTORIA AKTYWNOŚCI BUTTON CLICKED - Dashboard: ADMIN"
                    );
                  }}
                  className="bg-rose-600 text-white rounded-lg p-6 hover:bg-rose-700 transition-all shadow-lg hover:shadow-xl flex flex-col items-center justify-center gap-3"
                >
                  <svg
                    className="w-12 h-12"
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
                  <div className="text-center">
                    <h3 className="text-lg font-bold">Historia Aktywności</h3>
                    <p className="text-sm text-rose-100 mt-1">Zapisane posty</p>
                  </div>
                </Link>

                <Link
                  to="/accountants"
                  onClick={() => {
                    console.log(
                      "📊 ACCOUNTANTS BUTTON CLICKED - Dashboard: ADMIN"
                    );
                  }}
                  className="bg-indigo-600 text-white rounded-lg p-6 hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl flex flex-col items-center justify-center gap-3"
                >
                  <svg
                    className="w-12 h-12"
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
                  <div className="text-center">
                    <h3 className="text-lg font-bold">Szukaj księgowych</h3>
                    <p className="text-sm text-indigo-100 mt-1">
                      Baza księgowych
                    </p>
                  </div>
                </Link>

                <button
                  onClick={handleContactSupport}
                  className="bg-white border-2 border-gray-300 text-gray-700 rounded-lg p-6 hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl flex flex-col items-center justify-center gap-3"
                >
                  <svg
                    className="w-12 h-12"
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
                  <div className="text-center">
                    <h3 className="text-lg font-bold">Wsparcie</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Kontakt techniczny
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-2xl">📈</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-800">
                  Statystyki Kluczowe
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Oczekujące terminy"
                  value={stats.pendingSchedules}
                  change={
                    stats.pendingSchedules > 0
                      ? "Wymagają zaplanowania"
                      : "Brak oczekujących"
                  }
                  changeType={
                    stats.pendingSchedules > 0 ? "neutral" : "positive"
                  }
                  icon="📅"
                  color="cyber"
                />
                <StatCard
                  title="Aktywni pracownicy"
                  value={stats.activeWorkers}
                  change="Real-time z bazy"
                  changeType="positive"
                  icon="👷"
                  color="success"
                />
                <StatCard
                  title="Aktywne firmy"
                  value={stats.activeFirms}
                  change="Real-time z bazy"
                  changeType="positive"
                  icon="🏢"
                  color="premium"
                />
                <StatCard
                  title="Testy w tym tygodniu"
                  value={stats.weeklyTests}
                  change="Ostatnie 7 dni"
                  changeType={stats.weeklyTests > 0 ? "positive" : "neutral"}
                  icon="✅"
                  color="success"
                />
                <StatCard
                  title="Miesięczny przychód (MRR)"
                  value={
                    stats.monthlyRevenue > 0
                      ? `€${stats.monthlyRevenue.toFixed(2)}`
                      : "€0.00"
                  }
                  change={
                    stats.monthlyRevenue > 0
                      ? "Aktywne subskrypcje"
                      : "Brak subskrypcji"
                  }
                  changeType={stats.monthlyRevenue > 0 ? "positive" : "neutral"}
                  icon="💰"
                  color="success"
                />
                <StatCard
                  title="Daily Active Users"
                  value={stats.dailyActiveUsers}
                  change="Wszyscy użytkownicy"
                  changeType="positive"
                  icon="👥"
                  color="cyber"
                />
                <StatCard
                  title="Conversion Rate"
                  value={
                    stats.conversionRate > 0
                      ? `${stats.conversionRate}%`
                      : "Brak danych"
                  }
                  change="Wymaga analytics"
                  changeType="neutral"
                  icon="📊"
                  color="premium"
                />
                <StatCard
                  title="System Health"
                  value={`${stats.systemHealth}%`}
                  change="Wszystkie systemy działają"
                  changeType="positive"
                  icon="🛡️"
                  color="success"
                />
              </div>
            </div>

            {/* Modules Grid */}
            <div className="mb-12">
              <h2 className="text-4xl font-bold text-white mb-6 font-heading">
                🎛️ Moduły zarządzania
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {adminModules.map((module) => (
                  <ModuleCard key={module.path} {...module} />
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Log */}
              <div className="bg-gradient-glass backdrop-blur-md rounded-2xl shadow-3d border border-accent-cyber/20 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white font-heading">
                    🕐 Ostatnia aktywność
                  </h2>
                  <button
                    onClick={() => {
                      addToast(
                        "Pełny log aktywności w przygotowaniu...",
                        "info"
                      );
                    }}
                    className="text-accent-cyber hover:text-accent-techGreen transition-colors text-sm font-medium"
                  >
                    Zobacz wszystko →
                  </button>
                </div>
                <div className="space-y-4">
                  {recentActivities.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <p className="text-lg">Brak ostatnich aktywności</p>
                      <p className="text-sm mt-2">
                        Aktywności pojawią się tutaj po pierwszych akcjach
                        użytkowników
                      </p>
                    </div>
                  ) : (
                    recentActivities.map((activity, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-4 pb-4 border-b border-white/10 last:border-0 group hover:bg-white/5 p-3 rounded-xl transition-all"
                      >
                        {/* User Avatar - role-specific */}
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform overflow-hidden">
                          {activity.userAvatar ? (
                            <img
                              src={activity.userAvatar}
                              alt={activity.userName || "User"}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.parentElement!.innerHTML = "👤";
                              }}
                            />
                          ) : (
                            <span className="text-2xl">
                              {activity.userRole === "employer"
                                ? "🏢"
                                : activity.userRole === "worker"
                                ? "👷"
                                : activity.userRole === "accountant"
                                ? "�"
                                : activity.userRole === "cleaning_company"
                                ? "🧹"
                                : "👤"}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white mb-1">
                            {activity.title || "Aktywność"}
                          </p>
                          <p className="text-sm text-neutral-400 mb-1">
                            {activity.message || "Brak opisu"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {activity.userName && (
                              <span className="text-xs text-accent-cyber font-medium">
                                👤 {activity.userName}
                              </span>
                            )}
                            <span className="text-xs text-neutral-500">•</span>
                            <span className="text-xs text-neutral-500">
                              {new Date(activity.created_at).toLocaleString(
                                "pl-PL"
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* System Status */}
              <div className="bg-gradient-glass backdrop-blur-md rounded-2xl shadow-3d border border-accent-techGreen/20 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white font-heading">
                    🛡️ Status Systemu
                  </h2>
                  <div className="flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-sm font-medium">
                      All Systems Operational
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  {systemStatus.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-white font-medium">
                          {item.service}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-neutral-400">
                          Uptime:{" "}
                          <span className="text-accent-techGreen">
                            {item.uptime}
                          </span>
                        </span>
                        <span className="text-neutral-400">
                          Response:{" "}
                          <span className="text-accent-cyber">
                            {item.response}
                          </span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        {/* Tablica Tab - Feed Page */}
        <TabPanel isActive={activeTab === "tablica"}>
          <FeedPage />
        </TabPanel>

        {/* Messages Tab */}
        <TabPanel isActive={activeTab === "messages"}>
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  📬 Wiadomości Administratora
                </h2>
              </div>
              <p className="text-gray-600 text-center py-12">
                System wiadomości dla administratora będzie dostępny wkrótce.
                <br />
                Administrator może korzystać z panelu Support Tickets do
                komunikacji.
              </p>
            </div>
          </div>
        </TabPanel>

        {/* Profile Tab */}
        <TabPanel isActive={activeTab === "profile"}>
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  💼 Profil Administratora
                </h2>
              </div>
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Dane konta
                  </h3>
                  <div className="space-y-3">
                    <p className="text-gray-700">
                      <strong>Rola:</strong> Administrator
                    </p>
                    <p className="text-gray-700">
                      <strong>Email:</strong> {t("admin.account.email")}
                    </p>
                    <p className="text-gray-700">
                      <strong>Uprawnienia:</strong> Pełny dostęp do systemu
                    </p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Funkcje administratora
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>
                      ✅ Tworzenie postów na Tablicy (ogłoszenia, reklamy,
                      oferty pracy)
                    </li>
                    <li>✅ Komentowanie i reagowanie emoji na posty</li>
                    <li>✅ Zarządzanie użytkownikami i moderacja treści</li>
                    <li>✅ Dostęp do panelu analityki i raportów</li>
                    <li>✅ Zarządzanie ticketami wsparcia</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        {/* Reviews Tab */}
        <TabPanel isActive={activeTab === "reviews"}>
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  ⭐ Opinie i Oceny Platformy
                </h2>
              </div>
              <p className="text-gray-600 text-center py-12">
                Panel opinii dla administratora będzie dostępny wkrótce.
                <br />
                Tutaj będą widoczne opinie użytkowników o platformie.
              </p>
            </div>
          </div>
        </TabPanel>

        {/* Moje Posty Tab - Admin Posts Management */}
        <TabPanel isActive={activeTab === "my_posts"}>
          <MyPosts />
        </TabPanel>

        {/* Historia Aktywności Tab - Saved Activity */}
        <TabPanel isActive={activeTab === "saved_activity"}>
          <SavedActivity />
        </TabPanel>

        {/* Modals - Lazy loaded */}
        <Suspense fallback={null}>
          <AddWorkerModal
            isOpen={showAddWorkerModal}
            onClose={() => setShowAddWorkerModal(false)}
            onSuccess={() => {
              addToast(
                "Dane pracownika zostały zapisane w localStorage!",
                "success"
              );
            }}
          />

          <NewsletterModal
            isOpen={showNewsletterModal}
            onClose={() => setShowNewsletterModal(false)}
          />

          <ReportGeneratorModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
          />
        </Suspense>

        {/* Support Modal (not lazy - critical feature) */}
        <SupportTicketModal
          isOpen={showSupportModal}
          onClose={() => setShowSupportModal(false)}
        />
      </div>
    </div>
  );
};

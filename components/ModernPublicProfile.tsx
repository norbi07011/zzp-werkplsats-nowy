/**
 * ModernPublicProfile - Nowoczesny komponent profilu publicznego
 * Wzorowany na designie Mark de Jong
 * Używany przez: Worker, Accountant, Employer, CleaningCompany
 */
import { useState, ReactNode } from "react";
import {
  Star,
  MapPin,
  Mail,
  Phone,
  Globe,
  Briefcase,
  Award,
  CheckCircleIcon,
  ArrowLeft,
  Calendar,
  User,
  ExternalLink,
  Heart,
  Share2,
  MessageSquare,
} from "./icons";

// ============ TYPES ============
export interface ProfileStatCard {
  value: string | number;
  label: string;
  icon?: ReactNode;
}

export interface ProfileDetails {
  location?: string;
  country?: string;
  website?: string;
  email?: string;
  phone?: string;
}

export interface SkillTag {
  name: string;
  level?: "beginner" | "intermediate" | "expert";
}

export interface PortfolioImage {
  url: string;
  title?: string;
  description?: string;
}

export interface ModernPublicProfileProps {
  // Required
  name: string;
  role: string; // e.g. "ZZP Timmerman", "Księgowy", "Pracodawca"
  roleType: "worker" | "accountant" | "employer" | "cleaning_company" | "admin";

  // Optional
  avatarUrl?: string;
  coverImageUrl?: string;
  isVerified?: boolean;
  badge?: string; // e.g. "PRACOWNIK", "WARSZTAT", "PREMIUM"
  badgeColor?: string; // Tailwind color class

  // Stats cards (max 3)
  stats?: ProfileStatCard[];

  // Bio / About
  bio?: string;

  // Details sidebar
  details?: ProfileDetails;

  // Skills/Specializations
  skills?: SkillTag[];

  // Languages
  languages?: string[];

  // Portfolio images
  portfolio?: PortfolioImage[];

  // Rating
  rating?: number;
  ratingCount?: number;

  // Experience
  yearsExperience?: number;
  completedProjects?: number;
  clientsCount?: number;

  // Actions
  onContact?: () => void;
  onBack?: () => void;
  backLabel?: string;
  backUrl?: string;

  // Custom content
  customTabs?: {
    id: string;
    label: string;
    icon: string;
    content: ReactNode;
  }[];
  sidebarExtra?: ReactNode;
  headerExtra?: ReactNode;

  // Invite to team
  showInviteButton?: boolean;
  onInvite?: () => void;

  // Loading state
  loading?: boolean;
}

// ============ COMPONENT ============
export function ModernPublicProfile({
  name,
  role,
  roleType,
  avatarUrl,
  coverImageUrl,
  isVerified = false,
  badge,
  badgeColor = "bg-brand-500 text-white",
  stats = [],
  bio,
  details,
  skills = [],
  languages = [],
  portfolio = [],
  rating,
  ratingCount,
  yearsExperience,
  completedProjects,
  clientsCount,
  onContact,
  onBack,
  backLabel = "Wróć",
  backUrl,
  customTabs = [],
  sidebarExtra,
  headerExtra,
  showInviteButton = false,
  onInvite,
  loading = false,
}: ModernPublicProfileProps) {
  // Set default active tab to first customTab if exists, otherwise "about"
  const [activeTab, setActiveTab] = useState<string>(
    customTabs.length > 0 ? customTabs[0].id : "about"
  );
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Color schemes per role type
  const roleColors = {
    worker: {
      primary: "from-blue-600 to-indigo-700",
      accent: "bg-blue-500",
      text: "text-blue-600",
      light: "bg-blue-50",
      ring: "ring-blue-500",
    },
    accountant: {
      primary: "from-amber-500 to-orange-600",
      accent: "bg-amber-500",
      text: "text-amber-600",
      light: "bg-amber-50",
      ring: "ring-amber-500",
    },
    employer: {
      primary: "from-emerald-600 to-teal-700",
      accent: "bg-emerald-500",
      text: "text-emerald-600",
      light: "bg-emerald-50",
      ring: "ring-emerald-500",
    },
    cleaning_company: {
      primary: "from-purple-600 to-violet-700",
      accent: "bg-purple-500",
      text: "text-purple-600",
      light: "bg-purple-50",
      ring: "ring-purple-500",
    },
    admin: {
      primary: "from-slate-700 to-slate-900",
      accent: "bg-slate-600",
      text: "text-slate-600",
      light: "bg-slate-50",
      ring: "ring-slate-500",
    },
  };

  const colors = roleColors[roleType] || roleColors.worker;

  // Default tabs (only if no customTabs provided)
  const defaultTabs = [
    { id: "about", label: "Over mij", icon: "📋" },
    ...(portfolio.length > 0
      ? [{ id: "portfolio", label: "Portfolio", icon: "📸" }]
      : []),
  ];

  // If customTabs provided, use them exclusively. Otherwise use defaultTabs.
  const allTabs =
    customTabs.length > 0
      ? customTabs.map((t) => ({ id: t.id, label: t.label, icon: t.icon }))
      : defaultTabs;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-24 h-24 bg-slate-200 rounded-full"></div>
          <div className="h-6 w-48 bg-slate-200 rounded"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ============ BACK BUTTON (above cover) ============ */}
      {(onBack || backUrl) && (
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={onBack || (() => (window.location.href = backUrl!))}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{backLabel}</span>
          </button>
        </div>
      )}

      {/* ============ MAIN PROFILE CARD ============ */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* ===== COVER IMAGE (inside card) ===== */}
          <div
            className={`relative h-32 md:h-40 bg-gradient-to-r ${colors.primary} overflow-hidden`}
          >
            {coverImageUrl && (
              <img
                src={coverImageUrl}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>

            {/* Header Extra (edit button etc) */}
            <div className="absolute top-3 right-3">{headerExtra}</div>
          </div>

          {/* ===== PROFILE INFO SECTION ===== */}
          <div className="px-6 md:px-8 pb-6">
            {/* Avatar + Name Row */}
            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-14 md:-mt-16">
              {/* AVATAR */}
              <div className="relative flex-shrink-0">
                <div
                  className={`w-28 h-28 md:w-32 md:h-32 rounded-xl border-4 border-white shadow-xl overflow-hidden bg-white`}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-full h-full ${colors.light} flex items-center justify-center`}
                    >
                      <User className={`w-14 h-14 ${colors.text} opacity-50`} />
                    </div>
                  )}
                </div>

                {/* Verification Badge */}
                {isVerified && (
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-white">
                    <CheckCircleIcon className="w-6 h-6 text-emerald-500" />
                  </div>
                )}
              </div>

              {/* NAME + BADGE + CONTACT BUTTON */}
              <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-2 md:pt-4">
                <div>
                  {/* Name */}
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900">
                    {name}
                  </h1>

                  {/* Role + Badge */}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-slate-600 font-medium">{role}</span>
                    {badge && (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide ${badgeColor}`}
                      >
                        • {badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Contact Button */}
                {onContact && (
                  <button
                    onClick={onContact}
                    className={`px-6 py-3 ${colors.accent} text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 self-start`}
                  >
                    <MessageSquare className="w-5 h-5" />
                    Skontaktuj się
                  </button>
                )}
              </div>
            </div>

            {/* Rating + Quick Info */}
            <div className="mt-4 flex flex-wrap items-center gap-4">
              {/* Rating */}
              {rating !== undefined && (
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${colors.light} border border-slate-200`}
                >
                  <Star className={`w-5 h-5 fill-amber-400 text-amber-400`} />
                  <span className={`text-lg font-black ${colors.text}`}>
                    {rating.toFixed(1)}
                  </span>
                  <span className="text-slate-500 text-sm">
                    ({ratingCount || 0} opinii)
                  </span>
                </div>
              )}

              {/* Quick Info */}
              {details?.location && (
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <MapPin className="w-4 h-4" />
                  <span>{details.location}</span>
                </div>
              )}
              {yearsExperience !== undefined && yearsExperience > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span>{yearsExperience} lat doświadczenia</span>
                </div>
              )}
            </div>

            {/* ===== STATS CARDS ===== */}
            {stats.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
                {stats.slice(0, 3).map((stat, idx) => (
                  <div
                    key={idx}
                    className="text-center p-4 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="text-2xl md:text-3xl font-black text-slate-800 mb-1">
                      {stat.value}
                    </div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ===== TABS (inside card) ===== */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex gap-1 overflow-x-auto pb-2">
                {allTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-5 py-3 rounded-lg font-medium text-sm transition-all whitespace-nowrap
                      ${
                        activeTab === tab.id
                          ? `${colors.accent} text-white shadow-md`
                          : "text-slate-600 hover:bg-slate-100 bg-slate-50"
                      }
                    `}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ CONTENT GRID (below card) ============ */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ===== MAIN CONTENT ===== */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Tab */}
            {activeTab === "about" && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4">
                  <User className="w-5 h-5" />
                  Over mij
                </h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {bio || "Brak opisu."}
                </p>
              </div>
            )}

            {/* Portfolio Tab */}
            {activeTab === "portfolio" && portfolio.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4">
                  📸 Portfolio
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {portfolio.map((img, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border border-slate-100"
                      onClick={() => setLightboxImage(img.url)}
                    >
                      <img
                        src={img.url}
                        alt={img.title || `Portfolio ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Tabs Content */}
            {customTabs.map(
              (tab) =>
                activeTab === tab.id && <div key={tab.id}>{tab.content}</div>
            )}
          </div>

          {/* ===== SIDEBAR ===== */}
          <div className="space-y-6">
            {/* Details Card */}
            {details &&
              (details.location ||
                details.website ||
                details.email ||
                details.phone) && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-800 mb-4 uppercase text-sm tracking-wider">
                    Bliższe dane
                  </h3>
                  <div className="space-y-3">
                    {details.location && (
                      <div className="flex items-center gap-3 text-slate-600">
                        <MapPin className="w-5 h-5 text-slate-400" />
                        <span>
                          {details.location}
                          {details.country ? `, ${details.country}` : ""}
                        </span>
                      </div>
                    )}
                    {details.website && (
                      <a
                        href={
                          details.website.startsWith("http")
                            ? details.website
                            : `https://${details.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-blue-600 hover:underline"
                      >
                        <Globe className="w-5 h-5 text-slate-400" />
                        <span className="truncate">{details.website}</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              )}

            {/* Skills Card */}
            {skills.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-800 mb-4 uppercase text-sm tracking-wider">
                  Umiejętności
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${colors.light} ${colors.text}`}
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages Card */}
            {languages.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-800 mb-4 uppercase text-sm tracking-wider">
                  Języki
                </h3>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Invite Button */}
            {showInviteButton && onInvite && (
              <button
                onClick={onInvite}
                className="w-full px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              >
                👥 Zaproś do zespołu
              </button>
            )}

            {/* Extra Sidebar Content */}
            {sidebarExtra}
          </div>
        </div>
      </div>

      {/* ============ LIGHTBOX ============ */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-4xl font-light hover:opacity-70"
            onClick={() => setLightboxImage(null)}
          >
            ×
          </button>
          <img
            src={lightboxImage}
            alt="Portfolio"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}

export default ModernPublicProfile;

// =====================================================
// PAGE CONTAINER COMPONENT
// =====================================================
// Reusable container with modern Invoice Module styling
// Provides consistent gradient background, spacing, and layout
// =====================================================

import { ReactNode } from "react";
import React from "react";

interface PageContainerProps {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "6xl" | "7xl" | "full";
  className?: string;
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
};

export const PageContainer = ({
  children,
  maxWidth = "7xl",
  className = "",
}: PageContainerProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className={`${maxWidthClasses[maxWidth]} mx-auto p-6 space-y-8 ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

// =====================================================
// PAGE HEADER COMPONENT
// =====================================================
// Modern gradient header with title, subtitle, and optional action button
// =====================================================

interface PageHeaderProps {
  icon?: string;
  title: string;
  subtitle?: string;
  actionButton?: ReactNode;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "premium";
  avatarUrl?: string;
  avatarFallback?: string;
}

export const PageHeader = ({
  icon,
  title,
  subtitle,
  actionButton,
  badge,
  badgeVariant = "premium",
  avatarUrl,
  avatarFallback,
}: PageHeaderProps) => {
  const getBadgeClasses = () => {
    switch (badgeVariant) {
      case "premium":
        return "bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 border-amber-300 shadow-lg shadow-amber-200/50";
      case "success":
        return "bg-gradient-to-r from-emerald-400 to-green-500 text-white border-emerald-300";
      case "warning":
        return "bg-gradient-to-r from-orange-400 to-red-500 text-white border-orange-300";
      default:
        return "bg-white/20 text-white border-white/30";
    }
  };

  const renderAvatar = () => {
    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt="Profile"
          className="w-14 h-14 rounded-full object-cover border-3 border-white/40 shadow-lg"
        />
      );
    }
    if (avatarFallback) {
      return (
        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xl border-3 border-white/40 shadow-lg">
          {avatarFallback}
        </div>
      );
    }
    if (icon) {
      return <span className="heroBannerIcon">{icon}</span>;
    }
    return null;
  };

  return (
    <div className="heroBanner">
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
          {/* Greeting */}
          <div className="heroBannerGreeting">
            {renderAvatar()}
            <h1 className="heroBannerTitle">
              <span className="heroBannerName">{title}</span>
              {badge && (
                <span className={`heroBannerBadge ${getBadgeClasses()}`}>
                  ✨ {badge}
                </span>
              )}
            </h1>
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p
              className="heroBannerSubtitle"
              style={{
                paddingLeft:
                  avatarUrl || avatarFallback ? "70px" : icon ? "44px" : "0",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Right content */}
        {actionButton && <div className="heroBannerRight">{actionButton}</div>}
      </div>

      {/* Bottom shine line */}
      <div className="heroBannerShine" />
    </div>
  );
};

// =====================================================
// STATS GRID COMPONENT
// =====================================================
// Grid of modern stat cards with gradient backgrounds
// =====================================================

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: "red" | "blue" | "green" | "purple" | "orange" | "teal";
}

const colorClasses = {
  red: {
    gradient: "from-red-500/10 to-red-600/10",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    glow: "bg-red-200/30",
  },
  blue: {
    gradient: "from-blue-500/10 to-blue-600/10",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    glow: "bg-blue-200/30",
  },
  green: {
    gradient: "from-green-500/10 to-green-600/10",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    glow: "bg-green-200/30",
  },
  purple: {
    gradient: "from-purple-500/10 to-purple-600/10",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    glow: "bg-purple-200/30",
  },
  orange: {
    gradient: "from-orange-500/10 to-orange-600/10",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    glow: "bg-orange-200/30",
  },
  teal: {
    gradient: "from-teal-500/10 to-teal-600/10",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    glow: "bg-teal-200/30",
  },
};

export const StatCard = ({ title, value, icon, color }: StatCardProps) => {
  const colors = colorClasses[color];

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors.gradient}`}
      ></div>
      <div className="relative flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`p-2 ${colors.iconBg} rounded-xl`}>{icon}</div>
      </div>
      <div className="relative text-3xl font-bold text-gray-900 font-mono">
        {value}
      </div>
      <div
        className={`absolute -bottom-2 -right-2 w-16 h-16 ${colors.glow} rounded-full blur-lg`}
      ></div>
    </div>
  );
};

interface StatsGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
}

export const StatsGrid = ({ children, columns = 4 }: StatsGridProps) => {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-5",
    6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-6",
  };

  return <div className={`grid ${gridCols[columns]} gap-6`}>{children}</div>;
};

// =====================================================
// CONTENT CARD COMPONENT
// =====================================================
// Modern card with gradient background and backdrop blur
// =====================================================

interface ContentCardProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const ContentCard = React.forwardRef<HTMLDivElement, ContentCardProps>(
  ({ children, className = "", noPadding = false }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-xl transition-all duration-300 ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-gray-500/5"></div>
        <div className={`relative ${noPadding ? "" : "p-6"}`}>{children}</div>
      </div>
    );
  }
);

ContentCard.displayName = "ContentCard";

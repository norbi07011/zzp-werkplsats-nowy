// =====================================================
// DASHBOARD HERO BANNER - Ultra Premium Header
// =====================================================
// Universal header for all dashboard panels
// Glassmorphism + animated gradient + glow effects
// =====================================================

import { ReactNode } from "react";
import { Badge } from "../src/modules/invoices/components/ui/badge";

export interface DashboardHeroBannerProps {
  /** User's display name */
  userName: string;
  /** Role/panel type for subtitle */
  roleLabel: string;
  /** Optional badge text (e.g., "Premium Aktywny") */
  badge?: string;
  /** Badge variant */
  badgeVariant?: "default" | "success" | "warning" | "premium";
  /** Icon/emoji for the greeting */
  icon?: string;
  /** Optional right-side content (toggle, buttons, etc.) */
  rightContent?: ReactNode;
  /** Optional subtitle override */
  subtitle?: string;
}

export function DashboardHeroBanner({
  userName,
  roleLabel,
  badge,
  badgeVariant = "premium",
  icon = "👋",
  rightContent,
  subtitle,
}: DashboardHeroBannerProps) {
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
            <span className="heroBannerIcon">{icon}</span>
            <h1 className="heroBannerTitle">
              Witaj, <span className="heroBannerName">{userName}</span>
              {badge && (
                <span className={`heroBannerBadge ${getBadgeClasses()}`}>
                  ✨ {badge}
                </span>
              )}
            </h1>
          </div>

          {/* Subtitle */}
          <p className="heroBannerSubtitle">{subtitle || roleLabel}</p>
        </div>

        {/* Right content */}
        {rightContent && <div className="heroBannerRight">{rightContent}</div>}
      </div>

      {/* Bottom shine line */}
      <div className="heroBannerShine" />
    </div>
  );
}

export default DashboardHeroBanner;

/**
 * ================================================================
 * QUICK ACTIONS CARD - Premium glass-style action buttons
 * ================================================================
 * Unified component for "Szybkie działania" across all dashboards
 * Style inspired by zzp-werkplaats (5) SearchMarketView
 */

import React from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Building2,
  Sparkles,
  Calculator,
  CreditCard,
  Wrench,
  Search,
} from "lucide-react";

// HardHat doesn't exist in lucide-react, using Wrench as fallback
const HardHat = Wrench;

// Role type matching AuthContext
type DashboardRole =
  | "worker"
  | "employer"
  | "accountant"
  | "cleaning_company"
  | "admin";

interface QuickAction {
  id: string;
  label: string;
  shortLabel?: string; // For mobile
  icon: React.ElementType;
  href?: string;
  onClick?: () => void;
  color: "orange" | "blue" | "cyan" | "indigo" | "green" | "purple" | "gray";
}

// Color mapping for gradient backgrounds
const colorClasses = {
  orange: {
    bg: "bg-gradient-to-br from-orange-500 to-orange-600",
    hover: "hover:from-orange-600 hover:to-orange-700",
    shadow: "shadow-orange-500/25",
    iconBg: "bg-orange-400/20",
  },
  blue: {
    bg: "bg-gradient-to-br from-blue-500 to-blue-600",
    hover: "hover:from-blue-600 hover:to-blue-700",
    shadow: "shadow-blue-500/25",
    iconBg: "bg-blue-400/20",
  },
  cyan: {
    bg: "bg-gradient-to-br from-cyan-500 to-cyan-600",
    hover: "hover:from-cyan-600 hover:to-cyan-700",
    shadow: "shadow-cyan-500/25",
    iconBg: "bg-cyan-400/20",
  },
  indigo: {
    bg: "bg-gradient-to-br from-indigo-500 to-indigo-600",
    hover: "hover:from-indigo-600 hover:to-indigo-700",
    shadow: "shadow-indigo-500/25",
    iconBg: "bg-indigo-400/20",
  },
  green: {
    bg: "bg-gradient-to-br from-green-500 to-green-600",
    hover: "hover:from-green-600 hover:to-green-700",
    shadow: "shadow-green-500/25",
    iconBg: "bg-green-400/20",
  },
  purple: {
    bg: "bg-gradient-to-br from-purple-500 to-purple-600",
    hover: "hover:from-purple-600 hover:to-purple-700",
    shadow: "shadow-purple-500/25",
    iconBg: "bg-purple-400/20",
  },
  gray: {
    bg: "bg-white border-2 border-gray-200",
    hover: "hover:bg-gray-50 hover:border-gray-300",
    shadow: "shadow-gray-500/10",
    iconBg: "bg-gray-100",
  },
};

// Actions config per role
const getActionsForRole = (
  role: DashboardRole,
  handlers?: {
    onSubscription?: () => void;
    onQuickSearch?: () => void;
  }
): QuickAction[] => {
  const commonActions: QuickAction[] = [
    {
      id: "faktury",
      label: "Faktury & BTW",
      shortLabel: "Faktury",
      icon: FileText,
      href: "/faktury",
      color: "green",
    },
  ];

  switch (role) {
    case "worker":
      return [
        {
          id: "employers",
          label: "Szukaj pracodawców",
          shortLabel: "Pracodawcy",
          icon: Building2,
          href: "/employers",
          color: "orange",
        },
        {
          id: "cleaning",
          label: "Firmy sprzątające",
          shortLabel: "Firmy",
          icon: Sparkles,
          href: "/cleaning-companies",
          color: "blue",
        },
        {
          id: "accountants",
          label: "Szukaj księgowych",
          shortLabel: "Księgowi",
          icon: Calculator,
          href: "/accountants",
          color: "indigo",
        },
        ...commonActions,
        {
          id: "subscription",
          label: "Subskrypcja",
          icon: CreditCard,
          onClick: handlers?.onSubscription,
          color: "purple",
        },
      ];

    case "employer":
      return [
        {
          id: "workers",
          label: "Szukaj pracowników",
          shortLabel: "Pracownicy",
          icon: HardHat,
          onClick: handlers?.onQuickSearch,
          href: handlers?.onQuickSearch ? undefined : "/workers",
          color: "cyan",
        },
        {
          id: "cleaning",
          label: "Firmy sprzątające",
          shortLabel: "Firmy",
          icon: Sparkles,
          href: "/cleaning-companies",
          color: "blue",
        },
        {
          id: "accountants",
          label: "Księgowi",
          icon: Calculator,
          href: "/accountants",
          color: "indigo",
        },
        ...commonActions,
        {
          id: "subscription",
          label: "Subskrypcja",
          icon: CreditCard,
          onClick: handlers?.onSubscription,
          color: "purple",
        },
      ];

    case "accountant":
      return [
        {
          id: "employers",
          label: "Szukaj pracodawców",
          shortLabel: "Pracodawcy",
          icon: Building2,
          href: "/employers",
          color: "orange",
        },
        {
          id: "cleaning",
          label: "Firmy sprzątające",
          shortLabel: "Firmy",
          icon: Sparkles,
          href: "/cleaning-companies",
          color: "blue",
        },
        {
          id: "workers",
          label: "Szukaj pracowników",
          shortLabel: "Pracownicy",
          icon: HardHat,
          href: "/workers",
          color: "cyan",
        },
        ...commonActions,
        {
          id: "subscription",
          label: "Subskrypcja",
          icon: CreditCard,
          onClick: handlers?.onSubscription,
          color: "purple",
        },
      ];

    case "cleaning_company":
      return [
        {
          id: "employers",
          label: "Szukaj pracodawców",
          shortLabel: "Pracodawcy",
          icon: Building2,
          href: "/employers",
          color: "orange",
        },
        {
          id: "workers",
          label: "Szukaj pracowników",
          shortLabel: "Pracownicy",
          icon: HardHat,
          href: "/workers",
          color: "cyan",
        },
        {
          id: "accountants",
          label: "Szukaj księgowych",
          shortLabel: "Księgowi",
          icon: Calculator,
          href: "/accountants",
          color: "indigo",
        },
        ...commonActions,
        {
          id: "subscription",
          label: "Subskrypcja",
          icon: CreditCard,
          onClick: handlers?.onSubscription,
          color: "purple",
        },
      ];

    default:
      return commonActions;
  }
};

interface QuickActionsCardProps {
  role: DashboardRole;
  isMobile?: boolean;
  onSubscription?: () => void;
  onQuickSearch?: () => void;
  className?: string;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  role,
  isMobile = false,
  onSubscription,
  onQuickSearch,
  className = "",
}) => {
  const actions = getActionsForRole(role, {
    onSubscription,
    onQuickSearch,
  });

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 backdrop-blur-sm shadow-xl p-4 md:p-6 mb-6 ${className}`}
    >
      {/* Background decoration */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full opacity-50 blur-2xl" />
      <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full opacity-40 blur-xl" />

      {/* Header */}
      <div className="relative flex items-center gap-3 mb-4 md:mb-5">
        <div className="p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg shadow-orange-500/20">
          <Search className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2
            className={`font-bold text-slate-800 ${
              isMobile ? "text-lg" : "text-xl"
            }`}
          >
            ⚡ Szybkie działania
          </h2>
          <p className="text-xs text-slate-500 hidden md:block">
            Znajdź ekspertów i zarządzaj swoim kontem
          </p>
        </div>
      </div>

      {/* Actions Grid */}
      <div
        className={`relative grid gap-2.5 md:gap-3 ${
          isMobile ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"
        }`}
      >
        {actions.map((action) => {
          const colors = colorClasses[action.color];
          const Icon = action.icon;
          const isGray = action.color === "gray";

          const buttonContent = (
            <>
              <div
                className={`p-1.5 md:p-2 rounded-lg ${colors.iconBg} transition-transform group-hover:scale-110`}
              >
                <Icon
                  className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} ${
                    isGray ? "text-gray-600" : "text-white"
                  }`}
                />
              </div>
              <span
                className={`font-semibold ${isMobile ? "text-xs" : "text-sm"} ${
                  isGray ? "text-gray-700" : "text-white"
                }`}
              >
                {isMobile && action.shortLabel
                  ? action.shortLabel
                  : action.label}
              </span>
            </>
          );

          const buttonClasses = `
            group w-full flex items-center justify-center gap-2 md:gap-2.5 
            ${isMobile ? "px-3 py-2.5" : "px-4 py-3"} 
            rounded-xl font-medium transition-all duration-200 
            ${colors.bg} ${colors.hover} 
            shadow-lg ${colors.shadow}
            hover:-translate-y-0.5 hover:shadow-xl
            active:translate-y-0 active:shadow-md
          `;

          if (action.href) {
            return (
              <Link key={action.id} to={action.href} className={buttonClasses}>
                {buttonContent}
              </Link>
            );
          }

          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className={buttonClasses}
            >
              {buttonContent}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActionsCard;

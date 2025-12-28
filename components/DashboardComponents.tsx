import React from "react";

interface BreadcrumbItem {
  label: string;
  icon?: string;
  isActive?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className = "",
}) => {
  return (
    <nav className={`flex items-center gap-2 text-sm ${className}`}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="text-gray-400 dark:text-gray-500">/</span>
          )}
          <span
            className={`flex items-center gap-1.5 ${
              item.isActive
                ? "text-primary-600 dark:text-primary-400 font-semibold"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {item.icon && <span>{item.icon}</span>}
            {item.label}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
};

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  breadcrumbs?: BreadcrumbItem[];
  children?: React.ReactNode;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "premium";
  avatarUrl?: string;
  avatarFallback?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  icon,
  breadcrumbs,
  children,
  badge,
  badgeVariant = "premium",
  avatarUrl,
  avatarFallback,
}) => {
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
    <div className="mb-8 animate-fade-in">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-4" />}

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

          {children && <div className="heroBannerRight">{children}</div>}
        </div>

        {/* Bottom shine line */}
        <div className="heroBannerShine" />
      </div>
    </div>
  );
};

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface TabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}) => {
  return (
    <div
      className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-premium rounded-2xl shadow-premium border border-white/40 dark:border-slate-700/40 p-2 mb-8 animate-fade-in ${className}`}
    >
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                isActive
                  ? "bg-gradient-indigo text-white shadow-lg scale-105"
                  : "text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:scale-102"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

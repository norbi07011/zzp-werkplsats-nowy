/**
 * ================================================================
 * MOBILE BOTTOM NAVIGATION - Glass with Gradient Border ONLY
 * ================================================================
 *
 * Gradient is ONLY on the border ring (using mask-composite)
 * Center is pure transparent glass - no gradient inside
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Newspaper } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const getPanelRoute = () => {
    if (!user) return "/";
    switch (user.role) {
      case "admin":
        return "/admin";
      case "employer":
        return "/employer";
      case "worker":
        return "/worker";
      case "accountant":
        return "/accountant/dashboard";
      case "cleaning_company":
        return "/cleaning-company";
      case "regular_user":
        return "/regular-user";
      default:
        return "/";
    }
  };

  const panelRoute = getPanelRoute();

  const isActive = (path: string) => {
    if (path === panelRoute) {
      return (
        location.pathname === path || location.pathname.startsWith(path + "/")
      );
    }
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const isPanelActive = isActive(panelRoute);
  const isFeedActive = isActive("/feed");

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-3">
      <div className="flex justify-center px-6">
        {/* Outer glow */}
        <div
          style={{
            position: "absolute",
            inset: "-10px",
            borderRadius: "999px",
            background:
              "radial-gradient(circle at 20% 50%, rgba(34,211,238,0.2), transparent 60%), radial-gradient(circle at 80% 50%, rgba(168,85,247,0.18), transparent 60%)",
            filter: "blur(14px)",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        {/* Main glass container */}
        <div
          style={{
            position: "relative",
            borderRadius: "999px",
            isolation: "isolate",
            overflow: "hidden",
          }}
        >
          {/* Gradient border ONLY (masked to show ring) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              padding: "2px",
              borderRadius: "inherit",
              background:
                "linear-gradient(90deg, rgba(103, 232, 249, 0.95), rgba(59, 130, 246, 0.95), rgba(167, 139, 250, 0.95), rgba(249, 168, 212, 0.9), rgba(110, 231, 183, 0.85))",
              backgroundSize: "400% 100%",
              animation: "borderGradientFlow 8s linear infinite",
              WebkitMask:
                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "exclude",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />

          {/* Glass layer inside (no gradient) */}
          <div
            style={{
              position: "absolute",
              inset: "2px",
              borderRadius: "inherit",
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(18px) saturate(130%)",
              WebkitBackdropFilter: "blur(18px) saturate(130%)",
              zIndex: 1,
              pointerEvents: "none",
            }}
          />

          {/* Content layer */}
          <div
            style={{
              position: "relative",
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              height: "56px",
              paddingLeft: "40px",
              paddingRight: "40px",
              gap: "64px",
            }}
          >
            {/* Panel Button */}
            <Link
              to={panelRoute}
              className="flex flex-col items-center justify-center transition-all duration-300"
            >
              <Home
                className={`w-5 h-5 transition-all duration-300 ${
                  isPanelActive ? "text-slate-700" : "text-slate-500"
                }`}
                strokeWidth={isPanelActive ? 2.2 : 1.8}
              />
              <span
                className={`text-[10px] font-medium mt-0.5 transition-all duration-300 ${
                  isPanelActive ? "text-slate-700" : "text-slate-500"
                }`}
              >
                Panel
              </span>
            </Link>

            {/* Divider */}
            <div
              style={{
                width: "1px",
                height: "24px",
                background: "rgba(255,255,255,0.2)",
                borderRadius: "999px",
              }}
            />

            {/* Feed Button */}
            <Link
              to="/feed"
              className="flex flex-col items-center justify-center transition-all duration-300"
            >
              <Newspaper
                className={`w-5 h-5 transition-all duration-300 ${
                  isFeedActive ? "text-slate-700" : "text-slate-500"
                }`}
                strokeWidth={isFeedActive ? 2.2 : 1.8}
              />
              <span
                className={`text-[10px] font-medium mt-0.5 transition-all duration-300 ${
                  isFeedActive ? "text-slate-700" : "text-slate-500"
                }`}
              >
                Kanał
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes borderGradientFlow {
          0% { background-position: 0% 50%; }
          100% { background-position: 400% 50%; }
        }
      `}</style>
    </nav>
  );
};

export default MobileBottomNav;

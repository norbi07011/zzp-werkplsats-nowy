/**
 * GlowButton - Animated Gradient Button Component
 * Beautiful glowing border animation on hover
 */
import React from "react";

interface GlowButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "success" | "danger" | "purple";
  size?: "sm" | "md" | "lg";
  className?: string;
  fullWidth?: boolean;
}

const variantColors = {
  primary: {
    from: "rgb(79, 255, 93)",
    via: "rgb(57, 123, 255)",
    bg: "#111827",
    text: "text-white",
  },
  success: {
    from: "rgb(34, 231, 16)",
    via: "rgb(49, 255, 245)",
    bg: "#064e3b",
    text: "text-white",
  },
  danger: {
    from: "rgb(255, 79, 93)",
    via: "rgb(255, 123, 57)",
    bg: "#7f1d1d",
    text: "text-white",
  },
  purple: {
    from: "rgb(168, 85, 247)",
    via: "rgb(236, 72, 153)",
    bg: "#1e1b4b",
    text: "text-white",
  },
};

const sizeClasses = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export const GlowButton: React.FC<GlowButtonProps> = ({
  children,
  onClick,
  disabled = false,
  type = "button",
  variant = "primary",
  size = "md",
  className = "",
  fullWidth = false,
}) => {
  const colors = variantColors[variant];
  const sizeClass = sizeClasses[size];

  return (
    <div className={`relative inline-block ${fullWidth ? "w-full" : ""}`}>
      {/* SVG Filters for glow effect */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter
            id={`glow-${variant}`}
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Animated gradient border */}
      <div
        className={`
          absolute inset-0 rounded-xl opacity-0 blur-md transition-opacity duration-300
          group-hover:opacity-75
        `}
        style={{
          background: `linear-gradient(90deg, ${colors.from}, ${colors.via}, ${colors.from})`,
          backgroundSize: "200% 100%",
          animation: "shimmer 2s linear infinite",
        }}
      />

      {/* Main button */}
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`
          group relative overflow-hidden rounded-xl font-bold
          ${sizeClass} ${colors.text} ${fullWidth ? "w-full" : ""}
          transition-all duration-300 ease-out
          hover:scale-[1.02] hover:shadow-2xl
          active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          ${className}
        `}
        style={{ background: colors.bg }}
      >
        {/* Animated border glow */}
        <span
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            padding: "2px",
            background: `linear-gradient(90deg, ${colors.from} 0%, ${colors.via} 50%, ${colors.from} 100%)`,
            backgroundSize: "200% 100%",
            animation: "shimmer 2s linear infinite",
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />

        {/* Glow effect on hover */}
        <span
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-500"
          style={{
            background: `linear-gradient(90deg, ${colors.from}, ${colors.via})`,
          }}
        />

        {/* Button content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </button>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default GlowButton;

import React, { useRef, useState, useCallback } from "react";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "cyan" | "emerald" | "purple" | "orange" | "pink";
  size?: "sm" | "md" | "lg";
}

const variantGradients = {
  default: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
  cyan: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)",
  emerald: "linear-gradient(135deg, #10b981 0%, #22c55e 50%, #84cc16 100%)",
  purple: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #d946ef 100%)",
  orange: "linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fbbf24 100%)",
  pink: "linear-gradient(135deg, #ec4899 0%, #f472b6 50%, #f9a8d4 100%)",
};

const variantColors = {
  default: { from: "#667eea", via: "#764ba2", to: "#f093fb" },
  cyan: { from: "#06b6d4", via: "#3b82f6", to: "#8b5cf6" },
  emerald: { from: "#10b981", via: "#22c55e", to: "#84cc16" },
  purple: { from: "#8b5cf6", via: "#a855f7", to: "#d946ef" },
  orange: { from: "#f97316", via: "#fb923c", to: "#fbbf24" },
  pink: { from: "#ec4899", via: "#f472b6", to: "#f9a8d4" },
};

const sizeClasses = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className = "",
  variant = "default",
  size = "md",
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  }, []);

  const gradient = variantGradients[variant];
  const colors = variantColors[variant];

  return (
    <div
      ref={cardRef}
      className={`glow-card relative group cursor-pointer ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={
        {
          "--mouse-x": `${mousePosition.x}%`,
          "--mouse-y": `${mousePosition.y}%`,
          "--glow-gradient": gradient,
        } as React.CSSProperties
      }
    >
      {/* Outer glow - always visible, stronger on hover */}
      <div
        className="absolute -inset-1 rounded-2xl blur-md transition-all duration-500"
        style={{
          background: gradient,
          opacity: isHovered ? 0.9 : 0.4,
        }}
      />

      {/* Animated gradient border - always visible with pulse */}
      <div
        className="absolute inset-0 rounded-2xl transition-all duration-300"
        style={{
          background: gradient,
          opacity: isHovered ? 1 : 0.6,
        }}
      />

      {/* Rotating conic gradient on hover - follows mouse */}
      {isHovered && (
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{ opacity: 1 }}
        >
          <div
            className="absolute -inset-[100%]"
            style={{
              background: `conic-gradient(from 0deg at 50% 50%, ${colors.from}, ${colors.via}, ${colors.to}, ${colors.from})`,
              animation: "spin 2s linear infinite",
            }}
          />
        </div>
      )}

      {/* Mouse-following spotlight effect */}
      <div
        className="absolute inset-0 rounded-2xl transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(400px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,255,255,0.25) 0%, transparent 40%)`,
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* Inner card with glassmorphism */}
      <div
        className={`relative z-10 rounded-xl ${sizeClasses[size]} h-full
          bg-gradient-to-br from-gray-900/98 via-gray-800/95 to-gray-900/98
          backdrop-blur-xl border border-white/10
          transition-all duration-300
          group-hover:border-white/30 group-hover:shadow-2xl`}
        style={{
          margin: "3px",
        }}
      >
        {children}
      </div>

      {/* Keyframes for animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GlowCard;

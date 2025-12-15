import React from "react";
import Plus from "lucide-react/dist/esm/icons/plus";

interface MobileFABProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
  variant?: "primary" | "success" | "warning" | "danger";
}

export function MobileFAB({
  onClick,
  icon = <Plus size={24} />,
  label,
  variant = "primary",
}: MobileFABProps) {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30",
    success: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30",
    warning: "bg-orange-600 hover:bg-orange-700 shadow-orange-500/30",
    danger: "bg-red-600 hover:bg-red-700 shadow-red-500/30",
  };

  return (
    <button
      onClick={onClick}
      className={`fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full text-white shadow-xl transition-all hover:scale-110 active:scale-95 flex items-center justify-center ${variants[variant]}`}
      style={{
        bottom: "calc(6rem + env(safe-area-inset-bottom))",
      }}
      aria-label={label || "Dodaj"}
    >
      <span className="relative z-10">{icon}</span>
      {/* Ripple effect */}
      <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-current" />
    </button>
  );
}

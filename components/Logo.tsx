import React from "react";

interface LogoProps {
  className?: string;
  variant?: "full" | "icon" | "text";
  size?: "sm" | "md" | "lg";
}

export const Logo: React.FC<LogoProps> = ({
  className = "",
  variant = "full",
  size = "md",
}) => {
  const sizeClasses = {
    sm: "h-8 w-auto",
    md: "h-10 w-auto",
    lg: "h-16 w-auto",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  if (variant === "icon") {
    return (
      <img
        src="/Public/LOGOEIFEO.jpg"
        alt="ZZP Werkplaats"
        className={`${iconSizes[size]} rounded-xl object-contain shadow-lg ${className}`}
      />
    );
  }

  if (variant === "text") {
    return (
      <div className={`font-heading font-bold ${textSizes[size]} ${className}`}>
        ZZP WERKPLAATS
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/Public/LOGOEIFEO.jpg"
        alt="ZZP Werkplaats Logo"
        className={`${sizeClasses[size]} object-contain`}
      />
      <div className="flex flex-col">
        <span
          className={`font-heading font-bold ${textSizes[size]} text-gray-900 leading-tight`}
        >
          ZZP WERKPLAATS
        </span>
        <span className="text-xs text-gray-600 font-medium">
          Gecertifireiate Vakmensen
        </span>
      </div>
    </div>
  );
};

import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = "",
  size = "md",
  showText = true,
}) => {
  const sizeClasses = {
    sm: "h-8 w-auto",
    md: "h-12 w-auto",
    lg: "h-16 w-auto",
    xl: "h-24 w-auto",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Image */}
      <img
        src="/Public/LOGOEIFEO.jpg"
        alt="ZZP Werkplaats Logo"
        className={`${sizeClasses[size]} object-contain`}
      />

      {showText && (
        <div className="flex flex-col">
          <span
            className={`font-bold ${textSizeClasses[size]} text-gray-900 leading-tight`}
          >
            ZZP WERKPLAATS
          </span>
          <span className="text-xs text-gray-600 font-medium">
            Gecertifireiate Vakmensen voor Uw Bedrijf
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;

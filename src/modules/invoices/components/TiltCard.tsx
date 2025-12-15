import React, { useRef, useState } from "react";

/**
 * TiltCard - 3D Tilt effect on mouse hover
 * Light version with reduced sensitivity for smooth UX
 */
interface TiltCardProps {
  children?: React.ReactNode;
  className?: string;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = "",
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / 25; // Reduced sensitivity
    const y = (e.clientY - top - height / 2) / 25;
    setRotate({ x: -y, y: x });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        transition: "transform 0.1s ease-out",
      }}
      className={`relative transition-all duration-300 h-full ${className}`}
    >
      {children}
    </div>
  );
};

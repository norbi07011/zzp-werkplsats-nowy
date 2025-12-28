import { useEffect, useState, useCallback } from "react";

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  velocityX: number;
  velocityY: number;
  delay: number;
}

interface SuccessCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  icon?: "🎉" | "✅" | "🏆" | "⭐" | "💰" | "📄" | "👤";
  confettiCount?: number;
  autoCloseDelay?: number;
}

const CONFETTI_COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#FED766", // Yellow
  "#F78FB3", // Pink
  "#6C5CE7", // Purple
  "#00D2D3", // Cyan
  "#FF9F43", // Orange
  "#10B981", // Green
  "#8B5CF6", // Violet
];

const generateConfetti = (count: number): ConfettiPiece[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.5,
    velocityX: (Math.random() - 0.5) * 3,
    velocityY: 2 + Math.random() * 3,
    delay: Math.random() * 500,
  }));
};

export const SuccessCelebration: React.FC<SuccessCelebrationProps> = ({
  isOpen,
  onClose,
  title = "Sukces!",
  message = "Operacja zakończona pomyślnie",
  icon = "🎉",
  confettiCount = 50,
  autoCloseDelay = 4000,
}) => {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setConfetti(generateConfetti(confettiCount));
      setIsVisible(true);
      setIsExiting(false);

      // Auto close after delay
      const timer = setTimeout(handleClose, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, confettiCount, autoCloseDelay, handleClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
      onClick={handleClose}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map((piece) => (
          <div
            key={piece.id}
            className="absolute w-3 h-3 animate-confetti-fall"
            style={{
              left: `${piece.x}%`,
              top: `${piece.y}%`,
              backgroundColor: piece.color,
              transform: `rotate(${piece.rotation}deg) scale(${piece.scale})`,
              animationDelay: `${piece.delay}ms`,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            }}
          />
        ))}
      </div>

      {/* Success Card */}
      <div
        className={`relative bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-4 transform transition-all duration-500 ${
          isExiting
            ? "scale-90 opacity-0 translate-y-8"
            : "scale-100 opacity-100 translate-y-0 animate-bounce-in"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-emerald-400/20 to-teal-400/20 rounded-3xl blur-xl" />

        {/* Content */}
        <div className="relative text-center">
          {/* Icon with pulse animation */}
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-green-400/30 rounded-full animate-ping" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 animate-bounce-slow">
              <span className="text-5xl">{icon}</span>
            </div>
          </div>

          {/* Title with gradient */}
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent mb-3">
            {title}
          </h2>

          {/* Message */}
          <p className="text-gray-600 text-lg mb-6">{message}</p>

          {/* Stars decoration */}
          <div className="flex justify-center gap-2 mb-6">
            {["⭐", "✨", "🌟", "✨", "⭐"].map((star, i) => (
              <span
                key={i}
                className="text-2xl animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {star}
              </span>
            ))}
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transform hover:scale-[1.02]"
          >
            Świetnie! 🚀
          </button>
        </div>

        {/* Sparkle decorations */}
        <div className="absolute -top-2 -left-2 text-2xl animate-spin-slow">
          ✨
        </div>
        <div className="absolute -top-2 -right-2 text-2xl animate-spin-slow animation-delay-500">
          💫
        </div>
        <div className="absolute -bottom-2 -left-2 text-2xl animate-bounce-slow animation-delay-300">
          🌟
        </div>
        <div className="absolute -bottom-2 -right-2 text-2xl animate-bounce-slow animation-delay-700">
          ⭐
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        @keyframes bounce-in {
          0% {
            transform: scale(0.3) translateY(100px);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) translateY(-20px);
          }
          70% {
            transform: scale(0.9) translateY(10px);
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-confetti-fall {
          animation: confetti-fall 3s linear forwards;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        
        .animation-delay-300 {
          animation-delay: 300ms;
        }
        
        .animation-delay-500 {
          animation-delay: 500ms;
        }
        
        .animation-delay-700 {
          animation-delay: 700ms;
        }
      `}</style>
    </div>
  );
};

export default SuccessCelebration;

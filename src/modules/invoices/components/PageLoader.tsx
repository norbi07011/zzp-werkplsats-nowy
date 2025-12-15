import React from "react";

/**
 * PageLoader - Scanning text animation with colorful gradients
 * Displays "ZZP Werkplaats" text with individual letter animations
 */
export const PageLoader: React.FC = () => {
  const text = "ZZP Werkplaats";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1e1e1e",
        zIndex: 9999,
      }}
    >
      <style>{`
        @keyframes transform-animation {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes opacity-animation {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes loader-letter-anim {
          0%, 100% {
            filter: blur(2px);
            opacity: 0.3;
            transform: scale(0.95) translateY(0);
          }
          50% {
            filter: blur(0);
            opacity: 1;
            transform: scale(1.05) translateY(-10px);
          }
        }

        .loader-letter {
          display: inline-block;
          font-size: 4rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          animation: loader-letter-anim 2s ease-in-out infinite;
          background: radial-gradient(circle at center, currentColor 0%, transparent 70%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .loader-letter:nth-child(1) { 
          color: #fbbf24; 
          animation-delay: 0s; 
        }
        .loader-letter:nth-child(2) { 
          color: #ef4444; 
          animation-delay: 0.1s; 
        }
        .loader-letter:nth-child(3) { 
          color: #06b6d4; 
          animation-delay: 0.2s; 
        }
        .loader-letter:nth-child(4) { 
          color: #10b981; 
          animation-delay: 0.3s; 
        }
        .loader-letter:nth-child(5) { 
          color: #3b82f6; 
          animation-delay: 0.4s; 
        }
        .loader-letter:nth-child(6) { 
          color: #8b5cf6; 
          animation-delay: 0.5s; 
        }
        .loader-letter:nth-child(7) { 
          color: #ec4899; 
          animation-delay: 0.6s; 
        }
        .loader-letter:nth-child(8) { 
          color: #f59e0b; 
          animation-delay: 0.7s; 
        }
        .loader-letter:nth-child(9) { 
          color: #14b8a6; 
          animation-delay: 0.8s; 
        }
        .loader-letter:nth-child(10) { 
          color: #06b6d4; 
          animation-delay: 0.9s; 
        }
        .loader-letter:nth-child(11) { 
          color: #f43f5e; 
          animation-delay: 1s; 
        }
        .loader-letter:nth-child(12) { 
          color: #10b981; 
          animation-delay: 1.1s; 
        }
        .loader-letter:nth-child(13) { 
          color: #6366f1; 
          animation-delay: 1.2s; 
        }
        .loader-letter:nth-child(14) { 
          color: #fbbf24; 
          animation-delay: 1.3s; 
        }
      `}</style>

      <div style={{ textAlign: "center" }}>
        {text.split("").map((letter, index) => (
          <span key={index} className="loader-letter">
            {letter === " " ? "\u00A0" : letter}
          </span>
        ))}
      </div>
    </div>
  );
};

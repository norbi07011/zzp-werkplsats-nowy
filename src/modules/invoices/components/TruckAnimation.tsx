import React from "react";

/**
 * TruckAnimation - Complex CSS-only animated truck
 * Features: spinning wheels, lights with glows, shadow effects
 */
export const TruckAnimation: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
      }}
    >
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .truck-wrapper {
          --width: 200;
          position: relative;
          width: calc(var(--width) * 1px);
          filter: drop-shadow(0 10px 10px rgba(0,0,0,0.3));
        }

        .truck {
          position: relative;
          width: 100%;
        }

        .truck__shadow {
          position: absolute;
          bottom: -20px;
          left: 10%;
          width: 80%;
          height: 10px;
          background: radial-gradient(ellipse, rgba(0,0,0,0.3), transparent);
          filter: blur(10px);
        }

        .truck__body {
          position: relative;
          width: 100%;
          height: 60px;
          background: linear-gradient(to bottom, #0ea5e9, #0284c7);
          border-radius: 10px 10px 5px 5px;
          box-shadow: inset 0 -5px 10px rgba(0,0,0,0.2);
        }

        .truck__cabin {
          position: absolute;
          right: 10px;
          top: -25px;
          width: 50px;
          height: 40px;
          background: linear-gradient(to bottom, #0ea5e9, #0284c7);
          border-radius: 8px 8px 0 0;
          box-shadow: inset 0 -3px 5px rgba(0,0,0,0.2);
        }

        .truck__window {
          position: absolute;
          top: 5px;
          left: 8px;
          width: 35px;
          height: 20px;
          background: linear-gradient(135deg, #93c5fd, #60a5fa);
          border-radius: 4px;
          border: 2px solid #0284c7;
        }

        .truck__headlight {
          position: absolute;
          right: 5px;
          top: 50%;
          transform: translateY(-50%);
          width: 8px;
          height: 8px;
          background: #fef08a;
          border-radius: 50%;
          box-shadow: 0 0 10px #fef08a, 0 0 20px rgba(254, 240, 138, 0.5);
        }

        .truck__taillight {
          position: absolute;
          left: 5px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          background: #ef4444;
          border-radius: 50%;
          box-shadow: 0 0 8px #ef4444, 0 0 16px rgba(239, 68, 68, 0.5);
        }

        .truck__foglight {
          position: absolute;
          right: 15px;
          bottom: 5px;
          width: 5px;
          height: 5px;
          background: #fbbf24;
          border-radius: 50%;
          box-shadow: 0 0 5px #fbbf24;
        }

        .truck__indicator {
          position: absolute;
          right: 20px;
          top: 10px;
          width: 4px;
          height: 4px;
          background: #fb923c;
          border-radius: 50%;
        }

        .truck__wheels {
          position: absolute;
          bottom: -15px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          padding: 0 20px;
        }

        .truck__wheel-arch {
          position: relative;
          width: 40px;
          height: 25px;
        }

        .truck__wheel-arch-trim {
          position: absolute;
          background: #0284c7;
        }

        .truck__wheel-arch-trim--top {
          top: 0;
          left: 0;
          right: 0;
          height: 10px;
          border-radius: 20px 20px 0 0;
        }

        .truck__wheel-arch-trim--left {
          top: 0;
          left: 0;
          width: 8px;
          height: 100%;
        }

        .truck__wheel-arch-trim--right {
          top: 0;
          right: 0;
          width: 8px;
          height: 100%;
        }

        .truck-wheel {
          position: absolute;
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%);
          width: 30px;
          height: 30px;
          background: #242424;
          border-radius: 100%;
          border: 3px solid #171717;
        }

        .truck-wheel__rim {
          position: absolute;
          inset: 3px;
          background: radial-gradient(circle, #404040, #1a1a1a);
          border-radius: 100%;
          animation: spin 0.35s linear infinite;
        }

        .truck-wheel__spoke {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 2px;
          height: 100%;
          background: linear-gradient(to bottom, #525252, #1a1a1a);
          transform-origin: center;
          transform: translate(-50%, -50%) rotate(calc(var(--index) * 51.43deg));
        }
      `}</style>

      <div className="truck-wrapper">
        <div className="truck">
          <div className="truck__shadow" />

          <div className="truck__cabin">
            <div className="truck__window" />
          </div>

          <div className="truck__body">
            <div className="truck__headlight" />
            <div className="truck__taillight" />
            <div className="truck__indicator" />
            <div className="truck__foglight" />
          </div>

          <div className="truck__wheels">
            {/* Front Wheel */}
            <div className="truck__wheel-arch">
              <div className="truck__wheel-arch-trim truck__wheel-arch-trim--top" />
              <div className="truck__wheel-arch-trim truck__wheel-arch-trim--left" />
              <div className="truck__wheel-arch-trim truck__wheel-arch-trim--right" />
              <div className="truck-wheel">
                <div className="truck-wheel__rim">
                  {[...Array(7)].map((_, i) => (
                    <div
                      key={i}
                      style={{ "--index": i } as React.CSSProperties}
                      className="truck-wheel__spoke"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Rear Wheel */}
            <div className="truck__wheel-arch">
              <div className="truck__wheel-arch-trim truck__wheel-arch-trim--top" />
              <div className="truck__wheel-arch-trim truck__wheel-arch-trim--left" />
              <div className="truck__wheel-arch-trim truck__wheel-arch-trim--right" />
              <div className="truck-wheel">
                <div className="truck-wheel__rim">
                  {[...Array(7)].map((_, i) => (
                    <div
                      key={i}
                      style={{ "--index": i } as React.CSSProperties}
                      className="truck-wheel__spoke"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

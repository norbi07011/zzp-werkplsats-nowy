import React from "react";

/**
 * VehicleAnimations - Animated vehicle components for different types
 * Types: Car/Truck, Motorcycle, Bike, Electric Bike
 */

// =============================================================================
// CAR ANIMATION (Based on existing TruckAnimation)
// =============================================================================
export const CarAnimation: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-full">
      <style>{`
        @keyframes car-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes car-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .car-wrapper {
          position: relative;
          width: 180px;
          filter: drop-shadow(0 10px 10px rgba(0,0,0,0.25));
          animation: car-bounce 0.5s ease-in-out infinite;
        }
        .car__body {
          position: relative;
          width: 100%;
          height: 40px;
          background: linear-gradient(to bottom, #3b82f6, #2563eb);
          border-radius: 8px 8px 5px 5px;
          box-shadow: inset 0 -5px 10px rgba(0,0,0,0.2);
        }
        .car__roof {
          position: absolute;
          left: 30%;
          right: 15%;
          top: -25px;
          height: 30px;
          background: linear-gradient(to bottom, #3b82f6, #2563eb);
          border-radius: 10px 10px 0 0;
          box-shadow: inset 0 -3px 5px rgba(0,0,0,0.2);
        }
        .car__window-front {
          position: absolute;
          top: 4px;
          left: 5px;
          width: 30%;
          height: 18px;
          background: linear-gradient(135deg, #93c5fd, #60a5fa);
          border-radius: 4px 8px 4px 4px;
          border: 2px solid #1d4ed8;
        }
        .car__window-back {
          position: absolute;
          top: 4px;
          right: 5px;
          width: 25%;
          height: 18px;
          background: linear-gradient(135deg, #93c5fd, #60a5fa);
          border-radius: 8px 4px 4px 4px;
          border: 2px solid #1d4ed8;
        }
        .car__headlight {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 10px;
          height: 8px;
          background: #fef08a;
          border-radius: 3px;
          box-shadow: 0 0 15px #fef08a, 0 0 30px rgba(254, 240, 138, 0.6);
        }
        .car__taillight {
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 8px;
          height: 6px;
          background: #ef4444;
          border-radius: 2px;
          box-shadow: 0 0 10px #ef4444, 0 0 20px rgba(239, 68, 68, 0.5);
        }
        .car__wheels {
          position: absolute;
          bottom: -12px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          padding: 0 25px;
        }
        .car-wheel {
          width: 28px;
          height: 28px;
          background: #1a1a1a;
          border-radius: 100%;
          border: 3px solid #0f0f0f;
          position: relative;
        }
        .car-wheel__rim {
          position: absolute;
          inset: 3px;
          background: radial-gradient(circle, #525252, #1a1a1a);
          border-radius: 100%;
          animation: car-spin 0.3s linear infinite;
        }
        .car-wheel__spoke {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 2px;
          height: 100%;
          background: linear-gradient(to bottom, #737373, #1a1a1a);
          transform-origin: center;
          transform: translate(-50%, -50%) rotate(calc(var(--index) * 72deg));
        }
        .car__shadow {
          position: absolute;
          bottom: -18px;
          left: 5%;
          width: 90%;
          height: 8px;
          background: radial-gradient(ellipse, rgba(0,0,0,0.3), transparent);
          filter: blur(8px);
        }
      `}</style>

      <div className="car-wrapper">
        <div className="car__shadow" />
        <div className="car__roof">
          <div className="car__window-front" />
          <div className="car__window-back" />
        </div>
        <div className="car__body">
          <div className="car__headlight" />
          <div className="car__taillight" />
        </div>
        <div className="car__wheels">
          <div className="car-wheel">
            <div className="car-wheel__rim">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  style={{ "--index": i } as React.CSSProperties}
                  className="car-wheel__spoke"
                />
              ))}
            </div>
          </div>
          <div className="car-wheel">
            <div className="car-wheel__rim">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  style={{ "--index": i } as React.CSSProperties}
                  className="car-wheel__spoke"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MOTORCYCLE ANIMATION
// =============================================================================
export const MotorcycleAnimation: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-full">
      <style>{`
        @keyframes moto-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes moto-bounce {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-3px) rotate(2deg); }
        }
        @keyframes moto-exhaust {
          0%, 100% { opacity: 0.3; transform: translateX(-5px) scale(1); }
          50% { opacity: 0.6; transform: translateX(-15px) scale(1.2); }
        }
        .moto-wrapper {
          position: relative;
          width: 160px;
          height: 80px;
          filter: drop-shadow(0 8px 8px rgba(0,0,0,0.25));
          animation: moto-bounce 0.4s ease-in-out infinite;
        }
        .moto__frame {
          position: absolute;
          bottom: 25px;
          left: 35px;
          width: 90px;
          height: 25px;
          background: linear-gradient(to bottom, #f97316, #ea580c);
          border-radius: 5px 15px 5px 5px;
          box-shadow: inset 0 -3px 6px rgba(0,0,0,0.3);
        }
        .moto__tank {
          position: absolute;
          bottom: 35px;
          left: 50px;
          width: 40px;
          height: 22px;
          background: linear-gradient(135deg, #fb923c, #ea580c);
          border-radius: 10px 15px 5px 10px;
          box-shadow: inset 0 -3px 8px rgba(0,0,0,0.2);
        }
        .moto__tank-stripe {
          position: absolute;
          top: 5px;
          left: 5px;
          right: 5px;
          height: 3px;
          background: #fff;
          opacity: 0.6;
          border-radius: 2px;
        }
        .moto__seat {
          position: absolute;
          bottom: 38px;
          left: 25px;
          width: 35px;
          height: 12px;
          background: #1a1a1a;
          border-radius: 8px 5px 5px 5px;
        }
        .moto__handlebar {
          position: absolute;
          bottom: 48px;
          right: 25px;
          width: 8px;
          height: 20px;
          background: #525252;
          border-radius: 4px;
          transform: rotate(15deg);
        }
        .moto__handlebar-grip {
          position: absolute;
          top: -5px;
          left: 50%;
          transform: translateX(-50%);
          width: 12px;
          height: 8px;
          background: #1a1a1a;
          border-radius: 3px;
        }
        .moto__headlight {
          position: absolute;
          bottom: 35px;
          right: 15px;
          width: 12px;
          height: 12px;
          background: #fef08a;
          border-radius: 50%;
          box-shadow: 0 0 15px #fef08a, 0 0 30px rgba(254, 240, 138, 0.7);
        }
        .moto__taillight {
          position: absolute;
          bottom: 28px;
          left: 20px;
          width: 6px;
          height: 4px;
          background: #ef4444;
          border-radius: 2px;
          box-shadow: 0 0 10px #ef4444;
        }
        .moto__exhaust {
          position: absolute;
          bottom: 20px;
          left: 5px;
          width: 25px;
          height: 6px;
          background: #525252;
          border-radius: 3px;
        }
        .moto__exhaust-smoke {
          position: absolute;
          bottom: 22px;
          left: -5px;
          width: 8px;
          height: 8px;
          background: rgba(200,200,200,0.4);
          border-radius: 50%;
          animation: moto-exhaust 0.3s ease-out infinite;
        }
        .moto__fork-front {
          position: absolute;
          bottom: 8px;
          right: 18px;
          width: 4px;
          height: 35px;
          background: #737373;
          border-radius: 2px;
          transform: rotate(20deg);
        }
        .moto__fork-back {
          position: absolute;
          bottom: 8px;
          left: 28px;
          width: 4px;
          height: 25px;
          background: #737373;
          border-radius: 2px;
          transform: rotate(-15deg);
        }
        .moto__wheel-front {
          position: absolute;
          bottom: 0;
          right: 8px;
          width: 36px;
          height: 36px;
          background: #1a1a1a;
          border-radius: 100%;
          border: 4px solid #0f0f0f;
        }
        .moto__wheel-back {
          position: absolute;
          bottom: 0;
          left: 15px;
          width: 36px;
          height: 36px;
          background: #1a1a1a;
          border-radius: 100%;
          border: 4px solid #0f0f0f;
        }
        .moto-wheel__rim {
          position: absolute;
          inset: 4px;
          background: radial-gradient(circle, #404040, #1a1a1a);
          border-radius: 100%;
          animation: moto-spin 0.25s linear infinite;
        }
        .moto-wheel__spoke {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 2px;
          height: 100%;
          background: linear-gradient(to bottom, #737373, #1a1a1a);
          transform-origin: center;
          transform: translate(-50%, -50%) rotate(calc(var(--index) * 60deg));
        }
        .moto__shadow {
          position: absolute;
          bottom: -5px;
          left: 10%;
          width: 80%;
          height: 6px;
          background: radial-gradient(ellipse, rgba(0,0,0,0.3), transparent);
          filter: blur(5px);
        }
      `}</style>

      <div className="moto-wrapper">
        <div className="moto__shadow" />
        <div className="moto__exhaust">
          <div className="moto__exhaust-smoke" />
        </div>
        <div className="moto__fork-back" />
        <div className="moto__fork-front" />
        <div className="moto__frame" />
        <div className="moto__tank">
          <div className="moto__tank-stripe" />
        </div>
        <div className="moto__seat" />
        <div className="moto__handlebar">
          <div className="moto__handlebar-grip" />
        </div>
        <div className="moto__headlight" />
        <div className="moto__taillight" />

        {/* Front Wheel */}
        <div className="moto__wheel-front">
          <div className="moto-wheel__rim">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                style={{ "--index": i } as React.CSSProperties}
                className="moto-wheel__spoke"
              />
            ))}
          </div>
        </div>

        {/* Back Wheel */}
        <div className="moto__wheel-back">
          <div className="moto-wheel__rim">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                style={{ "--index": i } as React.CSSProperties}
                className="moto-wheel__spoke"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// BICYCLE ANIMATION
// =============================================================================
export const BikeAnimation: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-full">
      <style>{`
        @keyframes bike-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bike-pedal {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bike-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .bike-wrapper {
          position: relative;
          width: 140px;
          height: 80px;
          filter: drop-shadow(0 6px 6px rgba(0,0,0,0.2));
          animation: bike-bounce 0.35s ease-in-out infinite;
        }
        .bike__frame-main {
          position: absolute;
          bottom: 25px;
          left: 35px;
          width: 70px;
          height: 4px;
          background: linear-gradient(to right, #22c55e, #16a34a);
          border-radius: 2px;
          transform: rotate(-8deg);
        }
        .bike__frame-seat {
          position: absolute;
          bottom: 28px;
          left: 30px;
          width: 4px;
          height: 30px;
          background: #16a34a;
          border-radius: 2px;
        }
        .bike__frame-head {
          position: absolute;
          bottom: 22px;
          right: 25px;
          width: 4px;
          height: 38px;
          background: #16a34a;
          border-radius: 2px;
          transform: rotate(15deg);
        }
        .bike__frame-down {
          position: absolute;
          bottom: 18px;
          left: 40px;
          width: 50px;
          height: 4px;
          background: #16a34a;
          border-radius: 2px;
          transform: rotate(35deg);
        }
        .bike__frame-chain {
          position: absolute;
          bottom: 18px;
          left: 28px;
          width: 45px;
          height: 4px;
          background: #16a34a;
          border-radius: 2px;
          transform: rotate(-20deg);
        }
        .bike__seat {
          position: absolute;
          bottom: 55px;
          left: 22px;
          width: 20px;
          height: 6px;
          background: #1a1a1a;
          border-radius: 5px 10px 3px 3px;
        }
        .bike__handlebar {
          position: absolute;
          bottom: 55px;
          right: 15px;
          width: 25px;
          height: 4px;
          background: #1a1a1a;
          border-radius: 2px;
        }
        .bike__handlebar-stem {
          position: absolute;
          bottom: 52px;
          right: 25px;
          width: 4px;
          height: 12px;
          background: #404040;
          border-radius: 2px;
        }
        .bike__pedal-crank {
          position: absolute;
          bottom: 10px;
          left: 55px;
          width: 20px;
          height: 20px;
          animation: bike-pedal 0.5s linear infinite;
        }
        .bike__pedal {
          position: absolute;
          width: 8px;
          height: 4px;
          background: #404040;
          border-radius: 2px;
        }
        .bike__pedal--top {
          top: 0;
          left: 50%;
          transform: translateX(-50%);
        }
        .bike__pedal--bottom {
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
        }
        .bike__pedal-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 10px;
          height: 10px;
          background: #525252;
          border-radius: 50%;
          border: 2px solid #404040;
        }
        .bike__wheel {
          position: absolute;
          bottom: 0;
          width: 40px;
          height: 40px;
          background: transparent;
          border: 4px solid #1a1a1a;
          border-radius: 100%;
        }
        .bike__wheel--front {
          right: 5px;
        }
        .bike__wheel--back {
          left: 5px;
        }
        .bike-wheel__hub {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 10px;
          height: 10px;
          background: #525252;
          border-radius: 50%;
        }
        .bike-wheel__rim {
          position: absolute;
          inset: 0;
          animation: bike-spin 0.4s linear infinite;
        }
        .bike-wheel__spoke {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 1px;
          height: 100%;
          background: #737373;
          transform-origin: center;
          transform: translate(-50%, -50%) rotate(calc(var(--index) * 30deg));
        }
        .bike__shadow {
          position: absolute;
          bottom: -4px;
          left: 5%;
          width: 90%;
          height: 5px;
          background: radial-gradient(ellipse, rgba(0,0,0,0.25), transparent);
          filter: blur(4px);
        }
        .bike__reflector {
          position: absolute;
          bottom: 18px;
          left: 3px;
          width: 4px;
          height: 4px;
          background: #ef4444;
          border-radius: 50%;
          box-shadow: 0 0 5px #ef4444;
        }
      `}</style>

      <div className="bike-wrapper">
        <div className="bike__shadow" />

        {/* Frame */}
        <div className="bike__frame-main" />
        <div className="bike__frame-seat" />
        <div className="bike__frame-head" />
        <div className="bike__frame-down" />
        <div className="bike__frame-chain" />

        {/* Components */}
        <div className="bike__seat" />
        <div className="bike__handlebar-stem" />
        <div className="bike__handlebar" />
        <div className="bike__reflector" />

        {/* Pedals */}
        <div className="bike__pedal-crank">
          <div className="bike__pedal bike__pedal--top" />
          <div className="bike__pedal bike__pedal--bottom" />
          <div className="bike__pedal-center" />
        </div>

        {/* Front Wheel */}
        <div className="bike__wheel bike__wheel--front">
          <div className="bike-wheel__rim">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                style={{ "--index": i } as React.CSSProperties}
                className="bike-wheel__spoke"
              />
            ))}
          </div>
          <div className="bike-wheel__hub" />
        </div>

        {/* Back Wheel */}
        <div className="bike__wheel bike__wheel--back">
          <div className="bike-wheel__rim">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                style={{ "--index": i } as React.CSSProperties}
                className="bike-wheel__spoke"
              />
            ))}
          </div>
          <div className="bike-wheel__hub" />
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// ELECTRIC BIKE ANIMATION (Bike with battery indicator)
// =============================================================================
export const ElectricBikeAnimation: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-full">
      <style>{`
        @keyframes ebike-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ebike-pedal {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ebike-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes ebike-glow {
          0%, 100% { box-shadow: 0 0 5px #10b981, 0 0 10px rgba(16, 185, 129, 0.5); }
          50% { box-shadow: 0 0 10px #10b981, 0 0 20px rgba(16, 185, 129, 0.7); }
        }
        @keyframes ebike-battery-pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        .ebike-wrapper {
          position: relative;
          width: 150px;
          height: 85px;
          filter: drop-shadow(0 6px 6px rgba(0,0,0,0.2));
          animation: ebike-bounce 0.35s ease-in-out infinite;
        }
        .ebike__frame-main {
          position: absolute;
          bottom: 28px;
          left: 38px;
          width: 75px;
          height: 5px;
          background: linear-gradient(to right, #10b981, #059669);
          border-radius: 2px;
          transform: rotate(-8deg);
        }
        .ebike__frame-seat {
          position: absolute;
          bottom: 30px;
          left: 32px;
          width: 5px;
          height: 32px;
          background: #059669;
          border-radius: 2px;
        }
        .ebike__frame-head {
          position: absolute;
          bottom: 24px;
          right: 22px;
          width: 5px;
          height: 40px;
          background: #059669;
          border-radius: 2px;
          transform: rotate(15deg);
        }
        .ebike__frame-down {
          position: absolute;
          bottom: 20px;
          left: 43px;
          width: 52px;
          height: 5px;
          background: #059669;
          border-radius: 2px;
          transform: rotate(35deg);
        }
        .ebike__frame-chain {
          position: absolute;
          bottom: 20px;
          left: 30px;
          width: 48px;
          height: 5px;
          background: #059669;
          border-radius: 2px;
          transform: rotate(-20deg);
        }
        .ebike__battery {
          position: absolute;
          bottom: 32px;
          left: 48px;
          width: 28px;
          height: 12px;
          background: linear-gradient(to bottom, #1a1a1a, #0f0f0f);
          border-radius: 3px;
          border: 2px solid #10b981;
          animation: ebike-glow 1.5s ease-in-out infinite;
        }
        .ebike__battery-indicator {
          position: absolute;
          top: 2px;
          left: 2px;
          right: 4px;
          height: 4px;
          background: linear-gradient(to right, #10b981, #34d399);
          border-radius: 2px;
          animation: ebike-battery-pulse 1s ease-in-out infinite;
        }
        .ebike__battery-cap {
          position: absolute;
          top: 3px;
          right: -4px;
          width: 3px;
          height: 6px;
          background: #10b981;
          border-radius: 0 2px 2px 0;
        }
        .ebike__motor {
          position: absolute;
          bottom: 6px;
          left: 12px;
          width: 18px;
          height: 18px;
          background: radial-gradient(circle, #404040, #1a1a1a);
          border-radius: 50%;
          border: 2px solid #10b981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
        }
        .ebike__seat {
          position: absolute;
          bottom: 58px;
          left: 24px;
          width: 22px;
          height: 7px;
          background: #1a1a1a;
          border-radius: 5px 10px 3px 3px;
        }
        .ebike__handlebar {
          position: absolute;
          bottom: 58px;
          right: 12px;
          width: 28px;
          height: 5px;
          background: #1a1a1a;
          border-radius: 2px;
        }
        .ebike__handlebar-stem {
          position: absolute;
          bottom: 55px;
          right: 23px;
          width: 5px;
          height: 14px;
          background: #404040;
          border-radius: 2px;
        }
        .ebike__display {
          position: absolute;
          bottom: 62px;
          right: 18px;
          width: 10px;
          height: 6px;
          background: #10b981;
          border-radius: 2px;
          box-shadow: 0 0 5px #10b981;
        }
        .ebike__pedal-crank {
          position: absolute;
          bottom: 12px;
          left: 58px;
          width: 22px;
          height: 22px;
          animation: ebike-pedal 0.5s linear infinite;
        }
        .ebike__pedal {
          position: absolute;
          width: 9px;
          height: 5px;
          background: #404040;
          border-radius: 2px;
        }
        .ebike__pedal--top {
          top: 0;
          left: 50%;
          transform: translateX(-50%);
        }
        .ebike__pedal--bottom {
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
        }
        .ebike__pedal-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 12px;
          height: 12px;
          background: #525252;
          border-radius: 50%;
          border: 2px solid #404040;
        }
        .ebike__wheel {
          position: absolute;
          bottom: 0;
          width: 44px;
          height: 44px;
          background: transparent;
          border: 5px solid #1a1a1a;
          border-radius: 100%;
        }
        .ebike__wheel--front {
          right: 3px;
        }
        .ebike__wheel--back {
          left: 3px;
        }
        .ebike-wheel__hub {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 12px;
          height: 12px;
          background: #525252;
          border-radius: 50%;
        }
        .ebike-wheel__rim {
          position: absolute;
          inset: 0;
          animation: ebike-spin 0.35s linear infinite;
        }
        .ebike-wheel__spoke {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 2px;
          height: 100%;
          background: #737373;
          transform-origin: center;
          transform: translate(-50%, -50%) rotate(calc(var(--index) * 30deg));
        }
        .ebike__shadow {
          position: absolute;
          bottom: -4px;
          left: 5%;
          width: 90%;
          height: 6px;
          background: radial-gradient(ellipse, rgba(0,0,0,0.25), transparent);
          filter: blur(4px);
        }
        .ebike__light {
          position: absolute;
          bottom: 48px;
          right: 8px;
          width: 6px;
          height: 6px;
          background: #fef08a;
          border-radius: 50%;
          box-shadow: 0 0 10px #fef08a, 0 0 20px rgba(254, 240, 138, 0.6);
        }
        .ebike__reflector {
          position: absolute;
          bottom: 20px;
          left: 0px;
          width: 5px;
          height: 5px;
          background: #ef4444;
          border-radius: 50%;
          box-shadow: 0 0 6px #ef4444;
        }
      `}</style>

      <div className="ebike-wrapper">
        <div className="ebike__shadow" />

        {/* Frame */}
        <div className="ebike__frame-main" />
        <div className="ebike__frame-seat" />
        <div className="ebike__frame-head" />
        <div className="ebike__frame-down" />
        <div className="ebike__frame-chain" />

        {/* Battery (E-Bike feature) */}
        <div className="ebike__battery">
          <div className="ebike__battery-indicator" />
          <div className="ebike__battery-cap" />
        </div>

        {/* Motor (E-Bike feature) */}
        <div className="ebike__motor" />

        {/* Components */}
        <div className="ebike__seat" />
        <div className="ebike__handlebar-stem" />
        <div className="ebike__handlebar" />
        <div className="ebike__display" />
        <div className="ebike__light" />
        <div className="ebike__reflector" />

        {/* Pedals */}
        <div className="ebike__pedal-crank">
          <div className="ebike__pedal ebike__pedal--top" />
          <div className="ebike__pedal ebike__pedal--bottom" />
          <div className="ebike__pedal-center" />
        </div>

        {/* Front Wheel */}
        <div className="ebike__wheel ebike__wheel--front">
          <div className="ebike-wheel__rim">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                style={{ "--index": i } as React.CSSProperties}
                className="ebike-wheel__spoke"
              />
            ))}
          </div>
          <div className="ebike-wheel__hub" />
        </div>

        {/* Back Wheel */}
        <div className="ebike__wheel ebike__wheel--back">
          <div className="ebike-wheel__rim">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                style={{ "--index": i } as React.CSSProperties}
                className="ebike-wheel__spoke"
              />
            ))}
          </div>
          <div className="ebike-wheel__hub" />
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// SCOOTER ANIMATION
// =============================================================================
export const ScooterAnimation: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-full">
      <style>{`
        @keyframes scooter-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes scooter-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .scooter-wrapper {
          position: relative;
          width: 140px;
          height: 75px;
          filter: drop-shadow(0 6px 6px rgba(0,0,0,0.2));
          animation: scooter-bounce 0.4s ease-in-out infinite;
        }
        .scooter__body {
          position: absolute;
          bottom: 20px;
          left: 20px;
          width: 80px;
          height: 25px;
          background: linear-gradient(to bottom, #8b5cf6, #7c3aed);
          border-radius: 15px 10px 5px 10px;
          box-shadow: inset 0 -4px 8px rgba(0,0,0,0.2);
        }
        .scooter__seat {
          position: absolute;
          bottom: 42px;
          left: 30px;
          width: 35px;
          height: 10px;
          background: #1a1a1a;
          border-radius: 10px 15px 5px 5px;
        }
        .scooter__handlebar-stem {
          position: absolute;
          bottom: 30px;
          right: 25px;
          width: 5px;
          height: 30px;
          background: #525252;
          border-radius: 2px;
          transform: rotate(8deg);
        }
        .scooter__handlebar {
          position: absolute;
          bottom: 55px;
          right: 15px;
          width: 25px;
          height: 5px;
          background: #1a1a1a;
          border-radius: 2px;
        }
        .scooter__front-panel {
          position: absolute;
          bottom: 25px;
          right: 18px;
          width: 20px;
          height: 22px;
          background: linear-gradient(to bottom, #a78bfa, #8b5cf6);
          border-radius: 8px 8px 3px 3px;
        }
        .scooter__headlight {
          position: absolute;
          bottom: 28px;
          right: 22px;
          width: 8px;
          height: 8px;
          background: #fef08a;
          border-radius: 50%;
          box-shadow: 0 0 12px #fef08a, 0 0 24px rgba(254, 240, 138, 0.6);
        }
        .scooter__taillight {
          position: absolute;
          bottom: 22px;
          left: 18px;
          width: 6px;
          height: 4px;
          background: #ef4444;
          border-radius: 2px;
          box-shadow: 0 0 8px #ef4444;
        }
        .scooter__footrest {
          position: absolute;
          bottom: 15px;
          left: 35px;
          width: 40px;
          height: 4px;
          background: #404040;
          border-radius: 2px;
        }
        .scooter__wheel {
          position: absolute;
          bottom: 0;
          width: 32px;
          height: 32px;
          background: #1a1a1a;
          border-radius: 100%;
          border: 4px solid #0f0f0f;
        }
        .scooter__wheel--front {
          right: 12px;
        }
        .scooter__wheel--back {
          left: 12px;
        }
        .scooter-wheel__rim {
          position: absolute;
          inset: 3px;
          background: radial-gradient(circle, #404040, #1a1a1a);
          border-radius: 100%;
          animation: scooter-spin 0.3s linear infinite;
        }
        .scooter-wheel__spoke {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 2px;
          height: 100%;
          background: linear-gradient(to bottom, #737373, #1a1a1a);
          transform-origin: center;
          transform: translate(-50%, -50%) rotate(calc(var(--index) * 60deg));
        }
        .scooter__shadow {
          position: absolute;
          bottom: -4px;
          left: 10%;
          width: 80%;
          height: 5px;
          background: radial-gradient(ellipse, rgba(0,0,0,0.25), transparent);
          filter: blur(4px);
        }
      `}</style>

      <div className="scooter-wrapper">
        <div className="scooter__shadow" />

        {/* Body */}
        <div className="scooter__body" />
        <div className="scooter__seat" />
        <div className="scooter__front-panel" />
        <div className="scooter__footrest" />

        {/* Handlebar */}
        <div className="scooter__handlebar-stem" />
        <div className="scooter__handlebar" />

        {/* Lights */}
        <div className="scooter__headlight" />
        <div className="scooter__taillight" />

        {/* Front Wheel */}
        <div className="scooter__wheel scooter__wheel--front">
          <div className="scooter-wheel__rim">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                style={{ "--index": i } as React.CSSProperties}
                className="scooter-wheel__spoke"
              />
            ))}
          </div>
        </div>

        {/* Back Wheel */}
        <div className="scooter__wheel scooter__wheel--back">
          <div className="scooter-wheel__rim">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                style={{ "--index": i } as React.CSSProperties}
                className="scooter-wheel__spoke"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// VEHICLE ANIMATION SELECTOR
// =============================================================================
interface VehicleAnimationProps {
  vehicleType?: string;
}

export const VehicleAnimation: React.FC<VehicleAnimationProps> = ({
  vehicleType,
}) => {
  switch (vehicleType) {
    case "motorcycle":
      return <MotorcycleAnimation />;
    case "bike":
      return <BikeAnimation />;
    case "electric_bike":
      return <ElectricBikeAnimation />;
    case "scooter":
      return <ScooterAnimation />;
    case "car":
    default:
      return <CarAnimation />;
  }
};

import React from "react";

/**
 * Animated3DProfileBackground
 *
 * Animowane 3D tło dla profili użytkowników z kształtami z FeedPage
 * - Worker: Paint Roller (pomarańczowy)
 * - Employer: Nebula Core (pomarańczowy)
 * - Cleaning Company: Cyber Tesseract (niebieski)
 * - Admin: Prismatic Obelisk (fioletowy)
 * - Accountant: Nebula Core (pomarańczowy)
 */

// 3D BACKGROUND COMPONENTS (from FeedPage_PREMIUM)
// =====================================================

// 1. The Nebula Core (Announcements/Ogłoszenia)
const NebulaCore = React.memo(({ style }: { style: React.CSSProperties }) => (
  <div className="nebula-container" style={style}>
    <div className="nebula-core"></div>
    <div className="nebula-ring nr-1"></div>
    <div className="nebula-ring nr-2"></div>
    <div className="nebula-ring nr-3"></div>
    <div className="absolute top-0 left-20 w-2 h-2 bg-white rounded-full blur-[1px] animate-pulse"></div>
    <div className="absolute bottom-10 right-10 w-3 h-3 bg-orange-500 rounded-full blur-[2px] animate-bounce"></div>
  </div>
));

// 2. The Cyber Tesseract (Jobs/Oferty pracy)
const CyberTesseract = React.memo(
  ({ style }: { style: React.CSSProperties }) => (
    <div className="tesseract-container" style={style}>
      <div className="tesseract-cube">
        <div className="t-face f1"></div>
        <div className="t-face f2"></div>
        <div className="t-face f3"></div>
        <div className="t-face f4"></div>
        <div className="t-face f5"></div>
        <div className="t-face f6"></div>
        <div className="t-inner"></div>
      </div>
    </div>
  )
);

// 3. Paint Roller (Jobs/Oferty pracy - Vacatures)
const PaintRoller = React.memo(({ style }: { style: React.CSSProperties }) => (
  <div className="paint-roller-wrapper" style={style}>
    <div className="paint-roller-container">
      <div className="paint-roller-roller">
        <div className="paint-roller-handle" />
      </div>
      <div className="paint-roller-paint" />
    </div>
  </div>
));

// 4. The Prismatic Obelisk (Ads/Reklamy)
const PrismaticObelisk = React.memo(
  ({ style }: { style: React.CSSProperties }) => (
    <div className="prism-container" style={style}>
      <div className="prism-shape">
        <div className="prism-core"></div>
        <div className="p-face pf-1"></div>
        <div className="p-face pf-2"></div>
        <div className="p-face pf-3"></div>
        <div className="p-face pf-4"></div>
        <div className="prism-ring pr-1"></div>
        <div className="prism-ring pr-2"></div>
        <div className="prism-glow"></div>
        <div className="prism-sparkle ps-1"></div>
        <div className="prism-sparkle ps-2"></div>
      </div>
    </div>
  )
);

interface Animated3DProfileBackgroundProps {
  /** Rola użytkownika: worker, employer, cleaning_company, admin, accountant */
  role: "worker" | "employer" | "cleaning_company" | "admin" | "accountant";
  /** Opacity tła (0-1, domyślnie 0.25) */
  opacity?: number;
}

export const Animated3DProfileBackground: React.FC<
  Animated3DProfileBackgroundProps
> = ({ role, opacity = 0.25 }) => {
  // Render 3D shapes based on user role
  const render3DShapes = () => {
    switch (role) {
      case "worker":
        // Paint Roller - pomarańczowy (Worker = Vacature)
        return (
          <>
            <div className="absolute top-[15%] right-[10%] opacity-70 scale-75">
              <PaintRoller style={{ animationDelay: "0s" }} />
            </div>
            <div className="absolute bottom-[20%] left-[15%] opacity-50 scale-50">
              <PaintRoller style={{ animationDelay: "-1.2s" }} />
            </div>
            <div className="absolute top-[45%] right-[35%] opacity-30 scale-40">
              <PaintRoller style={{ animationDelay: "-2.5s" }} />
            </div>
          </>
        );

      case "employer":
        // Nebula Core - pomarańczowy (Employer = Announcements)
        return (
          <>
            <div className="absolute top-[12%] left-[8%] opacity-80 scale-75">
              <NebulaCore style={{ animationDuration: "10s" }} />
            </div>
            <div className="absolute bottom-[18%] right-[12%] opacity-55 scale-50 rotate-12">
              <NebulaCore
                style={{ animationDelay: "-5s", animationDuration: "14s" }}
              />
            </div>
            <div className="absolute top-[30%] right-[28%] opacity-25 scale-35 -rotate-12">
              <NebulaCore
                style={{ animationDelay: "-2s", animationDuration: "18s" }}
              />
            </div>
          </>
        );

      case "cleaning_company":
        // Cyber Tesseract - niebieski (Cleaning = Tech/Future)
        return (
          <>
            <div className="absolute top-[18%] right-[18%] opacity-75 scale-80">
              <CyberTesseract style={{ animationDuration: "12s" }} />
            </div>
            <div className="absolute bottom-[22%] left-[10%] opacity-45 scale-60 rotate-[15deg]">
              <CyberTesseract
                style={{ animationDuration: "18s", animationDelay: "-6s" }}
              />
            </div>
            <div className="absolute top-[42%] left-[6%] opacity-20 scale-35 -rotate-[25deg]">
              <CyberTesseract
                style={{ animationDuration: "15s", animationDelay: "-3s" }}
              />
            </div>
          </>
        );

      case "admin":
        // Prismatic Obelisk - fioletowy (Admin = Premium/Power)
        return (
          <>
            <div className="absolute top-[16%] left-[16%] opacity-75 scale-75">
              <PrismaticObelisk style={{ animationDuration: "11s" }} />
            </div>
            <div className="absolute bottom-[24%] right-[14%] opacity-55 scale-55 rotate-6">
              <PrismaticObelisk
                style={{ animationDelay: "-4s", animationDuration: "16s" }}
              />
            </div>
            <div className="absolute top-[14%] right-[22%] opacity-25 scale-30 -rotate-12 blur-[0.5px]">
              <PrismaticObelisk
                style={{ animationDelay: "-8s", animationDuration: "20s" }}
              />
            </div>
          </>
        );

      case "accountant":
        // Nebula Core - pomarańczowy (Accountant = Announcements)
        return (
          <>
            <div className="absolute top-[14%] left-[10%] opacity-75 scale-70">
              <NebulaCore style={{ animationDuration: "9s" }} />
            </div>
            <div className="absolute bottom-[20%] right-[14%] opacity-50 scale-45 rotate-12">
              <NebulaCore
                style={{ animationDelay: "-4.5s", animationDuration: "13s" }}
              />
            </div>
            <div className="absolute top-[32%] right-[30%] opacity-28 scale-32 -rotate-12">
              <NebulaCore
                style={{ animationDelay: "-1.5s", animationDuration: "17s" }}
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none perspective-container"
      style={{ opacity }}
    >
      {render3DShapes()}
    </div>
  );
};

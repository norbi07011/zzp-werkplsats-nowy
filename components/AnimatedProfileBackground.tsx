import React from "react";

/**
 * AnimatedProfileBackground
 *
 * Animowane tło dla profili użytkowników z kropkami tworzącymi literę pierwszego imienia
 * Inspirowane animacją logowania "ZZP Werkplaats"
 */

interface Dot {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  delay: number;
  size: number;
  isExtra?: boolean;
}

interface AnimatedProfileBackgroundProps {
  /** Litera do wyświetlenia (np. "W" dla Worker, "E" dla Employer) */
  letter: string;
  /** Opacity tła (0-1, domyślnie 0.4) */
  opacity?: number;
  /** Kolor kropek (hex, domyślnie #3b82f6 - blue) */
  dotColor?: string;
}

export const AnimatedProfileBackground: React.FC<
  AnimatedProfileBackgroundProps
> = ({ letter, opacity = 0.4, dotColor = "#3b82f6" }) => {
  const [assembled, setAssembled] = React.useState(false);
  const [dots, setDots] = React.useState<Dot[]>([]);

  // Alfabetyczne siatki 5x5 dla liter
  const letterGrids: Record<string, number[][]> = {
    A: [
      [0, 0, 1, 0, 0],
      [0, 1, 0, 1, 0],
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
    ],
    B: [
      [1, 1, 1, 1, 0],
      [1, 0, 0, 1, 0],
      [1, 1, 1, 1, 0],
      [1, 0, 0, 1, 0],
      [1, 1, 1, 1, 0],
    ],
    C: [
      [0, 1, 1, 1, 0],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 0],
      [1, 0, 0, 0, 1],
      [0, 1, 1, 1, 0],
    ],
    E: [
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0],
      [1, 1, 1, 1, 0],
      [1, 0, 0, 0, 0],
      [1, 1, 1, 1, 1],
    ],
    W: [
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 1, 0, 1],
      [1, 1, 0, 1, 1],
      [1, 0, 0, 0, 1],
    ],
    Z: [
      [1, 1, 1, 1, 1],
      [0, 0, 0, 1, 0],
      [0, 0, 1, 0, 0],
      [0, 1, 0, 0, 0],
      [1, 1, 1, 1, 1],
    ],
    P: [
      [1, 1, 1, 1, 0],
      [1, 0, 0, 1, 0],
      [1, 1, 1, 1, 0],
      [1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0],
    ],
    R: [
      [1, 1, 1, 1, 0],
      [1, 0, 0, 1, 0],
      [1, 1, 1, 1, 0],
      [1, 0, 1, 0, 0],
      [1, 0, 0, 1, 0],
    ],
    S: [
      [0, 1, 1, 1, 0],
      [1, 0, 0, 0, 0],
      [0, 1, 1, 1, 0],
      [0, 0, 0, 0, 1],
      [0, 1, 1, 1, 0],
    ],
    T: [
      [1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
    ],
    // Default: pusty kwadrat
    DEFAULT: [
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1],
    ],
  };

  React.useEffect(() => {
    const newDots: Dot[] = [];
    let idCounter = 0;

    // Wybierz siatkę dla litery
    const letterGrid = letterGrids[letter.toUpperCase()] || letterGrids.DEFAULT;

    // Konfiguracja siatki
    const dotSize = 6;
    const gap = 12;
    const totalCols = 5;
    const totalWidth = totalCols * gap;
    const startXOffset = -(totalWidth / 2) + gap / 2;
    const startYOffset = -30;

    // Dodaj kropki z siatki
    letterGrid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell === 1) {
          newDots.push({
            id: idCounter++,
            x: startXOffset + colIndex * gap,
            y: startYOffset + rowIndex * gap,
            startX: (Math.random() - 0.5) * 300,
            startY: (Math.random() - 0.5) * 300,
            delay: Math.random() * 2,
            size: dotSize,
          });
        }
      });
    });

    // Dodaj 8 losowych kropek tła
    for (let i = 0; i < 8; i++) {
      newDots.push({
        id: idCounter++,
        x: (Math.random() - 0.5) * 150,
        y: (Math.random() - 0.5) * 150,
        startX: (Math.random() - 0.5) * 400,
        startY: (Math.random() - 0.5) * 400,
        delay: Math.random() * 3,
        size: Math.random() > 0.5 ? 3 : 5,
        isExtra: true,
      });
    }

    setDots(newDots);

    // Uruchom animację
    const timer = setTimeout(() => {
      setAssembled(true);
    }, 200);
    return () => clearTimeout(timer);
  }, [letter]);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ opacity }}
    >
      <style>{`
        .profile-bg-dot {
          position: absolute;
          border-radius: 2px;
          transition: all 2s cubic-bezier(0.2, 0.8, 0.2, 1);
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
        }

        .profile-bg-dot.extra {
          border-radius: 50%;
          box-shadow: none;
        }

        .assembled .profile-bg-dot:hover {
          transform: translate(var(--tx), var(--ty)) scale(1.5) rotate(45deg) !important;
          z-index: 10;
          transition: transform 0.3s ease;
        }
      `}</style>

      <div className={`absolute inset-0 ${assembled ? "assembled" : ""}`}>
        {dots.map((dot) => {
          const xPos = assembled ? dot.x : dot.startX;
          const yPos = assembled ? dot.y : dot.startY;

          return (
            <span
              key={dot.id}
              className={`profile-bg-dot ${dot.isExtra ? "extra" : ""}`}
              style={{
                width: dot.size,
                height: dot.size,
                left: "50%",
                top: "50%",
                transform: `translate(${xPos}px, ${yPos}px)`,
                background: dot.isExtra
                  ? `${dotColor}30` // 30% opacity dla extra
                  : `linear-gradient(45deg, ${dotColor}, ${dotColor}80)`,
                // @ts-ignore
                "--tx": `${xPos}px`,
                "--ty": `${yPos}px`,
                transitionDelay: `${dot.delay}s`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

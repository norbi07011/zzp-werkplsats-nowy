import React, { useEffect, useState } from "react";

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

export const LoginLoadingAnimation: React.FC = () => {
  const [assembled, setAssembled] = useState(false);
  const [dots, setDots] = useState<Dot[]>([]);

  // Definicja liter Z Z P w siatce 5x5
  // 1 = kropka, 0 = pusto
  const letterZ = [
    [1, 1, 1, 1, 1],
    [0, 0, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0],
    [1, 1, 1, 1, 1],
  ];

  const letterP = [
    [1, 1, 1, 1, 0],
    [1, 0, 0, 1, 0],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
  ];

  useEffect(() => {
    const newDots: Dot[] = [];
    let idCounter = 0;

    // Konfiguracja siatki
    const dotSize = 24; // Rozmiar kwadratu (8 * 3)
    const gap = 42; // Odstęp między środkami punktów (14 * 3)
    const letterSpacing = 60; // Odstęp między literami (20 * 3)

    // Obliczanie szerokości napisu, aby go wycentrować
    // Z(5 kolumn) + odstęp + Z(5 kolumn) + odstęp + P(4 kolumny)
    // Szerokość w pikselach = (kolumny * gap)
    const totalCols = 5 + 5 + 5;
    const totalWidth = totalCols * gap + 2 * letterSpacing;

    const startXOffset = -(totalWidth / 2) + gap / 2;
    const startYOffset = -120; // Przesunięcie w pionie (-40 * 3)

    const addLetter = (grid: number[][], xOffset: number) => {
      grid.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell === 1) {
            newDots.push({
              id: idCounter++,
              x: startXOffset + xOffset + colIndex * gap,
              y: startYOffset + rowIndex * gap,
              // Losowe pozycje startowe (rozrzucone poza kartą lub w jej obrębie)
              startX: (Math.random() - 0.5) * 400,
              startY: (Math.random() - 0.5) * 400,
              delay: Math.random() * 2.8, // Opóźnienie animacji (0.8 + 2.0)
              size: dotSize,
            });
          }
        });
      });
    };

    // Dodajemy litery
    // Z
    addLetter(letterZ, 0);
    // Z
    addLetter(letterZ, 5 * gap + letterSpacing);
    // P
    addLetter(letterP, 10 * gap + 2 * letterSpacing);

    // Dodatkowe "latające" kropki dla efektu chaosu, które nie tworzą napisu
    for (let i = 0; i < 15; i++) {
      newDots.push({
        id: idCounter++,
        x: (Math.random() - 0.5) * 660, // (220 * 3)
        y: (Math.random() - 0.5) * 750, // (250 * 3)
        startX: (Math.random() - 0.5) * 1500, // (500 * 3)
        startY: (Math.random() - 0.5) * 1500, // (500 * 3)
        delay: Math.random() * 3.5, // (1.5 + 2.0)
        size: Math.random() > 0.5 ? 15 : 30, // (5 * 3) : (10 * 3)
        isExtra: true,
      });
    }

    setDots(newDots);

    // Małe opóźnienie żeby DOM się załadował przed animacją
    const timer = setTimeout(() => {
      setAssembled(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="loader-wrapper">
      <style>{`
        .loader-wrapper {
          position: fixed;
          inset: 0;
          background: #f8fafc;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.5s ease-in-out, visibility 0.5s;
        }

        /* Styl Karty */
        .u-card {
          width: 900px; /* 300px * 3 */
          height: 1050px; /* 350px * 3 */
          position: relative;
          background-image: linear-gradient(
              230deg,
              rgba(93, 93, 93, 0.03) 0%,
              rgba(93, 93, 93, 0.03) 50%,
              rgba(78, 78, 78, 0.03) 50%,
              rgba(78, 78, 78, 0.03) 100%
            ),
            linear-gradient(
              107deg,
              rgba(55, 55, 55, 0.01) 0%,
              rgba(55, 55, 55, 0.01) 50%,
              rgba(170, 170, 170, 0.01) 50%,
              rgba(170, 170, 170, 0.01) 100%
            ),
            linear-gradient(
              278deg,
              rgba(16, 16, 16, 0.03) 0%,
              rgba(16, 16, 16, 0.03) 50%,
              rgba(24, 24, 24, 0.03) 50%,
              rgba(24, 24, 24, 0.03) 100%
            ),
            linear-gradient(
              205deg,
              rgba(116, 116, 116, 0.03) 0%,
              rgba(116, 116, 116, 0.03) 50%,
              rgba(0, 0, 0, 0.03) 50%,
              rgba(0, 0, 0, 0.03) 100%
            ),
            linear-gradient(
              150deg,
              rgba(5, 5, 5, 0.03) 0%,
              rgba(5, 5, 5, 0.03) 50%,
              rgba(80, 80, 80, 0.03) 50%,
              rgba(80, 80, 80, 0.03) 100%
            ),
            linear-gradient(
              198deg,
              rgba(231, 231, 231, 0.03) 0%,
              rgba(231, 231, 231, 0.03) 50%,
              rgba(26, 26, 26, 0.03) 50%,
              rgba(26, 26, 26, 0.03) 100%
            ),
            linear-gradient(
              278deg,
              rgba(89, 89, 89, 0.03) 0%,
              rgba(89, 89, 89, 0.03) 50%,
              rgba(26, 26, 26, 0.03) 50%,
              rgba(26, 26, 26, 0.03) 100%
            ),
            linear-gradient(
              217deg,
              rgba(28, 28, 28, 0.03) 0%,
              rgba(28, 28, 28, 0.03) 50%,
              rgba(202, 202, 202, 0.03) 50%,
              rgba(202, 202, 202, 0.03) 100%
            ),
            linear-gradient(
              129deg,
              rgba(23, 23, 23, 0.03) 0%,
              rgba(23, 23, 23, 0.03) 50%,
              rgba(244, 244, 244, 0.03) 50%,
              rgba(244, 244, 244, 0.03) 100%
            ),
            linear-gradient(135deg, rgb(1, 132, 255), rgb(198, 5, 91));
          border-radius: 90px; /* 30px * 3 */
          display: grid;
          place-content: center;
          box-shadow: 0 90px 180px rgba(0, 0, 0, 0.3); /* 30px * 3, 60px * 3 */
          transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          overflow: hidden;
        }

        .u-card:hover {
          transform: scale(1.02);
        }

        /* Styl Kropek */
        .u-dot {
          position: absolute;
          /* Gradient dot */
          background: linear-gradient(
            45deg,
            rgb(255, 255, 255) 0%,
            rgba(255, 255, 255, 0.34) 100%
          );
          border-top: 3px solid rgb(255, 255, 255); /* 1px * 3 */
          border-right: 3px solid white; /* 1px * 3 */
          border-radius: 6px; /* 2px * 3 */
          transition: all 2.5s cubic-bezier(0.2, 0.8, 0.2, 1); /* 1.2s + 1.3s */
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.2); /* 10px * 3 */
        }

        /* Kropki tła */
        .u-dot.extra {
          background: rgba(255, 255, 255, 0.15);
          border: none;
          box-shadow: none;
          border-radius: 50%;
        }

        /* Animacja hover na kropkach */
        .assembled .u-dot:hover {
          transform: translate(var(--tx), var(--ty)) scale(1.5) rotate(45deg) !important;
          background: #fff;
          z-index: 10;
          box-shadow: 0 0 45px rgba(255, 255, 255, 0.8); /* 15px * 3 */
          transition: transform 0.2s ease;
        }

        /* Napis na dole */
        .u-text {
          position: absolute;
          bottom: 90px; /* 30px * 3 */
          left: 50%;
          transform: translateX(-50%) translateY(45px); /* 15px * 3 */
          font-family: "Outfit", sans-serif;
          font-weight: 800;
          font-size: 42px; /* 14px * 3 */
          letter-spacing: 9px; /* 3px * 3 */
          color: white;
          opacity: 0;
          transition: all 1.5s cubic-bezier(0.895, 0.03, 0.685, 0.22) 2.5s; /* delay: 0.5s -> 2.5s */
          text-transform: uppercase;
          white-space: nowrap;
        }

        .assembled .u-text {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      `}</style>

      <div className={`u-card ${assembled ? "assembled" : ""}`}>
        {dots.map((dot) => {
          // Ustawiamy zmienne CSS dla transformacji, aby zachować pozycję przy hoverze
          const xPos = assembled ? dot.x : dot.startX;
          const yPos = assembled ? dot.y : dot.startY;

          return (
            <span
              key={dot.id}
              className={`u-dot ${dot.isExtra ? "extra" : ""}`}
              style={{
                width: dot.size,
                height: dot.size,
                left: "50%",
                top: "50%",
                // Używamy translate do pozycjonowania względem środka
                transform: `translate(${xPos}px, ${yPos}px)`,
                // Przekazujemy pozycję do zmiennych CSS, żeby hover działał płynnie
                // @ts-ignore
                "--tx": `${xPos}px`,
                "--ty": `${yPos}px`,
                transitionDelay: `${dot.delay}s`,
              }}
            />
          );
        })}
        <div className="u-text">ZZP Werkplaats</div>
      </div>
    </div>
  );
};

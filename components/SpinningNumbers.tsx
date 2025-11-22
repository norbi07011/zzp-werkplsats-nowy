import React from "react";

/**
 * SpinningNumbers Component
 *
 * Animowane wirujące cyfry dla profilu firm sprzątających
 * Inspirowane przez www.doi.org - efekt kosmicznych liczb
 */

interface SpinningNumbersProps {
  opacity?: number;
  style?: React.CSSProperties;
}

export const SpinningNumbers: React.FC<SpinningNumbersProps> = ({
  opacity = 0.25,
  style,
}) => {
  return (
    <div className="spinning-number-wrapper" style={{ opacity, ...style }}>
      <div className="spinning-number">
        {/* Wheel 1 - 22 numbers */}
        <div
          style={
            {
              color: "hwb(240 0% 0%)",
              "--l": "3em",
              "--m": 22,
              "--t": "22s",
              "--r1": "normal",
              "--s": 1,
            } as React.CSSProperties
          }
          className="wheel"
        >
          <div
            style={{ "--a": "0deg", "--i": 0 } as React.CSSProperties}
            className="number"
          />
          <div
            style={
              {
                "--a": "16deg",
                "--i": 1,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={
              {
                "--a": "32deg",
                "--i": 2,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={{ "--a": "49deg", "--i": 3 } as React.CSSProperties}
            className="number"
          />
          <div
            style={
              {
                "--a": "65deg",
                "--i": 4,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={
              {
                "--a": "81deg",
                "--i": 5,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={
              {
                "--a": "98deg",
                "--i": 6,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={
              {
                "--a": "114deg",
                "--i": 7,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={
              {
                "--a": "130deg",
                "--i": 8,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={{ "--a": "147deg", "--i": 9 } as React.CSSProperties}
            className="number"
          />
          <div
            style={
              {
                "--a": "163deg",
                "--i": 10,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={{ "--a": "180deg", "--i": 11 } as React.CSSProperties}
            className="number"
          />
          <div
            style={
              {
                "--a": "196deg",
                "--i": 12,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={{ "--a": "212deg", "--i": 13 } as React.CSSProperties}
            className="number"
          />
          <div
            style={{ "--a": "229deg", "--i": 14 } as React.CSSProperties}
            className="number"
          />
          <div
            style={{ "--a": "245deg", "--i": 15 } as React.CSSProperties}
            className="number"
          />
          <div
            style={
              {
                "--a": "261deg",
                "--i": 16,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={{ "--a": "278deg", "--i": 17 } as React.CSSProperties}
            className="number"
          />
          <div
            style={
              {
                "--a": "294deg",
                "--i": 18,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={
              {
                "--a": "310deg",
                "--i": 19,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={{ "--a": "327deg", "--i": 20 } as React.CSSProperties}
            className="number"
          />
          <div
            style={
              {
                "--a": "343deg",
                "--i": 21,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
        </div>

        {/* Wheel 2 - 29 numbers */}
        <div
          style={
            {
              color: "hwb(243 0% 0%)",
              "--l": "4em",
              "--m": 29,
              "--t": "29s",
              "--r1": "reverse",
              "--s": 0.9977810650887574,
            } as React.CSSProperties
          }
          className="wheel"
        >
          <div
            style={{ "--a": "0deg", "--i": 0 } as React.CSSProperties}
            className="number"
          />
          <div
            style={{ "--a": "12deg", "--i": 1 } as React.CSSProperties}
            className="number"
          />
          <div
            style={
              {
                "--a": "24deg",
                "--i": 2,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={
              {
                "--a": "37deg",
                "--i": 3,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={
              {
                "--a": "49deg",
                "--i": 4,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={
              {
                "--a": "62deg",
                "--i": 5,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={{ "--a": "74deg", "--i": 6 } as React.CSSProperties}
            className="number"
          />
          <div
            style={{ "--a": "86deg", "--i": 7 } as React.CSSProperties}
            className="number"
          />
          <div
            style={
              {
                "--a": "99deg",
                "--i": 8,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={
              {
                "--a": "111deg",
                "--i": 9,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={{ "--a": "124deg", "--i": 10 } as React.CSSProperties}
            className="number"
          />
          <div
            style={
              {
                "--a": "136deg",
                "--i": 11,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={
              {
                "--a": "148deg",
                "--i": 12,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={
              {
                "--a": "161deg",
                "--i": 13,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={{ "--a": "173deg", "--i": 14 } as React.CSSProperties}
            className="number"
          />
          <div
            style={{ "--a": "186deg", "--i": 15 } as React.CSSProperties}
            className="number"
          />
          <div
            style={
              {
                "--a": "198deg",
                "--i": 16,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={{ "--a": "211deg", "--i": 17 } as React.CSSProperties}
            className="number"
          />
          <div
            style={{ "--a": "223deg", "--i": 18 } as React.CSSProperties}
            className="number"
          />
          <div
            style={{ "--a": "235deg", "--i": 19 } as React.CSSProperties}
            className="number"
          />
          <div
            style={{ "--a": "248deg", "--i": 20 } as React.CSSProperties}
            className="number"
          />
          <div
            style={
              {
                "--a": "260deg",
                "--i": 21,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={
              {
                "--a": "273deg",
                "--i": 22,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={{ "--a": "285deg", "--i": 23 } as React.CSSProperties}
            className="number"
          />
          <div
            style={
              {
                "--a": "297deg",
                "--i": 24,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={
              {
                "--a": "310deg",
                "--i": 25,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={
              {
                "--a": "322deg",
                "--i": 26,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={{ "--a": "335deg", "--i": 27 } as React.CSSProperties}
            className="number"
          />
          <div
            style={
              {
                "--a": "347deg",
                "--i": 28,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
        </div>

        {/* Wheel 3 - 36 numbers */}
        <div
          style={
            {
              color: "hwb(247 0% 0%)",
              "--l": "5em",
              "--m": 36,
              "--t": "36s",
              "--r1": "reverse",
              "--s": 0.9911242603550295,
            } as React.CSSProperties
          }
          className="wheel"
        >
          <div
            style={{ "--a": "0deg", "--i": 0 } as React.CSSProperties}
            className="number"
          />
          <div
            style={{ "--a": "10deg", "--i": 1 } as React.CSSProperties}
            className="number"
          />
          <div
            style={{ "--a": "20deg", "--i": 2 } as React.CSSProperties}
            className="number"
          />
          <div
            style={
              {
                "--a": "29deg",
                "--i": 3,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={{ "--a": "40deg", "--i": 4 } as React.CSSProperties}
            className="number"
          />
          <div
            style={{ "--a": "50deg", "--i": 5 } as React.CSSProperties}
            className="number"
          />
          <div
            style={
              {
                "--a": "59deg",
                "--i": 6,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={{ "--a": "70deg", "--i": 7 } as React.CSSProperties}
            className="number"
          />
          <div
            style={
              {
                "--a": "80deg",
                "--i": 8,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={
              {
                "--a": "90deg",
                "--i": 9,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={{ "--a": "100deg", "--i": 10 } as React.CSSProperties}
            className="number"
          />
          <div
            style={
              {
                "--a": "110deg",
                "--i": 11,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={{ "--a": "119deg", "--i": 12 } as React.CSSProperties}
            className="number"
          />
          <div
            style={
              {
                "--a": "130deg",
                "--i": 13,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={{ "--a": "140deg", "--i": 14 } as React.CSSProperties}
            className="number"
          />
          <div
            style={{ "--a": "150deg", "--i": 15 } as React.CSSProperties}
            className="number"
          />
          <div
            style={
              {
                "--a": "160deg",
                "--i": 16,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={
              {
                "--a": "170deg",
                "--i": 17,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={{ "--a": "180deg", "--i": 18 } as React.CSSProperties}
            className="number"
          />
          <div
            style={{ "--a": "190deg", "--i": 19 } as React.CSSProperties}
            className="number"
          />
          <div
            style={{ "--a": "200deg", "--i": 20 } as React.CSSProperties}
            className="number"
          />
          <div
            style={
              {
                "--a": "209deg",
                "--i": 21,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={
              {
                "--a": "220deg",
                "--i": 22,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={
              {
                "--a": "229deg",
                "--i": 23,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={{ "--a": "239deg", "--i": 24 } as React.CSSProperties}
            className="number"
          />
          <div
            style={{ "--a": "249deg", "--i": 25 } as React.CSSProperties}
            className="number"
          />
          <div
            style={
              {
                "--a": "260deg",
                "--i": 26,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={
              {
                "--a": "270deg",
                "--i": 27,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={{ "--a": "280deg", "--i": 28 } as React.CSSProperties}
            className="number"
          />
          <div
            style={
              {
                "--a": "290deg",
                "--i": 29,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={
              {
                "--a": "300deg",
                "--i": 30,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={{ "--a": "310deg", "--i": 31 } as React.CSSProperties}
            className="number"
          />
          <div
            style={{ "--a": "320deg", "--i": 32 } as React.CSSProperties}
            className="number"
          />
          <div
            style={
              {
                "--a": "329deg",
                "--i": 33,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
          <div
            style={{ "--a": "340deg", "--i": 34 } as React.CSSProperties}
            className="number"
          />
          <div
            style={
              {
                "--a": "350deg",
                "--i": 35,
                "--r": "reverse",
              } as React.CSSProperties
            }
            className="number"
          />
        </div>
      </div>

      <style>{`
        .spinning-number-wrapper {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 0.5em;
          pointer-events: none;
        }

        .spinning-number {
          position: relative;
        }

        .spinning-number .wheel {
          animation: spinning-number-spin var(--t) linear infinite var(--r1);
        }

        @keyframes spinning-number-spin {
          0% {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .spinning-number .number {
          position: absolute;
          transform: translate(-50%, -50%) rotate(var(--a))
            translateY(calc(var(--l) * -1)) scale(var(--s));
        }

        .spinning-number .number::before {
          content: "1";
          --z: 1.9;
          --r: normal;
          transform: translate(-50%, -50%);
          animation: spinning-number-changing calc(var(--t) * var(--z))
            calc(-1 * var(--z) * var(--t) * var(--i) / var(--m) - 60s) linear infinite
            var(--r);
          font-weight: bold;
          font-size: 1.2em;
          text-shadow: 0 0 10px currentColor;
        }

        @keyframes spinning-number-changing {
          0% {
            content: "1";
          }
          10% {
            content: "2";
          }
          20% {
            content: "3";
          }
          30% {
            content: "4";
          }
          40% {
            content: "5";
          }
          50% {
            content: "6";
          }
          60% {
            content: "7";
          }
          70% {
            content: "8";
          }
          80% {
            content: "9";
          }
          90% {
            content: "0";
          }
          to {
            content: "1";
          }
        }
      `}</style>
    </div>
  );
};

export default SpinningNumbers;

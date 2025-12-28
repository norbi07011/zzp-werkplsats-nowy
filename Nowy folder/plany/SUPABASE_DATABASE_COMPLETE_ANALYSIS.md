plan zmienienia wyglondu liczników : 
TASK:
Redesign all dashboard counters / metrics into modern, premium SaaS-style data modules.

CURRENT ISSUE:
The existing counters look outdated, flat, and non-technical.

NEW CONCEPT:
Replace classic colored tiles with glassmorphism-based "Data Chips".

DESIGN REQUIREMENTS:

1. Structure:
- small, elegant modules
- icon + label (secondary)
- number as main visual focus (hero)

2. Visual style:
- glassmorphism background
- semi-transparent white (rgba 255,255,255, 0.55–0.7)
- backdrop-filter blur 14–20px
- no pastel color blocks

3. Borders:
- subtle gradient border or light stroke
- consistent with mobile navigation glass style
- thin and elegant

4. Color usage:
- no solid colored cards
- accent color ONLY for:
  - number
  - glow
  - hover state
- neutral base for everything else

5. Typography:
- modern sans-serif (Inter)
- large, confident numbers
- small, calm labels

6. Animations:
- count-up animation for numbers
- smooth easing
- subtle hover glow

DO NOT:
- use classic dashboard tiles
- use big solid backgrounds
- use heavy shadows

FINAL FEEL:
High-end SaaS analytics dashboard
Modern, technological, elegant
Consistent with glass + gradient UI language



1) Wklej plik: components/StatChips.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";

type StatChipTone = "cyan" | "violet" | "amber" | "slate";

export type StatChipItem = {
  id: string;
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  tone?: StatChipTone;
  hint?: string; // opcjonalny mały opis pod spodem
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Delikatna animacja count-up dla liczb.
 * Jeśli value nie jest liczbą — zwraca bez animacji.
 */
function useCountUp(target: number, durationMs = 650) {
  const [val, setVal] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const from = val;
    const to = target;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const tick = (t: number) => {
      const p = clamp((t - start) / durationMs, 0, 1);
      // easeOutExpo
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      const next = from + (to - from) * eased;
      setVal(next);

      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return val;
}

function toneVars(tone: StatChipTone) {
  // Akcent tylko jako "glow" / gradient-stroke. Nie robimy kolorowego kafla.
  switch (tone) {
    case "cyan":
      return {
        glowA: "rgba(34,211,238,0.22)",
        glowB: "rgba(59,130,246,0.18)",
        num: "linear-gradient(90deg, rgba(34,211,238,1), rgba(59,130,246,1))",
        border: "linear-gradient(90deg, rgba(34,211,238,0.9), rgba(59,130,246,0.75), rgba(168,85,247,0.6))",
      };
    case "violet":
      return {
        glowA: "rgba(168,85,247,0.18)",
        glowB: "rgba(236,72,153,0.12)",
        num: "linear-gradient(90deg, rgba(168,85,247,1), rgba(236,72,153,0.9))",
        border: "linear-gradient(90deg, rgba(59,130,246,0.55), rgba(168,85,247,0.9), rgba(236,72,153,0.6))",
      };
    case "amber":
      return {
        glowA: "rgba(251,191,36,0.18)",
        glowB: "rgba(245,158,11,0.14)",
        num: "linear-gradient(90deg, rgba(245,158,11,1), rgba(251,191,36,1))",
        border: "linear-gradient(90deg, rgba(251,191,36,0.8), rgba(245,158,11,0.7), rgba(59,130,246,0.35))",
      };
    default:
      return {
        glowA: "rgba(148,163,184,0.14)",
        glowB: "rgba(59,130,246,0.10)",
        num: "linear-gradient(90deg, rgba(30,41,59,1), rgba(59,130,246,0.95))",
        border: "linear-gradient(90deg, rgba(148,163,184,0.65), rgba(59,130,246,0.35), rgba(168,85,247,0.25))",
      };
  }
}

export function StatChipsGrid({
  items,
  columns = 4,
}: {
  items: StatChipItem[];
  columns?: 2 | 3 | 4;
}) {
  const gridStyle = useMemo(() => {
    const c = columns;
    return {
      gridTemplateColumns: `repeat(${c}, minmax(0, 1fr))`,
    } as React.CSSProperties;
  }, [columns]);

  return (
    <div className="statGrid" style={gridStyle}>
      {items.map((it) => (
        <StatChip key={it.id} item={it} />
      ))}
    </div>
  );
}

export function StatChip({ item }: { item: StatChipItem }) {
  const tone = item.tone ?? "cyan";
  const vars = toneVars(tone);

  const isNumber = typeof item.value === "number";
  const animated = useCountUp(isNumber ? item.value : 0, 650);

  const displayValue = isNumber
    ? new Intl.NumberFormat("pl-PL").format(Math.round(animated))
    : String(item.value);

  return (
    <div
      className="statChip"
      style={
        {
          "--chipBorder": vars.border,
          "--chipGlowA": vars.glowA,
          "--chipGlowB": vars.glowB,
          "--chipNum": vars.num,
        } as React.CSSProperties
      }
    >
      <div className="statChipGlow" />
      <div className="statChipInner">
        <div className="statChipTop">
          <div className="statChipLabel">{item.label}</div>
          <div className="statChipIcon" aria-hidden="true">
            {item.icon ?? <span className="statChipIconFallback">●</span>}
          </div>
        </div>

        <div className="statChipValue" title={String(item.value)}>
          {displayValue}
        </div>

        {item.hint ? <div className="statChipHint">{item.hint}</div> : null}
      </div>
    </div>
  );
}

2) Wklej CSS: components/stat-chips.css
/* Container grid */
.statGrid {
  display: grid;
  gap: 16px;
  align-items: stretch;
}

/* The chip */
.statChip {
  position: relative;
  border-radius: 18px;
  isolation: isolate;
  overflow: hidden;

  /* “floating” */
  box-shadow:
    0 12px 32px rgba(2, 6, 23, 0.10),
    0 2px 10px rgba(2, 6, 23, 0.06);

  /* gradient border ONLY (mask trick) */
  background: transparent;
}

/* Gradient border ring */
.statChip::before {
  content: "";
  position: absolute;
  inset: 0;
  padding: 1.5px;
  border-radius: inherit;
  background: var(--chipBorder);

  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;

  opacity: 0.9;
  pointer-events: none;
  z-index: 0;
}

/* Soft ambient glow (subtle) */
.statChipGlow {
  position: absolute;
  inset: -24px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 20% 30%, var(--chipGlowA), transparent 55%),
    radial-gradient(circle at 85% 70%, var(--chipGlowB), transparent 60%);
  filter: blur(18px);
  opacity: 0.9;
  z-index: 0;
}

/* Glass inside */
.statChipInner {
  position: relative;
  margin: 1.5px; /* matches border thickness */
  border-radius: 16px;
  padding: 14px 14px 12px 14px;

  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);

  z-index: 1;
}

/* Top row */
.statChipTop {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.statChipLabel {
  font-size: 13px;
  line-height: 1.2;
  color: rgba(15, 23, 42, 0.70);
  font-weight: 600;
}

.statChipIcon {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: grid;
  place-items: center;

  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 6px 18px rgba(2, 6, 23, 0.08);
  color: rgba(15, 23, 42, 0.65);
}

.statChipIconFallback {
  font-size: 14px;
  opacity: 0.7;
}

.statChipValue {
  margin-top: 10px;
  font-size: 34px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: -0.02em;

  /* gradient text */
  background: var(--chipNum);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.statChipHint {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(15, 23, 42, 0.55);
  font-weight: 500;
}

/* Hover: premium elevation */
.statChip:hover {
  transform: translateY(-1px);
  transition: transform 200ms ease, box-shadow 200ms ease;
  box-shadow:
    0 16px 40px rgba(2, 6, 23, 0.12),
    0 4px 14px rgba(2, 6, 23, 0.08);
}


3) Importuj CSS w miejscu globalnym

W zależności od projektu:

Vite/React:

W main.tsx:

import "./components/stat-chips.css";

Next.js:

W app/globals.css albo w komponencie (jeśli masz css modules – powiedz, dopasuję)

4) Przykład użycia w Twojej stronie profilu/panelu
import { StatChipsGrid, StatChipItem } from "./components/StatChips";

export default function DashboardStats() {
  const items: StatChipItem[] = [
    { id: "clients", label: "Aktywni klienci", value: 0, tone: "cyan", icon: <span>👥</span> },
    { id: "rating", label: "Ocena", value: "0,0", tone: "amber", icon: <span>⭐</span>, hint: "0 opinii" },
    { id: "views", label: "Wyświetlenia profilu", value: 59, tone: "cyan", icon: <span>👁️</span> },
    { id: "msg", label: "Wiadomości", value: 3, tone: "violet", icon: <span>🔔</span> },
  ];

  return <StatChipsGrid items={items} columns={4} />;
}
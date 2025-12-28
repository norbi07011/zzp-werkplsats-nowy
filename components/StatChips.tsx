import React, { useEffect, useMemo, useRef, useState } from "react";

type StatChipTone = "cyan" | "violet" | "amber" | "slate" | "emerald" | "rose";

export type StatChipItem = {
  id: string;
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  tone?: StatChipTone;
  hint?: string; // opcjonalny mały opis pod spodem
  onClick?: () => void; // opcjonalne kliknięcie
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
        border:
          "linear-gradient(90deg, rgba(34,211,238,0.9), rgba(59,130,246,0.75), rgba(168,85,247,0.6))",
      };
    case "violet":
      return {
        glowA: "rgba(168,85,247,0.18)",
        glowB: "rgba(236,72,153,0.12)",
        num: "linear-gradient(90deg, rgba(168,85,247,1), rgba(236,72,153,0.9))",
        border:
          "linear-gradient(90deg, rgba(59,130,246,0.55), rgba(168,85,247,0.9), rgba(236,72,153,0.6))",
      };
    case "amber":
      return {
        glowA: "rgba(251,191,36,0.18)",
        glowB: "rgba(245,158,11,0.14)",
        num: "linear-gradient(90deg, rgba(245,158,11,1), rgba(251,191,36,1))",
        border:
          "linear-gradient(90deg, rgba(251,191,36,0.8), rgba(245,158,11,0.7), rgba(59,130,246,0.35))",
      };
    case "emerald":
      return {
        glowA: "rgba(16,185,129,0.20)",
        glowB: "rgba(34,197,94,0.15)",
        num: "linear-gradient(90deg, rgba(16,185,129,1), rgba(34,197,94,1))",
        border:
          "linear-gradient(90deg, rgba(16,185,129,0.85), rgba(34,197,94,0.7), rgba(59,130,246,0.4))",
      };
    case "rose":
      return {
        glowA: "rgba(244,63,94,0.18)",
        glowB: "rgba(251,113,133,0.14)",
        num: "linear-gradient(90deg, rgba(244,63,94,1), rgba(251,113,133,1))",
        border:
          "linear-gradient(90deg, rgba(244,63,94,0.85), rgba(251,113,133,0.7), rgba(168,85,247,0.4))",
      };
    default: // slate
      return {
        glowA: "rgba(148,163,184,0.14)",
        glowB: "rgba(59,130,246,0.10)",
        num: "linear-gradient(90deg, rgba(30,41,59,1), rgba(59,130,246,0.95))",
        border:
          "linear-gradient(90deg, rgba(148,163,184,0.65), rgba(59,130,246,0.35), rgba(168,85,247,0.25))",
      };
  }
}

export function StatChipsGrid({
  items,
  columns = 4,
  className = "",
}: {
  items: StatChipItem[];
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}) {
  const gridStyle = useMemo(() => {
    return {
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    } as React.CSSProperties;
  }, [columns]);

  return (
    <div className={`statGrid ${className}`} style={gridStyle}>
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
  const animated = useCountUp(isNumber ? (item.value as number) : 0, 650);

  const displayValue = isNumber
    ? new Intl.NumberFormat("pl-PL").format(Math.round(animated))
    : String(item.value);

  return (
    <div
      className={`statChip ${item.onClick ? "statChipClickable" : ""}`}
      style={
        {
          "--chipBorder": vars.border,
          "--chipGlowA": vars.glowA,
          "--chipGlowB": vars.glowB,
          "--chipNum": vars.num,
        } as React.CSSProperties
      }
      onClick={item.onClick}
      role={item.onClick ? "button" : undefined}
      tabIndex={item.onClick ? 0 : undefined}
    >
      {/* Sparkle effects */}
      <div className="statChipSparkle" />
      <div className="statChipSparkle" />
      <div className="statChipSparkle" />

      <div className="statChipGlow" />
      <div className="statChipInner">
        <div className="statChipTop">
          <div className="statChipLabel">{item.label}</div>
          <div className="statChipIcon" aria-hidden="true">
            {item.icon ?? <span className="statChipIconFallback">●</span>}
          </div>
        </div>

        <div className="statChipBottom">
          <div className="statChipValue" title={String(item.value)}>
            {displayValue}
          </div>
          {item.hint ? <div className="statChipHint">{item.hint}</div> : null}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// WARIANT COMPACT - mniejszy chip do sidebar/mobile
// =====================================================
export function StatChipCompact({ item }: { item: StatChipItem }) {
  const tone = item.tone ?? "cyan";
  const vars = toneVars(tone);

  const isNumber = typeof item.value === "number";
  const animated = useCountUp(isNumber ? (item.value as number) : 0, 500);

  const displayValue = isNumber
    ? new Intl.NumberFormat("pl-PL").format(Math.round(animated))
    : String(item.value);

  return (
    <div
      className="statChipCompact"
      style={
        {
          "--chipNum": vars.num,
        } as React.CSSProperties
      }
    >
      <div className="statChipCompactIcon">{item.icon}</div>
      <div className="statChipCompactContent">
        <div className="statChipCompactValue">{displayValue}</div>
        <div className="statChipCompactLabel">{item.label}</div>
      </div>
    </div>
  );
}

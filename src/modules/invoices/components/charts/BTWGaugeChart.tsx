import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface BTWGaugeChartProps {
  vatRate: number; // 0-21 (percentage)
  recommendedRate?: number;
  currency?: string;
}

export function BTWGaugeChart({
  vatRate,
  recommendedRate = 21,
  currency = "€",
}: BTWGaugeChartProps) {
  // Clamp between 0-21%
  const clampedRate = Math.max(0, Math.min(vatRate, 21));
  const clampedRecommended = Math.max(0, Math.min(recommendedRate, 21));

  // Calculate angle (0% = -90deg, 21% = 90deg)
  const angle = (clampedRate / 21) * 180 - 90;
  const recommendedAngle = (clampedRecommended / 21) * 180 - 90;

  // Determine color zone
  const getZoneColor = () => {
    if (clampedRate === 0) return "text-slate-400";
    if (clampedRate <= 9) return "text-blue-500";
    if (clampedRate === 21) return "text-emerald-500";
    return "text-orange-500";
  };

  const getZoneLabel = () => {
    if (clampedRate === 0) return "Zwolniony z VAT (KOR)";
    if (clampedRate <= 9) return "Stawka obniżona";
    if (clampedRate === 21) return "Stawka standardowa";
    return "Stawka pośrednia";
  };

  const isCorrectRate = Math.abs(clampedRate - clampedRecommended) < 0.5;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎚️ Wskaźnik BTW
        </CardTitle>
        <CardDescription>
          Aktualna stawka VAT stosowana w fakturach
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Gauge container */}
        <div className="relative w-full aspect-[2/1] flex items-end justify-center">
          {/* Background arc */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100">
            {/* Base arc (gray) */}
            <path
              d="M 20 90 A 80 80 0 0 1 180 90"
              fill="none"
              stroke="rgb(226, 232, 240)"
              strokeWidth="20"
              strokeLinecap="round"
            />

            {/* Active arc (colored) */}
            <path
              d="M 20 90 A 80 80 0 0 1 180 90"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="20"
              strokeLinecap="round"
              strokeDasharray="251.2"
              strokeDashoffset={251.2 - 251.2 * (clampedRate / 21)}
              className="transition-all duration-1000 ease-out"
            />

            {/* Gradient definition */}
            <defs>
              <linearGradient
                id="gaugeGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="rgb(59, 130, 246)" />
                <stop offset="50%" stopColor="rgb(249, 115, 22)" />
                <stop offset="100%" stopColor="rgb(16, 185, 129)" />
              </linearGradient>
            </defs>

            {/* Tick marks */}
            {[0, 9, 21].map((tick) => {
              const tickAngle = (tick / 21) * 180 - 90;
              const tickRad = (tickAngle * Math.PI) / 180;
              const innerRadius = 70;
              const outerRadius = 85;
              const x1 = 100 + innerRadius * Math.cos(tickRad);
              const y1 = 90 + innerRadius * Math.sin(tickRad);
              const x2 = 100 + outerRadius * Math.cos(tickRad);
              const y2 = 90 + outerRadius * Math.sin(tickRad);

              return (
                <g key={tick}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="rgb(71, 85, 105)"
                    strokeWidth="2"
                  />
                  <text
                    x={100 + 95 * Math.cos(tickRad)}
                    y={90 + 95 * Math.sin(tickRad) + 4}
                    textAnchor="middle"
                    className="text-xs font-semibold fill-slate-600 dark:fill-slate-400"
                  >
                    {tick}%
                  </text>
                </g>
              );
            })}

            {/* Recommended rate indicator */}
            {recommendedRate !== vatRate && (
              <circle
                cx={100 + 78 * Math.cos((recommendedAngle * Math.PI) / 180)}
                cy={90 + 78 * Math.sin((recommendedAngle * Math.PI) / 180)}
                r="4"
                fill="rgb(168, 85, 247)"
                className="animate-pulse"
              />
            )}

            {/* Needle */}
            <g
              transform={`rotate(${angle} 100 90)`}
              className="transition-transform duration-1000 ease-out"
            >
              <line
                x1="100"
                y1="90"
                x2="100"
                y2="25"
                stroke="rgb(15, 23, 42)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="100" cy="90" r="6" fill="rgb(15, 23, 42)" />
              <circle cx="100" cy="90" r="3" fill="white" />
            </g>
          </svg>

          {/* Center value display */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center pb-4">
            <div className={`text-5xl font-black ${getZoneColor()}`}>
              {clampedRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-700 dark:text-white font-semibold mt-1">
              {getZoneLabel()}
            </div>
          </div>
        </div>

        {/* Status indicators */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg text-center">
            <div className="text-xs text-gray-700 dark:text-white font-semibold mb-1">
              Obniżona
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              0-9%
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950/30 p-3 rounded-lg text-center">
            <div className="text-xs text-gray-700 dark:text-white font-semibold mb-1">
              Pośrednia
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              9-21%
            </div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg text-center">
            <div className="text-xs text-gray-700 dark:text-white font-semibold mb-1">
              Standardowa
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              21%
            </div>
          </div>
        </div>

        {/* Validation message */}
        <div
          className={`flex items-center gap-3 p-4 rounded-lg ${
            isCorrectRate
              ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800"
              : "bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800"
          }`}
        >
          {isCorrectRate ? (
            <>
              <CheckCircle
                size={24}
                className="text-emerald-600 dark:text-emerald-400 flex-shrink-0"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Prawidłowa stawka VAT
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                  Stosujesz zalecaną stawkę {recommendedRate}% dla Twojej branży
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle
                size={24}
                className="text-orange-600 dark:text-orange-400 flex-shrink-0"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Sprawdź stawkę VAT
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                  Zalecana stawka dla branży budowlanej: {recommendedRate}%
                  (obecnie: {clampedRate}%)
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

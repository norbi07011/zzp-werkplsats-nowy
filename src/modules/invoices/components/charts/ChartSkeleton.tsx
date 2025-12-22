import { Card } from "../ui/card";

/**
 * Skeleton loader dla wykresów - pokazuje się podczas lazy loading
 */
export function ChartSkeleton() {
  return (
    <Card className="p-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="space-y-2">
          <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-64 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
      </div>

      {/* Chart area skeleton */}
      <div className="h-[300px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ładowanie wykresu...
          </p>
        </div>
      </div>
    </Card>
  );
}

/**
 * Kolory dla wykresów - spójny design system
 */
export const CHART_COLORS = {
  // Główne kolory
  primary: "#3b82f6", // blue-500
  success: "#10b981", // green-500
  danger: "#ef4444", // red-500
  warning: "#f59e0b", // amber-500
  info: "#06b6d4", // cyan-500

  // Przychody i wydatki
  revenue: "#10b981", // zielony
  expense: "#ef4444", // czerwony
  profit: "#3b82f6", // niebieski

  // VAT
  vatCollected: "#10b981", // zielony (VAT należny)
  vatDeductible: "#3b82f6", // niebieski (VAT naliczony)
  vatBalance: "#6366f1", // indigo

  // Kilometry
  mileage: "#8b5cf6", // fioletowy
  transport: "#a855f7", // purpurowy

  // Progi podatkowe
  korSafe: "#10b981", // zielony (0-50%)
  korWarning: "#f59e0b", // pomarańczowy (50-80%)
  korDanger: "#ef4444", // czerwony (80-100%)

  // Pastelowe (dla pie charts)
  pastel: [
    "#93c5fd", // blue-300
    "#86efac", // green-300
    "#fca5a5", // red-300
    "#fcd34d", // amber-300
    "#c4b5fd", // violet-300
    "#fdba74", // orange-300
    "#67e8f9", // cyan-300
    "#f9a8d4", // pink-300
  ],
};

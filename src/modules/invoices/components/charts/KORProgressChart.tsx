import { Progress } from "../ui/progress.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";

interface KORProgressChartProps {
  currentRevenue: number;
  currency?: string;
}

const KOR_THRESHOLDS = {
  LOWER: 20000, // €20,000 - KOR próg dolny
  UPPER: 1500000, // €1,500,000 - KOR próg górny (utrata korzyści)
};

export function KORProgressChart({
  currentRevenue,
  currency = "€",
}: KORProgressChartProps) {
  const formatCurrency = (value: number) => {
    return `${currency}${value.toLocaleString("nl-NL", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const percentageToLower = Math.min(
    (currentRevenue / KOR_THRESHOLDS.LOWER) * 100,
    100
  );
  const percentageToUpper = Math.min(
    (currentRevenue / KOR_THRESHOLDS.UPPER) * 100,
    100
  );

  const isAboveLower = currentRevenue >= KOR_THRESHOLDS.LOWER;
  const isNearUpper = currentRevenue >= KOR_THRESHOLDS.UPPER * 0.8;
  const isAboveUpper = currentRevenue >= KOR_THRESHOLDS.UPPER;

  const remainingToLower = Math.max(KOR_THRESHOLDS.LOWER - currentRevenue, 0);
  const remainingToUpper = Math.max(KOR_THRESHOLDS.UPPER - currentRevenue, 0);

  const getZoneColor = () => {
    if (isAboveUpper) return "bg-red-500";
    if (isNearUpper) return "bg-orange-500";
    if (isAboveLower) return "bg-emerald-500";
    return "bg-blue-500";
  };

  const getZoneText = () => {
    if (isAboveUpper) return "PRZEKROCZONO PRÓG GÓRNY";
    if (isNearUpper) return "UWAGA: ZBLIŻASZ SIĘ DO PROGU";
    if (isAboveLower) return "BEZPIECZNA STREFA KOR";
    return "PONIŻEJ PROGU DOLNEGO";
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎯 Progi KOR (Kleineondernemersregeling)
        </CardTitle>
        <CardDescription>
          Wykorzystanie progów zwolnienia z VAT dla małych przedsiębiorstw w
          Holandii
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status aktualny */}
        <div className={`${getZoneColor()} text-white p-6 rounded-xl`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold mb-1 opacity-90">
                OBECNY OBRÓT ROCZNY
              </p>
              <p className="text-4xl font-black">
                {formatCurrency(currentRevenue)}
              </p>
              <p className="text-sm mt-2 opacity-90">{getZoneText()}</p>
            </div>
            {isAboveLower && !isAboveUpper ? (
              <CheckCircle size={64} className="opacity-80" />
            ) : isAboveUpper ? (
              <AlertTriangle size={64} className="opacity-80" />
            ) : (
              <TrendingUp size={64} className="opacity-80" />
            )}
          </div>
        </div>

        {/* Próg dolny - €20,000 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isAboveLower ? "bg-emerald-500" : "bg-slate-300"
                }`}
              ></div>
              <span className="font-semibold text-gray-900 dark:text-white">
                Próg dolny KOR
              </span>
            </div>
            <span className="font-mono font-bold text-gray-900 dark:text-white">
              {formatCurrency(KOR_THRESHOLDS.LOWER)}
            </span>
          </div>
          <Progress value={percentageToLower} className="h-3" />
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
            <span>{percentageToLower.toFixed(1)}% wykorzystania</span>
            {!isAboveLower && (
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                Pozostało: {formatCurrency(remainingToLower)}
              </span>
            )}
            {isAboveLower && (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                ✓ Próg przekroczony
              </span>
            )}
          </div>
        </div>

        {/* Próg górny - €1,500,000 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isAboveUpper
                    ? "bg-red-500"
                    : isNearUpper
                    ? "bg-orange-500"
                    : "bg-slate-300"
                }`}
              ></div>
              <span className="font-semibold text-gray-900 dark:text-white">
                Próg górny KOR (utrata korzyści)
              </span>
            </div>
            <span className="font-mono font-bold text-gray-900 dark:text-white">
              {formatCurrency(KOR_THRESHOLDS.UPPER)}
            </span>
          </div>
          <Progress value={percentageToUpper} className="h-3" />
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
            <span>{percentageToUpper.toFixed(1)}% wykorzystania</span>
            {!isAboveUpper && (
              <span
                className={`font-semibold ${
                  isNearUpper
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                Margines: {formatCurrency(remainingToUpper)}
              </span>
            )}
            {isAboveUpper && (
              <span className="font-semibold text-red-600 dark:text-red-400">
                ⚠️ Próg przekroczony!
              </span>
            )}
          </div>
        </div>

        {/* Info box */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold mb-2">
            💡 Co to jest KOR?
          </p>
          <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
            Kleineondernemersregeling (KOR) to holenderski system zwolnienia z
            VAT dla małych firm. Gdy obrót przekracza €
            {KOR_THRESHOLDS.LOWER.toLocaleString()}, możesz korzystać z korzyści
            KOR. Przekroczenie €{KOR_THRESHOLDS.UPPER.toLocaleString()} oznacza
            utratę niektórych przywilejów.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

interface WaterfallData {
  category: string;
  value: number;
  start: number;
  end: number;
  isTotal?: boolean;
  isNegative?: boolean;
}

interface ProfitWaterfallProps {
  revenue: number;
  expenses: number;
  vat: number;
  currency?: string;
}

export function ProfitWaterfall({
  revenue,
  expenses,
  vat,
  currency = "€",
}: ProfitWaterfallProps) {
  const formatCurrency = (value: number) => {
    return `${currency}${Math.abs(value).toLocaleString("nl-NL", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  // Obliczenia waterfall
  const netRevenue = revenue;
  const afterExpenses = netRevenue - expenses;
  const finalProfit = afterExpenses - vat;

  const data: WaterfallData[] = [
    {
      category: "Przychody",
      value: netRevenue,
      start: 0,
      end: netRevenue,
      isTotal: false,
      isNegative: false,
    },
    {
      category: "Wydatki",
      value: expenses,
      start: netRevenue - expenses,
      end: netRevenue,
      isTotal: false,
      isNegative: true,
    },
    {
      category: "VAT",
      value: vat,
      start: afterExpenses - vat,
      end: afterExpenses,
      isTotal: false,
      isNegative: true,
    },
    {
      category: "Zysk NETTO",
      value: finalProfit,
      start: 0,
      end: finalProfit,
      isTotal: true,
      isNegative: finalProfit < 0,
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-blue-500/30">
          <p className="font-bold text-gray-900 dark:text-white mb-2">
            {item.category}
          </p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-700 dark:text-white">
              Wartość:{" "}
              <span
                className={`font-bold ${
                  item.isNegative ? "text-rose-600" : "text-blue-600"
                }`}
              >
                {item.isNegative && item.category !== "Zysk NETTO" ? "-" : ""}
                {formatCurrency(item.value)}
              </span>
            </p>
            {!item.isTotal && (
              <p className="text-gray-700 dark:text-white">
                Saldo:{" "}
                <span className="font-bold text-gray-900 dark:text-white">
                  {formatCurrency(item.end)}
                </span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const getBarColor = (entry: WaterfallData) => {
    if (entry.isTotal) {
      return entry.isNegative ? "rgb(239, 68, 68)" : "rgb(34, 197, 94)";
    }
    return entry.isNegative ? "rgb(248, 113, 113)" : "rgb(96, 165, 250)";
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📈 Analiza Zysku (Waterfall)
        </CardTitle>
        <CardDescription>
          Rozbicie zysku netto: od przychodów do ostatecznego wyniku
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-slate-200 dark:stroke-slate-700"
            />
            <XAxis
              dataKey="category"
              className="text-xs"
              tick={{ fill: "#6b7280" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "#6b7280" }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#64748b" strokeWidth={2} />
            <Bar dataKey="value" radius={[8, 8, 8, 8]} animationDuration={1000}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Podsumowanie */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">
              PRZYCHODY
            </p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
              {formatCurrency(revenue)}
            </p>
          </div>
          <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-lg">
            <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mb-1">
              WYDATKI
            </p>
            <p className="text-xl font-bold text-rose-700 dark:text-rose-300">
              -{formatCurrency(expenses)}
            </p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg">
            <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold mb-1">
              VAT
            </p>
            <p className="text-xl font-bold text-orange-700 dark:text-orange-300">
              -{formatCurrency(vat)}
            </p>
          </div>
          <div
            className={`${
              finalProfit >= 0
                ? "bg-emerald-50 dark:bg-emerald-950/30"
                : "bg-red-50 dark:bg-red-950/30"
            } p-4 rounded-lg`}
          >
            <p
              className={`text-xs ${
                finalProfit >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              } font-semibold mb-1`}
            >
              ZYSK NETTO
            </p>
            <p
              className={`text-xl font-bold ${
                finalProfit >= 0
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-red-700 dark:text-red-300"
              }`}
            >
              {formatCurrency(finalProfit)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

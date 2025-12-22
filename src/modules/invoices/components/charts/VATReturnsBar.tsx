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

interface VATReturnData {
  month: string;
  amount: number;
  type: "payment" | "refund";
}

interface VATReturnsBarProps {
  data: VATReturnData[];
  currency?: string;
}

export function VATReturnsBar({ data, currency = "€" }: VATReturnsBarProps) {
  const formatCurrency = (value: number) => {
    return `${currency}${Math.abs(value).toLocaleString("nl-NL", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-blue-500/30">
          <p className="font-bold text-gray-900 dark:text-white mb-2">
            {item.month}
          </p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-700 dark:text-white">
              {item.type === "payment"
                ? "💰 Wpłata do urzędu"
                : "💵 Zwrot z urzędu"}
            </p>
            <p
              className={`text-lg font-bold ${
                item.type === "payment"
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {formatCurrency(item.amount)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const getBarColor = (type: string) => {
    return type === "payment" ? "rgb(244, 63, 94)" : "rgb(16, 185, 129)";
  };

  const totalPayments = data
    .filter((d) => d.type === "payment")
    .reduce((sum, d) => sum + d.amount, 0);
  const totalRefunds = data
    .filter((d) => d.type === "refund")
    .reduce((sum, d) => sum + Math.abs(d.amount), 0);
  const netBalance = totalPayments - totalRefunds;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💸 Zwroty i Wpłaty VAT
        </CardTitle>
        <CardDescription>
          Miesięczne rozliczenia z Belastingdienst (BTW)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-slate-200 dark:stroke-slate-700"
            />
            <XAxis
              dataKey="month"
              className="text-xs"
              tick={{ fill: "#6b7280" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "#6b7280" }}
              tickFormatter={(value) => formatCurrency(Math.abs(value))}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#64748b" strokeWidth={2} />
            <Bar
              dataKey="amount"
              radius={[8, 8, 8, 8]}
              animationDuration={1000}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.type)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Podsumowanie */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-lg">
            <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mb-1">
              WPŁATY
            </p>
            <p className="text-xl font-bold text-rose-700 dark:text-rose-300">
              {formatCurrency(totalPayments)}
            </p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-lg">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
              ZWROTY
            </p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(totalRefunds)}
            </p>
          </div>
          <div
            className={`${
              netBalance >= 0
                ? "bg-blue-50 dark:bg-blue-950/30"
                : "bg-orange-50 dark:bg-orange-950/30"
            } p-4 rounded-lg`}
          >
            <p
              className={`text-xs ${
                netBalance >= 0
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-orange-600 dark:text-orange-400"
              } font-semibold mb-1`}
            >
              BILANS
            </p>
            <p
              className={`text-xl font-bold ${
                netBalance >= 0
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-orange-700 dark:text-orange-300"
              }`}
            >
              {netBalance >= 0 ? "+" : ""}
              {formatCurrency(netBalance)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

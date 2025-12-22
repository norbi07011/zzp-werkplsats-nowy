import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface RevenueVsExpensesBarProps {
  data: MonthlyData[];
  currency?: string;
}

export function RevenueVsExpensesBar({
  data,
  currency = "€",
}: RevenueVsExpensesBarProps) {
  const formatCurrency = (value: number) => {
    return `${currency}${value.toLocaleString("nl-NL", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-blue-500/30">
          <p className="font-bold text-gray-900 dark:text-white mb-2">
            {data.month}
          </p>
          <div className="space-y-1 text-sm">
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-gray-700 dark:text-white">Przychody:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(data.revenue)}
              </span>
            </p>
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="text-gray-700 dark:text-white">Wydatki:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {formatCurrency(data.expenses)}
              </span>
            </p>
            <p className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-blue-500/30">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-gray-700 dark:text-white">Zysk:</span>
              <span
                className={`font-bold ${
                  data.profit >= 0
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrency(data.profit)}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Przychody vs Wydatki
        </CardTitle>
        <CardDescription>
          Miesięczne porównanie przychodów i kosztów biznesowych
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
              dataKey="month"
              className="text-xs"
              tick={{ fill: "#6b7280" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "#6b7280" }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
            <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
            <Bar
              dataKey="revenue"
              name="Przychody"
              fill="rgb(16, 185, 129)"
              radius={[8, 8, 0, 0]}
              animationDuration={1000}
            />
            <Bar
              dataKey="expenses"
              name="Wydatki"
              fill="rgb(244, 63, 94)"
              radius={[8, 8, 0, 0]}
              animationDuration={1000}
              animationBegin={200}
            />
            <Bar
              dataKey="profit"
              name="Zysk netto"
              fill="rgb(59, 130, 246)"
              radius={[8, 8, 0, 0]}
              animationDuration={1000}
              animationBegin={400}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

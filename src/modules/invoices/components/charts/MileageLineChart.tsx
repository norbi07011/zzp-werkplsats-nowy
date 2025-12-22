import {
  LineChart,
  Line,
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

interface MileageData {
  month: string;
  kilometers: number;
  deduction: number;
  avgPerDay: number;
}

interface MileageLineChartProps {
  data: MileageData[];
  currency?: string;
}

const MILEAGE_RATE = 0.21; // €0.21 per km in Netherlands

export function MileageLineChart({
  data,
  currency = "€",
}: MileageLineChartProps) {
  const formatCurrency = (value: number) => {
    return `${currency}${value.toLocaleString("nl-NL", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const formatKm = (value: number) => {
    return `${value.toLocaleString("nl-NL")} km`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as MileageData;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-slate-200 dark:border-blue-500/30">
          <p className="font-semibold text-gray-900 dark:text-white mb-3">
            {label}
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-700 dark:text-white">
                Kilometry:
              </span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {formatKm(data.kilometers)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-gray-700 dark:text-white">
                Odliczenie VAT:
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(data.deduction)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-sm text-gray-700 dark:text-white">
                Średnio/dzień:
              </span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                {data.avgPerDay.toFixed(1)} km
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-blue-500/30">
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Stawka: {currency}
                {MILEAGE_RATE.toFixed(2)} za km
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate statistics
  const totalKm = data.reduce((sum, item) => sum + item.kilometers, 0);
  const totalDeduction = data.reduce((sum, item) => sum + item.deduction, 0);
  const avgKmPerMonth = data.length > 0 ? totalKm / data.length : 0;
  const maxKm =
    data.length > 0 ? Math.max(...data.map((item) => item.kilometers)) : 0;
  const maxKmMonth =
    data.find((item) => item.kilometers === maxKm)?.month || "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🚗 Przebieg Miesięczny
        </CardTitle>
        <CardDescription>
          Kilometry służbowe i odliczenia VAT (€0.21/km)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-xs text-blue-700 dark:text-blue-300 font-semibold mb-1">
              Suma km
            </div>
            <div className="text-xl font-black text-blue-600 dark:text-blue-400">
              {totalKm.toLocaleString("nl-NL")}
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold mb-1">
              VAT odliczenie
            </div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalDeduction)}
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="text-xs text-purple-700 dark:text-purple-300 font-semibold mb-1">
              Średnio/miesiąc
            </div>
            <div className="text-xl font-black text-purple-600 dark:text-purple-400">
              {avgKmPerMonth.toFixed(0)} km
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-950/30 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="text-xs text-orange-700 dark:text-orange-300 font-semibold mb-1">
              Rekord
            </div>
            <div className="text-lg font-black text-orange-600 dark:text-orange-400">
              {maxKm.toLocaleString("nl-NL")} km
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
              {maxKmMonth}
            </div>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(226, 232, 240)" />
            <XAxis
              dataKey="month"
              stroke="rgb(100, 116, 139)"
              style={{ fontSize: "12px", fontWeight: 600 }}
            />
            <YAxis
              yAxisId="left"
              stroke="rgb(59, 130, 246)"
              style={{ fontSize: "12px", fontWeight: 600 }}
              tickFormatter={(value) => `${value} km`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="rgb(16, 185, 129)"
              style={{ fontSize: "12px", fontWeight: 600 }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />

            {/* Reference line for average */}
            <ReferenceLine
              yAxisId="left"
              y={avgKmPerMonth}
              stroke="rgb(148, 163, 184)"
              strokeDasharray="5 5"
              label={{
                value: "Średnia",
                position: "insideTopRight",
                fill: "rgb(100, 116, 139)",
                fontSize: 11,
              }}
            />

            {/* Kilometers line */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="kilometers"
              name="Kilometry"
              stroke="rgb(59, 130, 246)"
              strokeWidth={3}
              dot={{ r: 5, fill: "rgb(59, 130, 246)" }}
              activeDot={{ r: 7 }}
              animationDuration={1500}
            />

            {/* Deduction line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="deduction"
              name="Odliczenie VAT (€)"
              stroke="rgb(16, 185, 129)"
              strokeWidth={3}
              dot={{ r: 4, fill: "rgb(16, 185, 129)" }}
              activeDot={{ r: 6 }}
              animationDuration={1500}
              animationBegin={200}
            />

            {/* Average per day line */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="avgPerDay"
              name="Średnio/dzień"
              stroke="rgb(168, 85, 247)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3, fill: "rgb(168, 85, 247)" }}
              activeDot={{ r: 5 }}
              animationDuration={1500}
              animationBegin={400}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

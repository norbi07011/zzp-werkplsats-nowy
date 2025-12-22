import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
  [key: string]: string | number; // Index signature for recharts compatibility
}

interface ExpensePieChartProps {
  data: ExpenseCategory[];
  currency?: string;
}

const COLORS = [
  "rgb(239, 68, 68)", // red-500
  "rgb(249, 115, 22)", // orange-500
  "rgb(234, 179, 8)", // yellow-500
  "rgb(34, 197, 94)", // green-500
  "rgb(59, 130, 246)", // blue-500
  "rgb(168, 85, 247)", // purple-500
  "rgb(236, 72, 153)", // pink-500
  "rgb(20, 184, 166)", // teal-500
];

export function ExpensePieChart({
  data,
  currency = "€",
}: ExpensePieChartProps) {
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return `${currency}0`;
    return `${currency}${value.toLocaleString("nl-NL", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-blue-500/30">
          <p className="font-bold text-gray-900 dark:text-white mb-2">
            {data.name}
          </p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-700 dark:text-white">
              Kwota:{" "}
              <span className="font-bold text-gray-900 dark:text-white">
                {formatCurrency(data.value)}
              </span>
            </p>
            <p className="text-gray-700 dark:text-white">
              Udział:{" "}
              <span className="font-bold text-gray-900 dark:text-white">
                {data.payload.percentage.toFixed(1)}%
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percentage,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percentage < 5) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="font-bold text-sm drop-shadow-lg"
      >
        {`${percentage.toFixed(1)}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🥧 Struktura Wydatków
        </CardTitle>
        <CardDescription>
          Rozkład kosztów biznesowych według kategorii
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={120}
              fill="#8884d8"
              dataKey="amount"
              nameKey="category"
              animationDuration={1000}
              animationBegin={0}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value, entry: any) => (
                <span className="text-sm text-gray-700 dark:text-white">
                  {value} ({formatCurrency(entry.payload.amount)})
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

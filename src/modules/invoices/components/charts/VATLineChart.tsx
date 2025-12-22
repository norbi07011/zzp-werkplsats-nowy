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

interface VATData {
  month: string;
  vatOwed: number;
  vatPaid: number;
  balance: number;
}

interface VATLineChartProps {
  data: VATData[];
  currency?: string;
}

export function VATLineChart({ data, currency = "€" }: VATLineChartProps) {
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
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="text-gray-700 dark:text-white">
                VAT należny:
              </span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {formatCurrency(data.vatOwed)}
              </span>
            </p>
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-gray-700 dark:text-white">
                VAT naliczony:
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(data.vatPaid)}
              </span>
            </p>
            <p className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-blue-500/30">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-gray-700 dark:text-white">Saldo:</span>
              <span
                className={`font-bold ${
                  data.balance >= 0
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-orange-600 dark:text-orange-400"
                }`}
              >
                {formatCurrency(Math.abs(data.balance))}{" "}
                {data.balance < 0 ? "(zwrot)" : "(wpłata)"}
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
          📈 VAT Należny vs Naliczony
        </CardTitle>
        <CardDescription>
          Porównanie VAT z faktur sprzedaży i zakupów (BTW Aangifte)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
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
            <Line
              type="monotone"
              dataKey="vatOwed"
              stroke="rgb(244, 63, 94)"
              strokeWidth={3}
              name="VAT należny (sprzedaż)"
              dot={{ fill: "rgb(244, 63, 94)", r: 5 }}
              activeDot={{ r: 7 }}
              animationDuration={1500}
            />
            <Line
              type="monotone"
              dataKey="vatPaid"
              stroke="rgb(16, 185, 129)"
              strokeWidth={3}
              name="VAT naliczony (zakupy)"
              dot={{ fill: "rgb(16, 185, 129)", r: 5 }}
              activeDot={{ r: 7 }}
              animationDuration={1500}
              animationBegin={200}
            />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="rgb(59, 130, 246)"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Saldo (do wpłaty/zwrotu)"
              dot={{ fill: "rgb(59, 130, 246)", r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={1500}
              animationBegin={400}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

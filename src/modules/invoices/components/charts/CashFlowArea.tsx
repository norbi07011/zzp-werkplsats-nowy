import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

interface CashFlowData {
  month: string;
  cashFlow: number;
  cumulative: number;
}

interface CashFlowAreaProps {
  data: CashFlowData[];
  currency?: string;
}

export function CashFlowArea({ data, currency = "€" }: CashFlowAreaProps) {
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
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-gray-700 dark:text-white">Przepływ:</span>
              <span
                className={`font-bold ${
                  data.cashFlow >= 0 ? "text-blue-600" : "text-red-600"
                }`}
              >
                {formatCurrency(data.cashFlow)}
              </span>
            </p>
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span>
              <span className="text-gray-700 dark:text-white">
                Skumulowany:
              </span>
              <span
                className={`font-bold ${
                  data.cumulative >= 0 ? "text-purple-600" : "text-red-600"
                }`}
              >
                {formatCurrency(data.cumulative)}
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
          💰 Przepływ Gotówki (Cash Flow)
        </CardTitle>
        <CardDescription>
          Miesięczny przepływ pieniędzy i trend skumulowany
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorCashFlow" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="rgb(59, 130, 246)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="rgb(59, 130, 246)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="rgb(168, 85, 247)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="rgb(168, 85, 247)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
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
            <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="cashFlow"
              stroke="rgb(59, 130, 246)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorCashFlow)"
              name="Przepływ miesięczny"
              animationDuration={1500}
            />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="rgb(168, 85, 247)"
              strokeWidth={2}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#colorCumulative)"
              name="Skumulowany"
              animationDuration={1500}
              animationBegin={300}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

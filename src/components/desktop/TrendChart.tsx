import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { PriceTrendData, StatsTrendData } from "@/lib/v2exService";
import { cn } from "@/lib/utils";

interface TrendChartProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PriceTrendData | StatsTrendData | null;
  type: 'price' | 'stats';
}

export function TrendChart({ open, onOpenChange, data, type }: TrendChartProps) {
  if (!data) return null;

  const isPriceData = type === 'price';
  const title = isPriceData
    ? `${(data as PriceTrendData).symbol} - ${(data as PriceTrendData).name}`
    : (data as StatsTrendData).label;

  const chartData = data.history;
  const currentValue = isPriceData
    ? (data as PriceTrendData).currentPrice
    : (data as StatsTrendData).currentValue;

  const firstValue = chartData[0]?.value || 0;
  const changePercent = ((currentValue - firstValue) / firstValue) * 100;
  const isPositive = changePercent >= 0;

  const formatValue = (value: number) => {
    if (isPriceData) {
      return `$${value.toFixed(4)}`;
    }
    return value.toLocaleString();
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground mb-1">{payload[0].payload.label}</p>
          <p className="text-base font-semibold">{formatValue(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <div
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md",
                isPositive
                  ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>
                {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-baseline gap-4">
            <div>
              <p className="text-sm text-muted-foreground">当前值</p>
              <p className="text-3xl font-bold">{formatValue(currentValue)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">30天前</p>
              <p className="text-xl font-semibold text-muted-foreground">
                {formatValue(firstValue)}
              </p>
            </div>
          </div>

          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={isPositive ? "hsl(142, 71%, 45%)" : "hsl(0, 72%, 51%)"}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={isPositive ? "hsl(142, 71%, 45%)" : "hsl(0, 72%, 51%)"}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  tickLine={false}
                  tickFormatter={(value) => {
                    if (isPriceData) {
                      return `$${value.toFixed(2)}`;
                    }
                    return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value;
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={isPositive ? "hsl(142, 71%, 45%)" : "hsl(0, 72%, 51%)"}
                  strokeWidth={2}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            数据统计范围：最近 30 天
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

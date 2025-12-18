import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { HodlSnapshot } from '@/hooks/useV2exData';
import { cn } from '@/lib/utils';
import { formatAmount } from '@/hooks/useV2exData';

interface AmmLiquidityChartProps {
  snapshots: HodlSnapshot[];
  className?: string;
}

export default function AmmLiquidityChart({ snapshots, className }: AmmLiquidityChartProps) {
  const chartData = useMemo(() => {
    if (!snapshots.length) return [];

    const sanitized = snapshots
      .map((s) => ({
        ...s,
        main_amm_v2ex_amount:
          typeof s.main_amm_v2ex_amount === 'number' && s.main_amm_v2ex_amount > 0
            ? s.main_amm_v2ex_amount
            : undefined,
        main_amm_sol_amount:
          typeof s.main_amm_sol_amount === 'number' && s.main_amm_sol_amount > 0
            ? s.main_amm_sol_amount
            : undefined,
      }))
      .filter((s) => s.main_amm_v2ex_amount !== undefined || s.main_amm_sol_amount !== undefined)
      .reverse(); // chronological order

    const sampleRate = Math.max(1, Math.floor(sanitized.length / 150));
    return sanitized.filter((_, idx) => idx % sampleRate === 0).map((snapshot) => {
      const date = new Date(snapshot.created_at);
      return {
        date: date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
        fullDate: snapshot.created_at,
        v2exAmount: snapshot.main_amm_v2ex_amount,
        solAmount: snapshot.main_amm_sol_amount,
      };
    });
  }, [snapshots]);

  const domains = useMemo(() => {
    const calcDomain = (key: 'v2exAmount' | 'solAmount') => {
      let min = Infinity;
      let max = -Infinity;
      chartData.forEach((entry) => {
        const v = (entry as any)[key];
        if (typeof v === 'number') {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      });
      if (max === -Infinity) return ['auto', 'auto'] as [number | 'auto', number | 'auto'];
      if (min === max) {
        const pad = Math.max(min * 0.05, 1);
        return [Math.max(0, min - pad), min + pad] as [number, number];
      }
      const span = max - min;
      const pad = Math.max(span * 0.1, 1);
      return [Math.max(0, min - pad), max + pad] as [number, number];
    };

    return {
      left: calcDomain('v2exAmount'),
      right: calcDomain('solAmount'),
    };
  }, [chartData]);

  if (!chartData.length) {
    return (
      <div className={cn('bg-card border border-border rounded-lg p-5 text-center text-muted-foreground', className)}>
        暂无流动性数据
      </div>
    );
  }

  const tooltipFormatter = (value: number, name: string) => [formatAmount(value), name];

  return (
    <div className={cn('bg-card border border-border rounded-lg p-5', className)}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">主池流动性</h3>
        <p className="text-sm text-muted-foreground mt-1">主 AMM 中的 V2EX 与 SOL 规模变化</p>
      </div>

      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={domains.left}
              tickFormatter={(v) => formatAmount(v)}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={domains.right}
              tickFormatter={(v) => formatAmount(v)}
            />
            <Tooltip formatter={tooltipFormatter} labelFormatter={(l) => l} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="v2exAmount"
              name="V2EX 数量"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="solAmount"
              name="SOL 数量"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
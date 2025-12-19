import { useMemo, useState } from 'react';
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
import { formatAmount, formatPercent } from '@/hooks/useV2exData';

interface CommunityMetricsChartProps {
  snapshots: HodlSnapshot[];
  className?: string;
}

type TimeRange = '7d' | '30d' | '90d';

const METRICS = [
  { key: 'holders', name: '持有人数', color: '#10b981', axis: 'left' as const },
  { key: 'hodl_10k_addresses_count', name: '10k+持有人数', color: '#0ea5e9', axis: 'left' as const },
  { key: 'total_solana_addresses_linked', name: '链接地址', color: '#06b6d4', axis: 'left' as const },
  { key: 'new_accounts_via_solana', name: '新账户', color: '#a855f7', axis: 'right' as const },
] as const;

const MAX_POINTS = 160;
const timeFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export default function CommunityMetricsChart({ snapshots, className }: CommunityMetricsChartProps) {
  const timeRange: TimeRange = '30d';
  const [relativeMode, setRelativeMode] = useState(true);
  const [visibleMetrics, setVisibleMetrics] = useState<Record<string, boolean>>(
    () => METRICS.reduce((acc, m) => ({ ...acc, [m.key]: true }), {})
  );

  const sampledSeries = useMemo(() => {
    if (!snapshots.length) return [];

    const sorted = [...snapshots].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const daysMap: Record<TimeRange, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
    };
    const days = daysMap[timeRange];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (days - 1));

    const filtered = sorted.filter((snap) => new Date(snap.created_at) >= cutoff);
    if (!filtered.length) return [];

    const sanitizeMetric = (value: number | undefined | null) =>
      typeof value === 'number' && value !== 0 ? value : undefined;

    const chronological = filtered
      .map((snap) => ({
        date: snap.created_at,
        label: timeFormatter.format(new Date(snap.created_at)),
        holders: sanitizeMetric(snap.holders),
        hodl_10k_addresses_count: sanitizeMetric(snap.hodl_10k_addresses_count),
        total_solana_addresses_linked: sanitizeMetric(snap.total_solana_addresses_linked),
        new_accounts_via_solana: sanitizeMetric(snap.new_accounts_via_solana),
      }))
      .filter((entry) =>
        METRICS.some((metric) => typeof (entry as any)[metric.key] === 'number')
      );

    const sampleRate = Math.max(1, Math.ceil(chronological.length / MAX_POINTS));
    return chronological.filter((_, idx) => idx % sampleRate === 0);
  }, [snapshots, timeRange]);

  const chartData = useMemo(() => {
    if (!sampledSeries.length) return [];
    if (!relativeMode) return sampledSeries;

    const base = sampledSeries[0];
    const baseValues: Record<string, number | undefined> = METRICS.reduce((acc, metric) => {
      const v = (base as any)[metric.key];
      return { ...acc, [metric.key]: typeof v === 'number' && v !== 0 ? v : undefined };
    }, {} as Record<string, number | undefined>);

    return sampledSeries.map((entry) => {
      const next: Record<string, any> = { ...entry };
      METRICS.forEach((metric) => {
        const value = (entry as any)[metric.key];
        const baseValue = baseValues[metric.key];
        if (typeof value === 'number' && baseValue) {
          next[metric.key] = ((value - baseValue) / baseValue) * 100;
        } else {
          next[metric.key] = undefined;
        }
      });
      return next;
    });
  }, [relativeMode, sampledSeries]);

  const axisDomains = useMemo(() => {
    if (relativeMode) {
      return {
        left: ['auto', 'auto'] as [number | 'auto', number | 'auto'],
        right: ['auto', 'auto'] as [number | 'auto', number | 'auto'],
      };
    }

    const computeDomain = (axis: 'left' | 'right') => {
      const keys = METRICS.filter((m) => m.axis === axis && visibleMetrics[m.key]).map((m) => m.key);
      if (!keys.length) return ['auto', 'auto'] as [number | 'auto', number | 'auto'];

      let min = Infinity;
      let max = -Infinity;

      chartData.forEach((entry) => {
        keys.forEach((key) => {
          const v = (entry as any)[key];
          if (typeof v === 'number') {
            if (v < min) min = v;
            if (v > max) max = v;
          }
        });
      });

      if (max === -Infinity) return ['auto', 'auto'] as [number | 'auto', number | 'auto'];

      if (min === max) {
        const pad = Math.max(min * 0.1, 1);
        const lower = Math.max(0, min - pad);
        return [lower, min + pad] as [number, number];
      }

      const span = max - min;
      const pad = Math.max(span * 0.1, 1);
      const lower = Math.max(0, min - pad);
      const upper = max + pad;
      return [lower, upper] as [number, number];
    };

    return {
      left: computeDomain('left'),
      right: computeDomain('right'),
    };
  }, [chartData, relativeMode, visibleMetrics]);

  const toggleMetric = (key: string) => {
    setVisibleMetrics((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!chartData.length) {
    return (
      <div className={cn('bg-card border border-border rounded-lg p-5 text-center text-muted-foreground', className)}>
        暂无数据可展示
      </div>
    );
  }

  return (
    <div className={cn('bg-card border border-border rounded-lg p-5', className)}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">社区核心指标</h3>
        <p className="text-sm text-muted-foreground mt-1">每日最新记录：持有人数、在线人数、链上链接地址等</p>
      </div>

      <div className="flex flex-col gap-3 mb-4 text-sm text-muted-foreground">
        <div className="flex flex-wrap gap-3 items-center">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={relativeMode}
              onChange={() => setRelativeMode((v) => !v)}
            />
            <span>显示相对变化(%)</span>
            <span className="text-[11px] text-muted-foreground/80">(默认近30天)</span>
          </label>
        </div>
      </div>

      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis
              dataKey="label"
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
              domain={axisDomains.left}
              tickFormatter={(v) => (relativeMode ? formatPercent(v) : formatAmount(v))}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={axisDomains.right}
              tickFormatter={(v) => (relativeMode ? formatPercent(v) : formatAmount(v))}
            />
            <Tooltip
              formatter={(value: number, name: string) => [relativeMode ? formatPercent(value) : formatAmount(value), name]}
              labelFormatter={(label) => label as string}
              contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
            />
            {METRICS.filter((m) => visibleMetrics[m.key]).map((metric) => (
              <Line
                key={metric.key}
                yAxisId={metric.axis}
                type="monotone"
                dataKey={metric.key}
                name={metric.name}
                stroke={metric.color}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span>显示指标:</span>
        {METRICS.map((metric) => (
          <label key={metric.key} className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={visibleMetrics[metric.key]}
              onChange={() => toggleMetric(metric.key)}
            />
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: metric.color }} />
            <span>{metric.name}</span>
            <span className="text-[11px] text-muted-foreground/80">({metric.axis === 'left' ? '左轴' : '右轴'})</span>
          </label>
        ))}
      </div>
    </div>
  );
}

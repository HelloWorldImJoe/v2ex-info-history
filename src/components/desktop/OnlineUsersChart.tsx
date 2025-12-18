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

interface OnlineUsersChartProps {
  snapshots: HodlSnapshot[];
  className?: string;
}

export default function OnlineUsersChart({ snapshots, className }: OnlineUsersChartProps) {
  const chartData = useMemo(() => {
    if (!snapshots.length) return [];

    // Use all snapshots in range, chronological, with light sampling for readability
    const chronological = snapshots
      .map((snap) => ({
        created_at: snap.created_at,
        current_online_users: snap.current_online_users,
        peak_online_users: snap.peak_online_users,
      }))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .filter(
        (s) => typeof s.current_online_users === 'number' || typeof s.peak_online_users === 'number'
      );

    const sampleRate = Math.max(1, Math.floor(chronological.length / 200));
    return chronological
      .filter((_, idx) => idx % sampleRate === 0)
      .map((s) => {
        const d = new Date(s.created_at);
        return {
          ...s,
          label: d.toLocaleString('zh-CN', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
      });
  }, [snapshots]);

  if (!chartData.length) {
    return (
      <div className={cn('bg-card border border-border rounded-lg p-5 text-center text-muted-foreground', className)}>
        暂无在线人数数据
      </div>
    );
  }

  const computeDomain = (key: 'current_online_users' | 'peak_online_users') => {
    let min = Infinity;
    let max = -Infinity;
    chartData.forEach((item) => {
      const v = (item as any)[key];
      if (typeof v === 'number') {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    });
    if (max === -Infinity) return ['auto', 'auto'] as [number | 'auto', number | 'auto'];
    if (min === max) {
      const pad = Math.max(min * 0.1, 10);
      return [Math.max(0, min - pad), min + pad] as [number, number];
    }
    const span = max - min;
    const pad = Math.max(span * 0.1, 10);
    return [Math.max(0, min - pad), max + pad] as [number, number];
  };
  const domain = computeDomain('peak_online_users');

  return (
    <div className={cn('bg-card border border-border rounded-lg p-5', className)}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">在线人数趋势</h3>
        <p className="text-sm text-muted-foreground mt-1">每日最新快照的当前在线与峰值在线</p>
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
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={domain}
              tickFormatter={(v) => formatAmount(v)}
            />
            <Tooltip
              formatter={(value: number, name: string) => [formatAmount(value), name]}
              labelFormatter={(label) => label}
              contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="current_online_users"
              name="当前在线"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="peak_online_users"
              name="峰值在线"
              stroke="#F97316"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
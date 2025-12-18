import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Brush,
  ReferenceArea,
} from 'recharts';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RotateCcw } from 'lucide-react';
import type { HodlSnapshot } from '@/hooks/useV2exData';

interface PriceChartProps {
  snapshots: HodlSnapshot[];
  className?: string;
}

const COINS = [
  { key: 'price', name: '$V2EX', color: '#3B82F6' },
  { key: 'pump_price', name: 'PUMP', color: '#F97316' },
  { key: 'sol_price', name: 'SOL', color: '#14B8A6' },
  { key: 'btc_price', name: 'BTC', color: '#EAB308' },
] as const;

const sanitizePriceValue = (value?: number | null) => {
  if (typeof value !== 'number') return undefined;
  return value > 0 ? value : undefined;
};

export default function PriceChart({ snapshots, className }: PriceChartProps) {
  const [visibleCoins, setVisibleCoins] = useState<Record<string, boolean>>({
    price: true,
    pump_price: true,
    sol_price: true,
    btc_price: true,
  });
  const [showMA, setShowMA] = useState<Record<string, boolean>>({
    ma7: false,
    ma30: false,
  });
  const [isRelative, setIsRelative] = useState(false);
  
  // Zoom state
  const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<string | null>(null);
  const [zoomDomain, setZoomDomain] = useState<{ left: number; right: number } | null>(null);

  // Calculate moving average
  const calculateMA = (data: any[], period: number, key: string) => {
    return data.map((_, index) => {
      if (index < period - 1) return null;
      const window = data.slice(index - period + 1, index + 1);
      const values = window
        .map((entry) => entry[key])
        .filter((val: number | undefined) => typeof val === 'number');
      if (values.length < period) return null;
      const sum = values.reduce((acc, curr) => acc + (curr as number), 0);
      return sum / values.length;
    });
  };

  const chartData = useMemo(() => {
    if (!snapshots.length) return { absolute: [], relative: [] };

    // Sanitize price fields to drop zero/invalid points for cleaner charts
    const normalizedSnapshots = snapshots.map((snap) => ({
      ...snap,
      price: sanitizePriceValue(snap.price),
      pump_price: sanitizePriceValue(snap.pump_price),
      sol_price: sanitizePriceValue(snap.sol_price),
      btc_price: sanitizePriceValue(snap.btc_price),
    }));

    // Use all available (already range-filtered by upstream fetch) and display from oldest to newest
    let filtered = normalizedSnapshots.slice().reverse();

    // Remove rows where all coin prices are missing/invalid
    filtered = filtered.filter((s) =>
      [s.price, s.pump_price, s.sol_price, s.btc_price].some((v) => typeof v === 'number')
    );

    // Base prices for relative change (first valid point for each coin)
    const basePrices: Record<string, number | undefined> = {};
    ['price', 'pump_price', 'sol_price', 'btc_price'].forEach((key) => {
      const first = filtered.find((item) => typeof (item as any)[key] === 'number');
      basePrices[key] = typeof (first as any)?.[key] === 'number' ? (first as any)[key] : undefined;
    });

    // Sample: take every Nth item to get roughly 100-200 data points
    const sampleRate = Math.max(1, Math.floor(filtered.length / 150));
    const sampled = filtered.filter((_, i) => i % sampleRate === 0);

    const baseData = sampled.map((snapshot) => {
      const date = new Date(snapshot.created_at);
      return {
        date: date.toLocaleDateString('zh-CN', {
          month: 'numeric',
          day: 'numeric',
        }),
        fullDate: snapshot.created_at,
        price: snapshot.price,
        pump_price: snapshot.pump_price,
        sol_price: snapshot.sol_price,
        btc_price: snapshot.btc_price,
      };
    });

    // Absolute moving averages
    const ma7Abs = calculateMA(baseData, 7, 'price');
    const ma30Abs = calculateMA(baseData, 30, 'price');

    const absolute = baseData.map((item, index) => ({
      ...item,
      ma7_price: ma7Abs[index],
      ma30_price: ma30Abs[index],
    }));

    // Relative (% change from first valid point per coin)
    const toRelative = (value?: number, base?: number) => {
      if (typeof value !== 'number' || typeof base !== 'number' || base === 0) return undefined;
      return ((value / base) - 1) * 100;
    };

    const relativeBase = baseData.map((item) => ({
      ...item,
      price: toRelative(item.price, basePrices.price),
      pump_price: toRelative(item.pump_price, basePrices.pump_price),
      sol_price: toRelative(item.sol_price, basePrices.sol_price),
      btc_price: toRelative(item.btc_price, basePrices.btc_price),
    }));

    const ma7Rel = calculateMA(relativeBase, 7, 'price');
    const ma30Rel = calculateMA(relativeBase, 30, 'price');

    const relative = relativeBase.map((item, index) => ({
      ...item,
      ma7_price: ma7Rel[index],
      ma30_price: ma30Rel[index],
    }));

    return { absolute, relative };
  }, [snapshots]);

  const toggleMA = (key: string) => {
    setShowMA((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleCoin = (key: string) => {
    setVisibleCoins((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Zoom handlers
  const handleMouseDown = (e: any) => {
    if (e && e.activeLabel) {
      setRefAreaLeft(e.activeLabel);
    }
  };

  const handleMouseMove = (e: any) => {
    if (refAreaLeft && e && e.activeLabel) {
      setRefAreaRight(e.activeLabel);
    }
  };

  const activeData = isRelative ? chartData.relative : chartData.absolute;

  const handleMouseUp = () => {
    if (refAreaLeft && refAreaRight && refAreaLeft !== refAreaRight) {
      const leftIndex = activeData.findIndex((d) => d.date === refAreaLeft);
      const rightIndex = activeData.findIndex((d) => d.date === refAreaRight);
      
      if (leftIndex !== -1 && rightIndex !== -1) {
        const left = Math.min(leftIndex, rightIndex);
        const right = Math.max(leftIndex, rightIndex);
        setZoomDomain({ left, right });
      }
    }
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const handleZoomOut = () => {
    setZoomDomain(null);
  };

  const getDisplayData = () => {
    if (!zoomDomain) return activeData;
    return activeData.slice(zoomDomain.left, zoomDomain.right + 1);
  };

  const displayData = getDisplayData();

  const formatYAxis = (value: number, coinKey: string) => {
    if (isRelative) {
      return `${value.toFixed(1)}%`;
    }
    if (coinKey === 'btc_price' && value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    if (value < 0.01) {
      return `$${value.toFixed(4)}`;
    }
    if (value < 1) {
      return `$${value.toFixed(3)}`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatTooltipValue = (key: string, value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    if (isRelative) return `${value.toFixed(2)}%`;
    if (key === 'btc_price') return `$${value.toLocaleString()}`;
    if (value < 1) return `$${value.toFixed(6)}`;
    return `$${value.toFixed(2)}`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-xs text-muted-foreground mb-2">{payload[0]?.payload?.fullDate}</p>
          {payload.map((entry: any) => {
            const coin = COINS.find((c) => c.key === entry.dataKey);
            if (!coin) return null;
            return (
              <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: coin.color }}
                />
                <span className="text-muted-foreground">{coin.name}:</span>
                <span className="font-mono font-medium">{formatTooltipValue(entry.dataKey, entry.value)}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn('bg-card border border-border rounded-lg p-5', className)}>
      {/* Header */}
      <div className="mb-6 overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-6 gap-y-3 flex-wrap pr-1 min-w-0">
          <h3 className="text-lg font-semibold whitespace-nowrap">价格分析</h3>

          <div className="flex items-center gap-6 gap-y-3 flex-wrap text-sm">
            {/* Coin toggles */}
            <div className="flex items-center gap-3 flex-nowrap whitespace-nowrap">
              <span className="text-muted-foreground">显示币种:</span>
              {COINS.map((coin) => (
                <label
                  key={coin.key}
                  className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Checkbox
                    checked={visibleCoins[coin.key]}
                    onCheckedChange={() => toggleCoin(coin.key)}
                    className="h-4 w-4"
                  />
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: coin.color }}
                  />
                  <span>{coin.name}</span>
                </label>
              ))}
            </div>

            {/* MA toggles */}
            <div className="flex items-center gap-3 flex-nowrap whitespace-nowrap">
              <span className="text-muted-foreground">技术指标:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox
                  checked={showMA.ma7}
                  onCheckedChange={() => toggleMA('ma7')}
                  className="h-4 w-4"
                />
                <span>MA7</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox
                  checked={showMA.ma30}
                  onCheckedChange={() => toggleMA('ma30')}
                  className="h-4 w-4"
                />
                <span>MA30</span>
              </label>
            </div>

            <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap">
              <span className="text-muted-foreground">显示方式:</span>
              <Button
                size="sm"
                variant={isRelative ? 'outline' : 'default'}
                onClick={() => setIsRelative(false)}
              >
                绝对价格
              </Button>
              <Button
                size="sm"
                variant={isRelative ? 'default' : 'outline'}
                onClick={() => setIsRelative(true)}
              >
                相对变化
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={!zoomDomain}
            className="gap-2"
          >
            <RotateCcw className="h-3 w-3" />
            重置缩放
          </Button>
          <span className="text-xs text-muted-foreground">拖动选择区域缩放，点击重置返回全局视图</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[420px]">
        {activeData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={displayData}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.5}
              />
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
                tickFormatter={(v) => formatYAxis(v, 'price')}
                domain={['auto', 'auto']}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatYAxis(v, 'btc_price')}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Reference area for zoom selection */}
              {refAreaLeft && refAreaRight && (
                <ReferenceArea
                  yAxisId="left"
                  x1={refAreaLeft}
                  x2={refAreaRight}
                  strokeOpacity={0.3}
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                />
              )}
              
              {/* Brush for range selection */}
              {!zoomDomain && (
                <Brush
                  dataKey="date"
                  height={30}
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--muted))"
                />
              )}
              
              {visibleCoins.price && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="price"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                  name="$V2EX"
                />
              )}
              {visibleCoins.pump_price && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="pump_price"
                  stroke="#F97316"
                  strokeWidth={2}
                  dot={false}
                  name="PUMP"
                />
              )}
              {visibleCoins.sol_price && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="sol_price"
                  stroke="#14B8A6"
                  strokeWidth={2}
                  dot={false}
                  name="SOL"
                />
              )}
              {visibleCoins.btc_price && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="btc_price"
                  stroke="#EAB308"
                  strokeWidth={2}
                  dot={false}
                  name="BTC"
                />
              )}
              
              {/* Moving Averages */}
              {showMA.ma7 && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="ma7_price"
                  stroke="#A855F7"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                  name="MA7"
                  connectNulls
                />
              )}
              {showMA.ma30 && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="ma30_price"
                  stroke="#EC4899"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                  name="MA30"
                  connectNulls
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            暂无数据
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6">
        {COINS.filter((coin) => visibleCoins[coin.key]).map((coin) => (
          <div key={coin.key} className="flex items-center gap-2">
            <span
              className="w-3 h-0.5 rounded"
              style={{ backgroundColor: coin.color }}
            />
            <span className="text-sm text-muted-foreground">{coin.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

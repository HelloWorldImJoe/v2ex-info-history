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
  rangeDays: number;
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

const getAxisId = (key: string, isRelative: boolean) => {
  if (isRelative) return key === 'price' || key === 'pump_price' ? 'left' : 'right';
  if (key === 'price' || key === 'pump_price') return 'left';
  return key;
};

const INDICATOR_COLORS = {
  ma: '#8B5CF6',
  ema: '#F472B6',
  boll: '#9CA3AF',
};

const getIndicatorColor = (type: 'ma' | 'ema' | 'boll', fallback: string) => {
  return INDICATOR_COLORS[type] || fallback;
};

const getMaPeriod = (rangeDays: number) => {
  if (rangeDays <= 3) return 3;
  if (rangeDays <= 7) return 7;
  return 30;
};

const getEmaPeriod = (rangeDays: number) => getMaPeriod(rangeDays);

const getBollPeriod = (rangeDays: number) => {
  if (rangeDays >= 20) return 20;
  if (rangeDays >= 10) return 10;
  return Math.max(5, rangeDays);
};

export default function PriceChart({ snapshots, rangeDays, className }: PriceChartProps) {
  const [visibleCoins, setVisibleCoins] = useState<Record<string, boolean>>({
    price: true,
    pump_price: true,
    sol_price: true,
    btc_price: true,
  });
  const [isRelative, setIsRelative] = useState(false);
  const [showMA, setShowMA] = useState(false);
  const [showEMA, setShowEMA] = useState(false);
  const [showBoll, setShowBoll] = useState(false);
  
  // Zoom state
  const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<string | null>(null);
  const [zoomDomain, setZoomDomain] = useState<{ left: number; right: number } | null>(null);

  const maPeriod = useMemo(() => getMaPeriod(rangeDays), [rangeDays]);
  const emaPeriod = useMemo(() => getEmaPeriod(rangeDays), [rangeDays]);
  const bollPeriod = useMemo(() => getBollPeriod(rangeDays), [rangeDays]);

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

  const calculateEMA = (data: any[], period: number, key: string) => {
    const k = 2 / (period + 1);
    return data.map((_, index) => {
      const value = data[index][key];
      if (typeof value !== 'number') return null;
      if (index === 0) return value;
      const prev = data[index - 1][`ema_${key}`];
      if (typeof prev !== 'number') return value;
      return value * k + prev * (1 - k);
    });
  };

  const calculateBoll = (data: any[], period: number, key: string) => {
    return data.map((_, index) => {
      if (index < period - 1) return { upper: null, lower: null };
      const window = data.slice(index - period + 1, index + 1);
      const values = window
        .map((entry) => entry[key])
        .filter((val: number | undefined) => typeof val === 'number') as number[];
      if (values.length < period) return { upper: null, lower: null };
      const mean = values.reduce((acc, v) => acc + v, 0) / values.length;
      const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
      const std = Math.sqrt(variance);
      return { upper: mean + 2 * std, lower: mean - 2 * std };
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

    const coinKeys = COINS.map((c) => c.key);

    // Absolute indicators per coin
    const maAbs: Record<string, Array<number | null>> = {};
    const emaAbs: Record<string, Array<number | null>> = {};
    const bollAbsUpper: Record<string, Array<number | null>> = {};
    const bollAbsLower: Record<string, Array<number | null>> = {};

    coinKeys.forEach((key) => {
      maAbs[key] = calculateMA(baseData, maPeriod, key);
      // seed EMA with SMA values for smoother start
      const emaSeeded = baseData.map((entry, idx) => ({ ...entry, [`ema_${key}`]: maAbs[key][idx] }));
      emaAbs[key] = calculateEMA(emaSeeded, emaPeriod, key);
      const boll = calculateBoll(baseData, bollPeriod, key);
      bollAbsUpper[key] = boll.map((b) => b.upper);
      bollAbsLower[key] = boll.map((b) => b.lower);
    });

    const absolute = baseData.map((item, index) => {
      const indicatorFields = coinKeys.reduce((acc, key) => {
        acc[`ma_${key}`] = maAbs[key][index];
        acc[`ema_${key}`] = emaAbs[key][index];
        acc[`boll_upper_${key}`] = bollAbsUpper[key][index];
        acc[`boll_lower_${key}`] = bollAbsLower[key][index];
        return acc;
      }, {} as Record<string, number | null>);

      return {
        ...item,
        ...indicatorFields,
      };
    });

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

    const maRel: Record<string, Array<number | null>> = {};
    const emaRel: Record<string, Array<number | null>> = {};
    const bollRelUpper: Record<string, Array<number | null>> = {};
    const bollRelLower: Record<string, Array<number | null>> = {};

    coinKeys.forEach((key) => {
      maRel[key] = calculateMA(relativeBase, maPeriod, key);
      const emaSeeded = relativeBase.map((entry, idx) => ({ ...entry, [`ema_${key}`]: maRel[key][idx] }));
      emaRel[key] = calculateEMA(emaSeeded, emaPeriod, key);
      const boll = calculateBoll(relativeBase, bollPeriod, key);
      bollRelUpper[key] = boll.map((b) => b.upper);
      bollRelLower[key] = boll.map((b) => b.lower);
    });

    const relative = relativeBase.map((item, index) => {
      const indicatorFields = coinKeys.reduce((acc, key) => {
        acc[`ma_${key}`] = maRel[key][index];
        acc[`ema_${key}`] = emaRel[key][index];
        acc[`boll_upper_${key}`] = bollRelUpper[key][index];
        acc[`boll_lower_${key}`] = bollRelLower[key][index];
        return acc;
      }, {} as Record<string, number | null>);

      return {
        ...item,
        ...indicatorFields,
      };
    });

    return { absolute, relative };
  }, [snapshots, maPeriod]);

  const comparison = useMemo(() => {
    if (!snapshots.length) return null;

    // Reuse normalized, oldest→newest ordering without sampling for accuracy
    const normalized = snapshots
      .map((snap) => ({
        ...snap,
        price: sanitizePriceValue(snap.price),
        pump_price: sanitizePriceValue(snap.pump_price),
        sol_price: sanitizePriceValue(snap.sol_price),
        btc_price: sanitizePriceValue(snap.btc_price),
      }))
      .filter((s) => [s.price, s.pump_price, s.sol_price, s.btc_price].some((v) => typeof v === 'number'))
      .reverse();

    if (normalized.length < 2) return null;

    const mid = Math.floor(normalized.length / 2);
    const firstHalf = normalized.slice(0, mid);
    const secondHalf = normalized.slice(mid);

    const avg = (arr: typeof normalized, key: string) => {
      const vals = arr.map((item) => (item as any)[key]).filter((v) => typeof v === 'number') as number[];
      if (!vals.length) return null;
      const sum = vals.reduce((a, b) => a + b, 0);
      return sum / vals.length;
    };

    const coins = COINS.map((c) => c.key);
    const result: Record<string, { prev: number | null; next: number | null }> = {};
    coins.forEach((key) => {
      result[key] = {
        prev: avg(firstHalf, key),
        next: avg(secondHalf, key),
      };
    });

    return result;
  }, [snapshots]);

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

  const displayData = useMemo(() => {
    if (!zoomDomain) return activeData;
    return activeData.slice(zoomDomain.left, zoomDomain.right + 1);
  }, [activeData, zoomDomain]);

  const computeDomain = (data: any[], keys: string[]): [number | 'auto', number | 'auto'] => {
    const values = data
      .flatMap((item) => keys.map((key) => item[key]))
      .filter((v) => typeof v === 'number') as number[];

    if (!values.length) return ['auto', 'auto'];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min;
    const padding = span === 0 ? Math.max(Math.abs(min) * 0.05, 0.0001) : span * 0.1;

    return [min - padding, max + padding];
  };

  const yDomains = useMemo<Record<string, [number | 'auto', number | 'auto']>>(() => {
    const axes = isRelative
      ? {
          left: ['price', 'pump_price'],
          right: ['sol_price', 'btc_price'],
        }
      : {
          left: ['price', 'pump_price'],
          sol_price: ['sol_price'],
          btc_price: ['btc_price'],
        };

    return Object.entries(axes).reduce((acc, [axis, keys]) => {
      acc[axis] = computeDomain(displayData, keys);
      return acc;
    }, {} as Record<string, [number | 'auto', number | 'auto']>);
  }, [displayData, isRelative]);

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

  const formatAvgPrice = (key: string, value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '-';
    if (key === 'btc_price') return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    if (value < 1) return `$${value.toFixed(6)}`;
    return `$${value.toFixed(4)}`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-xs text-muted-foreground mb-2">{payload[0]?.payload?.fullDate}</p>
          {payload.map((entry: any) => {
            const isMA = entry.dataKey?.startsWith('ma_');
            const isEMA = entry.dataKey?.startsWith('ema_');
            const isBollUpper = entry.dataKey?.startsWith('boll_upper_');
            const isBollLower = entry.dataKey?.startsWith('boll_lower_');
            const baseKey = entry.dataKey
              ?.replace('ma_', '')
              ?.replace('ema_', '')
              ?.replace('boll_upper_', '')
              ?.replace('boll_lower_', '');

            const coin = COINS.find((c) => c.key === entry.dataKey);
            const baseCoin = COINS.find((c) => c.key === baseKey);

            if (!coin && !baseCoin) return null;
            if (isMA && !showMA) return null;
            if (isEMA && !showEMA) return null;
            if ((isBollUpper || isBollLower) && !showBoll) return null;

            let color: string | undefined = (coin || baseCoin)?.color;
            if (isMA) color = getIndicatorColor('ma', color || '#888');
            if (isEMA) color = getIndicatorColor('ema', color || '#888');
            if (isBollUpper || isBollLower) color = getIndicatorColor('boll', color || '#888');
            let labelText = baseCoin?.name ?? '';
            if (isMA) labelText += ` MA(${maPeriod})`;
            if (isEMA) labelText += ` EMA(${emaPeriod})`;
            if (isBollUpper) labelText += ' Bollinger Upper';
            if (isBollLower) labelText += ' Bollinger Lower';
            if (!isMA && !isEMA && !isBollUpper && !isBollLower) labelText = coin?.name ?? '';

            return (
              <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color, opacity: isBollUpper || isBollLower ? 0.5 : 1 }}
                />
                <span className="text-muted-foreground">{labelText}:</span>
                <span className="font-mono font-medium">{formatTooltipValue(baseKey, entry.value)}</span>
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

            {/* Indicator toggles (auto periods) */}
            <div className="flex items-center gap-3 flex-nowrap whitespace-nowrap">
              <span className="text-muted-foreground">技术指标:</span>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <Checkbox
                  checked={showMA}
                  onCheckedChange={(v) => setShowMA(!!v)}
                  className="h-4 w-4"
                />
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getIndicatorColor('ma', '#8B5CF6') }}
                />
                <span className="text-xs font-medium text-muted-foreground">MA({maPeriod})</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <Checkbox
                  checked={showEMA}
                  onCheckedChange={(v) => setShowEMA(!!v)}
                  className="h-4 w-4"
                />
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getIndicatorColor('ema', '#F472B6') }}
                />
                <span className="text-xs font-medium text-muted-foreground">EMA({emaPeriod})</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <Checkbox
                  checked={showBoll}
                  onCheckedChange={(v) => setShowBoll(!!v)}
                  className="h-4 w-4"
                />
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getIndicatorColor('boll', '#9CA3AF') }}
                />
                <span className="text-xs font-medium text-muted-foreground">BOLL({bollPeriod})</span>
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
                domain={yDomains.left}
              />
              {isRelative ? (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatYAxis(v, 'btc_price')}
                  domain={yDomains.right}
                />
              ) : (
                <>
                  <YAxis
                    yAxisId="sol_price"
                    orientation="right"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatYAxis(v, 'sol_price')}
                    domain={yDomains.sol_price}
                    width={40}
                  />
                  <YAxis
                    yAxisId="btc_price"
                    orientation="right"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatYAxis(v, 'btc_price')}
                    domain={yDomains.btc_price}
                    width={40}
                  />
                </>
              )}
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
              
              {COINS.filter((coin) => visibleCoins[coin.key]).map((coin) => (
                <Line
                  key={coin.key}
                  yAxisId={getAxisId(coin.key, isRelative)}
                  type="monotone"
                  dataKey={coin.key}
                  stroke={coin.color}
                  strokeWidth={2}
                  dot={false}
                  name={coin.name}
                />
              ))}

              {/* Moving Averages per coin (auto period, toggle) */}
              {showMA && COINS.filter((coin) => visibleCoins[coin.key]).map((coin) => (
                <Line
                  key={`ma-${coin.key}`}
                  yAxisId={getAxisId(coin.key, isRelative)}
                  type="monotone"
                  dataKey={`ma_${coin.key}`}
                  stroke={getIndicatorColor('ma', coin.color)}
                  strokeWidth={1.25}
                  strokeDasharray="6 6"
                  dot={false}
                  name={`${coin.name} MA(${maPeriod})`}
                  connectNulls
                  opacity={0.9}
                />
              ))}

              {/* EMA per coin */}
              {showEMA && COINS.filter((coin) => visibleCoins[coin.key]).map((coin) => (
                <Line
                  key={`ema-${coin.key}`}
                  yAxisId={getAxisId(coin.key, isRelative)}
                  type="monotone"
                  dataKey={`ema_${coin.key}`}
                  stroke={getIndicatorColor('ema', coin.color)}
                  strokeWidth={1.25}
                  strokeDasharray="3 3"
                  dot={false}
                  name={`${coin.name} EMA(${emaPeriod})`}
                  connectNulls
                  opacity={0.9}
                />
              ))}

              {/* Bollinger Bands per coin */}
              {showBoll && COINS.filter((coin) => visibleCoins[coin.key]).flatMap((coin) => ([
                <Line
                  key={`boll-upper-${coin.key}`}
                  yAxisId={getAxisId(coin.key, isRelative)}
                  type="monotone"
                  dataKey={`boll_upper_${coin.key}`}
                  stroke={getIndicatorColor('boll', coin.color)}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                  name={`${coin.name} Boll Upper`}
                  connectNulls
                  opacity={0.4}
                />,
                <Line
                  key={`boll-lower-${coin.key}`}
                  yAxisId={getAxisId(coin.key, isRelative)}
                  type="monotone"
                  dataKey={`boll_lower_${coin.key}`}
                  stroke={getIndicatorColor('boll', coin.color)}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                  name={`${coin.name} Boll Lower`}
                  connectNulls
                  opacity={0.4}
                />,
              ]))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            暂无数据
          </div>
        )}
      </div>

      {/* Period Comparison */}
      {comparison && (
        <div className="mt-6">
          <div className="mb-3 text-sm text-muted-foreground">环比分析（前半段 vs 后半段）</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {COINS.map((coin) => {
              const data = comparison[coin.key];
              if (!data) return null;
              return (
                <div key={coin.key} className="rounded-lg border border-border bg-muted/40 p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: coin.color }} />
                    <span>{coin.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>前期均价:</span>
                    <span className="font-mono text-foreground">{formatAvgPrice(coin.key, data.prev)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>后期均价:</span>
                    <span className="font-mono text-foreground">{formatAvgPrice(coin.key, data.next)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

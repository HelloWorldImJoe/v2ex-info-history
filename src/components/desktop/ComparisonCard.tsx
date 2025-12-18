import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatPrice, formatPercent } from '@/hooks/useV2exData';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import type { HodlSnapshot } from '@/hooks/useV2exData';

interface ComparisonCardProps {
  snapshots: HodlSnapshot[];
  className?: string;
}

interface CoinComparison {
  key: string;
  name: string;
  color: string;
  firstHalfAvg: number | null;
  secondHalfAvg: number | null;
  change: number | null;
}

export default function ComparisonCard({ snapshots, className }: ComparisonCardProps) {
  const comparisons = useMemo((): CoinComparison[] => {
    if (snapshots.length < 10) return [];

    // Get data for the last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

    const last30Days = snapshots.filter(
      (s) => new Date(s.created_at) >= thirtyDaysAgo
    );

    const firstHalf = last30Days.filter(
      (s) => new Date(s.created_at) < fifteenDaysAgo
    );
    const secondHalf = last30Days.filter(
      (s) => new Date(s.created_at) >= fifteenDaysAgo
    );

    const calculateAvg = (data: HodlSnapshot[], key: keyof HodlSnapshot) => {
      const values = data
        .map((d) => d[key])
        .filter((v): v is number => typeof v === 'number');
      if (values.length === 0) return null;
      return values.reduce((a, b) => a + b, 0) / values.length;
    };

    const coins = [
      { key: 'price', name: '$V2EX', color: '#3B82F6' },
      { key: 'pump_price', name: 'PUMP', color: '#F97316' },
      { key: 'sol_price', name: 'SOL', color: '#14B8A6' },
      { key: 'btc_price', name: 'BTC', color: '#EAB308' },
    ];

    return coins.map((coin) => {
      const firstHalfAvg = calculateAvg(firstHalf, coin.key as keyof HodlSnapshot);
      const secondHalfAvg = calculateAvg(secondHalf, coin.key as keyof HodlSnapshot);
      
      let change: number | null = null;
      if (firstHalfAvg && secondHalfAvg && firstHalfAvg !== 0) {
        change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
      }

      return {
        ...coin,
        firstHalfAvg,
        secondHalfAvg,
        change,
      };
    });
  }, [snapshots]);

  if (comparisons.length === 0) {
    return null;
  }

  return (
    <div className={cn('bg-card border border-border rounded-lg p-5', className)}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">环比分析（前15天 vs 后15天）</h3>
        <p className="text-sm text-muted-foreground mt-1">
          近30天价格变化对比
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {comparisons.map((coin) => {
          const isPositive = coin.change !== null && coin.change >= 0;
          
          return (
            <div
              key={coin.key}
              className="p-4 rounded-lg bg-muted/30 border border-border/50"
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: coin.color }}
                />
                <span className="font-medium">{coin.name}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                {/* First Half */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">前期均价:</p>
                  <p className="font-mono text-sm">
                    {formatPrice(coin.firstHalfAvg)}
                  </p>
                </div>

                {/* Arrow */}
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />

                {/* Second Half */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">后期均价:</p>
                  <p className="font-mono text-sm">
                    {formatPrice(coin.secondHalfAvg)}
                  </p>
                </div>
              </div>

              {/* Change Badge */}
              {coin.change !== null && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div
                    className={cn(
                      'flex items-center justify-center gap-1 py-1.5 rounded-md text-sm font-mono font-medium',
                      isPositive
                        ? 'text-trend-up bg-trend-up'
                        : 'text-trend-down bg-trend-down'
                    )}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {formatPercent(coin.change)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

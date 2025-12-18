import { cn } from '@/lib/utils';
import { formatPrice, formatPercent } from '@/hooks/useV2exData';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PriceCardProps {
  name: string;
  symbol: string;
  price: number | undefined | null;
  change24h?: number | null;
  color: string;
  className?: string;
}

export default function PriceCard({
  name,
  symbol,
  price,
  change24h,
  color,
  className,
}: PriceCardProps) {
  const hasChange = change24h !== undefined && change24h !== null;
  const isPositive = hasChange && change24h >= 0;

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-lg p-5 hover:shadow-md transition-all duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="font-semibold">{symbol}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{name}</p>
        </div>
        
        {hasChange && (
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono font-medium',
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
            {formatPercent(change24h)}
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-2xl font-bold font-mono tracking-tight">
          {formatPrice(price)}
        </p>
      </div>
    </div>
  );
}

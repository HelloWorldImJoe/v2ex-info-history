import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number | null;
  icon?: LucideIcon;
  iconColor?: string;
  className?: string;
  delay?: number;
}

export default function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'text-primary',
  className,
  delay = 0,
}: StatsCardProps) {
  const hasChange = change !== undefined && change !== null;
  const isPositive = hasChange && change >= 0;

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-lg p-5 hover:shadow-md transition-shadow duration-200',
        className
      )}
      style={{ animationDelay: `${delay * 100}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold font-mono tracking-tight">{value}</p>
        </div>
        {Icon && (
          <div className={cn('p-2 rounded-lg bg-muted/50', iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      
      {hasChange && (
        <div className="mt-3 flex items-center gap-1">
          <span
            className={cn(
              'text-xs font-mono font-medium px-1.5 py-0.5 rounded',
              isPositive
                ? 'text-trend-up bg-trend-up'
                : 'text-trend-down bg-trend-down'
            )}
          >
            {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}

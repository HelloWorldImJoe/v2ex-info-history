import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, Wallet, Diamond, ArrowUp, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

interface StatsCardProps {
  label: string;
  value: string;
  trend?: number;
  trendDirection?: 'up' | 'down';
  icon?: 'users' | 'wallet' | 'diamond' | 'trending-up';
  color?: string;
  onClick?: () => void;
}

const iconMap = {
  users: Users,
  wallet: Wallet,
  diamond: Diamond,
  'trending-up': ArrowUp,
};

export function StatsCard({
  label,
  value,
  trend,
  trendDirection = 'up',
  icon = 'users',
  color = 'hsl(var(--primary))',
  onClick,
}: StatsCardProps) {
  const Icon = iconMap[icon];
  const isPositive = trendDirection === 'up';
  const [isUpdating, setIsUpdating] = useState(false);
  const [changeDirection, setChangeDirection] = useState<'up' | 'down' | null>(null);
  const [changeDelta, setChangeDelta] = useState<number>(0);
  const prevValueRef = useRef<string>(value);

  // Detect value change and direction
  useEffect(() => {
    const prevValue = prevValueRef.current;
    
    // Extract numeric value for comparison
    const parseNumericValue = (str: string) => {
      const numStr = str.replace(/[^0-9.]/g, '');
      return parseFloat(numStr);
    };
    
    const currentNum = parseNumericValue(value);
    const prevNum = parseNumericValue(prevValue);
    
    // Only trigger animation if value actually changed
    if (currentNum !== prevNum && !isNaN(currentNum) && !isNaN(prevNum)) {
      const delta = currentNum - prevNum;
      setIsUpdating(true);
      setChangeDirection(currentNum > prevNum ? 'up' : 'down');
      setChangeDelta(Math.abs(delta));
      
      const timer = setTimeout(() => {
        setIsUpdating(false);
        setChangeDirection(null);
        setChangeDelta(0);
      }, 1500);
      
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    } else {
      prevValueRef.current = value;
    }
  }, [value]);

  return (
    <Card 
      className={cn(
        "border-border/40 shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/20",
        onClick && "cursor-pointer hover:scale-[1.02]"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">{label}</p>
            <div className="flex items-center gap-2">
              <p className={cn(
                "text-3xl font-bold transition-all duration-300",
                isUpdating && changeDirection === 'up' && "text-green-600 scale-105",
                isUpdating && changeDirection === 'down' && "text-red-600 scale-105"
              )}>{value}</p>
              
              {/* Change direction indicator - only show when updating */}
              {isUpdating && changeDirection && (
                <div 
                  className={cn(
                    "flex items-center gap-1 animate-in fade-in slide-in-from-bottom-2 duration-300",
                    changeDirection === 'up' ? "text-green-600" : "text-red-600"
                  )}
                >
                  {changeDirection === 'up' ? (
                    <ChevronUp className="h-6 w-6 animate-bounce" />
                  ) : (
                    <ChevronDown className="h-6 w-6 animate-bounce" />
                  )}
                  <span className="text-sm font-semibold">
                    {changeDirection === 'up' ? '+' : '-'}{changeDelta.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            
            {trend !== undefined && (
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium mt-1",
                isPositive ? "text-green-600" : "text-red-600"
              )}>
                {isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{isPositive ? '+' : ''}{trend}%</span>
              </div>
            )}
          </div>
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="h-6 w-6" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

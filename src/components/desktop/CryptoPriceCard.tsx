import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CryptoPrice } from "@/lib/v2exService";
import { useEffect, useState, useRef } from "react";

interface CryptoPriceCardProps {
  crypto: CryptoPrice;
  onClick?: () => void;
}

export function CryptoPriceCard({ crypto, onClick }: CryptoPriceCardProps) {
  const isPositive = crypto.changeDirection === 'up';
  const [isUpdating, setIsUpdating] = useState(false);
  const [changeDirection, setChangeDirection] = useState<'up' | 'down' | null>(null);
  const [changeDelta, setChangeDelta] = useState<string>('');
  const prevPriceRef = useRef<string>(crypto.price);

  // Detect price change and direction
  useEffect(() => {
    const prevPrice = prevPriceRef.current;
    
    // Extract numeric value for comparison
    const parseNumericValue = (str: string) => {
      const numStr = str.replace(/[^0-9.]/g, '');
      return parseFloat(numStr);
    };
    
    const currentNum = parseNumericValue(crypto.price);
    const prevNum = parseNumericValue(prevPrice);
    
    // Only trigger animation if price actually changed
    if (currentNum !== prevNum && !isNaN(currentNum) && !isNaN(prevNum)) {
      const delta = Math.abs(currentNum - prevNum);
      // Extract currency symbol from price string
      const currencySymbol = crypto.price.match(/[^0-9.]/)?.[0] || '';
      const formattedDelta = delta < 0.01 
        ? delta.toFixed(4) 
        : delta < 1 
        ? delta.toFixed(3) 
        : delta.toFixed(2);
      
      setIsUpdating(true);
      setChangeDirection(currentNum > prevNum ? 'up' : 'down');
      setChangeDelta(`${currencySymbol}${formattedDelta}`);
      
      const timer = setTimeout(() => {
        setIsUpdating(false);
        setChangeDirection(null);
        setChangeDelta('');
      }, 1500);
      
      prevPriceRef.current = crypto.price;
      return () => clearTimeout(timer);
    } else {
      prevPriceRef.current = crypto.price;
    }
  }, [crypto.price]);

  return (
    <Card 
      className={cn(
        "border-border/40 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-primary/30 hover:-translate-y-0.5",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{crypto.symbol}</h3>
              <p className="text-xs text-muted-foreground">{crypto.name}</p>
            </div>
            <div
              className={cn(
                "px-2.5 py-1 rounded-md text-sm font-medium flex items-center gap-1",
                isPositive
                  ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {isPositive ? '+' : ''}{crypto.change24h}%
            </div>
          </div>

          <div className="flex items-center gap-2">
            <p className={cn(
              "text-2xl font-bold transition-all duration-300",
              isUpdating && changeDirection === 'up' && "text-green-600 scale-105",
              isUpdating && changeDirection === 'down' && "text-red-600 scale-105"
            )}>{crypto.price}</p>
            
            {/* Change direction indicator - only show when updating */}
            {isUpdating && changeDirection && (
              <div 
                className={cn(
                  "flex items-center gap-1 animate-in fade-in slide-in-from-bottom-2 duration-300",
                  changeDirection === 'up' ? "text-green-600" : "text-red-600"
                )}
              >
                {changeDirection === 'up' ? (
                  <ChevronUp className="h-5 w-5 animate-bounce" />
                ) : (
                  <ChevronDown className="h-5 w-5 animate-bounce" />
                )}
                <span className="text-sm font-semibold">
                  {changeDirection === 'up' ? '+' : '-'}{changeDelta}
                </span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">24h 成交量</span>
              <span className="font-medium">{crypto.volume24h}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

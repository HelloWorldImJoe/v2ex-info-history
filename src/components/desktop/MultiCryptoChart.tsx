import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { MultiCryptoTrendData } from "@/lib/v2exService";

interface MultiCryptoChartProps {
  data: MultiCryptoTrendData;
  onTimeRangeChange?: (days: 7 | 30 | 90) => void;
  selectedTimeRange?: 7 | 30 | 90;
}

export function MultiCryptoChart({ 
  data, 
  onTimeRangeChange,
  selectedTimeRange = 30 
}: MultiCryptoChartProps) {
  const { history, cryptos } = data;
  
  // Visible cryptos state
  const [visibleCryptos, setVisibleCryptos] = useState<Record<string, boolean>>({
    V2EX: true,
    PUMP: true,
    SOL: true,
    BTC: true,
  });

  // Calculate price changes for analysis
  const calculatePriceChange = (symbol: string) => {
    const dataKey = symbol.replace('$', '');
    if (history.length < 2) return { change: 0, changePercent: 0 };
    
    const latestPrice = history[history.length - 1][dataKey as keyof typeof history[0]] as number;
    const oldestPrice = history[0][dataKey as keyof typeof history[0]] as number;
    const change = latestPrice - oldestPrice;
    const changePercent = ((change / oldestPrice) * 100);
    
    return { change, changePercent };
  };

  // Calculate period-over-period comparison
  const calculatePeriodComparison = (symbol: string) => {
    const dataKey = symbol.replace('$', '');
    const midPoint = Math.floor(history.length / 2);
    
    if (history.length < 2) return { previousPeriod: 0, currentPeriod: 0, comparison: 0 };
    
    // Previous period average
    const previousPeriodData = history.slice(0, midPoint);
    const previousPeriodAvg = previousPeriodData.reduce((sum, point) => 
      sum + (point[dataKey as keyof typeof point] as number), 0) / previousPeriodData.length;
    
    // Current period average
    const currentPeriodData = history.slice(midPoint);
    const currentPeriodAvg = currentPeriodData.reduce((sum, point) => 
      sum + (point[dataKey as keyof typeof point] as number), 0) / currentPeriodData.length;
    
    const comparison = ((currentPeriodAvg - previousPeriodAvg) / previousPeriodAvg) * 100;
    
    return { 
      previousPeriod: previousPeriodAvg, 
      currentPeriod: currentPeriodAvg, 
      comparison 
    };
  };

  const toggleCrypto = (symbol: string) => {
    const key = symbol.replace('$', '');
    setVisibleCryptos(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">{label}</p>
          {payload
            .filter((entry: any) => visibleCryptos[entry.dataKey as keyof typeof visibleCryptos])
            .map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{entry.name}:</span>
                <span className="font-semibold">${entry.value}</span>
              </div>
            ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-border/40 shadow-sm">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>多币种价格趋势对比</CardTitle>
          
          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">时间范围:</span>
            {[7, 30, 90].map((days) => (
              <Button
                key={days}
                variant={selectedTimeRange === days ? "default" : "outline"}
                size="sm"
                onClick={() => onTimeRangeChange?.(days as 7 | 30 | 90)}
                className="px-3"
              >
                {days}天
              </Button>
            ))}
          </div>
        </div>

        {/* Crypto Toggle Controls */}
        <div className="flex flex-wrap items-center gap-4 pt-4">
          <span className="text-sm text-muted-foreground">显示币种:</span>
          {cryptos.map((crypto) => {
            const key = crypto.symbol.replace('$', '');
            return (
              <div key={crypto.symbol} className="flex items-center gap-2">
                <Checkbox
                  id={`crypto-${key}`}
                  checked={visibleCryptos[key as keyof typeof visibleCryptos]}
                  onCheckedChange={() => toggleCrypto(crypto.symbol)}
                />
                <label
                  htmlFor={`crypto-${key}`}
                  className="text-sm font-medium cursor-pointer flex items-center gap-2"
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: crypto.color }}
                  />
                  {crypto.symbol}
                </label>
              </div>
            );
          })}
        </div>
      </CardHeader>

      <CardContent>
        {/* Chart */}
        <div className="h-[400px] w-full mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              
              {cryptos
                .filter(crypto => visibleCryptos[crypto.symbol.replace('$', '') as keyof typeof visibleCryptos])
                .map((crypto) => {
                  const dataKey = crypto.symbol.replace('$', '');
                  return (
                    <Line
                      key={crypto.symbol}
                      type="monotone"
                      dataKey={dataKey}
                      name={crypto.symbol}
                      stroke={crypto.color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  );
                })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Price Analysis Section */}
        <div className="space-y-6">
          {/* Current Prices */}
          <div>
            <h3 className="text-sm font-semibold mb-3">当前价格</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {cryptos.map((crypto) => {
                const { change, changePercent } = calculatePriceChange(crypto.symbol);
                const isPositive = change >= 0;
                
                return (
                  <div 
                    key={crypto.symbol} 
                    className="border border-border/40 rounded-lg p-3 space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: crypto.color }}
                      />
                      <p className="text-sm font-medium">{crypto.symbol}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{crypto.name}</p>
                    <p className="text-lg font-bold">
                      ${crypto.symbol === 'BTC' 
                        ? crypto.currentPrice.toLocaleString() 
                        : crypto.currentPrice.toFixed(crypto.symbol === 'SOL' ? 2 : 4)}
                    </p>
                    <div className={`flex items-center gap-1 text-xs font-medium ${
                      isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Period-over-Period Comparison */}
          <div>
            <h3 className="text-sm font-semibold mb-3">
              环比分析（前{selectedTimeRange / 2}天 vs 后{selectedTimeRange / 2}天）
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {cryptos.map((crypto) => {
                const { previousPeriod, currentPeriod, comparison } = calculatePeriodComparison(crypto.symbol);
                const isPositive = comparison >= 0;
                
                return (
                  <div 
                    key={crypto.symbol}
                    className="border border-border/40 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: crypto.color }}
                      />
                      <p className="text-sm font-medium">{crypto.symbol}</p>
                    </div>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">前期均价:</span>
                        <span className="font-medium">
                          ${crypto.symbol === 'BTC' 
                            ? previousPeriod.toFixed(0) 
                            : previousPeriod.toFixed(crypto.symbol === 'SOL' ? 2 : 4)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">后期均价:</span>
                        <span className="font-medium">
                          ${crypto.symbol === 'BTC' 
                            ? currentPeriod.toFixed(0) 
                            : currentPeriod.toFixed(crypto.symbol === 'SOL' ? 2 : 4)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-border/50">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">环比变化:</span>
                          <span className={`font-semibold flex items-center gap-1 ${
                            isPositive ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {isPositive ? '+' : ''}{comparison.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

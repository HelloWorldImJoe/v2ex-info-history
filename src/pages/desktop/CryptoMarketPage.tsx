import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { CryptoPriceCard } from "@/components/desktop/CryptoPriceCard";
import { TrendChart } from "@/components/desktop/TrendChart";
import { MultiCryptoChart } from "@/components/desktop/MultiCryptoChart";
import {
  getCryptoPrices,
  getCryptoTrendData,
  getMultiCryptoTrendData,
  type PriceTrendData,
} from "@/lib/v2exService";

export default function CryptoMarketPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);
  
  // Trend chart state
  const [trendChartOpen, setTrendChartOpen] = useState(false);
  const [trendChartData, setTrendChartData] = useState<PriceTrendData | null>(null);

  const cryptoPrices = getCryptoPrices();
  const multiCryptoTrendData = getMultiCryptoTrendData(timeRange);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleTimeRangeChange = (days: 7 | 30 | 90) => {
    setTimeRange(days);
  };

  const handleCryptoClick = (symbol: string) => {
    const data = getCryptoTrendData(symbol);
    setTrendChartData(data);
    setTrendChartOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">加密货币行情</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  实时行情监控与价格分析
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Price Cards Overview */}
          <section>
            <h2 className="text-lg font-semibold mb-4">实时行情</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {cryptoPrices.map((crypto) => (
                <CryptoPriceCard 
                  key={crypto.symbol} 
                  crypto={crypto}
                  onClick={() => handleCryptoClick(crypto.symbol)}
                />
              ))}
            </div>
          </section>

          {/* Price Analysis - Multi Crypto Chart */}
          <section>
            <h2 className="text-lg font-semibold mb-4">价格分析</h2>
            <MultiCryptoChart 
              data={multiCryptoTrendData} 
              onTimeRangeChange={handleTimeRangeChange}
              selectedTimeRange={timeRange}
            />
          </section>

          {/* Market Insights */}
          <section>
            <h2 className="text-lg font-semibold mb-4">市场洞察</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-border/40 rounded-lg p-6 bg-card">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">市场总市值</h3>
                <p className="text-2xl font-bold mb-1">$8.45M</p>
                <p className="text-xs text-green-600">24h +12.8%</p>
              </div>
              <div className="border border-border/40 rounded-lg p-6 bg-card">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">24h 总成交量</h3>
                <p className="text-2xl font-bold mb-1">$1.23M</p>
                <p className="text-xs text-green-600">相比昨日 +24.5%</p>
              </div>
              <div className="border border-border/40 rounded-lg p-6 bg-card">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">活跃交易对</h3>
                <p className="text-2xl font-bold mb-1">12</p>
                <p className="text-xs text-muted-foreground">主流交易所</p>
              </div>
            </div>
          </section>

          {/* Trading Volume Breakdown */}
          <section>
            <h2 className="text-lg font-semibold mb-4">成交量分布</h2>
            <div className="border border-border/40 rounded-lg p-6">
              <div className="space-y-4">
                {cryptoPrices.map((crypto, index) => {
                  const percentage = [45, 28, 18, 9][index];
                  return (
                    <div key={crypto.symbol} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{crypto.symbol}</span>
                          <span className="text-muted-foreground">{crypto.name}</span>
                        </div>
                        <span className="font-semibold">{percentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Trend Chart Dialog */}
      <TrendChart
        open={trendChartOpen}
        onOpenChange={setTrendChartOpen}
        data={trendChartData}
        type="price"
      />
    </div>
  );
}

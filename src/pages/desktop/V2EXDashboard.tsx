import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RefreshCw, User, ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { QuickCheckin } from "@/components/desktop/QuickCheckin";
import { StatsCard } from "@/components/desktop/StatsCard";
import { CryptoPriceCard } from "@/components/desktop/CryptoPriceCard";
import { HodlersRanking } from "@/components/desktop/HodlersRanking";
import { CheckinRanking } from "@/components/desktop/CheckinRanking";
import { HotTopics } from "@/components/desktop/HotTopics";
import { TrendChart } from "@/components/desktop/TrendChart";
import {
  getCommunityStats,
  getCryptoPrices,
  getHodlersRanking,
  getCheckinRanking,
  getHotTopics,
  getMyHodlerRank,
  getMyCheckinRank,
  getCryptoTrendData,
  getStatsTrendData,
  type PriceTrendData,
  type StatsTrendData,
} from "@/lib/v2exService";

export default function V2EXDashboard() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Trend chart state
  const [trendChartOpen, setTrendChartOpen] = useState(false);
  const [trendChartData, setTrendChartData] = useState<PriceTrendData | StatsTrendData | null>(null);
  const [trendChartType, setTrendChartType] = useState<'price' | 'stats'>('stats');

  // Real-time data state
  const [communityStats, setCommunityStats] = useState(getCommunityStats());
  const [cryptoPrices, setCryptoPrices] = useState(getCryptoPrices());
  
  const hodlersRanking = getHodlersRanking();
  const checkinRanking = getCheckinRanking();
  const hotTopics = getHotTopics();
  const myHodlerRank = getMyHodlerRank();
  const myCheckinRank = getMyCheckinRank();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update real-time data every 3 seconds
  useEffect(() => {
    const dataTimer = setInterval(() => {
      setCommunityStats(getCommunityStats());
      setCryptoPrices(getCryptoPrices());
    }, 3000);
    return () => clearInterval(dataTimer);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Update data immediately
    setCommunityStats(getCommunityStats());
    setCryptoPrices(getCryptoPrices());
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const handleStatsClick = (type: 'onlineUsers' | 'totalHolders' | 'hodlers10k' | 'marketCap') => {
    const data = getStatsTrendData(type);
    setTrendChartData(data);
    setTrendChartType('stats');
    setTrendChartOpen(true);
  };

  const handleCryptoClick = (symbol: string) => {
    const data = getCryptoTrendData(symbol);
    setTrendChartData(data);
    setTrendChartType('price');
    setTrendChartOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">V2EX 数据中心</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {formatTime(currentTime)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <QuickCheckin />
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/profile')}
                title="个人中心"
              >
                <User className="h-4 w-4" />
              </Button>
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
          {/* Stats Overview */}
          <section>
            <div 
              className="flex items-center gap-2 mb-4 cursor-pointer group w-fit"
              onClick={() => navigate('/stats')}
            >
              <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">社区统计</h2>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                label="当前在线人数"
                value={communityStats.onlineUsers.toLocaleString()}
                trend={communityStats.onlineTrend}
                trendDirection="up"
                icon="users"
                color="hsl(260, 70%, 55%)"
                onClick={() => handleStatsClick('onlineUsers')}
              />
              <StatsCard
                label="V2EX 持有人数"
                value={communityStats.totalHolders.toLocaleString()}
                trend={communityStats.holdersTrend}
                trendDirection="up"
                icon="wallet"
                color="hsl(200, 70%, 50%)"
                onClick={() => handleStatsClick('totalHolders')}
              />
              <StatsCard
                label="10k+ HODL 人数"
                value={communityStats.hodlers10k.toLocaleString()}
                trend={communityStats.hodlers10kTrend}
                trendDirection="up"
                icon="diamond"
                color="hsl(45, 90%, 55%)"
                onClick={() => handleStatsClick('hodlers10k')}
              />
              <StatsCard
                label="$V2EX 市值"
                value={communityStats.marketCap}
                trend={communityStats.marketCapTrend}
                trendDirection="up"
                icon="trending-up"
                color="hsl(140, 60%, 45%)"
                onClick={() => handleStatsClick('marketCap')}
              />
            </div>
          </section>

          {/* Crypto Prices */}
          <section>
            <div 
              className="flex items-center gap-2 mb-4 cursor-pointer group w-fit"
              onClick={() => navigate('/crypto')}
            >
              <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">加密货币行情</h2>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
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

          {/* Rankings and Hot Topics */}
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <HodlersRanking data={hodlersRanking} myRank={myHodlerRank} />
              </div>
              <div className="lg:col-span-1">
                <CheckinRanking data={checkinRanking} myRank={myCheckinRank} />
              </div>
              <div className="lg:col-span-1">
                <HotTopics data={hotTopics} />
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
        type={trendChartType}
      />
    </div>
  );
}

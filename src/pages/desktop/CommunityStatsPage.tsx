import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { StatsCard } from "@/components/desktop/StatsCard";
import { TrendChart } from "@/components/desktop/TrendChart";
import {
  getCommunityStats,
  getStatsTrendData,
  type StatsTrendData,
} from "@/lib/v2exService";

export default function CommunityStatsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Trend chart state
  const [trendChartOpen, setTrendChartOpen] = useState(false);
  const [trendChartData, setTrendChartData] = useState<StatsTrendData | null>(null);

  const communityStats = getCommunityStats();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleStatsClick = (type: 'onlineUsers' | 'totalHolders' | 'hodlers10k' | 'marketCap') => {
    const data = getStatsTrendData(type);
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
                <h1 className="text-2xl font-bold">社区统计详情</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  实时社区数据监控与分析
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
          {/* Overview Section */}
          <section>
            <h2 className="text-lg font-semibold mb-4">核心指标概览</h2>
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

          {/* Detailed Charts Section */}
          <section>
            <h2 className="text-lg font-semibold mb-4">详细趋势分析</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Online Users Trend */}
              <div className="border border-border/40 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-base font-semibold mb-4 text-primary">在线人数趋势</h3>
                <div className="space-y-3">
                  <div className="flex items-baseline gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">当前在线</p>
                      <p className="text-3xl font-bold">{communityStats.onlineUsers.toLocaleString()}</p>
                    </div>
                    <div className="text-green-600 text-sm font-medium">
                      +{communityStats.onlineTrend}%
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    相比昨日同期增长 {communityStats.onlineTrend}%，社区活跃度持续上升
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-4"
                    onClick={() => handleStatsClick('onlineUsers')}
                  >
                    查看详细趋势图
                  </Button>
                </div>
              </div>

              {/* Holders Trend */}
              <div className="border border-border/40 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-base font-semibold mb-4 text-primary">持有人数趋势</h3>
                <div className="space-y-3">
                  <div className="flex items-baseline gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">总持有人</p>
                      <p className="text-3xl font-bold">{communityStats.totalHolders.toLocaleString()}</p>
                    </div>
                    <div className="text-green-600 text-sm font-medium">
                      +{communityStats.holdersTrend}%
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    本月新增 {Math.floor(communityStats.totalHolders * communityStats.holdersTrend / 100)} 名持有者
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-4"
                    onClick={() => handleStatsClick('totalHolders')}
                  >
                    查看详细趋势图
                  </Button>
                </div>
              </div>

              {/* 10k+ Holders Trend */}
              <div className="border border-border/40 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-base font-semibold mb-4 text-primary">大户（10k+）趋势</h3>
                <div className="space-y-3">
                  <div className="flex items-baseline gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">10k+ 持有者</p>
                      <p className="text-3xl font-bold">{communityStats.hodlers10k.toLocaleString()}</p>
                    </div>
                    <div className="text-green-600 text-sm font-medium">
                      +{communityStats.hodlers10kTrend}%
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    占总持有人数的 {((communityStats.hodlers10k / communityStats.totalHolders) * 100).toFixed(1)}%
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-4"
                    onClick={() => handleStatsClick('hodlers10k')}
                  >
                    查看详细趋势图
                  </Button>
                </div>
              </div>

              {/* Market Cap Trend */}
              <div className="border border-border/40 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-base font-semibold mb-4 text-primary">市值趋势</h3>
                <div className="space-y-3">
                  <div className="flex items-baseline gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">当前市值</p>
                      <p className="text-3xl font-bold">{communityStats.marketCap}</p>
                    </div>
                    <div className="text-green-600 text-sm font-medium">
                      +{communityStats.marketCapTrend}%
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    本月市值增长 {communityStats.marketCapTrend}%，生态持续发展
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-4"
                    onClick={() => handleStatsClick('marketCap')}
                  >
                    查看详细趋势图
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Additional Insights */}
          <section>
            <h2 className="text-lg font-semibold mb-4">社区洞察</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-border/40 rounded-lg p-6 bg-card">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">活跃度指数</h3>
                <p className="text-2xl font-bold mb-1">87.5</p>
                <p className="text-xs text-green-600">相比上周 +5.2</p>
              </div>
              <div className="border border-border/40 rounded-lg p-6 bg-card">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">平均持仓</h3>
                <p className="text-2xl font-bold mb-1">12,456 V币</p>
                <p className="text-xs text-green-600">相比上月 +8.3%</p>
              </div>
              <div className="border border-border/40 rounded-lg p-6 bg-card">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">签到参与率</h3>
                <p className="text-2xl font-bold mb-1">68.4%</p>
                <p className="text-xs text-green-600">相比上周 +3.1%</p>
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
        type="stats"
      />
    </div>
  );
}

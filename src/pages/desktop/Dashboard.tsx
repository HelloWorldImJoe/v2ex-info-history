import { useEffect, useMemo, useState } from 'react';
import { useV2exData, DataRange } from '@/hooks/useV2exData';
import Header from '@/components/desktop/Header';
import PriceChart from '@/components/desktop/PriceChart';
import CommunityMetricsChart from '@/components/desktop/CommunityMetricsChart';
import AmmLiquidityChart from '@/components/desktop/AmmLiquidityChart';
import OnlineUsersChart from '@/components/desktop/OnlineUsersChart';
import HolderChanges from '@/components/desktop/HolderChanges';
import { Skeleton } from '@/components/ui/skeleton';

type RangeOption = '3d' | '7d' | '30d' | '90d' | 'all';
const COMMUNITY_METRIC_KEYS = [
  'holders',
  'hodl_10k_addresses_count',
  'new_accounts_via_solana',
  'total_solana_addresses_linked',
  'main_amm_v2ex_amount',
  'main_amm_sol_amount',
  'sol_tip_operations_count',
  'member_tips_sent',
  'member_tips_received',
  'total_sol_tip_amount',
  'v2ex_token_tip_count',
  'total_v2ex_token_tip_amount',
] as const;
type CommunityMetricKey = (typeof COMMUNITY_METRIC_KEYS)[number];

const formatCompactAmount = (value: number | undefined | null) => {
  if (value === undefined || value === null) return '-';

  const abs = Math.abs(value);
  if (abs >= 100000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 10000) {
    return `${(value / 1_000).toFixed(2)}k`;
  }

  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

export default function Dashboard() {
  const [rangeOption, setRangeOption] = useState<RangeOption>('3d');
  const [fetchDays, setFetchDays] = useState<number>(3);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleRangeOptionChange = (opt: RangeOption) => {
    let days =
      opt === '3d'
        ? 3
        : opt === '7d'
          ? 7
          : opt === '30d'
            ? 30
            : opt === '90d'
              ? 90
              : 3650; // 足够覆盖全部历史数据，实际请求会因缺失天数停止
    days += 1;
    const needsFetch = days > fetchDays;

    if ((opt === '30d' || opt === '90d' || opt === 'all') && needsFetch) {
      const confirmed = window.confirm('数据量较大，加载可能需要一些时间，确定继续吗？');
      if (!confirmed) return;
    }

    setRangeOption(opt);

    // Only trigger a fetch when expanding the window; shrinking reuses existing data
    if (needsFetch) {
      setIsSwitching(true);
      setFetchDays(days);
    } else {
      setIsSwitching(false);
    }
  };

  const dataRange: DataRange = useMemo(() => ({ type: 'preset', days: fetchDays }), [fetchDays]);

  const { data, loading, error, refresh, latestSnapshot, currentFetchingDate } = useV2exData(dataRange);

  useEffect(() => {
    if (!loading) {
      setIsSwitching(false);
    }
  }, [loading]);

  const displaySnapshots = useMemo(() => {
    if (rangeOption === 'all') {
      return data.snapshots;
    }

    const days = rangeOption === '3d' ? 3 : rangeOption === '7d' ? 7 : rangeOption === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (days - 1));
    return data.snapshots.filter((s) => new Date(s.created_at) >= cutoff);
  }, [data.snapshots, rangeOption]);

  const displayAddressChanges = useMemo(() => {
    if (rangeOption === 'all') {
      return data.addressDetails;
    }

    const days = rangeOption === '3d' ? 3 : rangeOption === '7d' ? 7 : rangeOption === '30d' ? 30 : 90;
    const now = new Date();
    const cutoffDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    cutoffDate.setUTCDate(cutoffDate.getUTCDate() - (days - 1));

    return data.addressDetails.filter((c) => new Date(c.changed_at).getTime() >= cutoffDate.getTime());
  }, [data.addressDetails, rangeOption]);

  const displayRemovedAddresses = useMemo(() => {
    if (rangeOption === 'all') {
      return data.addressesRemoved;
    }

    const days = rangeOption === '3d' ? 3 : rangeOption === '7d' ? 7 : rangeOption === '30d' ? 30 : 90;
    const now = new Date();
    const cutoffDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    cutoffDate.setUTCDate(cutoffDate.getUTCDate() - (days - 1));

    return data.addressesRemoved.filter((c) => new Date(c.removed_at).getTime() >= cutoffDate.getTime());
  }, [data.addressesRemoved, rangeOption]);

  const metricChanges = useMemo(() => {
    if (!displaySnapshots.length) return {} as Record<CommunityMetricKey, { delta: number; percent: number | null }>;

    // 找到每个指标的最新与最早可用值（兼容早期缺失字段）
    return COMMUNITY_METRIC_KEYS.reduce((acc, key) => {
      const latestWithValue = displaySnapshots.find((snap) => typeof snap?.[key] === 'number');

      // 对后添加的字段，基准从第一条非零记录开始；若找不到非零，则退回到任何有值的最早记录
      const reversed = [...displaySnapshots].reverse();
      const earliestNonZero = reversed.find((snap) => {
        const val = snap?.[key];
        return typeof val === 'number' && val !== 0;
      });
      const earliestWithValue = earliestNonZero ?? reversed.find((snap) => typeof snap?.[key] === 'number');

      const latestValue = latestWithValue?.[key];
      const earliestValue = earliestWithValue?.[key];

      if (typeof latestValue === 'number' && typeof earliestValue === 'number') {
        const delta = latestValue - earliestValue;
        const percent = earliestValue !== 0 ? (delta / earliestValue) * 100 : null;
        acc[key] = { delta, percent };
      }
      return acc;
    }, {} as Record<CommunityMetricKey, { delta: number; percent: number | null }>);
  }, [displaySnapshots]);

  const renderCommunityStat = (label: string, value: number | undefined | null, key: CommunityMetricKey) => {
    const change = metricChanges[key];
    const isPositive = !!change && change.delta > 0;
    const isNegative = !!change && change.delta < 0;

    const deltaLabel = change ? `${change.delta >= 0 ? '+' : ''}${formatCompactAmount(change.delta)}` : null;
    const percentLabel = change?.percent !== null && change?.percent !== undefined
      ? `${change.percent >= 0 ? '+' : ''}${change.percent.toFixed(2)}%`
      : null;
    const arrow = isPositive ? '↑' : isNegative ? '↓' : '';

    const toneClass = isPositive
      ? 'bg-[hsl(var(--trend-up)/0.12)] border-[hsl(var(--trend-up)/0.25)]'
      : isNegative
        ? 'bg-[hsl(var(--trend-down)/0.12)] border-[hsl(var(--trend-down)/0.25)]'
        : 'bg-muted/40 border-border';

    const badgeToneClass = isPositive
      ? 'text-[hsl(var(--trend-up))] bg-[hsl(var(--trend-up)/0.18)]'
      : isNegative
        ? 'text-[hsl(var(--trend-down))] bg-[hsl(var(--trend-down)/0.18)]'
        : 'text-muted-foreground bg-muted/70';

    const chipToneClass = isPositive
      ? 'text-[hsl(var(--trend-up))] bg-[hsl(var(--trend-up)/0.16)]'
      : isNegative
        ? 'text-[hsl(var(--trend-down))] bg-[hsl(var(--trend-down)/0.16)]'
        : 'text-muted-foreground bg-muted/70';

    return (
      <div className={`relative flex flex-col gap-2 p-4 rounded-lg border transition-colors min-h-[120px] ${toneClass}`}>
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          {percentLabel && (
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${badgeToneClass}`}
            >
              {percentLabel}
            </span>
          )}
        </div>

        <div className="flex items-end justify-between gap-2">
          <span className="text-2xl font-semibold leading-tight">{formatCompactAmount(value)}</span>
          {deltaLabel && (
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${chipToneClass}`}>
              {arrow && <span className="text-[11px]">{arrow}</span>}
              <span>{deltaLabel}</span>
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-[500px] rounded-lg" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header
        lastUpdated={data.lastUpdated}
        onRefresh={refresh}
        loading={loading}
        rangeOption={rangeOption}
        onRangeOptionChange={handleRangeOptionChange}
      />

      {(loading || isSwitching) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
            <div className="h-10 w-10 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            <span>数据加载中…</span>
            {currentFetchingDate && (
              <span className="text-xs text-muted-foreground/80">
                正在请求日期：{currentFetchingDate}
              </span>
            )}
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
            {error}
          </div>
        )}

        {loading && !data.snapshots.length ? (
          renderSkeleton()
        ) : !data.snapshots.length ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
            暂无数据，请稍后重试。
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-6 items-stretch">
              <div className="space-y-6 min-w-0">
                {/* Section: Price Analysis */}
                <section className="animate-fade-in-up-delay-1">
                  <PriceChart
                    snapshots={displaySnapshots}
                    rangeDays={
                      rangeOption === '3d'
                        ? 3
                        : rangeOption === '7d'
                          ? 7
                          : rangeOption === '30d'
                            ? 30
                            : rangeOption === '90d'
                              ? 90
                              : displaySnapshots.length || data.snapshots.length
                    }
                  />
                </section>

                {/* Section: AMM Liquidity */}
                <section className="animate-fade-in-up-delay-1">
                  <AmmLiquidityChart snapshots={displaySnapshots} />
                </section>

                {/* Section: Community Metrics */}
                <section className="animate-fade-in-up-delay-2">
                  <CommunityMetricsChart snapshots={displaySnapshots} />
                </section>

                {/* Section: Online Users */}
                <section className="animate-fade-in-up-delay-2">
                  <OnlineUsersChart snapshots={displaySnapshots} />
                </section>
              </div>

              <div className="space-y-6 min-w-0 flex flex-col h-full min-h-0">
                {/* Section: Community Stats */}
                <section className="animate-fade-in-up">
                  <div className="bg-card border border-border rounded-lg">
                    <div className="p-5 border-b border-border">
                      <h3 className="text-lg font-semibold">社区统计</h3>
                      <p className="text-sm text-muted-foreground mt-1">核心地址与流动性数据</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
                      {renderCommunityStat('持币人数', latestSnapshot?.holders, 'holders')}
                      {renderCommunityStat('10k+', latestSnapshot?.hodl_10k_addresses_count, 'hodl_10k_addresses_count')}
                      {renderCommunityStat('Sol新注册', latestSnapshot?.new_accounts_via_solana, 'new_accounts_via_solana')}
                      {renderCommunityStat('Sol新绑定', latestSnapshot?.total_solana_addresses_linked, 'total_solana_addresses_linked')}
                      {renderCommunityStat('AMM-$v2ex', latestSnapshot?.main_amm_v2ex_amount, 'main_amm_v2ex_amount')}
                      {renderCommunityStat('AMM-SOL', latestSnapshot?.main_amm_sol_amount, 'main_amm_sol_amount')}
                      {renderCommunityStat('SOL 打赏次数', latestSnapshot?.sol_tip_operations_count, 'sol_tip_operations_count')}
                      {renderCommunityStat('打赏发送会员数', latestSnapshot?.member_tips_sent, 'member_tips_sent')}
                      {renderCommunityStat('打赏获赏会员数', latestSnapshot?.member_tips_received, 'member_tips_received')}
                      {renderCommunityStat('SOL 打赏总额', latestSnapshot?.total_sol_tip_amount, 'total_sol_tip_amount')}
                      {renderCommunityStat('$V2EX 打赏次数', latestSnapshot?.v2ex_token_tip_count, 'v2ex_token_tip_count')}
                      {renderCommunityStat('$V2EX 打赏总额', latestSnapshot?.total_v2ex_token_tip_amount, 'total_v2ex_token_tip_amount')}
                    </div>
                  </div>
                </section>

                {/* Section: Holder Changes */}
                <section className="animate-fade-in-up-delay-3 flex-1 min-h-0">
                  <HolderChanges
                    changes={displayAddressChanges}
                    removed={displayRemovedAddresses}
                    className="flex-1 min-h-0"
                  />
                </section>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>
              数据来源:{' '}
              <a
                href="https://github.com/GrabCoffee/v2ex-info-newsletter-data"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                v2ex-info-newsletter-data
              </a>
            </p>
            <p>信息流动之处，机会生生不息</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

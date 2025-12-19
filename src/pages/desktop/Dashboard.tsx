import { useEffect, useMemo, useState } from 'react';
import { useV2exData, DataRange } from '@/hooks/useV2exData';
import Header from '@/components/desktop/Header';
import PriceChart from '@/components/desktop/PriceChart';
import CommunityMetricsChart from '@/components/desktop/CommunityMetricsChart';
import AmmLiquidityChart from '@/components/desktop/AmmLiquidityChart';
import OnlineUsersChart from '@/components/desktop/OnlineUsersChart';
import HolderChanges from '@/components/desktop/HolderChanges';
import { Skeleton } from '@/components/ui/skeleton';

type RangeOption = '3d' | '7d' | '30d';
const COMMUNITY_METRIC_KEYS = [
  'holders',
  'hodl_10k_addresses_count',
  'new_accounts_via_solana',
  'total_solana_addresses_linked',
  'main_amm_v2ex_amount',
  'main_amm_sol_amount',
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
    const days = opt === '3d' ? 3 : opt === '7d' ? 7 : 30;
    setRangeOption(opt);

    // Only trigger a fetch when expanding the window; shrinking reuses existing data
    if (days > fetchDays) {
      setIsSwitching(true);
      setFetchDays(days);
    } else {
      setIsSwitching(false);
    }
  };

  const dataRange: DataRange = useMemo(() => ({ type: 'preset', days: fetchDays }), [fetchDays]);

  const { data, loading, error, refresh, latestSnapshot } = useV2exData(dataRange);

  useEffect(() => {
    if (!loading) {
      setIsSwitching(false);
    }
  }, [loading]);

  const displaySnapshots = useMemo(() => {
    const days = rangeOption === '3d' ? 3 : rangeOption === '7d' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (days - 1));
    return data.snapshots.filter((s) => new Date(s.created_at) >= cutoff);
  }, [data.snapshots, rangeOption]);

  const displayAddressChanges = useMemo(() => {
    const days = rangeOption === '3d' ? 3 : rangeOption === '7d' ? 7 : 30;
    const now = new Date();
    const cutoffDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    cutoffDate.setUTCDate(cutoffDate.getUTCDate() - (days - 1));

    return data.addressDetails.filter((c) => new Date(c.changed_at).getTime() >= cutoffDate.getTime());
  }, [data.addressDetails, rangeOption]);

  const displayRemovedAddresses = useMemo(() => {
    const days = rangeOption === '3d' ? 3 : rangeOption === '7d' ? 7 : 30;
    const now = new Date();
    const cutoffDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    cutoffDate.setUTCDate(cutoffDate.getUTCDate() - (days - 1));

    return data.addressesRemoved.filter((c) => new Date(c.removed_at).getTime() >= cutoffDate.getTime());
  }, [data.addressesRemoved, rangeOption]);

  const metricChanges = useMemo(() => {
    if (!displaySnapshots.length) return {} as Record<CommunityMetricKey, { delta: number; percent: number | null }>;

    const latest = displaySnapshots[0];
    const earliest = displaySnapshots[displaySnapshots.length - 1];

    return COMMUNITY_METRIC_KEYS.reduce((acc, key) => {
      const latestValue = latest?.[key];
      const earliestValue = earliest?.[key];
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
      ? 'bg-emerald-50/80 border-emerald-200'
      : isNegative
        ? 'bg-rose-50/80 border-rose-200'
        : 'bg-muted/40 border-border';

    return (
      <div className={`relative flex flex-col gap-2 p-4 rounded-lg border transition-colors ${toneClass}`}>
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          {percentLabel && (
            <span
              className={
                isPositive
                  ? 'text-[11px] font-mono text-emerald-700 bg-emerald-500/15 px-2 py-0.5 rounded-full'
                  : isNegative
                    ? 'text-[11px] font-mono text-rose-700 bg-rose-500/15 px-2 py-0.5 rounded-full'
                    : 'text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full'
              }
            >
              {percentLabel}
            </span>
          )}
        </div>

        <div className="flex items-end justify-between gap-2">
          <span className="text-2xl font-semibold leading-tight">{formatCompactAmount(value)}</span>
          {deltaLabel && (
            <span
              className={
                isPositive
                  ? 'inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-500/15 px-2 py-1 rounded-md'
                  : isNegative
                    ? 'inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-500/15 px-2 py-1 rounded-md'
                    : 'inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md'
              }
            >
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
            <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-6 items-start">
              <div className="space-y-6 min-w-0">
                {/* Section: Price Analysis */}
                <section className="animate-fade-in-up-delay-1">
                  <PriceChart
                    snapshots={displaySnapshots}
                    rangeDays={rangeOption === '3d' ? 3 : rangeOption === '7d' ? 7 : 30}
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

              <div className="space-y-6 min-w-0">
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
                    </div>
                  </div>
                </section>

                {/* Section: Holder Changes */}
                <section className="animate-fade-in-up-delay-3">
                  <HolderChanges changes={displayAddressChanges} removed={displayRemovedAddresses} />
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

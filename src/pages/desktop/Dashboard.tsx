import { useEffect, useMemo, useState } from 'react';
import { useV2exData, formatAmount, DataRange } from '@/hooks/useV2exData';
import Header from '@/components/desktop/Header';
import PriceChart from '@/components/desktop/PriceChart';
import CommunityMetricsChart from '@/components/desktop/CommunityMetricsChart';
import AmmLiquidityChart from '@/components/desktop/AmmLiquidityChart';
import OnlineUsersChart from '@/components/desktop/OnlineUsersChart';
import HolderChanges from '@/components/desktop/HolderChanges';
import { Skeleton } from '@/components/ui/skeleton';

type RangeOption = '3d' | '7d' | '30d';

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
                  <PriceChart snapshots={displaySnapshots} />
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
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">持币人数</span>
                        <span className="text-lg font-semibold">{formatAmount(latestSnapshot?.holders)}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">10k+ 用户数</span>
                        <span className="text-lg font-semibold">{formatAmount(latestSnapshot?.hodl_10k_addresses_count)}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">Solana 创建用户数</span>
                        <span className="text-lg font-semibold">{formatAmount(latestSnapshot?.new_accounts_via_solana)}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">绑定 Solana 地址用户数</span>
                        <span className="text-lg font-semibold">{formatAmount(latestSnapshot?.total_solana_addresses_linked)}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">AMM 当前持有 $v2ex</span>
                        <span className="text-lg font-semibold">{formatAmount(latestSnapshot?.main_amm_v2ex_amount)}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">AMM 当前持有 sol</span>
                        <span className="text-lg font-semibold">{formatAmount(latestSnapshot?.main_amm_sol_amount)}</span>
                      </div>
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

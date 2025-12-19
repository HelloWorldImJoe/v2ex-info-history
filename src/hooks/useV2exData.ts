import { useState, useEffect, useCallback, useMemo } from 'react';

// Types
export interface HodlSnapshot {
  id: number;
  hodl_10k_addresses_count?: number;
  new_accounts_via_solana?: number;
  total_solana_addresses_linked?: number;
  sol_tip_operations_count?: number;
  member_tips_sent?: number;
  member_tips_received?: number;
  total_sol_tip_amount?: number;
  v2ex_token_tip_count?: number;
  total_v2ex_token_tip_amount?: number;
  current_online_users?: number;
  peak_online_users?: number;
  holders?: number;
  price?: number;
  price_change_24h?: number;
  btc_price?: number;
  sol_price?: number;
  pump_price?: number;
  main_amm_v2ex_amount?: number;
  main_amm_sol_amount?: number;
  created_at: string;
}

export interface SolanaAddress {
  id: number;
  owner_address: string;
  v2ex_username?: string | null;
  avatar_url?: string | null;
  token_address: string;
  token_account_address: string;
  hold_rank: number;
  hold_amount: number;
  decimals: number;
  rank_delta: number;
  hold_percentage: number;
  checked_at: string;
  amount_delta: number;
}

export interface SolanaAddressDetail {
  id: number;
  owner_address: string;
  token_address: string;
  token_account_address: string;
  v2ex_username?: string | null;
  avatar_url?: string | null;
  hold_rank: number;
  hold_amount: number;
  decimals: number;
  hold_percentage: number;
  rank_delta: number;
  amount_delta: number;
  changed_at: string;
}

export interface SolanaAddressRemoved {
  id: number;
  owner_address: string;
  v2ex_username?: string | null;
  avatar_url?: string | null;
  token_address: string;
  token_account_address: string;
  hold_rank: number;
  hold_amount: number;
  decimals: number;
  hold_percentage: number;
  rank_delta: number;
  removed_at: string;
}

export interface V2exData {
  snapshots: HodlSnapshot[];
  addresses: SolanaAddress[];
  addressDetails: SolanaAddressDetail[];
  addressesRemoved: SolanaAddressRemoved[];
  lastUpdated: string | null;
}

export type DataRange =
  | { type: 'preset'; days: number }
  | { type: 'custom'; from: Date; to?: Date };

const CACHE_KEY_PREFIX = 'v2ex_data_cache';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

const BASE_URL = 'https://raw.githubusercontent.com/GrabCoffee/v2ex-info-newsletter-data/master/daily';

const sanitizePrice = (value?: number | null) => {
  if (!value) return undefined;
  return value > 0 ? value : undefined;
};

function sanitizeSnapshot(snapshot: HodlSnapshot): HodlSnapshot {
  return {
    ...snapshot,
    price: sanitizePrice(snapshot.price),
    pump_price: sanitizePrice(snapshot.pump_price),
    sol_price: sanitizePrice(snapshot.sol_price),
    btc_price: sanitizePrice(snapshot.btc_price),
  };
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getRangeKey(range: DataRange): string {
  if (range.type === 'preset') {
    return `${CACHE_KEY_PREFIX}_preset_${range.days}`;
  }
  const toDate = range.to ?? new Date();
  return `${CACHE_KEY_PREFIX}_custom_${formatDate(range.from)}_${formatDate(toDate)}`;
}

function getDateStrings(range: DataRange): string[] {
  const dates: string[] = [];
  if (range.type === 'preset') {
    const end = new Date();
    for (let i = 0; i < range.days; i++) {
      const d = new Date(end);
      d.setDate(end.getDate() - i);
      dates.push(formatDate(d));
    }
    return dates;
  }

  const endDate = range.to ? new Date(range.to) : new Date();
  const startDate = new Date(range.from);
  for (let d = new Date(endDate); d >= startDate; d.setDate(d.getDate() - 1)) {
    dates.push(formatDate(d));
  }
  return dates;
}

async function fetchWithFallback<T>(dateStr: string, filename: string): Promise<T | null> {
  const url = `${BASE_URL}/${dateStr}/${filename}`;
  try {
    const response = await fetch(url);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
  }
  return null;
}

async function fetchDataForDate(dateStr: string): Promise<{
  snapshots: HodlSnapshot[];
  addresses: SolanaAddress[];
  addressDetails: SolanaAddressDetail[];
  addressesRemoved: SolanaAddressRemoved[];
} | null> {
  const [snapshots, addresses, addressDetails, addressesRemoved] = await Promise.all([
    fetchWithFallback<HodlSnapshot[]>(dateStr, 'hodl_snapshots.json'),
    fetchWithFallback<SolanaAddress[]>(dateStr, 'solana_addresses.json'),
    fetchWithFallback<SolanaAddressDetail[]>(dateStr, 'solana_address_details.json'),
    fetchWithFallback<SolanaAddressRemoved[]>(dateStr, 'solana_addresses_removed.json'),
  ]);

  const hasAny =
    (snapshots?.length ?? 0) > 0 ||
    (addresses?.length ?? 0) > 0 ||
    (addressDetails?.length ?? 0) > 0 ||
    (addressesRemoved?.length ?? 0) > 0;

  if (!hasAny) {
    return null;
  }

  return {
    snapshots: snapshots || [],
    addresses: addresses || [],
    addressDetails: addressDetails || [],
    addressesRemoved: addressesRemoved || [],
  };
}

export function useV2exData(range: DataRange = { type: 'preset', days: 3 }) {
  const [data, setData] = useState<V2exData>({
    snapshots: [],
    addresses: [],
    addressDetails: [],
    addressesRemoved: [],
    lastUpdated: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rangeKey = useMemo(() => getRangeKey(range), [range]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    // Check cache first
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(rangeKey);
        if (cached) {
          const { timestamp, data: cachedData } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setData({
              snapshots: cachedData.snapshots || [],
              addresses: cachedData.addresses || [],
              addressDetails: cachedData.addressDetails || [],
              addressesRemoved: cachedData.addressesRemoved || [],
              lastUpdated: cachedData.lastUpdated || null,
            });
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error('Cache read error:', e);
      }
    }

    // Fetch fresh data for the last N days and merge
    const dateStrings = getDateStrings(range);
    let mergedSnapshots: HodlSnapshot[] = [];
    let mergedAddressDetails: SolanaAddressDetail[] = [];
    let mergedAddressesRemoved: SolanaAddressRemoved[] = [];
    let latestAddresses: SolanaAddress[] = [];
    let consecutiveMissingDays = 0;

    for (const dateStr of dateStrings) {
      const dayData = await fetchDataForDate(dateStr);
      
      if (!dayData) {
        consecutiveMissingDays++;
        // 如果连续三天数据不存在，停止请求
        if (consecutiveMissingDays >= 3) {
          console.log(`连续${consecutiveMissingDays}天数据不存在，停止请求`);
          break;
        }
        continue;
      }
      
      // 重置连续缺失天数计数器
      consecutiveMissingDays = 0;

      if (dayData.snapshots?.length) {
        mergedSnapshots = mergedSnapshots.concat(dayData.snapshots.map(sanitizeSnapshot));
      }

      if (dayData.addressDetails?.length) {
        mergedAddressDetails = mergedAddressDetails.concat(dayData.addressDetails);
      }

      if (dayData.addressesRemoved?.length) {
        mergedAddressesRemoved = mergedAddressesRemoved.concat(dayData.addressesRemoved);
      }

      // Use the most recent available ranking snapshot for the holders table
      if (dayData.addresses?.length && latestAddresses.length === 0) {
        latestAddresses = dayData.addresses;
      }
    }

    if (
      mergedSnapshots.length ||
      mergedAddressDetails.length ||
      mergedAddressesRemoved.length ||
      latestAddresses.length
    ) {
      const newData: V2exData = {
        snapshots: mergedSnapshots,
        addresses: latestAddresses,
        addressDetails: mergedAddressDetails,
        addressesRemoved: mergedAddressesRemoved,
        lastUpdated: new Date().toISOString(),
      };

      // Sort snapshots by created_at descending
      newData.snapshots.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Sort addresses by hold_rank ascending
      newData.addresses.sort((a, b) => a.hold_rank - b.hold_rank);

      // Sort address details by changed_at descending
      newData.addressDetails.sort((a, b) =>
        new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
      );

      newData.addressesRemoved.sort((a, b) =>
        new Date(b.removed_at).getTime() - new Date(a.removed_at).getTime()
      );

      setData(newData);

      // Cache the data
      try {
        localStorage.setItem(rangeKey, JSON.stringify({
          timestamp: Date.now(),
          data: newData,
        }));
      } catch (e: any) {
        // If storage quota is exceeded, skip caching but keep runtime data working
        if (e?.name === 'QuotaExceededError') {
          try {
            localStorage.removeItem(rangeKey);
          } catch (_) {
            /* ignore */
          }
          console.warn('Cache skipped due to storage quota limits.');
        } else {
          console.error('Cache write error:', e);
        }
      }
    } else {
      setError('无法获取数据，请稍后重试');
    }

    setLoading(false);
  }, [range, rangeKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // Computed values
  const latestSnapshot = data.snapshots[0] || null;
  
  const calculateMarketCap = useCallback(() => {
    if (!latestSnapshot?.price) return null;
    // Total supply is approximately 100M tokens
    const totalSupply = 100000000;
    return latestSnapshot.price * totalSupply;
  }, [latestSnapshot]);

  return {
    data,
    loading,
    error,
    refresh,
    latestSnapshot,
    marketCap: calculateMarketCap(),
  };
}

// Helper function to format numbers
export function formatNumber(num: number | undefined | null, decimals = 2): string {
  if (num === undefined || num === null) return '-';
  if (Math.abs(num) >= 1e9) {
    return `$${(num / 1e9).toFixed(decimals)}B`;
  }
  if (Math.abs(num) >= 1e6) {
    return `$${(num / 1e6).toFixed(decimals)}M`;
  }
  if (Math.abs(num) >= 1e3) {
    return `$${(num / 1e3).toFixed(decimals)}K`;
  }
  return `$${num.toFixed(decimals)}`;
}

export function formatPrice(price: number | undefined | null): string {
  if (price === undefined || price === null) return '-';
  if (price < 0.01) {
    return `$${price.toFixed(6)}`;
  }
  if (price < 1) {
    return `$${price.toFixed(4)}`;
  }
  if (price >= 1000) {
    return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  }
  return `$${price.toFixed(2)}`;
}

export function formatPercent(value: number | undefined | null): string {
  if (value === undefined || value === null) return '-';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatAmount(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '-';
  return amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function truncateAddress(address: string, start = 6, end = 4): string {
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

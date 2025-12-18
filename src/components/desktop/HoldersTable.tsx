import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpDown, ArrowUp, ArrowDown, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { truncateAddress, formatAmount } from '@/hooks/useV2exData';
import type { SolanaAddress } from '@/hooks/useV2exData';

interface HoldersTableProps {
  addresses: SolanaAddress[];
  className?: string;
}

type SortField = 'hold_rank' | 'hold_amount' | 'amount_delta';
type SortDirection = 'asc' | 'desc';

export default function HoldersTable({ addresses, className }: HoldersTableProps) {
  const [sortField, setSortField] = useState<SortField>('hold_rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const topRankedAddresses = useMemo(() => {
    return [...addresses]
      .sort((a, b) => a.hold_rank - b.hold_rank)
      .slice(0, 100);
  }, [addresses]);

  const sortedAddresses = useMemo(() => {
    return [...topRankedAddresses].sort((a, b) => {
      const aVal = a[sortField] ?? 0;
      const bVal = b[sortField] ?? 0;
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      return (aVal - bVal) * multiplier;
    });
  }, [topRankedAddresses, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'hold_rank' ? 'asc' : 'desc');
    }
  };

  const copyToClipboard = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      {sortField === field ? (
        sortDirection === 'asc' ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      )}
    </button>
  );

  const getRankBadgeClass = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400';
    if (rank === 2) return 'bg-gray-300/30 text-gray-600 dark:text-gray-400';
    if (rank === 3) return 'bg-amber-600/20 text-amber-700 dark:text-amber-500';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className={cn('bg-card border border-border rounded-lg h-[540px] flex flex-col', className)}>
      {/* Header */}
      <div className="p-5 border-b border-border">
        <h3 className="text-lg font-semibold">$V2EX 持币排行榜</h3>
        <p className="text-sm text-muted-foreground mt-1">
          前 {topRankedAddresses.length} 名持币用户（按排名）
        </p>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto scrollbar-thin">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
              <th className="text-left p-4">
                <SortButton field="hold_rank">排名</SortButton>
              </th>
              <th className="text-left p-4">钱包地址</th>
              <th className="text-right p-4">
                <SortButton field="hold_amount">持币数量</SortButton>
              </th>
              <th className="text-right p-4">占比</th>
              <th className="text-right p-4">
                <SortButton field="amount_delta">变化</SortButton>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedAddresses.map((address, index) => (
              <tr
                key={address.id}
                className={cn(
                  'border-b border-border/50 hover:bg-muted/50 transition-colors',
                  index % 2 === 1 && 'bg-muted/20'
                )}
              >
                {/* Rank */}
                <td className="p-4">
                  <span
                    className={cn(
                      'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-mono font-medium',
                      getRankBadgeClass(address.hold_rank)
                    )}
                  >
                    {address.hold_rank}
                  </span>
                </td>

                {/* Address */}
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {truncateAddress(address.owner_address)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(address.owner_address)}
                    >
                      {copiedAddress === address.owner_address ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  {address.v2ex_username && (
                    <span className="text-xs text-muted-foreground">
                      @{address.v2ex_username}
                    </span>
                  )}
                </td>

                {/* Amount */}
                <td className="p-4 text-right">
                  <span className="font-mono font-medium">
                    {formatAmount(address.hold_amount)}
                  </span>
                </td>

                {/* Percentage */}
                <td className="p-4 text-right">
                  <span className="font-mono text-sm text-muted-foreground">
                    {address.hold_percentage?.toFixed(4)}%
                  </span>
                </td>

                {/* Delta */}
                <td className="p-4 text-right">
                  {address.amount_delta !== 0 && (
                    <div className="flex items-center justify-end gap-1">
                      {address.rank_delta !== 0 && (
                        <span
                          className={cn(
                            'text-xs',
                            address.rank_delta < 0
                              ? 'text-trend-up'
                              : 'text-trend-down'
                          )}
                        >
                          {address.rank_delta < 0 ? '↑' : '↓'}
                          {Math.abs(address.rank_delta)}
                        </span>
                      )}
                      <span
                        className={cn(
                          'font-mono text-sm',
                          address.amount_delta > 0
                            ? 'text-trend-up'
                            : 'text-trend-down'
                        )}
                      >
                        {address.amount_delta > 0 ? '+' : ''}
                        {formatAmount(address.amount_delta)}
                      </span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

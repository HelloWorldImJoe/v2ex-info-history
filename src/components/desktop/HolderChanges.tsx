import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { truncateAddress, formatAmount } from '@/hooks/useV2exData';
import { ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import type { SolanaAddressDetail, SolanaAddressRemoved } from '@/hooks/useV2exData';

interface HolderChangesProps {
	changes: SolanaAddressDetail[];
	removed: SolanaAddressRemoved[];
	className?: string;
}

type LpMetadata = Record<string, { name?: string; imageUrl?: string }>;

const LP_CACHE_KEY = 'lp_metadata_cache_v1';
const LP_URL = 'https://raw.githubusercontent.com/GrabCoffee/v2ex-info-newsletter-data/master/lp.json';

type DisplayChange =
	| (SolanaAddressDetail & { source: 'change' })
	| (SolanaAddressRemoved & { source: 'removed' });

export default function HolderChanges({ changes, removed, className }: HolderChangesProps) {
	const [lpMeta, setLpMeta] = useState<LpMetadata>({});

	useEffect(() => {
		const loadLpMeta = async () => {
			try {
				const cached = localStorage.getItem(LP_CACHE_KEY);
				if (cached) {
					const parsed = JSON.parse(cached) as LpMetadata;
					setLpMeta(parsed);
					return;
				}

				const resp = await fetch(LP_URL);
				if (!resp.ok) return;
				const json = (await resp.json()) as LpMetadata;
				setLpMeta(json);
				localStorage.setItem(LP_CACHE_KEY, JSON.stringify(json));
			} catch (err) {
				console.error('Load lp.json failed', err);
			}
		};

		loadLpMeta();
	}, []);

	const formatTime = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleString('zh-CN', {
			month: 'numeric',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const renderItem = (entry: DisplayChange) => {
		const isRemoval = entry.source === 'removed';
		const amountDelta = isRemoval ? -entry.hold_amount : entry.amount_delta;
		const isIncrease = amountDelta > 0;
		const isLargeChange = Math.abs(amountDelta) > 100000;
		const meta = lpMeta[entry.owner_address];
		const displayName = meta?.name ? meta.name.replace(/\s+/g, ' ') : truncateAddress(entry.owner_address);
		const timestamp = isRemoval ? entry.removed_at : entry.changed_at;
		const key = `${entry.source}-${entry.id}`;

		return (
			<div
				key={key}
				className={cn(
					'p-4 hover:bg-muted/50 transition-colors',
					isLargeChange && 'bg-muted/30'
				)}
			>
				<div className="flex items-start justify-between gap-4">
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2">
							{meta?.imageUrl ? (
								<img
									src={meta.imageUrl}
									alt={displayName}
									className="h-6 w-6 rounded-full border border-border object-cover"
									loading="lazy"
								/>
							) : (
								<span className="h-6 w-6 rounded-full bg-muted" aria-hidden="true" />
							)}
							<div className="flex flex-col min-w-0">
								<span className="text-sm font-medium truncate">{displayName}</span>
								<span className="text-xs text-muted-foreground font-mono truncate">{truncateAddress(entry.owner_address)}</span>
							</div>
							<span className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">
								#{entry.hold_rank}
							</span>
							{entry.rank_delta !== 0 && (
								<span
									className={cn(
										'text-xs font-medium',
										entry.rank_delta > 0 ? 'text-trend-up' : 'text-trend-down'
									)}
								>
									{entry.rank_delta > 0 ? '↑' : '↓'}
									{Math.abs(entry.rank_delta)}
								</span>
							)}
						</div>

						<div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
							<Clock className="h-3 w-3" />
							<span>{formatTime(timestamp)}</span>
							{isRemoval && (
								<span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
									移出前120名
								</span>
							)}
						</div>
					</div>

					<div className="text-right">
						<div
							className={cn(
								'flex items-center gap-1 font-mono font-medium',
								isIncrease ? 'text-trend-up' : 'text-trend-down'
							)}
						>
							{isIncrease ? (
								<ArrowUpRight className="h-4 w-4" />
							) : (
								<ArrowDownRight className="h-4 w-4" />
							)}
							<span>
								{isIncrease ? '+' : ''}
								{formatAmount(amountDelta)}
							</span>
						</div>
						<div className="text-xs text-muted-foreground mt-1">
							持有: {formatAmount(entry.hold_amount)}
						</div>
					</div>
				</div>
			</div>
		);
	};

	const recentChanges: DisplayChange[] = changes.map((c) => ({ ...c, source: 'change' as const }));
	const removedChanges: DisplayChange[] = removed.map((r) => ({ ...r, source: 'removed' as const }));
	const hasRecentChanges = recentChanges.length > 0;
	const hasRemovedChanges = removedChanges.length > 0;

	return (
		<div className={cn('space-y-4', className)}>
			{hasRemovedChanges && (
				<div className="bg-card border border-border rounded-lg">
					<div className="p-5 border-b border-border">
						<h3 className="text-lg font-semibold">大额减持(Top120)</h3>
						<p className="text-sm text-muted-foreground mt-1">最近移出前120名的地址</p>
					</div>
					<div className="max-h-[840px] overflow-y-auto scrollbar-thin">
						<div className="divide-y divide-border/50">
							{removedChanges.map(renderItem)}
						</div>
					</div>
				</div>
			)}

			<div className="bg-card border border-border rounded-lg">
				<div className="p-5 border-b border-border">
					<h3 className="text-lg font-semibold">持仓变化动态</h3>
					<p className="text-sm text-muted-foreground mt-1">最近的持仓变化记录</p>
				</div>

				<div className="max-h-[840px] overflow-y-auto scrollbar-thin">
					{hasRecentChanges ? (
						<div className="divide-y divide-border/50">
							{recentChanges.map(renderItem)}
						</div>
					) : (
						<div className="p-8 text-center text-muted-foreground">暂无变化记录</div>
					)}
				</div>
			</div>
		</div>
	);
}

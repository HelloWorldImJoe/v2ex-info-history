import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { truncateAddress, formatAmount } from '@/hooks/useV2exData';
import { ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import type { SolanaAddressDetail, SolanaAddressRemoved } from '@/hooks/useV2exData';

interface HolderChangesProps {
	changes: SolanaAddressDetail[];
	removed: SolanaAddressRemoved[];
	className?: string;
}

type V2exerMetadata = Record<
	string,
	{
		id: number;
		v2ex_username?: string;
		avatar_url?: string | null;
		created_at: string;
		updated_at: string;
	}
>;

const V2EXER_CACHE_KEY = 'v2exer_metadata_cache_v1';
const V2EXER_URL = 'https://raw.githubusercontent.com/GrabCoffee/v2ex-info-newsletter-data/master/v2exer.json';

type DisplayChange =
	| (SolanaAddressDetail & { source: 'change' })
	| (SolanaAddressRemoved & { source: 'removed' });

type DisplayChangeWithDelta = DisplayChange & { computedDelta: number };

export default function HolderChanges({ changes, removed, className }: HolderChangesProps) {
	const [v2exerMeta, setV2exerMeta] = useState<V2exerMetadata>({});

	useEffect(() => {
		const loadV2exerMeta = async () => {
			try {
				const cached = localStorage.getItem(V2EXER_CACHE_KEY);
				const now = Date.now();
				const ONE_DAY_MS = 24 * 60 * 60 * 1000;

				if (cached) {
					const { data, timestamp } = JSON.parse(cached) as {
						data: V2exerMetadata;
						timestamp: number;
					};
					
					// 检查缓存是否过期（超过24小时）
					if (now - timestamp < ONE_DAY_MS) {
						setV2exerMeta(data);
						return;
					}
				}

				const resp = await fetch(V2EXER_URL);
				if (!resp.ok) return;
				const json = (await resp.json()) as V2exerMetadata;
				setV2exerMeta(json);
				localStorage.setItem(
					V2EXER_CACHE_KEY,
					JSON.stringify({ data: json, timestamp: now })
				);
			} catch (err) {
				console.error('Load v2exer.json failed', err);
			}
		};

		loadV2exerMeta();
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

	const renderItem = (entry: DisplayChangeWithDelta) => {
		const isRemoval = entry.source === 'removed';
		const amountDelta = entry.computedDelta;
		const isIncrease = amountDelta > 0;
		const isLargeChange = Math.abs(amountDelta) > 100000;
		const meta = v2exerMeta[entry.owner_address];
		const displayName =
			meta?.v2ex_username?.trim() || entry.v2ex_username?.trim() || truncateAddress(entry.owner_address);
		const avatarUrl = meta?.avatar_url || entry.avatar_url || undefined;
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
							<span className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">
								#{entry.hold_rank}
							</span>
							{avatarUrl ? (
								<img
									src={avatarUrl}
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
									移出前50名
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

	const getTimestamp = (entry: DisplayChange) =>
		new Date(entry.source === 'removed' ? entry.removed_at : entry.changed_at).getTime();

	const makeKey = (entry: DisplayChange) => `${entry.source}-${entry.id}`;

	const { recentChanges, removedChanges } = useMemo(() => {
		const allEntries: DisplayChange[] = [
			...changes.map((c) => ({ ...c, source: 'change' as const })),
			...removed.map((r) => ({ ...r, source: 'removed' as const })),
		];

		const groupedByAddress = new Map<string, DisplayChange[]>();
		allEntries.forEach((entry) => {
			if (!groupedByAddress.has(entry.owner_address)) {
				groupedByAddress.set(entry.owner_address, []);
			}
			groupedByAddress.get(entry.owner_address)!.push(entry);
		});

		const deltaMap = new Map<string, number>();

		groupedByAddress.forEach((entries) => {
			const chronological = [...entries].sort((a, b) => getTimestamp(a) - getTimestamp(b));
			let prevHoldAmount: number | null = null;

			chronological.forEach((entry) => {
				let delta: number;
				if (prevHoldAmount !== null) {
					delta = entry.hold_amount - prevHoldAmount;
				} else if (entry.source === 'change') {
					delta = entry.amount_delta;
				} else {
					delta = -entry.hold_amount;
				}

				deltaMap.set(makeKey(entry), delta);
				prevHoldAmount = entry.hold_amount;
			});
		});

		const withDelta: DisplayChangeWithDelta[] = allEntries
			.map((entry) => {
				const computedDelta = deltaMap.get(makeKey(entry)) ?? (entry.source === 'change' ? entry.amount_delta : -entry.hold_amount);
				return { ...entry, computedDelta };
			})
			.sort((a, b) => getTimestamp(b) - getTimestamp(a));

		return {
			recentChanges: withDelta.filter((entry) => entry.source === 'change'),
			removedChanges: withDelta.filter((entry) => entry.source === 'removed'),
		};
	}, [changes, removed]);

	const hasRecentChanges = recentChanges.length > 0;
	const hasRemovedChanges = removedChanges.length > 0;

	return (
		<div
			className={cn(
				'flex flex-col gap-4 min-h-0 min-w-0 overflow-hidden self-start h-[calc(100vh+160px)] max-h-[calc(100vh+160px)]',
				className
			)}
		>
			{hasRemovedChanges && (
				<div
					className="bg-card border border-border rounded-lg flex flex-col flex-none min-h-0 min-w-0 overflow-hidden"
					style={{ maxHeight: '50%' }}
				>
					<div className="p-5 border-b border-border">
						<h3 className="text-lg font-semibold">大额减持(Top50)</h3>
						<p className="text-sm text-muted-foreground mt-1">最近移出前50名的地址(因为接口不稳定, 所以这个数据仅供参考, 实际数据可能有所偏差)</p>
					</div>
					<div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
						<div className="divide-y divide-border/50">
							{removedChanges.map(renderItem)}
						</div>
					</div>
				</div>
			)}

			<div className="bg-card border border-border rounded-lg flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
				<div className="p-5 border-b border-border">
					<h3 className="text-lg font-semibold">持仓变化动态</h3>
					<p className="text-sm text-muted-foreground mt-1">最近的持仓变化记录</p>
				</div>

				<div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
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

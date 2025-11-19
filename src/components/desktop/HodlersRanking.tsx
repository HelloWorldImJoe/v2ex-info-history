import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Medal, Award, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HodlerRank } from "@/lib/v2exService";

interface HodlersRankingProps {
  data: HodlerRank[];
  myRank: HodlerRank;
}

export function HodlersRanking({ data, myRank }: HodlersRankingProps) {
  // Check if my rank is in the visible list
  const isMyRankInList = data.some(item => item.rank === myRank.rank);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-orange-600" />;
    return null;
  };

  const renderRankItem = (hodler: HodlerRank, isMyRank = false) => (
    <div
      key={hodler.rank}
      className={cn(
        "flex items-center gap-4 py-4 px-3 transition-all duration-200",
        hodler.rank <= 3 && !isMyRank
          ? "bg-primary/5"
          : isMyRank
          ? "bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500"
          : "hover:bg-muted/50"
      )}
    >
      <div className="flex items-center justify-center w-10 h-10 shrink-0">
        {hodler.rank <= 3 ? (
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-primary/5">
            {getRankIcon(hodler.rank)}
          </div>
        ) : (
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-muted/50 border border-border/30">
            <span className="text-sm font-bold text-muted-foreground">
              {hodler.rank}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={cn("font-medium truncate", isMyRank && "text-blue-600 dark:text-blue-400")}>
            {hodler.username}
          </p>
          {hodler.isVerified && (
            <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" title="已认证V2EX用户" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {hodler.balance} V2EX · {hodler.percentage}
        </p>
      </div>

      <div className="text-right">
        <p className="text-sm font-semibold">{hodler.valueUSD}</p>
      </div>
    </div>
  );

  return (
    <Card className="border-border/40 shadow-md hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <CardTitle>$V2EX 持币排行榜</CardTitle>
        <CardDescription>前 {data.length} 名持币用户</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ height: '580px' }}>
          <div className="divide-y divide-border/30">
            {data.map((hodler) => {
              const isMyRank = hodler.rank === myRank.rank;
              return renderRankItem(hodler, isMyRank);
            })}
            
            {/* My Rank at Bottom (only if not in list) */}
            {!isMyRankInList && (
              <>
                <div className="my-4 border-t-2 border-dashed border-border/50" />
                {renderRankItem(myRank, true)}
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

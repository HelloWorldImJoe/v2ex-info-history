import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Flame, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CheckinRank } from "@/lib/v2exService";

interface CheckinRankingProps {
  data: CheckinRank[];
  myRank: CheckinRank;
}

export function CheckinRanking({ data, myRank }: CheckinRankingProps) {
  // Check if my rank is in the visible list
  const isMyRankInList = data.some(item => item.rank === myRank.rank);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-orange-600" />;
    return null;
  };

  const renderRankItem = (checkin: CheckinRank, isMyRank = false) => (
    <div
      key={checkin.rank}
      className={cn(
        "flex items-center gap-4 py-4 px-3 transition-all duration-200",
        checkin.rank <= 3 && !isMyRank
          ? "bg-primary/5"
          : isMyRank
          ? "bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500"
          : "hover:bg-muted/50"
      )}
    >
      <div className="flex items-center justify-center w-10 h-10 shrink-0">
        {checkin.rank <= 3 ? (
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-primary/5">
            {getRankIcon(checkin.rank)}
          </div>
        ) : (
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-muted/50 border border-border/30">
            <span className="text-sm font-bold text-muted-foreground">
              {checkin.rank}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={cn("font-medium truncate", isMyRank && "text-blue-600 dark:text-blue-400")}>
            {checkin.username}
          </p>
          {checkin.isVerified && (
            <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" title="已认证V2EX用户" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-xs font-semibold text-orange-600">
              {checkin.streak} 天
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            总签到 {checkin.totalDays} 天
          </span>
        </div>
      </div>

      <div className="text-right">
        <Badge variant="outline" className="font-semibold">
          {checkin.reward}
        </Badge>
      </div>
    </div>
  );

  return (
    <Card className="border-border/40 shadow-md hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <CardTitle>今日打卡排行榜</CardTitle>
        <CardDescription>连续签到天数</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ height: '580px' }}>
          <div className="divide-y divide-border/30">
            {data.map((checkin) => {
              const isMyRank = checkin.rank === myRank.rank;
              return renderRankItem(checkin, isMyRank);
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

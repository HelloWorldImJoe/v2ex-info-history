import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Sparkles, Flame, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  getCheckinStatus, 
  performCheckin, 
  type BlindBoxReward, 
  type CheckinStatus 
} from "@/lib/v2exService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DailyCheckinBox() {
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [reward, setReward] = useState<BlindBoxReward | null>(null);
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    setCheckinStatus(getCheckinStatus());
  }, []);

  const handleCheckin = async () => {
    if (checkinStatus?.hasCheckedToday) return;

    setIsOpening(true);
    
    // Simulate blind box opening animation
    setTimeout(() => {
      const result = performCheckin();
      setReward(result.reward);
      setCheckinStatus(getCheckinStatus());
      setIsOpening(false);
      setShowReward(true);
    }, 2000);
  };

  const getRarityColor = (rarity: BlindBoxReward['rarity']) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-400 to-pink-500';
      case 'rare': return 'from-blue-400 to-cyan-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityText = (rarity: BlindBoxReward['rarity']) => {
    switch (rarity) {
      case 'legendary': return '传说';
      case 'epic': return '史诗';
      case 'rare': return '稀有';
      default: return '普通';
    }
  };

  if (!checkinStatus) return null;

  return (
    <>
      <Card className="border-border/40 shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden">
        {!checkinStatus.hasCheckedToday && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
        )}
        
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                每日签到盲盒
              </CardTitle>
              <CardDescription>签到抽取神秘奖励</CardDescription>
            </div>
            {checkinStatus.hasCheckedToday && (
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                已签到
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Flame className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">连续签到</p>
                <p className="text-lg font-bold">{checkinStatus.streakDays} 天</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">累计签到</p>
                <p className="text-lg font-bold">{checkinStatus.totalCheckins} 天</p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleCheckin}
            disabled={checkinStatus.hasCheckedToday || isOpening}
            className={cn(
              "w-full h-12 text-base font-semibold transition-all duration-300",
              !checkinStatus.hasCheckedToday && !isOpening && "shadow-lg hover:shadow-xl"
            )}
          >
            {isOpening ? (
              <>
                <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                盲盒开启中...
              </>
            ) : checkinStatus.hasCheckedToday ? (
              "今日已签到"
            ) : (
              <>
                <Gift className="h-5 w-5 mr-2" />
                签到抽取盲盒
              </>
            )}
          </Button>

          <div className="pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground text-center">
              每日签到可获得随机奖励：V币、勋章、头像框、专属称号
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showReward} onOpenChange={setShowReward}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">恭喜获得奖励！</DialogTitle>
            <DialogDescription className="text-center">
              今日盲盒奖励已发放
            </DialogDescription>
          </DialogHeader>
          
          {reward && (
            <div className="py-8 space-y-6">
              <div className="flex justify-center">
                <div className={cn(
                  "relative w-32 h-32 rounded-2xl bg-gradient-to-br shadow-2xl",
                  "flex items-center justify-center animate-in zoom-in-50 duration-500",
                  getRarityColor(reward.rarity)
                )}>
                  <span className="text-6xl">{reward.icon}</span>
                  <div className="absolute -top-2 -right-2">
                    <Badge className={cn(
                      "bg-gradient-to-r text-white border-0",
                      getRarityColor(reward.rarity)
                    )}>
                      {getRarityText(reward.rarity)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold">{reward.name}</h3>
                <p className="text-sm text-muted-foreground">{reward.description}</p>
                {reward.value && (
                  <div className="pt-2">
                    <Badge variant="secondary" className="text-lg px-4 py-1">
                      +{reward.value} V
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          <Button onClick={() => setShowReward(false)} className="w-full">
            太棒了!
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Gift, CheckCircle, Loader2, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBlindBoxRewards, type BlindBoxReward } from "@/lib/v2exService";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CheckinState {
  lastCheckinDate: string;
  streak: number;
  totalCheckins: number;
}

export function QuickCheckin() {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [currentReward, setCurrentReward] = useState<BlindBoxReward | null>(null);
  const [checkinState, setCheckinState] = useState<CheckinState>({
    lastCheckinDate: '',
    streak: 0,
    totalCheckins: 0,
  });

  // Verification state
  const [isVerified, setIsVerified] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verifyStep, setVerifyStep] = useState<'input' | 'confirm'>('input');
  const [v2exUsername, setV2exUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Check verification status
    const verificationStatus = localStorage.getItem('v2ex_verification_status');
    if (verificationStatus) {
      const status = JSON.parse(verificationStatus);
      setIsVerified(status.isVerified);
      if (status.isVerified) {
        setV2exUsername(status.username);
      }
    }

    // Check today's checkin status
    const checkinData = localStorage.getItem('v2ex_checkin_state');
    if (checkinData) {
      const state = JSON.parse(checkinData) as CheckinState;
      setCheckinState(state);
      
      const today = new Date().toDateString();
      if (state.lastCheckinDate === today) {
        setIsCheckedIn(true);
      }
    }
  }, []);

  const handleCheckin = () => {
    if (isCheckedIn) return;

    setShowRewardDialog(true);
    setIsOpening(true);

    // Simulate blind box opening animation
    setTimeout(() => {
      const rewards = getBlindBoxRewards();
      const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
      setCurrentReward(randomReward);
      setIsOpening(false);

      // Update checkin state
      const today = new Date().toDateString();
      const isConsecutive = 
        checkinState.lastCheckinDate && 
        new Date(checkinState.lastCheckinDate).getTime() === 
        new Date(today).getTime() - 24 * 60 * 60 * 1000;

      const newState: CheckinState = {
        lastCheckinDate: today,
        streak: isConsecutive ? checkinState.streak + 1 : 1,
        totalCheckins: checkinState.totalCheckins + 1,
      };

      setCheckinState(newState);
      setIsCheckedIn(true);
      localStorage.setItem('v2ex_checkin_state', JSON.stringify(newState));

      // Save reward
      const rewardsHistory = JSON.parse(localStorage.getItem('v2ex_rewards_history') || '[]');
      rewardsHistory.unshift({
        ...randomReward,
        date: new Date().toISOString(),
      });
      localStorage.setItem('v2ex_rewards_history', JSON.stringify(rewardsHistory));

      toast.success('签到成功！');
    }, 2000);
  };

  const handleStartVerification = () => {
    if (!v2exUsername.trim()) {
      toast.error('请输入V2EX用户名');
      return;
    }
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setVerificationCode(code);
    setVerifyStep('confirm');
  };

  const handleVerifyCode = () => {
    if (!inputCode.trim()) {
      toast.error('请输入验证码');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      if (inputCode.toUpperCase() === verificationCode) {
        const verificationStatus = {
          isVerified: true,
          username: v2exUsername,
          verifiedAt: new Date().toISOString(),
        };
        localStorage.setItem('v2ex_verification_status', JSON.stringify(verificationStatus));
        setIsVerified(true);
        setShowVerifyDialog(false);
        toast.success('认证成功！');
      } else {
        toast.error('验证码错误，请重试');
      }
      setIsVerifying(false);
    }, 1000);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-500 to-gray-600';
      case 'rare': return 'from-blue-500 to-blue-600';
      case 'epic': return 'from-purple-500 to-purple-600';
      case 'legendary': return 'from-yellow-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'common': return '普通';
      case 'rare': return '稀有';
      case 'epic': return '史诗';
      case 'legendary': return '传说';
      default: return '未知';
    }
  };

  // If not verified, show verify button
  if (!isVerified) {
    return (
      <>
        <Button
          variant="outline"
          size="default"
          onClick={() => setShowVerifyDialog(true)}
          className="gap-2"
        >
          <BadgeCheck className="h-4 w-4" />
          认证账号
        </Button>

        <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>V2EX 账号认证</DialogTitle>
            </DialogHeader>

            {verifyStep === 'input' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">V2EX 用户名</Label>
                  <Input
                    id="username"
                    placeholder="请输入您的V2EX用户名"
                    value={v2exUsername}
                    onChange={(e) => setV2exUsername(e.target.value)}
                  />
                </div>
                <Button onClick={handleStartVerification} className="w-full">
                  下一步
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <p className="text-sm font-medium">验证码</p>
                  <p className="text-2xl font-bold text-primary tracking-wider">{verificationCode}</p>
                  <p className="text-xs text-muted-foreground">
                    请在V2EX个人资料的"个人简介"字段中添加此验证码
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">输入验证码确认</Label>
                  <Input
                    id="code"
                    placeholder="请输入上方验证码"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleVerifyCode} 
                  disabled={isVerifying}
                  className="w-full"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      验证中...
                    </>
                  ) : (
                    '确认认证'
                  )}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // If verified, show checkin button
  return (
    <>
      <Button
        variant={isCheckedIn ? "secondary" : "default"}
        size="default"
        onClick={handleCheckin}
        disabled={isCheckedIn}
        className="gap-2"
      >
        {isCheckedIn ? (
          <>
            <CheckCircle className="h-4 w-4" />
            已签到
          </>
        ) : (
          <>
            <Gift className="h-4 w-4" />
            每日签到
          </>
        )}
      </Button>

      <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>签到奖励</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {isOpening ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p className="text-lg font-medium">盲盒开启中...</p>
              </div>
            ) : currentReward ? (
              <div className="space-y-4">
                <div
                  className={cn(
                    "rounded-lg p-8 bg-gradient-to-br",
                    getRarityColor(currentReward.rarity),
                    "flex flex-col items-center justify-center space-y-3 animate-in zoom-in duration-500"
                  )}
                >
                  <div className="text-6xl">{currentReward.icon}</div>
                  <div className="text-center text-white">
                    <p className="text-xl font-bold">{currentReward.name}</p>
                    <p className="text-sm opacity-90">{currentReward.description}</p>
                  </div>
                  <div className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                    <span className="text-xs font-semibold text-white">
                      {getRarityLabel(currentReward.rarity)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>连续签到</span>
                  <span className="font-semibold text-foreground">{checkinState.streak} 天</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>累计签到</span>
                  <span className="font-semibold text-foreground">{checkinState.totalCheckins} 天</span>
                </div>

                <Button onClick={() => setShowRewardDialog(false)} className="w-full">
                  确定
                </Button>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

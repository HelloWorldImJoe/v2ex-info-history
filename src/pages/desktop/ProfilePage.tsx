import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BadgeCheck, Flame, Gift, ShieldCheck, AlertCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  getCheckinStatus, 
  getVerificationStatus, 
  startVerification,
  verifyCode 
} from "@/lib/v2exService";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [checkinStatus, setCheckinStatus] = useState(getCheckinStatus());
  const [verificationStatus, setVerificationStatus] = useState(getVerificationStatus());
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verifyStep, setVerifyStep] = useState<'input' | 'verify'>('input');
  const [username, setUsername] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Refresh data on mount
    setCheckinStatus(getCheckinStatus());
    setVerificationStatus(getVerificationStatus());

    // Listen to storage changes
    const handleStorageChange = () => {
      setCheckinStatus(getCheckinStatus());
      setVerificationStatus(getVerificationStatus());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleStartVerification = () => {
    if (!username.trim()) {
      toast.error("请输入V2EX用户名");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const result = startVerification(username);
      setVerificationCode(result.code);
      setVerifyStep('verify');
      setLoading(false);
      toast.success("验证码已生成！");
    }, 1000);
  };

  const handleVerify = () => {
    if (!inputCode.trim()) {
      toast.error("请输入验证码");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const result = verifyCode(inputCode);
      setLoading(false);
      
      if (result.success) {
        toast.success("认证成功！");
        setVerificationStatus(getVerificationStatus());
        setShowVerifyDialog(false);
        setVerifyStep('input');
        setUsername("");
        setInputCode("");
        setVerificationCode("");
      } else {
        toast.error("验证码错误，请重试");
      }
    }, 1000);
  };

  const handleOpenVerifyDialog = () => {
    if (verificationStatus.isVerified) return;
    setShowVerifyDialog(true);
    setVerifyStep('input');
    setUsername("");
    setInputCode("");
    setVerificationCode("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">个人中心</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  管理您的账号信息和数据统计
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* User Stats Overview */}
          <section>
            <h2 className="text-lg font-semibold mb-4">数据概览</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Checkin Stats */}
              <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Flame className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{checkinStatus.streakDays}</div>
                    <div className="text-sm text-muted-foreground">连续签到</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  累计签到 {checkinStatus.totalCheckins} 天
                </div>
              </div>

              {/* Rewards Stats */}
              <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Gift className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {JSON.parse(localStorage.getItem("checkinRewards") || "[]").length}
                    </div>
                    <div className="text-sm text-muted-foreground">已获奖励</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {checkinStatus.hasCheckedToday ? "今日已签到" : "今日未签到"}
                </div>
              </div>

              {/* Verification Status */}
              <div 
                className={`bg-card border border-border rounded-lg p-6 hover:shadow-md transition-all ${
                  !verificationStatus.isVerified ? "cursor-pointer hover:border-primary/50" : ""
                }`}
                onClick={handleOpenVerifyDialog}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <BadgeCheck className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {verificationStatus.isVerified ? "已认证" : "未认证"}
                    </div>
                    <div className="text-sm text-muted-foreground">V2EX 认证</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {verificationStatus.isVerified
                    ? verificationStatus.v2exUsername
                    : "点击开始认证"}
                </div>
              </div>
            </div>
          </section>

          {/* Rewards History */}
          <section>
            <h2 className="text-lg font-semibold mb-4">奖励记录</h2>
            <div className="bg-card border border-border rounded-lg">
              <div className="p-6">
                {(() => {
                  const rewards = JSON.parse(localStorage.getItem("checkinRewards") || "[]");
                  if (rewards.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>还没有获得任何奖励</p>
                        <p className="text-sm mt-1">每日签到即可获得盲盒奖励</p>
                      </div>
                    );
                  }
                  
                  const getRarityColor = (rarity: string) => {
                    switch (rarity) {
                      case "common": return "text-gray-600 dark:text-gray-400";
                      case "rare": return "text-blue-600 dark:text-blue-400";
                      case "epic": return "text-purple-600 dark:text-purple-400";
                      case "legendary": return "text-orange-600 dark:text-orange-400";
                      default: return "text-gray-600";
                    }
                  };

                  const getRarityText = (rarity: string) => {
                    switch (rarity) {
                      case "common": return "普通";
                      case "rare": return "稀有";
                      case "epic": return "史诗";
                      case "legendary": return "传说";
                      default: return "普通";
                    }
                  };

                  return (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {rewards.reverse().map((reward: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">{reward.icon}</div>
                            <div>
                              <div className="font-medium">{reward.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {reward.description}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-semibold ${getRarityColor(reward.rarity)}`}>
                              {getRarityText(reward.rarity)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(reward.date).toLocaleDateString('zh-CN')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Verification Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              V2EX 账号认证
            </DialogTitle>
            <DialogDescription>
              {verifyStep === 'input' 
                ? '请输入您的V2EX用户名' 
                : '请在V2EX个人资料中填写验证码'}
            </DialogDescription>
          </DialogHeader>

          {verifyStep === 'input' ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">V2EX 用户名</label>
                <Input
                  placeholder="输入您的V2EX用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStartVerification()}
                />
              </div>

              <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    认证说明：系统将生成专属验证码，您需要将其填写到V2EX个人资料的"个人简介"中以完成验证。
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleStartVerification} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "生成中..." : "获取验证码"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground mb-2">您的验证码</p>
                <div className="flex items-center justify-between">
                  <code className="text-2xl font-bold tracking-wider">{verificationCode}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(verificationCode);
                      toast.success("验证码已复制");
                    }}
                  >
                    复制
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">验证步骤：</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>复制上方验证码</li>
                  <li>前往V2EX个人设置页面</li>
                  <li>在"个人简介"中粘贴验证码</li>
                  <li>保存后返回此处输入验证码</li>
                </ol>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">输入验证码确认</label>
                <Input
                  placeholder="输入验证码"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setVerifyStep('input')}
                  className="flex-1"
                >
                  返回
                </Button>
                <Button 
                  onClick={handleVerify} 
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? "验证中..." : "完成验证"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

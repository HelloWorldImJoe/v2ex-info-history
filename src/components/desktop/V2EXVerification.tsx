import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, User, Key, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getVerificationStatus,
  startVerification,
  verifyCode,
  type VerificationStatus,
} from "@/lib/v2exService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function V2EXVerification() {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [username, setUsername] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStatus(getVerificationStatus());
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
      setStep('verify');
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
        setStatus(getVerificationStatus());
        setShowDialog(false);
        setStep('input');
        setUsername("");
        setInputCode("");
        setVerificationCode("");
      } else {
        toast.error("验证码错误，请重试");
      }
    }, 1000);
  };

  const handleOpenDialog = () => {
    setShowDialog(true);
    setStep('input');
    setUsername("");
    setInputCode("");
    setVerificationCode("");
  };

  if (!status) return null;

  return (
    <>
      <Card className="border-border/40 shadow-md hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                V2EX 认证
              </CardTitle>
              <CardDescription>绑定V2EX账号，获得认证标识</CardDescription>
            </div>
            {status.isVerified && (
              <Badge className="gap-1 bg-gradient-to-r from-blue-500 to-cyan-500">
                <CheckCircle2 className="h-3 w-3" />
                已认证
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {status.isVerified ? (
            <>
              <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">V2EX 账号</p>
                    <p className="font-semibold text-lg">{status.v2exUsername}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  认证时间: {status.verifiedAt ? new Date(status.verifiedAt).toLocaleDateString('zh-CN') : '-'}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/30">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  认证特权
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    排行榜显示认证标识
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    参与专属活动资格
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    优先获得新功能体验
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 rounded-lg border border-dashed border-border/50 text-center space-y-3">
                <div className="flex justify-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted/50">
                    <ShieldCheck className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <p className="font-medium">尚未认证</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    认证后可获得专属标识和特权
                  </p>
                </div>
              </div>

              <Button onClick={handleOpenDialog} className="w-full" size="lg">
                <Key className="h-4 w-4 mr-2" />
                开始认证
              </Button>

              <div className="pt-2 border-t border-border/30">
                <p className="text-xs text-muted-foreground text-center">
                  认证流程：输入用户名 → 获取验证码 → 完成验证
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              V2EX 账号认证
            </DialogTitle>
            <DialogDescription>
              {step === 'input' 
                ? '请输入您的V2EX用户名' 
                : '请在V2EX个人资料中填写验证码'}
            </DialogDescription>
          </DialogHeader>

          {step === 'input' ? (
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
                  onClick={() => setStep('input')}
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
    </>
  );
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

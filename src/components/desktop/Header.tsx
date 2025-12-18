import { RefreshCw, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type RangeOption = '3d' | '7d' | '30d';

interface HeaderProps {
  lastUpdated: string | null;
  onRefresh: () => void;
  loading: boolean;
  rangeOption: RangeOption;
  onRangeOptionChange: (option: RangeOption) => void;
}

export default function Header({
  lastUpdated,
  onRefresh,
  loading,
  rangeOption,
  onRangeOptionChange,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();

  const formatLastUpdated = (dateStr: string | null) => {
    if (!dateStr) return '未知';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold font-mono tracking-tight">
            V2EX 数据中心
          </h1>
          <span className="text-xs text-muted-foreground hidden sm:inline-block">
            {formatLastUpdated(lastUpdated)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <div className="flex flex-wrap items-center gap-2 mr-2 text-xs text-muted-foreground">
            <span>数据区间:</span>
            {(['3d', '7d', '30d'] as RangeOption[]).map((opt) => (
              <button
                key={opt}
                onClick={() => onRangeOptionChange(opt)}
                className={cn(
                  'px-3 py-1 rounded border text-xs font-medium transition-colors',
                  rangeOption === opt
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-foreground hover:bg-muted'
                )}
              >
                {opt === '3d' ? '3天' : opt === '7d' ? '7天' : '30天'}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">刷新</span>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">切换主题</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

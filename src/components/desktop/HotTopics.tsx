import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Eye, Clock } from "lucide-react";
import type { HotTopic } from "@/lib/v2exService";

interface HotTopicsProps {
  data: HotTopic[];
}

export function HotTopics({ data }: HotTopicsProps) {
  return (
    <Card className="border-border/40 shadow-md hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <CardTitle>今日热帖</CardTitle>
        <CardDescription>最热门的话题讨论</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ height: '580px' }}>
          <div className="space-y-3">
            {data.map((topic) => (
              <div
                key={topic.id}
                className="p-4 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-muted/30 hover:shadow-sm transition-all duration-200 cursor-pointer"
              >
                <div className="space-y-2">
                  <h4 className="font-medium leading-snug line-clamp-2">
                    {topic.title}
                  </h4>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {topic.node}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      @{topic.author}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>{topic.replies}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      <span>{topic.views}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{topic.lastReplyTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

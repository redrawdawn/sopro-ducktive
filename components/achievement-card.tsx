import { Lock, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type AchievementCardProps = {
  name: string;
  reward: string;
  unlocked?: boolean;
};

export function AchievementCard({ name, reward, unlocked }: AchievementCardProps) {
  const Icon = unlocked ? Trophy : Lock;

  return (
    <Card className={unlocked ? "border-secondary" : undefined}>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-md bg-muted p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <h3 className="min-w-0 break-words font-bold">{name}</h3>
          <div className="shrink-0 text-xs font-bold text-secondary">{reward}</div>
        </div>
      </CardContent>
    </Card>
  );
}

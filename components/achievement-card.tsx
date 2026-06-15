import { Lock, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type AchievementCardProps = {
  name: string;
  description: string;
  unlocked?: boolean;
};

export function AchievementCard({ name, description, unlocked }: AchievementCardProps) {
  const Icon = unlocked ? Trophy : Lock;

  return (
    <Card className={unlocked ? "border-secondary" : undefined}>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="rounded-md bg-muted p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold">{name}</h3>
            <Badge variant={unlocked ? "secondary" : "muted"}>{unlocked ? "Unlocked" : "Locked"}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

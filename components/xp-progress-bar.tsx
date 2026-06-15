import { Progress } from "@/components/ui/progress";

type XpProgressBarProps = {
  currentXp: number;
  nextLevelXp: number;
  progressPercent: number;
};

export function XpProgressBar({ currentXp, nextLevelXp, progressPercent }: XpProgressBarProps) {
  return (
    <div className="space-y-2">
      <Progress value={progressPercent} />
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>{currentXp} XP</span>
        <span>{nextLevelXp} XP to next level</span>
      </div>
    </div>
  );
}

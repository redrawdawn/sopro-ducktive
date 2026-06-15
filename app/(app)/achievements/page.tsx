import { AchievementCard } from "@/components/achievement-card";

const achievements = [
  ["First Quest Completed", "Complete your first quest.", true],
  ["Reach Level 5", "Keep earning XP until you reach level 5.", false],
  ["Reach Level 10", "Prove long-term consistency.", false],
  ["Complete 7 Daily Quests", "Build a week of daily momentum.", false],
  ["Complete 30 Quests", "Complete 30 quests of any cadence.", false],
  ["Earn 1,000 XP", "Collect 1,000 total XP.", false]
] as const;

export default function AchievementsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-black">Achievements</h1>
        <p className="mt-2 text-muted-foreground">Milestones unlock automatically as XP and quest completions grow.</p>
      </div>
      <div className="space-y-3">
        {achievements.map(([name, description, unlocked]) => (
          <AchievementCard key={name} name={name} description={description} unlocked={unlocked} />
        ))}
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { AchievementCard } from "@/components/achievement-card";
import { DashboardWidget } from "@/components/dashboard-widget";
import { LevelBadge } from "@/components/level-badge";
import { QuestCard } from "@/components/quest-card";
import { XpProgressBar } from "@/components/xp-progress-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getLevelSnapshot } from "@/lib/levels";

const sampleQuests = [
  { title: "Read Bible", description: "Spend 15 focused minutes reading.", cadence: "daily" as const, xpValue: 25 },
  { title: "Wash Dishes", description: "Reset the kitchen before bedtime.", cadence: "daily" as const, xpValue: 20 },
  { title: "Date Night", description: "Plan and enjoy intentional time together.", cadence: "weekly" as const, xpValue: 75 }
];

const sampleAchievements = [
  { name: "First Quest Completed", description: "Complete your first real-life quest.", unlocked: true },
  { name: "Reach Level 5", description: "Earn enough XP to reach level 5.", unlocked: false },
  { name: "Earn 1,000 XP", description: "Collect 1,000 XP across all quests.", unlocked: false }
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const { data: xpRows } = await supabase
    .from("xp_transactions")
    .select("amount")
    .eq("user_id", data.user.id);

  const totalXp = xpRows?.reduce((sum, row) => sum + Number(row.amount), 0) ?? 140;
  const level = getLevelSnapshot(totalXp);

  return (
    <div className="space-y-5">
      <section className="rounded-lg bg-primary p-5 text-primary-foreground">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold opacity-85">Today&apos;s adventure</p>
            <h1 className="mt-2 text-3xl font-black">Keep the household momentum going.</h1>
          </div>
          <LevelBadge level={level.level} />
        </div>
        <div className="mt-6 rounded-md bg-white/15 p-4">
          <XpProgressBar currentXp={level.currentXp} nextLevelXp={level.nextLevelXp} progressPercent={level.progressPercent} />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <DashboardWidget title="Current XP" value={`${totalXp}`} detail="Lifetime earned" />
        <DashboardWidget title="Today&apos;s Quests" value="3" detail="Ready to complete" />
        <DashboardWidget title="Household" value="2" detail="Designed for more members later" />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Quests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sampleQuests.map((quest) => (
              <QuestCard key={quest.title} {...quest} />
            ))}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sampleAchievements.map((achievement) => (
                <AchievementCard key={achievement.name} {...achievement} />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Household Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                Shared XP, member progress, household streaks, and future Sopro cosmetic rewards are modeled in the database foundation.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

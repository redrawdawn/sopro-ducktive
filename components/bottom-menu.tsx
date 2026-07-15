"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, UserRound } from "lucide-react";
import { avatarLevelRewards } from "@/lib/avatar";
import { getLevelSnapshot } from "@/lib/levels";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "sopro-ducktive-daily-v1";
const CLAIMED_REWARDS_KEY = "sopro-ducktive-claimed-rewards-v1";

const items = [
  { label: "Rewards", href: "/rewards", icon: Trophy },
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Profile", href: "/profile", icon: UserRound }
];

type StoredTask = {
  id?: string;
  icon?: string;
};

type StoredState = {
  tasks?: StoredTask[];
  completedTaskIds?: string[];
  completionDatesByTask?: Record<string, string[]>;
  totalXp?: number;
};

function daysBetween(startDateKey: string, endDateKey: string) {
  const start = new Date(`${startDateKey}T00:00:00`);
  const end = new Date(`${endDateKey}T00:00:00`);
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
}

function getLongestStreak(completionDates: string[] = []) {
  const sortedDates = Array.from(new Set(completionDates)).sort();
  let longest = 0;
  let current = 0;
  let previousDate: string | null = null;

  for (const date of sortedDates) {
    current = previousDate && daysBetween(previousDate, date) === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
    previousDate = date;
  }

  return longest;
}

function getClaimedRewards() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(CLAIMED_REWARDS_KEY) ?? "[]") as unknown;
    return new Set(Array.isArray(saved) ? saved.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set<string>();
  }
}

function hasClaimableReward() {
  try {
    const state = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as StoredState;
    const tasks = Array.isArray(state.tasks)
      ? state.tasks.filter((task): task is Required<StoredTask> => typeof task.id === "string")
      : [];
    const completedTaskIds = Array.isArray(state.completedTaskIds)
      ? state.completedTaskIds.filter((id): id is string => typeof id === "string")
      : [];
    const completionDatesByTask = state.completionDatesByTask && typeof state.completionDatesByTask === "object"
      ? state.completionDatesByTask
      : {};
    const claimed = getClaimedRewards();
    const tagStreaks = tasks.reduce<Record<string, number>>((streaks, task) => {
      if (!task.icon) return streaks;
      streaks[task.icon] = Math.max(streaks[task.icon] ?? 0, getLongestStreak(completionDatesByTask[task.id] ?? []));
      return streaks;
    }, {});
    const tagTotals = tasks.reduce<Record<string, number>>((totals, task) => {
      if (!task.icon) return totals;
      totals[task.icon] = (totals[task.icon] ?? 0) + (completionDatesByTask[task.id]?.length ?? 0);
      return totals;
    }, {});
    const bestStreak = Math.max(0, ...Object.values(tagStreaks));
    const level = getLevelSnapshot(Math.max(0, Number(state.totalXp) || 0)).level;

    const generalPending =
      (tasks.length > 0 && completedTaskIds.length >= tasks.length && !claimed.has("reward:daily-all")) ||
      (bestStreak >= 7 && !claimed.has("reward:streak-7")) ||
      (bestStreak >= 30 && !claimed.has("reward:streak-30")) ||
      ((tagTotals.sleep ?? 0) >= 30 && !claimed.has("reward:sleep-30-total")) ||
      ((tagTotals.run ?? 0) >= 40 && !claimed.has("reward:run-40-total")) ||
      ((tagStreaks.workout ?? 0) >= 7 && (tagStreaks.run ?? 0) >= 7 && !claimed.has("reward:workout-run-7")) ||
      (tasks.filter((task) => getLongestStreak(completionDatesByTask[task.id] ?? []) >= 7).length >= 5 &&
        !claimed.has("reward:five-daily-7"));

    const levelPending = avatarLevelRewards.some((reward) => level >= reward.level && !claimed.has(`level:${reward.level}`));
    const medalPending = [
      ["run", "Bronze", 7], ["run", "Silver", 30], ["run", "Gold", 60],
      ["workout", "Bronze", 7], ["workout", "Silver", 30], ["workout", "Gold", 60],
      ["sleep", "Bronze", 7], ["sleep", "Silver", 30], ["sleep", "Gold", 60],
      ["book", "Bronze", 7], ["book", "Silver", 30], ["book", "Gold", 60],
      ["mind", "Bronze", 7], ["mind", "Silver", 30], ["mind", "Gold", 60]
    ].some(([tag, tier, days]) => (tagStreaks[String(tag)] ?? 0) >= Number(days) && !claimed.has(`medal:${tag}:${tier}`));

    return generalPending || levelPending || medalPending;
  } catch {
    return false;
  }
}

export function BottomMenu() {
  const pathname = usePathname();
  const [rewardPending, setRewardPending] = useState(false);

  useEffect(() => {
    function syncRewardPending() {
      setRewardPending(hasClaimableReward());
    }

    syncRewardPending();
    window.addEventListener("storage", syncRewardPending);
    window.addEventListener("focus", syncRewardPending);
    window.addEventListener("motive-rewards-claimed-change", syncRewardPending);
    return () => {
      window.removeEventListener("storage", syncRewardPending);
      window.removeEventListener("focus", syncRewardPending);
      window.removeEventListener("motive-rewards-claimed-change", syncRewardPending);
    };
  }, []);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md rounded-t-3xl border border-white/10 bg-card/95 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur sm:bottom-6 sm:rounded-3xl sm:pb-4">
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                "bottom-menu-item relative flex min-h-16 items-center justify-center rounded-2xl text-muted-foreground",
                active && "bottom-menu-item-active bg-primary/25 text-primary"
              )}
            >
              {item.href === "/rewards" && rewardPending ? (
                <span className="absolute right-[calc(50%-1.15rem)] top-3 h-3 w-3 rounded-full bg-secondary shadow-lg shadow-secondary/40" />
              ) : null}
              <item.icon className="h-5 w-5" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

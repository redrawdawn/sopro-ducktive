import { avatarLevelRewards } from "@/lib/avatar";
import { getLevelSnapshot } from "@/lib/levels";

export const CLAIMED_REWARDS_KEY = "sopro-ducktive-claimed-rewards-v1";

export type RewardStateTask = {
  id?: string;
  icon?: string;
};

export type RewardDailyState = {
  tasks?: RewardStateTask[];
  completedTaskIds?: string[];
  completionDatesByTask?: Record<string, string[]>;
  totalXp?: number;
};

export const generalRewardXp: Record<string, number> = {
  "reward:daily-all": 5,
  "reward:streak-7": 50,
  "reward:streak-30": 500
};

const generalRewardIds = [
  "reward:daily-all",
  "reward:streak-7",
  "reward:streak-30",
  "reward:sleep-30-total",
  "reward:run-40-total",
  "reward:workout-run-7",
  "reward:five-daily-7"
];

const medalThresholds: Array<{ tag: string; tier: "Bronze" | "Silver" | "Gold"; days: number }> = [
  { tag: "run", tier: "Bronze", days: 7 },
  { tag: "run", tier: "Silver", days: 30 },
  { tag: "run", tier: "Gold", days: 60 },
  { tag: "workout", tier: "Bronze", days: 7 },
  { tag: "workout", tier: "Silver", days: 30 },
  { tag: "workout", tier: "Gold", days: 60 },
  { tag: "sleep", tier: "Bronze", days: 7 },
  { tag: "sleep", tier: "Silver", days: 30 },
  { tag: "sleep", tier: "Gold", days: 60 },
  { tag: "book", tier: "Bronze", days: 7 },
  { tag: "book", tier: "Silver", days: 30 },
  { tag: "book", tier: "Gold", days: 60 },
  { tag: "mind", tier: "Bronze", days: 7 },
  { tag: "mind", tier: "Silver", days: 30 },
  { tag: "mind", tier: "Gold", days: 60 }
];

function daysBetween(startDateKey: string, endDateKey: string) {
  const start = new Date(`${startDateKey}T00:00:00`);
  const end = new Date(`${endDateKey}T00:00:00`);
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
}

export function getLongestRewardStreak(completionDates: string[] = []) {
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

export function getRewardTagStreaks(state: RewardDailyState) {
  const tasks = Array.isArray(state.tasks) ? state.tasks : [];
  const completionDatesByTask =
    state.completionDatesByTask && typeof state.completionDatesByTask === "object" ? state.completionDatesByTask : {};

  return tasks.reduce<Record<string, number>>((streaks, task) => {
    if (!task.id || !task.icon) {
      return streaks;
    }

    streaks[task.icon] = Math.max(streaks[task.icon] ?? 0, getLongestRewardStreak(completionDatesByTask[task.id] ?? []));
    return streaks;
  }, {});
}

export function getRewardTagTotals(state: RewardDailyState) {
  const tasks = Array.isArray(state.tasks) ? state.tasks : [];
  const completionDatesByTask =
    state.completionDatesByTask && typeof state.completionDatesByTask === "object" ? state.completionDatesByTask : {};

  return tasks.reduce<Record<string, number>>((totals, task) => {
    if (!task.id || !task.icon) {
      return totals;
    }

    totals[task.icon] = (totals[task.icon] ?? 0) + (completionDatesByTask[task.id]?.length ?? 0);
    return totals;
  }, {});
}

export function getClaimedRewardXp(id: string) {
  return generalRewardXp[id] ?? 0;
}

export function isRewardClaimEligible(id: string, state: RewardDailyState) {
  const tasks = Array.isArray(state.tasks) ? state.tasks : [];
  const completedTaskIds = Array.isArray(state.completedTaskIds) ? state.completedTaskIds : [];
  const tagStreaks = getRewardTagStreaks(state);
  const tagTotals = getRewardTagTotals(state);
  const bestStreak = Math.max(0, ...Object.values(tagStreaks));

  if (id === "reward:daily-all") {
    return tasks.length > 0 && completedTaskIds.length >= tasks.length;
  }

  if (id === "reward:streak-7") {
    return bestStreak >= 7;
  }

  if (id === "reward:streak-30") {
    return bestStreak >= 30;
  }

  if (id === "reward:sleep-30-total") {
    return (tagTotals.sleep ?? 0) >= 30;
  }

  if (id === "reward:run-40-total") {
    return (tagTotals.run ?? 0) >= 40;
  }

  if (id === "reward:workout-run-7") {
    return (tagStreaks.workout ?? 0) >= 7 && (tagStreaks.run ?? 0) >= 7;
  }

  if (id === "reward:five-daily-7") {
    return tasks.filter((task) => task.id && getLongestRewardStreak(state.completionDatesByTask?.[task.id] ?? []) >= 7).length >= 5;
  }

  if (id.startsWith("level:")) {
    const requiredLevel = Number(id.replace("level:", ""));
    return Number.isFinite(requiredLevel) && getLevelSnapshot(Math.max(0, Number(state.totalXp) || 0)).level >= requiredLevel;
  }

  if (id.startsWith("medal:")) {
    const [, tag, tier] = id.split(":");
    const medal = medalThresholds.find((item) => item.tag === tag && item.tier === tier);
    return medal ? (tagStreaks[tag] ?? 0) >= medal.days : false;
  }

  return false;
}

export function getPendingRewardIds(state: RewardDailyState, claimed: Set<string>) {
  return [
    ...generalRewardIds,
    ...avatarLevelRewards.map((reward) => `level:${reward.level}`),
    ...medalThresholds.map((medal) => `medal:${medal.tag}:${medal.tier}`)
  ].filter((id) => isRewardClaimEligible(id, state) && !claimed.has(id));
}

export function reconcileClaimedRewards<TState extends RewardDailyState>(state: TState, claimed: Set<string>) {
  const nextClaimed = new Set(claimed);
  let nextState = { ...state, totalXp: Math.max(0, Number(state.totalXp) || 0) };
  let changed = false;
  let removed = true;

  while (removed) {
    removed = false;

    for (const id of Array.from(nextClaimed)) {
      if (isRewardClaimEligible(id, nextState)) {
        continue;
      }

      nextClaimed.delete(id);
      nextState = {
        ...nextState,
        totalXp: Math.max(0, (Number(nextState.totalXp) || 0) - getClaimedRewardXp(id))
      };
      changed = true;
      removed = true;
    }
  }

  return { state: nextState as TState, claimed: nextClaimed, changed };
}

export function loadClaimedRewardsFromStorage() {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  try {
    const saved = JSON.parse(window.localStorage.getItem(CLAIMED_REWARDS_KEY) ?? "[]") as unknown;
    return new Set(Array.isArray(saved) ? saved.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set<string>();
  }
}

export function saveClaimedRewardsToStorage(claimed: Set<string>) {
  window.localStorage.setItem(CLAIMED_REWARDS_KEY, JSON.stringify(Array.from(claimed)));
}

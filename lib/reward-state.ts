import { avatarLevelRewards } from "@/lib/avatar";
import { getLevelSnapshot } from "@/lib/levels";
import { getStoredTaskTag, getTaskTagLabel, type TaskTag } from "@/lib/task-tags";

export const CLAIMED_REWARDS_KEY = "sopro-ducktive-claimed-rewards-v1";

export type RewardStateTask = {
  id?: string;
  title?: string;
  icon?: string;
};

export type RewardDailyState = {
  tasks?: RewardStateTask[];
  completedTaskIds?: string[];
  completionDatesByTask?: Record<string, string[]>;
  totalXp?: number;
};

type GeneralRewardCriterion =
  | { kind: "daily-all" }
  | { kind: "any-task-streak"; days: number }
  | { kind: "tag-streak"; tags: TaskTag[]; days: number }
  | { kind: "simultaneous-task-streak"; taskCount: number; days: number };

export type GeneralRewardDefinition = {
  id: string;
  description: string;
  criterion: GeneralRewardCriterion;
};

export type GeneralRewardProgressItem = {
  label: string;
  current: number;
  target: number;
  unit: "days" | "tasks";
};

export const generalRewardDefinitions: GeneralRewardDefinition[] = [
  { id: "daily-all", description: "Complete all your daily tasks", criterion: { kind: "daily-all" } },
  { id: "streak-7", description: "Get a 7 day streak on any task", criterion: { kind: "any-task-streak", days: 7 } },
  { id: "streak-30", description: "Get a 30 day streak on any task", criterion: { kind: "any-task-streak", days: 30 } },
  { id: "sleep-30-total", description: "Get a 21 day Wake up streak", criterion: { kind: "tag-streak", tags: ["wake-up"], days: 21 } },
  { id: "run-40-total", description: "Have a Workout and Run streak of 14 or more", criterion: { kind: "tag-streak", tags: ["workout", "run"], days: 14 } },
  { id: "workout-run-7", description: "Have a Workout, Run, and Meditate streak of 5 or more", criterion: { kind: "tag-streak", tags: ["workout", "run", "meditate"], days: 5 } },
  { id: "five-daily-7", description: "Have a streak of 7 or more on any 5 tasks at one time", criterion: { kind: "simultaneous-task-streak", taskCount: 5, days: 7 } }
];

export const generalRewardXp: Record<string, number> = {
  "reward:daily-all": 5,
  "reward:streak-7": 50,
  "reward:streak-30": 500
};

const generalRewardIds = generalRewardDefinitions.map((reward) => `reward:${reward.id}`);

const medalThresholds: Array<{ tag: string; tier: "Bronze" | "Silver" | "Gold"; completions: number }> = [
  { tag: "run", tier: "Bronze", completions: 7 },
  { tag: "run", tier: "Silver", completions: 30 },
  { tag: "run", tier: "Gold", completions: 60 },
  { tag: "workout", tier: "Bronze", completions: 7 },
  { tag: "workout", tier: "Silver", completions: 30 },
  { tag: "workout", tier: "Gold", completions: 60 },
  { tag: "wake-up", tier: "Bronze", completions: 7 },
  { tag: "wake-up", tier: "Silver", completions: 30 },
  { tag: "wake-up", tier: "Gold", completions: 60 },
  { tag: "read", tier: "Bronze", completions: 7 },
  { tag: "read", tier: "Silver", completions: 30 },
  { tag: "read", tier: "Gold", completions: 60 },
  { tag: "meditate", tier: "Bronze", completions: 7 },
  { tag: "meditate", tier: "Silver", completions: 30 },
  { tag: "meditate", tier: "Gold", completions: 60 }
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
    const tag = getStoredTaskTag(task);
    if (!task.id || !tag) {
      return streaks;
    }

    streaks[tag] = Math.max(streaks[tag] ?? 0, getLongestRewardStreak(completionDatesByTask[task.id] ?? []));
    return streaks;
  }, {});
}

export function getRewardTagTotals(state: RewardDailyState) {
  const tasks = Array.isArray(state.tasks) ? state.tasks : [];
  const completionDatesByTask =
    state.completionDatesByTask && typeof state.completionDatesByTask === "object" ? state.completionDatesByTask : {};

  return tasks.reduce<Record<string, number>>((totals, task) => {
    const tag = getStoredTaskTag(task);
    if (!task.id || !tag) {
      return totals;
    }

    totals[tag] = (totals[tag] ?? 0) + (completionDatesByTask[task.id]?.length ?? 0);
    return totals;
  }, {});
}

function getBestTaskStreak(state: RewardDailyState) {
  const tasks = Array.isArray(state.tasks) ? state.tasks : [];
  return Math.max(0, ...tasks.map((task) => getLongestRewardStreak(task.id ? state.completionDatesByTask?.[task.id] ?? [] : [])));
}

function getMaxSimultaneousTaskStreakCount(state: RewardDailyState, requiredDays: number) {
  const tasks = Array.isArray(state.tasks) ? state.tasks : [];
  const qualifyingTasksByDate = new Map<string, number>();

  for (const task of tasks) {
    if (!task.id) {
      continue;
    }

    const sortedDates = Array.from(new Set(state.completionDatesByTask?.[task.id] ?? [])).sort();
    let consecutiveDays = 0;
    let previousDate: string | null = null;

    for (const date of sortedDates) {
      consecutiveDays = previousDate && daysBetween(previousDate, date) === 1 ? consecutiveDays + 1 : 1;
      if (consecutiveDays >= requiredDays) {
        qualifyingTasksByDate.set(date, (qualifyingTasksByDate.get(date) ?? 0) + 1);
      }
      previousDate = date;
    }
  }

  return Math.max(0, ...qualifyingTasksByDate.values());
}

export function getGeneralRewardProgress(id: string, state: RewardDailyState): GeneralRewardProgressItem[] {
  const reward = generalRewardDefinitions.find((item) => item.id === id.replace(/^reward:/, ""));
  if (!reward) {
    return [];
  }
  const criterion = reward.criterion;

  if (criterion.kind === "daily-all") {
    const tasks = Array.isArray(state.tasks) ? state.tasks.filter((task) => task.id) : [];
    const completedTaskIds = new Set(Array.isArray(state.completedTaskIds) ? state.completedTaskIds : []);
    return [{
      label: "Daily tasks completed",
      current: tasks.filter((task) => task.id && completedTaskIds.has(task.id)).length,
      target: tasks.length,
      unit: "tasks"
    }];
  }

  if (criterion.kind === "any-task-streak") {
    return [{
      label: "Best task streak",
      current: getBestTaskStreak(state),
      target: criterion.days,
      unit: "days"
    }];
  }

  if (criterion.kind === "tag-streak") {
    const tagStreaks = getRewardTagStreaks(state);
    return criterion.tags.map((tag) => ({
      label: `${getTaskTagLabel(tag) ?? tag} streak`,
      current: tagStreaks[tag] ?? 0,
      target: criterion.days,
      unit: "days"
    }));
  }

  return [{
    label: `Tasks with a ${criterion.days}+ day streak at one time`,
    current: getMaxSimultaneousTaskStreakCount(state, criterion.days),
    target: criterion.taskCount,
    unit: "tasks"
  }];
}

export function getClaimedRewardXp(id: string) {
  return generalRewardXp[id] ?? 0;
}

export function isRewardClaimEligible(id: string, state: RewardDailyState) {
  const tagTotals = getRewardTagTotals(state);
  const generalReward = generalRewardDefinitions.find((reward) => `reward:${reward.id}` === id);

  if (generalReward) {
    const progress = getGeneralRewardProgress(generalReward.id, state);
    return progress.length > 0 && progress.every((item) => item.target > 0 && item.current >= item.target);
  }

  if (id.startsWith("level:")) {
    const requiredLevel = Number(id.replace("level:", ""));
    return Number.isFinite(requiredLevel) && getLevelSnapshot(Math.max(0, Number(state.totalXp) || 0)).level >= requiredLevel;
  }

  if (id.startsWith("medal:")) {
    const [, tag, tier] = id.split(":");
    const medal = medalThresholds.find((item) => item.tag === tag && item.tier === tier);
    return medal ? (tagTotals[tag] ?? 0) >= medal.completions : false;
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
  // Claimed achievements are permanent. Their original eligibility can be
  // temporary (for example, completing every daily task), but once claimed
  // they must remain unlocked on future days.
  return {
    state: { ...state, totalXp: Math.max(0, Number(state.totalXp) || 0) } as TState,
    claimed: new Set(claimed),
    changed: false
  };
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

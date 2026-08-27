import { avatarLevelRewards } from "@/lib/avatar";
import { getLevelSnapshot } from "@/lib/levels";
import { getStoredTaskTag, getTaskTagLabel, normalizeTaskTag, type TaskTag } from "@/lib/task-tags";

export const CLAIMED_REWARDS_KEY = "sopro-ducktive-claimed-rewards-v1";
export const RECURRING_REWARDS_KEY = "sopro-ducktive-recurring-rewards-v1";

export type RecurringRewardState = Record<string, string>;

export type RewardStateTask = {
  id?: string;
  title?: string;
  icon?: string;
};

export type RewardDailyState = {
  tasks?: RewardStateTask[];
  completedTaskIds?: string[];
  completionDatesByTask?: Record<string, string[]>;
  completionTagsByTask?: Record<string, string>;
  totalXp?: number;
};

type GeneralRewardCriterion =
  | { kind: "any-task-streak"; days: number }
  | { kind: "tag-streak"; tags: TaskTag[]; days: number }
  | { kind: "simultaneous-task-streak"; taskCount: number; days: number }
  | { kind: "total-task-completions"; count: number }
  | { kind: "recurring-task-completions"; count: number }
  | { kind: "tag-completions"; tags: TaskTag[]; count: number }
  | { kind: "tag-total-and-streak"; totalTag: TaskTag; totalCount: number; streakTag: TaskTag; streakDays: number };

export type GeneralRewardDefinition = {
  id: string;
  description: string;
  criterion: GeneralRewardCriterion;
  recurring?: boolean;
  cooldownDays?: number;
};

export type GeneralRewardProgressItem = {
  label: string;
  current: number;
  target: number;
  unit: "days" | "tasks";
};

export const generalRewardDefinitions: GeneralRewardDefinition[] = [
  { id: "weekly-streak-7", description: "Weekly streak - Have a 7 day streak on any task", criterion: { kind: "any-task-streak", days: 7 }, recurring: true, cooldownDays: 7 },
  { id: "tasks-recurring-30", description: "Complete 30 tasks", criterion: { kind: "recurring-task-completions", count: 30 }, recurring: true },
  { id: "tasks-total-50", description: "Complete 50 tasks in total", criterion: { kind: "total-task-completions", count: 50 } },
  { id: "tasks-total-100", description: "Complete 100 tasks in total", criterion: { kind: "total-task-completions", count: 100 } },
  { id: "tasks-total-500", description: "Complete 500 tasks in total", criterion: { kind: "total-task-completions", count: 500 } },
  { id: "tasks-total-1000", description: "Complete 1,000 tasks in total", criterion: { kind: "total-task-completions", count: 1000 } },
  { id: "all-tags-20", description: "Complete 20 of each task: Workout, Run, Read, Wake up, Meditate, Garden, Work", criterion: { kind: "tag-completions", tags: ["workout", "run", "read", "wake-up", "meditate", "garden", "work"], count: 20 } },
  { id: "run-25-workout-streak-7", description: "Complete 25 Run tasks in total and have a streak of 7 Workout tasks", criterion: { kind: "tag-total-and-streak", totalTag: "run", totalCount: 25, streakTag: "workout", streakDays: 7 } },
  { id: "streak-30", description: "Get a 30 day streak on any task", criterion: { kind: "any-task-streak", days: 30 } },
  { id: "garden-streak-14", description: "Have a 14 day streak of Garden tasks", criterion: { kind: "tag-streak", tags: ["garden"], days: 14 } },
  { id: "meditate-streak-14", description: "Have a 14 day streak of Meditate tasks", criterion: { kind: "tag-streak", tags: ["meditate"], days: 14 } },
  { id: "read-streak-14", description: "Have a 14 day streak of Read tasks", criterion: { kind: "tag-streak", tags: ["read"], days: 14 } },
  { id: "wake-read-garden-5", description: "Have a 5 day streak of Wake up, Read, and Garden", criterion: { kind: "tag-streak", tags: ["wake-up", "read", "garden"], days: 5 } },
  { id: "wake-workout-run-14", description: "Have a 14 day streak of Wake up, Workout, and Run", criterion: { kind: "tag-streak", tags: ["wake-up", "workout", "run"], days: 14 } },
  { id: "sleep-30-total", description: "Get a 21 day Wake up streak", criterion: { kind: "tag-streak", tags: ["wake-up"], days: 21 } },
  { id: "run-40-total", description: "Have a Workout and Run streak of 14 or more", criterion: { kind: "tag-streak", tags: ["workout", "run"], days: 14 } },
  { id: "workout-run-7", description: "Have a Workout, Run, and Meditate streak of 5 or more", criterion: { kind: "tag-streak", tags: ["workout", "run", "meditate"], days: 5 } },
  { id: "five-daily-7", description: "Have a streak of 7 or more on any 5 tasks at one time", criterion: { kind: "simultaneous-task-streak", taskCount: 5, days: 7 } }
];

export const generalRewardXp: Record<string, number> = {
  "reward:weekly-streak-7": 30,
  "reward:tasks-recurring-30": 30,
  "reward:tasks-total-50": 50,
  "reward:tasks-total-100": 100,
  "reward:tasks-total-500": 500,
  "reward:tasks-total-1000": 1000,
  "reward:all-tags-20": 150,
  "reward:streak-30": 500,
  "reward:garden-streak-14": 30,
  "reward:meditate-streak-14": 30,
  "reward:read-streak-14": 30,
  "reward:wake-read-garden-5": 30,
  "reward:wake-workout-run-14": 50,
  "reward:sleep-30-total": 30,
  "reward:run-40-total": 30,
  "reward:workout-run-7": 30,
  "reward:five-daily-7": 50,
  "reward:run-25-workout-streak-7": 30
};

const generalRewardIds = generalRewardDefinitions.map((reward) => `reward:${reward.id}`);
const retiredRewardIds = new Set(["reward:daily-all", "reward:daily-tasks-5", "reward:streak-7"]);

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
  const tasksById = new Map(tasks.filter((task) => task.id).map((task) => [task.id as string, task]));

  return Object.entries(completionDatesByTask).reduce<Record<string, number>>((totals, [taskId, dates]) => {
    const currentTask = tasksById.get(taskId);
    const tag = currentTask
      ? getStoredTaskTag(currentTask)
      : normalizeTaskTag(state.completionTagsByTask?.[taskId]);
    if (!tag) {
      return totals;
    }

    totals[tag] = (totals[tag] ?? 0) + new Set(Array.isArray(dates) ? dates : []).size;
    return totals;
  }, {});
}

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isLocalDateKey(value?: string) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getBestTaskStreak(state: RewardDailyState, afterDate?: string) {
  const tasks = Array.isArray(state.tasks) ? state.tasks : [];
  return Math.max(0, ...tasks.map((task) => {
    const completionDates = task.id ? state.completionDatesByTask?.[task.id] ?? [] : [];
    return getLongestRewardStreak(afterDate ? completionDates.filter((date) => date > afterDate) : completionDates);
  }));
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

function getTotalTaskCompletions(state: RewardDailyState) {
  const completionDatesByTask =
    state.completionDatesByTask && typeof state.completionDatesByTask === "object" ? state.completionDatesByTask : {};

  return Object.values(completionDatesByTask).reduce(
    (total, dates) => total + new Set(Array.isArray(dates) ? dates : []).size,
    0
  );
}

function getRecurringCompletionBaseline(value?: string) {
  if (!value?.startsWith("count:")) {
    return 0;
  }

  const baseline = Number(value.slice("count:".length));
  return Number.isFinite(baseline) ? Math.max(0, baseline) : 0;
}

export function getGeneralRewardProgress(
  id: string,
  state: RewardDailyState,
  recurringRewards: RecurringRewardState = {}
): GeneralRewardProgressItem[] {
  const normalizedId = id.replace(/^reward:/, "");
  const rewardId = `reward:${normalizedId}`;
  const reward = generalRewardDefinitions.find((item) => item.id === normalizedId);
  if (!reward) {
    return [];
  }
  const criterion = reward.criterion;

  if (criterion.kind === "any-task-streak") {
    const lastClaimDate = reward.recurring && isLocalDateKey(recurringRewards[rewardId])
      ? recurringRewards[rewardId]
      : undefined;
    const bestTaskStreak = getBestTaskStreak(state, lastClaimDate);
    const cooldownProgress = reward.cooldownDays && lastClaimDate
      ? daysBetween(lastClaimDate, localDateKey())
      : bestTaskStreak;

    return [{
      label: "Best task streak",
      current: Math.min(bestTaskStreak, cooldownProgress),
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

  if (criterion.kind === "tag-completions") {
    const tagTotals = getRewardTagTotals(state);
    return criterion.tags.map((tag) => ({
      label: `${getTaskTagLabel(tag) ?? tag} tasks completed`,
      current: tagTotals[tag] ?? 0,
      target: criterion.count,
      unit: "tasks"
    }));
  }

  if (criterion.kind === "tag-total-and-streak") {
    const tagTotals = getRewardTagTotals(state);
    const tagStreaks = getRewardTagStreaks(state);
    return [
      {
        label: `${getTaskTagLabel(criterion.totalTag) ?? criterion.totalTag} tasks completed in total`,
        current: tagTotals[criterion.totalTag] ?? 0,
        target: criterion.totalCount,
        unit: "tasks"
      },
      {
        label: `${getTaskTagLabel(criterion.streakTag) ?? criterion.streakTag} streak`,
        current: tagStreaks[criterion.streakTag] ?? 0,
        target: criterion.streakDays,
        unit: "days"
      }
    ];
  }

  if (criterion.kind === "total-task-completions") {
    return [{
      label: "Tasks completed in total",
      current: getTotalTaskCompletions(state),
      target: criterion.count,
      unit: "tasks"
    }];
  }

  if (criterion.kind === "recurring-task-completions") {
    const totalCompletions = getTotalTaskCompletions(state);
    const claimedCompletions = getRecurringCompletionBaseline(recurringRewards[rewardId]);
    return [{
      label: "Tasks completed toward the next claim",
      current: Math.max(0, totalCompletions - claimedCompletions),
      target: criterion.count,
      unit: "tasks"
    }];
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

export function isRecurringReward(id: string) {
  const normalizedId = id.replace(/^reward:/, "");
  return generalRewardDefinitions.some((reward) => reward.id === normalizedId && reward.recurring);
}

export function isRetiredRewardId(id: string) {
  return retiredRewardIds.has(id);
}

export function isRewardClaimEligible(id: string, state: RewardDailyState, recurringRewards: RecurringRewardState = {}) {
  const tagTotals = getRewardTagTotals(state);
  const generalReward = generalRewardDefinitions.find((reward) => `reward:${reward.id}` === id);

  if (generalReward) {
    const lastClaimDate = recurringRewards[id];
    if (
      generalReward.cooldownDays
      && isLocalDateKey(lastClaimDate)
      && daysBetween(lastClaimDate, localDateKey()) < generalReward.cooldownDays
    ) {
      return false;
    }

    const progress = getGeneralRewardProgress(generalReward.id, state, recurringRewards);
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

export function getPendingRewardIds(
  state: RewardDailyState,
  claimed: Set<string>,
  recurringRewards: RecurringRewardState = {}
) {
  return [
    ...generalRewardIds,
    ...avatarLevelRewards.map((reward) => `level:${reward.level}`),
    ...medalThresholds.map((medal) => `medal:${medal.tag}:${medal.tier}`)
  ].filter((id) => isRewardClaimEligible(id, state, recurringRewards) && (isRecurringReward(id) || !claimed.has(id)));
}

export function reconcileClaimedRewards<TState extends RewardDailyState>(state: TState, claimed: Set<string>) {
  const nextClaimed = new Set(Array.from(claimed).filter((id) => !isRetiredRewardId(id) && !isRecurringReward(id)));
  return {
    state: { ...state, totalXp: Math.max(0, Number(state.totalXp) || 0) } as TState,
    claimed: nextClaimed,
    changed: nextClaimed.size !== claimed.size
  };
}

export function loadClaimedRewardsFromStorage() {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  try {
    const saved = JSON.parse(window.localStorage.getItem(CLAIMED_REWARDS_KEY) ?? "[]") as unknown;
    const validIds = Array.isArray(saved)
      ? saved.filter((id): id is string => typeof id === "string" && !isRetiredRewardId(id) && !isRecurringReward(id))
      : [];
    if (Array.isArray(saved) && validIds.length !== saved.length) {
      window.localStorage.setItem(CLAIMED_REWARDS_KEY, JSON.stringify(validIds));
    }
    return new Set(validIds);
  } catch {
    return new Set<string>();
  }
}

export function saveClaimedRewardsToStorage(claimed: Set<string>) {
  window.localStorage.setItem(
    CLAIMED_REWARDS_KEY,
    JSON.stringify(Array.from(claimed).filter((id) => !isRetiredRewardId(id) && !isRecurringReward(id)))
  );
}

export function loadRecurringRewardsFromStorage(): RecurringRewardState {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const saved = JSON.parse(window.localStorage.getItem(RECURRING_REWARDS_KEY) ?? "{}") as unknown;
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(saved).filter(([id, date]) => isRecurringReward(id) && typeof date === "string")
    ) as RecurringRewardState;
  } catch {
    return {};
  }
}

export function saveRecurringRewardsToStorage(state: RecurringRewardState) {
  window.localStorage.setItem(RECURRING_REWARDS_KEY, JSON.stringify(state));
}

export function resetRecurringRewardAfterClaim(
  id: string,
  state: RecurringRewardState,
  date = new Date()
): RecurringRewardState {
  const rewardId = id.startsWith("reward:") ? id : `reward:${id}`;
  const reward = generalRewardDefinitions.find((item) => `reward:${item.id}` === rewardId);
  if (reward?.criterion.kind === "recurring-task-completions") {
    const nextBaseline = getRecurringCompletionBaseline(state[rewardId]) + reward.criterion.count;
    return { ...state, [rewardId]: `count:${nextBaseline}` };
  }
  return { ...state, [rewardId]: localDateKey(date) };
}

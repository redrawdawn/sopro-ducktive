"use client";

import { getLevelSnapshot } from "@/lib/levels";
import { createClient } from "@/lib/supabase/client";
import { getStoredAvatarConfig, normalizeAvatarConfig, type AvatarConfig } from "@/lib/avatar";
import { getRewardTagTotals, isRecurringReward, isRetiredRewardId } from "@/lib/reward-state";

const DAILY_STORAGE_KEY = "sopro-ducktive-daily-v1";
const CLAIMED_REWARDS_KEY = "sopro-ducktive-claimed-rewards-v1";
const BACKUP_USER_KEY = "motive-backup-user-id";
export const PUBLIC_PROFILE_KEY = "motive-public-profile-enabled";
export const PUBLIC_PROFILE_NAME_KEY = "motive-public-profile-name";

type StoredTask = {
  id?: string;
  title?: string;
  icon?: string;
};

type StoredDailyState = {
  tasks?: StoredTask[];
  completionDatesByTask?: Record<string, string[]>;
  completionTagsByTask?: Record<string, string>;
  totalXp?: number;
};

export type PublicProfileMedal = {
  tag: string;
  tier: "Bronze" | "Silver" | "Gold";
};

export type PublicProfile = {
  id: string;
  name: string;
  level: number;
  rewards: number;
  totalTasksCompleted: number;
  avatarConfig: AvatarConfig;
  currentHighestStreak: number;
  medals: PublicProfileMedal[];
};

type PublicProfileRow = {
  user_id: string;
  display_name: string | null;
  avatar_config: unknown;
  level: number | null;
  achievements_count: number | null;
  total_tasks_completed?: number | null;
  highest_streak?: number | null;
  medals: unknown;
};

type PublicAvatarPayload = Partial<AvatarConfig> & {
  motive_profile_stats?: {
    total_tasks_completed?: unknown;
  };
};

export function isPublicProfileEnabled() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(PUBLIC_PROFILE_KEY) === "true";
}

export function setPublicProfileEnabled(enabled: boolean) {
  window.localStorage.setItem(PUBLIC_PROFILE_KEY, String(enabled));
  window.dispatchEvent(new CustomEvent("motive-public-profile-change"));
}

export function getStoredPublicDisplayName() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(PUBLIC_PROFILE_NAME_KEY)?.trim() ?? "";
}

export function savePublicDisplayName(name: string) {
  window.localStorage.setItem(PUBLIC_PROFILE_NAME_KEY, name.trim().slice(0, 24));
  window.dispatchEvent(new CustomEvent("motive-public-profile-change"));
}

function parseDailyState(): StoredDailyState {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const saved = JSON.parse(window.localStorage.getItem(DAILY_STORAGE_KEY) ?? "{}") as StoredDailyState;
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(dateKey: string, amount: number) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return localDateKey(date);
}

function getCurrentStreak(completionDates: string[] = [], date = new Date()) {
  const completedDates = new Set(completionDates);
  const today = localDateKey(date);
  let cursor = completedDates.has(today) ? today : addDays(today, -1);
  let streak = 0;

  while (completedDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function getClaimedRewardCount() {
  if (typeof window === "undefined") {
    return 0;
  }

  try {
    const saved = JSON.parse(window.localStorage.getItem(CLAIMED_REWARDS_KEY) ?? "[]") as unknown;
    return Array.isArray(saved)
      ? saved.filter((id) => typeof id === "string" && !isRetiredRewardId(id) && !isRecurringReward(id)).length
      : 0;
  } catch {
    return 0;
  }
}

function buildMedals(state: StoredDailyState) {
  const tagTotals = getRewardTagTotals(state);

  return ["workout", "read", "run", "wake-up", "meditate"].flatMap<PublicProfileMedal>((tag) => {
    const total = tagTotals[tag] ?? 0;
    if (total >= 60) return [{ tag, tier: "Gold" as const }];
    if (total >= 30) return [{ tag, tier: "Silver" as const }];
    if (total >= 7) return [{ tag, tier: "Bronze" as const }];
    return [];
  });
}

export function getTotalTasksCompleted(state: StoredDailyState) {
  const completionDatesByTask =
    state.completionDatesByTask && typeof state.completionDatesByTask === "object" ? state.completionDatesByTask : {};

  return Object.values(completionDatesByTask).reduce(
    (total, dates) => total + new Set(Array.isArray(dates) ? dates : []).size,
    0
  );
}

export function getCurrentHighestStreak(state: StoredDailyState, date = new Date()) {
  const tasks = Array.isArray(state.tasks) ? state.tasks : [];
  const completionDatesByTask =
    state.completionDatesByTask && typeof state.completionDatesByTask === "object" ? state.completionDatesByTask : {};

  return tasks.reduce(
    (best, task) => Math.max(best, task.id ? getCurrentStreak(completionDatesByTask[task.id] ?? [], date) : 0),
    0
  );
}

function normalizeMedals(value: unknown): PublicProfileMedal[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((medal) => {
      const maybeMedal = medal as Partial<PublicProfileMedal>;
      if (
        typeof maybeMedal.tag !== "string" ||
        !["Bronze", "Silver", "Gold"].includes(String(maybeMedal.tier))
      ) {
        return null;
      }

      return { tag: maybeMedal.tag, tier: maybeMedal.tier as PublicProfileMedal["tier"] };
    })
    .filter((medal): medal is PublicProfileMedal => medal !== null);
}

function getEmbeddedTotalTasksCompleted(value: unknown) {
  const total = Number((value as PublicAvatarPayload | null)?.motive_profile_stats?.total_tasks_completed);
  return Number.isFinite(total) && total >= 0 ? Math.floor(total) : null;
}

export function buildPublicProfileSnapshot() {
  const state = parseDailyState();
  const level = getLevelSnapshot(Math.max(0, Number(state.totalXp) || 0)).level;
  const medals = buildMedals(state);
  const currentHighestStreak = getCurrentHighestStreak(state);
  const totalTasksCompleted = getTotalTasksCompleted(state);

  return {
    display_name: getStoredPublicDisplayName() || "Name soon",
    avatar_config: {
      ...getStoredAvatarConfig(),
      motive_profile_stats: { total_tasks_completed: totalTasksCompleted }
    },
    level,
    total_xp: Math.max(0, Number(state.totalXp) || 0),
    achievements_count: getClaimedRewardCount(),
    total_tasks_completed: totalTasksCompleted,
    highest_streak: currentHighestStreak,
    medals
  };
}

export async function syncCurrentPublicProfile(
  supabase = createClient(),
  userId?: string
) {
  if (typeof window === "undefined") {
    return;
  }

  const resolvedUserId = userId ?? (await supabase.auth.getUser()).data.user?.id;
  if (!resolvedUserId) {
    return;
  }

  if (!isPublicProfileEnabled()) {
    const { error } = await supabase.from("app_public_profiles").delete().eq("user_id", resolvedUserId);
    if (error) {
      console.warn("Motive public profile privacy sync failed", error.message);
    }
    return;
  }

  const snapshot = buildPublicProfileSnapshot();
  const profileRow = {
    user_id: resolvedUserId,
    is_public: true,
    ...snapshot,
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase.from("app_public_profiles").upsert(
    profileRow,
    { onConflict: "user_id" }
  );

  if (error) {
    if (error.message.toLowerCase().includes("total_tasks_completed")) {
      const legacyProfileRow = Object.fromEntries(
        Object.entries(profileRow).filter(([key]) => key !== "total_tasks_completed")
      );
      const legacyResult = await supabase.from("app_public_profiles").upsert(legacyProfileRow, { onConflict: "user_id" });
      if (!legacyResult.error) {
        return;
      }
    }
    console.warn("Motive public profile sync failed", error.message);
  }
}

export async function loadOtherPublicProfiles(limit = 20) {
  const supabase = createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) {
    return [];
  }

  // Account restoration runs alongside the page on first load. Only publish the
  // browser snapshot once it has been confirmed to belong to this signed-in user.
  if (window.localStorage.getItem(BACKUP_USER_KEY) === userId) {
    await syncCurrentPublicProfile(supabase, userId);
  }

  let includeTotalTasks = true;
  let includeHighestStreak = true;
  let profiles: PublicProfileRow[] | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const fields = [
      "user_id",
      "display_name",
      "avatar_config",
      "level",
      "achievements_count",
      ...(includeTotalTasks ? ["total_tasks_completed"] : []),
      ...(includeHighestStreak ? ["highest_streak"] : []),
      "medals"
    ].join(", ");
    const result = await supabase
      .from("app_public_profiles")
      .select(fields)
      .eq("is_public", true)
      .neq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (!result.error) {
      profiles = result.data as unknown as PublicProfileRow[];
      break;
    }

    const message = result.error.message.toLowerCase();
    let retry = false;
    if (includeTotalTasks && message.includes("total_tasks_completed")) {
      includeTotalTasks = false;
      retry = true;
    }
    if (includeHighestStreak && message.includes("highest_streak")) {
      includeHighestStreak = false;
      retry = true;
    }
    if (!retry) {
      console.warn("Motive public profiles unavailable", result.error.message);
      return [];
    }
  }

  return (profiles ?? []).map((profile) => {
    const embeddedTotal = getEmbeddedTotalTasksCompleted(profile.avatar_config);

    return {
      id: profile.user_id,
      name: profile.display_name?.trim() || "Name soon",
      level: Math.max(1, Number(profile.level) || 1),
      rewards: Math.max(0, Number(profile.achievements_count) || 0),
      totalTasksCompleted: embeddedTotal ?? (includeTotalTasks ? Math.max(0, Number(profile.total_tasks_completed) || 0) : 0),
      avatarConfig: normalizeAvatarConfig(profile.avatar_config),
      currentHighestStreak: includeHighestStreak ? Math.max(0, Number(profile.highest_streak) || 0) : 0,
      medals: normalizeMedals(profile.medals)
    };
  });
}

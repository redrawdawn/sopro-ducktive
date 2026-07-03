"use client";

import { getLevelSnapshot } from "@/lib/levels";
import { createClient } from "@/lib/supabase/client";
import { getStoredAvatarConfig, normalizeAvatarConfig, type AvatarConfig } from "@/lib/avatar";

const DAILY_STORAGE_KEY = "sopro-ducktive-daily-v1";
const CLAIMED_REWARDS_KEY = "sopro-ducktive-claimed-rewards-v1";
export const PUBLIC_PROFILE_KEY = "motive-public-profile-enabled";
export const PUBLIC_PROFILE_NAME_KEY = "motive-public-profile-name";

type StoredTask = {
  id?: string;
  icon?: string;
};

type StoredDailyState = {
  tasks?: StoredTask[];
  completionDatesByTask?: Record<string, string[]>;
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
  achievements: number;
  avatarConfig: AvatarConfig;
  highestStreak: number;
  medals: PublicProfileMedal[];
};

type PublicProfileRow = {
  user_id: string;
  display_name: string | null;
  avatar_config: unknown;
  level: number | null;
  achievements_count: number | null;
  highest_streak?: number | null;
  medals: unknown;
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

function getClaimedAchievementCount() {
  if (typeof window === "undefined") {
    return 0;
  }

  try {
    const saved = JSON.parse(window.localStorage.getItem(CLAIMED_REWARDS_KEY) ?? "[]") as unknown;
    return Array.isArray(saved) ? saved.filter((id) => typeof id === "string").length : 0;
  } catch {
    return 0;
  }
}

function buildMedals(state: StoredDailyState) {
  const tasks = Array.isArray(state.tasks) ? state.tasks : [];
  const completionDatesByTask =
    state.completionDatesByTask && typeof state.completionDatesByTask === "object" ? state.completionDatesByTask : {};
  const tagStreaks = tasks.reduce<Record<string, number>>((streaks, task) => {
    if (!task.id || !task.icon) return streaks;
    streaks[task.icon] = Math.max(streaks[task.icon] ?? 0, getLongestStreak(completionDatesByTask[task.id] ?? []));
    return streaks;
  }, {});

  return ["workout", "book", "run", "sleep", "mind"].flatMap<PublicProfileMedal>((tag) => {
    const streak = tagStreaks[tag] ?? 0;
    if (streak >= 60) return [{ tag, tier: "Gold" as const }];
    if (streak >= 30) return [{ tag, tier: "Silver" as const }];
    if (streak >= 7) return [{ tag, tier: "Bronze" as const }];
    return [];
  });
}

function getHighestStreak(state: StoredDailyState) {
  const completionDatesByTask =
    state.completionDatesByTask && typeof state.completionDatesByTask === "object" ? state.completionDatesByTask : {};

  return Object.values(completionDatesByTask).reduce(
    (best, dates) => Math.max(best, Array.isArray(dates) ? getLongestStreak(dates) : 0),
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

export function buildPublicProfileSnapshot() {
  const state = parseDailyState();
  const level = getLevelSnapshot(Math.max(0, Number(state.totalXp) || 0)).level;
  const medals = buildMedals(state);
  const highestStreak = getHighestStreak(state);

  return {
    display_name: getStoredPublicDisplayName() || "Name soon",
    avatar_config: getStoredAvatarConfig(),
    level,
    total_xp: Math.max(0, Number(state.totalXp) || 0),
    achievements_count: Math.max(getClaimedAchievementCount(), medals.length),
    highest_streak: highestStreak,
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
  const { error } = await supabase.from("app_public_profiles").upsert(
    {
      user_id: resolvedUserId,
      is_public: true,
      ...snapshot,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.warn("Motive public profile sync failed", error.message);
  }
}

export async function loadOtherPublicProfiles(limit = 20) {
  const supabase = createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) {
    return [];
  }

  await syncCurrentPublicProfile(supabase, userId);

  const { data, error } = await supabase
    .from("app_public_profiles")
    .select("user_id, display_name, avatar_config, level, achievements_count, highest_streak, medals")
    .eq("is_public", true)
    .neq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    const missingHighestStreak = error.message.toLowerCase().includes("highest_streak");
    if (!missingHighestStreak) {
      console.warn("Motive public profiles unavailable", error.message);
      return [];
    }

    const fallback = await supabase
      .from("app_public_profiles")
      .select("user_id, display_name, avatar_config, level, achievements_count, medals")
      .eq("is_public", true)
      .neq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (fallback.error) {
      console.warn("Motive public profiles unavailable", fallback.error.message);
      return [];
    }

    return (fallback.data as PublicProfileRow[]).map((profile) => ({
      id: profile.user_id,
      name: profile.display_name?.trim() || "Name soon",
      level: Math.max(1, Number(profile.level) || 1),
      achievements: Math.max(0, Number(profile.achievements_count) || 0),
      avatarConfig: normalizeAvatarConfig(profile.avatar_config),
      highestStreak: 0,
      medals: normalizeMedals(profile.medals)
    }));
  }

  return (data as PublicProfileRow[]).map((profile) => ({
    id: profile.user_id,
    name: profile.display_name?.trim() || "Name soon",
    level: Math.max(1, Number(profile.level) || 1),
    achievements: Math.max(0, Number(profile.achievements_count) || 0),
    avatarConfig: normalizeAvatarConfig(profile.avatar_config),
    highestStreak: Math.max(0, Number(profile.highest_streak) || 0),
    medals: normalizeMedals(profile.medals)
  }));
}

"use client";

import { createClient } from "@/lib/supabase/client";
import { syncCurrentPublicProfile } from "@/lib/public-profile";

const BACKUP_META_KEY = "motive-backup-updated-at";
const BACKUP_USER_KEY = "motive-backup-user-id";

const BACKUP_KEYS = [
  "sopro-ducktive-daily-v1",
  "sopro-ducktive-cycle-tasks-v1",
  "sopro-ducktive-theme",
  "sopro-ducktive-avatar-config-v1",
  "sopro-ducktive-avatar-paused",
  "sopro-ducktive-admin-unlocked",
  "sopro-ducktive-claimed-rewards-v1",
  "motive-public-profile-enabled",
  "motive-public-profile-name"
];

let backupTimeout: number | null = null;
let backupInFlight = false;
let backupQueued = false;

function notifyAccountStateChanged() {
  window.dispatchEvent(new Event("motive-account-state-change"));
  window.dispatchEvent(new Event("motive-rewards-claimed-change"));
  window.dispatchEvent(new Event("motive-public-profile-change"));
  window.dispatchEvent(new CustomEvent("sopro-avatar-config-change"));
}

function readStateSnapshot() {
  return Object.fromEntries(
    BACKUP_KEYS.map((key) => [key, window.localStorage.getItem(key)]).filter(([, value]) => value !== null)
  );
}

export function clearMotiveLocalState() {
  if (typeof window === "undefined") {
    return;
  }

  for (const key of [...BACKUP_KEYS, BACKUP_META_KEY, BACKUP_USER_KEY]) {
    window.localStorage.removeItem(key);
  }

  notifyAccountStateChanged();
}

export async function backupMotiveState() {
  if (typeof window === "undefined" || backupInFlight) {
    backupQueued = backupInFlight;
    return;
  }

  backupInFlight = true;

  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;

    if (!userId) {
      return;
    }

    const updatedAt = new Date().toISOString();
    const state = {
      ...readStateSnapshot(),
      [BACKUP_META_KEY]: updatedAt,
      [BACKUP_USER_KEY]: userId
    };

    const { error } = await supabase
      .from("app_user_state")
      .upsert({ user_id: userId, state, updated_at: updatedAt }, { onConflict: "user_id" });

    if (!error) {
      window.localStorage.setItem(BACKUP_META_KEY, updatedAt);
      window.localStorage.setItem(BACKUP_USER_KEY, userId);
      void syncCurrentPublicProfile(supabase, userId);
    } else {
      console.warn("Motive backup failed", error.message);
    }
  } catch (error) {
    console.warn("Motive backup failed", error);
  } finally {
    backupInFlight = false;
    if (backupQueued) {
      backupQueued = false;
      scheduleMotiveBackup(750);
    }
  }
}

export function scheduleMotiveBackup(delay = 250) {
  if (typeof window === "undefined") {
    return;
  }

  if (backupTimeout !== null) {
    window.clearTimeout(backupTimeout);
  }

  backupTimeout = window.setTimeout(() => {
    backupTimeout = null;
    void backupMotiveState();
  }, delay);
}

type RestoreOptions = {
  preferCloud?: boolean;
};

export async function restoreMotiveStateFromBackup(options: RestoreOptions = {}) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      return false;
    }

    const localBackupUserId = window.localStorage.getItem(BACKUP_USER_KEY);

    if (localBackupUserId && localBackupUserId !== userId) {
      clearMotiveLocalState();
    }

    const { data, error } = await supabase
      .from("app_user_state")
      .select("state, updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data?.state) {
      if (!error) {
        clearMotiveLocalState();
        window.localStorage.setItem(BACKUP_USER_KEY, userId);
        notifyAccountStateChanged();
      }

      return false;
    }

    const cloudState = data.state as Record<string, string | null>;
    const localBackupAt = window.localStorage.getItem(BACKUP_META_KEY);
    const refreshedLocalBackupUserId = window.localStorage.getItem(BACKUP_USER_KEY);
    const hasLocalProgress = BACKUP_KEYS.some((key) => window.localStorage.getItem(key) !== null);
    const localBelongsToUser = refreshedLocalBackupUserId === userId;
    const cloudIsNewer = localBackupAt
      ? new Date(data.updated_at).getTime() > new Date(localBackupAt).getTime()
      : false;

    if (!options.preferCloud && hasLocalProgress && localBelongsToUser && !cloudIsNewer) {
      return false;
    }

    for (const key of BACKUP_KEYS) {
      window.localStorage.removeItem(key);
    }

    for (const key of BACKUP_KEYS) {
      const value = cloudState[key];
      if (typeof value === "string") {
        window.localStorage.setItem(key, value);
      }
    }

    window.localStorage.setItem(BACKUP_META_KEY, data.updated_at);
    window.localStorage.setItem(BACKUP_USER_KEY, userId);
    notifyAccountStateChanged();
    return true;
  } catch (error) {
    console.warn("Motive restore failed", error);
    return false;
  }
}

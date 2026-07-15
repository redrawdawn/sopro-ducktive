"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, Bed, BookOpen, Brain, CheckCircle2, Dumbbell, Flame, Footprints, Globe2, Pencil, Search, type LucideIcon } from "lucide-react";
import { getLevelSnapshot } from "@/lib/levels";
import {
  getStoredPublicDisplayName,
  isPublicProfileEnabled,
  loadOtherPublicProfiles,
  setPublicProfileEnabled,
  syncCurrentPublicProfile,
  type PublicProfile,
  type PublicProfileMedal
} from "@/lib/public-profile";
import { AvatarEditor } from "@/components/avatar-editor";
import { AvatarCharacter } from "@/components/avatar-character";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { XpProgressBar } from "@/components/xp-progress-bar";

type StoredDailyState = {
  tasks?: Array<{ id: string }>;
  completedTaskIds?: string[];
  completionDatesByTask?: Record<string, string[]>;
  totalXp?: number;
};

const STORAGE_KEY = "sopro-ducktive-daily-v1";

const medalIcons: Record<string, LucideIcon> = {
  book: BookOpen,
  mind: Brain,
  run: Footprints,
  sleep: Bed,
  workout: Dumbbell
};

const medalColors: Record<PublicProfileMedal["tier"], string> = {
  Bronze: "#7a401f",
  Silver: "#c8ced8",
  Gold: "#ffd84a"
};

function shuffleProfiles(profiles: PublicProfile[]) {
  return [...profiles].sort(() => Math.random() - 0.5).slice(0, 3);
}

function normalizeProfileState(value: unknown): StoredDailyState {
  const maybeState = value as StoredDailyState | null;
  const completionDatesByTask =
    maybeState?.completionDatesByTask && typeof maybeState.completionDatesByTask === "object"
      ? Object.fromEntries(
          Object.entries(maybeState.completionDatesByTask).map(([taskId, dates]) => [
            taskId,
            Array.isArray(dates) ? dates.filter((date) => typeof date === "string") : []
          ])
        )
      : {};

  return {
    tasks: Array.isArray(maybeState?.tasks) ? maybeState.tasks : [],
    completedTaskIds: Array.isArray(maybeState?.completedTaskIds) ? maybeState.completedTaskIds : [],
    completionDatesByTask,
    totalXp: Number(maybeState?.totalXp) || 0
  };
}

function getBestStreak(completionDatesByTask: Record<string, string[]> = {}) {
  return Object.values(completionDatesByTask).reduce(
    (best, dates) => Math.max(best, Array.isArray(dates) ? dates.length : 0),
    0
  );
}

export function ProfilePage() {
  const [dailyState, setDailyState] = useState<StoredDailyState>({});
  const [editingCharacter, setEditingCharacter] = useState(false);
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);
  const [allProfiles, setAllProfiles] = useState<PublicProfile[]>([]);
  const [visibleProfiles, setVisibleProfiles] = useState<PublicProfile[]>([]);
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const [profilePublic, setProfilePublic] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    setProfilePublic(isPublicProfileEnabled());
    setDisplayName(getStoredPublicDisplayName());

    if (!saved) {
      return;
    }

    try {
      setDailyState(normalizeProfileState(JSON.parse(saved)));
    } catch {
      setDailyState({});
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProfiles() {
      const profiles = await loadOtherPublicProfiles();
      if (!cancelled) {
        setAllProfiles(profiles);
        setVisibleProfiles(shuffleProfiles(profiles));
        setProfilesLoaded(true);
      }
    }

    void loadProfiles();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function syncProfileSettings() {
      setProfilePublic(isPublicProfileEnabled());
      setDisplayName(getStoredPublicDisplayName());
      void syncCurrentPublicProfile();
    }

    window.addEventListener("motive-public-profile-change", syncProfileSettings);
    window.addEventListener("storage", syncProfileSettings);
    return () => {
      window.removeEventListener("motive-public-profile-change", syncProfileSettings);
      window.removeEventListener("storage", syncProfileSettings);
    };
  }, []);

  const totalXp = Number(dailyState.totalXp) || 0;
  const level = useMemo(() => getLevelSnapshot(totalXp), [totalXp]);
  const totalTasks = dailyState.tasks?.length ?? 0;
  const completedToday = dailyState.completedTaskIds?.length ?? 0;
  const bestStreak = getBestStreak(dailyState.completionDatesByTask);
  const searchedProfiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return visibleProfiles;
    }

    return allProfiles.filter((profile) => profile.name.toLowerCase().includes(query)).slice(0, 6);
  }, [allProfiles, searchQuery, visibleProfiles]);

  async function refreshOtherProfiles() {
    const profiles = await loadOtherPublicProfiles();
    setAllProfiles(profiles);
    setVisibleProfiles(shuffleProfiles(profiles));
    setProfilesLoaded(true);
  }

  async function publishProfile() {
    setPublicProfileEnabled(true);
    setProfilePublic(true);
    await syncCurrentPublicProfile();
    await refreshOtherProfiles();
  }

  return (
    <div className="space-y-5">
      <section className="level-summary-card rounded-3xl border border-primary/35 bg-gradient-to-br from-primary/35 via-purple-950 to-card p-5 shadow-2xl shadow-primary/20">
        <div className="flex items-center gap-4 max-[360px]:flex-col max-[360px]:items-start">
          <div className="relative shrink-0">
            <AvatarCharacter interactive size="xl" />
            <button
              type="button"
              onClick={() => setEditingCharacter((open) => !open)}
              className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30"
              aria-label="Edit character"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-black">Level {level.level}</span>
              <span className="text-sm font-black text-secondary">{totalXp.toLocaleString()} XP</span>
            </div>
            <XpProgressBar currentXp={level.currentXp} nextLevelXp={level.nextLevelXp} progressPercent={level.progressPercent} />
          </div>
        </div>
      </section>

      {editingCharacter ? (
        <section className="neon-card rounded-3xl p-5 animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-300">
          <AvatarEditor onClose={() => setEditingCharacter(false)} />
        </section>
      ) : null}

      {!profilePublic ? (
        <section className="neon-card rounded-3xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Profile</div>
              <div className="mt-1 truncate text-lg font-black">{displayName || "Name not set"}</div>
            </div>
            <Button type="button" onClick={publishProfile} variant="outline">
              <Globe2 className="mr-2 h-4 w-4" />
              Make public
            </Button>
          </div>
        </section>
      ) : null}

      <section className="grid grid-cols-3 gap-3">
        <div className="neon-card rounded-3xl p-4 text-center">
          <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-accent" />
          <div className="text-lg font-black">{completedToday}/{totalTasks}</div>
        </div>
        <div className="neon-card rounded-3xl p-4 text-center">
          <Flame className="mx-auto mb-2 h-5 w-5 fill-orange-400 text-orange-400" />
          <div className="text-lg font-black">{bestStreak}</div>
        </div>
        <div className="neon-card rounded-3xl p-4 text-center">
          <Award className="mx-auto mb-2 h-5 w-5 text-secondary" />
          <div className="text-lg font-black">0</div>
        </div>
      </section>

      <section className="space-y-2 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search profiles"
            className="h-12 rounded-2xl bg-card/80 pl-11 text-base font-bold"
          />
        </div>

        {profilesLoaded && searchedProfiles.length === 0 ? (
          <div className="neon-card rounded-2xl p-4 text-center text-sm font-bold text-muted-foreground">
            {searchQuery.trim() ? "No profiles found." : "No other public profiles yet."}
          </div>
        ) : null}

        {searchedProfiles.map((profile) => {
          const expanded = expandedProfileId === profile.id;

          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => setExpandedProfileId(expanded ? null : profile.id)}
              className={expanded ? "neon-card w-full rounded-3xl p-4 text-left transition-all duration-300 ease-out active:scale-[0.99]" : "neon-card w-full rounded-2xl p-3 text-left transition-all duration-300 ease-out active:scale-[0.99]"}
            >
              <div className={expanded ? "flex items-start gap-5 transition-all duration-300 ease-out" : "flex items-center gap-3 transition-all duration-300 ease-out"}>
                <AvatarCharacter
                  config={profile.avatarConfig}
                  forcePaused={!expanded}
                  size={expanded ? "xl" : "sm"}
                  className={expanded ? "h-32 w-32 rounded-3xl transition-all duration-300 ease-out max-[380px]:h-28 max-[380px]:w-28" : "h-12 w-12 rounded-2xl transition-all duration-300 ease-out"}
                />
                <div className={expanded ? "min-w-0 flex-1 py-2" : "min-w-0 flex-1 py-0.5"}>
                  <div className={expanded ? "text-xl font-black leading-tight" : "font-black"}>{profile.name}</div>
                  <div className={expanded ? "mt-1 text-sm font-bold text-secondary" : "text-xs font-bold text-secondary"}>Level {profile.level}</div>
                  <div className={expanded ? "grid grid-rows-[1fr] transition-all duration-300 ease-out" : "grid grid-rows-[0fr] transition-all duration-300 ease-out"}>
                    <div className="overflow-hidden">
                      <div className="mt-5 grid gap-3 min-[420px]:grid-cols-2">
                        <div className="flex items-center justify-center gap-2 rounded-2xl bg-muted px-3 py-2 text-sm font-bold text-muted-foreground" aria-label={`${profile.achievements} achievements`}>
                          <Award className="h-5 w-5 text-secondary" />
                          <span className="text-base font-black text-foreground">{profile.achievements}</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 rounded-2xl bg-muted px-3 py-2 text-sm font-bold text-muted-foreground" aria-label={`${profile.highestStreak} highest streak`}>
                          <Flame className="h-5 w-5 fill-orange-400 text-orange-400" />
                          <span className="text-base font-black text-foreground">{profile.highestStreak}</span>
                        </div>
                      </div>

                      {profile.medals.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {profile.medals.map((medal) => {
                            const Icon = medalIcons[medal.tag] ?? Award;
                            const color = medalColors[medal.tier];

                            return (
                              <div key={`${profile.id}-${medal.tag}`} className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-xs font-black">
                                <span
                                  className="grid h-7 w-7 place-items-center rounded-full border border-white/20"
                                  style={{
                                    background: `radial-gradient(circle at 30% 24%, rgba(255,255,255,0.9), transparent 18%), linear-gradient(135deg, rgba(255,255,255,0.45), ${color} 38%, rgba(0,0,0,0.32))`,
                                    color: medal.tier === "Gold" ? "#2a2100" : "#111827"
                                  }}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                </span>
                                <span>{medal.tier}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </section>
    </div>
  );
}

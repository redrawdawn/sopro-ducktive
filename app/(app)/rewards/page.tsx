"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Bed, BookOpen, Brain, Dumbbell, Footprints, Lock, LockOpen, Medal, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { XpProgressBar } from "@/components/xp-progress-bar";
import { backupMotiveState } from "@/lib/motive-backup";
import {
  avatarDefaultAccessoryColor,
  avatarImagePath,
  avatarLayerOrder,
  avatarLevelRewards,
  avatarPartClass,
  defaultAvatarConfig,
  type AvatarCategory,
  type AvatarConfig,
  type AvatarCosmeticReward
} from "@/lib/avatar";
import { getLevelSnapshot } from "@/lib/levels";

const STORAGE_KEY = "sopro-ducktive-daily-v1";
const LEVEL_REWARD_BATCH_SIZE = 5;
const REWARD_BATCH_SIZE = 10;
const rewardLayerTransforms = {
  Detail: "translate3d(-50%, -50%, 0)",
  Body: "translate3d(-50%, -50%, 0)",
  Arms: "translate3d(-50%, -50%, 0)",
  Face: "translate3d(-46%, -42%, 0)",
  Beard: "translate3d(-46%, -50%, 0)",
  Hair: "translate3d(-50%, -50%, 0)",
  Hat: "translate3d(-50%, -50%, 0)"
};
const legsAtOriginalHeight = new Set(["legs-default.png", "legs-blob.png", "legs-ghost.png", "legs-thin.png"]);

type RewardsTab = "rewards" | "levels" | "medals";
type DailyTask = {
  id: string;
  icon?: string;
};
type DailyState = {
  tasks: DailyTask[];
  completedTaskIds: string[];
  completionDatesByTask: Record<string, string[]>;
  totalXp: number;
};
type RewardPreview = {
  title: string;
  config: AvatarConfig;
};
type RewardRow = {
  id: string;
  name: string;
  reward?: string;
  xp?: number;
  cosmetic?: Omit<AvatarCosmeticReward, "level">;
};
type LevelReward = RewardPreview & {
  level: number;
};
type MedalTier = {
  tier: "Bronze" | "Silver" | "Gold";
  days: number;
  color: string;
  reward: Omit<AvatarCosmeticReward, "level">;
};
type MedalSet = {
  id: "run" | "workout" | "sleep" | "book" | "mind";
  label: string;
  Icon: typeof Footprints;
  tiers: MedalTier[];
};

const CLAIMED_REWARDS_KEY = "sopro-ducktive-claimed-rewards-v1";

const rewardRows: RewardRow[] = [
  { id: "daily-all", name: "Complete all your daily tasks", reward: "5 XP", xp: 5 },
  { id: "streak-7", name: "7 Day Streak", reward: "50 XP", xp: 50 },
  { id: "streak-30", name: "30 Day Streak", reward: "500 XP", xp: 500 },
  { id: "sleep-30-total", name: "Complete a sleep task 30 times", cosmetic: { category: "Hair", part: "hair-wild.png" } },
  { id: "run-40-total", name: "Go on 40 runs total", cosmetic: { category: "Hat", part: "hat-band.png" } },
  { id: "workout-run-7", name: "Have a workout and run streak of 7 or more at one time", cosmetic: { category: "Hat", part: "hat-ninja.png" } },
  { id: "five-daily-7", name: "Have a 7 day streak on 5 daily tasks at once", cosmetic: { category: "Hat", part: "hat-military.png" } }
];

const medalSets: MedalSet[] = [
  {
    id: "run",
    label: "Run",
    Icon: Footprints,
    tiers: [
      { tier: "Bronze", days: 7, color: "#8f4f22", reward: { category: "Legs", part: "legs-insect.png" } },
      { tier: "Silver", days: 30, color: "#c0c0c0", reward: { category: "Legs", part: "legs-four.png" } },
      { tier: "Gold", days: 60, color: "#ffd700", reward: { category: "Legs", part: "legs-spider.png" } }
    ]
  },
  {
    id: "workout",
    label: "Workout",
    Icon: Dumbbell,
    tiers: [
      { tier: "Bronze", days: 7, color: "#8f4f22", reward: { category: "Arms", part: "arms-noodle.png" } },
      { tier: "Silver", days: 30, color: "#c0c0c0", reward: { category: "Arms", part: "arms-fingers.png" } },
      { tier: "Gold", days: 60, color: "#ffd700", reward: { category: "Arms", part: "arms-large.png" } }
    ]
  },
  {
    id: "sleep",
    label: "Sleep",
    Icon: Bed,
    tiers: [
      { tier: "Bronze", days: 7, color: "#8f4f22", reward: { category: "Face", part: "face-sleep.png" } },
      { tier: "Silver", days: 30, color: "#c0c0c0", reward: { category: "Face", part: "face-grumpy.png" } },
      { tier: "Gold", days: 60, color: "#ffd700", reward: { category: "Face", part: "face-monster.png" } }
    ]
  },
  {
    id: "book",
    label: "Book",
    Icon: BookOpen,
    tiers: [
      { tier: "Bronze", days: 7, color: "#8f4f22", reward: { category: "Face", part: "face-glasses.png" } },
      { tier: "Silver", days: 30, color: "#c0c0c0", reward: { category: "Face", part: "face-specs.png" } },
      { tier: "Gold", days: 60, color: "#ffd700", reward: { category: "Face", part: "face-threeeyes.png" } }
    ]
  },
  {
    id: "mind",
    label: "Mind",
    Icon: Brain,
    tiers: [
      { tier: "Bronze", days: 7, color: "#8f4f22", reward: { category: "Hat", part: "hat-arrow.png" } },
      { tier: "Silver", days: 30, color: "#c0c0c0", reward: { category: "Hat", part: "hat-bowl.png" } },
      { tier: "Gold", days: 60, color: "#ffd700", reward: { category: "Hat", part: "hat-wizard.png" } }
    ]
  }
];

const levelRewards: LevelReward[] = Array.from({ length: 100 }, (_, index) => {
  const level = (index + 1) * 5;
  const cosmeticReward = avatarLevelRewards.find((reward) => reward.level === level);

  return {
    level,
    title: `Level ${level}`,
    config: cosmeticReward ? createRewardConfig(cosmeticReward) : defaultAvatarConfig
  };
});

function createRewardConfig(reward: Omit<AvatarCosmeticReward, "level">): AvatarConfig {
  return {
    ...defaultAvatarConfig,
    parts: {
      ...defaultAvatarConfig.parts,
      [reward.category]: reward.part
    },
    colors: {
      ...defaultAvatarConfig.colors,
      [reward.category]: ["Body", "Legs", "Arms", "Face"].includes(reward.category)
        ? defaultAvatarConfig.colors[reward.category]
        : avatarDefaultAccessoryColor
    }
  };
}

function loadDailyState(): DailyState {
  if (typeof window === "undefined") {
    return { tasks: [], completedTaskIds: [], completionDatesByTask: {}, totalXp: 0 };
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return { tasks: [], completedTaskIds: [], completionDatesByTask: {}, totalXp: 0 };
  }

  try {
    const parsed = JSON.parse(saved) as Partial<DailyState>;
    return {
      tasks: Array.isArray(parsed.tasks)
        ? parsed.tasks
            .map((task) => ({ id: String(task.id), icon: typeof task.icon === "string" ? task.icon : undefined }))
            .filter((task) => task.id)
        : [],
      completedTaskIds: Array.isArray(parsed.completedTaskIds)
        ? parsed.completedTaskIds.filter((id): id is string => typeof id === "string")
        : [],
      completionDatesByTask:
        parsed.completionDatesByTask && typeof parsed.completionDatesByTask === "object"
          ? Object.fromEntries(
              Object.entries(parsed.completionDatesByTask).map(([taskId, dates]) => [
                taskId,
                Array.isArray(dates) ? dates.filter((date): date is string => typeof date === "string") : []
              ])
            )
          : {},
      totalXp: Math.max(0, Number(parsed.totalXp) || 0)
    };
  } catch {
    return { tasks: [], completedTaskIds: [], completionDatesByTask: {}, totalXp: 0 };
  }
}

function loadClaimedRewards() {
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

function saveClaimedRewards(claimed: Set<string>) {
  window.localStorage.setItem(CLAIMED_REWARDS_KEY, JSON.stringify(Array.from(claimed)));
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

function getTagStreaks(state: DailyState) {
  return state.tasks.reduce<Record<string, number>>((streaks, task) => {
    if (!task.icon) {
      return streaks;
    }

    const taskStreak = getLongestStreak(state.completionDatesByTask[task.id]);
    streaks[task.icon] = Math.max(streaks[task.icon] ?? 0, taskStreak);
    return streaks;
  }, {});
}

function getTagTotals(state: DailyState) {
  return state.tasks.reduce<Record<string, number>>((totals, task) => {
    if (!task.icon) {
      return totals;
    }

    totals[task.icon] = (totals[task.icon] ?? 0) + (state.completionDatesByTask[task.id]?.length ?? 0);
    return totals;
  }, {});
}

function getRewardEligible(reward: RewardRow, state: DailyState, tagStreaks: Record<string, number>, tagTotals: Record<string, number>) {
  const bestStreak = Math.max(0, ...Object.values(tagStreaks));

  if (reward.id === "daily-all") {
    return state.tasks.length > 0 && state.completedTaskIds.length >= state.tasks.length;
  }

  if (reward.id === "streak-7") {
    return bestStreak >= 7;
  }

  if (reward.id === "streak-30") {
    return bestStreak >= 30;
  }

  if (reward.id === "sleep-30-total") {
    return (tagTotals.sleep ?? 0) >= 30;
  }

  if (reward.id === "run-40-total") {
    return (tagTotals.run ?? 0) >= 40;
  }

  if (reward.id === "workout-run-7") {
    return (tagStreaks.workout ?? 0) >= 7 && (tagStreaks.run ?? 0) >= 7;
  }

  if (reward.id === "five-daily-7") {
    return state.tasks.filter((task) => getLongestStreak(state.completionDatesByTask[task.id]) >= 7).length >= 5;
  }

  return false;
}

function rewardLayerTransform(category: AvatarCategory, partName: string) {
  if (category === "Legs") {
    return legsAtOriginalHeight.has(partName)
      ? "translate3d(-50%, -50%, 0)"
      : "translate3d(-50%, calc(-50% + 1px), 0)";
  }

  return rewardLayerTransforms[category];
}

function CharacterRewardPreview({ config, size = "sm" }: { config: AvatarConfig; size?: "xs" | "sm" | "lg" }) {
  const scale = size === "lg" ? 8 : size === "xs" ? 2.35 : 3.2;
  const frameSize = size === "lg" ? "h-44 w-44 rounded-3xl" : size === "xs" ? "h-10 w-10 rounded-xl" : "h-14 w-14 rounded-2xl";

  return (
    <div
      className={`${frameSize} grid shrink-0 place-items-center border border-white/10 bg-muted shadow-inner`}
      style={{ backgroundColor: config.colors.Background }}
    >
      <span
        className="avatar-character avatar-character-paused"
        style={{ transform: `translateY(0) scale(${scale})` } as CSSProperties}
      >
        {avatarLayerOrder.map((category) => (
          <img
            key={category}
            src={avatarImagePath(config, category, 0)}
            alt=""
            className={`avatar-layer avatar-layer-${category} ${avatarPartClass(config.parts[category])}`}
            style={{ transform: rewardLayerTransform(category, config.parts[category]) }}
            draggable={false}
          />
        ))}
      </span>
    </div>
  );
}

function RewardClaimBurst() {
  const particles = [
    ["0px", "-52px"],
    ["42px", "-36px"],
    ["54px", "4px"],
    ["34px", "44px"],
    ["0px", "56px"],
    ["-34px", "44px"],
    ["-54px", "4px"],
    ["-42px", "-36px"],
    ["18px", "-48px"],
    ["48px", "28px"],
    ["-48px", "28px"],
    ["-18px", "-48px"]
  ];

  return (
    <span className="reward-claim-burst">
      {particles.map(([x, y]) => (
        <span key={`${x}-${y}`} style={{ "--burst-x": x, "--burst-y": y } as CSSProperties} />
      ))}
    </span>
  );
}

export default function RewardsPage() {
  const [activeTab, setActiveTab] = useState<RewardsTab>("rewards");
  const [dailyState, setDailyState] = useState<DailyState>({ tasks: [], completedTaskIds: [], completionDatesByTask: {}, totalXp: 0 });
  const [claimedRewards, setClaimedRewards] = useState<Set<string>>(() => new Set());
  const [claimBursts, setClaimBursts] = useState<string[]>([]);
  const [visibleRewardCount, setVisibleRewardCount] = useState(REWARD_BATCH_SIZE);
  const [visibleLevelRewardCount, setVisibleLevelRewardCount] = useState(LEVEL_REWARD_BATCH_SIZE);
  const [selectedReward, setSelectedReward] = useState<RewardPreview | null>(null);
  const levelRewardsScrollRef = useRef<HTMLDivElement | null>(null);
  const currentLevelRewardRef = useRef<HTMLButtonElement | null>(null);
  const level = useMemo(() => getLevelSnapshot(dailyState.totalXp), [dailyState.totalXp]);
  const tagStreaks = useMemo(() => getTagStreaks(dailyState), [dailyState]);
  const tagTotals = useMemo(() => getTagTotals(dailyState), [dailyState]);
  const currentRewardIndex = useMemo(() => {
    const nextIndex = levelRewards.findIndex((reward) => reward.level > level.level);
    return nextIndex === -1 ? levelRewards.length - 1 : nextIndex;
  }, [level.level]);
  const visibleLevelRewards = levelRewards.slice(0, visibleLevelRewardCount);
  const timelineProgressPercent = useMemo(() => {
    const firstRewardLevel = levelRewards[0].level;
    const lastVisibleLevel = visibleLevelRewards[visibleLevelRewards.length - 1]?.level ?? firstRewardLevel;
    const effectiveLevel = level.level + level.progressPercent / 100;
    const range = Math.max(1, lastVisibleLevel - firstRewardLevel);

    return Math.min(100, Math.max(0, ((effectiveLevel - firstRewardLevel) / range) * 100));
  }, [level.level, level.progressPercent, visibleLevelRewards]);
  const visibleRewardRows = rewardRows.slice(0, visibleRewardCount);
  const pendingRewardIds = useMemo(
    () =>
      rewardRows
        .filter((reward) => getRewardEligible(reward, dailyState, tagStreaks, tagTotals) && !claimedRewards.has(`reward:${reward.id}`))
        .map((reward) => `reward:${reward.id}`),
    [claimedRewards, dailyState, tagStreaks, tagTotals]
  );
  const pendingLevelRewardIds = useMemo(
    () =>
      levelRewards
        .filter((reward) => level.level >= reward.level && !claimedRewards.has(`level:${reward.level}`))
        .map((reward) => `level:${reward.level}`),
    [claimedRewards, level.level]
  );
  const pendingMedalRewardIds = useMemo(
    () =>
      medalSets.flatMap((set) =>
        set.tiers
          .filter((tier) => (tagStreaks[set.id] ?? 0) >= tier.days && !claimedRewards.has(`medal:${set.id}:${tier.tier}`))
          .map((tier) => `medal:${set.id}:${tier.tier}`)
      ),
    [claimedRewards, tagStreaks]
  );
  const sortedMedalSets = useMemo(
    () =>
      [...medalSets].sort((first, second) => {
        const firstProgress = Math.max(...first.tiers.map((tier) => Math.min(1, (tagStreaks[first.id] ?? 0) / tier.days)));
        const secondProgress = Math.max(...second.tiers.map((tier) => Math.min(1, (tagStreaks[second.id] ?? 0) / tier.days)));
        return secondProgress - firstProgress;
      }),
    [tagStreaks]
  );

  useEffect(() => {
    setDailyState(loadDailyState());
    setClaimedRewards(loadClaimedRewards());

    function syncState() {
      setDailyState(loadDailyState());
    }

    window.addEventListener("storage", syncState);
    window.addEventListener("focus", syncState);
    window.addEventListener("motive-account-state-change", syncState);
    return () => {
      window.removeEventListener("storage", syncState);
      window.removeEventListener("focus", syncState);
      window.removeEventListener("motive-account-state-change", syncState);
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "levels") {
      return;
    }

    setVisibleLevelRewardCount((count) => Math.max(count, Math.min(levelRewards.length, currentRewardIndex + 3)));
    const timeout = window.setTimeout(() => {
      const container = levelRewardsScrollRef.current;
      const item = currentLevelRewardRef.current;

      if (!container || !item) {
        return;
      }

      container.scrollTo({
        top: item.offsetTop - container.clientHeight / 2 + item.clientHeight / 2,
        behavior: "smooth"
      });
    }, 80);
    return () => window.clearTimeout(timeout);
  }, [activeTab, currentRewardIndex]);

  function switchTab(tab: RewardsTab) {
    setActiveTab(tab);
    if (tab !== "levels") {
      setVisibleLevelRewardCount(LEVEL_REWARD_BATCH_SIZE);
    }
    if (tab !== "rewards") {
      setVisibleRewardCount(REWARD_BATCH_SIZE);
    }
  }

  function claimReward(id: string, xp = 0) {
    if (claimedRewards.has(id)) {
      return;
    }

    const nextClaimed = new Set(claimedRewards);
    nextClaimed.add(id);
    setClaimedRewards(nextClaimed);
    saveClaimedRewards(nextClaimed);
    window.dispatchEvent(new Event("motive-rewards-claimed-change"));
    setClaimBursts((current) => [...current, id]);
    window.setTimeout(() => setClaimBursts((current) => current.filter((burstId) => burstId !== id)), 720);

    if (xp > 0) {
      setDailyState((current) => {
        const nextState = { ...current, totalXp: current.totalXp + xp };
        const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, unknown>;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, totalXp: nextState.totalXp }));
        return nextState;
      });
    }

    window.setTimeout(() => void backupMotiveState(), 0);
  }

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-3 gap-2 rounded-3xl bg-muted p-1.5">
        {[
          { id: "rewards" as const, label: "Rewards", Icon: Trophy, pending: pendingRewardIds.length > 0 },
          { id: "levels" as const, label: "Level", Icon: Lock, pending: pendingLevelRewardIds.length > 0 },
          { id: "medals" as const, label: "Medals", Icon: Medal, pending: pendingMedalRewardIds.length > 0 }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => switchTab(tab.id)}
            className={
              activeTab === tab.id
                ? "relative flex min-h-16 flex-col items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "relative flex min-h-16 flex-col items-center justify-center rounded-2xl text-muted-foreground"
            }
          >
            {tab.pending ? <span className="absolute mt-[-2.4rem] ml-9 h-3 w-3 rounded-full bg-secondary shadow-lg shadow-secondary/40" /> : null}
            <tab.Icon className="mb-1 h-5 w-5" />
            <span className="text-xs font-black">{tab.label}</span>
          </button>
        ))}
      </section>

      {activeTab === "rewards" ? (
        <section className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {visibleRewardRows.map((reward) => {
            const preview = reward.cosmetic
              ? { title: reward.name, config: createRewardConfig(reward.cosmetic) }
              : null;
            const rewardId = `reward:${reward.id}`;
            const pending = getRewardEligible(reward, dailyState, tagStreaks, tagTotals) && !claimedRewards.has(rewardId);

            return (
            <button
              key={reward.name}
              type="button"
              onClick={() => pending && claimReward(rewardId, reward.xp ?? 0)}
              className={pending ? "neon-card relative flex w-full items-center gap-3 rounded-3xl border-secondary/70 p-4 text-left shadow-xl shadow-secondary/10" : "neon-card relative flex w-full items-center gap-3 rounded-3xl p-4 text-left"}
            >
              {pending ? <span className="absolute right-3 top-3 h-3 w-3 rounded-full bg-secondary shadow-lg shadow-secondary/40" /> : null}
              {claimBursts.includes(rewardId) ? <RewardClaimBurst /> : null}
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-muted text-primary">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                <h2 className="min-w-0 break-words font-black">{reward.name}</h2>
                {preview ? (
                  <span
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedReward(preview);
                    }}
                    className="shrink-0 rounded-2xl outline-none transition-transform hover:scale-105"
                    aria-label={`Preview ${reward.name} reward`}
                  >
                    <CharacterRewardPreview config={preview.config} />
                  </span>
                ) : (
                  <div className="shrink-0 text-xs font-black text-secondary">{reward.reward}</div>
                )}
              </div>
            </button>
          );
          })}

          {visibleRewardCount < rewardRows.length ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setVisibleRewardCount((count) => Math.min(rewardRows.length, count + REWARD_BATCH_SIZE))}
            >
              Show more
            </Button>
          ) : null}
        </section>
      ) : null}

      {activeTab === "levels" ? (
        <section className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="neon-card rounded-3xl p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <div className="text-xl font-black">Level {level.level}</div>
              </div>
              <span className="text-sm font-black text-secondary">{dailyState.totalXp.toLocaleString()} XP</span>
            </div>
            <XpProgressBar currentXp={level.currentXp} nextLevelXp={level.nextLevelXp} progressPercent={level.progressPercent} />
          </div>

          <div ref={levelRewardsScrollRef} className="max-h-[min(32rem,calc(100dvh-21rem))] overflow-y-auto pr-1">
          <div className="relative space-y-3 pl-8">
            <div className="absolute bottom-8 left-3 top-8 w-1 rounded-full bg-muted" />
            <div
              className="absolute left-3 top-8 w-1 rounded-full bg-gradient-to-b from-secondary to-orange-500 transition-all duration-500 ease-out"
              style={{ height: `calc((100% - 4rem) * ${timelineProgressPercent / 100})` }}
            />
            {visibleLevelRewards.map((reward, index) => {
              const earned = level.level >= reward.level;
              const current = index === currentRewardIndex;
              const StatusIcon = earned ? LockOpen : Lock;
              const rewardId = `level:${reward.level}`;
              const pending = earned && !claimedRewards.has(rewardId);

              return (
            <button
              key={reward.level}
              ref={current ? currentLevelRewardRef : null}
              type="button"
              onClick={() => pending && claimReward(rewardId)}
              className={pending ? "neon-card relative flex w-full items-center justify-between gap-3 rounded-3xl border-secondary/70 p-4 text-left shadow-xl shadow-secondary/10" : current ? "neon-card relative flex w-full items-center justify-between gap-3 rounded-3xl border-primary/60 p-4 text-left shadow-primary/20" : "neon-card relative flex w-full items-center justify-between gap-3 rounded-3xl p-4 text-left"}
            >
              {pending ? <span className="absolute right-3 top-3 h-3 w-3 rounded-full bg-secondary shadow-lg shadow-secondary/40" /> : null}
              {claimBursts.includes(rewardId) ? <RewardClaimBurst /> : null}
              <div className={earned ? "absolute -left-[1.85rem] top-1/2 z-10 h-5 w-5 -translate-y-1/2 rounded-full border-4 border-background bg-accent" : "absolute -left-[1.85rem] top-1/2 z-10 h-5 w-5 -translate-y-1/2 rounded-full border-4 border-background bg-muted"} />
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 font-black">
                  <StatusIcon className={earned ? "h-4 w-4 shrink-0 text-accent" : "h-4 w-4 shrink-0 text-muted-foreground"} />
                  {reward.title}
                </h2>
              </div>
              <span
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedReward(reward);
                }}
                className="shrink-0 rounded-2xl outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Preview ${reward.title} reward`}
              >
                <CharacterRewardPreview config={reward.config} />
              </span>
            </button>
              );
            })}
            {visibleLevelRewardCount < levelRewards.length ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() =>
                  setVisibleLevelRewardCount((count) => Math.min(levelRewards.length, count + LEVEL_REWARD_BATCH_SIZE))
                }
              >
                Show more
              </Button>
            ) : null}
          </div>
          </div>
        </section>
      ) : null}

      {activeTab === "medals" ? (
        <section className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {sortedMedalSets.map((set) => {
            const streak = tagStreaks[set.id] ?? 0;
            const activeTier = set.tiers.find((tier) => streak < tier.days) ?? set.tiers[set.tiers.length - 1];

            return (
              <div key={set.id} className="neon-card rounded-3xl p-4">
                <div className="space-y-2">
                  {set.tiers.map((tier) => {
                    const complete = streak >= tier.days;
                    const expanded = tier.tier === activeTier.tier;
                    const progress = Math.min(100, (streak / tier.days) * 100);
                    const rewardId = `medal:${set.id}:${tier.tier}`;
                    const pending = complete && !claimedRewards.has(rewardId);
                    const preview = {
                      title: `${set.label} ${tier.tier}`,
                      config: createRewardConfig(tier.reward)
                    };

                    return (
                      <button
                        key={tier.tier}
                        type="button"
                        onClick={() => pending && claimReward(rewardId)}
                        className={pending ? "relative w-full rounded-2xl border border-secondary/70 bg-muted p-3 text-left shadow-xl shadow-secondary/10 transition-all duration-300" : expanded ? "relative w-full rounded-2xl bg-muted p-3 text-left transition-all duration-300" : "relative w-full rounded-2xl bg-muted/70 p-1 text-left transition-all duration-300"}
                      >
                        {pending ? <span className="absolute right-3 top-3 h-3 w-3 rounded-full bg-secondary shadow-lg shadow-secondary/40" /> : null}
                        {claimBursts.includes(rewardId) ? <RewardClaimBurst /> : null}
                        <div className={expanded ? "flex items-center gap-3" : "flex items-center gap-2"}>
                          <div
                            className={expanded ? "grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/20 shadow-inner transition-all duration-300" : "grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/20 shadow-inner transition-all duration-300"}
                            style={{
                              background: `radial-gradient(circle at 30% 24%, rgba(255,255,255,0.9), transparent 18%), linear-gradient(135deg, rgba(255,255,255,0.45), ${tier.color} 38%, rgba(0,0,0,0.32))`,
                              color: tier.tier === "Gold" ? "#2a2100" : "#111827"
                            }}
                          >
                            <set.Icon className={expanded ? "h-5 w-5" : "h-3 w-3"} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <h3 className={expanded ? "font-black" : "text-xs font-black"}>{tier.tier}</h3>
                              <span className="shrink-0 text-xs font-black text-secondary">{tier.days} days</span>
                            </div>
                            <div className={expanded ? "mt-2 h-2 overflow-hidden rounded-full bg-background" : "mt-1 h-1 overflow-hidden rounded-full bg-background"}>
                              <div
                                className="h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progress}%`, backgroundColor: tier.color }}
                              />
                            </div>
                            <p className={expanded ? "mt-2 text-xs font-bold text-muted-foreground" : "mt-1 text-[10px] font-bold text-muted-foreground"}>
                              {streak}/{tier.days}
                            </p>
                          </div>
                          <span
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedReward(preview);
                            }}
                            className={complete ? "shrink-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary" : "shrink-0 rounded-2xl opacity-70 outline-none focus-visible:ring-2 focus-visible:ring-primary"}
                            aria-label={`Preview ${preview.title} reward`}
                          >
                            <CharacterRewardPreview config={preview.config} size={expanded ? "sm" : "xs"} />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      ) : null}

      {selectedReward ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-5 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedReward(null)}
        >
          <div
            className="neon-card w-full max-w-sm rounded-3xl p-5 text-center animate-in fade-in zoom-in-95 duration-300"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3 text-left">
              <div>
                <div className="text-xs font-black uppercase text-muted-foreground">Reward preview</div>
                <h2 className="text-2xl font-black">{selectedReward.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReward(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
                aria-label="Close reward preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex justify-center">
              <CharacterRewardPreview config={selectedReward.config} size="lg" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

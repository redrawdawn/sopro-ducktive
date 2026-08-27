"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  BookOpen,
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Dumbbell,
  Flame,
  Footprints,
  Leaf,
  Lock,
  LockOpen,
  Medal,
  RefreshCw,
  Sun,
  Trophy,
  X,
  type LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { XpProgressBar } from "@/components/xp-progress-bar";
import { backupMotiveState } from "@/lib/motive-backup";
import {
  generalRewardDefinitions,
  generalRewardXp,
  getGeneralRewardProgress,
  getPendingRewardIds,
  getRewardTagTotals,
  isRecurringReward,
  isRewardClaimEligible,
  loadClaimedRewardsFromStorage,
  loadRecurringRewardsFromStorage,
  resetRecurringRewardAfterClaim,
  saveClaimedRewardsToStorage,
  saveRecurringRewardsToStorage,
  type GeneralRewardDefinition,
  type RecurringRewardState,
  type RewardDailyState
} from "@/lib/reward-state";
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
import { getTaskTagLabel, normalizeTaskTag, type TaskTag } from "@/lib/task-tags";

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
type AchievementStatus = "claimable" | "locked" | "unlocked";
type DailyTask = {
  id: string;
  title?: string;
  icon?: string;
};
type DailyState = {
  tasks: DailyTask[];
  completedTaskIds: string[];
  completionDatesByTask: Record<string, string[]>;
  completionTagsByTask: Record<string, string>;
  totalXp: number;
} & RewardDailyState;
type RewardPreview = {
  title: string;
  config: AvatarConfig;
};
type RewardRow = GeneralRewardDefinition & {
  reward?: string;
  xp?: number;
  cosmetic?: Omit<AvatarCosmeticReward, "level">;
};
type LevelReward = RewardPreview & {
  level: number;
};
type MedalTier = {
  tier: "Bronze" | "Silver" | "Gold";
  completions: number;
  color: string;
  reward: Omit<AvatarCosmeticReward, "level">;
};
type MedalSet = {
  id: "run" | "workout" | "wake-up" | "read" | "meditate";
  label: string;
  Icon: typeof Footprints;
  tiers: MedalTier[];
};

const rewardCosmetics: Record<string, Omit<AvatarCosmeticReward, "level">> = {
  "all-tags-20": { category: "Hat", part: "hat-adventure.png" },
  "run-25-workout-streak-7": { category: "Arms", part: "arms01.png" },
  "garden-streak-14": { category: "Detail", part: "detail-fairy.png" },
  "meditate-streak-14": { category: "Body", part: "body-alien.png" },
  "read-streak-14": { category: "Face", part: "face-eyepatch.png" },
  "wake-read-garden-5": { category: "Face", part: "face-sad.png" },
  "wake-workout-run-14": { category: "Face", part: "face-cool.png" },
  "sleep-30-total": { category: "Hair", part: "hair-wild.png" },
  "run-40-total": { category: "Hat", part: "hat-band.png" },
  "workout-run-7": { category: "Hat", part: "hat-ninja.png" },
  "five-daily-7": { category: "Hat", part: "hat-military.png" }
};

const rewardRows: RewardRow[] = generalRewardDefinitions.map((reward) => {
  const xp = generalRewardXp[`reward:${reward.id}`] ?? 0;
  return {
    ...reward,
    reward: xp > 0 ? `${xp.toLocaleString()} XP` : undefined,
    xp: xp > 0 ? xp : undefined,
    cosmetic: rewardCosmetics[reward.id]
  };
});

const medalSets: MedalSet[] = [
  {
    id: "run",
    label: "Run",
    Icon: Footprints,
    tiers: [
      { tier: "Bronze", completions: 7, color: "#8f4f22", reward: { category: "Legs", part: "legs-insect.png" } },
      { tier: "Silver", completions: 30, color: "#c0c0c0", reward: { category: "Legs", part: "legs-four.png" } },
      { tier: "Gold", completions: 60, color: "#ffd700", reward: { category: "Legs", part: "legs-spider.png" } }
    ]
  },
  {
    id: "workout",
    label: "Workout",
    Icon: Dumbbell,
    tiers: [
      { tier: "Bronze", completions: 7, color: "#8f4f22", reward: { category: "Arms", part: "arms-noodle.png" } },
      { tier: "Silver", completions: 30, color: "#c0c0c0", reward: { category: "Arms", part: "arms-fingers.png" } },
      { tier: "Gold", completions: 60, color: "#ffd700", reward: { category: "Arms", part: "arms-large.png" } }
    ]
  },
  {
    id: "wake-up",
    label: "Wake up",
    Icon: Sun,
    tiers: [
      { tier: "Bronze", completions: 7, color: "#8f4f22", reward: { category: "Face", part: "face-sleep.png" } },
      { tier: "Silver", completions: 30, color: "#c0c0c0", reward: { category: "Face", part: "face-grumpy.png" } },
      { tier: "Gold", completions: 60, color: "#ffd700", reward: { category: "Face", part: "face-monster.png" } }
    ]
  },
  {
    id: "read",
    label: "Read",
    Icon: BookOpen,
    tiers: [
      { tier: "Bronze", completions: 7, color: "#8f4f22", reward: { category: "Face", part: "face-glasses.png" } },
      { tier: "Silver", completions: 30, color: "#c0c0c0", reward: { category: "Face", part: "face-specs.png" } },
      { tier: "Gold", completions: 60, color: "#ffd700", reward: { category: "Face", part: "face-threeeyes.png" } }
    ]
  },
  {
    id: "meditate",
    label: "Meditate",
    Icon: Brain,
    tiers: [
      { tier: "Bronze", completions: 7, color: "#8f4f22", reward: { category: "Hat", part: "hat-arrow.png" } },
      { tier: "Silver", completions: 30, color: "#c0c0c0", reward: { category: "Hat", part: "hat-bowl.png" } },
      { tier: "Gold", completions: 60, color: "#ffd700", reward: { category: "Hat", part: "hat-wizard.png" } }
    ]
  }
];

const achievementStatusOrder: Record<AchievementStatus, number> = {
  claimable: 0,
  locked: 1,
  unlocked: 2
};

function getAchievementStatus(
  id: string,
  state: DailyState,
  claimed: Set<string>,
  recurringRewards: RecurringRewardState = {}
): AchievementStatus {
  if (!isRecurringReward(id) && claimed.has(id)) {
    return "unlocked";
  }

  return isRewardClaimEligible(id, state, recurringRewards) ? "claimable" : "locked";
}

function statusLabel(status: AchievementStatus) {
  if (status === "claimable") {
    return "Claim";
  }

  return status === "unlocked" ? "Claimed" : "";
}

const rewardTagIcons: Record<TaskTag, LucideIcon> = {
  workout: Dumbbell,
  run: Footprints,
  read: BookOpen,
  "wake-up": Sun,
  meditate: Brain,
  garden: Leaf,
  work: BriefcaseBusiness
};

function RewardRequirementIcons({ reward }: { reward: GeneralRewardDefinition }) {
  const criterion = reward.criterion;

  if (criterion.kind === "tag-total-and-streak") {
    const StreakTagIcon = rewardTagIcons[criterion.streakTag];
    const TotalTagIcon = rewardTagIcons[criterion.totalTag];
    const streakLabel = getTaskTagLabel(criterion.streakTag) ?? criterion.streakTag;
    const totalLabel = getTaskTagLabel(criterion.totalTag) ?? criterion.totalTag;

    return (
      <div className="flex shrink-0 items-center gap-1.5" aria-label={`Requirement icons for ${reward.description}`}>
        <span className="flex h-10 min-w-10 items-center justify-center gap-1 rounded-2xl bg-orange-500/15 px-2 text-orange-400" title={`${criterion.streakDays} day streak`}>
          <Flame className="h-5 w-5 fill-orange-400" />
          <span className="text-sm font-black">{criterion.streakDays}</span>
        </span>
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-muted text-primary" title={`${streakLabel} tag`}>
          <StreakTagIcon className="h-5 w-5" />
        </span>
        <span className="flex h-10 min-w-10 items-center justify-center gap-1 rounded-2xl bg-primary/10 px-2 text-primary" title={`${criterion.totalCount} task completions`}>
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-black">{criterion.totalCount}</span>
        </span>
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-muted text-primary" title={`${totalLabel} tag`}>
          <TotalTagIcon className="h-5 w-5" />
        </span>
      </div>
    );
  }

  const tags = criterion.kind === "tag-streak" || criterion.kind === "tag-completions" ? criterion.tags : [];
  const streakDays = "days" in criterion ? criterion.days : null;
  const completionCount = "count" in criterion ? criterion.count : null;
  const compactTags = tags.length > 3;

  return (
    <div className="flex shrink-0 items-center gap-1.5" aria-label={`Requirement icons for ${reward.description}`}>
      {streakDays !== null ? (
        <span className="flex h-10 min-w-10 items-center justify-center gap-1 rounded-2xl bg-orange-500/15 px-2 text-orange-400" title={`${streakDays} day streak`}>
          <Flame className="h-5 w-5 fill-orange-400" />
          <span className="text-sm font-black">{streakDays}</span>
        </span>
      ) : null}
      {completionCount !== null ? (
        <span className="flex h-10 min-w-10 items-center justify-center gap-1 rounded-2xl bg-primary/10 px-2 text-primary" title={`${completionCount} task completions`}>
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-black">{completionCount.toLocaleString()}</span>
        </span>
      ) : null}
      {tags.length > 0 ? (
        <div className={compactTags ? "grid grid-cols-4 gap-1 rounded-2xl bg-muted/60 p-1" : "contents"}>
          {tags.map((tag) => {
            const TagIcon = rewardTagIcons[tag];
            const label = getTaskTagLabel(tag) ?? tag;
            return (
              <span
                key={tag}
                className={compactTags ? "grid h-5 w-5 place-items-center rounded-md text-primary" : "grid h-10 w-10 place-items-center rounded-2xl bg-muted text-primary"}
                title={`${label} tag`}
              >
                <TagIcon className={compactTags ? "h-3.5 w-3.5" : "h-5 w-5"} />
              </span>
            );
          })}
        </div>
      ) : null}
      {reward.recurring ? (
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-muted text-primary" title="Repeats after each claim">
          <RefreshCw className="h-5 w-5" />
        </span>
      ) : null}
    </div>
  );
}

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
    return { tasks: [], completedTaskIds: [], completionDatesByTask: {}, completionTagsByTask: {}, totalXp: 0 };
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return { tasks: [], completedTaskIds: [], completionDatesByTask: {}, completionTagsByTask: {}, totalXp: 0 };
  }

  try {
    const parsed = JSON.parse(saved) as Partial<DailyState>;
    return {
      tasks: Array.isArray(parsed.tasks)
        ? parsed.tasks
            .map((task) => ({
              id: String(task.id),
              title: typeof task.title === "string" ? task.title : undefined,
              icon: typeof task.icon === "string" ? task.icon : undefined
            }))
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
      completionTagsByTask:
        parsed.completionTagsByTask && typeof parsed.completionTagsByTask === "object"
          ? Object.fromEntries(
              Object.entries(parsed.completionTagsByTask).flatMap(([taskId, tag]) => {
                const normalizedTag = normalizeTaskTag(typeof tag === "string" ? tag : undefined);
                return normalizedTag ? [[taskId, normalizedTag]] : [];
              })
            )
          : {},
      totalXp: Math.max(0, Number(parsed.totalXp) || 0)
    };
  } catch {
    return { tasks: [], completedTaskIds: [], completionDatesByTask: {}, completionTagsByTask: {}, totalXp: 0 };
  }
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
  const [dailyState, setDailyState] = useState<DailyState>({ tasks: [], completedTaskIds: [], completionDatesByTask: {}, completionTagsByTask: {}, totalXp: 0 });
  const [claimedRewards, setClaimedRewards] = useState<Set<string>>(() => new Set());
  const [recurringRewards, setRecurringRewards] = useState<RecurringRewardState>({});
  const [claimBursts, setClaimBursts] = useState<string[]>([]);
  const [visibleRewardCount, setVisibleRewardCount] = useState(REWARD_BATCH_SIZE);
  const [visibleLevelRewardCount, setVisibleLevelRewardCount] = useState(LEVEL_REWARD_BATCH_SIZE);
  const [selectedReward, setSelectedReward] = useState<RewardPreview | null>(null);
  const [expandedRewardId, setExpandedRewardId] = useState<string | null>(null);
  const levelRewardsScrollRef = useRef<HTMLDivElement | null>(null);
  const currentLevelRewardRef = useRef<HTMLButtonElement | null>(null);
  const level = useMemo(() => getLevelSnapshot(dailyState.totalXp), [dailyState.totalXp]);
  const tagTotals = useMemo(() => getRewardTagTotals(dailyState), [dailyState]);
  const currentRewardIndex = useMemo(() => {
    const nextIndex = levelRewards.findIndex((reward) => reward.level > level.level);
    return nextIndex === -1 ? levelRewards.length - 1 : nextIndex;
  }, [level.level]);
  const sortedLevelRewards = useMemo(
    () =>
      [...levelRewards].sort((first, second) => {
        const firstStatus = getAchievementStatus(`level:${first.level}`, dailyState, claimedRewards);
        const secondStatus = getAchievementStatus(`level:${second.level}`, dailyState, claimedRewards);
        return achievementStatusOrder[firstStatus] - achievementStatusOrder[secondStatus] || first.level - second.level;
      }),
    [claimedRewards, dailyState]
  );
  const visibleLevelRewards = sortedLevelRewards.slice(0, visibleLevelRewardCount);
  const timelineProgressPercent = useMemo(() => {
    const firstRewardLevel = levelRewards[0].level;
    const lastVisibleLevel = visibleLevelRewards[visibleLevelRewards.length - 1]?.level ?? firstRewardLevel;
    const effectiveLevel = level.level + level.progressPercent / 100;
    const range = Math.max(1, lastVisibleLevel - firstRewardLevel);

    return Math.min(100, Math.max(0, ((effectiveLevel - firstRewardLevel) / range) * 100));
  }, [level.level, level.progressPercent, visibleLevelRewards]);
  const sortedRewardRows = useMemo(
    () =>
      [...rewardRows].sort((first, second) => {
        const firstStatus = getAchievementStatus(`reward:${first.id}`, dailyState, claimedRewards, recurringRewards);
        const secondStatus = getAchievementStatus(`reward:${second.id}`, dailyState, claimedRewards, recurringRewards);
        return achievementStatusOrder[firstStatus] - achievementStatusOrder[secondStatus];
      }),
    [claimedRewards, dailyState, recurringRewards]
  );
  const visibleRewardRows = sortedRewardRows.slice(0, visibleRewardCount);
  const pendingRewardIds = useMemo(
    () =>
      rewardRows
        .filter((reward) => getAchievementStatus(`reward:${reward.id}`, dailyState, claimedRewards, recurringRewards) === "claimable")
        .map((reward) => `reward:${reward.id}`),
    [claimedRewards, dailyState, recurringRewards]
  );
  const pendingLevelRewardIds = useMemo(
    () => getPendingRewardIds(dailyState, claimedRewards).filter((id) => id.startsWith("level:")),
    [claimedRewards, dailyState]
  );
  const pendingMedalRewardIds = useMemo(
    () => getPendingRewardIds(dailyState, claimedRewards).filter((id) => id.startsWith("medal:")),
    [claimedRewards, dailyState]
  );
  const sortedMedalSets = useMemo(
    () =>
      [...medalSets].sort((first, second) => {
        const firstStatus = Math.min(...first.tiers.map((tier) => achievementStatusOrder[getAchievementStatus(`medal:${first.id}:${tier.tier}`, dailyState, claimedRewards)]));
        const secondStatus = Math.min(...second.tiers.map((tier) => achievementStatusOrder[getAchievementStatus(`medal:${second.id}:${tier.tier}`, dailyState, claimedRewards)]));
        if (firstStatus !== secondStatus) {
          return firstStatus - secondStatus;
        }
        const firstProgress = Math.max(...first.tiers.map((tier) => Math.min(1, (tagTotals[first.id] ?? 0) / tier.completions)));
        const secondProgress = Math.max(...second.tiers.map((tier) => Math.min(1, (tagTotals[second.id] ?? 0) / tier.completions)));
        return secondProgress - firstProgress;
      }),
    [claimedRewards, dailyState, tagTotals]
  );

  useEffect(() => {
    setDailyState(loadDailyState());
    setClaimedRewards(loadClaimedRewardsFromStorage());
    setRecurringRewards(loadRecurringRewardsFromStorage());

    function syncState() {
      setDailyState(loadDailyState());
      setClaimedRewards(loadClaimedRewardsFromStorage());
      setRecurringRewards(loadRecurringRewardsFromStorage());
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
      setExpandedRewardId(null);
    }
  }

  function claimReward(id: string, xp = 0) {
    if (getAchievementStatus(id, dailyState, claimedRewards, recurringRewards) !== "claimable") {
      return;
    }

    if (isRecurringReward(id)) {
      const nextRecurringRewards = resetRecurringRewardAfterClaim(id, recurringRewards);
      setRecurringRewards(nextRecurringRewards);
      saveRecurringRewardsToStorage(nextRecurringRewards);
    } else {
      const nextClaimed = new Set(claimedRewards);
      nextClaimed.add(id);
      setClaimedRewards(nextClaimed);
      saveClaimedRewardsToStorage(nextClaimed);
    }
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
              ? { title: reward.description, config: createRewardConfig(reward.cosmetic) }
              : null;
            const rewardId = `reward:${reward.id}`;
            const status = getAchievementStatus(rewardId, dailyState, claimedRewards, recurringRewards);
            const pending = status === "claimable";
            const expanded = expandedRewardId === reward.id;
            const progressItems = getGeneralRewardProgress(reward.id, dailyState, recurringRewards);

            return (
              <div
                key={reward.id}
                className={pending ? "neon-card relative w-full rounded-3xl border-secondary/70 p-4 shadow-xl shadow-secondary/10" : "neon-card relative w-full rounded-3xl p-4"}
              >
                {pending ? <span className="absolute left-3 top-3 h-3 w-3 rounded-full bg-secondary shadow-lg shadow-secondary/40" /> : null}
                {claimBursts.includes(rewardId) ? <RewardClaimBurst /> : null}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setExpandedRewardId(expanded ? null : reward.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-expanded={expanded}
                    aria-label={`${expanded ? "Hide" : "Show"} details for ${reward.description}`}
                  >
                    <RewardRequirementIcons reward={reward} />
                    <div className="min-w-0 flex-1">
                      {statusLabel(status) ? (
                        <div className={pending ? "text-xs font-black text-secondary" : "text-xs font-bold text-muted-foreground"}>
                          {statusLabel(status)}
                        </div>
                      ) : null}
                    </div>
                    <ChevronDown className={expanded ? "h-5 w-5 shrink-0 rotate-180 text-muted-foreground transition-transform" : "h-5 w-5 shrink-0 text-muted-foreground transition-transform"} />
                  </button>
                  {preview ? (
                    <div className="flex shrink-0 items-center gap-2">
                      {reward.reward ? <div className="text-[10px] font-black text-secondary">{reward.reward}</div> : null}
                      <button
                        type="button"
                        onClick={() => setSelectedReward(preview)}
                        className="shrink-0 rounded-2xl outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={`Preview reward for ${reward.description}`}
                      >
                        <CharacterRewardPreview config={preview.config} />
                      </button>
                    </div>
                  ) : (
                    <div className="shrink-0 text-xs font-black text-secondary">{reward.reward}</div>
                  )}
                </div>

                <div className={expanded ? "grid grid-rows-[1fr] transition-all duration-300 ease-out" : "grid grid-rows-[0fr] transition-all duration-300 ease-out"}>
                  <div className="overflow-hidden">
                    <div className={expanded ? "mt-4 border-t border-white/10 pt-4 opacity-100 transition-opacity delay-100" : "opacity-0 transition-opacity"}>
                      <h2 className="break-words font-black">{reward.description}</h2>
                      {reward.recurring ? (
                        <p className="mt-1 text-xs font-bold text-muted-foreground">
                          {reward.criterion.kind === "recurring-task-completions"
                            ? "Can be claimed again after every 30 additional completed tasks."
                            : "Resets after each claim so it can be earned again."}
                        </p>
                      ) : null}
                      <div className="mt-3 space-y-3">
                        {progressItems.map((progress) => {
                          const remaining = Math.max(0, progress.target - progress.current);
                          const percent = progress.target > 0 ? Math.min(100, (progress.current / progress.target) * 100) : 0;
                          const progressStatus = progress.target === 0 ? "Add a task" : remaining > 0 ? `${remaining.toLocaleString()} left` : "Complete";

                          return (
                            <div key={progress.label}>
                              <div className="mb-1.5 flex items-start justify-between gap-3 text-xs font-bold">
                                <span className="text-muted-foreground">{progress.label}</span>
                                <span className="shrink-0 text-secondary">
                                  {progress.current.toLocaleString()}/{progress.target.toLocaleString()} {progress.unit} · {progressStatus}
                                </span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-background">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {pending ? (
                        <Button type="button" className="mt-4 w-full" onClick={() => claimReward(rewardId, reward.xp ?? 0)}>
                          Claim reward
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
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
            {visibleLevelRewards.map((reward) => {
              const earned = level.level >= reward.level;
              const current = reward.level === levelRewards[currentRewardIndex]?.level;
              const rewardId = `level:${reward.level}`;
              const status = getAchievementStatus(rewardId, dailyState, claimedRewards);
              const pending = status === "claimable";
              const StatusIcon = status === "locked" ? Lock : LockOpen;

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
                {statusLabel(status) ? (
                  <div className={pending ? "mt-1 text-xs font-black text-secondary" : "mt-1 text-xs font-bold text-muted-foreground"}>{statusLabel(status)}</div>
                ) : null}
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
            const total = tagTotals[set.id] ?? 0;
            const activeTier = set.tiers.find((tier) => total < tier.completions) ?? set.tiers[set.tiers.length - 1];

            return (
              <div key={set.id} className="neon-card rounded-3xl p-4">
                <div className="space-y-2">
                  {[...set.tiers].sort((first, second) => {
                    const firstStatus = getAchievementStatus(`medal:${set.id}:${first.tier}`, dailyState, claimedRewards);
                    const secondStatus = getAchievementStatus(`medal:${set.id}:${second.tier}`, dailyState, claimedRewards);
                    return achievementStatusOrder[firstStatus] - achievementStatusOrder[secondStatus] || first.completions - second.completions;
                  }).map((tier) => {
                    const complete = total >= tier.completions;
                    const expanded = tier.tier === activeTier.tier;
                    const progress = Math.min(100, (total / tier.completions) * 100);
                    const rewardId = `medal:${set.id}:${tier.tier}`;
                    const status = getAchievementStatus(rewardId, dailyState, claimedRewards);
                    const pending = status === "claimable";
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
                              <span className="shrink-0 text-xs font-black text-secondary">{tier.completions} completions</span>
                            </div>
                            <div className={expanded ? "mt-2 h-2 overflow-hidden rounded-full bg-background" : "mt-1 h-1 overflow-hidden rounded-full bg-background"}>
                              <div
                                className="h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progress}%`, backgroundColor: tier.color }}
                              />
                            </div>
                            <p className={expanded ? "mt-2 text-xs font-bold text-muted-foreground" : "mt-1 text-[10px] font-bold text-muted-foreground"}>
                              {statusLabel(status) ? `${statusLabel(status)} · ` : ""}{total}/{tier.completions}
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

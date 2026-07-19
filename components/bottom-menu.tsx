"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, UserRound } from "lucide-react";
import { getPendingRewardIds, loadClaimedRewardsFromStorage } from "@/lib/reward-state";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "sopro-ducktive-daily-v1";

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
    return getPendingRewardIds(
      {
        ...state,
        tasks,
        completedTaskIds,
        completionDatesByTask
      },
      loadClaimedRewardsFromStorage()
    ).length > 0;
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

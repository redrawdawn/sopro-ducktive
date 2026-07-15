"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import {
  AVATAR_PAUSED_KEY,
  avatarImagePath,
  avatarLayerOrder,
  avatarPartClass,
  defaultAvatarConfig,
  getStoredAvatarConfig,
  type AvatarConfig
} from "@/lib/avatar";
import { scheduleMotiveBackup } from "@/lib/motive-backup";
import { cn } from "@/lib/utils";

const frameSequence = [0, 1, 2, 1];
const bobSequence = [2, -3, 2, 0];
const armBobSequence = [0, -0.5, 0.5, 0];
const layerTransforms = {
  Detail: "translate3d(-50%, -50%, 0)",
  Body: "translate3d(-50%, -50%, 0)",
  Arms: "translate3d(-50%, calc(-50% + var(--avatar-arm-bob, 0px)), 0)",
  Face: "translate3d(-46%, -42%, 0)",
  Beard: "translate3d(-46%, -50%, 0)",
  Hair: "translate3d(-50%, -50%, 0)",
  Hat: "translate3d(-50%, -50%, 0)"
};
const legsAtOriginalHeight = new Set(["legs-default.png", "legs-blob.png", "legs-ghost.png", "legs-thin.png"]);

function layerTransform(category: keyof typeof layerTransforms | "Legs", partName: string) {
  if (category === "Legs") {
    return legsAtOriginalHeight.has(partName)
      ? "translate3d(-50%, -50%, 0)"
      : "translate3d(-50%, calc(-50% + 1px), 0)";
  }

  return layerTransforms[category];
}

type AvatarCharacterProps = {
  className?: string;
  config?: AvatarConfig;
  forcePaused?: boolean;
  interactive?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
};

function getStoredPaused() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(AVATAR_PAUSED_KEY) === "true";
}

export function AvatarCharacter({ className, config: providedConfig, forcePaused, interactive = false, size = "md" }: AvatarCharacterProps) {
  const [paused, setPaused] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [storedConfig, setStoredConfig] = useState<AvatarConfig>(defaultAvatarConfig);

  useEffect(() => {
    setPaused(providedConfig ? false : getStoredPaused());
    if (!providedConfig) {
      setStoredConfig(getStoredAvatarConfig());
    }
  }, [providedConfig]);

  useEffect(() => {
    if (providedConfig) {
      return undefined;
    }

    function syncConfig(event: Event) {
      const customEvent = event as CustomEvent<AvatarConfig>;
      setStoredConfig(customEvent.detail ?? getStoredAvatarConfig());
    }

    window.addEventListener("sopro-avatar-config-change", syncConfig);
    window.addEventListener("motive-account-state-change", syncConfig);
    window.addEventListener("storage", syncConfig);
    return () => {
      window.removeEventListener("sopro-avatar-config-change", syncConfig);
      window.removeEventListener("motive-account-state-change", syncConfig);
      window.removeEventListener("storage", syncConfig);
    };
  }, [providedConfig]);

  const config = providedConfig ?? storedConfig;
  const displayPaused = forcePaused ?? paused;

  useEffect(() => {
    if (displayPaused) {
      setFrameIndex(0);
      return undefined;
    }

    const interval = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % frameSequence.length);
    }, 180);

    return () => window.clearInterval(interval);
  }, [displayPaused]);

  function togglePaused() {
    if (!interactive) {
      return;
    }

    setPaused((current) => {
      const next = !current;
      window.localStorage.setItem(AVATAR_PAUSED_KEY, String(next));
      window.dispatchEvent(new CustomEvent("sopro-avatar-paused-change", { detail: next }));
      scheduleMotiveBackup(250);
      return next;
    });
  }

  const frame = frameSequence[frameIndex];
  const characterScale = size === "xl" ? 4.9 : size === "lg" ? 4.35 : size === "sm" ? 2.45 : 3.65;
  const frameStyle = {
    backgroundColor: config.colors.Background
  };
  const content = (
    <span
      className={cn("avatar-character", displayPaused && "avatar-character-paused")}
      style={
        {
          "--avatar-bob": `${displayPaused ? 0 : bobSequence[frameIndex]}px`,
          "--avatar-arm-bob": `${displayPaused ? 0 : armBobSequence[frameIndex]}px`,
          transform: `translateY(${displayPaused ? 0 : bobSequence[frameIndex]}px) scale(${characterScale})`
        } as CSSProperties
      }
    >
      {avatarLayerOrder.map((category) => (
        <img
          key={category}
          src={avatarImagePath(config, category, frame)}
          alt=""
          className={cn("avatar-layer", `avatar-layer-${category}`, avatarPartClass(config.parts[category]))}
          style={{ transform: layerTransform(category, config.parts[category]) }}
          draggable={false}
        />
      ))}
    </span>
  );

  const sizeClass = size === "xl" ? "h-32 w-32" : size === "lg" ? "h-28 w-28" : size === "sm" ? "h-16 w-16" : "h-24 w-24";

  if (interactive) {
    return (
      <button
        type="button"
        onClick={togglePaused}
        style={frameStyle}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-3xl border border-white/10 bg-muted shadow-inner transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          sizeClass,
          className
        )}
        aria-label={paused ? "Play profile animation" : "Pause profile animation"}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      style={frameStyle}
      className={cn("flex shrink-0 items-center justify-center rounded-3xl border border-white/10 bg-muted shadow-inner", sizeClass, className)}
    >
      {content}
    </div>
  );
}

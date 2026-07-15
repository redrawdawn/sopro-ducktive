"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Check, ChevronDown, ChevronUp, Lock, X } from "lucide-react";
import {
  AVATAR_ADMIN_UNLOCK_KEY,
  avatarCategories,
  avatarCategoriesForColor,
  avatarColorForCategory,
  avatarImagePath,
  avatarLabel,
  avatarLayerOrder,
  avatarPaletteColors,
  avatarPartClass,
  avatarTabOrder,
  avatarUnlockHint,
  defaultAvatarConfig,
  getStoredAvatarConfig,
  isAvatarPartUnlocked,
  saveAvatarConfig,
  type AvatarConfig,
  type AvatarEditorTab
} from "@/lib/avatar";
import { backupMotiveState } from "@/lib/motive-backup";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

type AvatarEditorProps = {
  onClose?: () => void;
};

export function AvatarEditor({ onClose }: AvatarEditorProps) {
  const [draft, setDraft] = useState<AvatarConfig>(defaultAvatarConfig);
  const [activeTab, setActiveTab] = useState<AvatarEditorTab>("Background");
  const [frameIndex, setFrameIndex] = useState(0);
  const [previewPaused, setPreviewPaused] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [lockedHint, setLockedHint] = useState<{ name: string; message: string } | null>(null);

  useEffect(() => {
    setDraft(getStoredAvatarConfig());
    setAdminUnlocked(window.localStorage.getItem(AVATAR_ADMIN_UNLOCK_KEY) === "true");

    function syncAdmin() {
      setAdminUnlocked(window.localStorage.getItem(AVATAR_ADMIN_UNLOCK_KEY) === "true");
      setDraft(getStoredAvatarConfig());
    }

    window.addEventListener("sopro-admin-unlocked-change", syncAdmin);
    window.addEventListener("motive-account-state-change", syncAdmin);
    window.addEventListener("storage", syncAdmin);
    return () => {
      window.removeEventListener("sopro-admin-unlocked-change", syncAdmin);
      window.removeEventListener("motive-account-state-change", syncAdmin);
      window.removeEventListener("storage", syncAdmin);
    };
  }, []);

  useEffect(() => {
    if (previewPaused) {
      setFrameIndex(0);
      return undefined;
    }

    const interval = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % frameSequence.length);
    }, 180);

    return () => window.clearInterval(interval);
  }, [previewPaused]);

  function setColor(color: string) {
    setSaved(false);
    setDraft((current) => {
      const next = structuredClone(current);
      avatarCategoriesForColor(activeTab).forEach((category) => {
        next.colors[category] = color;
      });
      return next;
    });
  }

  function setPart(name: string) {
    if (activeTab === "Background") {
      return;
    }

    if (!isAvatarPartUnlocked(activeTab, name, adminUnlocked)) {
      setLockedHint({ name, message: avatarUnlockHint(name) });
      window.setTimeout(() => setLockedHint(null), 1800);
      return;
    }

    setSaved(false);
    setDraft((current) => ({
      ...current,
      parts: {
        ...current.parts,
        [activeTab]: name
      }
    }));
  }

  function saveChanges() {
    saveAvatarConfig(draft);
    void backupMotiveState();
    setSaved(true);
  }

  const frame = previewPaused ? 0 : frameSequence[frameIndex];
  const showPalette = activeTab !== "Face";
  const backgroundTab = activeTab === "Background";
  const visibleParts =
    activeTab === "Background"
      ? []
      : [...avatarCategories[activeTab]].sort((first, second) => {
          const firstUnlocked = isAvatarPartUnlocked(activeTab, first, adminUnlocked);
          const secondUnlocked = isAvatarPartUnlocked(activeTab, second, adminUnlocked);

          if (firstUnlocked === secondUnlocked) {
            return 0;
          }

          return firstUnlocked ? -1 : 1;
        });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-black">Character</h1>
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={saveChanges}>
            <Check className="mr-2 h-4 w-4" />
            Save
          </Button>
          {onClose ? (
            <Button type="button" variant="outline" size="icon" onClick={onClose} aria-label="Close editor">
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div
        className="avatar-editor-stage"
        style={{ "--avatar-editor-bg": draft.colors.Background } as CSSProperties}
      >
        <button
          type="button"
          onClick={() => setPreviewPaused((paused) => !paused)}
          className="avatar-editor-preview-button"
          aria-label={previewPaused ? "Play character animation" : "Pause character animation"}
        >
          <span
            className={cn("avatar-character avatar-editor-preview", previewPaused && "avatar-character-paused")}
            style={
              {
                "--avatar-bob": `${previewPaused ? 0 : bobSequence[frameIndex]}px`,
                "--avatar-arm-bob": `${previewPaused ? 0 : armBobSequence[frameIndex]}px`
              } as CSSProperties
            }
          >
            {avatarLayerOrder.map((category) => (
              <img
                key={category}
                src={avatarImagePath(draft, category, frame)}
                alt=""
                className={cn("avatar-layer", `avatar-layer-${category}`, avatarPartClass(draft.parts[category]))}
                style={{ transform: layerTransform(category, draft.parts[category]) }}
                draggable={false}
              />
            ))}
          </span>
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {avatarTabOrder.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab);
              setPaletteOpen(false);
            }}
            className={cn(
              "shrink-0 rounded-2xl px-5 py-3 text-sm font-black text-muted-foreground",
              activeTab === tab && "bg-primary text-primary-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {showPalette ? (
        <div className={cn("avatar-editor-palette-wrap", backgroundTab && "background-colors", paletteOpen && "expanded")}>
          {!backgroundTab ? (
            <button
              type="button"
              onClick={() => setPaletteOpen((open) => !open)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground"
              aria-label={paletteOpen ? "Collapse colors" : "Expand colors"}
            >
              {paletteOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          ) : null}
          <div className="avatar-editor-palette">
            {avatarPaletteColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setColor(color)}
                className={cn("avatar-editor-swatch", avatarColorForCategory(draft, activeTab) === color && "active")}
                style={{ "--swatch": color } as CSSProperties}
                aria-label={`Use ${color}`}
              />
            ))}
          </div>
        </div>
      ) : null}

      {activeTab !== "Background" ? (
        <div className="grid grid-cols-3 gap-2 min-[390px]:grid-cols-4">
          {visibleParts.map((name) => {
            const previewFrame = 0;
            const unlocked = isAvatarPartUnlocked(activeTab, name, adminUnlocked);
            const showHint = lockedHint?.name === name;
            const previewConfig: AvatarConfig = {
              ...draft,
              parts: {
                ...draft.parts,
                [activeTab]: name
              }
            };

            return (
              <div key={name} className="relative">
                <button
                  type="button"
                  onClick={() => setPart(name)}
                  className={cn(
                    "relative grid min-h-20 w-full place-items-center gap-1 rounded-2xl bg-muted p-2 text-[10px] font-bold text-muted-foreground transition-opacity",
                    !unlocked && "opacity-45",
                    draft.parts[activeTab] === name && "outline outline-2 outline-primary"
                  )}
                >
                  {!unlocked ? (
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-background/90 p-1 text-muted-foreground">
                      <Lock className="h-3 w-3" />
                    </span>
                  ) : null}
                  <span className="relative block h-12 w-12 overflow-hidden">
                    <img
                      src={avatarImagePath(previewConfig, activeTab, previewFrame)}
                      alt=""
                      className="h-full w-full object-contain [image-rendering:pixelated]"
                      draggable={false}
                    />
                  </span>
                  <span className="max-w-full truncate">{avatarLabel(name)}</span>
                </button>
                {showHint ? (
                  <div className="absolute left-1/2 top-[calc(100%+0.35rem)] z-30 w-32 -translate-x-1/2 rounded-2xl bg-card px-2.5 py-2 text-center text-[10px] font-black text-secondary shadow-xl animate-in fade-in zoom-in-95 duration-200">
                    {lockedHint.message}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {saved ? <p className="text-center text-xs font-black text-accent">Saved</p> : null}
    </div>
  );
}

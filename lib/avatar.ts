export const AVATAR_CONFIG_KEY = "sopro-ducktive-avatar-config-v1";
export const AVATAR_PAUSED_KEY = "sopro-ducktive-avatar-paused";
export const AVATAR_ADMIN_UNLOCK_KEY = "sopro-ducktive-admin-unlocked";
const CLAIMED_REWARDS_KEY = "sopro-ducktive-claimed-rewards-v1";

export type AvatarCategory = "Body" | "Legs" | "Arms" | "Face" | "Beard" | "Hair" | "Hat" | "Detail";
export type AvatarEditorTab = "Background" | AvatarCategory;

export type AvatarConfig = {
  parts: Record<AvatarCategory, string>;
  colors: Record<AvatarEditorTab, string>;
};

export type AvatarCosmeticReward = {
  level: number;
  category: AvatarCategory;
  part: string;
};

export const avatarLayerOrder: AvatarCategory[] = ["Detail", "Body", "Legs", "Arms", "Face", "Beard", "Hair", "Hat"];
export const avatarTabOrder: AvatarEditorTab[] = ["Background", "Body", "Legs", "Arms", "Face", "Beard", "Hair", "Hat", "Detail"];

export const avatarDefaultColor = "#e6edf2";
export const avatarDefaultAccessoryColor = "#ffffff";
export const avatarPaletteColors = [
  "#e6edf2", "#dc3f4f", "#e86f35", "#e9c84a", "#35b86b", "#2aa99c",
  "#45a8d8", "#5f67d8", "#9352d9", "#d1538f", "#8fa0b6", "#202837",
  "#ffffff", "#f8c7d8", "#f2a65a", "#b7e06b", "#72d6c9", "#8fd3ff",
  "#bca7ff", "#ff86c8", "#c89463", "#7c5c42", "#56657a", "#111827",
  "#f4f1de", "#d8c3a5", "#b08968", "#7f5539", "#c1121f", "#780000",
  "#f77f00", "#fcbf49", "#a7c957", "#6a994e", "#386641", "#06d6a0",
  "#118ab2", "#073b4c", "#4361ee", "#3a0ca3", "#7209b7", "#b5179e",
  "#f72585", "#adb5bd", "#6c757d", "#343a40", "#0b132b"
];

export const avatarCategories: Record<AvatarCategory, string[]> = {
  Body: ["body-default.png", "body01.png", "body02.png", "body03.png", "body04.png", "body-alien.png", "body-antenna.png", "body-bear.png", "body-bunny.png", "body-cone.png", "body-ears.png", "body-flaps.png", "body-horns.png", "body-hornslarge.png", "body-long.png", "body-pointy.png", "body-pole.png", "body-round.png", "body-sides.png", "body-smallantenna.png", "body-square.png", "body-sticks.png"],
  Legs: ["legs-default.png", "legs-blob.png", "legs-four.png", "legs-ghost.png", "legs-insect.png", "legs-pixel.png", "legs-robot.png", "legs-spider.png", "legs-thin.png"],
  Arms: ["transparent.png", "arms-default.png", "arms01.png", "arms02.png", "arms03.png", "arms-bend.png", "arms-crab.png", "arms-down.png", "arms-fingers.png", "arms-gloves.png", "arms-large.png", "arms-noodle.png", "arms-rings.png", "arms-robot.png", "arms-robotic.png", "arms-side.png", "arms-small.png", "arms-spheres.png", "arms-spider.png", "arms-tentacle.png", "arms-wide.png"],
  Face: ["face-default.png", "face-bored.png", "face-cool.png", "face-cyclops.png", "face-dots.png", "face-evil.png", "face-eye.png", "face-eyepatch.png", "face-eyes.png", "face-glasses.png", "face-grumpy.png", "face-happy.png", "face-helmet.png", "face-monster.png", "face-puppet.png", "face-robot.png", "face-sad.png", "face-sleep.png", "face-small.png", "face-specs.png", "face-threeeyes.png"],
  Beard: ["transparent.png", "facial-beardA.png", "facial-beardB.png", "facial-beardC.png", "facial-beardD.png", "facial-beardE.png", "facial-moustacheA.png", "facial-moustacheB.png", "facial-moustacheC.png", "facial-moustacheD.png", "facial-moustacheE.png"],
  Hair: ["transparent.png", "hair-bob.png", "hair-clown.png", "hair-emo.png", "hair-fro.png", "hair-little.png", "hair-mid.png", "hair-pony.png", "hair-punk.png", "hair-short.png", "hair-slick.png", "hair-spike.png", "hair-wild.png"],
  Hat: ["transparent.png", "hat-adventure.png", "hat-arrow.png", "hat-backwards.png", "hat-band.png", "hat-beanie.png", "hat-bowl.png", "hat-cap.png", "hat-helmet.png", "hat-helmethorns.png", "hat-military.png", "hat-ninja.png", "hat-pirate.png", "hat-space.png", "hat-wizard.png"],
  Detail: ["transparent.png", "detail-fairy.png", "detail-tail.png", "detail-tailarrow.png", "detail-tailthick.png", "detail-tailthin.png", "detail-wings.png", "detail-wingsbat.png", "detail-wingslarge.png"]
};

export const defaultUnlockedAvatarParts: Record<AvatarCategory, string[]> = {
  Body: ["body-default.png", "body04.png", "body-cone.png", "body-long.png", "body-round.png", "body-square.png"],
  Legs: ["legs-default.png", "legs-pixel.png", "legs-thin.png"],
  Arms: ["transparent.png", "arms-default.png", "arms-small.png", "arms-spheres.png", "arms-side.png", "arms-down.png", "arms-wide.png"],
  Face: ["face-default.png", "face-bored.png", "face-dots.png", "face-eyes.png"],
  Beard: ["transparent.png", "facial-beardA.png", "facial-moustacheA.png"],
  Hair: ["transparent.png", "hair-bob.png", "hair-emo.png", "hair-little.png", "hair-mid.png", "hair-pony.png", "hair-short.png", "hair-slick.png"],
  Hat: ["transparent.png", "hat-cap.png", "hat-backwards.png", "hat-beanie.png"],
  Detail: ["transparent.png", "detail-tail.png"]
};

const avatarPartLabels: Record<string, string> = {
  "body01.png": "round ears",
  "body02.png": "sag",
  "body03.png": "propped",
  "body04.png": "point",
  "arms01.png": "rockets",
  "arms02.png": "big spider",
  "arms03.png": "big crab"
};

export const avatarLevelRewards: AvatarCosmeticReward[] = [
  { level: 5, category: "Body", part: "body02.png" },
  { level: 10, category: "Legs", part: "legs-blob.png" },
  { level: 15, category: "Face", part: "face-happy.png" },
  { level: 20, category: "Body", part: "body-bear.png" },
  { level: 25, category: "Hair", part: "hair-clown.png" },
  { level: 30, category: "Face", part: "face-cyclops.png" },
  { level: 35, category: "Body", part: "body-bunny.png" },
  { level: 40, category: "Legs", part: "legs-robot.png" },
  { level: 45, category: "Body", part: "body-pointy.png" },
  { level: 50, category: "Legs", part: "legs-ghost.png" },
  { level: 55, category: "Arms", part: "arms-crab.png" },
  { level: 60, category: "Face", part: "face-helmet.png" },
  { level: 65, category: "Body", part: "body-sticks.png" },
  { level: 70, category: "Hat", part: "hat-pirate.png" },
  { level: 75, category: "Arms", part: "arms03.png" },
  { level: 80, category: "Hat", part: "hat-space.png" },
  { level: 85, category: "Arms", part: "arms-gloves.png" },
  { level: 90, category: "Face", part: "face-evil.png" },
  { level: 100, category: "Hat", part: "hat-helmethorns.png" }
];

const avatarUnlockHints: Record<string, string> = {
  "legs-insect.png": "complete Run tasks 7 times",
  "legs-four.png": "complete Run tasks 30 times",
  "legs-spider.png": "complete Run tasks 60 times",
  "arms-noodle.png": "complete Workout tasks 7 times",
  "arms-fingers.png": "complete Workout tasks 30 times",
  "arms-large.png": "complete Workout tasks 60 times",
  "face-sleep.png": "complete Wake up tasks 7 times",
  "face-grumpy.png": "complete Wake up tasks 30 times",
  "face-monster.png": "complete Wake up tasks 60 times",
  "face-glasses.png": "complete Read tasks 7 times",
  "face-specs.png": "complete Read tasks 30 times",
  "face-threeeyes.png": "complete Read tasks 60 times",
  "hat-arrow.png": "complete Meditate tasks 7 times",
  "hat-bowl.png": "complete Meditate tasks 30 times",
  "hat-wizard.png": "complete Meditate tasks 60 times",
  "hair-wild.png": "get a 21 day Wake up streak",
  "hat-band.png": "have a Workout and Run streak of 14 or more",
  "hat-ninja.png": "have a Workout, Run, and Meditate streak of 5 or more",
  "hat-military.png": "have a streak of 7 or more on any 5 tasks at one time",
  "hat-adventure.png": "complete 20 Workout, Run, Read, Wake up, Meditate, Garden, and Work tasks",
  "face-sad.png": "have a 5 day streak of Wake up, Read, and Garden",
  "face-cool.png": "have a 14 day streak of Wake up, Workout, and Run",
  ...Object.fromEntries(avatarLevelRewards.map((reward) => [reward.part, `unlocks at level ${reward.level}`]))
};

const avatarPartRewardIds: Record<string, string> = {
  "hair-wild.png": "reward:sleep-30-total",
  "hat-band.png": "reward:run-40-total",
  "hat-ninja.png": "reward:workout-run-7",
  "hat-military.png": "reward:five-daily-7",
  "hat-adventure.png": "reward:all-tags-20",
  "face-sad.png": "reward:wake-read-garden-5",
  "face-cool.png": "reward:wake-workout-run-14",
  "legs-insect.png": "medal:run:Bronze",
  "legs-four.png": "medal:run:Silver",
  "legs-spider.png": "medal:run:Gold",
  "arms-noodle.png": "medal:workout:Bronze",
  "arms-fingers.png": "medal:workout:Silver",
  "arms-large.png": "medal:workout:Gold",
  "face-sleep.png": "medal:wake-up:Bronze",
  "face-grumpy.png": "medal:wake-up:Silver",
  "face-monster.png": "medal:wake-up:Gold",
  "face-glasses.png": "medal:read:Bronze",
  "face-specs.png": "medal:read:Silver",
  "face-threeeyes.png": "medal:read:Gold",
  "hat-arrow.png": "medal:meditate:Bronze",
  "hat-bowl.png": "medal:meditate:Silver",
  "hat-wizard.png": "medal:meditate:Gold",
  ...Object.fromEntries(avatarLevelRewards.map((reward) => [reward.part, `level:${reward.level}`]))
};

export const defaultAvatarConfig: AvatarConfig = {
  parts: {
    Body: "body-default.png",
    Legs: "legs-default.png",
    Arms: "arms-default.png",
    Face: "face-default.png",
    Beard: "transparent.png",
    Hair: "transparent.png",
    Hat: "transparent.png",
    Detail: "transparent.png"
  },
  colors: {
    Background: "#111827",
    Body: avatarDefaultColor,
    Legs: avatarDefaultColor,
    Arms: avatarDefaultColor,
    Face: avatarDefaultColor,
    Beard: avatarDefaultAccessoryColor,
    Hair: avatarDefaultAccessoryColor,
    Hat: avatarDefaultAccessoryColor,
    Detail: avatarDefaultAccessoryColor
  }
};

export function avatarColorForCategory(config: AvatarConfig, category: AvatarEditorTab) {
  return ["Arms", "Legs", "Face"].includes(category) ? config.colors.Body : config.colors[category];
}

export function avatarCategoriesForColor(category: AvatarEditorTab): AvatarEditorTab[] {
  return ["Body", "Arms", "Legs"].includes(category) ? ["Body", "Arms", "Legs", "Face"] : [category];
}

export function normalizeAvatarConfig(value: unknown): AvatarConfig {
  const maybeConfig = value as Partial<AvatarConfig> | null;
  const maybeParts = (maybeConfig?.parts ?? {}) as Partial<Record<AvatarCategory, unknown>>;
  const maybeColors = (maybeConfig?.colors ?? {}) as Partial<Record<AvatarEditorTab, unknown>>;

  return {
    parts: Object.fromEntries(
      avatarLayerOrder.map((category) => [
        category,
        typeof maybeParts[category] === "string" ? maybeParts[category] : defaultAvatarConfig.parts[category]
      ])
    ) as Record<AvatarCategory, string>,
    colors: Object.fromEntries(
      avatarTabOrder.map((category) => [
        category,
        typeof maybeColors[category] === "string" && maybeColors[category].startsWith("#")
          ? maybeColors[category]
          : defaultAvatarConfig.colors[category]
      ])
    ) as Record<AvatarEditorTab, string>
  };
}

export function getStoredAvatarConfig() {
  if (typeof window === "undefined") {
    return defaultAvatarConfig;
  }

  const saved = window.localStorage.getItem(AVATAR_CONFIG_KEY);
  if (!saved) {
    return defaultAvatarConfig;
  }

  try {
    return normalizeAvatarConfig(JSON.parse(saved));
  } catch {
    return defaultAvatarConfig;
  }
}

export function saveAvatarConfig(config: AvatarConfig) {
  window.localStorage.setItem(AVATAR_CONFIG_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent("sopro-avatar-config-change", { detail: config }));
}

export function avatarLabel(name: string) {
  if (typeof name !== "string") return "none";
  if (name === "transparent.png") return "none";
  if (avatarPartLabels[name]) return avatarPartLabels[name];
  return name.replace(".png", "").replace(/^(body|arms|legs|face|facial|hair|hat|detail)-?/, "") || "none";
}

export function isAvatarPartUnlocked(category: AvatarCategory, name: string, adminUnlocked = false) {
  if (adminUnlocked || defaultUnlockedAvatarParts[category].includes(name)) {
    return true;
  }

  const rewardId = avatarPartRewardIds[name];
  if (!rewardId || typeof window === "undefined") {
    return false;
  }

  try {
    const claimed = JSON.parse(window.localStorage.getItem(CLAIMED_REWARDS_KEY) ?? "[]") as unknown;
    return Array.isArray(claimed) && claimed.includes(rewardId);
  } catch {
    return false;
  }
}

export function avatarUnlockHint(name: string) {
  return avatarUnlockHints[name] ?? "not obtainable yet";
}

export function avatarPartClass(name: string) {
  if (typeof name !== "string") return "part-none";
  return `part-${name.replace(".png", "").replace(/\d$/, "").replace(/[^a-z0-9]+/gi, "-")}`;
}

export function avatarImagePath(config: AvatarConfig, category: AvatarCategory, frame: number) {
  const name = typeof config.parts[category] === "string" ? config.parts[category] : defaultAvatarConfig.parts[category];
  if (name === "transparent.png") {
    return "/creature-mixer-editor/source/PNG/transparent.png";
  }

  const color = avatarColorForCategory(config, category).replace("#", "");
  if (category === "Legs") {
    const stem = name.replace(".png", "");
    return `/creature-mixer-editor/generated/${color}/${stem}${frame}.png`;
  }

  return `/creature-mixer-editor/generated/${color}/${name}`;
}

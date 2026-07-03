export const AVATAR_CONFIG_KEY = "sopro-ducktive-avatar-config-v1";
export const AVATAR_PAUSED_KEY = "sopro-ducktive-avatar-paused";
export const AVATAR_ADMIN_UNLOCK_KEY = "sopro-ducktive-admin-unlocked";

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
  "legs-insect.png": "7 day run streak",
  "legs-four.png": "30 day run streak",
  "legs-spider.png": "60 day run streak",
  "arms-noodle.png": "7 day workout streak",
  "arms-fingers.png": "30 day workout streak",
  "arms-large.png": "60 day workout streak",
  "face-sleep.png": "7 day sleep streak",
  "face-grumpy.png": "30 day sleep streak",
  "face-monster.png": "60 day sleep streak",
  "face-glasses.png": "7 day read streak",
  "face-specs.png": "30 day read streak",
  "face-threeeyes.png": "60 day read streak",
  "hat-arrow.png": "7 day mind streak",
  "hat-bowl.png": "30 day mind streak",
  "hat-wizard.png": "60 day mind streak",
  "hair-wild.png": "complete sleep tasks 30 times",
  "hat-band.png": "go on 40 runs total",
  "hat-ninja.png": "have a workout and run streak of 7 or more at one time",
  "hat-military.png": "have a 7 day streak on 5 daily tasks at once",
  ...Object.fromEntries(avatarLevelRewards.map((reward) => [reward.part, `unlocks at level ${reward.level}`]))
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
  return adminUnlocked || defaultUnlockedAvatarParts[category].includes(name);
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

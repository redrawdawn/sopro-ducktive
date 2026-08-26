export const taskTagRules = [
  { id: "workout", label: "Workout", keywords: ["workout", "exercise", "gym"] },
  { id: "run", label: "Run", keywords: ["run", "walk", "jog"] },
  { id: "read", label: "Read", keywords: ["read", "bible", "write"] },
  { id: "wake-up", label: "Wake up", keywords: ["wake up", "sleep", "morning"] },
  { id: "meditate", label: "Meditate", keywords: ["meditate", "study", "pray"] },
  { id: "garden", label: "Garden", keywords: ["garden", "plants", "woods"] },
  { id: "work", label: "Work", keywords: ["work", "money", "computer"] }
] as const;

export type TaskTag = (typeof taskTagRules)[number]["id"];

export function inferTaskTag(title: string): TaskTag | undefined {
  const normalized = title.toLowerCase();
  return taskTagRules.find((rule) => rule.keywords.some((keyword) => normalized.includes(keyword)))?.id;
}

export function getTaskTagLabel(tag?: TaskTag) {
  return taskTagRules.find((rule) => rule.id === tag)?.label;
}

export function normalizeTaskTag(value?: string): TaskTag | undefined {
  return taskTagRules.some((rule) => rule.id === value) ? (value as TaskTag) : undefined;
}

export function getStoredTaskTag(task: { title?: string; icon?: string }): TaskTag | undefined {
  return typeof task.title === "string" ? inferTaskTag(task.title) : normalizeTaskTag(task.icon);
}

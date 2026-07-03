export type LevelSnapshot = {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  progressPercent: number;
};

export function xpRequiredForLevel(level: number) {
  return Math.min(500, 100 + Math.max(0, level - 1) * 10);
}

export function getLevelSnapshot(totalXp: number): LevelSnapshot {
  let level = 1;
  let xpForCurrentLevel = 0;
  let xpForNextLevel = xpRequiredForLevel(level);

  while (totalXp >= xpForNextLevel) {
    level += 1;
    xpForCurrentLevel = xpForNextLevel;
    xpForNextLevel += xpRequiredForLevel(level);
  }

  const currentXp = totalXp - xpForCurrentLevel;
  const nextLevelXp = xpForNextLevel - xpForCurrentLevel;

  return {
    level,
    currentXp,
    nextLevelXp,
    progressPercent: nextLevelXp === 0 ? 100 : Math.min(100, Math.round((currentXp / nextLevelXp) * 100))
  };
}

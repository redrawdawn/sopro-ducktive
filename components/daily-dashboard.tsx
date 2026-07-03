"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bed,
  Bike,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  CalendarCheck,
  Car,
  Check,
  Coffee,
  Droplets,
  Dumbbell,
  Flame,
  Footprints,
  GraduationCap,
  Hammer,
  Heart,
  Home,
  Laptop,
  Leaf,
  Moon,
  Music,
  Pencil,
  PiggyBank,
  Pill,
  Plus,
  ShoppingCart,
  Sparkles,
  Star,
  Sun,
  Trash2,
  Utensils,
  Wallet,
  WashingMachine,
  X
} from "lucide-react";
import { getLevelSnapshot } from "@/lib/levels";
import { AVATAR_ADMIN_UNLOCK_KEY } from "@/lib/avatar";
import { restoreMotiveStateFromBackup, scheduleMotiveBackup } from "@/lib/motive-backup";
import { isPublicProfileEnabled, setPublicProfileEnabled, syncCurrentPublicProfile } from "@/lib/public-profile";
import { createClient } from "@/lib/supabase/client";
import { AvatarCharacter } from "@/components/avatar-character";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { XpProgressBar } from "@/components/xp-progress-bar";

type DailyTask = {
  id: string;
  title: string;
  icon?: string;
  subtasks?: DailySubtask[];
};

type DailySubtask = {
  id: string;
  title: string;
};

type DailyState = {
  tasks: DailyTask[];
  completedDate: string;
  completedTaskIds: string[];
  completedSubtaskIdsByTask: Record<string, string[]>;
  completionDatesByTask: Record<string, string[]>;
  totalXp: number;
};

type CycleTask = {
  id: string;
  title: string;
  icon?: string;
  createdDate: string;
};

type CycleTaskState = {
  weekly: CycleTask[];
  monthly: CycleTask[];
  yearly: CycleTask[];
  completedPeriodKeys: Record<Exclude<TaskTab, "daily">, string>;
  completedTaskIds: Record<Exclude<TaskTab, "daily">, string[]>;
};

const STORAGE_KEY = "sopro-ducktive-daily-v1";
const CYCLE_STORAGE_KEY = "sopro-ducktive-cycle-tasks-v1";
const THEME_STORAGE_KEY = "sopro-ducktive-theme";
const DAILY_TASK_LIMIT = 5;
const CYCLE_TASK_LIMIT = 3;
const SUBTASK_LIMIT = 5;
type ThemeMode = "dark" | "light";
type TaskTab = "daily" | "weekly" | "monthly" | "yearly";
type CycleTab = Exclude<TaskTab, "daily">;

const taskTabs: Array<{ id: TaskTab; label: string }> = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" }
];

const taskIcons = [
  { id: "book", label: "Book", icon: BookOpen },
  { id: "workout", label: "Workout", icon: Dumbbell },
  { id: "run", label: "Run", icon: Footprints },
  { id: "food", label: "Food", icon: Utensils },
  { id: "home", label: "Home", icon: Home },
  { id: "clean", label: "Clean", icon: Sparkles },
  { id: "shower", label: "Shower", icon: Sparkles },
  { id: "health", label: "Health", icon: Heart },
  { id: "sleep", label: "Sleep", icon: Bed },
  { id: "bike", label: "Bike", icon: Bike },
  { id: "mind", label: "Mind", icon: Brain },
  { id: "work", label: "Work", icon: BriefcaseBusiness },
  { id: "plan", label: "Plan", icon: CalendarCheck },
  { id: "drive", label: "Drive", icon: Car },
  { id: "coffee", label: "Coffee", icon: Coffee },
  { id: "water", label: "Water", icon: Droplets },
  { id: "study", label: "Study", icon: GraduationCap },
  { id: "project", label: "Project", icon: Hammer },
  { id: "computer", label: "Computer", icon: Laptop },
  { id: "outside", label: "Outside", icon: Leaf },
  { id: "music", label: "Music", icon: Music },
  { id: "money", label: "Money", icon: PiggyBank },
  { id: "medicine", label: "Medicine", icon: Pill },
  { id: "shopping", label: "Shopping", icon: ShoppingCart },
  { id: "goal", label: "Goal", icon: Star },
  { id: "budget", label: "Budget", icon: Wallet },
  { id: "laundry", label: "Laundry", icon: WashingMachine }
];

function getTaskIcon(iconId?: string) {
  return taskIcons.find((icon) => icon.id === iconId);
}

function getTaskTagLabel(iconId?: string) {
  const labels: Record<string, string> = {
    workout: "workout",
    book: "book",
    run: "run",
    outside: "nature",
    shower: "clean",
    clean: "clean",
    laundry: "clean",
    mind: "mind"
  };

  return iconId ? labels[iconId] : undefined;
}

function inferTaskIcon(title: string) {
  const normalized = title.toLowerCase();
  const iconRules = [
    { icon: "mind", words: ["study", "meditate", "meditation", "prayer"] },
    { icon: "book", words: ["read", "bible", "book", "chapter", "devotional"] },
    { icon: "run", words: ["run", "jog", "sprint", "walk", "cardio"] },
    { icon: "workout", words: ["workout", "exercise", "gym", "lift", "arms", "legs", "chest"] },
    { icon: "food", words: ["cook", "eat", "meal", "food", "breakfast", "lunch", "dinner"] },
    { icon: "shower", words: ["clean", "wash", "bath", "shower"] },
    { icon: "clean", words: ["sweep", "vacuum", "dust"] },
    { icon: "laundry", words: ["laundry", "wash clothes"] },
    { icon: "health", words: ["health", "doctor", "heart"] },
    { icon: "sleep", words: ["sleep", "wake up", "bed"] },
    { icon: "water", words: ["drink", "water", "hydrate", "h2o"] },
    { icon: "outside", words: ["outside", "woods", "hike", "garden"] },
    { icon: "money", words: ["money", "save"] },
    { icon: "budget", words: ["budget", "bills", "pay"] },
    { icon: "shopping", words: ["shop", "store", "groceries"] },
    { icon: "music", words: ["music", "practice"] },
    { icon: "home", words: ["home", "house"] },
    { icon: "work", words: ["work", "job"] }
  ];

  return iconRules.find((rule) => rule.words.some((word) => normalized.includes(word)))?.icon;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getWeekKey(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 1);
  const dayOffset = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return `${date.getFullYear()}-W${Math.floor((dayOffset + start.getDay()) / 7) + 1}`;
}

function getPeriodKey(tab: CycleTab, date = new Date()) {
  if (tab === "weekly") {
    return getWeekKey(date);
  }

  if (tab === "monthly") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  return `${date.getFullYear()}`;
}

function addDays(dateKey: string, amount: number) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return date.toISOString().slice(0, 10);
}

function daysBetween(startDateKey: string, endDateKey: string) {
  const start = new Date(`${startDateKey}T00:00:00`);
  const end = new Date(`${endDateKey}T00:00:00`);
  const difference = end.getTime() - start.getTime();
  return Math.max(0, Math.round(difference / 86400000));
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getTaskStreak(completionDates: string[] = []) {
  const completedDates = new Set(completionDates);
  let cursor = completedDates.has(todayKey()) ? todayKey() : addDays(todayKey(), -1);
  let streak = 0;

  while (completedDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
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

function getYearlyTaskStats(completionDatesByTask: Record<string, string[]>, now = new Date()) {
  const year = now.getFullYear().toString();
  const yearlyCompletionDates = Object.values(completionDatesByTask).map((dates) =>
    dates.filter((date) => date.startsWith(year))
  );

  return {
    highestStreak: Math.max(0, ...yearlyCompletionDates.map((dates) => getLongestStreak(dates))),
    totalComplete: yearlyCompletionDates.reduce((total, dates) => total + dates.length, 0)
  };
}

function getNextYearCountdown(now = new Date()) {
  const currentYearStart = new Date(now.getFullYear(), 0, 1);
  const nextYear = new Date(now.getFullYear() + 1, 0, 1);
  const remaining = Math.max(0, nextYear.getTime() - now.getTime());
  const yearLength = nextYear.getTime() - currentYearStart.getTime();
  const elapsed = Math.max(0, now.getTime() - currentYearStart.getTime());
  const progress = Math.min(100, Math.max(0, (elapsed / yearLength) * 100));
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);

  return { days, hours, minutes, progress, targetYear: nextYear.getFullYear() };
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function stringArrayRecord(value: unknown) {
  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, values]) => [key, stringArray(values)])
  ) as Record<string, string[]>;
}

function normalizeDailyTask(value: unknown): DailyTask | null {
  const task = value as Partial<DailyTask> | null;
  if (!task || typeof task.id !== "string" || typeof task.title !== "string") {
    return null;
  }

  return {
    id: task.id,
    title: task.title,
    icon: typeof task.icon === "string" ? task.icon : undefined,
    subtasks: Array.isArray(task.subtasks)
      ? task.subtasks
          .map((subtask) => {
            const maybeSubtask = subtask as Partial<DailySubtask> | null;
            return maybeSubtask && typeof maybeSubtask.id === "string" && typeof maybeSubtask.title === "string"
              ? { id: maybeSubtask.id, title: maybeSubtask.title }
              : null;
          })
          .filter((subtask): subtask is DailySubtask => subtask !== null)
      : []
  };
}

function normalizeCycleTask(value: unknown): CycleTask | null {
  const task = value as Partial<CycleTask> | null;
  if (!task || typeof task.id !== "string" || typeof task.title !== "string") {
    return null;
  }

  return {
    id: task.id,
    title: task.title,
    icon: typeof task.icon === "string" ? task.icon : undefined,
    createdDate: typeof task.createdDate === "string" ? task.createdDate : todayKey()
  };
}

function loadState(): DailyState {
  if (typeof window === "undefined") {
    return { tasks: [], completedDate: todayKey(), completedTaskIds: [], completedSubtaskIdsByTask: {}, completionDatesByTask: {}, totalXp: 0 };
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  const fallback: DailyState = { tasks: [], completedDate: todayKey(), completedTaskIds: [], completedSubtaskIdsByTask: {}, completionDatesByTask: {}, totalXp: 0 };

  if (!saved) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(saved) as DailyState;
    const tasks = Array.isArray(parsed.tasks)
      ? parsed.tasks.map(normalizeDailyTask).filter((task): task is DailyTask => task !== null)
      : [];
    const completedDate = typeof parsed.completedDate === "string" ? parsed.completedDate : todayKey();
    const completedTaskIds = stringArray(parsed.completedTaskIds);
    const completedSubtaskIdsByTask = stringArrayRecord(parsed.completedSubtaskIdsByTask);
    const completionDatesByTask = stringArrayRecord(parsed.completionDatesByTask);

    if (completedDate !== todayKey()) {
      const elapsedDays = Math.max(1, daysBetween(completedDate, todayKey()));
      const completedCount = completedTaskIds.length;
      const firstDayPenalty = Math.max(0, tasks.length - completedCount);
      const additionalMissedDayPenalty = Math.max(0, elapsedDays - 1) * tasks.length;

      return {
        tasks,
        completedDate: todayKey(),
        completedTaskIds: [],
        completedSubtaskIdsByTask: {},
        completionDatesByTask,
        totalXp: Math.max(0, (Number(parsed.totalXp) || 0) - firstDayPenalty - additionalMissedDayPenalty)
      };
    }

    return {
      tasks,
      completedDate,
      completedTaskIds,
      completedSubtaskIdsByTask,
      completionDatesByTask,
      totalXp: Number(parsed.totalXp) || 0
    };
  } catch {
    return fallback;
  }
}

function createCycleFallback(): CycleTaskState {
  return {
    weekly: [],
    monthly: [],
    yearly: [],
    completedPeriodKeys: {
      weekly: getPeriodKey("weekly"),
      monthly: getPeriodKey("monthly"),
      yearly: getPeriodKey("yearly")
    },
    completedTaskIds: {
      weekly: [],
      monthly: [],
      yearly: []
    }
  };
}

function loadCycleState(): CycleTaskState {
  if (typeof window === "undefined") {
    return createCycleFallback();
  }

  const fallback = createCycleFallback();
  const saved = window.localStorage.getItem(CYCLE_STORAGE_KEY);
  if (!saved) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<CycleTaskState>;
    const next: CycleTaskState = {
      weekly: Array.isArray(parsed.weekly) ? parsed.weekly.map(normalizeCycleTask).filter((task): task is CycleTask => task !== null) : [],
      monthly: Array.isArray(parsed.monthly) ? parsed.monthly.map(normalizeCycleTask).filter((task): task is CycleTask => task !== null) : [],
      yearly: Array.isArray(parsed.yearly) ? parsed.yearly.map(normalizeCycleTask).filter((task): task is CycleTask => task !== null) : [],
      completedPeriodKeys: {
        ...fallback.completedPeriodKeys,
        ...(parsed.completedPeriodKeys ?? {})
      },
      completedTaskIds: {
        weekly: stringArray(parsed.completedTaskIds?.weekly),
        monthly: stringArray(parsed.completedTaskIds?.monthly),
        yearly: stringArray(parsed.completedTaskIds?.yearly)
      }
    };

    (["weekly", "monthly", "yearly"] as CycleTab[]).forEach((tab) => {
      const currentPeriod = getPeriodKey(tab);
      if (next.completedPeriodKeys[tab] !== currentPeriod) {
        next.completedPeriodKeys[tab] = currentPeriod;
        next.completedTaskIds[tab] = [];
      }
    });

    return next;
  } catch {
    return fallback;
  }
}

export function DailyDashboard() {
  const router = useRouter();
  const [dailyState, setDailyState] = useState<DailyState>({
    tasks: [],
    completedDate: todayKey(),
    completedTaskIds: [],
    completedSubtaskIdsByTask: {},
    completionDatesByTask: {},
    totalXp: 0
  });
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [cycleState, setCycleState] = useState<CycleTaskState>(() => createCycleFallback());
  const [cyclePendingTitle, setCyclePendingTitle] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSubtaskTitles, setEditSubtaskTitles] = useState<Record<string, string>>({});
  const [subtaskTitleByTask, setSubtaskTitleByTask] = useState<Record<string, string>>({});
  const [addingSubtaskForTaskId, setAddingSubtaskForTaskId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [taskPendingDelete, setTaskPendingDelete] = useState<DailyTask | null>(null);
  const [adminPromptOpen, setAdminPromptOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [publicProfileEnabled, setPublicProfileEnabledState] = useState(false);
  const [activeTab, setActiveTab] = useState<TaskTab>("daily");
  const [now, setNow] = useState(() => new Date());
  const [xpPulse, setXpPulse] = useState(false);
  const [completionBursts, setCompletionBursts] = useState<Array<{ taskId: string; id: string }>>([]);
  const [dailyLimitMessage, setDailyLimitMessage] = useState(false);
  const [checkCooldownIds, setCheckCooldownIds] = useState<string[]>([]);
  const [tagMessage, setTagMessage] = useState<{ taskId: string; label: string } | null>(null);
  const [streakMessageTaskId, setStreakMessageTaskId] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const previousXpRef = useRef<number | null>(null);
  const checkCooldownRef = useRef<Set<string>>(new Set());
  const level = useMemo(() => getLevelSnapshot(dailyState.totalXp), [dailyState.totalXp]);
  const completedTaskIds = useMemo(() => new Set(dailyState.completedTaskIds), [dailyState.completedTaskIds]);
  const canAddTask = dailyState.tasks.length < DAILY_TASK_LIMIT;
  const activeCycleTab = activeTab === "daily" ? null : activeTab;
  const activeCycleTasks = activeCycleTab ? cycleState[activeCycleTab] : [];
  const canAddCycleTask = activeCycleTab ? activeCycleTasks.length < CYCLE_TASK_LIMIT : false;
  const activeCycleLabel = activeCycleTab ? activeCycleTab[0].toUpperCase() + activeCycleTab.slice(1) : "";
  const activeAddCount = activeCycleTab ? activeCycleTasks.length : dailyState.tasks.length;
  const activeAddLimit = activeCycleTab ? CYCLE_TASK_LIMIT : DAILY_TASK_LIMIT;
  const activeAddWarning =
    activeCycleTab === "weekly"
      ? "You can only add 3 weekly tasks per week. These reset every week and cannot be deleted."
      : activeCycleTab === "monthly"
        ? "You can only add 3 monthly tasks per month. These reset every month and cannot be deleted."
        : activeCycleTab === "yearly"
          ? "You can only add 3 yearly tasks per year. These reset every year and cannot be deleted once added."
          : null;
  const yearlyCountdown = useMemo(() => getNextYearCountdown(now), [now]);
  const yearlyStats = useMemo(() => getYearlyTaskStats(dailyState.completionDatesByTask, now), [dailyState.completionDatesByTask, now]);
  const checkCooldownSet = useMemo(() => new Set(checkCooldownIds), [checkCooldownIds]);

  useEffect(() => {
    async function loadLocalAndCloudState() {
      await restoreMotiveStateFromBackup();

      setDailyState(loadState());
      setCycleState(loadCycleState());
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === "light" || savedTheme === "dark") {
        setThemeMode(savedTheme);
        document.documentElement.dataset.theme = savedTheme;
      }
      setAdminUnlocked(window.localStorage.getItem(AVATAR_ADMIN_UNLOCK_KEY) === "true");
      setPublicProfileEnabledState(isPublicProfileEnabled());
      setStorageReady(true);
    }

    void loadLocalAndCloudState();
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dailyState));
    scheduleMotiveBackup();
  }, [dailyState, storageReady]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    window.localStorage.setItem(CYCLE_STORAGE_KEY, JSON.stringify(cycleState));
    scheduleMotiveBackup();
  }, [cycleState, storageReady]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (previousXpRef.current !== null && dailyState.totalXp > previousXpRef.current) {
      setXpPulse(true);
      const timeout = window.setTimeout(() => setXpPulse(false), 420);
      previousXpRef.current = dailyState.totalXp;
      return () => window.clearTimeout(timeout);
    }

    previousXpRef.current = dailyState.totalXp;
    return undefined;
  }, [dailyState.totalXp]);

  useEffect(() => {
    function openSettings() {
      openSettingsPanel();
    }

    window.addEventListener("sopro-open-settings", openSettings);
    if (window.sessionStorage.getItem("motive-open-settings") === "true") {
      window.sessionStorage.removeItem("motive-open-settings");
      window.setTimeout(openSettingsPanel, 80);
    }
    return () => window.removeEventListener("sopro-open-settings", openSettings);
  }, []);

  function openSettingsPanel() {
    setSettingsOpen(true);
    window.requestAnimationFrame(() => setSettingsVisible(true));
  }

  function closeSettingsPanel() {
    setSettingsVisible(false);
    window.setTimeout(() => setSettingsOpen(false), 220);
  }

  function closeAddTaskForm() {
    setShowAddForm(false);
    setNewTaskTitle("");
    setCyclePendingTitle(null);
  }

  function openAddTaskForm() {
    if (activeCycleTab) {
      if (!canAddCycleTask) {
        setDailyLimitMessage(true);
        window.setTimeout(() => setDailyLimitMessage(false), 1800);
        return;
      }

      setShowAddForm(true);
      return;
    }

    if (!canAddTask) {
      setDailyLimitMessage(true);
      window.setTimeout(() => setDailyLimitMessage(false), 1800);
      return;
    }

    setShowAddForm(true);
  }

  function setTheme(mode: ThemeMode) {
    setThemeMode(mode);
    document.documentElement.dataset.theme = mode;
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    scheduleMotiveBackup();
  }

  async function togglePublicProfileSetting() {
    const next = !publicProfileEnabled;
    setPublicProfileEnabledState(next);
    setPublicProfileEnabled(next);
    await syncCurrentPublicProfile();
    scheduleMotiveBackup(250);
  }

  function triggerCompletionBurst(taskId: string) {
    const id = createId();
    setCompletionBursts((current) => [...current, { taskId, id }]);
    window.setTimeout(() => {
      setCompletionBursts((current) => current.filter((burst) => burst.id !== id));
    }, 720);
  }

  function startCheckCooldown(id: string) {
    checkCooldownRef.current.add(id);
    setCheckCooldownIds((current) => (current.includes(id) ? current : [...current, id]));
    window.setTimeout(() => {
      checkCooldownRef.current.delete(id);
      setCheckCooldownIds((current) => current.filter((item) => item !== id));
    }, 1000);
  }

  function showTagMessage(taskId: string, label?: string) {
    if (!label) {
      return;
    }

    setTagMessage({ taskId, label });
    window.setTimeout(() => {
      setTagMessage((current) => (current?.taskId === taskId ? null : current));
    }, 1600);
  }

  function showStreakMessage(taskId: string) {
    setStreakMessageTaskId(taskId);
    window.setTimeout(() => {
      setStreakMessageTaskId((current) => (current === taskId ? null : current));
    }, 1600);
  }

  function unlockAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (adminPassword === "Admin!Pass1") {
      setAdminUnlocked(true);
      setAdminPromptOpen(false);
      setAdminPassword("");
      setAdminMessage(null);
      window.localStorage.setItem(AVATAR_ADMIN_UNLOCK_KEY, "true");
      window.dispatchEvent(new CustomEvent("sopro-admin-unlocked-change"));
      scheduleMotiveBackup();
      return;
    }

    setAdminMessage("Wrong password.");
  }

  function lockAdmin() {
    setAdminUnlocked(false);
    setAdminPromptOpen(false);
    setAdminPassword("");
    setAdminMessage("Admin controls off.");
    window.localStorage.removeItem(AVATAR_ADMIN_UNLOCK_KEY);
    window.dispatchEvent(new Event("sopro-admin-unlocked-change"));
    scheduleMotiveBackup(250);
  }

  function addAdminXp(amount: number) {
    setDailyState((current) => ({
      ...current,
      totalXp: Math.max(0, current.totalXp + amount)
    }));
  }

  async function logout() {
    setLogoutLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setLogoutLoading(false);
    router.refresh();
    router.push("/login");
  }

  function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = newTaskTitle.trim();
    if (!title) {
      return;
    }

    if (activeCycleTab) {
      if (!canAddCycleTask) {
        return;
      }

      if (activeCycleTab === "yearly") {
        setCyclePendingTitle(title);
        return;
      }

      addCycleTask(activeCycleTab, title);
      return;
    }

    if (!canAddTask) {
      return;
    }

    setDailyState((current) => ({
      ...current,
      tasks: [...current.tasks, { id: createId(), title, icon: inferTaskIcon(title) }]
    }));
    setNewTaskTitle("");
    setShowAddForm(false);
  }

  function addCycleTask(tab: CycleTab, title: string) {
    setCycleState((current) => ({
      ...current,
      [tab]: [...current[tab], { id: createId(), title, icon: inferTaskIcon(title), createdDate: todayKey() }]
    }));
    setNewTaskTitle("");
    setShowAddForm(false);
    setCyclePendingTitle(null);
  }

  function toggleCycleTask(tab: CycleTab, taskId: string) {
    const cooldownId = `cycle:${tab}:${taskId}`;
    if (checkCooldownRef.current.has(cooldownId)) {
      return;
    }

    startCheckCooldown(cooldownId);

    setCycleState((current) => {
      const completed = current.completedTaskIds[tab].includes(taskId);

      return {
        ...current,
        completedTaskIds: {
          ...current.completedTaskIds,
          [tab]: completed
            ? current.completedTaskIds[tab].filter((id) => id !== taskId)
            : [...current.completedTaskIds[tab], taskId]
        }
      };
    });
  }

  function toggleTask(taskId: string) {
    const cooldownId = `daily:${taskId}`;
    if (checkCooldownRef.current.has(cooldownId)) {
      return;
    }

    startCheckCooldown(cooldownId);

    setDailyState((current) => {
      const task = current.tasks.find((item) => item.id === taskId);
      const subtaskIds = task?.subtasks?.map((subtask) => subtask.id) ?? [];
      const completed = current.completedTaskIds.includes(taskId);
      const currentDates = current.completionDatesByTask[taskId] ?? [];
      const nextDates = completed
        ? currentDates.filter((date) => date !== todayKey())
        : Array.from(new Set([...currentDates, todayKey()]));

      return {
        ...current,
        completedTaskIds: completed
          ? current.completedTaskIds.filter((id) => id !== taskId)
          : [...current.completedTaskIds, taskId],
        completedSubtaskIdsByTask: {
          ...current.completedSubtaskIdsByTask,
          [taskId]: completed ? [] : subtaskIds
        },
        completionDatesByTask: {
          ...current.completionDatesByTask,
          [taskId]: nextDates
        },
        totalXp: Math.max(0, current.totalXp + (completed ? -10 : 10))
      };
    });
  }

  function setTaskCompleted(current: DailyState, taskId: string, completed: boolean): DailyState {
    const alreadyCompleted = current.completedTaskIds.includes(taskId);

    if (alreadyCompleted === completed) {
      return current;
    }

    const currentDates = current.completionDatesByTask[taskId] ?? [];
    const nextDates = completed
      ? Array.from(new Set([...currentDates, todayKey()]))
      : currentDates.filter((date) => date !== todayKey());

    return {
      ...current,
      completedTaskIds: completed
        ? [...current.completedTaskIds, taskId]
        : current.completedTaskIds.filter((id) => id !== taskId),
      completionDatesByTask: {
        ...current.completionDatesByTask,
        [taskId]: nextDates
      },
      totalXp: Math.max(0, current.totalXp + (completed ? 10 : -10))
    };
  }

  function toggleSubtask(taskId: string, subtaskId: string) {
    const cooldownId = `subtask:${taskId}:${subtaskId}`;
    if (checkCooldownRef.current.has(cooldownId)) {
      return;
    }

    startCheckCooldown(cooldownId);

    setDailyState((current) => {
      const task = current.tasks.find((item) => item.id === taskId);
      const subtaskIds = task?.subtasks?.map((subtask) => subtask.id) ?? [];
      const currentCompleted = current.completedSubtaskIdsByTask[taskId] ?? [];
      const subtaskCompleted = currentCompleted.includes(subtaskId);
      const nextCompleted = subtaskCompleted
        ? currentCompleted.filter((id) => id !== subtaskId)
        : [...currentCompleted, subtaskId];
      const allSubtasksCompleted = subtaskIds.length > 0 && subtaskIds.every((id) => nextCompleted.includes(id));
      const nextState = {
        ...current,
        completedSubtaskIdsByTask: {
          ...current.completedSubtaskIdsByTask,
          [taskId]: nextCompleted
        }
      };

      return setTaskCompleted(nextState, taskId, allSubtasksCompleted);
    });
  }

  function addSubtask(event: React.FormEvent<HTMLFormElement>, taskId: string) {
    event.preventDefault();

    const title = (subtaskTitleByTask[taskId] ?? "").trim();
    if (!title) {
      return;
    }

    const newSubtaskId = createId();

    setDailyState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => {
        if (task.id !== taskId || (task.subtasks?.length ?? 0) >= SUBTASK_LIMIT) {
          return task;
        }

        return {
          ...task,
          subtasks: [...(task.subtasks ?? []), { id: newSubtaskId, title }]
        };
      }),
      completedSubtaskIdsByTask: current.completedTaskIds.includes(taskId)
        ? {
            ...current.completedSubtaskIdsByTask,
            [taskId]: [...(current.completedSubtaskIdsByTask[taskId] ?? []), newSubtaskId]
          }
        : current.completedSubtaskIdsByTask
    }));
    setSubtaskTitleByTask((current) => ({ ...current, [taskId]: "" }));
    setAddingSubtaskForTaskId(null);
  }

  function startEditing(task: DailyTask) {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditSubtaskTitles(
      Object.fromEntries((task.subtasks ?? []).map((subtask) => [subtask.id, subtask.title]))
    );
  }

  function saveTaskTitle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = editTitle.trim();
    if (!editingTaskId || !title) {
      return;
    }

    setDailyState((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === editingTaskId
          ? {
              ...task,
              title,
              icon: inferTaskIcon(title),
              subtasks: (task.subtasks ?? []).map((subtask) => ({
                ...subtask,
                title: (editSubtaskTitles[subtask.id] ?? subtask.title).trim() || subtask.title
              }))
            }
          : task
      )
    }));
    setEditingTaskId(null);
    setEditTitle("");
    setEditSubtaskTitles({});
  }

  function deleteSubtask(taskId: string, subtaskId: string) {
    setDailyState((current) => {
      const task = current.tasks.find((item) => item.id === taskId);
      const remainingSubtasks = (task?.subtasks ?? []).filter((subtask) => subtask.id !== subtaskId);
      const remainingSubtaskIds = remainingSubtasks.map((subtask) => subtask.id);
      const nextCompletedSubtaskIds = (current.completedSubtaskIdsByTask[taskId] ?? []).filter((id) => id !== subtaskId);
      const nextState = {
        ...current,
        tasks: current.tasks.map((item) =>
          item.id === taskId ? { ...item, subtasks: remainingSubtasks } : item
        ),
        completedSubtaskIdsByTask: {
          ...current.completedSubtaskIdsByTask,
          [taskId]: nextCompletedSubtaskIds
        }
      };

      return setTaskCompleted(
        nextState,
        taskId,
        remainingSubtaskIds.length > 0 && remainingSubtaskIds.every((id) => nextCompletedSubtaskIds.includes(id))
      );
    });

    setEditSubtaskTitles((current) =>
      Object.fromEntries(Object.entries(current).filter(([id]) => id !== subtaskId))
    );
  }

  function deleteTask(taskId: string) {
    setDailyState((current) => {
      const wasCompleted = current.completedTaskIds.includes(taskId);

      return {
        ...current,
        tasks: current.tasks.filter((task) => task.id !== taskId),
        completedTaskIds: current.completedTaskIds.filter((id) => id !== taskId),
        completedSubtaskIdsByTask: Object.fromEntries(
          Object.entries(current.completedSubtaskIdsByTask).filter(([id]) => id !== taskId)
        ),
        completionDatesByTask: Object.fromEntries(
          Object.entries(current.completionDatesByTask).filter(([id]) => id !== taskId)
        ),
        totalXp: Math.max(0, current.totalXp - (wasCompleted ? 10 : 0))
      };
    });

    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    }

    if (editingTaskId === taskId) {
      setEditingTaskId(null);
      setEditTitle("");
      setEditSubtaskTitles({});
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-5">
      <section className="level-summary-card rounded-3xl border border-primary/35 bg-gradient-to-br from-primary/35 via-purple-950 to-card p-5 shadow-2xl shadow-primary/20">
          <div className="flex items-center gap-4 max-[360px]:flex-col max-[360px]:items-start">
          <AvatarCharacter interactive size="lg" />
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-black">Level {level.level}</span>
              <span className="text-sm font-black text-secondary">{dailyState.totalXp.toLocaleString()} XP</span>
            </div>
            <div className={xpPulse ? "scale-[1.035] transition-transform duration-300 ease-out" : "scale-100 transition-transform duration-300 ease-out"}>
              <XpProgressBar currentXp={level.currentXp} nextLevelXp={level.nextLevelXp} progressPercent={level.progressPercent} />
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-1 flex-col gap-3">
        <div className="grid w-full grid-cols-4 gap-1 rounded-2xl bg-muted p-1">
            {taskTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={activeTab === tab.id ? "rounded-xl bg-primary px-2 py-2 text-sm font-black text-primary-foreground" : "rounded-xl px-2 py-2 text-xs font-black text-muted-foreground"}
              >
                {tab.label}
              </button>
            ))}
        </div>
        {activeTab !== "daily" ? (
          <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="mb-4 rounded-2xl border border-secondary/20 bg-secondary/10 px-4 py-3 text-sm font-black text-secondary">
              Still in development. Tasks can be created, but they cannot earn XP yet.
            </div>

            {activeTab === "yearly" ? (
              <div className="neon-card mb-4 rounded-3xl p-6 text-center text-sm font-semibold text-muted-foreground">
                <div className="text-3xl font-black text-foreground">{yearlyCountdown.days}d</div>
                <div className="mt-2 text-sm">{yearlyCountdown.hours}h {yearlyCountdown.minutes}m until {yearlyCountdown.targetYear}</div>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-accent transition-all duration-500 ease-out"
                    style={{ width: `${yearlyCountdown.progress}%` }}
                  />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-background/70 p-3">
                    <div className="text-xl font-black text-foreground">{yearlyStats.totalComplete}</div>
                    <div className="text-xs">Tasks complete</div>
                  </div>
                  <div className="rounded-2xl bg-background/70 p-3">
                    <div className="text-xl font-black text-foreground">{yearlyStats.highestStreak}</div>
                    <div className="text-xs">Highest streak</div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-4">
              {activeCycleTasks.length === 0 ? (
                <div className="neon-card flex min-h-44 items-center justify-center rounded-3xl p-7 text-center text-sm font-semibold text-muted-foreground">
                  No {activeTab} tasks yet.
                </div>
              ) : (
                activeCycleTasks.map((task) => {
                  const completed = cycleState.completedTaskIds[activeTab].includes(task.id);
                  const checkboxCoolingDown = checkCooldownSet.has(`cycle:${activeTab}:${task.id}`);

                  return (
                    <div key={task.id} className={completed ? "neon-card rounded-3xl border-accent/40 bg-accent/10 p-5" : "neon-card rounded-3xl p-5"}>
                      <div className="flex items-start gap-4">
                        <button
                          type="button"
                          disabled={checkboxCoolingDown}
                          onClick={() => toggleCycleTask(activeTab, task.id)}
                          className={completed ? "mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:opacity-70" : "mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground outline-none transition-opacity hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-muted-foreground/40 disabled:opacity-70"}
                          aria-label={completed ? `Uncheck ${activeTab} task` : `Check ${activeTab} task`}
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className={completed ? "break-words text-xl font-black text-accent" : "break-words text-xl font-black"}>
                            {task.title}
                          </div>
                          <div className="mt-2 text-xs font-bold text-muted-foreground">
                            Added {task.createdDate} - locked for this {activeTab === "weekly" ? "week" : activeTab === "monthly" ? "month" : "year"}
                          </div>
                        </div>
                        <div className="shrink-0 pt-1 text-xs font-bold text-muted-foreground">No XP yet</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="sticky bottom-24 mt-6 flex justify-end pr-1">
              <Button type="button" size="icon" onClick={openAddTaskForm} aria-label={`Add ${activeTab} task`} className={!canAddCycleTask ? "opacity-45" : undefined}>
                <Plus className="h-6 w-6" />
              </Button>
              {dailyLimitMessage ? (
                <div className="absolute bottom-14 right-0 rounded-2xl bg-card px-3 py-2 text-xs font-black text-secondary shadow-xl animate-in fade-in slide-in-from-bottom-1 duration-200">
                  {CYCLE_TASK_LIMIT}/{CYCLE_TASK_LIMIT} {activeTab[0].toUpperCase() + activeTab.slice(1)} tasks added
                </div>
              ) : null}
            </div>
          </div>
        ) : (
        <div key="daily" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex flex-1 flex-col gap-3">
          {dailyState.tasks.length === 0 ? (
            <div className="neon-card flex min-h-40 items-center justify-center rounded-3xl p-6 text-center text-sm font-semibold text-muted-foreground">
              No daily tasks yet.
            </div>
          ) : (
            dailyState.tasks.map((task) => {
              const completed = completedTaskIds.has(task.id);
              const expanded = expandedTaskId === task.id;
              const editing = editingTaskId === task.id;
              const streak = getTaskStreak(dailyState.completionDatesByTask[task.id]);
              const subtasks = task.subtasks ?? [];
              const completedSubtaskIds = new Set(dailyState.completedSubtaskIdsByTask[task.id] ?? []);
              const canAddSubtask = subtasks.length < SUBTASK_LIMIT;
              const taskIconOption = getTaskIcon(task.icon);
              const TaskIcon = taskIconOption?.icon;
              const tagLabel = getTaskTagLabel(task.icon);
              const taskBursts = completionBursts.filter((burst) => burst.taskId === task.id);
              const checkboxCoolingDown = checkCooldownSet.has(`daily:${task.id}`);

                return (
                <div key={task.id} className={completed ? `neon-card relative ${editing || expanded ? "z-30 overflow-visible" : "overflow-hidden"} rounded-3xl border-accent/40 bg-accent/10 p-4` : `neon-card relative ${editing || expanded ? "z-30 overflow-visible" : "overflow-hidden"} rounded-3xl p-4`}>
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        disabled={checkboxCoolingDown}
                        onClick={() => {
                          if (!checkCooldownRef.current.has(`daily:${task.id}`) && !completed) {
                            triggerCompletionBurst(task.id);
                          }
                          toggleTask(task.id);
                        }}
                        className={completed ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-none outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:opacity-70" : "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground outline-none transition-opacity hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-muted-foreground/40 disabled:opacity-70"}
                        aria-label={completed ? "Uncheck task" : "Check task"}
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      {taskBursts.map((burst) => (
                        <span key={burst.id} className="task-complete-burst" aria-hidden="true">
                          <span style={{ "--burst-x": "0px", "--burst-y": "-32px" } as React.CSSProperties} />
                          <span style={{ "--burst-x": "28px", "--burst-y": "-18px" } as React.CSSProperties} />
                          <span style={{ "--burst-x": "31px", "--burst-y": "14px" } as React.CSSProperties} />
                          <span style={{ "--burst-x": "0px", "--burst-y": "32px" } as React.CSSProperties} />
                          <span style={{ "--burst-x": "-29px", "--burst-y": "15px" } as React.CSSProperties} />
                          <span style={{ "--burst-x": "-26px", "--burst-y": "-19px" } as React.CSSProperties} />
                        </span>
                      ))}
                    </div>
                    {TaskIcon ? (
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={() => showTagMessage(task.id, tagLabel)}
                          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          aria-label={tagLabel ? `Show ${tagLabel} tag` : "Show task tag"}
                        >
                          <TaskIcon className="h-5 w-5" />
                        </button>
                        {tagMessage?.taskId === task.id ? (
                          <div className="absolute left-[calc(100%+0.45rem)] top-1/2 z-30 -translate-y-1/2 whitespace-nowrap rounded-2xl bg-card px-3 py-2 text-xs font-black text-secondary shadow-xl animate-in fade-in zoom-in-95 duration-200">
                            {tagMessage.label}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedTaskId(expanded ? null : task.id);
                        setEditingTaskId(null);
                        setEditSubtaskTitles({});
                      }}
                      className={completed ? `${task.title.length > 34 ? "text-base" : "text-lg"} min-w-0 flex-1 whitespace-normal break-words text-left font-black text-accent` : `${task.title.length > 34 ? "text-base" : "text-lg"} min-w-0 flex-1 whitespace-normal break-words text-left font-black`}
                    >
                      {task.title}
                    </button>
                    <div className="shrink-0 text-xs font-bold text-secondary">+10 XP</div>
                  </div>

                  <div className={expanded ? "grid grid-rows-[1fr] transition-all duration-300 ease-out" : "grid grid-rows-[0fr] transition-all duration-300 ease-out"}>
                    <div className={editing ? "overflow-visible" : "overflow-hidden"}>
                      <div className={expanded ? "mt-4 border-t border-white/10 pt-4 opacity-100 transition-opacity delay-100 duration-200" : "mt-0 border-t border-transparent pt-0 opacity-0 transition-opacity duration-150"}>
                      {editing ? (
                        <form onSubmit={saveTaskTitle} className="space-y-3">
                          <div className="flex gap-2">
                            <Input
                              value={editTitle}
                              onChange={(event) => setEditTitle(event.target.value)}
                              autoFocus
                              required
                              maxLength={80}
                              className="border-0 bg-background"
                            />
                            <Button type="submit" size="icon" aria-label="Save task names">
                              <Check className="h-5 w-5" />
                            </Button>
                          </div>
                          {subtasks.length > 0 ? (
                            <div className="space-y-2 pl-3">
                              {subtasks.map((subtask) => (
                                <div key={subtask.id} className="flex gap-2">
                                  <Input
                                    value={editSubtaskTitles[subtask.id] ?? subtask.title}
                                    onChange={(event) =>
                                      setEditSubtaskTitles((current) => ({
                                        ...current,
                                        [subtask.id]: event.target.value
                                      }))
                                    }
                                    required
                                    maxLength={60}
                                    className="h-10 border-0 bg-background text-sm"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => deleteSubtask(task.id, subtask.id)}
                                    aria-label="Delete sub-check"
                                    className="h-10 w-10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </form>
                      ) : (
                        <div className="space-y-3">
                          {subtasks.length > 0 ? (
                            <div className="space-y-2">
                              {subtasks.map((subtask) => {
                                const subtaskCompleted = completedSubtaskIds.has(subtask.id);
                                const subtaskCoolingDown = checkCooldownSet.has(`subtask:${task.id}:${subtask.id}`);
                                const subtaskWillCompleteTask =
                                  !completed &&
                                  !subtaskCompleted &&
                                  subtasks.every((item) => item.id === subtask.id || completedSubtaskIds.has(item.id));

                                return (
                                  <div key={subtask.id} className="flex items-center gap-2 pl-2">
                                    <button
                                      type="button"
                                      disabled={subtaskCoolingDown}
                                      onClick={() => {
                                        if (!checkCooldownRef.current.has(`subtask:${task.id}:${subtask.id}`) && subtaskWillCompleteTask) {
                                          triggerCompletionBurst(task.id);
                                        }
                                        toggleSubtask(task.id, subtask.id);
                                      }}
                                      className={subtaskCompleted ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:opacity-70" : "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-muted-foreground/40 disabled:opacity-70"}
                                      aria-label={subtaskCompleted ? "Uncheck subtask" : "Check subtask"}
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </button>
                                    <span className={subtaskCompleted ? "min-w-0 flex-1 break-words text-sm font-bold text-accent" : "min-w-0 flex-1 break-words text-sm font-bold text-muted-foreground"}>
                                      {subtask.title}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}

                          {addingSubtaskForTaskId === task.id ? (
                            <form onSubmit={(event) => addSubtask(event, task.id)} className="flex gap-2">
                              <Input
                                value={subtaskTitleByTask[task.id] ?? ""}
                                onChange={(event) => setSubtaskTitleByTask((current) => ({ ...current, [task.id]: event.target.value }))}
                                placeholder="Sub-check"
                                autoFocus
                                required
                                maxLength={60}
                                className="h-10 border-0 bg-background text-sm"
                              />
                              <Button type="submit" size="icon" aria-label="Save sub-check" className="h-10 w-10">
                                <Check className="h-4 w-4" />
                              </Button>
                            </form>
                          ) : null}

                          <div className="flex items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => showStreakMessage(task.id)}
                              className="relative inline-flex min-w-0 items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-2 text-xs font-black text-orange-300 outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                              aria-label="Show daily streak"
                            >
                              <Flame className="h-4 w-4 shrink-0 fill-orange-400 text-orange-400" />
                              <span>{streak}</span>
                              {streakMessageTaskId === task.id ? (
                                <span className="absolute left-[calc(100%+0.45rem)] top-1/2 z-30 -translate-y-1/2 whitespace-nowrap rounded-2xl bg-card px-3 py-2 text-xs font-black text-secondary shadow-xl animate-in fade-in zoom-in-95 duration-200">
                                  daily streak
                                </span>
                              ) : null}
                            </button>
                            <div className="flex shrink-0 gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                disabled={!canAddSubtask}
                                onClick={() => setAddingSubtaskForTaskId(task.id)}
                                aria-label="Add sub-check"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button type="button" variant="outline" size="icon" onClick={() => startEditing(task)} aria-label="Edit task">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button type="button" variant="outline" size="icon" onClick={() => setTaskPendingDelete(task)} aria-label="Delete task">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="sticky bottom-24 mt-6 flex justify-end pr-1">
          {!showAddForm ? (
            <Button type="button" size="icon" onClick={openAddTaskForm} aria-label="Add daily task" className={!canAddTask ? "opacity-45" : undefined}>
              <Plus className="h-6 w-6" />
            </Button>
          ) : null}
          {dailyLimitMessage ? (
            <div className="absolute bottom-14 right-0 rounded-2xl bg-card px-3 py-2 text-xs font-black text-secondary shadow-xl animate-in fade-in slide-in-from-bottom-1 duration-200">
              {DAILY_TASK_LIMIT}/{DAILY_TASK_LIMIT} Daily tasks added
            </div>
          ) : null}
        </div>

        </div>
        )}
      </section>

      {showAddForm ? (
        <div
          className="fixed inset-0 z-30 flex items-start justify-center bg-black/40 px-5 pb-5 pt-[calc(env(safe-area-inset-top,0px)+6rem)] backdrop-blur-sm animate-in fade-in duration-200 sm:items-center sm:pb-5 sm:pt-5"
          onClick={closeAddTaskForm}
        >
          <form
            onSubmit={addTask}
            className="neon-card w-full max-w-md rounded-3xl p-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 text-right text-xs font-bold text-muted-foreground">
              {activeAddCount}/{activeAddLimit} {activeCycleTab ? `${activeCycleLabel} tasks` : "Daily tasks"}
            </div>
            {activeAddWarning ? (
              <p className="mb-3 rounded-2xl bg-secondary/10 px-3 py-2 text-xs font-bold text-secondary">
                {activeAddWarning}
              </p>
            ) : null}
            <div className="flex gap-2">
              <Input
                value={newTaskTitle}
                onChange={(event) => setNewTaskTitle(event.target.value)}
                placeholder={activeCycleTab ? `${activeCycleLabel} task title` : "Task title"}
                required
                autoFocus
                maxLength={80}
                className="border-0 bg-background"
              />
              <Button type="submit" size="icon" aria-label={`Save ${activeCycleTab ?? "daily"} task`}>
                <Check className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {settingsOpen ? (
        <div
          className={settingsVisible ? "fixed inset-0 z-30 flex items-end justify-center bg-black/40 px-5 pb-5 backdrop-blur-sm transition-all duration-300 ease-out sm:items-center" : "fixed inset-0 z-30 flex items-end justify-center bg-black/0 px-5 pb-5 backdrop-blur-0 transition-all duration-200 ease-in sm:items-center"}
          onClick={closeSettingsPanel}
        >
          <div
            className={settingsVisible ? "neon-card w-full max-w-md translate-y-0 scale-100 rounded-3xl p-5 opacity-100 transition-all duration-300 ease-out" : "neon-card w-full max-w-md translate-y-8 scale-95 rounded-3xl p-5 opacity-0 transition-all duration-200 ease-in sm:translate-y-3"}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black">Settings</h2>
              <button type="button" onClick={closeSettingsPanel} className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground" aria-label="Close settings">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-muted p-3">
              <div>
                <div className="font-black">Theme</div>
                <div className="text-xs font-semibold text-muted-foreground">{themeMode === "dark" ? "Dark" : "Light"}</div>
              </div>
              <button
                type="button"
                onClick={() => setTheme(themeMode === "dark" ? "light" : "dark")}
                className="flex h-11 w-24 items-center rounded-full bg-background p-1 shadow-inner transition-colors duration-300 ease-out"
                aria-label="Toggle light and dark mode"
              >
                <span className={themeMode === "dark" ? "flex h-9 w-9 translate-x-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-300 ease-out" : "flex h-9 w-9 translate-x-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-all duration-300 ease-out"}>
                  {themeMode === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </span>
              </button>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-muted p-3">
              <div>
                <div className="font-black">Public account</div>
                <div className="text-xs font-semibold text-muted-foreground">{publicProfileEnabled ? "Visible in profile search" : "Private"}</div>
              </div>
              <button
                type="button"
                onClick={togglePublicProfileSetting}
                className="flex h-11 w-24 items-center rounded-full bg-background p-1 shadow-inner transition-colors duration-300 ease-out"
                aria-label="Toggle public account"
              >
                <span className={publicProfileEnabled ? "flex h-9 w-9 translate-x-12 items-center justify-center rounded-full bg-accent text-accent-foreground transition-all duration-300 ease-out" : "flex h-9 w-9 translate-x-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all duration-300 ease-out"} />
              </button>
            </div>
            <div className="rounded-2xl bg-muted p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-black">Admin</div>
                  <div className="text-xs font-semibold text-muted-foreground">Testing tools</div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setAdminPromptOpen((open) => !open)}>
                  Admin
                </Button>
              </div>

              {adminPromptOpen && !adminUnlocked ? (
                <form onSubmit={unlockAdmin} className="mt-3 space-y-2">
                  <Input
                    value={adminPassword}
                    onChange={(event) => setAdminPassword(event.target.value)}
                    type="password"
                    placeholder="Password"
                    autoFocus
                    className="border-0 bg-background"
                  />
                  {adminMessage ? <p className="text-xs font-semibold text-destructive">{adminMessage}</p> : null}
                  <Button type="submit" size="sm" className="w-full">
                    Unlock
                  </Button>
                </form>
              ) : null}

              {adminUnlocked ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => addAdminXp(100)}>
                    Add XP
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => addAdminXp(-100)}>
                    Take XP
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setAdminMessage("Achievements unlocked for testing.")}>
                    Unlock Achievements
                  </Button>
                  <Button type="button" variant="outline" size="sm" disabled>
                    Unlock All
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={lockAdmin} className="col-span-2">
                    Turn Off Admin
                  </Button>
                  {adminMessage ? <p className="col-span-2 text-xs font-semibold text-muted-foreground">{adminMessage}</p> : null}
                </div>
              ) : null}
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={logout} disabled={logoutLoading}>
              {logoutLoading ? "Logging out..." : "Log out"}
            </Button>
            </div>
          </div>
        </div>
      ) : null}

      {taskPendingDelete ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 px-5 pb-5 backdrop-blur-sm sm:items-center">
          <div className="neon-card w-full max-w-md rounded-3xl p-5">
            <div className="mb-4">
              <h2 className="text-xl font-black">Delete task?</h2>
              <p className="mt-2 break-words text-sm font-semibold text-muted-foreground">{taskPendingDelete.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" onClick={() => setTaskPendingDelete(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  deleteTask(taskPendingDelete.id);
                  setTaskPendingDelete(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {cyclePendingTitle && activeCycleTab === "yearly" ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 px-5 pb-5 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center">
          <div className="neon-card w-full max-w-md rounded-3xl p-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="mb-4">
              <h2 className="text-xl font-black">Add yearly task?</h2>
              <p className="mt-2 text-sm font-semibold text-muted-foreground">
                You can only add 3 yearly tasks per year. These reset every year and cannot be deleted once added. Are you sure you want to add this task?
              </p>
              <p className="mt-3 break-words rounded-2xl bg-muted px-3 py-2 text-sm font-black">{cyclePendingTitle}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" onClick={() => setCyclePendingTitle(null)}>
                No
              </Button>
              <Button type="button" onClick={() => addCycleTask("yearly", cyclePendingTitle)}>
                Yes
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

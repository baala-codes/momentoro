import type { MomentumData, Settings } from "./types";

export const STORAGE_KEY = "momentum.v1";

/** Minimal palette used for habit accents. */
export const PALETTE = [
  "#10b981", // emerald
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#84cc16", // lime
];

export const DEFAULT_SETTINGS: Settings = {
  focus: 25,
  short: 5,
  long: 15,
  longEvery: 4,
  autoStartBreaks: true,
  autoStartFocus: false,
  sound: true,
};

export function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

/** Local-date key, e.g. 2026-09-27 (avoids UTC off-by-one issues). */
export function dateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000);
}

export function formatDay(key: string): string {
  return parseKey(key).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function defaultData(): MomentumData {
  const now = dateKey();
  return {
    habits: [
      { id: uid(), name: "Deep work", color: PALETTE[0], createdAt: now },
      { id: uid(), name: "Read 20 pages", color: PALETTE[1], createdAt: now },
      { id: uid(), name: "Move your body", color: PALETTE[2], createdAt: now },
    ],
    completions: {},
    sessions: [],
    settings: DEFAULT_SETTINGS,
    theme: "system",
  };
}

/** Read persisted data, tolerating partial/legacy payloads. Returns null if none. */
export function loadData(): MomentumData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MomentumData>;
    return {
      habits: Array.isArray(parsed.habits) ? parsed.habits : [],
      completions: parsed.completions && typeof parsed.completions === "object" ? parsed.completions : {},
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      theme: parsed.theme === "light" || parsed.theme === "dark" ? parsed.theme : "system",
    };
  } catch {
    return null;
  }
}

export function saveData(data: MomentumData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable — fail silently, the app still works in-memory.
  }
}

/** Current run of consecutive days ending today (or yesterday if today isn't done). */
export function currentStreak(dates: string[], today: Date = new Date()): number {
  const set = new Set(dates);
  let cursor = startOfDay(today);
  if (!set.has(dateKey(cursor))) cursor = addDays(cursor, -1);
  let streak = 0;
  while (set.has(dateKey(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Longest run of consecutive days in the whole history. */
export function bestStreak(dates: string[]): number {
  const days = [...new Set(dates)].map(parseKey).sort((a, b) => a.getTime() - b.getTime());
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const day of days) {
    run = prev && daysBetween(prev, day) === 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = day;
  }
  return best;
}

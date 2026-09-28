export type ThemePreference = "light" | "dark" | "system";

export type Habit = {
  id: string;
  name: string;
  color: string;
  createdAt: string; // date key (YYYY-MM-DD)
};

export type FocusSession = {
  id: string;
  habitId: string | null;
  date: string; // date key
  minutes: number;
  completedAt: number; // epoch ms
};

export type Settings = {
  focus: number;
  short: number;
  long: number;
  longEvery: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  sound: boolean;
};

export type MomentumData = {
  habits: Habit[];
  /** habitId -> list of date keys the habit was completed on */
  completions: Record<string, string[]>;
  sessions: FocusSession[];
  settings: Settings;
  theme: ThemePreference;
};

export type PomodoroMode = "focus" | "short" | "long";

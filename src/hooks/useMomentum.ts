"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { getServerSnapshot, getSnapshot, mutate, subscribe } from "@/lib/store";
import { DEFAULT_SETTINGS, dateKey, defaultData, uid } from "@/lib/storage";
import type { FocusSession, Settings, ThemePreference } from "@/lib/types";

export function useMomentum() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Reflect the chosen theme on <html>, following the OS while in "system" mode.
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = data.theme === "dark" || (data.theme === "system" && media.matches);
      root.classList.toggle("dark", dark);
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [data.theme]);

  const addHabit = useCallback((name: string, color: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    mutate((prev) => ({
      ...prev,
      habits: [...prev.habits, { id: uid(), name: trimmed, color, createdAt: dateKey() }],
    }));
  }, []);

  const deleteHabit = useCallback((id: string) => {
    mutate((prev) => {
      const completions = { ...prev.completions };
      delete completions[id];
      return { ...prev, habits: prev.habits.filter((h) => h.id !== id), completions };
    });
  }, []);

  const toggleCompletion = useCallback((habitId: string, key: string) => {
    mutate((prev) => {
      const set = new Set(prev.completions[habitId] ?? []);
      if (set.has(key)) set.delete(key);
      else set.add(key);
      return { ...prev, completions: { ...prev.completions, [habitId]: [...set].sort() } };
    });
  }, []);

  const logSession = useCallback((minutes: number, habitId: string | null) => {
    mutate((prev) => ({
      ...prev,
      sessions: [
        ...prev.sessions,
        { id: uid(), habitId, date: dateKey(), minutes, completedAt: Date.now() } satisfies FocusSession,
      ],
    }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    mutate((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const setTheme = useCallback((theme: ThemePreference) => {
    mutate((prev) => ({ ...prev, theme }));
  }, []);

  const resetAll = useCallback(() => {
    mutate(() => ({ ...defaultData(), settings: { ...DEFAULT_SETTINGS } }));
  }, []);

  const today = dateKey();
  const sessionsToday = useMemo(
    () => data.sessions.filter((s) => s.date === today),
    [data.sessions, today],
  );

  return {
    data,
    today,
    sessionsToday,
    addHabit,
    deleteHabit,
    toggleCompletion,
    logSession,
    updateSettings,
    setTheme,
    resetAll,
  };
}

export type MomentumStore = ReturnType<typeof useMomentum>;

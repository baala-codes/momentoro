"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PomodoroMode, Settings } from "@/lib/types";

type PomodoroProps = {
  settings: Settings;
  activeHabit: { id: string; name: string; color: string } | null;
  todayCount: number;
  todayMinutes: number;
  onComplete: (minutes: number, habitId: string | null) => void;
  onUpdateSettings: (patch: Partial<Settings>) => void;
};

const MODES: PomodoroMode[] = ["focus", "short", "long"];

const MODE_LABEL: Record<PomodoroMode, string> = {
  focus: "Focus",
  short: "Short break",
  long: "Long break",
};

function durationFor(mode: PomodoroMode, settings: Settings): number {
  if (mode === "focus") return settings.focus * 60;
  if (mode === "short") return settings.short * 60;
  return settings.long * 60;
}

function beep(): void {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.62);
    osc.onended = () => ctx.close();
  } catch {
    // Audio is best-effort only.
  }
}

export default function Pomodoro({
  settings,
  activeHabit,
  todayCount,
  todayMinutes,
  onComplete,
  onUpdateSettings,
}: PomodoroProps) {
  const [mode, setMode] = useState<PomodoroMode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(() => durationFor("focus", settings));
  const [running, setRunning] = useState(false);
  const [cycle, setCycle] = useState(0);

  // Absolute time the current run ends at; null while paused.
  const endAtRef = useRef<number | null>(null);
  // Keeps the latest completion handler available to the ticker without render-time ref writes.
  const advanceRef = useRef<(completed: boolean) => void>(() => {});

  const total = durationFor(mode, settings);
  const progress = total > 0 ? 1 - secondsLeft / total : 0;

  const advance = useCallback(
    (finishedMode: PomodoroMode, completed = true) => {
      const counts = finishedMode === "focus" && completed;
      const nextCycle = counts ? cycle + 1 : cycle;
      if (counts) setCycle(nextCycle);

      if (counts) {
        onComplete(settings.focus, activeHabit?.id ?? null);
        if (settings.sound) beep();
      }

      const nextMode: PomodoroMode =
        finishedMode === "focus"
          ? completed && nextCycle % settings.longEvery === 0
            ? "long"
            : "short"
          : "focus";
      setMode(nextMode);
      setSecondsLeft(durationFor(nextMode, settings));

      const autoRun = nextMode === "focus" ? settings.autoStartFocus : settings.autoStartBreaks;
      endAtRef.current = autoRun ? Date.now() + durationFor(nextMode, settings) * 1000 : null;
      setRunning(autoRun);
    },
    [activeHabit, cycle, onComplete, settings],
  );

  useEffect(() => {
    advanceRef.current = (completed) => advance(mode, completed);
  }, [advance, mode]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const endAt = endAtRef.current;
      if (endAt == null) return;
      const left = endAt - Date.now();
      if (left <= 0) {
        window.clearInterval(id);
        endAtRef.current = null;
        setSecondsLeft(0);
        advanceRef.current(true);
      } else {
        setSecondsLeft(Math.ceil(left / 1000));
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [running]);

  const stop = useCallback(() => {
    endAtRef.current = null;
    setRunning(false);
  }, []);

  const startPause = useCallback(() => {
    if (running) {
      stop();
      return;
    }
    const base = secondsLeft > 0 ? secondsLeft : durationFor(mode, settings);
    setSecondsLeft(base);
    endAtRef.current = Date.now() + base * 1000;
    setRunning(true);
  }, [mode, running, secondsLeft, settings, stop]);

  const reset = () => {
    stop();
    setSecondsLeft(durationFor(mode, settings));
  };

  const changeMode = (next: PomodoroMode) => {
    stop();
    setMode(next);
    setSecondsLeft(durationFor(next, settings));
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const time = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const idle = secondsLeft === total;

  const R = 86;
  const C = 2 * Math.PI * R;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1 rounded-full bg-surface-2 p-1 text-xs">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => changeMode(m)}
            className={`flex-1 rounded-full px-3 py-1.5 transition-colors ${
              mode === m ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-[220px]">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
          <circle cx="100" cy="100" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke={activeHabit?.color ?? "var(--accent)"}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
            style={{ transition: "stroke-dashoffset 0.4s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-4xl tabular-nums tracking-tight">{time}</span>
          <span className="mt-1 text-[11px] uppercase tracking-widest text-muted">
            {MODE_LABEL[mode]}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={startPause}
          className="min-w-[104px] rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          {running ? "Pause" : idle ? "Start" : "Resume"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-border px-4 py-2.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => advanceRef.current(false)}
          className="rounded-full border border-border px-4 py-2.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          Skip
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-4 py-3 text-xs">
        <div className="flex min-w-0 items-center gap-2">
          {activeHabit ? (
            <>
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: activeHabit.color }}
              />
              <span className="truncate text-muted">
                Focusing on <span className="text-foreground">{activeHabit.name}</span>
              </span>
            </>
          ) : (
            <span className="text-muted">No habit selected</span>
          )}
        </div>
        <span className="shrink-0 text-muted tabular-nums">
          {todayCount} · {todayMinutes}m today
        </span>
      </div>

      <details className="group rounded-xl border border-border">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs text-muted transition-colors hover:text-foreground">
          <span className="uppercase tracking-widest">Timer settings</span>
          <span className="transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <div className="grid grid-cols-2 gap-3 border-t border-border p-4 text-xs">
          {(
            [
              ["focus", "Focus", 1],
              ["short", "Short break", 1],
              ["long", "Long break", 1],
              ["longEvery", "Long every", 2],
            ] as const
          ).map(([key, label, min]) => (
            <label key={key} className="flex flex-col gap-1 text-muted">
              <span className="uppercase tracking-wider">{label}</span>
              <input
                type="number"
                min={min}
                max={key === "longEvery" ? 12 : 180}
                value={settings[key]}
                onChange={(e) => {
                  const v = Math.max(min, Math.min(key === "longEvery" ? 12 : 180, Number(e.target.value) || min));
                  const patch: Partial<Settings> =
                    key === "focus"
                      ? { focus: v }
                      : key === "short"
                        ? { short: v }
                        : key === "long"
                          ? { long: v }
                          : { longEvery: v };
                  onUpdateSettings(patch);
                  if (key !== "longEvery" && mode === key) {
                    stop();
                    setSecondsLeft(v * 60);
                  }
                }}
                className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-foreground outline-none focus:border-accent"
              />
            </label>
          ))}

          <label className="col-span-2 flex items-center gap-2 text-muted">
            <input
              type="checkbox"
              checked={settings.autoStartBreaks}
              onChange={(e) => onUpdateSettings({ autoStartBreaks: e.target.checked })}
              className="accent-[var(--accent)]"
            />
            Auto-start breaks
          </label>
          <label className="col-span-2 flex items-center gap-2 text-muted">
            <input
              type="checkbox"
              checked={settings.autoStartFocus}
              onChange={(e) => onUpdateSettings({ autoStartFocus: e.target.checked })}
              className="accent-[var(--accent)]"
            />
            Auto-start next focus
          </label>
          <label className="col-span-2 flex items-center gap-2 text-muted">
            <input
              type="checkbox"
              checked={settings.sound}
              onChange={(e) => onUpdateSettings({ sound: e.target.checked })}
              className="accent-[var(--accent)]"
            />
            Play sound when a session ends
          </label>
        </div>
      </details>
    </div>
  );
}

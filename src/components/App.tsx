"use client";

import { useMemo, useState } from "react";
import Heatmap from "./Heatmap";
import HabitList from "./HabitList";
import Pomodoro from "./Pomodoro";
import { useMomentum } from "@/hooks/useMomentum";
import { bestStreak, currentStreak } from "@/lib/storage";
import type { ThemePreference } from "@/lib/types";

const THEME_ORDER: ThemePreference[] = ["system", "light", "dark"];
const THEME_ICON: Record<ThemePreference, string> = {
  system: "◐",
  light: "☀",
  dark: "☾",
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <div className="text-[10px] uppercase tracking-widest text-muted">{label}</div>
      <div className="mt-1 font-mono text-lg tabular-nums">{value}</div>
    </div>
  );
}

export default function App() {
  const store = useMomentum();
  const { data, today, sessionsToday } = store;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = data.habits.find((h) => h.id === selectedId) ?? data.habits[0] ?? null;

  const stats = useMemo(() => {
    const doneToday = data.habits.filter((h) =>
      (data.completions[h.id] ?? []).includes(today),
    ).length;
    let liveStreak = 0;
    let longest = 0;
    for (const habit of data.habits) {
      const dates = data.completions[habit.id] ?? [];
      liveStreak = Math.max(liveStreak, currentStreak(dates));
      longest = Math.max(longest, bestStreak(dates));
    }
    const focusMinutes = sessionsToday.reduce((sum, s) => sum + s.minutes, 0);
    return { doneToday, longest, focusMinutes, liveStreak };
  }, [data.habits, data.completions, sessionsToday, today]);

  const completed = useMemo(
    () => new Set(selected ? (data.completions[selected.id] ?? []) : []),
    [data.completions, selected],
  );

  const cycleTheme = () => {
    const index = THEME_ORDER.indexOf(data.theme);
    store.setTheme(THEME_ORDER[(index + 1) % THEME_ORDER.length]);
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-10 sm:px-8 sm:py-14">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Momentum</h1>
          <p className="mt-1 text-sm text-muted">
            Build the habit. Protect the streak. Focus the session.
          </p>
        </div>
        <button
          type="button"
          onClick={cycleTheme}
          title={`Theme: ${data.theme}`}
          aria-label={`Theme: ${data.theme}. Click to change.`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:text-foreground"
        >
          {THEME_ICON[data.theme]}
        </button>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Done today" value={`${stats.doneToday}/${data.habits.length}`} />
        <Stat label="Live streak" value={`${stats.liveStreak}d`} />
        <Stat label="Best streak" value={`${stats.longest}d`} />
        <Stat label="Focus today" value={`${stats.focusMinutes}m`} />
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className="rounded-2xl border border-border bg-surface p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium">Consistency</h2>
                <p className="text-xs text-muted">
                  {selected ? (
                    <>
                      <span
                        className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
                        style={{ background: selected.color }}
                      />
                      {selected.name} · {completed.size} days · click a cell to edit
                    </>
                  ) : (
                    "Add a habit to start tracking"
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {data.habits.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setSelectedId(h.id)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                      selected?.id === h.id
                        ? "border-foreground/30 bg-surface-2 text-foreground"
                        : "border-border text-muted hover:text-foreground"
                    }`}
                  >
                    {h.name}
                  </button>
                ))}
              </div>
            </div>

            {selected ? (
              <Heatmap
                color={selected.color}
                completed={completed}
                onToggle={(key) => store.toggleCompletion(selected.id, key)}
              />
            ) : (
              <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted">
                Your 6-month heatmap will appear here.
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-sm font-medium">Habits</h2>
            <HabitList
              habits={data.habits}
              completions={data.completions}
              today={today}
              selectedId={selected?.id ?? null}
              onSelect={setSelectedId}
              onToggleToday={(id) => store.toggleCompletion(id, today)}
              onAdd={store.addHabit}
              onDelete={(id) => {
                store.deleteHabit(id);
                if (selectedId === id) setSelectedId(null);
              }}
            />
          </section>
        </div>

        <section className="rounded-2xl border border-border bg-surface p-5 lg:sticky lg:top-6 lg:self-start">
          <h2 className="mb-4 text-sm font-medium">Pomodoro</h2>
          <Pomodoro
            settings={data.settings}
            activeHabit={selected}
            todayCount={sessionsToday.length}
            todayMinutes={stats.focusMinutes}
            onComplete={store.logSession}
            onUpdateSettings={store.updateSettings}
          />
        </section>
      </div>

      <footer className="flex items-center justify-between pt-2 text-[11px] text-muted">
        <span>Stored locally in your browser.</span>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Reset all habits, streaks and sessions?")) store.resetAll();
          }}
          className="transition-colors hover:text-foreground"
        >
          Reset data
        </button>
      </footer>
    </main>
  );
}

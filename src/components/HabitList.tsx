"use client";

import { useState } from "react";
import { MiniHeatmap } from "./Heatmap";
import { PALETTE, currentStreak } from "@/lib/storage";
import type { Habit } from "@/lib/types";

type HabitListProps = {
  habits: Habit[];
  completions: Record<string, string[]>;
  today: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleToday: (id: string) => void;
  onAdd: (name: string, color: string) => void;
  onDelete: (id: string) => void;
};

export default function HabitList({
  habits,
  completions,
  today,
  selectedId,
  onSelect,
  onToggleToday,
  onAdd,
  onDelete,
}: HabitListProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name, color);
    setName("");
    setColor(PALETTE[(PALETTE.indexOf(color) + 1) % PALETTE.length]);
  };

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {habits.map((habit) => {
          const dates = completions[habit.id] ?? [];
          const done = dates.includes(today);
          const streak = currentStreak(dates);
          const active = habit.id === selectedId;

          return (
            <li key={habit.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelect(habit.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(habit.id);
                  }
                }}
                className={`group flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                  active ? "border-foreground/30 bg-surface-2" : "border-border hover:bg-surface-2"
                }`}
              >
                <button
                  type="button"
                  aria-label={done ? `Mark ${habit.name} as not done` : `Mark ${habit.name} as done`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleToday(habit.id);
                  }}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all"
                  style={{
                    borderColor: done ? habit.color : "var(--border)",
                    background: done ? habit.color : "transparent",
                  }}
                >
                  {done && (
                    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="#08080a" strokeWidth="2">
                      <path d="M2.5 6.2 4.8 8.5 9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm">{habit.name}</span>
                    {streak > 0 && (
                      <span className="shrink-0 text-[10px] text-muted tabular-nums">
                        {streak}d streak
                      </span>
                    )}
                  </div>
                  <div className="mt-1 hidden sm:block">
                    <MiniHeatmap color={habit.color} completed={new Set(dates)} />
                  </div>
                </div>

                <span className="shrink-0 text-[11px] text-muted tabular-nums">{dates.length}</span>

                <button
                  type="button"
                  aria-label={`Delete ${habit.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(habit.id);
                  }}
                  className="shrink-0 rounded-md px-1.5 py-0.5 text-muted opacity-0 transition-opacity hover:text-foreground focus:opacity-100 group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            </li>
          );
        })}
        {habits.length === 0 && (
          <li className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted">
            No habits yet — add your first one below.
          </li>
        )}
      </ul>

      <form onSubmit={submit} className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Use color ${c}`}
              onClick={() => setColor(c)}
              className={`h-3.5 w-3.5 rounded-full transition-transform ${
                color === c ? "scale-125 ring-2 ring-foreground/25" : "opacity-70 hover:opacity-100"
              }`}
              style={{ background: c }}
            />
          ))}
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New habit…"
          maxLength={48}
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="shrink-0 rounded-lg bg-foreground px-3.5 py-2 text-sm font-medium text-background transition-opacity disabled:opacity-30"
        >
          Add
        </button>
      </form>
    </div>
  );
}

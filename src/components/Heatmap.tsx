"use client";

import { useMemo } from "react";
import { addDays, dateKey, formatDay, startOfDay } from "@/lib/storage";

type HeatmapProps = {
  /** Accent color for completed days. */
  color: string;
  /** Date keys on which the tracked habit was completed. */
  completed: Set<string>;
  /** Number of weeks to render (defaults to ~6 months). */
  weeks?: number;
  /** Click a day to toggle it. Omit to render read-only. */
  onToggle?: (key: string) => void;
};

const CELL = 12;
const GAP = 3;
const DAY_LABELS = ["", "M", "", "W", "", "F", ""];

export default function Heatmap({ color, completed, weeks = 26, onToggle }: HeatmapProps) {
  const { columns, months, todayKey } = useMemo(() => {
    const today = startOfDay(new Date());
    const end = addDays(today, 6 - today.getDay()); // end of the current week (Sat)
    const start = addDays(end, -(weeks * 7 - 1));

    const days: Date[] = [];
    for (let i = 0; i < weeks * 7; i++) days.push(addDays(start, i));

    const cols: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) cols.push(days.slice(i, i + 7));

    let lastMonth = -1;
    const labels = cols.map((col) => {
      const m = col[0].getMonth();
      if (m !== lastMonth) {
        lastMonth = m;
        return col[0].toLocaleDateString(undefined, { month: "short" });
      }
      return "";
    });

    return { columns: cols, months: labels, todayKey: dateKey(today) };
  }, [weeks]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <div className="w-4 shrink-0" aria-hidden />
        <div className="flex" style={{ gap: GAP }}>
          {months.map((label, i) => (
            <div
              key={i}
              className="text-[10px] leading-3 text-muted whitespace-nowrap"
              style={{ width: CELL }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <div
          className="flex w-4 shrink-0 flex-col text-[10px] leading-3 text-muted"
          style={{ gap: GAP }}
          aria-hidden
        >
          {DAY_LABELS.map((label, i) => (
            <div key={i} style={{ height: CELL }}>
              {label}
            </div>
          ))}
        </div>

        <div className="flex" style={{ gap: GAP }}>
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col" style={{ gap: GAP }}>
              {col.map((day) => {
                const key = dateKey(day);
                const isFuture = key > todayKey;
                const done = completed.has(key);
                const interactive = Boolean(onToggle) && !isFuture;

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!interactive}
                    onClick={() => onToggle?.(key)}
                    title={`${formatDay(key)} — ${done ? "completed" : isFuture ? "upcoming" : "not completed"}`}
                    aria-label={`${formatDay(key)} ${done ? "completed" : "not completed"}`}
                    className={`rounded-[3px] border border-transparent transition-[transform,background-color] duration-100 ${
                      interactive ? "cursor-pointer hover:scale-110 hover:border-foreground/30" : "cursor-default"
                    } ${isFuture ? "opacity-40" : ""}`}
                    style={{
                      width: CELL,
                      height: CELL,
                      backgroundColor: done ? color : "var(--surface-2)",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 text-[10px] text-muted">
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((opacity) => (
          <span
            key={opacity}
            className="rounded-[3px]"
            style={{
              width: CELL,
              height: CELL,
              backgroundColor: opacity === 0 ? "var(--surface-2)" : color,
              opacity: opacity === 0 ? 1 : 0.25 + opacity * 0.75,
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

/** Small inline heatmap used inside habit rows (last N weeks, read-only). */
export function MiniHeatmap({ color, completed, weeks = 12 }: Omit<HeatmapProps, "onToggle">) {
  const { columns, todayKey } = useMemo(() => {
    const today = startOfDay(new Date());
    const end = addDays(today, 6 - today.getDay());
    const start = addDays(end, -(weeks * 7 - 1));
    const cols: Date[][] = [];
    for (let i = 0; i < weeks; i++) {
      cols.push(Array.from({ length: 7 }, (_, d) => addDays(start, i * 7 + d)));
    }
    return { columns: cols, todayKey: dateKey(today) };
  }, [weeks]);

  return (
    <div className="flex" style={{ gap: 2 }} aria-hidden>
      {columns.map((col, ci) => (
        <div key={ci} className="flex flex-col" style={{ gap: 2 }}>
          {col.map((day) => {
            const key = dateKey(day);
            const done = completed.has(key);
            const future = key > todayKey;
            return (
              <span
                key={key}
                className="rounded-full"
                style={{
                  width: 5,
                  height: 5,
                  backgroundColor: done ? color : "var(--surface-2)",
                  opacity: future ? 0.4 : 1,
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}


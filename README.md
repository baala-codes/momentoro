# Momentum

A minimal habit tracker with a GitHub-style consistency heatmap, paired with a pomodoro timer.
Everything is stored locally in the browser — no accounts, no backend.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- `localStorage` persistence via a small external store + `useSyncExternalStore`

## Features

- **Habits** — add, delete, pick an accent color, toggle today with one click.
  Each row shows a live streak and a mini heatmap of the last 12 weeks.
- **Heatmap widget** — a 6-month contribution grid per habit. Click any past day to
  backfill or clear it; upcoming days are dimmed and read-only.
- **Pomodoro** — focus / short break / long break modes with a circular progress ring,
  configurable durations, auto-start options, an end-of-session chime, and a long break
  every _N_ focus sessions. Completed focus sessions are logged against the selected habit.
- **Stats** — done today, live streak, best streak, and focus minutes today.
- **Theming** — light / dark / system, applied before first paint to avoid a flash.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Lint |

## Project layout

```
src/
├── app/                # App Router entry (layout, page, global styles)
├── components/
│   ├── App.tsx         # Dashboard composition
│   ├── Heatmap.tsx     # Contribution heatmap + mini variant
│   ├── HabitList.tsx   # Habit rows and add form
│   └── Pomodoro.tsx    # Timer with ring, modes and settings
├── hooks/
│   └── useMomentum.ts  # State + actions bound to the store
└── lib/
    ├── storage.ts      # Date helpers, streaks, palette, (de)serialization
    ├── store.ts        # localStorage-backed external store
    └── types.ts        # Data model
```

## Data

State is saved under the `momentum.v1` key in `localStorage`. Use **Reset data** in the
footer to clear it.

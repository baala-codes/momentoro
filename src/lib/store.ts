import { defaultData, loadData, saveData } from "./storage";
import type { MomentumData } from "./types";

/** Value used for server rendering and the pre-hydration client render. */
const serverSnapshot: MomentumData = defaultData();

let state: MomentumData = serverSnapshot;
let loaded = false;
const listeners = new Set<() => void>();

function ensureLoaded(): void {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  const saved = loadData();
  if (saved) state = saved;
}

export function getSnapshot(): MomentumData {
  ensureLoaded();
  return state;
}

export function getServerSnapshot(): MomentumData {
  return serverSnapshot;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Apply an update, persist it, and notify subscribers. */
export function mutate(updater: (prev: MomentumData) => MomentumData): void {
  state = updater(state);
  saveData(state);
  for (const listener of listeners) listener();
}

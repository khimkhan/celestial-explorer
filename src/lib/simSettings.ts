import { useSyncExternalStore } from "react";

/**
 * Global, lightweight simulation preferences shared by the background layers
 * and the per-object simulation controls. Kept outside React so canvas loops
 * can read it without forcing re-renders.
 */
export interface SimSettings {
  /** Animated starfield / cosmic particles */
  starfield: boolean;
  /** Constellation stick-figure layer */
  constellations: boolean;
  /** Labels inside the orbital simulation */
  labels: boolean;
  /** Orbital trail behind the planet */
  trail: boolean;
  /** Simulation playback */
  playing: boolean;
  /** Simulation speed multiplier */
  speed: number;
  /** Constellation abbreviation to emphasise in the background */
  highlight: string | null;
}

const DEFAULTS: SimSettings = {
  starfield: true,
  constellations: true,
  labels: true,
  trail: true,
  playing: true,
  speed: 1,
  highlight: null,
};

let state: SimSettings = { ...DEFAULTS };
const listeners = new Set<() => void>();

export function getSimSettings(): SimSettings {
  return state;
}

export function setSimSettings(patch: Partial<SimSettings>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSimSettings(): SimSettings {
  return useSyncExternalStore(subscribe, getSimSettings, getSimSettings);
}

/** True when the visitor asked the OS to reduce motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

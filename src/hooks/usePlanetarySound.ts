import { useCallback, useEffect, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// PLANETARY SOUND — global ambient frequency track (HTML5 <audio>)
// ─────────────────────────────────────────────────────────────────────────────
// Source: "852 Hz 741 Hz frequency by Mellow Mind Collective".
// Place the file at public/mellow-mind-852-741.mp3.
//
// A single module-level <audio> element is shared by every component, so the
// track keeps playing seamlessly across the homepage, planet detail pages and
// the constellation gallery — it never restarts on navigation.
//
// AUTOPLAY: browsers block unmuted autoplay, so we attach a global
// first-interaction listener (click / pointerdown / keydown / scroll) that
// calls .play() the moment the visitor first engages with the page.
// ─────────────────────────────────────────────────────────────────────────────

const AUDIO_SRC = '/mellow-mind-852-741.mp3';
const DEFAULT_VOLUME = 0.25;

export interface SoundParams {
  period: number; // kept for API compatibility — no longer affects the track
}

type Listener = () => void;

const listeners = new Set<Listener>();

const engine = {
  audio: null as HTMLAudioElement | null,
  playing: false,
  blocked: false,
  volume: DEFAULT_VOLUME,
  interactionBound: false,
};

function emit() {
  listeners.forEach((l) => l());
}

function ensureAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (engine.audio) return engine.audio;
  const audio = new Audio(AUDIO_SRC);
  audio.loop = true; // infinite looping
  audio.volume = engine.volume; // low, mellow default
  audio.preload = 'auto';
  engine.audio = audio;
  return audio;
}

async function tryPlay() {
  const audio = ensureAudio();
  if (!audio || engine.playing) return;
  try {
    await audio.play();
    engine.playing = true;
    engine.blocked = false;
  } catch {
    // Autoplay blocked — wait for the first user interaction.
    engine.playing = false;
    engine.blocked = true;
    bindInteractionHandlers();
  }
  emit();
}

function handleFirstInteraction() {
  if (engine.playing) return;
  tryPlay().then(() => {
    if (engine.playing) unbindInteractionHandlers();
  });
}

export function bindInteractionHandlers() {
  if (typeof window === 'undefined' || engine.interactionBound) return;
  engine.interactionBound = true;
  ['click', 'pointerdown', 'keydown', 'touchstart', 'scroll'].forEach((evt) =>
    window.addEventListener(evt, handleFirstInteraction, { passive: true })
  );
}

export function unbindInteractionHandlers() {
  if (typeof window === 'undefined' || !engine.interactionBound) return;
  engine.interactionBound = false;
  ['click', 'pointerdown', 'keydown', 'touchstart', 'scroll'].forEach((evt) =>
    window.removeEventListener(evt, handleFirstInteraction)
  );
}

export function startSound(_params?: SoundParams) {
  bindInteractionHandlers();
  void tryPlay();
}

export function stopSound() {
  const audio = engine.audio;
  if (!audio || !engine.playing) return;
  audio.pause();
  engine.playing = false;
  emit();
}

export function setSoundVolume(v: number) {
  engine.volume = Math.max(0, Math.min(1, v));
  if (engine.audio) engine.audio.volume = engine.volume;
  emit();
}

export function retuneSound(_params: SoundParams) {
  // No-op: the ambient frequency track is fixed.
}

export function usePlanetarySound() {
  const [, force] = useState(0);

  useEffect(() => {
    const listener = () => force((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const start = useCallback((params?: SoundParams) => startSound(params), []);
  const stop = useCallback(() => stopSound(), []);
  const retune = useCallback((params: SoundParams) => retuneSound(params), []);
  const setVolume = useCallback((v: number) => setSoundVolume(v), []);

  // Auto-start as soon as the site loads; falls back to the first global
  // user interaction (click / scroll / keydown) when autoplay is blocked.
  const autoStart = useCallback((params?: SoundParams) => {
    startSound(params);
  }, []);

  return {
    start,
    stop,
    retune,
    autoStart,
    setVolume,
    volume: engine.volume,
    blocked: engine.blocked,
    isPlaying: engine.playing,
  };
}

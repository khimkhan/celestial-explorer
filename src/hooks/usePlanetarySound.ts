import { useCallback, useEffect, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// PLANETARY SOUND — global ambient space drone (Web Audio API)
// ─────────────────────────────────────────────────────────────────────────────
// A single module-level engine is shared by every component, so the ambient
// sound keeps playing across pages instead of restarting per component.
//
// AUTOPLAY: we try to start immediately. If the browser blocks it, a global
// first-interaction handler (click / pointerdown / keydown) resumes it.
// ─────────────────────────────────────────────────────────────────────────────

export interface SoundParams {
  period: number; // orbital period in days — controls base frequency
}

type Listener = () => void;

const listeners = new Set<Listener>();

const engine = {
  ctx: null as AudioContext | null,
  master: null as GainNode | null,
  oscillators: [] as OscillatorNode[],
  lfo: null as OscillatorNode | null,
  playing: false,
  blocked: false,
  params: { period: 10 } as SoundParams,
  volume: 0.12,
  interactionBound: false,
};

function emit() {
  listeners.forEach((l) => l());
}

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (engine.ctx) return engine.ctx;
  try {
    const Ctor: typeof AudioContext =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    engine.ctx = new Ctor();
  } catch {
    engine.blocked = true;
    emit();
    return null;
  }
  return engine.ctx;
}

function buildGraph(ctx: AudioContext, params: SoundParams) {
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(engine.volume, ctx.currentTime + 1.5);
  master.connect(ctx.destination);
  engine.master = master;

  const baseFreq = 55 + (1 - Math.min(1, Math.log10(params.period + 1) / Math.log10(400))) * 55;
  const freqs = [baseFreq, baseFreq * 1.5, baseFreq * 2];
  const types: OscillatorType[] = ['sine', 'sine', 'triangle'];

  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = types[i];
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(i === 0 ? 0.6 : i === 1 ? 0.25 : 0.15, ctx.currentTime);
    osc.detune.setValueAtTime((i - 1) * 5, ctx.currentTime);
    osc.connect(gain);
    gain.connect(master);
    osc.start();
    engine.oscillators.push(osc);
  });

  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(0.15, ctx.currentTime);
  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(0.04, ctx.currentTime);
  lfo.connect(lfoGain);
  lfoGain.connect(master.gain);
  lfo.start();
  engine.lfo = lfo;
}

function teardown() {
  engine.oscillators.forEach((osc) => {
    try {
      osc.stop();
    } catch {
      /* already stopped */
    }
  });
  try {
    engine.lfo?.stop();
  } catch {
    /* already stopped */
  }
  engine.oscillators = [];
  engine.lfo = null;
  if (engine.master) {
    engine.master.disconnect();
    engine.master = null;
  }
}

export function startSound(params?: SoundParams) {
  if (params) engine.params = params;
  const ctx = ensureContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    engine.blocked = true;
    emit();
    bindInteractionHandlers();
    ctx
      .resume()
      .then(() => {
        engine.blocked = false;
        if (!engine.playing) {
          engine.playing = true;
          buildGraph(ctx, engine.params);
        }
        emit();
      })
      .catch(() => {
        engine.blocked = true;
        emit();
      });
    return;
  }

  if (engine.playing) return;
  engine.playing = true;
  engine.blocked = false;
  buildGraph(ctx, engine.params);
  emit();
}

export function stopSound() {
  if (!engine.playing || !engine.ctx) return;
  const ctx = engine.ctx;
  engine.playing = false;
  if (engine.master) {
    engine.master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
  }
  emit();
  setTimeout(teardown, 600);
}

export function setSoundVolume(v: number) {
  engine.volume = Math.max(0, Math.min(0.4, v));
  if (engine.master && engine.ctx) {
    engine.master.gain.linearRampToValueAtTime(engine.volume, engine.ctx.currentTime + 0.2);
  }
  emit();
}

export function retuneSound(params: SoundParams) {
  engine.params = params;
  if (!engine.playing || !engine.ctx) return;
  teardown();
  buildGraph(engine.ctx, params);
}

function handleFirstInteraction() {
  startSound();
}

export function bindInteractionHandlers() {
  if (typeof window === 'undefined' || engine.interactionBound) return;
  engine.interactionBound = true;
  ['click', 'pointerdown', 'keydown', 'touchstart'].forEach((evt) =>
    window.addEventListener(evt, handleFirstInteraction, { passive: true })
  );
}

export function unbindInteractionHandlers() {
  if (typeof window === 'undefined' || !engine.interactionBound) return;
  engine.interactionBound = false;
  ['click', 'pointerdown', 'keydown', 'touchstart'].forEach((evt) =>
    window.removeEventListener(evt, handleFirstInteraction)
  );
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

  // Auto-start as soon as the site is working; falls back to the first
  // global user interaction when the browser blocks autoplay.
  const autoStart = useCallback((params?: SoundParams) => {
    bindInteractionHandlers();
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
    isPlaying: engine.playing && !engine.blocked,
  };
}

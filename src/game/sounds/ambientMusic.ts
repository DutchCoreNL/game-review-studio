// Procedural ambient music engine using Web Audio API
// Generates looping atmospheric tracks per game screen

import { getCtx, getMaster, isMuted } from '../sounds';

type MusicScene = 'city' | 'trade' | 'ops' | 'empire' | 'profile' | 'combat' | 'none';

let currentScene: MusicScene = 'none';
let activeNodes: { stop: () => void }[] = [];
let musicGain: GainNode | null = null;
let loopInterval: ReturnType<typeof setInterval> | null = null;

function getMusicGain(): GainNode {
  if (!musicGain) {
    const ctx = getCtx();
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.08;
    musicGain.connect(getMaster());
  }
  return musicGain;
}

function stopAll() {
  activeNodes.forEach(n => { try { n.stop(); } catch {} });
  activeNodes = [];
  if (loopInterval) { clearInterval(loopInterval); loopInterval = null; }
}

// Drone pad — sustained low chord
function createDronePad(freq: number, detune = 0, vol = 0.04) {
  const ctx = getCtx();
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc1.type = 'sine';
  osc1.frequency.value = freq;
  osc2.type = 'triangle';
  osc2.frequency.value = freq * 1.002; // subtle detuning
  osc2.detune.value = detune;

  filter.type = 'lowpass';
  filter.frequency.value = 400;
  filter.Q.value = 1;

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 2);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(getMusicGain());

  osc1.start();
  osc2.start();

  return {
    stop: () => {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
      setTimeout(() => { try { osc1.stop(); osc2.stop(); } catch {} }, 2000);
    }
  };
}

// Arpeggio — repeating melodic pattern
function createArpeggio(notes: number[], interval: number, vol = 0.03) {
  const ctx = getCtx();
  let idx = 0;

  const playNote = () => {
    if (isMuted()) return;
    const freq = notes[idx % notes.length];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + interval * 0.8);
    osc.connect(gain);
    gain.connect(getMusicGain());
    osc.start();
    osc.stop(ctx.currentTime + interval);
    idx++;
  };

  playNote();
  const id = setInterval(playNote, interval * 1000);

  return {
    stop: () => { clearInterval(id); }
  };
}

// ── Scene definitions ──────────────────────────────────────────

function startCity() {
  // Dark minor drone + sparse arpeggio
  activeNodes.push(createDronePad(55, 0, 0.05));      // A1
  activeNodes.push(createDronePad(82.4, 5, 0.03));    // E2
  activeNodes.push(createDronePad(65.4, -3, 0.025));  // C2

  // Sparse noir arpeggio — Am pentatonic
  activeNodes.push(createArpeggio([220, 261, 330, 392, 440], 3.2, 0.015));
}

function startTrade() {
  // Jazzy feel — Dm7
  activeNodes.push(createDronePad(73.4, 0, 0.04));   // D2
  activeNodes.push(createDronePad(87.3, 7, 0.03));   // F2
  activeNodes.push(createArpeggio([294, 349, 440, 523, 587], 2.5, 0.018));
}

function startOps() {
  // Tense — pulsing
  activeNodes.push(createDronePad(49, 0, 0.05));     // G1
  activeNodes.push(createDronePad(58.3, -5, 0.04));  // Bb1

  // Fast subtle pulse
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = 30;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 1);

  // Rhythmic tremolo
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 2; // 2Hz pulse
  lfoGain.gain.value = 0.01;
  lfo.connect(lfoGain);
  lfoGain.connect(gain.gain);
  lfo.start();

  osc.connect(gain);
  gain.connect(getMusicGain());
  osc.start();

  activeNodes.push({
    stop: () => {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
      setTimeout(() => { try { osc.stop(); lfo.stop(); } catch {} }, 1500);
    }
  });
}

function startEmpire() {
  // Grand — power chord feel
  activeNodes.push(createDronePad(65.4, 0, 0.04));   // C2
  activeNodes.push(createDronePad(82.4, 3, 0.035));  // E2
  activeNodes.push(createDronePad(98, -2, 0.03));    // G2
  activeNodes.push(createArpeggio([262, 330, 392, 523, 659], 4, 0.012));
}

function startProfile() {
  // Mellow — reflective
  activeNodes.push(createDronePad(110, 0, 0.025));   // A2
  activeNodes.push(createDronePad(130.8, 5, 0.02));  // C3
}

function startCombat() {
  // Aggressive — dissonant
  activeNodes.push(createDronePad(41.2, 0, 0.06));   // E1
  activeNodes.push(createDronePad(46.2, -8, 0.05));  // Bb1 — tritone

  const ctx = getCtx();
  // Fast pulse
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = 35;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.5);
  osc.connect(gain);
  gain.connect(getMusicGain());
  osc.start();

  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 4;
  lfoGain.gain.value = 0.015;
  lfo.connect(lfoGain);
  lfoGain.connect(gain.gain);
  lfo.start();

  activeNodes.push({
    stop: () => {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
      setTimeout(() => { try { osc.stop(); lfo.stop(); } catch {} }, 1200);
    }
  });
}

// ── Public API ─────────────────────────────────────────────────

const SCENE_MAP: Record<MusicScene, (() => void) | null> = {
  city: startCity,
  trade: startTrade,
  ops: startOps,
  empire: startEmpire,
  profile: startProfile,
  combat: startCombat,
  none: null,
};

export function setMusicScene(scene: MusicScene) {
  if (scene === currentScene) return;
  stopAll();
  currentScene = scene;
  const start = SCENE_MAP[scene];
  if (start && !isMuted()) start();
}

export function stopMusic() {
  stopAll();
  currentScene = 'none';
}

export function setMusicVolume(v: number) {
  if (musicGain) musicGain.gain.value = Math.max(0, Math.min(0.2, v));
}

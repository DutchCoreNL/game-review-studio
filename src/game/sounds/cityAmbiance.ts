// City ambiance — procedural environmental sounds
// Creates atmospheric layers: distant traffic, sirens, rain, wind

import { getCtx, getMaster, isMuted } from '../sounds';

let ambianceGain: GainNode | null = null;
let activeNodes: { stop: () => void }[] = [];
let sirenTimer: ReturnType<typeof setTimeout> | null = null;
let running = false;

function getAmbianceGain(): GainNode {
  if (!ambianceGain) {
    const ctx = getCtx();
    ambianceGain = ctx.createGain();
    ambianceGain.gain.value = 0.06;
    ambianceGain.connect(getMaster());
  }
  return ambianceGain;
}

// Brown noise — city rumble / distant traffic
function createCityRumble() {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Generate brown noise
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 200;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 3);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(getAmbianceGain());
  source.start();

  return {
    stop: () => {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
      setTimeout(() => { try { source.stop(); } catch {} }, 2500);
    }
  };
}

// Distant siren — random timing
function playDistantSiren() {
  if (isMuted() || !running) return;

  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sine';
  filter.type = 'lowpass';
  filter.frequency.value = 800;

  // Randomize pan position (simulate distance)
  const pan = ctx.createStereoPanner?.();

  const startFreq = 400 + Math.random() * 200;
  osc.frequency.setValueAtTime(startFreq, ctx.currentTime);

  // Oscillate siren
  const duration = 2 + Math.random() * 2;
  for (let i = 0; i < Math.floor(duration / 0.6); i++) {
    const t = ctx.currentTime + i * 0.6;
    osc.frequency.linearRampToValueAtTime(startFreq + 150, t + 0.3);
    osc.frequency.linearRampToValueAtTime(startFreq, t + 0.6);
  }

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.008, ctx.currentTime + 0.5);
  gain.gain.setValueAtTime(0.008, ctx.currentTime + duration - 1);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

  osc.connect(filter);
  if (pan) {
    pan.pan.value = Math.random() * 2 - 1;
    filter.connect(pan);
    pan.connect(gain);
  } else {
    filter.connect(gain);
  }
  gain.connect(getAmbianceGain());
  osc.start();
  osc.stop(ctx.currentTime + duration + 0.1);

  // Schedule next siren
  if (running) {
    sirenTimer = setTimeout(playDistantSiren, (8 + Math.random() * 20) * 1000);
  }
}

// Wind whistle
function createWindLayer() {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * 3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 600;
  filter.Q.value = 5;

  // Modulate filter for whistling effect
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.15;
  lfoGain.gain.value = 200;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.012, ctx.currentTime + 4);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(getAmbianceGain());
  source.start();

  return {
    stop: () => {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
      setTimeout(() => { try { source.stop(); lfo.stop(); } catch {} }, 2500);
    }
  };
}

// ── Public API ─────────────────────────────────────────────────

export function startAmbiance() {
  if (running) return;
  running = true;

  activeNodes.push(createCityRumble());
  activeNodes.push(createWindLayer());

  // Start random sirens after a delay
  sirenTimer = setTimeout(playDistantSiren, 5000 + Math.random() * 10000);
}

export function stopAmbiance() {
  running = false;
  activeNodes.forEach(n => { try { n.stop(); } catch {} });
  activeNodes = [];
  if (sirenTimer) { clearTimeout(sirenTimer); sirenTimer = null; }
}

export function setAmbianceVolume(v: number) {
  if (ambianceGain) ambianceGain.gain.value = Math.max(0, Math.min(0.15, v));
}

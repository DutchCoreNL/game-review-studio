// City ambiance — procedural environmental sounds
// Creates atmospheric layers: distant traffic, sirens, rain, wind

import { getCtx, getMaster, isMuted } from '../sounds';

let ambianceGain: GainNode | null = null;
let activeNodes: { stop: () => void }[] = [];
let weatherNodes: { stop: () => void }[] = [];
let sirenTimer: ReturnType<typeof setTimeout> | null = null;
let thunderTimer: ReturnType<typeof setTimeout> | null = null;
let running = false;
let currentWeather: string = 'clear';

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

// ── Weather layers ─────────────────────────────────────────────

// Rain — filtered white noise with subtle variation
function createRainLayer(intensity: number = 0.6) {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  // Bandpass to shape rain texture
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 3000;
  filter.Q.value = 0.5;

  // Second filter for body
  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.value = 6000;

  // Subtle modulation for natural variation
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.3;
  lfoGain.gain.value = 800;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();

  const gain = ctx.createGain();
  const vol = 0.025 * intensity;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 3);

  source.connect(filter);
  filter.connect(lpf);
  lpf.connect(gain);
  gain.connect(getAmbianceGain());
  source.start();

  return {
    stop: () => {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
      setTimeout(() => { try { source.stop(); lfo.stop(); } catch {} }, 2500);
    }
  };
}

// Rain drops — sporadic high-frequency pings
function createRainDrops() {
  const ctx = getCtx();
  let dropInterval: ReturnType<typeof setInterval> | null = null;

  const playDrop = () => {
    if (isMuted() || !running) return;
    const freq = 2000 + Math.random() * 4000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.003 + Math.random() * 0.004, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
    osc.connect(gain);
    gain.connect(getAmbianceGain());
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  };

  // Random drops
  dropInterval = setInterval(() => {
    if (Math.random() < 0.4) playDrop();
  }, 80);

  return {
    stop: () => { if (dropInterval) clearInterval(dropInterval); }
  };
}

// Thunder — low frequency boom with crackle
function playThunder() {
  if (isMuted() || !running || currentWeather !== 'storm') return;

  const ctx = getCtx();

  // Deep boom
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(40 + Math.random() * 30, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 1.5);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 150;

  const vol = 0.06 + Math.random() * 0.08;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(getAmbianceGain());
  osc.start();
  osc.stop(ctx.currentTime + 2.5);

  // Crackle/rumble tail
  const noiseLen = ctx.sampleRate * 1.5;
  const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
  const noiseData = noiseBuf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < noiseLen; i++) {
    const w = Math.random() * 2 - 1;
    noiseData[i] = (last + 0.05 * w) / 1.05;
    last = noiseData[i];
  }
  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = noiseBuf;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.03, ctx.currentTime + 0.1);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
  const noiseFilt = ctx.createBiquadFilter();
  noiseFilt.type = 'bandpass';
  noiseFilt.frequency.value = 300;
  noiseFilt.Q.value = 0.3;
  noiseSrc.connect(noiseFilt);
  noiseFilt.connect(noiseGain);
  noiseGain.connect(getAmbianceGain());
  noiseSrc.start(ctx.currentTime + 0.1);

  // Schedule next thunder
  if (running && currentWeather === 'storm') {
    thunderTimer = setTimeout(playThunder, (6 + Math.random() * 15) * 1000);
  }
}

// Heavy wind for storms
function createStormWind() {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * 3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.7;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 400;
  filter.Q.value = 2;

  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.08;
  lfoGain.gain.value = 300;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 2);

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

function stopWeatherLayers() {
  weatherNodes.forEach(n => { try { n.stop(); } catch {} });
  weatherNodes = [];
  if (thunderTimer) { clearTimeout(thunderTimer); thunderTimer = null; }
}

function applyWeather(weather: string) {
  stopWeatherLayers();
  currentWeather = weather;

  if (!running || isMuted()) return;

  if (weather === 'rain') {
    weatherNodes.push(createRainLayer(0.6));
    weatherNodes.push(createRainDrops());
  } else if (weather === 'storm') {
    weatherNodes.push(createRainLayer(1.0));
    weatherNodes.push(createRainDrops());
    weatherNodes.push(createStormWind());
    thunderTimer = setTimeout(playThunder, 2000 + Math.random() * 5000);
  }
}

// ── Public API ─────────────────────────────────────────────────

export function startAmbiance() {
  if (running) return;
  running = true;

  activeNodes.push(createCityRumble());
  activeNodes.push(createWindLayer());

  // Start random sirens after a delay
  sirenTimer = setTimeout(playDistantSiren, 5000 + Math.random() * 10000);

  // Apply current weather
  if (currentWeather !== 'clear') applyWeather(currentWeather);
}

export function stopAmbiance() {
  running = false;
  activeNodes.forEach(n => { try { n.stop(); } catch {} });
  activeNodes = [];
  stopWeatherLayers();
  if (sirenTimer) { clearTimeout(sirenTimer); sirenTimer = null; }
}

export function setWeather(weather: string) {
  if (weather === currentWeather) return;
  applyWeather(weather);
}

export function setAmbianceVolume(v: number) {
  if (ambianceGain) ambianceGain.gain.value = Math.max(0, Math.min(0.15, v));
}

// Casino sound effects — procedural audio for casino games
import { getCtx, getMaster, isMuted } from '../sounds';

function playTone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.1, delay = 0) {
  if (isMuted()) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
  osc.connect(gain);
  gain.connect(getMaster());
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + dur + 0.02);
}

// ── SLOTS ──

export function playSlotSpin() {
  if (isMuted()) return;
  const ctx = getCtx();
  // Mechanical whirr
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(100, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.3);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  gain.gain.setValueAtTime(0.04, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(getMaster());
  osc.start();
  osc.stop(ctx.currentTime + 0.55);
}

export function playSlotReelStop() {
  playTone(600, 0.06, 'triangle', 0.08);
  playTone(300, 0.04, 'square', 0.04, 0.02);
}

export function playSlotWin() {
  const notes = [523, 659, 784, 1047]; // C E G C
  notes.forEach((f, i) => playTone(f, 0.15, 'sine', 0.12, i * 0.1));
}

export function playSlotJackpot() {
  // Fanfare ascending
  const notes = [523, 659, 784, 1047, 1319, 1568]; // C E G C E G
  notes.forEach((f, i) => playTone(f, 0.2, 'sine', 0.15, i * 0.12));
  // Shimmer
  playTone(2093, 0.4, 'sine', 0.06, 0.7);
}

// ── BLACKJACK ──

export function playCardDeal() {
  if (isMuted()) return;
  const ctx = getCtx();
  // Short noise burst — card slide
  const bufLen = ctx.sampleRate * 0.06;
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 3000;
  const gain = ctx.createGain();
  gain.gain.value = 0.06;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(getMaster());
  src.start();
}

export function playBlackjackWin() {
  playTone(880, 0.1, 'sine', 0.1);
  playTone(1320, 0.15, 'sine', 0.1, 0.08);
}

export function playBlackjackBust() {
  playTone(300, 0.15, 'triangle', 0.1);
  playTone(200, 0.2, 'triangle', 0.08, 0.1);
}

export function playBlackjackNatural() {
  // Blackjack 21!
  const notes = [659, 784, 988, 1319];
  notes.forEach((f, i) => playTone(f, 0.15, 'sine', 0.12, i * 0.08));
}

// ── ROULETTE ──

export function playRouletteSpin() {
  if (isMuted()) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  // Accelerating clicks
  for (let i = 0; i < 15; i++) {
    const t = ctx.currentTime + i * 0.08;
    osc.frequency.setValueAtTime(800 + Math.random() * 400, t);
    osc.frequency.setValueAtTime(0, t + 0.01);
  }
  gain.gain.setValueAtTime(0.04, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
  osc.connect(gain);
  gain.connect(getMaster());
  osc.start();
  osc.stop(ctx.currentTime + 1.6);
}

export function playRouletteBallDrop() {
  playTone(1200, 0.05, 'sine', 0.08);
  playTone(900, 0.04, 'sine', 0.06, 0.06);
  playTone(700, 0.06, 'sine', 0.05, 0.1);
}

export function playRouletteWin() {
  playTone(660, 0.1, 'sine', 0.1);
  playTone(880, 0.12, 'sine', 0.1, 0.08);
  playTone(1100, 0.15, 'sine', 0.08, 0.16);
}

// ── HIGH-LOW ──

export function playCardFlip() {
  if (isMuted()) return;
  const ctx = getCtx();
  const bufLen = ctx.sampleRate * 0.04;
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen) * 0.5;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 4000;
  const gain = ctx.createGain();
  gain.gain.value = 0.05;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(getMaster());
  src.start();
}

export function playStreakUp() {
  playTone(800, 0.08, 'sine', 0.08);
  playTone(1000, 0.08, 'sine', 0.08, 0.06);
  playTone(1200, 0.1, 'sine', 0.06, 0.12);
}

export function playCashOut() {
  const notes = [880, 1047, 1175, 1319, 1568];
  notes.forEach((f, i) => playTone(f, 0.08, 'sine', 0.1, i * 0.05));
}

export function playLoss() {
  playTone(400, 0.15, 'triangle', 0.08);
  playTone(300, 0.2, 'triangle', 0.06, 0.1);
}

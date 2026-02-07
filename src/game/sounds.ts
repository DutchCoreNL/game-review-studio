// Lightweight procedural audio engine using Web Audio API
// No external files needed — all sounds are synthesized

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let muted = false;
let volume = 0.35;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function getMaster(): GainNode {
  getCtx();
  return masterGain!;
}

// ── Volume control ──────────────────────────────────────────────

export function setVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  if (masterGain) masterGain.gain.value = muted ? 0 : volume;
}

export function getVolume(): number {
  return volume;
}

export function toggleMute(): boolean {
  muted = !muted;
  if (masterGain) masterGain.gain.value = muted ? 0 : volume;
  return muted;
}

export function isMuted(): boolean {
  return muted;
}

// ── Helper: play a tone ─────────────────────────────────────────

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  startDelay = 0,
  gainValue = 0.3,
) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = freq;

  gain.gain.setValueAtTime(0, ctx.currentTime + startDelay);
  gain.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + startDelay + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);

  osc.connect(gain);
  gain.connect(getMaster());

  osc.start(ctx.currentTime + startDelay);
  osc.stop(ctx.currentTime + startDelay + duration + 0.05);
}

// ── Coin / cash sound ───────────────────────────────────────────
// Quick ascending pentatonic notes — sounds like coins falling

export function playCoinSound() {
  const notes = [880, 1047, 1175, 1319, 1568]; // A5-G6 pentatonic
  notes.forEach((freq, i) => {
    playTone(freq, 0.08, 'sine', i * 0.05, 0.15);
  });
}

// ── Alarm / siren sound ─────────────────────────────────────────
// Oscillating frequency — police siren feel

export function playAlarmSound() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(600, ctx.currentTime);

  // Oscillate between 600 and 900 Hz
  for (let i = 0; i < 4; i++) {
    const t = ctx.currentTime + i * 0.35;
    osc.frequency.linearRampToValueAtTime(900, t + 0.175);
    osc.frequency.linearRampToValueAtTime(600, t + 0.35);
  }

  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);

  osc.connect(gain);
  gain.connect(getMaster());

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 1.5);
}

// ── Dramatic reveal ─────────────────────────────────────────────
// Low drone building up, followed by a "hit"

export function playDramaticReveal() {
  const ctx = getCtx();

  // Drone — low rumble
  const drone = ctx.createOscillator();
  const droneGain = ctx.createGain();
  drone.type = 'sawtooth';
  drone.frequency.setValueAtTime(55, ctx.currentTime);
  drone.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.35);
  droneGain.gain.setValueAtTime(0.05, ctx.currentTime);
  droneGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.3);
  droneGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  drone.connect(droneGain);
  droneGain.connect(getMaster());
  drone.start(ctx.currentTime);
  drone.stop(ctx.currentTime + 0.55);

  // Hit — sharp transient
  const hit = ctx.createOscillator();
  const hitGain = ctx.createGain();
  hit.type = 'square';
  hit.frequency.setValueAtTime(220, ctx.currentTime + 0.35);
  hit.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.65);
  hitGain.gain.setValueAtTime(0, ctx.currentTime);
  hitGain.gain.setValueAtTime(0.25, ctx.currentTime + 0.35);
  hitGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
  hit.connect(hitGain);
  hitGain.connect(getMaster());
  hit.start(ctx.currentTime + 0.35);
  hit.stop(ctx.currentTime + 0.75);
}

// ── Negative sound ──────────────────────────────────────────────
// Short descending tone — loss / cost

export function playNegativeSound() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.25);

  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

  osc.connect(gain);
  gain.connect(getMaster());
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.35);
}

// ── Positive "ding" ─────────────────────────────────────────────
// Bright ascending bell — win / success

export function playPositiveSound() {
  playTone(880, 0.12, 'sine', 0, 0.2);
  playTone(1320, 0.18, 'sine', 0.08, 0.2);
}

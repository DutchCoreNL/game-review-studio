// UI sound effects — lightweight procedural feedback sounds
import { getCtx, getMaster, isMuted } from '../sounds';

function playToneQuick(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.1) {
  if (isMuted()) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(gain);
  gain.connect(getMaster());
  osc.start();
  osc.stop(ctx.currentTime + dur + 0.02);
}

// Navigation tab switch — soft click
export function playNavClick() {
  playToneQuick(1200, 0.04, 'sine', 0.06);
  playToneQuick(1800, 0.03, 'sine', 0.03);
}

// Button press — subtle tactile
export function playButtonPress() {
  playToneQuick(800, 0.05, 'triangle', 0.05);
}

// Popup open — swoosh up
export function playPopupOpen() {
  if (isMuted()) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.connect(gain);
  gain.connect(getMaster());
  osc.start();
  osc.stop(ctx.currentTime + 0.18);
}

// Popup close — swoosh down
export function playPopupClose() {
  if (isMuted()) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.04, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  osc.connect(gain);
  gain.connect(getMaster());
  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}

// Timer tick — clock-like
export function playTimerTick() {
  playToneQuick(2400, 0.02, 'square', 0.03);
}

// Error / denied
export function playErrorBuzz() {
  if (isMuted()) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = 120;
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.connect(gain);
  gain.connect(getMaster());
  osc.start();
  osc.stop(ctx.currentTime + 0.18);
}

// Notification ping
export function playNotificationPing() {
  playToneQuick(1047, 0.08, 'sine', 0.08);
  setTimeout(() => playToneQuick(1319, 0.1, 'sine', 0.06), 80);
}

// Slide / swipe transition
export function playSlideSound() {
  if (isMuted()) return;
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * 0.08;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 2000;
  const gain = ctx.createGain();
  gain.gain.value = 0.03;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(getMaster());
  source.start();
}

// Alert/alarm trigger — urgent double beep
export function playAlertTrigger() {
  playToneQuick(880, 0.08, 'sine', 0.1);
  setTimeout(() => playToneQuick(1100, 0.1, 'sine', 0.08), 100);
  setTimeout(() => playToneQuick(1320, 0.12, 'sine', 0.06), 220);
}

// Combat hit — impact thud
export function playCombatHit() {
  if (isMuted()) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(80, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.connect(gain);
  gain.connect(getMaster());
  osc.start();
  osc.stop(ctx.currentTime + 0.18);
}

// Reward — ascending triumphant arpeggio
export function playRewardSound() {
  playToneQuick(523, 0.1, 'sine', 0.07);
  setTimeout(() => playToneQuick(659, 0.1, 'sine', 0.06), 80);
  setTimeout(() => playToneQuick(784, 0.12, 'sine', 0.07), 160);
  setTimeout(() => playToneQuick(1047, 0.15, 'sine', 0.05), 260);
}

// Auction bid — gavel tap
export function playAuctionBid() {
  playToneQuick(300, 0.04, 'triangle', 0.08);
  setTimeout(() => playToneQuick(600, 0.06, 'triangle', 0.06), 60);
}

// Alliance formed — warm chord
export function playAllianceFormed() {
  playToneQuick(440, 0.2, 'sine', 0.06);
  playToneQuick(554, 0.2, 'sine', 0.05);
  playToneQuick(659, 0.2, 'sine', 0.04);
}

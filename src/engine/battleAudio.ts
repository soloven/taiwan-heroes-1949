import type { SkillVisualType } from '../types/game';

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let sharedCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

// Throttle timestamps (ms) to prevent audio spam during intense melee/volley
let lastClashAt = 0;
let lastArrowAt = 0;

function getAudioContext(muted: boolean): AudioContext | null {
  if (muted || typeof window === 'undefined') return null;
  try {
    if (!sharedCtx) {
      const Ctor =
        window.AudioContext ||
        (window as WindowWithWebkitAudio).webkitAudioContext;
      if (!Ctor) return null;
      sharedCtx = new Ctor();
    }
    if (sharedCtx.state === 'suspended') {
      void sharedCtx.resume();
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) {
    return noiseBuffer;
  }
  const length = Math.floor(ctx.sampleRate * 1.2);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return buffer;
}

function playWarDrumHit(
  ctx: AudioContext,
  startTime: number,
  volume = 0.24,
  baseFreq = 115
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(baseFreq * 1.5, startTime);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.48, startTime + 0.19);

  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.24);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + 0.26);

  // Drumhead skin transient
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(320, startTime);
  filter.Q.setValueAtTime(1.2, startTime);

  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(volume * 0.32, startTime);
  nGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);

  noise.connect(filter);
  filter.connect(nGain);
  nGain.connect(ctx.destination);
  noise.start(startTime);
  noise.stop(startTime + 0.09);
}

/**
 * Resonant war drum roll + heroic brass war horn.
 */
export function playBattleStart(muted: boolean): void {
  const ctx = getAudioContext(muted);
  if (!ctx) return;
  try {
    const now = ctx.currentTime + 0.01;
    // Accelerating war drum roll
    const drumOffsets = [0, 0.16, 0.3, 0.42, 0.52, 0.61];
    drumOffsets.forEach((offset, idx) => {
      const vol = 0.14 + idx * 0.025;
      playWarDrumHit(ctx, now + offset, vol, idx === drumOffsets.length - 1 ? 95 : 122);
    });

    // Resonant brass horn
    const hornStart = now + 0.32;
    const hornDur = 0.85;
    const freqs = [196, 293.66]; // G3 + D4 fifth
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq * 0.96, hornStart);
      osc.frequency.linearRampToValueAtTime(freq, hornStart + 0.14);
      osc.frequency.setValueAtTime(freq, hornStart + hornDur - 0.18);
      osc.frequency.linearRampToValueAtTime(freq * 0.985, hornStart + hornDur);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(620, hornStart);
      filter.frequency.linearRampToValueAtTime(1450, hornStart + 0.25);
      filter.frequency.exponentialRampToValueAtTime(520, hornStart + hornDur);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, hornStart);
      gain.gain.linearRampToValueAtTime(i === 0 ? 0.12 : 0.075, hornStart + 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, hornStart + hornDur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(hornStart);
      osc.stop(hornStart + hornDur + 0.03);
    });
  } catch {
    // Graceful no-op
  }
}

/**
 * Crisp metallic sword clash transient (throttled so melee never spams).
 */
export function playSwordClash(muted: boolean): void {
  const ctx = getAudioContext(muted);
  if (!ctx) return;
  const nowMs = performance.now();
  if (nowMs - lastClashAt < 85) return;
  lastClashAt = nowMs;

  try {
    const now = ctx.currentTime;
    const jitter = 0.9 + Math.random() * 0.24;

    // Two inharmonic metallic ring partials
    const partials = [2380 * jitter, 3720 * jitter];
    partials.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.72, now + 0.11);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(idx === 0 ? 0.07 : 0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    });

    // Crisp steel scrape transient
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(4200 * jitter, now);
    bp.Q.setValueAtTime(2.4, now);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.065, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    noise.connect(bp);
    bp.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.075);
  } catch {
    // Graceful no-op
  }
}

/**
 * Light airy arrow whoosh (throttled for volley readability).
 */
export function playArrowShot(muted: boolean): void {
  const ctx = getAudioContext(muted);
  if (!ctx) return;
  const nowMs = performance.now();
  if (nowMs - lastArrowAt < 95) return;
  lastArrowAt = nowMs;

  try {
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2600 + Math.random() * 500, now);
    filter.frequency.exponentialRampToValueAtTime(900, now + 0.13);
    filter.Q.setValueAtTime(3.2, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.055, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.15);
  } catch {
    // Graceful no-op
  }
}

/**
 * Dramatic skill cast audio tailored to SkillVisualType.
 */
export function playSkillCast(skillType: SkillVisualType, muted: boolean): void {
  const ctx = getAudioContext(muted);
  if (!ctx) return;

  try {
    const now = ctx.currentTime + 0.01;
    // Universal epic war-drum accent on cast
    playWarDrumHit(ctx, now, 0.24, 92);

    switch (skillType) {
      case 'wave': {
        // Surging ocean wave roar + deep bronze gong
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(280, now);
        filter.frequency.exponentialRampToValueAtTime(1400, now + 0.35);
        filter.frequency.exponentialRampToValueAtTime(340, now + 0.95);
        filter.Q.setValueAtTime(1.1, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.19, now + 0.22);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 1.05);

        const gong = ctx.createOscillator();
        gong.type = 'triangle';
        gong.frequency.setValueAtTime(165, now);
        gong.frequency.exponentialRampToValueAtTime(132, now + 0.8);
        const gGain = ctx.createGain();
        gGain.gain.setValueAtTime(0.14, now);
        gGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
        gong.connect(gGain);
        gGain.connect(ctx.destination);
        gong.start(now);
        gong.stop(now + 0.88);
        break;
      }

      case 'heal': {
        // Sacred Mazu temple jade chimes (pentatonic shimmer)
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
        notes.forEach((freq, idx) => {
          const t = now + idx * 0.08;
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);

          const overtone = ctx.createOscillator();
          overtone.type = 'triangle';
          overtone.frequency.setValueAtTime(freq * 2, t);

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(0.11, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.72);

          const oGain = ctx.createGain();
          oGain.gain.setValueAtTime(0.035, t);
          oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

          osc.connect(gain);
          overtone.connect(oGain);
          gain.connect(ctx.destination);
          oGain.connect(ctx.destination);

          osc.start(t);
          overtone.start(t);
          osc.stop(t + 0.75);
          overtone.stop(t + 0.5);
        });
        break;
      }

      case 'assassinate': {
        // High-speed shadow blade slash + sub-bass impact
        const slash = ctx.createOscillator();
        slash.type = 'sawtooth';
        slash.frequency.setValueAtTime(1850, now);
        slash.frequency.exponentialRampToValueAtTime(220, now + 0.24);
        const sFilter = ctx.createBiquadFilter();
        sFilter.type = 'highpass';
        sFilter.frequency.setValueAtTime(750, now);
        const sGain = ctx.createGain();
        sGain.gain.setValueAtTime(0.14, now);
        sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

        slash.connect(sFilter);
        sFilter.connect(sGain);
        sGain.connect(ctx.destination);
        slash.start(now);
        slash.stop(now + 0.28);

        playWarDrumHit(ctx, now + 0.16, 0.28, 74);
        break;
      }

      case 'quake': {
        // Earth-shattering sub rumble + fracture noise
        const sub = ctx.createOscillator();
        sub.type = 'sawtooth';
        sub.frequency.setValueAtTime(84, now);
        sub.frequency.exponentialRampToValueAtTime(34, now + 0.75);

        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(240, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        sub.connect(lp);
        lp.connect(gain);
        gain.connect(ctx.destination);
        sub.start(now);
        sub.stop(now + 0.82);

        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);
        const nFilter = ctx.createBiquadFilter();
        nFilter.type = 'lowpass';
        nFilter.frequency.setValueAtTime(520, now);
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.18, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

        noise.connect(nFilter);
        nFilter.connect(nGain);
        nGain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 0.7);
        break;
      }

      case 'lightning': {
        // Electric thunder crack + rolling boom
        const crack = ctx.createBufferSource();
        crack.buffer = getNoiseBuffer(ctx);
        const hp = ctx.createBiquadFilter();
        hp.type = 'bandpass';
        hp.frequency.setValueAtTime(3200, now);
        hp.frequency.exponentialRampToValueAtTime(280, now + 0.65);
        hp.Q.setValueAtTime(0.9, now);

        const cGain = ctx.createGain();
        cGain.gain.setValueAtTime(0.24, now);
        cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);

        crack.connect(hp);
        hp.connect(cGain);
        cGain.connect(ctx.destination);
        crack.start(now);
        crack.stop(now + 0.75);

        const zap = ctx.createOscillator();
        zap.type = 'square';
        zap.frequency.setValueAtTime(960, now);
        zap.frequency.exponentialRampToValueAtTime(110, now + 0.22);
        const zGain = ctx.createGain();
        zGain.gain.setValueAtTime(0.09, now);
        zGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        zap.connect(zGain);
        zGain.connect(ctx.destination);
        zap.start(now);
        zap.stop(now + 0.26);
        break;
      }

      case 'volley': {
        // Rapid flaming arrow storm whooshes
        for (let i = 0; i < 4; i++) {
          const t = now + i * 0.085;
          const noise = ctx.createBufferSource();
          noise.buffer = getNoiseBuffer(ctx);
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(2200 + i * 260, t);
          bp.frequency.exponentialRampToValueAtTime(650, t + 0.22);
          bp.Q.setValueAtTime(1.8, t);

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.11, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

          noise.connect(bp);
          bp.connect(gain);
          gain.connect(ctx.destination);
          noise.start(t);
          noise.stop(t + 0.26);
        }
        break;
      }
    }
  } catch {
    // Graceful no-op
  }
}

/**
 * Heroic triumphant 4-note pentatonic fanfare.
 */
export function playVictory(muted: boolean): void {
  const ctx = getAudioContext(muted);
  if (!ctx) return;

  try {
    const now = ctx.currentTime + 0.02;
    const notes = [
      { freq: 523.25, t: 0, dur: 0.2 }, // C5
      { freq: 587.33, t: 0.16, dur: 0.2 }, // D5
      { freq: 783.99, t: 0.32, dur: 0.24 }, // G5
      { freq: 1046.5, t: 0.52, dur: 0.68 }, // C6
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, now + n.t);

      const brass = ctx.createOscillator();
      brass.type = 'sawtooth';
      brass.frequency.setValueAtTime(n.freq * 0.5, now + n.t);

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(2200, now + n.t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now + n.t);
      gain.gain.linearRampToValueAtTime(0.14, now + n.t + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.dur);

      osc.connect(lp);
      brass.connect(lp);
      lp.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + n.t);
      brass.start(now + n.t);
      osc.stop(now + n.t + n.dur + 0.03);
      brass.stop(now + n.t + n.dur + 0.03);
    });

    playWarDrumHit(ctx, now + 0.52, 0.2, 100);
  } catch {
    // Graceful no-op
  }
}

/**
 * Somber low descending horn on defeat or retreat.
 */
export function playDefeat(muted: boolean): void {
  const ctx = getAudioContext(muted);
  if (!ctx) return;

  try {
    const now = ctx.currentTime + 0.02;
    const notes = [
      { freq: 196.0, t: 0, dur: 0.38 }, // G3
      { freq: 174.61, t: 0.34, dur: 0.38 }, // F3
      { freq: 146.83, t: 0.68, dur: 0.75 }, // D3
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.freq, now + n.t);
      osc.frequency.linearRampToValueAtTime(n.freq * 0.97, now + n.t + n.dur);

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(560, now + n.t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now + n.t);
      gain.gain.linearRampToValueAtTime(0.11, now + n.t + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.dur);

      osc.connect(lp);
      lp.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + n.t);
      osc.stop(now + n.t + n.dur + 0.04);
    });
  } catch {
    // Graceful no-op
  }
}

/**
 * Warm jade-bell celebratory chord for recruiting an officer.
 */
export function playRecruitSuccess(muted: boolean): void {
  const ctx = getAudioContext(muted);
  if (!ctx) return;

  try {
    const now = ctx.currentTime + 0.01;
    const chord = [523.25, 659.25, 783.99, 880.0, 1046.5];
    chord.forEach((freq, i) => {
      const t = now + i * 0.055;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      const shimmer = ctx.createOscillator();
      shimmer.type = 'triangle';
      shimmer.frequency.setValueAtTime(freq * 1.5, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.095, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.85);

      const sGain = ctx.createGain();
      sGain.gain.setValueAtTime(0.028, t);
      sGain.gain.exponentialRampToValueAtTime(0.0008, t + 0.45);

      osc.connect(gain);
      shimmer.connect(sGain);
      gain.connect(ctx.destination);
      sGain.connect(ctx.destination);

      osc.start(t);
      shimmer.start(t);
      osc.stop(t + 0.88);
      shimmer.stop(t + 0.48);
    });
  } catch {
    // Graceful no-op
  }
}

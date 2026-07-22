const AudioCtx = typeof window !== "undefined" ? window.AudioContext || window.webkitAudioContext : null;

const BIOME_AMBIENCE = {
  forest: { freqs: [184, 276], gain: 0.038, noise: 0.011, tint: 620 },
  marsh: { freqs: [146, 218], gain: 0.04, noise: 0.016, tint: 480 },
  highlands: { freqs: [172, 258], gain: 0.032, noise: 0.009, tint: 700 },
  ember: { freqs: [132, 198], gain: 0.036, noise: 0.014, tint: 420 },
  frost: { freqs: [220, 330], gain: 0.029, noise: 0.008, tint: 920 },
  blight: { freqs: [124, 186], gain: 0.037, noise: 0.017, tint: 340 },
  ancient: { freqs: [196, 294], gain: 0.032, noise: 0.009, tint: 760 },
};

export function createAudioState() {
  return {
    enabled: Boolean(AudioCtx),
    context: null,
    master: null,
    musicBus: null,
    sfxBus: null,
    ambience: null,
    queue: [],
    musicVolume: 0.7,
    sfxVolume: 0.8,
    lastCue: null,
    playedCount: 0,
    unlockedAt: 0,
  };
}

export function applyAudioSettings(audio, settings) {
  if (!audio) return;
  audio.musicVolume = clampUnit(settings?.musicVolume, 0.7);
  audio.sfxVolume = clampUnit(settings?.sfxVolume, 0.8);

  if (!audio.context) return;

  const now = audio.context.currentTime;
  if (audio.musicBus) {
    audio.musicBus.gain.cancelScheduledValues(now);
    audio.musicBus.gain.linearRampToValueAtTime(audio.musicVolume, now + 0.08);
  }

  if (audio.sfxBus) {
    audio.sfxBus.gain.cancelScheduledValues(now);
    audio.sfxBus.gain.linearRampToValueAtTime(audio.sfxVolume, now + 0.08);
  }
}

export function queueAudio(state, cue, options = {}) {
  if (!state?.audio?.enabled) return;
  state.audio.queue.push({ cue, ...options });
}

export function ensureAudioStarted(audio) {
  if (!audio?.enabled) return false;

  if (!audio.context) {
    initializeAudio(audio);
  }

  if (!audio.context) return false;

  if (audio.context.state === "suspended") {
    audio.context.resume().catch(() => {});
  }

  return true;
}

export function updateAudio(state, input) {
  const audio = state.audio;
  if (!audio?.enabled) return;

  if (!audio.context) {
    if (!hasUnlockGesture(input)) return;
    ensureAudioStarted(audio);
  }

  if (!audio.context) return;

  if (audio.context.state === "suspended" && hasUnlockGesture(input)) {
    audio.context.resume().catch(() => {});
  }

  syncAmbience(state);
  flushAudioQueue(audio);
}

function hasUnlockGesture(input) {
  return (
    input.mouse.leftPressed ||
    input.mouse.rightPressed ||
    input.keyPressed.size > 0 ||
    input.codePressed.size > 0
  );
}

function initializeAudio(audio) {
  if (!AudioCtx) return;

  try {
    const context = new AudioCtx();
    const master = context.createGain();
    master.gain.value = 0.42;
    const musicBus = context.createGain();
    const sfxBus = context.createGain();
    musicBus.gain.value = audio.musicVolume;
    sfxBus.gain.value = audio.sfxVolume;
    musicBus.connect(master);
    sfxBus.connect(master);
    master.connect(context.destination);

    audio.context = context;
    audio.master = master;
    audio.musicBus = musicBus;
    audio.sfxBus = sfxBus;
    audio.ambience = createAmbienceBus(context, musicBus);
    audio.unlockedAt = Date.now();
    context.resume().catch(() => {});
  } catch {
    audio.enabled = false;
  }
}

function createAmbienceBus(context, master) {
  const gain = context.createGain();
  gain.gain.value = 0;

  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 640;
  filter.Q.value = 0.3;

  const oscA = context.createOscillator();
  oscA.type = "triangle";
  oscA.frequency.value = 184;
  const oscB = context.createOscillator();
  oscB.type = "sine";
  oscB.frequency.value = 276;

  const oscAGain = context.createGain();
  oscAGain.gain.value = 0.24;
  const oscBGain = context.createGain();
  oscBGain.gain.value = 0.16;

  const noiseSource = context.createBufferSource();
  noiseSource.buffer = createNoiseBuffer(context, 1.8);
  noiseSource.loop = true;
  const noiseFilter = context.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = 620;
  noiseFilter.Q.value = 0.7;
  const noiseGain = context.createGain();
  noiseGain.gain.value = 0.01;

  oscA.connect(oscAGain);
  oscB.connect(oscBGain);
  oscAGain.connect(filter);
  oscBGain.connect(filter);
  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  filter.connect(gain);
  noiseGain.connect(gain);
  gain.connect(master);

  oscA.start();
  oscB.start();
  noiseSource.start();

  return {
    gain,
    filter,
    oscA,
    oscB,
    noiseFilter,
    noiseGain,
  };
}

function createNoiseBuffer(context, seconds) {
  const length = Math.max(1, Math.floor(context.sampleRate * seconds));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * 0.42;
  }
  return buffer;
}

function syncAmbience(state) {
  const audio = state.audio;
  if (!audio?.ambience || !audio.context) return;

  const preset = BIOME_AMBIENCE[state.scene?.biomeId] || BIOME_AMBIENCE.forest;
  const now = audio.context.currentTime;
  const combatMix = state.combatTimer > 0 ? 1 : 0;
  const gainTarget = preset.gain + combatMix * 0.008;
  const noiseTarget = preset.noise + combatMix * 0.004;

  audio.ambience.oscA.frequency.linearRampToValueAtTime(preset.freqs[0] + combatMix * 10, now + 0.35);
  audio.ambience.oscB.frequency.linearRampToValueAtTime(preset.freqs[1] + combatMix * 16, now + 0.35);
  audio.ambience.filter.frequency.linearRampToValueAtTime(preset.tint + combatMix * 120, now + 0.35);
  audio.ambience.noiseFilter.frequency.linearRampToValueAtTime(Math.max(260, preset.tint * 0.82), now + 0.35);
  audio.ambience.gain.gain.linearRampToValueAtTime(gainTarget, now + 0.4);
  audio.ambience.noiseGain.gain.linearRampToValueAtTime(noiseTarget, now + 0.4);
}

function flushAudioQueue(audio) {
  if (!audio.context || !audio.master || audio.queue.length === 0) return;

  const events = audio.queue.splice(0, audio.queue.length);
  for (const event of events) {
    playCue(audio, event);
  }
}

function playCue(audio, event) {
  switch (event.cue) {
    case "staff":
      toneSweep(audio, 280, 180, 0.09, 0.085, "square");
      noiseHit(audio, 0.045, 0.025, 1600);
      break;
    case "bolt":
      toneSweep(audio, 520, 760, 0.15, 0.06, "triangle");
      break;
    case "dash":
      toneSweep(audio, 220, 120, 0.12, 0.065, "sawtooth");
      noiseHit(audio, 0.08, 0.018, 900);
      break;
    case "root":
      toneSweep(audio, 210, 320, 0.24, 0.07, "triangle");
      break;
    case "pulse":
      chord(audio, [204, 258, 322], 0.24, 0.055, "triangle");
      toneSweep(audio, 280, 190, 0.18, 0.035, "sine");
      break;
    case "enemy-hit":
      toneSweep(audio, 180, 120, 0.07, 0.05, "square");
      break;
    case "enemy-down":
      toneSweep(audio, 190, 86, 0.18, 0.06, "sawtooth");
      noiseHit(audio, 0.1, 0.03, 620);
      break;
    case "boss-down":
      chord(audio, [180, 226, 292], 0.52, 0.08, "triangle");
      noiseHit(audio, 0.2, 0.04, 480);
      break;
    case "player-hit":
      toneSweep(audio, 132, 84, 0.14, 0.075, "sawtooth");
      noiseHit(audio, 0.08, 0.022, 740);
      break;
    case "level-up":
      chord(audio, [262, 330, 392], 0.4, 0.075, "triangle");
      break;
    case "quest":
      chord(audio, [220, 277, 330], 0.28, 0.055, "triangle");
      break;
    case "buy":
      chord(audio, [392, 494], 0.16, 0.05, "triangle");
      break;
    case "sell":
      chord(audio, [294, 220], 0.14, 0.045, "triangle");
      break;
    case "equip":
      toneSweep(audio, 246, 340, 0.12, 0.05, "triangle");
      break;
    case "use-item":
      chord(audio, [330, 392], 0.18, 0.05, "sine");
      break;
    case "collect":
      toneSweep(audio, 520, 680, 0.12, 0.036, "triangle");
      chord(audio, [392, 494], 0.18, 0.032, "sine");
      break;
    case "brew":
      toneSweep(audio, 180, 260, 0.26, 0.052, "triangle");
      chord(audio, [330, 392, 494], 0.22, 0.044, "sine");
      noiseHit(audio, 0.12, 0.014, 920);
      break;
    case "attune":
      toneSweep(audio, 246, 492, 0.32, 0.05, "triangle");
      chord(audio, [330, 415, 554], 0.3, 0.052, "triangle");
      break;
    case "heal":
      chord(audio, [262, 330, 392], 0.26, 0.052, "sine");
      toneSweep(audio, 392, 524, 0.2, 0.028, "triangle");
      break;
    case "respec":
      toneSweep(audio, 392, 196, 0.18, 0.044, "triangle");
      toneSweep(audio, 220, 330, 0.2, 0.036, "sine");
      break;
    case "renewal":
      chord(audio, [196, 247, 294], 0.34, 0.052, "triangle");
      toneSweep(audio, 294, 392, 0.28, 0.032, "sine");
      break;
    case "training-start":
      toneSweep(audio, 220, 330, 0.14, 0.045, "square");
      toneSweep(audio, 330, 440, 0.14, 0.034, "triangle");
      break;
    case "training-complete":
      chord(audio, [294, 370, 440], 0.28, 0.052, "triangle");
      noiseHit(audio, 0.08, 0.012, 1180);
      break;
    case "stash":
      toneSweep(audio, 180, 240, 0.1, 0.04, "triangle");
      break;
    case "travel":
      toneSweep(audio, 240, 340, 0.3, 0.05, "triangle");
      break;
    case "ui":
      toneSweep(audio, 420, 380, 0.06, 0.03, "triangle");
      break;
    default:
      break;
  }
  audio.lastCue = event.cue;
  audio.playedCount += 1;
}

function toneSweep(audio, from, to, duration, gainAmount, type = "triangle") {
  const { context } = audio;
  const output = audio.sfxBus || audio.master;
  const now = context.currentTime;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, to), now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(gainAmount, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(output);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function chord(audio, notes, duration, gainAmount, type = "triangle") {
  for (const note of notes) {
    toneSweep(audio, note, note * 1.006, duration, gainAmount / Math.max(1.75, notes.length), type);
  }
}

function noiseHit(audio, duration, gainAmount, tint) {
  const { context } = audio;
  const output = audio.sfxBus || audio.master;
  const now = context.currentTime;
  const source = context.createBufferSource();
  source.buffer = createNoiseBuffer(context, duration + 0.04);
  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(tint, now);
  filter.Q.value = 0.7;
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(gainAmount, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(output);
  source.start(now);
  source.stop(now + duration + 0.02);
}

function clampUnit(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(1, number));
}

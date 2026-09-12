const HAPTIC_PRESETS = {
  dash: { duration: 30, weak: 0.18, strong: 0.1, priority: 1 },
  hit: { duration: 42, weak: 0.24, strong: 0.18, priority: 2 },
  heavy: { duration: 62, weak: 0.36, strong: 0.42, priority: 3 },
  hurt: { duration: 84, weak: 0.42, strong: 0.7, priority: 4 },
  level: { duration: 96, weak: 0.46, strong: 0.54, priority: 5 },
  bossDown: { duration: 180, weak: 0.78, strong: 1, priority: 6 },
};

export function classifyCombatHaptic(entry) {
  if (!entry || entry.abilityDenied) return null;
  const text = String(entry.text || "");
  if (text.startsWith("-")) return "hurt";
  if (entry.heavy) return "heavy";
  if (/^\d+$/.test(text)) return "hit";
  return null;
}

export function pickStrongestHaptic(types = []) {
  return types
    .filter((type) => HAPTIC_PRESETS[type])
    .sort(
      (a, b) =>
        HAPTIC_PRESETS[b].priority - HAPTIC_PRESETS[a].priority
    )[0] || null;
}

export function createRuntimeFeedbackMonitor({
  getState,
  getSettings,
  getInputDevice,
} = {}) {
  const seenCombatText = new WeakSet();
  let frameId = 0;
  let stopped = false;
  let previousDashActive = false;
  let previousLevel = null;
  let previousBossId = null;
  let previousBossDead = false;
  let lastPulseAt = 0;

  function canUseHaptics() {
    const settings = getSettings?.() || getState?.()?.settings || {};
    return (
      settings.controllerVibration !== false &&
      (getInputDevice?.() || "keyboard") === "gamepad"
    );
  }

  function findActiveGamepad() {
    if (typeof navigator === "undefined" || !navigator.getGamepads) return null;
    return Array.from(navigator.getGamepads() || []).find(
      (candidate) => candidate?.connected
    ) || null;
  }

  function pulse(type, options = {}) {
    const preset = HAPTIC_PRESETS[type];
    if (!preset || !canUseHaptics()) return false;

    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (!options.force && now - lastPulseAt < 24) return false;

    const pad = findActiveGamepad();
    const actuator = pad?.vibrationActuator || pad?.hapticActuators?.[0];
    if (!actuator) return false;

    lastPulseAt = now;
    const payload = {
      duration: preset.duration,
      weakMagnitude: preset.weak,
      strongMagnitude: preset.strong,
    };

    try {
      if (typeof actuator.playEffect === "function") {
        actuator.playEffect("dual-rumble", payload)?.catch?.(() => {});
        return true;
      }
      if (typeof actuator.pulse === "function") {
        actuator.pulse(preset.strong, preset.duration)?.catch?.(() => {});
        return true;
      }
    } catch {
      return false;
    }

    return false;
  }

  function scanCombatText(state) {
    const pending = [];
    for (const entry of state?.combatText || []) {
      if (!entry || typeof entry !== "object" || seenCombatText.has(entry)) continue;
      seenCombatText.add(entry);
      const type = classifyCombatHaptic(entry);
      if (type) pending.push(type);
    }
    const strongest = pickStrongestHaptic(pending);
    if (strongest) pulse(strongest);
  }

  function scanDash(state) {
    const dashActive = Number(state?.player?.dashTime || 0) > 0.08;
    if (dashActive && !previousDashActive) {
      pulse("dash");
    }
    previousDashActive = dashActive;
  }

  function scanLevel(state) {
    const level = Math.max(1, Number(state?.progression?.level || 1));
    if (previousLevel !== null && level > previousLevel) {
      pulse("level", { force: true });
      if (typeof window !== "undefined") {
        window.setTimeout(() => pulse("level", { force: true }), 115);
      }
    }
    previousLevel = level;
  }

  function scanBoss(state) {
    const boss = state?.boss || null;
    const bossId = boss?.id || null;
    const bossDead = Boolean(boss?.dead || (boss && boss.hp <= 0));

    if (
      bossId &&
      bossId === previousBossId &&
      bossDead &&
      !previousBossDead
    ) {
      pulse("bossDown", { force: true });
      if (typeof window !== "undefined") {
        window.setTimeout(() => pulse("heavy", { force: true }), 190);
      }
    }

    if (bossId) {
      previousBossId = bossId;
      previousBossDead = bossDead;
    } else if (!state?.encounter?.bossEnabled) {
      previousBossId = null;
      previousBossDead = false;
    }
  }

  function tick() {
    if (stopped) return;
    const state = getState?.();
    if (state) {
      scanCombatText(state);
      scanDash(state);
      scanLevel(state);
      scanBoss(state);
    }
    if (typeof requestAnimationFrame === "function") {
      frameId = requestAnimationFrame(tick);
    }
  }

  if (typeof requestAnimationFrame === "function") {
    frameId = requestAnimationFrame(tick);
  }

  return {
    pulse,
    stop() {
      stopped = true;
      if (frameId && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(frameId);
      }
    },
  };
}

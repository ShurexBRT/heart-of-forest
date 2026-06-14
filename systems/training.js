import { distance } from "../core/math.js";

const TRAINING_DURATION = 20;

export function createTrainingState() {
  return {
    active: false,
    mode: "steady-target",
    timeLeft: 0,
    elapsed: 0,
    damage: 0,
    hits: 0,
    dodges: 0,
    patternHits: 0,
    patternTimer: 0,
    pattern: null,
    dummyIds: [],
    interactableId: null,
  };
}

export function startTrainingDrill(
  state,
  interactableId,
  x,
  y,
  mode = "steady-target"
) {
  if (state.training?.active) {
    return { started: false, reason: "A training drill is already running." };
  }

  const dummies =
    mode === "target-circle"
      ? [
          createTrainingDummy(`${interactableId}-left`, x - 64, y + 8),
          createTrainingDummy(`${interactableId}-center`, x, y - 38),
          createTrainingDummy(`${interactableId}-right`, x + 64, y + 8),
        ]
      : [createTrainingDummy(`${interactableId}-steady`, x, y)];
  state.training = {
    ...createTrainingState(),
    mode,
    active: true,
    timeLeft: TRAINING_DURATION,
    patternTimer: mode === "elite-pattern" ? 0.8 : 0,
    dummyIds: dummies.map((dummy) => dummy.id),
    interactableId,
  };
  state.enemies.push(...dummies);

  const interactable = state.arena.interactables.find((entry) => entry.id === interactableId);
  if (interactable) {
    interactable.disabled = true;
  }

  return { started: true, duration: TRAINING_DURATION };
}

export function recordTrainingDamage(state, target, amount) {
  if (!target?.trainingDummy || !state.training?.active) return false;
  state.training.damage += Math.max(0, amount);
  state.training.hits += 1;
  return true;
}

export function updateTrainingDrill(state, dt) {
  if (!state.training?.active) return null;

  if (state.training.mode === "elite-pattern") {
    updateElitePattern(state, dt);
  }

  state.training.elapsed = Math.min(
    TRAINING_DURATION,
    state.training.elapsed + Math.max(0, dt)
  );
  state.training.timeLeft = Math.max(0, TRAINING_DURATION - state.training.elapsed);
  if (state.training.timeLeft > 0) return null;

  const result = {
    damage: Math.round(state.training.damage),
    hits: state.training.hits,
    dps: Number((state.training.damage / Math.max(1, state.training.elapsed)).toFixed(1)),
    dodges: state.training.dodges || 0,
    patternHits: state.training.patternHits || 0,
  };

  const dummyIds = new Set(state.training.dummyIds || []);
  state.enemies = state.enemies.filter((enemy) => !dummyIds.has(enemy.id));
  const interactable = state.arena.interactables.find(
    (entry) => entry.id === state.training.interactableId
  );
  if (interactable) {
    interactable.disabled = false;
  }

  state.progression.trainingStats = state.progression.trainingStats || {
    bestDps: 0,
    bestDamage: 0,
    drillsCompleted: 0,
    bestDpsByMode: {},
  };
  state.progression.trainingStats.bestDps = Math.max(
    state.progression.trainingStats.bestDps,
    result.dps
  );
  state.progression.trainingStats.bestDamage = Math.max(
    state.progression.trainingStats.bestDamage,
    result.damage
  );
  state.progression.trainingStats.drillsCompleted += 1;
  state.progression.trainingStats.bestDpsByMode =
    state.progression.trainingStats.bestDpsByMode || {};
  state.progression.trainingStats.bestDpsByMode[state.training.mode] = Math.max(
    state.progression.trainingStats.bestDpsByMode[state.training.mode] || 0,
    result.dps
  );
  result.mode = state.training.mode;
  state.training = createTrainingState();
  return result;
}

export function getTrainingView(state) {
  const training = state.training || createTrainingState();
  const elapsed = Math.max(0.01, training.elapsed || 0);
  return {
    active: training.active,
    mode: training.mode,
    timeLeft: training.timeLeft,
    damage: Math.round(training.damage || 0),
    hits: training.hits || 0,
    dps: Number(((training.damage || 0) / elapsed).toFixed(1)),
    bestDps: Number(state.progression.trainingStats?.bestDps || 0),
    modeBestDps: Number(
      state.progression.trainingStats?.bestDpsByMode?.[training.mode] || 0
    ),
    dodges: training.dodges || 0,
    patternHits: training.patternHits || 0,
    pattern: training.pattern,
  };
}

function updateElitePattern(state, dt) {
  const training = state.training;
  if (training.pattern) {
    if (training.pattern.warning > 0) {
      training.pattern.warning = Math.max(0, training.pattern.warning - dt);
      if (training.pattern.warning === 0) {
        const hit =
          distance(
            state.player.x,
            state.player.y,
            training.pattern.x,
            training.pattern.y
          ) <= training.pattern.radius + state.player.radius;
        training.pattern.hit = hit;
        training.pattern.impact = 0.24;
        if (hit) {
          training.patternHits += 1;
        } else {
          training.dodges += 1;
        }
      }
      return;
    }

    training.pattern.impact = Math.max(0, training.pattern.impact - dt);
    if (training.pattern.impact === 0) {
      training.pattern = null;
      training.patternTimer = 1.1;
    }
    return;
  }

  training.patternTimer = Math.max(0, training.patternTimer - dt);
  if (training.patternTimer === 0) {
    training.pattern = {
      x: state.player.x,
      y: state.player.y,
      radius: 74,
      warning: 0.9,
      impact: 0,
      hit: false,
    };
  }
}

function createTrainingDummy(id, x, y) {
  return {
    id,
    type: "training_dummy",
    name: "Woven Target",
    trainingDummy: true,
    x,
    y,
    radius: 22,
    hp: 1000,
    maxHp: 1000,
    dead: false,
    isBoss: false,
    elite: false,
    hitFlash: 0,
    stun: 0,
    rooted: 0,
    bloom: 0,
    vx: 0,
    vy: 0,
    facing: "down",
    pose: "idle",
    state: "idle",
    animTime: 0,
    config: {
      sprite: "training_dummy",
      healthColor: "#d7c27b",
      rootMultiplier: 1,
    },
    update(dt) {
      this.animTime += dt * 5;
      this.hitFlash = Math.max(0, this.hitFlash - dt);
      this.stun = Math.max(0, this.stun - dt);
      this.rooted = Math.max(0, this.rooted - dt);
      this.bloom = Math.max(0, this.bloom - dt);
      this.vx = 0;
      this.vy = 0;
      this.state = "idle";
    },
  };
}

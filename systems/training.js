const TRAINING_DURATION = 20;

export function createTrainingState() {
  return {
    active: false,
    mode: "steady-target",
    timeLeft: 0,
    elapsed: 0,
    damage: 0,
    hits: 0,
    dummyId: null,
    interactableId: null,
  };
}

export function startTrainingDrill(state, interactableId, x, y) {
  if (state.training?.active) {
    return { started: false, reason: "A training drill is already running." };
  }

  const dummy = createTrainingDummy(x, y);
  state.training = {
    ...createTrainingState(),
    active: true,
    timeLeft: TRAINING_DURATION,
    dummyId: dummy.id,
    interactableId,
  };
  state.enemies.push(dummy);

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
  };

  state.enemies = state.enemies.filter((enemy) => enemy.id !== state.training.dummyId);
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
  state.training = createTrainingState();
  return result;
}

export function getTrainingView(state) {
  const training = state.training || createTrainingState();
  const elapsed = Math.max(0.01, training.elapsed || 0);
  return {
    active: training.active,
    timeLeft: training.timeLeft,
    damage: Math.round(training.damage || 0),
    hits: training.hits || 0,
    dps: Number(((training.damage || 0) / elapsed).toFixed(1)),
    bestDps: Number(state.progression.trainingStats?.bestDps || 0),
  };
}

function createTrainingDummy(x, y) {
  return {
    id: "training-grove-dummy",
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

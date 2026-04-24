import { startGameLoop } from "./core/gameLoop.js";
import { createInput, wasPressed } from "./core/input.js";
import { clamp } from "./core/math.js";
import { INITIAL_SCENE_ID, SCENES } from "./data/sceneNetwork.js";
import { Player } from "./entities/player.js";
import { renderGame } from "./rendering/renderer.js";
import {
  handlePlayerAbilities,
  resolveEnemyCrowding,
  updateCombatEffects,
} from "./systems/combat.js";
import { createEncounterState, updateEncounter } from "./systems/encounter.js";
import { updateParticles } from "./systems/particles.js";
import { createProgression, getPlayerBonuses } from "./systems/progression.js";
import { createArena } from "./world/arena.js";

const TRANSITION_DURATION = 0.3;
const EXIT_HOLD_TIME = 0.22;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });
const input = createInput(canvas);
const progression = createProgression();
const state = createState(progression);

function createState(currentProgression) {
  const currentSceneId = INITIAL_SCENE_ID;
  const currentEntryId = "default";
  const sceneProgress = {};
  const viewport = { width: window.innerWidth, height: window.innerHeight, dpr: 1 };
  const sceneState = buildSceneState(currentSceneId, currentEntryId, currentProgression, sceneProgress);

  return {
    ...sceneState,
    progression: currentProgression,
    currentSceneId,
    currentEntryId,
    sceneProgress,
    nearExit: null,
    exitCharge: 0,
    transition: createTransitionState(),
    time: 0,
    shake: 0,
    gameOver: false,
    areaCleared: false,
    viewport,
    camera: { x: 0, y: 0 },
    mouseWorld: { x: 0, y: 0 },
  };
}

function createTransitionState() {
  return {
    active: false,
    phase: null,
    timer: 0,
    duration: TRANSITION_DURATION,
    targetSceneId: null,
    targetEntryId: null,
    label: "",
  };
}

function buildSceneState(sceneId, entryId, currentProgression, sceneProgress) {
  const scene = SCENES[sceneId];
  const arena = createArena(scene);
  const spawn = arena.entrySpawns?.[entryId] || arena.entrySpawns?.default || arena.playerSpawn;
  const encounter = createEncounterState(arena, scene);

  if (sceneProgress[sceneId]?.cleared) {
    deactivateEncounter(encounter);
  }

  return {
    scene,
    arena,
    player: new Player(spawn, getPlayerBonuses(currentProgression)),
    enemies: [],
    boss: null,
    projectiles: [],
    hostileProjectiles: [],
    eruptions: [],
    roots: [],
    swings: [],
    particles: [],
    afterImages: [],
    encounter,
  };
}

function deactivateEncounter(encounter) {
  encounter.phase = "idle";
  encounter.waveIndex = encounter.totalWaves;
  encounter.totalWaves = 0;
  encounter.spawnQueue = [];
  encounter.spawnTimer = 0;
  encounter.phaseTimer = 0;
  encounter.zoneAlpha = 0;
  encounter.bannerText = "";
  encounter.bannerTimer = 0;
}

function applySceneState(sceneId, entryId) {
  const next = buildSceneState(sceneId, entryId, state.progression, state.sceneProgress);

  state.scene = next.scene;
  state.arena = next.arena;
  state.player = next.player;
  state.enemies = next.enemies;
  state.boss = next.boss;
  state.projectiles = next.projectiles;
  state.hostileProjectiles = next.hostileProjectiles;
  state.eruptions = next.eruptions;
  state.roots = next.roots;
  state.swings = next.swings;
  state.particles = next.particles;
  state.afterImages = next.afterImages;
  state.encounter = next.encounter;
  state.currentSceneId = sceneId;
  state.currentEntryId = entryId;
  state.nearExit = null;
  state.exitCharge = 0;
  state.shake = 0;
  state.gameOver = false;
  state.areaCleared = false;
  updateCamera(0);
  updateMouseWorld();
}

function reloadCurrentScene() {
  applySceneState(state.currentSceneId, state.currentEntryId || "default");
}

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.viewport.width = window.innerWidth;
  state.viewport.height = window.innerHeight;
  state.viewport.dpr = dpr;

  canvas.width = Math.floor(state.viewport.width * dpr);
  canvas.height = Math.floor(state.viewport.height * dpr);
  canvas.style.width = `${state.viewport.width}px`;
  canvas.style.height = `${state.viewport.height}px`;
  updateCamera(0);
}

function updateCamera(dt) {
  const { arena, player, viewport, camera } = state;
  const maxX = arena.width - viewport.width;
  const maxY = arena.height - viewport.height;
  const targetX = maxX > 0 ? clamp(player.x - viewport.width / 2, 0, maxX) : maxX / 2;
  const targetY = maxY > 0 ? clamp(player.y - viewport.height / 2, 0, maxY) : maxY / 2;

  if (dt <= 0) {
    camera.x = targetX;
    camera.y = targetY;
    return;
  }

  const follow = Math.min(1, 10 * dt);
  camera.x += (targetX - camera.x) * follow;
  camera.y += (targetY - camera.y) * follow;
}

function updateMouseWorld() {
  state.mouseWorld.x = input.mouse.x + state.camera.x;
  state.mouseWorld.y = input.mouse.y + state.camera.y;
}

function findExitForPlayer() {
  return state.arena.exits.find((exit) =>
    state.player.x >= exit.x &&
    state.player.x <= exit.x + exit.w &&
    state.player.y >= exit.y &&
    state.player.y <= exit.y + exit.h
  ) || null;
}

function startTransition(exit) {
  state.transition.active = true;
  state.transition.phase = "out";
  state.transition.timer = 0;
  state.transition.duration = TRANSITION_DURATION;
  state.transition.targetSceneId = exit.toSceneId;
  state.transition.targetEntryId = exit.targetEntryId;
  state.transition.label = exit.label;
  state.nearExit = exit;
}

function updateTransition(dt) {
  const transition = state.transition;
  if (!transition.active) return;

  if (transition.phase === "out") {
    transition.timer += dt;
    if (transition.timer >= transition.duration) {
      applySceneState(transition.targetSceneId, transition.targetEntryId);
      transition.phase = "in";
      transition.timer = transition.duration;
    }
    return;
  }

  if (transition.phase === "in") {
    transition.timer -= dt;
    if (transition.timer <= 0) {
      state.transition = createTransitionState();
    }
  }
}

function handleSceneCleared() {
  if (state.sceneProgress[state.currentSceneId]?.cleared) {
    state.areaCleared = false;
    return;
  }

  state.sceneProgress[state.currentSceneId] = { cleared: true };
  state.areaCleared = false;
  state.boss = null;
  state.enemies = [];
  state.hostileProjectiles = [];
  state.eruptions = [];
  deactivateEncounter(state.encounter);
  state.encounter.bannerText = state.scene.completionText;
  state.encounter.bannerTimer = 2;
}

function updateExitCharge(dt) {
  if (state.gameOver || state.transition.active) {
    state.nearExit = null;
    state.exitCharge = 0;
    return;
  }

  const exit = findExitForPlayer();
  state.nearExit = exit;

  if (!exit) {
    state.exitCharge = 0;
    return;
  }

  state.exitCharge = Math.min(1, state.exitCharge + dt / EXIT_HOLD_TIME);
  if (state.exitCharge >= 1) {
    startTransition(exit);
    state.exitCharge = 0;
  }
}

function update(dt) {
  state.time += dt;
  state.shake = Math.max(0, state.shake - 30 * dt);
  updateMouseWorld();

  if (state.gameOver && (wasPressed(input, "r", "KeyR") || wasPressed(input, "enter", "Enter"))) {
    reloadCurrentScene();
    return;
  }

  if (state.transition.active) {
    updateTransition(dt);
    updateCamera(dt);
    return;
  }

  state.player.tick(dt);

  if (!state.gameOver) {
    handlePlayerAbilities(state, input);
    state.player.move(dt, input, state);
    updateCombatEffects(state, dt);

    for (const enemy of state.enemies) {
      enemy.update(dt, state);
    }

    state.enemies = state.enemies.filter((enemy) => !enemy.dead);
    resolveEnemyCrowding(state);
  }

  updateEncounter(state, dt);

  if (state.areaCleared) {
    handleSceneCleared();
  }

  updateExitCharge(dt);
  updateParticles(state, dt);
  updateCamera(dt);
}

function render() {
  renderGame(ctx, state);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
updateMouseWorld();

window.__heartOfForestDebug = {
  getState: () => state,
  travelTo(sceneId, entryId = "default") {
    if (!SCENES[sceneId]) return false;
    applySceneState(sceneId, entryId);
    return true;
  },
  reloadCurrentScene,
};

startGameLoop({ update, render, input });

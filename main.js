import { startGameLoop } from "./core/gameLoop.js";
import { createInput, wasPressed } from "./core/input.js";
import { clamp } from "./core/math.js";
import {
  CAMERA_SCREEN_Y,
  getProjectedArenaBounds,
  projectWorld,
  screenToWorld,
} from "./core/projection.js";
import { INITIAL_SCENE_ID, SCENES } from "./data/sceneNetwork.js";
import { Player } from "./entities/player.js";
import { renderGame } from "./rendering/renderer.js";
import {
  handlePlayerAbilities,
  resolveEnemyCrowding,
  updateCombatEffects,
} from "./systems/combat.js";
import { createEncounterState, updateEncounter } from "./systems/encounter.js";
import { updateEnvironment } from "./systems/environment.js";
import { updateParticles } from "./systems/particles.js";
import { createProgression, getPlayerBonuses } from "./systems/progression.js";
import {
  advanceDialogue,
  beginInteraction,
  consumeStoryEvents,
  createStoryState,
  getActiveQuestEntries,
  getNearestInteractionTarget,
  refreshQuestStates,
  updateQuestAvailability,
  updateStoryRuntime,
} from "./systems/story.js";
import { createArena } from "./world/arena.js";

const TRANSITION_DURATION = 0.34;
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
    story: createStoryState(),
    storyEvents: [],
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
  const savedSceneState = sceneProgress[sceneId];

  if (savedSceneState?.objectStates) {
    for (const interactable of arena.interactables) {
      if (savedSceneState.objectStates[interactable.id]) {
        interactable.disabled = true;
      }
    }
  }

  const spawn = arena.entrySpawns?.[entryId] || arena.entrySpawns?.default || arena.playerSpawn;
  const encounter = createEncounterState(arena, scene);

  if (savedSceneState?.cleared) {
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

function ensureSceneProgress(sceneId) {
  if (!state.sceneProgress[sceneId]) {
    state.sceneProgress[sceneId] = {};
  }

  const sceneProgress = state.sceneProgress[sceneId];
  sceneProgress.objectStates = sceneProgress.objectStates || {};
  return sceneProgress;
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
  state.story.focus = null;
  state.story.prompt = "";
  state.story.dialogue = null;
  updateQuestAvailability(state);
  refreshQuestStates(state);
  updateCamera(0);
  updateMouseWorld();
}

function reloadCurrentScene() {
  const sceneProgress = ensureSceneProgress(state.currentSceneId);
  sceneProgress.cleared = false;
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
  const target = projectWorld(player.x, player.y);
  const bounds = getProjectedArenaBounds(arena);
  const anchorX = viewport.width / 2;
  const anchorY = viewport.height * CAMERA_SCREEN_Y;
  const padding = 110;

  const minX = bounds.minX + anchorX - padding;
  const maxX = bounds.maxX - (viewport.width - anchorX) + padding;
  const minY = bounds.minY + anchorY - padding;
  const maxY = bounds.maxY - (viewport.height - anchorY) + padding;

  const targetX = minX <= maxX ? clamp(target.x, minX, maxX) : (minX + maxX) / 2;
  const targetY = minY <= maxY ? clamp(target.y, minY, maxY) : (minY + maxY) / 2;

  if (dt <= 0) {
    camera.x = targetX;
    camera.y = targetY;
    return;
  }

  const follow = Math.min(1, 7.5 * dt);
  camera.x += (targetX - camera.x) * follow;
  camera.y += (targetY - camera.y) * follow;
}

function updateMouseWorld() {
  const projectedX = input.mouse.x + state.camera.x - state.viewport.width / 2;
  const projectedY = input.mouse.y + state.camera.y - state.viewport.height * CAMERA_SCREEN_Y;
  const world = screenToWorld(projectedX, projectedY);

  state.mouseWorld.x = clamp(world.x, 0, state.arena.width);
  state.mouseWorld.y = clamp(world.y, 0, state.arena.height);
}

function findExitForPlayer() {
  return (
    state.arena.exits.find(
      (exit) =>
        state.player.x >= exit.x &&
        state.player.x <= exit.x + exit.w &&
        state.player.y >= exit.y &&
        state.player.y <= exit.y + exit.h
    ) || null
  );
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
  const sceneProgress = ensureSceneProgress(state.currentSceneId);
  if (sceneProgress.cleared) {
    state.areaCleared = false;
    return;
  }

  sceneProgress.cleared = true;
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
  if (state.gameOver || state.transition.active || state.story.dialogue) {
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

function updateInteractionState() {
  updateQuestAvailability(state);
  refreshQuestStates(state);
  consumeStoryEvents(state);

  if (state.story.dialogue) {
    state.story.focus = null;
    state.story.prompt = "";
    return;
  }

  getNearestInteractionTarget(state);
}

function handleInteractionInput() {
  if (state.story.dialogue) {
    if (
      wasPressed(input, "e", "KeyE") ||
      wasPressed(input, "enter", "Enter") ||
      wasPressed(input, " ", "Space")
    ) {
      advanceDialogue(state);
      return true;
    }

    return true;
  }

  if (wasPressed(input, "e", "KeyE") && state.story.focus) {
    beginInteraction(state, state.story.focus);
    return true;
  }

  return false;
}

function update(dt) {
  state.time += dt;
  state.shake = Math.max(0, state.shake - 30 * dt);
  updateMouseWorld();
  updateStoryRuntime(state, dt);
  updateInteractionState();

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

  const interactionBlocked = handleInteractionInput();

  if (!state.gameOver && !interactionBlocked) {
    handlePlayerAbilities(state, input);
    state.player.move(dt, input, state);
    updateCombatEffects(state, dt);
    updateEnvironment(state, dt);

    for (const enemy of state.enemies) {
      enemy.update(dt, state);
    }

    state.enemies = state.enemies.filter((enemy) => !enemy.dead);
    resolveEnemyCrowding(state);
  }

  updateEncounter(state, dt);
  consumeStoryEvents(state);

  if (state.areaCleared) {
    handleSceneCleared();
  }

  updateExitCharge(dt);
  updateParticles(state, dt);
  updateCamera(dt);
}

function render() {
  state.activeQuests = getActiveQuestEntries(state.progression);
  renderGame(ctx, state);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
updateQuestAvailability(state);
refreshQuestStates(state);
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

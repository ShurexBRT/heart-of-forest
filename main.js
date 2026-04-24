import { startGameLoop } from "./core/gameLoop.js";
import { createInput, wasPressed } from "./core/input.js";
import { clamp } from "./core/math.js";
import { ITEM_DEFS } from "./data/gameData.js";
import { Player } from "./entities/player.js";
import { renderGame } from "./rendering/renderer.js";
import { renderWorld } from "./rendering/worldRenderer.js";
import {
  handlePlayerAbilities,
  resolveEnemyCrowding,
  updateCombatEffects,
} from "./systems/combat.js";
import { createEncounterState, updateEncounter } from "./systems/encounter.js";
import { updateParticles } from "./systems/particles.js";
import { awardRewards, createProgression, getPlayerBonuses, unlockTalent } from "./systems/progression.js";
import { acceptQuest, claimQuest, createQuestBoards, markPoiClearedForQuests } from "./systems/quests.js";
import { clearSnapshot, loadSnapshot, saveSnapshot } from "./systems/save.js";
import { createArena } from "./world/arena.js";
import {
  buildPoiRewards,
  createEncounterContext,
  createWorld,
  discoverRegion,
  getCurrentRegion,
  getSelectedPoi,
  isRegionReachable,
  markPoiCleared,
  restoreWorld,
  selectPoi,
  selectRegion,
  travelToRegion,
} from "./world/worldGen.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });
const input = createInput(canvas);
const state = buildState(loadSnapshot());

function buildState(snapshot = null, options = {}) {
  const viewport = options.viewport || {
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: 1,
  };
  const campaign = createCampaignData(snapshot, options.seed);

  return {
    mode: "world",
    seed: campaign.world.seed,
    world: campaign.world,
    progression: campaign.progression,
    ui: {
      panel: options.panel || "map",
      buttons: [],
      message: campaign.loadedFromSave ? "Saved expedition restored." : "",
      messageTimer: campaign.loadedFromSave ? 3.4 : 0,
    },
    arena: null,
    player: null,
    enemies: [],
    boss: null,
    projectiles: [],
    hostileProjectiles: [],
    eruptions: [],
    roots: [],
    swings: [],
    particles: [],
    afterImages: [],
    encounter: null,
    currentEncounterPoiId: null,
    time: 0,
    shake: 0,
    gameOver: false,
    areaCleared: false,
    viewport,
    camera: { x: 0, y: 0 },
    mouseWorld: { x: 0, y: 0 },
  };
}

function createCampaignData(snapshot, forcedSeed) {
  if (snapshot?.world && snapshot?.progression && !forcedSeed) {
    const world = restoreWorld(snapshot.world);
    normalizeWorld(world);

    return {
      world,
      progression: snapshot.progression,
      loadedFromSave: true,
    };
  }

  const world = createWorld(forcedSeed || createSeed());
  createQuestBoards(world);

  return {
    world,
    progression: createProgression(),
    loadedFromSave: false,
  };
}

function normalizeWorld(world) {
  world.stationPoiIds = world.stationPoiIds || world.poiOrder.filter((poiId) => world.pois[poiId].typeId === "station");
  world.currentRegionId = world.currentRegionId || world.regionOrder[0];
  world.selectedRegionId = world.selectedRegionId || world.currentRegionId;

  if (!world.quests?.length) {
    createQuestBoards(world);
  }

  if (!world.selectedPoiId || !world.pois[world.selectedPoiId]) {
    const selectedRegion = world.regions[world.selectedRegionId];
    world.selectedPoiId = selectedRegion.poiIds[0] || world.stationPoiIds[0] || null;
  }

  discoverRegion(world, world.currentRegionId);
}

function replaceState(nextState) {
  for (const key of Object.keys(nextState)) {
    state[key] = nextState[key];
  }

  resizeCanvas();
}

function createSeed() {
  const now = Date.now().toString(36);
  const random = Math.floor(Math.random() * 1679616).toString(36).padStart(4, "0");
  return `${now}-${random}`;
}

function setUiMessage(message, duration = 3.2) {
  state.ui.message = message;
  state.ui.messageTimer = duration;
}

function saveGame(showMessage = true) {
  const saved = saveSnapshot({
    world: state.world,
    progression: state.progression,
  });

  if (saved && showMessage) {
    setUiMessage("Expedition saved to browser storage.");
  } else if (!saved && showMessage) {
    setUiMessage("Save unavailable in this browser.", 3.8);
  }

  return saved;
}

function startNewWorld() {
  clearSnapshot();
  replaceState(buildState(null, {
    seed: createSeed(),
    viewport: state.viewport,
    panel: "map",
  }));
  setUiMessage(`New expedition rolled. Seed ${state.seed}.`, 4);
}

function clearEncounterState() {
  state.mode = "world";
  state.arena = null;
  state.player = null;
  state.enemies = [];
  state.boss = null;
  state.projectiles = [];
  state.hostileProjectiles = [];
  state.eruptions = [];
  state.roots = [];
  state.swings = [];
  state.particles = [];
  state.afterImages = [];
  state.encounter = null;
  state.currentEncounterPoiId = null;
  state.shake = 0;
  state.gameOver = false;
  state.areaCleared = false;
  state.camera.x = 0;
  state.camera.y = 0;
}

function enterEncounter(poiId) {
  const poi = state.world.pois[poiId];
  if (!poi || poi.cleared || !poi.combat) {
    setUiMessage("That site is not ready for combat.");
    return;
  }

  const context = createEncounterContext(state.world, poiId);
  const arena = createArena(context);
  const player = new Player(arena.playerSpawn, getPlayerBonuses(state.progression));

  state.mode = "encounter";
  state.arena = arena;
  state.player = player;
  state.enemies = [];
  state.boss = null;
  state.projectiles = [];
  state.hostileProjectiles = [];
  state.eruptions = [];
  state.roots = [];
  state.swings = [];
  state.particles = [];
  state.afterImages = [];
  state.encounter = createEncounterState(arena, {
    ...context,
    title: poi.name,
    seed: context.seed,
  });
  state.currentEncounterPoiId = poiId;
  state.gameOver = false;
  state.areaCleared = false;
  state.shake = 0;
  state.ui.buttons = [];
  updateCamera(0);
  updateMouseWorld();
}

function leaveEncounter(success) {
  const poiId = state.currentEncounterPoiId;
  const poi = poiId ? state.world.pois[poiId] : null;

  if (poi && success && !poi.cleared) {
    markPoiCleared(state.world, poiId);
    markPoiClearedForQuests(state.world, poiId);
    const rewards = buildPoiRewards(state.world, poiId);
    awardRewards(state.progression, rewards);
    setUiMessage(formatRewardMessage(poi.name, rewards), 4.2);
    saveGame(false);
  } else if (poi && !success) {
    setUiMessage(`Ayla retreats from ${poi.name}.`, 3.4);
  }

  if (poi) {
    travelToRegion(state.world, poi.regionId);
    selectPoi(state.world, poi.id);
  }

  clearEncounterState();
  state.ui.panel = poi?.typeId === "station" ? "station" : "map";
}

function formatRewardMessage(poiName, rewards) {
  const parts = Object.entries(rewards)
    .map(([key, amount]) => {
      if (key === "talentPoints") {
        return `Talent +${amount}`;
      }

      return `${ITEM_DEFS[key]?.name || key.replaceAll("_", " ")} +${amount}`;
    })
    .slice(0, 3);

  return `${poiName} reclaimed. ${parts.join(", ")}.`;
}

function handleWorldClick(x, y) {
  for (let index = state.ui.buttons.length - 1; index >= 0; index -= 1) {
    const button = state.ui.buttons[index];
    if (x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h) {
      triggerWorldAction(button);
      return true;
    }
  }

  return false;
}

function triggerWorldAction(button) {
  switch (button.action) {
    case "setPanel":
      state.ui.panel = button.value;
      break;
    case "selectRegion": {
      const region = state.world.regions[button.value];
      if (!region?.discovered) {
        setUiMessage("That region is still hidden in the wilds.");
        return;
      }
      selectRegion(state.world, button.value);
      break;
    }
    case "selectPoi":
      selectPoi(state.world, button.value);
      break;
    case "travelRegion":
      if (!isRegionReachable(state.world, button.value)) {
        setUiMessage("Travel route not secured yet.");
        return;
      }
      travelToRegion(state.world, button.value);
      setUiMessage(`Ayla travels to ${getCurrentRegion(state.world).name}.`, 2.8);
      saveGame(false);
      break;
    case "enterPoi":
      enterEncounter(button.value);
      break;
    case "acceptQuest":
      if (acceptQuest(state.world, button.value)) {
        state.ui.panel = "quests";
        setUiMessage("Quest accepted.");
        saveGame(false);
      }
      break;
    case "claimQuest": {
      const quest = claimQuest(state.world, state.progression, button.value);
      if (quest) {
        setUiMessage(`${quest.title} completed.`);
        saveGame(false);
      }
      break;
    }
    case "unlockTalent":
      if (unlockTalent(state.progression, button.value)) {
        setUiMessage("Talent attuned at the altar.");
        saveGame(false);
      }
      break;
    case "saveGame":
      saveGame(true);
      break;
    case "newWorld":
      startNewWorld();
      break;
    default:
      break;
  }
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

  if (state.mode === "encounter") {
    updateCamera(0);
  }
}

function updateCamera(dt) {
  if (!state.arena || !state.player) {
    state.camera.x = 0;
    state.camera.y = 0;
    return;
  }

  const maxX = state.arena.width - state.viewport.width;
  const maxY = state.arena.height - state.viewport.height;
  const targetX = maxX > 0 ? clamp(state.player.x - state.viewport.width / 2, 0, maxX) : maxX / 2;
  const targetY = maxY > 0 ? clamp(state.player.y - state.viewport.height / 2, 0, maxY) : maxY / 2;

  if (dt <= 0) {
    state.camera.x = targetX;
    state.camera.y = targetY;
    return;
  }

  const follow = Math.min(1, 12 * dt);
  state.camera.x += (targetX - state.camera.x) * follow;
  state.camera.y += (targetY - state.camera.y) * follow;
}

function updateMouseWorld() {
  state.mouseWorld.x = input.mouse.x + state.camera.x;
  state.mouseWorld.y = input.mouse.y + state.camera.y;
}

function updateWorldMode() {
  state.camera.x = 0;
  state.camera.y = 0;

  if (input.mouse.leftPressed) {
    handleWorldClick(input.mouse.x, input.mouse.y);
  }

  if (wasPressed(input, "enter", "Enter")) {
    const selectedPoi = getSelectedPoi(state.world);

    if (selectedPoi?.combat && !selectedPoi.cleared && selectedPoi.regionId === state.world.currentRegionId) {
      enterEncounter(selectedPoi.id);
    }
  }
}

function updateEncounterMode(dt) {
  updateMouseWorld();

  if (state.areaCleared && (wasPressed(input, "enter", "Enter") || wasPressed(input, "r", "KeyR"))) {
    leaveEncounter(true);
    return;
  }

  if (state.gameOver && (wasPressed(input, "enter", "Enter") || wasPressed(input, "r", "KeyR"))) {
    leaveEncounter(false);
    return;
  }

  state.player.tick(dt);

  if (!state.gameOver && !state.areaCleared) {
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
  updateParticles(state, dt);
  updateCamera(dt);
}

function update(dt) {
  state.time += dt;
  state.shake = Math.max(0, state.shake - 30 * dt);

  if (state.ui.messageTimer > 0) {
    state.ui.messageTimer = Math.max(0, state.ui.messageTimer - dt);
    if (state.ui.messageTimer === 0) {
      state.ui.message = "";
    }
  }

  if (state.mode === "world") {
    updateWorldMode();
  } else {
    updateEncounterMode(dt);
  }
}

function render() {
  if (state.mode === "world") {
    renderWorld(ctx, state);
    return;
  }

  renderGame(ctx, state);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
startGameLoop({ update, render, input });

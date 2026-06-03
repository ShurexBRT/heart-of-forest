import { startGameLoop } from "./core/gameLoop.js";
import { createInput, wasPressed } from "./core/input.js";
import { clamp, distance } from "./core/math.js";
import {
  CAMERA_SCREEN_Y,
  getProjectedArenaBounds,
  projectWorld,
  screenToWorld,
} from "./core/projection.js";
import { INITIAL_SCENE_ID, SCENES } from "./data/sceneNetwork.js";
import { TALENT_DEFS } from "./data/gameData.js";
import { Player } from "./entities/player.js";
import { renderGame } from "./rendering/renderer.js";
import { getUiHoverTarget } from "./ui/hud.js";
import {
  handlePlayerAbilities,
  markCombat,
  resolveEnemyCrowding,
  updateCombatEffects,
} from "./systems/combat.js";
import { createEncounterState, updateEncounter } from "./systems/encounter.js";
import { updateEnvironment } from "./systems/environment.js";
import { updateParticles } from "./systems/particles.js";
import {
  assignItemToActionSlot,
  getCurrency,
  createProgression,
  equipItem,
  getEquippedItems,
  getInventoryEntries,
  getPlayerBonuses,
  isActionSlotAssignable,
  unlockTalent,
  unequipItem,
  useActionSlot,
  useConsumable,
} from "./systems/progression.js";
import { loadSnapshot, saveSnapshot } from "./systems/save.js";
import {
  clearActiveService,
  getActiveService,
  getSellHintVisible,
  getServiceEntries,
  getStashUiEntries,
  performSelectedServiceAction,
  sellSelectedInventoryEntry,
  transferSelectedStashEntry,
} from "./systems/services.js";
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
const AUTO_SAVE_INTERVAL = 6;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });
const input = createInput(canvas);
const snapshot = loadSnapshot();
const progression = createProgression(snapshot?.progression);
const state = createState(progression, snapshot);
let fatalError = null;

function createState(currentProgression, saveData = null) {
  const currentSceneId =
    saveData?.currentSceneId && SCENES[saveData.currentSceneId]
      ? saveData.currentSceneId
      : INITIAL_SCENE_ID;
  const currentEntryId = saveData?.currentEntryId || "default";
  const sceneProgress = saveData?.sceneProgress || {};
  const viewport = { width: window.innerWidth, height: window.innerHeight, dpr: 1 };
  const sceneState = buildSceneState(
    currentSceneId,
    currentEntryId,
    currentProgression,
    sceneProgress,
    saveData?.playerVitals || null
  );

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
    combatTimer: 0,
    saveTimer: AUTO_SAVE_INTERVAL,
    ui: createUiState(saveData?.ui),
  };
}

function createUiState(saved = null) {
  return {
    questLogOpen: saved?.questLogOpen || false,
    menuOpen: saved?.menuOpen || false,
    activeTab: saved?.activeTab || "character",
    selectedInventoryIndex: saved?.selectedInventoryIndex || 0,
    selectedEquipmentIndex: saved?.selectedEquipmentIndex || 0,
    selectedTalentIndex: saved?.selectedTalentIndex || 0,
    selectedQuestIndex: saved?.selectedQuestIndex || 0,
    activeServiceId: null,
    activeServiceLabel: "",
    selectedServiceIndex: saved?.selectedServiceIndex || 0,
    selectedStashIndex: saved?.selectedStashIndex || 0,
    serviceSubpanel: saved?.serviceSubpanel || "stock",
    hoverTarget: null,
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

function buildSceneState(sceneId, entryId, currentProgression, sceneProgress, vitals = null) {
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

  const player = new Player(spawn, getPlayerBonuses(currentProgression));
  restorePlayerVitals(player, vitals);

  return {
    scene,
    arena,
    player,
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

function restorePlayerVitals(player, vitals) {
  if (!vitals) return;
  player.hp = clamp(vitals.hp ?? player.maxHp, 1, player.maxHp);
  player.spirit = clamp(vitals.spirit ?? player.maxSpirit, 0, player.maxSpirit);
}

function capturePlayerVitals(player) {
  return {
    hp: player.hp,
    spirit: player.spirit,
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

function applySceneState(sceneId, entryId, options = {}) {
  const vitals = options.restoreFull ? null : capturePlayerVitals(state.player);
  const next = buildSceneState(sceneId, entryId, state.progression, state.sceneProgress, vitals);

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
  state.combatTimer = 0;
  closePanels();
  updateQuestAvailability(state);
  refreshQuestStates(state);
  updateCamera(0);
  updateMouseWorld();
}

function reloadCurrentScene() {
  const sceneProgress = ensureSceneProgress(state.currentSceneId);
  sceneProgress.cleared = false;
  applySceneState(state.currentSceneId, state.currentEntryId || "default", { restoreFull: true });
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

function isExitUnlocked(exit) {
  return !exit?.requiresFlag || Boolean(state.progression.worldFlags?.[exit.requiresFlag]);
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
  if (state.gameOver || state.transition.active || state.story.dialogue || isUiOpen()) {
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

  if (!isExitUnlocked(exit)) {
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

  if (isUiOpen()) {
    return true;
  }

  if (wasPressed(input, "e", "KeyE") && state.story.focus) {
    beginInteraction(state, state.story.focus);
    return true;
  }

  return false;
}

function isUiOpen() {
  return state.ui.questLogOpen || state.ui.menuOpen;
}

function closePanels() {
  state.ui.questLogOpen = false;
  state.ui.menuOpen = false;
  clearActiveService(state);
}

function openMenu(tab) {
  state.ui.menuOpen = true;
  state.ui.questLogOpen = false;
  state.ui.activeTab = tab;
}

function toggleQuestLog() {
  state.ui.questLogOpen = !state.ui.questLogOpen;
  if (state.ui.questLogOpen) {
    state.ui.menuOpen = false;
    clearActiveService(state);
  }
}

function cycleMenuTab() {
  const order = state.ui.activeServiceId
    ? ["character", "inventory", "talents", "services"]
    : ["character", "inventory", "talents"];
  const current = order.indexOf(state.ui.activeTab);
  state.ui.activeTab = order[(current + 1) % order.length];
}

function moveSelection(delta, key) {
  const next = Math.max(0, (state.ui[key] || 0) + delta);
  state.ui[key] = next;
}

function clampSelection(key, max) {
  state.ui[key] = clamp(state.ui[key] || 0, 0, Math.max(0, max - 1));
}

function refreshPlayerFromProgression(preserveVitals = true) {
  state.player.refreshFromModifiers(getPlayerBonuses(state.progression), { preserveVitals });
}

function tryUseQuickItem(itemId) {
  const result = useConsumable(state.progression, itemId, state.player);
  if (!result.used) return false;
  showUseItemToast(result);
  return true;
}

function tryUseBoundActionSlot(slotIndex) {
  const result = useActionSlot(state.progression, slotIndex, state.player);
  if (!result.used) return false;
  showUseItemToast(result);
  return true;
}

function showUseItemToast(result) {
  if (!result?.used) return;
  if (result.healed > 0) {
    setToast(`${result.item.name} restored ${result.healed} HP`, 1.8);
    return;
  }

  if (result.restored > 0) {
    setToast(`${result.item.name} restored ${result.restored} Spirit`, 1.8);
    return;
  }

  if (result.buffApplied) {
    setToast(`${result.item.name} is now active`, 1.8);
  }
}

function activateInventoryEntry(entry) {
  if (!entry) return false;

  if (entry.category === "equipment") {
    if (equipItem(state.progression, entry.id)) {
      refreshPlayerFromProgression();
      setToast(`Equipped ${entry.name}`, 1.9);
    }
    return true;
  }

  if (entry.category === "consumable") {
    const result = useConsumable(state.progression, entry.id, state.player);
    if (result.used) {
      showUseItemToast(result);
    }
    return true;
  }

  return false;
}

function sellInventoryEntry(entry) {
  const result = sellSelectedInventoryEntry(state, entry);
  if (result.success) {
    setToast(result.text, 1.9);
    clampSelection("selectedInventoryIndex", getInventoryEntries(state.progression).length);
  } else if (getSellHintVisible(state)) {
    setToast(result.reason || "That item cannot be sold.", 1.8);
  }
  return getSellHintVisible(state);
}

function unequipSelectedEntry() {
  const equipped = getEquippedItems(state.progression);
  const slot = equipped[state.ui.selectedEquipmentIndex]?.slot;
  if (slot && unequipItem(state.progression, slot)) {
    refreshPlayerFromProgression();
    setToast(`Unequipped ${slot}`, 1.7);
  }
  return true;
}

function unlockSelectedTalent() {
  const talent = TALENT_DEFS[state.ui.selectedTalentIndex];
  if (talent && unlockTalent(state.progression, talent.id)) {
    refreshPlayerFromProgression();
    setToast(`Unlocked ${talent.name}`, 2);
  }
  return true;
}

function runSelectedServiceAction() {
  const result = performSelectedServiceAction(state);
  if (result.success) {
    refreshPlayerFromProgression();
    setToast(result.text, 2);
  } else if (result.reason) {
    setToast(result.reason, 1.8);
  }
  return true;
}

function transferSelectedStash() {
  const result = transferSelectedStashEntry(state);
  if (result.success) {
    setToast(result.text, 1.8);
    const refreshed = getStashUiEntries(state);
    clampSelection("selectedServiceIndex", refreshed.pack.length);
    clampSelection("selectedStashIndex", refreshed.stash.length);
  }
  return true;
}

function tryAssignSelectedInventoryToActionSlot(slotIndex, entries) {
  const entry = entries[state.ui.selectedInventoryIndex];
  if (!entry) return false;
  if (!isActionSlotAssignable(entry.id)) {
    setToast("Only usable items can be assigned to action slots", 1.8);
    return true;
  }

  const result = assignItemToActionSlot(state.progression, slotIndex, entry.id);
  if (!result.changed) return true;

  setToast(
    result.cleared
      ? `Cleared action slot ${slotIndex + 2}`
      : `${entry.name} assigned to slot ${slotIndex + 2}`,
    1.8
  );
  return true;
}

function assignInventoryEntryToActionSlot(slotIndex, entry) {
  if (!entry) return false;
  if (!isActionSlotAssignable(entry.id)) {
    setToast("Only usable items can be assigned to action slots", 1.8);
    return true;
  }

  const result = assignItemToActionSlot(state.progression, slotIndex, entry.id);
  if (!result.changed) return true;

  setToast(
    result.cleared
      ? `Cleared action slot ${slotIndex + 2}`
      : `${entry.name} assigned to slot ${slotIndex + 2}`,
    1.8
  );
  return true;
}

function handleMouseUiInput() {
  if (!input.mouse.leftPressed) {
    return false;
  }

  const target = getUiHoverTarget(state, input.mouse.x, input.mouse.y);
  if (!target?.action) {
    return false;
  }

  switch (target.action) {
    case "open-tab":
      openMenu(target.tab);
      return true;
    case "quest-select":
      state.ui.selectedQuestIndex = target.index;
      return true;
    case "inventory-select":
      state.ui.selectedInventoryIndex = target.index;
      return true;
    case "inventory-primary":
      state.ui.selectedInventoryIndex = target.index;
      return activateInventoryEntry(target.entry);
    case "inventory-sell":
      state.ui.selectedInventoryIndex = target.index;
      return sellInventoryEntry(target.entry);
    case "inventory-bind":
      state.ui.selectedInventoryIndex = target.index;
      return assignInventoryEntryToActionSlot(target.slotIndex, target.entry);
    case "equipment-select":
      state.ui.selectedEquipmentIndex = target.index;
      return true;
    case "equipment-unequip":
      state.ui.selectedEquipmentIndex = target.index;
      return unequipSelectedEntry();
    case "talent-select":
      state.ui.selectedTalentIndex = target.index;
      return true;
    case "talent-unlock":
      state.ui.selectedTalentIndex = target.index;
      return unlockSelectedTalent();
    case "service-select":
      if (target.subpanel) {
        state.ui.serviceSubpanel = target.subpanel;
      }
      if (target.subpanel === "stash") {
        state.ui.selectedStashIndex = target.index;
      } else {
        state.ui.selectedServiceIndex = target.index;
      }
      return true;
    case "service-activate":
      if (target.subpanel) {
        state.ui.serviceSubpanel = target.subpanel;
      }
      if (target.subpanel === "stash") {
        state.ui.selectedStashIndex = target.index;
        return transferSelectedStash();
      }
      state.ui.selectedServiceIndex = target.index;
      return runSelectedServiceAction();
    case "hud-action-slot":
      return tryUseBoundActionSlot(target.slotIndex);
    case "hud-quick-item":
      return tryUseQuickItem(target.itemId);
    default:
      return false;
  }
}

function handleMenuNavigation() {
  if (handleMouseUiInput()) {
    return true;
  }

  if (wasPressed(input, "tab", "Tab")) {
    cycleMenuTab();
    return true;
  }

  if (state.ui.activeTab === "inventory") {
    const entries = getInventoryEntries(state.progression);
    clampSelection("selectedInventoryIndex", entries.length);

    if (wasPressed(input, "arrowup", "ArrowUp") || wasPressed(input, "w", "KeyW")) {
      moveSelection(-1, "selectedInventoryIndex");
      clampSelection("selectedInventoryIndex", entries.length);
      return true;
    }

    if (wasPressed(input, "arrowdown", "ArrowDown") || wasPressed(input, "s", "KeyS")) {
      moveSelection(1, "selectedInventoryIndex");
      clampSelection("selectedInventoryIndex", entries.length);
      return true;
    }

    if (wasPressed(input, "2", "Digit2")) {
      return tryAssignSelectedInventoryToActionSlot(0, entries);
    }

    if (wasPressed(input, "3", "Digit3")) {
      return tryAssignSelectedInventoryToActionSlot(1, entries);
    }

    if (wasPressed(input, "4", "Digit4")) {
      return tryAssignSelectedInventoryToActionSlot(2, entries);
    }

    if ((wasPressed(input, "enter", "Enter") || wasPressed(input, " ", "Space")) && entries.length > 0) {
      const entry = entries[state.ui.selectedInventoryIndex];
      if (!entry) return true;
      return activateInventoryEntry(entry);
    }

    if (wasPressed(input, "x", "KeyX")) {
      const entry = entries[state.ui.selectedInventoryIndex];
      return sellInventoryEntry(entry);
    }
  }

  if (state.ui.activeTab === "character") {
    const equipped = getEquippedItems(state.progression);
    clampSelection("selectedEquipmentIndex", equipped.length);

    if (wasPressed(input, "arrowup", "ArrowUp") || wasPressed(input, "w", "KeyW")) {
      moveSelection(-1, "selectedEquipmentIndex");
      clampSelection("selectedEquipmentIndex", equipped.length);
      return true;
    }

    if (wasPressed(input, "arrowdown", "ArrowDown") || wasPressed(input, "s", "KeyS")) {
      moveSelection(1, "selectedEquipmentIndex");
      clampSelection("selectedEquipmentIndex", equipped.length);
      return true;
    }

    if (
      wasPressed(input, "backspace", "Backspace") ||
      wasPressed(input, "delete", "Delete") ||
      wasPressed(input, "u", "KeyU")
    ) {
      return unequipSelectedEntry();
    }
  }

  if (state.ui.activeTab === "talents") {
    clampSelection("selectedTalentIndex", TALENT_DEFS.length);

    if (wasPressed(input, "arrowup", "ArrowUp") || wasPressed(input, "w", "KeyW")) {
      moveSelection(-1, "selectedTalentIndex");
      clampSelection("selectedTalentIndex", TALENT_DEFS.length);
      return true;
    }

    if (wasPressed(input, "arrowdown", "ArrowDown") || wasPressed(input, "s", "KeyS")) {
      moveSelection(1, "selectedTalentIndex");
      clampSelection("selectedTalentIndex", TALENT_DEFS.length);
      return true;
    }

    if (wasPressed(input, "enter", "Enter") || wasPressed(input, " ", "Space")) {
      return unlockSelectedTalent();
    }
  }

  if (state.ui.activeTab === "services") {
    const service = getActiveService(state);
    if (!service) return false;

    if (service.kind === "stash") {
      const lists = getStashUiEntries(state);

      if (wasPressed(input, "arrowleft", "ArrowLeft") || wasPressed(input, "a", "KeyA")) {
        state.ui.serviceSubpanel = "pack";
        clampSelection("selectedServiceIndex", lists.pack.length);
        return true;
      }

      if (wasPressed(input, "arrowright", "ArrowRight") || wasPressed(input, "d", "KeyD")) {
        state.ui.serviceSubpanel = "stash";
        clampSelection("selectedStashIndex", lists.stash.length);
        return true;
      }

      if (state.ui.serviceSubpanel === "pack") {
        if (wasPressed(input, "arrowup", "ArrowUp") || wasPressed(input, "w", "KeyW")) {
          moveSelection(-1, "selectedServiceIndex");
          clampSelection("selectedServiceIndex", lists.pack.length);
          return true;
        }

        if (wasPressed(input, "arrowdown", "ArrowDown") || wasPressed(input, "s", "KeyS")) {
          moveSelection(1, "selectedServiceIndex");
          clampSelection("selectedServiceIndex", lists.pack.length);
          return true;
        }
      } else {
        if (wasPressed(input, "arrowup", "ArrowUp") || wasPressed(input, "w", "KeyW")) {
          moveSelection(-1, "selectedStashIndex");
          clampSelection("selectedStashIndex", lists.stash.length);
          return true;
        }

        if (wasPressed(input, "arrowdown", "ArrowDown") || wasPressed(input, "s", "KeyS")) {
          moveSelection(1, "selectedStashIndex");
          clampSelection("selectedStashIndex", lists.stash.length);
          return true;
        }
      }

      if (wasPressed(input, "enter", "Enter") || wasPressed(input, " ", "Space")) {
        return transferSelectedStash();
      }
    } else {
      const entries = getServiceEntries(state);
      clampSelection("selectedServiceIndex", entries.length);

      if (wasPressed(input, "arrowup", "ArrowUp") || wasPressed(input, "w", "KeyW")) {
        moveSelection(-1, "selectedServiceIndex");
        clampSelection("selectedServiceIndex", entries.length);
        return true;
      }

      if (wasPressed(input, "arrowdown", "ArrowDown") || wasPressed(input, "s", "KeyS")) {
        moveSelection(1, "selectedServiceIndex");
        clampSelection("selectedServiceIndex", entries.length);
        return true;
      }

      if (wasPressed(input, "enter", "Enter") || wasPressed(input, " ", "Space")) {
        return runSelectedServiceAction();
      }
    }

    return true;
  }

  return false;
}

function handleUiInput() {
  if (state.story.dialogue) {
    return false;
  }

  if ((state.ui.questLogOpen || (!state.ui.menuOpen && !state.ui.questLogOpen)) && handleMouseUiInput()) {
    return true;
  }

  if (wasPressed(input, "escape", "Escape")) {
    if (isUiOpen()) {
      closePanels();
      return true;
    }
  }

  if (wasPressed(input, "q", "KeyQ")) {
    toggleQuestLog();
    return true;
  }

  if (wasPressed(input, "c", "KeyC")) {
    openMenu(state.ui.menuOpen && state.ui.activeTab === "character" ? "character" : "character");
    return true;
  }

  if (wasPressed(input, "i", "KeyI")) {
    openMenu("inventory");
    return true;
  }

  if (wasPressed(input, "t", "KeyT")) {
    openMenu("talents");
    return true;
  }

  if (wasPressed(input, "5", "Digit5")) {
    return tryUseQuickItem("health_potion");
  }

  if (wasPressed(input, "6", "Digit6")) {
    return tryUseQuickItem("spirit_tonic");
  }

  if (!isUiOpen()) {
    if (wasPressed(input, "2", "Digit2")) {
      return tryUseBoundActionSlot(0);
    }

    if (wasPressed(input, "3", "Digit3")) {
      return tryUseBoundActionSlot(1);
    }

    if (wasPressed(input, "4", "Digit4")) {
      return tryUseBoundActionSlot(2);
    }
  }

  if (state.ui.menuOpen) {
    return handleMenuNavigation();
  }

  if (state.ui.questLogOpen) {
    const quests = getActiveQuestEntries(state.progression);
    clampSelection("selectedQuestIndex", quests.length);
    if (wasPressed(input, "arrowup", "ArrowUp") || wasPressed(input, "w", "KeyW")) {
      moveSelection(-1, "selectedQuestIndex");
      clampSelection("selectedQuestIndex", quests.length);
      return true;
    }

    if (wasPressed(input, "arrowdown", "ArrowDown") || wasPressed(input, "s", "KeyS")) {
      moveSelection(1, "selectedQuestIndex");
      clampSelection("selectedQuestIndex", quests.length);
      return true;
    }

    return true;
  }

  return false;
}

function updateCombatPresence(dt) {
  state.combatTimer = Math.max(0, state.combatTimer - dt);

  const nearbyEnemy = state.enemies.some(
    (enemy) => !enemy.dead && distance(enemy.x, enemy.y, state.player.x, state.player.y) < 290
  );
  const activeBoss = Boolean(state.boss && !state.boss.dead);

  if (nearbyEnemy || activeBoss || state.hostileProjectiles.length > 0 || state.eruptions.length > 0) {
    markCombat(state, 1.2);
  }

  if (state.combatTimer <= 0 && !state.gameOver && state.player.hp < state.player.maxHp) {
    state.player.hp = Math.min(
      state.player.maxHp,
      state.player.hp + state.player.outOfCombatRegen * dt
    );
  }
}

function buildSnapshot() {
  return {
    progression: state.progression,
    sceneProgress: state.sceneProgress,
    currentSceneId: state.currentSceneId,
    currentEntryId: state.currentEntryId,
    playerVitals: capturePlayerVitals(state.player),
    ui: {
      questLogOpen: false,
      menuOpen: false,
      activeTab: state.ui.activeTab,
      selectedInventoryIndex: state.ui.selectedInventoryIndex,
      selectedEquipmentIndex: state.ui.selectedEquipmentIndex,
      selectedTalentIndex: state.ui.selectedTalentIndex,
      selectedQuestIndex: state.ui.selectedQuestIndex,
      selectedServiceIndex: state.ui.selectedServiceIndex,
      selectedStashIndex: state.ui.selectedStashIndex,
      serviceSubpanel: state.ui.serviceSubpanel,
    },
  };
}

function persistState() {
  saveSnapshot(buildSnapshot());
}

function updateAutosave(dt) {
  state.saveTimer -= dt;
  if (state.saveTimer > 0) return;
  persistState();
  state.saveTimer = AUTO_SAVE_INTERVAL;
}

function setToast(text, duration = 2) {
  state.story.toastText = text;
  state.story.toastTimer = duration;
}

function update(dt) {
  if (fatalError) {
    return;
  }

  try {
    state.time += dt;
    state.shake = Math.max(0, state.shake - 30 * dt);
    updateMouseWorld();
    updateStoryRuntime(state, dt);
    updateInteractionState();
    updateAutosave(dt);

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

    const uiConsumed = handleUiInput();
    const interactionBlocked = handleInteractionInput();
    const gameplayBlocked = uiConsumed || interactionBlocked || isUiOpen();

    if (!state.gameOver && !gameplayBlocked) {
      handlePlayerAbilities(state, input);
      state.player.move(dt, input, state);
      updateCombatEffects(state, dt);
      updateEnvironment(state, dt);

      for (const enemy of state.enemies) {
        enemy.update(dt, state);
      }

      state.enemies = state.enemies.filter((enemy) => !enemy.dead);
      resolveEnemyCrowding(state);
      updateEncounter(state, dt);
      consumeStoryEvents(state);
    }

    updateCombatPresence(dt);

    if (state.areaCleared) {
      handleSceneCleared();
    }

    updateExitCharge(dt);
    updateParticles(state, dt);
    updateCamera(dt);
  } catch (error) {
    fatalError = error;
    console.error(error);
  }
}

function render() {
  if (fatalError) {
    window.__heartOfForestFatalError = String(fatalError?.stack || fatalError?.message || fatalError);
    drawFatalErrorOverlay(fatalError);
    return;
  }

  try {
    state.activeQuests = getActiveQuestEntries(state.progression);
    state.ui.hoverTarget = getUiHoverTarget(state, input.mouse.x, input.mouse.y);
    renderGame(ctx, state);
  } catch (error) {
    fatalError = error;
    window.__heartOfForestFatalError = String(error?.stack || error?.message || error);
    console.error(error);
    drawFatalErrorOverlay(error);
  }
}

function drawFatalErrorOverlay(error) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = "#12090a";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = "#ffd7d0";
  ctx.font = "700 20px Segoe UI";
  ctx.fillText("Heart of Forest Render Error", 32, 48);
  ctx.font = "14px Consolas, monospace";
  const lines = String(error?.stack || error?.message || error)
    .split("\n")
    .slice(0, 12);
  lines.forEach((line, index) => {
    ctx.fillText(line.slice(0, 150), 32, 88 + index * 20);
  });
}

window.addEventListener("error", (event) => {
  fatalError = event.error || new Error(event.message || "Unknown runtime error");
  window.__heartOfForestFatalError = String(fatalError?.stack || fatalError?.message || fatalError);
  console.error(fatalError);
});

window.addEventListener("resize", resizeCanvas);
window.addEventListener("beforeunload", persistState);

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
  save: persistState,
  reloadCurrentScene,
};

startGameLoop({ update, render, input });

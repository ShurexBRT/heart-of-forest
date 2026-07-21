import { startGameLoop } from "./core/gameLoop.js";
import { GAME_MODES, isFrontendMode } from "./core/gameMode.js";
import { createInput, wasPressed } from "./core/input.js";
import { clamp, distance } from "./core/math.js";
import {
  CAMERA_SCREEN_Y,
  getProjectedArenaBounds,
  projectWorld,
  screenToWorld,
} from "./core/projection.js";
import { INITIAL_SCENE_ID, SCENES } from "./data/sceneNetwork.js";
import { ITEM_DEFS, TALENT_DEFS } from "./data/gameData.js";
import { Player } from "./entities/player.js";
import { renderGame } from "./rendering/renderer.js";
import { getUiHoverTarget } from "./ui/hud.js";
import {
  applyAudioSettings,
  createAudioState,
  ensureAudioStarted,
  queueAudio,
  updateAudio,
} from "./systems/audio.js";
import {
  createClock,
  serializeClock,
  setClockTime,
  startNextDay,
  updateClock,
} from "./systems/clock.js";
import {
  handlePlayerAbilities,
  markCombat,
  resolveEnemyCrowding,
  updateCombatEffects,
} from "./systems/combat.js";
import { createEncounterState, updateEncounter } from "./systems/encounter.js";
import { updateEnvironment } from "./systems/environment.js";
import {
  advanceFarmPlots,
  getMoonleafSleepGuidance,
  interactWithFarmPlot,
  syncFarmInteractables,
} from "./systems/farming.js";
import { updateParticles } from "./systems/particles.js";
import {
  assignItemToActionSlot,
  activateLoadout,
  getCurrency,
  createProgression,
  equipItem,
  getEquippedItems,
  getInventoryEntries,
  getPlayerBonuses,
  isActionSlotAssignable,
  saveLoadout,
  toggleItemLock,
  unlockTalent,
  unequipItem,
  useActionSlot,
  useConsumable,
} from "./systems/progression.js";
import { deleteSave, loadSave, loadSettings, saveGame, saveSettings } from "./systems/save.js";
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
  activateQuestPanelSelection,
  advanceDialogue,
  beginInteraction,
  closeQuestPanel,
  consumeStoryEvents,
  createStoryState,
  getActiveQuestEntries,
  getJournalQuestEntries,
  getNearestInteractionTarget,
  getHoveredInteractionTarget,
  moveQuestPanelSelection,
  refreshQuestStates,
  shiftQuestPanelFocus,
  updateQuestAvailability,
  updateStoryRuntime,
} from "./systems/story.js";
import {
  awardCorruptionEchoRewards,
  markCorruptionEchoCompleted,
  markRegionSceneCleared,
  shouldStartCorruptionEcho,
} from "./systems/regions.js";
import { syncCampaignProgress } from "./systems/campaign.js";
import { getBestiaryEntries } from "./systems/bestiary.js";
import {
  createTrainingState,
  startTrainingDrill,
  updateTrainingDrill,
} from "./systems/training.js";
import {
  getCampaignNavigation,
  getRegionJournalView,
} from "./systems/navigation.js";
import { getSecondSpringBoardView } from "./systems/postgame.js";
import {
  createFrontendState,
  getFrontendEntries,
  getFrontendHoverTarget,
  getSelectedFrontendAction,
  moveFrontendSelection,
  renderFrontendScreen,
  syncFrontendSaveState,
} from "./ui/startScreen.js";
import { createArena } from "./world/arena.js";

const TRANSITION_DURATION = 0.34;
const EXIT_HOLD_TIME = 0.38;
const EXIT_COMBAT_HOLD_TIME = 0.9;
const INVENTORY_FILTER_ORDER = ["all", "equipment", "consumable", "material", "usable"];
const INVENTORY_SORT_ORDER = ["name", "rarity", "value", "slot"];
const SHOP_FILTER_ORDER = ["all", "equipment", "consumable", "rare", "epic"];
const SHOP_SORT_ORDER = ["name", "rarity", "price", "recent"];

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });
const input = createInput(canvas);
const saveRecord = loadSave();
const snapshot = saveRecord?.runtimeSnapshot || null;
const settings = loadSettings();
const debugBoot = readDebugBootConfig();
const debugSceneCleared = [
  "ember-return",
  "ember",
  "frost-return",
  "frost",
  "scarroot-return",
  "scarroot",
  "scarroot-side",
  "rootlight-archive",
  "rootlight-return",
  "postgame-echo",
].includes(debugBoot.progress);
const bootSnapshot =
  debugBoot.sceneId && SCENES[debugBoot.sceneId]
    ? {
        ...(snapshot || {}),
        currentSceneId: debugBoot.sceneId,
        currentEntryId: "default",
        sceneProgress: debugSceneCleared
          ? {
              ...(snapshot?.sceneProgress || {}),
              [debugBoot.sceneId]: {
                ...(snapshot?.sceneProgress?.[debugBoot.sceneId] || {}),
                cleared: true,
              },
            }
          : snapshot?.sceneProgress,
      }
    : snapshot;
const progression = createProgression(snapshot?.progression);
applyDebugProgression(progression, debugBoot);
let state = createState(progression, bootSnapshot, {
  mode: debugBoot.mode || (debugBoot.overlay ? GAME_MODES.PLAYING : GAME_MODES.START_MENU),
  settings,
});
applyDebugBootState(state, debugBoot);
syncFrontendSaveState(state.frontend, saveRecord);
applyAudioSettings(state.audio, state.settings);
let fatalError = null;
const unlockAudioFromGesture = () => ensureAudioStarted(state.audio);
window.addEventListener("pointerdown", unlockAudioFromGesture);
window.addEventListener("keydown", unlockAudioFromGesture);

function createState(currentProgression, saveData = null, runtime = {}) {
  const currentSceneId =
    saveData?.currentSceneId && SCENES[saveData.currentSceneId]
      ? saveData.currentSceneId
      : INITIAL_SCENE_ID;
  const currentEntryId = saveData?.currentEntryId || "default";
  const sceneProgress = saveData?.sceneProgress || {};
  syncCampaignProgress(currentProgression, sceneProgress);
  const viewport = runtime.viewport
    ? { ...runtime.viewport }
    : { width: window.innerWidth, height: window.innerHeight, dpr: 1 };
  const sceneState = buildSceneState(
    currentSceneId,
    currentEntryId,
    currentProgression,
    sceneProgress,
    saveData?.playerVitals || null,
    saveData?.clock?.day || 1
  );

  return {
    ...sceneState,
    progression: currentProgression,
    currentSceneId,
    currentEntryId,
    sceneProgress,
    story: createStoryState(),
    storyEvents: [],
    clock: createClock(saveData?.clock),
    nearExit: null,
    exitCharge: 0,
    transition: createTransitionState(),
    time: 0,
    shake: 0,
    hitStop: 0,
    combatText: [],
    gameOver: false,
    areaCleared: false,
    viewport,
    camera: { x: 0, y: 0 },
    mouseWorld: { x: 0, y: 0 },
    combatTimer: 0,
    training: createTrainingState(),
    pendingArenaRefresh: false,
    ui: createUiState(saveData?.ui),
    audio: runtime.audio || createAudioState(),
    settings: runtime.settings || settings,
    mode: runtime.mode || GAME_MODES.PLAYING,
    frontend: runtime.frontend || createFrontendState(),
    debugCollision: Boolean(runtime.debugCollision),
  };
}

function createUiState(saved = null) {
  return {
    questLogOpen: saved?.questLogOpen || false,
    menuOpen: saved?.menuOpen || false,
    worldMapOpen: saved?.worldMapOpen || false,
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
    inventoryFilter: saved?.inventoryFilter || "all",
    inventorySort: saved?.inventorySort || "name",
    shopFilter: saved?.shopFilter || "all",
    shopSort: saved?.shopSort || "name",
    hoverTarget: null,
  };
}

function createTransitionState() {
  return {
    active: false,
    kind: "travel",
    phase: null,
    timer: 0,
    duration: TRANSITION_DURATION,
    targetSceneId: null,
    targetEntryId: null,
    label: "",
    title: "",
    subtitle: "",
  };
}

function readDebugBootConfig() {
  if (typeof window === "undefined") {
    return { mode: null, forceGameOver: false };
  }

  const params = new URLSearchParams(window.location.search);
  const modeKey = params.get("debugMenu");
  const map = {
    title: GAME_MODES.START_MENU,
    options: GAME_MODES.OPTIONS,
    pause: GAME_MODES.PAUSED,
    paused: GAME_MODES.PAUSED,
    gameover: GAME_MODES.GAME_OVER,
  };

  return {
    mode: map[modeKey?.toLowerCase?.()] || null,
    forceGameOver: modeKey?.toLowerCase?.() === "gameover",
    overlay: params.get("debugUi")?.toLowerCase?.() || null,
    questNpc: params.get("debugNpc")?.toLowerCase?.() || null,
    progress: params.get("debugProgress")?.toLowerCase?.() || null,
    sceneId: params.get("debugScene")?.toLowerCase?.() || null,
    collision: params.get("debugCollision") === "1",
  };
}

function applyDebugProgression(nextProgression, debugConfig) {
  const debugProgress = debugConfig?.progress;
  if (
    ![
      "onboarding-awake",
      "onboarding-watered",
      "onboarding-brew",
      "heartwood",
      "stillwater-active",
      "stillwater",
      "ember-active",
      "ember-return",
      "ember",
      "frost-active",
      "frost-return",
      "frost",
      "scarroot-active",
      "scarroot-return",
      "scarroot",
      "scarroot-side",
      "rootlight-active",
      "rootlight-archive",
      "rootlight-return",
      "rootlight",
      "second-spring",
      "postgame-echo",
    ].includes(debugProgress)
  ) {
    return;
  }
  const rootlightDebugStates = [
    "rootlight-active",
    "rootlight-archive",
    "rootlight-return",
    "rootlight",
    "second-spring",
    "postgame-echo",
  ];
  if (rootlightDebugStates.includes(debugProgress)) {
    const completedQuestIds = [
      "wake_hearthroot",
      "first_moonleaf",
      "thorn_at_gate",
      "brew_before_blood",
      "first_rootwarden",
      "bogbound_rot",
      "tidebound_threshold",
      "chapel_of_tides",
      "stillwater_homecoming",
      "ember_totems",
      "cinder_warden",
      "ember_homecoming",
      "lost_scout",
      "veil_seraph",
      "frost_homecoming",
      "blight_watch",
      "elder_hollow",
      "scarroot_homecoming",
    ];
    for (const questId of completedQuestIds) {
      nextProgression.questStates[questId] = "done";
    }
    nextProgression.journal = [
      ...new Set([...(nextProgression.journal || []), ...completedQuestIds]),
    ];
    Object.assign(nextProgression.worldFlags, {
      hearthroot_awake: true,
      heartwood_first_harvest: true,
      heartwood_ruins_open: true,
      heartwood_restored: true,
      marsh_rot_purged: true,
      chapel_of_tides_open: true,
      chapel_of_tides_cleansed: true,
      stillwater_restored: true,
      ember_pass_reopened: true,
      cinder_warden_released: true,
      ember_restored: true,
      ridge_signal_recovered: true,
      veil_seraph_released: true,
      frost_restored: true,
      waystone_network_restored: true,
      court_approach_secured: true,
      elder_hollow_broken: true,
      scarroot_restored: true,
      signature_rite_unlocked: true,
    });
    Object.assign(nextProgression.regionProgress, {
      ember: { bossDefeated: true },
      frost: { bossDefeated: true },
      scarroot: { bossDefeated: true },
    });
    Object.assign(nextProgression.questCounters, {
      hearthrootAwakened: 1,
      moonleafPlanted: 1,
      moonleafWatered: 1,
      moonleafGrown: 1,
      moonleafHarvested: 1,
      gateThreatsDefeated: 2,
      barkskinBrewed: 1,
      rootwardenDefeated: 1,
      rootsCleansed: 2,
      tideSealsRecovered: 2,
      tideBraziersLit: 2,
      bogMatronDefeated: 1,
      tideMemoryRecovered: 1,
      totemsActivated: 3,
      cinderWardenDefeated: 1,
      forgeEmberRecovered: 1,
      scoutFound: 1,
      veilSeraphDefeated: 1,
      seraphMessageRecovered: 1,
      blightEffigiesBroken: 2,
      elderHollowDefeated: 1,
      firstKeeperMemoryRecovered: 1,
      enemy_relic_sentinel_defeated: 3,
      enemy_starbound_archer_defeated: 3,
    });
    nextProgression.unlockedRecipes.starward_draught = true;

    if (debugProgress === "rootlight-active") {
      nextProgression.questStates.pilgrims_lantern = "active";
      return;
    }

    nextProgression.questStates.pilgrims_lantern = "done";
    nextProgression.questCounters.heartBloomsGathered = 2;
    nextProgression.questCounters.starSealsRecovered = 2;
    nextProgression.worldFlags.starfall_sanctum_open = true;
    if (debugProgress === "rootlight-archive") {
      nextProgression.questStates.starfall_sanctum = "active";
      return;
    }

    nextProgression.questStates.starfall_sanctum = "done";
    Object.assign(nextProgression.questCounters, {
      starfallTruthRecovered: 1,
      starBraziersLit: 2,
      starwokenSentinelDefeated: 1,
    });
    Object.assign(nextProgression.worldFlags, {
      starfall_truth_recovered: true,
      starfall_sanctum_cleansed: true,
    });
    nextProgression.regionProgress.rootlight = { bossDefeated: true };
    if (debugProgress === "rootlight-return") {
      nextProgression.questStates.the_sixth_answer = "inactive";
      return;
    }

    nextProgression.questCounters.starwokenEchoRecovered = 1;
    nextProgression.questStates.the_sixth_answer = "done";
    nextProgression.questStates.second_spring =
      ["second-spring", "postgame-echo"].includes(debugProgress)
        ? "done"
        : "active";
    Object.assign(nextProgression.worldFlags, {
      rootlight_harmonized: true,
      epilogue_ready: true,
    });
    if (["second-spring", "postgame-echo"].includes(debugProgress)) {
      nextProgression.questCounters.heartseedPlanted = 1;
      nextProgression.worldFlags.rootlight_restored = true;
      nextProgression.worldFlags.second_spring_started = true;
    } else {
      nextProgression.inventory.heartseed = Math.max(
        1,
        nextProgression.inventory.heartseed || 0
      );
    }
    return;
  }
  if (
    ["onboarding-awake", "onboarding-watered", "onboarding-brew"].includes(
      debugProgress
    )
  ) {
    nextProgression.questStates.wake_hearthroot = "done";
    nextProgression.questCounters.hearthrootAwakened = 1;
    nextProgression.worldFlags.hearthroot_awake = true;
    nextProgression.journal = [
      ...new Set([...(nextProgression.journal || []), "wake_hearthroot"]),
    ];
    nextProgression.inventory.moonleaf_seed = Math.max(
      2,
      nextProgression.inventory.moonleaf_seed || 0
    );
    if (debugProgress === "onboarding-brew") {
      Object.assign(nextProgression.questStates, {
        first_moonleaf: "done",
        thorn_at_gate: "done",
        brew_before_blood: "active",
      });
      Object.assign(nextProgression.questCounters, {
        moonleafPlanted: 1,
        moonleafWatered: 1,
        moonleafGrown: 1,
        moonleafHarvested: 1,
        gateThreatsDefeated: 2,
      });
      nextProgression.worldFlags.heartwood_first_harvest = true;
      nextProgression.unlockedRecipes.barkskin_draught = true;
      nextProgression.inventory.moonleaf = Math.max(
        2,
        nextProgression.inventory.moonleaf || 0
      );
      nextProgression.inventory.ironbark = Math.max(
        1,
        nextProgression.inventory.ironbark || 0
      );
      return;
    }

    nextProgression.questStates.first_moonleaf = "active";
    if (debugProgress === "onboarding-watered") {
      nextProgression.questCounters.moonleafPlanted = 1;
      nextProgression.questCounters.moonleafWatered = 1;
    }
    return;
  }
  const completedHeartwoodQuests = [
    "wake_hearthroot",
    "first_moonleaf",
    "thorn_at_gate",
    "brew_before_blood",
    "first_rootwarden",
  ];
  for (const questId of completedHeartwoodQuests) {
    nextProgression.questStates[questId] = "done";
  }
  nextProgression.journal = [...new Set([...(nextProgression.journal || []), ...completedHeartwoodQuests])];
  nextProgression.questCounters.gateThreatsDefeated = Math.max(
    2,
    nextProgression.questCounters.gateThreatsDefeated || 0
  );
  nextProgression.questCounters.hearthrootAwakened = Math.max(
    1,
    nextProgression.questCounters.hearthrootAwakened || 0
  );
  nextProgression.questCounters.moonleafHarvested = Math.max(
    1,
    nextProgression.questCounters.moonleafHarvested || 0
  );
  nextProgression.questCounters.barkskinBrewed = Math.max(
    1,
    nextProgression.questCounters.barkskinBrewed || 0
  );
  nextProgression.questCounters.rootwardenDefeated = Math.max(
    1,
    nextProgression.questCounters.rootwardenDefeated || 0
  );
  nextProgression.worldFlags.hearthroot_awake = true;
  nextProgression.worldFlags.heartwood_restored = true;

  if (debugProgress === "heartwood") return;

  nextProgression.questStates.bogbound_rot = "done";
  nextProgression.questStates.tidebound_threshold = "done";
  const stillwaterComplete = [
    "stillwater",
    "ember-active",
    "ember-return",
    "ember",
    "frost-active",
    "frost-return",
    "frost",
    "scarroot-active",
    "scarroot-return",
    "scarroot",
    "scarroot-side",
  ].includes(debugProgress);
  nextProgression.questStates.chapel_of_tides = stillwaterComplete
    ? "done"
    : "active";
  nextProgression.questStates.stillwater_homecoming = stillwaterComplete
    ? "done"
    : "inactive";
  nextProgression.questCounters.rootsCleansed = 2;
  nextProgression.questCounters.tideSealsRecovered = 2;
  nextProgression.questCounters.tideBraziersLit =
    stillwaterComplete ? 2 : 0;
  nextProgression.questCounters.bogMatronDefeated =
    stillwaterComplete ? 1 : 0;
  nextProgression.questCounters.tideMemoryRecovered =
    stillwaterComplete ? 1 : 0;
  nextProgression.questCounters.enemy_mire_spitter_defeated = 3;
  nextProgression.questCounters.enemy_bog_lurker_defeated = 3;
  nextProgression.worldFlags.marsh_rot_purged = true;
  nextProgression.worldFlags.chapel_of_tides_open = true;
  if (stillwaterComplete) {
    nextProgression.worldFlags.chapel_of_tides_cleansed = true;
    nextProgression.worldFlags.stillwater_restored = true;
  }
  const emberStage = [
    "ember-active",
    "ember-return",
    "ember",
    "frost-active",
    "frost-return",
    "frost",
    "scarroot-active",
    "scarroot-return",
    "scarroot",
    "scarroot-side",
  ].includes(debugProgress);
  if (!emberStage) return;

  const emberComplete = [
    "ember",
    "frost-active",
    "frost-return",
    "frost",
    "scarroot-active",
    "scarroot-return",
    "scarroot",
    "scarroot-side",
  ].includes(debugProgress);
  const cinderReleased = [
    "ember-return",
    "ember",
    "frost-active",
    "frost-return",
    "frost",
    "scarroot-active",
    "scarroot-return",
    "scarroot",
    "scarroot-side",
  ].includes(debugProgress);
  nextProgression.questStates.ember_totems = "done";
  nextProgression.questStates.cinder_warden = cinderReleased ? "done" : "active";
  nextProgression.questStates.ember_homecoming = emberComplete
    ? "done"
    : "inactive";
  nextProgression.questCounters.totemsActivated = 3;
  nextProgression.questCounters.cinderWardenDefeated = cinderReleased ? 1 : 0;
  nextProgression.questCounters.forgeEmberRecovered = emberComplete ? 1 : 0;
  nextProgression.questCounters.enemy_cinder_imp_defeated = 3;
  nextProgression.questCounters.enemy_ash_brute_defeated = 3;
  nextProgression.worldFlags.ember_pass_reopened = true;
  if (cinderReleased) {
    nextProgression.worldFlags.cinder_warden_released = true;
    nextProgression.regionProgress.ember = {
      ...(nextProgression.regionProgress.ember || {}),
      bossDefeated: true,
    };
  }
  if (emberComplete) {
    nextProgression.worldFlags.ember_restored = true;
  }
  if (
    ![
      "frost-active",
      "frost-return",
      "frost",
      "scarroot-active",
      "scarroot-return",
      "scarroot",
      "scarroot-side",
    ].includes(debugProgress)
  ) {
    return;
  }

  const frostComplete = [
    "frost",
    "scarroot-active",
    "scarroot-return",
    "scarroot",
    "scarroot-side",
  ].includes(debugProgress);
  const seraphReleased = [
    "frost-return",
    "frost",
    "scarroot-active",
    "scarroot-return",
    "scarroot",
    "scarroot-side",
  ].includes(debugProgress);
  nextProgression.questStates.lost_scout = "done";
  nextProgression.questStates.veil_seraph = seraphReleased ? "done" : "active";
  nextProgression.questStates.frost_homecoming = frostComplete
    ? "done"
    : "inactive";
  nextProgression.questCounters.scoutFound = 1;
  nextProgression.questCounters.veilSeraphDefeated = seraphReleased ? 1 : 0;
  nextProgression.questCounters.seraphMessageRecovered = frostComplete ? 1 : 0;
  nextProgression.questCounters.enemy_frost_wisp_defeated = 3;
  nextProgression.questCounters.enemy_icebound_guardian_defeated = 3;
  nextProgression.worldFlags.ridge_signal_recovered = true;
  if (seraphReleased) {
    nextProgression.worldFlags.veil_seraph_released = true;
    nextProgression.regionProgress.frost = {
      ...(nextProgression.regionProgress.frost || {}),
      bossDefeated: true,
    };
  }
  if (frostComplete) {
    nextProgression.worldFlags.frost_restored = true;
    nextProgression.worldFlags.waystone_network_restored = true;
  }
  if (
    ![
      "scarroot-active",
      "scarroot-return",
      "scarroot",
      "scarroot-side",
    ].includes(debugProgress)
  ) {
    return;
  }

  const scarrootComplete = ["scarroot", "scarroot-side"].includes(
    debugProgress
  );
  const elderReleased = [
    "scarroot-return",
    "scarroot",
    "scarroot-side",
  ].includes(debugProgress);
  nextProgression.questStates.blight_watch = "done";
  nextProgression.questStates.elder_hollow = elderReleased ? "done" : "active";
  nextProgression.questStates.scarroot_homecoming = scarrootComplete
    ? "done"
    : "inactive";
  nextProgression.questStates.smallest_grove =
    debugProgress === "scarroot-side" ? "done" : "inactive";
  nextProgression.questCounters.blightEffigiesBroken = 2;
  nextProgression.questCounters.enemy_blight_hound_defeated = 3;
  nextProgression.questCounters.enemy_rot_weaver_defeated = 3;
  nextProgression.questCounters.elderHollowDefeated = elderReleased ? 1 : 0;
  nextProgression.questCounters.firstKeeperMemoryRecovered = scarrootComplete
    ? 1
    : 0;
  nextProgression.questCounters.scarrootSaplingsTended =
    debugProgress === "scarroot-side" ? 3 : 0;
  nextProgression.worldFlags.court_approach_secured = true;
  if (elderReleased) {
    nextProgression.worldFlags.elder_hollow_broken = true;
    nextProgression.regionProgress.scarroot = {
      ...(nextProgression.regionProgress.scarroot || {}),
      bossDefeated: true,
    };
  }
  if (scarrootComplete) {
    nextProgression.worldFlags.scarroot_restored = true;
    nextProgression.worldFlags.signature_rite_unlocked = true;
    for (const talentId of [
      "oaken_reach",
      "waystep",
      "counterbloom",
      "warden_vigor",
    ]) {
      nextProgression.talents[talentId] = 1;
    }
    nextProgression.talentPoints = Math.max(
      1,
      nextProgression.talentPoints || 0
    );
  }
  if (debugProgress === "scarroot-side") {
    nextProgression.worldFlags.scarroot_nursery_restored = true;
  }
}

function applyDebugBootState(nextState, debugConfig) {
  if (!debugConfig?.mode && !debugConfig?.overlay && !debugConfig?.collision) return;
  nextState.debugCollision = Boolean(debugConfig.collision);

  if (debugConfig.mode === GAME_MODES.OPTIONS) {
    nextState.frontend.optionsReturnMode = GAME_MODES.START_MENU;
  }

  if (debugConfig.forceGameOver) {
    nextState.gameOver = true;
    nextState.mode = GAME_MODES.GAME_OVER;
    nextState.player.hp = 0;
  }

  if (debugConfig.overlay && nextState.mode === GAME_MODES.PLAYING) {
    if (debugConfig.overlay === "questlog") {
      nextState.ui.questLogOpen = true;
    } else if (debugConfig.overlay === "worldmap") {
      nextState.ui.worldMapOpen = true;
    } else if (debugConfig.overlay === "talents") {
      nextState.ui.menuOpen = true;
      nextState.ui.activeTab = "talents";
      if (["scarroot", "scarroot-side"].includes(debugConfig.progress)) {
        nextState.ui.selectedTalentIndex = TALENT_DEFS.findIndex(
          (talent) => talent.id === "heartwood_tempest"
        );
      }
    } else if (debugConfig.overlay === "inventory") {
      nextState.ui.menuOpen = true;
      nextState.ui.activeTab = "inventory";
    } else if (debugConfig.overlay === "character") {
      nextState.ui.menuOpen = true;
      nextState.ui.activeTab = "character";
    } else if (debugConfig.overlay === "dialogue") {
      nextState.story.dialogue = {
        speakerName: "Elder Rowan",
        lines: ["The grove remembers every careful choice. Close this window when you are ready."],
        index: 0,
        onClose: null,
      };
    } else if (debugConfig.overlay === "questpanel") {
      nextState.story.questPanel = {
        npcId: debugConfig.questNpc || "elder_rowan",
        selectedTopicIndex: 0,
        selectedActionIndex: 0,
        focus: "topics",
      };
    }
  }
}

function createRuntimeState(mode = GAME_MODES.PLAYING) {
  const frontend = state?.frontend
    ? {
        ...state.frontend,
        optionsReturnMode: GAME_MODES.START_MENU,
        statusText: "",
        statusUntil: 0,
        resetSaveArmed: false,
      }
    : createFrontendState();

  return {
    viewport: state?.viewport
      ? { ...state.viewport }
      : { width: window.innerWidth, height: window.innerHeight, dpr: 1 },
    audio: state?.audio || createAudioState(),
    settings: state?.settings || settings,
    mode,
    frontend,
    debugCollision: Boolean(state?.debugCollision),
  };
}

function replaceGameState(nextState, saveData = null) {
  state = nextState;
  syncFrontendSaveState(state.frontend, saveData);
  applyAudioSettings(state.audio, state.settings);
  resizeCanvas();
  updateQuestAvailability(state);
  refreshQuestStates(state);
  updateMouseWorld();
}

function loadStateFromSave(saveData) {
  if (!saveData?.runtimeSnapshot) return false;

  const restoredProgression = createProgression(saveData.runtimeSnapshot.progression);
  const restoredState = createState(
    restoredProgression,
    saveData.runtimeSnapshot,
    createRuntimeState(GAME_MODES.PLAYING)
  );

  replaceGameState(restoredState, saveData);
  return true;
}

function startNewGame() {
  deleteSave();
  const freshProgression = createProgression();
  const freshState = createState(freshProgression, null, createRuntimeState(GAME_MODES.PLAYING));
  replaceGameState(freshState, null);
  saveCurrentGame();
}

function syncContinueAvailability() {
  syncFrontendSaveState(state.frontend, loadSave());
}

function setFrontendStatus(text, duration = 2) {
  state.frontend.statusText = text;
  state.frontend.statusUntil = state.time + duration;
}

function clearResetSaveArm() {
  state.frontend.resetSaveArmed = false;
}

function openOptionsScreen(returnMode = GAME_MODES.START_MENU) {
  state.frontend.optionsReturnMode = returnMode;
  clearResetSaveArm();
  state.mode = GAME_MODES.OPTIONS;
}

function resumeGame() {
  clearResetSaveArm();
  state.mode = GAME_MODES.PLAYING;
}

function pauseGame() {
  if (state.gameOver || state.transition.active || state.story.dialogue || state.story.questPanel) {
    return false;
  }

  closePanels();
  saveCurrentGame();
  state.mode = GAME_MODES.PAUSED;
  return true;
}

function returnToTitle(options = {}) {
  closePanels();
  clearResetSaveArm();
  state.transition = createTransitionState();
  state.story.dialogue = null;
  state.story.questPanel = null;
  state.story.focus = null;
  state.story.prompt = "";
  state.nearExit = null;
  state.exitCharge = 0;
  state.gameOver = false;
  state.areaCleared = false;
  state.frontend.optionsReturnMode = GAME_MODES.START_MENU;
  state.frontend.statusText = "";
  state.frontend.statusUntil = 0;
  syncContinueAvailability();
  state.mode = GAME_MODES.START_MENU;
  if (options.selectContinue && state.frontend.canContinue) {
    state.frontend.menuSelection = 1;
  } else {
    state.frontend.menuSelection = 0;
  }
}

function buildRuntimeSnapshot() {
  return {
    progression: state.progression,
    sceneProgress: state.sceneProgress,
    currentSceneId: state.currentSceneId,
    currentEntryId: state.currentEntryId,
    playerVitals: capturePlayerVitals(state.player),
    clock: serializeClock(state.clock),
    ui: {
      questLogOpen: false,
      menuOpen: false,
      worldMapOpen: false,
      activeTab: state.ui.activeTab,
      selectedInventoryIndex: state.ui.selectedInventoryIndex,
      selectedEquipmentIndex: state.ui.selectedEquipmentIndex,
      selectedTalentIndex: state.ui.selectedTalentIndex,
      selectedQuestIndex: state.ui.selectedQuestIndex,
      selectedServiceIndex: state.ui.selectedServiceIndex,
      selectedStashIndex: state.ui.selectedStashIndex,
      serviceSubpanel: state.ui.serviceSubpanel,
      inventoryFilter: state.ui.inventoryFilter,
      inventorySort: state.ui.inventorySort,
      shopFilter: state.ui.shopFilter,
      shopSort: state.ui.shopSort,
    },
  };
}

function collectUnlockedMaps() {
  const unlocked = new Set([INITIAL_SCENE_ID, state.currentSceneId]);
  for (const sceneId of Object.keys(state.sceneProgress || {})) {
    if (SCENES[sceneId]) unlocked.add(sceneId);
  }
  return [...unlocked];
}

function collectDefeatedBosses() {
  return Object.entries(state.sceneProgress || {})
    .filter(([sceneId, progress]) => SCENES[sceneId]?.bossEnabled && progress?.cleared)
    .map(([sceneId]) => sceneId);
}

function collectCompletedEvents() {
  const completed = [];

  for (const [sceneId, progress] of Object.entries(state.sceneProgress || {})) {
    if (progress?.cleared) {
      completed.push(`${sceneId}:cleared`);
    }

    for (const objectId of Object.keys(progress?.objectStates || {})) {
      completed.push(`${sceneId}:${objectId}`);
    }
  }

  for (const [flag, enabled] of Object.entries(state.progression.worldFlags || {})) {
    if (enabled) completed.push(`flag:${flag}`);
  }

  return completed;
}

function buildSaveData() {
  const runtimeSnapshot = buildRuntimeSnapshot();

  return {
    version: "0.4.0",
    player: {
      ...runtimeSnapshot.playerVitals,
      level: state.progression.level,
      xp: state.progression.xp,
    },
    world: {
      currentMap: state.currentSceneId,
      currentEntryId: state.currentEntryId,
      unlockedMaps: collectUnlockedMaps(),
      defeatedBosses: collectDefeatedBosses(),
      completedEvents: collectCompletedEvents(),
      sceneProgress: state.sceneProgress,
    },
    inventory: {
      potions: {
        health_potion: state.progression.inventory.health_potion || 0,
        spirit_tonic: state.progression.inventory.spirit_tonic || 0,
        greater_health_potion: state.progression.inventory.greater_health_potion || 0,
        ward_elixir: state.progression.inventory.ward_elixir || 0,
      },
      items: state.progression.inventory,
      stash: state.progression.stash,
      equipment: state.progression.equipment,
      actionSlots: state.progression.actionSlots,
      silver: getCurrency(state.progression),
    },
    calendar: serializeClock(state.clock),
    progression: state.progression,
    ui: runtimeSnapshot.ui,
    runtimeSnapshot,
    savedAt: Date.now(),
  };
}

function saveCurrentGame() {
  if (
    fatalError ||
    state.gameOver ||
    !state.player ||
    state.mode === GAME_MODES.START_MENU ||
    state.mode === GAME_MODES.OPTIONS
  ) {
    return false;
  }

  const saved = saveGame(buildSaveData());
  if (saved) {
    syncContinueAvailability();
  }
  return saved;
}

function updateSettings(nextSettings) {
  state.settings = {
    ...state.settings,
    musicVolume: clamp(nextSettings.musicVolume ?? state.settings.musicVolume, 0, 1),
    sfxVolume: clamp(nextSettings.sfxVolume ?? state.settings.sfxVolume, 0, 1),
    screenShake: clamp(nextSettings.screenShake ?? state.settings.screenShake, 0, 1),
    damageNumbers: nextSettings.damageNumbers ?? state.settings.damageNumbers,
    fullscreen: nextSettings.fullscreen ?? state.settings.fullscreen,
  };
  saveSettings(state.settings);
  applyAudioSettings(state.audio, state.settings);
}

async function setFullscreenPreference(enabled) {
  const target = Boolean(enabled);
  try {
    if (target) {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
      }
    } else if (document.fullscreenElement) {
      await document.exitFullscreen?.();
    }
  } catch (error) {
    console.warn("[Heart of Forest] Fullscreen toggle failed.", error);
  }

  updateSettings({ fullscreen: Boolean(document.fullscreenElement) });
}

function buildSceneState(sceneId, entryId, currentProgression, sceneProgress, vitals = null, day = 1) {
  const scene = SCENES[sceneId];
  const arena = createArena({
    ...scene,
    worldFlags: currentProgression.worldFlags,
    questStates: currentProgression.questStates,
    questCounters: currentProgression.questCounters,
  });
  const savedSceneState = sceneProgress[sceneId];
  const encounterConfig = { ...scene };
  if (
    sceneId === "emberpine_grove" &&
    !currentProgression.worldFlags.ember_pass_reopened
  ) {
    encounterConfig.bossEnabled = false;
    encounterConfig.completionText = "Ember Line Cleared";
  }
  if (
    sceneId === "frostveil_tundra" &&
    !currentProgression.worldFlags.ridge_signal_recovered
  ) {
    encounterConfig.bossEnabled = false;
    encounterConfig.completionText = "Lower Ridge Cleared";
  }
  if (
    sceneId === "hollowheart_ruins" &&
    !currentProgression.worldFlags.court_approach_secured
  ) {
    encounterConfig.bossEnabled = false;
    encounterConfig.completionText = "Hollowheart Approach Cleared";
  }
  if (
    sceneId === "starfall_sanctum" &&
    !currentProgression.worldFlags.starfall_truth_recovered
  ) {
    encounterConfig.bossEnabled = false;
    encounterConfig.completionText = "Pilgrim Archive Cleared";
  }

  if (savedSceneState?.objectStates) {
    for (const interactable of arena.interactables) {
      if (savedSceneState.objectStates[interactable.id] && !interactable.repeatable) {
        interactable.disabled = true;
      }
    }
  }

  const spawn = arena.entrySpawns?.[entryId] || arena.entrySpawns?.default || arena.playerSpawn;
  const encounter = createEncounterState(arena, encounterConfig);

  if (
    savedSceneState?.cleared &&
    shouldStartCorruptionEcho(currentProgression, sceneProgress, sceneId, day)
  ) {
    activateCorruptionEcho(encounter);
  } else if (savedSceneState?.cleared) {
    deactivateEncounter(encounter);
  }

  const player = new Player(spawn, getPlayerBonuses(currentProgression));
  restorePlayerVitals(player, vitals, arena);

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
    pulses: [],
    swings: [],
    particles: [],
    afterImages: [],
    encounter,
  };
}

function restorePlayerVitals(player, vitals, arena) {
  if (!vitals) return;
  if (arena) {
    player.x = clamp(vitals.x ?? player.x, player.radius, arena.width - player.radius);
    player.y = clamp(vitals.y ?? player.y, player.radius, arena.height - player.radius);
  }
  player.hp = clamp(vitals.hp ?? player.maxHp, 1, player.maxHp);
  player.spirit = clamp(vitals.spirit ?? player.maxSpirit, 0, player.maxSpirit);
  player.heartCharge = clamp(vitals.heartCharge ?? 0, 0, 100);
}

function capturePlayerVitals(player) {
  return {
    x: player.x,
    y: player.y,
    hp: player.hp,
    maxHp: player.maxHp,
    spirit: player.spirit,
    maxSpirit: player.maxSpirit,
    heartCharge: player.heartCharge || 0,
  };
}

function activateCorruptionEcho(encounter) {
  const echoPlan = encounter.wavePlans.at(-1) || encounter.wavePlans[0] || [];
  encounter.phase = "waveIntro";
  encounter.waveIndex = -1;
  encounter.wavePlans = [echoPlan];
  encounter.totalWaves = 1;
  encounter.spawnQueue = [];
  encounter.phaseTimer = 0.5;
  encounter.bannerText = "Corruption Echo";
  encounter.bannerTimer = 1.8;
  encounter.bossEnabled = false;
  encounter.isCorruptionEcho = true;
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
  const next = buildSceneState(
    sceneId,
    entryId,
    state.progression,
    state.sceneProgress,
    vitals,
    state.clock?.day || 1
  );

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
  state.mode = GAME_MODES.PLAYING;
  state.story.focus = null;
  state.story.prompt = "";
  state.story.dialogue = null;
  state.story.questPanel = null;
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
  queueAudio(state, "travel");
  state.transition.active = true;
  state.transition.kind = "travel";
  state.transition.phase = "out";
  state.transition.timer = 0;
  state.transition.duration = TRANSITION_DURATION;
  state.transition.targetSceneId = exit.toSceneId;
  state.transition.targetEntryId = exit.targetEntryId;
  state.transition.label = exit.label;
  state.transition.title = `Entering ${exit.label}`;
  state.transition.subtitle = "The forest shifts under Ayla's feet";
  state.nearExit = exit;
}

function startSleepTransition() {
  if (state.transition.active) return false;
  const tutorialGuidance = getMoonleafSleepGuidance(state.progression);
  if (tutorialGuidance?.blocked) {
    setToast(tutorialGuidance.text, 2.4);
    return true;
  }

  queueAudio(state, "travel");
  state.transition.active = true;
  state.transition.kind = "sleep";
  state.transition.phase = "out";
  state.transition.timer = 0;
  state.transition.duration = 0.7;
  state.transition.targetSceneId = "ayla_homestead";
  state.transition.targetEntryId = "bedside";
  state.transition.label = `Day ${state.clock.day + 1}`;
  state.transition.title = `Day ${state.clock.day + 1}`;
  state.transition.subtitle =
    tutorialGuidance?.subtitle || "Ayla wakes with the grove at dawn";
  state.nearExit = null;
  return true;
}

function updateTransition(dt) {
  const transition = state.transition;
  if (!transition.active) return;

  if (transition.phase === "out") {
    transition.timer += dt;
    if (transition.timer >= transition.duration) {
      if (transition.kind === "sleep") {
        const previousDay = state.clock.day;
        startNextDay(state.clock);
        state.progression.activePreparation = null;
        const farmResult = advanceFarmPlots(
          ensureSceneProgress("ayla_homestead"),
          previousDay,
          state.progression
        );
        applySceneState(transition.targetSceneId, transition.targetEntryId, { restoreFull: true });
        const cropText =
          farmResult.maturePlots > 0
            ? ` ${farmResult.maturePlots} crop${farmResult.maturePlots === 1 ? " is" : "s are"} ready to harvest.`
            : farmResult.grownPlots > 0
              ? ` ${farmResult.grownPlots} plot${farmResult.grownPlots === 1 ? "" : "s"} grew overnight.`
              : "";
        setToast(
          `Day ${state.clock.day} begins at dawn. Health and spirit restored.${cropText}`,
          3.4
        );
      } else {
        applySceneState(transition.targetSceneId, transition.targetEntryId);
      }
      saveCurrentGame();
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
  if (state.encounter.isCorruptionEcho) {
    const echoResult = markCorruptionEchoCompleted(
      state.progression,
      state.currentSceneId,
      state.clock.day
    );
    const rewardResult = awardCorruptionEchoRewards(
      state.progression,
      echoResult
    );
    state.areaCleared = false;
    state.enemies = [];
    state.hostileProjectiles = [];
    state.eruptions = [];
    deactivateEncounter(state.encounter);
    state.encounter.bannerText = echoResult?.postgame
      ? "Second Spring Echo Silenced"
      : "Corruption Echo Silenced";
    state.encounter.bannerTimer = 2;
    if (echoResult?.postgame) {
      setToast(
        `Second Spring Echo silenced: ${formatEchoReward(rewardResult)}`,
        3
      );
      queueAudio(state, "quest");
    }
    saveCurrentGame();
    return;
  }

  if (sceneProgress.cleared) {
    state.areaCleared = false;
    return;
  }

  sceneProgress.cleared = true;
  markRegionSceneCleared(
    state.progression,
    state.sceneProgress,
    state.currentSceneId,
    state.clock.day,
    { bossDefeated: Boolean(state.boss?.dead) }
  );
  syncCampaignProgress(state.progression, state.sceneProgress);
  state.areaCleared = false;
  state.boss = null;
  state.enemies = [];
  state.hostileProjectiles = [];
  state.eruptions = [];
  deactivateEncounter(state.encounter);
  state.encounter.bannerText = state.scene.completionText;
  state.encounter.bannerTimer = 2;
  saveCurrentGame();
}

function updateExitCharge(dt) {
  if (
    state.gameOver ||
    state.transition.active ||
    state.story.dialogue ||
    isUiOpen() ||
    state.training?.active
  ) {
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

  const holdingConfirm =
    input.keys.has("e") ||
    input.codes.has("KeyE");

  if (!holdingConfirm) {
    state.exitCharge = 0;
    return;
  }

  const holdTime = state.combatTimer > 0 ? EXIT_COMBAT_HOLD_TIME : EXIT_HOLD_TIME;
  state.exitCharge = Math.min(1, state.exitCharge + dt / holdTime);
  if (state.exitCharge >= 1) {
    startTransition(exit);
    state.exitCharge = 0;
  }
}

function updateInteractionState() {
  updateQuestAvailability(state);
  refreshQuestStates(state);
  consumeStoryEvents(state);
  syncFarmInteractables(
    state.arena,
    ensureSceneProgress(state.currentSceneId),
    state.progression,
    state.clock
  );

  if (state.story.dialogue || state.story.questPanel) {
    state.story.focus = null;
    state.story.hovered = null;
    state.story.prompt = "";
    canvas.style.cursor = "default";
    return;
  }

  getNearestInteractionTarget(state);
  getHoveredInteractionTarget(state, state.mouseWorld.x, state.mouseWorld.y);
  canvas.style.cursor = state.story.hovered ? "pointer" : "default";
}

function handleInteractionAction(interaction) {
  if (!interaction?.action) return false;

  if (interaction.action === "sleep") {
    if (state.training?.active) {
      setToast("Finish the Training Grove drill before resting.", 2);
      return true;
    }
    return startSleepTransition();
  }

  if (interaction.action === "farm-plot") {
    const result = interactWithFarmPlot(
      ensureSceneProgress(state.currentSceneId),
      interaction.interactableId,
      state.progression,
      state.clock
    );
    syncFarmInteractables(
      state.arena,
      ensureSceneProgress(state.currentSceneId),
      state.progression,
      state.clock
    );
    setToast(result.text, result.changed ? 2.6 : 2);
    queueAudio(state, result.event === "harvested" ? "quest" : "use-item");
    if (result.changed) saveCurrentGame();
    return true;
  }

  if (interaction.action === "second-spring-board") {
    const board = getSecondSpringBoardView(
      state.progression,
      state.sceneProgress,
      state.clock?.day || 1,
      state.currentSceneId
    );
    state.story.dialogue = {
      speakerName: board.title,
      lines: board.summaryLines,
      index: 0,
      onClose: null,
    };
    setToast(
      board.availableCount > 0
        ? `${board.availableCount} Second Spring echo${
            board.availableCount === 1 ? "" : "es"
          } stirring today.`
        : "All tracked Second Spring echoes are quiet today.",
      2.6
    );
    queueAudio(state, "use-item");
    return true;
  }

  if (interaction.action === "training-grove") {
    if (!state.progression.campaign?.trainingGroveUnlocked) {
      setToast("Restore Heartwood before using the Training Grove.", 2);
      return true;
    }
    const target = state.arena.interactables.find(
      (entry) => entry.id === interaction.interactableId
    );
    const result = startTrainingDrill(
      state,
      interaction.interactableId,
      target?.x || state.player.x + 60,
      target?.y || state.player.y,
      "steady-target"
    );
    setToast(
      result.started
        ? "Training started: deal as much damage as possible in 20 seconds."
        : result.reason,
      result.started ? 3 : 2
    );
    if (result.started) queueAudio(state, "quest");
    return true;
  }

  if (interaction.action === "training-grove-group") {
    if (!state.progression.campaign?.trainingGroupUnlocked) {
      setToast("Restore Stillwater before using the Target Circle.", 2);
      return true;
    }
    const target = state.arena.interactables.find(
      (entry) => entry.id === interaction.interactableId
    );
    const result = startTrainingDrill(
      state,
      interaction.interactableId,
      target?.x || state.player.x + 60,
      target?.y || state.player.y,
      "target-circle"
    );
    setToast(
      result.started
        ? "Target Circle started: control three woven targets for 20 seconds."
        : result.reason,
      result.started ? 3 : 2
    );
    if (result.started) queueAudio(state, "quest");
    return true;
  }

  if (interaction.action === "training-grove-elite") {
    if (!state.progression.campaign?.trainingEliteUnlocked) {
      setToast("Restore Frost before using the Veil Drill.", 2);
      return true;
    }
    const target = state.arena.interactables.find(
      (entry) => entry.id === interaction.interactableId
    );
    const result = startTrainingDrill(
      state,
      interaction.interactableId,
      target?.x || state.player.x + 60,
      target?.y || state.player.y,
      "elite-pattern"
    );
    setToast(
      result.started
        ? "Veil Drill started: leave each pale telegraph before it closes."
        : result.reason,
      result.started ? 3 : 2
    );
    if (result.started) queueAudio(state, "quest");
    return true;
  }

  return false;
}

function handleInteractionInput() {
  if (state.story.questPanel) {
    if (wasPressed(input, "escape", "Escape")) {
      closeQuestPanel(state);
      return true;
    }

    if (
      wasPressed(input, "tab", "Tab") ||
      wasPressed(input, "arrowleft", "ArrowLeft") ||
      wasPressed(input, "arrowright", "ArrowRight") ||
      wasPressed(input, "a", "KeyA") ||
      wasPressed(input, "d", "KeyD")
    ) {
      shiftQuestPanelFocus(state);
      return true;
    }

    if (wasPressed(input, "arrowup", "ArrowUp") || wasPressed(input, "w", "KeyW")) {
      moveQuestPanelSelection(state, -1);
      return true;
    }

    if (wasPressed(input, "arrowdown", "ArrowDown") || wasPressed(input, "s", "KeyS")) {
      moveQuestPanelSelection(state, 1);
      return true;
    }

    if (
      wasPressed(input, "e", "KeyE") ||
      wasPressed(input, "enter", "Enter") ||
      wasPressed(input, " ", "Space")
    ) {
      activateQuestPanelSelection(state);
      return true;
    }

    return true;
  }

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

  if (input.mouse.leftPressed && state.story.hovered) {
    const hovered = state.story.hovered;
    const interactionRadius = hovered.data.interactionRadius || 60;
    if (hovered.distance > interactionRadius) {
      setToast(`Move closer to ${hovered.label}.`, 1.5);
      return true;
    }
    const interaction = beginInteraction(state, hovered);
    handleInteractionAction(interaction);
    return true;
  }

  if (wasPressed(input, "e", "KeyE") && state.story.focus) {
    const interaction = beginInteraction(state, state.story.focus);
    handleInteractionAction(interaction);
    return true;
  }

  return false;
}

function setFrontendSelectionByAction(action) {
  const entries = getFrontendEntries(state);
  const index = entries.findIndex((entry) => entry.action === action);
  if (index < 0) return;
  if (action !== "reset-save") {
    clearResetSaveArm();
  }

  if (state.mode === GAME_MODES.START_MENU) {
    state.frontend.menuSelection = index;
    return;
  }

  if (state.mode === GAME_MODES.PAUSED) {
    state.frontend.pauseSelection = index;
    return;
  }

  if (state.mode === GAME_MODES.GAME_OVER) {
    state.frontend.gameOverSelection = index;
    return;
  }

  state.frontend.optionsSelection = index;
}

function applySliderClick(action, target) {
  clearResetSaveArm();
  const controlWidth = target.metrics?.controlWidth || target.bounds.w - 36;
  const sliderX = target.bounds.x + target.bounds.w - controlWidth - 18;
  const sliderWidth = target.metrics?.sliderWidth || Math.max(88, controlWidth - 72);
  const ratio = clamp((input.mouse.x - sliderX) / sliderWidth, 0, 1);

  if (action === "music-volume") {
    updateSettings({ musicVolume: ratio });
    return true;
  }

  if (action === "sfx-volume") {
    updateSettings({ sfxVolume: ratio });
    return true;
  }

  if (action === "screen-shake") {
    updateSettings({ screenShake: ratio });
    return true;
  }

  return false;
}

function activateFrontendAction(action) {
  switch (action) {
    case "new-game":
      clearResetSaveArm();
      if (state.settings.fullscreen) setFullscreenPreference(true);
      startNewGame();
      return true;
    case "continue": {
      clearResetSaveArm();
      const saveData = loadSave();
      if (!saveData) {
        syncContinueAvailability();
        setFrontendStatus("No valid save could be loaded.", 2.2);
        return true;
      }
      if (state.settings.fullscreen) setFullscreenPreference(true);
      return loadStateFromSave(saveData);
    }
    case "options":
      openOptionsScreen(state.mode === GAME_MODES.PAUSED ? GAME_MODES.PAUSED : GAME_MODES.START_MENU);
      return true;
    case "resume":
      resumeGame();
      return true;
    case "save-game":
      if (saveCurrentGame()) {
        setFrontendStatus("Adventure saved locally.", 2.2);
      } else {
        setFrontendStatus("Save could not be written right now.", 2.2);
      }
      return true;
    case "save-return-title":
      saveCurrentGame();
      returnToTitle({ selectContinue: true });
      return true;
    case "retry":
      clearResetSaveArm();
      reloadCurrentScene();
      return true;
    case "load-save": {
      clearResetSaveArm();
      const saveData = loadSave();
      if (!saveData) {
        syncContinueAvailability();
        setFrontendStatus("No valid save could be loaded.", 2.2);
        return true;
      }
      return loadStateFromSave(saveData);
    }
    case "return-title":
      returnToTitle({ selectContinue: state.frontend.canContinue });
      return true;
    case "fullscreen":
      clearResetSaveArm();
      setFullscreenPreference(!state.settings.fullscreen);
      return true;
    case "reset-save":
      if (!state.frontend.resetSaveArmed) {
        state.frontend.resetSaveArmed = true;
        setFrontendStatus("Press Reset Save Data again to confirm.", 3);
        return true;
      }
      deleteSave();
      clearResetSaveArm();
      syncContinueAvailability();
      setFrontendStatus("Adventure save deleted. Settings were preserved.", 2.6);
      return true;
    case "back":
      clearResetSaveArm();
      state.mode = state.frontend.optionsReturnMode || GAME_MODES.START_MENU;
      return true;
    default:
      return false;
  }
}

function adjustFrontendOption(delta) {
  const action = getSelectedFrontendAction(state);

  if (action === "music-volume") {
    updateSettings({ musicVolume: clamp(state.settings.musicVolume + delta * 0.05, 0, 1) });
    return true;
  }

  if (action === "sfx-volume") {
    updateSettings({ sfxVolume: clamp(state.settings.sfxVolume + delta * 0.05, 0, 1) });
    return true;
  }

  if (action === "screen-shake") {
    updateSettings({ screenShake: clamp(state.settings.screenShake + delta * 0.05, 0, 1) });
    return true;
  }

  if (action === "fullscreen") {
    setFullscreenPreference(!state.settings.fullscreen);
    return true;
  }

  return false;
}

function handleFrontendInput() {
  const target = getFrontendHoverTarget(state, input.mouse.x, input.mouse.y);

  if (input.mouse.leftPressed && target && !target.disabled) {
    setFrontendSelectionByAction(target.action);
    if (
      target.action === "music-volume" ||
      target.action === "sfx-volume" ||
      target.action === "screen-shake"
    ) {
      return applySliderClick(target.action, target);
    }
    return activateFrontendAction(target.action);
  }

  if (wasPressed(input, "arrowup", "ArrowUp") || wasPressed(input, "w", "KeyW")) {
    moveFrontendSelection(state, -1);
    queueAudio(state, "ui");
    if (state.mode === GAME_MODES.OPTIONS && getSelectedFrontendAction(state) !== "reset-save") {
      clearResetSaveArm();
    }
    return true;
  }

  if (wasPressed(input, "arrowdown", "ArrowDown") || wasPressed(input, "s", "KeyS")) {
    moveFrontendSelection(state, 1);
    queueAudio(state, "ui");
    if (state.mode === GAME_MODES.OPTIONS && getSelectedFrontendAction(state) !== "reset-save") {
      clearResetSaveArm();
    }
    return true;
  }

  if (state.mode === GAME_MODES.OPTIONS) {
    if (wasPressed(input, "arrowleft", "ArrowLeft") || wasPressed(input, "a", "KeyA")) {
      queueAudio(state, "ui");
      return adjustFrontendOption(-1);
    }

    if (wasPressed(input, "arrowright", "ArrowRight") || wasPressed(input, "d", "KeyD")) {
      queueAudio(state, "ui");
      return adjustFrontendOption(1);
    }

    if (wasPressed(input, "escape", "Escape")) {
      clearResetSaveArm();
      state.mode = state.frontend.optionsReturnMode || GAME_MODES.START_MENU;
      return true;
    }
  }

  if (state.mode === GAME_MODES.PAUSED && wasPressed(input, "escape", "Escape")) {
    resumeGame();
    return true;
  }

  if (state.mode === GAME_MODES.GAME_OVER && wasPressed(input, "escape", "Escape")) {
    returnToTitle({ selectContinue: state.frontend.canContinue });
    return true;
  }

  if (state.mode === GAME_MODES.GAME_OVER && wasPressed(input, "r", "KeyR")) {
    reloadCurrentScene();
    return true;
  }

  if (wasPressed(input, "enter", "Enter") || wasPressed(input, " ", "Space")) {
    const action = getSelectedFrontendAction(state);
    const entries = getFrontendEntries(state);
    const entry = entries.find((candidate) => candidate.action === action);
    if (entry?.disabled) return true;
    queueAudio(state, "ui");
    return activateFrontendAction(action);
  }

  return false;
}

function isUiOpen() {
  return state.ui.questLogOpen || state.ui.menuOpen || state.ui.worldMapOpen;
}

function closePanels() {
  state.ui.questLogOpen = false;
  state.ui.menuOpen = false;
  state.ui.worldMapOpen = false;
  clearActiveService(state);
}

function closeActiveInGameWindow() {
  if (state.story.dialogue) {
    state.story.dialogue = null;
    queueAudio(state, "ui");
    return true;
  }

  if (state.story.questPanel) {
    closeQuestPanel(state);
    queueAudio(state, "ui");
    return true;
  }

  if (isUiOpen()) {
    closePanels();
    queueAudio(state, "ui");
    return true;
  }

  return false;
}

function openMenu(tab) {
  queueAudio(state, "ui");
  state.ui.menuOpen = true;
  state.ui.questLogOpen = false;
  state.ui.activeTab = tab;
}

function toggleQuestLog() {
  queueAudio(state, "ui");
  state.ui.worldMapOpen = false;
  state.ui.questLogOpen = !state.ui.questLogOpen;
  if (state.ui.questLogOpen) {
    state.ui.menuOpen = false;
    clearActiveService(state);
  }
}

function toggleWorldMap() {
  queueAudio(state, "ui");
  const nextOpen = !state.ui.worldMapOpen;
  closePanels();
  state.ui.worldMapOpen = nextOpen;
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

function cycleUiOption(key, order, delta = 1) {
  const current = order.indexOf(state.ui[key]);
  const safeIndex = current >= 0 ? current : 0;
  state.ui[key] = order[(safeIndex + delta + order.length) % order.length];
}

function clampInventorySelection() {
  clampSelection(
    "selectedInventoryIndex",
    getInventoryEntries(state.progression, {
      filter: state.ui.inventoryFilter,
      sort: state.ui.inventorySort,
    }).length
  );
}

function clampServiceSelection() {
  if (state.ui.activeServiceId) {
    const active = getActiveService(state);
    if (active?.kind !== "stash") {
      clampSelection("selectedServiceIndex", getServiceEntries(state).length);
      return;
    }
  }
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
  if (result.item.effect?.preparation) {
    state.player.heartCharge = Math.min(
      100,
      state.player.heartCharge +
        (state.player.abilityInfo.preparationHeartChargeBonus || 0)
    );
  }
  if (state.player.abilityInfo.fieldRemedy) {
    state.roots.push({
      x: state.player.x,
      y: state.player.y,
      radius: 62,
      life: 4,
      maxLife: 4,
      pulse: 0,
      damagePerSecond: 0,
      damageTimer: 0.5,
      healing: true,
    });
  }
  queueAudio(state, "use-item");
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
      queueAudio(state, "equip");
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
    queueAudio(state, "sell");
    clampInventorySelection();
  } else if (getSellHintVisible(state)) {
    setToast(result.reason || "That item cannot be sold.", 1.8);
  }
  return getSellHintVisible(state);
}

function toggleInventoryEntryLock(entry) {
  if (!entry) return false;
  const result = toggleItemLock(state.progression, entry.id);
  if (!result.changed) return true;
  setToast(result.locked ? `${entry.name} locked` : `${entry.name} unlocked`, 1.6);
  queueAudio(state, "equip");
  return true;
}

function unequipSelectedEntry() {
  const equipped = getEquippedItems(state.progression);
  const slot = equipped[state.ui.selectedEquipmentIndex]?.slot;
  if (slot && unequipItem(state.progression, slot)) {
    refreshPlayerFromProgression();
    setToast(`Unequipped ${slot}`, 1.7);
    queueAudio(state, "equip");
  }
  return true;
}

function saveSelectedLoadout(index) {
  const result = saveLoadout(state.progression, index);
  setToast(
    result.saved ? `${result.loadout.name} saved` : result.reason,
    result.saved ? 1.8 : 2
  );
  if (result.saved) {
    queueAudio(state, "quest");
    saveCurrentGame();
  }
  return true;
}

function activateSelectedLoadout(index) {
  const result = activateLoadout(state.progression, index);
  setToast(
    result.activated ? `${result.loadout.name} equipped` : result.reason,
    result.activated ? 1.8 : 2.2
  );
  if (result.activated) {
    refreshPlayerFromProgression();
    queueAudio(state, "equip");
    saveCurrentGame();
  }
  return true;
}

function unlockSelectedTalent() {
  const talent = TALENT_DEFS[state.ui.selectedTalentIndex];
  if (talent && unlockTalent(state.progression, talent.id)) {
    refreshPlayerFromProgression();
    setToast(`Unlocked ${talent.name}`, 2);
    queueAudio(state, "quest");
  }
  return true;
}

function runSelectedServiceAction() {
  const result = performSelectedServiceAction(state);
  if (result.success) {
    refreshPlayerFromProgression();
    setToast(result.text, 2);
    queueAudio(
      state,
      result.text.startsWith("Purchased") || result.text.startsWith("Recovered")
        ? "buy"
        : "quest"
    );
  } else if (result.reason) {
    setToast(result.reason, 1.8);
  }
  return true;
}

function transferSelectedStash() {
  const result = transferSelectedStashEntry(state);
  if (result.success) {
    setToast(result.text, 1.8);
    queueAudio(state, "stash");
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
    case "close-overlay":
      return closeActiveInGameWindow();
    case "open-tab":
      openMenu(target.tab);
      return true;
    case "quest-select":
      state.ui.selectedQuestIndex = target.index;
      return true;
    case "quest-panel-topic":
      state.story.questPanel.selectedTopicIndex = target.index;
      state.story.questPanel.selectedActionIndex = 0;
      state.story.questPanel.focus = "topics";
      return true;
    case "quest-panel-action":
      state.story.questPanel.selectedActionIndex = target.index;
      state.story.questPanel.focus = "actions";
      return activateQuestPanelSelection(state);
    case "inventory-select":
      state.ui.selectedInventoryIndex = target.index;
      return true;
    case "inventory-primary":
      state.ui.selectedInventoryIndex = target.index;
      return activateInventoryEntry(target.entry);
    case "inventory-sell":
      state.ui.selectedInventoryIndex = target.index;
      return sellInventoryEntry(target.entry);
    case "inventory-lock":
      state.ui.selectedInventoryIndex = target.index;
      return toggleInventoryEntryLock(target.entry);
    case "inventory-bind":
      state.ui.selectedInventoryIndex = target.index;
      return assignInventoryEntryToActionSlot(target.slotIndex, target.entry);
    case "inventory-filter":
      state.ui.inventoryFilter = target.value;
      state.ui.selectedInventoryIndex = 0;
      clampInventorySelection();
      return true;
    case "inventory-sort":
      state.ui.inventorySort = target.value;
      state.ui.selectedInventoryIndex = 0;
      clampInventorySelection();
      return true;
    case "equipment-select":
      state.ui.selectedEquipmentIndex = target.index;
      return true;
    case "equipment-unequip":
      state.ui.selectedEquipmentIndex = target.index;
      return unequipSelectedEntry();
    case "loadout-save":
      return saveSelectedLoadout(target.index);
    case "loadout-activate":
      return activateSelectedLoadout(target.index);
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
    case "service-filter":
      state.ui.shopFilter = target.value;
      state.ui.selectedServiceIndex = 0;
      clampServiceSelection();
      return true;
    case "service-sort":
      state.ui.shopSort = target.value;
      state.ui.selectedServiceIndex = 0;
      clampServiceSelection();
      return true;
    case "service-subpanel":
      state.ui.serviceSubpanel = target.value;
      state.ui.selectedServiceIndex = 0;
      clampServiceSelection();
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
    const entries = getInventoryEntries(state.progression, {
      filter: state.ui.inventoryFilter,
      sort: state.ui.inventorySort,
    });
    clampInventorySelection();

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

    if (wasPressed(input, "k", "KeyK")) {
      const entry = entries[state.ui.selectedInventoryIndex];
      return toggleInventoryEntryLock(entry);
    }

    if (wasPressed(input, "f", "KeyF")) {
      cycleUiOption("inventoryFilter", INVENTORY_FILTER_ORDER, 1);
      clampInventorySelection();
      return true;
    }

    if (wasPressed(input, "g", "KeyG")) {
      cycleUiOption("inventorySort", INVENTORY_SORT_ORDER, 1);
      clampInventorySelection();
      return true;
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
      clampServiceSelection();

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

      if (service.kind === "shop") {
        if (wasPressed(input, "f", "KeyF")) {
          cycleUiOption("shopFilter", SHOP_FILTER_ORDER, 1);
          clampServiceSelection();
          return true;
        }

        if (wasPressed(input, "g", "KeyG")) {
          cycleUiOption("shopSort", SHOP_SORT_ORDER, 1);
          clampServiceSelection();
          return true;
        }

        if (wasPressed(input, "b", "KeyB")) {
          state.ui.serviceSubpanel = state.ui.serviceSubpanel === "buyback" ? "stock" : "buyback";
          state.ui.selectedServiceIndex = 0;
          clampServiceSelection();
          return true;
        }
      }
    }

    return true;
  }

  return false;
}

function handleUiInput() {
  if (state.story.dialogue) {
    return handleMouseUiInput();
  }

  if (state.story.questPanel) {
    return handleMouseUiInput();
  }

  if (!state.ui.menuOpen && handleMouseUiInput()) {
    return true;
  }

  if (wasPressed(input, "escape", "Escape")) {
    if (isUiOpen()) {
      closePanels();
      return true;
    }

    return pauseGame();
  }

  if (wasPressed(input, "l", "KeyL")) {
    toggleQuestLog();
    return true;
  }

  if (wasPressed(input, "m", "KeyM")) {
    toggleWorldMap();
    return true;
  }

  if (state.ui.worldMapOpen) {
    return true;
  }

  if (wasPressed(input, "c", "KeyC")) {
    state.ui.worldMapOpen = false;
    openMenu(state.ui.menuOpen && state.ui.activeTab === "character" ? "character" : "character");
    return true;
  }

  if (wasPressed(input, "i", "KeyI")) {
    state.ui.worldMapOpen = false;
    openMenu("inventory");
    return true;
  }

  if (wasPressed(input, "n", "KeyN")) {
    state.ui.worldMapOpen = false;
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
    const quests = getJournalQuestEntries(state.progression);
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

function setToast(text, duration = 2) {
  state.story.toastText = text;
  state.story.toastTimer = duration;
}

function formatEchoReward(rewardResult) {
  const parts = [];
  const firstItem = rewardResult?.items?.[0];
  if (firstItem) {
    parts.push(`${firstItem.amount} ${formatItemName(firstItem.itemId)}`);
  }
  if ((rewardResult?.silver || 0) > 0) {
    parts.push(`${rewardResult.silver} silver`);
  }
  return parts.join(" and ") || "the roots settle";
}

function formatItemName(itemId) {
  return ITEM_DEFS[itemId]?.name || itemId.replaceAll("_", " ");
}

function update(dt) {
  if (fatalError) {
    return;
  }

  try {
    state.time += dt;
    state.shake = Math.max(0, state.shake - 30 * dt);
    updateMouseWorld();
    updateAudio(state, input);

    if (isFrontendMode(state.mode)) {
      handleFrontendInput();
      updateCamera(dt);
      return;
    }

    const clockResult = updateClock(state.clock, dt, {
      paused:
        state.transition.active ||
        state.gameOver ||
        Boolean(state.story.dialogue) ||
        Boolean(state.story.questPanel) ||
        isUiOpen(),
    });
    if (clockResult.reachedDayEnd) {
      setToast("It is 02:00. The day will wait until Ayla can rest at home.", 4);
      saveCurrentGame();
    }

    updateStoryRuntime(state, dt);
    updateInteractionState();

    if (
      state.pendingArenaRefresh &&
      !state.story.dialogue &&
      !state.story.questPanel &&
      !state.transition.active &&
      !isUiOpen()
    ) {
      state.pendingArenaRefresh = false;
      applySceneState(state.currentSceneId, state.currentEntryId || "default");
      saveCurrentGame();
      return;
    }

    if (state.gameOver) {
      state.mode = GAME_MODES.GAME_OVER;
    } else if (state.mode !== GAME_MODES.PLAYING) {
      state.mode = GAME_MODES.PLAYING;
    }

    if (state.transition.active) {
      updateTransition(dt);
      updateCamera(dt);
      return;
    }

    const hitStopActive = state.hitStop > 0;
    state.hitStop = Math.max(0, state.hitStop - dt);
    const simulationDt = hitStopActive ? 0 : dt;

    state.player.tick(simulationDt);

    const uiConsumed = handleUiInput();
    const interactionBlocked = handleInteractionInput();
    const gameplayBlocked = uiConsumed || interactionBlocked || isUiOpen();

    if (!state.gameOver && !gameplayBlocked) {
      if (!hitStopActive) {
        handlePlayerAbilities(state, input);
      }
      state.player.move(simulationDt, input, state);
      updateCombatEffects(state, simulationDt, dt);
      updateEnvironment(state, simulationDt);

      for (const enemy of state.enemies) {
        enemy.update(simulationDt, state);
      }

      state.enemies = state.enemies.filter((enemy) => !enemy.dead);
      const trainingResult = updateTrainingDrill(state, simulationDt);
      if (trainingResult) {
        const drillLabel =
          trainingResult.mode === "target-circle"
            ? "Target Circle"
            : trainingResult.mode === "elite-pattern"
              ? "Veil Drill"
              : "Steady Target";
        setToast(
          trainingResult.mode === "elite-pattern"
            ? `${drillLabel} complete: ${trainingResult.dodges} dodged, ${trainingResult.patternHits} caught, ${trainingResult.dps} DPS.`
            : `${drillLabel} complete: ${trainingResult.dps} DPS, ${trainingResult.damage} damage, ${trainingResult.hits} hits.`,
          4
        );
        queueAudio(state, "quest");
        saveCurrentGame();
      }
      resolveEnemyCrowding(state);
      updateEncounter(state, simulationDt);
      consumeStoryEvents(state);
    }

    updateCombatPresence(dt);

    if (state.areaCleared) {
      handleSceneCleared();
    }

    updateExitCharge(dt);
    updateParticles(state, simulationDt);
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
    state.journalQuests = getJournalQuestEntries(state.progression);
    const selectedJournalQuest =
      state.journalQuests[
        Math.max(
          0,
          Math.min(
            state.journalQuests.length - 1,
            state.ui.selectedQuestIndex || 0
          )
        )
      ];
    const journalChapter =
      selectedJournalQuest?.chapter ||
      state.progression.campaign?.activeChapter ||
      "heartwood";
    state.bestiaryEntries = getBestiaryEntries(
      state.progression,
      journalChapter
    );
    state.navigation = getCampaignNavigation(
      state.progression,
      state.sceneProgress,
      state.currentSceneId,
      state.clock.day
    );
    state.regionJournal = getRegionJournalView(
      state.progression,
      state.sceneProgress,
      state.currentSceneId,
      journalChapter,
      state.clock.day
    );
    if (isFrontendMode(state.mode)) {
      renderGame(ctx, state, {
        showHud: state.mode === GAME_MODES.PAUSED || state.mode === GAME_MODES.GAME_OVER,
      });
      renderFrontendScreen(ctx, state);
      return;
    }

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
window.addEventListener("beforeunload", () => {
  saveCurrentGame();
});
document.addEventListener("fullscreenchange", () => {
  updateSettings({ fullscreen: Boolean(document.fullscreenElement) });
});

resizeCanvas();
updateQuestAvailability(state);
refreshQuestStates(state);
updateMouseWorld();

window.__heartOfForestDebug = {
  getState: () => state,
  getClock: () => serializeClock(state.clock),
  setClock(hour, minute = 0) {
    return setClockTime(state.clock, hour, minute);
  },
  nextDay() {
    const snapshot = startNextDay(state.clock);
    setToast(`Day ${state.clock.day} begins at dawn.`, 2.4);
    saveCurrentGame();
    return snapshot;
  },
  sleep() {
    return startSleepTransition();
  },
  travelTo(sceneId, entryId = "default") {
    if (!SCENES[sceneId]) return false;
    applySceneState(sceneId, entryId);
    return true;
  },
  newGame: startNewGame,
  continueGame: () => loadStateFromSave(loadSave()),
  save: saveCurrentGame,
  reloadCurrentScene,
};

startGameLoop({ update, render, input });

import { INITIAL_SCENE_ID, SCENES } from "../data/sceneNetwork.js";
import { createClock, serializeClock } from "./clock.js";

const SAVE_KEY = "heart-of-forest-save";
const SETTINGS_KEY = "heart-of-forest-settings";
const ACTIVE_SLOT_KEY = "heart-of-forest-active-slot";
const SAVE_VERSION = "0.4.0";
const SAVE_SLOT_COUNT = 3;
let invalidSaveWarned = false;

export function getDefaultSettings() {
  return {
    musicVolume: 0.7,
    sfxVolume: 0.8,
    screenShake: 0.65,
    damageNumbers: true,
    fullscreen: false,
    uiScale: 1,
    reducedMotion: false,
    highContrast: false,
    controllerVibration: true,
    aimSensitivity: 1,
    showTutorialHints: true,
  };
}

export function createDefaultSave() {
  return {
    version: SAVE_VERSION,
    player: {
      x: 0,
      y: 0,
      hp: 100,
      maxHp: 100,
      spirit: 65,
      maxSpirit: 65,
      level: 1,
      xp: 0,
      heartCharge: 0,
    },
    world: {
      currentMap: INITIAL_SCENE_ID,
      currentEntryId: "default",
      unlockedMaps: [INITIAL_SCENE_ID],
      defeatedBosses: [],
      completedEvents: [],
      sceneProgress: {},
    },
    inventory: {
      potions: {
        health_potion: 3,
        spirit_tonic: 1,
      },
      items: {},
      stash: {},
      equipment: {},
      actionSlots: [],
      silver: 0,
    },
    calendar: serializeClock(createClock()),
    progression: null,
    ui: null,
    runtimeSnapshot: null,
    savedAt: Date.now(),
  };
}

export function hasSave(slot = getActiveSaveSlot()) {
  return Boolean(loadSave(slot));
}

export function getActiveSaveSlot() {
  if (!canUseStorage()) return 1;
  return normalizeSlot(localStorage.getItem(ACTIVE_SLOT_KEY));
}

export function setActiveSaveSlot(slot) {
  const normalized = normalizeSlot(slot);
  if (!canUseStorage()) return normalized;
  localStorage.setItem(ACTIVE_SLOT_KEY, String(normalized));
  invalidSaveWarned = false;
  return normalized;
}

export function getSaveSlotSummaries() {
  return Array.from({ length: SAVE_SLOT_COUNT }, (_, index) => {
    const slot = index + 1;
    const save = loadSave(slot, { recoverFromBackup: true, warn: false });
    if (!save) {
      return {
        slot,
        empty: true,
        savedAt: 0,
        level: 1,
        day: 1,
        sceneId: INITIAL_SCENE_ID,
      };
    }

    return {
      slot,
      empty: false,
      savedAt: save.savedAt || 0,
      level: save.player?.level || save.progression?.level || 1,
      day: save.calendar?.day || 1,
      sceneId: save.world?.currentMap || save.runtimeSnapshot?.currentSceneId || INITIAL_SCENE_ID,
    };
  });
}

export function loadSave(
  slot = getActiveSaveSlot(),
  { recoverFromBackup = true, warn = true } = {}
) {
  const normalizedSlot = normalizeSlot(slot);
  const key = getSaveKey(normalizedSlot);
  const raw = readStoredJson(key, `save slot ${normalizedSlot}`, warn);
  const normalized = raw ? normalizeSave(migrateLegacySnapshot(raw)) : null;

  if (normalized) {
    invalidSaveWarned = false;
    return normalized;
  }

  if (recoverFromBackup) {
    const backupRaw = readStoredJson(
      getBackupSaveKey(normalizedSlot),
      `backup save slot ${normalizedSlot}`,
      false
    );
    const backup = backupRaw ? normalizeSave(migrateLegacySnapshot(backupRaw)) : null;
    if (backup) {
      if (warn) {
        console.warn(
          `[Heart of Forest] Recovered save slot ${normalizedSlot} from backup.`
        );
      }
      invalidSaveWarned = false;
      return backup;
    }
  }

  if (raw && warn) {
    warnInvalidSave(`Stored save slot ${normalizedSlot} is corrupt or incomplete.`);
  }
  return null;
}

export function saveGame(gameData, slot = getActiveSaveSlot()) {
  if (!canUseStorage()) return false;
  const normalizedSlot = normalizeSlot(slot);
  const normalized = normalizeSave({
    ...gameData,
    version: SAVE_VERSION,
    savedAt: Date.now(),
  });

  if (!normalized) {
    console.warn("[Heart of Forest] Refused to save invalid game data.");
    return false;
  }

  const key = getSaveKey(normalizedSlot);
  const previousRaw = localStorage.getItem(key);
  if (previousRaw) {
    const previous = parseStoredJson(previousRaw);
    if (previous && normalizeSave(migrateLegacySnapshot(previous))) {
      localStorage.setItem(getBackupSaveKey(normalizedSlot), previousRaw);
    }
  }

  localStorage.setItem(key, JSON.stringify(normalized));
  invalidSaveWarned = false;
  return true;
}

export function deleteSave(slot = getActiveSaveSlot(), { includeBackup = true } = {}) {
  if (!canUseStorage()) return;
  const normalizedSlot = normalizeSlot(slot);
  localStorage.removeItem(getSaveKey(normalizedSlot));
  if (includeBackup) {
    localStorage.removeItem(getBackupSaveKey(normalizedSlot));
  }
  invalidSaveWarned = false;
}

export function restoreBackup(slot = getActiveSaveSlot()) {
  if (!canUseStorage()) return false;
  const normalizedSlot = normalizeSlot(slot);
  const backupKey = getBackupSaveKey(normalizedSlot);
  const backupRaw = localStorage.getItem(backupKey);
  if (!backupRaw) return false;

  const parsed = parseStoredJson(backupRaw);
  const normalized = parsed ? normalizeSave(migrateLegacySnapshot(parsed)) : null;
  if (!normalized) return false;

  localStorage.setItem(getSaveKey(normalizedSlot), JSON.stringify(normalized));
  invalidSaveWarned = false;
  return true;
}

export function loadSettings() {
  const defaults = getDefaultSettings();
  const raw = readStoredJson(SETTINGS_KEY, "settings");
  if (!raw) return defaults;

  return normalizeSettings(raw, defaults);
}

export function saveSettings(settings) {
  if (!canUseStorage()) return false;
  const normalized = normalizeSettings(settings);
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
  return true;
}

export function loadSnapshot() {
  return loadSave()?.runtimeSnapshot || null;
}

export function saveSnapshot(snapshot) {
  return saveGame(migrateLegacySnapshot(snapshot));
}

export function clearSnapshot() {
  deleteSave();
}

function canUseStorage() {
  return typeof localStorage !== "undefined";
}

function normalizeSlot(slot) {
  const numeric = Math.floor(Number(slot) || 1);
  return Math.min(SAVE_SLOT_COUNT, Math.max(1, numeric));
}

function getSaveKey(slot) {
  return slot === 1 ? SAVE_KEY : `${SAVE_KEY}-slot-${slot}`;
}

function getBackupSaveKey(slot) {
  return `${getSaveKey(slot)}-backup`;
}

function parseStoredJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readStoredJson(key, label, warn = true) {
  if (!canUseStorage()) return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    if (warn) {
      warnInvalidSave(`Failed to parse ${label} JSON.`, error);
    }
    return null;
  }
}

function warnInvalidSave(message, error = null) {
  if (invalidSaveWarned) return;
  invalidSaveWarned = true;
  console.warn(`[Heart of Forest] ${message}`, error || "");
}

function normalizeSettings(rawSettings, defaults = getDefaultSettings()) {
  return {
    musicVolume: clampUnit(rawSettings?.musicVolume, defaults.musicVolume),
    sfxVolume: clampUnit(rawSettings?.sfxVolume, defaults.sfxVolume),
    screenShake: clampUnit(rawSettings?.screenShake, defaults.screenShake),
    damageNumbers: rawSettings?.damageNumbers !== false,
    fullscreen: Boolean(rawSettings?.fullscreen),
    uiScale: clampRange(rawSettings?.uiScale, defaults.uiScale, 0.8, 1.35),
    reducedMotion: Boolean(rawSettings?.reducedMotion),
    highContrast: Boolean(rawSettings?.highContrast),
    controllerVibration: rawSettings?.controllerVibration !== false,
    aimSensitivity: clampRange(rawSettings?.aimSensitivity, defaults.aimSensitivity, 0.5, 1.75),
    showTutorialHints: rawSettings?.showTutorialHints !== false,
  };
}

function migrateLegacySnapshot(raw) {
  if (!isObject(raw)) return raw;
  if (raw.version && raw.player && raw.world && raw.inventory) {
    return raw;
  }

  if (!raw.progression || !raw.currentSceneId) {
    return raw;
  }

  const currentSceneId = SCENES[raw.currentSceneId] ? raw.currentSceneId : INITIAL_SCENE_ID;
  const progression = raw.progression || {};
  const inventory = isObject(progression.inventory) ? progression.inventory : {};
  const sceneProgress = isObject(raw.sceneProgress) ? raw.sceneProgress : {};

  return {
    version: SAVE_VERSION,
    player: {
      x: numberOr(raw.playerVitals?.x, 0),
      y: numberOr(raw.playerVitals?.y, 0),
      hp: numberOr(raw.playerVitals?.hp, 100),
      maxHp: numberOr(progression.maxHp, 100),
      spirit: numberOr(raw.playerVitals?.spirit, 65),
      maxSpirit: numberOr(progression.maxSpirit, 65),
      level: Math.max(1, integerOr(progression.level, 1)),
      xp: Math.max(0, integerOr(progression.xp, 0)),
      heartCharge: Math.max(0, Math.min(100, numberOr(raw.playerVitals?.heartCharge, 0))),
    },
    world: {
      currentMap: currentSceneId,
      currentEntryId: raw.currentEntryId || "default",
      unlockedMaps: collectUnlockedMaps(currentSceneId, sceneProgress),
      defeatedBosses: collectDefeatedBosses(sceneProgress),
      completedEvents: collectCompletedEvents(sceneProgress, progression.worldFlags),
      sceneProgress,
    },
    inventory: {
      potions: pickPotions(inventory),
      items: inventory,
      stash: progression.stash || {},
      equipment: progression.equipment || {},
      actionSlots: progression.actionSlots || [],
      silver: Math.max(0, integerOr(progression.silver, 0)),
    },
    progression,
    calendar: serializeClock(createClock()),
    ui: raw.ui || null,
    runtimeSnapshot: {
      progression,
      sceneProgress,
      currentSceneId,
      currentEntryId: raw.currentEntryId || "default",
      playerVitals: raw.playerVitals || null,
      clock: serializeClock(createClock()),
      ui: raw.ui || null,
    },
    savedAt: Date.now(),
  };
}

function normalizeSave(rawSave) {
  if (!isObject(rawSave)) return null;

  const defaults = createDefaultSave();
  const player = normalizePlayer(rawSave.player, defaults.player);
  const world = normalizeWorld(rawSave.world, defaults.world);
  const inventory = normalizeInventory(rawSave.inventory, defaults.inventory);
  const calendar = serializeClock(
    createClock(rawSave.calendar || rawSave.runtimeSnapshot?.clock || defaults.calendar)
  );

  if (!player || !world || !inventory) return null;

  return {
    version: typeof rawSave.version === "string" ? rawSave.version : SAVE_VERSION,
    player,
    world,
    inventory,
    calendar,
    progression: isObject(rawSave.progression) ? rawSave.progression : null,
    ui: isObject(rawSave.ui) ? rawSave.ui : null,
    runtimeSnapshot: normalizeRuntimeSnapshot(
      rawSave.runtimeSnapshot,
      player,
      world,
      inventory,
      calendar,
      rawSave
    ),
    savedAt: integerOr(rawSave.savedAt, Date.now()),
  };
}

function normalizePlayer(rawPlayer, defaults) {
  if (!isObject(rawPlayer)) return null;

  return {
    x: numberOr(rawPlayer.x, defaults.x),
    y: numberOr(rawPlayer.y, defaults.y),
    hp: Math.max(1, numberOr(rawPlayer.hp, defaults.hp)),
    maxHp: Math.max(1, numberOr(rawPlayer.maxHp, defaults.maxHp)),
    spirit: Math.max(0, numberOr(rawPlayer.spirit, defaults.spirit)),
    maxSpirit: Math.max(0, numberOr(rawPlayer.maxSpirit, defaults.maxSpirit)),
    level: Math.max(1, integerOr(rawPlayer.level, defaults.level)),
    xp: Math.max(0, integerOr(rawPlayer.xp, defaults.xp)),
    heartCharge: Math.max(0, Math.min(100, numberOr(rawPlayer.heartCharge, defaults.heartCharge || 0))),
  };
}

function normalizeWorld(rawWorld, defaults) {
  if (!isObject(rawWorld)) return null;

  const currentMap = typeof rawWorld.currentMap === "string" && SCENES[rawWorld.currentMap]
    ? rawWorld.currentMap
    : defaults.currentMap;

  return {
    currentMap,
    currentEntryId: typeof rawWorld.currentEntryId === "string" ? rawWorld.currentEntryId : defaults.currentEntryId,
    unlockedMaps: sanitizeSceneList(rawWorld.unlockedMaps, [currentMap]),
    defeatedBosses: sanitizeStringList(rawWorld.defeatedBosses),
    completedEvents: sanitizeStringList(rawWorld.completedEvents),
    sceneProgress: isObject(rawWorld.sceneProgress) ? rawWorld.sceneProgress : {},
  };
}

function normalizeInventory(rawInventory, defaults) {
  if (!isObject(rawInventory)) return null;

  return {
    potions: normalizeCountMap(rawInventory.potions, defaults.potions),
    items: normalizeCountMap(rawInventory.items, defaults.items),
    stash: normalizeCountMap(rawInventory.stash, defaults.stash),
    equipment: isObject(rawInventory.equipment) ? rawInventory.equipment : {},
    actionSlots: Array.isArray(rawInventory.actionSlots) ? rawInventory.actionSlots.slice(0, 3) : [],
    silver: Math.max(0, integerOr(rawInventory.silver, defaults.silver)),
  };
}

function normalizeRuntimeSnapshot(runtimeSnapshot, player, world, inventory, calendar, rawSave) {
  if (isObject(runtimeSnapshot)) {
    return {
      ...runtimeSnapshot,
      clock: serializeClock(createClock(runtimeSnapshot.clock || calendar)),
    };
  }

  const progression = isObject(rawSave.progression) ? rawSave.progression : {
    inventory: inventory.items,
    stash: inventory.stash,
    equipment: inventory.equipment,
    actionSlots: inventory.actionSlots,
    silver: inventory.silver,
    level: player.level,
    xp: player.xp,
  };

  return {
    progression,
    sceneProgress: world.sceneProgress,
    currentSceneId: world.currentMap,
    currentEntryId: world.currentEntryId,
    playerVitals: {
      x: player.x,
      y: player.y,
      hp: player.hp,
      spirit: player.spirit,
      maxHp: player.maxHp,
      maxSpirit: player.maxSpirit,
      heartCharge: player.heartCharge || 0,
    },
    clock: serializeClock(createClock(calendar)),
    ui: isObject(rawSave.ui) ? rawSave.ui : null,
  };
}

function normalizeCountMap(rawMap, defaults = {}) {
  const normalized = {};
  for (const [key, value] of Object.entries(defaults || {})) {
    const count = Math.max(0, integerOr(value, 0));
    if (count > 0) normalized[key] = count;
  }

  for (const [key, value] of Object.entries(rawMap || {})) {
    const count = Math.max(0, integerOr(value, 0));
    if (count > 0) normalized[key] = count;
  }

  return normalized;
}

function sanitizeSceneList(values, fallback = []) {
  const sceneIds = new Set(fallback);
  for (const value of values || []) {
    if (typeof value === "string" && SCENES[value]) {
      sceneIds.add(value);
    }
  }
  return [...sceneIds];
}

function sanitizeStringList(values) {
  if (!Array.isArray(values)) return [];
  return values.filter((value) => typeof value === "string");
}

function collectUnlockedMaps(currentSceneId, sceneProgress) {
  const unlocked = new Set([INITIAL_SCENE_ID, currentSceneId]);
  for (const sceneId of Object.keys(sceneProgress || {})) {
    if (SCENES[sceneId]) unlocked.add(sceneId);
  }
  return [...unlocked];
}

function collectDefeatedBosses(sceneProgress) {
  return Object.entries(sceneProgress || {})
    .filter(([sceneId, progress]) => SCENES[sceneId]?.bossEnabled && progress?.cleared)
    .map(([sceneId]) => sceneId);
}

function collectCompletedEvents(sceneProgress, worldFlags) {
  const events = [];

  for (const [sceneId, progress] of Object.entries(sceneProgress || {})) {
    if (progress?.cleared) {
      events.push(`${sceneId}:cleared`);
    }

    for (const objectId of Object.keys(progress?.objectStates || {})) {
      events.push(`${sceneId}:${objectId}`);
    }
  }

  for (const [flag, enabled] of Object.entries(worldFlags || {})) {
    if (enabled) events.push(`flag:${flag}`);
  }

  return events;
}

function pickPotions(inventory) {
  const potionIds = ["health_potion", "spirit_tonic", "greater_health_potion", "ward_elixir"];
  return Object.fromEntries(
    potionIds
      .map((itemId) => [itemId, Math.max(0, integerOr(inventory?.[itemId], 0))])
      .filter(([, count]) => count > 0)
  );
}

function clampUnit(value, fallback) {
  return clampRange(value, fallback, 0, 1);
}

function clampRange(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function numberOr(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function integerOr(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.floor(number) : fallback;
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

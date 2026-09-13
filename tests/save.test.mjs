import test from "node:test";
import assert from "node:assert/strict";

const storage = new Map();
globalThis.localStorage = {
  getItem(key) {
    return storage.has(key) ? storage.get(key) : null;
  },
  setItem(key, value) {
    storage.set(key, String(value));
  },
  removeItem(key) {
    storage.delete(key);
  },
};

const {
  getActiveSaveSlot,
  getSaveSlotSummaries,
  loadSave,
  loadSettings,
  restoreBackup,
  saveGame,
  saveSettings,
  setActiveSaveSlot,
} = await import("../systems/save.js");

test("legacy 0.1 save gains a normalized day clock", () => {
  storage.set(
    "heart-of-forest-save",
    JSON.stringify({
      version: "0.1.0",
      player: {
        x: 0,
        y: 0,
        hp: 100,
        maxHp: 100,
        spirit: 65,
        maxSpirit: 65,
        level: 1,
        xp: 0,
      },
      world: {
        currentMap: "whispering_woods",
        currentEntryId: "default",
        unlockedMaps: ["whispering_woods"],
        defeatedBosses: [],
        completedEvents: [],
        sceneProgress: {},
      },
      inventory: {
        potions: {},
        items: {},
        stash: {},
        equipment: {},
        actionSlots: [],
        silver: 0,
      },
      progression: {},
      ui: null,
      runtimeSnapshot: {
        progression: {},
        sceneProgress: {},
        currentSceneId: "whispering_woods",
        currentEntryId: "default",
        playerVitals: { hp: 100, spirit: 65 },
        ui: null,
      },
      savedAt: 1,
    })
  );

  const save = loadSave(1);
  assert.equal(save.calendar.day, 1);
  assert.equal(save.calendar.minuteOfDay, 360);
  assert.deepEqual(save.runtimeSnapshot.clock, save.calendar);
});

test("saving writes version 0.4.0 and keeps clock progress", () => {
  const legacy = loadSave(1);
  legacy.calendar = { day: 3, minuteOfDay: 1080, realDaySeconds: 900 };
  legacy.runtimeSnapshot.clock = legacy.calendar;

  assert.equal(saveGame(legacy, 1), true);

  const saved = JSON.parse(storage.get("heart-of-forest-save"));
  assert.equal(saved.version, "0.4.0");
  assert.equal(saved.calendar.day, 3);
  assert.equal(saved.runtimeSnapshot.clock.minuteOfDay, 1080);
});

test("legacy settings gain readable combat and accessibility defaults", () => {
  storage.set(
    "heart-of-forest-settings",
    JSON.stringify({ musicVolume: 0.4, sfxVolume: 0.5, fullscreen: false })
  );

  const settings = loadSettings();
  assert.equal(settings.screenShake, 0.65);
  assert.equal(settings.damageNumbers, true);
  assert.equal(settings.uiScale, 1);
  assert.equal(settings.reducedMotion, false);
  assert.equal(settings.controllerVibration, true);

  settings.screenShake = 0.2;
  settings.uiScale = 1.2;
  assert.equal(saveSettings(settings), true);
  const persisted = JSON.parse(storage.get("heart-of-forest-settings"));
  assert.equal(persisted.screenShake, 0.2);
  assert.equal(persisted.uiScale, 1.2);
});

test("three save slots remain isolated and expose summaries", () => {
  const slotOne = loadSave(1);
  slotOne.player.level = 4;
  slotOne.world.currentMap = "mossy_ruins";
  assert.equal(saveGame(slotOne, 1), true);

  const slotTwo = structuredClone(slotOne);
  slotTwo.player.level = 8;
  slotTwo.world.currentMap = "frostveil_tundra";
  slotTwo.runtimeSnapshot.currentSceneId = "frostveil_tundra";
  assert.equal(saveGame(slotTwo, 2), true);

  setActiveSaveSlot(2);
  assert.equal(getActiveSaveSlot(), 2);
  assert.equal(loadSave().player.level, 8);
  assert.equal(loadSave(1).player.level, 4);

  const summaries = getSaveSlotSummaries();
  assert.equal(summaries.length, 3);
  assert.equal(summaries[0].level, 4);
  assert.equal(summaries[1].level, 8);
  assert.equal(summaries[2].empty, true);

  setActiveSaveSlot(1);
});

test("save writes a recoverable backup before overwriting a slot", () => {
  const first = loadSave(1);
  first.player.level = 5;
  assert.equal(saveGame(first, 1), true);

  const second = structuredClone(first);
  second.player.level = 6;
  assert.equal(saveGame(second, 1), true);

  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => {
    warnings.push(args.map((value) => String(value)).join(" "));
  };

  try {
    storage.set("heart-of-forest-save", "{broken json");
    assert.equal(loadSave(1).player.level, 5);
  } finally {
    console.warn = originalWarn;
  }

  assert.ok(
    warnings.some((warning) => warning.includes("Failed to parse save slot 1 JSON")),
    "corrupt primary should emit the expected parse warning"
  );
  assert.ok(
    warnings.some((warning) => warning.includes("Recovered save slot 1 from backup")),
    "backup recovery should emit the expected recovery warning"
  );

  assert.equal(restoreBackup(1), true);
  assert.equal(loadSave(1).player.level, 5);
});

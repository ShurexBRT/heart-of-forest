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

const { loadSave, loadSettings, saveGame, saveSettings } = await import("../systems/save.js");

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

  const save = loadSave();
  assert.equal(save.calendar.day, 1);
  assert.equal(save.calendar.minuteOfDay, 360);
  assert.deepEqual(save.runtimeSnapshot.clock, save.calendar);
});

test("saving writes version 0.4.0 and keeps clock progress", () => {
  const legacy = loadSave();
  legacy.calendar = { day: 3, minuteOfDay: 1080, realDaySeconds: 900 };
  legacy.runtimeSnapshot.clock = legacy.calendar;

  assert.equal(saveGame(legacy), true);

  const saved = JSON.parse(storage.get("heart-of-forest-save"));
  assert.equal(saved.version, "0.4.0");
  assert.equal(saved.calendar.day, 3);
  assert.equal(saved.runtimeSnapshot.clock.minuteOfDay, 1080);
});

test("legacy settings gain readable combat defaults", () => {
  storage.set(
    "heart-of-forest-settings",
    JSON.stringify({ musicVolume: 0.4, sfxVolume: 0.5, fullscreen: false })
  );

  const settings = loadSettings();
  assert.equal(settings.screenShake, 0.65);
  assert.equal(settings.damageNumbers, true);

  settings.screenShake = 0.2;
  assert.equal(saveSettings(settings), true);
  assert.equal(JSON.parse(storage.get("heart-of-forest-settings")).screenShake, 0.2);
});

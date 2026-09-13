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

const { createDefaultSave, loadSave, saveGame } = await import("../systems/save.js");
const { repairSaveSlotFromBackup } = await import("../systems/saveRecovery.js");

test("repair helper restores a corrupt primary from its last valid backup", () => {
  const first = createDefaultSave();
  first.player.level = 5;
  assert.equal(saveGame(first, 1), true);

  const second = structuredClone(first);
  second.player.level = 6;
  assert.equal(saveGame(second, 1), true);

  storage.set("heart-of-forest-save", "{corrupt primary");

  const repair = repairSaveSlotFromBackup(1);
  assert.equal(repair.repaired, true);
  assert.equal(repair.reason, "backup-restored");
  assert.equal(repair.save.player.level, 5);
  assert.equal(loadSave(1, { recoverFromBackup: false, warn: false }).player.level, 5);
});

test("repair helper leaves a valid primary untouched", () => {
  const current = createDefaultSave();
  current.player.level = 9;
  assert.equal(saveGame(current, 2), true);

  const repair = repairSaveSlotFromBackup(2);
  assert.equal(repair.repaired, false);
  assert.equal(repair.reason, "primary-valid");
  assert.equal(repair.save.player.level, 9);
});

test("empty slot does not pretend recovery succeeded", () => {
  storage.delete("heart-of-forest-save-slot-3");
  storage.delete("heart-of-forest-save-slot-3-backup");

  const repair = repairSaveSlotFromBackup(3);
  assert.equal(repair.repaired, false);
  assert.equal(repair.reason, "no-valid-backup");
  assert.equal(repair.save, null);
});

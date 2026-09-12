import {
  getActiveSaveSlot,
  loadSave,
  restoreBackup,
} from "./save.js";

export function repairSaveSlotFromBackup(slot = getActiveSaveSlot()) {
  const primary = loadSave(slot, {
    recoverFromBackup: false,
    warn: false,
  });

  if (primary) {
    return {
      repaired: false,
      slot,
      reason: "primary-valid",
      save: primary,
    };
  }

  if (!restoreBackup(slot)) {
    return {
      repaired: false,
      slot,
      reason: "no-valid-backup",
      save: null,
    };
  }

  const restored = loadSave(slot, {
    recoverFromBackup: false,
    warn: false,
  });

  return {
    repaired: Boolean(restored),
    slot,
    reason: restored ? "backup-restored" : "restore-failed",
    save: restored,
  };
}

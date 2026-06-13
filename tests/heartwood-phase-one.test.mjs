import test from "node:test";
import assert from "node:assert/strict";

import { getBestiaryEntries } from "../systems/bestiary.js";
import {
  activateLoadout,
  createProgression,
  saveLoadout,
  unequipItem,
} from "../systems/progression.js";
import { getJournalQuestEntries } from "../systems/story.js";
import {
  createTrainingState,
  recordTrainingDamage,
  startTrainingDrill,
  updateTrainingDrill,
} from "../systems/training.js";

test("Heartwood Journal includes archived quests and reveals field clues progressively", () => {
  const progression = createProgression({
    questStates: {
      wake_hearthroot: "done",
      first_moonleaf: "done",
      thorn_at_gate: "active",
      first_rootwarden: "inactive",
    },
    questCounters: {
      gateThreatsDefeated: 1,
    },
  });

  const journal = getJournalQuestEntries(progression);
  assert.ok(journal.some((quest) => quest.id === "wake_hearthroot" && quest.status === "done"));
  assert.ok(journal.some((quest) => quest.id === "thorn_at_gate" && quest.status === "active"));

  const bestiary = getBestiaryEntries(progression, "heartwood");
  const thornling = bestiary.find((entry) => entry.id === "thornling");
  const rootwarden = bestiary.find((entry) => entry.id === "rootwarden");
  assert.equal(thornling.discovered, true);
  assert.equal(thornling.visibleClues, 1);
  assert.equal(rootwarden.discovered, false);
});

test("Grove Loadout restores recorded equipment without duplicating it", () => {
  const progression = createProgression({
    campaign: { loadoutSlots: 1 },
  });

  assert.equal(saveLoadout(progression, 0).saved, true);
  assert.equal(unequipItem(progression, "trinket"), true);
  assert.equal(progression.inventory.warden_brooch, 1);
  assert.equal(activateLoadout(progression, 0).activated, true);
  assert.equal(progression.equipment.trinket, "warden_brooch");
  assert.equal(progression.inventory.warden_brooch || 0, 0);
});

test("Training Grove records DPS and never resolves through enemy rewards", () => {
  const interactable = { id: "training-grove-dummy", disabled: false };
  const state = {
    training: createTrainingState(),
    enemies: [],
    arena: { interactables: [interactable] },
    progression: createProgression(),
  };

  assert.equal(
    startTrainingDrill(state, interactable.id, 100, 100).started,
    true
  );
  assert.equal(interactable.disabled, true);
  const dummy = state.enemies[0];
  assert.equal(recordTrainingDamage(state, dummy, 100), true);
  assert.equal(updateTrainingDrill(state, 10), null);
  assert.equal(recordTrainingDamage(state, dummy, 200), true);
  const result = updateTrainingDrill(state, 10);

  assert.equal(result.damage, 300);
  assert.equal(result.dps, 15);
  assert.equal(state.enemies.length, 0);
  assert.equal(interactable.disabled, false);
  assert.equal(state.progression.trainingStats.bestDps, 15);
  assert.equal(state.progression.trainingStats.drillsCompleted, 1);
});

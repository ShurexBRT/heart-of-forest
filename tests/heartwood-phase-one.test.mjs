import test from "node:test";
import assert from "node:assert/strict";

import { getBestiaryEntries } from "../systems/bestiary.js";
import {
  activateLoadout,
  createProgression,
  saveLoadout,
  unequipItem,
} from "../systems/progression.js";
import { syncCampaignProgress } from "../systems/campaign.js";
import { getJournalQuestEntries } from "../systems/story.js";
import {
  createTrainingState,
  recordTrainingDamage,
  startTrainingDrill,
  updateTrainingDrill,
} from "../systems/training.js";
import {
  getCampaignNavigation,
  getRegionJournalView,
} from "../systems/navigation.js";

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

test("Stillwater navigation points to the remaining seal and then the Matron's memory", () => {
  const progression = createProgression({
    worldFlags: { heartwood_restored: true },
    questStates: {
      first_rootwarden: "done",
      bogbound_rot: "done",
      tidebound_threshold: "active",
    },
  });
  const sceneProgress = {
    mossroot_marsh: {
      objectStates: { "tide-seal-1": true },
    },
  };
  syncCampaignProgress(progression, sceneProgress);

  let navigation = getCampaignNavigation(
    progression,
    sceneProgress,
    "mossroot_marsh"
  );
  assert.deepEqual(navigation.targetSceneIds, ["mossy_ruins"]);

  progression.questStates.tidebound_threshold = "done";
  progression.questStates.chapel_of_tides = "done";
  progression.questStates.stillwater_homecoming = "inactive";
  navigation = getCampaignNavigation(
    progression,
    sceneProgress,
    "chapel_of_tides"
  );
  assert.deepEqual(navigation.targetSceneIds, ["chapel_of_tides"]);

  progression.questCounters.tideMemoryRecovered = 1;
  navigation = getCampaignNavigation(
    progression,
    sceneProgress,
    "chapel_of_tides"
  );
  assert.deepEqual(navigation.targetSceneIds, ["mossroot_marsh"]);

  const journal = getRegionJournalView(
    progression,
    sceneProgress,
    "chapel_of_tides",
    "stillwater"
  );
  assert.equal(journal.name, "Stillwater");
  assert.equal(journal.navigation.targetLabel, "Moonlit Marsh");
});

test("Stillwater Bestiary reveals enemy roles before full counter advice", () => {
  const progression = createProgression({
    questStates: {
      bogbound_rot: "active",
      chapel_of_tides: "inactive",
    },
    questCounters: {
      enemy_mire_spitter_defeated: 1,
      enemy_bog_lurker_defeated: 3,
    },
  });
  const entries = getBestiaryEntries(progression, "stillwater");
  const spitter = entries.find((entry) => entry.id === "mire_spitter");
  const lurker = entries.find((entry) => entry.id === "bog_lurker");
  const matron = entries.find((entry) => entry.id === "bog_matron");

  assert.equal(spitter.discovered, true);
  assert.equal(spitter.mastered, false);
  assert.equal(spitter.visibleClues, 1);
  assert.equal(lurker.mastered, true);
  assert.equal(lurker.visibleClues, 2);
  assert.equal(matron.discovered, false);
});

test("Target Circle tracks three training targets and a per-mode best", () => {
  const interactable = { id: "training-grove-cluster", disabled: false };
  const state = {
    training: createTrainingState(),
    enemies: [],
    arena: { interactables: [interactable] },
    progression: createProgression(),
  };

  assert.equal(
    startTrainingDrill(
      state,
      interactable.id,
      400,
      400,
      "target-circle"
    ).started,
    true
  );
  assert.equal(state.enemies.length, 3);
  state.enemies.forEach((dummy) => recordTrainingDamage(state, dummy, 100));
  const result = updateTrainingDrill(state, 20);

  assert.equal(result.mode, "target-circle");
  assert.equal(result.damage, 300);
  assert.equal(state.progression.trainingStats.bestDpsByMode["target-circle"], 15);
});

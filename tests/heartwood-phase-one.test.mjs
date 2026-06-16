import test from "node:test";
import assert from "node:assert/strict";

import { getBestiaryEntries } from "../systems/bestiary.js";
import {
  activateLoadout,
  createProgression,
  equipItem,
  getLoadoutEntries,
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

test("First Moonleaf navigation advances through plant, water, rest, and harvest", () => {
  const progression = createProgression({
    worldFlags: { hearthroot_awake: true },
    questStates: {
      wake_hearthroot: "done",
      first_moonleaf: "active",
    },
  });

  let navigation = getCampaignNavigation(
    progression,
    {},
    "ayla_homestead"
  );
  assert.match(navigation.hint, /Plant one/i);

  progression.questCounters.moonleafPlanted = 1;
  navigation = getCampaignNavigation(progression, {}, "ayla_homestead");
  assert.match(navigation.hint, /Water/i);

  progression.questCounters.moonleafWatered = 1;
  navigation = getCampaignNavigation(progression, {}, "ayla_homestead");
  assert.match(navigation.hint, /Sleep once/i);

  progression.questCounters.moonleafGrown = 1;
  navigation = getCampaignNavigation(progression, {}, "ayla_homestead");
  assert.match(navigation.hint, /Harvest/i);
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

test("Ember unlock supports two distinct loadouts and reports the active setup", () => {
  const progression = createProgression({
    campaign: { loadoutSlots: 2 },
    inventory: { emberwake_seal: 1 },
  });

  assert.equal(saveLoadout(progression, 0).saved, true);
  assert.equal(equipItem(progression, "emberwake_seal"), true);
  assert.equal(saveLoadout(progression, 1).saved, true);
  assert.equal(getLoadoutEntries(progression)[1].active, true);

  assert.equal(activateLoadout(progression, 0).activated, true);
  assert.equal(progression.equipment.amulet, null);
  assert.equal(getLoadoutEntries(progression)[0].active, true);
  assert.equal(getLoadoutEntries(progression)[1].active, false);

  assert.equal(activateLoadout(progression, 1).activated, true);
  assert.equal(progression.equipment.amulet, "emberwake_seal");
  assert.equal(progression.inventory.emberwake_seal || 0, 0);
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

test("Ember Journal navigation and Bestiary track the guardian return", () => {
  const progression = createProgression({
    worldFlags: {
      heartwood_restored: true,
      stillwater_restored: true,
      ember_pass_reopened: true,
      cinder_warden_released: true,
    },
    questStates: {
      stillwater_homecoming: "done",
      ember_totems: "done",
      cinder_warden: "done",
      ember_homecoming: "inactive",
    },
    questCounters: {
      enemy_cinder_imp_defeated: 3,
      enemy_ash_brute_defeated: 1,
      cinderWardenDefeated: 1,
    },
  });
  const sceneProgress = {
    emberpine_grove: { cleared: true },
  };
  progression.regionProgress.ember = { bossDefeated: true };
  syncCampaignProgress(progression, sceneProgress);

  let navigation = getCampaignNavigation(
    progression,
    sceneProgress,
    "emberpine_grove"
  );
  assert.equal(navigation.questId, "ember_homecoming");
  assert.match(navigation.hint, /steady ember/i);

  progression.questCounters.forgeEmberRecovered = 1;
  navigation = getCampaignNavigation(
    progression,
    sceneProgress,
    "emberpine_grove"
  );
  assert.match(navigation.hint, /Garrick/i);

  const entries = getBestiaryEntries(progression, "ember");
  assert.equal(entries.find((entry) => entry.id === "cinder_imp").mastered, true);
  assert.equal(entries.find((entry) => entry.id === "ash_brute").mastered, false);
  assert.equal(entries.find((entry) => entry.id === "cinder_warden").mastered, true);
});

test("Frost Journal navigation and Bestiary preserve the Winter Letter lead", () => {
  const progression = createProgression({
    worldFlags: {
      heartwood_restored: true,
      stillwater_restored: true,
      ember_restored: true,
      ridge_signal_recovered: true,
      veil_seraph_released: true,
    },
    questStates: {
      stillwater_homecoming: "done",
      cinder_warden: "done",
      ember_homecoming: "done",
      lost_scout: "done",
      veil_seraph: "done",
      frost_homecoming: "inactive",
    },
    questCounters: {
      enemy_frost_wisp_defeated: 3,
      enemy_icebound_guardian_defeated: 1,
      veilSeraphDefeated: 1,
    },
  });
  const sceneProgress = {
    frostveil_tundra: { cleared: true },
  };
  progression.regionProgress.ember = { bossDefeated: true };
  progression.regionProgress.frost = { bossDefeated: true };
  syncCampaignProgress(progression, sceneProgress);

  let navigation = getCampaignNavigation(
    progression,
    sceneProgress,
    "frostveil_tundra"
  );
  assert.equal(navigation.questId, "frost_homecoming");
  assert.match(navigation.hint, /message Veil Seraph preserved/i);

  progression.questCounters.seraphMessageRecovered = 1;
  navigation = getCampaignNavigation(
    progression,
    sceneProgress,
    "frostveil_tundra"
  );
  assert.match(navigation.hint, /Vesper/i);

  const entries = getBestiaryEntries(progression, "frost");
  assert.equal(entries.find((entry) => entry.id === "frost_wisp").mastered, true);
  assert.equal(entries.find((entry) => entry.id === "icebound_guardian").mastered, false);
  assert.equal(entries.find((entry) => entry.id === "veil_seraph").mastered, true);
});

test("Scarroot Journal follows the keeper memory home and records the corrupted court", () => {
  const progression = createProgression({
    worldFlags: {
      heartwood_restored: true,
      stillwater_restored: true,
      ember_restored: true,
      frost_restored: true,
      court_approach_secured: true,
      elder_hollow_broken: true,
    },
    questStates: {
      first_rootwarden: "done",
      stillwater_homecoming: "done",
      cinder_warden: "done",
      ember_homecoming: "done",
      veil_seraph: "done",
      frost_homecoming: "done",
      blight_watch: "done",
      elder_hollow: "done",
      scarroot_homecoming: "inactive",
    },
    questCounters: {
      enemy_blight_hound_defeated: 3,
      enemy_rot_weaver_defeated: 2,
      elderHollowDefeated: 1,
    },
  });
  const sceneProgress = {
    hollowheart_ruins: { cleared: true },
  };
  progression.regionProgress.ember = { bossDefeated: true };
  progression.regionProgress.frost = { bossDefeated: true };
  progression.regionProgress.scarroot = { bossDefeated: true };
  syncCampaignProgress(progression, sceneProgress);

  let navigation = getCampaignNavigation(
    progression,
    sceneProgress,
    "hollowheart_ruins"
  );
  assert.equal(navigation.questId, "scarroot_homecoming");
  assert.match(navigation.hint, /memory/i);

  progression.questCounters.firstKeeperMemoryRecovered = 1;
  navigation = getCampaignNavigation(
    progression,
    sceneProgress,
    "hollowheart_ruins"
  );
  assert.match(navigation.hint, /Bram/i);

  const journal = getRegionJournalView(
    progression,
    sceneProgress,
    "hollowheart_ruins",
    "scarroot"
  );
  assert.equal(journal.name, "Scarroot");
  assert.equal(journal.navigation.targetLabel, "Blighted Woods");

  const entries = getBestiaryEntries(progression, "scarroot");
  assert.equal(entries.find((entry) => entry.id === "blight_hound").mastered, true);
  assert.equal(entries.find((entry) => entry.id === "rot_weaver").mastered, false);
  assert.equal(entries.find((entry) => entry.id === "elder_hollow").mastered, true);
});

test("Rootlight Journal follows the Sentinel echo home and records the final archive", () => {
  const progression = createProgression({
    worldFlags: {
      heartwood_restored: true,
      stillwater_restored: true,
      ember_restored: true,
      frost_restored: true,
      scarroot_restored: true,
      starfall_sanctum_open: true,
      starfall_truth_recovered: true,
      starfall_sanctum_cleansed: true,
    },
    questStates: {
      first_rootwarden: "done",
      stillwater_homecoming: "done",
      cinder_warden: "done",
      ember_homecoming: "done",
      veil_seraph: "done",
      frost_homecoming: "done",
      elder_hollow: "done",
      scarroot_homecoming: "done",
      pilgrims_lantern: "done",
      starfall_sanctum: "done",
      the_sixth_answer: "inactive",
    },
    questCounters: {
      enemy_relic_sentinel_defeated: 3,
      enemy_starbound_archer_defeated: 1,
      starwokenSentinelDefeated: 1,
    },
  });
  const sceneProgress = {
    starfall_sanctum: { cleared: true },
  };
  Object.assign(progression.regionProgress, {
    ember: { bossDefeated: true },
    frost: { bossDefeated: true },
    scarroot: { bossDefeated: true },
    rootlight: { bossDefeated: true },
  });
  syncCampaignProgress(progression, sceneProgress);

  let navigation = getCampaignNavigation(
    progression,
    sceneProgress,
    "starfall_sanctum"
  );
  assert.equal(navigation.questId, "the_sixth_answer");
  assert.match(navigation.hint, /final echo/i);

  progression.questCounters.starwokenEchoRecovered = 1;
  navigation = getCampaignNavigation(
    progression,
    sceneProgress,
    "starfall_sanctum"
  );
  assert.match(navigation.hint, /Selka/i);
  assert.equal(navigation.targetLabel, "Ancient Heart");

  const journal = getRegionJournalView(
    progression,
    sceneProgress,
    "starfall_sanctum",
    "rootlight"
  );
  assert.equal(journal.name, "Rootlight");

  const entries = getBestiaryEntries(progression, "rootlight");
  assert.equal(entries.find((entry) => entry.id === "relic_sentinel").mastered, true);
  assert.equal(entries.find((entry) => entry.id === "starbound_archer").mastered, false);
  assert.equal(entries.find((entry) => entry.id === "starwoken_sentinel").mastered, true);
});

test("Second Spring Journal points to the next daily echo after the campaign", () => {
  const progression = createProgression({
    worldFlags: {
      heartwood_restored: true,
      stillwater_restored: true,
      ember_restored: true,
      frost_restored: true,
      scarroot_restored: true,
      rootlight_restored: true,
      second_spring_started: true,
    },
    questStates: {
      first_rootwarden: "done",
      stillwater_homecoming: "done",
      cinder_warden: "done",
      ember_homecoming: "done",
      veil_seraph: "done",
      frost_homecoming: "done",
      elder_hollow: "done",
      scarroot_homecoming: "done",
      pilgrims_lantern: "done",
      starfall_sanctum: "done",
      the_sixth_answer: "done",
      second_spring: "done",
    },
  });
  const sceneProgress = {
    whispering_woods: { cleared: true },
    chapel_of_tides: { cleared: true },
    emberpine_grove: { cleared: true },
    frostveil_tundra: { cleared: true },
    hollowheart_ruins: { cleared: true },
    starfall_sanctum: { cleared: true },
  };
  Object.assign(progression.regionProgress, {
    ember: { bossDefeated: true },
    frost: { bossDefeated: true },
    scarroot: { bossDefeated: true },
    rootlight: { bossDefeated: true },
  });
  syncCampaignProgress(progression, sceneProgress);

  let navigation = getCampaignNavigation(
    progression,
    sceneProgress,
    "ayla_homestead",
    8
  );
  assert.equal(navigation.questId, "postgame_echo");
  assert.equal(navigation.targetLabel, "Whispering Woods");
  assert.match(navigation.hint, /restored region/i);

  let journal = getRegionJournalView(
    progression,
    sceneProgress,
    "ayla_homestead",
    "heartwood",
    8
  );
  assert.equal(journal.postgameEcho.available, true);
  assert.equal(journal.postgameEcho.targetSceneId, "whispering_woods");

  progression.regionProgress.heartwood.echoDay = 8;
  navigation = getCampaignNavigation(
    progression,
    sceneProgress,
    "ayla_homestead",
    8
  );
  assert.equal(navigation.targetLabel, "Chapel of Tides");
  journal = getRegionJournalView(
    progression,
    sceneProgress,
    "ayla_homestead",
    "heartwood",
    8
  );
  assert.equal(journal.postgameEcho.completedToday, true);
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

test("Veil Drill records a telegraph dodge without damaging Ayla", () => {
  const interactable = { id: "training-grove-elite", disabled: false };
  const state = {
    training: createTrainingState(),
    enemies: [],
    arena: { interactables: [interactable] },
    progression: createProgression(),
    player: { x: 100, y: 100, radius: 16, hp: 50 },
  };

  assert.equal(
    startTrainingDrill(
      state,
      interactable.id,
      400,
      400,
      "elite-pattern"
    ).started,
    true
  );
  assert.equal(updateTrainingDrill(state, 0.8), null);
  assert.ok(state.training.pattern);
  state.player.x = 240;
  assert.equal(updateTrainingDrill(state, 0.9), null);
  assert.equal(state.training.dodges, 1);
  const result = updateTrainingDrill(state, 18.3);

  assert.equal(result.mode, "elite-pattern");
  assert.equal(result.dodges, 1);
  assert.equal(result.patternHits, 0);
  assert.equal(state.player.hp, 50);
});

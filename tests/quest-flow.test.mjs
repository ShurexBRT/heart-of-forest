import test from "node:test";
import assert from "node:assert/strict";

import {
  createProgression,
  getCurrency,
  getItemCount,
  getQuestCounter,
  incrementQuestCounter,
} from "../systems/progression.js";
import {
  activateQuestPanelSelection,
  beginInteraction,
  consumeStoryEvents,
  createStoryState,
  refreshQuestStates,
  updateQuestAvailability,
} from "../systems/story.js";
import {
  getServiceEntries,
  openServiceUi,
  performSelectedServiceAction,
} from "../systems/services.js";
import { markRegionSceneCleared } from "../systems/regions.js";
import { syncCampaignProgress } from "../systems/campaign.js";
import {
  advanceFarmPlots,
  interactWithFarmPlot,
} from "../systems/farming.js";
import { SCENES } from "../data/sceneNetwork.js";
import { createArena } from "../world/arena.js";

function createQuestFlowState() {
  return {
    currentSceneId: "ayla_homestead",
    progression: createProgression(),
    story: createStoryState(),
    storyEvents: [],
    sceneProgress: {},
    audio: { enabled: false },
    player: {
      refreshFromModifiers() {},
    },
    ui: {
      menuOpen: false,
      questLogOpen: false,
      activeTab: "character",
      activeServiceId: null,
      activeServiceLabel: "",
      selectedServiceIndex: 0,
      serviceSubpanel: "stock",
      selectedStashIndex: 0,
    },
  };
}

test("new game can complete the Homestead to Rootwarden preparation loop", () => {
  const state = createQuestFlowState();

  assert.equal(state.progression.questStates.wake_hearthroot, "active");
  state.storyEvents.push({ type: "collect", key: "hearthrootAwakened", amount: 1 });
  consumeStoryEvents(state);
  assert.equal(state.progression.questStates.wake_hearthroot, "done");
  assert.match(state.story.toastText, /Plant Moonleaf next/i);
  assert.equal(state.progression.worldFlags.hearthroot_awake, true);
  assert.equal(getItemCount(state.progression, "ironbark"), 1);
  assert.equal(getItemCount(state.progression, "moonleaf_seed"), 2);

  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.first_moonleaf, "active");
  assert.match(state.story.toastText, /plant Moonleaf.*sleep once/i);
  const homeProgress = {};
  assert.equal(
    interactWithFarmPlot(
      homeProgress,
      "garden-plot-1",
      state.progression,
      { day: 1 }
    ).event,
    "planted"
  );
  assert.equal(
    interactWithFarmPlot(
      homeProgress,
      "garden-plot-1",
      state.progression,
      { day: 1 }
    ).event,
    "watered"
  );
  assert.deepEqual(
    advanceFarmPlots(homeProgress, 1, state.progression),
    { grownPlots: 1, maturePlots: 1 }
  );
  assert.equal(
    interactWithFarmPlot(
      homeProgress,
      "garden-plot-1",
      state.progression,
      { day: 2 }
    ).event,
    "harvested"
  );
  refreshQuestStates(state);
  assert.equal(state.progression.questStates.first_moonleaf, "done");
  assert.equal(state.progression.worldFlags.heartwood_first_harvest, true);

  state.currentSceneId = "whispering_woods";
  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.thorn_at_gate, "active");
  assert.match(state.story.toastText, /Whispering Woods.*two driven creatures/i);
  state.storyEvents.push(
    { type: "enemyDefeated", enemyType: "thornling" },
    { type: "enemyDefeated", enemyType: "barkling" }
  );
  consumeStoryEvents(state);
  assert.equal(state.progression.questStates.thorn_at_gate, "done");
  assert.equal(state.progression.unlockedRecipes.barkskin_draught, true);

  state.currentSceneId = "ayla_homestead";
  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.brew_before_blood, "active");
  assert.match(state.story.toastText, /Brew Barkskin.*Mossy Ruins/i);
  assert.equal(openServiceUi(state, "hearthroot_cauldron", "Hearthroot Cauldron"), true);
  const barkskinIndex = getServiceEntries(state).findIndex(
    (entry) => entry.id === "barkskin_draught"
  );
  assert.ok(barkskinIndex >= 0);
  state.ui.selectedServiceIndex = barkskinIndex;
  const brewResult = performSelectedServiceAction(state);
  assert.equal(brewResult.success, true);
  assert.equal(brewResult.audioCue, "brew");
  consumeStoryEvents(state);
  assert.equal(state.progression.questStates.brew_before_blood, "done");
  assert.match(state.story.toastText, /Mossy Ruins opens/i);
  assert.equal(getItemCount(state.progression, "barkskin_draught"), 1);
  assert.equal(state.progression.worldFlags.heartwood_ruins_open, true);

  state.currentSceneId = "mossy_ruins";
  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.first_rootwarden, "active");
  assert.match(state.story.toastText, /Rootwarden's open lanes/i);
  state.storyEvents.push({ type: "bossDefeated", bossId: "rootwarden" });
  consumeStoryEvents(state);
  assert.equal(state.progression.questStates.first_rootwarden, "done");
  assert.equal(state.progression.worldFlags.heartwood_restored, true);
  assert.equal(state.progression.talentPoints, 1);
});

test("Renewal Workbench turns Reliquary supplies into homestead materials", () => {
  const state = createQuestFlowState();
  state.progression.worldFlags.second_spring_started = true;
  incrementQuestCounter(state.progression, "homesteadRenewalSupplies", 2);

  assert.equal(openServiceUi(state, "homestead_renewal", "Renewal Supplies"), true);
  const entries = getServiceEntries(state);
  const crateIndex = entries.findIndex((entry) => entry.id === "attunement_crate");
  assert.ok(crateIndex >= 0);
  assert.equal(entries[crateIndex].affordable, true);

  state.ui.selectedServiceIndex = crateIndex;
  const crateResult = performSelectedServiceAction(state);
  assert.equal(crateResult.success, true);
  assert.equal(crateResult.audioCue, "renewal");
  assert.match(crateResult.text, /Relic Shard/i);
  assert.equal(getQuestCounter(state.progression, "homesteadRenewalSupplies"), 1);
  assert.equal(getItemCount(state.progression, "relic_shard"), 1);
  assert.equal(getItemCount(state.progression, "ironbark"), 2);

  const roadKitIndex = getServiceEntries(state).findIndex((entry) => entry.id === "road_kit");
  assert.ok(roadKitIndex >= 0);
  const silverBefore = getCurrency(state.progression);
  state.ui.selectedServiceIndex = roadKitIndex;
  const roadKitResult = performSelectedServiceAction(state);
  assert.equal(roadKitResult.success, true);
  assert.equal(roadKitResult.audioCue, "renewal");
  assert.equal(getQuestCounter(state.progression, "homesteadRenewalSupplies"), 0);
  assert.equal(getCurrency(state.progression), silverBefore - 8);
  assert.equal(getItemCount(state.progression, "health_potion"), 4);
  assert.equal(getItemCount(state.progression, "spirit_tonic"), 2);

  assert.equal(getServiceEntries(state).every((entry) => entry.affordable === false), true);
});

test("collectable quest objects use the collect audio cue", () => {
  const state = createQuestFlowState();
  state.audio = { enabled: true, queue: [] };
  state.currentSceneId = "whispering_woods";
  state.arena = createArena({
    ...SCENES.whispering_woods,
    worldFlags: { heartwood_restored: true },
    questStates: { whispering_call: "active" },
  });
  const flower = state.arena.interactables.find(
    (interactable) => interactable.id === "spirit-flower-1"
  );

  assert.ok(flower);
  assert.equal(beginInteraction(state, { kind: "object", data: flower }), true);
  assert.equal(state.audio.queue.at(-1)?.cue, "collect");
  assert.equal(state.combatText.at(-1)?.reward, true);
  assert.match(state.combatText.at(-1)?.text || "", /secured/i);
  assert.ok(state.particles.length > 0);
});

test("Ember restores only after the totems, guardian, ember recovery, and Garrick return", () => {
  const state = createQuestFlowState();
  state.progression.questStates.stillwater_homecoming = "done";
  state.progression.worldFlags.stillwater_restored = true;
  state.currentSceneId = "emberpine_grove";
  state.sceneProgress.emberpine_grove = { cleared: true };

  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.ember_totems, "available");
  completeNpcQuest(state, "garrick", "ember_totems", {
    totemsActivated: 3,
  });
  assert.equal(state.progression.worldFlags.ember_pass_reopened, true);
  assert.equal(state.sceneProgress.emberpine_grove.cleared, false);

  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.cinder_warden, "active");

  state.storyEvents.push({ type: "bossDefeated", bossId: "cinder_warden" });
  consumeStoryEvents(state);
  assert.equal(state.progression.questStates.cinder_warden, "done");
  assert.equal(state.progression.worldFlags.cinder_warden_released, true);
  assert.equal(state.progression.worldFlags.ember_restored, false);
  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.ember_homecoming, "inactive");

  state.sceneProgress.emberpine_grove.cleared = true;
  markRegionSceneCleared(
    state.progression,
    state.sceneProgress,
    "emberpine_grove",
    3
  );
  syncCampaignProgress(state.progression, state.sceneProgress);
  assert.equal(state.progression.worldFlags.ember_restored, false);

  state.storyEvents.push({
    type: "collect",
    key: "forgeEmberRecovered",
    amount: 1,
  });
  consumeStoryEvents(state);
  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.ember_homecoming, "available");
  completeNpcQuest(state, "garrick", "ember_homecoming");

  assert.equal(state.progression.worldFlags.ember_restored, true);
  assert.equal(state.progression.campaign.loadoutSlots, 2);
});

test("Frost restores only after the scout, Seraph, Winter Letter, and Vesper return", () => {
  const state = createQuestFlowState();
  state.progression.questStates.ember_homecoming = "done";
  state.progression.worldFlags.ember_restored = true;
  state.currentSceneId = "frostveil_tundra";
  state.sceneProgress.frostveil_tundra = { cleared: true };

  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.lost_scout, "available");
  completeNpcQuest(state, "vesper", "lost_scout", {
    scoutFound: 1,
  });
  assert.equal(state.progression.worldFlags.ridge_signal_recovered, true);
  assert.equal(state.sceneProgress.frostveil_tundra.cleared, false);

  updateQuestAvailability(state);
  state.storyEvents.push({ type: "bossDefeated", bossId: "veil_seraph" });
  consumeStoryEvents(state);
  assert.equal(state.progression.questStates.veil_seraph, "done");
  assert.equal(state.progression.worldFlags.veil_seraph_released, true);
  assert.equal(state.progression.worldFlags.frost_restored, false);
  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.frost_homecoming, "inactive");

  state.sceneProgress.frostveil_tundra.cleared = true;
  markRegionSceneCleared(
    state.progression,
    state.sceneProgress,
    "frostveil_tundra",
    4
  );
  syncCampaignProgress(state.progression, state.sceneProgress);
  assert.equal(state.progression.worldFlags.frost_restored, false);

  state.storyEvents.push({
    type: "collect",
    key: "seraphMessageRecovered",
    amount: 1,
  });
  consumeStoryEvents(state);
  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.frost_homecoming, "available");
  completeNpcQuest(state, "vesper", "frost_homecoming");

  assert.equal(state.progression.worldFlags.frost_restored, true);
  assert.equal(state.progression.worldFlags.waystone_network_restored, true);
  assert.equal(state.progression.campaign.loadoutSlots, 3);
  assert.equal(state.progression.campaign.trainingEliteUnlocked, true);
});

test("Scarroot restores only after the first keeper's memory returns to Bram", () => {
  const state = createQuestFlowState();
  Object.assign(state.progression.questStates, {
    first_rootwarden: "done",
    stillwater_homecoming: "done",
    cinder_warden: "done",
    ember_homecoming: "done",
    veil_seraph: "done",
    frost_homecoming: "done",
  });
  Object.assign(state.progression.worldFlags, {
    heartwood_restored: true,
    stillwater_restored: true,
    ember_restored: true,
    frost_restored: true,
  });
  state.progression.regionProgress.ember = { bossDefeated: true };
  state.progression.regionProgress.frost = { bossDefeated: true };
  state.currentSceneId = "blighted_woods";
  state.sceneProgress.blighted_woods = { cleared: true };

  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.blight_watch, "available");
  completeNpcQuest(state, "bram", "blight_watch", {
    blightEffigiesBroken: 2,
    enemy_blight_hound_defeated: 3,
    enemy_rot_weaver_defeated: 2,
  });
  assert.equal(state.progression.worldFlags.court_approach_secured, true);
  assert.equal(state.progression.worldFlags.scarroot_restored, false);

  state.currentSceneId = "hollowheart_ruins";
  state.sceneProgress.hollowheart_ruins = { cleared: true };
  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.elder_hollow, "active");
  state.storyEvents.push({ type: "bossDefeated", bossId: "elder_hollow" });
  consumeStoryEvents(state);
  assert.equal(state.progression.questStates.elder_hollow, "done");
  assert.equal(state.progression.worldFlags.elder_hollow_broken, true);
  assert.equal(state.progression.worldFlags.scarroot_restored, false);

  markRegionSceneCleared(
    state.progression,
    state.sceneProgress,
    "hollowheart_ruins",
    5
  );
  syncCampaignProgress(state.progression, state.sceneProgress);
  assert.equal(state.progression.worldFlags.scarroot_restored, false);

  state.storyEvents.push({
    type: "collect",
    key: "firstKeeperMemoryRecovered",
    amount: 1,
  });
  consumeStoryEvents(state);
  state.currentSceneId = "blighted_woods";
  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.scarroot_homecoming, "available");
  completeNpcQuest(state, "bram", "scarroot_homecoming");

  assert.equal(state.progression.worldFlags.scarroot_restored, true);
  assert.equal(state.progression.worldFlags.signature_rite_unlocked, true);
  assert.equal(state.progression.campaign.activeChapter, "rootlight");

  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.smallest_grove, "available");
  state.story.questPanel = {
    npcId: "bram",
    selectedTopicIndex: 0,
    selectedActionIndex: 0,
    focus: "actions",
  };
  activateQuestPanelSelection(state);
  assert.equal(state.progression.questStates.smallest_grove, "active");
  assert.equal(state.pendingArenaRefresh, true);

  incrementQuestCounter(state.progression, "scarrootSaplingsTended", 3);
  refreshQuestStates(state);
  assert.equal(state.progression.questStates.smallest_grove, "complete");
  completeNpcQuest(state, "bram", "smallest_grove");
  assert.equal(state.progression.worldFlags.scarroot_nursery_restored, true);
});

test("Rootlight reveals the archive truth before the Sentinel and ends by planting the Heartseed", () => {
  const state = createQuestFlowState();
  Object.assign(state.progression.questStates, {
    first_rootwarden: "done",
    stillwater_homecoming: "done",
    cinder_warden: "done",
    ember_homecoming: "done",
    veil_seraph: "done",
    frost_homecoming: "done",
    blight_watch: "done",
    elder_hollow: "done",
    scarroot_homecoming: "done",
  });
  Object.assign(state.progression.worldFlags, {
    heartwood_restored: true,
    stillwater_restored: true,
    ember_restored: true,
    frost_restored: true,
    scarroot_restored: true,
    signature_rite_unlocked: true,
  });
  Object.assign(state.progression.regionProgress, {
    ember: { bossDefeated: true },
    frost: { bossDefeated: true },
    scarroot: { bossDefeated: true },
  });
  state.currentSceneId = "ancient_heart";
  state.sceneProgress.ancient_heart = { cleared: true };

  syncCampaignProgress(state.progression, state.sceneProgress);
  updateQuestAvailability(state);
  assert.equal(state.progression.campaign.activeChapter, "rootlight");
  assert.equal(state.progression.questStates.pilgrims_lantern, "available");

  completeNpcQuest(state, "selka", "pilgrims_lantern", {
    heartBloomsGathered: 2,
    starSealsRecovered: 2,
  });
  assert.equal(state.progression.worldFlags.starfall_sanctum_open, true);

  state.currentSceneId = "starfall_sanctum";
  state.sceneProgress.starfall_sanctum = { cleared: true };
  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.starfall_sanctum, "active");
  assert.equal(
    Boolean(state.progression.worldFlags.starfall_truth_recovered),
    false
  );

  state.storyEvents.push({
    type: "collect",
    key: "starfallTruthRecovered",
    amount: 1,
  });
  consumeStoryEvents(state);
  assert.equal(state.progression.worldFlags.starfall_truth_recovered, true);
  assert.equal(state.sceneProgress.starfall_sanctum.cleared, false);
  assert.equal(state.pendingArenaRefresh, true);
  assert.equal(state.progression.questStates.starfall_sanctum, "active");

  state.storyEvents.push(
    { type: "collect", key: "starBraziersLit", amount: 2 },
    { type: "bossDefeated", bossId: "starwoken_sentinel" }
  );
  consumeStoryEvents(state);
  assert.equal(state.progression.questStates.starfall_sanctum, "done");
  assert.equal(state.progression.worldFlags.starfall_sanctum_cleansed, true);
  assert.equal(state.progression.worldFlags.rootlight_restored, false);

  state.sceneProgress.starfall_sanctum.cleared = true;
  markRegionSceneCleared(
    state.progression,
    state.sceneProgress,
    "starfall_sanctum",
    6,
    { bossDefeated: true }
  );
  syncCampaignProgress(state.progression, state.sceneProgress);
  state.storyEvents.push({
    type: "collect",
    key: "starwokenEchoRecovered",
    amount: 1,
  });
  consumeStoryEvents(state);

  state.currentSceneId = "ancient_heart";
  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.the_sixth_answer, "available");
  completeNpcQuest(state, "selka", "the_sixth_answer", {
    starwokenEchoRecovered: 1,
  });
  assert.equal(state.progression.worldFlags.rootlight_harmonized, true);
  assert.equal(state.progression.worldFlags.epilogue_ready, true);
  assert.equal(state.progression.worldFlags.rootlight_restored, false);
  assert.equal(getItemCount(state.progression, "heartseed"), 1);

  state.currentSceneId = "ayla_homestead";
  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.second_spring, "active");
  state.arena = createArena({
    ...SCENES.ayla_homestead,
    worldFlags: state.progression.worldFlags,
    questStates: state.progression.questStates,
    questCounters: state.progression.questCounters,
  });
  const heartseedPlot = state.arena.interactables.find(
    (entry) => entry.id === "second-spring-heartseed"
  );
  assert.ok(heartseedPlot);
  assert.equal(
    beginInteraction(state, { kind: "object", data: heartseedPlot }),
    true
  );
  consumeStoryEvents(state);

  assert.equal(getItemCount(state.progression, "heartseed"), 0);
  assert.equal(state.progression.questStates.second_spring, "done");
  assert.equal(state.progression.worldFlags.rootlight_restored, true);
  assert.equal(state.progression.worldFlags.second_spring_started, true);
  assert.equal(state.progression.campaign.campaignCompleted, true);
});

test("Stillwater restores only after Ayla returns the Matron's memory to Nettle", () => {
  const state = createQuestFlowState();
  state.progression.questStates.first_rootwarden = "done";
  state.progression.worldFlags.heartwood_restored = true;
  state.currentSceneId = "mossroot_marsh";

  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.bogbound_rot, "available");
  completeNpcQuest(state, "nettle", "bogbound_rot", {
    rootsCleansed: 2,
  });
  assert.equal(state.progression.questStates.bogbound_rot, "done");
  assert.equal(state.progression.unlockedRecipes.antitoxin_bloom, true);

  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.tidebound_threshold, "available");
  completeNpcQuest(state, "nettle", "tidebound_threshold", {
    tideSealsRecovered: 2,
  });
  assert.equal(state.progression.worldFlags.chapel_of_tides_open, true);

  state.currentSceneId = "chapel_of_tides";
  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.chapel_of_tides, "active");
  state.storyEvents.push(
    { type: "collect", key: "tideBraziersLit", amount: 2 },
    { type: "bossDefeated", bossId: "bog_matron" }
  );
  consumeStoryEvents(state);
  assert.equal(state.progression.questStates.chapel_of_tides, "done");
  assert.equal(state.progression.worldFlags.chapel_of_tides_cleansed, true);
  assert.equal(state.progression.worldFlags.stillwater_restored, false);
  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.stillwater_homecoming, "inactive");

  state.storyEvents.push({
    type: "collect",
    key: "tideMemoryRecovered",
    amount: 1,
  });
  consumeStoryEvents(state);
  state.currentSceneId = "mossroot_marsh";
  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.stillwater_homecoming, "available");
  completeNpcQuest(state, "nettle", "stillwater_homecoming");

  assert.equal(state.progression.worldFlags.stillwater_restored, true);
  assert.equal(state.progression.campaign.activeChapter, "ember");
  assert.equal(state.progression.campaign.trainingGroupUnlocked, true);
  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.ember_totems, "inactive");
});

function completeNpcQuest(state, npcId, questId, counters = {}) {
  state.progression.questStates[questId] = "active";
  for (const [key, amount] of Object.entries(counters)) {
    incrementQuestCounter(state.progression, key, amount);
  }
  refreshQuestStates(state);
  assert.equal(state.progression.questStates[questId], "complete");
  state.story.questPanel = {
    npcId,
    selectedTopicIndex: 0,
    selectedActionIndex: 0,
    focus: "actions",
  };
  activateQuestPanelSelection(state);
}

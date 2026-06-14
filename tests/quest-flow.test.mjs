import test from "node:test";
import assert from "node:assert/strict";

import {
  addItem,
  createProgression,
  getItemCount,
  incrementQuestCounter,
} from "../systems/progression.js";
import {
  activateQuestPanelSelection,
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
  assert.equal(state.progression.worldFlags.hearthroot_awake, true);
  assert.equal(getItemCount(state.progression, "ironbark"), 1);

  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.first_moonleaf, "active");
  addItem(state.progression, "moonleaf", 1);
  incrementQuestCounter(state.progression, "moonleafHarvested", 1);
  refreshQuestStates(state);
  assert.equal(state.progression.questStates.first_moonleaf, "done");

  state.currentSceneId = "whispering_woods";
  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.thorn_at_gate, "active");
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
  assert.equal(openServiceUi(state, "hearthroot_cauldron", "Hearthroot Cauldron"), true);
  const barkskinIndex = getServiceEntries(state).findIndex(
    (entry) => entry.id === "barkskin_draught"
  );
  assert.ok(barkskinIndex >= 0);
  state.ui.selectedServiceIndex = barkskinIndex;
  assert.equal(performSelectedServiceAction(state).success, true);
  consumeStoryEvents(state);
  assert.equal(state.progression.questStates.brew_before_blood, "done");
  assert.equal(getItemCount(state.progression, "barkskin_draught"), 1);

  state.currentSceneId = "mossy_ruins";
  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.first_rootwarden, "active");
  state.storyEvents.push({ type: "bossDefeated", bossId: "rootwarden" });
  consumeStoryEvents(state);
  assert.equal(state.progression.questStates.first_rootwarden, "done");
  assert.equal(state.progression.worldFlags.heartwood_restored, true);
  assert.equal(state.progression.talentPoints, 1);
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

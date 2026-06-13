import test from "node:test";
import assert from "node:assert/strict";

import {
  addItem,
  createProgression,
  getItemCount,
  incrementQuestCounter,
} from "../systems/progression.js";
import {
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

test("Ember and Frost restore only after their guardian quest and scene clear", () => {
  const state = createQuestFlowState();
  state.currentSceneId = "emberpine_grove";
  state.progression.questStates.ember_totems = "done";
  updateQuestAvailability(state);
  assert.equal(state.progression.questStates.cinder_warden, "active");

  state.storyEvents.push({ type: "bossDefeated", bossId: "cinder_warden" });
  consumeStoryEvents(state);
  assert.equal(state.progression.questStates.cinder_warden, "done");
  assert.equal(state.progression.worldFlags.ember_restored, false);

  state.sceneProgress.emberpine_grove = { cleared: true };
  markRegionSceneCleared(
    state.progression,
    state.sceneProgress,
    "emberpine_grove",
    3
  );
  syncCampaignProgress(state.progression, state.sceneProgress);
  assert.equal(state.progression.worldFlags.ember_restored, true);
  assert.equal(state.progression.campaign.loadoutSlots, 2);

  state.currentSceneId = "frostveil_tundra";
  state.progression.questStates.lost_scout = "done";
  updateQuestAvailability(state);
  state.storyEvents.push({ type: "bossDefeated", bossId: "veil_seraph" });
  consumeStoryEvents(state);
  assert.equal(state.progression.questStates.veil_seraph, "done");
  assert.equal(state.progression.worldFlags.frost_restored, false);

  state.sceneProgress.frostveil_tundra = { cleared: true };
  markRegionSceneCleared(
    state.progression,
    state.sceneProgress,
    "frostveil_tundra",
    4
  );
  syncCampaignProgress(state.progression, state.sceneProgress);
  assert.equal(state.progression.worldFlags.frost_restored, true);
  assert.equal(state.progression.campaign.loadoutSlots, 3);
});

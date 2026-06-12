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

function createQuestFlowState() {
  return {
    currentSceneId: "ayla_homestead",
    progression: createProgression(),
    story: createStoryState(),
    storyEvents: [],
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

import test from "node:test";
import assert from "node:assert/strict";

import {
  advanceFarmPlots,
  getFarmPlotView,
  getMoonleafSleepGuidance,
  interactWithFarmPlot,
  syncFarmInteractables,
} from "../systems/farming.js";
import {
  addItem,
  createProgression,
  getItemCount,
  getQuestCounter,
  removeItem,
} from "../systems/progression.js";

test("Moonleaf follows a persistent plant, water, grow, and harvest loop", () => {
  const progression = createProgression();
  progression.questStates.first_moonleaf = "active";
  addItem(progression, "moonleaf_seed", 1);
  const sceneProgress = {};
  const plotId = "garden-plot-1";
  const dayOne = { day: 1 };

  const planted = interactWithFarmPlot(sceneProgress, plotId, progression, dayOne);
  assert.equal(planted.event, "planted");
  assert.equal(getItemCount(progression, "moonleaf_seed"), 0);
  assert.equal(progression.questCounters.moonleafPlanted, 1);
  assert.equal(getFarmPlotView(sceneProgress, plotId, progression, dayOne).promptLabel, "Water Moonleaf");
  assert.equal(getMoonleafSleepGuidance(progression).blocked, true);

  const watered = interactWithFarmPlot(sceneProgress, plotId, progression, dayOne);
  assert.equal(watered.event, "watered");
  assert.equal(progression.questCounters.moonleafWatered, 1);
  assert.equal(getMoonleafSleepGuidance(progression).blocked, false);
  assert.equal(getMoonleafSleepGuidance(progression).promptLabel, "Rest so Moonleaf can grow");

  const firstGrowth = advanceFarmPlots(sceneProgress, 1, progression);
  assert.deepEqual(firstGrowth, { grownPlots: 1, maturePlots: 1 });
  assert.equal(progression.questCounters.moonleafGrown, 1);
  assert.equal(sceneProgress.farmPlots[plotId].stage, 1);
  assert.equal(
    getFarmPlotView(sceneProgress, plotId, progression, { day: 2 }).promptLabel,
    "Harvest Moonleaf"
  );

  const harvested = interactWithFarmPlot(sceneProgress, plotId, progression, { day: 2 });
  assert.equal(harvested.event, "harvested");
  assert.equal(getItemCount(progression, "moonleaf"), 3);
  assert.equal(getItemCount(progression, "moonleaf_seed"), 1);
  assert.equal(getQuestCounter(progression, "moonleafBundles"), 1);
  assert.equal(getQuestCounter(progression, "moonleafHarvested"), 1);
  assert.equal(sceneProgress.farmPlots[plotId], undefined);
});

test("farm interactables expose the current action and visual state", () => {
  const progression = createProgression();
  progression.questStates.first_moonleaf = "active";
  addItem(progression, "moonleaf_seed", 2);
  const sceneProgress = {};
  const arena = {
    interactables: [
      { id: "garden-plot-1", type: "farmPlot", promptLabel: "Inspect" },
      { id: "ayla-bed", type: "bed", promptLabel: "Sleep" },
    ],
  };

  syncFarmInteractables(arena, sceneProgress, progression, { day: 1 });
  assert.equal(arena.interactables[0].promptLabel, "Plant Moonleaf Seed (2)");
  assert.equal(arena.interactables[0].farmView.state, "empty");
  assert.equal(arena.interactables[1].promptLabel, "Plant Moonleaf before resting");
});

test("empty starter seed stacks stay empty after progression reload", () => {
  const progression = createProgression();
  assert.equal(getItemCount(progression, "moonleaf_seed"), 0);
  addItem(progression, "moonleaf_seed", 2);
  assert.equal(removeItem(progression, "moonleaf_seed", 2), true);

  const reloaded = createProgression(progression);
  assert.equal(getItemCount(reloaded, "moonleaf_seed"), 0);
});

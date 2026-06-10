import test from "node:test";
import assert from "node:assert/strict";

import {
  advanceFarmPlots,
  getFarmPlotView,
  interactWithFarmPlot,
  syncFarmInteractables,
} from "../systems/farming.js";
import {
  createProgression,
  getItemCount,
  getQuestCounter,
  removeItem,
} from "../systems/progression.js";

test("Moonleaf follows a persistent plant, water, grow, and harvest loop", () => {
  const progression = createProgression();
  const sceneProgress = {};
  const plotId = "garden-plot-1";
  const dayOne = { day: 1 };

  const planted = interactWithFarmPlot(sceneProgress, plotId, progression, dayOne);
  assert.equal(planted.event, "planted");
  assert.equal(getItemCount(progression, "moonleaf_seed"), 5);
  assert.equal(getFarmPlotView(sceneProgress, plotId, progression, dayOne).promptLabel, "Water Moonleaf");

  const watered = interactWithFarmPlot(sceneProgress, plotId, progression, dayOne);
  assert.equal(watered.event, "watered");

  const firstGrowth = advanceFarmPlots(sceneProgress, 1);
  assert.deepEqual(firstGrowth, { grownPlots: 1, maturePlots: 0 });
  assert.equal(sceneProgress.farmPlots[plotId].stage, 1);

  const missedWatering = advanceFarmPlots(sceneProgress, 2);
  assert.deepEqual(missedWatering, { grownPlots: 0, maturePlots: 0 });
  assert.equal(sceneProgress.farmPlots[plotId].stage, 1);

  interactWithFarmPlot(sceneProgress, plotId, progression, { day: 3 });
  const matureGrowth = advanceFarmPlots(sceneProgress, 3);
  assert.deepEqual(matureGrowth, { grownPlots: 1, maturePlots: 1 });
  assert.equal(
    getFarmPlotView(sceneProgress, plotId, progression, { day: 4 }).promptLabel,
    "Harvest Moonleaf"
  );

  const harvested = interactWithFarmPlot(sceneProgress, plotId, progression, { day: 4 });
  assert.equal(harvested.event, "harvested");
  assert.equal(getItemCount(progression, "moonleaf"), 3);
  assert.equal(getItemCount(progression, "moonleaf_seed"), 6);
  assert.equal(getQuestCounter(progression, "moonleafBundles"), 1);
  assert.equal(sceneProgress.farmPlots[plotId], undefined);
});

test("farm interactables expose the current action and visual state", () => {
  const progression = createProgression();
  const sceneProgress = {};
  const arena = {
    interactables: [
      { id: "garden-plot-1", type: "farmPlot", promptLabel: "Inspect" },
      { id: "ayla-bed", type: "bed", promptLabel: "Sleep" },
    ],
  };

  syncFarmInteractables(arena, sceneProgress, progression, { day: 1 });
  assert.equal(arena.interactables[0].promptLabel, "Plant Moonleaf Seed (6)");
  assert.equal(arena.interactables[0].farmView.state, "empty");
  assert.equal(arena.interactables[1].promptLabel, "Sleep");
});

test("empty starter seed stacks stay empty after progression reload", () => {
  const progression = createProgression();
  assert.equal(removeItem(progression, "moonleaf_seed", 6), true);
  assert.equal(getItemCount(progression, "moonleaf_seed"), 0);

  const reloaded = createProgression(progression);
  assert.equal(getItemCount(reloaded, "moonleaf_seed"), 0);
});

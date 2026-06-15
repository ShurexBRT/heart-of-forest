import {
  addItem,
  getItemCount,
  incrementQuestCounter,
  removeItem,
} from "./progression.js";

export const FARM_CROP = {
  id: "moonleaf",
  name: "Moonleaf",
  seedItemId: "moonleaf_seed",
  harvestItemId: "moonleaf",
  matureStage: 1,
  harvestAmount: 2,
  returnedSeeds: 1,
  questCounterKey: "moonleafBundles",
};

export function getMoonleafSleepGuidance(progression) {
  if (progression?.questStates?.first_moonleaf !== "active") return null;

  const planted = progression.questCounters?.moonleafPlanted || 0;
  const watered = progression.questCounters?.moonleafWatered || 0;
  const grown = progression.questCounters?.moonleafGrown || 0;

  if (planted < 1) {
    return {
      blocked: true,
      promptLabel: "Plant Moonleaf before resting",
      text: "Plant the Hearthroot's Moonleaf seed before resting.",
    };
  }
  if (watered < 1) {
    return {
      blocked: true,
      promptLabel: "Water Moonleaf before resting",
      text: "Water the planted Moonleaf so it can grow overnight.",
    };
  }
  if (grown < 1) {
    return {
      blocked: false,
      promptLabel: "Rest so Moonleaf can grow",
      subtitle: "Watered Moonleaf reaches for the dawn",
    };
  }

  return {
    blocked: false,
    promptLabel: "Sleep until morning",
  };
}

export function ensureFarmPlots(sceneProgress) {
  if (!sceneProgress || typeof sceneProgress !== "object") return {};
  if (
    !sceneProgress.farmPlots ||
    typeof sceneProgress.farmPlots !== "object" ||
    Array.isArray(sceneProgress.farmPlots)
  ) {
    sceneProgress.farmPlots = {};
  }
  return sceneProgress.farmPlots;
}

export function getFarmPlotView(sceneProgress, plotId, progression, clock) {
  const plots = ensureFarmPlots(sceneProgress);
  const plot = plots[plotId] || null;
  const day = Math.max(1, Math.floor(clock?.day || 1));
  const seedCount = getItemCount(progression, FARM_CROP.seedItemId);

  if (!plot?.cropId) {
    return {
      state: "empty",
      stage: 0,
      watered: false,
      mature: false,
      seedCount,
      promptLabel:
        seedCount > 0
          ? `Plant Moonleaf Seed (${seedCount})`
          : "Need Moonleaf Seed",
    };
  }

  const stage = clampStage(plot.stage);
  const mature = stage >= FARM_CROP.matureStage;
  const watered = plot.wateredDay === day;
  return {
    state: mature ? "mature" : watered ? "watered" : "growing",
    stage,
    watered,
    mature,
    seedCount,
    promptLabel: mature
      ? "Harvest Moonleaf"
      : watered
        ? "Moonleaf Growing"
        : "Water Moonleaf",
  };
}

export function interactWithFarmPlot(sceneProgress, plotId, progression, clock) {
  const plots = ensureFarmPlots(sceneProgress);
  const day = Math.max(1, Math.floor(clock?.day || 1));
  const plot = plots[plotId] || null;

  if (!plot?.cropId) {
    if (!removeItem(progression, FARM_CROP.seedItemId, 1)) {
      return {
        changed: false,
        text: "A Moonleaf Seed is needed for this plot.",
      };
    }

    plots[plotId] = {
      cropId: FARM_CROP.id,
      stage: 0,
      plantedDay: day,
      wateredDay: null,
    };
    incrementQuestCounter(progression, "moonleafPlanted", 1);
    return {
      changed: true,
      text: "Moonleaf planted. Water the plot to begin its growth.",
      event: "planted",
    };
  }

  const stage = clampStage(plot.stage);
  if (stage >= FARM_CROP.matureStage) {
    addItem(progression, FARM_CROP.harvestItemId, FARM_CROP.harvestAmount);
    addItem(progression, FARM_CROP.seedItemId, FARM_CROP.returnedSeeds);
    incrementQuestCounter(progression, FARM_CROP.questCounterKey, 1);
    incrementQuestCounter(progression, "moonleafHarvested", 1);
    delete plots[plotId];
    return {
      changed: true,
      text: `Harvested ${FARM_CROP.harvestAmount} Moonleaf and recovered a seed.`,
      event: "harvested",
      harvestedItemId: FARM_CROP.harvestItemId,
      harvestedAmount: FARM_CROP.harvestAmount,
    };
  }

  if (plot.wateredDay === day) {
    return {
      changed: false,
      text: "The soil is damp. This Moonleaf will grow after Ayla rests.",
    };
  }

  plot.wateredDay = day;
  incrementQuestCounter(progression, "moonleafWatered", 1);
  return {
    changed: true,
    text: "Moonleaf watered. It will grow overnight.",
    event: "watered",
  };
}

export function advanceFarmPlots(sceneProgress, previousDay, progression = null) {
  const plots = ensureFarmPlots(sceneProgress);
  let grownPlots = 0;
  let maturePlots = 0;

  for (const plot of Object.values(plots)) {
    if (!plot?.cropId) continue;

    if (plot.wateredDay === previousDay && clampStage(plot.stage) < FARM_CROP.matureStage) {
      plot.stage = clampStage(plot.stage) + 1;
      grownPlots += 1;
      if (progression) {
        incrementQuestCounter(progression, "moonleafGrown", 1);
      }
      if (plot.stage >= FARM_CROP.matureStage) {
        maturePlots += 1;
      }
    }

    plot.wateredDay = null;
  }

  return { grownPlots, maturePlots };
}

export function syncFarmInteractables(arena, sceneProgress, progression, clock) {
  for (const interactable of arena?.interactables || []) {
    if (interactable.type === "bed") {
      const guidance = getMoonleafSleepGuidance(progression);
      interactable.promptLabel = guidance?.promptLabel || "Sleep until morning";
      continue;
    }
    if (interactable.type !== "farmPlot") continue;
    const view = getFarmPlotView(sceneProgress, interactable.id, progression, clock);
    interactable.farmView = view;
    interactable.promptLabel = view.promptLabel;
  }
}

function clampStage(stage) {
  return Math.max(0, Math.min(FARM_CROP.matureStage, Math.floor(stage || 0)));
}

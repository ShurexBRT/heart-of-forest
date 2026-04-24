import { QUEST_TEMPLATES } from "../data/gameData.js";
import { distanceBetweenRegions } from "../world/worldGen.js";
import { awardRewards } from "./progression.js";

export function createQuestBoards(world) {
  const quests = [];

  for (const stationId of world.stationPoiIds) {
    const candidates = world.poiOrder
      .filter((poiId) => {
        const poi = world.pois[poiId];
        if (!poi.combat || poi.typeId === "lair") return false;
        const template = Object.values(QUEST_TEMPLATES).find((entry) =>
          entry.validPoiTypes.includes(poi.typeId)
        );
        if (!template) return false;

        const regionDistance = distanceBetweenRegions(world, world.pois[stationId].regionId, poi.regionId);
        return regionDistance <= 2;
      })
      .slice(0, 4);

    for (const poiId of candidates) {
      const poi = world.pois[poiId];
      const template = Object.values(QUEST_TEMPLATES).find((entry) =>
        entry.validPoiTypes.includes(poi.typeId)
      );

      quests.push({
        id: `quest-${stationId}-${poiId}`,
        stationPoiId: stationId,
        targetPoiId: poiId,
        templateId: template.id,
        title: `${template.title}: ${poi.name}`,
        description: template.description,
        rewards: { ...template.rewards },
        status: "available",
      });
    }
  }

  world.quests = quests;
}

export function getStationQuests(world, stationPoiId) {
  return world.quests.filter((quest) => quest.stationPoiId === stationPoiId);
}

export function acceptQuest(world, questId) {
  const quest = world.quests.find((entry) => entry.id === questId);
  if (!quest || quest.status !== "available") return false;
  quest.status = "accepted";
  return true;
}

export function markPoiClearedForQuests(world, poiId) {
  for (const quest of world.quests) {
    if (quest.targetPoiId === poiId && quest.status === "accepted") {
      quest.status = "completed";
    }
  }
}

export function claimQuest(world, progression, questId) {
  const quest = world.quests.find((entry) => entry.id === questId);
  if (!quest || quest.status !== "completed") return null;

  quest.status = "claimed";
  awardRewards(progression, quest.rewards);
  return quest;
}

export function getQuestLog(world) {
  return world.quests.filter((quest) => quest.status !== "available");
}

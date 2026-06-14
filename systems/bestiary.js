import { BESTIARY_DEFS } from "../data/bestiaryData.js";
import { getQuestCounter } from "./progression.js";

export function getBestiaryEntries(progression, chapterId = "heartwood") {
  return Object.values(BESTIARY_DEFS)
    .filter((entry) => entry.chapter === chapterId)
    .map((entry) => {
      const discovery = getDiscoveryState(progression, entry.id);
      return {
        ...entry,
        ...discovery,
        displayName: discovery.discovered ? entry.name : entry.unknownName,
      };
    });
}

function getDiscoveryState(progression, entryId) {
  const entry = BESTIARY_DEFS[entryId];
  if (!entry) return { discovered: false, mastered: false, visibleClues: 0 };

  const counterValue = Math.max(
    0,
    ...(entry.counterKeys || []).map((key) => getQuestCounter(progression, key))
  );
  const discovered = Boolean(
    counterValue > 0 ||
      (entry.seenQuestId && isQuestStarted(progression, entry.seenQuestId))
  );
  const mastered = Boolean(
    counterValue >= (entry.masteryCount || 1) ||
      (entry.masteryQuestId && isQuestDone(progression, entry.masteryQuestId))
  );
  return {
    discovered,
    mastered,
    visibleClues: mastered ? 2 : discovered ? 1 : 0,
  };
}

function isQuestStarted(progression, questId) {
  return ["active", "complete", "done"].includes(progression.questStates?.[questId]);
}

function isQuestDone(progression, questId) {
  return progression.questStates?.[questId] === "done";
}

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
  if (entryId === "thornling") {
    const seen =
      getQuestCounter(progression, "gateThreatsDefeated") > 0 ||
      isQuestStarted(progression, "thorn_at_gate");
    const mastered = isQuestDone(progression, "thorn_at_gate");
    return {
      discovered: seen,
      mastered,
      visibleClues: mastered ? 2 : seen ? 1 : 0,
    };
  }

  if (entryId === "rootwarden") {
    const seen =
      getQuestCounter(progression, "rootwardenDefeated") > 0 ||
      isQuestStarted(progression, "first_rootwarden");
    const mastered = isQuestDone(progression, "first_rootwarden");
    return {
      discovered: seen,
      mastered,
      visibleClues: mastered ? 2 : seen ? 1 : 0,
    };
  }

  return { discovered: false, mastered: false, visibleClues: 0 };
}

function isQuestStarted(progression, questId) {
  return ["active", "complete", "done"].includes(progression.questStates?.[questId]);
}

function isQuestDone(progression, questId) {
  return progression.questStates?.[questId] === "done";
}

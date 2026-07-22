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
  if (!entry) {
    return {
      discovered: false,
      mastered: false,
      visibleClues: 0,
      progressCount: 0,
      masteryTarget: 1,
      knowledgeLabel: "UNKNOWN",
      progressLabel: "No field record",
      counterKnown: false,
      nextStudyHint: "Follow the regional lead to discover this threat.",
    };
  }

  const counterValue = Math.max(
    0,
    ...(entry.counterKeys || []).map((key) => getQuestCounter(progression, key))
  );
  const masteryTarget = entry.masteryCount || 1;
  const discovered = Boolean(
    counterValue > 0 ||
      (entry.seenQuestId && isQuestStarted(progression, entry.seenQuestId))
  );
  const mastered = Boolean(
    counterValue >= masteryTarget ||
      (entry.masteryQuestId && isQuestDone(progression, entry.masteryQuestId))
  );
  const visibleClues = mastered ? 2 : discovered ? 1 : 0;
  return {
    discovered,
    mastered,
    visibleClues,
    progressCount: counterValue,
    masteryTarget,
    knowledgeLabel: getKnowledgeLabel(discovered, mastered),
    progressLabel: getProgressLabel(discovered, mastered, counterValue, masteryTarget),
    counterKnown: Boolean(mastered && entry.counterItemId),
    nextStudyHint: getNextStudyHint(entry, discovered, mastered, counterValue, masteryTarget),
  };
}

function getKnowledgeLabel(discovered, mastered) {
  if (mastered) return "COUNTER LOGGED";
  if (discovered) return "FIELD READ";
  return "UNKNOWN";
}

function getProgressLabel(discovered, mastered, counterValue, masteryTarget) {
  if (!discovered) return "Unseen";
  if (mastered) return "Mastered";
  return `${Math.min(counterValue, masteryTarget)}/${masteryTarget} studied`;
}

function getNextStudyHint(entry, discovered, mastered, counterValue, masteryTarget) {
  if (!discovered) {
    return "Follow the regional lead to identify this threat.";
  }
  if (mastered) {
    return entry.counterItemId
      ? "Counter advice has been filed in the journal."
      : "Ayla has enough field notes to read this threat.";
  }
  const remaining = Math.max(1, masteryTarget - counterValue);
  return `Study ${remaining} more encounter${remaining === 1 ? "" : "s"} to reveal the counter note.`;
}

function isQuestStarted(progression, questId) {
  return ["active", "complete", "done"].includes(progression.questStates?.[questId]);
}

function isQuestDone(progression, questId) {
  return progression.questStates?.[questId] === "done";
}

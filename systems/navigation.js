import { CHAPTER_ENTRY_SCENES, QUEST_TARGET_SCENES } from "../data/navigationData.js";
import { REGION_DEFS } from "../data/regionData.js";
import { SCENES } from "../data/sceneNetwork.js";
import { QUEST_DEFS } from "../data/storyData.js";
import { getQuestCounter } from "./progression.js";
import { getRegionStatus } from "./regions.js";

const STATUS_PRIORITY = {
  complete: 0,
  active: 1,
  available: 2,
};

export function getCampaignNavigation(progression, sceneProgress = {}, currentSceneId = null) {
  const chapterId = progression.campaign?.activeChapter || "heartwood";
  const quest = Object.values(QUEST_DEFS)
    .filter(
      (entry) =>
        entry.kind === "main" &&
        entry.chapter === chapterId &&
        STATUS_PRIORITY[progression.questStates?.[entry.id]] !== undefined
    )
    .sort(
      (a, b) =>
        STATUS_PRIORITY[progression.questStates[a.id]] -
        STATUS_PRIORITY[progression.questStates[b.id]]
    )[0];

  if (!quest) {
    if (
      chapterId === "stillwater" &&
      progression.questStates?.chapel_of_tides === "done" &&
      progression.questStates?.stillwater_homecoming === "inactive"
    ) {
      const memoryRecovered =
        getQuestCounter(progression, "tideMemoryRecovered") > 0;
      return buildNavigationView({
        chapterId,
        quest: QUEST_DEFS.stillwater_homecoming,
        status: "regional-lead",
        targetSceneIds: [
          memoryRecovered ? "mossroot_marsh" : "chapel_of_tides",
        ],
        currentSceneId,
        hint: memoryRecovered
          ? "Carry the recovered memory back to Nettle."
          : "Listen to the memory left in the quieted chapel.",
      });
    }
    if (
      chapterId === "ember" &&
      progression.questStates?.cinder_warden === "done" &&
      progression.questStates?.ember_homecoming === "inactive"
    ) {
      const emberRecovered =
        getQuestCounter(progression, "forgeEmberRecovered") > 0;
      return buildNavigationView({
        chapterId,
        quest: QUEST_DEFS.ember_homecoming,
        status: "regional-lead",
        targetSceneIds: ["emberpine_grove"],
        currentSceneId,
        hint: emberRecovered
          ? "Carry the Firewatch Ember back to Garrick."
          : "Recover the steady ember left inside the quieted firewatch ring.",
      });
    }

    const entrySceneId = CHAPTER_ENTRY_SCENES[chapterId];
    return buildNavigationView({
      chapterId,
      quest: null,
      status: "chapter-entry",
      targetSceneIds: entrySceneId ? [entrySceneId] : [],
      currentSceneId,
      hint: entrySceneId
        ? `Travel to ${SCENES[entrySceneId]?.title || entrySceneId} and find the local keeper.`
        : "Listen for the next root.",
    });
  }

  const status = progression.questStates[quest.id];
  const targetSceneIds = resolveQuestTargets(
    quest,
    status,
    progression,
    sceneProgress
  );
  return buildNavigationView({
    chapterId,
    quest,
    status,
    targetSceneIds,
    currentSceneId,
    hint: getNavigationHint(quest.id, status, targetSceneIds),
  });
}

export function getRegionJournalView(
  progression,
  sceneProgress = {},
  currentSceneId = null,
  chapterId = progression.campaign?.activeChapter || "heartwood"
) {
  const region = REGION_DEFS[chapterId] || REGION_DEFS.heartwood;
  const activeChapter = progression.campaign?.activeChapter || "heartwood";
  const navigation =
    chapterId === activeChapter
      ? getCampaignNavigation(progression, sceneProgress, currentSceneId)
      : {
          chapterId,
          questId: null,
          questTitle: "Regional Archive",
          status: "archive",
          targetSceneIds: [],
          targetTitles: [],
          targetLabel: "No active lead",
          atTarget: false,
          hint: getRegionStatus(progression, sceneProgress, region.id).description,
        };
  const status = getRegionStatus(progression, sceneProgress, region.id);
  const knownTargets = new Set(navigation.targetSceneIds);
  const locations = region.sceneIds.map((sceneId) => ({
    sceneId,
    title: SCENES[sceneId]?.title || sceneId,
    current: sceneId === currentSceneId,
    cleared: Boolean(sceneProgress?.[sceneId]?.cleared),
    discovered:
      sceneId === currentSceneId ||
      Boolean(sceneProgress?.[sceneId]) ||
      knownTargets.has(sceneId) ||
      (sceneId === region.hubSceneId &&
        progression.campaign?.activeChapter === region.id),
  }));

  return {
    id: region.id,
    name: region.name,
    status,
    damageType: region.damageType,
    counterRecipeId: region.counterRecipeId,
    preparationActive:
      progression.activePreparation?.damageType === region.damageType,
    locations,
    navigation,
  };
}

function resolveQuestTargets(quest, status, progression, sceneProgress) {
  if ((status === "available" || status === "complete") && quest.giverId) {
    return quest.sceneId ? [quest.sceneId] : [];
  }

  if (quest.id === "tidebound_threshold") {
    const marshSeal = Boolean(
      sceneProgress?.mossroot_marsh?.objectStates?.["tide-seal-1"]
    );
    const ruinsSeal = Boolean(
      sceneProgress?.mossy_ruins?.objectStates?.["tide-seal-2"]
    );
    const targets = [];
    if (!marshSeal) targets.push("mossroot_marsh");
    if (!ruinsSeal) targets.push("mossy_ruins");
    return targets.length > 0 ? targets : ["mossroot_marsh"];
  }

  if (quest.id === "stillwater_homecoming") {
    return getQuestCounter(progression, "tideMemoryRecovered") > 0
      ? ["mossroot_marsh"]
      : ["chapel_of_tides"];
  }
  if (quest.id === "ember_homecoming") {
    return ["emberpine_grove"];
  }

  return [...(QUEST_TARGET_SCENES[quest.id] || (quest.sceneId ? [quest.sceneId] : []))];
}

function buildNavigationView({
  chapterId,
  quest,
  status,
  targetSceneIds,
  currentSceneId,
  hint,
}) {
  const targetTitles = targetSceneIds.map(
    (sceneId) => SCENES[sceneId]?.title || sceneId
  );
  return {
    chapterId,
    questId: quest?.id || null,
    questTitle: quest?.title || "New Regional Lead",
    status,
    targetSceneIds,
    targetTitles,
    targetLabel: targetTitles.join(" / ") || "No destination",
    atTarget: targetSceneIds.includes(currentSceneId),
    hint,
  };
}

function getNavigationHint(questId, status, targetSceneIds) {
  if (status === "complete") return "Return to the quest giver.";
  if (status === "available") return "Speak with the local keeper.";
  if (questId === "bogbound_rot") {
    return "Cleanse the black roots after the marsh encounter is settled.";
  }
  if (questId === "tidebound_threshold") {
    return targetSceneIds.length > 1
      ? "One Tide Seal lies in the marsh; the other remains in Mossy Ruins."
      : "Recover the remaining Tide Seal.";
  }
  if (questId === "chapel_of_tides") {
    return "Relight both braziers, defeat Bog Matron, then read the memory she guarded.";
  }
  if (questId === "stillwater_homecoming") {
    return targetSceneIds.includes("chapel_of_tides")
      ? "Recover the Matron's memory from the quieted chapel."
      : "Carry the recovered memory back to Nettle.";
  }
  if (questId === "ember_totems") {
    return status === "complete"
      ? "Return to Garrick so the totems can open the guardian road."
      : "Clear the ember line, then rekindle all three warding totems.";
  }
  if (questId === "cinder_warden") {
    return "Cross the reopened firewatch line and read the gaps between marked eruptions.";
  }
  if (questId === "ember_homecoming") {
    return "Recover the Firewatch Ember, then return it to Garrick at the western watch.";
  }
  return `Continue toward ${targetSceneIds.map((id) => SCENES[id]?.title || id).join(" / ")}.`;
}

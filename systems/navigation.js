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
    if (
      chapterId === "frost" &&
      progression.questStates?.veil_seraph === "done" &&
      progression.questStates?.frost_homecoming === "inactive"
    ) {
      const messageRecovered =
        getQuestCounter(progression, "seraphMessageRecovered") > 0;
      return buildNavigationView({
        chapterId,
        quest: QUEST_DEFS.frost_homecoming,
        status: "regional-lead",
        targetSceneIds: ["frostveil_tundra"],
        currentSceneId,
        hint: messageRecovered
          ? "Carry the Winter Letter back to Vesper."
          : "Recover the message Veil Seraph preserved at the quieted seal.",
      });
    }
    if (
      chapterId === "scarroot" &&
      progression.questStates?.elder_hollow === "done" &&
      progression.questStates?.scarroot_homecoming === "inactive"
    ) {
      const memoryRecovered =
        getQuestCounter(progression, "firstKeeperMemoryRecovered") > 0;
      return buildNavigationView({
        chapterId,
        quest: QUEST_DEFS.scarroot_homecoming,
        status: "regional-lead",
        targetSceneIds: [
          memoryRecovered ? "blighted_woods" : "hollowheart_ruins",
        ],
        currentSceneId,
        hint: memoryRecovered
          ? "Carry the first keeper's living memory back to Bram."
          : "Listen to the memory left in the quieted Hollowheart Court.",
      });
    }
    if (
      chapterId === "rootlight" &&
      progression.questStates?.starfall_sanctum === "done" &&
      progression.questStates?.the_sixth_answer === "inactive"
    ) {
      const echoRecovered =
        getQuestCounter(progression, "starwokenEchoRecovered") > 0;
      return buildNavigationView({
        chapterId,
        quest: QUEST_DEFS.the_sixth_answer,
        status: "regional-lead",
        targetSceneIds: [
          echoRecovered ? "ancient_heart" : "starfall_sanctum",
        ],
        currentSceneId,
        hint: echoRecovered
          ? "Carry the Sentinel's final echo back to Selka."
          : "Recover the final echo left beneath the quieted pilgrim spire.",
      });
    }
    if (
      chapterId === "rootlight" &&
      progression.questStates?.the_sixth_answer === "done" &&
      progression.questStates?.second_spring === "inactive"
    ) {
      return buildNavigationView({
        chapterId,
        quest: QUEST_DEFS.second_spring,
        status: "regional-lead",
        targetSceneIds: ["ayla_homestead"],
        currentSceneId,
        hint: "Return to the Homestead and plant the Heartseed.",
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
    hint: getNavigationHint(quest.id, status, targetSceneIds, progression),
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
  if (quest.id === "frost_homecoming") {
    return ["frostveil_tundra"];
  }
  if (quest.id === "scarroot_homecoming") {
    return getQuestCounter(progression, "firstKeeperMemoryRecovered") > 0
      ? ["blighted_woods"]
      : ["hollowheart_ruins"];
  }
  if (quest.id === "the_sixth_answer") {
    return getQuestCounter(progression, "starwokenEchoRecovered") > 0
      ? ["ancient_heart"]
      : ["starfall_sanctum"];
  }
  if (quest.id === "second_spring") {
    return ["ayla_homestead"];
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

function getNavigationHint(questId, status, targetSceneIds, progression) {
  if (status === "complete") return "Return to the quest giver.";
  if (status === "available") return "Speak with the local keeper.";
  if (questId === "wake_hearthroot") {
    return "Approach the silent shrine beside Ayla's cottage and answer its pulse.";
  }
  if (questId === "first_moonleaf") {
    if (getQuestCounter(progression, "moonleafPlanted") < 1) {
      return "Plant one of the Hearthroot's Moonleaf seeds in any garden plot.";
    }
    if (getQuestCounter(progression, "moonleafWatered") < 1) {
      return "Water the planted Moonleaf before resting.";
    }
    if (getQuestCounter(progression, "moonleafGrown") < 1) {
      return "Sleep once at Ayla's bed so the watered Moonleaf can mature.";
    }
    return "Harvest the mature Moonleaf at dawn.";
  }
  if (questId === "thorn_at_gate") {
    return "Follow the road into Whispering Woods and clear the two creatures carrying the thorn-mark.";
  }
  if (questId === "brew_before_blood") {
    return "Return to the Homestead cauldron and brew one Barkskin Draught.";
  }
  if (questId === "first_rootwarden") {
    return "Enter Mossy Ruins with Barkskin prepared and move through the open lane in Root Crown.";
  }
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
  if (questId === "lost_scout") {
    return status === "complete"
      ? "Return the recovered ridge signal to Vesper."
      : "Clear the lower ridge and inspect the scout camp.";
  }
  if (questId === "veil_seraph") {
    return "Follow the recovered signal into the seal and move early when pale frost marks the ground.";
  }
  if (questId === "frost_homecoming") {
    return "Recover the Winter Letter, then return it to Vesper before the thaw begins.";
  }
  if (questId === "blight_watch") {
    return status === "complete"
      ? "Return to Bram so he can open the old court road."
      : "Clear the border creatures, then shatter both effigies masking the court.";
  }
  if (questId === "elder_hollow") {
    return "Enter Hollowheart Court and leave the unmarked lane before Single Will closes.";
  }
  if (questId === "scarroot_homecoming") {
    return targetSceneIds.includes("hollowheart_ruins")
      ? "Recover the first keeper's living memory from the quieted court."
      : "Carry the memory back to Bram at the Scarroot border.";
  }
  if (questId === "pilgrims_lantern") {
    return "Clear the Ancient Heart, gather both Heart Blooms, and restore the paired star seals.";
  }
  if (questId === "starfall_sanctum") {
    if (getQuestCounter(progression, "starfallTruthRecovered") < 1) {
      return "Clear the Pilgrim Archive, relight its braziers, and listen to the sealed memory.";
    }
    if (getQuestCounter(progression, "starwokenSentinelDefeated") < 1) {
      return "Return through the awakened archive and face Starwoken Sentinel.";
    }
    return "Recover the Sentinel echo beneath the quieted spire.";
  }
  if (questId === "the_sixth_answer") {
    return targetSceneIds.includes("starfall_sanctum")
      ? "Recover the Sentinel's final echo from the pilgrim spire."
      : "Carry the echo back to Selka at the Ancient Heart.";
  }
  if (questId === "second_spring") {
    return "Plant the Heartseed in the prepared earth beside Ayla's home.";
  }
  return `Continue toward ${targetSceneIds.map((id) => SCENES[id]?.title || id).join(" / ")}.`;
}

import { CAMPAIGN_CHAPTER_ORDER, CAMPAIGN_CHAPTERS } from "../data/campaignData.js";

export function createCampaignProgress(snapshot = null) {
  return {
    activeChapter: CAMPAIGN_CHAPTER_ORDER.includes(snapshot?.activeChapter)
      ? snapshot.activeChapter
      : CAMPAIGN_CHAPTER_ORDER[0],
    completedChapters: normalizeIds(snapshot?.completedChapters, CAMPAIGN_CHAPTER_ORDER),
    restoredRoots: normalizeIds(snapshot?.restoredRoots, CAMPAIGN_CHAPTER_ORDER),
    unlockedAspects: normalizeIds(
      snapshot?.unlockedAspects,
      Object.values(CAMPAIGN_CHAPTERS).map((chapter) => chapter.aspect)
    ),
    loadoutSlots: Math.max(0, Math.min(3, Math.floor(snapshot?.loadoutSlots || 0))),
    trainingGroveUnlocked: Boolean(snapshot?.trainingGroveUnlocked),
    trainingGroupUnlocked: Boolean(snapshot?.trainingGroupUnlocked),
    trainingEliteUnlocked: Boolean(snapshot?.trainingEliteUnlocked),
    journalUnlocked: Boolean(snapshot?.journalUnlocked),
    campaignCompleted: Boolean(snapshot?.campaignCompleted),
  };
}

export function syncCampaignProgress(progression, sceneProgress = {}) {
  progression.campaign = createCampaignProgress(progression.campaign);
  progression.worldFlags = progression.worldFlags || {};
  progression.regionProgress = progression.regionProgress || {};

  migrateCompletedRegionalReturns(progression, sceneProgress);
  for (const chapterId of ["stillwater", "ember", "frost"]) {
    reconcileRestoration(progression, sceneProgress, chapterId);
  }

  const completed = CAMPAIGN_CHAPTER_ORDER.filter((chapterId) => {
    const chapter = CAMPAIGN_CHAPTERS[chapterId];
    return Boolean(progression.worldFlags[chapter.restoredFlag]);
  });
  const completedSet = new Set(completed);

  progression.campaign.completedChapters = completed;
  progression.campaign.restoredRoots = [...completed];
  progression.campaign.unlockedAspects = completed.map(
    (chapterId) => CAMPAIGN_CHAPTERS[chapterId].aspect
  );
  progression.campaign.activeChapter =
    CAMPAIGN_CHAPTER_ORDER.find((chapterId) => !completedSet.has(chapterId)) || "rootlight";
  progression.campaign.journalUnlocked = completedSet.has("heartwood");
  progression.campaign.trainingGroveUnlocked = completedSet.has("heartwood");
  progression.campaign.trainingGroupUnlocked = completedSet.has("stillwater");
  progression.campaign.trainingEliteUnlocked = completedSet.has("frost");
  progression.campaign.loadoutSlots = completedSet.has("frost")
    ? 3
    : completedSet.has("ember")
      ? 2
      : completedSet.has("heartwood")
        ? 1
        : 0;
  progression.campaign.campaignCompleted = completedSet.has("rootlight");

  return progression.campaign;
}

function migrateCompletedRegionalReturns(progression, sceneProgress) {
  const migrations = [
    {
      chapterId: "ember",
      restoredFlag: "ember_restored",
      guardianQuestId: "cinder_warden",
      returnQuestId: "ember_homecoming",
      bossSceneId: "emberpine_grove",
    },
    {
      chapterId: "frost",
      restoredFlag: "frost_restored",
      guardianQuestId: "veil_seraph",
      returnQuestId: "frost_homecoming",
      bossSceneId: "frostveil_tundra",
    },
  ];

  for (const migration of migrations) {
    if (
      progression.worldFlags[migration.restoredFlag] &&
      progression.questStates?.[migration.guardianQuestId] === "done" &&
      progression.questStates?.[migration.returnQuestId] !== "done" &&
      (sceneProgress?.[migration.bossSceneId]?.cleared ||
        progression.regionProgress?.[migration.chapterId]?.bossDefeated)
    ) {
      progression.questStates[migration.returnQuestId] = "done";
    }
  }
}

function reconcileRestoration(progression, sceneProgress, chapterId) {
  const chapter = CAMPAIGN_CHAPTERS[chapterId];
  const restorationComplete =
    progression.questStates?.[chapter.restorationQuestId] === "done";
  const bossDefeated = Boolean(
    sceneProgress?.[chapter.bossSceneId]?.cleared ||
      progression.regionProgress?.[chapterId]?.bossDefeated
  );

  if (
    !restorationComplete ||
    (chapter.restorationRequiresBossClear && !bossDefeated)
  ) {
    progression.worldFlags[chapter.restoredFlag] = false;
  } else {
    progression.worldFlags[chapter.restoredFlag] = true;
  }
}

function normalizeIds(values, allowedValues) {
  if (!Array.isArray(values)) return [];
  const allowed = new Set(allowedValues);
  return [...new Set(values.filter((value) => allowed.has(value)))];
}

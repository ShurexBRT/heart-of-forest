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
    journalUnlocked: Boolean(snapshot?.journalUnlocked),
    campaignCompleted: Boolean(snapshot?.campaignCompleted),
  };
}

export function syncCampaignProgress(progression, sceneProgress = {}) {
  progression.campaign = createCampaignProgress(progression.campaign);
  progression.worldFlags = progression.worldFlags || {};
  progression.regionProgress = progression.regionProgress || {};

  reconcileBossGatedRestoration(progression, sceneProgress, "ember");
  reconcileBossGatedRestoration(progression, sceneProgress, "frost");

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

function reconcileBossGatedRestoration(progression, sceneProgress, chapterId) {
  const chapter = CAMPAIGN_CHAPTERS[chapterId];
  const bossDefeated = Boolean(
    sceneProgress?.[chapter.bossSceneId]?.cleared ||
      progression.regionProgress?.[chapterId]?.bossDefeated
  );

  if (!bossDefeated) {
    progression.worldFlags[chapter.restoredFlag] = false;
  } else if (progression.questStates?.[chapter.bossQuestId] === "done") {
    progression.worldFlags[chapter.restoredFlag] = true;
  }
}

function normalizeIds(values, allowedValues) {
  if (!Array.isArray(values)) return [];
  const allowed = new Set(allowedValues);
  return [...new Set(values.filter((value) => allowed.has(value)))];
}

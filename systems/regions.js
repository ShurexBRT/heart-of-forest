import { REGION_DEFS, REGION_STATUS, getRegionForScene } from "../data/regionData.js";
import { addCurrency, addItem, incrementQuestCounter } from "./progression.js";

export function ensureRegionProgress(progression) {
  if (!progression.regionProgress || typeof progression.regionProgress !== "object") {
    progression.regionProgress = {};
  }

  for (const region of Object.values(REGION_DEFS)) {
    const current = progression.regionProgress[region.id] || {};
    progression.regionProgress[region.id] = {
      bossDefeated: Boolean(current.bossDefeated),
      echoDay: Math.max(0, Math.floor(current.echoDay || 0)),
      echoSceneId: current.echoSceneId || null,
      firstOpenedDay: Math.max(0, Math.floor(current.firstOpenedDay || 0)),
    };
  }

  return progression.regionProgress;
}

export function getRegionStatus(progression, sceneProgress, regionOrSceneId) {
  const region =
    REGION_DEFS[regionOrSceneId] ||
    getRegionForScene(regionOrSceneId);
  if (!region) return REGION_STATUS.infested;

  const regionProgress = ensureRegionProgress(progression)[region.id];
  if (progression.worldFlags?.[region.restoredFlag]) {
    return REGION_STATUS.restored;
  }

  if (
    regionProgress.bossDefeated ||
    (!region.stagedBossScene && sceneProgress?.[region.bossSceneId]?.cleared)
  ) {
    return REGION_STATUS.secured;
  }

  const opened = region.sceneIds.some((sceneId) => sceneProgress?.[sceneId]?.cleared);
  return opened ? REGION_STATUS.unstable : REGION_STATUS.infested;
}

export function markRegionSceneCleared(
  progression,
  sceneProgress,
  sceneId,
  day = 1,
  options = {}
) {
  const region = getRegionForScene(sceneId);
  if (!region) return null;

  const progress = ensureRegionProgress(progression)[region.id];
  if (!progress.firstOpenedDay) {
    progress.firstOpenedDay = Math.max(1, Math.floor(day || 1));
  }

  if (sceneId === region.bossSceneId && options.bossDefeated !== false) {
    progress.bossDefeated = true;
  }

  return getRegionStatus(progression, sceneProgress, region.id);
}

export function shouldStartCorruptionEcho(progression, sceneProgress, sceneId, day = 1) {
  const context = getCorruptionEchoContext(
    progression,
    sceneProgress,
    sceneId,
    day
  );
  return Boolean(context?.available);
}

export function getCorruptionEchoContext(
  progression,
  sceneProgress,
  sceneId,
  day = 1
) {
  const region = getRegionForScene(sceneId);
  if (!region || !sceneProgress?.[sceneId]?.cleared) return null;

  const currentDay = Math.max(1, Math.floor(day || 1));
  const progress = ensureRegionProgress(progression)[region.id];
  if (progress.echoDay >= currentDay) return null;

  const postgame = Boolean(
    progression.campaign?.campaignCompleted &&
      progression.worldFlags?.[region.restoredFlag]
  );
  const postgameScene = (region.postgameEchoSceneIds || []).includes(sceneId);
  if (postgame && postgameScene) {
    return {
      available: true,
      postgame: true,
      regionId: region.id,
      sceneId,
      day: currentDay,
      reward: region.echoReward || { items: { relic_shard: 1 }, silver: 18 },
    };
  }

  if (sceneId === region.bossSceneId || sceneId === region.hubSceneId) {
    return null;
  }

  const status = getRegionStatus(progression, sceneProgress, region.id);
  if (status.id !== "unstable") return null;

  return {
    available: true,
    postgame: false,
    regionId: region.id,
    sceneId,
    day: currentDay,
    reward: null,
  };
}

export function getPostgameEchoStatus(
  progression,
  sceneProgress,
  regionOrSceneId,
  day = 1
) {
  const region =
    REGION_DEFS[regionOrSceneId] ||
    getRegionForScene(regionOrSceneId);
  if (!region) return { unlocked: false, available: false };

  const unlocked = Boolean(
    progression.campaign?.campaignCompleted &&
      progression.worldFlags?.[region.restoredFlag]
  );
  const sceneIds = region.postgameEchoSceneIds || [];
  const currentDay = Math.max(1, Math.floor(day || 1));
  const progress = ensureRegionProgress(progression)[region.id];
  const completedToday = progress.echoDay >= currentDay;
  const targetSceneId =
    sceneIds.find((sceneId) => sceneProgress?.[sceneId]?.cleared) ||
    sceneIds[0] ||
    null;

  return {
    unlocked,
    available: Boolean(unlocked && !completedToday && targetSceneId),
    completedToday,
    day: currentDay,
    regionId: region.id,
    sceneIds,
    targetSceneId,
    lastSceneId: progress.echoSceneId || null,
  };
}

export function getPostgameEchoLead(
  progression,
  sceneProgress,
  currentSceneId = null,
  day = 1
) {
  if (!progression.campaign?.campaignCompleted) return null;

  const statuses = Object.values(REGION_DEFS)
    .map((region) =>
      getPostgameEchoStatus(progression, sceneProgress, region.id, day)
    )
    .filter((status) => status.available);
  if (statuses.length === 0) {
    return {
      available: false,
      completedToday: true,
      targetSceneId: "ayla_homestead",
      day: Math.max(1, Math.floor(day || 1)),
    };
  }

  return (
    statuses.find((status) => status.targetSceneId === currentSceneId) ||
    statuses[0]
  );
}

export function markCorruptionEchoCompleted(progression, sceneId, day = 1) {
  const region = getRegionForScene(sceneId);
  if (!region) return null;

  const progress = ensureRegionProgress(progression)[region.id];
  const currentDay = Math.max(1, Math.floor(day || 1));
  const postgame = Boolean(
    progression.campaign?.campaignCompleted &&
      progression.worldFlags?.[region.restoredFlag]
  );

  progress.echoDay = currentDay;
  progress.echoSceneId = sceneId;
  return {
    regionId: region.id,
    sceneId,
    day: currentDay,
    postgame,
    reward: postgame
      ? region.echoReward || { items: { relic_shard: 1 }, silver: 18 }
      : null,
  };
}

export function awardCorruptionEchoRewards(progression, echoResult) {
  if (!echoResult?.postgame || !echoResult.reward) {
    return { items: [], silver: 0 };
  }

  const granted = [];
  for (const [itemId, amount] of Object.entries(echoResult.reward.items || {})) {
    addItem(progression, itemId, amount);
    granted.push({ itemId, amount });
  }

  const silver = Math.max(0, Math.floor(echoResult.reward.silver || 0));
  if (silver > 0) {
    addCurrency(progression, silver);
  }

  incrementQuestCounter(progression, "corruptionEchoesSilenced", 1);
  incrementQuestCounter(progression, `${echoResult.regionId}EchoesSilenced`, 1);
  return { items: granted, silver };
}

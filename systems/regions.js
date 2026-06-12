import { REGION_DEFS, REGION_STATUS, getRegionForScene } from "../data/regionData.js";

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

  if (regionProgress.bossDefeated || sceneProgress?.[region.bossSceneId]?.cleared) {
    return REGION_STATUS.secured;
  }

  const opened = region.sceneIds.some((sceneId) => sceneProgress?.[sceneId]?.cleared);
  return opened ? REGION_STATUS.unstable : REGION_STATUS.infested;
}

export function markRegionSceneCleared(progression, sceneProgress, sceneId, day = 1) {
  const region = getRegionForScene(sceneId);
  if (!region) return null;

  const progress = ensureRegionProgress(progression)[region.id];
  if (!progress.firstOpenedDay) {
    progress.firstOpenedDay = Math.max(1, Math.floor(day || 1));
  }

  if (sceneId === region.bossSceneId) {
    progress.bossDefeated = true;
  }

  return getRegionStatus(progression, sceneProgress, region.id);
}

export function shouldStartCorruptionEcho(progression, sceneProgress, sceneId, day = 1) {
  const region = getRegionForScene(sceneId);
  if (!region || sceneId === region.bossSceneId || sceneId === region.hubSceneId) return false;
  if (!sceneProgress?.[sceneId]?.cleared) return false;

  const status = getRegionStatus(progression, sceneProgress, region.id);
  if (status.id !== "unstable") return false;

  const progress = ensureRegionProgress(progression)[region.id];
  return progress.echoDay < Math.max(1, Math.floor(day || 1));
}

export function markCorruptionEchoCompleted(progression, sceneId, day = 1) {
  const region = getRegionForScene(sceneId);
  if (!region) return;

  const progress = ensureRegionProgress(progression)[region.id];
  progress.echoDay = Math.max(1, Math.floor(day || 1));
  progress.echoSceneId = sceneId;
}

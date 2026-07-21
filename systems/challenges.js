import { SCENES } from "../data/sceneNetwork.js";
import {
  addCurrency,
  addItem,
  incrementQuestCounter,
} from "./progression.js";

export const RELIQUARY_TRIAL_SCENE_ID = "sunken_reliquary";

export const RELIQUARY_TRIAL_REWARD = {
  items: {
    relic_shard: 2,
    greater_spirit_tonic: 1,
    ward_elixir: 1,
  },
  silver: 46,
  renewalSupplies: 1,
};

export function ensurePostgameChallenges(progression) {
  if (!progression || typeof progression !== "object") {
    return {
      reliquary: {
        completedDay: 0,
        completions: 0,
      },
    };
  }

  if (
    !progression.postgameChallenges ||
    typeof progression.postgameChallenges !== "object"
  ) {
    progression.postgameChallenges = {};
  }

  const current = progression.postgameChallenges.reliquary || {};
  progression.postgameChallenges.reliquary = {
    completedDay: Math.max(0, Math.floor(current.completedDay || 0)),
    completions: Math.max(0, Math.floor(current.completions || 0)),
  };

  return progression.postgameChallenges;
}

export function getReliquaryTrialStatus(
  progression,
  sceneProgress = {},
  day = 1
) {
  const currentDay = Math.max(1, Math.floor(day || 1));
  const progress = ensurePostgameChallenges(progression).reliquary;
  const completedToday = progress.completedDay >= currentDay;
  const sceneCleared = Boolean(
    sceneProgress?.[RELIQUARY_TRIAL_SCENE_ID]?.cleared
  );
  const unlocked = Boolean(
    progression?.campaign?.campaignCompleted &&
      progression?.worldFlags?.second_spring_started &&
      progression?.worldFlags?.sunken_reliquary_cleansed &&
      sceneCleared
  );

  return {
    id: "reliquary_trial",
    title: "Reliquary Trial",
    targetSceneId: RELIQUARY_TRIAL_SCENE_ID,
    targetTitle:
      SCENES[RELIQUARY_TRIAL_SCENE_ID]?.title || "Sunken Reliquary",
    unlocked,
    available: Boolean(unlocked && !completedToday),
    completedToday,
    day: currentDay,
    completions: progress.completions,
    reward: RELIQUARY_TRIAL_REWARD,
  };
}

export function shouldStartReliquaryTrial(
  progression,
  sceneProgress,
  sceneId,
  day = 1
) {
  if (sceneId !== RELIQUARY_TRIAL_SCENE_ID) return false;
  return getReliquaryTrialStatus(progression, sceneProgress, day).available;
}

export function activateReliquaryTrial(encounter) {
  encounter.isReliquaryTrial = true;
  encounter.title = "Reliquary Trial";
  encounter.threatTier = Math.max(encounter.threatTier || 1, 5);
  encounter.completionText = "Reliquary Trial Quieted";
  encounter.bannerText = "Reliquary Trial";
  encounter.bannerTimer = Math.max(encounter.bannerTimer || 0, 2);
}

export function markReliquaryTrialCompleted(progression, day = 1) {
  const currentDay = Math.max(1, Math.floor(day || 1));
  const progress = ensurePostgameChallenges(progression).reliquary;
  progress.completedDay = currentDay;
  progress.completions += 1;
  return {
    id: "reliquary_trial",
    sceneId: RELIQUARY_TRIAL_SCENE_ID,
    day: currentDay,
    completions: progress.completions,
    reward: RELIQUARY_TRIAL_REWARD,
  };
}

export function awardReliquaryTrialRewards(progression, trialResult) {
  if (!trialResult?.reward) {
    return { items: [], silver: 0, renewalSupplies: 0 };
  }

  const granted = [];
  for (const [itemId, amount] of Object.entries(trialResult.reward.items || {})) {
    addItem(progression, itemId, amount);
    granted.push({ itemId, amount });
  }

  const silver = Math.max(0, Math.floor(trialResult.reward.silver || 0));
  if (silver > 0) {
    addCurrency(progression, silver);
  }

  const renewalSupplies = Math.max(
    0,
    Math.floor(trialResult.reward.renewalSupplies || 0)
  );
  if (renewalSupplies > 0) {
    incrementQuestCounter(
      progression,
      "homesteadRenewalSupplies",
      renewalSupplies
    );
  }
  incrementQuestCounter(progression, "reliquaryTrialsCompleted", 1);

  return { items: granted, silver, renewalSupplies };
}

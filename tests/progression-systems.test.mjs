import test from "node:test";
import assert from "node:assert/strict";

import {
  addItem,
  awardEnemyLoot,
  attuneEquipmentItem,
  awardRewards,
  createProgression,
  getCurrency,
  getItemCount,
  getItemAttunementLevel,
  isItemLocked,
  getPlayerBonuses,
  getQuestCounter,
  getTalentUnlockState,
  sellInventoryItem,
  toggleItemLock,
  unlockTalent,
  useConsumable,
} from "../systems/progression.js";
import { craftRecipe } from "../systems/alchemy.js";
import { damagePlayer } from "../systems/combat.js";
import {
  awardCorruptionEchoRewards as awardEchoRewards,
  getPostgameEchoStatus,
  getRegionStatus,
  markCorruptionEchoCompleted,
  markRegionSceneCleared,
  shouldStartCorruptionEcho,
} from "../systems/regions.js";
import { getSecondSpringBoardView } from "../systems/postgame.js";
import {
  awardReliquaryTrialRewards,
  getReliquaryTrialStatus,
  markReliquaryTrialCompleted,
  shouldStartReliquaryTrial,
} from "../systems/challenges.js";
import { REGION_DEFS } from "../data/regionData.js";
import { QUEST_DEFS } from "../data/storyData.js";
import { syncCampaignProgress } from "../systems/campaign.js";

test("talent branches enforce prerequisites and one signature capstone", () => {
  const progression = createProgression({
    talentPoints: 8,
    inventory: {},
  });

  assert.equal(unlockTalent(progression, "waystep"), false);
  assert.equal(unlockTalent(progression, "oaken_reach"), true);
  assert.equal(unlockTalent(progression, "waystep"), true);
  assert.equal(unlockTalent(progression, "counterbloom"), true);
  assert.equal(unlockTalent(progression, "warden_vigor"), true);
  assert.equal(unlockTalent(progression, "heartwood_tempest"), false);
  assert.match(
    getTalentUnlockState(progression, "heartwood_tempest").reason,
    /Restore Scarroot/i
  );
  progression.worldFlags.signature_rite_unlocked = true;
  assert.equal(unlockTalent(progression, "heartwood_tempest"), true);
  assert.equal(unlockTalent(progression, "spirit_reservoir"), true);
  assert.equal(unlockTalent(progression, "focused_bolt"), true);
  assert.equal(unlockTalent(progression, "verdant_nova"), false);
  assert.equal(getPlayerBonuses(progression).signatureAbility, "heartwood_tempest");
});

test("equipped gear can be attuned through three material-gated ranks", () => {
  const progression = createProgression({
    silver: 500,
    inventory: {
      ironbark: 2,
      relic_shard: 5,
      heartseed: 1,
    },
  });
  const baseBonuses = getPlayerBonuses(progression);

  assert.equal(attuneEquipmentItem(progression, "warden_brooch").attuned, true);
  assert.equal(getItemAttunementLevel(progression, "warden_brooch"), 1);
  assert.equal(progression.silver, 420);
  assert.equal(progression.inventory.ironbark, 0);
  assert.ok(getPlayerBonuses(progression).maxHpBonus > baseBonuses.maxHpBonus);

  assert.equal(attuneEquipmentItem(progression, "warden_brooch").attuned, true);
  assert.equal(progression.silver, 280);
  assert.equal(progression.inventory.relic_shard, 3);

  assert.equal(attuneEquipmentItem(progression, "warden_brooch").attuned, true);
  assert.equal(getItemAttunementLevel(progression, "warden_brooch"), 3);
  assert.equal(progression.silver, 60);
  assert.equal(progression.inventory.relic_shard, 0);
  assert.equal(progression.inventory.heartseed, 0);
  assert.equal(attuneEquipmentItem(progression, "warden_brooch").attuned, false);
});

test("brewing consumes ingredients and preparation replaces the active counter", () => {
  const progression = createProgression({
    silver: 30,
    inventory: {
      moonleaf: 3,
      ironbark: 1,
      bog_amber: 2,
    },
    unlockedRecipes: {
      barkskin_draught: true,
      antitoxin_bloom: true,
    },
  });
  const player = {
    maxHp: 100,
    hp: 100,
    maxSpirit: 100,
    spirit: 100,
  };

  assert.equal(craftRecipe(progression, "barkskin_draught").crafted, true);
  assert.equal(useConsumable(progression, "barkskin_draught", player).used, true);
  assert.equal(progression.activePreparation.damageType, "thorn");

  addItem(progression, "antitoxin_bloom", 1);
  assert.equal(useConsumable(progression, "antitoxin_bloom", player).used, true);
  assert.equal(progression.activePreparation.damageType, "mire");
});

test("region status advances without rolling scene progress back", () => {
  const progression = createProgression();
  const sceneProgress = {};

  assert.equal(getRegionStatus(progression, sceneProgress, "heartwood").id, "infested");
  sceneProgress.whispering_woods = { cleared: true };
  markRegionSceneCleared(progression, sceneProgress, "whispering_woods", 1);
  assert.equal(getRegionStatus(progression, sceneProgress, "heartwood").id, "unstable");

  sceneProgress.mossy_ruins = { cleared: true };
  markRegionSceneCleared(progression, sceneProgress, "mossy_ruins", 2);
  assert.equal(getRegionStatus(progression, sceneProgress, "heartwood").id, "secured");

  progression.worldFlags.heartwood_restored = true;
  assert.equal(getRegionStatus(progression, sceneProgress, "heartwood").id, "restored");
  assert.equal(sceneProgress.whispering_woods.cleared, true);
});

test("Second Spring echoes return daily without rolling restored scenes back", () => {
  const { progression, sceneProgress } = createCompletedCampaignState();
  const startSilver = getCurrency(progression);

  assert.equal(progression.campaign.campaignCompleted, true);
  assert.equal(getRegionStatus(progression, sceneProgress, "heartwood").id, "restored");
  assert.equal(
    getPostgameEchoStatus(progression, sceneProgress, "heartwood", 4).available,
    true
  );
  assert.equal(
    shouldStartCorruptionEcho(progression, sceneProgress, "whispering_woods", 4),
    true
  );
  assert.equal(
    shouldStartCorruptionEcho(progression, sceneProgress, "ayla_homestead", 4),
    false
  );

  const echoResult = markCorruptionEchoCompleted(
    progression,
    "whispering_woods",
    4
  );
  const reward = awardEchoRewards(progression, echoResult);

  assert.equal(echoResult.postgame, true);
  assert.deepEqual(reward.items, [
    { itemId: "moonleaf", amount: 2 },
    { itemId: "ironbark", amount: 1 },
  ]);
  assert.equal(reward.silver, 16);
  assert.equal(getCurrency(progression), startSilver + 16);
  assert.equal(getItemCount(progression, "moonleaf"), 3);
  assert.equal(getItemCount(progression, "ironbark"), 1);
  assert.equal(getQuestCounter(progression, "corruptionEchoesSilenced"), 1);
  assert.equal(sceneProgress.whispering_woods.cleared, true);
  assert.equal(
    shouldStartCorruptionEcho(progression, sceneProgress, "whispering_woods", 4),
    false
  );
  assert.equal(
    getPostgameEchoStatus(progression, sceneProgress, "heartwood", 4).completedToday,
    true
  );
  assert.equal(
    shouldStartCorruptionEcho(progression, sceneProgress, "whispering_woods", 5),
    true
  );
});

test("Second Spring board summarizes open and quiet echo roads", () => {
  const { progression, sceneProgress } = createCompletedCampaignState();
  const firstBoard = getSecondSpringBoardView(
    progression,
    sceneProgress,
    4,
    "ayla_homestead"
  );

  assert.equal(firstBoard.unlocked, true);
  assert.equal(firstBoard.availableCount, 6);
  assert.equal(firstBoard.quietCount, 0);
  assert.equal(firstBoard.leadRow.targetSceneId, "whispering_woods");
  assert.ok(
    firstBoard.summaryLines.some((line) => /Whispering Woods/i.test(line))
  );

  markCorruptionEchoCompleted(progression, "whispering_woods", 4);
  const nextBoard = getSecondSpringBoardView(
    progression,
    sceneProgress,
    4,
    "ayla_homestead"
  );
  const heartwoodRow = nextBoard.rows.find(
    (row) => row.regionId === "heartwood"
  );

  assert.equal(nextBoard.availableCount, 5);
  assert.equal(nextBoard.quietCount, 1);
  assert.equal(nextBoard.leadRow.targetSceneId, "chapel_of_tides");
  assert.equal(heartwoodRow.state, "quiet");
  assert.ok(
    nextBoard.summaryLines.some((line) => /Chapel of Tides/i.test(line))
  );
  assert.ok(
    nextBoard.summaryLines.some((line) => /Quiet today: Heartwood/i.test(line))
  );

  Object.assign(progression.worldFlags, {
    sunken_reliquary_open: true,
    sunken_reliquary_cleansed: true,
  });
  sceneProgress.sunken_reliquary = { cleared: true };
  const trialBoard = getSecondSpringBoardView(
    progression,
    sceneProgress,
    4,
    "ayla_homestead"
  );
  assert.equal(trialBoard.reliquaryTrial.available, true);
  assert.ok(
    trialBoard.summaryLines.some((line) => /Sunken Reliquary is awake/i.test(line))
  );
});

test("Reliquary Trial returns daily rewards without duplicating named boss gear", () => {
  const { progression, sceneProgress } = createCompletedCampaignState();
  Object.assign(progression.worldFlags, {
    ruins_listening_post: true,
    sunken_reliquary_open: true,
    sunken_reliquary_cleansed: true,
  });
  Object.assign(progression.questStates, {
    ruins_of_memory: "done",
    sealed_reliquary: "done",
    depths_of_memory: "done",
  });
  sceneProgress.sunken_reliquary = { cleared: true };
  syncCampaignProgress(progression, sceneProgress);
  const startSilver = getCurrency(progression);

  assert.equal(
    shouldStartReliquaryTrial(
      progression,
      sceneProgress,
      "sunken_reliquary",
      9
    ),
    true
  );
  assert.equal(
    getReliquaryTrialStatus(progression, sceneProgress, 9).available,
    true
  );

  const trialResult = markReliquaryTrialCompleted(progression, 9);
  const reward = awardReliquaryTrialRewards(progression, trialResult);

  assert.deepEqual(reward.items, [
    { itemId: "relic_shard", amount: 2 },
    { itemId: "greater_spirit_tonic", amount: 1 },
    { itemId: "ward_elixir", amount: 1 },
  ]);
  assert.equal(reward.silver, 46);
  assert.equal(reward.renewalSupplies, 1);
  assert.equal(getCurrency(progression), startSilver + 46);
  assert.equal(getItemCount(progression, "relic_shard"), 2);
  assert.equal(getQuestCounter(progression, "homesteadRenewalSupplies"), 1);
  assert.equal(getQuestCounter(progression, "reliquaryTrialsCompleted"), 1);
  assert.equal(sceneProgress.sunken_reliquary.cleared, true);
  assert.equal(
    shouldStartReliquaryTrial(
      progression,
      sceneProgress,
      "sunken_reliquary",
      9
    ),
    false
  );
  assert.equal(
    shouldStartReliquaryTrial(
      progression,
      sceneProgress,
      "sunken_reliquary",
      10
    ),
    true
  );

  const bossProgression = createProgression();
  const bossLoot = awardEnemyLoot(
    bossProgression,
    "rootbound_custodian",
    "ancient",
    { isBoss: true, id: "rootbound_custodian", isPostgameTrial: true }
  );
  assert.deepEqual(bossLoot.items, [
    { itemId: "relic_shard", amount: 1 },
    { itemId: "spirit_bloom", amount: 2 },
  ]);
  assert.equal(getItemCount(bossProgression, "custodian_spindle"), 0);
  assert.equal(getItemCount(bossProgression, "reliquary_loop"), 0);
});

test("Ember line clear does not count as the guardian defeat", () => {
  const progression = createProgression();
  const sceneProgress = {
    emberpine_grove: { cleared: true },
  };

  markRegionSceneCleared(
    progression,
    sceneProgress,
    "emberpine_grove",
    2,
    { bossDefeated: false }
  );

  assert.equal(progression.regionProgress.ember.bossDefeated, false);
  assert.equal(
    getRegionStatus(progression, sceneProgress, "ember").id,
    "unstable"
  );
});

test("campaign preparations unlock before their target regions", () => {
  const progression = createProgression({
    silver: 120,
    inventory: {
      moonleaf: 6,
      stonebloom: 3,
      cinder_resin: 2,
    },
  });
  const player = {
    maxHp: 100,
    hp: 100,
    maxSpirit: 100,
    spirit: 100,
  };

  awardRewards(progression, QUEST_DEFS.ruins_of_memory.rewards);
  assert.equal(progression.unlockedRecipes.emberward_infusion, true);
  assert.equal(REGION_DEFS.ember.counterRecipeId, "emberward_infusion");
  assert.equal(craftRecipe(progression, "emberward_infusion").crafted, true);
  assert.equal(useConsumable(progression, "emberward_infusion", player).used, true);
  assert.equal(progression.activePreparation.damageType, "fire");

  awardRewards(progression, QUEST_DEFS.ember_totems.rewards);
  assert.equal(progression.unlockedRecipes.cinderheart_cordial, true);
  assert.equal(REGION_DEFS.frost.counterRecipeId, "cinderheart_cordial");
  assert.equal(craftRecipe(progression, "cinderheart_cordial").crafted, true);
  assert.equal(useConsumable(progression, "cinderheart_cordial", player).used, true);
  assert.equal(progression.activePreparation.damageType, "frost");

  awardRewards(progression, QUEST_DEFS.lost_scout.rewards);
  assert.equal(progression.unlockedRecipes.heartcleanse_elixir, true);
  assert.equal(REGION_DEFS.scarroot.counterRecipeId, "heartcleanse_elixir");
  assert.equal(craftRecipe(progression, "heartcleanse_elixir").crafted, true);
  assert.equal(useConsumable(progression, "heartcleanse_elixir", player).used, true);
  assert.equal(progression.activePreparation.damageType, "corruption");

  awardRewards(progression, QUEST_DEFS.blight_watch.rewards);
  awardRewards(progression, QUEST_DEFS.elder_hollow.rewards);
  awardRewards(progression, QUEST_DEFS.scarroot_homecoming.rewards);
  assert.equal(progression.unlockedRecipes.starward_draught, true);
  assert.equal(REGION_DEFS.rootlight.counterRecipeId, "starward_draught");
  assert.equal(craftRecipe(progression, "starward_draught").crafted, true);
  assert.equal(useConsumable(progression, "starward_draught", player).used, true);
  assert.equal(progression.activePreparation.damageType, "astral");
});

test("regional preparation reduces only its matching damage type", () => {
  const makeState = (damageType) => ({
    gameOver: false,
    progression: {
      activePreparation: {
        itemId: "emberward_infusion",
        damageType,
        damageReduction: 0.25,
      },
    },
    player: {
      x: 0,
      y: 0,
      hp: 100,
      vx: 0,
      vy: 0,
      incomingDamageMult: 1,
      abilityInfo: {},
      isInvulnerable: () => false,
    },
    particles: [],
    shake: 0,
    combatTimer: 0,
    audio: { enabled: false },
  });

  const matched = makeState("fire");
  assert.equal(damagePlayer(matched, 40, 200, 0, 0, "fire"), true);
  assert.equal(matched.player.hp, 70);
  assert.ok(matched.hitStop > 0);
  assert.equal(matched.combatText[0].text, "-30");

  const mismatched = makeState("frost");
  assert.equal(damagePlayer(mismatched, 40, 200, 0, 0, "fire"), true);
  assert.equal(mismatched.player.hp, 60);
});

test("campaign migration removes premature regional restoration", () => {
  const progression = createProgression({
    worldFlags: {
      stillwater_restored: true,
      ember_pass_reopened: true,
      ember_restored: true,
      frost_restored: true,
      scarroot_restored: true,
      rootlight_restored: true,
    },
    questStates: {
      chapel_of_tides: "done",
      ember_totems: "done",
      lost_scout: "done",
      blight_watch: "done",
      pilgrims_lantern: "done",
    },
  });

  syncCampaignProgress(progression, {});

  assert.equal(progression.worldFlags.stillwater_restored, false);
  assert.equal(progression.worldFlags.ember_restored, false);
  assert.equal(progression.worldFlags.frost_restored, false);
  assert.equal(progression.worldFlags.scarroot_restored, false);
  assert.equal(progression.worldFlags.rootlight_restored, false);
  assert.equal(progression.campaign.activeChapter, "heartwood");
});

test("legacy Heartwood tutorial progress gains the new road flags and step counters", () => {
  const progression = createProgression({
    questStates: {
      wake_hearthroot: "done",
      first_moonleaf: "done",
      thorn_at_gate: "done",
      brew_before_blood: "done",
    },
  });

  syncCampaignProgress(progression, {});

  assert.equal(progression.worldFlags.heartwood_first_harvest, true);
  assert.equal(progression.worldFlags.heartwood_ruins_open, true);
  assert.equal(progression.questCounters.moonleafPlanted, 1);
  assert.equal(progression.questCounters.moonleafWatered, 1);
  assert.equal(progression.questCounters.moonleafGrown, 1);
  assert.equal(progression.questCounters.moonleafHarvested, 1);
});

test("legacy restored guardians gain their regional return quests", () => {
  const progression = createProgression({
    worldFlags: {
      ember_restored: true,
      frost_restored: true,
      scarroot_restored: true,
      rootlight_restored: true,
    },
    questStates: {
      cinder_warden: "done",
      veil_seraph: "done",
      elder_hollow: "done",
      starfall_sanctum: "done",
    },
    regionProgress: {
      ember: { bossDefeated: true },
      frost: { bossDefeated: true },
      scarroot: { bossDefeated: true },
      rootlight: { bossDefeated: true },
    },
  });

  syncCampaignProgress(progression, {});

  assert.equal(progression.questStates.ember_homecoming, "done");
  assert.equal(progression.questStates.frost_homecoming, "done");
  assert.equal(progression.questStates.scarroot_homecoming, "done");
  assert.equal(progression.questStates.the_sixth_answer, "done");
  assert.equal(progression.questStates.second_spring, "done");
  assert.equal(progression.worldFlags.ember_restored, true);
  assert.equal(progression.worldFlags.frost_restored, true);
  assert.equal(progression.worldFlags.scarroot_restored, true);
  assert.equal(progression.worldFlags.rootlight_restored, true);
  assert.equal(progression.worldFlags.waystone_network_restored, true);
  assert.equal(progression.worldFlags.signature_rite_unlocked, true);
  assert.equal(progression.worldFlags.rootlight_harmonized, true);
  assert.equal(progression.worldFlags.second_spring_started, true);
  assert.equal(progression.campaign.campaignCompleted, true);
});

test("locked inventory items cannot be sold", () => {
  const progression = createProgression({
    inventory: { health_potion: 2 },
  });

  assert.equal(toggleItemLock(progression, "health_potion").locked, true);
  assert.equal(isItemLocked(progression, "health_potion"), true);
  assert.equal(sellInventoryItem(progression, "health_potion").sold, false);
  assert.equal(progression.inventory.health_potion, 2);

  assert.equal(toggleItemLock(progression, "health_potion").locked, false);
  assert.equal(sellInventoryItem(progression, "health_potion").sold, true);
  assert.equal(progression.inventory.health_potion, 1);
});

function createCompletedCampaignState() {
  const progression = createProgression({
    worldFlags: {
      heartwood_restored: true,
      stillwater_restored: true,
      ember_restored: true,
      frost_restored: true,
      scarroot_restored: true,
      rootlight_restored: true,
      second_spring_started: true,
    },
    questStates: {
      first_rootwarden: "done",
      stillwater_homecoming: "done",
      cinder_warden: "done",
      ember_homecoming: "done",
      veil_seraph: "done",
      frost_homecoming: "done",
      elder_hollow: "done",
      scarroot_homecoming: "done",
      pilgrims_lantern: "done",
      starfall_sanctum: "done",
      the_sixth_answer: "done",
      second_spring: "done",
    },
    regionProgress: {
      ember: { bossDefeated: true },
      frost: { bossDefeated: true },
      scarroot: { bossDefeated: true },
      rootlight: { bossDefeated: true },
    },
  });
  const sceneProgress = {
    whispering_woods: { cleared: true },
    chapel_of_tides: { cleared: true },
    emberpine_grove: { cleared: true },
    frostveil_tundra: { cleared: true },
    hollowheart_ruins: { cleared: true },
    starfall_sanctum: { cleared: true },
  };

  syncCampaignProgress(progression, sceneProgress);
  return { progression, sceneProgress };
}

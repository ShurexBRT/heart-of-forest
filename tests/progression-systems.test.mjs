import test from "node:test";
import assert from "node:assert/strict";

import {
  addItem,
  awardRewards,
  createProgression,
  getPlayerBonuses,
  unlockTalent,
  useConsumable,
} from "../systems/progression.js";
import { craftRecipe } from "../systems/alchemy.js";
import { damagePlayer } from "../systems/combat.js";
import { getRegionStatus, markRegionSceneCleared } from "../systems/regions.js";
import { REGION_DEFS } from "../data/regionData.js";
import { QUEST_DEFS } from "../data/storyData.js";

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
  assert.equal(unlockTalent(progression, "heartwood_tempest"), true);
  assert.equal(unlockTalent(progression, "spirit_reservoir"), true);
  assert.equal(unlockTalent(progression, "focused_bolt"), true);
  assert.equal(unlockTalent(progression, "verdant_nova"), false);
  assert.equal(getPlayerBonuses(progression).signatureAbility, "heartwood_tempest");
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

  const mismatched = makeState("frost");
  assert.equal(damagePlayer(mismatched, 40, 200, 0, 0, "fire"), true);
  assert.equal(mismatched.player.hp, 60);
});

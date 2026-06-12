import test from "node:test";
import assert from "node:assert/strict";

import {
  addItem,
  createProgression,
  getPlayerBonuses,
  unlockTalent,
  useConsumable,
} from "../systems/progression.js";
import { craftRecipe } from "../systems/alchemy.js";
import { getRegionStatus, markRegionSceneCleared } from "../systems/regions.js";

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

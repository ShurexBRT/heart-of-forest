import test from "node:test";
import assert from "node:assert/strict";

import { QUEST_DEFS } from "../data/storyData.js";
import { SCENES } from "../data/sceneNetwork.js";
import { createArena } from "../world/arena.js";

const GOLDEN_SLICE_QUESTS = [
  "wake_hearthroot",
  "first_moonleaf",
  "thorn_at_gate",
  "brew_before_blood",
  "first_rootwarden",
];

test("Golden Slice main quests form one unbroken progression chain", () => {
  const quests = GOLDEN_SLICE_QUESTS.map((id) => QUEST_DEFS[id]);
  assert.ok(quests.every(Boolean));

  assert.equal(quests[0].startState, "active");
  for (let index = 1; index < quests.length; index += 1) {
    assert.equal(
      quests[index].prerequisiteId,
      quests[index - 1].id,
      `${quests[index].id} must follow ${quests[index - 1].id}`
    );
  }

  assert.deepEqual(QUEST_DEFS.wake_hearthroot.completeFlags, ["hearthroot_awake"]);
  assert.deepEqual(QUEST_DEFS.first_moonleaf.completeFlags, ["heartwood_first_harvest"]);
  assert.ok(
    QUEST_DEFS.thorn_at_gate.rewards.recipes.includes("barkskin_draught"),
    "the road fight must teach the preparation recipe"
  );
  assert.deepEqual(QUEST_DEFS.brew_before_blood.completeFlags, ["heartwood_ruins_open"]);
  assert.deepEqual(QUEST_DEFS.first_rootwarden.completeFlags, ["heartwood_restored"]);
});

test("Golden Slice world gates match the quest rewards that open them", () => {
  assert.equal(
    SCENES.ayla_homestead.connections.forestPath.requiresFlag,
    "heartwood_first_harvest"
  );
  assert.equal(
    SCENES.whispering_woods.connections.northTrail.requiresFlag,
    "heartwood_ruins_open"
  );
  assert.equal(SCENES.mossy_ruins.bossEnabled, true);
  assert.equal(SCENES.mossy_ruins.bossId, "rootwarden");
  assert.equal(
    SCENES.whispering_woods.connections.eastRoad.requiresFlag,
    "heartwood_restored"
  );
});

test("restoring Heartwood visibly changes the return to Homestead", () => {
  const before = createArena({
    ...SCENES.ayla_homestead,
    worldFlags: {
      hearthroot_awake: true,
      heartwood_first_harvest: true,
      heartwood_restored: false,
    },
    questStates: {
      wake_hearthroot: "done",
      first_moonleaf: "done",
      thorn_at_gate: "done",
      brew_before_blood: "done",
      first_rootwarden: "active",
    },
    questCounters: {},
  });

  const after = createArena({
    ...SCENES.ayla_homestead,
    worldFlags: {
      hearthroot_awake: true,
      heartwood_first_harvest: true,
      heartwood_ruins_open: true,
      heartwood_restored: true,
    },
    questStates: {
      wake_hearthroot: "done",
      first_moonleaf: "done",
      thorn_at_gate: "done",
      brew_before_blood: "done",
      first_rootwarden: "done",
    },
    questCounters: {},
  });

  assert.equal(before.npcs.length, 0, "pre-restoration Homestead stays deliberately quiet");
  assert.ok(after.npcs.length >= 3, "restored Homestead must visibly repopulate");

  const beforeTraining = before.interactables.find(
    (entry) => entry.id === "training-grove-dummy"
  );
  const afterTraining = after.interactables.find(
    (entry) => entry.id === "training-grove-dummy"
  );
  assert.equal(beforeTraining, undefined);
  assert.ok(afterTraining, "Heartwood restoration must unlock a tangible home activity");

  const restoredShrine = after.interactables.find(
    (entry) => entry.id === "hearthroot-shrine"
  );
  assert.match(
    restoredShrine.dialogueLines.join(" "),
    /Heartwood remembers your hands/i,
    "the Hearthroot must acknowledge the restored region on return"
  );
});

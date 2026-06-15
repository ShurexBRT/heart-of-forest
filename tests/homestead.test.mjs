import test from "node:test";
import assert from "node:assert/strict";

import { INITIAL_SCENE_ID, SCENES } from "../data/sceneNetwork.js";
import { createEncounterState } from "../systems/encounter.js";
import { createArena } from "../world/arena.js";

test("new games begin at Ayla's peaceful homestead", () => {
  assert.equal(INITIAL_SCENE_ID, "ayla_homestead");
  assert.equal(SCENES.ayla_homestead.peaceful, true);
  assert.deepEqual(SCENES.ayla_homestead.waveTemplates, []);
});

test("homestead and Whispering Woods have a two-way path", () => {
  assert.equal(
    SCENES.ayla_homestead.connections.forestPath.toSceneId,
    "whispering_woods"
  );
  assert.equal(
    SCENES.whispering_woods.connections.homePath.toSceneId,
    "ayla_homestead"
  );
  assert.equal(
    SCENES.ayla_homestead.connections.forestPath.requiresFlag,
    "heartwood_first_harvest"
  );
});

test("Heartwood roads open in story order", () => {
  assert.equal(
    SCENES.whispering_woods.connections.northTrail.requiresFlag,
    "heartwood_ruins_open"
  );
  assert.equal(
    SCENES.whispering_woods.connections.eastRoad.requiresFlag,
    "heartwood_restored"
  );
});

test("homestead contains six repeatable plots and a repeatable bed", () => {
  const scene = SCENES.ayla_homestead;
  const arena = createArena(scene);
  const plots = arena.interactables.filter((entry) => entry.type === "farmPlot");
  const bed = arena.interactables.find((entry) => entry.type === "bed");

  assert.equal(plots.length, 6);
  assert.ok(plots.every((plot) => plot.repeatable && plot.action === "farm-plot"));
  assert.ok(bed);
  assert.equal(bed.repeatable, true);
  assert.equal(bed.action, "sleep");
  assert.equal(arena.exits[0].toSceneId, "whispering_woods");
});

test("Hearthroot dialogue follows Ayla from care to preparation", () => {
  const moonleafArena = createArena({
    ...SCENES.ayla_homestead,
    worldFlags: { hearthroot_awake: true },
    questStates: { first_moonleaf: "active" },
  });
  const moonleafShrine = moonleafArena.interactables.find(
    (entry) => entry.id === "hearthroot-shrine"
  );
  assert.match(moonleafShrine.dialogueLines.join(" "), /Plant one Moonleaf/i);

  const brewingArena = createArena({
    ...SCENES.ayla_homestead,
    worldFlags: {
      hearthroot_awake: true,
      heartwood_first_harvest: true,
    },
    questStates: {
      first_moonleaf: "done",
      thorn_at_gate: "done",
      brew_before_blood: "active",
    },
  });
  const brewingShrine = brewingArena.interactables.find(
    (entry) => entry.id === "hearthroot-shrine"
  );
  assert.match(brewingShrine.dialogueLines.join(" "), /cauldron/i);
  assert.match(brewingShrine.dialogueLines.join(" "), /Barkskin/i);
});

test("peaceful scenes create an idle encounter with no waves", () => {
  const scene = SCENES.ayla_homestead;
  const arena = createArena(scene);
  const encounter = createEncounterState(arena, scene);

  assert.equal(encounter.phase, "idle");
  assert.equal(encounter.totalWaves, 0);
  assert.deepEqual(encounter.wavePlans, []);
});

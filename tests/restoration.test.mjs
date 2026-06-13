import test from "node:test";
import assert from "node:assert/strict";

import { SCENES } from "../data/sceneNetwork.js";
import { createArena } from "../world/arena.js";

function buildScene(sceneId, worldFlags = {}) {
  return createArena({
    ...SCENES[sceneId],
    worldFlags,
  });
}

function countOverlay(arena, overlay) {
  return arena.tiles.flat().filter((tile) => tile.overlay === overlay).length;
}

test("regional restoration visibly settles Ember, Frost, and Scarroot", () => {
  const emberInfested = buildScene("emberpine_grove");
  const emberRestored = buildScene("emberpine_grove", {
    ember_pass_reopened: true,
    ember_restored: true,
  });
  assert.ok(emberInfested.hazards.length > 0);
  assert.equal(emberRestored.hazards.length, 0);
  assert.ok(emberRestored.npcs.some((npc) => npc.id === "mara"));
  assert.ok(countOverlay(emberRestored, "flowersWarm") > countOverlay(emberInfested, "flowersWarm"));

  const frostRestored = buildScene("frostveil_tundra", {
    ridge_signal_recovered: true,
    frost_restored: true,
  });
  assert.ok(frostRestored.npcs.some((npc) => npc.id === "mara"));

  const blightInfested = buildScene("blighted_woods");
  const blightRestored = buildScene("blighted_woods", {
    court_approach_secured: true,
    scarroot_restored: true,
  });
  assert.ok(blightInfested.hazards.length > 0);
  assert.equal(blightRestored.hazards.length, 0);
  assert.ok(blightRestored.npcs.some((npc) => npc.id === "mara"));
  assert.ok(countOverlay(blightRestored, "flowersWarm") > countOverlay(blightInfested, "flowersWarm"));

  const hollowInfested = buildScene("hollowheart_ruins");
  const hollowRestored = buildScene("hollowheart_ruins", {
    scarroot_restored: true,
  });
  assert.ok(hollowInfested.hazards.length > 0);
  assert.equal(hollowRestored.hazards.length, 0);

  const rootlightRestored = buildScene("ancient_heart", {
    rootlight_restored: true,
  });
  assert.ok(rootlightRestored.npcs.some((npc) => npc.id === "halen"));
});

test("defeating Rootwarden repopulates Heartwood and unlocks village services", () => {
  const woodsInfested = buildScene("whispering_woods");
  const woodsRestored = buildScene("whispering_woods", {
    heartwood_restored: true,
  });
  const ruinsInfested = buildScene("mossy_ruins");
  const ruinsRestored = buildScene("mossy_ruins", {
    heartwood_restored: true,
  });

  assert.equal(woodsInfested.npcs.length, 0);
  assert.equal(
    woodsInfested.interactables.some((entry) => entry.serviceId === "village_stash"),
    false
  );
  assert.equal(
    woodsInfested.interactables.some((entry) => entry.serviceId === "waystone_altar"),
    false
  );
  assert.ok(woodsRestored.npcs.some((npc) => npc.id === "elder_rowan"));
  assert.ok(woodsRestored.interactables.some((entry) => entry.serviceId === "village_stash"));
  assert.ok(woodsRestored.interactables.some((entry) => entry.serviceId === "waystone_altar"));
  assert.ok(
    countOverlay(woodsRestored, "flowersWarm") >
      countOverlay(woodsInfested, "flowersWarm")
  );
  assert.equal(ruinsInfested.npcs.length, 0);
  assert.ok(ruinsRestored.npcs.some((npc) => npc.id === "orras"));
  assert.ok(
    countOverlay(ruinsRestored, "flowersWarm") >
      countOverlay(ruinsInfested, "flowersWarm")
  );
});

import test from "node:test";
import assert from "node:assert/strict";

import { SCENES } from "../data/sceneNetwork.js";
import { collidesWithObstacle } from "../systems/collision.js";
import { createArena } from "../world/arena.js";

const PLAYER_RADIUS = 16;

function hasReachableInteractionPoint(arena, target) {
  const interactionRadius = target.interactionRadius || 54;
  const minRadius = Math.max(PLAYER_RADIUS + 2, 20);
  const maxRadius = interactionRadius - 2;

  for (let radius = minRadius; radius <= maxRadius; radius += 6) {
    for (let degrees = 0; degrees < 360; degrees += 10) {
      const angle = (degrees * Math.PI) / 180;
      const x = target.x + Math.cos(angle) * radius;
      const y = target.y + Math.sin(angle) * radius;

      if (x < arena.boundsPadding + PLAYER_RADIUS || x > arena.width - arena.boundsPadding - PLAYER_RADIUS) {
        continue;
      }

      if (y < arena.boundsPadding + PLAYER_RADIUS || y > arena.height - arena.boundsPadding - PLAYER_RADIUS) {
        continue;
      }

      if (!collidesWithObstacle(x, y, PLAYER_RADIUS, arena)) {
        return true;
      }
    }
  }

  return false;
}

test("scene interactables always expose at least one reachable interaction point", () => {
  const failures = [];

  for (const scene of Object.values(SCENES)) {
    const arena = createArena(scene);

    for (const interactable of arena.interactables) {
      if (!hasReachableInteractionPoint(arena, interactable)) {
        failures.push(`${scene.id}:${interactable.id}`);
      }
    }
  }

  assert.deepEqual(failures, []);
});

test("restored Homestead keeps the Training Grove reachable", () => {
  const scene = SCENES.ayla_homestead;
  const arena = createArena({
    ...scene,
    worldFlags: {
      heartwood_restored: true,
      hearthroot_awake: true,
    },
  });
  const trainingGrove = arena.interactables.find(
    (interactable) => interactable.id === "training-grove-dummy"
  );

  assert.ok(trainingGrove);
  assert.equal(hasReachableInteractionPoint(arena, trainingGrove), true);
});

test("Stillwater interactables remain reachable after restoration", () => {
  const homestead = createArena({
    ...SCENES.ayla_homestead,
    worldFlags: {
      heartwood_restored: true,
      stillwater_restored: true,
    },
  });
  const targetCircle = homestead.interactables.find(
    (interactable) => interactable.id === "training-grove-cluster"
  );
  const chapel = createArena({
    ...SCENES.chapel_of_tides,
    worldFlags: {
      chapel_of_tides_cleansed: true,
      stillwater_restored: true,
    },
  });
  const memory = chapel.interactables.find(
    (interactable) => interactable.id === "tide-memory"
  );

  assert.ok(targetCircle);
  assert.ok(memory);
  assert.equal(hasReachableInteractionPoint(homestead, targetCircle), true);
  assert.equal(hasReachableInteractionPoint(chapel, memory), true);
  assert.equal(chapel.hazards.length, 0);
});

test("Ember recovery and restored forge remain reachable", () => {
  const recoveryArena = createArena({
    ...SCENES.emberpine_grove,
    worldFlags: {
      ember_pass_reopened: true,
      cinder_warden_released: true,
    },
    questStates: {
      cinder_warden: "done",
    },
  });
  const firewatchEmber = recoveryArena.interactables.find(
    (interactable) => interactable.id === "firewatch-ember"
  );
  const restoredArena = createArena({
    ...SCENES.emberpine_grove,
    worldFlags: {
      ember_pass_reopened: true,
      cinder_warden_released: true,
      ember_restored: true,
    },
    questStates: {
      cinder_warden: "done",
      ember_homecoming: "done",
    },
  });
  const forge = restoredArena.interactables.find(
    (interactable) => interactable.id === "ember-forge"
  );

  assert.ok(firewatchEmber);
  assert.ok(forge);
  assert.equal(hasReachableInteractionPoint(recoveryArena, firewatchEmber), true);
  assert.equal(hasReachableInteractionPoint(restoredArena, forge), true);
  assert.equal(restoredArena.hazards.length, 0);
});

test("Frost restoration adds reachable waystone and Veil Drill", () => {
  const frost = createArena({
    ...SCENES.frostveil_tundra,
    worldFlags: {
      ridge_signal_recovered: true,
      veil_seraph_released: true,
      frost_restored: true,
    },
    questStates: {
      veil_seraph: "done",
      frost_homecoming: "done",
    },
  });
  const waystone = frost.interactables.find(
    (interactable) => interactable.id === "frost-waystone"
  );
  const homestead = createArena({
    ...SCENES.ayla_homestead,
    worldFlags: {
      heartwood_restored: true,
      stillwater_restored: true,
      frost_restored: true,
    },
  });
  const veilDrill = homestead.interactables.find(
    (interactable) => interactable.id === "training-grove-elite"
  );

  assert.ok(waystone);
  assert.ok(veilDrill);
  assert.equal(hasReachableInteractionPoint(frost, waystone), true);
  assert.equal(hasReachableInteractionPoint(homestead, veilDrill), true);
});

test("Scarroot memory, saplings, and restored grove remain reachable", () => {
  const memoryArena = createArena({
    ...SCENES.hollowheart_ruins,
    worldFlags: {
      court_approach_secured: true,
      elder_hollow_broken: true,
    },
    questStates: {
      elder_hollow: "done",
      scarroot_homecoming: "inactive",
    },
  });
  const memory = memoryArena.interactables.find(
    (interactable) => interactable.id === "first-keeper-memory"
  );
  const tendingArena = createArena({
    ...SCENES.blighted_woods,
    worldFlags: {
      court_approach_secured: true,
      elder_hollow_broken: true,
      scarroot_restored: true,
    },
    questStates: {
      scarroot_homecoming: "done",
      smallest_grove: "active",
    },
  });
  const saplings = tendingArena.interactables.filter((interactable) =>
    interactable.id.startsWith("scarroot-sapling-")
  );
  const restoredArena = createArena({
    ...SCENES.blighted_woods,
    worldFlags: {
      court_approach_secured: true,
      scarroot_restored: true,
      scarroot_nursery_restored: true,
    },
    questStates: {
      scarroot_homecoming: "done",
      smallest_grove: "done",
    },
  });
  const grove = restoredArena.interactables.find(
    (interactable) => interactable.id === "scarroot-smallest-grove"
  );

  assert.ok(memory);
  assert.equal(saplings.length, 3);
  assert.ok(grove);
  assert.equal(hasReachableInteractionPoint(memoryArena, memory), true);
  assert.equal(
    saplings.every((sapling) =>
      hasReachableInteractionPoint(tendingArena, sapling)
    ),
    true
  );
  assert.equal(hasReachableInteractionPoint(restoredArena, grove), true);
  assert.equal(restoredArena.hazards.length, 0);
});

test("Rootlight memories, chorus, and Second Spring remain reachable", () => {
  const archiveArena = createArena({
    ...SCENES.starfall_sanctum,
    worldFlags: {
      starfall_sanctum_open: true,
    },
    questStates: {
      starfall_sanctum: "active",
    },
    questCounters: {},
  });
  const archiveMemory = archiveArena.interactables.find(
    (interactable) => interactable.id === "pilgrim-archive-memory"
  );
  const echoArena = createArena({
    ...SCENES.starfall_sanctum,
    worldFlags: {
      starfall_sanctum_open: true,
      starfall_truth_recovered: true,
      starfall_sanctum_cleansed: true,
    },
    questStates: {
      starfall_sanctum: "done",
      the_sixth_answer: "inactive",
    },
    questCounters: {},
  });
  const sentinelEcho = echoArena.interactables.find(
    (interactable) => interactable.id === "starwoken-echo"
  );
  const ancientHeart = createArena({
    ...SCENES.ancient_heart,
    worldFlags: {
      rootlight_harmonized: true,
    },
  });
  const chorus = ancientHeart.interactables.find(
    (interactable) => interactable.id === "six-root-chorus"
  );
  const epilogue = createArena({
    ...SCENES.ayla_homestead,
    worldFlags: {
      heartwood_restored: true,
      epilogue_ready: true,
    },
  });
  const heartseedPlot = epilogue.interactables.find(
    (interactable) => interactable.id === "second-spring-heartseed"
  );
  const secondSpring = createArena({
    ...SCENES.ayla_homestead,
    worldFlags: {
      heartwood_restored: true,
      epilogue_ready: true,
      second_spring_started: true,
    },
  });
  const sapling = secondSpring.interactables.find(
    (interactable) => interactable.id === "second-spring-sapling"
  );
  const board = secondSpring.interactables.find(
    (interactable) => interactable.id === "second-spring-board"
  );

  assert.ok(archiveMemory);
  assert.ok(sentinelEcho);
  assert.ok(chorus);
  assert.ok(heartseedPlot);
  assert.ok(sapling);
  assert.ok(board);
  assert.equal(hasReachableInteractionPoint(archiveArena, archiveMemory), true);
  assert.equal(hasReachableInteractionPoint(echoArena, sentinelEcho), true);
  assert.equal(hasReachableInteractionPoint(ancientHeart, chorus), true);
  assert.equal(hasReachableInteractionPoint(epilogue, heartseedPlot), true);
  assert.equal(hasReachableInteractionPoint(secondSpring, sapling), true);
  assert.equal(hasReachableInteractionPoint(secondSpring, board), true);
});

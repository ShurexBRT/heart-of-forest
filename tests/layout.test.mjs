import test from "node:test";
import assert from "node:assert/strict";

import { QUEST_TARGET_SCENES } from "../data/navigationData.js";
import { SCENES } from "../data/sceneNetwork.js";
import { QUEST_DEFS } from "../data/storyData.js";
import { collidesWithObstacle, getSolidRects } from "../systems/collision.js";
import { getHoveredInteractionTarget } from "../systems/story.js";
import { createArena } from "../world/arena.js";

const PLAYER_RADIUS = 16;
const PATH_STEP = 18;
const DYNAMIC_SCENE_VARIANTS = [
  {
    sceneId: "ayla_homestead",
    label: "moonleaf",
    worldFlags: { hearthroot_awake: true },
    questStates: { first_moonleaf: "active" },
  },
  {
    sceneId: "ayla_homestead",
    label: "postgame-supply",
    worldFlags: { heartwood_restored: true, epilogue_ready: true, second_spring_started: true },
    questCounters: { homesteadRenewalSupplies: 3 },
  },
  {
    sceneId: "whispering_woods",
    label: "side-active",
    worldFlags: { heartwood_restored: true },
    questStates: { whispering_call: "active", apothecarys_route: "active" },
  },
  {
    sceneId: "mossroot_marsh",
    label: "all-active",
    worldFlags: { heartwood_restored: true, marsh_route_lit: true, chapel_of_tides_open: true },
    questStates: { bogbound_rot: "active", tidebound_threshold: "active", apothecarys_route: "active" },
  },
  {
    sceneId: "mossy_ruins",
    label: "optional-active",
    worldFlags: { heartwood_restored: true, ruins_listening_post: true, sunken_reliquary_open: true },
    questStates: { ruins_of_memory: "active", sealed_reliquary: "active", tidebound_threshold: "active" },
  },
  {
    sceneId: "chapel_of_tides",
    label: "active",
    worldFlags: { chapel_of_tides_open: true },
    questStates: { chapel_of_tides: "active" },
  },
  {
    sceneId: "emberpine_grove",
    label: "recovery",
    worldFlags: { ember_pass_reopened: true, cinder_warden_released: true },
    questStates: { cinder_warden: "done" },
  },
  {
    sceneId: "frostveil_tundra",
    label: "recovery",
    worldFlags: { ridge_signal_recovered: true, veil_seraph_released: true },
    questStates: { veil_seraph: "done" },
  },
  {
    sceneId: "hollowheart_ruins",
    label: "memory",
    worldFlags: { court_approach_secured: true, elder_hollow_broken: true },
    questStates: { elder_hollow: "done" },
  },
  {
    sceneId: "blighted_woods",
    label: "saplings",
    worldFlags: { court_approach_secured: true, scarroot_restored: true },
    questStates: { smallest_grove: "active" },
  },
  {
    sceneId: "ancient_heart",
    label: "active",
    worldFlags: { starfall_sanctum_open: true },
    questStates: { rootlight_threshold: "active" },
  },
  {
    sceneId: "starfall_sanctum",
    label: "archive-active",
    worldFlags: { starfall_sanctum_open: true },
    questStates: { starfall_sanctum: "active" },
  },
  {
    sceneId: "starfall_sanctum",
    label: "sentinel-echo",
    worldFlags: { starfall_sanctum_open: true, starfall_truth_recovered: true, starfall_sanctum_cleansed: true },
    questStates: { starfall_sanctum: "done" },
  },
];
const ALL_QUESTS_ACTIVE = Object.fromEntries(
  Object.keys(QUEST_DEFS).map((questId) => [questId, "active"])
);
const ALL_UNLOCK_FLAGS = {
  hearthroot_awake: true,
  heartwood_restored: true,
  ruins_listening_post: true,
  sunken_reliquary_open: true,
  marsh_route_lit: true,
  chapel_of_tides_open: true,
  ember_pass_reopened: true,
  cinder_warden_released: true,
  ridge_signal_recovered: true,
  veil_seraph_released: true,
  court_approach_secured: true,
  scarroot_restored: true,
  starfall_sanctum_open: true,
  starfall_truth_recovered: true,
  starfall_sanctum_cleansed: true,
  epilogue_ready: true,
  second_spring_started: true,
};

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

function getReachableWalkCells(arena) {
  const cols = Math.floor((arena.width - arena.boundsPadding * 2) / PATH_STEP) + 1;
  const rows = Math.floor((arena.height - arena.boundsPadding * 2) / PATH_STEP) + 1;
  const visited = new Set();
  const queue = [];
  const starts = [
    arena.playerSpawn,
    ...Object.values(arena.entrySpawns || {}),
  ];

  const toCell = (point) => ({
    cx: Math.max(
      0,
      Math.min(cols - 1, Math.round((point.x - arena.boundsPadding) / PATH_STEP))
    ),
    cy: Math.max(
      0,
      Math.min(rows - 1, Math.round((point.y - arena.boundsPadding) / PATH_STEP))
    ),
  });
  const toPoint = (cx, cy) => ({
    x: arena.boundsPadding + cx * PATH_STEP,
    y: arena.boundsPadding + cy * PATH_STEP,
  });
  const isWalkable = (cx, cy) => {
    if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return false;
    const point = toPoint(cx, cy);
    return !collidesWithObstacle(point.x, point.y, PLAYER_RADIUS, arena);
  };

  for (const start of starts) {
    const cell = toCell(start);
    if (!isWalkable(cell.cx, cell.cy)) continue;
    const key = `${cell.cx}:${cell.cy}`;
    if (visited.has(key)) continue;
    visited.add(key);
    queue.push(cell);
  }

  for (let index = 0; index < queue.length; index += 1) {
    const cell = queue[index];
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]) {
      const next = { cx: cell.cx + dx, cy: cell.cy + dy };
      const key = `${next.cx}:${next.cy}`;
      if (visited.has(key) || !isWalkable(next.cx, next.cy)) continue;
      visited.add(key);
      queue.push(next);
    }
  }

  return {
    has(point) {
      const cell = toCell(point);
      for (let cy = cell.cy - 1; cy <= cell.cy + 1; cy += 1) {
        for (let cx = cell.cx - 1; cx <= cell.cx + 1; cx += 1) {
          if (visited.has(`${cx}:${cy}`)) return true;
        }
      }
      return false;
    },
  };
}

function hasPathReachableInteractionPoint(arena, target) {
  const reachable = getReachableWalkCells(arena);
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

      if (
        !collidesWithObstacle(x, y, PLAYER_RADIUS, arena) &&
        reachable.has({ x, y })
      ) {
        return true;
      }
    }
  }

  return false;
}

function arenaWithOnlyObstacle(arena, obstacle) {
  return {
    ...arena,
    obstacles: [obstacle],
  };
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

test("large prop collision footprints leave readable empty corners open", () => {
  const homestead = createArena({
    ...SCENES.ayla_homestead,
    worldFlags: { heartwood_restored: true },
  });
  const cottage = homestead.obstacles.find((obstacle) => obstacle.type === "cottage");
  const well = homestead.obstacles.find((obstacle) => obstacle.type === "well");
  const rock = homestead.obstacles.find((obstacle) => obstacle.type === "rock");
  const chapel = createArena({
    ...SCENES.chapel_of_tides,
    worldFlags: { chapel_of_tides_open: true },
  });
  const ruin = chapel.obstacles.find((obstacle) => obstacle.type === "ruin");

  assert.ok(cottage);
  assert.ok(well);
  assert.ok(rock);
  assert.ok(ruin);

  for (const obstacle of [cottage, well, rock, ruin]) {
    assert.equal(getSolidRects(obstacle).length > 1, true);
  }

  const cottageOnly = arenaWithOnlyObstacle(homestead, cottage);
  assert.equal(
    collidesWithObstacle(cottage.anchorX, cottage.anchorY - 22, PLAYER_RADIUS, cottageOnly),
    true
  );
  assert.equal(
    collidesWithObstacle(cottage.x + 16, cottage.anchorY - 22, PLAYER_RADIUS, cottageOnly),
    false
  );
  assert.equal(
    collidesWithObstacle(cottage.x + cottage.w - 16, cottage.anchorY - 22, PLAYER_RADIUS, cottageOnly),
    false
  );

  const wellOnly = arenaWithOnlyObstacle(homestead, well);
  assert.equal(
    collidesWithObstacle(well.anchorX, well.anchorY - 14, PLAYER_RADIUS, wellOnly),
    true
  );
  assert.equal(collidesWithObstacle(well.x + 10, well.y + 10, PLAYER_RADIUS, wellOnly), false);
  assert.equal(
    collidesWithObstacle(well.x + well.w - 10, well.y + 10, PLAYER_RADIUS, wellOnly),
    false
  );

  const ruinOnly = arenaWithOnlyObstacle(chapel, ruin);
  assert.equal(
    collidesWithObstacle(ruin.anchorX, ruin.anchorY - 36, PLAYER_RADIUS, ruinOnly),
    true
  );
  assert.equal(collidesWithObstacle(ruin.x + 10, ruin.y + 18, PLAYER_RADIUS, ruinOnly), false);
  assert.equal(
    collidesWithObstacle(ruin.x + ruin.w - 10, ruin.y + 18, PLAYER_RADIUS, ruinOnly),
    false
  );
  assert.equal(
    collidesWithObstacle(ruin.x + 10, ruin.anchorY - 18, PLAYER_RADIUS, ruinOnly),
    false
  );
  assert.equal(
    collidesWithObstacle(ruin.x + ruin.w - 10, ruin.anchorY - 18, PLAYER_RADIUS, ruinOnly),
    false
  );

  const rockOnly = arenaWithOnlyObstacle(homestead, rock);
  assert.equal(
    collidesWithObstacle(rock.anchorX, rock.anchorY - 18, PLAYER_RADIUS, rockOnly),
    true
  );
  assert.equal(collidesWithObstacle(rock.x + 6, rock.y + 6, 8, rockOnly), false);
  assert.equal(collidesWithObstacle(rock.x + rock.w - 6, rock.y + 6, 8, rockOnly), false);
});

test("scene interactables can be path reached from a scene entry", () => {
  const failures = [];

  for (const scene of Object.values(SCENES)) {
    const arena = createArena(scene);

    for (const interactable of arena.interactables) {
      if (!hasPathReachableInteractionPoint(arena, interactable)) {
        failures.push(`${scene.id}:${interactable.id}`);
      }
    }
  }

  assert.deepEqual(failures, []);
});

test("dynamic quest interactables stay reachable across scene states", () => {
  const failures = [];

  for (const variant of DYNAMIC_SCENE_VARIANTS) {
    const scene = SCENES[variant.sceneId];
    const arena = createArena({
      ...scene,
      worldFlags: variant.worldFlags || {},
      questStates: variant.questStates || {},
      questCounters: variant.questCounters || {},
    });

    for (const interactable of arena.interactables) {
      if (!hasPathReachableInteractionPoint(arena, interactable)) {
        failures.push(`${variant.sceneId}:${variant.label}:${interactable.id}`);
      }
    }
  }

  assert.deepEqual(failures, []);
});

test("quest target data covers scenes that contain collectable objectives", () => {
  const collectScenes = new Map();
  const failures = [];

  for (const scene of Object.values(SCENES)) {
    const arena = createArena({
      ...scene,
      worldFlags: ALL_UNLOCK_FLAGS,
      questStates: ALL_QUESTS_ACTIVE,
      questCounters: { homesteadRenewalSupplies: 3 },
    });

    for (const interactable of arena.interactables) {
      if (!interactable.collectKey) continue;
      if (!collectScenes.has(interactable.collectKey)) {
        collectScenes.set(interactable.collectKey, new Set());
      }
      collectScenes.get(interactable.collectKey).add(scene.id);
    }
  }

  for (const quest of Object.values(QUEST_DEFS)) {
    const targetScenes = new Set(
      QUEST_TARGET_SCENES[quest.id] ||
        (quest.sceneId
          ? [quest.sceneId]
          : quest.autoActivateSceneId
            ? [quest.autoActivateSceneId]
            : [])
    );

    for (const objective of quest.objectives || []) {
      const scenes = collectScenes.get(objective.key);
      if (!scenes) continue;
      for (const sceneId of scenes) {
        if (!targetScenes.has(sceneId)) {
          failures.push(`${quest.id}:${objective.key}:${sceneId}`);
        }
      }
    }
  }

  assert.deepEqual(failures, []);
});

test("small collectable items have forgiving click and approach affordance", () => {
  const arena = createArena({
    ...SCENES.whispering_woods,
    worldFlags: { heartwood_restored: true },
    questStates: { whispering_call: "active" },
  });
  const flower = arena.interactables.find(
    (interactable) => interactable.id === "spirit-flower-1"
  );

  assert.ok(flower);

  const state = {
    arena,
    player: { x: flower.x + 80, y: flower.y },
    story: { hovered: null },
  };

  assert.equal(flower.collectKey, "spiritFlowers");
  assert.equal(flower.interactionRadius >= 64, true);
  assert.equal(
    getHoveredInteractionTarget(state, flower.x + 21, flower.y)?.data.id,
    flower.id
  );
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

test("Homestead renewal supplies remain readable and reachable", () => {
  const homestead = createArena({
    ...SCENES.ayla_homestead,
    worldFlags: {
      heartwood_restored: true,
      epilogue_ready: true,
      second_spring_started: true,
    },
    questCounters: {
      homesteadRenewalSupplies: 2,
    },
  });
  const cache = homestead.interactables.find(
    (interactable) => interactable.id === "homestead-renewal-cache"
  );

  assert.ok(cache);
  assert.equal(cache.serviceId, "homestead_renewal");
  assert.equal(hasReachableInteractionPoint(homestead, cache), true);
});

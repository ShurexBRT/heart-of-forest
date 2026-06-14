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

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

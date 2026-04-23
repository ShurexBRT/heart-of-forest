import { circleRectOverlap, clamp } from "../core/math.js";

export function getSolidRect(obstacle) {
  return obstacle.solid || obstacle;
}

export function moveCircleWithCollisions(entity, dx, dy, arena) {
  moveAxis(entity, dx, 0, arena);
  moveAxis(entity, 0, dy, arena);
  clampToBounds(entity, arena);
}

export function collidesWithObstacle(x, y, radius, arena) {
  return arena.obstacles.some((obstacle) =>
    circleRectOverlap(x, y, radius, getSolidRect(obstacle))
  );
}

function moveAxis(entity, dx, dy, arena) {
  if (dx === 0 && dy === 0) return;

  entity.x += dx;
  entity.y += dy;

  for (const obstacle of arena.obstacles) {
    const solid = getSolidRect(obstacle);

    if (!circleRectOverlap(entity.x, entity.y, entity.radius, solid)) {
      continue;
    }

    if (dx > 0) entity.x = solid.x - entity.radius;
    if (dx < 0) entity.x = solid.x + solid.w + entity.radius;
    if (dy > 0) entity.y = solid.y - entity.radius;
    if (dy < 0) entity.y = solid.y + solid.h + entity.radius;
  }
}

function clampToBounds(entity, arena) {
  const pad = arena.boundsPadding;

  entity.x = clamp(entity.x, pad + entity.radius, arena.width - pad - entity.radius);
  entity.y = clamp(entity.y, pad + entity.radius, arena.height - pad - entity.radius);
}

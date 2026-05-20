import { circleRectOverlap, clamp } from "../core/math.js";

const COLLISION_EPSILON = 0.01;

export function getSolidRect(obstacle) {
  if (obstacle.solid === false) return null;
  return obstacle.solid || obstacle;
}

export function moveCircleWithCollisions(entity, dx, dy, arena) {
  if (dx === 0 && dy === 0) {
    clampToBounds(entity, arena);
    return;
  }

  const distance = Math.hypot(dx, dy);
  const stepSize = Math.max(4, entity.radius * 0.42);
  const steps = Math.max(1, Math.ceil(distance / stepSize));
  const stepX = dx / steps;
  const stepY = dy / steps;

  for (let i = 0; i < steps; i += 1) {
    entity.x += stepX;
    resolveObstacleOverlaps(entity, arena);
    clampToBounds(entity, arena);

    entity.y += stepY;
    resolveObstacleOverlaps(entity, arena);
    clampToBounds(entity, arena);
  }
}

export function collidesWithObstacle(x, y, radius, arena) {
  return arena.obstacles.some((obstacle) => {
    if (shouldIgnoreObstacleAt(x, y, obstacle, arena)) return false;
    const solid = getSolidRect(obstacle);
    return solid ? circleRectOverlap(x, y, radius, solid) : false;
  });
}

function resolveObstacleOverlaps(entity, arena) {
  for (let pass = 0; pass < 3; pass += 1) {
    let adjusted = false;

    for (const obstacle of arena.obstacles) {
      if (shouldIgnoreObstacleAt(entity.x, entity.y, obstacle, arena)) continue;
      const solid = getSolidRect(obstacle);
      adjusted = (solid ? resolveCircleRectOverlap(entity, solid) : false) || adjusted;
    }

    if (!adjusted) break;
  }
}

function resolveCircleRectOverlap(entity, rect) {
  if (!circleRectOverlap(entity.x, entity.y, entity.radius, rect)) {
    return false;
  }

  const nearestX = clamp(entity.x, rect.x, rect.x + rect.w);
  const nearestY = clamp(entity.y, rect.y, rect.y + rect.h);
  let dx = entity.x - nearestX;
  let dy = entity.y - nearestY;
  const distanceSq = dx * dx + dy * dy;

  if (distanceSq > 0.000001) {
    const distance = Math.sqrt(distanceSq);
    const overlap = entity.radius - distance + COLLISION_EPSILON;
    if (overlap <= 0) return false;
    entity.x += (dx / distance) * overlap;
    entity.y += (dy / distance) * overlap;
    return true;
  }

  const left = Math.abs(entity.x - rect.x);
  const right = Math.abs(rect.x + rect.w - entity.x);
  const top = Math.abs(entity.y - rect.y);
  const bottom = Math.abs(rect.y + rect.h - entity.y);
  const minEdge = Math.min(left, right, top, bottom);

  if (minEdge === left) {
    entity.x = rect.x - entity.radius - COLLISION_EPSILON;
    return true;
  }

  if (minEdge === right) {
    entity.x = rect.x + rect.w + entity.radius + COLLISION_EPSILON;
    return true;
  }

  if (minEdge === top) {
    entity.y = rect.y - entity.radius - COLLISION_EPSILON;
    return true;
  }

  entity.y = rect.y + rect.h + entity.radius + COLLISION_EPSILON;
  return true;
}

function clampToBounds(entity, arena) {
  const pad = arena.boundsPadding;

  entity.x = clamp(entity.x, pad + entity.radius, arena.width - pad - entity.radius);
  entity.y = clamp(entity.y, pad + entity.radius, arena.height - pad - entity.radius);
}

function shouldIgnoreObstacleAt(x, y, obstacle, arena) {
  if (obstacle.type !== "water") return false;

  return arena.obstacles.some(
    (entry) =>
      entry.type === "bridge" &&
      x >= entry.x &&
      x <= entry.x + entry.w &&
      y >= entry.y &&
      y <= entry.y + entry.h
  );
}

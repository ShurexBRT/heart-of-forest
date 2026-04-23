export const TAU = Math.PI * 2;

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function length(x, y) {
  return Math.hypot(x, y);
}

export function distance(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

export function normalize(x, y) {
  const magnitude = Math.hypot(x, y);

  if (magnitude <= 0.0001) {
    return { x: 0, y: 0 };
  }

  return { x: x / magnitude, y: y / magnitude };
}

export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

export function angleDifference(a, b) {
  let diff = a - b;

  while (diff > Math.PI) diff -= TAU;
  while (diff < -Math.PI) diff += TAU;

  return diff;
}

export function circleRectOverlap(cx, cy, radius, rect) {
  const nearestX = clamp(cx, rect.x, rect.x + rect.w);
  const nearestY = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - nearestX;
  const dy = cy - nearestY;

  return dx * dx + dy * dy <= radius * radius;
}

export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export const ISO_SCALE_X = 0.75;
export const ISO_SCALE_Y = 0.375;
export const CAMERA_SCREEN_Y = 0.58;

export function projectWorld(x, y, height = 0) {
  return {
    x: (x - y) * ISO_SCALE_X,
    y: (x + y) * ISO_SCALE_Y - height,
  };
}

export function screenToWorld(screenX, screenY) {
  const worldX = screenY / (2 * ISO_SCALE_Y) + screenX / (2 * ISO_SCALE_X);
  const worldY = screenY / (2 * ISO_SCALE_Y) - screenX / (2 * ISO_SCALE_X);

  return { x: worldX, y: worldY };
}

export function getProjectedArenaBounds(arena) {
  const corners = [
    projectWorld(0, 0),
    projectWorld(arena.width, 0),
    projectWorld(0, arena.height),
    projectWorld(arena.width, arena.height),
  ];

  const xs = corners.map((corner) => corner.x);
  const ys = corners.map((corner) => corner.y);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function tree(x, y, size) {
  return {
    type: "tree",
    x,
    y,
    w: size,
    h: size + 22,
    solid: {
      x: x + size * 0.16,
      y: y + size * 0.34,
      w: size * 0.68,
      h: size * 0.56,
    },
  };
}

function rock(x, y, w, h) {
  return {
    type: "rock",
    x,
    y,
    w,
    h,
    solid: {
      x: x + 5,
      y: y + 4,
      w: w - 10,
      h: h - 8,
    },
  };
}

export function createArena() {
  return {
    width: 1360,
    height: 820,
    boundsPadding: 26,
    playerSpawn: { x: 245, y: 420 },
    spawnPoints: [
      { x: 188, y: 112 },
      { x: 520, y: 88 },
      { x: 898, y: 96 },
      { x: 1178, y: 156 },
      { x: 1238, y: 412 },
      { x: 1112, y: 678 },
      { x: 738, y: 718 },
      { x: 372, y: 708 },
      { x: 112, y: 580 },
      { x: 102, y: 296 },
    ],
    bossZone: {
      x: 828,
      y: 404,
      radius: 222,
    },
    bossAddSpawns: [
      { x: 638, y: 404 },
      { x: 828, y: 206 },
      { x: 1012, y: 404 },
      { x: 828, y: 602 },
    ],
    obstacles: [
      tree(105, 92, 98),
      tree(330, 622, 86),
      tree(548, 92, 108),
      tree(1072, 116, 96),
      tree(1160, 566, 92),
      tree(106, 560, 78),
      tree(766, 650, 82),
      rock(418, 278, 74, 46),
      rock(730, 256, 64, 42),
      rock(910, 506, 82, 50),
    ],
  };
}

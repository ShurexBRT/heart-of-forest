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
    enemySpawns: [
      { x: 835, y: 210, type: "basic" },
      { x: 1010, y: 370, type: "basic" },
      { x: 625, y: 600, type: "basic" },
      { x: 1060, y: 600, type: "brute" },
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

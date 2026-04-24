import { BIOMES } from "../data/gameData.js";
import { createRng, randomIntFrom } from "../systems/rng.js";

const TILE_SIZE = 16;
const COLS = 100;
const ROWS = 60;
const WIDTH = COLS * TILE_SIZE;
const HEIGHT = ROWS * TILE_SIZE;
const BOUNDS_PADDING = 32;

function createTile(rng) {
  return {
    ground: "grass",
    variant: randomIntFrom(rng, 0, 2),
    overlay: rng() > 0.9 ? "clover" : null,
  };
}

function createTiles(rng) {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => createTile(rng))
  );
}

function setGround(tiles, tx, ty, ground, variant = 0) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return;
  tiles[ty][tx].ground = ground;
  tiles[ty][tx].variant = variant;
}

function setOverlay(tiles, tx, ty, overlay) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return;
  tiles[ty][tx].overlay = overlay;
}

function stampEllipse(tiles, cx, cy, rx, ry, ground, variant = 0) {
  for (let ty = Math.floor(cy - ry); ty <= Math.ceil(cy + ry); ty += 1) {
    for (let tx = Math.floor(cx - rx); tx <= Math.ceil(cx + rx); tx += 1) {
      const nx = (tx - cx) / rx;
      const ny = (ty - cy) / ry;
      if (nx * nx + ny * ny <= 1) {
        setGround(tiles, tx, ty, ground, variant);
      }
    }
  }
}

function stampRect(tiles, x, y, w, h, ground, variant = 0) {
  for (let ty = y; ty < y + h; ty += 1) {
    for (let tx = x; tx < x + w; tx += 1) {
      setGround(tiles, tx, ty, ground, variant);
    }
  }
}

function paintPath(tiles, x0, y0, x1, y1, radius, variant = 0) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));

  for (let i = 0; i <= steps; i += 1) {
    const t = steps === 0 ? 0 : i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    stampEllipse(tiles, x, y, radius, radius * 0.8, "path", variant);
  }
}

function scatterFlowers(tiles, rng, x, y, w, h, count, overlay) {
  for (let i = 0; i < count; i += 1) {
    setOverlay(
      tiles,
      x + randomIntFrom(rng, 0, Math.max(0, w - 1)),
      y + randomIntFrom(rng, 0, Math.max(0, h - 1)),
      overlay
    );
  }
}

function clearOverlayRect(tiles, x, y, w, h) {
  for (let ty = y; ty < y + h; ty += 1) {
    for (let tx = x; tx < x + w; tx += 1) {
      setOverlay(tiles, tx, ty, null);
    }
  }
}

function tree(x, y, size, variant = 0) {
  return {
    type: "tree",
    variant,
    x,
    y,
    w: size,
    h: size + 40,
    sortY: y + size + 18,
    solid: {
      x: x + size * 0.3,
      y: y + size * 0.64,
      w: size * 0.38,
      h: size * 0.32,
    },
  };
}

function rock(x, y, w, h, variant = 0) {
  return {
    type: "rock",
    variant,
    x,
    y,
    w,
    h,
    sortY: y + h,
    solid: {
      x: x + 6,
      y: y + 6,
      w: w - 12,
      h: h - 10,
    },
  };
}

function fenceH(x, y, width) {
  return {
    type: "fenceH",
    x,
    y,
    w: width,
    h: 28,
    sortY: y + 24,
    solid: {
      x: x + 4,
      y: y + 12,
      w: width - 8,
      h: 8,
    },
  };
}

function fenceV(x, y, height) {
  return {
    type: "fenceV",
    x,
    y,
    w: 28,
    h: height,
    sortY: y + height,
    solid: {
      x: x + 10,
      y: y + 6,
      w: 8,
      h: height - 12,
    },
  };
}

function cottage(x, y) {
  return {
    type: "cottage",
    x,
    y,
    w: 256,
    h: 192,
    sortY: y + 176,
    solid: {
      x: x + 28,
      y: y + 94,
      w: 200,
      h: 70,
    },
  };
}

function well(x, y) {
  return {
    type: "well",
    x,
    y,
    w: 88,
    h: 90,
    sortY: y + 78,
    solid: {
      x: x + 14,
      y: y + 30,
      w: 60,
      h: 42,
    },
  };
}

function signpost(x, y) {
  return {
    type: "signpost",
    x,
    y,
    w: 34,
    h: 42,
    sortY: y + 42,
    solid: {
      x: x + 10,
      y: y + 16,
      w: 12,
      h: 18,
    },
  };
}

function cart(x, y) {
  return {
    type: "cart",
    x,
    y,
    w: 84,
    h: 54,
    sortY: y + 50,
    solid: {
      x: x + 10,
      y: y + 18,
      w: 64,
      h: 24,
    },
  };
}

function lantern(x, y) {
  return {
    type: "lantern",
    x,
    y,
    w: 24,
    h: 50,
    sortY: y + 48,
    solid: {
      x: x + 8,
      y: y + 18,
      w: 8,
      h: 18,
    },
  };
}

function shrine(x, y) {
  return {
    type: "shrine",
    x,
    y,
    w: 128,
    h: 112,
    sortY: y + 102,
    solid: {
      x: x + 22,
      y: y + 46,
      w: 84,
      h: 44,
    },
  };
}

function makeExit(id, x, y, w, h, direction, connection) {
  return {
    id,
    x,
    y,
    w,
    h,
    direction,
    label: connection?.label || "Path",
    toSceneId: connection?.toSceneId || "",
    targetEntryId: connection?.targetEntryId || "default",
  };
}

function createBaseArena(context, tiles, props) {
  return {
    sceneId: context.id,
    width: WIDTH,
    height: HEIGHT,
    boundsPadding: BOUNDS_PADDING,
    tileSize: TILE_SIZE,
    cols: COLS,
    rows: ROWS,
    tiles,
    playerSpawn: props.playerSpawn,
    entrySpawns: props.entrySpawns,
    spawnPoints: props.spawnPoints,
    bossZone: props.bossZone,
    bossAddSpawns: props.bossAddSpawns,
    exits: props.exits,
    obstacles: props.obstacles,
    theme: BIOMES[context.biomeId || "forest"].colors,
    biomeId: context.biomeId || "forest",
    sceneStyle: context.sceneStyle || "villageClearing",
  };
}

function buildVillageClearing(context, rng) {
  const tiles = createTiles(rng);
  stampRect(tiles, 9, 8, 18, 10, "soil", 0);
  stampRect(tiles, 10, 9, 16, 8, "path", 1);
  stampEllipse(tiles, 46, 30, 14, 11, "path", 0);
  stampEllipse(tiles, 46, 30, 9, 7, "soil", 1);
  paintPath(tiles, 20, 19, 34, 25, 2, 1);
  paintPath(tiles, 34, 25, 46, 30, 2, 0);
  paintPath(tiles, 46, 30, 64, 27, 2, 0);
  paintPath(tiles, 46, 30, 41, 40, 2, 1);
  paintPath(tiles, 64, 27, 94, 29, 2, 1);
  paintPath(tiles, 46, 18, 48, 5, 2, 1);
  clearOverlayRect(tiles, 58, 22, 26, 16);

  scatterFlowers(tiles, rng, 11, 9, 14, 8, 32, "flowersWarm");
  scatterFlowers(tiles, rng, 31, 16, 12, 6, 18, "flowersCool");
  scatterFlowers(tiles, rng, 64, 16, 12, 9, 22, "flowersWarm");
  scatterFlowers(tiles, rng, 67, 39, 10, 8, 16, "flowersCool");
  scatterFlowers(tiles, rng, 16, 40, 10, 8, 14, "flowersWarm");

  const obstacles = [
    cottage(144, 96),
    fenceH(144, 290, 72),
    fenceH(252, 290, 56),
    fenceH(356, 290, 48),
    fenceV(144, 242, 96),
    fenceV(380, 238, 100),
    well(716, 340),
    signpost(600, 394),
    cart(964, 518),
    lantern(520, 292),
    lantern(866, 286),
    tree(472, 164, 108, 0),
    tree(1128, 118, 124, 1),
    tree(1278, 630, 116, 0),
    tree(368, 696, 120, 1),
    tree(952, 730, 110, 0),
    tree(1308, 318, 104, 1),
    rock(870, 252, 72, 46, 0),
    rock(520, 524, 74, 44, 1),
    rock(1094, 476, 68, 42, 0),
    rock(934, 648, 70, 44, 1),
  ];

  return createBaseArena(context, tiles, {
    playerSpawn: { x: 632, y: 644 },
    entrySpawns: {
      default: { x: 632, y: 644 },
      eastRoad: { x: 1450, y: 466 },
      northTrail: { x: 782, y: 106 },
    },
    spawnPoints: [
      { x: 112, y: 196 },
      { x: 840, y: 112 },
      { x: 1456, y: 238 },
      { x: 1500, y: 470 },
      { x: 1370, y: 820 },
      { x: 948, y: 864 },
      { x: 250, y: 834 },
      { x: 84, y: 538 },
    ],
    bossZone: { x: 920, y: 420, radius: 192 },
    bossAddSpawns: [
      { x: 780, y: 420 },
      { x: 920, y: 252 },
      { x: 1080, y: 420 },
      { x: 920, y: 592 },
    ],
    exits: [
      makeExit("eastRoad", 1480, 400, 72, 144, "right", context.connections.eastRoad),
      makeExit("northTrail", 688, 24, 160, 64, "up", context.connections.northTrail),
    ],
    obstacles,
  });
}

function buildForestPass(context, rng) {
  const tiles = createTiles(rng);
  stampEllipse(tiles, 20, 31, 13, 8, "path", 0);
  stampEllipse(tiles, 46, 28, 10, 8, "path", 1);
  stampEllipse(tiles, 74, 31, 13, 8, "path", 0);
  paintPath(tiles, 6, 31, 94, 31, 2, 1);
  paintPath(tiles, 31, 29, 46, 28, 3, 0);
  paintPath(tiles, 46, 28, 74, 31, 3, 1);
  stampEllipse(tiles, 52, 22, 8, 5, "soil", 0);
  clearOverlayRect(tiles, 0, 24, 100, 14);
  scatterFlowers(tiles, rng, 10, 10, 20, 10, 14, "flowersCool");
  scatterFlowers(tiles, rng, 60, 42, 14, 10, 12, "flowersWarm");

  const obstacles = [
    tree(110, 112, 118, 0),
    tree(282, 690, 114, 1),
    tree(524, 116, 120, 0),
    tree(718, 664, 122, 1),
    tree(1036, 120, 118, 0),
    tree(1326, 654, 112, 1),
    tree(1416, 166, 106, 0),
    tree(142, 670, 108, 1),
    rock(440, 384, 72, 42, 0),
    rock(868, 414, 70, 42, 1),
    rock(1180, 362, 76, 44, 0),
    cart(640, 324),
    lantern(614, 288),
    lantern(714, 296),
    signpost(282, 432),
  ];

  return createBaseArena(context, tiles, {
    playerSpawn: { x: 130, y: 496 },
    entrySpawns: {
      default: { x: 130, y: 496 },
      westGate: { x: 132, y: 492 },
      eastGate: { x: 1450, y: 492 },
    },
    spawnPoints: [
      { x: 106, y: 182 },
      { x: 300, y: 838 },
      { x: 634, y: 160 },
      { x: 960, y: 812 },
      { x: 1276, y: 174 },
      { x: 1490, y: 310 },
    ],
    bossZone: { x: 1240, y: 480, radius: 178 },
    bossAddSpawns: [
      { x: 1140, y: 330 },
      { x: 1330, y: 330 },
      { x: 1140, y: 620 },
      { x: 1330, y: 620 },
    ],
    exits: [
      makeExit("westGate", 24, 410, 72, 156, "left", context.connections.westGate),
      makeExit("eastGate", 1504, 410, 56, 156, "right", context.connections.eastGate),
    ],
    obstacles,
  });
}

function buildShrineGrove(context, rng) {
  const tiles = createTiles(rng);
  stampEllipse(tiles, 50, 34, 12, 10, "path", 0);
  stampEllipse(tiles, 50, 34, 7, 6, "soil", 1);
  paintPath(tiles, 50, 58, 50, 34, 2, 1);
  paintPath(tiles, 50, 34, 92, 28, 2, 1);
  stampRect(tiles, 43, 22, 14, 5, "path", 1);
  clearOverlayRect(tiles, 40, 20, 20, 16);
  scatterFlowers(tiles, rng, 30, 14, 12, 10, 14, "flowersWarm");
  scatterFlowers(tiles, rng, 62, 16, 12, 10, 12, "flowersCool");
  scatterFlowers(tiles, rng, 24, 42, 12, 10, 10, "flowersCool");

  const obstacles = [
    shrine(736, 280),
    lantern(716, 402),
    lantern(860, 402),
    tree(150, 146, 120, 0),
    tree(1224, 148, 124, 1),
    tree(184, 654, 116, 0),
    tree(1184, 684, 118, 1),
    tree(456, 192, 106, 0),
    tree(1002, 224, 108, 1),
    rock(520, 538, 76, 44, 0),
    rock(1008, 520, 74, 42, 1),
    rock(660, 716, 70, 42, 0),
    signpost(602, 706),
  ];

  return createBaseArena(context, tiles, {
    playerSpawn: { x: 804, y: 846 },
    entrySpawns: {
      default: { x: 804, y: 846 },
      southGate: { x: 804, y: 846 },
      eastGate: { x: 1462, y: 472 },
    },
    spawnPoints: [
      { x: 128, y: 170 },
      { x: 1460, y: 204 },
      { x: 1324, y: 762 },
      { x: 274, y: 760 },
      { x: 788, y: 110 },
    ],
    bossZone: { x: 812, y: 466, radius: 180 },
    bossAddSpawns: [
      { x: 676, y: 466 },
      { x: 812, y: 312 },
      { x: 950, y: 466 },
      { x: 812, y: 620 },
    ],
    exits: [
      makeExit("southGate", 704, 884, 192, 52, "down", context.connections.southGate),
      makeExit("eastGate", 1498, 396, 56, 160, "right", context.connections.eastGate),
    ],
    obstacles,
  });
}

function buildBlightPass(context, rng) {
  const tiles = createTiles(rng);
  stampEllipse(tiles, 20, 28, 10, 8, "path", 0);
  stampEllipse(tiles, 48, 33, 12, 9, "soil", 1);
  stampEllipse(tiles, 78, 20, 11, 8, "path", 0);
  paintPath(tiles, 6, 28, 46, 32, 2, 1);
  paintPath(tiles, 46, 32, 50, 56, 2, 1);
  paintPath(tiles, 46, 32, 78, 20, 2, 0);
  clearOverlayRect(tiles, 0, 14, 100, 20);
  clearOverlayRect(tiles, 36, 32, 24, 26);
  scatterFlowers(tiles, rng, 60, 40, 12, 8, 10, "flowersWarm");

  const obstacles = [
    shrine(666, 438),
    lantern(640, 516),
    lantern(804, 516),
    tree(194, 166, 114, 0),
    tree(448, 134, 112, 1),
    tree(1226, 204, 112, 0),
    tree(1228, 664, 110, 1),
    tree(202, 654, 116, 1),
    rock(380, 408, 76, 44, 0),
    rock(1024, 362, 76, 44, 1),
    rock(920, 744, 74, 44, 0),
    rock(560, 720, 74, 44, 1),
    signpost(884, 250),
  ];

  return createBaseArena(context, tiles, {
    playerSpawn: { x: 130, y: 462 },
    entrySpawns: {
      default: { x: 130, y: 462 },
      westGate: { x: 130, y: 462 },
      southGate: { x: 814, y: 846 },
      northGate: { x: 1248, y: 106 },
    },
    spawnPoints: [
      { x: 132, y: 166 },
      { x: 1460, y: 194 },
      { x: 1414, y: 760 },
      { x: 274, y: 776 },
      { x: 812, y: 110 },
    ],
    bossZone: { x: 802, y: 490, radius: 184 },
    bossAddSpawns: [
      { x: 650, y: 490 },
      { x: 802, y: 330 },
      { x: 960, y: 490 },
      { x: 802, y: 644 },
    ],
    exits: [
      makeExit("westGate", 24, 378, 72, 156, "left", context.connections.westGate),
      makeExit("southGate", 722, 884, 188, 52, "down", context.connections.southGate),
      makeExit("northGate", 1172, 24, 176, 64, "up", context.connections.northGate),
    ],
    obstacles,
  });
}

function buildHeartLair(context, rng) {
  const tiles = createTiles(rng);
  stampEllipse(tiles, 50, 30, 20, 14, "soil", 1);
  stampEllipse(tiles, 50, 30, 15, 10, "path", 0);
  stampEllipse(tiles, 50, 30, 10, 7, "soil", 0);
  paintPath(tiles, 50, 58, 50, 40, 2, 1);
  clearOverlayRect(tiles, 26, 12, 48, 40);

  const obstacles = [
    shrine(730, 214),
    lantern(632, 528),
    lantern(950, 528),
    rock(486, 314, 84, 48, 0),
    rock(1070, 314, 84, 48, 1),
    rock(488, 642, 84, 48, 0),
    rock(1070, 642, 84, 48, 1),
    tree(190, 150, 118, 0),
    tree(1300, 150, 118, 1),
    tree(182, 662, 118, 1),
    tree(1300, 662, 118, 0),
  ];

  return createBaseArena(context, tiles, {
    playerSpawn: { x: 806, y: 838 },
    entrySpawns: {
      default: { x: 806, y: 838 },
      southGate: { x: 806, y: 838 },
    },
    spawnPoints: [
      { x: 132, y: 228 },
      { x: 1464, y: 226 },
      { x: 1418, y: 754 },
      { x: 246, y: 754 },
    ],
    bossZone: { x: 810, y: 468, radius: 210 },
    bossAddSpawns: [
      { x: 640, y: 468 },
      { x: 810, y: 290 },
      { x: 980, y: 468 },
      { x: 810, y: 642 },
    ],
    exits: [
      makeExit("southGate", 706, 884, 196, 52, "down", context.connections.southGate),
    ],
    obstacles,
  });
}

export function createArena(context = {}) {
  const rng = createRng(context.seed || context.id || "arena");

  if (context.sceneStyle === "forestPass") {
    return buildForestPass(context, rng);
  }

  if (context.sceneStyle === "shrineGrove") {
    return buildShrineGrove(context, rng);
  }

  if (context.sceneStyle === "blightPass") {
    return buildBlightPass(context, rng);
  }

  if (context.sceneStyle === "heartLair") {
    return buildHeartLair(context, rng);
  }

  return buildVillageClearing(context, rng);
}

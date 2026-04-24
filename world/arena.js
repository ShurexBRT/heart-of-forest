import { BIOMES } from "../data/gameData.js";
import { createRng, randomIntFrom } from "../systems/rng.js";

const TILE_SIZE = 16;
const COLS = 100;
const ROWS = 60;

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

export function createArena(context = {}) {
  const biomeId = context.biomeId || "forest";
  const theme = BIOMES[biomeId].colors;
  const rng = createRng(context.seed || `arena-${biomeId}`);
  const width = COLS * TILE_SIZE;
  const height = ROWS * TILE_SIZE;
  const boundsPadding = 32;
  const tiles = createTiles(rng);

  stampRect(tiles, 9, 8, 18, 10, "soil", 0);
  stampRect(tiles, 10, 9, 16, 8, "path", 1);
  stampEllipse(tiles, 46, 30, 14, 11, "path", 0);
  stampEllipse(tiles, 46, 30, 9, 7, "soil", 1);
  paintPath(tiles, 20, 19, 34, 25, 2, 1);
  paintPath(tiles, 34, 25, 46, 30, 2, 0);
  paintPath(tiles, 46, 30, 64, 27, 2, 0);
  paintPath(tiles, 46, 30, 41, 40, 2, 1);

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

  return {
    width,
    height,
    boundsPadding,
    tileSize: TILE_SIZE,
    cols: COLS,
    rows: ROWS,
    tiles,
    playerSpawn: { x: 632, y: 644 },
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
    bossZone: {
      x: 920,
      y: 420,
      radius: 192,
    },
    bossAddSpawns: [
      { x: 780, y: 420 },
      { x: 920, y: 252 },
      { x: 1080, y: 420 },
      { x: 920, y: 592 },
    ],
    obstacles,
    theme,
    biomeId,
    sceneStyle: context.sceneStyle || "villageClearing",
  };
}

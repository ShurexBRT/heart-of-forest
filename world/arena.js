import { BIOMES } from "../data/gameData.js";
import { NPC_DEFS } from "../data/storyData.js";
import { createRng, randomIntFrom } from "../systems/rng.js";

const TILE_SIZE = 16;
const COLS = 100;
const ROWS = 60;
const WIDTH = COLS * TILE_SIZE;
const HEIGHT = ROWS * TILE_SIZE;
const BOUNDS_PADDING = 28;

function createTile(rng) {
  return {
    ground: "grass",
    variant: randomIntFrom(rng, 0, 2),
    overlay: rng() > 0.94 ? "clover" : null,
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

function paintPath(tiles, x0, y0, x1, y1, radius, ground = "path", variant = 0) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));

  for (let i = 0; i <= steps; i += 1) {
    const t = steps === 0 ? 0 : i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    stampEllipse(tiles, x, y, radius, radius * 0.8, ground, variant);
  }
}

function scatterOverlay(tiles, rng, x, y, w, h, count, overlay) {
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

function createObstacle(type, x, y, w, h, solid, extra = {}) {
  const anchorX = extra.anchorX ?? solid.x + solid.w / 2;
  const anchorY = extra.anchorY ?? solid.y + solid.h;

  return {
    type,
    x,
    y,
    w,
    h,
    solid,
    anchorX,
    anchorY,
    sortY: extra.sortY ?? anchorY,
    ...extra,
  };
}

function tree(x, y, size, style = "forest") {
  return createObstacle(
    style === "charredTree" ? "charredTree" : "tree",
    x,
    y,
    size,
    size + 58,
    {
      x: x + size * 0.32,
      y: y + size * 0.76,
      w: size * 0.36,
      h: size * 0.24,
    },
    { style }
  );
}

function rock(x, y, w, h, style = "stone") {
  return createObstacle(
    style === "iceRock" ? "iceRock" : "rock",
    x,
    y,
    w,
    h,
    {
      x: x + 6,
      y: y + 8,
      w: w - 12,
      h: h - 12,
    },
    { style }
  );
}

function bush(x, y, w, h, style = "forest") {
  return createObstacle(
    "bush",
    x,
    y,
    w,
    h,
    {
      x: x + 4,
      y: y + 10,
      w: w - 8,
      h: h - 14,
    },
    { style }
  );
}

function water(x, y, w, h, style = "water") {
  return createObstacle(
    "water",
    x,
    y,
    w,
    h,
    {
      x: x,
      y: y,
      w,
      h,
    },
    { style, anchorY: y + h }
  );
}

function ruin(x, y, w, h, style = "ruin") {
  return createObstacle(
    "ruin",
    x,
    y,
    w,
    h,
    {
      x: x + 10,
      y: y + 18,
      w: w - 20,
      h: h - 24,
    },
    { style }
  );
}

function cottage(x, y) {
  return createObstacle(
    "cottage",
    x,
    y,
    250,
    200,
    {
      x: x + 30,
      y: y + 110,
      w: 188,
      h: 58,
    },
    { anchorX: x + 124, anchorY: y + 170 }
  );
}

function well(x, y) {
  return createObstacle(
    "well",
    x,
    y,
    82,
    86,
    {
      x: x + 12,
      y: y + 26,
      w: 56,
      h: 38,
    },
    { anchorX: x + 41, anchorY: y + 64 }
  );
}

function fenceH(x, y, width) {
  return createObstacle(
    "fenceH",
    x,
    y,
    width,
    22,
    {
      x: x + 2,
      y: y + 8,
      w: width - 4,
      h: 8,
    },
    { anchorX: x + width / 2, anchorY: y + 14 }
  );
}

function fenceV(x, y, height) {
  return createObstacle(
    "fenceV",
    x,
    y,
    22,
    height,
    {
      x: x + 8,
      y: y + 2,
      w: 8,
      h: height - 4,
    },
    { anchorX: x + 11, anchorY: y + height }
  );
}

function signpost(x, y) {
  return createObstacle(
    "signpost",
    x,
    y,
    32,
    42,
    {
      x: x + 9,
      y: y + 16,
      w: 10,
      h: 16,
    },
    { anchorX: x + 16, anchorY: y + 34 }
  );
}

function lantern(x, y, style = "warm") {
  return createObstacle(
    "lantern",
    x,
    y,
    24,
    50,
    {
      x: x + 9,
      y: y + 16,
      w: 6,
      h: 22,
    },
    { style, anchorX: x + 12, anchorY: y + 40 }
  );
}

function bridge(x, y, w, h) {
  return createObstacle(
    "bridge",
    x,
    y,
    w,
    h,
    {
      x,
      y,
      w,
      h,
    },
    { anchorX: x + w / 2, anchorY: y + h }
  );
}

function npc(id, x, y) {
  const def = NPC_DEFS[id];
  return {
    id,
    name: def.name,
    role: def.role,
    type: "npc",
    x,
    y,
    w: 22,
    h: 44,
    interactionRadius: 58,
    solid: {
      x: x - 8,
      y: y + 8,
      w: 16,
      h: 12,
    },
    anchorX: x,
    anchorY: y + 18,
    sortY: y + 18,
    palette: def.palette,
  };
}

function interactable(id, type, x, y, extra = {}) {
  return {
    id,
    type,
    x,
    y,
    w: extra.w || 18,
    h: extra.h || 18,
    promptLabel: extra.promptLabel || extra.name || "Interact",
    interactionRadius: extra.interactionRadius || 54,
    requiresCleared: Boolean(extra.requiresCleared),
    collectKey: extra.collectKey || null,
    dialogueLines: extra.dialogueLines || null,
    toastText: extra.toastText || null,
    disabled: false,
    name: extra.name || type,
    sortY: extra.sortY ?? y + 10,
    anchorX: extra.anchorX ?? x,
    anchorY: extra.anchorY ?? y + 10,
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
    npcs: props.npcs || [],
    interactables: props.interactables || [],
    hazards: props.hazards || [],
    theme: BIOMES[context.biomeId || "forest"].colors,
    biomeId: context.biomeId || "forest",
    sceneStyle: context.sceneStyle,
  };
}

function buildWhisperingWoods(context, rng) {
  const tiles = createTiles(rng);
  stampRect(tiles, 8, 8, 18, 10, "soil", 0);
  stampEllipse(tiles, 48, 31, 16, 12, "path", 0);
  stampEllipse(tiles, 48, 31, 9, 7, "soil", 1);
  paintPath(tiles, 20, 18, 48, 31, 3, "path", 1);
  paintPath(tiles, 48, 31, 90, 28, 3, "path", 1);
  paintPath(tiles, 48, 31, 53, 7, 3, "path", 0);
  scatterOverlay(tiles, rng, 10, 8, 18, 10, 24, "flowersWarm");
  scatterOverlay(tiles, rng, 65, 16, 14, 10, 18, "flowersCool");

  const npcs = [
    npc("elder_rowan", 366, 556),
    npc("lysa", 468, 610),
    npc("nettle", 536, 532),
  ];

  const interactables = [
    interactable("spirit-flower-1", "flower", 854, 334, {
      name: "Spirit Flower",
      promptLabel: "Spirit Flower",
      collectKey: "spiritFlowers",
      toastText: "Spirit Flower gathered",
      sortY: 344,
    }),
    interactable("spirit-flower-2", "flower", 1026, 464, {
      name: "Spirit Flower",
      promptLabel: "Spirit Flower",
      collectKey: "spiritFlowers",
      toastText: "Spirit Flower gathered",
      sortY: 474,
    }),
    interactable("spirit-flower-3", "flower", 894, 704, {
      name: "Spirit Flower",
      promptLabel: "Spirit Flower",
      collectKey: "spiritFlowers",
      toastText: "Spirit Flower gathered",
      sortY: 714,
    }),
  ];

  return createBaseArena(context, tiles, {
    playerSpawn: { x: 392, y: 716 },
    entrySpawns: {
      default: { x: 392, y: 716 },
      eastRoad: { x: 1438, y: 452 },
      northTrail: { x: 850, y: 124 },
    },
    spawnPoints: [
      { x: 1060, y: 174 },
      { x: 1470, y: 278 },
      { x: 1490, y: 516 },
      { x: 1210, y: 792 },
      { x: 836, y: 844 },
    ],
    bossZone: { x: 1080, y: 456, radius: 188 },
    bossAddSpawns: [
      { x: 918, y: 458 },
      { x: 1080, y: 290 },
      { x: 1238, y: 458 },
      { x: 1080, y: 620 },
    ],
    exits: [
      makeExit("eastRoad", 1480, 364, 72, 164, "right", context.connections.eastRoad),
      makeExit("northTrail", 752, 24, 196, 64, "up", context.connections.northTrail),
    ],
    obstacles: [
      cottage(140, 110),
      well(584, 350),
      fenceH(138, 306, 278),
      fenceV(138, 250, 98),
      fenceV(394, 248, 100),
      signpost(694, 376),
      lantern(486, 320),
      lantern(664, 278),
      bush(232, 676, 88, 54),
      bush(636, 726, 92, 56),
      tree(804, 168, 108, "forest"),
      tree(1086, 176, 120, "forest"),
      tree(1324, 284, 118, "forest"),
      tree(1250, 682, 114, "forest"),
      tree(824, 792, 114, "forest"),
      tree(428, 820, 110, "forest"),
      tree(100, 618, 116, "forest"),
      rock(906, 312, 74, 44),
      rock(1154, 500, 82, 46),
      rock(986, 702, 72, 42),
      rock(716, 612, 66, 42),
    ],
    npcs,
    interactables,
    hazards: [],
  });
}

function buildMossrootMarsh(context, rng) {
  const tiles = createTiles(rng);
  stampRect(tiles, 0, 0, COLS, ROWS, "grass", 0);
  stampEllipse(tiles, 24, 25, 14, 9, "water", 0);
  stampEllipse(tiles, 52, 34, 12, 9, "water", 1);
  stampEllipse(tiles, 78, 20, 11, 8, "water", 0);
  paintPath(tiles, 8, 31, 92, 30, 2, "planks", 0);
  paintPath(tiles, 44, 30, 50, 52, 2, "planks", 1);
  clearOverlayRect(tiles, 0, 22, 100, 14);
  scatterOverlay(tiles, rng, 10, 8, 18, 10, 20, "reeds");
  scatterOverlay(tiles, rng, 60, 40, 16, 8, 18, "reeds");

  const interactables = [
    interactable("marsh-root-1", "corruptedRoot", 852, 260, {
      name: "Corrupted Root",
      promptLabel: "Cleanse Root",
      collectKey: "rootsCleansed",
      toastText: "Corrupted root cleansed",
      requiresCleared: true,
      sortY: 276,
    }),
    interactable("marsh-root-2", "corruptedRoot", 1064, 640, {
      name: "Corrupted Root",
      promptLabel: "Cleanse Root",
      collectKey: "rootsCleansed",
      toastText: "Corrupted root cleansed",
      requiresCleared: true,
      sortY: 654,
    }),
  ];

  return createBaseArena(context, tiles, {
    playerSpawn: { x: 128, y: 492 },
    entrySpawns: {
      default: { x: 128, y: 492 },
      westGate: { x: 128, y: 492 },
      northGate: { x: 814, y: 108 },
    },
    spawnPoints: [
      { x: 306, y: 184 },
      { x: 646, y: 178 },
      { x: 1348, y: 222 },
      { x: 1398, y: 594 },
      { x: 978, y: 812 },
    ],
    bossZone: { x: 980, y: 474, radius: 182 },
    bossAddSpawns: [
      { x: 812, y: 472 },
      { x: 980, y: 316 },
      { x: 1148, y: 472 },
      { x: 980, y: 622 },
    ],
    exits: [
      makeExit("westGate", 24, 394, 72, 160, "left", context.connections.westGate),
      makeExit("northGate", 708, 24, 196, 64, "up", context.connections.northGate),
    ],
    obstacles: [
      water(176, 226, 284, 170, "marsh"),
      water(712, 468, 286, 186, "marsh"),
      water(1124, 150, 226, 154, "marsh"),
      bridge(236, 450, 224, 44),
      bridge(794, 356, 46, 232),
      tree(182, 150, 110, "swamp"),
      tree(422, 118, 108, "swamp"),
      tree(1222, 364, 112, "swamp"),
      tree(1324, 698, 110, "swamp"),
      bush(546, 162, 96, 58, "marsh"),
      bush(1186, 556, 88, 54, "marsh"),
      rock(598, 410, 78, 44),
      rock(928, 222, 72, 42),
      lantern(508, 430, "cool"),
      lantern(820, 322, "cool"),
      signpost(448, 402),
    ],
    npcs: [],
    interactables,
    hazards: [],
  });
}

function buildEmberpineGrove(context, rng) {
  const tiles = createTiles(rng);
  stampRect(tiles, 0, 0, COLS, ROWS, "emberGrass", 0);
  stampEllipse(tiles, 50, 30, 14, 10, "ash", 0);
  paintPath(tiles, 50, 56, 50, 30, 2, "ashPath", 0);
  paintPath(tiles, 50, 30, 92, 30, 2, "ashPath", 1);
  stampEllipse(tiles, 24, 24, 8, 5, "ember", 0);
  stampEllipse(tiles, 68, 18, 8, 5, "ember", 1);
  stampEllipse(tiles, 72, 44, 7, 5, "ember", 0);
  clearOverlayRect(tiles, 40, 18, 26, 24);

  const interactables = [
    interactable("totem-1", "totem", 650, 408, {
      name: "Warding Totem",
      promptLabel: "Rekindle Totem",
      collectKey: "totemsActivated",
      toastText: "Totem rekindled",
      requiresCleared: true,
      sortY: 420,
    }),
    interactable("totem-2", "totem", 966, 314, {
      name: "Warding Totem",
      promptLabel: "Rekindle Totem",
      collectKey: "totemsActivated",
      toastText: "Totem rekindled",
      requiresCleared: true,
      sortY: 326,
    }),
    interactable("totem-3", "totem", 1102, 640, {
      name: "Warding Totem",
      promptLabel: "Rekindle Totem",
      collectKey: "totemsActivated",
      toastText: "Totem rekindled",
      requiresCleared: true,
      sortY: 652,
    }),
  ];

  return createBaseArena(context, tiles, {
    playerSpawn: { x: 808, y: 840 },
    entrySpawns: {
      default: { x: 808, y: 840 },
      southGate: { x: 808, y: 840 },
      eastGate: { x: 1454, y: 470 },
    },
    spawnPoints: [
      { x: 186, y: 166 },
      { x: 566, y: 130 },
      { x: 1366, y: 184 },
      { x: 1314, y: 744 },
      { x: 322, y: 760 },
    ],
    bossZone: { x: 922, y: 470, radius: 184 },
    bossAddSpawns: [
      { x: 760, y: 470 },
      { x: 922, y: 312 },
      { x: 1082, y: 470 },
      { x: 922, y: 628 },
    ],
    exits: [
      makeExit("southGate", 710, 884, 198, 52, "down", context.connections.southGate),
      makeExit("eastGate", 1498, 396, 56, 160, "right", context.connections.eastGate),
    ],
    obstacles: [
      ruin(754, 242, 180, 108, "altar"),
      ruin(498, 606, 110, 82, "shard"),
      ruin(1182, 524, 118, 90, "shard"),
      tree(144, 146, 118, "charredTree"),
      tree(1194, 152, 122, "charredTree"),
      tree(248, 690, 114, "charredTree"),
      tree(1264, 686, 114, "charredTree"),
      bush(420, 272, 84, 48, "ember"),
      bush(1080, 252, 84, 48, "ember"),
      rock(582, 500, 76, 44),
      rock(986, 716, 76, 44),
      lantern(720, 386, "ember"),
      lantern(990, 272, "ember"),
      signpost(640, 720),
    ],
    npcs: [],
    interactables,
    hazards: [
      { id: "ember-pool-1", x: 302, y: 220, w: 120, h: 82, damage: 8, interval: 0.72, type: "ember" },
      { id: "ember-pool-2", x: 1032, y: 598, w: 116, h: 80, damage: 8, interval: 0.72, type: "ember" },
    ],
  });
}

function buildFrostveilTundra(context, rng) {
  const tiles = createTiles(rng);
  stampRect(tiles, 0, 0, COLS, ROWS, "snow", 0);
  stampEllipse(tiles, 36, 28, 12, 8, "ice", 0);
  stampEllipse(tiles, 66, 20, 10, 7, "ice", 1);
  paintPath(tiles, 8, 30, 42, 30, 2, "snowPath", 0);
  paintPath(tiles, 42, 30, 72, 18, 2, "snowPath", 1);
  paintPath(tiles, 42, 30, 52, 54, 2, "snowPath", 0);
  clearOverlayRect(tiles, 8, 24, 80, 12);
  scatterOverlay(tiles, rng, 18, 10, 20, 10, 16, "frostFlowers");
  scatterOverlay(tiles, rng, 60, 38, 14, 12, 12, "frostFlowers");

  const interactables = [
    interactable("lost-scout", "scout", 994, 248, {
      name: "Lost Scout",
      promptLabel: "Inspect Camp",
      collectKey: "scoutFound",
      toastText: "Scout signal recovered",
      sortY: 262,
      dialogueLines: [
        "A frozen satchel rests beside the collapsed tent.",
        "The scout's message points north. Whatever rules the ruins is awake.",
      ],
    }),
  ];

  return createBaseArena(context, tiles, {
    playerSpawn: { x: 132, y: 458 },
    entrySpawns: {
      default: { x: 132, y: 458 },
      westGate: { x: 132, y: 458 },
      southGate: { x: 804, y: 846 },
      northGate: { x: 1188, y: 108 },
    },
    spawnPoints: [
      { x: 154, y: 184 },
      { x: 608, y: 132 },
      { x: 1340, y: 196 },
      { x: 1382, y: 740 },
      { x: 364, y: 782 },
    ],
    bossZone: { x: 936, y: 462, radius: 180 },
    bossAddSpawns: [
      { x: 780, y: 462 },
      { x: 936, y: 308 },
      { x: 1088, y: 462 },
      { x: 936, y: 616 },
    ],
    exits: [
      makeExit("westGate", 24, 382, 72, 156, "left", context.connections.westGate),
      makeExit("southGate", 706, 884, 196, 52, "down", context.connections.southGate),
      makeExit("northGate", 1106, 24, 176, 64, "up", context.connections.northGate),
    ],
    obstacles: [
      water(306, 264, 248, 156, "ice"),
      water(910, 132, 222, 142, "ice"),
      ruin(940, 214, 122, 84, "camp"),
      ruin(662, 602, 142, 94, "camp"),
      tree(166, 166, 112, "frost"),
      tree(458, 156, 108, "frost"),
      tree(1290, 178, 116, "frost"),
      tree(1322, 650, 112, "frost"),
      rock(806, 470, 74, 42, "iceRock"),
      rock(1144, 556, 80, 46, "iceRock"),
      bush(522, 748, 86, 52, "frost"),
      lantern(982, 286, "frost"),
      signpost(848, 258),
    ],
    npcs: [],
    interactables,
    hazards: [],
  });
}

function buildHollowheartRuins(context, rng) {
  const tiles = createTiles(rng);
  stampRect(tiles, 0, 0, COLS, ROWS, "blight", 0);
  stampEllipse(tiles, 52, 30, 18, 13, "ruinStone", 0);
  stampEllipse(tiles, 52, 30, 12, 8, "ash", 1);
  paintPath(tiles, 50, 57, 52, 38, 2, "ruinStone", 1);
  clearOverlayRect(tiles, 28, 12, 48, 38);

  return createBaseArena(context, tiles, {
    playerSpawn: { x: 806, y: 838 },
    entrySpawns: {
      default: { x: 806, y: 838 },
      southGate: { x: 806, y: 838 },
    },
    spawnPoints: [
      { x: 180, y: 212 },
      { x: 468, y: 172 },
      { x: 1326, y: 228 },
      { x: 1360, y: 742 },
      { x: 288, y: 744 },
    ],
    bossZone: { x: 914, y: 452, radius: 212 },
    bossAddSpawns: [
      { x: 738, y: 452 },
      { x: 914, y: 274 },
      { x: 1090, y: 452 },
      { x: 914, y: 630 },
    ],
    exits: [
      makeExit("southGate", 706, 884, 196, 52, "down", context.connections.southGate),
    ],
    obstacles: [
      ruin(756, 198, 216, 128, "throne"),
      ruin(514, 310, 118, 86, "pillar"),
      ruin(1182, 308, 118, 86, "pillar"),
      ruin(530, 642, 124, 90, "pillar"),
      ruin(1164, 638, 124, 90, "pillar"),
      tree(176, 154, 118, "charredTree"),
      tree(1302, 156, 118, "charredTree"),
      tree(176, 674, 118, "charredTree"),
      tree(1302, 674, 118, "charredTree"),
      bush(680, 734, 92, 56, "blight"),
      bush(1046, 734, 92, 56, "blight"),
      rock(848, 580, 86, 48),
      lantern(748, 354, "ember"),
      lantern(1030, 354, "ember"),
    ],
    npcs: [],
    interactables: [],
    hazards: [
      { id: "blight-pool-1", x: 648, y: 560, w: 122, h: 88, damage: 10, interval: 0.68, type: "blight" },
      { id: "blight-pool-2", x: 1052, y: 560, w: 122, h: 88, damage: 10, interval: 0.68, type: "blight" },
    ],
  });
}

export function createArena(context = {}) {
  const rng = createRng(context.seed || context.id || "arena");

  if (context.sceneStyle === "mossrootMarsh") {
    return buildMossrootMarsh(context, rng);
  }

  if (context.sceneStyle === "emberpineGrove") {
    return buildEmberpineGrove(context, rng);
  }

  if (context.sceneStyle === "frostveilTundra") {
    return buildFrostveilTundra(context, rng);
  }

  if (context.sceneStyle === "hollowheartRuins") {
    return buildHollowheartRuins(context, rng);
  }

  return buildWhisperingWoods(context, rng);
}

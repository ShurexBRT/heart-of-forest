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
  const fallbackSolid =
    solid && solid !== false
      ? solid
      : {
          x,
          y,
          w,
          h,
        };
  const anchorX = extra.anchorX ?? fallbackSolid.x + fallbackSolid.w / 2;
  const anchorY = extra.anchorY ?? fallbackSolid.y + fallbackSolid.h;

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
    false,
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
    false,
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
    serviceId: extra.serviceId || null,
    action: extra.action || null,
    repeatable: Boolean(extra.repeatable),
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
    requiresFlag: connection?.requiresFlag || null,
    lockedText: connection?.lockedText || "",
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

function buildAylaHomestead(context, rng) {
  const flags = context.worldFlags || {};
  const tiles = createTiles(rng);
  const plotWidth = 9;
  const plotHeight = 7;
  const plotTiles = [
    { x: 40, y: 15 },
    { x: 52, y: 15 },
    { x: 64, y: 15 },
    { x: 40, y: 25 },
    { x: 52, y: 25 },
    { x: 64, y: 25 },
  ];

  stampRect(tiles, 8, 7, 22, 16, "soil", 1);
  paintPath(tiles, 24, 25, 38, 23, 3, "path", 0);
  paintPath(tiles, 38, 23, 96, 29, 3, "path", 1);
  paintPath(tiles, 33, 26, 33, 47, 2, "path", 0);
  for (const plot of plotTiles) {
    stampRect(tiles, plot.x, plot.y, plotWidth, plotHeight, "soil", 0);
    clearOverlayRect(tiles, plot.x, plot.y, plotWidth, plotHeight);
  }
  scatterOverlay(tiles, rng, 8, 28, 26, 19, 40, "flowersWarm");
  scatterOverlay(tiles, rng, 86, 8, 10, 14, 18, "flowersCool");
  if (flags.heartwood_restored) {
    stampEllipse(tiles, 48, 42, 8, 5, "path", 0);
    stampEllipse(tiles, 48, 42, 5, 3, "soil", 1);
    paintPath(tiles, 33, 47, 43, 43, 2, "path", 0);
  }
  if (flags.stillwater_restored) {
    stampEllipse(tiles, 55, 42, 5, 4, "path", 1);
  }
  if (flags.frost_restored) {
    stampEllipse(tiles, 62, 42, 5, 4, "path", 0);
  }

  const interactables = [
    interactable("hearthroot-shrine", "shrine", 742, 396, {
      name: "Hearthroot Shrine",
      promptLabel: flags.hearthroot_awake ? "Listen to the Hearthroot" : "Wake the Hearthroot",
      collectKey: flags.hearthroot_awake ? null : "hearthrootAwakened",
      toastText: flags.hearthroot_awake
        ? "The Hearthroot hums with a patient, familiar pulse."
        : "The old root answers Ayla and warmth returns to the homestead.",
      dialogueLines: flags.heartwood_restored
        ? [
            "One root remembers your hands. Five remain beyond the quiet roads.",
            "Prepare here, Ayla. Restoration begins at home, but it cannot end here.",
          ]
        : flags.hearthroot_awake
          ? [
              "The wound beyond the gate is tightening around an old guardian.",
              "Grow what heals, brew what protects, then listen before you strike.",
            ]
          : [
              "Ayla... the Heartroot is not dead. It is divided.",
              "Wake the garden. Follow the pain beneath the thorns. Bring the first root home.",
            ],
      repeatable: Boolean(flags.hearthroot_awake),
      interactionRadius: 78,
      w: 54,
      h: 54,
      sortY: 418,
    }),
    interactable("hearthroot-cauldron", "shrine", 812, 424, {
      name: "Hearthroot Cauldron",
      promptLabel: "Open Brewing",
      serviceId: "hearthroot_cauldron",
      repeatable: true,
      interactionRadius: 76,
      w: 46,
      h: 42,
      sortY: 442,
    }),
    interactable("ayla-bed", "bed", 430, 322, {
      name: "Ayla's Bed",
      promptLabel: "Sleep until morning",
      toastText: "Ayla settles in as the homestead grows quiet.",
      action: "sleep",
      repeatable: true,
      interactionRadius: 72,
      w: 44,
      h: 28,
      sortY: 334,
    }),
    ...plotTiles.map((plot, index) =>
      interactable(
        `garden-plot-${index + 1}`,
        "farmPlot",
        (plot.x + plotWidth / 2) * TILE_SIZE,
        (plot.y + plotHeight / 2) * TILE_SIZE,
        {
          name: `Garden Plot ${index + 1}`,
          promptLabel: "Inspect Garden Plot",
          action: "farm-plot",
          repeatable: true,
          interactionRadius: 96,
          w: plotWidth * TILE_SIZE,
          h: plotHeight * TILE_SIZE,
          sortY: 1,
        }
      )
    ),
    ...(flags.heartwood_restored
      ? [
          interactable("training-grove-dummy", "trainingDummy", 768, 672, {
            name: "Training Grove",
            promptLabel: "Begin 20s combat drill",
            action: "training-grove",
            repeatable: true,
            interactionRadius: 82,
            w: 42,
            h: 56,
            sortY: 692,
          }),
        ]
      : []),
    ...(flags.stillwater_restored
      ? [
          interactable("training-grove-cluster", "trainingCluster", 880, 672, {
            name: "Training Grove Target Circle",
            promptLabel: "Begin 20s group drill",
            action: "training-grove-group",
            repeatable: true,
            interactionRadius: 82,
            w: 52,
            h: 56,
            sortY: 692,
          }),
        ]
      : []),
    ...(flags.frost_restored
      ? [
          interactable("training-grove-elite", "trainingElite", 992, 672, {
            name: "Training Grove Veil Drill",
            promptLabel: "Begin elite telegraph drill",
            action: "training-grove-elite",
            repeatable: true,
            interactionRadius: 82,
            w: 52,
            h: 56,
            sortY: 692,
          }),
        ]
      : []),
  ];

  return createBaseArena(context, tiles, {
    playerSpawn: { x: 456, y: 410 },
    entrySpawns: {
      default: { x: 456, y: 410 },
      bedside: { x: 456, y: 382 },
      forestPath: { x: 1438, y: 466 },
    },
    spawnPoints: [],
    bossZone: { x: 1120, y: 480, radius: 160 },
    bossAddSpawns: [],
    exits: [
      makeExit("forestPath", 1480, 372, 72, 188, "right", context.connections.forestPath),
    ],
    obstacles: [
      cottage(160, 90),
      well(520, 300),
      fenceH(608, 202, 592),
      fenceH(608, 526, 592),
      fenceV(592, 202, 132),
      fenceV(592, 412, 134),
      fenceV(1184, 202, 132),
      fenceV(1184, 412, 134),
      signpost(1398, 430),
      lantern(492, 334),
      lantern(1370, 398),
      tree(78, 620, 118, "forest"),
      tree(238, 728, 112, "forest"),
      tree(500, 748, 116, "forest"),
      tree(1378, 104, 112, "forest"),
      tree(1450, 690, 116, "forest"),
      bush(82, 382, 92, 56),
      bush(388, 708, 84, 52),
      bush(1320, 768, 92, 56),
      rock(620, 144, 74, 44),
      rock(1430, 604, 70, 42),
    ],
    npcs: flags.heartwood_restored
      ? [npc("elder_rowan", 716, 470), npc("tamsin", 842, 486), npc("lysa", 924, 454)]
      : [],
    interactables,
    hazards: [],
  });
}

function buildWhisperingWoods(context, rng) {
  const flags = context.worldFlags || {};
  const tiles = createTiles(rng);
  stampRect(tiles, 8, 8, 18, 10, "soil", 0);
  stampRect(tiles, 8, 18, 12, 8, "path", 0);
  stampEllipse(tiles, 48, 31, 16, 12, "path", 0);
  stampEllipse(tiles, 48, 31, 9, 7, "soil", 1);
  paintPath(tiles, 20, 18, 48, 31, 3, "path", 1);
  paintPath(tiles, 48, 31, 90, 28, 3, "path", 1);
  paintPath(tiles, 48, 31, 53, 7, 3, "path", 0);
  paintPath(tiles, 20, 25, 18, 35, 2, "path", 0);
  paintPath(tiles, 18, 35, 4, 43, 2, "path", 0);
  scatterOverlay(tiles, rng, 10, 8, 18, 10, 24, "flowersWarm");
  scatterOverlay(tiles, rng, 65, 16, 14, 10, 18, "flowersCool");
  if (flags.heartwood_restored) {
    scatterOverlay(tiles, rng, 24, 16, 34, 24, 34, "flowersWarm");
    scatterOverlay(tiles, rng, 46, 28, 30, 18, 24, "flowersCool");
  }

  const npcs = flags.heartwood_restored
    ? [
        npc("elder_rowan", 366, 556),
        npc("lysa", 468, 610),
        npc("tamsin", 246, 560),
      ]
    : [];
  if (flags.village_patrols_returned) {
    npcs.push(npc("halen", 702, 430));
  }
  if (flags.apothecary_resupplied || flags.marsh_route_lit) {
    npcs.push(npc("mara", 582, 324));
  }

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
    interactable("moonleaf-bundle-1", "flower", 742, 448, {
      name: "Moonleaf Bundle",
      promptLabel: "Gather Moonleaf",
      collectKey: "moonleafBundles",
      toastText: "Moonleaf bundle gathered",
      sortY: 458,
    }),
    interactable("moonleaf-bundle-2", "flower", 612, 796, {
      name: "Moonleaf Bundle",
      promptLabel: "Gather Moonleaf",
      collectKey: "moonleafBundles",
      toastText: "Moonleaf bundle gathered",
      sortY: 806,
    }),
    interactable("waystone-seal-1", "seal", 1182, 382, {
      name: "Waystone Seal",
      promptLabel: "Recover Seal",
      collectKey: "waystoneSealsRecovered",
      toastText: "Waystone seal recovered",
      requiresCleared: true,
      sortY: 396,
    }),
    ...(flags.heartwood_restored
      ? [
          interactable("village-stash", "chest", 328, 304, {
            name: "Supply Stash",
            promptLabel: "Open Stash",
            serviceId: "village_stash",
            sortY: 316,
            w: 24,
            h: 20,
          }),
          interactable("waystone-altar", "shrine", 598, 282, {
            name: "Waystone Altar",
            promptLabel: "Commune at Altar",
            serviceId: "waystone_altar",
            sortY: 296,
            w: 28,
            h: 24,
          }),
        ]
      : []),
  ];

  return createBaseArena(context, tiles, {
    playerSpawn: { x: 392, y: 716 },
    entrySpawns: {
      default: { x: 392, y: 716 },
      homePath: { x: 126, y: 714 },
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
      makeExit("homePath", 24, 632, 72, 176, "left", context.connections.homePath),
      makeExit("eastRoad", 1480, 364, 72, 164, "right", context.connections.eastRoad),
      makeExit("northTrail", 752, 24, 196, 64, "up", context.connections.northTrail),
    ],
    obstacles: [
      cottage(140, 110),
      cottage(452, 112),
      well(584, 350),
      fenceH(138, 306, 278),
      fenceH(138, 424, 186),
      fenceV(138, 250, 98),
      fenceV(394, 248, 100),
      fenceV(618, 248, 126),
      signpost(694, 376),
      ...(flags.heartwood_restored
        ? [
            lantern(486, 320),
            lantern(664, 278),
            lantern(292, 302),
            lantern(610, 278),
            lantern(536, 520, "warm"),
          ]
        : []),
      signpost(132, 684),
      ...(flags.village_patrols_returned ? [lantern(840, 278), fenceH(874, 286, 122)] : []),
      ...(flags.apothecary_resupplied ? [lantern(194, 280, "cool"), signpost(242, 336)] : []),
      bush(232, 676, 88, 54),
      bush(636, 726, 92, 56),
      tree(804, 168, 108, "forest"),
      tree(1086, 176, 120, "forest"),
      tree(1324, 284, 118, "forest"),
      tree(1250, 682, 114, "forest"),
      tree(824, 792, 114, "forest"),
      tree(428, 820, 110, "forest"),
      tree(176, 612, 92, "forest"),
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
  const flags = context.worldFlags || {};
  const tiles = createTiles(rng);
  stampRect(tiles, 0, 0, COLS, ROWS, "grass", 0);
  clearOverlayRect(tiles, 0, 0, COLS, ROWS);
  stampEllipse(tiles, 24, 25, 14, 9, "water", 0);
  stampEllipse(tiles, 52, 34, 12, 9, "water", 1);
  stampEllipse(tiles, 78, 20, 11, 8, "water", 0);
  paintPath(tiles, 8, 31, 92, 30, 2, "planks", 0);
  paintPath(tiles, 44, 30, 50, 52, 2, "planks", 1);
  paintPath(tiles, 67, 18, 75, 16, 1, "planks", 1);
  clearOverlayRect(tiles, 0, 22, 100, 14);
  scatterOverlay(tiles, rng, 10, 8, 18, 10, 20, "reeds");
  scatterOverlay(tiles, rng, 60, 40, 16, 8, 18, "reeds");
  if (flags.stillwater_restored) {
    scatterOverlay(tiles, rng, 16, 12, 64, 36, 42, "flowersCool");
    scatterOverlay(tiles, rng, 18, 18, 58, 28, 24, "flowersWarm");
  }

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
    interactable("marsh-lantern-1", "totem", 536, 420, {
      name: "Marsh Lantern",
      promptLabel: "Relight Lantern",
      collectKey: "marshLanternsLit",
      toastText: "Marsh lantern relit",
      requiresCleared: true,
      sortY: 432,
    }),
    interactable("marsh-lantern-2", "totem", 834, 314, {
      name: "Marsh Lantern",
      promptLabel: "Relight Lantern",
      collectKey: "marshLanternsLit",
      toastText: "Marsh lantern relit",
      requiresCleared: true,
      sortY: 326,
    }),
    interactable("waystone-seal-2", "seal", 1198, 244, {
      name: "Waystone Seal",
      promptLabel: "Recover Seal",
      collectKey: "waystoneSealsRecovered",
      toastText: "Waystone seal recovered",
      requiresCleared: true,
      sortY: 256,
    }),
    interactable("tide-seal-1", "seal", 1404, 350, {
      name: "Tide Seal",
      promptLabel: "Recover Tide Seal",
      collectKey: "tideSealsRecovered",
      toastText: "Tide seal recovered",
      requiresCleared: true,
      sortY: 362,
    }),
  ];

  return createBaseArena(context, tiles, {
    playerSpawn: { x: 128, y: 492 },
    entrySpawns: {
      default: { x: 128, y: 492 },
      westGate: { x: 128, y: 492 },
      northGate: { x: 814, y: 108 },
      eastCauseway: { x: 1456, y: 436 },
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
      makeExit("eastCauseway", 1490, 362, 58, 176, "right", context.connections.eastCauseway),
      makeExit("chapelSteps", 1222, 844, 194, 76, "down", context.connections.chapelSteps),
    ],
    obstacles: [
      water(176, 226, 284, 170, "marsh"),
      water(712, 468, 286, 186, "marsh"),
      water(1124, 150, 226, 154, "marsh"),
      bridge(236, 450, 224, 44),
      bridge(794, 356, 46, 232),
      bridge(1088, 224, 178, 42),
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
      ...(flags.marsh_route_lit ? [lantern(1234, 370, "cool"), lantern(1338, 818, "cool")] : []),
      ...(flags.chapel_of_tides_open ? [bridge(1224, 826, 180, 38), signpost(1292, 794)] : []),
      ...(flags.stillwater_restored
        ? [
            lantern(286, 438, "warm"),
            lantern(650, 398, "warm"),
            lantern(1044, 568, "warm"),
          ]
        : []),
      signpost(448, 402),
    ],
    npcs: [
      npc("nettle", 236, 462),
      ...(flags.marsh_route_lit || flags.stillwater_restored
        ? [npc("mara", 486, 420)]
        : []),
      ...(flags.stillwater_restored ? [npc("halen", 660, 438)] : []),
    ],
    interactables,
    hazards: [],
  });
}

function buildEmberpineGrove(context, rng) {
  const flags = context.worldFlags || {};
  const questStates = context.questStates || {};
  const cinderReleased =
    questStates.cinder_warden === "done" ||
    questStates.cinder_warden === "complete" ||
    flags.cinder_warden_released;
  const tiles = createTiles(rng);
  stampRect(tiles, 0, 0, COLS, ROWS, "emberGrass", 0);
  clearOverlayRect(tiles, 0, 0, COLS, ROWS);
  stampEllipse(tiles, 50, 30, 14, 10, "ash", 0);
  paintPath(tiles, 50, 56, 50, 30, 2, "ashPath", 0);
  paintPath(tiles, 50, 30, 92, 30, 2, "ashPath", 1);
  stampEllipse(tiles, 24, 24, 8, 5, "ember", 0);
  stampEllipse(tiles, 68, 18, 8, 5, "ember", 1);
  stampEllipse(tiles, 72, 44, 7, 5, "ember", 0);
  clearOverlayRect(tiles, 40, 18, 26, 24);
  if (flags.ember_restored) {
    scatterOverlay(tiles, rng, 34, 18, 36, 28, 30, "flowersWarm");
  }

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
    ...(cinderReleased && !flags.ember_restored
      ? [
          interactable("firewatch-ember", "forgeEmber", 922, 470, {
            name: "Firewatch Ember",
            promptLabel: "Recover the steady ember",
            collectKey: "forgeEmberRecovered",
            toastText: "The Firewatch Ember burns without hunger.",
            dialogueLines: [
              "This flame does not reach for the ash around it.",
              "It remembers warmth, craft, and the hands that once kept both in balance.",
            ],
            requiresCleared: true,
            interactionRadius: 82,
            w: 42,
            h: 42,
            sortY: 486,
          }),
        ]
      : []),
    ...(flags.ember_restored
      ? [
          interactable("ember-forge", "forge", 844, 690, {
            name: "Restored Firewatch Forge",
            promptLabel: "Listen to the forge",
            repeatable: true,
            dialogueLines: [
              "The forge keeps a low, even flame.",
              "Its heat now follows the work instead of consuming it.",
            ],
            interactionRadius: 86,
            w: 58,
            h: 52,
            sortY: 710,
          }),
        ]
      : []),
  ];

  return createBaseArena(context, tiles, {
    playerSpawn: { x: 808, y: 840 },
    entrySpawns: {
      default: { x: 808, y: 840 },
      westGate: { x: 118, y: 486 },
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
      makeExit("westGate", 24, 392, 68, 170, "left", context.connections.westGate),
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
      ...(flags.ember_pass_reopened ? [lantern(1220, 432, "ember"), fenceH(1110, 448, 138)] : []),
      ...(flags.ember_restored ? [lantern(844, 690, "warm"), lantern(1088, 570, "warm")] : []),
      signpost(640, 720),
    ],
    npcs: [
      npc("garrick", 188, 454),
      ...(flags.ember_pass_reopened ? [npc("halen", 1248, 454)] : []),
      ...(flags.ember_restored ? [npc("mara", 1058, 610)] : []),
    ],
    interactables,
    hazards: flags.ember_restored
      ? []
      : [
          { id: "ember-pool-1", x: 302, y: 220, w: 120, h: 82, damage: 8, interval: 0.72, type: "ember" },
          { id: "ember-pool-2", x: 1032, y: 598, w: 116, h: 80, damage: 8, interval: 0.72, type: "ember" },
        ],
  });
}

function buildFrostveilTundra(context, rng) {
  const flags = context.worldFlags || {};
  const questStates = context.questStates || {};
  const seraphReleased =
    questStates.veil_seraph === "done" ||
    questStates.veil_seraph === "complete" ||
    flags.veil_seraph_released;
  const tiles = createTiles(rng);
  stampRect(tiles, 0, 0, COLS, ROWS, "snow", 0);
  clearOverlayRect(tiles, 0, 0, COLS, ROWS);
  stampEllipse(tiles, 36, 28, 12, 8, "ice", 0);
  stampEllipse(tiles, 66, 20, 10, 7, "ice", 1);
  paintPath(tiles, 8, 30, 42, 30, 2, "snowPath", 0);
  paintPath(tiles, 42, 30, 72, 18, 2, "snowPath", 1);
  paintPath(tiles, 42, 30, 52, 54, 2, "snowPath", 0);
  clearOverlayRect(tiles, 8, 24, 80, 12);
  scatterOverlay(tiles, rng, 18, 10, 20, 10, 16, "frostFlowers");
  scatterOverlay(tiles, rng, 60, 38, 14, 12, 12, "frostFlowers");
  if (flags.frost_restored) {
    scatterOverlay(tiles, rng, 34, 20, 34, 22, 28, "flowersCool");
  }

  const interactables = [
    interactable("lost-scout", "scout", 994, 312, {
      name: "Lost Scout",
      promptLabel: "Inspect Camp",
      collectKey: "scoutFound",
      toastText: "Scout signal recovered",
      requiresCleared: true,
      sortY: 326,
      dialogueLines: [
        "A frozen satchel rests beside the collapsed tent.",
        "The scout's message points north. Whatever rules the ruins is awake.",
      ],
    }),
    ...(seraphReleased && !flags.frost_restored
      ? [
          interactable("seraph-message", "seal", 936, 462, {
            name: "Veil Seraph's Letter",
            promptLabel: "Recover the Winter Letter",
            collectKey: "seraphMessageRecovered",
            toastText: "The letter still carries a trace of living warmth.",
            dialogueLines: [
              "The seal bears Ayla's mother's mark beside the Seraph's own.",
              "Its final line asks the guardian to hold only until someone returns with a kinder answer.",
            ],
            requiresCleared: true,
            interactionRadius: 82,
            w: 38,
            h: 38,
            sortY: 478,
          }),
        ]
      : []),
    ...(flags.frost_restored
      ? [
          interactable("frost-waystone", "shrine", 848, 540, {
            name: "Restored Ridge Waystone",
            promptLabel: "Listen to the waystone network",
            repeatable: true,
            dialogueLines: [
              "Warm light moves through every carved route.",
              "Heartwood, Stillwater, Ember and Frost answer one another without delay.",
            ],
            interactionRadius: 82,
            w: 44,
            h: 50,
            sortY: 560,
          }),
        ]
      : []),
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
      ...(flags.ridge_signal_recovered ? [lantern(1120, 248, "frost"), signpost(1030, 250)] : []),
      ...(flags.frost_restored ? [lantern(742, 590, "warm"), lantern(1068, 494, "warm")] : []),
      signpost(848, 258),
    ],
    npcs: [
      npc("vesper", 226, 430),
      ...(flags.ridge_signal_recovered ? [npc("halen", 1088, 304)] : []),
      ...(flags.frost_restored ? [npc("mara", 760, 624)] : []),
    ],
    interactables,
    hazards: [],
  });
}

function buildHollowheartRuins(context, rng) {
  const flags = context.worldFlags || {};
  const questStates = context.questStates || {};
  const elderReleased =
    questStates.elder_hollow === "done" ||
    questStates.elder_hollow === "complete" ||
    flags.elder_hollow_broken;
  const tiles = createTiles(rng);
  stampRect(tiles, 0, 0, COLS, ROWS, "blight", 0);
  clearOverlayRect(tiles, 0, 0, COLS, ROWS);
  stampEllipse(tiles, 52, 30, 18, 13, "ruinStone", 0);
  stampEllipse(tiles, 52, 30, 12, 8, "ash", 1);
  paintPath(tiles, 50, 57, 52, 38, 2, "ruinStone", 1);
  clearOverlayRect(tiles, 28, 12, 48, 38);
  if (flags.scarroot_restored) {
    stampEllipse(tiles, 52, 32, 18, 12, "grass", 0);
    paintPath(tiles, 50, 57, 52, 38, 2, "path", 1);
    scatterOverlay(tiles, rng, 34, 18, 36, 26, 30, "flowersWarm");
  }

  const interactables = [
    ...(elderReleased && !flags.scarroot_restored
      ? [
          interactable("first-keeper-memory", "memoryRoot", 916, 472, {
            name: "First Keeper's Living Memory",
            promptLabel: "Listen beneath the broken crown",
            collectKey: "firstKeeperMemoryRecovered",
            toastText: "The first keeper's choice settles into Ayla's keeping.",
            dialogueLines: [
              "The keeper heard the star-voice offer a thousand futures and feared every one that could not be controlled.",
              "They pressed the roots into a single harmless shape. Scarroot's rot began wherever life tried to become something else.",
            ],
            requiresCleared: true,
            interactionRadius: 86,
            w: 48,
            h: 48,
            sortY: 492,
          }),
        ]
      : []),
    ...(flags.scarroot_restored
      ? [
          interactable("hollowheart-memorial", "memoryRoot", 916, 472, {
            name: "Hollowheart Memorial",
            promptLabel: "Listen to the many-rooted court",
            repeatable: true,
            dialogueLines: [
              "No single root carries the whole song anymore.",
              "New shoots cross the old court in different directions and none are named a mistake.",
            ],
            interactionRadius: 86,
            w: 48,
            h: 48,
            sortY: 492,
          }),
        ]
      : []),
  ];

  return createBaseArena(context, tiles, {
    playerSpawn: { x: 806, y: 838 },
    entrySpawns: {
      default: { x: 806, y: 838 },
      southGate: { x: 806, y: 838 },
      westGate: { x: 132, y: 462 },
      northGate: { x: 912, y: 106 },
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
      makeExit("westGate", 24, 384, 70, 164, "left", context.connections.westGate),
      makeExit("northGate", 816, 24, 188, 62, "up", context.connections.northGate),
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
      ...(flags.scarroot_restored ? [lantern(846, 664, "warm"), lantern(988, 664, "warm")] : []),
    ],
    npcs: [],
    interactables,
    hazards: flags.scarroot_restored
      ? []
      : [
          { id: "blight-pool-1", x: 648, y: 560, w: 122, h: 88, damage: 10, interval: 0.68, type: "blight" },
          { id: "blight-pool-2", x: 1052, y: 560, w: 122, h: 88, damage: 10, interval: 0.68, type: "blight" },
        ],
  });
}

function buildMossyRuins(context, rng) {
  const flags = context.worldFlags || {};
  const tiles = createTiles(rng);
  stampRect(tiles, 0, 0, COLS, ROWS, "grass", 0);
  stampEllipse(tiles, 46, 28, 18, 12, "ruinStone", 0);
  paintPath(tiles, 50, 56, 50, 28, 2, "ruinStone", 1);
  paintPath(tiles, 50, 28, 92, 28, 2, "path", 0);
  paintPath(tiles, 50, 28, 10, 28, 2, "path", 1);
  stampEllipse(tiles, 26, 18, 8, 6, "water", 0);
  stampEllipse(tiles, 74, 42, 8, 6, "water", 0);
  clearOverlayRect(tiles, 20, 18, 58, 24);
  scatterOverlay(tiles, rng, 12, 10, 18, 12, 18, "flowersWarm");
  if (flags.heartwood_restored) {
    scatterOverlay(tiles, rng, 34, 18, 36, 24, 42, "flowersWarm");
    scatterOverlay(tiles, rng, 50, 26, 24, 18, 26, "flowersCool");
  }

  const interactables = [
    interactable("relic-cache-1", "totem", 714, 302, {
      name: "Relic Cache",
      promptLabel: "Recover Cache",
      collectKey: "relicCachesRecovered",
      toastText: "Relic cache secured",
      requiresCleared: true,
      sortY: 314,
    }),
    interactable("relic-cache-2", "totem", 1082, 548, {
      name: "Relic Cache",
      promptLabel: "Recover Cache",
      collectKey: "relicCachesRecovered",
      toastText: "Relic cache secured",
      requiresCleared: true,
      sortY: 560,
    }),
    interactable("tide-seal-2", "seal", 1226, 328, {
      name: "Tide Seal",
      promptLabel: "Recover Tide Seal",
      collectKey: "tideSealsRecovered",
      toastText: "Tide seal recovered",
      requiresCleared: true,
      sortY: 342,
    }),
  ];

  return createBaseArena(context, tiles, {
    playerSpawn: { x: 806, y: 842 },
    entrySpawns: {
      default: { x: 806, y: 842 },
      southGate: { x: 806, y: 842 },
      eastGate: { x: 1450, y: 456 },
      northVault: { x: 920, y: 108 },
    },
    spawnPoints: [
      { x: 192, y: 168 },
      { x: 546, y: 154 },
      { x: 1380, y: 210 },
      { x: 1306, y: 710 },
      { x: 274, y: 732 },
    ],
    bossZone: { x: 930, y: 456, radius: 180 },
    bossAddSpawns: [
      { x: 776, y: 456 },
      { x: 930, y: 310 },
      { x: 1080, y: 456 },
      { x: 930, y: 604 },
    ],
    exits: [
      makeExit("southGate", 710, 884, 196, 52, "down", context.connections.southGate),
      makeExit("eastGate", 1498, 388, 54, 168, "right", context.connections.eastGate),
      makeExit("northVault", 814, 24, 204, 62, "up", context.connections.northVault),
    ],
    obstacles: [
      ruin(678, 228, 204, 120, "arch"),
      ruin(820, 112, 180, 102, "sealedGate"),
      ruin(992, 440, 138, 98, "pillar"),
      ruin(480, 564, 132, 96, "pillar"),
      water(240, 154, 214, 142, "marsh"),
      water(1068, 630, 220, 142, "marsh"),
      bridge(996, 572, 48, 176),
      tree(164, 164, 112, "forest"),
      tree(438, 136, 106, "forest"),
      tree(1298, 188, 112, "forest"),
      tree(1240, 706, 110, "forest"),
      rock(808, 640, 74, 44),
      rock(546, 404, 72, 42),
      bush(310, 700, 88, 54, "forest"),
      lantern(690, 334),
      lantern(1090, 470),
      ...(flags.heartwood_restored
        ? [lantern(836, 612, "warm"), lantern(1012, 604, "warm")]
        : []),
      ...(flags.ruins_listening_post ? [lantern(888, 186, "cool"), signpost(1092, 308)] : []),
      ...(flags.sunken_reliquary_open ? [lantern(900, 146, "warm")] : []),
      signpost(900, 760),
    ],
    npcs: flags.heartwood_restored
      ? [
          npc("orras", 250, 666),
          ...(flags.ruins_listening_post ? [npc("halen", 1038, 348)] : []),
        ]
      : [],
    interactables,
    hazards: [],
  });
}

function buildSunkenReliquary(context, rng) {
  const tiles = createTiles(rng);
  stampRect(tiles, 0, 0, COLS, ROWS, "ruinStone", 0);
  clearOverlayRect(tiles, 0, 0, COLS, ROWS);
  stampEllipse(tiles, 52, 30, 22, 14, "path", 0);
  stampEllipse(tiles, 52, 30, 12, 8, "water", 0);
  stampRect(tiles, 42, 10, 20, 12, "ruinStone", 1);
  paintPath(tiles, 52, 56, 52, 30, 2, "path", 1);
  paintPath(tiles, 52, 30, 52, 12, 2, "path", 0);
  clearOverlayRect(tiles, 20, 8, 64, 40);
  scatterOverlay(tiles, rng, 22, 16, 44, 18, 20, "flowersCool");

  const interactables = [
    interactable("reliquary-brazier-1", "totem", 694, 336, {
      name: "Ward Brazier",
      promptLabel: "Relight Brazier",
      collectKey: "reliquaryBraziersLit",
      toastText: "Ward brazier relit",
      requiresCleared: true,
      sortY: 348,
    }),
    interactable("reliquary-brazier-2", "totem", 1152, 336, {
      name: "Ward Brazier",
      promptLabel: "Relight Brazier",
      collectKey: "reliquaryBraziersLit",
      toastText: "Ward brazier relit",
      requiresCleared: true,
      sortY: 348,
    }),
  ];

  return createBaseArena(context, tiles, {
    playerSpawn: { x: 804, y: 842 },
    entrySpawns: {
      default: { x: 804, y: 842 },
      southSteps: { x: 804, y: 842 },
    },
    spawnPoints: [
      { x: 274, y: 218 },
      { x: 548, y: 188 },
      { x: 1324, y: 222 },
      { x: 1292, y: 702 },
      { x: 300, y: 714 },
    ],
    bossZone: { x: 936, y: 436, radius: 186 },
    bossAddSpawns: [
      { x: 764, y: 436 },
      { x: 936, y: 284 },
      { x: 1106, y: 436 },
      { x: 936, y: 586 },
    ],
    exits: [makeExit("southSteps", 708, 884, 196, 52, "down", context.connections.southSteps)],
    obstacles: [
      ruin(760, 176, 228, 134, "altar"),
      ruin(524, 312, 128, 94, "pillar"),
      ruin(1210, 312, 128, 94, "pillar"),
      ruin(520, 630, 136, 98, "pillar"),
      ruin(1206, 630, 136, 98, "pillar"),
      water(818, 364, 224, 128, "marsh"),
      tree(212, 194, 112, "frost"),
      tree(1288, 192, 112, "charredTree"),
      rock(650, 544, 76, 44),
      rock(1138, 546, 78, 46),
      bush(344, 734, 86, 52, "frost"),
      bush(1230, 734, 86, 52, "blight"),
      lantern(760, 330, "frost"),
      lantern(1112, 330, "warm"),
      signpost(884, 786),
    ],
    npcs: [],
    interactables,
    hazards: [
      { id: "reliquary-pool-1", x: 794, y: 366, w: 96, h: 68, damage: 8, interval: 0.74, type: "blight" },
      { id: "reliquary-pool-2", x: 966, y: 422, w: 94, h: 66, damage: 8, interval: 0.74, type: "blight" },
    ],
  });
}

function buildChapelOfTides(context, rng) {
  const flags = context.worldFlags || {};
  const tiles = createTiles(rng);
  stampRect(tiles, 0, 0, COLS, ROWS, "ruinStone", 0);
  clearOverlayRect(tiles, 0, 0, COLS, ROWS);
  stampEllipse(tiles, 52, 30, 20, 14, "water", 0);
  stampEllipse(tiles, 52, 30, 10, 7, "path", 0);
  stampRect(tiles, 22, 18, 60, 24, "path", 1);
  paintPath(tiles, 52, 56, 52, 32, 2, "path", 0);
  paintPath(tiles, 52, 32, 20, 20, 2, "path", 0);
  paintPath(tiles, 52, 32, 84, 20, 2, "path", 0);
  clearOverlayRect(tiles, 16, 10, 68, 40);
  scatterOverlay(tiles, rng, 18, 14, 62, 28, 22, "flowersCool");
  scatterOverlay(tiles, rng, 16, 14, 18, 22, 14, "reeds");
  scatterOverlay(tiles, rng, 70, 16, 14, 20, 12, "reeds");

  const interactables = [
    interactable("tide-brazier-1", "totem", 704, 324, {
      name: "Tide Brazier",
      promptLabel: "Relight Brazier",
      collectKey: "tideBraziersLit",
      toastText: "Tide brazier rekindled",
      requiresCleared: true,
      sortY: 338,
    }),
    interactable("tide-brazier-2", "totem", 1148, 324, {
      name: "Tide Brazier",
      promptLabel: "Relight Brazier",
      collectKey: "tideBraziersLit",
      toastText: "Tide brazier rekindled",
      requiresCleared: true,
      sortY: 338,
    }),
    interactable("tide-memory", "shrine", 934, 690, {
      name: "Matron's Memory",
      promptLabel: "Listen to the Stillwater memory",
      collectKey: "tideMemoryRecovered",
      toastText: "The Matron's memory settles into Ayla's keeping.",
      requiresCleared: true,
      w: 44,
      h: 36,
      interactionRadius: 74,
      sortY: 708,
      dialogueLines: [
        "The water remembers Ayla's mother standing beside five frightened keepers.",
        "They divided the roots to contain the star-borne wound, knowing the sealed memories would poison every region slowly.",
        "The Matron did not betray them. She stayed behind so one witness would survive the forgetting.",
      ],
    }),
  ];

  return createBaseArena(context, tiles, {
    playerSpawn: { x: 804, y: 842 },
    entrySpawns: {
      default: { x: 804, y: 842 },
      southSteps: { x: 804, y: 842 },
    },
    spawnPoints: [
      { x: 238, y: 214 },
      { x: 532, y: 186 },
      { x: 1326, y: 214 },
      { x: 1306, y: 712 },
      { x: 312, y: 734 },
    ],
    bossZone: { x: 934, y: 438, radius: 190 },
    bossAddSpawns: [
      { x: 760, y: 438 },
      { x: 934, y: 286 },
      { x: 1108, y: 438 },
      { x: 934, y: 590 },
    ],
    exits: [makeExit("southSteps", 708, 884, 196, 52, "down", context.connections.southSteps)],
    obstacles: [
      ruin(752, 178, 236, 136, "altar"),
      ruin(528, 316, 128, 96, "pillar"),
      ruin(1212, 316, 128, 96, "pillar"),
      ruin(500, 622, 142, 102, "pillar"),
      ruin(1220, 620, 142, 102, "pillar"),
      water(790, 366, 282, 144, "marsh"),
      water(260, 196, 186, 130, "marsh"),
      water(1144, 188, 176, 124, "marsh"),
      bridge(802, 514, 248, 40),
      tree(204, 198, 112, "swamp"),
      tree(1272, 198, 114, "swamp"),
      tree(224, 706, 110, "swamp"),
      tree(1270, 704, 110, "swamp"),
      bush(382, 752, 90, 54, "marsh"),
      bush(1122, 752, 90, 54, "marsh"),
      rock(646, 548, 78, 46),
      rock(1132, 548, 78, 46),
      lantern(774, 332, "cool"),
      lantern(1080, 332, "cool"),
      ...(flags.chapel_of_tides_cleansed ? [lantern(932, 230, "warm"), signpost(904, 776)] : []),
    ],
    npcs: [],
    interactables,
    hazards: flags.chapel_of_tides_cleansed
      ? []
      : [
          { id: "chapel-pool-1", x: 824, y: 378, w: 88, h: 62, damage: 8, interval: 0.74, type: "mire" },
          { id: "chapel-pool-2", x: 960, y: 440, w: 92, h: 66, damage: 8, interval: 0.74, type: "mire" },
          { id: "chapel-pool-3", x: 300, y: 214, w: 100, h: 76, damage: 7, interval: 0.8, type: "mire" },
        ],
  });
}

function buildBlightedWoods(context, rng) {
  const flags = context.worldFlags || {};
  const questStates = context.questStates || {};
  const tendingSaplings =
    questStates.smallest_grove === "active" ||
    questStates.smallest_grove === "complete";
  const tiles = createTiles(rng);
  stampRect(tiles, 0, 0, COLS, ROWS, "blight", 0);
  clearOverlayRect(tiles, 0, 0, COLS, ROWS);
  stampEllipse(tiles, 52, 30, 16, 11, "ash", 0);
  paintPath(tiles, 8, 30, 52, 30, 2, "ashPath", 0);
  paintPath(tiles, 52, 30, 92, 30, 2, "ashPath", 1);
  paintPath(tiles, 52, 30, 52, 56, 2, "ashPath", 0);
  clearOverlayRect(tiles, 12, 18, 76, 30);
  if (flags.scarroot_restored) {
    stampEllipse(tiles, 52, 30, 18, 12, "grass", 0);
    paintPath(tiles, 8, 30, 52, 30, 2, "path", 0);
    paintPath(tiles, 52, 30, 92, 30, 2, "path", 1);
    paintPath(tiles, 52, 30, 52, 56, 2, "path", 0);
    scatterOverlay(tiles, rng, 34, 18, 36, 26, 34, "flowersWarm");
  }

  const interactables = [
    ...(!flags.court_approach_secured
      ? [
          interactable("blight-effigy-1", "corruptedRoot", 814, 390, {
            name: "Blight Effigy",
            promptLabel: "Shatter Effigy",
            collectKey: "blightEffigiesBroken",
            toastText: "Blight effigy shattered",
            requiresCleared: true,
            sortY: 406,
          }),
          interactable("blight-effigy-2", "corruptedRoot", 1128, 618, {
            name: "Blight Effigy",
            promptLabel: "Shatter Effigy",
            collectKey: "blightEffigiesBroken",
            toastText: "Blight effigy shattered",
            requiresCleared: true,
            sortY: 634,
          }),
        ]
      : []),
    ...(flags.scarroot_restored && tendingSaplings
      ? [
          interactable("scarroot-sapling-1", "livingSapling", 668, 332, {
            name: "Pale Sapling",
            promptLabel: "Tend the young roots",
            collectKey: "scarrootSaplingsTended",
            toastText: "The sapling lifts toward open light.",
            interactionRadius: 70,
            w: 34,
            h: 42,
            sortY: 350,
          }),
          interactable("scarroot-sapling-2", "livingSapling", 1010, 424, {
            name: "Pale Sapling",
            promptLabel: "Tend the young roots",
            collectKey: "scarrootSaplingsTended",
            toastText: "The roots settle without being forced into line.",
            interactionRadius: 70,
            w: 34,
            h: 42,
            sortY: 442,
          }),
          interactable("scarroot-sapling-3", "livingSapling", 846, 664, {
            name: "Pale Sapling",
            promptLabel: "Tend the young roots",
            collectKey: "scarrootSaplingsTended",
            toastText: "A new leaf opens in its own direction.",
            interactionRadius: 70,
            w: 34,
            h: 42,
            sortY: 682,
          }),
        ]
      : []),
    ...(flags.scarroot_nursery_restored
      ? [
          interactable("scarroot-smallest-grove", "livingSapling", 914, 522, {
            name: "The Smallest Grove",
            promptLabel: "Listen to the new leaves",
            repeatable: true,
            dialogueLines: [
              "Three different crowns lean into the same patch of sun.",
              "Nothing here is ancient yet, and nothing is asking permission to grow.",
            ],
            interactionRadius: 82,
            w: 64,
            h: 58,
            sortY: 548,
          }),
        ]
      : []),
  ];

  return createBaseArena(context, tiles, {
    playerSpawn: { x: 130, y: 472 },
    entrySpawns: {
      default: { x: 130, y: 472 },
      westGate: { x: 130, y: 472 },
      southGate: { x: 804, y: 840 },
      eastGate: { x: 1450, y: 456 },
    },
    spawnPoints: [
      { x: 184, y: 196 },
      { x: 530, y: 162 },
      { x: 1360, y: 214 },
      { x: 1320, y: 724 },
      { x: 322, y: 740 },
    ],
    bossZone: { x: 930, y: 456, radius: 188 },
    bossAddSpawns: [
      { x: 772, y: 456 },
      { x: 930, y: 304 },
      { x: 1088, y: 456 },
      { x: 930, y: 610 },
    ],
    exits: [
      makeExit("westGate", 24, 392, 70, 164, "left", context.connections.westGate),
      makeExit("southGate", 708, 884, 196, 52, "down", context.connections.southGate),
      makeExit("eastGate", 1496, 388, 56, 168, "right", context.connections.eastGate),
    ],
    obstacles: [
      ruin(732, 248, 210, 120, "altar"),
      ruin(486, 598, 128, 92, "pillar"),
      ruin(1170, 542, 138, 96, "pillar"),
      tree(178, 160, 118, "charredTree"),
      tree(464, 142, 110, "charredTree"),
      tree(1286, 176, 118, "charredTree"),
      tree(1280, 700, 114, "charredTree"),
      bush(608, 758, 92, 56, "blight"),
      bush(1060, 764, 92, 56, "blight"),
      rock(868, 690, 84, 46),
      rock(590, 430, 74, 44),
      lantern(754, 392, "ember"),
      lantern(1020, 312, "ember"),
      ...(flags.court_approach_secured ? [lantern(1228, 448, "ember"), signpost(1268, 416)] : []),
      ...(flags.scarroot_restored ? [lantern(850, 620, "warm"), lantern(1090, 532, "warm")] : []),
      signpost(904, 762),
    ],
    npcs: [
      npc("bram", 238, 666),
      ...(flags.court_approach_secured ? [npc("halen", 1224, 472)] : []),
      ...(flags.scarroot_restored ? [npc("mara", 1080, 570)] : []),
    ],
    interactables,
    hazards: flags.scarroot_restored
      ? []
      : [
          { id: "blight-pool-a", x: 286, y: 248, w: 122, h: 84, damage: 10, interval: 0.68, type: "blight" },
          { id: "blight-pool-b", x: 1042, y: 590, w: 132, h: 88, damage: 10, interval: 0.68, type: "blight" },
        ],
  });
}

function buildAncientHeart(context, rng) {
  const flags = context.worldFlags || {};
  const tiles = createTiles(rng);
  stampRect(tiles, 0, 0, COLS, ROWS, "ruinStone", 0);
  clearOverlayRect(tiles, 0, 0, COLS, ROWS);
  stampEllipse(tiles, 52, 30, 18, 12, "path", 0);
  stampEllipse(tiles, 52, 30, 8, 6, "water", 0);
  paintPath(tiles, 52, 56, 52, 30, 2, "path", 1);
  paintPath(tiles, 52, 30, 86, 18, 2, "path", 0);
  clearOverlayRect(tiles, 18, 16, 64, 32);
  scatterOverlay(tiles, rng, 26, 10, 40, 12, 24, "flowersCool");

  const interactables = [
    interactable("heart-bloom-1", "flower", 784, 352, {
      name: "Heart Bloom",
      promptLabel: "Gather Heart Bloom",
      collectKey: "heartBloomsGathered",
      toastText: "Heart Bloom gathered",
      sortY: 362,
    }),
    interactable("heart-bloom-2", "flower", 1032, 520, {
      name: "Heart Bloom",
      promptLabel: "Gather Heart Bloom",
      collectKey: "heartBloomsGathered",
      toastText: "Heart Bloom gathered",
      sortY: 530,
    }),
    interactable("star-seal-1", "seal", 628, 318, {
      name: "Star Seal",
      promptLabel: "Restore Star Seal",
      collectKey: "starSealsRecovered",
      toastText: "Star seal restored",
      requiresCleared: true,
      sortY: 332,
    }),
    interactable("star-seal-2", "seal", 1208, 356, {
      name: "Star Seal",
      promptLabel: "Restore Star Seal",
      collectKey: "starSealsRecovered",
      toastText: "Star seal restored",
      requiresCleared: true,
      sortY: 370,
    }),
  ];

  return createBaseArena(context, tiles, {
    playerSpawn: { x: 804, y: 842 },
    entrySpawns: {
      default: { x: 804, y: 842 },
      southGate: { x: 804, y: 842 },
      northSanctum: { x: 932, y: 116 },
    },
    spawnPoints: [
      { x: 242, y: 194 },
      { x: 594, y: 164 },
      { x: 1322, y: 214 },
      { x: 1298, y: 710 },
      { x: 346, y: 724 },
    ],
    bossZone: { x: 934, y: 454, radius: 188 },
    bossAddSpawns: [
      { x: 770, y: 454 },
      { x: 934, y: 304 },
      { x: 1096, y: 454 },
      { x: 934, y: 610 },
    ],
    exits: [
      makeExit("southGate", 708, 884, 196, 52, "down", context.connections.southGate),
      makeExit("northSanctum", 840, 24, 184, 62, "up", context.connections.northSanctum),
    ],
    obstacles: [
      ruin(760, 208, 214, 128, "altar"),
      ruin(520, 334, 124, 92, "pillar"),
      ruin(1168, 330, 124, 92, "pillar"),
      water(816, 382, 186, 116, "ice"),
      tree(208, 170, 112, "frost"),
      tree(422, 166, 108, "frost"),
      tree(1260, 192, 120, "charredTree"),
      rock(612, 650, 80, 46),
      rock(1098, 648, 82, 46),
      bush(324, 744, 88, 54, "frost"),
      bush(1216, 742, 88, 54, "forest"),
      lantern(892, 338, "frost"),
      lantern(1034, 338, "warm"),
      ...(flags.starfall_sanctum_open ? [lantern(934, 204, "cool"), signpost(1018, 212)] : []),
      ...(flags.rootlight_restored || flags.starfall_sanctum_cleansed
        ? [lantern(1118, 336, "warm"), lantern(776, 336, "warm")]
        : []),
    ],
    npcs: [
      npc("selka", 254, 670),
      ...(flags.elder_hollow_broken ? [npc("mara", 1088, 372)] : []),
      ...(flags.rootlight_restored || flags.starfall_sanctum_cleansed ? [npc("halen", 920, 286)] : []),
    ],
    interactables,
    hazards: [],
  });
}

function buildStarfallSanctum(context, rng) {
  const flags = context.worldFlags || {};
  const tiles = createTiles(rng);
  stampRect(tiles, 0, 0, COLS, ROWS, "ruinStone", 0);
  clearOverlayRect(tiles, 0, 0, COLS, ROWS);
  stampEllipse(tiles, 52, 30, 20, 13, "path", 0);
  stampEllipse(tiles, 52, 30, 9, 6, "ice", 0);
  paintPath(tiles, 52, 56, 52, 30, 2, "path", 1);
  paintPath(tiles, 52, 30, 24, 16, 2, "path", 0);
  paintPath(tiles, 52, 30, 80, 16, 2, "path", 0);
  clearOverlayRect(tiles, 18, 10, 64, 40);
  scatterOverlay(tiles, rng, 18, 12, 60, 20, 18, "flowersCool");
  scatterOverlay(tiles, rng, 24, 14, 50, 18, 14, "frostFlowers");

  const interactables = [
    interactable("star-brazier-1", "totem", 706, 324, {
      name: "Star Brazier",
      promptLabel: "Relight Brazier",
      collectKey: "starBraziersLit",
      toastText: "Star brazier relit",
      requiresCleared: true,
      sortY: 338,
    }),
    interactable("star-brazier-2", "totem", 1156, 324, {
      name: "Star Brazier",
      promptLabel: "Relight Brazier",
      collectKey: "starBraziersLit",
      toastText: "Star brazier relit",
      requiresCleared: true,
      sortY: 338,
    }),
  ];

  return createBaseArena(context, tiles, {
    playerSpawn: { x: 804, y: 842 },
    entrySpawns: {
      default: { x: 804, y: 842 },
      southSteps: { x: 804, y: 842 },
    },
    spawnPoints: [
      { x: 238, y: 208 },
      { x: 532, y: 184 },
      { x: 1326, y: 214 },
      { x: 1308, y: 706 },
      { x: 304, y: 728 },
    ],
    bossZone: { x: 934, y: 438, radius: 196 },
    bossAddSpawns: [
      { x: 760, y: 438 },
      { x: 934, y: 286 },
      { x: 1108, y: 438 },
      { x: 934, y: 590 },
    ],
    exits: [makeExit("southSteps", 708, 884, 196, 52, "down", context.connections.southSteps)],
    obstacles: [
      ruin(742, 176, 252, 142, "altar"),
      ruin(528, 316, 130, 98, "pillar"),
      ruin(1210, 316, 130, 98, "pillar"),
      ruin(506, 622, 142, 102, "pillar"),
      ruin(1224, 622, 142, 102, "pillar"),
      water(792, 370, 290, 146, "ice"),
      water(270, 194, 184, 126, "ice"),
      water(1136, 194, 180, 126, "ice"),
      bridge(816, 518, 236, 40),
      tree(208, 194, 112, "frost"),
      tree(1274, 194, 112, "frost"),
      tree(224, 706, 110, "frost"),
      tree(1270, 706, 110, "charredTree"),
      rock(646, 548, 78, 46, "iceRock"),
      rock(1132, 548, 78, 46, "iceRock"),
      bush(384, 748, 88, 54, "frost"),
      bush(1118, 748, 88, 54, "forest"),
      lantern(776, 332, "frost"),
      lantern(1082, 332, "warm"),
      ...(flags.starfall_sanctum_cleansed ? [signpost(906, 776), lantern(932, 226, "warm")] : []),
    ],
    npcs: [],
    interactables,
    hazards: [],
  });
}

export function createArena(context = {}) {
  const rng = createRng(context.seed || context.id || "arena");

  if (context.sceneStyle === "aylaHomestead") {
    return buildAylaHomestead(context, rng);
  }

  if (context.sceneStyle === "mossyRuins") {
    return buildMossyRuins(context, rng);
  }

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

  if (context.sceneStyle === "blightedWoods") {
    return buildBlightedWoods(context, rng);
  }

  if (context.sceneStyle === "ancientHeart") {
    return buildAncientHeart(context, rng);
  }

  if (context.sceneStyle === "starfallSanctum") {
    return buildStarfallSanctum(context, rng);
  }

  if (context.sceneStyle === "sunkenReliquary") {
    return buildSunkenReliquary(context, rng);
  }

  if (context.sceneStyle === "chapelOfTides") {
    return buildChapelOfTides(context, rng);
  }

  return buildWhisperingWoods(context, rng);
}

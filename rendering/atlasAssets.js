const ATLAS_PATHS = {
  ayla: "./assets/atlases/ayla-sprite.png",
  aylaV3: "./assets/characters/ayla-v3-directional-game-sheet.png",
  aylaV2: "./assets/characters/ayla-v2-game-sheet.png",
  "blighted-woods": "./assets/atlases/blighted-woods.png",
  "ember-hollow": "./assets/atlases/ember-hollow.png",
  "frostpine-tundra": "./assets/atlases/frostpine-tundra.png",
  "moonlit-marsh": "./assets/atlases/moonlit-marsh.png",
  "mossy-ruins": "./assets/atlases/mossy-ruins.png",
  "ancient-heart": "./assets/atlases/ancient-heart.png",
  "verdant-grove": "./assets/atlases/verdant-grove.png",
  terrain: "./assets/terrain/biome-terrain.png",
};

const ATLAS_WORLD_ART_ENABLED = true;
const ATLAS_TILE_PATTERNS_ENABLED = false;
const ATLAS_FLOOR_TEXTURES_ENABLED = true;
const ATLAS_PLAYER_ENABLED = true;

const SCENE_ATLAS_KEYS = {
  whisperingWoods: "mossy-ruins",
  mossrootMarsh: "moonlit-marsh",
  emberpineGrove: "ember-hollow",
  frostveilTundra: "frostpine-tundra",
  hollowheartRuins: "blighted-woods",
  mossyRuins: "mossy-ruins",
  blightedWoods: "blighted-woods",
  ancientHeart: "ancient-heart",
  verdantSanctum: "verdant-grove",
};

const FLOOR_SCENE_ATLAS_KEYS = {
  aylaHomestead: "mossy-ruins",
  whisperingWoods: "mossy-ruins",
  mossrootMarsh: "moonlit-marsh",
  mossyRuins: "mossy-ruins",
  emberpineGrove: "ember-hollow",
  frostveilTundra: "frostpine-tundra",
  blightedWoods: "blighted-woods",
  hollowheartRuins: "blighted-woods",
  ancientHeart: "ancient-heart",
  starfallSanctum: "ancient-heart",
  sunkenReliquary: "ancient-heart",
  chapelOfTides: "moonlit-marsh",
};

const TERRAIN_SCENE_ROWS = {
  aylaHomestead: 0,
  whisperingWoods: 0,
  mossyRuins: 0,
  mossrootMarsh: 1,
  chapelOfTides: 1,
  emberpineGrove: 3,
  frostveilTundra: 4,
  blightedWoods: 5,
  hollowheartRuins: 5,
  ancientHeart: 6,
  starfallSanctum: 6,
  sunkenReliquary: 6,
};

const TERRAIN_MATERIAL_INDEX = {
  natural: 0,
  path: 1,
  soil: 2,
  planks: 3,
  stone: 4,
  liquid: 5,
  special: 6,
};

const TERRAIN_CELL_W = 24;
const TERRAIN_CELL_H = 12;
const TERRAIN_VARIANTS = 4;

const DISABLED_WORLD_ATLASES = new Set(["blighted-woods", "verdant-grove"]);

const BIOME_TREE_RECTS = {
  "mossy-ruins": [
    { x: 236, y: 670, w: 124, h: 148 },
    { x: 352, y: 670, w: 120, h: 148 },
    { x: 464, y: 670, w: 112, h: 148 },
    { x: 560, y: 668, w: 118, h: 150 },
    { x: 670, y: 668, w: 118, h: 150 },
  ],
  "moonlit-marsh": [
    { x: 20, y: 688, w: 116, h: 132 },
    { x: 348, y: 670, w: 118, h: 148 },
    { x: 556, y: 668, w: 122, h: 150 },
  ],
  "frostpine-tundra": [
    { x: 236, y: 670, w: 124, h: 148 },
    { x: 348, y: 676, w: 116, h: 142 },
    { x: 556, y: 668, w: 122, h: 150 },
  ],
  "ember-hollow": [
    { x: 348, y: 670, w: 126, h: 148 },
    { x: 664, y: 668, w: 128, h: 150 },
    { x: 774, y: 668, w: 126, h: 150 },
  ],
  "ancient-heart": [
    { x: 20, y: 688, w: 116, h: 132 },
    { x: 236, y: 670, w: 124, h: 148 },
    { x: 348, y: 670, w: 126, h: 148 },
  ],
};

const SHARED_ROCK_RECTS = [
  { x: 24, y: 872, w: 82, h: 94 },
  { x: 99, y: 860, w: 94, h: 108 },
  { x: 184, y: 846, w: 114, h: 126 },
  { x: 280, y: 838, w: 116, h: 136 },
];

const SHARED_RUIN_RECTS = [
  { x: 405, y: 866, w: 96, h: 118 },
  { x: 490, y: 856, w: 140, h: 130 },
  { x: 618, y: 856, w: 88, h: 130 },
  { x: 700, y: 852, w: 92, h: 136 },
  { x: 780, y: 846, w: 104, h: 142 },
  { x: 872, y: 846, w: 126, h: 142 },
];

const BIOME_PROP_RECTS = {
  "mossy-ruins": {
    bridges: [
      { x: 1024, y: 82, w: 120, h: 128 },
      { x: 1142, y: 78, w: 108, h: 134 },
    ],
    lanterns: [{ x: 1398, y: 72, w: 84, h: 140 }],
    signposts: [{ x: 1335, y: 84, w: 78, h: 124 }],
  },
  "moonlit-marsh": {
    bridges: [
      { x: 1012, y: 76, w: 122, h: 136 },
      { x: 1126, y: 76, w: 104, h: 138 },
      { x: 1216, y: 76, w: 116, h: 136 },
    ],
    lanterns: [{ x: 1302, y: 70, w: 104, h: 146 }],
    signposts: [{ x: 1390, y: 84, w: 82, h: 124 }],
  },
  "frostpine-tundra": {
    bridges: [
      { x: 1012, y: 78, w: 112, h: 136 },
      { x: 1122, y: 74, w: 104, h: 142 },
      { x: 1210, y: 78, w: 110, h: 138 },
    ],
    lanterns: [{ x: 1296, y: 68, w: 102, h: 150 }],
    signposts: [{ x: 1380, y: 82, w: 86, h: 130 }],
  },
  "ember-hollow": {
    bridges: [
      { x: 1016, y: 78, w: 112, h: 132 },
      { x: 1120, y: 74, w: 112, h: 138 },
      { x: 1210, y: 74, w: 116, h: 140 },
    ],
    lanterns: [{ x: 1304, y: 68, w: 98, h: 148 }],
    signposts: [{ x: 1386, y: 82, w: 84, h: 128 }],
  },
  "ancient-heart": {
    bridges: [
      { x: 1010, y: 76, w: 114, h: 138 },
      { x: 1122, y: 72, w: 98, h: 144 },
      { x: 1206, y: 76, w: 118, h: 138 },
    ],
    lanterns: [{ x: 1298, y: 68, w: 102, h: 150 }],
    signposts: [{ x: 1384, y: 76, w: 88, h: 136 }],
  },
};

const FLOOR_SOURCE_RECTS = {
  ground: [
    { x: 25, y: 99, w: 76, h: 78 },
    { x: 110, y: 99, w: 74, h: 78 },
    { x: 197, y: 99, w: 72, h: 78 },
    { x: 282, y: 99, w: 74, h: 78 },
    { x: 370, y: 99, w: 74, h: 78 },
    { x: 456, y: 99, w: 76, h: 78 },
    { x: 548, y: 99, w: 72, h: 78 },
    { x: 635, y: 99, w: 72, h: 78 },
    { x: 722, y: 99, w: 73, h: 78 },
    { x: 807, y: 99, w: 74, h: 78 },
    { x: 894, y: 99, w: 80, h: 78 },
  ],
  path: [
    { x: 25, y: 220, w: 74, h: 78 },
    { x: 110, y: 220, w: 74, h: 78 },
    { x: 197, y: 220, w: 72, h: 78 },
    { x: 282, y: 220, w: 74, h: 78 },
    { x: 370, y: 220, w: 74, h: 78 },
    { x: 456, y: 220, w: 76, h: 78 },
    { x: 548, y: 220, w: 72, h: 78 },
    { x: 635, y: 220, w: 72, h: 78 },
    { x: 722, y: 220, w: 73, h: 78 },
    { x: 807, y: 220, w: 74, h: 78 },
  ],
  liquid: [
    { x: 25, y: 344, w: 74, h: 78 },
    { x: 110, y: 344, w: 74, h: 78 },
    { x: 197, y: 344, w: 72, h: 78 },
    { x: 282, y: 344, w: 74, h: 78 },
  ],
};

const BIOME_FLOOR_SELECTIONS = {
  "mossy-ruins": {
    natural: [0, 1, 2, 9],
    stone: [3, 4, 5, 6, 7, 8],
    path: [0, 1, 2, 4, 5, 7],
    liquid: [0, 1],
  },
  "moonlit-marsh": {
    natural: [0, 1, 2, 3, 8, 9],
    stone: [4, 5, 6],
    path: [0, 1, 2, 4, 5, 7],
    liquid: [0, 1],
  },
  "frostpine-tundra": {
    natural: [0, 1, 2, 3, 8, 9],
    stone: [4, 5, 6, 7],
    path: [0, 1, 2, 4, 5, 7],
    liquid: [0, 1],
  },
  "ember-hollow": {
    natural: [0, 1, 2, 3, 4, 8],
    stone: [5, 6, 7],
    path: [0, 1, 2, 4, 5, 7],
    liquid: [0, 1],
  },
  "ancient-heart": {
    natural: [0, 1, 2, 8, 9],
    stone: [3, 4, 5, 6, 7],
    path: [0, 1, 2, 4, 5, 7],
    liquid: [0, 1],
  },
  "blighted-woods": {
    natural: [0, 1, 2, 3, 6, 8],
    stone: [4, 5, 7],
    path: [0, 1, 2, 4, 5, 7],
    liquid: [0, 1],
  },
};

const atlasState = {
  ready: false,
  failed: false,
  revision: 0,
  images: {},
  biomeArt: {},
  terrainFloors: {},
  aylaFrames: null,
  aylaPortrait: null,
};

const AYLA_FRAME_RECTS = {
  walkDown: [
    { x: 16, y: 14, w: 92, h: 188 },
    { x: 136, y: 14, w: 92, h: 188 },
    { x: 258, y: 14, w: 92, h: 188 },
    { x: 378, y: 14, w: 92, h: 188 },
  ],
  cast: [
    { x: 542, y: 18, w: 112, h: 182 },
    { x: 664, y: 18, w: 118, h: 182 },
    { x: 792, y: 18, w: 144, h: 182 },
  ],
  walkLeft: [
    { x: 16, y: 226, w: 102, h: 188 },
    { x: 138, y: 226, w: 102, h: 188 },
    { x: 258, y: 226, w: 104, h: 188 },
    { x: 378, y: 226, w: 104, h: 188 },
  ],
  dash: [
    { x: 566, y: 238, w: 126, h: 164 },
    { x: 692, y: 238, w: 132, h: 164 },
    { x: 824, y: 238, w: 148, h: 164 },
  ],
  walkRight: [
    { x: 18, y: 428, w: 102, h: 178 },
    { x: 138, y: 428, w: 102, h: 178 },
    { x: 258, y: 428, w: 104, h: 178 },
    { x: 378, y: 428, w: 104, h: 178 },
  ],
  hurt: [
    { x: 560, y: 430, w: 126, h: 150 },
    { x: 686, y: 430, w: 126, h: 150 },
  ],
  death: [
    { x: 566, y: 704, w: 126, h: 170 },
    { x: 692, y: 704, w: 136, h: 170 },
    { x: 824, y: 704, w: 138, h: 170 },
  ],
  portrait: { x: 1068, y: 18, w: 370, h: 406 },
};
const AYLA_FIXED_FRAME_SIZE = 128;
const AYLA_FIXED_FRAME_RECTS = {
  walkDown: buildAylaFixedRow(0, 4),
  walkRight: buildAylaFixedRow(1, 4),
  walkLeft: buildAylaFixedRow(2, 4),
  walkUp: buildAylaFixedRow(3, 4),
  cast: [buildAylaFixedCell(4, 0), buildAylaFixedCell(4, 1)],
  dash: [buildAylaFixedCell(4, 2)],
  hurt: [buildAylaFixedCell(4, 3)],
  death: [buildAylaFixedCell(4, 4)],
};

if (typeof window !== "undefined" && typeof Image !== "undefined") {
  loadAtlases();
}

export function getAtlasRevision() {
  return atlasState.revision;
}

export function atlasesReady() {
  return atlasState.ready;
}

export function getBiomeArt(sceneStyle) {
  const atlasKey = SCENE_ATLAS_KEYS[sceneStyle];
  if (!atlasKey || !atlasState.ready) return null;
  return atlasState.biomeArt[atlasKey] || null;
}

export function getAylaPortrait() {
  return atlasState.aylaPortrait;
}

export function getBiomeFloorTexture(sceneStyle, ground, variant = 0) {
  if (!ATLAS_FLOOR_TEXTURES_ENABLED || !atlasState.ready) return null;
  const generatedFloor = getGeneratedFloorTexture(sceneStyle, ground, variant);
  if (generatedFloor) return generatedFloor;

  const atlasKey = FLOOR_SCENE_ATLAS_KEYS[sceneStyle];
  const floorArt = atlasKey ? atlasState.biomeArt[atlasKey]?.floors : null;
  if (!floorArt) return null;

  const bucket =
    ground === "water" || ground === "ice" || ground === "ember"
      ? floorArt.liquid
      : ground === "path" ||
          ground === "ashPath" ||
          ground === "snowPath" ||
          ground === "planks" ||
          ground === "soil"
        ? floorArt.path
        : ground === "ruinStone"
          ? floorArt.stone
          : floorArt.natural;

  return bucket.length > 0 ? bucket[variant % bucket.length] : null;
}

function getGeneratedFloorTexture(sceneStyle, ground, variant) {
  const row = TERRAIN_SCENE_ROWS[sceneStyle];
  if (row === undefined) return null;
  const material = getTerrainMaterial(ground);
  const bucket = atlasState.terrainFloors[row]?.[material];
  return bucket?.length ? bucket[variant % bucket.length] : null;
}

function getTerrainMaterial(ground) {
  if (ground === "water" || ground === "ice") return "liquid";
  if (ground === "path" || ground === "ashPath" || ground === "snowPath") return "path";
  if (ground === "soil") return "soil";
  if (ground === "planks") return "planks";
  if (ground === "ruinStone") return "stone";
  if (ground === "ash" || ground === "ember" || ground === "blight") return "special";
  return "natural";
}

export function drawAylaAtlasSprite(ctx, x, y, facing, frame, pose, options = {}) {
  if (!ATLAS_PLAYER_ENABLED) return false;
  if (!atlasState.aylaFrames) return false;

  const frameCanvas = pickAylaFrame(facing, frame, pose);
  if (!frameCanvas) return false;

  drawSpriteCanvas(ctx, frameCanvas, x, y, {
    anchorX: 0.5,
    anchorY: 0.97,
    scale: options.scale || 0.58,
    alpha: options.alpha ?? 1,
    tint: options.tint || null,
    tintAlpha: options.tintAlpha ?? 0.7,
  });
  return true;
}

export function drawBiomeProp(ctx, sceneStyle, type, x, y, options = {}) {
  if (!ATLAS_WORLD_ART_ENABLED) return false;
  const atlasKey = SCENE_ATLAS_KEYS[sceneStyle];
  if (!atlasKey || DISABLED_WORLD_ATLASES.has(atlasKey)) return false;
  const art = getBiomeArt(sceneStyle);
  if (!art) return false;
  if (type === "bridge") return false;

  const bucket =
    type === "tree"
      ? art.sprites.trees
      : type === "rock" || type === "iceRock"
        ? art.sprites.rocks
        : type === "ruin"
          ? art.sprites.ruins
      : type === "bridge"
        ? art.sprites.bridges
        : type === "signpost"
          ? art.sprites.signposts
          : type === "lantern"
            ? art.sprites.lanterns
            : null;

  if (!bucket || bucket.length === 0) return false;
  const sprite = bucket[(options.variant ?? 0) % bucket.length] || bucket[0];
  if (!sprite) return false;

  drawSpriteCanvas(ctx, sprite, x, y, {
    anchorX: 0.5,
    anchorY: options.anchorY ?? 1,
    scale: options.scale || 1,
    alpha: options.alpha ?? 1,
  });
  return true;
}

export function getBiomePattern(sceneStyle, ground, variant = 0) {
  if (!ATLAS_TILE_PATTERNS_ENABLED) return null;
  if (!ATLAS_WORLD_ART_ENABLED) return null;
  const art = getBiomeArt(sceneStyle);
  if (!art) return null;

  const bucket =
    ground === "path" || ground === "soil" || ground === "planks" || ground === "ashPath" || ground === "snowPath"
      ? art.patterns.path
      : ground === "water" || ground === "ice"
        ? art.patterns.water
        : ground === "ruinStone"
          ? art.patterns.ruin
          : ground === "ember" || ground === "emberGrass" || ground === "ash"
            ? art.patterns.ember
            : ground === "blight"
              ? art.patterns.blight
              : art.patterns.ground;

  return bucket.length > 0 ? bucket[variant % bucket.length] : null;
}

function loadAtlases() {
  const entries = Object.entries(ATLAS_PATHS);
  Promise.all(entries.map(([key, path]) => loadImage(key, path)))
    .then((loaded) => {
      atlasState.images = Object.fromEntries(loaded.map((entry) => [entry.key, entry.image]));
      atlasState.aylaFrames =
        buildFixedAylaFrames(atlasState.images.aylaV3) ||
        buildFixedAylaFrames(atlasState.images.aylaV2) ||
        buildAylaFrames(atlasState.images.ayla);
      atlasState.aylaPortrait = extractSprite(atlasState.images.ayla, AYLA_FRAME_RECTS.portrait, {
        trim: true,
        component: "cluster",
        padding: 6,
      });
      atlasState.terrainFloors = buildGeneratedTerrainFloors(atlasState.images.terrain);

      for (const key of Object.keys(SCENE_ATLAS_KEYS)) {
        const atlasKey = SCENE_ATLAS_KEYS[key];
        if (!atlasState.biomeArt[atlasKey] && atlasKey !== "verdant-grove") {
          atlasState.biomeArt[atlasKey] = buildBiomeArt(atlasState.images[atlasKey], atlasKey);
        }
      }

      atlasState.ready = true;
      atlasState.failed = false;
      atlasState.revision += 1;
    })
    .catch(() => {
      atlasState.failed = true;
    });
}

function buildGeneratedTerrainFloors(image) {
  if (!image) return {};
  const floors = {};
  for (const row of Object.values(TERRAIN_SCENE_ROWS)) {
    if (floors[row]) continue;
    floors[row] = {};
    for (const [material, materialIndex] of Object.entries(TERRAIN_MATERIAL_INDEX)) {
      floors[row][material] = [];
      for (let variant = 0; variant < TERRAIN_VARIANTS; variant += 1) {
        const canvas = document.createElement("canvas");
        canvas.width = TERRAIN_CELL_W;
        canvas.height = TERRAIN_CELL_H;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          image,
          (materialIndex * TERRAIN_VARIANTS + variant) * TERRAIN_CELL_W,
          row * TERRAIN_CELL_H,
          TERRAIN_CELL_W,
          TERRAIN_CELL_H,
          0,
          0,
          TERRAIN_CELL_W,
          TERRAIN_CELL_H
        );
        floors[row][material].push(canvas);
      }
    }
  }
  return floors;
}

function loadImage(key, path) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ key, image });
    image.onerror = reject;
    image.src = path;
  });
}

function buildAylaFrames(image) {
  return {
    walkDown: AYLA_FRAME_RECTS.walkDown.map((rect) =>
      extractSprite(image, rect, { trim: true, component: "largest", padding: 4 })
    ),
    walkLeft: AYLA_FRAME_RECTS.walkLeft.map((rect) =>
      extractSprite(image, rect, { trim: true, component: "largest", padding: 4 })
    ),
    walkRight: AYLA_FRAME_RECTS.walkRight.map((rect) =>
      extractSprite(image, rect, { trim: true, component: "largest", padding: 4 })
    ),
    cast: AYLA_FRAME_RECTS.cast.map((rect) =>
      extractSprite(image, rect, { trim: true, component: "largest", padding: 4 })
    ),
    dash: AYLA_FRAME_RECTS.dash.map((rect) =>
      extractSprite(image, rect, { trim: true, component: "largest", padding: 4 })
    ),
    hurt: AYLA_FRAME_RECTS.hurt.map((rect) =>
      extractSprite(image, rect, { trim: true, component: "largest", padding: 4 })
    ),
    death: AYLA_FRAME_RECTS.death.map((rect) =>
      extractSprite(image, rect, { trim: true, component: "largest", padding: 4 })
    ),
  };
}

function buildAylaFixedCell(row, column) {
  return {
    x: column * AYLA_FIXED_FRAME_SIZE,
    y: row * AYLA_FIXED_FRAME_SIZE,
    w: AYLA_FIXED_FRAME_SIZE,
    h: AYLA_FIXED_FRAME_SIZE,
  };
}

function buildAylaFixedRow(row, count) {
  return Array.from({ length: count }, (_, column) => buildAylaFixedCell(row, column));
}

function extractFixedAylaFrame(image, rect) {
  return extractSprite(image, rect, { trim: false, padding: 0 });
}

function buildFixedAylaFrames(image) {
  if (!image) return null;
  return {
    walkDown: AYLA_FIXED_FRAME_RECTS.walkDown.map((rect) => extractFixedAylaFrame(image, rect)),
    walkLeft: AYLA_FIXED_FRAME_RECTS.walkLeft.map((rect) => extractFixedAylaFrame(image, rect)),
    walkRight: AYLA_FIXED_FRAME_RECTS.walkRight.map((rect) => extractFixedAylaFrame(image, rect)),
    walkUp: AYLA_FIXED_FRAME_RECTS.walkUp.map((rect) => extractFixedAylaFrame(image, rect)),
    cast: AYLA_FIXED_FRAME_RECTS.cast.map((rect) => extractFixedAylaFrame(image, rect)),
    dash: AYLA_FIXED_FRAME_RECTS.dash.map((rect) => extractFixedAylaFrame(image, rect)),
    hurt: AYLA_FIXED_FRAME_RECTS.hurt.map((rect) => extractFixedAylaFrame(image, rect)),
    death: AYLA_FIXED_FRAME_RECTS.death.map((rect) => extractFixedAylaFrame(image, rect)),
  };
}

function buildBiomeArt(image, atlasKey) {
  if (!image) return null;
  const propRects = BIOME_PROP_RECTS[atlasKey];
  const floorSelections = BIOME_FLOOR_SELECTIONS[atlasKey];
  if (!propRects && !floorSelections) return null;

  return {
    floors: floorSelections ? buildBiomeFloorArt(image, floorSelections) : null,
    patterns: {
      ground: buildPatternRow(image, { x: 28, y: 78, step: 66, count: 6 }),
      path: buildPatternRow(image, { x: 28, y: 188, step: 66, count: 6 }),
      water: buildPatternRow(image, { x: 28, y: 298, step: 84, count: 3 }),
      ember: buildPatternRow(image, { x: 158, y: 78, step: 66, count: 4 }),
      ruin: buildPatternRow(image, { x: 284, y: 188, step: 66, count: 4 }),
      blight: buildPatternRow(image, { x: 410, y: 78, step: 66, count: 4 }),
    },
    sprites: {
      trees: propRects ? extractBiomeSprites(image, BIOME_TREE_RECTS[atlasKey], "largest") : [],
      rocks: propRects ? extractBiomeSprites(image, SHARED_ROCK_RECTS, "largest") : [],
      ruins: propRects ? extractBiomeSprites(image, SHARED_RUIN_RECTS, "largest") : [],
      bridges: [],
      lanterns: propRects ? extractBiomeSprites(image, propRects.lanterns, "cluster") : [],
      fences: [],
      signposts: propRects ? extractBiomeSprites(image, propRects.signposts, "largest") : [],
      details: [],
    },
  };
}

function buildBiomeFloorArt(image, selections) {
  return {
    natural: buildFloorBucket(image, FLOOR_SOURCE_RECTS.ground, selections.natural),
    stone: buildFloorBucket(image, FLOOR_SOURCE_RECTS.ground, selections.stone),
    path: buildFloorBucket(image, FLOOR_SOURCE_RECTS.path, selections.path),
    liquid: buildFloorBucket(image, FLOOR_SOURCE_RECTS.liquid, selections.liquid),
  };
}

function buildFloorBucket(image, sourceRects, selection) {
  return selection
    .map((index) => sourceRects[index])
    .filter(Boolean)
    .map((rect) => extractFloorTexture(image, rect));
}

function extractFloorTexture(image, rect) {
  const insetX = Math.max(8, Math.round(rect.w * 0.16));
  const insetY = Math.max(8, Math.round(rect.h * 0.16));
  const canvas = document.createElement("canvas");
  canvas.width = 24;
  canvas.height = 12;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    image,
    rect.x + insetX,
    rect.y + insetY,
    rect.w - insetX * 2,
    rect.h - insetY * 2,
    0,
    0,
    canvas.width,
    canvas.height
  );
  return canvas;
}

function extractBiomeSprites(image, rects, component) {
  return rects
    .map((rect) =>
      extractSprite(image, rect, {
        trim: true,
        component,
        padding: 3,
        mask: "sheet",
      })
    )
    .filter((sprite) => sprite && sprite.width > 4 && sprite.height > 4);
}

function buildPatternRow(image, layout) {
  const patterns = [];
  for (let index = 0; index < layout.count; index += 1) {
    patterns.push(extractPatternTile(image, layout.x + layout.step * index, layout.y, 54, 54));
  }
  return patterns;
}

function extractPatternTile(image, sx, sy, sw, sh) {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, 32, 32);
  return canvas;
}

function extractSprite(image, rect, options = {}) {
  const source = document.createElement("canvas");
  source.width = rect.w;
  source.height = rect.h;
  const sourceCtx = source.getContext("2d");
  sourceCtx.imageSmoothingEnabled = false;
  sourceCtx.drawImage(image, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);

  const data = sourceCtx.getImageData(0, 0, rect.w, rect.h);
  if (options.mask === "sheet") {
    removeSheetBackground(data);
  } else {
    const keyColor = sampleKeyColor(data, rect.w, rect.h);
    removeKeyedBackground(data, keyColor);
  }
  sourceCtx.putImageData(data, 0, 0);

  const padding = options.padding ?? 3;

  if (options.component === "largest") {
    const isolated = isolateLargestComponent(source, padding);
    if (isolated) {
      return options.trim === false ? isolated : trimCanvas(isolated, padding);
    }
  }

  if (options.component === "cluster") {
    const clustered = isolatePrimaryCluster(source, padding);
    if (clustered) {
      return options.trim === false ? clustered : trimCanvas(clustered, padding);
    }
  }

  if (!options.trim) {
    return source;
  }

  return trimCanvas(source, padding);
}

function sampleKeyColor(imageData, width, height) {
  const points = [
    0,
    width - 1,
    (height - 1) * width,
    height * width - 1,
  ];
  let r = 0;
  let g = 0;
  let b = 0;

  for (const point of points) {
    r += imageData.data[point * 4];
    g += imageData.data[point * 4 + 1];
    b += imageData.data[point * 4 + 2];
  }

  return {
    r: r / points.length,
    g: g / points.length,
    b: b / points.length,
  };
}

function removeKeyedBackground(imageData, keyColor) {
  const { data, width, height } = imageData;
  const visited = new Uint8Array(width * height);
  const queue = [];
  const brightness = (keyColor.r + keyColor.g + keyColor.b) / 3;
  const threshold = brightness < 70 ? 28 : brightness > 160 ? 68 : 40;

  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    visited[idx] = 1;
    if (!matchesKeyColor(data, idx * 4, keyColor, threshold)) return;
    queue.push(idx);
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }

  for (let y = 1; y < height - 1; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (queue.length > 0) {
    const idx = queue.pop();
    const px = idx % width;
    const py = Math.floor(idx / width);
    data[idx * 4 + 3] = 0;

    enqueue(px + 1, py);
    enqueue(px - 1, py);
    enqueue(px, py + 1);
    enqueue(px, py - 1);
  }
}

function removeSheetBackground(imageData) {
  const { data, width, height } = imageData;
  const keyColor = sampleSheetBackground(imageData);
  const seedMask = new Uint8Array(width * height);
  const grownMask = new Uint8Array(width * height);
  const keyBrightness = Math.max(keyColor.r, keyColor.g, keyColor.b);

  for (let index = 0; index < width * height; index += 1) {
    const offset = index * 4;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const dr = Math.abs(r - keyColor.r);
    const dg = Math.abs(g - keyColor.g);
    const db = Math.abs(b - keyColor.b);
    const distance = dr + dg + db;
    const maxDiff = Math.max(dr, dg, db);
    const brightness = Math.max(r, g, b);

    if ((maxDiff >= 18 && distance >= 34) || brightness >= keyBrightness + 26) {
      seedMask[index] = 1;
    }
  }

  const radius = 1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (!seedMask[index]) continue;
      for (let oy = -radius; oy <= radius; oy += 1) {
        for (let ox = -radius; ox <= radius; ox += 1) {
          const nx = x + ox;
          const ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          grownMask[ny * width + nx] = 1;
        }
      }
    }
  }

  for (let index = 0; index < width * height; index += 1) {
    const offset = index * 4;
    const dr = Math.abs(data[offset] - keyColor.r);
    const dg = Math.abs(data[offset + 1] - keyColor.g);
    const db = Math.abs(data[offset + 2] - keyColor.b);
    const distance = dr + dg + db;
    const maxDiff = Math.max(dr, dg, db);
    const brightness = Math.max(data[offset], data[offset + 1], data[offset + 2]);
    const outlinePixel = maxDiff >= 5 && distance >= 10;

    if (!grownMask[index] || (!seedMask[index] && !outlinePixel && brightness < keyBrightness + 7)) {
      data[offset + 3] = 0;
    }
  }
}

function sampleSheetBackground(imageData) {
  const { data, width, height } = imageData;
  const samples = [];
  const inset = Math.min(4, Math.floor(Math.min(width, height) / 4));

  for (let x = inset; x < width - inset; x += Math.max(1, Math.floor(width / 12))) {
    samples.push(getPixel(data, width, x, inset));
    samples.push(getPixel(data, width, x, height - inset - 1));
  }
  for (let y = inset; y < height - inset; y += Math.max(1, Math.floor(height / 12))) {
    samples.push(getPixel(data, width, inset, y));
    samples.push(getPixel(data, width, width - inset - 1, y));
  }

  samples.sort((a, b) => a.brightness - b.brightness);
  const darkSamples = samples.slice(0, Math.max(4, Math.ceil(samples.length * 0.45)));
  return {
    r: median(darkSamples.map((sample) => sample.r)),
    g: median(darkSamples.map((sample) => sample.g)),
    b: median(darkSamples.map((sample) => sample.b)),
  };
}

function getPixel(data, width, x, y) {
  const offset = (y * width + x) * 4;
  const r = data[offset];
  const g = data[offset + 1];
  const b = data[offset + 2];
  return { r, g, b, brightness: Math.max(r, g, b) };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] || 0;
}

function matchesKeyColor(data, offset, keyColor, threshold) {
  if (data[offset + 3] === 0) return false;
  const dr = Math.abs(data[offset] - keyColor.r);
  const dg = Math.abs(data[offset + 1] - keyColor.g);
  const db = Math.abs(data[offset + 2] - keyColor.b);
  const distance = dr + dg + db;
  const maxDiff = Math.max(dr, dg, db);
  return maxDiff <= threshold && distance <= threshold * 2.35;
}

function isolateLargestComponent(canvas, padding = 0) {
  const components = collectOpaqueComponents(canvas);
  if (components.length === 0) return null;
  const best = components.reduce((largest, component) => (component.count > largest.count ? component : largest));
  return cropBounds(canvas, best, padding);
}

function isolatePrimaryCluster(canvas, padding = 0) {
  const components = collectOpaqueComponents(canvas);
  if (components.length === 0) return null;

  const ordered = [...components].sort((a, b) => b.count - a.count);
  const included = new Set([ordered[0].id]);
  let cluster = { ...ordered[0] };
  let changed = true;

  while (changed) {
    changed = false;
    for (const component of ordered) {
      if (included.has(component.id) || component.count < 6) continue;
      const gapX = getAxisGap(component.minX, component.maxX, cluster.minX, cluster.maxX);
      const gapY = getAxisGap(component.minY, component.maxY, cluster.minY, cluster.maxY);
      if (gapX <= 16 && gapY <= 18) {
        included.add(component.id);
        cluster = {
          id: cluster.id,
          count: cluster.count + component.count,
          minX: Math.min(cluster.minX, component.minX),
          minY: Math.min(cluster.minY, component.minY),
          maxX: Math.max(cluster.maxX, component.maxX),
          maxY: Math.max(cluster.maxY, component.maxY),
        };
        changed = true;
      }
    }
  }

  return cropBounds(canvas, cluster, padding);
}

function collectOpaqueComponents(canvas) {
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;
  const visited = new Uint8Array(width * height);
  const components = [];

  const getAlpha = (x, y) => data[(y * width + x) * 4 + 3];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const startIndex = y * width + x;
      if (visited[startIndex] || getAlpha(x, y) === 0) continue;

      const queue = [startIndex];
      visited[startIndex] = 1;
      let count = 0;
      let minX = x;
      let minY = y;
      let maxX = x;
      let maxY = y;

      while (queue.length > 0) {
        const index = queue.pop();
        const px = index % width;
        const py = Math.floor(index / width);
        count += 1;
        minX = Math.min(minX, px);
        minY = Math.min(minY, py);
        maxX = Math.max(maxX, px);
        maxY = Math.max(maxY, py);

        const neighbors = [
          [px + 1, py],
          [px - 1, py],
          [px, py + 1],
          [px, py - 1],
          [px + 1, py + 1],
          [px + 1, py - 1],
          [px - 1, py + 1],
          [px - 1, py - 1],
        ];

        for (const [nx, ny] of neighbors) {
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const neighborIndex = ny * width + nx;
          if (visited[neighborIndex] || getAlpha(nx, ny) === 0) continue;
          visited[neighborIndex] = 1;
          queue.push(neighborIndex);
        }
      }

      components.push({ id: components.length, count, minX, minY, maxX, maxY });
    }
  }

  return components;
}

function cropBounds(canvas, bounds, padding = 0) {
  const sx = Math.max(0, bounds.minX - padding);
  const sy = Math.max(0, bounds.minY - padding);
  const sw = Math.min(canvas.width - sx, bounds.maxX - bounds.minX + 1 + padding * 2);
  const sh = Math.min(canvas.height - sy, bounds.maxY - bounds.minY + 1 + padding * 2);

  const isolated = document.createElement("canvas");
  isolated.width = sw;
  isolated.height = sh;
  const isolatedCtx = isolated.getContext("2d");
  isolatedCtx.imageSmoothingEnabled = false;
  isolatedCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
  return isolated;
}

function getAxisGap(minA, maxA, minB, maxB) {
  if (maxA < minB) return minB - maxA;
  if (maxB < minA) return minA - maxB;
  return 0;
}

function trimCanvas(canvas, padding = 0) {
  const ctx = canvas.getContext("2d");
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = 0;
  let maxY = 0;
  let found = false;

  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const alpha = data[(y * canvas.width + x) * 4 + 3];
      if (alpha <= 0) continue;
      found = true;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (!found) return canvas;

  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(canvas.width - 1, maxX + padding);
  maxY = Math.min(canvas.height - 1, maxY + padding);

  const trimmed = document.createElement("canvas");
  trimmed.width = maxX - minX + 1;
  trimmed.height = maxY - minY + 1;
  const trimmedCtx = trimmed.getContext("2d");
  trimmedCtx.imageSmoothingEnabled = false;
  trimmedCtx.drawImage(
    canvas,
    minX,
    minY,
    trimmed.width,
    trimmed.height,
    0,
    0,
    trimmed.width,
    trimmed.height
  );
  return trimmed;
}

function drawSpriteCanvas(ctx, sprite, x, y, options = {}) {
  const anchorX = options.anchorX ?? 0.5;
  const anchorY = options.anchorY ?? 1;
  const scale = options.scale || 1;
  const drawWidth = sprite.width * scale;
  const drawHeight = sprite.height * scale;
  const left = Math.round(x - drawWidth * anchorX);
  const top = Math.round(y - drawHeight * anchorY);

  ctx.save();
  ctx.globalAlpha = options.alpha ?? 1;
  ctx.drawImage(sprite, left, top, Math.round(drawWidth), Math.round(drawHeight));

  if (options.tint) {
    ctx.globalCompositeOperation = "source-atop";
    ctx.globalAlpha = options.tintAlpha ?? 0.6;
    ctx.fillStyle = options.tint;
    ctx.fillRect(left, top, Math.round(drawWidth), Math.round(drawHeight));
  }

  ctx.restore();
}

function pickAylaFrame(facing, frame, pose) {
  if (!atlasState.aylaFrames) return null;

  if (pose === "dash") {
    return atlasState.aylaFrames.dash[frame % atlasState.aylaFrames.dash.length];
  }

  if (pose === "cast" || pose === "attack") {
    return atlasState.aylaFrames.cast[frame % atlasState.aylaFrames.cast.length];
  }

  if (pose === "stun" || pose === "hurt") {
    return atlasState.aylaFrames.hurt[frame % atlasState.aylaFrames.hurt.length];
  }

  if (pose === "death") {
    return atlasState.aylaFrames.death[frame % atlasState.aylaFrames.death.length];
  }

  if (facing === "left") {
    return atlasState.aylaFrames.walkLeft[frame % atlasState.aylaFrames.walkLeft.length];
  }

  if (facing === "right") {
    return atlasState.aylaFrames.walkRight[frame % atlasState.aylaFrames.walkRight.length];
  }

  if (facing === "up" && atlasState.aylaFrames.walkUp) {
    return atlasState.aylaFrames.walkUp[frame % atlasState.aylaFrames.walkUp.length];
  }

  return atlasState.aylaFrames.walkDown[frame % atlasState.aylaFrames.walkDown.length];
}

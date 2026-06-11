const ATLAS_PATHS = {
  ayla: "./assets/atlases/ayla-sprite.png",
  "blighted-woods": "./assets/atlases/blighted-woods.png",
  "ember-hollow": "./assets/atlases/ember-hollow.png",
  "frostpine-tundra": "./assets/atlases/frostpine-tundra.png",
  "moonlit-marsh": "./assets/atlases/moonlit-marsh.png",
  "mossy-ruins": "./assets/atlases/mossy-ruins.png",
  "ancient-heart": "./assets/atlases/ancient-heart.png",
  "verdant-grove": "./assets/atlases/verdant-grove.png",
};

const ATLAS_WORLD_ART_ENABLED = true;
const ATLAS_TILE_PATTERNS_ENABLED = false;
const ATLAS_PLAYER_ENABLED = false;

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

const atlasState = {
  ready: false,
  failed: false,
  revision: 0,
  images: {},
  biomeArt: {},
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
  if (type === "tree" && (sceneStyle === "blightedWoods" || sceneStyle === "hollowheartRuins")) {
    return false;
  }
  const art = getBiomeArt(sceneStyle);
  if (!art) return false;

  const bucket =
    type === "tree"
      ? art.sprites.trees
      : type === "bridge"
        ? art.sprites.bridges
        : type === "signpost"
          ? art.sprites.signposts
          : type === "lantern"
            ? art.sprites.lanterns
            : null;

  if (!bucket || bucket.length === 0) return false;
  const sprite = bucket[options.variant ?? 0] || bucket[0];
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
      atlasState.aylaFrames = buildAylaFrames(atlasState.images.ayla);
      atlasState.aylaPortrait = extractSprite(atlasState.images.ayla, AYLA_FRAME_RECTS.portrait, {
        trim: true,
        component: "cluster",
        padding: 6,
      });

      for (const key of Object.keys(SCENE_ATLAS_KEYS)) {
        const atlasKey = SCENE_ATLAS_KEYS[key];
        if (!atlasState.biomeArt[atlasKey]) {
          atlasState.biomeArt[atlasKey] = buildBiomeArt(atlasState.images[atlasKey]);
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

function buildBiomeArt(image) {
  if (!image) return null;

  return {
    patterns: {
      ground: buildPatternRow(image, { x: 28, y: 78, step: 66, count: 6 }),
      path: buildPatternRow(image, { x: 28, y: 188, step: 66, count: 6 }),
      water: buildPatternRow(image, { x: 28, y: 298, step: 84, count: 3 }),
      ember: buildPatternRow(image, { x: 158, y: 78, step: 66, count: 4 }),
      ruin: buildPatternRow(image, { x: 284, y: 188, step: 66, count: 4 }),
      blight: buildPatternRow(image, { x: 410, y: 78, step: 66, count: 4 }),
    },
    sprites: {
      trees: [
        extractSprite(image, { x: 28, y: 700, w: 96, h: 140 }, { trim: true, component: "cluster", padding: 3 }),
        extractSprite(image, { x: 132, y: 700, w: 98, h: 140 }, { trim: true, component: "cluster", padding: 3 }),
        extractSprite(image, { x: 238, y: 698, w: 106, h: 142 }, { trim: true, component: "cluster", padding: 3 }),
        extractSprite(image, { x: 346, y: 698, w: 106, h: 142 }, { trim: true, component: "cluster", padding: 3 }),
      ],
      rocks: [
        extractSprite(image, { x: 22, y: 868, w: 78, h: 92 }, { trim: true, component: "largest", padding: 3 }),
        extractSprite(image, { x: 102, y: 860, w: 112, h: 100 }, { trim: true, component: "largest", padding: 3 }),
        extractSprite(image, { x: 214, y: 856, w: 120, h: 104 }, { trim: true, component: "largest", padding: 3 }),
      ],
      ruins: [
        extractSprite(image, { x: 412, y: 838, w: 114, h: 128 }, { trim: true, component: "largest", padding: 3 }),
        extractSprite(image, { x: 528, y: 838, w: 104, h: 128 }, { trim: true, component: "largest", padding: 3 }),
        extractSprite(image, { x: 642, y: 838, w: 118, h: 128 }, { trim: true, component: "largest", padding: 3 }),
      ],
      bridges: [
        extractSprite(image, { x: 1028, y: 84, w: 108, h: 102 }, { trim: true, component: "largest", padding: 3 }),
        extractSprite(image, { x: 1134, y: 84, w: 112, h: 102 }, { trim: true, component: "largest", padding: 3 }),
      ],
      lanterns: [
        extractSprite(image, { x: 1360, y: 82, w: 58, h: 108 }, { trim: true, component: "largest", padding: 3 }),
      ],
      fences: [
        extractSprite(image, { x: 1008, y: 180, w: 126, h: 90 }, { trim: true, component: "largest", padding: 3 }),
        extractSprite(image, { x: 1134, y: 180, w: 132, h: 90 }, { trim: true, component: "largest", padding: 3 }),
      ],
      signposts: [
        extractSprite(image, { x: 1298, y: 82, w: 62, h: 108 }, { trim: true, component: "largest", padding: 3 }),
      ],
      details: [
        extractSprite(image, { x: 28, y: 548, w: 56, h: 82 }, { trim: true, component: "largest", padding: 2 }),
        extractSprite(image, { x: 116, y: 548, w: 74, h: 82 }, { trim: true, component: "largest", padding: 2 }),
        extractSprite(image, { x: 466, y: 548, w: 100, h: 82 }, { trim: true, component: "largest", padding: 2 }),
      ],
    },
  };
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
  const keyColor = sampleKeyColor(data, rect.w, rect.h);
  removeKeyedBackground(data, keyColor);
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

  return atlasState.aylaFrames.walkDown[frame % atlasState.aylaFrames.walkDown.length];
}

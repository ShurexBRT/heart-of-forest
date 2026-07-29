const textureCache = new Map();
const spriteCache = new Map();

export function resolveFacing(angle = 0) {
  const normal = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  if (normal >= Math.PI * 0.25 && normal < Math.PI * 0.75) return "down";
  if (normal >= Math.PI * 0.75 && normal < Math.PI * 1.25) return "left";
  if (normal >= Math.PI * 1.25 && normal < Math.PI * 1.75) return "up";
  return "right";
}

export function drawPixelSprite(ctx, sprite, x, y, options = {}) {
  if (!sprite) return;

  const {
    alpha = 1,
    tint = null,
    tintAlpha = 0.7,
    scale = 1,
  } = options;
  const width = sprite.canvas.width * scale;
  const height = sprite.canvas.height * scale;
  const drawX = Math.round(x - sprite.anchorX * scale);
  const drawY = Math.round(y - sprite.anchorY * scale);

  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.drawImage(sprite.canvas, drawX, drawY, width, height);

  if (tint) {
    ctx.globalCompositeOperation = "source-atop";
    ctx.globalAlpha *= tintAlpha;
    ctx.fillStyle = tint;
    ctx.fillRect(drawX, drawY, width, height);
  }

  ctx.restore();
}

export function getGroundTexture(ground, theme) {
  const key = `${ground}|${theme.groundBase}|${theme.groundDark}|${theme.groundMid}|${theme.groundLight}|${theme.grass}`;
  if (!textureCache.has(key)) {
    textureCache.set(key, buildGroundTexture(ground, theme));
  }
  return textureCache.get(key);
}

export function getActorSprite(palette, facing = "down", frame = 0, style = "ayla", pose = "idle") {
  const key = `${style}|${facing}|${frame}|${pose}|${palette.hood}|${palette.cloak}|${palette.accent}`;
  if (!spriteCache.has(key)) {
    spriteCache.set(key, buildActorSprite(palette, facing, frame, style, pose));
  }
  return spriteCache.get(key);
}

export function getEnemySprite(type, facing = "down", frame = 0, pose = "idle") {
  const key = `enemy|${type}|${facing}|${frame}|${pose}`;
  if (!spriteCache.has(key)) {
    spriteCache.set(key, buildEnemySprite(type, facing, frame, pose));
  }
  return spriteCache.get(key);
}

export function getBossSprite(frame = 0, pose = "idle") {
  const key = `boss|${frame}|${pose}`;
  if (!spriteCache.has(key)) {
    spriteCache.set(key, buildBossSprite(frame, pose));
  }
  return spriteCache.get(key);
}

export function getProjectileSprite(type) {
  const key = `projectile|${type}`;
  if (!spriteCache.has(key)) {
    spriteCache.set(key, buildProjectileSprite(type));
  }
  return spriteCache.get(key);
}

function buildGroundTexture(ground, theme) {
  const canvas = createCanvas(24, 24);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const fill = (color) => px(ctx, 0, 0, 24, 24, color);
  const speckle = (list) => {
    for (const entry of list) {
      px(ctx, entry[0], entry[1], entry[2] || 2, entry[3] || 2, entry[4]);
    }
  };

  if (ground === "path") {
    fill("#92784d");
    speckle([
      [1, 2, 6, 2, "#c6ab78"],
      [10, 5, 4, 2, "#a38858"],
      [17, 3, 5, 2, "#d1b98a"],
      [4, 12, 5, 2, "#7a603c"],
      [14, 11, 7, 2, "#b19466"],
      [2, 20, 6, 2, "#6a5232"],
      [12, 18, 9, 2, "#c9b383"],
    ]);
    return canvas;
  }

  if (ground === "planks") {
    fill("#7f6541");
    for (let y = 0; y < 24; y += 6) {
      px(ctx, 0, y, 24, 1, "#d3b27c");
      px(ctx, 0, y + 4, 24, 1, "#553d24");
    }
    for (let x = 4; x < 24; x += 8) {
      px(ctx, x, 0, 1, 24, "#5c4328");
    }
    return canvas;
  }

  if (ground === "soil") {
    fill("#6c4e38");
    speckle([
      [2, 3, 5, 3, "#8e6c4f"],
      [10, 1, 6, 2, "#5a3f2d"],
      [15, 9, 5, 3, "#9b7a57"],
      [3, 13, 8, 3, "#503828"],
      [14, 17, 7, 3, "#856448"],
      [1, 20, 5, 2, "#a17c56"],
    ]);
    return canvas;
  }

  if (ground === "ash" || ground === "ashPath") {
    fill(ground === "ashPath" ? "#75604f" : "#5b453b");
    speckle([
      [1, 2, 5, 2, "#917867"],
      [10, 4, 7, 2, "#49352d"],
      [18, 8, 4, 3, "#a9907d"],
      [4, 12, 6, 3, "#3e2d27"],
      [12, 17, 8, 2, "#8b7260"],
    ]);
    if (ground === "ash") {
      px(ctx, 19, 3, 2, 2, "#f39b63");
      px(ctx, 6, 18, 2, 2, "#df7a43");
    }
    return canvas;
  }

  if (ground === "water") {
    fill("#2c6b68");
    for (let y = 2; y < 24; y += 6) {
      px(ctx, 2, y, 8, 1, "#4f9b9d");
      px(ctx, 13, y + 2, 7, 1, "#8ad2cf");
    }
    px(ctx, 6, 8, 4, 1, "#173a46");
    px(ctx, 15, 17, 5, 1, "#173a46");
    return canvas;
  }

  if (ground === "ice") {
    fill("#8db8d9");
    speckle([
      [2, 4, 8, 1, "#dff5ff"],
      [12, 3, 7, 1, "#bddaea"],
      [5, 11, 10, 1, "#dff5ff"],
      [14, 16, 6, 1, "#a7cadf"],
      [3, 20, 12, 1, "#edfaff"],
    ]);
    return canvas;
  }

  if (ground === "snow" || ground === "snowPath") {
    fill(ground === "snowPath" ? "#c7d0da" : "#dde8f1");
    speckle([
      [2, 4, 2, 2, "#f7fcff"],
      [8, 8, 2, 2, "#b8c9d6"],
      [14, 5, 2, 2, "#f8fdff"],
      [18, 11, 2, 2, "#c4d7e5"],
      [6, 18, 2, 2, "#ffffff"],
      [16, 19, 2, 2, "#b7c5d1"],
    ]);
    return canvas;
  }

  if (ground === "emberGrass" || ground === "ember") {
    fill(ground === "ember" ? "#974e35" : "#5b362d");
    speckle([
      [2, 3, 3, 2, "#7f4936"],
      [7, 8, 2, 2, "#d1764e"],
      [12, 6, 4, 2, "#6e3f31"],
      [18, 11, 2, 2, "#ffc46c"],
      [5, 18, 3, 2, "#8f513a"],
      [16, 19, 2, 2, "#ff9b55"],
    ]);
    return canvas;
  }

  if (ground === "ruinStone") {
    fill("#7e7273");
    for (let y = 0; y < 24; y += 6) {
      px(ctx, 0, y, 24, 1, "#5b5151");
    }
    for (let x = 0; x < 24; x += 8) {
      px(ctx, x, 0, 1, 24, "#5b5151");
    }
    px(ctx, 9, 3, 6, 2, "#b6a7a5");
    px(ctx, 13, 14, 5, 2, "#c5b7b4");
    return canvas;
  }

  if (ground === "blight") {
    fill("#452927");
    speckle([
      [1, 4, 5, 2, "#5d3630"],
      [10, 5, 6, 2, "#231110"],
      [17, 8, 5, 2, "#7d4740"],
      [5, 14, 8, 2, "#2b1615"],
      [15, 18, 6, 2, "#5c302d"],
      [4, 20, 3, 2, "#944d42"],
    ]);
    return canvas;
  }

  fill(theme.groundMid);
  speckle([
    [2, 2, 2, 2, theme.grass],
    [7, 8, 2, 2, theme.groundLight],
    [11, 5, 3, 2, theme.groundDark],
    [16, 11, 2, 2, theme.grass],
    [4, 17, 2, 2, theme.groundLight],
    [13, 19, 2, 2, theme.sparkle],
  ]);
  for (let x = 0; x < 24; x += 6) {
    px(ctx, x + 2, 0, 1, 24, theme.groundDark);
  }
  return canvas;
}

const NPC_ACTOR_PROFILES = {
  elder_rowan: { accessory: "elder_staff", trim: "#d6bb73", glow: "#fff1b5" },
  lysa: { accessory: "training_baton", trim: "#91e2ff", glow: "#c9f5ff" },
  nettle: { accessory: "reed_charm", trim: "#d6c39b", glow: "#b9e58f" },
  halen: { accessory: "road_badge", trim: "#e7cf87", glow: "#ffe5a3" },
  tamsin: { accessory: "apothecary_satchel", trim: "#f0b87b", glow: "#c6ffe3" },
  orras: { accessory: "relic_tablet", trim: "#ece39e", glow: "#fff1aa" },
  garrick: { accessory: "ember_gauntlet", trim: "#ffbb7d", glow: "#ff8d5a" },
  vesper: { accessory: "frost_scarf", trim: "#d7f4ff", glow: "#f2fdff" },
  bram: { accessory: "ranger_pack", trim: "#bf876d", glow: "#e0aa7d" },
  selka: { accessory: "heart_lantern", trim: "#f0dd92", glow: "#fff1a8" },
  mara: { accessory: "lantern_tender", trim: "#8de0c8", glow: "#a8fff0" },
};

function getActorKind(style) {
  return typeof style === "string" && style.startsWith("npc:") ? "npc" : style;
}

function getNpcActorProfile(style) {
  if (typeof style !== "string" || !style.startsWith("npc:")) return null;
  return NPC_ACTOR_PROFILES[style.slice(4)] || null;
}

function getActorPaletteColor(palette, key, fallback) {
  return palette?.[key] || fallback;
}

function buildAylaSprite(palette, facing, frame, pose) {
  const canvas = createCanvas(56, 64);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const hoodBase = getActorPaletteColor(palette, "hood", "#f6f4ef");
  const cloakBase = getActorPaletteColor(palette, "cloak", "#7aa466");
  const accent = getActorPaletteColor(palette, "accent", "#86d4a7");
  const outline = "#191613";
  const hoodShade = darkenColor(hoodBase, -22);
  const hoodDeep = "#b9bdb0";
  const hoodLight = "#fffdf4";
  const cloakDeep = "#263423";
  const cloakDark = darkenColor(cloakBase, -34);
  const cloakMid = darkenColor(cloakBase, -8);
  const leafLight = "#b8ed8f";
  const spirit = pose === "cast" ? "#dffcf5" : "#f6f0a7";
  const spiritHot = pose === "cast" ? "#ffffff" : "#fff8d0";
  const leather = "#6c4a31";
  const leatherDark = "#3f2a1f";
  const bark = "#68402a";
  const barkLight = "#a16e48";
  const vine = "#6fbd60";
  const backFacing = facing === "up";
  const sideFacing = facing === "left" || facing === "right";
  const step = [0, 1, 0, -1][frame % 4];
  const staffRight = facing !== "left";
  const sideBias = facing === "left" ? -2 : facing === "right" ? 2 : 0;
  const leanX =
    pose === "dash"
      ? facing === "left"
        ? -4
        : facing === "right"
          ? 4
          : sideBias
      : pose === "attack"
        ? staffRight
          ? 2
          : -2
        : sideFacing
          ? sideBias
          : 0;
  const hoodLift = pose === "cast" ? -2 : pose === "dash" ? 1 : 0;
  const hemLift = pose === "dash" ? 3 : pose === "walk" ? Math.abs(step) : 0;
  const armLift = pose === "cast" ? -5 : pose === "attack" ? -2 : 0;
  const staffTilt = pose === "attack" ? -6 : pose === "cast" ? -8 : pose === "dash" ? 5 : step;

  drawAylaStaff(ctx, staffRight, leanX, staffTilt, { bark, barkLight, outline, spirit, spiritHot, vine });

  px(ctx, 22 + leanX, 55 + Math.max(0, -step) + hemLift, 5, 4, leatherDark);
  px(ctx, 29 + leanX, 55 + Math.max(0, step) + hemLift, 5, 4, leatherDark);
  px(ctx, 21 + leanX, 58 + Math.max(0, -step) + hemLift, 7, 2, "#2b211a");
  px(ctx, 29 + leanX, 58 + Math.max(0, step) + hemLift, 7, 2, "#2b211a");

  px(ctx, 17 + leanX, 23, 22, 27 - hemLift, outline);
  px(ctx, 18 + leanX, 24, 20, 24 - hemLift, cloakDeep);
  px(ctx, 20 + leanX, 24, 16, 26 - hemLift, cloakDark);
  px(ctx, 22 + leanX, 25, 12, 25 - hemLift, cloakMid);
  px(ctx, 25 + leanX, 27, 7, 23 - hemLift, accent);
  px(ctx, 19 + leanX, 46 - hemLift, 18, 7, outline);
  px(ctx, 21 + leanX, 47 - hemLift, 14, 6, cloakDark);
  px(ctx, 23 + leanX, 49 - hemLift, 10, 4, cloakMid);
  px(ctx, 19 + leanX, 51 - hemLift, 5, 3, leafLight);
  px(ctx, 31 + leanX, 51 - hemLift, 5, 3, vine);

  if (!backFacing) {
    px(ctx, 19 + leanX, 38, 18, 3, leatherDark);
    px(ctx, 22 + leanX, 37, 12, 2, leather);
    px(ctx, 25 + leanX, 35, 3, 17 - hemLift, "#e4f7a7");
    px(ctx, 30 + leanX, 36, 3, 14 - hemLift, "#5daf65");
  } else {
    px(ctx, 21 + leanX, 29, 14, 20 - hemLift, hoodShade);
    px(ctx, 24 + leanX, 30, 8, 18 - hemLift, cloakMid);
  }

  px(ctx, 15 + leanX, 24, 26, 5, outline);
  px(ctx, 17 + leanX, 24, 22, 4, "#3c5638");
  px(ctx, 18 + leanX, 25, 8, 3, vine);
  px(ctx, 29 + leanX, 25, 9, 3, leafLight);
  px(ctx, 16 + leanX, 28, 4, 4, "#4f7a43");
  px(ctx, 36 + leanX, 28, 4, 4, "#7fcc6d");

  drawAylaArms(ctx, staffRight, leanX, step, armLift, pose, {
    accent,
    cloakDark,
    hoodBase,
    hoodShade,
    leather,
    outline,
    spirit,
  });

  px(ctx, 18 + leanX, 8 + hoodLift, 20, 17, outline);
  px(ctx, 20 + leanX, 9 + hoodLift, 16, 15, hoodShade);
  px(ctx, 21 + leanX, 9 + hoodLift, 14, 5, hoodLight);
  px(ctx, 19 + leanX, 13 + hoodLift, 3, 9, hoodDeep);
  px(ctx, 34 + leanX, 13 + hoodLift, 3, 9, hoodDeep);
  px(ctx, 23 + leanX, 12 + hoodLift, 9, 3, hoodBase);

  if (backFacing) {
    px(ctx, 22 + leanX, 18 + hoodLift, 12, 6, hoodDeep);
    px(ctx, 24 + leanX, 16 + hoodLift, 8, 4, hoodShade);
  } else {
    const eyeX = facing === "left" ? 24 : facing === "right" ? 29 : 27;
    px(ctx, 22 + leanX, 17 + hoodLift, 12, 8, "#11100f");
    px(ctx, eyeX + leanX, 19 + hoodLift, 3, 3, "#f4ffe1");
    px(ctx, eyeX + leanX + (facing === "left" ? -2 : 2), 20 + hoodLift, 2, 2, "#aef1c7");
    px(ctx, 23 + leanX, 24 + hoodLift, 10, 2, hoodDeep);
  }

  px(ctx, 16 + leanX, 6 + hoodLift, 11, 3, hoodShade);
  px(ctx, 14 + leanX, 9 + hoodLift, 8, 3, hoodLight);
  px(ctx, 30 + leanX, 6 + hoodLift, 10, 3, hoodShade);
  px(ctx, 35 + leanX, 9 + hoodLift, 7, 3, hoodLight);

  px(ctx, 22 + leanX, 25, 3, 2, vine);
  px(ctx, 31 + leanX, 30, 2, 2, vine);
  px(ctx, 23 + leanX, 43, 2, 2, vine);
  px(ctx, 32 + leanX, 45 - hemLift, 2, 2, leafLight);

  if (pose === "cast") {
    px(ctx, 12 + leanX, 19, 2, 2, "#dffcf5");
    px(ctx, 39 + leanX, 17, 2, 2, "#ffffff");
    px(ctx, 42 + leanX, 27, 2, 2, "#baf5d9");
    px(ctx, 16 + leanX, 34, 2, 2, "#baf5d9");
  }

  if (pose === "dash") {
    px(ctx, 10 + leanX, 47 - hemLift, 10, 2, "#8fe5ca");
    px(ctx, 35 + leanX, 48 - hemLift, 9, 2, "#dffcf5");
    px(ctx, 14 + leanX, 52 - hemLift, 6, 2, "#f4ffe1");
  }

  return { canvas, anchorX: 28, anchorY: 58 };
}

function drawAylaStaff(ctx, staffRight, leanX, staffTilt, colors) {
  const { bark, barkLight, outline, spirit, spiritHot, vine } = colors;
  const shaftX = staffRight ? 43 + leanX : 10 + leanX;
  const crookDir = staffRight ? 1 : -1;
  const topY = 10 + staffTilt;

  px(ctx, shaftX - 1, 18 + staffTilt, 5, 40, outline);
  px(ctx, shaftX, 18 + staffTilt, 3, 39, bark);
  px(ctx, shaftX + (staffRight ? 2 : 0), 19 + staffTilt, 1, 36, barkLight);
  px(ctx, shaftX - 2 * crookDir, 14 + staffTilt, 7, 5, outline);
  px(ctx, shaftX - 1 * crookDir, 12 + staffTilt, 7, 4, bark);
  px(ctx, shaftX + 2 * crookDir, topY, 6, 4, bark);
  px(ctx, shaftX + 1 * crookDir, topY - 2, 8, 3, "#c9eebd");
  px(ctx, shaftX + 3 * crookDir, topY - 5, 4, 4, spirit);
  px(ctx, shaftX + 4 * crookDir, topY - 4, 2, 2, spiritHot);
  px(ctx, shaftX - 3 * crookDir, 16 + staffTilt, 3, 2, vine);
  px(ctx, shaftX + 4 * crookDir, 17 + staffTilt, 3, 2, vine);
  px(ctx, shaftX + 1 * crookDir, 31 + staffTilt, 2, 2, vine);
}

function drawAylaArms(ctx, staffRight, leanX, step, armLift, pose, colors) {
  const { accent, cloakDark, hoodBase, hoodShade, leather, outline, spirit } = colors;
  const leftLift = pose === "dash" ? step : armLift + step;
  const rightLift = pose === "dash" ? -step : armLift - step;
  const staffArmLift = pose === "attack" ? -4 : pose === "cast" ? -6 : 0;

  px(ctx, 14 + leanX, 29 + leftLift, 7, 14, outline);
  px(ctx, 35 + leanX, 29 + rightLift, 7, 14, outline);
  px(ctx, 16 + leanX, 29 + leftLift, 5, 13, hoodShade);
  px(ctx, 35 + leanX, 29 + rightLift, 5, 13, hoodBase);
  px(ctx, 14 + leanX, 40 + leftLift, 8, 4, cloakDark);
  px(ctx, 34 + leanX, 40 + rightLift, 8, 4, cloakDark);
  px(ctx, 16 + leanX, 43 + leftLift, 7, 4, accent);
  px(ctx, 33 + leanX, 43 + rightLift, 7, 4, accent);

  if (staffRight) {
    px(ctx, 36 + leanX, 31 + staffArmLift, 5, 13, leather);
    px(ctx, 38 + leanX, 38 + staffArmLift, 6, 4, spirit);
  } else {
    px(ctx, 15 + leanX, 31 + staffArmLift, 5, 13, leather);
    px(ctx, 11 + leanX, 38 + staffArmLift, 6, 4, spirit);
  }
}

function buildActorSprite(palette, facing, frame, style, pose) {
  const actorKind = getActorKind(style);
  if (actorKind === "ayla") return buildAylaSprite(palette, facing, frame, pose);

  const canvas = createCanvas(56, 64);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const npcProfile = getNpcActorProfile(style);
  const hoodBase = getActorPaletteColor(palette, "hood", "#eee7db");
  const cloakBase = getActorPaletteColor(palette, "cloak", "#6e7f5e");
  const accent = getActorPaletteColor(palette, "accent", "#d6bb73");
  const outline = "#231c19";
  const hoodShade = darkenColor(hoodBase, -24);
  const hoodLight = hoodBase;
  const trimDark = darkenColor(cloakBase, -24);
  const trimLight = cloakBase;
  const leather = "#7b5638";
  const leatherDark = "#513726";
  const backFacing = facing === "up";
  const sideFacing = facing === "left" || facing === "right";
  const step = [0, 1, 0, -1][frame % 4];
  const staffRight = facing !== "left";
  const leanX =
    pose === "dash"
      ? facing === "left"
        ? -3
        : facing === "right"
          ? 3
          : 0
      : pose === "attack"
        ? staffRight
          ? 1
          : -1
        : sideFacing
          ? staffRight
            ? 1
            : -1
          : 0;
  const hoodLift = pose === "cast" ? -2 : pose === "dash" ? 1 : 0;
  const hemLift = pose === "dash" ? 3 : pose === "walk" ? Math.abs(step) : 0;
  const beltLift = pose === "attack" ? 1 : 0;
  const leftArmOffset = pose === "cast" ? -4 : pose === "attack" ? 2 : step;
  const rightArmOffset = pose === "cast" ? -6 : pose === "attack" ? -5 : -step;
  const hoodShadow = pose === "cast" ? "#cecfca" : hoodShade;

  px(ctx, 23 + leanX, 57 + hemLift, 4, 4, "#5c412c");
  px(ctx, 29 + leanX, 57 + Math.max(0, -step) + hemLift, 4, 4, "#5c412c");
  px(ctx, 17 + leanX, 22, 22, 20, outline);
  px(ctx, 19 + leanX, 8 + hoodLift, 18, 16, outline);

  if (backFacing) {
    px(ctx, 20 + leanX, 11 + hoodLift, 16, 14, hoodShadow);
    px(ctx, 21 + leanX, 8 + hoodLift, 13, 4, hoodLight);
    px(ctx, 17 + leanX, 25, 22, 24, hoodLight);
    px(ctx, 21 + leanX, 24, 14, 22, hoodShadow);
  } else {
    px(ctx, 20 + leanX, 11 + hoodLift, 16, 12, hoodShadow);
    px(ctx, 21 + leanX, 8 + hoodLift, 13, 4, hoodLight);
    px(ctx, 22 + leanX, 18 + hoodLift, 12, 9, "#191715");
    px(ctx, (facing === "left" ? 23 : 27) + leanX, 20 + hoodLift, 3, 4, "#ffffff");
    px(ctx, 17 + leanX, 25, 22, 24, hoodLight);
    px(ctx, 21 + leanX, 24, 14, 22, hoodShadow);
  }

  if (!backFacing) {
    px(ctx, 17 + leanX, 38 - beltLift, 22, 6, leather);
    px(ctx, 21 + leanX, 36 - beltLift, 14, 4, leatherDark);
  }

  px(ctx, 18 + leanX, 49 - hemLift, 20, 8, hoodShadow);
  px(ctx, 22 + leanX, 25, 12, 28 - hemLift, trimLight);
  px(ctx, 24 + leanX, 27, 8, 24 - hemLift, accent);
  px(ctx, 21 + leanX, 27, 2, 20 - hemLift, trimDark);
  px(ctx, 33 + leanX, 27, 2, 20 - hemLift, trimDark);

  px(ctx, 16 + leanX, 26 + leftArmOffset, 6, 16, hoodLight);
  px(ctx, 34 + leanX, 26 + rightArmOffset, 6, 16, hoodLight);
  px(ctx, 14 + leanX, 27 + leftArmOffset, 4, 14, hoodShadow);
  px(ctx, 38 + leanX, 27 + rightArmOffset, 4, 14, hoodShadow);
  px(ctx, 17 + leanX, 38 + leftArmOffset, 6, 3, trimDark);
  px(ctx, 33 + leanX, 38 + rightArmOffset, 6, 3, trimDark);
  px(ctx, 14 + leanX, 42 + leftArmOffset, 8, 4, accent);
  px(ctx, 34 + leanX, 42 + rightArmOffset, 8, 4, accent);

  if (sideFacing) {
    const shift = facing === "left" ? -2 : 2;
    px(ctx, 24 + shift + leanX, 18 + hoodLift, 10, 9, "#171412");
    px(ctx, 18 + shift + leanX, 26, 20, 24 - hemLift, hoodLight);
    px(ctx, 22 + shift + leanX, 26, 12, 26 - hemLift, trimLight);
    px(ctx, 24 + shift + leanX, 27, 8, 24 - hemLift, accent);
  }

  if (actorKind === "npc") {
    const npcTrim = npcProfile?.trim || accent;
    px(ctx, 16 + leanX, 37, 24, 3, leatherDark);
    px(ctx, 19 + leanX, 25, 3, 22 - hemLift, trimDark);
    px(ctx, 34 + leanX, 26, 3, 20 - hemLift, trimDark);
    px(ctx, 14 + leanX, 43, 9, 5, leather);
    px(ctx, 33 + leanX, 43, 9, 5, leather);
    px(ctx, 26 + leanX, 35, 4, 4, accent);
    px(ctx, 27 + leanX, 36, 2, 2, "#fff1bb");
    px(ctx, 18 + leanX, 24, 20, 2, npcTrim);
    px(ctx, 20 + leanX, 50 - hemLift, 16, 2, darkenColor(npcTrim, -28));
    drawNpcSignatureDetails(ctx, npcProfile, leanX, hoodLift, hemLift, {
      accent,
      glow: npcProfile?.glow || accent,
      hoodLight,
      leather,
      leatherDark,
      npcTrim,
      trimDark,
    });
  }

  if (facing === "down") {
    px(ctx, 16 + leanX, 5 + hoodLift, 12, 4, hoodShadow);
    px(ctx, 14 + leanX, 8 + hoodLift, 8, 4, hoodLight);
  } else if (facing === "left") {
    px(ctx, 13 + leanX, 5 + hoodLift, 14, 4, hoodShadow);
    px(ctx, 11 + leanX, 8 + hoodLift, 8, 4, hoodLight);
  } else if (facing === "right") {
    px(ctx, 29 + leanX, 5 + hoodLift, 14, 4, hoodShadow);
    px(ctx, 35 + leanX, 8 + hoodLift, 8, 4, hoodLight);
  }

  return { canvas, anchorX: 28, anchorY: 58 };
}

function drawNpcSignatureDetails(ctx, profile, leanX, hoodLift, hemLift, colors) {
  if (!profile) {
    px(ctx, 25 + leanX, 41, 6, 3, colors.npcTrim);
    return;
  }

  const { accessory } = profile;
  if (accessory === "elder_staff") {
    px(ctx, 10 + leanX, 24, 3, 30, "#684837");
    px(ctx, 9 + leanX, 22, 7, 3, colors.npcTrim);
    px(ctx, 23 + leanX, 24 + hoodLift, 10, 6, "#d9d2c4");
    px(ctx, 25 + leanX, 30, 6, 5, "#efe9dd");
    px(ctx, 17 + leanX, 26, 3, 12, colors.npcTrim);
    px(ctx, 36 + leanX, 27, 3, 12, colors.npcTrim);
    return;
  }

  if (accessory === "training_baton") {
    px(ctx, 13 + leanX, 32, 30, 3, "#425064");
    px(ctx, 14 + leanX, 31, 8, 1, colors.glow);
    px(ctx, 33 + leanX, 35, 7, 3, colors.npcTrim);
    px(ctx, 20 + leanX, 41, 16, 2, colors.npcTrim);
    return;
  }

  if (accessory === "reed_charm") {
    px(ctx, 14 + leanX, 24, 2, 18, "#66824f");
    px(ctx, 12 + leanX, 25, 5, 2, "#b9d58a");
    px(ctx, 39 + leanX, 26, 2, 16, "#6f8d54");
    px(ctx, 36 + leanX, 27, 5, 2, "#d6c39b");
    px(ctx, 27 + leanX, 40, 3, 7, colors.npcTrim);
    return;
  }

  if (accessory === "road_badge") {
    px(ctx, 20 + leanX, 26, 4, 5, "#58422d");
    px(ctx, 23 + leanX, 31, 4, 5, "#58422d");
    px(ctx, 27 + leanX, 36, 4, 5, "#58422d");
    px(ctx, 31 + leanX, 41, 4, 5, "#58422d");
    px(ctx, 30 + leanX, 34, 5, 5, colors.npcTrim);
    px(ctx, 31 + leanX, 35, 3, 3, colors.glow);
    return;
  }

  if (accessory === "apothecary_satchel") {
    px(ctx, 12 + leanX, 39, 10, 10, colors.leather);
    px(ctx, 14 + leanX, 40, 6, 2, "#c58c5a");
    px(ctx, 36 + leanX, 38, 4, 8, "#7cdab7");
    px(ctx, 37 + leanX, 39, 2, 5, colors.glow);
    px(ctx, 24 + leanX, 31, 3, 12, colors.npcTrim);
    return;
  }

  if (accessory === "relic_tablet") {
    px(ctx, 22 + leanX, 39, 12, 10, "#6e684f");
    px(ctx, 24 + leanX, 40, 8, 2, colors.npcTrim);
    px(ctx, 26 + leanX, 43, 2, 2, colors.glow);
    px(ctx, 29 + leanX, 45, 2, 2, colors.glow);
    px(ctx, 18 + leanX, 28, 3, 14, "#505b40");
    return;
  }

  if (accessory === "ember_gauntlet") {
    px(ctx, 35 + leanX, 39, 8, 7, "#6b3428");
    px(ctx, 37 + leanX, 40, 4, 3, colors.glow);
    px(ctx, 20 + leanX, 23 + hoodLift, 16, 2, "#c76a3e");
    px(ctx, 29 + leanX, 22 + hoodLift, 4, 3, "#ffc06c");
    px(ctx, 17 + leanX, 43, 5, 3, colors.npcTrim);
    return;
  }

  if (accessory === "frost_scarf") {
    px(ctx, 18 + leanX, 24 + hoodLift, 20, 4, colors.glow);
    px(ctx, 34 + leanX, 27 + hoodLift, 5, 12, "#9bcbe3");
    px(ctx, 35 + leanX, 38, 3, 4, colors.npcTrim);
    px(ctx, 21 + leanX, 47 - hemLift, 14, 2, "#e9fbff");
    return;
  }

  if (accessory === "ranger_pack") {
    px(ctx, 12 + leanX, 29, 8, 19, "#4b3529");
    px(ctx, 14 + leanX, 31, 4, 13, "#6b4a35");
    px(ctx, 21 + leanX, 29, 3, 17, "#4a3428");
    px(ctx, 32 + leanX, 29, 3, 17, "#4a3428");
    px(ctx, 38 + leanX, 25, 3, 18, "#5f3f2e");
    return;
  }

  if (accessory === "heart_lantern") {
    px(ctx, 27 + leanX, 39, 5, 7, "#5d4b35");
    px(ctx, 28 + leanX, 40, 3, 4, colors.glow);
    px(ctx, 26 + leanX, 35, 7, 2, colors.npcTrim);
    px(ctx, 24 + leanX, 29, 2, 2, "#d5b9ff");
    px(ctx, 34 + leanX, 30, 2, 2, "#fff0b0");
    return;
  }

  if (accessory === "lantern_tender") {
    px(ctx, 38 + leanX, 35, 8, 12, "#4e3a28");
    px(ctx, 39 + leanX, 37, 6, 7, colors.glow);
    px(ctx, 40 + leanX, 34, 4, 2, colors.npcTrim);
    px(ctx, 24 + leanX, 31, 8, 3, "#67a99a");
    px(ctx, 26 + leanX, 40, 5, 5, colors.glow);
  }
}

const ENEMY_ARCHETYPES = {
  thornling: "thornling",
  barkling: "thornling",
  blight_hound: "thornling",
  mire_brute: "mire_brute",
  bog_lurker: "mire_brute",
  ash_brute: "mire_brute",
  icebound_guardian: "mire_brute",
  relic_sentinel: "mire_brute",
  wisp_archer: "wisp_archer",
  mire_spitter: "wisp_archer",
  cinder_imp: "wisp_archer",
  frost_wisp: "wisp_archer",
  starbound_archer: "wisp_archer",
  thorn_weaver: "thorn_weaver",
  root_stalker: "thorn_weaver",
  rot_weaver: "thorn_weaver",
};

const ENEMY_VISUALS = {
  thornling: {
    shape: "thorn",
    outline: "#231517",
    body: "#5a2130",
    core: "#8f3646",
    dark: "#793544",
    light: "#d86a71",
    accent: "#88b34f",
    limb: "#6f9d3f",
  },
  barkling: {
    shape: "bark",
    outline: "#1d2017",
    body: "#594129",
    core: "#7c623a",
    dark: "#3a2b20",
    light: "#c09957",
    accent: "#99c469",
    limb: "#6f8a45",
    plate: "#a47c4f",
    plateDark: "#463322",
  },
  blight_hound: {
    shape: "hound",
    outline: "#1c1018",
    body: "#4a1f32",
    core: "#8c334f",
    dark: "#2a1421",
    light: "#d36f8a",
    accent: "#c78bff",
    limb: "#71304a",
  },
  mire_brute: {
    outline: "#261513",
    head: "#553126",
    body: "#6f4130",
    core: "#8d6b48",
    plate: "#88a05a",
    dark: "#5c712f",
    arm: "#4c2c23",
    hand: "#76563a",
    foot: "#6c4b34",
    eye: "#efc97e",
    accent: "#8de0c8",
  },
  bog_lurker: {
    shape: "lurker",
    outline: "#17251f",
    head: "#365140",
    body: "#456d57",
    core: "#74a878",
    plate: "#6d8f60",
    dark: "#304b3b",
    arm: "#293e33",
    hand: "#517053",
    foot: "#354d39",
    eye: "#c7efd0",
    accent: "#8de0c8",
  },
  ash_brute: {
    shape: "ember",
    outline: "#24120f",
    head: "#5c2c23",
    body: "#8a3f2d",
    core: "#b75f39",
    plate: "#9d4c33",
    dark: "#55261d",
    arm: "#3d1d18",
    hand: "#a65b37",
    foot: "#603020",
    eye: "#ffd07d",
    accent: "#ff9a5f",
  },
  icebound_guardian: {
    shape: "guardian",
    outline: "#142030",
    head: "#48667d",
    body: "#6e92ad",
    core: "#9cbfd9",
    plate: "#b7d7e8",
    dark: "#486276",
    arm: "#2c4056",
    hand: "#8fb8d8",
    foot: "#4e6f89",
    eye: "#f5fdff",
    accent: "#cfefff",
    light: "#f3fbff",
  },
  relic_sentinel: {
    shape: "sentinel",
    outline: "#201b14",
    head: "#5f543e",
    body: "#776543",
    core: "#998552",
    plate: "#c2a260",
    dark: "#4c402c",
    arm: "#3d3427",
    hand: "#b69356",
    foot: "#564733",
    eye: "#fff0bf",
    accent: "#d8c07e",
    light: "#f4dfa1",
  },
  wisp_archer: {
    shape: "wisp",
    outline: "#182433",
    hood: "#50627f",
    face: "#dff5ff",
    cloak: "#7da8d6",
    core: "#cce5ff",
    bow: "#c5dfff",
    string: "#89a7cf",
    projectile: "#dff5ff",
  },
  mire_spitter: {
    shape: "spitter",
    outline: "#14322f",
    hood: "#34736a",
    face: "#e8fff8",
    cloak: "#4d8d7a",
    core: "#92e7d4",
    bow: "#9ce8db",
    string: "#4d8d7a",
    projectile: "#8de3d4",
  },
  cinder_imp: {
    shape: "imp",
    outline: "#261714",
    hood: "#8e422c",
    face: "#ffe0ad",
    cloak: "#b75f39",
    core: "#ff9a5f",
    bow: "#ffc078",
    string: "#8e422c",
    projectile: "#ffb16c",
  },
  frost_wisp: {
    shape: "frost",
    outline: "#17314b",
    hood: "#6f9fc0",
    face: "#f5fdff",
    cloak: "#92c5e5",
    core: "#dff6ff",
    bow: "#c7edff",
    string: "#79aad6",
    projectile: "#dff6ff",
  },
  starbound_archer: {
    shape: "star",
    outline: "#211a33",
    hood: "#6b5aa5",
    face: "#f7f4ff",
    cloak: "#9b8be3",
    core: "#d8ceff",
    bow: "#f3e1a4",
    string: "#8a6ca7",
    projectile: "#f3e1a4",
  },
  thorn_weaver: {
    shape: "thorn",
    outline: "#17151f",
    hood: "#4f395d",
    face: "#e9e8ef",
    cloak: "#7d5d92",
    core: "#c1a3d5",
    staff: "#705139",
    accent: "#82d174",
    orb: "#d8f1a0",
  },
  root_stalker: {
    shape: "root",
    outline: "#141b14",
    hood: "#385234",
    face: "#e8f6da",
    cloak: "#658c52",
    core: "#9bc976",
    staff: "#6c4f34",
    accent: "#a7e27c",
    orb: "#e3f2a0",
  },
  rot_weaver: {
    shape: "rot",
    outline: "#191020",
    hood: "#5a2b67",
    face: "#f3e8ff",
    cloak: "#8d4aa7",
    core: "#c48ce6",
    staff: "#5b3d32",
    accent: "#de9cff",
    orb: "#f0b35e",
  },
};

function getEnemyArchetype(type) {
  return ENEMY_ARCHETYPES[type] || ENEMY_ARCHETYPES.thornling;
}

function getEnemyVisual(type) {
  return ENEMY_VISUALS[type] || ENEMY_VISUALS[getEnemyArchetype(type)] || ENEMY_VISUALS.thornling;
}

function buildEnemySprite(type, facing, frame, pose) {
  const visual = getEnemyVisual(type);
  const archetype = getEnemyArchetype(type);
  if (archetype === "mire_brute") return buildMireBruteSprite(facing, frame, pose, visual);
  if (archetype === "wisp_archer") return buildWispArcherSprite(facing, frame, pose, visual);
  if (archetype === "thorn_weaver") return buildThornWeaverSprite(facing, frame, pose, visual);
  return buildThornlingSprite(facing, frame, pose, visual);
}

function buildThornlingSprite(facing, frame, pose, visual = ENEMY_VISUALS.thornling) {
  const canvas = createCanvas(46, 38);
  const ctx = canvas.getContext("2d");
  const bob = [0, 1, 0, -1][frame % 4];
  const outline = visual.outline || "#231517";
  const lean = facing === "left" ? -1 : facing === "right" ? 1 : 0;
  const crouch = pose === "windup" ? 2 : pose === "stun" ? 1 : 0;
  const flare = pose === "rooted" ? "#b8ef87" : visual.accent || "#88b34f";
  const shape = visual.shape || "thorn";
  const lift = bob + crouch;

  if (shape === "hound") {
    px(ctx, 5 + lean, 17 + lift, 34, 11, outline);
    px(ctx, 8 + lean, 18 + lift, 27, 8, visual.body || "#4a1f32");
    px(ctx, 31 + lean, 13 + lift, 10, 8, outline);
    px(ctx, 32 + lean, 14 + lift, 7, 5, visual.light || "#d36f8a");
    px(ctx, 35 + lean, 18 + lift, 7, 3, outline);
    px(ctx, 38 + lean, 19 + lift, 3, 2, "#dff9a7");
    px(ctx, 4 + lean, 14 + lift, 8, 4, visual.dark || "#2a1421");
    px(ctx, 2 + lean, 12 + lift, 5, 3, visual.accent || "#c78bff");
    px(ctx, 11 + lean, 12 + lift, 6, 4, visual.accent || "#c78bff");
    px(ctx, 23 + lean, 10 + lift, 6, 4, visual.accent || "#c78bff");
    px(ctx, 18 + lean, 20 + lift, 9, 3, visual.core || "#8c334f");
    px(ctx, 11 + lean, 27 + Math.max(0, -bob), 4, 6, visual.limb || "#71304a");
    px(ctx, 19 + lean, 27 + Math.max(0, bob), 4, 6, visual.limb || "#71304a");
    px(ctx, 29 + lean, 27 + Math.max(0, -bob), 4, 5, visual.limb || "#71304a");
    px(ctx, 35 + lean, 27 + Math.max(0, bob), 3, 5, visual.limb || "#71304a");
    px(ctx, 6 + lean, 29, 10, 2, outline);
    px(ctx, 29 + lean, 29, 10, 2, outline);
    return { canvas, anchorX: 23, anchorY: 34 };
  }

  if (shape === "bark") {
    px(ctx, 12 + lean, 8 + lift, 23, 22, outline);
    px(ctx, 14 + lean, 6 + lift, 19, 7, visual.plateDark || "#463322");
    px(ctx, 15 + lean, 7 + lift, 17, 5, visual.plate || "#a47c4f");
    px(ctx, 17 + lean, 5 + lift, 13, 3, flare);
    px(ctx, 14 + lean, 12 + lift, 19, 16, visual.body || "#594129");
    px(ctx, 16 + lean, 13 + lift, 4, 14, visual.plate || "#a47c4f");
    px(ctx, 25 + lean, 12 + lift, 4, 15, visual.plateDark || "#463322");
    px(ctx, 20 + lean, 15 + lift, 3, 3, "#cfff9b");
    px(ctx, 27 + lean, 15 + lift, 3, 3, "#cfff9b");
    px(ctx, 20 + lean, 22 + lift, 9, 2, visual.dark || "#3a2b20");
    px(ctx, 9 + lean, 18 + lift, 5, 4, visual.dark || "#3a2b20");
    px(ctx, 33 + lean, 18 + lift, 5, 4, visual.dark || "#3a2b20");
    px(ctx, 8 + lean, 29 + Math.max(0, -bob), 9, 4, visual.dark || "#3a2b20");
    px(ctx, 28 + lean, 29 + Math.max(0, bob), 9, 4, visual.dark || "#3a2b20");
    px(ctx, 17 + lean, 27 + lift, 3, 3, visual.accent || "#99c469");
    px(ctx, 30 + lean, 25 + lift, 3, 3, visual.accent || "#99c469");
    return { canvas, anchorX: 23, anchorY: 34 };
  }

  px(ctx, 9 + lean, 10 + lift, 27, 20, outline);
  px(ctx, 11 + lean, 12 + lift, 23, 16, visual.body || "#5a2130");
  px(ctx, 14 + lean, 14 + lift, 16, 11, pose === "windup" ? visual.windup || "#b44b5d" : visual.core || "#8f3646");
  px(ctx, 18 + lean, 16 + lift, 8, 5, visual.light || "#d86a71");
  px(ctx, facing === "left" ? 18 + lean : 23 + lean, 15 + lift, 3, 3, "#fff0c7");
  px(ctx, facing === "left" ? 23 + lean : 29 + lean, 15 + lift, 3, 3, "#fff0c7");
  px(ctx, 12 + lean, 22 + lift, 4, 3, visual.dark || "#793544");
  px(ctx, 29 + lean, 22 + lift, 4, 3, visual.dark || "#793544");
  px(ctx, 8 + lean, 8 + lift, 5, 5, flare);
  px(ctx, 17 + lean, 5 + lift, 4, 7, flare);
  px(ctx, 27 + lean, 5 + lift, 4, 7, flare);
  px(ctx, 34 + lean, 9 + lift, 5, 5, flare);
  px(ctx, 6 + lean, 18 + lift, 5, 4, flare);
  px(ctx, 34 + lean, 18 + lift, 5, 4, flare);
  px(ctx, 13 + lean, 28 + Math.max(0, -bob), 5, 5, visual.limb || "#6f9d3f");
  px(ctx, 28 + lean, 28 + Math.max(0, bob), 5, 5, visual.limb || "#6f9d3f");
  px(ctx, 22 + lean, 26 + lift, 4, 3, visual.dark || "#793544");
  return { canvas, anchorX: 23, anchorY: 34 };
}

function buildMireBruteSprite(facing, frame, pose, visual = ENEMY_VISUALS.mire_brute) {
  const canvas = createCanvas(62, 58);
  const ctx = canvas.getContext("2d");
  const bob = [0, 1, 0, -1][frame % 4];
  const outline = visual.outline || "#261513";
  const lean = pose === "windup" ? (facing === "left" ? -2 : 2) : facing === "left" ? -1 : facing === "right" ? 1 : 0;
  const crouch = pose === "windup" ? 3 : pose === "stun" ? 1 : 0;
  const shape = visual.shape || "mire";
  const lift = bob + crouch;

  if (shape === "lurker") {
    px(ctx, 8 + lean, 21 + lift, 46, 20, outline);
    px(ctx, 11 + lean, 22 + lift, 40, 16, visual.body || "#456d57");
    px(ctx, 28 + lean, 14 + lift, 20, 13, outline);
    px(ctx, 30 + lean, 15 + lift, 16, 10, visual.head || "#365140");
    px(ctx, 38 + lean, 18 + lift, 4, 3, visual.eye || "#c7efd0");
    px(ctx, 44 + lean, 19 + lift, 3, 2, visual.eye || "#c7efd0");
    px(ctx, 14 + lean, 26 + lift, 26, 7, pose === "rooted" ? "#9abb62" : visual.core || "#74a878");
    px(ctx, 8 + lean, 31 + lift, 45, 4, visual.dark || "#304b3b");
    px(ctx, 15 + lean, 15 + lift, 6, 9, visual.plate || "#6d8f60");
    px(ctx, 26 + lean, 13 + lift, 5, 8, visual.plate || "#6d8f60");
    px(ctx, 6 + lean, 36 + Math.max(0, -bob), 12, 4, visual.accent || "#8de0c8");
    px(ctx, 37 + lean, 37 + Math.max(0, bob), 13, 4, visual.accent || "#8de0c8");
    px(ctx, 47 + lean, 25 + lift, 7, 3, visual.light || "#a5e3be");
    return { canvas, anchorX: 31, anchorY: 52 };
  }

  if (shape === "guardian") {
    px(ctx, 14 + lean, 9 + lift, 34, 16, outline);
    px(ctx, 9 + lean, 24 + lift, 44, 20, outline);
    px(ctx, 16 + lean, 10 + lift, 30, 13, visual.head || "#48667d");
    px(ctx, 12 + lean, 25 + lift, 38, 17, visual.body || "#6e92ad");
    px(ctx, 18 + lean, 21 + lift, 26, 12, pose === "rooted" ? "#9abb62" : visual.core || "#9cbfd9");
    px(ctx, 11 + lean, 23 + lift, 10, 16, visual.plate || "#b7d7e8");
    px(ctx, 41 + lean, 23 + lift, 10, 16, visual.dark || "#486276");
    px(ctx, 23 + lean, 5 + lift, 5, 7, visual.accent || "#cfefff");
    px(ctx, 30 + lean, 2 + lift, 5, 10, visual.light || "#f3fbff");
    px(ctx, 37 + lean, 5 + lift, 5, 7, visual.accent || "#cfefff");
    px(ctx, 23 + lean, 15 + lift, 4, 4, visual.eye || "#f5fdff");
    px(ctx, 35 + lean, 15 + lift, 4, 4, visual.eye || "#f5fdff");
    px(ctx, 4 + lean, 29 + crouch, 12, 11, visual.arm || "#2c4056");
    px(ctx, 46 + lean, 29 + crouch, 12, 11, visual.arm || "#2c4056");
    px(ctx, 19 + lean, 43 + Math.max(0, -bob), 10, 7, visual.foot || "#4e6f89");
    px(ctx, 34 + lean, 43 + Math.max(0, bob), 10, 7, visual.foot || "#4e6f89");
    px(ctx, 20 + lean, 36 + lift, 23, 3, visual.light || "#f3fbff");
    return { canvas, anchorX: 31, anchorY: 52 };
  }

  if (shape === "sentinel") {
    px(ctx, 18 + lean, 7 + lift, 26, 16, outline);
    px(ctx, 13 + lean, 21 + lift, 36, 25, outline);
    px(ctx, 20 + lean, 8 + lift, 22, 13, visual.head || "#5f543e");
    px(ctx, 16 + lean, 22 + lift, 30, 22, visual.body || "#776543");
    px(ctx, 20 + lean, 24 + lift, 22, 16, visual.dark || "#4c402c");
    px(ctx, 23 + lean, 11 + lift, 16, 2, visual.light || "#f4dfa1");
    px(ctx, 30 + lean, 6 + lift, 3, 9, visual.light || "#f4dfa1");
    px(ctx, 24 + lean, 29 + lift, 16, 2, visual.light || "#f4dfa1");
    px(ctx, 31 + lean, 25 + lift, 2, 13, visual.light || "#f4dfa1");
    px(ctx, 28 + lean, 17 + lift, 6, 4, visual.eye || "#fff0bf");
    px(ctx, 6 + lean, 26 + crouch, 12, 15, visual.arm || "#3d3427");
    px(ctx, 45 + lean, 26 + crouch, 12, 15, visual.arm || "#3d3427");
    px(ctx, 17 + lean, 45 + Math.max(0, -bob), 12, 6, visual.foot || "#564733");
    px(ctx, 35 + lean, 45 + Math.max(0, bob), 12, 6, visual.foot || "#564733");
    px(ctx, 16 + lean, 19 + lift, 30, 2, visual.plate || "#c2a260");
    return { canvas, anchorX: 31, anchorY: 53 };
  }

  if (shape === "ember") {
    px(ctx, 13 + lean, 8 + lift, 36, 17, outline);
    px(ctx, 8 + lean, 24 + lift, 46, 21, outline);
    px(ctx, 15 + lean, 10 + lift, 32, 14, visual.head || "#5c2c23");
    px(ctx, 11 + lean, 26 + lift, 40, 17, visual.body || "#8a3f2d");
    px(ctx, 18 + lean, 22 + lift, 28, 13, visual.dark || "#55261d");
    px(ctx, 24 + lean, 26 + lift, 14, 9, pose === "rooted" ? "#9abb62" : visual.core || "#b75f39");
    px(ctx, 30 + lean, 23 + lift, 3, 13, "#fff0b5");
    px(ctx, 20 + lean, 12 + lift, 4, 4, visual.eye || "#ffd07d");
    px(ctx, 38 + lean, 12 + lift, 4, 4, visual.eye || "#ffd07d");
    px(ctx, 14 + lean, 5 + lift, 7, 7, visual.accent || "#ff9a5f");
    px(ctx, 42 + lean, 5 + lift, 7, 7, visual.accent || "#ff9a5f");
    px(ctx, 5 + lean, 29 + crouch, 13, 12, visual.arm || "#3d1d18");
    px(ctx, 46 + lean, 29 + crouch, 13, 12, visual.arm || "#3d1d18");
    px(ctx, 7 + lean, 35 + Math.max(0, -bob), 10, 8, visual.hand || "#a65b37");
    px(ctx, 47 + lean, 35 + Math.max(0, bob), 10, 8, visual.hand || "#a65b37");
    px(ctx, 21 + lean, 44 + Math.max(0, -bob), 10, 7, visual.foot || "#603020");
    px(ctx, 35 + lean, 44 + Math.max(0, bob), 10, 7, visual.foot || "#603020");
    return { canvas, anchorX: 31, anchorY: 53 };
  }

  px(ctx, 13 + lean, 9 + lift, 36, 16, outline);
  px(ctx, 8 + lean, 24 + lift, 46, 21, outline);
  px(ctx, 16 + lean, 11 + lift, 30, 12, visual.head || "#553126");
  px(ctx, 11 + lean, 26 + lift, 40, 16, visual.body || "#6f4130");
  px(ctx, 17 + lean, 20 + lift, 28, 12, pose === "rooted" ? "#9abb62" : visual.core || "#8d6b48");
  px(ctx, 20 + lean, 28 + lift, 23, 12, visual.plate || "#88a05a");
  px(ctx, 22 + lean, 33 + lift, 18, 6, visual.dark || "#5c712f");
  px(ctx, 21 + lean, 14 + lift, 4, 4, visual.eye || "#efc97e");
  px(ctx, 36 + lean, 14 + lift, 4, 4, visual.eye || "#efc97e");
  px(ctx, 12 + lean, 7 + lift, 9, 5, visual.plate || "#88a05a");
  px(ctx, 40 + lean, 7 + lift, 9, 5, visual.plate || "#88a05a");
  px(ctx, 4 + lean, 29 + crouch, 13, 12, visual.arm || "#4c2c23");
  px(ctx, 46 + lean, 29 + crouch, 13, 12, visual.arm || "#4c2c23");
  px(ctx, 7 + lean, 35 + Math.max(0, -bob), 10, 8, visual.hand || "#76563a");
  px(ctx, 46 + lean, 35 + Math.max(0, bob), 10, 8, visual.hand || "#76563a");
  px(ctx, 21 + lean, 44 + Math.max(0, -bob), 10, 7, visual.foot || "#6c4b34");
  px(ctx, 35 + lean, 44 + Math.max(0, bob), 10, 7, visual.foot || "#6c4b34");
  px(ctx, 14 + lean, 31 + lift, 4, 8, visual.accent || "#8de0c8");
  px(ctx, 43 + lean, 31 + lift, 4, 8, visual.accent || "#8de0c8");
  return { canvas, anchorX: 31, anchorY: 53 };
}

function buildWispArcherSprite(facing, frame, pose, visual = ENEMY_VISUALS.wisp_archer) {
  const canvas = createCanvas(54, 50);
  const ctx = canvas.getContext("2d");
  const bob = [0, 1, 0, -1][frame % 4];
  const outline = visual.outline || "#182433";
  const lean = pose === "windup" ? (facing === "left" ? -3 : 3) : facing === "left" ? -1 : facing === "right" ? 1 : 0;
  const hoodLift = pose === "windup" ? -1 : 0;
  const bowLift = pose === "windup" ? -3 : pose === "release" ? 2 : 0;
  const shape = visual.shape || "wisp";
  const lift = bob + hoodLift;

  if (shape === "spitter") {
    px(ctx, 12 + lean, 13 + lift, 23, 13, outline);
    px(ctx, 10 + lean, 24 + bob, 29, 14, outline);
    px(ctx, 14 + lean, 15 + lift, 18, 9, visual.hood || "#34736a");
    px(ctx, 17 + lean, 16 + lift, 11, 6, visual.face || "#e8fff8");
    px(ctx, facing === "left" ? 17 + lean : 24 + lean, 18 + lift, 3, 2, "#14322f");
    px(ctx, 12 + lean, 25 + bob, 25, 11, visual.cloak || "#4d8d7a");
    px(ctx, 16 + lean, 27 + bob, 16, 8, visual.core || "#92e7d4");
    px(ctx, 32 + lean, 24 + bob + bowLift, 13, 5, visual.bow || "#9ce8db");
    px(ctx, 40 + lean, 22 + bob + bowLift, 5, 9, visual.projectile || "#8de3d4");
    px(ctx, 43 + lean, 25 + bob + bowLift, 6, 3, "#e8fff8");
    px(ctx, 13 + lean, 10 + lift, 5, 8, "#6fae78");
    px(ctx, 31 + lean, 10 + lift, 5, 8, "#6fae78");
    px(ctx, 18 + lean, 37 + Math.max(0, bob), 8, 4, "#2f6d62");
    px(ctx, 29 + lean, 37 + Math.max(0, -bob), 8, 4, "#2f6d62");
    return { canvas, anchorX: 27, anchorY: 44 };
  }

  if (shape === "imp") {
    px(ctx, 16 + lean, 11 + lift, 19, 11, outline);
    px(ctx, 14 + lean, 21 + bob, 23, 14, outline);
    px(ctx, 18 + lean, 12 + lift, 15, 8, visual.hood || "#8e422c");
    px(ctx, 20 + lean, 14 + lift, 11, 6, visual.face || "#ffe0ad");
    px(ctx, 15 + lean, 9 + lift, 6, 4, visual.core || "#ff9a5f");
    px(ctx, 30 + lean, 8 + lift, 6, 5, visual.core || "#ff9a5f");
    px(ctx, 16 + lean, 23 + bob, 19, 10, visual.cloak || "#b75f39");
    px(ctx, 20 + lean, 29 + bob, 11, 6, "#ff7f4f");
    px(ctx, 38 + lean, 18 + bob + bowLift, 7, 7, visual.projectile || "#ffb16c");
    px(ctx, 41 + lean, 16 + bob + bowLift, 3, 3, "#fff0b5");
    px(ctx, 10 + lean, 25 + bob, 7, 3, "#a6492f");
    px(ctx, 18 + lean, 36 + Math.max(0, bob), 6, 4, "#54231a");
    px(ctx, 30 + lean, 36 + Math.max(0, -bob), 6, 4, "#54231a");
    return { canvas, anchorX: 27, anchorY: 43 };
  }

  px(ctx, 16 + lean, 9 + lift, 22, 12, outline);
  px(ctx, 13 + lean, 20 + bob, 27, 16, outline);
  px(ctx, 18 + lean, 11 + lift, 18, 9, visual.hood || "#50627f");
  px(ctx, 21 + lean, 12 + lift, 12, 7, visual.face || "#dff5ff");
  px(ctx, facing === "left" ? 20 + lean : 28 + lean, 15 + lift, 4, 3, "#161b22");
  px(ctx, 15 + lean, 22 + bob, 23, 10, pose === "rooted" ? "#a9d8ee" : visual.cloak || "#7da8d6");
  px(ctx, 13 + lean, 25 + bob, 7, 9, visual.cloak || "#7da8d6");
  px(ctx, 34 + lean, 25 + bob, 6, 8, visual.cloak || "#7da8d6");
  px(ctx, 20 + lean, 24 + bob, 13, 8, visual.core || "#cce5ff");
  px(ctx, 23 + lean, 25 + bob, 7, 4, visual.face || "#dff5ff");
  px(ctx, 19 + lean, 34 + Math.max(0, bob), 13, 3, visual.face || "#dff5ff");
  px(ctx, 22 + lean, 38 + Math.max(0, bob), 8, 3, visual.cloak || "#7da8d6");
  px(ctx, 34 + lean, 20 + bob + bowLift, 3, 20, visual.bow || "#c5dfff");
  px(ctx, 37 + lean, 19 + bob + bowLift, 7, 3, visual.bow || "#c5dfff");
  px(ctx, 37 + lean, 36 + bob + bowLift, 7, 3, visual.bow || "#c5dfff");
  px(ctx, 41 + lean, 23 + bob + bowLift, 2, 12, visual.string || "#89a7cf");
  px(ctx, 43 + lean, 28 + bob + bowLift, 5, 5, visual.projectile || visual.core || "#cce5ff");

  if (shape === "frost") {
    px(ctx, 18 + lean, 7 + lift, 18, 3, "#f5fdff");
    px(ctx, 24 + lean, 3 + lift, 5, 6, "#bfe9ff");
    px(ctx, 16 + lean, 33 + bob, 19, 3, "#e7fbff");
    px(ctx, 22 + lean, 38 + bob, 8, 5, "#bfe9ff");
  } else if (shape === "star") {
    px(ctx, 18 + lean, 8 + lift, 18, 2, "#f3e1a4");
    px(ctx, 26 + lean, 3 + lift, 3, 8, "#f3e1a4");
    px(ctx, 14 + lean, 22 + bob, 24, 2, "#f3e1a4");
    px(ctx, 25 + lean, 20 + bob, 3, 18, "#f3e1a4");
    px(ctx, 9 + lean, 18 + bob, 3, 3, "#fff4b8");
    px(ctx, 45 + lean, 15 + bob, 3, 3, "#fff4b8");
  } else {
    px(ctx, 18 + lean, 33 + bob, 18, 2, "#dff5ff");
    px(ctx, 21 + lean, 38 + bob, 10, 4, visual.cloak || "#7da8d6");
    px(ctx, 11 + lean, 24 + bob, 5, 7, visual.core || "#cce5ff");
    px(ctx, 17 + lean, 20 + bob, 3, 3, "#6fbf8c");
    px(ctx, 32 + lean, 21 + bob, 3, 3, "#6fbf8c");
  }

  return { canvas, anchorX: 27, anchorY: 44 };
}

function buildThornWeaverSprite(facing, frame, pose, visual = ENEMY_VISUALS.thorn_weaver) {
  const canvas = createCanvas(54, 52);
  const ctx = canvas.getContext("2d");
  const bob = [0, 1, 0, -1][frame % 4];
  const lean = facing === "left" ? -1 : facing === "right" ? 1 : 0;
  const outline = visual.outline || "#17151f";
  const castLift = pose === "windup" ? -2 : 0;
  const shape = visual.shape || "thorn";
  const lift = bob;
  const aura = pose === "rooted" ? "#a7dd84" : visual.cloak || "#7d5d92";

  px(ctx, 15 + lean, 10 + lift, 24, 12, outline);
  px(ctx, 12 + lean, 22 + lift, 29, 16, outline);
  px(ctx, 18 + lean, 12 + lift, 18, 9, visual.hood || "#4f395d");
  px(ctx, 20 + lean, 13 + lift, 13, 7, visual.face || "#e9e8ef");
  px(ctx, facing === "left" ? 19 + lean : 28 + lean, 16 + lift, 4, 3, "#13131a");
  px(ctx, 15 + lean, 23 + lift, 23, 12, aura);
  px(ctx, 12 + lean, 27 + lift, 6, 12, aura);
  px(ctx, 36 + lean, 27 + lift, 5, 11, aura);
  px(ctx, 20 + lean, 26 + lift, 13, 8, visual.core || "#c1a3d5");
  px(ctx, 23 + lean, 27 + lift, 7, 4, visual.face || "#f0e8ff");
  px(ctx, 22 + lean, 36 + Math.max(0, bob), 8, 7, visual.face || "#f0e8ff");
  px(ctx, 39 + lean, 17 + lift + castLift, 3, 24, visual.staff || "#705139");
  px(ctx, 41 + lean, 15 + lift + castLift, 7, 4, visual.staff || "#705139");
  px(ctx, 43 + lean, 12 + lift + castLift, 4, 4, visual.accent || "#82d174");
  px(ctx, 43 + lean, 23 + lift + castLift, 3, 3, visual.accent || "#82d174");
  px(ctx, 8 + lean, 24 + lift + castLift, 5, 13, visual.face || "#e9e8ef");
  px(ctx, 10 + lean, 26 + lift + castLift, 3, 11, visual.core || "#c1a3d5");
  px(ctx, 41 + lean, 9 + lift + castLift, 8, 7, visual.orb || visual.accent || "#82d174");

  if (shape === "rot") {
    px(ctx, 15 + lean, 7 + lift, 8, 6, "#de9cff");
    px(ctx, 28 + lean, 6 + lift, 9, 7, "#a64bc7");
    px(ctx, 11 + lean, 24 + lift, 5, 16, "#4d2238");
    px(ctx, 36 + lean, 24 + lift, 5, 15, "#4d2238");
    px(ctx, 18 + lean, 34 + lift, 16, 3, visual.orb || "#f0b35e");
    px(ctx, 42 + lean, 7 + lift + castLift, 7, 7, visual.orb || "#f0b35e");
    px(ctx, 16 + lean, 42 + Math.max(0, bob), 7, 4, "#5b2f43");
    px(ctx, 30 + lean, 42 + Math.max(0, -bob), 7, 4, "#5b2f43");
    px(ctx, 22 + lean, 40 + lift, 3, 5, "#a64bc7");
    px(ctx, 28 + lean, 41 + lift, 3, 5, "#de9cff");
  } else if (shape === "root") {
    px(ctx, 13 + lean, 23 + lift, 5, 16, "#6f8d4d");
    px(ctx, 36 + lean, 23 + lift, 5, 15, "#6f8d4d");
    px(ctx, 16 + lean, 9 + lift, 7, 5, "#a7e27c");
    px(ctx, 30 + lean, 9 + lift, 7, 5, "#6f9d50");
    px(ctx, 18 + lean, 35 + lift, 16, 3, visual.staff || "#6c4f34");
    px(ctx, 5 + lean, 27 + lift + castLift, 6, 5, "#a7e27c");
    px(ctx, 41 + lean, 8 + lift + castLift, 7, 6, visual.orb || "#e3f2a0");
    px(ctx, 18 + lean, 42 + Math.max(0, bob), 5, 5, "#5c3d2a");
    px(ctx, 30 + lean, 42 + Math.max(0, -bob), 5, 5, "#5c3d2a");
    px(ctx, 24 + lean, 38 + lift, 3, 7, "#6c4f34");
  } else {
    px(ctx, 13 + lean, 10 + lift, 6, 3, visual.accent || "#82d174");
    px(ctx, 34 + lean, 10 + lift, 6, 3, visual.accent || "#82d174");
    px(ctx, 16 + lean, 36 + lift, 21, 2, "#4f395d");
    px(ctx, 41 + lean, 7 + lift + castLift, 7, 7, visual.orb || "#d8f1a0");
    px(ctx, 10 + lean, 20 + lift, 4, 4, visual.accent || "#82d174");
    px(ctx, 38 + lean, 21 + lift, 4, 4, visual.accent || "#82d174");
    px(ctx, 15 + lean, 41 + Math.max(0, bob), 8, 4, "#281c30");
    px(ctx, 31 + lean, 41 + Math.max(0, -bob), 8, 4, "#281c30");
  }

  return { canvas, anchorX: 27, anchorY: 47 };
}

function buildBossSprite(frame, pose) {
  const canvas = createCanvas(84, 72);
  const ctx = canvas.getContext("2d");
  const bob = [0, 1, 0, -1][frame % 4];
  const outline = "#1f120f";
  const crouch = pose === "slam" ? 3 : pose === "stun" ? 1 : 0;
  const armLift = pose === "volley" ? -5 : pose === "summon" ? -3 : 0;

  px(ctx, 20, 8 + bob + crouch, 44, 18, outline);
  px(ctx, 14, 24 + bob + crouch, 56, 20, outline);
  px(ctx, 22, 10 + bob + crouch, 40, 14, "#532419");
  px(ctx, 16, 26 + bob + crouch, 52, 16, "#6a3224");
  px(ctx, 26, 18 + bob + crouch, 28, 12, pose === "rooted" ? "#6b8d48" : "#876140");
  px(ctx, 28, 29 + bob + crouch, 24, 11, "#4a6f33");
  px(ctx, 34, 14 + bob + crouch, 6, 4, "#f2d38a");
  px(ctx, 44, 14 + bob + crouch, 6, 4, "#f2d38a");
  px(ctx, 10, 18 + bob + armLift, 10, 5, "#7c4d38");
  px(ctx, 64, 18 + bob + armLift, 10, 5, "#7c4d38");
  px(ctx, 6, 13 + bob + armLift, 8, 3, "#7c4d38");
  px(ctx, 70, 13 + bob + armLift, 8, 3, "#7c4d38");
  px(ctx, 24, 44 + Math.max(0, -bob), 10, 12, "#6b4832");
  px(ctx, 48, 44 + Math.max(0, bob), 10, 12, "#6b4832");
  px(ctx, 32, 51 + crouch, 18, 8, "#5a3d2a");
  return { canvas, anchorX: 42, anchorY: 64 };
}

function buildProjectileSprite(type) {
  const canvas = createCanvas(20, 20);
  const ctx = canvas.getContext("2d");

  if (type === "wisp") {
    px(ctx, 2, 9, 16, 2, "#98cbe7");
    px(ctx, 5, 6, 10, 8, "#dff5ff");
    px(ctx, 12, 5, 4, 4, "#7ba9d8");
    return { canvas, anchorX: 10, anchorY: 10 };
  }

   if (type === "ember") {
    px(ctx, 2, 9, 10, 2, "#ffaf70");
    px(ctx, 10, 7, 8, 6, "#ff744f");
    px(ctx, 12, 5, 4, 10, "#fff0b5");
    px(ctx, 5, 7, 3, 3, "#a6492f");
    return { canvas, anchorX: 10, anchorY: 10 };
  }

  if (type === "frost") {
    px(ctx, 2, 9, 10, 2, "#c7edff");
    px(ctx, 10, 7, 8, 6, "#90d3ff");
    px(ctx, 12, 5, 4, 10, "#f5fdff");
    px(ctx, 5, 7, 3, 3, "#79aad6");
    return { canvas, anchorX: 10, anchorY: 10 };
  }

  if (type === "mire") {
    px(ctx, 2, 9, 10, 2, "#8de3d4");
    px(ctx, 10, 7, 8, 6, "#58bda8");
    px(ctx, 12, 5, 4, 10, "#e8fff8");
    px(ctx, 5, 7, 3, 3, "#417e6c");
    return { canvas, anchorX: 10, anchorY: 10 };
  }

  if (type === "blight") {
    px(ctx, 2, 9, 10, 2, "#d39bff");
    px(ctx, 10, 7, 8, 6, "#9c61da");
    px(ctx, 12, 5, 4, 10, "#f8eaff");
    px(ctx, 5, 7, 3, 3, "#5f2d7f");
    return { canvas, anchorX: 10, anchorY: 10 };
  }

  if (type === "ancient") {
    px(ctx, 2, 9, 10, 2, "#efdca4");
    px(ctx, 10, 7, 8, 6, "#be93ef");
    px(ctx, 12, 5, 4, 10, "#fff8de");
    px(ctx, 5, 7, 3, 3, "#8a6ca7");
    return { canvas, anchorX: 10, anchorY: 10 };
  }

  px(ctx, 2, 9, 10, 2, "#93ef8d");
  px(ctx, 10, 7, 8, 6, "#58d4ff");
  px(ctx, 12, 5, 4, 10, "#dffbff");
  px(ctx, 5, 7, 3, 3, "#72bb53");
  return { canvas, anchorX: 10, anchorY: 10 };
}

function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function darkenColor(hex, amount) {
  const clean = hex.replace("#", "");
  const step = amount;
  const r = clampColor(parseInt(clean.slice(0, 2), 16) + step);
  const g = clampColor(parseInt(clean.slice(2, 4), 16) + step);
  const b = clampColor(parseInt(clean.slice(4, 6), 16) + step);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function clampColor(value) {
  return Math.max(0, Math.min(255, value));
}

function toHex(value) {
  return value.toString(16).padStart(2, "0");
}

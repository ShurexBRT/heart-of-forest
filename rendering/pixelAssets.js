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

function buildActorSprite(palette, facing, frame, style, pose) {
  const canvas = createCanvas(56, 64);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const outline = "#231c19";
  const hoodShade = "#d6d7d2";
  const hoodLight = "#f5f1e8";
  const trimDark = darkenColor(palette.cloak, -20);
  const trimLight = palette.cloak;
  const accent = palette.accent;
  const leather = "#7b5638";
  const leatherDark = "#513726";
  const bark = style === "ayla" ? "#6a432b" : "#684837";
  const barkLight = style === "ayla" ? "#9a6a49" : "#92644a";
  const vine = "#6db45b";
  const hasStaff = style === "ayla";
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

  if (hasStaff && staffRight) {
    const staffTilt = pose === "attack" ? -5 : pose === "cast" ? -8 : pose === "dash" ? 4 : step;
    px(ctx, 42 + leanX, 18 + staffTilt, 3, 38, bark);
    px(ctx, 44 + leanX, 18 + staffTilt, 1, 36, barkLight);
    px(ctx, 41 + leanX, 18 + staffTilt, 8, 2, barkDark);
    px(ctx, 46 + leanX, 10 + staffTilt, 3, 10, bark);
    px(ctx, 45 + leanX, 9 + staffTilt, 6, 2, bark);
    px(ctx, 43 + leanX, 14 + staffTilt, 2, 2, vine);
    px(ctx, 48 + leanX, 12 + staffTilt, 2, 2, vine);
    px(ctx, 46 + leanX, 24 + staffTilt, 2, 2, vine);
  } else if (hasStaff) {
    const staffTilt = pose === "attack" ? -5 : pose === "cast" ? -8 : pose === "dash" ? 4 : -step;
    px(ctx, 11 + leanX, 18 + staffTilt, 3, 38, bark);
    px(ctx, 11 + leanX, 18 + staffTilt, 1, 36, barkLight);
    px(ctx, 8 + leanX, 18 + staffTilt, 8, 2, barkDark);
    px(ctx, 7 + leanX, 10 + staffTilt, 3, 10, bark);
    px(ctx, 5 + leanX, 9 + staffTilt, 6, 2, bark);
    px(ctx, 8 + leanX, 14 + staffTilt, 2, 2, vine);
    px(ctx, 3 + leanX, 12 + staffTilt, 2, 2, vine);
    px(ctx, 7 + leanX, 24 + staffTilt, 2, 2, vine);
  }

  if (style === "ayla") {
    px(ctx, 19 + leanX, 13 + hoodLift, 6, 2, hoodLight);
    px(ctx, 31 + leanX, 30, 2, 2, vine);
    px(ctx, 23 + leanX, 43, 2, 2, vine);
    px(ctx, 30 + leanX, 46 - hemLift, 2, 2, vine);
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

function buildEnemySprite(type, facing, frame, pose) {
  if (type === "mire_brute") return buildMireBruteSprite(facing, frame, pose);
  if (type === "wisp_archer") return buildWispArcherSprite(facing, frame, pose);
  if (type === "thorn_weaver") return buildThornWeaverSprite(facing, frame, pose);
  return buildThornlingSprite(facing, frame, pose);
}

function buildThornlingSprite(facing, frame, pose) {
  const canvas = createCanvas(42, 34);
  const ctx = canvas.getContext("2d");
  const bob = [0, 1, 0, -1][frame % 4];
  const outline = "#231517";
  const lean = facing === "left" ? -1 : facing === "right" ? 1 : 0;
  const crouch = pose === "windup" ? 2 : pose === "stun" ? 1 : 0;
  const flare = pose === "rooted" ? "#b8ef87" : "#88b34f";

  px(ctx, 10 + lean, 9 + crouch + bob, 22, 16, outline);
  px(ctx, 12 + lean, 11 + crouch + bob, 18, 12, "#5a2130");
  px(ctx, 15 + lean, 13 + crouch + bob, 12, 8, pose === "windup" ? "#b44b5d" : "#8f3646");
  px(ctx, 18 + lean, 15 + crouch + bob, 6, 4, "#d86a71");
  px(ctx, facing === "left" ? 17 : 22, 15 + crouch + bob, 2, 2, "#fff0c7");
  px(ctx, facing === "left" ? 21 : 26, 15 + crouch + bob, 2, 2, "#fff0c7");
  px(ctx, 8 + lean, 15 + crouch + bob, 4, 2, "#793544");
  px(ctx, 30 + lean, 15 + crouch + bob, 4, 2, "#793544");
  px(ctx, 9 + lean, 7 + crouch + bob, 4, 4, flare);
  px(ctx, 28 + lean, 7 + crouch + bob, 5, 4, flare);
  px(ctx, 6 + lean, 12 + crouch + bob, 4, 5, "#6f9d3f");
  px(ctx, 31 + lean, 12 + crouch + bob, 4, 5, "#6f9d3f");
  px(ctx, 11 + lean, 25 + Math.max(0, -bob), 4, 4, "#6f9d3f");
  px(ctx, 27 + lean, 25 + Math.max(0, bob), 4, 4, "#6f9d3f");
  return { canvas, anchorX: 21, anchorY: 30 };
}

function buildMireBruteSprite(facing, frame, pose) {
  const canvas = createCanvas(56, 52);
  const ctx = canvas.getContext("2d");
  const bob = [0, 1, 0, -1][frame % 4];
  const outline = "#261513";
  const lean = pose === "windup" ? (facing === "left" ? -2 : 2) : facing === "left" ? -1 : facing === "right" ? 1 : 0;
  const crouch = pose === "windup" ? 3 : pose === "stun" ? 1 : 0;

  px(ctx, 12 + lean, 8 + bob + crouch, 32, 14, outline);
  px(ctx, 8 + lean, 20 + bob + crouch, 40, 18, outline);
  px(ctx, 14 + lean, 10 + bob + crouch, 28, 12, "#553126");
  px(ctx, 10 + lean, 22 + bob + crouch, 36, 14, "#6f4130");
  px(ctx, 16 + lean, 16 + bob + crouch, 24, 10, pose === "rooted" ? "#9abb62" : "#8d6b48");
  px(ctx, 18 + lean, 24 + bob + crouch, 20, 12, "#88a05a");
  px(ctx, 20 + lean, 28 + bob + crouch, 16, 6, "#5c712f");
  px(ctx, facing === "left" ? 22 + lean : 26 + lean, 14 + bob + crouch, 4, 4, "#efc97e");
  px(ctx, facing === "left" ? 30 + lean : 34 + lean, 14 + bob + crouch, 4, 4, "#efc97e");
  px(ctx, 2 + lean, 23 + crouch, 12, 10, "#4c2c23");
  px(ctx, 42 + lean, 23 + crouch, 12, 10, "#4c2c23");
  px(ctx, 6 + lean, 26 + crouch + Math.max(0, -bob), 8, 8, "#76563a");
  px(ctx, 42 + lean, 26 + crouch + Math.max(0, bob), 8, 8, "#76563a");
  px(ctx, 18 + lean, 38 + crouch + Math.max(0, -bob), 8, 8, "#6c4b34");
  px(ctx, 30 + lean, 38 + crouch + Math.max(0, bob), 8, 8, "#6c4b34");
  return { canvas, anchorX: 28, anchorY: 48 };
}

function buildWispArcherSprite(facing, frame, pose) {
  const canvas = createCanvas(48, 44);
  const ctx = canvas.getContext("2d");
  const bob = [0, 1, 0, -1][frame % 4];
  const outline = "#182433";
  const lean = pose === "windup" ? (facing === "left" ? -3 : 3) : facing === "left" ? -1 : facing === "right" ? 1 : 0;
  const hoodLift = pose === "windup" ? -1 : 0;
  const bowLift = pose === "windup" ? -3 : pose === "release" ? 2 : 0;

  px(ctx, 15 + lean, 8 + bob + hoodLift, 18, 10, outline);
  px(ctx, 13 + lean, 18 + bob, 22, 14, outline);
  px(ctx, 17 + lean, 10 + bob + hoodLift, 14, 8, "#50627f");
  px(ctx, 19 + lean, 11 + bob + hoodLift, 10, 6, "#dff5ff");
  px(ctx, facing === "left" ? 18 + lean : 24 + lean, 14 + bob, 4, 3, "#161b22");
  px(ctx, 14 + lean, 19 + bob, 20, 11, pose === "rooted" ? "#a9d8ee" : "#7da8d6");
  px(ctx, 18 + lean, 20 + bob, 12, 10, "#cce5ff");
  px(ctx, 20 + lean, 30 + Math.max(0, bob), 8, 5, "#dff5ff");
  px(ctx, 34 + lean, 18 + bob + bowLift, 2, 16, "#c5dfff");
  px(ctx, 36 + lean, 17 + bob + bowLift, 5, 2, "#c5dfff");
  px(ctx, 36 + lean, 31 + bob + bowLift, 5, 2, "#c5dfff");
  px(ctx, 38 + lean, 20 + bob + bowLift, 2, 10, "#89a7cf");
  return { canvas, anchorX: 24, anchorY: 39 };
}

function buildThornWeaverSprite(facing, frame, pose) {
  const canvas = createCanvas(48, 46);
  const ctx = canvas.getContext("2d");
  const bob = [0, 1, 0, -1][frame % 4];
  const lean = facing === "left" ? -1 : facing === "right" ? 1 : 0;
  const outline = "#17151f";
  const castLift = pose === "windup" ? -2 : 0;

  px(ctx, 14 + lean, 8 + bob, 20, 10, outline);
  px(ctx, 12 + lean, 18 + bob, 24, 14, outline);
  px(ctx, 16 + lean, 10 + bob, 16, 8, "#4f395d");
  px(ctx, 18 + lean, 11 + bob, 12, 6, "#e9e8ef");
  px(ctx, facing === "left" ? 18 + lean : 24 + lean, 14 + bob, 4, 3, "#13131a");
  px(ctx, 14 + lean, 19 + bob, 20, 12, pose === "rooted" ? "#a7dd84" : "#7d5d92");
  px(ctx, 18 + lean, 21 + bob, 12, 10, "#c1a3d5");
  px(ctx, 22 + lean, 31 + Math.max(0, bob), 4, 6, "#f0e8ff");
  px(ctx, 34 + lean, 16 + bob + castLift, 3, 18, "#705139");
  px(ctx, 36 + lean, 14 + bob + castLift, 6, 4, "#705139");
  px(ctx, 38 + lean, 12 + bob + castLift, 4, 2, "#82d174");
  px(ctx, 39 + lean, 20 + bob + castLift, 3, 3, "#82d174");
  px(ctx, 8 + lean, 21 + bob + castLift, 4, 12, "#e9e8ef");
  px(ctx, 10 + lean, 23 + bob + castLift, 2, 10, "#c1a3d5");
  return { canvas, anchorX: 24, anchorY: 41 };
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

const barkDark = "#4a3122";

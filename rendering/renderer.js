import {
  CAMERA_SCREEN_Y,
  ISO_SCALE_X,
  ISO_SCALE_Y,
  getProjectedArenaBounds,
  projectWorld,
} from "../core/projection.js";
import { NPC_DEFS } from "../data/storyData.js";
import { drawHud } from "../ui/hud.js";

let backgroundCache = null;
let backgroundCacheKey = "";

export function renderGame(ctx, state) {
  const { viewport, arena, player } = state;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  if (!arena || !player) return;

  ctx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = arena.theme.boundary;
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  const origin = getWorldOrigin(state);
  drawBackground(ctx, arena, origin);
  drawSceneHazards(ctx, state, origin);
  drawEncounterGround(ctx, state, origin);
  drawGroundEffects(ctx, state, origin);
  drawExitMarkers(ctx, state, origin);
  drawProjectiles(ctx, state, origin);
  drawSortedWorld(ctx, state, origin);
  drawHostileProjectiles(ctx, state, origin);
  drawSwings(ctx, state, origin);
  drawParticles(ctx, state, origin);

  drawHud(ctx, state, player.abilityInfo);
}

function getWorldOrigin(state) {
  const shakeX = state.shake > 0 ? Math.round((Math.random() - 0.5) * state.shake) : 0;
  const shakeY = state.shake > 0 ? Math.round((Math.random() - 0.5) * state.shake) : 0;

  return {
    x: Math.round(state.viewport.width / 2 - state.camera.x + shakeX),
    y: Math.round(state.viewport.height * CAMERA_SCREEN_Y - state.camera.y + shakeY),
  };
}

function toScreen(origin, x, y, height = 0) {
  const point = projectWorld(x, y, height);
  return { x: Math.round(point.x + origin.x), y: Math.round(point.y + origin.y) };
}

function drawBackground(ctx, arena, origin) {
  const key = [arena.sceneId, arena.width, arena.height, arena.biomeId, arena.sceneStyle].join("|");

  if (!backgroundCache || backgroundCacheKey !== key) {
    backgroundCache = buildBackground(arena);
    backgroundCacheKey = key;
  }

  ctx.drawImage(
    backgroundCache.canvas,
    Math.round(origin.x - backgroundCache.offsetX),
    Math.round(origin.y - backgroundCache.offsetY)
  );
}

function buildBackground(arena) {
  const bounds = getProjectedArenaBounds(arena);
  const margin = 280;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(bounds.maxX - bounds.minX + margin * 2);
  canvas.height = Math.ceil(bounds.maxY - bounds.minY + margin * 2 + 220);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const offsetX = Math.round(-bounds.minX + margin);
  const offsetY = Math.round(-bounds.minY + margin);

  drawTileMap(ctx, arena, offsetX, offsetY);
  drawBackdropGlow(ctx, arena, offsetX, offsetY);

  return { canvas, offsetX, offsetY };
}

function drawTileMap(ctx, arena, offsetX, offsetY) {
  const halfW = Math.round(arena.tileSize * ISO_SCALE_X);
  const halfH = Math.round(arena.tileSize * ISO_SCALE_Y);

  for (let ty = 0; ty < arena.rows; ty += 1) {
    for (let tx = 0; tx < arena.cols; tx += 1) {
      const worldX = tx * arena.tileSize + arena.tileSize / 2;
      const worldY = ty * arena.tileSize + arena.tileSize / 2;
      const point = projectWorld(worldX, worldY);
      drawTile(ctx, Math.round(point.x + offsetX), Math.round(point.y + offsetY), halfW, halfH, arena.tiles[ty][tx], arena.theme);
    }
  }
}

function drawTile(ctx, x, y, halfW, halfH, tile, theme) {
  const palette = getGroundPalette(tile.ground, tile.variant, theme);
  drawDiamond(ctx, x, y, halfW, halfH, palette.base);
  drawDiamondStroke(ctx, x, y, halfW, halfH, palette.edge);
  drawHalfDiamond(ctx, x, y - 1, halfW - 1, halfH - 1, palette.highlight);
  drawFooting(ctx, x, y, halfW, halfH, palette.shadow);

  if (tile.overlay === "clover") {
    pixelRect(ctx, x - 2, y - 1, 2, 2, "#79bf69");
    pixelRect(ctx, x + 1, y, 2, 2, "#8ccf78");
  }

  if (tile.overlay === "flowersWarm") {
    pixelRect(ctx, x - 4, y - 2, 2, 2, "#ffcf75");
    pixelRect(ctx, x + 1, y - 1, 2, 2, "#ff97a6");
  }

  if (tile.overlay === "flowersCool") {
    pixelRect(ctx, x - 3, y - 2, 2, 2, "#93e5ff");
    pixelRect(ctx, x + 2, y, 2, 2, "#d2f5ff");
  }

  if (tile.overlay === "reeds") {
    pixelRect(ctx, x - 2, y - 4, 2, 6, "#8bc07f");
    pixelRect(ctx, x + 1, y - 3, 2, 5, "#a4d59b");
  }

  if (tile.overlay === "frostFlowers") {
    pixelRect(ctx, x - 4, y - 2, 2, 2, "#d9f4ff");
    pixelRect(ctx, x + 1, y - 1, 2, 2, "#b0ddff");
  }
}

function getGroundPalette(ground, variant, theme) {
  if (ground === "path" || ground === "planks") {
    const bases = ["#99835a", "#8a7650", "#a89267"];
    return {
      base: bases[variant % bases.length],
      edge: "#5f4d31",
      highlight: "#cdb88b",
      shadow: "#6a5736",
    };
  }

  if (ground === "soil" || ground === "ash" || ground === "ashPath") {
    const bases = ground === "ashPath" ? ["#7d6250", "#6e5647"] : ["#6f513a", "#7a5d43", "#5e4331"];
    return {
      base: bases[variant % bases.length],
      edge: ground === "ashPath" ? "#4d392e" : "#503828",
      highlight: ground === "ashPath" ? "#a78b73" : "#9a7957",
      shadow: "#463225",
    };
  }

  if (ground === "water" || ground === "ice") {
    return {
      base: ground === "ice" ? "#7cb9db" : "#326c6b",
      edge: ground === "ice" ? "#5c8fb1" : "#1c3f47",
      highlight: ground === "ice" ? "#dff5ff" : "#5fa2a0",
      shadow: ground === "ice" ? "#4f7392" : "#24474d",
    };
  }

  if (ground === "snow" || ground === "snowPath") {
    return {
      base: ground === "snowPath" ? "#bac6d4" : ["#dce8f1", "#ccdbe7", "#e5eef5"][variant % 3],
      edge: "#8e9ca8",
      highlight: "#f7fcff",
      shadow: "#a8b8c5",
    };
  }

  if (ground === "emberGrass" || ground === "ember") {
    return {
      base: ground === "ember" ? ["#924b33", "#a75938"][variant % 2] : ["#55322a", "#633b2f", "#714638"][variant % 3],
      edge: "#35201b",
      highlight: ground === "ember" ? "#ffc877" : "#96604c",
      shadow: "#2a1815",
    };
  }

  if (ground === "ruinStone") {
    return {
      base: ["#736868", "#817677", "#8d8180"][variant % 3],
      edge: "#4c4343",
      highlight: "#b6a9a8",
      shadow: "#615858",
    };
  }

  if (ground === "blight") {
    return {
      base: ["#402423", "#4d2b29", "#55312e"][variant % 3],
      edge: "#231110",
      highlight: "#7d4740",
      shadow: "#281514",
    };
  }

  return {
    base: [theme.groundDark, theme.groundMid, theme.groundLight][variant % 3],
    edge: theme.boundaryStroke,
    highlight: theme.grass,
    shadow: theme.groundBase,
  };
}

function drawBackdropGlow(ctx, arena, offsetX, offsetY) {
  const bounds = getProjectedArenaBounds(arena);
  const center = {
    x: Math.round((bounds.minX + bounds.maxX) / 2 + offsetX),
    y: Math.round(bounds.minY + 170 + offsetY),
  };

  const color =
    arena.sceneStyle === "emberpineGrove"
      ? "rgba(255, 153, 97, 0.12)"
      : arena.sceneStyle === "frostveilTundra"
        ? "rgba(170, 220, 255, 0.12)"
        : arena.sceneStyle === "hollowheartRuins"
          ? "rgba(176, 83, 74, 0.12)"
          : "rgba(207, 235, 163, 0.08)";

  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(center.x, center.y, 420, 180, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSceneHazards(ctx, state, origin) {
  for (const hazard of state.arena.hazards || []) {
    const corners = [
      toScreen(origin, hazard.x, hazard.y),
      toScreen(origin, hazard.x + hazard.w, hazard.y),
      toScreen(origin, hazard.x + hazard.w, hazard.y + hazard.h),
      toScreen(origin, hazard.x, hazard.y + hazard.h),
    ];

    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = hazard.type === "ember" ? "#ff9a52" : "#a54b42";
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < corners.length; i += 1) {
      ctx.lineTo(corners[i].x, corners[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawEncounterGround(ctx, state, origin) {
  if (state.encounter.zoneAlpha <= 0.02) return;

  const zone = state.arena.bossZone;
  const pulse = Math.sin(state.time * 2.2) * 6;
  ctx.save();
  ctx.globalAlpha = 0.22 + state.encounter.zoneAlpha * 0.18;
  drawIsoRing(ctx, origin, zone.x, zone.y, zone.radius + pulse, 18, "#f0c56c");
  drawIsoRing(ctx, origin, zone.x, zone.y, zone.radius - 20 + pulse, 18, "#8fda6b");
  ctx.restore();
}

function drawGroundEffects(ctx, state, origin) {
  for (const root of state.roots) {
    const progress = Math.max(0, root.life / root.maxLife);
    const pulse = Math.sin((state.time + root.pulse) * 10) * 2;

    ctx.save();
    ctx.globalAlpha = 0.44 + progress * 0.24;
    for (let i = 0; i < 12; i += 1) {
      const angle = (Math.PI * 2 * i) / 12;
      const inner = 12 + (i % 2) * 4;
      const outer = root.radius - 6 + pulse;
      const x1 = root.x + Math.cos(angle) * inner;
      const y1 = root.y + Math.sin(angle) * inner;
      const x2 = root.x + Math.cos(angle) * outer;
      const y2 = root.y + Math.sin(angle) * outer;
      drawIsoLine(ctx, origin, x1, y1, x2, y2, 4, "#76df66");
    }
    ctx.restore();
  }

  for (const hazard of state.eruptions) {
    ctx.save();
    ctx.globalAlpha = hazard.warning > 0 ? 0.34 : 0.46;
    drawIsoRing(
      ctx,
      origin,
      hazard.x,
      hazard.y,
      hazard.radius + (hazard.warning > 0 ? 0 : 4),
      12,
      hazard.warning > 0 ? "#f2c26a" : "#9bef75"
    );
    ctx.restore();
  }

  drawBossTelegraphs(ctx, state, origin);
}

function drawExitMarkers(ctx, state, origin) {
  for (const exit of state.arena.exits) {
    const active = state.nearExit?.id === exit.id;
    const center = toScreen(origin, exit.x + exit.w / 2, exit.y + exit.h / 2);

    ctx.save();
    ctx.globalAlpha = active ? 0.92 : 0.5;
    drawExitArrow(ctx, center.x, center.y, exit.direction);
    if (active) {
      pixelRect(ctx, center.x - 30, center.y - 26, 60, 6, "#1b1412");
      pixelRect(ctx, center.x - 29, center.y - 25, Math.round(58 * state.exitCharge), 4, "#fff0ad");
    }
    ctx.restore();
  }
}

function drawExitArrow(ctx, x, y, direction) {
  const color = "#fff0ad";

  if (direction === "right") {
    pixelRect(ctx, x - 10, y - 4, 18, 8, color);
    pixelRect(ctx, x + 6, y - 8, 8, 16, color);
  } else if (direction === "left") {
    pixelRect(ctx, x - 8, y - 4, 18, 8, color);
    pixelRect(ctx, x - 14, y - 8, 8, 16, color);
  } else if (direction === "up") {
    pixelRect(ctx, x - 4, y - 12, 8, 18, color);
    pixelRect(ctx, x - 8, y - 16, 16, 8, color);
  } else if (direction === "down") {
    pixelRect(ctx, x - 4, y - 6, 8, 18, color);
    pixelRect(ctx, x - 8, y + 8, 16, 8, color);
  }
}

function drawBossTelegraphs(ctx, state, origin) {
  const boss = state.boss;
  if (!boss || boss.dead || !boss.currentAttack) return;

  if (boss.currentAttack.type === "slam") {
    ctx.save();
    ctx.globalAlpha = 0.58;
    drawIsoRing(
      ctx,
      origin,
      boss.currentAttack.targetX,
      boss.currentAttack.targetY,
      boss.currentAttack.radius + Math.sin(state.time * 14) * 3,
      14,
      "#ffbb72"
    );
    ctx.restore();
  }

  if (boss.currentAttack.type === "volley") {
    ctx.save();
    ctx.globalAlpha = 0.58;
    for (let i = -2; i <= 2; i += 1) {
      const angle = boss.facing + i * 0.18;
      drawIsoLine(
        ctx,
        origin,
        boss.x + Math.cos(angle) * 24,
        boss.y + Math.sin(angle) * 24,
        boss.x + Math.cos(angle) * 84,
        boss.y + Math.sin(angle) * 84,
        4,
        "#f1cf77"
      );
    }
    ctx.restore();
  }
}

function drawProjectiles(ctx, state, origin) {
  for (const projectile of state.projectiles) {
    const point = toScreen(origin, projectile.x, projectile.y, 18);
    drawSpiritBolt(ctx, point.x, point.y);
  }
}

function drawSpiritBolt(ctx, x, y) {
  pixelRect(ctx, x - 6, y - 2, 12, 4, "#dff9ff");
  pixelRect(ctx, x - 4, y - 5, 8, 8, "#69dbff");
  pixelRect(ctx, x - 2, y - 7, 4, 12, "#8be9ff");
}

function drawHostileProjectiles(ctx, state, origin) {
  for (const projectile of state.hostileProjectiles) {
    const point = toScreen(origin, projectile.x, projectile.y, 18);
    ctx.save();
    ctx.translate(point.x, point.y);
    pixelRect(ctx, -7, -2, 14, 4, projectile.type === "wisp" ? "#9acdf7" : "#7f3024");
    pixelRect(ctx, -2, -5, 8, 8, projectile.type === "wisp" ? "#dff5ff" : "#cf6448");
    ctx.restore();
  }
}

function drawSortedWorld(ctx, state, origin) {
  const renderables = [
    ...state.arena.obstacles.map((obstacle) => ({
      kind: "obstacle",
      item: obstacle,
      y: obstacle.sortY,
    })),
    ...state.arena.interactables
      .filter((entry) => !entry.disabled)
      .map((entry) => ({ kind: "interactable", item: entry, y: entry.sortY })),
    ...state.arena.npcs.map((entry) => ({ kind: "npc", item: entry, y: entry.sortY })),
    ...state.afterImages.map((entry) => ({ kind: "afterImage", item: entry, y: entry.y })),
    ...state.enemies.map((entry) => ({ kind: "enemy", item: entry, y: entry.y + entry.radius })),
    ...(state.boss && !state.boss.dead
      ? [{ kind: "boss", item: state.boss, y: state.boss.y + state.boss.radius + 10 }]
      : []),
    { kind: "player", item: state.player, y: state.player.y + state.player.radius },
  ];

  renderables.sort((a, b) => a.y - b.y);

  for (const renderable of renderables) {
    if (renderable.kind === "obstacle") drawObstacle(ctx, renderable.item, state.arena.theme, origin);
    if (renderable.kind === "interactable") drawInteractable(ctx, renderable.item, origin);
    if (renderable.kind === "npc") drawNpc(ctx, renderable.item, origin);
    if (renderable.kind === "afterImage") drawAfterImage(ctx, renderable.item, origin);
    if (renderable.kind === "enemy") drawEnemy(ctx, renderable.item, state, origin);
    if (renderable.kind === "boss") drawBoss(ctx, renderable.item, state, origin);
    if (renderable.kind === "player") drawPlayer(ctx, renderable.item, origin);
  }
}

function drawObstacle(ctx, obstacle, theme, origin) {
  if (obstacle.type === "tree" || obstacle.type === "charredTree") drawTree(ctx, obstacle, theme, origin);
  if (obstacle.type === "rock" || obstacle.type === "iceRock") drawRock(ctx, obstacle, theme, origin);
  if (obstacle.type === "bush") drawBush(ctx, obstacle, origin);
  if (obstacle.type === "water") drawWater(ctx, obstacle, origin);
  if (obstacle.type === "ruin") drawRuin(ctx, obstacle, origin);
  if (obstacle.type === "cottage") drawCottage(ctx, obstacle, origin);
  if (obstacle.type === "well") drawWell(ctx, obstacle, origin);
  if (obstacle.type === "fenceH" || obstacle.type === "fenceV") drawFence(ctx, obstacle, origin);
  if (obstacle.type === "signpost") drawSignpost(ctx, obstacle, origin);
  if (obstacle.type === "lantern") drawLantern(ctx, obstacle, origin);
  if (obstacle.type === "bridge") drawBridge(ctx, obstacle, origin);
}

function drawTree(ctx, tree, theme, origin) {
  const point = toScreen(origin, tree.anchorX, tree.anchorY);
  drawIsoShadow(ctx, point.x, point.y, 34, 14);
  pixelRect(ctx, point.x - 6, point.y - 52, 12, 40, tree.type === "charredTree" ? "#4b2a24" : theme.trunk);
  pixelRect(ctx, point.x - 4, point.y - 50, 4, 28, theme.trunkLight);

  const canopyDark = tree.type === "charredTree" ? "#3a1d18" : theme.treeDark;
  const canopyMid = tree.type === "charredTree" ? "#5d3028" : theme.treeMid;
  const canopyLight = tree.type === "charredTree" ? "#8c4a39" : theme.treeLight;
  pixelRect(ctx, point.x - 40, point.y - 88, 80, 20, canopyDark);
  pixelRect(ctx, point.x - 52, point.y - 72, 104, 24, canopyMid);
  pixelRect(ctx, point.x - 34, point.y - 104, 68, 22, canopyMid);
  pixelRect(ctx, point.x - 22, point.y - 94, 44, 16, canopyLight);
}

function drawRock(ctx, rock, theme, origin) {
  const point = toScreen(origin, rock.anchorX, rock.anchorY);
  drawIsoShadow(ctx, point.x, point.y, 26, 10);
  pixelRect(ctx, point.x - 26, point.y - 24, 52, 18, rock.type === "iceRock" ? "#9cb7ce" : theme.rockBase);
  pixelRect(ctx, point.x - 18, point.y - 30, 36, 12, rock.type === "iceRock" ? "#d5ecff" : theme.rockLight);
  pixelRect(ctx, point.x - 12, point.y - 12, 24, 8, rock.type === "iceRock" ? "#7a97b5" : theme.rockBase);
}

function drawBush(ctx, bush, origin) {
  const point = toScreen(origin, bush.anchorX, bush.anchorY);
  drawIsoShadow(ctx, point.x, point.y, 20, 8);
  pixelRect(ctx, point.x - 24, point.y - 18, 48, 14, bush.style === "ember" ? "#8b4d36" : bush.style === "frost" ? "#8baec8" : "#3d7c43");
  pixelRect(ctx, point.x - 18, point.y - 26, 36, 12, bush.style === "ember" ? "#b96749" : bush.style === "frost" ? "#c7e7ff" : "#68a15d");
}

function drawWater(ctx, water, origin) {
  const corners = [
    toScreen(origin, water.x, water.y),
    toScreen(origin, water.x + water.w, water.y),
    toScreen(origin, water.x + water.w, water.y + water.h),
    toScreen(origin, water.x, water.y + water.h),
  ];

  ctx.save();
  ctx.fillStyle = water.style === "ice" ? "rgba(145, 195, 222, 0.82)" : "rgba(49, 109, 108, 0.8)";
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < corners.length; i += 1) {
    ctx.lineTo(corners[i].x, corners[i].y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawRuin(ctx, ruin, origin) {
  const point = toScreen(origin, ruin.anchorX, ruin.anchorY);
  drawIsoShadow(ctx, point.x, point.y, 30, 12);
  pixelRect(ctx, point.x - ruin.w * 0.18, point.y - ruin.h * 0.48, ruin.w * 0.36, ruin.h * 0.26, "#756b6a");
  pixelRect(ctx, point.x - ruin.w * 0.24, point.y - ruin.h * 0.34, ruin.w * 0.48, ruin.h * 0.2, "#908684");
  pixelRect(ctx, point.x - ruin.w * 0.1, point.y - ruin.h * 0.2, ruin.w * 0.2, ruin.h * 0.12, "#c3b6aa");
}

function drawCottage(ctx, cottage, origin) {
  const point = toScreen(origin, cottage.anchorX, cottage.anchorY);
  drawIsoShadow(ctx, point.x, point.y, 54, 18);
  pixelRect(ctx, point.x - 74, point.y - 118, 148, 36, "#8d4d42");
  pixelRect(ctx, point.x - 90, point.y - 82, 180, 24, "#b05e52");
  pixelRect(ctx, point.x - 68, point.y - 58, 136, 56, "#dcc89d");
  pixelRect(ctx, point.x - 18, point.y - 42, 36, 44, "#6f4b30");
  pixelRect(ctx, point.x - 52, point.y - 44, 28, 18, "#a8ddf2");
  pixelRect(ctx, point.x + 26, point.y - 44, 28, 18, "#a8ddf2");
}

function drawWell(ctx, well, origin) {
  const point = toScreen(origin, well.anchorX, well.anchorY);
  drawIsoShadow(ctx, point.x, point.y, 18, 8);
  pixelRect(ctx, point.x - 18, point.y - 26, 36, 10, "#7c5739");
  pixelRect(ctx, point.x - 12, point.y - 16, 24, 18, "#93a3a7");
  pixelRect(ctx, point.x - 10, point.y - 12, 20, 8, "#517789");
}

function drawFence(ctx, fence, origin) {
  const point = toScreen(origin, fence.anchorX, fence.anchorY);
  drawIsoShadow(ctx, point.x, point.y, 16, 6);
  pixelRect(ctx, point.x - fence.w * 0.18, point.y - 18, fence.w * 0.36, 4, "#c49a64");
  pixelRect(ctx, point.x - fence.w * 0.18, point.y - 10, fence.w * 0.36, 4, "#8f633d");
}

function drawSignpost(ctx, sign, origin) {
  const point = toScreen(origin, sign.anchorX, sign.anchorY);
  drawIsoShadow(ctx, point.x, point.y, 10, 4);
  pixelRect(ctx, point.x - 3, point.y - 20, 6, 18, "#6b4a2e");
  pixelRect(ctx, point.x - 14, point.y - 30, 28, 10, "#d7be86");
}

function drawLantern(ctx, lantern, origin) {
  const point = toScreen(origin, lantern.anchorX, lantern.anchorY);
  drawIsoShadow(ctx, point.x, point.y, 8, 4);
  pixelRect(ctx, point.x - 2, point.y - 24, 4, 22, "#6e4a34");
  pixelRect(
    ctx,
    point.x - 6,
    point.y - 34,
    12,
    10,
    lantern.style === "cool" ? "#b2e4ff" : lantern.style === "frost" ? "#d4f2ff" : "#efcf79"
  );
}

function drawBridge(ctx, bridge, origin) {
  const corners = [
    toScreen(origin, bridge.x, bridge.y),
    toScreen(origin, bridge.x + bridge.w, bridge.y),
    toScreen(origin, bridge.x + bridge.w, bridge.y + bridge.h),
    toScreen(origin, bridge.x, bridge.y + bridge.h),
  ];

  ctx.save();
  ctx.fillStyle = "#8d6d45";
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < corners.length; i += 1) ctx.lineTo(corners[i].x, corners[i].y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawInteractable(ctx, item, origin) {
  const point = toScreen(origin, item.anchorX, item.anchorY);

  if (item.type === "flower") {
    drawIsoShadow(ctx, point.x, point.y, 8, 4);
    pixelRect(ctx, point.x - 2, point.y - 12, 4, 10, "#6bbd62");
    pixelRect(ctx, point.x - 7, point.y - 16, 6, 6, "#8cdcff");
    pixelRect(ctx, point.x + 1, point.y - 18, 6, 6, "#f1f3ad");
  }

  if (item.type === "corruptedRoot") {
    drawIsoShadow(ctx, point.x, point.y, 16, 6);
    pixelRect(ctx, point.x - 14, point.y - 12, 28, 8, "#5f332d");
    pixelRect(ctx, point.x - 10, point.y - 18, 20, 6, "#9ce26e");
  }

  if (item.type === "totem") {
    drawIsoShadow(ctx, point.x, point.y, 12, 6);
    pixelRect(ctx, point.x - 5, point.y - 26, 10, 24, "#7a5535");
    pixelRect(ctx, point.x - 11, point.y - 36, 22, 10, "#efb56d");
    pixelRect(ctx, point.x - 4, point.y - 33, 8, 6, "#dfffb0");
  }

  if (item.type === "scout") {
    drawIsoShadow(ctx, point.x, point.y, 14, 6);
    pixelRect(ctx, point.x - 12, point.y - 14, 24, 12, "#6b7b87");
    pixelRect(ctx, point.x - 4, point.y - 24, 8, 10, "#cfdde8");
  }
}

function drawNpc(ctx, npc, origin) {
  const point = toScreen(origin, npc.anchorX, npc.anchorY);
  const palette = NPC_DEFS[npc.id]?.palette || npc.palette;
  drawActor(ctx, point.x, point.y, palette.hood, palette.cloak, palette.accent, false);
}

function drawAfterImage(ctx, image, origin) {
  const point = toScreen(origin, image.x, image.y, 18);
  ctx.save();
  ctx.globalAlpha = Math.max(0, image.life / image.maxLife) * 0.32;
  drawActor(ctx, point.x, point.y, "#f1fff9", "#9fdcc8", "#dffaf2", true);
  ctx.restore();
}

function drawPlayer(ctx, player, origin) {
  const point = toScreen(origin, player.x, player.y, 18);
  drawActor(
    ctx,
    point.x,
    point.y,
    player.hurtFlash > 0 ? "#ffd7ca" : "#f6f4ef",
    player.dashTime > 0 ? "#9af0d2" : "#6dae67",
    "#8cdcc2",
    player.invulnerable > 0
  );
}

function drawActor(ctx, x, y, hoodColor, cloakColor, accentColor, flicker) {
  ctx.save();
  if (flicker && Math.floor(performance.now() / 55) % 2 === 0) {
    ctx.globalAlpha *= 0.7;
  }

  drawIsoShadow(ctx, x, y + 2, 12, 5);
  pixelRect(ctx, x - 10, y - 34, 20, 8, "#d4d2cc");
  pixelRect(ctx, x - 12, y - 26, 24, 12, hoodColor);
  pixelRect(ctx, x - 8, y - 14, 16, 18, cloakColor);
  pixelRect(ctx, x - 4, y - 18, 8, 6, "#2c312f");
  pixelRect(ctx, x - 2, y + 4, 4, 6, "#5f442d");
  pixelRect(ctx, x + 8, y - 22, 18, 4, "#7a5534");
  pixelRect(ctx, x + 22, y - 24, 6, 8, accentColor);
  ctx.restore();
}

function drawEnemy(ctx, enemy, state, origin) {
  const point = toScreen(origin, enemy.x, enemy.y, 16);

  if (enemy.type === "mire_brute") {
    drawIsoShadow(ctx, point.x, point.y + 2, 18, 6);
    pixelRect(ctx, point.x - 16, point.y - 30, 32, 12, enemy.hitFlash > 0 ? "#ffd9bf" : "#6c2f26");
    pixelRect(ctx, point.x - 20, point.y - 18, 40, 18, enemy.hitFlash > 0 ? "#ffc7a5" : "#874132");
    pixelRect(ctx, point.x - 12, point.y, 24, 12, "#b06a48");
  } else if (enemy.type === "wisp_archer") {
    drawIsoShadow(ctx, point.x, point.y + 2, 14, 5);
    pixelRect(ctx, point.x - 12, point.y - 28, 24, 10, enemy.hitFlash > 0 ? "#e8f4ff" : "#6a7ea0");
    pixelRect(ctx, point.x - 14, point.y - 18, 28, 14, enemy.hitFlash > 0 ? "#cde5ff" : "#89a7cf");
    pixelRect(ctx, point.x - 4, point.y - 4, 8, 10, "#dff5ff");
    pixelRect(ctx, point.x + 10, point.y - 22, 14, 3, "#e1f1ff");
  } else {
    drawIsoShadow(ctx, point.x, point.y + 2, 12, 5);
    pixelRect(ctx, point.x - 10, point.y - 24, 20, 10, enemy.hitFlash > 0 ? "#ffd8cf" : "#5d1b24");
    pixelRect(ctx, point.x - 14, point.y - 14, 28, 12, enemy.hitFlash > 0 ? "#ffb7aa" : "#7b2631");
    pixelRect(ctx, point.x - 8, point.y - 2, 16, 10, "#ba4e5c");
  }

  drawEnemyStatus(ctx, enemy, state, origin);
  drawEnemyHealth(ctx, enemy, point.x, point.y);
}

function drawBoss(ctx, boss, state, origin) {
  const point = toScreen(origin, boss.x, boss.y, 26);
  drawIsoShadow(ctx, point.x, point.y + 4, 28, 10);
  pixelRect(ctx, point.x - 34, point.y - 54, 68, 22, boss.hitFlash > 0 ? "#ffd5bf" : "#552219");
  pixelRect(ctx, point.x - 40, point.y - 32, 80, 28, boss.hitFlash > 0 ? "#ffbd95" : "#6c3024");
  pixelRect(ctx, point.x - 22, point.y - 2, 44, 18, "#874232");
  pixelRect(ctx, point.x + 12, point.y - 24, 12, 10, "#f0cc75");
  drawBossStatus(ctx, boss, state, origin);
}

function drawEnemyStatus(ctx, enemy, state, origin) {
  if (enemy.rooted > 0) {
    ctx.save();
    ctx.globalAlpha = 0.78;
    drawIsoRing(ctx, origin, enemy.x, enemy.y, enemy.radius + 8, 8, "#83e26e");
    ctx.restore();
  }

  if (enemy.bloom > 0) {
    const radius = enemy.radius + 12;
    ctx.save();
    ctx.globalAlpha = 0.72;
    drawIsoRing(ctx, origin, enemy.x, enemy.y, radius, 8, "#eff59a");
    ctx.restore();
  }

  if (enemy.state === "windup") {
    ctx.save();
    ctx.globalAlpha = 0.72;
    drawIsoRing(
      ctx,
      origin,
      enemy.x,
      enemy.y,
      enemy.radius + 12,
      8,
      enemy.type === "mire_brute" ? "#ffb45d" : "#ffd27a"
    );
    ctx.restore();
  }
}

function drawBossStatus(ctx, boss, state, origin) {
  if (boss.rooted > 0) {
    ctx.save();
    ctx.globalAlpha = 0.8;
    drawIsoRing(ctx, origin, boss.x, boss.y, boss.radius + 10, 10, "#89e86c");
    ctx.restore();
  }

  if (boss.bloom > 0) {
    ctx.save();
    ctx.globalAlpha = 0.8;
    drawIsoRing(ctx, origin, boss.x, boss.y, boss.radius + 18, 10, "#f3f49b");
    ctx.restore();
  }
}

function drawEnemyHealth(ctx, enemy, x, y) {
  const width = enemy.type === "mire_brute" ? 44 : 36;
  const ratio = Math.max(0, enemy.hp / enemy.maxHp);
  pixelRect(ctx, x - width / 2, y - 42, width, 6, "#1b1412");
  pixelRect(
    ctx,
    x - width / 2 + 1,
    y - 41,
    Math.round((width - 2) * ratio),
    4,
    enemy.type === "mire_brute" ? "#ef7b58" : enemy.type === "wisp_archer" ? "#8fd9ff" : "#e05256"
  );
}

function drawSwings(ctx, state, origin) {
  for (const swing of state.swings) {
    const ratio = Math.max(0, swing.life / swing.maxLife);
    ctx.save();
    ctx.globalAlpha = ratio;
    const steps = 7;
    for (let i = 0; i < steps; i += 1) {
      const t = i / (steps - 1);
      const angle = swing.angle - swing.arc / 2 + swing.arc * t;
      const radius = swing.range - 10 + (i % 2) * 4;
      const x = swing.x + Math.cos(angle) * radius;
      const y = swing.y + Math.sin(angle) * radius;
      const point = toScreen(origin, x, y, 18);
      pixelRect(ctx, point.x - 5, point.y - 3, 10, 6, "#fff0a8");
      pixelRect(ctx, point.x - 3, point.y - 1, 6, 2, "#8bdc75");
    }
    ctx.restore();
  }
}

function drawParticles(ctx, state, origin) {
  for (const particle of state.particles) {
    const alpha = Math.max(0, particle.life / particle.maxLife);
    const point = toScreen(origin, particle.x, particle.y, 10);
    ctx.save();
    ctx.globalAlpha = alpha;
    pixelRect(
      ctx,
      point.x - particle.size / 2,
      point.y - particle.size / 2,
      Math.max(1, Math.round(particle.size)),
      Math.max(1, Math.round(particle.size)),
      particle.color
    );
    ctx.restore();
  }
}

function drawDiamond(ctx, x, y, halfW, halfH, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - halfH);
  ctx.lineTo(x + halfW, y);
  ctx.lineTo(x, y + halfH);
  ctx.lineTo(x - halfW, y);
  ctx.closePath();
  ctx.fill();
}

function drawDiamondStroke(ctx, x, y, halfW, halfH, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y - halfH);
  ctx.lineTo(x + halfW, y);
  ctx.lineTo(x, y + halfH);
  ctx.lineTo(x - halfW, y);
  ctx.closePath();
  ctx.stroke();
}

function drawHalfDiamond(ctx, x, y, halfW, halfH, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - halfH);
  ctx.lineTo(x + halfW - 1, y);
  ctx.lineTo(x, y + 1);
  ctx.lineTo(x - halfW + 1, y);
  ctx.closePath();
  ctx.fill();
}

function drawFooting(ctx, x, y, halfW, halfH, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - halfW, y);
  ctx.lineTo(x, y + halfH);
  ctx.lineTo(x + halfW, y);
  ctx.lineTo(x, y + halfH - 2);
  ctx.closePath();
  ctx.fill();
}

function drawIsoRing(ctx, origin, cx, cy, radius, size, color) {
  const steps = Math.max(14, Math.floor(radius / 8));
  for (let i = 0; i < steps; i += 1) {
    const angle = (Math.PI * 2 * i) / steps;
    const point = toScreen(origin, cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, 1);
    pixelRect(ctx, point.x - size / 2, point.y - size / 2, size, size, color);
  }
}

function drawIsoLine(ctx, origin, x1, y1, x2, y2, size, color) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / size));

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const point = toScreen(origin, x1 + dx * t, y1 + dy * t, 1);
    pixelRect(ctx, point.x - size / 2, point.y - size / 2, size, size, color);
  }
}

function drawIsoShadow(ctx, x, y, halfW, halfH) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
  ctx.beginPath();
  ctx.ellipse(x, y, halfW, halfH, 0, 0, Math.PI * 2);
  ctx.fill();
}

function pixelRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

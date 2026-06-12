import {
  CAMERA_SCREEN_Y,
  ISO_SCALE_X,
  ISO_SCALE_Y,
  getProjectedArenaBounds,
  projectWorld,
} from "../core/projection.js";
import { NPC_DEFS } from "../data/storyData.js";
import {
  drawAylaAtlasSprite,
  drawBiomeProp,
  getAtlasRevision,
} from "./atlasAssets.js";
import {
  drawPixelSprite,
  getActorSprite,
  getBossSprite,
  getEnemySprite,
  getProjectileSprite,
  resolveFacing,
} from "./pixelAssets.js";
import { drawTerrainTile } from "./terrainAssets.js";
import { drawHud } from "../ui/hud.js";

let backgroundCache = null;
let backgroundCacheKey = "";

export function renderGame(ctx, state, options = {}) {
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
  if (state.debugCollision) drawCollisionDebug(ctx, state, origin);
  drawHostileProjectiles(ctx, state, origin);
  drawSwings(ctx, state, origin);
  drawParticles(ctx, state, origin);
  drawSceneAtmosphere(ctx, state);

  if (options.showHud !== false) {
    drawHud(ctx, state, player.abilityInfo);
  }
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
  const key = [
    arena.sceneId,
    arena.width,
    arena.height,
    arena.biomeId,
    arena.sceneStyle,
    getAtlasRevision(),
  ].join("|");

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
      drawTile(
        ctx,
        Math.round(point.x + offsetX),
        Math.round(point.y + offsetY),
        halfW,
        halfH,
        arena.tiles[ty][tx],
        arena.theme,
        arena.sceneStyle,
        tx,
        ty,
        {
          topLeft: arena.tiles[ty]?.[tx - 1]?.ground || null,
          topRight: arena.tiles[ty - 1]?.[tx]?.ground || null,
          bottomRight: arena.tiles[ty]?.[tx + 1]?.ground || null,
          bottomLeft: arena.tiles[ty + 1]?.[tx]?.ground || null,
        }
      );
    }
  }
}

function drawTile(ctx, x, y, halfW, halfH, tile, theme, sceneStyle, tx, ty, neighbors) {
  drawTerrainTile(ctx, {
    x,
    y,
    halfW,
    halfH,
    tile,
    theme,
    sceneStyle,
    tx,
    ty,
    neighbors,
  });
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
        : arena.sceneStyle === "chapelOfTides"
          ? "rgba(134, 206, 224, 0.12)"
          : arena.sceneStyle === "starfallSanctum"
            ? "rgba(208, 214, 255, 0.13)"
          : arena.sceneStyle === "hollowheartRuins"
            ? "rgba(176, 83, 74, 0.12)"
          : arena.sceneStyle === "ancientHeart" || arena.sceneStyle === "sunkenReliquary"
            ? "rgba(198, 174, 255, 0.11)"
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
    ctx.fillStyle =
      hazard.type === "ember"
        ? "#ff9a52"
        : hazard.type === "mire"
          ? "#5fa8b1"
          : "#a54b42";
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

  for (const pulse of state.pulses || []) {
    const progress = Math.max(0, pulse.life / pulse.maxLife);
    const radius = pulse.radius * (1.06 - progress * 0.16);

    ctx.save();
    ctx.globalAlpha = 0.18 + progress * 0.28;
    drawIsoRing(ctx, origin, pulse.x, pulse.y, radius, 14, "#9ae97d");
    drawIsoRing(ctx, origin, pulse.x, pulse.y, Math.max(22, radius - 22), 12, "#7edbff");
    for (let i = 0; i < 8; i += 1) {
      const angle = (Math.PI * 2 * i) / 8;
      const inner = 20;
      const outer = radius - 6;
      drawIsoLine(
        ctx,
        origin,
        pulse.x + Math.cos(angle) * inner,
        pulse.y + Math.sin(angle) * inner,
        pulse.x + Math.cos(angle) * outer,
        pulse.y + Math.sin(angle) * outer,
        3,
        i % 2 === 0 ? "#b8ffb0" : "#9bddff"
      );
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
      hazard.warning > 0 ? getHazardWarningColor(hazard.type, hazard.harmless) : getHazardActiveColor(hazard.type, hazard.harmless)
    );
    ctx.restore();
  }

  drawBossTelegraphs(ctx, state, origin);
}

function drawExitMarkers(ctx, state, origin) {
  for (const exit of state.arena.exits) {
    const active = state.nearExit?.id === exit.id;
    const locked = Boolean(exit.requiresFlag && !state.progression.worldFlags?.[exit.requiresFlag]);
    const center = toScreen(origin, exit.x + exit.w / 2, exit.y + exit.h / 2);

    ctx.save();
    ctx.globalAlpha = active ? 0.92 : 0.5;
    drawExitArrow(ctx, center.x, center.y, exit.direction, locked ? "#d79489" : "#fff0ad");
    if (active) {
      pixelRect(ctx, center.x - 30, center.y - 26, 60, 6, "#1b1412");
      pixelRect(
        ctx,
        center.x - 29,
        center.y - 25,
        Math.round(58 * state.exitCharge),
        4,
        locked ? "#d79489" : "#fff0ad"
      );
    }
    ctx.restore();
  }
}

function drawExitArrow(ctx, x, y, direction, color = "#fff0ad") {

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
  const slamColor = boss.identity?.slamTelegraphColor || "#ffbb72";
  const volleyColor = boss.identity?.volleyTelegraphColor || "#f1cf77";

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
      slamColor
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
        volleyColor
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
  drawPixelSprite(ctx, getProjectileSprite("spirit"), x, y);
}

function drawHostileProjectiles(ctx, state, origin) {
  for (const projectile of state.hostileProjectiles) {
    const point = toScreen(origin, projectile.x, projectile.y, 18);
    drawPixelSprite(ctx, getProjectileSprite(projectile.type || "spirit"), point.x, point.y);
  }
}

function getHazardWarningColor(type = "thorn", harmless = false) {
  if (harmless) return "#b7edd9";
  if (type === "ember") return "#ffb16d";
  if (type === "mire") return "#93dcde";
  if (type === "frost") return "#d9efff";
  if (type === "blight") return "#db9fff";
  if (type === "ancient") return "#f2dfa1";
  return "#f2c26a";
}

function getHazardActiveColor(type = "thorn", harmless = false) {
  if (harmless) return "#8fdfc5";
  if (type === "ember") return "#ff8b52";
  if (type === "mire") return "#72c1c5";
  if (type === "frost") return "#a8e1ff";
  if (type === "blight") return "#c587ff";
  if (type === "ancient") return "#ddc489";
  return "#9bef75";
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
    if (renderable.kind === "obstacle") {
      drawObstacle(ctx, renderable.item, state.arena.theme, state.arena.sceneStyle, origin);
    }
    if (renderable.kind === "interactable") drawInteractable(ctx, renderable.item, state, origin);
    if (renderable.kind === "npc") drawNpc(ctx, renderable.item, origin);
    if (renderable.kind === "afterImage") drawAfterImage(ctx, renderable.item, origin);
    if (renderable.kind === "enemy") drawEnemy(ctx, renderable.item, state, origin);
    if (renderable.kind === "boss") drawBoss(ctx, renderable.item, state, origin);
    if (renderable.kind === "player") drawPlayer(ctx, renderable.item, origin);
  }
}

function drawObstacle(ctx, obstacle, theme, sceneStyle, origin) {
  if (obstacle.type === "tree" || obstacle.type === "charredTree") {
    drawTree(ctx, obstacle, theme, sceneStyle, origin);
  }
  if (obstacle.type === "rock" || obstacle.type === "iceRock") {
    drawRock(ctx, obstacle, theme, sceneStyle, origin);
  }
  if (obstacle.type === "bush") drawBush(ctx, obstacle, sceneStyle, origin);
  if (obstacle.type === "water") drawWater(ctx, obstacle, origin);
  if (obstacle.type === "ruin") drawRuin(ctx, obstacle, sceneStyle, origin);
  if (obstacle.type === "cottage") drawCottage(ctx, obstacle, origin);
  if (obstacle.type === "well") drawWell(ctx, obstacle, origin);
  if (obstacle.type === "fenceH" || obstacle.type === "fenceV") drawFence(ctx, obstacle, sceneStyle, origin);
  if (obstacle.type === "signpost") drawSignpost(ctx, obstacle, sceneStyle, origin);
  if (obstacle.type === "lantern") drawLantern(ctx, obstacle, sceneStyle, origin);
  if (obstacle.type === "bridge") drawBridge(ctx, obstacle, sceneStyle, origin);
}

function drawTree(ctx, tree, theme, sceneStyle, origin) {
  const point = toScreen(origin, tree.anchorX, tree.anchorY);
  drawIsoShadow(ctx, point.x, point.y, 34, 14);
  if (
    drawBiomeProp(ctx, sceneStyle, "tree", point.x, point.y + 4, {
      scale: Math.max(0.72, tree.w / 112),
      variant: getPropVariant(tree, 6),
    })
  ) {
    return;
  }
  const trunkDark = tree.type === "charredTree" ? "#40231e" : theme.trunk;
  const trunkLight = tree.type === "charredTree" ? "#6b4035" : theme.trunkLight;
  const canopyDark = tree.type === "charredTree" ? "#2f1816" : theme.treeDark;
  const canopyMid = tree.type === "charredTree" ? "#4a2621" : theme.treeMid;
  const canopyLight = tree.type === "charredTree" ? "#7a4336" : theme.treeLight;

  fillPixelEllipse(ctx, point.x, point.y - 70, 40, 26, canopyDark);
  fillPixelEllipse(ctx, point.x - 22, point.y - 60, 28, 20, canopyMid);
  fillPixelEllipse(ctx, point.x + 22, point.y - 58, 28, 20, canopyMid);
  fillPixelEllipse(ctx, point.x, point.y - 88, 28, 18, canopyMid);
  fillPixelEllipse(ctx, point.x - 10, point.y - 78, 16, 10, canopyLight);
  fillPixelEllipse(ctx, point.x + 16, point.y - 76, 14, 10, canopyLight);

  pixelRect(ctx, point.x - 8, point.y - 50, 16, 38, trunkDark);
  pixelRect(ctx, point.x - 2, point.y - 48, 4, 30, trunkLight);
  pixelRect(ctx, point.x - 14, point.y - 16, 10, 4, trunkDark);
  pixelRect(ctx, point.x + 4, point.y - 16, 10, 4, trunkDark);
}

function drawRock(ctx, rock, theme, sceneStyle, origin) {
  const point = toScreen(origin, rock.anchorX, rock.anchorY);
  drawIsoShadow(ctx, point.x, point.y, 26, 10);
  if (
    drawBiomeProp(ctx, sceneStyle, rock.type, point.x, point.y + 2, {
      scale: Math.max(0.58, rock.w / 128),
      variant: getPropVariant(rock, 4),
    })
  ) {
    return;
  }
  const base = rock.type === "iceRock" ? "#95b4cb" : theme.rockBase;
  const light = rock.type === "iceRock" ? "#dff3ff" : theme.rockLight;
  const dark = rock.type === "iceRock" ? "#6d8ba4" : "#46544e";
  fillPixelEllipse(ctx, point.x, point.y - 18, 28, 16, base);
  fillPixelEllipse(ctx, point.x - 6, point.y - 24, 16, 10, light);
  pixelRect(ctx, point.x - 24, point.y - 14, 48, 6, dark);
  pixelRect(ctx, point.x - 8, point.y - 8, 16, 4, dark);
}

function drawBush(ctx, bush, sceneStyle, origin) {
  const point = toScreen(origin, bush.anchorX, bush.anchorY);
  drawIsoShadow(ctx, point.x, point.y, 20, 8);
  if (
    drawBiomeProp(ctx, sceneStyle, "bush", point.x, point.y + 2, {
      scale: Math.max(0.62, bush.w / 72),
    })
  ) {
    return;
  }
  const dark =
    bush.style === "ember" ? "#854832" : bush.style === "frost" ? "#7ea3c0" : bush.style === "blight" ? "#6f3c3a" : "#2d6a38";
  const mid =
    bush.style === "ember" ? "#ab6245" : bush.style === "frost" ? "#afcae2" : bush.style === "blight" ? "#945853" : "#4f944f";
  const light =
    bush.style === "ember" ? "#d58a61" : bush.style === "frost" ? "#dff3ff" : bush.style === "blight" ? "#bb7168" : "#7dc36d";
  fillPixelEllipse(ctx, point.x, point.y - 15, 26, 12, dark);
  fillPixelEllipse(ctx, point.x - 8, point.y - 21, 18, 10, mid);
  fillPixelEllipse(ctx, point.x + 8, point.y - 20, 16, 9, mid);
  fillPixelEllipse(ctx, point.x - 2, point.y - 24, 12, 7, light);
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
  ctx.strokeStyle = water.style === "ice" ? "rgba(225, 247, 255, 0.82)" : "rgba(141, 214, 205, 0.55)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  const minX = Math.min(...corners.map((corner) => corner.x));
  const maxX = Math.max(...corners.map((corner) => corner.x));
  const minY = Math.min(...corners.map((corner) => corner.y));
  const maxY = Math.max(...corners.map((corner) => corner.y));
  for (let y = minY + 8; y < maxY - 4; y += 10) {
    pixelRect(
      ctx,
      minX + 12 + ((y / 10) % 2) * 8,
      y,
      Math.max(10, maxX - minX - 28),
      2,
      water.style === "ice" ? "rgba(242, 252, 255, 0.45)" : "rgba(184, 255, 239, 0.28)"
    );
  }
}

function drawRuin(ctx, ruin, sceneStyle, origin) {
  const point = toScreen(origin, ruin.anchorX, ruin.anchorY);
  drawIsoShadow(ctx, point.x, point.y, 30, 12);
  if (
    drawBiomeProp(ctx, sceneStyle, "ruin", point.x, point.y + 2, {
      scale: Math.min(0.72, Math.max(0.44, ruin.w / 240)),
      variant: getPropVariant(ruin, 6),
    })
  ) {
    return;
  }
  const topW = Math.round(ruin.w * 0.42);
  const midW = Math.round(ruin.w * 0.56);
  const topH = Math.round(ruin.h * 0.16);
  const midH = Math.round(ruin.h * 0.22);
  fillBrickPattern(ctx, point.x - topW / 2, point.y - ruin.h * 0.52, topW, topH, "#807678", "#605759", "#b8abab");
  fillBrickPattern(ctx, point.x - midW / 2, point.y - ruin.h * 0.34, midW, midH, "#968c8a", "#6b6260", "#d1c5bc");
  pixelRect(ctx, point.x - ruin.w * 0.1, point.y - ruin.h * 0.2, ruin.w * 0.2, ruin.h * 0.12, "#cdbfae");
}

function drawCottage(ctx, cottage, origin) {
  const point = toScreen(origin, cottage.anchorX, cottage.anchorY);
  drawIsoShadow(ctx, point.x, point.y, 54, 18);
  fillRoofPattern(ctx, point.x - 86, point.y - 116, 172, 30, "#c06f2f", "#8f451d", "#e79e54");
  fillRoofPattern(ctx, point.x - 100, point.y - 86, 200, 26, "#b85f27", "#83401b", "#dd9450");
  fillBrickPattern(ctx, point.x - 72, point.y - 60, 144, 58, "#8d8b88", "#686360", "#bbb7b2");
  pixelRect(ctx, point.x - 20, point.y - 44, 40, 46, "#6f4b30");
  pixelRect(ctx, point.x - 16, point.y - 40, 32, 42, "#845835");
  pixelRect(ctx, point.x - 54, point.y - 46, 26, 18, "#abdff4");
  pixelRect(ctx, point.x - 50, point.y - 42, 18, 10, "#dff8ff");
  pixelRect(ctx, point.x + 28, point.y - 46, 26, 18, "#abdff4");
  pixelRect(ctx, point.x + 32, point.y - 42, 18, 10, "#dff8ff");
  pixelRect(ctx, point.x - 20, point.y - 4, 40, 4, "#c4b393");
}

function drawWell(ctx, well, origin) {
  const point = toScreen(origin, well.anchorX, well.anchorY);
  drawIsoShadow(ctx, point.x, point.y, 18, 8);
  pixelRect(ctx, point.x - 12, point.y - 34, 4, 20, "#6f4b32");
  pixelRect(ctx, point.x + 8, point.y - 34, 4, 20, "#6f4b32");
  pixelRect(ctx, point.x - 16, point.y - 30, 32, 6, "#936645");
  fillBrickPattern(ctx, point.x - 14, point.y - 22, 28, 20, "#9fa9ad", "#718085", "#dfe7ea");
  pixelRect(ctx, point.x - 10, point.y - 14, 20, 8, "#4f7284");
}

function drawFence(ctx, fence, sceneStyle, origin) {
  const point = toScreen(origin, fence.anchorX, fence.anchorY);
  drawIsoShadow(ctx, point.x, point.y, 16, 6);
  if (
    drawBiomeProp(ctx, sceneStyle, fence.type, point.x, point.y + 2, {
      scale: fence.type === "fenceH" ? Math.max(0.9, fence.w / 128) : Math.max(0.9, fence.h / 92),
    })
  ) {
    return;
  }
  const width = Math.round(fence.w * 0.36);
  const left = Math.round(point.x - width / 2);
  pixelRect(ctx, left, point.y - 18, width, 4, "#cba16c");
  pixelRect(ctx, left, point.y - 10, width, 4, "#8f633d");
  for (let x = left + 4; x < left + width; x += 12) {
    pixelRect(ctx, x, point.y - 22, 4, 18, "#6c482f");
  }
}

function drawSignpost(ctx, sign, sceneStyle, origin) {
  const point = toScreen(origin, sign.anchorX, sign.anchorY);
  drawIsoShadow(ctx, point.x, point.y, 10, 4);
  if (
    drawBiomeProp(ctx, sceneStyle, "signpost", point.x, point.y + 2, {
      scale: 0.64,
    })
  ) {
    return;
  }
  pixelRect(ctx, point.x - 3, point.y - 22, 6, 20, "#6b4a2e");
  pixelRect(ctx, point.x - 16, point.y - 32, 32, 12, "#d7be86");
  pixelRect(ctx, point.x - 14, point.y - 30, 28, 2, "#f4ddb2");
  pixelRect(ctx, point.x - 12, point.y - 26, 20, 2, "#9c7a4a");
}

function drawLantern(ctx, lantern, sceneStyle, origin) {
  const point = toScreen(origin, lantern.anchorX, lantern.anchorY);
  drawIsoShadow(ctx, point.x, point.y, 8, 4);
  if (
    drawBiomeProp(ctx, sceneStyle, "lantern", point.x, point.y + 2, {
      scale: 0.56,
    })
  ) {
    return;
  }
  pixelRect(ctx, point.x - 2, point.y - 24, 4, 22, "#6e4a34");
  pixelRect(ctx, point.x - 8, point.y - 36, 16, 12, "#4e3a28");
  pixelRect(
    ctx,
    point.x - 5,
    point.y - 33,
    10,
    8,
    lantern.style === "cool" ? "#9bd8ff" : lantern.style === "frost" ? "#dff6ff" : lantern.style === "ember" ? "#ffb16c" : "#efcf79"
  );
  pixelRect(ctx, point.x - 2, point.y - 30, 4, 2, "#fff6cf");
}

function drawBridge(ctx, bridge, sceneStyle, origin) {
  const center = toScreen(origin, bridge.x + bridge.w / 2, bridge.y + bridge.h);
  if (
    drawBiomeProp(ctx, sceneStyle, "bridge", center.x, center.y + 2, {
      scale: bridge.w > bridge.h ? Math.max(0.72, bridge.w / 190) : Math.max(0.72, bridge.h / 190),
      variant: bridge.w >= bridge.h ? 0 : 1,
    })
  ) {
    return;
  }

  const corners = [
    toScreen(origin, bridge.x, bridge.y),
    toScreen(origin, bridge.x + bridge.w, bridge.y),
    toScreen(origin, bridge.x + bridge.w, bridge.y + bridge.h),
    toScreen(origin, bridge.x, bridge.y + bridge.h),
  ];

  ctx.save();
  ctx.fillStyle = "#8d6d45";
  ctx.strokeStyle = "#4d3523";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < corners.length; i += 1) ctx.lineTo(corners[i].x, corners[i].y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const longSize = bridge.w >= bridge.h ? bridge.w : bridge.h;
  const plankCount = Math.max(4, Math.floor(longSize / 18));
  ctx.lineWidth = 1;

  for (let index = 1; index < plankCount; index += 1) {
    const t = index / plankCount;
    const start =
      bridge.w >= bridge.h
        ? interpolatePoint(corners[0], corners[1], t)
        : interpolatePoint(corners[0], corners[3], t);
    const end =
      bridge.w >= bridge.h
        ? interpolatePoint(corners[3], corners[2], t)
        : interpolatePoint(corners[1], corners[2], t);

    ctx.strokeStyle = "#5f4028";
    ctx.beginPath();
    ctx.moveTo(Math.round(start.x), Math.round(start.y));
    ctx.lineTo(Math.round(end.x), Math.round(end.y));
    ctx.stroke();

    ctx.strokeStyle = "rgba(212, 168, 103, 0.42)";
    ctx.beginPath();
    ctx.moveTo(Math.round(start.x), Math.round(start.y - 1));
    ctx.lineTo(Math.round(end.x), Math.round(end.y - 1));
    ctx.stroke();
  }

  ctx.restore();
}

function interpolatePoint(start, end, t) {
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  };
}

function drawInteractable(ctx, item, state, origin) {
  const point = toScreen(origin, item.anchorX, item.anchorY);
  if (state.story.hovered?.data?.id === item.id) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    drawIsoRing(
      ctx,
      origin,
      item.x,
      item.y,
      Math.max(24, Math.min(58, Math.max(item.w || 18, item.h || 18) * 0.58)),
      7,
      "#fff1a6"
    );
    ctx.restore();
  }

  if (item.type === "farmPlot") {
    const halfW = item.w / 2;
    const halfH = item.h / 2;
    const corners = [
      toScreen(origin, item.x - halfW, item.y - halfH),
      toScreen(origin, item.x + halfW, item.y - halfH),
      toScreen(origin, item.x + halfW, item.y + halfH),
      toScreen(origin, item.x - halfW, item.y + halfH),
    ];

    ctx.save();
    ctx.fillStyle = "rgba(78, 49, 31, 0.42)";
    ctx.strokeStyle = "#b38a5d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let index = 1; index < corners.length; index += 1) {
      ctx.lineTo(corners[index].x, corners[index].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    for (let row = -2; row <= 2; row += 1) {
      const rowY = item.y + row * 17;
      drawIsoLine(
        ctx,
        origin,
        item.x - halfW + 14,
        rowY,
        item.x + halfW - 14,
        rowY,
        2,
        row % 2 === 0 ? "#d0a16c" : "#8b603e"
      );
    }

    drawFarmCrop(ctx, item, origin);
  }

  if (item.type === "bed") {
    drawIsoShadow(ctx, point.x, point.y, 20, 7);
    pixelRect(ctx, point.x - 22, point.y - 20, 44, 18, "#765238");
    pixelRect(ctx, point.x - 18, point.y - 26, 36, 18, "#d9c6a0");
    pixelRect(ctx, point.x - 16, point.y - 24, 13, 8, "#f4ecd6");
    pixelRect(ctx, point.x - 1, point.y - 22, 17, 12, "#7fa779");
    pixelRect(ctx, point.x - 22, point.y - 4, 4, 8, "#503723");
    pixelRect(ctx, point.x + 18, point.y - 4, 4, 8, "#503723");
  }

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

  if (item.type === "seal") {
    drawIsoShadow(ctx, point.x, point.y, 12, 6);
    pixelRect(ctx, point.x - 9, point.y - 18, 18, 14, "#7e6d67");
    pixelRect(ctx, point.x - 6, point.y - 15, 12, 8, "#d8c988");
    pixelRect(ctx, point.x - 2, point.y - 12, 4, 2, "#8f7b45");
  }

  if (item.type === "chest") {
    drawIsoShadow(ctx, point.x, point.y, 12, 6);
    pixelRect(ctx, point.x - 12, point.y - 16, 24, 12, "#6d4b30");
    pixelRect(ctx, point.x - 12, point.y - 10, 24, 8, "#8f613d");
    pixelRect(ctx, point.x - 2, point.y - 12, 4, 10, "#d3b67d");
  }

  if (item.type === "shrine") {
    drawIsoShadow(ctx, point.x, point.y, 16, 8);
    pixelRect(ctx, point.x - 10, point.y - 28, 20, 24, "#6f6b71");
    pixelRect(ctx, point.x - 6, point.y - 22, 12, 14, "#cfc6b7");
    pixelRect(ctx, point.x - 2, point.y - 34, 4, 8, "#9ee88b");
    pixelRect(ctx, point.x - 7, point.y - 36, 14, 2, "#f0de9a");
  }
}

function drawCollisionDebug(ctx, state, origin) {
  const solids = [
    ...(state.arena.obstacles || []).map((entry) => entry.solid).filter(Boolean),
    ...(state.arena.npcs || []).map((entry) => entry.solid).filter(Boolean),
  ];

  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255, 91, 91, 0.95)";
  ctx.fillStyle = "rgba(255, 91, 91, 0.18)";

  for (const solid of solids) {
    const corners = [
      toScreen(origin, solid.x, solid.y),
      toScreen(origin, solid.x + solid.w, solid.y),
      toScreen(origin, solid.x + solid.w, solid.y + solid.h),
      toScreen(origin, solid.x, solid.y + solid.h),
    ];
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let index = 1; index < corners.length; index += 1) {
      ctx.lineTo(corners[index].x, corners[index].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawFarmCrop(ctx, item, origin) {
  const view = item.farmView;
  if (!view || view.state === "empty") return;

  const positions = [
    [-34, -20],
    [0, -20],
    [34, -20],
    [-34, 20],
    [0, 20],
    [34, 20],
  ];

  if (view.watered) {
    for (const [offsetX, offsetY] of positions.slice(0, 4)) {
      const drop = toScreen(origin, item.x + offsetX + 10, item.y + offsetY + 8);
      pixelRect(ctx, drop.x - 1, drop.y - 2, 3, 2, "#8fd9df");
    }
  }

  if (view.stage <= 0) {
    for (const [offsetX, offsetY] of positions.slice(0, 4)) {
      const seed = toScreen(origin, item.x + offsetX, item.y + offsetY);
      pixelRect(ctx, seed.x - 2, seed.y - 2, 4, 3, "#e1ce79");
    }
    return;
  }

  const visiblePlants = view.mature ? positions.length : 4;
  for (const [offsetX, offsetY] of positions.slice(0, visiblePlants)) {
    const plant = toScreen(origin, item.x + offsetX, item.y + offsetY);
    drawIsoShadow(ctx, plant.x, plant.y + 1, view.mature ? 7 : 5, 3);
    pixelRect(ctx, plant.x - 1, plant.y - (view.mature ? 12 : 8), 3, view.mature ? 11 : 7, "#57894f");
    pixelRect(ctx, plant.x - (view.mature ? 6 : 4), plant.y - (view.mature ? 13 : 9), view.mature ? 6 : 4, 4, "#91d37b");
    pixelRect(ctx, plant.x + 1, plant.y - (view.mature ? 15 : 10), view.mature ? 6 : 4, 4, "#b9ed9a");
    if (view.mature) {
      pixelRect(ctx, plant.x - 2, plant.y - 19, 5, 5, "#e7f5b3");
    }
  }
}

function drawNpc(ctx, npc, origin) {
  const point = toScreen(origin, npc.anchorX, npc.anchorY);
  const palette = NPC_DEFS[npc.id]?.palette || npc.palette;
  drawPixelSprite(ctx, getActorSprite(palette, "down", 0, "npc"), point.x, point.y);
}

function drawAfterImage(ctx, image, origin) {
  const point = toScreen(origin, image.x, image.y, 18);
  drawPixelSprite(
    ctx,
    getActorSprite(
      { hood: "#f2f8f0", cloak: "#90d8bf", accent: "#e3fff6" },
      resolveFacing(image.angle || 0),
      1,
      "ayla",
      "dash"
    ),
    point.x,
    point.y,
    { alpha: Math.max(0, image.life / image.maxLife) * 0.28, tint: "#dffcf5", tintAlpha: 0.6 }
  );
}

function drawPlayer(ctx, player, origin) {
  const point = toScreen(origin, player.x, player.y, 18);
  const speed = Math.hypot(player.vx, player.vy);
  const frame = speed > 20 ? Math.floor(player.animTime) % 4 : Math.floor(player.animTime) % 2;
  const facing = resolveFacing(player.aimAngle);
  if (
    drawAylaAtlasSprite(ctx, point.x, point.y, facing, frame, player.pose, {
      alpha: player.invulnerable > 0 && Math.floor(performance.now() / 60) % 2 === 0 ? 0.86 : 1,
      tint: player.hurtFlash > 0 ? "#ffd7ca" : null,
      tintAlpha: 0.56,
      scale: 0.56,
    })
  ) {
    return;
  }
  drawPixelSprite(
    ctx,
    getActorSprite(
      {
        hood: "#f6f4ef",
        cloak: player.dashTime > 0 ? "#8fd6ba" : "#7aa466",
        accent: "#86d4a7",
      },
      facing,
      frame,
      "ayla",
      player.pose
    ),
    point.x,
    point.y,
    {
      alpha: player.invulnerable > 0 && Math.floor(performance.now() / 60) % 2 === 0 ? 0.72 : 1,
      tint: player.hurtFlash > 0 ? "#ffd7ca" : null,
      tintAlpha: 0.76,
    }
  );
}

function drawEnemy(ctx, enemy, state, origin) {
  const point = toScreen(origin, enemy.x, enemy.y, 16);
  const frame = Math.floor(enemy.animTime) % 4;
  drawPixelSprite(ctx, getEnemySprite(enemy.config.sprite || enemy.type, resolveFacing(enemy.facing), frame, enemy.pose), point.x, point.y, {
    tint: enemy.hitFlash > 0 ? "#ffe0c9" : enemy.config.spriteTint || null,
    tintAlpha: enemy.hitFlash > 0 ? 0.82 : enemy.config.spriteTintAlpha || 0.22,
  });

  drawEnemyStatus(ctx, enemy, state, origin);
  drawEnemyHealth(ctx, enemy, point.x, point.y);
}

function drawBoss(ctx, boss, state, origin) {
  const point = toScreen(origin, boss.x, boss.y, 26);
  drawIsoShadow(ctx, point.x, point.y + 4, 28, 10);
  drawPixelSprite(ctx, getBossSprite(Math.floor(boss.animTime) % 4, boss.pose), point.x, point.y, {
    tint: boss.hitFlash > 0 ? "#ffd5bf" : null,
    tintAlpha: 0.82,
  });
  drawBossStatus(ctx, boss, state, origin);
}

function drawEnemyStatus(ctx, enemy, state, origin) {
  if (enemy.elite) {
    ctx.save();
    ctx.globalAlpha = 0.72;
    drawIsoRing(ctx, origin, enemy.x, enemy.y, enemy.radius + 10, 8, enemy.eliteColor || "#e8d07d");
    ctx.restore();
  }

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
      enemy.config.windupColor || "#ffd27a"
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
  const width = Math.max(36, enemy.radius >= 22 ? 44 : Math.round(enemy.radius * 1.9));
  const ratio = Math.max(0, enemy.hp / enemy.maxHp);
  pixelRect(ctx, x - width / 2, y - 42, width, 6, "#1b1412");
  pixelRect(
    ctx,
    x - width / 2 + 1,
    y - 41,
    Math.round((width - 2) * ratio),
    4,
    enemy.config.healthColor || "#e05256"
  );
  if (enemy.elite) {
    ctx.fillStyle = enemy.eliteColor || "#e8d07d";
    ctx.font = "700 10px Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.fillText(enemy.name, x, y - 48);
    ctx.textAlign = "left";
  }
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

function drawSceneAtmosphere(ctx, state) {
  const { width, height } = state.viewport;
  const style = state.scene.sceneStyle;
  let overlay = "rgba(10, 14, 12, 0.06)";

  if (style === "aylaHomestead") overlay = "rgba(38, 28, 12, 0.035)";
  if (style === "emberpineGrove") overlay = "rgba(58, 22, 14, 0.09)";
  if (style === "frostveilTundra") overlay = "rgba(16, 28, 40, 0.08)";
  if (style === "blightedWoods" || style === "hollowheartRuins") overlay = "rgba(34, 14, 18, 0.1)";
  if (style === "chapelOfTides") overlay = "rgba(12, 26, 30, 0.1)";
  if (style === "ancientHeart" || style === "sunkenReliquary") overlay = "rgba(24, 18, 36, 0.08)";
  if (style === "starfallSanctum") overlay = "rgba(18, 20, 42, 0.1)";

  ctx.save();
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  for (let i = 0; i < 10; i += 1) {
    const drift = (state.time * 18 + i * 137) % (width + 120);
    const bob = Math.sin(state.time * 0.8 + i * 0.9) * 18;
    const x = drift - 60;
    const y = 110 + (i % 5) * 94 + bob;
    const color =
      style === "frostveilTundra"
        ? "#d6f5ff"
        : style === "emberpineGrove"
          ? "#ffbb7f"
          : style === "chapelOfTides"
            ? "#94e7ff"
            : style === "starfallSanctum"
              ? "#d8deff"
            : style === "blightedWoods" || style === "hollowheartRuins"
              ? "#cc8b82"
              : "#dff4b2";
    ctx.save();
    ctx.globalAlpha = 0.08;
    pixelRect(ctx, x, y, 2, 2, color);
    pixelRect(ctx, x + 4, y + 2, 2, 2, color);
    ctx.restore();
  }
}

function getPropVariant(prop, count) {
  const x = Math.round(prop.anchorX ?? prop.x ?? 0);
  const y = Math.round(prop.anchorY ?? prop.y ?? 0);
  return Math.abs((x * 31 + y * 17) | 0) % count;
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

function fillPixelEllipse(ctx, cx, cy, rx, ry, color) {
  ctx.fillStyle = color;
  for (let y = -ry; y <= ry; y += 2) {
    const width = Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))) * rx;
    ctx.fillRect(Math.round(cx - width), Math.round(cy + y), Math.round(width * 2), 2);
  }
}

function fillBrickPattern(ctx, x, y, w, h, base, mortar, highlight) {
  pixelRect(ctx, x, y, w, h, base);
  for (let row = 0; row < h; row += 8) {
    pixelRect(ctx, x, y + row, w, 1, mortar);
    const offset = row % 16 === 0 ? 0 : 8;
    for (let col = offset; col < w; col += 16) {
      pixelRect(ctx, x + col, y + row, 1, 8, mortar);
    }
  }
  for (let row = 2; row < h; row += 8) {
    pixelRect(ctx, x + 2, y + row, Math.max(0, w - 4), 1, highlight);
  }
}

function fillRoofPattern(ctx, x, y, w, h, base, dark, light) {
  pixelRect(ctx, x, y, w, h, dark);
  for (let row = 0; row < h; row += 6) {
    for (let col = row % 12 === 0 ? 0 : 6; col < w; col += 12) {
      pixelRect(ctx, x + col, y + row, 10, 4, base);
      pixelRect(ctx, x + col + 1, y + row, 8, 1, light);
      pixelRect(ctx, x + col, y + row + 4, 10, 1, dark);
    }
  }
}

function pixelRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

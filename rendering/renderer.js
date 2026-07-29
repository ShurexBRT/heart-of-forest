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
import { drawWorldMaterialRect } from "./worldMaterialAssets.js";
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
  drawBossTelegraphs(ctx, state, origin);
  if (state.debugCollision) drawCollisionDebug(ctx, state, origin);
  drawHostileProjectiles(ctx, state, origin);
  drawSwings(ctx, state, origin);
  drawParticles(ctx, state, origin);
  drawCombatText(ctx, state, origin);
  drawSceneAtmosphere(ctx, state);

  if (options.showHud !== false) {
    drawHud(ctx, state, player.abilityInfo);
  }
}

function getWorldOrigin(state) {
  const shakeScale = state.settings?.screenShake ?? 0.65;
  const shakeAmount = state.shake * shakeScale;
  const shakeX = shakeAmount > 0 ? Math.round((Math.random() - 0.5) * shakeAmount) : 0;
  const shakeY = shakeAmount > 0 ? Math.round((Math.random() - 0.5) * shakeAmount) : 0;

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
  const trainingPattern = state.training?.pattern;
  if (trainingPattern) {
    ctx.save();
    ctx.globalAlpha = trainingPattern.warning > 0 ? 0.46 : 0.7;
    const color =
      trainingPattern.warning > 0
        ? "#a9dcfa"
        : trainingPattern.hit
          ? "#ff8f7b"
          : "#f2fbff";
    drawIsoRing(
      ctx,
      origin,
      trainingPattern.x,
      trainingPattern.y,
      trainingPattern.radius,
      trainingPattern.warning > 0 ? 10 : 15,
      color
    );
    drawIsoRing(
      ctx,
      origin,
      trainingPattern.x,
      trainingPattern.y,
      Math.max(20, trainingPattern.radius - 20),
      7,
      color
    );
    ctx.restore();
  }

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

  if (boss.currentAttack.type === "rootCrown") {
    const attack = boss.currentAttack;
    const pulse = 1 + Math.sin(state.time * 15) * 0.025;
    const segments = 36;
    ctx.save();
    ctx.globalAlpha = 0.7;
    for (let index = 0; index < segments; index += 1) {
      const angleA = (Math.PI * 2 * index) / segments;
      const angleB = (Math.PI * 2 * (index + 1)) / segments;
      const middle = (angleA + angleB) * 0.5;
      const delta = Math.atan2(
        Math.sin(middle - attack.gapAngle),
        Math.cos(middle - attack.gapAngle)
      );
      if (Math.abs(delta) <= attack.gapWidth) continue;
      drawIsoLine(
        ctx,
        origin,
        attack.centerX + Math.cos(angleA) * attack.ringRadius * pulse,
        attack.centerY + Math.sin(angleA) * attack.ringRadius * pulse,
        attack.centerX + Math.cos(angleB) * attack.ringRadius * pulse,
        attack.centerY + Math.sin(angleB) * attack.ringRadius * pulse,
        5,
        slamColor
      );
    }
    drawIsoLine(
      ctx,
      origin,
      attack.centerX,
      attack.centerY,
      attack.centerX + Math.cos(attack.gapAngle) * (attack.ringRadius + 32),
      attack.centerY + Math.sin(attack.gapAngle) * (attack.ringRadius + 32),
      4,
      "#c7f4b2"
    );
    ctx.restore();
  }
}

function drawProjectiles(ctx, state, origin) {
  for (const projectile of state.projectiles) {
    const point = toScreen(origin, projectile.x, projectile.y, 18);
    drawProjectileTrail(ctx, origin, projectile, "spirit", false);
    drawSpiritBolt(ctx, point.x, point.y);
  }
}

function drawSpiritBolt(ctx, x, y) {
  drawPixelSprite(ctx, getProjectileSprite("spirit"), x, y);
}

function drawHostileProjectiles(ctx, state, origin) {
  for (const projectile of state.hostileProjectiles) {
    const point = toScreen(origin, projectile.x, projectile.y, 18);
    drawProjectileTrail(ctx, origin, projectile, projectile.type || "spirit", true);
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

function getDamageReadColor(type = "thorn") {
  if (type === "fire" || type === "ember") return "#ff9a5f";
  if (type === "mire" || type === "poison") return "#86dfd8";
  if (type === "frost") return "#dff6ff";
  if (type === "corruption" || type === "blight") return "#d891ff";
  if (type === "astral" || type === "ancient") return "#f3e1a4";
  if (type === "spirit" || type === "wisp") return "#9beeff";
  if (type === "physical") return "#fff0a8";
  return "#b7ef7b";
}

function getRoleReadColor(role = "melee") {
  if (role === "ranged") return "#9bd8ff";
  if (role === "support") return "#a8ee87";
  return "#ffb56d";
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
    if (renderable.kind === "npc") drawNpc(ctx, renderable.item, state, origin);
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
  if (obstacle.type === "cottage") drawCottage(ctx, obstacle, sceneStyle, origin);
  if (obstacle.type === "well") drawWell(ctx, obstacle, sceneStyle, origin);
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
  const variant = getPropVariant(ruin, 6);
  drawIsoShadow(ctx, point.x, point.y, 30, 12);
  if (
    drawBiomeProp(ctx, sceneStyle, "ruin", point.x, point.y + 2, {
      scale: Math.min(0.72, Math.max(0.44, ruin.w / 240)),
      variant,
    })
  ) {
    return;
  }
  const topW = Math.round(ruin.w * 0.42);
  const midW = Math.round(ruin.w * 0.56);
  const topH = Math.round(ruin.h * 0.16);
  const midH = Math.round(ruin.h * 0.22);
  const trim = getCottageBiomeTrim(sceneStyle);
  fillPixelEllipse(ctx, point.x, point.y - 4, Math.max(34, midW * 0.32), 9, "rgba(38, 34, 31, 0.32)");
  pixelRect(ctx, point.x - midW * 0.5 - 8, point.y - ruin.h * 0.18, 18, 4, "#4e4745");
  pixelRect(ctx, point.x + midW * 0.5 - 10, point.y - ruin.h * 0.16, 24, 4, "#6a625e");
  fillBrickPattern(ctx, point.x - topW / 2, point.y - ruin.h * 0.52, topW, topH, "#807678", "#605759", "#b8abab");
  fillBrickPattern(ctx, point.x - midW / 2, point.y - ruin.h * 0.34, midW, midH, "#968c8a", "#6b6260", "#d1c5bc");
  drawWorldMaterialRect(
    ctx,
    "ruin",
    point.x - topW / 2,
    point.y - ruin.h * 0.52,
    topW,
    topH,
    variant,
    0.74
  );
  drawWorldMaterialRect(
    ctx,
    "ruin",
    point.x - midW / 2,
    point.y - ruin.h * 0.34,
    midW,
    midH,
    variant + 1,
    0.78
  );
  pixelRect(ctx, point.x - midW * 0.46, point.y - ruin.h * 0.32, 8, midH + 12, "#6f6763");
  pixelRect(ctx, point.x + midW * 0.39, point.y - ruin.h * 0.29, 9, midH + 6, "#5c5654");
  drawWorldMaterialRect(ctx, "ruin", point.x - midW * 0.46, point.y - ruin.h * 0.32, 8, midH + 12, variant + 2, 0.7);
  drawWorldMaterialRect(ctx, "ruin", point.x + midW * 0.39, point.y - ruin.h * 0.29, 9, midH + 6, variant + 3, 0.7);
  drawPixelLine(ctx, point.x - midW * 0.44, point.y - ruin.h * 0.19, point.x - midW * 0.24, point.y - ruin.h * 0.28, trim.accent, 0.82);
  drawPixelLine(ctx, point.x + midW * 0.2, point.y - ruin.h * 0.19, point.x + midW * 0.43, point.y - ruin.h * 0.25, trim.accent, 0.72);
  pixelRect(ctx, point.x - midW * 0.18, point.y - ruin.h * 0.39, 24, 2, trim.light);
  pixelRect(ctx, point.x - ruin.w * 0.1, point.y - ruin.h * 0.2, ruin.w * 0.2, ruin.h * 0.12, "#cdbfae");
  pixelRect(ctx, point.x - 5, point.y - ruin.h * 0.18, 10, ruin.h * 0.08, "rgba(34, 28, 28, 0.32)");
}

function drawCottage(ctx, cottage, sceneStyle, origin) {
  const point = toScreen(origin, cottage.anchorX, cottage.anchorY);
  const variant = getPropVariant(cottage, 4);
  const trim = getCottageBiomeTrim(sceneStyle);
  drawIsoShadow(ctx, point.x, point.y, 54, 18);

  fillPixelEllipse(ctx, point.x, point.y - 5, 70, 16, "rgba(46, 37, 28, 0.28)");
  pixelRect(ctx, point.x - 75, point.y - 63, 150, 63, "#4c4642");
  pixelRect(ctx, point.x - 82, point.y - 66, 164, 7, "#3b332d");
  fillRoofPattern(ctx, point.x - 86, point.y - 116, 172, 30, "#c06f2f", "#8f451d", "#e79e54");
  fillRoofPattern(ctx, point.x - 100, point.y - 86, 200, 26, "#b85f27", "#83401b", "#dd9450");
  fillBrickPattern(ctx, point.x - 72, point.y - 60, 144, 58, "#8d8b88", "#686360", "#bbb7b2");
  drawWorldMaterialRect(ctx, "roof", point.x - 86, point.y - 116, 172, 30, variant, 0.96);
  drawWorldMaterialRect(ctx, "roof", point.x - 100, point.y - 86, 200, 26, variant + 1, 0.96);
  drawWorldMaterialRect(ctx, "stone", point.x - 72, point.y - 60, 144, 58, variant, 0.82);
  pixelRect(ctx, point.x - 91, point.y - 89, 182, 5, "#6a351c");
  pixelRect(ctx, point.x - 78, point.y - 118, 156, 4, "#f0a85e");
  pixelRect(ctx, point.x - 104, point.y - 60, 208, 5, "rgba(36, 27, 21, 0.34)");

  pixelRect(ctx, point.x - 74, point.y - 62, 5, 60, "#58402d");
  pixelRect(ctx, point.x + 69, point.y - 62, 5, 60, "#3d2d22");
  pixelRect(ctx, point.x - 72, point.y - 35, 144, 4, "#6f5036");
  pixelRect(ctx, point.x - 56, point.y - 59, 4, 54, "#6b5139");
  pixelRect(ctx, point.x + 52, point.y - 59, 4, 54, "#56412f");
  pixelRect(ctx, point.x - 20, point.y - 44, 40, 46, "#6f4b30");
  drawWorldMaterialRect(ctx, "timber", point.x - 16, point.y - 40, 32, 42, variant, 0.95);
  pixelRect(ctx, point.x - 18, point.y - 47, 36, 5, "#4e3626");
  pixelRect(ctx, point.x - 15, point.y - 39, 3, 35, "#8f6542");
  pixelRect(ctx, point.x + 12, point.y - 39, 3, 35, "#4d3629");
  pixelRect(ctx, point.x - 2, point.y - 29, 4, 4, "#d0aa61");
  pixelRect(ctx, point.x - 11, point.y - 33, 22, 2, "rgba(244, 213, 142, 0.34)");
  pixelRect(ctx, point.x - 54, point.y - 46, 26, 18, "#abdff4");
  pixelRect(ctx, point.x - 50, point.y - 42, 18, 10, "#dff8ff");
  pixelRect(ctx, point.x - 43, point.y - 46, 3, 18, "#5e4937");
  pixelRect(ctx, point.x - 56, point.y - 27, 30, 3, trim.shadow);
  pixelRect(ctx, point.x - 49, point.y - 31, 15, 2, trim.accent);
  pixelRect(ctx, point.x + 28, point.y - 46, 26, 18, "#abdff4");
  pixelRect(ctx, point.x + 32, point.y - 42, 18, 10, "#dff8ff");
  pixelRect(ctx, point.x + 39, point.y - 46, 3, 18, "#5e4937");
  pixelRect(ctx, point.x + 26, point.y - 27, 30, 3, trim.shadow);
  pixelRect(ctx, point.x + 34, point.y - 31, 14, 2, trim.accent);
  pixelRect(ctx, point.x + 55, point.y - 112, 20, 34, "#5d5149");
  drawWorldMaterialRect(ctx, "stone", point.x + 58, point.y - 109, 14, 31, variant + 2, 0.88);
  pixelRect(ctx, point.x + 54, point.y - 114, 22, 5, "#3d3532");
  pixelRect(ctx, point.x + 60, point.y - 121, 12, 5, "#2f2927");
  pixelRect(ctx, point.x + 63, point.y - 127, 6, 7, "rgba(224, 204, 174, 0.4)");
  drawCottageBiomeTrim(ctx, point.x, point.y, sceneStyle, variant);
  drawCottagePorch(ctx, point.x, point.y, sceneStyle, variant);
  drawCottageSettlementDetails(ctx, point.x, point.y, sceneStyle, variant);
  pixelRect(ctx, point.x - 76, point.y - 4, 152, 5, sceneStyle === "aylaHomestead" ? "#b79c72" : "#7b705e");
}

function drawCottageBiomeTrim(ctx, x, y, sceneStyle, variant) {
  const trim = getCottageBiomeTrim(sceneStyle);
  const mossOffset = variant % 5;

  pixelRect(ctx, x - 72, y - 63, 144, 3, trim.shadow);
  pixelRect(ctx, x - 68 + mossOffset, y - 65, 28, 3, trim.accent);
  pixelRect(ctx, x + 31 - mossOffset, y - 64, 22, 2, trim.light);
  pixelRect(ctx, x - 77, y - 88, 28, 3, trim.roofDust);
  pixelRect(ctx, x + 46, y - 89, 34, 3, trim.roofDust);

  if (trim.motif === "frost") {
    pixelRect(ctx, x - 91, y - 88, 184, 3, "#f1fbff");
    pixelRect(ctx, x + 52, y - 117, 26, 3, "#f6fdff");
    pixelRect(ctx, x - 50, y - 47, 18, 2, "#f6fdff");
    pixelRect(ctx, x + 32, y - 47, 18, 2, "#f6fdff");
    return;
  }

  if (trim.motif === "ember") {
    pixelRect(ctx, x - 92, y - 84, 36, 2, "#ff9b55");
    pixelRect(ctx, x + 48, y - 82, 30, 2, "#e47244");
    pixelRect(ctx, x + 62, y - 110, 8, 2, "#ffc078");
    pixelRect(ctx, x - 18, y - 43, 36, 2, "#4a2a21");
    return;
  }

  if (trim.motif === "thorn") {
    drawPixelLine(ctx, x - 76, y - 30, x - 40, y - 42, trim.accent, 0.95);
    drawPixelLine(ctx, x + 39, y - 23, x + 76, y - 34, trim.accent, 0.92);
    pixelRect(ctx, x - 45, y - 43, 3, 2, trim.light);
    pixelRect(ctx, x + 57, y - 35, 3, 2, trim.light);
    return;
  }

  if (trim.motif === "rune") {
    pixelRect(ctx, x - 60, y - 37, 8, 1, trim.light);
    pixelRect(ctx, x - 57, y - 41, 1, 8, trim.light);
    pixelRect(ctx, x + 52, y - 37, 8, 1, trim.light);
    pixelRect(ctx, x + 55, y - 41, 1, 8, trim.light);
    pixelRect(ctx, x - 3, y - 30, 6, 1, trim.accent);
    return;
  }

  if (trim.motif === "reed") {
    drawPixelLine(ctx, x - 66, y - 39, x - 58, y - 53, trim.accent, 0.9);
    drawPixelLine(ctx, x - 58, y - 39, x - 49, y - 50, trim.light, 0.82);
    drawPixelLine(ctx, x + 51, y - 40, x + 45, y - 53, trim.accent, 0.9);
    drawPixelLine(ctx, x + 59, y - 40, x + 66, y - 50, trim.light, 0.82);
    pixelRect(ctx, x - 68, y - 36, 20, 2, trim.shadow);
    pixelRect(ctx, x + 47, y - 36, 20, 2, trim.shadow);
    return;
  }

  pixelRect(ctx, x - 64, y - 44, 18, 2, trim.accent);
  pixelRect(ctx, x + 46, y - 45, 16, 2, trim.accent);
  pixelRect(ctx, x - 58, y - 42, 2, 5, trim.light);
  pixelRect(ctx, x + 53, y - 42, 2, 5, trim.light);
  fillPixelEllipse(ctx, x - 49, y - 39, 6, 3, trim.accent);
  fillPixelEllipse(ctx, x + 47, y - 39, 5, 3, trim.light);
}

function drawCottagePorch(ctx, x, y, sceneStyle, variant) {
  const trim = getCottageBiomeTrim(sceneStyle);
  pixelRect(ctx, x - 25, y - 8, 50, 6, "#7a5736");
  drawWorldMaterialRect(ctx, "planks", x - 25, y - 8, 50, 6, variant, 0.9);
  pixelRect(ctx, x - 20, y - 4, 40, 4, "#c4b393");
  pixelRect(ctx, x - 30, y - 2, 60, 3, trim.shadow);
  pixelRect(ctx, x - 27, y - 15, 3, 12, "#5b3d29");
  pixelRect(ctx, x + 24, y - 15, 3, 12, "#5b3d29");
  pixelRect(ctx, x - 32, y - 17, 64, 3, trim.accent);
  if (sceneStyle === "aylaHomestead") {
    pixelRect(ctx, x - 35, y - 22, 10, 3, "#86c978");
    pixelRect(ctx, x + 25, y - 22, 10, 3, "#d7df94");
  }
}

function drawCottageSettlementDetails(ctx, x, y, sceneStyle, variant) {
  const trim = getCottageBiomeTrim(sceneStyle);
  const notch = variant % 3;

  pixelRect(ctx, x - 94, y - 59, 188, 2, "rgba(246, 221, 166, 0.22)");
  pixelRect(ctx, x - 92 + notch * 9, y - 84, 34, 2, "rgba(255, 224, 150, 0.36)");
  pixelRect(ctx, x + 42 - notch * 5, y - 111, 28, 2, "rgba(255, 224, 150, 0.3)");
  pixelRect(ctx, x - 66, y - 6, 132, 2, "rgba(28, 23, 20, 0.38)");

  for (let step = 0; step < 4; step += 1) {
    const sx = x - 44 + step * 29 + ((variant + step) % 2) * 3;
    pixelRect(ctx, sx, y - 72, 1, 7, "rgba(68, 45, 31, 0.48)");
    pixelRect(ctx, sx + 1, y - 72, 1, 5, "rgba(248, 196, 112, 0.28)");
  }

  if (trim.motif === "ember") {
    fillPixelEllipse(ctx, x + 67, y - 125, 8, 4, "rgba(255, 151, 84, 0.18)");
    pixelRect(ctx, x + 64, y - 127, 3, 3, "#ffb878");
    pixelRect(ctx, x + 70, y - 123, 2, 2, "#e46f46");
    return;
  }

  if (trim.motif === "frost") {
    pixelRect(ctx, x - 82, y - 118, 42, 2, "#f8feff");
    pixelRect(ctx, x + 22, y - 117, 38, 2, "#edf8ff");
    pixelRect(ctx, x + 60, y - 77, 14, 2, "#f8feff");
    return;
  }

  if (trim.motif === "thorn") {
    drawPixelLine(ctx, x - 87, y - 56, x - 58, y - 67, trim.accent, 0.82);
    drawPixelLine(ctx, x + 54, y - 56, x + 84, y - 70, trim.accent, 0.78);
    pixelRect(ctx, x - 70, y - 66, 2, 2, trim.light);
    pixelRect(ctx, x + 73, y - 68, 2, 2, trim.light);
    return;
  }

  if (trim.motif === "rune") {
    pixelRect(ctx, x - 72, y - 55, 6, 1, trim.light);
    pixelRect(ctx, x - 69, y - 58, 1, 6, trim.light);
    pixelRect(ctx, x + 66, y - 55, 6, 1, trim.light);
    pixelRect(ctx, x + 69, y - 58, 1, 6, trim.light);
    return;
  }

  if (trim.motif === "reed") {
    pixelRect(ctx, x - 88, y - 16, 17, 2, trim.shadow);
    pixelRect(ctx, x + 70, y - 16, 18, 2, trim.shadow);
    drawPixelLine(ctx, x - 82, y - 17, x - 74, y - 31, trim.accent, 0.72);
    drawPixelLine(ctx, x + 80, y - 17, x + 75, y - 30, trim.light, 0.66);
    return;
  }

  fillPixelEllipse(ctx, x - 83, y - 18, 8, 4, trim.accent);
  fillPixelEllipse(ctx, x + 82, y - 18, 8, 4, trim.light);
}

function getCottageBiomeTrim(sceneStyle) {
  if (sceneStyle === "emberpineGrove") {
    return {
      motif: "ember",
      accent: "#9c4f37",
      light: "#ffbd74",
      shadow: "#3f261f",
      roofDust: "#5a2f24",
    };
  }

  if (sceneStyle === "frostveilTundra") {
    return {
      motif: "frost",
      accent: "#bad9e8",
      light: "#f7fdff",
      shadow: "#6f8391",
      roofDust: "#d7eaf3",
    };
  }

  if (sceneStyle === "blightedWoods" || sceneStyle === "hollowheartRuins") {
    return {
      motif: "thorn",
      accent: "#5a2f2c",
      light: "#c16a55",
      shadow: "#2b1b1d",
      roofDust: "#6f3f35",
    };
  }

  if (
    sceneStyle === "ancientHeart" ||
    sceneStyle === "starfallSanctum" ||
    sceneStyle === "sunkenReliquary"
  ) {
    return {
      motif: "rune",
      accent: "#b99ade",
      light: "#fff1b5",
      shadow: "#4e405a",
      roofDust: "#6f5d79",
    };
  }

  if (sceneStyle === "mossrootMarsh" || sceneStyle === "chapelOfTides") {
    return {
      motif: "reed",
      accent: "#5e8b68",
      light: "#c6d8a0",
      shadow: "#385447",
      roofDust: "#58705f",
    };
  }

  return {
    motif: "leaf",
    accent: "#6f9f5e",
    light: "#d7df94",
    shadow: "#4d5b3c",
    roofDust: "#7e6d4c",
  };
}

function drawWell(ctx, well, sceneStyle, origin) {
  const point = toScreen(origin, well.anchorX, well.anchorY);
  const variant = getPropVariant(well, 4);
  const trim = getCottageBiomeTrim(sceneStyle);
  drawIsoShadow(ctx, point.x, point.y, 18, 8);
  fillPixelEllipse(ctx, point.x, point.y - 3, 24, 8, "rgba(58, 43, 31, 0.38)");
  pixelRect(ctx, point.x - 18, point.y - 42, 36, 7, "#7d4526");
  drawWorldMaterialRect(ctx, "roof", point.x - 18, point.y - 42, 36, 7, variant + 1, 0.86);
  pixelRect(ctx, point.x - 20, point.y - 36, 40, 4, "#4c3427");
  pixelRect(ctx, point.x - 12, point.y - 34, 4, 20, "#6f4b32");
  pixelRect(ctx, point.x + 8, point.y - 34, 4, 20, "#6f4b32");
  pixelRect(ctx, point.x - 16, point.y - 30, 32, 6, "#936645");
  fillBrickPattern(ctx, point.x - 14, point.y - 22, 28, 20, "#9fa9ad", "#718085", "#dfe7ea");
  drawWorldMaterialRect(ctx, "timber", point.x - 16, point.y - 30, 32, 6, variant, 0.92);
  drawWorldMaterialRect(ctx, "stone", point.x - 14, point.y - 22, 28, 20, variant, 0.86);
  pixelRect(ctx, point.x - 10, point.y - 14, 20, 8, "#4f7284");
  pixelRect(ctx, point.x - 8, point.y - 13, 16, 2, "#8dc4d0");
  pixelRect(ctx, point.x - 1, point.y - 35, 2, 13, "#3d3330");
  pixelRect(ctx, point.x + 2, point.y - 23, 8, 8, "#5f4634");
  pixelRect(ctx, point.x + 3, point.y - 22, 6, 2, "#c49a62");
  pixelRect(ctx, point.x - 15, point.y - 2, 30, 3, "#5e4837");
  pixelRect(ctx, point.x - 13, point.y - 25, 26, 2, "#eef7f2");
  pixelRect(ctx, point.x + 2, point.y - 38, 10, 3, "#d9b56f");
  drawSmallBiomeAccent(ctx, point.x, point.y - 4, trim, variant);
}

function drawFence(ctx, fence, sceneStyle, origin) {
  const point = toScreen(origin, fence.anchorX, fence.anchorY);
  const trim = getCottageBiomeTrim(sceneStyle);
  const variant = getPropVariant(fence, 4);
  const horizontal = fence.type === "fenceH";
  const length = horizontal ? fence.w : fence.h;

  drawIsoShadow(ctx, point.x, point.y, horizontal ? Math.max(18, fence.w * 0.18) : 16, 6);
  if (
    drawBiomeProp(ctx, sceneStyle, fence.type, point.x, point.y + 2, {
      scale: fence.type === "fenceH" ? Math.max(0.9, fence.w / 128) : Math.max(0.9, fence.h / 92),
    })
  ) {
    return;
  }

  const startWorld = horizontal
    ? { x: fence.x + 8, y: fence.y + 11 }
    : { x: fence.x + 11, y: fence.y + 8 };
  const endWorld = horizontal
    ? { x: fence.x + fence.w - 8, y: fence.y + 11 }
    : { x: fence.x + 11, y: fence.y + fence.h - 8 };
  const topStart = toScreen(origin, startWorld.x, startWorld.y, 22);
  const topEnd = toScreen(origin, endWorld.x, endWorld.y, 22);
  const lowStart = toScreen(origin, startWorld.x, startWorld.y, 13);
  const lowEnd = toScreen(origin, endWorld.x, endWorld.y, 13);

  drawThickPixelLine(ctx, topStart, topEnd, 4, "#cba16c");
  drawThickPixelLine(ctx, lowStart, lowEnd, 4, "#8f633d");
  drawThickPixelLine(ctx, { x: topStart.x, y: topStart.y - 1 }, { x: topEnd.x, y: topEnd.y - 1 }, 1, "#f0c98f", 0.6);
  drawThickPixelLine(ctx, { x: lowStart.x, y: lowStart.y + 2 }, { x: lowEnd.x, y: lowEnd.y + 2 }, 1, "#4f3422", 0.72);

  const postCount = Math.max(2, Math.floor(length / 82) + 2);
  for (let index = 0; index < postCount; index += 1) {
    const t = postCount === 1 ? 0 : index / (postCount - 1);
    const wx = startWorld.x + (endWorld.x - startWorld.x) * t;
    const wy = startWorld.y + (endWorld.y - startWorld.y) * t;
    const post = toScreen(origin, wx, wy);
    pixelRect(ctx, post.x - 3, post.y - 25, 6, 24, "#6c482f");
    drawWorldMaterialRect(ctx, "timber", post.x - 3, post.y - 25, 6, 24, variant + index, 0.82);
    pixelRect(ctx, post.x - 4, post.y - 27, 8, 3, trim.accent);
    pixelRect(ctx, post.x - 2, post.y - 24, 2, 20, "rgba(242, 198, 126, 0.25)");
  }

  drawFenceBiomeAccent(ctx, topStart, topEnd, lowStart, lowEnd, trim, variant);
}

function drawSignpost(ctx, sign, sceneStyle, origin) {
  const point = toScreen(origin, sign.anchorX, sign.anchorY);
  const trim = getCottageBiomeTrim(sceneStyle);
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
  drawWorldMaterialRect(ctx, "timber", point.x - 3, point.y - 22, 6, 20, getPropVariant(sign, 4), 0.88);
  drawWorldMaterialRect(ctx, "planks", point.x - 16, point.y - 32, 32, 12, getPropVariant(sign, 4), 0.76);
  pixelRect(ctx, point.x - 14, point.y - 30, 28, 2, "#f4ddb2");
  pixelRect(ctx, point.x - 12, point.y - 26, 20, 2, "#9c7a4a");
  pixelRect(ctx, point.x - 17, point.y - 33, 34, 2, trim.accent);
  pixelRect(ctx, point.x + 10, point.y - 28, 6, 3, trim.light);
  drawSmallBiomeAccent(ctx, point.x - 9, point.y - 19, trim, getPropVariant(sign, 4));
}

function drawLantern(ctx, lantern, sceneStyle, origin) {
  const point = toScreen(origin, lantern.anchorX, lantern.anchorY);
  const trim = getCottageBiomeTrim(sceneStyle);
  drawIsoShadow(ctx, point.x, point.y, 8, 4);
  if (
    drawBiomeProp(ctx, sceneStyle, "lantern", point.x, point.y + 2, {
      scale: 0.56,
    })
  ) {
    drawLanternGlow(ctx, point.x, point.y, lantern, trim, true);
    return;
  }
  pixelRect(ctx, point.x - 2, point.y - 24, 4, 22, "#6e4a34");
  pixelRect(ctx, point.x - 8, point.y - 36, 16, 12, "#4e3a28");
  drawWorldMaterialRect(ctx, "metal", point.x - 8, point.y - 36, 16, 12, getPropVariant(lantern, 4), 0.78);
  drawLanternGlow(ctx, point.x, point.y, lantern, trim, false);
  pixelRect(ctx, point.x - 6, point.y - 36, 12, 2, "#c6a775");
  pixelRect(ctx, point.x - 6, point.y - 24, 12, 2, "#3c2b22");
}

function drawBridge(ctx, bridge, sceneStyle, origin) {
  const center = toScreen(origin, bridge.x + bridge.w / 2, bridge.y + bridge.h);
  const trim = getCottageBiomeTrim(sceneStyle);
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

  const minX = Math.min(...corners.map((corner) => corner.x));
  const maxX = Math.max(...corners.map((corner) => corner.x));
  const minY = Math.min(...corners.map((corner) => corner.y));
  const maxY = Math.max(...corners.map((corner) => corner.y));
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < corners.length; i += 1) ctx.lineTo(corners[i].x, corners[i].y);
  ctx.closePath();
  ctx.clip();
  drawWorldMaterialRect(
    ctx,
    "planks",
    minX,
    minY,
    maxX - minX,
    maxY - minY,
    getPropVariant(bridge, 4),
    0.78
  );
  ctx.restore();

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

  drawBridgeRails(ctx, corners, bridge, trim);
  ctx.restore();
}

function drawLanternGlow(ctx, x, y, lantern, trim, atlasSprite = false) {
  const glowColor =
    lantern.style === "cool"
      ? "#9bd8ff"
      : lantern.style === "frost"
        ? "#dff6ff"
        : lantern.style === "ember"
          ? "#ffb16c"
          : "#efcf79";
  const lampY = y + (atlasSprite ? -42 : -28);

  fillPixelEllipse(ctx, x, lampY, atlasSprite ? 18 : 16, atlasSprite ? 12 : 10, `${glowColor}42`);
  pixelRect(ctx, x - 5, lampY - 5, 10, 8, glowColor);
  pixelRect(ctx, x - 2, lampY - 2, 4, 2, "#fff6cf");
  pixelRect(ctx, x - 7, lampY - 7, 14, 2, trim.accent);
  pixelRect(ctx, x - 1, lampY + 7, 2, 4, trim.shadow);
}

function drawFenceBiomeAccent(ctx, topStart, topEnd, lowStart, lowEnd, trim, variant) {
  const t = 0.32 + (variant % 3) * 0.14;
  const top = interpolatePoint(topStart, topEnd, Math.min(0.72, t));
  const low = interpolatePoint(lowStart, lowEnd, Math.max(0.2, t - 0.16));

  if (trim.motif === "frost") {
    drawThickPixelLine(ctx, { x: topStart.x, y: topStart.y - 3 }, { x: topEnd.x, y: topEnd.y - 3 }, 2, "#f8fdff", 0.86);
    pixelRect(ctx, top.x - 3, top.y - 7, 7, 2, "#d7eaf3");
    return;
  }

  if (trim.motif === "ember") {
    pixelRect(ctx, top.x - 2, top.y - 3, 4, 2, "#ffb16c");
    pixelRect(ctx, low.x + 5, low.y + 1, 3, 2, "#d86a43");
    return;
  }

  if (trim.motif === "thorn") {
    drawPixelLine(ctx, low.x - 8, low.y + 3, top.x + 10, top.y - 5, trim.accent, 0.9);
    pixelRect(ctx, top.x + 8, top.y - 6, 2, 2, trim.light);
    return;
  }

  if (trim.motif === "rune") {
    pixelRect(ctx, top.x - 4, top.y - 5, 8, 1, trim.light);
    pixelRect(ctx, top.x - 1, top.y - 8, 1, 6, trim.light);
    return;
  }

  if (trim.motif === "reed") {
    drawPixelLine(ctx, low.x - 6, low.y + 2, low.x - 1, low.y - 10, trim.accent, 0.74);
    drawPixelLine(ctx, low.x + 2, low.y + 2, low.x + 8, low.y - 8, trim.light, 0.7);
    return;
  }

  drawPixelLine(ctx, low.x - 8, low.y + 2, top.x + 8, top.y - 4, trim.accent, 0.72);
  fillPixelEllipse(ctx, top.x + 7, top.y - 5, 4, 2, trim.light);
}

function drawBridgeRails(ctx, corners, bridge, trim) {
  const horizontal = bridge.w >= bridge.h;
  const sideAStart = horizontal ? corners[0] : corners[0];
  const sideAEnd = horizontal ? corners[1] : corners[3];
  const sideBStart = horizontal ? corners[3] : corners[1];
  const sideBEnd = horizontal ? corners[2] : corners[2];
  const railYOffset = -9;
  const innerYOffset = -3;

  drawThickPixelLine(
    ctx,
    { x: sideAStart.x, y: sideAStart.y + railYOffset },
    { x: sideAEnd.x, y: sideAEnd.y + railYOffset },
    3,
    "#4d3523",
    0.9
  );
  drawThickPixelLine(
    ctx,
    { x: sideBStart.x, y: sideBStart.y + innerYOffset },
    { x: sideBEnd.x, y: sideBEnd.y + innerYOffset },
    3,
    "#3c291d",
    0.82
  );
  drawThickPixelLine(
    ctx,
    { x: sideAStart.x, y: sideAStart.y + railYOffset - 2 },
    { x: sideAEnd.x, y: sideAEnd.y + railYOffset - 2 },
    1,
    trim.accent,
    0.74
  );

  const posts = Math.max(3, Math.floor((horizontal ? bridge.w : bridge.h) / 84) + 2);
  for (let index = 0; index < posts; index += 1) {
    const t = index / (posts - 1);
    const front = interpolatePoint(sideBStart, sideBEnd, t);
    pixelRect(ctx, front.x - 2, front.y - 14, 4, 14, "#5d3d28");
    pixelRect(ctx, front.x - 3, front.y - 16, 6, 3, trim.shadow);
    if ((index + getBridgeVariantSeed(bridge)) % 2 === 0) {
      pixelRect(ctx, front.x - 2, front.y - 17, 4, 2, trim.accent);
    }
  }

  const marker = interpolatePoint(sideAStart, sideAEnd, 0.5);
  if (trim.motif === "frost") {
    drawThickPixelLine(
      ctx,
      { x: sideAStart.x, y: sideAStart.y + railYOffset - 4 },
      { x: sideAEnd.x, y: sideAEnd.y + railYOffset - 4 },
      2,
      "#f4fcff",
      0.76
    );
    return;
  }

  if (trim.motif === "ember") {
    pixelRect(ctx, marker.x - 5, marker.y + railYOffset - 3, 10, 2, "#ff9a52");
    pixelRect(ctx, marker.x + 8, marker.y + railYOffset + 1, 3, 2, "#ffc46c");
    return;
  }

  if (trim.motif === "rune") {
    pixelRect(ctx, marker.x - 4, marker.y + railYOffset - 4, 8, 1, trim.light);
    pixelRect(ctx, marker.x - 1, marker.y + railYOffset - 7, 1, 6, trim.light);
    return;
  }

  if (trim.motif === "reed") {
    drawPixelLine(ctx, marker.x - 7, marker.y + innerYOffset + 4, marker.x - 2, marker.y + innerYOffset - 9, trim.accent, 0.72);
    drawPixelLine(ctx, marker.x + 4, marker.y + innerYOffset + 4, marker.x + 10, marker.y + innerYOffset - 8, trim.light, 0.62);
    return;
  }

  if (trim.motif === "thorn") {
    drawPixelLine(ctx, marker.x - 12, marker.y + innerYOffset + 2, marker.x + 12, marker.y + innerYOffset - 8, trim.accent, 0.78);
    pixelRect(ctx, marker.x + 8, marker.y + innerYOffset - 9, 2, 2, trim.light);
    return;
  }

  fillPixelEllipse(ctx, marker.x - 8, marker.y + innerYOffset - 4, 5, 2, trim.accent);
  fillPixelEllipse(ctx, marker.x + 8, marker.y + innerYOffset - 3, 4, 2, trim.light);
}

function drawSmallBiomeAccent(ctx, x, y, trim, variant = 0) {
  const offset = (variant % 3) * 3;

  if (trim.motif === "frost") {
    pixelRect(ctx, x - 15 + offset, y - 23, 14, 2, "#f7fdff");
    return;
  }

  if (trim.motif === "ember") {
    pixelRect(ctx, x + 8 - offset, y - 21, 4, 2, "#ff9b55");
    pixelRect(ctx, x + 12 - offset, y - 18, 2, 2, "#ffc078");
    return;
  }

  if (trim.motif === "thorn") {
    drawPixelLine(ctx, x - 15, y - 8, x + 12, y - 16, trim.accent, 0.78);
    return;
  }

  if (trim.motif === "rune") {
    pixelRect(ctx, x - 4, y - 17, 8, 1, trim.light);
    pixelRect(ctx, x - 1, y - 20, 1, 6, trim.light);
    return;
  }

  if (trim.motif === "reed") {
    drawPixelLine(ctx, x - 12, y - 6, x - 8, y - 19, trim.accent, 0.68);
    drawPixelLine(ctx, x + 10, y - 6, x + 15, y - 18, trim.light, 0.62);
    return;
  }

  fillPixelEllipse(ctx, x - 12 + offset, y - 8, 5, 2, trim.accent);
  fillPixelEllipse(ctx, x + 11 - offset, y - 7, 4, 2, trim.light);
}

function drawThickPixelLine(ctx, start, end, width, color, alpha = 1) {
  const half = Math.floor(width / 2);
  for (let offset = -half; offset <= half; offset += 1) {
    drawPixelLine(ctx, start.x, start.y + offset, end.x, end.y + offset, color, alpha);
  }
}

function getBridgeVariantSeed(bridge) {
  return Math.abs(((bridge.x || 0) * 13 + (bridge.y || 0) * 7 + (bridge.w || 0) * 3) | 0);
}

function interpolatePoint(start, end, t) {
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  };
}

function drawInteractable(ctx, item, state, origin) {
  const point = toScreen(origin, item.anchorX, item.anchorY);
  drawInteractionTargetMarker(ctx, item, state, origin, point);

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
    drawWorldMaterialRect(ctx, "planks", point.x - 22, point.y - 20, 44, 18, getPropVariant(item, 4), 0.84);
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

  if (item.type === "memoryRoot") {
    drawIsoShadow(ctx, point.x, point.y, 18, 7);
    pixelRect(ctx, point.x - 16, point.y - 10, 32, 7, "#4e3a42");
    pixelRect(ctx, point.x - 10, point.y - 20, 20, 10, "#7f5a76");
    pixelRect(ctx, point.x - 5, point.y - 27, 10, 9, "#c79ae3");
    pixelRect(ctx, point.x - 2, point.y - 34, 4, 8, "#f1d8a5");
  }

  if (item.type === "heartseedPlot") {
    drawIsoShadow(ctx, point.x, point.y, 22, 8);
    fillPixelEllipse(ctx, point.x, point.y - 4, 24, 10, "#49372d");
    pixelRect(ctx, point.x - 17, point.y - 10, 34, 4, "#7b5b3d");
    pixelRect(ctx, point.x - 5, point.y - 17, 10, 8, "#d8c36f");
    pixelRect(ctx, point.x - 2, point.y - 22, 4, 6, "#eff2a6");
  }

  if (item.type === "livingSapling") {
    const grove = (item.w || 0) >= 50;
    const stems = grove
      ? [
          { x: -14, y: 2, height: 26, crown: "#82c879" },
          { x: 0, y: -2, height: 34, crown: "#a4dc86" },
          { x: 15, y: 3, height: 24, crown: "#6fbf83" },
        ]
      : [{ x: 0, y: 0, height: 28, crown: "#9bdc88" }];
    drawIsoShadow(ctx, point.x, point.y, grove ? 24 : 12, grove ? 8 : 5);
    for (const stem of stems) {
      pixelRect(
        ctx,
        point.x + stem.x - 2,
        point.y - stem.height,
        4,
        stem.height - 2,
        "#7a5b39"
      );
      pixelRect(
        ctx,
        point.x + stem.x - 8,
        point.y - stem.height - 8,
        16,
        10,
        stem.crown
      );
      pixelRect(
        ctx,
        point.x + stem.x - 3,
        point.y - stem.height - 13,
        8,
        7,
        "#d7ec9e"
      );
    }
  }

  if (item.type === "echoBoard") {
    drawEchoBoard(ctx, point.x, point.y, item, state);
  }

  if (item.type === "totem") {
    drawIsoShadow(ctx, point.x, point.y, 12, 6);
    pixelRect(ctx, point.x - 5, point.y - 26, 10, 24, "#7a5535");
    drawWorldMaterialRect(ctx, "timber", point.x - 5, point.y - 26, 10, 24, getPropVariant(item, 4), 0.8);
    pixelRect(ctx, point.x - 11, point.y - 36, 22, 10, "#efb56d");
    pixelRect(ctx, point.x - 4, point.y - 33, 8, 6, "#dfffb0");
  }

  if (item.type === "trainingDummy") {
    drawTrainingDummy(ctx, point.x, point.y, item, false);
  }

  if (item.type === "trainingCluster") {
    drawTrainingDummy(ctx, point.x - 12, point.y + 1, item, false);
    drawTrainingDummy(ctx, point.x + 12, point.y + 1, item, false);
  }

  if (item.type === "trainingElite") {
    drawTrainingDummy(ctx, point.x, point.y + 1, item, false);
    pixelRect(ctx, point.x - 9, point.y - 43, 18, 4, "#a9dcfa");
    pixelRect(ctx, point.x - 5, point.y - 48, 10, 5, "#f2fbff");
  }

  if (item.type === "forgeEmber") {
    drawIsoShadow(ctx, point.x, point.y, 14, 7);
    pixelRect(ctx, point.x - 13, point.y - 12, 26, 10, "#58453d");
    drawWorldMaterialRect(ctx, "stone", point.x - 13, point.y - 12, 26, 10, getPropVariant(item, 4), 0.84);
    pixelRect(ctx, point.x - 8, point.y - 17, 16, 8, "#b94f37");
    pixelRect(ctx, point.x - 5, point.y - 22, 10, 9, "#ff9a51");
    pixelRect(ctx, point.x - 2, point.y - 26, 4, 9, "#ffe09a");
  }

  if (item.type === "forge") {
    drawIsoShadow(ctx, point.x, point.y, 26, 9);
    pixelRect(ctx, point.x - 25, point.y - 26, 38, 24, "#633c31");
    drawWorldMaterialRect(ctx, "ruin", point.x - 25, point.y - 26, 38, 24, getPropVariant(item, 4), 0.86);
    pixelRect(ctx, point.x - 16, point.y - 19, 18, 13, "#342f2d");
    pixelRect(ctx, point.x - 13, point.y - 16, 12, 8, "#ef7044");
    pixelRect(ctx, point.x - 10, point.y - 14, 6, 5, "#ffd27c");
    pixelRect(ctx, point.x + 13, point.y - 17, 20, 7, "#5d6566");
    pixelRect(ctx, point.x + 18, point.y - 10, 5, 8, "#3f4748");
    pixelRect(ctx, point.x - 22, point.y - 34, 8, 10, "rgba(173, 151, 137, 0.55)");
  }

  if (item.type === "scout") {
    drawIsoShadow(ctx, point.x, point.y, 14, 6);
    pixelRect(ctx, point.x - 12, point.y - 14, 24, 12, "#6b7b87");
    pixelRect(ctx, point.x - 4, point.y - 24, 8, 10, "#cfdde8");
  }

  if (item.type === "seal") {
    drawIsoShadow(ctx, point.x, point.y, 12, 6);
    pixelRect(ctx, point.x - 9, point.y - 18, 18, 14, "#7e6d67");
    drawWorldMaterialRect(ctx, "stone", point.x - 9, point.y - 18, 18, 14, getPropVariant(item, 4), 0.82);
    pixelRect(ctx, point.x - 6, point.y - 15, 12, 8, "#d8c988");
    pixelRect(ctx, point.x - 2, point.y - 12, 4, 2, "#8f7b45");
  }

  if (item.type === "chest") {
    drawIsoShadow(ctx, point.x, point.y, 12, 6);
    const renewal = item.serviceId === "homestead_renewal";
    const lid = renewal ? "#6e5d7f" : "#6d4b30";
    const body = renewal ? "#8b7450" : "#8f613d";
    pixelRect(ctx, point.x - 14, point.y - 17, 28, 13, lid);
    pixelRect(ctx, point.x - 14, point.y - 10, 28, 9, body);
    drawWorldMaterialRect(ctx, "timber", point.x - 14, point.y - 17, 28, 15, getPropVariant(item, 4), 0.88);
    pixelRect(ctx, point.x - 14, point.y - 10, 28, 2, "#4d3829");
    pixelRect(ctx, point.x - 2, point.y - 13, 4, 11, renewal ? "#d9d0ff" : "#d3b67d");
    pixelRect(ctx, point.x - 12, point.y - 19, 24, 2, renewal ? "#d7ceff" : "#c9a16b");
    if (renewal) {
      pixelRect(ctx, point.x - 8, point.y - 24, 16, 4, "#9edb82");
      pixelRect(ctx, point.x - 4, point.y - 28, 8, 5, "#eff5ad");
      fillPixelEllipse(ctx, point.x, point.y - 9, 22, 8, "rgba(160, 219, 130, 0.24)");
    }
  }

  if (item.type === "shrine") {
    drawIsoShadow(ctx, point.x, point.y, 16, 8);
    if (item.serviceId === "hearthroot_cauldron") {
      fillPixelEllipse(ctx, point.x, point.y - 8, 22, 7, "rgba(142, 209, 123, 0.2)");
      pixelRect(ctx, point.x - 17, point.y - 8, 34, 6, "#5d5149");
      drawWorldMaterialRect(ctx, "stone", point.x - 17, point.y - 8, 34, 6, getPropVariant(item, 4) + 1, 0.72);
      pixelRect(ctx, point.x - 13, point.y - 18, 26, 14, "#30383a");
      drawWorldMaterialRect(ctx, "metal", point.x - 13, point.y - 18, 26, 14, getPropVariant(item, 4), 0.9);
      pixelRect(ctx, point.x - 15, point.y - 20, 30, 4, "#171d1f");
      pixelRect(ctx, point.x - 10, point.y - 18, 20, 4, "#8ed17b");
      pixelRect(ctx, point.x - 7, point.y - 17, 14, 2, "#d6f0a3");
      pixelRect(ctx, point.x - 4, point.y - 16, 8, 1, "#f4ffd0");
      pixelRect(ctx, point.x - 17, point.y - 17, 5, 4, "#4d5759");
      pixelRect(ctx, point.x + 12, point.y - 17, 5, 4, "#4d5759");
      pixelRect(ctx, point.x - 9, point.y - 4, 4, 8, "#343033");
      pixelRect(ctx, point.x + 5, point.y - 4, 4, 8, "#343033");
      pixelRect(ctx, point.x - 6, point.y - 27, 3, 6, "rgba(180, 236, 153, 0.72)");
      pixelRect(ctx, point.x + 4, point.y - 31, 3, 8, "rgba(180, 236, 153, 0.56)");
      pixelRect(ctx, point.x - 1, point.y - 34, 2, 10, "rgba(234, 255, 198, 0.34)");
    } else {
      fillPixelEllipse(ctx, point.x, point.y - 8, 20, 7, "rgba(158, 232, 139, 0.16)");
      pixelRect(ctx, point.x - 14, point.y - 5, 28, 5, "#514d50");
      drawWorldMaterialRect(ctx, "stone", point.x - 14, point.y - 5, 28, 5, getPropVariant(item, 4) + 1, 0.72);
      pixelRect(ctx, point.x - 10, point.y - 28, 20, 24, "#6f6b71");
      drawWorldMaterialRect(ctx, "stone", point.x - 10, point.y - 28, 20, 24, getPropVariant(item, 4), 0.82);
      pixelRect(ctx, point.x - 6, point.y - 22, 12, 14, "#cfc6b7");
      pixelRect(ctx, point.x - 8, point.y - 29, 16, 3, "#4b4649");
      pixelRect(ctx, point.x - 4, point.y - 21, 8, 10, "rgba(168, 232, 139, 0.28)");
      pixelRect(ctx, point.x - 2, point.y - 34, 4, 8, "#9ee88b");
      pixelRect(ctx, point.x - 7, point.y - 36, 14, 2, "#f0de9a");
      pixelRect(ctx, point.x - 1, point.y - 42, 2, 7, "rgba(240, 222, 154, 0.44)");
    }
  }
}

function drawEchoBoard(ctx, x, y, item, state) {
  const day = Math.max(1, Math.floor(state.clock?.day || 1));
  const rootColors = [
    "#9cdb76",
    "#7ed2d1",
    "#f39a61",
    "#b9e4ff",
    "#c790e7",
    "#d7ceff",
  ];

  drawIsoShadow(ctx, x, y, 28, 9);
  pixelRect(ctx, x - 23, y - 34, 5, 34, "#66442d");
  pixelRect(ctx, x + 18, y - 34, 5, 34, "#66442d");
  drawWorldMaterialRect(ctx, "timber", x - 23, y - 34, 5, 34, getPropVariant(item, 4), 0.88);
  drawWorldMaterialRect(ctx, "timber", x + 18, y - 34, 5, 34, getPropVariant(item, 4) + 1, 0.88);
  pixelRect(ctx, x - 30, y - 52, 60, 28, "#6e4c31");
  drawWorldMaterialRect(ctx, "planks", x - 30, y - 52, 60, 28, getPropVariant(item, 5), 0.84);
  pixelRect(ctx, x - 27, y - 49, 54, 3, "#d7bd83");
  pixelRect(ctx, x - 26, y - 39, 52, 2, "#3d2b22");
  pixelRect(ctx, x - 26, y - 29, 52, 2, "#3d2b22");
  pixelRect(ctx, x - 15, y - 62, 30, 9, "#8dcf7f");
  pixelRect(ctx, x - 11, y - 66, 22, 5, "#d9ec9d");
  pixelRect(ctx, x - 2, y - 71, 4, 6, "#edf6b4");

  for (let index = 0; index < rootColors.length; index += 1) {
    const markerX = x - 23 + index * 9;
    const lifted = (day + index) % 2 === 0;
    pixelRect(ctx, markerX, y - 36 - (lifted ? 1 : 0), 5, 5, rootColors[index]);
    pixelRect(ctx, markerX + 1, y - 35 - (lifted ? 1 : 0), 3, 3, "#fff1b6");
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

function drawNpc(ctx, npc, state, origin) {
  const point = toScreen(origin, npc.anchorX, npc.anchorY);
  const palette = NPC_DEFS[npc.id]?.palette || npc.palette;
  drawNpcFocusMarker(ctx, npc, state, origin, palette);
  drawNpcSilhouetteBase(ctx, point.x, point.y, palette);
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
  drawPlayerGrounding(ctx, player, point, speed);
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
  if (enemy.trainingDummy) {
    drawTrainingDummy(ctx, point.x, point.y + 16, enemy, enemy.hitFlash > 0);
    drawEnemyStatus(ctx, enemy, state, origin);
    return;
  }

  const frame = Math.floor(enemy.animTime) % 4;
  drawEnemyGrounding(ctx, enemy, state, origin, point);
  drawPixelSprite(ctx, getEnemySprite(enemy.type, resolveFacing(enemy.facing), frame, enemy.pose), point.x, point.y, {
    tint: enemy.hitFlash > 0 ? "#ffe0c9" : enemy.config.spriteTint || null,
    tintAlpha: enemy.hitFlash > 0 ? 0.82 : enemy.config.spriteTintAlpha || 0.22,
  });
  if (enemy.hitFlash > 0) {
    drawActorHitSpark(ctx, point.x, point.y, enemy.radius, getDamageReadColor(enemy.config.damageType));
  }

  drawEnemyStatus(ctx, enemy, state, origin);
  drawEnemyHealth(ctx, enemy, point.x, point.y);
}

function drawTrainingDummy(ctx, x, y, item, hit = false) {
  drawIsoShadow(ctx, x, y, 18, 7);
  pixelRect(ctx, x - 3, y - 36, 6, 32, "#5b3c26");
  drawWorldMaterialRect(ctx, "timber", x - 3, y - 36, 6, 32, getPropVariant(item, 4), 0.86);
  pixelRect(ctx, x - 15, y - 34, 30, 6, hit ? "#fff1b8" : "#b99559");
  pixelRect(ctx, x - 12, y - 30, 24, 18, hit ? "#f4df91" : "#6f915e");
  pixelRect(ctx, x - 9, y - 27, 18, 12, hit ? "#fff0b1" : "#91bd78");
  pixelRect(ctx, x - 2, y - 24, 4, 6, "#31442d");
  pixelRect(ctx, x - 11, y - 4, 8, 4, "#4f3422");
  pixelRect(ctx, x + 3, y - 4, 8, 4, "#4f3422");
}

function drawBoss(ctx, boss, state, origin) {
  const point = toScreen(origin, boss.x, boss.y, 26);
  drawBossAura(ctx, boss, state, origin, point);
  drawPixelSprite(ctx, getBossSprite(Math.floor(boss.animTime) % 4, boss.pose), point.x, point.y, {
    tint: boss.hitFlash > 0 ? "#ffd5bf" : null,
    tintAlpha: 0.82,
  });
  if (boss.hitFlash > 0) {
    drawActorHitSpark(ctx, point.x, point.y, boss.radius, getDamageReadColor(boss.identity?.damageType));
  }
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
    drawEnemyWindupMarker(ctx, enemy, origin);
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

function drawInteractionTargetMarker(ctx, item, state, origin, point) {
  const hovered = state.story.hovered?.data?.id === item.id;
  const focused = state.story.focus?.kind === "object" && state.story.focus?.data?.id === item.id;
  const questObject = Boolean(item.collectKey || item.requiredItemId);
  if (!hovered && !focused && !questObject) return;

  const distance = hovered
    ? state.story.hovered.distance
    : focused
      ? state.story.focus.distance
      : Infinity;
  const inRange = distance <= (item.interactionRadius || 60);
  const baseRadius = Math.max(24, Math.min(64, Math.max(item.w || 18, item.h || 18) * 0.58));
  const time = state.time ?? performance.now() / 1000;
  const pulse = 0.5 + Math.sin(time * 5.4 + item.x * 0.02 + item.y * 0.01) * 0.5;
  const markerColor = hovered ? (inRange ? "#fff1a6" : "#ffb07c") : "#9fe28c";
  const softColor = questObject ? "#dfffa4" : markerColor;

  if (questObject && !hovered && !focused) {
    ctx.save();
    ctx.globalAlpha = 0.3 + pulse * 0.16;
    pixelRect(ctx, point.x - 2, point.y - 34 - pulse * 3, 4, 4, softColor);
    pixelRect(ctx, point.x - 1, point.y - 40 - pulse * 3, 2, 4, "#fff6bd");
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.globalAlpha = hovered ? 0.72 : 0.38;
  drawIsoRing(ctx, origin, item.x, item.y, baseRadius + (hovered ? pulse * 4 : 0), hovered ? 7 : 5, markerColor);
  ctx.globalAlpha = hovered ? 0.18 : 0.12;
  fillPixelEllipse(ctx, point.x, point.y + 2, baseRadius * 0.92, Math.max(4, baseRadius * 0.18), markerColor);
  ctx.restore();

  if (hovered && !inRange) {
    ctx.save();
    ctx.globalAlpha = 0.66;
    drawIsoDashedLine(ctx, origin, state.player.x, state.player.y, item.x, item.y, 5, "#ffb07c");
    ctx.globalAlpha = 0.42;
    drawIsoDashedLine(ctx, origin, state.player.x, state.player.y, item.x, item.y, 2, "#fff1a6");
    ctx.restore();
  }
}

function drawNpcFocusMarker(ctx, npc, state, origin, palette = {}) {
  if (state.story.focus?.kind !== "npc" || state.story.focus?.data?.id !== npc.id) return;
  const accent = palette.accent || "#d8f0a0";
  ctx.save();
  ctx.globalAlpha = 0.42;
  drawIsoRing(ctx, origin, npc.x, npc.y, npc.interactionRadius * 0.45, 5, accent);
  ctx.restore();
}

function drawNpcSilhouetteBase(ctx, x, y, palette = {}) {
  const accent = palette.accent || "#d8f0a0";
  drawIsoShadow(ctx, x, y + 3, 14, 5);
  ctx.save();
  ctx.globalAlpha = 0.22;
  fillPixelEllipse(ctx, x, y + 2, 15, 4, accent);
  ctx.restore();
  pixelRect(ctx, x - 8, y - 38, 16, 2, accent);
}

function drawPlayerGrounding(ctx, player, point, speed) {
  const moving = speed > 20;
  const lowHealth = player.hp / Math.max(1, player.maxHp) <= 0.35;
  const accent = player.dashTime > 0 ? "#9beeff" : lowHealth ? "#ff9a8b" : "#9fe28c";
  const auraAlpha = player.dashTime > 0 ? 0.28 : moving ? 0.18 : 0.13;

  drawIsoShadow(ctx, point.x, point.y + 5, 17, 6);
  ctx.save();
  ctx.globalAlpha = auraAlpha;
  fillPixelEllipse(ctx, point.x, point.y + 5, player.dashTime > 0 ? 24 : 18, player.dashTime > 0 ? 7 : 5, accent);
  ctx.restore();

  if (lowHealth) {
    ctx.save();
    ctx.globalAlpha = 0.32;
    pixelRect(ctx, point.x - 12, point.y - 45, 4, 4, "#ff9a8b");
    pixelRect(ctx, point.x + 8, point.y - 43, 4, 4, "#ff9a8b");
    ctx.restore();
  }
}

function drawEnemyGrounding(ctx, enemy, state, origin, point) {
  const roleColor = getRoleReadColor(enemy.config.role);
  const damageColor = getDamageReadColor(enemy.config.damageType || enemy.config.hazardType || enemy.config.projectileType);
  const time = state.time ?? performance.now() / 1000;
  const pulse = 0.5 + Math.sin(time * 6 + enemy.x * 0.03 + enemy.y * 0.02) * 0.5;
  const baseHalfW = Math.max(15, enemy.radius * 0.95);
  const baseHalfH = Math.max(5, enemy.radius * 0.28);

  drawIsoShadow(ctx, point.x, point.y + 5, baseHalfW, baseHalfH);
  ctx.save();
  ctx.globalAlpha = enemy.state === "windup" ? 0.28 + pulse * 0.1 : enemy.elite ? 0.22 : 0.12;
  fillPixelEllipse(
    ctx,
    point.x,
    point.y + 4,
    Math.max(18, enemy.radius * 1.18),
    Math.max(4, enemy.radius * 0.22),
    enemy.state === "windup" ? damageColor : roleColor
  );
  ctx.restore();

  if (enemy.elite) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    drawIsoRing(ctx, origin, enemy.x, enemy.y, enemy.radius + 16, 6, enemy.eliteColor || damageColor);
    ctx.restore();
  }
}

function drawEnemyWindupMarker(ctx, enemy, origin) {
  const color = enemy.config.windupColor || getDamageReadColor(enemy.config.damageType || enemy.config.projectileType);
  const role = enemy.config.role || "melee";
  const angle = Number.isFinite(enemy.attackAngle) ? enemy.attackAngle : enemy.facing || 0;
  const range = enemy.config.attackRange || (role === "ranged" ? 180 : 70);
  const startDistance = Math.max(18, enemy.radius + 8);
  const endDistance = role === "ranged" ? Math.min(220, Math.max(130, range)) : Math.min(105, Math.max(54, range + 20));
  const startX = enemy.x + Math.cos(angle) * startDistance;
  const startY = enemy.y + Math.sin(angle) * startDistance;
  const endX = enemy.x + Math.cos(angle) * endDistance;
  const endY = enemy.y + Math.sin(angle) * endDistance;
  const sideAngle = angle + Math.PI / 2;
  const prongSize = role === "ranged" ? 12 : 8;

  ctx.save();
  ctx.globalAlpha = 0.76;
  drawIsoRing(ctx, origin, enemy.x, enemy.y, enemy.radius + 12, 8, color);

  if (role === "support") {
    drawIsoRing(ctx, origin, enemy.x, enemy.y, Math.min(92, Math.max(58, (enemy.config.supportRadius || 140) * 0.48)), 6, color);
    drawIsoLine(ctx, origin, enemy.x - 18, enemy.y, enemy.x + 18, enemy.y, 4, color);
    drawIsoLine(ctx, origin, enemy.x, enemy.y - 18, enemy.x, enemy.y + 18, 4, color);
    ctx.restore();
    return;
  }

  drawIsoLine(ctx, origin, startX, startY, endX, endY, role === "ranged" ? 4 : 5, color);
  drawIsoLine(
    ctx,
    origin,
    endX,
    endY,
    endX - Math.cos(angle) * 14 + Math.cos(sideAngle) * prongSize,
    endY - Math.sin(angle) * 14 + Math.sin(sideAngle) * prongSize,
    4,
    color
  );
  drawIsoLine(
    ctx,
    origin,
    endX,
    endY,
    endX - Math.cos(angle) * 14 - Math.cos(sideAngle) * prongSize,
    endY - Math.sin(angle) * 14 - Math.sin(sideAngle) * prongSize,
    4,
    color
  );
  ctx.restore();
}

function drawActorHitSpark(ctx, x, y, radius, color) {
  const points = [
    [-0.82, -0.45],
    [-0.26, -0.78],
    [0.38, -0.7],
    [0.88, -0.22],
    [0.58, 0.35],
    [-0.52, 0.28],
  ];
  ctx.save();
  ctx.globalAlpha = 0.74;
  for (const [dx, dy] of points) {
    pixelRect(ctx, x + dx * radius * 0.78 - 2, y - 18 + dy * radius * 0.72 - 2, 4, 4, color);
  }
  ctx.restore();
}

function drawBossAura(ctx, boss, state, origin, point) {
  const damageColor = getDamageReadColor(boss.identity?.damageType);
  const time = state.time ?? performance.now() / 1000;
  const pulse = 0.5 + Math.sin(time * 4.2 + boss.phase) * 0.5;
  const attackColor =
    boss.currentAttack?.type === "volley"
      ? boss.identity?.volleyTelegraphColor || damageColor
      : boss.identity?.slamTelegraphColor || damageColor;

  drawIsoShadow(ctx, point.x, point.y + 4, 30, 10);
  ctx.save();
  ctx.globalAlpha = boss.currentAttack ? 0.2 + pulse * 0.08 : 0.13;
  fillPixelEllipse(ctx, point.x, point.y + 5, 38 + boss.phase * 3, 11 + boss.phase, boss.currentAttack ? attackColor : damageColor);
  ctx.restore();

  if (boss.phase >= 2 || boss.currentAttack) {
    ctx.save();
    ctx.globalAlpha = boss.currentAttack ? 0.54 : 0.28;
    drawIsoRing(ctx, origin, boss.x, boss.y, boss.radius + (boss.currentAttack ? 20 : 10), 8, boss.currentAttack ? attackColor : damageColor);
    ctx.restore();
  }
}

function drawProjectileTrail(ctx, origin, projectile, type, hostile = false) {
  const speed = Math.hypot(projectile.vx || 0, projectile.vy || 0);
  if (speed <= 1) return;

  const directionX = (projectile.vx || 0) / speed;
  const directionY = (projectile.vy || 0) / speed;
  const length = hostile ? 24 : 18;
  const color = hostile ? getDamageReadColor(type) : getDamageReadColor("spirit");
  const head = toScreen(origin, projectile.x, projectile.y, 18);
  const tail = toScreen(origin, projectile.x - directionX * length, projectile.y - directionY * length, 18);

  ctx.save();
  ctx.globalAlpha = hostile ? 0.58 : 0.48;
  drawThickPixelLine(ctx, tail, head, hostile ? 3 : 2, color);
  drawPixelLine(ctx, tail.x, tail.y + 2, head.x, head.y + 2, hostile ? "#fff1c2" : "#efffff", 0.72);
  ctx.restore();
}

function drawEnemyHealth(ctx, enemy, x, y) {
  const width = Math.max(36, enemy.radius >= 22 ? 44 : Math.round(enemy.radius * 1.9));
  const ratio = Math.max(0, enemy.hp / enemy.maxHp);
  pixelRect(ctx, x - width / 2, y - 42, width, 6, "#1b1412");
  pixelRect(ctx, x - width / 2 - 5, y - 42, 3, 6, getRoleReadColor(enemy.config.role));
  pixelRect(ctx, x + width / 2 + 2, y - 42, 3, 6, getDamageReadColor(enemy.config.damageType || enemy.config.projectileType));
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
    ctx.globalAlpha = Math.min(1, ratio * (swing.hit ? 1.2 : 0.9));
    const steps = swing.hit ? 11 : 7;
    const outerColor = swing.openedBloom ? "#efffaa" : swing.hit ? "#ffe19b" : "#fff0a8";
    const innerColor = swing.openedBloom ? "#83eb83" : swing.hit ? "#f5b96a" : "#8bdc75";
    for (let i = 0; i < steps; i += 1) {
      const t = i / (steps - 1);
      const angle = swing.angle - swing.arc / 2 + swing.arc * t;
      const radius = swing.range - 10 + (i % 2) * 4;
      const x = swing.x + Math.cos(angle) * radius;
      const y = swing.y + Math.sin(angle) * radius;
      const point = toScreen(origin, x, y, 18);
      const size = swing.hit ? 12 - Math.abs(0.5 - t) * 6 : 10;
      pixelRect(ctx, point.x - size / 2, point.y - 3, size, 6, outerColor);
      pixelRect(ctx, point.x - size / 2 + 2, point.y - 1, Math.max(4, size - 4), 2, innerColor);
      if (swing.hit && i % 2 === 0) {
        const echo = toScreen(origin, x - Math.cos(angle) * 10, y - Math.sin(angle) * 10, 18);
        pixelRect(ctx, echo.x - 3, echo.y - 2, 6, 4, "rgba(255, 241, 198, 0.72)");
      }
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

function drawCombatText(ctx, state, origin) {
  for (const entry of state.combatText || []) {
    const alpha = Math.max(0, Math.min(1, entry.life / entry.maxLife));
    const point = toScreen(origin, entry.x, entry.y, 24);
    const scale = entry.scale || 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.font = `800 ${Math.round(14 * scale)}px Segoe UI, Arial`;
    if (entry.reward) {
      drawRewardTextPill(ctx, entry, point, scale);
      ctx.restore();
      continue;
    }
    ctx.lineWidth = entry.heavy ? 5 : 4;
    ctx.strokeStyle = "rgba(16, 12, 10, 0.88)";
    ctx.strokeText(entry.text, point.x, point.y);
    ctx.fillStyle = entry.color;
    ctx.fillText(entry.text, point.x, point.y);
    if (entry.heavy) {
      ctx.fillStyle = "rgba(255, 241, 180, 0.78)";
      pixelRect(ctx, point.x - 9, point.y - 18 * scale, 18, 2, ctx.fillStyle);
    }
    ctx.restore();
  }
}

function drawRewardTextPill(ctx, entry, point, scale) {
  const textWidth = Math.ceil(ctx.measureText(entry.text).width);
  const width = Math.max(58, textWidth + 18);
  const height = Math.round(18 * scale);
  const x = point.x - width / 2;
  const y = point.y - height + 3;

  pixelRect(ctx, x - 2, y - 2, width + 4, height + 4, "rgba(7, 10, 9, 0.78)");
  pixelRect(ctx, x, y, width, height, "rgba(18, 27, 24, 0.94)");
  pixelRect(ctx, x + 4, y + 2, width - 8, 1, "rgba(255, 246, 208, 0.28)");
  pixelRect(ctx, x + 3, y + 3, 4, height - 6, entry.color || "#dfffa4");
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(8, 10, 9, 0.92)";
  ctx.strokeText(entry.text, point.x + 2, point.y);
  ctx.fillStyle = "#fff8d8";
  ctx.fillText(entry.text, point.x + 2, point.y);
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

function drawIsoDashedLine(ctx, origin, x1, y1, x2, y2, size, color) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 14));

  for (let i = 0; i <= steps; i += 1) {
    if (i % 2 !== 0) continue;
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

function drawPixelLine(ctx, x1, y1, x2, y2, color, alpha = 1) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = color;
  for (let index = 0; index <= steps; index += 1) {
    const t = steps === 0 ? 0 : index / steps;
    ctx.fillRect(
      Math.round(x1 + (x2 - x1) * t),
      Math.round(y1 + (y2 - y1) * t),
      1,
      1
    );
  }
  ctx.restore();
}

function pixelRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

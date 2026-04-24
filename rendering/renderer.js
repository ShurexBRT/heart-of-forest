import { drawHud } from "../ui/hud.js";

let backgroundCache = null;
let backgroundCacheKey = "";

const PATH_COLORS = ["#8f7a4d", "#9c885b", "#7a6843"];
const SOIL_COLORS = ["#705238", "#7e5c3d", "#65492f"];

export function renderGame(ctx, state) {
  const { viewport, arena, player } = state;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  if (!arena || !player) {
    return;
  }

  ctx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = arena.theme.boundary;
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  const shakeX = state.shake > 0 ? Math.round((Math.random() - 0.5) * state.shake) : 0;
  const shakeY = state.shake > 0 ? Math.round((Math.random() - 0.5) * state.shake) : 0;

  ctx.save();
  ctx.translate(Math.round(-state.camera.x + shakeX), Math.round(-state.camera.y + shakeY));

  drawBackground(ctx, arena);
  drawEncounterGround(ctx, state);
  drawGroundEffects(ctx, state);
  drawProjectiles(ctx, state);
  drawSortedWorld(ctx, state);
  drawHostileProjectiles(ctx, state);
  drawSwings(ctx, state);
  drawParticles(ctx, state);

  ctx.restore();
  drawHud(ctx, state, player.abilityInfo);
}

function drawBackground(ctx, arena) {
  const key = [
    arena.width,
    arena.height,
    arena.biomeId,
    arena.sceneStyle,
  ].join("|");

  if (!backgroundCache || backgroundCacheKey !== key) {
    backgroundCache = buildBackground(arena);
    backgroundCacheKey = key;
  }

  ctx.drawImage(backgroundCache, 0, 0);
}

function buildBackground(arena) {
  const canvas = document.createElement("canvas");
  canvas.width = arena.width;
  canvas.height = arena.height;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  drawTileMap(ctx, arena);
  drawForestBorder(ctx, arena);
  drawBackGarden(ctx, arena);

  return canvas;
}

function drawTileMap(ctx, arena) {
  for (let ty = 0; ty < arena.rows; ty += 1) {
    for (let tx = 0; tx < arena.cols; tx += 1) {
      drawTile(ctx, tx * arena.tileSize, ty * arena.tileSize, arena.tileSize, arena.tiles[ty][tx], arena.theme);
    }
  }
}

function drawTile(ctx, x, y, size, tile, theme) {
  if (tile.ground === "path") {
    const base = PATH_COLORS[tile.variant % PATH_COLORS.length];
    pixelRect(ctx, x, y, size, size, base);
    pixelRect(ctx, x, y, size, 2, "#b9a16e");
    pixelRect(ctx, x, y + size - 2, size, 2, "#6a5637");
    pixelRect(ctx, x + 2, y + 4, 2, 2, "#ceb988");
    pixelRect(ctx, x + 10, y + 9, 2, 2, "#6d5939");
  } else if (tile.ground === "soil") {
    const base = SOIL_COLORS[tile.variant % SOIL_COLORS.length];
    pixelRect(ctx, x, y, size, size, base);
    pixelRect(ctx, x, y, size, 2, "#8c6745");
    pixelRect(ctx, x + 3, y + 5, 3, 2, "#5c402a");
    pixelRect(ctx, x + 9, y + 10, 2, 2, "#8f6c48");
  } else {
    const grassBases = [theme.groundDark, theme.groundMid, theme.groundLight];
    const base = grassBases[tile.variant % grassBases.length];
    pixelRect(ctx, x, y, size, size, base);
    pixelRect(ctx, x, y, size, 2, theme.grass);
    pixelRect(ctx, x + 2, y + 4, 2, 6, theme.grass);
    pixelRect(ctx, x + 8, y + 7, 2, 4, theme.treeMid);
    if ((x + y) % 32 === 0) {
      pixelRect(ctx, x + 12, y + 12, 2, 2, theme.sparkle);
    }
  }

  if (tile.overlay === "clover") {
    pixelRect(ctx, x + 4, y + 9, 2, 2, "#6eb55f");
    pixelRect(ctx, x + 6, y + 7, 2, 2, "#7bc869");
    pixelRect(ctx, x + 8, y + 9, 2, 2, "#5da64b");
  }

  if (tile.overlay === "flowersWarm") {
    pixelRect(ctx, x + 3, y + 8, 2, 2, "#f3d46d");
    pixelRect(ctx, x + 7, y + 5, 2, 2, "#ff8fa0");
    pixelRect(ctx, x + 11, y + 9, 2, 2, "#ffe8a1");
  }

  if (tile.overlay === "flowersCool") {
    pixelRect(ctx, x + 4, y + 7, 2, 2, "#94dfff");
    pixelRect(ctx, x + 8, y + 10, 2, 2, "#c9f1ff");
    pixelRect(ctx, x + 11, y + 6, 2, 2, "#8ad98c");
  }
}

function drawForestBorder(ctx, arena) {
  const theme = arena.theme;

  pixelRect(ctx, 0, 0, arena.width, 30, theme.boundary);
  pixelRect(ctx, 0, arena.height - 30, arena.width, 30, theme.boundary);
  pixelRect(ctx, 0, 0, 30, arena.height, theme.boundary);
  pixelRect(ctx, arena.width - 30, 0, 30, arena.height, theme.boundary);

  for (let x = 0; x < arena.width; x += 64) {
    drawBackgroundTreeBand(ctx, x + 12, 14, theme);
    drawBackgroundTreeBand(ctx, x + 18, arena.height - 48, theme);
  }

  for (let y = 80; y < arena.height - 80; y += 72) {
    drawBackgroundTreeBand(ctx, 10, y, theme);
    drawBackgroundTreeBand(ctx, arena.width - 60, y, theme);
  }
}

function drawBackgroundTreeBand(ctx, x, y, theme) {
  pixelRect(ctx, x, y + 12, 28, 14, theme.treeDark);
  pixelRect(ctx, x + 8, y + 4, 20, 12, theme.treeMid);
  pixelRect(ctx, x + 4, y + 8, 26, 8, theme.treeLight);
}

function drawBackGarden(ctx, arena) {
  const theme = arena.theme;
  pixelRect(ctx, 176, 136, 176, 18, "#7b5d3d");
  pixelRect(ctx, 176, 154, 176, 8, "#5d442a");
  pixelRect(ctx, 166, 196, 72, 48, "#4f3f2d");
  pixelRect(ctx, 294, 204, 58, 40, "#4f3f2d");
  pixelRect(ctx, 188, 208, 44, 24, "#7c5b3c");
  pixelRect(ctx, 306, 214, 34, 22, "#7c5b3c");
  pixelRect(ctx, 190, 210, 2, 20, "#cdb58a");
  pixelRect(ctx, 310, 216, 2, 18, "#cdb58a");
  pixelRect(ctx, 214, 282, 36, 8, theme.groundLight);
  pixelRect(ctx, 314, 282, 28, 8, theme.groundLight);
}

function drawEncounterGround(ctx, state) {
  if (state.encounter.zoneAlpha <= 0.02) return;

  const zone = state.arena.bossZone;
  const pulse = Math.round(Math.sin(state.time * 2.4) * 3);
  ctx.save();
  ctx.globalAlpha = 0.2 + state.encounter.zoneAlpha * 0.15;
  drawPixelRing(ctx, zone.x, zone.y, zone.radius + pulse, 18, "#f0c56c");
  drawPixelRing(ctx, zone.x, zone.y, zone.radius - 18 + pulse, 18, "#8fda6b");
  ctx.restore();
}

function drawGroundEffects(ctx, state) {
  for (const root of state.roots) {
    const progress = Math.max(0, root.life / root.maxLife);
    const pulse = Math.round(Math.sin((state.time + root.pulse) * 10) * 2);

    ctx.save();
    ctx.globalAlpha = 0.4 + progress * 0.3;
    for (let i = 0; i < 12; i += 1) {
      const angle = (Math.PI * 2 * i) / 12;
      const inner = 12 + (i % 2) * 4;
      const outer = root.radius - 6 + pulse;
      const x1 = Math.round(root.x + Math.cos(angle) * inner);
      const y1 = Math.round(root.y + Math.sin(angle) * inner);
      const x2 = Math.round(root.x + Math.cos(angle) * outer);
      const y2 = Math.round(root.y + Math.sin(angle) * outer);
      drawPixelLine(ctx, x1, y1, x2, y2, 4, "#76df66");
      pixelRect(ctx, x2 - 2, y2 - 2, 4, 4, "#dff9b2");
    }
    ctx.restore();
  }

  for (const hazard of state.eruptions) {
    ctx.save();
    if (hazard.warning > 0) {
      ctx.globalAlpha = 0.24 + (1 - hazard.warning / 0.95) * 0.34;
      drawPixelRing(ctx, hazard.x, hazard.y, hazard.radius, 10, "#f2c26a");
      pixelRect(ctx, hazard.x - 8, hazard.y - 8, 16, 16, "rgba(176, 54, 33, 0.22)");
    } else {
      ctx.globalAlpha = 0.25 + Math.max(0, hazard.active / 0.26) * 0.4;
      drawPixelRing(ctx, hazard.x, hazard.y, hazard.radius + 4, 12, "#9bef75");
      pixelRect(ctx, hazard.x - 6, hazard.y - 6, 12, 12, "#e8f6b8");
    }
    ctx.restore();
  }

  drawBossTelegraphs(ctx, state);
}

function drawBossTelegraphs(ctx, state) {
  const boss = state.boss;
  if (!boss || boss.dead || !boss.currentAttack) return;

  if (boss.currentAttack.type === "slam") {
    ctx.save();
    ctx.globalAlpha = 0.55;
    drawPixelRing(
      ctx,
      boss.currentAttack.targetX,
      boss.currentAttack.targetY,
      boss.currentAttack.radius + Math.round(Math.sin(state.time * 14) * 3),
      14,
      "#ffbb72"
    );
    ctx.restore();
  }

  if (boss.currentAttack.type === "volley") {
    ctx.save();
    ctx.globalAlpha = 0.55;
    for (let i = -2; i <= 2; i += 1) {
      const angle = boss.facing + i * 0.18;
      drawPixelLine(
        ctx,
        boss.x + Math.cos(angle) * 24,
        boss.y + Math.sin(angle) * 24,
        boss.x + Math.cos(angle) * 72,
        boss.y + Math.sin(angle) * 72,
        4,
        "#f1cf77"
      );
    }
    ctx.restore();
  }
}

function drawProjectiles(ctx, state) {
  for (const projectile of state.projectiles) {
    ctx.save();
    ctx.translate(Math.round(projectile.x), Math.round(projectile.y));
    drawSpiritBolt(ctx);
    ctx.restore();
  }
}

function drawSpiritBolt(ctx) {
  pixelRect(ctx, -6, -2, 12, 4, "#dff9ff");
  pixelRect(ctx, -4, -4, 8, 8, "#69dbff");
  pixelRect(ctx, -2, -6, 4, 12, "#8be9ff");
}

function drawHostileProjectiles(ctx, state) {
  for (const projectile of state.hostileProjectiles) {
    ctx.save();
    ctx.translate(Math.round(projectile.x), Math.round(projectile.y));
    ctx.rotate(Math.atan2(projectile.vy, projectile.vx));
    pixelRect(ctx, -8, -2, 16, 4, "#7f3024");
    pixelRect(ctx, 2, -4, 8, 8, "#cf6448");
    pixelRect(ctx, 8, -2, 4, 4, "#f2d57c");
    ctx.restore();
  }
}

function drawSortedWorld(ctx, state) {
  const renderables = [
    ...state.arena.obstacles.map((obstacle) => ({
      kind: "obstacle",
      item: obstacle,
      y: obstacle.sortY ?? obstacle.solid.y + obstacle.solid.h,
    })),
    ...state.afterImages.map((image) => ({
      kind: "afterImage",
      item: image,
      y: image.y,
    })),
    ...state.enemies.map((enemy) => ({
      kind: "enemy",
      item: enemy,
      y: enemy.y + enemy.radius,
    })),
    ...(state.boss && !state.boss.dead
      ? [
          {
            kind: "boss",
            item: state.boss,
            y: state.boss.y + state.boss.radius + 12,
          },
        ]
      : []),
    {
      kind: "player",
      item: state.player,
      y: state.player.y + state.player.radius,
    },
  ];

  renderables.sort((a, b) => a.y - b.y);

  for (const renderable of renderables) {
    if (renderable.kind === "obstacle") drawObstacle(ctx, renderable.item, state.arena.theme);
    if (renderable.kind === "afterImage") drawAfterImage(ctx, renderable.item);
    if (renderable.kind === "enemy") drawEnemy(ctx, renderable.item, state);
    if (renderable.kind === "boss") drawBoss(ctx, renderable.item, state);
    if (renderable.kind === "player") drawPlayer(ctx, renderable.item);
  }
}

function drawObstacle(ctx, obstacle, theme) {
  if (obstacle.type === "tree") drawTree(ctx, obstacle, theme);
  if (obstacle.type === "rock") drawRock(ctx, obstacle, theme);
  if (obstacle.type === "cottage") drawCottage(ctx, obstacle);
  if (obstacle.type === "well") drawWell(ctx, obstacle);
  if (obstacle.type === "fenceH") drawFenceH(ctx, obstacle);
  if (obstacle.type === "fenceV") drawFenceV(ctx, obstacle);
  if (obstacle.type === "signpost") drawSignpost(ctx, obstacle);
  if (obstacle.type === "cart") drawCart(ctx, obstacle);
  if (obstacle.type === "lantern") drawLantern(ctx, obstacle);
}

function drawTree(ctx, tree, theme) {
  drawBlockShadow(ctx, tree.x + tree.w * 0.24, tree.y + tree.h - 14, tree.w * 0.52, 12);
  pixelRect(ctx, tree.x + tree.w * 0.42, tree.y + tree.h * 0.56, tree.w * 0.16, tree.h * 0.34, theme.trunk);
  pixelRect(ctx, tree.x + tree.w * 0.46, tree.y + tree.h * 0.6, tree.w * 0.08, tree.h * 0.24, theme.trunkLight);

  const canopyX = Math.round(tree.x + tree.w * 0.08);
  const canopyY = Math.round(tree.y + 10);
  const canopyW = Math.round(tree.w * 0.84);
  const canopyH = Math.round(tree.h * 0.5);
  pixelBlob(ctx, canopyX + 12, canopyY + 18, canopyW - 24, canopyH - 18, theme.treeDark);
  pixelBlob(ctx, canopyX, canopyY + 22, canopyW * 0.54, canopyH * 0.62, theme.treeMid);
  pixelBlob(ctx, canopyX + canopyW * 0.36, canopyY, canopyW * 0.56, canopyH * 0.68, theme.treeMid);
  pixelBlob(ctx, canopyX + canopyW * 0.18, canopyY + 6, canopyW * 0.5, canopyH * 0.54, theme.treeLight);
  pixelRect(ctx, canopyX + 16, canopyY + 18, 8, 8, theme.treeLight);
  pixelRect(ctx, canopyX + canopyW - 28, canopyY + 28, 8, 8, theme.treeLight);
}

function drawRock(ctx, rock, theme) {
  drawBlockShadow(ctx, rock.x + 6, rock.y + rock.h - 8, rock.w - 12, 8);
  pixelRect(ctx, rock.x + 10, rock.y + 8, rock.w - 20, rock.h - 16, theme.rockBase);
  pixelRect(ctx, rock.x + 18, rock.y + 14, rock.w - 36, 8, theme.rockLight);
  pixelRect(ctx, rock.x + 6, rock.y + rock.h * 0.34, 12, rock.h * 0.32, theme.rockBase);
  pixelRect(ctx, rock.x + rock.w - 18, rock.y + rock.h * 0.28, 12, rock.h * 0.36, theme.rockBase);
}

function drawCottage(ctx, cottage) {
  drawBlockShadow(ctx, cottage.x + 20, cottage.y + cottage.h - 18, cottage.w - 40, 14);
  pixelRect(ctx, cottage.x + 16, cottage.y + 20, cottage.w - 32, 62, "#a34f45");
  pixelRect(ctx, cottage.x + 30, cottage.y + 34, cottage.w - 60, 40, "#c76d61");
  pixelRect(ctx, cottage.x + 24, cottage.y + 78, cottage.w - 48, 92, "#d8c59b");
  pixelRect(ctx, cottage.x + 40, cottage.y + 92, cottage.w - 80, 64, "#e7d7ad");
  pixelRect(ctx, cottage.x + 98, cottage.y + 102, 52, 68, "#7c5332");
  pixelRect(ctx, cottage.x + 114, cottage.y + 118, 20, 38, "#5a3824");
  pixelRect(ctx, cottage.x + 52, cottage.y + 102, 30, 24, "#8fd3de");
  pixelRect(ctx, cottage.x + 172, cottage.y + 102, 30, 24, "#8fd3de");
  pixelRect(ctx, cottage.x + 56, cottage.y + 106, 22, 16, "#dff7ff");
  pixelRect(ctx, cottage.x + 176, cottage.y + 106, 22, 16, "#dff7ff");
  pixelRect(ctx, cottage.x + 204, cottage.y + 34, 18, 46, "#6e4a34");
  pixelRect(ctx, cottage.x + 208, cottage.y + 26, 10, 12, "#d3b18d");
}

function drawWell(ctx, well) {
  drawBlockShadow(ctx, well.x + 10, well.y + well.h - 8, well.w - 20, 10);
  pixelRect(ctx, well.x + 12, well.y + 18, well.w - 24, 14, "#7a5436");
  pixelRect(ctx, well.x + 18, well.y + 30, 10, 34, "#7a5436");
  pixelRect(ctx, well.x + well.w - 28, well.y + 30, 10, 34, "#7a5436");
  pixelRect(ctx, well.x + 18, well.y + 62, well.w - 36, 22, "#8e969a");
  pixelRect(ctx, well.x + 26, well.y + 68, well.w - 52, 10, "#b6c3c7");
  pixelRect(ctx, well.x + 30, well.y + 72, well.w - 60, 6, "#4a6472");
}

function drawFenceH(ctx, fence) {
  drawBlockShadow(ctx, fence.x + 2, fence.y + 18, fence.w - 4, 6);
  for (let x = fence.x; x < fence.x + fence.w; x += 18) {
    pixelRect(ctx, x + 4, fence.y + 4, 6, 20, "#7e5635");
  }
  pixelRect(ctx, fence.x + 2, fence.y + 8, fence.w - 4, 4, "#b78859");
  pixelRect(ctx, fence.x + 2, fence.y + 16, fence.w - 4, 4, "#8c5e38");
}

function drawFenceV(ctx, fence) {
  drawBlockShadow(ctx, fence.x + 12, fence.y + 2, 6, fence.h - 4);
  for (let y = fence.y; y < fence.y + fence.h; y += 18) {
    pixelRect(ctx, fence.x + 4, y + 4, 20, 6, "#7e5635");
  }
  pixelRect(ctx, fence.x + 8, fence.y + 2, 4, fence.h - 4, "#b78859");
  pixelRect(ctx, fence.x + 16, fence.y + 2, 4, fence.h - 4, "#8c5e38");
}

function drawSignpost(ctx, sign) {
  drawBlockShadow(ctx, sign.x + 8, sign.y + sign.h - 8, sign.w - 16, 6);
  pixelRect(ctx, sign.x + 12, sign.y + 16, 10, 24, "#6b4a2e");
  pixelRect(ctx, sign.x + 4, sign.y + 4, 26, 14, "#d7be86");
  pixelRect(ctx, sign.x + 8, sign.y + 8, 18, 6, "#866240");
}

function drawCart(ctx, cart) {
  drawBlockShadow(ctx, cart.x + 6, cart.y + cart.h - 8, cart.w - 12, 8);
  pixelRect(ctx, cart.x + 10, cart.y + 18, cart.w - 20, 24, "#8a5c37");
  pixelRect(ctx, cart.x + 14, cart.y + 22, cart.w - 28, 16, "#b77a49");
  pixelRect(ctx, cart.x + 18, cart.y + 10, cart.w - 36, 10, "#d7c38f");
  pixelRect(ctx, cart.x + 12, cart.y + 40, 12, 12, "#4a3c2d");
  pixelRect(ctx, cart.x + cart.w - 24, cart.y + 40, 12, 12, "#4a3c2d");
}

function drawLantern(ctx, lantern) {
  drawBlockShadow(ctx, lantern.x + 6, lantern.y + lantern.h - 6, lantern.w - 12, 6);
  pixelRect(ctx, lantern.x + 10, lantern.y + 16, 4, 28, "#6e4a34");
  pixelRect(ctx, lantern.x + 6, lantern.y + 10, 12, 10, "#efcf79");
  pixelRect(ctx, lantern.x + 8, lantern.y + 12, 8, 6, "#fff1b6");
}

function drawAfterImage(ctx, image) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, image.life / image.maxLife) * 0.32;
  drawPlayerShape(ctx, image.x, image.y, image.angle, "#f1fff9", "#9fdcc8", false);
  ctx.restore();
}

function drawPlayer(ctx, player) {
  drawPlayerShape(
    ctx,
    player.x,
    player.y,
    player.aimAngle,
    player.hurtFlash > 0 ? "#ffd7ca" : "#f6f4ef",
    player.dashTime > 0 ? "#9af0d2" : "#6dae67",
    player.invulnerable > 0
  );
}

function drawPlayerShape(ctx, x, y, angle, hoodColor, cloakColor, flicker) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  if (flicker && Math.floor(performance.now() / 55) % 2 === 0) {
    ctx.globalAlpha *= 0.7;
  }

  const facingLeft = Math.cos(angle) < -0.15;
  if (facingLeft) ctx.scale(-1, 1);

  drawBlockShadow(ctx, -12, 8, 24, 8);
  pixelRect(ctx, -10, -18, 20, 8, "#d4d2cc");
  pixelRect(ctx, -12, -10, 24, 10, hoodColor);
  pixelRect(ctx, -8, 0, 16, 14, cloakColor);
  pixelRect(ctx, -4, -6, 8, 6, "#2c312f");
  pixelRect(ctx, -2, 14, 4, 6, "#5f442d");
  pixelRect(ctx, 6, -4, 4, 12, "#f0d7c4");
  pixelRect(ctx, 10, -10, 18, 4, "#7a5534");
  pixelRect(ctx, 24, -12, 6, 8, "#8cdcc2");
  ctx.restore();
}

function drawEnemy(ctx, enemy, state) {
  if (enemy.type === "brute") {
    drawBrute(ctx, enemy, state);
  } else {
    drawBasicEnemy(ctx, enemy, state);
  }

  drawEnemyHealth(ctx, enemy);
}

function drawBasicEnemy(ctx, enemy, state) {
  ctx.save();
  ctx.translate(Math.round(enemy.x), Math.round(enemy.y));
  if (Math.cos(enemy.facing) < -0.15) ctx.scale(-1, 1);

  drawBlockShadow(ctx, -11, 6, 22, 8);
  pixelRect(ctx, -10, -14, 20, 10, enemy.hitFlash > 0 ? "#ffd8cf" : "#5d1b24");
  pixelRect(ctx, -14, -4, 28, 12, enemy.hitFlash > 0 ? "#ffb7aa" : "#7b2631");
  pixelRect(ctx, -8, 8, 16, 10, "#ba4e5c");
  pixelRect(ctx, 4, -2, 6, 6, "#d66f79");
  ctx.restore();

  drawEnemyStatus(ctx, enemy, state);
}

function drawBrute(ctx, enemy, state) {
  ctx.save();
  ctx.translate(Math.round(enemy.x), Math.round(enemy.y));
  if (Math.cos(enemy.facing) < -0.15) ctx.scale(-1, 1);

  drawBlockShadow(ctx, -16, 8, 32, 10);
  pixelRect(ctx, -16, -18, 32, 12, enemy.hitFlash > 0 ? "#ffd9bf" : "#6c2f26");
  pixelRect(ctx, -20, -6, 40, 18, enemy.hitFlash > 0 ? "#ffc7a5" : "#874132");
  pixelRect(ctx, -12, 12, 24, 12, "#b06a48");
  pixelRect(ctx, 6, -2, 8, 8, "#f2bd86");
  ctx.restore();

  drawEnemyStatus(ctx, enemy, state);
}

function drawBoss(ctx, boss, state) {
  ctx.save();
  ctx.translate(Math.round(boss.x), Math.round(boss.y));
  if (Math.cos(boss.facing) < -0.15) ctx.scale(-1, 1);

  drawBlockShadow(ctx, -28, 10, 56, 12);
  pixelRect(ctx, -30, -30, 60, 20, boss.hitFlash > 0 ? "#ffd5bf" : "#552219");
  pixelRect(ctx, -36, -10, 72, 28, boss.hitFlash > 0 ? "#ffbd95" : "#6c3024");
  pixelRect(ctx, -20, 18, 40, 16, "#874232");
  pixelRect(ctx, 10, -2, 10, 10, "#f0cc75");
  pixelRect(ctx, -34, -26, 10, 10, "#9be576");
  pixelRect(ctx, -34, 8, 10, 10, "#9be576");
  ctx.restore();

  drawBossStatus(ctx, boss, state);
}

function drawEnemyStatus(ctx, enemy, state) {
  if (enemy.rooted > 0) {
    ctx.save();
    ctx.globalAlpha = 0.8;
    drawPixelRing(ctx, enemy.x, enemy.y + 4, enemy.radius + 8, 8, "#83e26e");
    ctx.restore();
  }

  if (enemy.bloom > 0) {
    const radius = enemy.radius + 12;
    ctx.save();
    ctx.globalAlpha = 0.7;
    drawPixelRing(ctx, enemy.x, enemy.y, radius, 8, "#eff59a");
    for (let i = 0; i < 4; i += 1) {
      const angle = state.time * 3 + (Math.PI * 2 * i) / 4;
      pixelRect(
        ctx,
        Math.round(enemy.x + Math.cos(angle) * radius) - 3,
        Math.round(enemy.y + Math.sin(angle) * radius) - 3,
        6,
        6,
        i % 2 === 0 ? "#dff68a" : "#9be98d"
      );
    }
    ctx.restore();
  }

  if (enemy.state === "windup") {
    ctx.save();
    ctx.globalAlpha = 0.75;
    drawPixelRing(ctx, enemy.x, enemy.y, enemy.radius + 12, 8, enemy.type === "brute" ? "#ffb45d" : "#ffd27a");
    ctx.restore();
  }
}

function drawBossStatus(ctx, boss, state) {
  if (boss.rooted > 0) {
    ctx.save();
    ctx.globalAlpha = 0.8;
    drawPixelRing(ctx, boss.x, boss.y + 8, boss.radius + 10, 10, "#89e86c");
    ctx.restore();
  }

  if (boss.bloom > 0) {
    const radius = boss.radius + 18;
    ctx.save();
    ctx.globalAlpha = 0.8;
    drawPixelRing(ctx, boss.x, boss.y, radius, 10, "#f3f49b");
    for (let i = 0; i < 5; i += 1) {
      const angle = state.time * 2.2 + (Math.PI * 2 * i) / 5;
      pixelRect(
        ctx,
        Math.round(boss.x + Math.cos(angle) * radius) - 4,
        Math.round(boss.y + Math.sin(angle) * radius) - 4,
        8,
        8,
        i % 2 === 0 ? "#ecffac" : "#9eeb85"
      );
    }
    ctx.restore();
  }
}

function drawEnemyHealth(ctx, enemy) {
  const width = enemy.type === "brute" ? 42 : 34;
  const y = Math.round(enemy.y - enemy.radius - 18);
  const ratio = Math.max(0, enemy.hp / enemy.maxHp);

  pixelRect(ctx, Math.round(enemy.x - width / 2), y, width, 6, "#1b1412");
  pixelRect(ctx, Math.round(enemy.x - width / 2 + 1), y + 1, Math.round((width - 2) * ratio), 4, enemy.type === "brute" ? "#ef7b58" : "#e05256");
}

function drawSwings(ctx, state) {
  for (const swing of state.swings) {
    const ratio = Math.max(0, swing.life / swing.maxLife);
    ctx.save();
    ctx.globalAlpha = ratio;
    const steps = 6;
    for (let i = 0; i < steps; i += 1) {
      const t = i / (steps - 1);
      const angle = swing.angle - swing.arc / 2 + swing.arc * t;
      const radius = swing.range - 10 + (i % 2) * 4;
      const x = Math.round(swing.x + Math.cos(angle) * radius);
      const y = Math.round(swing.y + Math.sin(angle) * radius);
      pixelRect(ctx, x - 5, y - 3, 10, 6, "#fff0a8");
      pixelRect(ctx, x - 3, y - 1, 6, 2, "#8bdc75");
    }
    ctx.restore();
  }
}

function drawParticles(ctx, state) {
  for (const particle of state.particles) {
    const alpha = Math.max(0, particle.life / particle.maxLife);

    ctx.save();
    ctx.globalAlpha = alpha;
    pixelRect(
      ctx,
      Math.round(particle.x - particle.size / 2),
      Math.round(particle.y - particle.size / 2),
      Math.max(1, Math.round(particle.size)),
      Math.max(1, Math.round(particle.size)),
      particle.color
    );
    ctx.restore();
  }
}

function drawBlockShadow(ctx, x, y, w, h) {
  pixelRect(ctx, Math.round(x), Math.round(y), Math.round(w), Math.round(h), "rgba(0, 0, 0, 0.22)");
}

function pixelBlob(ctx, x, y, w, h, color) {
  pixelRect(ctx, Math.round(x), Math.round(y + h * 0.25), Math.round(w), Math.round(h * 0.5), color);
  pixelRect(ctx, Math.round(x + w * 0.12), Math.round(y), Math.round(w * 0.32), Math.round(h * 0.45), color);
  pixelRect(ctx, Math.round(x + w * 0.56), Math.round(y + h * 0.08), Math.round(w * 0.28), Math.round(h * 0.4), color);
}

function drawPixelRing(ctx, cx, cy, radius, size, color) {
  const steps = Math.max(12, Math.floor(radius / 8));
  for (let i = 0; i < steps; i += 1) {
    const angle = (Math.PI * 2 * i) / steps;
    pixelRect(
      ctx,
      Math.round(cx + Math.cos(angle) * radius) - size / 2,
      Math.round(cy + Math.sin(angle) * radius) - size / 2,
      size,
      size,
      color
    );
  }
}

function drawPixelLine(ctx, x1, y1, x2, y2, size, color) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / size));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    pixelRect(
      ctx,
      Math.round(x1 + dx * t) - size / 2,
      Math.round(y1 + dy * t) - size / 2,
      size,
      size,
      color
    );
  }
}

function pixelRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

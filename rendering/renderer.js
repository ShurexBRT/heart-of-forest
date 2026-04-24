import { PLAYER_ABILITY_INFO } from "../entities/player.js";
import { drawHud } from "../ui/hud.js";

let backgroundCache = null;

export function renderGame(ctx, state) {
  const { viewport } = state;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = "#06100c";
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  const shakeX = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
  const shakeY = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;

  ctx.save();
  ctx.translate(Math.round(-state.camera.x + shakeX), Math.round(-state.camera.y + shakeY));

  drawBackground(ctx, state.arena);
  drawEncounterGround(ctx, state);
  drawGroundEffects(ctx, state);
  drawProjectiles(ctx, state);
  drawSortedWorld(ctx, state);
  drawHostileProjectiles(ctx, state);
  drawSwings(ctx, state);
  drawParticles(ctx, state);

  ctx.restore();
  drawHud(ctx, state, PLAYER_ABILITY_INFO);
}

function drawBackground(ctx, arena) {
  if (!backgroundCache || backgroundCache.width !== arena.width || backgroundCache.height !== arena.height) {
    backgroundCache = buildBackground(arena);
  }

  ctx.drawImage(backgroundCache, 0, 0);
}

function buildBackground(arena) {
  const canvas = document.createElement("canvas");
  canvas.width = arena.width;
  canvas.height = arena.height;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = "#17391f";
  ctx.fillRect(0, 0, arena.width, arena.height);

  for (let y = 0; y < arena.height; y += 20) {
    for (let x = 0; x < arena.width; x += 20) {
      const n = noise(x * 0.11, y * 0.17);
      ctx.fillStyle = n < 0.34 ? "#1b4226" : n < 0.68 ? "#214e2d" : "#183b23";
      ctx.fillRect(x, y, 20, 20);

      if (n > 0.72) {
        ctx.fillStyle = "#356b3b";
        ctx.fillRect(x + 13, y + 7, 2, 6);
      }

      if (n < 0.08) {
        ctx.fillStyle = "#d7dd96";
        ctx.fillRect(x + 5, y + 14, 2, 2);
      }
    }
  }

  ctx.fillStyle = "#0d2118";
  ctx.fillRect(0, 0, arena.width, arena.boundsPadding);
  ctx.fillRect(0, arena.height - arena.boundsPadding, arena.width, arena.boundsPadding);
  ctx.fillRect(0, 0, arena.boundsPadding, arena.height);
  ctx.fillRect(arena.width - arena.boundsPadding, 0, arena.boundsPadding, arena.height);

  ctx.strokeStyle = "#2d6a3c";
  ctx.lineWidth = 3;
  ctx.strokeRect(
    arena.boundsPadding + 2,
    arena.boundsPadding + 2,
    arena.width - arena.boundsPadding * 2 - 4,
    arena.height - arena.boundsPadding * 2 - 4
  );

  return canvas;
}

function noise(x, y) {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

function drawEncounterGround(ctx, state) {
  const alpha = state.encounter.zoneAlpha;

  if (alpha <= 0.02) return;

  const zone = state.arena.bossZone;
  const outerRadius = zone.radius + Math.sin(state.time * 2.5) * 4;
  const gradient = ctx.createRadialGradient(zone.x, zone.y, zone.radius * 0.25, zone.x, zone.y, zone.radius);
  gradient.addColorStop(0, `rgba(78, 18, 10, ${0.08 + alpha * 0.09})`);
  gradient.addColorStop(0.6, `rgba(44, 11, 10, ${0.14 + alpha * 0.09})`);
  gradient.addColorStop(1, "rgba(13, 8, 7, 0)");

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.25 + alpha * 0.3;
  ctx.strokeStyle = "#8fe36e";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(zone.x, zone.y, outerRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#d56d4d";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(zone.x, zone.y, zone.radius - 14 + Math.sin(state.time * 5.4) * 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawGroundEffects(ctx, state) {
  drawBossTelegraphs(ctx, state);

  for (const root of state.roots) {
    const progress = Math.max(0, root.life / root.maxLife);
    const pulse = Math.sin((state.time + root.pulse) * 10) * 3;

    ctx.save();
    ctx.globalAlpha = 0.35 + progress * 0.45;
    ctx.strokeStyle = "#77df63";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(root.x, root.y, root.radius + pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 2;
    for (let i = 0; i < 11; i += 1) {
      const angle = (Math.PI * 2 * i) / 11 + state.time * 1.4;
      const inner = 8 + (i % 3) * 5;
      const outer = root.radius - 5 + Math.sin(state.time * 7 + i) * 4;

      ctx.beginPath();
      ctx.moveTo(root.x + Math.cos(angle) * inner, root.y + Math.sin(angle) * inner);
      ctx.quadraticCurveTo(
        root.x + Math.cos(angle + 0.6) * outer * 0.5,
        root.y + Math.sin(angle + 0.6) * outer * 0.5,
        root.x + Math.cos(angle) * outer,
        root.y + Math.sin(angle) * outer
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  for (const hazard of state.eruptions) {
    ctx.save();

    if (hazard.warning > 0) {
      const progress = 1 - hazard.warning / 0.95;
      ctx.globalAlpha = 0.22 + progress * 0.4;
      ctx.strokeStyle = "#f2c26a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(hazard.x, hazard.y, hazard.radius + Math.sin(state.time * 12) * 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "rgba(176, 54, 33, 0.16)";
      ctx.beginPath();
      ctx.arc(hazard.x, hazard.y, hazard.radius * 0.72, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const progress = Math.max(0, hazard.active / 0.26);
      ctx.globalAlpha = 0.24 + progress * 0.55;
      ctx.fillStyle = "#85e96d";
      ctx.beginPath();
      ctx.arc(hazard.x, hazard.y, hazard.radius * (1.05 + (1 - progress) * 0.2), 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#fff0ad";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hazard.x, hazard.y, hazard.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

function drawBossTelegraphs(ctx, state) {
  const boss = state.boss;
  if (!boss || boss.dead || !boss.currentAttack) return;

  if (boss.currentAttack.type === "slam") {
    const pulse = Math.sin(state.time * 14) * 4;

    ctx.save();
    ctx.globalAlpha = 0.56;
    ctx.strokeStyle = "#ffbb72";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(
      boss.currentAttack.targetX,
      boss.currentAttack.targetY,
      boss.currentAttack.radius + pulse,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    ctx.fillStyle = "rgba(159, 46, 33, 0.2)";
    ctx.beginPath();
    ctx.arc(boss.currentAttack.targetX, boss.currentAttack.targetY, boss.currentAttack.radius * 0.66, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (boss.currentAttack.type === "volley") {
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = "#f1cf77";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, boss.radius + 26, boss.facing - 0.54, boss.facing + 0.54);
    ctx.stroke();
    ctx.restore();
  }
}

function drawProjectiles(ctx, state) {
  for (const projectile of state.projectiles) {
    ctx.save();
    ctx.translate(Math.round(projectile.x), Math.round(projectile.y));
    ctx.fillStyle = "#66ddff";
    ctx.beginPath();
    ctx.arc(0, 0, projectile.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#e9ffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, projectile.radius + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawHostileProjectiles(ctx, state) {
  for (const projectile of state.hostileProjectiles) {
    ctx.save();
    ctx.translate(Math.round(projectile.x), Math.round(projectile.y));
    ctx.rotate(Math.atan2(projectile.vy, projectile.vx));
    ctx.fillStyle = "#cf6448";
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-4, -7);
    ctx.lineTo(-9, 0);
    ctx.lineTo(-4, 7);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#f2d57c";
    ctx.fillRect(1, -2, 6, 4);
    ctx.restore();
  }
}

function drawSortedWorld(ctx, state) {
  const renderables = [
    ...state.arena.obstacles.map((obstacle) => ({
      kind: "obstacle",
      item: obstacle,
      y: obstacle.solid.y + obstacle.solid.h,
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
    if (renderable.kind === "obstacle") drawObstacle(ctx, renderable.item);
    if (renderable.kind === "afterImage") drawAfterImage(ctx, renderable.item);
    if (renderable.kind === "enemy") drawEnemy(ctx, renderable.item, state);
    if (renderable.kind === "boss") drawBoss(ctx, renderable.item, state);
    if (renderable.kind === "player") drawPlayer(ctx, renderable.item);
  }
}

function drawObstacle(ctx, obstacle) {
  if (obstacle.type === "tree") {
    drawTree(ctx, obstacle);
  } else {
    drawRock(ctx, obstacle);
  }
}

function drawTree(ctx, tree) {
  const cx = tree.x + tree.w / 2;
  const cy = tree.y + tree.h * 0.45;

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
  ctx.beginPath();
  ctx.ellipse(cx, tree.y + tree.h - 12, tree.w * 0.35, tree.w * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#5a3824";
  ctx.fillRect(
    Math.round(cx - tree.w * 0.12),
    Math.round(tree.y + tree.h * 0.48),
    Math.round(tree.w * 0.24),
    Math.round(tree.h * 0.42)
  );
  ctx.fillStyle = "#7a5131";
  ctx.fillRect(Math.round(cx - tree.w * 0.04), Math.round(tree.y + tree.h * 0.52), 4, Math.round(tree.h * 0.32));

  ctx.fillStyle = "#173d25";
  ctx.beginPath();
  ctx.arc(cx, cy, tree.w * 0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#255b33";
  ctx.beginPath();
  ctx.arc(cx - tree.w * 0.2, cy + tree.w * 0.02, tree.w * 0.27, 0, Math.PI * 2);
  ctx.arc(cx + tree.w * 0.19, cy - tree.w * 0.04, tree.w * 0.28, 0, Math.PI * 2);
  ctx.arc(cx, cy - tree.w * 0.22, tree.w * 0.28, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#3b8144";
  ctx.fillRect(Math.round(cx - tree.w * 0.18), Math.round(cy - tree.w * 0.3), 7, 7);
  ctx.fillRect(Math.round(cx + tree.w * 0.2), Math.round(cy - tree.w * 0.1), 6, 6);
  ctx.restore();
}

function drawRock(ctx, rock) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.beginPath();
  ctx.ellipse(rock.x + rock.w / 2, rock.y + rock.h * 0.76, rock.w * 0.48, rock.h * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#596861";
  ctx.beginPath();
  ctx.moveTo(rock.x + rock.w * 0.1, rock.y + rock.h * 0.62);
  ctx.lineTo(rock.x + rock.w * 0.24, rock.y + rock.h * 0.22);
  ctx.lineTo(rock.x + rock.w * 0.58, rock.y + rock.h * 0.08);
  ctx.lineTo(rock.x + rock.w * 0.9, rock.y + rock.h * 0.34);
  ctx.lineTo(rock.x + rock.w * 0.82, rock.y + rock.h * 0.76);
  ctx.lineTo(rock.x + rock.w * 0.3, rock.y + rock.h * 0.86);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#84928a";
  ctx.fillRect(Math.round(rock.x + rock.w * 0.35), Math.round(rock.y + rock.h * 0.25), Math.round(rock.w * 0.18), 4);
  ctx.restore();
}

function drawAfterImage(ctx, image) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, image.life / image.maxLife) * 0.38;
  drawPlayerShape(ctx, image.x, image.y, image.angle, "#e6fff4", "#7ed9ba", false);
  ctx.restore();
}

function drawPlayer(ctx, player) {
  drawPlayerShape(
    ctx,
    player.x,
    player.y,
    player.aimAngle,
    player.hurtFlash > 0 ? "#ffd7ca" : "#f3f4ef",
    player.dashTime > 0 ? "#a2f0d0" : "#6bbd72",
    player.invulnerable > 0
  );
}

function drawPlayerShape(ctx, x, y, angle, hoodColor, accentColor, flicker) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  if (flicker && Math.floor(performance.now() / 55) % 2 === 0) {
    ctx.globalAlpha *= 0.72;
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(0, 10, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.rotate(angle);

  ctx.fillStyle = "#28583b";
  ctx.beginPath();
  ctx.moveTo(-10, -13);
  ctx.lineTo(14, 0);
  ctx.lineTo(-10, 13);
  ctx.lineTo(-16, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = hoodColor;
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.quadraticCurveTo(-2, -16, -15, -8);
  ctx.lineTo(-15, 8);
  ctx.quadraticCurveTo(-2, 16, 12, 0);
  ctx.fill();

  ctx.fillStyle = "#26322c";
  ctx.beginPath();
  ctx.arc(5, 0, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#755332";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-5, 10);
  ctx.lineTo(29, 2);
  ctx.stroke();

  ctx.fillStyle = accentColor;
  ctx.fillRect(28, 0, 7, 7);
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
  ctx.rotate(enemy.facing);

  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.beginPath();
  ctx.ellipse(0, 9, 15, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = enemy.hitFlash > 0 ? "#ffd1c2" : "#761d2b";
  ctx.beginPath();
  ctx.moveTo(17, 0);
  ctx.lineTo(5, -13);
  ctx.lineTo(-14, -9);
  ctx.lineTo(-12, 10);
  ctx.lineTo(5, 13);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#c94e57";
  ctx.fillRect(2, -4, 8, 8);
  ctx.restore();

  drawEnemyStatus(ctx, enemy, state);
}

function drawBrute(ctx, enemy, state) {
  ctx.save();
  ctx.translate(Math.round(enemy.x), Math.round(enemy.y));
  ctx.rotate(enemy.facing);

  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(0, 13, 23, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = enemy.hitFlash > 0 ? "#ffd8ba" : "#7e382d";
  ctx.beginPath();
  ctx.moveTo(24, 0);
  ctx.lineTo(10, -18);
  ctx.lineTo(-15, -17);
  ctx.lineTo(-23, 0);
  ctx.lineTo(-13, 19);
  ctx.lineTo(10, 17);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ad6340";
  ctx.fillRect(-5, -8, 17, 16);
  ctx.fillStyle = "#f0b57b";
  ctx.fillRect(10, -3, 8, 6);
  ctx.restore();

  drawEnemyStatus(ctx, enemy, state);
}

function drawBoss(ctx, boss, state) {
  ctx.save();
  ctx.translate(Math.round(boss.x), Math.round(boss.y));
  ctx.rotate(boss.facing);

  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.beginPath();
  ctx.ellipse(0, 18, 42, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = boss.hitFlash > 0 ? "#ffd7bb" : "#5a2219";
  ctx.beginPath();
  ctx.moveTo(34, 0);
  ctx.lineTo(20, -28);
  ctx.lineTo(-8, -34);
  ctx.lineTo(-28, -10);
  ctx.lineTo(-34, 0);
  ctx.lineTo(-23, 20);
  ctx.lineTo(-3, 34);
  ctx.lineTo(24, 24);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#7e3628";
  ctx.fillRect(-10, -15, 24, 30);

  ctx.fillStyle = "#f0cc75";
  ctx.fillRect(12, -5, 10, 10);

  ctx.strokeStyle = "#8de56f";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-18, -8);
  ctx.lineTo(-34, -28);
  ctx.moveTo(-18, 8);
  ctx.lineTo(-34, 28);
  ctx.stroke();

  ctx.strokeStyle = "#f1be6e";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(26, -12);
  ctx.lineTo(44, -28);
  ctx.moveTo(26, 12);
  ctx.lineTo(44, 28);
  ctx.stroke();
  ctx.restore();

  drawBossStatus(ctx, boss, state);
}

function drawEnemyStatus(ctx, enemy, state) {
  if (enemy.rooted > 0) {
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = "#83e26e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius + 6 + Math.sin(state.time * 12) * 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (enemy.bloom > 0) {
    const orbitRadius = enemy.radius + 12;

    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = "#eff59a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, orbitRadius + Math.sin(state.time * 10) * 1.2, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 4; i += 1) {
      const angle = state.time * 3.2 + (Math.PI * 2 * i) / 4;
      const px = enemy.x + Math.cos(angle) * orbitRadius;
      const py = enemy.y + Math.sin(angle) * orbitRadius;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle);
      ctx.fillStyle = i % 2 === 0 ? "#dff68a" : "#9be98d";
      ctx.fillRect(-3, -3, 6, 6);
      ctx.restore();
    }

    ctx.restore();
  }

  if (enemy.state === "windup") {
    ctx.save();
    ctx.strokeStyle = enemy.type === "brute" ? "#ffb45d" : "#ffd27a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius + 9, enemy.facing - 0.9, enemy.facing + 0.9);
    ctx.stroke();
    ctx.restore();
  }
}

function drawBossStatus(ctx, boss, state) {
  if (boss.rooted > 0) {
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = "#89e86c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, boss.radius + 10 + Math.sin(state.time * 9) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (boss.bloom > 0) {
    const radius = boss.radius + 17;
    ctx.save();
    ctx.globalAlpha = 0.82;
    ctx.strokeStyle = "#f3f49b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 5; i += 1) {
      const angle = state.time * 2.4 + (Math.PI * 2 * i) / 5;
      const px = boss.x + Math.cos(angle) * radius;
      const py = boss.y + Math.sin(angle) * radius;
      ctx.fillStyle = i % 2 === 0 ? "#ecffac" : "#9eeb85";
      ctx.fillRect(Math.round(px - 4), Math.round(py - 4), 8, 8);
    }
    ctx.restore();
  }
}

function drawEnemyHealth(ctx, enemy) {
  const width = enemy.type === "brute" ? 46 : 34;
  const y = enemy.y - enemy.radius - 16;
  const ratio = Math.max(0, enemy.hp / enemy.maxHp);

  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(Math.round(enemy.x - width / 2), Math.round(y), width, 5);
  ctx.fillStyle = enemy.type === "brute" ? "#ef7b58" : "#e05256";
  ctx.fillRect(Math.round(enemy.x - width / 2), Math.round(y), Math.round(width * ratio), 5);
}

function drawSwings(ctx, state) {
  for (const swing of state.swings) {
    const ratio = Math.max(0, swing.life / swing.maxLife);

    ctx.save();
    ctx.globalAlpha = ratio;
    ctx.strokeStyle = "#fff0a8";
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(swing.x, swing.y, swing.range, swing.angle - swing.arc / 2, swing.angle + swing.arc / 2);
    ctx.stroke();

    ctx.strokeStyle = "#8bdc75";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(swing.x, swing.y, swing.range - 8, swing.angle - swing.arc / 2, swing.angle + swing.arc / 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawParticles(ctx, state) {
  for (const particle of state.particles) {
    const alpha = Math.max(0, particle.life / particle.maxLife);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.fillRect(
      Math.round(particle.x - particle.size / 2),
      Math.round(particle.y - particle.size / 2),
      Math.max(1, Math.round(particle.size)),
      Math.max(1, Math.round(particle.size))
    );
    ctx.restore();
  }
}

import {
  angleDifference,
  angleTo,
  clamp,
  distance,
  normalize,
  TAU,
} from "../core/math.js";
import { getMovementVector, wasPressed } from "../core/input.js";
import { collidesWithObstacle } from "./collision.js";
import { spawnBurst } from "./particles.js";

const STAFF_RANGE = 68;
const STAFF_ARC = Math.PI * 0.78;
const ROOT_RANGE = 190;
const ROOT_RADIUS = 48;
const BLOOM_WINDOW = 1.1;
const BLOOM_BOLT_BONUS = 12;

export function handlePlayerAbilities(state, input) {
  const player = state.player;
  player.aimAngle = angleTo(player.x, player.y, state.mouseWorld.x, state.mouseWorld.y);

  if (input.mouse.leftPressed) castStaffStrike(state);
  if (input.mouse.rightPressed) castSpiritBolt(state);
  if (wasPressed(input, " ", "Space")) castDash(state, input);
  if (wasPressed(input, "1", "Digit1")) castRootSnare(state);
}

export function updateCombatEffects(state, dt) {
  updateProjectiles(state, dt);
  updateRoots(state, dt);
  updateSwings(state, dt);
  updateAfterImages(state, dt);
}

export function damagePlayer(state, amount, sourceX, sourceY, knockback) {
  const player = state.player;

  if (state.gameOver || player.isInvulnerable()) {
    return false;
  }

  const direction = normalize(player.x - sourceX, player.y - sourceY);

  const actualDamage = Math.round(amount * (player.incomingDamageMult || 1));
  player.hp = Math.max(0, player.hp - actualDamage);
  player.hurtFlash = 0.18;
  player.invulnerable = 0.48;
  player.vx += direction.x * knockback;
  player.vy += direction.y * knockback;
  state.shake = Math.max(state.shake, actualDamage >= 20 ? 8 : 5);

  spawnBurst(state, player.x, player.y, {
    count: 14,
    colors: ["#ffd3bd", "#ff8b70", "#fff1dc"],
    speed: 210,
    size: [2, 4],
    life: [0.18, 0.42],
  });

  if (player.hp <= 0) {
    state.gameOver = true;
    player.hp = 0;
  }

  return true;
}

export function resolveEnemyCrowding(state) {
  const enemies = state.enemies.filter((enemy) => !enemy.dead);

  for (let i = 0; i < enemies.length; i += 1) {
    for (let j = i + 1; j < enemies.length; j += 1) {
      const a = enemies[i];
      const b = enemies[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 1;
      const minDist = a.radius + b.radius + 3;

      if (dist >= minDist) continue;

      const overlap = (minDist - dist) * 0.5;
      const nx = dx / dist;
      const ny = dy / dist;

      if (a.rooted <= 0) {
        a.x -= nx * overlap;
        a.y -= ny * overlap;
      }

      if (b.rooted <= 0) {
        b.x += nx * overlap;
        b.y += ny * overlap;
      }
    }
  }
}

function castStaffStrike(state) {
  const player = state.player;
  const info = player.abilityInfo.staff;

  if (player.cooldowns.staff > 0) return;

  player.cooldowns.staff = info.cooldown;
  state.swings.push({
    x: player.x,
    y: player.y,
    angle: player.aimAngle,
    range: STAFF_RANGE,
    arc: STAFF_ARC,
    life: 0.14,
    maxLife: 0.14,
  });

  let hit = false;
  let spiritGain = 0;
  let openedBloom = false;

  for (const enemy of state.enemies) {
    if (enemy.dead) continue;

    const enemyDistance = distance(player.x, player.y, enemy.x, enemy.y);
    const enemyAngle = angleTo(player.x, player.y, enemy.x, enemy.y);
    const isInArc = Math.abs(angleDifference(enemyAngle, player.aimAngle)) <= STAFF_ARC / 2;

    if (enemyDistance <= STAFF_RANGE + enemy.radius && isInArc) {
      const result = applyStaffHit(state, enemy, info.damage);
      hit = hit || result.hit;
      spiritGain += result.spiritGain;
      openedBloom = openedBloom || result.openedBloom;
    }
  }

  const boss = getActiveBoss(state);
  if (boss) {
    const bossDistance = distance(player.x, player.y, boss.x, boss.y);
    const bossAngle = angleTo(player.x, player.y, boss.x, boss.y);
    const isBossInArc = Math.abs(angleDifference(bossAngle, player.aimAngle)) <= STAFF_ARC / 2;

    if (bossDistance <= STAFF_RANGE + boss.radius && isBossInArc) {
      const result = applyStaffHit(state, boss, info.damage);
      hit = hit || result.hit;
      spiritGain += result.spiritGain;
      openedBloom = openedBloom || result.openedBloom;
    }
  }

  if (spiritGain > 0) {
    gainSpirit(state, spiritGain);
  }

  const burstX = player.x + Math.cos(player.aimAngle) * 32;
  const burstY = player.y + Math.sin(player.aimAngle) * 32;

  spawnBurst(state, burstX, burstY, {
    count: hit ? 12 : 6,
    colors: openedBloom
      ? ["#efffaa", "#9eed7b", "#f3d27a"]
      : hit
        ? ["#fff0a8", "#ffe08a", "#f6c36a"]
        : ["#d7e7c6", "#f5f3df"],
    speed: hit ? 235 : 140,
    size: [2, 4],
    life: [0.12, 0.32],
    spread: Math.PI * 0.85,
    angle: player.aimAngle,
  });

  if (hit) state.shake = Math.max(state.shake, 3.5);
}

function castSpiritBolt(state) {
  const player = state.player;
  const info = player.abilityInfo.bolt;

  if (player.cooldowns.bolt > 0 || !player.canSpend(info.cost)) return;

  player.cooldowns.bolt = info.cooldown;
  player.spendSpirit(info.cost);

  const direction = normalize(state.mouseWorld.x - player.x, state.mouseWorld.y - player.y);

  state.projectiles.push({
    x: player.x + direction.x * 26,
    y: player.y + direction.y * 26,
    vx: direction.x * info.speed,
    vy: direction.y * info.speed,
    radius: 6,
    life: 0.9,
    damage: info.damage,
    distanceLeft: info.range,
  });

  spawnBurst(state, player.x + direction.x * 18, player.y + direction.y * 18, {
    count: 10,
    colors: ["#a9f7ff", "#65d9ff", "#f1ffff"],
    speed: 170,
    size: [2, 4],
    life: [0.12, 0.34],
    spread: Math.PI * 0.7,
    angle: Math.atan2(direction.y, direction.x),
  });
}

function castDash(state, input) {
  const player = state.player;
  const info = player.abilityInfo.dash;

  if (player.cooldowns.dash > 0) return;

  const movement = getMovementVector(input);
  const aimDirection = normalize(state.mouseWorld.x - player.x, state.mouseWorld.y - player.y);
  const direction =
    movement.x !== 0 || movement.y !== 0
      ? movement
      : aimDirection.x !== 0 || aimDirection.y !== 0
        ? aimDirection
        : { x: 1, y: 0 };

  player.cooldowns.dash = info.cooldown;
  player.dashTime = 0.16;
  player.invulnerable = 0.22;
  player.vx = direction.x * 760;
  player.vy = direction.y * 760;
  state.shake = Math.max(state.shake, 2);

  spawnBurst(state, player.x - direction.x * 8, player.y - direction.y * 8, {
    count: 16,
    colors: ["#e9fff8", "#b8f3de", "#7ed9ba"],
    speed: 260,
    size: [2, 5],
    life: [0.12, 0.28],
    spread: Math.PI * 0.8,
    angle: Math.atan2(-direction.y, -direction.x),
  });
}

function castRootSnare(state) {
  const player = state.player;
  const info = player.abilityInfo.root;

  if (player.cooldowns.root > 0 || !player.canSpend(info.cost)) return;

  const toMouse = normalize(state.mouseWorld.x - player.x, state.mouseWorld.y - player.y);
  const targetDistance = Math.min(
    ROOT_RANGE,
    distance(player.x, player.y, state.mouseWorld.x, state.mouseWorld.y)
  );
  const x = clamp(
    player.x + toMouse.x * targetDistance,
    state.arena.boundsPadding + ROOT_RADIUS,
    state.arena.width - state.arena.boundsPadding - ROOT_RADIUS
  );
  const y = clamp(
    player.y + toMouse.y * targetDistance,
    state.arena.boundsPadding + ROOT_RADIUS,
    state.arena.height - state.arena.boundsPadding - ROOT_RADIUS
  );

  player.cooldowns.root = info.cooldown;
  player.spendSpirit(info.cost);

  state.roots.push({
    x,
    y,
    radius: ROOT_RADIUS,
    life: 1.15,
    maxLife: 1.15,
    pulse: Math.random() * TAU,
  });

  for (const enemy of state.enemies) {
    if (!enemy.dead && distance(x, y, enemy.x, enemy.y) <= ROOT_RADIUS + enemy.radius) {
      enemy.rooted = Math.max(enemy.rooted, info.duration);
      enemy.stun = Math.max(enemy.stun, 0.08);
      enemy.hitFlash = 0.08;
    }
  }

  const boss = getActiveBoss(state);
  if (boss && distance(x, y, boss.x, boss.y) <= ROOT_RADIUS + boss.radius) {
    boss.rooted = Math.max(boss.rooted, Math.min(1.15, info.duration * 0.52));
    boss.stun = Math.max(boss.stun, 0.06);
    boss.hitFlash = 0.08;
  }

  spawnBurst(state, x, y, {
    count: 22,
    colors: ["#99f081", "#5fcf64", "#d7ffc7"],
    speed: 170,
    size: [2, 5],
    life: [0.18, 0.55],
  });
}

function updateProjectiles(state, dt) {
  for (const projectile of state.projectiles) {
    const moveX = projectile.vx * dt;
    const moveY = projectile.vy * dt;
    projectile.x += moveX;
    projectile.y += moveY;
    projectile.life -= dt;
    projectile.distanceLeft -= Math.hypot(moveX, moveY);

    projectile.trailTimer = (projectile.trailTimer || 0) - dt;
    if (projectile.trailTimer <= 0) {
      projectile.trailTimer = 0.035;
      spawnBurst(state, projectile.x, projectile.y, {
        count: 2,
        colors: ["#7ee7ff", "#e7ffff"],
        speed: 35,
        size: [1, 3],
        life: [0.1, 0.2],
      });
    }

    if (
      projectile.x < 0 ||
      projectile.y < 0 ||
      projectile.x > state.arena.width ||
      projectile.y > state.arena.height ||
      projectile.distanceLeft <= 0 ||
      collidesWithObstacle(projectile.x, projectile.y, projectile.radius, state.arena)
    ) {
      impactProjectile(state, projectile);
      continue;
    }

    const boss = getActiveBoss(state);
    if (
      boss &&
      distance(projectile.x, projectile.y, boss.x, boss.y) <= projectile.radius + boss.radius
    ) {
      const bloomBonus = boss.bloom > 0 ? BLOOM_BOLT_BONUS + (state.player.abilityInfo.bloomBonus || 0) : 0;

      if (bloomBonus > 0) {
        boss.bloom = 0;
        state.shake = Math.max(state.shake, 4.8);

        spawnBurst(state, boss.x, boss.y, {
          count: 20,
          colors: ["#f3ffaf", "#8ef27a", "#a9f7ff", "#f3f3c2"],
          speed: 260,
          size: [2, 5],
          life: [0.18, 0.45],
        });
      }

      damageHostile(state, boss, projectile.damage + bloomBonus, projectile.x, projectile.y, 235, 0.12);
      impactProjectile(state, projectile);
      continue;
    }

    for (const enemy of state.enemies) {
      if (enemy.dead) continue;

      if (distance(projectile.x, projectile.y, enemy.x, enemy.y) <= projectile.radius + enemy.radius) {
        const bloomBonus = enemy.bloom > 0 ? BLOOM_BOLT_BONUS + (state.player.abilityInfo.bloomBonus || 0) : 0;

        if (bloomBonus > 0) {
          enemy.bloom = 0;
          state.shake = Math.max(state.shake, 4.4);

          spawnBurst(state, enemy.x, enemy.y, {
            count: 18,
            colors: ["#f3ffaf", "#8ef27a", "#a9f7ff", "#f3f3c2"],
            speed: 250,
            size: [2, 5],
            life: [0.18, 0.45],
          });
        }

        damageHostile(state, enemy, projectile.damage + bloomBonus, projectile.x, projectile.y, 235, 0.12);
        impactProjectile(state, projectile);
        break;
      }
    }
  }

  state.projectiles = state.projectiles.filter((projectile) => projectile.life > 0);
}

function updateRoots(state, dt) {
  for (const root of state.roots) {
    root.life -= dt;

    for (const enemy of state.enemies) {
      if (enemy.dead) continue;

      if (distance(root.x, root.y, enemy.x, enemy.y) <= root.radius + enemy.radius) {
        enemy.rooted = Math.max(enemy.rooted, 0.32);
      }
    }
  }

  state.roots = state.roots.filter((root) => root.life > 0);
}

function updateSwings(state, dt) {
  for (const swing of state.swings) {
    swing.life -= dt;
  }

  state.swings = state.swings.filter((swing) => swing.life > 0);
}

function updateAfterImages(state, dt) {
  for (const image of state.afterImages) {
    image.life -= dt;
  }

  state.afterImages = state.afterImages.filter((image) => image.life > 0);
}

function impactProjectile(state, projectile) {
  projectile.life = 0;
  state.shake = Math.max(state.shake, 2.2);

  spawnBurst(state, projectile.x, projectile.y, {
    count: 12,
    colors: ["#9ff2ff", "#62d7ff", "#f0ffff"],
    speed: 185,
    size: [2, 4],
    life: [0.16, 0.36],
  });
}

function getActiveBoss(state) {
  return state.boss && !state.boss.dead ? state.boss : null;
}

function applyStaffHit(state, target, damage) {
  const wasRooted = target.rooted > 0;
  damageHostile(state, target, damage, state.player.x, state.player.y, 285, 0.18);

  if (wasRooted && !target.dead) {
    target.bloom = Math.max(target.bloom, target.isBoss ? 0.9 : BLOOM_WINDOW);

    spawnBurst(state, target.x, target.y, {
      count: target.isBoss ? 14 : 10,
      colors: ["#eaff9f", "#9eec72", "#fff0aa"],
      speed: target.isBoss ? 185 : 160,
      size: [2, 4],
      life: [0.12, 0.34],
    });
  }

  return {
    hit: true,
    spiritGain: wasRooted
      ? state.player.abilityInfo.staff.spiritGain + state.player.abilityInfo.staff.rootedSpiritGain
      : state.player.abilityInfo.staff.spiritGain,
    openedBloom: wasRooted && !target.dead,
  };
}

function gainSpirit(state, amount) {
  const player = state.player;
  const gained = Math.min(amount, player.maxSpirit - player.spirit);

  if (gained <= 0) return;

  player.spirit += gained;

  spawnBurst(state, player.x, player.y - 14, {
    count: 8 + Math.min(6, gained),
    colors: ["#97ebff", "#dffff1", "#9eed7b"],
    speed: 150,
    size: [2, 4],
    life: [0.14, 0.34],
    spread: Math.PI * 0.8,
    angle: -Math.PI / 2,
  });
}

function damageHostile(state, target, amount, sourceX, sourceY, knockback, stun) {
  const direction = normalize(target.x - sourceX, target.y - sourceY);

  target.hp = Math.max(0, target.hp - amount);
  target.hitFlash = 0.12;
  target.stun = Math.max(target.stun, stun);
  target.vx += direction.x * knockback;
  target.vy += direction.y * knockback;

  if (!target.isBoss) {
    target.state = target.hp > 0 ? "chase" : target.state;
  } else {
    target.recovery = Math.max(target.recovery || 0, 0.06);
  }

  spawnBurst(state, target.x, target.y, {
    count: target.isBoss ? 18 : amount >= 24 ? 14 : 10,
    colors: target.isBoss ? ["#ffb277", "#d85749", "#ffe4b2"] : ["#ffb08d", "#d84e46", "#ffe3c7"],
    speed: target.isBoss ? 255 : amount >= 24 ? 240 : 190,
    size: [2, target.isBoss ? 6 : 5],
    life: [0.16, target.isBoss ? 0.5 : 0.42],
  });

  if (target.hp <= 0) {
    target.dead = true;
    target.bloom = 0;
    state.shake = Math.max(state.shake, target.isBoss ? 11 : target.type === "brute" ? 7 : 4);

    if (target.isBoss) {
      target.currentAttack = null;
      target.recovery = 0;
      state.hostileProjectiles = [];
      state.eruptions = [];

      spawnBurst(state, target.x, target.y, {
        count: 48,
        colors: ["#ffd07d", "#dd6646", "#96ee77", "#fff2b7"],
        speed: 320,
        size: [2, 7],
        life: [0.24, 0.78],
      });
    } else {
      spawnBurst(state, target.x, target.y, {
        count: target.type === "brute" ? 28 : 18,
        colors: ["#c9443d", "#612323", "#f3a86e"],
        speed: target.type === "brute" ? 290 : 230,
        size: [2, 6],
        life: [0.24, 0.7],
      });
    }
  }
}

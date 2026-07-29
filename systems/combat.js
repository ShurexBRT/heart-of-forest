import {
  angleDifference,
  angleTo,
  clamp,
  distance,
  normalize,
  TAU,
} from "../core/math.js";
import { getMovementVector, wasPressed } from "../core/input.js";
import { getItemDef } from "../data/gameData.js";
import { normalizeDamageType } from "../data/regionData.js";
import {
  getPlayerBonuses,
  awardEliteBonusLoot,
  awardEnemyLoot,
  getLootIntentLabel,
  grantExperience,
} from "./progression.js";
import { collidesWithObstacle } from "./collision.js";
import { queueAudio } from "./audio.js";
import { spawnBurst } from "./particles.js";
import { pushRewardFeedback } from "./rewardFeedback.js";
import { recordTrainingDamage } from "./training.js";

const STAFF_RANGE = 68;
const STAFF_ARC = Math.PI * 0.78;
const ROOT_RANGE = 190;
const ROOT_RADIUS = 48;
const BLOOM_WINDOW = 1.1;
const BLOOM_BOLT_BONUS = 12;
const COMBAT_TAG_DURATION = 4.2;
const PULSE_PROJECTILE_CLEAR_PAD = 18;
const ABILITY_DENIED_FEEDBACK_GAP = 0.42;

const ENEMY_XP = {
  thornling: 16,
  barkling: 18,
  wisp_archer: 22,
  mire_spitter: 26,
  cinder_imp: 28,
  frost_wisp: 30,
  starbound_archer: 36,
  mire_brute: 34,
  bog_lurker: 28,
  ash_brute: 38,
  icebound_guardian: 40,
  blight_hound: 30,
  relic_sentinel: 42,
  thorn_weaver: 26,
  root_stalker: 24,
  rot_weaver: 34,
};

export function handlePlayerAbilities(state, input) {
  const player = state.player;
  player.aimAngle = angleTo(player.x, player.y, state.mouseWorld.x, state.mouseWorld.y);

  if (input.mouse.leftPressed) castStaffStrike(state);
  if (input.mouse.rightPressed) castSpiritBolt(state);
  if (wasPressed(input, " ", "Space")) castDash(state, input);
  if (wasPressed(input, "1", "Digit1")) castRootSnare(state);
  if (wasPressed(input, "r", "KeyR")) castSignatureAbility(state);
}

export function updateCombatEffects(state, dt, visualDt = dt) {
  updateProjectiles(state, dt);
  updateRoots(state, dt);
  updatePulses(state, dt);
  updateSwings(state, dt);
  updateAfterImages(state, dt);
  updateCombatText(state, visualDt);
}

export function markCombat(state, duration = COMBAT_TAG_DURATION) {
  state.combatTimer = Math.max(state.combatTimer || 0, duration);
}

export function damagePlayer(state, amount, sourceX, sourceY, knockback, damageType = "physical") {
  const player = state.player;

  if (state.gameOver || player.isInvulnerable()) {
    return false;
  }

  const direction = normalize(player.x - sourceX, player.y - sourceY);

  const normalizedType = normalizeDamageType(damageType);
  const preparation = state.progression.activePreparation;
  const preparationReduction =
    preparation?.damageType === normalizedType
      ? Math.min(
          0.4,
          (preparation.damageReduction || 0.25) +
            (player.abilityInfo.preparationReductionBonus || 0)
        )
      : 0;
  const closeReduction =
    distance(player.x, player.y, sourceX, sourceY) <= 120
      ? player.abilityInfo.closeDamageReduction || 0
      : 0;
  const actualDamage = Math.max(
    1,
    Math.round(
      amount *
        (player.incomingDamageMult || 1) *
        (1 - preparationReduction) *
        (1 - closeReduction)
    )
  );
  player.hp = Math.max(0, player.hp - actualDamage);
  player.hurtFlash = 0.18;
  player.invulnerable = 0.48;
  player.vx += direction.x * knockback;
  player.vy += direction.y * knockback;
  state.shake = Math.max(state.shake, actualDamage >= 20 ? 8 : 5);
  state.hitStop = Math.max(state.hitStop || 0, actualDamage >= 20 ? 0.055 : 0.035);
  pushCombatText(state, player.x, player.y - 22, actualDamage, "#ff9b84", true);
  markCombat(state);
  state.lastDamageType = normalizedType;
  queueAudio(state, "player-hit");

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
  player.playPose("attack", 0.16);
  markCombat(state);
  queueAudio(state, "staff");
  const range = STAFF_RANGE + (player.abilityInfo.staffRangeBonus || 0);
  const arc = STAFF_ARC + (player.abilityInfo.staffArcBonus || 0);
  const primedDamage = player.dashStaffPrimed > 0 ? player.abilityInfo.dashStaffBonus || 0 : 0;
  player.dashStaffPrimed = 0;
  state.swings.push({
    x: player.x,
    y: player.y,
    angle: player.aimAngle,
    range,
    arc,
    life: 0.14,
    maxLife: 0.14,
    hit: false,
    openedBloom: false,
  });

  let hit = false;
  let spiritGain = 0;
  let openedBloom = false;

  for (const enemy of state.enemies) {
    if (enemy.dead) continue;

    const enemyDistance = distance(player.x, player.y, enemy.x, enemy.y);
    const enemyAngle = angleTo(player.x, player.y, enemy.x, enemy.y);
    const isInArc = Math.abs(angleDifference(enemyAngle, player.aimAngle)) <= arc / 2;

    if (enemyDistance <= range + enemy.radius && isInArc) {
      const result = applyStaffHit(state, enemy, info.damage + primedDamage);
      hit = hit || result.hit;
      spiritGain += result.spiritGain;
      openedBloom = openedBloom || result.openedBloom;
    }
  }

  const boss = getActiveBoss(state);
  if (boss) {
    const bossDistance = distance(player.x, player.y, boss.x, boss.y);
    const bossAngle = angleTo(player.x, player.y, boss.x, boss.y);
    const isBossInArc = Math.abs(angleDifference(bossAngle, player.aimAngle)) <= arc / 2;

    if (bossDistance <= range + boss.radius && isBossInArc) {
      const result = applyStaffHit(state, boss, info.damage + primedDamage);
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
  const activeSwing = state.swings[state.swings.length - 1];
  if (activeSwing) {
    activeSwing.hit = hit;
    activeSwing.openedBloom = openedBloom;
  }
}

function castSpiritBolt(state) {
  const player = state.player;
  const info = player.abilityInfo.bolt;

  if (player.cooldowns.bolt > 0) {
    pushAbilityDeniedFeedback(state, "bolt", "Recharging", "#89a9bd");
    return;
  }
  if (!player.canSpend(info.cost)) {
    pushAbilityDeniedFeedback(state, "bolt", "Need Spirit", "#d87979");
    return;
  }

  player.cooldowns.bolt = info.cooldown;
  player.spendSpirit(info.cost);
  player.playPose("cast", 0.2);
  markCombat(state);
  queueAudio(state, "bolt");

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
    pierce: player.abilityInfo.boltPierce || 0,
    hitTargets: new Set(),
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

  if (player.cooldowns.dash > 0) {
    pushAbilityDeniedFeedback(state, "dash", "Dash recharging", "#89a9bd");
    return;
  }

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
  player.playPose("dash", 0.18);
  markCombat(state);
  queueAudio(state, "dash");
  player.vx = direction.x * 760;
  player.vy = direction.y * 760;
  player.dashStaffPrimed = player.abilityInfo.dashStaffBonus > 0 ? 3 : 0;
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

  if (player.abilityInfo.counterbloom) {
    state.pulses.push({
      x: player.x,
      y: player.y,
      radius: 64,
      life: 0.2,
      maxLife: 0.2,
      color: "#e7cf78",
    });
    for (const target of [...state.enemies, getActiveBoss(state)].filter(Boolean)) {
      if (!target.dead && distance(player.x, player.y, target.x, target.y) <= 64 + target.radius) {
        damageHostile(state, target, 12, player.x, player.y, 150, 0.08);
      }
    }
  }
}

function castRootSnare(state) {
  const player = state.player;
  const info = player.abilityInfo.root;

  if (player.cooldowns.root > 0) {
    pushAbilityDeniedFeedback(state, "root", "Recharging", "#89a9bd");
    return;
  }
  if (!player.canSpend(info.cost)) {
    pushAbilityDeniedFeedback(state, "root", "Need Spirit", "#d87979");
    return;
  }

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
  player.playPose("cast", 0.26);
  markCombat(state);
  queueAudio(state, "root");

  state.roots.push({
    x,
    y,
    radius: ROOT_RADIUS,
    life: 1.15,
    maxLife: 1.15,
    pulse: Math.random() * TAU,
    damagePerSecond: player.abilityInfo.rootDamagePerSecond || 0,
    damageTimer: 0.5,
  });

  for (const enemy of state.enemies) {
    if (!enemy.dead && distance(x, y, enemy.x, enemy.y) <= ROOT_RADIUS + enemy.radius) {
      enemy.rooted = Math.max(enemy.rooted, info.duration * (enemy.config.rootMultiplier || 1));
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
  gainHeartCharge(state, 6 + (player.abilityInfo.rootHeartChargeBonus || 0));
}

function castSignatureAbility(state) {
  const signature = state.player.abilityInfo.signatureAbility;
  if (!signature) {
    castVerdantPulse(state);
    return;
  }

  castUltimate(state, signature);
}

function castUltimate(state, signature) {
  const player = state.player;
  if (player.cooldowns.pulse > 0) {
    pushAbilityDeniedFeedback(state, "pulse", "Recharging", "#89a9bd");
    return;
  }
  if (player.heartCharge < 100) {
    pushAbilityDeniedFeedback(state, "pulse", "Build Heart Charge", "#fff0a0");
    return;
  }

  player.heartCharge = 0;
  player.cooldowns.pulse = 5.5;
  player.playPose("cast", 0.42);
  markCombat(state);
  queueAudio(state, "pulse");

  const specs = {
    heartwood_tempest: {
      radius: 158,
      damage: 72,
      root: 0.35,
      heal: 0,
      color: "#e7c66f",
      clearProjectiles: false,
      staffSweeps: true,
    },
    verdant_nova: {
      radius: 224,
      damage: 78,
      root: 0.25,
      heal: 0,
      color: "#78ddf5",
      clearProjectiles: true,
    },
    awaken_the_grove: {
      radius: 210,
      damage: 48,
      root: 3,
      heal: 24,
      color: "#91e07a",
      clearProjectiles: false,
    },
  };
  const spec = specs[signature];
  if (!spec) return;

  state.pulses.push({
    x: player.x,
    y: player.y,
    radius: spec.radius,
    life: 0.7,
    maxLife: 0.7,
    color: spec.color,
    ultimate: true,
  });
  if (spec.staffSweeps) {
    for (const angleOffset of [-0.92, 0, 0.92]) {
      state.swings.push({
        x: player.x,
        y: player.y,
        angle: player.aimAngle + angleOffset,
        range: spec.radius,
        arc: Math.PI * 0.86,
        life: 0.42,
        maxLife: 0.42,
        ultimate: true,
      });
    }
  }

  for (const target of [...state.enemies, getActiveBoss(state)].filter(Boolean)) {
    if (target.dead || distance(player.x, player.y, target.x, target.y) > spec.radius + target.radius) {
      continue;
    }
    const bloomDamage = target.bloom > 0 && signature === "verdant_nova" ? 24 : 0;
    target.bloom = 0;
    target.rooted = Math.max(target.rooted, target.isBoss ? Math.min(1.2, spec.root) : spec.root);
    damageHostile(state, target, spec.damage + bloomDamage, player.x, player.y, 310, 0.18);
  }

  if (spec.clearProjectiles) {
    state.hostileProjectiles = [];
  }
  if (spec.heal > 0) {
    player.hp = Math.min(player.maxHp, player.hp + spec.heal);
    state.roots.push({
      x: player.x,
      y: player.y,
      radius: spec.radius,
      life: 4,
      maxLife: 4,
      pulse: 0,
      damagePerSecond: 0,
      damageTimer: 0.5,
      healing: true,
    });
  }

  state.shake = Math.max(state.shake, 10);
  spawnBurst(state, player.x, player.y, {
    count: 52,
    colors: [spec.color, "#f5efb0", "#efffff"],
    speed: 340,
    size: [2, 7],
    life: [0.22, 0.78],
  });
}

function castVerdantPulse(state) {
  const player = state.player;
  const info = player.abilityInfo.pulse;

  if (!info.unlocked) {
    pushAbilityDeniedFeedback(state, "pulse", "Open Talents (N)", "#8f99a3");
    return;
  }
  if (player.cooldowns.pulse > 0) {
    pushAbilityDeniedFeedback(state, "pulse", "Recharging", "#89a9bd");
    return;
  }
  if (!player.canSpend(info.cost)) {
    pushAbilityDeniedFeedback(state, "pulse", "Need Spirit", "#d87979");
    return;
  }

  player.cooldowns.pulse = info.cooldown;
  player.spendSpirit(info.cost);
  player.playPose("cast", 0.28);
  markCombat(state);
  queueAudio(state, "pulse");

  state.pulses.push({
    x: player.x,
    y: player.y,
    radius: info.radius,
    life: 0.34,
    maxLife: 0.34,
  });

  let hits = 0;
  let totalHeal = 0;
  let totalRefund = 0;
  let dispelled = 0;

  const affectTarget = (target, rootMultiplier = 1) => {
    if (target.dead) return;

    const wasRooted = target.rooted > 0;
    const bloomed = target.bloom > 0;
    const bonusDamage =
      (bloomed ? 10 + Math.floor((state.player.abilityInfo.bloomBonus || 0) * 0.6) : 0) +
      (wasRooted ? 6 : 0);

    if (bloomed) {
      target.bloom = 0;
      totalHeal += target.isBoss ? 8 : 5;
      totalRefund += 6;
    } else if (wasRooted) {
      totalRefund += 2;
    }

    target.rooted = Math.max(target.rooted, info.rootDuration * rootMultiplier);
    const bossBonus =
      (target.isBoss || target.elite) && player.abilityInfo.bossSpellDamageBonus
        ? Math.round((info.damage + bonusDamage) * player.abilityInfo.bossSpellDamageBonus)
        : 0;
    damageHostile(state, target, info.damage + bonusDamage + bossBonus, player.x, player.y, 205, 0.12);
    gainHeartCharge(state, 3 + (bloomed ? player.abilityInfo.bloomHeartChargeBonus || 0 : 0));
    if (player.abilityInfo.pulseEcho && !target.dead) {
      damageHostile(state, target, Math.round(info.damage * 0.45), player.x, player.y, 80, 0.04);
    }
    hits += 1;
  };

  for (const enemy of state.enemies) {
    if (enemy.dead) continue;
    if (distance(player.x, player.y, enemy.x, enemy.y) <= info.radius + enemy.radius) {
      affectTarget(enemy, enemy.config?.rootMultiplier || 1);
    }
  }

  const boss = getActiveBoss(state);
  if (boss && distance(player.x, player.y, boss.x, boss.y) <= info.radius + boss.radius) {
    affectTarget(boss, 0.68);
  }

  for (const projectile of state.hostileProjectiles) {
    if (distance(player.x, player.y, projectile.x, projectile.y) <= info.radius + PULSE_PROJECTILE_CLEAR_PAD) {
      projectile.life = 0;
      dispelled += 1;

      spawnBurst(state, projectile.x, projectile.y, {
        count: 8,
        colors: ["#bffcff", "#88ddff", "#f5ffff"],
        speed: 120,
        size: [1, 3],
        life: [0.08, 0.22],
      });
    }
  }

  if (dispelled > 0) {
    state.hostileProjectiles = state.hostileProjectiles.filter((projectile) => projectile.life > 0);
  }

  if (totalRefund > 0) {
    gainSpirit(state, totalRefund);
  }

  if (totalHeal > 0) {
    player.hp = Math.min(player.maxHp, player.hp + totalHeal);
    spawnBurst(state, player.x, player.y - 12, {
      count: 10 + Math.min(8, totalHeal),
      colors: ["#bff7b8", "#7fe389", "#f2ffd8"],
      speed: 125,
      size: [2, 4],
      life: [0.12, 0.28],
      spread: Math.PI * 0.85,
      angle: -Math.PI / 2,
    });
  }

  spawnBurst(state, player.x, player.y, {
    count: hits > 0 || dispelled > 0 ? 28 : 18,
    colors: hits > 0 ? ["#d9ffb2", "#83eb83", "#79dfff", "#f1ffdf"] : ["#bcefb7", "#8ed998", "#efffdd"],
    speed: hits > 0 ? 255 : 180,
    size: [2, 5],
    life: [0.14, 0.42],
  });

  if (hits > 0 || dispelled > 0) {
    state.shake = Math.max(state.shake, dispelled > 0 ? 4 : 3.2);
  }
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
      if (projectile.hitTargets?.has(boss)) continue;
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

      const bossBonus = Math.round(
        (projectile.damage + bloomBonus) * (state.player.abilityInfo.bossSpellDamageBonus || 0)
      );
      damageHostile(state, boss, projectile.damage + bloomBonus + bossBonus, projectile.x, projectile.y, 235, 0.12);
      gainHeartCharge(
        state,
        4 + (bloomBonus > 0 ? state.player.abilityInfo.bloomHeartChargeBonus || 0 : 0)
      );
      projectile.hitTargets?.add(boss);
      if (projectile.pierce > 0) {
        projectile.pierce -= 1;
      } else {
        impactProjectile(state, projectile);
      }
      continue;
    }

    for (const enemy of state.enemies) {
      if (enemy.dead) continue;

      if (distance(projectile.x, projectile.y, enemy.x, enemy.y) <= projectile.radius + enemy.radius) {
        if (projectile.hitTargets?.has(enemy)) continue;
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

        const eliteBonus = enemy.elite
          ? Math.round(
              (projectile.damage + bloomBonus) *
                (state.player.abilityInfo.bossSpellDamageBonus || 0)
            )
          : 0;
        damageHostile(state, enemy, projectile.damage + bloomBonus + eliteBonus, projectile.x, projectile.y, 235, 0.12);
        gainHeartCharge(
          state,
          4 + (bloomBonus > 0 ? state.player.abilityInfo.bloomHeartChargeBonus || 0 : 0)
        );
        projectile.hitTargets?.add(enemy);
        if (projectile.pierce > 0) {
          projectile.pierce -= 1;
        } else {
          impactProjectile(state, projectile);
        }
        break;
      }
    }
  }

  state.projectiles = state.projectiles.filter((projectile) => projectile.life > 0);
}

function updateRoots(state, dt) {
  for (const root of state.roots) {
    root.life -= dt;
    root.damageTimer = (root.damageTimer || 0.5) - dt;

    for (const enemy of state.enemies) {
      if (enemy.dead) continue;

      if (distance(root.x, root.y, enemy.x, enemy.y) <= root.radius + enemy.radius) {
        enemy.rooted = Math.max(enemy.rooted, 0.32 * (enemy.config.rootMultiplier || 1));
        if (root.damagePerSecond > 0 && root.damageTimer <= 0) {
          damageHostile(state, enemy, root.damagePerSecond * 0.5, root.x, root.y, 20, 0);
        }
      }
    }
    const boss = getActiveBoss(state);
    if (
      boss &&
      distance(root.x, root.y, boss.x, boss.y) <= root.radius + boss.radius &&
      root.damagePerSecond > 0 &&
      root.damageTimer <= 0
    ) {
      damageHostile(state, boss, root.damagePerSecond * 0.5, root.x, root.y, 10, 0);
    }

    if (root.healing && distance(root.x, root.y, state.player.x, state.player.y) <= root.radius) {
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 2 * dt);
    }
    if (root.damageTimer <= 0) root.damageTimer = 0.5;
  }

  state.roots = state.roots.filter((root) => root.life > 0);
}

function updatePulses(state, dt) {
  for (const pulse of state.pulses) {
    pulse.life -= dt;
  }

  state.pulses = state.pulses.filter((pulse) => pulse.life > 0);
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
  gainHeartCharge(state, 5 + (state.player.abilityInfo.staffHeartChargeBonus || 0));

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

  markCombat(state);
  if (target.trainingDummy) {
    target.hitFlash = 0.12;
    target.stun = Math.max(target.stun, Math.min(0.08, stun));
    recordTrainingDamage(state, target, amount);
    pushCombatText(state, target.x, target.y - 34, Math.round(amount), "#ffe5a8", false, {
      heavy: amount >= 24,
    });
    state.hitStop = Math.max(state.hitStop || 0, amount >= 24 ? 0.04 : 0.02);
    spawnBurst(state, target.x, target.y - 8, {
      count: amount >= 24 ? 12 : 8,
      colors: ["#f1d78b", "#8fc982", "#fff0bc"],
      speed: amount >= 24 ? 210 : 160,
      size: [2, 4],
      life: [0.14, 0.34],
    });
    queueAudio(state, "enemy-hit");
    return;
  }

  target.hp = Math.max(0, target.hp - amount);
  target.hitFlash = 0.12;
  target.stun = Math.max(target.stun, stun);
  target.vx += direction.x * knockback;
  target.vy += direction.y * knockback;
  pushCombatText(
    state,
    target.x,
    target.y - (target.isBoss ? 42 : 24),
    Math.round(amount),
    target.isBoss ? "#ffe19b" : "#fff2cf",
    false,
    {
      heavy: target.isBoss || amount >= 24 || target.hp <= 0,
    }
  );
  state.hitStop = Math.max(
    state.hitStop || 0,
    target.hp <= 0 ? (target.isBoss ? 0.085 : 0.06) : target.isBoss || amount >= 24 ? 0.045 : 0.025
  );

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
  queueAudio(state, "enemy-hit");

  if (target.hp <= 0) {
    target.dead = true;
    target.bloom = 0;
    state.shake = Math.max(
      state.shake,
      target.isBoss ? 11 : target.type === "mire_brute" ? 7 : 4
    );

    if (target.isBoss) {
      state.storyEvents.push({ type: "bossDefeated", bossId: target.id || "elder_hollow" });
      queueAudio(state, "boss-down");
    } else {
      state.storyEvents.push({ type: "enemyDefeated", enemyType: target.type });
      queueAudio(state, "enemy-down");
    }

    const xpValue = target.isBoss ? 180 : (ENEMY_XP[target.type] || 14) + (target.elite ? 18 : 0);
    const xpResult = grantExperience(state.progression, xpValue);
    if (xpResult.levelsGained > 0) {
      state.player.refreshFromModifiers(getPlayerBonuses(state.progression));
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + Math.round(state.player.maxHp * 0.34));
      state.player.spirit = Math.min(state.player.maxSpirit, state.player.spirit + Math.round(state.player.maxSpirit * 0.38));
      setToast(state, `Level ${state.progression.level} reached`, 2.6);
      queueAudio(state, "level-up");
    }

    const lootSource = target.isBoss
      ? {
          isBoss: true,
          id: target.id || "elder_hollow",
          isPostgameTrial: Boolean(state.encounter?.isReliquaryTrial),
        }
      : target;
    const lootResult = awardEnemyLoot(
      state.progression,
      target.type,
      state.scene.biomeId,
      lootSource
    );
    const eliteBonus =
      target.elite && !target.isBoss ? awardEliteBonusLoot(state.progression, state.scene.biomeId, target) : null;
    const combinedLoot = [
      ...(lootResult?.items || []),
      ...(eliteBonus?.items || []),
    ];
    const silverLoot = (lootResult?.silver || 0) + (eliteBonus?.silver || 0);
    if (combinedLoot.length > 0 || silverLoot > 0) {
      pushRewardFeedback(
        state,
        target.x,
        target.y,
        { items: combinedLoot, silver: silverLoot },
        {
          boss: target.isBoss,
          count: target.isBoss ? 28 : target.elite ? 16 : 9,
        }
      );
    }
    if (combinedLoot.length > 0 && (target.isBoss || target.elite || combinedLoot.some((entry) => entry.itemId.includes("potion")))) {
      const lead = combinedLoot[0];
      const extraItemCount = combinedLoot.reduce((total, entry) => total + Math.max(0, entry.amount || 0), 0) - (lead.amount || 0);
      const roleText = getLootIntentLabel(lead.itemId);
      const extraText = extraItemCount > 0 ? ` +${extraItemCount} more` : "";
      const silverText = silverLoot > 0 ? ` and ${silverLoot} silver` : "";
      setToast(
        state,
        `Looted ${lead.amount} ${formatItemName(lead.itemId)} (${roleText})${extraText}${silverText}`,
        2.1
      );
    }

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
        count: target.type === "mire_brute" ? 28 : 18,
        colors: ["#c9443d", "#612323", "#f3a86e"],
        speed: target.type === "mire_brute" ? 290 : 230,
        size: [2, 6],
        life: [0.24, 0.7],
      });
    }

    if (
      !target.isBoss &&
      target.rooted > 0 &&
      state.player.abilityInfo.spreadingRoots
    ) {
      for (const enemy of state.enemies) {
        if (
          enemy !== target &&
          !enemy.dead &&
          distance(target.x, target.y, enemy.x, enemy.y) <= 92
        ) {
          enemy.rooted = Math.max(enemy.rooted, 0.8 * (enemy.config.rootMultiplier || 1));
        }
      }
    }
  }
}

function pushCombatText(state, x, y, amount, color, playerHit = false, options = {}) {
  if (state.settings?.damageNumbers === false) return;
  state.combatText = state.combatText || [];
  const heavy = Boolean(options.heavy);
  state.combatText.push({
    x,
    y,
    text: `${playerHit ? "-" : ""}${Math.max(1, Math.round(amount))}`,
    color,
    life: heavy ? 0.86 : 0.72,
    maxLife: heavy ? 0.86 : 0.72,
    rise: playerHit ? 24 : heavy ? 36 : 30,
    scale: heavy ? 1.14 : 1,
    heavy,
  });
  if (state.combatText.length > 32) {
    state.combatText.splice(0, state.combatText.length - 32);
  }
}

function pushAbilityDeniedFeedback(state, abilityName, text, color) {
  const player = state.player;
  if (!player || !text) return;

  const now = state.time || 0;
  const key = `${abilityName}:${text}`;
  state.abilityDeniedFeedbackUntil = state.abilityDeniedFeedbackUntil || {};
  if ((state.abilityDeniedFeedbackUntil[key] || 0) > now) {
    return;
  }
  state.abilityDeniedFeedbackUntil[key] = now + ABILITY_DENIED_FEEDBACK_GAP;

  state.combatText = state.combatText || [];
  state.combatText.push({
    x: player.x,
    y: player.y - 34,
    text,
    color,
    life: 0.72,
    maxLife: 0.72,
    rise: 18,
    scale: 0.84,
    heavy: false,
    abilityDenied: true,
  });
  if (state.combatText.length > 40) {
    state.combatText.splice(0, state.combatText.length - 40);
  }
  queueAudio(state, "ui");
}

function updateCombatText(state, dt) {
  state.combatText = state.combatText || [];
  for (const entry of state.combatText) {
    entry.y -= entry.rise * dt;
    entry.life -= dt;
  }
  state.combatText = state.combatText.filter((entry) => entry.life > 0);
}

function gainHeartCharge(state, amount) {
  const player = state.player;
  player.heartCharge = Math.min(100, (player.heartCharge || 0) + Math.max(0, amount || 0));
}

function formatItemName(itemId) {
  return getItemDef(itemId)?.name || itemId;
}

function setToast(state, text, duration) {
  state.story.toastText = text;
  state.story.toastTimer = duration;
}

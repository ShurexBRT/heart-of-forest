import { angleTo, distance, normalize, randomRange } from "../core/math.js";
import { moveCircleWithCollisions } from "../systems/collision.js";
import { damagePlayer } from "../systems/combat.js";

const ENEMY_CONFIG = {
  thornling: {
    label: "Thornling",
    role: "melee",
    maxHp: 44,
    radius: 14,
    speed: 148,
    wanderSpeed: 48,
    detectRange: 360,
    leashRange: 470,
    attackRange: 28,
    damage: 10,
    windup: 0.18,
    recover: 0.36,
    knockback: 200,
    rootMultiplier: 1,
    sprite: "thornling",
    meleeLunge: 90,
    animRate: 5.1,
    friction: 4.1,
    healthColor: "#e05256",
    windupColor: "#ffd27a",
  },
  barkling: {
    label: "Barkling",
    role: "melee",
    maxHp: 52,
    radius: 15,
    speed: 134,
    wanderSpeed: 42,
    detectRange: 370,
    leashRange: 490,
    attackRange: 30,
    damage: 11,
    windup: 0.22,
    recover: 0.38,
    knockback: 194,
    rootMultiplier: 1.08,
    sprite: "thornling",
    spriteTint: "#5f8241",
    spriteTintAlpha: 0.24,
    meleeLunge: 96,
    animRate: 4.9,
    friction: 4.2,
    healthColor: "#d78054",
    windupColor: "#efd57b",
  },
  root_stalker: {
    label: "Root Stalker",
    role: "support",
    maxHp: 72,
    radius: 16,
    speed: 98,
    wanderSpeed: 34,
    detectRange: 420,
    leashRange: 560,
    attackRange: 255,
    preferredRange: 214,
    retreatRange: 140,
    damage: 10,
    windup: 0.38,
    recover: 0.58,
    knockback: 142,
    rootMultiplier: 0.94,
    supportRadius: 150,
    supportHeal: 14,
    sprite: "thorn_weaver",
    spriteTint: "#658c52",
    spriteTintAlpha: 0.2,
    animRate: 4.6,
    friction: 4.2,
    hazardType: "thorn",
    healthColor: "#8fdd81",
    windupColor: "#94ee8a",
  },
  mire_brute: {
    label: "Mire Brute",
    role: "melee",
    maxHp: 156,
    radius: 23,
    speed: 74,
    wanderSpeed: 20,
    detectRange: 390,
    leashRange: 540,
    attackRange: 44,
    damage: 26,
    windup: 0.42,
    recover: 0.86,
    knockback: 320,
    rootMultiplier: 0.5,
    sprite: "mire_brute",
    meleeLunge: 185,
    animRate: 3.4,
    friction: 4.6,
    healthColor: "#ef7b58",
    windupColor: "#ffb45d",
  },
  mire_spitter: {
    label: "Mire Spitter",
    role: "ranged",
    maxHp: 74,
    radius: 16,
    speed: 102,
    wanderSpeed: 30,
    detectRange: 450,
    leashRange: 590,
    attackRange: 284,
    preferredRange: 228,
    retreatRange: 144,
    damage: 14,
    windup: 0.36,
    recover: 0.56,
    knockback: 158,
    rootMultiplier: 0.82,
    projectileSpeed: 246,
    projectileLife: 1.9,
    projectileType: "mire",
    sprite: "wisp_archer",
    spriteTint: "#4d8d7a",
    spriteTintAlpha: 0.24,
    animRate: 4.15,
    friction: 4.2,
    healthColor: "#82d4c1",
    windupColor: "#9be8db",
  },
  bog_lurker: {
    label: "Bog Lurker",
    role: "melee",
    maxHp: 112,
    radius: 18,
    speed: 98,
    wanderSpeed: 24,
    detectRange: 380,
    leashRange: 520,
    attackRange: 34,
    damage: 18,
    windup: 0.3,
    recover: 0.52,
    knockback: 225,
    rootMultiplier: 0.74,
    sprite: "mire_brute",
    spriteTint: "#456d57",
    spriteTintAlpha: 0.2,
    meleeLunge: 120,
    animRate: 4.2,
    friction: 4.35,
    healthColor: "#74b89d",
    windupColor: "#9ce0cd",
  },
  ash_brute: {
    label: "Ash Brute",
    role: "melee",
    maxHp: 174,
    radius: 23,
    speed: 82,
    wanderSpeed: 20,
    detectRange: 402,
    leashRange: 560,
    attackRange: 46,
    damage: 28,
    windup: 0.4,
    recover: 0.82,
    knockback: 340,
    rootMultiplier: 0.56,
    sprite: "mire_brute",
    spriteTint: "#9d4c33",
    spriteTintAlpha: 0.24,
    meleeLunge: 195,
    animRate: 3.5,
    friction: 4.7,
    healthColor: "#ff7b58",
    windupColor: "#ffc16e",
  },
  wisp_archer: {
    label: "Wisp Archer",
    role: "ranged",
    maxHp: 66,
    radius: 16,
    speed: 106,
    wanderSpeed: 32,
    detectRange: 450,
    leashRange: 580,
    attackRange: 270,
    preferredRange: 218,
    retreatRange: 138,
    damage: 13,
    windup: 0.34,
    recover: 0.52,
    knockback: 150,
    rootMultiplier: 0.78,
    projectileSpeed: 262,
    projectileLife: 1.8,
    projectileType: "wisp",
    sprite: "wisp_archer",
    animRate: 4.1,
    friction: 4.1,
    healthColor: "#8fd9ff",
    windupColor: "#a8e4ff",
  },
  cinder_imp: {
    label: "Cinder Imp",
    role: "ranged",
    maxHp: 62,
    radius: 15,
    speed: 118,
    wanderSpeed: 36,
    detectRange: 445,
    leashRange: 580,
    attackRange: 266,
    preferredRange: 214,
    retreatRange: 132,
    damage: 15,
    windup: 0.3,
    recover: 0.48,
    knockback: 142,
    rootMultiplier: 0.86,
    projectileSpeed: 278,
    projectileLife: 1.7,
    projectileType: "ember",
    sprite: "wisp_archer",
    spriteTint: "#b75f39",
    spriteTintAlpha: 0.24,
    animRate: 4.45,
    friction: 4.05,
    healthColor: "#f08c5a",
    windupColor: "#ffb36a",
  },
  frost_wisp: {
    label: "Frost Wisp",
    role: "ranged",
    maxHp: 68,
    radius: 16,
    speed: 110,
    wanderSpeed: 34,
    detectRange: 465,
    leashRange: 600,
    attackRange: 290,
    preferredRange: 236,
    retreatRange: 148,
    damage: 15,
    windup: 0.34,
    recover: 0.5,
    knockback: 150,
    rootMultiplier: 0.82,
    projectileSpeed: 276,
    projectileLife: 1.95,
    projectileType: "frost",
    sprite: "wisp_archer",
    spriteTint: "#92c5e5",
    spriteTintAlpha: 0.24,
    animRate: 4.2,
    friction: 4.08,
    healthColor: "#9edfff",
    windupColor: "#dcf4ff",
  },
  starbound_archer: {
    label: "Starbound Archer",
    role: "ranged",
    maxHp: 86,
    radius: 17,
    speed: 114,
    wanderSpeed: 34,
    detectRange: 490,
    leashRange: 620,
    attackRange: 300,
    preferredRange: 245,
    retreatRange: 150,
    damage: 17,
    windup: 0.34,
    recover: 0.52,
    knockback: 160,
    rootMultiplier: 0.8,
    projectileSpeed: 292,
    projectileLife: 2,
    projectileType: "ancient",
    sprite: "wisp_archer",
    spriteTint: "#9b8be3",
    spriteTintAlpha: 0.24,
    animRate: 4.25,
    friction: 4.08,
    healthColor: "#d3c2ff",
    windupColor: "#f3e1a4",
  },
  thorn_weaver: {
    label: "Thorn Weaver",
    role: "support",
    maxHp: 78,
    radius: 17,
    speed: 96,
    wanderSpeed: 30,
    detectRange: 430,
    leashRange: 590,
    attackRange: 280,
    preferredRange: 234,
    retreatRange: 148,
    damage: 11,
    windup: 0.4,
    recover: 0.62,
    knockback: 150,
    rootMultiplier: 0.84,
    projectileSpeed: 224,
    projectileLife: 2.1,
    supportRadius: 160,
    supportHeal: 16,
    sprite: "thorn_weaver",
    animRate: 4.5,
    friction: 4.15,
    hazardType: "thorn",
    healthColor: "#c2a2ff",
    windupColor: "#b29aff",
  },
  rot_weaver: {
    label: "Rot Weaver",
    role: "support",
    maxHp: 88,
    radius: 18,
    speed: 98,
    wanderSpeed: 30,
    detectRange: 440,
    leashRange: 600,
    attackRange: 288,
    preferredRange: 240,
    retreatRange: 150,
    damage: 13,
    windup: 0.42,
    recover: 0.64,
    knockback: 150,
    rootMultiplier: 0.78,
    projectileSpeed: 226,
    projectileLife: 2.1,
    supportRadius: 170,
    supportHeal: 18,
    sprite: "thorn_weaver",
    spriteTint: "#8d4aa7",
    spriteTintAlpha: 0.26,
    animRate: 4.45,
    friction: 4.18,
    hazardType: "blight",
    healthColor: "#cf97ff",
    windupColor: "#de9cff",
  },
  icebound_guardian: {
    label: "Icebound Guardian",
    role: "melee",
    maxHp: 168,
    radius: 22,
    speed: 80,
    wanderSpeed: 22,
    detectRange: 390,
    leashRange: 560,
    attackRange: 42,
    damage: 24,
    windup: 0.38,
    recover: 0.74,
    knockback: 310,
    rootMultiplier: 0.42,
    sprite: "mire_brute",
    spriteTint: "#9cbfd9",
    spriteTintAlpha: 0.24,
    meleeLunge: 175,
    animRate: 3.3,
    friction: 4.75,
    healthColor: "#a6d6ff",
    windupColor: "#ebf8ff",
  },
  blight_hound: {
    label: "Blight Hound",
    role: "melee",
    maxHp: 84,
    radius: 15,
    speed: 156,
    wanderSpeed: 52,
    detectRange: 420,
    leashRange: 590,
    attackRange: 30,
    damage: 17,
    windup: 0.16,
    recover: 0.34,
    knockback: 210,
    rootMultiplier: 0.9,
    sprite: "thornling",
    spriteTint: "#8c334f",
    spriteTintAlpha: 0.28,
    meleeLunge: 115,
    animRate: 5.5,
    friction: 4.05,
    healthColor: "#d76b7d",
    windupColor: "#d891ff",
  },
  relic_sentinel: {
    label: "Relic Sentinel",
    role: "melee",
    maxHp: 146,
    radius: 20,
    speed: 96,
    wanderSpeed: 26,
    detectRange: 430,
    leashRange: 590,
    attackRange: 38,
    damage: 22,
    windup: 0.32,
    recover: 0.58,
    knockback: 250,
    rootMultiplier: 0.68,
    sprite: "mire_brute",
    spriteTint: "#998552",
    spriteTintAlpha: 0.22,
    meleeLunge: 150,
    animRate: 4,
    friction: 4.45,
    healthColor: "#e2c686",
    windupColor: "#f4da9e",
  },
};

const ELITE_AFFIXES = {
  swift: {
    label: "Swift",
    color: "#8adfff",
    apply(config) {
      config.speed *= 1.22;
      config.wanderSpeed *= 1.2;
      config.damage *= 1.08;
    },
  },
  bulwark: {
    label: "Bulwark",
    color: "#f3cf83",
    apply(config) {
      config.maxHp *= 1.42;
      config.rootMultiplier *= 0.72;
      config.knockback *= 1.1;
    },
  },
  bloodbound: {
    label: "Bloodbound",
    color: "#ff8e7e",
    apply(config) {
      config.damage *= 1.2;
      config.attackRange *= 1.08;
      config.windup *= 0.92;
    },
  },
  spiteful: {
    label: "Spiteful",
    color: "#c7a3ff",
    apply(config) {
      config.detectRange *= 1.16;
      config.leashRange *= 1.1;
      if (config.projectileSpeed) config.projectileSpeed *= 1.12;
      if (config.preferredRange) config.preferredRange *= 1.04;
    },
  },
};

export class Enemy {
  constructor(x, y, type = "thornling", options = {}) {
    const resolvedType =
      type === "basic" ? "thornling" : type === "brute" ? "mire_brute" : type;
    const baseConfig = ENEMY_CONFIG[resolvedType] || ENEMY_CONFIG.thornling;
    const config = { ...baseConfig };
    const hpScale = options.hpScale ?? 1;
    const damageScale = options.damageScale ?? 1;
    const affixes = (options.affixes || []).filter((id) => ELITE_AFFIXES[id]);

    for (const affixId of affixes) {
      ELITE_AFFIXES[affixId].apply(config);
    }

    this.x = x;
    this.y = y;
    this.type = resolvedType;
    this.config = config;
    this.affixes = affixes;
    this.elite = Boolean(options.elite || affixes.length > 0);
    this.name =
      affixes.length > 0
        ? `${ELITE_AFFIXES[affixes[0]].label} ${config.label}`
        : config.label;
    this.eliteColor = affixes.length > 0 ? ELITE_AFFIXES[affixes[0]].color : null;
    this.radius = config.radius;
    this.maxHp = Math.round(config.maxHp * hpScale * (this.elite ? 1.18 : 1));
    this.hp = this.maxHp;
    this.damage = Math.round(config.damage * damageScale * (this.elite ? 1.08 : 1));
    this.vx = 0;
    this.vy = 0;
    this.state = "idle";
    this.stateTimer = randomRange(0.4, 1.2);
    this.wanderAngle = randomRange(0, Math.PI * 2);
    this.facing = 0;
    this.attackAngle = 0;
    this.attackCooldown = randomRange(0.25, 0.8);
    this.attackMode = "projectile";
    this.hitFlash = 0;
    this.stun = 0;
    this.rooted = 0;
    this.bloom = 0;
    this.animTime = randomRange(0, 4);
    this.pose = "idle";
    this.dead = false;
  }

  update(dt, state) {
    if (this.dead) return;

    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.stun = Math.max(0, this.stun - dt);
    this.rooted = Math.max(0, this.rooted - dt);
    this.bloom = Math.max(0, this.bloom - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);

    const player = state.player;
    const toPlayer = normalize(player.x - this.x, player.y - this.y);
    const playerDistance = distance(this.x, this.y, player.x, player.y);
    this.facing = angleTo(this.x, this.y, player.x, player.y);

    if (this.stun > 0) {
      this.pose = "stun";
      this.animTime += dt * 7;
      this.applyFriction(dt, 7);
      this.move(dt, state);
      return;
    }

    switch (this.state) {
      case "idle":
        this.updateIdle(dt, playerDistance);
        break;
      case "wander":
        this.updateWander(dt, playerDistance);
        break;
      case "chase":
        this.updateChase(dt, playerDistance, toPlayer, state);
        break;
      case "windup":
        this.updateWindup(dt, state, playerDistance);
        break;
      case "recover":
        this.updateRecover(dt, playerDistance);
        break;
      default:
        this.state = "idle";
        break;
    }

    this.applyFriction(dt, this.rooted > 0 ? 12 : this.config.friction || 4.1);
    this.move(dt, state);
    this.updateAnimation(dt);
  }

  updateIdle(dt, playerDistance) {
    this.stateTimer -= dt;

    if (playerDistance < this.config.detectRange) {
      this.state = "chase";
      return;
    }

    if (this.stateTimer <= 0) {
      this.state = "wander";
      this.stateTimer = randomRange(0.7, 1.5);
      this.wanderAngle = randomRange(0, Math.PI * 2);
    }
  }

  updateWander(dt, playerDistance) {
    this.stateTimer -= dt;

    if (playerDistance < this.config.detectRange) {
      this.state = "chase";
      return;
    }

    if (this.rooted <= 0) {
      this.vx += Math.cos(this.wanderAngle) * this.config.wanderSpeed * dt;
      this.vy += Math.sin(this.wanderAngle) * this.config.wanderSpeed * dt;
    }

    if (this.stateTimer <= 0) {
      this.state = "idle";
      this.stateTimer = randomRange(0.6, 1.4);
    }
  }

  updateChase(dt, playerDistance, toPlayer, state) {
    if (playerDistance > this.config.leashRange) {
      this.state = "wander";
      this.stateTimer = randomRange(0.7, 1.4);
      return;
    }

    if (this.config.role === "ranged") {
      this.updateRangedPositioning(dt, playerDistance, toPlayer, state);
      return;
    }

    if (this.config.role === "support") {
      this.updateSupportPositioning(dt, playerDistance, toPlayer, state);
      return;
    }

    if (playerDistance < this.config.attackRange + this.radius) {
      this.startAttack();
      return;
    }

    if (this.rooted <= 0) {
      this.vx += toPlayer.x * this.config.speed * 5.5 * dt;
      this.vy += toPlayer.y * this.config.speed * 5.5 * dt;
      this.limitSpeed(this.config.speed);
    }
  }

  updateRangedPositioning(dt, playerDistance, toPlayer, state) {
    if (playerDistance <= this.config.attackRange && this.attackCooldown <= 0) {
      this.startAttack();
      return;
    }

    if (this.rooted > 0) {
      return;
    }

    let moveX = 0;
    let moveY = 0;

    if (playerDistance < this.config.retreatRange) {
      moveX -= toPlayer.x;
      moveY -= toPlayer.y;
    } else if (playerDistance > this.config.preferredRange) {
      moveX += toPlayer.x;
      moveY += toPlayer.y;
    } else {
      moveX += -toPlayer.y * 0.7;
      moveY += toPlayer.x * 0.7;
    }

    const direction = normalize(moveX, moveY);
    this.vx += direction.x * this.config.speed * 4.8 * dt;
    this.vy += direction.y * this.config.speed * 4.8 * dt;
    this.limitSpeed(this.config.speed);

    if (playerDistance <= this.config.attackRange + 18 && this.attackCooldown <= 0) {
      this.startAttack();
    }

    if (collidesWithSceneEdge(this, state)) {
      this.wanderAngle += Math.PI * 0.5;
    }
  }

  updateSupportPositioning(dt, playerDistance, toPlayer, state) {
    if (this.attackCooldown <= 0) {
      const ally = state.enemies.find(
        (enemy) =>
          enemy !== this &&
          !enemy.dead &&
          distance(this.x, this.y, enemy.x, enemy.y) <= this.config.supportRadius &&
          enemy.hp < enemy.maxHp * 0.76
      );

      if (ally) {
        this.attackMode = "mend";
        this.startAttack();
        return;
      }

      if (playerDistance <= this.config.attackRange + 12) {
        this.attackMode = "snare";
        this.startAttack();
        return;
      }
    }

    if (this.rooted > 0) {
      return;
    }

    let moveX = 0;
    let moveY = 0;

    if (playerDistance < this.config.retreatRange) {
      moveX -= toPlayer.x;
      moveY -= toPlayer.y;
    } else if (playerDistance > this.config.preferredRange) {
      moveX += toPlayer.x * 0.7;
      moveY += toPlayer.y * 0.7;
    } else {
      moveX += toPlayer.y * 0.9;
      moveY += -toPlayer.x * 0.9;
    }

    const direction = normalize(moveX, moveY);
    this.vx += direction.x * this.config.speed * 4.5 * dt;
    this.vy += direction.y * this.config.speed * 4.5 * dt;
    this.limitSpeed(this.config.speed);
  }

  startAttack() {
    this.state = "windup";
    this.stateTimer = this.config.windup;
    this.attackAngle = this.facing;
    this.vx *= 0.32;
    this.vy *= 0.32;
  }

  updateWindup(dt, state, playerDistance) {
    this.stateTimer -= dt;
    this.vx *= Math.max(0, 1 - 12 * dt);
    this.vy *= Math.max(0, 1 - 12 * dt);

    if (this.stateTimer > 0) return;

    if (this.config.role === "ranged") {
      this.fireProjectile(state);
      this.state = "recover";
      this.stateTimer = this.config.recover;
      this.attackCooldown = (this.elite ? 1.05 : 1.2) + randomRange(0, 0.32);
      return;
    }

    if (this.config.role === "support") {
      if (this.attackMode === "mend") {
        this.performMend(state);
      } else {
        this.performSnare(state);
      }
      this.state = "recover";
      this.stateTimer = this.config.recover;
      this.attackCooldown = (this.attackMode === "mend" ? 1.4 : 1.18) + randomRange(0.08, 0.34);
      return;
    }

    if (playerDistance < this.config.attackRange + state.player.radius + 8) {
      damagePlayer(state, this.damage, this.x, this.y, this.config.knockback);
    }

    const lunge = this.config.meleeLunge || 90;
    this.vx += Math.cos(this.attackAngle) * lunge;
    this.vy += Math.sin(this.attackAngle) * lunge;
    this.state = "recover";
    this.stateTimer = this.config.recover;
    this.attackCooldown = this.elite ? 0.48 : 0.6;
  }

  updateRecover(dt, playerDistance) {
    this.stateTimer -= dt;

    if (this.stateTimer <= 0) {
      this.state = playerDistance < this.config.detectRange ? "chase" : "idle";
      this.stateTimer = randomRange(0.4, 0.9);
    }
  }

  fireProjectile(state) {
    const angle = this.attackAngle;
    state.hostileProjectiles.push({
      x: this.x + Math.cos(angle) * 18,
      y: this.y + Math.sin(angle) * 18,
      vx: Math.cos(angle) * this.config.projectileSpeed,
      vy: Math.sin(angle) * this.config.projectileSpeed,
      radius: 7,
      life: this.config.projectileLife,
      damage: this.damage,
      knockback: this.config.knockback,
        type: this.config.projectileType || (this.elite ? "thorn" : "wisp"),
        owner: this,
      });
  }

  performMend(state) {
    for (const ally of state.enemies) {
      if (ally === this || ally.dead) continue;
      if (distance(this.x, this.y, ally.x, ally.y) > this.config.supportRadius) continue;
      const heal = this.config.supportHeal * (this.elite ? 1.25 : 1);
      ally.hp = Math.min(ally.maxHp, ally.hp + heal);
      ally.hitFlash = Math.max(ally.hitFlash, 0.08);
      ally.stun = Math.max(0, ally.stun - 0.04);
    }

    state.eruptions.push({
      x: this.x,
      y: this.y,
      radius: 42,
      warning: 0,
      active: 0.18,
      damage: 0,
      hitPlayer: true,
      harmless: true,
      support: true,
    });
  }

  performSnare(state) {
    const angles = [-0.3, 0.28];
    for (const offset of angles) {
      const angle = this.attackAngle + offset;
      state.eruptions.push({
        x: state.player.x + Math.cos(angle) * 22,
        y: state.player.y + Math.sin(angle) * 22,
        radius: this.elite ? 44 : 36,
        warning: 0.5,
        active: 0.32,
        damage: this.elite ? 18 : 14,
        hitPlayer: false,
        type: this.config.hazardType || "thorn",
      });
    }
  }

  limitSpeed(maxSpeed) {
    const speed = Math.hypot(this.vx, this.vy);

    if (speed <= maxSpeed) return;

    const direction = normalize(this.vx, this.vy);
    this.vx = direction.x * maxSpeed;
    this.vy = direction.y * maxSpeed;
  }

  applyFriction(dt, amount) {
    const friction = Math.max(0, 1 - amount * dt);
    this.vx *= friction;
    this.vy *= friction;
  }

  move(dt, state) {
    moveCircleWithCollisions(this, this.vx * dt, this.vy * dt, state.arena);
  }

  updateAnimation(dt) {
    const speed = Math.hypot(this.vx, this.vy);
    const baseRate = this.config.animRate || 5.1;
    this.animTime += dt * (speed > 8 ? baseRate + speed / 95 : 1.1);

    if (this.rooted > 0) {
      this.pose = "rooted";
      return;
    }

    if (this.state === "windup") {
      this.pose = "windup";
      return;
    }

    if (this.state === "recover") {
      this.pose = this.config.role === "ranged" || this.config.role === "support" ? "release" : "recover";
      return;
    }

    this.pose = speed > 12 ? "walk" : "idle";
  }
}

function collidesWithSceneEdge(enemy, state) {
  const pad = state.arena.boundsPadding + enemy.radius + 6;
  return (
    enemy.x <= pad ||
    enemy.y <= pad ||
    enemy.x >= state.arena.width - pad ||
    enemy.y >= state.arena.height - pad
  );
}

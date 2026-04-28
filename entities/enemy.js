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
  },
};

export class Enemy {
  constructor(x, y, type = "thornling", options = {}) {
    const resolvedType =
      type === "basic" ? "thornling" : type === "brute" ? "mire_brute" : type;
    const config = ENEMY_CONFIG[resolvedType] || ENEMY_CONFIG.thornling;
    const hpScale = options.hpScale ?? 1;
    const damageScale = options.damageScale ?? 1;

    this.x = x;
    this.y = y;
    this.type = resolvedType;
    this.config = config;
    this.radius = config.radius;
    this.maxHp = Math.round(config.maxHp * hpScale);
    this.hp = this.maxHp;
    this.damage = Math.round(config.damage * damageScale);
    this.vx = 0;
    this.vy = 0;
    this.state = "idle";
    this.stateTimer = randomRange(0.4, 1.2);
    this.wanderAngle = randomRange(0, Math.PI * 2);
    this.facing = 0;
    this.attackAngle = 0;
    this.attackCooldown = randomRange(0.25, 0.8);
    this.hitFlash = 0;
    this.stun = 0;
    this.rooted = 0;
    this.bloom = 0;
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

    this.applyFriction(dt, this.rooted > 0 ? 12 : this.type === "mire_brute" ? 4.6 : 4.1);
    this.move(dt, state);
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
      this.attackCooldown = 1.2 + randomRange(0, 0.32);
      return;
    }

    if (playerDistance < this.config.attackRange + state.player.radius + 8) {
      damagePlayer(state, this.damage, this.x, this.y, this.config.knockback);
    }

    const lunge = this.type === "mire_brute" ? 185 : 90;
    this.vx += Math.cos(this.attackAngle) * lunge;
    this.vy += Math.sin(this.attackAngle) * lunge;
    this.state = "recover";
    this.stateTimer = this.config.recover;
    this.attackCooldown = 0.6;
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
      type: "wisp",
    });
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

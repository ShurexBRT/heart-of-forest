import { angleTo, distance, normalize, randomRange } from "../core/math.js";
import { moveCircleWithCollisions } from "../systems/collision.js";
import { damagePlayer } from "../systems/combat.js";

const ENEMY_CONFIG = {
  basic: {
    maxHp: 42,
    radius: 15,
    speed: 118,
    wanderSpeed: 36,
    detectRange: 360,
    leashRange: 470,
    attackRange: 30,
    damage: 10,
    windup: 0.16,
    recover: 0.46,
    knockback: 210,
  },
  brute: {
    maxHp: 96,
    radius: 22,
    speed: 78,
    wanderSpeed: 24,
    detectRange: 390,
    leashRange: 510,
    attackRange: 40,
    damage: 22,
    windup: 0.34,
    recover: 0.78,
    knockback: 300,
  },
};

export class Enemy {
  constructor(x, y, type = "basic") {
    const config = ENEMY_CONFIG[type] || ENEMY_CONFIG.basic;

    this.x = x;
    this.y = y;
    this.type = type;
    this.config = config;
    this.radius = config.radius;
    this.maxHp = config.maxHp;
    this.hp = config.maxHp;
    this.vx = 0;
    this.vy = 0;
    this.state = "idle";
    this.stateTimer = randomRange(0.4, 1.2);
    this.wanderAngle = randomRange(0, Math.PI * 2);
    this.facing = 0;
    this.attackAngle = 0;
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
        this.updateChase(dt, playerDistance, toPlayer);
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

    this.applyFriction(dt, this.rooted > 0 ? 12 : 4);
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

  updateChase(dt, playerDistance, toPlayer) {
    if (playerDistance > this.config.leashRange) {
      this.state = "wander";
      this.stateTimer = randomRange(0.7, 1.4);
      return;
    }

    if (playerDistance < this.config.attackRange + this.radius) {
      this.state = "windup";
      this.stateTimer = this.config.windup;
      this.attackAngle = this.facing;
      this.vx *= 0.35;
      this.vy *= 0.35;
      return;
    }

    if (this.rooted <= 0) {
      this.vx += toPlayer.x * this.config.speed * 5.5 * dt;
      this.vy += toPlayer.y * this.config.speed * 5.5 * dt;
      this.limitSpeed(this.config.speed);
    }
  }

  updateWindup(dt, state, playerDistance) {
    this.stateTimer -= dt;
    this.vx *= Math.max(0, 1 - 12 * dt);
    this.vy *= Math.max(0, 1 - 12 * dt);

    if (this.stateTimer > 0) return;

    if (playerDistance < this.config.attackRange + state.player.radius + 8) {
      damagePlayer(state, this.config.damage, this.x, this.y, this.config.knockback);
    }

    const lunge = this.type === "brute" ? 170 : 85;
    this.vx += Math.cos(this.attackAngle) * lunge;
    this.vy += Math.sin(this.attackAngle) * lunge;
    this.state = "recover";
    this.stateTimer = this.config.recover;
  }

  updateRecover(dt, playerDistance) {
    this.stateTimer -= dt;

    if (this.stateTimer <= 0) {
      this.state = playerDistance < this.config.detectRange ? "chase" : "idle";
      this.stateTimer = randomRange(0.4, 0.9);
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
}

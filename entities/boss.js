import { angleTo, distance, normalize, randomRange, TAU } from "../core/math.js";
import { moveCircleWithCollisions } from "../systems/collision.js";
import { damagePlayer } from "../systems/combat.js";
import { spawnBurst } from "../systems/particles.js";
import { Enemy } from "./enemy.js";

export class Boss {
  constructor(spawn, zone, config = {}) {
    this.isBoss = true;
    this.id = config.bossId || "elder_hollow";
    this.name = config.bossName || "Elder Hollow";
    this.x = spawn.x;
    this.y = spawn.y;
    this.zone = zone;
    this.radius = 44;
    this.maxHp = 1120;
    this.hp = this.maxHp;
    this.vx = 0;
    this.vy = 0;
    this.speed = 86;
    this.facing = 0;
    this.hitFlash = 0;
    this.stun = 0;
    this.rooted = 0;
    this.bloom = 0;
    this.recovery = 0;
    this.currentAttack = null;
    this.cooldowns = {
      slam: 1.1,
      volley: 0.9,
      eruption: 1.8,
      summon: 2.4,
    };
    this.phase = 1;
    this.thresholds = [0.72, 0.44, 0.2];
    this.dead = false;
  }

  update(dt, state) {
    if (this.dead) return;

    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.stun = Math.max(0, this.stun - dt);
    this.rooted = Math.max(0, this.rooted - dt);
    this.bloom = Math.max(0, this.bloom - dt);
    this.recovery = Math.max(0, this.recovery - dt);
    this.facing = angleTo(this.x, this.y, state.player.x, state.player.y);

    for (const key of Object.keys(this.cooldowns)) {
      this.cooldowns[key] = Math.max(0, this.cooldowns[key] - dt);
    }

    this.updatePhase(state);
    this.checkSummonThresholds(state);

    if (this.stun > 0) {
      this.applyFriction(dt, 7.2);
      this.move(dt, state);
      return;
    }

    if (this.currentAttack) {
      this.updateAttack(dt, state);
    } else if (this.recovery <= 0) {
      this.chooseAction(state, dt);
    }

    if (!this.currentAttack) {
      this.moveTowardPlayer(dt, state);
    } else {
      this.applyFriction(dt, 7.5);
    }

    this.move(dt, state);
  }

  chooseAction(state, dt) {
    const playerDistance = distance(this.x, this.y, state.player.x, state.player.y);

    if (playerDistance < 160 && this.cooldowns.slam <= 0) {
      this.beginSlam(state.player.x, state.player.y);
      return;
    }

    if (this.cooldowns.eruption <= 0 && (playerDistance < 300 || Math.random() < 0.55)) {
      this.beginEruption(state);
      return;
    }

    if (this.cooldowns.summon <= 0 && this.phase >= 2 && state.enemies.length <= 3) {
      this.beginSummon();
      return;
    }

    if (this.cooldowns.volley <= 0) {
      this.beginVolley(state.player.x, state.player.y);
      return;
    }

    const chase = normalize(state.player.x - this.x, state.player.y - this.y);
    const rootMul = this.rooted > 0 ? 0.32 : 1;
    this.vx += chase.x * this.speed * 5 * dt * rootMul;
    this.vy += chase.y * this.speed * 5 * dt * rootMul;
    this.limitSpeed(this.speed * rootMul);
  }

  beginSlam(targetX, targetY) {
    this.currentAttack = {
      type: "slam",
      timer: this.phase >= 2 ? 0.52 : 0.64,
      targetX,
      targetY,
      radius: this.phase >= 2 ? 128 : 108,
    };
    this.cooldowns.slam = this.phase >= 2 ? 1.65 : 2.15;
    this.vx *= 0.3;
    this.vy *= 0.3;
  }

  beginVolley(targetX, targetY) {
    this.currentAttack = {
      type: "volley",
      timer: this.phase >= 2 ? 0.55 : 0.7,
      targetX,
      targetY,
    };
    this.cooldowns.volley = this.phase >= 2 ? 1.95 : 2.5;
    this.vx *= 0.3;
    this.vy *= 0.3;
  }

  beginEruption(state) {
    const hazards = [];
    const center = { x: state.player.x, y: state.player.y };
    const count = this.phase >= 2 ? 6 : 4;

    for (let i = 0; i < count; i += 1) {
      const angle = randomRange(0, TAU);
      const distanceFromPlayer = i === 0 ? 0 : randomRange(40, this.phase >= 2 ? 140 : 118);
      hazards.push({
        x: center.x + Math.cos(angle) * distanceFromPlayer,
        y: center.y + Math.sin(angle) * distanceFromPlayer,
        radius: randomRange(28, this.phase >= 2 ? 48 : 40),
        warning: 0.74 + i * 0.04,
        active: 0.28,
        damage: this.phase >= 2 ? 22 : 18,
        hitPlayer: false,
      });
    }

    state.eruptions.push(...hazards);
    this.currentAttack = { type: "eruption", timer: this.phase >= 2 ? 0.64 : 0.82 };
    this.cooldowns.eruption = this.phase >= 2 ? 2.8 : 3.5;
    this.vx *= 0.2;
    this.vy *= 0.2;

    spawnBurst(state, this.x, this.y, {
      count: 18,
      colors: ["#8ceb6b", "#5bbd55", "#f0cf77"],
      speed: 170,
      size: [2, 4],
      life: [0.14, 0.34],
    });
  }

  beginSummon() {
    this.currentAttack = { type: "summon", timer: 0.9 };
    this.cooldowns.summon = this.phase >= 3 ? 4 : 5.4;
    this.vx *= 0.18;
    this.vy *= 0.18;
  }

  updateAttack(dt, state) {
    this.currentAttack.timer -= dt;

    if (this.currentAttack.timer > 0) return;

    if (this.currentAttack.type === "slam") {
      this.performSlam(state, this.currentAttack);
      this.recovery = 0.44;
    } else if (this.currentAttack.type === "volley") {
      this.performVolley(state);
      this.recovery = 0.34;
    } else if (this.currentAttack.type === "eruption") {
      this.performEruptionBurst(state);
      this.recovery = 0.28;
    } else if (this.currentAttack.type === "summon") {
      this.performSummon(state);
      this.recovery = 0.46;
    }

    this.currentAttack = null;
  }

  performSlam(state, attack) {
    const direction = normalize(attack.targetX - this.x, attack.targetY - this.y);
    this.vx += direction.x * (this.phase >= 2 ? 260 : 225);
    this.vy += direction.y * (this.phase >= 2 ? 260 : 225);

    spawnBurst(state, attack.targetX, attack.targetY, {
      count: 32,
      colors: ["#ffb772", "#ff7f69", "#f5e48b"],
      speed: 300,
      size: [2, 6],
      life: [0.18, 0.55],
    });

    if (
      distance(attack.targetX, attack.targetY, state.player.x, state.player.y) <=
      attack.radius + state.player.radius
    ) {
      damagePlayer(state, this.phase >= 2 ? 34 : 28, attack.targetX, attack.targetY, 330);
      state.shake = Math.max(state.shake, 10);
    } else {
      state.shake = Math.max(state.shake, 6);
    }
  }

  performVolley(state) {
    const base = angleTo(this.x, this.y, state.player.x, state.player.y);
    const spread = this.phase >= 2
      ? [-0.62, -0.42, -0.2, 0, 0.2, 0.42, 0.62]
      : [-0.48, -0.3, -0.14, 0, 0.14, 0.3, 0.48];

    for (const offset of spread) {
      const angle = base + offset;
      state.hostileProjectiles.push({
        x: this.x + Math.cos(angle) * 36,
        y: this.y + Math.sin(angle) * 36,
        vx: Math.cos(angle) * (this.phase >= 2 ? 356 : 320),
        vy: Math.sin(angle) * (this.phase >= 2 ? 356 : 320),
        radius: 8,
        life: 2.2,
        damage: this.phase >= 2 ? 18 : 14,
        knockback: 175,
        type: "thorn",
      });
    }

    spawnBurst(state, this.x, this.y, {
      count: 20,
      colors: ["#d35d48", "#ffb868", "#9cdc79"],
      speed: 180,
      size: [2, 4],
      life: [0.14, 0.32],
    });
  }

  performEruptionBurst(state) {
    state.shake = Math.max(state.shake, 5);
    spawnBurst(state, this.x, this.y, {
      count: 14,
      colors: ["#7ce567", "#efb35e", "#f1f8a6"],
      speed: 150,
      size: [2, 4],
      life: [0.12, 0.28],
    });
  }

  performSummon(state) {
    const composition =
      this.phase >= 3
        ? ["wisp_archer", "mire_brute", "thornling"]
        : ["thornling", "wisp_archer"];

    const spawns = [...state.arena.bossAddSpawns];

    composition.forEach((type, index) => {
      const spawn = spawns[index % spawns.length];
      state.enemies.push(new Enemy(spawn.x, spawn.y, type));
      spawnBurst(state, spawn.x, spawn.y, {
        count: 18,
        colors: ["#f0ce78", "#9be570", "#d4634a"],
        speed: 180,
        size: [2, 5],
        life: [0.16, 0.36],
      });
    });

    state.encounter.bannerText = "The Hollow Calls";
    state.encounter.bannerTimer = 1.5;
  }

  updatePhase(state) {
    const ratio = this.hp / this.maxHp;
    const nextPhase = ratio <= 0.55 ? 2 : 1;
    const finalPhase = ratio <= 0.24 ? 3 : nextPhase;

    if (finalPhase > this.phase) {
      this.phase = finalPhase;
      state.encounter.bannerText = this.phase === 2 ? "Elder Hollow Rises" : "Heartwood Frenzy";
      state.encounter.bannerTimer = 1.8;
      state.shake = Math.max(state.shake, 7);
    }
  }

  checkSummonThresholds(state) {
    while (this.thresholds.length > 0 && this.hp <= this.maxHp * this.thresholds[0] && !this.dead) {
      this.thresholds.shift();
      this.performSummon(state);
      state.shake = Math.max(state.shake, 5);
    }
  }

  moveTowardPlayer(dt, state) {
    const direction = normalize(state.player.x - this.x, state.player.y - this.y);
    const rootMul = this.rooted > 0 ? 0.3 : 1;
    const distanceToZoneCenter = distance(this.x, this.y, this.zone.x, this.zone.y);

    this.vx += direction.x * this.speed * (this.phase >= 2 ? 5.4 : 5.1) * dt * rootMul;
    this.vy += direction.y * this.speed * (this.phase >= 2 ? 5.4 : 5.1) * dt * rootMul;

    if (distanceToZoneCenter > this.zone.radius - 28) {
      const pull = normalize(this.zone.x - this.x, this.zone.y - this.y);
      this.vx += pull.x * 145 * dt;
      this.vy += pull.y * 145 * dt;
    }

    this.limitSpeed((this.phase >= 2 ? this.speed + 16 : this.speed) * rootMul);
    this.applyFriction(dt, this.rooted > 0 ? 11 : 4.2);
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

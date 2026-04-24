import { angleTo, distance, normalize, randomRange, TAU } from "../core/math.js";
import { moveCircleWithCollisions } from "../systems/collision.js";
import { damagePlayer } from "../systems/combat.js";
import { spawnBurst } from "../systems/particles.js";
import { Enemy } from "./enemy.js";

export class Boss {
  constructor(spawn, zone) {
    this.isBoss = true;
    this.name = "Heart Guardian";
    this.x = spawn.x;
    this.y = spawn.y;
    this.zone = zone;
    this.radius = 38;
    this.maxHp = 560;
    this.hp = this.maxHp;
    this.vx = 0;
    this.vy = 0;
    this.speed = 84;
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
    };
    this.addThresholds = [0.75, 0.45, 0.2];
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

    this.checkThresholdAdds(state);

    if (this.stun > 0) {
      this.applyFriction(dt, 7);
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
    const eruptionReady = this.cooldowns.eruption <= 0;
    const volleyReady = this.cooldowns.volley <= 0;
    const slamReady = this.cooldowns.slam <= 0;

    if (playerDistance < 154 && slamReady) {
      this.beginSlam(state.player.x, state.player.y);
      return;
    }

    if (eruptionReady && (playerDistance < 280 || Math.random() < 0.58)) {
      this.beginEruption(state);
      return;
    }

    if (volleyReady) {
      this.beginVolley(state.player.x, state.player.y);
      return;
    }

    const chase = normalize(state.player.x - this.x, state.player.y - this.y);
    const rootMul = this.rooted > 0 ? 0.32 : 1;
    this.vx += chase.x * this.speed * 5.4 * dt * rootMul;
    this.vy += chase.y * this.speed * 5.4 * dt * rootMul;
    this.limitSpeed(this.speed * rootMul);
  }

  beginSlam(targetX, targetY) {
    this.currentAttack = {
      type: "slam",
      timer: 0.64,
      targetX,
      targetY,
      radius: 108,
    };
    this.cooldowns.slam = 2.15;
    this.vx *= 0.3;
    this.vy *= 0.3;
  }

  beginVolley(targetX, targetY) {
    this.currentAttack = {
      type: "volley",
      timer: 0.7,
      targetX,
      targetY,
    };
    this.cooldowns.volley = 2.6;
    this.vx *= 0.3;
    this.vy *= 0.3;
  }

  beginEruption(state) {
    const hazards = [];
    const center = { x: state.player.x, y: state.player.y };

    for (let i = 0; i < 4; i += 1) {
      const angle = randomRange(0, TAU);
      const distanceFromPlayer = i === 0 ? 0 : randomRange(42, 118);
      hazards.push({
        x: center.x + Math.cos(angle) * distanceFromPlayer,
        y: center.y + Math.sin(angle) * distanceFromPlayer,
        radius: randomRange(28, 40),
        warning: 0.72 + i * 0.05,
        active: 0.26,
        damage: 18,
        hitPlayer: false,
      });
    }

    state.eruptions.push(...hazards);
    this.currentAttack = {
      type: "eruption",
      timer: 0.82,
    };
    this.cooldowns.eruption = 3.65;
    this.vx *= 0.2;
    this.vy *= 0.2;

    spawnBurst(state, this.x, this.y, {
      count: 16,
      colors: ["#8ceb6b", "#5bbd55", "#f0cf77"],
      speed: 160,
      size: [2, 4],
      life: [0.14, 0.34],
    });
  }

  updateAttack(dt, state) {
    this.currentAttack.timer -= dt;

    if (this.currentAttack.timer > 0) return;

    if (this.currentAttack.type === "slam") {
      this.performSlam(state, this.currentAttack);
      this.recovery = 0.48;
    } else if (this.currentAttack.type === "volley") {
      this.performVolley(state);
      this.recovery = 0.4;
    } else if (this.currentAttack.type === "eruption") {
      this.performEruptionBurst(state);
      this.recovery = 0.32;
    }

    this.currentAttack = null;
  }

  performSlam(state, attack) {
    const direction = normalize(attack.targetX - this.x, attack.targetY - this.y);
    this.vx += direction.x * 225;
    this.vy += direction.y * 225;

    spawnBurst(state, attack.targetX, attack.targetY, {
      count: 28,
      colors: ["#ffb772", "#ff7f69", "#f5e48b"],
      speed: 285,
      size: [2, 6],
      life: [0.18, 0.55],
    });

    if (
      distance(attack.targetX, attack.targetY, state.player.x, state.player.y) <=
      attack.radius + state.player.radius
    ) {
      damagePlayer(state, 28, attack.targetX, attack.targetY, 310);
      state.shake = Math.max(state.shake, 9);
    } else {
      state.shake = Math.max(state.shake, 6);
    }
  }

  performVolley(state) {
    const base = angleTo(this.x, this.y, state.player.x, state.player.y);
    const spread = [-0.48, -0.3, -0.14, 0, 0.14, 0.3, 0.48];

    for (const offset of spread) {
      const angle = base + offset;
      state.hostileProjectiles.push({
        x: this.x + Math.cos(angle) * 34,
        y: this.y + Math.sin(angle) * 34,
        vx: Math.cos(angle) * 318,
        vy: Math.sin(angle) * 318,
        radius: 8,
        life: 2.2,
        damage: 14,
        knockback: 165,
        type: "thorn",
      });
    }

    spawnBurst(state, this.x, this.y, {
      count: 18,
      colors: ["#d35d48", "#ffb868", "#9cdc79"],
      speed: 170,
      size: [2, 4],
      life: [0.14, 0.32],
    });
  }

  performEruptionBurst(state) {
    state.shake = Math.max(state.shake, 5);
    spawnBurst(state, this.x, this.y, {
      count: 12,
      colors: ["#7ce567", "#efb35e", "#f1f8a6"],
      speed: 140,
      size: [2, 4],
      life: [0.12, 0.28],
    });
  }

  checkThresholdAdds(state) {
    while (
      this.addThresholds.length > 0 &&
      this.hp <= this.maxHp * this.addThresholds[0] &&
      !this.dead
    ) {
      const threshold = this.addThresholds.shift();
      const composition =
        threshold >= 0.75
          ? ["basic", "basic"]
          : threshold >= 0.45
            ? ["basic", "brute"]
            : ["basic", "basic", "brute"];

      this.spawnAdds(state, composition);
      state.encounter.bannerText = "Corruption Surges";
      state.encounter.bannerTimer = 1.7;
      state.shake = Math.max(state.shake, 5);
    }
  }

  spawnAdds(state, composition) {
    const spawns = [...state.arena.bossAddSpawns];

    composition.forEach((type, index) => {
      const spawn = spawns[index % spawns.length];
      const offsetAngle = index * 1.9 + randomRange(-0.3, 0.3);
      const offsetDistance = randomRange(0, 20);
      const x = spawn.x + Math.cos(offsetAngle) * offsetDistance;
      const y = spawn.y + Math.sin(offsetAngle) * offsetDistance;

      state.enemies.push(new Enemy(x, y, type));
      spawnBurst(state, x, y, {
        count: 18,
        colors: ["#f0ce78", "#9be570", "#d4634a"],
        speed: 175,
        size: [2, 5],
        life: [0.16, 0.36],
      });
    });
  }

  moveTowardPlayer(dt, state) {
    const direction = normalize(state.player.x - this.x, state.player.y - this.y);
    const rootMul = this.rooted > 0 ? 0.28 : 1;
    const distanceToZoneCenter = distance(this.x, this.y, this.zone.x, this.zone.y);

    this.vx += direction.x * this.speed * 5.1 * dt * rootMul;
    this.vy += direction.y * this.speed * 5.1 * dt * rootMul;

    if (distanceToZoneCenter > this.zone.radius - 28) {
      const pull = normalize(this.zone.x - this.x, this.zone.y - this.y);
      this.vx += pull.x * 145 * dt;
      this.vy += pull.y * 145 * dt;
    }

    this.limitSpeed(this.speed * rootMul);
    this.applyFriction(dt, this.rooted > 0 ? 11 : 4.4);
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

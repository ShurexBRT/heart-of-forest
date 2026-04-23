import { angleTo } from "../core/math.js";
import { getMovementVector } from "../core/input.js";
import { moveCircleWithCollisions } from "../systems/collision.js";

export const PLAYER_ABILITY_INFO = {
  staff: { label: "Staff Strike", key: "LMB", cooldown: 0.28, cost: 0 },
  bolt: { label: "Spirit Bolt", key: "RMB", cooldown: 0.42, cost: 14 },
  dash: { label: "Quick Dash", key: "Space", cooldown: 1.05, cost: 0 },
  root: { label: "Root Snare", key: "1", cooldown: 2.6, cost: 24 },
};

export class Player {
  constructor(spawn) {
    this.radius = 16;
    this.maxHp = 100;
    this.maxSpirit = 100;
    this.maxSpeed = 238;
    this.spiritRegen = 12;
    this.reset(spawn);
  }

  reset(spawn) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.vx = 0;
    this.vy = 0;
    this.hp = this.maxHp;
    this.spirit = this.maxSpirit;
    this.aimAngle = 0;
    this.invulnerable = 0;
    this.hurtFlash = 0;
    this.dashTime = 0;
    this.lastTrailAt = -1;
    this.cooldowns = {
      staff: 0,
      bolt: 0,
      dash: 0,
      root: 0,
    };
  }

  tick(dt) {
    this.spirit = Math.min(this.maxSpirit, this.spirit + this.spiritRegen * dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt);
    this.dashTime = Math.max(0, this.dashTime - dt);

    for (const key of Object.keys(this.cooldowns)) {
      this.cooldowns[key] = Math.max(0, this.cooldowns[key] - dt);
    }
  }

  move(dt, input, state) {
    this.aimAngle = angleTo(this.x, this.y, state.mouseWorld.x, state.mouseWorld.y);

    if (this.dashTime > 0) {
      this.vx *= Math.max(0, 1 - 4.2 * dt);
      this.vy *= Math.max(0, 1 - 4.2 * dt);

      if (state.time - this.lastTrailAt > 0.028) {
        this.lastTrailAt = state.time;
        state.afterImages.push({
          x: this.x,
          y: this.y,
          angle: this.aimAngle,
          life: 0.18,
          maxLife: 0.18,
        });
      }
    } else {
      const movement = getMovementVector(input);
      const desiredX = movement.x * this.maxSpeed;
      const desiredY = movement.y * this.maxSpeed;
      const response = movement.x !== 0 || movement.y !== 0 ? 18 : 16;
      const blend = Math.min(1, response * dt);

      this.vx += (desiredX - this.vx) * blend;
      this.vy += (desiredY - this.vy) * blend;
    }

    moveCircleWithCollisions(this, this.vx * dt, this.vy * dt, state.arena);
  }

  canSpend(amount) {
    return this.spirit >= amount;
  }

  spendSpirit(amount) {
    this.spirit = Math.max(0, this.spirit - amount);
  }

  isInvulnerable() {
    return this.invulnerable > 0 || this.dashTime > 0;
  }
}

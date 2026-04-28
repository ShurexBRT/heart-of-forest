import { angleTo } from "../core/math.js";
import { getMovementVector } from "../core/input.js";
import { moveCircleWithCollisions } from "../systems/collision.js";

export const PLAYER_ABILITY_INFO = {
  staff: {
    label: "Staff Strike",
    key: "LMB",
    cooldown: 0.28,
    cost: 0,
    damage: 22,
    spiritGain: 6,
    rootedSpiritGain: 6,
  },
  bolt: {
    label: "Spirit Bolt",
    key: "RMB",
    cooldown: 0.42,
    cost: 14,
    damage: 24,
    range: 360,
    speed: 485,
  },
  dash: {
    label: "Quick Dash",
    key: "Space",
    cooldown: 1.05,
    cost: 0,
  },
  root: {
    label: "Root Snare",
    key: "1",
    cooldown: 2.6,
    cost: 24,
    duration: 1.35,
  },
};

export class Player {
  constructor(spawn, modifiers = {}) {
    this.radius = 16;
    this.maxHp = 100 + (modifiers.maxHpBonus || 0);
    this.maxSpirit = 100 + (modifiers.maxSpiritBonus || 0);
    this.maxSpeed = 238;
    this.spiritRegen = 12 + (modifiers.spiritRegenBonus || 0);
    this.incomingDamageMult = modifiers.incomingDamageMult || 1;
    this.abilityInfo = buildAbilityInfo(modifiers);
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
    this.hazardTimer = 0;
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

function buildAbilityInfo(modifiers) {
  return {
    staff: {
      ...PLAYER_ABILITY_INFO.staff,
      damage: PLAYER_ABILITY_INFO.staff.damage + (modifiers.staffDamageBonus || 0),
      spiritGain: PLAYER_ABILITY_INFO.staff.spiritGain + (modifiers.staffSpiritBonus || 0),
      rootedSpiritGain:
        PLAYER_ABILITY_INFO.staff.rootedSpiritGain + Math.floor((modifiers.staffSpiritBonus || 0) / 2),
    },
    bolt: {
      ...PLAYER_ABILITY_INFO.bolt,
      damage: PLAYER_ABILITY_INFO.bolt.damage + (modifiers.boltDamageBonus || 0),
      range: PLAYER_ABILITY_INFO.bolt.range + (modifiers.boltRangeBonus || 0),
    },
    dash: {
      ...PLAYER_ABILITY_INFO.dash,
      cooldown: Math.max(0.5, PLAYER_ABILITY_INFO.dash.cooldown - (modifiers.dashCooldownBonus || 0)),
    },
    root: {
      ...PLAYER_ABILITY_INFO.root,
      duration: PLAYER_ABILITY_INFO.root.duration + (modifiers.rootDurationBonus || 0),
    },
    bloomBonus: modifiers.bloomBonus || 0,
  };
}

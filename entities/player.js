import { angleTo } from "../core/math.js";
import { getMovementVector } from "../core/input.js";
import { moveCircleWithCollisions } from "../systems/collision.js";

export const PLAYER_ABILITY_INFO = {
  staff: {
    label: "Staff Strike",
    shortLabel: "Staff",
    key: "LMB",
    cooldown: 0.28,
    cost: 0,
    damage: 22,
    spiritGain: 6,
    rootedSpiritGain: 6,
  },
  bolt: {
    label: "Spirit Bolt",
    shortLabel: "Bolt",
    key: "RMB",
    cooldown: 0.42,
    cost: 14,
    damage: 24,
    range: 360,
    speed: 485,
  },
  dash: {
    label: "Quick Dash",
    shortLabel: "Dash",
    key: "Space",
    cooldown: 1.05,
    cost: 0,
  },
  root: {
    label: "Root Snare",
    shortLabel: "Root",
    key: "1",
    cooldown: 2.6,
    cost: 24,
    duration: 1.35,
  },
  pulse: {
    label: "Verdant Pulse",
    shortLabel: "Pulse",
    key: "R",
    cooldown: 4.4,
    cost: 30,
    damage: 28,
    radius: 112,
    rootDuration: 0.42,
  },
};

export class Player {
  constructor(spawn, modifiers = {}) {
    this.radius = 16;
    this.maxSpeed = 238;
    this.maxHp = 100;
    this.maxSpirit = 100;
    this.spiritRegen = 12;
    this.outOfCombatRegen = 3;
    this.incomingDamageMult = 1;
    this.activeBuffs = {
      ward: 0,
      wardReduction: 0,
      speed: 0,
      speedBonus: 0,
      spirit: 0,
      spiritRegenBonus: 0,
    };
    this.heartCharge = 0;
    this.dashStaffPrimed = 0;
    this.abilityInfo = buildAbilityInfo(modifiers);
    this.refreshFromModifiers(modifiers, { preserveVitals: false });
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
    this.activeBuffs = {
      ward: 0,
      wardReduction: 0,
      speed: 0,
      speedBonus: 0,
      spirit: 0,
      spiritRegenBonus: 0,
    };
    this.lastTrailAt = -1;
    this.hazardTimer = 0;
    this.animTime = 0;
    this.pose = "idle";
    this.poseTimer = 0;
    this.cooldowns = {
      staff: 0,
      bolt: 0,
      dash: 0,
      root: 0,
      pulse: 0,
    };
    this.heartCharge = 0;
    this.dashStaffPrimed = 0;
  }

  tick(dt) {
    this.spirit = Math.min(this.maxSpirit, this.spirit + this.spiritRegen * dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt);
    this.dashTime = Math.max(0, this.dashTime - dt);
    this.dashStaffPrimed = Math.max(0, this.dashStaffPrimed - dt);
    this.poseTimer = Math.max(0, this.poseTimer - dt);
    this.activeBuffs.ward = Math.max(0, this.activeBuffs.ward - dt);
    this.activeBuffs.speed = Math.max(0, this.activeBuffs.speed - dt);
    this.activeBuffs.spirit = Math.max(0, this.activeBuffs.spirit - dt);
    if (this.activeBuffs.ward <= 0) this.activeBuffs.wardReduction = 0;
    if (this.activeBuffs.speed <= 0) this.activeBuffs.speedBonus = 0;
    if (this.activeBuffs.spirit <= 0) this.activeBuffs.spiritRegenBonus = 0;
    this.recalculateDerivedCombatStats();

    const speed = Math.hypot(this.vx, this.vy);
    const animRate = this.dashTime > 0 ? 16 : speed > 12 ? 4.8 + speed / 75 : 1.25;
    this.animTime += dt * animRate;

    if (this.dashTime > 0) {
      this.pose = "dash";
    } else if (this.poseTimer <= 0) {
      this.pose = speed > 12 ? "walk" : "idle";
    }

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

  playPose(pose, duration) {
    this.pose = pose;
    this.poseTimer = Math.max(this.poseTimer, duration);
  }

  refreshFromModifiers(modifiers = {}, options = {}) {
    const preserveVitals = options.preserveVitals !== false;
    const hpRatio = this.maxHp > 0 ? this.hp / this.maxHp : 1;
    const spiritRatio = this.maxSpirit > 0 ? this.spirit / this.maxSpirit : 1;

    this.maxHp = 100 + (modifiers.maxHpBonus || 0);
    this.maxSpirit = 100 + (modifiers.maxSpiritBonus || 0);
    this.baseSpiritRegen = 12 + (modifiers.spiritRegenBonus || 0);
    this.outOfCombatRegen = 4 + (modifiers.healthRegenBonus || 0);
    this.baseIncomingDamageMult = modifiers.incomingDamageMult || 1;
    this.baseMaxSpeed = 238 + (modifiers.moveSpeedBonus || 0);
    this.abilityInfo = buildAbilityInfo(modifiers);
    this.recalculateDerivedCombatStats();

    if (!preserveVitals) {
      this.hp = this.maxHp;
      this.spirit = this.maxSpirit;
      return;
    }

    this.hp = Math.max(1, Math.min(this.maxHp, Math.round(this.maxHp * hpRatio)));
    this.spirit = Math.min(this.maxSpirit, Math.round(this.maxSpirit * spiritRatio));
  }

  recalculateDerivedCombatStats() {
    const wardMultiplier = 1 - (this.activeBuffs.ward > 0 ? this.activeBuffs.wardReduction || 0 : 0);
    this.incomingDamageMult = Math.max(0.45, (this.baseIncomingDamageMult || 1) * wardMultiplier);
    this.maxSpeed = Math.round((this.baseMaxSpeed || 238) * (1 + (this.activeBuffs.speed > 0 ? this.activeBuffs.speedBonus || 0 : 0)));
    this.spiritRegen = (this.baseSpiritRegen || 12) + (this.activeBuffs.spirit > 0 ? this.activeBuffs.spiritRegenBonus || 0 : 0);
  }

  applyConsumableEffect(effect = {}) {
    let changed = false;

    if (effect.wardDuration && effect.damageReduction) {
      this.activeBuffs.ward = Math.max(this.activeBuffs.ward, effect.wardDuration);
      this.activeBuffs.wardReduction = Math.max(this.activeBuffs.wardReduction, effect.damageReduction);
      changed = true;
    }

    if (effect.speedDuration && effect.speedBonus) {
      this.activeBuffs.speed = Math.max(this.activeBuffs.speed, effect.speedDuration);
      this.activeBuffs.speedBonus = Math.max(this.activeBuffs.speedBonus, effect.speedBonus);
      changed = true;
    }

    if (effect.speedDuration && effect.spiritRegenBonus) {
      this.activeBuffs.spirit = Math.max(this.activeBuffs.spirit, effect.speedDuration);
      this.activeBuffs.spiritRegenBonus = Math.max(
        this.activeBuffs.spiritRegenBonus,
        effect.spiritRegenBonus
      );
      changed = true;
    }

    if (changed) {
      this.recalculateDerivedCombatStats();
    }

    return changed;
  }
}

function buildAbilityInfo(modifiers) {
  const signatureAbility = modifiers.signatureAbility || null;
  const signatureLabels = {
    heartwood_tempest: ["Heartwood Tempest", "Tempest"],
    verdant_nova: ["Verdant Nova", "Nova"],
    awaken_the_grove: ["Awaken the Grove", "Grove"],
  };
  const signatureLabel = signatureLabels[signatureAbility] || null;

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
    pulse: {
      ...PLAYER_ABILITY_INFO.pulse,
      unlocked: Boolean(modifiers.pulseUnlocked),
      label: signatureLabel?.[0] || PLAYER_ABILITY_INFO.pulse.label,
      shortLabel: signatureLabel?.[1] || PLAYER_ABILITY_INFO.pulse.shortLabel,
      cost: signatureAbility ? 0 : PLAYER_ABILITY_INFO.pulse.cost,
      damage: PLAYER_ABILITY_INFO.pulse.damage + (modifiers.pulseDamageBonus || 0),
      radius: PLAYER_ABILITY_INFO.pulse.radius + (modifiers.pulseRadiusBonus || 0),
      cooldown: signatureAbility
        ? 5.5
        : Math.max(
            1.8,
            PLAYER_ABILITY_INFO.pulse.cooldown -
              (modifiers.pulseCooldownBonus || 0)
          ),
      rootDuration: PLAYER_ABILITY_INFO.pulse.rootDuration + (modifiers.rootDurationBonus || 0) * 0.4,
      signatureAbility,
    },
    bloomBonus: modifiers.bloomBonus || 0,
    staffRangeBonus: modifiers.staffRangeBonus || 0,
    staffArcBonus: modifiers.staffArcBonus || 0,
    dashStaffBonus: modifiers.dashStaffBonus || 0,
    counterbloom: Boolean(modifiers.counterbloom),
    closeDamageReduction: modifiers.closeDamageReduction || 0,
    staffHeartChargeBonus: modifiers.staffHeartChargeBonus || 0,
    boltPierce: modifiers.boltPierce || 0,
    bloomHeartChargeBonus: modifiers.bloomHeartChargeBonus || 0,
    pulseEcho: Boolean(modifiers.pulseEcho),
    bossSpellDamageBonus: modifiers.bossSpellDamageBonus || 0,
    rootDamagePerSecond: modifiers.rootDamagePerSecond || 0,
    spreadingRoots: Boolean(modifiers.spreadingRoots),
    preparationReductionBonus: modifiers.preparationReductionBonus || 0,
    fieldRemedy: Boolean(modifiers.fieldRemedy),
    rootHeartChargeBonus: modifiers.rootHeartChargeBonus || 0,
    preparationHeartChargeBonus: modifiers.preparationHeartChargeBonus || 0,
    signatureAbility,
  };
}

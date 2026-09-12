import { angleTo, distance, normalize, randomRange, TAU } from "../core/math.js";
import { moveCircleWithCollisions } from "../systems/collision.js";
import { damagePlayer } from "../systems/combat.js";
import { spawnBurst } from "../systems/particles.js";
import { Enemy } from "./enemy.js";

const BOSS_IDENTITY = {
  rootwarden: {
    damageType: "thorn",
    hazardType: "thorn",
    volleyProjectileType: "thorn",
    eruptionDamage: [16, 20],
    volleyDamage: [12, 16],
    eruptionColors: ["#91dc70", "#c8e987", "#f0d887"],
    slamColors: ["#a9e27f", "#e9c66f", "#f6edb0"],
    volleyColors: ["#8fdb70", "#d5e88d", "#f2d078"],
    eruptionBurstColors: ["#92df71", "#e6c86f", "#f5efb1"],
    summonPhase2: ["thornling", "barkling", "root_stalker"],
    summonPhase3: [
      { type: "thorn_weaver", elite: true, affixes: ["bulwark"] },
      "barkling",
      "root_stalker",
    ],
    summonBanner: "The Old Roots Rise",
    phaseBanners: ["Rootwarden Stirs", "Heartwood Unbound"],
    signatureLabel: "Root Crown",
    signatureKind: "root-crown",
    summonBurstColors: ["#9ce77a", "#e3ca73", "#d8f0a0"],
    slamTelegraphColor: "#c5e684",
    volleyTelegraphColor: "#9ddd79",
  },
  cinder_warden: {
    damageType: "fire",
    hazardType: "ember",
    volleyProjectileType: "ember",
    eruptionDamage: [18, 23],
    volleyDamage: [14, 18],
    eruptionColors: ["#ff9a5f", "#e96543", "#ffd18b"],
    slamColors: ["#ffad66", "#ef6d48", "#ffe1a1"],
    volleyColors: ["#ff9a5d", "#ffd078", "#ed6947"],
    eruptionBurstColors: ["#ff9e61", "#f06f49", "#ffd691"],
    summonPhase2: ["cinder_imp", "ash_brute", "thornling"],
    summonPhase3: [
      { type: "cinder_imp", elite: true, affixes: ["spiteful"] },
      "ash_brute",
      "cinder_imp",
    ],
    summonBanner: "The Cinders Answer",
    phaseBanners: ["Firewatch Broken", "Cinderheart Fury"],
    signatureLabel: "Ashen Ring",
    signatureKind: "ashen-ring",
    summonBurstColors: ["#ff9a5f", "#f4c875", "#e86c48"],
    slamTelegraphColor: "#ffad6c",
    volleyTelegraphColor: "#ffc679",
  },
  veil_seraph: {
    damageType: "frost",
    hazardType: "frost",
    volleyProjectileType: "frost",
    eruptionDamage: [18, 22],
    volleyDamage: [15, 19],
    eruptionColors: ["#b5e3ff", "#83bfe3", "#effaff"],
    slamColors: ["#c8ecff", "#8fc9ec", "#f7fdff"],
    volleyColors: ["#bce7ff", "#dff6ff", "#83bee5"],
    eruptionBurstColors: ["#b6e5ff", "#8bc7e8", "#f2fbff"],
    summonPhase2: ["frost_wisp", "icebound_guardian", "wisp_archer"],
    summonPhase3: [
      { type: "frost_wisp", elite: true, affixes: ["swift"] },
      "icebound_guardian",
      "frost_wisp",
    ],
    summonBanner: "The White Veil Falls",
    phaseBanners: ["Seraph Descends", "Winter Without End"],
    signatureLabel: "Veilfall Halo",
    signatureKind: "veilfall-halo",
    summonBurstColors: ["#bce9ff", "#91cae8", "#f2fbff"],
    slamTelegraphColor: "#c8edff",
    volleyTelegraphColor: "#a9dcfa",
  },
  elder_hollow: {
    damageType: "corruption",
    hazardType: "blight",
    volleyProjectileType: "blight",
    eruptionDamage: [18, 22],
    volleyDamage: [14, 18],
    eruptionColors: ["#d88cff", "#8c5cc2", "#f2d89a"],
    slamColors: ["#d88cff", "#ffb772", "#f5e48b"],
    volleyColors: ["#d88cff", "#ffb868", "#8e6ce0"],
    eruptionBurstColors: ["#d88cff", "#f0b35e", "#f5e48b"],
    summonPhase2: ["blight_hound", "rot_weaver", "bog_lurker"],
    summonPhase3: [
      { type: "rot_weaver", elite: true, affixes: ["spiteful"] },
      "blight_hound",
      "mire_brute",
    ],
    summonBanner: "The Hollow Calls",
    phaseBanners: ["Elder Hollow Rises", "Heartwood Frenzy"],
    signatureLabel: "Single Will",
    signatureKind: "single-will",
    summonBurstColors: ["#efc678", "#c183ff", "#d4634a"],
    slamTelegraphColor: "#f2b97c",
    volleyTelegraphColor: "#dda4ff",
  },
  bog_matron: {
    damageType: "mire",
    hazardType: "mire",
    volleyProjectileType: "mire",
    eruptionDamage: [16, 20],
    volleyDamage: [13, 16],
    eruptionColors: ["#8bd9e6", "#69b8cb", "#d6f3f8"],
    slamColors: ["#7ed5e8", "#bcecff", "#f4ffff"],
    volleyColors: ["#79d9f5", "#c2f1ff", "#6fa995"],
    eruptionBurstColors: ["#7fd5da", "#a9eef0", "#dffbff"],
    summonPhase2: ["mire_spitter", "bog_lurker", "thorn_weaver"],
    summonPhase3: [
      { type: "mire_spitter", elite: true, affixes: ["spiteful"] },
      "bog_lurker",
      "mire_brute",
    ],
    summonBanner: "The Tides Answer",
    phaseBanners: ["Floodwake Rising", "Matron of the Mire"],
    signatureLabel: "Tidewake Crown",
    signatureKind: "tidewake-crown",
    summonBurstColors: ["#9de9ea", "#6fbcc5", "#d6fff7"],
    slamTelegraphColor: "#9ce3ea",
    volleyTelegraphColor: "#b8f0ff",
  },
  rootbound_custodian: {
    damageType: "astral",
    hazardType: "ancient",
    volleyProjectileType: "ancient",
    eruptionDamage: [18, 22],
    volleyDamage: [15, 18],
    eruptionColors: ["#e4d39a", "#b99ae1", "#f8f1d9"],
    slamColors: ["#efdca8", "#cba3ff", "#fff9e4"],
    volleyColors: ["#edd79b", "#bd9bf0", "#f7f4ff"],
    eruptionBurstColors: ["#efdca7", "#c4a4f0", "#fff8e2"],
    summonPhase2: [
      "relic_sentinel",
      { type: "starbound_archer", elite: true, affixes: ["swift"] },
    ],
    summonPhase3: [
      { type: "relic_sentinel", elite: true, affixes: ["bulwark"] },
      "starbound_archer",
    ],
    summonBanner: "Vault Echoes Stir",
    phaseBanners: ["Reliquary Stirs", "Rootbound Fury"],
    signatureLabel: "Vault Lock",
    signatureKind: "vault-lock",
    summonBurstColors: ["#f0ce78", "#c8aff2", "#fff4da"],
    slamTelegraphColor: "#f2d9a1",
    volleyTelegraphColor: "#d7b7ff",
  },
  starwoken_sentinel: {
    damageType: "astral",
    hazardType: "ancient",
    volleyProjectileType: "ancient",
    eruptionDamage: [15, 19],
    volleyDamage: [14, 17],
    eruptionColors: ["#b6dfff", "#d8ceff", "#f2f8ff"],
    slamColors: ["#d8deff", "#9bcfff", "#f6f3ff"],
    volleyColors: ["#d4d9ff", "#a7cfff", "#eff8ff"],
    eruptionBurstColors: ["#c8dcff", "#e2d7ff", "#fbfcff"],
    summonPhase2: ["starbound_archer", "relic_sentinel", "thorn_weaver"],
    summonPhase3: [
      { type: "starbound_archer", elite: true, affixes: ["spiteful"] },
      { type: "relic_sentinel", elite: true, affixes: ["bulwark"] },
      "frost_wisp",
    ],
    summonBanner: "The Spire Answers",
    phaseBanners: ["Starfall Awakens", "Sentinel of the Spire"],
    signatureLabel: "Sixfold Verdict",
    signatureKind: "sixfold-verdict",
    summonBurstColors: ["#c9d9ff", "#e2d5ff", "#f7fbff"],
    slamTelegraphColor: "#d3ddff",
    volleyTelegraphColor: "#e4d8ff",
  },
};

function getBossIdentity(id) {
  return BOSS_IDENTITY[id] || BOSS_IDENTITY.elder_hollow;
}

function phasePair(values, phase) {
  return phase >= 2 ? values[1] : values[0];
}

export class Boss {
  constructor(spawn, zone, config = {}) {
    this.isBoss = true;
    this.id = config.bossId || "elder_hollow";
    this.name = config.bossName || "Elder Hollow";
    this.identity = getBossIdentity(this.id);
    this.x = spawn.x;
    this.y = spawn.y;
    this.zone = zone;
    this.radius = 44;
    this.maxHp = config.bossMaxHp || 1120;
    this.hp = this.maxHp;
    this.vx = 0;
    this.vy = 0;
    this.speed = 86;
    this.facing = 0;
    this.hitFlash = 0;
    this.stun = 0;
    this.rooted = 0;
    this.bloom = 0;
    this.animTime = 0;
    this.pose = "idle";
    this.recovery = 0;
    this.currentAttack = null;
    this.cooldowns = {
      slam: 1.1,
      volley: 0.9,
      eruption: 1.8,
      summon: 2.4,
      signature: 4.8,
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
      this.pose = "stun";
      this.animTime += dt * 5.5;
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
    this.updateAnimation(dt);
  }

  chooseAction(state, dt) {
    const playerDistance = distance(this.x, this.y, state.player.x, state.player.y);

    if (
      this.phase >= 2 &&
      this.cooldowns.signature <= 0 &&
      state.eruptions.length <= 2
    ) {
      this.beginSignature(state);
      return;
    }

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
    const center = { x: state.player.x, y: state.player.y };
    const count = this.phase >= 2 ? 6 : 4;
    const eruptionDamage = phasePair(this.identity.eruptionDamage, this.phase);
    const eruptionType = this.identity.hazardType || "thorn";

    for (let i = 0; i < count; i += 1) {
      const angle = randomRange(0, TAU);
      const distanceFromPlayer = i === 0 ? 0 : randomRange(40, this.phase >= 2 ? 140 : 118);
      this.pushHazard(state, {
        x: center.x + Math.cos(angle) * distanceFromPlayer,
        y: center.y + Math.sin(angle) * distanceFromPlayer,
        radius: randomRange(28, this.phase >= 2 ? 48 : 40),
        warning: 0.74 + i * 0.04,
        damage: eruptionDamage,
        type: eruptionType,
      });
    }

    this.currentAttack = { type: "eruption", timer: this.phase >= 2 ? 0.64 : 0.82 };
    this.cooldowns.eruption = this.phase >= 2 ? 2.8 : 3.5;
    this.vx *= 0.2;
    this.vy *= 0.2;

    spawnBurst(state, this.x, this.y, {
      count: 18,
      colors: this.identity.eruptionColors,
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

  beginSignature(state) {
    const kind = this.identity.signatureKind;
    state.encounter.bannerText = this.identity.signatureLabel || "Guardian Rite";
    state.encounter.bannerTimer = 1.35;

    if (kind === "root-crown") {
      this.beginRootCrown(state);
      return;
    }

    if (kind === "ashen-ring") {
      this.beginAshenRing(state);
    } else if (kind === "veilfall-halo") {
      this.beginVeilfallHalo(state);
    } else if (kind === "single-will") {
      this.beginSingleWill(state);
    } else if (kind === "tidewake-crown") {
      this.beginTidewakeCrown(state);
    } else if (kind === "vault-lock") {
      this.beginVaultLock(state);
    } else {
      this.beginSixfoldVerdict(state);
    }

    this.currentAttack = {
      type: "signature",
      label: this.identity.signatureLabel,
      timer: this.phase >= 3 ? 0.72 : 0.86,
    };
    this.cooldowns.signature = this.phase >= 3 ? 5.8 : 7.2;
    this.vx *= 0.14;
    this.vy *= 0.14;
  }

  beginRootCrown(state) {
    const center = { x: state.player.x, y: state.player.y };
    const gapAngle = angleTo(this.x, this.y, center.x, center.y);
    const ringRadius = this.phase >= 3 ? 104 : 94;
    const ringCount = this.phase >= 3 ? 14 : 12;
    const gapWidth = this.phase >= 3 ? 0.42 : 0.5;
    const damage = phasePair(this.identity.eruptionDamage, this.phase);

    for (let index = 0; index < ringCount; index += 1) {
      const angle = (TAU * index) / ringCount;
      const delta = Math.atan2(Math.sin(angle - gapAngle), Math.cos(angle - gapAngle));
      if (Math.abs(delta) <= gapWidth) continue;
      this.pushHazard(state, {
        x: center.x + Math.cos(angle) * ringRadius,
        y: center.y + Math.sin(angle) * ringRadius,
        radius: this.phase >= 3 ? 27 : 25,
        warning: this.phase >= 3 ? 0.66 : 0.74,
        damage,
        type: "thorn",
      });
    }

    this.pushHazard(state, {
      x: center.x,
      y: center.y,
      radius: this.phase >= 3 ? 46 : 40,
      warning: this.phase >= 3 ? 0.98 : 1.08,
      damage: damage + 2,
      type: "thorn",
    });

    this.currentAttack = {
      type: "rootCrown",
      label: this.identity.signatureLabel,
      timer: this.phase >= 3 ? 0.72 : 0.82,
      duration: this.phase >= 3 ? 0.72 : 0.82,
      centerX: center.x,
      centerY: center.y,
      gapAngle,
      gapWidth,
      ringRadius,
    };
    this.cooldowns.signature = this.phase >= 3 ? 5.8 : 7;
    this.vx *= 0.14;
    this.vy *= 0.14;
  }

  beginAshenRing(state) {
    const center = { x: state.player.x, y: state.player.y };
    const damage = phasePair(this.identity.eruptionDamage, this.phase);
    const rings = this.phase >= 3 ? [62, 112, 164] : [72, 132];

    rings.forEach((radius, ringIndex) => {
      const count = Math.max(8, Math.round(radius / 13));
      for (let index = 0; index < count; index += 1) {
        const angle = (TAU * index) / count + ringIndex * 0.13;
        if ((index + ringIndex) % 5 === 0) continue;
        this.pushHazard(state, {
          x: center.x + Math.cos(angle) * radius,
          y: center.y + Math.sin(angle) * radius,
          radius: 21,
          warning: 0.55 + ringIndex * 0.22,
          active: 0.42,
          damage,
          type: "ember",
        });
      }
    });
  }

  beginVeilfallHalo(state) {
    const center = { x: state.player.x, y: state.player.y };
    const damage = phasePair(this.identity.eruptionDamage, this.phase);
    const spokeCount = this.phase >= 3 ? 8 : 6;

    for (let spoke = 0; spoke < spokeCount; spoke += 1) {
      const angle = (TAU * spoke) / spokeCount + Math.PI / 8;
      for (let step = 1; step <= 4; step += 1) {
        const radius = 42 + step * 38;
        this.pushHazard(state, {
          x: center.x + Math.cos(angle) * radius,
          y: center.y + Math.sin(angle) * radius,
          radius: 20,
          warning: 0.52 + step * 0.08,
          damage,
          type: "frost",
        });
      }
    }

    this.pushHazard(state, {
      x: center.x,
      y: center.y,
      radius: 38,
      warning: 0.9,
      damage: damage + 2,
      type: "frost",
    });
  }

  beginSingleWill(state) {
    const player = state.player;
    const damage = phasePair(this.identity.eruptionDamage, this.phase);
    const velocity = normalize(player.vx || 0, player.vy || 0);
    const forwardX = velocity.x || Math.cos(angleTo(this.x, this.y, player.x, player.y));
    const forwardY = velocity.y || Math.sin(angleTo(this.x, this.y, player.x, player.y));
    const points = [
      [player.x, player.y],
      [player.x + forwardX * 64, player.y + forwardY * 64],
      [player.x + forwardX * 118, player.y + forwardY * 118],
    ];

    points.forEach(([x, y], index) => {
      this.pushHazard(state, {
        x,
        y,
        radius: 38 + index * 4,
        warning: 0.5 + index * 0.18,
        active: 0.42,
        damage: damage + (index === 2 ? 3 : 0),
        type: "blight",
      });
    });

    if (state.enemies.length <= 4 && this.phase >= 3) {
      const spawn = state.arena.bossAddSpawns?.[0];
      if (spawn) {
        state.enemies.push(
          new Enemy(spawn.x, spawn.y, "blight_hound", {
            elite: true,
            affixes: ["swift"],
          })
        );
      }
    }
  }

  beginTidewakeCrown(state) {
    const damage = phasePair(this.identity.eruptionDamage, this.phase);
    const center = { x: this.x, y: this.y };
    const ringRadii = this.phase >= 3 ? [72, 126, 180] : [84, 148];

    ringRadii.forEach((radius, ringIndex) => {
      const count = this.phase >= 3 ? 12 : 10;
      const safeArc = angleTo(center.x, center.y, state.player.x, state.player.y) + Math.PI;
      for (let index = 0; index < count; index += 1) {
        const angle = (TAU * index) / count;
        const delta = Math.atan2(Math.sin(angle - safeArc), Math.cos(angle - safeArc));
        if (Math.abs(delta) < 0.38) continue;
        this.pushHazard(state, {
          x: center.x + Math.cos(angle) * radius,
          y: center.y + Math.sin(angle) * radius,
          radius: 25,
          warning: 0.5 + ringIndex * 0.24,
          active: 0.44,
          damage,
          type: "mire",
        });
      }
    });
  }

  beginVaultLock(state) {
    const center = { x: state.player.x, y: state.player.y };
    const damage = phasePair(this.identity.eruptionDamage, this.phase);
    const spacing = 54;
    const safeQuadrant = Math.floor(Math.random() * 4);

    for (let ix = -2; ix <= 2; ix += 1) {
      for (let iy = -2; iy <= 2; iy += 1) {
        if (ix === 0 && iy === 0) continue;
        const quadrant = (ix >= 0 ? 1 : 0) + (iy >= 0 ? 2 : 0);
        if (quadrant === safeQuadrant && Math.abs(ix) <= 1 && Math.abs(iy) <= 1) continue;
        if ((Math.abs(ix) + Math.abs(iy)) % 2 !== 0) continue;
        this.pushHazard(state, {
          x: center.x + ix * spacing,
          y: center.y + iy * spacing,
          radius: 24,
          warning: 0.62 + (Math.abs(ix) + Math.abs(iy)) * 0.06,
          damage,
          type: "ancient",
        });
      }
    }
  }

  beginSixfoldVerdict(state) {
    const center = { x: state.player.x, y: state.player.y };
    const damage = phasePair(this.identity.eruptionDamage, this.phase);
    const rotation = randomRange(0, TAU);

    for (let spoke = 0; spoke < 6; spoke += 1) {
      const angle = rotation + (TAU * spoke) / 6;
      for (let step = 1; step <= 4; step += 1) {
        const radius = 38 + step * 40;
        this.pushHazard(state, {
          x: center.x + Math.cos(angle) * radius,
          y: center.y + Math.sin(angle) * radius,
          radius: 21,
          warning: 0.48 + step * 0.09,
          damage,
          type: "ancient",
        });
      }
    }

    const safeAngle = rotation + Math.PI / 6;
    const ringCount = 12;
    for (let index = 0; index < ringCount; index += 1) {
      const angle = rotation + (TAU * index) / ringCount;
      const delta = Math.atan2(Math.sin(angle - safeAngle), Math.cos(angle - safeAngle));
      if (Math.abs(delta) < 0.3) continue;
      this.pushHazard(state, {
        x: center.x + Math.cos(angle) * 116,
        y: center.y + Math.sin(angle) * 116,
        radius: 18,
        warning: 0.92,
        damage: damage + 2,
        type: "ancient",
      });
    }
  }

  pushHazard(state, hazard) {
    state.eruptions.push({
      x: hazard.x,
      y: hazard.y,
      radius: hazard.radius,
      warning: hazard.warning ?? 0.7,
      active: hazard.active ?? 0.32,
      damage: hazard.damage,
      hitPlayer: false,
      type: hazard.type || this.identity.hazardType,
    });
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
    } else if (
      this.currentAttack.type === "rootCrown" ||
      this.currentAttack.type === "signature"
    ) {
      this.performSignatureBurst(state);
      this.recovery = 0.5;
    }

    this.currentAttack = null;
  }

  performSlam(state, attack) {
    const direction = normalize(attack.targetX - this.x, attack.targetY - this.y);
    this.vx += direction.x * (this.phase >= 2 ? 260 : 225);
    this.vy += direction.y * (this.phase >= 2 ? 260 : 225);

    spawnBurst(state, attack.targetX, attack.targetY, {
      count: 32,
      colors: this.identity.slamColors,
      speed: 300,
      size: [2, 6],
      life: [0.18, 0.55],
    });

    if (
      distance(attack.targetX, attack.targetY, state.player.x, state.player.y) <=
      attack.radius + state.player.radius
    ) {
      damagePlayer(
        state,
        this.phase >= 2 ? 34 : 28,
        attack.targetX,
        attack.targetY,
        330,
        this.identity.damageType
      );
      state.shake = Math.max(state.shake, 10);
    } else {
      state.shake = Math.max(state.shake, 6);
    }
  }

  performVolley(state) {
    const base = angleTo(this.x, this.y, state.player.x, state.player.y);
    const spread =
      this.phase >= 2
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
        damage: phasePair(this.identity.volleyDamage, this.phase),
        knockback: 175,
        type: this.identity.volleyProjectileType || "thorn",
      });
    }

    spawnBurst(state, this.x, this.y, {
      count: 20,
      colors: this.identity.volleyColors,
      speed: 180,
      size: [2, 4],
      life: [0.14, 0.32],
    });
  }

  performEruptionBurst(state) {
    state.shake = Math.max(state.shake, 5);
    spawnBurst(state, this.x, this.y, {
      count: 14,
      colors: this.identity.eruptionBurstColors,
      speed: 150,
      size: [2, 4],
      life: [0.12, 0.28],
    });
  }

  performSummon(state) {
    const composition =
      this.phase >= 3 ? this.identity.summonPhase3 : this.identity.summonPhase2;
    const spawns = [...state.arena.bossAddSpawns];
    if (spawns.length === 0) return;

    composition.forEach((spec, index) => {
      const spawn = spawns[index % spawns.length];
      if (typeof spec === "string") {
        state.enemies.push(new Enemy(spawn.x, spawn.y, spec));
      } else {
        state.enemies.push(new Enemy(spawn.x, spawn.y, spec.type, spec));
      }
      spawnBurst(state, spawn.x, spawn.y, {
        count: 18,
        colors: this.identity.summonBurstColors,
        speed: 180,
        size: [2, 5],
        life: [0.16, 0.36],
      });
    });

    state.encounter.bannerText = this.identity.summonBanner;
    state.encounter.bannerTimer = 1.5;
  }

  performSignatureBurst(state) {
    state.shake = Math.max(state.shake, 6);
    spawnBurst(state, this.x, this.y, {
      count: 26,
      colors: this.identity.summonBurstColors,
      speed: 220,
      size: [2, 6],
      life: [0.18, 0.48],
    });
  }

  updatePhase(state) {
    const ratio = this.hp / this.maxHp;
    const nextPhase = ratio <= 0.55 ? 2 : 1;
    const finalPhase = ratio <= 0.24 ? 3 : nextPhase;

    if (finalPhase > this.phase) {
      this.phase = finalPhase;
      state.encounter.bannerText =
        this.phase === 2
          ? this.identity.phaseBanners?.[0] || "The Forest Turns"
          : this.identity.phaseBanners?.[1] || "The Wilds Break";
      state.encounter.bannerTimer = 1.8;
      state.shake = Math.max(state.shake, 7);
      this.cooldowns.signature = Math.min(this.cooldowns.signature, 1.25);
    }
  }

  checkSummonThresholds(state) {
    while (
      this.thresholds.length > 0 &&
      this.hp <= this.maxHp * this.thresholds[0] &&
      !this.dead
    ) {
      this.thresholds.shift();
      this.performSummon(state);
      state.shake = Math.max(state.shake, 5);
    }
  }

  moveTowardPlayer(dt, state) {
    const direction = normalize(state.player.x - this.x, state.player.y - this.y);
    const rootMul = this.rooted > 0 ? 0.3 : 1;
    const distanceToZoneCenter = distance(this.x, this.y, this.zone.x, this.zone.y);

    this.vx +=
      direction.x * this.speed * (this.phase >= 2 ? 5.4 : 5.1) * dt * rootMul;
    this.vy +=
      direction.y * this.speed * (this.phase >= 2 ? 5.4 : 5.1) * dt * rootMul;

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

  updateAnimation(dt) {
    const speed = Math.hypot(this.vx, this.vy);
    this.animTime += dt * (speed > 8 ? 2.8 + speed / 140 : 1.1);

    if (this.rooted > 0) {
      this.pose = "rooted";
      return;
    }

    if (this.currentAttack) {
      this.pose =
        this.currentAttack.type === "rootCrown" || this.currentAttack.type === "signature"
          ? "summon"
          : this.currentAttack.type;
      return;
    }

    this.pose = this.recovery > 0.05 ? "recover" : speed > 8 ? "walk" : "idle";
  }
}

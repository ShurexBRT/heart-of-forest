import { distance } from "../core/math.js";
import { Enemy } from "../entities/enemy.js";
import { Boss } from "../entities/boss.js";
import { collidesWithObstacle } from "./collision.js";
import { damagePlayer } from "./combat.js";
import { spawnBurst } from "./particles.js";
import { createRng, randomRangeFrom, shuffleFrom } from "./rng.js";

export function createEncounterState(arena, config = {}) {
  const waveTemplates = config.waveTemplates || [
    [["basic", "basic"]],
    [["basic", "basic", "basic"]],
  ];
  const rng = createRng(config.seed || `${config.poiTypeId || "site"}:${config.threatTier || 1}`);

  return {
    phase: "waveIntro",
    waveIndex: -1,
    totalWaves: waveTemplates.length,
    wavePlans: generateWavePlans(waveTemplates, rng),
    spawnQueue: [],
    spawnTimer: 0.8,
    phaseTimer: config.introDelay ?? 0.55,
    zoneAlpha: 0,
    bannerText: config.title || "Expedition Begins",
    bannerTimer: 1.5,
    arena,
    bossEnabled: Boolean(config.bossEnabled),
    completionText: config.completionText || "Area Cleansed",
    threatTier: config.threatTier || 1,
    title: config.title || "Cleansing Site",
    regionName: config.regionName || "",
    poiTypeId: config.poiTypeId || "nest",
    rng,
  };
}

export function updateEncounter(state, dt) {
  const encounter = state.encounter;
  encounter.bannerTimer = Math.max(0, encounter.bannerTimer - dt);

  const wantsZone =
    encounter.bossEnabled &&
    (encounter.phase === "bossIntro" || encounter.phase === "boss" || encounter.phase === "cleared" || Boolean(state.boss));
  const targetZoneAlpha = wantsZone ? 1 : 0;
  encounter.zoneAlpha += (targetZoneAlpha - encounter.zoneAlpha) * Math.min(1, 3.5 * dt);

  updateHostileProjectiles(state, dt);
  updateEruptions(state, dt);

  if (!state.gameOver && state.boss && !state.boss.dead) {
    state.boss.update(dt, state);
  }

  if (state.gameOver || state.areaCleared) {
    return;
  }

  switch (encounter.phase) {
    case "waveIntro":
      encounter.phaseTimer -= dt;
      if (encounter.phaseTimer <= 0) {
        beginWave(state, encounter.waveIndex + 1);
      }
      break;
    case "wave":
      updateWaveSpawning(state, dt);
      if (encounter.spawnQueue.length === 0 && state.enemies.length === 0) {
        if (encounter.waveIndex < encounter.totalWaves - 1) {
          encounter.phase = "intermission";
          encounter.phaseTimer = 1.15;
          encounter.bannerText = `Wave ${encounter.waveIndex + 2}`;
          encounter.bannerTimer = 1.2;
        } else if (encounter.bossEnabled) {
          encounter.phase = "bossIntro";
          encounter.phaseTimer = 1.8;
          encounter.bannerText = "Heart Guardian Awakens";
          encounter.bannerTimer = 1.8;
          spawnBurst(state, state.arena.bossZone.x, state.arena.bossZone.y, {
            count: 34,
            colors: ["#d46d4d", "#efcb7f", "#8ce06c"],
            speed: 250,
            size: [2, 6],
            life: [0.2, 0.6],
          });
        } else {
          state.areaCleared = true;
          encounter.phase = "cleared";
          encounter.bannerText = encounter.completionText;
          encounter.bannerTimer = 1.8;
          state.shake = Math.max(state.shake, 6);
        }
      }
      break;
    case "intermission":
      encounter.phaseTimer -= dt;
      if (encounter.phaseTimer <= 0) {
        beginWave(state, encounter.waveIndex + 1);
      }
      break;
    case "bossIntro":
      encounter.phaseTimer -= dt;
      if (encounter.phaseTimer <= 0) {
        spawnBoss(state);
        encounter.phase = "boss";
        encounter.bannerText = "Protect the Heart";
        encounter.bannerTimer = 1.6;
      }
      break;
    case "boss":
      if (state.boss && state.boss.dead && state.enemies.length === 0) {
        state.areaCleared = true;
        encounter.phase = "cleared";
        encounter.bannerText = encounter.completionText;
        encounter.bannerTimer = 2.4;
        state.shake = Math.max(state.shake, 7);
      }
      break;
    default:
      break;
  }
}

function generateWavePlans(waveTemplates, rng) {
  return waveTemplates.map((waveSet) => {
    const template = waveSet[Math.floor(rng() * waveSet.length)];
    const shuffled = shuffleFrom(rng, template);

    return shuffled.map((type, index) => ({
      type,
      delay: index === 0 ? 0.28 : randomRangeFrom(rng, 0.45, 0.85),
    }));
  });
}

function beginWave(state, waveIndex) {
  const encounter = state.encounter;
  encounter.waveIndex = waveIndex;
  encounter.phase = "wave";
  encounter.spawnQueue = encounter.wavePlans[waveIndex].map((item) => ({ ...item }));
  encounter.spawnTimer = 0.22;
}

function updateWaveSpawning(state, dt) {
  const encounter = state.encounter;

  if (encounter.spawnQueue.length === 0) return;

  encounter.spawnTimer -= dt;

  if (encounter.spawnTimer > 0) return;

  const next = encounter.spawnQueue.shift();
  spawnEnemyFromDirector(state, next.type);
  encounter.spawnTimer = next.delay;
}

function spawnEnemyFromDirector(state, type) {
  const player = state.player;
  const spawn = pickSpawnPoint(state.arena.spawnPoints, player.x, player.y, state.encounter.rng);
  const waveIndex = Math.max(0, state.encounter.waveIndex);
  const threat = Math.max(1, state.encounter.threatTier);
  const hpScale = 1 + threat * 0.18 + waveIndex * 0.18;
  const damageScale = 1 + Math.max(0, threat - 1) * 0.08 + waveIndex * 0.06;

  state.enemies.push(new Enemy(spawn.x, spawn.y, type, { hpScale, damageScale }));

  spawnBurst(state, spawn.x, spawn.y, {
    count: type === "brute" ? 18 : 14,
    colors: type === "brute" ? ["#d26c51", "#f1b877", "#8fe170"] : ["#d8595c", "#f0c172", "#9ce873"],
    speed: 165,
    size: [2, 4],
    life: [0.14, 0.34],
  });
}

function pickSpawnPoint(spawnPoints, avoidX, avoidY, rng) {
  const valid = spawnPoints
    .map((point) => ({
      ...point,
      score: distance(point.x, point.y, avoidX, avoidY) + randomRangeFrom(rng, -70, 70),
    }))
    .sort((a, b) => b.score - a.score);

  const topChoices = valid.slice(0, 4);
  return topChoices[Math.floor(rng() * topChoices.length)];
}

function spawnBoss(state) {
  const zone = state.arena.bossZone;
  state.boss = new Boss({ x: zone.x, y: zone.y }, zone);
  state.hostileProjectiles = [];
  state.eruptions = [];

  spawnBurst(state, zone.x, zone.y, {
    count: 48,
    colors: ["#f1cd7a", "#dc7151", "#8fe770", "#fff0a1"],
    speed: 290,
    size: [2, 7],
    life: [0.22, 0.7],
  });
}

function updateHostileProjectiles(state, dt) {
  for (const projectile of state.hostileProjectiles) {
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.life -= dt;

    if (
      projectile.x < 0 ||
      projectile.y < 0 ||
      projectile.x > state.arena.width ||
      projectile.y > state.arena.height ||
      collidesWithObstacle(projectile.x, projectile.y, projectile.radius, state.arena)
    ) {
      projectile.life = 0;
      continue;
    }

    if (
      !state.gameOver &&
      distance(projectile.x, projectile.y, state.player.x, state.player.y) <=
        projectile.radius + state.player.radius
    ) {
      const hit = damagePlayer(
        state,
        projectile.damage,
        projectile.x,
        projectile.y,
        projectile.knockback
      );

      projectile.life = 0;

      if (hit) {
        spawnBurst(state, projectile.x, projectile.y, {
          count: 12,
          colors: ["#f3ca74", "#cf6248", "#fff0cb"],
          speed: 170,
          size: [2, 4],
          life: [0.12, 0.3],
        });
      }
    }
  }

  state.hostileProjectiles = state.hostileProjectiles.filter((projectile) => projectile.life > 0);
}

function updateEruptions(state, dt) {
  for (const hazard of state.eruptions) {
    if (hazard.warning > 0) {
      hazard.warning -= dt;

      if (hazard.warning <= 0) {
        spawnBurst(state, hazard.x, hazard.y, {
          count: 22,
          colors: ["#9eea73", "#f0bb64", "#fff0a0"],
          speed: 220,
          size: [2, 5],
          life: [0.16, 0.42],
        });
        state.shake = Math.max(state.shake, 4);
      }

      continue;
    }

    hazard.active -= dt;

    if (
      !hazard.hitPlayer &&
      !state.gameOver &&
      distance(hazard.x, hazard.y, state.player.x, state.player.y) <=
        hazard.radius + state.player.radius
    ) {
      hazard.hitPlayer = true;
      damagePlayer(state, hazard.damage, hazard.x, hazard.y, 220);
    }
  }

  state.eruptions = state.eruptions.filter((hazard) => hazard.active > 0);
}

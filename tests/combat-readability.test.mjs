import test from "node:test";
import assert from "node:assert/strict";

import { Boss } from "../entities/boss.js";
import { Enemy } from "../entities/enemy.js";

const ENEMY_TYPES = [
  "thornling",
  "barkling",
  "root_stalker",
  "mire_brute",
  "mire_spitter",
  "bog_lurker",
  "ash_brute",
  "wisp_archer",
  "cinder_imp",
  "frost_wisp",
  "starbound_archer",
  "thorn_weaver",
  "rot_weaver",
  "icebound_guardian",
  "blight_hound",
  "relic_sentinel",
];

const BOSS_TYPES = [
  "rootwarden",
  "cinder_warden",
  "veil_seraph",
  "elder_hollow",
  "bog_matron",
  "rootbound_custodian",
  "starwoken_sentinel",
];

function createBossState() {
  return {
    player: { x: 620, y: 400, vx: 80, vy: 0, radius: 16 },
    eruptions: [],
    enemies: [],
    hostileProjectiles: [],
    particles: [],
    shake: 0,
    encounter: { bannerText: "", bannerTimer: 0 },
    arena: {
      width: 1000,
      height: 800,
      boundsPadding: 28,
      obstacles: [],
      bossAddSpawns: [
        { x: 440, y: 340 },
        { x: 560, y: 340 },
        { x: 500, y: 470 },
      ],
    },
  };
}

test("regular enemies preserve a readable reaction window", () => {
  for (const type of ENEMY_TYPES) {
    const enemy = new Enemy(0, 0, type);
    assert.ok(
      enemy.config.windup >= 0.16,
      `${type} windup ${enemy.config.windup}s is too short to read`
    );
    assert.ok(
      enemy.config.recover >= 0.34,
      `${type} recovery ${enemy.config.recover}s is too short`
    );
    assert.ok(
      enemy.config.damage <= 30,
      `${type} base hit ${enemy.config.damage} is outside the regular-enemy damage budget`
    );
  }
});

test("ranged enemies keep projectile patterns inside the readability budget", () => {
  for (const type of ENEMY_TYPES) {
    const enemy = new Enemy(0, 0, type);
    if (enemy.config.role !== "ranged") continue;

    assert.ok(
      (enemy.config.projectileSpeed || 0) <= 310,
      `${type} projectile speed is too high for the current camera scale`
    );
    assert.ok(
      (enemy.config.projectileCount || 1) <= 3,
      `${type} fires too many projectiles per basic attack`
    );
    assert.ok(
      enemy.config.windup >= 0.3,
      `${type} needs at least a 300ms ranged telegraph`
    );
  }
});

test("boss signature hazards always telegraph before becoming active", () => {
  for (const bossId of BOSS_TYPES) {
    const state = createBossState();
    const boss = new Boss(
      { x: 500, y: 400 },
      { x: 500, y: 400, radius: 220 },
      { bossId, bossName: bossId }
    );
    boss.phase = 2;
    boss.beginSignature(state);

    assert.ok(state.eruptions.length >= 3, `${bossId} signature needs visible hazards`);
    assert.ok(state.eruptions.length <= 36, `${bossId} signature exceeds the screen hazard budget`);

    for (const hazard of state.eruptions) {
      assert.ok(
        hazard.warning >= 0.5,
        `${bossId} has a ${hazard.warning}s signature warning below the 500ms floor`
      );
      assert.ok(
        hazard.active <= 0.5,
        `${bossId} leaves a signature hazard active too long`
      );
      assert.ok(
        hazard.damage <= 26,
        `${bossId} signature hazard exceeds the per-hit damage budget`
      );
    }
  }
});

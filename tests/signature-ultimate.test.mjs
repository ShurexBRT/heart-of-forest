import test from "node:test";
import assert from "node:assert/strict";

import { Player } from "../entities/player.js";
import { handlePlayerAbilities } from "../systems/combat.js";
import { createProgression, getPlayerBonuses } from "../systems/progression.js";

function createUltimateState(signature, { bloom = 0 } = {}) {
  const progression = createProgression({
    talents: { [signature]: 1 },
    worldFlags: { signature_rite_unlocked: true },
  });
  const player = new Player({ x: 100, y: 100 }, getPlayerBonuses(progression));
  player.heartCharge = 100;
  player.hp = 50;

  const target = {
    x: 130,
    y: 100,
    radius: 16,
    hp: 200,
    maxHp: 200,
    dead: false,
    rooted: 0,
    bloom,
    hitFlash: 0,
    stun: 0,
    vx: 0,
    vy: 0,
    state: "chase",
    type: "thornling",
    elite: false,
    isBoss: false,
    config: { rootMultiplier: 1 },
  };

  return {
    player,
    target,
    state: {
      player,
      progression,
      mouseWorld: { x: 180, y: 100 },
      enemies: [target],
      boss: null,
      arena: { boundsPadding: 0, width: 1000, height: 1000 },
      projectiles: [],
      hostileProjectiles: [{ x: 150, y: 100 }],
      eruptions: [],
      roots: [],
      pulses: [],
      swings: [],
      particles: [],
      afterImages: [],
      combatText: [],
      storyEvents: [],
      settings: { damageNumbers: false },
      audio: { enabled: false },
      story: { toastText: "", toastTimer: 0 },
      scene: { biomeId: "forest" },
      shake: 0,
      hitStop: 0,
      combatTimer: 0,
    },
  };
}

function pressUltimate(state) {
  handlePlayerAbilities(state, {
    mouse: { leftPressed: false, rightPressed: false },
    keys: new Set(),
    codes: new Set(),
    keyPressed: new Set(["r"]),
    codePressed: new Set(["KeyR"]),
  });
}

test("Heartwood Tempest spends Heart Charge on a visible three-sweep staff finisher", () => {
  const { state, player, target } = createUltimateState("heartwood_tempest");

  pressUltimate(state);

  assert.equal(player.abilityInfo.pulse.shortLabel, "Tempest");
  assert.equal(player.abilityInfo.pulse.cost, 0);
  assert.equal(player.heartCharge, 0);
  assert.equal(player.cooldowns.pulse, 5.5);
  assert.equal(target.hp, 128);
  assert.equal(state.swings.length, 3);
  assert.equal(state.pulses[0].ultimate, true);
});

test("Verdant Nova detonates Bloom and clears hostile projectiles", () => {
  const { state, player, target } = createUltimateState("verdant_nova", {
    bloom: 1,
  });

  pressUltimate(state);

  assert.equal(player.abilityInfo.pulse.shortLabel, "Nova");
  assert.equal(target.hp, 98);
  assert.equal(target.bloom, 0);
  assert.deepEqual(state.hostileProjectiles, []);
});

test("Awaken the Grove roots enemies, heals Ayla, and leaves a healing field", () => {
  const { state, player, target } = createUltimateState("awaken_the_grove");

  pressUltimate(state);

  assert.equal(player.abilityInfo.pulse.shortLabel, "Grove");
  assert.equal(target.hp, 152);
  assert.equal(target.rooted, 3);
  assert.equal(player.hp, 74);
  assert.ok(state.roots.some((root) => root.healing && root.life === 4));
});

import test from "node:test";
import assert from "node:assert/strict";

import { Enemy } from "../entities/enemy.js";

const DISTINCT_TYPES = [
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

test("every enemy type uses its own atlas identity", () => {
  for (const type of DISTINCT_TYPES) {
    const enemy = new Enemy(0, 0, type);
    assert.equal(enemy.config.sprite, type, `${type} should render its own atlas row`);
  }
});

test("late-game ranged enemies have distinct projectile patterns", () => {
  const frost = new Enemy(0, 0, "frost_wisp");
  const starbound = new Enemy(0, 0, "starbound_archer");
  const mire = new Enemy(0, 0, "mire_spitter");

  assert.equal(frost.config.projectileCount, 2);
  assert.equal(starbound.config.projectileCount, 3);
  assert.equal(mire.config.projectileRadius, 9);
});

test("heavy biome guardians advertise their elemental ground threat", () => {
  for (const type of ["mire_brute", "ash_brute", "icebound_guardian"]) {
    const enemy = new Enemy(0, 0, type);
    assert.ok(enemy.config.meleeHazard, `${type} needs a signature ground threat`);
  }
});

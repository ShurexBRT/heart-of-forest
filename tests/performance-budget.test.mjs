import test from "node:test";
import assert from "node:assert/strict";

import {
  spawnAmbientMote,
  spawnBurst,
  updateParticles,
} from "../systems/particles.js";

function createState(settings = {}) {
  return { particles: [], settings };
}

test("combat particle bursts never exceed the global VFX budget", () => {
  const state = createState();
  spawnBurst(state, 0, 0, { count: 1000, life: [1, 1] });
  assert.equal(state.particles.length, 240);

  spawnBurst(state, 0, 0, { count: 1000, life: [1, 1] });
  assert.equal(state.particles.length, 240);
});

test("ambient motes keep a separate density ceiling", () => {
  const state = createState();
  for (let index = 0; index < 100; index += 1) {
    spawnAmbientMote(state, index, index, { life: [3, 3] });
  }

  assert.equal(
    state.particles.filter((particle) => particle.ambient).length,
    42
  );
});

test("reduced motion lowers the total VFX budget and disables ambience", () => {
  const state = createState({ reducedMotion: true });
  spawnBurst(state, 0, 0, { count: 1000, life: [1, 1] });
  assert.equal(state.particles.length, 96);
  assert.equal(spawnAmbientMote(state, 0, 0), false);
  assert.equal(state.particles.length, 96);
});

test("expired particles are removed instead of accumulating across encounters", () => {
  const state = createState();
  spawnBurst(state, 0, 0, { count: 60, life: [0.1, 0.1] });
  assert.equal(state.particles.length, 60);

  updateParticles(state, 0.2);
  assert.equal(state.particles.length, 0);
});

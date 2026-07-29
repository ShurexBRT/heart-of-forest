import test from "node:test";
import assert from "node:assert/strict";

import { Player } from "../entities/player.js";
import { handlePlayerAbilities } from "../systems/combat.js";
import { createProgression, getPlayerBonuses } from "../systems/progression.js";

function createAbilityFeedbackState(progression = createProgression()) {
  const player = new Player({ x: 120, y: 120 }, getPlayerBonuses(progression));
  return {
    player,
    progression,
    mouseWorld: { x: 260, y: 120 },
    enemies: [],
    boss: null,
    arena: { boundsPadding: 0, width: 1000, height: 1000 },
    projectiles: [],
    hostileProjectiles: [],
    eruptions: [],
    roots: [],
    pulses: [],
    swings: [],
    particles: [],
    afterImages: [],
    combatText: [],
    storyEvents: [],
    settings: { damageNumbers: false },
    audio: { enabled: true, queue: [] },
    story: { toastText: "", toastTimer: 0 },
    scene: { biomeId: "forest" },
    shake: 0,
    hitStop: 0,
    combatTimer: 0,
    time: 0,
  };
}

function pressBolt(state) {
  handlePlayerAbilities(state, {
    mouse: { leftPressed: false, rightPressed: true },
    keys: new Set(),
    codes: new Set(),
    keyPressed: new Set(),
    codePressed: new Set(),
  });
}

function pressPulse(state) {
  handlePlayerAbilities(state, {
    mouse: { leftPressed: false, rightPressed: false },
    keys: new Set(),
    codes: new Set(),
    keyPressed: new Set(["r"]),
    codePressed: new Set(["KeyR"]),
  });
}

test("blocked ability input shows readable feedback without firing the ability", () => {
  const state = createAbilityFeedbackState();
  state.player.spirit = 5;

  pressBolt(state);

  assert.equal(state.projectiles.length, 0);
  assert.equal(state.combatText.length, 1);
  assert.equal(state.combatText[0].text, "Need Spirit");
  assert.equal(state.combatText[0].abilityDenied, true);
  assert.equal(state.audio.queue.at(-1)?.cue, "ui");

  pressBolt(state);
  assert.equal(state.combatText.length, 1);

  state.time = 0.5;
  pressBolt(state);
  assert.equal(state.combatText.length, 2);
});

test("ultimate input explains charge and locked pulse states", () => {
  const signatureProgression = createProgression({
    talents: { verdant_nova: 1 },
    worldFlags: { signature_rite_unlocked: true },
  });
  const charging = createAbilityFeedbackState(signatureProgression);
  charging.player.heartCharge = 64;

  pressPulse(charging);

  assert.equal(charging.pulses.length, 0);
  assert.equal(charging.combatText.at(-1)?.text, "Build Heart Charge");

  const locked = createAbilityFeedbackState();
  locked.player.abilityInfo.pulse.unlocked = false;
  pressPulse(locked);

  assert.equal(locked.pulses.length, 0);
  assert.equal(locked.combatText.at(-1)?.text, "Open Talents (N)");
});

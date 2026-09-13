import test from "node:test";
import assert from "node:assert/strict";

import { getControllerAbilityHudEntries } from "../systems/shellPresentation.js";

function createState(overrides = {}) {
  return {
    player: {
      spirit: 10,
      heartCharge: 0,
      cooldowns: {
        staff: 0,
        bolt: 0,
        dash: 0.6,
        root: 0,
        pulse: 0,
      },
      abilityInfo: {
        staff: { shortLabel: "Staff", cost: 0 },
        bolt: { shortLabel: "Bolt", cost: 14 },
        dash: { shortLabel: "Dash", cost: 0 },
        root: { shortLabel: "Root", cost: 24 },
        pulse: { shortLabel: "Pulse", cost: 30, unlocked: false },
      },
      ...overrides.player,
    },
  };
}

test("controller HUD exposes the production combat bindings in stable order", () => {
  const entries = getControllerAbilityHudEntries(createState());

  assert.deepEqual(
    entries.map(({ id, binding }) => [id, binding]),
    [
      ["staff", "RT"],
      ["bolt", "LT"],
      ["dash", "A"],
      ["root", "X"],
      ["pulse", "Y"],
    ]
  );
});

test("controller HUD reports cooldown, spirit and locked states from live player data", () => {
  const entries = Object.fromEntries(
    getControllerAbilityHudEntries(createState()).map((entry) => [entry.id, entry])
  );

  assert.equal(entries.staff.status, "Ready");
  assert.equal(entries.staff.readiness, "ready");
  assert.equal(entries.dash.status, "0.6s");
  assert.equal(entries.dash.readiness, "cooldown");
  assert.equal(entries.bolt.status, "Need SP");
  assert.equal(entries.root.status, "Need SP");
  assert.equal(entries.pulse.status, "Locked");
  assert.equal(entries.pulse.readiness, "locked");
});

test("signature slot reports Heart Charge and becomes ULT at full charge", () => {
  const state = createState({
    player: {
      spirit: 65,
      heartCharge: 72,
      cooldowns: { staff: 0, bolt: 0, dash: 0, root: 0, pulse: 0 },
      abilityInfo: {
        staff: { shortLabel: "Staff", cost: 0 },
        bolt: { shortLabel: "Bolt", cost: 14 },
        dash: { shortLabel: "Dash", cost: 0 },
        root: { shortLabel: "Root", cost: 24 },
        pulse: {
          shortLabel: "Tempest",
          cost: 0,
          unlocked: true,
          signatureAbility: "heartwood_tempest",
        },
      },
    },
  });

  let pulse = getControllerAbilityHudEntries(state).find((entry) => entry.id === "pulse");
  assert.equal(pulse.label, "Tempest");
  assert.equal(pulse.status, "72%");
  assert.equal(pulse.readiness, "charging");

  state.player.heartCharge = 100;
  pulse = getControllerAbilityHudEntries(state).find((entry) => entry.id === "pulse");
  assert.equal(pulse.status, "ULT");
  assert.equal(pulse.readiness, "ready");

  state.player.cooldowns.pulse = 1.2;
  pulse = getControllerAbilityHudEntries(state).find((entry) => entry.id === "pulse");
  assert.equal(pulse.status, "1.2s");
  assert.equal(pulse.readiness, "cooldown");
});

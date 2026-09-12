import test from "node:test";
import assert from "node:assert/strict";

import {
  classifyCombatHaptic,
  pickStrongestHaptic,
} from "../systems/runtimeFeedback.js";

test("combat haptics distinguish player hurt from outgoing hits", () => {
  assert.equal(classifyCombatHaptic({ text: "-18", heavy: false }), "hurt");
  assert.equal(classifyCombatHaptic({ text: "14", heavy: false }), "hit");
  assert.equal(classifyCombatHaptic({ text: "42", heavy: true }), "heavy");
});

test("ability-denied feedback never vibrates", () => {
  assert.equal(
    classifyCombatHaptic({ text: "Need Spirit", abilityDenied: true }),
    null
  );
});

test("multi-hit frames keep only the strongest haptic intent", () => {
  assert.equal(pickStrongestHaptic(["dash", "hit", "heavy"]), "heavy");
  assert.equal(pickStrongestHaptic(["hit", "hurt"]), "hurt");
  assert.equal(pickStrongestHaptic([]), null);
});

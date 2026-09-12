import test from "node:test";
import assert from "node:assert/strict";

import {
  applyGamepadDeadzone,
  getGamepadMovementFromAxes,
} from "../core/input.js";

test("gamepad deadzone suppresses stick drift", () => {
  assert.equal(applyGamepadDeadzone(0), 0);
  assert.equal(applyGamepadDeadzone(0.1), 0);
  assert.equal(applyGamepadDeadzone(-0.19), 0);
});

test("gamepad deadzone preserves direction beyond threshold", () => {
  assert.ok(applyGamepadDeadzone(0.7) > 0);
  assert.ok(applyGamepadDeadzone(-0.7) < 0);
  assert.equal(applyGamepadDeadzone(1), 1);
  assert.equal(applyGamepadDeadzone(-1), -1);
});

test("gamepad movement axes are normalized for diagonal movement", () => {
  const movement = getGamepadMovementFromAxes([1, 1]);
  assert.ok(Math.abs(Math.hypot(movement.x, movement.y) - 1) < 0.0001);
  assert.ok(movement.x > 0);
  assert.ok(movement.y > 0);
});

test("gamepad movement returns zero vector inside deadzone", () => {
  assert.deepEqual(getGamepadMovementFromAxes([0.1, -0.1]), { x: 0, y: 0 });
});

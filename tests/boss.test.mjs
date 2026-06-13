import test from "node:test";
import assert from "node:assert/strict";

import { Boss } from "../entities/boss.js";

test("Rootwarden Root Crown leaves a readable escape gap", () => {
  const zone = { x: 500, y: 400, radius: 180 };
  const boss = new Boss({ x: 500, y: 400 }, zone, {
    bossId: "rootwarden",
    bossName: "Rootwarden",
  });
  boss.phase = 2;
  const state = {
    player: { x: 620, y: 400 },
    eruptions: [],
  };

  boss.beginRootCrown(state);

  assert.equal(boss.currentAttack.type, "rootCrown");
  assert.equal(boss.currentAttack.label, "Root Crown");
  assert.ok(state.eruptions.length >= 9);
  assert.ok(state.eruptions.every((hazard) => hazard.type === "thorn"));
  assert.equal(
    state.eruptions.filter(
      (hazard) =>
        Math.hypot(
          hazard.x - boss.currentAttack.centerX,
          hazard.y - boss.currentAttack.centerY
        ) < 1
    ).length,
    1
  );

  const escapeX =
    boss.currentAttack.centerX +
    Math.cos(boss.currentAttack.gapAngle) * boss.currentAttack.ringRadius;
  const escapeY =
    boss.currentAttack.centerY +
    Math.sin(boss.currentAttack.gapAngle) * boss.currentAttack.ringRadius;
  assert.ok(
    state.eruptions.every(
      (hazard) => Math.hypot(hazard.x - escapeX, hazard.y - escapeY) > hazard.radius
    )
  );
});

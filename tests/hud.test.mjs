import test from "node:test";
import assert from "node:assert/strict";

import { getHudAbilityReadiness } from "../ui/hud.js";

test("HUD ability readiness explains locked, cooldown, spirit, charge, and ready states", () => {
  const player = {
    spirit: 5,
    heartCharge: 72,
    cooldowns: {
      bolt: 0,
      dash: 0,
      pulse: 0,
    },
  };

  const boltInfo = { label: "Spirit Bolt", cost: 14, cooldown: 0.42 };
  const dashInfo = { label: "Quick Dash", cost: 0, cooldown: 1.05 };
  const pulseInfo = {
    label: "Verdant Nova",
    cost: 0,
    cooldown: 5.5,
    unlocked: true,
    signatureAbility: "verdant_nova",
  };

  const spiritBlocked = getHudAbilityReadiness(player, "bolt", boltInfo);
  assert.equal(spiritBlocked.state, "spirit");
  assert.equal(spiritBlocked.shortLabel, "NO SP");
  assert.match(spiritBlocked.detail, /Need 9 more Spirit/);

  player.spirit = 100;
  player.cooldowns.bolt = 0.3;
  const coolingDown = getHudAbilityReadiness(player, "bolt", boltInfo);
  assert.equal(coolingDown.state, "cooldown");
  assert.match(coolingDown.detail, /Ready in 0\.3s/);

  const charging = getHudAbilityReadiness(player, "pulse", pulseInfo);
  assert.equal(charging.state, "charging");
  assert.equal(charging.shortLabel, "72%");

  player.heartCharge = 100;
  const readyUltimate = getHudAbilityReadiness(player, "pulse", pulseInfo);
  assert.equal(readyUltimate.state, "ready");
  assert.equal(readyUltimate.shortLabel, "ULT");

  const readyDash = getHudAbilityReadiness(player, "dash", dashInfo);
  assert.equal(readyDash.state, "ready");

  const locked = getHudAbilityReadiness(player, "pulse", { ...pulseInfo, unlocked: false });
  assert.equal(locked.state, "locked");
  assert.equal(locked.shortLabel, "LOCK");
});

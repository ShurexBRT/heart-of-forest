import { circleRectOverlap } from "../core/math.js";
import { damagePlayer } from "./combat.js";
import { spawnBurst } from "./particles.js";

export function updateEnvironment(state, dt) {
  const player = state.player;
  player.hazardTimer = Math.max(0, (player.hazardTimer || 0) - dt);

  for (const hazard of state.arena.hazards || []) {
    if (!circleRectOverlap(player.x, player.y, player.radius, hazard)) continue;
    if (player.hazardTimer > 0) continue;

    player.hazardTimer = hazard.interval || 0.75;
    const hit = damagePlayer(
      state,
      hazard.damage || 6,
      hazard.x + hazard.w / 2,
      hazard.y + hazard.h / 2,
      90
    );

    if (hit) {
      spawnBurst(state, player.x, player.y, {
        count: 10,
        colors:
          hazard.type === "ember"
            ? ["#ffca7c", "#ef7d53", "#fff1bf"]
            : ["#a2eb8b", "#d56e58", "#fff0c1"],
        speed: 160,
        size: [2, 4],
        life: [0.14, 0.3],
      });
    }
  }
}

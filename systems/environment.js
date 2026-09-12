import { circleRectOverlap } from "../core/math.js";
import { damagePlayer } from "./combat.js";
import { spawnAmbientMote, spawnBurst } from "./particles.js";

const BIOME_AMBIENT_VFX = {
  forest: {
    colors: ["#dff2bd", "#9edb82", "#f3e6a6"],
    interval: [0.12, 0.28],
    radiusX: 430,
    radiusY: 260,
    driftX: [-6, 8],
    driftY: [-15, -5],
  },
  marsh: {
    colors: ["#a8e6e8", "#73bec4", "#d7f6df"],
    interval: [0.16, 0.34],
    radiusX: 410,
    radiusY: 240,
    driftX: [-5, 5],
    driftY: [-8, -2],
  },
  highlands: {
    colors: ["#e5dfbb", "#b8c7a0", "#f3e6bf"],
    interval: [0.18, 0.38],
    radiusX: 460,
    radiusY: 270,
    driftX: [-16, 16],
    driftY: [-10, -3],
  },
  ember: {
    colors: ["#ffcf7a", "#ef8754", "#ffdca1"],
    interval: [0.1, 0.22],
    radiusX: 400,
    radiusY: 250,
    driftX: [-8, 8],
    driftY: [-26, -10],
  },
  frost: {
    colors: ["#eefaff", "#b9e3ff", "#d7dfff"],
    interval: [0.1, 0.24],
    radiusX: 450,
    radiusY: 280,
    driftX: [-18, 6],
    driftY: [3, 12],
  },
  blight: {
    colors: ["#d99de9", "#a85e91", "#e5b879"],
    interval: [0.14, 0.3],
    radiusX: 410,
    radiusY: 250,
    driftX: [-7, 7],
    driftY: [-12, 2],
  },
  ancient: {
    colors: ["#e3d9ff", "#b9b9ef", "#f1dda6"],
    interval: [0.12, 0.26],
    radiusX: 430,
    radiusY: 260,
    driftX: [-5, 5],
    driftY: [-18, -7],
  },
};

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export function updateEnvironment(state, dt) {
  updateAmbientVfx(state, dt);

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
      90,
      hazard.type
    );

    if (hit) {
      spawnBurst(state, player.x, player.y, {
        count: 10,
        colors:
          hazard.type === "ember"
            ? ["#ffca7c", "#ef7d53", "#fff1bf"]
            : hazard.type === "mire"
              ? ["#97e5f1", "#56aeb7", "#d7fbff"]
              : ["#a2eb8b", "#d56e58", "#fff0c1"],
        speed: 160,
        size: [2, 4],
        life: [0.14, 0.3],
      });
    }
  }
}

function updateAmbientVfx(state, dt) {
  if (!state?.player || !state?.arena || !state?.particles) return;

  state.environment ??= {};
  state.environment.ambientVfxTimer = Math.max(
    0,
    (state.environment.ambientVfxTimer || 0) - dt
  );
  if (state.environment.ambientVfxTimer > 0) return;

  const preset = BIOME_AMBIENT_VFX[state.arena.biomeId] || BIOME_AMBIENT_VFX.forest;
  const restored = Boolean(
    state.progression?.campaign?.restoredRoots?.[state.arena.biomeId] ||
      state.progression?.worldFlags?.[`${state.arena.biomeId}_restored`]
  );
  const densityMultiplier = restored ? 0.78 : 1;
  state.environment.ambientVfxTimer =
    randomRange(preset.interval[0], preset.interval[1]) * densityMultiplier;

  const angle = Math.random() * Math.PI * 2;
  const radiusX = Math.sqrt(Math.random()) * preset.radiusX;
  const radiusY = Math.sqrt(Math.random()) * preset.radiusY;
  const x = state.player.x + Math.cos(angle) * radiusX;
  const y = state.player.y + Math.sin(angle) * radiusY;

  spawnAmbientMote(state, x, y, {
    colors: preset.colors,
    driftX: preset.driftX,
    driftY: preset.driftY,
    size: restored ? [1.5, 3] : [1.2, 2.4],
    life: restored ? [2.4, 4.2] : [1.8, 3.4],
  });
}

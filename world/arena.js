import { BIOMES } from "../data/gameData.js";
import { createRng, pickFrom, randomIntFrom, randomRangeFrom } from "../systems/rng.js";

function tree(x, y, size) {
  return {
    type: "tree",
    x,
    y,
    w: size,
    h: size + 22,
    solid: {
      x: x + size * 0.16,
      y: y + size * 0.34,
      w: size * 0.68,
      h: size * 0.56,
    },
  };
}

function rock(x, y, w, h) {
  return {
    type: "rock",
    x,
    y,
    w,
    h,
    solid: {
      x: x + 5,
      y: y + 4,
      w: w - 10,
      h: h - 8,
    },
  };
}

export function createArena(context = {}) {
  const biomeId = context.biomeId || "forest";
  const theme = BIOMES[biomeId].colors;
  const rng = createRng(context.seed || `arena-${biomeId}`);
  const width = 1420;
  const height = 860;
  const boundsPadding = 28;
  const isBoss = Boolean(context.bossEnabled);
  const playerSpawn = isBoss ? { x: 242, y: 430 } : { x: 210, y: 430 };
  const obstacleCount = isBoss ? 8 : randomIntFrom(rng, 7, 11);
  const obstacleTypes = biomeId === "highlands" ? ["rock", "rock", "tree"] : biomeId === "marsh" ? ["tree", "tree", "rock"] : ["tree", "rock"];
  const obstacles = [];

  for (let i = 0; i < obstacleCount; i += 1) {
    const type = pickFrom(rng, obstacleTypes);
    const size = type === "tree" ? randomRangeFrom(rng, 72, 108) : randomRangeFrom(rng, 52, 86);
    const widthSize = type === "tree" ? size : size;
    const heightSize = type === "tree" ? size + 22 : randomRangeFrom(rng, 34, 58);
    const x = randomRangeFrom(rng, 110, width - 180);
    const y = randomRangeFrom(rng, 96, height - 180);
    const obstacle = type === "tree" ? tree(x, y, widthSize) : rock(x, y, widthSize, heightSize);

    if (
      overlapsSpawn(obstacle, playerSpawn, 110) ||
      overlapsBossZone(obstacle, { x: width * 0.66, y: height * 0.5, radius: 208 }, isBoss ? 112 : 88)
    ) {
      continue;
    }

    obstacles.push(obstacle);
  }

  return {
    width,
    height,
    boundsPadding,
    playerSpawn,
    spawnPoints: [
      { x: 166, y: 110 },
      { x: 522, y: 104 },
      { x: 870, y: 104 },
      { x: 1186, y: 158 },
      { x: 1250, y: 410 },
      { x: 1118, y: 692 },
      { x: 768, y: 742 },
      { x: 378, y: 716 },
      { x: 108, y: 576 },
      { x: 104, y: 292 },
    ],
    bossZone: {
      x: width * 0.66,
      y: height * 0.5,
      radius: 208,
    },
    bossAddSpawns: [
      { x: width * 0.52, y: height * 0.5 },
      { x: width * 0.66, y: height * 0.27 },
      { x: width * 0.8, y: height * 0.5 },
      { x: width * 0.66, y: height * 0.73 },
    ],
    obstacles,
    theme,
    biomeId,
  };
}

function overlapsSpawn(obstacle, spawn, padding) {
  const centerX = obstacle.solid.x + obstacle.solid.w / 2;
  const centerY = obstacle.solid.y + obstacle.solid.h / 2;
  return Math.hypot(centerX - spawn.x, centerY - spawn.y) < padding;
}

function overlapsBossZone(obstacle, zone, padding) {
  const centerX = obstacle.solid.x + obstacle.solid.w / 2;
  const centerY = obstacle.solid.y + obstacle.solid.h / 2;
  return Math.hypot(centerX - zone.x, centerY - zone.y) < zone.radius - padding;
}

const MATERIAL_PATH = "./assets/world/world-materials.png";
const CELL_W = 32;
const CELL_H = 16;
const VARIANTS = 4;
const MATERIAL_ROWS = {
  roof: 0,
  stone: 1,
  timber: 2,
  planks: 3,
  metal: 4,
  ruin: 5,
};

const state = {
  ready: false,
  tiles: {},
};

if (typeof window !== "undefined" && typeof Image !== "undefined") {
  const image = new Image();
  image.onload = () => {
    state.tiles = buildTiles(image);
    state.ready = true;
  };
  image.src = MATERIAL_PATH;
}

export function drawWorldMaterialRect(ctx, material, x, y, width, height, variant = 0, alpha = 1) {
  const tile = state.tiles[material]?.[variant % VARIANTS];
  if (!state.ready || !tile) return false;

  ctx.save();
  ctx.beginPath();
  ctx.rect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  ctx.clip();
  ctx.globalAlpha *= alpha;
  for (let drawY = Math.floor(y); drawY < y + height; drawY += CELL_H) {
    for (let drawX = Math.floor(x); drawX < x + width; drawX += CELL_W) {
      ctx.drawImage(tile, drawX, drawY);
    }
  }
  ctx.restore();
  return true;
}

function buildTiles(image) {
  const tiles = {};
  for (const [material, row] of Object.entries(MATERIAL_ROWS)) {
    tiles[material] = [];
    for (let variant = 0; variant < VARIANTS; variant += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = CELL_W;
      canvas.height = CELL_H;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        image,
        variant * CELL_W,
        row * CELL_H,
        CELL_W,
        CELL_H,
        0,
        0,
        CELL_W,
        CELL_H
      );
      tiles[material].push(canvas);
    }
  }
  return tiles;
}

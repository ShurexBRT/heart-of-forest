import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CELL_W = 32;
const CELL_H = 16;
const VARIANTS = 4;
const MATERIALS = [
  ["roof", ["#b86128", "#7b3719", "#dc8c44", "#f2af67"]],
  ["stone", ["#817d78", "#565451", "#aaa59e", "#d0cac0"]],
  ["timber", ["#70482d", "#3e291c", "#95623d", "#bd8659"]],
  ["planks", ["#7b5a38", "#46311f", "#a27a4d", "#cda16a"]],
  ["metal", ["#58636a", "#303940", "#84929a", "#bcc9ce"]],
  ["ruin", ["#6f6262", "#413a3d", "#968887", "#b9aaa6"]],
];

const width = CELL_W * VARIANTS;
const height = CELL_H * MATERIALS.length;
const pixels = Buffer.alloc(width * height * 4);

for (let row = 0; row < MATERIALS.length; row += 1) {
  const [material, palette] = MATERIALS[row];
  for (let variant = 0; variant < VARIANTS; variant += 1) {
    drawMaterial(variant * CELL_W, row * CELL_H, material, palette, variant, row);
  }
}

const outputPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../assets/world/world-materials.png"
);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, encodePng(width, height, pixels));
console.log(`Generated ${outputPath} (${width}x${height})`);

function drawMaterial(startX, startY, material, palette, variant, row) {
  const [base, dark, light, accent] = palette;
  fill(startX, startY, CELL_W, CELL_H, base);
  const seed = (row + 1) * 4271 + variant * 613;

  if (material === "roof") {
    fill(startX, startY, CELL_W, CELL_H, dark);
    for (let y = 0; y < CELL_H; y += 6) {
      const offset = ((y / 6 + variant) % 2) * 5;
      for (let x = -offset; x < CELL_W; x += 10) {
        fill(startX + x, startY + y, 8, 4, base);
        hLine(startX + x + 1, startY + y, 6, light);
        hLine(startX + x, startY + y + 4, 8, dark);
      }
    }
    return;
  }

  if (material === "stone" || material === "ruin") {
    for (let y = 0; y < CELL_H; y += 6) {
      hLine(startX, startY + y, CELL_W, dark);
      const offset = ((y / 6 + variant) % 2) * 8;
      for (let x = offset; x < CELL_W; x += 16) {
        vLine(startX + x, startY + y, Math.min(6, CELL_H - y), dark);
      }
      hLine(startX + 2, startY + y + 2, CELL_W - 4, material === "ruin" ? accent : light);
    }
    if (material === "ruin") {
      for (let index = 0; index < 3; index += 1) {
        const x = 3 + hash(seed, index, 1) % 24;
        const y = 2 + hash(seed, index, 2) % 11;
        setPixel(startX + x, startY + y, dark);
        setPixel(startX + x + 1, startY + y + 1, dark);
      }
    }
    return;
  }

  if (material === "timber") {
    for (let x = 1 + variant; x < CELL_W; x += 8) {
      vLine(startX + x, startY, CELL_H, dark);
      vLine(startX + x + 2, startY, CELL_H, light);
    }
    for (let index = 0; index < 4; index += 1) {
      const x = 3 + hash(seed, index, 3) % 26;
      const y = 2 + hash(seed, index, 4) % 12;
      hLine(startX + x, startY + y, 3, accent);
    }
    return;
  }

  if (material === "planks") {
    for (let y = 0; y < CELL_H; y += 5) {
      hLine(startX, startY + y, CELL_W, dark);
      hLine(startX + 1, startY + y + 1, CELL_W - 2, light);
      const seam = (variant * 7 + y * 3) % CELL_W;
      vLine(startX + seam, startY + y, Math.min(5, CELL_H - y), dark);
    }
    return;
  }

  if (material === "metal") {
    for (let y = 1; y < CELL_H; y += 5) {
      hLine(startX + 2, startY + y, CELL_W - 4, y % 2 ? light : dark);
    }
    for (let x = 5 + variant; x < CELL_W; x += 10) {
      setPixel(startX + x, startY + 3, accent);
      setPixel(startX + x, startY + 11, dark);
    }
  }
}

function fill(x, y, w, h, color) {
  for (let py = Math.max(0, y); py < Math.min(height, y + h); py += 1) {
    for (let px = Math.max(0, x); px < Math.min(width, x + w); px += 1) {
      setPixel(px, py, color);
    }
  }
}

function hLine(x, y, length, color) {
  for (let index = 0; index < length; index += 1) setPixel(x + index, y, color);
}

function vLine(x, y, length, color) {
  for (let index = 0; index < length; index += 1) setPixel(x, y + index, color);
}

function setPixel(x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const value = color.replace("#", "");
  const offset = (y * width + x) * 4;
  pixels[offset] = Number.parseInt(value.slice(0, 2), 16);
  pixels[offset + 1] = Number.parseInt(value.slice(2, 4), 16);
  pixels[offset + 2] = Number.parseInt(value.slice(4, 6), 16);
  pixels[offset + 3] = 255;
}

function hash(seed, x, y) {
  let value = seed ^ Math.imul(x + 11, 374761393) ^ Math.imul(y + 17, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return (value ^ (value >>> 16)) >>> 0;
}

function encodePng(pngWidth, pngHeight, rgba) {
  const scanlines = Buffer.alloc((pngWidth * 4 + 1) * pngHeight);
  for (let y = 0; y < pngHeight; y += 1) {
    const targetOffset = y * (pngWidth * 4 + 1);
    scanlines[targetOffset] = 0;
    rgba.copy(scanlines, targetOffset + 1, y * pngWidth * 4, (y + 1) * pngWidth * 4);
  }
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(pngWidth, 0);
  ihdr.writeUInt32BE(pngHeight, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(scanlines, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

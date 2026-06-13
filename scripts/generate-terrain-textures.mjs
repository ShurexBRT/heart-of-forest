import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CELL_W = 24;
const CELL_H = 12;
const VARIANTS = 4;
const MATERIALS = ["natural", "path", "soil", "planks", "stone", "liquid", "special"];

const BIOMES = [
  {
    id: "forest",
    materials: {
      natural: ["#1d4728", "#17351f", "#2f6938", "#84a64e"],
      path: ["#8c744d", "#5d492e", "#b49a68", "#d0bb86"],
      soil: ["#66462f", "#3d291c", "#8f6747", "#b18962"],
      planks: ["#725032", "#3e2a1a", "#9e7449", "#c39963"],
      stone: ["#696b63", "#404540", "#8c9487", "#aeb8a8"],
      liquid: ["#326f70", "#173f49", "#5ca4a0", "#9ed8ca"],
      special: ["#244b2c", "#142c1c", "#67a652", "#d8dd8c"],
    },
  },
  {
    id: "marsh",
    materials: {
      natural: ["#1c493f", "#122f2b", "#34705a", "#72a872"],
      path: ["#6d6745", "#403c29", "#8d865d", "#b3ac78"],
      soil: ["#554536", "#30271f", "#76614b", "#958064"],
      planks: ["#5f4932", "#32281d", "#82674a", "#a88b67"],
      stone: ["#596b65", "#33443f", "#789087", "#a2b8ad"],
      liquid: ["#285e60", "#12383e", "#4c9590", "#89cbc0"],
      special: ["#31534a", "#172d2b", "#6c9873", "#c1d690"],
    },
  },
  {
    id: "highlands",
    materials: {
      natural: ["#344636", "#202d24", "#657552", "#a3ad6d"],
      path: ["#8a7754", "#55472f", "#ad9871", "#d0bd91"],
      soil: ["#67513d", "#3f3024", "#8b7056", "#ad9170"],
      planks: ["#715739", "#3e2f20", "#94744f", "#ba976b"],
      stone: ["#737475", "#45484a", "#9b9fa0", "#c1c5c5"],
      liquid: ["#3d7374", "#23484d", "#68a1a0", "#a6cfca"],
      special: ["#4f6045", "#293629", "#8c9d65", "#e2d998"],
    },
  },
  {
    id: "ember",
    materials: {
      natural: ["#4d3029", "#291a18", "#744535", "#a96648"],
      path: ["#665047", "#362d2a", "#8c7163", "#b1907e"],
      soil: ["#51362d", "#2b1f1b", "#754b3c", "#9d6850"],
      planks: ["#60402e", "#302118", "#85563d", "#ad7552"],
      stone: ["#5b4b48", "#302725", "#806b66", "#aa8e87"],
      liquid: ["#963f2b", "#4c1d19", "#e06d38", "#ffc264"],
      special: ["#603229", "#2d1715", "#ba5938", "#ffb25d"],
    },
  },
  {
    id: "frost",
    materials: {
      natural: ["#d4e2eb", "#94aaba", "#edf6fa", "#ffffff"],
      path: ["#aebdc9", "#73899a", "#d5e1e8", "#f2f8fb"],
      soil: ["#66717a", "#39444e", "#8d9aa4", "#b8c5cd"],
      planks: ["#7d7166", "#4c423a", "#a89a8d", "#d1c2b4"],
      stone: ["#71889b", "#435d72", "#9db7c9", "#d7ecf4"],
      liquid: ["#83b7d1", "#4d7895", "#b8dceb", "#eefbff"],
      special: ["#91bad0", "#4e758e", "#c9e9f5", "#ffffff"],
    },
  },
  {
    id: "blight",
    materials: {
      natural: ["#3b2425", "#1b1113", "#633534", "#945044"],
      path: ["#55413e", "#2d2525", "#76605b", "#9d837a"],
      soil: ["#442a29", "#211617", "#633c38", "#89584d"],
      planks: ["#513730", "#281f1d", "#714b3e", "#986956"],
      stone: ["#665858", "#393234", "#8d7975", "#b29a93"],
      liquid: ["#513735", "#261d22", "#7c4b45", "#b26d58"],
      special: ["#472526", "#1e1114", "#8b4138", "#df7657"],
    },
  },
  {
    id: "ancient",
    materials: {
      natural: ["#392f40", "#1d1823", "#5f4d6b", "#9678ae"],
      path: ["#665a70", "#3d3545", "#8d7d99", "#b8a7c4"],
      soil: ["#51413e", "#2b2426", "#735d55", "#9b7c6d"],
      planks: ["#655246", "#382e29", "#8c7462", "#b39a82"],
      stone: ["#655e70", "#3c3645", "#91879c", "#c0b4ca"],
      liquid: ["#4e557d", "#282b4b", "#7d85bc", "#c1c9ff"],
      special: ["#4c3b58", "#261e31", "#9c78bd", "#f0cf7d"],
    },
  },
];

const width = CELL_W * VARIANTS * MATERIALS.length;
const height = CELL_H * BIOMES.length;
const pixels = Buffer.alloc(width * height * 4);

for (let row = 0; row < BIOMES.length; row += 1) {
  const biome = BIOMES[row];
  for (let materialIndex = 0; materialIndex < MATERIALS.length; materialIndex += 1) {
    const material = MATERIALS[materialIndex];
    for (let variant = 0; variant < VARIANTS; variant += 1) {
      drawTexture(
        materialIndex * VARIANTS * CELL_W + variant * CELL_W,
        row * CELL_H,
        biome.materials[material],
        material,
        variant,
        row
      );
    }
  }
}

const outputPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../assets/terrain/biome-terrain.png"
);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, encodePng(width, height, pixels));
console.log(`Generated ${outputPath} (${width}x${height})`);

function drawTexture(startX, startY, palette, material, variant, biomeRow) {
  const [base, dark, light, accent] = palette;
  fill(startX, startY, CELL_W, CELL_H, base);
  const seed = (biomeRow + 1) * 8191 + (variant + 3) * 131 + material.length * 17;

  for (let y = 0; y < CELL_H; y += 1) {
    for (let x = 0; x < CELL_W; x += 1) {
      const noise = hash(seed, x, y) % 31;
      if (noise === 0 || noise === 1) setPixel(startX + x, startY + y, dark);
      if (noise === 2) setPixel(startX + x, startY + y, light);
    }
  }

  if (material === "natural") {
    for (let index = 0; index < 5; index += 1) {
      const x = 2 + hash(seed, index, 4) % 20;
      const y = 2 + hash(seed, index, 9) % 8;
      setPixel(startX + x, startY + y, accent);
      if (index % 2 === 0) setPixel(startX + x + 1, startY + y - 1, light);
    }
  } else if (material === "path" || material === "soil") {
    for (let index = 0; index < 4; index += 1) {
      const x = 1 + hash(seed, index, 12) % 18;
      const y = 2 + hash(seed, index, 18) % 8;
      hLine(startX + x, startY + y, 3 + index % 3, index % 2 ? dark : light);
    }
  } else if (material === "planks") {
    for (let y = 1 + variant % 2; y < CELL_H; y += 4) {
      hLine(startX, startY + y, CELL_W, y % 8 === 1 ? light : dark);
    }
    for (let x = 5 + variant; x < CELL_W; x += 8) {
      setPixel(startX + x, startY + 2, dark);
      setPixel(startX + x, startY + 7, accent);
    }
  } else if (material === "stone") {
    hLine(startX, startY + 4, CELL_W, dark);
    hLine(startX, startY + 9, CELL_W, dark);
    for (let x = 4 + variant; x < CELL_W; x += 8) {
      vLine(startX + x, startY, 4, dark);
      vLine(startX + ((x + 4) % CELL_W), startY + 5, 4, dark);
    }
    hLine(startX + 2, startY + 2, 5, light);
  } else if (material === "liquid") {
    for (let y = 2 + variant % 2; y < CELL_H; y += 4) {
      const offset = (variant * 3 + y) % 6;
      hLine(startX + offset, startY + y, 7, light);
      hLine(startX + 13 + (offset % 3), startY + y + 1, 6, accent);
    }
  } else if (material === "special") {
    for (let index = 0; index < 6; index += 1) {
      const x = 2 + hash(seed, index, 23) % 20;
      const y = 1 + hash(seed, index, 29) % 10;
      setPixel(startX + x, startY + y, index % 2 ? accent : light);
      if (index % 3 === 0) setPixel(startX + x + 1, startY + y, dark);
    }
  }
}

function fill(x, y, w, h, color) {
  for (let py = y; py < y + h; py += 1) {
    for (let px = x; px < x + w; px += 1) setPixel(px, py, color);
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
  const [r, g, b] = parseColor(color);
  const offset = (y * width + x) * 4;
  pixels[offset] = r;
  pixels[offset + 1] = g;
  pixels[offset + 2] = b;
  pixels[offset + 3] = 255;
}

function parseColor(color) {
  const value = color.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
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

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
      natural: ["#354b2d", "#17251b", "#687b42", "#a8bc68"],
      path: ["#786c52", "#3a372d", "#a99b79", "#d2c89d"],
      soil: ["#584536", "#2c241e", "#846a50", "#b5966c"],
      planks: ["#60462e", "#2d2118", "#947048", "#c49c64"],
      stone: ["#555a50", "#292f2b", "#899080", "#b7bca4"],
      liquid: ["#205b58", "#102f35", "#4b9489", "#9dd8c2"],
      special: ["#293b25", "#111d14", "#759448", "#d6e27f"],
    },
  },
  {
    id: "marsh",
    materials: {
      natural: ["#263d37", "#111f20", "#496658", "#89a97e"],
      path: ["#554f45", "#29282a", "#81786c", "#aca28d"],
      soil: ["#443936", "#242126", "#665652", "#8d7770"],
      planks: ["#51412f", "#28231c", "#78644a", "#a18965"],
      stone: ["#465954", "#263735", "#70847d", "#9fb1a8"],
      liquid: ["#173f50", "#0a2431", "#2d7180", "#78c8ce"],
      special: ["#223c3c", "#0e232a", "#4f9293", "#75e3f2"],
    },
  },
  {
    id: "highlands",
    materials: {
      natural: ["#45513a", "#222b22", "#758458", "#aabd72"],
      path: ["#77705d", "#3d3d36", "#a29b82", "#c9c0a0"],
      soil: ["#584b3b", "#302920", "#82715a", "#a89570"],
      planks: ["#5e4830", "#2e241b", "#8b6c46", "#b8915d"],
      stone: ["#5b6058", "#303630", "#858b7e", "#b4b9a7"],
      liquid: ["#235c5c", "#11353c", "#4e8f87", "#9bd0bc"],
      special: ["#39452f", "#1d261c", "#7d954e", "#d3e17a"],
    },
  },
  {
    id: "ember",
    materials: {
      natural: ["#302825", "#151416", "#5a3b32", "#c0522f"],
      path: ["#51443f", "#29262a", "#80665b", "#b38b73"],
      soil: ["#3f302d", "#201c1d", "#67483e", "#9a6650"],
      planks: ["#503326", "#251b18", "#80503a", "#b2734e"],
      stone: ["#3d3d40", "#1c2024", "#626268", "#99969a"],
      liquid: ["#a42f13", "#46120d", "#ef5a1f", "#ffbd45"],
      special: ["#342320", "#160f12", "#a8321d", "#ff7a25"],
    },
  },
  {
    id: "frost",
    materials: {
      natural: ["#c9d9e5", "#7891a6", "#edf6fb", "#ffffff"],
      path: ["#9eafbe", "#61778b", "#d0dde7", "#f3f9fd"],
      soil: ["#596976", "#303f4b", "#8295a4", "#b6c7d3"],
      planks: ["#655e59", "#36343a", "#938a83", "#c4bbb2"],
      stone: ["#647b91", "#344d65", "#9bb3c7", "#e0f0fa"],
      liquid: ["#5a92b2", "#315f80", "#9ecbe0", "#eefbff"],
      special: ["#729eb9", "#375f7c", "#bde2f2", "#ffffff"],
    },
  },
  {
    id: "blight",
    materials: {
      natural: ["#36262d", "#17131b", "#654052", "#b75bc1"],
      path: ["#51444d", "#29262d", "#786472", "#a88a9e"],
      soil: ["#432f36", "#211a21", "#684554", "#925d72"],
      planks: ["#49332f", "#241d1e", "#704c45", "#9b685c"],
      stone: ["#514d57", "#292b32", "#7c7280", "#aaa0ad"],
      liquid: ["#392545", "#171527", "#673d7d", "#b16cce"],
      special: ["#2b2028", "#120f17", "#573047", "#b74fc4"],
    },
  },
  {
    id: "ancient",
    materials: {
      natural: ["#4a4548", "#242329", "#756b69", "#d0af61"],
      path: ["#625b5c", "#34343a", "#8c8380", "#c2b7a5"],
      soil: ["#51433b", "#2a2525", "#786252", "#a8896c"],
      planks: ["#584737", "#2c2521", "#826b50", "#b09268"],
      stone: ["#58565e", "#2d3038", "#85818a", "#c1b9b2"],
      liquid: ["#31495e", "#18283b", "#597b91", "#9fd3d5"],
      special: ["#43384d", "#211b2a", "#8e68a5", "#edc765"],
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

  for (let index = 0; index < 4; index += 1) {
    const x = hash(seed, index, 3) % CELL_W;
    const y = hash(seed, index, 7) % CELL_H;
    const clusterColor = index % 4 === 0 ? light : dark;
    stampCluster(startX + x, startY + y, clusterColor, hash(seed, index, 11) % 3);
  }

  if (material === "natural") {
    for (let index = 0; index < 2; index += 1) {
      const x = 2 + hash(seed, index, 4) % 20;
      const y = 2 + hash(seed, index, 9) % 8;
      stampCluster(startX + x, startY + y, accent, index % 3);
      if ((index + variant) % 2 === 0) setPixel(startX + x + 1, startY + y - 2, light);
    }
  } else if (material === "path" || material === "soil") {
    for (let index = 0; index < 3; index += 1) {
      const x = 1 + hash(seed, index, 12) % 18;
      const y = 2 + hash(seed, index, 18) % 8;
      hLine(startX + x, startY + y, 2 + index % 4, index % 3 ? dark : light);
      if (index % 2 === 0) setPixel(startX + x + 1, startY + y - 1, accent);
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
    fill(startX, startY, CELL_W, CELL_H, dark);
    for (let index = 0; index < 4; index += 1) {
      const x = -2 + hash(seed, index, 21) % 23;
      const y = hash(seed, index, 25) % 10;
      const w = 4 + hash(seed, index, 27) % 6;
      const h = 3 + hash(seed, index, 31) % 4;
      fill(startX + x, startY + y, w, h, base);
      hLine(startX + x + 1, startY + y, Math.max(1, w - 2), index % 3 ? light : accent);
    }
  } else if (material === "liquid") {
    for (let y = 1 + variant % 2; y < CELL_H; y += 3) {
      const offset = (variant * 3 + y) % 6;
      hLine(startX + offset, startY + y, 5 + (y % 3), light);
      hLine(startX + 12 + (offset % 4), startY + y + 1, 5, accent);
      setPixel(startX + offset - 1, startY + y + 1, dark);
    }
  } else if (material === "special") {
    for (let index = 0; index < 7; index += 1) {
      const x = 2 + hash(seed, index, 23) % 20;
      const y = 1 + hash(seed, index, 29) % 10;
      stampCluster(startX + x, startY + y, index % 2 ? accent : light, index % 3);
    }
    if (biomeRow === 3 || biomeRow === 5) {
      drawCrack(startX + 2 + variant * 3, startY + 1, accent);
    } else if (biomeRow === 6) {
      drawRune(startX + 12, startY + 6, accent);
    }
  }
}

function stampCluster(x, y, color, shape = 0) {
  setPixel(x, y, color);
  setPixel(x + 1, y, color);
  if (shape !== 1) setPixel(x, y + 1, color);
  if (shape === 2) {
    setPixel(x - 1, y + 1, color);
    setPixel(x + 1, y - 1, color);
  }
}

function drawCrack(x, y, color) {
  for (let step = 0; step < 7; step += 1) {
    setPixel(x + step * 3, y + (step % 2) * 2 + Math.floor(step / 3), color);
    if (step % 2 === 0) setPixel(x + step * 3 + 1, y + (step % 2) * 2 + Math.floor(step / 3), color);
  }
}

function drawRune(x, y, color) {
  hLine(x - 4, y, 9, color);
  vLine(x, y - 4, 9, color);
  setPixel(x - 3, y - 2, color);
  setPixel(x + 3, y + 2, color);
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

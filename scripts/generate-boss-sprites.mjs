import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CELL = 128;
const FACINGS = ["down", "right", "left", "up"];
const BOSSES = [
  {
    id: "rootwarden",
    name: "Rootwarden",
    role: "Heartwood guardian",
    palette: {
      outline: "#171411",
      dark: "#3a271c",
      base: "#68442b",
      mid: "#875d35",
      light: "#bd9656",
      glow: "#a8e06d",
      glow2: "#e1cf73",
    },
  },
  {
    id: "bog_matron",
    name: "Bog Matron",
    role: "Stillwater oathkeeper",
    palette: {
      outline: "#10201e",
      dark: "#25413a",
      base: "#486c5b",
      mid: "#659077",
      light: "#a6c89b",
      glow: "#8de5df",
      glow2: "#d7f8ef",
    },
  },
  {
    id: "cinder_warden",
    name: "Cinder Warden",
    role: "Ember Hollow furnace knight",
    palette: {
      outline: "#1c1110",
      dark: "#3a2420",
      base: "#6a3c2b",
      mid: "#8d5034",
      light: "#c07448",
      glow: "#ff9a57",
      glow2: "#ffd17a",
    },
  },
  {
    id: "veil_seraph",
    name: "Veil Seraph",
    role: "Frostpine sealed herald",
    palette: {
      outline: "#172530",
      dark: "#456073",
      base: "#7fa8c5",
      mid: "#a8d5ed",
      light: "#effbff",
      glow: "#b9ebff",
      glow2: "#f8fdff",
    },
  },
  {
    id: "elder_hollow",
    name: "Elder Hollow",
    role: "Scarroot single will",
    palette: {
      outline: "#160f16",
      dark: "#2e1b28",
      base: "#553247",
      mid: "#7b475c",
      light: "#b86f7b",
      glow: "#c98cff",
      glow2: "#efb866",
    },
  },
  {
    id: "rootbound_custodian",
    name: "Rootbound Custodian",
    role: "Sunken Reliquary vault keeper",
    palette: {
      outline: "#15151a",
      dark: "#34333d",
      base: "#5b565c",
      mid: "#8b8070",
      light: "#c7b98e",
      glow: "#d6b7ff",
      glow2: "#f1d58e",
    },
  },
  {
    id: "starwoken_sentinel",
    name: "Starwoken Sentinel",
    role: "Rootlight archive judge",
    palette: {
      outline: "#151827",
      dark: "#333951",
      base: "#646a88",
      mid: "#8ea0c8",
      light: "#d8e1ff",
      glow: "#e4d8ff",
      glow2: "#ffe8a7",
    },
  },
];

const width = CELL * FACINGS.length;
const height = CELL * BOSSES.length;
const pixels = Buffer.alloc(width * height * 4);

BOSSES.forEach((boss, row) => {
  FACINGS.forEach((facing, column) => {
    drawBossFrame(createPainter(column, row, facing), boss, facing);
  });
});

const root = dirname(fileURLToPath(import.meta.url));
const outputDir = resolve(root, "../assets/bosses");
mkdirSync(outputDir, { recursive: true });
writeFileSync(resolve(outputDir, "boss-v1-directional-game-sheet.png"), encodePng(width, height, pixels));
writeFileSync(
  resolve(outputDir, "boss-v1-directional-metadata.json"),
  `${JSON.stringify(
    {
      cellSize: CELL,
      columns: FACINGS,
      rows: BOSSES.map((boss) => boss.id),
      bosses: BOSSES.map(({ id, name, role }) => ({ id, name, role })),
      anchor: "bottom-center",
      generatedBy: "scripts/generate-boss-sprites.mjs",
    },
    null,
    2
  )}\n`
);
console.log(`Generated ${resolve(outputDir, "boss-v1-directional-game-sheet.png")} (${width}x${height})`);

function drawBossFrame(p, boss, facing) {
  const front = facing === "down";
  const back = facing === "up";
  const profile = facing === "right" || facing === "left";

  switch (boss.id) {
    case "rootwarden":
      drawRootwarden(p, boss.palette, { front, back, profile });
      return;
    case "bog_matron":
      drawBogMatron(p, boss.palette, { front, back, profile });
      return;
    case "cinder_warden":
      drawCinderWarden(p, boss.palette, { front, back, profile });
      return;
    case "veil_seraph":
      drawVeilSeraph(p, boss.palette, { front, back, profile });
      return;
    case "elder_hollow":
      drawElderHollow(p, boss.palette, { front, back, profile });
      return;
    case "rootbound_custodian":
      drawRootboundCustodian(p, boss.palette, { front, back, profile });
      return;
    case "starwoken_sentinel":
      drawStarwokenSentinel(p, boss.palette, { front, back, profile });
      return;
    default:
      drawRootwarden(p, boss.palette, { front, back, profile });
  }
}

function drawRootwarden(p, c, view) {
  const headX = view.profile ? 70 : 64;
  drawRoots(p, c, 28, 94, 99, 118);
  p.line(35, 108, 45, 87, c.outline, 8);
  p.line(89, 108, 80, 87, c.outline, 8);
  p.line(36, 107, 45, 88, c.dark, 5);
  p.line(89, 107, 79, 88, c.dark, 5);
  p.ellipse(64, 76, 33, 34, c.outline);
  p.ellipse(64, 75, 28, 31, c.base);
  p.rect(44, 56, 39, 40, c.mid);
  p.rect(50, 62, 27, 32, c.dark);
  p.rect(55, 66, 17, 22, c.base);
  p.line(36, 69, 18, view.back ? 77 : 84, c.outline, 8);
  p.line(92, 69, 110, view.back ? 77 : 84, c.outline, 8);
  p.line(38, 69, 19, view.back ? 77 : 84, c.mid, 5);
  p.line(90, 69, 109, view.back ? 77 : 84, c.mid, 5);
  p.ellipse(headX, 48, 24, 19, c.outline);
  p.ellipse(headX, 48, 20, 16, c.mid);
  p.rect(headX - 13, 45, 26, 13, c.dark);
  drawAntlers(p, headX, 37, c.dark, c.light, c.glow, view.profile ? 0.72 : 1);
  if (!view.back) {
    p.rect(headX - 8, 50, 5, 4, c.glow2);
    p.rect(headX + (view.profile ? 3 : 5), 50, 5, 4, c.glow2);
    p.rect(headX - 5, 62, 11, 3, c.glow);
  } else {
    p.rect(headX - 11, 42, 23, 4, c.light);
    p.rect(headX - 4, 58, 9, 11, c.dark);
  }
  scatterLeaves(p, c.glow, c.glow2, [
    [39, 59],
    [88, 58],
    [50, 89],
    [76, 88],
    [21, 82],
    [108, 82],
  ]);
}

function drawBogMatron(p, c, view) {
  const headX = view.profile ? 69 : 64;
  p.ellipse(64, 101, 42, 17, c.outline);
  p.ellipse(64, 100, 38, 14, c.dark);
  p.line(33, 112, 47, 92, c.outline, 7);
  p.line(94, 112, 80, 92, c.outline, 7);
  p.line(33, 111, 47, 92, c.base, 4);
  p.line(94, 111, 80, 92, c.base, 4);
  p.ellipse(64, 78, 33, 34, c.outline);
  p.ellipse(64, 78, 29, 31, c.base);
  p.rect(39, 80, 50, 18, c.mid);
  p.rect(45, 67, 38, 29, c.dark);
  p.line(37, 73, 18, 63, c.outline, 7);
  p.line(91, 73, 111, 64, c.outline, 7);
  p.line(38, 73, 19, 63, c.light, 4);
  p.line(90, 73, 110, 64, c.light, 4);
  p.ellipse(headX, 49, 22, 18, c.outline);
  p.ellipse(headX, 49, 18, 15, c.mid);
  p.rect(headX - 11, 46, 22, 10, c.light);
  for (let x = 45; x <= 84; x += 8) {
    p.line(x, 39, x - 4, 25, c.outline, 3);
    p.line(x, 39, x - 4, 25, c.light, 1);
    p.rect(x - 7, 24, 6, 4, c.glow);
  }
  if (!view.back) {
    p.rect(headX - 7, 49, 4, 4, c.outline);
    p.rect(headX + (view.profile ? 2 : 5), 49, 4, 4, c.outline);
    p.rect(headX - 6, 60, 13, 3, c.glow);
  } else {
    p.rect(headX - 12, 42, 24, 4, c.dark);
  }
  p.line(28, 96, 99, 96, c.glow, 2);
  p.line(36, 103, 89, 103, c.glow2, 2);
  scatterLeaves(p, c.glow, c.light, [
    [27, 63],
    [104, 64],
    [44, 98],
    [84, 98],
    [57, 72],
    [72, 73],
  ]);
}

function drawCinderWarden(p, c, view) {
  const headX = view.profile ? 70 : 64;
  p.rect(37, 92, 17, 25, c.outline);
  p.rect(74, 92, 17, 25, c.outline);
  p.rect(40, 93, 13, 22, c.dark);
  p.rect(75, 93, 13, 22, c.dark);
  p.ellipse(36, 68, 20, 18, c.outline);
  p.ellipse(92, 68, 20, 18, c.outline);
  p.ellipse(36, 68, 16, 14, c.mid);
  p.ellipse(92, 68, 16, 14, c.mid);
  p.ellipse(64, 77, 34, 35, c.outline);
  p.ellipse(64, 77, 29, 31, c.dark);
  p.rect(45, 57, 38, 42, c.base);
  p.rect(52, 69, 24, 20, c.outline);
  p.rect(56, 72, 16, 14, c.glow);
  p.rect(59, 74, 10, 9, c.glow2);
  p.line(25, 79, 15, 91, c.outline, 9);
  p.line(103, 79, 113, 91, c.outline, 9);
  p.line(25, 79, 15, 91, c.mid, 5);
  p.line(103, 79, 113, 91, c.mid, 5);
  p.ellipse(headX, 45, 23, 18, c.outline);
  p.ellipse(headX, 45, 19, 14, c.base);
  p.rect(headX - 12, 43, 24, 12, c.dark);
  p.line(headX - 14, 37, headX - 27, 27, c.outline, 4);
  p.line(headX + 14, 37, headX + 27, 27, c.outline, 4);
  p.line(headX - 14, 37, headX - 27, 27, c.glow, 2);
  p.line(headX + 14, 37, headX + 27, 27, c.glow, 2);
  if (!view.back) {
    p.rect(headX - 8, 47, 5, 4, c.glow2);
    p.rect(headX + (view.profile ? 3 : 5), 47, 5, 4, c.glow2);
  }
  for (const [x, y] of [
    [51, 64],
    [76, 64],
    [44, 97],
    [83, 96],
    [35, 68],
    [93, 68],
  ]) {
    p.rect(x, y, 4, 3, c.glow);
    p.rect(x + 1, y + 1, 2, 2, c.glow2);
  }
}

function drawVeilSeraph(p, c, view) {
  const headX = view.profile ? 69 : 64;
  p.ellipse(42, 67, 23, 42, c.outline);
  p.ellipse(86, 67, 23, 42, c.outline);
  p.ellipse(43, 68, 18, 36, c.base);
  p.ellipse(85, 68, 18, 36, c.base);
  p.line(31, 55, 15, 85, c.glow, 3);
  p.line(97, 55, 113, 85, c.glow, 3);
  p.ellipse(64, 78, 23, 39, c.outline);
  p.ellipse(64, 77, 19, 35, c.mid);
  p.rect(53, 62, 22, 45, c.light);
  p.line(53, 101, 44, 116, c.outline, 5);
  p.line(75, 101, 84, 116, c.outline, 5);
  p.line(53, 101, 44, 116, c.glow, 2);
  p.line(75, 101, 84, 116, c.glow, 2);
  p.ellipse(headX, 45, 20, 17, c.outline);
  p.ellipse(headX, 45, 16, 14, c.light);
  p.rect(headX - 13, 33, 26, 4, c.glow2);
  p.rect(headX - 8, 29, 16, 3, c.glow);
  if (!view.back) {
    p.rect(headX - 6, 46, 4, 3, c.outline);
    p.rect(headX + (view.profile ? 2 : 4), 46, 4, 3, c.outline);
    p.rect(headX - 6, 55, 12, 2, c.glow);
  } else {
    p.rect(headX - 9, 46, 18, 4, c.base);
  }
  drawCrystalCluster(p, c.glow, c.glow2, [
    [34, 43],
    [95, 43],
    [45, 94],
    [83, 94],
    [64, 113],
  ]);
}

function drawElderHollow(p, c, view) {
  const headX = view.profile ? 69 : 64;
  drawRoots(p, c, 24, 95, 104, 118);
  p.ellipse(64, 80, 35, 36, c.outline);
  p.ellipse(64, 80, 30, 32, c.dark);
  p.rect(43, 59, 41, 42, c.base);
  p.rect(52, 67, 25, 27, c.mid);
  p.rect(57, 72, 15, 18, c.outline);
  p.rect(60, 75, 9, 12, c.glow);
  p.line(36, 70, 17, 73, c.outline, 8);
  p.line(92, 70, 111, 73, c.outline, 8);
  p.line(37, 70, 18, 73, c.mid, 5);
  p.line(91, 70, 110, 73, c.mid, 5);
  p.ellipse(headX, 48, 24, 18, c.outline);
  p.ellipse(headX, 48, 19, 14, c.base);
  p.rect(headX - 13, 45, 26, 11, c.dark);
  p.line(headX - 10, 36, headX - 27, 21, c.outline, 5);
  p.line(headX + 10, 36, headX + 27, 21, c.outline, 5);
  p.line(headX - 18, 28, headX - 31, 34, c.outline, 4);
  p.line(headX + 18, 28, headX + 31, 34, c.outline, 4);
  p.line(headX - 10, 36, headX - 27, 21, c.glow, 2);
  p.line(headX + 10, 36, headX + 27, 21, c.glow, 2);
  if (!view.back) {
    p.rect(headX - 8, 49, 5, 4, c.glow2);
    p.rect(headX + (view.profile ? 3 : 5), 49, 5, 4, c.glow2);
  }
  p.line(49, 62, 32, 104, c.glow, 2);
  p.line(77, 62, 96, 104, c.glow2, 2);
  scatterLeaves(p, c.glow, c.glow2, [
    [22, 75],
    [106, 75],
    [54, 84],
    [72, 86],
    [31, 108],
    [98, 108],
  ]);
}

function drawRootboundCustodian(p, c, view) {
  const headX = view.profile ? 69 : 64;
  p.rect(38, 90, 15, 27, c.outline);
  p.rect(75, 90, 15, 27, c.outline);
  p.rect(40, 91, 11, 23, c.dark);
  p.rect(77, 91, 11, 23, c.dark);
  p.rect(35, 54, 58, 49, c.outline);
  p.rect(40, 58, 48, 41, c.base);
  p.rect(45, 64, 38, 29, c.mid);
  p.rect(53, 70, 22, 17, c.outline);
  p.rect(57, 73, 14, 11, c.glow2);
  p.rect(61, 76, 6, 5, c.glow);
  p.rect(23, 61, 22, 20, c.outline);
  p.rect(83, 61, 22, 20, c.outline);
  p.rect(27, 64, 16, 14, c.dark);
  p.rect(85, 64, 16, 14, c.dark);
  p.line(24, 82, 14, 99, c.mid, 5);
  p.line(104, 82, 114, 99, c.mid, 5);
  p.rect(headX - 20, 38, 40, 25, c.outline);
  p.rect(headX - 15, 41, 30, 18, c.base);
  p.rect(headX - 9, 46, 18, 8, c.dark);
  if (!view.back) {
    p.rect(headX - 7, 49, 4, 3, c.glow2);
    p.rect(headX + (view.profile ? 2 : 5), 49, 4, 3, c.glow2);
  }
  p.line(37, 57, 22, 41, c.glow, 2);
  p.line(91, 57, 106, 41, c.glow, 2);
  p.line(47, 96, 82, 61, c.light, 2);
  p.line(81, 96, 47, 61, c.light, 2);
}

function drawStarwokenSentinel(p, c, view) {
  const headX = view.profile ? 69 : 64;
  p.line(44, 116, 53, 91, c.outline, 6);
  p.line(84, 116, 75, 91, c.outline, 6);
  p.line(44, 116, 53, 91, c.dark, 3);
  p.line(84, 116, 75, 91, c.dark, 3);
  p.ellipse(64, 76, 27, 38, c.outline);
  p.ellipse(64, 76, 22, 34, c.base);
  p.diamond(64, 78, 18, 23, c.mid);
  p.diamond(64, 78, 10, 14, c.glow2);
  p.diamond(64, 78, 5, 8, c.glow);
  p.line(39, 65, 20, 45, c.outline, 5);
  p.line(89, 65, 108, 45, c.outline, 5);
  p.line(39, 65, 20, 45, c.light, 2);
  p.line(89, 65, 108, 45, c.light, 2);
  p.ellipse(headX, 43, 20, 17, c.outline);
  p.ellipse(headX, 43, 16, 14, c.mid);
  p.diamond(headX, 42, 9, 9, c.light);
  if (!view.back) {
    p.rect(headX - 6, 45, 4, 3, c.outline);
    p.rect(headX + (view.profile ? 2 : 4), 45, 4, 3, c.outline);
  }
  drawHaloShards(p, headX, 31, c.glow, c.glow2);
  drawCrystalCluster(p, c.glow, c.glow2, [
    [29, 50],
    [99, 50],
    [43, 102],
    [84, 102],
    [64, 113],
  ]);
}

function drawAntlers(p, cx, y, dark, light, glow, scale) {
  const reach = Math.round(19 * scale);
  p.line(cx - 8, y + 4, cx - reach, y - 15, dark, 4);
  p.line(cx + 8, y + 4, cx + reach, y - 15, dark, 4);
  p.line(cx - reach + 4, y - 10, cx - reach - 7, y - 17, dark, 3);
  p.line(cx + reach - 4, y - 10, cx + reach + 7, y - 17, dark, 3);
  p.line(cx - 8, y + 4, cx - reach, y - 15, light, 2);
  p.line(cx + 8, y + 4, cx + reach, y - 15, light, 2);
  p.rect(cx - 2, y - 20, 4, 5, glow);
}

function drawRoots(p, c, leftX, topY, rightX, bottomY) {
  p.line(leftX, bottomY, 47, topY, c.outline, 6);
  p.line(rightX, bottomY, 81, topY, c.outline, 6);
  p.line(leftX, bottomY, 47, topY, c.dark, 3);
  p.line(rightX, bottomY, 81, topY, c.dark, 3);
  p.line(leftX - 8, bottomY - 4, leftX + 18, bottomY - 2, c.dark, 3);
  p.line(rightX + 8, bottomY - 4, rightX - 18, bottomY - 2, c.dark, 3);
}

function scatterLeaves(p, color, light, points) {
  points.forEach(([x, y], index) => {
    p.rect(x, y, 5, 3, index % 2 ? color : light);
    p.rect(x + 2, y - 2, 3, 2, color);
  });
}

function drawCrystalCluster(p, color, light, points) {
  points.forEach(([x, y], index) => {
    p.diamond(x, y, 4 + (index % 2), 8, index % 2 ? color : light);
    p.rect(x - 1, y - 4, 2, 3, light);
  });
}

function drawHaloShards(p, cx, y, color, light) {
  p.rect(cx - 20, y, 40, 3, color);
  p.rect(cx - 13, y - 6, 7, 7, light);
  p.rect(cx + 6, y - 6, 7, 7, light);
  p.diamond(cx, y - 9, 5, 7, color);
}

function createPainter(column, row, facing) {
  const ox = column * CELL;
  const oy = row * CELL;
  const mirror = facing === "left";

  const tx = (x, w = 1) => ox + (mirror ? CELL - Math.round(x) - Math.round(w) : Math.round(x));
  const ty = (y) => oy + Math.round(y);
  const px = (x) => ox + (mirror ? CELL - Math.round(x) : Math.round(x));
  const py = (y) => oy + Math.round(y);

  return {
    rect(x, y, w, h, color, alpha = 255) {
      fillRect(tx(x, w), ty(y), Math.round(w), Math.round(h), color, alpha);
    },
    ellipse(cx, cy, rx, ry, color, alpha = 255) {
      fillEllipse(px(cx), py(cy), Math.round(rx), Math.round(ry), color, alpha);
    },
    diamond(cx, cy, rx, ry, color, alpha = 255) {
      fillDiamond(px(cx), py(cy), Math.round(rx), Math.round(ry), color, alpha);
    },
    line(x1, y1, x2, y2, color, thickness = 1, alpha = 255) {
      drawLine(px(x1), py(y1), px(x2), py(y2), color, Math.round(thickness), alpha);
    },
  };
}

function fillRect(x, y, w, h, color, alpha = 255) {
  for (let py = y; py < y + h; py += 1) {
    for (let px = x; px < x + w; px += 1) {
      setPixel(px, py, color, alpha);
    }
  }
}

function fillEllipse(cx, cy, rx, ry, color, alpha = 255) {
  for (let y = -ry; y <= ry; y += 1) {
    for (let x = -rx; x <= rx; x += 1) {
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) {
        setPixel(cx + x, cy + y, color, alpha);
      }
    }
  }
}

function fillDiamond(cx, cy, rx, ry, color, alpha = 255) {
  for (let y = -ry; y <= ry; y += 1) {
    const span = Math.round(rx * (1 - Math.abs(y) / Math.max(1, ry)));
    for (let x = -span; x <= span; x += 1) {
      setPixel(cx + x, cy + y, color, alpha);
    }
  }
}

function drawLine(x1, y1, x2, y2, color, thickness = 1, alpha = 255) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const steps = Math.max(Math.abs(dx), Math.abs(dy), 1);
  const radius = Math.max(0, Math.floor(thickness / 2));
  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const x = Math.round(x1 + dx * t);
    const y = Math.round(y1 + dy * t);
    fillRect(x - radius, y - radius, Math.max(1, thickness), Math.max(1, thickness), color, alpha);
  }
}

function setPixel(x, y, color, alpha = 255) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const [r, g, b] = parseColor(color);
  const offset = (y * width + x) * 4;
  pixels[offset] = r;
  pixels[offset + 1] = g;
  pixels[offset + 2] = b;
  pixels[offset + 3] = alpha;
}

function parseColor(color) {
  const clean = color.replace("#", "");
  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16),
  ];
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

const ABILITY_PALETTES = {
  staff: { accent: "#f2d07a", glow: "#80612b", shadow: "#21160f", core: "#fff1b8" },
  bolt: { accent: "#74ddff", glow: "#17536b", shadow: "#0d1b26", core: "#e9fbff" },
  dash: { accent: "#9eeed4", glow: "#21655b", shadow: "#0b1d1c", core: "#e8fff7" },
  root: { accent: "#8ce36d", glow: "#2f682a", shadow: "#0f2113", core: "#ddffd0" },
  pulse: { accent: "#b9f48a", glow: "#386d32", shadow: "#102416", core: "#f2ffcb" },
  heartwood_tempest: { accent: "#efcb6d", glow: "#8a5f1f", shadow: "#27180c", core: "#fff0a0" },
  verdant_nova: { accent: "#70ddf6", glow: "#19687a", shadow: "#0d1f26", core: "#e9fffb" },
  awaken_the_grove: { accent: "#8fe176", glow: "#2e6b32", shadow: "#102515", core: "#ecffd8" },
};

const ITEM_PALETTES = {
  health_potion: { accent: "#df6466", glow: "#6c2027", liquid: "#f05d66", core: "#ffd2c9" },
  greater_health_potion: { accent: "#f18359", glow: "#7a3424", liquid: "#ff8054", core: "#ffe2b0" },
  spirit_tonic: { accent: "#67d5ff", glow: "#174d68", liquid: "#43bfe7", core: "#dff8ff" },
  greater_spirit_tonic: { accent: "#7ce4ff", glow: "#1c6681", liquid: "#5bd5ff", core: "#e9ffff" },
  ward_elixir: { accent: "#d6d67a", glow: "#65602b", liquid: "#d8d57b", core: "#fff6b7" },
  windstep_phial: { accent: "#8be4c3", glow: "#236656", liquid: "#74d7bd", core: "#e8fff7" },
  rejuvenation_draught: { accent: "#9de27d", glow: "#386528", liquid: "#82d86a", core: "#f2ffd4" },
  clarity_phial: { accent: "#b4dbff", glow: "#315a80", liquid: "#91cfff", core: "#eef8ff" },
  groveguard_phial: { accent: "#9ade70", glow: "#315e2a", liquid: "#81d163", core: "#eaffd7" },
  starfire_tonic: { accent: "#f2ba70", glow: "#6d3d38", liquid: "#f78b5e", core: "#fff0b4" },
  barkskin_draught: { accent: "#b98f5a", glow: "#594026", liquid: "#9b7240", core: "#f0dbac" },
  antitoxin_bloom: { accent: "#7fd7cb", glow: "#235f59", liquid: "#65cbc0", core: "#dffffb" },
  emberward_infusion: { accent: "#f39a61", glow: "#743821", liquid: "#f1844f", core: "#ffe1b7" },
  cinderheart_cordial: { accent: "#b9e4ff", glow: "#315e76", liquid: "#8fd4ff", core: "#eefaff" },
  heartcleanse_elixir: { accent: "#c790e7", glow: "#56336d", liquid: "#b976de", core: "#f4dbff" },
  starward_draught: { accent: "#d7ceff", glow: "#4b4a79", liquid: "#aca4ff", core: "#f0edff" },
};

export function getHudAbilityIconId(abilityName, info = {}) {
  if (abilityName === "pulse" && info?.signatureAbility) {
    return info.signatureAbility;
  }
  return abilityName;
}

export function drawHudAbilityIcon(ctx, iconId, x, y, size, options = {}) {
  const palette = ABILITY_PALETTES[iconId] || ABILITY_PALETTES.pulse;
  return drawHudIcon(ctx, iconId, x, y, size, palette, {
    disabled: options.disabled,
    charged: options.charged,
  });
}

export function drawHudItemIcon(ctx, itemId, x, y, size, options = {}) {
  const palette = ITEM_PALETTES[itemId] || inferItemPalette(itemId, options);
  return drawHudIcon(ctx, itemId, x, y, size, palette, {
    disabled: options.disabled,
    item: true,
  });
}

function inferItemPalette(itemId, options = {}) {
  const color = options.color || "#d8e2ec";
  if (String(itemId || "").includes("spirit")) {
    return { accent: color, glow: "#1c5368", liquid: color, core: "#e7fbff" };
  }
  if (String(itemId || "").includes("health")) {
    return { accent: color, glow: "#69232b", liquid: color, core: "#ffe0d8" };
  }
  return { accent: color, glow: "#3c4e35", liquid: color, core: "#f2ffe2" };
}

function drawHudIcon(ctx, iconId, x, y, size, palette, options = {}) {
  const scale = size / 32;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale, scale);
  ctx.globalAlpha *= options.disabled ? 0.54 : 1;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  drawIconPlate(ctx, palette, Boolean(options.charged));

  switch (iconId) {
    case "staff":
      drawStaffIcon(ctx, palette);
      break;
    case "bolt":
      drawBoltIcon(ctx, palette);
      break;
    case "dash":
      drawDashIcon(ctx, palette);
      break;
    case "root":
      drawRootIcon(ctx, palette);
      break;
    case "heartwood_tempest":
      drawTempestIcon(ctx, palette);
      break;
    case "verdant_nova":
      drawNovaIcon(ctx, palette);
      break;
    case "awaken_the_grove":
      drawGroveIcon(ctx, palette);
      break;
    case "pulse":
      drawPulseIcon(ctx, palette);
      break;
    case "health_potion":
    case "greater_health_potion":
      drawPotionIcon(ctx, palette, "health", iconId.startsWith("greater"));
      break;
    case "spirit_tonic":
    case "greater_spirit_tonic":
      drawPotionIcon(ctx, palette, "spirit", iconId.startsWith("greater"));
      break;
    case "ward_elixir":
      drawShieldPhialIcon(ctx, palette);
      break;
    case "windstep_phial":
      drawWindPhialIcon(ctx, palette);
      break;
    case "rejuvenation_draught":
      drawLeafPhialIcon(ctx, palette);
      break;
    case "clarity_phial":
      drawPrismPhialIcon(ctx, palette);
      break;
    case "groveguard_phial":
      drawGroveguardIcon(ctx, palette);
      break;
    case "starfire_tonic":
      drawStarfireIcon(ctx, palette);
      break;
    case "barkskin_draught":
    case "antitoxin_bloom":
    case "emberward_infusion":
    case "cinderheart_cordial":
    case "heartcleanse_elixir":
    case "starward_draught":
      drawPreparationIcon(ctx, palette, iconId);
      break;
    default:
      if (options.item) {
        drawPotionIcon(ctx, palette, "generic", false);
      } else {
        drawPulseIcon(ctx, palette);
      }
      break;
  }

  if (options.disabled) {
    ctx.fillStyle = "rgba(2, 5, 8, 0.44)";
    pr(ctx, -14, -14, 28, 28);
    ctx.strokeStyle = "rgba(148, 158, 164, 0.44)";
    ctx.lineWidth = 1.4;
    line(ctx, -9, 9, 9, -9);
  }

  ctx.restore();
  return true;
}

function drawIconPlate(ctx, palette, charged) {
  const gradient = ctx.createRadialGradient(-3, -5, 2, 0, 0, 19);
  gradient.addColorStop(0, charged ? withAlpha(palette.core, 0.42) : withAlpha(palette.accent, 0.24));
  gradient.addColorStop(0.62, withAlpha(palette.glow, 0.38));
  gradient.addColorStop(1, withAlpha(palette.shadow || "#08110f", 0.96));
  ctx.fillStyle = gradient;
  pr(ctx, -15, -15, 30, 30);
  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  pr(ctx, -12, -12, 24, 4);
  ctx.fillStyle = withAlpha(palette.accent, charged ? 0.55 : 0.28);
  pr(ctx, -14, -14, 4, 4);
  pr(ctx, 10, -14, 4, 4);
  pr(ctx, -14, 10, 4, 4);
  pr(ctx, 10, 10, 4, 4);
  ctx.strokeStyle = withAlpha(palette.accent, charged ? 0.76 : 0.44);
  ctx.lineWidth = 1.2;
  strokeDiamond(ctx, 0, 0, 13);
}

function drawStaffIcon(ctx, palette) {
  ctx.strokeStyle = "#6b4929";
  ctx.lineWidth = 4.2;
  line(ctx, -8, 10, 5, -9);
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 2;
  line(ctx, -8, 10, 5, -9);
  ctx.strokeStyle = palette.core;
  ctx.lineWidth = 1.2;
  line(ctx, -2, 2, 5, -9);
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 2.2;
  circle(ctx, 7, -10, 4.4, false);
  ctx.fillStyle = palette.core;
  circle(ctx, 7, -10, 1.8, true);
  leaf(ctx, -7, 5, -1, 0, "#79d46a");
  leaf(ctx, 0, -3, 1, 0, "#9ee27b");
}

function drawBoltIcon(ctx, palette) {
  ctx.fillStyle = palette.accent;
  path(ctx, [
    [0, -13],
    [9, -2],
    [3, -1],
    [6, 12],
    [-9, 0],
    [-2, -1],
  ]);
  ctx.fillStyle = palette.core;
  path(ctx, [
    [1, -9],
    [5, -2],
    [1, -2],
    [2, 5],
    [-4, 0],
    [0, -1],
  ]);
  spark(ctx, -10, -8, 2, palette.core);
  spark(ctx, 10, 7, 2, palette.accent);
}

function drawDashIcon(ctx, palette) {
  ctx.strokeStyle = withAlpha(palette.accent, 0.52);
  ctx.lineWidth = 2.8;
  line(ctx, -13, -8, 2, -8);
  line(ctx, -15, 0, -2, 0);
  line(ctx, -12, 8, 1, 8);
  ctx.fillStyle = palette.accent;
  path(ctx, [
    [-2, -12],
    [12, 0],
    [-2, 12],
    [2, 3],
    [-7, 3],
    [-3, 0],
    [-7, -3],
    [2, -3],
  ]);
  ctx.fillStyle = palette.core;
  path(ctx, [
    [2, -5],
    [8, 0],
    [2, 5],
    [4, 1],
    [-2, 1],
    [-2, -1],
    [4, -1],
  ]);
}

function drawRootIcon(ctx, palette) {
  ctx.strokeStyle = "#563d24";
  ctx.lineWidth = 3.5;
  branch(ctx);
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 1.7;
  branch(ctx);
  ctx.fillStyle = palette.core;
  circle(ctx, 0, -5, 3.2, true);
  leaf(ctx, -8, -3, -1, 0, "#8ee075");
  leaf(ctx, 8, 2, 1, 0, "#a6ee82");
}

function drawPulseIcon(ctx, palette) {
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 2;
  circle(ctx, 0, 0, 9, false);
  ctx.strokeStyle = withAlpha(palette.core, 0.8);
  ctx.lineWidth = 1.3;
  circle(ctx, 0, 0, 5, false);
  ctx.fillStyle = palette.core;
  leaf(ctx, -3, 0, -1, 0, palette.core);
  leaf(ctx, 3, 0, 1, 0, palette.accent);
  for (let index = 0; index < 8; index += 1) {
    const angle = (Math.PI * 2 * index) / 8;
    const inner = 11;
    const outer = index % 2 === 0 ? 14 : 13;
    line(ctx, Math.cos(angle) * inner, Math.sin(angle) * inner, Math.cos(angle) * outer, Math.sin(angle) * outer);
  }
}

function drawTempestIcon(ctx, palette) {
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 2;
  arc(ctx, 0, 0, 11, -0.9, Math.PI * 1.12);
  arc(ctx, 0, 0, 7, Math.PI * 0.18, Math.PI * 1.8);
  ctx.strokeStyle = "#704526";
  ctx.lineWidth = 3;
  line(ctx, -7, 10, 7, -10);
  ctx.strokeStyle = palette.core;
  ctx.lineWidth = 1.4;
  line(ctx, -7, 10, 7, -10);
  spark(ctx, 10, -8, 2, palette.core);
  spark(ctx, -10, 7, 2, palette.accent);
}

function drawNovaIcon(ctx, palette) {
  ctx.fillStyle = palette.accent;
  path(ctx, [
    [0, -14],
    [4, -4],
    [14, 0],
    [4, 4],
    [0, 14],
    [-4, 4],
    [-14, 0],
    [-4, -4],
  ]);
  ctx.fillStyle = palette.core;
  path(ctx, [
    [0, -8],
    [2, -2],
    [8, 0],
    [2, 2],
    [0, 8],
    [-2, 2],
    [-8, 0],
    [-2, -2],
  ]);
  ctx.strokeStyle = withAlpha("#9cf3ff", 0.88);
  ctx.lineWidth = 1.2;
  circle(ctx, 0, 0, 10, false);
}

function drawGroveIcon(ctx, palette) {
  ctx.strokeStyle = "#5b3f27";
  ctx.lineWidth = 4;
  line(ctx, 0, 10, 0, -3);
  line(ctx, 0, 3, -6, 10);
  line(ctx, 0, 3, 6, 10);
  ctx.fillStyle = palette.accent;
  circle(ctx, -5, -6, 5, true);
  circle(ctx, 1, -10, 6, true);
  circle(ctx, 7, -5, 5, true);
  ctx.fillStyle = palette.core;
  circle(ctx, 1, -8, 3, true);
  ctx.strokeStyle = withAlpha(palette.core, 0.82);
  ctx.lineWidth = 1.2;
  arc(ctx, 0, 0, 13, Math.PI * 0.25, Math.PI * 1.35);
}

function drawPotionIcon(ctx, palette, kind, greater) {
  ctx.fillStyle = "#e8d3aa";
  pr(ctx, -4, -12, 8, 4);
  ctx.fillStyle = greater ? "#e5c66d" : "#8a6444";
  pr(ctx, -5, -10, 10, 3);
  ctx.fillStyle = withAlpha(palette.liquid, 0.95);
  path(ctx, [
    [-8, -7],
    [8, -7],
    [10, 9],
    [6, 13],
    [-6, 13],
    [-10, 9],
  ]);
  ctx.fillStyle = withAlpha(palette.core, 0.42);
  path(ctx, [
    [-5, -4],
    [5, -4],
    [6, 6],
    [-6, 6],
  ]);
  ctx.strokeStyle = withAlpha(palette.accent, 0.95);
  ctx.lineWidth = 1.4;
  polygonStroke(ctx, [
    [-8, -7],
    [8, -7],
    [10, 9],
    [6, 13],
    [-6, 13],
    [-10, 9],
  ]);

  if (kind === "health") {
    ctx.fillStyle = "#fff0de";
    pr(ctx, -1, -1, 2, 7);
    pr(ctx, -4, 2, 8, 2);
  } else if (kind === "spirit") {
    ctx.strokeStyle = "#effcff";
    ctx.lineWidth = 2;
    arc(ctx, 1, 3, 5, Math.PI * 0.45, Math.PI * 1.55);
  } else {
    leaf(ctx, 0, 3, 1, 0, palette.core);
  }

  if (greater) spark(ctx, 8, -9, 2, "#fff1a8");
}

function drawShieldPhialIcon(ctx, palette) {
  drawPotionIcon(ctx, palette, "generic", false);
  ctx.fillStyle = "#fff5ba";
  path(ctx, [
    [0, -1],
    [5, 1],
    [4, 7],
    [0, 10],
    [-4, 7],
    [-5, 1],
  ]);
}

function drawWindPhialIcon(ctx, palette) {
  drawPotionIcon(ctx, palette, "generic", false);
  ctx.strokeStyle = "#eafff7";
  ctx.lineWidth = 1.7;
  arc(ctx, -1, 3, 6, -0.8, Math.PI * 0.8);
  line(ctx, -8, 2, -1, 2);
  line(ctx, -7, 7, 3, 7);
}

function drawLeafPhialIcon(ctx, palette) {
  drawPotionIcon(ctx, palette, "generic", false);
  leaf(ctx, 0, 3, 1, 0, "#f3ffd6");
}

function drawPrismPhialIcon(ctx, palette) {
  drawPotionIcon(ctx, palette, "generic", false);
  ctx.fillStyle = "#f0fbff";
  path(ctx, [
    [0, -2],
    [5, 4],
    [0, 10],
    [-5, 4],
  ]);
}

function drawGroveguardIcon(ctx, palette) {
  drawPotionIcon(ctx, palette, "generic", false);
  ctx.fillStyle = "#f3ffd5";
  leaf(ctx, -2, 4, -1, 0, "#f3ffd5");
  leaf(ctx, 3, 4, 1, 0, "#c8ff9f");
}

function drawStarfireIcon(ctx, palette) {
  drawPotionIcon(ctx, palette, "generic", true);
  spark(ctx, 0, 4, 3, "#fff0a4");
}

function drawPreparationIcon(ctx, palette, itemId) {
  drawPotionIcon(ctx, palette, "generic", false);
  ctx.strokeStyle = "#fff8cf";
  ctx.lineWidth = 1.5;
  if (itemId === "barkskin_draught") {
    ctx.strokeStyle = "#f2d7a8";
    line(ctx, -4, -1, 4, 9);
    line(ctx, 4, -1, -4, 9);
  } else if (itemId === "antitoxin_bloom") {
    ctx.fillStyle = "#eafffb";
    circle(ctx, 0, 4, 4, true);
    ctx.fillStyle = palette.liquid;
    circle(ctx, -3, 2, 2, true);
    circle(ctx, 3, 2, 2, true);
  } else if (itemId === "emberward_infusion") {
    ctx.fillStyle = "#fff0b7";
    path(ctx, [
      [0, -2],
      [4, 5],
      [1, 10],
      [-3, 7],
      [-1, 3],
    ]);
  } else if (itemId === "cinderheart_cordial") {
    ctx.strokeStyle = "#f3fbff";
    line(ctx, 0, -1, 0, 10);
    line(ctx, -4, 3, 4, 3);
    line(ctx, -3, 7, 3, 7);
  } else if (itemId === "heartcleanse_elixir") {
    ctx.fillStyle = "#f6e0ff";
    path(ctx, [
      [0, -2],
      [5, 3],
      [2, 10],
      [-2, 10],
      [-5, 3],
    ]);
  } else {
    spark(ctx, 0, 4, 4, "#f4efff");
  }
}

function branch(ctx) {
  line(ctx, 0, -10, 0, 4);
  curve(ctx, 0, -1, -7, 1, -9, 9);
  curve(ctx, 0, 1, 7, 3, 9, 10);
  curve(ctx, -1, -5, -7, -8, -10, -3);
  curve(ctx, 1, -7, 7, -10, 10, -5);
}

function pr(ctx, x, y, width, height) {
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function curve(ctx, x1, y1, cx, cy, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cx, cy, x2, y2);
  ctx.stroke();
}

function arc(ctx, x, y, radius, start, end) {
  ctx.beginPath();
  ctx.arc(x, y, radius, start, end);
  ctx.stroke();
}

function circle(ctx, x, y, radius, fill) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  if (fill) ctx.fill();
  else ctx.stroke();
}

function path(ctx, points) {
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
}

function polygonStroke(ctx, points) {
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.stroke();
}

function strokeDiamond(ctx, x, y, radius) {
  polygonStroke(ctx, [
    [x, y - radius],
    [x + radius, y],
    [x, y + radius],
    [x - radius, y],
  ]);
}

function leaf(ctx, x, y, dir, rotation, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation + (dir < 0 ? -0.45 : 0.45));
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, 4.8, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function spark(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  pr(ctx, x - 0.5, y - size, 1, size * 2);
  pr(ctx, x - size, y - 0.5, size * 2, 1);
}

function withAlpha(hex, alpha) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const PATH_GROUNDS = new Set(["path", "ashPath", "snowPath"]);
const WATER_GROUNDS = new Set(["water", "ice"]);

export function drawTerrainTile(ctx, options) {
  const {
    x,
    y,
    halfW,
    halfH,
    tile,
    theme,
    sceneStyle,
    tx,
    ty,
    neighbors,
  } = options;
  const visualVariant = getVisualVariant(tile.ground, tile.variant, tx, ty, sceneStyle);
  const palette = getTerrainPalette(tile.ground, visualVariant, theme, sceneStyle);
  const seed = hashTile(tx, ty, tile.variant, sceneStyle);

  drawDiamond(ctx, x, y, halfW, halfH, palette.base);
  drawTerrainFacets(ctx, x, y, halfW, halfH, tile.ground, palette, seed);

  ctx.save();
  clipDiamond(ctx, x, y, halfW - 1, halfH - 1);
  drawMaterialDetails(ctx, x, y, halfW, halfH, tile.ground, palette, seed, tx, ty);
  ctx.restore();

  drawTerrainEdges(ctx, x, y, halfW, halfH, tile.ground, palette, neighbors);
  drawTerrainOverlay(ctx, x, y, tile.overlay, palette, seed);
}

export function getTerrainFamily(ground) {
  if (ground === "grass" || ground === "emberGrass" || ground === "snow") return "natural";
  if (PATH_GROUNDS.has(ground)) return "path";
  if (ground === "soil") return "soil";
  if (ground === "planks") return "planks";
  if (WATER_GROUNDS.has(ground)) return ground;
  if (ground === "ruinStone") return "stone";
  if (ground === "ash" || ground === "ember") return "scorched";
  if (ground === "blight") return "blight";
  return ground;
}

function getVisualVariant(ground, variant, tx, ty, sceneStyle) {
  if (ground !== "grass") return variant;
  const coarseX = Math.floor((tx + Math.floor(ty / 3)) / 4);
  const coarseY = Math.floor((ty + Math.floor(tx / 4)) / 4);
  return hashTile(coarseX, coarseY, 0, sceneStyle) % 3;
}

function getTerrainPalette(ground, variant, theme, sceneStyle) {
  if (ground === "path") {
    if (isAncientScene(sceneStyle)) {
      return paletteFrom(["#62586b", "#6d6275", "#776b80"], variant, "#9585a1", "#403948", "#b7a5c2");
    }
    if (sceneStyle === "chapelOfTides") {
      return paletteFrom(["#66766f", "#71827a", "#7d8c83"], variant, "#a9bbb0", "#3d4f4b", "#c4d3c9");
    }
    if (sceneStyle === "mossyRuins") {
      return paletteFrom(["#80765b", "#8b8063", "#746c53"], variant, "#b5a77e", "#4e4a38", "#c9ba91");
    }
    return paletteFrom(["#8d754d", "#997f54", "#836b46"], variant, "#c4aa75", "#59472e", "#d2bd8c");
  }

  if (ground === "planks") {
    return paletteFrom(["#705336", "#7b5b3b", "#65482f"], variant, "#b88955", "#392719", "#d0a06a");
  }

  if (ground === "soil") {
    return paletteFrom(["#664630", "#704e35", "#5c3f2d"], variant, "#98704e", "#3d291d", "#aa815d");
  }

  if (ground === "ash" || ground === "ashPath") {
    if (ground === "ashPath") {
      return paletteFrom(["#6c5547", "#755e4e", "#604b40"], variant, "#9d806c", "#3c2e28", "#b1947e");
    }
    return paletteFrom(["#4d3832", "#574038", "#46312d"], variant, "#806057", "#291d1b", "#9a6e5d");
  }

  if (ground === "water") {
    const marshWater = sceneStyle === "mossrootMarsh" || sceneStyle === "chapelOfTides";
    return marshWater
      ? paletteFrom(["#2b6866", "#307370", "#285e60"], variant, "#6fb5ad", "#173b42", "#a0d9cb")
      : paletteFrom(["#326d74", "#397981", "#2d626b"], variant, "#75b8c1", "#183c49", "#a7dce2");
  }

  if (ground === "ice") {
    return paletteFrom(["#82b6d1", "#8fc1d9", "#78a9c6"], variant, "#d7f2fb", "#4d7895", "#effbff");
  }

  if (ground === "snow" || ground === "snowPath") {
    if (ground === "snowPath") {
      return paletteFrom(["#aebdca", "#bac7d2", "#a5b4c1"], variant, "#e8f1f6", "#788b9c", "#f7fcff");
    }
    return paletteFrom(["#d8e5ed", "#e2ecf2", "#cfdee8"], variant, "#f8fcff", "#9fb3c3", "#ffffff");
  }

  if (ground === "emberGrass" || ground === "ember") {
    if (ground === "ember") {
      return paletteFrom(["#8e4732", "#9d5138", "#7d3c2e"], variant, "#e58a57", "#48241f", "#ffc078");
    }
    return paletteFrom(["#4e3029", "#58352c", "#633b30"], variant, "#875040", "#2c1a17", "#b46d50");
  }

  if (ground === "ruinStone") {
    if (isAncientScene(sceneStyle)) {
      return paletteFrom(["#625a6b", "#6e6576", "#776e80"], variant, "#a99cb2", "#403949", "#c6b7d0");
    }
    if (sceneStyle === "chapelOfTides") {
      return paletteFrom(["#5d706e", "#687b77", "#728581"], variant, "#99b1a9", "#394b4a", "#bed0c8");
    }
    if (sceneStyle === "hollowheartRuins" || sceneStyle === "blightedWoods") {
      return paletteFrom(["#6a5c5b", "#766766", "#5e5152"], variant, "#a18e89", "#3d3335", "#b8a39d");
    }
    return paletteFrom(["#706b67", "#7b7570", "#66625f"], variant, "#a9a19a", "#45423f", "#c3bab1");
  }

  if (ground === "blight") {
    return paletteFrom(["#3b2425", "#47292a", "#50302f"], variant, "#75413d", "#1d1113", "#a25a4d");
  }

  const naturalBases = [
    mixColors(theme.groundMid, theme.groundDark, 0.28),
    theme.groundMid,
    mixColors(theme.groundMid, theme.groundLight, 0.24),
  ];
  return {
    base: naturalBases[variant % naturalBases.length],
    light: mixColors(theme.groundLight, theme.grass, 0.34),
    dark: mixColors(theme.groundBase, theme.boundary, 0.34),
    accent: theme.grass,
    sparkle: theme.sparkle,
  };
}

function paletteFrom(bases, variant, light, dark, accent) {
  return {
    base: bases[variant % bases.length],
    light,
    dark,
    accent,
    sparkle: accent,
  };
}

function drawTerrainFacets(ctx, x, y, halfW, halfH, ground, palette, seed) {
  const structured = ground === "planks" || ground === "ruinStone";
  const lightAlpha = structured ? 0.08 : 0.025 + (seed % 3) * 0.008;
  const shadowAlpha = structured ? 0.09 : 0.03 + ((seed >> 3) % 3) * 0.008;

  ctx.save();
  ctx.globalAlpha = lightAlpha;
  ctx.fillStyle = palette.light;
  ctx.beginPath();
  ctx.moveTo(x, y - halfH);
  ctx.lineTo(x + halfW, y);
  ctx.lineTo(x + 1, y);
  ctx.lineTo(x - halfW + 2, y);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = shadowAlpha;
  ctx.fillStyle = palette.dark;
  ctx.beginPath();
  ctx.moveTo(x - halfW, y);
  ctx.lineTo(x, y + halfH);
  ctx.lineTo(x + halfW, y);
  ctx.lineTo(x, y + 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMaterialDetails(ctx, x, y, halfW, halfH, ground, palette, seed, tx, ty) {
  if (ground === "grass") {
    drawGrassDetails(ctx, x, y, palette, seed, tx, ty);
    return;
  }

  if (ground === "path" || ground === "ashPath" || ground === "snowPath") {
    drawPathDetails(ctx, x, y, ground, palette, seed, tx, ty);
    return;
  }

  if (ground === "soil") {
    drawSoilDetails(ctx, x, y, palette, seed, tx, ty);
    return;
  }

  if (ground === "planks") {
    drawPlankDetails(ctx, x, y, halfW, palette, seed, tx, ty);
    return;
  }

  if (ground === "water") {
    drawWaterDetails(ctx, x, y, palette, seed, tx, ty);
    return;
  }

  if (ground === "ice") {
    drawIceDetails(ctx, x, y, palette, seed, tx, ty);
    return;
  }

  if (ground === "snow") {
    drawSnowDetails(ctx, x, y, palette, seed, tx, ty);
    return;
  }

  if (ground === "emberGrass" || ground === "ember" || ground === "ash") {
    drawScorchedDetails(ctx, x, y, ground, palette, seed, tx, ty);
    return;
  }

  if (ground === "ruinStone") {
    drawStoneDetails(ctx, x, y, palette, seed, tx, ty);
    return;
  }

  if (ground === "blight") {
    drawBlightDetails(ctx, x, y, palette, seed, tx, ty);
    return;
  }

  drawGrassDetails(ctx, x, y, palette, seed, tx, ty);
}

function drawGrassDetails(ctx, x, y, palette, seed, tx, ty) {
  if ((seed & 3) === 0) {
    pixel(ctx, x - 6 + (seed % 5), y - 1, 2, 1, palette.accent, 0.64);
    pixel(ctx, x - 5 + (seed % 5), y - 3, 1, 2, palette.light, 0.58);
  }
  if (hashTile(tx >> 1, ty >> 1, 1, "grass") % 7 === 0 && (tx + ty) % 3 === 0) {
    pixel(ctx, x + 3, y, 4, 1, palette.dark, 0.35);
  }
}

function drawPathDetails(ctx, x, y, ground, palette, seed, tx, ty) {
  if ((tx + ty) % 4 === 0) {
    pixel(ctx, x - 7, y - 1, 5, 1, palette.light, ground === "snowPath" ? 0.46 : 0.34);
  }
  if (seed % 5 === 0) {
    pixel(ctx, x + 3, y, 2, 1, palette.dark, 0.54);
    pixel(ctx, x + 5, y - 1, 1, 1, palette.light, 0.5);
  }
  if (ground === "ashPath" && seed % 11 === 0) {
    pixel(ctx, x - 1, y - 2, 1, 1, "#e28a58", 0.65);
  }
}

function drawSoilDetails(ctx, x, y, palette, seed, tx, ty) {
  const phase = (tx + ty) % 3;
  if (phase === 0) {
    drawPixelLine(ctx, x - 10, y + 1, x - 3, y + 4, palette.dark, 0.5);
    drawPixelLine(ctx, x - 7, y - 3, x + 1, y + 1, palette.light, 0.38);
  }
  if (seed % 5 === 0) {
    pixel(ctx, x + 5, y, 2, 1, palette.accent, 0.38);
  }
}

function drawPlankDetails(ctx, x, y, halfW, palette, seed, tx, ty) {
  if ((tx + ty) % 2 === 0) {
    drawPixelLine(ctx, x - halfW + 2, y - 1, x + halfW - 3, y - 1, palette.light, 0.38);
    drawPixelLine(ctx, x - halfW + 4, y + 2, x + halfW - 5, y + 2, palette.dark, 0.5);
  }
  if (seed % 4 === 0) {
    pixel(ctx, x + 4, y - 2, 1, 1, palette.dark, 0.8);
  }
}

function drawWaterDetails(ctx, x, y, palette, seed, tx, ty) {
  const phase = (tx * 2 + ty) % 4;
  if (phase === 0 || phase === 2) {
    pixel(ctx, x - 8 + phase, y - 2, 7, 1, palette.light, 0.42);
  }
  if (seed % 3 === 0) {
    pixel(ctx, x + 1, y + 1, 6, 1, palette.dark, 0.35);
  }
  if (seed % 13 === 0) {
    pixel(ctx, x + 6, y - 2, 2, 1, palette.sparkle, 0.7);
  }
}

function drawIceDetails(ctx, x, y, palette, seed, tx, ty) {
  if ((tx + ty) % 5 === 0) {
    drawPixelLine(ctx, x - 6, y - 2, x - 1, y + 1, palette.light, 0.6);
    drawPixelLine(ctx, x - 1, y + 1, x + 3, y, palette.dark, 0.42);
  }
  if (seed % 4 === 0) {
    pixel(ctx, x + 5, y - 2, 3, 1, palette.sparkle, 0.68);
  }
}

function drawSnowDetails(ctx, x, y, palette, seed, tx, ty) {
  if (hashTile(tx >> 1, ty >> 1, 2, "snow") % 5 === 0 && (tx + ty) % 3 === 0) {
    pixel(ctx, x - 5, y, 5, 1, palette.dark, 0.18);
  }
  if (seed % 7 === 0) {
    pixel(ctx, x + 4, y - 2, 2, 1, palette.sparkle, 0.72);
  }
}

function drawScorchedDetails(ctx, x, y, ground, palette, seed, tx, ty) {
  if ((tx + ty) % 5 === 0) {
    drawPixelLine(ctx, x - 5, y - 2, x, y + 1, palette.dark, 0.62);
    drawPixelLine(ctx, x, y + 1, x + 4, y, palette.dark, 0.44);
  }
  if ((ground === "ember" || ground === "emberGrass") && seed % 8 === 0) {
    pixel(ctx, x + 5, y - 1, 1, 1, "#ffb15f", ground === "ember" ? 0.9 : 0.58);
  }
}

function drawStoneDetails(ctx, x, y, palette, seed, tx, ty) {
  const block = (tx + ty * 2) % 4;
  if (block === 0) {
    drawPixelLine(ctx, x - 8, y - 1, x - 2, y + 2, palette.dark, 0.44);
  } else if (block === 2) {
    drawPixelLine(ctx, x + 1, y - 2, x + 8, y + 1, palette.light, 0.36);
  }
  if (seed % 9 === 0) {
    pixel(ctx, x - 1, y, 3, 1, palette.accent, 0.44);
  }
}

function drawBlightDetails(ctx, x, y, palette, seed, tx, ty) {
  if ((tx * 3 + ty) % 6 === 0) {
    drawPixelLine(ctx, x - 7, y + 1, x - 2, y - 1, palette.dark, 0.72);
    drawPixelLine(ctx, x - 2, y - 1, x + 3, y + 1, palette.accent, 0.42);
  }
  if (seed % 10 === 0) {
    pixel(ctx, x + 5, y - 2, 1, 1, "#d0785d", 0.65);
  }
}

function drawTerrainEdges(ctx, x, y, halfW, halfH, ground, palette, neighbors) {
  const family = getTerrainFamily(ground);
  const edgeAlpha = ground === "water" || ground === "ice" ? 0.76 : 0.58;

  if (!sameFamily(family, neighbors.topLeft)) {
    drawEdge(ctx, x, y, halfW, halfH, "topLeft", palette.light, edgeAlpha);
  }
  if (!sameFamily(family, neighbors.topRight)) {
    drawEdge(ctx, x, y, halfW, halfH, "topRight", palette.light, edgeAlpha);
  }
  if (!sameFamily(family, neighbors.bottomRight)) {
    drawEdge(ctx, x, y, halfW, halfH, "bottomRight", palette.dark, edgeAlpha);
  }
  if (!sameFamily(family, neighbors.bottomLeft)) {
    drawEdge(ctx, x, y, halfW, halfH, "bottomLeft", palette.dark, edgeAlpha);
  }
}

function sameFamily(family, neighborGround) {
  return neighborGround && getTerrainFamily(neighborGround) === family;
}

function drawEdge(ctx, x, y, halfW, halfH, side, color, alpha) {
  const points = {
    topLeft: [x, y - halfH, x - halfW, y],
    topRight: [x, y - halfH, x + halfW, y],
    bottomRight: [x + halfW, y, x, y + halfH],
    bottomLeft: [x, y + halfH, x - halfW, y],
  }[side];

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  ctx.lineTo(points[2], points[3]);
  ctx.stroke();
  ctx.restore();
}

function drawTerrainOverlay(ctx, x, y, overlay, palette, seed) {
  if (!overlay) return;
  const offsetX = (seed % 7) - 3;
  const offsetY = ((seed >> 3) % 3) - 1;

  if (overlay === "clover") {
    pixel(ctx, x + offsetX - 1, y + offsetY - 1, 2, 1, "#75b96a", 0.84);
    pixel(ctx, x + offsetX + 1, y + offsetY, 2, 1, "#9bd185", 0.9);
    pixel(ctx, x + offsetX, y + offsetY + 1, 1, 1, palette.dark, 0.6);
    return;
  }

  if (overlay === "flowersWarm" || overlay === "flowersCool" || overlay === "frostFlowers") {
    const colors =
      overlay === "flowersWarm"
        ? ["#ffd37c", "#ef8f9d"]
        : overlay === "flowersCool"
          ? ["#8edff2", "#d8efff"]
          : ["#e8f8ff", "#a6d9f4"];
    pixel(ctx, x + offsetX - 2, y + offsetY, 1, 1, colors[0], 0.95);
    pixel(ctx, x + offsetX + 2, y + offsetY - 1, 1, 1, colors[1], 0.95);
    pixel(ctx, x + offsetX, y + offsetY + 1, 1, 1, "#5d8a55", 0.72);
    return;
  }

  if (overlay === "reeds") {
    pixel(ctx, x + offsetX - 1, y + offsetY - 4, 1, 5, "#78a66d", 0.92);
    pixel(ctx, x + offsetX + 1, y + offsetY - 3, 1, 4, "#a1c58b", 0.9);
    pixel(ctx, x + offsetX - 2, y + offsetY - 4, 1, 1, "#b49462", 0.88);
  }
}

function isAncientScene(sceneStyle) {
  return (
    sceneStyle === "ancientHeart" ||
    sceneStyle === "sunkenReliquary" ||
    sceneStyle === "starfallSanctum"
  );
}

function clipDiamond(ctx, x, y, halfW, halfH) {
  ctx.beginPath();
  ctx.moveTo(x, y - halfH);
  ctx.lineTo(x + halfW, y);
  ctx.lineTo(x, y + halfH);
  ctx.lineTo(x - halfW, y);
  ctx.closePath();
  ctx.clip();
}

function drawDiamond(ctx, x, y, halfW, halfH, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - halfH);
  ctx.lineTo(x + halfW, y);
  ctx.lineTo(x, y + halfH);
  ctx.lineTo(x - halfW, y);
  ctx.closePath();
  ctx.fill();
}

function drawPixelLine(ctx, x1, y1, x2, y2, color, alpha = 1) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let index = 0; index <= steps; index += 1) {
    const t = steps === 0 ? 0 : index / steps;
    pixel(
      ctx,
      Math.round(x1 + (x2 - x1) * t),
      Math.round(y1 + (y2 - y1) * t),
      1,
      1,
      color,
      alpha
    );
  }
}

function pixel(ctx, x, y, w, h, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  ctx.restore();
}

function hashTile(tx, ty, variant = 0, salt = "") {
  let hash = 2166136261;
  const input = `${tx}|${ty}|${variant}|${salt}`;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mixColors(colorA, colorB, amount) {
  const a = parseHex(colorA);
  const b = parseHex(colorB);
  const mix = (from, to) => Math.round(from + (to - from) * amount);
  return toHexColor(mix(a.r, b.r), mix(a.g, b.g), mix(a.b, b.b));
}

function parseHex(color) {
  const clean = color.replace("#", "");
  return {
    r: Number.parseInt(clean.slice(0, 2), 16),
    g: Number.parseInt(clean.slice(2, 4), 16),
    b: Number.parseInt(clean.slice(4, 6), 16),
  };
}

function toHexColor(r, g, b) {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function toHex(value) {
  return value.toString(16).padStart(2, "0");
}

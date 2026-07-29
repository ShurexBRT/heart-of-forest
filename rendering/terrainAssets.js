import { getBiomeFloorTexture } from "./atlasAssets.js";

const PATH_GROUNDS = new Set(["path", "ashPath", "snowPath"]);
const WATER_GROUNDS = new Set(["water", "ice"]);
const VARIANT_BREAKUP_FAMILIES = new Set(["natural", "path", "soil", "stone", "scorched", "blight"]);

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
  const seed = hashTile(tx, ty, visualVariant, sceneStyle);
  const profile = getBiomeDetailProfile(sceneStyle);

  drawDiamond(ctx, x, y, halfW, halfH, palette.base);
  drawTerrainFacets(ctx, x, y, halfW, halfH, tile.ground, palette, seed);
  drawAtlasFloorTexture(ctx, x, y, halfW, halfH, tile, sceneStyle, tx, ty);

  ctx.save();
  clipDiamond(ctx, x, y, halfW, halfH);
  drawSurfaceBreakup(ctx, x, y, halfW, halfH, tile.ground, palette, profile, seed, tx, ty);
  drawMaterialDetails(ctx, x, y, halfW, halfH, tile.ground, palette, profile, seed, tx, ty, neighbors);
  drawBiomeSignatureDetails(ctx, x, y, halfW, halfH, tile.ground, palette, seed, tx, ty, profile);
  drawTerrainTransitionDetails(ctx, x, y, halfW, halfH, tile.ground, palette, profile, seed, neighbors);
  ctx.restore();

  drawTerrainEdges(ctx, x, y, halfW, halfH, tile.ground, palette, neighbors);
  drawTerrainOverlay(ctx, x, y, tile.overlay, palette, seed);
}

function drawAtlasFloorTexture(ctx, x, y, halfW, halfH, tile, sceneStyle, tx, ty) {
  const texture = getBiomeFloorTexture(
    sceneStyle,
    tile.ground,
    tile.variant + hashTile(tx >> 1, ty >> 1, 0, sceneStyle)
  );
  if (!texture) return;

  const alpha =
    tile.ground === "water" || tile.ground === "ice"
      ? 0.46
      : tile.ground === "path" ||
          tile.ground === "ashPath" ||
          tile.ground === "snowPath" ||
          tile.ground === "ruinStone"
        ? 0.48
        : tile.ground === "soil" || tile.ground === "planks"
          ? 0.44
          : tile.ground === "blight"
            ? 0.38
            : tile.ground === "ember" || tile.ground === "ash"
              ? 0.48
            : 0.36;

  ctx.save();
  clipDiamond(ctx, x, y, halfW, halfH);
  ctx.globalAlpha = alpha;
  ctx.drawImage(texture, x - halfW, y - halfH, halfW * 2, halfH * 2);
  ctx.restore();
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
  const family = getTerrainFamily(ground);
  if (!VARIANT_BREAKUP_FAMILIES.has(family)) return variant;

  const scale =
    family === "path" || family === "stone"
      ? 3
      : family === "scorched" || family === "blight"
        ? 4
        : 5;
  const coarseX = Math.floor((tx + Math.floor(ty / 3)) / scale);
  const coarseY = Math.floor((ty + Math.floor(tx / 4)) / scale);
  const drift = hashTile(coarseX, coarseY, variant, `${sceneStyle}:${family}`) % 3;
  return variant + drift;
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
    return paletteFrom(["#30252c", "#382831", "#2a2228"], variant, "#6e4768", "#17131a", "#a74eb4");
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

function drawSurfaceBreakup(ctx, x, y, halfW, halfH, ground, palette, profile, seed, tx, ty) {
  const family = getTerrainFamily(ground);

  if (family === "water" || family === "ice") return;

  if (family === "natural") {
    if (ground === "snow") {
      if (seed % 4 === 0) {
        drawPixelLine(ctx, x - 12, y + 1, x - 5, y + 2, palette.dark, 0.16);
      }
      if (seed % 9 === 0) {
        pixel(ctx, x + 7, y - 3, 2, 1, profile.spark, 0.62);
      }
      return;
    }

    if (ground === "emberGrass") {
      if (seed % 4 === 0) {
        drawPixelLine(ctx, x - 9, y + 2, x - 2, y, profile.root, 0.42);
      }
      if (seed % 11 === 0) {
        pixel(ctx, x + 6, y - 2, 1, 1, profile.spark, 0.58);
      }
      return;
    }

    if (seed % 3 === 0) {
      pixel(ctx, x - 10 + (seed % 7), y + 1, 5, 1, palette.dark, 0.18);
    }
    if (hashTile(tx >> 1, ty >> 1, seed, profile.id) % 6 === 0) {
      pixel(ctx, x + 5, y - 3, 3, 1, profile.leaf, 0.38);
      pixel(ctx, x + 7, y - 1, 1, 1, profile.flower, 0.46);
    }
    return;
  }

  if (family === "path") {
    if (seed % 4 === 0) {
      drawPixelLine(ctx, x - 11, y + 2, x - 5, y + 3, palette.dark, 0.25);
    }
    if (seed % 7 === 0) {
      pixel(ctx, x + 6, y - 3, 5, 1, palette.light, ground === "snowPath" ? 0.42 : 0.28);
    }
    return;
  }

  if (family === "soil") {
    if ((tx + ty) % 2 === 0) {
      drawPixelLine(ctx, x - 14, y - 1, x - 4, y + 3, palette.dark, 0.26);
      drawPixelLine(ctx, x + 2, y - 2, x + 11, y + 1, palette.light, 0.18);
    }
    return;
  }

  if (family === "stone") {
    if (seed % 3 === 0) {
      drawPixelLine(ctx, x - halfW + 8, y - 2, x - 3, y - 1, palette.dark, 0.22);
    }
    if (seed % 5 === 0) {
      drawPixelLine(ctx, x + 2, y + 2, x + halfW - 9, y + 1, palette.light, 0.18);
    }
    return;
  }

  if (family === "scorched" || family === "blight") {
    if (seed % 3 === 0) {
      drawPixelLine(ctx, x - 8, y - 1, x - 1, y + 2, palette.dark, family === "blight" ? 0.62 : 0.46);
      drawPixelLine(ctx, x - 1, y + 2, x + 6, y, profile.root, family === "blight" ? 0.44 : 0.3);
    }
    if (family === "scorched" && seed % 13 === 0) {
      pixel(ctx, x + 8, y - 2, 1, 1, profile.spark, 0.74);
    }
  }
}

function drawMaterialDetails(ctx, x, y, halfW, halfH, ground, palette, profile, seed, tx, ty, neighbors) {
  if (ground === "grass") {
    drawGrassDetails(ctx, x, y, palette, seed, tx, ty);
    return;
  }

  if (ground === "path" || ground === "ashPath" || ground === "snowPath") {
    drawPathDetails(ctx, x, y, ground, palette, seed, tx, ty);
    drawFloorRelief(ctx, x, y, halfW, "path", ground, palette, profile, seed, tx, ty);
    return;
  }

  if (ground === "soil") {
    drawSoilDetails(ctx, x, y, palette, seed, tx, ty);
    return;
  }

  if (ground === "planks") {
    drawPlankDetails(ctx, x, y, halfW, palette, seed, tx, ty);
    drawFloorRelief(ctx, x, y, halfW, "planks", ground, palette, profile, seed, tx, ty);
    return;
  }

  if (ground === "water") {
    drawWaterDetails(ctx, x, y, halfW, halfH, palette, profile, seed, tx, ty, neighbors);
    return;
  }

  if (ground === "ice") {
    drawIceDetails(ctx, x, y, halfW, halfH, palette, profile, seed, tx, ty, neighbors);
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
    drawFloorRelief(ctx, x, y, halfW, "stone", ground, palette, profile, seed, tx, ty);
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

function drawWaterDetails(ctx, x, y, halfW, halfH, palette, profile, seed, tx, ty, neighbors) {
  const shoreMask = getShoreMask(neighbors);
  const depthAlpha = shoreMask.openWater >= 3 ? 0.22 : 0.12;

  pixel(ctx, x - halfW + 3, y - 1, halfW * 2 - 6, 1, palette.dark, depthAlpha);
  pixel(ctx, x - halfW + 7, y + 2, halfW * 2 - 14, 1, palette.dark, depthAlpha * 0.72);

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

  drawLiquidWaveBand(ctx, x, y, halfW, -4, palette.light, profile.water, 0.34, seed);
  drawLiquidWaveBand(ctx, x, y, halfW, 1, profile.water, palette.dark, 0.26, seed + 17);

  if (shoreMask.hasShore) {
    drawShoreGlints(ctx, x, y, halfW, halfH, palette.light, profile.water, shoreMask, seed);
  }

  if (profile.motif === "reed" && shoreMask.hasShore && seed % 4 === 0) {
    const side = shoreMask.firstShoreSide || "bottomLeft";
    drawShoreReed(ctx, x, y, halfW, halfH, side, profile.root, profile.leaf, seed);
  }
}

function drawIceDetails(ctx, x, y, halfW, halfH, palette, profile, seed, tx, ty, neighbors) {
  const shoreMask = getShoreMask(neighbors);

  pixel(ctx, x - halfW + 5, y - 1, halfW * 2 - 10, 1, palette.dark, 0.11);
  if ((tx + ty) % 5 === 0) {
    drawPixelLine(ctx, x - 6, y - 2, x - 1, y + 1, palette.light, 0.6);
    drawPixelLine(ctx, x - 1, y + 1, x + 3, y, palette.dark, 0.42);
  }
  if (seed % 4 === 0) {
    pixel(ctx, x + 5, y - 2, 3, 1, palette.sparkle, 0.68);
  }

  if (seed % 6 === 0) {
    drawPixelLine(ctx, x - 10, y + 2, x - 2, y - 1, profile.pathDark, 0.34);
    drawPixelLine(ctx, x - 2, y - 1, x + 5, y, palette.light, 0.48);
  }

  if (shoreMask.hasShore) {
    drawShoreGlints(ctx, x, y, halfW, halfH, palette.light, profile.spark, shoreMask, seed + 23, 0.42);
  }
}

function drawFloorRelief(ctx, x, y, halfW, family, ground, palette, profile, seed, tx, ty) {
  const reliefSeed = hashTile(tx, ty, seed, `${profile.id}:${family}:${ground}`);
  const isSnow = ground === "snowPath";
  const isAsh = ground === "ashPath";

  if (family === "path") {
    if (reliefSeed % 3 === 0) {
      drawPixelLine(ctx, x - halfW + 6, y + 2, x - 4, y + 1, palette.dark, isSnow ? 0.18 : 0.28);
    }
    if (reliefSeed % 5 === 0) {
      drawPixelLine(ctx, x + 3, y - 2, x + halfW - 7, y - 1, palette.light, isSnow ? 0.36 : 0.26);
    }
    if (isAsh && reliefSeed % 7 === 0) {
      pixel(ctx, x - 2, y - 1, 2, 1, profile.spark, 0.62);
    }
    return;
  }

  if (family === "stone") {
    const tint = profile.motif === "rune" ? profile.spark : profile.leaf;
    if (reliefSeed % 2 === 0) {
      pixel(ctx, x - 9, y - 3, 8, 1, palette.dark, 0.32);
      pixel(ctx, x - 8, y - 2, 1, 2, palette.dark, 0.24);
    }
    if (reliefSeed % 6 === 0) {
      pixel(ctx, x + 4, y + 1, 7, 1, tint, profile.motif === "rune" ? 0.46 : 0.24);
    }
    return;
  }

  if (family === "planks") {
    const nailColor = profile.motif === "rune" ? profile.spark : palette.dark;
    pixel(ctx, x - 10 + (reliefSeed % 6), y - 2, 1, 1, nailColor, 0.58);
    if (reliefSeed % 4 === 0) {
      drawPixelLine(ctx, x - halfW + 4, y + 4, x + halfW - 5, y + 3, palette.dark, 0.32);
    }
  }
}

function drawLiquidWaveBand(ctx, x, y, halfW, offsetY, lightColor, darkColor, alpha, seed) {
  const drift = (seed % 5) - 2;
  drawPixelLine(ctx, x - halfW + 7 + drift, y + offsetY, x - 3 + drift, y + offsetY + 1, lightColor, alpha);
  drawPixelLine(ctx, x + 3 + drift, y + offsetY + 1, x + halfW - 8 + drift, y + offsetY, lightColor, alpha * 0.82);
  if (seed % 3 === 0) {
    pixel(ctx, x - 1 + drift, y + offsetY + 2, 6, 1, darkColor, alpha * 0.58);
  }
}

function drawShoreGlints(ctx, x, y, halfW, halfH, lightColor, foamColor, shoreMask, seed, alpha = 0.34) {
  for (const side of shoreMask.sides) {
    const [x1, y1, x2, y2] = getEdgePoints(x, y, halfW, halfH, side, 5);
    const t = 0.28 + (hashTile(seed, side.length, 5, foamColor) % 34) / 100;
    const px = Math.round(lerp(x1, x2, clamp01(t)));
    const py = Math.round(lerp(y1, y2, clamp01(t)));
    pixel(ctx, px - 2, py - 1, 5, 1, lightColor, alpha);
    pixel(ctx, px - 1, py, 3, 1, foamColor, alpha * 0.72);
  }
}

function drawShoreReed(ctx, x, y, halfW, halfH, side, rootColor, leafColor, seed) {
  const [x1, y1, x2, y2] = getEdgePoints(x, y, halfW, halfH, side, 6);
  const t = 0.26 + (seed % 36) / 100;
  const px = Math.round(lerp(x1, x2, clamp01(t)));
  const py = Math.round(lerp(y1, y2, clamp01(t)));
  pixel(ctx, px, py - 5, 1, 5, rootColor, 0.78);
  pixel(ctx, px + 1, py - 4, 1, 4, leafColor, 0.72);
  pixel(ctx, px - 2, py - 5, 2, 1, leafColor, 0.62);
}

function getShoreMask(neighbors) {
  const sides = [];
  let openWater = 0;
  const entries = [
    ["topLeft", neighbors?.topLeft],
    ["topRight", neighbors?.topRight],
    ["bottomRight", neighbors?.bottomRight],
    ["bottomLeft", neighbors?.bottomLeft],
  ];

  for (const [side, ground] of entries) {
    const family = ground ? getTerrainFamily(ground) : null;
    if (family === "water" || family === "ice") {
      openWater += 1;
    } else {
      sides.push(side);
    }
  }

  return {
    sides,
    openWater,
    hasShore: sides.length > 0,
    firstShoreSide: sides[0] || null,
  };
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

function drawBiomeSignatureDetails(ctx, x, y, halfW, halfH, ground, palette, seed, tx, ty, profile) {
  if (!profile) return;

  const family = getTerrainFamily(ground);
  const detailSeed = hashTile(tx, ty, seed, profile.id);

  if (family === "natural" || family === "soil") {
    drawNaturalSignature(ctx, x, y, profile, detailSeed, tx, ty);
  }

  if (family === "path" || family === "stone" || ground === "planks") {
    drawPathSignature(ctx, x, y, halfW, profile, detailSeed, tx, ty, family);
  }

  if (family === "water" || family === "ice") {
    drawLiquidSignature(ctx, x, y, profile, detailSeed, tx, ty, family);
  }

  if (ground === "ash" || ground === "ember" || ground === "blight") {
    drawSpecialSignature(ctx, x, y, profile, detailSeed, tx, ty, ground);
  }

  if (detailSeed % 29 === 0 && profile.spark) {
    pixel(ctx, x + ((detailSeed >> 2) % 13) - 6, y + ((detailSeed >> 6) % 5) - 2, 1, 1, profile.spark, 0.72);
  }
}

function drawTerrainTransitionDetails(ctx, x, y, halfW, halfH, ground, palette, profile, seed, neighbors) {
  if (!profile || !neighbors) return;

  const family = getTerrainFamily(ground);
  const sideEntries = [
    ["topLeft", neighbors.topLeft],
    ["topRight", neighbors.topRight],
    ["bottomRight", neighbors.bottomRight],
    ["bottomLeft", neighbors.bottomLeft],
  ];

  for (const [side, neighborGround] of sideEntries) {
    if (!neighborGround) continue;
    const neighborFamily = getTerrainFamily(neighborGround);
    if (neighborFamily === family) continue;

    const edgeSeed = hashTile(seed, side.length, neighborGround.length, profile.id);

    if (family === "path" && (neighborFamily === "natural" || neighborFamily === "soil")) {
      drawBrokenEdgeLine(ctx, x, y, halfW, halfH, side, palette.dark, 0.3, edgeSeed);
      drawEdgeTufts(ctx, x, y, halfW, halfH, side, profile.leaf, profile.root, 0.58, edgeSeed);
      continue;
    }

    if ((family === "natural" || family === "soil") && neighborFamily === "path") {
      drawBrokenEdgeLine(ctx, x, y, halfW, halfH, side, profile.pathDark, 0.24, edgeSeed);
      if (profile.motif === "leaf" || profile.motif === "reed") {
        drawEdgeTufts(ctx, x, y, halfW, halfH, side, profile.leaf, profile.flower, 0.38, edgeSeed + 3);
      }
      continue;
    }

    if (family === "water" || family === "ice" || neighborFamily === "water" || neighborFamily === "ice") {
      const shoreColor = family === "water" || family === "ice" ? palette.light : profile.water;
      const shadowColor = family === "water" || family === "ice" ? palette.dark : profile.pathDark;
      drawBrokenEdgeLine(ctx, x, y, halfW, halfH, side, shoreColor, family === "ice" ? 0.48 : 0.38, edgeSeed);
      drawBrokenEdgeLine(ctx, x, y, halfW, halfH, side, shadowColor, 0.22, edgeSeed + 11, 0.56);
      if (profile.motif === "reed" && family !== "ice" && neighborFamily !== "ice") {
        drawEdgeTufts(ctx, x, y, halfW, halfH, side, profile.leaf, profile.root, 0.68, edgeSeed + 5);
      }
      continue;
    }

    if (family === "stone" || neighborFamily === "stone") {
      drawBrokenEdgeLine(ctx, x, y, halfW, halfH, side, family === "stone" ? palette.dark : profile.pathDark, 0.28, edgeSeed);
      if (profile.motif === "leaf" || profile.motif === "reed") {
        drawEdgeTufts(ctx, x, y, halfW, halfH, side, profile.leaf, profile.root, 0.36, edgeSeed + 7);
      }
      if (profile.motif === "rune" && edgeSeed % 3 === 0) {
        drawEdgeRunes(ctx, x, y, halfW, halfH, side, profile.spark, 0.5, edgeSeed);
      }
      continue;
    }

    if (family === "scorched" || neighborFamily === "scorched") {
      drawBrokenEdgeLine(ctx, x, y, halfW, halfH, side, "#ff9254", 0.22, edgeSeed);
      drawBrokenEdgeLine(ctx, x, y, halfW, halfH, side, profile.root, 0.34, edgeSeed + 9, 0.5);
      continue;
    }

    if (family === "blight" || neighborFamily === "blight") {
      drawBrokenEdgeLine(ctx, x, y, halfW, halfH, side, profile.root, 0.56, edgeSeed);
      drawEdgeThorns(ctx, x, y, halfW, halfH, side, profile.flower, 0.44, edgeSeed);
      continue;
    }

    if (ground === "snow" || neighborGround === "snow" || ground === "snowPath" || neighborGround === "snowPath") {
      drawBrokenEdgeLine(ctx, x, y, halfW, halfH, side, profile.spark, 0.36, edgeSeed);
    }
  }
}

function getBiomeDetailProfile(sceneStyle) {
  if (sceneStyle === "mossrootMarsh" || sceneStyle === "chapelOfTides") {
    return {
      id: "stillwater",
      leaf: "#6fb982",
      flower: "#c5d99b",
      root: "#4d6f59",
      path: "#9db398",
      pathDark: "#405552",
      water: "#9ce3d8",
      spark: "#d7efb7",
      motif: "reed",
    };
  }

  if (sceneStyle === "emberpineGrove") {
    return {
      id: "ember",
      leaf: "#9d6048",
      flower: "#ffbe6e",
      root: "#4d2820",
      path: "#b2876f",
      pathDark: "#3c251f",
      water: "#ff9b59",
      spark: "#ffd18a",
      motif: "ember",
    };
  }

  if (sceneStyle === "frostveilTundra") {
    return {
      id: "frost",
      leaf: "#b8d8e9",
      flower: "#f6fdff",
      root: "#7f94a9",
      path: "#d5e5ee",
      pathDark: "#6d8395",
      water: "#effcff",
      spark: "#ffffff",
      motif: "frost",
    };
  }

  if (sceneStyle === "blightedWoods" || sceneStyle === "hollowheartRuins") {
    return {
      id: "scarroot",
      leaf: "#9a584c",
      flower: "#d49174",
      root: "#2a1718",
      path: "#b08c7f",
      pathDark: "#3d2a2d",
      water: "#d08478",
      spark: "#f0b47a",
      motif: "thorn",
    };
  }

  if (isAncientScene(sceneStyle)) {
    return {
      id: "rootlight",
      leaf: "#b99ade",
      flower: "#f0dd92",
      root: "#665174",
      path: "#c6b8d2",
      pathDark: "#463b50",
      water: "#d9d2ff",
      spark: "#fff3b5",
      motif: "rune",
    };
  }

  return {
    id: "heartwood",
    leaf: "#78b969",
    flower: "#e7d989",
    root: "#5f4a2f",
    path: "#d0b783",
    pathDark: "#58462f",
    water: "#9de1d2",
    spark: "#d7dd96",
    motif: "leaf",
  };
}

function drawNaturalSignature(ctx, x, y, profile, seed, tx, ty) {
  if (seed % 5 === 0) {
    pixel(ctx, x - 7 + (seed % 5), y - 3, 2, 1, profile.leaf, 0.62);
    pixel(ctx, x - 5 + (seed % 7), y - 1, 3, 1, profile.root, 0.36);
  }

  if (seed % 13 === 0) {
    pixel(ctx, x + 4, y - 2, 2, 2, profile.flower, 0.7);
    pixel(ctx, x + 5, y, 1, 1, profile.leaf, 0.58);
  }

  if (profile.motif === "reed" && (tx + ty) % 6 === 0) {
    pixel(ctx, x - 2, y - 5, 1, 6, profile.root, 0.82);
    pixel(ctx, x, y - 4, 1, 5, profile.leaf, 0.78);
    pixel(ctx, x - 3, y - 5, 2, 1, "#a98665", 0.7);
  }

  if (profile.motif === "frost" && seed % 7 === 0) {
    drawPixelLine(ctx, x - 7, y - 1, x - 2, y + 1, profile.path, 0.36);
    pixel(ctx, x + 2, y - 3, 1, 1, profile.spark, 0.8);
  }
}

function drawPathSignature(ctx, x, y, halfW, profile, seed, tx, ty, family) {
  if ((tx + ty + seed) % 4 === 0) {
    drawPixelLine(ctx, x - halfW + 7, y - 1, x - 4, y - 1, profile.path, family === "stone" ? 0.3 : 0.38);
  }

  if (seed % 6 === 0) {
    drawPixelLine(ctx, x + 1, y + 2, x + halfW - 8, y + 1, profile.pathDark, 0.36);
  }

  if (profile.motif === "rune" && seed % 11 === 0) {
    pixel(ctx, x - 2, y - 3, 5, 1, profile.spark, 0.54);
    pixel(ctx, x, y - 2, 1, 4, profile.spark, 0.42);
  }

  if (profile.motif === "thorn" && seed % 9 === 0) {
    drawPixelLine(ctx, x - 5, y + 2, x + 4, y - 1, profile.root, 0.58);
    pixel(ctx, x + 4, y - 2, 2, 1, profile.flower, 0.52);
  }
}

function drawLiquidSignature(ctx, x, y, profile, seed, tx, ty, family) {
  if ((tx * 2 + ty + seed) % 5 === 0) {
    pixel(ctx, x - 9, y - 2, 8, 1, profile.water, family === "ice" ? 0.5 : 0.36);
  }
  if (seed % 7 === 0) {
    pixel(ctx, x + 3, y + 1, 6, 1, profile.pathDark, family === "ice" ? 0.22 : 0.3);
  }
}

function drawSpecialSignature(ctx, x, y, profile, seed, tx, ty, ground) {
  if (profile.motif === "ember" && seed % 4 === 0) {
    drawPixelLine(ctx, x - 5, y, x + 4, y - 2, "#ff9a57", ground === "ember" ? 0.62 : 0.36);
    pixel(ctx, x + 5, y - 2, 1, 1, profile.spark, 0.7);
  }

  if (profile.motif === "thorn" && seed % 5 === 0) {
    drawPixelLine(ctx, x - 8, y + 1, x + 6, y - 1, profile.root, 0.7);
    pixel(ctx, x - 2, y - 2, 2, 1, "#c26857", 0.52);
  }
}

function drawBrokenEdgeLine(ctx, x, y, halfW, halfH, side, color, alpha, seed, density = 1) {
  const [x1, y1, x2, y2] = getEdgePoints(x, y, halfW, halfH, side, 2);
  const segmentCount = density >= 0.75 ? 3 : 2;

  for (let index = 0; index < segmentCount; index += 1) {
    const segmentSeed = hashTile(seed, index, side.length, color);
    if (segmentSeed % 5 === 0 && density < 0.75) continue;
    const t = 0.18 + index * (0.58 / segmentCount) + ((segmentSeed % 7) - 3) * 0.01;
    const span = density >= 0.75 ? 0.14 : 0.1;
    const start = clamp01(t);
    const end = clamp01(t + span);
    drawPixelLine(
      ctx,
      lerp(x1, x2, start),
      lerp(y1, y2, start),
      lerp(x1, x2, end),
      lerp(y1, y2, end),
      color,
      alpha
    );
  }
}

function drawEdgeTufts(ctx, x, y, halfW, halfH, side, leafColor, rootColor, alpha, seed) {
  const [x1, y1, x2, y2] = getEdgePoints(x, y, halfW, halfH, side, 4);
  const count = seed % 3 === 0 ? 2 : 1;

  for (let index = 0; index < count; index += 1) {
    const t = 0.28 + index * 0.28 + ((seed >> (index + 2)) % 5) * 0.025;
    const px = Math.round(lerp(x1, x2, clamp01(t)));
    const py = Math.round(lerp(y1, y2, clamp01(t)));
    pixel(ctx, px - 1, py - 2, 1, 3, rootColor, alpha * 0.78);
    pixel(ctx, px, py - 3, 2, 1, leafColor, alpha);
    if (seed % 5 === 0) {
      pixel(ctx, px + 2, py - 1, 1, 1, leafColor, alpha * 0.72);
    }
  }
}

function drawEdgeRunes(ctx, x, y, halfW, halfH, side, color, alpha, seed) {
  const [x1, y1, x2, y2] = getEdgePoints(x, y, halfW, halfH, side, 5);
  const t = 0.35 + (seed % 4) * 0.08;
  const px = Math.round(lerp(x1, x2, clamp01(t)));
  const py = Math.round(lerp(y1, y2, clamp01(t)));
  pixel(ctx, px - 2, py - 2, 4, 1, color, alpha);
  pixel(ctx, px, py - 1, 1, 3, color, alpha * 0.78);
}

function drawEdgeThorns(ctx, x, y, halfW, halfH, side, color, alpha, seed) {
  const [x1, y1, x2, y2] = getEdgePoints(x, y, halfW, halfH, side, 4);
  const count = seed % 2 === 0 ? 2 : 1;

  for (let index = 0; index < count; index += 1) {
    const t = 0.22 + index * 0.34 + ((seed >> (index + 3)) % 4) * 0.025;
    const px = Math.round(lerp(x1, x2, clamp01(t)));
    const py = Math.round(lerp(y1, y2, clamp01(t)));
    drawPixelLine(ctx, px - 2, py + 1, px + 2, py - 1, color, alpha);
    pixel(ctx, px + 2, py - 2, 1, 1, color, alpha * 0.76);
  }
}

function drawTerrainEdges(ctx, x, y, halfW, halfH, ground, palette, neighbors) {
  const family = getTerrainFamily(ground);
  const edgeAlpha = ground === "water" || ground === "ice" ? 0.76 : 0.58;

  if (!sameFamily(family, neighbors.topLeft)) {
    drawEdge(ctx, x, y, halfW, halfH, "topLeft", palette.light, edgeAlpha);
    drawEdgeInset(ctx, x, y, halfW, halfH, "topLeft", palette.dark, edgeAlpha * 0.34);
  }
  if (!sameFamily(family, neighbors.topRight)) {
    drawEdge(ctx, x, y, halfW, halfH, "topRight", palette.light, edgeAlpha);
    drawEdgeInset(ctx, x, y, halfW, halfH, "topRight", palette.dark, edgeAlpha * 0.34);
  }
  if (!sameFamily(family, neighbors.bottomRight)) {
    drawEdge(ctx, x, y, halfW, halfH, "bottomRight", palette.dark, edgeAlpha);
    drawEdgeInset(ctx, x, y, halfW, halfH, "bottomRight", palette.light, edgeAlpha * 0.24);
  }
  if (!sameFamily(family, neighbors.bottomLeft)) {
    drawEdge(ctx, x, y, halfW, halfH, "bottomLeft", palette.dark, edgeAlpha);
    drawEdgeInset(ctx, x, y, halfW, halfH, "bottomLeft", palette.light, edgeAlpha * 0.24);
  }
}

function sameFamily(family, neighborGround) {
  return neighborGround && getTerrainFamily(neighborGround) === family;
}

function getEdgePoints(x, y, halfW, halfH, side, inset = 0) {
  return {
    topLeft: [x - inset, y - halfH + inset, x - halfW + inset, y],
    topRight: [x + inset, y - halfH + inset, x + halfW - inset, y],
    bottomRight: [x + halfW - inset, y, x + inset, y + halfH - inset],
    bottomLeft: [x - inset, y + halfH - inset, x - halfW + inset, y],
  }[side];
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

function drawEdgeInset(ctx, x, y, halfW, halfH, side, color, alpha) {
  const points = {
    topLeft: [x, y - halfH + 2, x - halfW + 3, y],
    topRight: [x, y - halfH + 2, x + halfW - 3, y],
    bottomRight: [x + halfW - 3, y, x, y + halfH - 2],
    bottomLeft: [x, y + halfH - 2, x - halfW + 3, y],
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
    pixel(ctx, x + offsetX - 2, y + offsetY - 1, 3, 2, "#638f4f", 0.84);
    pixel(ctx, x + offsetX + 1, y + offsetY - 1, 3, 2, "#9bd185", 0.9);
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
    pixel(ctx, x + offsetX - 3, y + offsetY - 1, 3, 2, colors[0], 0.95);
    pixel(ctx, x + offsetX + 1, y + offsetY - 2, 3, 2, colors[1], 0.95);
    const stemColor = overlay === "frostFlowers" ? "#7897aa" : palette.accent;
    pixel(ctx, x + offsetX - 1, y + offsetY + 1, 3, 1, stemColor, 0.68);
    return;
  }

  if (overlay === "reeds") {
    pixel(ctx, x + offsetX - 2, y + offsetY - 5, 1, 6, "#587b55", 0.92);
    pixel(ctx, x + offsetX, y + offsetY - 4, 1, 5, "#8eb17d", 0.9);
    pixel(ctx, x + offsetX + 2, y + offsetY - 6, 1, 7, "#6e9566", 0.9);
    pixel(ctx, x + offsetX - 3, y + offsetY - 5, 2, 1, "#a98264", 0.88);
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
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y - halfH);
  ctx.lineTo(x + halfW, y);
  ctx.lineTo(x, y + halfH);
  ctx.lineTo(x - halfW, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
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

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
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

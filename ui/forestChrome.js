const DEFAULT_ACCENT = "#9aca78";
const FOREST_GOLD = "#d9c77f";

export function drawForestPanel(ctx, x, y, width, height, options = {}) {
  const accent = options.accent || DEFAULT_ACCENT;
  const alpha = options.alpha ?? 0.9;
  const inner = options.inner || "#101914";
  const band = options.band ?? true;
  const shadow = options.shadow ?? true;
  const ornament = options.ornament ?? true;

  ctx.save();
  if (shadow) {
    drawPanelShadow(ctx, x, y, width, height);
  }

  ctx.fillStyle = `rgba(5, 10, 10, ${alpha})`;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));

  ctx.fillStyle = inner;
  ctx.fillRect(
    Math.round(x + 5),
    Math.round(y + 5),
    Math.round(width - 10),
    Math.round(height - 10)
  );

  drawBarkTexture(ctx, x + 6, y + 6, width - 12, height - 12, accent);

  if (band && height > 28) {
    drawHeaderBand(ctx, x + 9, y + 9, width - 18, Math.min(42, height - 18), accent);
  }

  drawForestFrame(ctx, x, y, width, height, accent, options);

  if (ornament) {
    drawRootSprig(ctx, x + 14, y + 14, accent, 1);
    drawRootSprig(ctx, x + width - 14, y + 14, accent, -1);
    if (height > 74 && width > 120) {
      drawSeedRune(ctx, x + width / 2, y + height - 12, accent, 0.62);
    }
  }
  ctx.restore();
}

export function drawForestSubpanel(ctx, x, y, width, height, options = {}) {
  const accent = options.accent || "#536b55";
  const selected = Boolean(options.selected);
  const fill =
    options.fill ||
    (selected ? "rgba(28, 50, 38, 0.82)" : "rgba(7, 14, 12, 0.78)");

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  ctx.fillStyle = fill;
  ctx.fillRect(
    Math.round(x + 3),
    Math.round(y + 3),
    Math.round(width - 6),
    Math.round(height - 6)
  );

  drawBarkTexture(ctx, x + 4, y + 4, width - 8, height - 8, accent, selected ? 0.13 : 0.07);

  ctx.fillStyle = selected ? "rgba(221, 235, 186, 0.065)" : "rgba(255, 255, 255, 0.025)";
  ctx.fillRect(
    Math.round(x + 6),
    Math.round(y + 6),
    Math.round(width - 12),
    Math.round(Math.min(8, height - 12))
  );

  ctx.strokeStyle = selected ? options.selectedAccent || accent : accent;
  ctx.globalAlpha *= selected ? 1 : 0.72;
  ctx.lineWidth = selected ? 2 : 1;
  ctx.strokeRect(
    Math.round(x) + 2.5,
    Math.round(y) + 2.5,
    Math.round(width - 5),
    Math.round(height - 5)
  );

  if (selected && width >= 42 && height >= 24) {
    drawSelectionRoot(ctx, x + 6, y + height - 5, width - 12, accent);
  } else if (options.footerAccent) {
    pixelRect(ctx, x + 5, y + height - 5, width - 10, 1, options.footerAccent);
  }
  ctx.restore();
}

export function drawForestButton(ctx, rect, options = {}) {
  const x = rect.x;
  const y = rect.y;
  const width = rect.width ?? rect.w;
  const height = rect.height ?? rect.h;
  const accent = options.accent || "#8fcb83";
  const selected = Boolean(options.selected);
  const hovered = Boolean(options.hovered);
  const disabled = Boolean(options.disabled);
  const active = selected || hovered;
  const fill = disabled
    ? "rgba(12, 16, 16, 0.72)"
    : active
      ? options.selectedFill || "rgba(30, 50, 38, 0.94)"
      : options.fill || "rgba(14, 24, 20, 0.92)";
  const border = disabled
    ? "#53605b"
    : active
      ? accent
      : options.border || "#4d6251";

  drawForestSubpanel(ctx, x, y, width, height, {
    accent: border,
    selected: active,
    selectedAccent: border,
    fill,
    footerAccent: active ? accent : null,
  });

  if (active && !disabled && width >= 44) {
    drawSeedRune(ctx, x + 12, y + height / 2, accent, 0.46);
  }

  if (disabled) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
    ctx.fillRect(
      Math.round(x + 3),
      Math.round(y + 3),
      Math.round(width - 6),
      Math.round(height - 6)
    );
  }
}

export function drawForestCloseButton(ctx, rect, hovered = false, options = {}) {
  const x = rect.x;
  const y = rect.y;
  const width = rect.width ?? rect.w;
  const height = rect.height ?? rect.h;
  const accent = hovered ? "#ffb0a9" : options.accent || "#d7c28b";
  drawForestButton(ctx, { x, y, width, height }, {
    selected: hovered,
    accent,
    fill: hovered ? "rgba(91, 34, 35, 0.92)" : "rgba(24, 36, 31, 0.92)",
    selectedFill: "rgba(105, 39, 42, 0.94)",
  });

  ctx.save();
  ctx.strokeStyle = hovered ? "#fff0ed" : "#f4ead3";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 9, y + 9);
  ctx.lineTo(x + width - 9, y + height - 9);
  ctx.moveTo(x + width - 9, y + 9);
  ctx.lineTo(x + 9, y + height - 9);
  ctx.stroke();
  ctx.restore();
}

export function drawForestPill(ctx, x, y, width, height, label, color, options = {}) {
  drawForestSubpanel(ctx, x, y, width, height, {
    accent: color,
    selected: options.selected,
    fill: options.fill || "rgba(13, 22, 18, 0.88)",
    footerAccent: color,
  });
  ctx.fillStyle = options.textColor || "#f6ead0";
  ctx.font = options.font || "700 11px Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.fillText(label, x + width / 2, y + Math.round(height * 0.66));
  ctx.textAlign = "left";
}

export function drawForestFrame(ctx, x, y, width, height, accent, options = {}) {
  const soft = options.soft || "rgba(236, 216, 142, 0.2)";
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.lineWidth = options.lineWidth || 1;
  ctx.strokeRect(
    Math.round(x) + 1.5,
    Math.round(y) + 1.5,
    Math.round(width - 3),
    Math.round(height - 3)
  );

  if (width > 36 && height > 36) {
    ctx.strokeStyle = soft;
    ctx.lineWidth = 1;
    ctx.strokeRect(
      Math.round(x + 12) + 0.5,
      Math.round(y + 12) + 0.5,
      Math.round(width - 25),
      Math.round(height - 25)
    );
  }

  drawRootCorner(ctx, x + 8, y + 8, 18, accent, "tl");
  drawRootCorner(ctx, x + width - 8, y + 8, 18, accent, "tr");
  drawRootCorner(ctx, x + 8, y + height - 8, 18, accent, "bl");
  drawRootCorner(ctx, x + width - 8, y + height - 8, 18, accent, "br");

  if (width >= 180) {
    drawFrameRoot(ctx, x + 34, y + 4, width - 68, accent);
  }
  ctx.restore();
}

function drawPanelShadow(ctx, x, y, width, height) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
  ctx.fillRect(
    Math.round(x + 5),
    Math.round(y + 7),
    Math.round(width),
    Math.round(height)
  );
  ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
  ctx.fillRect(
    Math.round(x + 9),
    Math.round(y + 12),
    Math.round(width),
    Math.round(height)
  );
}

function drawHeaderBand(ctx, x, y, width, height, accent) {
  ctx.fillStyle = "rgba(33, 51, 37, 0.58)";
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  ctx.fillStyle = "rgba(255, 239, 178, 0.08)";
  ctx.fillRect(Math.round(x + 7), Math.round(y + 1), Math.round(width - 14), 1);

  ctx.save();
  ctx.globalAlpha *= 0.22;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 22, y + height - 8);
  ctx.bezierCurveTo(
    x + width * 0.32,
    y + height - 2,
    x + width * 0.68,
    y + height - 14,
    x + width - 22,
    y + height - 7
  );
  ctx.stroke();
  ctx.restore();
}

function drawBarkTexture(ctx, x, y, width, height, accent, alpha = 0.055) {
  if (width < 20 || height < 20) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;

  const lineCount = Math.min(9, Math.max(3, Math.floor(height / 32)));
  for (let index = 0; index < lineCount; index += 1) {
    const rowY = y + 12 + index * ((height - 20) / Math.max(1, lineCount - 1));
    const phase = index % 2 === 0 ? 0 : 9;
    ctx.beginPath();
    ctx.moveTo(x + 10, rowY);
    ctx.bezierCurveTo(
      x + width * 0.28 + phase,
      rowY - 3,
      x + width * 0.62 - phase,
      rowY + 4,
      x + width - 10,
      rowY - 1
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawRootCorner(ctx, x, y, size, color, corner) {
  const sx = corner.endsWith("r") ? -1 : 1;
  const sy = corner.startsWith("b") ? -1 : 1;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, sy);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.bezierCurveTo(0, size * 0.45, size * 0.15, size * 0.1, size, 0);
  ctx.stroke();

  ctx.globalAlpha *= 0.65;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(5, 9);
  ctx.quadraticCurveTo(10, 8, 12, 3);
  ctx.moveTo(8, 5);
  ctx.quadraticCurveTo(12, 6, 15, 4);
  ctx.stroke();
  ctx.restore();
}

function drawFrameRoot(ctx, x, y, width, accent) {
  ctx.save();
  ctx.strokeStyle = FOREST_GOLD;
  ctx.globalAlpha *= 0.3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x + width * 0.2, y + 4, x + width * 0.38, y - 2, x + width * 0.5, y + 2);
  ctx.bezierCurveTo(x + width * 0.67, y + 6, x + width * 0.8, y - 2, x + width, y + 1);
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.globalAlpha *= 1.4;
  for (const t of [0.18, 0.5, 0.82]) {
    ctx.beginPath();
    ctx.ellipse(x + width * t, y + 2, 2.5, 1.3, t < 0.5 ? -0.5 : 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSelectionRoot(ctx, x, y, width, accent) {
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x + width * 0.24, y - 3, x + width * 0.68, y + 3, x + width, y - 1);
  ctx.stroke();

  ctx.fillStyle = FOREST_GOLD;
  ctx.globalAlpha *= 0.78;
  ctx.beginPath();
  ctx.ellipse(x + width * 0.5, y - 1, 3, 1.5, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRootSprig(ctx, x, y, accent, direction) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);
  ctx.strokeStyle = FOREST_GOLD;
  ctx.globalAlpha *= 0.55;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 9);
  ctx.quadraticCurveTo(2, 2, 11, -2);
  ctx.quadraticCurveTo(7, 5, 15, 9);
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.globalAlpha *= 1.3;
  ctx.beginPath();
  ctx.ellipse(7, 1, 4, 2, -0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(12, 6, 3.5, 1.8, 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSeedRune(ctx, x, y, accent, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = FOREST_GOLD;
  ctx.fillStyle = accent;
  ctx.globalAlpha *= 0.78;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.quadraticCurveTo(-1, 1, 0, -8);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(-4, -3, 4, 2.2, -0.7, 0, Math.PI * 2);
  ctx.ellipse(4, 1, 4, 2.2, 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function pixelRect(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(
    Math.round(x),
    Math.round(y),
    Math.max(1, Math.round(width)),
    Math.max(1, Math.round(height))
  );
}

export function drawForestPanel(ctx, x, y, width, height, options = {}) {
  const accent = options.accent || "#9aca78";
  const alpha = options.alpha ?? 0.9;
  const inner = options.inner || "#101914";
  const band = options.band ?? true;
  const shadow = options.shadow ?? true;

  ctx.save();
  if (shadow) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fillRect(Math.round(x + 4), Math.round(y + 5), Math.round(width), Math.round(height));
  }
  ctx.fillStyle = `rgba(5, 10, 10, ${alpha})`;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  ctx.fillStyle = inner;
  ctx.fillRect(Math.round(x + 5), Math.round(y + 5), Math.round(width - 10), Math.round(height - 10));
  if (band) {
    ctx.fillStyle = "rgba(33, 51, 37, 0.58)";
    ctx.fillRect(Math.round(x + 9), Math.round(y + 9), Math.round(width - 18), Math.round(Math.min(42, height - 18)));
    ctx.fillStyle = "rgba(255, 239, 178, 0.09)";
    ctx.fillRect(Math.round(x + 16), Math.round(y + 10), Math.round(width - 32), 1);
  }
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.fillRect(Math.round(x + 14), Math.round(y + height - 13), Math.round(width - 28), 2);
  drawForestFrame(ctx, x, y, width, height, accent, options);
  drawForestLeaf(ctx, x + 13, y + 12, accent, 1);
  drawForestLeaf(ctx, x + width - 13, y + 12, accent, -1);
  ctx.restore();
}

export function drawForestSubpanel(ctx, x, y, width, height, options = {}) {
  const accent = options.accent || "#536b55";
  const selected = Boolean(options.selected);
  const fill = options.fill || (selected ? "rgba(28, 50, 38, 0.82)" : "rgba(7, 14, 12, 0.78)");

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  ctx.fillStyle = fill;
  ctx.fillRect(Math.round(x + 3), Math.round(y + 3), Math.round(width - 6), Math.round(height - 6));
  ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
  ctx.fillRect(Math.round(x + 6), Math.round(y + 6), Math.round(width - 12), Math.round(Math.min(8, height - 12)));
  ctx.strokeStyle = selected ? options.selectedAccent || accent : accent;
  ctx.lineWidth = selected ? 2 : 1;
  ctx.strokeRect(Math.round(x) + 2.5, Math.round(y) + 2.5, Math.round(width - 5), Math.round(height - 5));
  if (options.footerAccent) {
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
  const fill = disabled
    ? "rgba(12, 16, 16, 0.72)"
    : selected || hovered
      ? options.selectedFill || "rgba(30, 50, 38, 0.94)"
      : options.fill || "rgba(14, 24, 20, 0.92)";
  const border = disabled ? "#53605b" : selected || hovered ? accent : options.border || "#4d6251";

  drawForestSubpanel(ctx, x, y, width, height, {
    accent: border,
    selected: selected || hovered,
    selectedAccent: border,
    fill,
    footerAccent: selected || hovered ? accent : null,
  });

  if (disabled) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
    ctx.fillRect(Math.round(x + 3), Math.round(y + 3), Math.round(width - 6), Math.round(height - 6));
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
  ctx.strokeStyle = hovered ? "#fff0ed" : "#f4ead3";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 9, y + 9);
  ctx.lineTo(x + width - 9, y + height - 9);
  ctx.moveTo(x + width - 9, y + 9);
  ctx.lineTo(x + 9, y + height - 9);
  ctx.stroke();
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
  ctx.strokeStyle = accent;
  ctx.lineWidth = options.lineWidth || 1;
  ctx.strokeRect(Math.round(x) + 1.5, Math.round(y) + 1.5, Math.round(width - 3), Math.round(height - 3));
  ctx.strokeStyle = soft;
  ctx.lineWidth = 1;
  ctx.strokeRect(Math.round(x + 12) + 0.5, Math.round(y + 12) + 0.5, Math.round(width - 25), Math.round(height - 25));
  drawCorner(ctx, x + 8, y + 8, 18, accent, "tl");
  drawCorner(ctx, x + width - 8, y + 8, 18, accent, "tr");
  drawCorner(ctx, x + 8, y + height - 8, 18, accent, "bl");
  drawCorner(ctx, x + width - 8, y + height - 8, 18, accent, "br");
}

function drawCorner(ctx, x, y, size, color, corner) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (corner === "tl") {
    ctx.moveTo(x, y + size);
    ctx.lineTo(x, y);
    ctx.lineTo(x + size, y);
  } else if (corner === "tr") {
    ctx.moveTo(x - size, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + size);
  } else if (corner === "bl") {
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y);
    ctx.lineTo(x + size, y);
  } else {
    ctx.moveTo(x - size, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y - size);
  }
  ctx.stroke();
  ctx.restore();
}

function drawForestLeaf(ctx, x, y, accent, direction) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);
  ctx.fillStyle = "rgba(41, 78, 37, 0.82)";
  ctx.beginPath();
  ctx.ellipse(0, 0, 5, 2.5, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.globalAlpha *= 0.5;
  ctx.beginPath();
  ctx.ellipse(6, 4, 4, 2, 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function pixelRect(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(width)), Math.max(1, Math.round(height)));
}

export function drawHud(ctx, state, abilityInfo) {
  const { viewport, player } = state;

  drawBars(ctx, player);
  drawAbilitySlots(ctx, viewport, player, abilityInfo);
  drawEndState(ctx, state);
}

function drawBars(ctx, player) {
  const x = 22;
  const y = 20;
  const width = 250;
  const height = 16;

  drawMeter(ctx, x, y, width, height, player.hp / player.maxHp, "#6b222a", "#e45757", "HP");
  drawMeter(ctx, x, y + 28, width, height, player.spirit / player.maxSpirit, "#17364a", "#55c7f0", "Spirit");
}

function drawMeter(ctx, x, y, width, height, ratio, backColor, fillColor, label) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.44)";
  ctx.fillRect(x - 3, y - 3, width + 6, height + 6);
  ctx.fillStyle = backColor;
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = fillColor;
  ctx.fillRect(x, y, Math.max(0, Math.min(1, ratio)) * width, height);

  ctx.font = "700 12px Segoe UI, Arial";
  ctx.fillStyle = "#f6fff1";
  ctx.fillText(label, x + 8, y + 12);
}

function drawAbilitySlots(ctx, viewport, player, abilityInfo) {
  const abilities = [
    ["staff", "#f0d17b"],
    ["bolt", "#69dbff"],
    ["dash", "#a6efdc"],
    ["root", "#83df70"],
  ];
  const slotW = 122;
  const slotH = 42;
  const gap = 8;
  const totalW = abilities.length * slotW + (abilities.length - 1) * gap;
  const startX = Math.max(16, viewport.width / 2 - totalW / 2);
  const y = Math.max(86, viewport.height - 62);

  for (let i = 0; i < abilities.length; i += 1) {
    const [name, color] = abilities[i];
    const info = abilityInfo[name];
    const x = startX + i * (slotW + gap);
    const cooldown = player.cooldowns[name];
    const ready = cooldown <= 0 && player.spirit >= info.cost;
    const ratio = info.cooldown > 0 ? Math.min(1, cooldown / info.cooldown) : 0;

    ctx.fillStyle = ready ? "rgba(8, 20, 14, 0.78)" : "rgba(8, 12, 12, 0.84)";
    ctx.fillRect(x, y, slotW, slotH);

    ctx.fillStyle = color;
    ctx.fillRect(x, y, 5, slotH);

    if (ratio > 0) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
      ctx.fillRect(x, y, slotW * ratio, slotH);
    }

    if (info.cost > 0 && player.spirit < info.cost) {
      ctx.fillStyle = "rgba(40, 70, 80, 0.45)";
      ctx.fillRect(x, y, slotW, slotH);
    }

    ctx.font = "700 12px Segoe UI, Arial";
    ctx.fillStyle = "#f7fff1";
    ctx.fillText(info.key, x + 14, y + 16);
    ctx.font = "12px Segoe UI, Arial";
    ctx.fillText(info.label, x + 14, y + 32);
  }
}

function drawEndState(ctx, state) {
  if (!state.areaCleared && !state.gameOver) return;

  const { viewport } = state;
  const panelW = 330;
  const panelH = 104;
  const x = viewport.width / 2 - panelW / 2;
  const y = viewport.height / 2 - panelH / 2;

  ctx.fillStyle = "rgba(0, 0, 0, 0.68)";
  ctx.fillRect(x, y, panelW, panelH);

  ctx.textAlign = "center";
  ctx.font = "700 28px Segoe UI, Arial";
  ctx.fillStyle = state.areaCleared ? "#dfffd3" : "#ffd5cd";
  ctx.fillText(state.areaCleared ? "Area Cleansed" : "Ayla Has Fallen", viewport.width / 2, y + 44);

  ctx.font = "15px Segoe UI, Arial";
  ctx.fillStyle = "#eff7e8";
  ctx.fillText("Press R to restart", viewport.width / 2, y + 74);
  ctx.textAlign = "left";
}

export function drawHud(ctx, state, abilityInfo) {
  const { viewport, player } = state;

  drawBars(ctx, player);
  drawEncounterInfo(ctx, state);
  drawBossBar(ctx, state);
  drawAbilitySlots(ctx, viewport, player, abilityInfo);
  drawBanner(ctx, state);
  drawEndState(ctx, state);
}

function drawBars(ctx, player) {
  const x = 20;
  const y = 18;
  const width = 220;
  const height = 14;

  drawMeter(ctx, x, y, width, height, player.hp / player.maxHp, "#522127", "#e36f67", "HP");
  drawMeter(ctx, x, y + 24, width, height, player.spirit / player.maxSpirit, "#1a394c", "#61ccef", "Spirit");
}

function drawMeter(ctx, x, y, width, height, ratio, backColor, fillColor, label) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.54)";
  ctx.fillRect(x - 4, y - 4, width + 8, height + 8);
  ctx.fillStyle = "#0d140f";
  ctx.fillRect(x - 2, y - 2, width + 4, height + 4);
  ctx.fillStyle = backColor;
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = fillColor;
  ctx.fillRect(x, y, Math.max(0, Math.min(1, ratio)) * width, height);

  ctx.font = "700 11px Segoe UI, Arial";
  ctx.fillStyle = "#f5f4e7";
  ctx.fillText(label, x + 6, y + 11);
}

function drawEncounterInfo(ctx, state) {
  if (state.areaCleared || state.gameOver) return;

  const encounter = state.encounter;
  const x = state.viewport.width - 252;
  const y = 18;
  const aliveThreats = state.enemies.length + encounter.spawnQueue.length + (state.boss && !state.boss.dead ? 1 : 0);
  const displayedWave =
    encounter.phase === "waveIntro"
      ? 1
      : encounter.phase === "intermission"
        ? Math.min(encounter.totalWaves, encounter.waveIndex + 2)
        : Math.min(encounter.totalWaves, encounter.waveIndex + 1);
  const waveLabel =
    encounter.phase === "boss" || encounter.phase === "bossIntro" || (state.boss && !state.boss.dead)
      ? "Boss"
      : `Wave ${displayedWave}/${encounter.totalWaves}`;

  ctx.fillStyle = "rgba(0, 0, 0, 0.56)";
  ctx.fillRect(x, y, 232, 70);
  ctx.fillStyle = "#0d140f";
  ctx.fillRect(x + 4, y + 4, 224, 62);

  ctx.fillStyle = "#f6fff1";
  ctx.font = "700 14px Segoe UI, Arial";
  ctx.fillText(encounter.title, x + 12, y + 20);
  ctx.font = "12px Segoe UI, Arial";
  ctx.fillStyle = "#c9ddbe";
  ctx.fillText(encounter.regionName, x + 12, y + 38);
  ctx.fillStyle = "#fff5cf";
  ctx.fillText(waveLabel, x + 12, y + 56);
  ctx.fillText(`Threats ${aliveThreats}`, x + 124, y + 56);
}

function drawBossBar(ctx, state) {
  const showBossBar =
    state.encounter.phase === "bossIntro" ||
    (state.boss && (!state.boss.dead || state.areaCleared));

  if (!showBossBar) return;

  const width = 360;
  const height = 16;
  const x = state.viewport.width / 2 - width / 2;
  const y = 18;
  const boss = state.boss;
  const ratio = boss ? Math.max(0, boss.hp / boss.maxHp) : 1;

  ctx.fillStyle = "rgba(0, 0, 0, 0.56)";
  ctx.fillRect(x - 4, y - 18, width + 8, height + 24);
  ctx.fillStyle = "#0d140f";
  ctx.fillRect(x - 2, y - 16, width + 4, height + 20);
  ctx.fillStyle = "#4f1b17";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#db6748";
  ctx.fillRect(x, y, width * ratio, height);

  ctx.textAlign = "center";
  ctx.fillStyle = "#fff4d4";
  ctx.font = "700 13px Segoe UI, Arial";
  ctx.fillText("Heart Guardian", state.viewport.width / 2, y - 4);
  ctx.textAlign = "left";
}

function drawAbilitySlots(ctx, viewport, player, abilityInfo) {
  const abilities = [
    ["staff", "#f2d07a"],
    ["bolt", "#74ddff"],
    ["dash", "#b7f0dd"],
    ["root", "#8ce36d"],
  ];
  const slotW = 116;
  const slotH = 42;
  const gap = 8;
  const totalW = abilities.length * slotW + (abilities.length - 1) * gap;
  const startX = Math.max(16, viewport.width / 2 - totalW / 2);
  const y = Math.max(84, viewport.height - 60);

  for (let i = 0; i < abilities.length; i += 1) {
    const [name, color] = abilities[i];
    const info = abilityInfo[name];
    const x = startX + i * (slotW + gap);
    const cooldown = player.cooldowns[name];
    const ratio = info.cooldown > 0 ? Math.min(1, cooldown / info.cooldown) : 0;

    ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
    ctx.fillRect(x, y, slotW, slotH);
    ctx.fillStyle = "#0d140f";
    ctx.fillRect(x + 2, y + 2, slotW - 4, slotH - 4);
    ctx.fillStyle = color;
    ctx.fillRect(x + 2, y + 2, 5, slotH - 4);

    if (ratio > 0) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.46)";
      ctx.fillRect(x + 2, y + 2, (slotW - 4) * ratio, slotH - 4);
    }

    if (info.cost > 0 && player.spirit < info.cost) {
      ctx.fillStyle = "rgba(25, 50, 60, 0.45)";
      ctx.fillRect(x + 2, y + 2, slotW - 4, slotH - 4);
    }

    ctx.font = "700 11px Segoe UI, Arial";
    ctx.fillStyle = "#f7fff1";
    ctx.fillText(info.key, x + 16, y + 16);
    ctx.font = "12px Segoe UI, Arial";
    ctx.fillText(info.label, x + 16, y + 31);
  }
}

function drawBanner(ctx, state) {
  if (state.encounter.bannerTimer <= 0) return;

  const alpha = Math.min(1, state.encounter.bannerTimer / 0.5);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.font = "700 22px Segoe UI, Arial";
  ctx.fillStyle = "#fff8cf";
  ctx.fillText(state.encounter.bannerText, state.viewport.width / 2, 106);
  ctx.restore();
  ctx.textAlign = "left";
}

function drawEndState(ctx, state) {
  if (!state.areaCleared && !state.gameOver) return;

  const { viewport } = state;
  const panelW = 400;
  const panelH = 114;
  const x = viewport.width / 2 - panelW / 2;
  const y = viewport.height / 2 - panelH / 2;
  const title = state.areaCleared ? state.encounter.completionText : "Ayla Has Fallen";
  const prompt = "Press R or Enter to play the clearing again";

  ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
  ctx.fillRect(x, y, panelW, panelH);
  ctx.fillStyle = "#0d140f";
  ctx.fillRect(x + 4, y + 4, panelW - 8, panelH - 8);

  ctx.textAlign = "center";
  ctx.font = "700 28px Segoe UI, Arial";
  ctx.fillStyle = state.areaCleared ? "#dfffd3" : "#ffd5cd";
  ctx.fillText(title, viewport.width / 2, y + 42);

  ctx.font = "15px Segoe UI, Arial";
  ctx.fillStyle = "#eff7e8";
  ctx.fillText(prompt, viewport.width / 2, y + 76);
  ctx.textAlign = "left";
}

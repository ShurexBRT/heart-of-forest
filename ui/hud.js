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

function drawEncounterInfo(ctx, state) {
  if (state.areaCleared || state.gameOver) return;

  const encounter = state.encounter;
  const x = state.viewport.width - 254;
  const y = 20;
  const aliveThreats = state.enemies.length + encounter.spawnQueue.length + (state.boss && !state.boss.dead ? 1 : 0);
  const displayedWave =
    encounter.phase === "waveIntro"
      ? 1
      : encounter.phase === "intermission"
        ? Math.min(encounter.totalWaves, encounter.waveIndex + 2)
        : Math.min(encounter.totalWaves, encounter.waveIndex + 1);
  const waveLabel =
    encounter.phase === "boss" || encounter.phase === "bossIntro" || (state.boss && !state.boss.dead)
      ? "Boss Encounter"
      : `Wave ${displayedWave}/${encounter.totalWaves}`;

  ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
  ctx.fillRect(x, y, 228, 72);
  ctx.fillStyle = "#f6fff1";
  ctx.font = "700 13px Segoe UI, Arial";
  ctx.fillText(encounter.title, x + 12, y + 18);
  ctx.font = "12px Segoe UI, Arial";
  ctx.fillStyle = "rgba(246,255,241,0.82)";
  ctx.fillText(encounter.regionName, x + 12, y + 34);
  ctx.fillStyle = "#f6fff1";
  ctx.fillText(waveLabel, x + 12, y + 52);
  ctx.fillText(`Threats ${aliveThreats}`, x + 132, y + 52);
}

function drawBossBar(ctx, state) {
  const showBossBar =
    state.encounter.phase === "bossIntro" ||
    (state.boss && (!state.boss.dead || state.areaCleared));

  if (!showBossBar) return;

  const width = 360;
  const height = 18;
  const x = state.viewport.width / 2 - width / 2;
  const y = 22;
  const boss = state.boss;
  const ratio = boss ? Math.max(0, boss.hp / boss.maxHp) : 1;

  ctx.fillStyle = "rgba(0, 0, 0, 0.52)";
  ctx.fillRect(x - 4, y - 18, width + 8, height + 24);
  ctx.fillStyle = "#4f1b17";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#db6748";
  ctx.fillRect(x, y, width * ratio, height);

  ctx.textAlign = "center";
  ctx.fillStyle = "#fff4d4";
  ctx.font = "700 14px Segoe UI, Arial";
  ctx.fillText("Heart Guardian", state.viewport.width / 2, y - 4);
  ctx.textAlign = "left";
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

function drawBanner(ctx, state) {
  if (state.encounter.bannerTimer <= 0) return;

  const alpha = Math.min(1, state.encounter.bannerTimer / 0.5);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.font = "700 24px Segoe UI, Arial";
  ctx.fillStyle = "#f7f7d8";
  ctx.fillText(state.encounter.bannerText, state.viewport.width / 2, 104);
  ctx.restore();
  ctx.textAlign = "left";
}

function drawEndState(ctx, state) {
  if (!state.areaCleared && !state.gameOver) return;

  const { viewport } = state;
  const panelW = 390;
  const panelH = 120;
  const x = viewport.width / 2 - panelW / 2;
  const y = viewport.height / 2 - panelH / 2;
  const title = state.areaCleared ? state.encounter.completionText : "Ayla Has Fallen";
  const prompt = state.areaCleared ? "Press Enter to return to the region map" : "Press R to retreat to the region map";

  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(x, y, panelW, panelH);

  ctx.textAlign = "center";
  ctx.font = "700 28px Segoe UI, Arial";
  ctx.fillStyle = state.areaCleared ? "#dfffd3" : "#ffd5cd";
  ctx.fillText(title, viewport.width / 2, y + 44);

  ctx.font = "15px Segoe UI, Arial";
  ctx.fillStyle = "#eff7e8";
  ctx.fillText(prompt, viewport.width / 2, y + 78);
  ctx.textAlign = "left";
}

export function drawHud(ctx, state, abilityInfo) {
  drawBars(ctx, state.player);
  drawSceneInfo(ctx, state);
  drawBossBar(ctx, state);
  drawQuestPanel(ctx, state);
  drawAbilitySlots(ctx, state.viewport, state.player, abilityInfo);
  drawBanner(ctx, state);
  drawInteractionPrompt(ctx, state);
  drawExitPrompt(ctx, state);
  drawToast(ctx, state);
  drawDialogue(ctx, state);
  drawTransitionOverlay(ctx, state);
  drawEndState(ctx, state);
}

function drawBars(ctx, player) {
  drawMeter(ctx, 20, 18, 220, 14, player.hp / player.maxHp, "#522127", "#e36f67", "HP");
  drawMeter(ctx, 20, 42, 220, 14, player.spirit / player.maxSpirit, "#1a394c", "#61ccef", "Spirit");
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

function drawSceneInfo(ctx, state) {
  if (state.gameOver) return;

  const encounter = state.encounter;
  const x = state.viewport.width - 284;
  const y = 18;
  const cleared = Boolean(state.sceneProgress?.[state.currentSceneId]?.cleared);
  const aliveThreats =
    state.enemies.length + encounter.spawnQueue.length + (state.boss && !state.boss.dead ? 1 : 0);
  let phaseLabel = cleared ? "Area Secure" : `Threats ${aliveThreats}`;

  if (
    encounter.phase === "boss" ||
    encounter.phase === "bossIntro" ||
    (state.boss && !state.boss.dead)
  ) {
    phaseLabel = state.scene.bossName || "Boss Fight";
  } else if (!cleared && encounter.totalWaves > 0) {
    const displayedWave =
      encounter.phase === "waveIntro"
        ? 1
        : encounter.phase === "intermission"
          ? Math.min(encounter.totalWaves, encounter.waveIndex + 2)
          : Math.min(encounter.totalWaves, encounter.waveIndex + 1);
    phaseLabel = `Wave ${displayedWave}/${encounter.totalWaves}  |  Threats ${aliveThreats}`;
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
  ctx.fillRect(x, y, 256, 74);
  ctx.fillStyle = "#0d140f";
  ctx.fillRect(x + 4, y + 4, 248, 66);
  ctx.fillStyle = "#f6fff1";
  ctx.font = "700 16px Segoe UI, Arial";
  ctx.fillText(state.scene.title, x + 12, y + 22);
  ctx.font = "12px Segoe UI, Arial";
  ctx.fillStyle = "#c9ddbe";
  ctx.fillText(state.scene.regionName, x + 12, y + 40);
  ctx.fillStyle = "#fff5cf";
  ctx.fillText(phaseLabel, x + 12, y + 58);
}

function drawBossBar(ctx, state) {
  if (!(state.encounter.phase === "bossIntro" || (state.boss && (!state.boss.dead || state.areaCleared)))) {
    return;
  }

  const width = 420;
  const height = 16;
  const x = state.viewport.width / 2 - width / 2;
  const y = 18;
  const boss = state.boss;
  const ratio = boss ? Math.max(0, boss.hp / boss.maxHp) : 1;

  ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
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
  ctx.fillText(state.scene.bossName || "Elder Hollow", state.viewport.width / 2, y - 4);
  ctx.textAlign = "left";
}

function drawQuestPanel(ctx, state) {
  const quests = state.activeQuests || [];
  if (quests.length === 0) return;

  const x = 20;
  const y = 88;
  const width = 300;
  const height = Math.min(quests.length, 3) * 58 + 18;

  ctx.fillStyle = "rgba(0, 0, 0, 0.56)";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#0d140f";
  ctx.fillRect(x + 4, y + 4, width - 8, height - 8);
  ctx.fillStyle = "#f6fff1";
  ctx.font = "700 13px Segoe UI, Arial";
  ctx.fillText("Quest Log", x + 12, y + 18);

  let cursorY = y + 36;
  for (const quest of quests.slice(0, 3)) {
    ctx.fillStyle = quest.status === "complete" ? "#c8f7b1" : "#fff1c6";
    ctx.font = "700 12px Segoe UI, Arial";
    ctx.fillText(quest.title, x + 12, cursorY);
    cursorY += 14;

    ctx.fillStyle = "rgba(246,255,241,0.76)";
    ctx.font = "11px Segoe UI, Arial";
    const objective = quest.objectives[0];
    const objectiveText = objective
      ? `${objective.label}: ${Math.min(objective.current, objective.required)}/${objective.required}`
      : quest.description;
    ctx.fillText(objectiveText, x + 12, cursorY);
    cursorY += 22;
  }
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
  ctx.fillText(state.encounter.bannerText, state.viewport.width / 2, 112);
  ctx.restore();
  ctx.textAlign = "left";
}

function drawInteractionPrompt(ctx, state) {
  if (!state.story.focus || state.story.dialogue || state.gameOver) return;

  const panelW = 244;
  const panelH = 42;
  const x = state.viewport.width / 2 - panelW / 2;
  const y = state.viewport.height - 146;

  ctx.fillStyle = "rgba(0, 0, 0, 0.64)";
  ctx.fillRect(x, y, panelW, panelH);
  ctx.fillStyle = "#0d140f";
  ctx.fillRect(x + 4, y + 4, panelW - 8, panelH - 8);
  ctx.font = "700 14px Segoe UI, Arial";
  ctx.fillStyle = "#fff6d0";
  ctx.fillText(`E  ${state.story.prompt}`, x + 16, y + 24);
}

function drawExitPrompt(ctx, state) {
  if (!state.nearExit || state.gameOver || state.story.dialogue) return;

  const panelW = 316;
  const panelH = 60;
  const x = state.viewport.width / 2 - panelW / 2;
  const y = Math.max(100, state.viewport.height - 136);
  const progress = Math.max(0, Math.min(1, state.exitCharge));

  ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
  ctx.fillRect(x, y, panelW, panelH);
  ctx.fillStyle = "#0d140f";
  ctx.fillRect(x + 4, y + 4, panelW - 8, panelH - 8);
  ctx.font = "700 15px Segoe UI, Arial";
  ctx.fillStyle = "#fff6d0";
  ctx.fillText(`Travel to ${state.nearExit.label}`, x + 16, y + 22);
  ctx.font = "12px Segoe UI, Arial";
  ctx.fillStyle = "#d8e8cc";
  ctx.fillText("Stand on the path for a moment", x + 16, y + 40);
  ctx.fillStyle = "#1b1412";
  ctx.fillRect(x + 16, y + 46, panelW - 32, 8);
  ctx.fillStyle = "#fff0ad";
  ctx.fillRect(x + 18, y + 48, Math.round((panelW - 36) * progress), 4);
}

function drawToast(ctx, state) {
  if (!state.story.toastText || state.story.toastTimer <= 0) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1, state.story.toastTimer / 0.35);
  ctx.fillStyle = "rgba(0, 0, 0, 0.64)";
  ctx.fillRect(state.viewport.width / 2 - 150, 136, 300, 32);
  ctx.fillStyle = "#fff1c6";
  ctx.font = "700 13px Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.fillText(state.story.toastText, state.viewport.width / 2, 157);
  ctx.restore();
  ctx.textAlign = "left";
}

function drawDialogue(ctx, state) {
  const dialogue = state.story.dialogue;
  if (!dialogue) return;

  const x = 56;
  const y = state.viewport.height - 182;
  const width = state.viewport.width - 112;
  const height = 108;

  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#0d140f";
  ctx.fillRect(x + 4, y + 4, width - 8, height - 8);
  ctx.fillStyle = "#fff6d0";
  ctx.font = "700 16px Segoe UI, Arial";
  ctx.fillText(dialogue.speakerName, x + 18, y + 24);
  ctx.fillStyle = "#eff7e8";
  ctx.font = "14px Segoe UI, Arial";
  wrapText(ctx, dialogue.lines[dialogue.index], x + 18, y + 48, width - 36, 20);
  ctx.fillStyle = "rgba(255, 246, 208, 0.72)";
  ctx.font = "12px Segoe UI, Arial";
  ctx.fillText("E / Enter / Space", x + width - 134, y + height - 16);
}

function drawTransitionOverlay(ctx, state) {
  if (!state.transition.active) return;

  const ratio = Math.max(0, Math.min(1, state.transition.timer / state.transition.duration));
  const alpha = 0.18 + ratio * 0.72;

  ctx.save();
  ctx.fillStyle = `rgba(8, 10, 8, ${alpha})`;
  ctx.fillRect(0, 0, state.viewport.width, state.viewport.height);
  ctx.textAlign = "center";
  ctx.font = "700 28px Segoe UI, Arial";
  ctx.fillStyle = `rgba(255, 244, 208, ${Math.min(1, 0.35 + ratio)})`;
  ctx.fillText(`Entering ${state.transition.label}`, state.viewport.width / 2, state.viewport.height / 2);
  ctx.font = "13px Segoe UI, Arial";
  ctx.fillStyle = `rgba(222, 239, 210, ${Math.min(1, 0.2 + ratio)})`;
  ctx.fillText("The forest shifts under Ayla's feet", state.viewport.width / 2, state.viewport.height / 2 + 28);
  ctx.restore();
  ctx.textAlign = "left";
}

function drawEndState(ctx, state) {
  if (!state.gameOver) return;

  const panelW = 420;
  const panelH = 114;
  const x = state.viewport.width / 2 - panelW / 2;
  const y = state.viewport.height / 2 - panelH / 2;

  ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
  ctx.fillRect(x, y, panelW, panelH);
  ctx.fillStyle = "#0d140f";
  ctx.fillRect(x + 4, y + 4, panelW - 8, panelH - 8);
  ctx.textAlign = "center";
  ctx.font = "700 28px Segoe UI, Arial";
  ctx.fillStyle = "#ffd5cd";
  ctx.fillText("Ayla Has Fallen", state.viewport.width / 2, y + 42);
  ctx.font = "15px Segoe UI, Arial";
  ctx.fillStyle = "#eff7e8";
  ctx.fillText(`Press R or Enter to return to ${state.scene.title}`, state.viewport.width / 2, y + 76);
  ctx.textAlign = "left";
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line) ctx.fillText(line, x, currentY);
}

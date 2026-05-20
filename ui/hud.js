import { EQUIPMENT_SLOTS, TALENT_DEFS } from "../data/gameData.js";
import {
  getEquippedItems,
  getInventoryEntries,
  getPlayerBonuses,
  getQuestCounter,
  getUnlockedTalentList,
  getXpProgress,
} from "../systems/progression.js";
import { getAylaPortrait } from "../rendering/atlasAssets.js";

export function drawHud(ctx, state, abilityInfo) {
  drawSceneInfo(ctx, state);
  drawBossBar(ctx, state);
  drawQuestTracker(ctx, state);
  drawBottomHud(ctx, state, abilityInfo);
  drawBanner(ctx, state);
  drawInteractionPrompt(ctx, state);
  drawExitPrompt(ctx, state);
  drawToast(ctx, state);
  if (state.ui.questLogOpen) drawQuestLogOverlay(ctx, state);
  if (state.ui.menuOpen) drawCharacterOverlay(ctx, state);
  drawDialogue(ctx, state);
  drawTransitionOverlay(ctx, state);
  drawEndState(ctx, state);
}

function drawBottomHud(ctx, state, abilityInfo) {
  const { width, height } = state.viewport;
  const panelW = 640;
  const panelH = 124;
  const x = width / 2 - panelW / 2;
  const y = height - panelH - 16;
  const xp = getXpProgress(state.progression);
  const healthPotions = state.progression.inventory.health_potion || 0;
  const spiritTonics = state.progression.inventory.spirit_tonic || 0;

  ctx.fillStyle = "rgba(5, 8, 12, 0.84)";
  ctx.fillRect(x, y, panelW, panelH);
  ctx.fillStyle = "#11171f";
  ctx.fillRect(x + 6, y + 6, panelW - 12, panelH - 12);

  drawOrb(ctx, x + 78, y + 58, 46, state.player.hp / state.player.maxHp, "#8d242b", "#ef6b62");
  drawOrb(ctx, x + panelW - 78, y + 58, 46, state.player.spirit / state.player.maxSpirit, "#173f67", "#6ad8ff");

  ctx.fillStyle = "#f7ead0";
  ctx.font = "700 12px Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.fillText(`${Math.round(state.player.hp)}/${state.player.maxHp}`, x + 78, y + 64);
  ctx.fillText(`${Math.round(state.player.spirit)}/${state.player.maxSpirit}`, x + panelW - 78, y + 64);
  ctx.textAlign = "left";

  drawAbilitySlots(ctx, x + 156, y + 18, state.player, abilityInfo);
  drawPotionSlots(ctx, x + 176, y + 84, healthPotions, spiritTonics);

  ctx.fillStyle = "#f3ddb7";
  ctx.font = "700 14px Segoe UI, Arial";
  ctx.fillText(`Level ${xp.level}`, x + panelW / 2 - 30, y + 102);

  drawXpBar(ctx, x + 146, y + panelH - 18, panelW - 292, xp.ratio, `${xp.xp}/${xp.nextLevelXp}`);

  ctx.fillStyle = "rgba(228, 238, 214, 0.78)";
  ctx.font = "11px Segoe UI, Arial";
  ctx.fillText("Q Quest Log  |  C Character  |  I Inventory  |  T Talents", x + 16, y + panelH - 28);
}

function drawOrb(ctx, cx, cy, radius, ratio, dark, light) {
  ctx.fillStyle = "#05070a";
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#2a313d";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.fillStyle = dark;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.fillStyle = light;
  const fillHeight = Math.round(radius * 2 * Math.max(0, Math.min(1, ratio)));
  ctx.fillRect(cx - radius, cy + radius - fillHeight, radius * 2, fillHeight);
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.beginPath();
  ctx.ellipse(cx - radius * 0.24, cy - radius * 0.34, radius * 0.44, radius * 0.24, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawAbilitySlots(ctx, startX, y, player, abilityInfo) {
  const abilities = [
    ["staff", "#f2d07a"],
    ["bolt", "#74ddff"],
    ["dash", "#b7f0dd"],
    ["root", "#8ce36d"],
  ];
  const slotW = 76;
  const slotH = 54;
  const gap = 10;

  for (let i = 0; i < abilities.length; i += 1) {
    const [name, color] = abilities[i];
    const info = abilityInfo[name];
    const x = startX + i * (slotW + gap);
    const cooldown = player.cooldowns[name];
    const ratio = info.cooldown > 0 ? Math.min(1, cooldown / info.cooldown) : 0;

    ctx.fillStyle = "rgba(0, 0, 0, 0.64)";
    ctx.fillRect(x, y, slotW, slotH);
    ctx.fillStyle = "#10161d";
    ctx.fillRect(x + 3, y + 3, slotW - 6, slotH - 6);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3, y + 3, slotW - 6, slotH - 6);

    if (ratio > 0) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
      ctx.fillRect(x + 3, y + 3, slotW - 6, (slotH - 6) * ratio);
    }

    if (info.cost > 0 && player.spirit < info.cost) {
      ctx.fillStyle = "rgba(27, 51, 68, 0.46)";
      ctx.fillRect(x + 3, y + 3, slotW - 6, slotH - 6);
    }

    ctx.fillStyle = "#f7fff1";
    ctx.font = "700 16px Segoe UI, Arial";
    ctx.fillText(info.key, x + 10, y + 22);
    ctx.font = "12px Segoe UI, Arial";
    ctx.fillStyle = "#d7e4cf";
    ctx.fillText(info.label, x + 10, y + 40);
  }
}

function drawPotionSlots(ctx, x, y, healthPotions, spiritTonics) {
  const slots = [
    { key: "5", label: "Health", count: healthPotions, color: "#df6a67" },
    { key: "6", label: "Spirit", count: spiritTonics, color: "#6ecff7" },
  ];

  for (let index = 0; index < slots.length; index += 1) {
    const slot = slots[index];
    const slotX = x + index * 110;
    ctx.fillStyle = "rgba(0,0,0,0.56)";
    ctx.fillRect(slotX, y, 92, 28);
    ctx.fillStyle = "#10161d";
    ctx.fillRect(slotX + 2, y + 2, 88, 24);
    ctx.fillStyle = slot.color;
    ctx.fillRect(slotX + 4, y + 4, 12, 20);
    ctx.fillStyle = "#f6ead0";
    ctx.font = "700 12px Segoe UI, Arial";
    ctx.fillText(slot.key, slotX + 22, y + 14);
    ctx.font = "11px Segoe UI, Arial";
    ctx.fillStyle = "#dce6d6";
    ctx.fillText(`${slot.label} x${slot.count}`, slotX + 22, y + 24);
  }
}

function drawXpBar(ctx, x, y, width, ratio, label) {
  ctx.fillStyle = "#090d12";
  ctx.fillRect(x, y, width, 8);
  ctx.fillStyle = "#53346b";
  ctx.fillRect(x + 1, y + 1, (width - 2) * Math.max(0, Math.min(1, ratio)), 6);
  ctx.fillStyle = "#dcd0f1";
  ctx.font = "10px Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.fillText(label, x + width / 2, y - 4);
  ctx.textAlign = "left";
}

function drawSceneInfo(ctx, state) {
  if (state.gameOver) return;

  const encounter = state.encounter;
  const x = state.viewport.width - 302;
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

  ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
  ctx.fillRect(x, y, 270, 78);
  ctx.fillStyle = "#10161d";
  ctx.fillRect(x + 4, y + 4, 262, 70);
  ctx.fillStyle = "#f6fff1";
  ctx.font = "700 16px Segoe UI, Arial";
  ctx.fillText(state.scene.title, x + 12, y + 22);
  ctx.font = "12px Segoe UI, Arial";
  ctx.fillStyle = "#c9ddbe";
  ctx.fillText(state.scene.regionName, x + 12, y + 40);
  ctx.fillStyle = "#fff5cf";
  ctx.fillText(phaseLabel, x + 12, y + 58);

  if (state.combatTimer <= 0 && state.player.hp < state.player.maxHp) {
    ctx.fillStyle = "#96dda5";
    ctx.fillText("Regenerating", x + 166, y + 58);
  }
}

function drawBossBar(ctx, state) {
  if (!(state.encounter.phase === "bossIntro" || (state.boss && (!state.boss.dead || state.areaCleared)))) {
    return;
  }

  const width = 460;
  const height = 18;
  const x = state.viewport.width / 2 - width / 2;
  const y = 18;
  const boss = state.boss;
  const ratio = boss ? Math.max(0, boss.hp / boss.maxHp) : 1;

  ctx.fillStyle = "rgba(0, 0, 0, 0.68)";
  ctx.fillRect(x - 6, y - 18, width + 12, height + 28);
  ctx.fillStyle = "#10161d";
  ctx.fillRect(x - 3, y - 15, width + 6, height + 22);
  ctx.fillStyle = "#42150f";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#db6748";
  ctx.fillRect(x, y, width * ratio, height);

  ctx.textAlign = "center";
  ctx.fillStyle = "#fff4d4";
  ctx.font = "700 13px Segoe UI, Arial";
  ctx.fillText(state.scene.bossName || "Elder Hollow", state.viewport.width / 2, y - 4);
  ctx.textAlign = "left";
}

function drawQuestTracker(ctx, state) {
  if (state.ui.questLogOpen) return;

  const quests = (state.activeQuests || []).filter((quest) => quest.status !== "done");
  if (quests.length === 0) return;

  const x = 20;
  const y = 98;
  const width = 320;
  const height = Math.min(quests.length, 3) * 60 + 18;

  ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#10161d";
  ctx.fillRect(x + 4, y + 4, width - 8, height - 8);
  ctx.fillStyle = "#f6fff1";
  ctx.font = "700 13px Segoe UI, Arial";
  ctx.fillText("Active Quests", x + 12, y + 18);

  let cursorY = y + 38;
  for (const quest of quests.slice(0, 3)) {
    const objective = quest.objectives.find((entry) => entry.current < entry.required) || quest.objectives[0];
    ctx.fillStyle = "#fff1c6";
    ctx.font = "700 12px Segoe UI, Arial";
    ctx.fillText(quest.title, x + 12, cursorY);
    cursorY += 15;
    ctx.fillStyle = "rgba(246,255,241,0.78)";
    ctx.font = "11px Segoe UI, Arial";
    ctx.fillText(
      objective
        ? `${objective.label}: ${Math.min(objective.current, objective.required)}/${objective.required}`
        : quest.description,
      x + 12,
      cursorY
    );
    cursorY += 24;
  }
}

function drawQuestLogOverlay(ctx, state) {
  const quests = state.activeQuests || [];
  const x = 56;
  const y = 84;
  const width = state.viewport.width - 112;
  const height = state.viewport.height - 180;

  ctx.fillStyle = "rgba(0, 0, 0, 0.82)";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#10161d";
  ctx.fillRect(x + 6, y + 6, width - 12, height - 12);
  ctx.fillStyle = "#f6fff1";
  ctx.font = "700 22px Segoe UI, Arial";
  ctx.fillText("Quest Log", x + 18, y + 28);
  ctx.font = "12px Segoe UI, Arial";
  ctx.fillStyle = "#d3e1cf";
  ctx.fillText("Q / Esc to close", x + width - 112, y + 28);

  if (quests.length === 0) {
    ctx.fillStyle = "#d7e4cf";
    ctx.font = "15px Segoe UI, Arial";
    ctx.fillText("No active quests yet.", x + 18, y + 70);
    return;
  }

  let cursorY = y + 66;
  quests.forEach((quest, index) => {
    const selected = index === state.ui.selectedQuestIndex;
    ctx.fillStyle = selected ? "rgba(116, 191, 255, 0.16)" : "rgba(0, 0, 0, 0.28)";
    ctx.fillRect(x + 14, cursorY - 18, width - 28, 72);
    ctx.fillStyle = quest.status === "done" ? "#9de1a3" : quest.status === "complete" ? "#ffdc9c" : "#fff1c6";
    ctx.font = "700 14px Segoe UI, Arial";
    ctx.fillText(quest.title, x + 26, cursorY);
    ctx.fillStyle = "#d8e6d4";
    ctx.font = "12px Segoe UI, Arial";
    wrapText(ctx, quest.description, x + 26, cursorY + 18, width - 60, 16);

    let objectiveY = cursorY + 42;
    for (const objective of quest.objectives) {
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillText(
        `${objective.label}: ${Math.min(objective.current, objective.required)}/${objective.required}`,
        x + 26,
        objectiveY
      );
      objectiveY += 14;
    }
    cursorY += 92;
  });
}

function drawCharacterOverlay(ctx, state) {
  const x = 68;
  const y = 70;
  const width = state.viewport.width - 136;
  const height = state.viewport.height - 150;
  const portrait = getAylaPortrait();
  const bonuses = getPlayerBonuses(state.progression);

  ctx.fillStyle = "rgba(0, 0, 0, 0.86)";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#10161d";
  ctx.fillRect(x + 6, y + 6, width - 12, height - 12);
  ctx.fillStyle = "#f6ead0";
  ctx.font = "700 24px Segoe UI, Arial";
  ctx.fillText("Ayla", x + 18, y + 30);
  ctx.font = "12px Segoe UI, Arial";
  ctx.fillStyle = "#d7e4cf";
  ctx.fillText("C / I / T switch tabs  |  Esc closes", x + width - 212, y + 28);

  drawTabs(ctx, state, x + 18, y + 48);

  if (portrait) {
    ctx.drawImage(portrait, x + 18, y + 86, 176, 200);
  }

  if (state.ui.activeTab === "character") {
    drawCharacterTab(ctx, state, x, y, width, height, bonuses);
  } else if (state.ui.activeTab === "inventory") {
    drawInventoryTab(ctx, state, x, y, width, height);
  } else {
    drawTalentTab(ctx, state, x, y, width, height);
  }
}

function drawTabs(ctx, state, x, y) {
  const tabs = [
    ["character", "Character"],
    ["inventory", "Inventory"],
    ["talents", "Talents"],
  ];

  tabs.forEach(([id, label], index) => {
    const tx = x + index * 126;
    const active = state.ui.activeTab === id;
    ctx.fillStyle = active ? "#2a3342" : "#171d26";
    ctx.fillRect(tx, y, 116, 28);
    ctx.strokeStyle = active ? "#79b8ff" : "#2d3848";
    ctx.strokeRect(tx, y, 116, 28);
    ctx.fillStyle = active ? "#fff3d8" : "#cdd9d4";
    ctx.font = "700 12px Segoe UI, Arial";
    ctx.fillText(label, tx + 16, y + 18);
  });
}

function drawCharacterTab(ctx, state, x, y, width, height, bonuses) {
  const statsX = x + 220;
  const statsY = y + 122;
  const lineHeight = 24;
  const stats = [
    ["Level", state.progression.level],
    ["Health", `${Math.round(state.player.hp)} / ${state.player.maxHp}`],
    ["Spirit", `${Math.round(state.player.spirit)} / ${state.player.maxSpirit}`],
    ["Health Regen", `${state.player.outOfCombatRegen.toFixed(1)}/s`],
    ["Spirit Regen", `${state.player.spiritRegen.toFixed(1)}/s`],
    ["Staff Bonus", `+${bonuses.staffDamageBonus}`],
    ["Bolt Bonus", `+${bonuses.boltDamageBonus}`],
    ["Dash Cooldown", `-${bonuses.dashCooldownBonus.toFixed(2)}s`],
    ["Root Duration", `+${bonuses.rootDurationBonus.toFixed(2)}s`],
  ];

  ctx.fillStyle = "#fff2d5";
  ctx.font = "700 16px Segoe UI, Arial";
  ctx.fillText("Character", statsX, statsY - 18);

  stats.forEach(([label, value], index) => {
    ctx.fillStyle = "#b8c3cf";
    ctx.font = "12px Segoe UI, Arial";
    ctx.fillText(label, statsX, statsY + lineHeight * index);
    ctx.fillStyle = "#f6fff1";
    ctx.font = "700 12px Segoe UI, Arial";
    ctx.fillText(String(value), statsX + 130, statsY + lineHeight * index);
  });

  const equipped = getEquippedItems(state.progression);
  const slotX = x + width - 280;
  let slotY = y + 122;

  ctx.fillStyle = "#fff2d5";
  ctx.font = "700 16px Segoe UI, Arial";
  ctx.fillText("Equipment", slotX, slotY - 18);

  equipped.forEach((entry, index) => {
    const selected = index === state.ui.selectedEquipmentIndex;
    ctx.fillStyle = selected ? "rgba(121, 184, 255, 0.16)" : "rgba(0, 0, 0, 0.32)";
    ctx.fillRect(slotX, slotY - 16, 220, 34);
    ctx.strokeStyle = selected ? "#79b8ff" : "#2d3848";
    ctx.strokeRect(slotX, slotY - 16, 220, 34);
    ctx.fillStyle = "#d3dde7";
    ctx.font = "11px Segoe UI, Arial";
    ctx.fillText(entry.slot.toUpperCase(), slotX + 12, slotY + 4);
    ctx.fillStyle = "#fff6d8";
    ctx.font = "700 12px Segoe UI, Arial";
    ctx.fillText(entry.item?.name || "Empty", slotX + 88, slotY + 4);
    slotY += 42;
  });
}

function drawInventoryTab(ctx, state, x, y, width, height) {
  const entries = getInventoryEntries(state.progression);
  const listX = x + 220;
  const listWidth = 352;
  const detailsX = x + width - 292;
  const detailsY = y + 128;
  let rowY = y + 122;

  ctx.fillStyle = "#fff2d5";
  ctx.font = "700 16px Segoe UI, Arial";
  ctx.fillText("Inventory", listX, rowY - 18);
  ctx.font = "11px Segoe UI, Arial";
  ctx.fillStyle = "#cfd9d3";
  ctx.fillText("Enter uses consumables or equips gear", listX + 110, rowY - 18);

  if (entries.length === 0) {
    ctx.fillStyle = "#d7e4cf";
    ctx.fillText("Inventory is empty.", listX, rowY + 10);
    return;
  }

  entries.forEach((entry, index) => {
    const selected = index === state.ui.selectedInventoryIndex;
    ctx.fillStyle = selected ? "rgba(121, 184, 255, 0.16)" : "rgba(0, 0, 0, 0.26)";
    ctx.fillRect(listX, rowY - 16, listWidth, 34);
    ctx.strokeStyle = selected ? "#79b8ff" : "#263142";
    ctx.strokeRect(listX, rowY - 16, listWidth, 34);
    ctx.fillStyle = entry.color || "#d8e2ec";
    ctx.fillRect(listX + 10, rowY - 8, 12, 12);
    ctx.fillStyle = "#fff6d8";
    ctx.font = "700 12px Segoe UI, Arial";
    ctx.fillText(entry.name, listX + 30, rowY + 2);
    ctx.fillStyle = "#b7c3cf";
    ctx.font = "11px Segoe UI, Arial";
    ctx.fillText(
      entry.category === "equipment" ? entry.slot.toUpperCase() : entry.category.toUpperCase(),
      listX + 170,
      rowY + 2
    );
    ctx.fillStyle = "#dce6d6";
    ctx.fillText(`x${entry.amount}`, listX + listWidth - 48, rowY + 2);
    rowY += 40;
  });

  const selectedEntry = entries[state.ui.selectedInventoryIndex];
  if (!selectedEntry) return;

  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.fillRect(detailsX, detailsY - 18, 240, 180);
  ctx.strokeStyle = "#2d3848";
  ctx.strokeRect(detailsX, detailsY - 18, 240, 180);
  ctx.fillStyle = "#fff2d5";
  ctx.font = "700 14px Segoe UI, Arial";
  ctx.fillText(selectedEntry.name, detailsX + 12, detailsY + 2);
  ctx.fillStyle = "#cfd9d3";
  ctx.font = "12px Segoe UI, Arial";
  wrapText(ctx, selectedEntry.description, detailsX + 12, detailsY + 26, 216, 18);

  if (selectedEntry.bonuses) {
    let bonusY = detailsY + 86;
    for (const [key, value] of Object.entries(selectedEntry.bonuses)) {
      ctx.fillStyle = "#9ce1a3";
      ctx.fillText(`${formatBonusKey(key)}: ${value > 0 ? "+" : ""}${value}`, detailsX + 12, bonusY);
      bonusY += 16;
    }
  }
}

function drawTalentTab(ctx, state, x, y, width, height) {
  let rowY = y + 122;
  ctx.fillStyle = "#fff2d5";
  ctx.font = "700 16px Segoe UI, Arial";
  ctx.fillText("Talents", x + 220, rowY - 18);
  ctx.font = "11px Segoe UI, Arial";
  ctx.fillStyle = "#d7e4cf";
  ctx.fillText(`Unspent Points: ${state.progression.talentPoints}`, x + 320, rowY - 18);

  TALENT_DEFS.forEach((talent, index) => {
    const unlocked = Boolean(state.progression.talents[talent.id]);
    const selected = index === state.ui.selectedTalentIndex;
    ctx.fillStyle = selected ? "rgba(121, 184, 255, 0.16)" : "rgba(0, 0, 0, 0.26)";
    ctx.fillRect(x + 220, rowY - 16, width - 280, 38);
    ctx.strokeStyle = selected ? "#79b8ff" : "#263142";
    ctx.strokeRect(x + 220, rowY - 16, width - 280, 38);
    ctx.fillStyle = unlocked ? "#9ce1a3" : "#fff6d8";
    ctx.font = "700 12px Segoe UI, Arial";
    ctx.fillText(`${talent.tree}  |  ${talent.name}`, x + 232, rowY + 1);
    ctx.fillStyle = "#cfd9d3";
    ctx.font = "11px Segoe UI, Arial";
    ctx.fillText(talent.description, x + 232, rowY + 18);
    ctx.fillStyle = unlocked ? "#9ce1a3" : state.progression.talentPoints > 0 ? "#f1d786" : "#8692a3";
    ctx.fillText(unlocked ? "Unlocked" : "Press Enter to unlock", x + width - 238, rowY + 18);
    rowY += 46;
  });

  const unlocked = getUnlockedTalentList(state.progression);
  ctx.fillStyle = "#fff2d5";
  ctx.font = "700 14px Segoe UI, Arial";
  ctx.fillText("Unlocked Summary", x + 220, y + height - 120);
  ctx.fillStyle = "#d7e4cf";
  ctx.font = "11px Segoe UI, Arial";
  wrapText(
    ctx,
    unlocked.length > 0
      ? unlocked.map((talent) => talent.name).join(", ")
      : "No talents unlocked yet.",
    x + 220,
    y + height - 96,
    width - 280,
    16
  );
}

function formatBonusKey(key) {
  return key
    .replace(/Bonus/g, "")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (value) => value.toUpperCase())
    .trim();
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
  if (!state.story.focus || state.story.dialogue || state.gameOver || state.ui.menuOpen || state.ui.questLogOpen) return;

  const panelW = 260;
  const panelH = 42;
  const x = state.viewport.width / 2 - panelW / 2;
  const y = state.viewport.height - 176;

  ctx.fillStyle = "rgba(0, 0, 0, 0.68)";
  ctx.fillRect(x, y, panelW, panelH);
  ctx.fillStyle = "#10161d";
  ctx.fillRect(x + 4, y + 4, panelW - 8, panelH - 8);
  ctx.font = "700 14px Segoe UI, Arial";
  ctx.fillStyle = "#fff6d0";
  ctx.fillText(`E  ${state.story.prompt}`, x + 16, y + 24);
}

function drawExitPrompt(ctx, state) {
  if (!state.nearExit || state.gameOver || state.story.dialogue || state.ui.menuOpen || state.ui.questLogOpen) return;

  const panelW = 332;
  const panelH = 60;
  const x = state.viewport.width / 2 - panelW / 2;
  const y = Math.max(100, state.viewport.height - 166);
  const progress = Math.max(0, Math.min(1, state.exitCharge));

  ctx.fillStyle = "rgba(0, 0, 0, 0.68)";
  ctx.fillRect(x, y, panelW, panelH);
  ctx.fillStyle = "#10161d";
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
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(state.viewport.width / 2 - 188, 146, 376, 34);
  ctx.fillStyle = "#fff1c6";
  ctx.font = "700 13px Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.fillText(state.story.toastText, state.viewport.width / 2, 168);
  ctx.restore();
  ctx.textAlign = "left";
}

function drawDialogue(ctx, state) {
  const dialogue = state.story.dialogue;
  if (!dialogue) return;

  const x = 56;
  const y = state.viewport.height - 198;
  const width = state.viewport.width - 112;
  const height = 122;

  ctx.fillStyle = "rgba(0, 0, 0, 0.86)";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#10161d";
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

  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fillRect(x, y, panelW, panelH);
  ctx.fillStyle = "#10161d";
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

import { EQUIPMENT_SLOTS, TALENT_DEFS } from "../data/gameData.js";
import {
  getCurrency,
  getActionSlotEntries,
  getEquippedItems,
  getInventoryEntries,
  getItemValue,
  getPlayerBonuses,
  getQuestCounter,
  getStashEntries,
  getUnlockedTalentList,
  getXpProgress,
} from "../systems/progression.js";
import { getAylaPortrait } from "../rendering/atlasAssets.js";
import { getActiveService, getServiceEntries, getStashUiEntries } from "../systems/services.js";

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
  const panelW = 760;
  const panelH = 132;
  const x = width / 2 - panelW / 2;
  const y = height - panelH - 16;
  const xp = getXpProgress(state.progression);
  const healthPotions = state.progression.inventory.health_potion || 0;
  const spiritTonics = state.progression.inventory.spirit_tonic || 0;

  ctx.fillStyle = "rgba(228, 238, 214, 0.78)";
  ctx.font = "11px Segoe UI, Arial";
  ctx.fillText(`Lv ${xp.level}  |  Q Quest Log  |  C Character  |  I Inventory  |  T Talents  |  2-4 Action`, x + 18, y - 8);

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

  const abilityRowWidth = 76 * 4 + 10 * 3;
  drawAbilitySlots(ctx, x + panelW / 2 - abilityRowWidth / 2, y + 18, state.player, abilityInfo);
  drawActionSlots(ctx, x + panelW / 2 - 147, y + 82, state.progression);
  drawQuickCounters(ctx, x + 18, y + 98, healthPotions, spiritTonics, panelW);
  drawBuffChips(ctx, x + 198, y + 98, state.player);
  drawCurrencyChip(ctx, x + panelW - 182, y + 98, state.progression);

  drawXpBar(ctx, x + 136, y + panelH - 12, panelW - 272, xp.ratio, "");
  drawPanelChrome(ctx, x, y, panelW, panelH, "#7f9a74");
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

function drawActionSlots(ctx, x, y, progression) {
  const slots = getActionSlotEntries(progression);
  const slotW = 90;
  const slotH = 34;
  const gap = 12;

  for (let index = 0; index < slots.length; index += 1) {
    const slot = slots[index];
    const slotX = x + index * (slotW + gap);
    const border = slot.item?.color || "#475261";

    ctx.fillStyle = "rgba(0,0,0,0.58)";
    ctx.fillRect(slotX, y, slotW, slotH);
    ctx.fillStyle = "#10161d";
    ctx.fillRect(slotX + 2, y + 2, slotW - 4, slotH - 4);
    ctx.strokeStyle = border;
    ctx.lineWidth = 2;
    ctx.strokeRect(slotX + 2, y + 2, slotW - 4, slotH - 4);

    if (slot.item) {
      ctx.fillStyle = slot.item.color || "#d8e2ec";
      ctx.fillRect(slotX + 8, y + 8, 12, 18);
      ctx.fillStyle = "#f6ead0";
      ctx.font = "700 12px Segoe UI, Arial";
      ctx.fillText(slot.key, slotX + 28, y + 13);
      ctx.fillStyle = slot.count > 0 ? "#eef6dd" : "#9098a5";
      ctx.font = "11px Segoe UI, Arial";
      ctx.fillText(shorten(slot.item.name, 11), slotX + 28, y + 25);
      ctx.textAlign = "right";
      ctx.fillStyle = slot.count > 0 ? "#fff4d8" : "#9aa4b1";
      ctx.fillText(`x${slot.count}`, slotX + slotW - 8, y + 25);
      ctx.textAlign = "left";
      if (slot.count <= 0) {
        ctx.fillStyle = "rgba(0,0,0,0.42)";
        ctx.fillRect(slotX + 2, y + 2, slotW - 4, slotH - 4);
      }
      continue;
    }

    ctx.fillStyle = "#f6ead0";
    ctx.font = "700 12px Segoe UI, Arial";
    ctx.fillText(slot.key, slotX + 10, y + 13);
    ctx.fillStyle = "#aab6c3";
    ctx.font = "11px Segoe UI, Arial";
    ctx.fillText("Empty", slotX + 10, y + 25);
  }
}

function drawQuickCounters(ctx, x, y, healthPotions, spiritTonics, panelW) {
  const chips = [
    { key: "5", label: "Health", count: healthPotions, color: "#df6a67", x },
    { key: "6", label: "Spirit", count: spiritTonics, color: "#6ecff7", x: x + panelW - 110 },
  ];

  for (const chip of chips) {
    ctx.fillStyle = "rgba(0,0,0,0.56)";
    ctx.fillRect(chip.x, y, 92, 22);
    ctx.fillStyle = "#10161d";
    ctx.fillRect(chip.x + 2, y + 2, 88, 18);
    ctx.fillStyle = chip.color;
    ctx.fillRect(chip.x + 4, y + 4, 10, 14);
    ctx.fillStyle = "#f6ead0";
    ctx.font = "700 11px Segoe UI, Arial";
    ctx.fillText(chip.key, chip.x + 20, y + 11);
    ctx.fillStyle = "#dce6d6";
    ctx.font = "10px Segoe UI, Arial";
    ctx.fillText(`${chip.label} x${chip.count}`, chip.x + 20, y + 19);
  }
}

function drawBuffChips(ctx, x, y, player) {
  const chips = [];
  if (player.activeBuffs?.ward > 0) {
    chips.push({ label: `Ward ${player.activeBuffs.ward.toFixed(0)}s`, color: "#d8d57b" });
  }
  if (player.activeBuffs?.speed > 0) {
    chips.push({ label: `Windstep ${player.activeBuffs.speed.toFixed(0)}s`, color: "#8be4c3" });
  }
  if (chips.length === 0) return;

  let cursorX = x;
  for (const chip of chips) {
    const width = Math.max(82, Math.ceil(ctx.measureText(chip.label).width) + 20);
    ctx.fillStyle = "rgba(0,0,0,0.54)";
    ctx.fillRect(cursorX, y, width, 22);
    ctx.fillStyle = "#10161d";
    ctx.fillRect(cursorX + 2, y + 2, width - 4, 18);
    ctx.fillStyle = chip.color;
    ctx.fillRect(cursorX + 5, y + 5, 8, 12);
    ctx.fillStyle = "#eef7df";
    ctx.font = "10px Segoe UI, Arial";
    ctx.fillText(chip.label, cursorX + 18, y + 15);
    cursorX += width + 8;
  }
}

function drawCurrencyChip(ctx, x, y, progression) {
  const silver = getCurrency(progression);
  ctx.fillStyle = "rgba(0,0,0,0.56)";
  ctx.fillRect(x, y, 154, 22);
  ctx.fillStyle = "#10161d";
  ctx.fillRect(x + 2, y + 2, 150, 18);
  ctx.fillStyle = "#e4c776";
  ctx.fillRect(x + 6, y + 5, 10, 10);
  ctx.fillStyle = "#f6ead0";
  ctx.font = "700 11px Segoe UI, Arial";
  ctx.fillText("Silver", x + 24, y + 11);
  ctx.textAlign = "right";
  ctx.fillStyle = "#fff6dc";
  ctx.fillText(String(silver), x + 144, y + 11);
  ctx.textAlign = "left";
}

function drawXpBar(ctx, x, y, width, ratio, label) {
  ctx.fillStyle = "#090d12";
  ctx.fillRect(x, y, width, 8);
  ctx.fillStyle = "#53346b";
  ctx.fillRect(x + 1, y + 1, (width - 2) * Math.max(0, Math.min(1, ratio)), 6);
  if (label) {
    ctx.fillStyle = "#dcd0f1";
    ctx.font = "10px Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.fillText(label, x + width / 2, y - 4);
    ctx.textAlign = "left";
  }
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
  } else if (!cleared && aliveThreats <= 0) {
    phaseLabel = "Village Calm";
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
  ctx.fillRect(x, y, 282, 86);
  ctx.fillStyle = "#10161d";
  ctx.fillRect(x + 4, y + 4, 274, 78);
  ctx.fillStyle = "#f6fff1";
  ctx.font = "700 16px Segoe UI, Arial";
  ctx.fillText(state.scene.title, x + 12, y + 22);
  ctx.font = "12px Segoe UI, Arial";
  ctx.fillStyle = "#c9ddbe";
  ctx.fillText(state.scene.regionName, x + 12, y + 40);
  ctx.fillStyle = "#fff5cf";
  ctx.fillText(phaseLabel, x + 12, y + 58);
  ctx.fillStyle = "#e8d487";
  ctx.fillText(`Silver ${getCurrency(state.progression)}`, x + 12, y + 74);

  if (state.combatTimer <= 0 && state.player.hp < state.player.maxHp) {
    ctx.fillStyle = "#96dda5";
    ctx.fillText("Regenerating", x + 166, y + 58);
  }
  drawPanelChrome(ctx, x, y, 282, 86, "#84a775");
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

  drawPanelChrome(ctx, x, y, width, height, "#7ca57b");

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
  ctx.fillText("C / I / T / Tab switch views  |  Esc closes", x + width - 272, y + 28);

  drawTabs(ctx, state, x + 18, y + 48);

  if (portrait) {
    ctx.drawImage(portrait, x + 18, y + 86, 176, 200);
  }

  if (state.ui.activeTab === "character") {
    drawCharacterTab(ctx, state, x, y, width, height, bonuses);
  } else if (state.ui.activeTab === "inventory") {
    drawInventoryTab(ctx, state, x, y, width, height);
  } else if (state.ui.activeTab === "services") {
    drawServiceTab(ctx, state, x, y, width, height);
  } else {
    drawTalentTab(ctx, state, x, y, width, height);
  }

  drawPanelChrome(ctx, x, y, width, height, "#8a6e49");
}

function drawTabs(ctx, state, x, y) {
  const tabs = [
    ["character", "Character"],
    ["inventory", "Inventory"],
    ["talents", "Talents"],
  ];
  if (state.ui.activeServiceId) {
    tabs.push(["services", "Services"]);
  }

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
    ctx.fillStyle = getRarityAccent(entry.item?.rarity, "#fff6d8");
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
  const service = getActiveService(state);
  const inventoryHelp =
    service?.kind === "shop"
      ? "Enter uses/equips  |  2/3/4 bind  |  X sell selected"
      : "Enter uses/equips  |  2/3/4 binds selected usable";
  ctx.fillText(inventoryHelp, listX + 18, rowY - 2);

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
    ctx.fillStyle = getRarityAccent(entry.rarity, "#fff6d8");
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
  const actionSlots = getActionSlotEntries(state.progression);

  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.fillRect(detailsX, detailsY - 18, 240, 214);
  ctx.strokeStyle = "#2d3848";
  ctx.strokeRect(detailsX, detailsY - 18, 240, 214);
  ctx.fillStyle = "#fff2d5";
  ctx.font = "700 14px Segoe UI, Arial";
  ctx.fillText(selectedEntry.name, detailsX + 12, detailsY + 2);
  ctx.fillStyle = "#cfd9d3";
  ctx.font = "12px Segoe UI, Arial";
  wrapText(ctx, selectedEntry.description, detailsX + 12, detailsY + 26, 216, 18);
  ctx.fillStyle = "#e9d281";
  ctx.font = "11px Segoe UI, Arial";
  ctx.fillText(`Value ${getItemValue(selectedEntry.id)} silver`, detailsX + 12, detailsY + 76);

  let detailY = detailsY + 96;
  if (selectedEntry.maxStack) {
    ctx.fillStyle = "#d7e4cf";
    ctx.font = "11px Segoe UI, Arial";
    ctx.fillText(
      `Stack ${selectedEntry.stackIndex + 1}/${selectedEntry.stackCount}  |  ${selectedEntry.amount}/${selectedEntry.maxStack}`,
      detailsX + 12,
      detailY
    );
    ctx.fillText(`Total Owned: ${selectedEntry.totalAmount}`, detailsX + 12, detailY + 16);
    detailY += 34;
  }

  if (selectedEntry.bonuses) {
    let bonusY = detailY;
    for (const [key, value] of Object.entries(selectedEntry.bonuses)) {
      ctx.fillStyle = "#9ce1a3";
      ctx.fillText(`${formatBonusKey(key)}: ${value > 0 ? "+" : ""}${value}`, detailsX + 12, bonusY);
      bonusY += 16;
    }
    detailY = bonusY + 4;
  }

  if (selectedEntry.category === "equipment" && selectedEntry.slot) {
    const equippedItem = getEquippedItems(state.progression).find((entry) => entry.slot === selectedEntry.slot)?.item;
    ctx.fillStyle = "#fff2d5";
    ctx.font = "700 12px Segoe UI, Arial";
    ctx.fillText("Comparison", detailsX + 12, detailY + 4);
    detailY += 20;
    if (!equippedItem) {
      ctx.fillStyle = "#d7e4cf";
      ctx.font = "11px Segoe UI, Arial";
      ctx.fillText("Nothing equipped in this slot.", detailsX + 12, detailY);
      detailY += 18;
    } else {
      ctx.fillStyle = getRarityAccent(equippedItem.rarity, "#f1e5b7");
      ctx.font = "700 11px Segoe UI, Arial";
      ctx.fillText(`Equipped: ${equippedItem.name}`, detailsX + 12, detailY);
      detailY += 16;
      for (const line of buildComparisonLines(selectedEntry, equippedItem)) {
        ctx.fillStyle = line.delta > 0 ? "#9ce1a3" : line.delta < 0 ? "#f0a08d" : "#d7e4cf";
        ctx.font = "11px Segoe UI, Arial";
        ctx.fillText(`${line.label}: ${line.current} (${line.delta > 0 ? "+" : ""}${line.delta})`, detailsX + 12, detailY);
        detailY += 14;
      }
      detailY += 4;
    }
  }

  if (selectedEntry.usable || selectedEntry.category === "consumable" || selectedEntry.effect) {
    ctx.fillStyle = "#fff2d5";
    ctx.font = "700 12px Segoe UI, Arial";
    ctx.fillText("Action Slots", detailsX + 12, detailY + 4);

    actionSlots.forEach((slot, index) => {
      const slotX = detailsX + 12 + index * 72;
      const assigned = slot.itemId === selectedEntry.id;
      ctx.fillStyle = assigned ? "rgba(121, 184, 255, 0.2)" : "rgba(0, 0, 0, 0.32)";
      ctx.fillRect(slotX, detailY + 14, 62, 36);
      ctx.strokeStyle = assigned ? "#79b8ff" : "#2d3848";
      ctx.strokeRect(slotX, detailY + 14, 62, 36);
      ctx.fillStyle = assigned ? "#fff5d8" : "#cfd9d3";
      ctx.font = "700 12px Segoe UI, Arial";
      ctx.fillText(slot.key, slotX + 8, detailY + 30);
      ctx.font = "10px Segoe UI, Arial";
      ctx.fillStyle = "#9dd9a2";
      ctx.fillText(assigned ? "Bound" : "Assign", slotX + 8, detailY + 43);
    });
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

function drawServiceTab(ctx, state, x, y, width, height) {
  const service = getActiveService(state);
  const bodyX = x + 220;
  const bodyY = y + 122;

  ctx.fillStyle = "#fff2d5";
  ctx.font = "700 16px Segoe UI, Arial";
  ctx.fillText(service ? service.title : "Services", bodyX, bodyY - 18);
  ctx.font = "11px Segoe UI, Arial";
  ctx.fillStyle = "#d7e4cf";
  ctx.fillText(service ? service.subtitle : "Visit a service NPC or village object.", bodyX + 132, bodyY - 18);

  if (!service) {
    ctx.fillStyle = "#d7e4cf";
    ctx.font = "13px Segoe UI, Arial";
    ctx.fillText("No service is currently open.", bodyX, bodyY + 10);
    return;
  }

  ctx.fillStyle = "#e7d081";
  ctx.font = "700 12px Segoe UI, Arial";
  ctx.fillText(`Silver: ${getCurrency(state.progression)}`, bodyX, bodyY + 8);

  if (service.kind === "shop") {
    const entries = getServiceEntries(state);
    let rowY = bodyY + 34;
    entries.forEach((entry, index) => {
      const selected = index === state.ui.selectedServiceIndex;
      ctx.fillStyle = selected ? "rgba(121, 184, 255, 0.16)" : "rgba(0, 0, 0, 0.26)";
      ctx.fillRect(bodyX, rowY - 16, width - 280, 38);
      ctx.strokeStyle = selected ? "#79b8ff" : "#263142";
      ctx.strokeRect(bodyX, rowY - 16, width - 280, 38);
      ctx.fillStyle = entry.item.color || "#d8e2ec";
      ctx.fillRect(bodyX + 10, rowY - 8, 12, 12);
      ctx.fillStyle = getRarityAccent(entry.item.rarity, "#fff6d8");
      ctx.font = "700 12px Segoe UI, Arial";
      ctx.fillText(entry.item.name, bodyX + 30, rowY + 1);
      ctx.fillStyle = "#d7e4cf";
      ctx.font = "11px Segoe UI, Arial";
      ctx.fillText(shorten(entry.item.description, 42), bodyX + 30, rowY + 17);
      ctx.textAlign = "right";
      ctx.fillStyle = entry.affordable ? "#f1d786" : "#c67d72";
      ctx.font = "700 12px Segoe UI, Arial";
      ctx.fillText(`${entry.price} s`, bodyX + width - 304, rowY + 1);
      ctx.textAlign = "left";
      rowY += 46;
    });
    return;
  }

  if (service.kind === "altar") {
    const entries = getServiceEntries(state);
    let rowY = bodyY + 34;
    entries.forEach((entry, index) => {
      const selected = index === state.ui.selectedServiceIndex;
      ctx.fillStyle = selected ? "rgba(121, 184, 255, 0.16)" : "rgba(0, 0, 0, 0.26)";
      ctx.fillRect(bodyX, rowY - 16, width - 280, 46);
      ctx.strokeStyle = selected ? "#79b8ff" : "#263142";
      ctx.strokeRect(bodyX, rowY - 16, width - 280, 46);
      ctx.fillStyle = "#fff6d8";
      ctx.font = "700 12px Segoe UI, Arial";
      ctx.fillText(entry.title, bodyX + 12, rowY + 1);
      ctx.fillStyle = "#d7e4cf";
      ctx.font = "11px Segoe UI, Arial";
      ctx.fillText(entry.description, bodyX + 12, rowY + 17);
      ctx.fillStyle = entry.affordable ? "#f1d786" : "#c67d72";
      ctx.fillText(formatActionCost(entry), bodyX + 12, rowY + 33);
      rowY += 54;
    });
    return;
  }

  const lists = getStashUiEntries(state);
  const panelW = Math.floor((width - 320) / 2);
  drawStashColumn(ctx, bodyX, bodyY + 28, panelW, "Pack", lists.pack, state.ui.selectedServiceIndex, state.ui.serviceSubpanel === "pack");
  drawStashColumn(
    ctx,
    bodyX + panelW + 24,
    bodyY + 28,
    panelW,
    "Stash",
    lists.stash,
    state.ui.selectedStashIndex,
    state.ui.serviceSubpanel === "stash"
  );
  ctx.fillStyle = "#d7e4cf";
  ctx.font = "11px Segoe UI, Arial";
  ctx.fillText("Left/Right switch lists  |  Enter transfers one item", bodyX, y + height - 36);
}

function drawStashColumn(ctx, x, y, width, label, entries, selectedIndex, active) {
  ctx.fillStyle = active ? "#fff2d5" : "#cfd9d3";
  ctx.font = "700 13px Segoe UI, Arial";
  ctx.fillText(label, x, y - 8);
  ctx.fillStyle = "rgba(0,0,0,0.24)";
  ctx.fillRect(x, y, width, 252);
  ctx.strokeStyle = active ? "#79b8ff" : "#263142";
  ctx.strokeRect(x, y, width, 252);
  let rowY = y + 18;
  if (entries.length === 0) {
    ctx.fillStyle = "#aebdc6";
    ctx.font = "11px Segoe UI, Arial";
    ctx.fillText("Empty", x + 12, rowY + 10);
    return;
  }
  entries.slice(0, 6).forEach((entry, index) => {
    const selected = index === selectedIndex;
    ctx.fillStyle = selected ? "rgba(121, 184, 255, 0.16)" : "rgba(0,0,0,0.2)";
    ctx.fillRect(x + 8, rowY - 12, width - 16, 30);
    ctx.fillStyle = entry.color || "#d8e2ec";
    ctx.fillRect(x + 14, rowY - 4, 10, 10);
    ctx.fillStyle = getRarityAccent(entry.rarity, "#fff6d8");
    ctx.font = "700 11px Segoe UI, Arial";
    ctx.fillText(shorten(entry.name, 16), x + 30, rowY + 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#d7e4cf";
    ctx.fillText(`x${entry.amount}`, x + width - 14, rowY + 2);
    ctx.textAlign = "left";
    rowY += 36;
  });
}

function formatBonusKey(key) {
  return key
    .replace(/Bonus/g, "")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (value) => value.toUpperCase())
    .trim();
}

function shorten(value, max) {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(1, max - 3))}...`;
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
  const locked = Boolean(state.nearExit.requiresFlag && !state.progression.worldFlags?.[state.nearExit.requiresFlag]);
  const panelH = locked ? 76 : 60;
  const x = state.viewport.width / 2 - panelW / 2;
  const y = Math.max(100, state.viewport.height - 166);
  const progress = Math.max(0, Math.min(1, state.exitCharge));

  ctx.fillStyle = "rgba(0, 0, 0, 0.68)";
  ctx.fillRect(x, y, panelW, panelH);
  ctx.fillStyle = "#10161d";
  ctx.fillRect(x + 4, y + 4, panelW - 8, panelH - 8);
  ctx.font = "700 15px Segoe UI, Arial";
  ctx.fillStyle = locked ? "#ffc1b8" : "#fff6d0";
  ctx.fillText(locked ? state.nearExit.label : `Travel to ${state.nearExit.label}`, x + 16, y + 22);
  ctx.font = "12px Segoe UI, Arial";
  ctx.fillStyle = locked ? "#f0c1bc" : "#d8e8cc";
  if (locked) {
    wrapText(ctx, state.nearExit.lockedText || "The path is sealed.", x + 16, y + 40, panelW - 32, 14);
  } else {
    ctx.fillText("Stand on the path for a moment", x + 16, y + 40);
  }
  if (!locked) {
    ctx.fillStyle = "#1b1412";
    ctx.fillRect(x + 16, y + 46, panelW - 32, 8);
    ctx.fillStyle = "#fff0ad";
    ctx.fillRect(x + 18, y + 48, Math.round((panelW - 36) * progress), 4);
  }
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

function buildComparisonLines(current, equipped) {
  const keys = new Set([
    ...Object.keys(current.bonuses || {}),
    ...Object.keys(equipped?.bonuses || {}),
  ]);

  return [...keys].map((key) => {
    const currentValue = current.bonuses?.[key] || 0;
    const equippedValue = equipped?.bonuses?.[key] || 0;
    return {
      label: formatBonusKey(key),
      current: `${currentValue > 0 ? "+" : ""}${currentValue}`,
      delta: currentValue - equippedValue,
    };
  });
}

function formatActionCost(action) {
  const parts = [];
  if (action.costSilver) parts.push(`${action.costSilver} silver`);
  for (const [itemId, amount] of Object.entries(action.costItems || {})) {
    parts.push(`${amount} ${formatItemName(itemId)}`);
  }
  return parts.join("  |  ");
}

function formatItemName(itemId) {
  return itemId
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getRarityAccent(rarity, fallback) {
  if (rarity === "epic") return "#d8c1ff";
  if (rarity === "rare") return "#95d7ff";
  if (rarity === "uncommon") return "#a6e28c";
  return fallback;
}

function drawPanelChrome(ctx, x, y, width, height, accent) {
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 1.5, y + 1.5, width - 3, height - 3);
  pixelRect(ctx, x + 8, y + 8, 18, 2, accent);
  pixelRect(ctx, x + 8, y + 8, 2, 18, accent);
  pixelRect(ctx, x + width - 26, y + 8, 18, 2, accent);
  pixelRect(ctx, x + width - 10, y + 8, 2, 18, accent);
  pixelRect(ctx, x + 8, y + height - 10, 18, 2, accent);
  pixelRect(ctx, x + 8, y + height - 26, 2, 18, accent);
  pixelRect(ctx, x + width - 26, y + height - 10, 18, 2, accent);
  pixelRect(ctx, x + width - 10, y + height - 26, 2, 18, accent);
}

function pixelRect(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(width)), Math.max(1, Math.round(height)));
}

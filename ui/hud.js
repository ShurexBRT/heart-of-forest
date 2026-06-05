import { EQUIPMENT_SLOTS, ITEM_DEFS, TALENT_DEFS } from "../data/gameData.js";
import { SCENES, WORLD_MAP_LAYOUT } from "../data/sceneNetwork.js";
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
import { NPC_DEFS } from "../data/storyData.js";

const TEXT_MEASURE_CANVAS =
  typeof document !== "undefined" ? document.createElement("canvas") : null;
const TEXT_MEASURE_CTX = TEXT_MEASURE_CANVAS ? TEXT_MEASURE_CANVAS.getContext("2d") : null;

const INVENTORY_FILTER_BUTTONS = [
  ["all", "All"],
  ["equipment", "Gear"],
  ["consumable", "Use"],
  ["material", "Mats"],
  ["usable", "Bind"],
];

const INVENTORY_SORT_BUTTONS = [
  ["name", "Name"],
  ["rarity", "Rare"],
  ["value", "Value"],
];

const SHOP_FILTER_BUTTONS = [
  ["all", "All"],
  ["equipment", "Gear"],
  ["consumable", "Tonic"],
  ["rare", "Rare"],
];

const SHOP_SORT_BUTTONS = [
  ["name", "Name"],
  ["rarity", "Rare"],
  ["price", "Price"],
  ["recent", "Recent"],
];

function getHudAbilitySpecs() {
  return [
    ["staff", "#f2d07a"],
    ["bolt", "#74ddff"],
    ["dash", "#b7f0dd"],
    ["root", "#8ce36d"],
    ["pulse", "#b9f48a"],
  ];
}

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
  if (state.ui.worldMapOpen) drawWorldMapOverlay(ctx, state);
  drawHoverTooltip(ctx, state);
  drawDialogue(ctx, state);
  drawTransitionOverlay(ctx, state);
  drawEndState(ctx, state);
}

export function getUiHoverTarget(state, mouseX, mouseY) {
  if (state.ui.worldMapOpen) {
    return null;
  }

  if (state.ui.menuOpen) {
    return getMenuHoverTarget(state, mouseX, mouseY);
  }

  if (state.ui.questLogOpen) {
    return getQuestLogHoverTarget(state, mouseX, mouseY);
  }

  return getHudHoverOnlyTarget(state, mouseX, mouseY);
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
  ctx.fillText(`Lv ${xp.level}  |  Q Quest Log  |  C Character  |  I Inventory  |  T Talents  |  R Pulse  |  2-4 Action`, x + 18, y - 38);

  drawXpProgressPanel(ctx, x + 154, y - 32, panelW - 308, xp);

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

  const abilityRowWidth = getHudAbilitySpecs().length * 76 + (getHudAbilitySpecs().length - 1) * 10;
  drawAbilitySlots(ctx, x + panelW / 2 - abilityRowWidth / 2, y + 18, state.player, abilityInfo);
  drawActionSlots(ctx, x + panelW / 2 - 147, y + 82, state.progression);
  drawQuickCounters(ctx, x + 18, y + 98, healthPotions, spiritTonics, panelW);
  drawBuffChips(ctx, x + 198, y + 98, state.player);
  drawCurrencyChip(ctx, x + panelW - 182, y + 98, state.progression);
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
  const abilities = getHudAbilitySpecs();
  const slotW = 76;
  const slotH = 54;
  const gap = 10;

  for (let i = 0; i < abilities.length; i += 1) {
    const [name, color] = abilities[i];
    const info = abilityInfo[name];
    const x = startX + i * (slotW + gap);
    const cooldown = player.cooldowns[name];
    const ratio = info.cooldown > 0 ? Math.min(1, cooldown / info.cooldown) : 0;
    const unlocked = info.unlocked !== false;

    ctx.fillStyle = "rgba(0, 0, 0, 0.64)";
    ctx.fillRect(x, y, slotW, slotH);
    ctx.fillStyle = "#10161d";
    ctx.fillRect(x + 3, y + 3, slotW - 6, slotH - 6);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3, y + 3, slotW - 6, slotH - 6);

    const innerX = x + 3;
    const innerY = y + 3;
    const innerW = slotW - 6;
    const innerH = slotH - 6;

    if (!unlocked) {
      ctx.fillStyle = "rgba(9, 12, 18, 0.72)";
      ctx.fillRect(innerX, innerY, innerW, innerH);
    } else if (info.cost > 0 && player.spirit < info.cost) {
      ctx.fillStyle = "rgba(27, 51, 68, 0.46)";
      ctx.fillRect(innerX, innerY, innerW, innerH);
    }

    if (ratio > 0 && unlocked) {
      ctx.fillStyle = "rgba(4, 7, 11, 0.78)";
      ctx.fillRect(innerX, innerY, innerW, innerH);

      const cooldownText = cooldown >= 1 ? cooldown.toFixed(1) : cooldown.toFixed(2);
      ctx.fillStyle = "#dce6ee";
      ctx.font = "700 12px Segoe UI, Arial";
      ctx.fillText(info.key, x + 10, y + 15);
      ctx.fillStyle = "#f6f0d8";
      ctx.font = "700 20px Segoe UI, Arial";
      ctx.textAlign = "center";
      ctx.fillText(cooldownText, x + slotW / 2, y + 31);
      ctx.textAlign = "left";
      ctx.fillStyle = "#d7e4cf";
      ctx.font = "11px Segoe UI, Arial";
      ctx.fillText(info.shortLabel || info.label, x + 10, y + 44);

      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(innerX + 6, y + slotH - 12, innerW - 12, 5);
      ctx.fillStyle = color;
      ctx.fillRect(innerX + 6, y + slotH - 12, (innerW - 12) * (1 - ratio), 5);
    } else {
      ctx.fillStyle = unlocked ? "#f7fff1" : "#88939f";
      ctx.font = "700 16px Segoe UI, Arial";
      ctx.fillText(info.key, x + 10, y + 22);
      ctx.font = "12px Segoe UI, Arial";
      ctx.fillStyle = unlocked ? "#d7e4cf" : "#97a2ae";
      ctx.fillText(unlocked ? info.shortLabel || info.label : "Locked", x + 10, y + 40);
    }
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

function drawXpProgressPanel(ctx, x, y, width, xp) {
  const remaining = Math.max(0, xp.nextLevelXp - xp.xp);
  const barY = y + 14;

  ctx.fillStyle = "rgba(4, 7, 11, 0.78)";
  ctx.fillRect(x, y, width, 28);
  ctx.fillStyle = "#11171f";
  ctx.fillRect(x + 3, y + 3, width - 6, 22);
  drawPanelChrome(ctx, x, y, width, 28, "#8c79af");

  ctx.fillStyle = "#f0e7ff";
  ctx.font = "700 11px Segoe UI, Arial";
  ctx.fillText(`Level ${xp.level}`, x + 10, y + 12);

  ctx.textAlign = "center";
  ctx.fillStyle = "#d6caef";
  ctx.font = "10px Segoe UI, Arial";
  ctx.fillText(`${xp.xp} / ${xp.nextLevelXp} XP`, x + width / 2, y + 12);

  ctx.textAlign = "right";
  ctx.fillStyle = "#c8e6a8";
  ctx.fillText(`${remaining} to next`, x + width - 10, y + 12);
  ctx.textAlign = "left";

  drawXpBar(ctx, x + 10, barY, width - 20, xp.ratio, "");
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.fillRect(x + 11, barY + 1, (width - 22) * 0.32, 2);
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
  const rows = quests.slice(0, 3).map((quest) => {
    const note =
      quest.status === "complete"
        ? getQuestTurnInLabel(quest)
        : getQuestObjectiveLabel(quest);
    const noteLines = toWrappedLines(ctx, note, width - 24).slice(0, 3);
    return {
      quest,
      noteLines,
      height: 34 + noteLines.length * 14,
    };
  });
  const height = 28 + rows.reduce((sum, row) => sum + row.height, 0);

  ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#10161d";
  ctx.fillRect(x + 4, y + 4, width - 8, height - 8);
  ctx.fillStyle = "#f6fff1";
  ctx.font = "700 13px Segoe UI, Arial";
  ctx.fillText("Active Quests", x + 12, y + 18);

  let cursorY = y + 38;
  for (const row of rows) {
    const quest = row.quest;
    ctx.fillStyle = "#fff1c6";
    ctx.font = "700 12px Segoe UI, Arial";
    ctx.fillText(quest.title, x + 12, cursorY);
    cursorY += 15;
    ctx.fillStyle = quest.status === "complete" ? "#ffe4a8" : "rgba(246,255,241,0.78)";
    ctx.font = "11px Segoe UI, Arial";
    row.noteLines.forEach((line) => {
      ctx.fillText(line, x + 12, cursorY);
      cursorY += 14;
    });
    cursorY += 8;
  }
}

function drawQuestLogOverlay(ctx, state) {
  const panel = getQuestLogPanelData(state);
  const { quests } = panel;
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
  ctx.textAlign = "right";
  ctx.fillText("Q / Esc to close", x + width - 18, y + 28);
  ctx.textAlign = "left";

  if (quests.length === 0) {
    ctx.fillStyle = "#d7e4cf";
    ctx.font = "15px Segoe UI, Arial";
    ctx.fillText("No active quests yet.", x + 18, y + 70);
    return;
  }

  drawPanelChrome(ctx, x, y, width, height, "#7ca57b");

  panel.rows.forEach((row) => {
    const selected = row.index === state.ui.selectedQuestIndex;
    ctx.fillStyle = selected ? "rgba(116, 191, 255, 0.16)" : "rgba(0, 0, 0, 0.28)";
    ctx.fillRect(row.rect.x, row.rect.y, row.rect.width, row.rect.height);
    ctx.fillStyle =
      row.quest.status === "done"
        ? "#9de1a3"
        : row.quest.status === "complete"
          ? "#ffdc9c"
          : "#fff1c6";
    ctx.font = "700 14px Segoe UI, Arial";
    ctx.fillText(row.quest.title, row.rect.x + 12, row.rect.y + 18);
    ctx.fillStyle = "#d8e6d4";
    ctx.font = "12px Segoe UI, Arial";
    row.descriptionLines.forEach((line, index) => {
      ctx.fillText(line, row.rect.x + 12, row.rect.y + 38 + index * 16);
    });

    let objectiveY = row.rect.y + 38 + row.descriptionLines.length * 16 + 8;
    if (row.turnInLines.length > 0) {
      ctx.fillStyle = "#ffd7a3";
      row.turnInLines.forEach((line) => {
        ctx.fillText(line, row.rect.x + 12, objectiveY);
        objectiveY += 14;
      });
      objectiveY += 2;
    }

    for (const objective of row.quest.objectives) {
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillText(
        `${objective.label}: ${Math.min(objective.current, objective.required)}/${objective.required}`,
        row.rect.x + 12,
        objectiveY
      );
      objectiveY += 14;
    }

    if (row.rewardLines.length > 0) {
      objectiveY += 4;
      ctx.fillStyle = "#b7dcae";
      row.rewardLines.forEach((line) => {
        ctx.fillText(line, row.rect.x + 12, objectiveY);
        objectiveY += 14;
      });
    }
  });
}

function drawCharacterOverlay(ctx, state) {
  const frame = getCharacterOverlayFrame(state);
  const { x, y, width, height } = frame;
  const portrait = getAylaPortrait();
  const bonuses = getPlayerBonuses(state.progression);
  const helpWidth = Math.min(280, Math.max(180, width * 0.32));
  const helpX = x + width - helpWidth - 18;

  ctx.fillStyle = "rgba(0, 0, 0, 0.86)";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#10161d";
  ctx.fillRect(x + 6, y + 6, width - 12, height - 12);
  ctx.fillStyle = "#f6ead0";
  ctx.font = "700 24px Segoe UI, Arial";
  ctx.fillText("Ayla", x + 18, y + 30);
  ctx.font = "12px Segoe UI, Arial";
  ctx.fillStyle = "#d7e4cf";
  drawWrappedText(
    ctx,
    "C / I / T / Tab switch views  |  Esc closes",
    helpX,
    y + 18,
    helpWidth,
    14,
    2
  );

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
  const panel = getCharacterPanelData(state, { x, y, width, height });
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

  const slotX = x + width - 280;
  let slotY = y + 122;

  ctx.fillStyle = "#fff2d5";
  ctx.font = "700 16px Segoe UI, Arial";
  ctx.fillText("Equipment", slotX, slotY - 18);

  panel.equipped.forEach((entry, index) => {
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

  if (panel.unequipButton) {
    drawActionButton(ctx, panel.unequipButton, state.ui.hoverTarget, "#0f151c", "#f6ead0");
  }
}

function drawInventoryTab(ctx, state, x, y, width, height) {
  const panel = getInventoryPanelData(state, { x, y, width, height });
  const { entries, selectedEntry, actionSlots, service, detailsRect } = panel;
  const listX = x + 220;
  const listWidth = 352;
  const detailsX = detailsRect.x;
  const detailsY = detailsRect.y + 18;
  let rowY = y + 176;

  ctx.fillStyle = "#fff2d5";
  ctx.font = "700 16px Segoe UI, Arial";
  ctx.fillText("Inventory", listX, rowY - 18);

  panel.filterButtons.forEach((button) =>
    drawActionButton(ctx, button, state.ui.hoverTarget, button.active ? "#173120" : "#11161d", button.active ? "#fff7df" : "#d7e4cf")
  );
  panel.sortButtons.forEach((button) =>
    drawActionButton(ctx, button, state.ui.hoverTarget, button.active ? "#1a2535" : "#11161d", button.active ? "#fff7df" : "#d7e4cf")
  );

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

  if (!selectedEntry) return;

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

  if (panel.primaryButton) {
    drawActionButton(ctx, panel.primaryButton, state.ui.hoverTarget, "#11202c", "#f6ead0");
  }
  if (panel.sellButton) {
    drawActionButton(ctx, panel.sellButton, state.ui.hoverTarget, "#241714", "#fff0dd");
  }

  let detailY = detailsY + ((panel.primaryButton || panel.sellButton) ? 116 : 96);
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
      const button = panel.bindButtons[index];
      if (!button) return;
      const assigned = slot.itemId === selectedEntry.id;
      drawActionButton(ctx, button, state.ui.hoverTarget, assigned ? "#14263a" : "#11161d", assigned ? "#fff5d8" : "#cfd9d3");
      ctx.font = "10px Segoe UI, Arial";
      ctx.fillStyle = "#9dd9a2";
      ctx.fillText(assigned ? "Bound" : "Assign", button.rect.x + 8, button.rect.y + 29);
    });
  }
}

function drawTalentTab(ctx, state, x, y, width, height) {
  const panel = getTalentPanelData(state, { x, y, width, height });
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
    ctx.fillText(unlocked ? "Unlocked" : "Choose and unlock", x + width - 238, rowY + 18);
    rowY += 46;
  });

  if (panel.unlockButton) {
    drawActionButton(ctx, panel.unlockButton, state.ui.hoverTarget, "#142219", "#f6ead0");
  }

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
  const panel = getServicePanelData(state, { x, y, width, height });
  const { service, bodyX, bodyY } = panel;

  ctx.fillStyle = "#fff2d5";
  ctx.font = "700 16px Segoe UI, Arial";
  ctx.fillText(service ? service.title : "Services", bodyX, bodyY - 18);
  ctx.font = "11px Segoe UI, Arial";
  ctx.fillStyle = "#d7e4cf";
  const subtitleX = bodyX + Math.max(132, Math.ceil(ctx.measureText(service ? service.title : "Services").width) + 18);
  panel.subtitleLines.forEach((line, index) => {
    ctx.fillText(line, subtitleX, bodyY - 18 + index * 14);
  });

  if (!service) {
    ctx.fillStyle = "#d7e4cf";
    ctx.font = "13px Segoe UI, Arial";
    ctx.fillText("No service is currently open.", bodyX, panel.contentTop + 10);
    return;
  }

  ctx.fillStyle = "#e7d081";
  ctx.font = "700 12px Segoe UI, Arial";
  ctx.fillText(`Silver: ${getCurrency(state.progression)}`, bodyX, panel.contentTop + 8);

  if (service.kind === "shop") {
    panel.subpanelButtons.forEach((button) =>
      drawActionButton(ctx, button, state.ui.hoverTarget, button.active ? "#2a2115" : "#11161d", button.active ? "#fff7df" : "#d7e4cf")
    );
    panel.filterButtons.forEach((button) =>
      drawActionButton(ctx, button, state.ui.hoverTarget, button.active ? "#173120" : "#11161d", button.active ? "#fff7df" : "#d7e4cf")
    );
    panel.sortButtons.forEach((button) =>
      drawActionButton(ctx, button, state.ui.hoverTarget, button.active ? "#1a2535" : "#11161d", button.active ? "#fff7df" : "#d7e4cf")
    );
    ctx.fillStyle = "#cfd9d3";

      panel.rows.forEach(({ entry, index, rect: rowRect }) => {
        const serviceItem = entry.item || entry;
        const selected = index === state.ui.selectedServiceIndex;
        ctx.fillStyle = selected ? "rgba(121, 184, 255, 0.16)" : "rgba(0, 0, 0, 0.26)";
        ctx.fillRect(rowRect.x, rowRect.y, rowRect.width, rowRect.height);
        ctx.strokeStyle = selected ? "#79b8ff" : "#263142";
        ctx.strokeRect(rowRect.x, rowRect.y, rowRect.width, rowRect.height);
        ctx.fillStyle = serviceItem.color || "#d8e2ec";
        ctx.fillRect(rowRect.x + 10, rowRect.y + 10, 12, 12);
        ctx.fillStyle = getRarityAccent(serviceItem.rarity, "#fff6d8");
        ctx.font = "700 12px Segoe UI, Arial";
        ctx.fillText(serviceItem.name, rowRect.x + 30, rowRect.y + 18);
        ctx.fillStyle = "#d7e4cf";
        ctx.font = "11px Segoe UI, Arial";
        drawWrappedText(ctx, serviceItem.description, rowRect.x + 30, rowRect.y + 34, rowRect.width - 130, 12, 2);
        ctx.textAlign = "right";
        ctx.fillStyle = entry.affordable ? "#f1d786" : "#c67d72";
        ctx.font = "700 12px Segoe UI, Arial";
        ctx.fillText(`${entry.price} s`, rowRect.x + rowRect.width - 12, rowRect.y + 18);
        ctx.textAlign = "left";
      });

    if (panel.selected) {
      const selectedItem = panel.selected.item || panel.selected;
      ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
      ctx.fillRect(panel.detailsRect.x, panel.detailsRect.y, panel.detailsRect.width, panel.detailsRect.height);
      ctx.strokeStyle = "#2d3848";
      ctx.strokeRect(panel.detailsRect.x, panel.detailsRect.y, panel.detailsRect.width, panel.detailsRect.height);
      ctx.fillStyle = getRarityAccent(selectedItem.rarity, "#fff2d5");
      ctx.font = "700 14px Segoe UI, Arial";
      ctx.fillText(selectedItem.name, panel.detailsRect.x + 12, panel.detailsRect.y + 20);
      ctx.fillStyle = "#d7e4cf";
      ctx.font = "12px Segoe UI, Arial";
      wrapText(ctx, selectedItem.description, panel.detailsRect.x + 12, panel.detailsRect.y + 42, panel.detailsRect.width - 24, 18);
      ctx.fillStyle = "#e9d281";
      ctx.font = "11px Segoe UI, Arial";
      ctx.fillText(`Price ${panel.selected.price} silver`, panel.detailsRect.x + 12, panel.detailsRect.y + 106);

      if (selectedItem.category === "equipment" && selectedItem.slot) {
        const equippedItem = getEquippedItems(state.progression).find((entry) => entry.slot === selectedItem.slot)?.item;
        let compareY = panel.detailsRect.y + 130;
        ctx.fillStyle = "#fff2d5";
        ctx.font = "700 12px Segoe UI, Arial";
        ctx.fillText("Comparison", panel.detailsRect.x + 12, compareY);
        compareY += 18;
        if (equippedItem) {
          ctx.fillStyle = getRarityAccent(equippedItem.rarity, "#d7e4cf");
          ctx.font = "700 11px Segoe UI, Arial";
          ctx.fillText(`Equipped: ${equippedItem.name}`, panel.detailsRect.x + 12, compareY);
          compareY += 16;
          for (const line of buildComparisonLines(selectedItem, equippedItem)) {
            ctx.fillStyle = line.delta > 0 ? "#9ce1a3" : line.delta < 0 ? "#f0a08d" : "#d7e4cf";
            ctx.font = "11px Segoe UI, Arial";
            ctx.fillText(`${line.label}: ${line.current} (${line.delta > 0 ? "+" : ""}${line.delta})`, panel.detailsRect.x + 12, compareY);
            compareY += 14;
          }
        } else {
          ctx.fillStyle = "#d7e4cf";
          ctx.font = "11px Segoe UI, Arial";
          ctx.fillText("Nothing equipped in this slot.", panel.detailsRect.x + 12, compareY);
        }
      }

      if (panel.actionButton) {
        drawActionButton(ctx, panel.actionButton, state.ui.hoverTarget, "#241d12", "#fff6dd");
      }
    }
    return;
  }

  if (service.kind === "altar") {
    panel.rows.forEach(({ entry, index, rect: rowRect, descriptionLines }) => {
      const selected = index === state.ui.selectedServiceIndex;
      ctx.fillStyle = selected ? "rgba(121, 184, 255, 0.16)" : "rgba(0, 0, 0, 0.26)";
      ctx.fillRect(rowRect.x, rowRect.y, rowRect.width, rowRect.height);
      ctx.strokeStyle = selected ? "#79b8ff" : "#263142";
      ctx.strokeRect(rowRect.x, rowRect.y, rowRect.width, rowRect.height);
      ctx.fillStyle = "#fff6d8";
      ctx.font = "700 12px Segoe UI, Arial";
      ctx.fillText(entry.title, rowRect.x + 12, rowRect.y + 18);
      ctx.fillStyle = "#d7e4cf";
      ctx.font = "11px Segoe UI, Arial";
      descriptionLines.forEach((line, lineIndex) => {
        ctx.fillText(line, rowRect.x + 12, rowRect.y + 36 + lineIndex * 13);
      });
      ctx.fillStyle = entry.affordable ? "#f1d786" : "#c67d72";
      ctx.fillText(formatActionCost(entry), rowRect.x + 12, rowRect.y + rowRect.height - 8);
    });
    if (panel.actionButton) {
      drawActionButton(ctx, panel.actionButton, state.ui.hoverTarget, "#182117", "#fff6dd");
    }
    return;
  }

  drawStashColumn(ctx, bodyX, bodyY + 28, panel.panelW, "Pack", panel.lists.pack, state.ui.selectedServiceIndex, state.ui.serviceSubpanel === "pack");
  drawStashColumn(
    ctx,
    bodyX + panel.panelW + 24,
    bodyY + 28,
    panel.panelW,
    "Stash",
    panel.lists.stash,
    state.ui.selectedStashIndex,
    state.ui.serviceSubpanel === "stash"
  );
  ctx.fillStyle = "#d7e4cf";
  ctx.font = "11px Segoe UI, Arial";
  ctx.fillText("Click a list to focus it  |  Click selected row to transfer one item", bodyX, y + height - 36);
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
  if (!state.story.focus || state.story.dialogue || state.gameOver || state.ui.menuOpen || state.ui.questLogOpen || state.ui.worldMapOpen) return;

  ctx.font = "700 14px Segoe UI, Arial";
  const promptLines = toWrappedLines(ctx, `E  ${state.story.prompt}`, Math.min(320, state.viewport.width - 72));
  const panelW = Math.min(
    state.viewport.width - 56,
    Math.max(260, Math.ceil(Math.max(...promptLines.map((line) => ctx.measureText(line).width), 220)) + 32)
  );
  const panelH = 24 + promptLines.length * 16;
  const x = state.viewport.width / 2 - panelW / 2;
  const y = state.viewport.height - panelH - 128;

  ctx.fillStyle = "rgba(0, 0, 0, 0.68)";
  ctx.fillRect(x, y, panelW, panelH);
  ctx.fillStyle = "#10161d";
  ctx.fillRect(x + 4, y + 4, panelW - 8, panelH - 8);
  ctx.font = "700 14px Segoe UI, Arial";
  ctx.fillStyle = "#fff6d0";
  drawWrappedText(ctx, `E  ${state.story.prompt}`, x + 16, y + 22, panelW - 32, 16, 3);
}

function drawExitPrompt(ctx, state) {
  if (!state.nearExit || state.gameOver || state.story.dialogue || state.ui.menuOpen || state.ui.questLogOpen || state.ui.worldMapOpen) return;

  const locked = Boolean(state.nearExit.requiresFlag && !state.progression.worldFlags?.[state.nearExit.requiresFlag]);
  const leavingCombat =
    state.combatTimer > 0 ||
    state.enemies.length > 0 ||
    (state.boss && !state.boss.dead) ||
    state.hostileProjectiles.length > 0;
  const title = locked ? state.nearExit.label : `Travel to ${state.nearExit.label}`;
  const bodyText = locked
    ? state.nearExit.lockedText || "The path is sealed."
    : leavingCombat
      ? "Hold E to leave this zone. Current local threats will reset."
      : "Hold E to travel to the next zone.";
  ctx.font = "700 15px Segoe UI, Arial";
  const titleWidth = ctx.measureText(title).width;
  ctx.font = "12px Segoe UI, Arial";
  const detailLines = toWrappedLines(ctx, bodyText, Math.min(360, state.viewport.width - 96));
  const panelW = Math.min(
    state.viewport.width - 48,
    Math.max(332, Math.ceil(Math.max(titleWidth, ...detailLines.map((line) => ctx.measureText(line).width))) + 40)
  );
  const panelH = 34 + detailLines.length * 14 + (locked ? 8 : 22);
  const x = state.viewport.width / 2 - panelW / 2;
  const y = Math.max(100, state.viewport.height - panelH - 108);
  const progress = Math.max(0, Math.min(1, state.exitCharge));

  ctx.fillStyle = "rgba(0, 0, 0, 0.68)";
  ctx.fillRect(x, y, panelW, panelH);
  ctx.fillStyle = "#10161d";
  ctx.fillRect(x + 4, y + 4, panelW - 8, panelH - 8);
  ctx.font = "700 15px Segoe UI, Arial";
  ctx.fillStyle = locked ? "#ffc1b8" : "#fff6d0";
  ctx.fillText(title, x + 16, y + 22);
  ctx.font = "12px Segoe UI, Arial";
  ctx.fillStyle = locked ? "#f0c1bc" : "#d8e8cc";
  drawWrappedText(ctx, bodyText, x + 16, y + 40, panelW - 32, 14, 4);
  if (!locked) {
    ctx.fillStyle = "#1b1412";
    ctx.fillRect(x + 16, y + panelH - 16, panelW - 32, 8);
    ctx.fillStyle = "#fff0ad";
    ctx.fillRect(x + 18, y + panelH - 14, Math.round((panelW - 36) * progress), 4);
  }
}

function drawWorldMapOverlay(ctx, state) {
  const viewport = state.viewport;
  const panelW = Math.min(820, viewport.width - 56);
  const panelH = Math.min(620, viewport.height - 56);
  const x = Math.round(viewport.width / 2 - panelW / 2);
  const y = Math.round(viewport.height / 2 - panelH / 2);
  const contentX = x + 28;
  const contentY = y + 88;
  const graphW = panelW - 56;
  const graphH = panelH - 144;

  ctx.fillStyle = "rgba(4, 8, 11, 0.84)";
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  ctx.fillStyle = "rgba(7, 11, 15, 0.95)";
  ctx.fillRect(x, y, panelW, panelH);
  ctx.fillStyle = "#111820";
  ctx.fillRect(x + 4, y + 4, panelW - 8, panelH - 8);
  ctx.strokeStyle = "#d7c28b";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 2, y + 2, panelW - 4, panelH - 4);
  ctx.strokeStyle = "#31403a";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 12, y + 12, panelW - 24, panelH - 24);

  ctx.fillStyle = "#f4ead3";
  ctx.font = "700 30px Georgia, serif";
  ctx.fillText("Travel Map", contentX, y + 40);

  ctx.fillStyle = "#c8d4bd";
  ctx.font = "14px Segoe UI, Arial";
  drawWrappedText(
    ctx,
    "Trace the roads between restored groves, ruins, dungeons, and boss sites.",
    contentX,
    y + 62,
    panelW - 180,
    16,
    2
  );

  ctx.fillStyle = "#9db09a";
  ctx.font = "12px Segoe UI, Arial";
  ctx.textAlign = "right";
  ctx.fillText("M / Esc close", x + panelW - 26, y + 38);
  ctx.textAlign = "left";

  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.fillRect(contentX, contentY, graphW, graphH);
  ctx.fillStyle = "#0f151c";
  ctx.fillRect(contentX + 2, contentY + 2, graphW - 4, graphH - 4);
  ctx.strokeStyle = "#384855";
  ctx.lineWidth = 1;
  ctx.strokeRect(contentX + 2, contentY + 2, graphW - 4, graphH - 4);

  const nodePositions = {};
  for (const [sceneId, point] of Object.entries(WORLD_MAP_LAYOUT)) {
    nodePositions[sceneId] = {
      x: contentX + 36 + point.x * Math.max(40, graphW - 72),
      y: contentY + 34 + point.y * Math.max(40, graphH - 68),
    };
  }

  const drawnEdges = new Set();
  ctx.lineWidth = 3;
  for (const [sceneId, scene] of Object.entries(SCENES)) {
    const from = nodePositions[sceneId];
    if (!from) continue;

    for (const connection of Object.values(scene.connections || {})) {
      const targetId = connection.toSceneId;
      const to = nodePositions[targetId];
      if (!to) continue;

      const edgeKey = [sceneId, targetId].sort().join(":");
      if (drawnEdges.has(edgeKey)) continue;
      drawnEdges.add(edgeKey);

      const edgeTouched =
        sceneId === state.currentSceneId ||
        targetId === state.currentSceneId ||
        state.sceneProgress[sceneId]?.cleared ||
        state.sceneProgress[targetId]?.cleared;
      ctx.strokeStyle = edgeTouched ? "rgba(132, 202, 166, 0.58)" : "rgba(86, 102, 118, 0.42)";
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
  }

  for (const [sceneId, scene] of Object.entries(SCENES)) {
    const point = nodePositions[sceneId];
    if (!point) continue;

    const current = sceneId === state.currentSceneId;
    const cleared = Boolean(state.sceneProgress[sceneId]?.cleared);
    const color = getBiomeMapColor(scene.biomeId);
    const radius = current ? 14 : 10;

    ctx.fillStyle = current ? "#f4ead3" : "rgba(10, 14, 18, 0.92)";
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius + 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = current ? "#fff7d8" : cleared ? "#b8e4b0" : "#243240";
    ctx.lineWidth = current ? 3 : 2;
    ctx.stroke();

    if (cleared) {
      ctx.fillStyle = "#f9efb1";
      ctx.fillRect(point.x + radius - 1, point.y - radius - 2, 8, 8);
    }

    ctx.fillStyle = current ? "#fff7d8" : "#e4e8de";
    ctx.font = current ? "700 13px Segoe UI, Arial" : "600 12px Segoe UI, Arial";
    ctx.textAlign = "center";
    const titleLines = toWrappedLines(ctx, scene.title, 110);
    titleLines.slice(0, 2).forEach((line, index) => {
      ctx.fillText(line, point.x, point.y + radius + 18 + index * 14);
    });
    ctx.fillStyle = current ? "#cfe7c5" : "#8ea1ac";
    ctx.font = "11px Segoe UI, Arial";
    ctx.fillText(scene.regionName, point.x, point.y + radius + 48);
    ctx.textAlign = "left";
  }

  const footer = state.scene?.title
    ? `Current zone: ${state.scene.title}. Hold E on a gate to confirm travel.`
    : "Hold E on a gate to confirm travel.";
  ctx.fillStyle = "#c8d4bd";
  ctx.font = "12px Segoe UI, Arial";
  drawWrappedText(ctx, footer, contentX, y + panelH - 28, panelW - 56, 15, 2);
}

function drawToast(ctx, state) {
  if (!state.story.toastText || state.story.toastTimer <= 0) return;

  ctx.font = "700 13px Segoe UI, Arial";
  const lines = toWrappedLines(ctx, state.story.toastText, Math.min(360, state.viewport.width - 96));
  const boxW = Math.min(
    state.viewport.width - 48,
    Math.max(220, Math.ceil(Math.max(...lines.map((line) => ctx.measureText(line).width))) + 44)
  );
  const boxH = 20 + lines.length * 16;
  const boxX = state.viewport.width / 2 - boxW / 2;
  const boxY = 146;

  ctx.save();
  ctx.globalAlpha = Math.min(1, state.story.toastTimer / 0.35);
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.fillStyle = "#fff1c6";
  ctx.font = "700 13px Segoe UI, Arial";
  ctx.textAlign = "center";
  lines.forEach((line, index) => {
    ctx.fillText(line, state.viewport.width / 2, boxY + 18 + index * 16);
  });
  ctx.restore();
  ctx.textAlign = "left";
}

function getBiomeMapColor(biomeId) {
  switch (biomeId) {
    case "marsh":
      return "#71c8b8";
    case "highlands":
      return "#afd88b";
    case "ember":
      return "#d97a54";
    case "frost":
      return "#8fc9ef";
    case "blight":
      return "#b27ae3";
    case "ancient":
      return "#d9bb73";
    default:
      return "#84c788";
  }
}

function drawDialogue(ctx, state) {
  const dialogue = state.story.dialogue;
  if (!dialogue) return;

  const x = 56;
  const width = state.viewport.width - 112;
  ctx.font = "14px Segoe UI, Arial";
  const wrappedLines = toWrappedLines(ctx, dialogue.lines[dialogue.index], width - 36);
  const bodyHeight = Math.max(36, wrappedLines.length * 20);
  const height = 84 + bodyHeight;
  const y = state.viewport.height - height - 40;

  ctx.fillStyle = "rgba(0, 0, 0, 0.86)";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#10161d";
  ctx.fillRect(x + 4, y + 4, width - 8, height - 8);
  ctx.fillStyle = "#fff6d0";
  ctx.font = "700 16px Segoe UI, Arial";
  ctx.fillText(dialogue.speakerName, x + 18, y + 24);
  ctx.fillStyle = "#eff7e8";
  ctx.font = "14px Segoe UI, Arial";
  drawWrappedText(ctx, dialogue.lines[dialogue.index], x + 18, y + 48, width - 36, 20, 6);
  ctx.fillStyle = "rgba(255, 246, 208, 0.72)";
  ctx.font = "12px Segoe UI, Arial";
  ctx.textAlign = "right";
  ctx.fillText("E / Enter / Space", x + width - 18, y + height - 16);
  ctx.textAlign = "left";
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

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = Infinity) {
  const lines = toWrappedLines(ctx, text, maxWidth).slice(0, maxLines);
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
  return lines;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  drawWrappedText(ctx, text, x, y, maxWidth, lineHeight);
}

function toWrappedLines(ctx, text, maxWidth) {
  const source = String(text || "").trim();
  if (!source) return [""];
  const words = source.split(/\s+/);
  let line = "";
  const lines = [];

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function getMeasureContext(font, fallbackCtx = null) {
  const ctx = TEXT_MEASURE_CTX || fallbackCtx;
  if (ctx && font) {
    ctx.font = font;
  }
  return ctx;
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

function drawActionButton(ctx, button, hoverTarget, fill, textColor) {
  const hovered =
    hoverTarget?.action === button.action &&
    hoverTarget?.index === button.index &&
    hoverTarget?.slotIndex === button.slotIndex &&
    hoverTarget?.subpanel === button.subpanel &&
    hoverTarget?.value === button.value;
  ctx.fillStyle = hovered ? "rgba(121, 184, 255, 0.18)" : fill;
  ctx.fillRect(button.rect.x, button.rect.y, button.rect.width, button.rect.height);
  ctx.strokeStyle = hovered ? "#d9efff" : button.accent;
  ctx.strokeRect(button.rect.x, button.rect.y, button.rect.width, button.rect.height);
  ctx.fillStyle = textColor;
  ctx.font = "700 11px Segoe UI, Arial";
  ctx.fillText(button.label, button.rect.x + 10, button.rect.y + 18);
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

function rect(x, y, width, height) {
  return { x, y, width, height };
}

function pointInRect(x, y, box) {
  return (
    box &&
    x >= box.x &&
    x <= box.x + box.width &&
    y >= box.y &&
    y <= box.y + box.height
  );
}

function makeButton(x, y, width, height, label, action, accent = "#79b8ff", extra = {}) {
  return {
    rect: { x, y, width, height },
    label,
    accent,
    action,
    ...extra,
  };
}

function makeOptionButtons(x, y, options, currentValue, action, accent = "#79b8ff", extra = {}) {
  return options.map(([value, label], index) =>
    makeButton(x + index * 66, y, 60, 22, label, action, currentValue === value ? accent : "#4d5b69", {
      value,
      active: currentValue === value,
      ...extra,
    })
  );
}

function getCharacterOverlayFrame(state) {
  const marginX = Math.max(28, Math.min(68, Math.floor(state.viewport.width * 0.05)));
  const marginTop = Math.max(24, Math.min(70, Math.floor(state.viewport.height * 0.06)));
  const marginBottom = Math.max(44, Math.min(150, Math.floor(state.viewport.height * 0.12)));
  return {
    x: marginX,
    y: marginTop,
    width: state.viewport.width - marginX * 2,
    height: state.viewport.height - marginTop - marginBottom,
  };
}

function getTabTargets(state, frame) {
  const tabs = [
    ["character", "Character"],
    ["inventory", "Inventory"],
    ["talents", "Talents"],
  ];
  if (state.ui.activeServiceId) {
    tabs.push(["services", "Services"]);
  }

  return tabs.map(([id, label], index) => ({
    rect: rect(frame.x + 18 + index * 126, frame.y + 48, 116, 28),
    action: "open-tab",
    tab: id,
    label,
    tooltip: {
      title: label,
      lines: [`Open the ${label.toLowerCase()} panel.`],
      accent: "#8ab6ff",
    },
  }));
}

function getInventoryPanelData(state, frame) {
  const entries = getInventoryEntries(state.progression, {
    filter: state.ui.inventoryFilter,
    sort: state.ui.inventorySort,
  });
  const listX = frame.x + 220;
  const listWidth = 352;
  const detailsX = frame.x + frame.width - 292;
  const detailsY = frame.y + 170;
  const rows = entries.map((entry, index) => ({
    entry,
    index,
    rect: rect(listX, frame.y + 160 + index * 40, listWidth, 34),
  }));
  const selectedEntry = entries[state.ui.selectedInventoryIndex] || null;
  const actionSlots = getActionSlotEntries(state.progression);
  const service = getActiveService(state);
  const data = {
    entries,
    rows,
    selectedEntry,
    actionSlots,
    service,
    filterButtons: makeOptionButtons(listX, frame.y + 84, INVENTORY_FILTER_BUTTONS, state.ui.inventoryFilter, "inventory-filter", "#8ecf9a"),
    sortButtons: makeOptionButtons(listX + 270, frame.y + 84, INVENTORY_SORT_BUTTONS, state.ui.inventorySort, "inventory-sort", "#8fb9ff"),
    detailsRect: rect(detailsX, detailsY - 18, 240, 214),
    primaryButton: null,
    sellButton: null,
    bindButtons: [],
  };

  if (!selectedEntry) {
    return data;
  }

  const canPrimary =
    selectedEntry.category === "equipment" || selectedEntry.category === "consumable";
  if (canPrimary) {
    const primaryLabel = selectedEntry.category === "equipment" ? "Equip" : "Use";
    data.primaryButton = makeButton(
      detailsX + 12,
      detailsY + 76,
      98,
      28,
      primaryLabel,
      "inventory-primary",
      "#79b8ff",
      { index: state.ui.selectedInventoryIndex, entry: selectedEntry }
    );
  }

  if (service?.kind === "shop") {
    data.sellButton = makeButton(
      detailsX + 128,
      detailsY + 76,
      100,
      28,
      "Sell",
      "inventory-sell",
      "#d99b74",
      { index: state.ui.selectedInventoryIndex, entry: selectedEntry }
    );
  }

  let detailY = detailsY + ((data.primaryButton || data.sellButton) ? 116 : 96);
  if (selectedEntry.maxStack) {
    detailY += 34;
  }
  if (selectedEntry.bonuses) {
    detailY += Object.keys(selectedEntry.bonuses).length * 16 + 4;
  }
  if (selectedEntry.category === "equipment" && selectedEntry.slot) {
    const equippedItem = getEquippedItems(state.progression).find((entry) => entry.slot === selectedEntry.slot)?.item;
    detailY += equippedItem ? 58 + buildComparisonLines(selectedEntry, equippedItem).length * 14 : 42;
  }

  if (selectedEntry.usable || selectedEntry.category === "consumable" || selectedEntry.effect) {
    data.bindButtons = actionSlots.map((slot, slotIndex) =>
      makeButton(detailsX + 12 + slotIndex * 72, detailY + 14, 62, 36, `Bind ${slot.key}`, "inventory-bind", "#79b8ff", {
        slotIndex,
        index: state.ui.selectedInventoryIndex,
        entry: selectedEntry,
        assigned: slot.itemId === selectedEntry.id,
      })
    );
  }

  return data;
}

function getCharacterPanelData(state, frame) {
  const slotX = frame.x + frame.width - 280;
  const slotY = frame.y + 122;
  const equipped = getEquippedItems(state.progression);
  const rows = equipped.map((entry, index) => ({
    ...entry,
    index,
    rect: rect(slotX, slotY - 16 + index * 42, 220, 34),
  }));
  const selected = equipped[state.ui.selectedEquipmentIndex] || null;
  return {
    equipped,
    rows,
    unequipButton:
      selected?.item
        ? makeButton(slotX, slotY + equipped.length * 42 + 6, 220, 28, "Unequip", "equipment-unequip", "#d99b74", {
            index: state.ui.selectedEquipmentIndex,
          })
        : null,
  };
}

function getTalentPanelData(state, frame) {
  const rows = TALENT_DEFS.map((talent, index) => ({
    talent,
    index,
    rect: rect(frame.x + 220, frame.y + 106 + index * 46, frame.width - 280, 38),
  }));
  const selectedTalent = TALENT_DEFS[state.ui.selectedTalentIndex] || null;
  const selectedRow = rows[state.ui.selectedTalentIndex] || null;
  return {
    rows,
    selectedTalent,
    unlockButton:
      selectedTalent && !state.progression.talents[selectedTalent.id]
        ? makeButton(
            selectedRow.rect.x + selectedRow.rect.width - 122,
            selectedRow.rect.y + 6,
            108,
            24,
            "Unlock",
            "talent-unlock",
            "#9ce1a3",
            { index: state.ui.selectedTalentIndex, talent: selectedTalent }
          )
        : null,
  };
}

function getServicePanelData(state, frame) {
  const service = getActiveService(state);
  const bodyX = frame.x + 220;
  const bodyY = frame.y + 122;
  const subtitle = service ? service.subtitle : "Visit a service NPC or village object.";
  const subtitleMeasure = getMeasureContext("11px Segoe UI, Arial");
  const subtitleLines = subtitleMeasure
    ? toWrappedLines(subtitleMeasure, subtitle, Math.max(180, frame.width - 460))
    : [subtitle];
  const contentTop = bodyY + Math.max(0, subtitleLines.length - 1) * 14;

  if (!service) {
    return { service, bodyX, bodyY, subtitleLines, contentTop };
  }

  if (service.kind === "shop") {
    const entries = getServiceEntries(state);
    const rows = entries.map((entry, index) => ({
      entry,
      index,
      rect: rect(bodyX, contentTop + 50 + index * 46, frame.width - 280, 38),
    }));
    const selected = entries[state.ui.selectedServiceIndex] || null;
    const detailsX = frame.x + frame.width - 292;
    const detailsY = contentTop + 86;
    const buyButton = selected
      ? makeButton(
          detailsX + 12,
          detailsY + 168,
          216,
          28,
          selected.affordable
            ? `${selected.mode === "buyback" ? "Recover" : "Buy"} for ${selected.price} silver`
            : "Not enough silver",
          "service-activate",
          selected.affordable ? "#d7bb71" : "#8a6e6a",
          {
          index: state.ui.selectedServiceIndex,
          entry: selected,
          }
        )
      : null;
    return {
      service,
      bodyX,
      bodyY,
      subtitleLines,
      contentTop,
      rows,
      selected,
      subpanelButtons: [
        makeButton(bodyX, frame.y + 84, 88, 22, "Stock", "service-subpanel", state.ui.serviceSubpanel === "stock" ? "#d7bb71" : "#4d5b69", { value: "stock" }),
        makeButton(bodyX + 96, frame.y + 84, 88, 22, "Buyback", "service-subpanel", state.ui.serviceSubpanel === "buyback" ? "#d7bb71" : "#4d5b69", { value: "buyback" }),
      ],
      filterButtons: makeOptionButtons(bodyX + 202, frame.y + 84, SHOP_FILTER_BUTTONS, state.ui.shopFilter, "service-filter", "#8ecf9a"),
      sortButtons: makeOptionButtons(bodyX + 472, frame.y + 84, SHOP_SORT_BUTTONS, state.ui.shopSort, "service-sort", "#8fb9ff"),
      detailsRect: rect(detailsX, detailsY - 18, 240, 214),
      actionButton: buyButton,
    };
  }

  if (service.kind === "altar") {
    const entries = getServiceEntries(state);
    const rowWidth = frame.width - 280;
    const rows = [];
    let rowY = contentTop + 44;
    const measureCtx = getMeasureContext("11px Segoe UI, Arial");

    entries.forEach((entry, index) => {
      const descriptionLines = measureCtx
        ? toWrappedLines(measureCtx, entry.description, rowWidth - 24).slice(0, 3)
        : [entry.description];
      const rowHeight = Math.max(68, 40 + descriptionLines.length * 13);
      rows.push({
        entry,
        index,
        descriptionLines,
        rect: rect(bodyX, rowY, rowWidth, rowHeight),
      });
      rowY += rowHeight + 12;
    });
    const selected = entries[state.ui.selectedServiceIndex] || null;
    const actionButton = selected
      ? makeButton(bodyX, frame.y + frame.height - 86, frame.width - 280, 30, selected.affordable ? "Invoke Rite" : "Requirements Not Met", "service-activate", selected.affordable ? "#b1e29f" : "#8a6e6a", {
          index: state.ui.selectedServiceIndex,
          entry: selected,
        })
      : null;
    return {
      service,
      bodyX,
      bodyY,
      subtitleLines,
      contentTop,
      rows,
      selected,
      actionButton,
    };
  }

  const lists = getStashUiEntries(state);
  const panelW = Math.floor((frame.width - 320) / 2);
  const packRows = lists.pack.slice(0, 6).map((entry, index) => ({
    entry,
    index,
    rect: rect(bodyX + 8, bodyY + 48 + index * 36, panelW - 16, 30),
  }));
  const stashRows = lists.stash.slice(0, 6).map((entry, index) => ({
    entry,
    index,
    rect: rect(bodyX + panelW + 32, bodyY + 48 + index * 36, panelW - 16, 30),
  }));
  return {
    service,
    bodyX,
    bodyY,
    subtitleLines,
    contentTop,
    panelW,
    lists,
    packRows,
    stashRows,
  };
}

function getQuestLogPanelData(state) {
  const quests = state.activeQuests || [];
  const x = 56;
  const y = 84;
  const width = state.viewport.width - 112;
  const measureCtx = getMeasureContext("12px Segoe UI, Arial");
  const maxWidth = width - 60;
  let rowY = y + 46;

  return {
    quests,
    rows: quests.map((quest, index) => {
      const descriptionLines = measureCtx
        ? toWrappedLines(measureCtx, quest.description, maxWidth)
        : [quest.description];
      const turnInLines =
        quest.status === "complete" && measureCtx
          ? toWrappedLines(measureCtx, getQuestTurnInLabel(quest), maxWidth, 2)
          : [];
      const rewardLines = measureCtx
        ? toWrappedLines(measureCtx, getQuestRewardSummary(quest.rewards), maxWidth, 3)
        : [];
      const rowHeight = Math.max(
        92,
        38 +
          descriptionLines.length * 16 +
          turnInLines.length * 14 +
          quest.objectives.length * 14 +
          rewardLines.length * 14 +
          20
      );
      const row = {
        quest,
        index,
        descriptionLines,
        turnInLines,
        rewardLines,
        rect: rect(x + 18, rowY, width - 36, rowHeight),
      };
      rowY += rowHeight + 14;
      return row;
    }),
  };
}

function getQuestObjectiveLabel(quest) {
  const objective = quest.objectives.find((entry) => entry.current < entry.required) || quest.objectives[0];
  if (!objective) {
    return quest.description;
  }
  return `${objective.label}: ${Math.min(objective.current, objective.required)}/${objective.required}`;
}

function getQuestTurnInLabel(quest) {
  if (!quest.giverId) {
    return "Return to the grove and report the work complete.";
  }

  const giver = NPC_DEFS[quest.giverId];
  const scene = SCENES[quest.sceneId];
  const locationLabel = scene?.regionName || scene?.title || "the village";
  return `Return to ${giver?.name || "your quest giver"} in ${locationLabel}.`;
}

function getQuestRewardSummary(rewards) {
  if (!rewards) return "Rewards: none";

  const parts = [];
  if (rewards.silver) {
    parts.push(`${rewards.silver} silver`);
  }
  if (rewards.xp) {
    parts.push(`${rewards.xp} XP`);
  }
  if (rewards.talentPoints) {
    parts.push(`${rewards.talentPoints} Talent Point${rewards.talentPoints > 1 ? "s" : ""}`);
  }

  const items = rewards.items || null;
  if (items) {
    for (const [itemId, amount] of Object.entries(items)) {
      const item = ITEM_DEFS[itemId];
      if (!item) continue;
      parts.push(`${amount}x ${item.name}`);
    }
  }

  return parts.length > 0 ? `Rewards: ${parts.join("  |  ")}` : "Rewards: none";
}

function buildItemTooltip(entry, lines = [], progression = null) {
  const tooltipLines = [entry.description];
  if (entry.bonuses) {
    for (const [key, value] of Object.entries(entry.bonuses)) {
      tooltipLines.push(`${formatBonusKey(key)}: ${value > 0 ? "+" : ""}${value}`);
    }
  }
  if (progression && entry.category === "equipment" && entry.slot) {
    const equippedItem = getEquippedItems(progression).find((candidate) => candidate.slot === entry.slot)?.item;
    if (equippedItem && equippedItem.id !== entry.id) {
      tooltipLines.push(`Equipped: ${equippedItem.name}`);
      for (const comparison of buildComparisonLines(entry, equippedItem)) {
        tooltipLines.push(
          `${comparison.label}: ${comparison.current} (${comparison.delta > 0 ? "+" : ""}${comparison.delta})`
        );
      }
    } else if (!equippedItem) {
      tooltipLines.push("Open equipment slot.");
    }
  }
  if (entry.maxStack && typeof entry.amount === "number") {
    tooltipLines.push(`Stack ${entry.amount}/${entry.maxStack}`);
  }
  tooltipLines.push(`Value ${getItemValue(entry.id)} silver`);
  return {
    title: entry.name,
    lines: [...tooltipLines, ...lines].filter(Boolean),
    accent: getRarityAccent(entry.rarity, entry.color || "#79b8ff"),
  };
}

function getMenuHoverTarget(state, mouseX, mouseY) {
  const frame = getCharacterOverlayFrame(state);
  const tabTarget = getTabTargets(state, frame).find((target) => pointInRect(mouseX, mouseY, target.rect));
  if (tabTarget) return tabTarget;

  if (state.ui.activeTab === "character") {
    const panel = getCharacterPanelData(state, frame);
    for (const row of panel.rows) {
      if (pointInRect(mouseX, mouseY, row.rect)) {
        return {
          action: "equipment-select",
          index: row.index,
          rect: row.rect,
          tooltip: row.item
            ? buildItemTooltip(row.item, [`Slot: ${row.slot}`], state.progression)
            : { title: row.slot.toUpperCase(), lines: ["Empty equipment slot."], accent: "#7f8a95" },
        };
      }
    }
    if (panel.unequipButton && pointInRect(mouseX, mouseY, panel.unequipButton.rect)) {
      return {
        ...panel.unequipButton,
        tooltip: { title: "Unequip", lines: ["Return the selected item to your inventory."], accent: panel.unequipButton.accent },
      };
    }
    return null;
  }

  if (state.ui.activeTab === "inventory") {
    const panel = getInventoryPanelData(state, frame);
    for (const button of panel.filterButtons) {
      if (pointInRect(mouseX, mouseY, button.rect)) {
        return {
          ...button,
          tooltip: {
            title: `Filter: ${button.label}`,
            lines: ["Narrow the inventory list."],
            accent: button.accent,
          },
        };
      }
    }
    for (const button of panel.sortButtons) {
      if (pointInRect(mouseX, mouseY, button.rect)) {
        return {
          ...button,
          tooltip: {
            title: `Sort: ${button.label}`,
            lines: ["Reorder the inventory list."],
            accent: button.accent,
          },
        };
      }
    }
    if (panel.primaryButton && pointInRect(mouseX, mouseY, panel.primaryButton.rect)) {
      return {
        ...panel.primaryButton,
        tooltip: { title: panel.primaryButton.label, lines: [panel.primaryButton.entry.description], accent: panel.primaryButton.accent },
      };
    }
    if (panel.sellButton && pointInRect(mouseX, mouseY, panel.sellButton.rect)) {
      return {
        ...panel.sellButton,
        tooltip: { title: "Sell", lines: [`Sell for ${getItemValue(panel.sellButton.entry.id)} silver.`], accent: panel.sellButton.accent },
      };
    }
    for (const button of panel.bindButtons) {
      if (pointInRect(mouseX, mouseY, button.rect)) {
        return {
          ...button,
          tooltip: {
            title: button.assigned ? `Bound to ${button.slotIndex + 2}` : `Bind to ${button.slotIndex + 2}`,
            lines: [button.assigned ? "Click to clear or refresh this binding." : "Assign this usable item to the quick bar."],
            accent: button.accent,
          },
        };
      }
    }
    for (const row of panel.rows) {
      if (pointInRect(mouseX, mouseY, row.rect)) {
        return {
          action: "inventory-select",
          index: row.index,
          entry: row.entry,
          rect: row.rect,
          tooltip: buildItemTooltip(row.entry, [], state.progression),
        };
      }
    }
    return null;
  }

  if (state.ui.activeTab === "talents") {
    const panel = getTalentPanelData(state, frame);
    if (panel.unlockButton && pointInRect(mouseX, mouseY, panel.unlockButton.rect)) {
      return {
        ...panel.unlockButton,
        tooltip: { title: "Unlock Talent", lines: [panel.unlockButton.talent.description], accent: panel.unlockButton.accent },
      };
    }
    for (const row of panel.rows) {
      if (pointInRect(mouseX, mouseY, row.rect)) {
        return {
          action: "talent-select",
          index: row.index,
          talent: row.talent,
          rect: row.rect,
          tooltip: { title: row.talent.name, lines: [row.talent.tree, row.talent.description], accent: "#9ce1a3" },
        };
      }
    }
    return null;
  }

  if (state.ui.activeTab === "services") {
    const panel = getServicePanelData(state, frame);
    if (!panel.service) return null;

    if (panel.service.kind === "shop" || panel.service.kind === "altar") {
      if (panel.service.kind === "shop") {
        for (const button of panel.subpanelButtons || []) {
          if (pointInRect(mouseX, mouseY, button.rect)) {
            return {
              ...button,
              tooltip: {
                title: button.label,
                lines: [button.value === "buyback" ? "Recover recently sold items." : "Browse current stock."],
                accent: button.accent,
              },
            };
          }
        }
        for (const button of panel.filterButtons || []) {
          if (pointInRect(mouseX, mouseY, button.rect)) {
            return {
              ...button,
              tooltip: {
                title: `Filter: ${button.label}`,
                lines: ["Narrow the vendor list."],
                accent: button.accent,
              },
            };
          }
        }
        for (const button of panel.sortButtons || []) {
          if (pointInRect(mouseX, mouseY, button.rect)) {
            return {
              ...button,
              tooltip: {
                title: `Sort: ${button.label}`,
                lines: ["Reorder the vendor list."],
                accent: button.accent,
              },
            };
          }
        }
      }
      if (panel.actionButton && pointInRect(mouseX, mouseY, panel.actionButton.rect)) {
        const selectedItem = panel.selected.item || panel.selected;
        return {
          ...panel.actionButton,
          tooltip: panel.service.kind === "shop"
            ? buildItemTooltip(
                selectedItem,
                [panel.selected.mode === "buyback" ? `Recover for ${panel.selected.price} silver` : `Price ${panel.selected.price} silver`],
                state.progression
              )
            : { title: panel.selected.title, lines: [panel.selected.description, formatActionCost(panel.selected)], accent: panel.actionButton.accent },
        };
      }
      for (const row of panel.rows) {
        if (pointInRect(mouseX, mouseY, row.rect)) {
          const serviceItem = row.entry.item || row.entry;
          const tooltip =
            panel.service.kind === "shop"
              ? buildItemTooltip(
                  serviceItem,
                  [row.entry.mode === "buyback" ? `Recover for ${row.entry.price} silver` : `Price ${row.entry.price} silver`],
                  state.progression
                )
              : { title: row.entry.title, lines: [row.entry.description, formatActionCost(row.entry)], accent: row.entry.affordable ? "#a6e28c" : "#c67d72" };
          return {
            action: "service-select",
            index: row.index,
            entry: row.entry,
            rect: row.rect,
            tooltip,
          };
        }
      }
      return null;
    }

    for (const row of panel.packRows) {
      if (pointInRect(mouseX, mouseY, row.rect)) {
        return {
          action: state.ui.serviceSubpanel === "pack" && state.ui.selectedServiceIndex === row.index ? "service-activate" : "service-select",
          subpanel: "pack",
          index: row.index,
          entry: row.entry,
          rect: row.rect,
          tooltip: buildItemTooltip(row.entry, ["Store one item in the stash."], state.progression),
        };
      }
    }

    for (const row of panel.stashRows) {
      if (pointInRect(mouseX, mouseY, row.rect)) {
        return {
          action: state.ui.serviceSubpanel === "stash" && state.ui.selectedStashIndex === row.index ? "service-activate" : "service-select",
          subpanel: "stash",
          index: row.index,
          entry: row.entry,
          rect: row.rect,
          tooltip: buildItemTooltip(row.entry, ["Withdraw one item from the stash."], state.progression),
        };
      }
    }
    return null;
  }

  return null;
}

function getQuestLogHoverTarget(state, mouseX, mouseY) {
  const panel = getQuestLogPanelData(state);
  for (const row of panel.rows) {
    if (pointInRect(mouseX, mouseY, row.rect)) {
      return {
        action: "quest-select",
        index: row.index,
        rect: row.rect,
        tooltip: {
          title: row.quest.title,
          lines: [row.quest.description, ...row.quest.objectives.map((objective) => `${objective.label}: ${Math.min(objective.current, objective.required)}/${objective.required}`)],
          accent: "#d7bb71",
        },
      };
    }
  }
  return null;
}

function getHudHoverOnlyTarget(state, mouseX, mouseY) {
  const hud = getBottomHudInteractionData(state);
  for (const slot of hud.abilitySlots) {
    if (pointInRect(mouseX, mouseY, slot.rect)) {
      const locked = slot.info.unlocked === false;
      return {
        rect: slot.rect,
        tooltip: {
          title: slot.info.label,
          lines: locked
            ? ["Unlock this magic in the Talents tab.", "Spirit tree"]
            : [
                slot.info.cost > 0 ? `Cost ${slot.info.cost} Spirit` : "No Spirit cost",
                `Cooldown ${slot.info.cooldown.toFixed(2)}s`,
              ],
          accent: slot.color,
        },
      };
    }
  }

  for (const slot of hud.actionSlots) {
    if (pointInRect(mouseX, mouseY, slot.rect)) {
      if (!slot.item) return { rect: slot.rect, tooltip: { title: `Slot ${slot.key}`, lines: ["No item assigned."], accent: "#6d7884" } };
      return {
        action: "hud-action-slot",
        slotIndex: slot.index,
        rect: slot.rect,
        tooltip: buildItemTooltip(slot.item, [`Quick Slot ${slot.key}`, `Owned ${slot.count}`], state.progression),
      };
    }
  }

  for (const chip of hud.quickItems) {
    if (pointInRect(mouseX, mouseY, chip.rect)) {
      return {
        action: "hud-quick-item",
        itemId: chip.itemId,
        rect: chip.rect,
        tooltip: {
          title: chip.label,
          lines: [`Quick use with ${chip.key}.`, `Owned ${chip.count}`],
          accent: chip.color,
        },
      };
    }
  }

  return null;
}

function getBottomHudInteractionData(state) {
  const { width, height } = state.viewport;
  const panelW = 760;
  const panelH = 132;
  const x = width / 2 - panelW / 2;
  const y = height - panelH - 16;
  const abilities = getHudAbilitySpecs();
  const abilityRowWidth = abilities.length * 76 + (abilities.length - 1) * 10;
  const abilityStartX = x + panelW / 2 - abilityRowWidth / 2;
  const actionStartX = x + panelW / 2 - 147;
  const actionSlots = getActionSlotEntries(state.progression);
  return {
    abilitySlots: abilities.map(([name, color], index) => ({
      name,
      color,
      info: state.player.abilityInfo[name],
      rect: rect(abilityStartX + index * 86, y + 18, 76, 54),
    })),
    actionSlots: actionSlots.map((slot, index) => ({
      ...slot,
      rect: rect(actionStartX + index * 102, y + 82, 90, 34),
    })),
    quickItems: [
      {
        key: "5",
        label: "Health Potion",
        count: state.progression.inventory.health_potion || 0,
        itemId: "health_potion",
        color: "#df6a67",
        rect: rect(x + 18, y + 98, 92, 22),
      },
      {
        key: "6",
        label: "Spirit Tonic",
        count: state.progression.inventory.spirit_tonic || 0,
        itemId: "spirit_tonic",
        color: "#6ecff7",
        rect: rect(x + panelW - 110, y + 98, 92, 22),
      },
    ],
  };
}

function drawHoverTooltip(ctx, state) {
  const target = state.ui.hoverTarget;
  if (!target?.tooltip || state.story.dialogue || state.transition.active) {
    return;
  }

  const { title, lines, accent } = target.tooltip;
  ctx.save();
  ctx.font = "12px Segoe UI, Arial";
  const maxTextWidth = 240;
  const wrappedLines = lines.flatMap((line) => toWrappedLines(ctx, line, maxTextWidth));
  const allLines = [title, ...wrappedLines];
  const maxWidth = Math.max(...allLines.map((line) => ctx.measureText(line).width), 120);
  const boxW = Math.min(320, Math.ceil(maxWidth) + 24);
  const boxH = 20 + wrappedLines.length * 16 + 22;
  const cursorX = Math.min(state.viewport.width - boxW - 16, state.ui.hoverTarget.rect ? state.ui.hoverTarget.rect.x + state.ui.hoverTarget.rect.width + 12 : 20);
  const cursorY = Math.min(state.viewport.height - boxH - 16, state.ui.hoverTarget.rect ? state.ui.hoverTarget.rect.y + 8 : 20);

  ctx.fillStyle = "rgba(0,0,0,0.88)";
  ctx.fillRect(cursorX, cursorY, boxW, boxH);
  ctx.fillStyle = "#10161d";
  ctx.fillRect(cursorX + 3, cursorY + 3, boxW - 6, boxH - 6);
  drawPanelChrome(ctx, cursorX, cursorY, boxW, boxH, accent || "#8aa7b4");
  ctx.fillStyle = accent || "#fff2d5";
  ctx.font = "700 12px Segoe UI, Arial";
  ctx.fillText(title, cursorX + 12, cursorY + 18);
  ctx.fillStyle = "#d7e4cf";
  ctx.font = "11px Segoe UI, Arial";
  wrappedLines.forEach((line, index) => {
    ctx.fillText(line, cursorX + 12, cursorY + 38 + index * 16);
  });
  ctx.restore();
}

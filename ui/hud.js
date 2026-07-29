import {
  ITEM_DEFS,
  TALENT_BRANCHES,
  TALENT_DEFS,
} from "../data/gameData.js";
import { SCENES, WORLD_MAP_LAYOUT } from "../data/sceneNetwork.js";
import {
  getCurrency,
  getActionSlotEntries,
  getEquippedItems,
  getInventoryEntries,
  getItemAspectAffinity,
  getItemAttunementLevel,
  getLootIntentLabel,
  getItemValue,
  getLoadoutEntries,
  getPlayerBonuses,
  getQuestCounter,
  getStashEntries,
  getTalentUnlockState,
  getXpProgress,
} from "../systems/progression.js";
import { DAMAGE_TYPES } from "../data/regionData.js";
import { getRegionStatus } from "../systems/regions.js";
import { getAylaPortrait } from "../rendering/atlasAssets.js";
import {
  drawHudAbilityIcon,
  drawHudItemIcon,
  getHudAbilityIconId,
} from "../rendering/hudIconAssets.js";
import { drawTalentIcon } from "../rendering/talentIconAssets.js";
import { getActiveService, getServiceEntries, getStashUiEntries } from "../systems/services.js";
import { NPC_DEFS } from "../data/storyData.js";
import { getClockView } from "../systems/clock.js";
import {
  drawForestButton,
  drawForestCloseButton,
  drawForestFrame,
  drawForestPanel,
  drawForestSubpanel,
} from "./forestChrome.js";
import { getQuestPanelHoverTarget, renderQuestPanel } from "./questPanel.js";
import { getTrainingView } from "../systems/training.js";

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

const COMPARISON_VISIBLE_LINES = 5;
const PERCENT_BONUS_KEYS = new Set([
  "incomingDamageReductionBonus",
  "preparationReductionBonus",
  "closeDamageReduction",
  "bossSpellDamageBonus",
]);
const SECONDS_BONUS_KEYS = new Set([
  "rootDurationBonus",
]);
const COOLDOWN_CUT_BONUS_KEYS = new Set([
  "dashCooldownBonus",
  "pulseCooldownBonus",
]);
const RANGE_BONUS_KEYS = new Set([
  "boltRangeBonus",
  "staffRangeBonus",
  "pulseRadiusBonus",
]);

function getHudAbilitySpecs() {
  return [
    ["staff", "#f2d07a"],
    ["bolt", "#74ddff"],
    ["dash", "#b7f0dd"],
    ["root", "#8ce36d"],
    ["pulse", "#b9f48a"],
  ];
}

export function getHudAbilityReadiness(player, abilityName, info = {}) {
  const cooldown = Math.max(0, player?.cooldowns?.[abilityName] || 0);
  const cost = Math.max(0, Math.floor(info.cost || 0));
  const spirit = Math.max(0, Math.floor(player?.spirit || 0));
  const heartCharge = Math.max(0, Math.min(100, player?.heartCharge || 0));
  const signature = abilityName === "pulse" && info.signatureAbility;

  if (info.unlocked === false) {
    return {
      state: "locked",
      label: "Locked",
      shortLabel: "LOCK",
      tone: "#7d8791",
      detail: "Unlock this magic in the Talents tab.",
      cooldown,
      cost,
      spirit,
      heartCharge,
      progress: 0,
    };
  }

  if (cooldown > 0) {
    const cooldownMax = Math.max(cooldown, info.cooldown || cooldown);
    return {
      state: "cooldown",
      label: "Recharging",
      shortLabel: `${cooldown.toFixed(1)}s`,
      tone: "#89a9bd",
      detail: `Ready in ${cooldown.toFixed(1)}s.`,
      cooldown,
      cost,
      spirit,
      heartCharge,
      progress: 1 - Math.min(1, cooldown / cooldownMax),
    };
  }

  if (signature && heartCharge < 100) {
    return {
      state: "charging",
      label: "Charging",
      shortLabel: `${Math.round(heartCharge)}%`,
      tone: "#b8c8ba",
      detail: `Heart Charge ${Math.round(heartCharge)} / 100. Build it through combat.`,
      cooldown,
      cost,
      spirit,
      heartCharge,
      progress: heartCharge / 100,
    };
  }

  if (cost > 0 && spirit < cost) {
    const missingSpirit = cost - spirit;
    return {
      state: "spirit",
      label: "Need Spirit",
      shortLabel: "NO SP",
      tone: "#d87979",
      detail: `Need ${missingSpirit} more Spirit.`,
      cooldown,
      cost,
      spirit,
      heartCharge,
      progress: spirit / cost,
    };
  }

  return {
    state: "ready",
    label: signature ? "Ultimate Ready" : "Ready",
    shortLabel: signature ? "ULT" : "READY",
    tone: signature ? "#fff0a0" : "#9ce1a3",
    detail: "Ready to use.",
    cooldown,
    cost,
    spirit,
    heartCharge,
    progress: 1,
  };
}

export function drawHud(ctx, state, abilityInfo) {
  const majorOverlayOpen = Boolean(
    state.story.questPanel || state.ui.questLogOpen || state.ui.menuOpen || state.ui.worldMapOpen
  );

  if (!majorOverlayOpen) {
    drawCombatVignette(ctx, state);
    drawSceneInfo(ctx, state);
    drawBossBar(ctx, state);
    drawQuestTracker(ctx, state);
    drawTrainingPanel(ctx, state);
    drawBottomHud(ctx, state, abilityInfo);
  }
  drawBanner(ctx, state);
  if (!majorOverlayOpen) {
    drawInteractionPrompt(ctx, state);
    drawExitPrompt(ctx, state);
  }
  drawToast(ctx, state);
  if (state.story.questPanel) renderQuestPanel(ctx, state);
  if (state.ui.questLogOpen) drawQuestLogOverlay(ctx, state);
  if (state.ui.menuOpen) drawCharacterOverlay(ctx, state);
  if (state.ui.worldMapOpen) drawWorldMapOverlay(ctx, state);
  drawHoverTooltip(ctx, state);
  drawDialogue(ctx, state);
  drawTransitionOverlay(ctx, state);
  drawEndState(ctx, state);
}

export function getUiHoverTarget(state, mouseX, mouseY) {
  if (state.story.dialogue) {
    return getActiveOverlayCloseHoverTarget(state, mouseX, mouseY);
  }

  if (state.story.questPanel) {
    return getQuestPanelHoverTarget(state, mouseX, mouseY);
  }

  if (state.ui.worldMapOpen) {
    return getActiveOverlayCloseHoverTarget(state, mouseX, mouseY);
  }

  if (state.ui.menuOpen) {
    const closeTarget = getActiveOverlayCloseHoverTarget(state, mouseX, mouseY);
    if (closeTarget) return closeTarget;
    return getMenuHoverTarget(state, mouseX, mouseY);
  }

  if (state.ui.questLogOpen) {
    const closeTarget = getActiveOverlayCloseHoverTarget(state, mouseX, mouseY);
    if (closeTarget) return closeTarget;
    return getQuestLogHoverTarget(state, mouseX, mouseY);
  }

  return getHudHoverOnlyTarget(state, mouseX, mouseY);
}

function drawBottomHud(ctx, state, abilityInfo) {
  const layout = getBottomHudLayout(state);
  const { panelRect, leftOrb, rightOrb, abilityStartX, abilityY, abilitySlotSize, abilityGap } = layout;
  const { x, y, width: panelW, height: panelH } = panelRect;
  const xp = getXpProgress(state.progression);
  const healthPotions = state.progression.inventory.health_potion || 0;
  const spiritTonics = state.progression.inventory.spirit_tonic || 0;

  drawHudBackdrop(ctx, x, y, panelW, panelH, "#9aca78", 0.9);
  drawHudCenterRail(ctx, x + 118, y + 9, panelW - 236, panelH - 24, state.time);

  drawXpBar(ctx, x + 116, y + panelH - 9, panelW - 232, xp.ratio, `LEVEL ${xp.level}`);
  drawOrb(
    ctx,
    leftOrb.x,
    leftOrb.y,
    leftOrb.radius,
    state.player.hp / state.player.maxHp,
    "#641b24",
    "#e65355",
    "HEALTH",
    Math.round(state.player.hp),
    Math.round(state.player.maxHp)
  );
  drawOrb(
    ctx,
    rightOrb.x,
    rightOrb.y,
    rightOrb.radius,
    state.player.spirit / state.player.maxSpirit,
    "#123653",
    "#46bfe5",
    "SPIRIT",
    Math.round(state.player.spirit),
    Math.round(state.player.maxSpirit)
  );

  drawAbilitySlots(
    ctx,
    abilityStartX,
    abilityY,
    state.player,
    abilityInfo,
    abilitySlotSize,
    abilityGap
  );
  drawActionSlots(ctx, layout.actionStartX, layout.actionY, state.progression);
  drawQuickCounters(ctx, x + 10, layout.statusY, healthPotions, spiritTonics, panelW);
  drawBuffChips(ctx, layout.buffX, layout.statusY, state.player, state.progression);
  drawCurrencyChip(ctx, layout.currencyX, layout.statusY, state.progression);
}

function getBottomHudLayout(state) {
  const { width, height } = state.viewport;
  const panelW = Math.min(690, Math.max(460, width - 32), width - 16);
  const panelH = width < 760 ? 124 : 132;
  const x = Math.round(width / 2 - panelW / 2);
  const y = height - panelH - 10;
  const compact = panelW < 650;
  const orbRadius = compact ? 30 : 34;
  const abilitySlotSize = compact ? 48 : 54;
  const abilityGap = compact ? 5 : 7;
  const abilityRowWidth =
    getHudAbilitySpecs().length * abilitySlotSize +
    (getHudAbilitySpecs().length - 1) * abilityGap;
  const abilityStartX = Math.round(x + panelW / 2 - abilityRowWidth / 2);
  return {
    panelRect: rect(x, y, panelW, panelH),
    compact,
    leftOrb: { x: x + 54, y: y + 52, radius: orbRadius },
    rightOrb: { x: x + panelW - 54, y: y + 52, radius: orbRadius },
    abilityStartX,
    abilityY: y + 13,
    abilitySlotSize,
    abilityGap,
    actionStartX: Math.round(x + panelW / 2 - 127),
    actionY: y + (compact ? 67 : 72),
    statusY: y + panelH - 29,
    buffX: x + 94,
    currencyX: x + panelW - 228,
  };
}

function drawCombatVignette(ctx, state) {
  if (state.gameOver || !state.player?.maxHp) return;

  const healthRatio = state.player.hp / state.player.maxHp;
  if (healthRatio > 0.32 && state.player.hurtFlash <= 0) return;

  const { width, height } = state.viewport;
  const danger = Math.max(
    state.player.hurtFlash > 0 ? 0.34 : 0,
    (0.32 - Math.max(0, healthRatio)) / 0.32
  );
  const alpha = Math.min(0.34, 0.1 + danger * 0.24);
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.18,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.72
  );

  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(0.72, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, `rgba(158, 38, 39, ${alpha})`);
  ctx.save();
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawHudBackdrop(ctx, x, y, width, height, accent, alpha = 0.88) {
  drawForestPanel(ctx, x, y, width, height, {
    accent,
    alpha,
    inner: "#101914",
  });
}

function drawOrb(ctx, cx, cy, radius, ratio, dark, light, label, value, maximum) {
  const clamped = Math.max(0, Math.min(1, ratio));
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.44)";
  ctx.beginPath();
  ctx.arc(cx + 2, cy + 3, radius + 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#07100d";
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(114, 143, 91, 0.68)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(237, 211, 132, 0.56)";
  ctx.lineWidth = 1;
  for (let index = 0; index < 8; index += 1) {
    const angle = (Math.PI * 2 * index) / 8;
    const inner = radius + 6;
    const outer = radius + 10;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    ctx.stroke();
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const baseGradient = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.35, 2, cx, cy, radius);
  baseGradient.addColorStop(0, "rgba(255, 255, 255, 0.08)");
  baseGradient.addColorStop(0.48, dark);
  baseGradient.addColorStop(1, "#050806");
  ctx.fillStyle = baseGradient;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  const fillGradient = ctx.createLinearGradient(cx, cy + radius, cx, cy - radius);
  fillGradient.addColorStop(0, dark);
  fillGradient.addColorStop(0.62, light);
  fillGradient.addColorStop(1, "#fff2bd");
  ctx.fillStyle = fillGradient;
  const fillHeight = Math.round(radius * 2 * clamped);
  ctx.fillRect(cx - radius, cy + radius - fillHeight, radius * 2, fillHeight);
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1;
  const waveY = cy + radius - fillHeight + 3;
  ctx.beginPath();
  for (let offset = -radius; offset <= radius; offset += 6) {
    const nextX = cx + offset;
    const nextY = waveY + Math.sin(offset * 0.45) * 1.5;
    if (offset === -radius) ctx.moveTo(nextX, nextY);
    else ctx.lineTo(nextX, nextY);
  }
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.ellipse(cx - radius * 0.24, cy - radius * 0.34, radius * 0.44, radius * 0.24, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.fillStyle = "#fff4dc";
  ctx.font = `700 ${radius < 35 ? 12 : 14}px Segoe UI, Arial`;
  ctx.fillText(`${value}`, cx, cy + 3);
  ctx.fillStyle = "rgba(238, 246, 231, 0.82)";
  ctx.font = "700 8px Segoe UI, Arial";
  ctx.fillText(`/ ${maximum}`, cx, cy + 14);
  ctx.fillStyle = "#c8d6c4";
  ctx.font = "700 8px Segoe UI, Arial";
  ctx.fillText(label, cx, cy + radius + 17);
  ctx.textAlign = "left";
  ctx.restore();
}

function drawHudCenterRail(ctx, x, y, width, height, time = 0) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.fillRect(x + 2, y + 3, width, height);
  ctx.fillStyle = "rgba(10, 18, 15, 0.72)";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "rgba(33, 51, 37, 0.52)";
  ctx.fillRect(x + 4, y + 4, width - 8, 31);
  ctx.fillStyle = "rgba(102, 139, 78, 0.16)";
  ctx.fillRect(x + 8, y + 36, width - 16, 24);
  ctx.fillStyle = "rgba(255, 239, 178, 0.08)";
  ctx.fillRect(x + 12, y + 7, width - 24, 1);
  ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
  ctx.fillRect(x + 12, y + height - 8, width - 24, 2);
  const sparkleAlpha = 0.08 + Math.sin(time * 2.2) * 0.02;
  ctx.fillStyle = `rgba(185, 244, 138, ${sparkleAlpha})`;
  for (let index = 0; index < 7; index += 1) {
    const px = x + 18 + index * Math.max(18, Math.floor((width - 36) / 6));
    const py = y + 11 + (index % 3) * 11;
    ctx.fillRect(px, py, 2, 2);
  }
  ctx.strokeStyle = "rgba(154, 202, 120, 0.32)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
  ctx.restore();
}

function drawHudSkillSlotFrame(ctx, x, y, width, height, accent, state = {}) {
  ctx.save();
  const ready = Boolean(state.ready);
  const locked = Boolean(state.locked);
  const needsSpirit = Boolean(state.spirit);
  const baseAccent = ready ? "#fff0a0" : accent;
  ctx.fillStyle = ready ? "rgba(79, 75, 28, 0.9)" : "rgba(0, 0, 0, 0.62)";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = locked ? "#0b1013" : needsSpirit ? "#211616" : "#101a16";
  ctx.fillRect(x + 3, y + 3, width - 6, height - 6);
  ctx.fillStyle = ready ? "rgba(255, 240, 160, 0.18)" : "rgba(255, 255, 255, 0.04)";
  ctx.fillRect(x + 5, y + 5, width - 10, 12);
  ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
  ctx.fillRect(x + 5, y + height - 15, width - 10, 10);
  ctx.strokeStyle = baseAccent;
  ctx.lineWidth = ready ? 3 : 2;
  ctx.strokeRect(x + 3, y + 3, width - 6, height - 6);
  ctx.strokeStyle = "rgba(236, 216, 142, 0.22)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 6.5, y + 6.5, width - 13, height - 13);
  pixelRect(ctx, x + 6, y + 6, 8, 1, baseAccent);
  pixelRect(ctx, x + 6, y + 6, 1, 8, baseAccent);
  pixelRect(ctx, x + width - 14, y + 6, 8, 1, baseAccent);
  pixelRect(ctx, x + width - 7, y + 6, 1, 8, baseAccent);
  if (state.signature) {
    ctx.fillStyle = ready ? "rgba(255, 240, 160, 0.14)" : "rgba(185, 244, 138, 0.08)";
    ctx.fillRect(x + 9, y + 9, width - 18, height - 18);
  }
  ctx.restore();
}

function drawHudSmallSlotFrame(ctx, x, y, width, height, accent, filled) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.48)";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = filled ? "#101914" : "#0d1310";
  ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
  ctx.fillStyle = filled ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.025)";
  ctx.fillRect(x + 4, y + 4, width - 8, 5);
  ctx.strokeStyle = accent;
  ctx.lineWidth = filled ? 2 : 1;
  ctx.strokeRect(x + 2, y + 2, width - 4, height - 4);
  ctx.strokeStyle = "rgba(236, 216, 142, 0.18)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 5.5, y + 5.5, width - 11, height - 11);
  ctx.restore();
}

function drawHudKeyBadge(ctx, x, y, width, height, accent, enabled = true) {
  ctx.fillStyle = enabled ? "rgba(4, 9, 8, 0.82)" : "rgba(5, 9, 13, 0.58)";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = enabled ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.02)";
  ctx.fillRect(x + 1, y + 1, width - 2, 3);
  ctx.strokeStyle = enabled ? "rgba(236, 216, 142, 0.46)" : "rgba(122, 137, 141, 0.34)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
  pixelRect(ctx, x + 1, y + height - 2, width - 2, 1, enabled ? accent : "rgba(122, 137, 141, 0.34)");
}

function drawHudChipFrame(ctx, x, y, width, height, accent) {
  ctx.fillStyle = "rgba(0,0,0,0.46)";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#101812";
  ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(x + 4, y + 4, width - 8, 3);
  ctx.strokeStyle = "rgba(111, 145, 86, 0.48)";
  ctx.strokeRect(x + 1.5, y + 1.5, width - 3, height - 3);
  pixelRect(ctx, x + 3, y + height - 3, width - 6, 1, accent);
}

function drawHudLeafCorner(ctx, x, y, accent, direction = 1) {
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

function drawAbilitySlots(ctx, startX, y, player, abilityInfo, slotSize = 58, gap = 8) {
  const abilities = getHudAbilitySpecs();
  const slotW = slotSize;
  const slotH = slotSize;

  for (let i = 0; i < abilities.length; i += 1) {
    const [name, color] = abilities[i];
    const info = abilityInfo[name];
    const x = startX + i * (slotW + gap);
    const cooldown = Math.max(0, player.cooldowns[name] || 0);
    const ratio = info.cooldown > 0 ? Math.min(1, cooldown / info.cooldown) : 0;
    const unlocked = info.unlocked !== false;
    const readiness = getHudAbilityReadiness(player, name, info);

    const isSignature = name === "pulse" && info.signatureAbility;
    const heartCharge = Math.max(0, Math.min(100, player.heartCharge || 0));
    const ready = isSignature && readiness.state === "ready";

    drawHudSkillSlotFrame(ctx, x, y, slotW, slotH, color, {
      ready,
      locked: !unlocked,
      spirit: readiness.state === "spirit",
      signature: isSignature,
    });

    const innerX = x + 3;
    const innerY = y + 3;
    const innerW = slotW - 6;
    const innerH = slotH - 6;

    if (!unlocked) {
      ctx.fillStyle = "rgba(9, 12, 18, 0.72)";
      ctx.fillRect(innerX, innerY, innerW, innerH);
    } else if (readiness.state === "spirit") {
      ctx.fillStyle = "rgba(68, 34, 40, 0.52)";
      ctx.fillRect(innerX, innerY, innerW, innerH);
    }

    drawHudAbilityIcon(
      ctx,
      getHudAbilityIconId(name, info),
      x + slotW / 2,
      y + slotH / 2 - 3,
      Math.max(30, slotSize * 0.66),
      { disabled: !unlocked, charged: ready }
    );

    drawAbilityReadinessStrip(ctx, x, y, slotW, slotH, readiness);
    if (readiness.state === "spirit" || readiness.state === "locked") {
      drawAbilityStatusBadge(ctx, x, y, slotW, slotH, readiness, slotSize);
    }
    ctx.textAlign = "left";

    drawHudKeyBadge(ctx, x + 5, y + 5, 20, 14, color, unlocked);
    ctx.fillStyle = unlocked ? "#f7fff1" : "#88939f";
    ctx.font = `700 ${slotSize < 54 ? 9 : 10}px Segoe UI, Arial`;
    ctx.fillText(info.key, x + 9, y + 15);
    if (info.cost > 0 && unlocked) {
      ctx.textAlign = "right";
      ctx.fillStyle = player.spirit >= info.cost ? "#74ddff" : "#d87979";
      ctx.fillText(String(info.cost), x + slotW - 6, y + 15);
      ctx.textAlign = "left";
    }
    ctx.textAlign = "center";
    ctx.fillStyle = unlocked ? "#d7e4cf" : "#8f99a3";
    ctx.font = `700 ${slotSize < 54 ? 8 : 9}px Segoe UI, Arial`;
    ctx.fillText(unlocked ? info.shortLabel || info.label : "Locked", x + slotW / 2, y + slotH - 6);

    if (ratio > 0 && unlocked) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(innerX, innerY, innerW, innerH);
      ctx.clip();
      ctx.fillStyle = "rgba(2, 5, 8, 0.76)";
      ctx.beginPath();
      ctx.moveTo(x + slotW / 2, y + slotH / 2);
      ctx.arc(
        x + slotW / 2,
        y + slotH / 2,
        slotW,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * ratio
      );
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      const cooldownText = cooldown >= 1 ? cooldown.toFixed(1) : cooldown.toFixed(1);
      ctx.fillStyle = "#fff4dc";
      ctx.font = `700 ${slotSize < 54 ? 15 : 18}px Segoe UI, Arial`;
      ctx.fillText(cooldownText, x + slotW / 2, y + slotH / 2 + 5);
    }

    if (isSignature) {
      ctx.strokeStyle = ready ? "#fff09a" : color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(
        x + slotW / 2,
        y + slotH / 2,
        slotW / 2 + 4,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * heartCharge / 100
      );
      ctx.stroke();
      ctx.fillStyle = ready ? "#fff0a0" : "#b8c8ba";
      ctx.font = "700 8px Segoe UI, Arial";
      ctx.fillText(ready ? "READY" : `${Math.round(heartCharge)}%`, x + slotW / 2, y - 5);
    }
    ctx.textAlign = "left";
  }
}

function drawAbilityReadinessStrip(ctx, x, y, slotW, slotH, readiness) {
  const stripX = x + 7;
  const stripY = y + slotH - 17;
  const stripW = slotW - 14;
  const progress = Math.max(0, Math.min(1, readiness.progress ?? 0));

  ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
  ctx.fillRect(stripX, stripY, stripW, 3);
  if (readiness.state !== "locked") {
    ctx.fillStyle = readiness.state === "spirit" ? "rgba(116, 221, 255, 0.72)" : readiness.tone;
    ctx.fillRect(stripX, stripY, Math.max(2, Math.round(stripW * progress)), 3);
  }
}

function drawAbilityStatusBadge(ctx, x, y, slotW, slotH, readiness, slotSize) {
  const badgeW = slotSize < 54 ? 32 : 36;
  const badgeH = 13;
  const badgeX = Math.round(x + slotW / 2 - badgeW / 2);
  const badgeY = Math.round(y + slotH / 2 - 4);

  ctx.fillStyle = "rgba(3, 5, 7, 0.84)";
  ctx.fillRect(badgeX - 2, badgeY - 2, badgeW + 4, badgeH + 4);
  ctx.fillStyle = readiness.state === "spirit" ? "rgba(47, 21, 25, 0.96)" : "rgba(20, 24, 29, 0.96)";
  ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
  ctx.strokeStyle = readiness.tone;
  ctx.lineWidth = 1;
  ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);
  ctx.fillStyle = readiness.tone;
  ctx.font = `800 ${slotSize < 54 ? 8 : 9}px Segoe UI, Arial`;
  ctx.textAlign = "center";
  ctx.fillText(readiness.shortLabel, badgeX + badgeW / 2, badgeY + 10);
}

function drawActionSlots(ctx, x, y, progression) {
  const slots = getActionSlotEntries(progression);
  const slotW = 78;
  const slotH = 28;
  const gap = 10;

  for (let index = 0; index < slots.length; index += 1) {
    const slot = slots[index];
    const slotX = x + index * (slotW + gap);
    const border = slot.item?.color || "#526252";

    drawHudSmallSlotFrame(ctx, slotX, y, slotW, slotH, border, Boolean(slot.item));

    if (slot.item) {
      drawHudItemIcon(ctx, slot.itemId, slotX + 16, y + 14, 22, {
        disabled: slot.count <= 0,
        color: slot.item.color,
      });
      drawHudKeyBadge(ctx, slotX + 3, y + 3, 15, 11, border, slot.count > 0);
      ctx.fillStyle = "#f6ead0";
      ctx.font = "700 9px Segoe UI, Arial";
      ctx.fillText(slot.key, slotX + 7, y + 12);
      ctx.fillStyle = slot.count > 0 ? "#eef6dd" : "#9098a5";
      ctx.font = "10px Segoe UI, Arial";
      ctx.fillText(shorten(slot.item.name, 8), slotX + 31, y + 13);
      ctx.textAlign = "right";
      ctx.fillStyle = slot.count > 0 ? "#fff4d8" : "#9aa4b1";
      ctx.fillText(`x${slot.count}`, slotX + slotW - 6, y + 22);
      ctx.textAlign = "left";
      if (slot.count <= 0) {
        ctx.fillStyle = "rgba(0,0,0,0.42)";
        ctx.fillRect(slotX + 2, y + 2, slotW - 4, slotH - 4);
      }
      continue;
    }

    ctx.fillStyle = "#f6ead0";
    ctx.font = "700 11px Segoe UI, Arial";
    ctx.fillText(slot.key, slotX + 10, y + 12);
    ctx.fillStyle = "#aab6c3";
    ctx.font = "10px Segoe UI, Arial";
    ctx.fillText("Empty", slotX + 10, y + 23);
  }
}

function drawQuickCounters(ctx, x, y, healthPotions, spiritTonics, panelW) {
  const chips = [
    { key: "5", label: "HP", count: healthPotions, color: "#df6a67", itemId: "health_potion", x },
    { key: "6", label: "SP", count: spiritTonics, color: "#6ecff7", itemId: "spirit_tonic", x: x + panelW - 86 },
  ];

  for (const chip of chips) {
    drawHudChipFrame(ctx, chip.x, y, 74, 18, chip.color);
    drawHudItemIcon(ctx, chip.itemId, chip.x + 11, y + 9, 14, {
      disabled: chip.count <= 0,
      color: chip.color,
    });
    ctx.fillStyle = "#f6ead0";
    ctx.font = "700 11px Segoe UI, Arial";
    ctx.fillText(chip.key, chip.x + 22, y + 10);
    ctx.fillStyle = "#dce6d6";
    ctx.font = "10px Segoe UI, Arial";
    ctx.fillText(`${chip.label} x${chip.count}`, chip.x + 37, y + 12);
  }
}

function drawBuffChips(ctx, x, y, player, progression) {
  const chips = [];
  if (player.activeBuffs?.ward > 0) {
    chips.push({ label: `Ward ${player.activeBuffs.ward.toFixed(0)}s`, color: "#d8d57b" });
  }
  if (player.activeBuffs?.speed > 0) {
    chips.push({ label: `Windstep ${player.activeBuffs.speed.toFixed(0)}s`, color: "#8be4c3" });
  }
  if (progression.activePreparation) {
    const preparation = progression.activePreparation;
    const fallbackName = ITEM_DEFS[preparation.itemId]?.name || `${preparation.damageType || "Regional"} ward`;
    const reduction = Math.round(
      (preparation.damageReduction ?? preparation.reduction ?? 0.25) * 100
    );
    chips.push({
      label: `${preparation.label || fallbackName} ${reduction}%`,
      color: DAMAGE_TYPES[preparation.damageType]?.color || "#a8d77b",
      shield: true,
    });
  }
  if (chips.length === 0) return;

  let cursorX = x;
  for (const chip of chips) {
    const width = Math.max(74, Math.ceil(ctx.measureText(chip.label).width) + 18);
    ctx.fillStyle = "rgba(0,0,0,0.44)";
    ctx.fillRect(cursorX, y, width, 18);
    ctx.fillStyle = "#10161d";
    ctx.fillRect(cursorX + 2, y + 2, width - 4, 14);
    ctx.fillStyle = chip.color;
    if (chip.shield) {
      ctx.beginPath();
      ctx.moveTo(cursorX + 9, y + 4);
      ctx.lineTo(cursorX + 14, y + 6);
      ctx.lineTo(cursorX + 13, y + 12);
      ctx.lineTo(cursorX + 9, y + 15);
      ctx.lineTo(cursorX + 5, y + 12);
      ctx.lineTo(cursorX + 4, y + 6);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(cursorX + 5, y + 5, 7, 8);
    }
    ctx.fillStyle = "#eef7df";
    ctx.font = "10px Segoe UI, Arial";
    ctx.fillText(chip.label, cursorX + 16, y + 12);
    cursorX += width + 8;
  }
}

function drawCurrencyChip(ctx, x, y, progression) {
  const silver = getCurrency(progression);
  drawHudChipFrame(ctx, x, y, 142, 18, "#e4c776");
  ctx.fillStyle = "#e4c776";
  ctx.beginPath();
  ctx.arc(x + 10, y + 9, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.fillRect(x + 8, y + 6, 4, 1);
  ctx.fillStyle = "#f6ead0";
  ctx.font = "700 11px Segoe UI, Arial";
  ctx.fillText("Silver", x + 20, y + 10);
  ctx.textAlign = "right";
  ctx.fillStyle = "#fff6dc";
  ctx.fillText(String(silver), x + 134, y + 10);
  ctx.textAlign = "left";
}

function drawXpBar(ctx, x, y, width, ratio, label) {
  const clamped = Math.max(0, Math.min(1, ratio));
  ctx.fillStyle = "rgba(0, 0, 0, 0.64)";
  ctx.fillRect(x - 2, y - 2, width + 4, 10);
  ctx.fillStyle = "#0b120f";
  ctx.fillRect(x, y, width, 6);
  const gradient = ctx.createLinearGradient(x, y, x + width, y);
  gradient.addColorStop(0, "#5c3a78");
  gradient.addColorStop(0.52, "#8b5fc0");
  gradient.addColorStop(1, "#c8a7f3");
  ctx.fillStyle = gradient;
  ctx.fillRect(x + 1, y + 1, (width - 2) * clamped, 4);
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillRect(x + 1, y + 1, Math.max(0, (width - 2) * clamped * 0.4), 1);
  if (label) {
    ctx.fillStyle = "#eadcff";
    ctx.font = "10px Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.fillText(label, x + width / 2, y - 5);
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
  const clock = getClockView(state.clock);
  const width = state.viewport.width < 780 ? 244 : 276;
  const height = 70;
  const x = state.viewport.width - width - 18;
  const y = 18;
  const cleared = Boolean(state.sceneProgress?.[state.currentSceneId]?.cleared);
  const regionStatus = getRegionStatus(
    state.progression,
    state.sceneProgress,
    state.currentSceneId
  );
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
    phaseLabel = state.scene.peacefulLabel || "Village Calm";
  } else if (!cleared && encounter.totalWaves > 0) {
    const displayedWave =
      encounter.phase === "waveIntro"
        ? 1
        : encounter.phase === "intermission"
          ? Math.min(encounter.totalWaves, encounter.waveIndex + 2)
          : Math.min(encounter.totalWaves, encounter.waveIndex + 1);
    phaseLabel = `Wave ${displayedWave}/${encounter.totalWaves}  |  Threats ${aliveThreats}`;
  }

  drawHudBackdrop(ctx, x, y, width, height, regionStatus.color, 0.72);
  ctx.fillStyle = regionStatus.color;
  ctx.fillRect(x + 8, y + 8, 4, height - 16);
  ctx.fillStyle = "#f6fff1";
  ctx.font = "700 14px Segoe UI, Arial";
  ctx.fillText(shorten(state.scene.title, width < 260 ? 22 : 27), x + 18, y + 22);
  ctx.font = "11px Segoe UI, Arial";
  ctx.fillStyle = "#c9ddbe";
  ctx.fillText(`${state.scene.regionName}  |  ${regionStatus.label}`, x + 18, y + 39);
  ctx.fillStyle = "#fff5cf";
  ctx.font = "700 11px Segoe UI, Arial";
  ctx.fillText(shorten(phaseLabel, width < 260 ? 28 : 34), x + 18, y + 57);
  ctx.textAlign = "right";
  ctx.fillStyle = clock.reachedDayEnd ? "#efaa8a" : "#d9e8c9";
  ctx.fillText(`Day ${clock.day}  ${clock.timeLabel}`, x + width - 12, y + 57);
  ctx.textAlign = "left";

  if (state.combatTimer <= 0 && state.player.hp < state.player.maxHp) {
    ctx.fillStyle = "#96dda5";
    ctx.font = "700 10px Segoe UI, Arial";
    ctx.fillText("Regenerating", x + 18, y + height - 8);
  }
}

function drawBossBar(ctx, state) {
  if (!(state.encounter.phase === "bossIntro" || (state.boss && (!state.boss.dead || state.areaCleared)))) {
    return;
  }

  const width = Math.min(520, state.viewport.width - 80);
  const height = 16;
  const x = state.viewport.width / 2 - width / 2;
  const y = 22;
  const boss = state.boss;
  const ratio = boss ? Math.max(0, boss.hp / boss.maxHp) : 1;
  const damageType = String(boss?.identity?.damageType || "physical").toLowerCase();
  const damageColor = DAMAGE_TYPES[damageType]?.color || "#db6748";
  const preparation = state.progression.activePreparation;
  const prepared = Boolean(preparation && preparation.damageType === damageType);

  ctx.fillStyle = "rgba(0, 0, 0, 0.78)";
  ctx.fillRect(x - 8, y - 20, width + 16, height + 38);
  ctx.fillStyle = "#0c1218";
  ctx.fillRect(x - 4, y - 16, width + 8, height + 30);
  ctx.fillStyle = "#32100f";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = damageColor;
  ctx.fillRect(x, y, width * ratio, height);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(x, y, width * ratio, 3);

  ctx.textAlign = "center";
  ctx.fillStyle = "#fff4d4";
  ctx.font = "700 14px Segoe UI, Arial";
  ctx.fillText(state.scene.bossName || "Elder Hollow", state.viewport.width / 2, y - 5);
  if (boss) {
    ctx.font = "700 9px Segoe UI, Arial";
    ctx.fillStyle = prepared ? "#a7e4a4" : "#d9a18d";
    const attackText = boss.currentAttack?.label
      ? `${boss.currentAttack.label.toUpperCase()} ${Math.max(0, boss.currentAttack.timer).toFixed(1)}s`
      : `PHASE ${boss.phase || 1}`;
    ctx.fillText(
      `${damageType.toUpperCase()}  |  ${attackText}  |  ${prepared ? "WARD ACTIVE" : `NO ${damageType.toUpperCase()} WARD`}`,
      state.viewport.width / 2,
      y + 29
    );
  }
  ctx.textAlign = "left";
  drawPanelChrome(ctx, x - 8, y - 20, width + 16, height + 38, damageColor);
}

function drawQuestTracker(ctx, state) {
  if (state.ui.questLogOpen) return;

  const quests = (state.activeQuests || []).filter((quest) => quest.status !== "done");
  if (quests.length === 0) return;

  const bossVisible = Boolean(
    state.encounter.phase === "bossIntro" || (state.boss && (!state.boss.dead || state.areaCleared))
  );
  const x = 18;
  const y = bossVisible ? 86 : 18;
  const width = Math.min(326, Math.max(248, state.viewport.width * 0.31));
  const selectedQuest =
    quests[Math.min(state.ui.selectedQuestIndex || 0, quests.length - 1)] || quests[0];
  const rows = [selectedQuest].map((quest) => {
    const note =
      quest.status === "complete"
        ? getQuestTurnInLabel(quest)
        : getQuestObjectiveLabel(quest);
    const noteLines = toWrappedLines(ctx, note, width - 34).slice(0, 2);
    return {
      quest,
      noteLines,
      height: 32 + noteLines.length * 14,
    };
  });
  const height = 28 + rows.reduce((sum, row) => sum + row.height, 0);
  const questAccent = selectedQuest.status === "complete" ? "#d7b866" : "#80bd79";
  const progress = getQuestProgressSummary(selectedQuest);

  drawHudBackdrop(ctx, x, y, width, height, questAccent, 0.7);
  ctx.fillStyle = questAccent;
  ctx.fillRect(x + 7, y + 8, 4, height - 16);
  ctx.fillStyle = "#f6fff1";
  ctx.font = "700 10px Segoe UI, Arial";
  ctx.fillText("NEXT STEP", x + 17, y + 18);
  ctx.textAlign = "right";
  ctx.fillStyle = progress.ready ? "#ffe4a8" : "#b9c7b5";
  ctx.font = "9px Segoe UI, Arial";
  ctx.fillText(`${progress.label}  |  L JOURNAL`, x + width - 12, y + 18);
  ctx.textAlign = "left";

  let cursorY = y + 38;
  for (const row of rows) {
    const quest = row.quest;
    const stepLabel = quest.stepLabel || "TRACK";
    const badge = getQuestStepBadgeStyle(stepLabel, quest.status);
    ctx.fillStyle = quest.status === "complete" ? "#ffe4a8" : "#fff1c6";
    ctx.font = "700 13px Segoe UI, Arial";
    const badgeW = Math.max(46, Math.ceil(ctx.measureText(stepLabel).width) + 16);
    ctx.fillText(shorten(quest.title, width < 280 ? 18 : 25), x + 17, cursorY);
    ctx.fillStyle = badge.fill;
    ctx.fillRect(x + width - badgeW - 12, cursorY - 12, badgeW, 16);
    ctx.strokeStyle = badge.border;
    ctx.strokeRect(x + width - badgeW - 12, cursorY - 12, badgeW, 16);
    ctx.textAlign = "center";
    ctx.fillStyle = badge.text;
    ctx.font = "700 9px Segoe UI, Arial";
    ctx.fillText(stepLabel, x + width - badgeW / 2 - 12, cursorY);
    ctx.textAlign = "left";
    cursorY += 15;
    ctx.fillStyle = quest.status === "complete" ? "#ffe4a8" : "rgba(246,255,241,0.78)";
    ctx.font = "11px Segoe UI, Arial";
    row.noteLines.forEach((line) => {
      ctx.fillText(line, x + 12, cursorY);
      cursorY += 14;
    });
    cursorY += 5;
  }
}

function getQuestStepBadgeStyle(label, status) {
  if (status === "complete") {
    return { fill: "rgba(95, 71, 31, 0.82)", border: "#e0bc68", text: "#fff0bd" };
  }

  switch (label) {
    case "FIGHT":
      return { fill: "rgba(75, 35, 31, 0.86)", border: "#d9785f", text: "#ffd8c9" };
    case "BREW":
      return { fill: "rgba(41, 68, 49, 0.86)", border: "#91d184", text: "#def7c1" };
    case "TEND":
      return { fill: "rgba(48, 78, 45, 0.86)", border: "#a5d57b", text: "#ecffd4" };
    case "GATHER":
      return { fill: "rgba(52, 75, 78, 0.86)", border: "#8ad8d1", text: "#d8fbf2" };
    case "SEARCH":
      return { fill: "rgba(56, 54, 82, 0.86)", border: "#bca0e4", text: "#f0e5ff" };
    case "NEW":
      return { fill: "rgba(45, 75, 55, 0.86)", border: "#9fdba2", text: "#f1ffe9" };
    default:
      return { fill: "rgba(36, 48, 58, 0.86)", border: "#86c6ff", text: "#e2f4ff" };
  }
}

function drawTrainingPanel(ctx, state) {
  const view = getTrainingView(state);
  if (!view.active) return;

  const width = Math.min(250, state.viewport.width - 36);
  const x = state.viewport.width - width - 18;
  const y = 112;
  const height = 86;
  const timeRatio = Math.max(0, Math.min(1, view.timeLeft / 20));

  drawHudBackdrop(ctx, x, y, width, height, "#bfa765", 0.76);
  ctx.fillStyle = "#fff0bd";
  ctx.font = "700 11px Segoe UI, Arial";
  const modeLabel =
    view.mode === "target-circle"
      ? "TARGET CIRCLE"
      : view.mode === "elite-pattern"
        ? "VEIL DRILL"
        : "STEADY TARGET";
  ctx.fillText(`TRAINING GROVE  |  ${modeLabel}`, x + 12, y + 18);
  ctx.fillStyle = "#dbe8d5";
  ctx.font = "700 18px Segoe UI, Arial";
  ctx.fillText(`${view.dps.toFixed(1)} DPS`, x + 12, y + 44);
  ctx.textAlign = "right";
  ctx.font = "11px Segoe UI, Arial";
  ctx.fillStyle = "#aebdb6";
  ctx.fillText(
    view.mode === "elite-pattern"
      ? `${view.dodges} dodged  |  ${view.patternHits} caught`
      : `${view.damage} damage  |  ${view.hits} hits`,
    x + width - 12,
    y + 43
  );
  ctx.fillText(
    `${view.timeLeft.toFixed(1)}s  |  best ${view.modeBestDps.toFixed(1)}`,
    x + width - 12,
    y + 61
  );
  ctx.textAlign = "left";
  ctx.fillStyle = "#29332d";
  ctx.fillRect(x + 12, y + 68, width - 24, 7);
  ctx.fillStyle = timeRatio > 0.25 ? "#d7c16f" : "#e18166";
  ctx.fillRect(x + 12, y + 68, (width - 24) * timeRatio, 7);
}

function getQuestProgressSummary(quest) {
  if (quest.status === "complete") {
    return { label: "READY", ready: true };
  }

  const objectives = quest.objectives || [];
  if (objectives.length === 0) {
    return { label: "TRACKED", ready: false };
  }

  const completed = objectives.filter((entry) => entry.current >= entry.required).length;
  if (objectives.length > 1) {
    return { label: `${completed}/${objectives.length} STEPS`, ready: false };
  }

  const objective = objectives[0];
  return {
    label: `${Math.min(objective.current, objective.required)}/${objective.required}`,
    ready: false,
  };
}

function drawQuestLogOverlay(ctx, state) {
  const panel = getQuestLogPanelData(state);
  const { quests, selectedQuest, listRect, detailRect } = panel;
  const frame = getQuestLogFrame(state);
  const { x, y, width, height } = frame;

  drawHudBackdrop(ctx, x, y, width, height, "#7ca57b", 0.92);
  ctx.fillStyle = "#f6fff1";
  ctx.font = "700 22px Segoe UI, Arial";
  ctx.fillText(state.progression.campaign?.journalUnlocked ? "Field Journal" : "Field Notes", x + 18, y + 28);
  ctx.font = "12px Segoe UI, Arial";
  ctx.fillStyle = "#d3e1cf";
  ctx.textAlign = "right";
  ctx.fillText("L / Esc close  |  Up / Down select", x + width - 58, y + 28);
  ctx.textAlign = "left";
  drawOverlayCloseButton(ctx, getOverlayCloseButton(frame), state.ui.hoverTarget);

  if (quests.length === 0) {
    ctx.fillStyle = "#d7e4cf";
    ctx.font = "15px Segoe UI, Arial";
    ctx.fillText("No active quests yet.", x + 18, y + 70);
    return;
  }

  drawForestSubpanel(ctx, listRect.x, listRect.y, listRect.width, listRect.height, {
    accent: "#536b55",
    fill: "rgba(8, 16, 13, 0.72)",
  });

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
    ctx.font = "700 12px Segoe UI, Arial";
    ctx.fillText(row.quest.title, row.rect.x + 10, row.rect.y + 17);
    ctx.fillStyle = "#9fb0aa";
    ctx.font = "10px Segoe UI, Arial";
    ctx.fillText(
      `${row.quest.kind.toUpperCase()}  |  ${row.quest.chapter.toUpperCase()}  |  ${formatQuestStatus(row.quest.status)}`,
      row.rect.x + 10,
      row.rect.y + 34
    );
  });

  drawForestSubpanel(ctx, detailRect.x, detailRect.y, detailRect.width, detailRect.height, {
    accent: "#536b55",
    fill: "rgba(8, 16, 13, 0.64)",
  });

  if (!selectedQuest) return;
  const bodyX = detailRect.x + 18;
  const bodyWidth = detailRect.width - 36;
  let cursorY = detailRect.y + 24;
  ctx.fillStyle = getQuestStatusColor(selectedQuest.status);
  ctx.font = "700 10px Segoe UI, Arial";
  ctx.fillText(
    `${selectedQuest.kind.toUpperCase()}  |  ${selectedQuest.chapter.toUpperCase()}  |  ${formatQuestStatus(selectedQuest.status)}`,
    bodyX,
    cursorY
  );
  cursorY += 28;
  ctx.fillStyle = "#fff1c6";
  ctx.font = panel.compact ? "700 18px Segoe UI, Arial" : "700 22px Segoe UI, Arial";
  ctx.fillText(selectedQuest.title, bodyX, cursorY);
  cursorY += 24;
  ctx.fillStyle = "#d8e6d4";
  ctx.font = "12px Segoe UI, Arial";
  const descriptionLines = toWrappedLines(ctx, selectedQuest.description, bodyWidth, 3);
  descriptionLines.forEach((line) => {
    ctx.fillText(line, bodyX, cursorY);
    cursorY += 16;
  });
  cursorY += 8;

  ctx.fillStyle = "#fff2d5";
  ctx.font = "700 12px Segoe UI, Arial";
  ctx.fillText("OBJECTIVES", bodyX, cursorY);
  cursorY += 18;
  ctx.font = "11px Segoe UI, Arial";
  for (const objective of selectedQuest.objectives) {
    const complete = objective.current >= objective.required;
    ctx.fillStyle = complete ? "#9de1a3" : "#d8e6d4";
    ctx.fillText(
      `${complete ? "[DONE]" : "[ ]"} ${objective.label}: ${Math.min(objective.current, objective.required)}/${objective.required}`,
      bodyX,
      cursorY
    );
    cursorY += 15;
  }

  const selectedNavigation = state.selectedQuestNavigation;
  if (selectedNavigation?.questId === selectedQuest.id && selectedQuest.status !== "done") {
    cursorY += 8;
    ctx.fillStyle = "#f1d786";
    ctx.font = "700 11px Segoe UI, Arial";
    ctx.fillText(selectedNavigation.leadLabel || "FIELD LEAD", bodyX, cursorY);
    cursorY += 15;
    ctx.fillStyle = "#d8e6d4";
    ctx.font = "11px Segoe UI, Arial";
    toWrappedLines(
      ctx,
      selectedNavigation.routeNote || selectedNavigation.hint,
      bodyWidth,
      2
    ).forEach((line) => {
      ctx.fillText(line, bodyX, cursorY);
      cursorY += 14;
    });
  }

  const rewardText = getQuestRewardSummary(selectedQuest.rewards);
  if (rewardText) {
    cursorY += 5;
    ctx.fillStyle = "#b7dcae";
    ctx.font = "11px Segoe UI, Arial";
    toWrappedLines(ctx, rewardText, bodyWidth, 2).forEach((line) => {
      ctx.fillText(line, bodyX, cursorY);
      cursorY += 14;
    });
  }

  const footerHeight = panel.compact ? 246 : 214;
  const footerY = Math.max(
    cursorY + 14,
    detailRect.y + detailRect.height - footerHeight
  );
  const bestiaryY = drawJournalRegionOverview(ctx, state, panel, footerY);
  drawJournalBestiary(ctx, state, panel, bestiaryY);
}

function drawJournalRegionOverview(ctx, state, panel, startY) {
  const { detailRect, compact } = panel;
  const region = state.regionJournal;
  if (!region) return startY;

  const x = detailRect.x + 18;
  const width = detailRect.width - 36;
  const height = compact ? 72 : 64;
  const discovered = region.locations.filter((entry) => entry.discovered).length;
  const recipe = ITEM_DEFS[region.counterRecipeId];

  drawForestSubpanel(ctx, x, startY, width, height, {
    accent: region.status.color,
    fill: "rgba(18,31,35,0.84)",
    footerAccent: region.status.color,
  });
  ctx.fillStyle = "#f5ead4";
  ctx.font = "700 12px Segoe UI, Arial";
  ctx.fillText(
    `${region.name.toUpperCase()}  |  ${region.status.label.toUpperCase()}`,
    x + 10,
    startY + 17
  );
  ctx.textAlign = "right";
  ctx.fillStyle = "#f1d786";
  ctx.font = "700 10px Segoe UI, Arial";
  ctx.fillText(region.navigation.leadLabel || "FIELD LEAD", x + width - 10, startY + 17);
  ctx.textAlign = "left";
  ctx.fillStyle = "#9fb3ac";
  ctx.font = "10px Segoe UI, Arial";
  ctx.fillText(
    `${discovered}/${region.locations.length} locations  |  ${region.damageType.toUpperCase()}  |  ${
      region.preparationActive ? "WARD ACTIVE" : recipe?.name || "NO WARD"
    }`,
    x + 10,
    startY + 34
  );
  ctx.fillStyle = "#d9e7d3";
  ctx.font = "11px Segoe UI, Arial";
  const echo = region.postgameEcho;
  const echoTitle = echo?.targetSceneId
    ? SCENES[echo.targetSceneId]?.title || echo.targetSceneId
    : "the restored roads";
  const lead =
    echo?.unlocked && echo.available
      ? `Second Spring Echo: ${echoTitle}. Optional daily challenge; progress stays restored.`
      : echo?.unlocked && echo.completedToday
        ? "Second Spring Echo: quiet today. Sleep at the Homestead to surface another."
        : `${region.navigation.questTitle}: ${region.navigation.routeNote || region.navigation.hint}`;
  toWrappedLines(ctx, lead, width - 20, compact ? 2 : 1).forEach((line, index) => {
    ctx.fillText(line, x + 10, startY + 51 + index * 13);
  });
  return startY + height + 12;
}

function drawJournalBestiary(ctx, state, panel, startY) {
  const { detailRect, compact } = panel;
  const entries = state.bestiaryEntries || [];
  const region = state.regionJournal;
  const x = detailRect.x + 18;
  const width = detailRect.width - 36;
  ctx.fillStyle = "#fff2d5";
  ctx.font = "700 12px Segoe UI, Arial";
  ctx.fillText(`${(region?.name || "FIELD").toUpperCase()} BESTIARY`, x, startY);

  const gap = 10;
  const cardWidth = compact
    ? width
    : (width - gap * Math.max(0, entries.length - 1)) /
      Math.max(1, entries.length);
  entries.forEach((entry, index) => {
    const cardX = compact ? x : x + index * (cardWidth + gap);
    const cardY = compact ? startY + 12 + index * 56 : startY + 12;
    const cardHeight = compact ? 52 : 112;
    drawForestSubpanel(ctx, cardX, cardY, cardWidth, cardHeight, {
      accent: entry.mastered ? "#8fd892" : entry.discovered ? "#8fbf9a" : "#4a5555",
      fill: entry.discovered ? "rgba(48,77,57,0.58)" : "rgba(30,35,38,0.7)",
      footerAccent: entry.mastered ? "#8fd892" : null,
    });
    ctx.fillStyle = entry.discovered ? "#eaf4d9" : "#87938f";
    ctx.font = "700 12px Segoe UI, Arial";
    ctx.fillText(entry.displayName, cardX + 10, cardY + 17);
    ctx.textAlign = "right";
    ctx.fillStyle = entry.mastered ? "#9ce1a3" : entry.discovered ? "#f1d786" : "#87938f";
    ctx.font = "700 9px Segoe UI, Arial";
    ctx.fillText(entry.knowledgeLabel, cardX + cardWidth - 10, cardY + 17);
    ctx.textAlign = "left";
    ctx.fillStyle = "#aebdb6";
    ctx.font = "10px Segoe UI, Arial";
    if (entry.discovered) {
      const counterName = entry.counterKnown
        ? ITEM_DEFS[entry.counterItemId]?.name
        : null;
      const fieldTag = counterName
        ? `${entry.damageType.toUpperCase()}  |  ${counterName}`
        : `${entry.damageType.toUpperCase()}  |  ${entry.role}`;
      ctx.fillText(fieldTag, cardX + 10, cardY + 31);
    } else {
      ctx.fillText(entry.progressLabel, cardX + 10, cardY + 31);
    }
    ctx.fillStyle = entry.mastered ? "#9ce1a3" : entry.discovered ? "#f1d786" : "#8a9692";
    ctx.font = "700 9px Segoe UI, Arial";
    ctx.fillText(entry.progressLabel, cardX + 10, compact ? cardY + 45 : cardY + 45);
    if (entry.discovered && !entry.mastered && !compact) {
      ctx.fillStyle = "#9fb0aa";
      ctx.font = "9px Segoe UI, Arial";
      ctx.fillText(shorten(entry.nextStudyHint, Math.max(26, Math.floor((cardWidth - 90) / 5))), cardX + 78, cardY + 45);
    }
    if (!compact) {
      const clue = entry.clues?.slice(0, entry.visibleClues)[0];
      const line = clue || "No reliable field clue recorded.";
      toWrappedLines(ctx, line, cardWidth - 20, 3).forEach((text, lineIndex) => {
        ctx.fillStyle = "#aebdb6";
        ctx.font = "10px Segoe UI, Arial";
        ctx.fillText(text, cardX + 10, cardY + (entry.discovered ? 60 : 58) + lineIndex * 13);
      });
      if (entry.visibleClues > 1) {
        toWrappedLines(ctx, entry.clues[1], cardWidth - 20, 2).forEach((text, lineIndex) => {
          ctx.fillText(text, cardX + 10, cardY + 88 + lineIndex * 13);
        });
      }
    }
  });
}

function drawCharacterOverlay(ctx, state) {
  const frame = getCharacterOverlayFrame(state);
  const { x, y, width, height } = frame;
  const portrait = getAylaPortrait();
  const bonuses = getPlayerBonuses(state.progression);
  const helpWidth = Math.min(frame.compact ? 210 : 280, Math.max(180, width * 0.32));
  const helpX = x + width - helpWidth - 56;

  drawHudBackdrop(ctx, x, y, width, height, "#b08a52", 0.93);
  ctx.fillStyle = "#f6ead0";
  ctx.font = frame.compact ? "700 20px Segoe UI, Arial" : "700 24px Segoe UI, Arial";
  ctx.fillText("Ayla", x + 18, y + 30);
  ctx.font = "12px Segoe UI, Arial";
  ctx.fillStyle = "#d7e4cf";
  drawWrappedText(
    ctx,
    "C / I / N / Tab switch views  |  Esc closes",
    helpX,
    y + 18,
    helpWidth,
    14,
    2
  );

  drawTabs(ctx, state, x + 18, y + 48);

  if (portrait && !frame.compact && state.ui.activeTab === "character") {
    ctx.drawImage(portrait, x + 18, y + 86, 176, 200);
  }

  if (state.ui.activeTab === "character") {
    drawCharacterTab(ctx, state, x, y, width, height, bonuses);
  } else if (state.ui.activeTab === "inventory") {
    drawInventoryTab(ctx, state, x, y, width, height);
  } else if (state.ui.activeTab === "services") {
    drawServiceTab(ctx, state, x, y, width, height);
  } else {
    drawTalentTab(ctx, state, x, y, width, height, frame.compact);
  }

  drawOverlayCloseButton(ctx, getOverlayCloseButton(frame), state.ui.hoverTarget);
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

  const availableWidth = Math.max(280, state.viewport.width - x * 2 - 10);
  const gap = availableWidth < 520 ? 10 : 10;
  const tabW = Math.max(
    86,
    Math.min(116, Math.floor((availableWidth - gap * (tabs.length - 1)) / tabs.length))
  );

  tabs.forEach(([id, label], index) => {
    const tx = x + index * (tabW + gap);
    const active = state.ui.activeTab === id;
    drawForestButton(ctx, rect(tx, y, tabW, 28), {
      selected: active,
      accent: active ? "#d7bb71" : "#64815e",
      fill: active ? "rgba(42, 51, 36, 0.94)" : "rgba(18, 28, 22, 0.9)",
    });
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
    drawForestSubpanel(ctx, slotX, slotY - 16, 220, 34, {
      selected,
      accent: selected ? "#d7bb71" : "#42584b",
      fill: selected ? "rgba(48, 72, 46, 0.54)" : "rgba(0, 0, 0, 0.28)",
    });
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

  panel.loadouts.forEach((loadout) => {
    drawForestSubpanel(ctx, loadout.rect.x, loadout.rect.y, loadout.rect.width, loadout.rect.height, {
      selected: loadout.entry.active,
      accent: loadout.entry.active
        ? "#9bd89d"
        : loadout.unlocked
          ? "#698d6b"
          : "#3d4848",
      fill: loadout.entry.active ? "rgba(48, 82, 62, 0.48)" : "rgba(0,0,0,0.3)",
      footerAccent: loadout.entry.active ? "#9bd89d" : null,
    });
    ctx.fillStyle = loadout.unlocked ? "#fff2d5" : "#8d9994";
    ctx.font = "700 12px Segoe UI, Arial";
    ctx.fillText(loadout.label, loadout.rect.x + 10, loadout.rect.y + 17);
    if (loadout.entry.active) {
      ctx.textAlign = "right";
      ctx.fillStyle = "#a9e8ac";
      ctx.font = "700 9px Segoe UI, Arial";
      ctx.fillText("ACTIVE", loadout.rect.x + loadout.rect.width - 10, loadout.rect.y + 17);
      ctx.textAlign = "left";
    }
    ctx.fillStyle = loadout.statusTone || "#aebdb6";
    ctx.font = "9px Segoe UI, Arial";
    loadout.statusLines.slice(0, 2).forEach((line, lineIndex) => {
      ctx.fillText(line, loadout.rect.x + 10, loadout.rect.y + 33 + lineIndex * 12);
    });
    if (loadout.saveButton) {
      drawActionButton(ctx, loadout.saveButton, state.ui.hoverTarget, "#17241b", "#eef7df");
    }
    if (loadout.activateButton) {
      drawActionButton(ctx, loadout.activateButton, state.ui.hoverTarget, "#17202a", "#eef5ff");
    }
  });
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
    drawForestSubpanel(ctx, listX, rowY - 16, listWidth, 34, {
      selected,
      accent: selected ? "#d7bb71" : "#42584b",
      fill: selected ? "rgba(48, 72, 46, 0.54)" : "rgba(0, 0, 0, 0.26)",
    });
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
    if (entry.locked) {
      ctx.fillStyle = "#e9d281";
      ctx.font = "700 9px Segoe UI, Arial";
      ctx.fillText("LOCK", listX + listWidth - 92, rowY + 2);
    }
    rowY += 40;
  });

  if (!selectedEntry) return;

  drawForestSubpanel(ctx, detailsX, detailsY - 18, detailsRect.width, detailsRect.height, {
    accent: "#596f58",
    fill: "rgba(0, 0, 0, 0.34)",
  });
  ctx.fillStyle = "#fff2d5";
  ctx.font = "700 14px Segoe UI, Arial";
  ctx.fillText(selectedEntry.name, detailsX + 12, detailsY + 2);
  ctx.fillStyle = getRarityAccent(selectedEntry.rarity, "#fff6d8");
  ctx.font = "700 10px Segoe UI, Arial";
  ctx.fillText(
    `${selectedEntry.rarity?.toUpperCase() || "COMMON"} ${
      selectedEntry.category === "equipment" ? selectedEntry.slot.toUpperCase() : selectedEntry.category.toUpperCase()
    }`,
    detailsX + 12,
    detailsY + 18
  );
  ctx.fillStyle = "#cfd9d3";
  ctx.font = "12px Segoe UI, Arial";
  wrapText(ctx, selectedEntry.description, detailsX + 12, detailsY + 42, 216, 18);
  ctx.fillStyle = "#e9d281";
  ctx.font = "11px Segoe UI, Arial";
  ctx.fillText(`Value ${getItemValue(selectedEntry.id)} silver`, detailsX + 12, detailsY + 88);
  if (service?.kind === "shop") {
    ctx.fillStyle = selectedEntry.locked ? "#e1bd68" : "#c9b18b";
    ctx.fillText(
      selectedEntry.locked
        ? "Locked: cannot sell until unlocked."
        : `Sell price ${getSellValue(selectedEntry)} silver`,
      detailsX + 112,
      detailsY + 88
    );
  }
  const roleLabel = getLootIntentLabel(selectedEntry);
  if (roleLabel) {
    ctx.fillStyle = "#9dd9a2";
    ctx.fillText(`Role: ${roleLabel}`, detailsX + 12, detailsY + 104);
  }

  if (panel.primaryButton) {
    drawActionButton(ctx, panel.primaryButton, state.ui.hoverTarget, "#11202c", "#f6ead0");
  }
  if (panel.sellButton) {
    drawActionButton(ctx, panel.sellButton, state.ui.hoverTarget, "#241714", "#fff0dd");
  }
  if (panel.lockButton) {
    drawActionButton(
      ctx,
      panel.lockButton,
      state.ui.hoverTarget,
      selectedEntry.locked ? "#312712" : "#182029",
      selectedEntry.locked ? "#ffe19b" : "#d7e4cf"
    );
  }

  let detailY = detailsY + 158;
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
      ctx.fillText(`${formatBonusKey(key)}: ${formatBonusValue(key, value)}`, detailsX + 12, bonusY);
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
      const comparison = buildEquipmentComparison(selectedEntry, equippedItem);
      const comparisonSummary = comparison.summary;
      drawComparisonChip(ctx, "UP", comparisonSummary.up, detailsX + 12, detailY - 2, "#9ce1a3");
      drawComparisonChip(ctx, "DOWN", comparisonSummary.down, detailsX + 68, detailY - 2, "#f0a08d");
      drawComparisonChip(ctx, "SAME", comparisonSummary.same, detailsX + 140, detailY - 2, "#d7e4cf");
      detailY += 22;
      for (const line of comparison.summaryLines) {
        ctx.fillStyle = line.startsWith("Tradeoffs") ? "#d9bfa4" : "#cfe8c6";
        ctx.font = "11px Segoe UI, Arial";
        ctx.fillText(line, detailsX + 12, detailY);
        detailY += 14;
      }
      for (const line of comparison.lines.slice(0, COMPARISON_VISIBLE_LINES)) {
        ctx.fillStyle = getComparisonDeltaColor(line.delta);
        ctx.font = "11px Segoe UI, Arial";
        ctx.fillText(
          `${line.label}: ${line.equipped} -> ${line.current} ${formatComparisonDelta(line.delta, line.key)}`,
          detailsX + 12,
          detailY
        );
        detailY += 14;
      }
      if (comparison.lines.length > COMPARISON_VISIBLE_LINES) {
        ctx.fillStyle = "#9fb0b8";
        ctx.font = "10px Segoe UI, Arial";
        ctx.fillText(`+${comparison.lines.length - COMPARISON_VISIBLE_LINES} more stats on hover`, detailsX + 12, detailY);
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

function drawTalentTab(ctx, state, x, y, width, height, compact = false) {
  const panel = getTalentPanelData(state, { x, y, width, height, compact });
  ctx.fillStyle = "#fff2d5";
  ctx.font = "700 16px Segoe UI, Arial";
  ctx.fillText("Ayla's Talent Tree", panel.treeRect.x, panel.headerY);
  ctx.font = "11px Segoe UI, Arial";
  ctx.fillStyle = "#d7e4cf";
  ctx.fillText(`Unspent Points: ${state.progression.talentPoints}  |  One Signature ultimate`, panel.treeRect.x + 150, panel.headerY);

  for (const branch of panel.branches) {
    ctx.fillStyle = branch.color;
    ctx.font = "700 13px Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.fillText(branch.name, branch.centerX, panel.branchHeaderY);
    ctx.fillStyle = "#aebcaf";
    ctx.font = "10px Segoe UI, Arial";
    ctx.fillText(branch.subtitle, branch.centerX, panel.branchHeaderY + 15);
  }
  ctx.textAlign = "left";

  ctx.save();
  ctx.lineWidth = 3;
  for (const connection of panel.connections) {
    ctx.strokeStyle = connection.active ? connection.color : "rgba(76, 88, 99, 0.68)";
    ctx.beginPath();
    ctx.moveTo(connection.from.x, connection.from.y);
    ctx.lineTo(connection.to.x, connection.to.y);
    ctx.stroke();
  }
  ctx.restore();

  panel.rows.forEach((row) => {
    const unlocked = Boolean(state.progression.talents[row.talent.id]);
    const selected = row.index === state.ui.selectedTalentIndex;
    const unlockState = row.unlockState;
    drawForestSubpanel(ctx, row.rect.x, row.rect.y, row.rect.width, row.rect.height, {
      selected: selected || unlocked,
      accent: unlocked
        ? row.color
        : selected
          ? "#d9efff"
          : unlockState.unlockable
            ? row.color
            : "#34404c",
      fill: unlocked
        ? "rgba(91, 151, 105, 0.3)"
        : selected
          ? "rgba(121, 184, 255, 0.18)"
          : "rgba(0, 0, 0, 0.3)",
      footerAccent: row.talent.capstone ? row.color : null,
    });
    const iconSize = Math.min(row.rect.height - 6, 36);
    drawTalentIcon(
      ctx,
      row.talent.id,
      row.rect.x + 4,
      row.rect.y + (row.rect.height - iconSize) / 2,
      iconSize,
      { alpha: unlocked || unlockState.unlockable ? 1 : 0.42 }
    );
    ctx.fillStyle = unlocked ? "#c9f0bb" : unlockState.unlockable ? "#fff2cf" : "#87929e";
    ctx.font = "700 11px Segoe UI, Arial";
    ctx.textAlign = "left";
    ctx.fillText(
      row.talent.capstone ? `ULT: ${row.talent.name}` : row.talent.name,
      row.rect.x + iconSize + 9,
      row.rect.y + 18
    );
    ctx.fillStyle = unlocked ? row.color : "#9eabb4";
    ctx.font = "10px Segoe UI, Arial";
    ctx.fillText(
      unlocked ? "LEARNED" : unlockState.unlockable ? "AVAILABLE" : `TIER ${row.talent.tier}`,
      row.rect.x + iconSize + 9,
      row.rect.y + 34
    );
  });
  ctx.textAlign = "right";
  ctx.fillStyle = "#b8c7bd";
  ctx.fillText("8 points max in current campaign", panel.treeRect.x + panel.treeRect.width, panel.headerY);
  ctx.textAlign = "left";

  const detail = panel.selectedTalent;
  if (!detail) return;

  drawForestSubpanel(ctx, panel.detailRect.x, panel.detailRect.y, panel.detailRect.width, panel.detailRect.height, {
    accent: panel.selectedBranch?.color || "#8fdc8b",
    fill: "rgba(0, 0, 0, 0.34)",
    footerAccent: panel.selectedBranch?.color || "#8fdc8b",
  });
  const detailUnlocked = Boolean(state.progression.talents[detail.id]);
  const detailIconSize = panel.compact ? 44 : 48;
  drawTalentIcon(
    ctx,
    detail.id,
    panel.detailRect.x + 10,
    panel.detailRect.y + (panel.detailRect.height - detailIconSize) / 2,
    detailIconSize,
    { alpha: detailUnlocked || panel.selectedUnlockState.unlockable ? 1 : 0.58 }
  );
  const detailTextX = panel.detailRect.x + detailIconSize + 20;
  ctx.fillStyle = "#fff2d5";
  ctx.font = "700 14px Segoe UI, Arial";
  ctx.fillText(detail.name, detailTextX, panel.detailRect.y + 22);
  ctx.fillStyle = panel.selectedBranch?.color || "#8fdc8b";
  ctx.font = "700 10px Segoe UI, Arial";
  ctx.fillText(
    `${detail.tree.toUpperCase()}  |  TIER ${detail.tier}${detail.capstone ? "  |  SIGNATURE ULTIMATE" : ""}`,
    detailTextX,
    panel.detailRect.y + 39
  );

  ctx.fillStyle = detailUnlocked ? "#9ce1a3" : panel.selectedUnlockState.unlockable ? "#f1d786" : "#b18d86";
  ctx.font = "700 11px Segoe UI, Arial";
  ctx.fillText(
    detailUnlocked
      ? "Unlocked"
      : panel.selectedUnlockState.unlockable
        ? "Ready to unlock"
        : panel.selectedUnlockState.reason,
    detailTextX,
    panel.detailRect.y + 57
  );

  ctx.textAlign = "right";
  ctx.fillStyle = "#91a09a";
  ctx.font = "11px Segoe UI, Arial";
  ctx.fillText(
    "Hover a talent for full details",
    panel.unlockButton ? panel.unlockButton.rect.x - 14 : panel.detailRect.x + panel.detailRect.width - 14,
    panel.detailRect.y + 22
  );
  ctx.textAlign = "left";

  if (panel.unlockButton) {
    drawActionButton(
      ctx,
      panel.unlockButton,
      state.ui.hoverTarget,
      panel.selectedUnlockState.unlockable ? "#142219" : "#21191a",
      panel.selectedUnlockState.unlockable ? "#f6ead0" : "#9b8e8a"
    );
  }
}

function drawServiceTab(ctx, state, x, y, width, height) {
  const panel = getServicePanelData(state, { x, y, width, height });
  const { service, bodyX, bodyY } = panel;

  ctx.fillStyle = "#fff2d5";
  ctx.font = "700 16px Segoe UI, Arial";
  ctx.fillText(service ? service.title : "Services", bodyX, bodyY - 18);
  ctx.font = "11px Segoe UI, Arial";
  ctx.fillStyle = "#d7e4cf";
  panel.subtitleLines.forEach((line, index) => {
    ctx.fillText(line, bodyX, bodyY + index * 14);
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
        drawForestSubpanel(ctx, rowRect.x, rowRect.y, rowRect.width, rowRect.height, {
          selected,
          accent: selected ? "#d7bb71" : "#42584b",
          fill: selected ? "rgba(48, 72, 46, 0.54)" : "rgba(0, 0, 0, 0.26)",
        });
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
      drawForestSubpanel(ctx, panel.detailsRect.x, panel.detailsRect.y, panel.detailsRect.width, panel.detailsRect.height, {
        accent: "#596f58",
        fill: "rgba(0, 0, 0, 0.34)",
      });
      ctx.fillStyle = getRarityAccent(selectedItem.rarity, "#fff2d5");
      ctx.font = "700 14px Segoe UI, Arial";
      ctx.fillText(selectedItem.name, panel.detailsRect.x + 12, panel.detailsRect.y + 20);
      ctx.fillStyle = "#d7e4cf";
      ctx.font = "12px Segoe UI, Arial";
      wrapText(ctx, selectedItem.description, panel.detailsRect.x + 12, panel.detailsRect.y + 42, panel.detailsRect.width - 24, 18);
      ctx.fillStyle = "#e9d281";
      ctx.font = "11px Segoe UI, Arial";
      ctx.fillText(`Price ${panel.selected.price} silver`, panel.detailsRect.x + 12, panel.detailsRect.y + 106);
      const roleLabel = getLootIntentLabel(selectedItem);
      if (roleLabel) {
        ctx.fillStyle = "#9dd9a2";
        ctx.fillText(`Role: ${roleLabel}`, panel.detailsRect.x + 12, panel.detailsRect.y + 122);
      }

      if (selectedItem.category === "equipment" && selectedItem.slot) {
        const equippedItem = getEquippedItems(state.progression).find((entry) => entry.slot === selectedItem.slot)?.item;
        let compareY = panel.detailsRect.y + 146;
        ctx.fillStyle = "#fff2d5";
        ctx.font = "700 12px Segoe UI, Arial";
        ctx.fillText("Comparison", panel.detailsRect.x + 12, compareY);
        compareY += 18;
        if (equippedItem) {
          ctx.fillStyle = getRarityAccent(equippedItem.rarity, "#d7e4cf");
          ctx.font = "700 11px Segoe UI, Arial";
          ctx.fillText(`Equipped: ${equippedItem.name}`, panel.detailsRect.x + 12, compareY);
          compareY += 16;
          const comparison = buildEquipmentComparison(selectedItem, equippedItem);
          for (const line of comparison.summaryLines.slice(0, 2)) {
            ctx.fillStyle = line.startsWith("Tradeoffs") ? "#d9bfa4" : "#cfe8c6";
            ctx.font = "11px Segoe UI, Arial";
            ctx.fillText(line, panel.detailsRect.x + 12, compareY);
            compareY += 14;
          }
          for (const line of comparison.lines.slice(0, 3)) {
            ctx.fillStyle = line.delta > 0 ? "#9ce1a3" : line.delta < 0 ? "#f0a08d" : "#d7e4cf";
            ctx.font = "11px Segoe UI, Arial";
            ctx.fillText(
              `${line.label}: ${line.equipped} -> ${line.current} ${formatComparisonDelta(line.delta, line.key)}`,
              panel.detailsRect.x + 12,
              compareY
            );
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

  if (service.kind === "altar" || service.kind === "crafting" || service.kind === "renewal") {
    panel.rows.forEach(({ entry, index, rect: rowRect, descriptionLines, compact }) => {
      const selected = index === state.ui.selectedServiceIndex;
      drawForestSubpanel(ctx, rowRect.x, rowRect.y, rowRect.width, rowRect.height, {
        selected,
        accent: selected ? "#d7bb71" : "#42584b",
        fill: selected ? "rgba(48, 72, 46, 0.54)" : "rgba(0, 0, 0, 0.26)",
      });
      ctx.fillStyle = "#fff6d8";
      ctx.font = "700 12px Segoe UI, Arial";
      ctx.fillText(entry.title || entry.name, rowRect.x + 12, rowRect.y + (compact ? 14 : 18));
      ctx.fillStyle = "#d7e4cf";
      ctx.font = "11px Segoe UI, Arial";
      descriptionLines.forEach((line, lineIndex) => {
        ctx.fillText(line, rowRect.x + 12, rowRect.y + (compact ? 29 : 36) + lineIndex * 13);
      });
      ctx.fillStyle = entry.affordable ? "#f1d786" : "#c67d72";
      ctx.fillText(
        service.kind === "crafting" ? formatRecipeCost(entry) : formatActionCost(entry),
        rowRect.x + 12,
        rowRect.y + rowRect.height - (compact ? 7 : 8)
      );
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
  drawForestSubpanel(ctx, x, y, width, 252, {
    selected: active,
    accent: active ? "#d7bb71" : "#42584b",
    fill: "rgba(0,0,0,0.24)",
  });
  let rowY = y + 18;
  if (entries.length === 0) {
    ctx.fillStyle = "#aebdc6";
    ctx.font = "11px Segoe UI, Arial";
    ctx.fillText("Empty", x + 12, rowY + 10);
    return;
  }
  entries.slice(0, 6).forEach((entry, index) => {
    const selected = index === selectedIndex;
    drawForestSubpanel(ctx, x + 8, rowY - 12, width - 16, 30, {
      selected,
      accent: selected ? "#d7bb71" : "#42584b",
      fill: selected ? "rgba(48, 72, 46, 0.5)" : "rgba(0,0,0,0.2)",
    });
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

function formatBonusValue(key, value) {
  if (typeof value !== "number" || Number.isNaN(value)) return String(value);
  if (value === 0) return "0";

  const sign = value > 0 ? "+" : "-";
  const absValue = Math.abs(value);

  if (key === "staffArcBonus") {
    return `${sign}${Math.round((absValue * 180) / Math.PI)} deg arc`;
  }

  if (PERCENT_BONUS_KEYS.has(key)) {
    return `${sign}${Math.round(absValue * 100)}%`;
  }

  if (COOLDOWN_CUT_BONUS_KEYS.has(key)) {
    return `${sign}${formatTrimmedNumber(absValue, 2)}s cut`;
  }

  if (SECONDS_BONUS_KEYS.has(key)) {
    return `${sign}${formatTrimmedNumber(absValue, 2)}s`;
  }

  if (RANGE_BONUS_KEYS.has(key)) {
    return `${sign}${Math.round(absValue)} range`;
  }

  if (key === "moveSpeedBonus") {
    return `${sign}${Math.round(absValue)} speed`;
  }

  return `${sign}${formatTrimmedNumber(absValue, 2)}`;
}

function formatTrimmedNumber(value, digits = 2) {
  return value.toFixed(digits).replace(/\.?0+$/, "");
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
  if (!state.story.focus || state.story.dialogue || state.story.questPanel || state.gameOver || state.ui.menuOpen || state.ui.questLogOpen || state.ui.worldMapOpen) return;

  ctx.font = "700 14px Segoe UI, Arial";
  const promptLines = toWrappedLines(ctx, `E  ${state.story.prompt}`, Math.min(320, state.viewport.width - 72));
  const panelW = Math.min(
    state.viewport.width - 56,
    Math.max(260, Math.ceil(Math.max(...promptLines.map((line) => ctx.measureText(line).width), 220)) + 32)
  );
  const panelH = 24 + promptLines.length * 16;
  const x = state.viewport.width / 2 - panelW / 2;
  const y = state.viewport.height - panelH - 128;

  drawHudBackdrop(ctx, x, y, panelW, panelH, "#d6bb73", 0.76);
  ctx.font = "700 14px Segoe UI, Arial";
  ctx.fillStyle = "#fff6d0";
  drawWrappedText(ctx, `E  ${state.story.prompt}`, x + 16, y + 22, panelW - 32, 16, 3);
}

function drawExitPrompt(ctx, state) {
  if (!state.nearExit || state.gameOver || state.story.dialogue || state.story.questPanel || state.ui.menuOpen || state.ui.questLogOpen || state.ui.worldMapOpen) return;

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

  drawHudBackdrop(ctx, x, y, panelW, panelH, locked ? "#d87979" : "#d6bb73", 0.76);
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
  const frame = getWorldMapFrame(state);
  const { x, y, width: panelW, height: panelH } = frame;
  const contentX = x + 28;
  const contentY = y + 88;
  const graphW = panelW - 56;
  const graphH = panelH - 144;

  ctx.fillStyle = "rgba(4, 8, 11, 0.84)";
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  drawHudBackdrop(ctx, x, y, panelW, panelH, "#d7c28b", 0.94);

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
  ctx.fillText("M / Esc close", x + panelW - 64, y + 38);
  ctx.textAlign = "left";

  drawForestSubpanel(ctx, contentX, contentY, graphW, graphH, {
    accent: "#5d745f",
    fill: "#0f151c",
  });

  const nodePositions = {};
  const navigationTargets = new Set(state.navigation?.targetSceneIds || []);
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
    const navigationTarget = navigationTargets.has(sceneId);
    const cleared = Boolean(state.sceneProgress[sceneId]?.cleared);
    const status = getRegionStatus(state.progression, state.sceneProgress, sceneId);
    const color = getBiomeMapColor(scene.biomeId);
    const radius = current ? 14 : 10;

    if (navigationTarget) {
      const markerRadius = radius + 10;
      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.rotate(Math.PI / 4);
      ctx.strokeStyle = "#f2d27d";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        -markerRadius,
        -markerRadius,
        markerRadius * 2,
        markerRadius * 2
      );
      ctx.restore();
    }

    ctx.fillStyle = current ? "#f4ead3" : "rgba(10, 14, 18, 0.92)";
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius + 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = current ? "#fff7d8" : status.color;
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

  const currentStatus = getRegionStatus(
    state.progression,
    state.sceneProgress,
    state.currentSceneId
  );
  const nextLead = state.navigation?.routeNote
    ? ` ${state.navigation.routeNote}`
    : state.navigation?.targetLabel
      ? ` Next lead: ${state.navigation.targetLabel}.`
      : "";
  const footer = state.scene?.title
    ? `Current zone: ${state.scene.title}. Region ${currentStatus.label}.${nextLead} Hold E on a gate to confirm travel.`
    : `Hold E on a gate to confirm travel.${nextLead}`;
  ctx.fillStyle = "#c8d4bd";
  ctx.font = "12px Segoe UI, Arial";
  drawWrappedText(ctx, footer, contentX, y + panelH - 28, panelW - 56, 15, 2);
  drawOverlayCloseButton(ctx, getOverlayCloseButton(frame), state.ui.hoverTarget);
}

function drawToast(ctx, state) {
  if (!state.story.toastText || state.story.toastTimer <= 0) return;

  ctx.font = "700 13px Segoe UI, Arial";
  const lines = toWrappedLines(ctx, state.story.toastText, Math.min(420, state.viewport.width - 96));
  const boxW = Math.min(
    state.viewport.width - 48,
    Math.max(240, Math.ceil(Math.max(...lines.map((line) => ctx.measureText(line).width))) + 48)
  );
  const boxH = 24 + lines.length * 16;
  const boxX = state.viewport.width / 2 - boxW / 2;
  const boxY = state.encounter?.phase === "bossIntro" ? 92 : 132;

  ctx.save();
  ctx.globalAlpha = Math.min(1, state.story.toastTimer / 0.35);
  drawHudBackdrop(ctx, boxX, boxY, boxW, boxH, "#d6bb73", 0.74);
  ctx.fillStyle = "#d6bb73";
  ctx.fillRect(boxX + 12, boxY + 7, boxW - 24, 2);
  ctx.fillStyle = "#fff1c6";
  ctx.font = "700 13px Segoe UI, Arial";
  ctx.textAlign = "center";
  lines.forEach((line, index) => {
    ctx.fillText(line, state.viewport.width / 2, boxY + 22 + index * 16);
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

  const frame = getDialogueFrame(state);
  const { x, y, width, height } = frame;

  drawHudBackdrop(ctx, x, y, width, height, "#d6bb73", 0.9);
  ctx.fillStyle = "#fff6d0";
  ctx.font = "700 16px Segoe UI, Arial";
  ctx.fillText(dialogue.speakerName, x + 18, y + 24);
  ctx.fillStyle = "#eff7e8";
  ctx.font = "14px Segoe UI, Arial";
  drawWrappedText(ctx, dialogue.lines[dialogue.index], x + 18, y + 48, width - 36, 20, 6);
  ctx.fillStyle = "rgba(255, 246, 208, 0.72)";
  ctx.font = "12px Segoe UI, Arial";
  ctx.textAlign = "right";
  ctx.fillText("E / Enter / Space", x + width - 58, y + height - 16);
  ctx.textAlign = "left";
  drawOverlayCloseButton(ctx, getOverlayCloseButton(frame), state.ui.hoverTarget);
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
  ctx.fillText(
    state.transition.title || `Entering ${state.transition.label}`,
    state.viewport.width / 2,
    state.viewport.height / 2
  );
  ctx.font = "13px Segoe UI, Arial";
  ctx.fillStyle = `rgba(222, 239, 210, ${Math.min(1, 0.2 + ratio)})`;
  ctx.fillText(
    state.transition.subtitle || "The forest shifts under Ayla's feet",
    state.viewport.width / 2,
    state.viewport.height / 2 + 28
  );
  ctx.restore();
  ctx.textAlign = "left";
}

function drawEndState(ctx, state) {
  if (!state.gameOver) return;

  const panelW = 420;
  const panelH = 114;
  const x = state.viewport.width / 2 - panelW / 2;
  const y = state.viewport.height / 2 - panelH / 2;

  drawHudBackdrop(ctx, x, y, panelW, panelH, "#d87979", 0.9);
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

  return [...keys]
    .map((key) => {
      const currentValue = current.bonuses?.[key] || 0;
      const equippedValue = equipped?.bonuses?.[key] || 0;
      return {
        key,
        label: formatBonusKey(key),
        current: formatBonusValue(key, currentValue),
        equipped: formatBonusValue(key, equippedValue),
        delta: currentValue - equippedValue,
      };
    })
    .sort((a, b) => {
      const impactDelta = Math.abs(b.delta) - Math.abs(a.delta);
      return impactDelta !== 0 ? impactDelta : a.label.localeCompare(b.label);
    });
}

function buildEquipmentComparison(current, equipped) {
  const lines = buildComparisonLines(current, equipped);
  return {
    lines,
    summary: getComparisonSummary(lines),
    summaryLines: buildComparisonInsightLines(current, equipped, lines),
  };
}

function buildComparisonInsightLines(current, equipped, lines) {
  const currentAffinity = getItemAspectAffinity(current);
  const equippedAffinity = getItemAspectAffinity(equipped);
  const gains = lines
    .filter((line) => line.delta > 0)
    .slice(0, 2)
    .map(formatComparisonTrait);
  const tradeoffs = lines
    .filter((line) => line.delta < 0)
    .slice(0, 2)
    .map(formatComparisonTrait);
  const insightLines = [];

  if (currentAffinity && equippedAffinity && currentAffinity.id !== equippedAffinity.id) {
    insightLines.push(`Build shift: ${equippedAffinity.label} -> ${currentAffinity.label}`);
  } else if (currentAffinity) {
    insightLines.push(`Best for: ${currentAffinity.label}`);
  } else {
    insightLines.push("Best for: mixed utility");
  }

  if (gains.length > 0) {
    insightLines.push(`Gains: ${gains.join(", ")}`);
  }

  if (tradeoffs.length > 0) {
    insightLines.push(`Tradeoffs: ${tradeoffs.join(", ")}`);
  } else if (gains.length > 0) {
    insightLines.push("Tradeoffs: none");
  }

  return insightLines;
}

function formatComparisonTrait(line) {
  return `${line.label} ${formatBonusValue(line.key, line.delta)}`;
}

function getComparisonSummary(lines) {
  return lines.reduce(
    (summary, line) => {
      if (line.delta > 0) summary.up += 1;
      else if (line.delta < 0) summary.down += 1;
      else summary.same += 1;
      return summary;
    },
    { up: 0, down: 0, same: 0 }
  );
}

function getComparisonDeltaColor(delta) {
  if (delta > 0) return "#9ce1a3";
  if (delta < 0) return "#f0a08d";
  return "#d7e4cf";
}

function formatComparisonDelta(delta, key = null) {
  if (delta > 0 || delta < 0) return `(${formatBonusValue(key, delta)})`;
  return "(same)";
}

function getSellValue(entry) {
  return Math.max(1, Math.floor(getItemValue(entry.id) * 0.25));
}

function drawComparisonChip(ctx, label, value, x, y, color) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.fillRect(x, y, label === "SAME" ? 58 : 48, 18);
  ctx.strokeStyle = color;
  ctx.strokeRect(x, y, label === "SAME" ? 58 : 48, 18);
  ctx.fillStyle = color;
  ctx.font = "700 9px Segoe UI, Arial";
  ctx.fillText(`${label} ${value}`, x + 6, y + 12);
}

function formatActionCost(action) {
  if (action.maxed) return "Maximum attunement";
  const parts = [];
  if (action.costRenewalSupplies) {
    parts.push(`${action.costRenewalSupplies} renewal supply`);
  }
  if (action.costSilver) parts.push(`${action.costSilver} silver`);
  for (const [itemId, amount] of Object.entries(action.costItems || {})) {
    parts.push(`${amount} ${formatItemName(itemId)}`);
  }
  return parts.join("  |  ");
}

function formatRecipeCost(recipe) {
  const parts = (recipe.ingredientEntries || []).map(
    (entry) => `${entry.owned}/${entry.required} ${formatItemName(entry.itemId)}`
  );
  parts.push(`${recipe.costSilver} silver`);
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
  drawForestButton(ctx, button.rect, {
    hovered,
    selected: button.active,
    accent: hovered ? "#d9efff" : button.accent,
    fill,
    selectedFill: "rgba(28, 50, 38, 0.94)",
  });
  ctx.fillStyle = textColor;
  ctx.font = "700 11px Segoe UI, Arial";
  ctx.fillText(button.label, button.rect.x + 10, button.rect.y + 18);
}

function drawPanelChrome(ctx, x, y, width, height, accent) {
  drawForestFrame(ctx, x, y, width, height, accent);
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
  const compact = state.viewport.width < 760 || state.viewport.height < 680;
  const marginX = compact
    ? Math.max(14, Math.min(28, Math.floor(state.viewport.width * 0.035)))
    : Math.max(28, Math.min(68, Math.floor(state.viewport.width * 0.05)));
  const marginTop = compact
    ? Math.max(14, Math.min(26, Math.floor(state.viewport.height * 0.03)))
    : Math.max(24, Math.min(70, Math.floor(state.viewport.height * 0.06)));
  const marginBottom = compact
    ? Math.max(18, Math.min(28, Math.floor(state.viewport.height * 0.04)))
    : Math.max(44, Math.min(150, Math.floor(state.viewport.height * 0.12)));
  return {
    compact,
    x: marginX,
    y: marginTop,
    width: state.viewport.width - marginX * 2,
    height: state.viewport.height - marginTop - marginBottom,
  };
}

function getQuestLogFrame(state) {
  const compact = state.viewport.width < 760 || state.viewport.height < 640;
  const marginX = compact ? 16 : Math.max(32, Math.min(56, state.viewport.width * 0.05));
  const marginY = compact ? 18 : Math.max(34, Math.min(60, state.viewport.height * 0.08));
  return {
    x: marginX,
    y: marginY,
    width: state.viewport.width - marginX * 2,
    height: state.viewport.height - marginY * 2,
  };
}

function getWorldMapFrame(state) {
  const width = Math.min(820, state.viewport.width - 56);
  const height = Math.min(620, state.viewport.height - 56);
  return {
    x: Math.round(state.viewport.width / 2 - width / 2),
    y: Math.round(state.viewport.height / 2 - height / 2),
    width,
    height,
  };
}

function getDialogueFrame(state) {
  const width = state.viewport.width - 112;
  const measureCtx = getMeasureContext("14px Segoe UI, Arial");
  const dialogue = state.story.dialogue;
  const text = dialogue?.lines?.[dialogue.index] || "";
  const wrappedLines = toWrappedLines(measureCtx, text, width - 36);
  const bodyHeight = Math.max(36, wrappedLines.length * 20);
  const height = 84 + bodyHeight;
  return {
    x: 56,
    y: state.viewport.height - height - 40,
    width,
    height,
  };
}

function getOverlayCloseButton(frame) {
  return {
    action: "close-overlay",
    rect: rect(frame.x + frame.width - 44, frame.y + 12, 28, 28),
  };
}

function getActiveOverlayCloseHoverTarget(state, mouseX, mouseY) {
  let frame = null;
  if (state.story.dialogue) {
    frame = getDialogueFrame(state);
  } else if (state.ui.worldMapOpen) {
    frame = getWorldMapFrame(state);
  } else if (state.ui.menuOpen) {
    frame = getCharacterOverlayFrame(state);
  } else if (state.ui.questLogOpen) {
    frame = getQuestLogFrame(state);
  }

  if (!frame) return null;
  const button = getOverlayCloseButton(frame);
  return pointInRect(mouseX, mouseY, button.rect) ? button : null;
}

function drawOverlayCloseButton(ctx, button, hoverTarget) {
  const hovered = hoverTarget?.action === "close-overlay";
  const { x, y, width, height } = button.rect;
  drawForestCloseButton(ctx, { x, y, width, height }, hovered, { accent: "#d7c28b" });
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
    detailsRect: rect(detailsX, detailsY - 18, 240, 300),
    primaryButton: null,
    sellButton: null,
    lockButton: null,
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
      detailsY + 116,
      66,
      28,
      primaryLabel,
      "inventory-primary",
      "#79b8ff",
      { index: state.ui.selectedInventoryIndex, entry: selectedEntry }
    );
  }

  data.lockButton = makeButton(
    detailsX + (data.primaryButton ? 86 : 12),
    detailsY + 116,
    66,
    28,
    selectedEntry.locked ? "Unlock" : "Lock",
    "inventory-lock",
    selectedEntry.locked ? "#e1bd68" : "#8fa8bd",
    { index: state.ui.selectedInventoryIndex, entry: selectedEntry }
  );

  if (service?.kind === "shop") {
    data.sellButton = makeButton(
      detailsX + 160,
      detailsY + 116,
      68,
      28,
      "Sell",
      "inventory-sell",
      "#d99b74",
      { index: state.ui.selectedInventoryIndex, entry: selectedEntry }
    );
  }

  let detailY = detailsY + 158;
  if (selectedEntry.maxStack) {
    detailY += 34;
  }
  if (selectedEntry.bonuses) {
    detailY += Object.keys(selectedEntry.bonuses).length * 16 + 4;
  }
  if (selectedEntry.category === "equipment" && selectedEntry.slot) {
    const equippedItem = getEquippedItems(state.progression).find((entry) => entry.slot === selectedEntry.slot)?.item;
    if (equippedItem) {
      const comparison = buildEquipmentComparison(selectedEntry, equippedItem);
      const visibleStats = Math.min(COMPARISON_VISIBLE_LINES, comparison.lines.length);
      detailY +=
        80 +
        comparison.summaryLines.length * 14 +
        visibleStats * 14 +
        (comparison.lines.length > COMPARISON_VISIBLE_LINES ? 14 : 0);
    } else {
      detailY += 42;
    }
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
  const loadoutY = slotY + equipped.length * 42 + 44;
  const unlockLabels = [
    "Restore Heartwood to unlock",
    "Restore Ember to unlock",
    "Restore Frost to unlock",
  ];
  const loadoutLabels = ["Grove Loadout I", "Grove Loadout II", "Grove Loadout III"];
  const loadouts = getLoadoutEntries(state.progression).map((entry, index) => {
    const loadoutRect = rect(slotX, loadoutY + index * 92, 220, 86);
    const preview = entry.preview || null;
    const status = getLoadoutStatus(entry, unlockLabels[index]);
    return {
      rect: loadoutRect,
      entry,
      label: loadoutLabels[index],
      unlocked: Boolean(entry.unlocked),
      preview,
      statusLines: status.lines,
      statusTone: status.color,
      saveButton: entry.unlocked
        ? makeButton(loadoutRect.x + 10, loadoutRect.y + 56, 92, 22, "Save Current", "loadout-save", "#79b886", {
            index,
          })
        : null,
      activateButton: entry.unlocked && entry.loadout
        ? makeButton(loadoutRect.x + 112, loadoutRect.y + 56, 98, 22, preview?.ready ? "Equip" : "Missing", "loadout-activate", preview?.ready ? "#79b8ff" : "#d59186", {
            index,
          })
        : null,
    };
  });
  return {
    equipped,
    rows,
    unequipButton:
      selected?.item
        ? makeButton(slotX, slotY + equipped.length * 42 + 6, 220, 28, "Unequip", "equipment-unequip", "#d99b74", {
            index: state.ui.selectedEquipmentIndex,
          })
        : null,
    loadouts,
  };
}

function getLoadoutStatus(entry, lockedLabel) {
  const preview = entry.preview;
  if (!entry.unlocked) {
    return {
      color: "#8d9994",
      lines: [lockedLabel, "Restore regions to earn setup slots."],
    };
  }

  if (!entry.loadout) {
    return {
      color: "#aebdb6",
      lines: ["No setup recorded yet", "Save gear and quick slots here."],
    };
  }

  if (entry.active) {
    return {
      color: "#a9e8ac",
      lines: [
        `Active: ${preview.equipment.recorded} gear, ${preview.actionSlots.recorded} quick`,
        "Matches current equipment.",
      ],
    };
  }

  if (!preview.ready) {
    return {
      color: "#e5a18f",
      lines: [
        `Missing gear: ${formatItemList(preview.missingItemIds, 2)}`,
        "Recover item or save over it.",
      ],
    };
  }

  if (preview.actionSlots.missing > 0) {
    return {
      color: "#f1d786",
      lines: [
        `Ready: ${preview.equipment.changed} gear changes`,
        `${preview.actionSlots.missing} quick slot will clear.`,
      ],
    };
  }

  return {
    color: "#aebdb6",
    lines: [
      `Ready: ${preview.equipment.changed} gear changes`,
      `${preview.actionSlots.recorded} quick slots recorded.`,
    ],
  };
}

function buildLoadoutTooltip(loadout) {
  const lines = [...loadout.statusLines];
  const preview = loadout.preview;

  if (preview?.missingItemIds?.length) {
    lines.push(`Missing: ${formatItemList(preview.missingItemIds, 4)}`);
  }
  if (preview?.missingActionItemIds?.length) {
    lines.push(`Quick slots missing: ${formatItemList(preview.missingActionItemIds, 4)}`);
  }
  if (preview?.saved) {
    lines.push("Preparation elixir is not changed by loadouts.");
  }

  return {
    title: loadout.label,
    lines,
    accent: loadout.statusTone || "#79b8ff",
  };
}

function formatItemList(itemIds, limit = 3) {
  const names = itemIds
    .slice(0, limit)
    .map((itemId) => ITEM_DEFS[itemId]?.name || formatItemName(itemId));
  const remaining = itemIds.length - names.length;
  return remaining > 0 ? `${names.join(", ")} +${remaining}` : names.join(", ");
}

function getTalentPanelData(state, frame) {
  const compact = frame.compact || frame.width < 760;
  const treeRect = rect(frame.x + 28, frame.y + 92, frame.width - 56, frame.height - 112);
  const headerY = frame.y + 104;
  const branchHeaderY = frame.y + 128;
  const branchIds = Object.keys(TALENT_BRANCHES);
  const columnGap = compact ? 8 : 18;
  const columnWidth = (treeRect.width - columnGap * 2) / 3;
  const nodeHeight = compact ? 38 : 42;
  const tierGap = Math.max(
    compact ? 42 : 48,
    Math.min(compact ? 48 : 56, (frame.height - 270) / 5)
  );
  const nodesTop = frame.y + 158;
  const rows = TALENT_DEFS.map((talent, index) => {
    const branchIndex = branchIds.indexOf(talent.branch);
    const branch = TALENT_BRANCHES[talent.branch];
    return {
      talent,
      index,
      color: branch?.color || "#9ce1a3",
      unlockState: getTalentUnlockState(state.progression, talent.id),
      rect: rect(
        treeRect.x + branchIndex * (columnWidth + columnGap) + 8,
        nodesTop + (talent.tier - 1) * tierGap,
        columnWidth - 16,
        nodeHeight
      ),
    };
  });
  const rowById = Object.fromEntries(rows.map((row) => [row.talent.id, row]));
  const connections = rows.flatMap((row) =>
    (row.talent.requires || []).map((requiredId) => {
      const parent = rowById[requiredId];
      return {
        color: row.color,
        active:
          Boolean(state.progression.talents[requiredId]) &&
          Boolean(state.progression.talents[row.talent.id]),
        from: {
          x: parent.rect.x + parent.rect.width / 2,
          y: parent.rect.y + parent.rect.height,
        },
        to: {
          x: row.rect.x + row.rect.width / 2,
          y: row.rect.y,
        },
      };
    })
  );
  const selectedTalent = TALENT_DEFS[state.ui.selectedTalentIndex] || null;
  const selectedUnlockState = selectedTalent
    ? getTalentUnlockState(state.progression, selectedTalent.id)
    : { unlockable: false, reason: "" };
  const detailHeight = compact ? 70 : 76;
  const detailRect = rect(
    treeRect.x,
    frame.y + frame.height - detailHeight - 18,
    treeRect.width,
    detailHeight
  );
  return {
    compact,
    rows,
    treeRect,
    headerY,
    branchHeaderY,
    branches: branchIds.map((branchId, index) => ({
      ...TALENT_BRANCHES[branchId],
      centerX: treeRect.x + index * (columnWidth + columnGap) + columnWidth / 2,
    })),
    connections,
    detailRect,
    selectedTalent,
    selectedBranch: selectedTalent ? TALENT_BRANCHES[selectedTalent.branch] : null,
    selectedUnlockState,
    unlockButton:
      selectedTalent && !state.progression.talents[selectedTalent.id]
        ? makeButton(
            detailRect.x + detailRect.width - 184,
            detailRect.y + Math.round((detailRect.height - 28) / 2),
            170,
            28,
            selectedUnlockState.unlockable ? "Unlock Talent" : "Locked",
            "talent-unlock",
            selectedUnlockState.unlockable ? "#9ce1a3" : "#765b58",
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
    ? toWrappedLines(subtitleMeasure, subtitle, Math.max(220, frame.width - 300), 3)
    : [subtitle];
  const contentTop = bodyY + 24 + Math.max(0, subtitleLines.length - 1) * 14;

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

  if (service.kind === "altar" || service.kind === "crafting" || service.kind === "renewal") {
    const entries = getServiceEntries(state);
    const rowWidth = frame.width - 280;
    const rows = [];
    let rowY = contentTop + 44;
    const measureCtx = getMeasureContext("11px Segoe UI, Arial");
    const compactRows = entries.length > 4;
    const rowGap = compactRows ? 4 : 12;

    entries.forEach((entry, index) => {
      const descriptionLines = measureCtx
        ? toWrappedLines(measureCtx, entry.description, rowWidth - 24).slice(0, compactRows ? 1 : 3)
        : [entry.description];
      const rowHeight = compactRows ? 54 : Math.max(68, 40 + descriptionLines.length * 13);
      rows.push({
        entry,
        index,
        descriptionLines,
        compact: compactRows,
        rect: rect(bodyX, rowY, rowWidth, rowHeight),
      });
      rowY += rowHeight + rowGap;
    });
    const selected = entries[state.ui.selectedServiceIndex] || null;
    const actionButton = selected
        ? makeButton(
            bodyX,
            frame.y + frame.height - (compactRows ? 50 : 86),
            frame.width - 280,
            30,
            selected.affordable
              ? service.kind === "crafting"
                ? "Brew Preparation"
                : service.kind === "renewal"
                  ? "Renew Homestead"
                  : selected.actionId === "attune"
                    ? "Attune Gear"
                    : "Invoke Rite"
              : selected.maxed
                ? "Maximum Attunement"
                : "Requirements Not Met",
            "service-activate",
            selected.affordable ? "#b1e29f" : "#8a6e6a",
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
  const quests = state.journalQuests || state.activeQuests || [];
  const frame = getQuestLogFrame(state);
  const compact = frame.width < 760;
  const contentY = frame.y + 52;
  const contentHeight = frame.height - 68;
  const listRect = compact
    ? rect(frame.x + 16, contentY, frame.width - 32, 102)
    : rect(frame.x + 16, contentY, Math.min(310, frame.width * 0.32), contentHeight);
  const detailRect = compact
    ? rect(frame.x + 16, contentY + 112, frame.width - 32, contentHeight - 112)
    : rect(
        listRect.x + listRect.width + 12,
        contentY,
        frame.x + frame.width - (listRect.x + listRect.width + 12) - 16,
        contentHeight
      );
  const selectedIndex = Math.max(0, Math.min(quests.length - 1, state.ui.selectedQuestIndex || 0));
  const rowHeight = 42;
  const visibleCount = Math.max(1, Math.floor((listRect.height - 12) / rowHeight));
  const startIndex = Math.max(
    0,
    Math.min(quests.length - visibleCount, selectedIndex - Math.floor(visibleCount / 2))
  );
  const rows = quests
    .slice(startIndex, startIndex + visibleCount)
    .map((quest, localIndex) => ({
      quest,
      index: startIndex + localIndex,
      rect: rect(
        listRect.x + 6,
        listRect.y + 6 + localIndex * rowHeight,
        listRect.width - 12,
        rowHeight - 4
      ),
    }));

  return {
    quests,
    rows,
    selectedQuest: quests[selectedIndex] || null,
    selectedIndex,
    listRect,
    detailRect,
    compact,
  };
}

function formatQuestStatus(status) {
  if (status === "done") return "ARCHIVED";
  if (status === "complete") return "TURN IN";
  if (status === "available") return "AVAILABLE";
  return "ACTIVE";
}

function getQuestStatusColor(status) {
  if (status === "done") return "#9de1a3";
  if (status === "complete") return "#ffdc9c";
  if (status === "available") return "#9fdba2";
  return "#86c6ff";
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
  for (const recipeId of rewards.recipes || []) {
    parts.push(`Recipe: ${formatItemName(recipeId)}`);
  }

  return parts.length > 0 ? `Rewards: ${parts.join("  |  ")}` : "Rewards: none";
}

function buildItemTooltip(entry, lines = [], progression = null) {
  const tooltipLines = [entry.description];
  const roleLabel = getLootIntentLabel(entry);
  if (roleLabel) {
    tooltipLines.push(`Role: ${roleLabel}`);
  }
  if (entry.bonuses) {
    for (const [key, value] of Object.entries(entry.bonuses)) {
      tooltipLines.push(`${formatBonusKey(key)}: ${formatBonusValue(key, value)}`);
    }
  }
  if (progression && entry.category === "equipment" && entry.slot) {
    const attunementLevel = getItemAttunementLevel(progression, entry.id);
    if (attunementLevel > 0) {
      tooltipLines.push(`Attunement Rank ${["I", "II", "III"][attunementLevel - 1]}`);
    }
    const equippedItem = getEquippedItems(progression).find((candidate) => candidate.slot === entry.slot)?.item;
    if (equippedItem && equippedItem.id !== entry.id) {
      tooltipLines.push(`Equipped: ${equippedItem.name}`);
      const comparisonResult = buildEquipmentComparison(entry, equippedItem);
      tooltipLines.push(...comparisonResult.summaryLines);
      for (const comparison of comparisonResult.lines.slice(0, COMPARISON_VISIBLE_LINES)) {
        tooltipLines.push(
          `${comparison.label}: ${comparison.equipped} -> ${comparison.current} ${formatComparisonDelta(comparison.delta, comparison.key)}`
        );
      }
      if (comparisonResult.lines.length > COMPARISON_VISIBLE_LINES) {
        tooltipLines.push(`+${comparisonResult.lines.length - COMPARISON_VISIBLE_LINES} more stat changes`);
      }
    } else if (!equippedItem) {
      tooltipLines.push("Open equipment slot.");
    }
  }
  if (entry.maxStack && typeof entry.amount === "number") {
    tooltipLines.push(`Stack ${entry.amount}/${entry.maxStack}`);
  }
  if (entry.locked) {
    tooltipLines.push("Locked against selling.");
  }
  tooltipLines.push(`Value ${getItemValue(entry.id)} silver`);
  return {
    title: entry.name,
    lines: [...tooltipLines, ...lines].filter(Boolean),
    accent: getRarityAccent(entry.rarity, entry.color || "#79b8ff"),
  };
}

function buildTalentTooltip(state, row) {
  const talent = row.talent;
  const branch = TALENT_BRANCHES[talent.branch];
  const learned = Boolean(state.progression.talents[talent.id]);
  const unlockState = row.unlockState || getTalentUnlockState(state.progression, talent.id);
  const prerequisiteNames = (talent.requires || [])
    .map((talentId) => TALENT_DEFS.find((candidate) => candidate.id === talentId)?.name)
    .filter(Boolean);
  const requirements = [];

  if (prerequisiteNames.length > 0) {
    requirements.push(`Requires: ${prerequisiteNames.join(", ")}`);
  }
  if (talent.requiresBranchPoints) {
    requirements.push(`Requires ${talent.requiresBranchPoints} points in ${branch?.name || talent.tree}`);
  }
  if (talent.requiresWorldFlag) {
    requirements.push(
      talent.worldRequirementLabel || "Complete the required campaign milestone."
    );
  }
  if (talent.capstone) {
    requirements.push("Only one Signature Ultimate can be learned.");
  }

  return {
    type: "talent",
    title: talent.capstone ? `ULT: ${talent.name}` : talent.name,
    eyebrow: `${branch?.name || talent.tree}  |  Tier ${talent.tier}`,
    lines: [talent.description],
    requirements,
    status: learned ? "LEARNED" : unlockState.unlockable ? "AVAILABLE" : "LOCKED",
    statusDetail: learned
      ? "This talent is active."
      : unlockState.unlockable
        ? "Select it, then spend 1 Talent Point."
        : unlockState.reason,
    statusColor: learned ? "#9ce1a3" : unlockState.unlockable ? "#f1d786" : "#d59186",
    accent: branch?.color || row.color || "#9ce1a3",
    iconTalentId: talent.id,
    capstone: Boolean(talent.capstone),
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
    for (const loadout of panel.loadouts) {
      if (loadout.saveButton && pointInRect(mouseX, mouseY, loadout.saveButton.rect)) {
        return {
          ...loadout.saveButton,
          tooltip: {
            title: `Save ${loadout.label}`,
            lines: [
              "Record equipped items and available quick slots in this setup.",
              ...loadout.statusLines,
            ],
            accent: loadout.saveButton.accent,
          },
        };
      }
      if (
        loadout.activateButton &&
        pointInRect(mouseX, mouseY, loadout.activateButton.rect)
      ) {
        return {
          ...loadout.activateButton,
          tooltip: {
            title: `Equip ${loadout.label}`,
            lines: [
              "Restore its recorded equipment and available quick-slot items.",
              ...buildLoadoutTooltip(loadout).lines,
            ],
            accent: loadout.activateButton.accent,
          },
        };
      }
      if (pointInRect(mouseX, mouseY, loadout.rect)) {
        return {
          action: "loadout-hover",
          index: loadout.entry.index,
          rect: loadout.rect,
          tooltip: buildLoadoutTooltip(loadout),
        };
      }
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
        tooltip: {
          title: "Sell",
          lines: [
            panel.sellButton.entry.locked
              ? "Unlock this item before selling it."
              : `Sell for ${Math.max(1, Math.floor(getItemValue(panel.sellButton.entry.id) * 0.25))} silver.`,
          ],
          accent: panel.sellButton.accent,
        },
      };
    }
    if (panel.lockButton && pointInRect(mouseX, mouseY, panel.lockButton.rect)) {
      return {
        ...panel.lockButton,
        tooltip: {
          title: panel.lockButton.label,
          lines: [
            panel.lockButton.entry.locked
              ? "Allow this item to be sold again."
              : "Protect this item from accidental selling. Keyboard: K.",
          ],
          accent: panel.lockButton.accent,
        },
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
      const row = panel.rows.find((candidate) => candidate.talent.id === panel.unlockButton.talent.id);
      return {
        ...panel.unlockButton,
        tooltip: row
          ? buildTalentTooltip(state, row)
          : { title: "Unlock Talent", lines: [panel.unlockButton.talent.description], accent: panel.unlockButton.accent },
      };
    }
    for (const row of panel.rows) {
      if (pointInRect(mouseX, mouseY, row.rect)) {
        return {
          action: "talent-select",
          index: row.index,
          talent: row.talent,
          rect: row.rect,
          tooltip: buildTalentTooltip(state, row),
        };
      }
    }
    return null;
  }

  if (state.ui.activeTab === "services") {
    const panel = getServicePanelData(state, frame);
    if (!panel.service) return null;

    if (
      panel.service.kind === "shop" ||
      panel.service.kind === "altar" ||
      panel.service.kind === "crafting" ||
      panel.service.kind === "renewal"
    ) {
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
            : {
                title: panel.selected.title || panel.selected.name,
                lines: [
                  panel.selected.description,
                  panel.service.kind === "crafting"
                    ? formatRecipeCost(panel.selected)
                    : formatActionCost(panel.selected),
                ],
                accent: panel.actionButton.accent,
              },
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
              : {
                  title: row.entry.title || row.entry.name,
                  lines: [
                    row.entry.description,
                    panel.service.kind === "crafting"
                      ? formatRecipeCost(row.entry)
                      : formatActionCost(row.entry),
                  ],
                  accent: row.entry.affordable ? "#a6e28c" : "#c67d72",
                };
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
      const readiness = getHudAbilityReadiness(state.player, slot.name, slot.info);
      return {
        rect: slot.rect,
        tooltip: {
          title: slot.info.label,
          lines: locked
            ? [readiness.detail, "Spirit tree"]
            : [
                `Status: ${readiness.label}`,
                readiness.detail,
                slot.info.cost > 0 ? `Cost ${slot.info.cost} Spirit` : "No Spirit cost",
                `Cooldown ${slot.info.cooldown.toFixed(2)}s`,
                slot.info.signatureAbility ? "Uses Heart Charge as its ultimate resource." : "",
              ].filter(Boolean),
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
  const layout = getBottomHudLayout(state);
  const { panelRect, abilityStartX, abilityY, abilitySlotSize, abilityGap } = layout;
  const { x, y, width: panelW } = panelRect;
  const abilities = getHudAbilitySpecs();
  const actionSlots = getActionSlotEntries(state.progression);
  return {
    abilitySlots: abilities.map(([name, color], index) => ({
      name,
      color,
      info: state.player.abilityInfo[name],
      rect: rect(
        abilityStartX + index * (abilitySlotSize + abilityGap),
        abilityY,
        abilitySlotSize,
        abilitySlotSize
      ),
    })),
    actionSlots: actionSlots.map((slot, index) => ({
      ...slot,
      rect: rect(layout.actionStartX + index * 88, layout.actionY, 78, 28),
    })),
    quickItems: [
      {
        key: "5",
        label: "Health Potion",
        count: state.progression.inventory.health_potion || 0,
        itemId: "health_potion",
        color: "#df6a67",
        rect: rect(x + 10, layout.statusY, 74, 18),
      },
      {
        key: "6",
        label: "Spirit Tonic",
        count: state.progression.inventory.spirit_tonic || 0,
        itemId: "spirit_tonic",
        color: "#6ecff7",
        rect: rect(x + panelW - 76, layout.statusY, 74, 18),
      },
    ],
  };
}

function drawTalentHoverTooltip(ctx, state, target) {
  const tooltip = target.tooltip;
  const boxW = Math.min(360, state.viewport.width - 32);
  const contentW = boxW - 28;
  ctx.font = "12px Segoe UI, Arial";
  const descriptionLines = tooltip.lines.flatMap((line) => toWrappedLines(ctx, line, contentW));
  ctx.font = "11px Segoe UI, Arial";
  const requirementLines = tooltip.requirements.flatMap((line) => toWrappedLines(ctx, line, contentW));
  const statusLines = toWrappedLines(ctx, tooltip.statusDetail, contentW);
  const requirementHeight = requirementLines.length > 0 ? 22 + requirementLines.length * 15 : 0;
  const boxH = 96 + descriptionLines.length * 17 + requirementHeight + statusLines.length * 15 + 26;
  const targetRect = target.rect || rect(20, 20, 0, 0);
  let cursorX = targetRect.x + targetRect.width + 12;
  if (cursorX + boxW > state.viewport.width - 16) {
    cursorX = targetRect.x - boxW - 12;
  }
  cursorX = Math.max(16, Math.min(state.viewport.width - boxW - 16, cursorX));
  const cursorY = Math.max(
    16,
    Math.min(state.viewport.height - boxH - 16, targetRect.y - 8)
  );

  drawHudBackdrop(ctx, cursorX, cursorY, boxW, boxH, tooltip.accent, 0.94);

  drawTalentIcon(ctx, tooltip.iconTalentId, cursorX + 14, cursorY + 14, 52);
  ctx.fillStyle = tooltip.capstone ? "#fff0a8" : "#fff2d5";
  ctx.font = "700 15px Segoe UI, Arial";
  ctx.fillText(tooltip.title, cursorX + 78, cursorY + 29);
  ctx.fillStyle = tooltip.accent;
  ctx.font = "700 10px Segoe UI, Arial";
  ctx.fillText(tooltip.eyebrow.toUpperCase(), cursorX + 78, cursorY + 47);
  ctx.fillStyle = tooltip.statusColor;
  ctx.font = "700 10px Segoe UI, Arial";
  ctx.fillText(tooltip.status, cursorX + 78, cursorY + 63);

  let lineY = cursorY + 82;
  ctx.fillStyle = tooltip.accent;
  ctx.fillRect(cursorX + 14, lineY - 6, boxW - 28, 1);
  ctx.fillStyle = "#e5eadf";
  ctx.font = "12px Segoe UI, Arial";
  descriptionLines.forEach((line) => {
    ctx.fillText(line, cursorX + 14, lineY + 10);
    lineY += 17;
  });

  if (requirementLines.length > 0) {
    lineY += 8;
    ctx.fillStyle = "#b7c2b9";
    ctx.font = "700 10px Segoe UI, Arial";
    ctx.fillText("REQUIREMENTS", cursorX + 14, lineY + 9);
    lineY += 17;
    ctx.fillStyle = "#c7aaa3";
    ctx.font = "11px Segoe UI, Arial";
    requirementLines.forEach((line) => {
      ctx.fillText(line, cursorX + 14, lineY + 8);
      lineY += 15;
    });
  }

  lineY += 8;
  ctx.fillStyle = tooltip.statusColor;
  ctx.font = "700 11px Segoe UI, Arial";
  statusLines.forEach((line) => {
    ctx.fillText(line, cursorX + 14, lineY + 8);
    lineY += 15;
  });

  ctx.fillStyle = "#788681";
  ctx.font = "10px Segoe UI, Arial";
  ctx.fillText("Left Click: Select talent", cursorX + 14, cursorY + boxH - 12);
}

function drawHoverTooltip(ctx, state) {
  const target = state.ui.hoverTarget;
  if (!target?.tooltip || state.story.dialogue || state.transition.active) {
    return;
  }

  if (target.tooltip.type === "talent") {
    ctx.save();
    drawTalentHoverTooltip(ctx, state, target);
    ctx.restore();
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
  const targetRect = state.ui.hoverTarget.rect;
  const cursorX = Math.max(
    16,
    Math.min(
      state.viewport.width - boxW - 16,
      targetRect ? targetRect.x + targetRect.width + 12 : 20
    )
  );
  const preferredY =
    targetRect && targetRect.y > state.viewport.height * 0.65
      ? targetRect.y - boxH - 10
      : targetRect
        ? targetRect.y + 8
        : 20;
  const cursorY = Math.max(16, Math.min(state.viewport.height - boxH - 16, preferredY));

  drawHudBackdrop(ctx, cursorX, cursorY, boxW, boxH, accent || "#8aa7b4", 0.9);
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

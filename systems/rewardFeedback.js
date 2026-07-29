import { getItemDef } from "../data/gameData.js";
import { spawnBurst } from "./particles.js";

const SILVER_COLOR = "#f3d36f";
const XP_COLOR = "#9beeff";
const DEFAULT_REWARD_COLOR = "#dfffa4";

export function pushRewardFeedback(state, x, y, reward = {}, options = {}) {
  if (!state) return;
  state.particles = state.particles || [];
  state.combatText = state.combatText || [];

  const items = Array.isArray(reward.items) ? reward.items.filter((entry) => entry && entry.amount !== 0) : [];
  const silver = Math.max(0, Math.floor(reward.silver || reward.gainedSilver || 0));
  const xp = Math.max(0, Math.floor(reward.xp || reward.gainedXp || 0));
  const text = options.text || getRewardText({ items, silver, xp, label: reward.label });
  if (!text) return;

  const color = options.color || getRewardColor(items[0]?.itemId, { silver, xp });
  spawnRewardBurst(state, x, y, {
    color,
    silver,
    xp,
    count: options.count,
    boss: options.boss,
  });
  pushFloatingRewardText(state, x, y, text, color, options);
}

export function getRewardText({ items = [], silver = 0, xp = 0, label = "" } = {}) {
  if (label) return label;
  const first = items[0];
  if (first) {
    const amount = Math.max(1, Math.floor(first.amount || 1));
    return `+${amount} ${formatItemName(first.itemId)}`;
  }
  if (silver > 0) return `+${silver} silver`;
  if (xp > 0) return `+${xp} XP`;
  return "";
}

function pushFloatingRewardText(state, x, y, text, color, options = {}) {
  const boss = Boolean(options.boss);
  const life = boss ? 1.3 : options.life || 1.05;
  state.combatText.push({
    x,
    y: y - (options.yOffset ?? (boss ? 38 : 24)),
    text,
    color,
    life,
    maxLife: life,
    rise: options.rise ?? (boss ? 26 : 22),
    scale: options.scale ?? (boss ? 1.08 : 0.96),
    heavy: false,
    reward: true,
  });

  if (state.combatText.length > 40) {
    state.combatText.splice(0, state.combatText.length - 40);
  }
}

function spawnRewardBurst(state, x, y, options = {}) {
  const color = options.color || DEFAULT_REWARD_COLOR;
  const colors = [color, "#fff1b6"];
  if (options.silver > 0) colors.push(SILVER_COLOR);
  if (options.xp > 0) colors.push(XP_COLOR);

  spawnBurst(state, x, y - 4, {
    count: options.count ?? (options.boss ? 24 : 10),
    colors,
    speed: options.boss ? 210 : 135,
    size: options.boss ? [2, 5] : [1, 3],
    life: options.boss ? [0.24, 0.64] : [0.18, 0.42],
    spread: Math.PI * 1.4,
    angle: -Math.PI / 2,
  });
}

function getRewardColor(itemId, fallback = {}) {
  if (itemId) return getItemDef(itemId)?.color || DEFAULT_REWARD_COLOR;
  if (fallback.silver > 0) return SILVER_COLOR;
  if (fallback.xp > 0) return XP_COLOR;
  return DEFAULT_REWARD_COLOR;
}

function formatItemName(itemId) {
  return getItemDef(itemId)?.name || String(itemId || "Reward").replaceAll("_", " ");
}

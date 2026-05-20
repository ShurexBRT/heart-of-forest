import { BIOMES, EQUIPMENT_SLOTS, ITEM_DEFS, TALENT_DEFS } from "../data/gameData.js";
import { QUEST_DEFS } from "../data/storyData.js";

const ACTION_SLOT_COUNT = 3;

function createQuestCounterDefaults() {
  const keys = new Set();

  for (const quest of Object.values(QUEST_DEFS)) {
    for (const objective of quest.objectives) {
      keys.add(objective.key);
    }
  }

  return Object.fromEntries([...keys].map((key) => [key, 0]));
}

function getLevelTarget(level) {
  return 80 + (level - 1) * 30 + Math.max(0, level - 1) * Math.max(0, level - 2) * 6;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeInventory(rawInventory = {}) {
  const normalized = {};

  for (const [itemId, amount] of Object.entries(rawInventory)) {
    if (!ITEM_DEFS[itemId]) continue;
    const safeAmount = Math.max(0, Math.floor(amount || 0));
    if (safeAmount <= 0) continue;
    normalized[itemId] = safeAmount;
  }

  return normalized;
}

function normalizeActionSlots(rawActionSlots = []) {
  const slots = Array.from({ length: ACTION_SLOT_COUNT }, (_, index) => rawActionSlots[index] || null);
  return slots.map((itemId) => (itemId && ITEM_DEFS[itemId] ? itemId : null));
}

function canQuickUseItem(item) {
  return Boolean(item && (item.usable || item.category === "consumable" || item.effect));
}

function createInventoryEntry(itemId, item, amount) {
  const maxStack = item.maxStack || null;
  const stackCount = maxStack ? Math.ceil(amount / maxStack) : 1;
  const entries = [];

  if (!maxStack || amount <= maxStack) {
    entries.push({
      ...item,
      amount,
      totalAmount: amount,
      stackIndex: 0,
      stackCount,
      maxStack,
    });
    return entries;
  }

  let remaining = amount;
  let stackIndex = 0;
  while (remaining > 0) {
    const stackAmount = Math.min(remaining, maxStack);
    entries.push({
      ...item,
      amount: stackAmount,
      totalAmount: amount,
      stackIndex,
      stackCount,
      maxStack,
    });
    remaining -= stackAmount;
    stackIndex += 1;
  }

  return entries;
}

export function createProgression(snapshot = null) {
  const questStates = Object.fromEntries(
    Object.values(QUEST_DEFS).map((quest) => [quest.id, quest.startState || "inactive"])
  );

  const defaults = {
    inventory: {
      spirit_bloom: 3,
      moonleaf: 1,
      health_potion: 3,
      spirit_tonic: 1,
      moonthread_amulet: 1,
      rootwoven_talisman: 1,
    },
    equipment: {
      trinket: "warden_brooch",
      amulet: null,
      talisman: null,
      relic: null,
    },
    actionSlots: ["health_potion", "spirit_tonic", null],
    talentPoints: 1,
    talents: {},
    journal: [],
    questStates,
    questCounters: createQuestCounterDefaults(),
    conversationFlags: {},
    level: 1,
    xp: 0,
    nextLevelXp: getLevelTarget(1),
  };

  if (!snapshot) {
    return defaults;
  }

  const merged = deepClone(defaults);
  merged.inventory = normalizeInventory({ ...merged.inventory, ...(snapshot.inventory || {}) });
  merged.equipment = { ...merged.equipment, ...(snapshot.equipment || {}) };
  merged.actionSlots = normalizeActionSlots(snapshot.actionSlots || merged.actionSlots);
  merged.talentPoints = snapshot.talentPoints ?? merged.talentPoints;
  merged.talents = { ...merged.talents, ...(snapshot.talents || {}) };
  merged.journal = Array.isArray(snapshot.journal) ? [...snapshot.journal] : merged.journal;
  merged.questStates = { ...merged.questStates, ...(snapshot.questStates || {}) };
  merged.questCounters = { ...merged.questCounters, ...(snapshot.questCounters || {}) };
  merged.conversationFlags = {
    ...merged.conversationFlags,
    ...(snapshot.conversationFlags || {}),
  };
  merged.level = Math.max(1, snapshot.level || merged.level);
  merged.xp = Math.max(0, snapshot.xp || 0);
  merged.nextLevelXp = Math.max(getLevelTarget(merged.level), snapshot.nextLevelXp || 0);
  return merged;
}

export function addItem(progression, itemId, amount = 1) {
  if (!ITEM_DEFS[itemId] || amount <= 0) return;
  progression.inventory[itemId] = (progression.inventory[itemId] || 0) + amount;
}

export function removeItem(progression, itemId, amount = 1) {
  if ((progression.inventory[itemId] || 0) < amount) return false;
  progression.inventory[itemId] -= amount;
  if (progression.inventory[itemId] <= 0) {
    delete progression.inventory[itemId];
  }
  return true;
}

export function getItemCount(progression, itemId) {
  return progression.inventory[itemId] || 0;
}

export function awardRewards(progression, rewards) {
  if (!rewards) return { items: [], gainedXp: 0, levelsGained: 0 };

  const granted = [];
  let gainedXp = 0;
  let levelsGained = 0;

  for (const [key, amount] of Object.entries(rewards)) {
    if (key === "talentPoints") {
      progression.talentPoints += amount;
      continue;
    }

    if (key === "xp") {
      const result = grantExperience(progression, amount);
      gainedXp += result.gainedXp;
      levelsGained += result.levelsGained;
      continue;
    }

    if (key === "items" && amount && typeof amount === "object") {
      for (const [itemId, itemAmount] of Object.entries(amount)) {
        addItem(progression, itemId, itemAmount);
        granted.push({ itemId, amount: itemAmount });
      }
      continue;
    }

    addItem(progression, key, amount);
    granted.push({ itemId: key, amount });
  }

  return { items: granted, gainedXp, levelsGained };
}

export function getInventoryEntries(progression, filter = null) {
  return Object.entries(progression.inventory)
    .filter(([, amount]) => amount > 0)
    .flatMap(([id, amount]) => createInventoryEntry(id, ITEM_DEFS[id], amount))
    .filter((entry) => !filter || entry.category === filter || entry.slot === filter)
    .sort((a, b) => (a.name === b.name ? a.stackIndex - b.stackIndex : a.name.localeCompare(b.name)));
}

export function isActionSlotAssignable(itemId) {
  const item = ITEM_DEFS[itemId];
  return canQuickUseItem(item);
}

export function getActionSlotEntries(progression) {
  const slots = normalizeActionSlots(progression.actionSlots);
  progression.actionSlots = slots;

  return slots.map((itemId, index) => {
    const item = itemId ? ITEM_DEFS[itemId] : null;
    return {
      index,
      key: String(index + 2),
      itemId,
      item,
      count: itemId ? getItemCount(progression, itemId) : 0,
      usable: item ? canQuickUseItem(item) : false,
    };
  });
}

export function assignItemToActionSlot(progression, slotIndex, itemId) {
  if (slotIndex < 0 || slotIndex >= ACTION_SLOT_COUNT) {
    return { changed: false, cleared: false };
  }

  const item = ITEM_DEFS[itemId];
  if (!item || !canQuickUseItem(item) || getItemCount(progression, itemId) <= 0) {
    return { changed: false, cleared: false };
  }

  progression.actionSlots = normalizeActionSlots(progression.actionSlots);

  if (progression.actionSlots[slotIndex] === itemId) {
    progression.actionSlots[slotIndex] = null;
    return { changed: true, cleared: true, item };
  }

  progression.actionSlots[slotIndex] = itemId;
  return { changed: true, cleared: false, item };
}

export function useActionSlot(progression, slotIndex, player) {
  const actionSlots = normalizeActionSlots(progression.actionSlots);
  progression.actionSlots = actionSlots;
  const itemId = actionSlots[slotIndex];
  if (!itemId) return { used: false };

  const item = ITEM_DEFS[itemId];
  if (!item || !canQuickUseItem(item)) {
    return { used: false };
  }

  return useConsumable(progression, itemId, player);
}

export function getEquippedItems(progression) {
  return EQUIPMENT_SLOTS.map((slot) => {
    const itemId = progression.equipment[slot];
    return {
      slot,
      itemId,
      item: itemId ? ITEM_DEFS[itemId] : null,
    };
  });
}

export function equipItem(progression, itemId) {
  const item = ITEM_DEFS[itemId];
  if (!item || item.category !== "equipment" || !item.slot) return false;
  if (getItemCount(progression, itemId) <= 0) return false;

  const previous = progression.equipment[item.slot];
  if (previous === itemId) return false;

  removeItem(progression, itemId, 1);
  if (previous) {
    addItem(progression, previous, 1);
  }

  progression.equipment[item.slot] = itemId;
  return true;
}

export function unequipItem(progression, slot) {
  const equipped = progression.equipment[slot];
  if (!equipped) return false;
  addItem(progression, equipped, 1);
  progression.equipment[slot] = null;
  return true;
}

export function useConsumable(progression, itemId, player) {
  const item = ITEM_DEFS[itemId];
  if (!item || item.category !== "consumable" || getItemCount(progression, itemId) <= 0) {
    return { used: false };
  }

  const heal = item.effect?.heal || 0;
  const spirit = item.effect?.spirit || 0;
  const healed = Math.min(heal, player.maxHp - player.hp);
  const restored = Math.min(spirit, player.maxSpirit - player.spirit);

  if (healed <= 0 && restored <= 0) {
    return { used: false };
  }

  removeItem(progression, itemId, 1);
  player.hp = Math.min(player.maxHp, player.hp + healed);
  player.spirit = Math.min(player.maxSpirit, player.spirit + restored);

  return {
    used: true,
    item,
    healed,
    restored,
  };
}

export function grantExperience(progression, amount) {
  if (amount <= 0) {
    return { gainedXp: 0, levelsGained: 0, newLevel: progression.level };
  }

  progression.xp += amount;
  let levelsGained = 0;

  while (progression.xp >= progression.nextLevelXp) {
    progression.xp -= progression.nextLevelXp;
    progression.level += 1;
    progression.talentPoints += 1;
    progression.nextLevelXp = getLevelTarget(progression.level);
    levelsGained += 1;
  }

  return {
    gainedXp: amount,
    levelsGained,
    newLevel: progression.level,
  };
}

export function unlockTalent(progression, talentId) {
  if (progression.talentPoints <= 0 || progression.talents[talentId]) {
    return false;
  }

  progression.talents[talentId] = 1;
  progression.talentPoints -= 1;
  return true;
}

export function getUnlockedTalentList(progression) {
  return TALENT_DEFS.filter((talent) => progression.talents[talent.id]);
}

export function getPlayerBonuses(progression) {
  const bonuses = {
    maxHpBonus: (progression.level - 1) * 6,
    maxSpiritBonus: (progression.level - 1) * 4,
    spiritRegenBonus: (progression.level - 1) * 0.3,
    healthRegenBonus: (progression.level - 1) * 0.18,
    staffDamageBonus: 0,
    staffSpiritBonus: 0,
    boltDamageBonus: Math.floor((progression.level - 1) / 2),
    boltRangeBonus: 0,
    dashCooldownBonus: 0,
    rootDurationBonus: 0,
    bloomBonus: 0,
    incomingDamageReductionBonus: 0,
  };

  for (const talent of TALENT_DEFS) {
    if (!progression.talents[talent.id]) continue;
    for (const [key, value] of Object.entries(talent.apply)) {
      bonuses[key] = (bonuses[key] || 0) + value;
    }
  }

  for (const slot of EQUIPMENT_SLOTS) {
    const itemId = progression.equipment[slot];
    const item = itemId ? ITEM_DEFS[itemId] : null;
    if (!item?.bonuses) continue;
    for (const [key, value] of Object.entries(item.bonuses)) {
      bonuses[key] = (bonuses[key] || 0) + value;
    }
  }

  bonuses.incomingDamageMult = Math.max(0.68, 1 - bonuses.incomingDamageReductionBonus);
  return bonuses;
}

export function getQuestCounter(progression, key) {
  return progression.questCounters[key] || 0;
}

export function incrementQuestCounter(progression, key, amount = 1) {
  progression.questCounters[key] = (progression.questCounters[key] || 0) + amount;
}

export function awardEnemyLoot(progression, enemyType, biomeId, isBoss = false) {
  const lootTable = BIOMES[biomeId]?.lootTable || ["spirit_bloom"];
  const grants = [];

  if (isBoss) {
    const bossRewards =
      biomeId === "ember"
        ? { emberglass_relic: 1, greater_health_potion: 2, relic_shard: 2 }
        : biomeId === "frost"
          ? { frostband_charm: 1, spirit_tonic: 2, stonebloom: 2 }
          : biomeId === "ancient"
            ? { heartseed_pendant: 1, heartseed: 1, greater_health_potion: 2 }
            : biomeId === "blight"
              ? { heartseed: 1, rootwoven_talisman: 1, greater_health_potion: 1 }
              : { moonthread_amulet: 1, health_potion: 2, spirit_bloom: 2 };

    for (const [itemId, amount] of Object.entries(bossRewards)) {
      addItem(progression, itemId, amount);
      grants.push({ itemId, amount });
    }

    return grants;
  }

  if (enemyType === "thornling") {
    const itemId = lootTable[0] || "spirit_bloom";
    addItem(progression, itemId, 1);
    grants.push({ itemId, amount: 1 });
    if (Math.random() < 0.12) {
      addItem(progression, "health_potion", 1);
      grants.push({ itemId: "health_potion", amount: 1 });
    }
    return grants;
  }

  if (enemyType === "wisp_archer") {
    const itemId = lootTable[1] || "moonleaf";
    addItem(progression, itemId, 1);
    grants.push({ itemId, amount: 1 });
    if (Math.random() < 0.18) {
      addItem(progression, "spirit_tonic", 1);
      grants.push({ itemId: "spirit_tonic", amount: 1 });
    }
    return grants;
  }

  const heavyDrop = lootTable[2] || lootTable[0] || "ironbark";
  addItem(progression, heavyDrop, 1);
  grants.push({ itemId: heavyDrop, amount: 1 });
  if (Math.random() < 0.28) {
    addItem(progression, "health_potion", 1);
    grants.push({ itemId: "health_potion", amount: 1 });
  }
  return grants;
}

export function getXpProgress(progression) {
  return {
    level: progression.level,
    xp: progression.xp,
    nextLevelXp: progression.nextLevelXp,
    ratio: progression.nextLevelXp > 0 ? progression.xp / progression.nextLevelXp : 0,
  };
}

import {
  BIOMES,
  BIOME_ITEM_BASES,
  EQUIPMENT_SLOTS,
  ITEM_RARITY_ORDER,
  TALENT_DEFS,
  getBiomeNamedDrops,
  getItemDef,
  rollAffixItem,
} from "../data/gameData.js";
import { QUEST_DEFS } from "../data/storyData.js";

const ACTION_SLOT_COUNT = 3;

const ENEMY_LOOT_RULES = {
  thornling: { lootIndex: 0, silver: 5, bonusChance: 0.12, bonusItem: "health_potion" },
  barkling: { primaryItemId: "ironbark", silver: 6, bonusChance: 0.14, bonusItem: "health_potion" },
  blight_hound: { primaryItemId: "cinder_resin", silver: 9, bonusChance: 0.16, bonusItem: "health_potion" },
  wisp_archer: { lootIndex: 1, silver: 7, bonusChance: 0.18, bonusItem: "spirit_tonic" },
  mire_spitter: { primaryItemId: "bog_amber", silver: 8, bonusChance: 0.18, bonusItem: "spirit_tonic" },
  cinder_imp: { primaryItemId: "cinder_resin", silver: 9, bonusChance: 0.18, bonusItem: "health_potion" },
  frost_wisp: { primaryItemId: "stonebloom", silver: 10, bonusChance: 0.18, bonusItem: "spirit_tonic" },
  starbound_archer: { primaryItemId: "relic_shard", silver: 12, bonusChance: 0.22, bonusItem: "spirit_tonic" },
  thorn_weaver: { lootIndex: 3, silver: 9, bonusChance: 0.22, bonusItem: "ward_elixir" },
  root_stalker: { primaryItemId: "moonleaf", silver: 8, bonusChance: 0.18, bonusItem: "health_potion" },
  rot_weaver: { primaryItemId: "heartseed", silver: 11, bonusChance: 0.22, bonusItem: "ward_elixir" },
  mire_brute: { lootIndex: 2, silver: 11, bonusChance: 0.28, bonusItem: "health_potion" },
  bog_lurker: { primaryItemId: "bog_amber", silver: 10, bonusChance: 0.2, bonusItem: "spirit_tonic" },
  ash_brute: { primaryItemId: "relic_shard", silver: 13, bonusChance: 0.3, bonusItem: "greater_health_potion" },
  icebound_guardian: { primaryItemId: "relic_shard", silver: 14, bonusChance: 0.24, bonusItem: "spirit_tonic" },
  relic_sentinel: { primaryItemId: "relic_shard", silver: 15, bonusChance: 0.28, bonusItem: "ward_elixir" },
};

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

function rarityRank(rarity) {
  const index = ITEM_RARITY_ORDER.indexOf(rarity);
  return index >= 0 ? index : 0;
}

function normalizeInventory(rawInventory = {}) {
  const normalized = {};

  for (const [itemId, amount] of Object.entries(rawInventory)) {
    if (!getItemDef(itemId)) continue;
    const safeAmount = Math.max(0, Math.floor(amount || 0));
    if (safeAmount <= 0) continue;
    normalized[itemId] = safeAmount;
  }

  return normalized;
}

function normalizeFlags(rawFlags = {}) {
  const normalized = {};
  for (const [key, value] of Object.entries(rawFlags || {})) {
    normalized[key] = Boolean(value);
  }
  return normalized;
}

function normalizeActionSlots(rawActionSlots = []) {
  const slots = Array.from({ length: ACTION_SLOT_COUNT }, (_, index) => rawActionSlots[index] || null);
  return slots.map((itemId) => (itemId && getItemDef(itemId) ? itemId : null));
}

function normalizeBuyback(rawBuyback = []) {
  if (!Array.isArray(rawBuyback)) return [];

  return rawBuyback
    .map((entry) => ({
      itemId: entry?.itemId || null,
      amount: Math.max(1, Math.floor(entry?.amount || 1)),
      price: Math.max(1, Math.floor(entry?.price || 0)),
      soldAt: Number(entry?.soldAt || Date.now()),
    }))
    .filter((entry) => getItemDef(entry.itemId) && entry.price > 0)
    .slice(0, 18);
}

function normalizeFilterOptions(filterOrOptions = null) {
  if (!filterOrOptions) {
    return { filter: "all", sort: "name" };
  }

  if (typeof filterOrOptions === "string") {
    return { filter: filterOrOptions, sort: "name" };
  }

  return {
    filter: filterOrOptions.filter || "all",
    sort: filterOrOptions.sort || "name",
  };
}

function sortEntries(entries, sort) {
  const ranked = [...entries];
  ranked.sort((a, b) => {
    if (sort === "rarity") {
      const rarityDelta = rarityRank(b.rarity) - rarityRank(a.rarity);
      if (rarityDelta !== 0) return rarityDelta;
      const valueDelta = (b.value || 0) - (a.value || 0);
      if (valueDelta !== 0) return valueDelta;
      return a.name.localeCompare(b.name);
    }

    if (sort === "value") {
      const valueDelta = (b.value || 0) - (a.value || 0);
      if (valueDelta !== 0) return valueDelta;
      return a.name.localeCompare(b.name);
    }

    if (sort === "slot") {
      const slotDelta = String(a.slot || a.category || "").localeCompare(String(b.slot || b.category || ""));
      if (slotDelta !== 0) return slotDelta;
      return a.name.localeCompare(b.name);
    }

    if (sort === "recent") {
      return (b.soldAt || 0) - (a.soldAt || 0);
    }

    return a.name === b.name ? a.stackIndex - b.stackIndex : a.name.localeCompare(b.name);
  });
  return ranked;
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
    stash: {},
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
    buyback: [],
    questStates,
    questCounters: createQuestCounterDefaults(),
    conversationFlags: {},
    worldFlags: {},
    silver: 64,
    level: 1,
    xp: 0,
    nextLevelXp: getLevelTarget(1),
  };

  if (!snapshot) {
    return defaults;
  }

  const merged = deepClone(defaults);
  merged.inventory = normalizeInventory({ ...merged.inventory, ...(snapshot.inventory || {}) });
  merged.stash = normalizeInventory({ ...merged.stash, ...(snapshot.stash || {}) });
  merged.equipment = { ...merged.equipment, ...(snapshot.equipment || {}) };
  merged.actionSlots = normalizeActionSlots(snapshot.actionSlots || merged.actionSlots);
  merged.talentPoints = snapshot.talentPoints ?? merged.talentPoints;
  merged.talents = { ...merged.talents, ...(snapshot.talents || {}) };
  merged.journal = Array.isArray(snapshot.journal) ? [...snapshot.journal] : merged.journal;
  merged.buyback = normalizeBuyback(snapshot.buyback || merged.buyback);
  merged.questStates = { ...merged.questStates, ...(snapshot.questStates || {}) };
  merged.questCounters = { ...merged.questCounters, ...(snapshot.questCounters || {}) };
  merged.conversationFlags = {
    ...merged.conversationFlags,
    ...(snapshot.conversationFlags || {}),
  };
  merged.worldFlags = normalizeFlags({ ...merged.worldFlags, ...(snapshot.worldFlags || {}) });
  merged.silver = Math.max(0, Math.floor(snapshot.silver ?? merged.silver));
  merged.level = Math.max(1, snapshot.level || merged.level);
  merged.xp = Math.max(0, snapshot.xp || 0);
  merged.nextLevelXp = Math.max(getLevelTarget(merged.level), snapshot.nextLevelXp || 0);
  return merged;
}

export function addItem(progression, itemId, amount = 1) {
  if (!getItemDef(itemId) || amount <= 0) return;
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

export function getStashCount(progression, itemId) {
  return progression.stash[itemId] || 0;
}

export function getCurrency(progression) {
  return progression.silver || 0;
}

export function addCurrency(progression, amount) {
  progression.silver = Math.max(0, Math.floor((progression.silver || 0) + amount));
}

export function spendCurrency(progression, amount) {
  const cost = Math.max(0, Math.floor(amount || 0));
  if ((progression.silver || 0) < cost) return false;
  progression.silver -= cost;
  return true;
}

export function hasWorldFlag(progression, flag) {
  return Boolean(flag && progression.worldFlags?.[flag]);
}

export function setWorldFlag(progression, flag, value = true) {
  if (!flag) return;
  progression.worldFlags[flag] = Boolean(value);
}

export function awardRewards(progression, rewards) {
  if (!rewards) return { items: [], gainedXp: 0, levelsGained: 0 };

  const granted = [];
  let gainedXp = 0;
  let levelsGained = 0;
  let gainedSilver = 0;

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

    if (key === "silver") {
      addCurrency(progression, amount);
      gainedSilver += amount;
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

  return { items: granted, gainedXp, levelsGained, gainedSilver };
}

export function getInventoryEntries(progression, filterOrOptions = null) {
  const options = normalizeFilterOptions(filterOrOptions);
  const entries = Object.entries(progression.inventory)
    .filter(([, amount]) => amount > 0)
    .flatMap(([id, amount]) => {
      const item = getItemDef(id);
      return item ? createInventoryEntry(id, item, amount) : [];
    })
    .filter((entry) => {
      if (options.filter === "all") return true;
      if (options.filter === "usable") return Boolean(entry.usable || entry.category === "consumable");
      return entry.category === options.filter || entry.slot === options.filter || entry.rarity === options.filter;
    });

  return sortEntries(entries, options.sort);
}

export function getStashEntries(progression, filterOrOptions = null) {
  const options = normalizeFilterOptions(filterOrOptions);
  const entries = Object.entries(progression.stash)
    .filter(([, amount]) => amount > 0)
    .flatMap(([id, amount]) => {
      const item = getItemDef(id);
      return item ? createInventoryEntry(id, item, amount) : [];
    })
    .filter((entry) => {
      if (options.filter === "all") return true;
      if (options.filter === "usable") return Boolean(entry.usable || entry.category === "consumable");
      return entry.category === options.filter || entry.slot === options.filter || entry.rarity === options.filter;
    });

  return sortEntries(entries, options.sort);
}

export function isActionSlotAssignable(itemId) {
  return canQuickUseItem(getItemDef(itemId));
}

export function getActionSlotEntries(progression) {
  const slots = normalizeActionSlots(progression.actionSlots);
  progression.actionSlots = slots;

  return slots.map((itemId, index) => {
    const item = itemId ? getItemDef(itemId) : null;
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

  const item = getItemDef(itemId);
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

  const item = getItemDef(itemId);
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
      item: itemId ? getItemDef(itemId) : null,
    };
  });
}

export function equipItem(progression, itemId) {
  const item = getItemDef(itemId);
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
  const item = getItemDef(itemId);
  if (!item || item.category !== "consumable" || getItemCount(progression, itemId) <= 0) {
    return { used: false };
  }

  const heal = item.effect?.heal || 0;
  const spirit = item.effect?.spirit || 0;
  const healed = Math.min(heal, player.maxHp - player.hp);
  const restored = Math.min(spirit, player.maxSpirit - player.spirit);
  const canApplyBuff = Boolean(
    item.effect?.wardDuration || item.effect?.speedDuration || item.effect?.spiritRegenBonus
  );

  if (healed <= 0 && restored <= 0 && !canApplyBuff) {
    return { used: false };
  }

  removeItem(progression, itemId, 1);
  if (healed > 0) player.hp = Math.min(player.maxHp, player.hp + healed);
  if (restored > 0) player.spirit = Math.min(player.maxSpirit, player.spirit + restored);
  const buffApplied = (canApplyBuff && player.applyConsumableEffect?.(item.effect || {})) || false;

  return {
    used: true,
    item,
    healed,
    restored,
    buffApplied,
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
    pulseUnlocked: 0,
    pulseDamageBonus: 0,
    pulseRadiusBonus: 0,
    pulseCooldownBonus: 0,
    incomingDamageReductionBonus: 0,
    moveSpeedBonus: 0,
  };

  for (const talent of TALENT_DEFS) {
    if (!progression.talents[talent.id]) continue;
    for (const [key, value] of Object.entries(talent.apply)) {
      bonuses[key] = (bonuses[key] || 0) + value;
    }
  }

  for (const slot of EQUIPMENT_SLOTS) {
    const itemId = progression.equipment[slot];
    const item = itemId ? getItemDef(itemId) : null;
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

export function awardEnemyLoot(progression, enemyType, biomeId, source = {}) {
  const isBoss = source === true || Boolean(source?.isBoss);
  const lootTable = BIOMES[biomeId]?.lootTable || ["spirit_bloom"];
  const grants = [];
  let silver = 0;

  if (isBoss) {
    const bossRewards =
      biomeId === "ember"
        ? { emberwake_seal: 1, emberglass_relic: 1, greater_health_potion: 2, relic_shard: 2 }
        : biomeId === "frost"
          ? source?.id === "veil_seraph"
            ? { seraphim_lens: 1, starwell_relic: 1, starfire_tonic: 1, relic_shard: 2 }
            : { tundra_signet: 1, frostband_charm: 1, greater_spirit_tonic: 1, stonebloom: 2 }
          : biomeId === "ancient"
            ? source?.id === "rootbound_custodian"
              ? { custodian_spindle: 1, reliquary_loop: 1, greater_spirit_tonic: 1, ward_elixir: 1 }
              : source?.id === "starwoken_sentinel"
                ? { selkas_vigil: 1, heartwake_pendant: 1, groveguard_phial: 1, relic_shard: 2 }
                : { heartseed_pendant: 1, heartseed: 1, greater_health_potion: 2 }
            : biomeId === "blight"
              ? { hollowcourt_pendant: 1, heartseed: 1, rootwoven_talisman: 1, greater_health_potion: 1 }
              : { rowans_oath_brooch: 1, moonthread_amulet: 1, health_potion: 2, spirit_bloom: 2 };

    for (const [itemId, amount] of Object.entries(bossRewards)) {
      addItem(progression, itemId, amount);
      grants.push({ itemId, amount });
    }

    silver =
      source?.id === "veil_seraph"
        ? 154
        : biomeId === "ancient"
          ? 145
          : biomeId === "blight"
            ? 132
            : 108;
    addCurrency(progression, silver);
    return { items: grants, silver };
  }

  const rule = ENEMY_LOOT_RULES[enemyType] || ENEMY_LOOT_RULES.thornling;
  const primaryItemId =
    rule.primaryItemId ||
    lootTable[rule.lootIndex ?? 0] ||
    lootTable[0] ||
    "spirit_bloom";

  addItem(progression, primaryItemId, 1);
  grants.push({ itemId: primaryItemId, amount: 1 });
  silver = rule.silver || 5;

  if (rule.bonusItem && Math.random() < (rule.bonusChance || 0)) {
    addItem(progression, rule.bonusItem, 1);
    grants.push({ itemId: rule.bonusItem, amount: 1 });
  }

  addCurrency(progression, silver);
  return { items: grants, silver };
}

export function awardEliteBonusLoot(progression, biomeId, enemy = null) {
  const table = BIOME_ITEM_BASES[biomeId] || ["health_potion", "spirit_tonic"];
  const guaranteedSilver = 18;
  const roll = Math.random();
  let itemId;

  if (roll > 0.92) {
    const named = getBiomeNamedDrops(biomeId);
    itemId = named[Math.floor(Math.random() * named.length)] || table[0];
  } else if (roll > 0.38) {
    const baseId = table[Math.floor(Math.random() * table.length)];
    itemId = rollAffixItem(baseId, Math.random, { forceBoth: roll > 0.74 || Boolean(enemy?.elite) });
  } else {
    const consumables =
      biomeId === "ember" || biomeId === "blight"
        ? ["greater_health_potion", "ward_elixir", "rejuvenation_draught"]
        : biomeId === "frost"
          ? ["greater_spirit_tonic", "spirit_tonic", "clarity_phial"]
          : ["health_potion", "spirit_tonic", "windstep_phial"];
    itemId = consumables[Math.floor(Math.random() * consumables.length)];
  }

  addItem(progression, itemId, 1);
  addCurrency(progression, guaranteedSilver);
  return {
    items: [{ itemId, amount: 1 }],
    silver: guaranteedSilver,
  };
}

export function getXpProgress(progression) {
  return {
    level: progression.level,
    xp: progression.xp,
    nextLevelXp: progression.nextLevelXp,
    ratio: progression.nextLevelXp > 0 ? progression.xp / progression.nextLevelXp : 0,
  };
}

export function getItemValue(itemId) {
  return getItemDef(itemId)?.value || 0;
}

export function sellInventoryItem(progression, itemId, amount = 1) {
  const value = getItemValue(itemId);
  if (value <= 0 || !removeItem(progression, itemId, amount)) {
    return { sold: false, value: 0 };
  }

  const payout = Math.max(1, Math.floor(value * 0.55)) * amount;
  addCurrency(progression, payout);
  progression.buyback = normalizeBuyback([
    {
      itemId,
      amount,
      price: Math.max(1, Math.floor(value * 0.7)) * amount,
      soldAt: Date.now(),
    },
    ...(progression.buyback || []),
  ]);
  return { sold: true, value: payout };
}

export function getBuybackEntries(progression, sort = "recent") {
  const entries = normalizeBuyback(progression.buyback || []).map((entry, index) => {
    const item = getItemDef(entry.itemId);
    return {
      ...item,
      itemId: entry.itemId,
      amount: entry.amount,
      price: entry.price,
      soldAt: entry.soldAt,
      index,
    };
  });

  return sortEntries(entries, sort);
}

export function buyBackItem(progression, entryIndex) {
  const buyback = normalizeBuyback(progression.buyback || []);
  const entry = buyback[entryIndex];
  if (!entry) return { bought: false, reason: "That buyback item is gone." };
  if (!spendCurrency(progression, entry.price)) {
    return { bought: false, reason: "Not enough silver." };
  }

  addItem(progression, entry.itemId, entry.amount);
  progression.buyback = buyback.filter((_, index) => index !== entryIndex);
  return { bought: true, entry };
}

export function buyInventoryItem(progression, itemId, amount = 1, price = null) {
  const unitPrice = Math.max(0, Math.floor(price ?? getItemValue(itemId)));
  const total = unitPrice * amount;
  if (!getItemDef(itemId) || !spendCurrency(progression, total)) {
    return { bought: false, total: 0 };
  }

  addItem(progression, itemId, amount);
  return { bought: true, total };
}

export function stashInventoryItem(progression, itemId, amount = 1) {
  if (!removeItem(progression, itemId, amount)) {
    return false;
  }
  progression.stash[itemId] = (progression.stash[itemId] || 0) + amount;
  return true;
}

export function withdrawStashItem(progression, itemId, amount = 1) {
  if ((progression.stash[itemId] || 0) < amount) {
    return false;
  }
  progression.stash[itemId] -= amount;
  if (progression.stash[itemId] <= 0) {
    delete progression.stash[itemId];
  }
  addItem(progression, itemId, amount);
  return true;
}

export function resetTalents(progression) {
  const spent = Object.keys(progression.talents).length;
  progression.talents = {};
  progression.talentPoints += spent;
  return spent;
}

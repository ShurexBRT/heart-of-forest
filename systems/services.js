import { SERVICE_DEFS, getItemDef } from "../data/gameData.js";
import {
  buyBackItem,
  buyInventoryItem,
  getCurrency,
  getBuybackEntries,
  getInventoryEntries,
  getItemCount,
  getStashEntries,
  hasWorldFlag,
  removeItem,
  resetTalents,
  sellInventoryItem,
  stashInventoryItem,
  spendCurrency,
  withdrawStashItem,
} from "./progression.js";

function isQuestDone(progression, questId) {
  const status = progression.questStates?.[questId];
  return status === "done" || status === "complete";
}

export function getActiveService(state) {
  return state.ui.activeServiceId ? SERVICE_DEFS[state.ui.activeServiceId] || null : null;
}

export function openServiceUi(state, serviceId, sourceLabel = "") {
  const service = SERVICE_DEFS[serviceId];
  if (!service) return false;

  state.ui.menuOpen = true;
  state.ui.questLogOpen = false;
  state.ui.activeTab = "services";
  state.ui.activeServiceId = serviceId;
  state.ui.activeServiceLabel = sourceLabel || service.title;
  state.ui.selectedServiceIndex = 0;
  state.ui.serviceSubpanel = service.kind === "stash" ? "pack" : "stock";
  state.ui.selectedStashIndex = 0;
  return true;
}

export function clearActiveService(state) {
  state.ui.activeServiceId = null;
  state.ui.activeServiceLabel = "";
  state.ui.selectedServiceIndex = 0;
  state.ui.serviceSubpanel = "stock";
  state.ui.selectedStashIndex = 0;
}

export function getServiceEntries(state) {
  const service = getActiveService(state);
  if (!service) return [];

  if (service.kind === "shop") {
    if (state.ui.serviceSubpanel === "buyback") {
      return getBuybackEntries(state.progression, state.ui.shopSort || "recent")
        .filter((entry) => matchesItemFilter(entry, state.ui.shopFilter || "all"))
        .map((entry) => ({
          ...entry,
          mode: "buyback",
          affordable: getCurrency(state.progression) >= entry.price,
        }));
    }

    return service.stock
      .filter((entry) => {
        if (entry.requiresQuestDone && !isQuestDone(state.progression, entry.requiresQuestDone)) {
          return false;
        }
        if (entry.requiresFlag && !hasWorldFlag(state.progression, entry.requiresFlag)) {
          return false;
        }
        return true;
      })
      .map((entry) => ({
        ...entry,
        item: getItemDef(entry.itemId),
        mode: "stock",
        affordable: getCurrency(state.progression) >= entry.price,
      }))
      .filter((entry) => matchesItemFilter(entry.item, state.ui.shopFilter || "all"))
      .sort((a, b) => {
        const sort = state.ui.shopSort || "name";
        if (sort === "price") {
          return a.price - b.price || a.item.name.localeCompare(b.item.name);
        }
        if (sort === "rarity") {
          const rarityOrder = ["common", "uncommon", "rare", "epic", "legendary"];
          const rarityDelta = rarityOrder.indexOf(b.item.rarity) - rarityOrder.indexOf(a.item.rarity);
          if (rarityDelta !== 0) return rarityDelta;
          return a.item.name.localeCompare(b.item.name);
        }
        return a.item.name.localeCompare(b.item.name);
      });
  }

  if (service.kind === "altar") {
    return service.actions.map((entry) => ({
      ...entry,
      affordable: canAffordAction(state.progression, entry),
    }));
  }

  return [];
}

function canAffordAction(progression, action) {
  if ((action.costSilver || 0) > getCurrency(progression)) return false;
  for (const [itemId, amount] of Object.entries(action.costItems || {})) {
    if (getItemCount(progression, itemId) < amount) return false;
  }
  return true;
}

function matchesItemFilter(item, filter) {
  if (!item || filter === "all") return true;
  if (filter === "usable") return Boolean(item.usable || item.category === "consumable");
  return item.category === filter || item.slot === filter || item.rarity === filter;
}

export function performSelectedServiceAction(state) {
  const service = getActiveService(state);
  if (!service) return { success: false };

  if (service.kind === "shop") {
    const entry = getServiceEntries(state)[state.ui.selectedServiceIndex];
    if (!entry) return { success: false };
    if (entry.mode === "buyback") {
      const result = buyBackItem(state.progression, entry.index);
      if (!result.bought) {
        return { success: false, reason: result.reason || "Could not recover that item." };
      }
      return {
        success: true,
        text: `Recovered ${entry.name} for ${entry.price} silver`,
      };
    }
    const result = buyInventoryItem(state.progression, entry.itemId, 1, entry.price);
    if (!result.bought) {
      return { success: false, reason: "Not enough silver." };
    }
    return {
      success: true,
      text: `Purchased ${entry.item.name} for ${entry.price} silver`,
    };
  }

  if (service.kind === "altar") {
    const action = getServiceEntries(state)[state.ui.selectedServiceIndex];
    if (!action) return { success: false };
    if (!canAffordAction(state.progression, action)) {
      return { success: false, reason: "You lack the needed silver or relics." };
    }

    if (action.id === "restore") {
      if (state.player.hp >= state.player.maxHp && state.player.spirit >= state.player.maxSpirit) {
        return { success: false, reason: "Ayla is already fully restored." };
      }
      spendCurrency(state.progression, action.costSilver || 0);
      state.player.hp = state.player.maxHp;
      state.player.spirit = state.player.maxSpirit;
      return { success: true, text: "Ayla's vigor returns to full." };
    }

    if (action.id === "attune_shard") {
      spendCurrency(state.progression, action.costSilver || 0);
      for (const [itemId, amount] of Object.entries(action.costItems || {})) {
        removeItem(state.progression, itemId, amount);
      }
      state.progression.talentPoints += 1;
      return { success: true, text: "The waystone grants 1 Talent Point." };
    }

    if (action.id === "respec") {
      const refunded = Object.keys(state.progression.talents).length;
      if (refunded <= 0) {
        return { success: false, reason: "No talents have been committed yet." };
      }
      spendCurrency(state.progression, action.costSilver || 0);
      resetTalents(state.progression);
      return { success: true, text: `Talents refocused. ${refunded} point(s) refunded.` };
    }
  }

  return { success: false };
}

export function sellSelectedInventoryEntry(state, entry) {
  const service = getActiveService(state);
  if (!service || service.kind !== "shop" || !entry) {
    return { success: false };
  }

  const result = sellInventoryItem(state.progression, entry.id, 1);
  if (!result.sold) {
    return { success: false, reason: "That item cannot be sold here." };
  }

  return {
    success: true,
    text: `Sold ${entry.name} for ${result.value} silver`,
  };
}

export function getStashUiEntries(state) {
  return {
    pack: getInventoryEntries(state.progression, {
      filter: state.ui.inventoryFilter || "all",
      sort: state.ui.inventorySort || "name",
    }),
    stash: getStashEntries(state.progression, {
      filter: state.ui.inventoryFilter || "all",
      sort: state.ui.inventorySort || "name",
    }),
  };
}

export function transferSelectedStashEntry(state) {
  const service = getActiveService(state);
  if (!service || service.kind !== "stash") {
    return { success: false };
  }

  const lists = getStashUiEntries(state);
  if (state.ui.serviceSubpanel === "pack") {
    const entry = lists.pack[state.ui.selectedServiceIndex];
    if (!entry) return { success: false };
    const moved = stashInventoryItem(state.progression, entry.id, 1);
    if (!moved) return { success: false };
    return { success: true, text: `${entry.name} stored in the stash` };
  }

  const entry = lists.stash[state.ui.selectedStashIndex];
  if (!entry) return { success: false };
  const moved = withdrawStashItem(state.progression, entry.id, 1);
  if (!moved) return { success: false };
  return { success: true, text: `${entry.name} withdrawn from the stash` };
}

export function getSellHintVisible(state) {
  const service = getActiveService(state);
  return Boolean(service && service.kind === "shop");
}

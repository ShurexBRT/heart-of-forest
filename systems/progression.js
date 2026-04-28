import { ITEM_DEFS, TALENT_DEFS } from "../data/gameData.js";
import { QUEST_DEFS } from "../data/storyData.js";

export function createProgression() {
  const questStates = Object.fromEntries(
    Object.values(QUEST_DEFS).map((quest) => [quest.id, quest.startState || "inactive"])
  );

  return {
    inventory: {
      spirit_bloom: 3,
      moonleaf: 1,
    },
    talentPoints: 1,
    talents: {},
    journal: [],
    questStates,
    questCounters: {
      spiritFlowers: 0,
      thornlingsDefeated: 0,
      rootsCleansed: 0,
      totemsActivated: 0,
      scoutFound: 0,
      elderHollowDefeated: 0,
    },
    conversationFlags: {},
  };
}

export function addItem(progression, itemId, amount) {
  progression.inventory[itemId] = (progression.inventory[itemId] || 0) + amount;
}

export function awardRewards(progression, rewards) {
  if (!rewards) return;

  for (const [key, amount] of Object.entries(rewards)) {
    if (key === "talentPoints") {
      progression.talentPoints += amount;
    } else {
      addItem(progression, key, amount);
    }
  }
}

export function getInventoryEntries(progression) {
  return Object.entries(progression.inventory)
    .filter(([, amount]) => amount > 0)
    .map(([id, amount]) => ({
      ...ITEM_DEFS[id],
      amount,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
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
    maxHpBonus: 0,
    maxSpiritBonus: 0,
    spiritRegenBonus: 0,
    staffDamageBonus: 0,
    staffSpiritBonus: 0,
    boltDamageBonus: 0,
    boltRangeBonus: 0,
    dashCooldownBonus: 0,
    rootDurationBonus: 0,
    bloomBonus: 0,
  };

  for (const talent of TALENT_DEFS) {
    if (!progression.talents[talent.id]) continue;

    for (const [key, value] of Object.entries(talent.apply)) {
      bonuses[key] = (bonuses[key] || 0) + value;
    }
  }

  return bonuses;
}

export function getQuestCounter(progression, key) {
  return progression.questCounters[key] || 0;
}

export function incrementQuestCounter(progression, key, amount = 1) {
  progression.questCounters[key] = (progression.questCounters[key] || 0) + amount;
}

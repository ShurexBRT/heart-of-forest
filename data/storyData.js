export const QUEST_DEFS = {
  whispering_call: {
    id: "whispering_call",
    title: "Whispering Call",
    description: "Gather Spirit Flowers near the village and drive back the Thornlings stalking the trail.",
    giverId: "elder_rowan",
    sceneId: "whispering_woods",
    startState: "available",
    rewards: { spirit_bloom: 3, moonleaf: 1 },
    objectives: [
      { key: "spiritFlowers", label: "Spirit Flowers gathered", required: 3 },
      { key: "thornlingsDefeated", label: "Thornlings defeated", required: 3 },
    ],
  },
  bogbound_rot: {
    id: "bogbound_rot",
    title: "Bogbound Rot",
    description: "Nettle marked tainted roots in the marsh. Cleanse them before the mire swallows the road.",
    giverId: "nettle",
    sceneId: "mossroot_marsh",
    startState: "available",
    rewards: { bog_amber: 2, spirit_bloom: 1, talentPoints: 1 },
    objectives: [{ key: "rootsCleansed", label: "Corrupted roots cleansed", required: 2 }],
  },
  ember_totems: {
    id: "ember_totems",
    title: "Totems in the Ash",
    description: "The grove is burning from within. Reactivate the warding totems and reopen the mountain pass.",
    autoActivateSceneId: "emberpine_grove",
    prerequisiteId: "whispering_call",
    rewards: { cinder_resin: 2, relic_shard: 1 },
    objectives: [{ key: "totemsActivated", label: "Totems rekindled", required: 3 }],
  },
  lost_scout: {
    id: "lost_scout",
    title: "Frostbound Signal",
    description: "A missing scout vanished in the tundra. Find their camp and recover the message they carried.",
    autoActivateSceneId: "frostveil_tundra",
    prerequisiteId: "ember_totems",
    rewards: { stonebloom: 2, moonleaf: 1 },
    objectives: [{ key: "scoutFound", label: "Lost scout located", required: 1 }],
  },
  elder_hollow: {
    id: "elder_hollow",
    title: "The Hollowheart",
    description: "Push into the ruins, survive the corrupted court, and break Elder Hollow before the forest falls silent.",
    autoActivateSceneId: "hollowheart_ruins",
    prerequisiteId: "lost_scout",
    rewards: { heartseed: 1, relic_shard: 2, talentPoints: 2 },
    objectives: [{ key: "elderHollowDefeated", label: "Elder Hollow defeated", required: 1 }],
  },
};

export const NPC_DEFS = {
  elder_rowan: {
    id: "elder_rowan",
    name: "Elder Rowan",
    role: "Main Quest",
    palette: { hood: "#efe9dd", cloak: "#6e9d63", accent: "#d6bb73" },
    dialogue: {
      intro: [
        "Ayla, the whispering roots are restless.",
        "Gather the Spirit Flowers before the blight reaches the cottages, then drive the Thornlings back from the road.",
      ],
      progress: [
        "The woods still tremble. Finish the flowers and keep the Thornlings off our threshold.",
      ],
      complete: [
        "Good. The grove can breathe again.",
        "Follow the warm trail east when you are ready. Something older is waking beyond the marsh.",
      ],
      after: ["The forest remembers what you restored here. Keep moving."],
    },
  },
  lysa: {
    id: "lysa",
    name: "Lysa",
    role: "Combat Guide",
    palette: { hood: "#f3efe4", cloak: "#4f86b7", accent: "#91e2ff" },
    dialogue: {
      default: [
        "Stay light on your feet. Dash through the heavy swings.",
        "Root the ones that crowd you, then crack them with the staff before loosing a Spirit Bolt.",
      ],
    },
  },
  nettle: {
    id: "nettle",
    name: "Nettle",
    role: "Side Quest",
    palette: { hood: "#ede2d7", cloak: "#8f6e45", accent: "#d6c39b" },
    dialogue: {
      intro: [
        "If you head into Mossroot Marsh, keep an eye out for the swollen black roots.",
        "Burn the rot out of two of them and I will make it worth your trouble.",
      ],
      progress: [
        "The marsh roots are still choking the water. Two of them need cleansing.",
      ],
      complete: [
        "There it is. Cleaner water and less rot in the air.",
        "Take these supplies before the damp steals them too.",
      ],
      after: ["Marsh work never truly ends, but you bought us time."],
    },
  },
};

export const QUEST_DEFS = {
  whispering_call: {
    id: "whispering_call",
    title: "Whispering Call",
    description: "Gather Spirit Flowers near the village and drive back the Thornlings stalking the trail.",
    giverId: "elder_rowan",
    sceneId: "whispering_woods",
    startState: "available",
    completeFlags: ["village_patrols_returned"],
    rewards: { items: { spirit_bloom: 2, health_potion: 2, windstep_phial: 1 }, silver: 52, xp: 84 },
    objectives: [
      { key: "spiritFlowers", label: "Spirit Flowers gathered", required: 3 },
      { key: "thornlingsDefeated", label: "Thornlings defeated", required: 3 },
    ],
  },
  apothecarys_route: {
    id: "apothecarys_route",
    title: "Apothecary's Route",
    description: "Tamsin needs fresh herbs and safer roads before she can restock the village tonic shelf.",
    giverId: "tamsin",
    sceneId: "whispering_woods",
    startState: "available",
    completeFlags: ["apothecary_resupplied", "marsh_route_lit"],
    rewards: { items: { spirit_tonic: 2, moonthread_amulet: 1, groveguard_phial: 1 }, silver: 52, xp: 78 },
    objectives: [
      { key: "moonleafBundles", label: "Moonleaf bundles gathered", required: 2 },
      { key: "marshLanternsLit", label: "Marsh lanterns relit", required: 2 },
    ],
  },
  bogbound_rot: {
    id: "bogbound_rot",
    title: "Bogbound Rot",
    description: "Nettle marked tainted roots in the marsh. Cleanse them before the mire swallows the road.",
    giverId: "nettle",
    sceneId: "mossroot_marsh",
    startState: "inactive",
    completeFlags: ["marsh_rot_purged"],
    rewards: { items: { bog_amber: 2, health_potion: 1, rootwoven_talisman: 1 }, silver: 62, xp: 95 },
    objectives: [{ key: "rootsCleansed", label: "Corrupted roots cleansed", required: 2 }],
  },
  tidebound_threshold: {
    id: "tidebound_threshold",
    title: "Tidebound Threshold",
    description: "Nettle found two tide seals tied to the drowned chapel beyond the marsh. Recover them and pry the chapel door back open.",
    giverId: "nettle",
    sceneId: "mossroot_marsh",
    prerequisiteId: "bogbound_rot",
    startState: "inactive",
    completeFlags: ["chapel_of_tides_open"],
    rewards: { items: { ward_elixir: 1, clarity_phial: 1, chapelglass_relic: 1 }, silver: 82, xp: 112 },
    objectives: [{ key: "tideSealsRecovered", label: "Tide seals recovered", required: 2 }],
  },
  ruins_of_memory: {
    id: "ruins_of_memory",
    title: "Ruins of Memory",
    description: "Orras is listening for old voices in the ruins. Bring back relic caches before the blight strips them bare.",
    giverId: "orras",
    sceneId: "mossy_ruins",
    prerequisiteId: "whispering_call",
    startState: "inactive",
    completeFlags: ["ruins_listening_post"],
    rewards: { items: { relic_shard: 2, spirit_tonic: 1 }, silver: 74, talentPoints: 1, xp: 100 },
    objectives: [{ key: "relicCachesRecovered", label: "Relic caches recovered", required: 2 }],
  },
  sealed_reliquary: {
    id: "sealed_reliquary",
    title: "The Sealed Reliquary",
    description: "Orras believes two old waystone seals can open the buried vault beneath the ruins. Recover them and wake the forgotten road.",
    giverId: "orras",
    sceneId: "mossy_ruins",
    prerequisiteId: "ruins_of_memory",
    startState: "inactive",
    completeFlags: ["sunken_reliquary_open"],
    rewards: {
      items: { relic_shard: 1, warden_loop: 1, health_potion: 1 },
      silver: 88,
      xp: 118,
    },
    objectives: [
      { key: "waystoneSealsRecovered", label: "Waystone seals recovered", required: 2 },
    ],
  },
  depths_of_memory: {
    id: "depths_of_memory",
    title: "Depths of Memory",
    description: "Enter the Sunken Reliquary, relight the ward braziers, and break the thing nesting in its heart.",
    autoActivateSceneId: "sunken_reliquary",
    prerequisiteId: "sealed_reliquary",
    completeFlags: ["sunken_reliquary_cleansed"],
    rewards: {
      items: { reliquary_loop: 1, greater_health_potion: 1, ward_elixir: 1 },
      silver: 156,
      talentPoints: 1,
      xp: 180,
    },
    objectives: [
      { key: "reliquaryBraziersLit", label: "Ward braziers relit", required: 2 },
      { key: "reliquaryKeeperDefeated", label: "Rootbound Custodian defeated", required: 1 },
    ],
  },
  chapel_of_tides: {
    id: "chapel_of_tides",
    title: "Chapel of Tides",
    description: "Step into the drowned chapel, rekindle its braziers, and break the matron nesting in the flooded crypt.",
    autoActivateSceneId: "chapel_of_tides",
    prerequisiteId: "tidebound_threshold",
    completeFlags: ["chapel_of_tides_cleansed"],
    rewards: {
      items: { marshwarden_idol: 1, rejuvenation_draught: 1, greater_spirit_tonic: 1 },
      silver: 164,
      talentPoints: 1,
      xp: 190,
    },
    objectives: [
      { key: "tideBraziersLit", label: "Chapel braziers relit", required: 2 },
      { key: "bogMatronDefeated", label: "Bog Matron defeated", required: 1 },
    ],
  },
  ember_totems: {
    id: "ember_totems",
    title: "Totems in the Ash",
    description: "The grove is burning from within. Reactivate the warding totems and reopen the mountain pass.",
    giverId: "garrick",
    sceneId: "emberpine_grove",
    prerequisiteId: "ruins_of_memory",
    startState: "inactive",
    completeFlags: ["ember_pass_reopened"],
    rewards: { items: { cinder_resin: 2, emberglass_relic: 1, greater_health_potion: 1 }, silver: 92, xp: 120 },
    objectives: [{ key: "totemsActivated", label: "Totems rekindled", required: 3 }],
  },
  lost_scout: {
    id: "lost_scout",
    title: "Frostbound Signal",
    description: "A missing scout vanished in the tundra. Find their camp and recover the message they carried.",
    giverId: "vesper",
    sceneId: "frostveil_tundra",
    prerequisiteId: "ember_totems",
    startState: "inactive",
    completeFlags: ["ridge_signal_recovered"],
    rewards: { items: { stonebloom: 2, frostband_charm: 1, spirit_tonic: 1 }, silver: 98, xp: 128 },
    objectives: [{ key: "scoutFound", label: "Lost scout located", required: 1 }],
  },
  blight_watch: {
    id: "blight_watch",
    title: "Blight Watch",
    description: "Break the blight effigies and cut down the wisps feeding the rot before it swallows the old court.",
    giverId: "bram",
    sceneId: "blighted_woods",
    prerequisiteId: "lost_scout",
    startState: "inactive",
    completeFlags: ["court_approach_secured"],
    rewards: { items: { greater_health_potion: 2, heartseed: 1 }, silver: 120, xp: 150 },
    objectives: [
      { key: "blightEffigiesBroken", label: "Blight effigies shattered", required: 2 },
      { key: "wispsDefeated", label: "Wisps driven off", required: 4 },
    ],
  },
  elder_hollow: {
    id: "elder_hollow",
    title: "The Hollowheart",
    description: "Push into the ruins, survive the corrupted court, and break Elder Hollow before the forest falls silent.",
    autoActivateSceneId: "hollowheart_ruins",
    prerequisiteId: "blight_watch",
    completeFlags: ["elder_hollow_broken"],
    rewards: { items: { heartseed_pendant: 1, relic_shard: 2, greater_health_potion: 2 }, silver: 180, talentPoints: 2, xp: 220 },
    objectives: [{ key: "elderHollowDefeated", label: "Elder Hollow defeated", required: 1 }],
  },
  pilgrims_lantern: {
    id: "pilgrims_lantern",
    title: "Pilgrim's Lantern",
    description: "Selka can feel an old sanctum answer beneath the Ancient Heart. Gather Heart Blooms and restore the star seals to wake the hidden path.",
    giverId: "selka",
    sceneId: "ancient_heart",
    prerequisiteId: "elder_hollow",
    startState: "inactive",
    completeFlags: ["starfall_sanctum_open"],
    rewards: { items: { groveguard_phial: 1, starfire_tonic: 1, relic_shard: 1 }, silver: 136, talentPoints: 1, xp: 168 },
    objectives: [
      { key: "heartBloomsGathered", label: "Heart Blooms gathered", required: 2 },
      { key: "starSealsRecovered", label: "Star seals restored", required: 2 },
    ],
  },
  starfall_sanctum: {
    id: "starfall_sanctum",
    title: "Starfall Sanctum",
    description: "Step into the hidden sanctum, relight its braziers, and break the sentinel guarding the pilgrim spire.",
    autoActivateSceneId: "starfall_sanctum",
    prerequisiteId: "pilgrims_lantern",
    completeFlags: ["starfall_sanctum_cleansed"],
    rewards: {
      items: { starwell_relic: 1, greater_spirit_tonic: 1, relic_shard: 1 },
      silver: 198,
      talentPoints: 1,
      xp: 220,
    },
    objectives: [
      { key: "starBraziersLit", label: "Sanctum braziers relit", required: 2 },
      { key: "starwokenSentinelDefeated", label: "Starwoken Sentinel defeated", required: 1 },
    ],
  },
};

export const NPC_DEFS = {
  elder_rowan: {
    id: "elder_rowan",
    name: "Elder Rowan",
    role: "Main Quest",
    serviceId: "waystone_altar",
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
        "Tamsin and the others can move again now that the first trail is clear.",
        "Take this windstep phial and catch your breath before you press deeper.",
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
        "Take this talisman. It was wasted hanging by my stove.",
      ],
      after: ["Marsh work never truly ends, but you bought us time."],
    },
  },
  halen: {
    id: "halen",
    name: "Halen",
    role: "Road Warden",
    palette: { hood: "#eee9de", cloak: "#6d8359", accent: "#e7cf87" },
    dialogue: {
      default: [
        "Rowan sent us back onto the road after your first sweep.",
        "The patrol fires are lit again. We'll hold the village while you keep pushing outward.",
      ],
    },
  },
  tamsin: {
    id: "tamsin",
    name: "Tamsin",
    role: "Apothecary",
    serviceId: "apothecary",
    palette: { hood: "#f4ebde", cloak: "#8a5d8b", accent: "#f0b87b" },
    dialogue: {
      intro: [
        "The tonic shelf is down to dust and stubborn hope.",
        "Bring me moonleaf bundles and relight the marsh lanterns so the gatherers can walk again.",
      ],
      progress: [
        "Moonleaf and safe lanterns, Ayla. I can brew the rest once the path is open.",
      ],
      complete: [
        "Perfect. This is enough to stock the satchels and prime the spirit flasks.",
        "Take the amulet and a groveguard phial. Both will hold you steadier when the road bites back.",
      ],
      after: ["If the herbs keep flowing, I can keep the village standing."],
    },
  },
  orras: {
    id: "orras",
    name: "Orras",
    role: "Relic Keeper",
    palette: { hood: "#e7e0d3", cloak: "#657f57", accent: "#ece39e" },
    dialogue: {
      intro: [
        "The ruins still whisper when the rain is quiet.",
        "Find the relic caches before the blight settles deeper into the stone.",
      ],
      progress: [
        "Two caches should be enough to prove the old halls still remember us.",
      ],
      complete: [
        "You can hear it, can't you? The place is quieter now.",
        "Keep that shard-work close. It will matter in the fireward grove ahead.",
      ],
      after: ["Ancient stone rarely forgets. It only waits."],
    },
  },
  garrick: {
    id: "garrick",
    name: "Garrick",
    role: "Warden Captain",
    palette: { hood: "#ece2d6", cloak: "#994f34", accent: "#ffbb7d" },
    dialogue: {
      intro: [
        "Three warding totems are dark, and the grove is answering with ash.",
        "Wake them and we'll have a road through the ember line again.",
      ],
      progress: [
        "The totems hold the pass together. Three, Ayla. No fewer.",
      ],
      complete: [
        "There. The air's still hot, but it isn't hungry anymore.",
        "Vesper's scouts were last seen beyond the frozen ridge.",
      ],
      after: ["Keep the fire behind you. The cold won't be kinder."],
    },
  },
  vesper: {
    id: "vesper",
    name: "Vesper",
    role: "Scout Captain",
    palette: { hood: "#e8edf3", cloak: "#5178aa", accent: "#d7f4ff" },
    dialogue: {
      intro: [
        "One of ours never checked in from the ridge camp.",
        "Find the satchel and I can chart the safe route into the old court.",
      ],
      progress: [
        "The ridge is quiet in the wrong way. Find the scout before the trail disappears.",
      ],
      complete: [
        "So they made it as far as the stones.",
        "Take the frostband charm. You'll want the extra pace in the blight line.",
      ],
      after: ["The message was worth the cost. We'll honor it by finishing the route."],
    },
  },
  bram: {
    id: "bram",
    name: "Bram",
    role: "Border Ranger",
    palette: { hood: "#ece2d7", cloak: "#7b5842", accent: "#bf876d" },
    dialogue: {
      intro: [
        "Effigies are feeding the woods and the wisps are guarding them.",
        "Break two effigies and thin the wisps before you march on the Hollow.",
      ],
      progress: [
        "Two effigies. Four wisps. Then the road to the court is worth walking.",
      ],
      complete: [
        "That's the first clean breath I've had out here in days.",
        "Take these draughts. Elder Hollow won't pull punches.",
      ],
      after: ["You broke the screen. Now go for the thing casting the shadow."],
    },
  },
  selka: {
    id: "selka",
    name: "Selka",
    role: "Heart Pilgrim",
    palette: { hood: "#efe7dd", cloak: "#7e67a6", accent: "#f0dd92" },
    dialogue: {
      intro: [
        "The Heart still keeps one hidden lantern for those willing to listen.",
        "Bring me the two Heart Blooms and wake the star seals. The sanctum beneath this place should answer.",
      ],
      progress: [
        "The blooms carry the song, but the path will stay shuttered until both star seals answer with them.",
      ],
      complete: [
        "There, you can hear it now. The sanctum door has remembered its name.",
        "Go gently, Ayla. The sentinel below was built to judge the unready.",
      ],
      after: [
        "The hidden chamber is awake now.",
        "If the lantern below still burns when you return, the Heart may remember your name for a long while.",
      ],
    },
  },
  mara: {
    id: "mara",
    name: "Mara",
    role: "Lantern Tender",
    palette: { hood: "#ede6da", cloak: "#4a7d74", accent: "#8de0c8" },
    dialogue: {
      default: [
        "The lantern line only stays bright because you keep giving us breathing room.",
        "If the marsh goes quiet again, I'll know you've cleared another road ahead.",
      ],
    },
  },
};

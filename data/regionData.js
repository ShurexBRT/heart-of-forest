export const DAMAGE_TYPES = {
  physical: { id: "physical", name: "Physical", color: "#d9d0bf" },
  thorn: { id: "thorn", name: "Thorn", color: "#9cdb76" },
  mire: { id: "mire", name: "Mire", color: "#7ed2d1" },
  fire: { id: "fire", name: "Fire", color: "#f39a61" },
  frost: { id: "frost", name: "Frost", color: "#b9e4ff" },
  corruption: { id: "corruption", name: "Corruption", color: "#c790e7" },
  astral: { id: "astral", name: "Astral", color: "#d7ceff" },
};

export const REGION_STATUS = {
  infested: {
    id: "infested",
    label: "Infested",
    color: "#cf7464",
    description: "Corruption still controls every road in this region.",
  },
  unstable: {
    id: "unstable",
    label: "Unstable",
    color: "#e0b46f",
    description: "Ayla has opened the region, but its guardian still holds the heart.",
  },
  secured: {
    id: "secured",
    label: "Secured",
    color: "#8ccda1",
    description: "The guardian is defeated and local services can return.",
  },
  restored: {
    id: "restored",
    label: "Restored",
    color: "#bfe48b",
    description: "The region and its people have visibly recovered.",
  },
};

export const REGION_DEFS = {
  heartwood: {
    id: "heartwood",
    name: "Heartwood",
    hubSceneId: "ayla_homestead",
    sceneIds: ["ayla_homestead", "whispering_woods", "mossy_ruins"],
    optionalSceneIds: ["sunken_reliquary"],
    bossSceneId: "mossy_ruins",
    bossId: "rootwarden",
    damageType: "thorn",
    counterRecipeId: "barkskin_draught",
    restoredFlag: "heartwood_restored",
  },
  stillwater: {
    id: "stillwater",
    name: "Stillwater",
    hubSceneId: "mossroot_marsh",
    sceneIds: ["mossroot_marsh", "chapel_of_tides"],
    bossSceneId: "chapel_of_tides",
    bossId: "bog_matron",
    damageType: "mire",
    counterRecipeId: "antitoxin_bloom",
    restoredFlag: "stillwater_restored",
  },
  ember: {
    id: "ember",
    name: "Ember",
    hubSceneId: "emberpine_grove",
    sceneIds: ["emberpine_grove"],
    bossSceneId: "emberpine_grove",
    bossId: "cinder_warden",
    damageType: "fire",
    counterRecipeId: null,
    restoredFlag: "ember_restored",
  },
  frost: {
    id: "frost",
    name: "Frost",
    hubSceneId: "frostveil_tundra",
    sceneIds: ["frostveil_tundra"],
    bossSceneId: "frostveil_tundra",
    bossId: "veil_seraph",
    damageType: "frost",
    counterRecipeId: null,
    restoredFlag: "frost_restored",
  },
  scarroot: {
    id: "scarroot",
    name: "Scarroot",
    hubSceneId: "blighted_woods",
    sceneIds: ["blighted_woods", "hollowheart_ruins"],
    bossSceneId: "hollowheart_ruins",
    bossId: "elder_hollow",
    damageType: "corruption",
    counterRecipeId: null,
    restoredFlag: "scarroot_restored",
  },
  rootlight: {
    id: "rootlight",
    name: "Rootlight",
    hubSceneId: "ancient_heart",
    sceneIds: ["ancient_heart", "starfall_sanctum"],
    bossSceneId: "starfall_sanctum",
    bossId: "starwoken_sentinel",
    damageType: "astral",
    counterRecipeId: null,
    restoredFlag: "rootlight_restored",
  },
};

export const SCENE_REGION_IDS = Object.fromEntries(
  Object.values(REGION_DEFS).flatMap((region) => [
    ...region.sceneIds.map((sceneId) => [sceneId, region.id]),
    ...(region.optionalSceneIds || []).map((sceneId) => [sceneId, region.id]),
  ])
);

export function normalizeDamageType(type) {
  const aliases = {
    ember: "fire",
    blight: "corruption",
    ancient: "astral",
    wisp: "thorn",
  };
  const normalized = aliases[type] || type || "physical";
  return DAMAGE_TYPES[normalized] ? normalized : "physical";
}

export function getRegionForScene(sceneId) {
  return REGION_DEFS[SCENE_REGION_IDS[sceneId]] || null;
}

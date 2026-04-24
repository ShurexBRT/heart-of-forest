import { BIOMES, POI_TYPES, REGION_NAME_PARTS } from "../data/gameData.js";
import { createRng, pickFrom, randomIntFrom, randomRangeFrom, shuffleFrom } from "../systems/rng.js";

const REGION_LAYOUT = [
  [160, 160],
  [360, 130],
  [590, 180],
  [800, 130],
  [1010, 180],
  [220, 360],
  [470, 330],
  [740, 360],
  [980, 340],
  [320, 570],
  [620, 560],
  [930, 560],
];

export function createWorld(seed) {
  const rng = createRng(seed);
  const regions = REGION_LAYOUT.map(([baseX, baseY], index) => {
    const x = baseX + randomRangeFrom(rng, -30, 30);
    const y = baseY + randomRangeFrom(rng, -26, 26);
    const moisture = rng();
    const height = rng();
    const omen = rng();

    return {
      id: `region-${index}`,
      index,
      x,
      y,
      moisture,
      height,
      omen,
      biomeId: "forest",
      tier: 1,
      corruption: 0,
      neighbors: [],
      poiIds: [],
      discovered: index === 0,
      visited: index === 0,
    };
  });

  connectRegions(regions);
  const depths = computeDepths(regions, regions[0].id);
  const farthestRegionId = [...depths.entries()].sort((a, b) => b[1] - a[1])[0][0];

  for (const region of regions) {
    const distance = depths.get(region.id) || 0;
    region.tier = Math.min(4, distance + 1);
    region.corruption = Math.min(1, 0.08 + distance * 0.18 + randomRangeFrom(rng, -0.06, 0.08));
    region.biomeId = pickBiome(region, distance);
    region.name = makeRegionName(rng, region.biomeId);
  }

  regions[0].biomeId = "forest";
  regions[0].name = "Cedar Hollow";

  const world = {
    seed,
    regions: Object.fromEntries(regions.map((region) => [region.id, region])),
    regionOrder: regions.map((region) => region.id),
    currentRegionId: regions[0].id,
    selectedRegionId: regions[0].id,
    selectedPoiId: null,
    poiOrder: [],
    pois: {},
    stationPoiIds: [],
    quests: [],
    finalRegionId: farthestRegionId,
  };

  populatePois(world, rng);
  discoverRegion(world, regions[0].id);
  const startStation = world.stationPoiIds[0];
  world.selectedPoiId = startStation;

  return world;
}

export function restoreWorld(snapshot) {
  return snapshot;
}

export function discoverRegion(world, regionId) {
  const region = world.regions[regionId];
  if (!region) return;

  region.discovered = true;
  region.visited = true;

  for (const neighborId of region.neighbors) {
    world.regions[neighborId].discovered = true;
  }
}

export function travelToRegion(world, regionId) {
  world.currentRegionId = regionId;
  world.selectedRegionId = regionId;
  discoverRegion(world, regionId);
  const region = world.regions[regionId];
  world.selectedPoiId = region.poiIds[0] || null;
}

export function distanceBetweenRegions(world, startId, endId) {
  if (startId === endId) return 0;
  const visited = new Set([startId]);
  const queue = [{ id: startId, depth: 0 }];

  while (queue.length > 0) {
    const current = queue.shift();
    const region = world.regions[current.id];

    for (const neighborId of region.neighbors) {
      if (visited.has(neighborId)) continue;
      if (neighborId === endId) return current.depth + 1;
      visited.add(neighborId);
      queue.push({ id: neighborId, depth: current.depth + 1 });
    }
  }

  return 99;
}

export function getCurrentRegion(world) {
  return world.regions[world.currentRegionId];
}

export function getSelectedRegion(world) {
  return world.regions[world.selectedRegionId];
}

export function getSelectedPoi(world) {
  return world.selectedPoiId ? world.pois[world.selectedPoiId] : null;
}

export function isRegionReachable(world, regionId) {
  if (regionId === world.currentRegionId) return true;
  return world.regions[world.currentRegionId].neighbors.includes(regionId);
}

export function selectRegion(world, regionId) {
  world.selectedRegionId = regionId;
  const region = world.regions[regionId];
  world.selectedPoiId = region.poiIds[0] || null;
}

export function selectPoi(world, poiId) {
  world.selectedPoiId = poiId;
  world.selectedRegionId = world.pois[poiId].regionId;
}

export function createEncounterContext(world, poiId) {
  const poi = world.pois[poiId];
  const region = world.regions[poi.regionId];
  const threat = poi.threat + (poi.typeId === "lair" ? 2 : 0);

  return {
    poiId,
    poiName: poi.name,
    poiTypeId: poi.typeId,
    biomeId: region.biomeId,
    regionName: region.name,
    threatTier: threat,
    seed: `${world.seed}:${poiId}`,
    bossEnabled: poi.typeId === "lair",
    waveTemplates: buildWaveTemplates(poi.typeId, threat),
    completionText: poi.typeId === "lair" ? "Heart Restored" : `${poi.name} Cleansed`,
  };
}

export function markPoiCleared(world, poiId) {
  const poi = world.pois[poiId];
  poi.cleared = true;
}

export function buildPoiRewards(world, poiId) {
  const poi = world.pois[poiId];
  const region = world.regions[poi.regionId];
  const rng = createRng(`${world.seed}:loot:${poiId}`);
  const biomeLoot = [...BIOMES[region.biomeId].lootTable];
  const rewards = {};

  const primaryItemId = pickFrom(rng, biomeLoot);
  const bonusItemId = pickFrom(rng, biomeLoot);

  rewards[primaryItemId] = randomIntFrom(rng, 1, 2) + Math.max(0, poi.threat - 1);
  rewards[bonusItemId] = (rewards[bonusItemId] || 0) + 1;

  if (poi.typeId === "ruin") rewards.relic_shard = (rewards.relic_shard || 0) + 1;
  if (poi.typeId === "grove") rewards.spirit_bloom = (rewards.spirit_bloom || 0) + 2;
  if (poi.typeId === "lair") {
    rewards.heartseed = (rewards.heartseed || 0) + 1;
    rewards.talentPoints = 2;
  }

  return rewards;
}

function populatePois(world, rng) {
  const finalRegionId = world.finalRegionId;

  for (const regionId of world.regionOrder) {
    const region = world.regions[regionId];
    const regionPois = [];

    if (region.index === 0) {
      regionPois.push(addPoi(world, region.id, "station", "Dawnroot Waystation", region.tier));
      regionPois.push(addPoi(world, region.id, "shrine", "Whisper Shrine", region.tier));
      continue;
    }

    if (region.id === finalRegionId) {
      regionPois.push(addPoi(world, region.id, "lair", "Heart of Ruin", region.tier + 1));
    } else {
      const hasStation = region.tier >= 2 && region.neighbors.length >= 2 && rng() > 0.56;
      if (hasStation) {
        regionPois.push(addPoi(world, region.id, "station", `${region.name} Post`, region.tier));
      }

      const typePool = region.biomeId === "marsh"
        ? ["nest", "ruin", "shrine"]
        : region.biomeId === "highlands"
          ? ["ruin", "grove", "nest"]
          : region.biomeId === "blight"
            ? ["nest", "shrine", "ruin"]
            : ["nest", "grove", "ruin"];
      const combatCount = region.tier >= 3 ? 2 : 1;

      for (let i = 0; i < combatCount; i += 1) {
        const typeId = pickFrom(rng, typePool);
        regionPois.push(addPoi(world, region.id, typeId, makePoiName(region.name, typeId, i), region.tier));
      }
    }

    region.poiIds = regionPois;
  }

  // Guarantee at least two stations for progression
  if (world.stationPoiIds.length < 2) {
    const fallbackRegion = world.regions[world.regionOrder[6]];
    const poiId = addPoi(world, fallbackRegion.id, "station", `${fallbackRegion.name} Lodge`, fallbackRegion.tier);
    fallbackRegion.poiIds.unshift(poiId);
  }
}

function addPoi(world, regionId, typeId, name, threat) {
  const id = `poi-${world.poiOrder.length}`;
  const poi = {
    id,
    regionId,
    typeId,
    name,
    threat,
    combat: POI_TYPES[typeId].combat,
    cleared: false,
  };

  world.pois[id] = poi;
  world.poiOrder.push(id);
  world.regions[regionId].poiIds.push(id);

  if (typeId === "station") {
    world.stationPoiIds.push(id);
  }

  return id;
}

function pickBiome(region, distance) {
  if (distance >= 3 && region.corruption > 0.66) return "blight";
  if (region.moisture > 0.64 && region.height < 0.55) return "marsh";
  if (region.height > 0.6) return "highlands";
  return "forest";
}

function makeRegionName(rng, biomeId) {
  const prefix = pickFrom(rng, REGION_NAME_PARTS[biomeId]);
  const suffix = pickFrom(rng, REGION_NAME_PARTS.suffixes);
  return `${prefix} ${suffix}`;
}

function makePoiName(regionName, typeId, index) {
  const suffixes = {
    nest: ["Nest", "Warren", "Den"],
    ruin: ["Vault", "Archive", "Sanctum"],
    shrine: ["Shrine", "Circle", "Altar"],
    grove: ["Grove", "Canopy", "Thicket"],
  };

  const suffix = suffixes[typeId][index % suffixes[typeId].length];
  const base = regionName.split(" ")[0];
  return `${base} ${suffix}`;
}

function connectRegions(regions) {
  for (let i = 0; i < regions.length; i += 1) {
    const region = regions[i];
    const nearest = [...regions]
      .filter((candidate) => candidate.id !== region.id)
      .map((candidate) => ({
        id: candidate.id,
        distance: Math.hypot(candidate.x - region.x, candidate.y - region.y),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map((entry) => entry.id);

    region.neighbors = [...new Set([...region.neighbors, ...nearest])];
  }

  for (const region of regions) {
    for (const neighborId of region.neighbors) {
      const neighbor = regions.find((entry) => entry.id === neighborId);
      if (!neighbor.neighbors.includes(region.id)) {
        neighbor.neighbors.push(region.id);
      }
    }
  }
}

function computeDepths(regions, startId) {
  const depths = new Map([[startId, 0]]);
  const queue = [startId];

  while (queue.length > 0) {
    const regionId = queue.shift();
    const region = regions.find((entry) => entry.id === regionId);
    const depth = depths.get(regionId);

    for (const neighborId of region.neighbors) {
      if (depths.has(neighborId)) continue;
      depths.set(neighborId, depth + 1);
      queue.push(neighborId);
    }
  }

  return depths;
}

function buildWaveTemplates(typeId, threat) {
  const scale = Math.max(1, threat);

  if (typeId === "lair") {
    return [
      [["basic", "basic", "brute"], ["basic", "basic", "basic", "brute"]],
      [["basic", "brute", "basic", "brute"], ["basic", "basic", "brute", "brute"]],
      [["basic", "brute", "brute", "basic"], ["basic", "basic", "brute", "brute", "basic"]],
    ];
  }

  if (typeId === "ruin") {
    return scale >= 3
      ? [
          [["basic", "brute", "basic"]],
          [["basic", "brute", "brute"]],
        ]
      : [
          [["basic", "basic", "brute"]],
        ];
  }

  if (typeId === "grove") {
    return scale >= 3
      ? [
          [["basic", "basic", "basic"]],
          [["basic", "basic", "brute", "basic"]],
        ]
      : [
          [["basic", "basic"]],
          [["basic", "basic", "basic"]],
        ];
  }

  if (typeId === "shrine") {
    return [
      [["basic", "basic", "brute"]],
      [["basic", "basic", "basic"]],
    ];
  }

  return scale >= 3
    ? [
        [["basic", "basic", "basic"]],
        [["basic", "basic", "brute"]],
      ]
    : [
        [["basic", "basic"]],
        [["basic", "basic", "basic"]],
      ];
}

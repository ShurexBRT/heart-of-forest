export function hashString(value) {
  let hash = 1779033703 ^ value.length;

  for (let i = 0; i < value.length; i += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }

  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    hash ^= hash >>> 16;
    return hash >>> 0;
  };
}

export function createRng(seed) {
  const seedFactory = hashString(String(seed));
  let a = seedFactory();

  return function rng() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomRangeFrom(rng, min, max) {
  return min + rng() * (max - min);
}

export function randomIntFrom(rng, min, maxInclusive) {
  return Math.floor(randomRangeFrom(rng, min, maxInclusive + 1));
}

export function pickFrom(rng, items) {
  return items[Math.floor(rng() * items.length)];
}

export function shuffleFrom(rng, items) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

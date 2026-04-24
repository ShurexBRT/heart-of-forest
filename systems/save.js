const SAVE_KEY = "heart-of-forest-save";

export function saveSnapshot(snapshot) {
  if (typeof localStorage === "undefined") return false;

  localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
  return true;
}

export function loadSnapshot() {
  if (typeof localStorage === "undefined") return null;

  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSnapshot() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(SAVE_KEY);
}

import { loadSettings } from "./systems/save.js";

const root = document.documentElement;
const bootStatus = document.getElementById("boot-status");
const fatalPanel = document.getElementById("fatal-error");
const fatalMessage = document.getElementById("fatal-error-message");

function applyShellSettings() {
  const settings = loadSettings();
  root.dataset.motion = settings.reducedMotion ? "reduced" : "full";
  root.dataset.contrast = settings.highContrast ? "high" : "normal";
  root.style.setProperty("--ui-scale", String(settings.uiScale || 1));
}

function showFatalError(error) {
  console.error("[Heart of Forest] Fatal boot error", error);
  if (bootStatus) bootStatus.hidden = true;
  if (fatalMessage) {
    fatalMessage.textContent =
      error?.message || "The forest could not be restored. Reload the game to try again.";
  }
  if (fatalPanel) fatalPanel.hidden = false;
}

window.addEventListener("error", (event) => {
  if (event.error) showFatalError(event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  showFatalError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
});

applyShellSettings();

try {
  await import("./main.js");
  requestAnimationFrame(() => {
    document.body.classList.add("game-ready");
    if (bootStatus) bootStatus.hidden = true;
    document.getElementById("game")?.focus?.({ preventScroll: true });
  });
} catch (error) {
  showFatalError(error);
}

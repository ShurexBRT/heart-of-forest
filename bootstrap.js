import {
  getActiveSaveSlot,
  getSaveSlotSummaries,
  loadSave,
  loadSettings,
  saveSettings,
  setActiveSaveSlot,
} from "./systems/save.js";
import { createRuntimeFeedbackMonitor } from "./systems/runtimeFeedback.js";
import { createShellPresentation } from "./systems/shellPresentation.js";
import { syncFrontendSaveState } from "./ui/startScreen.js";
import { GAME_MODES } from "./core/gameMode.js";
import { SCENES } from "./data/sceneNetwork.js";

const root = document.documentElement;
const bootStatus = document.getElementById("boot-status");
const fatalPanel = document.getElementById("fatal-error");
const fatalMessage = document.getElementById("fatal-error-message");
const shellTools = document.getElementById("shell-tools");
const saveSlotToggle = document.getElementById("save-slot-toggle");
const accessibilityToggle = document.getElementById("accessibility-toggle");
const saveSlotPanel = document.getElementById("save-slot-panel");
const saveSlotList = document.getElementById("save-slot-list");
const accessibilityPanel = document.getElementById("accessibility-panel");
const reducedMotionInput = document.getElementById("setting-reduced-motion");
const highContrastInput = document.getElementById("setting-high-contrast");
const damageNumbersInput = document.getElementById("setting-damage-numbers");
const tutorialHintsInput = document.getElementById("setting-tutorial-hints");
const controllerVibrationInput = document.getElementById("setting-controller-vibration");
const aimSensitivityInput = document.getElementById("setting-aim-sensitivity");
const aimSensitivityValue = document.getElementById("setting-aim-sensitivity-value");
const SCREEN_SHAKE_STASH_KEY = "heart-of-forest-reduced-motion-shake";

let shellSyncTimer = 0;
let mainLoaded = false;
let feedbackMonitor = null;
let presentation = null;

function getGameState() {
  return window.__heartOfForestDebug?.getState?.() || null;
}

function applyShellSettings(settings = loadSettings()) {
  root.dataset.motion = settings.reducedMotion ? "reduced" : "full";
  root.dataset.contrast = settings.highContrast ? "high" : "normal";
  root.style.setProperty("--ui-scale", String(settings.uiScale || 1));
}

function persistRuntimeSettings(patch) {
  const state = getGameState();
  const current = state?.settings || loadSettings();
  saveSettings({ ...current, ...patch });
  const normalized = loadSettings();
  if (state) {
    state.settings = normalized;
  }
  applyShellSettings(normalized);
  window.dispatchEvent(
    new CustomEvent("hof-settings-change", { detail: { settings: normalized } })
  );
  syncAccessibilityControls(normalized);
  presentation?.sync(state);
  return normalized;
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

function isShellPanelOpen() {
  return Boolean(
    (saveSlotPanel && !saveSlotPanel.hidden) ||
      (accessibilityPanel && !accessibilityPanel.hidden)
  );
}

function setShellPanelOpen(panel) {
  if (saveSlotPanel) saveSlotPanel.hidden = panel !== saveSlotPanel;
  if (accessibilityPanel) accessibilityPanel.hidden = panel !== accessibilityPanel;
  document.body.dataset.shellPanelOpen = panel ? "true" : "false";

  if (!panel) {
    document.getElementById("game")?.focus?.({ preventScroll: true });
  } else {
    panel.querySelector("button, input")?.focus?.({ preventScroll: true });
  }
  presentation?.sync(getGameState());
}

function closeShellPanels() {
  setShellPanelOpen(null);
}

function formatSaveSlotSummary(summary) {
  if (summary.empty) return "Empty — ready for a new adventure";
  const sceneTitle = SCENES[summary.sceneId]?.title || summary.sceneId || "Unknown Road";
  return `Level ${summary.level} · Day ${summary.day} · ${sceneTitle}`;
}

function renderSaveSlots() {
  if (!saveSlotList || !saveSlotToggle) return;
  const activeSlot = getActiveSaveSlot();
  const summaries = getSaveSlotSummaries();
  saveSlotToggle.textContent = `Save Slot ${activeSlot}`;
  saveSlotList.replaceChildren();

  for (const summary of summaries) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "save-slot-card";
    button.dataset.active = summary.slot === activeSlot ? "true" : "false";
    button.innerHTML = `
      <span class="save-slot-number">Slot ${summary.slot}</span>
      <strong>${summary.empty ? "New Adventure" : "Continue Adventure"}</strong>
      <small>${formatSaveSlotSummary(summary)}</small>
    `;
    button.addEventListener("click", () => {
      setActiveSaveSlot(summary.slot);
      const state = getGameState();
      if (state?.frontend) {
        syncFrontendSaveState(state.frontend, loadSave(summary.slot));
      }
      renderSaveSlots();
      closeShellPanels();
    });
    saveSlotList.append(button);
  }
}

function syncAccessibilityControls(settings = loadSettings()) {
  if (reducedMotionInput) reducedMotionInput.checked = Boolean(settings.reducedMotion);
  if (highContrastInput) highContrastInput.checked = Boolean(settings.highContrast);
  if (damageNumbersInput) damageNumbersInput.checked = settings.damageNumbers !== false;
  if (tutorialHintsInput) tutorialHintsInput.checked = settings.showTutorialHints !== false;
  if (controllerVibrationInput) {
    controllerVibrationInput.checked = settings.controllerVibration !== false;
  }
  if (aimSensitivityInput) {
    aimSensitivityInput.value = String(settings.aimSensitivity || 1);
  }
  if (aimSensitivityValue) {
    aimSensitivityValue.value = `${Number(settings.aimSensitivity || 1).toFixed(2)}×`;
    aimSensitivityValue.textContent = aimSensitivityValue.value;
  }
}

function setupShellControls() {
  renderSaveSlots();
  syncAccessibilityControls();

  saveSlotToggle?.addEventListener("click", () => {
    renderSaveSlots();
    setShellPanelOpen(saveSlotPanel);
  });

  accessibilityToggle?.addEventListener("click", () => {
    syncAccessibilityControls();
    setShellPanelOpen(accessibilityPanel);
  });

  document.querySelectorAll("[data-close-shell-panel]").forEach((button) => {
    button.addEventListener("click", closeShellPanels);
  });

  reducedMotionInput?.addEventListener("change", () => {
    const state = getGameState();
    const currentShake = state?.settings?.screenShake ?? loadSettings().screenShake;
    if (reducedMotionInput.checked) {
      localStorage.setItem(SCREEN_SHAKE_STASH_KEY, String(currentShake));
      persistRuntimeSettings({ reducedMotion: true, screenShake: 0 });
    } else {
      const stored = Number(localStorage.getItem(SCREEN_SHAKE_STASH_KEY));
      persistRuntimeSettings({
        reducedMotion: false,
        screenShake: Number.isFinite(stored)
          ? Math.max(0, Math.min(1, stored))
          : 0.65,
      });
      localStorage.removeItem(SCREEN_SHAKE_STASH_KEY);
    }
  });

  highContrastInput?.addEventListener("change", () => {
    persistRuntimeSettings({ highContrast: highContrastInput.checked });
  });

  damageNumbersInput?.addEventListener("change", () => {
    persistRuntimeSettings({ damageNumbers: damageNumbersInput.checked });
  });

  tutorialHintsInput?.addEventListener("change", () => {
    if (tutorialHintsInput.checked && root.dataset.inputDevice === "gamepad") {
      presentation?.showControllerGuide(7000);
    }
    persistRuntimeSettings({ showTutorialHints: tutorialHintsInput.checked });
  });

  controllerVibrationInput?.addEventListener("change", () => {
    persistRuntimeSettings({ controllerVibration: controllerVibrationInput.checked });
  });

  aimSensitivityInput?.addEventListener("input", () => {
    const value = Number(aimSensitivityInput.value || 1);
    if (aimSensitivityValue) {
      aimSensitivityValue.value = `${value.toFixed(2)}×`;
      aimSensitivityValue.textContent = aimSensitivityValue.value;
    }
  });

  aimSensitivityInput?.addEventListener("change", () => {
    persistRuntimeSettings({
      aimSensitivity: Number(aimSensitivityInput.value || 1),
    });
  });

  window.addEventListener(
    "keydown",
    (event) => {
      if (!isShellPanelOpen()) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeShellPanels();
      }
    },
    true
  );

  syncShellVisibility();
}

function syncShellVisibility() {
  window.clearTimeout(shellSyncTimer);
  const state = getGameState();
  if (!mainLoaded || !state || !shellTools) return;

  const frontendVisible = [
    GAME_MODES.START_MENU,
    GAME_MODES.OPTIONS,
    GAME_MODES.PAUSED,
    GAME_MODES.GAME_OVER,
  ].includes(state.mode);

  shellTools.hidden = !frontendVisible;
  if (saveSlotToggle) {
    saveSlotToggle.hidden = state.mode !== GAME_MODES.START_MENU;
  }

  if (!frontendVisible && isShellPanelOpen()) {
    closeShellPanels();
  }

  presentation?.sync(state);
  shellSyncTimer = window.setTimeout(syncShellVisibility, 90);
}

window.addEventListener("hof-input-device", (event) => {
  presentation?.showInputDevice(event.detail?.device || "keyboard");
});

window.addEventListener("error", (event) => {
  if (event.error) showFatalError(event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  showFatalError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
});

window.addEventListener("beforeunload", () => {
  feedbackMonitor?.stop?.();
  presentation?.stop?.();
});

applyShellSettings();

try {
  await import("./main.js");
  mainLoaded = true;
  setupShellControls();
  feedbackMonitor = createRuntimeFeedbackMonitor({
    getState: getGameState,
    getSettings: () => getGameState()?.settings || loadSettings(),
    getInputDevice: () => root.dataset.inputDevice || "keyboard",
  });
  presentation = createShellPresentation({
    getState: getGameState,
    getSettings: () => getGameState()?.settings || loadSettings(),
    getInputDevice: () => root.dataset.inputDevice || "keyboard",
    isShellPanelOpen,
    pulseHaptic: (type, options) => feedbackMonitor?.pulse?.(type, options),
  });
  presentation.sync(getGameState());
  requestAnimationFrame(() => {
    document.body.classList.add("game-ready");
    if (bootStatus) bootStatus.hidden = true;
    document.getElementById("game")?.focus?.({ preventScroll: true });
  });
} catch (error) {
  showFatalError(error);
}

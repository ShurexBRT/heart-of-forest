const FRONTEND_MODES = new Set([
  "START_MENU",
  "OPTIONS",
  "PAUSED",
  "GAME_OVER",
]);

const BUTTON = {
  A: 0,
  B: 1,
  LB: 4,
  VIEW: 8,
  START: 9,
  UP: 12,
  DOWN: 13,
  LEFT: 14,
  RIGHT: 15,
};

export function createShellGamepadNavigation({
  getState,
  getOpenPanel,
  openSaveSlots,
  openAccessibility,
  closePanels,
} = {}) {
  let previousButtons = new Set();
  let frameId = 0;
  let stopped = false;

  function getPad() {
    if (typeof navigator === "undefined" || !navigator.getGamepads) return null;
    return Array.from(navigator.getGamepads() || []).find(
      (candidate) => candidate?.connected
    ) || null;
  }

  function currentButtons(pad) {
    const result = new Set();
    pad?.buttons?.forEach((button, index) => {
      if (button?.pressed || button?.value > 0.55) result.add(index);
    });
    return result;
  }

  function focusables(panel) {
    if (!panel) return [];
    return Array.from(
      panel.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => !element.hidden && element.offsetParent !== null);
  }

  function moveFocus(panel, delta) {
    const entries = focusables(panel);
    if (!entries.length) return;
    const current = entries.indexOf(document.activeElement);
    const start = current >= 0 ? current : delta > 0 ? -1 : 0;
    const next = (start + delta + entries.length) % entries.length;
    entries[next]?.focus?.({ preventScroll: true });
  }

  function activateFocused(panel) {
    const entries = focusables(panel);
    const active = entries.includes(document.activeElement)
      ? document.activeElement
      : entries[0];
    if (!active) return;
    active.focus?.({ preventScroll: true });

    if (active instanceof HTMLInputElement) {
      if (active.type === "checkbox") {
        active.click();
        return;
      }
      if (active.type === "range") {
        return;
      }
    }

    active.click?.();
  }

  function adjustFocusedRange(panel, direction) {
    const entries = focusables(panel);
    const active = entries.includes(document.activeElement)
      ? document.activeElement
      : null;
    if (!(active instanceof HTMLInputElement) || active.type !== "range") return false;

    const step = Number(active.step || 1) || 1;
    const min = Number(active.min || 0);
    const max = Number(active.max || 100);
    const current = Number(active.value || min);
    const next = Math.max(min, Math.min(max, current + step * direction));
    if (next === current) return true;

    active.value = String(Number(next.toFixed(4)));
    active.dispatchEvent(new Event("input", { bubbles: true }));
    active.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function tick() {
    if (stopped) return;
    const pad = getPad();
    const nextButtons = currentButtons(pad);
    const pressed = (index) => nextButtons.has(index) && !previousButtons.has(index);
    const state = getState?.();
    const panel = getOpenPanel?.() || null;

    if (pad && state) {
      if (panel) {
        if (pressed(BUTTON.B) || pressed(BUTTON.START)) {
          closePanels?.();
        } else if (pressed(BUTTON.UP)) {
          moveFocus(panel, -1);
        } else if (pressed(BUTTON.DOWN)) {
          moveFocus(panel, 1);
        } else if (pressed(BUTTON.LEFT)) {
          if (!adjustFocusedRange(panel, -1)) moveFocus(panel, -1);
        } else if (pressed(BUTTON.RIGHT)) {
          if (!adjustFocusedRange(panel, 1)) moveFocus(panel, 1);
        } else if (pressed(BUTTON.A)) {
          activateFocused(panel);
        }
      } else if (FRONTEND_MODES.has(state.mode)) {
        if (state.mode === "START_MENU" && pressed(BUTTON.VIEW)) {
          openSaveSlots?.();
        } else if (pressed(BUTTON.LB)) {
          openAccessibility?.();
        }
      }
    }

    previousButtons = nextButtons;
    if (typeof requestAnimationFrame === "function") {
      frameId = requestAnimationFrame(tick);
    }
  }

  if (typeof requestAnimationFrame === "function") {
    frameId = requestAnimationFrame(tick);
  }

  return {
    stop() {
      stopped = true;
      if (frameId && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(frameId);
      }
    },
  };
}

function getDefaultOpenPanel() {
  if (typeof document === "undefined") return null;
  const savePanel = document.getElementById("save-slot-panel");
  if (savePanel && !savePanel.hidden) return savePanel;
  const accessibilityPanel = document.getElementById("accessibility-panel");
  if (accessibilityPanel && !accessibilityPanel.hidden) return accessibilityPanel;
  return null;
}

function openDefaultPanel(toggleId, panelId) {
  if (typeof document === "undefined") return;
  const toggle = document.getElementById(toggleId);
  const panel = document.getElementById(panelId);
  if (!panel) return;

  toggle?.click?.();
  if (panel.hidden) {
    const otherId = panelId === "save-slot-panel" ? "accessibility-panel" : "save-slot-panel";
    const other = document.getElementById(otherId);
    if (other) other.hidden = true;
    panel.hidden = false;
    document.body.dataset.shellPanelOpen = "true";
    panel.querySelector("button, input")?.focus?.({ preventScroll: true });
  }
}

function closeDefaultPanels() {
  if (typeof document === "undefined") return;
  for (const id of ["save-slot-panel", "accessibility-panel"]) {
    const panel = document.getElementById(id);
    if (panel) panel.hidden = true;
  }
  document.body.dataset.shellPanelOpen = "false";
  document.getElementById("game")?.focus?.({ preventScroll: true });
}

if (
  typeof window !== "undefined" &&
  typeof document !== "undefined" &&
  !window.__heartOfForestShellGamepad
) {
  window.__heartOfForestShellGamepad = createShellGamepadNavigation({
    getState: () => window.__heartOfForestDebug?.getState?.() || null,
    getOpenPanel: getDefaultOpenPanel,
    openSaveSlots: () => openDefaultPanel("save-slot-toggle", "save-slot-panel"),
    openAccessibility: () =>
      openDefaultPanel("accessibility-toggle", "accessibility-panel"),
    closePanels: closeDefaultPanels,
  });
}

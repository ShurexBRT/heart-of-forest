import { GAME_MODES } from "../core/gameMode.js";

const TITLE_ACTIONS = ["new-game", "continue", "options"];
const OPTIONS_ACTIONS = ["music-volume", "sfx-volume", "fullscreen", "reset-save", "back"];

export function createFrontendState() {
  return {
    menuSelection: 0,
    optionsSelection: 0,
    canContinue: false,
    lastSavedAt: 0,
  };
}

export function syncFrontendSaveState(frontend, save) {
  frontend.canContinue = Boolean(save);
  frontend.lastSavedAt = save?.savedAt || 0;

  if (!frontend.canContinue && TITLE_ACTIONS[frontend.menuSelection] === "continue") {
    frontend.menuSelection = 0;
  }
}

export function renderFrontendScreen(ctx, state) {
  const layout = getFrontendLayout(state.viewport);

  drawBackdropScrim(ctx, state.viewport);
  drawMenuFrame(ctx, layout.panelX, layout.panelY, layout.panelW, layout.panelH);

  if (state.mode === GAME_MODES.START_MENU) {
    drawStartMenu(ctx, state, layout);
    return;
  }

  drawOptionsMenu(ctx, state, layout);
}

export function getFrontendHoverTarget(state, mouseX, mouseY) {
  const layout = getFrontendLayout(state.viewport);
  const entries = getFrontendEntries(state);

  for (const entry of entries) {
    if (pointInRect(mouseX, mouseY, entry.bounds)) {
      return entry;
    }
  }

  return null;
}

export function moveFrontendSelection(state, delta) {
  if (state.mode === GAME_MODES.START_MENU) {
    const nextIndex = state.frontend.menuSelection + delta;
    state.frontend.menuSelection = wrapIndex(nextIndex, TITLE_ACTIONS.length);
    if (!state.frontend.canContinue && TITLE_ACTIONS[state.frontend.menuSelection] === "continue") {
      state.frontend.menuSelection = wrapIndex(state.frontend.menuSelection + delta, TITLE_ACTIONS.length);
    }
    return;
  }

  state.frontend.optionsSelection = wrapIndex(
    state.frontend.optionsSelection + delta,
    OPTIONS_ACTIONS.length
  );
}

export function getSelectedFrontendAction(state) {
  if (state.mode === GAME_MODES.START_MENU) {
    return TITLE_ACTIONS[state.frontend.menuSelection];
  }

  return OPTIONS_ACTIONS[state.frontend.optionsSelection];
}

export function getFrontendEntries(state) {
  const layout = getFrontendLayout(state.viewport);
  return state.mode === GAME_MODES.START_MENU
    ? getStartMenuEntries(state, layout)
    : getOptionsEntries(state, layout);
}

export function getFrontendLayout(viewport) {
  const panelW = Math.min(620, viewport.width - 120);
  const panelH = Math.min(520, viewport.height - 120);
  const panelX = viewport.width / 2 - panelW / 2;
  const panelY = viewport.height / 2 - panelH / 2;

  return {
    panelX,
    panelY,
    panelW,
    panelH,
  };
}

function getStartMenuEntries(state, layout) {
  const buttonW = Math.min(290, layout.panelW - 110);
  const buttonH = 52;
  const startX = layout.panelX + 54;
  const startY = layout.panelY + 210;
  const gap = 18;
  const selectedAction = TITLE_ACTIONS[state.frontend.menuSelection];

  return TITLE_ACTIONS.map((action, index) => ({
    action,
    label: formatActionLabel(action),
    selected: action === selectedAction,
    disabled: action === "continue" && !state.frontend.canContinue,
    bounds: {
      x: startX,
      y: startY + index * (buttonH + gap),
      w: buttonW,
      h: buttonH,
    },
  }));
}

function getOptionsEntries(state, layout) {
  const rowX = layout.panelX + 54;
  const rowY = layout.panelY + 178;
  const rowW = layout.panelW - 108;
  const rowH = 58;
  const gap = 16;
  const selectedAction = OPTIONS_ACTIONS[state.frontend.optionsSelection];

  return OPTIONS_ACTIONS.map((action, index) => ({
    action,
    label: formatActionLabel(action),
    selected: action === selectedAction,
    value: getActionValue(state, action),
    bounds: {
      x: rowX,
      y: rowY + index * (rowH + gap),
      w: rowW,
      h: rowH,
    },
  }));
}

function drawStartMenu(ctx, state, layout) {
  ctx.fillStyle = "#f4ead3";
  ctx.font = "700 48px Georgia, serif";
  ctx.fillText("Heart of Forest", layout.panelX + 54, layout.panelY + 90);
  ctx.fillStyle = "#c8d4bd";
  ctx.font = "16px Segoe UI, Arial";
  ctx.fillText("Ayla waits where the old roots remember.", layout.panelX + 56, layout.panelY + 122);
  ctx.fillStyle = "#90a086";
  ctx.font = "13px Segoe UI, Arial";
  ctx.fillText("Arrow Keys / Mouse to choose, Enter to begin", layout.panelX + 56, layout.panelY + 148);

  for (const entry of getStartMenuEntries(state, layout)) {
    drawButton(ctx, entry.bounds, entry.label, {
      selected: entry.selected,
      disabled: entry.disabled,
      accent: entry.action === "new-game" ? "#8fcf7c" : "#8ab3d8",
    });
  }

  if (state.frontend.canContinue && state.frontend.lastSavedAt) {
    ctx.fillStyle = "#e2d8b4";
    ctx.font = "12px Segoe UI, Arial";
    ctx.fillText(
      `Last save: ${new Date(state.frontend.lastSavedAt).toLocaleString()}`,
      layout.panelX + 56,
      layout.panelY + layout.panelH - 34
    );
  } else {
    ctx.fillStyle = "#8d9993";
    ctx.font = "12px Segoe UI, Arial";
    ctx.fillText("No valid save found. Start a new journey.", layout.panelX + 56, layout.panelY + layout.panelH - 34);
  }
}

function drawOptionsMenu(ctx, state, layout) {
  ctx.fillStyle = "#f4ead3";
  ctx.font = "700 38px Georgia, serif";
  ctx.fillText("Options", layout.panelX + 54, layout.panelY + 86);
  ctx.fillStyle = "#c8d4bd";
  ctx.font = "15px Segoe UI, Arial";
  ctx.fillText("Shape the grove around you before the road opens.", layout.panelX + 56, layout.panelY + 114);
  ctx.fillStyle = "#90a086";
  ctx.font = "13px Segoe UI, Arial";
  ctx.fillText("Left / Right adjusts values, Enter confirms, Esc goes back", layout.panelX + 56, layout.panelY + 140);

  for (const entry of getOptionsEntries(state, layout)) {
    drawOptionRow(ctx, entry, state.settings);
  }
}

function drawBackdropScrim(ctx, viewport) {
  ctx.fillStyle = "rgba(4, 10, 12, 0.68)";
  ctx.fillRect(0, 0, viewport.width, viewport.height);
}

function drawMenuFrame(ctx, x, y, w, h) {
  ctx.fillStyle = "rgba(5, 8, 11, 0.88)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#0f1419";
  ctx.fillRect(x + 5, y + 5, w - 10, h - 10);
  ctx.strokeStyle = "#d7c28b";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  ctx.strokeStyle = "#334238";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 12, y + 12, w - 24, h - 24);
}

function drawButton(ctx, bounds, label, options) {
  ctx.fillStyle = options.disabled ? "rgba(18, 23, 28, 0.86)" : "rgba(12, 18, 24, 0.92)";
  ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  ctx.fillStyle = options.selected ? "rgba(55, 74, 58, 0.82)" : "#111820";
  ctx.fillRect(bounds.x + 3, bounds.y + 3, bounds.w - 6, bounds.h - 6);
  ctx.strokeStyle = options.selected ? options.accent : "#53606a";
  ctx.lineWidth = options.selected ? 2.5 : 1.5;
  ctx.strokeRect(bounds.x + 3, bounds.y + 3, bounds.w - 6, bounds.h - 6);

  ctx.fillStyle = options.disabled ? "#6b757b" : "#f7ead0";
  ctx.font = "700 21px Segoe UI, Arial";
  ctx.fillText(label, bounds.x + 18, bounds.y + 33);

  if (options.disabled) {
    ctx.fillStyle = "#7c878d";
    ctx.font = "12px Segoe UI, Arial";
    ctx.fillText("Save required", bounds.x + bounds.w - 98, bounds.y + 32);
  }
}

function drawOptionRow(ctx, entry, settings) {
  const { bounds } = entry;
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  ctx.fillStyle = entry.selected ? "#243341" : "#111820";
  ctx.fillRect(bounds.x + 3, bounds.y + 3, bounds.w - 6, bounds.h - 6);
  ctx.strokeStyle = entry.selected ? "#8fcf7c" : "#4d5964";
  ctx.lineWidth = entry.selected ? 2 : 1;
  ctx.strokeRect(bounds.x + 3, bounds.y + 3, bounds.w - 6, bounds.h - 6);

  ctx.fillStyle = "#f4ead3";
  ctx.font = "700 18px Segoe UI, Arial";
  ctx.fillText(entry.label, bounds.x + 18, bounds.y + 24);

  if (entry.action === "music-volume" || entry.action === "sfx-volume") {
    const value = entry.action === "music-volume" ? settings.musicVolume : settings.sfxVolume;
    drawSlider(ctx, bounds.x + 18, bounds.y + 34, bounds.w - 150, value, entry.selected);
    ctx.textAlign = "right";
    ctx.fillStyle = "#dbe7d3";
    ctx.font = "14px Segoe UI, Arial";
    ctx.fillText(`${Math.round(value * 100)}%`, bounds.x + bounds.w - 18, bounds.y + 44);
    ctx.textAlign = "left";
    return;
  }

  if (entry.action === "fullscreen") {
    const enabled = Boolean(settings.fullscreen);
    ctx.fillStyle = enabled ? "#9be690" : "#d6b486";
    ctx.font = "700 16px Segoe UI, Arial";
    ctx.fillText(enabled ? "Enabled" : "Windowed", bounds.x + 18, bounds.y + 46);
    return;
  }

  if (entry.action === "reset-save") {
    ctx.fillStyle = "#d9998d";
    ctx.font = "14px Segoe UI, Arial";
    ctx.fillText("Deletes only adventure progress. Settings stay.", bounds.x + 18, bounds.y + 46);
    return;
  }

  ctx.fillStyle = "#c8d4bd";
  ctx.font = "14px Segoe UI, Arial";
  ctx.fillText("Return to the title screen", bounds.x + 18, bounds.y + 46);
}

function drawSlider(ctx, x, y, width, value, selected) {
  ctx.fillStyle = "#070c10";
  ctx.fillRect(x, y, width, 10);
  ctx.fillStyle = "#1a2430";
  ctx.fillRect(x + 1, y + 1, width - 2, 8);
  ctx.fillStyle = selected ? "#8fd5ff" : "#8fcf7c";
  ctx.fillRect(x + 1, y + 1, Math.max(4, (width - 2) * value), 8);
  ctx.fillStyle = "#f7ead0";
  ctx.fillRect(x + Math.round((width - 8) * value), y - 3, 8, 16);
}

function getActionValue(state, action) {
  if (action === "music-volume") return state.settings.musicVolume;
  if (action === "sfx-volume") return state.settings.sfxVolume;
  if (action === "fullscreen") return state.settings.fullscreen;
  return null;
}

function formatActionLabel(action) {
  switch (action) {
    case "new-game":
      return "New Game";
    case "continue":
      return "Continue";
    case "options":
      return "Options";
    case "music-volume":
      return "Music Volume";
    case "sfx-volume":
      return "SFX Volume";
    case "fullscreen":
      return "Fullscreen";
    case "reset-save":
      return "Reset Save Data";
    case "back":
      return "Back";
    default:
      return action;
  }
}

function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function wrapIndex(index, length) {
  return (index + length) % length;
}

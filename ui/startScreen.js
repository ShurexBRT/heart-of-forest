import { GAME_MODES } from "../core/gameMode.js";
import { getAylaPortrait } from "../rendering/atlasAssets.js";
import {
  drawPixelSprite,
  getActorSprite,
  getEnemySprite,
} from "../rendering/pixelAssets.js";

const TEXT_MEASURE_CANVAS =
  typeof document !== "undefined" ? document.createElement("canvas") : null;
const TEXT_MEASURE_CTX = TEXT_MEASURE_CANVAS ? TEXT_MEASURE_CANVAS.getContext("2d") : null;

const TITLE_ACTIONS = ["new-game", "continue", "options"];
const OPTIONS_ACTIONS = ["music-volume", "sfx-volume", "fullscreen", "reset-save", "back"];
const PAUSE_ACTIONS = ["resume", "save-game", "save-return-title", "options"];
const GAME_OVER_ACTIONS = ["retry", "load-save", "return-title"];

const AYLA_PALETTE = { hood: "#f2eee4", cloak: "#678d5d", accent: "#d8bf7f" };

const HELP_SECTIONS = [
  {
    title: "Movement",
    lines: ["WASD to move", "Space to dash", "E to interact or confirm travel"],
  },
  {
    title: "Combat",
    lines: ["Left Click for Staff Strike", "Right Click for Spirit Bolt", "1 for Root Snare", "R for Verdant Pulse"],
  },
  {
    title: "Field Tools",
    lines: ["Q opens the quest log", "C / I / T switch character views", "2 / 3 / 4 trigger bound items", "5 / 6 drink quick potions"],
  },
  {
    title: "Travel & Save",
    lines: ["Esc pauses the run", "Hold E on gates to confirm zone travel", "Sleep at home to start a new day", "Autosave triggers on travel, sleep, and major clears"],
  },
];

const MODE_THEMES = {
  [GAME_MODES.START_MENU]: {
    accent: "#8fcb83",
    accentSoft: "#cbe7a4",
    highlight: "#8dd6ff",
    panelTint: "rgba(4, 9, 12, 0.82)",
    innerTint: "#0f171d",
    header: "#f5edd6",
    subtitle: "#d7e6cf",
    hint: "#99ad92",
    button: "#17222c",
    buttonSelected: "#20322a",
    buttonBorder: "#516677",
    heroGlow: "rgba(129, 203, 142, 0.18)",
    secondaryGlow: "rgba(101, 173, 255, 0.14)",
    veil: "rgba(2, 8, 9, 0.46)",
  },
  [GAME_MODES.OPTIONS]: {
    accent: "#8ecb93",
    accentSoft: "#d6e9be",
    highlight: "#84c5ff",
    panelTint: "rgba(4, 8, 12, 0.86)",
    innerTint: "#10171e",
    header: "#f3ead0",
    subtitle: "#d6e4cd",
    hint: "#95a894",
    button: "#16212a",
    buttonSelected: "#22322c",
    buttonBorder: "#4d5d6b",
    heroGlow: "rgba(104, 179, 120, 0.14)",
    secondaryGlow: "rgba(134, 186, 255, 0.12)",
    veil: "rgba(3, 7, 10, 0.52)",
  },
  [GAME_MODES.PAUSED]: {
    accent: "#7ec7c9",
    accentSoft: "#d4ebdd",
    highlight: "#a8e6cf",
    panelTint: "rgba(4, 9, 13, 0.78)",
    innerTint: "#11181f",
    header: "#eef4ee",
    subtitle: "#d0ded1",
    hint: "#94a79e",
    button: "#18232c",
    buttonSelected: "#23353a",
    buttonBorder: "#55707a",
    heroGlow: "rgba(117, 197, 200, 0.16)",
    secondaryGlow: "rgba(165, 223, 207, 0.12)",
    veil: "rgba(5, 10, 12, 0.42)",
  },
  [GAME_MODES.GAME_OVER]: {
    accent: "#d27e6f",
    accentSoft: "#f0d1b2",
    highlight: "#f1b78d",
    panelTint: "rgba(10, 6, 7, 0.86)",
    innerTint: "#171114",
    header: "#f5ddd4",
    subtitle: "#dfc4bf",
    hint: "#b38f88",
    button: "#26191d",
    buttonSelected: "#372126",
    buttonBorder: "#7d5754",
    heroGlow: "rgba(177, 79, 72, 0.2)",
    secondaryGlow: "rgba(241, 166, 106, 0.12)",
    veil: "rgba(10, 4, 5, 0.58)",
  },
};

export function createFrontendState() {
  return {
    menuSelection: 0,
    optionsSelection: 0,
    pauseSelection: 0,
    gameOverSelection: 0,
    canContinue: false,
    lastSavedAt: 0,
    optionsReturnMode: GAME_MODES.START_MENU,
    statusText: "",
    statusUntil: 0,
    resetSaveArmed: false,
  };
}

export function syncFrontendSaveState(frontend, save) {
  frontend.canContinue = Boolean(save);
  frontend.lastSavedAt = save?.savedAt || 0;

  if (!frontend.canContinue && TITLE_ACTIONS[frontend.menuSelection] === "continue") {
    frontend.menuSelection = 0;
  }

  if (!frontend.canContinue && GAME_OVER_ACTIONS[frontend.gameOverSelection] === "load-save") {
    frontend.gameOverSelection = 0;
  }
}

export function renderFrontendScreen(ctx, state) {
  const theme = getTheme(state.mode);
  const layout = getFrontendLayout(state.viewport, state.mode);

  drawBackdropScrim(ctx, state.viewport, state.mode, theme);
  drawAtmosphere(ctx, state, layout, theme);
  drawMenuFrame(ctx, layout, theme);

  if (state.mode === GAME_MODES.START_MENU) {
    drawStartMenu(ctx, state, layout, theme);
    return;
  }

  if (state.mode === GAME_MODES.OPTIONS) {
    drawOptionsMenu(ctx, state, layout, theme);
    return;
  }

  if (state.mode === GAME_MODES.PAUSED) {
    drawPauseMenu(ctx, state, layout, theme);
    return;
  }

  drawGameOverMenu(ctx, state, layout, theme);
}

export function getFrontendHoverTarget(state, mouseX, mouseY) {
  const entries = getFrontendEntries(state);
  for (const entry of entries) {
    if (pointInRect(mouseX, mouseY, entry.bounds)) {
      return entry;
    }
  }
  return null;
}

export function moveFrontendSelection(state, delta) {
  const actions = getActionOrderForMode(state.mode);
  if (!actions.length) return;

  const selectionKey = getSelectionKeyForMode(state.mode);
  const currentIndex = state.frontend[selectionKey] || 0;
  let nextIndex = wrapIndex(currentIndex + delta, actions.length);

  if (!state.frontend.canContinue) {
    while (actions[nextIndex] === "continue" || actions[nextIndex] === "load-save") {
      nextIndex = wrapIndex(nextIndex + delta, actions.length);
    }
  }

  state.frontend[selectionKey] = nextIndex;
}

export function getSelectedFrontendAction(state) {
  const actions = getActionOrderForMode(state.mode);
  const selectionKey = getSelectionKeyForMode(state.mode);
  return actions[state.frontend[selectionKey] || 0] || null;
}

export function getFrontendEntries(state) {
  const layout = getFrontendLayout(state.viewport, state.mode);

  switch (state.mode) {
    case GAME_MODES.START_MENU:
      return getMenuEntries(state, layout, TITLE_ACTIONS, "menuSelection", layout.actionX, layout.actionY);
    case GAME_MODES.OPTIONS:
      return getOptionEntries(state, layout);
    case GAME_MODES.PAUSED:
      return getMenuEntries(state, layout, PAUSE_ACTIONS, "pauseSelection", layout.actionX, layout.actionY);
    case GAME_MODES.GAME_OVER:
      return getMenuEntries(state, layout, GAME_OVER_ACTIONS, "gameOverSelection", layout.actionX, layout.actionY);
    default:
      return [];
  }
}

export function getFrontendLayout(viewport, mode = GAME_MODES.START_MENU) {
  const marginX = Math.max(26, Math.min(74, viewport.width * 0.055));
  const marginY = Math.max(22, Math.min(72, viewport.height * 0.055));
  const sizes = {
    [GAME_MODES.START_MENU]: { w: 1040, h: 646 },
    [GAME_MODES.OPTIONS]: { w: 980, h: 660 },
    [GAME_MODES.PAUSED]: { w: 860, h: 562 },
    [GAME_MODES.GAME_OVER]: { w: 812, h: 576 },
  };
  const size = sizes[mode] || sizes[GAME_MODES.START_MENU];
  const panelW = Math.min(size.w, viewport.width - marginX * 2);
  const panelH = Math.min(size.h, viewport.height - marginY * 2);
  const panelX = Math.round(viewport.width / 2 - panelW / 2);
  const panelY = Math.round(viewport.height / 2 - panelH / 2);
  const contentPadX = Math.max(26, Math.min(56, panelW * 0.055));
  const contentPadY = Math.max(24, Math.min(36, panelH * 0.06));
  const contentX = panelX + contentPadX;
  const contentY = panelY + contentPadY;
  const contentW = panelW - contentPadX * 2;
  const contentH = panelH - contentPadY * 2;
  const compactThreshold =
    mode === GAME_MODES.OPTIONS ? 860 : mode === GAME_MODES.GAME_OVER ? 760 : 820;
  const compact = panelW < compactThreshold;
  const heroSplit = mode === GAME_MODES.START_MENU && !compact;
  const sidebarSplit = (mode === GAME_MODES.PAUSED || mode === GAME_MODES.GAME_OVER) && !compact;
  const compactStartHeroH =
    mode === GAME_MODES.START_MENU && !heroSplit
      ? Math.max(108, Math.min(136, Math.floor(contentH * 0.19)))
      : 0;
  const compactStartHeroY = contentY + 96;
  const actionW = Math.min(heroSplit ? 346 : 352, contentW - (compact ? 0 : 24));
  const actionX = heroSplit ? contentX : sidebarSplit ? contentX : Math.round(panelX + panelW / 2 - actionW / 2);
  const heroX = heroSplit ? actionX + actionW + 28 : contentX;
  const heroW = heroSplit ? contentX + contentW - heroX : contentW;
  const sideX = sidebarSplit ? contentX + actionW + 32 : contentX;
  const sideW = sidebarSplit ? contentX + contentW - sideX : contentW;

  return {
    panelX,
    panelY,
    panelW,
    panelH,
    contentX,
    contentY,
    contentW,
    contentH,
    compact,
    heroSplit,
    sidebarSplit,
    actionX,
    actionY:
      mode === GAME_MODES.START_MENU
        ? heroSplit
          ? contentY + 196
          : compactStartHeroY + compactStartHeroH + 18
        : mode === GAME_MODES.PAUSED
          ? contentY + 162
          : mode === GAME_MODES.GAME_OVER
            ? contentY + 236
            : contentY + 138,
    actionW,
    heroRect: {
      x: heroX,
      y: mode === GAME_MODES.START_MENU && !heroSplit ? compactStartHeroY : contentY + 72,
      w: heroW,
      h:
        mode === GAME_MODES.START_MENU && !heroSplit
          ? compactStartHeroH
          : Math.max(240, contentH - 120),
    },
    sideRect: { x: sideX, y: contentY + 124, w: sideW, h: Math.max(220, contentH - 148) },
  };
}

function getMenuEntries(state, layout, actions, selectionKey, x, y) {
  const buttonW = layout.actionW;
  const gap = state.mode === GAME_MODES.START_MENU ? 16 : 12;
  const selectedAction = actions[state.frontend[selectionKey] || 0];
  const measure = getMeasureContext("12px Segoe UI, Arial");
  let cursorY = y;

  return actions.map((action) => {
    const note = getActionNote(action, state);
    const noteLines = toWrappedLines(measure, note, buttonW - 44, 4);
    const buttonH = Math.max(72, 40 + noteLines.length * 15);
    const entry = {
      action,
      label: formatActionLabel(action),
      note,
      noteLines,
      selected: action === selectedAction,
      disabled:
        (action === "continue" || action === "load-save") && !state.frontend.canContinue,
      bounds: {
        x,
        y: cursorY,
        w: buttonW,
        h: buttonH,
      },
    };
    cursorY += buttonH + gap;
    return entry;
  });
}

function getOptionEntries(state, layout) {
  const splitLayout = getOptionsSplitLayout(layout);
  const selectedAction = OPTIONS_ACTIONS[state.frontend.optionsSelection];
  const measure = getMeasureContext("11px Segoe UI, Arial");
  let cursorY = splitLayout.leftY;

  return OPTIONS_ACTIONS.map((action) => {
    const description = getOptionDescription(action, state.frontend.resetSaveArmed);
    const metrics = getOptionControlMetrics(action, splitLayout.leftW);
    const descriptionLines = toWrappedLines(
      measure,
      description,
      metrics.textWidth,
      splitLayout.compact ? 2 : 4
    );
    const height = Math.max(
      metrics.stacked ? (splitLayout.compact ? 74 : 92) : splitLayout.compact ? 64 : 74,
      34 + descriptionLines.length * 14 + (metrics.stacked ? 26 : 0)
    );
    const entry = {
      action,
      label: formatActionLabel(action),
      description,
      descriptionLines,
      metrics,
      selected: action === selectedAction,
      value: getActionValue(state, action),
      bounds: {
        x: splitLayout.leftX,
        y: cursorY,
        w: splitLayout.leftW,
        h: height,
      },
    };
    cursorY += height + splitLayout.gap;
    return entry;
  });
}

function drawStartMenu(ctx, state, layout, theme) {
  drawHeader(ctx, layout, theme, {
    eyebrow: "Dark-Forest Action RPG",
    title: "Heart of Forest",
    subtitle: "The old roads are waking again. Ayla stands where the roots still remember the village name.",
    hint: "",
  });

  drawStartHero(ctx, layout, theme);

  const entries = getFrontendEntries(state);
  for (const entry of entries) {
    drawButton(ctx, entry.bounds, entry.label, {
      selected: entry.selected,
      disabled: entry.disabled,
      accent: entry.action === "new-game" ? theme.accent : theme.highlight,
      note: entry.note,
      noteLines: entry.noteLines,
      theme,
    });
  }

  drawFooterSummary(
    ctx,
    layout,
    state.frontend.canContinue && state.frontend.lastSavedAt
      ? `Last save: ${new Date(state.frontend.lastSavedAt).toLocaleString()}`
      : "No valid save found. Begin a fresh journey from Ayla's homestead.",
    state.frontend.canContinue ? "#e6d9b7" : "#91a098"
  );
}

function drawOptionsMenu(ctx, state, layout, theme) {
  drawHeader(ctx, layout, theme, {
    eyebrow: "Rites & Field Guide",
    title: "Options",
    subtitle: "Set the music of the grove, the strike of the charms, and the way Ayla reads the road ahead.",
    hint: "Left / Right adjusts values, Enter confirms, Esc goes back",
  });

  const splitLayout = getOptionsSplitLayout(layout);
  const entries = getFrontendEntries(state);

  drawPanelBlock(
    ctx,
    splitLayout.leftX,
    splitLayout.leftY - 42,
    splitLayout.leftW,
    splitLayout.leftBlockH,
    theme,
    "Field Rites"
  );
  for (const entry of entries) {
    drawOptionRow(ctx, entry, state.settings, state.frontend, theme);
  }

  if (splitLayout.showGuide) {
    drawGuidePanel(ctx, splitLayout.rightX, splitLayout.rightY, splitLayout.rightW, splitLayout.rightH, theme);
  }

  if (!splitLayout.compact || !splitLayout.showGuide) {
    drawFooterSummary(
      ctx,
      layout,
      splitLayout.showGuide
        ? getFooterMessage(
            state,
            state.frontend.optionsReturnMode === GAME_MODES.PAUSED
              ? "Back returns to Pause."
              : "Back returns to the title screen."
          )
        : "WASD move  |  Space dash  |  LMB staff  |  RMB bolt  |  Q quest log  |  Esc back",
      getFooterColor(state, "#9cb29f")
    );
  }
}

function drawPauseMenu(ctx, state, layout, theme) {
  drawHeader(ctx, layout, theme, {
    eyebrow: "The Grove Holds Its Breath",
    title: "Paused",
    subtitle: state.scene?.title || "Ayla waits among the roots.",
    hint: "Resume when you are ready, or bank the run and return to the title screen.",
  });

  drawSceneStatusCard(ctx, layout.sideRect, state, theme);

  const entries = getFrontendEntries(state);
  for (const entry of entries) {
    drawButton(ctx, entry.bounds, entry.label, {
      selected: entry.selected,
      disabled: entry.disabled,
      accent: entry.action === "resume" ? theme.accent : theme.highlight,
      note: entry.note,
      noteLines: entry.noteLines,
      theme,
    });
  }

  drawFooterSummary(
    ctx,
    layout,
    getFooterMessage(
      state,
      state.frontend.lastSavedAt
        ? `Latest autosave: ${new Date(state.frontend.lastSavedAt).toLocaleTimeString()}`
        : "Gameplay is frozen while this menu is open."
    ),
    getFooterColor(state, "#a7beb1")
  );
}

function drawGameOverMenu(ctx, state, layout, theme) {
  drawHeader(ctx, layout, theme, {
    eyebrow: "The Road Remembers",
    title: "Game Over",
    subtitle: "Ayla falls, but the grove keeps the shape of her last steps in ash and lantern smoke.",
    hint: "Retry the scene, return through the latest save, or step back to the title screen.",
  });

  drawGameOverMemorial(ctx, layout.sideRect, state, theme);

  const entries = getFrontendEntries(state);
  for (const entry of entries) {
    drawButton(ctx, entry.bounds, entry.label, {
      selected: entry.selected,
      disabled: entry.disabled,
      accent: entry.action === "retry" ? theme.accent : theme.highlight,
      note: entry.note,
      noteLines: entry.noteLines,
      theme,
    });
  }

  drawFooterSummary(
    ctx,
    layout,
    state.frontend.canContinue
      ? "Load Save restores the latest autosave."
      : "No valid save found. Retry keeps you in the current scene.",
    state.frontend.canContinue ? "#e2cfb8" : "#c39a91"
  );
}

function drawHeader(ctx, layout, theme, copy) {
  const titleSize = Math.max(32, Math.min(46, Math.floor(layout.panelW / 15)));
  const subtitleSize = layout.panelW < 760 ? 15 : 17;
  const hintSize = layout.panelW < 760 ? 12 : 13;
  const textWidth = layout.heroSplit ? Math.min(420, layout.actionW + 24) : layout.contentW;

  ctx.fillStyle = theme.accentSoft;
  ctx.font = "700 12px Segoe UI, Arial";
  ctx.fillText(copy.eyebrow, layout.contentX, layout.contentY + 12);

  ctx.fillStyle = theme.header;
  ctx.font = `700 ${titleSize}px Georgia, serif`;
  ctx.fillText(copy.title, layout.contentX, layout.contentY + titleSize + 20);

  ctx.fillStyle = theme.subtitle;
  ctx.font = `${subtitleSize}px Segoe UI, Arial`;
  const subtitleLines = drawWrappedText(
    ctx,
    copy.subtitle,
    layout.contentX,
    layout.contentY + titleSize + 46,
    textWidth,
    subtitleSize + 5,
    4
  );

  if (copy.hint) {
    ctx.fillStyle = theme.hint;
    ctx.font = `${hintSize}px Segoe UI, Arial`;
    drawWrappedText(
      ctx,
      copy.hint,
      layout.contentX,
      layout.contentY + titleSize + 56 + subtitleLines.length * (subtitleSize + 5),
      textWidth,
      hintSize + 4,
      3
    );
  }
}

function drawStartHero(ctx, layout, theme) {
  const hero = layout.heroRect;
  drawPanelBlock(ctx, hero.x, hero.y, hero.w, hero.h, theme, "Ayla of the White Hood");

  if (!layout.heroSplit) {
    const portrait = getAylaPortrait();
    const textX = hero.x + 18;
    const textW = Math.max(140, hero.w - 158);
    const portraitBox = {
      x: hero.x + hero.w - 126,
      y: hero.y + 14,
      w: 102,
      h: hero.h - 26,
    };

    const glow = ctx.createRadialGradient(
      portraitBox.x + portraitBox.w * 0.54,
      portraitBox.y + portraitBox.h * 0.48,
      6,
      portraitBox.x + portraitBox.w * 0.54,
      portraitBox.y + portraitBox.h * 0.48,
      76
    );
    glow.addColorStop(0, "rgba(143, 203, 131, 0.22)");
    glow.addColorStop(1, "rgba(16, 25, 29, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(hero.x + 6, hero.y + 8, hero.w - 12, hero.h - 16);

    if (portrait) {
      drawCanvasPortrait(ctx, portrait, portraitBox);
    } else {
      const fallback = getActorSprite(AYLA_PALETTE, "right", 1, "ayla", "cast");
      drawPixelSprite(ctx, fallback, portraitBox.x + portraitBox.w * 0.52, portraitBox.y + portraitBox.h * 0.9, {
        scale: 2.4,
        alpha: 0.98,
      });
    }

    ctx.fillStyle = "#f0e5cd";
    ctx.font = "700 13px Segoe UI, Arial";
    drawWrappedText(
      ctx,
      "White Hood warden of the village road and shrine line.",
      textX,
      hero.y + 42,
      textW,
      16,
      3
    );
    ctx.fillStyle = "#b9cab8";
    ctx.font = "11px Segoe UI, Arial";
    drawWrappedText(
      ctx,
      "Staff, roots, spirit bolts, and a pulse that blooms outward.",
      textX,
      hero.y + 76,
      textW,
      14,
      3
    );
    return;
  }

  const artX = hero.x + 22;
  const artY = hero.y + 48;
  const artW = hero.w - 44;
  const artH = hero.h - 96;
  const portrait = getAylaPortrait();
  const portraitBox = {
    x: artX + Math.max(0, artW - Math.min(artW * 0.68, 286)) / 2,
    y: artY + 6,
    w: Math.min(artW * 0.68, 286),
    h: Math.min(artH - 74, 318),
  };

  const glow = ctx.createRadialGradient(
    portraitBox.x + portraitBox.w * 0.52,
    portraitBox.y + portraitBox.h * 0.48,
    8,
    portraitBox.x + portraitBox.w * 0.52,
    portraitBox.y + portraitBox.h * 0.48,
    Math.max(portraitBox.w, portraitBox.h) * 0.58
  );
  glow.addColorStop(0, "rgba(143, 203, 131, 0.24)");
  glow.addColorStop(1, "rgba(16, 25, 29, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(hero.x + 6, hero.y + 8, hero.w - 12, hero.h - 16);

  if (portrait) {
    drawCanvasPortrait(ctx, portrait, portraitBox);
  } else {
    const fallback = getActorSprite(AYLA_PALETTE, "right", 1, "ayla", "cast");
    drawPixelSprite(ctx, fallback, portraitBox.x + portraitBox.w * 0.5, portraitBox.y + portraitBox.h * 0.95, {
      scale: 3.6,
      alpha: 0.98,
    });
  }

  drawStartEnemyAccents(ctx, hero, theme);

  ctx.fillStyle = "#f0e5cd";
  ctx.font = "700 14px Segoe UI, Arial";
  ctx.fillText("Keeper of the village roads, lanterns, and old shrine lines.", artX, hero.y + hero.h - 42);
  ctx.fillStyle = "#b9cab8";
  ctx.font = "12px Segoe UI, Arial";
  drawWrappedText(
    ctx,
    "Staff, roots, spirit bolts, and the green pulse at the center of the grove.",
    artX,
    hero.y + hero.h - 22,
    artW,
    15,
    2
  );
}

function drawStartEnemyAccents(ctx, hero, theme) {
  const baseY = hero.y + hero.h - 72;
  const accents = [
    { type: "thornling", x: hero.x + 70, facing: "right", scale: 2.1 },
    { type: "rot_weaver", x: hero.x + hero.w / 2, facing: "down", scale: 2.25 },
    { type: "starbound_archer", x: hero.x + hero.w - 84, facing: "left", scale: 2.1 },
  ];

  ctx.save();
  ctx.globalAlpha = 0.92;
  for (const accent of accents) {
    const sprite = getEnemySprite(accent.type, accent.facing, 1, "idle");
    drawPixelSprite(ctx, sprite, accent.x, baseY, {
      scale: accent.scale,
      alpha: 0.92,
      tint: theme.accent,
      tintAlpha: 0.08,
    });
  }
  ctx.restore();
}

function drawSceneStatusCard(ctx, rectData, state, theme) {
  drawPanelBlock(ctx, rectData.x, rectData.y, rectData.w, rectData.h, theme, "Current Watch");

  const lines = [
    ["Scene", state.scene?.title || "Unknown Road"],
    ["Region", state.scene?.regionName || "Forest Village"],
    ["Level", `Ayla ${state.progression.level}`],
    ["Silver", `${state.progression.silver || 0}`],
    ["Quest", state.activeQuests?.find((quest) => quest.status !== "done")?.title || "No urgent quest"],
  ];

  let cursorY = rectData.y + 40;
  ctx.font = "12px Segoe UI, Arial";
  for (const [label, value] of lines) {
    ctx.fillStyle = "#9fb7b6";
    ctx.fillText(label.toUpperCase(), rectData.x + 18, cursorY);
    ctx.fillStyle = "#f1ead8";
    drawWrappedText(ctx, value, rectData.x + 92, cursorY, rectData.w - 110, 15, 2);
    cursorY += 30;
  }

  ctx.fillStyle = "#bcd6cd";
  ctx.font = "12px Segoe UI, Arial";
  drawWrappedText(
    ctx,
    "Saving now keeps this run intact before returning to the title screen.",
    rectData.x + 18,
    rectData.y + rectData.h - 48,
    rectData.w - 36,
    16,
    3
  );
}

function drawGameOverMemorial(ctx, rectData, state, theme) {
  drawPanelBlock(ctx, rectData.x, rectData.y, rectData.w, rectData.h, theme, "Last Lantern");

  const portrait = getAylaPortrait();
  const portraitW = Math.min(156, rectData.w - 40);
  const portraitH = 166;
  const boxX = rectData.x + rectData.w / 2 - portraitW / 2;
  const boxY = rectData.y + 26;

  if (portrait) {
    drawCanvasPortrait(ctx, portrait, { x: boxX, y: boxY, w: portraitW, h: portraitH }, "#c56c63");
  } else {
    const fallback = getActorSprite(AYLA_PALETTE, "down", 0, "ayla", "hurt");
    drawPixelSprite(ctx, fallback, rectData.x + rectData.w / 2, rectData.y + 182, {
      scale: 3.1,
      alpha: 0.84,
      tint: "#c56c63",
      tintAlpha: 0.22,
    });
  }

  ctx.fillStyle = "#f1ddd5";
  ctx.font = "700 14px Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.fillText(state.scene?.title || "Unknown Road", rectData.x + rectData.w / 2, rectData.y + rectData.h - 68);
  ctx.font = "12px Segoe UI, Arial";
  ctx.fillStyle = "#d4b6ac";
  ctx.textAlign = "left";
  drawWrappedText(
    ctx,
    state.frontend.canContinue
      ? "The latest autosave still holds the path behind you."
      : "No recoverable save was found. The road must be walked again from here.",
    rectData.x + 18,
    rectData.y + rectData.h - 56,
    rectData.w - 36,
    16,
    2
  );
}

function drawGuidePanel(ctx, x, y, w, h, theme) {
  drawPanelBlock(ctx, x, y, w, h, theme, "Field Guide");

  if (w < 280 || h < 170) {
    const compactLines = [
      "WASD move  |  Space dash  |  E interact",
      "LMB staff  |  RMB bolt  |  1 root  |  R pulse",
      "Q quest log  |  C / I / T views  |  2-4 bound items",
      "Esc back  |  Hold E on gates to confirm travel",
    ];
    ctx.fillStyle = "#d7e2d4";
    ctx.font = "11px Segoe UI, Arial";
    compactLines.forEach((line, index) => {
      drawWrappedText(ctx, line, x + 18, y + 30 + index * 22, w - 36, 14, 2);
    });
    return;
  }

  let cursorY = y + 34;
  const sectionGap = 10;
  const cardW = w - 24;

  for (const section of HELP_SECTIONS) {
    const lines = [];
    const measure = getMeasureContext("11px Segoe UI, Arial");
    for (const line of section.lines) {
      lines.push(...toWrappedLines(measure, line, cardW - 24, 3));
    }
    const cardH = 30 + lines.length * 14;
    if (cursorY + cardH > y + h - 10) break;

    ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
    ctx.fillRect(x + 12, cursorY, cardW, cardH);
    ctx.fillStyle = "#131b22";
    ctx.fillRect(x + 14, cursorY + 2, cardW - 4, cardH - 4);
    ctx.strokeStyle = theme.buttonBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 14, cursorY + 2, cardW - 4, cardH - 4);

    ctx.fillStyle = theme.accentSoft;
    ctx.font = "700 12px Segoe UI, Arial";
    ctx.fillText(section.title, x + 26, cursorY + 16);
    ctx.fillStyle = "#d7e2d4";
    ctx.font = "11px Segoe UI, Arial";
    lines.forEach((line, index) => {
      ctx.fillText(line, x + 26, cursorY + 34 + index * 14);
    });

    cursorY += cardH + sectionGap;
  }
}

function drawButton(ctx, bounds, label, options) {
  const theme = options.theme;
  const fill = options.disabled ? "rgba(12, 16, 20, 0.74)" : theme.button;
  const inner = options.selected ? theme.buttonSelected : theme.innerTint;
  const border = options.selected ? options.accent : theme.buttonBorder;

  ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
  ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  ctx.fillStyle = fill;
  ctx.fillRect(bounds.x + 2, bounds.y + 2, bounds.w - 4, bounds.h - 4);
  ctx.fillStyle = inner;
  ctx.fillRect(bounds.x + 6, bounds.y + 6, bounds.w - 12, bounds.h - 12);
  ctx.strokeStyle = border;
  ctx.lineWidth = options.selected ? 2 : 1;
  ctx.strokeRect(bounds.x + 6, bounds.y + 6, bounds.w - 12, bounds.h - 12);

  ctx.fillStyle = options.disabled ? "#6e797e" : "#f6ead0";
  ctx.font = "700 22px Segoe UI, Arial";
  ctx.fillText(label, bounds.x + 18, bounds.y + 28);

  if (options.noteLines?.length) {
    ctx.fillStyle = options.disabled ? "#616c71" : "#adbbc2";
    ctx.font = "12px Segoe UI, Arial";
    options.noteLines.forEach((line, index) => {
      ctx.fillText(line, bounds.x + 18, bounds.y + 48 + index * 14);
    });
  }

  if (options.disabled) {
    ctx.fillStyle = "#88949c";
    ctx.font = "11px Segoe UI, Arial";
    ctx.textAlign = "right";
    ctx.fillText("Save required", bounds.x + bounds.w - 18, bounds.y + 27);
    ctx.textAlign = "left";
    return;
  }

  if (options.selected) {
    ctx.fillStyle = options.accent;
    ctx.fillRect(bounds.x + bounds.w - 14, bounds.y + 12, 4, bounds.h - 24);
  }
}

function drawOptionRow(ctx, entry, settings, frontend = null, theme) {
  const { bounds } = entry;
  const metrics = entry.metrics || getOptionControlMetrics(entry.action, bounds.w);
  const textX = bounds.x + 18;
  const textY = bounds.y + 24;
  const descriptionY = bounds.y + 44;
  const controlX = bounds.x + bounds.w - metrics.controlWidth - 18;
  const controlY = metrics.stacked ? bounds.y + bounds.h - 32 : Math.round(bounds.y + bounds.h / 2 - 12);
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  ctx.fillStyle = entry.selected ? "rgba(34, 50, 58, 0.92)" : "#111820";
  ctx.fillRect(bounds.x + 3, bounds.y + 3, bounds.w - 6, bounds.h - 6);
  ctx.strokeStyle = entry.selected ? theme.accent : "#4b5966";
  ctx.lineWidth = entry.selected ? 2 : 1;
  ctx.strokeRect(bounds.x + 3, bounds.y + 3, bounds.w - 6, bounds.h - 6);

  ctx.fillStyle = "#f3ead2";
  ctx.font = bounds.w < 460 ? "700 15px Segoe UI, Arial" : "700 17px Segoe UI, Arial";
  ctx.fillText(entry.label, textX, textY);

  ctx.fillStyle = "#b9c8c0";
  ctx.font = "11px Segoe UI, Arial";
  entry.descriptionLines.forEach((line, index) => {
    ctx.fillText(line, textX, descriptionY + index * 14);
  });

  if (entry.action === "music-volume" || entry.action === "sfx-volume") {
    const value = entry.action === "music-volume" ? settings.musicVolume : settings.sfxVolume;
    const sliderX = controlX;
    const sliderY = metrics.stacked ? bounds.y + bounds.h - 28 : Math.round(bounds.y + bounds.h / 2 - 6);
    drawSlider(ctx, sliderX, sliderY, metrics.sliderWidth, value, entry.selected, theme);
    ctx.textAlign = "right";
    ctx.fillStyle = "#e7f2df";
    ctx.font = "700 13px Segoe UI, Arial";
    ctx.fillText(
      `${Math.round(value * 100)}%`,
      bounds.x + bounds.w - 18,
      metrics.stacked ? bounds.y + bounds.h - 14 : Math.round(bounds.y + bounds.h / 2 + 5)
    );
    ctx.textAlign = "left";
    return;
  }

  if (entry.action === "fullscreen") {
    const enabled = Boolean(settings.fullscreen);
    drawStatePill(
      ctx,
      controlX,
      controlY,
      metrics.controlWidth,
      24,
      enabled ? "Enabled" : "Windowed",
      enabled ? theme.accent : "#bda978"
    );
    return;
  }

  if (entry.action === "reset-save") {
    drawStatePill(
      ctx,
      controlX,
      controlY,
      metrics.controlWidth,
      24,
      frontend?.resetSaveArmed ? "Confirm Reset" : "Delete Adventure",
      frontend?.resetSaveArmed ? "#f0b083" : "#cf8578"
    );
    return;
  }

  drawStatePill(ctx, controlX, controlY, metrics.controlWidth, 24, "Back", theme.highlight);
}

function drawSlider(ctx, x, y, width, value, selected, theme) {
  ctx.fillStyle = "#070c10";
  ctx.fillRect(x, y, width, 12);
  ctx.fillStyle = "#18212b";
  ctx.fillRect(x + 1, y + 1, width - 2, 10);
  ctx.fillStyle = selected ? theme.highlight : theme.accent;
  ctx.fillRect(x + 1, y + 1, Math.max(6, (width - 2) * value), 10);
  ctx.fillStyle = "#f7ead0";
  ctx.fillRect(x + Math.round((width - 8) * value), y - 3, 8, 18);
}

function drawStatePill(ctx, x, y, w, h, label, color) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#131a20";
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  ctx.fillStyle = "#f6ead0";
  ctx.font = "700 11px Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.fillText(label, x + w / 2, y + 16);
  ctx.textAlign = "left";
}

function getOptionsSplitLayout(layout) {
  const compact = layout.compact || layout.panelW < 850;
  const leftW = compact ? layout.contentW : Math.min(452, layout.contentW * 0.49);
  const rightX = compact ? layout.contentX : layout.contentX + leftW + 28;
  const rightW = compact ? layout.contentW : layout.contentW - leftW - 28;
  const leftY = compact ? layout.contentY + 112 : layout.contentY + 148;
  const leftBlockH = compact ? Math.max(344, layout.panelH - 182) : layout.panelH - 190;
  const rightY = compact ? leftY + leftBlockH + 12 : layout.contentY + 128;
  const rightH = compact
    ? Math.max(102, layout.panelY + layout.panelH - rightY - 44)
    : layout.panelH - 190;

  return {
    compact,
    showGuide: !compact,
    leftX: layout.contentX,
    leftY,
    leftW,
    leftBlockH,
    rightX,
    rightY,
    rightW,
    rightH,
    gap: compact ? 8 : 14,
  };
}

function getOptionControlMetrics(action, rowWidth) {
  const stacked = rowWidth < 420;
  if (action === "music-volume" || action === "sfx-volume") {
    const controlWidth = stacked ? rowWidth - 36 : 204;
    const sliderWidth = Math.max(88, controlWidth - 72);
    return {
      stacked,
      controlWidth,
      sliderWidth,
      textWidth: Math.max(150, rowWidth - 36 - (stacked ? 0 : controlWidth + 18)),
    };
  }

  const controlWidth = action === "reset-save" ? 150 : action === "fullscreen" ? 112 : 88;
  return {
    stacked,
    controlWidth,
    sliderWidth: 0,
    textWidth: Math.max(150, rowWidth - 36 - (stacked ? 0 : controlWidth + 18)),
  };
}

function drawBackdropScrim(ctx, viewport, mode, theme) {
  const opacity = mode === GAME_MODES.GAME_OVER ? 0.82 : mode === GAME_MODES.START_MENU ? 0.58 : 0.7;
  ctx.fillStyle = `rgba(3, 8, 10, ${opacity})`;
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  ctx.fillStyle = theme.veil;
  ctx.fillRect(0, 0, viewport.width, viewport.height);
}

function drawAtmosphere(ctx, state, layout, theme) {
  drawGlow(ctx, layout.panelX + layout.panelW * 0.78, layout.panelY + layout.panelH * 0.28, layout.panelW * 0.38, theme.heroGlow);
  drawGlow(ctx, layout.panelX + layout.panelW * 0.22, layout.panelY + layout.panelH * 0.84, layout.panelW * 0.28, theme.secondaryGlow);

  if (state.mode === GAME_MODES.START_MENU) {
    drawRootSwirls(ctx, layout.panelX + layout.panelW - 92, layout.panelY + 70, theme.accentSoft, 0.16);
    drawRootSwirls(ctx, layout.panelX + 54, layout.panelY + layout.panelH - 72, theme.highlight, 0.08);
  }

  if (state.mode === GAME_MODES.GAME_OVER) {
    drawRootSwirls(ctx, layout.panelX + layout.panelW - 118, layout.panelY + layout.panelH - 86, theme.accent, 0.14);
  }
}

function drawGlow(ctx, x, y, radius, color) {
  const gradient = ctx.createRadialGradient(x, y, 8, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawRootSwirls(ctx, x, y, color, alpha) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 54, y + 16);
  ctx.bezierCurveTo(x - 14, y - 30, x + 24, y + 20, x + 58, y - 8);
  ctx.moveTo(x - 36, y + 42);
  ctx.bezierCurveTo(x - 4, y + 4, x + 14, y + 58, x + 42, y + 26);
  ctx.stroke();
  ctx.restore();
}

function drawMenuFrame(ctx, layout, theme) {
  const { panelX: x, panelY: y, panelW: w, panelH: h } = layout;
  ctx.fillStyle = theme.panelTint;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = theme.innerTint;
  ctx.fillRect(x + 6, y + 6, w - 12, h - 12);

  const topGradient = ctx.createLinearGradient(x, y, x, y + h);
  topGradient.addColorStop(0, "rgba(255,255,255,0.04)");
  topGradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = topGradient;
  ctx.fillRect(x + 10, y + 10, w - 20, Math.min(120, h * 0.28));

  ctx.strokeStyle = theme.accentSoft;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  ctx.strokeStyle = "#33443c";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 14, y + 14, w - 28, h - 28);

  drawCornerBracket(ctx, x + 14, y + 14, theme.accentSoft, "tl");
  drawCornerBracket(ctx, x + w - 14, y + 14, theme.accentSoft, "tr");
  drawCornerBracket(ctx, x + 14, y + h - 14, theme.accentSoft, "bl");
  drawCornerBracket(ctx, x + w - 14, y + h - 14, theme.accentSoft, "br");
}

function drawCornerBracket(ctx, x, y, color, corner) {
  const size = 18;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (corner === "tl") {
    ctx.moveTo(x, y + size);
    ctx.lineTo(x, y);
    ctx.lineTo(x + size, y);
  } else if (corner === "tr") {
    ctx.moveTo(x - size, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + size);
  } else if (corner === "bl") {
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y);
    ctx.lineTo(x + size, y);
  } else {
    ctx.moveTo(x - size, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y - size);
  }
  ctx.stroke();
  ctx.restore();
}

function drawPanelBlock(ctx, x, y, w, h, theme, title = "") {
  ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#111820";
  ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
  ctx.strokeStyle = theme.buttonBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);

  if (title) {
    ctx.fillStyle = theme.accentSoft;
    ctx.font = "700 12px Segoe UI, Arial";
    ctx.fillText(title, x + 14, y + 18);
  }
}

function drawCanvasPortrait(ctx, portrait, box, tint = null) {
  const ratio = Math.min(box.w / portrait.width, box.h / portrait.height);
  const drawW = Math.round(portrait.width * ratio);
  const drawH = Math.round(portrait.height * ratio);
  const drawX = Math.round(box.x + box.w / 2 - drawW / 2);
  const drawY = Math.round(box.y + box.h - drawH);

  ctx.save();
  ctx.drawImage(portrait, drawX, drawY, drawW, drawH);
  if (tint) {
    ctx.globalCompositeOperation = "source-atop";
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = tint;
    ctx.fillRect(drawX, drawY, drawW, drawH);
  }
  ctx.restore();
}

function drawFooterSummary(ctx, layout, text, color) {
  ctx.fillStyle = color;
  ctx.font = "12px Segoe UI, Arial";
  drawWrappedText(ctx, text, layout.contentX, layout.panelY + layout.panelH - 34, layout.contentW, 15, 3);
}

function getFooterMessage(state, fallback) {
  if ((state.frontend.statusUntil || 0) > state.time && state.frontend.statusText) {
    return state.frontend.statusText;
  }
  return fallback;
}

function getFooterColor(state, fallback) {
  if ((state.frontend.statusUntil || 0) > state.time && state.frontend.statusText) {
    return "#e5d4ae";
  }
  return fallback;
}

function getActionOrderForMode(mode) {
  switch (mode) {
    case GAME_MODES.START_MENU:
      return TITLE_ACTIONS;
    case GAME_MODES.OPTIONS:
      return OPTIONS_ACTIONS;
    case GAME_MODES.PAUSED:
      return PAUSE_ACTIONS;
    case GAME_MODES.GAME_OVER:
      return GAME_OVER_ACTIONS;
    default:
      return [];
  }
}

function getSelectionKeyForMode(mode) {
  switch (mode) {
    case GAME_MODES.START_MENU:
      return "menuSelection";
    case GAME_MODES.PAUSED:
      return "pauseSelection";
    case GAME_MODES.GAME_OVER:
      return "gameOverSelection";
    default:
      return "optionsSelection";
  }
}

function getActionValue(state, action) {
  if (action === "music-volume") return state.settings.musicVolume;
  if (action === "sfx-volume") return state.settings.sfxVolume;
  if (action === "fullscreen") return state.settings.fullscreen;
  return null;
}

function getActionNote(action, state) {
  switch (action) {
    case "new-game":
      return "Wake at Ayla's homestead with six garden plots, fresh routes, and the grove still on edge.";
    case "continue":
      return state.frontend.canContinue
        ? "Restore the latest local save and return to Ayla's current road."
        : "A valid local save is needed before the grove can call you back.";
    case "options":
      return "Audio, display, controls, and the safety tools around your local save.";
    case "resume":
      return "Step straight back into live play without changing the current run.";
    case "save-game":
      return "Write a local save at the current point in the run.";
    case "save-return-title":
      return "Bank progress, then leave this run for the title screen.";
    case "retry":
      return "Restart the current scene from its entry point and re-enter the encounter.";
    case "load-save":
      return "Restore the latest autosave instead of restarting the scene.";
    case "return-title":
      return "Leave the current run and return to the title screen.";
    default:
      return "";
  }
}

function getOptionDescription(action, resetSaveArmed) {
  switch (action) {
    case "music-volume":
      return "Raise or lower the score that follows the roads, shrines, and village breath between fights.";
    case "sfx-volume":
      return "Set the weight of impacts, projectiles, UI clicks, and the small sounds that sell the combat feel.";
    case "fullscreen":
      return "Toggle a cleaner full-screen presentation for the grove and its overlays.";
    case "reset-save":
      return resetSaveArmed
        ? "Press Enter again to erase only adventure progress. Your settings stay untouched."
        : "Delete the local adventure save only. Settings and audio preferences stay intact.";
    case "back":
      return "Return to the previous screen with the current settings applied.";
    default:
      return "";
  }
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
    case "resume":
      return "Resume";
    case "save-game":
      return "Save Game";
    case "save-return-title":
      return "Save & Return to Title";
    case "retry":
      return "Retry Scene";
    case "load-save":
      return "Load Save";
    case "return-title":
      return "Return to Title";
    default:
      return action;
  }
}

function getTheme(mode) {
  return MODE_THEMES[mode] || MODE_THEMES[GAME_MODES.START_MENU];
}

function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function wrapIndex(index, length) {
  return (index + length) % length;
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = Infinity) {
  const lines = toWrappedLines(ctx, text, maxWidth, maxLines);
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
  return lines;
}

function toWrappedLines(ctxOrFont, text, maxWidth, maxLines = Infinity) {
  const raw = typeof text === "string" ? text.trim() : "";
  if (!raw) return [""];

  const ctx =
    typeof ctxOrFont === "string"
      ? getMeasureContext(ctxOrFont)
      : ctxOrFont && typeof ctxOrFont.measureText === "function"
        ? ctxOrFont
        : getMeasureContext("13px Segoe UI, Arial");

  const words = raw.split(/\s+/);
  const lines = [];
  let current = words.shift() || "";
  let truncated = false;

  for (const word of words) {
    const candidate = `${current} ${word}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }

    lines.push(current);
    current = word;
    if (lines.length >= maxLines - 1) {
      truncated = true;
      break;
    }
  }

  if (truncated) {
    let lastLine = current;
    while (lastLine.length > 1 && ctx.measureText(`${lastLine}...`).width > maxWidth) {
      lastLine = lastLine.slice(0, -1).trimEnd();
    }
    lines.push(`${lastLine}...`);
  } else if (lines.length < maxLines) {
    lines.push(current);
  }

  const rendered = lines.filter(Boolean).slice(0, maxLines);
  return rendered.length ? rendered : [raw];
}

function getMeasureContext(font) {
  const ctx = TEXT_MEASURE_CTX;
  if (!ctx) {
    return {
      measureText(value) {
        return { width: String(value || "").length * 7 };
      },
    };
  }

  ctx.font = font;
  return ctx;
}

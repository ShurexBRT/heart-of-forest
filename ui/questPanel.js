import { ITEM_DEFS } from "../data/gameData.js";
import { getQuestPanelView } from "../systems/story.js";
import {
  drawForestButton,
  drawForestCloseButton,
  drawForestPanel,
  drawForestPill,
  drawForestSubpanel,
} from "./forestChrome.js";

const TEXT_MEASURE_CANVAS =
  typeof document !== "undefined" ? document.createElement("canvas") : null;
const TEXT_MEASURE_CTX = TEXT_MEASURE_CANVAS ? TEXT_MEASURE_CANVAS.getContext("2d") : null;

export function renderQuestPanel(ctx, state) {
  const geometry = getQuestPanelGeometry(state);
  if (!geometry) return;

  const { panel, view, topics, buttons, layout } = geometry;

  ctx.fillStyle = "rgba(4, 6, 8, 0.72)";
  ctx.fillRect(0, 0, state.viewport.width, state.viewport.height);

  drawForestPanel(ctx, panel.x, panel.y, panel.w, panel.h, {
    accent: "#d7c28b",
    alpha: 0.94,
  });

  ctx.fillStyle = "#f5ead4";
  ctx.font = "700 16px Georgia, serif";
  ctx.fillText(view.npcName, panel.x + 28, panel.y + 34);
  ctx.fillStyle = "#b8c7b5";
  ctx.font = "12px Segoe UI, Arial";
  ctx.fillText(view.npcRole, panel.x + 28, panel.y + 52);
  ctx.textAlign = "right";
  ctx.fillStyle = "#9db09a";
  ctx.fillText("E / Enter confirm  |  Esc close", panel.x + panel.w - 68, panel.y + 34);
  ctx.textAlign = "left";

  drawSidebar(ctx, geometry);
  drawContent(ctx, geometry);
  drawCloseButton(ctx, getCloseButton(geometry), state.ui.hoverTarget);
}

export function getQuestPanelHoverTarget(state, mouseX, mouseY) {
  const geometry = getQuestPanelGeometry(state);
  if (!geometry) return null;

  const closeButton = getCloseButton(geometry);
  if (pointInRect(mouseX, mouseY, closeButton.rect)) {
    return closeButton;
  }

  for (const topic of geometry.topics) {
    if (pointInRect(mouseX, mouseY, topic.rect)) {
      return {
        action: "quest-panel-topic",
        index: topic.index,
        rect: topic.rect,
      };
    }
  }

  for (const button of geometry.buttons) {
    if (pointInRect(mouseX, mouseY, button.rect)) {
      return {
        action: "quest-panel-action",
        index: button.index,
        rect: button.rect,
      };
    }
  }

  return null;
}

function getQuestPanelGeometry(state) {
  const view = getQuestPanelView(state);
  if (!view) return null;

  const compact = state.viewport.width < 720 || state.viewport.height < 640;
  const panelW = Math.min(compact ? 640 : 980, state.viewport.width - (compact ? 28 : 88));
  const panelH = Math.min(compact ? 700 : 652, state.viewport.height - (compact ? 28 : 92));
  const panel = {
    x: Math.round(state.viewport.width / 2 - panelW / 2),
    y: Math.round(state.viewport.height / 2 - panelH / 2),
    w: panelW,
    h: panelH,
  };
  const sidebarW = compact ? panel.w - 36 : panelW < 840 ? 230 : 246;
  const sidebarH = compact ? Math.min(156, 48 + view.topics.length * 46) : panel.h - 120;
  const layout = compact
    ? {
        compact,
        sidebarX: panel.x + 18,
        sidebarY: panel.y + 78,
        sidebarW,
        sidebarH,
        contentX: panel.x + 18,
        contentY: panel.y + 90 + sidebarH,
        contentW: panel.w - 36,
        contentH: panel.h - sidebarH - 146,
      }
    : {
        compact,
        sidebarX: panel.x + 24,
        sidebarY: panel.y + 84,
        sidebarW,
        sidebarH,
        contentX: panel.x + sidebarW + 42,
        contentY: panel.y + 86,
        contentW: panel.w - sidebarW - 68,
        contentH: panel.h - 124,
      };

  const topics = view.topics.map((topic, index) => ({
    ...topic,
    index,
    rect: {
      x: layout.sidebarX + 12,
      y: layout.sidebarY + 42 + index * (compact ? 46 : 52),
      w: layout.sidebarW - 24,
      h: compact ? 38 : 42,
    },
  }));

  let buttons;
  const buttonY = panel.y + panel.h - 56;
  if (compact) {
    const buttonGap = 10;
    const buttonW = Math.max(
      104,
      Math.floor((layout.contentW - buttonGap * Math.max(0, view.actions.length - 1)) / Math.max(1, view.actions.length))
    );
    buttons = view.actions.map((action, index) => ({
      ...action,
      index,
      rect: {
        x: layout.contentX + index * (buttonW + buttonGap),
        y: buttonY,
        w: buttonW,
        h: 30,
      },
    }));
  } else {
    const buttonMeasure = getMeasureContext("700 13px Segoe UI, Arial");
    let cursorX = layout.contentX + layout.contentW;
    buttons = [...view.actions]
      .reverse()
      .map((action, reverseIndex) => {
        const width = Math.max(132, Math.ceil(buttonMeasure.measureText(action.label).width) + 34);
        cursorX -= width;
        const button = {
          ...action,
          index: view.actions.length - reverseIndex - 1,
          rect: { x: cursorX, y: buttonY, w: width, h: 30 },
        };
        cursorX -= 12;
        return button;
      })
      .reverse();
  }

  return { panel, layout, view, topics, buttons };
}

function drawSidebar(ctx, geometry) {
  const { layout, view, topics } = geometry;
  drawForestSubpanel(ctx, layout.sidebarX, layout.sidebarY, layout.sidebarW, layout.sidebarH, {
    accent: "#536b55",
    fill: "rgba(8, 16, 13, 0.72)",
  });

  ctx.fillStyle = "#d8e7c8";
  ctx.font = "700 13px Segoe UI, Arial";
  ctx.fillText("Quests & Topics", layout.sidebarX + 16, layout.sidebarY + 22);

  topics.forEach((topic) => {
    const selected = topic.index === view.selectedTopicIndex;
    const focused = selected && view.focus === "topics";
    drawForestSubpanel(ctx, topic.rect.x, topic.rect.y, topic.rect.w, topic.rect.h, {
      selected: focused || selected,
      accent: focused ? "#f1d786" : selected ? "#8fdc8b" : "#42584b",
      fill: selected ? "rgba(48, 72, 46, 0.54)" : "rgba(0, 0, 0, 0.26)",
    });
    ctx.fillStyle = getTopicStatusColor(topic.status);
    ctx.fillRect(topic.rect.x + 10, topic.rect.y + 14, 9, 9);
    ctx.fillStyle = "#fff6d8";
    ctx.font = layout.compact ? "700 11px Segoe UI, Arial" : "700 12px Segoe UI, Arial";
    ctx.fillText(topic.title, topic.rect.x + 28, topic.rect.y + 18);
    ctx.fillStyle = "#b7c5cf";
    ctx.font = "11px Segoe UI, Arial";
    ctx.fillText(
      formatTopicStatus(topic.status),
      topic.rect.x + 28,
      topic.rect.y + (layout.compact ? 31 : 33)
    );
  });
}

function drawContent(ctx, geometry) {
  const { panel, layout, view, buttons } = geometry;
  const contentLimitY = buttons.length > 0 ? buttons[0].rect.y - 18 : panel.y + panel.h - 26;
  drawForestSubpanel(ctx, layout.contentX, layout.contentY, layout.contentW, layout.contentH, {
    accent: "#536b55",
    fill: "rgba(8, 16, 13, 0.64)",
  });

  drawStatusTag(ctx, layout.contentX + 18, layout.contentY + 18, view.statusLabel, getModeColor(view.mode));

  ctx.fillStyle = "#f4ead3";
  ctx.font = layout.compact ? "700 22px Georgia, serif" : "700 28px Georgia, serif";
  drawWrappedText(
    ctx,
    view.title,
    layout.contentX + 18,
    layout.contentY + (layout.compact ? 56 : 64),
    layout.contentW - 36,
    layout.compact ? 24 : 30,
    layout.compact ? 3 : 2
  );

  let cursorY = layout.contentY + (layout.compact ? 88 : 92);
  ctx.fillStyle = "#d7e4cf";
  ctx.font = layout.compact ? "12px Segoe UI, Arial" : "13px Segoe UI, Arial";
  for (const line of view.bodyLines || []) {
    const lines = drawWrappedText(
      ctx,
      line,
      layout.contentX + 18,
      cursorY,
      layout.contentW - 36,
      layout.compact ? 17 : 18,
      4
    );
    cursorY += lines.length * (layout.compact ? 17 : 18) + 8;
  }

  if (view.objectives?.length) {
    cursorY = drawObjectiveProgressCard(ctx, geometry, cursorY, contentLimitY);
  }

  if (view.quest?.rewards) {
    ctx.fillStyle = "#fff2d5";
    ctx.font = "700 14px Segoe UI, Arial";
    ctx.fillText("Rewards", layout.contentX + 18, cursorY + 6);
    cursorY += 24;
    ctx.fillStyle = "#bdd6a5";
    ctx.font = layout.compact ? "11px Segoe UI, Arial" : "12px Segoe UI, Arial";
    const rewardLines = layout.compact
      ? formatCompactRewardLines(view.quest.rewards)
      : formatRewardLines(view.quest.rewards);
    rewardLines.forEach((line) => {
      if (cursorY + 16 > contentLimitY) return;
      const wrapped = drawWrappedText(
        ctx,
        line,
        layout.contentX + 18,
        cursorY,
        layout.contentW - 36,
        layout.compact ? 14 : 16,
        2
      );
      cursorY += wrapped.length * (layout.compact ? 14 : 16) + 4;
    });
  }

  buttons.forEach((button) => {
    const selected = button.index === view.selectedActionIndex;
    const focused = selected && view.focus === "actions";
    drawForestButton(ctx, button.rect, {
      selected: focused,
      accent: focused ? button.accent : "#536b55",
      fill: focused ? "#22342d" : "#121920",
    });
    ctx.fillStyle = "#fff6dd";
    ctx.font = "700 13px Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.fillText(button.label, button.rect.x + button.rect.w / 2, button.rect.y + 20);
    ctx.textAlign = "left";
  });

  if (!layout.compact) {
    ctx.fillStyle = "#9db09a";
    ctx.font = "11px Segoe UI, Arial";
    const hintWidth = buttons.length
      ? Math.max(220, buttons[0].rect.x - (layout.contentX + 18) - 16)
      : layout.contentW - 36;
    drawWrappedText(
      ctx,
      "Use Arrow Keys to move through topics, Left/Right or Tab to switch focus, and Enter to confirm.",
      layout.contentX + 18,
      panel.y + panel.h - 26,
      hintWidth,
      14,
      2
    );
  }
}

function drawStatusTag(ctx, x, y, label, color) {
  const measure = getMeasureContext("700 11px Segoe UI, Arial");
  const width = Math.ceil(measure.measureText(label).width) + 22;
  drawForestPill(ctx, x, y, width, 24, label, color, {
    font: "700 11px Segoe UI, Arial",
  });
}

function drawObjectiveProgressCard(ctx, geometry, startY, contentLimitY) {
  const { layout, view } = geometry;
  const objectives = view.objectives || [];
  if (objectives.length === 0) return startY;

  const x = layout.contentX + 18;
  const width = layout.contentW - 36;
  const progress = getObjectiveProgress(view);
  const accent = view.mode === "turn-in" ? "#e6c57e" : view.mode === "offer" ? "#8fdc8b" : "#79b8ff";
  const rowHeight = layout.compact ? 26 : 30;
  const availableRows = Math.max(1, Math.floor((contentLimitY - startY - 56) / rowHeight));
  const visibleObjectives = objectives.slice(0, availableRows);
  const hiddenCount = objectives.length - visibleObjectives.length;
  const height = 38 + visibleObjectives.length * rowHeight + (hiddenCount > 0 ? 20 : 10);

  drawForestSubpanel(ctx, x, startY, width, height, {
    accent,
    fill: "rgba(12, 24, 18, 0.62)",
    footerAccent: accent,
  });
  ctx.fillStyle = "#fff2d5";
  ctx.font = "700 12px Segoe UI, Arial";
  ctx.fillText("Objectives", x + 10, startY + 18);
  ctx.textAlign = "right";
  ctx.fillStyle = view.mode === "turn-in" ? "#ffe4a8" : "#b9c7b5";
  ctx.font = "700 10px Segoe UI, Arial";
  const progressLabel = getObjectiveCardStatusLabel(view, progress);
  ctx.fillText(progressLabel, x + width - 10, startY + 18);
  ctx.textAlign = "left";
  drawProgressRail(ctx, x + 10, startY + 27, width - 20, 5, progress.ratio, accent);

  let rowY = startY + 43;
  visibleObjectives.forEach((objective, index) => {
    const target = Math.max(0, Number(objective.required) || 0);
    const value = Math.max(0, Number(objective.current) || 0);
    const current = target > 0 ? Math.min(value, target) : value;
    const complete = target <= 0 || value >= target;
    const active = index === progress.activeIndex && !complete && view.mode !== "offer";
    const rowAccent = complete ? "#a4de8c" : active ? "#f1d786" : "#71867a";

    ctx.strokeStyle = rowAccent;
    ctx.lineWidth = active ? 2 : 1;
    ctx.strokeRect(Math.round(x + 11) + 0.5, Math.round(rowY + 1) + 0.5, 10, 10);
    if (complete) {
      ctx.strokeStyle = "#eaffd8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 13, rowY + 6);
      ctx.lineTo(x + 16, rowY + 9);
      ctx.lineTo(x + 21, rowY + 3);
      ctx.stroke();
    }
    ctx.lineWidth = 1;

    ctx.fillStyle = complete ? "#a4de8c" : active ? "#fff1c6" : "#d7e4cf";
    ctx.font = layout.compact ? "11px Segoe UI, Arial" : "12px Segoe UI, Arial";
    ctx.fillText(shortenText(objective.label, layout.compact ? 52 : 72), x + 30, rowY + 12);
    ctx.textAlign = "right";
    ctx.fillStyle = complete ? "#d8ffd1" : "#b9c7b5";
    ctx.font = "700 10px Segoe UI, Arial";
    ctx.fillText(`${current}/${objective.required}`, x + width - 12, rowY + 12);
    ctx.textAlign = "left";
    drawProgressRail(ctx, x + 30, rowY + 19, width - 74, 4, getObjectiveRatio(objective), rowAccent);
    rowY += rowHeight;
  });

  if (hiddenCount > 0) {
    ctx.fillStyle = "#9db09a";
    ctx.font = "10px Segoe UI, Arial";
    ctx.fillText(`+${hiddenCount} more objective${hiddenCount > 1 ? "s" : ""}`, x + 10, rowY + 10);
  }

  return startY + height + 12;
}

function getObjectiveProgress(view) {
  const source = view.objectiveProgress;
  if (source) {
    return {
      completed: source.completed || 0,
      total: source.total || 0,
      current: source.current || 0,
      required: source.required || 0,
      activeIndex: Number.isInteger(source.activeIndex) ? source.activeIndex : 0,
      ratio: Math.max(0, Math.min(1, source.percent || 0)),
    };
  }

  const objectives = view.objectives || [];
  let completed = 0;
  let current = 0;
  let required = 0;
  let activeIndex = -1;
  objectives.forEach((objective, index) => {
    const target = Math.max(0, Number(objective.required) || 0);
    const value = Math.max(0, Number(objective.current) || 0);
    current += target > 0 ? Math.min(value, target) : value;
    required += target;
    if (target <= 0 || value >= target) {
      completed += 1;
    } else if (activeIndex < 0) {
      activeIndex = index;
    }
  });
  if (activeIndex < 0 && objectives.length > 0) activeIndex = objectives.length - 1;
  return {
    completed,
    total: objectives.length,
    current,
    required,
    activeIndex,
    ratio: required > 0 ? Math.max(0, Math.min(1, current / required)) : 0,
  };
}

function drawProgressRail(ctx, x, y, width, height, ratio, accent) {
  const clamped = Math.max(0, Math.min(1, ratio || 0));
  ctx.fillStyle = "rgba(2, 7, 7, 0.66)";
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  ctx.fillStyle = accent;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width * clamped), Math.round(height));
  ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width * clamped), 1);
}

function getObjectiveRatio(objective) {
  const target = Math.max(0, Number(objective.required) || 0);
  if (target <= 0) return 1;
  return Math.max(0, Math.min(1, (Number(objective.current) || 0) / target));
}

function shortenText(value, max) {
  const text = String(value || "");
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(1, max - 3))}...`;
}

function getObjectiveCardStatusLabel(view, progress) {
  if (view.mode === "turn-in") return "READY";
  if (progress.total > 1 && progress.completed === 0 && progress.current > 0 && progress.required > 0) {
    return `${progress.current}/${progress.required} PROGRESS`;
  }
  if (progress.total > 1) {
    return `${progress.completed}/${progress.total} COMPLETE`;
  }
  return `${progress.current}/${progress.required}`;
}

function formatRewardLines(rewards) {
  const lines = [];
  const currency = [];
  if (rewards.silver) currency.push(`${rewards.silver} silver`);
  if (rewards.xp) currency.push(`${rewards.xp} XP`);
  if (rewards.talentPoints) currency.push(`${rewards.talentPoints} talent point${rewards.talentPoints > 1 ? "s" : ""}`);
  if (currency.length) lines.push(currency.join("  |  "));

  for (const [itemId, amount] of Object.entries(rewards.items || {})) {
    const item = ITEM_DEFS[itemId];
    lines.push(`${amount}x ${item?.name || itemId}`);
  }

  return lines.length ? lines : ["No rewards."];
}

function formatCompactRewardLines(rewards) {
  const lines = [];
  const currency = [];
  if (rewards.silver) currency.push(`${rewards.silver} silver`);
  if (rewards.xp) currency.push(`${rewards.xp} XP`);
  if (rewards.talentPoints) currency.push(`${rewards.talentPoints} talent point${rewards.talentPoints > 1 ? "s" : ""}`);
  if (currency.length) {
    lines.push(currency.join("  |  "));
  }

  const itemLines = Object.entries(rewards.items || {}).map(([itemId, amount]) => {
    const item = ITEM_DEFS[itemId];
    return `${amount}x ${item?.name || itemId}`;
  });

  if (itemLines.length > 0) {
    const visible = itemLines.slice(0, 2);
    if (itemLines.length > 2) {
      visible.push(`+${itemLines.length - 2} more`);
    }
    lines.push(visible.join("  |  "));
  }

  return lines.length ? lines : ["No rewards."];
}

function getTopicStatusColor(status) {
  switch (status) {
    case "complete":
      return "#f2c67d";
    case "available":
      return "#8fdc8b";
    case "active":
      return "#79b8ff";
    case "service":
      return "#d9bb73";
    default:
      return "#8da0aa";
  }
}

function formatTopicStatus(status) {
  switch (status) {
    case "complete":
      return "Ready to turn in";
    case "available":
      return "Available";
    case "active":
      return "In progress";
    case "service":
      return "Open vendor or altar";
    default:
      return "Conversation";
  }
}

function getModeColor(mode) {
  switch (mode) {
    case "turn-in":
      return "#e6c57e";
    case "offer":
      return "#8fdc8b";
    case "progress":
      return "#79b8ff";
    case "service":
      return "#d9bb73";
    default:
      return "#9bb0be";
  }
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = Infinity) {
  const lines = toWrappedLines(ctx, text, maxWidth, maxLines);
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
  return lines;
}

function toWrappedLines(ctx, text, maxWidth, maxLines = Infinity) {
  const raw = typeof text === "string" ? text.trim() : "";
  if (!raw) return [];

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

  return lines.filter(Boolean).slice(0, maxLines);
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

function getCloseButton(geometry) {
  return {
    action: "close-overlay",
    rect: {
      x: geometry.panel.x + geometry.panel.w - 48,
      y: geometry.panel.y + 16,
      w: 28,
      h: 28,
    },
  };
}

function drawCloseButton(ctx, button, hoverTarget) {
  const hovered = hoverTarget?.action === "close-overlay";
  const { x, y, w, h } = button.rect;
  drawForestCloseButton(ctx, { x, y, w, h }, hovered, { accent: "#d7c28b" });
}

function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

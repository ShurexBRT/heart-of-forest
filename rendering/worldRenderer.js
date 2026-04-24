import { BIOMES, ITEM_DEFS, TALENT_DEFS } from "../data/gameData.js";
import { getInventoryEntries, getUnlockedTalentList } from "../systems/progression.js";
import { getQuestLog, getStationQuests } from "../systems/quests.js";
import { getCurrentRegion, getSelectedPoi, getSelectedRegion } from "../world/worldGen.js";

export function renderWorld(ctx, state) {
  const { viewport } = state;
  const currentRegion = getCurrentRegion(state.world);
  const theme = BIOMES[currentRegion.biomeId].colors;
  state.ui.buttons = [];

  ctx.fillStyle = theme.boundary;
  ctx.fillRect(0, 0, viewport.width, viewport.height);
  drawWorldBackground(ctx, viewport, theme);
  drawRegionMap(ctx, state, viewport);
  drawPanel(ctx, state, viewport);
  drawFooter(ctx, state, viewport);
}

function drawWorldBackground(ctx, viewport, theme) {
  ctx.fillStyle = theme.groundBase;
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  for (let y = 0; y < viewport.height; y += 26) {
    for (let x = 0; x < viewport.width; x += 26) {
      const variant = ((x * 7 + y * 11) % 5);
      ctx.fillStyle = variant <= 1 ? theme.groundDark : variant <= 3 ? theme.groundMid : theme.groundLight;
      ctx.fillRect(x, y, 26, 26);
    }
  }
}

function drawRegionMap(ctx, state, viewport) {
  const mapRect = { x: 20, y: 20, w: viewport.width * 0.62, h: viewport.height - 90 };

  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.fillRect(mapRect.x, mapRect.y, mapRect.w, mapRect.h);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.strokeRect(mapRect.x, mapRect.y, mapRect.w, mapRect.h);

  const regions = state.world.regionOrder.map((id) => state.world.regions[id]);

  for (const region of regions) {
    for (const neighborId of region.neighbors) {
      if (region.index > state.world.regions[neighborId].index) continue;
      const neighbor = state.world.regions[neighborId];
      ctx.strokeStyle = region.discovered || neighbor.discovered ? "rgba(220,240,220,0.2)" : "rgba(120,120,120,0.12)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(region.x, region.y);
      ctx.lineTo(neighbor.x, neighbor.y);
      ctx.stroke();
    }
  }

  ctx.font = "700 30px Segoe UI, Arial";
  ctx.fillStyle = "#f4f7e8";
  ctx.fillText("Heart of Forest", mapRect.x + 18, mapRect.y + 36);
  ctx.font = "13px Segoe UI, Arial";
  ctx.fillStyle = "rgba(244,247,232,0.8)";
  ctx.fillText(`Seed ${state.world.seed}`, mapRect.x + 20, mapRect.y + 58);

  for (const region of regions) {
    const biome = BIOMES[region.biomeId];
    const selected = region.id === state.world.selectedRegionId;
    const current = region.id === state.world.currentRegionId;
    const alpha = region.discovered ? 1 : 0.32;
    const radius = current ? 28 : selected ? 25 : 22;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = biome.colors.groundLight;
    ctx.beginPath();
    ctx.arc(region.x, region.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = current ? "#fff0ad" : selected ? "#dfffd2" : "rgba(0,0,0,0.35)";
    ctx.lineWidth = current ? 4 : 3;
    ctx.beginPath();
    ctx.arc(region.x, region.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    if (region.discovered) {
      ctx.fillStyle = "#f3f6e7";
      ctx.font = "700 12px Segoe UI, Arial";
      ctx.textAlign = "center";
      ctx.fillText(region.name, region.x, region.y + radius + 16);
      ctx.font = "11px Segoe UI, Arial";
      ctx.fillText(`T${region.tier} ${biome.name}`, region.x, region.y + radius + 30);
      ctx.textAlign = "left";
    }

    state.ui.buttons.push({
      id: `region-${region.id}`,
      action: "selectRegion",
      value: region.id,
      x: region.x - radius,
      y: region.y - radius,
      w: radius * 2,
      h: radius * 2,
    });
  }
}

function drawPanel(ctx, state, viewport) {
  const panelX = viewport.width * 0.66;
  const panelW = viewport.width - panelX - 20;
  const panelY = 20;
  const panelH = viewport.height - 90;
  const selectedRegion = getSelectedRegion(state.world);
  const selectedPoi = getSelectedPoi(state.world);
  const currentRegion = getCurrentRegion(state.world);

  ctx.fillStyle = "rgba(7, 10, 11, 0.68)";
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  drawTabs(ctx, state, panelX + 14, panelY + 14, panelW - 28);

  let cursorY = panelY + 64;
  const panel = state.ui.panel;

  if (panel === "map") {
    ctx.fillStyle = "#f4f7e8";
    ctx.font = "700 18px Segoe UI, Arial";
    ctx.fillText(selectedRegion.name, panelX + 16, cursorY);
    cursorY += 18;
    ctx.font = "13px Segoe UI, Arial";
    ctx.fillStyle = "rgba(244,247,232,0.8)";
    ctx.fillText(`${BIOMES[selectedRegion.biomeId].name}  |  Threat ${selectedRegion.tier}`, panelX + 16, cursorY);
    cursorY += 26;

    ctx.fillStyle = "#f6fff1";
    ctx.font = "700 13px Segoe UI, Arial";
    ctx.fillText("Points of Interest", panelX + 16, cursorY);
    cursorY += 18;

    for (const poiId of selectedRegion.poiIds) {
      const poi = state.world.pois[poiId];
      const selected = poi.id === state.world.selectedPoiId;
      drawListButton(ctx, state, {
        id: `poi-${poi.id}`,
        action: "selectPoi",
        value: poi.id,
        label: `${poi.name}${poi.cleared ? " (Cleansed)" : ""}`,
        x: panelX + 16,
        y: cursorY,
        w: panelW - 32,
        h: 36,
        accent: poi.cleared ? "#6fae73" : selected ? "#89e4d7" : "#c9d7b1",
      });
      cursorY += 44;
    }

    cursorY += 8;
    if (selectedRegion.id !== currentRegion.id) {
      drawActionButton(ctx, state, {
        id: "travel-region",
        action: "travelRegion",
        value: selectedRegion.id,
        label: selectedRegion.discovered && currentRegion.neighbors.includes(selectedRegion.id)
          ? `Travel to ${selectedRegion.name}`
          : "Travel unavailable",
        disabled: !(selectedRegion.discovered && currentRegion.neighbors.includes(selectedRegion.id)),
        x: panelX + 16,
        y: cursorY,
        w: panelW - 32,
        h: 38,
      });
      cursorY += 50;
    } else if (selectedPoi && selectedPoi.combat) {
      drawActionButton(ctx, state, {
        id: "enter-poi",
        action: "enterPoi",
        value: selectedPoi.id,
        label: selectedPoi.cleared ? "Already Cleansed" : `Enter ${selectedPoi.name}`,
        disabled: selectedPoi.cleared,
        x: panelX + 16,
        y: cursorY,
        w: panelW - 32,
        h: 38,
      });
      cursorY += 50;
    } else if (selectedPoi && selectedPoi.typeId === "station") {
      drawActionButton(ctx, state, {
        id: "open-station",
        action: "setPanel",
        value: "station",
        label: "Open Waystation Services",
        x: panelX + 16,
        y: cursorY,
        w: panelW - 32,
        h: 38,
      });
      cursorY += 50;
    }

    drawSectionNote(
      ctx,
      panelX + 16,
      cursorY + 8,
      panelW - 32,
      "Travel only between connected discovered regions. Cleansed sites stay reclaimed and feed quests, inventory, and talent growth."
    );
  } else if (panel === "quests") {
    const quests = getQuestLog(state.world);
    ctx.fillStyle = "#f4f7e8";
    ctx.font = "700 18px Segoe UI, Arial";
    ctx.fillText("Quest Log", panelX + 16, cursorY);
    cursorY += 28;

    if (quests.length === 0) {
      drawSectionNote(ctx, panelX + 16, cursorY, panelW - 32, "No accepted quests yet. Visit a Waystation and take on nearby work.");
    } else {
      for (const quest of quests) {
        drawQuestCard(ctx, panelX + 16, cursorY, panelW - 32, 74, quest);
        cursorY += 84;
      }
    }
  } else if (panel === "inventory") {
    ctx.fillStyle = "#f4f7e8";
    ctx.font = "700 18px Segoe UI, Arial";
    ctx.fillText("Inventory", panelX + 16, cursorY);
    cursorY += 28;

    const entries = getInventoryEntries(state.progression);
    for (const entry of entries) {
      drawInventoryRow(ctx, panelX + 16, cursorY, panelW - 32, entry);
      cursorY += 34;
    }

    cursorY += 12;
    ctx.fillStyle = "#fff0c3";
    ctx.font = "700 14px Segoe UI, Arial";
    ctx.fillText(`Talent Points ${state.progression.talentPoints}`, panelX + 16, cursorY);
    cursorY += 18;
    ctx.fillStyle = "rgba(244,247,232,0.72)";
    ctx.font = "12px Segoe UI, Arial";
    ctx.fillText(`Unlocked Talents ${getUnlockedTalentList(state.progression).length}`, panelX + 16, cursorY);
  } else if (panel === "station") {
    const stationPoiId = currentRegion.poiIds.find((poiId) => state.world.pois[poiId].typeId === "station");

    if (!stationPoiId) {
      drawSectionNote(ctx, panelX + 16, cursorY, panelW - 32, "This region has no Waystation. Travel to a reclaimed post to unlock talents and manage quests.");
      return;
    }

    ctx.fillStyle = "#f4f7e8";
    ctx.font = "700 18px Segoe UI, Arial";
    ctx.fillText(state.world.pois[stationPoiId].name, panelX + 16, cursorY);
    cursorY += 28;

    ctx.font = "700 13px Segoe UI, Arial";
    ctx.fillStyle = "#f6fff1";
    ctx.fillText("Quest Board", panelX + 16, cursorY);
    cursorY += 18;

    for (const quest of getStationQuests(state.world, stationPoiId)) {
      const label =
        quest.status === "available"
          ? `Accept: ${quest.title}`
          : quest.status === "completed"
            ? `Claim: ${quest.title}`
            : `${quest.title} (${quest.status})`;
      const action = quest.status === "available" ? "acceptQuest" : quest.status === "completed" ? "claimQuest" : null;

      drawActionButton(ctx, state, {
        id: `quest-${quest.id}`,
        action,
        value: quest.id,
        label,
        disabled: !action,
        x: panelX + 16,
        y: cursorY,
        w: panelW - 32,
        h: 34,
      });
      cursorY += 42;
    }

    cursorY += 6;
    ctx.font = "700 13px Segoe UI, Arial";
    ctx.fillStyle = "#f6fff1";
    ctx.fillText("Talent Altar", panelX + 16, cursorY);
    cursorY += 18;

    for (const talent of TALENT_DEFS) {
      const unlocked = state.progression.talents[talent.id];
      drawActionButton(ctx, state, {
        id: `talent-${talent.id}`,
        action: unlocked ? null : "unlockTalent",
        value: talent.id,
        label: unlocked ? `${talent.name} (Unlocked)` : talent.name,
        disabled: unlocked || state.progression.talentPoints <= 0,
        x: panelX + 16,
        y: cursorY,
        w: panelW - 32,
        h: 34,
      });
      cursorY += 38;
      ctx.fillStyle = "rgba(244,247,232,0.64)";
      ctx.font = "11px Segoe UI, Arial";
      ctx.fillText(talent.description, panelX + 22, cursorY);
      cursorY += 18;
    }
  }

  drawMetaButtons(ctx, state, panelX + 16, panelY + panelH - 48, panelW - 32);
}

function drawTabs(ctx, state, x, y, width) {
  const tabs = [
    { label: "Map", value: "map" },
    { label: "Quests", value: "quests" },
    { label: "Inventory", value: "inventory" },
    { label: "Station", value: "station" },
  ];
  const tabW = (width - 18) / tabs.length;

  tabs.forEach((tab, index) => {
    drawActionButton(ctx, state, {
      id: `panel-${tab.value}`,
      action: "setPanel",
      value: tab.value,
      label: tab.label,
      x: x + index * (tabW + 6),
      y,
      w: tabW,
      h: 32,
      compact: true,
      active: state.ui.panel === tab.value,
    });
  });
}

function drawMetaButtons(ctx, state, x, y, width) {
  drawActionButton(ctx, state, {
    id: "save-game",
    action: "saveGame",
    value: "save",
    label: "Save Expedition",
    x,
    y,
    w: width / 2 - 6,
    h: 34,
    compact: true,
  });

  drawActionButton(ctx, state, {
    id: "new-seed",
    action: "newWorld",
    value: "new",
    label: "New Seed",
    x: x + width / 2 + 6,
    y,
    w: width / 2 - 6,
    h: 34,
    compact: true,
  });
}

function drawFooter(ctx, state, viewport) {
  ctx.fillStyle = "rgba(0,0,0,0.58)";
  ctx.fillRect(0, viewport.height - 58, viewport.width, 58);
  ctx.fillStyle = "#f4f7e8";
  ctx.font = "12px Segoe UI, Arial";
  ctx.fillText(
    "Click regions and points of interest. Tabs switch between map, quest log, inventory, and station services. Save uses browser local storage.",
    20,
    viewport.height - 24
  );

  if (state.ui.message) {
    ctx.fillStyle = "#fff0c3";
    ctx.font = "700 12px Segoe UI, Arial";
    ctx.fillText(state.ui.message, 20, viewport.height - 42);
  }
}

function drawActionButton(ctx, state, button) {
  const disabled = button.disabled;
  const active = button.active;

  ctx.fillStyle = disabled
    ? "rgba(35, 40, 42, 0.7)"
    : active
      ? "rgba(45, 78, 63, 0.92)"
      : "rgba(13, 21, 18, 0.88)";
  ctx.fillRect(button.x, button.y, button.w, button.h);
  ctx.strokeStyle = active ? "#9be89a" : "rgba(255,255,255,0.12)";
  ctx.strokeRect(button.x, button.y, button.w, button.h);
  ctx.fillStyle = disabled ? "rgba(220,220,220,0.42)" : "#f6fff1";
  ctx.font = button.compact ? "700 12px Segoe UI, Arial" : "700 13px Segoe UI, Arial";
  ctx.fillText(button.label, button.x + 12, button.y + button.h / 2 + 4);

  if (!disabled && button.action) {
    state.ui.buttons.push({
      id: button.id,
      action: button.action,
      value: button.value,
      x: button.x,
      y: button.y,
      w: button.w,
      h: button.h,
    });
  }
}

function drawListButton(ctx, state, button) {
  ctx.fillStyle = "rgba(14, 18, 19, 0.72)";
  ctx.fillRect(button.x, button.y, button.w, button.h);
  ctx.fillStyle = button.accent;
  ctx.fillRect(button.x, button.y, 5, button.h);
  ctx.fillStyle = "#f4f7e8";
  ctx.font = "700 13px Segoe UI, Arial";
  ctx.fillText(button.label, button.x + 14, button.y + 22);

  state.ui.buttons.push({
    id: button.id,
    action: button.action,
    value: button.value,
    x: button.x,
    y: button.y,
    w: button.w,
    h: button.h,
  });
}

function drawQuestCard(ctx, x, y, w, h, quest) {
  ctx.fillStyle = "rgba(16, 20, 22, 0.75)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#f6fff1";
  ctx.font = "700 13px Segoe UI, Arial";
  ctx.fillText(quest.title, x + 12, y + 18);
  ctx.fillStyle = "rgba(246,255,241,0.74)";
  ctx.font = "12px Segoe UI, Arial";
  ctx.fillText(quest.description, x + 12, y + 38);
  ctx.fillText(`Status ${quest.status}`, x + 12, y + 58);
}

function drawInventoryRow(ctx, x, y, width, entry) {
  ctx.fillStyle = "rgba(16, 20, 22, 0.72)";
  ctx.fillRect(x, y, width, 28);
  ctx.fillStyle = entry.color || "#f6fff1";
  ctx.fillRect(x, y, 5, 28);
  ctx.fillStyle = "#f6fff1";
  ctx.font = "700 12px Segoe UI, Arial";
  ctx.fillText(entry.name, x + 14, y + 18);
  ctx.textAlign = "right";
  ctx.fillText(String(entry.amount), x + width - 12, y + 18);
  ctx.textAlign = "left";
}

function drawSectionNote(ctx, x, y, width, text) {
  ctx.fillStyle = "rgba(16, 20, 22, 0.68)";
  ctx.fillRect(x, y, width, 54);
  ctx.fillStyle = "rgba(246,255,241,0.72)";
  ctx.font = "12px Segoe UI, Arial";
  wrapText(ctx, text, x + 12, y + 18, width - 24, 16);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line) {
    ctx.fillText(line, x, currentY);
  }
}

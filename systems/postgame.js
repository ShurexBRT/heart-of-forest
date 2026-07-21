import { ITEM_DEFS } from "../data/gameData.js";
import { REGION_DEFS } from "../data/regionData.js";
import { SCENES } from "../data/sceneNetwork.js";
import {
  getPostgameEchoLead,
  getPostgameEchoStatus,
} from "./regions.js";
import { getReliquaryTrialStatus } from "./challenges.js";

const DEFAULT_ECHO_REWARD = { items: { relic_shard: 1 }, silver: 18 };
const STATUS_LINE_LIMIT = 116;

export function getSecondSpringBoardView(
  progression,
  sceneProgress = {},
  day = 1,
  currentSceneId = null
) {
  const currentDay = Math.max(1, Math.floor(day || 1));
  const unlocked = Boolean(progression?.campaign?.campaignCompleted);
  const rows = Object.values(REGION_DEFS).map((region) =>
    buildSecondSpringBoardRow(progression, sceneProgress, region, currentDay)
  );
  const availableRows = rows.filter((row) => row.state === "available");
  const quietRows = rows.filter((row) => row.state === "quiet");
  const lockedRows = rows.filter((row) => row.state === "locked");
  const lead = unlocked
    ? getPostgameEchoLead(progression, sceneProgress, currentSceneId, currentDay)
    : null;
  const leadRow =
    rows.find(
      (row) =>
        row.state === "available" &&
        row.targetSceneId === lead?.targetSceneId
    ) ||
    availableRows[0] ||
    null;
  const reliquaryTrial = getReliquaryTrialStatus(
    progression || {},
    sceneProgress,
    currentDay
  );

  return {
    title: "Second Spring Board",
    unlocked,
    day: currentDay,
    availableCount: availableRows.length,
    quietCount: quietRows.length,
    lockedCount: lockedRows.length,
    lead,
    leadRow,
    reliquaryTrial,
    rows,
    summaryLines: buildSecondSpringBoardLines({
      currentDay,
      unlocked,
      availableRows,
      quietRows,
      lockedRows,
      leadRow,
      reliquaryTrial,
    }),
  };
}

function buildSecondSpringBoardRow(progression, sceneProgress, region, day) {
  const status = getPostgameEchoStatus(
    progression || {},
    sceneProgress,
    region.id,
    day
  );
  const targetSceneId = status.targetSceneId || region.postgameEchoSceneIds?.[0] || null;
  const targetTitle = targetSceneId
    ? SCENES[targetSceneId]?.title || humanizeId(targetSceneId)
    : "Unmarked road";
  const reward = region.echoReward || DEFAULT_ECHO_REWARD;
  const state = !status.unlocked
    ? "locked"
    : status.available
      ? "available"
      : "quiet";

  return {
    regionId: region.id,
    regionName: region.name,
    targetSceneId,
    targetTitle,
    state,
    available: status.available,
    completedToday: status.completedToday,
    reward,
    rewardText: formatReward(reward),
    label:
      state === "available"
        ? "Echo stirring"
        : state === "quiet"
          ? "Quiet today"
          : "Root not fully recovered",
  };
}

function buildSecondSpringBoardLines({
  currentDay,
  unlocked,
  availableRows,
  quietRows,
  lockedRows,
  leadRow,
  reliquaryTrial,
}) {
  if (!unlocked) {
    return [
      "The board is still blank. The roots are waiting for a spring worth reporting.",
      "Restore the six roots and plant the Heartseed; then the Homestead can track daily Corruption Echoes.",
    ];
  }

  const echoWord = availableRows.length === 1 ? "echo" : "echoes";
  const lines = [
    `Day ${currentDay}: ${availableRows.length} ${echoWord} stirring, ${quietRows.length} quiet. Restored regions stay restored when an echo rises.`,
  ];

  if (leadRow) {
    lines.push(
      `Next call: ${leadRow.targetTitle} in ${leadRow.regionName}. Expected offering: ${leadRow.rewardText}.`
    );
  } else {
    lines.push(
      "All tracked echoes are quiet today. Sleep in Ayla's bed to let a new echo surface."
    );
  }

  lines.push(formatReliquaryTrialLine(reliquaryTrial));
  lines.push(...formatStatusLines("Open echoes", availableRows));
  lines.push(...formatStatusLines("Quiet today", quietRows));
  if (lockedRows.length > 0) {
    lines.push(...formatStatusLines("Still untracked", lockedRows));
  }
  return lines;
}

function formatReliquaryTrialLine(status) {
  if (!status?.unlocked) {
    return "Optional trial: Sunken Reliquary is still sealed or uncleansed. Orras' old vault can become a postgame test once it is restored.";
  }

  return status.available
    ? `Optional trial: ${status.targetTitle} is awake today. Clear it for attunement materials and Homestead renewal supplies.`
    : `Optional trial: ${status.targetTitle} is quiet today. Sleep at the Homestead to wake another Reliquary Trial.`;
}

function formatStatusLines(label, rows) {
  if (rows.length === 0) return [`${label}: none.`];

  const parts = rows.map((row) => `${row.regionName} (${row.targetTitle})`);
  const lines = [];
  let current = `${label}: `;
  for (const part of parts) {
    const separator = current.endsWith(": ") ? "" : "; ";
    if (
      current.length + separator.length + part.length > STATUS_LINE_LIMIT &&
      !current.endsWith(": ")
    ) {
      lines.push(`${current}.`);
      current = `${label}: ${part}`;
    } else {
      current += `${separator}${part}`;
    }
  }
  lines.push(`${current}.`);
  return lines;
}

function formatReward(reward) {
  const itemParts = Object.entries(reward.items || {}).map(
    ([itemId, amount]) => `${amount} ${formatItemName(itemId)}`
  );
  const silver = Math.max(0, Math.floor(reward.silver || 0));
  if (silver > 0) itemParts.push(`${silver} silver`);
  return itemParts.join(", ") || "regional materials";
}

function formatItemName(itemId) {
  return ITEM_DEFS[itemId]?.name || humanizeId(itemId);
}

function humanizeId(id) {
  return String(id || "unknown").replaceAll("_", " ");
}

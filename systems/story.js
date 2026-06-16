import { distance } from "../core/math.js";
import { SERVICE_DEFS } from "../data/gameData.js";
import { NPC_DEFS, QUEST_DEFS } from "../data/storyData.js";
import {
  awardRewards,
  getItemCount,
  getPlayerBonuses,
  getQuestCounter,
  incrementQuestCounter,
  removeItem,
  setWorldFlag,
} from "./progression.js";
import { queueAudio } from "./audio.js";
import { openServiceUi } from "./services.js";
import { syncCampaignProgress } from "./campaign.js";

const THORNLING_QUEST_TYPES = new Set(["thornling", "barkling", "blight_hound"]);
const WISP_QUEST_TYPES = new Set(["wisp_archer", "mire_spitter", "cinder_imp", "frost_wisp", "starbound_archer"]);

const INTERACTION_RADIUS = 60;

export function createStoryState() {
  return {
    focus: null,
    prompt: "",
    dialogue: null,
    questPanel: null,
    hovered: null,
    toastText: "",
    toastTimer: 0,
  };
}

export function updateStoryRuntime(state, dt) {
  state.story.toastTimer = Math.max(0, state.story.toastTimer - dt);
  if (state.story.toastTimer <= 0) {
    state.story.toastText = "";
  }
}

export function updateQuestAvailability(state) {
  const progression = state.progression;

  for (const quest of Object.values(QUEST_DEFS)) {
    const status = progression.questStates[quest.id];
    if (status !== "inactive") continue;
    if (quest.prerequisiteId && !isQuestDone(progression, quest.prerequisiteId)) continue;
    if (
      quest.availabilityObjective &&
      getQuestCounter(progression, quest.availabilityObjective.key) <
        quest.availabilityObjective.required
    ) {
      continue;
    }

    if (quest.giverId && state.currentSceneId === quest.sceneId) {
      progression.questStates[quest.id] = "available";
      setToast(state, `Quest Available: ${quest.title}`, 2.1);
      queueAudio(state, "quest");
      continue;
    }

    if (quest.autoActivateSceneId && state.currentSceneId === quest.autoActivateSceneId) {
      progression.questStates[quest.id] = "active";
      setToast(state, `Quest Started: ${quest.title}`, 2.4);
      queueAudio(state, "quest");
    }
  }
}

export function consumeStoryEvents(state) {
  const events = state.storyEvents.splice(0, state.storyEvents.length);
  if (events.length === 0) return;

  for (const event of events) {
    if (event.type === "collect" && event.key) {
      incrementQuestCounter(state.progression, event.key, event.amount || 1);
      if (event.key === "starfallTruthRecovered") {
        setWorldFlag(state.progression, "starfall_truth_recovered", true);
        const sceneProgress = state.sceneProgress?.[state.currentSceneId];
        if (sceneProgress) {
          sceneProgress.cleared = false;
        }
        state.pendingArenaRefresh = true;
      }
    }

    if (event.type === "enemyDefeated") {
      incrementQuestCounter(
        state.progression,
        `enemy_${event.enemyType}_defeated`,
        1
      );
      if (
        state.progression.questStates.thorn_at_gate === "active" &&
        (event.enemyType === "thornling" || event.enemyType === "barkling")
      ) {
        incrementQuestCounter(state.progression, "gateThreatsDefeated", 1);
      }

      if (THORNLING_QUEST_TYPES.has(event.enemyType)) {
        incrementQuestCounter(state.progression, "thornlingsDefeated", 1);
      }

      if (WISP_QUEST_TYPES.has(event.enemyType)) {
        incrementQuestCounter(state.progression, "wispsDefeated", 1);
      }
    }

    if (event.type === "bossDefeated" && event.bossId === "elder_hollow") {
      incrementQuestCounter(state.progression, "elderHollowDefeated", 1);
    }

    if (event.type === "bossDefeated" && event.bossId === "rootwarden") {
      incrementQuestCounter(state.progression, "rootwardenDefeated", 1);
    }

    if (event.type === "bossDefeated" && event.bossId === "rootbound_custodian") {
      incrementQuestCounter(state.progression, "reliquaryKeeperDefeated", 1);
    }

    if (event.type === "bossDefeated" && event.bossId === "bog_matron") {
      incrementQuestCounter(state.progression, "bogMatronDefeated", 1);
    }

    if (event.type === "bossDefeated" && event.bossId === "cinder_warden") {
      incrementQuestCounter(state.progression, "cinderWardenDefeated", 1);
    }

    if (event.type === "bossDefeated" && event.bossId === "veil_seraph") {
      incrementQuestCounter(state.progression, "veilSeraphDefeated", 1);
    }

    if (event.type === "bossDefeated" && event.bossId === "starwoken_sentinel") {
      incrementQuestCounter(state.progression, "starwokenSentinelDefeated", 1);
    }
  }

  refreshQuestStates(state);
}

export function refreshQuestStates(state) {
  const progression = state.progression;

  for (const quest of Object.values(QUEST_DEFS)) {
    if (progression.questStates[quest.id] !== "active") continue;

    const complete = quest.objectives.every((objective) =>
      getQuestCounter(progression, objective.key) >= objective.required
    );

    if (complete) {
      progression.questStates[quest.id] = "complete";
      if (quest.giverId) {
        const giverName = NPC_DEFS[quest.giverId]?.name || "your quest giver";
        setToast(state, `Quest Complete: ${quest.title}. Return to ${giverName}.`, 3);
      } else {
        const rewardSummary = finalizeQuest(state, quest);
        setToast(
          state,
          getQuestCompletionToast(quest, rewardSummary, "Quest Complete"),
          2.8
        );
      }
    }
  }
}

export function getNearestInteractionTarget(state) {
  const candidates = [];

  for (const npc of state.arena.npcs || []) {
    candidates.push({
      kind: "npc",
      data: npc,
      label: npc.name,
      x: npc.x,
      y: npc.y,
      distance: distance(state.player.x, state.player.y, npc.x, npc.y),
    });
  }

  for (const interactable of state.arena.interactables || []) {
    if (interactable.disabled) continue;
    candidates.push({
      kind: "object",
      data: interactable,
      label: interactable.promptLabel,
      x: interactable.x,
      y: interactable.y,
      distance: distance(state.player.x, state.player.y, interactable.x, interactable.y),
    });
  }

  candidates.sort((a, b) => a.distance - b.distance);
  const target = candidates[0];

  if (!target || target.distance > (target.data.interactionRadius || INTERACTION_RADIUS)) {
    state.story.focus = null;
    state.story.prompt = "";
    return null;
  }

  state.story.focus = target;
  state.story.prompt = target.label;
  return target;
}

export function getHoveredInteractionTarget(state, worldX, worldY) {
  const candidates = (state.arena.interactables || [])
    .filter((interactable) => !interactable.disabled)
    .filter((interactable) => {
      const halfW = Math.max(14, (interactable.w || 18) * 0.5);
      const halfH = Math.max(14, (interactable.h || 18) * 0.5);
      return (
        worldX >= interactable.x - halfW &&
        worldX <= interactable.x + halfW &&
        worldY >= interactable.y - halfH &&
        worldY <= interactable.y + halfH
      );
    })
    .map((interactable) => ({
      kind: "object",
      data: interactable,
      label: interactable.promptLabel,
      x: interactable.x,
      y: interactable.y,
      distance: distance(state.player.x, state.player.y, interactable.x, interactable.y),
    }))
    .sort((a, b) => a.distance - b.distance);

  state.story.hovered = candidates[0] || null;
  return state.story.hovered;
}

export function beginInteraction(state, target) {
  if (!target) return false;

  if (target.kind === "npc") {
    openNpcInteraction(state, target.data);
    return true;
  }

  if (target.kind === "object") {
    return useInteractable(state, target.data);
  }

  return false;
}

export function advanceDialogue(state) {
  const dialogue = state.story.dialogue;
  if (!dialogue) return false;

  dialogue.index += 1;

  if (dialogue.index >= dialogue.lines.length) {
    const onClose = dialogue.onClose;
    state.story.dialogue = null;
    if (onClose) onClose(state);
    return true;
  }

  return true;
}

export function closeQuestPanel(state) {
  state.story.questPanel = null;
}

export function getQuestPanelView(state) {
  const panel = state.story.questPanel;
  if (!panel) return null;

  const npcDef = NPC_DEFS[panel.npcId];
  if (!npcDef) return null;

  const topics = buildNpcTopics(state.progression, npcDef);
  const selectedTopicIndex = clampIndex(panel.selectedTopicIndex, topics.length);
  const selectedTopic = topics[selectedTopicIndex] || null;
  const topicState = resolveQuestPanelTopicState(state, npcDef, selectedTopic);
  const selectedActionIndex = clampIndex(panel.selectedActionIndex, topicState.actions.length);

  panel.selectedTopicIndex = selectedTopicIndex;
  panel.selectedActionIndex = selectedActionIndex;
  if (!topics.length) {
    panel.focus = "actions";
  } else if (panel.focus !== "topics" && panel.focus !== "actions") {
    panel.focus = "topics";
  }

  return {
    npcId: npcDef.id,
    npcName: npcDef.name,
    npcRole: npcDef.role,
    palette: npcDef.palette,
    topics,
    selectedTopic,
    selectedTopicIndex,
    selectedActionIndex,
    focus: panel.focus,
    ...topicState,
  };
}

export function moveQuestPanelSelection(state, delta) {
  const view = getQuestPanelView(state);
  if (!view) return false;

  const panel = state.story.questPanel;
  if (view.focus === "topics" && view.topics.length > 0) {
    panel.selectedTopicIndex = wrapIndex(panel.selectedTopicIndex + delta, view.topics.length);
    panel.selectedActionIndex = 0;
    return true;
  }

  if (view.actions.length > 0) {
    panel.selectedActionIndex = wrapIndex(panel.selectedActionIndex + delta, view.actions.length);
    return true;
  }

  return false;
}

export function shiftQuestPanelFocus(state, direction = 1) {
  const view = getQuestPanelView(state);
  if (!view) return false;
  const panel = state.story.questPanel;

  if (!view.topics.length || !view.actions.length) {
    panel.focus = view.actions.length ? "actions" : "topics";
    return true;
  }

  panel.focus = panel.focus === "topics" ? "actions" : "topics";
  if (panel.focus === "actions" && direction < 0) {
    panel.selectedActionIndex = clampIndex(panel.selectedActionIndex, view.actions.length);
  }
  return true;
}

export function activateQuestPanelSelection(state) {
  const view = getQuestPanelView(state);
  if (!view) return false;

  const panel = state.story.questPanel;
  if (panel.focus === "topics" && view.topics.length > 0) {
    if (view.actions.length > 0) {
      panel.focus = "actions";
    }
    return true;
  }

  const action = view.actions[view.selectedActionIndex];
  if (!action || action.disabled) {
    return true;
  }

  switch (action.id) {
    case "accept-quest":
      if (!view.quest) return true;
      state.progression.questStates[view.quest.id] = "active";
      if (view.quest.refreshSceneOnAccept) {
        state.pendingArenaRefresh = true;
      }
      setToast(state, `Quest Started: ${view.quest.title}`, 2.4);
      queueAudio(state, "quest");
      updateQuestAvailability(state);
      refreshQuestStates(state);
      panel.focus = "actions";
      panel.selectedActionIndex = 0;
      return true;
    case "complete-quest":
      if (!view.quest) return true;
      {
        const rewardSummary = finalizeQuest(state, view.quest);
        setToast(
          state,
          getQuestCompletionToast(view.quest, rewardSummary, "Rewards Received"),
          2.6
        );
        updateQuestAvailability(state);
        refreshQuestStates(state);
        panel.focus = "topics";
        panel.selectedActionIndex = 0;
      }
      return true;
    case "open-service":
      closeQuestPanel(state);
      if (action.serviceId) {
        openServiceUi(state, action.serviceId, view.npcName);
      }
      return true;
    case "close-panel":
    default:
      closeQuestPanel(state);
      return true;
  }
}

export function getActiveQuestEntries(progression) {
  return Object.values(QUEST_DEFS)
    .filter((quest) => {
      const status = progression.questStates[quest.id];
      return status === "available" || status === "active" || status === "complete";
    })
    .map((quest) => ({
      ...quest,
      status: progression.questStates[quest.id],
      objectives: quest.objectives.map((objective) => ({
        ...objective,
        current: getQuestCounter(progression, objective.key),
      })),
    }));
}

export function getJournalQuestEntries(progression) {
  const statusOrder = { active: 0, complete: 1, available: 2, done: 3 };
  return Object.values(QUEST_DEFS)
    .filter((quest) => {
      const status = progression.questStates[quest.id];
      return status && status !== "inactive";
    })
    .map((quest, storyOrder) => ({
      ...quest,
      storyOrder,
      status: progression.questStates[quest.id],
      objectives: quest.objectives.map((objective) => ({
        ...objective,
        current: getQuestCounter(progression, objective.key),
      })),
    }))
    .sort((a, b) => {
      const aCurrent = a.chapter === progression.campaign?.activeChapter ? 0 : 1;
      const bCurrent = b.chapter === progression.campaign?.activeChapter ? 0 : 1;
      return (
        aCurrent - bCurrent ||
        (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9) ||
        a.storyOrder - b.storyOrder
      );
    });
}

function openNpcInteraction(state, npc) {
  const npcDef = NPC_DEFS[npc.id];
  if (!npcDef) return;

  if (shouldOpenQuestPanel(state.progression, npcDef)) {
    state.story.dialogue = null;
    state.story.questPanel = {
      npcId: npc.id,
      selectedTopicIndex: 0,
      selectedActionIndex: 0,
      focus: "topics",
    };
    return;
  }

  openNpcDialogue(state, npc, npcDef);
}

function openNpcDialogue(state, npc, npcDef = NPC_DEFS[npc.id]) {
  if (!npcDef) return;

  const progression = state.progression;
  const handledQuest = pickNpcQuest(progression, npc.id);
  let lines = npcDef.dialogue.default || npcDef.dialogue.after || [npc.name];
  let onClose = null;

  if (handledQuest) {
    const status = progression.questStates[handledQuest.id];

    if (status === "available") {
      lines = npcDef.dialogue.intro || lines;
      onClose = () => {
        progression.questStates[handledQuest.id] = "active";
        setToast(state, `Quest Started: ${handledQuest.title}`, 2.4);
        queueAudio(state, "quest");
        maybeOpenNpcService(state, npcDef);
      };
    } else if (status === "active") {
      lines = npcDef.dialogue.progress || lines;
      onClose = () => {
        maybeOpenNpcService(state, npcDef);
      };
    } else if (status === "complete") {
      lines = npcDef.dialogue.complete || lines;
      onClose = () => {
        const rewardSummary = finalizeQuest(state, handledQuest);
        setToast(
          state,
          getQuestCompletionToast(handledQuest, rewardSummary, "Rewards Received"),
          2.4
        );
        queueAudio(state, "quest");
        maybeOpenNpcService(state, npcDef);
      };
    } else {
      lines = npcDef.dialogue.after || lines;
      onClose = () => {
        maybeOpenNpcService(state, npcDef);
      };
    }
  } else if (npcDef.serviceId) {
    onClose = () => {
      maybeOpenNpcService(state, npcDef);
    };
  }

  state.story.dialogue = {
    speakerName: npcDef.name,
    lines,
    index: 0,
    onClose,
  };
  state.story.questPanel = null;
}

function pickNpcQuest(progression, npcId) {
  const quests = Object.values(QUEST_DEFS).filter((quest) => quest.giverId === npcId);
  if (quests.length === 0) return null;

  const priority = ["available", "complete", "active", "inactive", "done"];
  for (const status of priority) {
    const quest = quests.find((entry) => progression.questStates[entry.id] === status);
    if (quest) {
      return quest;
    }
  }

  return quests[0];
}

function useInteractable(state, interactable) {
  if (interactable.serviceId) {
    openServiceUi(state, interactable.serviceId, interactable.name);
    return true;
  }

  if (interactable.disabled) return false;
  if (
    interactable.requiredItemId &&
    getItemCount(state.progression, interactable.requiredItemId) <= 0
  ) {
    setToast(
      state,
      interactable.missingItemText || "You do not have the required item.",
      1.8
    );
    return true;
  }
  if (interactable.requiresCleared && !state.sceneProgress[state.currentSceneId]?.cleared) {
    setToast(state, "Clear the nearby corruption first.", 1.8);
    return true;
  }

  if (
    interactable.consumeItemId &&
    !removeItem(state.progression, interactable.consumeItemId, 1)
  ) {
    setToast(state, "The required item is no longer available.", 1.8);
    return true;
  }

  if (!interactable.repeatable) {
    interactable.disabled = true;
    markSceneObjectState(state, interactable.id);
  }

  if (interactable.collectKey) {
    state.storyEvents.push({ type: "collect", key: interactable.collectKey, amount: 1 });
  }

  if (interactable.dialogueLines) {
    state.story.dialogue = {
      speakerName: interactable.name,
      lines: interactable.dialogueLines,
      index: 0,
      onClose: null,
    };
  }

  if (interactable.action) {
    return { action: interactable.action, interactableId: interactable.id };
  }

  setToast(state, interactable.toastText || `${interactable.name} secured`, 2);
  queueAudio(state, "use-item");
  return true;
}

function markSceneObjectState(state, objectId) {
  if (!state.sceneProgress[state.currentSceneId]) {
    state.sceneProgress[state.currentSceneId] = {};
  }

  const sceneProgress = state.sceneProgress[state.currentSceneId];
  sceneProgress.objectStates = sceneProgress.objectStates || {};
  sceneProgress.objectStates[objectId] = true;
}

function isQuestDone(progression, questId) {
  const status = progression.questStates[questId];
  return status === "done" || status === "complete";
}

function finalizeQuest(state, quest) {
  const progression = state.progression;
  progression.questStates[quest.id] = "done";
  progression.journal = Array.isArray(progression.journal) ? progression.journal : [];
  if (!progression.journal.includes(quest.id)) {
    progression.journal.push(quest.id);
  }
  const rewardSummary = awardRewards(progression, quest.rewards);
  for (const flag of quest.completeFlags || []) {
    setWorldFlag(progression, flag, true);
  }
  if (quest.resetSceneClearOnComplete) {
    const sceneProgress = state.sceneProgress?.[state.currentSceneId];
    if (sceneProgress) {
      sceneProgress.cleared = false;
    }
  }
  if (
    quest.refreshSceneOnComplete ||
    (quest.completeFlags || []).some((flag) => flag.endsWith("_restored"))
  ) {
    state.pendingArenaRefresh = true;
  }
  syncCampaignProgress(progression, state.sceneProgress);
  state.player.refreshFromModifiers(getPlayerBonuses(progression));
  queueAudio(state, rewardSummary.levelsGained > 0 ? "level-up" : "quest");
  return rewardSummary;
}

function getQuestCompletionToast(quest, rewardSummary, fallbackPrefix) {
  if (quest.completeToast) {
    return quest.completeToast;
  }
  return rewardSummary.levelsGained > 0
    ? `${fallbackPrefix}: ${quest.title} - Level up`
    : `${fallbackPrefix}: ${quest.title}`;
}

function maybeOpenNpcService(state, npcDef) {
  if (!npcDef.serviceId) return;
  openServiceUi(state, npcDef.serviceId, npcDef.name);
}

function shouldOpenQuestPanel(progression, npcDef) {
  if (!npcDef) return false;
  if (npcDef.serviceId) return true;
  return getRelevantNpcQuests(progression, npcDef.id).length > 0;
}

function getRelevantNpcQuests(progression, npcId) {
  const statuses = new Set(["complete", "available", "active"]);
  return Object.values(QUEST_DEFS)
    .filter((quest) => quest.giverId === npcId && statuses.has(progression.questStates[quest.id]))
    .sort((a, b) => {
      const aStatus = progression.questStates[a.id];
      const bStatus = progression.questStates[b.id];
      const order = { complete: 0, available: 1, active: 2 };
      return (order[aStatus] ?? 9) - (order[bStatus] ?? 9) || a.title.localeCompare(b.title);
    });
}

function buildNpcTopics(progression, npcDef) {
  const topics = getRelevantNpcQuests(progression, npcDef.id).map((quest) => ({
    kind: "quest",
    questId: quest.id,
    title: quest.title,
    status: progression.questStates[quest.id],
  }));

  if (npcDef.serviceId) {
    const service = SERVICE_DEFS[npcDef.serviceId];
    topics.push({
      kind: "service",
      serviceId: npcDef.serviceId,
      title: service?.title || "Services",
      status: "service",
    });
  }

  if (topics.length === 0) {
    topics.push({
      kind: "talk",
      title: "Conversation",
      status: "talk",
    });
  }

  return topics;
}

function resolveQuestPanelTopicState(state, npcDef, topic) {
  if (!topic) {
    return {
      mode: "after",
      quest: null,
      title: npcDef.name,
      statusLabel: npcDef.role,
      bodyLines: getDialogueLines(npcDef, "after"),
      objectives: [],
      rewardSummary: "",
      actions: [{ id: "close-panel", label: "Close", accent: "#84c5ff" }],
    };
  }

  if (topic.kind === "service") {
    const service = SERVICE_DEFS[topic.serviceId];
    return {
      mode: "service",
      quest: null,
      title: service?.title || "Village Services",
      statusLabel: service?.subtitle || "Services",
      bodyLines: getDialogueLines(npcDef, "after"),
      objectives: [],
      rewardSummary: "",
      actions: [
        { id: "open-service", label: "Open Services", accent: "#84c5ff", serviceId: topic.serviceId },
        { id: "close-panel", label: "Goodbye", accent: "#9bb0be" },
      ],
    };
  }

  if (topic.kind === "talk") {
    return {
      mode: "after",
      quest: null,
      title: npcDef.name,
      statusLabel: npcDef.role,
      bodyLines: getAmbientDialogueLines(state.progression, npcDef),
      objectives: [],
      rewardSummary: "",
      actions: [{ id: "close-panel", label: "Goodbye", accent: "#84c5ff" }],
    };
  }

  const quest = QUEST_DEFS[topic.questId];
  const status = state.progression.questStates[quest.id];
  const objectives = quest.objectives.map((objective) => ({
    ...objective,
    current: getQuestCounter(state.progression, objective.key),
  }));

  if (status === "available") {
    return {
      mode: "offer",
      quest,
      title: quest.title,
      statusLabel: "Available Quest",
      bodyLines: [quest.description, ...getQuestDialogueLines(quest, "intro", npcDef)],
      objectives,
      rewardSummary: describeRewards(quest.rewards),
      actions: [
        { id: "accept-quest", label: "Accept Quest", accent: "#98d18a" },
        { id: "close-panel", label: "Not Now", accent: "#86b8d8" },
      ],
    };
  }

  if (status === "complete") {
    return {
      mode: "turn-in",
      quest,
      title: quest.title,
      statusLabel: "Ready to Turn In",
      bodyLines: getQuestDialogueLines(quest, "complete", npcDef),
      objectives,
      rewardSummary: describeRewards(quest.rewards),
      actions: [
        { id: "complete-quest", label: "Complete Quest", accent: "#e6c57e" },
        { id: "close-panel", label: "Later", accent: "#86b8d8" },
      ],
    };
  }

  return {
    mode: "progress",
    quest,
    title: quest.title,
    statusLabel: "In Progress",
    bodyLines: getQuestDialogueLines(quest, "progress", npcDef),
    objectives,
    rewardSummary: describeRewards(quest.rewards),
    actions: [{ id: "close-panel", label: "Close", accent: "#86b8d8" }],
  };
}

function getDialogueLines(npcDef, key) {
  const primary = npcDef.dialogue?.[key];
  if (Array.isArray(primary) && primary.length > 0) {
    return primary;
  }

  if (Array.isArray(npcDef.dialogue?.default) && npcDef.dialogue.default.length > 0) {
    return npcDef.dialogue.default;
  }

  if (Array.isArray(npcDef.dialogue?.after) && npcDef.dialogue.after.length > 0) {
    return npcDef.dialogue.after;
  }

  return [npcDef.name];
}

function getQuestDialogueLines(quest, key, npcDef) {
  const lines = quest.dialogue?.[key];
  return Array.isArray(lines) && lines.length > 0
    ? lines
    : getDialogueLines(npcDef, key);
}

function getAmbientDialogueLines(progression, npcDef) {
  const stateDialogue = (npcDef.dialogue?.states || []).find(
    (entry) => entry.flag && progression.worldFlags?.[entry.flag]
  );
  if (Array.isArray(stateDialogue?.lines) && stateDialogue.lines.length > 0) {
    return stateDialogue.lines;
  }
  return getDialogueLines(npcDef, "default");
}

function describeRewards(rewards) {
  if (!rewards) return "No rewards.";

  const parts = [];
  if (rewards.silver) parts.push(`${rewards.silver} silver`);
  if (rewards.xp) parts.push(`${rewards.xp} XP`);
  if (rewards.talentPoints) parts.push(`${rewards.talentPoints} Talent Point${rewards.talentPoints > 1 ? "s" : ""}`);
  for (const [itemId, amount] of Object.entries(rewards.items || {})) {
    parts.push(`${amount}x ${itemId}`);
  }
  for (const recipeId of rewards.recipes || []) {
    parts.push(`Recipe: ${recipeId}`);
  }
  return parts.length > 0 ? parts.join("  |  ") : "No rewards.";
}

function clampIndex(index, length) {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(length - 1, index || 0));
}

function wrapIndex(index, length) {
  if (length <= 0) return 0;
  return (index + length) % length;
}

function setToast(state, text, duration) {
  state.story.toastText = text;
  state.story.toastTimer = duration;
}

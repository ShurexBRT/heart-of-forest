import { distance } from "../core/math.js";
import { NPC_DEFS, QUEST_DEFS } from "../data/storyData.js";
import { awardRewards, getQuestCounter, incrementQuestCounter } from "./progression.js";

const INTERACTION_RADIUS = 60;

export function createStoryState() {
  return {
    focus: null,
    prompt: "",
    dialogue: null,
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
    if (!quest.autoActivateSceneId) continue;
    if (progression.questStates[quest.id] !== "inactive") continue;
    if (quest.prerequisiteId && !isQuestDone(progression, quest.prerequisiteId)) continue;
    if (state.currentSceneId !== quest.autoActivateSceneId) continue;

    progression.questStates[quest.id] = "active";
    setToast(state, `Quest Started: ${quest.title}`, 2.4);
  }
}

export function consumeStoryEvents(state) {
  const events = state.storyEvents.splice(0, state.storyEvents.length);
  if (events.length === 0) return;

  for (const event of events) {
    if (event.type === "collect" && event.key) {
      incrementQuestCounter(state.progression, event.key, event.amount || 1);
    }

    if (event.type === "enemyDefeated") {
      if (event.enemyType === "thornling") {
        incrementQuestCounter(state.progression, "thornlingsDefeated", 1);
      }
    }

    if (event.type === "bossDefeated" && event.bossId === "elder_hollow") {
      incrementQuestCounter(state.progression, "elderHollowDefeated", 1);
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
      setToast(state, `Quest Complete: ${quest.title}`, 2.6);
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

export function beginInteraction(state, target) {
  if (!target) return false;

  if (target.kind === "npc") {
    openNpcDialogue(state, target.data);
    return true;
  }

  if (target.kind === "object") {
    useInteractable(state, target.data);
    return true;
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

export function getActiveQuestEntries(progression) {
  return Object.values(QUEST_DEFS)
    .filter((quest) => {
      const status = progression.questStates[quest.id];
      return status === "active" || status === "complete";
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

function openNpcDialogue(state, npc) {
  const npcDef = NPC_DEFS[npc.id];
  if (!npcDef) return;

  const progression = state.progression;
  const handledQuest = Object.values(QUEST_DEFS).find((quest) => quest.giverId === npc.id);
  let lines = npcDef.dialogue.default || npcDef.dialogue.after || [npc.name];
  let onClose = null;

  if (handledQuest) {
    const status = progression.questStates[handledQuest.id];

    if (status === "available") {
      lines = npcDef.dialogue.intro || lines;
      onClose = () => {
        progression.questStates[handledQuest.id] = "active";
        setToast(state, `Quest Started: ${handledQuest.title}`, 2.4);
      };
    } else if (status === "active") {
      lines = npcDef.dialogue.progress || lines;
    } else if (status === "complete") {
      lines = npcDef.dialogue.complete || lines;
      onClose = () => {
        progression.questStates[handledQuest.id] = "done";
        awardRewards(progression, handledQuest.rewards);
        setToast(state, `Rewards Received: ${handledQuest.title}`, 2.4);
      };
    } else {
      lines = npcDef.dialogue.after || lines;
    }
  }

  state.story.dialogue = {
    speakerName: npcDef.name,
    lines,
    index: 0,
    onClose,
  };
}

function useInteractable(state, interactable) {
  if (interactable.disabled) return;
  if (interactable.requiresCleared && !state.sceneProgress[state.currentSceneId]?.cleared) {
    setToast(state, "Clear the nearby corruption first.", 1.8);
    return;
  }

  interactable.disabled = true;
  markSceneObjectState(state, interactable.id);

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

  setToast(state, interactable.toastText || `${interactable.name} secured`, 2);
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

function setToast(state, text, duration) {
  state.story.toastText = text;
  state.story.toastTimer = duration;
}

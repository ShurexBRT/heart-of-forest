import { distance } from "../core/math.js";
import { NPC_DEFS, QUEST_DEFS } from "../data/storyData.js";
import {
  awardRewards,
  getPlayerBonuses,
  getQuestCounter,
  incrementQuestCounter,
  setWorldFlag,
} from "./progression.js";
import { queueAudio } from "./audio.js";
import { openServiceUi } from "./services.js";

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
    const status = progression.questStates[quest.id];
    if (status !== "inactive") continue;
    if (quest.prerequisiteId && !isQuestDone(progression, quest.prerequisiteId)) continue;

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
    }

    if (event.type === "enemyDefeated") {
      if (event.enemyType === "thornling") {
        incrementQuestCounter(state.progression, "thornlingsDefeated", 1);
      }

      if (event.enemyType === "wisp_archer") {
        incrementQuestCounter(state.progression, "wispsDefeated", 1);
      }
    }

    if (event.type === "bossDefeated" && event.bossId === "elder_hollow") {
      incrementQuestCounter(state.progression, "elderHollowDefeated", 1);
    }

    if (event.type === "bossDefeated" && event.bossId === "rootbound_custodian") {
      incrementQuestCounter(state.progression, "reliquaryKeeperDefeated", 1);
    }

    if (event.type === "bossDefeated" && event.bossId === "bog_matron") {
      incrementQuestCounter(state.progression, "bogMatronDefeated", 1);
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
        setToast(state, `Quest Complete: ${quest.title}`, 2.6);
      } else {
        const rewardSummary = finalizeQuest(state, quest);
        setToast(
          state,
          rewardSummary.levelsGained > 0
            ? `Quest Complete: ${quest.title} - Level up`
            : `Quest Complete: ${quest.title}`,
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
      return status === "available" || status === "active" || status === "complete" || status === "done";
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
          rewardSummary.levelsGained > 0
            ? `Rewards Received: ${handledQuest.title} - Level up`
            : `Rewards Received: ${handledQuest.title}`,
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
    return;
  }

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
  queueAudio(state, "use-item");
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
  const rewardSummary = awardRewards(progression, quest.rewards);
  for (const flag of quest.completeFlags || []) {
    setWorldFlag(progression, flag, true);
  }
  state.player.refreshFromModifiers(getPlayerBonuses(progression));
  queueAudio(state, rewardSummary.levelsGained > 0 ? "level-up" : "quest");
  return rewardSummary;
}

function maybeOpenNpcService(state, npcDef) {
  if (!npcDef.serviceId) return;
  openServiceUi(state, npcDef.serviceId, npcDef.name);
}

function setToast(state, text, duration) {
  state.story.toastText = text;
  state.story.toastTimer = duration;
}

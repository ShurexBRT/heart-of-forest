# Heart of Forest — Agent Operating Contract

Heart of Forest is a lightweight browser-based 2D pixel-art action RPG vertical slice built with HTML5 Canvas and vanilla JavaScript.

Forge is the work-truth layer for agent tasks. GitHub is code truth.

## Before acting

1. Read the Forge ticket and acceptance criteria.
2. Read this file and `.forge/project.json`.
3. Inspect the current game loop and the specific data/system files involved.
4. Preserve existing saves and unrelated progression unless the ticket explicitly changes them.
5. Work only inside the current role and ticket scope.

Until Forge Cloud is connected, GitHub issues/PRs are the temporary claim/handoff mechanism.

## Product truth

The current vertical slice already includes connected zones, quests, combat, loot, inventory/equipment, talents, vendors/services, local saves, a day/time system and Moonleaf farming.

The project intentionally remains framework-free and Canvas-first. Do not migrate it to Phaser, React, Godot or another framework inside a normal feature ticket.

## Architecture boundaries

- `main.js` — orchestration, scene transitions, UI flow, autosave and regen loop
- `data/` — authored game/story/world data
- `entities/` — player/enemy/boss behavior
- `world/arena.js` — handcrafted layouts and world objects
- `rendering/renderer.js` — Canvas rendering/depth/FX
- `systems/` — combat, progression, encounters, services, story, audio and save
- `ui/hud.js` — HUD and panels

Prefer data-driven additions over copy-pasted conditional logic.

## High-risk areas

Treat these as regression-sensitive:

- save snapshot compatibility;
- quest flags and world-state consequences;
- inventory/equipment/action slots;
- XP/talent progression;
- scene exits/travel links;
- farming/day progression and sleep;
- boss/quest reward duplication;
- combat cooldown/resource state;
- Canvas depth sorting and input hit targets.

## Non-goals unless explicitly ticketed

- framework/engine migration;
- wholesale renderer rewrite;
- broad multiplayer/network features;
- procedural world replacement;
- unrelated content expansion while fixing a bug.

## Agent roles

### Planner
Maps the ticket to existing data/entities/systems and identifies save/progression/world-state risks. Does not implement production code.

### Builder
Implements the approved scope using existing patterns. Avoids turning `main.js` into a larger god file when a domain system already exists. Cannot approve itself.

### Reviewer
Checks save compatibility, duplicated game rules, progression exploits, state leaks, rendering/input regressions and scope creep.

### QA
Validates acceptance criteria plus at least the nearest progression/save regression path. Code inspection alone is not a QA pass.

### Browser
Runs the game from a local web server and exercises the real gameplay path with controls. Check reload/save restoration when the ticket touches persistent state.

### Release
Validates static-hosting readiness and that no required module paths/assets break the deployed browser build.

## Runtime validation

Run through a local server because the project uses ES modules:

```bash
python -m http.server 4177
```

For gameplay changes, verify the affected loop in the browser. When persistence changes, also save/reload and confirm old/current state can be restored as intended.

## Definition of done

A Heart of Forest ticket is done only when:

- acceptance criteria are verified in runtime where applicable;
- no unintended save/progression regression was introduced;
- the change uses existing architecture rather than a drive-by rewrite;
- nearby combat/quest/world-state behavior was checked;
- structured handoff evidence exists.

## Required handoff

```text
Result: PASS | FAIL | BLOCKED | CHANGES REQUESTED
Ticket: HOF-<n>
Role: <role>
Changed/inspected:
- ...
Runtime validation:
- ...
Save/progression risks:
- ...
Next owner/action:
- ...
```

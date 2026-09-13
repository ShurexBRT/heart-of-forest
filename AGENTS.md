# Heart of Forest — Agent Operating Contract

Heart of Forest is a browser-based 2D pixel-art action RPG built with HTML5 Canvas and vanilla JavaScript. The project is in a **production-polish** phase with a frozen feature scope.

Forge is the work-truth layer for agent tasks. GitHub is code truth.

## Before acting

1. Read the Forge ticket and acceptance criteria.
2. Read this file, `.forge/project.json`, and the current Forge product-direction state.
3. Inspect the current game loop and the specific data/system files involved.
4. Preserve existing saves and unrelated progression unless the ticket explicitly changes them.
5. Work only inside the current role and ticket scope.
6. Treat the Golden Slice and repository README as product truth for the current production pass.

## Product Direction Gate

Heart of Forest is currently `defined` in Forge.

The product identity is:

> Ayla does not conquer the world. She restores it.

Core loop:

```text
Homestead
-> story and preparation
-> regional exploration
-> resources, equipment and side quests
-> regional boss
-> restore the root
-> visibly changed world
-> return home
```

Current scope is frozen. The immediate quality benchmark is the Golden Slice:

```text
Ayla's Homestead
-> Whispering Woods
-> preparation
-> Mossy Ruins
-> Rootwarden
-> Heartwood restoration
-> return to the changed Homestead
```

Before that slice reaches commercial-quality presentation and feel, do **not** add new biomes, fishing, unrelated dungeon branches or speculative systems.

A proposed task should materially improve at least one of:

- combat feel/readability;
- distinct region/enemy/boss identity;
- Homestead -> wounded world -> restoration payoff;
- recognizable and usable UI/UX;
- stability, accessibility, save reliability or performance.

If a request conflicts with this direction or requires a new broad product choice, create a Forge decision request for the PM rather than silently expanding scope.

## Product truth

The existing campaign already contains connected zones, quests, combat, loot, inventory/equipment, talents, vendors/services, save slots, accessibility, gamepad support, a day/time system and Moonleaf farming.

The project intentionally remains framework-free and Canvas-first. Do not migrate it to Phaser, React, Godot or another framework inside a normal feature ticket.

## Architecture boundaries

- `bootstrap.js` — production boot shell, save/accessibility integration and presentation glue
- `main.js` — central runtime state, transitions, input routing and high-level UI flow
- `core/` — game loop, input, math and projection
- `data/` — authored game/story/world data
- `entities/` — player/enemy/boss behavior
- `world/arena.js` — handcrafted layouts, exits, NPCs and interactables
- `rendering/` — Canvas rendering, atlases, terrain, depth sorting and effects
- `systems/` — combat, progression, saves, story, services, farming, regions, navigation, challenges, input feedback, audio and postgame
- `ui/` — HUD and shell panels
- `tests/` — regression coverage
- `scripts/verify.mjs` — syntax + static smoke + automated tests

Prefer data-driven additions over copy-pasted conditional logic.

## High-risk areas

Treat these as regression-sensitive:

- save snapshot/slot/backup compatibility;
- quest flags and restoration/world-state consequences;
- inventory/equipment/action slots;
- XP/talent progression;
- scene exits/travel links;
- farming/day progression and sleep;
- boss/quest reward duplication;
- combat cooldown/resource state;
- gamepad and input-device switching;
- Canvas depth sorting, UI layout and hit targets;
- Golden Slice progression and Rootwarden readability.

## Non-goals unless explicitly product-approved

- new biomes or broad campaign expansion;
- new unrelated feature systems;
- framework/engine migration;
- wholesale renderer rewrite;
- multiplayer/network features;
- procedural world replacement.

## Agent roles

### Planner
Maps the ticket to existing systems, frozen scope and Golden Slice quality goals. Identifies save/progression/world-state risks. If a request would expand or contradict the defined direction, escalates instead of guessing. Does not implement production code.

### Builder
Implements the approved scope using existing patterns. Avoids turning `main.js` into a larger god file when a domain system already exists. Cannot approve itself.

### Reviewer
Checks save compatibility, duplicated game rules, progression exploits, state leaks, rendering/input regressions, Golden Slice regressions, scope creep and unauthorized product expansion.

### QA
Validates acceptance criteria plus the nearest progression/save/input regression path. For Golden Slice work, use the relevant sections of `docs/PLAYTEST_CHECKLIST.md`. Code inspection alone is not a QA pass.

### Browser
Runs the game through a local web server and exercises the real gameplay path with keyboard/mouse or gamepad as required. Check reload/save restoration when the ticket touches persistent state.

### Release
Validates static-hosting readiness, automated verification and applicable manual Golden Slice acceptance gates. Release may not bypass unresolved P0/P1 findings.

## Runtime validation

Run through a local server because the project uses ES modules:

```bash
python -m http.server 4177
```

Run the repository verification gate:

```bash
node scripts/verify.mjs
```

For gameplay changes, verify the affected loop in the browser. When persistence changes, also save/reload and confirm current/backup state can be restored as intended.

## Definition of done

A Heart of Forest ticket is done only when:

- acceptance criteria are verified in runtime where applicable;
- `node scripts/verify.mjs` passes for code changes;
- no unintended save/progression/input regression was introduced;
- the change supports the frozen production-polish direction rather than adding scope;
- nearby combat/quest/world-state behavior was checked;
- relevant manual Golden Slice checks are recorded when needed;
- structured handoff evidence exists.

## Required handoff

```text
Result: PASS | FAIL | BLOCKED | CHANGES REQUESTED
Ticket: HOF-<n>
Role: <role>
Changed/inspected:
- ...
Automated/runtime validation:
- ...
Product-direction dependency:
- none | decision request <topic>
Save/progression/input risks:
- ...
Next owner/action:
- ...
```

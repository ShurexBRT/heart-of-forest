# Heart of Forest

An HTML5 Canvas action RPG prototype that has now grown into a small seeded regional slice. It still centers on Ayla's responsive combat, but now also includes a world map, points of interest, Waystations, quests, talents, inventory rewards, and browser save support.

## Controls

### World Map

- Mouse click: select regions, POIs, tabs, and Waystation actions
- Enter: enter the selected combat POI in the current region

### Combat

- WASD: move
- Mouse: aim
- Left click: Staff Strike
- Right click: Spirit Bolt
- Space: Quick Dash
- 1: Root Snare
- Enter: return to the world map after clearing an encounter
- R: retreat to the world map after defeat

## Implemented Features

- Seeded regional overworld with connected regions, biome assignment, and procedural POI placement
- Four biome themes: forest, marsh, highlands, and blight
- Clickable world map UI with region travel, POI selection, station access, and message feedback
- Waystations that act as safe stops for quest intake, talent unlocking, and save management
- Quest boards generated from nearby POIs with accept, complete, and claim flow
- Inventory reward loop tied to biome loot tables and encounter completion
- Talent system that already modifies player stats and abilities for future encounters
- Browser local-storage save and load
- Procedural combat arenas themed from the selected biome
- Responsive top-down combat with Staff Strike, Spirit Bolt, Quick Dash, and Root Snare
- Spirit economy loop where Staff hits restore Spirit and rooted targets can be primed for stronger follow-up bolts
- Enemy waves, tougher corrupted enemies, and a Heart Guardian boss encounter in lair sites
- Encounter completion returning to the world map instead of hard-resetting the prototype

## How To Run Locally

Because the project uses ES modules, run it from a local web server:

```bash
python -m http.server 4175
```

Then open:

```text
http://localhost:4175/
```

Any open port works; just match the URL to the port you start.

## Code Structure

- `main.js`: top-level game state, world/encounter mode switching, save flow, and UI action routing
- `data/gameData.js`: biome, item, talent, POI, and quest definitions
- `core/input.js`: keyboard and mouse input
- `core/gameLoop.js`: animation loop wrapper
- `core/math.js`: shared math helpers
- `world/worldGen.js`: seeded world graph, biome assignment, POI placement, and encounter context generation
- `world/arena.js`: procedural biome-themed combat arena generation
- `entities/player.js`: Ayla stats, movement, cooldowns, and progression-aware ability values
- `entities/enemy.js`: regular enemy stats and AI states
- `entities/boss.js`: Heart Guardian boss behavior
- `systems/combat.js`: abilities, projectiles, damage, Spirit gain, and combat effects
- `systems/encounter.js`: wave pacing, spawn direction, and boss encounter flow
- `systems/progression.js`: inventory storage, rewards, talent unlocks, and player bonus calculation
- `systems/quests.js`: station quest generation and quest-state updates
- `systems/save.js`: browser save/load snapshot handling
- `systems/particles.js`: particles and impact bursts
- `rendering/renderer.js`: combat arena rendering
- `rendering/worldRenderer.js`: world map, panel UI, and clickable button layout
- `ui/hud.js`: combat HUD, boss bar, banners, and encounter end-state prompts

## Current Scope

This is still a prototype, not a full open-world game. The current target is a clean JS-based vertical slice that proves:

- the combat loop works
- the world-to-encounter-to-reward loop works
- quests, talents, and inventory can already sit on top of the combat foundation
- seeded world generation rules are in place before a future engine migration

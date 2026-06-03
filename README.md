# Heart of Forest

`Heart of Forest` je browser-based 2D pixel-art action RPG slice pravljen u plain HTML5 Canvas + vanilla JavaScript.

Trenutni fokus je na malom, povezanom ARPG vertical slice-u:
- vise mapa
- quest i NPC loop
- inventory, equipment, talents i levelovanje
- hub services i economy osnova
- multi-step quest chain sa mini-dungeon boss zavrsnicom

## Controls

- `WASD`: movement
- `Mouse`: aim
- `Left Click`: Staff Strike
- `Right Click`: Spirit Bolt
- `Space`: Quick Dash
- `1`: Root Snare
- `2`, `3`, `4`: bound action slots
- `5`: Health Potion
- `6`: Spirit Tonic
- `E`: interact / advance dialogue
- `Q`: quest log
- `C`: character panel
- `I`: inventory panel
- `T`: talents panel
- `Tab`: cycle panel tabs
- `Esc`: close open panel
- stand briefly on an exit zone to travel
- `R` or `Enter`: reload scene after defeat

## What Currently Works

- connected zone flow across:
  - `Whispering Woods`
  - `Moonlit Marsh`
  - `Mossy Ruins`
  - `Ember Hollow`
  - `Frostpine Tundra`
  - `Blighted Woods`
  - `Hollowheart Ruins`
  - `Sunken Reliquary`
- hub-style village presentation with NPC interactions
- combat kit:
  - Staff Strike
  - Spirit Bolt
  - Quick Dash
  - Root Snare
- out-of-combat health regeneration
- enemy waves, boss encounters, and elite affixes
- inventory with stackable consumables
- equipment slots:
  - trinket
  - amulet
  - talisman
  - relic
- action slots on `2-4`
- XP, level-ups, talent points, and talent unlocks
- local save via `localStorage`
- quest log, character sheet, inventory, and talents UI
- service UI for:
  - apothecary shop
  - waystone altar
  - village stash
- item rewards, silver currency, usable potions, and buff consumables
- multi-step relic quest chain that opens the `Sunken Reliquary`

## Running Locally

Use a local web server because the project uses ES modules:

```bash
python -m http.server 4177
```

Then open:

```text
http://localhost:4177/
```

## Project Structure

- `main.js`
  - game state, scene transitions, UI flow, autosave, regen loop
- `data/gameData.js`
  - biome, item, service, and talent definitions
- `data/sceneNetwork.js`
  - scene graph and travel links
- `data/storyData.js`
  - quest defs, NPC defs, dialogue, rewards
- `entities/player.js`
  - Ayla movement, buffs, vitals, cooldown model
- `entities/enemy.js`
  - enemy roles and elite affix setup
- `entities/boss.js`
  - boss behavior and summon logic
- `world/arena.js`
  - handcrafted zone layouts, exits, NPCs, quest objects
- `rendering/renderer.js`
  - world rendering, depth sorting, hazards, combat FX, atmosphere
- `ui/hud.js`
  - HUD, quest log, character/inventory/talents/services panels
- `systems/combat.js`
  - combat resolution, loot drops, kill rewards
- `systems/encounter.js`
  - wave pacing, spawn direction, elite rolls
- `systems/progression.js`
  - inventory, equipment, action slots, XP, levels, talents, currency
- `systems/services.js`
  - shop, altar, and stash behavior
- `systems/story.js`
  - quest progression, interactions, dialogue, rewards
- `systems/save.js`
  - local snapshot persistence

## Notes

- The project stays intentionally lightweight and framework-free.
- The render stack is still custom Canvas-first, so some systems are deliberately simple and data-driven.
- Debug helpers are exposed on `window.__heartOfForestDebug` for local iteration.

## Next Logical Step

- clickable inventory and service interactions
- stronger enemy/NPC sprite presentation
- vendor compare tooltips and broader itemization
- tighter quest scripting with more world-state feedback
- more handcrafted dungeon and boss phase polish

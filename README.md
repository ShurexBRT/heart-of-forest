# Heart of Forest

`Heart of Forest` je browser-based 2D pixel-art action RPG slice pravljen u plain HTML5 Canvas + vanilla JavaScript.

Trenutni fokus je na malom, povezanom ARPG vertical slice-u:
- vise mapa
- quest i NPC loop
- inventory, equipment, talents i levelovanje
- hub services i economy osnova
- multi-step quest chains sa vise mini-dungeon boss zavrsnica
- loot, affix, buyback i local save loop

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
  - `Chapel of Tides`
- hub-style village presentation with NPC interactions
- combat kit:
  - Staff Strike
  - Spirit Bolt
  - Quick Dash
  - Root Snare
- out-of-combat health regeneration
- enemy waves, boss encounters, and elite affixes
- enemy roster:
  - `Thornling`
  - `Mire Brute`
  - `Wisp Archer`
  - `Thorn Weaver`
- inventory with stackable consumables
- gear progression with:
  - named drops
  - rolled affix items
  - shop buyback
  - sort/filter inventory and vendor views
- equipment slots:
  - trinket
  - amulet
  - talisman
  - relic
- action slots on `2-4`
- XP, level-ups, talent points, and talent unlocks
- local save via `localStorage`
- quest log, character sheet, inventory, and talents UI
- clickable character / inventory / talent / service panels with hover tooltips
- service UI for:
  - apothecary shop
  - waystone altar
  - village stash
- ambient WebAudio layer with combat, UI, loot, quest, and travel feedback
- item rewards, silver currency, usable potions, and buff consumables
- quest consequence flags that visibly change roads, lanterns, NPC placement, and dungeon access
- multi-step relic / marsh quest chains that open:
  - `Sunken Reliquary`
  - `Chapel of Tides`

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
- `systems/audio.js`
  - lightweight WebAudio ambience and gameplay feedback
- `systems/save.js`
  - local snapshot persistence

## Notes

- The project stays intentionally lightweight and framework-free.
- The render stack is still custom Canvas-first, so some systems are deliberately simple and data-driven.
- Debug helpers are exposed on `window.__heartOfForestDebug` for local iteration.

## Next Logical Step

- richer biome-specific drops and more unique vendor stock
- another handcrafted dungeon branch with its own miniboss
- stronger enemy/NPC sprite identity pass
- more world-state reactions after late-game clears
- optional audio asset swap from synth feedback to authored SFX

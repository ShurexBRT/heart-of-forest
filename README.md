# Heart of Forest

`Heart of Forest` je browser-based 2D pixel-art action RPG slice pravljen u plain HTML5 Canvas + vanilla JavaScript.

Trenutni fokus je na malom, povezanom ARPG vertical slice-u:
- vise mapa
- quest i NPC loop
- inventory, equipment, talents i levelovanje
- hub services i economy osnova
- multi-step quest chains sa vise mini-dungeon boss zavrsnica
- loot, affix, buyback i local save loop
- Enemy & Biome Identity pass za jaci encounter identitet po zoni
- persistent day clock foundation for future homestead, farming, and NPC schedules

## Controls

- `WASD`: movement
- `Mouse`: aim
- `Left Click`: Staff Strike
- `Right Click`: Spirit Bolt
- `Space`: Quick Dash
- `1`: Root Snare
- `R`: Verdant Pulse (unlock in Talents)
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
  - `Ayla's Homestead`
  - `Whispering Woods`
  - `Moonlit Marsh`
  - `Mossy Ruins`
  - `Ember Hollow`
  - `Frostpine Tundra`
  - `Blighted Woods`
  - `Hollowheart Ruins`
  - `Ancient Heart`
  - `Sunken Reliquary`
  - `Chapel of Tides`
  - `Starfall Sanctum`
- hub-style village presentation with NPC interactions
- peaceful homestead scene with six prepared garden plots
- sleep interaction that starts the next day, restores health and spirit, and autosaves
- combat kit:
  - Staff Strike
  - Spirit Bolt
  - Quick Dash
  - Root Snare
  - Verdant Pulse (talent-locked AoE burst that detonates bloom and clears nearby projectiles)
- out-of-combat health regeneration
- enemy waves, boss encounters, and elite affixes
- biome-specific wave templates umesto generickog recikliranja istog rostera po svim mapama
- enemy roster:
  - `Thornling`
  - `Barkling`
  - `Root Stalker`
  - `Mire Brute`
  - `Mire Spitter`
  - `Bog Lurker`
  - `Wisp Archer`
  - `Cinder Imp`
  - `Ash Brute`
  - `Frost Wisp`
  - `Icebound Guardian`
  - `Blight Hound`
  - `Thorn Weaver`
  - `Rot Weaver`
  - `Relic Sentinel`
  - `Starbound Archer`
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
- persistent `Day / Time` clock that pauses in menus and conversations
- quest log, character sheet, inventory, and talents UI
- clickable character / inventory / talent / service panels with hover tooltips
- service UI for:
  - apothecary shop
  - waystone altar
  - village stash
- ambient WebAudio layer with combat, UI, loot, quest, and travel feedback
- item rewards, silver currency, usable potions, and buff consumables
- expanded loot pool with additional pulse-focused trinkets, amulets, talismans, relics, and new consumables
- quest consequence flags that visibly change roads, lanterns, NPC placement, and dungeon access
- multi-step relic / marsh quest chains that open:
  - `Sunken Reliquary`
  - `Chapel of Tides`
- late-game Selka quest chain that opens:
  - `Starfall Sanctum`

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
  - Ayla movement, buffs, vitals, cooldown model, and active ability data
- `entities/enemy.js`
  - enemy roles, biome-specific variants, and elite affix setup
- `entities/boss.js`
  - boss behavior, summon logic, and identity config
- `world/arena.js`
  - handcrafted zone layouts, exits, NPCs, quest objects
- `rendering/renderer.js`
  - world rendering, depth sorting, hazards, combat FX, atmosphere
- `ui/hud.js`
  - HUD, quest log, character/inventory/talents/services panels
- `systems/combat.js`
  - combat resolution, active spells, loot drops, kill rewards
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

- stronger enemy/NPC silhouette polish beyond the current tint-and-telegraph identity pass
- one more handcrafted dungeon branch in the mid-game path
- more world-state reactions after late-game clears
- richer vendor compare UX and clickable drag-and-drop slot assignment
- optional audio asset swap from synth feedback to authored SFX

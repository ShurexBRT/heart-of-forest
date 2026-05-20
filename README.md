# Heart of Forest

`Heart of Forest` je browser-based 2D pixel-art action RPG prototip građen u plain HTML5 Canvas + vanilla JavaScript. Fokus je sada na malom connected-region vertical slice-u: Ayla ima pravi sprite sheet, više povezanih mapa, quest/NPC loop, inventory, opremu, talente, levelovanje i lokalni save.

## Controls

- `WASD`: kretanje
- `Mouse`: aim
- `Left Click`: Staff Strike
- `Right Click`: Spirit Bolt
- `Space`: Quick Dash
- `1`: Root Snare
- `5`: Health Potion
- `6`: Spirit Tonic
- `E`: interakcija / dialogue advance
- `Q`: quest log
- `C`: character tab
- `I`: inventory tab
- `T`: talent tab
- `Esc`: zatvaranje otvorenog UI panela
- stani kratko na exit zonu da pređeš na drugu mapu
- `R` ili `Enter`: restart scene posle poraza

## Implementirano

- connected scene network:
  - `Whispering Woods`
  - `Moonlit Marsh`
  - `Mossy Ruins`
  - `Ember Hollow`
  - `Frostpine Tundra`
  - `Blighted Woods`
  - `Hollowheart Ruins`
  - `Ancient Heart`
- Ayla sprite sheet integracija iz pravog atlasa
- biome environment atlas pipeline sa fallback renderom
- Diablo-style bottom HUD sa HP/Spirit orbovima, ability barom, XP barom i potion slotovima
- quest log na `Q`
- unified `Character / Inventory / Talents` panel
- equipment slotovi:
  - trinket
  - amulet
  - talisman
  - relic
- consumables:
  - `Health Potion`
  - `Greater Health Potion`
  - `Spirit Tonic`
- XP + level sistem
- talent points i unlockable talenti
- local save preko `localStorage`
- health regen kada Ayla nije u combatu
- više NPC-jeva i quest hookova po regionima
- quest rewards koji daju korisne iteme i equipment
- postojeći combat loop ostaje aktivan:
  - Staff Strike
  - Spirit Bolt
  - Quick Dash
  - Root Snare

## Pokretanje

Koristi lokalni web server zbog ES modula:

```bash
python -m http.server 4177
```

Otvori:

```text
http://localhost:4177/
```

## Struktura

- `main.js`
  - game state, scene transitions, UI state, save/load, regen loop
- `data/sceneNetwork.js`
  - definicije mapa i veza između izlaza
- `data/storyData.js`
  - questovi, NPC definicije, dialogue tekst
- `data/gameData.js`
  - biomi, itemi, equipment, talenti
- `world/arena.js`
  - handcrafted scene layout-ovi, spawnovi, quest objekti, NPC placement
- `rendering/renderer.js`
  - isometric-ish tile render, depth sorting, atlas props, combat FX
- `rendering/atlasAssets.js`
  - loading/cropping Ayla sprite sheet-a i biome environment sheet-ova
- `ui/hud.js`
  - Diablo-style HUD, quest log, character/inventory/talent overlay
- `systems/combat.js`
  - ability handling, projectile logic, XP/loot on kill, combat tagging
- `systems/progression.js`
  - inventory, equipment, consumables, xp/level, player bonuses
- `systems/story.js`
  - interaction flow, quest availability/progress/rewards
- `systems/save.js`
  - local storage snapshot helperi

## Sledeći logičan korak

- click-driven inventory/talent UI umesto samo keyboard-first flow
- pravi atlas/sprite sheet za neprijatelje i NPC-jeve
- bolji loot economy i vendor/crafting loop
- dodatni biome-specific hazards i quest scripting
- stabilniji scene-specific encounter pacing i boss phase polish

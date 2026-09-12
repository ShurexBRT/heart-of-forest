# Heart of Forest

`Heart of Forest` je 2D pixel-art action RPG pravljen u plain HTML5 Canvas + vanilla JavaScript.

Igra je usla u **production-polish** fazu. Scope je zamrznut: cilj vise nije dodavanje novih bioma i sistema, nego podizanje postojece kampanje na nivo ozbiljne indie igre kroz combat feel, jasniji enemy/boss identitet, prezentaciju, UI/UX, stabilnost i world restoration payoff.

Glavni identitet igre:

> Ayla ne osvaja svet. Ona ga vraca u zivot.

Core loop:

```text
Homestead
-> prica i priprema
-> istrazivanje regiona
-> resursi, oprema i side questovi
-> regionalni boss
-> obnova korena
-> vidljivo promenjen svet
-> povratak kuci
```

## Controls

### Keyboard & Mouse

- `WASD`: movement
- `Mouse`: aim
- `Left Click`: Staff Strike
- `Right Click`: Spirit Bolt
- `Space`: Quick Dash
- `1`: Root Snare
- `R`: Verdant Pulse / chosen Signature
- `2`, `3`, `4`: bound action slots
- `5`: Health Potion
- `6`: Spirit Tonic
- `E`: interact / advance dialogue / confirm travel
- `L`: quest log
- `C`: character panel
- `I`: inventory panel
- `N`: talents panel
- `Tab`: cycle panel tabs
- `Esc`: pause / close panel

### Gamepad foundation

- Left Stick: movement
- Right Stick: aim
- Right Trigger: Staff Strike
- Left Trigger: Spirit Bolt
- `A`: Dash / confirm
- `X`: Root Snare
- `Y`: Signature
- `LB` / `RB`: contextual bindings
- D-pad: UI navigation foundation
- Start / B: back / pause

Controller mapping is intentionally being hardened during the Golden Slice polish pass before it is treated as final release UX.

## Current Campaign

Connected zone flow:

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

The campaign already includes the Heartwood, Stillwater, Ember, Frost, Scarroot and Rootlight progression, plus optional/postgame systems. No additional region is currently planned before the existing game reaches the target quality bar.

## What Currently Works

### World & progression

- handcrafted connected scenes with gates and persistent world flags
- Homestead hub with NPCs, services and six garden plots
- day/time clock
- sleep and autosave loop
- Moonleaf farming: plant, water, grow, harvest
- quest chains, side quests and optional dungeon content
- regional restoration flags that alter routes, NPC placement and world access
- Field Journal, Bestiary and regional navigation
- Second Spring/postgame foundations

### Combat

- Staff Strike
- Spirit Bolt
- Quick Dash
- Root Snare
- Verdant Pulse and Signature capstones
- hit-stop, knockback, i-frames, screen shake and combat text
- enemy waves and elite affixes
- boss phase transitions and telegraphs
- preparation elixirs and regional damage counters

### Enemy identity

The runtime atlas contains a distinct visual row for every current enemy type and production polish now routes each type to its own atlas identity:

- Thornling
- Barkling
- Root Stalker
- Mire Brute
- Mire Spitter
- Bog Lurker
- Wisp Archer
- Cinder Imp
- Ash Brute
- Frost Wisp
- Icebound Guardian
- Blight Hound
- Thorn Weaver
- Rot Weaver
- Relic Sentinel
- Starbound Archer

Combat roles are also being separated mechanically: ranged spread patterns, support snares, brute ground threats, movement/strafe profiles and biome-specific projectile behavior.

### Boss identity

Regional guardians share common combat foundations but now have distinct signature mechanics:

- Rootwarden — `Root Crown`
- Bog Matron — `Tidewake Crown`
- Cinder Warden — `Ashen Ring`
- Veil Seraph — `Veilfall Halo`
- Elder Hollow — `Single Will`
- Rootbound Custodian — `Vault Lock`
- Starwoken Sentinel — `Sixfold Verdict`

### Character progression

- inventory and stackable consumables
- trinket / amulet / talisman / relic equipment
- named and rolled-affix loot
- item locking and buyback
- equipment comparison
- three action slots
- loadouts
- XP / levels / talent points
- three talent branches and Signature capstones
- gear attunement
- stash, shop, alchemy and waystone services
- Training Grove and DPS drills

### Save & settings

- three isolated local save slots at the persistence layer
- legacy slot-1 compatibility
- automatic backup before overwrite
- corrupt-primary recovery from backup
- settings persistence
- reduced-motion, high-contrast, UI-scale, controller-vibration and aim-sensitivity settings model

The frontend presentation for every new accessibility/save control is still part of the active polish work; backend presence is not treated as finished UX by itself.

### Presentation

- custom Canvas renderer and isometric projection
- directional Ayla, enemy and boss atlases
- biome terrain/material atlases
- depth-sorted actors and props
- combat particles and telegraphs
- biome ambient VFX with a capped particle budget
- root/seed/rune UI chrome shared by major panels
- production boot screen and recoverable fatal-error presentation

### Audio

The current WebAudio synth layer remains a temporary functional fallback. Final authored audio will replace it later.

The exact asset handoff contract lives in:

- `docs/AUDIO_ASSET_SPEC.md`

## Running Locally

Use a local web server because the project uses ES modules:

```bash
python -m http.server 4177
```

Then open:

```text
http://localhost:4177/
```

## Verification

Run the production verification helper with a modern Node.js installation:

```bash
node scripts/verify.mjs
```

It performs syntax checks over source modules and then runs every `tests/*.test.mjs` file.

## Project Structure

- `bootstrap.js`
  - production boot shell and fatal-error presentation
- `main.js`
  - central runtime state, transitions, input routing and high-level UI flow
- `core/`
  - game loop, input, math and projection
- `data/`
  - items, talents, campaign, regions, recipes, navigation, scenes and story definitions
- `entities/player.js`
  - Ayla movement, vitals, cooldowns and ability data
- `entities/enemy.js`
  - enemy roles, identity and combat behavior
- `entities/boss.js`
  - guardian behavior, phase logic and signature mechanics
- `world/arena.js`
  - handcrafted scene layouts, exits, NPCs and interactables
- `rendering/`
  - atlas loading, terrain, world depth sorting, effects and scene rendering
- `ui/`
  - HUD, start/pause/options, quest panel and shared forest chrome
- `systems/`
  - combat, progression, saves, story, services, farming, regions, navigation, challenges, audio and postgame
- `tests/`
  - regression coverage for campaign flow, saves, combat feedback, layout/reachability, assets and progression
- `scripts/verify.mjs`
  - local syntax + test verification runner

## Production Rule

Before release quality is reached, a proposed task should answer at least one of these questions:

1. Does it make combat feel better or read more clearly?
2. Does it make a region/enemy/boss more memorable?
3. Does it strengthen the Homestead -> wounded world -> restoration payoff?
4. Does it make the UI easier or more recognisably Heart of Forest?
5. Does it remove a stability, accessibility, save or performance risk?

If the answer is no, it probably does not belong in the current production pass.

## Current Priority

The quality benchmark is the **Golden Slice**:

```text
Ayla's Homestead
-> Whispering Woods
-> preparation
-> Mossy Ruins
-> Rootwarden
-> Heartwood restoration
-> return to the changed Homestead
```

That slice should feel like a finished commercial game before the same quality standard is propagated across the rest of the campaign.

No new biome, fishing system, extra dungeon branch or unrelated feature is a priority before that benchmark is met. :)

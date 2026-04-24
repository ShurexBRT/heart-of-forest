# Heart of Forest

An HTML5 Canvas prototype focused on a small connected forest region: Ayla can fight through cozy pixel-art clearings, follow paths into neighboring maps, and push toward a boss encounter deeper in the woods.

## Controls

- `WASD`: Move
- `Mouse`: Aim
- `Left Click`: Staff Strike
- `Right Click`: Spirit Bolt
- `Space`: Quick Dash
- `1`: Root Snare
- Stand on a glowing path exit briefly to travel to the next map
- `R` or `Enter`: Restart the current scene after defeat

## Current Focus

This build is intentionally scene-first.

- The prototype opens directly into a handcrafted forest region instead of a detached world-map flow
- Presentation is inspired by cozy pixel-art farm RPGs with light action combat
- Existing combat systems remain in place, but the current emphasis is on readability, layering, environment feel, and moment-to-moment play
- Multiple connected maps now let you walk from the village clearing into shrine, trail, and blight scenes before the boss lair

## Implemented Highlights

- Tile-based connected forest maps with village, trail, shrine, blight, and heart-grove scenes
- Y-depth sorting for Ayla, enemies, and props so movement around scenery reads more like a real RPG scene
- Pixel-art-style placeholder rendering drawn directly in Canvas
- Screen-to-screen path transitions with scene-specific enemy encounters and a final boss area
- Existing combat kit preserved:
  - Staff Strike
  - Spirit Bolt
  - Quick Dash
  - Root Snare
- Enemy waves still active inside the new cozy clearing presentation

## How To Run

Run a local web server because the project uses ES modules:

```bash
python -m http.server 4175
```

Then open:

```text
http://localhost:4175/
```

## Main Files

- `main.js`: boots the scene network, scene transitions, and per-map state
- `data/sceneNetwork.js`: connected map definitions and links between exits
- `world/arena.js`: handcrafted tile-based layouts for each forest scene
- `rendering/renderer.js`: tile rendering, depth sorting, exit markers, and pixel-art-style scene drawing
- `ui/hud.js`: combat HUD, travel prompts, and transition overlays
- `systems/combat.js`: abilities, hits, projectiles, and combat feel
- `entities/player.js`: Ayla movement and combat stats
- `entities/enemy.js`: enemy movement and melee behavior
- `systems/encounter.js`: per-scene wave flow and boss escalation

## Notes

The older world-map/progression foundations are still in the repo, but they are no longer the front-and-center experience in this build. Right now the goal is to make a handful of connected scenes feel like a small real game before expanding outward again.

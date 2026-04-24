# Heart of Forest

An HTML5 Canvas prototype focused on one polished playable scene: a cozy forest village clearing where Ayla fights off corrupted creatures with light action RPG combat.

## Controls

- `WASD`: Move
- `Mouse`: Aim
- `Left Click`: Staff Strike
- `Right Click`: Spirit Bolt
- `Space`: Quick Dash
- `1`: Root Snare
- `R` or `Enter`: Restart the clearing after victory or defeat

## Current Focus

This build is intentionally scene-first.

- The prototype now opens directly into a handcrafted forest clearing instead of a world-map flow
- Presentation is inspired by cozy pixel-art farm RPGs with light action combat
- Existing combat systems remain in place, but the current emphasis is on readability, layering, environment feel, and moment-to-moment play

## Implemented Highlights

- Tile-based forest clearing with cottage, fences, paths, well, rocks, lanterns, and forest edges
- Y-depth sorting for Ayla, enemies, and props so movement around scenery reads more like a real RPG scene
- Pixel-art-style placeholder rendering drawn directly in Canvas
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

- `main.js`: bootstraps the direct playable clearing scene
- `world/arena.js`: handcrafted tile-based village clearing layout
- `rendering/renderer.js`: tile rendering, depth sorting, pixel-art-style scene drawing
- `ui/hud.js`: combat HUD and restart prompts
- `systems/combat.js`: abilities, hits, projectiles, and combat feel
- `entities/player.js`: Ayla movement and combat stats
- `entities/enemy.js`: enemy movement and melee behavior

## Notes

The older world-map/progression foundations are still in the repo, but they are no longer the front-and-center experience in this build. Right now the goal is to make the first playable scene feel like a small real game before expanding outward again.

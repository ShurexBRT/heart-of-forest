# Heart of Forest

A small, polished HTML5 Canvas gameplay prototype for a 2D top-down action RPG. This is intentionally a single-room combat feel demo, not a full game.

## Controls

- WASD: move
- Mouse: aim
- Left click: Staff Strike
- Right click: Spirit Bolt
- Space: Quick Dash
- 1: Root Snare
- R: restart after victory or defeat

## Implemented Features

- Smooth 8-direction movement with acceleration, deceleration, dash burst, and obstacle collision
- Ayla, a readable white-hood forest guardian placeholder character
- Staff Strike melee arc with hit flash, stun, knockback, particles, and light screen shake
- Staff Strike restores Spirit on hit and primes rooted enemies for a stronger follow-up Spirit Bolt
- Spirit Bolt projectile with travel, spirit cost, cooldown, obstacle collision, and impact feedback
- Quick Dash with a short invulnerability window and afterimage feedback
- Root Snare short-range nature skill with visible vines and enemy root effect
- One forest clearing arena with textured grass, solid trees, rocks, and readable room bounds
- Two enemy types: basic corrupted creatures and a slower tankier brute
- Enemy AI states for idle, wander, chase, attack windup, and recover
- Minimal HUD with HP, Spirit, ability cooldowns, cleared state, game over state, and restart

## How To Run Locally

Because the prototype uses ES modules, run it from a tiny local web server:

```bash
python -m http.server 4174
```

Then open:

```text
http://localhost:4174/
```

## Code Structure

- `main.js`: game state, reset flow, camera, resize handling, update/render wiring
- `core/input.js`: keyboard and mouse input
- `core/gameLoop.js`: fixed browser animation loop wrapper
- `core/math.js`: shared math helpers
- `entities/player.js`: Ayla movement, stats, cooldowns, dash state
- `entities/enemy.js`: enemy stats and AI states
- `systems/combat.js`: abilities, projectiles, root snare, damage, knockback, enemy spacing
- `systems/collision.js`: circle vs obstacle and boundary collision
- `systems/particles.js`: simple particle bursts and updates
- `world/arena.js`: arena dimensions, spawn points, trees, and rocks
- `rendering/renderer.js`: Canvas world rendering and visual effects
- `ui/hud.js`: HP, Spirit, cooldowns, and end-state messages

## Scope Notes

The prototype deliberately avoids quests, inventory, saves, dialogue, shops, networking, and content pipelines. The focus is moment-to-moment movement, combat readability, and code that can later be ported to a game engine such as Godot.

# Heart of Forest Prototype

A small playable top-down action RPG prototype built with plain HTML5 Canvas, CSS, and vanilla JavaScript.

## How to run
Just extract the ZIP and open `index.html` in your browser.

## Controls
- **WASD** = move
- **Mouse** = aim
- **Left Click** = Staff Strike
- **Right Click** = Spirit Bolt
- **Space** = Quick Dash
- **1** = Root Snare
- **R** = Restart

## Implemented features
- Smooth 8-direction movement with acceleration/deceleration
- Collision with forest obstacles and room bounds
- Staff Strike melee hit with feedback
- Spirit Bolt projectile
- Quick Dash with invulnerability window
- Root Snare area control
- Two enemy types with readable behavior
- Minimal UI for HP, Spirit, cooldowns
- Area-cleared and game-over states
- Particles, hit feedback, and light screenshake

## Short explanation of architecture
The prototype is intentionally lightweight and uses a single JavaScript file for easy local execution.
Inside that file, the logic is separated by responsibility:
- input handling
- player state and abilities
- enemy AI
- projectile and root ability handling
- collision
- rendering
- UI
- game loop and state reset

This keeps the prototype simple to run now, while still being easy to split into modules later.

## Next logical improvements
1. Split `game.js` into modules (`player`, `enemies`, `combat`, `world`, `ui`, `loop`)
2. Improve enemy attack tells and behavior variety
3. Add proper sprite art instead of canvas placeholders
4. Add sound effects and music
5. Add better arena composition and level transitions
6. Tune balance for ability costs, damage, and enemy pressure

## 3 biggest weaknesses of the prototype
1. Visuals are still placeholder-style despite being polished enough to read clearly
2. Enemy AI is readable but still fairly simple and predictable
3. Everything is in one JS file for reliability, not ideal long-term architecture

# Player Art Direction

Ayla should read as the forest keeper first, then as a staff fighter and spell
caster. Her sprite needs to feel more polished than a generic hooded NPC without
becoming so noisy that combat telegraphs disappear around her.

## Shape Language

- White hood and dark face slit are the instant player read.
- Green leaf mantle and cloak mark her as Heartwood, not a generic mage.
- Staff must be taller than the body and readable from all four facings.
- Staff glow communicates magic/cast state; dash trails stay renderer-side or
  sprite-side only as short readable streaks.
- Feet and bottom anchor stay stable so collision, shadows and world sorting do
  not drift.

## Current Implementation

- The production Ayla pass uses a generated bitmap sheet at
  `assets/characters/ayla-v2-game-sheet.png`.
- `assets/characters/ayla-v2-generated-source.png` keeps the generated chroma
  key source, while `assets/characters/ayla-v2-generated-transparent.png` keeps
  the cleaned transparent source sheet for future recuts.
- The old `assets/atlases/ayla-sprite.png` remains useful as the original
  concept/portrait reference, but its labeled concept-sheet layout should not be
  re-enabled directly for player animation.
- `rendering/pixelAssets.js` still has a procedural Ayla fallback for the first
  frames before the bitmap atlas is loaded or if loading fails.

## Pose Requirements

| Pose | Visual Read |
|---|---|
| Idle | Calm hooded keeper with staff and soft spirit glow. |
| Walk | Same silhouette with small foot/hem motion and stable anchor. |
| Cast | Hood lifts slightly, staff light cools toward white/teal, small motes appear. |
| Attack | Staff side commits forward without hiding Ayla's head read. |
| Dash | Cloak hem lifts and teal streaks support the movement effect. |

## Future Animation Pass

- Start from `assets/characters/ayla-v2-generated-transparent.png` or the
  normalized v2 game sheet, not from the old labeled concept atlas.
- Generate one cleaner strip for each facing and pose family if we need more
  authored walk/cast animation.
- Normalize every frame to fixed 128x128 cells with the current bottom-center
  anchor before swapping renderer indices.
- Preview Ayla next to Thornling, Wisp Archer and one brute before accepting the
  sheet, because player/enemy contrast matters more than isolated prettiness.

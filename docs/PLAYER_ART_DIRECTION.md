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

- The production Ayla pass is procedural in `rendering/pixelAssets.js`.
- `buildAylaSprite` is intentionally separate from the NPC actor builder, so
  future player animation work can improve Ayla without changing NPC silhouettes.
- The old Ayla atlas remains disabled as a reference because it still carries
  concept-sheet artifacts and would make the player look less consistent in
  motion.
- Renderer now treats the procedural Ayla sprite as the source of truth.

## Pose Requirements

| Pose | Visual Read |
|---|---|
| Idle | Calm hooded keeper with staff and soft spirit glow. |
| Walk | Same silhouette with small foot/hem motion and stable anchor. |
| Cast | Hood lifts slightly, staff light cools toward white/teal, small motes appear. |
| Attack | Staff side commits forward without hiding Ayla's head read. |
| Dash | Cloak hem lifts and teal streaks support the movement effect. |

## Future Bitmap Pass

- Start from the accepted procedural frame rather than the old atlas.
- Generate one clean strip for each facing and pose family.
- Normalize every frame to the current bottom-center anchor before swapping the
  renderer to bitmap.
- Preview Ayla next to Thornling, Wisp Archer and one brute before accepting the
  sheet, because player/enemy contrast matters more than isolated prettiness.

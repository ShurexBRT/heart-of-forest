# Enemy Art Direction

Heart of Forest enemies should read by gameplay role first and biome identity second. The player should understand the threat before reading a nameplate.

## Shape Language

- Small melee enemies use low, forward-leaning silhouettes.
- Brutes use wide shoulders, heavy hands, and grounded feet.
- Ranged enemies float or hold a clear projectile tool.
- Support enemies stand upright with staff, orb, roots, or ritual details.
- Elite/status rings and windup markers stay renderer-side; sprite detail must not hide telegraphs.

## Enemy Roster

| Enemy | Role | Visual Direction |
|---|---|---|
| Thornling | Melee | Low thorn-seed creature with red core, green spikes, and quick lunge posture. |
| Barkling | Melee | Stout bark-plated stump creature with root feet and muted green growth. |
| Wisp Archer | Ranged | Floating forest spirit archer with pale face, blue-green cloak, and bright wisp projectile. |
| Root Stalker | Support | Root-priest caster with green hood, bark staff, leaf accents, and healing/root signal. |
| Mire Brute | Melee | Heavy marsh brawler with reed/plate shoulders, mud body, and teal mire glow. |
| Mire Spitter | Ranged | Swamp spitter with reed fins, toxin sac, and blowpipe/spit projectile silhouette. |
| Bog Lurker | Melee | Low amphibian-root brute with flatter body, marsh fins, and webbed teal accents. |
| Ash Brute | Melee | Charred ember hulk with cracked lava core, hot shoulders, and heavy flaming hands. |
| Cinder Imp | Ranged | Small ember caster with horn/flame crown, quick body, and warm projectile glow. |
| Icebound Guardian | Melee | Frost golem with ice shoulder plates, crystal crown, and pale blue impact read. |
| Frost Wisp | Ranged | Snow spirit archer with icicle crown, cold trail, and bright frost projectile. |
| Blight Hound | Melee | Fast corrupted root hound with long low body, purple spikes, and snapping snout. |
| Thorn Weaver | Support | Corrupted thorn caster with purple hood, thorn crown, staff, and green orb. |
| Rot Weaver | Support | Scarroot rot caster with mushroom caps, violet tendrils, and amber rot-orb. |
| Relic Sentinel | Melee | Ancient stone idol with gold runes, slab body, and astral glyph chest. |
| Starbound Archer | Ranged | Rootlight archer with star halo, violet cloak, and golden astral bow. |

## Boss Roster

Bosses should feel like the same world as the v1 enemy sheet, but with larger
silhouettes, stronger biome ownership, and one unmistakable story motif each.

| Boss | Region | Visual Direction |
|---|---|---|
| Rootwarden | Heartwood | Massive bark guardian with branch crown, moss growth, thorn lanes, and old oath light. |
| Bog Matron | Stillwater | Wide marsh matriarch with reed crown, waterline skirt, teal oath glow, and drowned-mask face. |
| Cinder Warden | Ember | Heavy furnace knight with ember core, horned helm, charred armor, and hot gauntlets. |
| Veil Seraph | Frost | Floating frost herald with pale veil, wing shapes, ice halo, and sealed-message calm. |
| Elder Hollow | Scarroot | Twisted hollow-root sovereign with antler crown, purple command core, and corrupted tendrils. |
| Rootbound Custodian | Reliquary | Vault construct bound by roots, slab shoulders, crossed seals, and astral-gold lock light. |
| Starwoken Sentinel | Rootlight | Tall archive judge with spire halo, star core, orbit shards, and luminous verdict posture. |

## Current Implementation

- The production pass now uses `assets/enemies/enemy-v1-directional-game-sheet.png`
  for all 16 roster enemy types, loaded through `rendering/atlasAssets.js`.
- The sheet follows the fixed 128x128 cell lesson from Ayla v3: 16 rows by
  enemy type, 4 columns for down/right/left/up.
- The AI concept sources are preserved in `assets/enemies/` as the original
  full roster concept plus four grouped directional source sheets.
- `rendering/pixelAssets.js` remains the deterministic procedural fallback if
  the bitmap atlas is unavailable.
- Runtime feel polish may add windup charge ticks, role-colored motes and
  recover dust over the sprite. These are readability effects, not sprite-sheet
  replacements.
- No combat numbers, AI, radius, damage, spawn rules, or quest progression are changed.
- Future animation passes can add extra walk/windup frames per facing, but must
  preserve the same row/type and facing order unless the loader is updated.
- Boss production sprites now use
  `assets/bosses/boss-v1-directional-game-sheet.png`, loaded through
  `rendering/atlasAssets.js` with the same fixed 128x128, down/right/left/up
  directional contract as enemies.
- `assets/bosses/boss-v1-directional-metadata.json` records the row order and
  bottom-center anchor. `scripts/generate-boss-sprites.mjs` is the deterministic
  generator for this first production pass.

## Accepted Concept Translation

- Thornling, Barkling and Blight Hound now keep different small-enemy
  silhouettes: spiked seed, stump creature and long corrupted hound.
- Mire Brute, Bog Lurker, Ash Brute, Icebound Guardian and Relic Sentinel now
  read as separate body plans instead of one recolored brute.
- Wisp Archer, Mire Spitter, Cinder Imp, Frost Wisp and Starbound Archer now
  show their ranged tool clearly: bow, toxin spit, fire orb, frost bow or
  astral bow.
- Root Stalker, Thorn Weaver and Rot Weaver now carry a staff/orb support
  language with root, thorn or fungal details.
- Runtime tint overlays should not recolor normal enemy sprites once the
  sprite profile already owns the biome palette; hit flash remains renderer-side.

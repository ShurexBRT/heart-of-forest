# Heart of Forest — Audio Asset Specification

This document is the handoff contract for final authored audio. The current WebAudio synth layer stays as a fallback until these assets are supplied and integrated.

## Delivery format

- Preferred master format: WAV, 48 kHz, 24-bit.
- Stereo for music, ambience, large environmental events and wide boss effects.
- Mono preferred for point-source combat, footsteps, enemy vocals and UI effects.
- Leave 3–6 dB of clean headroom; do not brickwall or normalize every file to the same loudness.
- No baked reverb on short point-source SFX unless the reverb is a deliberate part of the sound identity.
- Seamless ambience/music loops must have clean loop points.
- Naming: lowercase kebab-case, no spaces.
- Variants use `-01`, `-02`, `-03` suffixes.

## 1. Player combat

These are the highest-priority files because they define moment-to-moment feel.

### Staff
- `player-staff-whoosh-01.wav`
- `player-staff-whoosh-02.wav`
- `player-staff-impact-light-01.wav`
- `player-staff-impact-light-02.wav`
- `player-staff-impact-heavy-01.wav`
- `player-staff-bloom-proc.wav`

Direction: dry wood, wrapped leather, living-root resonance. Avoid generic metal sword impact.

### Spirit Bolt
- `player-spirit-bolt-cast-01.wav`
- `player-spirit-bolt-cast-02.wav`
- `player-spirit-bolt-flight-loop.wav`
- `player-spirit-bolt-impact-01.wav`
- `player-spirit-bolt-impact-02.wav`

Direction: airy, glassy and organic rather than sci-fi laser.

### Dash
- `player-dash-start-01.wav`
- `player-dash-start-02.wav`
- `player-dash-end.wav`

Direction: cloth + leaves + short root/air displacement.

### Root Snare
- `player-root-cast.wav`
- `player-root-emerge-01.wav`
- `player-root-emerge-02.wav`
- `player-root-break.wav`

### Pulse / Signatures
- `player-verdant-pulse-charge.wav`
- `player-verdant-pulse-release.wav`
- `player-signature-thornwarden.wav`
- `player-signature-spiritweaver.wav`
- `player-signature-rootcaller.wav`

### Player state
- `player-hit-light-01.wav`
- `player-hit-light-02.wav`
- `player-hit-heavy.wav`
- `player-low-health-pulse.wav`
- `player-heal.wav`
- `player-death.wav`
- `player-level-up.wav`

## 2. Enemy combat families

Every family needs a recognisable vocal/movement language. Reuse within a family is fine; reuse across families should be rare.

For each family below provide, ideally, 2–3 variants for alert/hit/death and one attack cue:

### Heartwood
- Thornling: `thornling-alert-*`, `thornling-attack-*`, `thornling-hit-*`, `thornling-death-*`
- Barkling: `barkling-alert-*`, `barkling-attack-*`, `barkling-hit-*`, `barkling-death-*`
- Root Stalker: `root-stalker-cast-*`, `root-stalker-mend-*`, `root-stalker-hit-*`, `root-stalker-death-*`
- Thorn Weaver: `thorn-weaver-cast-*`, `thorn-weaver-mend-*`, `thorn-weaver-hit-*`, `thorn-weaver-death-*`

### Stillwater
- Mire Spitter: `mire-spitter-cast-*`, `mire-spitter-projectile-*`, `mire-spitter-hit-*`, `mire-spitter-death-*`
- Bog Lurker: `bog-lurker-alert-*`, `bog-lurker-attack-*`, `bog-lurker-hit-*`, `bog-lurker-death-*`
- Mire Brute: `mire-brute-windup-*`, `mire-brute-slam-*`, `mire-brute-hit-*`, `mire-brute-death-*`

### Ember
- Cinder Imp: `cinder-imp-cast-*`, `cinder-imp-projectile-*`, `cinder-imp-hit-*`, `cinder-imp-death-*`
- Ash Brute: `ash-brute-windup-*`, `ash-brute-slam-*`, `ash-brute-hit-*`, `ash-brute-death-*`

### Frost
- Frost Wisp: `frost-wisp-cast-*`, `frost-wisp-projectile-*`, `frost-wisp-hit-*`, `frost-wisp-death-*`
- Icebound Guardian: `ice-guardian-windup-*`, `ice-guardian-slam-*`, `ice-guardian-hit-*`, `ice-guardian-death-*`

### Scarroot
- Blight Hound: `blight-hound-alert-*`, `blight-hound-pounce-*`, `blight-hound-hit-*`, `blight-hound-death-*`
- Rot Weaver: `rot-weaver-cast-*`, `rot-weaver-mend-*`, `rot-weaver-hit-*`, `rot-weaver-death-*`

### Rootlight
- Relic Sentinel: `relic-sentinel-alert-*`, `relic-sentinel-attack-*`, `relic-sentinel-hit-*`, `relic-sentinel-death-*`
- Starbound Archer: `starbound-archer-cast-*`, `starbound-archer-shot-*`, `starbound-archer-hit-*`, `starbound-archer-death-*`

A single neutral fallback set can remain for rare cases, but final gameplay should not route all enemies through one `enemy-hit` and `enemy-down` sound.

## 3. Bosses

Every boss needs four layers: presence, common attacks, signature, phase/defeat.

### Rootwarden
- `boss-rootwarden-intro.wav`
- `boss-rootwarden-slam.wav`
- `boss-rootwarden-volley.wav`
- `boss-rootwarden-eruption.wav`
- `boss-rootwarden-root-crown.wav`
- `boss-rootwarden-phase.wav`
- `boss-rootwarden-defeat.wav`

### Bog Matron
- `boss-bog-matron-intro.wav`
- `boss-bog-matron-slam.wav`
- `boss-bog-matron-volley.wav`
- `boss-bog-matron-eruption.wav`
- `boss-bog-matron-tidewake-crown.wav`
- `boss-bog-matron-phase.wav`
- `boss-bog-matron-defeat.wav`

### Cinder Warden
- `boss-cinder-warden-intro.wav`
- `boss-cinder-warden-slam.wav`
- `boss-cinder-warden-volley.wav`
- `boss-cinder-warden-eruption.wav`
- `boss-cinder-warden-ashen-ring.wav`
- `boss-cinder-warden-phase.wav`
- `boss-cinder-warden-defeat.wav`

### Veil Seraph
- `boss-veil-seraph-intro.wav`
- `boss-veil-seraph-slam.wav`
- `boss-veil-seraph-volley.wav`
- `boss-veil-seraph-eruption.wav`
- `boss-veil-seraph-veilfall-halo.wav`
- `boss-veil-seraph-phase.wav`
- `boss-veil-seraph-defeat.wav`

### Elder Hollow
- `boss-elder-hollow-intro.wav`
- `boss-elder-hollow-slam.wav`
- `boss-elder-hollow-volley.wav`
- `boss-elder-hollow-eruption.wav`
- `boss-elder-hollow-single-will.wav`
- `boss-elder-hollow-phase.wav`
- `boss-elder-hollow-defeat.wav`

### Rootbound Custodian
- `boss-rootbound-custodian-intro.wav`
- `boss-rootbound-custodian-slam.wav`
- `boss-rootbound-custodian-volley.wav`
- `boss-rootbound-custodian-eruption.wav`
- `boss-rootbound-custodian-vault-lock.wav`
- `boss-rootbound-custodian-phase.wav`
- `boss-rootbound-custodian-defeat.wav`

### Starwoken Sentinel
- `boss-starwoken-sentinel-intro.wav`
- `boss-starwoken-sentinel-slam.wav`
- `boss-starwoken-sentinel-volley.wav`
- `boss-starwoken-sentinel-eruption.wav`
- `boss-starwoken-sentinel-sixfold-verdict.wav`
- `boss-starwoken-sentinel-phase.wav`
- `boss-starwoken-sentinel-defeat.wav`

## 4. Footsteps and surface response

Provide 4–6 short variants per surface. The runtime should round-robin/randomise them with pitch variation kept subtle.

- `footstep-grass-*`
- `footstep-soil-*`
- `footstep-stone-*`
- `footstep-wood-*`
- `footstep-water-shallow-*`
- `footstep-snow-*`
- `footstep-ash-*`
- `footstep-ancient-stone-*`

Optional but valuable:
- `dash-surface-grass.wav`
- `dash-surface-water.wav`
- `dash-surface-snow.wav`
- `dash-surface-ash.wav`

## 5. World interaction

- `collect-herb-*`
- `collect-relic-*`
- `plant-seed.wav`
- `water-plot.wav`
- `harvest-moonleaf.wav`
- `sleep-start.wav`
- `sleep-wake.wav`
- `brew-start.wav`
- `brew-complete.wav`
- `attune-item.wav`
- `equip-item.wav`
- `use-potion.wav`
- `stash-open.wav`
- `waystone-activate.wav`
- `travel-confirm.wav`
- `gate-locked.wav`
- `quest-available.wav`
- `quest-complete.wav`
- `region-restoration.wav`
- `heartseed-plant.wav`

## 6. UI

Keep these short and soft. The interface should sound carved/organic, not like a mobile app.

- `ui-hover-01.wav`
- `ui-confirm-01.wav`
- `ui-back.wav`
- `ui-error.wav`
- `ui-tab.wav`
- `ui-slider-tick-01.wav`
- `ui-inventory-move.wav`
- `ui-item-lock.wav`
- `ui-map-open.wav`
- `ui-journal-open.wav`

## 7. Ambience loops

Target 60–120 second seamless stereo loops when practical.

- `ambience-homestead-loop.wav`
- `ambience-heartwood-loop.wav`
- `ambience-marsh-loop.wav`
- `ambience-highlands-loop.wav`
- `ambience-ember-loop.wav`
- `ambience-frost-loop.wav`
- `ambience-blight-loop.wav`
- `ambience-ancient-loop.wav`
- `ambience-reliquary-loop.wav`
- `ambience-restored-grove-loop.wav`

Optional one-shots layered by runtime:
- birds, branch creaks, frogs, distant water, ember crackles, wind gusts, ice stress, corrupted whispers, ancient chimes.

## 8. Music

The game needs one memorable musical identity, not a large generic fantasy library.

### Core themes
- `music-main-theme.wav` — title and identity statement.
- `music-homestead-day.wav` — warm home motif.
- `music-homestead-restored.wav` — developed version of the home motif.
- `music-exploration-heartwood.wav`
- `music-exploration-stillwater.wav`
- `music-exploration-ember.wav`
- `music-exploration-frost.wav`
- `music-exploration-scarroot.wav`
- `music-exploration-rootlight.wav`

### Combat
Either separate tracks or compatible stems:
- `music-combat-heartwood.wav`
- `music-combat-stillwater.wav`
- `music-combat-ember.wav`
- `music-combat-frost.wav`
- `music-combat-scarroot.wav`
- `music-combat-rootlight.wav`

### Boss / narrative
- `music-boss-guardian.wav` — may be stem-based and region-coloured at runtime.
- `music-boss-final.wav`
- `music-restoration-stinger.wav`
- `music-ending.wav`
- `music-second-spring.wav`

Preferred composition rule: the same short melodic seed should be recognisable in title, Homestead, restoration and ending material. That gives Heart of Forest a musical identity instead of unrelated fantasy tracks.

## 9. Integration priority

When audio arrives, integrate in this order:

1. Player combat + player hit/death.
2. Rootwarden + Heartwood enemy family.
3. Footsteps for Golden Slice surfaces.
4. Heartwood/Homestead ambience.
5. UI confirm/back/error.
6. Main/Homestead/Heartwood music.
7. Region restoration stinger.
8. Remaining enemy families and bosses.
9. Remaining regional ambience/music.
10. Postgame audio.

## Minimum Golden Slice delivery

If only one audio batch is produced first, this is enough to replace procedural audio in the first polished vertical slice:

- Staff: 6 files listed above.
- Bolt: 5 files.
- Dash: 3 files.
- Root Snare: 4 files.
- Player hit/death/heal: 5–6 files.
- Thornling, Barkling, Root Stalker, Thorn Weaver: attack/hit/death variants.
- Rootwarden: 7 boss files.
- Grass/soil/stone footsteps: 4 variants each.
- Collect, plant, water, harvest, brew, travel, quest complete, region restoration.
- Homestead + Heartwood ambience loops.
- Main theme, Homestead track, Heartwood exploration/combat, Guardian boss track, restoration stinger.

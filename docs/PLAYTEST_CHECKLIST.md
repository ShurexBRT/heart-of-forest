# Heart of Forest — Golden Slice Playtest Checklist

This checklist is the human quality gate for the production-polish branch.

Golden Slice under test:

```text
Ayla's Homestead
-> Hearthroot / first Moonleaf
-> Whispering Woods
-> preparation
-> Mossy Ruins
-> Rootwarden
-> Heartwood restoration
-> return to changed Homestead
```

The first pass is intentionally blind. Do not read the detailed QA expectations before completing it.

---

## Pass A — Blind Player Run

### Setup

- Use a fresh empty save slot.
- Use normal motion and normal contrast first.
- Pick one primary input method for the run: Keyboard & Mouse or Gamepad.
- Do not use debug helpers or inspect quest data.
- Do not read Pass B until the run is complete.

### Player questions

Record short answers immediately after the run:

1. Within the first 2 minutes, did you understand who Ayla is and what you should do first?
2. Did you ever stop because you did not know where to go next?
3. Did preparation before Rootwarden feel useful or like mandatory busywork?
4. Could you identify what Rootwarden was about to do before the dangerous attacks landed?
5. Did any attack feel unavoidable or unfair?
6. Did Staff, Bolt, Dash, Root and Pulse/Signature feel meaningfully different?
7. Did damage, cooldown and low-Spirit states read clearly during combat?
8. When Heartwood was restored, did it feel like a meaningful event rather than a quest flag changing?
9. On returning home, did you notice that the world had changed without being told where to look?
10. What was the weakest or most prototype-like moment in the slice?
11. What was the strongest moment?
12. Would you voluntarily keep playing after returning to the Homestead?

### Blind-run stop conditions

Stop and record a blocker immediately if any of these happen:

- progression cannot continue without reload or debug intervention;
- player becomes trapped by collision or an unreachable route;
- save/continue loses meaningful progress;
- an overlay cannot be closed with the active input method;
- boss damage occurs without a readable warning;
- game becomes unresponsive or throws the production fatal-error panel;
- a required local asset is missing or renders as an obvious broken placeholder.

---

## Pass B — Directed QA

Run this only after Pass A is complete.

### 1. Boot and start flow

- [ ] Boot screen resolves into the title screen without console-visible fatal errors.
- [ ] New Game starts at Ayla's Homestead.
- [ ] Continue reflects the selected save slot rather than another slot.
- [ ] Save Slots shows three isolated slots and readable scene/day/level summaries.
- [ ] Empty slots are clearly distinguished from existing adventures.

### 2. Golden Slice progression

- [ ] Hearthroot establishes the first objective clearly.
- [ ] First Moonleaf requires plant -> water -> rest/grow -> harvest in understandable order.
- [ ] Completing the first harvest opens the road to Whispering Woods.
- [ ] The gate-threat quest advances from actual enemy defeats.
- [ ] Barkskin preparation becomes available at the correct story point.
- [ ] Preparing for the ruins opens the route to Mossy Ruins.
- [ ] Rootwarden appears and the encounter can complete normally.
- [ ] Rootwarden defeat resolves the first regional restoration state.
- [ ] `heartwood_restored` opens the intended onward road.
- [ ] Returning to Homestead shows the restored-world variant.

### 3. Rootwarden combat readability

Test at least one full fight without intentionally face-tanking mechanics.

- [ ] Slam wind-up is readable before impact.
- [ ] Volley direction/spread is readable and dodgeable.
- [ ] Eruption hazards expose their danger area before activation.
- [ ] Root Crown has a discoverable safe gap rather than requiring damage trading.
- [ ] Phase escalation is noticeable without becoming visual noise.
- [ ] Add pressure does not hide boss telegraphs.
- [ ] No single normal mechanic feels like an unexplained one-shot.
- [ ] Death/retry leaves the encounter in a valid state.

### 4. Combat feel

- [ ] Staff Strike feels immediate at close range.
- [ ] Spirit Bolt has a clear projectile/readable resource cost.
- [ ] Dash gives a clear movement and invulnerability response.
- [ ] Root Snare visibly changes enemy movement/control.
- [ ] Pulse or chosen Signature communicates ready/not-ready state.
- [ ] Damage numbers match the Accessibility toggle.
- [ ] Heavy hits are visually stronger than routine hits.
- [ ] Low health is readable without making the screen unusable.
- [ ] Screen shake never prevents reading boss telegraphs.

### 5. Gamepad pass

Repeat at least Homestead -> first combat -> one NPC interaction -> one travel transition with a controller.

- [ ] Input-device toast appears when the controller takes over.
- [ ] Left Stick moves Ayla without drift inside the deadzone.
- [ ] Right Stick aim is stable and sensitivity changes are noticeable.
- [ ] RT = Staff, LT = Bolt, A = Dash, X = Root, Y = Pulse/Signature.
- [ ] Combat keyline appears above the Canvas HUD without covering health, Spirit or ability slots.
- [ ] Combat keyline correctly shows cooldown, Need SP, Locked and Signature charge states.
- [ ] RB prompt appears for NPC/object interaction.
- [ ] Holding RB confirms an unlocked travel exit.
- [ ] Temporary controller guide does not cover the bottom combat HUD.
- [ ] Save Slots can be opened with View/Select on the title screen.
- [ ] Accessibility can be opened with LB on frontend screens.
- [ ] D-pad navigates shell controls.
- [ ] A activates focused controls.
- [ ] B/Start closes shell panels or backs out appropriately.
- [ ] Haptics occur for supported events without constant rumble spam.
- [ ] Disabling Controller Vibration immediately prevents gameplay haptics.

### 6. Accessibility pass

- [ ] Reduced Motion removes ambient motes and strongly reduces burst motion.
- [ ] Reduced Motion also suppresses screen shake as intended.
- [ ] Re-enabling normal motion restores the previous/expected shake level.
- [ ] High Contrast visibly improves shell readability.
- [ ] Damage Numbers can be disabled and re-enabled during the same session.
- [ ] Tutorial Hints controls the temporary controller guide.
- [ ] Aim Sensitivity persists and affects controller aim.
- [ ] Accessibility controls are usable with both mouse/keyboard and gamepad.

`uiScale` is deliberately not a release checkbox yet. The model exists, but it must not be accepted as a gameplay accessibility feature until Canvas rendering and Canvas hit-testing scale together.

### 7. Save reliability

Use a disposable test slot for destructive cases.

- [ ] Autosave/normal save preserves current scene, progression, inventory and clock.
- [ ] Each overwrite leaves a valid previous backup.
- [ ] Switching slots never leaks progression into another slot.
- [ ] Reload + Continue resumes the selected slot.
- [ ] A corrupt primary with a valid backup self-heals from that backup.
- [ ] Recovery displays one clear non-blocking notice.
- [ ] Merely viewing Save Slots does not invent data in an empty slot.

### 8. Restoration payoff

- [ ] First Heartwood restoration shows the world-event banner once.
- [ ] Banner copy fits without clipping at the tested viewport.
- [ ] Reduced Motion removes unnecessary banner animation.
- [ ] Returning to Homestead produces a visible state difference.
- [ ] The changed Homestead is readable as consequence, not just decoration.
- [ ] Old already-restored flags do not replay milestone banners on normal load.

### 9. Visual/performance sanity

Test at the smallest intended desktop viewport and one normal 1080p-class viewport.

- [ ] No controller presentation element covers critical HUD information.
- [ ] No major panel is clipped beyond usable bounds.
- [ ] Combat remains readable with boss + adds + particles active.
- [ ] Reduced Motion produces a visibly calmer scene.
- [ ] Particle effects disappear after their lifetime rather than accumulating.
- [ ] Scene transitions do not show missing atlases, broken sprites or obvious flashes of unstyled UI.
- [ ] No sustained hitching is observed during Rootwarden signatures.

### 10. Audio acceptance — after authored assets are integrated

Use `docs/AUDIO_ASSET_SPEC.md` as the source of truth.

- [ ] Homestead ambience/music establishes safety without masking UI or dialogue cues.
- [ ] Whispering Woods communicates the shift from home to danger.
- [ ] Rootwarden music/signature audio makes phase escalation easier to read.
- [ ] Staff/Bolt/Dash/Root feedback is distinct without becoming fatiguing.
- [ ] Player hurt is immediately recognisable.
- [ ] Boss defeat has a clear release/payoff moment.
- [ ] Heartwood restoration audio supports the visual milestone rather than competing with it.
- [ ] Music and SFX volume controls persist between reloads.

---

## Pass C — Release Decision

Classify every finding:

- **P0 Blocker** — cannot progress, save loss, crash/fatal boot, broken input path.
- **P1 Major** — unfair combat, unreadable required telegraph, controller path incomplete, major UI obstruction.
- **P2 Polish** — noticeable quality issue that does not block the slice.
- **P3 Later** — valid improvement outside the frozen Golden Slice scope.

### Golden Slice can leave draft only when

- [ ] zero P0 findings remain;
- [ ] zero unresolved P1 findings remain;
- [ ] automated `Verify Golden Slice` is green on the candidate head;
- [ ] authored Golden Slice audio batch is integrated and checked;
- [ ] at least one blind Keyboard & Mouse run is complete;
- [ ] at least one controller run is complete;
- [ ] save recovery was manually exercised once;
- [ ] Heartwood restoration payoff was observed from a fresh progression path;
- [ ] remaining P2/P3 findings are explicitly accepted rather than forgotten.

Do not merge because the branch "feels mostly done." Merge when the slice survives this checklist and the automated gate together.

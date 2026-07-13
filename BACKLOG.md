# BACKLOG — Grid Sings

## Now (M1 — "The Grid Sings")
- [x] Repo + Netlify site created, index.html deployed — github.com/mattohara42/TouchSynth + touchsynth.netlify.app; manual deploys only (`netlify deploy` → draft, `--prod` publishes; Matt decides when) (2026-07-12)
- [x] Clear-grid control: hold ✕ button (bottom-right, ~1s) with progress ring; ripples on wipe (pulled forward from M2)
- [x] 16×16 grid rendered on Canvas, fullscreen, dark background
- [x] Tap-to-toggle cells (touch + mouse), scroll/zoom prevented on grid
- [x] Tone.js Transport 16-step loop at ~110 BPM
- [x] Pentatonic mapping, bottom = low, top = high, single soft pluck/marimba voice
- [x] Playhead sweep visual
- [x] Ripple animation on note trigger (the star — budget polish time here)
- [x] "Tap anywhere to begin" gate to unlock AudioContext
- [x] Ripple cap (96 max, oldest dropped) so long sessions don't leak

## Next (M2 candidates — decide after M1 ships)
- [x] Bounce mode + mode seam: engine strategies in MODES{}, switcher = 2 buttons bottom-left (2026-07-12)
- [x] Random mode: light hops dot-to-dot in placement order, 1 hop per 8th note (2026-07-12)
- [x] 2–3 layers with simple layer switcher (big buttons, not the original's 16) — 3 layers, all sound at once, dice-dot switcher bottom-center (2026-07-12)
- [x] Tempo control (hidden/grown-up area?) — grown-up panel: 3s hold in top-left corner opens tempo slider (60–180) + clear-all + done (2026-07-12)

## Next (M3 candidates — brainstormed 2026-07-12)
- [x] Multi-touch: all active pointers tracked in a Map; membrane bulge follows every finger (2026-07-12)
- [x] Mirror painting: grown-up panel select — off / left-right echo / kaleidoscope (4-way); partners follow the tapped cell's new state via shared setCell() (2026-07-12)
- [x] Per-layer voices: marimba / soft pluck / FM glass bells, one PolySynth per layer into the shared limiter (2026-07-12 — NOT heard by human ears yet, see Smells)
- [x] Draw mode: 4th mode button (squiggle icon) — dragging paints dots that play like Score and evaporate after ~4 loops; taps in Draw evaporate too; mirror painting applies to trails (2026-07-12)
- [ ] Attract mode plays real tunes: ghost patterns kids recognize (Twinkle Twinkle, Frère Jacques) instead of abstract sine/arpeggio — stronger lure to walk up
- [x] Attract homage presets: Roygbiv-shaped rise-fall contour (score) + sparse Autechre polyrhythm (bounce, periods 12/9/6/4); attract patterns now carry their own mode (2026-07-12 — kept at session tempo, not 90 BPM: attract shouldn't silently change a saved tempo)
- [ ] Teaching tool: info blob in the GROWN-UP panel (kid surface stays text-free) — "who makes music like this" card with link-out. On the wall panel a tappable link is useless (kiosk) — render a QR code so a parent scans it with their phone. Full roster (Matt: include them all; loves Reich), grouped:
  - Lineage: Toshio Iwai (Tenori-on designer, Electroplankton), Laurie Spiegel (Music Mouse), Brian Eno (Bloom), Kraftwerk
  - Sound: Steve Reich (Six Marimbas, Music for 18 Musicians), Terry Riley (In C), gamelan tradition
  - Warmth: Boards of Canada, Mort Garson (Plantasia), Raymond Scott (Soothing Sounds for Baby), Lullatone, Plaid, Sakamoto/YMO, Aphex Twin (Flim, Avril 14th), Squarepusher (Tommib), Autechre (as process: Bounce-mode polyrhythms)
- [x] Night palette: 20:00-07:00 — candy inks dimmed to 55%, darker background, master -8 dB, sprites regenerated; checked every minute (2026-07-12; hours fixed, ponytail comment marks the panel-setting upgrade path)
- [x] Per-layer loop length (the Steve Reich feature): a layer looping at 15 or 17 steps drifts in and out of phase with a 16-step layer, à la Piano Phase / Clapping Music — grown-up panel sliders, kid surface unchanged, faithful to the Tenori-on's per-layer loop points (2026-07-12)
- [x] Scale swap (grown-up panel): major pentatonic / minor pentatonic / hirajoshi select; colors follow scale degree so the candy palette works for all (2026-07-12; whole-tone dropped — 6 notes doesn't fit the 5-degree color/scale system)
- [x] Swing: grown-up panel slider 0-50%, Tone.Transport.swing @ 16n (2026-07-12)
- [ ] Remaining Tenori-on modes via the MODES seam: Push (lit cell sustains while held), Solo (cells sound while touched — theremin for the pre-pattern age group)
- [x] The Eno switch: "garden" select in grown-up panel — one dot grown/pruned on the active layer every 8 bars (floor 3, cap 24, never touches an empty grid — attract owns that); evolved pattern persists across reboots (2026-07-12)

## Later / Ideas
- [x] Rubber UI Tier 2 — grid as soft membrane: ripples displace/scale nearby cells, springy playhead glow band with overshoot, bounce-ball squash on floor impact, squishy depress-and-boing buttons (Tier 1 — spring fn, inflate/deflate on toggle, squash on fire, finger bulge — shipped 2026-07-12; Tier 2 shipped same day)
- [x] Rubber UI Tier 3 — gummy material look: warm aubergine background, candy palette by pitch class, pre-rendered glossy cell sprites (no per-frame gradients/shadowBlur on the panel), rounder corners + idle cells as small dots, ripple rings in the note's own color (2026-07-12)
- [x] If the look goes candy (Tier 3), revisit voice to match — marimba-ish (2026-07-12)
- [x] Idle attract mode: after 2 min untouched + empty grid, ghost places/holds/dissolves preset patterns; any tap evicts it (2026-07-12)
- [ ] Grown-up mode toggle exposing full depth (more layers, more modes, voices)
- [ ] Instrument voice selection
- [x] Save/load patterns: localStorage on every mutation, restored+validated on boot (dots inflate in); Firestore still deferred until sharing between devices matters (2026-07-12)
- [ ] Per-kid pattern slots (echoes Cast & Type profile idea)
- [ ] Sound: evaluate faithfulness to original Tenori-on voices — explicitly punted, wall panel doesn't need it
- [ ] Naming: "Grid Sings" is a working title. Candidates: Lumen, Ripple, ___
- [ ] Volume strategy for kitchen/wall placement (time-of-day aware? panel hardware volume?)

## Smells / Watch items
- FM bell voice (layer 3) volume set to -14 dB by ear-less arithmetic — NOBODY has heard the three voices together; listen and rebalance before the panel goes on a wall.
- Loudness with 3 dense layers: all layers share one -8 dB synth into the -3 dB limiter; heavy patterns on all three could pump the limiter. Listen on the panel; if it squashes, drop synth volume ~3 dB.

## Assumptions log
- (Claude Code: when proceeding unattended on an ambiguous decision, record it here with date + rationale)
- 2026-07-12: Layers (faithful reading, per Claude's stated default that Matt greenlit): 3 layers, ALL audible simultaneously, each with its OWN mode; you edit one at a time. Mode buttons show/set the active layer's mode. Switcher = 3 dice-dot circle buttons bottom-center (1/2/3 dots — no reading required). Switching layers inflates the incoming layer's cells so the swap is legible.
- 2026-07-12: Non-active layers render as half-size dim candy dots (alpha 0.32) so a kid can see something else is singing and find it; their ripples and cell-squash still appear (the sound leaves a visual trace), but their bounce balls / random lights don't render — only the active layer gets full mode visuals, like the original.
- 2026-07-12: Hold-✕ clears the ACTIVE layer only (never nukes a sibling layer's pattern); wipe-all = clear each layer in turn. Idle attract now waits for ALL layers empty and the ghost plays on whichever layer is active.
- 2026-07-12: State seam refactor: grid/placed/mode/rand-light + rubber timestamps (born/died/fired) all moved into per-layer objects; playhead/drawStep stay global (all layers share the transport clock, playhead = step % 16 always).
- 2026-07-12: Tone.js pinned to 14.8.49 from cdnjs (known-good, stable for a kiosk). Bump deliberately, not automatically.
- 2026-07-12: Scale = C major pentatonic, C3–C6 (16 notes, C/D/E/G/A per octave). "Which pentatonic" wasn't specified.
- 2026-07-12: Voice = triangle-wave PolySynth with soft envelope + limiter, no reverb. Sounded clean; add a small Tone.Reverb later if too dry on the panel (see ponytail comment in index.html).
- 2026-07-12: Playhead visual = whole column lightened; active cell under playhead flashes white. Simplest readable sweep. [SUPERSEDED same day by Rubber Tier 2: column-lightening removed in favor of a spring-eased glow band + cell bulge; fired cells still flash white briefly.]
- 2026-07-12: Rubber Tier 2 tuning: ripple rings swell cells up to +16% and push them radially up to 10% of a cell (gaussian band, width 0.9 cell, cheap box-test early-out per cell×wave pair — worst case 96 waves × 256 cells, watch on the panel). [Desktop stress test 2026-07-12: all 256 cells on + ripples pinned at the 96 cap sustained 60.2 fps, no console errors. Still needs a once-over on the RAYPODO itself — Android GPU is the unknown.] Playhead band = spring-eased hop per 16th with ~17% overshoot; wraps by re-entering from the left edge. Bounce balls: sy = (1+0.35·speed)·(1−0.45·floorContact), volume-preserving ellipse. Buttons: one-shot 25% dip-and-spring on tap; clear also compresses 15% as the hold-ring fills.
- 2026-07-12: Tapping a cell ON spawns an immediate ripple as placement feedback (in addition to trigger ripples). Felt right for "no wrong notes"; easy to remove.
- 2026-07-12: Added .claude/launch.json (npx http-server on :8321) as the dev preview server — dev convenience only, not part of deploy.
- 2026-07-12: launch.json switched to autoPort (port 8321 was taken by another session; a static server doesn't care which port).
- 2026-07-12: Clear-grid interaction = hold-to-clear ✕ button, bottom-right, ~1s with progress ring, ripple burst on wipe. Rationale: instant tap risks accidental wipes by kids; hold-with-feedback is still zero-instruction.
- 2026-07-12: All controls live in a dedicated strip below the grid (bar = max(64px, 9% of height)); the grid shrinks to fit above it. Controls never overlap the grid at any aspect ratio (was Matt's call).
- 2026-07-12: Bounce mode semantics (faithful to the original): pitch = COLUMN (left low → right high), height = pulse rate (ball strikes floor every 16−row sixteenths, so top row = once/bar, bottom = every 16th). All balls phase-locked to the global step counter → guaranteed polyrhythms, no free-running physics. Grid state is shared across modes (one layer for now); a pattern sounds different per mode, which is the fun.
- 2026-07-12: Mode switcher = icon buttons (play triangle / ball-over-floor / dot-zigzag) bottom-left, mirroring the clear button. Tap switches instantly, no confirmation.
- 2026-07-12: Random mode = light hops between dots in TAP ORDER (a `placed` array tracks placement sequence alongside the grid), one hop per 8th note, pitch = row like Score. "Random" is the Tenori-on name; it's actually deterministic — kept the name for faithfulness.
- 2026-07-12: Rubber Tier 1 tuning: one damped spring (1 − e^(−5t)·cos(9t), ~17% overshoot) drives everything over 550ms; inflate starts at 40% size; fire squash ±25% anisotropic; finger bulge +12% max with falloff over 2.5 cells. All derived per-frame from timestamps — no physics state, renderer-only change. Squash also applies to OFF cells poked by Bounce-mode floor hits (looks intentional, kept).
- 2026-07-12: Rubber Tier 3 palette = color by PITCH CLASS, not by row: the 5 pentatonic degrees get fixed candy colors (C strawberry #ff6b81, D mango #ffa94d, E lemon #ffd43b, G mint #3ddc97, A blueberry #5ea8ff), repeating each octave. Same note = same color in every octave and every mode (Bounce colors by column since pitch = column there). Chosen over hue-by-row because a 16-step gradient reads spectrum-analyzer, and pitch-class color is faithful to "the grid is music". Ripple rings inherit the note's color. Glossy sprites re-rendered on resize at device-pixel size; fired cells flash the white sprite.
- 2026-07-12: Marimba voice = classic Tone.js mallet patch (oscillator partials [1,0,2,0,3], attack 0.001, decay 1.2, sustain 0, release 1.2) on the same PolySynth — options-only change, limiter chain untouched. Longer tails mean more overlapping voices on dense grids; PolySynth's default 32-voice cap silently steals the oldest, which is acceptable. NOT auto-deployed to prod — Matt should listen first (verified programmatically: notes fire at −10 dB peak, no errors, but nobody's actually heard it).
- 2026-07-12: Garden mutates the ACTIVE layer only, random col within the layer's loop length x random row (pentatonic = no wrong growth); grow/prune 50/50 between 3 and 24 dots. Runs in the transport callback, skipped while attract owns the grid.
- 2026-07-12: Draw-mode ephemerality: dot expiry stored on placed entries (p.exp), swept DIRECTLY in the transport callback (not Tone.Draw — Draw callbacks silently expire if rAF stalls, which would leave dots stuck). Drawn trails are not re-saved on paint (no localStorage write per pointermove); dots restored from a save lose their exp and become permanent — acceptable, they were mid-evaporation anyway.
- 2026-07-12: Persistence schema gridSings.v1: { bpm, swing, scale, mirror, li, layers:[{placed, mode, len}] }, written on every mutation (tiny JSON, no debounce needed), clamped/validated on load so corrupt or stale blobs are ignored. Attract-ghost dots are never saved mid-attract (attract only starts from all-empty, and its cleanup saves the correct empty state). Restored dots get born=now so the pattern inflates in on boot.
- 2026-07-12: Mirror painting semantics: partners are SET to the tapped cell's new state (not flipped), so re-tapping with mirror on stays consistent; N=16 is even so a cell is never its own mirror. L/R mirror = temporal echo (same pitch later in the loop); kaleidoscope adds the row mirror = inverted melody, always consonant in pentatonic.
- 2026-07-12: Voice patches picked by construction, not listening: pluck = triangle decay 0.35 @ -9dB, bells = FMSynth harmonicity 8 / modIndex 2 decay 1.6 @ -14dB. Flagged in Smells.
- 2026-07-12: Per-layer loop length: range 4–16 (grown-up panel sliders), Score mode only — Bounce's loop IS its polyrhythm (period = 16−row) and Random's is its placement sequence, so `len` doesn't touch them. Playhead band follows the ACTIVE layer's own loop; the global `playhead` var was removed in favor of computing `drawStep % A.len` at draw time. Columns beyond the active layer's loop end render at 0.35 alpha (visible but asleep) so the cut point is legible. Dots beyond the loop end are kept, not deleted — shortening then re-lengthening restores them.
- 2026-07-12: Mobile bugfix — audio unlock moved from pointerdown to pointerup: iOS Safari grants the user activation Web Audio needs on touch END, so `await Tone.start()` in pointerdown hung forever (hint stuck, no transport, no sound). `started` now flips only on success so a failed unlock retries on the next tap. Mobile is a bonus target; the fix also holds for any browser strict about activation.
- 2026-07-12: Mobile bugfix — control-strip button radius capped at (innerWidth/2 − 60)/9 so all 7 buttons (3 modes, 3 layer dice, ✕) fit one row on narrow screens; at phone width the old bar-derived radius made mode icons bury the 1-dot layer button. Wall panel unaffected (cap only binds below ~1100px width).
- 2026-07-12: Grown-up panel opens via 3s motionless hold in a 90×90px top-left dead zone (outside grid and control strip — kids have no reason to hold there); release cancels. Panel is NOT modal: grid keeps playing and stays tappable around the card. Tempo slider also retunes STEP_MS so playhead interpolation tracks BPM. Clear-all wipes all three layers (the only wipe-all in the app; per-layer ✕ unchanged).
- 2026-07-12: Idle attract triggers after 2 min untouched AND grid empty (a left-behind pattern already attracts; never destroy a kid's work). Ghost forces Score mode, places a preset dot every 0.9s, holds 30s, dissolves, next pattern ~10s later (2 patterns: sine wave, sparse arpeggio). Any tap = instant eviction + clear. Can't run before the first-ever tap (AudioContext locked) — acceptable: panel gets touched daily.
- 2026-07-13: CONCEPTS.md (Pond Chimes + Chord Garden planning doc) and both approved UI mockups added at repo ROOT (`pond-chimes-mockup.html`, `chord-garden-mockup.html`) — matches the repo's flat layout (artists.html precedent) and the bare-filename references already in CONCEPTS.md, so no doc edits needed. Mockups will ride along on the next manual Netlify deploy; harmless (silent, unlinked pages) but move them to a subfolder if that ever bothers. Note the concepts themselves say each toy eventually gets its OWN repo + site — these files live here only as planning artifacts.

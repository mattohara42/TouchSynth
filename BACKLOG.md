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
- [ ] 2–3 layers with simple layer switcher (big buttons, not the original's 16)
- [ ] Tempo control (hidden/grown-up area?)

## Later / Ideas
- [x] Rubber UI Tier 2 — grid as soft membrane: ripples displace/scale nearby cells, springy playhead glow band with overshoot, bounce-ball squash on floor impact, squishy depress-and-boing buttons (Tier 1 — spring fn, inflate/deflate on toggle, squash on fire, finger bulge — shipped 2026-07-12; Tier 2 shipped same day)
- [x] Rubber UI Tier 3 — gummy material look: warm aubergine background, candy palette by pitch class, pre-rendered glossy cell sprites (no per-frame gradients/shadowBlur on the panel), rounder corners + idle cells as small dots, ripple rings in the note's own color (2026-07-12)
- [ ] If the look goes candy (Tier 3), revisit voice to match — marimba-ish
- [x] Idle attract mode: after 2 min untouched + empty grid, ghost places/holds/dissolves preset patterns; any tap evicts it (2026-07-12)
- [ ] Grown-up mode toggle exposing full depth (more layers, more modes, voices)
- [ ] Instrument voice selection
- [ ] Save/load patterns (localStorage first; Firestore only if sharing between devices matters)
- [ ] Per-kid pattern slots (echoes Cast & Type profile idea)
- [ ] Sound: evaluate faithfulness to original Tenori-on voices — explicitly punted, wall panel doesn't need it
- [ ] Naming: "Grid Sings" is a working title. Candidates: Lumen, Ripple, ___
- [ ] Volume strategy for kitchen/wall placement (time-of-day aware? panel hardware volume?)

## Smells / Watch items
- (none yet — log anything discovered mid-build here rather than fixing inline)

## Assumptions log
- (Claude Code: when proceeding unattended on an ambiguous decision, record it here with date + rationale)
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
- 2026-07-12: Idle attract triggers after 2 min untouched AND grid empty (a left-behind pattern already attracts; never destroy a kid's work). Ghost forces Score mode, places a preset dot every 0.9s, holds 30s, dissolves, next pattern ~10s later (2 patterns: sine wave, sparse arpeggio). Any tap = instant eviction + clear. Can't run before the first-ever tap (AudioContext locked) — acceptable: panel gets touched daily.

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
- 2026-07-12: Playhead visual = whole column lightened; active cell under playhead flashes white. Simplest readable sweep.
- 2026-07-12: Tapping a cell ON spawns an immediate ripple as placement feedback (in addition to trigger ripples). Felt right for "no wrong notes"; easy to remove.
- 2026-07-12: Added .claude/launch.json (npx http-server on :8321) as the dev preview server — dev convenience only, not part of deploy.
- 2026-07-12: launch.json switched to autoPort (port 8321 was taken by another session; a static server doesn't care which port).
- 2026-07-12: Clear-grid interaction = hold-to-clear ✕ button, bottom-right, ~1s with progress ring, ripple burst on wipe. Rationale: instant tap risks accidental wipes by kids; hold-with-feedback is still zero-instruction.
- 2026-07-12: All controls live in a dedicated strip below the grid (bar = max(64px, 9% of height)); the grid shrinks to fit above it. Controls never overlap the grid at any aspect ratio (was Matt's call).
- 2026-07-12: Bounce mode semantics (faithful to the original): pitch = COLUMN (left low → right high), height = pulse rate (ball strikes floor every 16−row sixteenths, so top row = once/bar, bottom = every 16th). All balls phase-locked to the global step counter → guaranteed polyrhythms, no free-running physics. Grid state is shared across modes (one layer for now); a pattern sounds different per mode, which is the fun.
- 2026-07-12: Mode switcher = icon buttons (play triangle / ball-over-floor / dot-zigzag) bottom-left, mirroring the clear button. Tap switches instantly, no confirmation.
- 2026-07-12: Random mode = light hops between dots in TAP ORDER (a `placed` array tracks placement sequence alongside the grid), one hop per 8th note, pitch = row like Score. "Random" is the Tenori-on name; it's actually deterministic — kept the name for faithfulness.
- 2026-07-12: Idle attract triggers after 2 min untouched AND grid empty (a left-behind pattern already attracts; never destroy a kid's work). Ghost forces Score mode, places a preset dot every 0.9s, holds 30s, dissolves, next pattern ~10s later (2 patterns: sine wave, sparse arpeggio). Any tap = instant eviction + clear. Can't run before the first-ever tap (AudioContext locked) — acceptable: panel gets touched daily.

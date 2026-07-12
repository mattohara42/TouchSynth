# BACKLOG — Grid Sings

## Now (M1 — "The Grid Sings")
- [x] Repo + Netlify site created, index.html deployed — github.com/mattohara42/TouchSynth → touchsynth.netlify.app, auto-deploy on push to main (2026-07-12)
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
- [ ] Bounce mode (notes fall and trigger on bounce; needs the mode seam)
- [ ] Random mode (light-trail traveling melody)
- [ ] 2–3 layers with simple layer switcher (big buttons, not the original's 16)
- [ ] Tempo control (hidden/grown-up area?)

## Later / Ideas
- [ ] Idle attract mode: after N minutes untouched, play a gentle preset pattern to lure passersby
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
- 2026-07-12: Clear-grid interaction = hold-to-clear ✕ button, bottom-right, ~1s with progress ring, ripple burst on wipe. Rationale: instant tap risks accidental wipes by kids; hold-with-feedback is still zero-instruction. Button sits in the corner margin — could overlap the grid in near-square windows, fine on the 16:9 panel (ponytail comment in index.html).

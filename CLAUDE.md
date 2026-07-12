# CLAUDE.md — Grid Sings (working title)

## North Star
A Tenori-on-inspired grid music instrument. **Faithful engine, kid-friendly skin, wall-panel target.**
- Faithful engine: architecture mirrors the real instrument (grid state, layers, swappable modes) even when the UI hides that depth.
- Kid-friendly skin: big touch targets, no wrong notes, zero instructions needed. A child should make music within 10 seconds of walking up.
- Wall-panel target: primary deployment is a 21.5" RAYPODO Android touch panel running Fully Kiosk Browser, fullscreen, running for hours unattended. Desktop browser is the dev environment.

## What this is NOT
- Not a DAW. No tracks, no export, no MIDI (yet).
- Not a settings-rich app. Every control added must justify itself against the "walk up and play" test.
- Not part of Family Hub. Separate repo, separate Netlify site, same deployment pipeline.

## Current milestone: M1 — "The Grid Sings"
- 16×16 touch grid, fullscreen, dark background
- Score mode only: playhead sweeps left→right, loops continuously
- Pentatonic scale, mapped bottom (low) to top (high), single voice
- Light ripple animation on note trigger — the signature visual, worth polishing
- Fixed tempo (~110 BPM), no visible controls
- Tap toggles a cell. That is the entire UI.

Deferred (see BACKLOG.md): layers, Bounce/Random modes, instrument selection, tempo control, save/load, settings, idle attract mode.

## Tech decisions (agreed)
- Single `index.html` for M1. Split into modules only when it earns it.
- Tone.js for synthesis + scheduling (Transport-driven 16-step loop). Rationale: rock-solid timing; jitter is the #1 killer of homemade sequencers.
- Canvas renderer via requestAnimationFrame.
- No build step. Deploy = push to Netlify. Matches Family Hub philosophy.

## Architecture seams (protect these)
1. **State** — 16×16 boolean grid (later: array of layer grids). Dumb data. No logic.
2. **Audio engine** — owns timing. Reads state on each Transport step, triggers notes. NEVER depends on the render loop. Future modes plug in here as different "what fires when" strategies.
3. **Renderer** — reads state + a ripple/event queue, draws. Owns nothing, decides nothing.

Modes and layers arrive later by extending these seams, not by rewriting them.

## Wall-panel constraints (keep in mind even in M1)
- Web Audio requires a user gesture to start the AudioContext — first tap starts everything; show a gentle "tap anywhere" hint before that.
- Long-running sessions: cap/garbage-collect ripple objects; avoid unbounded arrays.
- Touch-first: no hover states, targets sized for small fingers, prevent default touch behaviors (scroll/zoom) on the grid.

## Working style (Matt's preferences)
- Ask before assuming when interactive; when unattended, pick the most reasonable interpretation, proceed, and **log the assumption** in ASSUMPTIONS section of BACKLOG.md.
- Simplest solution for simple problems. Do not add flexibility that isn't needed yet.
- Don't touch unrelated code; surface smells as separate BACKLOG items instead.
- Flag design decisions explicitly rather than deciding silently.
- Maintain BACKLOG.md discipline: every deferral, idea, and smell gets written down.

# Changelog

All notable changes to Grid Sings (working title) are documented here.

This project has no build step and deploys manually to
[touchsynth.netlify.app](https://touchsynth.netlify.app). Version tags mark
snapshots of the shipped instrument; see `BACKLOG.md` for the blow-by-blow of
what shipped, what's deferred, and the dated assumptions log.

## [Unreleased]

### Changed

- **Idle attract mode is now off by default.** Left alone, the panel stays silent.
  A new *attract mode* on/off select in the grown-up panel switches the ghost back
  on; the choice is saved to `localStorage` with the rest of the panel settings.
  Saved settings written before this change come back with attract off. Turning it
  off while the ghost is mid-pattern hands the grid back immediately.

## [1.0.0] — 2026-08-20

First tagged release. Covers milestones M1–M3, all live in production. A
Tenori-on-inspired grid instrument with a faithful engine, a kid-friendly skin,
and a 21.5" wall-panel as its primary target.

### The kid surface

- **16×16 touch grid** on Canvas, fullscreen, tap-to-toggle, with scroll/zoom
  prevented and multi-touch tracked per pointer.
- **Six Tenori-on-style modes**, switched by icon buttons:
  - **Score** — a playhead sweeps left→right; lit cells sing.
  - **Bounce** — each lit cell drops a ball that strikes on a `16 − row` period,
    for guaranteed polyrhythms.
  - **Random** — a light hops dot-to-dot in placement order.
  - **Draw** — drag to paint a trail that plays like Score and evaporates.
  - **Push** — live: hold cells to sustain a drone/chord, drag to glide.
  - **Solo** — live: each touch plucks the layer's voice, slide for glissando.
- **Three simultaneous layers**, each with its own voice, mode, and loop length,
  picked with dice-dot buttons. Unequal loop lengths give Reich-style phasing.
- **Hold-to-clear** the active layer (progress ring, so a stray finger never
  wipes a pattern).
- **No wrong notes** — everything is quantised to a pentatonic scale.

### The grown-up panel (3-second hold, top-left)

- Tempo (60–180 BPM), swing (0–50%), per-layer loop length (4–16 steps).
- Scale swap: major pentatonic, minor pentatonic, hirajoshi.
- Mirror painting: off / left–right echo / kaleidoscope.
- Garden (the Eno switch): a left-behind pattern slowly grows and prunes itself.
- Clear-all, plus a "who makes music like this?" teaching card with a QR code to
  the listening page (`artists.html`).

### On its own

- **Three voices** — marimba, a soft pluck up an octave, FM glass bells down an
  octave.
- **Night palette** — colours dim, background darkens, and master level drops
  from 20:00 to 07:00.
- **Idle attract mode** — after two minutes untouched with an empty grid, a ghost
  plays gentle preset patterns; any tap hands control straight back.
- **Persistence** — every change saved to `localStorage`, restored on reboot.
- **Rubber/gummy feel** — cells inflate, squash, and wobble; ripples push the
  membrane; colour follows pitch class.

### Under the hood

- Three protected seams: dumb **state**, a Transport-driven **audio engine** that
  owns timing, and a `requestAnimationFrame` **renderer** that owns nothing.
- Vanilla JS, HTML Canvas, Tone.js 14.8.49 (pinned). No framework, no bundler.

[1.0.0]: https://github.com/mattohara42/TouchSynth/releases/tag/v1.0.0

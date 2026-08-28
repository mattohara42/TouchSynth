# Changelog

All notable changes to Grid Sings (working title) are documented here.

This project has no build step and deploys manually to
[touchsynth.netlify.app](https://touchsynth.netlify.app). Version tags mark
snapshots of the shipped instrument; see `BACKLOG.md` for the blow-by-blow of
what shipped, what's deferred, and the dated assumptions log.

## [Unreleased]

Nothing yet.

## [1.1.0] — 2026-08-27

The instrument itself is unchanged to play; this release is about the things
around it — a way to stop the panel singing, settings that are findable rather
than hidden, a test suite, and the bugs that suite found.

### Added

- **A play/pause button** in the control strip, beside ✕. The one control that
  stops the panel singing by itself. Deliberately not saved: a kiosk that reboots
  comes back playing, not mysteriously silent.

- **A test suite** — `npm test`. 192 tests, no dependencies, no build step. It boots
  `index.html`'s inline script in a Node `vm` sandbox with a fake browser and a fake
  Tone.js, so the clock, transport, touch input and `localStorage` are all controlled
  by the test. `index.html` is read exactly as it ships.

- **An MIT license**, and a social preview image for links to the repo.

### Changed

- **The grown-up panel opens from a gear icon**, in the top-left corner where the
  3-second hold used to be. Tap to open, tap again (or *done*) to close — no hidden
  gesture. The gear is small and low-contrast, in the dead space beside the grid,
  and sizes itself into whichever margin the centered grid leaves so it never sits
  on a cell.

- **Idle attract mode is now off by default.** Left alone, the panel stays silent.
  A new *attract mode* on/off select in the grown-up panel switches the ghost back
  on; the choice is saved to `localStorage` with the rest of the panel settings.
  Saved settings written before this change come back with attract off. Turning it
  off while the ghost is mid-pattern hands the grid back immediately.

- **Bigger touch targets on phones.** Below 640px wide the control strip stacks into
  two rows, each sizing its buttons against the full width, so buttons grow from
  roughly 13px to 48px across.

- **The Score mode button is re-iconed** as a playhead sweeping a row of dots, so ▶
  now means exactly one thing in the strip: play/pause.

### Fixed

- **A corrupt saved pattern could stop the instrument booting at all.** A `null` entry
  in the saved layer list threw while the script was still evaluating, so the panel came
  up blank on every reboot until browser storage was cleared by hand. Junk entries now
  fall back to that layer's defaults and the rest of the save loads normally.

- **A layer could come back from storage in a mode that never sounds.** The saved mode
  name was checked with a plain property lookup, so inherited names like `toString`
  passed as valid — the layer drew normally, played nothing, and lit no mode button.

- **Touch targets on mid-size screens were smaller than a fingertip.** The control strip
  only stacked into two rows below 640px, but one row can't hold eleven controls at a
  44px target until 852px — so an iPad in portrait got 38px buttons while a much smaller
  phone got 48px. The strip now stacks below 852px. Fixing that also uncovered two
  latent bugs in the stacked layout: the rows could overlap and hang off the bottom of
  tall screens, and the single-row strip was two pixels too short to reach a 44px target
  on short landscape screens.

  Wall panel, desktop, tablet landscape and phone portrait layouts are unchanged. Tablet
  portrait more than doubles its button size with no loss of grid. Near-square windows
  and phone landscape trade some grid area for the bigger targets.

- The grown-up panel no longer hangs off the edge of a narrow screen — its
  `max-width` sized the content box, so 68px of padding pushed it to 427px wide on
  a 390px phone, with its left edge off-screen.

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

[Unreleased]: https://github.com/mattohara42/TouchSynth/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/mattohara42/TouchSynth/releases/tag/v1.1.0
[1.0.0]: https://github.com/mattohara42/TouchSynth/releases/tag/v1.0.0

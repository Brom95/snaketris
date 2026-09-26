# Design

## Context

The game is a single self-contained `snaketris.html` file: a 24×30 logical grid drawn on a fixed 576×720 px canvas (`CELL = 24`), driven by a fixed-timestep (1/60 s) `requestAnimationFrame` loop. Input is keyboard-only — a `keydown` listener maps arrows/WASD to `nextDir` (with the no-reverse rule) and `R` to restart; a `click` listener on the canvas restarts from IDLE/GAME_OVER. The board is centered in the viewport via flexbox, so on a phone it overflows horizontally/vertically and is unplayable without a keyboard.

Constraints: vanilla JS only, no external dependencies, no build step, no new files; all existing mechanics and keyboard behavior must remain intact.

## Goals / Non-Goals

**Goals:**
- Fully playable on touch devices: swipe + tap-zone steering, tap to start/restart.
- Board always fully visible on any viewport (phones up to ~320 px wide), aspect ratio preserved, never enlarged beyond native size.
- Touch gestures never conflict with page scrolling/zooming or text selection.
- One shared direction path so keyboard and touch obey identical rules (no-reverse, only while PLAYING).

**Non-Goals:**
- No change to game mechanics, grid model, scoring, difficulty ramp, or death conditions.
- No on-screen D-pad UI, no haptics, no sound, no multi-touch simultaneous controls, no new files or dependencies.
- No desktop mouse-drag steering requirement (pointer events will accept it as a free side effect, not a designed feature).

## Decisions

**D1 — Pointer Events, not raw touch events.**
The board listens for `pointerdown`/`pointermove`/`pointerup` (and `pointercancel`) on the canvas. Pointer Events are supported on all modern mobile browsers and unify touch + mouse, so the existing "click to start/restart" behavior carries over for desktop without a separate listener.
*Alternative considered:* separate `touchstart/touchmove/touchend` + `click` handlers — rejected because it duplicates state (which finger, which phase) and risks double-firing of start/restart on touch devices.

**D2 — Single active pointer, capture on down.**
On `pointerdown`, `canvas.setPointerCapture(pointerId)` and record the start position; all subsequent `pointermove`/`pointerup` for that pointer are consumed by the handler even if the finger drifts off the canvas. A second pointer (multi-touch) is ignored entirely.
*Alternative considered:* no capture — rejected because a swipe that leaves the canvas would drop the gesture with no direction registered.

**D3 — Swipe = dominant axis of the end displacement; tap = below-threshold displacement.**
On pointer up, compute `dx = endX - startX`, `dy = endY - startY` in canvas (logical, 576×720) coordinates. Threshold `T = 24` px (one logical cell).
- If `max(|dx|, |dy|) < T` → it's a tap:
  - state IDLE or GAME_OVER → restart (matches existing click behavior).
  - state PLAYING → map to region: if `|dx| >= |dy|` use the horizontal axis (x left of center → left, right → right), else the vertical axis (y above center → up, below → down); exactly on the center line ties count as the dominant-axis axis; a tap dead-center is a no-op.
- Otherwise → swipe: dominant axis of the displacement (`|dx| > |dy|` → horizontal, else vertical) sets the direction.
Both paths feed one shared function `setDirection(d)` that applies the no-reverse rule and the PLAYING gate, identical to the keyboard path.
*Alternative considered:* divide the board into 3×3 static zones for taps — rejected because it leaves corner regions ambiguous and the dominant-axis rule is one line of code with no dead zones.

**D4 — Responsive sizing via CSS scale of a constant-resolution canvas.**
The canvas buffer stays 576×720 (logical resolution unchanged, so every draw function is untouched). On `resize` (fired on window resize and orientation change) and once at init, compute `scale = min(availableW / 576, availableH / 720)` capped at 1, and set `canvas.style.width = 576*scale + 'px'` / `canvas.style.height = 720*scale + 'px'`. Pointer coordinates are mapped to logical space via the bounding rect (`(clientX - rect.left) / rect.width * 576`).
*Alternative considered:* resize the buffer and `ctx.scale()` every frame — rejected because it requires rewriting the render path and invites drift between logical and device pixels.

**D5 — Touch hygiene CSS.**
`touch-action: none` and `user-select: none` on the canvas (plus `-webkit-user-select` and `-webkit-touch-callout: none` for older WebKit) so swipes are never scrolled away and no selection/long-press UI competes with input.

**D6 — Input wiring changes, behavior preserved.**
The `click` listener is removed (replaced by the pointer-up path, which restarts on IDLE/GAME_OVER exactly as click did). The `keydown` listener is unchanged. The hint text is updated to mention swipe/tap.

## Risks / Trade-offs

- [CSS-downscaled canvas is slightly soft] → Acceptable; the logical buffer is unchanged so gameplay is pixel-identical, and sub-pixel rendering at phone scale is imperceptible in practice.
- [Mouse drag on desktop accidentally steers] → Harmless; the same no-reverse rule applies, and a drag is just a fast direction change.
- [A swipe started on IDLE/GAME_OVER could feel odd] → On IDLE/GAME_OVER the game isn't moving, so any pointer-up restarts — same as the existing click behavior.
- [Threshold edge cases (fingertip jitter on tap)] → 24 px (one cell) comfortably exceeds typical fingertip jitter; tap zones are robust at any viewport scale because they're computed in logical space.
- [Older browsers without Pointer Events] → All modern mobile/desktop browsers support them (Chrome 55+, Safari 13+, Firefox 59+, Edge 18+); the game already assumes a modern browser.

## Migration Plan

1. Push the adapted `snaketris.html` to `main`.
2. The existing `.github/workflows/pages.yml` (GitHub Pages site source is configured, `has_pages: true`) builds and deploys automatically.
3. Verify https://Brom95.github.io/snaketris in a mobile browser / device emulation (swipe, tap zones, resize, restart).
4. Rollback: `git revert` the commit; the previous `snaketris.html` is intact in history.

## Open Questions

- None. The swipe/tap threshold (24 px) and dominant-axis tap mapping are implementation details resolvable during apply without touching the specs.

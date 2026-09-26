# Proposal

## Why

snaketris is currently keyboard-only (arrow keys / WASD / R) and renders a fixed 576×720 px canvas that overflows most phone screens. The game cannot be played on mobile devices without a hardware keyboard, which removes an entire class of players even though the codebase is already a single self-contained HTML file with no build step.

## What Changes

- **Touch steering (swipe):** a touch drag on the board sets the snake's direction to the dominant axis of the drag (horizontal → left/right, vertical → up/down). The existing no-reverse rule applies identically to touch as to keyboard.
- **Touch steering (tap zones):** a tap (short press without meaningful movement) on one of four board zones — left, right, top, bottom — sets the corresponding direction while playing.
- **Touch start/restart:** a single tap while in `IDLE` or `GAME_OVER` starts/restarts the game, matching the existing click behavior.
- **Responsive canvas:** the canvas scales to fit the viewport while preserving the 24:30 aspect ratio (capped at its native 576×720 px on larger screens), so the board is fully playable on phones from ~320 px wide upward.
- **Touch hygiene:** the board ignores touch scroll/zoom gestures (`touch-action: none`) and text selection, so swipes are never swallowed by the page.
- **Preserved unchanged:** all existing game mechanics (movement, classic growth, wrap-around, cell-by-cell +1 scoring, difficulty ramp, death conditions, restart reset) and all keyboard input (arrows/WASD/R) continue to work exactly as before.

No breaking changes; no new dependencies or files.

## Capabilities

### New Capabilities

- `mobile-input`: touch controls (swipe + tap zones), touch-based start/restart, and responsive canvas sizing for small viewports; keyboard input is preserved unchanged.

### Modified Capabilities

- None. The existing `snaketris-game` capability's requirements (snake movement, wrap-around, death conditions, falling pieces, edible/solid lifecycle, scoring, difficulty ramp, restart) all remain true and unaltered; this change adds a new input modality and layout behavior rather than changing any existing requirement.

## Impact

- **Code:** `snaketris.html` only — canvas sizing (resize handler + scale transform), input handlers (pointer events replacing the bare `click`/`keydown` wiring, shared direction function), CSS (`touch-action`, viewport meta), hint text.
- **Dependencies/systems:** none — vanilla JS, single file, no external assets.
- **Platform:** desktop browsers (keyboard + mouse via the new pointer path), mobile browsers (touch).
- **GitHub Pages:** the site source is now configured (`has_pages: true`); the existing `pages.yml` workflow will serve the adapted file unchanged.

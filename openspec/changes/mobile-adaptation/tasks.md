# Tasks

## 1. Responsive canvas sizing

- [x] 1.1 Add a `fitCanvas()` function that computes `scale = min(availableW / 576, availableH / 720)` capped at 1 and sets `canvas.style.width`/`canvas.style.height` in CSS px (logical buffer stays 576×720), and call it on init plus a `window.resize` listener; verify the canvas fits a ~360 px-wide viewport with no page scroll and is never larger than 576×720 on a desktop viewport
- [x] 1.2 Update the hint text to mention touch controls (e.g. "arrows / WASD to steer · swipe or tap to steer · R or tap to start"); verify the hint displays without layout overflow on mobile widths

## 2. Touch hygiene and shared direction path

- [x] 2.3 Add CSS `touch-action: none`, `user-select: none`, `-webkit-user-select: none`, `-webkit-touch-callout: none` to the canvas; verify a swipe on the board does not scroll the page and no text selection/long-press menu appears in Chrome DevTools mobile emulation
- [x] 2.4 Refactor the keyboard direction logic into a shared `setDirection(d)` function that applies the PLAYING gate and the no-reverse rule, and have `onKey` call it; verify arrow keys / WASD behave exactly as before (including the no-reverse rule) and `R` still restarts

## 3. Pointer input: steering

- [x] 3.5 Add pointer handlers (`pointerdown`/`pointermove`/`pointerup`/`pointercancel`) on the canvas: capture the pointer on down, track start/end in logical canvas coordinates (map client coords via the bounding rect), and on up classify as swipe (dominant axis of displacement, threshold 24 px) or tap (below threshold), feeding `setDirection` for PLAYING taps via the dominant-axis region mapping (left/right/top/bottom regions, exact center a no-op); verify in mobile emulation that swiping left/right/up/down steers the snake, the no-reverse rule blocks opposite swipes, and a dead-center tap changes nothing
- [x] 3.6 Ignore a second concurrent pointer (multi-touch): track the active pointer id and return early from handlers for any other pointer id; verify two-finger gestures do not change the snake's direction

## 4. Pointer input: start/restart

- [x] 4.7 On `pointerup` (or `pointercancel`) while in IDLE or GAME_OVER, call restart; remove the bare `click` listener on the canvas (the pointer-up path replaces it, including desktop mouse clicks); verify a tap starts the game from the idle screen, a tap restarts after game over, and a mouse click on desktop still starts/restarts

## 5. Integration verification

- [x] 5.8 Verify the full game loop in a mobile browser / DevTools mobile emulation: start via tap, steer via swipes and tap zones, eat falling pieces for +1 score per cell, difficulty ramps after 2 landed blocks, wrap-around works, game over on self-collision and on solid contact, restart resets score to 0 — all with the scaled canvas, and confirm keyboard input still works on desktop
- [ ] 5.9 Push the change to `main`, confirm the GitHub Pages workflow deploy goes green, and verify the site at https://Brom95.github.io/snaketris loads the adapted game (index redirect → snaketris.html) and is playable on a mobile viewport

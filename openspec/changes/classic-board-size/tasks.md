# Tasks

## 1. Shrink the logical grid

- [x] 1.1 Change `COLS` 24→10 and `ROWS` 30→20 in `js/constants.js`, leaving `CELL=24` so `BOARD_W`/`BOARD_H` recompute to 240×480; verify by a headless `node` import of `constants.js` that `BOARD_W === 240` and `BOARD_H === 480`, and run `node --check js/constants.js`.
- [x] 1.2 Confirm the canvas native size follows: in `js/app.js` `init()` the `canvas.width`/`canvas.height` are set to `COLS*CELL`/`ROWS*CELL` (240×480) with no other size changes; verify by a headless import that `COLS*CELL === 240` and `ROWS*CELL === 480`.

## 2. Rescale the overlay layout constants

- [x] 2.1 Update the menu layout in `js/constants.js`: `MENU_ITEM_Y` → `[200, 250, 300]`, `MENU_ITEM_HIT_H` stays `44`; verify the three hit ranges `[y±22]` are pairwise non-overlapping and all within `0..480`.
- [x] 2.2 Update the records layout in `js/constants.js`: `RECORDS_LINE_Y` → `150`, `RECORDS_LINE_SPACING` → `30`, `RECORDS_RETURN_Y` → `455`; verify 10 lines span `150..420` (below the return label at `455`) and all are within `0..480`.
- [x] 2.3 Update the help layout in `js/constants.js`: `HELP_CONTROLS_Y` → `130`, `HELP_RULES_Y` → `230`, `HELP_RETURN_Y` → `455`; verify all help text lines (header + 3 control lines + header + 3 rule lines, using the existing `+30`/`+52`/`+74` offsets) stay within `0..480`.

## 3. Move the remaining hardcoded overlay y-coordinates

- [x] 3.1 In `js/render.js::drawMenu()`, change the title `y` 200→120 and the hint `y` 480→420; verify both are within the 480-tall board and the hint no longer sits at the bottom edge.
- [x] 3.2 In `js/render.js::drawRecords()`, keep the title `y` at 120 and change the empty-state `y` 300→240; verify the empty-state line is below the title and above the first record line.
- [x] 3.3 In `js/render.js::drawHelp()`, keep the title `y` at 100 (unchanged); verify with the new `HELP_*` constants that all help text fits within `0..480`.

## 4. Verify the fit behavior is unchanged

- [x] 4.1 Confirm `js/input.js::fitCanvas()` is left unchanged (standard contain, `scale = min(innerWidth/BOARD_W, innerHeight/BOARD_H, 1)`, cap at 1); verify by re-reading the file that it still references `BOARD_W`/`BOARD_H` and caps at `1`.
- [x] 4.2 Verify the board fits on small viewports with the new 240×480 buffer: in a headless check (or browser) at a 320×480 and a 360×800 viewport, `fitCanvas()` yields a displayed canvas no larger than the viewport and the full board is visible; verify no horizontal/vertical scrolling is required.

## 5. Integration and behavior verification

- [x] 5.1 Run `node --check js/*.js` across all modules; verify it passes with no syntax errors after the constant and render edits.
- [x] 5.2 Headless integration check: with a stubbed `document`/`canvas` and dynamic `import()` of `js/app.js`, run 1000 ticks and verify no throw, and confirm the snake moves and grows on eating, a piece falls and lands (incrementing `landedBlocks`), wrap-around works, and both death conditions end the game — i.e., mechanics are intact at the new 10×20 board size.
- [x] 5.3 Verify the snake start is in-bounds: a headless import of `state.js` after `resetGame()` shows every snake segment's `r` in `0..19` and `c` in `0..9` (mid = `floor(20/2)` = 10, cols 3–6).
- [ ] 5.4 Browser verification (desktop): on the 10×20 board the menu, records, and help views each fit fully on-screen; menu items are selectable via keyboard (arrows/W-S, Enter/Space), mouse click, and the highlighted item is correct; the game is playable with keyboard steering and `R` restart. *(e2e — delegated to user)*
- [ ] 5.5 Browser verification (mobile emulation, ~360px wide): the board fits without scrolling; the game is playable via swipe and tap-zone steering, with a tap starting from the idle screen and restarting after game over; keyboard input still works on desktop. *(e2e — delegated to user)*
- [ ] 5.6 Push the change to `main`, confirm the GitHub-hosted Pages workflow goes green. *(Live-site desktop+mobile verification delegated to user as e2e.)*

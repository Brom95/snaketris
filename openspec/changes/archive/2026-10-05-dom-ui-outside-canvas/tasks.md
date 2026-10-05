# Tasks

## 1. Page shell: DOM structure and CSS

- [x] 1.1 Add the interface DOM tree to `snaketris.html` (score readout, game-over status message, menu title + three items, records list, help view, GitHub anchor) while `render()` still paints everything on the canvas; verify the page loads with both paths present and the canvas field unobstructed.
- [x] 1.2 Add the page CSS: the canvas in one layout track, the interface in the remaining space, `FIELD_V_GAP` expressed as the CSS gap around the field, and a width breakpoint that stacks the interface above the field on narrow viewports; verify at 1920×1080 and 390×844 (resized window or DevTools device mode) that every interface element is fully visible without scrolling and covers no part of the field.
- [x] 1.3 Keep `touch-action: none`, `user-select: none` and `-webkit-touch-callout: none` scoped to the canvas element only; verify a touch on an interface element shows normal browser touch behaviour while a swipe on the board still produces no page scroll, no selection and no long-press menu.
- [x] 1.4 Add `scripts/verify-page-layout.mjs` asserting the DOM tree exists and the CSS breakpoint values are present as written; verify `node scripts/verify-page-layout.mjs` exits 0.

## 2. HUD: score readout and game-over message

- [x] 2.1 Create `js/ui.js` owning the interface: `initUi()` storing the elements and `syncViews()` reading `game.state` and showing only the elements belonging to that state; import only `constants.js` and `state.js` so the module graph stays one-way; verify `app.js` calls `initUi()` after the canvas exists and no module imports `app.js`.
- [x] 2.2 Move the score readout to the DOM: `ui.js` writes the score text on the render path and `render()` drops the `drawText('Score: ' + game.score, 16, 16, …)` line; verify the readout shows 0 at game start, rises by exactly 1 per cell eaten, and no score text is painted inside the canvas.
- [x] 2.3 Move the game-over status message to the DOM and drop the `GAME_OVER` branch of `render()`; verify that when a game ends the final board stays visible in the field, the message is a page element beside it, and the message is fully visible at a 390 px viewport width.
- [x] 2.4 Extend the headless checks with a `scripts/verify-hud.mjs` covering the score readout text and the game-over message element; verify `node scripts/verify-hud.mjs` exits 0.

## 3. Menu and GitHub link as page elements

- [x] 3.1 Render the menu title and the three items as page elements with `tabindex="-1"` so the browser never activates them natively, keeping the highlight driven by `game.menuSelect`; verify the arrows/W/S cycle and Enter/Space confirmation in `onKey` (`js/input.js:41`) still move and confirm the selection, and that one key press performs exactly one menu action.
- [x] 3.2 Select menu items from the rendered element boxes in `input.js` and retire the `MENU_ITEM_Y` / `MENU_ITEM_HIT_H` hit-test branch of `onPointerUp`; verify clicking a label selects it, clicking just outside a label selects nothing, and a menu tap is never classified as a steering gesture.
- [x] 3.3 Replace the `drawOctocat` + `window.open(GITHUB_ICON…)` path with a real `<a target="_blank" rel="noopener" href="https://github.com/Brom95/snaketris">` holding an inline SVG, and retire `GITHUB_ICON_Y` / `GITHUB_ICON_HIT_H`; verify the link is excluded from keyboard and gamepad navigation and that a click opens the repository in a new tab with popup blocking unable to suppress it.
- [x] 3.4 Rewrite `scripts/verify-github-icon.mjs` from a logical-coordinate tap into a DOM assertion (anchor present, `href` exact, `target`/`rel` set, icon below the three items); verify `node scripts/verify-github-icon.mjs` exits 0.

## 4. Records and help views as page elements

- [x] 4.1 Render the records view as page elements — heading, one line per leaderboard entry in descending order with its date, empty-state message, return control — moving `formatDate` out of `js/render.js`; verify the top-10 list, the fewer-than-ten case and the empty state all render as selectable page text.
- [x] 4.2 Render the help view as page elements (controls block, rules block, return control) and retire `HELP_CONTROLS_Y` / `HELP_RULES_Y` / `HELP_RETURN_Y`; verify every control and rule line is fully visible at the narrowest supported viewport with no horizontal scroll.
- [x] 4.3 Retire `RECORDS_LINE_Y` / `RECORDS_LINE_SPACING` / `RECORDS_RETURN_Y` from `js/constants.js` once the records view is live in the DOM; verify no remaining reference to any retired layout constant survives in `js/`.
- [x] 4.4 Add `scripts/verify-views.mjs` asserting the records and help DOM (entry count matches the stored board, dates formatted `YYYY-MM-DD`, help lines present) and that the retired constants are gone from `constants.js`; verify `node scripts/verify-views.mjs` exits 0.

## 5. Field-only canvas and independent scaling

- [x] 5.1 Reduce `render()` to the field passes (background, grid, solid blocks, falling pieces, snake) and delete `drawMenu`, `drawRecords`, `drawHelp`, `drawOverlay`, `overlayBackground`, `drawText`, `drawOctocat` from the canvas path; verify the canvas draws nothing but the field in every state.
- [x] 5.2 Keep `fitCanvas()` (`js/input.js:121`) applying the same contain-fit rule to the canvas alone, and confirm `toLogical()` still resolves pointer coordinates through `getBoundingClientRect()`; verify swipe and tap steering still set the queued direction through the no-reverse rule exactly as before.
- [x] 5.3 Verify independent scaling end to end: at a wide desktop viewport the field grows by height while the interface keeps its own size and uses the horizontal space beside it, and at a phone viewport the field still fills the width with the interface stacked clear of it.

## 6. Integration checks

- [x] 6.1 Extend `scripts/controller-stubs.mjs` with the DOM stubs the new interface needs (`document.getElementById` returning the interface elements, `querySelectorAll` for the menu items) and run every `scripts/verify-*.mjs` headless check; verify all exit 0.
- [x] 6.2 Run the ripwire gate before opening a PR: `quality_delta` against the pinned baseline reports nothing worse, and `doc_drift` finds no stale anchor in this change's `design.md`; record both results.
- [x] 6.3 Sync the delta specs (`hud`, `responsive-layout`, `start-menu`, `mobile-input`) into `openspec/specs/` and confirm `openspec list --specs` shows all four capabilities with the expected requirement counts.

## 7. Field hidden in non-play views and mobile score overlay

- [x] 7.1 Hide the canvas while `MENU`, `RECORDS` or `HELP` is shown and keep it in `PLAYING` and `GAME_OVER`, driven by `syncViews()` through the same class toggle as every other view (`display: none`, so the hidden field takes no flex track); verify the menu, records and help page shows no field box and the final board stays visible at game over.
- [x] 7.2 Position the score readout over the top edge of the field where the interface stacks above it, and return it to the interface flow while the field is hidden; verify `interfaceBandHeight()` stops counting the readout and the phone field grows from 275×550 to the contain-fit height, while a wide viewport keeps the readout clear of the field.
- [x] 7.3 Re-fit the canvas when the interface band changes with the shown view, not only on `resize`; verify that entering `PLAYING` from the menu re-scales the field to the band the overlaid readout no longer occupies.
- [x] 7.4 Update the headless checks that pinned the old behaviour (`scripts/verify-field-only.mjs`, `scripts/verify-hud.mjs`, `scripts/verify-page-layout.mjs`, `scripts/controller-stubs.mjs`) to the new visibility and overlay rules and run every `scripts/verify-*.mjs`; verify all exit 0.
- [x] 7.5 Re-run the ripwire gate against the pinned baseline (`quality_delta`, `doc_drift` on this change's `design.md`) and sync the amended deltas (`hud`, `responsive-layout`, `start-menu`) into `openspec/specs/`; verify `openspec validate --specs` passes and record both gate results.

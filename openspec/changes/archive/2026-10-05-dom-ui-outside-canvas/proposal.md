# Proposal

## Why

Everything the game shows — the play field, the score readout, the starting menu, the records and help views, the game-over screen, the GitHub icon — is painted inside one `<canvas>` whose logical size is `COLS*CELL × ROWS*CELL` (240×480). `fitCanvas()` (`js/input.js`) applies a single uniform contain-fit scale to that box, so the interface is locked inside the board's footprint. On a wide desktop (1920×1080) the board grows by height to 492×984 px and leaves ~714 px of unusable margin on each side, while every menu label, records line and help line stays crammed into the 492 px column. The score is also drawn *over* the play area (`render()` in `js/render.js`, which used a `drawText` call for `'Score: ' + game.score` at the top-left of the board), where it can occlude falling pieces.

## What Changes

- The `<canvas>` keeps **only** the play field: grid, landed solid blocks, falling pieces, snake.
- **BREAKING** — the score readout and the gameplay hints move out of the canvas into ordinary page (DOM) elements, so they can sit outside the play field.
- **BREAKING** — the starting menu, the records view, the help view and the game-over screen become DOM elements instead of canvas overlays (`drawMenu`, `drawRecords`, `drawHelp`, `drawOverlay`, `overlayBackground` in `js/render.js` are no longer the rendering path for these states).
- The GitHub icon becomes a real anchor (`<a>` with an inline SVG) instead of a `Path2D` octocat plus `window.open(GITHUB_URL, '_blank')` — a popup blocker can no longer swallow the click.
- The field and the interface scale **independently**: the field keeps its contain-fit scale, the interface uses normal page/CSS sizing. This is the desktop win; on a narrow phone viewport the board already fills the width, so interface placement there is a separate responsive rule.
- Removed as a consequence: the canvas layout constants that exist only to share drawing geometry with pointer hit-testing (`MENU_ITEM_Y`, `MENU_ITEM_HIT_H`, `RECORDS_LINE_Y`, `RECORDS_LINE_SPACING`, `RECORDS_RETURN_Y`, `HELP_CONTROLS_Y`, `HELP_RULES_Y`, `HELP_RETURN_Y`, the `GITHUB_ICON_*` pair in `js/constants.js`) and the menu/records/help/game-over hit-test branches in `onPointerUp` (`js/input.js`). Steering (`toLogical`, `tapToDir`, `swipeToDir`) is unaffected.

## Follow-up scope (raised after the split landed)

The user asked, once the split was live: the canvas must not show the play field while the menu is up, and on mobile the score readout may sit over the canvas. Pinned decisions, all of them superseding parts of D5/D6:

- **The field is hidden in `MENU`, `RECORDS` and `HELP`; it stays in `PLAYING` and `GAME_OVER`.** A board behind a menu is dead pixels; the final board at game over is the result the player wants to see, and the `hud` "Game-over status message as a page element" requirement already says the final board remains visible in the play field.
- **Hiding is `display: none`**, so the hidden field takes no flex track: on a phone the menu, records and help column gets the full viewport height instead of a band above a blank board.
- **The score overlays the top edge of the field** where the interface stacks above it (narrow viewports). It stays a page element — only its placement changes — and it overlays only while the field is on screen, so it never floats over a hidden board.
- **The field grows back.** The readout leaves the interface band, so `interfaceBandHeight()` stops counting it and the phone field returns from 275×550 to ≈374×748. `app.js` re-fits when the band changes, because the band now depends on which view is shown.

## Capabilities

### New Capabilities
- `hud`: the text that accompanies live play — the running score readout and the game-over status message — rendered as page elements outside the play field.
- `responsive-layout`: the contract that the play field and the page interface scale independently of each other across viewports, without the interface overlapping or clipping the field.

### Modified Capabilities
- `start-menu`: the menu, records and help views and the GitHub link become page elements. The requirements that exist only because the interface lived in the canvas — the label block being left-aligned and centred on the *board*, labels not clipped at the *board* edge, help lines fitting the *board* width — are restated against the page. Keyboard, pointer and gamepad selection must keep working through the new DOM targets without double-firing.
- `mobile-input`: "Responsive canvas sizing" and "Touch gesture handling" become scoped to the play field, with the interface laid out separately; the touch-suppression rules (`touch-action: none`, no text selection, no long-press menu) apply to the board, not the whole page.

`highscores`, `snaketris-game` and `controller` keep their requirement-level behaviour (the records view still lists the top 10 with dates and an empty state; the game still runs on a canvas; gamepad navigation still drives the same menu transitions) and are not delta specs here.

## Impact

- **Code:** `snaketris.html` (DOM structure + CSS), `js/app.js` (`init()` canvas sizing and element wiring), `js/render.js` (canvas path shrinks to the field), `js/input.js` (`fitCanvas`, pointer hit-testing for non-playing states), `js/constants.js` (layout constants retire), `js/state.js` (unchanged state machine, becomes the single view authority).
- **Specs:** `start-menu` (11 requirements, several canvas-relative), `mobile-input` (5), plus two new capabilities.
- **Verification scripts that pin canvas geometry and will need rewriting, not adapting:** `scripts/verify-menu-geometry.mjs`, `scripts/verify-github-icon.mjs` (taps logical canvas coordinates), `scripts/controller-stubs.mjs` (`makeCanvas()`).
- **Behaviour change to name:** gestures that start on the interface area are no longer steering gestures — `touch-action: none` and `setPointerCapture` are scoped to the canvas element, so the board remains the only gesture surface.
- **Trap:** keyboard menu navigation is already handled in `onKey` (`js/input.js:41`) with arrows/W/S + Enter/Space. If menu items become focusable elements, Enter/Space can fire both the native activation and `onKey`, double-confirming a selection.

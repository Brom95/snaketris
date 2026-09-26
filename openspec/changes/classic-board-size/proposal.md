# Proposal

## Why

The current playfield is 24×30 logical cells (a 576×720 buffer), which is large and far from the classic 10×20 Tetris proportions. The user wants a smaller, classic-proportioned board that still fits the whole field on every screen size, with the same "contain" fit behavior the site already uses (scale to fit, never enlarge).

## What Changes

- Reduce the logical playfield from 24×30 to **10×20** (classic Tetris proportions), updating the derived native buffer size (`BOARD_W`/`BOARD_H`) and the canvas `width`/`height` in `app.js` (auto-derived from `COLS`/`ROWS` × `CELL`).
- Rescale the overlay layout constants (`js/constants.js`: `MENU_ITEM_Y`, `MENU_ITEM_HIT_H`, `RECORDS_*`, `HELP_*`) and the hardcoded overlay `y`-coordinates in `js/render.js` (`drawMenu` title/hint, `drawRecords` title/empty-state) so the menu, records, and help views fit the new 240×480 logical buffer instead of the old 576×720.
- **Keep the existing "standard contain" responsive fit** (`fitCanvas()` in `js/input.js`): scale to fit the viewport, preserve aspect ratio, cap at 1 (never enlarge). No change to the fit algorithm, so the whole board remains visible on all screens.
- Preserve the project invariant: the canvas buffer is never resized at runtime — only CSS-scaled via `fitCanvas()`; no new dependencies, no build step.
- No change to game mechanics (movement, wrap, eating, difficulty ramp, snake/piece speed relationship, death, restart) or to keyboard/touch input behavior.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- (none — no spec-level requirement changes)

This change only alters board dimensions and overlay layout (implementation/layout), and it **preserves** the existing `Responsive canvas sizing` fit behavior. No capability's requirements change, so `skip_specs: true` is set in `.openspec.yaml`. No requirement is invented to satisfy validation.

## Impact

- **Code**: `js/constants.js` (grid size + overlay layout constants), `js/render.js` (overlay `y` coordinates), `js/app.js` (canvas native size, auto-derived), `js/input.js` (fitCanvas left unchanged). Snake start position in `js/state.js` auto-adjusts via `ROWS/2`; piece spawn (`js/pieces.js`) and grid init (`js/grid.js`) derive from `COLS`/`ROWS`.
- **No new dependencies, no build step** (vanilla ES modules, no bundler).
- **Behavior preserved**: all keyboard + touch input paths (including the shared `setDirection` steering gate) are untouched; the menu/records/help remain selectable via keyboard, mouse, and touch.
- **Risk area**: overlay hit-testing in `js/input.js` uses `MENU_ITEM_Y`/`MENU_ITEM_HIT_H`; those constants must be kept in sync with how `drawMenu()` paints the items.

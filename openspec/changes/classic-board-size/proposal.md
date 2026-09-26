# Proposal

## Why

The current playfield is 24×30 logical cells (a 576×720 buffer), which is large and far from the classic 10×20 Tetris proportions. The user wants a smaller, classic-proportioned board that still fits the whole field on every screen size, and — as a post-deploy refinement — wants the field inscribed into the smaller side of the viewport (full height on a desktop) via the unbounded "contain" fit.

## What Changes

- Reduce the logical playfield from 24×30 to **10×20** (classic Tetris proportions), updating the derived native buffer size (`BOARD_W`/`BOARD_H`) and the canvas `width`/`height` in `app.js` (auto-derived from `COLS`/`ROWS` × `CELL`).
- Rescale the overlay layout constants (`js/constants.js`: `MENU_ITEM_Y`, `MENU_ITEM_HIT_H`, `RECORDS_*`, `HELP_*`) and the hardcoded overlay `y`-coordinates in `js/render.js` (`drawMenu` title/hint, `drawRecords` title/empty-state) so the menu, records, and help views fit the new 240×480 logical buffer instead of the old 576×720.
- **Refine the responsive fit** (`fitCanvas()` in `js/input.js`): keep the contain fit (scale to fit the viewport, preserve aspect ratio) but remove the cap at 1, so the field inscribes into the smaller viewport side and may enlarge on large screens. The whole board remains visible on all screens.
- Preserve the project invariant: the canvas buffer is never resized at runtime — only CSS-scaled via `fitCanvas()`; no new dependencies, no build step.
- No change to game mechanics (movement, wrap, eating, difficulty ramp, snake/piece speed relationship, death, restart) or to keyboard/touch input behavior.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities
 
- `Responsive canvas sizing` (mobile-input): the canvas is now inscribed into the smaller viewport side on larger viewports (cap removed; the old "not enlarged on larger viewports" scenario is replaced). See the delta spec in `specs/mobile-input/spec.md`.
 
This change alters board dimensions, overlay layout, and the responsive-fit contract. The only capability whose requirements change is `Responsive canvas sizing` in `mobile-input` (delta spec in `specs/mobile-input/spec.md`), so `skip_specs` is removed from `.openspec.yaml`. No requirement is invented to satisfy validation.

## Impact

- **Code**: `js/constants.js` (grid size + overlay layout constants), `js/render.js` (overlay `y` coordinates), `js/app.js` (canvas native size, auto-derived), `js/input.js` (`fitCanvas` cap removed so the field fills the smaller viewport side). Snake start position in `js/state.js` auto-adjusts via `ROWS/2`; piece spawn (`js/pieces.js`) and grid init (`js/grid.js`) derive from `COLS`/`ROWS`.
- **No new dependencies, no build step** (vanilla ES modules, no bundler).
- **Behavior preserved**: all keyboard + touch input paths (including the shared `setDirection` steering gate) are untouched; the menu/records/help remain selectable via keyboard, mouse, and touch.
- **Risk area**: overlay hit-testing in `js/input.js` uses `MENU_ITEM_Y`/`MENU_ITEM_HIT_H`; those constants must be kept in sync with how `drawMenu()` paints the items.

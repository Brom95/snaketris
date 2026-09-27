# field-margins

## Why
The playfield currently fills the smaller side of the viewport edge-to-edge (no vertical gap), so the board touches the top and bottom screen edges with no breathing room. The fixed `#hint` line at the bottom of the screen sits on the board's bottom edge. In addition, the in-board instruction text (the help-view lines and the menu hint line) is wider than the 240-buffer-px board, so it is clipped at the board edge — on a mobile device the board edge *is* the screen edge, so the "instructions" run past the screen boundary. The bottom hint is redundant because the "How to Play" menu item already shows the controls and rules.

## What Changes
- **Remove the fixed `#hint` element and its CSS from `snaketris.html`** — controls are discoverable via the "How to Play" menu item (this also eliminates the hint-overlap problem).
- A new `FIELD_V_GAP` constant (`2 * CELL`, 48 screen px) in `js/constants.js` — the vertical gap reserved between the field and the top/bottom viewport edges (≈ 1 displayed cell of breathing room at 1080 p, more at smaller viewports).
- `fitCanvas()` in `js/input.js` reserves that gap when computing the scale: the canvas is still inscribed into the smaller viewport side, but inset from the top and bottom viewport edges by at least one board cell.
- The in-board instruction strings in `js/render.js` (the menu hint line and the six control/rule lines of the help view) are shortened so every line fits inside the 240-buffer-px board width at any screen size (no clipping at the board edge).

Game mechanics, keyboard/touch input, and all layout constants are unchanged. No new dependencies, no build step.

## Capabilities
- **Modified Capabilities**:
  - `mobile-input` — "Responsive canvas sizing" is modified to require the vertical gap (the board is inset from the top/bottom viewport edges by at least one board cell, full board visible without scrolling).
  - `start-menu` — "Starting menu on launch and after game over" and "Help view shows controls and rules" are modified to require the menu hint line and all help-view text lines to fit within the board width.

## Impact
- `js/constants.js` — new `FIELD_V_GAP` constant.
- `js/input.js` — `fitCanvas()` only.
- `snaketris.html` — remove the `#hint` element and its CSS block.
- `js/render.js` — text content of the `drawMenu()` hint line and the `drawHelp()` strings only (no layout/font changes).
- `openspec/specs/mobile-input/spec.md` and `openspec/specs/start-menu/spec.md` — via this change's delta specs at archive time.

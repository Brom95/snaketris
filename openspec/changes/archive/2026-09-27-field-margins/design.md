# Design — field-margins

## Approach
Three independent changes, all in the layout/presentation layer:

### 1. Remove the fixed bottom hint
- Delete the `#hint` element (`<div id="hint">arrows / WASD to steer · swipe or tap to steer · R or tap to start</div>`) and its CSS block from `snaketris.html`.
- Safe to remove: no JS references the `#hint` element (verified). The same information (steer with arrows/WASD or swipe/tap; start with R) is available in the "How to Play" menu item and the in-board menu hint line.
- This eliminates the hint-overlap problem outright.

### 2. Vertical gap for the field
- **New constant** in `js/constants.js`: `FIELD_V_GAP = 2 * CELL` (48 screen px). Two native cells ≈ one displayed cell of breathing room at 1080 p (displayed cell ≈ 49 px; margin 48 px ≈ 0.98 cell) and more at smaller viewports (768 p: ≈ 1.4 cells; 360×800: ≈ 1.4 cells).
- **`fitCanvas()`** in `js/input.js`:
  ```js
  const scale = Math.min(
    window.innerWidth / BOARD_W,
    (window.innerHeight - 2 * FIELD_V_GAP) / BOARD_H
  );
  ```
  Because the body flex-centers the canvas (`align-items: center`, `min-height: 100vh`), when height-limited the top and bottom margins each equal `FIELD_V_GAP` (48 px); when width-limited the margins are even larger. The horizontal sizing is unchanged (`innerWidth / BOARD_W`), so width-limited viewports are unaffected.
- The gap is now for breathing room only (no longer sized to clear the hint, which is removed).

### 3. Instruction text fits the 240-buffer-px board width
The board buffer is 240 px wide. A monospace glyph is conservatively 0.6 em (≈ 8.4 buffer px at 14 px, ≈ 7.8 at 13 px), so lines must be ≤ 28 chars (14 px) / ≤ 30 chars (13 px). Target ≤ 27 chars → ≤ 226.8 px → ≥ 13 px margin per side.

- `drawMenu()` hint (13 px): `"Arrows/W-S move · Enter/Space choose · R to start"` (47 chars, clipped) → `"Arrows/W-S move · R to start"` (28).
- `drawHelp()` (14 px):
  - `"Arrows / WASD — steer the snake"` (31) → `"Arrows / WASD — steer"` (20)
  - `"Swipe or tap — steer on touch"` (29) → `"Swipe or tap — steer"` (21)
  - `"R / click — start or restart"` (28) → `"R or click — start"` (20)
  - `"Eat falling pieces for +1 each."` (31) → `"Eat falling pieces: +1 each"` (27)
  - `"Avoid landed blocks and your own body."` (38) → `"Avoid blocks and your body."` (27)
  - `"Edges wrap around the board."` (28) → `"Edges wrap around the board"` (27)

Only the string content changes; draw positions, fonts, and layout constants are untouched.

## Alternatives considered
- **Keep the hint and add a bottom gap to clear it**: rejected — the user prefers removing the redundant hint (the "How to Play" menu item already covers it). Removing it is simpler and also frees the bottom gap from the hint-clearance constraint.
- **Smaller fixed gap (1 cell = 24 px)**: at 1080 p that is only ≈ 0.46 displayed cells of breathing room — too tight. 2 cells (48 px) keeps the gap at ≈ 1 displayed cell at 1080 p and more at smaller viewports.
- **Proportional gap (exactly 1 displayed cell = `CELL * scale`)**: `scale = innerHeight / (BOARD_H + 2 * CELL)`. Guarantees exactly 1 displayed cell, but the gap in screen px varies with the viewport and the formula is less obvious than a named constant. A fixed `2 * CELL` is simpler and satisfies "≥ 1 cell" in both interpretations (2 logical cells; ≈ 1 displayed cell at 1080 p, more elsewhere).

## Risks / trade-offs
- Removing the hint means the on-screen steering reminder is gone while the menu/help views are shown; the "How to Play" item and the in-board menu hint line cover the same information.
- Help-text shortening changes wording; the core meaning is preserved (steer with arrows/WASD or swipe/tap; eat falling pieces for points; avoid blocks and your own body; edges wrap). The requirement "core rules are listed" is still satisfied.
- On height-limited viewports the board is now ≈ 96 px smaller in viewport height (1080 p: 1080 → 984 px tall) — the price of the requested breathing room.

## Ordering note
This change's "Responsive canvas sizing" delta is the complete final definition of that requirement (unbounded contain from the in-progress `classic-board-size` change **plus** the margin rule). To keep both in the merged spec, `classic-board-size` should be archived before this change is applied.

## Verification
- Headless (node): margin math at 1920×1080, 1366×768, 360×800, 320×800 — canvas height ≤ innerHeight − 96, top and bottom margins each ≥ 48 px, no page scroll.
- Headless (node): confirm the `#hint` element and CSS are gone (grep `#hint` in the HTML returns nothing; no JS references it).
- Headless (node): every new instruction string fits the 240-buffer-px board at 0.6 em (menu hint ≤ 28 chars; help lines ≤ 28 chars; actual max: 27).
- Browser e2e (user): desktop + mobile — no hint element; the field has ≈ 1 displayed cell of breathing room at top and bottom; the menu hint and every help line are fully visible (no clipping at the screen edge).

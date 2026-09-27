# Design

## Context

The starting menu is drawn by `drawMenu()` in `js/render.js` on the fixed 240×480 logical canvas (`BOARD_W = COLS * CELL = 240`, `BOARD_H = ROWS * CELL = 480`). Every label in the menu is currently drawn with `drawText(..., canvas.width / 2, y, ...)` using the default `align: 'center'` and `baseline: 'middle'`, so each line is centered independently on the canvas center (x = 120). The canvas buffer is never resized; it is only CSS-scaled by `fitCanvas()` in `js/input.js`.

The layout constants that position the menu vertically (`MENU_ITEM_Y`, and the hard-coded y values 120 and 420) live in `js/constants.js` and are shared by `render.js` (drawing) and `input.js` (pointer hit-testing). Pointer hit-testing is purely `y`-based (`Math.abs(end.y - MENU_ITEM_Y[i]) <= MENU_ITEM_HIT_H / 2`), so horizontal text position does not affect selection.

See `proposal.md` for motivation. See the `start-menu` capability spec for the requirements.

## Goals / Non-Goals

**Goals:**
- Left-align all starting-menu labels (title, three items, hint line) to a single shared left edge.
- Keep the menu block horizontally centered on the screen so the widest label's center coincides with the board center and no label is clipped at the board edge at any screen size.
- Leave vertical positions, fonts, colors, the "▶ " highlight prefix, and all input handling untouched.

**Non-Goals:**
- No change to the Records or Help views (they remain center-aligned).
- No change to `fitCanvas()`, canvas sizing, or the CSS.
- No change to the in-game board, score overlay, or `GAME_OVER` overlay.

## Decisions

### Decision 1: Compute the left anchor dynamically from the widest label
- **Choice:** At draw time, measure every label that will be drawn (the title, each item with its current highlight state, and the hint line) using `ctx.measureText(text).width` with that label's font, take the maximum, and set the shared left edge to `BOARD_W / 2 - widest / 2`. Draw each label with `align: 'left'` at that edge.
- **Rationale:** This is exact (it uses the real rendered glyph width, not an estimate) and self-correcting: if a label, font size, or the hint text ever changes, the block re-centers automatically and the "widest label centered" invariant holds without any magic constant. It directly satisfies the spec's "widest label's horizontal center coincides with the board center" requirement.
- **Alternatives considered:**
  - *Fixed `MENU_LEFT_EDGE` constant in `constants.js`*: brittle — any font or string change would shift the block off-center or clip it. Rejected.
  - *Center based on a fixed reference line (e.g., the hint always)*: hard-codes one line as the widest; breaks if another line grows. Rejected in favor of measuring all lines.
  - *Left-align to a fixed margin (e.g., 10 px) and accept off-center block*: violates the "menu stays centered" requirement. Rejected.

### Decision 2: Reuse `drawText()` with `align: 'left'` (no new draw helper)
- **Choice:** Keep the existing `drawText(text, x, y, { font, align, color, baseline })` helper and pass `align: 'left'` and the computed `left` x for each menu label. The `baseline` stays the default `'middle'`, so vertical positions are unchanged.
- **Rationale:** `drawText()` already supports an explicit `align` option (used by the score overlay). No new helper or signature change is needed.
- **Alternatives considered:**
  - *New `drawLeftText` helper*: unnecessary duplication; `align` option already exists. Rejected.

### Decision 3: Measure with the label's own font before drawing
- **Choice:** For each label, set `ctx.font` to that label's font, call `ctx.measureText(text).width`, then draw via `drawText()` (which re-sets the font and fills correctly). The measured width is taken over all labels being drawn, including the highlighted item's `24px` bold + "▶ " prefix.
- **Rationale:** `measureText` width depends on the current font; measuring each label with its own font yields the true rendered width. The widest line is the 13 px hint (218.4 px); the highlighted "▶ How to Play" (24 px bold) is 172.8 px, so the hint is always widest and the anchor is stable (~10.8 px left, ~229.2 px right) within the 240 px board.
- **Alternatives considered:**
  - *Use the 0.6 em estimate from the field-margins design*: approximate and font-dependent; `measureText` is exact. Rejected.

## Risks / Trade-offs

- [Sub-pixel / font metric variance] → `measureText` is measured at draw time with the actual font, so the anchor tracks the real rendered width; minor sub-pixel rounding cannot clip text because the widest line defines the anchor.
- [A future wider label] → The dynamic measurement keeps the block centered and unclipped for any label set; if a single line ever exceeds the board width it would clip, but that is already the case under the current center-aligned layout and is out of scope.
- [Records/Help stay center-aligned] → Intentional (start menu only); the two views are unchanged and their existing "fit within board width" guarantees are preserved.

## Migration Plan

Single-file (plus one constant) change, no data or schema migration. Deploy by replacing `drawMenu()` and (optionally) adding a layout constant; no feature flag needed. Rollback: revert the `drawMenu()` change (the menu simply returns to per-line center alignment, which is the prior behavior).

## Open Questions

None — the approach is fixed by the spec's "left-aligned + block centered + unclipped" requirements and the existing `drawText()` API.

# Design

## Context

The playfield is a fixed logical grid rendered into a canvas buffer that is **never resized at runtime** — only CSS-scaled by `fitCanvas()` (`js/input.js`), which uses an unbounded "contain" fit: `scale = min(innerWidth/BOARD_W, innerHeight/BOARD_H)`. The field may enlarge on large screens so it fills the smaller viewport side. Today (before this change) `COLS=24`, `ROWS=30`, `CELL=24` → a 576×720 buffer.

Overlay views (menu, records, help) are painted in **logical canvas coordinates** and their positions are centralized in `js/constants.js`. Only the menu is hit-tested by position (`js/input.js` `onPointerUp` uses `MENU_ITEM_Y` + `MENU_ITEM_HIT_H`); the records/help "Menu" return labels are click-anywhere (state-based), so their y-coordinates are drawing-only.

## Goals / Non-Goals

**Goals:**
- Shrink the logical playfield to classic Tetris proportions (10 wide × 20 tall).
- Keep the whole board fully visible on every screen via the contain fit (cap removed so it fills the smaller viewport side on large screens).
- Keep the menu, records, and help views fully on-screen and correctly hit-tested after the board shrinks.
- Preserve every existing game-mechanic and input behavior byte-for-byte.

**Non-Goals:**
- Changing the piece fall-speed model, the snake/piece speed relationship, scoring, or death rules.
- Changing the fit to a "cover" mode or cropping the field (contain is preserved — the field is always fully visible; only the upper cap is removed so it can enlarge).
- Re-architecting rendering or introducing a new build step / dependency.

## Decisions

1. **Target grid: `COLS=10`, `ROWS=20`.** This is the user-confirmed classic proportion. `BOARD_W`/`BOARD_H` recompute to 240×480 automatically; `app.js` sets `canvas.width/height = COLS*CELL / ROWS*CELL`, so the buffer becomes 240×480.

2. **Keep `CELL=24` as the logical base; rely on the existing CSS scale for the adaptive on-screen size.** The "adaptive cell size" the user asked for is already produced by `fitCanvas()` (on-screen cell = `CELL * scale`). Changing the logical `COLS`/`ROWS` is what changes the aspect ratio and native size; the per-viewport cell size is derived, not hardcoded. *Alternative considered:* recompute the canvas buffer size per resize — rejected, it violates the buffer-never-resized invariant and adds rAF coupling.

3. **Rescale overlay layout constants to the new 480-tall buffer.** The old constants were tuned for 720 height; at 480 they fall off-screen. New values (below) keep the same visual hierarchy while fitting 240×480:

   | Constant | Old | New | Note |
   |---|---|---|---|
   | `MENU_ITEM_Y` | `[280,340,400]` | `[200,250,300]` | hit-tested; gaps ≥ hit half-height (22) |
   | `MENU_ITEM_HIT_H` | `44` | `44` | unchanged |
   | `RECORDS_LINE_Y` | `180` | `150` | 10 lines × 30 fit before return |
   | `RECORDS_LINE_SPACING` | `40` | `30` | 10 lines span 150→420 |
   | `RECORDS_RETURN_Y` | `640` | `455` | drawing-only |
   | `HELP_CONTROLS_Y` | `160` | `130` | drawing-only |
   | `HELP_RULES_Y` | `320` | `230` | drawing-only |
   | `HELP_RETURN_Y` | `640` | `455` | drawing-only |

4. **Move the remaining hardcoded overlay `y`-coordinates in `js/render.js`** (they are drawing-only, so they stay as literals rather than new constants): `drawMenu` title `200→120`, hint `480→420`; `drawRecords` title `120→120` (keep), empty-state `300→240`. `drawHelp` title stays `100`. All new values are within `0..480`.

5. **Hit-testing stays correct by construction.** `MENU_ITEM_Y`/`MENU_ITEM_HIT_H` live in `constants.js` and are shared by `drawMenu()` (painting) and `onPointerUp()` (hit-testing), so both refer to the same values. The new Y's `[200,250,300]` with half-height 22 give non-overlapping ranges `[178,222]`, `[228,272]`, `[278,322]`, all inside the board.

6. **Snake start auto-adjusts.** `state.js::resetSnake()` uses `mid = floor(ROWS/2)` (→10) and columns 3–6, all valid in a 10-wide board, so no change is required. *Alternative considered:* re-center the snake to columns 3–6→ centered on 5; not needed, current span is already centered and in-bounds.

7. **Piece spawn and grid init are size-agnostic.** `pieces.js::spawnPiece()` uses `Math.floor(Math.random() * (COLS-3))` (→ 0..6, valid), `row=-5`, and all bounds checks reference `COLS`/`ROWS`. `grid.js::initGrid()` loops `COLS`×`ROWS`. No changes.

## Risks / Trade-offs

- **Overlay text clipping on the 480-tall buffer** → mitigated by the concrete Y values in Decision 3–4; verified all painted y's are within `0..480` and the 10-line records list ends at 420, above the return label at 455.
- **Menu hit-testing drifting from painted items** → mitigated by Decision 5 (single source of truth in `constants.js`, shared by paint + hit-test).
- **CSS upscaling on very large screens** (the 240×480 buffer is scaled up — e.g. to 1080×2160 at 4K — so cells may look soft) → accepted: the buffer is never resized per project invariant; the user asked for the field to fill the smaller side, which requires this CSS scaling.
- **Records list cramped at 30px spacing** → acceptable for a 10-line top-10 on a small board; the 16px monospace labels remain legible.

## Migration Plan

Single, self-contained commit to `main`. No data migration (high scores are stored independently of board size). Deploys through the existing GitHub-hosted Pages workflow; no build step or dependency changes. **Rollback:** revert the commit (or `git revert`); the 24×30 constants and old layout values return, restoring prior behavior.

## Open Questions

None — the two material decisions (board size = 10×20, fit rule = contain) were confirmed with the user, and all remaining layout values are concrete. (Post-deploy refinement: the contain cap-at-1 was removed at the user's request so the field fills the smaller viewport side.)

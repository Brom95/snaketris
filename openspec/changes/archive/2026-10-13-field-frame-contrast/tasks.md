# Tasks: field-frame-contrast

## 1. Paint the frame

- [x] 1.1 `js/render.js` `drawGrid()` draws the inner lines only: `c = 1 .. COLS - 1`
      vertical, `r = 1 .. ROWS - 1` horizontal, in `COLORS.grid` at `lineWidth = 1`.
- [x] 1.2 `js/render.js` `drawGrid()` strokes the outer frame with
      `ctx.strokeStyle = COLORS.solid`, `ctx.lineWidth = 2`,
      `ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2)`, so the two-pixel
      stroke is not clipped by the canvas edge.
      Verify: `npm test` green and `npm run verify` reports "All 12 checks passed."

## 2. Test surface

- [x] 2.1 `tests/helpers/dom-stub.js` adds `strokeRect: () => {}` to the canvas 2d
      context stub, so the shared stub serves the new call.
- [x] 2.2 `tests/render.test.js` asserts the frame is stroked in `COLORS.solid` and the
      inner lines keep `COLORS.grid`.

## 3. Specs

- [x] 3.1 Sync `openspec/specs/piece-rendering/spec.md` with the delta.
- [ ] 3.2 Archive the change.

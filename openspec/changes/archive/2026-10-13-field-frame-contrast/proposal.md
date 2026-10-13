# Proposal: field-frame-contrast

## Why

The player cannot see where the play field ends. `js/render.js` `drawGrid()` strokes
every grid line, including the four outer edges, in `COLORS.grid`
(`rgba(255,255,255,0.05)`) over `COLORS.bg` (`#0b0e14`). That is about five percent
white: the border is effectively invisible. `snaketris.html` adds no CSS border to the
canvas either. The board limits therefore read as empty background, and a block that
lands against the left or right edge looks like it is floating in space.

## What Changes

- The outer frame of the field is painted in `COLORS.solid` (`#f97316`), the colour of
  landed Tetris blocks, at `lineWidth = 2`. The frame reads as a wall in the block
  colour and the field limits become obvious.
- The inner grid lines keep `COLORS.grid` and `lineWidth = 1`, so the faint grid does
  not compete with the frame.
- The frame is inset by one pixel so a two-pixel stroke is not clipped by the canvas
  edge.

## Impact

- Modules touched: `js/render.js` only. No state, no engine, no layout constant changes.
- Tests: `tests/render.test.js` gains a frame check; `tests/helpers/dom-stub.js` must
  serve the new `strokeRect` call on the canvas context stub.
- Harness: unchanged scripts still pass — the paint change does not move the canvas box,
  so `verify-field-only` and `verify-page-layout` keep their geometry.
- Spec: `openspec/specs/piece-rendering/spec.md` gains one requirement.

## User Decisions

The user reported the symptom and stated the fix in one message: "все в порядке, это я
не увидел границы поля. можем мы как-то сделать их немного контрастнее? пусть рамка
будет в цвет блоков тетрисв" — the field boundaries were invisible, make them more
contrasty, and paint the frame in the colour of the Tetris blocks.

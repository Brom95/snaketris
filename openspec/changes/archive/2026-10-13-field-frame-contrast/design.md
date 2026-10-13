# Design: field-frame-contrast

## Where the paint lives

`js/render.js` `drawGrid()` is the only place that strokes the field. It draws `COLS + 1`
vertical and `ROWS + 1` horizontal lines. The first and last line of each loop are the
outer frame. The change splits that one loop into two paints:

1. Inner lines: `c = 1 .. COLS - 1`, `r = 1 .. ROWS - 1`, `COLORS.grid`, `lineWidth = 1`.
2. Outer frame: one `strokeRect`, `COLORS.solid`, `lineWidth = 2`.

`COLORS.solid` is already imported into `js/render.js` and is the colour `drawCell` uses
for landed blocks, so the frame and the blocks match by construction, not by a copied
hex value.

## Canvas geometry

The canvas buffer is never resized. It is `BOARD_W = COLS * CELL = 240` by
`BOARD_H = ROWS * CELL = 480` logical pixels and only CSS-scaled. A stroke of width 2
centred on the canvas edge loses half its width outside the buffer. The frame is therefore
stroked at `strokeRect(1, 1, canvas.width - 2, canvas.height - 2)`: the stroke spans
pixels 0..2 and the last two columns/rows, fully inside the buffer.

## Why not CSS

A `border` on the `canvas` element in `snaketris.html` would also work. It was rejected:
the harness scripts `verify-field-only` and `verify-page-layout` measure the canvas box,
and a CSS border changes that box. Painting inside the buffer keeps every measured
geometry identical.

## Test surface

`tests/helpers/dom-stub.js` fakes the 2d context with a Proxy whose target lists the
methods a test may call. `strokeRect` is absent, so the new call throws. Add
`strokeRect: () => {}` to that target.

`tests/render.test.js` asserts the frame colour by capturing the context calls. The stub
records nothing today, so the test drives `drawGrid()` through a recording context and
asserts the frame stroke carries `COLORS.solid` while inner lines carry `COLORS.grid`.

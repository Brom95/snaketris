// Engine canvas: the drawing buffer, its size, and the one cell primitive.
// A consumer creates it with its own board numbers, attaches a page element,
// and registers its own painters. This file imports nothing and names no game
// noun: it knows a buffer, a cell and a rectangle, nothing else.

export function createCanvas(options) {
  const width = options.width;
  const height = options.height;
  const cell = options.cell;

  let element = null;
  let ctx = null;

  return {
    // Size the buffer once and take its 2d context. The buffer never resizes
    // later; only the CSS display size changes (see js/layout.js fit).
    attach(el) {
      element = el;
      element.width = width;
      element.height = height;
      ctx = element.getContext('2d');
      return element;
    },
    context() {
      return ctx;
    },
    // The buffer extent, so a consumer can stroke to the edge without naming a size.
    width() {
      return width;
    },
    height() {
      return height;
    },
    // The one cell primitive: an inset square so grid lines stay readable between cells.
    drawCell(r, c) {
      ctx.fillRect(c * cell + 1, r * cell + 1, cell - 2, cell - 2);
    },
  };
}

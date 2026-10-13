// Engine presentation pass: the per-frame painter registry.
// A consumer registers named painters in draw order, once, and calls the pass
// once per rendered frame. The pass runs each registered painter in that order
// and never names a painter, a screen, or a game noun. Registration is keyed by
// name, so a module that initializes twice cannot paint twice: the later
// registration replaces the earlier one and keeps its slot.

const canvasPainters = new Map();
const pagePainters = new Map();

// Register one painter under a name, in the order the first call registers it.
export function registerCanvasPainter(name, painter) {
  canvasPainters.set(name, painter);
}

export function registerPagePainter(name, painter) {
  pagePainters.set(name, painter);
}

// Run the canvas pass: every registered painter, in draw order.
export function paintCanvas(ctx) {
  for (const painter of canvasPainters.values()) painter(ctx);
}

// Run the page pass: every registered painter, in draw order.
export function paintPage(ctx) {
  for (const painter of pagePainters.values()) painter(ctx);
}

// The registered names, in draw order. A consumer reads them to check that its
// painters hold the slots it asked for.
export function canvasOrder() {
  return [...canvasPainters.keys()];
}

export function pageOrder() {
  return [...pagePainters.keys()];
}

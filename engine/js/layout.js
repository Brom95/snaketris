// Engine layout: the one viewport rule and the field fit.
// A consumer supplies the field box and the page's gap values as parameters;
// this file imports nothing and names no game noun.

export function createLayout(options) {
  const boardWidth = options.boardWidth;
  const boardHeight = options.boardHeight;
  const stackMaxWidth = options.stackMaxWidth;
  const columnMin = options.columnMin;
  const gap = options.gap;
  const gapMobile = options.gapMobile;

  // The scale that contains the whole field in the viewport, keeping aspect ratio.
  function scale() {
    return Math.min(window.innerWidth / boardWidth, (window.innerHeight - 2 * gap) / boardHeight);
  }

  // The one viewport rule: it answers both whether the interface column stacks
  // above the field and the vertical gap the field keeps. Both the band and the
  // fit read this helper, so the two cannot drift apart.
  function rule() {
    const narrow = window.innerWidth <= stackMaxWidth;
    return {
      stacked: narrow || window.innerWidth - boardWidth * scale() < columnMin + gap,
      gap: narrow ? gapMobile : gap,
    };
  }

  return {
    scale,
    rule,
    // Height the stacked interface takes from the field, including the gap.
    // Zero when the interface shares a track beside the field.
    band(el) {
      const r = rule();
      if (!r.stacked || !el) return 0;
      return el.getBoundingClientRect().height + r.gap;
    },
    // Contain fit: scale so the whole field fits the viewport, preserving aspect
    // ratio. No upper cap, so the field enlarges on large screens. `reserved` is
    // the height an already-stacked interface claims.
    fit(el, reserved) {
      const r = rule();
      const availableH = Math.max(window.innerHeight - 2 * r.gap - reserved, r.gap);
      const s = Math.min(window.innerWidth / boardWidth, availableH / boardHeight);
      el.style.width = (boardWidth * s) + 'px';
      el.style.height = (boardHeight * s) + 'px';
    },
  };
}

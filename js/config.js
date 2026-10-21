// snaketris — engine configuration. Every value here is a parameter the engine
// receives at construction; the engine itself names none of them. No imports.

// Logical grid size (cells), scaled to CSS pixels.
// Classic Tetris proportions: 10 wide × 20 tall.
export const COLS = 10;
export const ROWS = 20;
export const CELL = 24; // cell size in CSS pixels

// Timing (fixed-timestep)
export const TICK = 1 / 60; // fixed update step, seconds
// Snake growth-float speed: engine ticks one growth segment takes to fly one
// body length toward the tail. A full-length (10-segment) trip lands at about
// a quarter second (1.5 x 10 = 15 ticks at TICK = 1/60). Render-layer only.
export const SNAKE_EAT_FLOAT_SPEED = 1.5;
// A growth segment fades over the tail it lands on over this many ticks before it is pruned (task 1.2, design D8). Render-layer only.
export const FLOAT_FADE_TICKS = 6;

// Native (logical) board size in CSS pixels. The buffer is never resized;
// only the CSS display size is scaled to fit the viewport (fitCanvas).
export const BOARD_W = COLS * CELL;
export const BOARD_H = ROWS * CELL;

// Vertical gap (screen px) reserved between the field and the top/bottom
// viewport edges: breathing room left above and below the board. Two native
// cells ≈ one displayed cell at 1080 p (displayed cell ≈ 49 px) and more at
// smaller viewports.
export const FIELD_V_GAP = 2 * CELL;
// On narrow viewports (≤ UI_STACK_MAX_WIDTH) the top/bottom reservation is
// halved so the board starts higher on screen.
export const FIELD_V_GAP_MOBILE = CELL;

// Page layout (viewport px). The interface column is sized by its own rule and
// never follows the field's scale; both values are mirrored verbatim in the
// page CSS (snaketris.html): the `#ui` width and the stacking breakpoint.
export const UI_STACK_MAX_WIDTH = 760; // at or below this viewport width the interface stacks above the field
export const UI_COLUMN_MIN = 320; // mirrors `#ui { width: min(320px, 92vw) }`

// The one viewport rule for the two-player menu item: a stacked layout is a
// phone, and a phone has no second pad, so two-player mode is offered only when
// the interface sits beside the field. js/ui.js hides the item and js/screens.js
// keeps the menu cursor off it; both call this one predicate so the two rules
// cannot drift apart. With no window present (a headless test that installs no
// DOM stub) the wide layout is assumed, so navigation tests keep their old path.
export function twoPlayerOffered() {
  if (typeof window === 'undefined') return true;
  return window.innerWidth > UI_STACK_MAX_WIDTH;
}

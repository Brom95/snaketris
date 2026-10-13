// Rendering. The engine owns the drawing buffer, its size and the cell primitive;
// this module owns what the game paints: the grid, the solid blocks, the snake.
import {
  COLS, ROWS, CELL, BOARD_W, BOARD_H, SOLID, COLORS, TIER_WIDTH,
} from './constants.js';
import { game } from './state.js';
import { getGrid } from './grid.js';
import { paintPieces } from './pieces.js';
import { createCanvas } from '../engine/js/canvas.js';
import { paintCanvas, registerCanvasPainter } from '../engine/js/present.js';

// The engine drawing buffer: sized from the game's board numbers at construction.
const field = createCanvas({ width: BOARD_W, height: BOARD_H, cell: CELL });

let ctx = null;

// The one paint context every canvas painter reads: the state root, and this
// module's canvas owner (its buffer size, its 2d context, its cell helper).
const paintCtx = { state: game, field };

// The tier colours of the snake body, in recolor order: blue, then purple,
// then gold. After gold the body stays gold.
const TIERS = [COLORS.tierBlue, COLORS.tierPurple, COLORS.tierGold];

// The colour of the snake segment at index 0: the head is green; the body
// is grey until overflow reaches it, then blue, purple and gold in that
// order (Math.min(2, ...) keeps the body gold past the last tier).
export function bodyColor(index) {
  if (index === 0) return COLORS.snakeHead;
  if (game.play.overflow < index) return COLORS.snakeBody;
  const tier = Math.min(2, Math.floor((game.play.overflow - index) / TIER_WIDTH));
  return TIERS[tier];
}

// Called by app.js after the canvas exists; hands the element to the engine buffer
// and registers the painters the engine pass runs, in draw order.
export function initRender(canvasEl) {
  field.attach(canvasEl);
  ctx = field.context();
  registerCanvasPainter('field', paintField);
  registerCanvasPainter('snake', paintSnake);
  registerCanvasPainter('pieces', paintPieces);
}

function drawGrid() {
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * CELL, 0);
    ctx.lineTo(c * CELL, field.height());
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * CELL);
    ctx.lineTo(field.width(), r * CELL);
    ctx.stroke();
  }
  // The field limits read as a wall in the landed-block colour. The stroke is
  // inset by one pixel so a 2-pixel-wide stroke is not clipped by the canvas edge.
  ctx.strokeStyle = COLORS.solid;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, field.width() - 2, field.height() - 2);
}

// The field painter: background, inner grid lines, the frame, and the solid
// blocks. Runs first so every later painter draws on top of it.
function paintField(pctx) {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, field.width(), field.height());
  drawGrid();

  // Solid blocks
  const grid = getGrid();
  ctx.fillStyle = COLORS.solid;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === SOLID) field.drawCell(r, c);
    }
  }
}

// The body painter: one cell per segment, head colour first, then the tier
// colour the current overflow reaches at that index.
function paintSnake(pctx) {
  for (let i = 0; i < game.play.snake.length; i++) {
    ctx.fillStyle = bodyColor(i);
    field.drawCell(game.play.snake[i].r, game.play.snake[i].c);
  }
}

// The engine per-frame canvas pass: every registered painter, in draw order.
export function render() {
  paintCanvas(paintCtx);
}

// Rendering. The canvas + context are set by app.js (initRender); render()
// reads the shared `game` state and the grid for painting.
import {
  COLS, ROWS, CELL, SOLID, COLORS, TIER_WIDTH,
} from './constants.js';
import { game } from './state.js';
import { getGrid } from './grid.js';
import { pieceCells } from './pieces.js';

let canvas = null;
let ctx = null;

// The tier colours of the snake body, in recolor order: blue, then purple,
// then gold. After gold the body stays gold.
const TIERS = [COLORS.tierBlue, COLORS.tierPurple, COLORS.tierGold];

// The colour of the snake segment at index 0: the head is green; the body
// is grey until overflow reaches it, then blue, purple and gold in that
// order (Math.min(2, ...) keeps the body gold past the last tier).
export function bodyColor(index) {
  if (index === 0) return COLORS.snakeHead;
  if (game.overflow < index) return COLORS.snakeBody;
  const tier = Math.min(2, Math.floor((game.overflow - index) / TIER_WIDTH));
  return TIERS[tier];
}

// Called by app.js after the canvas exists; stores it and its 2d context.
export function initRender(canvasEl) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');
}

function drawCell(r, c) {
  ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
}

function drawGrid() {
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * CELL, 0);
    ctx.lineTo(c * CELL, canvas.height);
    ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * CELL);
    ctx.lineTo(canvas.width, r * CELL);
    ctx.stroke();
  }
}

export function render() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  // Solid blocks
  const grid = getGrid();
  ctx.fillStyle = COLORS.solid;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === SOLID) drawCell(r, c);
    }
  }

  // Falling pieces (edible while falling)
  ctx.fillStyle = COLORS.edible;
  for (const p of game.pieces) {
    for (const cell of pieceCells(p)) drawCell(cell.r, cell.c);
  }

  // Snake
  for (let i = 0; i < game.snake.length; i++) {
    ctx.fillStyle = bodyColor(i);
    drawCell(game.snake[i].r, game.snake[i].c);
  }
}

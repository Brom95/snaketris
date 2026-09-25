// Rendering. The canvas + context are set by app.js (initRender); render()
// reads the shared `game` state and the grid for painting.
import {
  COLS, ROWS, CELL, SOLID, IDLE, GAME_OVER, COLORS,
} from './constants.js';
import { game } from './state.js';
import { getGrid } from './grid.js';
import { pieceCells } from './pieces.js';

let canvas = null;
let ctx = null;

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

function drawText(text, x, y, opts = {}) {
  ctx.fillStyle = opts.color || COLORS.text;
  ctx.font = opts.font || '16px monospace';
  ctx.textAlign = opts.align || 'center';
  ctx.textBaseline = opts.baseline || 'middle';
  ctx.fillText(text, x, y);
}

function drawOverlay(title, sub) {
  ctx.fillStyle = COLORS.overlay;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawText(title, canvas.width / 2, canvas.height / 2 - 14, { font: 'bold 30px monospace' });
  if (sub) {
    drawText(sub, canvas.width / 2, canvas.height / 2 + 18, { font: '16px monospace' });
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
    ctx.fillStyle = i === 0 ? COLORS.snakeHead : COLORS.snake;
    drawCell(game.snake[i].r, game.snake[i].c);
  }

  // Score
  drawText('Score: ' + game.score, 16, 16, { align: 'left', baseline: 'top', font: 'bold 16px monospace' });

  // Overlays
  if (game.state === IDLE) {
    drawOverlay('snaketris', 'Press R or click to start');
  } else if (game.state === GAME_OVER) {
    drawOverlay('Game Over', 'Press R or click to restart');
  }
}

// Rendering. The canvas + context are set by app.js (initRender); render()
// reads the shared `game` state and the grid for painting.
import {
  COLS, ROWS, CELL, SOLID, MENU, RECORDS, HELP, GAME_OVER, COLORS,
  MENU_ITEMS, MENU_ITEM_Y,
  RECORDS_LINE_Y, RECORDS_LINE_SPACING, RECORDS_RETURN_Y,
  HELP_CONTROLS_Y, HELP_RULES_Y, HELP_RETURN_Y,
  GITHUB_ICON_Y,
} from './constants.js';
import { game } from './state.js';
import { getGrid } from './grid.js';
import { pieceCells } from './pieces.js';
import { loadBoard } from './highscores.js';

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

// Fills the overlay tint so multi-line views (menu/records/help) can be
// painted on top of the dimmed board.
function overlayBackground() {
  ctx.fillStyle = COLORS.overlay;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ISO-8601 "2026-09-26T12:34:56.789Z" -> "2026-09-26" (deterministic).
function formatDate(iso) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

// Minimal GitHub octocat icon: head + ears + body + tentacles.
function drawOctocat(x, y) {
  const s = CELL * 0.45; // ~11px radius — fits nicely at GITHUB_ICON_Y
  ctx.fillStyle = COLORS.grid;

  // Head
  ctx.beginPath();
  ctx.arc(x, y - s * 0.15, s, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.beginPath();
  ctx.arc(x - s * 0.65, y - s * 0.7, s * 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + s * 0.65, y - s * 0.7, s * 0.38, 0, Math.PI * 2);
  ctx.fill();

  // Body (smaller circle below head)
  ctx.beginPath();
  ctx.arc(x, y + s * 0.9, s * 0.55, 0, Math.PI * 2);
  ctx.fill();

  // Tentacles (three small arcs at the bottom)
  const tentY = y + s * 1.4;
  ctx.beginPath();
  ctx.arc(x - s * 0.3, tentY, s * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, tentY + s * 0.15, s * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + s * 0.3, tentY, s * 0.18, 0, Math.PI * 2);
  ctx.fill();
}

// Starting menu: title, the three items (highlighted one), and a hint line.
function drawMenu() {
  overlayBackground();

  // Labels to paint, each carrying the exact font used for its measurement.
  const labels = [
    { text: 'snaketris', y: 120, font: 'bold 30px monospace' },
  ];
  for (let i = 0; i < MENU_ITEMS.length; i++) {
    const highlighted = i === game.menuSelect;
    labels.push({
      text: highlighted ? '▶ ' + MENU_ITEMS[i] : MENU_ITEMS[i],
      y: MENU_ITEM_Y[i],
      font: highlighted ? 'bold 24px monospace' : '20px monospace',
      color: highlighted ? COLORS.snakeHead : COLORS.text,
    });
  }
  labels.push({
    text: 'Arrows/W-S move · R to start',
    y: 420,
    font: '13px monospace',
    color: COLORS.text,
  });

  // Shared left edge: center the block on the widest measured label.
  let widest = 0;
  for (const label of labels) {
    ctx.font = label.font;
    widest = Math.max(widest, ctx.measureText(label.text).width);
  }
  const left = canvas.width / 2 - widest / 2;

  for (const label of labels) {
    drawText(label.text, left, label.y, { font: label.font, align: 'left', color: label.color });
  }

  // GitHub octocat icon below the menu block.
  drawOctocat(canvas.width / 2, GITHUB_ICON_Y);
}

// Records view: top-10 leaderboard with dates, or an empty-state message.
function drawRecords() {
  overlayBackground();
  drawText('Records', canvas.width / 2, 120, { font: 'bold 30px monospace' });
  const board = loadBoard();
  if (board.length === 0) {
    drawText('No scores yet — play a game!', canvas.width / 2, 240, { font: '18px monospace', color: COLORS.text });
  } else {
    for (let i = 0; i < board.length; i++) {
      const entry = board[i];
      const label = (i + 1) + '.  ' + entry.score + '  ·  ' + formatDate(entry.date);
      drawText(label, canvas.width / 2, RECORDS_LINE_Y + i * RECORDS_LINE_SPACING, { font: '16px monospace' });
    }
  }
  drawText('Menu', canvas.width / 2, RECORDS_RETURN_Y, { font: '14px monospace' });
}

// Help view: controls, rules, and a return-to-menu label.
function drawHelp() {
  overlayBackground();
  drawText('How to Play', canvas.width / 2, 100, { font: 'bold 30px monospace' });

  drawText('Controls', canvas.width / 2, HELP_CONTROLS_Y, { font: 'bold 18px monospace' });
  drawText('Arrows / WASD — steer', canvas.width / 2, HELP_CONTROLS_Y + 30, { font: '14px monospace' });
  drawText('Swipe or tap — steer', canvas.width / 2, HELP_CONTROLS_Y + 52, { font: '14px monospace' });
  drawText('R or click — start', canvas.width / 2, HELP_CONTROLS_Y + 74, { font: '14px monospace' });

  drawText('Rules', canvas.width / 2, HELP_RULES_Y, { font: 'bold 18px monospace' });
  drawText('Eat falling pieces: +1 each', canvas.width / 2, HELP_RULES_Y + 30, { font: '14px monospace' });
  drawText('Avoid blocks and your body.', canvas.width / 2, HELP_RULES_Y + 52, { font: '14px monospace' });
  drawText('Edges wrap around the board', canvas.width / 2, HELP_RULES_Y + 74, { font: '14px monospace' });

  drawText('Menu', canvas.width / 2, HELP_RETURN_Y, { font: '14px monospace' });
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
  if (game.state === MENU) {
    drawMenu();
  } else if (game.state === RECORDS) {
    drawRecords();
  } else if (game.state === HELP) {
    drawHelp();
  } else if (game.state === GAME_OVER) {
    drawOverlay('Game Over', 'Press R or click for menu');
  }
}

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

// GitHub logo (octocat) drawn from the official SVG path.
// viewBox="0 0 24 24" — scaled and centred at (x, y).
function drawOctocat(x, y) {
  const size = CELL * 1.5; // ~36 px — clearly visible

  ctx.save();
  ctx.translate(x - 12, y - 12); // centre the 24×24 viewBox
  ctx.scale(size / 24, size / 24);

  const path = new Path2D(
    'M10.226 17.284c-2.965-.36-5.054-2.493-5.054-5.256 ' +
    '0-1.123.404-2.336 1.078-3.144-.292-.741-.247-2.314.09-2.965.898-.112 ' +
    '2.111.36 2.83 1.01.853-.269 1.752-.404 2.853-.404 1.1 0 1.999.135 ' +
    '2.807.382.696-.629 1.932-1.1 2.83-.988.315.606.36 2.179.067 2.942.72.854 ' +
    '1.101 2 1.101 3.167 0 2.763-2.089 4.852-5.098 5.234.763.494 1.28 1.572 ' +
    '1.28 2.807v2.336c0 .674.561 1.056 1.235.786 4.066-1.55 7.255-5.615 ' +
    '7.255-10.646C23.5 6.188 18.334 1 11.978 1 5.62 1 .5 6.188.5 12.545c0 ' +
    '4.986 3.167 9.12 7.435 10.669.606.225 1.19-.18 1.19-.786V20.63a2.9 2.9 ' +
    '0 0 1-1.078.224c-1.483 0-2.359-.808-2.987-2.313-.247-.607-.517-.966 ' +
    '-1.034-1.033-.27-.023-.359-.135-.359-.27 0-.27.45-.471.898-.471.652 0 ' +
    '1.213.404 1.797 1.235.45.651.921.943 1.483.943.561 0 .92-.202 ' +
    '1.437-.719.382-.381.674-.718.944-.943'
  );

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fill(path);
  ctx.restore();
}

// Starting menu: title and the three items (highlighted one).
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

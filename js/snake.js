// Snake movement + speed model.
import { COLS, ROWS, SOLID, PLAYING, SNAKE_SPEED_DELTA, MIN_SNAKE_TICKS } from './constants.js';
import { game, gameOver } from './state.js';
import { getCell } from './grid.js';
import { pieceTicksPerCell, findPieceAt } from './pieces.js';

// The snake's step interval, derived from the current piece fall speed:
// exactly SNAKE_SPEED_DELTA ticks/cell shorter than the piece's interval,
// clamped to at least MIN_SNAKE_TICKS. Fractional values are fine — the
// loop's accumulator handles them. The snake always passes a cell in
// strictly fewer ticks than a falling piece.
export function snakeTicksPerCell() {
  return Math.max(MIN_SNAKE_TICKS, pieceTicksPerCell() - SNAKE_SPEED_DELTA);
}

// Consume the edible cell of any falling piece at (r, c): +1 score, and the
// cell is removed from the piece (the piece is dropped once fully consumed).
// Returns true when a cell was eaten.
function eatPieceAt(r, c) {
  const hit = findPieceAt(r, c);
  if (!hit) return false;
  const p = game.pieces[hit.pieceIdx];
  p.shape.splice(hit.shapeIdx, 1);
  game.score += 1;
  if (p.shape.length === 0) {
    const idx = game.pieces.indexOf(p);
    if (idx >= 0) game.pieces.splice(idx, 1);
  }
  return true;
}

export function moveSnake() {
  if (game.state !== PLAYING) return;
  game.dir = { r: game.nextDir.r, c: game.nextDir.c };
  const head = game.snake[0];
  // Discrete step with wrap-around via modulo (applied before any check).
  let nr = head.r + game.dir.r;
  let nc = head.c + game.dir.c;
  nr = ((nr % ROWS) + ROWS) % ROWS;
  nc = ((nc % COLS) + COLS) % COLS;

  // Death: head touches a solid (landed) block.
  if (getCell(nr, nc) === SOLID) {
    gameOver();
    return;
  }

  // Eating: consume the edible cell of any falling piece here, +1 score.
  const willGrow = eatPieceAt(nr, nc);

  // Death: self-collision (tail is vacated only when not growing).
  const bodyToCheck = willGrow ? game.snake : game.snake.slice(0, game.snake.length - 1);
  for (const seg of bodyToCheck) {
    if (seg.r === nr && seg.c === nc) {
      gameOver();
      return;
    }
  }

  // Classic growth: unshift the head; drop the tail only when not growing.
  game.snake.unshift({ r: nr, c: nc });
  if (!willGrow) game.snake.pop();
}

// Eat any falling-piece cell the snake's HEAD now occupies. Runs after the
// pieces step each tick, so a block that falls onto the head is eaten too.
// Only the head eats — the body never consumes a piece. +1 score; the snake
// grows one segment.
export function consumePieceAtHead() {
  const head = game.snake[0];
  if (!eatPieceAt(head.r, head.c)) return 0;
  const tail = game.snake[game.snake.length - 1];
  game.snake.push({ r: tail.r, c: tail.c });
  return 1;
}

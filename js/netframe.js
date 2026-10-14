// The state traffic between the two pages. The host page runs the simulation
// and sends the frame it just produced; the guest page runs no simulation at
// all — it rebuilds its own containers from the frame it received and paints
// them through the ordinary painters. The codec names game fields (snake,
// piece, grid cell), so it lives on the game side and the engine never sees it.
//
// A frame is one compact string, well under the fragment cap the pairing step
// already enforces: the grid is one digit per cell, the snake is a list of
// coordinates, a piece is its type, its rotation state, its position and the
// cells it still occupies (the snake can eat part of a falling piece, so the
// occupied cells travel instead of a rotation index alone).
import { COLS, ROWS, EMPTY, SNAKE, EDIBLE, SOLID } from './constants.js';
import { game } from './state.js';
import { getCell, setCell } from './grid.js';

const CELL_CODE = { [EMPTY]: '0', [SNAKE]: '1', [EDIBLE]: '2', [SOLID]: '3' };
const CELL_ID = ['0', '1', '2', '3'];
const CELL_BY_CODE = [EMPTY, SNAKE, EDIBLE, SOLID];

// The frame the host page hands to its peer: everything the guest needs to
// paint the same board, and nothing the guest would have to simulate.
export function encodeFrame() {
  const play = game.play;
  let cells = '';
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) cells += CELL_CODE[getCell(r, c)];
  }
  return JSON.stringify([
    play.tick,
    play.overflow,
    play.landedBlocks,
    play.snake.map((s) => [s.r, s.c]),
    play.pieces.map((p) => [p.type, p.state, p.col, p.row, p.shape]),
    [play.dir.r, play.dir.c],
    [play.nextDir.r, play.nextDir.c],
    play.snakeScore,
    play.tetrisScore,
    play.durationMinutes,
    play.durationTicks,
    play.gameOverReason,
    play.role,
    cells,
  ]);
}

// The guest writes a received frame into its own containers. It assigns rather
// than mutates, so a frame the guest never received leaves the page untouched.
export function applyFrame(payload) {
  let frame;
  try {
    frame = JSON.parse(payload);
  } catch (e) {
    return false;
  }
  if (!Array.isArray(frame) || frame.length !== 14) return false;
  const [tick, overflow, landedBlocks, snake, pieces, dir, nextDir, snakeScore,
    tetrisScore, durationMinutes, durationTicks, gameOverReason, role, cells] = frame;
  const play = game.play;
  play.tick = tick;
  play.overflow = overflow;
  play.landedBlocks = landedBlocks;
  play.snakeScore = snakeScore;
  play.tetrisScore = tetrisScore;
  play.durationMinutes = durationMinutes;
  play.durationTicks = durationTicks;
  play.gameOverReason = gameOverReason;
  play.role = role;
  play.dir = { r: dir[0], c: dir[1] };
  play.nextDir = { r: nextDir[0], c: nextDir[1] };
  play.snake = snake.map(([r, c]) => ({ r, c }));
  play.pieces = pieces.map(([type, state, col, row, shape]) => ({
    type,
    state,
    col,
    row,
    shape: shape.map(([dr, dc]) => [dr, dc]),
  }));
  for (let i = 0; i < cells.length && i < COLS * ROWS; i++) {
    setCell((i / COLS) | 0, i % COLS, CELL_BY_CODE[CELL_ID.indexOf(cells[i])]);
  }
  return true;
}

// The intent traffic: a control action the guest page produced travels to the
// host, which applies it on the tick the guest names.
export function encodeIntent(intent, tick) {
  return JSON.stringify([tick, intent]);
}

export function decodeIntent(payload) {
  let decoded;
  try {
    decoded = JSON.parse(payload);
  } catch (e) {
    return null;
  }
  if (!Array.isArray(decoded) || decoded.length !== 2) return null;
  return { tick: decoded[0], intent: decoded[1] };
}

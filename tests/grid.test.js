import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub } from './helpers/dom-stub.js';

const stub = installDomStub();
const { COLS, ROWS, SOLID } = await import(new URL('../js/constants.js', import.meta.url));
const { game, resetGame, startGame } = await import(new URL('../js/state.js', import.meta.url));
const { moveSnake } = await import(new URL('../js/snake.js', import.meta.url));
const { setCell, getCell } = await import(new URL('../js/grid.js', import.meta.url));

function freshStart() { resetGame(); startGame(); }

test('wrap-around: right edge wraps to col 0', () => {
  freshStart();
  const s = game.snake;
  s[0] = { r: Math.floor(ROWS / 2), c: COLS - 1 };
  s[1] = { r: Math.floor(ROWS / 2), c: COLS - 2 };
  s[2] = { r: Math.floor(ROWS / 2), c: COLS - 3 };
  s[3] = { r: Math.floor(ROWS / 2), c: COLS - 4 };
  moveSnake();
  assert.equal(game.snake[0].r, Math.floor(ROWS / 2));
  assert.equal(game.snake[0].c, 0);
});

test('wrap-around: top edge wraps to row ROWS-1', () => {
  freshStart();
  const s = game.snake;
  s[0] = { r: 0, c: 5 }; s[1] = { r: 1, c: 5 };
  s[2] = { r: 2, c: 5 }; s[3] = { r: 3, c: 5 };
  game.nextDir = { r: -1, c: 0 };
  moveSnake();
  assert.equal(game.snake[0].r, ROWS - 1);
  assert.equal(game.snake[0].c, 5);
});

test('death: solid contact -> GAME_OVER', () => {
  freshStart();
  setCell(Math.floor(ROWS / 2), 7, SOLID); // SOLID ahead of head (mid,6)
  moveSnake();
  assert.equal(game.state, 'GAME_OVER');
});

test('death: self-collision -> GAME_OVER', () => {
  freshStart();
  const s = game.snake;
  s[0] = { r: 5, c: 5 }; s[1] = { r: 6, c: 5 };
  s[2] = { r: 6, c: 6 }; s[3] = { r: 6, c: 7 };
  game.nextDir = { r: 1, c: 0 }; // into non-tail body cell
  moveSnake();
  assert.equal(game.state, 'GAME_OVER');
});

test('death: vacated tail is safe', () => {
  freshStart();
  const s = game.snake;
  s[0] = { r: 5, c: 5 }; s[1] = { r: 6, c: 6 };
  s[2] = { r: 6, c: 5 }; s[3] = { r: 5, c: 6 };
  game.nextDir = { r: 0, c: 1 }; // into vacated tail cell
  moveSnake();
  assert.equal(game.state, 'PLAYING');
});

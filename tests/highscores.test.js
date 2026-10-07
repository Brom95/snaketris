// highscores.test.js — the shared records board: role stored on each entry,
// legacy entries without a role read as the snake side.
import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub } from './helpers/dom-stub.js';

installDomStub();
const { game, resetGame, startGame, gameOver } = await import('../js/state.js');
const { loadBoard, recordScore, entryRole } = await import('../js/highscores.js');

function clearBoard() {
  localStorage.removeItem('snaketris.highscores');
}

test('recordScore stores the role of the side that was played', () => {
  clearBoard();
  resetGame();
  game.role = 'tetris';
  startGame();
  game.tetrisScore = 25;
  game.snakeScore = 3;
  gameOver();
  const board = loadBoard();
  assert.equal(board.length, 1);
  assert.equal(board[0].role, 'tetris');
  assert.equal(board[0].score, 25);
});

test('a Snake-role game stores role snake and the snake score', () => {
  clearBoard();
  resetGame();
  game.role = 'snake';
  startGame();
  game.snakeScore = 9;
  game.tetrisScore = 2;
  gameOver();
  const board = loadBoard();
  assert.equal(board[0].role, 'snake');
  assert.equal(board[0].score, 9);
});

test('entryRole reads a legacy entry without a role as snake', () => {
  assert.equal(entryRole({ score: 5, date: '2024-01-01T00:00:00.000Z' }), 'snake');
  assert.equal(entryRole({ score: 5, date: '2024-01-01T00:00:00.000Z', role: 'tetris' }), 'tetris');
  assert.equal(entryRole(null), 'snake');
  assert.equal(entryRole({ score: 1, role: 'snake' }), 'snake');
});

test('a legacy entry seeded in storage survives a new recording', () => {
  clearBoard();
  localStorage.setItem(
    'snaketris.highscores',
    JSON.stringify([{ score: 40, date: '2024-01-01T00:00:00.000Z' }])
  );
  recordScore(12, 'tetris');
  const board = loadBoard();
  assert.equal(board.length, 2);
  assert.equal(board[0].score, 40);
  // The stored entry keeps no role field; the reader supplies the default.
  assert.equal(board[0].role, undefined);
  assert.equal(entryRole(board[0]), 'snake');
  assert.equal(board[1].role, 'tetris');
});

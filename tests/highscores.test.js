// highscores.test.js — one records board per match duration: the role of the
// side that was played is stored on each entry, legacy entries without a role
// read as the snake side, and the pre-split storage key stays unread.
import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub } from './helpers/dom-stub.js';

installDomStub();
const { game, resetGame, startGame, gameOver } = await import('../js/state.js');
const { loadBoard, recordScore, entryRole, recordsSystem, boardKey } = await import('../js/highscores.js');
const { DURATION_MINUTES } = await import('../js/constants.js');

function clearBoard() {
  for (const minutes of DURATION_MINUTES) localStorage.removeItem(boardKey(minutes));
  localStorage.removeItem('snaketris.highscores');
}

test('the records layer stores the role of the side that was played', () => {
  clearBoard();
  resetGame();
  game.play.role = 'tetris';
  startGame();
  game.play.tetrisScore = 25;
  game.play.snakeScore = 3;
  gameOver();
  recordsSystem.update({});
  const board = loadBoard(1);
  assert.equal(board.length, 1);
  assert.equal(board[0].role, 'tetris');
  assert.equal(board[0].score, 25);
});

test('a Snake-role game stores role snake and the snake score', () => {
  clearBoard();
  resetGame();
  game.play.role = 'snake';
  startGame();
  game.play.snakeScore = 9;
  game.play.tetrisScore = 2;
  gameOver();
  recordsSystem.update({});
  const board = loadBoard(1);
  assert.equal(board[0].role, 'snake');
  assert.equal(board[0].score, 9);
});

test('entryRole reads a legacy entry without a role as snake', () => {
  assert.equal(entryRole({ score: 5, date: '2024-01-01T00:00:00.000Z' }), 'snake');
  assert.equal(entryRole({ score: 5, date: '2024-01-01T00:00:00.000Z', role: 'tetris' }), 'tetris');
  assert.equal(entryRole(null), 'snake');
  assert.equal(entryRole({ score: 1, role: 'snake' }), 'snake');
});

// ---------- One board per duration ---------------------------------------
test('a 3-minute score lands in the 3-minute board and leaves the other two unchanged', () => {
  clearBoard();
  resetGame();
  game.play.role = 'tetris';
  game.play.durationMinutes = 3;
  startGame();
  game.play.tetrisScore = 25;
  game.play.snakeScore = 3;
  gameOver();
  recordsSystem.update({});
  const board = loadBoard(3);
  assert.equal(board.length, 1);
  assert.equal(board[0].score, 25);
  assert.equal(board[0].role, 'tetris');
  assert.deepEqual(loadBoard(1), []);
  assert.deepEqual(loadBoard(5), []);
});

test('each duration keeps its own top ten', () => {
  clearBoard();
  for (const minutes of DURATION_MINUTES) {
    localStorage.setItem(
      boardKey(minutes),
      JSON.stringify(Array.from({ length: 10 }, (_, i) => ({ score: 10 - i, date: '2024-01-01T00:00:00.000Z', role: 'snake' })))
    );
  }
  resetGame();
  game.play.role = 'snake';
  game.play.durationMinutes = 5;
  startGame();
  game.play.snakeScore = 50;
  gameOver();
  recordsSystem.update({});
  const five = loadBoard(5);
  assert.equal(five.length, 10);
  assert.equal(five[0].score, 50);
  assert.equal(five[0].role, 'snake');
  // The other boards never saw the 5-minute match.
  assert.equal(loadBoard(1)[0].score, 10);
  assert.equal(loadBoard(3)[0].score, 10);
});

test('every board reads empty when only the pre-split key exists', () => {
  clearBoard();
  localStorage.setItem(
    'snaketris.highscores',
    JSON.stringify([{ score: 40, date: '2024-01-01T00:00:00.000Z' }])
  );
  for (const minutes of DURATION_MINUTES) assert.deepEqual(loadBoard(minutes), []);
  recordScore(12, 'tetris', 1);
  const board = loadBoard(1);
  assert.equal(board.length, 1);
  assert.equal(board[0].score, 12);
  assert.equal(board[0].role, 'tetris');
  assert.deepEqual(loadBoard(3), []);
  assert.deepEqual(loadBoard(5), []);
});

test('a legacy entry without a role survives inside one duration board', () => {
  clearBoard();
  localStorage.setItem(
    boardKey(3),
    JSON.stringify([{ score: 40, date: '2024-01-01T00:00:00.000Z' }])
  );
  recordScore(12, 'tetris', 3);
  const board = loadBoard(3);
  assert.equal(board.length, 2);
  assert.equal(board[0].score, 40);
  // The stored entry keeps no role field; the reader supplies the default.
  assert.equal(board[0].role, undefined);
  assert.equal(entryRole(board[0]), 'snake');
  assert.equal(board[1].role, 'tetris');
});

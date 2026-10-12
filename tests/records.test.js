// records.test.js — the records layer sits outside the gameplay core. The core
// reports a finished game and writes no board; the records owner persists that
// report once and clears it; a failing storage write leaves navigation and
// gameplay intact; the three gameplay systems run with no page and no storage.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { installDomStub } from './helpers/dom-stub.js';

installDomStub();
const state = await import('../js/state.js');
const records = await import('../js/highscores.js');
const { game } = state;
const { loadBoard } = records;

function clearBoard() {
  localStorage.removeItem('snaketris.highscores');
}

test('the core reports the result and writes no board', () => {
  clearBoard();
  state.resetGame();
  game.play.role = 'tetris';
  state.startGame();
  game.play.snakeScore = 3;
  game.play.tetrisScore = 25;
  state.gameOver();
  assert.deepEqual(game.play.result, [{ score: 25, role: 'tetris' }]);
  assert.deepEqual(loadBoard(), []);
});

test('a Snake-role game reports the snake side only', () => {
  clearBoard();
  state.resetGame();
  game.play.role = 'snake';
  state.startGame();
  game.play.snakeScore = 9;
  game.play.tetrisScore = 2;
  state.gameOver();
  assert.deepEqual(game.play.result, [{ score: 9, role: 'snake' }]);
  assert.deepEqual(loadBoard(), []);
});

test('a two-player duel reports both sides', () => {
  clearBoard();
  state.resetGame();
  state.gameOver();
  game.screen.twoPlayerMode = true;
  game.play.snakeScore = 5;
  game.play.tetrisScore = 20;
  state.gameOver();
  assert.deepEqual(game.play.result, [
    { score: 5, role: 'snake' },
    { score: 20, role: 'tetris' },
  ]);
  assert.deepEqual(loadBoard(), []);
});

test('the records owner writes one board entry per finished game', () => {
  clearBoard();
  state.resetGame();
  game.play.role = 'tetris';
  state.startGame();
  game.play.tetrisScore = 25;
  game.play.snakeScore = 3;
  state.gameOver();
  records.recordsSystem.update({});
  const board = loadBoard();
  assert.equal(board.length, 1);
  assert.equal(board[0].score, 25);
  assert.equal(board[0].role, 'tetris');
  assert.equal(game.play.result, null);
  // The report is cleared, so a later tick writes nothing again.
  records.recordsSystem.update({});
  assert.equal(loadBoard().length, 1);
});

test('a two-player report writes two entries and keeps the top ten', () => {
  clearBoard();
  localStorage.setItem(
    'snaketris.highscores',
    JSON.stringify(Array.from({ length: 10 }, (_, i) => ({ score: i + 1, date: '2024-01-01T00:00:00.000Z', role: 'snake' })))
  );
  state.resetGame();
  state.gameOver();
  game.screen.twoPlayerMode = true;
  game.play.snakeScore = 50;
  game.play.tetrisScore = 60;
  state.gameOver();
  records.recordsSystem.update({});
  const board = loadBoard();
  assert.equal(board.length, 10);
  assert.equal(board[0].score, 60);
  assert.equal(board[0].role, 'tetris');
  assert.equal(board[1].score, 50);
  assert.equal(board[1].role, 'snake');
});

test('a failed storage write leaves navigation and gameplay unchanged', () => {
  clearBoard();
  const workingWrite = localStorage.setItem;
  localStorage.setItem = () => {
    throw new Error('storage quota exceeded');
  };
  state.resetGame();
  game.play.role = 'snake';
  state.startGame();
  game.play.snakeScore = 9;
  const snakeBefore = JSON.parse(JSON.stringify(game.play.snake));
  state.gameOver();
  records.recordsSystem.update({});
  localStorage.setItem = workingWrite;
  // Navigation advanced to the game-over screen and the report was consumed.
  assert.equal(game.screen.state, 'GAME_OVER');
  assert.equal(game.play.result, null);
  const screenAfter = JSON.parse(JSON.stringify(game.screen));
  // Gameplay state is untouched by the failed write.
  assert.deepEqual(game.play.snake, snakeBefore);
  assert.equal(game.play.snakeScore, 9);
  // A later tick does not retry the same report.
  records.recordsSystem.update({});
  assert.deepEqual(loadBoard(), []);
  assert.deepEqual(game.screen, screenAfter);
});

test('no gameplay module imports the records layer', () => {
  for (const name of ['state.js', 'snake.js', 'pieces.js', 'bot.js', 'grid.js']) {
    const src = fs.readFileSync(new URL(`../js/${name}`, import.meta.url), 'utf8');
    assert.equal(src.includes('highscores.js'), false);
  }
});

test('the three gameplay systems finish a tick with no page and no storage', async () => {
  const bot = await import('../js/bot.js');
  const snake = await import('../js/snake.js');
  const pieces = await import('../js/pieces.js');
  const page = {
    document: globalThis.document,
    window: globalThis.window,
    localStorage: globalThis.localStorage,
  };
  delete globalThis.document;
  delete globalThis.window;
  delete globalThis.localStorage;
  try {
    state.resetGame();
    game.play.role = 'tetris';
    state.startGame();
    const ctx = { game };
    for (let t = 0; t < 5; t++) {
      game.play.tick++;
      bot.botSystem.update(ctx);
      snake.snakeSystem.update(ctx);
      pieces.piecesSystem.update(ctx);
    }
    assert.equal(game.play.tick, 5);
    assert.equal(game.screen.state, 'PLAYING');
  } finally {
    globalThis.document = page.document;
    globalThis.window = page.window;
    globalThis.localStorage = page.localStorage;
  }
});

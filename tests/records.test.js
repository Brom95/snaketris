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
const { loadBoard, boardKey } = records;
const { DURATION_MINUTES, RECORDS } = await import('../js/constants.js');

function clearBoard() {
  for (const minutes of DURATION_MINUTES) localStorage.removeItem(boardKey(minutes));
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
  assert.deepEqual(loadBoard(1), []);
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
  assert.deepEqual(loadBoard(1), []);
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
  assert.deepEqual(loadBoard(1), []);
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
  const board = loadBoard(1);
  assert.equal(board.length, 1);
  assert.equal(board[0].score, 25);
  assert.equal(board[0].role, 'tetris');
  assert.equal(game.play.result, null);
  // The report is cleared, so a later tick writes nothing again.
  records.recordsSystem.update({});
  assert.equal(loadBoard(1).length, 1);
});

test('a two-player report writes both entries into the match duration board', () => {
  clearBoard();
  localStorage.setItem(
    boardKey(5),
    JSON.stringify(Array.from({ length: 10 }, (_, i) => ({ score: i + 1, date: '2024-01-01T00:00:00.000Z', role: 'snake' })))
  );
  state.resetGame();
  game.play.durationMinutes = 5;
  state.gameOver();
  game.screen.twoPlayerMode = true;
  game.play.snakeScore = 50;
  game.play.tetrisScore = 60;
  state.gameOver();
  records.recordsSystem.update({});
  const board = loadBoard(5);
  assert.equal(board.length, 10);
  assert.equal(board[0].score, 60);
  assert.equal(board[0].role, 'tetris');
  assert.equal(board[1].score, 50);
  assert.equal(board[1].role, 'snake');
  // The other boards never saw this match.
  assert.deepEqual(loadBoard(1), []);
  assert.deepEqual(loadBoard(3), []);
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
  assert.deepEqual(loadBoard(1), []);
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

test('the records list paints only the board the selector points at', async () => {
  const ui = await import('../js/ui.js');
  const screens = await import('../js/screens.js');
  clearBoard();
  localStorage.setItem(
    boardKey(1),
    JSON.stringify([{ score: 11, date: '2024-01-01T00:00:00.000Z', role: 'snake' }]),
  );
  localStorage.setItem(
    boardKey(3),
    JSON.stringify([
      { score: 33, date: '2024-01-02T00:00:00.000Z', role: 'tetris' },
      { score: 22, date: '2024-01-03T00:00:00.000Z', role: 'snake' },
    ]),
  );
  ui.initUi();
  const listEl = globalThis.document.getElementById('records-list');
  const emptyEl = globalThis.document.getElementById('records-empty');
  const lit = (id) => globalThis.document.getElementById(id).classList.has('on');

  game.screen.state = RECORDS;
  game.screen.recordsSelect = 1;
  ui.syncViews(loadBoard(screens.selectedBoardMinutes()));
  const rows = listEl.children.map((li) => li.textContent);
  assert.equal(rows.length, 2);
  assert.ok(rows[0].includes('33'));
  assert.ok(rows[1].includes('22'));
  assert.equal(emptyEl.classList.has('on'), false);
  assert.equal(lit('records-board-3'), true);
  assert.equal(lit('records-board-1'), false);
  assert.equal(lit('records-board-5'), false);

  // The 5-minute board was never written, so the same view shows its own empty
  // state rather than the 3-minute rows.
  game.screen.recordsSelect = 2;
  ui.syncViews(loadBoard(screens.selectedBoardMinutes()));
  assert.equal(listEl.children.length, 0);
  assert.equal(emptyEl.classList.has('on'), true);
  assert.equal(lit('records-board-5'), true);
});

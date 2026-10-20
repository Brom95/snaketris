import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub } from './helpers/dom-stub.js';

const stub = installDomStub();
const state = await import('../js/state.js');
const render = await import('../js/render.js');
const C = await import('../js/constants.js');
const grid = await import('../js/grid.js');
const network = await import('../js/netframe.js');

const CELL = C.CELL;
const HEAD = C.COLORS.snakeHead;
const BODY = C.COLORS.snakeBody;
const EDIBLE = C.COLORS.edible;

// A canvas that remembers every cell it is asked to fill, tagged with the colour
// that was current, so a test can read one painter's cells apart from the field
// it painted behind them. Lines and the frame are kept apart.
const rec = { rects: [], strokes: [], lines: [] };
const ctxRec = {
  fillStyle: null,
  strokeStyle: null,
  lineWidth: null,
  fillRect: (x, y, w, h) => {
    rec.rects.push([ctxRec.fillStyle, x, y, w, h]);
  },
  beginPath: () => {},
  moveTo: (x, y) => {
    rec.lines.push([x, y]);
  },
  lineTo: (x, y) => {
    rec.lines.push([x, y]);
  },
  stroke: () => {
    rec.strokes.push([ctxRec.strokeStyle, ctxRec.lineWidth, rec.lines.length]);
  },
  strokeRect: (x, y, w, h) => {
    rec.rects.push([ctxRec.strokeStyle, x, y, w, h]);
  },
  fillText: () => {},
};
const canvas = stub.canvas;
canvas.width = C.COLS * CELL;
canvas.height = C.ROWS * CELL;
canvas.getContext = () => ctxRec;

// The cells one painter filled, in the order it filled them.
function painted(style) {
  return rec.rects.filter(([s]) => s === style).map(([, x, y]) => ({ x, y }));
}

// One painted frame: the record is cleared first, so a test reads the last
// frame the page painted and nothing older.
function paint() {
  rec.rects.length = 0;
  rec.lines.length = 0;
  rec.strokes.length = 0;
  render.render();
}

// The paint stage: the movers the rules hold, the tick this page is at, an empty
// field, and the frame the engine paints.
let staged = null;
function stage(snake, pieces, tick) {
  staged = {
    snake: snake.map(([r, c]) => ({ r, c })),
    pieces,
  };
  state.game.play.snake = staged.snake;
  state.game.play.pieces = staged.pieces;
  state.game.play.overflow = 0;
  state.game.play.tick = tick;
  grid.initGrid();
  render.initRender(canvas);
  paint();
}

test('a frame that observed no move draws the cells the rules hold', () => {
  stage([[5, 4], [5, 3], [5, 2]], [], 100);

  const head = painted(HEAD);
  const body = painted(BODY);
  assert.equal(head.length, 1, 'one cell for the head, no edge copies');
  assert.equal(body.length, 2, 'one cell for each body segment');
  assert.deepEqual(head[0], { x: 4 * CELL + 1, y: 5 * CELL + 1 }, 'the head sits at its cell');
  assert.deepEqual(body[0], { x: 3 * CELL + 1, y: 5 * CELL + 1 }, 'the segment behind sits at its cell');
  assert.deepEqual(body[1], { x: 2 * CELL + 1, y: 5 * CELL + 1 }, 'and so the next');

  const rec = render.motion.snakeRec;
  assert.ok(rec, 'the page holds one record for the snake, the one mover it is');
  assert.deepEqual(rec.from, rec.to, 'a frame that observed no move invents no travel');
});

test('a mover the rules no longer hold stops travelling and lends nothing to another', () => {
  const dropped = { type: 'O', state: 0, col: 3, row: 4, shape: [[0, 0], [0, 1], [1, 0], [1, 1]] };
  const other = { type: 'T', state: 0, col: 8, row: 6, shape: [[0, 0], [0, 1], [0, 2], [1, 1]] };
  stage([[5, 4]], [dropped, other], 150);

  // Both slid one column, and the rules dropped the first one.
  dropped.col = 4;
  other.col = 9;
  state.game.play.tick = 157;
  paint();
  const mid = painted(EDIBLE);
  assert.equal(mid.length, 7, 'both slide while the rules still hold both, and the cell past the field edge is cut');

  // The rules dropped one of them: it landed.
  state.game.play.pieces = [other];
  state.game.play.tick = 158;
  paint();
  const left = painted(EDIBLE);
  assert.equal(left.length, 3, 'the dropped shape paints nothing and the other paints the cells inside the field');
  const cols = left.map((cell) => (cell.x - 1) / CELL);
  assert.ok(cols.every((c) => c >= 8 && c < 10), 'the other piece slides only over the columns it crossed, never the ones the dropped piece left');
});

test('a game that restarted starts the records clean', () => {
  const oldSnake = [{ r: 9, c: 0 }];
  state.game.play.snake = oldSnake;
  state.game.play.pieces = [];
  state.game.play.tick = 200;
  grid.initGrid();
  render.initRender(canvas);
  paint();
  assert.ok(render.motion.snakeRec, 'this run recorded the snake it holds');

  // A new game: the tick went backwards and the movers are new objects.
  stage([[1, 1]], [], 3);
  const rec = render.motion.snakeRec;
  assert.ok(rec, 'the new run holds a record of its own');
  assert.deepEqual(rec.from, rec.to, 'the previous run is gone: nothing travels into the new game');
  assert.equal(rec.movedTick, 3, 'started at the tick the new game reached');
  assert.equal(render.motion.pieceRecs.length, 0, 'and no piece from the previous run is remembered');
});

test('a still mover keeps its record without inventing travel', () => {
  stage([[4, 7]], [], 300);
  for (let frame = 1; frame < 5; frame += 1) {
    state.game.play.tick = 300 + frame;
    paint();
  }
  const head = painted(HEAD);
  assert.equal(head.length, 1, 'one cell painted on the last frame');
  assert.deepEqual(head[0], { x: 7 * CELL + 1, y: 4 * CELL + 1 }, 'still at the cell it occupies');
});

test('travel steps in whole pixels, so the cell keeps its crisp edges', () => {
  for (const [from, to] of [[2, 3], [7, 6], [0, 9], [-1, 0]]) {
    for (let phase = 0; phase <= 1.25; phase += 0.125) {
      const c = render.motion.step(from, to, phase);
      assert.equal(Number.isInteger(c * CELL), true, 'the pixel product stays an integer');
      assert.equal(c >= Math.min(from, to), true, 'never short of the cell it left');
      assert.equal(c <= Math.max(from, to), true, 'never past the cell it reached');
    }
  }
});

test('an adjacent hop draws one cell between the cells it crossed', () => {
  const travel = render.motion.travelCells({ r: 5, c: 3 }, { r: 5, c: 4 }, 0.5);
  assert.equal(travel.length, 1, 'one cell, not two');
  const [cell] = travel;
  assert.equal(cell.c * CELL, 3.5 * CELL, 'the midpoint between the columns');
  assert.equal(cell.r, 5, 'the row it never left');
});

test('a hop this page cannot see the middle of seats at the cell it reached', () => {
  const [cell] = render.motion.travelCells({ r: 2, c: 2 }, { r: 5, c: 2 }, 0.5);
  assert.deepEqual(cell, { r: 5, c: 2 }, 'no lerp across cells the mover never crossed');
});

test('a still hop draws the cell it holds', () => {
  const [cell] = render.motion.travelCells({ r: 6, c: 6 }, { r: 6, c: 6 }, 0.375);
  assert.deepEqual(cell, { r: 6, c: 6 }, 'nothing to travel');
});

test('the shown grid stays coarse while travel crosses it', () => {
  stage([[5, 5]], [], 400);

  const inner = C.COLS - 1 + (C.ROWS - 1);
  assert.equal(rec.lines.length, inner * 2, 'each inner line moves and draws');
  for (const [x, y] of rec.lines) {
    assert.equal(x % CELL, 0, 'every line coordinate is a whole cell');
    assert.equal(y % CELL, 0, 'every line coordinate is a whole cell');
  }
  const head = painted(HEAD);
  assert.equal(head.length, 1, 'one cell painted for the snake while the grid stays coarse');
});

// A tetromino square, the smallest shape whose every cell can be checked against
// the row the rules read for it.
const SQUARE = [[0, 0], [0, 1], [1, 0], [1, 1]];

function piece(row, col, shape) {
  return { type: 'O', state: 0, col, row, shape };
}

// The piece cells this page painted, back in grid coordinates.
function drawnPieces() {
  return painted(EDIBLE).map((cell) => ({ r: (cell.y - 1) / CELL, c: (cell.x - 1) / CELL }));
}

test('a falling piece is drawn between the row it left and the row it occupies', () => {
  let lowestSoFar = null;
  for (const phase of [0, 0.5, 0.96]) {
    stage([], [piece(8 + phase, 4, SQUARE)], 500);
    const cells = drawnPieces();
    assert.equal(cells.length, 4, 'the shape is painted whole, no cell lost to travel');
    for (const cell of cells) {
      assert.equal(Number.isInteger(cell.c), true, 'a piece that only falls stays in its columns');
    }
    const rows = cells.map((cell) => cell.r);
    assert.equal(Math.min(...rows) >= 8 - 1, true, 'never lags more than the row it left');
    assert.equal(Math.max(...rows) <= 8 + 1, true, 'never sinks into the row below the one it occupies');
    if (lowestSoFar !== null) {
      assert.equal(Math.max(...rows) > lowestSoFar, true, 'a later fraction draws lower on the board');
    }
    lowestSoFar = Math.max(...rows);
  }
  assert.equal(lowestSoFar <= 8 + 1, true, 'the last fraction still reads level with its row');
});

test('a piece entering from above is clipped to the field', () => {
  stage([], [piece(-5, 4, SQUARE)], 600);
  assert.equal(painted(EDIBLE).length, 0, 'a piece fully above the field paints nothing');

  stage([], [piece(-0.5, 4, SQUARE)], 601);
  const cells = drawnPieces();
  assert.equal(cells.length, 2, 'the pair straddling the top edge paints its visible part');
  for (const cell of cells) {
    assert.equal(cell.r > -1 && cell.r <= 0, true, 'straddling the edge, not sunk below it');
  }
});

test('the landing frame reads level with the row the piece occupies', () => {
  grid.initGrid();
  for (let c = 0; c < C.COLS; c += 1) {
    grid.setCell(18, c, C.SOLID);
  }
  // One row above the stack, three quarters through the interval it crosses.
  stage([], [piece(16.75, 4, SQUARE)], 700);
  const cells = drawnPieces();
  assert.equal(cells.length, 4, 'the shape is painted whole');
  const rows = cells.map((cell) => cell.r);
  assert.equal(Math.max(...rows) <= 17, true, 'the lowest cell never dips past its own row band');
  assert.equal(Math.max(...rows) >= 16.5, true, 'it reads level with the row it occupies, not a row above');
});

// The snake moves by mutating one array in place, exactly as the rules do, so
// the page sees the same mover over the whole interval.
function step(snake, head) {
  snake.unshift({ r: head.r, c: head.c });
  snake.pop();
}

test('the snake crawls one cell per interval instead of jumping it', () => {
  stage([[10, 3], [11, 3], [12, 3]], [], 100);
  const snake = staged.snake;

  // A step up the column, then the frame the step is observed on.
  step(snake, { r: 9, c: 3 });
  state.game.play.tick = 124;
  paint();
  assert.deepEqual(painted(HEAD), [{ x: 3 * CELL + 1, y: 10 * CELL + 1 }], 'the head sits at the cell it left');
  assert.deepEqual(painted(BODY), [{ x: 3 * CELL + 1, y: 11 * CELL + 1 }, { x: 3 * CELL + 1, y: 12 * CELL + 1 }], 'the body sits where it was');

  // Halfway through the interval every cell is halfway along its own cell.
  state.game.play.tick = 136;
  paint();
  const headCell = painted(HEAD)[0];
  const bodyCells = painted(BODY);
  assert.deepEqual(headCell, { x: 3 * CELL + 1, y: 229 }, 'the head is at the midpoint of the step');
  assert.deepEqual(bodyCells, [{ x: 3 * CELL + 1, y: 253 }, { x: 3 * CELL + 1, y: 277 }], 'and each body cell crawls with it');
  assert.equal(bodyCells[0].y - headCell.y, CELL, 'the head and the segment behind stay one cell apart');
  assert.equal(bodyCells[1].y - bodyCells[0].y, CELL, 'and so the segments stay spaced, no two squares overlap');

  // The frame at the crossing draws the new cells.
  state.game.play.tick = 148;
  paint();
  assert.deepEqual(painted(HEAD), [{ x: 3 * CELL + 1, y: 9 * CELL + 1 }], 'the head lands at the cell it reached');
  assert.deepEqual(painted(BODY), [{ x: 3 * CELL + 1, y: 10 * CELL + 1 }, { x: 3 * CELL + 1, y: 11 * CELL + 1 }], 'and the cells behind land too');

  // The next step observed on the same frame seats the art where it already was.
  step(snake, { r: 8, c: 3 });
  paint();
  assert.deepEqual(painted(HEAD), [{ x: 3 * CELL + 1, y: 9 * CELL + 1 }], 'no jump at the crossing');
  assert.deepEqual(painted(BODY), [{ x: 3 * CELL + 1, y: 10 * CELL + 1 }, { x: 3 * CELL + 1, y: 11 * CELL + 1 }], 'no jump at the crossing');
});

test('a snake that grew seats its new tail at the cell it holds', () => {
  stage([[10, 3], [11, 3]], [], 200);
  const snake = staged.snake;

  // Growth: the head advances and nothing is dropped from the tail.
  snake.unshift({ r: 9, c: 3 });
  state.game.play.tick = 224;
  paint();
  state.game.play.tick = 236;
  paint();
  const cells = painted(HEAD).concat(painted(BODY));
  assert.equal(cells.length, 3, 'one square for each segment, none invented beyond the tail');
  const rows = cells.map((cell) => (cell.y - 1) / CELL);
  assert.equal(Math.min(...rows) >= 9, true, 'no square is drawn past the head cell it travels to');
  assert.equal(Math.max(...rows) <= 11, true, 'and the new tail stays at the cell it holds');
});

test('a dying snake freezes rather than bouncing', () => {
  stage([[0, 0], [1, 0]], [], 300);
  const snake = staged.snake;
  state.game.play.gameOverReason = 'snake-death';
  state.game.play.tick = 324;
  paint();
  // The rules stop moving the snake: no step is observed any more.
  for (let tick = 325; tick < 345; tick += 1) {
    state.game.play.tick = tick;
    paint();
  }
  assert.deepEqual(painted(HEAD), [{ x: 0 * CELL + 1, y: 0 * CELL + 1 }], 'the head is seated at the cell it holds');
  assert.deepEqual(painted(BODY), [{ x: 0 * CELL + 1, y: 1 * CELL + 1 }], 'and stays there, without bouncing back');
});

test('a hop around the board is drawn leaving and entering, never through the middle', () => {
  stage([[5, 9], [5, 8]], [], 400);
  const snake = staged.snake;
  step(snake, { r: 5, c: 0 });
  state.game.play.tick = 424;
  paint();
  state.game.play.tick = 436;
  paint();
  const cells = painted(HEAD);
  assert.equal(cells.length, 2, 'the hop paints a leaving square and an entering one');
  for (const cell of cells) {
    assert.ok(cell.x >= 9 * CELL || cell.x <= 0, 'it leaves through the right edge and enters from the left, the pair a rightward wrap passes');
  }
});

test('a hop over the bottom edge is drawn at both edges', () => {
  stage([[19, 4], [18, 4]], [], 500);
  const snake = staged.snake;
  step(snake, { r: 0, c: 4 });
  state.game.play.tick = 524;
  paint();
  state.game.play.tick = 536;
  paint();
  const cells = painted(HEAD);
  assert.equal(cells.length, 2, 'the hop paints a leaving square and an entering one');
  for (const cell of cells) {
    assert.ok(cell.y >= 19 * CELL || cell.y <= 0, 'it leaves through the bottom edge and enters from the top, the pair a downward wrap passes');
  }
});

test('a requested shift slides the piece over a fixed duration', () => {
  const p = piece(8, 4, SQUARE);
  stage([], [p], 600);

  p.col = 5;
  state.game.play.tick = 607;
  paint();
  state.game.play.tick = 610;
  paint();
  const cells = drawnPieces();
  for (const cell of cells) {
    assert.equal(cell.c > 4 && cell.c < 6, true, 'the piece is caught mid-slide between the columns');
  }
  state.game.play.tick = 614;
  paint();
  for (const cell of drawnPieces()) {
    assert.equal(cell.c === 5 || cell.c === 6, true, 'the slide ends at the column the rules hold, not past it');
  }
});

test('a shift the stack refuses leaves the piece put', () => {
  const p = piece(8, 4, SQUARE);
  stage([], [p], 700);
  for (let tick = 701; tick < 712; tick += 1) {
    state.game.play.tick = tick;
    paint();
  }
  for (const cell of drawnPieces()) {
    assert.equal(cell.c === 4 || cell.c === 5, true, 'no partial slide is invented for a shift that never happened');
  }
});

test('a rotation stays instant and does not slide the piece', () => {
  const shape = [[0, 0], [0, 1], [1, 0], [1, 1]];
  const p = piece(8, 4, shape);
  stage([], [p], 800);
  // The rules hand a turned shape to the same piece; the slide record resets.
  p.shape = [[0, 0], [1, 0], [1, 1], [1, 2]];
  state.game.play.tick = 803;
  paint();
  for (const cell of drawnPieces()) {
    assert.equal(Number.isInteger(cell.c), true, 'the turned piece sits in whole columns');
  }
});

// Honesty over a whole interval: a piece above a stack, a snake beside the top
// wall, sampled at every tenth of its travel. No drawn cell may name a cell the
// mover does not occupy on the way through.
test('a piece above a stack never names the row it is about to land on', () => {
  grid.initGrid();
  for (let c = 0; c < C.COLS; c += 1) {
    grid.setCell(18, c, C.SOLID);
  }
  const p = piece(16, 4, SQUARE);
  stage([], [p], 900);
  for (let tenth = 0; tenth <= 10; tenth += 1) {
    p.row = 16 + tenth / 10;
    state.game.play.tick = 900 + tenth;
    paint();
    for (const cell of drawnPieces()) {
      // The piece's own rule rows for this fraction, and the drawn seat.
      const ruleRow = Math.floor(p.row);
      assert.equal(cell.r >= ruleRow - 1, true, 'never a whole row above the one it occupies');
      assert.equal(cell.r <= ruleRow + 1, true, 'never sunk past the row it occupies');
      assert.equal(cell.r === 18 || cell.r === 19, false, 'never names a cell the stack holds');
    }
  }
});

test('a snake beside the top wall never names a row above the board', () => {
  stage([[1, 6], [2, 6]], [], 1000);
  const snake = staged.snake;
  step(snake, { r: 0, c: 6 });
  state.game.play.tick = 1024;
  paint();
  for (let tick = 1025; tick <= 1048; tick += 1) {
    state.game.play.tick = tick;
    paint();
    for (const cell of painted(HEAD)) {
      const row = (cell.y - 1) / CELL;
      assert.equal(row >= 0, true, 'the crawl never paints above the top row');
      assert.equal(row <= 1, true, 'and never leaves the two rows the head crossed');
    }
    for (const cell of painted(BODY)) {
      const row = (cell.y - 1) / CELL;
      assert.equal(row >= 1 && row <= 2, true, 'the body stays between the cells it crossed');
    }
  }
});

// Two shifts asked a tick apart: the piece slides over the columns it crossed,
// and never past the newest one the rules hold.
test('shifts asked in quick succession still seat at the columns the rules hold', () => {
  grid.initGrid();
  const p = piece(8, 3, SQUARE);
  stage([], [p], 1200);
  p.col = 4;
  state.game.play.tick = 1201;
  paint();
  p.col = 5;
  state.game.play.tick = 1202;
  paint();
  state.game.play.tick = 1205;
  paint();
  const cols = drawnPieces().map((cell) => cell.c);
  for (const c of cols) {
    assert.equal(c >= 3 && c <= 6, true, 'caught between the columns it crossed, never past the newest');
  }
  state.game.play.tick = 1209;
  paint();
  for (const c of drawnPieces().map((cell) => cell.c)) {
    assert.equal(c === 5 || c === 6, true, 'the last slide ends at the newest column the rules hold');
  }
});

// Travel is the painter's: the frame two peers exchange keeps its shape.
test('travel adds nothing to the frame the peers exchange', () => {
  const payload = network.encodeFrame();
  const frame = JSON.parse(payload);
  assert.equal(frame.length, 14, 'the frame still carries the 14 fields it shipped before');
  assert.equal(network.applyFrame(payload), true, 'a page that only receives frames still accepts the frame unchanged');
  assert.equal(JSON.parse(network.encodeFrame()).length, 14, 'and re-encoding after the apply still ships 14');
});

// The honesty sweep over a real game rather than staged cells (task 6.1, spec
// "A drawn position never implies a position the mover does not occupy"): the
// tick runs through app.update(), the page paints at an uneven cadence the
// clock cannot promise - one frame on some ticks, two on the next - and every
// cell any painter filled is tested against the cells the rules hold on that
// very frame.
const { startIn } = await import('./helpers/game.js');
const app = await import('../js/app.js');

// Every colour a snake cell can be painted in: the head, the body, and the
// three overflow tiers. A cell filled in any other colour belongs to another
// mover or to the field, and this sweep leaves it to its own test.
const SNAKE_INK = [C.COLORS.snakeHead, C.COLORS.snakeBody, C.COLORS.tierBlue, C.COLORS.tierPurple, C.COLORS.tierGold];

const EPS = 1e-6;

// Is a painted cell at (x, y) pixels a position the mover could be held at?
// It must hug one axis of a cell the mover holds, and the far axis must sit on
// that cell: a hop changes one axis at a time. Off-field coordinates are
// allowed on one count, because they are the edge copy of a hop that went
// round the board and the buffer clips them.
function honestAgainst(paintedCells, legalCells) {
  for (const cell of paintedCells) {
    const onField = cell.r >= 0 && cell.r < C.ROWS && cell.c >= 0 && cell.c < C.COLS;
    let hugging = false;
    for (const legal of legalCells) {
      const far = Math.max(Math.abs(cell.c - legal.c), Math.abs(cell.r - legal.r));
      const still = Math.min(Math.abs(cell.c - legal.c), Math.abs(cell.r - legal.r));
      if (far <= 1 + EPS && still <= EPS) { hugging = true; break; }
    }
    if (!hugging && onField) return false;
  }
  return true;
}

// What one page painted for each mover on the frame it is on, so a host page and
// a guest page can be compared move for move.
function drawnFrame() {
  rec.rects.length = 0;
  rec.lines.length = 0;
  rec.strokes.length = 0;
  render.render();
  const snake = rec.rects.filter(([style]) => SNAKE_INK.includes(style))
    .map(([, x, y]) => [y / CELL, x / CELL]);
  const pieces = painted(EDIBLE).map((cell) => [cell.y / CELL - 1 / CELL, cell.x / CELL - 1 / CELL]);
  return { snake, pieces };
}

test('a page driven only by whole frames travels like the page that ran the ticks', async () => {
  const encodeFrame = network.encodeFrame;
  const applyFrame = network.applyFrame;

  // The host page: it runs the ticks, ships the frame it reached, and remembers
  // what it painted at that tick.
  startIn('PLAYING', 'snake');
  grid.initGrid();
  render.initRender(canvas);
  const shipped = [];
  const hostDrawn = [];
  for (let tick = 0; tick < 120; tick += 1) {
    app.update();
    shipped.push(encodeFrame());
    hostDrawn.push(drawnFrame());
  }

  // The guest page: it runs no tick of its own, it only applies the frames that
  // arrived and paints what its own observation of them lets it see.
  startIn('PLAYING', 'snake');
  grid.initGrid();
  render.initRender(canvas);
  for (let tick = 0; tick < shipped.length; tick += 1) {
    assert.ok(applyFrame(shipped[tick]), 'the frame arrived as the fourteen fields it ships');
    const seen = drawnFrame();
    const host = hostDrawn[tick];
    assert.deepEqual(seen.snake, host.snake, 'the guest paints the travel the host painted at tick ' + tick);
    assert.deepEqual(seen.pieces, host.pieces, 'the guest seats the pieces where the host painted them at tick ' + tick);
  }
});

test('a real game painted at an uneven cadence never paints a cell the mover does not occupy', async () => {
  const game = startIn('PLAYING', 'snake');
  grid.initGrid();
  render.initRender(canvas);

  for (let tick = 0; tick < 240; tick += 1) {
    app.update();
    const frames = tick % 3 === 0 ? 1 : 2;
    for (let frame = 0; frame < frames; frame += 1) {
      rec.rects.length = 0;
      rec.lines.length = 0;
      rec.strokes.length = 0;
      render.render();

      const snakeInk = rec.rects.filter(([style]) => SNAKE_INK.includes(style));
      const drawnSnake = snakeInk.map(([, x, y]) => ({ r: (y - 1) / CELL, c: (x - 1) / CELL }));
      const heldSnake = game.play.snake.map((cell) => ({ r: cell.r, c: cell.c }));
      // The cell each segment left at also names a cell the mover occupied, and
      // the spec allows either side of the travel.
      const motionRec = render.motion.snakeRec;
      const legalSnake = heldSnake.concat(motionRec ? motionRec.from.map((cell) => ({ r: cell.r, c: cell.c })) : []);
      assert.equal(drawnSnake.length >= heldSnake.length, true, 'segments painted ' + drawnSnake.length + ' of ' + heldSnake.length + ' held at tick ' + tick + ': ' + JSON.stringify([drawnSnake, heldSnake]));
      assert.equal(drawnSnake.length <= 2 * heldSnake.length, true, 'at most the edge copy of a wrapped hop is added');
      assert.ok(honestAgainst(drawnSnake, legalSnake), 'a snake cell painted away from its own cells: ' + JSON.stringify([tick, drawnSnake, legalSnake]));

      const ruleCells = [];
      for (const p of game.play.pieces) {
        for (const [dr, dc] of p.shape) ruleCells.push({ r: Math.floor(p.row + dr), c: p.col + dc });
      }
      const drawnPiece = painted(EDIBLE);
      assert.equal(drawnPiece.length <= ruleCells.length, true, 'travel never paints more cells than a shape holds');
      if (ruleCells.length > 0) {
        assert.ok(honestAgainst(drawnPiece.map((cell) => ({ r: cell.y / CELL - 1 / CELL, c: cell.x / CELL - 1 / CELL })), ruleCells),
          'a falling piece was drawn sunk past the row it occupies: ' + JSON.stringify([tick, drawnPiece, ruleCells]));
      }
    }
  }
});

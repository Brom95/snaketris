import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub } from './helpers/dom-stub.js';

const stub = installDomStub();
const state = await import('../js/state.js');
const render = await import('../js/render.js');
const C = await import('../js/constants.js');
const grid = await import('../js/grid.js');

// Table-driven: at every overflow 0..22 the head is green, the body is grey
// until overflow reaches its index, then blue, purple and gold — gold past
// the last tier. Seven body segments (indices 1..7) are checked each step.
test('bodyColor over overflow 0..22', () => {
  const TIERS = [C.COLORS.tierBlue, C.COLORS.tierPurple, C.COLORS.tierGold];
  for (let o = 0; o <= 22; o += 1) {
    state.game.play.overflow = o;
    assert.equal(render.bodyColor(0), C.COLORS.snakeHead);
    for (let i = 1; i < 8; i += 1) {
      if (o < i) {
        assert.equal(render.bodyColor(i), C.COLORS.snakeBody, `overflow=${o} index=${i}`);
      } else {
        const tier = Math.min(2, Math.floor((o - i) / C.TIER_WIDTH));
        assert.equal(render.bodyColor(i), TIERS[tier], `overflow=${o} index=${i}`);
      }
    }
  }
});

// The field frame: one strokeRect in the landed-block colour, thicker than the
// inner grid lines, which keep the faint grid colour. A recording context counts
// the calls render() makes.
test('field frame painted in the landed-block colour', () => {
  const rec = { strokes: [], rects: [] };
  const ctxRec = {
    fillStyle: null,
    strokeStyle: null,
    lineWidth: null,
    fillRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    fillText: () => {},
    stroke: () => { rec.strokes.push([ctxRec.strokeStyle, ctxRec.lineWidth]); },
    strokeRect: (x, y, w, h) => { rec.rects.push([ctxRec.strokeStyle, ctxRec.lineWidth, x, y, w, h]); },
  };
  const canvas = stub.canvas;
  canvas.width = C.COLS * C.CELL;
  canvas.height = C.ROWS * C.CELL;
  canvas.getContext = () => ctxRec;
  state.game.play.snake = [];
  state.game.play.pieces = [];
  grid.initGrid();
  render.initRender(canvas);
  render.render();

  assert.equal(rec.rects.length, 1, 'exactly one frame stroke');
  assert.equal(rec.rects[0][0], C.COLORS.solid, 'the frame uses the landed-block colour');
  assert.equal(rec.rects[0][1], 2, 'the frame stroke is thicker than the grid lines');
  assert.equal(rec.rects[0][3], 1, 'the frame is inset so a 2px stroke is not clipped');
  assert.equal(rec.rects[0][4], C.COLS * C.CELL - 2, 'the frame spans the board width');
  assert.equal(rec.rects[0][5], C.ROWS * C.CELL - 2, 'the frame spans the board height');

  assert.equal(rec.strokes.length, (C.COLS - 1) + (C.ROWS - 1), 'inner lines only');
  for (const [style, width] of rec.strokes) {
    assert.equal(style, C.COLORS.grid, 'inner lines keep the faint grid colour');
    assert.equal(width, 1, 'inner lines stay one pixel wide');
  }
});

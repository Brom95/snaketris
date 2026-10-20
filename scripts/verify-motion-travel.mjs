// scripts/verify-motion-travel.mjs
// Headless check that movers travel finer than the grid the page shows
// (change: smooth-motion-rendering, tasks 5.2 and 6.4).
//
//   5.2  the canvas buffer stays 240x480 and the grid the player is shown keeps
//        its lines at multiples of CELL, while a mover's square sits off those
//        lines. The check reads pixels off the buffer the page paints, so the
//        claim is about what the player sees, not about a recorded call.
//   6.4  the same travel rule drives a page that only receives frames; this
//        check covers the page that simulates, and the transport checks
//        (verify-network-local, verify-local-transport) still stand with the
//        change in place.
//
//   4.2  two reads the follow-on change (smooth-turns-and-spins) asks for: while
//        the head travels a turn, the cell it pivots on keeps a drawn square, and
//        a rotation is caught mid-sweep in a handful of frames rather than none.
//
// The palette rule is the sharp end of the claim: every pixel is one of the
// palette colours or a grid mark, so the travel is snapped to whole pixels
// (design D7) and nothing arrives with a soft edge.
//
// Run: node scripts/verify-motion-travel.mjs

import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
import { check, report, failureCount, freshPage, playRole, waitFor, exposeGame, stateIs } from './harness.mjs';
import { CELL, COLS, ROWS, BOARD_W, BOARD_H, COLORS } from '../js/constants.js';

const ROOT = resolve(import.meta.dirname, '..');

const asRgb = (hex) => [
  parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16),
];
const PALETTE = [
  asRgb(COLORS.bg), asRgb(COLORS.snakeHead), asRgb(COLORS.snakeBody), asRgb(COLORS.edible),
  asRgb(COLORS.solid), asRgb(COLORS.tierBlue), asRgb(COLORS.tierPurple), asRgb(COLORS.tierGold),
];
const BG = PALETTE[0];
const HEAD = asRgb(COLORS.snakeHead);
const PIECE = asRgb(COLORS.edible);
const SNAKE_INK = [HEAD, asRgb(COLORS.snakeBody), asRgb(COLORS.tierBlue),
  asRgb(COLORS.tierPurple), asRgb(COLORS.tierGold)];

// One pass over the buffer: classify every pixel, and note where a mover square
// sits (its top and left edge, in whole pixels).
async function inspect(page) {
  return await page.evaluate(async (wanted) => {
    const cv = document.querySelector('#game');
    if (!cv) return { error: 'no canvas' };
    const ctx = cv.getContext('2d');
    const w = cv.width, h = cv.height;
    const img = ctx.getImageData(0, 0, w, h).data;
    const same = (at, colour) => img[at] === colour[0] && img[at + 1] === colour[1] && img[at + 2] === colour[2];
    const near = (at, colour) => Math.abs(img[at] - colour[0]) <= 16
      && Math.abs(img[at + 1] - colour[1]) <= 16 && Math.abs(img[at + 2] - colour[2]) <= 16;
    const seen = { offGrid: 0, unexpected: 0 };
    const faintX = new Set();
    const faintY = new Set();
    let headY = null, headX = null, pieceY = null, pieceX = null;
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const at = (y * w + x) * 4;
        if (same(at, wanted.head)) {
          if (headY === null) headY = y;
          if (headX === null || x < headX) headX = x;
        } else if (same(at, wanted.piece)) {
          if (pieceY === null) pieceY = y;
          if (pieceX === null || x < pieceX) pieceX = x;
        }
        if (near(at, wanted.bg) && !same(at, wanted.bg)) {
          // A faint mark over the background: a grid line and its antialiased
          // half. Nothing else may look like this.
          const onLine = x % wanted.cell === 0 || x % wanted.cell === wanted.cell - 1 || y % wanted.cell === 0 || y % wanted.cell === wanted.cell - 1;
          if (!onLine) seen.offGrid += 1;
          if (x % wanted.cell === 0 || x % wanted.cell === wanted.cell - 1) faintX.add(x);
          if (y % wanted.cell === 0 || y % wanted.cell === wanted.cell - 1) faintY.add(y);
        } else if (!wanted.palette.some((colour) => same(at, colour)) && !near(at, wanted.bg)) {
          // A colour the palette does not name: a soft edge from an un-snapped
          // fill, or something painted outside the style.
          seen.unexpected += 1;
        }
      }
    }
    return {
      width: w, height: h,
      offGrid: seen.offGrid, unexpected: seen.unexpected,
      faintX: [...faintX], faintY: [...faintY],
      headY, headX, pieceY, pieceX,
    };
  }, {
    palette: PALETTE, bg: BG, head: HEAD, piece: PIECE, cell: CELL,
  });
}

// The edges one mover's square took over a run of frames, so travel can be told
// from a jump: stepping visits consecutive pixel positions, teleporting does not.
async function edges(page, samples, gap) {
  return await page.evaluate(async (wanted) => {
    const cv = document.querySelector('#game');
    const ctx = cv.getContext('2d');
    const w = cv.width, h = cv.height;
    const rows = [];
    for (let s = 0; s < wanted.n; s += 1) {
      const img = ctx.getImageData(0, 0, w, h).data;
      let headY = null, headX = null, pieceY = null, pieceX = null, pieceBottom = null;
      for (let y = 0; y < h; y += 1) {
        for (let x = 0; x < w; x += 1) {
          const at = (y * w + x) * 4;
          if (img[at] === wanted.head[0] && img[at + 1] === wanted.head[1] && img[at + 2] === wanted.head[2]) {
            if (headY === null) headY = y;
            if (headX === null || x < headX) headX = x;
          } else if (img[at] === wanted.piece[0] && img[at + 1] === wanted.piece[1] && img[at + 2] === wanted.piece[2]) {
            if (pieceY === null) pieceY = y;
            if (pieceX === null || x < pieceX) pieceX = x;
            // A piece entering from above is clipped at the buffer, so its top
            // edge sits at 0 for a while: its bottom edge is the one that keeps
            // the fall's real position.
            pieceBottom = y;
          }
        }
      }
      rows.push({ headY, headX, pieceY, pieceX, pieceBottom });
      if (s + 1 < wanted.n) await new Promise((done) => setTimeout(done, wanted.gap));
    }
    return rows;
  }, { n: samples, gap: gap, head: HEAD, piece: PIECE });
}

// The longest run of consecutive pixel positions an edge visited in turn: a
// teleport that jumps a whole cell visits one position per cell, a crawl visits
// most of the pixels between two cells.
function longestRun(values) {
  const seen = new Set(values.filter((v) => v !== null));
  let best = 0;
  for (const v of seen) {
    if (!seen.has(v - 1)) {
      let run = 1;
      while (seen.has(v + run)) run += 1;
      if (run > best) best = run;
    }
  }
  return best;
}

function offCell(edge) {
  return edge !== null && (edge - 1) % CELL !== 0;
}

// One run of paired reads: the centre pixel of every cell, the edges of
// the snake head and of the piece, and the rules' own head and pieces, all taken in
// the same instant so a claim can pair what the page painted with what the rules hold.
async function travel(page, samples, gap) {
  return await page.evaluate(async (wanted) => {
    const cv = document.querySelector('#game');
    const ctx = cv.getContext('2d');
    const w = cv.width, h = cv.height;
    const out = [];
    const INK = wanted.snakeInk, EDIBLE = wanted.edible;
    let img = null;
    const match = (p, colour) => img[p] === colour[0] && img[p + 1] === colour[1] && img[p + 2] === colour[2];
    for (let s = 0; s < wanted.n; s += 1) {
      const g = window.__game;
      img = ctx.getImageData(0, 0, w, h).data;
      const head = g.play.snake && g.play.snake.length ? [g.play.snake[0].r, g.play.snake[0].c] : null;
      const ink = [];
      for (let r = 0; r < wanted.rows; r += 1) {
        for (let c = 0; c < wanted.cols; c += 1) {
          const p = ((r * wanted.cell + wanted.cell / 2) * w + (c * wanted.cell + wanted.cell / 2)) * 4;
          let v = 0;
          for (let k = 0; k < INK.length; k += 1) {
            if (match(p, INK[k])) { v = 1; break; }
          }
          if (v === 0 && match(p, EDIBLE)) v = 2;
          ink.push(v);
        }
      }
      let headTop = null, headLeft = null, pieceLeft = null, pieceRight = null;
      for (let y = 0; y < h; y += 1) {
        for (let x = 0; x < w; x += 1) {
          const p = (y * w + x) * 4;
          if (match(p, wanted.head)) {
            if (headTop === null) headTop = y;
            if (headLeft === null || x < headLeft) headLeft = x;
          } else if (match(p, EDIBLE)) {
            if (pieceLeft === null || x < pieceLeft) pieceLeft = x;
            if (pieceRight === null || x > pieceRight) pieceRight = x;
          }
        }
      }
      out.push({
        tick: g.play.tick, head: head, ink: ink, headTop: headTop, headLeft: headLeft,
        pieceLeft: pieceLeft, pieceRight: pieceRight,
        pieces: (g.play.pieces || []).map((pp) => [pp.type, pp.state, pp.col, Math.floor(pp.row)]),
      });
      if (s + 1 < wanted.n) await new Promise((done) => setTimeout(done, wanted.gap));
    }
    return out;
  }, { n: samples, gap: gap, cell: CELL, cols: COLS, rows: ROWS, snakeInk: SNAKE_INK, edible: PIECE, head: HEAD });
}

// The centre pixel of one cell, as the paired reads report it: 1 for snake ink,
// 2 for a falling piece, 0 for the field.
function cellInk(sample, r, c) {
  return sample.ink[r * COLS + c];
}


const browser = await chromium.launch();
const context = await browser.newContext();

const idle = await freshPage(context, ROOT);
const still = await inspect(idle);
check(still.width === BOARD_W && still.height === BOARD_H,
  'the canvas buffer is still ' + BOARD_W + 'x' + BOARD_H);
check(still.unexpected === 0, 'every pixel on it is a palette colour or a grid mark: '
  + still.unexpected + ' soft-edged pixel(s)');
check(still.offGrid === 0, 'the grid lines the page strokes stay the only faint marks: '
  + still.offGrid + ' faint pixel(s) off them');
const faintX = new Set(still.faintX);
const faintY = new Set(still.faintY);
const innerColumns = Array.from(Array(COLS - 1), (_, i) => i + 1)
  .filter((c) => faintX.has(c * CELL) || faintX.has(c * CELL - 1)).length;
const innerRows = Array.from(Array(ROWS - 1), (_, i) => i + 1)
  .filter((r) => faintY.has(r * CELL) || faintY.has(r * CELL - 1)).length;
check(innerColumns === COLS - 1, 'the shown field keeps its ' + (COLS - 1) + ' inner vertical lines: '
  + innerColumns);
check(innerRows === ROWS - 1, 'and its ' + (ROWS - 1) + ' inner horizontal lines: ' + innerRows);

const started = await playRole(context, 'snake', ROOT);
check(started.ok, 'a snake-role game reached PLAYING on the page');
if (started.ok) {
  // The first piece spawns above the field and takes seconds to come down, so
  // wait for one to hold a visible row before the frames mean anything.
  const visible = await waitFor(started.page, (probe) => {
    const g = window.__game;
    return g.screen.state === 'PLAYING' && g.play.pieces.some((p) => p.row > -1);
  }, null, 30000);
  check(visible, 'a piece came down into the field while the page ran');

  const frames = await edges(started.page, 40, 16);
  const headY = frames.map((row) => row.headY);
  const headX = frames.map((row) => row.headX);
  const pieceY = frames.map((row) => row.pieceY);
  const pieceBottom = frames.map((row) => row.pieceBottom);
  // A square's bottom edge, at rest, sits cell - 2 px under the row it occupies.
  const bottomOffCell = (y) => y !== null && (y - (CELL - 2)) % CELL !== 0;
  const offHead = headY.filter((v) => offCell(v)).length + headX.filter((v) => offCell(v)).length;
  const offPiece = pieceBottom.filter((v) => bottomOffCell(v)).length;

  check(offHead >= 3, 'the snake head is caught off the cell it holds in at least 3 of 40 frames: '
    + offHead);
  check(offPiece >= 3, 'a falling piece is caught between rows in at least 3 of 40 frames: ' + offPiece);
  check(longestRun(headY) >= 4 || longestRun(headX) >= 4,
    'one head edge steps through ' + Math.max(longestRun(headY), longestRun(headX)) + ' consecutive pixels in a row');
  check(longestRun(pieceBottom) >= 4, 'the piece bottom edge steps through ' + longestRun(pieceBottom) + ' consecutive pixels in a row');
  console.log('  head edges (first 12): ' + headY.slice(0, 12) + ' / x ' + headX.slice(0, 12));
  console.log('  piece bottom edges (first 12): ' + pieceBottom.slice(0, 12));
  await started.page.close();
}


// Two reads this change asks for (tasks 4.2 of smooth-turns-and-spins), each on
// the page that owns the mover it reads: the player steers a bend on a snake page
// and turns a piece on a tetris page, so the frames that follow are known rather
// than hoped for.
const steered = await playRole(context, 'snake', ROOT);
check(steered.ok, 'a snake-role game reached PLAYING on the page');
if (steered.ok) {
  const livePage = steered.page;
  const shots = [];
  // One press right, one press down: the head bends at the cell it last held,
  // and the reads that follow cover the tick that travel crosses.
  for (let round = 0; round < 3; round += 1) {
    await livePage.keyboard.press('ArrowRight');
    for (const row of await travel(livePage, 10, 14)) shots.push(row);
    await livePage.keyboard.press('ArrowDown');
    for (const row of await travel(livePage, 10, 14)) shots.push(row);
  }
  const heads = [];
  const corners = [];
  let turns = 0;
  let cornerFrames = 0;
  for (const sample of shots) {
    for (let i = corners.length - 1; i >= 0; i -= 1) {
      const watch = corners[i];
      const travelling = offCell(sample.headTop) || offCell(sample.headLeft);
      if (travelling && cellInk(sample, watch.r, watch.c) === 1) cornerFrames += 1;
      watch.left -= 1;
      if (watch.left <= 0) corners.splice(i, 1);
    }
    const head = sample.head;
    if (head !== null && (heads.length === 0
      || heads[heads.length - 1][0] !== head[0] || heads[heads.length - 1][1] !== head[1])) {
      heads.push(head);
      const n = heads.length;
      if (n >= 3) {
        const a = heads[n - 3], b = heads[n - 2], c = heads[n - 1];
        const dr1 = b[0] - a[0], dc1 = b[1] - a[1];
        const dr2 = c[0] - b[0], dc2 = c[1] - b[1];
        const single = (dr, dc) => Math.abs(dr) + Math.abs(dc) === 1;
        if (single(dr1, dc1) && single(dr2, dc2) && dr1 !== dr2 || dc1 !== dc2) {
          turns += 1;
          corners.push({ r: b[0], c: b[1], left: 6 });
        }
      }
    }
  }
  check(turns >= 1, 'the steered snake bent its direction during the reads: ' + turns + ' turn(s)');
  check(cornerFrames >= 3, 'the corner it turned on keeps a drawn square while the head travels: '
    + cornerFrames + ' frame(s)');
  console.log('  bends: ' + turns + ', corner frames: ' + cornerFrames);
  await livePage.close();
}

const turned = await playRole(context, 'tetris', ROOT);
check(turned.ok, 'a tetris-role game reached PLAYING on the page');
if (turned.ok) {
  const livePage = turned.page;
  // Wait for a piece the page actually shows, and one that is not an O: an O
  // turns into the cells it already holds, so it has nothing to sweep.
  const visible = await waitFor(livePage, (probe) => {
    const g = window.__game;
    return g.screen.state === 'PLAYING' && g.play.pieces.some((p) => p.row > 2 && p.type !== 'O');
  }, null, 30000);
  check(visible, 'a piece that can turn came down into the field while the page ran');
  const shots = [];
  let rotations = 0;
  let sweepFrames = 0;
  const watches = [];
  let previous = null;
  for (let round = 0; round < 8; round += 1) {
    await livePage.keyboard.press('s');
    for (const row of await travel(livePage, 10, 14)) shots.push(row);
    const seen = shots[shots.length - 10];
    if (previous !== null && seen.pieces.length === 1 && previous.length === 1
      && previous[0][0] === seen.pieces[0][0] && previous[0][1] !== seen.pieces[0][1]) {
      rotations += 1;
      watches.push(6);
    }
    for (const sample of shots.slice(shots.length - 10)) {
      if (watches.length > 0 && sample.pieces.length === 1 && offCell(sample.pieceLeft)) sweepFrames += 1;
      for (let i = watches.length - 1; i >= 0; i -= 1) {
        watches[i] -= 1;
        if (watches[i] <= 0) watches.splice(i, 1);
      }
    }
    previous = seen.pieces;
  }
  check(rotations >= 1, 'the piece the player owns turned during the reads: ' + rotations + ' turn(s)');
  check(sweepFrames >= 3, 'a turn is caught mid-sweep, its edge off the column grid: ' + sweepFrames + ' frame(s)');
  console.log('  turns asked: 8, rotations answered: ' + rotations + ', sweep frames: ' + sweepFrames);
  await livePage.close();
}

await idle.close();
for (const b of [browser]) await b.close();

report('verify-motion-travel', failureCount());

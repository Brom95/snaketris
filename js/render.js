// Rendering. The engine owns the drawing buffer, its size and the cell primitive;
// this module owns what the game paints: the grid, the solid blocks, the snake.
import {
  COLS, ROWS, CELL, BOARD_W, BOARD_H, SOLID, COLORS, TIER_WIDTH,
} from './constants.js';
import { game } from './state.js';
import { getGrid } from './grid.js';
import { paintPieces } from './pieces.js';
import { createCanvas } from '../engine/js/canvas.js';
import { paintCanvas, registerCanvasPainter } from '../engine/js/present.js';

// The engine drawing buffer: sized from the game's board numbers at construction.
const field = createCanvas({ width: BOARD_W, height: BOARD_H, cell: CELL });

let ctx = null;

// The one paint context every canvas painter reads: the state root, and this
// module's canvas owner (its buffer size, its 2d context, its cell helper).
const paintCtx = { state: game, field };

// The tier colours of the snake body, in recolor order: blue, then purple,
// then gold. After gold the body stays gold.
const TIERS = [COLORS.tierBlue, COLORS.tierPurple, COLORS.tierGold];

// The colour of the snake segment at index 0: the head is green; the body
// is grey until overflow reaches it, then blue, purple and gold in that
// order (Math.min(2, ...) keeps the body gold past the last tier).
export function bodyColor(index) {
  if (index === 0) return COLORS.snakeHead;
  if (game.play.overflow < index) return COLORS.snakeBody;
  const tier = Math.min(2, Math.floor((game.play.overflow - index) / TIER_WIDTH));
  return TIERS[tier];
}

// Called by app.js after the canvas exists; hands the element to the engine buffer
// and registers the painters the engine pass runs, in draw order.
export function initRender(canvasEl) {
  field.attach(canvasEl);
  ctx = field.context();
  registerCanvasPainter('field', paintField);
  registerCanvasPainter('snake', paintSnake);
  registerCanvasPainter('pieces', paintPieces);
}

function drawGrid() {
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * CELL, 0);
    ctx.lineTo(c * CELL, field.height());
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * CELL);
    ctx.lineTo(field.width(), r * CELL);
    ctx.stroke();
  }
  // The field limits read as a wall in the landed-block colour. The stroke is
  // inset by one pixel so a 2-pixel-wide stroke is not clipped by the canvas edge.
  ctx.strokeStyle = COLORS.solid;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, field.width() - 2, field.height() - 2);
}

// What this page has seen the movers do, kept in the render layer so the rules
// never read it and the wire never carries it (design D8, corrected by the
// guest check): the snake is one mover so the page keeps one record for it and
// keys nothing, and a falling piece is matched to what the page saw a frame ago
// by the cells it stood on rather than by which object it is, because a guest
// page rebuilds every mover out of the frame it received and object identity
// there is a new object every frame. prune is the reset path: a tick that went
// backwards is a new game.
const SHIFT_TRAVEL_TICKS = 7;

export const motion = {
  tick: 0,
  snakeRec: null,
  pieceRecs: [],
  // The records this frame hands the painters, rebuilt every frame from what the
  // page saw a frame ago rather than from which object a mover is: a guest page
  // rebuilds every mover out of the frame it received, so object identity there
  // is a new object every frame.
  frameRecords: new Map(),
  // The snake stepped: its cells differ from the cells it came from, so the
  // interval between steps is measured from this page's own observations.
  observeSnake(cells) {
    const rec = motion.snakeRec;
    if (!rec) {
      motion.snakeRec = { from: cells, to: cells, movedTick: game.play.tick, intervalTicks: 0 };
      return motion.snakeRec;
    }
    if (sameCells(rec.to, cells)) return rec;
    const gap = game.play.tick - rec.movedTick;
    if (gap > 0) rec.intervalTicks = gap;
    rec.from = rec.to;
    rec.to = cells;
    rec.movedTick = game.play.tick;
    return rec;
  },
  // A shape read as text, so a frame that rebuilt the shape array still answers
  // for the shape it carries rather than for a new object holding it.
  shapeKey(shape) {
    return shape.map(([dr, dc]) => dr + ',' + dc).join(';');
  },
  // A falling piece answered for by the record whose cells it stood nearest to
  // a frame ago, within the one column a shift and the fraction of a fall a
  // frame can carry. A shape that reads different is a rotation or a bitten
  // cell, and the piece gets a record of its own rather than a slide through it.
  observePieces(list) {
    const prev = motion.pieceRecs;
    const taken = prev.map(() => false);
    const next = [];
    const frame = new Map();
    for (const p of list) {
      const key = motion.shapeKey(p.shape);
      let bestAt = -1;
      let bestGap = Infinity;
      for (let i = 0; i < prev.length; i += 1) {
        const rec = prev[i];
        if (taken[i] || rec.key !== key) continue;
        const gap = Math.abs(p.col - rec.colSeen) + Math.abs(p.row - rec.row);
        if (Math.abs(p.col - rec.colSeen) > 1 || Math.abs(p.row - rec.row) > 2.5) continue;
        if (gap < bestGap) {
          bestGap = gap;
          bestAt = i;
        }
      }
      const rec = bestAt >= 0 ? prev[bestAt] : { prevCol: p.col, colSeen: p.col, colTick: game.play.tick, row: p.row, key };
      if (bestAt >= 0) {
        taken[bestAt] = true;
        if (rec.colSeen !== p.col) {
          rec.prevCol = rec.colSeen;
          rec.colTick = game.play.tick;
        }
      }
      rec.colSeen = p.col;
      rec.row = p.row;
      next.push(rec);
      frame.set(p, rec);
    }
    motion.pieceRecs = next;
    motion.frameRecords = frame;
  },
  // The column this page draws a piece at: the column it left at the point of
  // the slide it answered into (task 4.1, design D4). The slide runs a fixed
  // number of ticks, so mashing never stretches the travel.
  pieceCol(p) {
    const rec = motion.frameRecords.get(p);
    const phase = motion.phaseSince(rec ? rec.colTick : game.play.tick, SHIFT_TRAVEL_TICKS);
    return motion.step(rec ? rec.prevCol : p.col, p.col, phase);
  },
  phaseSince(movedTick, intervalTicks) {
    if (!intervalTicks) return 0;
    const phase = (game.play.tick - movedTick) / intervalTicks;
    return phase < 0 ? 0 : phase > 1 ? 1 : phase;
  },
  // One cell coordinate at the point of a hop: travel runs in pixels and is
  // rounded once, so the +1 inset and the cell - 2 size the engine draws stay
  // integers while the position still moves about one pixel a tick (design D7).
  step(from, to, phase) {
    const p = phase < 0 ? 0 : phase > 1 ? 1 : phase;
    return Math.round(from * CELL + (to - from) * CELL * p) / CELL;
  },
  // A hop at the point it is through: the cells to hand drawCell. An adjacent
  // hop is one cell between the cell it left and the one it entered; a hop that
  // went round the board is drawn at both edges so the canvas clip cuts each end
  // and nothing smears across the field (design D6); any other hop is one this
  // page cannot see the middle of, so it seats at the cell it reached.
  travelCells(from, to, phase) {
    const dr = to.r - from.r;
    const dc = to.c - from.c;
    if (dr * dr + dc * dc === 1) {
      return [{ r: motion.step(from.r, to.r, phase), c: motion.step(from.c, to.c, phase) }];
    }
    if (Math.abs(dr) === ROWS - 1) {
      const dir = (to.r - from.r + ROWS) % ROWS === 1 ? 1 : -1;
      return [
        { r: motion.step(from.r, from.r + dir, phase), c: from.c },
        { r: motion.step(to.r - dir, to.r, phase), c: to.c },
      ];
    }
    if (Math.abs(dc) === COLS - 1) {
      const dir = (to.c - from.c + COLS) % COLS === 1 ? 1 : -1;
      return [
        { r: from.r, c: motion.step(from.c, from.c + dir, phase) },
        { r: to.r, c: motion.step(to.c - dir, to.c, phase) },
      ];
    }
    return [{ r: to.r, c: to.c }];
  },
  // A tick that went backwards is a new game: the page forgets what it saw.
  prune() {
    if (game.play.tick < motion.tick) {
      motion.snakeRec = null;
      motion.pieceRecs = [];
    }
    motion.frameRecords = new Map();
    motion.tick = game.play.tick;
  },
};

// Two cells the same, so a frame that observed no move is told from one that did.
function sameCells(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].r !== b[i].r || a[i].c !== b[i].c) return false;
  }
  return true;
}

// The painters in js/pieces.js read the same bookkeeping through the paint
// context, so no module has to import this one and no cycle appears.
paintCtx.motion = motion;

// The field painter: background, inner grid lines, the frame, and the solid
// blocks. Runs first so every later painter draws on top of it.
function paintField(pctx) {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, field.width(), field.height());
  drawGrid();

  // Solid blocks
  const grid = getGrid();
  ctx.fillStyle = COLORS.solid;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === SOLID) field.drawCell(r, c);
    }
  }
}

// The body painter: one cell per segment, head colour first, then the tier
// colour the current overflow reaches at that index.
function paintSnake(pctx) {
  const snake = game.play.snake;
  const rec = pctx.motion.snakeRec;
  const phase = rec ? pctx.motion.phaseSince(rec.movedTick, rec.intervalTicks) : 0;
  const from = rec ? rec.from : null;
  for (let i = 0; i < snake.length; i++) {
    const cur = snake[i];
    const prev = from && i < from.length ? from[i] : cur;
    ctx.fillStyle = bodyColor(i);
    for (const cell of pctx.motion.travelCells(prev, cur, phase)) {
      field.drawCell(cell.r, cell.c);
    }
  }
}

// The engine per-frame canvas pass: every registered painter, in draw order.
export function render() {
  motion.prune();
  // The page observes its movers once a frame, before any painter reads, so a
  // painter never has to know whether a move already happened.
  motion.observeSnake(game.play.snake.map((seg) => ({ r: seg.r, c: seg.c })));
  motion.observePieces(game.play.pieces);
  paintCanvas(paintCtx);
}

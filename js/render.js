// render.js — Canvas rendering layer
// Paints the game state: grid, pieces, snake, UI overlays
// Imports: js/constants, js/state, js/grid, js/pieces, engine/js/canvas, engine/js/present

// Rendering. The engine owns the drawing buffer, its size and the cell primitive;
// this module owns what the game paints: the grid, the solid blocks, the snake.
import {
  COLS, ROWS, CELL, BOARD_W, BOARD_H, SOLID, COLORS, TIER_WIDTH, PIECE_BOX,
  SNAKE_EAT_FLOAT_SPEED, MAX_SNAKE_LEN, FLOAT_FADE_TICKS, PLAYING,
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
const SHIFT_TRAVEL_TICKS = 12;
// A slide runs a fixed window of ticks rather than the player's own interval:
// measured, mashing would stretch the travel and make shifts lag. Twelve ticks
// is about 200 ms, roughly 120 px/s against a crawl of about 63 px/s, so the
// slide stops finishing before the hand does while still outrunning the crawl
// (task 3.1, design D6; the number stays retunable as one constant).
const ROTATION_TRAVEL_TICKS = 4;
// A turn runs a fixed handful of ticks too: about 67 ms, three to four rendered
// frames at 60 Hz, fast enough that the next input is never late and slow enough
// that the sweep can be watched (task 2.2, design D3).

export const motion = {
  tick: 0,
  snakeRec: null,
  pieceRecs: [],
  // The growth segments this page has seen the snake spawn this game: each is a
  // { spawnTick, duration } pair (task 1.2). A list, not one slot, so several
  // segments fly at once; prune() clears them when a new game starts.
  floats: [],
  // The snake length the page last saw, so a frame whose body grew by one is the
  // only frame that may spawn a segment (task 1.2). -1 until the first frame, so
  // the 3-segment snake afterReset installs spawns nothing.
  prevSnakeLen: -1,
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
    if (!snakeStepped(rec.to, cells)) {
      // The cells differ by more than a step this page watched, so this record
      // does not describe the mover: a new game, or a mover that arrived. Nothing
      // may travel through it, so the record seats at what the rules hold (task 1.3,
      // design D1: a bend is drawn along the body's own path, never a chord).
      rec.from = cells;
      rec.to = cells;
      rec.movedTick = game.play.tick;
      return rec;
    }
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
  // a frame ago, within the one column a shift and the fraction of a fall a frame
  // can carry. A shape that reads different is answered for both as it stands and
  // as it came from a quarter turn about the centre of its box, within the two
  // columns and two rows an SRS kick can carry, so a turn keeps the piece's record
  // rather than restarting it (task 2.1, design D4). A shape that is no quarter
  // turn is a bitten cell or a new piece: the record drops its sweep instead.
  observePieces(pieces) {
    const prev = motion.pieceRecs;
    const next = [];
    const taken = prev.map(() => false);
    const frameRecords = new Map();
    for (const p of pieces) {
      const size = PIECE_BOX[p.type];
      const key = motion.shapeKey(p.shape);
      let rec = null;
      let bestGap = Infinity;
      let bestCw = null;
      for (let i = 0; i < prev.length; i = i + 1) {
        const other = prev[i];
        if (other.type !== p.type || taken[i]) continue;
        const dCol = Math.abs(other.colSeen - p.col);
        const dRow = Math.abs(other.row - p.row);
        const same = other.key === key;
        const cw = same ? null : turnBetween(other.shape, size, key);
        if (!same && cw === null) continue;
        const wide = cw === null ? 1 : 2;
        const tall = cw === null ? 2.5 : 2;
        if (dCol > wide || dRow > tall) continue;
        const gap = dCol + dRow;
        if (gap < bestGap) { rec = other; bestGap = gap; bestCw = cw; taken[i] = true; }
      }
      if (!rec) {
        next.push({ type: p.type, colSeen: p.col, prevCol: p.col, colTick: game.play.tick, row: p.row, shape: p.shape.slice(), key, cw: null, turnTick: -1, beforeRow: p.row, beforeCol: p.col, beforeShape: null });
        frameRecords.set(p, next[next.length - 1]);
        continue;
      }
      // Where this frame already draws the piece, before anything about it
      // changes: the seam a turn shares with the fall and shift drawings (task 2.3).
      const drawnCol = motion.step(rec.prevCol, p.col, motion.phaseSince(rec.colTick, SHIFT_TRAVEL_TICKS));
      if (rec.colSeen !== p.col) { rec.prevCol = rec.colSeen; rec.colTick = game.play.tick; }
      if (rec.key !== key) {
        if (bestCw !== null) {
          // The turn this page watched this piece take, and the state it was drawn
          // in when the turn started (task 2.1, design D4).
          rec.beforeRow = rec.row;
          rec.beforeCol = drawnCol;
          rec.beforeShape = rec.shape;
          rec.cw = bestCw;
          rec.turnTick = game.play.tick;
        } else {
          // A shape this quarter turn does not explain: a bitten cell, or a mover
          // that arrived, so nothing may sweep through it.
          rec.cw = null;
          rec.turnTick = -1;
          rec.beforeShape = null;
        }
      }
      rec.colSeen = p.col;
      rec.row = p.row;
      rec.shape = p.shape.slice();
      rec.key = key;
      next.push(rec);
      frameRecords.set(p, rec);
    }
    motion.pieceRecs = next;
    motion.frameRecords = frameRecords;
  },
  // The column this page draws a piece at: the column it left at the point of
  // the slide it answered into (task 4.1, design D4). The slide runs a fixed
  // number of ticks, so mashing never stretches the travel.
  pieceCol(p) {
    const rec = motion.frameRecords.get(p);
    const phase = motion.phaseSince(rec ? rec.colTick : game.play.tick, SHIFT_TRAVEL_TICKS);
    return motion.step(rec ? rec.prevCol : p.col, p.col, phase);
  },
  // A position rounded once, in pixels, so the +1 inset and the cell - 2 size the
  // engine draws stay integers while the position still moves (the archived design
  // D7, kept for the swept cells of task 2.2).
  snap(value) {
    return Math.round(value * CELL) / CELL;
  },
  // The turn this page draws a piece through, or nothing at all when the piece is
  // not mid-turn: the phase of design D3/D5 (task 2.2) read off the same shipped
  // tick every other mover reads its phase off, over ROTATION_TRAVEL_TICKS, plus
  // the cells the piece stood on when the turn started and which way it turned.
  rotation(p) {
    const rec = motion.frameRecords.get(p);
    if (!rec || rec.cw === null || rec.beforeShape === null) return null;
    let phase = (game.play.tick - rec.turnTick) / ROTATION_TRAVEL_TICKS;
    if (phase < 0) {
      phase = 0;
    }
    if (phase >= 1) return null;
    // The centre the piece is drawn about when the turn starts, so the sweep and
    // the fall/shift drawing agree at both ends of the window (task 2.3, design
    // D5): a piece is drawn at the row above the one the rules hold plus the
    // fraction it has crossed, and this row and column are that already.
    return { phase, cw: rec.cw, shape: rec.beforeShape, row: rec.beforeRow - 1, col: rec.beforeCol };
  },
  phaseSince(movedTick, intervalTicks) {
    if (!intervalTicks) return 0;
    const phase = (game.play.tick - movedTick) / intervalTicks;
    return phase < 0 ? 0 : phase > 1 ? 1 : phase;
  },
  // The frame the snake's body grew by one is the only frame that may spawn a
  // growth segment (task 1.2, design D8): body length only changes when it grows,
  // so a rise from prevSnakeLen is the bite. Guarded to PLAYING so a paused or
  // finished screen spawns nothing, and past the length cap so overflow spawns
  // nothing; duration scales with the length so a longer snake flies a touch
  // longer. Done once a frame off game.play.tick, so a segment already in flight
  // keeps its fixed duration even if the snake keeps growing.
  noteSnakeLength() {
    const len = game.play.snake.length;
    if (this.prevSnakeLen < 0) { this.prevSnakeLen = len; return; }
    if (game.screen.state !== PLAYING) { this.prevSnakeLen = len; return; }
    if (len > this.prevSnakeLen && len <= MAX_SNAKE_LEN) {
      const duration = Math.max(1, Math.round(SNAKE_EAT_FLOAT_SPEED * len));
      this.floats.push({ spawnTick: game.play.tick, duration });
    }
    this.prevSnakeLen = len;
    // Drop segments that have finished flying and faded (task 1.2).
    this.floats = this.floats.filter(
      (f) => f.spawnTick + f.duration + FLOAT_FADE_TICKS > game.play.tick,
    );
  },
  // The cell a growth segment holds at a frame: it starts at the head (phase 0)
  // and travels to the tail (phase 1) along the body's own polyline, so it always
  // reaches the tail as the tail moves. null once it has arrived.
  floatPos(snake, spawnTick, duration, tick) {
    const phase = (tick - spawnTick) / duration;
    if (phase <= 0) return { r: snake[0].r, c: snake[0].c };
    if (phase >= 1) return null;
    const last = snake.length - 1;
    if (last <= 0) return { r: snake[0].r, c: snake[0].c };
    const d = phase * last;
    let k = Math.floor(d);
    if (k > last - 1) k = last - 1;
    const u = d - k;
    const a = snake[k];
    const b = snake[k + 1];
    if (Math.abs(b.r - a.r) === ROWS - 1 || Math.abs(b.c - a.c) === COLS - 1) {
      // A segment crossing a wrap edge is drawn at the near cell so it does not
      // smear across the field (task 1.2).
      return a;
    }
    return { r: a.r + (b.r - a.r) * u, c: a.c + (b.c - a.c) * u };
  },
  // One cell coordinate at the point of a hop: travel runs in pixels and is
  // rounded once, so the +1 inset and the cell - 2 size the engine draws stay
  // integers while the position still moves about one pixel a tick (design D7).
  step(from, to, phase) {
    const p = phase < 0 ? 0 : phase > 1 ? 1 : phase;
    return Math.round(from * CELL + (to - from) * CELL * p) / CELL;
  },
  // A leg of a mover's polyline at the point through: the cells to hand drawCell.
  // A leg between neighbours is one cell walked from the cell it left to the one it
  // entered; a leg of zero length is a segment that stayed put; a leg that went
  // round the board is drawn at both edges so the canvas clip cuts each end and
  // nothing smears across the field, its direction read by the modular short-way
  // (the archived design D6, kept by task 1.2). A turn is no longer a hop whose
  // ends differ on both axes, so the last line is a leg a body's polyline cannot
  // make: it seats so a mismatched record cannot crash the drawing (task 1.3).
  travelCells(from, to, phase) {
    const dr = to.r - from.r;
    const dc = to.c - from.c;
    if (dr === 0 && dc === 0) {
      return [{ r: from.r, c: from.c }];
    }
    if (Math.abs(dr) + Math.abs(dc) === 1) {
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
      motion.floats = [];
      motion.prevSnakeLen = -1;
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

// The quarter turn a shape takes about the centre of the box its type names, as
// text, so a frame that rebuilt the shape array still answers for the shape it
// carries. This mirrors the map the rules turn shapes by, turnOffset at
// js/pieces.js:110 (task 2.1, design D4: the matcher compares the turned shape
// so a rotation keeps the piece's record rather than restarting it).
function turnedKey(shape, size, cw) {
  return shape.map(([dr, dc]) => (cw ? dc : size - 1 - dc) + ',' + (cw ? size - 1 - dr : dr)).join(';');
}
function turnBetween(shape, size, key) {
  if (turnedKey(shape, size, true) === key) return true;
  if (turnedKey(shape, size, false) === key) return false;
  return null;
}
// The step this page may draw: the body shifted one place back along itself, with
// or without a new tail where it grew, and a head one cell from where it was - whole
// cells, or wrapped round an edge. Anything else is not a step the page watched, so
// no drawing may travel through it (task 1.3: a turn is drawn along the body's own
// path, and a change it cannot see the middle of is seated).
function snakeStepped(from, to) {
  if (!from.length || to.length < from.length || to.length > from.length + 1) return false;
  for (let i = 1; i < to.length; i = i + 1) {
    if (to[i].r !== from[i - 1].r || to[i].c !== from[i - 1].c) return false;
  }
  const dr = to[0].r - from[0].r;
  const dc = to[0].c - from[0].c;
  return Math.abs(dr) + Math.abs(dc) === 1 || Math.abs(dr) === ROWS - 1 || Math.abs(dc) === COLS - 1;
}
// The drawn body of a snake as a chain of squares CELL apart along the polyline
// of the body's own travel: the cells it holds now, extended by the cell its tail
// left. Arclength along that polyline never shortcuts, so a bend is drawn at the
// corner cell the rules bend at rather than as a chord across the turn (task 1.1,
// design D1; on a straight run this resolves to the same positions the per-slot
// lerp of the archived change produced).
function snakeChain(from, to, phase) {
  const drawn = [];
  if (!to.length) return drawn;
  const last = to.length - 1;
  const back = from && from.length === to.length ? from[last] : to[last];
  const path = to.concat([back]);
  for (let i = 0; i <= last; i += 1) {
    const dr = path[i + 1].r - path[i].r;
    const dc = path[i + 1].c - path[i].c;
    const step = dr === 0 && dc === 0;
    const walk = Math.abs(dr) + Math.abs(dc) === 1;
    const wrap = Math.abs(dr) === ROWS - 1 || Math.abs(dc) === COLS - 1;
    if (!(step || walk || wrap)) {
      // A leg that is neither a step the page watched nor a wrap is a record that
      // does not describe this body, so nothing here may travel: the caller draws
      // the cells the rules hold (task 1.3).
      return null;
    }
  }
  for (let i = 0; i < to.length; i += 1) {
    const d = i + 1 - phase;
    const k = Math.min(Math.floor(d), last);
    const u = d - k;
    drawn.push(motion.travelCells(path[k], path[k + 1], u < 0 ? 0 : u > 1 ? 1 : u));
  }
  return drawn;
}

// A growth segment drawn as a light energy core over the cell it holds: a white
// inset so it is invisible to the edible-piece and snake-ink filters (task 1.2,
// design D8: a flourish the integrity sweep never counts as a piece cell).
function drawFloatCell(r, c) {
  const inset = CELL * 0.2;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(
    c * CELL + 1 + inset,
    r * CELL + 1 + inset,
    CELL - 2 - 2 * inset,
    CELL - 2 - 2 * inset,
  );
}

// The growth segments this page is mid-flight on, drawn as light cores over the
// body they travel (task 1.2, design D8). Each starts at the head and reaches the
// tail by its duration; a segment that has just arrived fades over the tail
// (FLOAT_FADE_TICKS) before it is pruned.
function drawSnakeFloats() {
  const snake = game.play.snake;
  if (motion.floats.length === 0) return;
  const now = game.play.tick;
  for (let i = 0; i < motion.floats.length; i++) {
    const f = motion.floats[i];
    const cell = motion.floatPos(snake, f.spawnTick, f.duration, now);
    if (cell === null) {
      // The segment has arrived this frame: fade it over the tail (task 1.2).
      const fadePhase = (now - f.spawnTick - f.duration) / FLOAT_FADE_TICKS;
      if (fadePhase < 1) {
        const alpha = 0.9 * (1 - fadePhase);
        const tail = snake[snake.length - 1];
        const inset = CELL * 0.2;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fillRect(
          tail.c * CELL + 1 + inset,
          tail.r * CELL + 1 + inset,
          CELL - 2 - 2 * inset,
          CELL - 2 - 2 * inset,
        );
      }
      continue;
    }
    drawFloatCell(cell.r, cell.c);
  }
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

// The body painter: a chain of squares CELL apart along the polyline of the body's
// own travel (task 1.1), head colour first, then the tier colour the current
// overflow reaches at that index. A snake that has not stepped, or whose step's
// interval has run out, is drawn at the cells the rules hold.
function paintSnake(pctx) {
  const snake = game.play.snake;
  const rec = pctx.motion.snakeRec;
  const moving = rec && rec.intervalTicks && !sameCells(rec.from, snake);
  const phase = moving ? pctx.motion.phaseSince(rec.movedTick, rec.intervalTicks) : 1;
  const chain = moving ? snakeChain(rec.from, snake, phase) : null;
  for (let i = 0; i < snake.length; i++) {
    ctx.fillStyle = bodyColor(i);
    const cells = chain ? chain[i] : [snake[i]];
    for (const cell of cells) {
      field.drawCell(cell.r, cell.c);
    }
  }
  // The growth segments this game has spawned, drawn as light cores over the
  // body they travel (task 1.2, design D8).
  drawSnakeFloats();
}

// The engine per-frame canvas pass: every registered painter, in draw order.
export function render() {
  motion.prune();
  // A frame whose body grew by one is the only frame that may spawn a segment
  // (task 1.2, design D8); done once a frame off game.play.tick, so a segment's
  // flight is fixed-timestep and never outlives its duration.
  motion.noteSnakeLength();
  // The page observes its movers once a frame, before any painter reads, so a
  // painter never has to know whether a move already happened.
  motion.observeSnake(game.play.snake.map((seg) => ({ r: seg.r, c: seg.c })));
  motion.observePieces(game.play.pieces);
  paintCanvas(paintCtx);
}

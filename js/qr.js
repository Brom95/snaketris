// qr.js — the pairing step's scannable code. A QR matrix is a presentation of
// page content, so the encoder lives game-side beside the painters, not in the
// engine. Byte mode only, error-correction level L only: the payload is ASCII
// link text and the step never needs the stronger levels.
import { COLORS } from './copy.js';

// Level-L block structure per version, index = version - 1:
// [EC codewords per block, blocks in group 1, data codewords per group-1 block,
// blocks in group 2, data codewords per group-2 block].
export const QR_BLOCKS_L = [
  [7, 1, 19, 0, 0], [10, 1, 34, 0, 0], [15, 1, 55, 0, 0], [20, 1, 80, 0, 0],
  [26, 1, 108, 0, 0], [18, 2, 68, 0, 0], [20, 2, 78, 0, 0], [24, 2, 97, 0, 0],
  [30, 2, 116, 0, 0], [18, 2, 68, 2, 69], [20, 4, 81, 0, 0], [24, 2, 92, 2, 93],
  [26, 4, 107, 0, 0], [30, 3, 115, 1, 116], [22, 5, 87, 1, 88], [24, 5, 98, 1, 99],
  [28, 1, 107, 5, 108], [30, 5, 120, 1, 121], [28, 3, 113, 4, 114], [28, 3, 107, 5, 108],
  [28, 4, 116, 4, 117], [28, 2, 111, 7, 112], [30, 4, 121, 5, 122], [30, 6, 117, 4, 118],
  [26, 8, 106, 4, 107], [28, 10, 114, 2, 115], [30, 8, 122, 4, 123], [30, 3, 117, 10, 118],
  [30, 7, 116, 7, 117], [30, 5, 115, 10, 116], [30, 13, 115, 3, 116], [30, 17, 115, 0, 0],
  [30, 17, 115, 1, 116], [30, 13, 115, 6, 116], [30, 12, 121, 7, 122], [30, 6, 121, 14, 122],
  [30, 17, 122, 4, 123], [30, 4, 122, 18, 123], [30, 20, 117, 4, 118], [30, 19, 118, 6, 119],
];

export function qrDataCodewords(version) {
  const [, g1, d1, g2, d2] = QR_BLOCKS_L[version - 1];
  return g1 * d1 + g2 * d2;
}

export function qrEcCodewords(version) {
  const [ec, g1, , g2] = QR_BLOCKS_L[version - 1];
  return ec * (g1 + g2);
}

export function qrTotalCodewords(version) {
  return qrDataCodewords(version) + qrEcCodewords(version);
}

export function qrSize(version) {
  return version * 4 + 17;
}

// Byte mode costs a 4-bit mode prefix and a length field of 8 bits below
// version 10 and 16 bits from version 10 up.
export function qrByteCapacity(version) {
  const bits = 8 * qrDataCodewords(version) - 4 - (version < 10 ? 8 : 16);
  return (bits - (bits % 8)) / 8;
}

export function qrVersionFor(byteLength) {
  for (let version = 1; version <= QR_BLOCKS_L.length; version++) {
    if (qrByteCapacity(version) >= byteLength) return version;
  }
  return -1;
}

// Alignment centres follow the published rule: the count and the step both come
// from the version, and the first centre is always the row/column 6 line.
export function qrAlignmentPositions(version) {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step = Math.floor((version * 8 + count * 3 + 5) / (count * 4 - 4)) * 2;
  const positions = new Array(count);
  positions[0] = 6;
  for (let i = count - 1, pos = version * 4 + 10; i >= 1; i--, pos -= step) positions[i] = pos;
  return positions;
}

// The reserved-module grid for a version: fn marks every module a symbol
// function owns (finder, separator, timing, alignment, format, version areas);
// base holds that symbol's function modules already painted, so the codeword
// scan only ever writes into the free modules.
export function qrFunctionGrid(version) {
  const size = qrSize(version);
  const fn = new Uint8Array(size * size);
  const mark = (r, c) => {
    if (r >= 0 && r < size && c >= 0 && c < size) fn[r * size + c] = 1;
  };
  for (let i = 0; i < size; i++) {
    mark(6, i);
    mark(i, 6);
  }
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) mark(r, c);
  }
  for (let r = 0; r < 9; r++) {
    for (let c = size - 8; c < size; c++) mark(r, c);
  }
  for (let r = size - 8; r < size; r++) {
    for (let c = 0; c < 9; c++) mark(r, c);
  }
  const centres = qrAlignmentPositions(version);
  const last = centres.length - 1;
  for (let i = 0; i <= last; i++) {
    for (let j = 0; j <= last; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) continue;
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) mark(centres[j] + dr, centres[i] + dc);
    }
  }
  if (version >= 7) {
    for (let r = 0; r < 6; r++) for (let c = size - 11; c <= size - 9; c++) mark(r, c);
    for (let r = size - 11; r <= size - 9; r++) for (let c = 0; c < 6; c++) mark(r, c);
  }

  const base = Uint8Array.from(fn);
  for (let i = 7; i < size - 7; i += 2) {
    base[6 * size + i] = 0;
    base[i * size + 6] = 0;
  }
  for (const [cr, cc] of [[3, 3], [3, size - 4], [size - 4, 3]]) {
    for (let dr = -4; dr <= 4; dr++) {
      for (let dc = -4; dc <= 4; dc++) {
        const dist = Math.max(Math.abs(dr), Math.abs(dc));
        if (dist !== 2 && dist !== 4) continue;
        const r = cr + dr;
        const c = cc + dc;
        if (r < 0 || r >= size || c < 0 || c >= size) continue;
        base[r * size + c] = 0;
      }
    }
  }
  for (let i = 0; i <= last; i++) {
    for (let j = 0; j <= last; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) continue;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          base[(centres[j] + dr) * size + (centres[i] + dc)] = dr === 0 && dc === 0 ? 1 : 0;
        }
      }
    }
  }
  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >> 11) * 0x1f25);
    let bits = (version << 12) | rem;
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 3; c++) {
        const bit = (bits & 1) !== 0 ? 1 : 0;
        bits >>= 1;
        base[r * size + (size - 11 + c)] = bit;
        base[(size - 11 + c) * size + r] = bit;
      }
    }
  }
  return { size, fn, base };
}

export function qrFreeModules(version) {
  const { fn } = qrFunctionGrid(version);
  let free = 0;
  for (const reserved of fn) free += reserved ? 0 : 1;
  return free;
}

function gfMultiply(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >> 7) * 0x11d);
    z ^= ((y >> i) & 1) * x;
    z &= 0xff;
  }
  return z;
}

function ecGenerator(degree) {
  const gen = new Uint8Array(degree);
  gen[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      gen[j] = gfMultiply(gen[j], root);
      if (j + 1 < degree) gen[j] ^= gen[j + 1];
    }
    root = gfMultiply(root, 2);
  }
  return gen;
}

function ecRemainder(data, gen) {
  const out = new Uint8Array(gen.length);
  for (const byte of data) {
    const factor = byte ^ out[0];
    out.copyWithin(0, 1);
    out[out.length - 1] = 0;
    for (let j = 0; j < out.length; j++) out[j] ^= gfMultiply(gen[j], factor);
  }
  return out;
}

// The published block layout, as data blocks and one EC block per data block.
export function qrCodewords(bytes, version) {
  const [ec, g1, d1, g2, d2] = QR_BLOCKS_L[version - 1];
  const bits = [];
  const push = (value, width) => {
    for (let i = width - 1; i >= 0; i--) bits.push((value >> i) & 1);
  };
  push(4, 4);
  push(bytes.length, version < 10 ? 8 : 16);
  for (const byte of bytes) push(byte, 8);
  const capacityBits = 8 * qrDataCodewords(version);
  push(0, Math.min(4, capacityBits - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);
  for (let pad = 0; bits.length < capacityBits; pad++) {
    const byte = pad % 2 === 0 ? 0xec : 0x11;
    for (let i = 7; i >= 0; i--) bits.push((byte >> i) & 1);
  }
  const data = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    data.push(byte);
  }
  const blocks = [];
  let at = 0;
  for (let b = 0; b < g1; b++) blocks.push(data.slice(at, at + d1)), at += d1;
  for (let b = 0; b < g2; b++) blocks.push(data.slice(at, at + d2)), at += d2;
  const gen = ecGenerator(ec);
  const ecBlocks = blocks.map((block) => ecRemainder(block, gen));

  const codewords = [];
  const widest = blocks.reduce((max, block) => Math.max(max, block.length), 0);
  for (let i = 0; i < widest; i++) {
    for (const block of blocks) if (i < block.length) codewords.push(block[i]);
  }
  for (let i = 0; i < ec; i++) for (const block of ecBlocks) codewords.push(block[i]);
  return codewords;
}

const MASK_INVERT = [
  (x, y) => (x + y) % 2 === 0,
  (x, y) => y % 2 === 0,
  (x, y) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => ((((x + y) % 2) + ((x * y) % 3)) % 2) === 0,
];

function placeCodewords(grid, fn, size, codewords) {
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        const upward = ((right + 1) & 2) === 0;
        const r = upward ? size - 1 - vert : vert;
        if (fn[r * size + c] === 0 && i < codewords.length * 8) {
          const byte = codewords[i >> 3];
          grid[r * size + c] = (byte >> (7 - (i & 7))) & 1;
          i++;
        }
      }
    }
  }
  return grid;
}

function applyMask(grid, fn, size, mask) {
  const invert = MASK_INVERT[mask];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (fn[r * size + c] === 0 && invert(c, r)) grid[r * size + c] ^= 1;
    }
  }
}

// The 15 format bits for level L and one mask: a 4-bit nibble (level + mask)
// guarded by a 10-bit BCH remainder over 0x537, then XORed with 0x5412.
export function qrFormatBits(mask) {
  let data = (1 << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412;
  const out = [];
  for (let i = 0; i < 15; i++) out.push((bits >> (14 - i)) & 1);
  return out;
}

// Both copies of the format bits, plus the always-dark module beside the
// bottom-left finder. qrFormatBits is MSB-first; the reference draws with
// getBit(bits, i), which counts from the least significant bit, so at(i)
// indexes from the far end.
function drawFormatBits(grid, size, mask) {
  const bits = qrFormatBits(mask);
  const at = (i) => bits[14 - i];
  for (let i = 0; i <= 5; i++) grid[i * size + 8] = at(i);
  grid[7 * size + 8] = at(6);
  grid[8 * size + 8] = at(7);
  grid[8 * size + 7] = at(8);
  for (let i = 9; i < 15; i++) grid[8 * size + (14 - i)] = at(i);
  for (let i = 0; i < 8; i++) grid[8 * size + (size - 1 - i)] = at(i);
  for (let i = 8; i < 15; i++) grid[(size - 15 + i) * size + 8] = at(i);
  grid[(size - 8) * size + 8] = 1;
}

// The mask-choice score. A finder-like pattern is recognised from the last
// seven run lengths of a line, so each line keeps a run history; the light
// border outside the board counts as an extra run, which is why the history
// helpers add the line length to a run that touches an edge.
function penaltyScore(grid, size) {
  let score = 0;
  const addHistory = (run, hist) => {
    let value = run;
    if (hist[0] === 0) value += size;
    hist[6] = hist[5];
    hist[5] = hist[4];
    hist[4] = hist[3];
    hist[3] = hist[2];
    hist[2] = hist[1];
    hist[1] = hist[0];
    hist[0] = value;
  };
  const countPatterns = (hist) => {
    const n = hist[1];
    const core = n > 0 && hist[2] === n && hist[3] === n * 3 && hist[4] === n && hist[5] === n;
    const forward = core && hist[0] >= n * 4 && hist[6] >= n;
    const backward = core && hist[6] >= n * 4 && hist[0] >= n;
    return (forward ? 1 : 0) + (backward ? 1 : 0);
  };
  for (const line of [0, 1]) {
    for (let a = 0; a < size; a++) {
      const at = (b) => (line === 0 ? grid[a * size + b] : grid[b * size + a]);
      const hist = [0, 0, 0, 0, 0, 0, 0];
      let runColor = 0;
      let run = 0;
      for (let b = 0; b < size; b++) {
        const v = at(b);
        if (v === runColor) {
          run++;
          if (run === 5) score += 3;
          else if (run > 5) score++;
          continue;
        }
        addHistory(run, hist);
        if (runColor === 0) score += countPatterns(hist) * 40;
        runColor = v;
        run = 1;
      }
      if (runColor === 1) {
        addHistory(run, hist);
        run = 0;
      }
      addHistory(run + size, hist);
      score += countPatterns(hist) * 40;
    }
  }
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = grid[r * size + c];
      if (grid[r * size + c + 1] === v && grid[(r + 1) * size + c] === v && grid[(r + 1) * size + c + 1] === v) score += 3;
    }
  }
  let dark = 0;
  for (const v of grid) dark += v;
  const total = size * size;
  const k = Math.floor((Math.abs(dark * 20 - total * 10) + total - 1) / total) - 1;
  return score + k * 10;
}

// The one encode entry: the smallest version that holds the text, the eight
// masks scored, the best mask kept. The matrix is row-major, true = dark.
export function qrEncode(text) {
  const bytes = new TextEncoder().encode(text);
  const version = qrVersionFor(bytes.length);
  if (version === -1) throw new RangeError('qr payload does not fit version 40');
  const { size, fn, base } = qrFunctionGrid(version);
  const codewords = qrCodewords(bytes, version);
  let best = null;
  let bestPenalty = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const grid = placeCodewords(Uint8Array.from(base), fn, size, codewords);
    applyMask(grid, fn, size, mask);
    drawFormatBits(grid, size, mask);
    const penalty = penaltyScore(grid, size);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      best = grid;
    }
  }
  const modules = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) row.push(best[r * size + c] === 1);
    modules.push(row);
  }
  return { version, size, modules };
}

// Paint one matrix into a canvas element, quiet zone included, so a scanner
// always sees a light border. Returns the matrix it painted.
export function paintQr(canvas, text, quiet = 2) {
  const qr = qrEncode(text);
  const span = qr.size + quiet * 2;
  const css = Math.min(canvas.clientWidth || 0, canvas.clientHeight || 0);
  const scale = Math.max(1, Math.floor((css || span * 4) / span));
  const side = span * scale;
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = COLORS.text;
  ctx.fillRect(0, 0, side, side);
  ctx.fillStyle = COLORS.bg;
  for (let r = 0; r < qr.size; r++) {
    for (let c = 0; c < qr.size; c++) {
      if (qr.modules[r][c]) ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
    }
  }
  return qr;
}

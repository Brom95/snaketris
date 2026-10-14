import test from 'node:test';
import assert from 'node:assert/strict';

// Published level-L format strings, index = mask. They pin the BCH arithmetic
// and the XOR constant independently of the rest of the encoder.
const LEVEL_L_FORMAT = [
  '111011111000100',
  '111001011110011',
  '111110110101010',
  '111100010011101',
  '110011000101111',
  '110001100011000',
  '110110001000001',
  '110100101110110',
];

const FINDER = [
  [1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1],
];

function moduleAt(matrix, r, c) {
  return matrix[r][c] ? 1 : 0;
}

test('the reserved geometry matches the version table at every version', async () => {
  const qr = await import('../js/qr.js');
  for (let version = 1; version <= qr.QR_BLOCKS_L.length; version++) {
    const free = qr.qrFreeModules(version);
    const expected = 8 * qr.qrTotalCodewords(version);
    assert.ok(free >= expected, `version ${version}: ${free} free modules, wants ${expected}`);
    assert.ok(free - expected <= 7, `version ${version}: ${free - expected} remainder bits, wants below 8`);
    assert.ok(qr.qrSize(version) === version * 4 + 17, `version ${version} size`);
    const data = qr.qrDataCodewords(version);
    const ec = qr.qrEcCodewords(version);
    assert.ok(data > 0 && ec > 0, `version ${version} block table`);
    assert.ok(data + ec === qr.qrTotalCodewords(version), `version ${version} totals`);
  }
});

test('the format bits match the published level-L table for every mask', async () => {
  const qr = await import('../js/qr.js');
  for (let mask = 0; mask < 8; mask++) {
    const bits = qr.qrFormatBits(mask);
    assert.strictEqual(bits.length, 15, `mask ${mask} width`);
    assert.strictEqual(bits.join(''), LEVEL_L_FORMAT[mask], `mask ${mask} format bits`);
  }
});

test('a known short string encodes at the smallest fitting version', async () => {
  const qr = await import('../js/qr.js');
  const text = 'snaketris-pair';
  const qr_ = qr.qrEncode(text);

  const version = qr.qrVersionFor(text.length);
  assert.ok(version >= 1, 'the string must fit a version');
  assert.strictEqual(qr_.version, version, `picks version ${version}`);
  assert.ok(qr.qrByteCapacity(version) >= text.length, 'the version must hold the string');
  if (version > 1) assert.ok(qr.qrByteCapacity(version - 1) < text.length, 'the version below must not');
  assert.strictEqual(qr_.size, qr.qrSize(version), 'matrix side matches the version table');
  assert.strictEqual(qr_.size, version * 4 + 17, 'matrix side matches the published formula');
  assert.strictEqual(qr_.modules.length, qr_.size, 'one row per module row');
  for (const row of qr_.modules) {
    assert.strictEqual(row.length, qr_.size, 'every row is as wide as the matrix');
    for (const cell of row) assert.strictEqual(typeof cell, 'boolean', 'every cell is a flag');
  }
});

test('the codeword stream is exactly one codeword per free module byte', async () => {
  const qr = await import('../js/qr.js');
  for (const version of [1, 2, 7, 13, 20, 40]) {
    const bytes = new Uint8Array(qr.qrByteCapacity(version));
    bytes.fill(0x41);
    const codewords = qr.qrCodewords(bytes, version);
    assert.strictEqual(
      codewords.length,
      qr.qrTotalCodewords(version),
      `version ${version}: ${codewords.length} codewords, wants ${qr.qrTotalCodewords(version)}`,
    );
    for (const byte of codewords) {
      assert.ok(Number.isInteger(byte) && byte >= 0 && byte <= 255, `version ${version} byte range`);
    }
  }
});

test('the painted matrix keeps every symbol function intact', async () => {
  const qr = await import('../js/qr.js');
  const qr_ = qr.qrEncode('snaketris-pair-7Q4KX');
  const size = qr_.size;
  const at = (r, c) => moduleAt(qr_.modules, r, c);

  const corners = [[0, 0], [0, size - 7], [size - 7, 0]];
  for (const [top, left] of corners) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        assert.strictEqual(at(top + r, left + c), FINDER[r][c], `finder module at row ${top + r}, column ${left + c}`);
      }
    }
  }
  for (let i = 0; i < 8; i++) {
    assert.strictEqual(at(7, i), 0, 'top-left separator row stays light');
    assert.strictEqual(at(i, 7), 0, 'top-left separator column stays light');
    assert.strictEqual(at(7, size - 1 - i), 0, 'top-right separator row stays light');
    assert.strictEqual(at(i, size - 8), 0, 'top-right separator column stays light');
    assert.strictEqual(at(size - 8, i), 0, 'bottom-left separator row stays light');
    assert.strictEqual(at(size - 1 - i, 7), 0, 'bottom-left separator column stays light');
  }
  for (let i = 8; i <= size - 9; i++) {
    assert.strictEqual(at(6, i), i % 2 === 0 ? 1 : 0, `horizontal timing at column ${i}`);
    assert.strictEqual(at(i, 6), i % 2 === 0 ? 1 : 0, `vertical timing at row ${i}`);
  }
  assert.strictEqual(at(size - 8, 8), 1, 'the always-dark module sits beside the bottom-left finder');

  const big = qr.qrEncode('x'.repeat(200));
  assert.ok(big.version >= 7, 'a 200-byte payload needs a version with version-bit areas');
  assert.strictEqual(big.size, big.version * 4 + 17, 'the big matrix side matches its version');
});

test('paintQr sizes a square buffer and paints one rectangle per dark module', async () => {
  const qr = await import('../js/qr.js');
  const rects = [];
  const fills = [];
  const stub = {
    clientWidth: 240,
    clientHeight: 240,
    width: 0,
    height: 0,
    getContext: (kind) => {
      assert.strictEqual(kind, '2d', 'the painter asks for a 2d context');
      const ctx = { fillStyle: '' };
      ctx.fillRect = (x, y, w, h) => {
        fills.push(ctx.fillStyle);
        rects.push([x, y, w, h]);
      };
      return ctx;
    },
  };

  const painted = qr.qrEncode('snaketris-pair');
  const returned = qr.paintQr(stub, 'snaketris-pair');
  assert.strictEqual(returned.version, painted.version, 'the painter reports the same version');
  assert.strictEqual(returned.size, painted.size, 'the painter reports the same size');
  assert.ok(Number.isInteger(stub.width) && stub.width === stub.height, 'the buffer is square');
  assert.ok(stub.width > painted.size, 'the buffer holds one pixel per module at minimum');

  let dark = 0;
  for (const row of painted.modules) for (const cell of row) dark += cell ? 1 : 0;
  assert.strictEqual(rects.length, dark + 1, 'one background rectangle plus one per dark module');
  const last = rects[rects.length - 1];
  assert.ok(last.every((value) => Number.isInteger(value)), 'every rectangle lands on whole pixels');
});

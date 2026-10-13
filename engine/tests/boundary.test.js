// engine/tests/boundary.test.js — the engine boundary gate.
// Every import line under engine/js/ must resolve to a file inside engine/,
// so the directory can move into its own repository at the same path without
// one import line changing.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const engineDir = fs.realpathSync(fileURLToPath(new URL('../js/', import.meta.url)));

function collect(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = join(dir, entry);
    if (fs.statSync(full).isDirectory()) out.push(...collect(full));
    else if (full.endsWith('.js')) out.push(full);
  }
  return out;
}

// Both the `... from 'path'` form and the bare side-effect `import 'path'` form.
const FROM_LINE = /(?:^|\n)\s*(?:import|export)\b[^;\n]*?\bfrom\s+['"]([^'"]+)['"]/g;
const BARE_LINE = /(?:^|\n)\s*import\s+['"]([^'"]+)['"]/g;

function importsOf(src) {
  const targets = [];
  for (const match of src.matchAll(FROM_LINE)) targets.push(match[1]);
  for (const match of src.matchAll(BARE_LINE)) targets.push(match[1]);
  return targets;
}

test('every engine import resolves inside engine/', async () => {
  const files = collect(engineDir);
  assert.ok(files.length > 0, 'no engine sources found');
  const offenders = [];
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    for (const target of importsOf(src)) {
      if (!target.startsWith('.')) {
        offenders.push(`${file} -> ${target} (absolute module specifier)`);
        continue;
      }
      let resolved;
      try {
        resolved = fs.realpathSync(join(dirname(file), target));
      } catch (err) {
        offenders.push(`${file} -> ${target} (does not resolve)`);
        continue;
      }
      if (!resolved.startsWith(engineDir + '/')) {
        offenders.push(`${file} -> ${resolved} (outside engine/)`);
      }
    }
  }
  assert.deepEqual(offenders, [], 'the engine reaches a file outside its own mount');
});

test('the mechanism leaves import nothing at all', async () => {
  for (const leaf of ['clock.js', 'registry.js', 'grid.js', 'state.js']) {
    const src = fs.readFileSync(join(engineDir, leaf), 'utf8');
    assert.deepEqual(importsOf(src), [], `${leaf} imports a module`);
  }
});

// The split rule: a symbol is engine-side only if it names no game noun. The
// two container names and the tick slot are the only state names the engine
// may write. Every other field belongs to the consumer.
test('no engine source names a consumer field', async () => {
  const nouns = [
    'snake', 'pieces', 'snakeScore', 'tetrisScore', 'landedBlocks', 'completedPieces',
    'overflow', 'dir', 'nextDir', 'snakeAcc', 'spawnAcc', 'pieceMoveAcc',
    'gameOverReason', 'role', 'result', 'durationMinutes', 'durationTicks',
    'menuSelect', 'roleSelect', 'durationSelect', 'controlSelect', 'recordsSelect',
    'p1Role', 'p2Role', 'twoPlayerMode', 'p1Selection', 'p2Selection',
    'p1Model', 'p2Model', 'p1Pad', 'p2Pad', 'controlError', 'controlConfirmed',
    'gameControlStep',
  ];
  const offenders = [];
  for (const file of collect(engineDir)) {
    const src = fs.readFileSync(file, 'utf8');
    for (const noun of nouns) {
      if (new RegExp(`\\b${noun}\\b`).test(src)) offenders.push(`${file} names ${noun}`);
    }
  }
  assert.deepEqual(offenders, [], 'the engine names a consumer field');
});

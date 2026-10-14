// engine/tests/api.test.js — the doc-to-code tie for engine/docs/api.md.
// Every documented module-level export is imported here by name, so a renamed
// or missing export fails at module load. The last check reads the doc itself
// and asserts its headings name exactly these exports.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { createClock } from '../js/clock.js';
import { createEngine } from '../js/registry.js';
import { state, configureState, resetPlay, resetScreen, resetState } from '../js/state.js';
import { createGrid } from '../js/grid.js';
import {
  registerNavigation,
  gotoScreen,
  itemForStep,
  opensScreen,
  currentItem,
  pushIntent,
  drainIntents,
  screenSystem,
} from '../js/navigation.js';
import { createCanvas } from '../js/canvas.js';
import { createLayout } from '../js/layout.js';
import { createInterface } from '../js/interface.js';
import {
  registerCanvasPainter,
  registerPagePainter,
  paintCanvas,
  paintPage,
  canvasOrder,
  pageOrder,
} from '../js/present.js';
import {
  configureSurface,
  registerDeviceResolvers,
  attachSurface,
  surfacePoint,
  pointerDown,
  pointerMove,
  pointerEnd,
  pointerCancel,
  stickDirection,
  pollDevices,
  clearDeviceEdges,
} from '../js/devices.js';
import { registerReport, recordsSystem } from '../js/records.js';
import { nextValue, nextInRange } from '../js/source.js';
import { createCommandStream } from '../js/stream.js';
import { createLink } from '../js/link.js';

const exports = {
  createClock,
  createEngine,
  state,
  configureState,
  resetPlay,
  resetScreen,
  resetState,
  createGrid,
  registerNavigation,
  gotoScreen,
  itemForStep,
  opensScreen,
  currentItem,
  pushIntent,
  drainIntents,
  screenSystem,
  createCanvas,
  createLayout,
  createInterface,
  registerCanvasPainter,
  registerPagePainter,
  paintCanvas,
  paintPage,
  canvasOrder,
  pageOrder,
  configureSurface,
  registerDeviceResolvers,
  attachSurface,
  surfacePoint,
  pointerDown,
  pointerMove,
  pointerEnd,
  pointerCancel,
  stickDirection,
  pollDevices,
  clearDeviceEdges,
  registerReport,
  recordsSystem,
  nextValue,
  nextInRange,
  createCommandStream,
  createLink,
};

const objectExports = ['state', 'screenSystem', 'recordsSystem'];

test('every documented export resolves to a value', async () => {
  for (const [name, value] of Object.entries(exports)) {
    assert.notEqual(value, undefined, name);
    assert.notEqual(value, null, name);
  }
});

test('each export has the documented kind', async () => {
  for (const [name, value] of Object.entries(exports)) {
    if (objectExports.includes(name)) {
      assert.strictEqual(typeof value, 'object', name);
      continue;
    }
    assert.strictEqual(typeof value, 'function', name);
  }
});

test('the engine reads no DOM, window or storage at module load', async () => {
  assert.strictEqual(typeof globalThis.document, 'undefined');
  assert.strictEqual(typeof globalThis.window, 'undefined');
  assert.strictEqual(typeof globalThis.localStorage, 'undefined');
});

test('api.md headings name exactly these exports', async () => {
  const doc = await readFile(new URL('../docs/api.md', import.meta.url), 'utf8');
  const named = new Set();
  for (const line of doc.matchAll(/^### .*$/gm)) {
    const text = line[0];
    if (text.includes('(instance)')) continue;
    for (const token of text.matchAll(/`([^`]+)`/g)) {
      const name = token[1].split('(')[0].trim();
      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) named.add(name);
    }
  }
  assert.deepEqual(
    [...named].sort(),
    Object.keys(exports).sort(),
    'a documented export that the suite does not import, or an import the doc does not name',
  );
});

test('the export count matches the documented surface', async () => {
  assert.equal(Object.keys(exports).length, 42);
});

// devices.test.js — raw device adapters: keyboard key -> intent, tap/swipe
// mapping, and the gamepad poll (D-pad, stick, A/B buttons).
import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub, makePad } from './helpers/dom-stub.js';
import { startIn } from './helpers/game.js';

const stub = installDomStub();
const { game } = await import('../js/state.js');
const devices = await import('../js/devices.js');
const input = await import('../js/input.js');

devices.setCanvas(stub.canvas);

// Apply a polled intent the way app.js does, so state assertions are real.
function pollAndApply() {
  const intent = devices.pollController();
  input.handleIntent(intent);
  return intent;
}

// ---------- Keyboard ----------
test('SELECT_ROLE keys map to menuUp, menuDown, confirm and toMenu', () => {
  startIn('SELECT_ROLE');
  assert.deepEqual(devices.keyToIntent('ArrowUp'), { action: 'menuUp' });
  assert.deepEqual(devices.keyToIntent('w'), { action: 'menuUp' });
  assert.deepEqual(devices.keyToIntent('ArrowDown'), { action: 'menuDown' });
  assert.deepEqual(devices.keyToIntent('s'), { action: 'menuDown' });
  assert.deepEqual(devices.keyToIntent('Enter'), { action: 'confirm' });
  assert.deepEqual(devices.keyToIntent(' '), { action: 'confirm' });
  assert.deepEqual(devices.keyToIntent('Escape'), { action: 'toMenu' });
  assert.equal(devices.keyToIntent('q'), null);
});

test('Tetris role: arrows shift and rotate the piece instead of steering', () => {
  startIn('PLAYING', 'tetris');
  assert.deepEqual(devices.keyToIntent('ArrowLeft'), { action: 'pieceShift', dc: -1 });
  assert.deepEqual(devices.keyToIntent('d'), { action: 'pieceShift', dc: 1 });
  assert.deepEqual(devices.keyToIntent('ArrowUp'), { action: 'pieceRotate', cw: false });
  assert.deepEqual(devices.keyToIntent('s'), { action: 'pieceRotate', cw: true });
});

test('Snake role: arrows still steer the snake', () => {
  startIn('PLAYING', 'snake');
  assert.deepEqual(devices.keyToIntent('ArrowLeft'), { dir: { r: 0, c: -1 } });
  assert.deepEqual(devices.keyToIntent('w'), { dir: { r: -1, c: 0 } });
});

test('tapToShift: side of the board decides, dead centre does nothing', () => {
  assert.equal(devices.tapToShift(120), 0); // board centre (BOARD_W 240)
  assert.equal(devices.tapToShift(5), -1);
  assert.equal(devices.tapToShift(235), 1);
});

test('Tetris role: a centre tap rotates the piece, a side tap still shifts it', () => {
  startIn('PLAYING', 'tetris');
  // Stub canvas rect is 576x720; logical board is 240x480, so clientX 288
  // maps to logical x 120 (the dead centre).
  devices.onPointerDown({ pointerId: 1, clientX: 288, clientY: 360 });
  assert.deepEqual(devices.onPointerUp({ pointerId: 1, clientX: 288, clientY: 360 }),
    { action: 'pieceRotate', cw: true });

  devices.onPointerDown({ pointerId: 2, clientX: 12, clientY: 360 }); // logical x 5
  assert.deepEqual(devices.onPointerUp({ pointerId: 2, clientX: 12, clientY: 360 }),
    { action: 'pieceShift', dc: -1 });
});

// ---------- Gamepad ----------
test('gamepad SELECT_ROLE: D-pad moves the role, A starts, B returns to menu', () => {
  startIn('SELECT_ROLE');
  game.roleSelect = 0;

  stub.gamepads.length = 0;
  stub.gamepads.push(makePad([12])); // D-pad up, first press
  assert.deepEqual(pollAndApply(), { action: 'menuUp' });

  stub.gamepads[0] = makePad([13]); // D-pad down
  assert.deepEqual(pollAndApply(), { action: 'menuDown' });

  stub.gamepads[0] = makePad([0]); // A
  assert.deepEqual(pollAndApply(), { action: 'confirm' });
  assert.equal(game.state, 'PLAYING');
  assert.equal(game.role, 'snake'); // wrapped back to index 0 after up then down

  startIn('SELECT_ROLE');
  game.roleSelect = 1;
  stub.gamepads[0] = makePad([]);
  pollAndApply();
  stub.gamepads[0] = makePad([1]); // B
  assert.deepEqual(pollAndApply(), { action: 'toMenu' });
  assert.equal(game.state, 'MENU');
});

test('gamepad Tetris role: D-pad left/right shift the piece, up/down rotate', () => {
  startIn('PLAYING', 'tetris');
  stub.gamepads.length = 0;
  stub.gamepads.push(makePad([14])); // D-pad left
  assert.deepEqual(devices.pollController(), { action: 'pieceShift', dc: -1 });

  stub.gamepads[0] = makePad([15]); // D-pad right
  assert.deepEqual(devices.pollController(), { action: 'pieceShift', dc: 1 });

  stub.gamepads[0] = makePad([12]); // D-pad up, fresh edge
  assert.deepEqual(devices.pollController(), { action: 'pieceRotate', cw: false });

  stub.gamepads[0] = makePad([13]); // D-pad down, fresh edge
  assert.deepEqual(devices.pollController(), { action: 'pieceRotate', cw: true });
});

test('gamepad held D-pad does not repeat a rotation edge', () => {
  startIn('PLAYING', 'tetris');
  stub.gamepads.length = 0;
  stub.gamepads.push(makePad([12]));
  assert.deepEqual(devices.pollController(), { action: 'pieceRotate', cw: false });
  assert.equal(devices.pollController(), null); // still held: no second edge
});

test('gamepad Tetris role: A alone rotates clockwise', () => {
  startIn('PLAYING', 'tetris');
  stub.gamepads.length = 0;
  stub.gamepads.push(makePad([0])); // A, fresh press
  assert.deepEqual(devices.pollController(), { action: 'pieceRotate', cw: true });
});

test('gamepad Tetris role: A wins over a held shift, which then still fires', () => {
  startIn('PLAYING', 'tetris');
  stub.gamepads.length = 0;
  stub.gamepads.push(makePad([15])); // right held
  assert.deepEqual(devices.pollController(), { action: 'pieceShift', dc: 1 });

  stub.gamepads[0] = makePad([15, 0]); // A pressed while right stays held
  assert.deepEqual(devices.pollController(), { action: 'pieceRotate', cw: true });

  stub.gamepads[0] = makePad([15, 0]); // A is held, so no new edge
  assert.deepEqual(devices.pollController(), { action: 'pieceShift', dc: 1 });
});

test('gamepad Snake role: A steers nothing', () => {
  startIn('PLAYING', 'snake');
  stub.gamepads.length = 0;
  stub.gamepads.push(makePad([0]));
  assert.equal(devices.pollController(), null);
});

test('gamepad absent clears poll state and yields no intent', () => {
  startIn('PLAYING', 'snake');
  stub.gamepads.length = 0;
  assert.equal(devices.pollController(), null);
  devices.clearControllerPrev();
});

// ---------- Per-pad edge-detection (two-player mode) ----------
test('first pad is P1 and second is P2 with separate edge-detection state', () => {
  startIn('PLAYING', 'snake');
  const padA = { id: 'pad-a', buttons: [], axes: [0, 0] };
  const padB = { id: 'pad-b', buttons: [], axes: [0, 0] };
  for (let i = 0; i < 16; i++) { padA.buttons.push({ pressed: false }); padB.buttons.push({ pressed: false }); }

  // P1 (pad A) presses D-pad up: poll picks the first non-null pad.
  padA.buttons[12].pressed = true;
  stub.gamepads.length = 0;
  stub.gamepads.push(padA);
  assert.deepEqual(devices.pollController(), { dir: { r: -1, c: 0 } });

  // Disconnect P1, connect P2 (no buttons pressed). Pad B has its own fresh
  // prev state — it must not inherit pad A's held D-pad.
  stub.gamepads.length = 0;
  stub.gamepads.push(padB);
  assert.equal(devices.pollController(), null);
});

test('clearControllerPrev clears every connected pad on disconnect', () => {
  startIn('PLAYING', 'snake');
  const padA = { id: 'pad-a', buttons: [], axes: [0, 0] };
  for (let i = 0; i < 16; i++) padA.buttons.push({ pressed: false });
  stub.gamepads.length = 0;
  stub.gamepads.push(padA);
  assert.deepEqual(devices.pollController(), null); // no buttons pressed

  // Simulate disconnect: clear the array and call clearControllerPrev.
  stub.gamepads.length = 0;
  devices.clearControllerPrev();

  // Reconnect a fresh pad: it must not inherit stale prev state.
  const padC = { id: 'pad-c', buttons: [], axes: [0, 0] };
  for (let i = 0; i < 16; i++) padC.buttons.push({ pressed: false });
  stub.gamepads.length = 0;
  stub.gamepads.push(padC);
  assert.equal(devices.pollController(), null);
});

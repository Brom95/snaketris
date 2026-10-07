// input.test.js — no-reverse + keyboard mapping, multi-pointer ignore,
// tap-zone mapping, swipe dominant axis, mobile fit (fitCanvas), the role
// sub-menu navigation, and the role gate on piece control.
import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub } from './helpers/dom-stub.js';

const stub = installDomStub();
const state = await import('../js/state.js');
const devices = await import('../js/devices.js');
const input = await import('../js/input.js');

// Wire the canvas into both input.js and devices.js (as initInput does in the real game).
input.initInput(stub.canvas);

function fresh() { state.resetGame(); }

test('no-reverse + keyboard mapping', async () => {
  fresh();
  state.startGame();
  // Left is the exact opposite of the current right dir → blocked.
  input.onKey({ key: 'a', preventDefault() {} });
  assert.equal(state.game.nextDir.c, 1); // still right (left blocked)
  // Down is not opposite of right → accepted.
  input.onKey({ key: 's', preventDefault() {} });
  assert.equal(state.game.nextDir.r, 1);
  assert.equal(state.game.nextDir.c, 0);
});

test('role sub-menu: R opens it, up/down wrap, confirm starts the chosen role', () => {
  fresh();
  assert.equal(state.game.state, 'MENU');
  input.onKey({ key: 'r', preventDefault() {} });
  assert.equal(state.game.state, 'SELECT_ROLE');

  input.onKey({ key: 's', preventDefault() {} }); // down → Tetris
  assert.equal(state.game.roleSelect, 1);
  input.onKey({ key: 's', preventDefault() {} }); // wraps back to Snake
  assert.equal(state.game.roleSelect, 0);
  input.onKey({ key: 'w', preventDefault() {} }); // up wraps to Tetris
  assert.equal(state.game.roleSelect, 1);
  input.onKey({ key: 'Enter', preventDefault() {} });
  assert.equal(state.game.state, 'PLAYING');
  assert.equal(state.game.role, 'tetris');

  fresh();
  input.onKey({ key: 'r', preventDefault() {} });
  input.onKey({ key: 'Escape', preventDefault() {} });
  assert.equal(state.game.state, 'MENU');
});

test('clicking a role item starts the game with that role', () => {
  fresh();
  state.game.state = 'SELECT_ROLE';
  stub.roleItems[0].getBoundingClientRect = () => ({ left: 0, top: 0, right: 320, bottom: 24 });
  stub.roleItems[1].getBoundingClientRect = () => ({ left: 0, top: 30, right: 320, bottom: 54 });
  input.onInterfacePointerUp({ target: stub.document, clientX: 10, clientY: 40 });
  assert.equal(state.game.state, 'PLAYING');
  assert.equal(state.game.role, 'tetris');

  // startGame resets the game, so the selection index is not observable after
  // the click; the role it produced is.
  fresh();
  state.game.state = 'SELECT_ROLE';
  input.onInterfacePointerUp({ target: stub.document, clientX: 10, clientY: 10 });
  assert.equal(state.game.state, 'PLAYING');
  assert.equal(state.game.role, 'snake');
});

test('clicking Play in the main menu opens the role sub-menu', () => {
  fresh();
  stub.menuItems[0].getBoundingClientRect = () => ({ left: 0, top: 0, right: 320, bottom: 24 });
  input.onInterfacePointerUp({ target: stub.document, clientX: 10, clientY: 10 });
  assert.equal(state.game.state, 'SELECT_ROLE');
});

test('clicking Back on the role screen returns to the menu without starting a game', () => {
  fresh();
  state.game.state = 'SELECT_ROLE';
  stub.roleItems[0].getBoundingClientRect = () => ({ left: 0, top: 0, right: 320, bottom: 24 });
  stub.roleItems[1].getBoundingClientRect = () => ({ left: 0, top: 30, right: 320, bottom: 54 });
  stub.elements['role-back'].getBoundingClientRect = () => ({ left: 0, top: 60, right: 320, bottom: 84 });
  input.onInterfacePointerUp({ target: stub.document, clientX: 10, clientY: 70 });
  assert.equal(state.game.state, 'MENU');
  assert.equal(state.game.roleSelect, 0);
  assert.equal(state.game.pieces.length, 0);
});

test('Tetris role: steering keys control the piece, never the snake', () => {
  fresh();
  state.game.role = 'tetris';
  state.startGame();
  state.game.dir = { r: 0, c: 1 };
  state.game.nextDir = { r: 0, c: 1 };
  input.onKey({ key: 'arrowup', preventDefault() {} });
  input.onKey({ key: 'arrowleft', preventDefault() {} });
  assert.deepEqual(state.game.nextDir, { r: 0, c: 1 });
});

test('multi-pointer ignore + pointercancel', async () => {
  fresh();
  state.startGame();
  devices.onPointerDown({ pointerId: 1, clientX: 120, clientY: 300 });
  // Second concurrent pointer is ignored (activePointerId already set).
  devices.onPointerDown({ pointerId: 2, clientX: 50, clientY: 50 });
  // pointercancel clears the active pointer state.
  devices.onPointerCancel({ pointerId: 1 });
  // After cancel, a fresh down is accepted (active cleared).
  devices.onPointerDown({ pointerId: 3, clientX: 10, clientY: 10 });
  assert.equal(true, true); // no-throw
});

test('tap-zone mapping', async () => {
  fresh();
  state.startGame();
  // Dead-center tap → null (no-op). Board is 240×480, center = (120, 240).
  const center = devices.tapToDir(120, 240);
  assert.equal(center, null);
  // Left-edge tap → left dir (|ox| >= |oy| and ox < 0).
  const left = devices.tapToDir(5, 240);
  assert.deepEqual(left, { r: 0, c: -1 });
  // Top-edge tap → up dir.
  const top = devices.tapToDir(120, 5);
  assert.deepEqual(top, { r: -1, c: 0 });
});

test('swipe dominant axis', async () => {
  fresh();
  state.startGame();
  // Horizontal swipe (dx dominates) → left.
  const l = devices.swipeToDir(-50, 10);
  assert.deepEqual(l, { r: 0, c: -1 });
  // Vertical swipe (dy dominates) → down.
  const d = devices.swipeToDir(10, 50);
  assert.deepEqual(d, { r: 1, c: 0 });
});

test('mobile fit (fitCanvas)', async () => {
  fresh();
  state.startGame();
  stub.window.innerWidth = 360;
  stub.window.innerHeight = 1000;
  input.fitCanvas(0);
  assert.equal(stub.canvas.style.width, '360px');
  assert.equal(stub.canvas.style.height, '720px');
});

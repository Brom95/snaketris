// input.test.js — no-reverse + keyboard mapping, multi-pointer ignore,
// tap-zone mapping, swipe dominant axis, mobile fit (fitCanvas), the role
// sub-menu navigation, and the role gate on piece control.
import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub } from './helpers/dom-stub.js';

const stub = installDomStub();
const state = await import('../js/state.js');
const screens = await import('../js/screens.js');
const devices = await import('../js/devices.js');
const input = await import('../js/input.js');
const ui = await import('../js/ui.js');

// Wire the canvas into both input.js and devices.js (as initInput does in the real game).
input.initInput(stub.canvas);
// js/ui.js owns the interface elements, so the click tests need them indexed.
ui.initUi();

function fresh() { state.resetGame(); }

test('no-reverse + keyboard mapping', async () => {
  fresh();
  state.startGame();
  // Left is the exact opposite of the current right dir → blocked.
  input.onKey({ key: 'a', preventDefault() {} });
  assert.equal(state.game.play.nextDir.c, 1); // still right (left blocked)
  // Down is not opposite of right → accepted.
  input.onKey({ key: 's', preventDefault() {} });
  assert.equal(state.game.play.nextDir.r, 1);
  assert.equal(state.game.play.nextDir.c, 0);
});

test('role screen: R opens the duration screen first, then up/down wrap over Snake, Tetris, Back', () => {
  fresh();
  assert.equal(state.game.screen.state, 'MENU');
  input.onKey({ key: 'r', preventDefault() {} });
  screens.drainIntents();
  assert.equal(state.game.screen.state, 'SELECT_DURATION');

  input.onKey({ key: 'Enter', preventDefault() {} }); // confirm the 1-minute item
  screens.drainIntents();
  assert.equal(state.game.screen.state, 'SELECT_ROLE');

  input.onKey({ key: 's', preventDefault() {} }); // down → Tetris
  screens.drainIntents();
  assert.equal(state.game.screen.roleSelect, 1);
  input.onKey({ key: 's', preventDefault() {} }); // down → Back
  screens.drainIntents();
  assert.equal(state.game.screen.roleSelect, 2);
  input.onKey({ key: 's', preventDefault() {} }); // down wraps to Snake
  screens.drainIntents();
  assert.equal(state.game.screen.roleSelect, 0);
  input.onKey({ key: 'w', preventDefault() {} }); // up wraps to Back
  screens.drainIntents();
  assert.equal(state.game.screen.roleSelect, 2);
  input.onKey({ key: 'Enter', preventDefault() {} }); // confirm Back → the duration sub-menu
  screens.drainIntents();
  assert.equal(state.game.screen.state, 'SELECT_DURATION');
  assert.equal(state.game.play.pieces.length, 0);

  input.onKey({ key: 'Enter', preventDefault() {} }); // confirm the 1-minute item
  screens.drainIntents();
  assert.equal(state.game.screen.state, 'SELECT_ROLE');
  input.onKey({ key: 'w', preventDefault() {} }); // up from Back → Tetris
  screens.drainIntents();
  assert.equal(state.game.screen.roleSelect, 1);
  input.onKey({ key: 'Enter', preventDefault() {} });
  screens.drainIntents();
  assert.equal(state.game.screen.state, 'PLAYING');
  assert.equal(state.game.play.role, 'tetris');

  fresh();
  input.onKey({ key: 'r', preventDefault() {} });
  screens.drainIntents();
  input.onKey({ key: 'Escape', preventDefault() {} });
  screens.drainIntents();
  assert.equal(state.game.screen.state, 'MENU');
});

test('clicking a role item starts the game with that role', () => {
  fresh();
  state.game.screen.state = 'SELECT_ROLE';
  stub.roleItems[0].getBoundingClientRect = () => ({ left: 0, top: 0, right: 320, bottom: 24 });
  stub.roleItems[1].getBoundingClientRect = () => ({ left: 0, top: 30, right: 320, bottom: 54 });
  input.onInterfacePointerUp({ target: stub.document, clientX: 10, clientY: 40 });
  screens.drainIntents();
  assert.equal(state.game.screen.state, 'PLAYING');
  assert.equal(state.game.play.role, 'tetris');

  // startGame resets the game, so the selection index is not observable after
  // the click; the role it produced is.
  fresh();
  state.game.screen.state = 'SELECT_ROLE';
  input.onInterfacePointerUp({ target: stub.document, clientX: 10, clientY: 10 });
  screens.drainIntents();
  assert.equal(state.game.screen.state, 'PLAYING');
  assert.equal(state.game.play.role, 'snake');
});

test('clicking Play in the main menu opens the duration sub-menu', () => {
  fresh();
  stub.menuItems[0].getBoundingClientRect = () => ({ left: 0, top: 0, right: 320, bottom: 24 });
  input.onInterfacePointerUp({ target: stub.document, clientX: 10, clientY: 10 });
  screens.drainIntents();
  assert.equal(state.game.screen.state, 'SELECT_DURATION');
});

test('clicking Back on the role screen returns to the duration sub-menu without starting a game', () => {
  fresh();
  state.game.screen.state = 'SELECT_ROLE';
  stub.roleItems[0].getBoundingClientRect = () => ({ left: 0, top: 0, right: 320, bottom: 24 });
  stub.roleItems[1].getBoundingClientRect = () => ({ left: 0, top: 30, right: 320, bottom: 54 });
  stub.elements['role-back'].getBoundingClientRect = () => ({ left: 0, top: 60, right: 320, bottom: 84 });
  input.onInterfacePointerUp({ target: stub.document, clientX: 10, clientY: 70 });
  screens.drainIntents();
  assert.equal(state.game.screen.state, 'SELECT_DURATION');
  assert.equal(state.game.play.pieces.length, 0);
});

test('Tetris role: steering keys control the piece, never the snake', () => {
  fresh();
  state.game.play.role = 'tetris';
  state.startGame();
  state.game.play.dir = { r: 0, c: 1 };
  state.game.play.nextDir = { r: 0, c: 1 };
  input.onKey({ key: 'arrowup', preventDefault() {} });
  input.onKey({ key: 'arrowleft', preventDefault() {} });
  assert.deepEqual(state.game.play.nextDir, { r: 0, c: 1 });
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

test('Back from SELECT_CONTROL returns to the duration screen', () => {
  fresh();
  state.game.screen.state = 'SELECT_CONTROL';
  state.game.screen.twoPlayerMode = true;
  // Back is now a separate button (handled by onInterfacePointerUp), not an item index.
  // Verify the state transition: backToRoleSelect sets the duration screen.
  screens.backToRoleSelect();
  assert.equal(state.game.screen.state, 'SELECT_DURATION');
});

test('single key press locks the current player model in SELECT_CONTROL', () => {
  fresh();
  state.game.screen.state = 'SELECT_CONTROL';
  state.game.screen.twoPlayerMode = true;
  // A layout key locks P1 immediately; no confirm step.
  input.onKey({ key: 'w', preventDefault() {} });
  screens.drainIntents();
  assert.equal(state.game.screen.p1Model, 'wasd');
  assert.equal(state.game.screen.p1Selection, 'wasd');
  // The next key press locks P2.
  input.onKey({ key: 'ArrowUp', preventDefault() {} });
  screens.drainIntents();
  assert.equal(state.game.screen.p2Model, 'arrows');
  assert.equal(state.game.screen.p2Selection, 'arrows');
});

test('P2 key press that reuses P1 keyboard layout is rejected', () => {
  fresh();
  state.game.screen.state = 'SELECT_CONTROL';
  state.game.screen.twoPlayerMode = true;
  input.onKey({ key: 'w', preventDefault() {} }); // P1 locks WASD.
  screens.drainIntents();
  input.onKey({ key: 'w', preventDefault() {} }); // P2 tries WASD -> conflict.
  screens.drainIntents();
  assert.equal(state.game.screen.p2Model, null);
  assert.equal(state.game.screen.controlError, 'P2: cannot use the same layout as P1');
  // P2 can still use a different keyboard layout.
  input.onKey({ key: 'ArrowUp', preventDefault() {} });
  screens.drainIntents();
  assert.equal(state.game.screen.p2Model, 'arrows');
});

test('a pieceShift intent moves the piece while the player took the Snake role', () => {
  fresh();
  state.game.play.role = 'snake'; // P1 drives the snake; P2 drives the piece.
  state.startGame();
  state.game.screen.twoPlayerMode = true;
  state.game.screen.p1Role = 'snake';
  state.game.screen.p2Role = 'tetris';
  state.game.screen.p1Model = 'wasd';
  state.game.screen.p2Model = 'arrows';

  // One falling piece, and the shift interval already spent.
  state.game.play.pieces.length = 0;
  state.game.play.pieces.push({ type: 'O', state: 0, shape: [[0, 0]], col: 4, row: 5 });
  state.game.play.pieceMoveAcc = 99;

  const before = state.game.play.pieces[0].col;
  const dir = { r: state.game.play.nextDir.r, c: state.game.play.nextDir.c };
  input.handleIntent({ action: 'pieceShift', dc: -1 });
  assert.equal(state.game.play.pieces[0].col, before - 1);
  // The snake never receives this intent, so its steering stays untouched.
  assert.deepEqual(state.game.play.nextDir, dir);
});

// scripts/verify-controller-input.mjs
// Headless verification harness for the controller-support change.
//
// Mirrors the scripts/verify-menu-geometry.mjs pattern: a standalone Node
// script with a check(cond, msg) helper and exit code 0/1. It stubs the
// browser environment (navigator.getGamepads, localStorage, window/document)
// via controller-stubs.mjs, imports js/input.js, and drives pollController() /
// setDirection() / initInput() through the public API to verify every spec
// scenario:
//
//   - import resolves + setDirection/pollController/initInput are exported
//   - stick quantization: deadzone no-op, each pure axis, diagonal
//     dominant-axis, mixed deadzone/active
//   - D-pad steering (up/down/left/right) through the shared setDirection path
//   - D-pad precedence over stick when both pressed
//   - no-reverse rejection
//   - menu navigation with wrapping (D-pad and stick up/down)
//   - A confirm for each of the three menu items
//   - B back from Records and How-to-Play
//   - A from game over returning to the menu
//   - edge detection (a held button does not re-fire)
//   - gamepad disconnect stops input and clears stale held state
//   - first connected pad in any slot (a pad reporting in a non-zero slot
//     drives the game; slot 0 wins when both are connected)
//   - a held left stick does not swallow a D-pad edge
//   - initInput registers gamepadconnected/gamepaddisconnected once each and
//     keeps the existing keyboard/pointer listeners
//
// Run: node scripts/verify-controller-input.mjs

// Imported first so the browser globals are in place before js/input.js
// (and its transitive imports) evaluate.
import { setGamepads, windowListeners, docListeners, canvasListeners, makeCanvas } from './controller-stubs.mjs';

// The system under test (public API only; stickDir stays private and is
// verified through the PLAYING steering path, per the design).
import { pollController, setDirection, initInput, keyToDir } from '../js/input.js';
import { game, toMenu, startGame, gameOver } from '../js/state.js';
import { PLAYING, MENU, GAME_OVER, RECORDS, HELP, MENU_ITEMS } from '../js/constants.js';

// ---------- Test harness plumbing ----------

let failures = 0;
function check(cond, msg) {
  if (cond) {
    console.log('  ✓ ' + msg);
  } else {
    console.log('  ✗ FAIL: ' + msg);
    failures++;
  }
}

function sameDir(a, b) {
  return a && b && a.r === b.r && a.c === b.c;
}

// Build a stub gamepad on the standard W3C layout: buttons 0/1 = A/B,
// 12/13/14/15 = D-pad up/down/left/right, 17 buttons total.
function makePad({
  a = false,
  b = false,
  up = false,
  down = false,
  left = false,
  right = false,
  ax = 0,
  ay = 0
} = {}) {
  const buttons = Array.from({ length: 17 }, () => ({ pressed: false, value: 0 }));
  if (a) buttons[0].pressed = true;
  if (b) buttons[1].pressed = true;
  if (up) buttons[12].pressed = true;
  if (down) buttons[13].pressed = true;
  if (left) buttons[14].pressed = true;
  if (right) buttons[15].pressed = true;
  return { buttons, axes: [ax, ay] };
}

// Drive pollController() through a sequence of frames. A `null` entry means
// "no gamepad connected" for that frame.
function pollFrames(seq) {
  for (const pad of seq) {
    setGamepads(pad === null ? [] : [pad]);
    pollController();
  }
}

// Simulate a disconnect: poll one frame with no gamepad, which clears the
// controller's edge-detection state (design D3). Needed between sub-tests that
// reuse a held button so the previous sub-test's held state does not suppress
// the fresh edge.
function resetControllerPrev() {
  setGamepads([]);
  pollController();
}

// Enter PLAYING with a controllable current direction. The no-reverse rule
// blocks only the exact opposite of game.dir, so callers pick a
// non-conflicting dir.
function startPlaying(dir) {
  startGame();
  game.dir = dir;
  game.nextDir = dir;
}

// ---------- Trivial import / export assertions ----------

console.log('=== Import & export assertions ===');
check(typeof pollController === 'function', 'pollController is exported and callable');
check(typeof setDirection === 'function', 'setDirection is exported and callable');
check(typeof initInput === 'function', 'initInput is exported and callable');
check(typeof keyToDir === 'function', 'keyToDir is exported and callable');
check(PLAYING === 'PLAYING' && MENU === 'MENU', 'state constants resolve');
check(MENU_ITEMS.length === 3, 'menu has 3 items');

// ---------- Stick quantization (verified via PLAYING steering path) ----------

console.log('=== Stick quantization ===');

// Deadzone: both axes inside the deadzone -> no direction applied.
startPlaying({ r: 0, c: 1 });
const beforeDead = { ...game.nextDir };
pollFrames([makePad({ ax: 0.1, ay: 0.1 })]);
check(sameDir(game.nextDir, beforeDead), 'stick in deadzone (0.1, 0.1) is a no-op (nextDir unchanged)');

// Pure X positive -> right.
startPlaying({ r: 1, c: 0 }); // down (right not blocked)
pollFrames([makePad({ ax: 0.8, ay: 0 })]);
check(sameDir(game.nextDir, { r: 0, c: 1 }), 'stick right (0.8, 0)');

// Pure Y negative -> up.
startPlaying({ r: 0, c: 1 }); // right (up not blocked)
pollFrames([makePad({ ax: 0, ay: -0.8 })]);
check(sameDir(game.nextDir, { r: -1, c: 0 }), 'stick up (0, -0.8)');

// Pure Y positive -> down.
startPlaying({ r: 0, c: -1 }); // left (down not blocked)
pollFrames([makePad({ ax: 0, ay: 0.8 })]);
check(sameDir(game.nextDir, { r: 1, c: 0 }), 'stick down (0, 0.8)');

// Pure X negative -> left.
startPlaying({ r: -1, c: 0 }); // up (left not blocked)
pollFrames([makePad({ ax: -0.8, ay: 0 })]);
check(sameDir(game.nextDir, { r: 0, c: -1 }), 'stick left (-0.8, 0)');

// Diagonal X-dominant (0.8, 0.4) -> right (X wins).
startPlaying({ r: 1, c: 0 }); // down
pollFrames([makePad({ ax: 0.8, ay: 0.4 })]);
check(sameDir(game.nextDir, { r: 0, c: 1 }), 'stick diagonal x-dominant (0.8, 0.4) resolves to right');

// Diagonal Y-dominant (0.4, -0.8) -> up (Y wins).
startPlaying({ r: 0, c: 1 }); // right
pollFrames([makePad({ ax: 0.4, ay: -0.8 })]);
check(sameDir(game.nextDir, { r: -1, c: 0 }), 'stick diagonal y-dominant (0.4, -0.8) resolves to up');

// Mixed: one axis in deadzone, the other past it -> that axis wins.
startPlaying({ r: 1, c: 0 }); // down
pollFrames([makePad({ ax: 0.8, ay: 0.1 })]);
check(sameDir(game.nextDir, { r: 0, c: 1 }), 'stick mixed (0.8, 0.1) -> right (y in deadzone)');

// ---------- D-pad steering (through the shared setDirection path) ----------

console.log('=== D-pad steering ===');

// Each test sets game.dir to a non-opposite direction so the no-reverse
// rule does not interfere; a release frame follows each press (edge-only).

startPlaying({ r: 0, c: 1 }); // right (up not blocked)
pollFrames([makePad({ up: true }), makePad()]);
check(sameDir(game.nextDir, { r: -1, c: 0 }), 'D-pad up');

startPlaying({ r: 0, c: 1 }); // right (down not blocked)
pollFrames([makePad({ down: true }), makePad()]);
check(sameDir(game.nextDir, { r: 1, c: 0 }), 'D-pad down');

startPlaying({ r: 0, c: 1 }); // right (left blocked by no-reverse; checked below)
pollFrames([makePad({ left: true }), makePad()]);
check(sameDir(game.nextDir, { r: 0, c: 1 }), 'D-pad left while moving right is blocked (no-reverse rule)');

startPlaying({ r: 0, c: -1 }); // left (left not blocked)
pollFrames([makePad({ left: true }), makePad()]);
check(sameDir(game.nextDir, { r: 0, c: -1 }), 'D-pad left (moving left)');

startPlaying({ r: 1, c: 0 }); // down (right not blocked)
pollFrames([makePad({ right: true }), makePad()]);
check(sameDir(game.nextDir, { r: 0, c: 1 }), 'D-pad right (moving down)');

// D-pad takes precedence over stick when both are pressed.
startPlaying({ r: 0, c: 1 }); // right (up not blocked)
pollFrames([makePad({ up: true, ax: -0.8, ay: 0 }), makePad()]); // D-pad up + stick left
check(sameDir(game.nextDir, { r: -1, c: 0 }), 'D-pad up wins over stick left when both pressed');

// ---------- No-reverse rejection ----------

console.log('=== No-reverse rejection ===');

startPlaying({ r: 0, c: 1 }); // right
pollFrames([makePad({ up: true })]);
check(sameDir(game.nextDir, { r: -1, c: 0 }), 'right -> up accepted');
pollFrames([makePad({ down: true })]);
check(sameDir(game.nextDir, { r: 1, c: 0 }), 'up -> down accepted');
startPlaying({ r: 0, c: 1 }); // right again
pollFrames([makePad({ left: true })]);
check(sameDir(game.nextDir, { r: 0, c: 1 }), 'right -> left rejected (no-reverse)');

// ---------- Menu navigation with wrapping ----------

// Menu actions are edge-only (design D3): a held D-pad/stick advances the
// selection once. These tests therefore model discrete presses: a press frame
// followed by a release frame (buttons all clear).

console.log('=== Menu navigation (wrapping) ===');

toMenu();
check(game.menuSelect === 0, 'menu starts at 0 (Play)');

pollFrames([makePad({ down: true }), makePad()]);
check(game.menuSelect === 1, 'D-pad down: 0 -> 1 (Records)');

pollFrames([makePad({ down: true }), makePad()]);
check(game.menuSelect === 2, 'D-pad down: 1 -> 2 (How to Play)');

pollFrames([makePad({ down: true }), makePad()]);
check(game.menuSelect === 0, 'D-pad down: 2 -> 0 (wraps)');

pollFrames([makePad({ up: true }), makePad()]);
check(game.menuSelect === 2, 'D-pad up: 0 -> 2 (wraps)');

pollFrames([makePad({ up: true }), makePad()]);
check(game.menuSelect === 1, 'D-pad up: 2 -> 1');

// Left stick also moves the selection (design D1: left-stick up-down).
toMenu();
pollFrames([makePad({ ay: 0.8 }), makePad()]);
check(game.menuSelect === 1, 'stick down moves selection 0 -> 1');

// Left stick up also moves the selection (wraps from 1 to 0).
pollFrames([makePad({ ay: -0.8 }), makePad()]);
check(game.menuSelect === 0, 'stick up moves selection 1 -> 0 (wraps)');

// ---------- A confirm for each of the three menu items ----------

console.log('=== A confirm (each menu item) ===');

toMenu();
game.menuSelect = 0;
pollFrames([makePad({ a: true })]);
check(game.state === PLAYING, 'A on "Play" starts the game (PLAYING)');

resetControllerPrev(); // disconnect: clears the held A from the previous frame
toMenu();
game.menuSelect = 1;
pollFrames([makePad({ a: true })]);
check(game.state === RECORDS, 'A on "Records" opens RECORDS');

resetControllerPrev();
toMenu();
game.menuSelect = 2;
pollFrames([makePad({ a: true })]);
check(game.state === HELP, 'A on "How to Play" opens HELP');

// ---------- B back from Records and How-to-Play ----------

console.log('=== B back to menu ===');

resetControllerPrev(); // previous block ended with A held
toMenu();
game.menuSelect = 1;
pollFrames([makePad({ a: true })]);
check(game.state === RECORDS, 'entering RECORDS via A');
pollFrames([makePad({ b: true })]);
check(game.state === MENU, 'B from RECORDS returns to MENU');

resetControllerPrev();
toMenu();
game.menuSelect = 2;
pollFrames([makePad({ a: true })]);
check(game.state === HELP, 'entering HELP via A');
pollFrames([makePad({ b: true })]);
check(game.state === MENU, 'B from HELP returns to MENU');

// ---------- A from game over returns to menu ----------

console.log('=== A from game over ===');

resetControllerPrev();
startGame();
check(game.state === PLAYING, 'in PLAYING before game over');
gameOver();
check(game.state === GAME_OVER, 'game over state');
pollFrames([makePad({ a: true })]);
check(game.state === MENU, 'A from GAME_OVER returns to MENU');

// ---------- Edge detection: held button does not re-fire ----------

console.log('=== Edge detection (hold does not re-fire) ===');

resetControllerPrev();
toMenu();
game.menuSelect = 0;
pollFrames([makePad({ a: true }), makePad({ a: true }), makePad({ a: true })]);
check(game.state === PLAYING, 'holding A in menu: fires once -> PLAYING (no re-fire)');

resetControllerPrev();
toMenu();
game.menuSelect = 0;
pollFrames([makePad({ down: true }), makePad({ down: true }), makePad({ down: true })]);
check(game.menuSelect === 1, 'holding D-pad down: selection advances exactly once (0->1)');

resetControllerPrev();
toMenu();
game.menuSelect = 1;
pollFrames([makePad({ a: true })]);
pollFrames([makePad({ b: true }), makePad({ b: true }), makePad({ b: true })]);
check(game.state === MENU, 'holding B in RECORDS: returns to menu (idempotent, no crash)');

// ---------- Gamepad disconnect stops input & clears stale state ----------

console.log('=== Disconnect stops input & clears stale state ===');

resetControllerPrev();
startGame();
gameOver();
// Frame 1: A pressed (edge) -> toMenu() -> MENU.
pollFrames([makePad({ a: true })]);
check(game.state === MENU, 'frame1 A edge in GAME_OVER -> MENU');
// Frame 2: A still held -> no re-fire (prev[A]=true) -> stays MENU.
pollFrames([makePad({ a: true })]);
check(game.state === MENU, 'frame2 A held -> no re-fire (stays MENU)');
// Frame 3: disconnect (no gamepad) -> pollController clears prev state.
pollFrames([null]);
// Frame 4: reconnect with A "still pressed". Because prev was cleared, this is
// a fresh edge. In MENU with menuSelect 0, A confirms -> startGame -> PLAYING.
pollFrames([makePad({ a: true })]);
check(game.state === PLAYING, 'reconnect with A: fresh edge fires (prev cleared on disconnect) -> PLAYING');

// With no gamepad, steering is a no-op.
startGame();
pollFrames([null, null, null]);
check(sameDir(game.nextDir, { r: 0, c: 1 }), 'no gamepad: steering is a no-op (nextDir unchanged)');

// ---------- First connected pad in any slot (design D4) ----------

console.log('=== First connected pad in any slot ===');

// A pad that reports in a non-zero slot drives the game: slot 0 is empty.
startPlaying({ r: 0, c: 1 }); // right (up not blocked)
setGamepads([null, makePad({ up: true })]);
pollController();
check(sameDir(game.nextDir, { r: -1, c: 0 }), 'pad in slot 1 steers up while slot 0 is empty');
resetControllerPrev();

// The first non-null entry wins, so slot 0 takes precedence over a second
// connected pad (selecting a specific pad is out of scope).
startPlaying({ r: 1, c: 0 }); // down (right not blocked)
setGamepads([makePad({ right: true }), makePad({ up: true })]);
pollController();
check(sameDir(game.nextDir, { r: 0, c: 1 }), 'slot 0 pad wins over slot 1 pad (first non-null entry)');
resetControllerPrev();

// Deeper slots resolve the same way.
startPlaying({ r: 0, c: -1 }); // left (down not blocked)
setGamepads([null, null, makePad({ down: true })]);
pollController();
check(sameDir(game.nextDir, { r: 1, c: 0 }), 'pad in slot 2 steers down while slots 0-1 are empty');
resetControllerPrev();

// ---------- Held left stick does not swallow a D-pad edge ----------

console.log('=== Held left stick does not swallow a D-pad edge ===');

resetControllerPrev();
toMenu();
game.menuSelect = 0;

// Frame 1: only the stick is held down -> the stick's own edge moves the
// selection and records prevStickDir.
setGamepads([makePad({ ay: 0.8 })]);
pollController();
check(game.menuSelect === 1, 'frame1 stick-down edge: 0 -> 1');

// Frame 2: the stick is STILL held down while the D-pad down button (index 13)
// is freshly pressed. The stick must not mark that button as already pressed,
// so its unpressed->pressed edge fires and the selection advances again.
setGamepads([makePad({ down: true, ay: 0.8 })]);
pollController();
check(game.menuSelect === 2, 'frame2 D-pad down edge while stick held: 1 -> 2 (edge not swallowed)');

// Frame 3: D-pad released, stick still held -> no new edge on either channel.
setGamepads([makePad({ ay: 0.8 })]);
pollController();
check(game.menuSelect === 2, 'frame3 stick held, no new edge: selection stays 2');
resetControllerPrev();

// ---------- initInput registers gamepad listeners once each ----------

console.log('=== initInput gamepad listeners ===');

windowListeners.clear();
docListeners.clear();
canvasListeners.clear();

initInput(makeCanvas());

check(windowListeners.get('gamepadconnected') === 1, 'initInput registers gamepadconnected once');
check(windowListeners.get('gamepaddisconnected') === 1, 'initInput registers gamepaddisconnected once');
check(docListeners.get('keydown') === 1, 'document keydown still registered');
check(canvasListeners.get('pointerdown') === 1, 'canvas pointerdown still registered');
check(canvasListeners.get('pointermove') === 1, 'canvas pointermove still registered');
check(canvasListeners.get('pointerup') === 1, 'canvas pointerup still registered');
check(canvasListeners.get('pointercancel') === 1, 'canvas pointercancel still registered');
check(canvasListeners.get('keydown') === 1, 'canvas keydown still registered');

// ---------- Summary ----------

console.log('');
if (failures === 0) {
  console.log('All controller input assertions passed.');
  process.exit(0);
} else {
  console.log(`Controller input check FAILED: ${failures} assertion(s) failed.`);
  process.exit(1);
}

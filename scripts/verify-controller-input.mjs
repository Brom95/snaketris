// scripts/verify-controller-input.mjs
// Headless check for the controller-support change.
//
// Stubs the browser environment with harness.stubDom(), then drives the public
// API of js/devices.js (raw device reads) through js/input.js (the single
// intent dispatcher) to verify every spec scenario:
//
//   - import resolves + pollController / setDirection / initInput are exported
//   - stick quantization: deadzone no-op, each pure axis, diagonal
//     dominant-axis, mixed deadzone/active
//   - D-pad steering (up/down/left/right) through the shared steering path
//   - D-pad precedence over stick when both pressed
//   - no-reverse rejection
//   - menu navigation with wrapping (D-pad and stick up/down)
//   - A confirm for each of the three menu items
//   - B back from Records and How to Play
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
import { check, makePad, report, stubDom } from './harness.mjs';
import { pollController, keyToDir, tapToDir, swipeToDir, clearControllerPrev } from '../js/devices.js';
import { initInput, handleIntent, setDirection } from '../js/input.js';
import { game, toMenu, startGame, gameOver } from '../js/state.js';
import { PLAYING, SELECT_ROLE, MENU, GAME_OVER, RECORDS, HELP, MENU_ITEMS } from '../js/constants.js';

// DPAD_UP=12, DPAD_DOWN=13, DPAD_LEFT=14, DPAD_RIGHT=15, A=0, B=1.
const A = 0;
const B = 1;
const UP = 12;
const DOWN = 13;
const LEFT = 14;
const RIGHT = 15;

const dom = stubDom({
  elements: ['ui', 'score', 'status', 'menu-view', 'role-view', 'records-view', 'help-view',
    'records-list', 'records-empty'],
  lists: {
    '#menu-items > li': ['menu-item-play', 'menu-item-records', 'menu-item-help', 'menu-item-two-player'],
    '#role-items > li': ['role-item-snake', 'role-item-tetris', 'role-back'],
  },
  window: { innerWidth: 1280, innerHeight: 800 },
  canvas: {
    width: 240,
    height: 480,
    style: {},
    getContext: () => null,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 240, height: 480 }),
    setPointerCapture: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  },
});

// A frame of controller input, applied through the dispatcher exactly as the
// game loop does.
function frame(pad) {
  dom.setGamepads(pad === null ? [] : [pad]);
  handleIntent(pollController());
}

function frames(seq) {
  for (const pad of seq) frame(pad);
}

// Clear the edge-detection state between sub-tests that reuse a held button.
function resetController() {
  clearControllerPrev();
}

// Enter PLAYING with a controllable current direction. The no-reverse rule
// blocks only the exact opposite of game.dir, so callers pick a
// non-conflicting dir.
function startPlaying(dir) {
  startGame();
  game.dir = dir;
  game.nextDir = dir;
}

function sameDir(a, b) {
  return a && b && a.r === b.r && a.c === b.c;
}

// ---------- Trivial import / export assertions ----------

console.log('=== Import & export assertions ===');
check(typeof pollController === 'function', 'pollController is exported and callable');
check(typeof setDirection === 'function', 'setDirection is exported and callable');
check(typeof initInput === 'function', 'initInput is exported and callable');
check(typeof keyToDir === 'function', 'keyToDir is exported by js/devices.js');
check(typeof tapToDir === 'function', 'tapToDir is exported by js/devices.js');
check(typeof swipeToDir === 'function', 'swipeToDir is exported by js/devices.js');
check(PLAYING === 'PLAYING' && MENU === 'MENU', 'state constants resolve');
check(MENU_ITEMS.length === 4, 'menu has 4 items');

// ---------- Stick quantization (verified through the PLAYING steering path) ----------

console.log('=== Stick quantization ===');

frame(makePad([], [0.1, 0.1]));
startPlaying({ r: 0, c: 1 });
const beforeDead = { ...game.nextDir };
frames([makePad([], [0.1, 0.1])]);
check(sameDir(game.nextDir, beforeDead), 'stick in deadzone (0.1, 0.1) is a no-op (nextDir unchanged)');

startPlaying({ r: 1, c: 0 }); // down (right not blocked)
frames([makePad([], [0.8, 0])]);
check(sameDir(game.nextDir, { r: 0, c: 1 }), 'stick right (0.8, 0)');

startPlaying({ r: 0, c: 1 }); // right (up not blocked)
frames([makePad([], [0, -0.8])]);
check(sameDir(game.nextDir, { r: -1, c: 0 }), 'stick up (0, -0.8)');

startPlaying({ r: 0, c: -1 }); // left (down not blocked)
frames([makePad([], [0, 0.8])]);
check(sameDir(game.nextDir, { r: 1, c: 0 }), 'stick down (0, 0.8)');

startPlaying({ r: -1, c: 0 }); // up (left not blocked)
frames([makePad([], [-0.8, 0])]);
check(sameDir(game.nextDir, { r: 0, c: -1 }), 'stick left (-0.8, 0)');

startPlaying({ r: 1, c: 0 }); // down
frames([makePad([], [0.8, 0.4])]);
check(sameDir(game.nextDir, { r: 0, c: 1 }), 'stick diagonal x-dominant (0.8, 0.4) resolves to right');

startPlaying({ r: 0, c: 1 }); // right
frames([makePad([], [0.4, -0.8])]);
check(sameDir(game.nextDir, { r: -1, c: 0 }), 'stick diagonal y-dominant (0.4, -0.8) resolves to up');

startPlaying({ r: 1, c: 0 }); // down
frames([makePad([], [0.8, 0.1])]);
check(sameDir(game.nextDir, { r: 0, c: 1 }), 'stick mixed (0.8, 0.1) -> right (y in deadzone)');

// ---------- D-pad steering ----------

console.log('=== D-pad steering ===');

// Each test sets game.dir to a non-opposite direction so the no-reverse rule
// does not interfere; a release frame follows each press (edge-only).
startPlaying({ r: 0, c: 1 }); // right (up not blocked)
frames([makePad([UP]), makePad()]);
check(sameDir(game.nextDir, { r: -1, c: 0 }), 'D-pad up');

startPlaying({ r: 0, c: 1 }); // right (down not blocked)
frames([makePad([DOWN]), makePad()]);
check(sameDir(game.nextDir, { r: 1, c: 0 }), 'D-pad down');

startPlaying({ r: 0, c: 1 }); // right (left blocked by no-reverse; checked below)
frames([makePad([LEFT]), makePad()]);
check(sameDir(game.nextDir, { r: 0, c: 1 }), 'D-pad left while moving right is blocked (no-reverse rule)');

startPlaying({ r: 0, c: -1 }); // left (left not blocked)
frames([makePad([LEFT]), makePad()]);
check(sameDir(game.nextDir, { r: 0, c: -1 }), 'D-pad left (moving left)');

startPlaying({ r: 1, c: 0 }); // down (right not blocked)
frames([makePad([RIGHT]), makePad()]);
check(sameDir(game.nextDir, { r: 0, c: 1 }), 'D-pad right (moving down)');

startPlaying({ r: 0, c: 1 }); // right (up not blocked)
frames([makePad([UP], [-0.8, 0]), makePad()]); // D-pad up + stick left
check(sameDir(game.nextDir, { r: -1, c: 0 }), 'D-pad up wins over stick left when both pressed');

// ---------- No-reverse rejection ----------

console.log('=== No-reverse rejection ===');

startPlaying({ r: 0, c: 1 }); // right
frames([makePad([UP])]);
check(sameDir(game.nextDir, { r: -1, c: 0 }), 'right -> up accepted');
frames([makePad([DOWN])]);
check(sameDir(game.nextDir, { r: 1, c: 0 }), 'up -> down accepted');
startPlaying({ r: 0, c: 1 }); // right again
frames([makePad([LEFT])]);
check(sameDir(game.nextDir, { r: 0, c: 1 }), 'right -> left rejected (no-reverse)');

// ---------- Menu navigation with wrapping ----------

// Menu actions are edge-only: a held D-pad or stick advances the selection
// once. These tests model discrete presses: a press frame then a release frame.
console.log('=== Menu navigation (wrapping) ===');

toMenu();
check(game.menuSelect === 0, 'menu starts at 0 (Play)');

frames([makePad([DOWN]), makePad()]);
check(game.menuSelect === 1, 'D-pad down: 0 -> 1 (Records)');
frames([makePad([DOWN]), makePad()]);
check(game.menuSelect === 2, 'D-pad down: 1 -> 2 (How to Play)');
frames([makePad([DOWN]), makePad()]);
check(game.menuSelect === 3, 'D-pad down: 2 -> 3 (Two Players)');
frames([makePad([DOWN]), makePad()]);
check(game.menuSelect === 0, 'D-pad down: 3 -> 0 (wraps)');

toMenu();
frames([makePad([UP]), makePad()]);
check(game.menuSelect === 3, 'D-pad up: 0 -> 3 (wraps)');
frames([makePad([UP]), makePad()]);
check(game.menuSelect === 2, 'D-pad up: 3 -> 2');

toMenu();
frames([makePad([], [0, 0.8]), makePad()]);
check(game.menuSelect === 1, 'stick down moves selection 0 -> 1');
frames([makePad([], [0, -0.8]), makePad()]);
check(game.menuSelect === 0, 'stick up moves selection 1 -> 0 (wraps)');

// ---------- A confirm for each of the three menu items ----------

console.log('=== A confirm (each menu item) ===');

resetController();
toMenu();
game.menuSelect = 0;
frames([makePad([A])]);
check(game.state === SELECT_ROLE, 'A on "Play" opens the role screen (SELECT_ROLE)');

resetController();
toMenu();
game.menuSelect = 1;
frames([makePad([A])]);
check(game.state === RECORDS, 'A on "Records" opens RECORDS');

resetController();
toMenu();
game.menuSelect = 2;
frames([makePad([A])]);
check(game.state === HELP, 'A on "How to Play" opens HELP');

// ---------- B back from Records and How to Play ----------

console.log('=== B back to menu ===');

resetController();
toMenu();
game.menuSelect = 1;
frames([makePad([A])]);
check(game.state === RECORDS, 'entering RECORDS via A');
frames([makePad([B])]);
check(game.state === MENU, 'B from RECORDS returns to MENU');

resetController();
toMenu();
game.menuSelect = 2;
frames([makePad([A])]);
check(game.state === HELP, 'entering HELP via A');
frames([makePad([B])]);
check(game.state === MENU, 'B from HELP returns to MENU');

// ---------- A from game over returns to the menu ----------

console.log('=== A from game over ===');

resetController();
startGame();
check(game.state === PLAYING, 'in PLAYING before game over');
gameOver();
check(game.state === GAME_OVER, 'game over state');
frames([makePad([A])]);
check(game.state === MENU, 'A from GAME_OVER returns to MENU');

// ---------- Edge detection: a held button does not re-fire ----------

console.log('=== Edge detection (hold does not re-fire) ===');

resetController();
toMenu();
game.menuSelect = 0;
frames([makePad([A]), makePad([A]), makePad([A])]);
check(game.state === SELECT_ROLE, 'holding A in menu: fires once -> SELECT_ROLE (no re-fire)');

resetController();
toMenu();
game.menuSelect = 0;
frames([makePad([DOWN]), makePad([DOWN]), makePad([DOWN])]);
check(game.menuSelect === 1, 'holding D-pad down: selection advances exactly once (0->1)');

resetController();
toMenu();
game.menuSelect = 1;
frames([makePad([A])]);
frames([makePad([B]), makePad([B]), makePad([B])]);
check(game.state === MENU, 'holding B in RECORDS: returns to menu (idempotent, no crash)');

// ---------- Disconnect stops input and clears stale state ----------

console.log('=== Disconnect stops input & clears stale state ===');

resetController();
startGame();
gameOver();
// Frame 1: A pressed (edge) -> toMenu() -> MENU.
frames([makePad([A])]);
check(game.state === MENU, 'frame1 A edge in GAME_OVER -> MENU');
// Frame 2: A still held -> no re-fire -> stays MENU.
frames([makePad([A])]);
check(game.state === MENU, 'frame2 A held -> no re-fire (stays MENU)');
// Frame 3: disconnect (no gamepad) clears the edge-detection state.
frames([null]);
// Frame 4: reconnect with A "still pressed". Because prev was cleared, this is
// a fresh edge. In MENU with menuSelect 0, A confirms -> SELECT_ROLE.
frames([makePad([A])]);
check(game.state === SELECT_ROLE,
  'reconnect with A: fresh edge fires (prev cleared on disconnect) -> ' + game.state);

// With no gamepad, steering is a no-op.
startGame();
game.dir = { r: 0, c: 1 };
game.nextDir = { r: 0, c: 1 };
frames([null, null, null]);
check(sameDir(game.nextDir, { r: 0, c: 1 }), 'no gamepad: steering is a no-op (nextDir unchanged)');

// ---------- First connected pad in any slot ----------

console.log('=== First connected pad in any slot ===');

// A pad that reports in a non-zero slot drives the game: slot 0 is empty.
resetController();
startPlaying({ r: 0, c: 1 }); // right (up not blocked)
dom.setGamepads([null, makePad([UP])]);
handleIntent(pollController());
check(sameDir(game.nextDir, { r: -1, c: 0 }), 'pad in slot 1 steers up while slot 0 is empty');
resetController();

// The first non-null entry wins, so slot 0 takes precedence over a second pad.
startPlaying({ r: 1, c: 0 }); // down (right not blocked)
dom.setGamepads([makePad([RIGHT]), makePad([UP])]);
handleIntent(pollController());
check(sameDir(game.nextDir, { r: 0, c: 1 }), 'slot 0 pad wins over slot 1 pad (first non-null entry)');
resetController();

// Deeper slots resolve the same way.
startPlaying({ r: 0, c: -1 }); // left (down not blocked)
dom.setGamepads([null, null, makePad([DOWN])]);
handleIntent(pollController());
check(sameDir(game.nextDir, { r: 1, c: 0 }), 'pad in slot 2 steers down while slots 0-1 are empty');
resetController();

// ---------- A held left stick does not swallow a D-pad edge ----------

console.log('=== Held left stick does not swallow a D-pad edge ===');

resetController();
toMenu();
game.menuSelect = 0;

// Frame 1: only the stick is held down -> its own edge moves the selection.
dom.setGamepads([makePad([], [0, 0.8])]);
handleIntent(pollController());
check(game.menuSelect === 1, 'frame1 stick-down edge: 0 -> 1');

// Frame 2: the stick is still held while the D-pad down button (index 13) is
// freshly pressed. The stick must not mark that button as already pressed, so
// its unpressed -> pressed edge fires and the selection advances again.
dom.setGamepads([makePad([DOWN], [0, 0.8])]);
handleIntent(pollController());
check(game.menuSelect === 2, 'frame2 D-pad down edge while stick held: 1 -> 2 (edge not swallowed)');

// Frame 3: D-pad released, stick still held -> no new edge on either channel.
dom.setGamepads([makePad([], [0, 0.8])]);
handleIntent(pollController());
check(game.menuSelect === 2, 'frame3 stick held, no new edge: selection stays 2');
resetController();

// ---------- initInput registers the gamepad listeners once each ----------

console.log('=== initInput gamepad listeners ===');

initInput(dom.canvas);

check(dom.listeners.window.get('gamepadconnected') === 1, 'initInput registers gamepadconnected once');
check(dom.listeners.window.get('gamepaddisconnected') === 1, 'initInput registers gamepaddisconnected once');
check(dom.listeners.document.get('keydown') === 1, 'document keydown still registered');
check(dom.listeners.canvas.get('pointerdown') === 1, 'canvas pointerdown still registered');
check(dom.listeners.canvas.get('pointermove') === 1, 'canvas pointermove still registered');
check(dom.listeners.canvas.get('pointerup') === 1, 'canvas pointerup still registered');
check(dom.listeners.canvas.get('pointercancel') === 1, 'canvas pointercancel still registered');
check(dom.listeners.canvas.get('keydown') === 1, 'canvas keydown still registered');

report('Controller input check');

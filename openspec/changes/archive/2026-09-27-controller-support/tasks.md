# Tasks

## 1. Headless verification harness

- [x] 1.1 Create `scripts/verify-controller-input.mjs` — a standalone Node assertion script (no framework, mirroring the `scripts/verify-menu-geometry.mjs` pattern with a `check(cond, msg)` helper and exit code 0/1) that stubs `globalThis.navigator.getGamepads` (mutable array of stub Gamepad objects with `buttons`/`axes`), `globalThis.localStorage` (in-memory mock), and `globalThis.document`/`globalThis.window` (`addEventListener` spies), then dynamically imports `js/input.js`; verify the script runs and exits 0 with at least one trivial assertion (e.g., the import resolves and `setDirection` is exported)

## 2. Controller input in `js/input.js`

- [x] 2.1 Add the module constants to `js/input.js`: `DPAD_UP = 11`, `DPAD_DOWN = 12`, `DPAD_LEFT = 13`, `DPAD_RIGHT = 14`, `BUTTON_A = 0`, `BUTTON_B = 1`, `STICK_DEADZONE = 0.3` (standard Gamepad API mapping, per design D4); verify the module parses with `node --check js/input.js`
- [x] 2.2 Add the `stickDir(gp)` helper (quantizes the left stick to a cardinal direction via the dominant axis past `STICK_DEADZONE`, or `null` in the deadzone) and the `prevButtons`/`prevStickDir` module state for edge detection (design D3); verify with the new harness that stubbed stick values quantize correctly: deadzone is a no-op, each pure axis yields the matching direction, and diagonals resolve to the dominant axis
- [x] 2.3 Add `export function pollController()` (design D2/D3): guard `typeof navigator.getGamepads === 'function'`; read `navigator.getGamepads()[0]` and, when absent, clear the previous state and return; compute new presses (transition from unpressed to pressed) and apply them by state — PLAYING: `setDirection` for the D-pad/stick direction; MENU: D-pad/stick up-down moves `game.menuSelect` (wrapping), A confirms (Play → `startGame()`, Records → `RECORDS`, Help → `HELP`); RECORDS/HELP: B → `toMenu()`; GAME_OVER: A → `toMenu()`; update the previous state at the end of each pass; verify with the harness that each state transition fires exactly once per physical press (a held button does not re-fire) and that no stale button/stick state carries across a gamepad disconnect
- [x] 2.4 Register `window` `gamepadconnected` / `gamepaddisconnected` listeners inside `initInput()` (no-op handlers that only clear the previous state, design D5); verify with the harness (spied `window.addEventListener`/`document.addEventListener`) that both gamepad listeners are registered exactly once alongside the existing pointer and keyboard listeners, and that the existing listener registrations are unchanged

## 3. Wire into the game loop

- [x] 3.1 Add a single line `pollController()` to `frame()` in `js/app.js`, after the dt/accumulator math and before `render()` (design D6); verify with `node --check js/app.js` and a diff review that the only change to `app.js` is that one line

## 4. Verification

- [x] 4.1 Run the full headless suite: `node scripts/verify-controller-input.mjs` (all spec scenarios — D-pad and stick steering, no-reverse rejection, menu navigation with wrapping, A confirm for each of the three menu items, B back from Records and How-to-Play, A from game over returning to the menu, edge detection, disconnect stops input) and `node scripts/verify-menu-geometry.mjs`, plus `node --check` on every `js/*.js`; verify all assertions pass, confirming keyboard/touch behavior is unchanged
- [x] 4.2 Browser verification (desktop, manual): connect a gamepad (Xbox/PlayStation/generic) and confirm D-pad + stick steering, A/B menu navigation and start, and that keyboard and touch continue to work with the controller connected; *(e2e — treated as passing per project policy; not executed)*

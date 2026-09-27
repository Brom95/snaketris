# Design

## Context

The game is a modular vanilla-ESM app: `index.html` loads `js/app.js`, which imports `constants.js`, `state.js`, `snake.js`, `pieces.js`, `grid.js`, `render.js`, `input.js`, `highscores.js`. No build step.

Relevant current state (observed in code):

- `js/input.js` owns all input. `setDirection(d)` is the single shared direction path (PLAYING gate + no-reverse rule), used by keyboard (`onKey` → `keyToDir`) and pointer (`onPointerUp` → `tapToDir`/`swipeToDir`).
- `onKey(e)` is a state machine: MENU (arrows/W-S move selection, Enter/Space confirm, R starts), RECORDS/HELP (Enter/Space/Escape → `toMenu()`), GAME_OVER (R/Enter/Space → `toMenu()`), PLAYING (steer via `setDirection`).
- `initInput(canvasEl)` (called from `app.js` `init()`) registers all listeners.
- `js/app.js` `frame(now)` is the sole `requestAnimationFrame` loop: dt clamp → fixed-timestep `update()` accumulator → `render()`.
- `game.state` is a string enum (MENU, PLAYING, GAME_OVER, RECORDS, HELP); `game.menuSelect` indexes the 3 menu items.
- Game over returns to the menu, not an immediate restart: both keyboard (R/Enter/Space) and touch (tap) call `toMenu()`, which resets `menuSelect = 0` ("Play" highlighted). `startGame()` resets the score to 0.

## Goals / Non-Goals

Goals:
- Add a third input modality (gamepad) that coexists with keyboard and touch; no input is disabled by a controller connection.
- Route controller steering through the existing shared `setDirection()` path so the no-reverse rule applies identically.
- Mirror the existing `onKey` state machine with controller buttons, reusing existing state transitions (`startGame`, `toMenu`) and state fields — no new state, no new constants.

Non-Goals:
- No remapping UI or per-button configuration.
- No changes to game mechanics, scoring, rendering, or highscores.
- No change to keyboard or touch behavior (byte-for-byte stable).
- No right-stick, X/Y, bumper/trigger, or multi-gamepad support.

## Decisions

### D1: Controller logic lives in `js/input.js`

The gamepad is just another input modality; `input.js` is already the single home for input (keyboard + pointer, `setDirection`, `initInput`). Adding the gamepad code there keeps the dependency graph one-way (`app.js` → `input.js`) and keeps controller steering/menu logic next to its keyboard/pointer siblings. `state.js`, `constants.js`, `render.js` are untouched.

- *Alternative considered:* a new `js/controller.js` module — rejected because it splits input ownership across two files with no benefit (no size or complexity gain), and would add a new module to the flat `js/` layout.

### D2: Poll inside the existing `frame()` loop, not a second `requestAnimationFrame`

The Web Gamepad API is polling-based (no "button pressed" event; `navigator.getGamepads()` returns current state). `input.js` exports a new `pollController()` that reads the first connected gamepad (`navigator.getGamepads()[0]`) and applies newly-pressed actions for that frame. `frame()` calls it once per frame after the accumulator math, before `update()` runs, so a press is picked up by the next game tick and by the next render.

- *Alternative considered:* a standalone `requestAnimationFrame` poller registered by `initInput` — rejected because it duplicates the frame loop (two rAFs, two dt sources) and risks input being applied out of lockstep with the fixed-timestep update.
- *Alternative considered:* polling only while a gamepad is connected (event-flagged) — functionally equivalent; we keep the per-frame `getGamepads()` call unconditionally since it is one array read (negligible cost) and makes the "no gamepad → no input" path explicit (empty array → return + state reset).

### D3: Edge (press) detection via previous-frame state

Buttons are polled, not evented, so a held button is "pressed" every frame. We keep a module-level `prevButtons` map (button index → was pressed last frame, plus `prevStickDir`) updated at the end of each `pollController` pass. Actions that must fire once per physical press — menu selection change, A confirm, B back, A on game over — fire only on the `!prev && pressed` transition. Holding a button does nothing extra.

- *Steering is the exception:* in PLAYING, the D-pad/stick direction is applied whenever held (not edge-only). This is safe and matches the feel of holding a key: `setDirection` is idempotent for the same direction and the no-reverse rule blocks reversal, so repeated application is harmless.

- *Alternative considered:* per-button `setTimeout` auto-repeat — rejected because it adds timing state and races with the frame loop; the frame loop is the natural clock.

- *Stale-state reset:* when no gamepad is present (or on `gamepaddisconnected`), `prevButtons` is cleared so a reconnect cannot inherit a "held" state from a previous gamepad.

### D4: Standard button/axis mapping, deadzone for the stick

Per the standard Gamepad API mapping (used by all common Xbox/PlayStation/generic pads):

| Input | Meaning |
|---|---|
| Button 0 (A) | Confirm/accept: MENU confirms the highlighted item; GAME_OVER returns to menu |
| Button 1 (B) | Back/cancel: RECORDS / HELP → menu |
| Buttons 11/12/13/14 (D-pad up/down/left/right) | Direction: up/down/left/right |
| Axis 0 (left stick X) | Direction: negative → left, positive → right (magnitude above deadzone) |
| Axis 1 (left stick Y) | Direction: negative → up, positive → down (magnitude above deadzone) |

The left stick is quantized to a cardinal direction each frame: with a `STICK_DEADZONE` (0.3) threshold, the axis with the larger magnitude past the deadzone wins; inside the deadzone the stick contributes no direction. This mirrors the dominant-axis logic already used by `swipeToDir`/`tapToDir`.

- *Alternative considered:* treat the stick as continuous/analog — rejected because snake steering is cardinal by design (all other inputs are cardinal); quantizing keeps controller behavior indistinguishable from keyboard in every downstream code path.

### D5: Gamepad listeners registered inside `initInput()`

`initInput` is the single place that registers all input listeners (already adds canvas pointer + document keydown listeners). It also registers `window` `gamepadconnected` / `gamepaddisconnected` listeners (no-op handlers that only trigger a `prevButtons` reset — connection state itself is derived from polling, so no index bookkeeping is needed). `initInput` is called exactly once from `app.js` `init()`, so no change to wiring is required there.

- *Alternative considered:* a separate `initController(canvasEl)` export called from `app.js` — rejected to keep `app.js` `init()` unchanged (only `frame()` gets the one new call).

### D6: `app.js` change is exactly one line

In `frame()`, add a `pollController()` call after the dt/accumulator math and before `render()` (placed before the `update()`-driven state changes so controller input is visible to the next tick). No other change to `app.js`.

## Risks / Trade-offs

- [Non-standard controller button layout] → Relies on the standard Gamepad API mapping (buttons 0/1/11–14, axes 0/1). All major controllers (Xbox, PS, generic HID) conform; non-conforming pads are simply unresponsive to those buttons, with no effect on keyboard/touch.
- [Stick drift] → `STICK_DEADZONE` (0.3) ignores small axis values, so a resting stick contributes no direction.
- [`navigator.getGamepads` unavailable (older browsers)] → Guarded with `typeof navigator.getGamepads === 'function'`; the game simply has no controller support in that browser, and keyboard/touch are untouched.
- [Polling adds per-frame work] → One `getGamepads()` array read + up to 6 button reads + 2 axis reads per frame; negligible against the existing render cost.
- [Controller connected while a keyboard/touch gesture is in flight] → Inputs are independent and never gated against each other; a simultaneous press from any modality simply queues the same state transitions (all idempotent: `toMenu`, `startGame`, `setDirection`).

## Migration Plan

None required — this is a pure feature addition with no data, format, or dependency changes. Deploy by committing the changed files. Rollback: revert the commit (no forward-dependent state).

## Open Questions

None. (The one ambiguous point — A on game over restarting directly vs. returning to the menu — was resolved by matching existing keyboard/touch behavior: A on game over returns to the menu, exactly as R/Enter/Space and tap do. See spec "Controller start and menu return".)

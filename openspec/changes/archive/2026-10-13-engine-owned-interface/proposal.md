# Proposal

## Why

The navigation scheme is written in four places today: `constants.js` holds the item lists, `input.js` maps item indices to screens twice (`confirmSelection`, `openMenuItem`), `state.js` owns the transitions, and `ui.js` re-derives which view is on plus the step-to-index mapping. The same table has no single source of truth, so every screen change touches four modules and the magic indices are the load-bearing part. The interface also sits outside the engine: `app.js frame()` calls `pollController()`, `render()`, `syncViews()` and `fitField()` as frame-level calls, while `engine.js createEngine` registers only three systems. Gameplay and interface state share one mutable `game` object, and the core writes to `localStorage` through `gameOver()`.

This change extracts gameplay logic into its own layer and makes the interface part of the game engine. The goal is a portable navigation scheme, one interface style, and code that unit tests can drive without a page.

## What Changes

- **BREAKING (internal)** A new `engine-architecture` capability: the engine registry gains a screen/navigation system, and the navigation state machine reads one declarative screen table instead of index-based branches.
- **New** `js/screens.js` declares every screen: its items, their order, their key hints, and the screen each item opens. Keyboard, pointer and gamepad paths read that table.
- **New** The screen system is a fourth entry in `createEngine([...])`. It advances navigation state from normalized intents only.
- **New** The shared state splits into a gameplay half and a screen half. Each reset touches only its own half.
- **New** The gameplay core becomes page-free and storage-free: it reads no DOM, no `window`, no `localStorage`. `gameOver()` reports the finished game instead of writing the records board.
- **New** Presentation (canvas painting, page painting, field fitting) stays a per-frame pass, separate from per-tick systems.
- Unchanged: every observable player behavior. The screens, their labels, their order, the scoring, the bot, the roles, and the records board keep behaving exactly as specified by the existing capabilities.

## Capabilities

### New Capabilities

- `engine-architecture`: how the engine composes gameplay systems and the interface system, and which layer owns navigation, presentation, and record keeping.

### Modified Capabilities

None. No existing requirement changes: this refactor moves code between layers and keeps every observable behavior that `snaketris-game`, `start-menu`, `two-player-local-mode`, `controller`, `hud`, `highscores`, `mobile-input` and `responsive-layout` already specify.

## Impact

Code: `js/app.js` (engine registration, frame pass), `js/engine.js` (registry contract), `js/state.js` (state split, transitions move out), `js/input.js` (keeps device-to-intent only), `js/ui.js` (paints from the table), `js/constants.js` (screen table), `js/highscores.js` (persist called by the shell), `js/snake.js`/`js/pieces.js`/`js/bot.js` (read the gameplay half).

Tests: `tests/app.test.js` asserts the engine order and must be updated deliberately. `tests/helpers/dom-stub.js` has no `control-items` elements today, which is why `SELECT_CONTROL` is not unit-testable; after the split it becomes unit-testable without DOM.

Harnesses: the 13 Playwright scripts assert page ids and the `.view`/`.view.on` classes. Those ids and classes stay byte-stable, so the harnesses must keep passing unchanged.

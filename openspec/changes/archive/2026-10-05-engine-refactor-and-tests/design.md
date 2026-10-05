# Design

## D1 — js/engine.js: clock + ordered systems registry

A new module `js/engine.js` owns the fixed-timestep clock and an ordered systems registry.

- `createClock(TICK)` returns a clock that, given accumulated frame time, yields 0..N ticks (the existing accumulator pattern currently in `app.update()`).
- The registry is an ordered array of `{ name, init, update }` systems. Each system's `init(ctx)` runs once at load; its `update(ctx)` runs once per tick, in declared order.
- Systems are the modules themselves: snake, pieces, input-flow, render. `app.js` registers them in a fixed order and stops owning game logic inline.

## D2 — Inline game logic becomes systems

The logic currently inlined in `app.update()` (snake step, piece stepping, eating, spawn gating) moves into the owning modules:
- `js/snake.js`: snake step + self-collision + wrap (already has `moveSnake`, `consumePieceAtHead`)
- `js/pieces.js`: piece stepping + landing + line-clear (already has `stepPiece`, `clearFullRows`, `landPiece`)

The spawn gate (at most one falling piece; next spawns after previous landed or fully consumed) stays in `pieces.js` as part of its system.

## D3 — input split: devices vs flow

`js/input.js` splits into two layers:
- **devices** (raw → normalized intent): keyboard, pointer, and gamepad each translate raw events into a normalized intent (a direction or a menu action). No state-machine logic lives here.
- **flow** (single state machine): consumes intents and drives the one navigation path — the three duplicated MENU / RECORDS / HELP / GAME_OVER navigation paths collapse into a single flow. `setDirection` (PLAYING gate + no-reverse) is the shared steering branch, kept byte-for-byte stable.

## D4 — tests/ per-module node:test suite

The monolithic 271-check harness in `.qwen/tmp/snaketris-es-test.mjs` is replaced by a per-module `node:test` suite under `tests/`:
- A shared DOM-stub helper (stubbed `document` / `window` / canvas via Proxy, seeded RNG for determinism) — the same stubbing the harness already does, factored out.
- One spec file per module: `tests/constants.test.js`, `tests/grid.test.js`, `tests/snake.test.js`, `tests/pieces.test.js`, `tests/state.test.js`, `tests/input-flow.test.js`, `tests/app.test.js`.
- Each spec file is self-contained (imports its module, stubs the DOM, runs deterministic checks) so a new check is added by editing one small file.
- `package.json` gains `"test": "node --test tests/"`; no new runtime dep (`node --test` is built into Node).
- The old `.qwen/tmp/snaketris-es-test.mjs` is deleted once the suite is green.

## D5 — snakatris-test local skill

A local skill (`.opencode/skills/` or `.qwen/commands/`) documents: how to run `npm test`, how to add a new per-module spec, what determinism (seeded RNG) and DOM-stub mean, and the "cheap to support/extend" rule — each spec file is self-contained and runs under `node --test`.

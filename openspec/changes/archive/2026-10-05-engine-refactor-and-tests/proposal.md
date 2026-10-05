# Proposal

## Why

The game logic is currently inlined in `app.update()` as a grab-bag, and `js/input.js` carries three duplicated flow paths (keyboard / pointer / gamepad) plus the menu / records / help / game-over navigation folded into one module. Tests are a single monolithic 271-check harness in `.qwen/tmp/snaketris-es-test.mjs`. The user wants the code refactored into an engine-manner (uniform systems) and the tests brought to a state where supporting and extending them is cheap, plus a local skill that makes the project easier to work with.

## What Changes

- New `js/engine.js`: a fixed-timestep clock (`TICK`) plus an ordered systems registry; each module exposes a uniform `{ init, update }` surface and runs in declared order.
- The game logic currently inlined in `app.update()` (snake step, piece stepping, eating, spawn gating) moves into the owning modules (`js/snake.js`, `js/pieces.js`) as systems; `app.update()` becomes a thin clock-advance + ordered-systems driver.
- `js/input.js` splits into devices (raw → normalized intent: keyboard / pointer / gamepad each produce a normalized intent event) vs flow (a single state machine that consumes intents — the three duplicated menu / records / help / game-over navigation paths collapse into one).
- The monolithic harness in `.qwen/tmp/snaketris-es-test.mjs` is replaced by a per-module `node:test` suite under `tests/` (shared DOM-stub helper, seeded RNG for determinism), with an `npm test` script; the old file is deleted.
- A new local skill `snakatris-test` documents how to run and extend the `tests/` suite so future support is cheap.

## Capabilities

No spec-level behavior changes: this is a pure refactor + tooling change (engine-manner layout, test-runner migration, local skill). The observable game — mechanics, state machine, speed model, scoring, line-clear, death, wrap — is unchanged. Per OpenSpec guidance, `skip_specs: true` is set in `.openspec.yaml` and no spec deltas are invented.

## Impact

- `js/engine.js` (new), `js/app.js` (wiring to clock + ordered systems), `js/input.js` (devices/flow split), `js/snake.js`, `js/pieces.js` (inline logic becomes systems)
- `tests/` (new per-module spec suite), `.qwen/tmp/snaketris-es-test.mjs` (removed)
- `package.json` (`"test"` script; no new runtime dep — `node --test` is built in)
- Local skill `snakatris-test` (`.opencode/skills/` or `.qwen/commands/`)

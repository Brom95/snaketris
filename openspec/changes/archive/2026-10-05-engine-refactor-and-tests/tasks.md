# Tasks

- [x] 1. Create `js/engine.js` (clock + ordered systems registry)
- [x] 2. Move inline game logic from `app.update()` into `js/snake.js` / `js/pieces.js` as `{ init, update }` systems
- [x] 3. Split `js/input.js` into devices (raw → normalized intent) vs flow (single state machine); collapse the three duplicated navigation paths
- [x] 4. Update `js/app.js` wiring to advance the clock and run ordered systems; stop owning inline game logic
- [x] 5. Create the shared DOM-stub helper for `tests/`
- [x] 6. Migrate the 271-check harness into per-module `node:test` spec files (constants / grid / snake / pieces / state / input-flow / app)
- [x] 7. Delete `.qwen/tmp/snaketris-es-test.mjs` once the suite is green
- [x] 8. Add `"test": "node --test tests/"` to `package.json` (no new runtime dep)
- [x] 9. Create the `snakatris-test` local skill (run + extend the `tests/` suite)

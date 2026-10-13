# Tasks

## 1. Engine package layout and the self-containment gate

- [x] 1.1 Create the engine mount `engine/` with `engine/js/`, `engine/tests/`, `engine/docs/`, and state in `engine/README.md` that the engine imports no file outside `engine/`. Verify a check lists every `import` line under `engine/js/` and asserts each target path resolves inside `engine/`.
- [x] 1.2 Move `createClock` and `createEngine` from `js/engine.js` into `engine/js/clock.js` and `engine/js/registry.js`. Verify the engine files contain no `import` at all, matching the current zero-import leaf.
- [x] 1.3 Verify the boundary gate fails loudly: assert a deliberate `import '../../js/constants.js'` in an engine file is reported by the check in 1.1, then remove that probe.

## 2. Clock, registry and tick ownership

- [x] 2.1 Move the tick counter into the engine: the engine owns `play.tick` and increments it per tick. Verify `js/app.js` contains no `game.play.tick++` and a test asserts the counter advances once per `update()`.
- [x] 2.2 Add the optional `endTick(ctx)` phase to the registry contract, so a system may declare work that runs after every other system in the tick. Verify no entry point calls a system directly.
- [x] 2.3 Replace the second `recordsSystem.update(ctx)` call in `js/app.js update()` with the phase from 2.2. Verify a test asserts a time-up match keeps its score on the board in the tick that ended the match.
- [x] 2.4 Verify the registry still holds no painting step: assert no canvas painter and no page painter appears in the systems list.

## 3. State skeleton and field registration

- [x] 3.1 Add the engine state skeleton: two containers (`play`, `screen`), the `tick` slot, and a reset that rebuilds both halves from game-supplied `[name, initial]` tables. Verify the engine source contains no field name other than the state slot and the tick slot.
- [x] 3.2 Register the 18 play fields from the game side (`snake`, `pieces`, `snakeScore`, `tetrisScore`, `landedBlocks`, `completedPieces`, `overflow`, `dir`, `nextDir`, `snakeAcc`, `spawnAcc`, `pieceMoveAcc`, `tick`, `gameOverReason`, `role`, `result`, `durationMinutes`, `durationTicks`). Verify a test asserts the registered set equals that list.
- [x] 3.3 Register the 18 screen fields from the game side (`state`, `menuSelect`, `roleSelect`, `durationSelect`, `controlSelect`, `recordsSelect`, `p1Role`, `p2Role`, `twoPlayerMode`, `p1Selection`, `p2Selection`, `p1Model`, `p2Model`, `p1Pad`, `p2Pad`, `controlError`, `controlConfirmed`, `gameControlStep`). Verify a test asserts the registered set equals that list.
- [x] 3.4 Delete `resetPlay` and `resetScreen` as game functions; the engine reset replaces them. Verify `js/state.js` no longer assigns any play field one by one, and verify the engine exports the state root once so the game imports that same binding and mutates in place.
- [x] 3.5 Verify a write to one half changes no field of the other half, and that the engine reads only the state slot and the tick slot.

## 4. Grid in the engine

- [x] 4.1 Move `initGrid`, `getCell`, `setCell`, `getGrid` into `engine/js/grid.js`, and convert the module singleton to instance state created from `cols`, `rows`, `empty` parameters. Verify the engine grid file imports nothing.
- [x] 4.2 Pass `COLS = 10`, `ROWS = 20`, `CELL = 24`, `TICK = 1 / 60` from the game at construction. Verify the engine contains no numeric board size and the game still renders a 240x480 field box.

## 5. Intent queue, screen table and the handler map

- [x] 5.1 Move the intent queue (`pushIntent` and the per-tick drain) and the navigation switch (`applyIntent`, `stepCursor`, `selectById`, `applyBack`, `currentItem`, `itemForStep`, `opensScreen`) into the engine. Verify the engine holds the action vocabulary `menuUp`, `menuDown`, `confirm`, `select`, `toMenu` and no screen-state string.
- [x] 5.2 Move the screen table data (`SCREENS`, `SCREEN_BY_ID`) to the game side as data the game registers into the engine. Verify the engine reads the registered rows and no engine file names a screen id, a label, or a marker.
- [x] 5.3 Replace the game-specific branches behind `confirm`, `lockModel` and `startGame` with one handler-map lookup `handlers[intent.action](ctx, item)`. Verify the engine names no action verb and the game supplies `pickRole`, `lockControlModel`, `reassignP1`, `reassignP2` in the map.
- [x] 5.4 Move `applyGameOverScreen` to the game side, since it reads `twoPlayerMode` and `GAME_OVER`. Verify the game reports the next screen to the engine and the engine navigates to it.
- [x] 5.5 Verify navigation still advances from intents only: a headless test drives `MENU` to `SELECT_ROLE` to `PLAYING` with no page element present.

## 6. Presentation plumbing in the engine

- [x] 6.1 Move the canvas buffer creation and sizing, and the cell primitive `drawCell(r, c)`, into the engine. Verify the engine canvas file imports no game module and no piece painter.
- [x] 6.2 Move the viewport rule (`layoutRule`, `interfaceBandHeight`, `fieldScale`) and the field fit (`fitCanvas`) into the engine, with the field box and the interface band supplied as parameters. Verify one helper answers the stacked-layout rule and the gap, and both the band and the fit read it.
- [x] 6.3 Move the page-element lookup owner and the view-sync mechanism that toggles `.view`/`.view.on` from the registered table into the engine. Verify the element ids and the visibility classes stay byte-stable.
- [x] 6.4 Register the game painters (`drawPiece`, the snake painter, `paintRoleLine`, `fillRecords`, `scoreText`, `statusText`, `placeScore`) into the engine's per-frame pass. Verify `render.js` no longer imports `pieceCells` and `ui.js` no longer imports `entryRole`.
- [x] 6.5 Verify presentation still runs once per rendered frame: a frame that advances three ticks paints the canvas once and the page once.

## 7. Device plumbing split at the event

- [x] 7.1 Move the raw device plumbing into the engine: key and pointer listeners, pointer-to-logical conversion, `setCanvas`, `stickDir`, `pollController`, `clearControllerPrev`, and the intent queue push. Verify the engine reads no `game.screen.state`.
- [x] 7.2 Move the mapping tables to the game side: `keyToIntent`, `keyToDir`, `tapToDir`, `tapToShift`, `swipeToDir`, `keyboardModelForKey`, `roleForPad`. Verify `keyToIntent` no longer hard-codes the seven screen-state strings and reads a game-supplied state-to-intent lookup instead.
- [x] 7.3 Verify the shared steering branch (`setDirection`, the PLAYING gate plus the no-reverse rule) stays byte-for-byte stable, and that the bot still routes its direction through the same intent path.

## 8. Records shell in the engine

- [x] 8.1 Move the write policy into the engine: persist a reported result once, then clear it. Verify the engine names no board key and no entry shape.
- [x] 8.2 Keep `boardKey(minutes)`, `entryRole(entry)` and the board entry shape on the game side, registered into the shell. Verify the game core stays storage-free and a failed storage write leaves navigation and gameplay unchanged.

## 9. Engine documentation surface

- [x] 9.1 Write `engine/README.md` with three sections: what the engine guarantees, what a consumer must supply, and the invariants that must not be broken (page ids, visibility classes, the steering branch, the intents-only navigation path).
- [x] 9.2 Write `engine/docs/api.md`: every engine export with its signature, its contract, and one worked call from snaketris. Verify the engine's own suite imports every documented export, so a renamed or missing export fails a test.
- [x] 9.3 Document the extension points as recipes: add a system, add a screen row, add a handler, add a painter, add a device mapping. Verify each recipe names only engine symbols and states which contract line the consumer must satisfy.
- [x] 9.4 State the submodule mechanics in `engine/README.md`: the mount path, the relative import form, and the commit SHA pinned for GitHub Pages.

## 10. Game side after the moves

- [x] 10.1 Split `js/constants.js` into three owners: engine config values passed as parameters, game rules (`SPAWN_INTERVAL`, `BASE_FALL`, `MAX_FALL`, `SNAKE_SPEED_DELTA`, `MIN_SNAKE_TICKS`, `MAX_SNAKE_LEN`, `PIECE_BONUS`, `LINE_CLEAR_POINTS`, `LANDING_CELL_POINTS`, `TETROMINOES`, `SRS_KICKS`, `PIECE_TYPES`, `PIECE_BOX`), and page copy (`MENU_ITEMS`, `ROLE_*`, `CONTROL_SCREEN_ITEMS`, `DURATION_SCREEN_ITEMS`, `GAME_CONTROL_*`, `GITHUB_URL`). Verify no engine file imports any of them.
- [x] 10.2 Verify the game side keeps every rule: scoring, roles, the bot, the difficulty ramp, wrap-around, death conditions, SRS rotation, the countdown values.
- [x] 10.3 Update `QWEN.md` with the engine mount, the new module list, and the split rule so the project docs stay true.

## 11. Wiring and import repointing

- [x] 11.1 Keep the engine in `engine/` inside this repo and enforce the boundary with the check from 1.1. Verify no `import` line under `engine/js/` resolves outside `engine/`, and record in `engine/README.md` that extracting the directory into its own repo (a git submodule at the same path) changes no import line and no source file.
- [x] 11.2 Repoint the single page import: `snaketris.html:256` keeps one `<script type="module" src="js/app.js">`, and `js/app.js` imports across the mount with relative paths. Verify the page loads over HTTP with no other script tag added.
- [x] 11.3 Repoint the 14 unit suites under `tests/` and the 12 harness scripts under `scripts/` to the new engine paths. Verify `tests/helpers/game.js` and `tests/helpers/dom-stub.js` still drive the game without change to the page ids.

## 12. Integration checks

- [x] 12.1 Run `npm test` and `npm run verify` and record the counts against the green baseline at HEAD. Confirm every harness exit code stays 0.
- [x] 12.2 Run the engine's own suite with no game module present, and with `document`, `window` and `localStorage` absent. Verify it finishes a tick and drives navigation without a page.
- [x] 12.3 Run the ripwire checks: `quality_baseline` before the work and `quality_delta` before declaring done. Confirm any gated row is not an index artifact, per the known dirty-tree behaviour.
- [x] 12.4 Run `openspec validate` on the change and confirm the `engine-architecture` delta and the new `engine-api` capability resolve.

# Proposal

## Why

The engine mechanism and the snaketris rules sit in one module graph today: 14 modules, 241 symbols, 227 edges. Nothing in that graph says which half is reusable. The plan is to ship the engine as a git submodule, and a submodule cannot import a file from the parent repo. So the boundary must become explicit, mechanical, and documented before anything moves.

The boundary is welded in `js/app.js`, which holds engine mechanism and game knowledge in the same 60 lines:

- `game.play.tick++` — the tick counter is engine bookkeeping, but the entry owns it.
- `recordsSystem.update(ctx)` runs twice: once inside `engine.update`, once after `advanceCountdown()`. The registry cannot express "run this system again at the end of the tick".
- `syncViews(game.screen.state === 'RECORDS' ? loadBoard(selectedBoardMinutes()) : null)` — the entry knows a screen-state noun and the leaderboard.
- `pollController()`, `render()`, `syncViews()`, `fitField()` — presentation work that the entry schedules by hand.

The shared state is the real coupling, not the folder names. `js/state.js` owns one mutable `game` object, and 7 modules import it and mutate it in place. `js/screens.js newScreen()` declares 17 screen-half fields; `js/state.js resetPlay()` resets 13 play-half fields. Both lists are game nouns, and the engine today has no way to own the containers without owning the names.

Every candidate module imports `./constants.js`, so no candidate can move as it stands. `js/constants.js` mixes three unrelated groups: engine config (`COLS`, `ROWS`, `CELL`, `TICK`), game rules (`SPAWN_INTERVAL`, `BASE_FALL`, `MAX_FALL`, `TETROMINOES`, `SRS_KICKS`, `PIECE_BONUS`, `LINE_CLEAR_POINTS`, `LANDING_CELL_POINTS`), and page copy (`MENU_ITEMS`, `ROLE_SCREEN_ITEMS`, `GITHUB_URL`, emoji markers). Two modules cannot move at all as units: `js/render.js` imports `pieceCells` from `js/pieces.js`, and `js/ui.js` imports `entryRole` from `js/highscores.js` plus the game painters.

The engine also has no documented surface. `engine-architecture` (8 requirements) says nothing about what a consumer must supply or may extend, so a second game built on this engine has no contract to read.

## What Changes

- **New engine package (a git submodule, zero imports into parent-repo files).** It owns every piece of mechanism that names no game noun: the fixed-timestep clock, the ordered systems registry, the state skeleton (two halves plus the tick counter), the grid, the intent queue, the screen-table navigation, the handler-map call site, the presentation plumbing (canvas buffer setup, the cell primitive, the viewport-fit rule, the page-element owner, the view-sync mechanism), and the records shell ("persist a reported result once").
- **New game package (snaketris only).** It supplies names, values and behaviour into that mechanism: the 13 play fields and 17 screen fields, the screen table rows, the handler map, the device-to-intent maps, the painters, the tetromino and SRS rules, the snake and bot rules, the scoring and difficulty rules, the leaderboard key and entry shape.
- **BREAKING (internal)** `js/constants.js` splits into three owners: engine config parameters, game rules, page copy. The engine receives the grid size and the tick as parameters; it imports no constant from the game.
- **BREAKING (internal)** `js/render.js` and `js/ui.js` split. The engine keeps the canvas buffer, `drawCell`, the viewport rule (`layoutRule`, `interfaceBandHeight`, `fieldScale`) and the element lookup; the game keeps `drawPiece`, `paintRoleLine`, `fillRecords`, `scoreText`, `statusText`.
- **BREAKING (internal)** `js/devices.js keyToIntent` stops hard-coding the seven screen-state strings (`MENU`, `SELECT_ROLE`, `SELECT_DURATION`, `PLAYING`, `RECORDS`, `HELP`, `GAME_OVER`). The game supplies the state-to-intent lookup; the engine drives it.
- **New** The engine documents its public surface inside the submodule: every export with its contract, the list of what a consumer must supply, the extension points (add a system, add a screen row, add a handler, add a painter), and snaketris as the worked reference consumer.
- Unchanged: every observable player behavior. The screens, labels, order, scoring, roles, bot, difficulty ramp, wrap-around, death conditions and SRS rotation keep behaving as the existing capabilities specify.

## Capabilities

### New Capabilities

- `engine-api`: the engine's documented public surface — what a consumer must supply, what the engine guarantees, and where a consumer may extend it.

### Modified Capabilities

- `engine-architecture`: the state halves and the screen table move from "split inside this repo" to "owned by the engine, supplied by the game"; the engine gains requirements that it name no game noun, own the clock and grid and viewport, and stay self-contained.

## Impact

Code: `js/app.js` (the entry becomes the game's consumer: it supplies the tables and calls the engine), `js/engine.js` (clock and registry), `js/state.js` (skeleton plus field registration), `js/grid.js` (singleton → instance, three parameters), `js/screens.js` (table data plus handler map), `js/devices.js` and `js/input.js` (device plumbing vs mapping tables), `js/ui.js` and `js/render.js` (split), `js/constants.js` (three-way split), `js/highscores.js` (shell vs key and entry shape).

Tests: 14 unit suites under `tests/` and 13 Playwright harnesses under `scripts/` repoint their import paths. The engine gets its own suite that runs with no page object and no storage object. `tests/app.test.js` keeps asserting the registry order.

Page: one line changes in `snaketris.html:256`, the single `<script type="module" src="js/app.js">`. Element ids and the `.view`/`.view.on` classes stay byte-stable, so the page harnesses keep addressing the same elements.

Packaging: the engine becomes a git submodule pinned by commit SHA, because GitHub Pages serves a snapshot and cannot follow a moving ref.

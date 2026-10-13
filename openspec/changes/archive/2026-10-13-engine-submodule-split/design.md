# Design

## Context

Verified composition of the current graph (14 modules, 241 symbols, 227 edges):

- `js/engine.js` exports two factories: `createClock(tick)` (accumulator, `js/engine.js:9`) and `createEngine(systems)` (loops ordered `{ name, init, update }` entries, `js/engine.js:26`). It imports nothing. It is the only clean leaf today.
- `js/app.js` registers `[botSystem, snakeSystem, piecesSystem, recordsSystem, screenSystem]` and passes `const ctx = { game }`. One shared mutable singleton is the whole engine contract today.
- `js/state.js` owns the single `game` object. 7 modules import `game` and mutate it in place: `render.js`, `input.js`, `bot.js`, `snake.js`, `pieces.js`, `screens.js`, `devices.js`, `highscores.js`.
- Play half: 18 fields. `resetPlay` (`js/state.js:56`) sets 12 of them (`pieces`, `snakeScore`, `tetrisScore`, `landedBlocks`, `completedPieces`, `overflow`, `snakeAcc`, `spawnAcc`, `pieceMoveAcc`, `tick`, `gameOverReason`, `result`); `resetSnake` sets `snake`, `dir`, `nextDir`; the inline declaration sets `role`, `durationMinutes`, `durationTicks`; `advanceCountdown` (`js/state.js:136`) reads `tick` and `durationTicks`.
- Screen half: 18 fields, all declared in `newScreen()` (`js/screens.js:325`): `state`, `menuSelect`, `roleSelect`, `durationSelect`, `controlSelect`, `recordsSelect`, `p1Role`, `p2Role`, `twoPlayerMode`, `p1Selection`, `p2Selection`, `p1Model`, `p2Model`, `p1Pad`, `p2Pad`, `controlError`, `controlConfirmed`, `gameControlStep`.
- `applyIntent` (`js/screens.js:625`) is the navigation switch. Its action vocabulary is `menuUp`, `menuDown`, `confirm`, `select`, `lockModel`, `toMenu`, `startGame`. The bodies behind `confirm`, `lockModel` and `startGame` reach game verbs (`pickRole`, `lockControlModel`, `reassignP1`, `reassignP2`).
- `keyToIntent` (`js/devices.js:131`) hard-codes seven screen-state strings and returns `{ action: 'toMenu' }` literals.
- `js/constants.js` holds 60+ exports in three unrelated groups: engine config (`COLS`, `ROWS`, `CELL`, `TICK`, `BOARD_W`, `BOARD_H`), game rules (`SPAWN_INTERVAL`, `BASE_FALL`, `MAX_FALL`, `SNAKE_SPEED_DELTA`, `MAX_SNAKE_LEN`, `PIECE_BONUS`, `LINE_CLEAR_POINTS`, `LANDING_CELL_POINTS`, `TETROMINOES`, `SRS_KICKS`, `PIECE_TYPES`, `PIECE_BOX`), page copy (`MENU_ITEMS`, `ROLE_ITEMS`, `ROLE_MARKERS`, `ROLE_SCREEN_ITEMS`, `CONTROL_SCREEN_ITEMS`, `DURATION_SCREEN_ITEMS`, `GAME_CONTROL_*`, `GITHUB_URL`, emoji markers).
- Cross-package edges that block a mechanical move: `render.js` imports `pieceCells` from `pieces.js`; `ui.js` imports `entryRole` from `highscores.js`; every candidate imports `./constants.js`.
- The unit suite is green at HEAD. `npm run verify` runs 12 harness scripts. `scripts/harness.mjs` is the shared harness layer.

See proposal.md for the motivation.

## Goals / Non-Goals

**Goals:**

- One engine package that imports nothing from outside itself, so it can be mounted as a git submodule.
- The engine holds every piece of mechanism that names no game noun: clock, registry, state skeleton, grid, intent queue, screen-table navigation, handler-map call site, presentation plumbing, records shell.
- The game supplies names, values and behaviour into that mechanism and owns every rule.
- The engine documents its public surface: the contract a consumer must satisfy, the guarantees the engine gives, and the extension points a consumer may use.
- The split is mechanical: a reviewer can decide "engine or game" for any symbol from one rule.

**Non-Goals:**

- No new screen, label, item order, visual style, or CSS change. `snaketris.html` element ids and the `.view`/`.view.on` classes stay byte-stable.
- No change to gameplay rules: scoring, roles, the bot, the difficulty ramp, wrap-around, death conditions, SRS rotation, the countdown values.
- No framework, no build step, no external asset, no backend, no npm package. The delivery unit is a git submodule, not a registry package.
- Support for a second game beyond the documented contract. The contract must be readable and extensible; a second game is not part of this change.
- Breaking the `snake.js <-> pieces.js` cycle. Both sides stay on the game side.

## Decisions

**D1. The engine lives in an `engine/` directory inside this repo; the submodule extraction is a later mechanical step.**
The engine holds `engine/js/*.js`, `engine/tests/`, `engine/docs/`. The game imports across the directory boundary with relative ESM paths (`js/app.js` imports `../engine/js/clock.js`). `snaketris.html:256` keeps one `<script type="module" src="js/app.js">`, so only that one import line changes. The boundary is enforced by a check that lists every `import` line under `engine/js/` and asserts each target resolves inside `engine/`. Reason: the user plans submodule delivery later, and the import form is identical for a directory and for a submodule mounted at the same path, so moving the directory into its own repo changes no import line and no source file. Alternative considered: register a real submodule now; rejected, it needs a remote repo and a pinned SHA before the engine has a working suite. Alternative considered: an npm package; rejected, it adds a build/install step to a repo that has none.

**D2. The split rule is one test, applied per symbol: a symbol is engine-side if and only if it names no game noun.**
A game noun is any identifier whose meaning exists only in snaketris: a screen-state string, a role name, a tetromino, a score field, a label, a marker, a leaderboard key. The borderline cases are resolved in this document and stay resolved:

| Symbol today | Verdict | Why |
| --- | --- | --- |
| `createClock`, `createEngine` | engine | no noun |
| `initGrid`, `getCell`, `setCell`, `getGrid` | engine | the grid is a sized cell board; `COLS`, `ROWS`, `EMPTY` become parameters |
| `drawCell(r, c)`, canvas buffer setup | engine | a cell rectangle at a grid coordinate |
| `layoutRule`, `interfaceBandHeight`, `fieldScale`, `fitCanvas` | engine | viewport arithmetic over a field box and an interface band |
| `pushIntent`, `applyIntent`, `stepCursor`, `selectById`, `applyBack`, `currentItem`, `itemForStep`, `opensScreen` | engine | cursor movement over table data |
| the `handlers[action]` call site inside `applyAction` | engine | one lookup, no action name |
| `recordsSystem` "persist a reported result once, then clear it" | engine | the write policy; the board shape is game-side |
| `resetGame`, the `tick` counter, the two halves | engine | lifecycle and containers |
| `keyToIntent`, `keyToDir`, `tapToDir`, `tapToShift`, `swipeToDir`, `keyboardModelForKey`, `roleForPad` | game | they name screen states, roles and layouts |
| `stickDir`, `pollController`, `clearControllerPrev`, `toLogical`, `setCanvas`, the pointer event handlers | engine | raw device plumbing |
| `pickRole`, `lockControlModel`, `reassignP1`, `reassignP2`, `offersItem` bodies | game | they name roles and layouts |
| `drawPiece`, `paintRoleLine`, `fillRecords`, `scoreText`, `statusText`, `placeScore` | game | they name pieces, roles and scores |
| `boardKey(minutes)`, `entryRole(entry)`, `DURATION_MINUTES` | game | leaderboard key and duration values are snaketris nouns |
| `advanceCountdown` | game | it reads `durationTicks` and reports `'time-up'`; the engine keeps only "a system reported the end" |

**D3. The engine owns the state skeleton; the game registers field names into it.**
The engine declares the two containers and their lifecycle: `play` and `screen`, the `tick` counter, and the reset that rebuilds both halves. The game supplies two field tables — 18 `[name, initial]` pairs for the play half, 18 for the screen half — and the engine fills the containers from them. The engine reads exactly two names: the state slot (for navigation) and the tick slot (for its own counter). The game declares which name plays which role. Every other field the engine passes through untouched, so `snakeScore` never appears in the engine. `resetPlay` and `resetScreen` stop existing as game functions; the engine's reset replaces them. Alternative considered: the game owns all state and the engine never touches it; rejected by the user's explicit choice of the skeleton option.

**D4. The screen table stays declarative data, and game-specific item work goes through a handler map.**
The engine owns the table shape (`rows of {id, items[{label, marker, opens, action}]}`), the cursor, the queue and the navigation switch. The game supplies the rows and a map `handlers[actionId](ctx, item)`. The engine's `applyAction` becomes one lookup: `handlers[intent.action](ctx, item)`. It never names `pickRole` or `lockModel`. Alternative considered: the engine keeps the switch and the game passes callbacks per case; rejected, it keeps the action vocabulary in both packages.

**D5. `constants.js` splits into three owners, and engine config becomes parameters.**
`engine/js/config.js` holds the shape (a sized board, a tick step) and receives values. The game passes `COLS = 10`, `ROWS = 20`, `CELL = 24`, `TICK = 1/60` at construction. Game rules and page copy stay in the game's `js/constants.js`. Alternative considered: the engine imports the game's constants through a re-export shim; rejected, it breaks the submodule rule that the engine imports nothing from the parent.

**D6. Presentation splits at the primitive.**
Engine side: canvas buffer creation and sizing, `drawCell`, the viewport rule, the field fit, the page-element lookup owner, the view-sync mechanism that toggles `.view`/`.view.on` from the table. Game side: every painter that names a noun (`drawPiece`, the snake painter, `paintRoleLine`, `fillRecords`, `scoreText`, `statusText`). The game registers its painters into the engine's per-frame pass. This resolves the two blocking edges: `render.js` no longer imports `pieceCells` across the boundary, because the piece painter is registered in, and `ui.js` no longer imports `entryRole`, because the records board is passed in.

**D7. Device plumbing splits at the event.**
Engine side: key/pointer/gamepad listeners, raw pad polling, pointer-to-logical conversion, the intent queue push. Game side: the mapping tables that turn a raw event into an intent or a direction. `keyToIntent` moves to the game and reads a state-to-handler lookup the game registers, so the engine holds no screen-state string.

**D8. The registry gains an explicit end-of-tick phase.**
Today `js/app.js update()` calls `recordsSystem.update(ctx)` a second time after `advanceCountdown()`. That double call is engine ordering hidden in the game entry. The engine gains an optional `endTick(ctx)` phase that systems may declare, and the entry stops calling any system directly. The countdown becomes a game system that declares `endTick`, so a time-up match keeps its score on the board without a second call from outside. Alternative considered: keep the double call in the entry; rejected, it puts engine ordering back into the game.

**D9. The engine documents its surface inside the submodule.**
`engine/README.md` states the contract in three sections: what the engine guarantees (clock, ordering, one paint per frame, separate halves), what a consumer must supply (the two field tables, the screen table, the handler map, the mapping tables, the painters, the rules systems), and the invariants that must not be broken (page ids and visibility classes, the steering branch, the intent-only navigation path). `engine/docs/api.md` documents every export with its signature, its contract, and one worked call from snaketris. Extension points are documented as recipes: add a system, add a screen row, add a handler, add a painter, add a device mapping. Alternative considered: document in the parent repo's `QWEN.md`; rejected, the submodule must carry its own docs so a consumer without this repo can read them.

**D10. The engine gets its own test suite inside the submodule.**
`engine/tests/` drives the clock, the registry, the skeleton, the grid, the navigation and the presentation plumbing with no game module present. The game's 14 suites and 12 harnesses repoint their import paths. Alternative considered: keep all tests in the parent repo; rejected, the engine must be provable on its own before a second consumer exists.

**D11. The submodule pin is deferred, not done now.**
The engine stays a directory in this repo. The extraction to a git submodule at the same `engine/` path is a later step, and the import form does not change. When that extraction happens, GitHub Pages serves a snapshot, so the parent must record the pinned commit SHA and the deploy note must name it. Reason: pinning a remote repo before the engine has a working suite would ship an unproven engine.

## Risks / Trade-offs

- **The engine is small.** As scoped it is roughly 150 lines of real code: a clock, a registry, a skeleton, a grid, a viewport fit, menu navigation, a records shell. It is a shell, not a framework. The value is the explicit contract and the documented extension points, not breadth.
- **Submodule plus Pages is a pinning hazard.** A stale SHA ships an old engine. Mitigation: the deploy note names the pinned SHA, and the engine's own suite runs in `npm run verify`.
- **The blast radius is large and mechanical.** 14 unit suites and 12 harness scripts repoint imports; 1 HTML line changes. Mitigation: the moves are mechanical once D2's table is fixed, so the repointing is a search-and-replace pass, not a rewrite.
- **The singleton convention is at risk.** The repo's stated convention is "import `game` and mutate in place", which keeps references fresh across module boundaries. Under D3 the engine owns the root. Mitigation: the engine exports the root once and the game imports that same binding; no module reassigns it.
- **The split can be over-eager.** A symbol that reads one game noun is game-side, even when its mechanism looks generic (`applyGameOverScreen` reads `twoPlayerMode` and `GAME_OVER`). Mitigation: D2's table is the arbiter, and the engine's self-containment gate (D1) fails the build if a noun crosses the boundary.
- **Documentation can drift from code.** Mitigation: `docs/api.md` lists exports by name, and the engine's suite imports every documented export, so a missing or renamed export fails a test.

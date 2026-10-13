# Engine

`engine/` holds the reusable mechanism of this project. Everything in it works for
any game. It names no game noun: no snake, no piece, no score, no board key, no
screen name.

The split rule decides where a symbol lives:

- A symbol names no game noun → it belongs to the engine.
- A symbol names one game noun → it belongs to the consumer.

The engine never imports a consumer file. A consumer imports engine files by
relative path and hands its own values, tables and handlers to the engine at
load time.

## Self-containment

No file under `engine/js/` imports anything outside `engine/`.
`engine/tests/boundary.test.js` lists every `import` line under `engine/js/` and
asserts each target path resolves inside `engine/`. It also asserts that the four
mechanism leaves (`clock.js`, `grid.js`, `state.js`, `registry.js`) import nothing
at all, and that no engine source names a consumer field.

Run it with `node --test engine/tests/boundary.test.js`.

## What the engine guarantees

| Module | Guarantee |
| --- | --- |
| `js/clock.js` | A frame advances by whole ticks. The remainder carries into the next frame. |
| `js/registry.js` | Systems run in the declared order. `init` runs once at load, `update` runs once per tick, `endTick` runs after every other system in that tick. The engine owns the tick counter and bumps `ctx.state.play.tick` once per `update`. |
| `js/state.js` | Two containers, `play` and `screen`, filled from consumer tables. A reset clears one half and refills it from its table. The `afterReset` hook runs only on a reset. |
| `js/grid.js` | A `rows × cols` cell array built from parameters. Cell identities are values the consumer supplies; the engine never reads one. |
| `js/navigation.js` | Screen movement comes from a consumer row table and a consumer handler map. The engine owns seven intent verbs only: `menuUp`, `menuDown`, `confirm`, `select`, `toMenu`, `lockModel`, `startGame`. |
| `js/present.js` | Painters run in registration order, in two passes: the canvas pass and the page pass. |
| `js/interface.js` | One owner for page elements. Every id a registered row names is looked up once and handed to whoever paints or hit-tests it. |
| `js/layout.js` | One viewport rule answers both the stacked-layout test and the field gap, so the band and the fit cannot drift apart. |
| `js/devices.js` | Pointer listeners, pointer capture, pointer→surface coordinates, thumbstick quantization, gamepad polling and edge clearing. |
| `js/records.js` | A reported batch persists exactly once, then clears. A writer that throws cannot report the same batch again. |

The engine reads `document`, `window` and `localStorage` only inside called
functions, never at module load. The engine suite therefore runs with no DOM,
no window and no storage present.

## What a consumer must supply

| Module | Registration call | The consumer supplies |
| --- | --- | --- |
| `js/registry.js` | `createEngine(systems)` | The ordered systems list. |
| `js/clock.js` | `createClock(tick)` | The tick length in seconds. |
| `js/state.js` | `configureState({ play, screen, afterReset })` | Two `[name, initial]` tables and the reset hook. |
| `js/grid.js` | `createGrid({ cols, rows, empty })` | The dimensions and the empty-cell identity. |
| `js/navigation.js` | `registerNavigation({ rows, handlers, offers, backItems, backControls, stateField })` | The screen table, the handler map, the offer predicate, the back-item and back-control action sets, and the name of the screen-state field. |
| `js/canvas.js` | `createCanvas({ width, height, cell })` | The buffer size and the cell size. |
| `js/layout.js` | `createLayout({ boardWidth, boardHeight, stackMaxWidth, columnMin, gap, gapMobile })` | The field box and the page's gap and column values. |
| `js/interface.js` | `createInterface()` then `indexRows(rows)` | The same row table the navigation reads. |
| `js/present.js` | `registerCanvasPainter(name, painter)` / `registerPagePainter(name, painter)` | The painters and their draw order. |
| `js/devices.js` | `configureSurface({ width, height })` and `registerDeviceResolvers({ gesture, shape, key, page, pad })` | The surface size and the resolvers that turn raw input into intents. |
| `js/records.js` | `registerReport({ field, writer })` | The name of the report field in the play half and the writer for one entry. |

## Invariants that must not be broken

1. **Page ids.** The interface indexes the ids a registered row names: `row.view`,
   `row.items[].id`, `row.controls[].id`. Renaming one page element renames the
   row entry too, or hit-testing and view toggles drift apart.
2. **Visibility classes.** `.view` hides by default and `.view.on` shows it.
   `show(el, on)` toggles only the `on` class and keeps the base class. A
   consumer must not restyle visibility by another class.
3. **The steering branch.** One shared steering path serves every direction
   source: the player, the bot, touch and gamepad. Its two rules, the PLAYING
   gate and the no-reverse rule, live in the consumer's handler and must stay
   byte-for-byte stable. A new input path routes through that handler; it does
   not copy it.
4. **The intents-only navigation path.** Every menu action reaches the engine
   through `pushIntent(intent)` and is applied by `drainIntents()`. A consumer
   never calls `gotoScreen` or a handler directly from an input event.
5. **No consumer import in the engine.** The boundary check in
   `engine/tests/boundary.test.js` is the enforcement. A failing check is a
   design error, not a workaround.

## Mounting the engine as a submodule

- **Mount path:** `engine/`. The engine root is one directory, and every file it
  needs lives under it.
- **Import form inside the engine:** a relative sibling path, for example
  `import { state } from './state.js';`.
- **Import form from a consumer:** a relative path into the mount, for example
  `import { createEngine } from '../engine/js/registry.js';`.
- **Extraction changes no import line.** Engine-internal imports are siblings
  (`./x.js`) and consumer imports address `engine/js/...`. Moving `engine/` into
  a real submodule moves the directory and keeps every path. Only the mount point
  changes.
- **GitHub Pages pins a commit.** The published page serves the tree at
  `9d12b0d7883a9b10fbe0d44bd099196f85ee9fd8` (2026-10-13). Update this pin when
  the engine changes, so the engine copy and the game copy are known to match.

## Documentation

- `docs/api.md` — every engine export, its signature, its contract and one
  worked call from this project.
- `docs/recipes.md` — the extension points: add a system, add a screen row, add
  a handler, add a painter, add a device mapping.
- `engine/tests/api.test.js` imports every documented export, so a renamed or
  missing export fails a test.

# Engine API

Every export under `engine/js/`. Each entry gives the signature, the contract the
engine satisfies, the contract the consumer must satisfy, and one worked call
from this project. `engine/tests/api.test.js` imports every name listed here, so
a renamed or missing export fails a test.

---

## js/clock.js

### `createClock(tick)`

- **Contract (engine):** returns an object with `advance(dt)`. `advance` adds a
  frame's elapsed seconds to an accumulator and returns the whole ticks that
  frame must run (0..N). The remainder carries into the next frame.
- **Consumer must supply:** `tick`, the tick length in seconds.
- **Worked call** (`js/app.js`):

  ```js
  const clock = createClock(TICK); // TICK = 1/60
  ```

### `advance(dt)` (instance)

- Returns whole ticks; never advances the accumulator by less than it returns.
- **Worked call** (`js/app.js`):

  ```js
  const n = clock.advance(dt);
  for (let i = 0; i < n; i++) update();
  ```

---

## js/registry.js

### `createEngine(systems)`

- **Contract (engine):** returns `{ init(ctx), update(ctx), endTick(ctx) }`.
  `init` calls every system's `init` once, in declared order. `update` bumps the
  tick once, then calls every system's `update` in declared order. `endTick`
  calls every system's `endTick` in declared order, after every `update` of that
  tick. A system that omits a phase is skipped.
- A **system** is a plain object `{ name, init?, update?, endTick? }`.
- **Consumer must supply:** the ordered systems list. Order is the whole
  contract: a system that reports must be registered after the systems that
  produce the report.
- **Worked call** (`js/app.js`):

  ```js
  const systems = [botSystem, snakeSystem, piecesSystem, countdownSystem, recordsSystem, screenSystem];
  const engine = createEngine(systems);
  ```

### `init(ctx)` / `update(ctx)` / `endTick(ctx)` (instance)

- **Worked call** (`js/app.js`):

  ```js
  function update() {
    engine.update(ctx);
    engine.endTick(ctx);
  }
  ```

- The engine passes `ctx` to every system unchanged. This project uses
  `const ctx = { state: game }`; the engine reads only `ctx.state.play.tick`.

---

## js/state.js

### `state` (const object)

- **Contract (engine):** the single skeleton, `{ play: {}, screen: {} }`. Both
  containers fill at `configureState` and stay one object identity forever, so a
  consumer may hold a reference to them across a reset.
- **Worked call** (`js/state.js`):

  ```js
  export const game = state;
  ```

### `configureState(tables)`

- **Signature:** `configureState({ play, screen, afterReset })`, where `play`
  and `screen` are arrays of `[name, initial]` pairs.
- **Contract (engine):** stores both tables, then fills both containers
  immediately. The engine names no field of its own beyond the containers.
- **Consumer must supply:** every field name the consumer reads.
- **Worked call** (`js/state.js`):

  ```js
  configureState({
    play: PLAY_FIELDS,
    screen: screenFields(),
    afterReset: () => {
      initGrid();
      resetSnake();
    },
  });
  ```

### `resetPlay()`

- **Contract (engine):** clears the play container, refills it from the play
  table, then runs `afterReset` once. The hook runs only on a reset, never at
  `configureState`.
- **Worked call** (`js/state.js` `resetGame`).

### `resetScreen()`

- **Contract (engine):** clears the screen container and refills it from the
  screen table. Runs no hook.
- **Worked call** (`js/state.js` `resetGame`).

### `resetState()`

- **Contract (engine):** `resetPlay()` then `resetScreen()`.
- **Worked call** (`js/state.js`):

  ```js
  export function resetGame() {
    resetState();
    ...
  }
  ```

---

## js/grid.js

### `createGrid({ cols, rows, empty })`

- **Contract (engine):** returns an instance holding its own `rows × cols` array.
  Two instances never share an array. `empty` is the fill value; the engine never
  interprets a cell value.
- **Consumer must supply:** the dimensions and the empty-cell identity.
- **Worked call** (`js/grid.js`):

  ```js
  const gridInstance = createGrid({ cols: COLS, rows: ROWS, empty: EMPTY });
  ```

### `init()` / `getCell(row, col)` / `setCell(row, col, id)` / `getGrid()` (instance)

- `init` rebuilds the array from `empty`; `getGrid` hands the whole array to a
  painter that walks it once.
- **Worked call** (`js/render.js`):

  ```js
  import { getGrid } from './grid.js';
  ```

---

## js/navigation.js

### `registerNavigation(nav)`

- **Signature:** `registerNavigation({ rows, handlers, offers, backItems, backControls, stateField })`.
- **Contract (engine):** indexes the rows by `row.id`, copies the handler map,
  and records the field name it writes the screen id into (`stateField`,
  default `'state'`). Row keys the engine reads: `id`, `cursor`
  (`'arrow' | 'step' | 'none'`), `selection`, `stepField`, `lockAction`,
  `startAction`, `items`, `controls`, `view`, `field`.
- **Consumer must supply:** the row table, the handler map keyed by action verb,
  the `offers` predicate, and the back-item / back-control action sets.
- **Worked call** (`js/screens.js`):

  ```js
  registerNavigation({
    rows: SCREENS,
    handlers: HANDLERS,
    offers: offersItem,
    backItems: BACK_ITEM_ACTIONS,
    backControls: BACK_CONTROL_ACTIONS,
    stateField: 'state',
  });
  ```

### `gotoScreen(screenId)`

- **Contract (engine):** writes `screenId` into the registered screen-state
  field. The consumer never names that field itself.
- **Consumer must supply:** the screen id, which is one of its own row ids.

### `itemForStep(screenId, step)`

- **Contract (engine):** the item at `step` in that row, or `null` for an
  unknown row.

### `opensScreen(screenId, index)`

- **Contract (engine):** the `opens` value that item names, or `null`. It never
  applies the value; the consumer's handler does.

### `currentItem(screenId)`

- **Contract (engine):** the item the row's cursor points at. An `arrow` row
  reads `state.screen[row.selection]`; a `step` row reads
  `state.screen[row.stepField]`; a `none` row has no current item.

### `pushIntent(intent)`

- **Contract (engine):** appends a non-null intent to the queue. It applies
  nothing at this point.
- **Worked call** (`js/input.js` `handleIntent` default branch):

  ```js
  pushIntent(intent);
  ```

### `drainIntents()`

- **Contract (engine):** empties the queue and applies every intent in the
  order the devices produced it.
- **Worked call** (`scripts/verify-views.mjs` and every stub harness):

  ```js
  drainIntents();
  ```

### `screenSystem` (const object)

- **Contract (engine):** the `{ name: 'screen', init, update }` entry. Its
  `init` empties the queue; its `update` drains it. Register it in the systems
  list so navigation runs inside the tick.
- **Worked call** (`js/app.js` systems list): `screenSystem`.

### The intent vocabulary the engine owns

`menuUp`, `menuDown`, `confirm`, `select`, `toMenu`, `lockModel`, `startGame`.
Every other action verb belongs to the consumer's handler map.

---

## js/canvas.js

### `createCanvas({ width, height, cell })`

- **Contract (engine):** returns the buffer owner. `attach(el)` sizes the buffer
  once and takes its 2d context; the buffer never resizes later, only the CSS
  display size changes.
- **Worked call** (`js/render.js`):

  ```js
  const field = createCanvas({ width: BOARD_W, height: BOARD_H, cell: CELL });
  ```

### `attach(el)` / `context()` / `width()` / `height()` / `drawCell(r, c)` (instance)

- `drawCell(r, c)` fills one inset cell at the current fill style, so grid lines
  stay readable between cells.
- **Worked call** (`js/pieces.js`):

  ```js
  const c2d = pctx.field.context();
  pctx.field.drawCell(r, c);
  ```

---

## js/layout.js

### `createLayout({ boardWidth, boardHeight, stackMaxWidth, columnMin, gap, gapMobile })`

- **Contract (engine):** returns the viewport owner. `scale()` is the scale that
  contains the whole field in the viewport, keeping aspect ratio. `rule()`
  answers both whether the interface stacks above the field and the vertical gap
  the field keeps; both `band` and `fit` read it, so they cannot drift apart.
- **Worked call** (`js/ui.js`):

  ```js
  const layout = createLayout({
    boardWidth: BOARD_W,
    boardHeight: BOARD_H,
    stackMaxWidth: UI_STACK_MAX_WIDTH,
    columnMin: UI_COLUMN_MIN,
    gap: FIELD_V_GAP,
    gapMobile: FIELD_V_GAP_MOBILE,
  });
  ```

### `scale()` / `rule()` / `band(el)` / `fit(el, reserved)` (instance)

- `band(el)` is the height a stacked interface takes from the field, gap
  included; it is `0` when the interface shares a track beside the field.
- `fit(el, reserved)` sets the element's CSS width and height so the whole field
  fits, preserving aspect ratio, with no upper cap.
- **Worked call** (`js/input.js` `fitCanvas`):

  ```js
  sizeField(canvas, reserved);
  ```

---

## js/interface.js

### `createInterface()`

- **Contract (engine):** one owner for page elements. It looks an id up once and
  caches it, so the page and the row table cannot drift apart silently.
- **Worked call** (`js/ui.js`):

  ```js
  const iface = createInterface();
  ```

### `lookup(id)` / `show(el, on)` / `element(id)` (instance)

- `lookup` resolves an id through `document.getElementById` and caches it.
- `show` toggles the `on` class and keeps the base class; `.view` hides by
  default and `.view.on` shows it. A null element is ignored.
- `element(id)` returns the cached element without a DOM lookup.

### `indexRows(rows)` (instance)

- **Contract (engine):** indexes every id a row names — `row.view`, each
  `row.items[].id`, each `row.controls[].id` — in row order. An absent element
  keeps its slot, so every table index stays true.
- **Worked call** (`js/ui.js` `initUi`):

  ```js
  iface.indexRows(SCREENS);
  ```

### `items(screenId)` / `controls(screenId)` / `hitTargets(screenId)` (instance)

- `hitTargets` is the row's items followed by its controls: the one list both
  the painter and the hit-test read.
- **Worked call** (`js/input.js` `onInterfacePointerUp`):

  ```js
  const el = firstHit(hitTargets(state), x, y);
  if (el) pushIntent({ action: 'select', id: el.id });
  ```

### `highlight(list, index)` (instance)

- **Contract (engine):** highlights one element by index; `-1` clears the whole
  list.
- **Worked call** (`js/ui.js`): `highlightItem(row.items, game.screen.menuSelect)`.

### `paintViews(rows, screenId)` (instance)

- **Contract (engine):** toggles every row's view element from the current
  screen id and reports whether that row shows the field.
- **Worked call** (`js/ui.js`):

  ```js
  const fieldOn = iface.paintViews(SCREENS, state);
  ```

---

## js/present.js

### `registerCanvasPainter(name, painter)` / `registerPagePainter(name, painter)`

- **Contract (engine):** stores one painter under a name. The first registration
  fixes its slot; a later registration with the same name replaces that painter
  and keeps the slot.
- **Consumer must supply:** a painter that reads one paint context.
- **Worked call** (`js/render.js` `initRender`):

  ```js
  registerCanvasPainter('field', paintField);
  registerCanvasPainter('snake', paintSnake);
  registerCanvasPainter('pieces', paintPieces);
  ```

### `paintCanvas(ctx)` / `paintPage(ctx)`

- **Contract (engine):** runs every registered painter, in draw order, with the
  same context object.
- **Worked call** (`js/render.js`):

  ```js
  export function render() {
    paintCanvas(paintCtx);
  }
  ```

- **Worked call** (`js/ui.js` `syncViews`): `paintPage(paintCtx)`.

### `canvasOrder()` / `pageOrder()`

- **Contract (engine):** the registered names, in draw order. A consumer reads
  them to check that its painters hold the slots it asked for.

---

## js/devices.js

### `configureSurface({ width, height })`

- **Contract (engine):** the logical size a pointer displacement is measured in.
  The consumer supplies it once, at module load, so the engine names no board
  number.
- **Worked call** (`js/devices.js`):

  ```js
  configureSurface({ width: BOARD_W, height: BOARD_H });
  ```

### `registerDeviceResolvers(resolvers)`

- **Signature:** `registerDeviceResolvers({ gesture, shape, key, page, pad })`.
- **Contract (engine):** each slot is the last non-null resolver registered.
  Registering is idempotent, so a consumer may call it more than once.
  `gesture` maps a start/end pair to an intent; `shape` receives every intent a
  device produced; `key` receives a keyboard event; `page` receives a pointer
  event on a page element; `pad` maps a pad state to an intent.
- **Worked call** (`js/devices.js`, module load — the mapping half):

  ```js
  registerDeviceResolvers({ gesture: gestureIntent, pad: padIntent });
  ```

- **Worked call** (`js/input.js` `initInput` — the flow half):

  ```js
  registerDeviceResolvers({ shape: handleIntent, key: onKey, page: onInterfacePointerUp });
  ```

### `attachSurface(el)`

- **Contract (engine):** the element gestures and keys are measured on. Every
  listener is registered here: pointer down, move, up, cancel and keydown on the
  element, keydown on the document, pointer up on the document, and the gamepad
  connect/disconnect listeners on the window.
- **Worked call** (`js/devices.js` `setCanvas`):

  ```js
  export function setCanvas(c) {
    attachSurface(c);
  }
  ```

### `surfacePoint(clientX, clientY)`

- **Contract (engine):** the displacement of a pointer event in surface
  coordinates, so a consumer maps a gesture without knowing the element's box or
  the surface's logical size.
- **Worked call** (`js/devices.js` `toLogical`):

  ```js
  export function toLogical(clientX, clientY) {
    return surfacePoint(clientX, clientY);
  }
  ```

### `pointerDown(e)` / `pointerMove(e)` / `pointerEnd(e)` / `pointerCancel(e)`

- **Contract (engine):** one active pointer at a time; `pointerDown` captures the
  pointer on the surface. `pointerEnd` resets the gesture state and returns the
  shape the `gesture` resolver produced, or `null`.
- **Worked call** (`js/input.js` `onPointerUp`):

  ```js
  const i = devicePointerUp(e);
  if (i) handleIntent(i);
  ```

### `stickDirection(gp)`

- **Contract (engine):** the thumbstick direction as `{ r, c }`, or `null` below
  the deadzone. It quantizes; it does not decide what a direction means.

### `pollDevices()`

- **Contract (engine):** polls every connected device and returns the first
  shape one produced, or `null`. Edge state is per device, so a held button
  yields once.
- **Worked call** (`js/input.js` `pollController`):

  ```js
  const i = devicePoll();
  if (i) handleIntent(i);
  ```

### `clearDeviceEdges()`

- **Contract (engine):** clears the edge state for every device seen so far. A
  consumer registers this on its own device-connection events.

---

## js/records.js

### `registerReport({ field, writer })`

- **Signature:** `field` names the report slot in the play half; `writer(entry)`
  persists one entry.
- **Contract (engine):** the once-then-clear policy. It reads the batch at
  `state.play[field]`, clears it before handing entries over, and calls the
  writer once per entry. It names no board key and no entry shape, and it opens
  no storage.
- **Consumer must supply:** the field name and the writer, including that
  writer's own error handling.
- **Worked call** (`js/highscores.js`):

  ```js
  registerReport({
    field: 'result',
    writer: (entry) => recordScore(entry.score, entry.role, game.play.durationMinutes),
  });
  ```

### `recordsSystem` (const object)

- **Contract (engine):** the `{ name: 'records', update, endTick }` entry. Both
  phases call the same persist step, so a report made during a tick or on the
  closing edge persists once, and the second pass is a no-op.
- **Worked call** (`js/app.js` systems list): `recordsSystem`, registered after
  the systems that produce the report.

---

## Reading the contracts as one flow

1. `createClock` + `createEngine` build the loop.
2. `configureState` fills the skeleton from consumer tables.
3. The systems list registers gameplay, records and navigation as systems.
4. `registerNavigation` + `indexRows` bind one row table to both movement and
   the page.
5. `configureSurface` + `registerDeviceResolvers` + `attachSurface` bind the
   devices to the consumer's intent path.
6. `registerCanvasPainter` / `registerPagePainter` bind the painters to the two
   passes.
7. `registerReport` binds the write policy to the consumer's storage writer.

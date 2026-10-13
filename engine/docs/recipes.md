# Engine recipes

Five extension points. Each recipe names only engine symbols and states which
contract line from `api.md` the consumer must satisfy. Copy the shape, supply the
consumer's own names.

---

## Add a system

**Contract line:** `createEngine(systems)` — "the ordered systems list. Order is
the whole contract: a system that reports must be registered after the systems
that produce the report."

A system is a plain object. Any phase may be absent.

```js
export const countdownSystem = {
  name: 'countdown',
  endTick(ctx) {
    advanceCountdown();
  },
};
```

Rules the engine enforces:

- `init` runs once at load, before the first tick.
- `update` runs once per tick, in declared order.
- `endTick` runs after every other system has run its `update` for that tick.
- The engine bumps `ctx.state.play.tick` once per `update`, before any system
  runs. A system must not bump it again.

Mount it by adding the entry to the list the consumer passes to `createEngine`.
Put a reporting system last. Put a system that produces that report before it.

```js
const systems = [botSystem, snakeSystem, piecesSystem, countdownSystem, recordsSystem, screenSystem];
```

A system that reads a field must read it through `ctx`. The engine passes `ctx`
to every phase unchanged and reads only `ctx.state.play.tick`.

---

## Add a screen row

**Contract line:** `registerNavigation(nav)` — "the row table", and the row keys
the engine reads.

```js
{
  id: 'SELECT_ROLE',
  view: 'viewSelectRole',
  field: true,
  cursor: 'arrow',
  selection: 'roleSelect',
  items: [
    { id: 'roleSnake', label: 'Snake', opens: 'PLAYING', role: 'snake' },
    { id: 'roleTetris', label: 'Tetris', opens: 'PLAYING', role: 'tetris' },
  ],
}
```

The keys the engine reads, and what it does with each:

| Key | Engine use |
| --- | --- |
| `id` | The key of the row map. `gotoScreen(screenId)` writes a value here. |
| `cursor` | `'arrow'` reads `row.selection`; `'step'` reads `row.stepField`; `'none'` has no current item. |
| `selection` / `stepField` | The screen-state field the cursor index lives in. |
| `items[]` | The selectable entries. `items[].id` must be a page element id. |
| `items[].opens` | Read by `opensScreen(screenId, index)`. The engine never applies it; a handler does. |
| `controls[]` | Per-row controls. `controls[].id` must be a page element id. |
| `view` | The element toggled by the interface when this row is the current screen. |
| `field` | Whether this row shows the field. `paintViews` reports it. |
| `lockAction` / `startAction` | The action verb that fires the `lockModel` / `startGame` handler for this row. |

Two rules bind a row to the page:

- Every `row.view`, `items[].id` and `controls[].id` must be an id present in the
  page markup. `indexRows(rows)` indexes them in row order; an absent element
  keeps its slot, so a table index drifts silently rather than throwing.
- The row table is one table. Pass the same `rows` array to `registerNavigation`
  and to `indexRows`.

---

## Add a handler

**Contract line:** `registerNavigation(nav)` — "the handler map keyed by action
verb", and "Every other action verb belongs to the consumer's handler map."

```js
const HANDLERS = {
  lockModel: (ctx, item) => lockControlModel(ctx.state, item),
  startGame: (ctx, item) => startMatch(ctx.state, item),
  reassignP1: (ctx, item) => reassignP1(ctx.state, item),
};
```

The engine calls `handlers[intent.action](ctx, item)`:

- `ctx` is the context object the consumer passed to `engine.update`.
- `item` is the row's current item, resolved by `currentItem(screenId)`. It is
  `null` for a row whose cursor is `'none'`.
- A handler navigates by calling `gotoScreen(screenId)`. It must not write the
  screen-state field itself.
- A handler that opens another screen reads `opensScreen(screenId, index)` and
  passes the value to `gotoScreen`.

The verbs the engine owns — `menuUp`, `menuDown`, `confirm`, `select`, `toMenu`,
`lockModel`, `startGame` — already have engine behaviour. A handler map adds
verbs; it does not replace those seven.

---

## Add a painter

**Contract line:** `registerCanvasPainter(name, painter)` /
`registerPagePainter(name, painter)` — "stores one painter under a name. The
first registration fixes its slot; a later registration with the same name
replaces that painter and keeps the slot."

```js
registerCanvasPainter('field', paintField);
registerCanvasPainter('snake', paintSnake);
registerCanvasPainter('pieces', paintPieces);
```

Rules:

- Registration order is draw order. `canvasOrder()` and `pageOrder()` report it.
- Every painter receives the same context object. The consumer builds it once and
  hands it to `paintCanvas(paintCtx)` / `paintPage(paintCtx)`.
- The engine does not clear the canvas and does not set a fill style. A canvas
  painter owns its own background and colour.
- A canvas painter that draws cells uses the buffer owner's `drawCell(r, c)`, so
  the inset and the grid lines stay one decision.

Mount the pass outside the systems list. The registry holds no painting step; the
entry point paints once per rendered frame, not once per tick.

```js
const n = clock.advance(dt);
for (let i = 0; i < n; i++) update();
render();
```

Check the slots after registering, when a consumer needs to know it holds them:

```js
canvasOrder(); // ['field', 'snake', 'pieces']
```

---

## Add a device mapping

**Contract line:** `registerDeviceResolvers(resolvers)` — "each slot is the last
non-null resolver registered. Registering is idempotent, so a consumer may call
it more than once."

The consumer registers in two halves.

The mapping half answers "what does this raw signal mean":

```js
registerDeviceResolvers({ gesture: gestureIntent, pad: padIntent });
```

The flow half answers "where does an intent go":

```js
registerDeviceResolvers({ shape: handleIntent, key: onKey, page: onInterfacePointerUp });
```

| Slot | Receives | Returns |
| --- | --- | --- |
| `gesture` | a start/end pointer pair | an intent, or `null` |
| `shape` | every intent a device produced | nothing; it routes the intent |
| `key` | a keyboard event | nothing; it routes the intent |
| `page` | a pointer event on a page element | nothing; it routes the intent |
| `pad` | a pad state | an intent, or `null` |

Rules:

- Call `configureSurface({ width, height })` once, at module load, before any
  gesture is measured. `surfacePoint(clientX, clientY)` then returns a
  displacement in that logical space, so a mapping never reads the element box.
- Call `attachSurface(el)` once, on the element the gestures land on. Every
  listener registers there; a consumer adds no listener of its own.
- A resolver that produces an intent hands it to `pushIntent(intent)`. It must
  not call `gotoScreen` or a handler. `drainIntents()` applies the queue inside
  the tick, through `screenSystem`.
- A resolver that reads a game state reads it from the consumer's own module, not
  from the engine. The engine reads no screen state.
- `pollDevices()` returns the first shape from any connected device, and edge
  state is per device, so a held button yields once. `clearDeviceEdges()` clears
  that state; call it on the consumer's own connection events.

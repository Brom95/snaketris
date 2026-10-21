# Snaketris Architecture

This document maps the codebase for a reader who is not the author. It covers the
split between the reusable engine and the game-specific consumer, the module map,
the key exports and imports, the data flow, and the two network flows.

## The two layers

The project is two layers:

- **`engine/`** — the reusable mechanism. It works for any game. It names no
  game noun: no snake, no piece, no score, no board key, no screen name.
- **`js/`** — the consumer. Everything that names a game noun (snake, piece,
  score, board, HUD, pairing) lives here.

The split rule decides where a symbol lives:

- A symbol names no game noun → it belongs to the engine.
- A symbol names one game noun → it belongs to the consumer.

The engine never imports a consumer file. A consumer imports engine files by
relative path and hands its own values, tables and handlers to the engine at
load time. The boundary is enforced by
`engine/tests/boundary.test.js`, which lists every `import` under `engine/js/`
and asserts each target resolves inside `engine/`. A failing check is a design
error, not a workaround.

## The engine modules

Every engine module has one job. The consumer supplies two things the engine can
never fill: **the seed** and **the transport**.

| Module | Job |
| --- | --- |
| `js/clock.js` | A frame advances by whole ticks. The remainder carries into the next frame. |
| `js/registry.js` | Systems run in the declared order. `init` runs once at load, `update` once per tick, `endTick` after every other system. Owns the tick counter. |
| `js/state.js` | Two containers, `play` and `screen`, filled from consumer tables. A reset clears one half and refills it. |
| `js/grid.js` | A `rows × cols` cell array. Cell identities are values the consumer supplies; the engine never reads one. |
| `js/navigation.js` | Screen movement from a consumer row table and handler map. Owns seven intent verbs only: `menuUp`, `menuDown`, `confirm`, `select`, `toMenu`, `lockModel`, `startGame`. |
| `js/stream.js` | An intent carries the tick it applies on and applies on that tick only. A past intent is dropped and counted. |
| `js/link.js` | Holds the state a peer connection has, fires the close event once to every handler. |
| `js/present.js` | Painters run in registration order, two passes: canvas then page. |
| `js/interface.js` | One owner for page elements. Every id a row names is looked up once. |
| `js/layout.js` | One viewport rule answers both the stacked-layout test and the field gap. |
| `js/devices.js` | Pointer listeners, capture, coordinates, thumbstick quantization, gamepad polling. |
| `js/records.js` | A batch persists exactly once, then clears. |
| `js/source.js` | `nextValue(seed, callCount)` answers from two arguments only, so a run replays in order. Supplies no seed, reads no browser entropy. |
| `js/canvas.js` | The canvas buffer, its size, and the cell primitive. |

## The consumer modules

| Module | Job |
| --- | --- |
| `js/app.js` | Entry point and game loop. Wires every module, owns the canvas and the loop. |
| `js/state.js` | The play and screen state tables, the reset hook, the game-over reasons. |
| `js/constants.js` | Shared layout constants (COLS, ROWS, CELL, BOARD_W, BOARD_H, colors). |
| `js/config.js` | Game configuration; re-exports the layout constants. |
| `js/rules.js` | Game rules, pairing constants, validation (e.g. `isDottedByteQuad`). |
| `js/netframe.js` | Frame and intent encode/decode for the network channel. |
| `js/netplay.js` | Network multiplayer: the lobby, the pairing secret, the share link, the code, SDP/ICE handling. |
| `js/input.js` | Input FLOW layer: the single state machine that consumes normalized intents and drives one navigation path. |
| `js/render.js` | Canvas rendering: grid, pieces, snake, UI overlays. |
| `js/ui.js` | The page interface: everything outside the play field, synced to `game.screen.state`. |
| `js/screens.js` | The screen state machine, menus, and the pairing step. |
| `js/bot.js` | The AI opponent that drives the side the player did not choose. |
| `js/snake.js` | Snake movement and steering. |
| `js/pieces.js` | Tetris pieces logic. |
| `js/grid.js` | The play grid for the game (consumes `engine/js/grid.js`). |
| `js/devices.js` | Game-specific device handling (consumes `engine/js/devices.js`). |
| `js/highscores.js` | The records layer: load and write high scores. |
| `js/copy.js` | User-visible copy strings (buttons, hints, labels). |
| `js/qr.js` | QR-code rendering for the share link. |

## The entry point

`js/app.js` is called once on module load, after the DOM is parsed. It:

1. Creates the clock and the engine, then registers the game systems in order
   (clock → screen → snake → bot → pieces → records).
2. Registers transport, render, input, and UI.
3. Starts the animation loop with `requestAnimationFrame`.

The transport is the page's own: `app.js` constructs the `RTCPeerConnection`
and the negotiated data channel, then hands the engine link an object with the
two verbs it owns. The engine never names the channel class.

## Data flow

1. **Input** → `js/input.js` turns raw device input into a normalized intent and
   pushes it through `pushIntent(intent)`.
2. **Intents** → the engine drains them in `drainIntents()` on the tick they name.
3. **Simulation** → the snake, bot, and pieces systems mutate `game.play` during
   the engine `update`.
4. **Rendering** → `js/render.js` paints the current `game.play` to the canvas.
5. **State** → `js/state.js` holds the play and screen containers; a reset clears
   one half and refills it.

The same path serves every direction source: the player, the bot, touch, and the
gamepad all route through one shared steering path in `js/input.js`.

## The two network flows

A page belongs to one flow for its whole life, and the flow travels in the
pairing link, so the guest inherits the host's choice instead of typing it.

### Global flow

Reads the public candidate list once per open and adds a sample of it to the
supply it ships. An address the page is told to name (`?ice=stun:...`) is carried
in the pairing secret, so the guest receives it without typing.

### Local flow

Reads no list at all. Each page states its own device's dotted-quad address
(which its player types) beside the port the page read from its own gathered
description, and each page offers the other that address. The port is never
typed, and no page shows a field for the peer's address — the peer's address and
port travel over the channel the pairing already uses, beside the answer the
page produced.

A raw address on the address bar still names no candidate: a peer connection
needs a scheme it accepts, and an address alone has none. A local-flow page
publishes nothing while its player has typed no address. When no supply answers,
the page reports no channel rather than pairing silently.

## Where to read more

- `engine/README.md` — the full engine contract, what a consumer must supply,
  and the invariants that must not be broken.
- `docs/recipes.md` — the extension points (add a system, a screen row, a
  painter, a device mapping).

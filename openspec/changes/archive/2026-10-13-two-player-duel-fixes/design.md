# Design

## Context

See `proposal.md` for the four reported defects. The current state that shapes the approach:

- `js/screens.js` owns one screen table (`SCREENS`) and one index (`SCREEN_BY_ID`). `js/ui.js`
  `syncViews` reads `SCREEN_BY_ID[game.screen.state]`; an id the table does not name hides every
  view and the page paints nothing.
- `game.screen.state` holds a screen id. The control step lives in a different field,
  `game.screen.gameControlStep`. The two fields are not interchangeable.
- `#role-line` sits inside `#role-view` and carries the `view` class. `.view` hides by default and
  `syncViews` never toggled it, so the element could never paint.
- `js/devices.js` `playingKeyIntent` and `js/input.js` `handleIntent` branch on the single
  `game.play.role`. `game.screen.p1Model` and `p2Model` are read only during preparation.
- `js/input.js` already imports `js/devices.js`, so a key helper may live in `devices.js` without
  adding an import edge.

## Goals / Non-Goals

**Goals:**

- Every value written into `game.screen.state` resolves in `SCREEN_BY_ID`.
- The preparation flow states, at every stage, which stage is active, who acts, and which keys
  advance it.
- During play each player's own control model drives that player's own character.
- No page element id, visibility class, or score rule changes.

**Non-Goals:**

- Per-player touch or pointer routing in two-player mode. One touch surface cannot drive two
  players, and no defect was reported there.
- Polling a second gamepad. `pollController` reads only the first connected pad; that stays true.
- New screens, new element ids, new score rules, or new control models.

## Decisions

### D1 — Game over writes a screen id plus a step

`applyGameOverScreen` sets `game.screen.state = SELECT_CONTROL` and
`game.screen.gameControlStep = GAME_CONTROL_START` in two-player mode. The single-player branch
keeps `GAME_OVER`.

Why not keep `game.screen.state = GAME_CONTROL_START`: the screen table keys are screen ids. A step
constant has no table entry, so `syncViews` hides every view. That is the reported black screen.
The alternative of adding a `GAME_CONTROL_START` entry to the table would give the table two
kinds of key and break the "one entry per screen" invariant the screens test asserts.

Trade-off: the `#status` result line does not paint in two-player mode, because `#status` follows
`GAME_OVER`. The finished scores still reach the records layer through `game.play.result`, and the
Records screen lists both sides.

### D2 — The role line leaves its parent view

`<p id="role-line" class="view">` moves out of `#role-view` and becomes a direct child of `#ui`.
Its id and its class stay identical, so every check that reads it by id keeps working. A child of a
hidden view cannot paint, and the control steps hide `#role-view`.

`syncViews` then calls `show()` on it and sets the text only while both roles are assigned. The
previous code wrote the text unconditionally, which printed the literal `null` before P1 picked.

### D3 — The per-player summary paints on every control step

`paintControlFeedback` shows `#control-summary` on every step instead of only the shared step, and
hides an individual line while that player has no role. The line names the role and the model, or
says `not chosen` until the player locks one.

Why not a new element: `#summary-line-1` and `#summary-line-2` already exist and already carry the
role and model text. Only their gate was too narrow.

### D4 — Stage titles are derived from the screen table

`paintStageTitle` writes `#role-title` and `#control-title` from the same table entry the cursor
uses: `itemForStep` for the active step and `stepItemIndex` for its position. The title names the
stage, its position, and the acting player. The hint line already lists the keys that advance the
step, so no new constant and no new label list is needed.

Why not static HTML text: static text cannot name the acting player or the step position, and it
would drift from the table the moment a step is added or reordered.

### D5 — A keyboard model belongs to the player who locked it

`keyboardModelForKey` moves from `js/input.js` into `js/devices.js`. `input.js` already imports
`devices.js`, so the move keeps the import graph one-way. Moving it the other way would add a
`devices.js` → `input.js` edge and create a cycle.

The function accepts the raw `e.key` forms and the lowercased arrow names. `keyToIntent` lowercases
before calling `playingKeyIntent`, while `onKey` passes `e.key` untouched, so both call sites need
to resolve. The raw forms stay accepted so no existing behavior changes.

`roleForKeyboardKey` then returns the role of the player who locked that model, or nothing when no
player locked it. `playingKeyIntent` uses that role instead of `game.play.role`. Keyboard models
are exclusive: `lockControlModel` refuses a second player on the same layout, so one model maps to
at most one player.

### D6 — The piece gate asks whether the piece is human-driven

`handleIntent` accepts a piece shift or rotation when `game.screen.twoPlayerMode` is true or
`game.play.role === 'tetris'`. In single-player Snake role no piece intent is produced, so widening
the gate opens no new path there. `setDirection` stays byte-for-byte stable, which keeps the no-reverse
rule and the PLAYING gate intact.

### D7 — The pad role follows the gamepad-model owner

`pollController` resolves the role from the player who locked `gamepad`. When both players locked
`gamepad`, the first pad drives P1. That is a documented limitation of the existing single-pad poll,
not a new rule.

## Risks / Trade-offs

- Moving `#role-line` changes the DOM order inside `#ui` → the harness `scripts/verify-role-line.mjs`
  reads it by id and asserts the exact text, so it still passes; the layout check
  `scripts/verify-page-layout.mjs` must stay green because the element keeps its `view` class.
- Widening the piece gate could let a single-player Snake player shift the piece → no single-player
  path produces a piece intent, and the input test asserts the two-player path only.
- `keyboardModelForKey` accepting lowercase arrow names is additive → a capitalised `W` still
  resolves to `wasd`, which only makes the SELECT_CONTROL lock work for Shift+W; no test asserts the
  opposite.
- The two-player result line is not painted after a game → the scores stay visible in the Records
  screen, and the SHARED step is where the next game starts.
- `tests/app.test.js` keeps one pre-existing engine-order failure at HEAD → it must stay the only
  failing check, not a new one.

## Open Questions

- None. Every decision above is settled against the current code.

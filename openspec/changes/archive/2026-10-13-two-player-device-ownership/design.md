# Design: two-player-device-ownership

## State

`game.screen` gains two fields, set when a player locks the `gamepad` model:

- `p1Pad` — the `id` of the physical pad P1 pressed on, or `null`.
- `p2Pad` — the same for P2.

`newScreen()` sets both to `null`. `reassignP1`/`reassignP2` clear the matching
pad. `startGame()` preserves both across `resetGame()` in two-player mode, exactly
as it preserves `p1Model`/`p2Model`.

## Pad identity

`navigator.getGamepads()` entries carry a stable `id`. `js/devices.js` already
keeps `connectedPadIds` and a per-id `padStates` map, so per-pad edge detection
exists. `routePads(pads)` already returns the connected pads in connection order
and is currently unused by `pollController`.

## Polling

`pollController()` changes from "first pad only" to "every pad, in connection
order":

1. `const pads = routePads(navigator.getGamepads())`.
2. For each pad, read that pad's buttons and stick, compute its own edges from
   that pad's own `padStates` entry, and choose an intent with the role of that
   pad's owner.
3. Return the first non-null intent.

`roleForGamepad()` is replaced by `roleForPad(padId)`:

- Not two-player mode → `game.play.role` for any pad (single-player unchanged).
- `padId === game.screen.p1Pad` → `game.screen.p1Role || game.play.role`.
- `padId === game.screen.p2Pad` → `game.screen.p2Role`.
- A pad no player owns → `null`, and that pad produces no intent.

## Locking a pad

During `SELECT_CONTROL` the acting player is `currentControlPlayer()`. The pad
that produced the confirming press is that pad's owner. The intent carries the
pad: `{ action: 'lockModel', model: 'gamepad', pad: gp.id }`.

`js/screens.js` `applyIntent` forwards the pad: the `lockModel` case calls
`lockForCurrentStep(row, intent.model, intent.pad)`, which calls
`lockControlModel(item.player, model, pad)`.

`lockControlModel(player, model, pad = null)` rejects a pad another player already
owns, with the same error shape as the keyboard rule:
`P2: cannot use the same gamepad as P1` (and the mirrored P1 message). A `gamepad`
lock records the pad id in `p1Pad`/`p2Pad`; any other model clears it.

## Viewport rule

`js/constants.js` exports `twoPlayerOffered()` — `window.innerWidth > UI_STACK_MAX_WIDTH`,
behind a `typeof window === 'undefined'` guard so a headless test that installs no DOM
stub keeps the wide path. Both `js/ui.js` and `js/screens.js` call it, so the visibility
rule and the reachability rule cannot drift. `js/ui.js` keeps owning the DOM; `js/screens.js`
owns the navigation.

The two-player menu item in the `SCREENS` table gains `requiresWide: true`.
`offersItem(item)` answers whether the viewport can offer an item. `stepCursor` skips
items `offersItem` rejects, and the `two-player` case in `applyAction` refuses the action
then. A pointer hit cannot match: the element is `display: none`, so its box has zero area.

## Dead code

`benchmark.mjs` is tracked, added by commit `9c0af56`, and imported by nothing. It predates
the state split and threw on `game.snake`, so it is kept tracked and ported to the split
state instead of deleted: every read becomes `game.play.*` or `game.screen.state`, the
`npm run benchmark` script entry is added to `package.json`, and the probe reports the
balance numbers it measures. `js/ui.js` imports six names it never uses:
`MENU`, `HELP`, `PLAYING`, `GAME_CONTROL_P1`, `GAME_CONTROL_P2`, `GAME_CONTROL_START`.
`tests/app.test.js` carries one check whose premise contradicts the bot objective, and it
is removed rather than kept failing.

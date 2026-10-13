# Tasks: two-player-device-ownership

## 1. Dead code

- [x] 1.1 Keep `benchmark.mjs` tracked and make it useful: port every read to the split
      state (`game.play.*`, `game.screen.state`), add a `npm run benchmark` script entry,
      and state the balance numbers it reports. It was added by commit `9c0af56`.
- [x] 1.2 Drop the six unused imports from `js/ui.js`: `MENU`, `HELP`, `PLAYING`,
      `GAME_CONTROL_P1`, `GAME_CONTROL_P2`, `GAME_CONTROL_START`.
- [x] 1.3 Remove the stale `tests/app.test.js` check "engine order: the bot decides
      before the snake steps". Its premise (the snake bot turns away from a falling
      piece) contradicts the bot objective (eat the most cells), and its ordering
      claim is already covered by the registry-order check in the same file.
      Verify: `npm test` reports every check passing.

## 2. Two-player mode offered only on a wide viewport

- [x] 2.1 Export `twoPlayerOffered()` from `js/constants.js` —
      `window.innerWidth > UI_STACK_MAX_WIDTH`, with a `typeof window === 'undefined'`
      guard so a headless test that installs no DOM stub keeps the wide path.
- [x] 2.2 Mark the two-player menu item in the `SCREENS` table with `requiresWide: true`.
- [x] 2.3 `js/screens.js` `stepCursor` skips items whose `requiresWide` flag is set
      while `twoPlayerOffered()` is false, so the cursor never lands on a hidden item.
- [x] 2.4 The `two-player` case in `js/screens.js` `applyAction` refuses the action
      while `offersItem(item)` is false.
- [x] 2.5 `js/ui.js` shows the item from `twoPlayerOffered()` instead of repeating the
      comparison.
- [x] 2.6 Test: at a stacked width the cursor skips the item, the direct `select` intent
      for the hidden item is refused, and the mode stays off.

## 3. Each player owns a distinct gamepad

- [x] 3.1 `js/screens.js` `newScreen()` adds `p1Pad: null`, `p2Pad: null`.
- [x] 3.2 `js/screens.js` `reassignP1`/`reassignP2` clear the matching pad field.
- [x] 3.3 `js/state.js` `startGame()` preserves `p1Pad`/`p2Pad` across `resetGame()`
      in two-player mode, next to `p1Model`/`p2Model`.
- [x] 3.4 `js/devices.js` sends the pad id in the `lockModel` intent, and `js/screens.js`
      `applyIntent` forwards `intent.pad` through `lockForCurrentStep` to `lockControlModel`.
- [x] 3.5 `js/screens.js` `lockControlModel(player, model, pad)` records the pad for a
      `gamepad` lock and refuses a pad the other player already owns, with the message
      `P2: cannot use the same gamepad as P1`.
- [x] 3.6 Test: P1 and P2 lock different pads; locking the same pad is refused and leaves
      P2 unlocked.

## 4. Every pad drives its own owner

- [x] 4.1 `js/devices.js` replaces `roleForGamepad()` with `roleForPad(padId)`:
      the pad a player locked drives that player; an unowned pad drives nothing.
- [x] 4.2 `js/devices.js` `pollController()` polls every connected pad through
      `routePads` and returns the first intent a pad produced; per-pad edge state lives in
      `readPad(gp)`.
- [x] 4.3 Test: two stub pads with distinct ids; pad A drives P1's character and pad B
      drives P2's, with no edge state leaking between them.
- [x] 4.4 Test: a pad no player owns produces no play action.

## 5. Harness and specs

- [x] 5.1 `npm test` green.
- [x] 5.2 `npm run verify` reports "All 12 checks passed."
- [x] 5.3 Sync `openspec/specs/two-player-local-mode/spec.md` with the delta.
- [ ] 5.4 Archive the change.

# Proposal

## Why

Every match today runs until one side dies, so match length is unbounded and set by the
difficulty ramp. A player cannot choose a fixed-length duel, and the two side scores are
never compared over a bounded time. A duration selection plus an on-screen countdown makes
"survive the whole match and out-score the other side" a win condition the player can see.

## What Changes

- **New** `SELECT_DURATION` state between the menu and the role screen. It offers 1 minute,
  3 minutes, and 5 minutes. Both the single-player "Play" item and the "Two Players" item
  open it.
- **New** Countdown readout during play: plain seconds remaining, as a page element beside
  the score readout. It is not painted on the canvas.
- **New** Match end reason `'time-up'`. When the countdown reaches zero the match ends and
  the higher side score wins. A snake crash or a board overflow still ends the match earlier.
- **New** Game-over message names the end reason for a completed match: `time up`.
- **BREAKING** The high-score board becomes three boards, one per duration. Each board keeps
  its own top 10 in its own localStorage key. The existing `snaketris.highscores` key is no
  longer read, so entries recorded before this change are not shown.
- **New** The records view gains a duration selector above one list. The cursor starts at the
  1-minute board.
- **Modified** `role-back` returns to `SELECT_DURATION`, not to the main menu.
- **Unchanged** The difficulty ramp. All three durations use the current landed-block ramp.

## Capabilities

### New Capabilities

None. Every requirement below extends an existing capability.

### Modified Capabilities

- `snaketris-game`: a match has a chosen duration; the countdown is measured in engine ticks;
  the countdown reaching zero is a third end condition; the first end reason wins when a crash
  and the countdown expire on the same tick.
- `start-menu`: a duration sub-menu sits before the role sub-menu in the preparation flow;
  the role screen's Back item returns to it; the records view selects a board by duration.
- `hud`: the countdown is a page element that follows the score readout's placement rule;
  the game-over message names the end reason.
- `highscores`: scores are recorded into the board of the chosen duration; each duration
  persists its own top 10; the records view shows one selected board.
- `two-player-local-mode`: the duration is chosen once before the first match and kept across
  rematches, which return to the control step.

## Impact

- `js/constants.js` — new state id `SELECT_DURATION`, duration item lists, duration tick
  constants, two new `TRANSITIONS` values.
- `js/screens.js` — one new `SCREENS` row, the records row gains items and an arrow cursor,
  `applyAction` gains three cases, `newScreen`/`toMenu` gain two selection fields.
- `js/state.js` — `game.play` gains the chosen duration; `resetPlay` and `startGame` carry it;
  `gameOver` keeps the first reason; a new `'time-up'` reason.
- `js/ui.js` — countdown text, `syncViews` shows and positions the new element, `statusText`
  names the reason, `fillRecords` paints the selected board.
- `js/highscores.js` — `loadBoard`, `saveBoard`, `recordScore` take the duration; three keys.
- `snaketris.html` — `<p id="timer" class="view">`, `duration-view` and its three items, three
  records selector items, one CSS rule.
- Tests: `state`, `screens`, `ui`, `highscores`, `records`, `app`, `input`, `devices`.
- Harness: `scripts/harness.mjs` sweeps every selection index, so the two new arrow screens
  fall inside its contract; six `verify-*` scripts enumerate page ids and need the new ids.

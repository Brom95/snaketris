# Tasks

## 1. Duration constants and state

- [x] 1.1 Add `SELECT_DURATION` to the state constants in `js/constants.js` and add the three duration tick budgets (3600, 10800, 18000) plus the selectable minute values (1, 3, 5) as constants; verify `tests/constants.test.js` reads the new exports and the suite stays green.
- [x] 1.2 Add `durationMinutes` and `durationTicks` to `game.play` in `js/state.js` and set them in `resetPlay`; verify `tests/state.test.js` asserts the fields exist after `startGame` and that a 1-minute default leaves `durationTicks` at 3600.

## 2. Duration sub-menu navigation

- [x] 2.1 Add the duration screen page elements to `snaketris.html`: a `duration-view` with its own title, three items ("1 minute", "3 minutes", "5 minutes") and a Back item, plus the CSS rules mirroring the role screen; verify `scripts/verify-menu-geometry.mjs` reports a distinct box for each of the four items.
- [x] 2.2 Add the `SELECT_DURATION` row to the `SCREENS` table in `js/screens.js` with `cursor: 'arrow'` and its own `selection` field; verify `tests/screens.test.js` resolves the row and `currentItem` returns the highlighted duration item.
- [x] 2.3 Repoint the `Play` and `Two Players` menu items from `SELECT_ROLE` to `SELECT_DURATION`; verify `tests/screens.test.js` shows that confirming `Play` lands in `SELECT_DURATION` and that no game has started.
- [x] 2.4 Add the `pick-duration` case to `applyAction` in `js/screens.js` so a confirmed duration sets the match duration and opens `SELECT_ROLE`; verify a harness selection sweep reaches `SELECT_ROLE` with the chosen duration stored.
- [x] 2.5 Add the `back-duration` case and the Escape/gamepad-B path so the duration screen returns to `MENU` without starting a game; verify `tests/screens.test.js` covers Escape, the Back item click and the Back item confirmation.
- [x] 2.6 Retarget `backToRoleSelect` (`js/screens.js:378`) from `MENU` to `SELECT_DURATION`; verify the role-screen Back path lands in `SELECT_DURATION` in both single-player and two-player tests.
- [x] 2.7 Add the duration screen to the field-hidden rule so the canvas is absent in `SELECT_DURATION`; verify `scripts/verify-field-only.mjs` reports no field while the duration screen is shown.

## 3. Countdown in the engine

- [x] 3.1 Count down in the fixed-timestep update using `durationTicks − game.play.tick`; verify `tests/state.test.js` shows the remaining seconds for a 3-minute match start at 180, read 179 after one second and read 0 on the final tick.
- [x] 3.2 Add the `'time-up'` end reason and call `gameOver` when the countdown reaches zero; verify `tests/state.test.js` reaches `GAME_OVER` with `gameOverReason === 'time-up'` and that no further stepping or spawning happens after it.
- [x] 3.3 Guard `gameOver` (`js/state.js:111`) so the first reason set wins; verify a crash on the same tick as the countdown keeps the crash reason and the Tetris side wins.
- [x] 3.4 Confirm the duration does not change the difficulty ramp; verify `tests/pieces.test.js` and `tests/snake.test.js` report identical `currentFallSpeed` and `snakeTicksPerCell` for all three durations at the same piece count.

## 4. Countdown readout

- [x] 4.1 Add `<p id="timer" class="view">` beside `#score` in `snaketris.html` and its CSS rule beside `#score { font-size: 16px; }`; verify the page contains the element and the harness can query its box.
- [x] 4.2 Show the countdown in `syncViews` (`js/ui.js:156`) only in `PLAYING` and `GAME_OVER`, as plain remaining seconds with no unit suffix; verify `tests/ui.test.js` hides it in `MENU`, `SELECT_DURATION`, `SELECT_CONTROL`, `RECORDS` and `HELP`.
- [x] 4.3 Place the countdown beside the score readout in both the beside and the stacked layout by reusing the `placeScore` path (`js/ui.js:146`); verify `scripts/verify-hud.mjs` reports the timer outside the field in the beside layout and inside the interface band in the stacked layout.
- [x] 4.4 Extend `statusText` (`js/ui.js:132`) so the game-over message names the `time up` reason and both final scores; verify `tests/ui.test.js` asserts the reason phrase and the two scores.

## 5. One leaderboard board per duration

- [x] 5.1 Split `js/highscores.js` into per-duration boards keyed `snaketris.highscores.1`, `.3`, `.5`, with `loadBoard(minutes)`, `saveBoard(minutes, board)` and `recordScore(score, role, minutes)`; verify `tests/highscores.test.js` records a 3-minute score into the 3-minute board and leaves the other two unchanged.
- [x] 5.2 Keep the pre-split key unread so old entries are not shown; verify `tests/highscores.test.js` shows every board empty when only the pre-split key exists.
- [x] 5.3 Read the duration from `game.play` at the `recordScore` call site in `update` (`js/highscores.js:60`); verify a two-player game records both entries into that match's duration board.
- [x] 5.4 Point `fillRecords` (`js/ui.js:108`) at the selected board; verify `tests/records.test.js` lists only the selected board and keeps its empty-state message per board.

## 6. Records duration selector

- [x] 6.1 Add the records duration selector page elements to `snaketris.html` above `records-list`, with three items and one highlighted; verify `scripts/verify-views.mjs` reports three selector boxes in the records view.
- [x] 6.2 Add the records selector row to the `SCREENS` table with `cursor: 'arrow'` and a `game.screen` selection field starting at the 1-minute board; verify `tests/screens.test.js` shows the cursor at 1 minute when the records view opens.
- [x] 6.3 Add the `pick-board` case to `applyAction` so moving the selector repaints the list; verify moving the selection from 1 minute to 5 minutes repaints with the 5-minute board.

## 7. Two-player duration flow

- [x] 7.1 Confirm the duration screen opens once before P1's role pick in two-player mode; verify `scripts/verify-controller-input.mjs` reaches `SELECT_DURATION` before any control step and shows no field.
- [x] 7.2 Keep the duration across a two-player rematch by leaving `applyGameOverScreen` (`js/screens.js:279`) returning to the SHARED control step; verify a rematch counts down from the duration chosen before the first match.

## 8. Integration checks

- [x] 8.1 Run `npm test` and confirm the unit suite is green with the new checks included; report the check count.
- [x] 8.2 Run `npm run verify` and confirm every harness script exits 0; report each exit code.
- [x] 8.3 Run ripwire `quality_delta` and confirm it reports no regression against the HEAD baseline.

## Workflow follow-up

- Sync the delta specs into `openspec/specs/` once the implementation is verified.
- Archive the change with `openspec archive match-duration-timer --yes` (add `--skip-specs` if the delta was already merged manually).

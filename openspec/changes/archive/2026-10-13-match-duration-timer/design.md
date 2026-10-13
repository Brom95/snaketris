# Design

## Context

See `proposal.md` for motivation and `specs/` for the required behaviour. The constraints below are the ones that shape the approach.

- The engine runs on a fixed timestep. `js/constants.js:71` declares `TICK = 1 / 60`, and `js/app.js` drives updates through a `createClock(TICK)` accumulator that deliberately stops advancing while the tab is hidden. Wall-clock time is therefore not a valid countdown source: it would drift, and it would be untestable in the headless harness.
- Navigation is one declarative table. `js/screens.js` holds a `SCREENS` table whose rows declare `view`, `field`, `cursor` (`'arrow' | 'step' | 'none'`), `selection` (a `game.screen` field name), `items` and `controls`. `currentItem`, `stepCursor` and `paintHighlights` read that row; they contain no per-screen branches.
- `applyAction` (`js/screens.js:397`, handle `sym#03f385fe39cabe05@ff644dde9eac303e`) is a `switch` on `item.action`. Its callers are `selectById` (`:478`), `applyBack` (`:499`), `startFromCurrent` (`:520`) and `applyIntent` (`:530`).
- The state enum lives in `js/constants.js:16-22` (`MENU`, `SELECT_ROLE`, `SELECT_CONTROL`, `PLAYING`, `GAME_OVER`, `RECORDS`, `HELP`). There is no `TRANSITIONS` table; the state graph is expressed by the `SCREENS` rows.
- End of match is one funnel. `gameOver` (`js/state.js:111`) is called from exactly two places in gameplay code — `js/snake.js:38` (`moveSnake`) and `js/pieces.js:211` (`landPiece`). It calls `applyGameOverScreen` (`js/screens.js:279`) and `finishedResult` (`js/state.js:118`, its only caller).
- Interface text is a real page element, never canvas paint. `js/ui.js:syncViews` (`:156`) is the single place that toggles `.on` for every readout; it already calls `scoreText` (`:127`), `statusText` (`:132`) and `placeScore` (`:146`). `#score` sits at `snaketris.html:123` and its CSS rule at `snaketris.html:49`.
- Storage is one flat board. `js/highscores.js` holds `entryRole` (`:12`), `loadBoard` (`:18`), `saveBoard` (`:31`), `recordScore` (`:42`) and `update` (`:60`). `loadBoard` is also read by `js/app.js:57` (`frame`) and by `tests/highscores.test.js`, `tests/records.test.js`, `scripts/verify-views.mjs`.
- The difficulty ramp is shared and already tuned for short matches: `BASE_FALL = 0.04` (`js/constants.js:75`), `MAX_FALL = 0.9` (`:76`), `SNAKE_SPEED_DELTA = 2` (`:78`). A 5-minute match lands roughly 110 blocks, so `fallSpeed ≈ 0.22` — far below the cap. No duration reaches the speed wall.

## Goals / Non-Goals

**Goals:**

- Add the countdown without touching the fixed-timestep loop or the render loop.
- Express the duration screen and the records board selector as rows in the existing `SCREENS` table, not as new imperative navigation code.
- Keep one end-of-match funnel (`gameOver`) for all three reasons: snake crash, top-out, time-up.
- Keep the score-comparison logic that `finishedResult` already performs; add only the reason phrase.
- Make every new readout reachable by the existing headless harness pattern (`scripts/harness.mjs` `stateIs`, `snapshot`, `itemBoxes`).

**Non-Goals:**

- No change to the fall-speed ramp, the snake interval, scoring, or piece control. The specs state the ramp is identical for every duration; nothing here needs to touch `js/pieces.js` or `js/snake.js`.
- No new state for the countdown itself. The countdown is data on `game.play`, not a state.
- No migration path for pre-split leaderboard entries. The `highscores` delta says they are not shown; deleting the old key is out of scope.
- No per-duration tuning knobs, no pause, no configurable durations.
- No change to the two-player control flow beyond the two `two-player-local-mode` deltas already written.

## Decisions

### D1 — Countdown is tick-based, stored as a budget

Store `durationTicks` on `game.play` and derive the readout as `durationTicks − game.play.tick`. Durations are `3600`, `10800`, `18000` ticks for 1, 3 and 5 minutes at `TICK = 1/60`.

- Why: the accumulator is the only clock the game trusts. It freezes when the tab is hidden, which the "hidden tab does not skip" scenario requires, and it is the only clock the headless harness can advance deterministically.
- Alternative rejected: `Date.now()` deltas. They drift against the accumulator, they cannot be advanced in a stub harness, and they break the existing pause behaviour.
- Alternative rejected: a separate seconds counter decremented per frame. It couples the countdown to the render rate instead of the update rate.

The countdown advances in the same update that steps the game, so a paused game does not burn time.

### D2 — `SELECT_DURATION` is a state constant and a `SCREENS` row

Add `export const SELECT_DURATION = 'SELECT_DURATION';` next to the existing state constants (`js/constants.js:16-22`), and one `SCREENS` row for it with `cursor: 'arrow'`, a `selection` field on `game.screen`, and items `1 minute`, `3 minutes`, `5 minutes`, `Back`.

- Why: `currentItem`, `stepCursor` and `paintHighlights` already read the row generically. A new row buys keyboard cycling, pointer hit areas and highlight painting for free.
- Alternative rejected: a branch inside `applyAction` that special-cases the duration screen. It duplicates navigation logic that the table already provides.
- The menu items `menu-item-play` and `menu-item-two-player` need no new action. Their `opens` target changes from `SELECT_ROLE` to `SELECT_DURATION`.

### D3 — Three new `applyAction` cases only

`applyAction` gains exactly three cases: `pick-duration` (sets `game.play.durationMinutes`, moves to `SELECT_ROLE`), `pick-board` (sets the records selector, repaints the list), `back-duration` (returns to `MENU`). Every other duration behaviour routes through existing cases and the changed `opens` targets.

- Why: minimal diff against a symbol whose blast radius is large — `scripts/harness.mjs` sweeps every selection index through `applyIntent`.
- `backToRoleSelect` (`js/screens.js:378`) is the existing role-screen Back target. It changes its destination from `MENU` to `SELECT_DURATION`, which satisfies both the `start-menu` "Role sub-menu can be cancelled" delta and the `two-player-local-mode` "Back from the role screen" delta in one edit.

### D4 — `time-up` is the third end reason and shares the `gameOver` funnel

Extend `gameOverReason` to `'snake-death' | 'top-out' | 'time-up'`. The countdown check runs in the update step and calls the same `gameOver` (`js/state.js:111`).

- Tie rule: first reason set wins. `gameOver` guards against overwriting a reason that is already set, so a crash on the same tick as the countdown keeps the crash reason and the Tetris side wins.
- Alternative rejected: reason precedence by severity. It makes the outcome depend on evaluation order inside one tick, which is harder to test and harder to explain to the player.
- `finishedResult` (`js/state.js:118`) already resolves the winner from the two side scores with a draw default. It needs no change; only `statusText` (`js/ui.js:132`) gains the "time up" phrase.

### D5 — The countdown readout is a sibling of `#score`

Add `<p id="timer" class="view">` directly after `#score` (`snaketris.html:123`), with a CSS rule beside `#score { font-size: 16px; }` (`snaketris.html:49`). `syncViews` shows it only in `PLAYING` and `GAME_OVER`, and `placeScore`'s existing fixed-position path is reused so the stacked and beside layouts both place it correctly.

- Why: the `hud` spec requires a real page element and placement relative to the score readout. Reusing `placeScore`'s path keeps the two readouts in one layout rule and keeps the harness's existing box queries working.
- Text is plain remaining seconds: `180`, then `179` after one second, then `0` on the final tick. No `MM:SS`, no unit suffix.
- Alternative rejected: painting the countdown on the canvas. It violates the HUD rule and it is invisible to the DOM assertions the harness already makes.

### D6 — One localStorage key per duration

Keys are `snaketris.highscores.1`, `snaketris.highscores.3`, `snaketris.highscores.5`. `loadBoard(minutes)`, `saveBoard(minutes, board)` and `recordScore(score, role, minutes)` take the duration; the duration is read from `game.play` at the `recordScore` call site inside `update` (`js/highscores.js:60`).

- Why: the boards must not mix, and a per-key split is the smallest change that keeps each board independently top-10 sorted.
- The pre-split key `snaketris.highscores` is simply never read. No migration, no deletion.
- Alternative rejected: one key holding an object of three arrays. It keeps a single write path but makes the "pre-split entries are not shown" scenario depend on shape detection.
- `finishedResult` stays unchanged. Its only call site is `gameOver`, and the duration is available on `game.play`.

### D7 — The records view gains a duration selector row

The records view keeps one list and adds a three-item selector above it, driven by the same `SCREENS` mechanism with `cursor: 'arrow'` and a `game.screen` selection field. The cursor starts at the 1-minute board.

- Why: the selector is navigation, and navigation in this project is one table. `fillRecords` (`js/ui.js:108`) reads the selected board instead of the single board.

## Risks / Trade-offs

- [The comparison is lopsided at short durations — measured mean 45.9 for Tetris vs 13.1 for Snake at 1 minute] → Accept it as the game's result, not a defect. The timer makes a fixed-score-gap comparison the headline outcome. Surface it to the user before shipping; do not silently rebalance the ramp, which the specs forbid.
- [`benchmark.mjs` hard-codes `TICKS_PER_MINUTE = 3600`] → It stops matching the game once durations exist. Update it to read the chosen duration, or mark it as a 1-minute benchmark. Do not let a stale benchmark imply the game is bounded.
- [The 5-minute board is empty until someone plays 5 minutes] → Expected. The `highscores` delta already specifies a per-board empty state, so this reads as intended, not as a bug.
- [`applyAction` and `syncViews` are high-fan-in symbols] → `scripts/harness.mjs` sweeps every selection index and `verify-hud.mjs`, `verify-menu-geometry.mjs`, `verify-views.mjs` call `syncViews` directly. Run `npm run verify` after the change, not only `npm test`.
- [Six `verify-*` scripts enumerate page ids] → A new `#timer` element can break an id enumeration that assumes an exact set. Run the full harness and fix enumerations rather than special-casing the new element.
- [The countdown check adds work to the hot update step] → One integer subtraction per tick. Negligible; measure only if the harness reports a frame-time regression.
- [Two-player rematch keeps the duration while single-player re-asks it] → Intentional per the `two-player-local-mode` delta. `applyGameOverScreen` returns to the SHARED control step, which sits after the duration screen in the flow.

## Migration Plan

1. Constants and state: add `SELECT_DURATION` and the duration tick budgets to `js/constants.js`.
2. Navigation: add the `SCREENS` rows for the duration screen and the records selector; change the two menu items' `opens`; add the three `applyAction` cases; retarget `backToRoleSelect`.
3. Gameplay: store the budget on `game.play`, decrement in the update step, call `gameOver` at zero with the reason guard.
4. Readout: add `#timer` to `snaketris.html`, its CSS rule, and its `syncViews` show/place path.
5. Storage: split `js/highscores.js` by duration and point `fillRecords` at the selected board.
6. Tests and harness: extend the unit suites for the new state, screen, readout and boards; run `npm test` and `npm run verify`.
7. Rollback: the change is additive. Reverting the constants, the `SCREENS` rows and the storage keys restores the pre-split behaviour; no data migration is involved in either direction.

## Open Questions

- Whether the help view text should mention the countdown. The `start-menu` delta does not touch the help view, so this can be answered later without changing the specs, the approach, or the task breakdown.

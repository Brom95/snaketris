# Proposal

## Why

snaketris currently boots straight into the idle overlay ("Press R or click to start") and discards every game's final score the moment a new game begins. There is no entry point beyond the game board and no way to review past performance. This change adds a starting menu (Play / Records) and a persistent top-10 high-score board so the game has a proper entry point and players can review their best results across sessions.

## What Changes

- **New starting menu:** on launch, the game shows a three-item menu — "Play", "Records", and "How to Play" — in place of the current idle overlay. The selection moves with the arrow keys (and W/S) and is confirmed with Enter or Space; an item can also be chosen by clicking or tapping it (covering desktop mouse and touch). Selecting **Play** starts a new game; selecting **Records** opens the high-score view; selecting **How to Play** shows the controls and rules screen.
- **High-score persistence:** when a game ends, its final score is recorded with the date it was achieved and stored in `localStorage`. The board retains only the top 10 highest scores.
- **Records view:** the "Records" screen shows the top 10 scores in descending order, each with its date; an empty placeholder is shown when no games have been recorded. A control returns to the menu.
- **Help view:** the "How to Play" screen shows the game's controls (steering, start/restart) and rules, with a control to return to the menu.
- **Game-over flow:** after game over, control returns to the starting menu so the player can replay or review records.
- **Preserved unchanged:** all existing game mechanics (snake movement, classic growth, wrap-around, cell-by-cell +1 scoring, difficulty ramp, death conditions) and in-game keyboard steering (arrows/WASD) continue to work exactly as before; the in-game score display is unchanged.

No breaking changes; no new dependencies and no build step.

## Capabilities

### New Capabilities

- `start-menu`: the starting menu (Play / Records / How to Play), keyboard + pointer navigation and confirmation, launching the game, opening the records view, opening the help view, and returning to the menu after game over.
- `highscores`: the persistent top-10 score leaderboard — recording each finished game's final score with a date into `localStorage` and displaying the top 10 with dates in the records view.

### Modified Capabilities

- None. The existing `snaketris-game` capability's requirements (snake movement/growth, wrap-around, death conditions, falling pieces, edible/solid lifecycle, cell-by-cell scoring, difficulty ramp, restart) all remain true and unaltered; this change adds a new entry point and a persistence feature rather than changing any existing requirement.

## Impact

- **Code:** `js/constants.js` (new menu/records/help states), `js/state.js` (new states + score recording on game over), `js/app.js` (wiring), `js/render.js` (menu + records + help overlays), `js/input.js` (menu navigation + pointer/tap selection), and a new `js/highscores.js` module (load/save/insert the top-10 board in `localStorage`).
- **Dependencies/systems:** `localStorage` (browser API) for persistence; vanilla JS, single-file, no external assets.
- **Platform:** desktop browsers (keyboard + mouse), mobile browsers (touch/tap).
- **GitHub Pages:** the existing `pages.yml` workflow serves the change unchanged.

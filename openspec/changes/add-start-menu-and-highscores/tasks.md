# Tasks

## 1. High-score storage module

- [x] 1.1 Create `js/highscores.js` with a storage key constant and `loadBoard()` (returns the stored array from `localStorage`, or `[]` when missing/corrupt, tolerant via `try/catch`) and `saveBoard(board)` (writes the array as JSON); verify the module loads without error and round-trips an array through `localStorage` in the browser console
- [x] 1.2 Implement `recordScore(score)` that loads the board, inserts `{score, date: new Date().toISOString()}`, sorts by score descending then date descending, slices to the top 10, and saves; verify inserting a set of scores yields a correctly sorted, at-most-10-entry board in `localStorage`

## 2. New states and score recording

- [x] 2.1 Add `MENU`, `RECORDS`, and `HELP` to the states in `js/constants.js` (replacing the previous `IDLE`-as-start usage); verify the constants export the new state values
- [x] 2.2 In `js/state.js`, set the initial `game.state` and `resetGame()` to `MENU`, add `game.menuSelect` (reset to 0 on entry), and add a `toMenu()` that sets state to `MENU` and resets `menuSelect`; verify launching and restarting-from-menu both yield the `MENU` state
- [x] 2.3 In `js/state.js`, make `gameOver()` call `recordScore(game.score)` from `js/highscores.js` before setting the state; verify a finished game writes exactly one board entry with its final score and a date

## 3. Menu and records rendering

- [x] 3.1 Add layout constants for the menu item positions, the records list line positions, and the help-view section positions to `js/render.js`, sharing one source of truth used by the pointer hit-testing; verify the positions fit within the 720 px board height
- [x] 3.2 In `render.js`, replace the previous idle overlay with the menu drawing (a "snaketris" title, the "Play", "Records", and "How to Play" items, the highlighted item driven by `game.menuSelect`, and a hint line); verify the menu renders on launch with "Play" highlighted by default
- [x] 3.3 In `render.js`, add the records view drawing (a "Records" title, up to 10 numbered lines each showing rank, score, and formatted date, an empty-state message when the board is empty, and a "Menu" return label); verify it renders the loaded top-10 board with dates and the empty-state message when no scores exist
- [x] 3.4 In `render.js`, add the help view drawing (a "How to Play" title, a short controls section covering steering and start/restart, a short rules section covering eating for points, avoiding solids and self, and edge wrap, and a "Menu" return label); verify it renders the controls and rules and fits within the 720 px board

## 4. Menu interaction

- [x] 4.1 Extend `onKey` in `js/input.js` to branch on `MENU`: arrows/W-S move `game.menuSelect` through the three items, Enter/Space confirm (Play → `startGame()`, Records → `RECORDS`, How to Play → `HELP`), and R is a shortcut to start, with `preventDefault`; verify keyboard navigation moves the highlight and Enter/Space selects the correct item
- [x] 4.2 Extend `onKey` for `RECORDS` (Enter/Space/Esc → `toMenu()`), `HELP` (Enter/Space/Esc → `toMenu()`), and `GAME_OVER` (R/Enter/Space → `toMenu()`), leaving the `PLAYING` branch byte-for-byte unchanged; verify the returns to the menu work and that in-game steering and the existing R behavior are unaffected
- [x] 4.3 In `onPointerUp`, branch on state before the existing tap-vs-swipe logic: in `MENU` select the item whose logical y-range contains the tap (via `toLogical()`), in `RECORDS`/`GAME_OVER` return to `MENU`, each returning early; verify click/tap selects a menu item and returns from records/game-over without altering in-game steering or tap-zone steering

## 5. Wiring and integration

- [x] 5.1 In `js/app.js`, import `js/highscores.js` and ensure the app boots to the menu; verify the page loads, boots to the menu, and the highscores module is reachable
- [ ] 5.2 Verify the full desktop flow in a browser: launch menu → Play → play a game → game over → menu → Records shows the top 10 with dates → menu, and → How to Play shows the controls and rules → menu; confirm scores persist across a page reload, the top-10 cap holds after multiple games, and all existing in-game mechanics (movement, classic growth, wrap-around, +1 per-cell scoring, difficulty ramp, death conditions) are unchanged
- [ ] 5.3 Verify in a mobile browser / DevTools mobile emulation: the menu, records, and help views are fully visible and selectable by touch (tap to start, tap to view records, tap to view help, tap to return to menu) and in-game touch/swipe steering still works

## 6. Deploy

- [ ] 6.1 Push the change to `main`, confirm the GitHub Pages workflow deploy goes green, and verify the live site loads the menu + records and is playable on a desktop and a mobile viewport

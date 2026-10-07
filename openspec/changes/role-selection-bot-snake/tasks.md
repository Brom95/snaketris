# Tasks

## 1. State and constants foundation

- [x] 1.1 Add `SELECT_ROLE` to the state enum and `ROLE_ITEMS = ['Snake', 'Tetris']`, `PIECE_BONUS = 4`, `LINE_CLEAR_POINTS = 10` to `js/constants.js` and verify `tests/constants.test.js` asserts each new value
- [x] 1.2 Rename `game.score` to `game.snakeScore` and add `game.tetrisScore`, `game.role`, `game.pieceMoveAcc` in `js/state.js`; update `resetGame`, `startGame` and `gameOver` and verify `tests/state.test.js` shows both scores at 0 after `startGame()` and the recorded score matching the role
- [x] 1.3 Update every reader of the old score (`js/pieces.js`, `js/snake.js`, `js/ui.js`, `js/highscores.js`) and verify the existing suite still passes with the renamed field
- [x] 1.4 Shorten the starting snake to three segments in `resetSnake()` and verify `tests/state.test.js` asserts exactly three segments in a straight line on the middle row after `startGame()` and after a restart

## 2. Role sub-menu

- [x] 2.1 Add the role item list to `snaketris.html` under `#menu-view` and verify the list renders two items and the main menu still renders exactly three
- [x] 2.2 Add the `SELECT_ROLE` branch to `handleIntent` in `js/input.js`, replacing the hardcoded `% 3` with `MENU_ITEMS.length`, and verify `tests/input.test.js` covers up/down selection, confirm starting the game with the chosen role, and Escape returning to `MENU`
- [x] 2.3 Add `SELECT_ROLE` key mapping to `keyToIntent` in `js/devices.js` and verify `tests/devices.test.js` (or the input tests) returns `menuUp`, `menuDown`, `confirm` and `toMenu` for the expected keys
- [x] 2.4 Add `SELECT_ROLE` handling to `pollController` (D-pad up/down, A confirms, B returns) and verify a test asserts A starts the game with the highlighted role and B returns to `MENU`
- [x] 2.5 Make `syncViews` in `js/ui.js` show the role list only in `SELECT_ROLE` and highlight it from `game.roleSelect` and verify the main menu items are not highlighted while the sub-menu is open
- [x] 2.6 Wire pointer selection of a role item in `onInterfacePointerUp` and verify clicking "Tetris" starts a Tetris-role game
- [x] 2.7 Move the role list into its own `#role-view` in `snaketris.html` with a role title and a Back control, and verify the static-HTML test asserts the role view holds the title, the two items and the Back control
- [x] 2.8 Show `#role-view` only in `SELECT_ROLE` and hide `#menu-view` there in `syncViews`, and verify `tests/ui.test.js` asserts the menu view and its items are off while the role screen is on
- [x] 2.9 Route a click or tap on the Back control to `toMenu` in `onInterfacePointerUp` and verify a test asserts the state returns to `MENU` and no game started

## 3. Piece control

- [x] 3.1 Implement `movePiece(dc)` in `js/pieces.js` with bounds and SOLID checks and verify `tests/pieces.test.js` asserts a legal shift moves one cell and a blocked shift leaves the piece unchanged
- [x] 3.2 Implement `rotatePiece(p, cw)` with the CW/CCW offset rule, bounding-box normalisation, and rejection on out-of-bounds or SOLID overlap, and verify `tests/pieces.test.js` covers a legal rotation, a wall-blocked rotation, and a solid-blocked rotation for all seven shapes
- [x] 3.3 Add the `game.pieceMoveAcc` tick and the `snakeTicksPerCell()` gate to the shift path and verify a test asserts two presses inside one interval produce exactly one cell of movement, and that the gate follows the ramp
- [x] 3.4 Route shift and rotation intents through `handleIntent` only when `game.role === 'tetris'`, and verify a test asserts a steering intent in Tetris role does not change `game.nextDir`
- [x] 3.5 Map a tap in the centre region of the board to a rotation in `js/devices.js` (`tapToShift` reports the centre, `pieceGesture` turns it into a rotate intent) and verify `tests/devices.test.js` asserts a centre tap rotates while a side tap still shifts

## 4. Bot — snake policy

- [x] 4.1 Create `js/bot.js` with `chooseBotDir()` and verify `tests/bot.test.js` asserts the safety filter order: no reverse, no SOLID, no own body except the tail
- [x] 4.2 Implement pursuit of the nearest in-grid falling-piece cell by torus distance and verify a test asserts the bot chooses the direction that reduces that distance
- [x] 4.3 Implement the no-target cases and verify a test asserts the bot keeps its direction when no piece is falling and when the piece is entirely above the playfield
- [x] 4.4 Implement the no-safe-direction case and the exit tie-break, and verify a test asserts the bot keeps a doomed direction when every direction is unsafe, and prefers a direction that leaves at least one safe exit
- [x] 4.5 Assert determinism: verify a test calls `chooseBotDir()` twice on the same state and gets the same direction
- [x] 4.6 Register `botSystem` before `snakeSystem` in `js/app.js` and verify a test asserts the bot's direction is applied before the snake steps, and that the snake still steps before the pieces

## 5. Bot — piece policy

- [x] 5.1 Implement `choosePieceMove()` in `js/bot.js` as a pure function that simulates every legal rotation in every column and returns the best target rotation and column, and verify `tests/bot.test.js` asserts the score formula `10 × rows that become full − 2 × holes below − 1 × stack height`
- [x] 5.2 Verify the heuristic scenarios: a move that completes a row beats one that does not; equal rows prefer the option with no hole; equal score ties break by rotation index then column
- [x] 5.3 Apply the chosen move as one action per decision (shift one cell toward the target column, or rotate when already in the target column), and verify a test asserts the bot never issues more than one shift per throttle interval
- [x] 5.4 Route the bot's shift through the same `pieceMoveAcc` gate as the player and verify a test asserts the bot's lateral speed equals the player's at both base speed and a ramped tier
- [x] 5.5 Verify the bot issues no piece action in Tetris role and no snake direction in Snake role
- [x] 5.6 Assert determinism: verify a test calls `choosePieceMove()` twice on the same state and gets the same shift and rotation

## 6. Scoring and HUD

- [x] 6.1 Attribute eaten cells to `snakeScore` and the whole-piece bonus of 4 in `js/snake.js` and verify `tests/snake.test.js` asserts +1 per cell and +4 when the last cell of a piece is consumed
- [x] 6.2 Attribute landed cells and line clears to `tetrisScore` regardless of role in `js/pieces.js` and verify `tests/pieces.test.js` asserts +1 per landed cell and +10 on a clear, and that neither adds to `snakeScore`
- [x] 6.3 Implement the top-out check in `landPiece` and verify `tests/pieces.test.js` asserts `gameOver()` when a piece lands with zero cells inside the grid, and that a partial landing does not end the game
- [x] 6.4 Show both labelled scores in the HUD in both roles and no role name in `js/ui.js`, and verify a test asserts the readout text for each role
- [x] 6.5 Show the winner and both final scores in the game-over status and verify a test asserts the winner string for a Tetris win, a snake win, and a draw

## 7. Records

- [x] 7.1 Store `role` on each high-score entry in `js/highscores.js` and verify `tests/highscores.test.js` asserts the recorded role matches the played role and that the recorded score is that side's score
- [x] 7.2 Read entries without a `role` field as `'snake'` and verify a test seeds a legacy entry and asserts it is listed with the Snake marker
- [x] 7.3 Render the role marker (🐍 / 🏗️) on every entry of the single records board and verify a test asserts each listed entry carries its role marker, including a legacy entry
- [x] 7.4 Add the same markers to the role sub-menu items in `snaketris.html` and verify the Snake item shows 🐍 and the Tetris item shows 🏗️

## 8. Help and documentation

- [x] 8.1 Add the role choice, the shift/rotate controls, the bot's role, and the blocked-rotation rule to the help view in `snaketris.html` and verify the help text fits the viewport width at the narrowest supported size
- [x] 8.2 Update `QWEN.md` and `AGENTS.md` where they describe the single-role game and the 24×30 board, and verify the stated board size matches `COLS`/`ROWS` in `js/constants.js`
- [x] 8.3 List the gamepad controls (D-pad/left stick steering, D-pad shift and rotate in Tetris role, A confirm, B back) in the help view and verify a test asserts each device line is present in `snaketris.html`

## 9. Integration verification

- [x] 9.1 Run the full `node:test` suite and `openspec validate role-selection-bot-snake --strict` and confirm both report no failures
- [x] 9.2 Run ripwire `quality_delta` against git HEAD and confirm no new failure modes are reported
- [x] 9.3 Play one game in each role in a browser and confirm: the role sub-menu opens from Play with the 🐍 and 🏗️ markers, the piece shifts and rotates with the cooldown, the bot moves and eats, both scores update, the records board shows the role marker on each entry, and the game-over screen names the winner
- [x] 9.4 In the browser check, confirm the role screen hides the main menu items, the title and the GitHub link, and that clicking Back returns to the main menu

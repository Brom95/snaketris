# Design

## Context

The game is a single self-contained `snaketris.html`: a 24×30 logical grid drawn on a 576×720 canvas (`BOARD_W` × `BOARD_H`), driven by a fixed-timestep (1/60 s) `requestAnimationFrame` loop in `js/app.js`. It is a modular vanilla-JS app with no build step: `constants.js` (constants + states), `state.js` (the shared `game` object + `resetGame`/`startGame`/`restart`/`gameOver`), `snake.js`/`pieces.js`/`grid.js` (gameplay), `render.js` (canvas painting + overlays), and `input.js` (keyboard + pointer).

Current on-screen flow: on launch the `IDLE` state draws the overlay "snaketris / Press R or click to start"; the game runs in `PLAYING`; on death `gameOver()` sets `GAME_OVER`, which draws "Game Over / Press R or click to restart". R or a click/tap restarts. Score is `game.score` (+1 per eaten cell) and is discarded on restart. There is no persistence and no menu.

Constraints (from the proposal and the existing codebase): vanilla JS only, no external dependencies, no build step; every module mutates the shared `game` object in place; all existing game mechanics, the in-game score display, and keyboard/touch steering must remain intact. The pointer path (from the `mobile-adaptation` change) maps client coordinates to logical canvas space via `toLogical()` and classifies gestures as tap or swipe.

## Goals / Non-Goals

**Goals:**
- A starting menu (Play / Records / How to Play) is the initial screen and is shown again after game over.
- The menu is navigable and confirmable with the keyboard (arrows/W-S to move, Enter/Space to confirm) and selectable by clicking or tapping (desktop mouse + touch).
- Selecting Play starts a new game; selecting Records opens the high-score view; selecting How to Play opens the help view.
- Each finished game's final score is recorded with its date and persisted in `localStorage`; the board keeps the top 10 highest scores.
- The records view shows the top 10 scores with dates (descending) and an empty-state message, and returns to the menu.
- All existing game mechanics and input behavior are preserved.

**Non-Goals:**
- No change to snake movement, growth, wrap-around, piece falling, scoring, difficulty ramp, or death conditions.
- No sound, no high-score editing/clearing UI, no player name/username, no online sync, no new dependencies or build step.
- No change to the in-game (PLAYING) score display or steering.

## Decisions

**D1 — Add `MENU`, `RECORDS`, and `HELP` states; repurpose `IDLE` as the menu.**
Add `MENU`, `RECORDS`, and `HELP` to `constants.js` and use `MENU` as the launch state (replacing the previous `IDLE`-as-start-overlay behavior). `resetGame()` and the initial `game.state` become `MENU`; `render.js` draws the menu in `MENU` instead of the "Press R to start" overlay. `GAME_OVER` is kept for feedback but now routes to the menu on input (see D7). This keeps the state machine small (MENU ↔ PLAYING ↔ GAME_OVER ↔ RECORDS ↔ HELP) and reuses the existing state-gating pattern (`update()` already no-ops outside `PLAYING`).
*Alternative considered:* keep `IDLE` and just draw the menu in it — rejected because "IDLE" no longer describes the screen and the rename makes the intent explicit; keep `RECORDS` and `HELP` as separate states because the records and help views are distinct screens with their own input handling.

**D2 — Canvas-drawn menu, records, and help views.**
The menu, records view, and help view are painted on the same canvas using the existing `drawText` helper in `render.js`, so they inherit the responsive `fitCanvas()` scaling automatically. The menu draws a "snaketris" title, the three items ("Play", "Records", "How to Play") at fixed logical y-positions, and a hint line; the highlighted item is rendered with a distinct style (larger/brighter + a "▶" prefix). The records view draws a "Records" title, up to 10 numbered lines (rank, score, date), an empty-state line when the board is empty, and a "Menu" return label at the bottom. The help view draws a "How to Play" title, a short controls section (steering + start/restart), a short rules section (eat for points, avoid solids and self, edges wrap), and a "Menu" return label at the bottom. Layout positions are module-level constants so pointer hit-testing (D3) and rendering share one source of truth.
*Alternative considered:* an HTML `<nav>`/panel overlaid on the canvas — rejected because it would break the single-canvas rendering model, complicate the pointer/coordinate mapping, and diverge from the `mobile-adaptation` precedent of keeping everything canvas-based.

**D3 — Keyboard + pointer interaction, branched by state.**
The shared `input.js` extends `onKey` and the pointer handlers to branch on `game.state`:
- `MENU`: arrows/W-S move a selection index (`game.menuSelect`, 0 = Play, 1 = Records, 2 = How to Play, reset to 0 on entry); Enter/Space confirms (Play → `startGame()`; Records → `RECORDS`; How to Play → `HELP`); R is a shortcut to start; pointer taps select an item via logical-coordinate hit-testing (see D3b).
- `RECORDS`: Enter/Space/Esc or any click/tap returns to `MENU`.
- `HELP`: Enter/Space/Esc or any click/tap returns to `MENU`.
- `GAME_OVER`: R/Enter/Space or any click/tap returns to `MENU`.
- `PLAYING`: unchanged (R ignored; arrows/WASD steer via the existing no-reverse rule).
- **D3b — pointer hit-testing:** in `onPointerUp`, the handler first checks the state. In `MENU`/`RECORDS`/`HELP`/`GAME_OVER` it ignores the existing tap-vs-swipe steering classification and acts on the logical tap position (computed by the existing `toLogical()`): in `MENU` it selects the item whose logical y-range contains the tap; in `RECORDS`/`HELP`/`GAME_OVER` it returns to `MENU`. The `PLAYING` path is untouched, so steering and tap-zone steering behave exactly as before.
*Alternative considered:* an on-screen D-pad or button HTML elements — rejected (see D2) and unnecessary; the three-item menu and the screen returns are simple enough for keyboard + click/tap.

**D4 — `localStorage` data model for the high-score board.**
A new `js/highscores.js` module owns the board: a fixed storage key (`snaketris.highscores`), `loadBoard()` (returns the stored array or `[]`, tolerant of missing/corrupt JSON), `saveBoard(board)`, and `recordScore(score)` (load → insert `{score, date}` → sort by score desc then date desc → slice to 10 → save). Each entry stores the integer `score` and the achievement `date` as an ISO-8601 string (`new Date().toISOString()`), so sorting is exact and entries are timestamp-unique. Display formats the ISO date to a human-readable form (`YYYY-MM-DD`) in the records view.
*Alternative considered:* store a human-readable date string — rejected because it is not sortable and is locale-dependent; ISO is stored and formatted only at render time. *Alternative:* a `JSON` key with a schema version — overkill for this scope; a plain array is sufficient and trivially migrated.

**D5 — Record the score at game over.**
`gameOver()` (in `state.js`) is the single point where a game ends; it calls `recordScore(game.score)` from the new module before setting the state. This guarantees exactly one record per finished game, using the final score, at the moment the result is final.
*Alternative considered:* recording in `render.js` or the game loop — rejected because those are not a reliable "game ended" event and could record multiple times or stale values.

**D6 — Game-over returns to the menu.**
On death, `GAME_OVER` is set for feedback; on any "continue" input (R/Enter/Space or click/tap) the state becomes `MENU`. This preserves the existing "press something to continue" interaction while routing to the menu hub instead of an immediate restart. The "restart" requirement is still satisfied because the menu's Play item starts a new game.
*Alternative considered:* go straight to `MENU` with no `GAME_OVER` feedback — rejected because it removes the "Game Over" acknowledgment; *alternative:* immediate auto-return after a timer — rejected because it can race with the user's input and adds a timer.

**D7 — Preserve the existing pointer steering in `PLAYING`.**
The `onPointerUp` tap-vs-swipe classification and `setDirection`/no-reverse logic are only reached when `game.state === PLAYING`. All new-state branches return early before that logic, so steering, tap-zone steering, and the tap-to-restart behavior are byte-for-byte preserved for in-game play.

## Risks / Trade-offs

- [Pointer handler now branches on state, increasing `onPointerUp` complexity] → Mitigated by early returns per state and by keeping the `PLAYING` path last and untouched; the steering logic is unchanged.
- [Menu/records hit-testing depends on hardcoded logical positions] → Mitigated by a single source of truth (layout constants) shared by render and input; positions are centered and well-separated so tap zones do not overlap.
- [`localStorage` may be absent or full in some contexts (e.g., private/sandboxed)] → Mitigated by `loadBoard`/`saveBoard` wrapping in `try/catch` and defaulting to an empty board; a missing board degrades to "no scores yet" without breaking the game.
- [Repurposing `IDLE` → `MENU` changes the initial overlay text/behavior] → This is an intended UX change, not a gameplay change; all `snaketris-game` requirements remain true.
- [Records list of 10 lines may be tall] → Within the 720 px board at ~40 px/line plus title/return; verified to fit during apply.
- [Help text may be tall] → Short phrasing + compact line height; verified to fit within the 720 px board during apply.

## Migration Plan

1. Implement `js/highscores.js`, add states to `constants.js`, and update `state.js` (launch state → `MENU`, `gameOver()` records the score and routes via `GAME_OVER`).
2. Add menu + records + help rendering to `render.js` (reuse `drawText`), and extend `input.js` (state-branched keyboard + pointer handlers) and `app.js` (import/wire `highscores`).
3. Verify in a desktop browser: launch shows the menu; Play starts and the game behaves exactly as before (movement, growth, wrap, scoring, difficulty, death); game over returns to the menu; Records shows the top 10 with dates (and the empty state); How to Play shows the controls and rules; scores persist across reloads; the top-10 cap holds.
4. Verify in a mobile browser / DevTools mobile emulation: the menu and records are fully visible and selectable by touch (tap a menu item to play or view records; tap/click to return from records).
5. Push to `main`; the existing `.github/workflows/pages.yml` deploys automatically; verify the live site.
6. Rollback: `git revert` the commit; the previous `snaketris.html`/`js` files are intact in history, and any written `localStorage` key is ignored by the reverted code.

## Open Questions

- None. Exact menu/records/help layout pixel positions, the date display format, the empty-state wording, and the help-screen wording are presentation details resolvable during apply without changing the specs or the approach.

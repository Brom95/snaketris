# Tasks

## 1. Game over lands on a painted screen

- [x] 1.1 `applyGameOverScreen` in `js/screens.js` writes a screen id the table resolves plus the
      SHARED step in two-player mode, and the screens test asserts that both a single-player and a
      two-player finish resolve in `SCREEN_BY_ID`
- [x] 1.2 The screens test drives a two-player game to a finish and asserts the state is
      `SELECT_CONTROL` with `gameControlStep` equal to `GAME_CONTROL_START`, so no state the table
      cannot name is ever written

## 2. P2's role stays visible

- [x] 2.1 `#role-line` in `snaketris.html` leaves `#role-view` and becomes a direct child of `#ui`,
      keeping its id and its `view` class, and `scripts/verify-role-line.mjs` still reads the same
      text by that id
- [x] 2.2 `syncViews` in `js/ui.js` shows the role line and sets its text only while both roles are
      assigned, and a ui test asserts that no line prints the text `null` before a role is chosen
- [x] 2.3 The per-player summary lines paint on every control step rather than only the shared step,
      and a ui test asserts the P1 control step names both roles and marks an unchosen model
- [x] 2.4 `scripts/verify-role-line.mjs` and `scripts/verify-two-player-gating.mjs` still pass
      against the moved element, checked by `npm run verify`

## 3. Every preparation stage names itself

- [x] 3.1 `initUi` in `js/ui.js` grabs `#role-title` and `#control-title`, and a ui test asserts both
      elements resolve
- [x] 3.2 `paintStageTitle` writes the stage name, its position, and the acting player from the same
      table entry the cursor uses, and a ui test asserts the role screen names P1 as the picker and
      each control step states its position and who acts
- [x] 3.3 `scripts/verify-page-layout.mjs` and `scripts/verify-views.mjs` stay green with the new
      title text, checked by `npm run verify`

## 4. Each player drives their own character

- [x] 4.1 `keyboardModelForKey` moves from `js/input.js` into `js/devices.js` and accepts both the
      raw `e.key` forms and the lowercased arrow names, and the input test still resolves a model
      from `e.key`
- [x] 4.2 `playingKeyIntent` resolves the player who locked the pressed keyboard model and applies
      that player's role, and a devices test asserts that WASD and Arrows drive different characters
      when P1 locked WASD and P2 locked Arrows
- [x] 4.3 A keyboard model no player locked produces no play action, and a devices test asserts an
      unclaimed Arrow key yields nothing
- [x] 4.4 `handleIntent` in `js/input.js` accepts a piece shift or rotation when the piece is
      human-driven in two-player mode, and an input test asserts a `pieceShift` intent moves the
      piece while `setDirection` stays byte-for-byte stable
- [x] 4.5 The gamepad path resolves the role from the player who locked `gamepad`, and a devices test
      asserts a pad player who locked the gamepad drives their own character
- [x] 4.6 `scripts/verify-role-duel.mjs` and `scripts/verify-controller-input.mjs` stay green, checked
      by `npm run verify`

## 5. Integration checks

- [x] 5.1 `npm test` reports the pre-existing `tests/app.test.js` engine-order failure as the only
      failing check (191 tests, 190 pass), and `npm run verify` reports "All 12 checks passed."

## Workflow follow-up

- Sync the delta in `specs/two-player-local-mode/spec.md` into
  `openspec/specs/two-player-local-mode/spec.md`.
- Validate the specs and archive the change.
- Commit the change and push to `origin/main`.

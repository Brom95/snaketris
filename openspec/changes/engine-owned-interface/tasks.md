# Tasks

## 1. Screen table data

- [x] 1.1 Add `js/screens.js` exporting the screen table: one entry per screen (`MENU`, `SELECT_ROLE`, `SELECT_CONTROL`, `RECORDS`, `HELP`, `GAME_OVER`), each with its items in page order, and for each item its label, marker, key hints, and the screen or transition it opens. Declare back and reassign controls per screen. Verify a unit test `tests/screens.test.js` reads the table and asserts every screen, its item order, and each item target.
- [x] 1.2 Verify the table matches the current screens: assert the table's menu labels equal `MENU_ITEMS`, its role items equal `ROLE_SCREEN_ITEMS`, and its control items equal `CONTROL_SCREEN_ITEMS`, so no screen or label is invented.
- [x] 1.3 Verify every table entry resolves to a real page element id by asserting each item carries the id the page already uses, and document in `design.md` notes which ids the table owns.

## 2. State split

- [x] 2.1 Split `js/state.js` into `game.play` (snake, pieces, scores, accumulators, tick, result) and `game.screen` (state, selections, models, control step), keeping `game` as the single root import. Verify `npm test` stays at the documented baseline and a new test asserts a write to one half changes no field of the other half.
- [x] 2.2 Move the navigation transitions (`toMenu`, `backToRoleSelect`, `pickP1Role`, `reassignP1`, `reassignP2`, `lockControlModel`, `advanceControlStep`, `currentControlPlayer`, `controlModelAssigned`) out of `state.js` into the screen layer. Verify `state.js` no longer imports `MENU`, `SELECT_CONTROL`, `GAME_CONTROL_P1`, `GAME_CONTROL_P2`, `GAME_CONTROL_START`, and verify `tests/state.test.js` still passes after its imports are repointed.
- [x] 2.3 Replace the raw string `'SELECT_ROLE'` in `backToRoleSelect` with the shared screen constant. Verify a test asserts the screen value equals the constant.

## 3. Screen system in the registry

- [x] 3.1 Implement the screen system: an ordered `{ name, init, update }` entry that drains the intent queue at the start of its update step and applies transitions from the table. Verify a headless unit test drives `MENU` to `SELECT_ROLE` to `PLAYING` with no page element present and no `document` lookup on that path.
- [x] 3.2 Verify the screen system rejects an intent the current screen has no item for, and that navigation state does not change.
- [x] 3.3 Register the screen system as the fourth entry in `js/app.js createEngine([...])`, after the three gameplay systems. Verify `tests/app.test.js` asserts the new order, and state in the commit note that the pre-existing engine-order failure at HEAD is accounted for, not fixed.
- [x] 3.4 Verify presentation is not registered: assert the registry holds no canvas painting step and no page painting step.

## 4. Input thinning

- [ ] 4.1 Reduce `js/input.js` to device-to-intent work plus the queue push: delete `confirmSelection`, `openMenuItem`, and the index-based `moveSelection` branches. Verify no index-based screen branch remains in `input.js` and that `handleIntent` routes only steering, piece control, and queue pushes.
- [ ] 4.2 Verify the shared steering branch (`setDirection`, PLAYING gate plus no-reverse) stays byte-for-byte stable. Verify `tests/input.test.js` and the keyboard, touch, and gamepad harnesses still pass.
- [ ] 4.3 Verify `npm run verify` reports every harness exit code unchanged from the documented baseline.

## 5. Interface painting from the table

- [ ] 5.1 Make `js/ui.js syncViews` paint from the table: view visibility, item highlight, key hints, per-player status, and summary text read the table entry for the current screen instead of hard-coded index mapping. Verify `verify-views`, `verify-menu-geometry`, and `verify-role-duel` pass with the same element ids and the same `.view`/`.view.on` classes.
- [ ] 5.2 Move the page element lookup to one owner: `ui.js` exposes the item lists and the named controls, `input.js` hit-tests against that same map. Verify `input.js` contains no `querySelectorAll` and no `getElementById` for interface elements.
- [ ] 5.3 Unify the viewport math: one helper answers the stacked-layout rule and the gap, and both the interface band and the field fit read it. Verify `verify-page-layout` and `verify-field-only` pass, and verify a unit test asserts the band and the fit agree for one viewport.

## 6. Records out of the core

- [ ] 6.1 Make `gameOver()` set `game.play.result` and stop calling `recordScore`. Verify a test asserts the core reports the result and that no gameplay module imports `highscores.js`.
- [ ] 6.2 Add the records owner that persists a reported result once and clears it. Verify a test asserts one board entry per finished game and that a failed storage write leaves navigation and gameplay unchanged.
- [ ] 6.3 Verify the gameplay core runs with no page object and no storage object available. Verify a unit test runs the three gameplay systems with `document`, `window`, and `localStorage` absent and finishes the tick.

## 7. Integration checks

- [ ] 7.1 Run `npm test` and `npm run verify` and record the counts against the documented baseline, keeping the pre-existing `tests/app.test.js` engine-order failure accounted for.
- [ ] 7.2 Run the ripwire quality checks on the working tree: `--quality-delta` and the CLI `--test-gate`, and confirm with `--quality-delta=HEAD..HEAD` that any gated row is not an index artifact.
- [ ] 7.3 Update `QWEN.md` unit-check and harness counts and the module list so the project docs stay true.

## Workflow follow-up

- Sync the `engine-architecture` delta into `openspec/specs/` and run `openspec validate --specs`.
- Archive the change once the user confirms the checks, then commit and push.

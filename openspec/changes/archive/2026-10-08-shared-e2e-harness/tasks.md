# Tasks

## 1. Shared harness

- [x] 1.1 Create `scripts/harness.mjs` with `check`, `report`, `stubDom`, `servePage`, `waitFor`, `shown`, and `snapshot`.
  Verify: `node -e "import('./scripts/harness.mjs').then(m => console.log(Object.keys(m)))"` lists all seven exports.
- [x] 1.2 Move the Playwright helpers from `scripts/verify-role-duel.mjs` into `scripts/harness.mjs`, keeping the recorded gotchas as comments.
  Verify: `node scripts/verify-role-duel.mjs` exits 0 with every check passing (51 checks; the script gained the static menu and role-screen geometry checks before this change, so the 36 in the proposal is stale).

## 2. Repair the broken scripts

- [x] 2.1 Repoint `scripts/verify-controller-input.mjs` imports to `js/devices.js` (`pollController`, `keyToDir`, `tapToDir`, `swipeToDir`) and keep `initInput` from `js/input.js`.
  Verify: the script runs and reports 0 failures.
- [x] 2.2 Repoint `scripts/verify-github-icon.mjs` and `scripts/verify-field-only.mjs` to `js/devices.js` for `onPointerDown`, `onPointerMove`, and `onPointerUp`.
  Verify: both scripts run without a `SyntaxError`.
- [x] 2.3 Check whether `scripts/verify-field-only.mjs` still covers a current behaviour. Repair it if it does; delete it if it does not.
  Verify: the remaining assertions match the current `js/ui.js` and `js/input.js` behaviour.
- [x] 2.4 Fix the stale assertions in `scripts/verify-menu-geometry.mjs`: "Enter on 'Play'" and "R" now open `SELECT_ROLE`, not a game.
  Verify: the script reports 0 failures.
- [x] 2.5 Fix the stale help-line list in `scripts/verify-views.mjs`.
  Verify: the script reports 0 failures.

## 3. One stub stack

- [x] 3.1 Replace the inline DOM, window, storage, gamepad, and canvas stubs in `verify-views.mjs`, `verify-menu-geometry.mjs`, `verify-hud.mjs`, and `verify-controller-input.mjs` with `stubDom`.
  Verify: no script defines its own `makeEl` or `window` stub.
- [x] 3.2 Delete `scripts/controller-stubs.mjs` if every importer now uses `stubDom`.
  Verify: no script imports it.

## 4. One command

- [x] 4.1 Create `scripts/verify-all.mjs` that runs every harness script and prints the exit code of each.
- [x] 4.2 Add `"verify": "node scripts/verify-all.mjs"` to `package.json` and fix `"test"` to `node --test \"tests/**/*.test.js\"`.
  Verify: `npm run verify` and `npm test` both exit 0.
- [x] 4.3 Remove `puppeteer-core` from `devDependencies`.
  Verify: `grep -r puppeteer scripts tests` finds no use.

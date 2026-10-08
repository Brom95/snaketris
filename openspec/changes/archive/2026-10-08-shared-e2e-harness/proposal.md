# Proposal

## Why

The verification layer is nine scripts and 1,941 lines. Each script re-declares its own `check(cond, message)` helper, its own exit-code tail, and its own DOM, canvas, `localStorage`, and gamepad stubs. Four parallel stub stacks exist: `scripts/controller-stubs.mjs`, and inline stubs in `verify-views.mjs`, `verify-menu-geometry.mjs`, `verify-hud.mjs`, plus `tests/helpers/dom-stub.js` for the unit tests.

Three scripts cannot run at all. Commit `a57582b` moved the device adapters from `js/input.js` to `js/devices.js`, and these imports were never repointed:

```
verify-controller-input.mjs  SyntaxError: does not provide an export named 'keyToDir'
verify-github-icon.mjs       SyntaxError: does not provide an export named 'onPointerDown'
verify-field-only.mjs        SyntaxError: does not provide an export named 'onPointerDown'
```

Two more assert behaviour that no longer exists: `verify-menu-geometry.mjs` fails on "Enter on 'Play' starts the game" and "R starts the game from the menu" (both now open the role screen), and `verify-views.mjs` fails on an outdated help-line list. A failing harness is worse than no harness: it trains the reader to ignore the red output.

There is no single command that runs everything. Each script is invoked by hand.

## What Changes

- Add `scripts/harness.mjs`: one `check`, one `report`, one `stubDom`, one Playwright `servePage`, plus `waitFor`, `shown`, and `snapshot` helpers.
- Repoint `verify-controller-input.mjs`, `verify-github-icon.mjs`, and `verify-field-only.mjs` at `js/devices.js`.
- Fix the stale assertions in `verify-menu-geometry.mjs` and `verify-views.mjs`.
- Replace the inline stub stacks with `stubDom`.
- Add `scripts/verify-all.mjs` and an `npm run verify` script that runs every harness.
- Fix the `test` script glob in `package.json` so it matches `tests/**/*.test.js`.
- Remove the unused `puppeteer-core` devDependency.

## Capabilities

### New Capabilities

None. This change adds tooling, not product behaviour.

### Modified Capabilities

None. No spec-level requirement changes.

## Impact

- `scripts/`: one new shared module, one new runner, seven updated scripts, one deleted stub module.
- `package.json`: `verify` script, corrected `test` glob, one removed devDependency.
- No change to `js/`, `snaketris.html`, or `tests/`.

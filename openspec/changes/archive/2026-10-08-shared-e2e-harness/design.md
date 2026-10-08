# Design

## No spec delta

This change adds test tooling. It changes no requirement in `openspec/specs/`, so `.openspec.yaml` sets `skip_specs: true`.

## Shared module surface

`scripts/harness.mjs` exports:

```js
check(cond, message)                        // prints ✓ or ✗ FAIL and counts the failure
report(name, extra)                         // prints "name passed." or "name FAILED: N assertion(s)", sets exit code
stubDom({ elements, rects, lists, window, storage, gamepads, canvas })
servePage(page, rootDir)                    // routes http://duel.test/ to the repo files
waitFor(page, predicate, arg, timeout)      // awaits a predicate that runs in the page
shown(page, selector, want)                 // waits for the settled .on class, then reads visibility
snapshot(page)                              // reads the live game state from the page
```

`shown` and `snapshot` are the implemented form of the planned `visible` / `gameState`
helpers: a plain visibility read is unreliable because the view classes lag one
rendered frame, so both helpers wait before reading.

`check` and `report` replace the eight copies of the same two functions. The exit-code tail (`failures === 0 ? 0 : 1`) is written once.

## Stub shape

`stubDom` produces the object the scripts already need: an element map keyed by id, a rect map for hit-testing, a `window` with `innerWidth`/`innerHeight`, a `localStorage`, a gamepad list, and a canvas. Two of the four current `window` stubs omit `innerWidth` and `innerHeight`, which makes `fitCanvas` and `interfaceBandHeight` return `NaN`. One shared stub removes that class of bug.

`tests/helpers/dom-stub.js` stays separate. Unit tests need a seeded RNG (seed 20240601) for determinism; harness scripts do not. Merging them would couple two different needs.

## Playwright layer

`verify-role-duel.mjs` already has `serve`, `expose`, `until`, `stateIs`, `shown`, `snapshot`, `freshPage`, `centreTapRotates`, and `playRole`. Those move into `harness.mjs` so the other scripts can use them. The Playwright gotchas recorded in that file stay as comments in the shared helpers:
- `waitForFunction` does not await an async predicate.
- A page predicate cannot see Node closures; pass values as the second argument.
- Use one `browser.newContext()` for shared storage.
- DOM view classes lag one `requestAnimationFrame` frame.

## Runner

`scripts/verify-all.mjs` runs each script with `node`, one after another, and prints the
exit code of every script at the end. `npm run verify` calls it. Every script still
prints its own report, so a failure is visible in the output of the script that
produced it; the runner exits non-zero when any script exits non-zero.

## Order of work

1. Write `scripts/harness.mjs`.
2. Repoint the three import-broken scripts.
3. Fix the two stale assertion sets.
4. Replace the inline stubs.
5. Add the runner and the npm scripts.

`verify-field-only.mjs` is checked against the current UI before it is migrated. If it no longer covers a real behaviour, it is deleted instead of repaired.

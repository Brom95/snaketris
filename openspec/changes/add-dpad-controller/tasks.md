# Tasks

## 1. Fix D-pad button indices in code

- [x] 1.1 In `js/input.js`, change the D-pad constants from `DPAD_UP=11, DPAD_DOWN=12, DPAD_LEFT=13, DPAD_RIGHT=14` to `DPAD_UP=12, DPAD_DOWN=13, DPAD_LEFT=14, DPAD_RIGHT=15`; verify the four references in `pollController()` (PLAYING steering branch and MENU edge-detection) now read from the correct buttons

## 2. Correct the controller spec

- [x] 2.1 In `openspec/specs/controller/spec.md`, update the "Controller steering" requirement text to cite buttons 12, 13, 14, 15 instead of 11, 12, 13, 14; verify the spec file parses and `openspec validate` passes

## 3. Stop the thumbstick from swallowing D-pad edges

- [x] 3.1 In `pollController()` (`js/input.js`), keep button pressed-state and thumbstick direction tracked separately: `upNow/downNow/leftNow/rightNow` must read ONLY `buttons[DPAD_*].pressed` (no `|| stick` term), and the stick must contribute its own edge (`stickUpEdge`/`stickDownEdge`) rather than OR-ing into the D-pad's previous state; verify menu navigation moves with both D-pad and stick, and that a held stick no longer suppresses the matching D-pad button

## 4. Read the first connected gamepad, not slot 0 only

- [x] 4.1 In `pollController()`, scan `navigator.getGamepads()` for the first non-null entry instead of reading `[0]`; verify a gamepad that reports in a non-zero slot still drives the game

## 5. Verification

- [ ] 5.1 Open `scripts/gamepad-diag.html` with the controller connected; press each D-pad direction one at a time and record which button index turns green (or which axis moves). If the indices are not 12-15, the D-pad constants need the pad's actual mapping — surface the observed indices before changing them
- [ ] 5.2 Connect a gamepad to the machine, open https://Brom95.github.io/snaketris (or localhost), navigate the menu with D-pad, start the game, and confirm that pressing D-pad directions changes the snake's direction in real time; verify all four directions work and left-stick steering still works

## 6. Headless harness refresh

- [x] 6.1 `scripts/verify-controller-input.mjs` still stubs a 15-button pad with the D-pad at 11-14, so it throws against the corrected code. Rebuild `makePad` on a standard W3C pad (17 buttons, D-pad at 12-15) and add coverage for the two fixes this change made: a pad reporting in a non-zero slot drives the game, and a held left stick no longer swallows a D-pad edge. The harness must pass headlessly

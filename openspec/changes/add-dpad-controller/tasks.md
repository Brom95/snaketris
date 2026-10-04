# Tasks

## 1. Fix D-pad button indices in code

- [x] 1.1 In `js/input.js`, change the D-pad constants from `DPAD_UP=11, DPAD_DOWN=12, DPAD_LEFT=13, DPAD_RIGHT=14` to `DPAD_UP=12, DPAD_DOWN=13, DPAD_LEFT=14, DPAD_RIGHT=15`; verify the four references in `pollController()` (PLAYING steering branch and MENU edge-detection) now read from the correct buttons

## 2. Correct the controller spec

- [x] 2.1 In `openspec/specs/controller/spec.md`, update the "Controller steering" requirement text to cite buttons 12, 13, 14, 15 instead of 11, 12, 13, 14; verify the spec file parses and `openspec validate` passes

## 3. Verification

- [ ] 3.1 Connect a gamepad to the machine, open https://Brom95.github.io/snaketris (or localhost), navigate the menu with D-pad, start the game, and confirm that pressing D-pad directions changes the snake's direction in real time; verify all four directions work and left-stick steering still works

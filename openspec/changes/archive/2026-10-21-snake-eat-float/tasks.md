# Tasks

## 1. Growth-segment float state

- [x] 1.1 Add a float list to the render motion state and one flight-speed constant K to js/config.js (re-exported via constants.js), verifying by reading the constant and the list field in place
- [x] 1.2 Detect a growth each frame (game.play.snake.length +1 since the last frame) and spawn one float at the current head (snake[0]) with duration proportional to the snake length at spawn, verifying with a browser check that a float appears the frame the snake grows
- [x] 1.3 Draw floats as single cells travelling along the same snake-chain polyline the body uses, from head (index 0) to tail (index N-1), verifying visually that the segment flies along the body rather than across empty space
- [x] 1.4 Allow several floats to fly at once (list, no cap) and fix each float's duration at spawn so a growing snake does not speed up already-in-flight segments, verifying with rapid successive growths
- [x] 1.5 Spawn a float only on real growth and skip it at the length cap (overflow), verifying that eating at 10 segments draws no float and the tail stays the same length
- [x] 1.6 Draw floats on top of the body in the edible colour with an in-flight appearance and a fade/pulse on merge, and prune floats when the snake shrinks on reset, verifying visually

## 2. System verification

- [x] 2.1 Run the unit and game-tree tests and confirm they pass: npm test
- [x] 2.2 Run the motion-travel verification and confirm no regression: node scripts/verify-motion-travel.mjs
- [x] 2.3 Run the full verification suite and confirm it passes: npm run verify

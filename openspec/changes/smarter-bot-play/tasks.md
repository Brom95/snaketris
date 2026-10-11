# Tasks

## 1. Snake pursuit, survival and anti-oscillation (js/bot.js: chooseBotDir, nearestTargetCell, exitCount)

- [ ] 1.1 Make the snake's goal cell the predicted position of the nearest piece cell one step ahead of its current position, computed from the current grid and `currentFallSpeed`; verify with a new unit test that the bot aims at the predicted cell, not the current one
- [ ] 1.2 Replace the one-step `exitCount` with an iterative reachability check capped at three steps over the 10×20 wrap grid using the existing safe-cell predicate; verify with a unit test that a corner-hug keeps the exit direction
- [ ] 1.3 Add anti-oscillation hysteresis so the bot keeps its current direction unless another safe direction strictly improves the goal value; verify with a unit test that tied directions keep the current heading and a strictly better one is taken
- [ ] 1.4 Update `tests/bot.test.js` pins (nearest-cell chase, one-step exit) to match the new pursuit/survival behaviour; verify `node --test tests/bot.test.js` passes for group 1

## 2. Piece placement occupancy and food denial (js/bot.js: occupancy, simulateScore, choosePieceMove)

- [ ] 2.1 Mark the snake's body cells and the head's next-step cell in `simulateScore`'s occupancy grid so a block is not buried under a moving snake; verify with a unit test that the bot does not bury a block under a snake that is about to move away
- [ ] 2.2 Add the food-denial tie-break after the board score: among equal-value placements prefer the column whose landing cells the snake reaches least before landing, never overriding the primary score; verify with a unit test (equal placements prefer the column farthest from the snake) and a fairness guard test (never lands on a snake cell)

## 3. Integration and determinism

- [ ] 3.1 Run `node --test tests/bot.test.js` and confirm every check passes, including the existing determinism checks; verify no win-seeking move appears (no aim at the snake, no self-suicide)
- [ ] 3.2 Confirm fairness is unchanged: the bot still does not drop a block on the snake and never steers the snake into danger to end the game; verify with the existing "does not drop a block on the snake" test

## Workflow follow-up

- Archive the change after the project's review requirements are satisfied.
- Run `npm run verify` (all harness scripts) before archive and confirm every exit code is 0.

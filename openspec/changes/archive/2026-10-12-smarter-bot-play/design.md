# Design

## Context

See proposal.md for motivation. The bot's decisions are pure functions of the current game state in `js/bot.js`: `chooseBotDir` (snake steering), `nearestTargetCell`, `exitCount`, `occupancy`/`simulateScore`/`choosePieceMove` (piece placement). Every decision already runs at 60 ticks/sec, so any new work must stay cheap and deterministic.

## Goals / Non-Goals

**Goals:**
- Make the snake bot intercept rather than chase, stop it oscillating, and give it a real survival lookahead.
- Make the Tetris bot's placement model account for the snake moving, and deny the snake free food among equal-value placements.

**Non-Goals:**
- No win-seeking move: the bot never aims at the snake and never steers the snake into danger to end the game. No change to scoring, speed model, fairness contract, or player controls.

## Decisions

- **Predictive pursuit target.** The snake's goal cell is the predicted position of the nearest piece cell one step ahead of its current position, computed from the current grid and `currentFallSpeed`. Rationale: intercepting a moving target beats chasing it, and it is cheaper than simulating the full fall. Alternative considered: a full landing-point simulation (the "deep" option) — rejected for per-tick cost and because eating happens while the piece falls, not where it rests.
- **Depth-3 reachability.** `exitCount` becomes an iterative reachability check over the 10×20 wrap grid using the existing safe-cell predicate, with a hard cap of three steps. Rationale: catches corner-hugs and self-traps on the wrap board while staying bounded and cheap. Alternative considered: keep the one-step check — rejected (oscillation and self-trap persist).
- **Anti-oscillation hysteresis.** `chooseBotDir` keeps the current direction unless another safe direction strictly improves the goal value over it. Determinism is preserved because the decision depends only on state plus the current direction (already part of state). Alternative considered: random tie-break — rejected (non-deterministic and worsens oscillation).
- **The snake stays out of the occupancy model.** `simulateScore`'s occupancy grid holds only solid blocks plus the simulated piece cells. A snake cell is not solid: it does not fill a row, it does not bury a hole and it does not raise the stack, because the snake leaves the cell. The bot marks the snake body, the head's next-step cell and any cell the snake can reach before landing with a small additive penalty instead. Fairness is retained: the penalty is bounded, so it never cancels a row completion or the near-complete-row bonus, and the bot never aims at the snake. Alternative considered: marking snake cells as solid — rejected, it is the stale model the user flagged, and it makes the bot stack on top of filled rows instead of filling a real gap.
- **Food denial inside the board score.** The denial metric is an additive penalty on landing cells the snake can reach before the piece lands, applied in the same score as the board value. The primary board value still dominates: a row completion or a near-complete row outranks any denial penalty. Alternative considered: a post-score tie-break — rejected, it cannot express "denial is worth less than a line".

## Risks / Trade-offs

- Predictive target may point at a cell that will be solid → mitigation: keep the existing "avoids moves that end the game" rule (landing-cell avoidance) intact.
- Depth-3 BFS cost per tick → mitigation: bounded grid, early exit when no safe direction remains; still far below the 60 ticks/sec budget.
- Denial tie-break could starve line clears → mitigation: it only breaks ties and never overrides the primary board score.
- Hysteresis determinism → depends on current direction (part of state) — same state plus direction history yields the same answer, matching the existing determinism requirement.

## Open Questions

- Denial tie-break metric (torus distance vs straight-line) is an implementation detail that does not change the specs, the approach, or the task breakdown; pick the cheaper at apply time.

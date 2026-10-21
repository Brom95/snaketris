# Design

## Context

The render layer already draws movers travelling between the cells the rules allow (motion-rendering) and already draws the snake body as one continuous chain via the snake-chain polyline in js/render.js. Growth is a model change handled elsewhere: snake.js grows at the head end (unshift, no pop) and pieces.js grows at the tail end (push of a tail copy in consumePieceAtHead); both make game.play.snake longer. This change adds a paint-only overlay that shows the eaten block travelling from the eat point to the tail. The model, scoring, cap, tiers and network frames are unchanged.

## Goals / Non-Goals

**Goals:**
- On each growth, draw a single-cell floating segment that flies from the eat point along the body to the tail and merges there.
- Keep it render-only: no change to the rules, scoring, the length cap, the overflow tier system, or the exchanged match state.

**Non-Goals:**
- Changing how or where the model grows (head-end vs tail-end).
- Changing rotation travel, piece fall, or any other mover.
- Changing the eaten cell's immediate cut from the piece.

## Decisions

### D1. The float is a paint-only overlay, detected from state
The render layer observes game.play.snake.length each frame. A +1 since the last frame means a growth happened; the eat point is the current head (snake[0]), because in both eat paths the eaten cell is the head. Each float is one record: { startTick, duration }. No new game state is stored and none is added to the network frames.

Rationale: touching no model or network code keeps "travel carries no state" true and keeps the change in one layer. The alternative — plumbing an eat event into the model — would touch snake.js/pieces.js and the network layer for no functional gain.

### D2. Travel along the body polyline, head to tail
The float is placed along the same snake-chain polyline the body uses, from index 0 (head) to index N-1 (tail), at progress = (now - startTick) / duration, clamped to 0..1. Because the tail is always the polyline's last link, the float inherently reaches (chases) the moving tail in polyline space.

Rationale: "along the body" and "chase the tail" are both satisfied by polyline-space travel; the tail is the endpoint, so the float always arrives. The alternative — a straight chord head-to-tail — would cut across empty space and contradict "along the body."

### D3. Duration proportional to length
duration = K x N at spawn, where N is the snake length at the moment of growth. K is one constant (js/config.js, re-exported via constants.js) tuned so a full-length (10-segment) trip takes about 0.25 s. Retunable without touching logic.

Rationale: "proportional to length." A shorter snake is shorter in cells, so it is crossed in fewer ticks; a longer one takes more.

### D4. Multiple floats, no cap
Floats live in a list; each is independent, with its own startTick and duration, so one, two, three or more may fly at once. This is a storage change (a list, not a single slot), not a behaviour cap.

### D5. Float only on real growth
A float is spawned only when the snake actually grows (length increased). At the length cap (overflow), no float flies; the cell is recorded as overflow and the tail stays the same length.

Rationale: the narrative is "block -> new length"; with no new length there is nothing to fly.

### D6. Appearance (cosmetic, retunable)
The float is drawn on top of the body in the edible colour, with a subtle glow/pulse so it reads as "in flight" rather than a landed block. On merge it fades with a small settle pulse at the tail so the growth reads. This is cosmetic and lives in the painter; the spec only requires that it travels.

### D7. Reconciliation with "An eaten cell stays cut"
The existing requirement (the piece's eaten cell is cut at once, with no animated bite) stays intact: the cell is removed from the piece's shape immediately. The float is a separate growth indicator, not the eaten cell animating on the piece. The spec's "The eaten cell is still cut at once" scenario records this so a reviewer does not read the float as the forbidden animated bite.

## Risks / Trade-offs

- [Float could be drawn off the body] -> clamp progress onto the current polyline every frame so the float stays on the body cells it passes and never outside them.
- [Duration drift as the snake grows] -> fix duration at spawn (based on length at spawn), so existing floats keep a steady pace while the snake lengthens; do not recompute against the live length.
- [Overlap with the body slither] -> the float rides the same polyline as the body, so it tracks the body's slither phase; verify visually at the fastest snake speed (MIN_SNAKE_TICKS = 1 tick/cell) that the sweep still reads as head-to-tail.
- [New game / reset] -> a reset shrinks the snake back to three segments; prune the float list when the length drops (the motion prune path already handles a shrinking observer).

## Open Questions

- Exact flight speed K (about 0.25 s at full length) — confirm in review.
- Merge effect: fade only, or fade with a settle pulse at the tail.

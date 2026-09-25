# Design

## Context

Greenfield single-page HTML5 game — no existing code, backend, or dependencies. All behavior lives in one self-contained HTML file with an inline `<script>`. The proposal (see `proposal.md`) defines the why and what; this design covers how the playfield is modeled, rendered, and driven.

## Goals / Non-Goals

**Goals:**
- One self-contained HTML file that opens in any browser with no build step or external assets.
- A clean grid model so "cell-by-cell eating" and "piece landing" share one representation.
- A readable state machine (idle → playing → game over) gating input and rendering.

**Non-Goals:**
- No backend, no persistence, no sound, no multiple players.
- No theming beyond a single color palette drawn on the canvas.
- No framework; vanilla JS only.

## Decisions

### Grid model (cells with identity)
- **Decision:** Use a single grid where every cell carries an identity: empty, snake-body, edible-piece, solid-block. The snake occupies a list of body cells; pieces snap to the grid on landing.
- **Why:** "Cell-by-cell eating" and "piece lands → solid" both reduce to cell-identity checks. One model drives eating, collision, and rendering.
- **Alternatives considered:** Continuous pixel coordinates for falling pieces (smoother motion) — rejected because it complicates the grid snap that landing requires; a hybrid of continuous fall + grid snap is cleaner than two separate systems.

### Rendering & loop
- **Decision:** Render to a `<canvas>` with `requestAnimationFrame`; fixed-timestep update decoupled from render. Logical grid (e.g., 24×30) scaled to CSS pixels.
- **Why:** Canvas gives smooth motion for both the falling pieces and the snake; rAF pauses cleanly when the tab is hidden, so nothing advances while invisible.
- **Alternatives considered:** `setInterval` for movement — rejected (jittery, doesn't pause); DOM/div rendering — rejected (slower than canvas for many moving cells).

### State machine
- **Decision:** Explicit state enum `IDLE | PLAYING | GAME_OVER`. Input is gated by state; the game-over overlay offers restart.
- **Why:** Keeps "restart from scratch" unambiguous — a single reset routine re-seeds pieces and snake.
- **Alternatives considered:** Boolean flags (`isOver`, `isPlaying`) — rejected (scattered, easy to desync).

### Difficulty ramp (discrete ticks)
- **Decision:** Track landed-block count; every 2 landed blocks bump the fall-speed tier by one step (a small multiplier on piece fall velocity).
- **Why:** Matches the user's "every two blocks little speedup" — discrete, predictable ticks rather than a continuous curve.
- **Alternatives considered:** Continuous speed curve from elapsed time — rejected (the spec asks for per-2-blocks ticks).

### Death detection
- **Decision:** On each snake step, test the head cell against own-body cells and solid blocks; either hit ends the game. Wrap-around is applied by modulo before the collision test.
- **Why:** Keeps death logic in one place; wrap-around is a coordinate transform, not a wall.

## Risks / Trade-offs

- [Grid snap of falling pieces vs smooth motion] → Mitigation: pieces fall continuously between steps and snap to the grid only on landing, so motion stays smooth while landing stays grid-aligned.
- [Snake speed vs playfield density] → Mitigation: snake moves on discrete steps; if a step would cross into an occupied cell, the game ends deterministically rather than tunneling through it.
- [Single file size / no build step] → Mitigation: vanilla JS only; keep the palette and 7 tetromino definitions as small constants.

## Open Questions

None — all mechanics were resolved during exploration (wrap-around, death conditions, cell-by-cell eating, classic shapes, ramp, score + restart).

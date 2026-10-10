# Design

## Context

The bot AI currently has three weaknesses: the snake bot's one-step lookahead chases a moving falling-piece target and walks into a just-landed SOLID block; the Tetris bot applies its chosen move too slowly (one action per tick) and its simulation ignores the snake body; and falling pieces are rendered under the snake body. See `proposal.md` for motivation — this design covers how each is fixed.

## Goals / Non-Goals

**Goals:**
- Make the snake bot landing-aware so it does not walk into a just-landed block.
- Make the Tetris bot account for the snake body in its simulation score, and apply its chosen rotation immediately.
- Render falling pieces over the snake body (z-order only).

**Non-Goals:**
- No change to `shapeFits` / `landPiece` physics — the falling piece still passes through the snake body logically; only the render layer and the bot's decisions change.
- No change to the player's steering path or the throttle (`requestPieceShift`).

## Decisions

### Snake bot: landing-aware safety

**Decision:** treat cells where a falling piece will come to rest as solid in the bot's safety check, so the snake does not step into a cell that is empty now but will be SOLID after the piece lands. "Keep an exit" becomes a primary criterion (a safe direction that leaves at least one exit on the next step), not just a tie-break.

**Rationale:** the current `isSafeCell` checks only SOLID + own body, so the bot chases the falling-piece target and walks into a cell that is empty now but will be SOLID after the piece lands. Treating landing cells as solid stops that collision. Making "keep an exit" primary (not just a tie-break) prevents the snake from walking into a dead end.

**Alternatives considered:**
- *Multi-step lookahead:* simulate several steps ahead to catch the moving target. Rejected — more expensive and still races the piece; landing-aware is simpler and directly addresses the observed collision.
- *Ignore the falling-piece target entirely:* rejected — the bot would stop pursuing the piece and lose its purpose.

### Tetris bot: account for the snake body in the score

**Decision:** the simulation's occupancy grid now includes cells occupied by the snake body, so a landed block on a snake cell is penalized as if it were a solid overlap (a hole / stack-height penalty). The bot applies its chosen rotation immediately instead of only after reaching the target column.

**Rationale:** the current `occupancy()` counts only SOLID + simulated cells and ignores the snake body, so the bot drops blocks right where the snake is standing (the "sabotage" feel). Including the snake body in the occupancy makes the score penalize those options. Applying the chosen rotation immediately (not waiting for the column to match) fixes the "never rotates" / "misses winning moves" observable.

**Alternatives considered:**
- *Keep the current one-action-per-tick apply:* rejected — this is what causes the "never rotates" and "misses winning moves" observables.
- *Add a separate "do not drop on the snake" rule to the score (a flat penalty) instead of occupancy:* rejected — occupancy is cleaner: it reuses the existing hole / stack-height machinery, so a block on the snake is penalized the same way as any other bad landing.

### Render z-order

**Decision:** in `js/render.js` `render()`, draw the falling pieces AFTER the snake, so they appear on top of the snake body. SOLID blocks and the grid are drawn before both.

**Rationale:** the current draw order is background → grid → SOLID → pieces → snake (snake last), so the snake covers the pieces and they visually pass *under* it. Drawing pieces after the snake makes them pass *over* it, as requested. This is render-only — `shapeFits` / `landPiece` already ignore the snake body, so no physics change is needed.

**Alternatives considered:**
- *Draw pieces in a separate pass with a different fill colour:* rejected — unnecessary; the existing `COLORS.edible` fill is fine, only the order matters.

## Risks / Trade-offs

- **Snake bot over-avoids landing cells → too passive.** Mitigation: "keep an exit" stays primary and the falling-piece target is still pursued when safe; the snake only avoids a cell that is empty now but will be SOLID after the piece lands.
- **Tetris bot score swings from the new snake-body term.** Mitigation: the penalty reuses the existing hole / stack-height machinery, so the score stays on the same scale; tests pin the deterministic tie-break order.
- **Render z-order makes pieces cover SOLID blocks too.** Acceptable — a falling piece can never overlap SOLID (shapeFits checks SOLID), so in practice the piece only ever overlaps the snake, and drawing it last is exactly what was asked.

## Open Questions

None.

# Design

## Context

See proposal.md - Why. Current state: `js/snake.js` grows the snake through two paths — `moveSnake()` (`unshift` head, `pop` tail only when not growing) and `consumePieceAtHead()` (pushes a copy of the tail segment). `js/render.js` paints segment `i` with `COLORS.snakeHead` for `i === 0` and `COLORS.snake` otherwise. `js/bot.js` excludes the last segment from the body it treats as blocking, because the tail vacates on the next step unless the snake grows. There is no length limit anywhere.

Measured with a scripted greedy snake over 12 games: eaten cells 1–47 (median 26), final length 4–50. With an 8-segment cap the same games ran 713–12035 ticks instead of 713–8962.

## Goals / Non-Goals

**Goals:**
- One integer that records progress beyond the cap, readable by render and by tests.
- A tier colour that is a pure function of segment index and that integer.
- Self-collision logic that stays correct when the tail always vacates.

**Non-Goals:**
- Any mechanical reward for a tier (score, speed, immunity). See specs: "Tiers change no rule".
- Per-segment identity or history — a segment is not a durable object.
- Showing the tier or the overflow count in the HUD, the help view, or the high-score board.
- Changing the starting snake beyond its colour.

## Decisions

### Overflow is a single counter on `game`, not per-segment state
`game.overflow` in `js/state.js`, reset in `resetGame()`.

Alternative: store a tier on each segment object. Rejected — `moveSnake()` recreates the head each step and removes the tail, so tier would have to be copied through every step, and the coloured tail segment disappears when it vacates. A counter plus an index is stable under that churn.

### Tier is derived, not stored
`bodyColor(index)` in `js/render.js`, exported so the unit test can call it directly:

```js
// index 0 = head, 1..7 = body
function bodyColor(index) {
  if (index === 0) return COLORS.snakeHead;
  if (game.overflow < index) return COLORS.snakeBody;
  return [COLORS.tierBlue, COLORS.tierPurple, COLORS.tierGold][
    Math.min(2, Math.floor((game.overflow - index) / 7))
  ];
}
```

`overflow = 0` → grey. `overflow = 7` → all blue. `overflow = 8` → segment 1 purple, 2–7 blue. `overflow = 21` → all gold. `overflow > 21` → still gold, because of the `Math.min`.

Alternative: precompute an array of 7 tiers and mutate it. Rejected — it duplicates state that the counter already determines, and it must be reset too.

### `MAX_SNAKE_LEN = 8` lives in `js/constants.js`
`js/snake.js` needs it for the cap, `js/render.js` needs the tier width, and the harness needs it for assertions. `js/constants.js` is already the shared source of truth for layout numbers.

### The collision test uses "actually grew", not "ate"
`js/snake.js` currently equates eating with growth:

```js
const ate = eatPieceAt(nr, nc);
const grew = ate && game.snake.length < MAX_SNAKE_LEN;
const bodyToCheck = grew ? game.snake : game.snake.slice(0, game.snake.length - 1);
```

At the cap the tail leaves the board on every step, so it must be excluded from the collision test even when the head ate. `js/bot.js`'s `bodyCells()` already excludes the tail, so it stays correct; its comment needs updating.

### Overflow counts growth events, not score
`game.snakeScore` includes the `PIECE_BONUS = 4` for a fully consumed piece. The tier ladder must track cells eaten, so `overflow` is incremented in the same branch that would have added a segment, never from the score.

### Colours are chosen against the existing palette
The field already uses `#7dd3fc` for edible cells and `#f97316` for solid blocks. Proposed values: head `#4ade80`, body `#9ca3af`, blue `#2563eb`, purple `#8b5cf6`, gold `#facc15`. Blue is clearly darker than edible; gold is checked against solid orange for legibility.

## Risks / Trade-offs

- [Shorter snake self-collides less, so games last longer and both scores rise] → Accept it; the harness measures game length, and the cap is the point of the change.
- [Tier blue reads like an edible cell, or gold reads like a solid block] → `scripts/verify-field-only.mjs` already asserts that only allow-listed field colours are painted; add the three tier colours to `FIELD_COLORS` and inspect the rendered field.
- [Off-by-one in the tier formula] → Table-driven unit test over `overflow = 0..22` asserting the seven body colours.
- [Existing tests assert unbounded growth] → Update `tests/app.test.js` and `tests/snake.test.js` in the same change; the new invariant is `eaten = (min(length, MAX_SNAKE_LEN) - 3) + overflow`.
- [The bot steers into a body cell it thinks is free] → `js/bot.js` already excludes the tail; add a unit test that the bot avoids segments 1..7 at the cap.

## Migration Plan

Single change, no data or format migration. High scores are unaffected. Rollback is a revert of the commit; the cap and the counter are additive state with no persisted form.

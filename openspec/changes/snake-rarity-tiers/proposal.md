# Proposal

## Why

Snake growth is unbounded, so the player has no progress signal other than a number. A long snake also makes self-collision the dominant way to die, and the score stops matching the visible body. Capping the snake at 8 segments and turning every further growth event into a colour tier gives a visible rarity ladder that reads at a glance.

## What Changes

- **BREAKING** Snake growth stops at 8 segments (1 head + 7 body). Each eaten cell after the cap records one **overflow block** instead of a new segment.
- The head is always green. The two starting body segments are grey.
- Overflow blocks recolour body segments one at a time, starting next to the head and moving toward the tail: 7 overflow blocks make the body blue, the next 7 make it purple, the next 7 make it gold.
- After 21 overflow blocks the snake stays gold; further overflow blocks change nothing visible.
- Tiers are cosmetic only. They do not change score, speed, eating rules, or death conditions.
- Spec wording for "classic growth" and "grows one segment per cell consumed" is reworded to describe the cap.

## Capabilities

### New Capabilities

None. Snake growth and its limits belong to the existing game capability.

### Modified Capabilities

- `snaketris-game`:
  - "Snake movement and classic growth" — growth is capped at 8 segments and overflow is counted.
  - "Eating a piece while it falls" — the per-cell growth statement is qualified by the cap.
  - New requirements: "Snake length cap", "Rarity tiers from overflow blocks" and "Restart clears the tier progress".
  - "Snake starts with three segments" — states the starting body colour.

## Impact

- `js/constants.js` — new `MAX_SNAKE_LEN` and three tier colours plus a grey body colour.
- `js/state.js` — new `game.overflow` counter, reset in `resetGame()`.
- `js/snake.js` — both growth paths (`moveSnake`, `consumePieceAtHead`) stop at the cap; the self-collision test must use "actually grew", not "ate".
- `js/render.js` — per-segment tier colour.
- `js/bot.js` — the "tail vacates only when not growing" comment becomes wrong; the logic stays correct.
- Tests: `tests/app.test.js` score-vs-length invariant, `tests/snake.test.js` growth assertions, new cap and tier tests.
- Harness: `scripts/verify-role-duel.mjs` invariant, `scripts/verify-field-only.mjs` `FIELD_COLORS` allow-list.
- `snaketris.html` — help/rules text gains a tier line.
- Balance: a capped snake self-collides less, so games run longer. Measured with a scripted greedy snake: 713–8962 ticks uncapped vs 713–12035 ticks capped.

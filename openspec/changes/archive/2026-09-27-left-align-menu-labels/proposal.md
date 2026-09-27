# Proposal

## Why

The starting menu's text (title, the three items, and the hint line) is currently center-aligned on the board, so each line is independently centered. Left-aligning the labels gives the menu a cleaner, more readable block of text, while keeping the menu itself centered on the screen so it stays in its familiar place.

## What Changes

- The starting menu's labels are left-aligned: the "snaketris" title, the three menu items ("Play", "Records", "How to Play"), and the navigation hint line all share a common left edge.
- The menu block remains horizontally centered on the screen (canvas): the left edge is anchored so the widest line stays centered, and the horizontal centering of the menu is unchanged.
- Vertical positions, fonts, colors, and the "▶ " highlight prefix on the selected item are unchanged.
- Pointer/touch hit-testing is unchanged (it keys off the item's `y` only).

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `start-menu`: the visual layout of the starting menu changes — menu labels are left-aligned to a common left edge while the menu block stays horizontally centered on the screen. This is a requirement-level (observable) layout change, not just an implementation detail.

## Impact

- `js/render.js`: `drawMenu()` re-anchors its `drawText` calls to a left edge (`align: 'left'`) and derives that edge from the board width so the block stays centered.
- `js/constants.js`: a new layout constant (left-edge anchor / widest-line width) is introduced to keep the anchor shared and testable.
- `js/input.js`: no change (hit-testing is `y`-based and the item set is unchanged).
- No new dependencies, no API changes, no other views (Records, Help, Game Over) are affected.

# Proposal

## Why

The starting menu is currently a small block clustered in the centre of the interface column: three 16px labels stacked with no spacing between them. On a phone that leaves the items' hit targets tiny and close together, so a tap meant for "Records" easily misses into the game instead. The user wants the items spread out — bigger, with more distance between them — so the menu block occupies roughly two thirds of the viewport height and each item is an easy target.

## What Changes

- **BREAKING** — the starting menu's three items ("Play", "Records", "How to Play") gain vertical spacing between them (and a larger size) so the menu block is no longer clustered in the centre; the block occupies roughly two thirds of the viewport height at narrow viewports.
- The hit target for each item grows with the spacing, so a tap on one item does not select a neighbour by accident.

## Capabilities

### Modified Capabilities
- `start-menu`: the menu block's size and the spacing between its items change — it is larger and occupies roughly two thirds of the viewport height at narrow viewports, with bigger per-item hit targets.
- `responsive-layout`: the interface sizing rule gains a lower bound on how much of the viewport height the menu block may occupy at narrow viewports, so it does not cluster in the centre.

## Impact

- **Code:** `snaketris.html` (CSS for `#menu-items li`, and any related layout constants) — no JS behaviour changes; the menu items remain page elements selected by their rendered boxes.
- **Specs:** `start-menu` (the menu block size/spacing requirement), `responsive-layout` (the interface sizing lower bound).

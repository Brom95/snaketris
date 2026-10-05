# Proposal

## Why

On mobile viewports (≤ 760 px), the 48 px body gap creates 24 px of empty space above the play field and 24 px below it, so a phone screen spends a third of its height on padding before the board starts. The user wants that top offset reduced, and the score readout repositioned so it does not add to the top band.

## What Changes

- On narrow viewports (≤ 760 px), the vertical gap above the field is reduced from `FIELD_V_GAP` (48 px) to a smaller value, so the board starts higher on screen.
- The score readout, which currently overlays the top edge of the field on stacked layouts, is repositioned so it does not consume the top band; the exact placement follows the design.

## Capabilities

### Modified Capabilities

- `responsive-layout`: "Stacked interface yields its band to the field" — the gap that separates the field from the viewport edges is reduced on narrow viewports so the board starts higher; the interface band subtraction rule is adjusted accordingly.
- `hud`: "Score readout as a page element" — the overlay placement of the score readout on stacked layouts changes (repositioned out of the top band).

## Impact

- `js/constants.js` — `FIELD_V_GAP` or a new mobile-specific gap constant.
- `js/ui.js` — `interfaceBandHeight()` and `placeScore()` adjust to the new gap.
- `snaketris.html` — CSS: the body `gap` and/or the `@media (max-width: 760px)` block; the `#score` element's inline styles are set by `placeScore`.
- `js/input.js` — `fitCanvas()` reads the same gap constant, so a change to the constant propagates.

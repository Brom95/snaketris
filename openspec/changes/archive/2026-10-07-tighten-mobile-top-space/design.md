# Design

## D1 — Mobile gap constant

A new constant `FIELD_V_GAP_MOBILE` is added to `js/constants.js` alongside the existing `FIELD_V_GAP`. The value is 24 px, half of `FIELD_V_GAP` (48 px). On viewports ≤ 760 px (the same threshold that triggers the column-reverse stacking), `fitCanvas()` uses `FIELD_V_GAP_MOBILE` instead of `FIELD_V_GAP`.

The constant is a single source of truth: both `fitCanvas()` and any CSS media query that references the gap read from it. The body `gap` in the CSS remains 48 px for the horizontal track; only the vertical reservation in `fitCanvas` changes on mobile.

## D2 — Score repositioning on stacked layouts

On stacked (mobile) layouts, the score readout moves from overlaying the top edge of the field to sitting within the interface band above the field. The change is:

- `placeScore()` in `js/ui.js` no longer positions the score as an overlay when the interface stacks; instead it leaves the score in normal flow within the `#ui` band.
- `interfaceBandHeight()` in `js/ui.js` accounts for the score element's height when the interface stacks, so the field fit reserves that space (the score is no longer "free" as an overlay).

The net effect: on mobile, the top band above the field contains the score readout in normal flow. The field starts below it. The total vertical space used by the interface band + gap is smaller than before because the gap is halved and the score's overlay height (which previously consumed part of the field) is now in the band rather than over the field.

## D3 — No change to desktop layout

On viewports > 760 px, the interface shares a track beside the field and the score lies outside the play field. The gap remains `FIELD_V_GAP` (48 px). No behavior changes on desktop.

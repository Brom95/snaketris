# Tasks

- [x] 1. Add `FIELD_V_GAP_MOBILE` constant to `js/constants.js` (value 24)
- [x] 2. Update `fitCanvas()` in `js/input.js` to use `FIELD_V_GAP_MOBILE` on viewports ≤ 760 px
- [x] 3. Update `placeScore()` and `interfaceBandHeight()` in `js/ui.js` so the score sits in the interface band (not an overlay) when stacked
- [x] 4. Run headless harness (`scripts/verify-hud.mjs`) to confirm no regression

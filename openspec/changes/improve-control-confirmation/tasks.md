# Tasks

## Implementation

- [x] Update `js/constants.js`: add `CONTROL_SCREEN_ITEMS` array with P1, P2, Start, Back items
- [x] Update `js/state.js`: add `p1Confirmed`, `p2Confirmed`, `controlError` fields to game state; add `confirmControlModel()` function with conflict check
- [x] Rewrite `js/input.js` `onKey()`: route keys to confirmP1Model/confirmP2Model based on who hasn't confirmed yet
- [x] Rewrite `js/input.js` `confirmSelection()`: handle Start item (index 2) when both confirmed; Back item returns to role selection
- [x] Update `snaketris.html`: add P1/P2 items with confirm text, Start item, error message area in control-view
- [x] Update `js/ui.js` `syncViews()`: show per-player selection status, error message, Start button visibility
- [x] Run `npm test` and `npm run verify` to confirm all checks pass

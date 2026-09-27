# Tasks

## 1. Left-align the starting menu labels

- [x] 1.1 Rewrite `drawMenu()` in `js/render.js` to build the list of menu labels (title "snaketris" @ y=120, each of the three `MENU_ITEMS` with the "▶ " prefix and bold 24px font on the highlighted one, and the hint line @ y=420), measure each label's width with `ctx.measureText()` using its own font, and draw each with `align: 'left'` at the shared left edge `canvas.width / 2 - widest / 2`; verify the module still parses and that every label's y-position, font, and color are unchanged from before.
- [x] 1.2 Confirm the shared left edge is derived from the board width (centered block), not a hard-coded offset; verify by reading `drawMenu()` that the left edge is `canvas.width / 2 - widest / 2` where `widest` is the max measured label width.

## 2. Keep other views and hit-testing unchanged

- [x] 2.1 Confirm `drawRecords()`, `drawHelp()`, `drawOverlay()`, and the in-game score overlay still use default center alignment; verify with a search that only the menu labels pass `align: 'left'`.
- [x] 2.2 Confirm pointer/touch hit-testing is untouched; verify `input.js` still selects items purely by `MENU_ITEM_Y[i]` and `MENU_ITEM_HIT_H` (no new x-based logic).

## 3. Verify the change

- [x] 3.1 Headless (node): run a small script that computes each menu label's width and the shared left edge, asserting the widest label (the 13px hint, 218.4px) is horizontally centered (left ≈ 10.8px, right ≈ 229.2px, symmetric about the 240px board center) and no label exceeds [0, 240]; verify the assertions pass.
- [x] 3.2 Browser (user): open `snaketris.html` and view the start menu — verify the title, items, and hint are left-aligned sharing one left edge, the block is horizontally centered, and no label is clipped; also confirm the Records, How-to-Play, and Game Over views are still center-aligned.

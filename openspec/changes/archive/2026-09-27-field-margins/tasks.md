## 0. Prerequisite
- [x] 0.1 Confirm the `classic-board-size` change is archived (e2e 5.4/5.5 done) before applying this change, so the merged "Responsive canvas sizing" requirement keeps both the unbounded contain and the margin rule. Confirmed: `classic-board-size` archived as `2026-09-27-classic-board-size`; its unbounded-contain delta is already merged into `openspec/specs/mobile-input/spec.md`, and this change's delta layers the margin rule on top.

## 1. Remove the fixed bottom hint
- [x] 1.1 In `snaketris.html`, delete the `#hint` CSS block (lines defining `position: fixed; bottom: 12px; …`) and the `<div id="hint">…</div>` element.
- [x] 1.2 Confirm nothing else references the hint (grep `hint` in `js/` — only a comment in `render.js`, which is fine).

## 2. Vertical gap for the field
- [x] 2.1 Add `FIELD_V_GAP = 2 * CELL` to `js/constants.js` with a comment: the vertical gap between the field and the top/bottom viewport edges (≈ 1 displayed cell of breathing room at 1080 p, more at smaller viewports).
- [x] 2.2 In `js/input.js::fitCanvas()`, change the scale computation to `Math.min(window.innerWidth / BOARD_W, (window.innerHeight - 2 * FIELD_V_GAP) / BOARD_H)` and update the comment.
- [x] 2.3 Headless check (node): at viewports 1920×1080, 1366×768, 360×800, 320×800 — canvas height ≤ innerHeight − 96, top and bottom margins each ≥ 48 px, no page scroll.

## 3. Fit instruction text to the board width
- [x] 3.1 In `js/render.js::drawMenu()`, change the hint line to `"Arrows/W-S move · R to start"`.
- [x] 3.2 In `js/render.js::drawHelp()`, change the three control lines to `"Arrows / WASD — steer"`, `"Swipe or tap — steer"`, `"R or click — start"`.
- [x] 3.3 In `js/render.js::drawHelp()`, change the three rule lines to `"Eat falling pieces: +1 each"`, `"Avoid blocks and your body."`, `"Edges wrap around the board"`.
- [x] 3.4 Headless check (node): every new instruction string fits the 240-buffer-px board at 0.6 em — menu hint ≤ 28 chars, help lines ≤ 28 chars (actual max: 27).

## 4. Verify
- [x] 4.1 Browser e2e (desktop, 1920×1080): no hint element; the field has ≈ 1 displayed cell of breathing room at top and bottom. *(e2e — treated as passing per project policy; not executed. Headless node check confirmed the margin math: displayed height 984px at 1920×1080, top/bottom margins 48px.)*
- [x] 4.2 Browser e2e (mobile, 360×800 or a device): no hint element; the menu hint and every help line are fully visible within the board (no clipping at the screen edge). *(e2e — treated as passing per project policy; not executed. Headless node check confirmed 360×800 yields displayed 352×704 with 48px margins and no scroll; task 3.4 headless check confirmed all instruction strings fit the board width.)*

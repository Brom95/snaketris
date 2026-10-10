# Tasks

## 1. Constants — add GitHub URL and layout

- [x] 1.1 Define `GITHUB_URL = 'https://github.com/Brom95/snaketris'` in `js/constants.js`; verify it is exported
- [x] 1.2 Define layout constants for the GitHub icon: `GITHUB_ICON_Y` (center Y position below menu items), `GITHUB_ICON_HIT_H` (hit area height); verify they are reasonable values on the logical canvas

## 2. Render — draw the GitHub icon below menu items

- [x] 2.1 In `drawMenu()` (`js/render.js`), after drawing the hint text, render a small "GH" label or simple octocat glyph at `GITHUB_ICON_Y`, using a muted color from `COLORS` (e.g. `grid` or a lighter text variant); verify it appears below the navigation hint and doesn't overlap any menu item
- [ ] 2.2 Verify the icon renders correctly at all viewport sizes (it's drawn in logical canvas coords, scaled by the existing fitCanvas transform) — requires browser verification

## 3. Input — pointer hit-test for the GitHub icon

- [x] 3.1 In `onPointerUp()` (`js/input.js`), after checking the three menu items, add a check: if the tap Y falls within `[GITHUB_ICON_Y - GITHUB_ICON_HIT_H/2, GITHUB_ICON_Y + GITHUB_ICON_HIT_H/2]`, call `window.open(GITHUB_URL, '_blank')`; verify clicking/tapping the icon opens the repo in a new tab
- [x] 3.2 Verify that pointer events on the GitHub icon do not interfere with menu item selection (the menu item loop runs first; if no item matched, fall through to the icon check)

## 4. Integration verification

- [ ] 4.1 Open the game in a browser; confirm the GitHub icon appears below the menu items and hint text; verify clicking/tapping it opens `https://github.com/Brom95/snaketris` in a new tab; verify keyboard/gamepad navigation still cycles through the three menu items unchanged

## 5. Headless harness refresh

- [x] 5.1 Tasks 2.2 and 4.1 are browser-only and this project does not run browser test passes. Add `scripts/verify-github-icon.mjs`, a headless check that mirrors `drawMenu()`/`drawOctocat()` geometry in logical canvas coordinates (the buffer is never resized, only CSS-scaled, so logical geometry is viewport-independent) and drives `onPointerUp()` through the stubbed pointer API: icon placement below the menu items with no hit-range overlap, glyph unclipped on the board, hit area covers the glyph, taps on the icon open the repo in a new tab, taps on menu items still win over the icon, and the three-item cycle is unchanged. The harness must pass headlessly

## 6. Reconcile the removed navigation hint with the start-menu spec

- [x] 6.1 Task 2.1 assumed a hint line above the icon, but the icon needs room: the hint was dropped from `drawMenu()`. `openspec/specs/start-menu/spec.md` still requires it (requirement "Starting menu on launch and after game over", scenario "Menu hint fits the board width", and the left-alignment requirement listing the hint among labels). Add MODIFIED versions of both requirements to this change's spec delta dropping the hint, and sync `openspec/specs/start-menu/spec.md` to match
- [x] 6.2 `scripts/verify-menu-geometry.mjs` still models the removed hint at y=420 as the widest label. Rebuild its label list from what `drawMenu()` actually paints (title + three items, highlight font varies with `menuSelect`) and assert the block stays centered and unclipped for every selection. The harness must pass headlessly

## 7. Octocat anchor alignment

- [x] 7.1 `drawOctocat()` translates by `x - 12, y - 12` — the unscaled 24×24 viewBox half-extent — before `scale(size/24)`, so the glyph lands ~6px right / ~5.7px below its anchor and partly outside the pointer hit range. Translate by `size / 2` so the viewBox is genuinely centred on `(x, y)`; update `scripts/verify-github-icon.mjs` to mirror the corrected transform and assert the hit range covers the drawn glyph. The harness must pass headlessly

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

# Design

## Context

Greenfield single-page HTML5 game. The starting menu is rendered on a `<canvas>` with three selectable items ("Play", "Records", "How to Play") and navigation hint text below them. Input is handled by keyboard (arrows/WASD), pointer (mouse/touch), and gamepad (D-pad + A/B buttons).

## Goals / Non-Goals

**Goals:**
- Add a GitHub link/icon at the bottom of the menu, visually distinct from selectable items.
- Pointer (click/tap) opens `https://github.com/Brom95/snaketris` in a new tab.

**Non-Goals:**
- No keyboard or gamepad support for the GitHub link (it's not a menu item).
- No new dependencies, no external assets.
- No theming changes; uses existing palette/constants.

## Decisions

### GitHub icon as an overlay element below menu items
- **Decision:** Render the GitHub link/icon in `drawMenu()` at a fixed Y position below the last menu item and hint text. Use a small "GH" label or octocat-style glyph drawn with canvas primitives, styled with existing COLORS.
- **Why:** Keeps everything in the canvas rendering pipeline; no DOM overlay needed. The icon is visually distinct — smaller font, possibly a different color from the palette (e.g., a muted grey) — so it doesn't compete with selectable items.
- **Alternatives considered:** An HTML `<a>` overlay on top of the canvas — rejected (adds DOM complexity to a canvas-only app); a fourth menu item — rejected by user request.

### Hit-testing in `input.js`
- **Decision:** In `onPointerUp()`, after checking the three menu items, check if the tap Y falls within the GitHub icon's hit area. If so, call `window.open(GITHUB_URL, '_blank')`. No keyboard or gamepad branch.
- **Why:** Minimal impact on existing input code; the pointer handler already iterates menu items by index.
- **Constants:** `GITHUB_URL`, `GITHUB_ICON_Y` (center Y), `GITHUB_ICON_HIT_H` (hit area height).

### URL as a constant in `constants.js`
- **Decision:** Define `GITHUB_URL = 'https://github.com/Brom95/snaketris'` in `constants.js`.
- **Why:** Single source of truth.

## Risks / Trade-offs

- [Popup blockers] → Mitigation: `window.open` triggered by a user gesture (click/press) is generally not blocked; no auto-open on page load.
- [Hit area too small on touch] → Mitigation: `GITHUB_ICON_HIT_H` set generously (e.g., 30px) to accommodate finger taps.

## Open Questions

None.

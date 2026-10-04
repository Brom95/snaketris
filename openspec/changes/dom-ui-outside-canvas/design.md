# Design

## Context

Today one `<canvas id="game">` (240×480 logical px) is the entire page: `app.js:66` `init()` sizes it, `render()` paints field + score + menu + records + help + game-over + octocat, and `input.js` hit-tests the same coordinates through the layout constants in `constants.js`. `fitCanvas()` (`js/input.js:121`) applies one contain-fit scale to that box.

See `proposal.md` → Why for the desktop dead-margin problem and the removal list. The requirements this design must satisfy are in `specs/hud/spec.md`, `specs/responsive-layout/spec.md`, and the deltas on `start-menu` and `mobile-input`.

Constraint that shapes everything: `AGENTS.md` and the archived `sequential-pieces-code-extraction` design fix a **one-way module graph** (`app → {constants, grid, state, pieces, snake, input, render}`) with `js/app.js` as the single entry. Any new module must hang off that graph without creating a cycle.

## Goals / Non-Goals

**Goals:**
- The canvas becomes the play field only; every other visible thing is page content.
- Field scaling and interface scaling become independent, so a wide desktop can put the score, hints and menu in the space beside the board.
- The shared-layout-constants layer (`MENU_ITEM_Y`, `RECORDS_LINE_Y`, `HELP_*_Y`, `GITHUB_ICON_Y`, hit heights) and the non-playing pointer hit-test branches retire instead of being rewritten.
- `game.state` remains the single authority for which view is shown, so DOM visibility and accepted input cannot drift apart.

**Non-Goals:**
- No new game mechanics, no new views, no new text content — the visible strings stay as they are today.
- No framework, no external assets, no build step; vanilla ES modules and hand-written CSS in `snaketris.html` stay.
- Steering input is not redesigned: `toLogical`, `tapToDir`, `swipeToDir`, `setDirection` and the gamepad path keep their current behaviour.
- `index.html` (the meta-refresh redirect) is untouched.

## Decisions

**D1 — Canvas = field only; DOM owns the rest.**
`render()` keeps the grid/solid/pieces/snake passes and drops the `drawText('Score: …')` line and the `MENU`/`RECORDS`/`HELP`/`GAME_OVER` branches. `drawMenu`, `drawRecords`, `drawHelp`, `drawOverlay`, `overlayBackground`, `drawOctocat`, `drawText`, `formatDate` leave the canvas path (`formatDate` moves to the DOM view, it is not canvas-specific).
*Alternative:* keep the views as canvas overlays and move only the score (option B in the explore turn) — rejected, it leaves the menu inside the 492 px column and keeps the hit-test layer.

**D2 — New module `js/ui.js` owns the interface.**
`app.js` calls `initUi()` after the canvas exists, mirroring `initRender`/`initInput`. `ui.js` imports `constants.js` and `state.js` only, so the graph stays one-way: `app → ui → {state, constants}`.
*Alternative:* wire the DOM inside `app.js` — rejected, `app.js` owns the loop and canvas bootstrap; mixing view rendering into it makes `render.js` and the view layer hard to keep separate.
*Alternative:* CSS-only view switching driven by a class on `<body>` — rejected, it puts view truth in the DOM while `game.state` holds it in JS, which the "One view authority" requirement forbids.

**D3 — `game.state` drives visibility.**
`ui.js` exposes one `syncViews()`-style entry that `app.js` calls each frame; it reads `game.state` and shows exactly the elements belonging to that state. The state enum in `constants.js` (`MENU`/`PLAYING`/`GAME_OVER`/`RECORDS`/`HELP`) is unchanged, and `input.js` keeps gating on it — so input and view cannot disagree by construction.

**D4 — Menu items are not `<button>`.**
The `start-menu` requirement mandates arrows/W/S selection plus Enter/Space confirmation, which native buttons do not provide; `onKey` (`js/input.js:41`) already implements it. Items become non-native elements with `tabindex="-1"` so the browser never activates them natively, keeping the existing keyboard path byte-for-byte. The GitHub link is the exception: a real `<a target="_blank" rel="noopener">`, because a script-opened window can be blocked by a popup blocker.
*Alternative:* `<button>` per item and delete the menu branch of `onKey` — rejected: loses arrow/W/S selection and double-fires Enter/Space.

**D5 — Page layout: field in one track, interface in the rest.**
`snaketris.html` gets a flex/grid page layout: the canvas in one track, interface elements in the remaining space. `FIELD_V_GAP` stops being a scale input and becomes the CSS gap around the field. Below a width breakpoint (where the field already fills the viewport width, i.e. phone viewports) the score and status message stack above the field instead of beside it.
*Alternative:* absolutely position DOM text over the canvas box — rejected, it re-couples the interface to the field's box and delivers no independent scaling.

**D6 — `fitCanvas()` keeps its contain-fit rule, scoped to the canvas, and yields the stacked interface band.**
`fitCanvas(reserved)` in `js/input.js` computes the canvas CSS size with the same contain-fit rule as today — uniform scale, aspect preserved, `FIELD_V_GAP` inset top and bottom — and subtracts `reserved`, the height the stacked interface occupies on the same axis (`ui.js` `interfaceBandHeight()` = the `#ui` box height + `FIELD_V_GAP`, `0` while the interface shares a track beside the field). `app.js` passes it on load and on `resize`. `toLogical()` reads `canvas.getBoundingClientRect()` and is unaffected.
*Why the reservation is needed:* at 390×844 the unreserved rule gives a 374×748 field, leaving only `2 × FIELD_V_GAP = 96 px` of vertical room — not enough for the menu (title + three items + link), so the page would scroll vertically and break the `responsive-layout` "Interface stays reachable without scrolling" requirement. Reserving the band gives a 275×550 field plus a ~198 px interface band: 844 px total, no scroll.
*Alternative:* keep the field filling the width and let the interface scroll below the fold — rejected, it violates "Interface stays reachable without scrolling".
*Alternative:* shrink interface type until it fits the 96 px band — rejected, it breaks "Interface stays legible at small viewports".

**D7 — Score readout updates text content, not layout.**
The score element's text is assigned on the render path; its box is CSS-sized so a growing digit count never reflows the page.

**D8 — Verification scripts become DOM assertions.**
`scripts/verify-menu-geometry.mjs` and `scripts/verify-github-icon.mjs` currently tap logical canvas coordinates and will not adapt; they are rewritten to assert on the DOM (element present, link href, hit area implied by the element box). `scripts/controller-stubs.mjs` `makeCanvas()` gains the DOM stubs the headless harness needs.

## Risks / Trade-offs

- **Keyboard double-activation** when menu items become focusable → D4: `tabindex="-1"` on menu items, keyboard nav stays in `onKey`.
- **Tab order changes** — the GitHub link becomes a real focusable anchor → acceptable and a net a11y improvement; must not be added to the gamepad/keyboard menu cycle (the `start-menu` requirement already says it is excluded).
- **Gestures on the interface are no longer steering** — `touch-action: none` and `setPointerCapture` are canvas-scoped → intended by the `mobile-input` delta; document it in the help view copy if it reads as a regression.
- **Mobile HUD has little room** — at 390 px wide the board leaves ~8 px of side margin → D5's breakpoint puts the HUD above the field inside the `FIELD_V_GAP` band (~75 displayed px), which fits one score line; a second line there is a real constraint, not a CSS detail.
- **Headless harness surface grows** — the DOM stubs in `scripts/controller-stubs.mjs` and the harness must cover the new elements → D8; expect the geometry scripts to be rewritten, not tweaked.
- **Two rendering paths to keep honest** — canvas field plus DOM interface → D3's single `game.state` authority is the mitigation.

## Migration Plan

1. Land the DOM structure and CSS in `snaketris.html` first, with the canvas still drawing everything — the page works at every step.
2. Move one surface at a time (score → game-over message → menu → records → help → GitHub link), deleting each canvas path as its DOM equivalent goes live, so no surface is ever rendered twice.
3. Retire the layout constants and the non-playing pointer branches in `input.js` only after every surface that used them has moved.
4. Rewrite the verification scripts last, once the DOM shape is final.
Rollback: the canvas overlay path is in git history; reverting the change restores a single-surface page with no DOM interface.

## Open Questions

- Exact CSS breakpoint value where the HUD moves from beside the field to above it — a styling detail, answerable when the layout lands; the `responsive-layout` scenarios hold either way.
- Whether the records list is markup as `<ol>` or a `<table>` — a markup choice that changes no requirement.

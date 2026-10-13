# Proposal: two-player-device-ownership

## Why

Two-player mode has two unresolved device problems.

First, both players may lock the `gamepad` model at the same time. `js/devices.js`
polls only the first connected pad, so a second pad is never read. Both players
therefore fight over one physical pad.

Second, the two-player menu item is hidden by CSS at narrow viewports
(`js/ui.js` sets `display: none` at `window.innerWidth <= UI_STACK_MAX_WIDTH`),
but keyboard navigation still reaches it. `js/screens.js` `stepCursor` walks the
item list without checking visibility. A phone or a narrow desktop window can
therefore enter a mode it cannot play.

## What Changes

- Each player owns a distinct physical gamepad. Locking `gamepad` records the pad
  the player pressed on. A second player cannot lock the same pad.
- `js/devices.js` polls every connected pad and routes each pad to its owner.
- Two-player mode is offered only when the layout is not stacked. The menu cursor
  skips the hidden item, so it is unreachable by keyboard.
- Dead code is removed: the tracked `benchmark.mjs` file and six unused imports in
  `js/ui.js`.

## Impact

- Modules touched: `js/devices.js`, `js/screens.js`, `js/state.js`, `js/ui.js`.
- Tests: `tests/devices.test.js`, `tests/screens.test.js`; harness
  `scripts/verify-control-model.mjs`, `scripts/verify-p2-constraint.mjs`.
- Spec: `openspec/specs/two-player-local-mode/spec.md` gains two requirements and
  one requirement changes.

## User Decisions

The user stated both rules directly: "there is no two players game on mobile" and
"players must use different gamepads. each use his owne".

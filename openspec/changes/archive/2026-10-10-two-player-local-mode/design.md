# Design

## Context

The game is a single-page HTML5 snake/tetris duel on one 10x20 grid. Today it is one human plus one bot; input flows through js/devices.js (raw adapters to normalized intent) into js/input.js handleIntent (a single FLOW); the menu and role flow live in js/ui.js syncViews; highscores recordScore(score, role) keeps a top-10. See proposal.md for motivation - this covers how only.

## Goals / Non-Goals

**Goals:** add a local two-player mode on the SAME grid: P1 picks a role (P2 auto-gets the other), each player confirms a control model by pressing that model's key, and two gamepads are routed to their players by connection order; gate the "Two Players" menu item by viewport width; record both sides' scores.

**Non-Goals:** no second board or screen, no networked play, no new persistent storage (reuse the existing highscores), no new input framework.

## Decisions

- **Two roles / no bot on one grid.** Reuse the single `game` object: add p1Role/p2Role and a mode flag; when the mode is two-player, botSystem becomes a no-op because both sides are human. *Alternative considered:* run two separate game objects (two boards) - rejected because the confirmed design is one shared grid/screen.
- **Per-pad edge-detection state.** Track per-pad prevButtons/prevStickDir keyed by pad id and route each pad to P1/P2 by connection order; clear a pad's state on disconnect. *Alternative considered:* merge pads into one input stream - rejected (loses per-player routing).
- **Control-model confirmation by pressed key.** Map physical keys to models: a WASD key press confirms WASD, an arrow key press confirms Arrows, and a gamepad button press confirms Gamepad; the second player's keyboard options are constrained by the first player's choice. *Alternative considered:* confirm only via Enter/Space - rejected (the confirmed mechanism is pressing the model's own key).
- **Menu item gated by viewport width.** Show "Two Players" when window.innerWidth exceeds UI_STACK_MAX_WIDTH (760); hide it at or below that width. Reuses the existing responsive breakpoint constant; no new threshold. *Alternative considered:* gate by connected gamepads - rejected per confirmed decision (viewport width is the gate).
- **Both-sides recording.** Call recordScore twice at game over (once per side), reusing loadBoard/saveBoard and the top-10 sort. *Alternative considered:* a separate two-player board - rejected (the confirmed choice records both sides on the shared top-10).

## Risks / Trade-offs

- [Highscore top-10 overwhelmed by two entries per two-player game] -> Mitigation: accepted per the confirmed decision; each finished two-player game adds two entries to the shared top-10.
- [Two pads may not both be connected when a two-player game starts] -> Mitigation: if fewer than two pads are connected, the second player falls back to a keyboard model (WASD or Arrows), so the game can still start.
- [Per-pad state leaks across pads when one disconnects] -> Mitigation: clear a pad's edge-detection state on disconnect and route only among currently connected pads.

## Migration Plan

No migration is required - this is a new mode and the existing single-player flow is unchanged. Rollback: hide the "Two Players" item via the viewport gate (narrow viewports never show it).

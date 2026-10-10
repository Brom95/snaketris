# Proposal

## Why

Players cannot see who is choosing a control layout, what they chose, or how to change their selection. The current SELECT_CONTROL screen shows identical text for both players with no feedback after pressing a key, making the two-player flow confusing and unrecoverable.

## What Changes

- Control confirmation screen shows each player's current selection (layout name + checkmark)
- Players can see who is choosing next (highlighted item or indicator)
- Each player can undo/change their choice via a "Change" button
- Error message displays when P2 tries to pick the same layout as P1, but does not lock P2 out
- Start button remains hidden until both confirm without conflict

## Capabilities

### Modified Capabilities

- `two-player-local-mode`: requirement "Control model confirmed by pressed key" — adds visual feedback (shows selected layout), undo mechanism ("Change" button per player), and clearer selection order display

## Impact

- `js/ui.js` — syncViews() updates control items with selection status
- `js/state.js` — may add fields to track individual confirmation state per player
- `snaketris.html` — control-view items updated with selection indicators and change buttons
- No new spec capability needed; modifies existing two-player-local-mode requirement

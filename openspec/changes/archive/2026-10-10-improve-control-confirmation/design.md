# Design

The SELECT_CONTROL screen updates to show each player's current selection with a checkmark, indicate which player is choosing next, allow undo via "Change" buttons, and display an error message on conflict.

## UI Layout

Each player item in the control list shows:
- The layout name (e.g. "WASD", "Arrows", "Gamepad") when confirmed, with a checkmark
- When not confirmed, the prompt text ("press W/A/S/D or arrows to confirm")
- A "Change" button per player that clears their confirmation

The Start item remains hidden until both players have confirmed without conflict. An error message area below the list shows the conflict message when P2 tries to pick the same keyboard layout as P1.

## State Fields

Add to `game` state:
- `p1Confirmed: boolean` — true when P1 has confirmed a model
- `p2Confirmed: boolean` — true when P2 has confirmed a model
- `controlError: string` — error message text (empty or set)

These fields track per-player confirmation so the UI can render each player's status independently.

## Input Routing

In `onKey()` during SELECT_CONTROL:
- If P1 not confirmed, WASD/arrows keys confirm P1's model
- Else if P2 not confirmed, keys confirm P2's model (with conflict check)
- When both confirmed, keys fall through to navigation (Start/Back)

The "Change" button is handled by `confirmSelection()`: clicking it clears the player's confirmation and resets the flow to let them re-confirm.

## UI Sync

In `syncViews()` during SELECT_CONTROL:
- Update each player item text to show their confirmed layout + checkmark, or the prompt if not confirmed
- Show the error message element when `game.controlError` is set
- Show the Start button only when `game.controlConfirmed` is true (both confirmed without conflict)
- Clear the error text and hide Start when leaving SELECT_CONTROL

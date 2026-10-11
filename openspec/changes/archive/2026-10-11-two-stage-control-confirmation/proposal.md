# Proposal

## Why

The current SELECT_CONTROL screen treats a key press as an immediate confirmation — pressing WASD instantly locks P1's model, leaving no room to change the choice or to distinguish "I picked this" from "I confirm this". The user wants selection and confirmation to be separate stages so that a player can try a different layout before locking it in.

## What Changes

- **Selection stage (new):** pressing any layout key (WASD, arrows, gamepad button) selects that layout for the player who has not yet chosen. If a different layout is pressed before confirmation, the new selection replaces the previous one.
- **Confirmation stage (new):** an explicit confirm action (Space / Enter / click on Start item / A on gamepad) locks the selection for that player. The Start button becomes active only after both players have confirmed.
- **Back navigation:** Back from SELECT_CONTROL returns to SELECT_ROLE (previous stage), not straight to MENU.

## Capabilities

### Modified Capabilities

- `two-player-local-mode`: The "Control model confirmed by pressed key" requirement changes — selection and confirmation are now separate stages, any layout key triggers selection, and a different layout replaces the previous choice before confirmation. The "Keyboard models exclusive and gamepad shareable" requirement is unchanged in spirit (keyboard layouts remain exclusive, gamepad remains shareable) but the mechanism shifts from immediate-confirm to select-then-confirm.

## Impact

- `js/state.js` — new selection/confirmation fields, `confirmControlModel` splits into select + confirm
- `js/input.js` — `onKey()` routing changes: layout keys select, Space/Enter confirms
- `snaketris.html` — control-view item text updates ("press W/A/S/D or arrows to confirm" → "select a layout")
- `js/ui.js` — `syncViews()` shows selection state per player (layout name + checkmark)

# Spec Delta

## MODIFIED Requirements

### Requirement: Control model confirmed by pressed key
The system SHALL let each player confirm their control model (WASD, Arrows, or Gamepad) by pressing that model's key. The system SHALL show each player's current selection with a checkmark and layout name, indicate which player is choosing next, allow each player to undo/change their choice via a "Change" button, display an error message when P2 tries to pick the same keyboard layout as P1 without locking P2 out, and keep the Start button hidden until both players confirm without conflict.

#### Scenario: Confirm with the model's key
- **WHEN** P1 selects WASD
- **THEN** pressing a WASD key confirms P1's model and the flow moves to P2's confirmation

#### Scenario: Visual feedback shows selected layout
- **WHEN** a player confirms their control model
- **THEN** the player's item shows a checkmark and the layout name (e.g. "P1: WASD ✓")

#### Scenario: Who is choosing next is indicated
- **WHEN** P1 has confirmed but P2 has not
- **THEN** the screen highlights or indicates that P2 is choosing next

#### Scenario: Player can change their choice
- **WHEN** a player presses the "Change" button for their item
- **THEN** the player's confirmation is cleared and they can press a key again to re-confirm

#### Scenario: Error when P2 picks same layout as P1
- **WHEN** P2 presses a key that matches P1's selected keyboard layout
- **THEN** an error message displays "P2: cannot use the same layout as P1" and P2 has not confirmed

#### Scenario: Start button hidden until both confirm
- **WHEN** only one player has confirmed
- **THEN** the Start button is not shown on the screen

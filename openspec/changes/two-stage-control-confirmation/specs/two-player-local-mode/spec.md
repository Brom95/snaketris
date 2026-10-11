# Spec Delta

## MODIFIED Requirements

### Requirement: Control model confirmed by pressed key
The system SHALL let each player select a control model (WASD, Arrows, or Gamepad) by pressing that model's key. Selection and confirmation are separate stages: pressing a layout key selects that layout for the player who has not yet chosen; an explicit confirm action (Space, Enter, click on Start, or A on gamepad) locks the selection. If a different layout is pressed before confirmation, it replaces the previous selection. The system SHALL show each player's current selection with a checkmark and layout name, indicate which player is choosing next, display an error message when P2 tries to pick the same keyboard layout as P1 without locking P2 out, and keep the Start button hidden until both players confirm without conflict.

#### Scenario: Select with any layout key
- **WHEN** a player presses WASD, arrows, or a gamepad button
- **THEN** that layout is selected for the player who has not yet chosen

#### Scenario: Confirmation locks the selection
- **WHEN** a player presses Space, Enter, clicks Start, or presses A on gamepad
- **THEN** the player's selection is locked and the flow moves to the next player

#### Scenario: Different layout replaces previous selection
- **WHEN** a player presses a key from a different layout before confirming
- **THEN** the new selection replaces the previous one

#### Scenario: Visual feedback shows selected layout
- **WHEN** a player selects or confirms their control model
- **THEN** the player's item shows a checkmark and the layout name (e.g. "P1: WASD ✓")

#### Scenario: Who is choosing next is indicated
- **WHEN** P1 has confirmed but P2 has not
- **THEN** the screen highlights or indicates that P2 is choosing next

#### Scenario: Error when P2 picks same layout as P1
- **WHEN** P2 selects a keyboard layout that matches P1's selected layout
- **THEN** an error message displays "P2: cannot use the same layout as P1" and P2 has not confirmed

#### Scenario: Start button hidden until both confirm
- **WHEN** only one player has confirmed
- **THEN** the Start button is not shown on the screen

### Requirement: Keyboard models exclusive and gamepad shareable
The system SHALL NOT allow two players to pick the same keyboard model (WASD or Arrows), and SHALL allow both players to use gamepad.

#### Scenario: Second player cannot reuse a keyboard model
- **WHEN** P1 selects WASD
- **THEN** P2's selection offers only Arrows or Gamepad

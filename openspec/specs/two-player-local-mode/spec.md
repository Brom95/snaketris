# two-player-local-mode Specification

## Purpose
A local two-player mode in which two humans share the one 10x20 grid: P1 picks a role and P2 automatically gets the other, each player confirms a control model by pressing that model's key, and no bot drives either side.

## Requirements

### Requirement: Two players share one grid
The system SHALL run both sides as human in two-player mode on the single 10x20 grid, and SHALL NOT run the bot because both sides are human.

#### Scenario: Bot is not run in two-player mode
- **WHEN** a two-player game starts
- **THEN** no bot drives the snake or the falling piece

### Requirement: P1 picks a role and P2 auto-gets the other
The system SHALL let P1 choose a role on the role screen and SHALL automatically assign P2 the other role without a separate P2 role screen.

#### Scenario: P2 gets the remaining role
- **WHEN** P1 selects Snake
- **THEN** P2 is assigned Tetris

### Requirement: Role line shown above model selection
The system SHALL show a line "P1: X / P2: Y" above the control-model selection naming each player's role.

#### Scenario: Line names both roles
- **WHEN** P1 is Snake and P2 is Tetris
- **THEN** the line reads "P1: Snake / P2: Tetris" above the model selection

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

### Requirement: Keyboard models exclusive and gamepad shareable
The system SHALL NOT allow two players to pick the same keyboard model (WASD or Arrows), and SHALL allow both players to use gamepad.

#### Scenario: Second player cannot reuse a keyboard model
- **WHEN** P1 selects WASD
- **THEN** P2's selection offers only Arrows or Gamepad

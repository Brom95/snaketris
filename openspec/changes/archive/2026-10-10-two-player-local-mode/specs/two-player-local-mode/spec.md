# Spec Delta

## Purpose

A local two-player mode in which two humans share the one 10x20 grid: P1 picks a role and P2 automatically gets the other, each player confirms a control model by pressing that model's key, and no bot drives either side.

## ADDED Requirements

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
The system SHALL let each player confirm their control model (WASD, Arrows, or Gamepad) by pressing that model's key.

#### Scenario: Confirm with the model's key
- **WHEN** P1 selects WASD
- **THEN** pressing a WASD key confirms P1's model and the flow moves to P2's confirmation

### Requirement: Keyboard models exclusive and gamepad shareable
The system SHALL NOT allow two players to pick the same keyboard model (WASD or Arrows), and SHALL allow both players to use gamepad.

#### Scenario: Second player cannot reuse a keyboard model
- **WHEN** P1 selects WASD
- **THEN** P2's selection offers only Arrows or Gamepad

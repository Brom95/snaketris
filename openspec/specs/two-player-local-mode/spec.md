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

#### Scenario: Confirm with the model's key
- **WHEN** P1 selects WASD
- **THEN** pressing a WASD key confirms P1's model and the flow moves to P2's confirmation

#### Scenario: Player can change their choice
- **WHEN** a player presses the "Change" button for their item
- **THEN** the player's confirmation is cleared and they can press a key again to re-confirm

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

### Requirement: One item per display in SELECT_CONTROL
The system SHALL show exactly one selectable item at a time in SELECT_CONTROL. The item occupies the full width of the menu area with large, centered text. When the user acts on the current item, the next item appears; no more than one selectable choice is shown per screen display.

#### Scenario: Only one item visible
- **WHEN** any step in SELECT_CONTROL is shown
- **THEN** exactly one item is on screen and all other items are hidden

#### Scenario: Item replaces the full menu area
- **WHEN** a step is shown
- **THEN** the item text is large, centered, and occupies the full width of the menu area

### Requirement: Per-player screens
The system SHALL present the confirmation flow in separate per-player screens: P1 has their own screen, P2 has their own screen. Each player sees only their own prompt on their own screen.

#### Scenario: P1 screen shows only P1's prompt
- **WHEN** the P1 step is shown
- **THEN** only P1's selection/confirm prompt is on screen and P2's prompt is hidden

#### Scenario: P2 screen shows only P2's prompt
- **WHEN** the P2 step is shown
- **THEN** only P2's selection/confirm prompt is on screen and P1's prompt is hidden

### Requirement: One key press confirms
The system SHALL confirm a player's layout with a single key press (no two-step select→confirm). Pressing any of the layout keys immediately locks that player's choice.

#### Scenario: Single key press confirms P1
- **WHEN** P1 presses any layout key on their screen
- **THEN** P1's layout is confirmed immediately (no separate confirm step)

### Requirement: Reset control after confirm
The system SHALL show a small reset control (with an emoji marker) in the status row, visible only after a player has confirmed. Pressing it clears that player's selection so they can pick again.

#### Scenario: Reset appears after confirm
- **WHEN** a player has confirmed their layout
- **THEN** the small reset control is visible in the status row for that player

### Requirement: Back navigation
The system SHALL provide a Back control on every screen to return to the previous step (bidirectional navigation).

#### Scenario: Back returns to previous step
- **WHEN** the user presses Back on any confirmation screen
- **THEN** the flow returns to the previous step

### Requirement: Merged SHARED after P2
The system SHALL show a merged SHARED screen after P2 confirms. The SHARED screen shows BOTH assigned layouts together with a Start button.

#### Scenario: SHARED shows both assignments
- **WHEN** P2 has confirmed
- **THEN** the SHARED screen shows both assigned layouts and a Start button

### Requirement: Game-over returns to SHARED
The system SHALL return players to the SHARED screen (not the main menu) after a game ends.

#### Scenario: Game-over goes to SHARED
- **WHEN** a game ends
- **THEN** the flow returns to the SHARED screen, not the main menu

### Requirement: Explicit key hints per step
The system SHALL display, below each item, a line of explicit key hints showing which keys unlock that step. The hints use keyboard glyph names (W, A, S, D, ↑ ↓ ← →, Enter, Space, Esc) and are shown in a smaller font than the item text.

#### Scenario: P1 select step shows WASD hint
- **WHEN** the P1 selection step is shown
- **THEN** the key hints show "W / A / S / D" as the keys to press for that step

#### Scenario: Confirm step shows Enter hint
- **WHEN** a confirmation step is shown
- **THEN** the key hints show "Enter / Space" as the keys to confirm

### Requirement: Emoji markers on items
The system SHALL prefix each SELECT_CONTROL item with an emoji identifying the player and layout type. P1 uses 🎮, P2 uses 🕹, keyboard-WASD uses ⌨️, keyboard-Arrows uses ⬆⬇⬅⬆, gamepad uses 🎯.

#### Scenario: P1 item shows emoji
- **WHEN** the P1 selection step is shown
- **THEN** the item text begins with the 🎮 marker

### Requirement: Sequential step order
The system SHALL present SELECT_CONTROL steps in this order: (1) P1 screen, (2) P2 screen, (3) SHARED. Each step appears only after the previous step's action is complete.

#### Scenario: Steps appear in order
- **WHEN** P1 has confirmed but P2 has not
- **THEN** the P2 screen is shown and the SHARED screen is hidden
